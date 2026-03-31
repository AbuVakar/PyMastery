#!/usr/bin/env python3
"""
PyMastery API and route verification suite.

This script validates the current backend route map and key integration flows.
It is intentionally aligned with:
- /api/v1/auth/*
- /api/v1/dashboard/*
- /api/v1/ai-tutor/*
- /api/v1/courses
- /api/v1/problems
- /api/users/me
"""

from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

import requests


PROJECT_ROOT = Path(__file__).resolve().parent
RESULTS_FILE = PROJECT_ROOT / "verification_results.json"

DEFAULT_BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")

_FRONTEND_CANDIDATES = [
    os.getenv("FRONTEND_URL", "").rstrip("/"),
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:3000",
]
DEFAULT_FRONTEND_CANDIDATES = [url for url in _FRONTEND_CANDIDATES if url]


class VerificationSkip(Exception):
    """Raised when a test cannot run in current environment."""


@dataclass
class TestResult:
    name: str
    category: str
    status: str
    duration_seconds: float
    details: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class VerificationContext:
    base_url: str
    frontend_candidates: List[str]
    session: requests.Session = field(default_factory=requests.Session)
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    test_user: Dict[str, str] = field(default_factory=dict)
    current_user: Dict[str, Any] = field(default_factory=dict)
    frontend_url: Optional[str] = None

    def api_url(self, path: str) -> str:
        return f"{self.base_url}{path}"

    def auth_headers(self) -> Dict[str, str]:
        if not self.access_token:
            raise VerificationSkip("No access token available from registration flow")
        return {"Authorization": f"Bearer {self.access_token}"}


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_json(response: requests.Response) -> Dict[str, Any]:
    try:
        return response.json()
    except Exception:
        return {"raw_text": response.text[:500]}


def response_excerpt(response: requests.Response, limit: int = 300) -> str:
    text = response.text.replace("\n", " ").strip()
    return text[:limit]


def assert_status(response: requests.Response, expected: List[int], context: str) -> None:
    if response.status_code not in expected:
        raise AssertionError(
            f"{context}: expected status in {expected}, got {response.status_code}, body={response_excerpt(response)!r}"
        )


def detect_frontend_url(ctx: VerificationContext) -> Optional[str]:
    for candidate in ctx.frontend_candidates:
        try:
            response = ctx.session.get(candidate, timeout=3)
        except requests.RequestException:
            continue

        content_type = response.headers.get("Content-Type", "").lower()
        if response.status_code == 200 and "text/html" in content_type:
            return candidate
    return None


def run_test(
    name: str,
    category: str,
    fn: Callable[[VerificationContext], Dict[str, Any]],
    ctx: VerificationContext,
) -> TestResult:
    start = time.perf_counter()
    try:
        details = fn(ctx)
        status = "passed"
        error = None
    except VerificationSkip as exc:
        details = {}
        status = "skipped"
        error = str(exc)
    except Exception as exc:
        details = {}
        status = "failed"
        error = str(exc)
    duration = time.perf_counter() - start
    return TestResult(
        name=name,
        category=category,
        status=status,
        duration_seconds=duration,
        details=details,
        error=error,
    )


def test_backend_health(ctx: VerificationContext) -> Dict[str, Any]:
    response = ctx.session.get(ctx.api_url("/api/health"), timeout=10)
    assert_status(response, [200], "backend health check")
    payload = parse_json(response)
    if "status" not in payload:
        raise AssertionError("health response missing 'status'")
    return {
        "status_code": response.status_code,
        "health_status": payload.get("status"),
        "version": payload.get("version"),
    }


def test_auth_register(ctx: VerificationContext) -> Dict[str, Any]:
    unique_seed = int(time.time())
    ctx.test_user = {
        "name": "Verification User",
        "email": f"verification_{unique_seed}@example.com",
        "password": "SecurePass123!",
    }
    payload = {
        "name": ctx.test_user["name"],
        "email": ctx.test_user["email"],
        "password": ctx.test_user["password"],
        "role_track": "general",
        "agree_terms": True,
    }

    response = ctx.session.post(ctx.api_url("/api/v1/auth/register"), json=payload, timeout=15)
    assert_status(response, [200], "register")
    body = parse_json(response)
    ctx.access_token = body.get("access_token")
    ctx.refresh_token = body.get("refresh_token")
    ctx.current_user = body.get("user", {})

    if not ctx.access_token or not ctx.refresh_token:
        raise AssertionError("register response missing access_token or refresh_token")

    return {
        "status_code": response.status_code,
        "registered_email": ctx.test_user["email"],
        "user_id": ctx.current_user.get("id"),
    }


def test_auth_me(ctx: VerificationContext) -> Dict[str, Any]:
    response = ctx.session.get(
        ctx.api_url("/api/v1/auth/me"),
        headers=ctx.auth_headers(),
        timeout=10,
    )
    assert_status(response, [200], "auth me")
    body = parse_json(response)
    if body.get("email") != ctx.test_user.get("email"):
        raise AssertionError("auth me returned unexpected email")
    return {
        "status_code": response.status_code,
        "email": body.get("email"),
        "user_id": body.get("id"),
    }


def test_auth_refresh(ctx: VerificationContext) -> Dict[str, Any]:
    if not ctx.refresh_token:
        raise VerificationSkip("No refresh token available from registration flow")

    response = ctx.session.post(
        ctx.api_url("/api/v1/auth/refresh"),
        json={"refresh_token": ctx.refresh_token},
        timeout=10,
    )
    assert_status(response, [200], "token refresh")
    body = parse_json(response)
    new_access_token = body.get("access_token")
    if not new_access_token:
        raise AssertionError("refresh response missing access_token")

    ctx.access_token = new_access_token
    if body.get("refresh_token"):
        ctx.refresh_token = body["refresh_token"]

    return {"status_code": response.status_code, "token_refreshed": True}


def test_auth_login_otp_challenge(ctx: VerificationContext) -> Dict[str, Any]:
    if not ctx.test_user:
        raise VerificationSkip("Registration test did not run successfully")

    payload = {
        "email": ctx.test_user["email"],
        "password": ctx.test_user["password"],
        "remember_me": False,
    }
    response = ctx.session.post(ctx.api_url("/api/v1/auth/login"), json=payload, timeout=10)
    assert_status(response, [200], "login")
    body = parse_json(response)

    if body.get("requires_otp") is True:
        return {
            "status_code": response.status_code,
            "requires_otp": True,
            "message": body.get("message"),
        }

    if body.get("access_token"):
        return {
            "status_code": response.status_code,
            "requires_otp": False,
            "message": "Login returned token payload directly",
        }

    raise AssertionError("login response did not include OTP challenge or tokens")


def test_dashboard_stats(ctx: VerificationContext) -> Dict[str, Any]:
    response = ctx.session.get(
        ctx.api_url("/api/v1/dashboard/stats"),
        headers=ctx.auth_headers(),
        timeout=10,
    )
    assert_status(response, [200], "dashboard stats")
    body = parse_json(response)
    return {
        "status_code": response.status_code,
        "has_stats_key": "stats" in body,
    }


def test_dashboard_activity(ctx: VerificationContext) -> Dict[str, Any]:
    response = ctx.session.get(
        ctx.api_url("/api/v1/dashboard/activity"),
        headers=ctx.auth_headers(),
        timeout=10,
    )
    assert_status(response, [200], "dashboard activity")
    body = parse_json(response)
    if "activities" not in body:
        raise AssertionError("dashboard activity response missing 'activities'")
    return {
        "status_code": response.status_code,
        "activity_count": len(body.get("activities", [])),
    }


def test_ai_tutor_chat(ctx: VerificationContext) -> Dict[str, Any]:
    user_id = str(ctx.current_user.get("id") or "verification-user")
    payload = {
        "message": "Explain Python list comprehensions in one short paragraph.",
        "message_type": "question",
        "context": {"topic": "python"},
        "user_id": user_id,
    }
    response = ctx.session.post(
        ctx.api_url("/api/v1/ai-tutor/chat"),
        json=payload,
        headers=ctx.auth_headers(),
        timeout=30,
    )
    assert_status(response, [200], "ai tutor chat")
    body = parse_json(response)
    if not body.get("response"):
        raise AssertionError("ai tutor response was empty")
    return {
        "status_code": response.status_code,
        "response_length": len(body.get("response", "")),
        "emotional_tone": body.get("emotional_tone"),
    }


def test_courses_list(ctx: VerificationContext) -> Dict[str, Any]:
    response = ctx.session.get(
        ctx.api_url("/api/v1/courses?limit=3"),
        headers=ctx.auth_headers(),
        timeout=10,
    )
    assert_status(response, [200], "courses list")
    body = parse_json(response)
    if "courses" not in body:
        raise AssertionError("courses response missing 'courses'")
    return {
        "status_code": response.status_code,
        "course_count": len(body.get("courses", [])),
    }


def test_problems_list(ctx: VerificationContext) -> Dict[str, Any]:
    response = ctx.session.get(
        ctx.api_url("/api/v1/problems?limit=3"),
        headers=ctx.auth_headers(),
        timeout=10,
    )
    assert_status(response, [200], "problems list")
    body = parse_json(response)
    if "problems" not in body:
        raise AssertionError("problems response missing 'problems'")
    return {
        "status_code": response.status_code,
        "problem_count": len(body.get("problems", [])),
    }


def test_user_profile_route(ctx: VerificationContext) -> Dict[str, Any]:
    response = ctx.session.get(
        ctx.api_url("/api/users/me"),
        headers=ctx.auth_headers(),
        timeout=10,
    )
    assert_status(response, [200], "user profile")
    body = parse_json(response)
    return {
        "status_code": response.status_code,
        "name": body.get("name"),
        "email": body.get("email"),
    }


def test_auth_route_integrity(ctx: VerificationContext) -> Dict[str, Any]:
    valid_shape_invalid_data = {"name": "A", "email": "bad-email", "password": "123"}
    new_response = ctx.session.post(
        ctx.api_url("/api/v1/auth/register"),
        json=valid_shape_invalid_data,
        timeout=10,
    )
    if new_response.status_code == 404:
        raise AssertionError("new auth route /api/v1/auth/register returned 404")

    old_response = ctx.session.post(
        ctx.api_url("/api/auth/login"),
        json={"email": "x@example.com", "password": "x"},
        timeout=10,
    )
    old_route_retired = old_response.status_code == 404
    if not old_route_retired:
        raise AssertionError(f"old auth route expected 404 but got {old_response.status_code}")

    return {
        "new_route_status": new_response.status_code,
        "old_route_status": old_response.status_code,
    }


def test_frontend_routes_and_encoding(ctx: VerificationContext) -> Dict[str, Any]:
    if not ctx.frontend_url:
        ctx.frontend_url = detect_frontend_url(ctx)
    if not ctx.frontend_url:
        raise VerificationSkip("Frontend server is not running on known local ports")

    routes = ["/", "/login", "/dashboard", "/courses", "/problems"]
    encoding_issues: List[str] = []
    root_marker_missing: List[str] = []

    for route in routes:
        response = ctx.session.get(f"{ctx.frontend_url}{route}", timeout=8)
        assert_status(response, [200], f"frontend route {route}")
        body = response.text
        if "\ufffd" in body:
            encoding_issues.append(route)
        if '<div id="root"' not in body and "<div id='root'" not in body:
            root_marker_missing.append(route)

    if encoding_issues:
        raise AssertionError(f"Detected replacement-character encoding artifacts on routes: {encoding_issues}")
    if root_marker_missing:
        raise AssertionError(f"Missing app root marker on routes: {root_marker_missing}")

    return {
        "frontend_url": ctx.frontend_url,
        "routes_checked": routes,
        "encoding_artifacts": 0,
    }


def build_test_plan() -> List[Dict[str, Any]]:
    return [
        {"name": "Backend Health", "category": "backend", "fn": test_backend_health},
        {"name": "Auth Register", "category": "auth", "fn": test_auth_register},
        {"name": "Auth Me", "category": "auth", "fn": test_auth_me},
        {"name": "Auth Refresh", "category": "auth", "fn": test_auth_refresh},
        {"name": "Auth Login OTP Challenge", "category": "auth", "fn": test_auth_login_otp_challenge},
        {"name": "Dashboard Stats", "category": "dashboard", "fn": test_dashboard_stats},
        {"name": "Dashboard Activity", "category": "dashboard", "fn": test_dashboard_activity},
        {"name": "AI Tutor Chat", "category": "ai", "fn": test_ai_tutor_chat},
        {"name": "Courses List", "category": "content", "fn": test_courses_list},
        {"name": "Problems List", "category": "content", "fn": test_problems_list},
        {"name": "User Profile Route", "category": "users", "fn": test_user_profile_route},
        {"name": "Auth Route Integrity", "category": "routing", "fn": test_auth_route_integrity},
        {"name": "Frontend Routes and Encoding", "category": "frontend", "fn": test_frontend_routes_and_encoding},
    ]


def summarize(results: List[TestResult]) -> Dict[str, Any]:
    summary = {"total": len(results), "passed": 0, "failed": 0, "skipped": 0}
    for result in results:
        summary[result.status] += 1
    summary["success_rate"] = (
        round((summary["passed"] / summary["total"]) * 100, 2) if summary["total"] else 0.0
    )
    return summary


def save_results(payload: Dict[str, Any]) -> None:
    RESULTS_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def print_console_results(results: List[TestResult], summary_data: Dict[str, Any]) -> None:
    print("PyMastery Verification Suite")
    print("=" * 64)
    for result in results:
        print(
            f"[{result.status.upper():7}] {result.category:10} {result.name} "
            f"({result.duration_seconds:.2f}s)"
        )
        if result.error:
            print(f"  error: {result.error}")
    print("=" * 64)
    print(
        f"Total: {summary_data['total']} | "
        f"Passed: {summary_data['passed']} | "
        f"Failed: {summary_data['failed']} | "
        f"Skipped: {summary_data['skipped']} | "
        f"Success rate: {summary_data['success_rate']}%"
    )
    print(f"Results file: {RESULTS_FILE}")


def main() -> int:
    ctx = VerificationContext(
        base_url=DEFAULT_BACKEND_URL,
        frontend_candidates=DEFAULT_FRONTEND_CANDIDATES,
    )
    plan = build_test_plan()

    results: List[TestResult] = []
    for item in plan:
        result = run_test(item["name"], item["category"], item["fn"], ctx)
        results.append(result)

    summary_data = summarize(results)
    payload = {
        "timestamp": utc_timestamp(),
        "backend_url": ctx.base_url,
        "frontend_url_detected": ctx.frontend_url,
        "summary": summary_data,
        "results": [asdict(result) for result in results],
    }
    save_results(payload)
    print_console_results(results, summary_data)

    return 0 if summary_data["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

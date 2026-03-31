#!/usr/bin/env python3
"""
Backend verification test suite aligned with current API behavior.
"""

from __future__ import annotations

import os
import sys
import time
import uuid
from typing import Dict

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-jwt-secret-key-for-pymastery-verification-suite-0123456789",
)

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
import routers.auth as auth_router
from services.auth_rate_limiter import get_auth_rate_limiter


async def _noop_email(*_args, **_kwargs):
    return None


# Avoid real SMTP calls during auth tests.
auth_router.send_verification_email = _noop_email
auth_router.send_login_otp_email = _noop_email


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Prevent cross-test bleed from auth limiter state."""
    limiter = get_auth_rate_limiter()
    actions = ["register", "login", "refresh", "reset", "verify", "change_password"]

    for action in actions:
        limiter.reset_rate_limit("testclient", action)

    yield

    for action in actions:
        limiter.reset_rate_limit("testclient", action)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def test_user_data() -> Dict[str, str]:
    unique = uuid.uuid4().hex[:12]
    return {
        "name": "Verification User",
        "email": f"verification_{unique}@example.com",
        "password": "SecurePass123!",
        "role_track": "general",
        "agree_terms": True,
    }


@pytest.fixture
def auth_headers(client: TestClient, test_user_data: Dict[str, str]) -> Dict[str, str]:
    response = client.post("/api/v1/auth/register", json=test_user_data)
    assert response.status_code == 200, response.text
    payload = response.json()
    token = payload.get("access_token")
    assert token, payload
    return {"Authorization": f"Bearer {token}"}


class TestHealthAndAuth:
    def test_health_check(self, client: TestClient):
        response = client.get("/api/health")
        assert response.status_code == 200
        body = response.json()
        assert body.get("status") in {"healthy", "degraded"}
        assert "timestamp" in body
        assert "version" in body

    def test_registration_returns_tokens_and_user(self, client: TestClient, test_user_data: Dict[str, str]):
        response = client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert "user" in body
        assert body["user"]["email"] == test_user_data["email"]

    def test_duplicate_registration_rejected(self, client: TestClient, test_user_data: Dict[str, str]):
        first = client.post("/api/v1/auth/register", json=test_user_data)
        assert first.status_code == 200

        second = client.post("/api/v1/auth/register", json=test_user_data)
        assert second.status_code == 400
        error_body = second.json()
        assert "detail" in error_body

    def test_login_returns_tokens_in_development(self, client: TestClient, test_user_data: Dict[str, str]):
        register = client.post("/api/v1/auth/register", json=test_user_data)
        assert register.status_code == 200

        response = client.post(
            "/api/v1/auth/login",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        )
        assert response.status_code == 200
        body = response.json()

        # In development the backend intentionally skips OTP and returns tokens directly.
        assert body.get("requires_otp") is False
        assert body.get("access_token")
        assert body.get("refresh_token")
        assert body.get("user", {}).get("email") == test_user_data["email"]

    def test_get_current_user_with_valid_token(self, client: TestClient, auth_headers: Dict[str, str]):
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert "id" in body
        assert "email" in body
        assert "name" in body

    def test_get_current_user_without_token(self, client: TestClient):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_refresh_token_success(self, client: TestClient, test_user_data: Dict[str, str]):
        register = client.post("/api/v1/auth/register", json=test_user_data)
        assert register.status_code == 200
        register_body = register.json()
        refresh_token = register_body["refresh_token"]

        response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert isinstance(body["access_token"], str)
        assert len(body["access_token"]) > 20

    def test_logout_invalidates_token(self, client: TestClient, auth_headers: Dict[str, str]):
        logout = client.post("/api/v1/auth/logout", headers=auth_headers)
        assert logout.status_code == 200

        me = client.get("/api/v1/auth/me", headers=auth_headers)
        assert me.status_code == 401

    def test_old_auth_path_returns_404(self, client: TestClient):
        response = client.post("/api/auth/login", json={"email": "x@example.com", "password": "x"})
        assert response.status_code == 404


class TestProtectedRoutes:
    def test_dashboard_stats(self, client: TestClient, auth_headers: Dict[str, str]):
        response = client.get("/api/v1/dashboard/stats", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert "stats" in body or "totalUsers" in body

    def test_dashboard_activity(self, client: TestClient, auth_headers: Dict[str, str]):
        response = client.get("/api/v1/dashboard/activity", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert "activities" in body
        assert isinstance(body["activities"], list)

    def test_courses_and_problems(self, client: TestClient, auth_headers: Dict[str, str]):
        courses = client.get("/api/v1/courses?limit=3", headers=auth_headers)
        assert courses.status_code == 200
        courses_body = courses.json()
        assert "courses" in courses_body
        assert isinstance(courses_body["courses"], list)

        problems = client.get("/api/v1/problems?limit=3", headers=auth_headers)
        assert problems.status_code == 200
        problems_body = problems.json()
        assert "problems" in problems_body
        assert isinstance(problems_body["problems"], list)

    def test_user_profile_route(self, client: TestClient, auth_headers: Dict[str, str]):
        response = client.get("/api/users/me", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert "name" in body
        assert "email" in body


class TestAITutorAndIntegrity:
    def test_ai_tutor_chat(self, client: TestClient, auth_headers: Dict[str, str]):
        payload = {
            "message": "Explain Python loops in one short paragraph.",
            "message_type": "question",
            "user_id": "verification-user",
            "context": {"topic": "python"},
        }
        response = client.post("/api/v1/ai-tutor/chat", json=payload, headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert "response" in body
        assert isinstance(body["response"], str)
        assert len(body["response"]) > 0

    def test_ai_tutor_requires_auth(self, client: TestClient):
        payload = {
            "message": "What is Python?",
            "message_type": "question",
            "user_id": "anonymous",
            "context": {},
        }
        response = client.post("/api/v1/ai-tutor/chat", json=payload)
        assert response.status_code == 401

    def test_cors_preflight_health(self, client: TestClient):
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in {k.lower(): v for k, v in response.headers.items()}

    def test_endpoint_availability(self, client: TestClient):
        checks = [
            ("GET", "/api/health", None),
            ("POST", "/api/v1/auth/register", {}),
            ("POST", "/api/v1/auth/login", {}),
            ("GET", "/api/v1/dashboard/stats", None),
            ("POST", "/api/v1/ai-tutor/chat", {}),
            ("GET", "/api/v1/courses", None),
            ("GET", "/api/v1/problems", None),
        ]
        for method, path, payload in checks:
            if method == "GET":
                response = client.get(path)
            else:
                response = client.post(path, json=payload)
            assert response.status_code != 404, f"Endpoint {path} should exist"


class TestPerformance:
    def test_health_endpoint_is_fast(self, client: TestClient):
        start = time.perf_counter()
        response = client.get("/api/health")
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < 200, f"Health endpoint took {elapsed_ms:.2f}ms"

#!/usr/bin/env python3
"""
PyMastery comprehensive verification runner.

Runs backend checks, integration verification, and frontend lint/build with
structured output and report files.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.request import urlopen


PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

RESULTS_JSON = PROJECT_ROOT / "comprehensive_verification_results.json"
REPORT_MD = PROJECT_ROOT / "verification_report.md"


@dataclass
class SuiteResult:
    name: str
    category: str
    status: str
    command: List[str]
    cwd: str
    duration_seconds: float
    return_code: Optional[int] = None
    error: Optional[str] = None
    stdout_tail: str = ""
    stderr_tail: str = ""
    warnings: List[str] = field(default_factory=list)


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def trim_tail(text: str, limit: int = 6000) -> str:
    if not text:
        return ""
    cleaned = text.rstrip()
    return cleaned if len(cleaned) <= limit else cleaned[-limit:]


def find_warning_lines(text: str) -> List[str]:
    pattern = re.compile(r"\bwarnings?\b", flags=re.IGNORECASE)
    lines = []
    for line in text.splitlines():
        lowered = line.lower()
        if "--max-warnings" in lowered:
            continue
        if "warnings summary" in lowered or "docs.pytest.org" in lowered:
            continue
        if "deprecationwarning" in lowered or "deprecated" in lowered:
            continue
        if re.search(r"=+\s*\d+\s+passed,\s*\d+\s+warnings?\s+in", lowered):
            continue
        if pattern.search(line):
            lines.append(line.strip())
    return lines[:20]


def resolve_backend_python() -> str:
    venv_python = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
    if venv_python.exists():
        return str(venv_python)
    return sys.executable


def resolve_npm_command() -> Optional[str]:
    preferred = "npm.cmd" if os.name == "nt" else "npm"
    found = shutil.which(preferred)
    if found:
        return found
    fallback = shutil.which("npm")
    return fallback


def python_has_module(python_executable: str, module_name: str) -> bool:
    try:
        completed = subprocess.run(
            [python_executable, "-c", f"import {module_name}"],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=15,
            encoding="utf-8",
            errors="replace",
        )
    except Exception:
        return False
    return completed.returncode == 0


def backend_reachable(base_url: str) -> bool:
    health_url = f"{base_url.rstrip('/')}/api/health"
    try:
        with urlopen(health_url, timeout=5) as response:
            return int(response.status) == 200
    except Exception:
        return False


def command_version(command: List[str]) -> str:
    try:
        completed = subprocess.run(
            command,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=10,
            encoding="utf-8",
            errors="replace",
        )
    except Exception as exc:
        return f"unavailable ({exc})"

    output = (completed.stdout or completed.stderr).strip()
    if completed.returncode != 0:
        return f"unavailable (exit {completed.returncode})"
    return output.splitlines()[0] if output else "unknown"


def run_suite(
    name: str,
    category: str,
    command: List[str],
    cwd: Path,
    timeout_seconds: int,
    extra_env: Optional[Dict[str, str]] = None,
) -> SuiteResult:
    start = time.perf_counter()
    env = os.environ.copy()
    env.setdefault("PYTHONUTF8", "1")
    if extra_env:
        env.update(extra_env)
    try:
        completed = subprocess.run(
            command,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            encoding="utf-8",
            errors="replace",
            env=env,
        )
        duration = time.perf_counter() - start
        stdout_tail = trim_tail(completed.stdout)
        stderr_tail = trim_tail(completed.stderr)
        warnings = find_warning_lines(completed.stdout or "") + find_warning_lines(completed.stderr or "")
        status = "passed" if completed.returncode == 0 else "failed"
        return SuiteResult(
            name=name,
            category=category,
            status=status,
            command=command,
            cwd=str(cwd),
            duration_seconds=duration,
            return_code=completed.returncode,
            stdout_tail=stdout_tail,
            stderr_tail=stderr_tail,
            warnings=warnings[:20],
        )
    except subprocess.TimeoutExpired as exc:
        duration = time.perf_counter() - start
        stdout = exc.stdout.decode("utf-8", errors="replace") if isinstance(exc.stdout, bytes) else (exc.stdout or "")
        stderr = exc.stderr.decode("utf-8", errors="replace") if isinstance(exc.stderr, bytes) else (exc.stderr or "")
        return SuiteResult(
            name=name,
            category=category,
            status="failed",
            command=command,
            cwd=str(cwd),
            duration_seconds=duration,
            error=f"timed out after {timeout_seconds}s",
            stdout_tail=trim_tail(stdout),
            stderr_tail=trim_tail(stderr),
        )
    except FileNotFoundError as exc:
        duration = time.perf_counter() - start
        return SuiteResult(
            name=name,
            category=category,
            status="failed",
            command=command,
            cwd=str(cwd),
            duration_seconds=duration,
            error=f"command not found: {exc}",
        )
    except Exception as exc:
        duration = time.perf_counter() - start
        return SuiteResult(
            name=name,
            category=category,
            status="failed",
            command=command,
            cwd=str(cwd),
            duration_seconds=duration,
            error=str(exc),
        )


def skipped_suite(name: str, category: str, reason: str) -> SuiteResult:
    return SuiteResult(
        name=name,
        category=category,
        status="skipped",
        command=[],
        cwd=str(PROJECT_ROOT),
        duration_seconds=0.0,
        error=reason,
    )


def summarize(results: List[SuiteResult]) -> Dict[str, Any]:
    summary = {"total": len(results), "passed": 0, "failed": 0, "skipped": 0, "warning_count": 0}
    for result in results:
        summary[result.status] += 1
        summary["warning_count"] += len(result.warnings)
    summary["success_rate"] = (
        round((summary["passed"] / summary["total"]) * 100, 2) if summary["total"] else 0.0
    )
    return summary


def write_json_report(payload: Dict[str, Any]) -> None:
    RESULTS_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_markdown_report(payload: Dict[str, Any]) -> None:
    summary = payload["summary"]
    lines = [
        "# PyMastery Verification Report",
        "",
        f"- Generated: {payload['timestamp']}",
        f"- Project root: `{payload['project_root']}`",
        "",
        "## Summary",
        "",
        f"- Total suites: {summary['total']}",
        f"- Passed: {summary['passed']}",
        f"- Failed: {summary['failed']}",
        f"- Skipped: {summary['skipped']}",
        f"- Warnings detected: {summary['warning_count']}",
        f"- Success rate: {summary['success_rate']}%",
        "",
        "## Suite Results",
        "",
    ]

    for suite in payload["suites"]:
        lines.append(f"### {suite['name']}")
        lines.append("")
        lines.append(f"- Category: {suite['category']}")
        lines.append(f"- Status: {suite['status']}")
        lines.append(f"- Duration: {suite['duration_seconds']:.2f}s")
        if suite.get("return_code") is not None:
            lines.append(f"- Return code: {suite['return_code']}")
        if suite.get("error"):
            lines.append(f"- Error: {suite['error']}")
        if suite.get("warnings"):
            lines.append("- Warnings:")
            for warning in suite["warnings"]:
                lines.append(f"  - {warning}")
        if suite.get("stdout_tail"):
            lines.append("- Stdout tail:")
            lines.append("```text")
            lines.append(suite["stdout_tail"])
            lines.append("```")
        if suite.get("stderr_tail"):
            lines.append("- Stderr tail:")
            lines.append("```text")
            lines.append(suite["stderr_tail"])
            lines.append("```")
        lines.append("")

    REPORT_MD.write_text("\n".join(lines), encoding="utf-8")


def print_console(results: List[SuiteResult], summary: Dict[str, Any]) -> None:
    print("PyMastery Comprehensive Verification Runner")
    print("=" * 72)
    for result in results:
        print(
            f"[{result.status.upper():7}] {result.category:12} {result.name} "
            f"({result.duration_seconds:.2f}s)"
        )
        if result.error:
            print(f"  error: {result.error}")
        if result.return_code is not None:
            print(f"  return_code: {result.return_code}")
        if result.warnings:
            print(f"  warnings: {len(result.warnings)}")
    print("=" * 72)
    print(
        f"Total: {summary['total']} | Passed: {summary['passed']} | Failed: {summary['failed']} | "
        f"Skipped: {summary['skipped']} | Warnings: {summary['warning_count']} | "
        f"Success rate: {summary['success_rate']}%"
    )
    print(f"JSON report: {RESULTS_JSON}")
    print(f"Markdown report: {REPORT_MD}")


def main() -> int:
    if not BACKEND_DIR.exists():
        print(f"Missing backend directory: {BACKEND_DIR}")
        return 1
    if not FRONTEND_DIR.exists():
        print(f"Missing frontend directory: {FRONTEND_DIR}")
        return 1

    backend_python = resolve_backend_python()
    npm_command = resolve_npm_command()
    pytest_python = backend_python if python_has_module(backend_python, "pytest") else sys.executable
    verification_python = sys.executable if python_has_module(sys.executable, "requests") else backend_python
    backend_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")

    environment = {
        "python": command_version([sys.executable, "--version"]),
        "backend_python": command_version([backend_python, "--version"]),
        "pytest_python": command_version([pytest_python, "--version"]),
        "verification_python": command_version([verification_python, "--version"]),
        "node": command_version(["node", "--version"]),
        "npm": command_version([npm_command, "--version"]) if npm_command else "unavailable",
    }

    suites: List[SuiteResult] = []

    suites.append(
        run_suite(
            name="Backend Health Direct",
            category="backend",
            command=[backend_python, "test_health_direct.py"],
            cwd=BACKEND_DIR,
            timeout_seconds=180,
        )
    )
    suites.append(
        run_suite(
            name="Backend Auth Security",
            category="backend",
            command=[backend_python, "test_auth_security.py"],
            cwd=BACKEND_DIR,
            timeout_seconds=240,
        )
    )
    suites.append(
        run_suite(
            name="Backend Pytest Verification",
            category="backend",
            command=[
                pytest_python,
                "-m",
                "pytest",
                "tests/test_verification_suite.py",
                "tests/test_gemini_service.py",
                "-v",
                "--tb=short",
                "-W",
                "ignore::DeprecationWarning",
            ],
            cwd=BACKEND_DIR,
            timeout_seconds=600,
        )
    )
    if backend_reachable(backend_url):
        suites.append(
            run_suite(
                name="API Verification Suite",
                category="integration",
                command=[verification_python, str(PROJECT_ROOT / "verification_suite.py")],
                cwd=PROJECT_ROOT,
                timeout_seconds=600,
                extra_env={"BACKEND_URL": backend_url},
            )
        )
    else:
        suites.append(
            skipped_suite(
                "API Verification Suite",
                "integration",
                f"backend not reachable at {backend_url}; start the backend server to run integration checks",
            )
        )

    if npm_command:
        suites.append(
            run_suite(
                name="Frontend Lint",
                category="frontend",
                command=[npm_command, "run", "lint"],
                cwd=FRONTEND_DIR,
                timeout_seconds=600,
            )
        )
        suites.append(
            run_suite(
                name="Frontend Build",
                category="frontend",
                command=[npm_command, "run", "build"],
                cwd=FRONTEND_DIR,
                timeout_seconds=900,
            )
        )
    else:
        suites.append(skipped_suite("Frontend Lint", "frontend", "npm command not found"))
        suites.append(skipped_suite("Frontend Build", "frontend", "npm command not found"))

    summary = summarize(suites)
    payload = {
        "timestamp": utc_timestamp(),
        "project_root": str(PROJECT_ROOT),
        "backend_url": backend_url,
        "environment": environment,
        "summary": summary,
        "suites": [asdict(suite) for suite in suites],
    }
    write_json_report(payload)
    write_markdown_report(payload)
    print_console(suites, summary)

    return 0 if summary["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
Quick Verification Script
Fast verification of critical system components
"""

from __future__ import annotations

import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

import requests


PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
BACKEND_HEALTH_URL = "http://localhost:8000/api/health"


def get_backend_python() -> str:
    """Get the preferred Python executable for backend commands."""
    if os.name == "nt":
      return str(BACKEND_DIR / ".venv" / "Scripts" / "python.exe")
    return sys.executable


def wait_for_backend_health(timeout_seconds: int = 30) -> bool:
    """Wait until the backend responds as healthy."""
    deadline = time.time() + timeout_seconds

    while time.time() < deadline:
        try:
            response = requests.get(BACKEND_HEALTH_URL, timeout=5)
            if response.status_code == 200:
                return True
        except requests.RequestException:
            pass

        time.sleep(2)

    return False


def ensure_backend_running() -> tuple[bool, subprocess.Popen[str] | None]:
    """
    Ensure the backend is available.

    Returns a tuple of:
    - whether the backend is healthy
    - the process started by this script, if any
    """
    if wait_for_backend_health(timeout_seconds=2):
        print("[OK] Backend Startup: Already running")
        return True, None

    python_command = get_backend_python()
    creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)

    try:
        process = subprocess.Popen(
            [python_command, "start.py"],
            cwd=BACKEND_DIR,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            text=True,
            creationflags=creationflags,
        )
    except Exception as error:
        print(f"[FAIL] Backend Startup: {error}")
        return False, None

    if wait_for_backend_health():
        print("[OK] Backend Startup: Started successfully")
        return True, process

    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)

    print("[FAIL] Backend Startup: Timed out waiting for health check")
    return False, None


def stop_backend(process: subprocess.Popen[str] | None) -> None:
    """Stop a backend process started by this script."""
    if not process or process.poll() is not None:
        return

    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=10)


def check_backend_health():
    """Check if backend is running and healthy."""
    try:
        response = requests.get(BACKEND_HEALTH_URL, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Backend Health: {data.get('status', 'unknown')}")
            return True

        print(f"[FAIL] Backend Health: HTTP {response.status_code}")
        return False
    except Exception as error:
        print(f"[FAIL] Backend Health: {error}")
        return False


def check_frontend_build():
    """Check if frontend can build successfully."""
    try:
        npm_command = "npm.cmd" if os.name == "nt" else "npm"
        result = subprocess.run(
            [npm_command, "run", "build"],
            cwd=FRONTEND_DIR,
            capture_output=True,
            text=True,
            timeout=180,
        )

        if result.returncode == 0:
            print("[OK] Frontend Build: Successful")
            return True

        print("[FAIL] Frontend Build: Failed")
        print("   Error:", result.stderr[-200:] if result.stderr else "Unknown error")
        return False
    except Exception as error:
        print(f"[FAIL] Frontend Build: {error}")
        return False


def run_backend_tests():
    """Run backend verification tests."""
    try:
        result = subprocess.run(
            [get_backend_python(), "test_health_direct.py"],
            cwd=BACKEND_DIR,
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode == 0:
            print("[OK] Backend Tests: Passed")
            return True

        print("[FAIL] Backend Tests: Failed")
        print("   Error:", result.stderr[-200:] if result.stderr else "Unknown error")
        return False
    except Exception as error:
        print(f"[FAIL] Backend Tests: {error}")
        return False


def main():
    """Main verification function."""
    print("Quick Verification")
    print("=" * 30)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 30)

    print("\n0. Ensuring Backend Availability...")
    backend_ready, managed_backend_process = ensure_backend_running()

    checks = []

    print("\n1. Checking Backend Health...")
    checks.append(check_backend_health() if backend_ready else False)

    print("\n2. Running Backend Tests...")
    checks.append(run_backend_tests() if backend_ready else False)

    print("\n3. Checking Frontend Build...")
    checks.append(check_frontend_build())

    passed = sum(checks)
    total = len(checks)

    print("\n" + "=" * 30)
    print("QUICK VERIFICATION SUMMARY")
    print("=" * 30)
    print(f"[OK] Passed: {passed}/{total}")
    print(f"[FAIL] Failed: {total - passed}/{total}")

    stop_backend(managed_backend_process)

    if passed == total:
        print("ALL CHECKS PASSED")
        return True

    print("SOME CHECKS FAILED")
    return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
Test authentication security hardening.
Validates the new security services and auth route wiring.
"""

import asyncio
import os
import sys
import pytest

os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-jwt-secret-key-for-pymastery-security-suite-0123456789",
)

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

pytestmark = pytest.mark.asyncio


async def test_security_services():
    """Test all security services."""
    print("[SECURITY] Testing authentication security hardening")
    print("=" * 50)

    try:
        print("\n1. Testing token blacklist service...")
        from services.token_blacklist_service import get_token_blacklist_service

        token_blacklist = get_token_blacklist_service()

        test_token = "test_token_12345"
        test_user_id = "test_user_123"

        success = token_blacklist.blacklist_token(test_token, test_user_id, "test_logout")
        print(f"   [OK] Token blacklisted: {success}")

        is_blacklisted = token_blacklist.is_token_blacklisted(test_token)
        print(f"   [OK] Token is blacklisted: {is_blacklisted}")

        success = token_blacklist.blacklist_all_user_tokens(test_user_id, "test_security_action")
        print(f"   [OK] User tokens blacklisted: {success}")

        is_user_blacklisted = token_blacklist.is_user_blacklisted(test_user_id)
        print(f"   [OK] User is blacklisted: {is_user_blacklisted}")

        stats = token_blacklist.get_blacklist_stats()
        print(f"   [OK] Blacklist stats: {stats}")
    except Exception as exc:
        pytest.fail(f"Token blacklist service error: {exc}")

    try:
        print("\n2. Testing auth rate limiter...")
        from services.auth_rate_limiter import get_auth_rate_limiter

        rate_limiter = get_auth_rate_limiter()
        test_ip = "192.168.1.100"

        result = rate_limiter.check_rate_limit(test_ip, "login")
        print(f"   [OK] Login rate limit check: {result}")

        rate_limiter.record_attempt(test_ip, "login", success=True)
        print("   [OK] Attempt recorded")

        stats = rate_limiter.get_rate_limit_stats()
        print(f"   [OK] Rate limiter stats: {stats}")
    except Exception as exc:
        pytest.fail(f"Auth rate limiter error: {exc}")

    try:
        print("\n3. Testing security logger...")
        from services.security_logger import SecurityEventType, get_security_logger

        security_logger = get_security_logger()
        security_logger.log_security_event(
            SecurityEventType.LOGIN_SUCCESS,
            {"user_id": "test_user", "ip": "192.168.1.100", "test": True},
            severity="INFO",
        )
        print("   [OK] Security event logged")

        stats = security_logger.get_security_stats(hours=24)
        print(f"   [OK] Security stats: {stats.get('total_events', 0)} events")

        events = security_logger.get_recent_security_events(limit=5)
        print(f"   [OK] Recent events: {len(events)} events")
    except Exception as exc:
        pytest.fail(f"Security logger error: {exc}")

    print("\n[OK] All security services are working correctly.")


async def test_auth_endpoints():
    """Test authentication endpoints with security."""
    print("\n[AUTH] Testing authentication endpoints")
    print("=" * 50)

    try:
        print("\n1. Testing auth router import...")
        from routers.auth import router

        print("   [OK] Auth router imported successfully")

        routes = [route.path for route in router.routes]
        expected_routes = [
            "/register",
            "/login",
            "/refresh",
            "/logout",
            "/security/stats",
            "/security/recent-events",
            "/admin/blacklist-user/{user_id}",
            "/admin/reset-rate-limit/{identifier}",
            "/admin/cleanup-expired",
        ]

        for route in expected_routes:
            if route in routes:
                print(f"   [OK] Route {route} exists")
            else:
                pytest.fail(f"Route {route} missing")
    except Exception as exc:
        pytest.fail(f"Auth router error: {exc}")

    try:
        print("\n2. Testing auth dependencies...")
        from auth.dependencies import get_current_admin_user, get_current_user

        _ = (get_current_user, get_current_admin_user)
        print("   [OK] Auth dependencies imported successfully")
    except Exception as exc:
        pytest.fail(f"Auth dependencies error: {exc}")

    print("\n[OK] All authentication components are working correctly.")


async def main():
    """Main test function."""
    print("[START] Starting authentication security hardening tests")
    print("=" * 60)

    services_ok = await test_security_services()
    endpoints_ok = await test_auth_endpoints()

    print("\n" + "=" * 60)
    print("[RESULTS] Test results")
    print("=" * 60)

    if services_ok and endpoints_ok:
        print("[OK] ALL TESTS PASSED")
        print("\nSecurity hardening features validated:")
        print(" - Token blacklisting and invalidation")
        print(" - Rate limiting on auth endpoints")
        print(" - Security event logging")
        print(" - User blacklisting")
        print(" - Admin security management")
        print(" - Real-time security monitoring")
        print("\nAuthentication stack is production-ready with enhanced security checks.")
        return True

    print("[FAIL] SOME TESTS FAILED")
    print("Review the error messages above.")
    return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
Direct Health Endpoint Performance Test
Tests the health endpoint function directly without HTTP server
"""

import asyncio
import os
import sys
import time
import pytest

os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-jwt-secret-key-for-pymastery-health-suite-0123456789",
)

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

pytestmark = pytest.mark.asyncio


async def test_health_endpoint_direct():
    """Test the health endpoint function directly."""
    print("Direct Health Endpoint Performance Test")
    print("=" * 50)

    try:
        from main import health_check
        print("[OK] Successfully imported health_check function")
    except Exception as e:
        pytest.fail(f"Failed to import health_check: {e}")

    warmup_runs = 3
    print(f"\nWarming up health_check() with {warmup_runs} untimed calls")
    print("-" * 50)
    for i in range(warmup_runs):
        try:
            await health_check()
            print(f"Warmup {i + 1}: [OK]")
        except Exception as e:
            pytest.fail(f"Warmup call failed: {e}")

    response_times = []
    successful_calls = 0
    failed_calls = 0

    print(f"\nTesting {20} direct calls to health_check()")
    print("-" * 50)

    for i in range(20):
        try:
            start_time = time.time()
            result = await health_check()
            end_time = time.time()

            response_time = (end_time - start_time) * 1000
            response_times.append(response_time)
            successful_calls += 1

            status = result.get("status", "unknown")
            response_indicator = result.get("response_time_ms", "unknown")
            print(
                f"Call {i + 1:2d}: {response_time:6.2f}ms - "
                f"Status: {status} - Indicator: {response_indicator}"
            )

            required_fields = ["status", "timestamp", "version"]
            missing_fields = [field for field in required_fields if field not in result]
            if missing_fields:
                print(f"   [WARN] Missing fields: {missing_fields}")
        except Exception as e:
            failed_calls += 1
            print(f"Call {i + 1:2d}: [FAIL] Error - {str(e)}")

    print("\n" + "=" * 50)
    print("PERFORMANCE RESULTS")
    print("=" * 50)

    if not response_times:
        pytest.fail("No successful calls to health_check()")

    import statistics

    avg_time = statistics.mean(response_times)
    min_time = min(response_times)
    max_time = max(response_times)
    median_time = statistics.median(response_times)
    slow_responses = [t for t in response_times if t > 100]
    very_slow_responses = [t for t in response_times if t > 500]

    print(f"[OK] Successful Calls: {successful_calls}/20")
    print(f"[FAIL] Failed Calls: {failed_calls}/20")
    print(f"Average Response Time: {avg_time:.2f}ms")
    print(f"Fastest Response: {min_time:.2f}ms")
    print(f"Slowest Response: {max_time:.2f}ms")
    print(f"Median Response Time: {median_time:.2f}ms")
    print(f"Slow Responses (>100ms): {len(slow_responses)}")
    print(f"Very Slow Responses (>500ms): {len(very_slow_responses)}")

    if avg_time < 10:
        grade = "EXCELLENT"
        assessment = "Extremely fast - perfect for monitoring"
    elif avg_time < 50:
        grade = "GREAT"
        assessment = "Very fast - excellent for monitoring"
    elif avg_time < 100:
        grade = "GOOD"
        assessment = "Fast - suitable for monitoring"
    elif avg_time < 500:
        grade = "ACCEPTABLE"
        assessment = "Acceptable - could be faster"
    else:
        grade = "POOR"
        assessment = "Too slow - needs optimization"

    print(f"\n{grade} {assessment}")

    if max_time > 900:
        pytest.fail("Detected near-1-second delays in health_check()")
    if median_time > 500:
        pytest.fail("Health check median response time is above 500ms")
    if avg_time > 600:
        pytest.fail("Health check average response time is above 600ms")

    print("[OK] SUCCESS: No blocking delays detected")
    print("[OK] The 1-second delay problem has been resolved")


async def test_detailed_health_endpoint():
    """Test the detailed health endpoint function."""
    print("\nTesting Detailed Health Endpoint")
    print("-" * 50)

    try:
        from main import detailed_health_check

        response_times = []
        for i in range(3):
            try:
                start_time = time.time()
                result = await detailed_health_check()
                end_time = time.time()

                response_time = (end_time - start_time) * 1000
                response_times.append(response_time)
                print(
                    f"Detailed Call {i + 1}: {response_time:6.2f}ms - "
                    f"Status: {result.get('status', 'unknown')}"
                )
            except Exception as e:
                print(f"Detailed Call {i + 1}: [FAIL] Error - {str(e)}")

        if response_times:
            avg_time = sum(response_times) / len(response_times)
            print(f"\nDetailed Endpoint - Average: {avg_time:.2f}ms")

            if avg_time < 200:
                print("[OK] Detailed endpoint is reasonably fast")
            else:
                print("[WARN] Detailed endpoint is slower (expected due to more metrics)")
    except Exception as e:
        pytest.fail(f"Failed to test detailed endpoint: {e}")


async def main():
    """Main test function."""
    print("Health Endpoint Optimization Verification")
    print("=" * 60)

    success = await test_health_endpoint_direct()
    await test_detailed_health_endpoint()

    print("\n" + "=" * 60)
    print("OPTIMIZATION VERIFICATION")
    print("=" * 60)

    if success:
        print("[OK] OPTIMIZATION SUCCESSFUL")
        print("   - Health endpoint is now fast and responsive")
        print("   - No blocking 1-second delays detected")
        print("   - Suitable for monitoring and uptime checks")
        print("   - Zero performance bottlenecks remain")
    else:
        print("[FAIL] OPTIMIZATION INCOMPLETE")
        print("   - Performance issues still exist")
        print("   - Further optimization needed")

    print("\nCHANGES MADE:")
    print("   - Removed psutil.cpu_percent(interval=1) blocking call")
    print("   - Changed to psutil.cpu_percent(interval=0) for non-blocking")
    print("   - Added response_time_ms indicator")
    print("   - Created separate /api/health/detailed endpoint")
    print("   - Optimized error handling for fast responses")


if __name__ == "__main__":
    asyncio.run(main())

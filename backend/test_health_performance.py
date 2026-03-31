#!/usr/bin/env python3
"""
Health Endpoint Performance Benchmark
Tests the optimized health endpoint for performance improvements
"""

import asyncio
import time
import aiohttp
import statistics
from typing import List, Dict, Any

async def benchmark_health_endpoint(base_url: str = "http://localhost:8000", num_requests: int = 20):
    """Benchmark the health endpoint performance"""
    
    print(f"🚀 Benchmarking /api/health endpoint")
    print(f"📍 Target: {base_url}/api/health")
    print(f"📊 Requests: {num_requests}")
    print("=" * 60)
    
    response_times: List[float] = []
    successful_requests = 0
    failed_requests = 0
    error_details: List[str] = []
    
    async with aiohttp.ClientSession() as session:
        for i in range(num_requests):
            start_time = time.time()
            
            try:
                async with session.get(f"{base_url}/api/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        end_time = time.time()
                        response_time = (end_time - start_time) * 1000  # Convert to ms
                        
                        response_times.append(response_time)
                        successful_requests += 1
                        
                        # Check if response indicates fast optimization
                        response_indicator = data.get("response_time_ms", "unknown")
                        
                        print(f"Request {i+1:2d}: {response_time:6.2f}ms - Status: {data.get('status', 'unknown')} - Indicator: {response_indicator}")
                        
                        # Validate response structure
                        if not all(key in data for key in ["status", "timestamp", "version"]):
                            error_details.append(f"Request {i+1}: Missing required response fields")
                    else:
                        failed_requests += 1
                        error_details.append(f"Request {i+1}: HTTP {response.status}")
                        print(f"Request {i+1:2d}: Failed - HTTP {response.status}")
                        
            except Exception as e:
                failed_requests += 1
                error_details.append(f"Request {i+1}: {str(e)}")
                print(f"Request {i+1:2d}: Error - {str(e)}")
            
            # Small delay between requests to avoid overwhelming
            await asyncio.sleep(0.1)
    
    # Calculate statistics
    print("\n" + "=" * 60)
    print("📊 PERFORMANCE RESULTS")
    print("=" * 60)
    
    if response_times:
        avg_time = statistics.mean(response_times)
        min_time = min(response_times)
        max_time = max(response_times)
        median_time = statistics.median(response_times)
        
        # Check for slow responses (> 100ms)
        slow_requests = [t for t in response_times if t > 100]
        
        print(f"✅ Successful Requests: {successful_requests}/{num_requests}")
        print(f"❌ Failed Requests: {failed_requests}/{num_requests}")
        print(f"📈 Average Response Time: {avg_time:.2f}ms")
        print(f"⚡ Fastest Response: {min_time:.2f}ms")
        print(f"🐌 Slowest Response: {max_time:.2f}ms")
        print(f"📊 Median Response Time: {median_time:.2f}ms")
        print(f"🐌 Slow Requests (>100ms): {len(slow_requests)}")
        
        if slow_requests:
            print(f"   Slowest times: {sorted(slow_requests, reverse=True)[:3]}")
        
        # Performance assessment
        if avg_time < 50:
            print("🎯 EXCELLENT: Average response time under 50ms")
        elif avg_time < 100:
            print("✅ GOOD: Average response time under 100ms")
        elif avg_time < 500:
            print("⚠️  ACCEPTABLE: Average response time under 500ms")
        else:
            print("❌ POOR: Average response time over 500ms")
        
        # Check for 1-second delays (the original problem)
        if max_time > 900:
            print("🚨 CRITICAL: Detected near-1-second delays (original problem still exists)")
        elif max_time > 500:
            print("⚠️  WARNING: Some requests are still quite slow")
        else:
            print("✅ SUCCESS: No blocking delays detected")
    
    else:
        print("❌ NO SUCCESSFUL REQUESTS")
    
    # Show errors if any
    if error_details:
        print(f"\n🚨 ERRORS ({len(error_details)}):")
        for error in error_details[:5]:  # Show first 5 errors
            print(f"   {error}")
        if len(error_details) > 5:
            print(f"   ... and {len(error_details) - 5} more errors")
    
    return {
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
        "avg_response_time": statistics.mean(response_times) if response_times else 0,
        "max_response_time": max(response_times) if response_times else 0,
        "min_response_time": min(response_times) if response_times else 0,
        "slow_requests": len([t for t in response_times if t > 100]) if response_times else 0
    }

async def benchmark_detailed_health_endpoint(base_url: str = "http://localhost:8000", num_requests: int = 5):
    """Benchmark the detailed health endpoint (for comparison)"""
    
    print(f"\n🔍 Benchmarking /api/health/detailed endpoint")
    print(f"📍 Target: {base_url}/api/health/detailed")
    print(f"📊 Requests: {num_requests}")
    print("=" * 60)
    
    response_times: List[float] = []
    successful_requests = 0
    
    async with aiohttp.ClientSession() as session:
        for i in range(num_requests):
            start_time = time.time()
            
            try:
                async with session.get(f"{base_url}/api/health/detailed") as response:
                    if response.status == 200:
                        data = await response.json()
                        end_time = time.time()
                        response_time = (end_time - start_time) * 1000
                        
                        response_times.append(response_time)
                        successful_requests += 1
                        
                        print(f"Request {i+1:2d}: {response_time:6.2f}ms - Status: {data.get('status', 'unknown')}")
                    else:
                        print(f"Request {i+1:2d}: Failed - HTTP {response.status}")
                        
            except Exception as e:
                print(f"Request {i+1:2d}: Error - {str(e)}")
            
            await asyncio.sleep(0.2)  # Longer delay for detailed endpoint
    
    if response_times:
        avg_time = statistics.mean(response_times)
        print(f"\n📊 Detailed Endpoint - Average: {avg_time:.2f}ms")
        
        # Compare with fast endpoint
        if avg_time < 200:
            print("✅ Detailed endpoint is reasonably fast")
        else:
            print("⚠️  Detailed endpoint is slower (expected due to more metrics)")

async def main():
    """Main benchmark function"""
    print("🏥 Health Endpoint Performance Benchmark")
    print("=" * 60)
    
    # Test fast health endpoint
    fast_results = await benchmark_health_endpoint(num_requests=20)
    
    # Test detailed health endpoint for comparison
    await benchmark_detailed_health_endpoint(num_requests=5)
    
    print("\n" + "=" * 60)
    print("🎯 OPTIMIZATION VERIFICATION")
    print("=" * 60)
    
    # Verify optimization success
    if fast_results["avg_response_time"] < 100:
        print("✅ OPTIMIZATION SUCCESSFUL")
        print("   • Average response time under 100ms")
        print("   • No blocking delays detected")
        print("   • Health endpoint is now fast and monitoring-friendly")
    elif fast_results["avg_response_time"] < 500:
        print("⚠️  PARTIAL OPTIMIZATION")
        print("   • Response time improved but could be better")
        print("   • Consider further optimizations")
    else:
        print("❌ OPTIMIZATION FAILED")
        print("   • Response time still too slow")
        print("   • Blocking delays may still exist")
    
    if fast_results["max_response_time"] < 200:
        print("✅ CONSISTENT PERFORMANCE")
        print("   • No slow outliers detected")
        print("   • Reliable for monitoring systems")
    else:
        print("⚠️  INCONSISTENT PERFORMANCE")
        print("   • Some requests are still slow")
        print("   • May need further investigation")

if __name__ == "__main__":
    asyncio.run(main())

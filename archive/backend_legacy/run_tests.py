#!/usr/bin/env python3
"""
Test runner script for PyMastery Backend
"""

import os
import sys
import argparse
import subprocess
import time
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            check=True
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"✅ {description} - PASSED ({duration:.2f}s)")
        
        if result.stdout:
            print(f"Output:\n{result.stdout}")
        
        return True, duration
        
    except subprocess.CalledProcessError as e:
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"❌ {description} - FAILED ({duration:.2f}s)")
        print(f"Return code: {e.returncode}")
        
        if e.stdout:
            print(f"Output:\n{e.stdout}")
        
        if e.stderr:
            print(f"Error:\n{e.stderr}")
        
        return False, duration

def run_unit_tests():
    """Run unit tests"""
    print("\n🧪 Running Unit Tests")
    
    commands = [
        ("pytest tests/unit/ -v --cov=backend --cov-report=html --cov-report=term", "Unit Tests"),
        ("pytest tests/unit/test_services/ -v", "Service Unit Tests"),
        ("pytest tests/unit/test_utils/ -v", "Utility Unit Tests"),
        ("pytest tests/unit/test_middleware/ -v", "Middleware Unit Tests"),
    ]
    
    results = []
    for command, description in commands:
        try:
            success, duration = run_command(command, description)
            results.append((description, success, duration))
        except Exception as e:
            print(f"❌ {description} - ERROR: {e}")
            results.append((description, False, 0))
    
    return results

def run_integration_tests():
    """Run integration tests"""
    print("\n🔗 Running Integration Tests")
    
    commands = [
        ("pytest tests/integration/ -v", "Integration Tests"),
        ("pytest tests/integration/test_api_endpoints.py -v", "API Endpoint Tests"),
        ("pytest tests/integration/test_database_integration.py -v", "Database Integration Tests"),
        ("pytest tests/integration/test_cache_integration.py -v", "Cache Integration Tests"),
    ]
    
    results = []
    for command, description in commands:
        try:
            success, duration = run_command(command, description)
            results.append((description, success, duration))
        except Exception as e:
            print(f"❌ {description} - ERROR: {e}")
            results.append((description, False, 0))
    
    return results

def run_performance_tests():
    """Run performance tests"""
    print("\n⚡ Running Performance Tests")
    
    commands = [
        ("pytest tests/performance/ -v -m 'not slow'", "Performance Tests"),
        ("pytest tests/performance/test_load_testing.py -v", "Load Testing"),
        ("pytest tests/performance/test_memory_usage.py -v", "Memory Usage Tests"),
        ("pytest tests/performance/test_concurrency.py -v", "Concurrency Tests"),
    ]
    
    results = []
    for command, description in commands:
        try:
            success, duration = run_command(command, description)
            results.append((description, success, duration))
        except Exception as e:
            print(f"❌ {description} - ERROR: {e}")
            results.append((description, False, 0))
    
    return results

def run_security_tests():
    """Run security tests"""
    print("\n🔒 Running Security Tests")
    
    commands = [
        ("pytest tests/security/ -v", "Security Tests"),
        ("pytest tests/security/test_security_vulnerabilities.py -v", "Vulnerability Tests"),
        ("pytest tests/security/test_authentication_security.py -v", "Authentication Security Tests"),
        ("pytest tests/security/test_input_validation.py -v", "Input Validation Tests"),
    ]
    
    results = []
    for command, description in commands:
        try:
            success, duration = run_command(command, description)
            results.append((description, success, duration))
        except Exception as e:
            print(f"❌ {description} - ERROR: {e}")
            results.append((description, False, 0))
    
    return results

def run_slow_tests():
    """Run slow tests"""
    print("\n🐌 Running Slow Tests")
    
    commands = [
        ("pytest tests/ -v -m slow", "Slow Tests"),
        ("pytest tests/performance/ -v -m slow", "Slow Performance Tests"),
    ]
    
    results = []
    for command, description in commands:
        try:
            success, duration = run_command(command, description)
            results.append((description, success, duration))
        except Exception as e:
            print(f"❌ {description} - ERROR: {e}")
            results.append((description, False, 0))
    
    return results

def run_coverage_tests():
    """Run tests with coverage"""
    print("\n📊 Running Coverage Tests")
    
    commands = [
        ("pytest tests/ -v --cov=backend --cov-report=html --cov-report=xml --cov-report=term", "Full Coverage"),
        ("coverage report --show-missing", "Coverage Report"),
        ("coverage html", "HTML Coverage Report"),
    ]
    
    results = []
    for command, description in commands:
        try:
            success, duration = run_command(command, description)
            results.append((description, success, duration))
        except Exception as e:
            print(f"❌ {description} - ERROR: {e}")
            results.append((description, False, 0))
    
    return results

def run_linting():
    """Run code linting"""
    print("\n🔍 Running Code Linting")
    
    commands = [
        ("flake8 backend/ --max-line-length=100 --ignore=E203,W503", "Flake8 Linting"),
        ("black --check backend/", "Black Code Formatting"),
        ("isort --check-only backend/", "Import Sorting"),
        ("mypy backend/ --ignore-missing-imports", "Type Checking"),
    ]
    
    results = []
    for command, description in commands:
        try:
            success, duration = run_command(command, description)
            results.append((description, success, duration))
        except Exception as e:
            print(f"❌ {description} - ERROR: {e}")
            results.append((description, False, 0))
    
    return results

def generate_test_report(all_results):
    """Generate test report"""
    print("\n" + "="*80)
    print("📋 TEST REPORT")
    print("="*80)
    
    total_tests = 0
    total_passed = 0
    total_failed = 0
    total_time = 0
    
    for category, results in all_results.items():
        print(f"\n📂 {category.upper()}")
        print("-" * 40)
        
        category_passed = 0
        category_failed = 0
        category_time = 0
        
        for test_name, success, duration in results:
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"  {status:<12} {test_name:<30} ({duration:.2f}s)")
            
            total_tests += 1
            category_time += duration
            
            if success:
                total_passed += 1
                category_passed += 1
            else:
                total_failed += 1
                category_failed += 1
        
        total_time += category_time
        
        print(f"\n  📊 {category}: {category_passed}/{len(results)} passed ({category_time:.2f}s)")
    
    print("\n" + "="*80)
    print("📊 OVERALL SUMMARY")
    print("="*80)
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {total_passed} ({total_passed/total_tests*100:.1f}%)")
    print(f"Failed: {total_failed} ({total_failed/total_tests*100:.1f}%)")
    print(f"Total Time: {total_time:.2f}s")
    
    if total_failed > 0:
        print(f"\n❌ {total_failed} test(s) failed!")
        return False
    else:
        print(f"\n✅ All {total_passed} tests passed!")
        return True

def setup_test_environment():
    """Setup test environment"""
    print("🔧 Setting up test environment...")
    
    # Create test directories
    test_dirs = [
        "./test_cache",
        "./test_uploads",
        "./test_logs",
        "./test_reports",
    ]
    
    for test_dir in test_dirs:
        Path(test_dir).mkdir(exist_ok=True)
    
    # Set environment variables
    os.environ["ENVIRONMENT"] = "test"
    os.environ["TESTING"] = "true"
    os.environ["LOG_LEVEL"] = "WARNING"
    
    print("✅ Test environment ready")

def cleanup_test_environment():
    """Cleanup test environment"""
    print("\n🧹 Cleaning up test environment...")
    
    # Remove test directories
    test_dirs = [
        "./test_cache",
        "./test_uploads",
        "./test_logs",
    ]
    
    for test_dir in test_dirs:
        import shutil
        if Path(test_dir).exists():
            shutil.rmtree(test_dir)
    
    print("✅ Test environment cleaned up")

def main():
    """Main test runner"""
    parser = argparse.ArgumentParser(description="PyMastery Backend Test Runner")
    parser.add_argument("--unit", action="store_true", help="Run unit tests only")
    parser.add_argument("--integration", action="store_true", help="Run integration tests only")
    parser.add_argument("--performance", action="store_true", help="Run performance tests only")
    parser.add_argument("--security", action="store_true", help="Run security tests only")
    parser.add_argument("--slow", action="store_true", help="Run slow tests only")
    parser.add_argument("--coverage", action="store_true", help="Run tests with coverage")
    parser.add_argument("--lint", action="store_true", help="Run code linting only")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    parser.add_argument("--ci", action="store_true", help="Run tests in CI mode")
    parser.add_argument("--no-cleanup", action="store_true", help="Skip cleanup")
    
    args = parser.parse_args()
    
    # Setup test environment
    setup_test_environment()
    
    try:
        all_results = {}
        
        if args.unit:
            all_results["unit"] = run_unit_tests()
        elif args.integration:
            all_results["integration"] = run_integration_tests()
        elif args.performance:
            all_results["performance"] = run_performance_tests()
        elif args.security:
            all_results["security"] = run_security_tests()
        elif args.slow:
            all_results["slow"] = run_slow_tests()
        elif args.coverage:
            all_results["coverage"] = run_coverage_tests()
        elif args.lint:
            all_results["linting"] = run_linting()
        elif args.all or args.ci:
            # Run all tests
            all_results["linting"] = run_linting()
            all_results["unit"] = run_unit_tests()
            all_results["integration"] = run_integration_tests()
            all_results["performance"] = run_performance_tests()
            all_results["security"] = run_security_tests()
            
            if not args.ci:
                all_results["slow"] = run_slow_tests()
            
            all_results["coverage"] = run_coverage_tests()
        else:
            # Default: run unit and integration tests
            all_results["unit"] = run_unit_tests()
            all_results["integration"] = run_integration_tests()
        
        # Generate report
        success = generate_test_report(all_results)
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    finally:
        # Cleanup
        if not args.no_cleanup:
            cleanup_test_environment()

if __name__ == "__main__":
    main()

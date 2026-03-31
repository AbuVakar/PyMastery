#!/usr/bin/env python3
"""
End-to-End User Flow Tests
Tests the main user flows from signup to AI tutor interaction
"""

import asyncio
import subprocess
import sys
import os
import json
import time
import requests
from datetime import datetime
from typing import Dict, List, Any

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"

class UserFlowTest:
    """Test class for user flows"""
    
    def __init__(self, name: str):
        self.name = name
        self.start_time = None
        self.end_time = None
        self.passed = False
        self.error = None
        self.steps = []
        self.test_user = None
    
    def add_step(self, step_name: str, success: bool, details: str = ""):
        """Add a test step"""
        self.steps.append({
            "name": step_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def run(self) -> bool:
        """Run the user flow test"""
        self.start_time = time.time()
        try:
            self.passed = self.execute()
        except Exception as e:
            self.error = str(e)
            self.passed = False
            self.add_step("Test Error", False, str(e))
        finally:
            self.end_time = time.time()
        return self.passed
    
    def execute(self) -> bool:
        """Override this method in subclasses"""
        raise NotImplementedError
    
    def get_duration(self) -> float:
        """Get test duration in seconds"""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return 0

class CompleteUserJourneyTest(UserFlowTest):
    """Test complete user journey from signup to AI tutor"""
    
    def __init__(self):
        super().__init__("Complete User Journey")
        self.test_user = {
            "name": "Journey Test User",
            "email": f"journey_test_{int(time.time())}@example.com",
            "password": "JourneyTest123!"
        }
        self.tokens = {}
    
    def execute(self) -> bool:
        """Execute complete user journey"""
        
        # Step 1: Check backend health
        if not self.check_backend_health():
            return False
        
        # Step 2: User registration
        if not self.test_registration():
            return False
        
        # Step 3: User login
        if not self.test_login():
            return False
        
        # Step 4: Access dashboard
        if not self.test_dashboard_access():
            return False
        
        # Step 5: Use AI tutor
        if not self.test_ai_tutor():
            return False
        
        # Step 6: Token refresh
        if not self.test_token_refresh():
            return False
        
        # Step 7: Logout
        if not self.test_logout():
            return False
        
        # Step 8: Verify logout
        if not self.test_logout_verification():
            return False
        
        return True
    
    def check_backend_health(self) -> bool:
        """Check backend health"""
        try:
            response = requests.get(f"{BASE_URL}/api/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.add_step("Backend Health Check", True, f"Status: {data.get('status')}")
                    return True
                else:
                    self.add_step("Backend Health Check", False, f"Status: {data.get('status')}")
                    return False
            else:
                self.add_step("Backend Health Check", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.add_step("Backend Health Check", False, str(e))
            return False
    
    def test_registration(self) -> bool:
        """Test user registration"""
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "name": self.test_user["name"],
                    "email": self.test_user["email"],
                    "password": self.test_user["password"],
                    "role_track": "general",
                    "agree_terms": True
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.tokens["access"] = data.get("access_token")
                self.tokens["refresh"] = data.get("refresh_token")
                self.tokens["user"] = data.get("user")
                
                self.add_step("User Registration", True, f"User ID: {data.get('user', {}).get('id')}")
                return True
            else:
                self.add_step("User Registration", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.add_step("User Registration", False, str(e))
            return False
    
    def test_login(self) -> bool:
        """Test user login"""
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.test_user["email"],
                    "password": self.test_user["password"]
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.tokens["access"] = data.get("access_token")
                self.tokens["refresh"] = data.get("refresh_token")
                
                self.add_step("User Login", True, f"Token received")
                return True
            else:
                self.add_step("User Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.add_step("User Login", False, str(e))
            return False
    
    def test_dashboard_access(self) -> bool:
        """Test dashboard access"""
        try:
            headers = {"Authorization": f"Bearer {self.tokens['access']}"}
            
            # Test dashboard stats
            stats_response = requests.get(
                f"{BASE_URL}/api/v1/dashboard/stats",
                headers=headers,
                timeout=10
            )
            
            if stats_response.status_code == 200:
                stats_data = stats_response.json()
                self.add_step("Dashboard Stats", True, f"Status: {stats_data.get('success')}")
            else:
                self.add_step("Dashboard Stats", False, f"HTTP {stats_response.status_code}")
                return False
            
            # Test dashboard activity
            activity_response = requests.get(
                f"{BASE_URL}/api/v1/dashboard/activity",
                headers=headers,
                timeout=10
            )
            
            if activity_response.status_code == 200:
                activity_data = activity_response.json()
                self.add_step("Dashboard Activity", True, f"Status: {activity_data.get('success')}")
                return True
            else:
                self.add_step("Dashboard Activity", False, f"HTTP {activity_response.status_code}")
                return False
        except Exception as e:
            self.add_step("Dashboard Access", False, str(e))
            return False
    
    def test_ai_tutor(self) -> bool:
        """Test AI tutor functionality"""
        try:
            headers = {"Authorization": f"Bearer {self.tokens['access']}"}
            user_id = self.tokens["user"].get("id", "test_user")
            
            # Test valid prompt
            chat_response = requests.post(
                f"{BASE_URL}/api/v1/ai-tutor/chat",
                json={
                    "message": "What is Python?",
                    "message_type": "question",
                    "user_id": user_id,
                    "context": {}
                },
                headers=headers,
                timeout=15
            )
            
            if chat_response.status_code == 200:
                chat_data = chat_response.json()
                response_text = chat_data.get("response", "")
                if len(response_text) > 0:
                    self.add_step("AI Tutor Chat", True, f"Response length: {len(response_text)} chars")
                else:
                    self.add_step("AI Tutor Chat", False, "Empty response")
                    return False
            else:
                self.add_step("AI Tutor Chat", False, f"HTTP {chat_response.status_code}")
                return False
            
            # Test empty prompt (should fail)
            empty_response = requests.post(
                f"{BASE_URL}/api/v1/ai-tutor/chat",
                json={
                    "message": "",
                    "message_type": "question",
                    "user_id": user_id,
                    "context": {}
                },
                headers=headers,
                timeout=10
            )
            
            if empty_response.status_code == 400:
                self.add_step("AI Tutor Empty Prompt", True, "Correctly rejected empty prompt")
            else:
                self.add_step("AI Tutor Empty Prompt", False, f"Should return 400, got {empty_response.status_code}")
                return False
            
            return True
        except Exception as e:
            self.add_step("AI Tutor", False, str(e))
            return False
    
    def test_token_refresh(self) -> bool:
        """Test token refresh"""
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/refresh",
                json={"refresh_token": self.tokens["refresh"]},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                new_access_token = data.get("access_token")
                if new_access_token:
                    self.tokens["access"] = new_access_token
                    self.add_step("Token Refresh", True, "New token received")
                    return True
                else:
                    self.add_step("Token Refresh", False, "No access token in response")
                    return False
            else:
                self.add_step("Token Refresh", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.add_step("Token Refresh", False, str(e))
            return False
    
    def test_logout(self) -> bool:
        """Test logout"""
        try:
            headers = {"Authorization": f"Bearer {self.tokens['access']}"}
            response = requests.post(
                f"{BASE_URL}/api/auth/logout",
                headers=headers,
                timeout=10
            )
            
            # Logout should succeed even if token is invalidated
            if response.status_code in [200, 401]:
                self.add_step("User Logout", True, f"HTTP {response.status_code}")
                return True
            else:
                self.add_step("User Logout", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.add_step("User Logout", False, str(e))
            return False
    
    def test_logout_verification(self) -> bool:
        """Test that logout invalidated the token"""
        try:
            headers = {"Authorization": f"Bearer {self.tokens['access']}"}
            response = requests.get(
                f"{BASE_URL}/api/auth/me",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 401:
                self.add_step("Logout Verification", True, "Token successfully invalidated")
                return True
            else:
                self.add_step("Logout Verification", False, f"Token still valid: HTTP {response.status_code}")
                return False
        except Exception as e:
            self.add_step("Logout Verification", False, str(e))
            return False

class AuthenticationFlowTest(UserFlowTest):
    """Test authentication flow edge cases"""
    
    def __init__(self):
        super().__init__("Authentication Flow Edge Cases")
        self.test_user = {
            "name": "Auth Test User",
            "email": f"auth_test_{int(time.time())}@example.com",
            "password": "AuthTest123!"
        }
    
    def execute(self) -> bool:
        """Test authentication edge cases"""
        
        # Step 1: Test invalid login
        if not self.test_invalid_login():
            return False
        
        # Step 2: Test duplicate registration
        if not self.test_duplicate_registration():
            return False
        
        # Step 3: Test invalid token
        if not self.test_invalid_token():
            return False
        
        # Step 4: Test missing token
        if not self.test_missing_token():
            return False
        
        return True
    
    def test_invalid_login(self) -> bool:
        """Test login with invalid credentials"""
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": "nonexistent@example.com",
                    "password": "wrongpassword"
                },
                timeout=10
            )
            
            if response.status_code == 401:
                self.add_step("Invalid Login", True, "Correctly rejected invalid credentials")
                return True
            else:
                self.add_step("Invalid Login", False, f"Should return 401, got {response.status_code}")
                return False
        except Exception as e:
            self.add_step("Invalid Login", False, str(e))
            return False
    
    def test_duplicate_registration(self) -> bool:
        """Test registration with duplicate email"""
        try:
            # First registration
            response1 = requests.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "name": self.test_user["name"],
                    "email": self.test_user["email"],
                    "password": self.test_user["password"],
                    "role_track": "general",
                    "agree_terms": True
                },
                timeout=10
            )
            
            if response1.status_code != 200:
                self.add_step("Duplicate Registration", False, f"First registration failed: {response1.status_code}")
                return False
            
            # Second registration with same email
            response2 = requests.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "name": "Another User",
                    "email": self.test_user["email"],
                    "password": "AnotherPassword123!",
                    "role_track": "general",
                    "agree_terms": True
                },
                timeout=10
            )
            
            if response2.status_code == 400:
                self.add_step("Duplicate Registration", True, "Correctly rejected duplicate email")
                return True
            else:
                self.add_step("Duplicate Registration", False, f"Should return 400, got {response2.status_code}")
                return False
        except Exception as e:
            self.add_step("Duplicate Registration", False, str(e))
            return False
    
    def test_invalid_token(self) -> bool:
        """Test API access with invalid token"""
        try:
            headers = {"Authorization": "Bearer invalid_token_12345"}
            response = requests.get(
                f"{BASE_URL}/api/auth/me",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 401:
                self.add_step("Invalid Token", True, "Correctly rejected invalid token")
                return True
            else:
                self.add_step("Invalid Token", False, f"Should return 401, got {response.status_code}")
                return False
        except Exception as e:
            self.add_step("Invalid Token", False, str(e))
            return False
    
    def test_missing_token(self) -> bool:
        """Test API access without token"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/auth/me",
                timeout=10
            )
            
            if response.status_code == 401:
                self.add_step("Missing Token", True, "Correctly rejected missing token")
                return True
            else:
                self.add_step("Missing Token", False, f"Should return 401, got {response.status_code}")
                return False
        except Exception as e:
            self.add_step("Missing Token", False, str(e))
            return False

class DashboardFlowTest(UserFlowTest):
    """Test dashboard data flows"""
    
    def __init__(self):
        super().__init__("Dashboard Data Flow")
        self.auth_token = None
    
    def execute(self) -> bool:
        """Test dashboard data flows"""
        
        # Step 1: Get auth token
        if not self.get_auth_token():
            return False
        
        # Step 2: Test dashboard stats
        if not self.test_dashboard_stats():
            return False
        
        # Step 3: Test dashboard activity
        if not self.test_dashboard_activity():
            return False
        
        # Step 4: Test concurrent requests
        if not self.test_concurrent_requests():
            return False
        
        return True
    
    def get_auth_token(self) -> bool:
        """Get authentication token"""
        try:
            # Try to login with existing test user
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "TestPassword123!"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.add_step("Auth Token", True, "Token received")
                return True
            else:
                # Create test user
                test_user = {
                    "name": "Dashboard Test User",
                    "email": f"dashboard_test_{int(time.time())}@example.com",
                    "password": "DashboardTest123!"
                }
                
                register_response = requests.post(
                    f"{BASE_URL}/api/auth/register",
                    json={
                        "name": test_user["name"],
                        "email": test_user["email"],
                        "password": test_user["password"],
                        "role_track": "general",
                        "agree_terms": True
                    },
                    timeout=10
                )
                
                if register_response.status_code == 200:
                    register_data = register_response.json()
                    self.auth_token = register_data.get("access_token")
                    self.add_step("Auth Token", True, "Created test user and got token")
                    return True
                else:
                    self.add_step("Auth Token", False, f"Registration failed: {register_response.status_code}")
                    return False
        except Exception as e:
            self.add_step("Auth Token", False, str(e))
            return False
    
    def test_dashboard_stats(self) -> bool:
        """Test dashboard stats endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(
                f"{BASE_URL}/api/v1/dashboard/stats",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    stats = data["data"]
                    required_fields = ["total_courses", "completed_courses", "total_problems", "solved_problems"]
                    missing_fields = [field for field in required_fields if field not in stats]
                    
                    if missing_fields:
                        self.add_step("Dashboard Stats", False, f"Missing fields: {missing_fields}")
                        return False
                    else:
                        self.add_step("Dashboard Stats", True, f"Fields: {list(stats.keys())}")
                        return True
                else:
                    self.add_step("Dashboard Stats", False, "Invalid response structure")
                    return False
            else:
                self.add_step("Dashboard Stats", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.add_step("Dashboard Stats", False, str(e))
            return False
    
    def test_dashboard_activity(self) -> bool:
        """Test dashboard activity endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(
                f"{BASE_URL}/api/v1/dashboard/activity",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and isinstance(data.get("data"), list):
                    activity = data["data"]
                    self.add_step("Dashboard Activity", True, f"Activity count: {len(activity)}")
                    return True
                else:
                    self.add_step("Dashboard Activity", False, "Invalid response structure")
                    return False
            else:
                self.add_step("Dashboard Activity", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.add_step("Dashboard Activity", False, str(e))
            return False
    
    def test_concurrent_requests(self) -> bool:
        """Test concurrent dashboard requests"""
        try:
            import threading
            import queue
            
            results = queue.Queue()
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            def make_request():
                try:
                    response = requests.get(
                        f"{BASE_URL}/api/v1/dashboard/stats",
                        headers=headers,
                        timeout=10
                    )
                    results.put(response.status_code)
                except Exception as e:
                    results.put(str(e))
            
            # Start multiple concurrent requests
            threads = []
            for i in range(5):
                thread = threading.Thread(target=make_request)
                threads.append(thread)
                thread.start()
            
            # Wait for all threads to complete
            for thread in threads:
                thread.join()
            
            # Check results
            success_count = 0
            while not results.empty():
                result = results.get()
                if result == 200:
                    success_count += 1
            
            if success_count >= 4:  # At least 4 out of 5 should succeed
                self.add_step("Concurrent Requests", True, f"Success rate: {success_count}/5")
                return True
            else:
                self.add_step("Concurrent Requests", False, f"Low success rate: {success_count}/5")
                return False
        except Exception as e:
            self.add_step("Concurrent Requests", False, str(e))
            return False

class UserFlowRunner:
    """Runner for user flow tests"""
    
    def __init__(self):
        self.tests = [
            CompleteUserJourneyTest(),
            AuthenticationFlowTest(),
            DashboardFlowTest()
        ]
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all user flow tests"""
        print("🚀 Starting User Flow Tests")
        print("=" * 50)
        
        results = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": len(self.tests),
            "passed": 0,
            "failed": 0,
            "tests": []
        }
        
        for test in self.tests:
            print(f"\n🧪 Running {test.name}")
            print("-" * 40)
            
            success = test.run()
            duration = test.get_duration()
            
            if success:
                results["passed"] += 1
                print(f"✅ PASSED ({duration:.2f}s)")
            else:
                results["failed"] += 1
                print(f"❌ FAILED ({duration:.2f}s)")
                if test.error:
                    print(f"   Error: {test.error}")
            
            # Add test results
            test_result = {
                "name": test.name,
                "passed": success,
                "duration": duration,
                "error": test.error,
                "steps": test.steps
            }
            results["tests"].append(test_result)
        
        return results
    
    def print_summary(self, results: Dict[str, Any]):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 USER FLOW TESTS SUMMARY")
        print("=" * 50)
        
        total = results["total_tests"]
        passed = results["passed"]
        failed = results["failed"]
        
        print(f"📈 Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Success Rate: {(passed/total*100):.1f}%" if total > 0 else "N/A")
        
        print("\n📋 Test Results:")
        for test in results["tests"]:
            status = "✅ PASSED" if test["passed"] else "❌ FAILED"
            print(f"   {test['name']}: {status} ({test['duration']:.2f}s)")
            
            if not test["passed"]:
                print(f"     Error: {test['error']}")
            
            # Show step results
            for step in test["steps"]:
                step_status = "✅" if step["success"] else "❌"
                print(f"     {step_status} {step['name']}")
                if not step["success"] and step["details"]:
                    print(f"        {step['details']}")
        
        print("\n" + "=" * 50)
        
        if failed == 0:
            print("🎉 ALL USER FLOW TESTS PASSED!")
            return True
        else:
            print("⚠️  SOME USER FLOW TESTS FAILED!")
            return False
    
    def save_results(self, results: Dict[str, Any], filename: str = "user_flow_results.json"):
        """Save test results to file"""
        try:
            with open(filename, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"\n💾 Results saved to {filename}")
        except Exception as e:
            print(f"\n❌ Failed to save results: {e}")

def main():
    """Main function"""
    print("🔍 Checking backend availability...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code != 200:
            print(f"❌ Backend health check failed: {response.status_code}")
            print("Please start the backend server first:")
            print("   cd backend && python -m uvicorn main:app --reload")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("Please start the backend server first:")
        print("   cd backend && python -m uvicorn main:app --reload")
        return False
    
    print("✅ Backend is running")
    
    # Run user flow tests
    runner = UserFlowRunner()
    results = runner.run_all_tests()
    
    # Print summary
    success = runner.print_summary(results)
    
    # Save results
    runner.save_results(results)
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

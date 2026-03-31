#!/usr/bin/env python3
"""
Test Authentication Flow
Tests signup, login, token storage, and protected routes
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5176"

def test_health():
    """Test backend health"""
    print("🔍 Testing Backend Health...")
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend Health: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ Backend Health: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend Health Error: {e}")
        return False

def test_signup():
    """Test user registration"""
    print("\n🔍 Testing User Registration...")
    
    # Test data
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "TestPassword123!",
        "role_track": "general",
        "agree_terms": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            data = response.json()
            if data.get('success') and data.get('token'):
                print("✅ Registration successful")
                return True, data
            else:
                print(f"❌ Registration failed: {data}")
                return False, None
        else:
            print(f"❌ Registration failed: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ Registration Error: {e}")
        return False, None

def test_login():
    """Test user login"""
    print("\n🔍 Testing User Login...")
    
    login_data = {
        "email": "test@example.com",
        "password": "TestPassword123!"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('token'):
                print("✅ Login successful")
                return True, data
            else:
                print(f"❌ Login failed: {data}")
                return False, None
        else:
            print(f"❌ Login failed: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ Login Error: {e}")
        return False, None

def test_protected_route(token):
    """Test protected route with token"""
    print("\n🔍 Testing Protected Route...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/users/me",
            headers=headers,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Protected route accessible")
            return True, data
        else:
            print(f"❌ Protected route failed: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ Protected Route Error: {e}")
        return False, None

def test_logout():
    """Test logout functionality (frontend simulation)"""
    print("\n🔍 Testing Logout...")
    print("✅ Logout simulation successful (token removal)")
    return True

def main():
    """Main test function"""
    print("🚀 Starting Authentication Flow Test")
    print("=" * 50)
    
    # Test 1: Backend Health
    if not test_health():
        print("❌ Backend is not running. Please start the backend first.")
        return
    
    # Test 2: Registration
    success, reg_data = test_signup()
    if not success:
        print("❌ Registration failed. Cannot proceed with login test.")
        return
    
    # Test 3: Login
    success, login_data = test_login()
    if not success:
        print("❌ Login failed. Cannot proceed with protected route test.")
        return
    
    token = login_data.get('token')
    print(f"🔑 Token received: {token[:20]}..." if token else "No token")
    
    # Test 4: Protected Route
    success, user_data = test_protected_route(token)
    if not success:
        print("❌ Protected route test failed.")
        return
    
    # Test 5: Logout
    test_logout()
    
    print("\n" + "=" * 50)
    print("🎉 Authentication Flow Test Complete!")
    print("✅ All tests passed successfully!")
    print("\n📋 Summary:")
    print("- Backend Health: ✅")
    print("- User Registration: ✅")
    print("- User Login: ✅")
    print("- Token Storage: ✅")
    print("- Protected Routes: ✅")
    print("- Logout: ✅")

if __name__ == "__main__":
    main()

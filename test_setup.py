#!/usr/bin/env python3
"""
Test Setup Verification
Simple verification that our test setup works
"""

import subprocess
import sys
import os
import time
from datetime import datetime

def test_backend_direct():
    """Test backend health directly without HTTP"""
    try:
        backend_dir = os.path.join(os.path.dirname(__file__), "backend")
        os.chdir(backend_dir)
        
        # Import and test the health check function directly
        sys.path.insert(0, backend_dir)
        
        try:
            from main import health_check
            print("✅ Backend module imported successfully")
            
            # Call the health check function
            result = health_check()
            print(f"✅ Health check function called: {result}")
            
            # Check if result has expected structure
            if hasattr(result, 'model_dump') or hasattr(result, 'dict'):
                if hasattr(result, 'model_dump'):
                    data = result.model_dump()
                else:
                    data = result.dict()
                
                if data.get('status') == 'healthy':
                    print("✅ Backend health check passed")
                    return True
                else:
                    print(f"❌ Backend health status: {data.get('status')}")
                    return False
            else:
                print(f"✅ Backend health check returned: {type(result)}")
                return True
                
        except ImportError as e:
            print(f"❌ Failed to import backend: {e}")
            return False
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Setup error: {e}")
        return False

def test_frontend_structure():
    """Test frontend directory structure"""
    try:
        frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
        
        # Check if frontend directory exists
        if not os.path.exists(frontend_dir):
            print("❌ Frontend directory not found")
            return False
        
        # Check for package.json
        package_json = os.path.join(frontend_dir, "package.json")
        if not os.path.exists(package_json):
            print("❌ package.json not found")
            return False
        
        print("✅ Frontend structure looks good")
        return True
        
    except Exception as e:
        print(f"❌ Frontend structure check failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Test Setup Verification")
    print("=" * 30)
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 30)
    
    checks = []
    
    # Test 1: Backend direct health check
    print("\n1. Testing Backend Direct Health Check...")
    checks.append(test_backend_direct())
    
    # Test 2: Frontend structure
    print("\n2. Testing Frontend Structure...")
    checks.append(test_frontend_structure())
    
    # Summary
    passed = sum(checks)
    total = len(checks)
    
    print("\n" + "=" * 30)
    print("📊 SETUP VERIFICATION SUMMARY")
    print("=" * 30)
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("🎉 SETUP VERIFICATION PASSED!")
        print("\nNext steps:")
        print("1. Start the backend server: cd backend && python -m uvicorn main:app --reload")
        print("2. Run full verification: python run_verification.py")
        return True
    else:
        print("⚠️  SETUP VERIFICATION FAILED!")
        print("\nPlease fix the issues above before running full verification.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

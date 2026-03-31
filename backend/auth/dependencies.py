"""
Authentication Dependencies
Handles JWT token verification and user authentication
"""

from fastapi import Depends, HTTPException, status, WebSocket
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, Optional
import logging
from bson import ObjectId

from services.auth_service import auth_service
from services.token_blacklist_service import get_token_blacklist_service
from services.security_logger import get_security_logger, SecurityEventType
from database.mongodb import get_database

logger = logging.getLogger(__name__)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Initialize security services
token_blacklist = get_token_blacklist_service()
security_logger = get_security_logger()

async def get_current_user_ws(websocket: WebSocket, token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Get current user for WebSocket connection"""
    if not token:
        # Check query parameters
        token = websocket.query_params.get("token")
    
    if not token:
        # Check headers
        token = websocket.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            token = token.replace("Bearer ", "")
            
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
        
    try:
        # Check if token is blacklisted
        if token_blacklist.is_token_blacklisted(token):
            security_logger.log_security_event(
                SecurityEventType.TOKEN_BLACKLISTED,
                {
                    "action": "websocket_auth_attempt",
                    "token_type": "access"
                },
                severity="WARNING"
            )
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        
        # Verify token
        payload = auth_service.verify_token(token, "access")
        user_id = payload["sub"]
        
        # Get user from database
        db = await get_database()
        user = await db.users.find_one({"_id": user_id})
        
        if not user or not user.get("is_active", True):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        
        # Check if user is blacklisted
        if token_blacklist.is_user_blacklisted(user_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
            
        return {
            "sub": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Get current user from JWT token"""
    try:
        # Check if token is blacklisted
        if token_blacklist.is_token_blacklisted(token):
            security_logger.log_security_event(
                SecurityEventType.TOKEN_BLACKLISTED,
                {
                    "action": "http_auth_attempt",
                    "token_type": "access"
                },
                severity="WARNING"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been invalidated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify token
        payload = auth_service.verify_token(token, "access")
        user_id = payload["sub"]
        
        # Get user from database
        db = await get_database()
        
        # Convert string ID to ObjectId for MongoDB query
        try:
            user_id_object = ObjectId(user_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID format",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = await db.users.find_one({"_id": user_id_object})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is blacklisted
        if token_blacklist.is_user_blacklisted(user_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account temporarily suspended",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Return user data
        result = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "role_track": user.get("role_track", "general"),
            "is_verified": user.get("is_verified", False),
            "points": user.get("points", 0),
            "level": user.get("level", 1),
            "badges": user.get("badges", []),
            "login_streak": user.get("login_streak", 0),
            "last_login": user.get("last_login"),
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at")
        }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_active_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Get current active user"""
    if not current_user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def get_current_verified_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Get current verified user"""
    if not current_user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not verified"
        )
    return current_user

async def get_current_admin_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Get current admin user"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_current_instructor_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Get current instructor user"""
    if current_user.get("role") not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[Dict[str, Any]]:
    """Get current user if token is provided, otherwise return None"""
    if not token:
        return None
    
    try:
        # This would be an async function, but for optional we need to handle it differently
        # For now, return None and let the calling function handle async verification
        return None
    except Exception:
        return None

# Role-based access control
class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if current_user.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user

# Predefined role checkers
require_admin = RoleChecker(["admin"])
require_instructor = RoleChecker(["instructor", "admin"])
require_student = RoleChecker(["student", "instructor", "admin"])

# Permission-based access control
class PermissionChecker:
    def __init__(self, required_permissions: list):
        self.required_permissions = required_permissions
    
    def __call__(self, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        # This would be implemented based on your permission system
        # For now, just check role-based permissions
        user_role = current_user.get("role", "student")
        
        # Define role permissions
        role_permissions = {
            "student": ["read_own_profile", "submit_problems", "view_courses"],
            "instructor": ["read_own_profile", "submit_problems", "view_courses", "manage_courses", "view_analytics"],
            "admin": ["read_own_profile", "submit_problems", "view_courses", "manage_courses", "view_analytics", "manage_users", "system_admin"]
        }
        
        user_permissions = role_permissions.get(user_role, [])
        
        # Check if user has required permissions
        if not any(perm in user_permissions for perm in self.required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        return current_user

# Predefined permission checkers
require_profile_read = PermissionChecker(["read_own_profile"])
require_problem_submit = PermissionChecker(["submit_problems"])
require_course_manage = PermissionChecker(["manage_courses"])
require_user_manage = PermissionChecker(["manage_users"])
require_system_admin = PermissionChecker(["system_admin"])

# Rate limiting for auth endpoints
from datetime import datetime, timedelta, timezone
import asyncio
from typing import Dict

# Simple in-memory rate limiter (for production, use Redis)
class AuthRateLimiter:
    def __init__(self):
        self.requests: Dict[str, list] = {}
        self.max_requests = 5  # Max requests per window
        self.window_minutes = 15  # Time window in minutes
    
    async def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed based on rate limit"""
        now = datetime.now(timezone.utc)
        
        # Clean old requests
        if identifier in self.requests:
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if now - req_time < timedelta(minutes=self.window_minutes)
            ]
        else:
            self.requests[identifier] = []
        
        # Check if under limit
        if len(self.requests[identifier]) < self.max_requests:
            self.requests[identifier].append(now)
            return True
        
        return False

# Global rate limiter instance
auth_rate_limiter = AuthRateLimiter()

# Rate limiting decorator
async def rate_limit_auth(identifier: str):
    """Rate limiting for auth endpoints"""
    if not await auth_rate_limiter.is_allowed(identifier):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )

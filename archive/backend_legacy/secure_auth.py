from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta

from ..services.security import security, get_current_user, get_current_user_optional
from ..services.rate_limiter import user_rate_limiter, RateLimitExceeded
from ..services.input_sanitizer import SanitizedUserCreate, SanitizedBaseModel
from ..database.mongodb import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])

# Pydantic models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False
    captcha_token: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user: Dict[str, Any]

class RegisterRequest(SanitizedUserCreate):
    confirm_password: str
    captcha_token: Optional[str] = None
    agree_terms: bool = True
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class PasswordResetRequest(BaseModel):
    email: EmailStr
    captcha_token: Optional[str] = None

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class SessionInfo(BaseModel):
    session_id: str
    created_at: str
    last_accessed: str
    ip_address: Optional[str]
    user_agent: Optional[str]

# Helper functions
async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email from database"""
    db = await get_database()
    user = await db.users.find_one({"email": email})
    return user

async def create_user(user_data: Dict[str, Any]) -> str:
    """Create user in database"""
    db = await get_database()
    
    # Hash password
    hashed_password = security.hash_password(user_data["password"])
    user_data["password"] = hashed_password
    
    # Add timestamps
    user_data["created_at"] = datetime.utcnow()
    user_data["updated_at"] = datetime.utcnow()
    user_data["is_active"] = True
    user_data["email_verified"] = False
    
    # Insert user
    result = await db.users.insert_one(user_data)
    return str(result.inserted_id)

async def update_user(user_id: str, update_data: Dict[str, Any]):
    """Update user in database"""
    db = await get_database()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.users.update_one(
        {"_id": user_id},
        {"$set": update_data}
    )

async def log_auth_event(event_type: str, user_id: Optional[str], details: Dict[str, Any]):
    """Log authentication event"""
    await security.log_security_event(event_type, {
        "user_id": user_id,
        **details
    })

# Authentication endpoints
@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(get_current_user_optional)
):
    """User login with enhanced security"""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent", "")
    
    # Check if user is already authenticated
    if credentials:
        await log_auth_event("login_while_authenticated", None, {
            "client_ip": client_ip,
            "user_agent": user_agent
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already authenticated"
        )
    
    # Check rate limiting
    try:
        allowed, retry_after = await user_rate_limiter.check_user_rate_limit(
            login_data.email, "login", 5, 900  # 5 attempts per 15 minutes
        )
        
        if not allowed:
            await log_auth_event("login_rate_limit_exceeded", None, {
                "email": login_data.email,
                "client_ip": client_ip,
                "retry_after": retry_after
            })
            raise RateLimitExceeded(5, 900, retry_after)
    except RateLimitExceeded:
        raise
    except Exception as e:
        logger.error(f"Rate limiting error: {e}")
    
    # Check if account is locked
    is_locked, unlock_time = await security.is_account_locked(login_data.email)
    if is_locked:
        await log_auth_event("login_attempt_locked_account", None, {
            "email": login_data.email,
            "client_ip": client_ip,
            "unlock_time": unlock_time
        })
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is temporarily locked. Try again in {unlock_time} seconds"
        )
    
    # Get user from database
    user = await get_user_by_email(login_data.email)
    if not user:
        await security.track_failed_login(login_data.email, client_ip)
        await log_auth_event("login_failed_invalid_email", None, {
            "email": login_data.email,
            "client_ip": client_ip
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        await log_auth_event("login_attempt_inactive_user", str(user["_id"]), {
            "client_ip": client_ip
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Verify password
    if not security.verify_password(login_data.password, user["password"]):
        await security.track_failed_login(login_data.email, client_ip)
        await log_auth_event("login_failed_invalid_password", str(user["_id"]), {
            "client_ip": client_ip
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Reset failed login attempts
    await security.reset_failed_login(login_data.email)
    
    # Create tokens
    access_token = security.create_access_token(
        data={"sub": str(user["_id"]), "email": user["email"], "role": user.get("role", "student")}
    )
    
    refresh_token = security.create_refresh_token(
        data={"sub": str(user["_id"]), "email": user["email"]}
    )
    
    # Create session
    session_id = await security.create_session(str(user["_id"]), {
        "ip_address": client_ip,
        "user_agent": user_agent,
        "remember_me": login_data.remember_me
    })
    
    # Update last login
    await update_user(str(user["_id"]), {
        "last_login": datetime.utcnow(),
        "last_login_ip": client_ip
    })
    
    # Log successful login
    await log_auth_event("login_successful", str(user["_id"]), {
        "client_ip": client_ip,
        "session_id": session_id
    })
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=security.access_token_expire_minutes * 60,
        user={
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "student"),
            "role_track": user.get("role_track", "general"),
            "avatar_url": user.get("avatar_url"),
            "email_verified": user.get("email_verified", False),
            "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
            "last_login": user.get("last_login").isoformat() if user.get("last_login") else None
        }
    )

@router.post("/register")
async def register(
    request: Request,
    register_data: RegisterRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(get_current_user_optional)
):
    """User registration with enhanced security"""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent", "")
    
    # Check if user is already authenticated
    if credentials:
        await log_auth_event("register_while_authenticated", None, {
            "client_ip": client_ip,
            "user_agent": user_agent
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already authenticated"
        )
    
    # Check rate limiting
    try:
        allowed, retry_after = await user_rate_limiter.check_user_rate_limit(
            register_data.email, "register", 3, 3600  # 3 attempts per hour
        )
        
        if not allowed:
            await log_auth_event("register_rate_limit_exceeded", None, {
                "email": register_data.email,
                "client_ip": client_ip,
                "retry_after": retry_after
            })
            raise RateLimitExceeded(3, 3600, retry_after)
    except RateLimitExceeded:
        raise
    except Exception as e:
        logger.error(f"Rate limiting error: {e}")
    
    # Validate password strength
    password_issues = security.validate_password_strength(
        register_data.password,
        {"email": register_data.email, "name": register_data.name}
    )
    
    if password_issues:
        await log_auth_event("register_weak_password", None, {
            "email": register_data.email,
            "client_ip": client_ip,
            "issues": password_issues
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Password validation failed", "issues": password_issues}
        )
    
    # Check if user already exists
    existing_user = await get_user_by_email(register_data.email)
    if existing_user:
        await log_auth_event("register_duplicate_email", None, {
            "email": register_data.email,
            "client_ip": client_ip
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate terms agreement
    if not register_data.agree_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must agree to the terms of service"
        )
    
    # Create user
    try:
        user_data = {
            "email": register_data.email,
            "name": register_data.name,
            "password": register_data.password,
            "role": "student",
            "role_track": "general",
            "points": 0,
            "level": 1,
            "login_streak": 0,
            "is_active": True,
            "email_verified": False
        }
        
        user_id = await create_user(user_data)
        
        # Log successful registration
        await log_auth_event("register_successful", user_id, {
            "client_ip": client_ip
        })
        
        # TODO: Send verification email
        # await send_verification_email(register_data.email)
        
        return {
            "message": "Registration successful",
            "user_id": user_id,
            "email_verification_required": True
        }
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        await log_auth_event("register_failed", None, {
            "email": register_data.email,
            "client_ip": client_ip,
            "error": str(e)
        })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/refresh")
async def refresh_token(refresh_data: RefreshTokenRequest):
    """Refresh access token"""
    try:
        # Verify refresh token
        payload = security.verify_token(refresh_data.refresh_token, "refresh")
        
        # Get user from database
        db = await get_database()
        user = await db.users.find_one({"_id": payload["sub"]})
        
        if not user or not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Create new access token
        access_token = security.create_access_token(
            data={
                "sub": str(user["_id"]), 
                "email": user["email"], 
                "role": user.get("role", "student")
            }
        )
        
        await log_auth_event("token_refreshed", str(user["_id"]), {})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": security.access_token_expire_minutes * 60
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        await log_auth_event("token_refresh_failed", None, {"error": str(e)})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout(
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """User logout"""
    client_ip = request.client.host if request.client else "unknown"
    
    try:
        # Get session from request (if available)
        session_id = request.headers.get("X-Session-ID")
        
        if session_id:
            await security.revoke_session(session_id)
        
        # Log logout
        await log_auth_event("logout", current_user["sub"], {
            "client_ip": client_ip,
            "session_id": session_id
        })
        
        return {"message": "Logout successful"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.post("/password-reset-request")
async def request_password_reset(
    request: Request,
    reset_data: PasswordResetRequest
):
    """Request password reset"""
    client_ip = request.client.host if request.client else "unknown"
    
    # Check rate limiting
    try:
        allowed, retry_after = await user_rate_limiter.check_user_rate_limit(
            reset_data.email, "password_reset", 3, 3600  # 3 attempts per hour
        )
        
        if not allowed:
            await log_auth_event("password_reset_rate_limit_exceeded", None, {
                "email": reset_data.email,
                "client_ip": client_ip,
                "retry_after": retry_after
            })
            raise RateLimitExceeded(3, 3600, retry_after)
    except RateLimitExceeded:
        raise
    except Exception as e:
        logger.error(f"Rate limiting error: {e}")
    
    # Get user
    user = await get_user_by_email(reset_data.email)
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Create reset token
    reset_token = await security.create_password_reset_token(
        str(user["_id"]), 
        user["email"]
    )
    
    # TODO: Send password reset email
    # await send_password_reset_email(user["email"], reset_token)
    
    await log_auth_event("password_reset_requested", str(user["_id"]), {
        "client_ip": client_ip
    })
    
    return {"message": "If the email exists, a password reset link has been sent"}

@router.post("/password-reset-confirm")
async def confirm_password_reset(reset_data: PasswordResetConfirm):
    """Confirm password reset"""
    # Validate reset token
    token_data = await security.validate_password_reset_token(reset_data.token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Validate new password
    password_issues = security.validate_password_strength(reset_data.new_password)
    if password_issues:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Password validation failed", "issues": password_issues}
        )
    
    try:
        # Update user password
        hashed_password = security.hash_password(reset_data.new_password)
        await update_user(token_data["user_id"], {
            "password": hashed_password,
            "password_changed_at": datetime.utcnow()
        })
        
        # Invalidate reset token
        await security.invalidate_password_reset_token(reset_data.token)
        
        # Revoke all sessions for this user
        await security.revoke_all_user_sessions(token_data["user_id"])
        
        await log_auth_event("password_reset_completed", token_data["user_id"], {})
        
        return {"message": "Password has been reset successfully"}
        
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Change password (authenticated user)"""
    # Get user from database
    db = await get_database()
    user = await db.users.find_one({"_id": current_user["sub"]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not security.verify_password(password_data.current_password, user["password"]):
        await log_auth_event("change_password_invalid_current", str(user["_id"]), {})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    password_issues = security.validate_password_strength(password_data.new_password)
    if password_issues:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Password validation failed", "issues": password_issues}
        )
    
    # Check if new password is same as current
    if security.verify_password(password_data.new_password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    try:
        # Update password
        hashed_password = security.hash_password(password_data.new_password)
        await update_user(str(user["_id"]), {
            "password": hashed_password,
            "password_changed_at": datetime.utcnow()
        })
        
        # Revoke all sessions except current
        await security.revoke_all_user_sessions(str(user["_id"]))
        
        await log_auth_event("password_changed", str(user["_id"]), {})
        
        return {"message": "Password changed successfully"}
        
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )

@router.get("/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information"""
    try:
        db = await get_database()
        user = await db.users.find_one({"_id": current_user["sub"]})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "student"),
            "role_track": user.get("role_track", "general"),
            "avatar_url": user.get("avatar_url"),
            "bio": user.get("bio"),
            "points": user.get("points", 0),
            "level": user.get("level", 1),
            "login_streak": user.get("login_streak", 0),
            "email_verified": user.get("email_verified", False),
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
            "updated_at": user.get("updated_at").isoformat() if user.get("updated_at") else None,
            "last_login": user.get("last_login").isoformat() if user.get("last_login") else None,
            "password_changed_at": user.get("password_changed_at").isoformat() if user.get("password_changed_at") else None
        }
        
    except Exception as e:
        logger.error(f"Get user info error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )

@router.get("/sessions", response_model=list[SessionInfo])
async def get_user_sessions(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get user's active sessions"""
    try:
        sessions = await security.get_user_sessions(current_user["sub"])
        
        return [
            SessionInfo(
                session_id=session["session_id"],
                created_at=session["created_at"],
                last_accessed=session["last_accessed"],
                ip_address=session.get("ip_address"),
                user_agent=session.get("user_agent")
            )
            for session in sessions
        ]
        
    except Exception as e:
        logger.error(f"Get sessions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get sessions"
        )

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Revoke a specific session"""
    try:
        # Verify session belongs to current user
        session = await security.get_session(session_id)
        if not session or session.get("user_id") != current_user["sub"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        await security.revoke_session(session_id)
        
        await log_auth_event("session_revoked", current_user["sub"], {
            "session_id": session_id
        })
        
        return {"message": "Session revoked successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Revoke session error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke session"
        )

@router.delete("/sessions")
async def revoke_all_sessions(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Revoke all user sessions"""
    try:
        await security.revoke_all_user_sessions(current_user["sub"])
        
        await log_auth_event("all_sessions_revoked", current_user["sub"], {})
        
        return {"message": "All sessions revoked successfully"}
        
    except Exception as e:
        logger.error(f"Revoke all sessions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke sessions"
        )

"""
Authentication API Router
Handles user authentication, password reset, email verification, and token management
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import hashlib
import logging
from bson import ObjectId
import time

from services.auth_service import auth_service
from services.email_service import (
    get_email_delivery_status,
    send_verification_email as send_verification_email_message,
    send_password_reset_email as send_password_reset_email_message,
    send_login_otp_email as send_login_otp_email_message,
)
from services.token_blacklist_service import get_token_blacklist_service
from services.auth_rate_limiter import get_auth_rate_limiter
from services.security_logger import get_security_logger, SecurityEventType
from database.mongodb import get_database
from auth.dependencies import get_current_user, get_current_admin_user

logger = logging.getLogger(__name__)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Pydantic Models
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, max_length=100)
    role_track: Optional[str] = Field("general", description="Learning track")
    agree_terms: bool = Field(True, description="Agree to terms and conditions")
    
    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str):
        is_valid, errors = auth_service.validate_password_strength(value)
        if not is_valid:
            raise ValueError(f"Password validation failed: {', '.join(errors)}")
        return value
    
    @field_validator("email")
    @classmethod
    def validate_email_format(cls, value: str):
        if not auth_service.validate_email_format(value):
            raise ValueError("Invalid email format")
        return value

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Password")
    remember_me: Optional[bool] = Field(False, description="Remember me for longer session")

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]
    message: Optional[str] = None
    warning: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address")

class PasswordResetConfirm(BaseModel):
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str):
        is_valid, errors = auth_service.validate_password_strength(value)
        if not is_valid:
            raise ValueError(f"Password validation failed: {', '.join(errors)}")
        return value

class EmailVerificationRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address")

class EmailVerificationConfirm(BaseModel):
    token: str = Field(..., description="Email verification token")

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str):
        is_valid, errors = auth_service.validate_password_strength(value)
        if not is_valid:
            raise ValueError(f"Password validation failed: {', '.join(errors)}")
        return value

class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token")

class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = Field(None, description="Updated email address")
    phone: Optional[str] = Field(None, max_length=30)
    location: Optional[str] = Field(None, max_length=120)
    bio: Optional[str] = Field(None, max_length=1000)
    avatar: Optional[str] = None
    role_track: Optional[str] = Field(None, description="Learning track")

router = APIRouter(tags=["Authentication"])

# Initialize security services
token_blacklist = get_token_blacklist_service()
auth_rate_limiter = get_auth_rate_limiter()
security_logger = get_security_logger()

def get_client_ip(request: Request) -> str:
    """Extract client IP from request"""
    # Check for forwarded IP headers
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    return request.client.host if request.client else "unknown"


def utc_now() -> datetime:
    """Return current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


def ensure_utc(value: datetime) -> datetime:
    """Normalize possibly naive datetimes to UTC-aware."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def hash_token_for_storage(token: str) -> str:
    """Store password-reset and verification tokens with a deterministic hash for lookup."""
    return hashlib.sha256(token.encode()).hexdigest()


def email_demo_mode_message(feature_label: str) -> str:
    return f"Email service not configured (demo mode). {feature_label}"


def is_login_otp_required() -> bool:
    import os as _os

    return not (
        _os.getenv("DEV_SKIP_OTP", "false").lower() == "true"
        or _os.getenv("ENVIRONMENT", "production").lower() == "development"
    )


@router.get("/runtime-status")
async def get_auth_runtime_status():
    """Return environment-dependent auth/runtime feature availability for the frontend."""
    email_status = get_email_delivery_status()

    from routers.google_auth import _google_oauth_status

    google_status = _google_oauth_status()
    otp_required = is_login_otp_required()

    return {
        "email_service": {
            "configured": bool(email_status["configured"]),
            "mode": "live" if email_status["configured"] else "demo",
            "message": (
                "Email service is available."
                if email_status["configured"]
                else "Email service not configured (demo mode)."
            ),
        },
        "google_oauth": {
            "configured": bool(google_status["configured"]),
            "mode": "live" if google_status["configured"] else "demo",
            "message": (
                "Google sign-in is available."
                if google_status["configured"]
                else "Google sign-in unavailable in demo."
            ),
        },
        "login_otp": {
            "required": otp_required,
            "mode": "live" if otp_required and email_status["configured"] else "demo",
            "message": (
                "Email login verification is enabled."
                if otp_required and email_status["configured"]
                else "Login verification email is running in demo mode."
            ),
        },
    }

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister, request: Request):
    """Register a new user"""
    try:
        # Get client IP for rate limiting
        client_ip = get_client_ip(request)
        
        # Check rate limit
        rate_limit_result = auth_rate_limiter.check_rate_limit(client_ip, "register")
        if not rate_limit_result.get("allowed", True):
            security_logger.log_security_event(
                SecurityEventType.RATE_LIMIT_EXCEEDED,
                {
                    "ip": client_ip,
                    "action": "register",
                    "email": user_data.email,
                    "limit": rate_limit_result.get("limit"),
                    "retry_after": rate_limit_result.get("retry_after")
                },
                severity="WARNING"
            )
            raise HTTPException(
                status_code=429,
                detail="Too many registration attempts. Please try again later.",
                headers={"Retry-After": str(rate_limit_result.get("retry_after", 3600))}
            )
        
        db = await get_database()
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            # Log failed registration attempt
            security_logger.log_security_event(
                SecurityEventType.REGISTER_FAILED,
                {
                    "ip": client_ip,
                    "email": user_data.email,
                    "reason": "user_exists",
                    "user_id": str(existing_user["_id"])
                },
                severity="INFO"
            )
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )
        
        # Hash password
        password_hash = auth_service.hash_password(user_data.password)
        
        # Create user
        user_doc = {
            "name": user_data.name,
            "email": user_data.email,
            "password_hash": password_hash,
            "role": "student",
            "role_track": user_data.role_track,
            "is_active": True,
            "is_verified": False,  # Email verification required
            "points": 0,
            "level": 1,
            "badges": [],
            "login_streak": 0,
            "preferences": {},
            "progress": {},
            "created_at": utc_now(),
            "updated_at": utc_now(),
            "registration_ip": client_ip
        }
        
        # Insert user
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        verification_warning = None
        email_status = get_email_delivery_status()

        if email_status["configured"]:
            token, expires_at = auth_service.create_email_verification_token(user_id, user_data.email)
            verification_doc = {
                "user_id": user_id,
                "email": user_data.email,
                "token_hash": hash_token_for_storage(token),
                "expires_at": expires_at,
                "created_at": utc_now(),
                "used": False
            }
            verification_insert = await db.email_verifications.insert_one(verification_doc)
            email_sent = await send_verification_email_message(user_data.email, token, user_data.name)

            if not email_sent:
                await db.email_verifications.delete_one({"_id": verification_insert.inserted_id})
                verification_warning = (
                    "Email verification is running in demo mode. "
                    "Your account was created, but verification emails are not enabled right now."
                )
        else:
            verification_warning = email_demo_mode_message(
                "Your account was created, but verification emails are unavailable in this environment."
            )
        
        # Create tokens
        token_data = {
            "sub": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "role": "student",
            "role_track": user_data.role_track
        }
        
        access_token = auth_service.create_access_token(token_data)
        refresh_token = auth_service.create_refresh_token(token_data)
        
        # Get user data for response
        user_response = {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "role": "student",
            "role_track": user_data.role_track,
            "is_verified": False,
            "points": 0,
            "level": 1,
            "badges": [],
            "login_streak": 0,
            "created_at": user_doc["created_at"]
        }
        
        # Log successful registration
        security_logger.log_security_event(
            SecurityEventType.REGISTER_SUCCESS,
            {
                "ip": client_ip,
                "user_id": user_id,
                "email": user_data.email,
                "name": user_data.name
            },
            severity="INFO"
        )
        
        # Record successful attempt
        auth_rate_limiter.record_attempt(client_ip, "register", success=True)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=auth_service.access_token_expire_minutes * 60,
            user=user_response,
            message="Account created successfully",
            warning=verification_warning
        )
        
    except HTTPException:
        # Record failed attempt
        auth_rate_limiter.record_attempt(client_ip, "register", success=False)
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        # Record failed attempt
        auth_rate_limiter.record_attempt(client_ip, "register", success=False)
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login")
async def login(user_data: UserLogin, request: Request):
    """Login user and return tokens"""
    try:
        # Get client IP for rate limiting
        client_ip = get_client_ip(request)
        
        # Check rate limit
        rate_limit_result = auth_rate_limiter.check_rate_limit(client_ip, "login")
        if not rate_limit_result.get("allowed", True):
            security_logger.log_security_event(
                SecurityEventType.RATE_LIMIT_EXCEEDED,
                {
                    "ip": client_ip,
                    "action": "login",
                    "email": user_data.email,
                    "limit": rate_limit_result.get("limit"),
                    "retry_after": rate_limit_result.get("retry_after")
                },
                severity="WARNING"
            )
            raise HTTPException(
                status_code=429,
                detail="Too many login attempts. Please try again later.",
                headers={"Retry-After": str(rate_limit_result.get("retry_after", 900))}
            )
        
        db = await get_database()
        
        # Find user
        user = await db.users.find_one({"email": user_data.email})
        if not user:
            # Log failed login attempt
            security_logger.log_security_event(
                SecurityEventType.LOGIN_FAILED,
                {
                    "ip": client_ip,
                    "email": user_data.email,
                    "reason": "user_not_found"
                },
                severity="INFO"
            )
            # Record failed attempt
            auth_rate_limiter.record_attempt(client_ip, "login", success=False)
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Check if user is active
        if not user.get("is_active", True):
            security_logger.log_security_event(
                SecurityEventType.LOGIN_FAILED,
                {
                    "ip": client_ip,
                    "user_id": str(user["_id"]),
                    "email": user_data.email,
                    "reason": "account_deactivated"
                },
                severity="WARNING"
            )
            # Record failed attempt
            auth_rate_limiter.record_attempt(client_ip, "login", success=False)
            raise HTTPException(
                status_code=401,
                detail="Account is deactivated"
            )
        
        # Check if user is blacklisted (skip in development mode)
        import os as _os_login
        _is_dev = _os_login.getenv("ENVIRONMENT", "production").lower() == "development"
        user_blacklist_entry = token_blacklist.get_user_blacklist_entry(str(user["_id"]))
        if user_blacklist_entry and user_blacklist_entry.get("reason") == "logout":
            token_blacklist.clear_user_blacklist(str(user["_id"]))
            user_blacklist_entry = None

        if not _is_dev and token_blacklist.is_user_blacklisted(str(user["_id"])):
            security_logger.log_security_event(
                SecurityEventType.LOGIN_FAILED,
                {
                    "ip": client_ip,
                    "user_id": str(user["_id"]),
                    "email": user_data.email,
                    "reason": "user_blacklisted"
                },
                severity="WARNING"
            )
            # Record failed attempt
            auth_rate_limiter.record_attempt(client_ip, "login", success=False)
            raise HTTPException(
                status_code=401,
                detail="Account temporarily suspended"
            )
        
        # Verify password
        if not auth_service.verify_password(user_data.password, user["password_hash"]):
            security_logger.log_security_event(
                SecurityEventType.LOGIN_FAILED,
                {
                    "ip": client_ip,
                    "user_id": str(user["_id"]),
                    "email": user_data.email,
                    "reason": "invalid_password"
                },
                severity="INFO"
            )
            # Record failed attempt
            auth_rate_limiter.record_attempt(client_ip, "login", success=False)
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Update last login
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "last_login": utc_now(),
                    "updated_at": utc_now(),
                    "last_login_ip": client_ip
                },
                "$inc": {"login_count": 1}
            }
        )
        
        # Create tokens
        access_payload = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "role_track": user["role_track"]
        }
        
        access_token = auth_service.create_access_token(access_payload)
        refresh_token = auth_service.create_refresh_token(access_payload)
        
        # Get user data for response
        user_response = {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "role_track": user["role_track"],
            "is_verified": user.get("is_verified", False),
            "points": user.get("points", 0),
            "level": user.get("level", 1),
            "badges": user.get("badges", []),
            "login_streak": user.get("login_streak", 0),
            "last_login": user.get("last_login"),
            "created_at": user["created_at"]
        }
        
        # Log successful login
        security_logger.log_security_event(
            SecurityEventType.LOGIN_SUCCESS,
            {
                "ip": client_ip,
                "user_id": str(user["_id"]),
                "email": user["email"],
                "name": user["name"],
                "remember_me": user_data.remember_me
            },
            severity="INFO"
        )
        
        # Record successful attempt
        auth_rate_limiter.record_attempt(client_ip, "login", success=True)
        
        # --- LOGIN OTP INTEGRATION ---
        # In development mode, skip OTP and return tokens directly
        import os as _os
        _skip_otp = (
            _os.getenv("DEV_SKIP_OTP", "false").lower() == "true"
            or _os.getenv("ENVIRONMENT", "production").lower() == "development"
        )

        if _skip_otp:
            # Development: return tokens immediately (no OTP needed)
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": auth_service.access_token_expire_minutes * 60,
                "user": user_response,
                "requires_otp": False
            }

        # Production: send OTP via email
        email_status = get_email_delivery_status()
        if not email_status["configured"]:
            raise HTTPException(
                status_code=503,
                detail=email_demo_mode_message(
                    "Login verification emails are unavailable in this environment."
                )
            )

        import random
        otp = str(random.randint(100000, 999999))

        # Invalidate old OTPs for this email
        await db.login_otps.delete_many({"email": user["email"]})

        # Store new OTP
        await db.login_otps.insert_one({
            "email": user["email"],
            "otp_hash": auth_service.hash_password(otp),
            "expires_at": utc_now() + timedelta(minutes=5),
            "created_at": utc_now()
        })

        otp_sent = await send_login_otp_email_message(user["email"], otp, user["name"])
        if not otp_sent:
            await db.login_otps.delete_many({"email": user["email"]})
            raise HTTPException(
                status_code=503,
                detail="Login verification email could not be delivered. Please try again later."
            )

        # Return requires_otp flag instead of tokens
        return {
            "requires_otp": True,
            "email": user["email"],
            "message": "OTP sent to your email"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        # Record failed attempt
        auth_rate_limiter.record_attempt(client_ip, "login", success=False)
        raise HTTPException(status_code=500, detail="Login failed")



class VerifyLoginOTP(BaseModel):
    email: EmailStr
    otp: str

@router.post("/verify-login-otp", response_model=TokenResponse)
async def verify_login_otp(otp_data: VerifyLoginOTP, request: Request):
    """Verify login OTP and return actual tokens"""
    try:
        client_ip = get_client_ip(request)
        db = await get_database()
        
        otp_record = await db.login_otps.find_one({"email": otp_data.email})
        if not otp_record:
            raise HTTPException(status_code=400, detail="OTP expired or invalid")
            
        if utc_now() > ensure_utc(otp_record["expires_at"]):
            raise HTTPException(status_code=400, detail="OTP expired")
            
        if not auth_service.verify_password(otp_data.otp, otp_record["otp_hash"]):
            raise HTTPException(status_code=400, detail="Invalid OTP")
            
        await db.login_otps.delete_one({"_id": otp_record["_id"]})
        
        user = await db.users.find_one({"email": otp_data.email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "last_login": utc_now(),
                    "updated_at": utc_now(),
                    "last_login_ip": client_ip
                },
                "$inc": {"login_count": 1}
            }
        )
        
        access_payload = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "role_track": user["role_track"]
        }
        
        access_token = auth_service.create_access_token(access_payload)
        refresh_token = auth_service.create_refresh_token(access_payload)
        
        user_response = {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "role_track": user["role_track"],
            "is_verified": user.get("is_verified", False),
            "points": user.get("points", 0),
            "level": user.get("level", 1),
            "badges": user.get("badges", []),
            "login_streak": user.get("login_streak", 0),
            "created_at": user["created_at"]
        }
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=auth_service.access_token_expire_minutes * 60,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification error: {e}")
        raise HTTPException(status_code=500, detail="OTP verification failed")

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_data: RefreshTokenRequest, request: Request):
    """Refresh access token using refresh token"""
    try:
        # Get client IP for rate limiting
        client_ip = get_client_ip(request)
        
        # Check rate limit
        rate_limit_result = auth_rate_limiter.check_rate_limit(client_ip, "refresh")
        if not rate_limit_result.get("allowed", True):
            security_logger.log_security_event(
                SecurityEventType.RATE_LIMIT_EXCEEDED,
                {
                    "ip": client_ip,
                    "action": "refresh",
                    "limit": rate_limit_result.get("limit"),
                    "retry_after": rate_limit_result.get("retry_after")
                },
                severity="WARNING"
            )
            raise HTTPException(
                status_code=429,
                detail="Too many token refresh attempts. Please try again later.",
                headers={"Retry-After": str(rate_limit_result.get("retry_after", 3600))}
            )
        
        # Check if refresh token is blacklisted
        if token_blacklist.is_token_blacklisted(token_data.refresh_token):
            security_logger.log_security_event(
                SecurityEventType.TOKEN_BLACKLISTED,
                {
                    "ip": client_ip,
                    "action": "refresh_attempt_with_blacklisted_token"
                },
                severity="WARNING"
            )
            # Record failed attempt
            auth_rate_limiter.record_attempt(client_ip, "refresh", success=False)
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired refresh token"
            )
        
        # Verify refresh token
        payload = auth_service.verify_token(token_data.refresh_token, "refresh")
        user_id = payload["sub"]
        
        # Get user from database
        db = await get_database()
        
        # Convert string ID to ObjectId for MongoDB query
        try:
            user_id_object = ObjectId(user_id)
        except Exception:
            # Record failed attempt
            auth_rate_limiter.record_attempt(client_ip, "refresh", success=False)
            raise HTTPException(
                status_code=401,
                detail="Invalid user ID format"
            )
        
        user = await db.users.find_one({"_id": user_id_object})
        if not user:
            # Record failed attempt
            auth_rate_limiter.record_attempt(client_ip, "refresh", success=False)
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )
        
        # Check if user is still active
        if not user.get("is_active", True):
            # Record failed attempt
            auth_rate_limiter.record_attempt(client_ip, "refresh", success=False)
            raise HTTPException(
                status_code=401,
                detail="Account is deactivated"
            )
        
        # Check if user is blacklisted
        if token_blacklist.is_user_blacklisted(user_id):
            # Record failed attempt
            auth_rate_limiter.record_attempt(client_ip, "refresh", success=False)
            raise HTTPException(
                status_code=401,
                detail="Account temporarily suspended"
            )
        
        # Create new access token
        access_payload = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "role_track": user["role_track"]
        }
        
        access_token = auth_service.create_access_token(access_payload)
        
        # Get user data for response
        user_response = {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "role_track": user["role_track"],
            "is_verified": user.get("is_verified", False),
            "points": user.get("points", 0),
            "level": user.get("level", 1),
            "badges": user.get("badges", []),
            "login_streak": user.get("login_streak", 0),
            "created_at": user["created_at"]
        }
        
        # Log token refresh
        security_logger.log_security_event(
            SecurityEventType.TOKEN_REFRESH,
            {
                "ip": client_ip,
                "user_id": user_id,
                "email": user["email"]
            },
            severity="INFO"
        )
        
        # Record successful attempt
        auth_rate_limiter.record_attempt(client_ip, "refresh", success=True)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=token_data.refresh_token,  # Keep same refresh token
            expires_in=auth_service.access_token_expire_minutes * 60,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        # Record failed attempt
        auth_rate_limiter.record_attempt(client_ip, "refresh", success=False)
        raise HTTPException(status_code=401, detail="Token refresh failed")

@router.post("/password-reset-request")
async def request_password_reset(request: PasswordResetRequest):
    """Request password reset"""
    try:
        email_status = get_email_delivery_status()
        if not email_status["configured"]:
            raise HTTPException(
                status_code=503,
                detail=email_demo_mode_message(
                    "Password reset links are unavailable in this environment."
                )
            )

        db = await get_database()
        
        # Find user
        user = await db.users.find_one({"email": request.email})
        if not user:
            # Don't reveal if email exists or not
            return {"message": "If an account with that email exists, a password reset link has been sent."}
        
        # Check if user is active
        if not user.get("is_active", True):
            return {"message": "If an account with that email exists, a password reset link has been sent."}
        
        # Create reset token
        token, expires_at = auth_service.create_password_reset_token(str(user["_id"]), request.email)
        
        # Store reset token
        reset_doc = {
            "user_id": str(user["_id"]),
            "email": request.email,
            "token_hash": hash_token_for_storage(token),
            "expires_at": expires_at,
            "created_at": utc_now(),
            "used": False
        }
        await db.password_resets.insert_one(reset_doc)
        
        reset_sent = await send_password_reset_email_message(request.email, token, user["name"])
        if not reset_sent:
            await db.password_resets.delete_many({"email": request.email, "used": False})
            raise HTTPException(
                status_code=503,
                detail="Password reset email could not be delivered. Please try again later."
            )
        
        return {"message": "If an account with that email exists, a password reset link has been sent."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset request error: {e}")
        raise HTTPException(status_code=500, detail="Password reset request failed")

@router.post("/password-reset-confirm")
async def confirm_password_reset(request: PasswordResetConfirm):
    """Confirm password reset with token"""
    try:
        db = await get_database()
        
        # Find and verify reset token
        reset_record = await db.password_resets.find_one({"token_hash": hash_token_for_storage(request.token)})
        if not reset_record:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset token"
            )
        
        # Check if token is expired
        if auth_service.is_token_expired(reset_record["expires_at"]):
            raise HTTPException(
                status_code=400,
                detail="Reset token has expired"
            )
        
        # Check if token is already used
        if reset_record.get("used", False):
            raise HTTPException(
                status_code=400,
                detail="Reset token has already been used"
            )
        
        # Get user - user_id is stored as string, must convert to ObjectId
        try:
            user_object_id = ObjectId(reset_record["user_id"])
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        user = await db.users.find_one({"_id": user_object_id})
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        # Hash new password
        new_password_hash = auth_service.hash_password(request.new_password)
        
        # Update user password
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password_hash": new_password_hash,
                    "updated_at": utc_now()
                }
            }
        )
        
        # Mark token as used
        await db.password_resets.update_one(
            {"_id": reset_record["_id"]},
            {"$set": {"used": True, "used_at": utc_now()}}
        )
        
        # Send notification email
        await auth_service.send_password_changed_notification(user["email"], user["name"])
        
        return {"message": "Password has been reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset confirmation error: {e}")
        raise HTTPException(status_code=500, detail="Password reset failed")

@router.post("/verify-email-request")
async def request_email_verification(request: EmailVerificationRequest):
    """Request email verification"""
    try:
        email_status = get_email_delivery_status()
        if not email_status["configured"]:
            raise HTTPException(
                status_code=503,
                detail=email_demo_mode_message(
                    "Verification emails are unavailable in this environment."
                )
            )

        db = await get_database()
        
        # Find user
        user = await db.users.find_one({"email": request.email})
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Check if already verified
        if user.get("is_verified", False):
            return {"message": "Email is already verified"}
        
        # Create verification token
        token, expires_at = auth_service.create_email_verification_token(str(user["_id"]), request.email)
        
        # Store verification token
        verification_doc = {
            "user_id": str(user["_id"]),
            "email": request.email,
            "token_hash": hash_token_for_storage(token),
            "expires_at": expires_at,
            "created_at": utc_now(),
            "used": False
        }
        verification_insert = await db.email_verifications.insert_one(verification_doc)
        
        email_sent = await send_verification_email_message(request.email, token, user["name"])
        if not email_sent:
            await db.email_verifications.delete_one({"_id": verification_insert.inserted_id})
            raise HTTPException(
                status_code=503,
                detail="Verification email could not be delivered. Please try again later."
            )
        
        return {"message": "Verification email has been sent"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification request error: {e}")
        raise HTTPException(status_code=500, detail="Email verification request failed")

@router.post("/verify-email-confirm")
async def confirm_email_verification(request: EmailVerificationConfirm):
    """Confirm email verification with token"""
    try:
        db = await get_database()
        
        # Find and verify token
        verification_record = await db.email_verifications.find_one({"token_hash": hash_token_for_storage(request.token)})
        if not verification_record:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification token"
            )
        
        # Check if token is expired
        if auth_service.is_token_expired(verification_record["expires_at"]):
            raise HTTPException(
                status_code=400,
                detail="Verification token has expired"
            )
        
        # Check if token is already used
        if verification_record.get("used", False):
            raise HTTPException(
                status_code=400,
                detail="Verification token has already been used"
            )
        
        # Get user
        try:
            user_object_id = ObjectId(verification_record["user_id"])
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid verification token")

        user = await db.users.find_one({"_id": user_object_id})
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Mark user as verified
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "is_verified": True,
                    "updated_at": utc_now()
                }
            }
        )
        
        # Mark token as used
        await db.email_verifications.update_one(
            {"_id": verification_record["_id"]},
            {"$set": {"used": True, "used_at": utc_now()}}
        )
        
        return {"message": "Email has been verified successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification confirmation error: {e}")
        raise HTTPException(status_code=500, detail="Email verification failed")

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Change user password"""
    try:
        db = await get_database()
        
        # Get user
        user = await db.users.find_one({"_id": current_user["sub"]})
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Verify current password
        if not auth_service.verify_password(request.current_password, user["password_hash"]):
            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        new_password_hash = auth_service.hash_password(request.new_password)
        
        # Update password
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password_hash": new_password_hash,
                    "updated_at": utc_now()
                }
            }
        )
        
        # Send notification email
        await auth_service.send_password_changed_notification(user["email"], user["name"])
        
        return {"message": "Password has been changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(status_code=500, detail="Password change failed")

@router.get("/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information"""
    try:
        # Return user data from the already-processed current_user from get_current_user dependency
        result = {
            "id": current_user["sub"],
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user["role"],
            "role_track": current_user["role_track"],
            "is_verified": current_user.get("is_verified", False),
            "points": current_user.get("points", 0),
            "level": current_user.get("level", 1),
            "badges": current_user.get("badges", []),
            "login_streak": current_user.get("login_streak", 0),
            "last_login": current_user.get("last_login"),
            "created_at": current_user.get("created_at"),
            "updated_at": current_user.get("updated_at")
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Get user info error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user information")

@router.put("/me")
async def update_current_user_info(
    request: UserProfileUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update the current user's profile information"""
    try:
        db = await get_database()

        update_fields = {
            key: value
            for key, value in request.dict(exclude_unset=True).items()
            if value is not None
        }

        if not update_fields:
            return await get_current_user_info(current_user)

        update_fields["updated_at"] = utc_now()

        try:
            user_id_object = ObjectId(current_user["sub"])
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid user ID format") from exc

        if "email" in update_fields:
            existing_user = await db.users.find_one(
                {
                    "email": update_fields["email"],
                    "_id": {"$ne": user_id_object},
                }
            )
            if existing_user:
                raise HTTPException(status_code=400, detail="User with this email already exists")

        await db.users.update_one({"_id": user_id_object}, {"$set": update_fields})
        updated_user = await db.users.find_one({"_id": user_id_object})

        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": str(updated_user["_id"]),
            "name": updated_user["name"],
            "email": updated_user["email"],
            "role": updated_user["role"],
            "role_track": updated_user.get("role_track", "general"),
            "is_verified": updated_user.get("is_verified", False),
            "points": updated_user.get("points", 0),
            "level": updated_user.get("level", 1),
            "badges": updated_user.get("badges", []),
            "login_streak": updated_user.get("login_streak", 0),
            "last_login": updated_user.get("last_login"),
            "created_at": updated_user.get("created_at"),
            "updated_at": updated_user.get("updated_at"),
            "phone": updated_user.get("phone"),
            "location": updated_user.get("location"),
            "bio": updated_user.get("bio"),
            "avatar": updated_user.get("avatar"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update user info error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user information")

@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(get_current_user), request: Request = None):
    """Logout user and invalidate tokens"""
    try:
        # Get client IP for logging
        client_ip = get_client_ip(request) if request else "unknown"
        user_id = current_user["sub"]
        
        # Extract tokens from Authorization header if available
        access_token = None
        refresh_token = None
        
        if request:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                access_token = auth_header[7:]  # Remove "Bearer " prefix
        
        # Blacklist access token if available
        if access_token:
            success = token_blacklist.blacklist_token(
                access_token, 
                user_id, 
                reason="logout_access_token"
            )
            if not success:
                logger.warning(f"Failed to blacklist access token for user {user_id}")
        
        # Log successful logout
        security_logger.log_security_event(
            SecurityEventType.LOGOUT,
            {
                "ip": client_ip,
                "user_id": user_id,
                "email": current_user.get("email"),
                "access_token_blacklisted": access_token is not None,
                "all_tokens_invalidated": False
            },
            severity="INFO"
        )
        
        return {
            "message": "Logged out successfully",
            "tokens_invalidated": True,
            "timestamp": utc_now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        # Even if logout fails, we should still return success to the client
        # as the client should discard tokens anyway
        security_logger.log_security_event(
            SecurityEventType.LOGOUT,
            {
                "ip": client_ip,
                "user_id": current_user.get("sub"),
                "error": str(e),
                "partial_logout": True
            },
            severity="ERROR"
        )
        return {"message": "Logged out successfully"}

# Security and monitoring endpoints
@router.get("/security/stats")
async def get_security_stats(current_user: Dict[str, Any] = Depends(get_current_admin_user)):
    """Get security statistics (admin only)"""
    try:
        blacklist_stats = token_blacklist.get_blacklist_stats()
        rate_limit_stats = auth_rate_limiter.get_rate_limit_stats()
        security_stats = security_logger.get_security_stats(hours=24)
        
        return {
            "status": "healthy",
            "timestamp": utc_now().isoformat(),
            "token_blacklist": blacklist_stats,
            "rate_limiting": rate_limit_stats,
            "security_events": security_stats,
            "features": {
                "token_blacklisting": "active",
                "rate_limiting": "active",
                "security_logging": "active",
                "user_blacklisting": "active"
            }
        }
        
    except Exception as e:
        logger.error(f"Security stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get security stats")

@router.get("/security/recent-events")
async def get_recent_security_events(
    limit: int = 50,
    severity: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Get recent security events (admin only)"""
    try:
        events = security_logger.get_recent_security_events(limit=limit, severity=severity)
        
        return {
            "success": True,
            "events": events,
            "count": len(events),
            "timestamp": utc_now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Recent events error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recent events")

@router.post("/admin/blacklist-user/{user_id}")
async def blacklist_user(
    user_id: str,
    reason: str = "admin_action",
    current_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Blacklist all tokens for a user (admin only)"""
    try:
        success = token_blacklist.blacklist_all_user_tokens(user_id, reason)
        
        if success:
            security_logger.log_security_event(
                SecurityEventType.ACCOUNT_LOCKED,
                {
                    "target_user_id": user_id,
                    "admin_user_id": current_user["sub"],
                    "reason": reason,
                    "action": "user_blacklisted"
                },
                severity="WARNING"
            )
            
            return {
                "message": f"All tokens for user {user_id} have been blacklisted",
                "user_id": user_id,
                "reason": reason,
                "timestamp": utc_now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to blacklist user tokens")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Blacklist user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to blacklist user")

@router.post("/admin/reset-rate-limit/{identifier}")
async def reset_rate_limit(
    identifier: str,
    action: str = "login",
    current_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """Reset rate limit for an identifier (admin only)"""
    try:
        success = auth_rate_limiter.reset_rate_limit(identifier, action)
        
        if success:
            security_logger.log_security_event(
                SecurityEventType.SUSPICIOUS_ACTIVITY,
                {
                    "admin_user_id": current_user["sub"],
                    "identifier": identifier,
                    "action": action,
                    "admin_action": "rate_limit_reset"
                },
                severity="INFO"
            )
            
            return {
                "message": f"Rate limit reset for {identifier}:{action}",
                "identifier": identifier,
                "action": action,
                "timestamp": utc_now().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Rate limit entry not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset rate limit error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset rate limit")

@router.post("/admin/cleanup-expired")
async def cleanup_expired_tokens(current_user: Dict[str, Any] = Depends(get_current_admin_user)):
    """Cleanup expired tokens (admin only)"""
    try:
        blacklist_cleanup = token_blacklist.cleanup_expired_tokens()
        rate_limit_cleanup = auth_rate_limiter.cleanup_expired_entries()
        
        total_cleaned = blacklist_cleanup + rate_limit_cleanup
        
        return {
            "message": "Cleanup completed",
            "blacklist_tokens_cleaned": blacklist_cleanup,
            "rate_limit_entries_cleaned": rate_limit_cleanup,
            "total_cleaned": total_cleaned,
            "timestamp": utc_now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup expired entries")


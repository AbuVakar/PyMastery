"""
Real Authentication Router with Database Integration
Implements secure authentication endpoints with proper validation and error handling
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from services.real_auth_service import (
    auth_service, UserRegistration, UserLogin, AuthResponse,
    PasswordChange, PasswordReset, PasswordResetConfirm
)
from enhanced_security import verify_token, sanitize_input
from comprehensive_error_handling import (
    AuthenticationException, ValidationException,
    DatabaseException, handle_auth_error, handle_validation_error
)
from database.mongodb import get_database

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer()

@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserRegistration, request: Request):
    """Register a new user"""
    try:
        # Log registration attempt
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        result = await auth_service.register_user(user_data)
        
        # Log successful registration
        db = await get_database()
        await db.audit_logs.insert_one({
            "action": "user_registration",
            "email": user_data.email,
            "timestamp": datetime.utcnow(),
            "ip_address": client_ip,
            "user_agent": user_agent,
            "success": True
        })
        
        return result
        
    except ValidationException as e:
        # Handle validation errors
        db = await get_database()
        await db.audit_logs.insert_one({
            "action": "user_registration",
            "email": user_data.email,
            "timestamp": datetime.utcnow(),
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "success": False,
            "error": str(e)
        })
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again later."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration."
        )

@router.post("/login", response_model=AuthResponse)
async def login(login_data: UserLogin, request: Request):
    """Authenticate user and return tokens"""
    try:
        # Log login attempt
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        result = await auth_service.authenticate_user(login_data)
        
        # Log successful login
        db = await get_database()
        await db.audit_logs.insert_one({
            "action": "user_login",
            "email": login_data.email,
            "timestamp": datetime.utcnow(),
            "ip_address": client_ip,
            "user_agent": user_agent,
            "success": True
        })
        
        return result
        
    except AuthenticationException as e:
        # Log failed login
        db = await get_database()
        await db.audit_logs.insert_one({
            "action": "user_login",
            "email": login_data.email,
            "timestamp": datetime.utcnow(),
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "success": False,
            "error": str(e)
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again later."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login."
        )

@router.post("/refresh")
async def refresh_token(refresh_token: str, request: Request):
    """Refresh access token using refresh token"""
    try:
        result = await auth_service.refresh_access_token(refresh_token)
        
        # Log token refresh
        db = await get_database()
        await db.audit_logs.insert_one({
            "action": "token_refresh",
            "timestamp": datetime.utcnow(),
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "success": True
        })
        
        return result
        
    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed. Please try again later."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during token refresh."
        )

@router.post("/logout")
async def logout(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Logout user and invalidate tokens"""
    try:
        access_token = credentials.credentials if credentials else None
        refresh_token = request.headers.get("X-Refresh-Token")
        
        result = await auth_service.logout_user(access_token, refresh_token)
        
        # Log logout
        if access_token:
            try:
                payload = verify_token(access_token)
                user_id = payload.get("user_id")
                
                db = await get_database()
                await db.audit_logs.insert_one({
                    "user_id": user_id,
                    "action": "user_logout",
                    "timestamp": datetime.utcnow(),
                    "ip_address": request.client.host,
                    "user_agent": request.headers.get("user-agent", ""),
                    "success": True
                })
            except:
                pass  # Token verification failed, but still log logout attempt
        
        return result
        
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed. Please try again later."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during logout."
        )

@router.get("/me")
async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get current user profile"""
    try:
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        # Verify token
        payload = verify_token(credentials.credentials)
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get user from database
        db = await get_database()
        user = await db.users.find_one(
            {"_id": user_id, "is_active": True},
            {"password_hash": 0, "verification_token": 0}  # Exclude sensitive fields
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Convert _id to string and add to response
        user["id"] = str(user.pop("_id"))
        
        return {
            "success": True,
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user profile."
        )

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Change user password"""
    try:
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        # Verify token and get user ID
        payload = verify_token(credentials.credentials)
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        result = await auth_service.change_password(user_id, password_data)
        
        # Log password change
        db = await get_database()
        await db.audit_logs.insert_one({
            "user_id": user_id,
            "action": "password_change",
            "timestamp": datetime.utcnow(),
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "success": True
        })
        
        return result
        
    except (ValidationException, AuthenticationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed. Please try again later."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during password change."
        )

@router.post("/password-reset-request")
async def request_password_reset(
    reset_data: PasswordReset,
    request: Request
):
    """Request password reset"""
    try:
        # Sanitize email
        email = sanitize_input(reset_data.email.lower())
        
        # Get database connection
        db = await get_database()
        
        # Find user
        user = await db.users.find_one({"email": email})
        if not user:
            # Don't reveal if user exists or not
            return {
                "success": True,
                "message": "If an account with this email exists, a password reset link has been sent."
            }
        
        # Generate reset token
        import secrets
        reset_token = secrets.token_urlsafe(32)
        reset_expires = datetime.utcnow() + timedelta(hours=1)
        
        # Update user with reset token
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password_reset_token": reset_token,
                    "password_reset_expires": reset_expires,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Log password reset request
        await db.audit_logs.insert_one({
            "user_id": str(user["_id"]),
            "action": "password_reset_request",
            "timestamp": datetime.utcnow(),
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "success": True
        })
        
        # TODO: Send email with reset link
        # For now, just return success message
        
        return {
            "success": True,
            "message": "If an account with this email exists, a password reset link has been sent."
        }
        
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset request failed. Please try again later."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during password reset request."
        )

@router.post("/password-reset-confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    request: Request
):
    """Confirm password reset with token"""
    try:
        # Get database connection
        db = await get_database()
        
        # Find user with valid reset token
        user = await db.users.find_one({
            "password_reset_token": reset_data.token,
            "password_reset_expires": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Hash new password
        from enhanced_security import hash_password
        new_password_hash = hash_password(reset_data.new_password)
        
        # Update user password
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password_hash": new_password_hash,
                    "password_reset_token": None,
                    "password_reset_expires": None,
                    "updated_at": datetime.utcnow(),
                    "password_changed_at": datetime.utcnow()
                }
            }
        )
        
        # Invalidate all refresh tokens for this user
        await db.refresh_tokens.update_many(
            {"user_id": str(user["_id"])},
            {"$set": {"is_active": False, "revoked_at": datetime.utcnow()}}
        )
        
        # Log password reset confirmation
        await db.audit_logs.insert_one({
            "user_id": str(user["_id"]),
            "action": "password_reset_confirm",
            "timestamp": datetime.utcnow(),
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "success": True
        })
        
        return {
            "success": True,
            "message": "Password reset successful. You can now login with your new password."
        }
        
    except HTTPException:
        raise
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again later."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during password reset."
        )

@router.get("/verify-email/{token}")
async def verify_email(token: str, request: Request):
    """Verify email address"""
    try:
        # Get database connection
        db = await get_database()
        
        # Find user with verification token
        user = await db.users.find_one({"verification_token": token})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
        
        # Mark user as verified
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "is_verified": True,
                    "verification_token": None,
                    "verified_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Log email verification
        await db.audit_logs.insert_one({
            "user_id": str(user["_id"]),
            "action": "email_verification",
            "timestamp": datetime.utcnow(),
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "success": True
        })
        
        return {
            "success": True,
            "message": "Email verified successfully! Your account is now active."
        }
        
    except HTTPException:
        raise
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again later."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during email verification."
        )

# Dependency to get current user
async def get_current_user_dependency(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Dependency to get current authenticated user"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get user from database
        db = await get_database()
        user = await db.users.find_one(
            {"_id": user_id, "is_active": True},
            {"password_hash": 0}  # Exclude password hash
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Convert _id to string
        user["id"] = str(user.pop("_id"))
        return user
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

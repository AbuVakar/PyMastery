"""
Real Authentication Service with Database Integration
Implements secure JWT-based authentication with MongoDB
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from enhanced_security import (
    SecurityConfig, PasswordManager, TokenManager,
    hash_password, verify_password, validate_password_strength,
    sanitize_input, create_access_token, verify_token
)
from comprehensive_error_handling import (
    AuthenticationException, ValidationException,
    DatabaseException, handle_auth_error
)

# Database connection
from database.mongodb import get_database

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRegistration(BaseModel):
    """User registration model with validation"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role_track: str = Field(default="general", regex="^(backend|frontend|fullstack|data|ai|general)$")
    agree_terms: bool = Field(..., description="User must agree to terms")

class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str
    remember_me: bool = False

class UserResponse(BaseModel):
    """User response model"""
    id: str
    name: str
    email: str
    role_track: str
    points: int = 0
    level: int = 1
    login_streak: int = 0
    created_at: datetime
    last_login: Optional[datetime] = None

class AuthResponse(BaseModel):
    """Authentication response model"""
    success: bool
    message: str
    user: Optional[UserResponse] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None

class PasswordChange(BaseModel):
    """Password change model"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

class PasswordReset(BaseModel):
    """Password reset model"""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Password reset confirmation model"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

class AuthenticationService:
    """Real authentication service with database integration"""
    
    def __init__(self):
        self.password_manager = PasswordManager()
        self.token_manager = TokenManager()
        self.db = None
    
    async def _get_database(self):
        """Get database connection"""
        if self.db is None:
            self.db = await get_database()
        return self.db
    
    async def register_user(self, user_data: UserRegistration) -> AuthResponse:
        """Register a new user with database storage"""
        try:
            # Validate input
            if not user_data.agree_terms:
                raise ValidationException("You must agree to the terms and conditions")
            
            # Validate password strength
            password_validation = self.password_manager.validate_password_strength(user_data.password)
            if not password_validation["is_valid"]:
                raise ValidationException(f"Password validation failed: {', '.join(password_validation['issues'])}")
            
            # Sanitize input
            sanitized_name = sanitize_input(user_data.name)
            sanitized_email = sanitize_input(user_data.email.lower())
            
            # Get database connection
            db = await self._get_database()
            
            # Check if user already exists
            existing_user = await db.users.find_one({"email": sanitized_email})
            if existing_user:
                raise AuthenticationException("User with this email already exists")
            
            # Hash password
            hashed_password = hash_password(user_data.password)
            
            # Create user document
            user_document = {
                "name": sanitized_name,
                "email": sanitized_email,
                "password_hash": hashed_password,
                "role_track": user_data.role_track,
                "points": 0,
                "level": 1,
                "login_streak": 0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": True,
                "is_verified": False,
                "verification_token": secrets.token_urlsafe(32),
                "password_reset_token": None,
                "password_reset_expires": None,
                "last_login": None,
                "login_attempts": 0,
                "locked_until": None,
                "preferences": {
                    "theme": "dark",
                    "notifications": True,
                    "language": "en"
                },
                "profile": {
                    "bio": "",
                    "avatar_url": "",
                    "skills": [],
                    "interests": []
                }
            }
            
            # Insert user into database
            result = await db.users.insert_one(user_document)
            user_id = str(result.inserted_id)
            
            # Create user response
            user_response = UserResponse(
                id=user_id,
                name=sanitized_name,
                email=sanitized_email,
                role_track=user_data.role_track,
                points=0,
                level=1,
                login_streak=0,
                created_at=user_document["created_at"]
            )
            
            # Generate tokens
            access_token = create_access_token({
                "user_id": user_id,
                "email": sanitized_email,
                "role_track": user_data.role_track
            })
            
            refresh_token = secrets.token_urlsafe(32)
            
            # Store refresh token
            await db.refresh_tokens.insert_one({
                "user_id": user_id,
                "token": refresh_token,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=7),
                "is_active": True
            })
            
            return AuthResponse(
                success=True,
                message="Registration successful! Please check your email for verification.",
                user=user_response,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=1800  # 30 minutes
            )
            
        except (ValidationException, AuthenticationException) as e:
            raise e
        except Exception as e:
            raise DatabaseException(f"Registration failed: {str(e)}")
    
    async def authenticate_user(self, login_data: UserLogin) -> AuthResponse:
        """Authenticate user with database verification"""
        try:
            # Sanitize input
            sanitized_email = sanitize_input(login_data.email.lower())
            
            # Get database connection
            db = await self._get_database()
            
            # Find user by email
            user = await db.users.find_one({"email": sanitized_email})
            if not user:
                raise AuthenticationException("Invalid email or password")
            
            # Check if account is locked
            if user.get("locked_until") and user["locked_until"] > datetime.utcnow():
                lock_time = user["locked_until"].strftime("%Y-%m-%d %H:%M:%S")
                raise AuthenticationException(f"Account is locked until {lock_time}")
            
            # Verify password
            if not verify_password(login_data.password, user["password_hash"]):
                # Increment login attempts
                await self._handle_failed_login(db, user)
                raise AuthenticationException("Invalid email or password")
            
            # Reset login attempts on successful login
            await db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "login_attempts": 0,
                        "locked_until": None,
                        "last_login": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Update login streak
            await self._update_login_streak(db, user)
            
            # Create user response
            user_response = UserResponse(
                id=str(user["_id"]),
                name=user["name"],
                email=user["email"],
                role_track=user["role_track"],
                points=user.get("points", 0),
                level=user.get("level", 1),
                login_streak=user.get("login_streak", 0),
                created_at=user["created_at"],
                last_login=user.get("last_login")
            )
            
            # Generate tokens
            access_token = create_access_token({
                "user_id": str(user["_id"]),
                "email": user["email"],
                "role_track": user["role_track"]
            })
            
            refresh_token = secrets.token_urlsafe(32)
            
            # Store refresh token
            await db.refresh_tokens.insert_one({
                "user_id": str(user["_id"]),
                "token": refresh_token,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=30 if login_data.remember_me else 7),
                "is_active": True
            })
            
            return AuthResponse(
                success=True,
                message="Login successful!",
                user=user_response,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=1800
            )
            
        except (ValidationException, AuthenticationException) as e:
            raise e
        except Exception as e:
            raise DatabaseException(f"Authentication failed: {str(e)}")
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        try:
            # Get database connection
            db = await self._get_database()
            
            # Find refresh token
            token_record = await db.refresh_tokens.find_one({
                "token": refresh_token,
                "is_active": True,
                "expires_at": {"$gt": datetime.utcnow()}
            })
            
            if not token_record:
                raise AuthenticationException("Invalid or expired refresh token")
            
            # Get user
            user = await db.users.find_one({"_id": token_record["user_id"]})
            if not user or not user.get("is_active", True):
                raise AuthenticationException("User account not found or inactive")
            
            # Generate new access token
            new_access_token = create_access_token({
                "user_id": str(user["_id"]),
                "email": user["email"],
                "role_track": user["role_track"]
            })
            
            return {
                "access_token": new_access_token,
                "token_type": "bearer",
                "expires_in": 1800
            }
            
        except AuthenticationException as e:
            raise e
        except Exception as e:
            raise DatabaseException(f"Token refresh failed: {str(e)}")
    
    async def logout_user(self, access_token: str, refresh_token: Optional[str] = None) -> Dict[str, Any]:
        """Logout user and invalidate tokens"""
        try:
            # Get database connection
            db = await self._get_database()
            
            # Parse token to get user ID
            try:
                payload = verify_token(access_token)
                user_id = payload.get("user_id")
            except:
                user_id = None
            
            if user_id:
                # Invalidate refresh token if provided
                if refresh_token:
                    await db.refresh_tokens.update_one(
                        {"token": refresh_token, "user_id": user_id},
                        {"$set": {"is_active": False, "revoked_at": datetime.utcnow()}}
                    )
                
                # Log logout
                await db.audit_logs.insert_one({
                    "user_id": user_id,
                    "action": "logout",
                    "timestamp": datetime.utcnow(),
                    "ip_address": None,  # Will be set by middleware
                    "user_agent": None   # Will be set by middleware
                })
            
            return {
                "success": True,
                "message": "Logout successful"
            }
            
        except Exception as e:
            raise DatabaseException(f"Logout failed: {str(e)}")
    
    async def change_password(self, user_id: str, password_data: PasswordChange) -> Dict[str, Any]:
        """Change user password"""
        try:
            # Validate new password strength
            password_validation = self.password_manager.validate_password_strength(password_data.new_password)
            if not password_validation["is_valid"]:
                raise ValidationException(f"Password validation failed: {', '.join(password_validation['issues'])}")
            
            # Get database connection
            db = await self._get_database()
            
            # Get user
            user = await db.users.find_one({"_id": user_id})
            if not user:
                raise AuthenticationException("User not found")
            
            # Verify current password
            if not verify_password(password_data.current_password, user["password_hash"]):
                raise AuthenticationException("Current password is incorrect")
            
            # Hash new password
            new_hashed_password = hash_password(password_data.new_password)
            
            # Update password
            await db.users.update_one(
                {"_id": user_id},
                {
                    "$set": {
                        "password_hash": new_hashed_password,
                        "updated_at": datetime.utcnow(),
                        "password_changed_at": datetime.utcnow()
                    }
                }
            )
            
            # Invalidate all refresh tokens for this user
            await db.refresh_tokens.update_many(
                {"user_id": user_id},
                {"$set": {"is_active": False, "revoked_at": datetime.utcnow()}}
            )
            
            # Log password change
            await db.audit_logs.insert_one({
                "user_id": user_id,
                "action": "password_change",
                "timestamp": datetime.utcnow(),
                "ip_address": None,
                "user_agent": None
            })
            
            return {
                "success": True,
                "message": "Password changed successfully"
            }
            
        except (ValidationException, AuthenticationException) as e:
            raise e
        except Exception as e:
            raise DatabaseException(f"Password change failed: {str(e)}")
    
    async def _handle_failed_login(self, db, user: Dict[str, Any]):
        """Handle failed login attempt"""
        login_attempts = user.get("login_attempts", 0) + 1
        max_attempts = 5
        lockout_minutes = 15
        
        update_data = {
            "$inc": {"login_attempts": 1},
            "$set": {"updated_at": datetime.utcnow()}
        }
        
        # Lock account if max attempts reached
        if login_attempts >= max_attempts:
            update_data["$set"]["locked_until"] = datetime.utcnow() + timedelta(minutes=lockout_minutes)
        
        await db.users.update_one({"_id": user["_id"]}, update_data)
        
        # Log failed attempt
        await db.audit_logs.insert_one({
            "user_id": str(user["_id"]),
            "action": "failed_login",
            "timestamp": datetime.utcnow(),
            "ip_address": None,
            "user_agent": None,
            "details": f"Login attempt {login_attempts}/{max_attempts}"
        })
    
    async def _update_login_streak(self, db, user: Dict[str, Any]):
        """Update user login streak"""
        last_login = user.get("last_login")
        current_login = datetime.utcnow()
        
        if last_login:
            # Check if logged in on consecutive days
            days_diff = (current_login.date() - last_login.date()).days
            
            if days_diff == 1:
                # Consecutive day - increment streak
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$inc": {"login_streak": 1}}
                )
            elif days_diff > 1:
                # Streak broken - reset to 1
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"login_streak": 1}}
                )
        else:
            # First login - set streak to 1
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"login_streak": 1}}
            )

# Global authentication service instance
auth_service = AuthenticationService()

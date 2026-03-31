import time
import os
import secrets
import hashlib
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
import logging
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class EnhancedSecurity:
    """Enhanced security utilities"""
    
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url
        self.redis_client: Optional[redis.Redis] = None
        self.use_redis = bool(redis_url)
        
        # Password hashing
        self.pwd_context = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
            bcrypt__rounds=12
        )
        
        # JWT settings
        self.secret_key = secrets.token_urlsafe(32)
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 7
        
        # Failed login tracking
        self.failed_login_attempts = {}
        self.max_failed_attempts = 5
        self.lockout_duration = 900  # 15 minutes
        
        # Session management
        self.active_sessions = {}
        self.max_sessions_per_user = 5
        
        # Password policies
        self.min_password_length = 8
        self.require_uppercase = True
        self.require_lowercase = True
        self.require_digits = True
        self.require_special_chars = True
        self.password_history_size = 5
        self.password_change_days = 90

    async def initialize(self):
        """Initialize Redis connection if available"""
        if self.use_redis and not self.redis_client:
            try:
                self.redis_client = redis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True
                )
                await self.redis_client.ping()
                logger.info("Redis connected for enhanced security")
            except Exception as e:
                logger.warning(f"Redis connection failed, falling back to memory: {e}")
                self.use_redis = False
                self.redis_client = None

    def hash_password(self, password: str) -> str:
        """Hash password with bcrypt"""
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return self.pwd_context.verify(plain_password, hashed_password)

    def validate_password_strength(self, password: str, user_info: Optional[Dict] = None) -> List[str]:
        """Validate password strength and return list of issues"""
        issues = []
        
        # Length check
        if len(password) < self.min_password_length:
            issues.append(f"Password must be at least {self.min_password_length} characters long")
        
        # Uppercase check
        if self.require_uppercase and not any(c.isupper() for c in password):
            issues.append("Password must contain at least one uppercase letter")
        
        # Lowercase check
        if self.require_lowercase and not any(c.islower() for c in password):
            issues.append("Password must contain at least one lowercase letter")
        
        # Digits check
        if self.require_digits and not any(c.isdigit() for c in password):
            issues.append("Password must contain at least one digit")
        
        # Special characters check
        if self.require_special_chars and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            issues.append("Password must contain at least one special character")
        
        # Common password check
        common_passwords = [
            "password", "123456", "password123", "admin", "qwerty",
            "letmein", "welcome", "monkey", "dragon", "master",
            "12345678", "123456789", "12345", "abc123"
        ]
        
        if password.lower() in common_passwords:
            issues.append("Password is too common. Please choose a stronger password")
        
        # Check if password contains user information
        if user_info:
            user_info_values = []
            if "email" in user_info:
                user_info_values.extend(user_info["email"].split("@")[0].split("."))
            if "name" in user_info:
                user_info_values.extend(user_info["name"].split())
            if "username" in user_info:
                user_info_values.append(user_info["username"])
            
            for value in user_info_values:
                if value.lower() in password.lower():
                    issues.append("Password cannot contain your personal information")
                    break
        
        # Check for sequential characters
        if self._has_sequential_chars(password):
            issues.append("Password cannot contain sequential characters")
        
        # Check for repeated characters
        if self._has_repeated_chars(password):
            issues.append("Password cannot contain too many repeated characters")
        
        return issues

    def _has_sequential_chars(self, password: str) -> bool:
        """Check for sequential characters"""
        for i in range(len(password) - 2):
            if (ord(password[i+1]) == ord(password[i]) + 1 and 
                ord(password[i+2]) == ord(password[i]) + 2):
                return True
            if (ord(password[i+1]) == ord(password[i]) - 1 and 
                ord(password[i+2]) == ord(password[i]) - 2):
                return True
        return False

    def _has_repeated_chars(self, password: str) -> bool:
        """Check for repeated characters"""
        for i in range(len(password) - 2):
            if password[i] == password[i+1] == password[i+2]:
                return True
        return False

    async def track_failed_login(self, identifier: str, ip_address: str) -> bool:
        """Track failed login attempts and return if account should be locked"""
        key = f"failed_login:{identifier}"
        current_time = int(time.time())
        
        if self.use_redis and self.redis_client:
            # Use Redis for tracking
            await self.redis_client.zadd(key, {str(current_time): current_time})
            
            # Remove old attempts (older than lockout duration)
            await self.redis_client.zremrangebyscore(key, 0, current_time - self.lockout_duration)
            
            # Count recent attempts
            attempts = await self.redis_client.zcard(key)
            
            # Set expiration
            await self.redis_client.expire(key, self.lockout_duration)
            
            return attempts >= self.max_failed_attempts
        else:
            # Use memory for tracking
            if key not in self.failed_login_attempts:
                self.failed_login_attempts[key] = []
            
            # Remove old attempts
            self.failed_login_attempts[key] = [
                attempt for attempt in self.failed_login_attempts[key]
                if attempt > current_time - self.lockout_duration
            ]
            
            # Add current attempt
            self.failed_login_attempts[key].append(current_time)
            
            return len(self.failed_login_attempts[key]) >= self.max_failed_attempts

    async def reset_failed_login(self, identifier: str):
        """Reset failed login attempts after successful login"""
        key = f"failed_login:{identifier}"
        
        if self.use_redis and self.redis_client:
            await self.redis_client.delete(key)
        else:
            self.failed_login_attempts.pop(key, None)

    async def is_account_locked(self, identifier: str) -> tuple[bool, Optional[int]]:
        """Check if account is locked and return unlock time"""
        key = f"failed_login:{identifier}"
        current_time = int(time.time())
        
        if self.use_redis and self.redis_client:
            # Get oldest attempt
            oldest = await self.redis_client.zrange(key, 0, 0, withscores=True)
            
            if oldest:
                oldest_time = int(oldest[0][1])
                unlock_time = oldest_time + self.lockout_duration
                
                if current_time < unlock_time:
                    return True, unlock_time - current_time
                else:
                    # Lock expired, clean up
                    await self.redis_client.delete(key)
        else:
            # Check memory storage
            if key in self.failed_login_attempts:
                attempts = self.failed_login_attempts[key]
                if attempts:
                    oldest_time = min(attempts)
                    unlock_time = oldest_time + self.lockout_duration
                    
                    if current_time < unlock_time:
                        return True, unlock_time - current_time
                    else:
                        # Lock expired, clean up
                        del self.failed_login_attempts[key]
        
        return False, None

    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "access"
        })
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        
        expire = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "refresh"
        })
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check token type
            if payload.get("type") != token_type:
                raise jwt.InvalidTokenError("Invalid token type")
            
            # Check expiration
            if datetime.now(timezone.utc) > datetime.fromtimestamp(payload["exp"]):
                raise jwt.ExpiredSignatureError("Token has expired")
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    async def create_session(self, user_id: str, session_data: Dict[str, Any]) -> str:
        """Create user session"""
        session_id = secrets.token_urlsafe(32)
        session_key = f"session:{session_id}"
        
        session_info = {
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_accessed": datetime.now(timezone.utc).isoformat(),
            "ip_address": session_data.get("ip_address"),
            "user_agent": session_data.get("user_agent"),
            **session_data
        }
        
        if self.use_redis and self.redis_client:
            # Store in Redis
            await self.redis_client.hset(session_key, mapping=session_info)
            await self.redis_client.expire(session_key, 86400)  # 24 hours
            
            # Add to user's active sessions
            user_sessions_key = f"user_sessions:{user_id}"
            await self.redis_client.sadd(user_sessions_key, session_id)
            await self.redis_client.expire(user_sessions_key, 86400 * 7)  # 7 days
            
            # Limit sessions per user
            sessions = await self.redis_client.smembers(user_sessions_key)
            if len(sessions) > self.max_sessions_per_user:
                # Remove oldest session
                oldest_session = min(sessions)
                await self.redis_client.srem(user_sessions_key, oldest_session)
                await self.redis_client.delete(f"session:{oldest_session}")
        else:
            # Store in memory
            self.active_sessions[session_id] = session_info
            
            # Add to user's active sessions
            if user_id not in self.active_sessions:
                self.active_sessions[user_id] = []
            
            self.active_sessions[user_id].append(session_id)
            
            # Limit sessions per user
            if len(self.active_sessions[user_id]) > self.max_sessions_per_user:
                # Remove oldest session
                oldest_session = self.active_sessions[user_id][0]
                self.active_sessions[user_id].pop(0)
                self.active_sessions.pop(oldest_session, None)
        
        return session_id

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session information"""
        session_key = f"session:{session_id}"
        
        if self.use_redis and self.redis_client:
            session_data = await self.redis_client.hgetall(session_key)
            if session_data:
                # Update last accessed
                await self.redis_client.hset(session_key, "last_accessed", datetime.now(timezone.utc).isoformat())
                return session_data
        else:
            return self.active_sessions.get(session_id)
        
        return None

    async def revoke_session(self, session_id: str):
        """Revoke a specific session"""
        session_key = f"session:{session_id}"
        
        if self.use_redis and self.redis_client:
            session_data = await self.redis_client.hgetall(session_key)
            if session_data:
                user_id = session_data.get("user_id")
                await self.redis_client.delete(session_key)
                
                if user_id:
                    user_sessions_key = f"user_sessions:{user_id}"
                    await self.redis_client.srem(user_sessions_key, session_id)
        else:
            session_data = self.active_sessions.get(session_id)
            if session_data:
                user_id = session_data.get("user_id")
                self.active_sessions.pop(session_id, None)
                
                if user_id and user_id in self.active_sessions:
                    self.active_sessions[user_id] = [
                        s for s in self.active_sessions[user_id] if s != session_id
                    ]

    async def revoke_all_user_sessions(self, user_id: str):
        """Revoke all sessions for a user"""
        user_sessions_key = f"user_sessions:{user_id}"
        
        if self.use_redis and self.redis_client:
            sessions = await self.redis_client.smembers(user_sessions_key)
            
            # Delete all sessions
            for session_id in sessions:
                await self.redis_client.delete(f"session:{session_id}")
            
            # Clear user sessions
            await self.redis_client.delete(user_sessions_key)
        else:
            if user_id in self.active_sessions:
                sessions = self.active_sessions[user_id]
                
                # Delete all sessions
                for session_id in sessions:
                    self.active_sessions.pop(session_id, None)
                
                # Clear user sessions
                del self.active_sessions[user_id]

    async def get_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all active sessions for a user"""
        user_sessions_key = f"user_sessions:{user_id}"
        sessions = []
        
        if self.use_redis and self.redis_client:
            session_ids = await self.redis_client.smembers(user_sessions_key)
            
            for session_id in session_ids:
                session_data = await self.get_session(session_id)
                if session_data:
                    sessions.append(session_data)
        else:
            if user_id in self.active_sessions:
                for session_id in self.active_sessions[user_id]:
                    session_data = self.active_sessions.get(session_id)
                    if session_data:
                        sessions.append(session_data)
        
        return sessions

    def generate_csrf_token(self) -> str:
        """Generate CSRF token"""
        return secrets.token_urlsafe(32)

    def validate_csrf_token(self, token: str, expected_token: str) -> bool:
        """Validate CSRF token"""
        return secrets.compare_digest(token, expected_token)

    async def create_password_reset_token(self, user_id: str, email: str) -> str:
        """Create password reset token"""
        token = secrets.token_urlsafe(32)
        token_key = f"password_reset:{token}"
        
        reset_data = {
            "user_id": user_id,
            "email": email,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        }
        
        if self.use_redis and self.redis_client:
            await self.redis_client.hset(token_key, mapping=reset_data)
            await self.redis_client.expire(token_key, 3600)  # 1 hour
        else:
            # In production, use database
            logger.info(f"Password reset token created for user {user_id}")
        
        return token

    async def validate_password_reset_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate password reset token"""
        token_key = f"password_reset:{token}"
        
        if self.use_redis and self.redis_client:
            reset_data = await self.redis_client.hgetall(token_key)
            
            if reset_data:
                expires_at = datetime.fromisoformat(reset_data["expires_at"])
                if datetime.now(timezone.utc) > expires_at:
                    await self.redis_client.delete(token_key)
                    return None
                
                return reset_data
        else:
            # In production, check database
            logger.info(f"Password reset token validation for token {token}")
        
        return None

    async def invalidate_password_reset_token(self, token: str):
        """Invalidate password reset token"""
        token_key = f"password_reset:{token}"
        
        if self.use_redis and self.redis_client:
            await self.redis_client.delete(token_key)
        else:
            # In production, update database
            logger.info(f"Password reset token invalidated: {token}")

    def generate_api_key(self, user_id: str, scopes: List[str] = None) -> str:
        """Generate API key for user"""
        prefix = "pym_"
        api_key = prefix + secrets.token_urlsafe(32)
        
        # Store API key hash (in production, use database)
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        logger.info(f"API key generated for user {user_id}")
        
        return api_key

    def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate API key"""
        if not api_key.startswith("pym_"):
            return None
        
        # In production, validate against database
        # For now, return mock data
        return {
            "user_id": "mock_user_id",
            "scopes": ["read", "write"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }

    async def log_security_event(self, event_type: str, details: Dict[str, Any]):
        """Log security event"""
        event_data = {
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": details
        }
        
        logger.warning(f"Security event: {event_type} - {details}")
        
        # In production, store in security events table
        if self.use_redis and self.redis_client:
            await self.redis_client.lpush(
                "security_events",
                json.dumps(event_data)
            )
            await self.redis_client.expire("security_events", 86400 * 30)  # 30 days

    async def get_security_stats(self) -> Dict[str, Any]:
        """Get security statistics"""
        stats = {
            "active_sessions": 0,
            "failed_login_attempts": 0,
            "locked_accounts": 0,
            "security_events": 0
        }
        
        if self.use_redis and self.redis_client:
            # Count active sessions
            session_keys = await self.redis_client.keys("session:*")
            stats["active_sessions"] = len(session_keys)
            
            # Count failed login attempts
            failed_login_keys = await self.redis_client.keys("failed_login:*")
            for key in failed_login_keys:
                attempts = await self.redis_client.zcard(key)
                stats["failed_login_attempts"] += attempts
            
            # Count security events
            events = await self.redis_client.lrange("security_events", 0, -1)
            stats["security_events"] = len(events)
        else:
            # Memory-based stats
            stats["active_sessions"] = len(self.active_sessions)
            stats["failed_login_attempts"] = sum(
                len(attempts) for attempts in self.failed_login_attempts.values()
            )
        
        return stats

# Global security instance
security = EnhancedSecurity(os.getenv("REDIS_URL"))

# Security dependencies
security_scheme = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)):
    """Get current user from JWT token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = security.verify_token(credentials.credentials, "access")
        return payload
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)):
    """Get current user from JWT token (optional)"""
    if not credentials:
        return None
    
    try:
        payload = security.verify_token(credentials.credentials, "access")
        return payload
    except:
        return None

# Initialize security on startup
async def initialize_security():
    """Initialize security service"""
    await security.initialize()
    logger.info("Enhanced security service initialized")

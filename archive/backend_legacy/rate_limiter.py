"""
Rate limiting implementation for API endpoints
"""
import time
import asyncio
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, deque
import logging
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter using sliding window algorithm"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.requests = defaultdict(lambda: deque())
    
    async def is_allowed(
        self,
        key: str,
        limit: int,
        window: int = 60
    ) -> Tuple[bool, Dict[str, int]]:
        """
        Check if request is allowed
        
        Args:
            key: Unique identifier (IP, user ID, etc.)
            limit: Maximum requests allowed
            window: Time window in seconds
            
        Returns:
            Tuple of (allowed, info_dict)
        """
        now = int(time.time())
        window_start = now - window
        
        # Clean old requests
        while self.requests[key] and self.requests[key][0] < window_start:
            self.requests[key].popleft()
        
        # Check if limit exceeded
        if len(self.requests[key]) >= limit:
            return False, {
                "limit": limit,
                "remaining": 0,
                "reset_time": self.requests[key][0] + window,
                "retry_after": max(0, self.requests[key][0] + window - now)
            }
        
        # Add current request
        self.requests[key].append(now)
        
        return True, {
            "limit": limit,
            "remaining": limit - len(self.requests[key]),
            "reset_time": now + window,
            "retry_after": 0
        }

class RedisRateLimiter:
    """Redis-based rate limiter for distributed systems"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def is_allowed(
        self,
        key: str,
        limit: int,
        window: int = 60
    ) -> Tuple[bool, Dict[str, int]]:
        """
        Check if request is allowed using Redis
        
        Args:
            key: Redis key for rate limiting
            limit: Maximum requests allowed
            window: Time window in seconds
            
        Returns:
            Tuple of (allowed, info_dict)
        """
        now = int(time.time())
        window_start = now - window
        
        # Remove old requests
        await self.redis.zremrangebyscore(key, 0, window_start)
        
        # Count current requests
        current_count = await self.redis.zcard(key)
        
        if current_count >= limit:
            # Get oldest request time for retry_after
            oldest = await self.redis.zrange(key, 0, 0, withscores=True)
            oldest_time = int(oldest[0][1]) if oldest else now
            
            return False, {
                "limit": limit,
                "remaining": 0,
                "reset_time": oldest_time + window,
                "retry_after": max(0, oldest_time + window - now)
            }
        
        # Add current request
        await self.redis.zadd(key, {str(now): now})
        await self.redis.expire(key, window)
        
        return True, {
            "limit": limit,
            "remaining": limit - current_count - 1,
            "reset_time": now + window,
            "retry_after": 0
        }

class RateLimitMiddleware:
    """FastAPI middleware for rate limiting"""
    
    def __init__(self, app, redis_client: redis.Redis):
        self.app = app
        self.rate_limiter = RedisRateLimiter(redis_client)
        
        # Rate limits for different endpoints
        self.rate_limits = {
            "default": (100, 60),      # 100 requests per minute
            "login": (5, 300),        # 5 login attempts per 5 minutes
            "register": (3, 600),     # 3 registrations per 10 minutes
            "code_submit": (20, 60),  # 20 code submissions per minute
            "api_key": (1000, 3600), # 1000 requests per hour for API keys
        }
    
    async def __call__(self, request: Request, call_next):
        """Middleware implementation"""
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Determine rate limit based on endpoint
        endpoint = request.url.path
        rate_limit_key = self._get_rate_limit_key(endpoint)
        limit, window = self.rate_limits.get(rate_limit_key, self.rate_limits["default"])
        
        # Check rate limit
        key = f"rate_limit:{rate_limit_key}:{client_ip}"
        allowed, info = await self.rate_limiter.is_allowed(key, limit, window)
        
        # Add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(info["reset_time"])
        response.headers["X-RateLimit-Retry-After"] = str(info["retry_after"])
        
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={
                    "Retry-After": str(info["retry_after"]),
                    "X-RateLimit-Limit": str(info["limit"]),
                    "X-RateLimit-Remaining": str(info["remaining"]),
                    "X-RateLimit-Reset": str(info["reset_time"]),
                    "X-RateLimit-Retry-After": str(info["retry_after"])
                }
            )
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        # Check for forwarded headers
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def _get_rate_limit_key(self, endpoint: str) -> str:
        """Get rate limit key based on endpoint"""
        if "/login" in endpoint:
            return "login"
        elif "/register" in endpoint or "/signup" in endpoint:
            return "register"
        elif "/submit" in endpoint or "/code" in endpoint:
            return "code_submit"
        elif "/api/" in endpoint:
            return "api_key"
        return "default"

class UserRateLimiter:
    """Rate limiter for authenticated users"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.limiter = RedisRateLimiter(redis_client)
    
    async def check_user_rate_limit(
        self,
        user_id: str,
        action: str,
        limit: Optional[int] = None,
        window: Optional[int] = None
    ) -> Tuple[bool, Dict[str, int]]:
        """
        Check rate limit for specific user action
        
        Args:
            user_id: User identifier
            action: Action type (login, submit, etc.)
            limit: Custom limit (optional)
            window: Custom window (optional)
            
        Returns:
            Tuple of (allowed, info_dict)
        """
        # Default limits for different actions
        action_limits = {
            "login": (5, 300),        # 5 attempts per 5 minutes
            "submit": (20, 60),       # 20 submissions per minute
            "comment": (10, 60),      # 10 comments per minute
            "upload": (5, 60),        # 5 uploads per minute
        }
        
        if limit is None:
            limit, window = action_limits.get(action, (100, 60))
        
        key = f"user_rate_limit:{action}:{user_id}"
        return await self.limiter.is_allowed(key, limit, window)

async def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client for rate limiting"""
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        redis_client = redis.from_url(redis_url, decode_responses=True)
        
        # Test connection
        await redis_client.ping()
        logger.info("Redis connected for rate limiting")
        return redis_client
        
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
        return None

# Rate limiting decorators
def rate_limit(limit: int, window: int = 60, key_func=None):
    """Decorator for rate limiting endpoints"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Get rate limit key
            if key_func:
                rate_key = key_func(*args, **kwargs)
            else:
                rate_key = "default"
            
            # Check rate limit (implementation depends on your setup)
            # This is a simplified version - in production, use Redis or database
            allowed, info = await check_rate_limit(rate_key, limit, window)
            
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded",
                    headers={
                        "X-RateLimit-Limit": str(info["limit"]),
                        "X-RateLimit-Remaining": str(info["remaining"]),
                        "X-RateLimit-Reset": str(info["reset_time"]),
                        "X-RateLimit-Retry-After": str(info["retry_after"])
                    }
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Simplified rate limiting check (for non-Redis environments)
async def check_rate_limit(key: str, limit: int, window: int) -> Tuple[bool, Dict[str, int]]:
    """Simple in-memory rate limiting (for development)"""
    # This is a basic implementation - use Redis in production
    if not hasattr(check_rate_limit, '_requests'):
        check_rate_limit._requests = {}
    
    now = int(time.time())
    window_start = now - window
    
    if key not in check_rate_limit._requests:
        check_rate_limit._requests[key] = []
    
    # Clean old requests
    check_rate_limit._requests[key] = [
        req_time for req_time in check_rate_limit._requests[key]
        if req_time > window_start
    ]
    
    # Check limit
    if len(check_rate_limit._requests[key]) >= limit:
        return False, {
            "limit": limit,
            "remaining": 0,
            "reset_time": check_rate_limit._requests[key][0] + window,
            "retry_after": max(0, check_rate_limit._requests[key][0] + window - now)
        }
    
    # Add current request
    check_rate_limit._requests[key].append(now)
    
    return True, {
        "limit": limit,
        "remaining": limit - len(check_rate_limit._requests[key]),
        "reset_time": now + window,
        "retry_after": 0
    }

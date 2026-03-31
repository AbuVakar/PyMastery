"""
Authentication Rate Limiter
Specialized rate limiting for authentication endpoints
"""

import time
import os
import redis
import json
import logging
from typing import Dict, Any, Optional
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    """Return current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)

class AuthRateLimiter:
    """Rate limiter specifically for authentication endpoints"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = None
        self.fallback_store = defaultdict(deque)  # In-memory fallback
        
        # Rate limit configurations (requests per window)
        # Development-friendly limits
        environment = os.getenv("ENVIRONMENT", "development")
        
        if environment == "development":
            self.limits = {
                "login": {"limit": 20, "window": 900},      # 20 login attempts per 15 min (dev)
                "register": {"limit": 10, "window": 3600},   # 10 registrations per hour (dev)
                "reset": {"limit": 10, "window": 3600},      # 10 password resets per hour (dev)
                "refresh": {"limit": 30, "window": 3600},    # 30 token refreshes per hour (dev)
                "verify": {"limit": 20, "window": 3600},      # 20 email verifications per hour (dev)
                "change_password": {"limit": 10, "window": 3600}  # 10 password changes per hour (dev)
            }
        else:
            # Production limits
            self.limits = {
                "login": {"limit": 5, "window": 900},      # 5 login attempts per 15 min
                "register": {"limit": 3, "window": 3600},   # 3 registrations per hour
                "reset": {"limit": 3, "window": 3600},      # 3 password resets per hour
                "refresh": {"limit": 10, "window": 3600},    # 10 token refreshes per hour
                "verify": {"limit": 5, "window": 3600},      # 5 email verifications per hour
                "change_password": {"limit": 3, "window": 3600}  # 3 password changes per hour
            }
        
        # Global limits
        self.global_limits = {
            "auth_requests": {"limit": 100, "window": 3600}  # 100 total auth requests per hour
        }
        
        # Initialize Redis connection
        self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis connection established for auth rate limiting")
        except Exception as e:
            logger.warning(f"Redis connection failed, using fallback: {e}")
            self.redis_client = None
    
    def _get_redis_key(self, identifier: str, action: str) -> str:
        """Generate Redis key for rate limiting"""
        return f"auth_rate:{identifier}:{action}"
    
    def _is_rate_limited_redis(self, identifier: str, action: str) -> Dict[str, Any]:
        """Check rate limit using Redis"""
        try:
            if action in self.limits:
                limit_config = self.limits[action]
            else:
                limit_config = self.global_limits.get("auth_requests", {"limit": 100, "window": 3600})
            
            key = self._get_redis_key(identifier, action)
            current_time = int(time.time())
            window_start = current_time - limit_config["window"]
            
            # Use Redis sorted set for sliding window
            pipe = self.redis_client.pipeline()
            
            # Remove old entries
            pipe.zremrangebyscore(key, 0, window_start)
            
            # Add current request
            pipe.zadd(key, {str(current_time): current_time})
            
            # Set expiration
            pipe.expire(key, limit_config["window"])
            
            # Count requests in window
            pipe.zcard(key)
            
            results = pipe.execute()
            request_count = results[3]
            
            is_limited = request_count > limit_config["limit"]
            remaining = max(0, limit_config["limit"] - request_count)
            reset_time = current_time + limit_config["window"]
            
            return {
                "allowed": not is_limited,
                "limit": limit_config["limit"],
                "remaining": remaining,
                "reset_time": reset_time,
                "retry_after": limit_config["window"] if is_limited else 0
            }
            
        except Exception as e:
            logger.error(f"Redis rate limit check failed: {e}")
            # Fail open: allow request if Redis fails
            return {"allowed": True, "error": "Redis failure"}
    
    def _is_rate_limited_fallback(self, identifier: str, action: str) -> Dict[str, Any]:
        """Check rate limit using in-memory fallback"""
        try:
            if action in self.limits:
                limit_config = self.limits[action]
            else:
                limit_config = self.global_limits.get("auth_requests", {"limit": 100, "window": 3600})
            
            current_time = time.time()
            window_start = current_time - limit_config["window"]
            
            # Get or create queue for this identifier/action
            queue_key = f"{identifier}:{action}"
            request_queue = self.fallback_store[queue_key]
            
            # Remove old requests from queue
            while request_queue and request_queue[0] < window_start:
                request_queue.popleft()
            
            # Check if limit exceeded
            is_limited = len(request_queue) >= limit_config["limit"]
            
            if not is_limited:
                # Add current request
                request_queue.append(current_time)
            
            remaining = max(0, limit_config["limit"] - len(request_queue))
            reset_time = current_time + limit_config["window"]
            
            return {
                "allowed": not is_limited,
                "limit": limit_config["limit"],
                "remaining": remaining,
                "reset_time": reset_time,
                "retry_after": limit_config["window"] if is_limited else 0
            }
            
        except Exception as e:
            logger.error(f"Fallback rate limit check failed: {e}")
            # Fail open: allow request if fallback fails
            return {"allowed": True, "error": "Fallback failure"}
    
    def check_rate_limit(self, identifier: str, action: str) -> Dict[str, Any]:
        """Check if identifier is rate limited for action"""
        try:
            if self.redis_client:
                return self._is_rate_limited_redis(identifier, action)
            else:
                return self._is_rate_limited_fallback(identifier, action)
                
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Fail open: allow request
            return {"allowed": True, "error": "Rate limit check failed"}
    
    def record_attempt(self, identifier: str, action: str, success: bool = False):
        """Record an authentication attempt for analytics"""
        try:
            # Store attempt data for security monitoring
            attempt_data = {
                "identifier": identifier,
                "action": action,
                "success": success,
                "timestamp": utc_now().isoformat()
            }
            
            # This could be stored in a separate analytics collection
            # For now, just log it
            logger.info(f"Auth attempt recorded: {action} for {identifier}, success: {success}")
            
        except Exception as e:
            logger.error(f"Failed to record attempt: {e}")
    
    def get_rate_limit_stats(self) -> Dict[str, Any]:
        """Get rate limiting statistics"""
        try:
            stats = {
                "redis_available": self.redis_client is not None,
                "storage_type": "redis" if self.redis_client else "memory",
                "limits_configured": list(self.limits.keys()),
                "fallback_entries": len(self.fallback_store)
            }
            
            if self.redis_client:
                # Get Redis stats
                try:
                    pattern = "auth_rate:*"
                    keys = self.redis_client.keys(pattern)
                    stats["redis_entries"] = len(keys)
                    
                    # Get detailed stats per action
                    stats["action_stats"] = {}
                    for action in self.limits.keys():
                        action_pattern = f"auth_rate:*:{action}"
                        action_keys = self.redis_client.keys(action_pattern)
                        stats["action_stats"][action] = len(action_keys)
                        
                except Exception as e:
                    logger.warning(f"Failed to get Redis stats: {e}")
                    stats["redis_entries"] = 0
                    stats["action_stats"] = {}
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get rate limit stats: {e}")
            return {"error": str(e)}
    
    def cleanup_expired_entries(self) -> int:
        """Clean up expired entries (maintenance task)"""
        try:
            if self.redis_client:
                # Redis handles expiration automatically
                return 0
            else:
                # Cleanup fallback store
                current_time = time.time()
                cleaned_count = 0
                
                for key, queue in list(self.fallback_store.items()):
                    window_start = current_time - 3600  # Default 1 hour window
                    
                    # Remove old requests
                    while queue and queue[0] < window_start:
                        queue.popleft()
                        cleaned_count += 1
                    
                    # Remove empty queues
                    if not queue:
                        del self.fallback_store[key]
                
                logger.info(f"Cleaned up {cleaned_count} expired rate limit entries")
                return cleaned_count
                
        except Exception as e:
            logger.error(f"Failed to cleanup expired entries: {e}")
            return 0
    
    def reset_rate_limit(self, identifier: str, action: str) -> bool:
        """Reset rate limit for a specific identifier (admin function)"""
        try:
            if self.redis_client:
                key = self._get_redis_key(identifier, action)
                self.redis_client.delete(key)
                logger.info(f"Rate limit reset for {identifier}:{action}")
                return True
            else:
                # Remove from fallback store
                queue_key = f"{identifier}:{action}"
                if queue_key in self.fallback_store:
                    del self.fallback_store[queue_key]
                    logger.info(f"Rate limit reset for {identifier}:{action}")
                    return True
                return False
                
        except Exception as e:
            logger.error(f"Failed to reset rate limit: {e}")
            return False

# Global instance
_auth_rate_limiter = None

def get_auth_rate_limiter() -> AuthRateLimiter:
    """Get singleton auth rate limiter instance"""
    global _auth_rate_limiter
    if _auth_rate_limiter is None:
        _auth_rate_limiter = AuthRateLimiter()
    return _auth_rate_limiter

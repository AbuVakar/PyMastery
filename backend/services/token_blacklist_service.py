"""
Token Blacklist Service
Handles token invalidation and revocation for secure logout
"""

import redis
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import logging
from hashlib import sha256

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    """Return current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)

class TokenBlacklistService:
    """Service for managing token blacklisting and revocation"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = None
        self.fallback_store = {}  # In-memory fallback
        self.default_ttl = 3600  # 1 hour default TTL
        
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
            logger.info("Redis connection established for token blacklist")
        except Exception as e:
            logger.warning(f"Redis connection failed, using fallback: {e}")
            self.redis_client = None
    
    def _get_token_hash(self, token: str) -> str:
        """Generate secure hash of token for storage"""
        return sha256(token.encode()).hexdigest()
    
    def blacklist_token(self, token: str, user_id: str, reason: str = "logout", ttl: Optional[int] = None) -> bool:
        """Add token to blacklist"""
        try:
            token_hash = self._get_token_hash(token)
            expiration = ttl or self.default_ttl
            
            blacklist_data = {
                "user_id": user_id,
                "reason": reason,
                "blacklisted_at": utc_now().isoformat(),
                "expires_at": (utc_now() + timedelta(seconds=expiration)).isoformat()
            }
            
            if self.redis_client:
                # Use Redis for distributed blacklist
                key = f"blacklist:{token_hash}"
                self.redis_client.setex(key, expiration, json.dumps(blacklist_data))
                logger.info(f"Token blacklisted in Redis for user {user_id}, reason: {reason}")
            else:
                # Fallback to in-memory storage
                self.fallback_store[token_hash] = {
                    **blacklist_data,
                    "expires_at_timestamp": utc_now().timestamp() + expiration
                }
                logger.info(f"Token blacklisted in memory for user {user_id}, reason: {reason}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
            return False
    
    def is_token_blacklisted(self, token: str) -> bool:
        """Check if token is blacklisted"""
        try:
            token_hash = self._get_token_hash(token)
            
            if self.redis_client:
                # Check Redis
                key = f"blacklist:{token_hash}"
                exists = self.redis_client.exists(key)
                return bool(exists)
            else:
                # Check fallback store and clean expired entries
                self._cleanup_expired_fallback_entries()
                return token_hash in self.fallback_store
                
        except Exception as e:
            logger.error(f"Failed to check blacklist status: {e}")
            # Fail open in development - don't block users if blacklist is unavailable
            return False
    
    def blacklist_all_user_tokens(self, user_id: str, reason: str = "security_action") -> bool:
        """Blacklist all tokens for a user (for security events)"""
        try:
            # This would require tracking active tokens per user
            # For now, we'll add a user-level blacklist
            blacklist_data = {
                "user_id": user_id,
                "reason": reason,
                "blacklisted_at": utc_now().isoformat(),
                "type": "user_wide"
            }
            
            if self.redis_client:
                key = f"blacklist_user:{user_id}"
                self.redis_client.setex(key, self.default_ttl, json.dumps(blacklist_data))
            else:
                self.fallback_store[f"user_blacklist:{user_id}"] = {
                    **blacklist_data,
                    "expires_at_timestamp": utc_now().timestamp() + self.default_ttl
                }
            
            logger.info(f"All tokens blacklisted for user {user_id}, reason: {reason}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to blacklist all user tokens: {e}")
            return False

    def get_user_blacklist_entry(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Return the stored user-wide blacklist entry when present."""
        try:
            if self.redis_client:
                key = f"blacklist_user:{user_id}"
                data = self.redis_client.get(key)
                return json.loads(data) if data else None

            self._cleanup_expired_fallback_entries()
            return self.fallback_store.get(f"user_blacklist:{user_id}")
        except Exception as e:
            logger.error(f"Failed to get user blacklist entry: {e}")
            return None

    def clear_user_blacklist(self, user_id: str) -> bool:
        """Remove a user-wide blacklist entry."""
        try:
            if self.redis_client:
                key = f"blacklist_user:{user_id}"
                self.redis_client.delete(key)
            else:
                self.fallback_store.pop(f"user_blacklist:{user_id}", None)

            logger.info(f"Cleared user blacklist for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to clear user blacklist for {user_id}: {e}")
            return False
    
    def is_user_blacklisted(self, user_id: str) -> bool:
        """Check if user has a token blacklist"""
        try:
            if self.redis_client:
                key = f"blacklist_user:{user_id}"
                exists = self.redis_client.exists(key)
                return bool(exists)
            else:
                self._cleanup_expired_fallback_entries()
                return f"user_blacklist:{user_id}" in self.fallback_store
                
        except Exception as e:
            logger.error(f"Failed to check user blacklist status: {e}")
            # Fail open - don't block users if Redis/store is unavailable
            return False
    
    def _cleanup_expired_fallback_entries(self):
        """Clean up expired entries in fallback store"""
        try:
            current_time = utc_now().timestamp()
            expired_keys = []
            
            for key, data in self.fallback_store.items():
                if current_time > data.get("expires_at_timestamp", 0):
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self.fallback_store[key]
                
            if expired_keys:
                logger.debug(f"Cleaned up {len(expired_keys)} expired blacklist entries")
                
        except Exception as e:
            logger.error(f"Failed to cleanup expired entries: {e}")
    
    def get_blacklist_stats(self) -> Dict[str, Any]:
        """Get blacklist statistics"""
        try:
            stats = {
                "redis_available": self.redis_client is not None,
                "fallback_entries": len(self.fallback_store),
                "storage_type": "redis" if self.redis_client else "memory"
            }
            
            if self.redis_client:
                # Get Redis stats
                try:
                    pattern = "blacklist:*"
                    keys = self.redis_client.keys(pattern)
                    stats["redis_entries"] = len(keys)
                    
                    # Get user blacklist stats
                    user_pattern = "blacklist_user:*"
                    user_keys = self.redis_client.keys(user_pattern)
                    stats["redis_user_blacklists"] = len(user_keys)
                    
                except Exception as e:
                    logger.warning(f"Failed to get Redis stats: {e}")
                    stats["redis_entries"] = 0
                    stats["redis_user_blacklists"] = 0
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get blacklist stats: {e}")
            return {"error": str(e)}
    
    def cleanup_expired_tokens(self) -> int:
        """Manually cleanup expired tokens (maintenance task)"""
        try:
            if self.redis_client:
                # Redis handles expiration automatically
                return 0
            else:
                # Cleanup fallback store
                initial_count = len(self.fallback_store)
                self._cleanup_expired_fallback_entries()
                cleaned_count = initial_count - len(self.fallback_store)
                logger.info(f"Cleaned up {cleaned_count} expired tokens")
                return cleaned_count
                
        except Exception as e:
            logger.error(f"Failed to cleanup expired tokens: {e}")
            return 0

# Global instance
_token_blacklist_service = None

def get_token_blacklist_service() -> TokenBlacklistService:
    """Get singleton token blacklist service instance"""
    global _token_blacklist_service
    if _token_blacklist_service is None:
        _token_blacklist_service = TokenBlacklistService()
    return _token_blacklist_service

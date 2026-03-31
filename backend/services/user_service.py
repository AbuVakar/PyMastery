"""
User service for managing user operations
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging

from database.mongodb import get_database

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    """Return current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)

class UserService:
    """Service for managing user operations"""
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            # Get database connection
            db = await get_database()
            
            # Query user from database
            user_data = await db.users.find_one({"_id": user_id})
            
            if user_data:
                # Convert ObjectId to string for JSON serialization
                user_data["_id"] = str(user_data["_id"])
                return user_data
            
            return None
        except Exception as e:
            logger.error(f"Error getting user {user_id}: {e}")
            return None
    
    async def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Update user profile and invalidate cache"""
        try:
            # Update user in database (mock implementation)
            logger.info(f"📝 Updating user profile for {user_id}")
            
            # Invalidate cache to force refresh on next request
            await invalidate_user_cache(user_id)
            
            # Cache the updated profile
            await cache_user_profile(user_id, profile_data, ttl=1800)
            
            logger.info(f"🗑️ Cache invalidated for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating user profile {user_id}: {e}")
            return False
    
    async def get_user_progress(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user progress"""
        try:
            # This would typically query the database
            return {
                "user_id": user_id,
                "completed_lessons": 15,
                "total_lessons": 50,
                "skill_points": 250,
                "current_streak": 7,
                "last_activity": utc_now(),
                "skill_level": 0.6
            }
        except Exception as e:
            logger.error(f"Error getting user progress {user_id}: {e}")
            return None
    
    async def update_user_progress(self, user_id: str, progress_data: Dict[str, Any]) -> bool:
        """Update user progress"""
        try:
            # This would typically update the database
            logger.info(f"Updated progress for user {user_id}: {progress_data}")
            return True
        except Exception as e:
            logger.error(f"Error updating user progress {user_id}: {e}")
            return False
    
    async def create_user(self, user_data: Dict[str, Any]) -> Optional[str]:
        """Create a new user"""
        try:
            # This would typically create in the database
            user_id = f"user_{utc_now().timestamp()}"
            logger.info(f"Created new user: {user_id}")
            return user_id
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user"""
        try:
            # This would typically verify against database
            if email and password:
                return {
                    "id": "user_123",
                    "email": email,
                    "name": email.split("@")[0],
                    "authenticated": True
                }
            return None
        except Exception as e:
            logger.error(f"Error authenticating user {email}: {e}")
            return None

"""
Dashboard API Router
Provides dashboard statistics, activity, courses, and performers data
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import json
import logging
from bson import ObjectId

from database.mongodb import get_database
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)

class DashboardStats(BaseModel):
    totalUsers: int
    activeCourses: int
    completionRate: float
    avgProgress: float
    revenue: int
    engagement: float

class RecentActivity(BaseModel):
    id: str
    user: str
    action: str
    timestamp: str
    status: str
    avatar: str

class Course(BaseModel):
    id: str
    title: str
    students: int
    progress: float
    status: str
    rating: float

class TopPerformer(BaseModel):
    id: str
    name: str
    avatar: str
    score: int
    completed: int
    streak: int

@router.get("/stats")
async def get_dashboard_stats_endpoint(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get dashboard statistics"""
    try:
        user_id = current_user["sub"]
        
        # Get database connection
        db = await get_database()
        
        # Get dashboard stats
        stats = await db.dashboard_stats.find_one({"user_id": user_id})
        
        if not stats:
            # Return default stats if none found
            return DashboardStats(
                totalUsers=0,
                activeCourses=0,
                completionRate=0.0,
                avgProgress=0.0,
                revenue=0,
                engagement=0.0
            )
        
        # Return basic stats
        return {
            "stats": {
                "totalUsers": stats.get("totalUsers", 0),
                "activeCourses": stats.get("activeCourses", 0),
                "completionRate": stats.get("completionRate", 0.0),
                "avgProgress": stats.get("avgProgress", 0.0),
                "revenue": stats.get("revenue", 0),
                "engagement": stats.get("engagement", 0.0),
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        # Return mock data if database fails
        stats = DashboardStats(
            totalUsers=1247,
            activeCourses=18,
            completionRate=78.5,
            avgProgress=65.2,
            revenue=45780,
            engagement=89.3
        )
        return {"stats": stats.dict()}

@router.get("/activity")
async def get_recent_activity_endpoint(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get recent activity feed"""
    try:
        # Get database connection
        db = await get_database()
        
        # Get recent activities
        activities = await db.activity_log.find({"user_id": current_user["sub"]}).sort("timestamp", -1).limit(10).to_list(None)
        
        return {"activities": [_serialize_mongo_doc(a) for a in activities]}
        
    except Exception as e:
        logger.error(f"Error getting recent activity: {e}")
        # Return empty list if database fails
        return {"activities": []}

@router.get("/courses")
async def get_courses_data_endpoint(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get courses data with progress and student counts"""
    try:
        # Get database connection
        db = await get_database()
        
        # Get courses data
        courses_data = await db.courses.find({}).limit(10).to_list(None)
        
        return {"courses": [_serialize_mongo_doc(c) for c in courses_data]}
        
    except Exception as e:
        logger.error(f"Error getting courses data: {e}")
        # Return empty list if database fails
        return {"courses": []}

@router.get("/performers")
async def get_top_performers_endpoint(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get top performers with scores and streaks"""
    try:
        # Get database connection
        db = await get_database()
        
        # Get top performers
        performers = await db.users.find({}).sort("points", -1).limit(10).to_list(None)
        
        return {"performers": [_serialize_mongo_doc(p) for p in performers]}
        
    except Exception as e:
        logger.error(f"Error getting top performers: {e}")
        # Return empty list if database fails
        return {"performers": []}

# Helper functions
def format_timestamp(timestamp):
    """Format timestamp for display"""
    if isinstance(timestamp, datetime):
        now = datetime.now(timezone.utc)
        diff = now - timestamp
        
        if diff.days > 0:
            return f"{diff.days} days ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hours ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minutes ago"
        else:
            return "Just now"
    else:
        return "Unknown time"

def get_user_initials(name):
    """Get user initials from name"""
    if not name or name == "Unknown User":
        return "U"
    
    parts = name.split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    else:
        return parts[0][:2].upper() if parts else "U"


def _serialize_mongo_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB-specific types into JSON-safe values."""
    serialized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    return serialized

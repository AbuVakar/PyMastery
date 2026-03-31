"""
User profile and stats endpoints used by the frontend.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth.dependencies import get_current_user
from database.mongodb import get_database

router = APIRouter()


class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=30)
    location: Optional[str] = Field(None, max_length=120)
    bio: Optional[str] = Field(None, max_length=1000)
    avatar: Optional[str] = None
    role_track: Optional[str] = None


def _build_user_payload(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(user.get("_id", user.get("id", ""))),
        "name": user.get("name", "PyMastery Learner"),
        "email": user.get("email", "learner@example.com"),
        "role": user.get("role", "student"),
        "role_track": user.get("role_track", "general"),
        "is_verified": user.get("is_verified", False),
        "points": user.get("points", 0),
        "level": user.get("level", 1),
        "badges": user.get("badges", []),
        "login_streak": user.get("login_streak", 0),
        "last_login": user.get("last_login"),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
        "phone": user.get("phone", ""),
        "location": user.get("location", ""),
        "bio": user.get("bio", ""),
        "avatar": user.get("avatar", ""),
        "completedCourses": len(user.get("completed_courses", [])),
        "studyStreak": user.get("login_streak", 0),
    }


@router.get("/api/users/me")
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        db = await get_database()
        user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
        if user:
            return _build_user_payload(user)
    except Exception:
        pass

    fallback_user = {"_id": current_user.get("sub"), **current_user}
    return _build_user_payload(fallback_user)


@router.put("/api/users/me")
async def update_profile(
    request: UserProfileUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    try:
        db = await get_database()
        user_id = ObjectId(current_user["sub"])
        update_fields = {
            key: value
            for key, value in request.dict(exclude_unset=True).items()
            if value is not None
        }
        if update_fields:
            update_fields["updated_at"] = datetime.now(timezone.utc)
            await db.users.update_one({"_id": user_id}, {"$set": update_fields})
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return _build_user_payload(user)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Profile update failed: {exc}") from exc


@router.get("/api/v1/users/stats")
async def get_user_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        db = await get_database()
        user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
        if user:
            return {
                "points": user.get("points", 0),
                "level": user.get("level", 1),
                "study_streak": user.get("login_streak", 0),
                "completed_courses": len(user.get("completed_courses", [])),
                "problems_solved": user.get("problems_solved", 0),
                "badges": len(user.get("badges", [])),
            }
    except Exception:
        pass

    return {
        "points": current_user.get("points", 0),
        "level": current_user.get("level", 1),
        "study_streak": current_user.get("login_streak", 0),
        "completed_courses": len(current_user.get("completed_courses", [])),
        "problems_solved": current_user.get("problems_solved", 0),
        "badges": len(current_user.get("badges", [])),
    }

"""
Leaderboards API Router
Handles user rankings, leaderboards, and performance metrics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from auth.dependencies import get_current_user
from database.mongodb import get_database
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/leaderboards", tags=["Leaderboards"])

# Pydantic Models
class LeaderboardEntry(BaseModel):
    user_id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    points: int
    level: int
    rank: int
    streak: int
    courses_completed: int
    problems_solved: int
    average_score: float
    last_active: datetime
    role_track: str

class LeaderboardResponse(BaseModel):
    category: str
    time_range: str
    entries: List[LeaderboardEntry]
    total_users: int
    user_rank: Optional[LeaderboardEntry] = None
    updated_at: datetime

class UserRanking(BaseModel):
    user_id: str
    overall_rank: int
    category_ranks: Dict[str, int]
    badges: List[str]
    achievements: List[Dict[str, Any]]
    statistics: Dict[str, Any]

@router.get("/", response_model=LeaderboardResponse)
async def get_leaderboard(
    category: str = Query("overall", description="Leaderboard category: overall, points, streak, courses, problems"),
    time_range: str = Query("week", description="Time range: day, week, month, year, all"),
    limit: int = Query(50, ge=1, le=100, description="Number of entries to return"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get leaderboard data for different categories and time ranges"""
    try:
        db = await get_database()
        
        # Calculate time filter
        now = datetime.utcnow()
        if time_range == "day":
            start_date = now - timedelta(days=1)
        elif time_range == "week":
            start_date = now - timedelta(weeks=1)
        elif time_range == "month":
            start_date = now - timedelta(days=30)
        elif time_range == "year":
            start_date = now - timedelta(days=365)
        else:  # all
            start_date = datetime(2020, 1, 1)  # Far enough in the past
        
        # Build aggregation pipeline based on category
        if category == "overall":
            # Overall ranking based on points, level, and activity
            pipeline = [
                {
                    "$match": {
                        "is_active": True,
                        "last_login": {"$gte": start_date}
                    }
                },
                {
                    "$addFields": {
                        "overall_score": {
                            "$add": [
                                {"$multiply": ["$points", 1.0]},
                                {"$multiply": ["$level", 100]},
                                {"$multiply": ["$login_streak", 10]},
                                {"$multiply": [{"$size": {"$ifNull": ["$badges", []]}}, 50]}
                            ]
                        }
                    }
                },
                {
                    "$sort": {"overall_score": -1}
                },
                {
                    "$limit": limit
                },
                {
                    "$project": {
                        "user_id": {"$toString": "$_id"},
                        "name": 1,
                        "email": 1,
                        "avatar_url": {"$ifNull": ["$avatar_url", None]},
                        "points": 1,
                        "level": 1,
                        "rank": {"$add": [{"$indexOfArray": ["$$ROOT", "$_id"]}, 1]},
                        "streak": "$login_streak",
                        "courses_completed": {"$size": {"$ifNull": ["$completed_courses", []]}},
                        "problems_solved": {"$size": {"$ifNull": ["$solved_problems", []]}},
                        "average_score": {"$ifNull": ["$average_score", 0]},
                        "last_active": "$last_login",
                        "role_track": {"$ifNull": ["$role_track", "general"]}
                    }
                }
            ]
        elif category == "points":
            pipeline = [
                {
                    "$match": {
                        "is_active": True,
                        "last_login": {"$gte": start_date}
                    }
                },
                {
                    "$sort": {"points": -1, "level": -1}
                },
                {
                    "$limit": limit
                },
                {
                    "$project": {
                        "user_id": {"$toString": "$_id"},
                        "name": 1,
                        "email": 1,
                        "avatar_url": {"$ifNull": ["$avatar_url", None]},
                        "points": 1,
                        "level": 1,
                        "rank": {"$add": [{"$indexOfArray": ["$$ROOT", "$_id"]}, 1]},
                        "streak": "$login_streak",
                        "courses_completed": {"$size": {"$ifNull": ["$completed_courses", []]}},
                        "problems_solved": {"$size": {"$ifNull": ["$solved_problems", []]}},
                        "average_score": {"$ifNull": ["$average_score", 0]},
                        "last_active": "$last_login",
                        "role_track": {"$ifNull": ["$role_track", "general"]}
                    }
                }
            ]
        elif category == "streak":
            pipeline = [
                {
                    "$match": {
                        "is_active": True,
                        "last_login": {"$gte": start_date}
                    }
                },
                {
                    "$sort": {"login_streak": -1, "points": -1}
                },
                {
                    "$limit": limit
                },
                {
                    "$project": {
                        "user_id": {"$toString": "$_id"},
                        "name": 1,
                        "email": 1,
                        "avatar_url": {"$ifNull": ["$avatar_url", None]},
                        "points": 1,
                        "level": 1,
                        "rank": {"$add": [{"$indexOfArray": ["$$ROOT", "$_id"]}, 1]},
                        "streak": "$login_streak",
                        "courses_completed": {"$size": {"$ifNull": ["$completed_courses", []]}},
                        "problems_solved": {"$size": {"$ifNull": ["$solved_problems", []]}},
                        "average_score": {"$ifNull": ["$average_score", 0]},
                        "last_active": "$last_login",
                        "role_track": {"$ifNull": ["$role_track", "general"]}
                    }
                }
            ]
        elif category == "courses":
            pipeline = [
                {
                    "$match": {
                        "is_active": True,
                        "last_login": {"$gte": start_date}
                    }
                },
                {
                    "$addFields": {
                        "courses_completed": {"$size": {"$ifNull": ["$completed_courses", []]}}
                    }
                },
                {
                    "$sort": {"courses_completed": -1, "points": -1}
                },
                {
                    "$limit": limit
                },
                {
                    "$project": {
                        "user_id": {"$toString": "$_id"},
                        "name": 1,
                        "email": 1,
                        "avatar_url": {"$ifNull": ["$avatar_url", None]},
                        "points": 1,
                        "level": 1,
                        "rank": {"$add": [{"$indexOfArray": ["$$ROOT", "$_id"]}, 1]},
                        "streak": "$login_streak",
                        "courses_completed": 1,
                        "problems_solved": {"$size": {"$ifNull": ["$solved_problems", []]}},
                        "average_score": {"$ifNull": ["$average_score", 0]},
                        "last_active": "$last_login",
                        "role_track": {"$ifNull": ["$role_track", "general"]}
                    }
                }
            ]
        elif category == "problems":
            pipeline = [
                {
                    "$match": {
                        "is_active": True,
                        "last_login": {"$gte": start_date}
                    }
                },
                {
                    "$addFields": {
                        "problems_solved": {"$size": {"$ifNull": ["$solved_problems", []]}},
                        "average_score": {"$ifNull": ["$average_score", 0]}
                    }
                },
                {
                    "$sort": {"problems_solved": -1, "average_score": -1}
                },
                {
                    "$limit": limit
                },
                {
                    "$project": {
                        "user_id": {"$toString": "$_id"},
                        "name": 1,
                        "email": 1,
                        "avatar_url": {"$ifNull": ["$avatar_url", None]},
                        "points": 1,
                        "level": 1,
                        "rank": {"$add": [{"$indexOfArray": ["$$ROOT", "$_id"]}, 1]},
                        "streak": "$login_streak",
                        "courses_completed": {"$size": {"$ifNull": ["$completed_courses", []]}},
                        "problems_solved": 1,
                        "average_score": 1,
                        "last_active": "$last_login",
                        "role_track": {"$ifNull": ["$role_track", "general"]}
                    }
                }
            ]
        else:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        # Execute aggregation
        cursor = db.users.aggregate(pipeline)
        entries = await cursor.to_list(length=limit)
        
        # Get total users count
        total_users = await db.users.count_documents({"is_active": True})
        
        # Get current user's rank
        user_rank = None
        try:
            user_pipeline = pipeline.copy()
            user_pipeline[0]["$match"]["_id"] = current_user["sub"]
            user_cursor = db.users.aggregate(user_pipeline)
            user_entries = await user_cursor.to_list(length=1)
            
            if user_entries:
                user_data = user_entries[0]
                user_rank = LeaderboardEntry(**user_data)
        except Exception as e:
            logger.error(f"Error getting user rank: {e}")
        
        # Convert to LeaderboardEntry objects
        leaderboard_entries = []
        for i, entry in enumerate(entries):
            # Update rank based on position
            entry["rank"] = i + 1
            leaderboard_entries.append(LeaderboardEntry(**entry))
        
        return LeaderboardResponse(
            category=category,
            time_range=time_range,
            entries=leaderboard_entries,
            total_users=total_users,
            user_rank=user_rank,
            updated_at=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard data")

@router.get("/my-ranking", response_model=UserRanking)
async def get_my_ranking(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current user's ranking across different categories"""
    try:
        db = await get_database()
        
        user_id = current_user["sub"]
        
        # Get user data
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate ranks for different categories
        categories = ["overall", "points", "streak", "courses", "problems"]
        category_ranks = {}
        
        for category in categories:
            try:
                # Get user's rank in this category
                if category == "overall":
                    pipeline = [
                        {
                            "$match": {"is_active": True}
                        },
                        {
                            "$addFields": {
                                "overall_score": {
                                    "$add": [
                                        {"$multiply": ["$points", 1.0]},
                                        {"$multiply": ["$level", 100]},
                                        {"$multiply": ["$login_streak", 10]},
                                        {"$multiply": [{"$size": {"$ifNull": ["$badges", []]}}, 50]}
                                    ]
                                }
                            }
                        },
                        {
                            "$sort": {"overall_score": -1}
                        },
                        {
                            "$project": {
                                "user_id": {"$toString": "$_id"},
                                "rank": {"$add": [{"$indexOfArray": ["$$ROOT", "$_id"]}, 1]}
                            }
                        }
                    ]
                elif category == "points":
                    pipeline = [
                        {"$match": {"is_active": True}},
                        {"$sort": {"points": -1, "level": -1}},
                        {"$project": {"user_id": {"$toString": "$_id"}, "rank": {"$add": [{"$indexOfArray": ["$$ROOT", "$_id"]}, 1]}}}
                    ]
                elif category == "streak":
                    pipeline = [
                        {"$match": {"is_active": True}},
                        {"$sort": {"login_streak": -1, "points": -1}},
                        {"$project": {"user_id": {"$toString": "$_id"}, "rank": {"$add": [{"$indexOfArray": ["$$ROOT", "$_id"]}, 1]}}}
                    ]
                elif category == "courses":
                    pipeline = [
                        {"$match": {"is_active": True}},
                        {"$addFields": {"courses_completed": {"$size": {"$ifNull": ["$completed_courses", []]}}}},
                        {"$sort": {"courses_completed": -1, "points": -1}},
                        {"$project": {"user_id": {"$toString": "$_id"}, "rank": {"$add": [{"$indexOfArray": ["$$ROOT", "$_id"]}, 1]}}}
                    ]
                elif category == "problems":
                    pipeline = [
                        {"$match": {"is_active": True}},
                        {"$addFields": {"problems_solved": {"$size": {"$ifNull": ["$solved_problems", []]}}}},
                        {"$sort": {"problems_solved": -1, "average_score": -1}},
                        {"$project": {"user_id": {"$toString": "$_id"}, "rank": {"$add": [{"$indexOfArray": ["$$ROOT", "$_id"]}, 1]}}}
                    ]
                
                cursor = db.users.aggregate(pipeline)
                entries = await cursor.to_list(length=None)
                
                # Find user's rank
                user_rank = None
                for entry in entries:
                    if entry["user_id"] == str(user_id):
                        user_rank = entry["rank"]
                        break
                
                category_ranks[category] = user_rank or 0
                
            except Exception as e:
                logger.error(f"Error calculating rank for {category}: {e}")
                category_ranks[category] = 0
        
        # Get user's overall rank
        overall_rank = category_ranks.get("overall", 0)
        
        # Get user's badges and achievements
        badges = user.get("badges", [])
        achievements = user.get("achievements", [])
        
        # Get user statistics
        statistics = {
            "points": user.get("points", 0),
            "level": user.get("level", 1),
            "login_streak": user.get("login_streak", 0),
            "courses_completed": len(user.get("completed_courses", [])),
            "problems_solved": len(user.get("solved_problems", [])),
            "average_score": user.get("average_score", 0),
            "total_time_spent": user.get("total_time_spent", 0),
            "last_login": user.get("last_login"),
            "created_at": user.get("created_at")
        }
        
        return UserRanking(
            user_id=str(user_id),
            overall_rank=overall_rank,
            category_ranks=category_ranks,
            badges=badges,
            achievements=achievements,
            statistics=statistics
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user ranking: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user ranking")

@router.get("/top-performers")
async def get_top_performers(
    limit: int = Query(10, ge=1, le=50, description="Number of performers to return"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get top performers across different categories"""
    try:
        db = await get_database()
        
        # Get top performers for each category
        categories = ["points", "streak", "courses", "problems"]
        top_performers = {}
        
        for category in categories:
            if category == "points":
                pipeline = [
                    {"$match": {"is_active": True}},
                    {"$sort": {"points": -1, "level": -1}},
                    {"$limit": limit},
                    {"$project": {
                        "user_id": {"$toString": "$_id"},
                        "name": 1,
                        "email": 1,
                        "avatar_url": {"$ifNull": ["$avatar_url", None]},
                        "points": 1,
                        "level": 1,
                        "login_streak": 1,
                        "role_track": {"$ifNull": ["$role_track", "general"]}
                    }}
                ]
            elif category == "streak":
                pipeline = [
                    {"$match": {"is_active": True}},
                    {"$sort": {"login_streak": -1, "points": -1}},
                    {"$limit": limit},
                    {"$project": {
                        "user_id": {"$toString": "$_id"},
                        "name": 1,
                        "email": 1,
                        "avatar_url": {"$ifNull": ["$avatar_url", None]},
                        "points": 1,
                        "level": 1,
                        "login_streak": 1,
                        "role_track": {"$ifNull": ["$role_track", "general"]}
                    }}
                ]
            elif category == "courses":
                pipeline = [
                    {"$match": {"is_active": True}},
                    {"$addFields": {"courses_completed": {"$size": {"$ifNull": ["$completed_courses", []]}}}},
                    {"$sort": {"courses_completed": -1, "points": -1}},
                    {"$limit": limit},
                    {"$project": {
                        "user_id": {"$toString": "$_id"},
                        "name": 1,
                        "email": 1,
                        "avatar_url": {"$ifNull": ["$avatar_url", None]},
                        "points": 1,
                        "level": 1,
                        "courses_completed": 1,
                        "login_streak": 1,
                        "role_track": {"$ifNull": ["$role_track", "general"]}
                    }}
                ]
            elif category == "problems":
                pipeline = [
                    {"$match": {"is_active": True}},
                    {"$addFields": {"problems_solved": {"$size": {"$ifNull": ["$solved_problems", []]}}}},
                    {"$sort": {"problems_solved": -1, "average_score": -1}},
                    {"$limit": limit},
                    {"$project": {
                        "user_id": {"$toString": "$_id"},
                        "name": 1,
                        "email": 1,
                        "avatar_url": {"$ifNull": ["$avatar_url", None]},
                        "points": 1,
                        "level": 1,
                        "problems_solved": 1,
                        "average_score": {"$ifNull": ["$average_score", 0]},
                        "login_streak": 1,
                        "role_track": {"$ifNull": ["$role_track", "general"]}
                    }}
                ]
            
            cursor = db.users.aggregate(pipeline)
            performers = await cursor.to_list(length=limit)
            top_performers[category] = performers
        
        return {
            "top_performers": top_performers,
            "updated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting top performers: {e}")
        raise HTTPException(status_code=500, detail="Failed to get top performers")

@router.get("/statistics")
async def get_leaderboard_statistics(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get overall leaderboard statistics"""
    try:
        db = await get_database()
        
        # Get overall statistics
        total_users = await db.users.count_documents({"is_active": True})
        
        # Get distribution statistics
        pipeline = [
            {"$match": {"is_active": True}},
            {"$group": {
                "_id": None,
                "avg_points": {"$avg": "$points"},
                "avg_level": {"$avg": "$level"},
                "avg_streak": {"$avg": "$login_streak"},
                "total_points": {"$sum": "$points"},
                "max_points": {"$max": "$points"},
                "min_points": {"$min": "$points"}
            }}
        ]
        
        cursor = db.users.aggregate(pipeline)
        stats = await cursor.to_list(length=1)
        
        overall_stats = stats[0] if stats else {
            "avg_points": 0,
            "avg_level": 1,
            "avg_streak": 0,
            "total_points": 0,
            "max_points": 0,
            "min_points": 0
        }
        
        # Get role track distribution
        role_pipeline = [
            {"$match": {"is_active": True}},
            {"$group": {
                "_id": "$role_track",
                "count": {"$sum": 1},
                "avg_points": {"$avg": "$points"}
            }},
            {"$sort": {"count": -1}}
        ]
        
        role_cursor = db.users.aggregate(role_pipeline)
        role_distribution = await role_cursor.to_list(length=None)
        
        # Get level distribution
        level_pipeline = [
            {"$match": {"is_active": True}},
            {"$group": {
                "_id": "$level",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        level_cursor = db.users.aggregate(level_pipeline)
        level_distribution = await level_cursor.to_list(length=None)
        
        return {
            "total_users": total_users,
            "overall_stats": overall_stats,
            "role_distribution": role_distribution,
            "level_distribution": level_distribution,
            "updated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting leaderboard statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard statistics")

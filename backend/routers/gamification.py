"""
Enhanced Gamification API Router
Handles achievements, leaderboards, points, user statistics, challenges, and rewards
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import json

from database.mongodb import get_database
from auth.dependencies import get_current_user
from services.gamification import get_gamification_service, GamificationService

router = APIRouter(prefix="/api/v1/gamification", tags=["Gamification"])

# Enhanced Pydantic Models
class AchievementResponse(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    category: str
    rarity: str
    points: int
    badge: str
    requirements: Dict[str, Any]
    progress: Dict[str, Any]
    unlocked: bool
    hidden: bool
    completed_at: Optional[datetime]
    created_at: datetime

class UserStatsResponse(BaseModel):
    user_id: str
    total_points: int
    current_level: int
    next_level_points: int
    level_progress: float
    total_achievements: int
    unlocked_achievements: int
    current_streak: int
    longest_streak: int
    total_study_time: int
    problems_solved: int
    courses_completed: int
    average_score: float
    rank: int
    badges: List[str]
    last_study_date: datetime
    updated_at: datetime

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    email: str
    avatar_url: Optional[str]
    points: int
    level: int
    streak: int
    courses_completed: int
    problems_solved: int
    average_score: float
    badges: int
    last_active: datetime
    role_track: str
    rank_change: int

class GamificationEvent(BaseModel):
    id: str
    type: str
    title: str
    description: str
    points: int
    icon: str
    data: Dict[str, Any]
    read: bool
    created_at: datetime

class CheckAchievementsRequest(BaseModel):
    action: str
    data: Dict[str, Any]

class PointsRequest(BaseModel):
    points: int
    reason: str

# Legacy Models for compatibility
class UserStats(BaseModel):
    level: int
    experience: int
    nextLevelExp: int
    totalChallenges: int
    completedChallenges: int
    streak: int
    badges: List[str]
    rank: int
    coins: int
    powerUps: Dict[str, int]

class Challenge(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    timeLimit: int
    rewards: Dict[str, Any]
    requirements: List[str]
    completed: bool
    progress: Optional[int] = 0
    participants: Optional[int] = 0

class ChallengeResponse(BaseModel):
    daily: List[Challenge]
    weekly: List[Challenge]
    monthly: List[Challenge]
    special: List[Challenge]

# Helper Functions
async def get_gamification_service_with_db(db) -> GamificationService:
    """Get gamification service instance"""
    return await get_gamification_service(db)

# Enhanced API Endpoints
@router.get("/achievements", response_model=List[AchievementResponse])
async def get_user_achievements(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all achievements for the current user"""
    try:
        service = await get_gamification_service_with_db(db)
        achievements = await service.get_user_achievements(current_user["_id"])
        
        return achievements
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/achievements/{achievement_id}/progress")
async def get_achievement_progress(
    achievement_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get progress for a specific achievement"""
    try:
        service = await get_gamification_service_with_db(db)
        achievements = await service.get_user_achievements(current_user["_id"])
        
        for achievement in achievements:
            if achievement["id"] == achievement_id:
                return {
                    "achievement_id": achievement_id,
                    "progress": achievement["progress"],
                    "unlocked": achievement["unlocked"]
                }
        
        raise HTTPException(status_code=404, detail="Achievement not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/achievements/check")
async def check_achievements(
    request: CheckAchievementsRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Check and unlock achievements based on user actions"""
    try:
        service = await get_gamification_service_with_db(db)
        unlocked = await service.check_achievements(
            current_user["_id"],
            request.action,
            request.data
        )
        
        return {
            "unlocked_achievements": unlocked,
            "total_unlocked": len(unlocked)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/achievements/{achievement_id}/unlock")
async def unlock_achievement(
    achievement_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Manually unlock an achievement (admin only)"""
    try:
        # Check if user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        service = await get_gamification_service_with_db(db)
        success = await service.unlock_achievement(current_user["_id"], achievement_id)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to unlock achievement")
        
        return {"message": "Achievement unlocked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get comprehensive user statistics"""
    try:
        service = await get_gamification_service_with_db(db)
        stats = await service.get_user_stats(current_user["_id"])
        
        if not stats:
            raise HTTPException(status_code=404, detail="User stats not found")
        
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = Query(50, ge=1, le=100),
    type: str = Query("overall", regex="^(overall|points|streak|courses|problems)$"),
    time_range: str = Query("all", regex="^(day|week|month|year|all)$"),
    db = Depends(get_database)
):
    """Get leaderboard data"""
    try:
        service = await get_gamification_service_with_db(db)
        leaderboard = await service.get_leaderboard(limit, type)
        
        return leaderboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard/my-ranking")
async def get_my_ranking(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get current user's ranking"""
    try:
        service = await get_gamification_service_with_db(db)
        stats = await service.get_user_stats(current_user["_id"])
        
        if not stats:
            raise HTTPException(status_code=404, detail="User stats not found")
        
        return {
            "rank": stats.get("rank", 0),
            "total_users": await db.user_stats.count_documents(),
            "points": stats.get("total_points", 0),
            "level": stats.get("current_level", 1)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard/top-performers")
async def get_top_performers(
    category: str = Query("points", regex="^(points|streak|courses|problems)$"),
    limit: int = Query(10, ge=1, le=20),
    db = Depends(get_database)
):
    """Get top performers in a specific category"""
    try:
        service = await get_gamification_service_with_db(db)
        leaderboard = await service.get_leaderboard(limit, category)
        
        return leaderboard[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard/stats")
async def get_leaderboard_stats(
    db = Depends(get_database)
):
    """Get leaderboard statistics"""
    try:
        service = await get_gamification_service_with_db(db)
        stats = await service.get_leaderboard_stats()
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events", response_model=List[GamificationEvent])
async def get_gamification_events(
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's gamification events"""
    try:
        service = await get_gamification_service_with_db(db)
        events = await service.get_user_events(current_user["_id"], limit)
        
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/{event_id}/read")
async def mark_event_as_read(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark an event as read"""
    try:
        service = await get_gamification_service_with_db(db)
        success = await service.mark_event_read(current_user["_id"], event_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return {"message": "Event marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/mark-all-read")
async def mark_all_events_read(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark all events as read"""
    try:
        service = await get_gamification_service_with_db(db)
        events = await service.get_user_events(current_user["_id"], 100)
        
        for event in events:
            await service.mark_event_read(current_user["_id"], str(event["_id"]))
        
        return {"message": "All events marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories")
async def get_achievement_categories(
    db = Depends(get_database)
):
    """Get achievement categories with counts"""
    try:
        service = await get_gamification_service_with_db(db)
        
        # Get all achievements
        achievements = await db.achievements.find({}).to_list(None)
        
        # Group by category
        categories = {}
        for achievement in achievements:
            category = achievement["category"]
            if category not in categories:
                categories[category] = {
                    "name": category.capitalize(),
                    "total": 0,
                    "icon": achievement["icon"]
                }
            categories[category]["total"] += 1
        
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/streak-milestones")
async def get_streak_milestones(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get streak milestones and user progress"""
    try:
        service = await get_gamification_service_with_db(db)
        stats = await service.get_user_stats(current_user["_id"])
        
        if not stats:
            raise HTTPException(status_code=404, detail="User stats not found")
        
        milestones = [
            {"days": 3, "title": "3-Day Streak", "description": "Keep it going!", "icon": "ðŸ”¥"},
            {"days": 7, "title": "Week Warrior", "description": "A full week!", "icon": "ðŸ’ª"},
            {"days": 14, "title": "Two Weeks", "description": "Amazing consistency!", "icon": "ðŸŒŸ"},
            {"days": 30, "title": "Month Master", "description": "30 days of learning!", "icon": "ðŸ†"},
            {"days": 60, "title": "Two Months", "description": "Incredible dedication!", "icon": "ðŸŽ¯"},
            {"days": 100, "title": "Century Club", "description": "100 days strong!", "icon": "ðŸ’Ž"},
            {"days": 365, "title": "Year Legend", "description": "A full year!", "icon": "ðŸ‘‘"}
        ]
        
        for milestone in milestones:
            milestone["achieved"] = stats.get("longest_streak", 0) >= milestone["days"]
            milestone["current"] = stats.get("current_streak", 0) >= milestone["days"]
        
        return {
            "current_streak": stats.get("current_streak", 0),
            "longest_streak": stats.get("longest_streak", 0),
            "milestones": milestones
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/points/add")
async def add_points(
    request: PointsRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Add points to user (admin only)"""
    try:
        # Check if user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        service = await get_gamification_service_with_db(db)
        await service._add_points(current_user["_id"], request.points, request.reason)
        
        return {"message": f"Added {request.points} points successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/points/history")
async def get_points_history(
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's points history"""
    try:
        history = await db.points_history.find(
            {"user_id": current_user["_id"]}
        ).sort("created_at", -1).limit(limit).to_list(None)
        
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/badges")
async def get_user_badges(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's earned badges"""
    try:
        # Get user's unlocked achievements
        user_achievements = await db.user_achievements.find(
            {"user_id": current_user["_id"]}
        ).to_list(None)
        
        # Get badge information
        badges = []
        for ua in user_achievements:
            achievement = await db.achievements.find_one({"id": ua["achievement_id"]})
            if achievement:
                badges.append({
                    "id": achievement["badge"],
                    "title": achievement["title"],
                    "description": achievement["description"],
                    "icon": achievement["icon"],
                    "rarity": achievement["rarity"],
                    "earned_at": ua["unlocked_at"]
                })
        
        return badges
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/overview")
async def get_gamification_overview(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get comprehensive gamification overview"""
    try:
        service = await get_gamification_service_with_db(db)
        stats = await service.get_user_stats(current_user["_id"])
        achievements = await service.get_user_achievements(current_user["_id"])
        events = await service.get_user_events(current_user["_id"], 5)
        
        if not stats:
            raise HTTPException(status_code=404, detail="User stats not found")
        
        # Calculate categories
        categories = {}
        for achievement in achievements:
            category = achievement["category"]
            if category not in categories:
                categories[category] = {"total": 0, "unlocked": 0}
            categories[category]["total"] += 1
            if achievement["unlocked"]:
                categories[category]["unlocked"] += 1
        
        # Get next achievements
        next_achievements = [
            a for a in achievements 
            if not a["unlocked"] and a["progress"]["percentage"] > 0
        ]
        next_achievements.sort(key=lambda x: x["progress"]["percentage"], reverse=True)
        
        return {
            "stats": stats,
            "categories": categories,
            "next_achievements": next_achievements[:5],
            "recent_events": events,
            "total_achievements": len(achievements),
            "unlocked_achievements": len([a for a in achievements if a["unlocked"]]),
            "completion_rate": (len([a for a in achievements if a["unlocked"]]) / len(achievements)) * 100 if achievements else 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Legacy Endpoints for Compatibility
@router.get("/user-stats")
async def get_user_stats_legacy(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current user's gamification stats"""
    try:
        db = await get_database()
        user_id = current_user["sub"]
        
        # Get user's gamification data
        user_data = await db.users.find_one({"_id": user_id})
        
        if not user_data:
            # Initialize user stats
            stats = UserStats(
                level=1,
                experience=0,
                nextLevelExp=100,
                totalChallenges=0,
                completedChallenges=0,
                streak=0,
                badges=[],
                rank=0,
                coins=0,
                powerUps={}
            )
        else:
            # Calculate stats from user data
            completed_challenges = await db.challenge_submissions.count_documents({
                "user_id": user_id,
                "status": "completed"
            })
            
            total_challenges = await db.challenges.count_documents({})
            
            # Calculate level based on experience
            experience = user_data.get("points", 0)
            level = 1
            next_level_exp = 100
            
            while experience >= next_level_exp:
                level += 1
                next_level_exp = int(next_level_exp * 1.5)
            
            # Get badges
            badges = user_data.get("badges", [])
            
            # Get rank
            rank = await db.users.count_documents({"points": {"$gt": experience}}) + 1
            
            # Get coins
            coins = user_data.get("coins", 0)
            
            # Get power-ups
            power_ups = user_data.get("power_ups", {})
            
            stats = UserStats(
                level=level,
                experience=experience,
                nextLevelExp=next_level_exp,
                totalChallenges=total_challenges,
                completedChallenges=completed_challenges,
                streak=user_data.get("login_streak", 0),
                badges=badges,
                rank=rank,
                coins=coins,
                powerUps=power_ups
            )
        
        return {"stats": stats.dict()}
        
    except Exception as e:
        # Return fallback stats
        stats = UserStats(
            level=1,
            experience=0,
            nextLevelExp=100,
            totalChallenges=0,
            completedChallenges=0,
            streak=0,
            badges=[],
            rank=0,
            coins=0,
            powerUps={}
        )
        return {"stats": stats.dict()}

@router.get("/challenges")
async def get_challenges():
    """Get available challenges"""
    try:
        db = await get_database()
        
        # Get challenges from database
        challenges_cursor = db.challenges.find({"status": "active"})
        challenges = await challenges_cursor.to_list(length=50)
        
        # Organize challenges by type
        daily_challenges = []
        weekly_challenges = []
        monthly_challenges = []
        special_challenges = []
        
        for challenge in challenges:
            challenge_obj = Challenge(
                id=challenge["_id"],
                title=challenge["title"],
                description=challenge["description"],
                difficulty=challenge["difficulty"],
                timeLimit=challenge.get("time_limit", 600),
                rewards=challenge.get("rewards", {}),
                requirements=challenge.get("requirements", []),
                completed=False,
                progress=0,
                participants=challenge.get("participants", 0)
            )
            
            if challenge["type"] == "daily":
                daily_challenges.append(challenge_obj)
            elif challenge["type"] == "weekly":
                weekly_challenges.append(challenge_obj)
            elif challenge["type"] == "monthly":
                monthly_challenges.append(challenge_obj)
            elif challenge["type"] == "special":
                special_challenges.append(challenge_obj)
        
        # If no challenges in database, return fallback challenges
        if not daily_challenges and not weekly_challenges:
            daily_challenges = [
                Challenge(
                    id=1,
                    title="Array Master",
                    description="Solve 3 array problems in under 10 minutes",
                    difficulty="medium",
                    timeLimit=600,
                    rewards={"exp": 50, "coins": 25, "badges": ["Daily Warrior"]},
                    requirements=["Arrays", "Two Pointers"],
                    completed=False,
                    participants=127
                ),
                Challenge(
                    id=2,
                    title="String Wizard",
                    description="Complete 5 string manipulation challenges",
                    difficulty="easy",
                    timeLimit=900,
                    rewards={"exp": 30, "coins": 15, "badges": ["String Master"]},
                    requirements=["Strings", "Regular Expressions"],
                    completed=False,
                    participants=89
                )
            ]
            
            weekly_challenges = [
                Challenge(
                    id=3,
                    title="Algorithm Champion",
                    description="Master sorting and searching algorithms",
                    difficulty="hard",
                    timeLimit=1800,
                    rewards={"exp": 150, "coins": 75, "badges": ["Algorithm Master"]},
                    requirements=["Sorting", "Searching", "Big O"],
                    completed=False,
                    participants=45
                )
            ]
        
        response = ChallengeResponse(
            daily=daily_challenges,
            weekly=weekly_challenges,
            monthly=monthly_challenges,
            special=special_challenges
        )
        
        return response.dict()
        
    except Exception as e:
        # Return fallback challenges
        daily_challenges = [
            Challenge(
                id=1,
                title="Array Master",
                description="Solve 3 array problems in under 10 minutes",
                difficulty="medium",
                timeLimit=600,
                rewards={"exp": 50, "coins": 25, "badges": ["Daily Warrior"]},
                requirements=["Arrays", "Two Pointers"],
                completed=False,
                participants=127
            )
        ]
        
        response = ChallengeResponse(
            daily=daily_challenges,
            weekly=[],
            monthly=[],
            special=[]
        )
        
        return response.dict()

@router.post("/challenges/{challenge_id}/start")
async def start_challenge(
    challenge_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Start a challenge"""
    try:
        db = await get_database()
        user_id = current_user["sub"]
        
        # Check if challenge exists
        challenge = await db.challenges.find_one({"_id": challenge_id})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        # Create challenge submission
        submission = {
            "user_id": user_id,
            "challenge_id": challenge_id,
            "status": "in_progress",
            "started_at": datetime.now(timezone.utc),
            "completed_at": None,
            "score": 0,
            "attempts": 0
        }
        
        await db.challenge_submissions.insert_one(submission)
        
        return {"message": "Challenge started successfully", "submission_id": str(submission["_id"])}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to start challenge")

@router.post("/challenges/{challenge_id}/complete")
async def complete_challenge(
    challenge_id: int,
    score: Optional[int] = 100,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Complete a challenge and earn rewards"""
    try:
        db = await get_database()
        user_id = current_user["sub"]
        
        # Get challenge
        challenge = await db.challenges.find_one({"_id": challenge_id})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        # Update submission
        await db.challenge_submissions.update_one(
            {"user_id": user_id, "challenge_id": challenge_id, "status": "in_progress"},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc),
                    "score": score
                }
            }
        )
        
        # Update user stats
        rewards = challenge.get("rewards", {})
        
        # Add experience
        exp_gained = rewards.get("exp", 0)
        await db.users.update_one(
            {"_id": user_id},
            {"$inc": {"points": exp_gained}}
        )
        
        # Add coins
        coins_gained = rewards.get("coins", 0)
        await db.users.update_one(
            {"_id": user_id},
            {"$inc": {"coins": coins_gained}}
        )
        
        # Add badges
        badges_gained = rewards.get("badges", [])
        if badges_gained:
            await db.users.update_one(
                {"_id": user_id},
                {"$addToSet": {"badges": {"$each": badges_gained}}}
            )
        
        return {
            "message": "Challenge completed successfully",
            "rewards": rewards,
            "score": score
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to complete challenge")

@router.get("/leaderboard")
async def get_leaderboard():
    """Get gamification leaderboard"""
    try:
        db = await get_database()
        
        # Get top users by points
        top_users = await db.users.find(
            {},
            {"name": 1, "points": 1, "badges": 1, "login_streak": 1}
        ).sort("points", -1).to_list(length=10)
        
        leaderboard = []
        for rank, user in enumerate(top_users, 1):
            leaderboard.append({
                "rank": rank,
                "name": user.get("name", "Anonymous"),
                "points": user.get("points", 0),
                "badges": user.get("badges", []),
                "streak": user.get("login_streak", 0)
            })
        
        return {"leaderboard": leaderboard}
        
    except Exception as e:
        return {"leaderboard": []}

@router.get("/badges")
async def get_available_badges():
    """Get all available badges"""
    try:
        badges = [
            {"id": "daily_warrior", "name": "Daily Warrior", "description": "Complete a daily challenge"},
            {"id": "string_master", "name": "String Master", "description": "Master string manipulation"},
            {"id": "algorithm_master", "name": "Algorithm Master", "description": "Master algorithms"},
            {"id": "streak_master", "name": "Streak Master", "description": "Maintain a 30-day streak"},
            {"id": "point_collector", "name": "Point Collector", "description": "Earn 1000 points"},
            {"id": "challenge_champion", "name": "Challenge Champion", "description": "Complete 50 challenges"}
        ]
        
        return {"badges": badges}
        
    except Exception as e:
        return {"badges": []}

"""
Gamification Service for PyMastery
Handles achievements, leaderboards, points, and user statistics
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

logger = logging.getLogger(__name__)

class GamificationService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.achievements_collection = db.achievements
        self.user_achievements_collection = db.user_achievements
        self.leaderboard_collection = db.leaderboards
        self.user_stats_collection = db.user_stats
        self.gamification_events_collection = db.gamification_events
        self.points_history_collection = db.points_history

    async def initialize_service(self):
        """Initialize gamification service with default achievements and setup"""
        try:
            await self._create_default_achievements()
            await self._create_indexes()
            logger.info("Gamification service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize gamification service: {e}")
            raise

    async def _create_default_achievements(self):
        """Create default achievements if they don't exist"""
        default_achievements = [
            # Course Achievements
            {
                "id": "first_course",
                "title": "First Steps",
                "description": "Complete your first course",
                "icon": "ðŸŽ“",
                "category": "course",
                "rarity": "common",
                "points": 50,
                "badge": "first_course",
                "requirements": {
                    "type": "completion",
                    "target": 1,
                    "description": "Complete 1 course"
                },
                "hidden": False,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "course_master",
                "title": "Course Master",
                "description": "Complete 10 courses",
                "icon": "ðŸ†",
                "category": "course",
                "rarity": "epic",
                "points": 500,
                "badge": "course_master",
                "requirements": {
                    "type": "completion",
                    "target": 10,
                    "description": "Complete 10 courses"
                },
                "hidden": False,
                "created_at": datetime.now(timezone.utc)
            },
            
            # Problem Solving Achievements
            {
                "id": "first_problem",
                "title": "Problem Solver",
                "description": "Solve your first coding problem",
                "icon": "ðŸ’»",
                "category": "problem",
                "rarity": "common",
                "points": 25,
                "badge": "first_problem",
                "requirements": {
                    "type": "count",
                    "target": 1,
                    "description": "Solve 1 problem"
                },
                "hidden": False,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "century_problems",
                "title": "Century Club",
                "description": "Solve 100 coding problems",
                "icon": "ðŸ’Ž",
                "category": "problem",
                "rarity": "legendary",
                "points": 1000,
                "badge": "century_problems",
                "requirements": {
                    "type": "count",
                    "target": 100,
                    "description": "Solve 100 problems"
                },
                "hidden": False,
                "created_at": datetime.now(timezone.utc)
            },
            
            # Streak Achievements
            {
                "id": "week_warrior",
                "title": "Week Warrior",
                "description": "Maintain a 7-day streak",
                "icon": "ðŸ”¥",
                "category": "streak",
                "rarity": "rare",
                "points": 100,
                "badge": "week_warrior",
                "requirements": {
                    "type": "streak",
                    "target": 7,
                    "description": "Maintain a 7-day streak"
                },
                "hidden": False,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "month_master",
                "title": "Month Master",
                "description": "Maintain a 30-day streak",
                "icon": "ðŸŒŸ",
                "category": "streak",
                "rarity": "epic",
                "points": 300,
                "badge": "month_master",
                "requirements": {
                    "type": "streak",
                    "target": 30,
                    "description": "Maintain a 30-day streak"
                },
                "hidden": False,
                "created_at": datetime.now(timezone.utc)
            },
            
            # Score Achievements
            {
                "id": "perfect_score",
                "title": "Perfect Score",
                "description": "Get 100% on a problem",
                "icon": "ðŸŽ¯",
                "category": "milestone",
                "rarity": "rare",
                "points": 75,
                "badge": "perfect_score",
                "requirements": {
                    "type": "score",
                    "target": 100,
                    "description": "Get 100% score"
                },
                "hidden": False,
                "created_at": datetime.now(timezone.utc)
            },
            
            # Social Achievements
            {
                "id": "helpful_peer",
                "title": "Helpful Peer",
                "description": "Help 5 other students with their problems",
                "icon": "ðŸ¤",
                "category": "social",
                "rarity": "common",
                "points": 50,
                "badge": "helpful_peer",
                "requirements": {
                    "type": "count",
                    "target": 5,
                    "description": "Help 5 students"
                },
                "hidden": False,
                "created_at": datetime.now(timezone.utc)
            },
            
            # Special Achievements
            {
                "id": "early_bird",
                "title": "Early Bird",
                "description": "Complete a problem before 6 AM",
                "icon": "ðŸ¦",
                "category": "special",
                "rarity": "rare",
                "points": 100,
                "badge": "early_bird",
                "requirements": {
                    "type": "time",
                    "target": 6,
                    "description": "Complete before 6 AM"
                },
                "hidden": True,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "night_owl",
                "title": "Night Owl",
                "description": "Complete a problem after midnight",
                "icon": "ðŸ¦‰",
                "category": "special",
                "rarity": "rare",
                "points": 100,
                "badge": "night_owl",
                "requirements": {
                    "type": "time",
                    "target": 0,
                    "description": "Complete after midnight"
                },
                "hidden": True,
                "created_at": datetime.now(timezone.utc)
            }
        ]

        for achievement in default_achievements:
            await self.achievements_collection.update_one(
                {"id": achievement["id"]},
                {"$set": achievement},
                upsert=True
            )

    async def _create_indexes(self):
        """Create database indexes for gamification collections"""
        # User achievements indexes
        await self.user_achievements_collection.create_index("user_id")
        await self.user_achievements_collection.create_index("achievement_id")
        await self.user_achievements_collection.create_index("unlocked_at")
        
        # Leaderboard indexes
        await self.leaderboard_collection.create_index("rank")
        await self.leaderboard_collection.create_index("points", -1)
        await self.leaderboard_collection.create_index("updated_at")
        
        # User stats indexes
        await self.user_stats_collection.create_index("user_id", unique=True)
        await self.user_stats_collection.create_index("points", -1)
        await self.user_stats_collection.create_index("level", -1)
        
        # Events indexes
        await self.gamification_events_collection.create_index("user_id")
        await self.gamification_events_collection.create_index("type")
        await self.gamification_events_collection.create_index("created_at", -1)

    async def get_user_achievements(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all achievements for a user with progress"""
        try:
            # Get all achievements
            all_achievements = await self.achievements_collection.find({}).to_list(None)
            
            # Get user's unlocked achievements
            user_achievements = await self.user_achievements_collection.find({"user_id": user_id}).to_list(None)
            unlocked_ids = {ua["achievement_id"] for ua in user_achievements}
            
            # Combine achievements with progress
            result = []
            for achievement in all_achievements:
                user_achievement = next((ua for ua in user_achievements if ua["achievement_id"] == achievement["id"]), None)
                
                progress = await self._calculate_achievement_progress(user_id, achievement)
                
                result.append({
                    **achievement,
                    "progress": progress,
                    "unlocked": achievement["id"] in unlocked_ids,
                    "completed_at": user_achievement["unlocked_at"] if user_achievement else None
                })
            
            return result
        except Exception as e:
            logger.error(f"Error getting user achievements: {e}")
            return []

    async def _calculate_achievement_progress(self, user_id: str, achievement: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate progress for an achievement"""
        try:
            req_type = achievement["requirements"]["type"]
            target = achievement["requirements"]["target"]
            
            if req_type == "completion":
                # Course completion progress
                completed_courses = await self.db.enrollments.count_documents({
                    "user_id": user_id,
                    "status": "completed"
                })
                current = min(completed_courses, target)
                
            elif req_type == "count":
                # Problem solving progress
                solved_problems = await self.db.submissions.count_documents({
                    "user_id": user_id,
                    "overall_status": "accepted"
                })
                current = min(solved_problems, target)
                
            elif req_type == "streak":
                # Streak progress
                user_stats = await self.user_stats_collection.find_one({"user_id": user_id})
                current = min(user_stats.get("current_streak", 0) if user_stats else 0, target)
                
            elif req_type == "score":
                # Perfect score progress
                perfect_scores = await self.db.submissions.count_documents({
                    "user_id": user_id,
                    "overall_status": "accepted",
                    "score": 100
                })
                current = min(1 if perfect_scores > 0 else 0, target)
                
            elif req_type == "time":
                # Time-based achievements (early bird, night owl)
                current = 0  # These are checked on completion
                
            else:
                current = 0
            
            return {
                "current": current,
                "target": target,
                "percentage": (current / target) * 100 if target > 0 else 0,
                "completed": current >= target
            }
        except Exception as e:
            logger.error(f"Error calculating achievement progress: {e}")
            return {
                "current": 0,
                "target": target,
                "percentage": 0,
                "completed": False
            }

    async def unlock_achievement(self, user_id: str, achievement_id: str) -> bool:
        """Unlock an achievement for a user"""
        try:
            # Check if already unlocked
            existing = await self.user_achievements_collection.find_one({
                "user_id": user_id,
                "achievement_id": achievement_id
            })
            
            if existing:
                return False
            
            # Get achievement details
            achievement = await self.achievements_collection.find_one({"id": achievement_id})
            if not achievement:
                return False
            
            # Add points to user
            await self._add_points(user_id, achievement["points"], f"Achievement: {achievement['title']}")
            
            # Unlock achievement
            await self.user_achievements_collection.insert_one({
                "user_id": user_id,
                "achievement_id": achievement_id,
                "unlocked_at": datetime.now(timezone.utc),
                "points_awarded": achievement["points"]
            })
            
            # Create event
            await self._create_gamification_event(
                user_id,
                "achievement_unlocked",
                f"Achievement Unlocked: {achievement['title']}",
                achievement["points"],
                achievement["icon"],
                {"achievement_id": achievement_id}
            )
            
            logger.info(f"Achievement {achievement_id} unlocked for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error unlocking achievement: {e}")
            return False

    async def check_achievements(self, user_id: str, action: str, data: Dict[str, Any]) -> List[str]:
        """Check and unlock achievements based on user actions"""
        try:
            unlocked = []
            
            # Get all achievements
            all_achievements = await self.achievements_collection.find({}).to_list(None)
            
            for achievement in all_achievements:
                # Skip if already unlocked
                existing = await self.user_achievements_collection.find_one({
                    "user_id": user_id,
                    "achievement_id": achievement["id"]
                })
                if existing:
                    continue
                
                # Check if achievement conditions are met
                if await self._check_achievement_conditions(user_id, achievement, action, data):
                    if await self.unlock_achievement(user_id, achievement["id"]):
                        unlocked.append(achievement["id"])
            
            return unlocked
        except Exception as e:
            logger.error(f"Error checking achievements: {e}")
            return []

    async def _check_achievement_conditions(self, user_id: str, achievement: Dict[str, Any], action: str, data: Dict[str, Any]) -> bool:
        """Check if achievement conditions are met"""
        try:
            req_type = achievement["requirements"]["type"]
            target = achievement["requirements"]["target"]
            
            if req_type == "completion" and action == "course_completed":
                completed_courses = await self.db.enrollments.count_documents({
                    "user_id": user_id,
                    "status": "completed"
                })
                return completed_courses >= target
                
            elif req_type == "count" and action == "problem_solved":
                solved_problems = await self.db.submissions.count_documents({
                    "user_id": user_id,
                    "overall_status": "accepted"
                })
                return solved_problems >= target
                
            elif req_type == "streak" and action == "streak_updated":
                user_stats = await self.user_stats_collection.find_one({"user_id": user_id})
                return (user_stats.get("current_streak", 0) if user_stats else 0) >= target
                
            elif req_type == "score" and action == "problem_solved":
                return data.get("score", 0) >= target
                
            elif req_type == "time" and action == "problem_solved":
                hour = datetime.now(timezone.utc).hour
                if achievement["id"] == "early_bird":
                    return 5 <= hour < 6
                elif achievement["id"] == "night_owl":
                    return 0 <= hour < 1
                elif achievement["id"] == "night_owl":
                    return 23 <= hour <= 24
                
            return False
        except Exception as e:
            logger.error(f"Error checking achievement conditions: {e}")
            return False

    async def get_user_stats(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive user statistics"""
        try:
            # Get existing stats
            stats = await self.user_stats_collection.find_one({"user_id": user_id})
            
            if not stats:
                # Create initial stats
                stats = await self._create_initial_stats(user_id)
            else:
                # Update stats
                stats = await self._update_user_stats(user_id, stats)
            
            return stats
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            return None

    async def _create_initial_stats(self, user_id: str) -> Dict[str, Any]:
        """Create initial user statistics"""
        try:
            # Get user info
            user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            
            # Calculate initial stats
            solved_problems = await self.db.submissions.count_documents({
                "user_id": user_id,
                "overall_status": "accepted"
            })
            
            completed_courses = await self.db.enrollments.count_documents({
                "user_id": user_id,
                "status": "completed"
            })
            
            # Calculate average score
            submissions = await self.db.submissions.find({
                "user_id": user_id,
                "overall_status": "accepted",
                "score": {"$exists": True}
            }).to_list(None)
            
            average_score = sum(s["score"] for s in submissions) / len(submissions) if submissions else 0
            
            # Calculate total points
            total_points = solved_problems * 10 + completed_courses * 100  # Basic calculation
            
            # Calculate level
            level = self._calculate_level(total_points)
            
            # Get streak info
            current_streak = await self._calculate_current_streak(user_id)
            longest_streak = current_streak  # Simplified
            
            # Get unlocked achievements count
            unlocked_count = await self.user_achievements_collection.count_documents({"user_id": user_id})
            
            stats = {
                "user_id": user_id,
                "total_points": total_points,
                "current_level": level,
                "next_level_points": level * 100,
                "level_progress": self._calculate_level_progress(total_points),
                "total_achievements": await self.achievements_collection.count_documents({}),
                "unlocked_achievements": unlocked_count,
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "total_study_time": 0,  # Would need time tracking
                "problems_solved": solved_problems,
                "courses_completed": completed_courses,
                "average_score": average_score,
                "rank": await self._calculate_user_rank(user_id),
                "badges": [],  # Would need badge system
                "last_study_date": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await self.user_stats_collection.insert_one(stats)
            return stats
        except Exception as e:
            logger.error(f"Error creating initial stats: {e}")
            return {}

    async def _update_user_stats(self, user_id: str, stats: Dict[str, Any]) -> Dict[str, Any]:
        """Update user statistics"""
        try:
            # Recalculate stats
            solved_problems = await self.db.submissions.count_documents({
                "user_id": user_id,
                "overall_status": "accepted"
            })
            
            completed_courses = await self.db.enrollments.count_documents({
                "user_id": user_id,
                "status": "completed"
            })
            
            submissions = await self.db.submissions.find({
                "user_id": user_id,
                "overall_status": "accepted",
                "score": {"$exists": True}
            }).to_list(None)
            
            average_score = sum(s["score"] for s in submissions) / len(submissions) if submissions else 0
            
            # Get points from history
            points_history = await self.points_history_collection.find({"user_id": user_id}).to_list(None)
            total_points = sum(ph["points"] for ph in points_history)
            
            # Calculate level
            level = self._calculate_level(total_points)
            
            # Get streak info
            current_streak = await self._calculate_current_streak(user_id)
            
            # Get unlocked achievements count
            unlocked_count = await self.user_achievements_collection.count_documents({"user_id": user_id})
            
            updated_stats = {
                **stats,
                "total_points": total_points,
                "current_level": level,
                "next_level_points": level * 100,
                "level_progress": self._calculate_level_progress(total_points),
                "unlocked_achievements": unlocked_count,
                "current_streak": current_streak,
                "problems_solved": solved_problems,
                "courses_completed": completed_courses,
                "average_score": average_score,
                "rank": await self._calculate_user_rank(user_id),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await self.user_stats_collection.update_one(
                {"user_id": user_id},
                {"$set": updated_stats}
            )
            
            return updated_stats
        except Exception as e:
            logger.error(f"Error updating user stats: {e}")
            return stats

    def _calculate_level(self, points: int) -> int:
        """Calculate user level based on points"""
        return (points // 100) + 1

    def _calculate_level_progress(self, points: int) -> float:
        """Calculate level progress percentage"""
        level = self._calculate_level(points)
        base_points = (level - 1) * 100
        next_level_points = level * 100
        return ((points - base_points) / (next_level_points - base_points)) * 100 if next_level_points > base_points else 0

    async def _calculate_current_streak(self, user_id: str) -> int:
        """Calculate current study streak"""
        try:
            # Simplified streak calculation
            # In a real implementation, this would check daily activity
            submissions = await self.db.submissions.find({
                "user_id": user_id,
                "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=30)}
            }).sort("created_at", -1).to_list(None)
            
            if not submissions:
                return 0
            
            # Group submissions by date
            dates = set()
            for sub in submissions:
                dates.add(sub["created_at"].date())
            
            # Calculate consecutive days
            streak = 0
            current_date = datetime.now(timezone.utc).date()
            
            for i in range(30):  # Check last 30 days
                check_date = current_date - timedelta(days=i)
                if check_date in dates:
                    streak += 1
                else:
                    break
            
            return streak
        except Exception as e:
            logger.error(f"Error calculating streak: {e}")
            return 0

    async def _calculate_user_rank(self, user_id: str) -> int:
        """Calculate user's rank on leaderboard"""
        try:
            user_stats = await self.user_stats_collection.find_one({"user_id": user_id})
            if not user_stats:
                return 0
            
            # Count users with more points
            rank = await self.user_stats_collection.count_documents({
                "points": {"$gt": user_stats["total_points"]}
            }) + 1
            
            return rank
        except Exception as e:
            logger.error(f"Error calculating user rank: {e}")
            return 0

    async def _add_points(self, user_id: str, points: int, reason: str):
        """Add points to user"""
        try:
            # Add to points history
            await self.points_history_collection.insert_one({
                "user_id": user_id,
                "points": points,
                "reason": reason,
                "created_at": datetime.now(timezone.utc)
            })
            
            # Update user stats
            await self._update_user_stats(user_id, await self.get_user_stats(user_id) or {})
            
            logger.info(f"Added {points} points to user {user_id} for {reason}")
        except Exception as e:
            logger.error(f"Error adding points: {e}")

    async def get_leaderboard(self, limit: int = 100, type: str = "overall") -> List[Dict[str, Any]]:
        """Get leaderboard data"""
        try:
            if type == "overall":
                # Sort by total points
                pipeline = [
                    {"$sort": {"total_points": -1}},
                    {"$limit": limit}
                ]
            elif type == "streak":
                # Sort by current streak
                pipeline = [
                    {"$sort": {"current_streak": -1}},
                    {"$limit": limit}
                ]
            elif type == "courses":
                # Sort by courses completed
                pipeline = [
                    {"$sort": {"courses_completed": -1}},
                    {"$limit": limit}
                ]
            elif type == "problems":
                # Sort by problems solved
                pipeline = [
                    {"$sort": {"problems_solved": -1}},
                    {"$limit": limit}
                ]
            else:
                pipeline = [{"$sort": {"total_points": -1}}, {"$limit": limit}]
            
            leaderboard = await self.user_stats_collection.aggregate(pipeline).to_list(None)
            
            # Add user information
            for i, entry in enumerate(leaderboard):
                user = await self.db.users.find_one({"_id": ObjectId(entry["user_id"])})
                if user:
                    entry.update({
                        "rank": i + 1,
                        "name": user.get("name", "Unknown"),
                        "email": user.get("email", ""),
                        "avatar_url": user.get("avatar_url"),
                        "role_track": user.get("role_track", "general")
                    })
            
            return leaderboard
        except Exception as e:
            logger.error(f"Error getting leaderboard: {e}")
            return []

    async def _create_gamification_event(self, user_id: str, event_type: str, title: str, points: int, icon: str, data: Dict[str, Any]):
        """Create a gamification event"""
        try:
            await self.gamification_events_collection.insert_one({
                "user_id": user_id,
                "type": event_type,
                "title": title,
                "description": f"You earned {points} points!",
                "points": points,
                "icon": icon,
                "data": data,
                "read": False,
                "created_at": datetime.now(timezone.utc)
            })
        except Exception as e:
            logger.error(f"Error creating gamification event: {e}")

    async def get_user_events(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's gamification events"""
        try:
            events = await self.gamification_events_collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(limit).to_list(None)
            
            return events
        except Exception as e:
            logger.error(f"Error getting user events: {e}")
            return []

    async def mark_event_read(self, user_id: str, event_id: str) -> bool:
        """Mark an event as read"""
        try:
            result = await self.gamification_events_collection.update_one(
                {"user_id": user_id, "_id": ObjectId(event_id)},
                {"$set": {"read": True}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking event as read: {e}")
            return False

    async def get_leaderboard_stats(self) -> Dict[str, Any]:
        """Get leaderboard statistics"""
        try:
            total_users = await self.user_stats_collection.count_documents()
            total_points = await self.user_stats_collection.aggregate([
                {"$group": {"_id": None, "total": {"$sum": "$total_points"}}}
            ]).to_list(None)
            
            return {
                "total_users": total_users,
                "total_points": total_points[0]["total"] if total_points else 0,
                "average_points": (total_points[0]["total"] / total_users) if total_users > 0 else 0,
                "top_score": await self.user_stats_collection.find_one({}, sort=[("total_points", -1)]),
                "updated_at": datetime.now(timezone.utc)
            }
        except Exception as e:
            logger.error(f"Error getting leaderboard stats: {e}")
            return {}

# Global instance
gamification_service = None

async def get_gamification_service(db: AsyncIOMotorDatabase) -> GamificationService:
    """Get or create gamification service instance"""
    global gamification_service
    
    if gamification_service is None:
        gamification_service = GamificationService(db)
        await gamification_service.initialize_service()
    
    return gamification_service

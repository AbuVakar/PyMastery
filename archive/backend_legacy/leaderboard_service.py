from typing import List, Optional
from datetime import datetime, timedelta
from leaderboard_models import UserPoints, LeaderboardEntry, LeaderboardData, PointTransaction, PointAction
import math

class LeaderboardService:
    def __init__(self, user_points_collection, point_transactions_collection):
        self.user_points_collection = user_points_collection
        self.point_transactions_collection = point_transactions_collection

    async def get_or_create_user_points(self, user_id: str, user_name: str) -> UserPoints:
        """Get or create user points document"""
        user_points = await self.user_points_collection.find_one({"user_id": user_id})

        if not user_points:
            user_points = UserPoints(
                user_id=user_id,
                user_name=user_name,
                total_points=0,
                weekly_points=0,
                last_updated=datetime.utcnow(),
                points_history=[],
                courses_completed=[],
                last_login_date=None,
                login_streak=0
            )
            await self.user_points_collection.insert_one(user_points.dict())
            return user_points

        return UserPoints(**user_points)

    async def award_points(self, user_id: str, user_name: str, action: PointAction, points: int, description: str, metadata: dict = {}) -> bool:
        """Award points to a user for an action"""
        try:
            # Get or create user points
            user_points = await self.get_or_create_user_points(user_id, user_name)

            # Calculate weekly points (reset if week changed)
            current_week = self._get_current_week()
            last_week = self._get_week_of_date(user_points.last_updated)

            weekly_points = user_points.weekly_points
            if current_week != last_week:
                weekly_points = 0

            # Update user points
            total_points = user_points.total_points + points
            weekly_points = weekly_points + points

            # Add to history
            history_entry = {
                "action": action.value,
                "points": points,
                "timestamp": datetime.utcnow(),
                "description": description
            }

            await self.user_points_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "total_points": total_points,
                        "weekly_points": weekly_points,
                        "last_updated": datetime.utcnow()
                    },
                    "$push": {"points_history": history_entry}
                }
            )

            # Record transaction
            transaction = PointTransaction(
                id=f"{user_id}_{datetime.utcnow().isoformat()}",
                user_id=user_id,
                action=action,
                points=points,
                description=description,
                timestamp=datetime.utcnow(),
                metadata=metadata
            )

            await self.point_transactions_collection.insert_one(transaction.dict())

            return True
        except Exception as e:
            print(f"Error awarding points: {e}")
            return False

    async def award_daily_login_points(self, user_id: str, user_name: str) -> dict:
        """Award daily login points and update streak"""
        try:
            user_points = await self.get_or_create_user_points(user_id, user_name)
            today = datetime.utcnow().date()
            last_login = user_points.last_login_date.date() if user_points.last_login_date else None

            # Check if already logged in today
            if last_login == today:
                return {
                    "success": False,
                    "message": "Already received daily login points today",
                    "points_awarded": 0,
                    "streak": user_points.login_streak
                }

            # Calculate streak
            yesterday = today - timedelta(days=1)
            if last_login == yesterday:
                streak = user_points.login_streak + 1
            else:
                streak = 1  # Reset streak

            # Award points (5 points for daily login)
            success = await self.award_points(
                user_id, user_name, PointAction.DAILY_LOGIN, 5,
                f"Daily login - Streak: {streak} days"
            )

            if success:
                # Update login streak and last login date
                await self.user_points_collection.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            "last_login_date": datetime.utcnow(),
                            "login_streak": streak
                        }
                    }
                )

                return {
                    "success": True,
                    "message": f"Daily login points awarded! Streak: {streak} days",
                    "points_awarded": 5,
                    "streak": streak
                }

            return {"success": False, "message": "Failed to award points"}
        except Exception as e:
            print(f"Error awarding daily login points: {e}")
            return {"success": False, "message": "Server error"}

    async def complete_course(self, user_id: str, user_name: str, course_id: str, course_name: str) -> dict:
        """Mark course as completed and award points"""
        try:
            user_points = await self.get_or_create_user_points(user_id, user_name)

            # Check if course already completed
            if course_id in user_points.courses_completed:
                return {
                    "success": False,
                    "message": "Course already completed",
                    "points_awarded": 0
                }

            # Award points (50 points for course completion)
            success = await self.award_points(
                user_id, user_name, PointAction.COURSE_COMPLETED, 50,
                f"Completed course: {course_name}"
            )

            if success:
                # Add to completed courses
                await self.user_points_collection.update_one(
                    {"user_id": user_id},
                    {"$push": {"courses_completed": course_id}}
                )

                return {
                    "success": True,
                    "message": f"Course completed! +50 points",
                    "points_awarded": 50,
                    "course_name": course_name
                }

            return {"success": False, "message": "Failed to award points"}
        except Exception as e:
            print(f"Error completing course: {e}")
            return {"success": False, "message": "Server error"}

    async def get_all_time_leaderboard(self, limit: int = 10) -> LeaderboardData:
        """Get all-time leaderboard"""
        pipeline = [
            {"$sort": {"total_points": -1}},
            {"$limit": limit},
            {"$project": {"_id": 0}}
        ]

        users = await self.user_points_collection.aggregate(pipeline).to_list(None)

        entries = []
        for i, user in enumerate(users, 1):
            entries.append(LeaderboardEntry(
                rank=i,
                user_id=user["user_id"],
                user_name=user["user_name"],
                points=user["total_points"]
            ))

        return LeaderboardData(
            period="alltime",
            entries=entries
        )

    async def get_weekly_leaderboard(self, limit: int = 10) -> LeaderboardData:
        """Get weekly leaderboard"""
        current_week = self._get_current_week()
        week_start = self._get_week_start(current_week)

        pipeline = [
            {"$match": {"weekly_points": {"$gt": 0}}},
            {"$sort": {"weekly_points": -1}},
            {"$limit": limit},
            {"$project": {"_id": 0}}
        ]

        users = await self.user_points_collection.aggregate(pipeline).to_list(None)

        entries = []
        for i, user in enumerate(users, 1):
            entries.append(LeaderboardEntry(
                rank=i,
                user_id=user["user_id"],
                user_name=user["user_name"],
                points=user["weekly_points"]
            ))

        return LeaderboardData(
            period="weekly",
            start_date=week_start,
            end_date=week_start + timedelta(days=7),
            entries=entries
        )

    async def get_user_rank(self, user_id: str) -> dict:
        """Get user's rank and points"""
        # All-time rank
        all_time_count = await self.user_points_collection.count_documents({
            "total_points": {"$gt": await self._get_user_total_points(user_id)}
        })
        all_time_rank = all_time_count + 1

        # Weekly rank
        weekly_count = await self.user_points_collection.count_documents({
            "weekly_points": {"$gt": await self._get_user_weekly_points(user_id)}
        })
        weekly_rank = weekly_count + 1

        user_points = await self.user_points_collection.find_one({"user_id": user_id})

        return {
            "user_id": user_id,
            "all_time_rank": all_time_rank,
            "weekly_rank": weekly_rank,
            "total_points": user_points.get("total_points", 0) if user_points else 0,
            "weekly_points": user_points.get("weekly_points", 0) if user_points else 0
        }

    async def _get_user_total_points(self, user_id: str) -> int:
        """Get user's total points"""
        user = await self.user_points_collection.find_one({"user_id": user_id})
        return user.get("total_points", 0) if user else 0

    async def _get_user_weekly_points(self, user_id: str) -> int:
        """Get user's weekly points"""
        user = await self.user_points_collection.find_one({"user_id": user_id})
        return user.get("weekly_points", 0) if user else 0

    def _get_current_week(self) -> int:
        """Get current week number"""
        now = datetime.utcnow()
        return math.floor((now - datetime(2020, 1, 1)).days / 7)

    def _get_week_of_date(self, date: datetime) -> int:
        """Get week number for a date"""
        return math.floor((date - datetime(2020, 1, 1)).days / 7)

    def _get_week_start(self, week_num: int) -> datetime:
        """Get start date of a week"""
        base_date = datetime(2020, 1, 1)
        return base_date + timedelta(days=week_num * 7)

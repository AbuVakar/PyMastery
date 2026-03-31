from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from enum import Enum

class PointAction(str, Enum):
    PROBLEM_SOLVED = "problem_solved"  # 10 points
    COURSE_COMPLETED = "course_completed"  # 50 points
    DAILY_LOGIN = "daily_login"  # 5 points
    PROBLEM_HINT_USED = "problem_hint_used"  # -10 points
    CODE_EXECUTED = "code_executed"  # 10 points
    CODE_SHARED = "code_shared"  # 25 points
    REVIEW_SUBMITTED = "review_submitted"  # 30 points
    REVIEW_RECEIVED = "review_received"  # 5 points per review
    LOGIN_STREAK = "login_streak"  # 5 points per day
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"  # Variable points

class UserPoints(BaseModel):
    user_id: str
    user_name: str
    total_points: int = 0
    weekly_points: int = 0  # Points earned this week
    last_updated: datetime
    points_history: List[dict] = []  # [{action: str, points: int, timestamp: datetime, description: str}]
    courses_completed: List[str] = []  # List of completed course IDs
    last_login_date: Optional[datetime] = None
    login_streak: int = 0  # Consecutive days logged in

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    user_name: str
    points: int
    change: int = 0  # Change from last week (for weekly leaderboard)

class LeaderboardData(BaseModel):
    period: str  # "weekly" or "alltime"
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    entries: List[LeaderboardEntry]

class PointTransaction(BaseModel):
    id: str
    user_id: str
    action: PointAction
    points: int
    description: str
    timestamp: datetime
    metadata: dict = {}  # Additional data like problem_id, review_id, etc.

class Achievement(BaseModel):
    id: str
    name: str
    description: str
    points_reward: int
    icon: str
    requirements: dict  # Conditions to unlock
    rarity: str = "common"  # common, rare, epic, legendary

class UserAchievement(BaseModel):
    achievement_id: str
    user_id: str
    unlocked_at: datetime
    progress: dict = {}  # Track progress towards achievement

from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from enum import Enum

class CompetitionStatus(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    ENDED = "ended"
    CANCELLED = "cancelled"

class CompetitionDifficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class Competition(BaseModel):
    id: str
    title: str
    description: str
    difficulty: CompetitionDifficulty
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    problems: List[str]  # List of problem IDs
    max_participants: Optional[int] = None
    status: CompetitionStatus = CompetitionStatus.UPCOMING
    created_by: str  # User ID
    created_at: datetime
    rules: str
    prizes: Optional[dict] = None  # e.g., {"1st": "Gold Badge", "2nd": "Silver Badge"}

class CompetitionSubmission(BaseModel):
    id: str
    competition_id: str
    user_id: str
    user_name: str
    problem_id: int
    code: str
    language: str
    submitted_at: datetime
    score: int = 0
    execution_time: Optional[float] = None
    memory_used: Optional[int] = None
    passed_tests: int = 0
    total_tests: int = 0
    status: str = "pending"  # pending, accepted, wrong_answer, time_limit_exceeded, etc.

class CompetitionParticipant(BaseModel):
    user_id: str
    user_name: str
    joined_at: datetime
    total_score: int = 0
    problems_solved: int = 0
    rank: Optional[int] = None

class CompetitionResult(BaseModel):
    competition_id: str
    participant: CompetitionParticipant
    submissions: List[CompetitionSubmission]
    final_score: int
    rank: int
    completed_at: Optional[datetime] = None

class CompetitionLeaderboard(BaseModel):
    competition_id: str
    participants: List[CompetitionParticipant]
    last_updated: datetime

class CompetitionCreate(BaseModel):
    title: str
    description: str
    difficulty: CompetitionDifficulty
    start_time: datetime
    duration_minutes: int
    problems: List[str]
    max_participants: Optional[int] = None
    rules: str
    prizes: Optional[dict] = None

"""
Models package initialization
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

# Mock models for now
class UserCreate(BaseModel):
    email: str
    name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role_track: Optional[str] = None
    progress: Dict[str, Any] = {}

class Progress(BaseModel):
    user_id: str
    skill_level: float
    completed_lessons: int
    total_lessons: int
    last_updated: datetime

class CodeSubmission(BaseModel):
    user_id: str
    code: str
    language: str
    submitted_at: datetime
    status: str

class AnalyticsEvent(BaseModel):
    user_id: str
    event_type: str
    timestamp: datetime
    data: Dict[str, Any]

class LearningSession(BaseModel):
    id: str
    user_id: str
    topic: str
    messages: List[Dict[str, Any]]
    start_time: datetime
    end_time: Optional[datetime]
    progress_made: float

class UserProgress(BaseModel):
    user_id: str
    skill_level: float
    completed_lessons: int
    total_lessons: int
    last_activity: datetime

__all__ = [
    'UserCreate',
    'UserLogin',
    'UserResponse',
    'Progress',
    'CodeSubmission',
    'AnalyticsEvent',
    'LearningSession',
    'UserProgress'
]

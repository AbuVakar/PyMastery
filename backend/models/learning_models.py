"""
Learning models for AI-powered features
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class MessageType(str, Enum):
    GREETING = "greeting"
    QUESTION = "question"
    CODE_HELP = "code_help"
    EXPLANATION = "explanation"
    ENCOURAGEMENT = "encouragement"
    FRUSTRATION_DETECTION = "frustration_detection"

class EmotionalState(str, Enum):
    HAPPY = "happy"
    FRUSTRATED = "frustrated"
    CONFUSED = "confused"
    ENGAGED = "engaged"
    NEUTRAL = "neutral"

class LearningSession(BaseModel):
    id: str
    user_id: str
    topic: str
    messages: List[Dict[str, Any]]
    emotional_state: EmotionalState
    start_time: datetime
    end_time: Optional[datetime]
    learning_objectives: List[str]
    progress_made: float
    created_at: datetime
    updated_at: datetime

class UserProgress(BaseModel):
    user_id: str
    skill_level: float
    completed_lessons: int
    total_lessons: int
    skill_points: int
    current_streak: int
    last_activity: datetime
    recent_topics: List[str]
    learning_style: Dict[str, float]
    strengths: List[str]
    weaknesses: List[str]
    created_at: datetime
    updated_at: datetime

class AIResponse(BaseModel):
    message: str
    emotional_state: EmotionalState
    confidence: float
    suggestions: List[str]
    follow_up_questions: List[str]
    learning_resources: List[Dict[str, str]]
    created_at: datetime

class CodeAnalysis(BaseModel):
    code: str
    language: str
    quality_score: float
    complexity_score: float
    issues: List[str]
    suggestions: List[str]
    best_practices: List[str]
    improvements: List[str]
    created_at: datetime

class LearningRecommendation(BaseModel):
    user_id: str
    recommended_topics: List[str]
    difficulty_level: str
    learning_path: List[str]
    estimated_time: int
    prerequisites: List[str]
    learning_objectives: List[str]
    created_at: datetime

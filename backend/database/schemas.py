"""
MongoDB Schema Definitions and Models
Defines all collections, their schemas, and validation rules
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, field_validator
from bson import ObjectId


def utc_now() -> datetime:
    """Return current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)

# Base Models
class MongoBaseModel(BaseModel):
    """Base model for MongoDB documents"""
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True

# User Management
class UserRole(str, Enum):
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"
    MODERATOR = "moderator"

class RoleTrack(str, Enum):
    BACKEND = "backend"
    DATA = "data"
    ML = "ml"
    AUTOMATION = "automation"
    FULLSTACK = "fullstack"
    DEVOPS = "devops"
    MOBILE = "mobile"
    GENERAL = "general"

class User(MongoBaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., unique=True)
    password_hash: str = Field(..., min_length=60)
    role: UserRole = Field(default=UserRole.STUDENT)
    role_track: RoleTrack = Field(default=RoleTrack.GENERAL)
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    login_streak: int = Field(default=0, ge=0)
    last_login: Optional[datetime] = None
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    points: int = Field(default=0, ge=0)
    level: int = Field(default=1, ge=1)
    badges: List[str] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    progress: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, value: str):
        if "@" not in value:
            raise ValueError('Invalid email format')
        return value

# Course Management
class Difficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class CourseStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DEPRECATED = "deprecated"

class Course(MongoBaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    instructor_id: str = Field(...)
    instructor_name: str = Field(...)
    difficulty: Difficulty = Field(default=Difficulty.BEGINNER)
    status: CourseStatus = Field(default=CourseStatus.DRAFT)
    duration_weeks: int = Field(..., ge=1, le=52)
    tags: List[str] = Field(default_factory=list)
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    price: float = Field(default=0.0, ge=0)
    currency: str = Field(default="USD")
    rating: float = Field(default=0.0, ge=0, le=5)
    review_count: int = Field(default=0, ge=0)
    enrollment_count: int = Field(default=0, ge=0)
    completion_count: int = Field(default=0, ge=0)
    prerequisites: List[str] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)
    syllabus: List[Dict[str, Any]] = Field(default_factory=list)
    resources: List[Dict[str, Any]] = Field(default_factory=list)

class Enrollment(MongoBaseModel):
    user_id: str = Field(...)
    course_id: str = Field(...)
    status: str = Field(default="enrolled")  # enrolled, in_progress, completed, dropped
    progress: float = Field(default=0.0, ge=0, le=100)
    completion_date: Optional[datetime] = None
    last_accessed: Optional[datetime] = None
    time_spent_minutes: int = Field(default=0, ge=0)
    quiz_scores: List[float] = Field(default_factory=list)
    assignment_scores: List[float] = Field(default_factory=list)
    notes: Optional[str] = Field(None, max_length=1000)
    bookmarks: List[str] = Field(default_factory=list)

# Problem Management
class Problem(MongoBaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    difficulty: Difficulty = Field(default=Difficulty.BEGINNER)
    category: str = Field(..., max_length=50)
    tags: List[str] = Field(default_factory=list)
    time_limit_minutes: int = Field(default=30, ge=1, le=180)
    memory_limit_mb: int = Field(default=128, ge=16, le=1024)
    test_cases: List[Dict[str, Any]] = Field(...)
    starter_code: Dict[str, str] = Field(default_factory=dict)
    solution_code: Dict[str, str] = Field(default_factory=dict)
    hints: List[str] = Field(default_factory=list)
    explanation: Optional[str] = Field(None, max_length=2000)
    points: int = Field(default=10, ge=1)
    submission_count: int = Field(default=0, ge=0)
    success_rate: float = Field(default=0.0, ge=0, le=100)
    author_id: str = Field(...)
    is_published: bool = Field(default=False)

class Submission(MongoBaseModel):
    user_id: str = Field(...)
    problem_id: str = Field(...)
    code: str = Field(..., min_length=1)
    language: str = Field(..., max_length=20)
    status: str = Field(default="pending")  # pending, running, success, error, timeout
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_output: Optional[str] = None
    time_used: Optional[float] = None
    memory_used: Optional[int] = None
    exit_code: Optional[int] = None
    overall_status: str = Field(default="pending")  # passed, failed, error
    test_results: List[Dict[str, Any]] = Field(default_factory=list)
    score: float = Field(default=0.0, ge=0)
    feedback: Optional[str] = None

# User Activity Tracking
class ActivityType(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    COURSE_START = "course_start"
    COURSE_COMPLETE = "course_complete"
    PROBLEM_ATTEMPT = "problem_attempt"
    PROBLEM_SOLVE = "problem_solve"
    CODE_SUBMIT = "code_submit"
    ACHIEVEMENT_UNLOCK = "achievement_unlock"
    STREAK_UPDATE = "streak_update"

class UserActivity(MongoBaseModel):
    user_id: str = Field(...)
    action: ActivityType = Field(...)
    target_id: Optional[str] = None
    target_type: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=utc_now)

# Code Execution Tracking
class CodeSubmission(MongoBaseModel):
    user_id: str = Field(...)
    source_code: str = Field(..., min_length=1)
    language: str = Field(..., max_length=20)
    stdin: Optional[str] = None
    expected_output: Optional[str] = None
    status: str = Field(default="pending")
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_output: Optional[str] = None
    time: Optional[str] = None
    memory: Optional[str] = None
    exit_code: Optional[int] = None
    execution_time: datetime = Field(default_factory=utc_now)
    problem_id: Optional[str] = None

class TestRun(MongoBaseModel):
    user_id: str = Field(...)
    source_code: str = Field(..., min_length=1)
    language: str = Field(..., max_length=20)
    test_cases: List[Dict[str, str]] = Field(...)
    test_results: List[Dict[str, Any]] = Field(...)
    total_passed: int = Field(default=0, ge=0)
    total_failed: int = Field(default=0, ge=0)
    overall_status: str = Field(default="pending")
    execution_time: datetime = Field(default_factory=utc_now)

class CodeExecutionLog(MongoBaseModel):
    user_id: str = Field(...)
    language: str = Field(..., max_length=20)
    status: str = Field(...)
    code_length: int = Field(..., ge=0)
    timestamp: datetime = Field(default_factory=utc_now)

# KPI and Analytics
class KPIData(MongoBaseModel):
    kpi_id: str = Field(...)
    value: float = Field(...)
    period_start: datetime
    period_end: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)

class KPIAlert(MongoBaseModel):
    kpi_id: str = Field(...)
    threshold_value: float = Field(...)
    current_value: float = Field(...)
    severity: str = Field(...)  # low, medium, high, critical
    message: str = Field(...)
    triggered_at: datetime = Field(default_factory=utc_now)
    acknowledged: bool = Field(default=False)
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None

# User Sessions
class UserSession(MongoBaseModel):
    user_id: str = Field(...)
    session_id: str = Field(...)
    start_time: datetime = Field(default_factory=utc_now)
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    activities: List[str] = Field(default_factory=list)
    page_views: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)

# Wellness and Health
class WellnessMetric(MongoBaseModel):
    user_id: str = Field(...)
    stress_level: float = Field(..., ge=0, le=10)
    burnout_risk: str = Field(...)  # low, medium, high, critical
    screen_time_minutes: int = Field(default=0, ge=0)
    break_count: int = Field(default=0, ge=0)
    productivity_score: float = Field(..., ge=0, le=100)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    exercise_minutes: int = Field(default=0, ge=0)
    mood_rating: Optional[int] = Field(None, ge=1, le=5)
    recommendations: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=utc_now)

class SkillAssessment(MongoBaseModel):
    user_id: str = Field(...)
    skill_name: str = Field(...)
    skill_level: float = Field(..., ge=0, le=100)
    confidence_level: float = Field(..., ge=0, le=100)
    assessment_type: str = Field(...)  # self_assessment, peer_review, automated
    feedback: Optional[str] = None
    improvement_suggestions: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=utc_now)

# Course Progress
class CourseProgress(MongoBaseModel):
    user_id: str = Field(...)
    course_id: str = Field(...)
    status: str = Field(default="not_started")  # not_started, in_progress, completed
    completion_percentage: float = Field(default=0.0, ge=0, le=100)
    modules_completed: List[str] = Field(default_factory=list)
    quizzes_passed: List[str] = Field(default_factory=list)
    assignments_completed: List[str] = Field(default_factory=list)
    time_spent_minutes: int = Field(default=0, ge=0)
    last_activity: Optional[datetime] = None
    estimated_completion_date: Optional[datetime] = None
    grade: Optional[float] = Field(None, ge=0, le=100)

# User Surveys and Feedback
class UserSurvey(MongoBaseModel):
    user_id: str = Field(...)
    survey_type: str = Field(...)  # course_feedback, platform_feedback, wellness_check
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = Field(None, max_length=2000)
    responses: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=utc_now)

# Collaboration Features
class CollaborationSession(MongoBaseModel):
    user_id: str = Field(...)
    session_id: str = Field(...)
    session_type: str = Field(...)  # pair_programming, code_review, study_group
    participants: List[str] = Field(default_factory=list)
    start_time: datetime = Field(default_factory=utc_now)
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    code_shared: Optional[str] = None
    chat_messages: List[Dict[str, Any]] = Field(default_factory=list)
    feedback: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)

class TeamSession(MongoBaseModel):
    participants: List[str] = Field(...)
    team_name: str = Field(...)
    project_name: str = Field(...)
    start_time: datetime = Field(default_factory=utc_now)
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    tasks_completed: int = Field(default=0, ge=0)
    code_commits: int = Field(default=0, ge=0)
    meeting_minutes: int = Field(default=0, ge=0)
    productivity_score: float = Field(..., ge=0, le=100)
    feedback: Optional[str] = None

# System Logs and Monitoring
class SystemLog(MongoBaseModel):
    level: str = Field(...)  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    message: str = Field(...)
    module: str = Field(...)
    function: Optional[str] = None
    line_number: Optional[int] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None
    duration_ms: Optional[int] = None
    status_code: Optional[int] = None
    error_details: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=utc_now)

# Collection Validation Rules
VALIDATION_RULES = {
    "users": {
        "validator": {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["name", "email", "password_hash", "role", "role_track"],
                "properties": {
                    "name": {
                        "bsonType": "string",
                        "minLength": 2,
                        "maxLength": 100,
                        "description": "User's full name"
                    },
                    "email": {
                        "bsonType": "string",
                        "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                        "description": "Valid email address"
                    },
                    "role": {
                        "enum": ["student", "instructor", "admin", "moderator"],
                        "description": "User role"
                    },
                    "role_track": {
                        "enum": ["backend", "data", "ml", "automation", "fullstack", "devops", "mobile", "general"],
                        "description": "User's learning track"
                    },
                    "points": {
                        "bsonType": "int",
                        "minimum": 0,
                        "description": "User's points"
                    },
                    "level": {
                        "bsonType": "int",
                        "minimum": 1,
                        "description": "User's level"
                    }
                }
            }
        }
    },
    "courses": {
        "validator": {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["title", "description", "instructor_id", "instructor_name", "duration_weeks"],
                "properties": {
                    "title": {
                        "bsonType": "string",
                        "minLength": 3,
                        "maxLength": 200,
                        "description": "Course title"
                    },
                    "description": {
                        "bsonType": "string",
                        "minLength": 10,
                        "maxLength": 2000,
                        "description": "Course description"
                    },
                    "difficulty": {
                        "enum": ["beginner", "intermediate", "advanced", "expert"],
                        "description": "Course difficulty"
                    },
                    "rating": {
                        "bsonType": "double",
                        "minimum": 0,
                        "maximum": 5,
                        "description": "Course rating"
                    }
                }
            }
        }
    },
    "problems": {
        "validator": {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["title", "description", "difficulty", "category", "test_cases"],
                "properties": {
                    "title": {
                        "bsonType": "string",
                        "minLength": 3,
                        "maxLength": 200,
                        "description": "Problem title"
                    },
                    "difficulty": {
                        "enum": ["beginner", "intermediate", "advanced", "expert"],
                        "description": "Problem difficulty"
                    },
                    "points": {
                        "bsonType": "int",
                        "minimum": 1,
                        "description": "Problem points"
                    }
                }
            }
        }
    }
}

# Collection Indexes (defined in mongodb.py)
COLLECTION_INDEXES = {
    "users": [
        {"email": 1},
        {"created_at": 1},
        {"role_track": 1},
        {"login_streak": 1}
    ],
    "courses": [
        {"title": 1},
        {"status": 1},
        {"created_at": 1},
        {"difficulty": 1}
    ],
    "enrollments": [
        {"user_id": 1, "course_id": 1},
        {"user_id": 1},
        {"course_id": 1},
        {"status": 1},
        {"created_at": 1}
    ],
    "problems": [
        {"title": 1},
        {"difficulty": 1},
        {"tags": 1},
        {"created_at": 1}
    ],
    "submissions": [
        {"user_id": 1},
        {"problem_id": 1},
        {"created_at": 1},
        {"overall_status": 1}
    ],
    "user_activities": [
        {"user_id": 1},
        {"timestamp": 1},
        {"action": 1}
    ],
    "code_submissions": [
        {"user_id": 1},
        {"created_at": 1},
        {"language": 1},
        {"status": 1}
    ],
    "test_runs": [
        {"user_id": 1},
        {"created_at": 1},
        {"overall_status": 1}
    ],
    "code_execution_logs": [
        {"user_id": 1},
        {"timestamp": 1},
        {"language": 1}
    ],
    "kpi_data": [
        {"kpi_id": 1},
        {"timestamp": 1},
        {"period_start": 1},
        {"period_end": 1}
    ],
    "kpi_alerts": [
        {"kpi_id": 1},
        {"triggered_at": 1},
        {"acknowledged": 1}
    ],
    "user_sessions": [
        {"user_id": 1},
        {"timestamp": 1},
        {"duration_minutes": 1}
    ],
    "wellness_metrics": [
        {"user_id": 1},
        {"timestamp": 1},
        {"burnout_risk": 1}
    ],
    "skill_assessments": [
        {"user_id": 1},
        {"timestamp": 1},
        {"skill_level": 1}
    ],
    "course_progress": [
        {"user_id": 1},
        {"course_id": 1},
        {"status": 1},
        {"timestamp": 1}
    ],
    "user_surveys": [
        {"user_id": 1},
        {"timestamp": 1},
        {"rating": 1}
    ],
    "collaboration_sessions": [
        {"user_id": 1},
        {"timestamp": 1},
        {"participants": 1}
    ],
    "team_sessions": [
        {"participants": 1},
        {"timestamp": 1}
    ],
    "system_logs": [
        {"timestamp": 1},
        {"status": 1},
        {"duration": 1}
    ]
}

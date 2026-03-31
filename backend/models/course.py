"""
Course models for PyMastery
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class Difficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class CourseStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class Course(BaseModel):
    """Course model"""
    id: Optional[str] = None
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)
    difficulty: Difficulty = Difficulty.BEGINNER
    category: str = Field(..., max_length=50)
    duration_weeks: int = Field(..., ge=1, le=52)
    price: float = Field(default=0.0, ge=0)
    thumbnail: Optional[str] = None
    status: CourseStatus = CourseStatus.DRAFT
    
    # Content
    lessons: List[str] = Field(default_factory=list)
    assignments: List[str] = Field(default_factory=list)
    quizzes: List[str] = Field(default_factory=list)
    
    # Statistics
    enrollment_count: int = Field(default=0, ge=0)
    completion_count: int = Field(default=0, ge=0)
    rating: float = Field(default=0.0, ge=0, le=5)
    rating_count: int = Field(default=0, ge=0)
    
    # Instructor info
    instructor_id: Optional[str] = None
    instructor_name: Optional[str] = None
    
    # Metadata
    tags: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class CourseCreate(BaseModel):
    """Course creation model"""
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)
    difficulty: Difficulty = Difficulty.BEGINNER
    category: str = Field(..., max_length=50)
    duration_weeks: int = Field(..., ge=1, le=52)
    price: float = Field(default=0.0, ge=0)
    thumbnail: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)

class CourseUpdate(BaseModel):
    """Course update model"""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    difficulty: Optional[Difficulty] = None
    category: Optional[str] = Field(None, max_length=50)
    duration_weeks: Optional[int] = Field(None, ge=1, le=52)
    price: Optional[float] = Field(None, ge=0)
    thumbnail: Optional[str] = None
    status: Optional[CourseStatus] = None
    tags: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None

class CourseResponse(BaseModel):
    """Course response model"""
    id: str
    title: str
    description: str
    difficulty: Difficulty
    category: str
    duration_weeks: int
    price: float
    thumbnail: Optional[str]
    status: CourseStatus
    enrollment_count: int
    completion_count: int
    rating: float
    rating_count: int
    instructor_id: Optional[str]
    instructor_name: Optional[str]
    tags: List[str]
    prerequisites: List[str]
    learning_objectives: List[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    published_at: Optional[datetime]

class CourseEnrollment(BaseModel):
    """Course enrollment model"""
    id: Optional[str] = None
    user_id: str
    course_id: str
    enrolled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress_percentage: float = Field(default=0.0, ge=0, le=100)
    last_accessed: Optional[datetime] = None
    status: str = "active"  # active, completed, dropped
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class CourseStats(BaseModel):
    """Course statistics model"""
    total_enrollments: int
    active_enrollments: int
    completed_enrollments: int
    average_completion_time: Optional[float]  # in days
    average_rating: float
    total_revenue: float

__all__ = [
    'Course',
    'CourseCreate',
    'CourseUpdate', 
    'CourseResponse',
    'CourseEnrollment',
    'CourseStats',
    'Difficulty',
    'CourseStatus'
]

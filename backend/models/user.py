"""
User models for PyMastery
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

class RoleTrack(str, Enum):
    GENERAL = "general"
    BACKEND = "backend"
    FRONTEND = "frontend"
    DATA_SCIENCE = "data_science"
    MOBILE = "mobile"
    DEVOPS = "devops"

class User(BaseModel):
    """User model"""
    id: Optional[str] = None
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.STUDENT
    role_track: RoleTrack = RoleTrack.GENERAL
    points: int = Field(default=0, ge=0)
    level: int = Field(default=1, ge=1)
    login_streak: int = Field(default=0, ge=0)
    is_active: bool = True
    is_verified: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    # Progress tracking
    completed_courses: List[str] = Field(default_factory=list)
    current_courses: List[str] = Field(default_factory=list)
    skills: Dict[str, float] = Field(default_factory=dict)
    achievements: List[str] = Field(default_factory=list)
    
    # Preferences
    preferences: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class UserCreate(BaseModel):
    """User creation model"""
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.STUDENT
    role_track: RoleTrack = RoleTrack.GENERAL

class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[UserRole] = None
    role_track: Optional[RoleTrack] = None
    preferences: Optional[Dict[str, Any]] = None

class UserResponse(BaseModel):
    """User response model (without sensitive data)"""
    id: str
    email: str
    name: str
    role: UserRole
    role_track: RoleTrack
    points: int
    level: int
    login_streak: int
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    last_login: Optional[datetime]
    completed_courses: List[str]
    current_courses: List[str]
    skills: Dict[str, float]
    achievements: List[str]
    preferences: Dict[str, Any]

class UserStats(BaseModel):
    """User statistics model"""
    total_points: int
    current_level: int
    courses_completed: int
    courses_in_progress: int
    skills_count: int
    achievements_count: int
    login_streak: int
    days_active: int

__all__ = [
    'User',
    'UserCreate', 
    'UserLogin',
    'UserUpdate',
    'UserResponse',
    'UserStats',
    'UserRole',
    'RoleTrack'
]

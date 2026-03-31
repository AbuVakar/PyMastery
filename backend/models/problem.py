"""
Problem models for PyMastery
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from enum import Enum

class Difficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class ProblemType(str, Enum):
    ALGORITHM = "algorithm"
    DATA_STRUCTURE = "data_structure"
    WEB_DEVELOPMENT = "web_development"
    DATABASE = "database"
    SYSTEM_DESIGN = "system_design"
    GENERAL = "general"

class SubmissionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
    MEMORY_ERROR = "memory_error"

class Problem(BaseModel):
    """Problem model"""
    id: Optional[str] = None
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    difficulty: Difficulty = Difficulty.BEGINNER
    type: ProblemType = ProblemType.GENERAL
    category: str = Field(..., max_length=50)
    tags: List[str] = Field(default_factory=list)
    
    # Problem constraints
    time_limit: int = Field(default=5, ge=1, le=30)  # seconds
    memory_limit: int = Field(default=128, ge=16, le=1024)  # MB
    
    # Test cases
    test_cases: List[Dict[str, Any]] = Field(...)
    sample_test_cases: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Solution
    solution_code: Optional[str] = None
    solution_explanation: Optional[str] = None
    
    # Statistics
    points: int = Field(default=10, ge=1)
    submissions_count: int = Field(default=0, ge=0)
    success_rate: float = Field(default=0.0, ge=0, le=100)
    
    # Author info
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    
    # Metadata
    is_public: bool = True
    is_featured: bool = False
    prerequisites: List[str] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class ProblemCreate(BaseModel):
    """Problem creation model"""
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    difficulty: Difficulty = Difficulty.BEGINNER
    type: ProblemType = ProblemType.GENERAL
    category: str = Field(..., max_length=50)
    tags: List[str] = Field(default_factory=list)
    time_limit: int = Field(default=5, ge=1, le=30)
    memory_limit: int = Field(default=128, ge=16, le=1024)
    test_cases: List[Dict[str, Any]] = Field(...)
    sample_test_cases: List[Dict[str, Any]] = Field(default_factory=list)
    solution_code: Optional[str] = None
    solution_explanation: Optional[str] = None
    points: int = Field(default=10, ge=1)
    is_public: bool = True
    prerequisites: List[str] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)

class ProblemUpdate(BaseModel):
    """Problem update model"""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    difficulty: Optional[Difficulty] = None
    type: Optional[ProblemType] = None
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None
    time_limit: Optional[int] = Field(None, ge=1, le=30)
    memory_limit: Optional[int] = Field(None, ge=16, le=1024)
    test_cases: Optional[List[Dict[str, Any]]] = None
    sample_test_cases: Optional[List[Dict[str, Any]]] = None
    solution_code: Optional[str] = None
    solution_explanation: Optional[str] = None
    points: Optional[int] = Field(None, ge=1)
    is_public: Optional[bool] = None
    is_featured: Optional[bool] = None
    prerequisites: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None

class ProblemResponse(BaseModel):
    """Problem response model"""
    id: str
    title: str
    description: str
    difficulty: Difficulty
    type: ProblemType
    category: str
    tags: List[str]
    time_limit: int
    memory_limit: int
    sample_test_cases: List[Dict[str, Any]]
    points: int
    submissions_count: int
    success_rate: float
    author_id: Optional[str]
    author_name: Optional[str]
    is_public: bool
    is_featured: bool
    prerequisites: List[str]
    learning_objectives: List[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

class CodeSubmission(BaseModel):
    """Code submission model"""
    id: Optional[str] = None
    user_id: str
    problem_id: str
    code: str
    language: str
    status: SubmissionStatus = SubmissionStatus.PENDING
    
    # Execution results
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None  # seconds
    memory_used: Optional[int] = None  # MB
    
    # Test results
    test_results: List[Dict[str, Any]] = Field(default_factory=list)
    passed_test_cases: int = Field(default=0, ge=0)
    total_test_cases: int = Field(default=0, ge=0)
    
    # Scoring
    points_earned: int = Field(default=0, ge=0)
    is_correct: bool = False
    
    # Timestamps
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class SubmissionRequest(BaseModel):
    """Code submission request model"""
    problem_id: str
    code: str
    language: str

class SubmissionResponse(BaseModel):
    """Code submission response model"""
    id: str
    user_id: str
    problem_id: str
    language: str
    status: SubmissionStatus
    output: Optional[str]
    error: Optional[str]
    execution_time: Optional[float]
    memory_used: Optional[int]
    test_results: List[Dict[str, Any]]
    passed_test_cases: int
    total_test_cases: int
    points_earned: int
    is_correct: bool
    submitted_at: Optional[datetime]
    completed_at: Optional[datetime]

class ProblemStats(BaseModel):
    """Problem statistics model"""
    total_submissions: int
    successful_submissions: int
    success_rate: float
    average_execution_time: Optional[float]
    average_memory_usage: Optional[float]
    language_distribution: Dict[str, int]
    difficulty_distribution: Dict[str, int]

__all__ = [
    'Problem',
    'ProblemCreate',
    'ProblemUpdate',
    'ProblemResponse',
    'CodeSubmission',
    'SubmissionRequest',
    'SubmissionResponse',
    'ProblemStats',
    'Difficulty',
    'ProblemType',
    'SubmissionStatus'
]

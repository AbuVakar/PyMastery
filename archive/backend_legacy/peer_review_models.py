from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class RatingType(str, Enum):
    CODE_QUALITY = "code_quality"
    EFFICIENCY = "efficiency"
    READABILITY = "readability"
    BEST_PRACTICES = "best_practices"
    OVERALL = "overall"

class ReviewRating(BaseModel):
    rating_type: RatingType
    score: int  # 1-5 scale
    comment: Optional[str] = None

class PeerReview(BaseModel):
    id: str
    reviewer_id: str
    reviewer_name: str
    solution_id: str
    problem_id: int
    ratings: List[ReviewRating]
    overall_rating: int  # 1-5 scale
    summary: str
    status: ReviewStatus = ReviewStatus.PENDING
    created_at: datetime
    updated_at: datetime

class ReviewComment(BaseModel):
    id: str
    review_id: str
    reviewer_id: str
    reviewer_name: str
    comment: str
    line_number: Optional[int] = None  # For code-specific comments
    code_snippet: Optional[str] = None  # The specific code being commented on
    created_at: datetime

class SolutionForReview(BaseModel):
    solution_id: str
    problem_id: int
    problem_title: str
    author_id: str
    author_name: str
    code: str
    language: str
    created_at: datetime
    review_count: int = 0
    average_rating: float = 0.0

class ReviewSummary(BaseModel):
    total_reviews: int
    average_rating: float
    ratings_breakdown: dict  # e.g., {"1": 2, "2": 5, "3": 10, "4": 8, "5": 3}
    recent_reviews: List[PeerReview]

class ReviewRequest(BaseModel):
    solution_id: str
    ratings: List[ReviewRating]
    overall_rating: int
    summary: str

class CommentRequest(BaseModel):
    comment: str
    line_number: Optional[int] = None
    code_snippet: Optional[str] = None

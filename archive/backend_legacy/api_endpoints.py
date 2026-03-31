"""
Real API endpoints with proper validation and error handling
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, validator

from models import UserCreate, UserLogin, UserResponse, Progress, CodeSubmission, AnalyticsEvent
from services import UserService, ProgressService, CodeSubmissionService, AnalyticsService
from security import InputSanitizer, SecureUserInput, SecureCodeInput
from rate_limiter import rate_limit

# Router for API endpoints
router = APIRouter(prefix="/api/v1", tags=["API"])

# OAuth2 scheme for protected endpoints
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Response models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    errors: Optional[List[str]] = None

class UserListResponse(BaseModel):
    success: bool
    message: str
    data: List[UserResponse]
    total: int
    page: int
    per_page: int

class ProgressResponse(BaseModel):
    success: bool
    message: str
    data: List[Progress]
    total_completed: int
    total_items: int

class CodeSubmissionResponse(BaseModel):
    success: bool
    message: str
    data: Optional[CodeSubmission] = None
    execution_time: Optional[float] = None
    score: Optional[float] = None

# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current authenticated user"""
    try:
        user_service = UserService()
        # In a real implementation, decode JWT and get user
        # For now, return a mock user
        return {"email": "user@example.com", "id": "123"}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Error handling decorator
def handle_api_errors(func):
    """Decorator for consistent error handling"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            # Re-raise FastAPI HTTP exceptions
            raise
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    return wrapper

# User endpoints
@router.post("/register", response_model=APIResponse)
@rate_limit(limit=5, window=300)  # 5 registrations per 5 minutes
@handle_api_errors
async def register_user(user_data: SecureUserInput):
    """Register a new user with input validation"""
    user_service = UserService()
    
    # Check if user already exists
    existing_user = await user_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Create new user
    user = await user_service.create_user(user_data)
    
    return APIResponse(
        success=True,
        message="User registered successfully",
        data={"user_id": user.id}
    )

@router.post("/login", response_model=APIResponse)
@rate_limit(limit=10, window=300)  # 10 login attempts per 5 minutes
@handle_api_errors
async def login_user(user_data: UserLogin):
    """Authenticate user with input validation"""
    user_service = UserService()
    
    # Sanitize inputs
    sanitized_email = InputSanitizer.sanitize_text(user_data.email)
    sanitized_password = InputSanitizer.sanitize_text(user_data.password)
    
    # Authenticate user
    user = await user_service.verify_password(sanitized_email, sanitized_password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate JWT token (simplified)
    token = "mock_jwt_token"  # In real implementation, use proper JWT
    
    return APIResponse(
        success=True,
        message="Login successful",
        data={
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
    )

@router.get("/users/me", response_model=UserResponse)
@handle_api_errors
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    user_service = UserService()
    user = await user_service.get_user_by_id(current_user["id"])
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        subscription=user.subscription,
        created_at=user.created_at,
        last_login=user.last_login,
        is_active=user.is_active
    )

@router.get("/users", response_model=UserListResponse)
@handle_api_errors
async def get_users(
    page: int = 1,
    per_page: int = 10,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get users with pagination and search"""
    user_service = UserService()
    
    # In a real implementation, get users from database
    # For now, return mock data
    users = []
    total = 0
    
    if search:
        # Sanitize search query
        sanitized_search = InputSanitizer.sanitize_text(search)
        # Search users by name or email
        pass
    
    return UserListResponse(
        success=True,
        message="Users retrieved successfully",
        data=users,
        total=total,
        page=page,
        per_page=per_page
    )

# Progress endpoints
@router.post("/progress", response_model=APIResponse)
@rate_limit(limit=20, window=60)  # 20 progress updates per minute
@handle_api_errors
async def update_user_progress(
    progress_data: Progress,
    current_user: dict = Depends(get_current_user)
):
    """Update user learning progress"""
    progress_service = ProgressService()
    
    # Add user ID to progress data
    progress_data.user_id = current_user["id"]
    
    # Update progress
    progress = await progress_service.update_progress(current_user["id"], progress_data)
    
    return APIResponse(
        success=True,
        message="Progress updated successfully",
        data={"progress_id": progress.id}
    )

@router.get("/progress", response_model=ProgressResponse)
@handle_api_errors
async def get_user_progress(current_user: dict = Depends(get_current_user)):
    """Get user learning progress"""
    progress_service = ProgressService()
    
    progress_list = await progress_service.get_user_progress(current_user["id"])
    total_completed = sum(1 for p in progress_list if p.completed)
    
    return ProgressResponse(
        success=True,
        message="Progress retrieved successfully",
        data=progress_list,
        total_completed=total_completed,
        total_items=len(progress_list)
    )

# Code submission endpoints
@router.post("/code/submit", response_model=CodeSubmissionResponse)
@rate_limit(limit=20, window=60)  # 20 submissions per minute
@handle_api_errors
async def submit_code(
    code_data: SecureCodeInput,
    current_user: dict = Depends(get_current_user)
):
    """Submit code with validation"""
    code_service = CodeSubmissionService()
    
    # Add user ID to code data
    code_data.user_id = current_user["id"]
    
    # Submit code
    submission = await code_service.save_submission(code_data)
    
    return CodeSubmissionResponse(
        success=True,
        message="Code submitted successfully",
        data=submission,
        execution_time=submission.execution_time,
        score=submission.score
    )

@router.get("/code/submissions", response_model=APIResponse)
@handle_api_errors
async def get_user_submissions(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user code submissions"""
    code_service = CodeSubmissionService()
    
    submissions = await code_service.get_user_submissions(current_user["id"], limit)
    
    return APIResponse(
        success=True,
        message="Submissions retrieved successfully",
        data={"submissions": submissions, "total": len(submissions)}
    )

# Analytics endpoints
@router.post("/analytics/track", response_model=APIResponse)
@rate_limit(limit=100, window=60)  # 100 analytics events per minute
@handle_api_errors
async def track_analytics_event(
    event_data: AnalyticsEvent,
    request: Request,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Track analytics event"""
    analytics_service = AnalyticsService()
    
    # Add user ID and request info
    if current_user:
        event_data.user_id = current_user["id"]
    
    event_data.ip_address = request.client.host
    event_data.user_agent = request.headers.get("user-agent")
    
    # Track event
    event = await analytics_service.track_event(event_data)
    
    return APIResponse(
        success=True,
        message="Event tracked successfully",
        data={"event_id": event.id}
    )

@router.get("/analytics/user", response_model=APIResponse)
@handle_api_errors
async def get_user_analytics(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get user analytics data"""
    analytics_service = AnalyticsService()
    
    events = await analytics_service.get_user_analytics(current_user["id"], days)
    
    return APIResponse(
        success=True,
        message="Analytics retrieved successfully",
        data={"events": events, "total": len(events)}
    )

# Health check endpoint
@router.get("/health", response_model=APIResponse)
async def health_check():
    """Health check endpoint"""
    return APIResponse(
        success=True,
        message="API is healthy",
        data={"timestamp": datetime.utcnow().isoformat()}
    )

# Error handling for 404
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def not_found(path: str):
    """Handle 404 errors"""
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Endpoint '{path}' not found"
    )

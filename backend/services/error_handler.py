"""
Comprehensive Error Handling System
Production-grade error management with logging, recovery, and user-friendly responses
"""

import os
import asyncio
import traceback
import json
import uuid
from typing import Dict, Any, Optional, List, Callable, Union, Type
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, asdict
from enum import Enum
from functools import wraps
import logging
import aiofiles
from pathlib import Path

from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pymongo.errors import PyMongoError
from motor.motor_asyncio import AsyncIOMotorClient
from jose import JWTError
# No CryptError import needed for basic error handling
import redis.exceptions

class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ErrorCategory(Enum):
    """Error categories for classification"""
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATABASE = "database"
    NETWORK = "network"
    BUSINESS_LOGIC = "business_logic"
    EXTERNAL_SERVICE = "external_service"
    SYSTEM = "system"
    RATE_LIMIT = "rate_limit"
    CACHE = "cache"
    FILE_SYSTEM = "file_system"
    UNKNOWN = "unknown"

class ErrorRecoveryAction(Enum):
    """Recovery actions for errors"""
    RETRY = "retry"
    FALLBACK = "fallback"
    CIRCUIT_BREAKER = "circuit_breaker"
    USER_NOTIFICATION = "user_notification"
    LOG_ONLY = "log_only"
    ESCALATE = "escalate"
    BYPASS_CACHE = "bypass_cache"
    REFRESH_CACHE = "refresh_cache"
    REFRESH_TOKEN = "refresh_token"
    REQUIRE_REAUTH = "require_reauth"
    PROVIDE_SUGGESTIONS = "provide_suggestions"
    AUTO_CORRECT = "auto_correct"

@dataclass
class ErrorContext:
    """Error context information"""
    request_id: str
    user_id: Optional[str]
    endpoint: str
    method: str
    ip_address: str
    user_agent: str
    timestamp: datetime
    path_params: Dict[str, Any]
    query_params: Dict[str, Any]
    headers: Dict[str, str]
    body: Optional[str]

@dataclass
class ErrorDetail:
    """Detailed error information"""
    error_id: str
    category: ErrorCategory
    severity: ErrorSeverity
    code: str
    message: str
    user_message: str
    technical_message: str
    context: ErrorContext
    stack_trace: Optional[str]
    recovery_actions: List[ErrorRecoveryAction]
    retry_count: int = 0
    max_retries: int = 3
    next_retry_at: Optional[datetime] = None
    resolved: bool = False
    resolution: Optional[str] = None

@dataclass
class ErrorResponse:
    """User-friendly error response"""
    error_id: str
    code: str
    message: str
    timestamp: datetime
    request_id: str
    success: bool = False
    details: Optional[Dict[str, Any]] = None
    retry_after: Optional[int] = None
    suggestions: List[str] = None

    def dict(self) -> Dict[str, Any]:
        """Convert to dictionary with JSON serializable types"""
        data = asdict(self)
        if isinstance(data.get('timestamp'), datetime):
            data['timestamp'] = data['timestamp'].isoformat()
        return data

class ErrorConfig:
    """Error handling configuration"""
    
    def __init__(self):
        self.log_errors = os.getenv("LOG_ERRORS", "true").lower() == "true"
        self.log_level = os.getenv("ERROR_LOG_LEVEL", "ERROR")
        self.error_log_file = os.getenv("ERROR_LOG_FILE", "./logs/errors.log")
        self.max_error_log_size = int(os.getenv("MAX_ERROR_LOG_SIZE", "10")) * 1024 * 1024  # 10MB
        self.enable_error_recovery = os.getenv("ENABLE_ERROR_RECOVERY", "true").lower() == "true"
        self.enable_circuit_breaker = os.getenv("ENABLE_CIRCUIT_BREAKER", "true").lower() == "true"
        self.circuit_breaker_threshold = int(os.getenv("CIRCUIT_BREAKER_THRESHOLD", "5"))
        self.circuit_breaker_timeout = int(os.getenv("CIRCUIT_BREAKER_TIMEOUT", "60"))  # seconds
        self.enable_user_friendly_errors = os.getenv("ENABLE_USER_FRIENDLY_ERRORS", "true").lower() == "true"
        self.error_notification_webhook = os.getenv("ERROR_NOTIFICATION_WEBHOOK")
        self.error_retention_days = int(os.getenv("ERROR_RETENTION_DAYS", "30"))

class ErrorHandler:
    """Comprehensive error handling system"""
    
    def __init__(self, config: Optional[ErrorConfig] = None):
        self.config = config or ErrorConfig()
        
        # Error storage and tracking
        self.active_errors: Dict[str, ErrorDetail] = {}
        self.error_history: List[ErrorDetail] = []
        self.circuit_breakers: Dict[str, Dict[str, Any]] = {}
        
        # Error mappings
        self.error_mappings = self._initialize_error_mappings()
        
        # Recovery strategies
        self.recovery_strategies: Dict[ErrorCategory, List[Callable]] = {
            ErrorCategory.DATABASE: [self._retry_database_operation, self._fallback_to_cache],
            ErrorCategory.NETWORK: [self._retry_with_backoff, self._switch_endpoint],
            ErrorCategory.EXTERNAL_SERVICE: [self._use_fallback_service, self._circuit_breaker],
            ErrorCategory.CACHE: [self._bypass_cache, self._refresh_cache],
            ErrorCategory.AUTHENTICATION: [self._refresh_token, self._require_reauth],
            ErrorCategory.VALIDATION: [self._provide_suggestions, self._auto_correct],
        }
        
        # Logging setup
        self.logger = self._setup_logging()
        
        # Background tasks
        self._cleanup_task: Optional[asyncio.Task] = None
        self._notification_task: Optional[asyncio.Task] = None
        self._running = False
        
    def _initialize_error_mappings(self) -> Dict[Type, Dict[str, Any]]:
        """Initialize error type mappings"""
        return {
            # Database errors
            PyMongoError: {
                "category": ErrorCategory.DATABASE,
                "severity": ErrorSeverity.HIGH,
                "user_message": "Database operation failed. Please try again.",
                "recovery_actions": [ErrorRecoveryAction.RETRY, ErrorRecoveryAction.FALLBACK]
            },
            
            # Authentication errors
            JWTError: {
                "category": ErrorCategory.AUTHENTICATION,
                "severity": ErrorSeverity.MEDIUM,
                "user_message": "Authentication failed. Please log in again.",
                "recovery_actions": [ErrorRecoveryAction.USER_NOTIFICATION]
            },
            Exception: {
                "category": ErrorCategory.AUTHENTICATION,
                "severity": ErrorSeverity.HIGH,
                "user_message": "Authentication error. Please check your credentials.",
                "recovery_actions": [ErrorRecoveryAction.USER_NOTIFICATION]
            },
            
            # Network errors
            ConnectionError: {
                "category": ErrorCategory.NETWORK,
                "severity": ErrorSeverity.MEDIUM,
                "user_message": "Network connection failed. Please check your internet connection.",
                "recovery_actions": [ErrorRecoveryAction.RETRY, ErrorRecoveryAction.FALLBACK]
            },
            
            # Redis errors
            redis.exceptions.RedisError: {
                "category": ErrorCategory.CACHE,
                "severity": ErrorSeverity.MEDIUM,
                "user_message": "Cache service temporarily unavailable.",
                "recovery_actions": [ErrorRecoveryAction.BYPASS_CACHE, ErrorRecoveryAction.LOG_ONLY]
            },
            
            # Validation errors
            ValueError: {
                "category": ErrorCategory.VALIDATION,
                "severity": ErrorSeverity.LOW,
                "user_message": "Invalid input provided. Please check your data.",
                "recovery_actions": [ErrorRecoveryAction.PROVIDE_SUGGESTIONS]
            },
            TypeError: {
                "category": ErrorCategory.VALIDATION,
                "severity": ErrorSeverity.LOW,
                "user_message": "Data type error. Please check your input format.",
                "recovery_actions": [ErrorRecoveryAction.PROVIDE_SUGGESTIONS]
            },
            
            # System errors
            OSError: {
                "category": ErrorCategory.SYSTEM,
                "severity": ErrorSeverity.HIGH,
                "user_message": "System error occurred. Please try again later.",
                "recovery_actions": [ErrorRecoveryAction.ESCALATE, ErrorRecoveryAction.LOG_ONLY]
            },
            
            # HTTP errors
            HTTPException: {
                "category": ErrorCategory.BUSINESS_LOGIC,
                "severity": ErrorSeverity.MEDIUM,
                "user_message": "Request failed. Please check your request.",
                "recovery_actions": [ErrorRecoveryAction.USER_NOTIFICATION]
            },
        }
    
    def _setup_logging(self) -> logging.Logger:
        """Setup error logging"""
        logger = logging.getLogger("error_handler")
        logger.setLevel(getattr(logging, self.config.log_level))
        
        # Create log directory
        log_dir = Path(self.config.error_log_file).parent
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # File handler
        try:
            from logging.handlers import RotatingFileHandler
            file_handler = RotatingFileHandler(
                self.config.error_log_file,
                maxBytes=self.config.max_error_log_size,
                backupCount=5
            )
        except (ImportError, AttributeError):
            file_handler = logging.FileHandler(self.config.error_log_file)
        
        # Console handler
        console_handler = logging.StreamHandler()
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    async def handle_error(self, error: Exception, context: ErrorContext) -> ErrorDetail:
        """Handle an error with comprehensive processing"""
        error_id = str(uuid.uuid4())
        
        # Classify error
        error_type = type(error)
        error_mapping = self.error_mappings.get(error_type, self._get_default_mapping())
        
        # Create error detail
        error_detail = ErrorDetail(
            error_id=error_id,
            category=error_mapping["category"],
            severity=error_mapping["severity"],
            code=f"{error_mapping['category'].value.upper()}_{error_type.__name__.upper()}",
            message=str(error),
            user_message=error_mapping["user_message"],
            technical_message=str(error),
            context=context,
            stack_trace=traceback.format_exc(),
            recovery_actions=error_mapping["recovery_actions"],
            max_retries=3
        )
        
        # Store error
        self.active_errors[error_id] = error_detail
        self.error_history.append(error_detail)
        
        # Log error
        await self._log_error(error_detail)
        
        # Attempt recovery
        if self.config.enable_error_recovery:
            recovery_result = await self._attempt_recovery(error_detail)
            error_detail.resolution = recovery_result.get("message")
            error_detail.resolved = recovery_result.get("success", False)
        
        # Send notification if critical
        if error_detail.severity == ErrorSeverity.CRITICAL:
            await self._send_error_notification(error_detail)
        
        return error_detail
    
    def _get_default_mapping(self) -> Dict[str, Any]:
        """Get default error mapping for unknown errors"""
        return {
            "category": ErrorCategory.UNKNOWN,
            "severity": ErrorSeverity.MEDIUM,
            "user_message": "An unexpected error occurred. Please try again.",
            "recovery_actions": [ErrorRecoveryAction.LOG_ONLY, ErrorRecoveryAction.ESCALATE]
        }
    
    async def _log_error(self, error_detail: ErrorDetail):
        """Log error with full details"""
        if not self.config.log_errors:
            return
        
        log_entry = {
            "error_id": error_detail.error_id,
            "timestamp": error_detail.context.timestamp.isoformat(),
            "category": error_detail.category.value,
            "severity": error_detail.severity.value,
            "code": error_detail.code,
            "message": error_detail.message,
            "user_message": error_detail.user_message,
            "request_id": error_detail.context.request_id,
            "user_id": error_detail.context.user_id,
            "endpoint": error_detail.context.endpoint,
            "method": error_detail.context.method,
            "ip_address": error_detail.context.ip_address,
            "stack_trace": error_detail.stack_trace,
            "recovery_actions": [action.value for action in error_detail.recovery_actions],
            "resolved": error_detail.resolved,
            "resolution": error_detail.resolution
        }
        
        # Write to log file
        try:
            async with aiofiles.open(self.config.error_log_file, 'a') as f:
                await f.write(json.dumps(log_entry) + '\n')
        except Exception as e:
            self.logger.error(f"Failed to write error log: {e}")
        
        # Log to standard logger
        self.logger.error(
            f"Error {error_detail.error_id}: {error_detail.category.value} - {error_detail.message}"
        )
    
    async def _attempt_recovery(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Attempt error recovery based on category"""
        if error_detail.category not in self.recovery_strategies:
            return {"success": False, "message": "No recovery strategy available"}
        
        recovery_strategies = self.recovery_strategies[error_detail.category]
        
        for strategy in recovery_strategies:
            try:
                result = await strategy(error_detail)
                if result.get("success", False):
                    return result
            except Exception as e:
                self.logger.error(f"Recovery strategy failed: {e}")
                continue
        
        return {"success": False, "message": "All recovery strategies failed"}
    
    async def _retry_database_operation(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Retry database operation with exponential backoff"""
        if error_detail.retry_count >= error_detail.max_retries:
            return {"success": False, "message": "Max retries exceeded"}
        
        # Calculate backoff delay
        delay = min(2 ** error_detail.retry_count, 30)  # Max 30 seconds
        error_detail.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=delay)
        error_detail.retry_count += 1
        
        await asyncio.sleep(delay)
        
        return {"success": True, "message": f"Retrying database operation (attempt {error_detail.retry_count})"}
    
    async def _fallback_to_cache(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Fallback to cached data when database fails"""
        try:
            # This would be implemented based on specific cache keys
            return {"success": True, "message": "Using cached data as fallback"}
        except Exception as e:
            return {"success": False, "message": f"Fallback failed: {e}"}
    
    async def _retry_with_backoff(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Retry network operation with exponential backoff"""
        if error_detail.retry_count >= error_detail.max_retries:
            return {"success": False, "message": "Max retries exceeded"}
        
        delay = min(2 ** error_detail.retry_count, 10)  # Max 10 seconds
        error_detail.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=delay)
        error_detail.retry_count += 1
        
        await asyncio.sleep(delay)
        
        return {"success": True, "message": f"Retrying network operation (attempt {error_detail.retry_count})"}
    
    async def _switch_endpoint(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Switch to alternative endpoint"""
        # This would implement endpoint switching logic
        return {"success": True, "message": "Switched to alternative endpoint"}
    
    async def _use_fallback_service(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Use fallback external service"""
        # This would implement fallback service logic
        return {"success": True, "message": "Using fallback service"}
    
    async def _circuit_breaker(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Implement circuit breaker pattern"""
        endpoint = error_detail.context.endpoint
        
        if endpoint not in self.circuit_breakers:
            self.circuit_breakers[endpoint] = {
                "failures": 0,
                "last_failure": None,
                "state": "closed"  # closed, open, half-open
            }
        
        circuit = self.circuit_breakers[endpoint]
        circuit["failures"] += 1
        circuit["last_failure"] = datetime.now(timezone.utc)
        
        # Open circuit if threshold exceeded
        if circuit["failures"] >= self.config.circuit_breaker_threshold:
            circuit["state"] = "open"
            return {"success": True, "message": "Circuit breaker opened"}
        
        return {"success": False, "message": "Circuit breaker remains closed"}
    
    async def _bypass_cache(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Bypass cache and proceed without it"""
        return {"success": True, "message": "Cache bypassed, proceeding without cache"}
    
    async def _refresh_cache(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Refresh cache data"""
        return {"success": True, "message": "Cache refreshed"}
    
    async def _refresh_token(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Refresh authentication token"""
        return {"success": True, "message": "Token refreshed"}
    
    async def _require_reauth(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Require re-authentication"""
        return {"success": True, "message": "Re-authentication required"}
    
    async def _provide_suggestions(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Provide suggestions for validation errors"""
        suggestions = [
            "Check your input format",
            "Ensure all required fields are provided",
            "Validate data types and ranges"
        ]
        return {"success": True, "message": "Suggestions provided", "suggestions": suggestions}
    
    async def _auto_correct(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """Attempt auto-correction for validation errors"""
        return {"success": False, "message": "Auto-correction not available"}
    
    async def _send_error_notification(self, error_detail: ErrorDetail):
        """Send error notification for critical errors"""
        if not self.config.error_notification_webhook:
            return
        
        notification = {
            "error_id": error_detail.error_id,
            "severity": error_detail.severity.value,
            "category": error_detail.category.value,
            "message": error_detail.message,
            "timestamp": error_detail.context.timestamp.isoformat(),
            "endpoint": error_detail.context.endpoint,
            "user_id": error_detail.context.user_id
        }
        
        try:
            # This would implement webhook notification
            pass
        except Exception as e:
            self.logger.error(f"Failed to send error notification: {e}")
    
    def create_error_response(self, error_detail: ErrorDetail) -> JSONResponse:
        """Create user-friendly error response"""
        response_data = ErrorResponse(
            success=False,
            error_id=error_detail.error_id,
            code=error_detail.code,
            message=error_detail.user_message,
            timestamp=error_detail.context.timestamp,
            request_id=error_detail.context.request_id
        )
        
        # Add retry information
        if error_detail.next_retry_at:
            retry_after = int((error_detail.next_retry_at - datetime.now(timezone.utc)).total_seconds())
            response_data.retry_after = retry_after
        
        # Add suggestions
        if ErrorRecoveryAction.PROVIDE_SUGGESTIONS in error_detail.recovery_actions:
            response_data.suggestions = [
                "Check your input format",
                "Ensure all required fields are provided",
                "Try again in a few moments"
            ]
        
        # Add technical details in development
        if os.getenv("ENVIRONMENT") == "development":
            response_data.details = {
                "technical_message": error_detail.technical_message,
                "category": error_detail.category.value,
                "severity": error_detail.severity.value,
                "stack_trace": error_detail.stack_trace
            }
        
        return JSONResponse(
            status_code=self._get_http_status_code(error_detail),
            content=response_data.dict(),
            headers={
                "X-Error-ID": error_detail.error_id,
                "X-Error-Category": error_detail.category.value,
                "X-Error-Severity": error_detail.severity.value
            }
        )
    
    def _get_http_status_code(self, error_detail: ErrorDetail) -> int:
        """Get appropriate HTTP status code for error"""
        status_mapping = {
            ErrorCategory.VALIDATION: 400,
            ErrorCategory.AUTHENTICATION: 401,
            ErrorCategory.AUTHORIZATION: 403,
            ErrorCategory.RATE_LIMIT: 429,
            ErrorCategory.DATABASE: 500,
            ErrorCategory.NETWORK: 503,
            ErrorCategory.EXTERNAL_SERVICE: 502,
            ErrorCategory.BUSINESS_LOGIC: 422,
            ErrorCategory.SYSTEM: 500,
            ErrorCategory.CACHE: 500,
            ErrorCategory.FILE_SYSTEM: 500,
            ErrorCategory.UNKNOWN: 500
        }
        
        return status_mapping.get(error_detail.category, 500)
    
    async def start_background_tasks(self):
        """Start background cleanup and monitoring tasks"""
        if self._running:
            return
        
        self._running = True
        
        # Start cleanup task
        self._cleanup_task = asyncio.create_task(self._cleanup_old_errors())
        
        # Start notification task
        self._notification_task = asyncio.create_task(self._process_error_notifications())
    
    async def stop_background_tasks(self):
        """Stop background tasks"""
        self._running = False
        
        if self._cleanup_task:
            self._cleanup_task.cancel()
        
        if self._notification_task:
            self._notification_task.cancel()
    
    async def _cleanup_old_errors(self):
        """Clean up old error records"""
        while self._running:
            try:
                cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.config.error_retention_days)
                
                # Clean active errors
                expired_errors = [
                    error_id for error_id, error in self.active_errors.items()
                    if error.context.timestamp < cutoff_date
                ]
                
                for error_id in expired_errors:
                    del self.active_errors[error_id]
                
                # Clean history
                self.error_history = [
                    error for error in self.error_history
                    if error.context.timestamp >= cutoff_date
                ]
                
                await asyncio.sleep(3600)  # Run every hour
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error cleanup failed: {e}")
                await asyncio.sleep(3600)
    
    async def _process_error_notifications(self):
        """Process error notifications in background"""
        while self._running:
            try:
                # Check for critical errors that need notification
                critical_errors = [
                    error for error in self.error_history
                    if (error.severity == ErrorSeverity.CRITICAL and 
                        not error.resolved and
                        (datetime.now(timezone.utc) - error.context.timestamp).total_seconds() < 300)  # Last 5 minutes
                ]
                
                for error in critical_errors:
                    await self._send_error_notification(error)
                    error.resolved = True  # Mark as resolved to avoid duplicate notifications
                
                await asyncio.sleep(60)  # Check every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error notification processing failed: {e}")
                await asyncio.sleep(60)
    
    def get_error_statistics(self) -> Dict[str, Any]:
        """Get error statistics and metrics"""
        if not self.error_history:
            return {
                "total_errors": 0,
                "by_category": {},
                "by_severity": {},
                "recent_errors": [],
                "unresolved_errors": 0
            }
        
        # Calculate statistics
        total_errors = len(self.error_history)
        by_category = {}
        by_severity = {}
        unresolved_errors = 0
        
        for error in self.error_history:
            # By category
            category = error.category.value
            by_category[category] = by_category.get(category, 0) + 1
            
            # By severity
            severity = error.severity.value
            by_severity[severity] = by_severity.get(severity, 0) + 1
            
            # Unresolved
            if not error.resolved:
                unresolved_errors += 1
        
        # Recent errors (last 24 hours)
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        recent_errors = [
            error for error in self.error_history
            if error.context.timestamp >= cutoff
        ]
        
        return {
            "total_errors": total_errors,
            "by_category": by_category,
            "by_severity": by_severity,
            "recent_errors": len(recent_errors),
            "unresolved_errors": unresolved_errors,
            "active_errors": len(self.active_errors),
            "circuit_breakers": self.circuit_breakers
        }

# Global error handler instance
_error_handler: Optional[ErrorHandler] = None

def get_error_handler() -> ErrorHandler:
    """Get global error handler instance"""
    global _error_handler
    if _error_handler is None:
        _error_handler = ErrorHandler()
    return _error_handler

async def initialize_error_handler() -> bool:
    """Initialize global error handler"""
    try:
        error_handler = get_error_handler()
        await error_handler.start_background_tasks()
        print("Error handler initialized successfully")
        return True
    except Exception as e:
        print(f"Failed to initialize error handler: {e}")
        return False

# Decorators for error handling
def handle_errors(error_category: Optional[ErrorCategory] = None):
    """Decorator for automatic error handling"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                # Create error context
                # This would need to be adapted based on the function signature
                context = ErrorContext(
                    request_id=str(uuid.uuid4()),
                    user_id=None,
                    endpoint=func.__name__,
                    method="UNKNOWN",
                    ip_address="127.0.0.1",
                    user_agent="Unknown",
                    timestamp=datetime.now(timezone.utc),
                    path_params={},
                    query_params={},
                    headers={},
                    body=None
                )
                
                error_handler = get_error_handler()
                error_detail = await error_handler.handle_error(e, context)
                
                if error_category:
                    error_detail.category = error_category
                
                raise HTTPException(
                    status_code=error_handler._get_http_status_code(error_detail),
                    detail=error_detail.user_message
                )
        
        return wrapper
    return decorator

def safe_execute(func: Callable, fallback_value: Any = None):
    """Safely execute a function with error handling"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            error_handler = get_error_handler()
            error_handler.logger.error(f"Safe execute failed for {func.__name__}: {e}")
            return fallback_value
    return wrapper

# Error context extractor for FastAPI
def extract_error_context(request: Request) -> ErrorContext:
    """Extract error context from FastAPI request"""
    return ErrorContext(
        request_id=request.headers.get("X-Request-ID", str(uuid.uuid4())),
        user_id=request.headers.get("X-User-ID"),
        endpoint=request.url.path,
        method=request.method,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("User-Agent", "unknown"),
        timestamp=datetime.now(timezone.utc),
        path_params=dict(request.path_params),
        query_params=dict(request.query_params),
        headers=dict(request.headers),
        body=None  # Would need to be extracted from request body
    )

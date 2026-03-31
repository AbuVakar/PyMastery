"""
Comprehensive Error Handling Middleware for PyMastery
Provides centralized error handling, logging, and user-friendly error responses
"""

import logging
import traceback
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import json

logger = logging.getLogger(__name__)

class ErrorHandler:
    """Centralized error handling class"""
    
    @staticmethod
    def get_error_status_code(error: Exception) -> int:
        """Get appropriate HTTP status code for different error types"""
        if isinstance(error, HTTPException):
            return error.status_code
        elif isinstance(error, RequestValidationError):
            return 422
        elif isinstance(error, ValueError):
            return 400
        elif isinstance(error, PermissionError):
            return 403
        elif isinstance(error, FileNotFoundError):
            return 404
        elif isinstance(error, ConnectionError):
            return 503
        elif isinstance(error, TimeoutError):
            return 408
        else:
            return 500
    
    @staticmethod
    def get_error_message(error: Exception, include_details: bool = True) -> str:
        """Get user-friendly error message"""
        if isinstance(error, HTTPException):
            return error.detail
        elif isinstance(error, RequestValidationError):
            return "Validation failed. Please check your input data."
        elif isinstance(error, ValueError):
            return "Invalid input provided."
        elif isinstance(error, PermissionError):
            return "You don't have permission to perform this action."
        elif isinstance(error, FileNotFoundError):
            return "Requested resource not found."
        elif isinstance(error, ConnectionError):
            return "Service unavailable. Please try again later."
        elif isinstance(error, TimeoutError):
            return "Request timed out. Please try again."
        else:
            if include_details:
                return "An unexpected error occurred. Please try again later."
            else:
                return "Internal server error."
    
    @staticmethod
    def log_error(error: Exception, request: Optional[Request] = None, user_id: Optional[str] = None):
        """Log error with context information"""
        error_info = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "traceback": traceback.format_exc(),
        }
        
        if request:
            error_info.update({
                "method": request.method,
                "url": str(request.url),
                "headers": dict(request.headers),
                "client": request.client.host if request.client else None,
            })
        
        if user_id:
            error_info["user_id"] = user_id
        
        logger.error(f"Error occurred: {json.dumps(error_info, default=str)}")
    
    @staticmethod
    def create_error_response(
        error: Exception, 
        request: Optional[Request] = None,
        user_id: Optional[str] = None,
        include_stack_trace: bool = False
    ) -> JSONResponse:
        """Create standardized error response"""
        status_code = ErrorHandler.get_error_status_code(error)
        message = ErrorHandler.get_error_message(error)
        
        # Log the error
        ErrorHandler.log_error(error, request, user_id)
        
        response_data = {
            "success": False,
            "error": {
                "message": message,
                "type": type(error).__name__,
                "status_code": status_code
            },
            "timestamp": "2024-01-01T00:00:00Z"  # Will be updated in real implementation
        }
        
        # Include stack trace in development or when explicitly requested
        if include_stack_trace or (request and request.url.path.startswith("/debug")):
            response_data["error"]["stack_trace"] = traceback.format_exc()
        
        # Include request details in debug mode
        if request and request.url.path.startswith("/debug"):
            response_data["debug"] = {
                "method": request.method,
                "url": str(request.url),
                "headers": dict(request.headers),
            }
        
        return JSONResponse(
            status_code=status_code,
            content=response_data
        )

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions"""
    user_id = getattr(request.state, 'user_id', None)
    return ErrorHandler.create_error_response(exc, request, user_id)

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle validation errors"""
    user_id = getattr(request.state, 'user_id', None)
    
    # Create more detailed validation error response
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    response_data = {
        "success": False,
        "error": {
            "message": "Validation failed",
            "type": "ValidationError",
            "status_code": 422,
            "details": errors
        },
        "timestamp": "2024-01-01T00:00:00Z"
    }
    
    logger.error(f"Validation error: {json.dumps(errors)}")
    
    return JSONResponse(
        status_code=422,
        content=response_data
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions"""
    user_id = getattr(request.state, 'user_id', None)
    return ErrorHandler.create_error_response(exc, request, user_id)

async def starlette_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle Starlette HTTP exceptions"""
    user_id = getattr(request.state, 'user_id', None)
    return ErrorHandler.create_error_response(exc, request, user_id)

# Custom exception classes for better error handling
class PyMasteryException(Exception):
    """Base exception for PyMastery"""
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}

class DatabaseError(PyMasteryException):
    """Database related errors"""
    pass

class AuthenticationError(PyMasteryException):
    """Authentication related errors"""
    pass

class AuthorizationError(PyMasteryException):
    """Authorization related errors"""
    pass

class ValidationError(PyMasteryException):
    """Validation related errors"""
    pass

class ExternalServiceError(PyMasteryException):
    """External service related errors"""
    pass

class CodeExecutionError(PyMasteryException):
    """Code execution related errors"""
    pass

class FileOperationError(PyMasteryException):
    """File operation related errors"""
    pass

# Error context manager for better error tracking
class ErrorContext:
    """Context manager for error handling with context"""
    
    def __init__(self, operation: str, request: Optional[Request] = None, user_id: Optional[str] = None):
        self.operation = operation
        self.request = request
        self.user_id = user_id
        self.start_time = None
    
    def __enter__(self):
        self.start_time = "2024-01-01T00:00:00Z"  # Will be updated in real implementation
        logger.info(f"Starting operation: {self.operation}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            error_info = {
                "operation": self.operation,
                "error_type": exc_type.__name__,
                "error_message": str(exc_val),
                "user_id": self.user_id,
                "start_time": self.start_time,
            }
            
            if self.request:
                error_info.update({
                    "method": self.request.method,
                    "url": str(self.request.url),
                    "client": self.request.client.host if self.request.client else None,
                })
            
            logger.error(f"Operation failed: {json.dumps(error_info, default=str)}")
        else:
            logger.info(f"Operation completed successfully: {self.operation}")

# Decorator for automatic error handling
def handle_errors(operation_name: str = None):
    """Decorator for automatic error handling"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                # Try to extract request and user_id from kwargs
                request = kwargs.get('request')
                current_user = kwargs.get('current_user')
                user_id = str(current_user["_id"]) if current_user else None
                
                op_name = operation_name or func.__name__
                
                with ErrorContext(op_name, request, user_id):
                    raise  # Re-raise to be handled by exception handlers
                    
        return wrapper
    return decorator

# Utility functions for common error scenarios
def raise_not_found(resource: str, identifier: str = None):
    """Raise 404 error for missing resource"""
    message = f"{resource} not found"
    if identifier:
        message += f": {identifier}"
    raise HTTPException(status_code=404, detail=message)

def raise_permission_denied(action: str = "perform this action"):
    """Raise 403 error for permission denied"""
    raise HTTPException(status_code=403, detail=f"You don't have permission to {action}")

def raise_validation_error(message: str, field: str = None):
    """Raise 400 error for validation"""
    detail = message
    if field:
        detail = f"Invalid {field}: {message}"
    raise HTTPException(status_code=400, detail=detail)

def raise_service_unavailable(service: str):
    """Raise 503 error for unavailable service"""
    raise HTTPException(status_code=503, detail=f"{service} is currently unavailable")

def raise_rate_limit_exceeded():
    """Raise 429 error for rate limiting"""
    raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

def raise_internal_error(message: str = "Internal server error"):
    """Raise 500 error for internal errors"""
    raise HTTPException(status_code=500, detail=message)

# Error response utilities
def create_success_response(data: Any = None, message: str = "Operation successful"):
    """Create standardized success response"""
    response = {
        "success": True,
        "message": message,
        "timestamp": "2024-01-01T00:00:00Z"
    }
    
    if data is not None:
        response["data"] = data
    
    return response

def create_error_response(message: str, status_code: int = 500, error_type: str = None, details: Dict[str, Any] = None):
    """Create standardized error response"""
    response = {
        "success": False,
        "error": {
            "message": message,
            "status_code": status_code,
            "type": error_type or "Error"
        },
        "timestamp": "2024-01-01T00:00:00Z"
    }
    
    if details:
        response["error"]["details"] = details
    
    return JSONResponse(status_code=status_code, content=response)

# Configuration for error handling
ERROR_HANDLING_CONFIG = {
    "include_stack_trace": False,  # Set to True in development
    "log_all_errors": True,
    "max_error_message_length": 500,
    "sanitize_error_messages": True,  # Set to False in development
    "error_reporting_webhook": None,  # URL for error reporting service
}

# Error reporting function (placeholder for external error reporting service)
async def report_error_to_external_service(error_info: Dict[str, Any]):
    """Report error to external monitoring service"""
    try:
        if ERROR_HANDLING_CONFIG["error_reporting_webhook"]:
            # Implementation for sending error reports to external service
            pass
    except Exception as e:
        logger.error(f"Failed to report error to external service: {e}")

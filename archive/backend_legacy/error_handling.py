"""
Comprehensive error handling and logging system
"""
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class PyMasteryException(Exception):
    """Custom exception for PyMastery application"""
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(PyMasteryException):
    """Validation error"""
    def __init__(self, message: str, field: str = None, value: Any = None):
        super().__init__(message)
        self.field = field
        self.value = value

class AuthenticationError(PyMasteryException):
    """Authentication error"""
    def __init__(self, message: str, user_id: str = None):
        super().__init__(message)
        self.user_id = user_id

class DatabaseError(PyMasteryException):
    """Database error"""
    def __init__(self, message: str, operation: str = None, collection: str = None):
        super().__init__(message)
        self.operation = operation
        self.collection = collection

class RateLimitError(PyMasteryException):
    """Rate limiting error"""
    def __init__(self, message: str, limit: int = None, window: int = None):
        super().__init__(message)
        self.limit = limit
        self.window = window

class ErrorHandler:
    """Centralized error handling"""
    
    @staticmethod
    def log_error(
        error: Exception,
        request: Optional[Request] = None,
        user_id: Optional[str] = None,
        additional_context: Optional[Dict[str, Any]] = None
    ):
        """Log error with context"""
        error_info = {
            'timestamp': datetime.utcnow().isoformat(),
            'error_type': type(error).__name__,
            'message': str(error),
            'traceback': traceback.format_exc(),
            'user_id': user_id,
            'request_url': str(request.url) if request else None,
            'request_method': request.method if request else None,
            'user_agent': request.headers.get('user-agent') if request else None,
            'ip_address': request.client.host if request else None,
            'additional_context': additional_context or {}
        }
        
        logger.error(f"Error occurred: {error_info}")
        
        # In production, send to external monitoring service
        # send_to_monitoring_service(error_info)
    
    @staticmethod
    def log_warning(
        message: str,
        request: Optional[Request] = None,
        user_id: Optional[str] = None,
        additional_context: Optional[Dict[str, Any]] = None
    ):
        """Log warning with context"""
        warning_info = {
            'timestamp': datetime.utcnow().isoformat(),
            'message': message,
            'request_url': str(request.url) if request else None,
            'user_id': user_id,
            'additional_context': additional_context or {}
        }
        
        logger.warning(f"Warning: {warning_info}")
    
    @staticmethod
    def log_info(
        message: str,
        request: Optional[Request] = None,
        user_id: Optional[str] = None,
        additional_context: Optional[Dict[str, Any]] = None
    ):
        """Log info with context"""
        info_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'message': message,
            'request_url': str(request.url) if request else None,
            'user_id': user_id,
            'additional_context': additional_context or {}
        }
        
        logger.info(f"Info: {info_data}")
    
    @staticmethod
    def handle_validation_error(
        error: ValidationError,
        request: Optional[Request] = None
    ) -> JSONResponse:
        """Handle validation errors consistently"""
        ErrorHandler.log_error(error, request=request)
        
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": "Validation Error",
                "message": error.message,
                "field": error.field,
                "value": str(error.value) if error.value else None,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    def handle_authentication_error(
        error: AuthenticationError,
        request: Optional[Request] = None
    ) -> JSONResponse:
        """Handle authentication errors consistently"""
        ErrorHandler.log_error(error, request=request, user_id=error.user_id)
        
        return JSONResponse(
            status_code=HTTP_401_UNAUTHORIZED,
            content={
                "success": False,
                "error": "Authentication Error",
                "message": error.message,
                "timestamp": datetime.utcnow().isoformat()
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    @staticmethod
    def handle_database_error(
        error: DatabaseError,
        request: Optional[Request] = None
    ) -> JSONResponse:
        """Handle database errors consistently"""
        ErrorHandler.log_error(error, request=request)
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "Database Error",
                "message": "An error occurred while processing your request",
                "operation": error.operation,
                "collection": error.collection,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    def handle_rate_limit_error(
        error: RateLimitError,
        request: Optional[Request] = None
    ) -> JSONResponse:
        """Handle rate limit errors consistently"""
        ErrorHandler.log_warning(str(error), request=request)
        
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "Rate Limit Exceeded",
                "message": error.message,
                "limit": error.limit,
                "window": error.window,
                "retry_after": 60,  # Suggest retry after 60 seconds
                "timestamp": datetime.utcnow().isoformat()
            },
            headers={
                "Retry-After": "60",
                "X-RateLimit-Limit": str(error.limit) if error.limit else "100",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(error.window) if error.window else "60"
            }
        )
    
    @staticmethod
    def handle_general_error(
        error: Exception,
        request: Optional[Request] = None,
        user_id: Optional[str] = None
    ) -> JSONResponse:
        """Handle general errors consistently"""
        ErrorHandler.log_error(error, request=request, user_id=user_id)
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "Internal Server Error",
                "message": "An unexpected error occurred",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    def handle_not_found(
        path: str,
        request: Optional[Request] = None
    ) -> JSONResponse:
        """Handle 404 errors consistently"""
        error_msg = f"Endpoint '{path}' not found"
        ErrorHandler.log_warning(error_msg, request=request)
        
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "error": "Not Found",
                "message": error_msg,
                "path": path,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

class RequestLogger:
    """Request logging middleware"""
    
    def __init__(self):
        self.logger = logging.getLogger('request_logger')
    
    def log_request(self, request: Request, response_time: float = None):
        """Log incoming requests"""
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'method': request.method,
            'url': str(request.url),
            'query_params': dict(request.query_params),
            'headers': dict(request.headers),
            'client_ip': request.client.host if request.client else None,
            'user_agent': request.headers.get('user-agent'),
            'response_time': response_time
        }
        
        self.logger.info(f"Request: {log_data}")
    
    def log_response(self, request: Request, status_code: int, response_time: float):
        """Log response details"""
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'method': request.method,
            'url': str(request.url),
            'status_code': status_code,
            'response_time': response_time,
            'client_ip': request.client.host if request.client else None
        }
        
        self.logger.info(f"Response: {log_data}")

# Global error handler instance
error_handler = ErrorHandler()
request_logger = RequestLogger()

# Decorator for automatic error handling
def handle_errors(func):
    """Decorator for automatic error handling"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except ValidationError as e:
            # Extract request from kwargs if available
            request = kwargs.get('request')
            return error_handler.handle_validation_error(e, request)
        except AuthenticationError as e:
            request = kwargs.get('request')
            return error_handler.handle_authentication_error(e, request)
        except DatabaseError as e:
            request = kwargs.get('request')
            return error_handler.handle_database_error(e, request)
        except RateLimitError as e:
            request = kwargs.get('request')
            return error_handler.handle_rate_limit_error(e, request)
        except Exception as e:
            request = kwargs.get('request')
            user_id = kwargs.get('user_id')
            return error_handler.handle_general_error(e, request, user_id)
    
    return wrapper

# Security event logging
def log_security_event(
    event_type: str,
    details: Dict[str, Any],
    request: Optional[Request] = None,
    user_id: Optional[str] = None
):
    """Log security-related events"""
    security_log = {
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': event_type,
        'details': details,
        'request_url': str(request.url) if request else None,
        'user_id': user_id,
        'ip_address': request.client.host if request else None,
        'user_agent': request.headers.get('user-agent') if request else None
    }
    
    logger.warning(f"Security Event: {security_log}")
    
    # In production, send to security monitoring service
    # send_to_security_monitoring(security_log)

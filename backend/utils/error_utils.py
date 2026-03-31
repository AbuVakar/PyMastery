"""
Error Handling Utilities and Validators
Comprehensive error handling utilities with validation, retry logic, and recovery strategies
"""

import os
import asyncio
import re
import json
import uuid
from typing import Dict, Any, Optional, List, Callable, Union, Type
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from enum import Enum
import logging

from pydantic import BaseModel, ValidationError
from pymongo.errors import PyMongoError, DuplicateKeyError
from fastapi import HTTPException
from jose import JWTError, ExpiredSignatureError
# No CryptError import needed
import redis.exceptions

class ValidationRule(Enum):
    """Validation rule types"""
    REQUIRED = "required"
    TYPE_CHECK = "type_check"
    FORMAT_CHECK = "format_check"
    LENGTH_CHECK = "length_check"
    RANGE_CHECK = "range_check"
    PATTERN_CHECK = "pattern_check"
    CUSTOM = "custom"

@dataclass
class ValidationError:
    """Validation error details"""
    field: str
    rule: ValidationRule
    message: str
    value: Any
    constraint: Any
    suggestion: str

@dataclass
class RetryConfig:
    """Retry configuration"""
    max_attempts: int = 3
    base_delay: float = 1.0  # seconds
    max_delay: float = 60.0  # seconds
    exponential_base: float = 2.0
    jitter: bool = True
    retry_on: List[Type[Exception]] = None

class ErrorUtils:
    """Comprehensive error handling utilities"""
    
    def __init__(self):
        self.logger = logging.getLogger("error_utils")
        
        # Common validation patterns
        self.patterns = {
            "email": re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
            "password": re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'),
            "username": re.compile(r'^[a-zA-Z0-9_]{3,20}$'),
            "phone": re.compile(r'^\+?1?\d{9,15}$'),
            "url": re.compile(r'^https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w*))?)?$'),
        }
        
        # Error message templates
        self.error_messages = {
            ValidationRule.REQUIRED: "The '{field}' field is required",
            ValidationRule.TYPE_CHECK: "The '{field}' field must be of type {expected_type}",
            ValidationRule.FORMAT_CHECK: "The '{field}' field format is invalid",
            ValidationRule.LENGTH_CHECK: "The '{field}' field must be between {min_length} and {max_length} characters",
            ValidationRule.RANGE_CHECK: "The '{field}' field must be between {min_value} and {max_value}",
            ValidationRule.PATTERN_CHECK: "The '{field}' field does not match the required pattern",
        }
    
    def validate_email(self, email: str, field_name: str = "email") -> List[ValidationError]:
        """Validate email format"""
        errors = []
        
        if not email:
            errors.append(ValidationError(
                field=field_name,
                rule=ValidationRule.REQUIRED,
                message=self.error_messages[ValidationRule.REQUIRED].format(field=field_name),
                value=email,
                constraint="non-empty",
                suggestion="Please provide a valid email address"
            ))
        elif not self.patterns["email"].match(email):
            errors.append(ValidationError(
                field=field_name,
                rule=ValidationRule.FORMAT_CHECK,
                message=self.error_messages[ValidationRule.FORMAT_CHECK].format(field=field_name),
                value=email,
                constraint="email format",
                suggestion="Please provide a valid email address (e.g., user@example.com)"
            ))
        
        return errors
    
    def validate_password(self, password: str, field_name: str = "password") -> List[ValidationError]:
        """Validate password strength"""
        errors = []
        
        if not password:
            errors.append(ValidationError(
                field=field_name,
                rule=ValidationRule.REQUIRED,
                message=self.error_messages[ValidationRule.REQUIRED].format(field=field_name),
                value=password,
                constraint="non-empty",
                suggestion="Please provide a password"
            ))
        else:
            if len(password) < 8:
                errors.append(ValidationError(
                    field=field_name,
                    rule=ValidationRule.LENGTH_CHECK,
                    message=self.error_messages[ValidationRule.LENGTH_CHECK].format(
                        field=field_name, min_length=8, max_length=128
                    ),
                    value=password,
                    constraint={"min_length": 8, "max_length": 128},
                    suggestion="Password must be at least 8 characters long"
                ))
            
            if not self.patterns["password"].match(password):
                errors.append(ValidationError(
                    field=field_name,
                    rule=ValidationRule.PATTERN_CHECK,
                    message="Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
                    value=password,
                    constraint="password strength",
                    suggestion="Include uppercase, lowercase, numbers, and special characters"
                ))
        
        return errors
    
    def validate_username(self, username: str, field_name: str = "username") -> List[ValidationError]:
        """Validate username format"""
        errors = []
        
        if not username:
            errors.append(ValidationError(
                field=field_name,
                rule=ValidationRule.REQUIRED,
                message=self.error_messages[ValidationRule.REQUIRED].format(field=field_name),
                value=username,
                constraint="non-empty",
                suggestion="Please provide a username"
            ))
        else:
            if len(username) < 3 or len(username) > 20:
                errors.append(ValidationError(
                    field=field_name,
                    rule=ValidationRule.LENGTH_CHECK,
                    message=self.error_messages[ValidationRule.LENGTH_CHECK].format(
                        field=field_name, min_length=3, max_length=20
                    ),
                    value=username,
                    constraint={"min_length": 3, "max_length": 20},
                    suggestion="Username must be between 3 and 20 characters"
                ))
            
            if not self.patterns["username"].match(username):
                errors.append(ValidationError(
                    field=field_name,
                    rule=ValidationRule.PATTERN_CHECK,
                    message=self.error_messages[ValidationRule.FORMAT_CHECK].format(field=field_name),
                    value=username,
                    constraint="username format",
                    suggestion="Username can only contain letters, numbers, and underscores"
                ))
        
        return errors
    
    def validate_required_fields(self, data: Dict[str, Any], required_fields: List[str]) -> List[ValidationError]:
        """Validate required fields"""
        errors = []
        
        for field in required_fields:
            if field not in data or data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
                errors.append(ValidationError(
                    field=field,
                    rule=ValidationRule.REQUIRED,
                    message=self.error_messages[ValidationRule.REQUIRED].format(field=field),
                    value=data.get(field),
                    constraint="required",
                    suggestion=f"Please provide the {field} field"
                ))
        
        return errors
    
    def validate_field_types(self, data: Dict[str, Any], type_mapping: Dict[str, type]) -> List[ValidationError]:
        """Validate field types"""
        errors = []
        
        for field, expected_type in type_mapping.items():
            if field in data and data[field] is not None:
                if not isinstance(data[field], expected_type):
                    errors.append(ValidationError(
                        field=field,
                        rule=ValidationRule.TYPE_CHECK,
                        message=self.error_messages[ValidationRule.TYPE_CHECK].format(
                            field=field, expected_type=expected_type.__name__
                        ),
                        value=data[field],
                        constraint=expected_type,
                        suggestion=f"Please ensure {field} is a valid {expected_type.__name__}"
                    ))
        
        return errors
    
    def validate_field_ranges(self, data: Dict[str, Any], range_mapping: Dict[str, Dict[str, Any]]) -> List[ValidationError]:
        """Validate field ranges"""
        errors = []
        
        for field, constraints in range_mapping.items():
            if field in data and data[field] is not None:
                value = data[field]
                
                # Check min value
                if "min" in constraints and value < constraints["min"]:
                    errors.append(ValidationError(
                        field=field,
                        rule=ValidationRule.RANGE_CHECK,
                        message=self.error_messages[ValidationRule.RANGE_CHECK].format(
                            field=field, min_value=constraints["min"], max_value=constraints.get("max", "âˆž")
                        ),
                        value=value,
                        constraint=constraints,
                        suggestion=f"{field} must be at least {constraints['min']}"
                    ))
                
                # Check max value
                if "max" in constraints and value > constraints["max"]:
                    errors.append(ValidationError(
                        field=field,
                        rule=ValidationRule.RANGE_CHECK,
                        message=self.error_messages[ValidationRule.RANGE_CHECK].format(
                            field=field, min_value=constraints.get("min", "0"), max_value=constraints["max"]
                        ),
                        value=value,
                        constraint=constraints,
                        suggestion=f"{field} must be at most {constraints['max']}"
                    ))
        
        return errors
    
    def format_validation_errors(self, errors: List[ValidationError]) -> Dict[str, Any]:
        """Format validation errors for API response"""
        field_errors = {}
        suggestions = []
        
        for error in errors:
            if error.field not in field_errors:
                field_errors[error.field] = []
            
            field_errors[error.field].append({
                "rule": error.rule.value,
                "message": error.message,
                "value": error.value,
                "constraint": error.constraint
            })
            
            if error.suggestion not in suggestions:
                suggestions.append(error.suggestion)
        
        return {
            "success": False,
            "error": "Validation failed",
            "message": "Please check your input data",
            "validation_errors": field_errors,
            "suggestions": suggestions,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    async def retry_with_backoff(self, func: Callable, config: Optional[RetryConfig] = None, *args, **kwargs) -> Any:
        """Retry function with exponential backoff"""
        if config is None:
            config = RetryConfig()
        
        last_exception = None
        
        for attempt in range(config.max_attempts):
            try:
                return await func(*args, **kwargs)
                
            except Exception as e:
                last_exception = e
                
                # Check if we should retry on this exception
                if config.retry_on and not any(isinstance(e, exc_type) for exc_type in config.retry_on):
                    raise e
                
                if attempt == config.max_attempts - 1:
                    # Last attempt, re-raise exception
                    raise e
                
                # Calculate delay
                delay = min(config.base_delay * (config.exponential_base ** attempt), config.max_delay)
                
                # Add jitter to prevent thundering herd
                if config.jitter:
                    import random
                    delay *= (0.5 + random.random() * 0.5)
                
                self.logger.warning(f"Attempt {attempt + 1} failed, retrying in {delay:.2f}s: {e}")
                await asyncio.sleep(delay)
        
        raise last_exception
    
    def create_safe_wrapper(self, func: Callable, fallback_value: Any = None, 
                          exception_types: List[Type[Exception]] = None) -> Callable:
        """Create safe wrapper for function execution"""
        async def safe_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                # Check if exception type is in our list
                if exception_types and not any(isinstance(e, exc_type) for exc_type in exception_types):
                    raise e
                
                self.logger.error(f"Safe wrapper caught exception for {func.__name__}: {e}")
                return fallback_value
        
        return safe_wrapper
    
    def handle_database_error(self, error: Exception) -> Dict[str, Any]:
        """Handle database errors with user-friendly messages"""
        if isinstance(error, DuplicateKeyError):
            return {
                "success": False,
                "error": "Duplicate entry",
                "message": "This record already exists",
                "suggestion": "Please use a different value or check existing records",
                "error_code": "DUPLICATE_KEY"
            }
        elif isinstance(error, PyMongoError):
            return {
                "success": False,
                "error": "Database error",
                "message": "Database operation failed. Please try again later.",
                "suggestion": "Please try again or contact support if the problem persists",
                "error_code": "DATABASE_ERROR"
            }
        else:
            return {
                "success": False,
                "error": "Unknown database error",
                "message": "An unexpected database error occurred",
                "suggestion": "Please try again or contact support",
                "error_code": "UNKNOWN_DB_ERROR"
            }
    
    def handle_authentication_error(self, error: Exception) -> Dict[str, Any]:
        """Handle authentication errors with user-friendly messages"""
        if isinstance(error, ExpiredSignatureError):
            return {
                "success": False,
                "error": "Token expired",
                "message": "Your session has expired. Please log in again.",
                "suggestion": "Please log in to continue",
                "error_code": "TOKEN_EXPIRED"
            }
        elif isinstance(error, JWTError):
            return {
                "success": False,
                "error": "Invalid token",
                "message": "Invalid authentication token. Please log in again.",
                "suggestion": "Please log in to continue",
                "error_code": "INVALID_TOKEN"
            }
        elif isinstance(error, Exception):
            return {
                "success": False,
                "error": "Authentication error",
                "message": "Authentication failed. Please check your credentials.",
                "suggestion": "Please verify your username and password",
                "error_code": "AUTH_ERROR"
            }
        else:
            return {
                "success": False,
                "error": "Authentication error",
                "message": "An authentication error occurred. Please try again.",
                "suggestion": "Please check your credentials and try again",
                "error_code": "UNKNOWN_AUTH_ERROR"
            }
    
    def handle_network_error(self, error: Exception) -> Dict[str, Any]:
        """Handle network errors with user-friendly messages"""
        if isinstance(error, ConnectionError):
            return {
                "success": False,
                "error": "Connection failed",
                "message": "Unable to connect to the service. Please check your internet connection.",
                "suggestion": "Please check your network connection and try again",
                "error_code": "CONNECTION_ERROR"
            }
        elif isinstance(error, TimeoutError):
            return {
                "success": False,
                "error": "Request timeout",
                "message": "The request timed out. Please try again.",
                "suggestion": "Please try again with a more stable connection",
                "error_code": "TIMEOUT_ERROR"
            }
        else:
            return {
                "success": False,
                "error": "Network error",
                "message": "A network error occurred. Please try again.",
                "suggestion": "Please check your connection and try again",
                "error_code": "NETWORK_ERROR"
            }
    
    def handle_cache_error(self, error: Exception) -> Dict[str, Any]:
        """Handle cache errors with user-friendly messages"""
        if isinstance(error, redis.exceptions.ConnectionError):
            return {
                "success": False,
                "error": "Cache unavailable",
                "message": "Cache service is temporarily unavailable.",
                "suggestion": "Service will continue without caching",
                "error_code": "CACHE_UNAVAILABLE"
            }
        elif isinstance(error, redis.exceptions.TimeoutError):
            return {
                "success": False,
                "error": "Cache timeout",
                "message": "Cache service is responding slowly.",
                "suggestion": "Service will continue without caching",
                "error_code": "CACHE_TIMEOUT"
            }
        else:
            return {
                "success": False,
                "error": "Cache error",
                "message": "A cache error occurred.",
                "suggestion": "Service will continue without caching",
                "error_code": "CACHE_ERROR"
            }
    
    def create_error_response(self, error_code: str, message: str, 
                          details: Optional[Dict[str, Any]] = None,
                          suggestions: Optional[List[str]] = None,
                          status_code: int = 500) -> Dict[str, Any]:
        """Create standardized error response"""
        response = {
            "success": False,
            "error": error_code,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": str(uuid.uuid4())
        }
        
        if details:
            response["details"] = details
        
        if suggestions:
            response["suggestions"] = suggestions
        
        # Add technical details in development
        if os.getenv("ENVIRONMENT") == "development":
            import traceback
            response["technical_details"] = {
                "stack_trace": traceback.format_exc(),
                "debug_info": "Additional debug information available"
            }
        
        return response
    
    def log_error_with_context(self, error: Exception, context: Dict[str, Any]):
        """Log error with full context"""
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context,
            "stack_trace": traceback.format_exc()
        }
        
        self.logger.error(f"Error: {json.dumps(log_entry, default=str)}")
    
    def sanitize_error_message(self, message: str) -> str:
        """Sanitize error messages for user display"""
        # Remove sensitive information
        sanitized = re.sub(r'password["\s]*[:=]["\s]*["\s]*[^"\s]+', 'password=***', message, flags=re.IGNORECASE)
        sanitized = re.sub(r'token["\s]*[:=]["\s]*["\s]*[^"\s]+', 'token=***', sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r'secret["\s]*[:=]["\s]*["\s]*[^"\s]+', 'secret=***', sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r'key["\s]*[:=]["\s]*["\s]*[^"\s]+', 'key=***', sanitized, flags=re.IGNORECASE)
        
        # Remove file paths
        sanitized = re.sub(r'/[^\s]*', '/***', sanitized)
        sanitized = re.sub(r'[A-Za-z]:\\[^\s]*', '***:\\***', sanitized)
        
        # Remove IP addresses
        sanitized = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', '***.***.***.***', sanitized)
        
        return sanitized
    
    def create_user_friendly_error(self, technical_error: str, context: str = "") -> str:
        """Create user-friendly error message from technical error"""
        error_mappings = {
            "connection refused": "The service is temporarily unavailable. Please try again later.",
            "timeout": "The request took too long to complete. Please try again.",
            "authentication failed": "Invalid credentials. Please check your username and password.",
            "permission denied": "You don't have permission to access this resource.",
            "not found": "The requested resource was not found.",
            "duplicate key": "This record already exists. Please use a different value.",
            "validation error": "Please check your input data and try again.",
            "rate limit exceeded": "Too many requests. Please try again later.",
            "service unavailable": "The service is temporarily unavailable. Please try again later.",
        }
        
        # Try to match known error patterns
        for pattern, friendly_message in error_mappings.items():
            if pattern.lower() in technical_error.lower():
                return friendly_message
        
        # Default user-friendly message
        return "An error occurred. Please try again or contact support if the problem persists."

class SafeExecutor:
    """Safe executor with error handling"""
    
    def __init__(self, error_utils: ErrorUtils):
        self.error_utils = error_utils
        self.logger = logging.getLogger("safe_executor")
    
    async def execute_with_fallback(self, primary_func: Callable, fallback_func: Callable, 
                                 *args, **kwargs) -> Any:
        """Execute primary function with fallback on failure"""
        try:
            return await primary_func(*args, **kwargs)
        except Exception as e:
            self.logger.warning(f"Primary function failed, using fallback: {e}")
            try:
                return await fallback_func(*args, **kwargs)
            except Exception as fallback_error:
                self.logger.error(f"Both primary and fallback functions failed: {fallback_error}")
                raise fallback_error
    
    async def execute_with_timeout(self, func: Callable, timeout: float, 
                               default_value: Any = None, *args, **kwargs) -> Any:
        """Execute function with timeout"""
        try:
            return await asyncio.wait_for(func(*args, **kwargs), timeout=timeout)
        except asyncio.TimeoutError:
            self.logger.warning(f"Function timed out after {timeout} seconds")
            return default_value
        except Exception as e:
            self.logger.error(f"Function execution failed: {e}")
            raise e
    
    async def execute_multiple_with_fallbacks(self, functions: List[Callable], 
                                         fallback_values: List[Any] = None, 
                                         *args, **kwargs) -> Any:
        """Execute multiple functions, returning first successful result"""
        if fallback_values is None:
            fallback_values = [None] * len(functions)
        
        last_exception = None
        
        for i, func in enumerate(functions):
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                last_exception = e
                self.logger.warning(f"Function {i+1} failed: {e}")
                continue
        
        # All functions failed, return last fallback value
        if fallback_values:
            return fallback_values[-1]
        
        raise last_exception

# Decorators for error handling
def safe_execute(default_return: Any = None, log_errors: bool = True):
    """Decorator for safe function execution"""
    def decorator(func: Callable):
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if log_errors:
                    logging.error(f"Safe execute failed for {func.__name__}: {e}")
                return default_return
        return wrapper
    return decorator

def validate_input(validation_rules: Dict[str, Any]):
    """Decorator for input validation"""
    def decorator(func: Callable):
        async def wrapper(*args, **kwargs):
            error_utils = ErrorUtils()
            errors = []
            
            # Validate each rule
            for field, rules in validation_rules.items():
                if field in kwargs:
                    value = kwargs[field]
                    
                    # Required validation
                    if rules.get("required", False) and (value is None or (isinstance(value, str) and not value.strip())):
                        errors.append(ValidationError(
                            field=field,
                            rule=ValidationRule.REQUIRED,
                            message=f"The '{field}' field is required",
                            value=value,
                            constraint="required",
                            suggestion=f"Please provide the {field} field"
                        ))
                    
                    # Type validation
                    if "type" in rules and value is not None:
                        expected_type = rules["type"]
                        if not isinstance(value, expected_type):
                            errors.append(ValidationError(
                                field=field,
                                rule=ValidationRule.TYPE_CHECK,
                                message=f"The '{field}' field must be of type {expected_type.__name__}",
                                value=value,
                                constraint=expected_type,
                                suggestion=f"Please ensure {field} is a valid {expected_type.__name__}"
                            ))
                    
                    # Length validation
                    if "length" in rules and isinstance(value, str):
                        length_rules = rules["length"]
                        if len(value) < length_rules.get("min", 0) or len(value) > length_rules.get("max", float('inf')):
                            errors.append(ValidationError(
                                field=field,
                                rule=ValidationRule.LENGTH_CHECK,
                                message=f"The '{field}' field must be between {length_rules.get('min', 0)} and {length_rules.get('max', 'âˆž')} characters",
                                value=value,
                                constraint=length_rules,
                                suggestion=f"Please ensure {field} length is within the allowed range"
                            ))
            
            if errors:
                error_response = error_utils.format_validation_errors(errors)
                raise HTTPException(status_code=422, detail=error_response)
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Global error utils instance
_error_utils: Optional[ErrorUtils] = None

def get_error_utils() -> ErrorUtils:
    """Get global error utils instance"""
    global _error_utils
    if _error_utils is None:
        _error_utils = ErrorUtils()
    return _error_utils

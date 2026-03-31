"""
Error Handling Middleware for FastAPI
Comprehensive error handling with logging, recovery, and user-friendly responses
"""

import os
import asyncio
import time
import uuid
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timezone
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging

from services.error_handler import (
    get_error_handler, 
    extract_error_context, 
    ErrorDetail,
    ErrorCategory,
    ErrorSeverity,
    ErrorRecoveryAction
)

class ErrorMiddleware(BaseHTTPMiddleware):
    """Comprehensive error handling middleware"""
    
    def __init__(self, app: ASGIApp, enable_detailed_errors: bool = False):
        super().__init__(app)
        self.enable_detailed_errors = enable_detailed_errors or os.getenv("ENVIRONMENT") == "development"
        self.error_handler = get_error_handler()
        self.logger = logging.getLogger("error_middleware")
        
        # Request timing
        self.start_times: Dict[str, float] = {}
        
        # Rate limiting for errors
        self.error_rates: Dict[str, Dict[str, Any]] = {}
    
    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch method"""
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        request.state.start_time = time.time()
        
        # Store start time
        self.start_times[request_id] = request.state.start_time
        
        try:
            # Process request
            response = await call_next(request)
            
            # Add timing headers
            if hasattr(request.state, 'start_time'):
                processing_time = (time.time() - request.state.start_time) * 1000
                response.headers["X-Process-Time"] = f"{processing_time:.2f}ms"
                response.headers["X-Request-ID"] = request_id
            
            return response
            
        except HTTPException as http_error:
            # Handle HTTP exceptions
            return await self._handle_http_exception(http_error, request, request_id)
            
        except Exception as error:
            # Handle unexpected exceptions
            return await self._handle_unexpected_exception(error, request, request_id)
        
        finally:
            # Clean up start time
            if request_id in self.start_times:
                del self.start_times[request_id]
    
    async def _handle_http_exception(self, http_error: HTTPException, request: Request, request_id: str) -> JSONResponse:
        """Handle HTTP exceptions with enhanced error information"""
        # Extract error context
        context = extract_error_context(request)
        context.request_id = request_id
        
        # Create error detail
        error_detail = ErrorDetail(
            error_id=str(uuid.uuid4()),
            category=self._categorize_http_error(http_error.status_code),
            severity=self._get_severity_from_status_code(http_error.status_code),
            code=f"HTTP_{http_error.status_code}",
            message=str(http_error.detail),
            user_message=self._get_user_message_from_status_code(http_error.status_code),
            technical_message=str(http_error.detail),
            context=context,
            stack_trace=None,  # HTTP exceptions typically don't have stack traces
            recovery_actions=self._get_recovery_actions_for_http_error(http_error.status_code)
        )
        
        # Log error
        await self.error_handler._log_error(error_detail)
        
        # Create response
        return self.error_handler.create_error_response(error_detail)
    
    async def _handle_unexpected_exception(self, error: Exception, request: Request, request_id: str) -> JSONResponse:
        """Handle unexpected exceptions"""
        # Extract error context
        context = extract_error_context(request)
        context.request_id = request_id
        
        # Handle error through error handler
        error_detail = await self.error_handler.handle_error(error, context)
        
        # Attempt recovery if enabled
        if not error_detail.resolved:
            recovery_result = await self.error_handler._attempt_recovery(error_detail)
            if recovery_result.get("success"):
                error_detail.resolution = recovery_result.get("message")
                error_detail.resolved = True
        
        # Create response
        return self.error_handler.create_error_response(error_detail)
    
    def _categorize_http_error(self, status_code: int) -> ErrorCategory:
        """Categorize HTTP error by status code"""
        if status_code == 400:
            return ErrorCategory.VALIDATION
        elif status_code == 401:
            return ErrorCategory.AUTHENTICATION
        elif status_code == 403:
            return ErrorCategory.AUTHORIZATION
        elif status_code == 404:
            return ErrorCategory.BUSINESS_LOGIC
        elif status_code == 429:
            return ErrorCategory.RATE_LIMIT
        elif 500 <= status_code < 600:
            return ErrorCategory.SYSTEM
        else:
            return ErrorCategory.UNKNOWN
    
    def _get_severity_from_status_code(self, status_code: int) -> ErrorSeverity:
        """Get error severity from HTTP status code"""
        if status_code < 400:
            return ErrorSeverity.LOW
        elif status_code < 500:
            return ErrorSeverity.MEDIUM
        elif status_code < 600:
            return ErrorSeverity.HIGH
        else:
            return ErrorSeverity.CRITICAL
    
    def _get_user_message_from_status_code(self, status_code: int) -> str:
        """Get user-friendly message from HTTP status code"""
        user_messages = {
            400: "Invalid request. Please check your input data.",
            401: "Authentication required. Please log in.",
            403: "Access denied. You don't have permission to access this resource.",
            404: "Resource not found. Please check the URL and try again.",
            405: "Method not allowed. Please check the HTTP method.",
            408: "Request timeout. Please try again.",
            409: "Conflict. The resource is in an inconsistent state.",
            422: "Invalid data. Please check your input format.",
            429: "Too many requests. Please try again later.",
            500: "Internal server error. Please try again later.",
            502: "Service unavailable. Please try again later.",
            503: "Service temporarily unavailable. Please try again later.",
            504: "Gateway timeout. Please try again later.",
        }
        
        return user_messages.get(status_code, "An error occurred. Please try again.")
    
    def _get_recovery_actions_for_http_error(self, status_code: int) -> list:
        """Get recovery actions for HTTP error"""
        recovery_actions = {
            400: [ErrorRecoveryAction.PROVIDE_SUGGESTIONS],
            401: [ErrorRecoveryAction.USER_NOTIFICATION],
            403: [ErrorRecoveryAction.USER_NOTIFICATION],
            404: [ErrorRecoveryAction.USER_NOTIFICATION],
            429: [ErrorRecoveryAction.RETRY],
            500: [ErrorRecoveryAction.RETRY, ErrorRecoveryAction.ESCALATE],
            502: [ErrorRecoveryAction.RETRY, ErrorRecoveryAction.FALLBACK],
            503: [ErrorRecoveryAction.RETRY, ErrorRecoveryAction.CIRCUIT_BREAKER],
            504: [ErrorRecoveryAction.RETRY],
        }
        
        return recovery_actions.get(status_code, [ErrorRecoveryAction.LOG_ONLY])

class CircuitBreakerMiddleware(BaseHTTPMiddleware):
    """Circuit breaker middleware for external service calls"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.circuit_states: Dict[str, Dict[str, Any]] = {}
        self.logger = logging.getLogger("circuit_breaker")
    
    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch method"""
        endpoint = request.url.path
        
        # Check if circuit breaker is active for this endpoint
        circuit_state = self.circuit_states.get(endpoint, {
            "state": "closed",  # closed, open, half-open
            "failures": 0,
            "last_failure": None,
            "success_count": 0,
            "timeout": 60  # seconds
        })
        
        current_time = datetime.now(timezone.utc)
        
        # Check if circuit should be reset
        if (circuit_state["state"] == "open" and 
            circuit_state["last_failure"] and
            (current_time - circuit_state["last_failure"]).total_seconds() > circuit_state["timeout"]):
            circuit_state["state"] = "half-open"
            circuit_state["success_count"] = 0
        
        # Reject requests if circuit is open
        if circuit_state["state"] == "open":
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "error": "Service temporarily unavailable",
                    "message": "Circuit breaker is open. Please try again later.",
                    "retry_after": circuit_state["timeout"]
                },
                headers={
                    "X-Circuit-State": "open",
                    "Retry-After": str(circuit_state["timeout"])
                }
            )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Check if request was successful
            if response.status_code < 500:
                # Reset failure count on success
                if circuit_state["state"] == "half-open":
                    circuit_state["success_count"] += 1
                    if circuit_state["success_count"] >= 3:  # Success threshold
                        circuit_state["state"] = "closed"
                        circuit_state["failures"] = 0
                
                response.headers["X-Circuit-State"] = circuit_state["state"]
            else:
                # Increment failure count
                circuit_state["failures"] += 1
                circuit_state["last_failure"] = current_time
                
                # Open circuit if threshold exceeded
                if circuit_state["failures"] >= 5:
                    circuit_state["state"] = "open"
                
                response.headers["X-Circuit-State"] = circuit_state["state"]
            
            # Update circuit state
            self.circuit_states[endpoint] = circuit_state
            
            return response
            
        except Exception as e:
            # Handle exceptions
            circuit_state["failures"] += 1
            circuit_state["last_failure"] = current_time
            
            # Open circuit if threshold exceeded
            if circuit_state["failures"] >= 5:
                circuit_state["state"] = "open"
            
            # Update circuit state
            self.circuit_states[endpoint] = circuit_state
            
            # Re-raise exception
            raise e

class RateLimitErrorMiddleware(BaseHTTPMiddleware):
    """Enhanced rate limiting with error handling"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.request_counts: Dict[str, Dict[str, Any]] = {}
        self.logger = logging.getLogger("rate_limit")
    
    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch method"""
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Initialize client tracking
        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = {
                "requests": [],
                "blocked_until": None
            }
        
        client_data = self.request_counts[client_ip]
        
        # Check if client is blocked
        if client_data["blocked_until"] and current_time < client_data["blocked_until"]:
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": int(client_data["blocked_until"] - current_time)
                },
                headers={
                    "Retry-After": str(int(client_data["blocked_until"] - current_time)),
                    "X-RateLimit-Limit": "100",
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(client_data["blocked_until"]))
                }
            )
        
        # Clean old requests (older than 1 minute)
        cutoff_time = current_time - 60
        client_data["requests"] = [
            req_time for req_time in client_data["requests"]
            if req_time > cutoff_time
        ]
        
        # Add current request
        client_data["requests"].append(current_time)
        
        # Check rate limit (100 requests per minute)
        if len(client_data["requests"]) > 100:
            # Block client for 5 minutes
            client_data["blocked_until"] = current_time + 300
            
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": 300
                },
                headers={
                    "Retry-After": "300",
                    "X-RateLimit-Limit": "100",
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(current_time + 300))
                }
            )
        
        # Add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = "100"
        response.headers["X-RateLimit-Remaining"] = str(100 - len(client_data["requests"]))
        response.headers["X-RateLimit-Reset"] = str(int(current_time + 60))
        
        return response

class ValidationErrorMiddleware(BaseHTTPMiddleware):
    """Enhanced validation error handling"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = logging.getLogger("validation_error")
    
    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch method"""
        try:
            response = await call_next(request)
            
            # Check for validation errors in response
            if response.status_code == 422:
                try:
                    # Try to extract validation details
                    body = response.body if hasattr(response, 'body') else b""
                    if body:
                        import json
                        error_data = json.loads(body.decode())
                        
                        # Enhance validation error response
                        enhanced_response = {
                            "success": False,
                            "error": "Validation failed",
                            "message": "Please check your input data.",
                            "validation_errors": error_data.get("detail", []),
                            "suggestions": self._get_validation_suggestions(error_data.get("detail", [])),
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
                        
                        return JSONResponse(
                            status_code=422,
                            content=enhanced_response,
                            headers=dict(response.headers)
                        )
                except Exception:
                    pass  # Fall back to original response
            
            return response
            
        except Exception as e:
            # Handle validation-specific errors
            if "validation" in str(e).lower():
                return JSONResponse(
                    status_code=422,
                    content={
                        "success": False,
                        "error": "Validation failed",
                        "message": "Please check your input data.",
                        "suggestions": [
                            "Check all required fields are provided",
                            "Ensure data types are correct",
                            "Validate input format and constraints"
                        ],
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                )
            
            # Re-raise other exceptions
            raise e
    
    def _get_validation_suggestions(self, validation_errors: list) -> list:
        """Get suggestions based on validation errors"""
        suggestions = []
        
        for error in validation_errors:
            if isinstance(error, dict):
                field = error.get("field", "")
                message = error.get("msg", "").lower()
                
                if "required" in message:
                    suggestions.append(f"The '{field}' field is required")
                elif "email" in message:
                    suggestions.append("Please provide a valid email address")
                elif "password" in message:
                    suggestions.append("Password must be at least 8 characters long")
                elif "length" in message:
                    suggestions.append(f"The '{field}' field has invalid length")
                elif "type" in message:
                    suggestions.append(f"The '{field}' field has invalid data type")
        
        # Remove duplicates
        return list(set(suggestions))

# Middleware factory function
def setup_error_middleware(app, enable_detailed_errors: bool = False, enable_circuit_breaker: bool = False):
    """Setup all error handling middleware"""
    app.add_middleware(ErrorMiddleware, enable_detailed_errors=enable_detailed_errors)
    
    # Only add circuit breaker if explicitly enabled (causing performance issues)
    if enable_circuit_breaker:
        app.add_middleware(CircuitBreakerMiddleware)
    
    app.add_middleware(RateLimitErrorMiddleware)
    app.add_middleware(ValidationErrorMiddleware)
    
    # Setup error handlers
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Global exception handler"""
        error_handler = get_error_handler()
        context = extract_error_context(request)
        
        error_detail = await error_handler.handle_error(exc, context)
        return error_handler.create_error_response(error_detail)
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """HTTP exception handler"""
        error_handler = get_error_handler()
        context = extract_error_context(request)
        
        error_detail = ErrorDetail(
            error_id=str(uuid.uuid4()),
            category=ErrorCategory.AUTHENTICATION if exc.status_code == 401 else ErrorCategory.UNKNOWN,
            severity=ErrorSeverity.MEDIUM if exc.status_code < 500 else ErrorSeverity.HIGH,
            code=f"HTTP_{exc.status_code}",
            message=str(exc.detail),
            user_message=str(exc.detail),
            technical_message=str(exc.detail),
            context=context,
            stack_trace=None,
            recovery_actions=[]
        )
        
        await error_handler._log_error(error_detail)
        return error_handler.create_error_response(error_detail)

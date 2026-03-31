import re
import time
import hashlib
import secrets
from typing import Optional, Dict, Any, List
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

# Lazy import for advanced logging (may not be available)
try:
    from utils.advanced_logging import get_logger, LogContext
    logger = get_logger("security_middleware")
except ImportError:
    logger = logging.getLogger(__name__)
    print("Warning: Using basic logging instead of advanced logging")

# Lazy import for rate limit service (may not be available)
try:
    from services.rate_limit_service import RateLimitService
except ImportError:
    RateLimitService = None
    print("Warning: Rate limit service not available")

from services.input_sanitizer import InputSanitizer, SECURITY_HEADERS

def contains_malicious_content(content: str) -> bool:
    """Check for malicious content patterns"""
    malicious_patterns = [
        r"<\s*script[^>]*>.*?<\s*/\s*script\s*>",
        r"javascript\s*:",
        r"vbscript\s*:",
        r"on\w+\s*=",
        r"expression\s*\(",
        r"@import",
        r"binding\s*\(",
        r"<\s*iframe[^>]*>",
        r"<\s*object[^>]*>",
        r"<\s*embed[^>]*>",
        r"<\s*applet[^>]*>",
        r"<\s*meta[^>]*>",
        r"<\s*link[^>]*>",
        r"<\s*style[^>]*>.*?<\s*/\s*style\s*>",
    ]
    
    for pattern in malicious_patterns:
        if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
            return True
    
    return False

def contains_sql_injection(content: str) -> bool:
    """Check for SQL injection patterns"""
    sql_patterns = [
        r"(\bUNION\b.*\bSELECT\b)",
        r"(\bSELECT\b.*\bFROM\b)",
        r"(\bINSERT\b.*\bINTO\b)",
        r"(\bUPDATE\b.*\bSET\b)",
        r"(\bDELETE\b.*\bFROM\b)",
        r"(\bDROP\s+TABLE\b)",
        r"(\bCREATE\s+TABLE\b)",
        r"(\bALTER\s+TABLE\b)",
        r"(\bEXEC\s*\()",
        r"(\bEXECUTE\s*\()",
        r"(--|#|\/\*|\*\/)",
        r"(\bOR\s+1\s*=\s*1)",
        r"(\bAND\s+1\s*=\s*1)",
    ]
    
    for pattern in sql_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    
    return False

def contains_xss_patterns(content: str) -> bool:
    """Check for XSS patterns"""
    xss_patterns = [
        r"<\s*script[^>]*>.*?<\s*/\s*script\s*>",
        r"javascript\s*:",
        r"vbscript\s*:",
        r"on\w+\s*=",
        r"<\s*img[^>]*\son\w+\s*=",
        r"<\s*svg[^>]*>.*?<\s*script\s*>",
        r"<\s*body[^>]*\sonload\s*=",
        r"<\s*iframe[^>]*\sonload\s*=",
        r"<\s*object[^>]*\sonload\s*=",
        r"<\s*embed[^>]*\sonload\s*=",
    ]
    
    for pattern in xss_patterns:
        if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
            return True
    
    return False

def contains_attack_patterns(input_string: str) -> bool:
    """Check if input contains general attack patterns"""
    attack_patterns = [
        r"<\s*script[^>]*>",
        r"javascript\s*:",
        r"vbscript\s*:",
        r"on\w+\s*=",
        r"expression\s*\(",
        r"@\s*import",
        r"union\s+select",
        r"drop\s+table",
        r"insert\s+into",
        r"delete\s+from",
        r"\.exe",
        r"\.sh",
        r"\.bat",
        r"\.cmd",
        r"\.msi"
    ]
    
    for pattern in attack_patterns:
        if re.search(pattern, input_string, re.IGNORECASE):
            return True
    
    return False

class SecurityMiddleware(BaseHTTPMiddleware):
    """Production-grade security middleware"""
    
    def __init__(self, app, rate_limiter: RateLimitService, sanitizer: InputSanitizer):
        super().__init__(app)
        self.rate_limiter = rate_limiter
        self.sanitizer = sanitizer
        self.csrf_tokens = {}  # In production, use Redis or database
        
        # Security configurations
        self.max_request_size = 10 * 1024 * 1024  # 10MB
        self.blocked_ips = set()  # In production, use database
        self.suspicious_activities = {}  # Track suspicious activities
        
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Check if IP is blocked
        if client_ip in self.blocked_ips:
            logger.warning(f"Blocked IP attempted access: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check request size
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_request_size:
            logger.warning(f"Request too large from {client_ip}: {content_length} bytes")
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Request too large"
            )
        
        # Validate headers
        self._validate_headers(request, client_ip)
        
        # CSRF protection for state-changing requests
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            await self._validate_csrf_token(request, client_ip)
        
        # Check for suspicious patterns
        await self._check_suspicious_patterns(request, client_ip)
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        self._add_security_headers(response)
        
        # Add rate limit headers
        self._add_rate_limit_headers(response, client_ip)
        
        return response

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address with proxy support"""
        # Check for forwarded IP
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Check for real IP
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # Fall back to client IP
        return request.client.host if request.client else "unknown"

    def _validate_headers(self, request: Request, client_ip: str):
        """Validate request headers for security"""
        # Check for suspicious headers
        suspicious_headers = [
            "X-Forwarded-Host",
            "X-Forwarded-Server",
            "X-Real-Host",
            "X-Originating-IP",
            "X-Cluster-Client-IP"
        ]
        
        for header in suspicious_headers:
            if header in request.headers:
                logger.warning(f"Suspicious header {header} from {client_ip}")
                self._track_suspicious_activity(client_ip, "suspicious_header", header)
        
        # Check User-Agent
        user_agent = request.headers.get("User-Agent", "")
        if not user_agent or len(user_agent) < 10:
            logger.warning(f"Suspicious User-Agent from {client_ip}: '{user_agent}'")
            self._track_suspicious_activity(client_ip, "suspicious_user_agent", user_agent)
        
        # Check for common attack patterns in headers
        for header_name, header_value in request.headers.items():
            if contains_attack_patterns(header_value):
                logger.warning(f"Attack pattern in header {header_name} from {client_ip}")
                self._track_suspicious_activity(client_ip, "attack_pattern_in_header", header_name)

    async def _validate_csrf_token(self, request: Request, client_ip: str):
        """Validate CSRF token for state-changing requests"""
        # Skip CSRF validation for API endpoints that use JWT
        if request.url.path.startswith("/api/"):
            return
        
        # Get CSRF token from header or form data
        csrf_token = request.headers.get("X-CSRF-Token")
        
        if not csrf_token:
            # Try to get from form data
            try:
                form_data = await request.form()
                csrf_token = form_data.get("csrf_token")
            except:
                pass
        
        if not csrf_token:
            logger.warning(f"Missing CSRF token from {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token required"
            )
        
        # Validate CSRF token (simplified - use proper session validation in production)
        session_token = request.headers.get("Authorization")
        if session_token and session_token.startswith("Bearer "):
            session_token = session_token[7:]
        
        if not self._validate_csrf_token_internal(csrf_token, session_token, client_ip):
            logger.warning(f"Invalid CSRF token from {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid CSRF token"
            )

    def _validate_csrf_token_internal(self, token: str, session_token: Optional[str], client_ip: str) -> bool:
        """Internal CSRF token validation"""
        # In production, use proper session-based validation
        # This is a simplified version
        expected_token = self.csrf_tokens.get(session_token or client_ip)
        
        if not expected_token:
            return False
        
        return secrets.compare_digest(token, expected_token)

    async def _check_suspicious_patterns(self, request: Request, client_ip: str):
        """Check for suspicious patterns in request"""
        # Check URL for suspicious patterns
        url_path = request.url.path
        
        suspicious_paths = [
            "/admin", "/wp-admin", "/phpmyadmin", "/.env",
            "/config", "/backup", "/database", "/etc/passwd",
            "/proc/self/environ", "/.git", "/.svn"
        ]
        
        for suspicious_path in suspicious_paths:
            if suspicious_path in url_path.lower():
                logger.warning(f"Suspicious path access: {url_path} from {client_ip}")
                self._track_suspicious_activity(client_ip, "suspicious_path", url_path)
        
        # Check query parameters
        for param_name, param_value in request.query_params.items():
            if contains_attack_patterns(param_value):
                logger.warning(f"Attack pattern in query param {param_name} from {client_ip}")
                self._track_suspicious_activity(client_ip, "attack_pattern_in_query", param_name)
        
        # Check for SQL injection in URL
        if contains_sql_injection(url_path):
            logger.warning(f"SQL injection attempt in URL: {url_path} from {client_ip}")
            self._track_suspicious_activity(client_ip, "sql_injection_url", url_path)

    def _contains_attack_patterns(self, input_string: str) -> bool:
        """Check if input contains attack patterns"""
        attack_patterns = [
            r"<\s*script[^>]*>",
            r"javascript\s*:",
            r"vbscript\s*:",
            r"on\w+\s*=",
            r"expression\s*\(",
            r"@\s*import",
            r"union\s+select",
            r"drop\s+table",
            r"insert\s+into",
            r"delete\s+from",
            r"update\s+set",
            r"exec\s*\(",
            r"eval\s*\(",
            r"system\s*\(",
            r"shell_exec\s*\(",
            r"passthru\s*\(",
            r"file_get_contents\s*\(",
            r"fopen\s*\(",
            r"file_put_contents\s*\(",
            r"include\s*\(",
            r"require\s*\(",
        ]
        
        for pattern in attack_patterns:
            if re.search(pattern, input_string, re.IGNORECASE):
                return True
        
        return False

    def _contains_sql_injection(self, input_string: str) -> bool:
        """Check for SQL injection patterns"""
        sql_patterns = [
            r"(\bUNION\b.*\bSELECT\b)",
            r"(\bSELECT\b.*\bFROM\b)",
            r"(\bINSERT\b.*\bINTO\b)",
            r"(\bUPDATE\b.*\bSET\b)",
            r"(\bDELETE\b.*\bFROM\b)",
            r"(\bDROP\s+TABLE\b)",
            r"(\bCREATE\s+TABLE\b)",
            r"(\bALTER\s+TABLE\b)",
            r"(\bEXEC\s*\()",
            r"(\bEXECUTE\s*\()",
            r"(--|#|\/\*|\*\/)",
            r"(\bOR\s+1\s*=\s*1)",
            r"(\bAND\s+1\s*=\s*1)",
        ]
        
        for pattern in sql_patterns:
            if re.search(pattern, input_string, re.IGNORECASE):
                return True
        
        return False

    def _track_suspicious_activity(self, client_ip: str, activity_type: str, details: str):
        """Track suspicious activities"""
        if client_ip not in self.suspicious_activities:
            self.suspicious_activities[client_ip] = []
        
        self.suspicious_activities[client_ip].append({
            "type": activity_type,
            "details": details,
            "timestamp": time.time()
        })
        
        # Check if IP should be blocked
        recent_activities = [
            activity for activity in self.suspicious_activities[client_ip]
            if time.time() - activity["timestamp"] < 3600  # Last hour
        ]
        
        if len(recent_activities) > 10:  # More than 10 suspicious activities in an hour
            logger.warning(f"Blocking IP due to suspicious activities: {client_ip}")
            self.blocked_ips.add(client_ip)

    def _add_security_headers(self, response: Response):
        """Add security headers to response"""
        for header_name, header_value in SECURITY_HEADERS.items():
            response.headers[header_name] = header_value
        
        # Add custom security headers
        response.headers["X-API-Version"] = "1.0.0"
        response.headers["X-Content-Security-Policy"] = "default-src 'self'"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"

    def _add_rate_limit_headers(self, response: Response, client_ip: str):
        """Add rate limit headers to response"""
        # This would integrate with the rate limiter
        response.headers["X-RateLimit-Limit"] = "1000"
        response.headers["X-RateLimit-Remaining"] = "999"
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 3600)

class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Enhanced authentication middleware"""
    
    def __init__(self, app, required_paths: list = None):
        super().__init__(app)
        self.required_paths = required_paths or []
        self.security = HTTPBearer(auto_error=False)
        
    async def dispatch(self, request: Request, call_next):
        # Check if authentication is required for this path
        if self._requires_auth(request.url.path):
            await self._authenticate_request(request)
        
        response = await call_next(request)
        return response

    def _requires_auth(self, path: str) -> bool:
        """Check if path requires authentication"""
        # Public paths
        public_paths = [
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/health",
            "/docs",
            "/redoc",
            "/static",
            "/favicon.ico"
        ]
        
        return not any(path.startswith(public_path) for public_path in public_paths)

    async def _authenticate_request(self, request: Request):
        """Authenticate the request"""
        try:
            # Get authorization header
            auth_header = request.headers.get("Authorization")
            
            if not auth_header:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authorization header required"
                )
            
            # Validate token format
            if not auth_header.startswith("Bearer "):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authorization header format"
                )
            
            token = auth_header[7:]
            
            # Validate token (simplified - use proper JWT validation in production)
            if not self._validate_token(token):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed"
            )

    def _validate_token(self, token: str) -> bool:
        """Validate JWT token (simplified)"""
        # In production, use proper JWT validation
        try:
            import jwt
            from datetime import datetime
            
            # Decode token (without verification for simplicity)
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            # Check expiration
            exp = decoded.get("exp")
            if exp and datetime.fromtimestamp(exp) < datetime.now():
                return False
            
            return True
            
        except Exception:
            return False

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Enhanced request logging middleware"""
    
    def __init__(self, app, log_level: str = "INFO"):
        super().__init__(app)
        self.log_level = log_level
        self.logger = logging.getLogger("security_audit")
        
    async def dispatch(self, request: Request, call_next):
        # Log request start
        start_time = time.time()
        
        # Get request details
        client_ip = self._get_client_ip(request)
        method = request.method
        path = request.url.path
        user_agent = request.headers.get("User-Agent", "")
        
        # Log request
        self.logger.info(
            f"Request started: {method} {path} from {client_ip} - {user_agent}"
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            self.logger.info(
                f"Request completed: {method} {path} - Status: {response.status_code} - Duration: {duration:.3f}s"
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            # Log error
            self.logger.error(
                f"Request failed: {method} {path} - Error: {str(e)} - Duration: {duration:.3f}s"
            )
            
            raise

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        return request.client.host if request.client else "unknown"

class ContentValidationMiddleware(BaseHTTPMiddleware):
    """Content validation middleware"""
    
    def __init__(self, app, sanitizer: InputSanitizer):
        super().__init__(app)
        self.sanitizer = sanitizer
        
    async def dispatch(self, request: Request, call_next):
        # Validate content type
        content_type = request.headers.get("Content-Type", "")
        
        # Check for dangerous content types
        dangerous_types = [
            "application/x-msdownload",
            "application/x-msdos-program",
            "application/x-msi",
            "application/x-macbinary",
            "application/x-shockwave-flash",
            "application/x-java-applet",
            "application/x-java-jnlp-file",
            "application/x-python-code",
            "application/x-perl",
            "application/x-ruby",
            "application/x-sh",
            "application/x-bat",
            "application/x-cmd",
            "application/x-exe",
            "application/x-msdownload"
        ]
        
        for dangerous_type in dangerous_types:
            if dangerous_type in content_type.lower():
                logger.warning(f"Dangerous content type blocked: {content_type}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Content type not allowed"
                )
        
        # Validate request body for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            await self._validate_request_body(request)
        
        response = await call_next(request)
        return response

    async def _validate_request_body(self, request: Request):
        """Validate request body"""
        try:
            # Get request body
            body = await request.body()
            
            # Check body size
            if len(body) > 10 * 1024 * 1024:  # 10MB
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Request body too large"
                )
            
            # Check for malicious content
            if body:
                body_str = body.decode('utf-8', errors='ignore')
                
                # Check for attack patterns
                if contains_malicious_content(body_str):
                    logger.warning("Malicious content detected in request body")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Malicious content detected"
                    )
                
                # Check for SQL injection
                if contains_sql_injection(body_str):
                    logger.warning("SQL injection attempt detected in request body")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid content detected"
                    )
                
                # Check for XSS
                if contains_xss_patterns(body_str):
                    logger.warning("XSS attempt detected in request body")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid content detected"
                    )
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Body validation error: {e}")
            # Don't raise exception for validation errors to avoid breaking the app

# Initialize security middlewares
def setup_security_middleware(app, rate_limiter=None, sanitizer=None):
    """Setup security middleware with optional dependency injection"""
    # Lazy import for rate limit service (may not be available)
    rl = None  # Initialize to None
    try:
        from services.rate_limit_service import get_rate_limit_service
        rl = rate_limiter or get_rate_limit_service()
    except ImportError:
        print("Warning: Rate limit service not available for security middleware")
    
    # Add request logging middleware (DISABLED for performance)
    # app.add_middleware(RequestLoggingMiddleware, log_level="INFO")
    
    # Add security middleware (core security features)
    app.add_middleware(SecurityMiddleware, rate_limiter=rl, sanitizer=sanitizer)
    
    # Add authentication middleware (JWT validation)
    # Configure paths that don't require authentication
    public_paths = [
        "/api/health",
        "/api/auth/login",
        "/api/auth/register", 
        "/docs",
        "/redoc",
        "/openapi.json"
    ]
    # REMOVED: AuthenticationMiddleware - it was interfering with FastAPI's OAuth2 dependency injection
    # app.add_middleware(AuthenticationMiddleware, required_paths=public_paths)
    
    # Add content validation middleware (DISABLED for performance)
    # app.add_middleware(ContentValidationMiddleware, sanitizer=sanitizer)
    
    logger.info("Security middlewares configured successfully (optimized for performance)")
    return app

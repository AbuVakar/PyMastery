"""
Security utilities for input validation and sanitization
"""
import re
import html
import bleach
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, validator
import logging

logger = logging.getLogger(__name__)

class SecurityConfig:
    """Security configuration constants"""
    
    # Input validation limits
    MAX_USERNAME_LENGTH = 100
    MAX_EMAIL_LENGTH = 255
    MAX_PASSWORD_LENGTH = 128
    MAX_CODE_LENGTH = 10000
    MAX_TEXT_LENGTH = 5000
    
    # Allowed HTML tags for content sanitization
    ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'i', 'b',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'code', 'pre', 'blockquote'
    ]
    
    ALLOWED_ATTRIBUTES = {
        '*': ['class'],
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
    }
    
    # Rate limiting
    DEFAULT_RATE_LIMIT = 100  # requests per minute
    BURST_RATE_LIMIT = 20    # requests per second
    
    # Security headers
    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    }

class InputSanitizer:
    """Input sanitization and validation utilities"""
    
    @staticmethod
    def sanitize_html(content: str) -> str:
        """Sanitize HTML content to prevent XSS"""
        if not content:
            return ""
        
        try:
            # Use bleach for HTML sanitization
            clean_content = bleach.clean(
                content,
                tags=SecurityConfig.ALLOWED_TAGS,
                attributes=SecurityConfig.ALLOWED_ATTRIBUTES,
                strip=True
            )
            return clean_content
        except Exception as e:
            logger.error(f"HTML sanitization error: {str(e)}")
            return html.escape(content)
    
    @staticmethod
    def sanitize_text(text: str) -> str:
        """Sanitize plain text input"""
        if not text:
            return ""
        
        # Remove potentially dangerous characters
        sanitized = text.strip()
        
        # Limit length
        if len(sanitized) > SecurityConfig.MAX_TEXT_LENGTH:
            sanitized = sanitized[:SecurityConfig.MAX_TEXT_LENGTH]
        
        # Escape HTML entities
        sanitized = html.escape(sanitized)
        
        return sanitized
    
    @staticmethod
    def sanitize_code(code: str) -> str:
        """Sanitize code input"""
        if not code:
            return ""
        
        # Limit code length
        if len(code) > SecurityConfig.MAX_CODE_LENGTH:
            code = code[:SecurityConfig.MAX_CODE_LENGTH]
        
        # Remove potentially dangerous patterns
        dangerous_patterns = [
            r'import\s+os',
            r'import\s+subprocess',
            r'eval\s*\(',
            r'exec\s*\(',
            r'__import__',
            r'open\s*\(',
            r'file\s*\(',
        ]
        
        for pattern in dangerous_patterns:
            code = re.sub(pattern, '# REMOVED', code, flags=re.IGNORECASE)
        
        return code
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        if not email:
            return False
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_pattern, email))
    
    @staticmethod
    def validate_password(password: str) -> Dict[str, Any]:
        """Validate password strength"""
        if not password:
            return {"valid": False, "errors": ["Password is required"]}
        
        errors = []
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters")
        
        if len(password) > SecurityConfig.MAX_PASSWORD_LENGTH:
            errors.append("Password is too long")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one digit")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "strength": len(password) + (1 if re.search(r'[!@#$%^&*(),.?":{}|<>]', password) else 0)
        }
    
    @staticmethod
    def validate_username(username: str) -> Dict[str, Any]:
        """Validate username"""
        if not username:
            return {"valid": False, "errors": ["Username is required"]}
        
        errors = []
        
        if len(username) < 3:
            errors.append("Username must be at least 3 characters")
        
        if len(username) > SecurityConfig.MAX_USERNAME_LENGTH:
            errors.append("Username is too long")
        
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            errors.append("Username can only contain letters, numbers, and underscores")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }

class SecureBaseModel(BaseModel):
    """Base model with security validation"""
    
    @validator('*', pre=True)
    def validate_strings(cls, v):
        """Validate all string fields"""
        if isinstance(v, str):
            # Remove any null bytes
            v = v.replace('\x00', '')
            # Strip whitespace
            v = v.strip()
        return v
    
    @validator('*', pre=True)
    def validate_no_control_chars(cls, v):
        """Remove control characters"""
        if isinstance(v, str):
            v = ''.join(char for char in v if ord(char) >= 32 or char in '\n\r\t')
        return v

class SecureUserInput(SecureBaseModel):
    """Secure user input model"""
    username: str
    email: str
    password: str
    name: str
    
    @validator('username')
    def validate_username_field(cls, v):
        """Validate username field"""
        result = InputSanitizer.validate_username(v)
        if not result['valid']:
            raise ValueError(f"Invalid username: {', '.join(result['errors'])}")
        return InputSanitizer.sanitize_text(v)
    
    @validator('email')
    def validate_email_field(cls, v):
        """Validate email field"""
        if not InputSanitizer.validate_email(v):
            raise ValueError("Invalid email format")
        return v.lower().strip()
    
    @validator('password')
    def validate_password_field(cls, v):
        """Validate password field"""
        result = InputSanitizer.validate_password(v)
        if not result['valid']:
            raise ValueError(f"Invalid password: {', '.join(result['errors'])}")
        return v
    
    @validator('name')
    def validate_name_field(cls, v):
        """Validate name field"""
        if not v or len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return InputSanitizer.sanitize_text(v)

class SecureCodeInput(SecureBaseModel):
    """Secure code input model"""
    code: str
    language: str
    problem_id: str
    
    @validator('code')
    def validate_code_field(cls, v):
        """Validate code field"""
        return InputSanitizer.sanitize_code(v)
    
    @validator('language')
    def validate_language_field(cls, v):
        """Validate language field"""
        allowed_languages = ['python', 'javascript', 'java', 'cpp', 'c']
        if v.lower() not in allowed_languages:
            raise ValueError(f"Language must be one of: {', '.join(allowed_languages)}")
        return v.lower()
    
    @validator('problem_id')
    def validate_problem_id_field(cls, v):
        """Validate problem ID"""
        if not v or not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("Invalid problem ID format")
        return v

# Security middleware functions
def get_security_headers() -> Dict[str, str]:
    """Get security headers for responses"""
    return SecurityConfig.SECURITY_HEADERS

def is_safe_redirect(url: str) -> bool:
    """Check if redirect URL is safe"""
    if not url:
        return False
    
    # Allow only relative URLs or same origin
    if url.startswith('/') or url.startswith('#'):
        return True
    
    # Check for dangerous protocols
    dangerous_protocols = ['javascript:', 'data:', 'vbscript:']
    for protocol in dangerous_protocols:
        if protocol in url.lower():
            return False
    
    return True

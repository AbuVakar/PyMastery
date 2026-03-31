import re
import html
import json
import bleach
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, field_validator
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

class InputSanitizer:
    """Advanced input sanitization and validation service"""
    
    def __init__(self):
        # HTML sanitization configuration
        self.html_allowed_tags = {
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'em', 'u', 'i', 'b',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
            'a', 'img', 'div', 'span'
        }
        
        self.html_allowed_attributes = {
            'a': ['href', 'title', 'target'],
            'img': ['src', 'alt', 'title', 'width', 'height'],
            'div': ['class'],
            'span': ['class'],
            '*': ['id']
        }
        
        # SQL injection patterns
        self.sql_injection_patterns = [
            r"(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)",
            r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
            r"(\b(OR|AND)\s+['\"]\w+['\"]\s*=\s*['\"]\w+['\"])",
            r"(--|#|\/\*|\*\/)",
            r"(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR)\b)",
            r"(\b(WAITFOR|DELAY)\b\s+\b(TIME|DELAY)\b)",
        ]
        
        # XSS patterns
        self.xss_patterns = [
            r"<\s*script[^>]*>.*?<\s*/\s*script\s*>",
            r"javascript\s*:",
            r"vbscript\s*:",
            r"on\w+\s*=",
            r"<\s*iframe[^>]*>",
            r"<\s*object[^>]*>",
            r"<\s*embed[^>]*>",
            r"<\s*link[^>]*>",
            r"<\s*meta[^>]*>",
            r"<\s*style[^>]*>.*?<\s*/\s*style\s*>",
        ]
        
        # File upload restrictions
        self.allowed_file_extensions = {
            'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
            'document': ['.pdf', '.doc', '.docx', '.txt', '.md'],
            'code': ['.py', '.js', '.ts', '.html', '.css', '.json', '.xml', '.yaml', '.yml'],
            'data': ['.csv', '.xlsx', '.json']
        }
        
        self.max_file_sizes = {
            'image': 5 * 1024 * 1024,  # 5MB
            'document': 10 * 1024 * 1024,  # 10MB
            'code': 1 * 1024 * 1024,  # 1MB
            'data': 5 * 1024 * 1024,  # 5MB
        }

    def sanitize_string(self, input_string: str, max_length: int = 1000) -> str:
        """Sanitize a string input"""
        if not isinstance(input_string, str):
            raise ValueError("Input must be a string")
        
        # Remove null bytes
        sanitized = input_string.replace('\x00', '')
        
        # Remove control characters except newlines and tabs
        sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', sanitized)
        
        # Trim whitespace
        sanitized = sanitized.strip()
        
        # Enforce maximum length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        return sanitized

    def sanitize_html(self, html_content: str) -> str:
        """Sanitize HTML content to prevent XSS"""
        if not isinstance(html_content, str):
            raise ValueError("HTML content must be a string")
        
        # Use bleach for HTML sanitization
        sanitized = bleach.clean(
            html_content,
            tags=self.html_allowed_tags,
            attributes=self.html_allowed_attributes,
            strip=True,
            strip_comments=True
        )
        
        return sanitized

    def sanitize_sql_input(self, input_string: str) -> str:
        """Sanitize input to prevent SQL injection"""
        if not isinstance(input_string, str):
            raise ValueError("Input must be a string")
        
        # Check for SQL injection patterns
        for pattern in self.sql_injection_patterns:
            if re.search(pattern, input_string, re.IGNORECASE):
                logger.warning(f"Potential SQL injection detected: {input_string}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid input detected"
                )
        
        # Escape special characters
        sanitized = input_string.replace("'", "''").replace('"', '""')
        
        return sanitized

    def sanitize_xss_input(self, input_string: str) -> str:
        """Sanitize input to prevent XSS attacks"""
        if not isinstance(input_string, str):
            raise ValueError("Input must be a string")
        
        # Check for XSS patterns
        for pattern in self.xss_patterns:
            if re.search(pattern, input_string, re.IGNORECASE | re.DOTALL):
                logger.warning(f"Potential XSS detected: {input_string}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid input detected"
                )
        
        # HTML encode the input
        sanitized = html.escape(input_string)
        
        return sanitized

    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent directory traversal"""
        if not isinstance(filename, str):
            raise ValueError("Filename must be a string")
        
        # Remove path separators and dangerous characters
        sanitized = re.sub(r'[\\/:"*?<>|]', '', filename)
        
        # Remove control characters
        sanitized = re.sub(r'[\x00-\x1f\x7f]', '', sanitized)
        
        # Remove leading dots and spaces
        sanitized = sanitized.lstrip('. ')
        
        # Ensure filename is not empty
        if not sanitized:
            raise ValueError("Invalid filename")
        
        # Limit filename length
        if len(sanitized) > 255:
            sanitized = sanitized[:255]
        
        return sanitized

    def validate_file_upload(
        self,
        filename: str,
        content_type: str,
        file_size: int,
        file_category: str = 'image'
    ) -> bool:
        """Validate file upload for security"""
        try:
            # Sanitize filename
            sanitized_filename = self.sanitize_filename(filename)
            
            # Check file extension
            allowed_extensions = self.allowed_file_extensions.get(file_category, [])
            file_extension = '.' + sanitized_filename.split('.')[-1].lower()
            
            if file_extension not in allowed_extensions:
                logger.warning(f"Invalid file extension: {file_extension}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type {file_extension} not allowed"
                )
            
            # Check file size
            max_size = self.max_file_sizes.get(file_category, 5 * 1024 * 1024)
            if file_size > max_size:
                logger.warning(f"File too large: {file_size} bytes")
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File size exceeds limit of {max_size} bytes"
                )
            
            # Validate content type
            allowed_content_types = {
                'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
                'document': ['application/pdf', 'text/plain', 'text/markdown'],
                'code': ['text/plain', 'application/json', 'text/xml'],
                'data': ['text/csv', 'application/json']
            }
            
            allowed_types = allowed_content_types.get(file_category, [])
            if content_type not in allowed_types:
                logger.warning(f"Invalid content type: {content_type}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Content type {content_type} not allowed"
                )
            
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"File validation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File validation failed"
            )

    def sanitize_json(self, json_input: Union[str, Dict, List]) -> Dict:
        """Sanitize JSON input"""
        try:
            if isinstance(json_input, str):
                # Parse JSON string
                parsed = json.loads(json_input)
            else:
                parsed = json_input
            
            if not isinstance(parsed, (dict, list)):
                raise ValueError("JSON must be an object or array")
            
            # Recursively sanitize all string values
            def sanitize_recursive(obj):
                if isinstance(obj, dict):
                    return {k: sanitize_recursive(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [sanitize_recursive(item) for item in obj]
                elif isinstance(obj, str):
                    return self.sanitize_string(obj)
                else:
                    return obj
            
            sanitized = sanitize_recursive(parsed)
            
            return sanitized
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON format"
            )
        except Exception as e:
            logger.error(f"JSON sanitization error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="JSON sanitization failed"
            )

    def validate_email(self, email: str) -> str:
        """Validate and sanitize email address"""
        if not isinstance(email, str):
            raise ValueError("Email must be a string")
        
        # Basic email format validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )
        
        # Sanitize email
        sanitized = self.sanitize_string(email.lower(), 254)
        
        return sanitized

    def validate_phone(self, phone: str) -> str:
        """Validate and sanitize phone number"""
        if not isinstance(phone, str):
            raise ValueError("Phone must be a string")
        
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', phone)
        
        # Check length (10-15 digits for international numbers)
        if not 10 <= len(digits_only) <= 15:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format"
            )
        
        return digits_only

    def validate_url(self, url: str) -> str:
        """Validate and sanitize URL"""
        if not isinstance(url, str):
            raise ValueError("URL must be a string")
        
        # Basic URL validation
        url_pattern = r'^https?://(?:[-\w.])+(?:\:[0-9]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:\w*))?)?$'
        if not re.match(url_pattern, url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid URL format"
            )
        
        # Sanitize URL
        sanitized = self.sanitize_string(url, 2048)
        
        return sanitized

    def validate_password_strength(self, password: str) -> bool:
        """Validate password strength"""
        if not isinstance(password, str):
            raise ValueError("Password must be a string")
        
        # Check minimum length
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        # Check for at least one uppercase letter
        if not re.search(r'[A-Z]', password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one uppercase letter"
            )
        
        # Check for at least one lowercase letter
        if not re.search(r'[a-z]', password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one lowercase letter"
            )
        
        # Check for at least one digit
        if not re.search(r'\d', password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one digit"
            )
        
        # Check for at least one special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one special character"
            )
        
        # Check for common weak passwords
        weak_passwords = [
            'password', '123456', 'password123', 'admin', 'qwerty',
            'letmein', 'welcome', 'monkey', 'dragon', 'master'
        ]
        
        if password.lower() in weak_passwords:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is too common. Please choose a stronger password"
            )
        
        return True

# Sanitized Pydantic models
class SanitizedBaseModel(BaseModel):
    """Base model with input sanitization"""
    
    @field_validator("*", mode="before")
    @classmethod
    def sanitize_strings(cls, value):
        if isinstance(value, str):
            sanitizer = InputSanitizer()
            return sanitizer.sanitize_string(value)
        return value

class SanitizedUserCreate(SanitizedBaseModel):
    email: str
    name: str
    password: str
    
    @field_validator("email")
    @classmethod
    def validate_email_field(cls, value: str):
        sanitizer = InputSanitizer()
        return sanitizer.validate_email(value)
    
    @field_validator("password")
    @classmethod
    def validate_password_field(cls, value: str):
        sanitizer = InputSanitizer()
        sanitizer.validate_password_strength(value)
        return value

class SanitizedContent(SanitizedBaseModel):
    title: str
    content: str
    
    @field_validator("content")
    @classmethod
    def sanitize_content_field(cls, value: str):
        sanitizer = InputSanitizer()
        return sanitizer.sanitize_html(value)

class SanitizedSearchQuery(SanitizedBaseModel):
    query: str
    
    @field_validator("query")
    @classmethod
    def sanitize_search_query(cls, value: str):
        sanitizer = InputSanitizer()
        return sanitizer.sanitize_xss_input(value)

class SanitizedComment(SanitizedBaseModel):
    content: str
    
    @field_validator("content")
    @classmethod
    def sanitize_comment_content(cls, value: str):
        sanitizer = InputSanitizer()
        # Allow basic HTML in comments
        return sanitizer.sanitize_html(value)

# Global sanitizer instance
_input_sanitizer = None

def get_input_sanitizer():
    """Get or create global input sanitizer instance"""
    global _input_sanitizer
    if _input_sanitizer is None:
        _input_sanitizer = InputSanitizer()
    return _input_sanitizer

# For backward compatibility
sanitizer = get_input_sanitizer()

# Decorator for input sanitization
def sanitize_input(fields: List[str] = None):
    """Decorator for automatic input sanitization"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            s = get_input_sanitizer()
            if fields:
                for field in fields:
                    if field in kwargs:
                        value = kwargs[field]
                        if isinstance(value, str):
                            kwargs[field] = s.sanitize_string(value)
                        elif isinstance(value, dict):
                            kwargs[field] = s.sanitize_json(value)
                        elif isinstance(value, list):
                            kwargs[field] = [
                                s.sanitize_string(item) if isinstance(item, str) else item
                                for item in value
                            ]
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Middleware for automatic input sanitization
class InputSanitizationMiddleware:
    """Middleware for automatic request sanitization"""
    
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # This would be implemented as FastAPI middleware
        # For now, we'll use the decorator approach
        return await self.app(scope, receive, send)

# Security utilities
def generate_csrf_token() -> str:
    """Generate CSRF token"""
    import secrets
    return secrets.token_urlsafe(32)

def validate_csrf_token(token: str, session_token: str) -> bool:
    """Validate CSRF token"""
    return secrets.compare_digest(token, session_token)

def encrypt_sensitive_data(data: str) -> str:
    """Encrypt sensitive data"""
    # This would use proper encryption in production
    import base64
    return base64.b64encode(data.encode()).decode()

def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    # This would use proper decryption in production
    import base64
    return base64.b64decode(encrypted_data.encode()).decode()

# Input validation utilities
def validate_uuid(uuid_string: str) -> bool:
    """Validate UUID format"""
    import uuid
    try:
        uuid.UUID(uuid_string)
        return True
    except ValueError:
        return False

def validate_mongodb_id(id_string: str) -> bool:
    """Validate MongoDB ObjectId format"""
    import re
    pattern = r'^[0-9a-fA-F]{24}$'
    return bool(re.match(pattern, id_string))

# Security headers
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}

# Initialize logging
logger.info("Input sanitization service initialized")

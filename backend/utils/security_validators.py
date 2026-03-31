import re
import secrets
import hashlib
import hmac
import time
from typing import Dict, List, Optional, Union, Any
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

class SecurityValidator:
    """Comprehensive security validation utilities"""
    
    def __init__(self):
        # SQL injection patterns
        self.sql_patterns = [
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
            r"(\bWAITFOR\s+DELAY\b)",
            r"(\bSLEEP\s*\()",
            r"(\bBENCHMARK\s*\()",
            r"(\bLOAD_FILE\s*\()",
            r"(\bINTO\s+OUTFILE\b)",
            r"(\bLOAD\s+DATA\s+INFILE\b)"
        ]
        
        # XSS patterns
        self.xss_patterns = [
            r"<\s*script[^>]*>.*?<\s*/\s*script\s*>",
            r"javascript\s*:",
            r"vbscript\s*:",
            r"on\w+\s*=",
            r"expression\s*\(",
            r"@\s*import",
            r"<\s*iframe[^>]*>",
            r"<\s*object[^>]*>",
            r"<\s*embed[^>]*>",
            r"<\s*applet[^>]*>",
            r"<\s*meta[^>]*>",
            r"<\s*link[^>]*>",
            r"<\s*style[^>]*>.*?<\s*/\s*style\s*>",
            r"<\s*img[^>]*\son\w+\s*=",
            r"<\s*svg[^>]*>.*?<\s*script\s*>",
            r"<\s*body[^>]*\sonload\s*=",
            r"<\s*frameset[^>]*\sonload\s*=",
            r"<\s*frame[^>]*\sonload\s*="
        ]
        
        # Path traversal patterns
        self.path_traversal_patterns = [
            r"\.\.[\\/]",
            r"\.\.[\\/]",
            r"\.\.[\\/]",
            r"[\\/]\.\.[\\/]",
            r"[\\/]\.\.[\\/]",
            r"[\\/]\.\.[\\/]",
            r"%2e%2e%2f",
            r"%2e%2e\\",
            r"..\\..\\",
            r"..\\\\",
            r"\.\.\/",
            r"\.\.\\",
            r"%2e%2e",
            r"\.\.%2f",
            r"\.\.%5c"
        ]
        
        # Command injection patterns
        self.command_patterns = [
            r";\s*(rm|del|format|fdisk|mkfs|dd)",
            r"&&\s*(rm|del|format|fdisk|mkfs|dd)",
            r"\|\s*(rm|del|format|fdisk|mkfs|dd)",
            r"`[^`]*`",
            r"\$[^$]*",
            r"\${[^}]*}",
            r"<\?[^>]*>",
            r"<%![^>]*>",
            r"eval\s*\(",
            r"exec\s*\(",
            r"system\s*\(",
            r"shell_exec\s*\(",
            r"passthru\s*\(",
            r"popen\s*\(",
            r"proc_open\s*\("
        ]
        
        # LDAP injection patterns
        self.ldap_patterns = [
            r"\*\)\s*\(",
            r"\*\)\)\s*\(",
            r"\|\s*\(",
            r"&\s*\(",
            r"!\s*\(",
            r"=\s*\(",
            r"=\s*\*\)",
            r"=\s*\)\)",
            r"=\s*\)\)\s*\(",
            r"\(\s*\(",
            r"\(\s*\(.*\)\s*\)\s*\)"
        ]
        
        # NoSQL injection patterns
        self.nosql_patterns = [
            r"\$where",
            r"\$ne",
            r"\$gt",
            r"\$lt",
            r"\$gte",
            r"\$lte",
            r"\$in",
            r"\$nin",
            r"\$exists",
            r"\$regex",
            r"\$expr",
            r"\json",
            r"\bson",
            r"\$or",
            r"\$and",
            r"\$not"
        ]
        
        # File upload threats
        self.file_threats = [
            r"\.php",
            r"\.phtml",
            r"\.php3",
            r"\.php4",
            r"\.php5",
            r"\.asp",
            r"\.aspx",
            r"\.jsp",
            r"\.jspx",
            r"\.cgi",
            r"\.pl",
            r"\.py",
            r"\.rb",
            r"\.sh",
            r"\.bat",
            r"\.cmd",
            r"\.exe",
            r"\.msi",
            r"\.deb",
            r"\.rpm",
            r"\.dmg",
            r"\.app",
            r"\.scr",
            r"\.lnk",
            r"\.jar",
            r"\.war",
            r"\.ear"
        ]

    def validate_sql_injection(self, input_string: str) -> bool:
        """Check for SQL injection patterns"""
        if not isinstance(input_string, str):
            return False
        
        input_upper = input_string.upper()
        
        for pattern in self.sql_patterns:
            if re.search(pattern, input_upper, re.IGNORECASE):
                logger.warning(f"SQL injection pattern detected: {pattern[:50]}")
                return True
        
        return False

    def validate_xss(self, input_string: str) -> bool:
        """Check for XSS patterns"""
        if not isinstance(input_string, str):
            return False
        
        for pattern in self.xss_patterns:
            if re.search(pattern, input_string, re.IGNORECASE | re.DOTALL):
                logger.warning(f"XSS pattern detected: {pattern[:50]}")
                return True
        
        return False

    def validate_path_traversal(self, input_string: str) -> bool:
        """Check for path traversal patterns"""
        if not isinstance(input_string, str):
            return False
        
        # Decode URL encoded characters
        try:
            import urllib.parse
            decoded = urllib.parse.unquote(input_string)
        except:
            decoded = input_string
        
        for pattern in self.path_traversal_patterns:
            if re.search(pattern, decoded, re.IGNORECASE):
                logger.warning(f"Path traversal pattern detected: {pattern[:50]}")
                return True
        
        return False

    def validate_command_injection(self, input_string: str) -> bool:
        """Check for command injection patterns"""
        if not isinstance(input_string, str):
            return False
        
        for pattern in self.command_patterns:
            if re.search(pattern, input_string, re.IGNORECASE):
                logger.warning(f"Command injection pattern detected: {pattern[:50]}")
                return True
        
        return False

    def validate_ldap_injection(self, input_string: str) -> bool:
        """Check for LDAP injection patterns"""
        if not isinstance(input_string, str):
            return False
        
        for pattern in self.ldap_patterns:
            if re.search(pattern, input_string, re.IGNORECASE):
                logger.warning(f"LDAP injection pattern detected: {pattern[:50]}")
                return True
        
        return False

    def validate_nosql_injection(self, input_string: str) -> bool:
        """Check for NoSQL injection patterns"""
        if not isinstance(input_string, str):
            return False
        
        for pattern in self.nosql_patterns:
            if re.search(pattern, input_string, re.IGNORECASE):
                logger.warning(f"NoSQL injection pattern detected: {pattern[:50]}")
                return True
        
        return False

    def validate_file_upload(self, filename: str, content: bytes = None) -> List[str]:
        """Validate file upload for security threats"""
        threats = []
        
        if not isinstance(filename, str):
            threats.append("Invalid filename type")
            return threats
        
        # Check filename for threats
        for pattern in self.file_threats:
            if re.search(pattern, filename, re.IGNORECASE):
                threats.append(f"Threatening file extension detected: {pattern}")
        
        # Check for double extensions
        if re.search(r"\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+$", filename):
            threats.append("Double extension detected")
        
        # Check for executable files
        if re.search(r"\.(exe|bat|cmd|scr|com|pif|vbs|js|jar|app)$", filename, re.IGNORECASE):
            threats.append("Executable file detected")
        
        # Check content if provided
        if content:
            # Check for magic bytes
            magic_bytes = {
                b'\x4D\x5A': 'EXE',
                b'\x50\x4B\x03\x04': 'ZIP',
                b'\x50\x4B\x05\x06': 'ZIP',
                b'\x7F\x45\x4C\x46': 'ELF',
                b'\xFE\xED\xFE\xED': 'JAVA',
                b'\xCA\xFE\xBA\xBE': 'JAVA',
                b'\xD0\xCF\x11\xE0': 'OLE',
                b'\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1': 'OLE',
            }
            
            file_signature = content[:min(len(content), 4)]
            if file_signature in magic_bytes:
                threats.append(f"Executable file signature detected: {magic_bytes[file_signature]}")
            
            # Check for script content
            try:
                content_str = content.decode('utf-8', errors='ignore')
                if any(script in content_str.lower() for script in ['<script', '<?php', '<%']):
                    threats.append("Script content detected in file")
            except:
                pass
        
        return threats

    def validate_url(self, url: str) -> List[str]:
        """Validate URL for security threats"""
        threats = []
        
        if not isinstance(url, str):
            threats.append("Invalid URL type")
            return threats
        
        try:
            parsed = urlparse(url)
            
            # Check protocol
            if parsed.scheme not in ['http', 'https']:
                threats.append(f"Invalid protocol: {parsed.scheme}")
            
            # Check for dangerous characters
            if any(char in url for char in ['<', '>', '"', "'", '&', '\n', '\r']):
                threats.append("Dangerous characters in URL")
            
            # Check for JavaScript protocols
            if parsed.scheme in ['javascript', 'vbscript', 'data', 'file']:
                threats.append(f"Dangerous protocol: {parsed.scheme}")
            
            # Check for path traversal
            if self.validate_path_traversal(url):
                threats.append("Path traversal detected")
            
            # Check for XSS
            if self.validate_xss(url):
                threats.append("XSS detected in URL")
            
        except Exception as e:
            threats.append(f"URL parsing error: {str(e)}")
        
        return threats

    def validate_email(self, email: str) -> List[str]:
        """Validate email for security threats"""
        threats = []
        
        if not isinstance(email, str):
            threats.append("Invalid email type")
            return threats
        
        # Basic email format validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            threats.append("Invalid email format")
        
        # Check for suspicious domains
        suspicious_domains = [
            'tempmail.org', '10minutemail.com', 'guerrillamail.com',
            'mailinator.com', 'yopmail.com', 'maildrop.cc'
        ]
        
        domain = email.split('@')[-1].lower()
        if domain in suspicious_domains:
            threats.append("Suspicious email domain")
        
        # Check for SQL injection
        if self.validate_sql_injection(email):
            threats.append("SQL injection detected")
        
        return threats

    def validate_phone(self, phone: str) -> List[str]:
        """Validate phone number for security threats"""
        threats = []
        
        if not isinstance(phone, str):
            threats.append("Invalid phone type")
            return threats
        
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', phone)
        
        # Check length
        if not 10 <= len(digits_only) <= 15:
            threats.append("Invalid phone number length")
        
        # Check for suspicious patterns
        if len(set(digits_only)) < 3:  # Too many repeated digits
            threats.append("Suspicious phone number pattern")
        
        return threats

    def sanitize_html(self, html_content: str, allowed_tags: List[str] = None) -> str:
        """Sanitize HTML content"""
        if not isinstance(html_content, str):
            return ""
        
        if allowed_tags is None:
            allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'ul', 'ol', 'li']
        
        # Simple HTML sanitization
        # In production, use a proper library like bleach
        sanitized = html_content
        
        # Remove dangerous tags
        dangerous_tags = ['script', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'textarea']
        for tag in dangerous_tags:
            sanitized = re.sub(f'<\s*{tag}[^>]*>.*?<\s*/\s*{tag}\s*>', '', sanitized, re.IGNORECASE | re.DOTALL)
            sanitized = re.sub(f'<\s*{tag}[^>]*/>', '', sanitized, re.IGNORECASE)
        
        # Remove dangerous attributes
        dangerous_attrs = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur']
        for attr in dangerous_attrs:
            sanitized = re.sub(f'{attr}\s*=\s*["\'][^"\']*["\']', '', sanitized, re.IGNORECASE)
        
        return sanitized

    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure token"""
        return secrets.token_urlsafe(length)

    def hash_token(self, token: str, salt: str = None) -> str:
        """Hash token with optional salt"""
        if salt is None:
            salt = self.generate_secure_token(16)
        
        return hashlib.pbkdf2_hmac(
            'sha256',
            token.encode(),
            salt.encode(),
            100000
        ).hex()

    def verify_token(self, token: str, hashed_token: str, salt: str = None) -> bool:
        """Verify token against hash"""
        return hmac.compare_digest(
            self.hash_token(token, salt),
            hashed_token
        )

    def encrypt_sensitive_data(self, data: str, key: str = None) -> str:
        """Encrypt sensitive data (simplified)"""
        if key is None:
            key = secrets.token_bytes(32)
        
        # In production, use proper encryption like AES
        # This is a placeholder implementation
        import base64
        return base64.b64encode(data.encode()).decode()

    def decrypt_sensitive_data(self, encrypted_data: str, key: str = None) -> str:
        """Decrypt sensitive data (simplified)"""
        if key is None:
            key = secrets.token_bytes(32)
        
        # In production, use proper decryption
        # This is a placeholder implementation
        import base64
        return base64.b64decode(encrypted_data.encode()).decode()

    def validate_api_key(self, api_key: str) -> bool:
        """Validate API key format"""
        if not isinstance(api_key, str):
            return False
        
        # Check length
        if len(api_key) < 20 or len(api_key) > 100:
            return False
        
        # Check for allowed characters
        if not re.match(r'^[a-zA-Z0-9_-]+$', api_key):
            return False
        
        return True

    def check_rate_limit_key(self, key: str, max_length: int = 255) -> bool:
        """Check if rate limit key is valid"""
        if not isinstance(key, str):
            return False
        
        if len(key) > max_length:
            return False
        
        # Check for dangerous characters
        if re.search(r'[<>"\'&\n\r]', key):
            return False
        
        return True

    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe storage"""
        if not isinstance(filename, str):
            return "unknown"
        
        # Remove path separators
        sanitized = re.sub(r'[\\/:"*?<>|]', '', filename)
        
        # Remove control characters
        sanitized = re.sub(r'[\x00-\x1f\x7f]', '', sanitized)
        
        # Remove leading dots and spaces
        sanitized = sanitized.lstrip('. ')
        
        # Limit length
        if len(sanitized) > 255:
            sanitized = sanitized[:255]
        
        # Ensure filename is not empty
        if not sanitized:
            sanitized = "file"
        
        return sanitized

    def validate_json(self, json_string: str) -> List[str]:
        """Validate JSON for security threats"""
        threats = []
        
        if not isinstance(json_string, str):
            threats.append("Invalid JSON type")
            return threats
        
        try:
            import json
            parsed = json.loads(json_string)
            
            # Check for deeply nested objects
            max_depth = 10
            def check_depth(obj, current_depth=0):
                if current_depth > max_depth:
                    threats.append(f"JSON depth exceeds limit: {current_depth}")
                    return
                
                if isinstance(obj, dict):
                    for value in obj.values():
                        check_depth(value, current_depth + 1)
                elif isinstance(obj, list):
                    for item in obj:
                        check_depth(item, current_depth + 1)
            
            check_depth(parsed)
            
            # Check for suspicious keys
            def check_keys(obj, path=""):
                if isinstance(obj, dict):
                    for key in obj.keys():
                        if isinstance(key, str):
                            # Check for dangerous keys
                            if any(pattern in key.lower() for pattern in ['__proto__', 'constructor', 'prototype']):
                                threats.append(f"Dangerous key detected: {path}.{key}")
                            
                            # Check for injection patterns
                            if self.validate_sql_injection(key) or self.validate_xss(key):
                                threats.append(f"Injection in key: {path}.{key}")
                        
                        # Recursively check nested objects
                        check_keys(obj[key], f"{path}.{key}" if path else key)
                elif isinstance(obj, list):
                    for i, item in enumerate(obj):
                        check_keys(item, f"{path}[{i}]" if path else f"[{i}]")
            
            check_keys(parsed)
            
        except json.JSONDecodeError as e:
            threats.append(f"Invalid JSON: {str(e)}")
        except Exception as e:
            threats.append(f"JSON validation error: {str(e)}")
        
        return threats

    def log_security_event(self, event_type: str, details: Dict[str, Any]):
        """Log security event"""
        event_data = {
            "event_type": event_type,
            "timestamp": time.time(),
            "details": details
        }
        
        logger.warning(f"Security event: {event_type} - {details}")
        
        # In production, store in security events table
        # await store_security_event(event_data)

# Global validator instance
validator = SecurityValidator()

# Decorator for input validation
def validate_input(validation_type: str, *args, **kwargs):
    """Decorator for input validation"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Get input from function arguments
            # This would need to be customized based on the function signature
            
            # Example validation
            if validation_type == "sql":
                for arg in args:
                    if isinstance(arg, str) and validator.validate_sql_injection(arg):
                        raise ValueError("SQL injection detected")
            
            elif validation_type == "xss":
                for arg in args:
                    if isinstance(arg, str) and validator.validate_xss(arg):
                        raise ValueError("XSS detected")
            
            elif validation_type == "path_traversal":
                for arg in args:
                    if isinstance(arg, str) and validator.validate_path_traversal(arg):
                        raise ValueError("Path traversal detected")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Security utilities
def generate_csrf_token() -> str:
    """Generate CSRF token"""
    return validator.generate_secure_token()

def validate_csrf_token(token: str, expected_token: str) -> bool:
    """Validate CSRF token"""
    return validator.verify_token(token, expected_token)

def create_hmac_signature(data: str, secret_key: str) -> str:
    """Create HMAC signature"""
    return hmac.new(
        secret_key.encode(),
        data.encode(),
        hashlib.sha256
    ).hexdigest()

def verify_hmac_signature(data: str, signature: str, secret_key: str) -> bool:
    """Verify HMAC signature"""
    expected_signature = create_hmac_signature(data, secret_key)
    return hmac.compare_digest(signature, expected_signature)

def mask_sensitive_data(data: str, mask_char: str = "*", visible_chars: int = 4) -> str:
    """Mask sensitive data"""
    if not data or len(data) <= visible_chars:
        return mask_char * len(data) if data else ""
    
    return data[:visible_chars] + mask_char * (len(data) - visible_chars)

def check_password_strength(password: str) -> Dict[str, Any]:
    """Check password strength"""
    strength = {
        "score": 0,
        "issues": [],
        "suggestions": []
    }
    
    # Length
    if len(password) >= 8:
        strength["score"] += 20
    else:
        strength["issues"].append("Password should be at least 8 characters")
        strength["suggestions"].append("Use a longer password")
    
    # Uppercase
    if any(c.isupper() for c in password):
        strength["score"] += 20
    else:
        strength["issues"].append("Password should contain uppercase letters")
        strength["suggestions"].append("Add uppercase letters")
    
    # Lowercase
    if any(c.islower() for c in password):
        strength["score"] += 20
    else:
        strength["issues"].append("Password should contain lowercase letters")
        strength["suggestions"].append("Add lowercase letters")
    
    # Digits
    if any(c.isdigit() for c in password):
        strength["score"] += 20
    else:
        strength["issues"].append("Password should contain digits")
        strength["suggestions"].append("Add numbers")
    
    # Special characters
    if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        strength["score"] += 20
    else:
        strength["issues"].append("Password should contain special characters")
        strength["suggestions"].append("Add special characters")
    
    # Common passwords
    common_passwords = [
        "password", "123456", "password123", "admin", "qwerty",
        "letmein", "welcome", "monkey", "dragon", "master"
    ]
    
    if password.lower() in common_passwords:
        strength["score"] = 0
        strength["issues"].append("Password is too common")
        strength["suggestions"].append("Choose a more unique password")
    
    return strength

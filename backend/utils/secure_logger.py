"""
Secure Logging Utility
Prevents sensitive data exposure in logs
"""

import logging
import json
import re
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from functools import wraps
from contextvars import ContextVar
import hashlib
import uuid

# Context variable for request tracking
request_id: ContextVar[Optional[str]] = ContextVar('request_id', default=None)

class SecureLogger:
    """Secure logging with PII protection and structured output"""
    
    def __init__(self, name: str, config: Dict[str, Any] = None):
        self.config = config or {}
        self.logger = logging.getLogger(name)
        self.pii_patterns = {
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b'),
            'ssn': re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
            'credit_card': re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b'),
            'api_key': re.compile(r'\b[A-Za-z0-9]{20,}\b'),
            'password': re.compile(r'["\']?password["\']?\s*[:=]\s*["\']?([^"\'\s]{8,})["\']?', re.IGNORECASE),
            'token': re.compile(r'["\']?(?:token|access_token|refresh_token)["\']?\s*[:=]\s*["\']?([A-Za-z0-9._-]{20,})["\']?', re.IGNORECASE)
        }
        
        # Sensitive fields to mask
        self.sensitive_fields = {
            'password', 'passwd', 'secret', 'key', 'token', 'auth',
            'credential', 'private', 'confidential', 'ssn', 'social_security',
            'credit_card', 'card_number', 'cvv', 'expiry', 'bank_account',
            'routing_number', 'pin', 'access_code', 'security_answer'
        }
        
        # Configuration
        self.mask_pii = self.config.get("mask_pii", True)
        self.include_request_id = self.config.get("include_request_id", True)
        self.log_level = self.config.get("log_level", "INFO")
        self.max_log_size = self.config.get("max_log_size", 10000)  # characters
        
        # Setup logger
        self._setup_logger()
    
    def _setup_logger(self):
        """Setup logger with secure formatting"""
        self.logger.setLevel(getattr(logging, self.log_level.upper()))
        
        # Create secure formatter
        formatter = SecureFormatter(
            mask_pii=self.mask_pii,
            include_request_id=self.include_request_id,
            max_size=self.max_log_size
        )
        
        # Add handler if not exists
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
    
    def sanitize_log_data(self, data: Any) -> Any:
        """Sanitize data for logging"""
        if isinstance(data, dict):
            return self._sanitize_dict(data)
        elif isinstance(data, list):
            return [self.sanitize_log_data(item) for item in data]
        elif isinstance(data, str):
            return self._sanitize_string(data)
        else:
            return data
    
    def _sanitize_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize dictionary for logging"""
        sanitized = {}
        
        for key, value in data.items():
            if self._is_sensitive_field(key):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [self.sanitize_log_data(item) for item in value]
            elif isinstance(value, str):
                sanitized[key] = self._sanitize_string(value)
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _sanitize_string(self, text: str) -> str:
        """Sanitize string for logging"""
        if not self.mask_pii:
            return text
        
        sanitized = text
        
        # Mask PII patterns
        for pattern_name, pattern in self.pii_patterns.items():
            def mask_match(match):
                original = match.group(0)
                if pattern_name in ['email', 'phone', 'credit_card']:
                    return original[:3] + "***" + original[-3:] if len(original) > 6 else "***"
                else:
                    return "***"
            
            sanitized = pattern.sub(mask_match, sanitized)
        
        return sanitized
    
    def _is_sensitive_field(self, field_name: str) -> bool:
        """Check if field name indicates sensitive data"""
        field_lower = field_name.lower()
        return any(sensitive in field_lower for sensitive in self.sensitive_fields)
    
    def log_with_context(self, level: str, message: str, extra_fields: Dict[str, Any] = None, **kwargs):
        """Log with additional context and sanitization"""
        # Get current request ID
        current_request_id = request_id.get()
        
        # Prepare log data
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": message,
            "level": level.upper(),
        }
        
        if current_request_id:
            log_data["request_id"] = current_request_id
        
        if extra_fields:
            sanitized_fields = self.sanitize_log_data(extra_fields)
            log_data.update(sanitized_fields)
        
        # Add any additional kwargs
        for key, value in kwargs.items():
            if key not in log_data:
                log_data[key] = self.sanitize_log_data(value)
        
        # Log the message
        getattr(self.logger, level.lower())(json.dumps(log_data))
    
    def debug(self, message: str, **kwargs):
        """Debug level logging"""
        self.log_with_context("debug", message, **kwargs)
    
    def info(self, message: str, **kwargs):
        """Info level logging"""
        self.log_with_context("info", message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Warning level logging"""
        self.log_with_context("warning", message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Error level logging"""
        self.log_with_context("error", message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        """Critical level logging"""
        self.log_with_context("critical", message, **kwargs)

class SecureFormatter(logging.Formatter):
    """Secure log formatter with PII protection"""
    
    def __init__(self, mask_pii: bool = True, include_request_id: bool = True, max_size: int = 10000):
        super().__init__()
        self.mask_pii = mask_pii
        self.include_request_id = include_request_id
        self.max_size = max_size
        self.pii_patterns = {
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b'),
            'ssn': re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
            'credit_card': re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b'),
            'api_key': re.compile(r'\b[A-Za-z0-9]{20,}\b'),
            'password': re.compile(r'["\']?password["\']?\s*[:=]\s*["\']?([^"\'\s]{8,})["\']?', re.IGNORECASE),
            'token': re.compile(r'["\']?(?:token|access_token|refresh_token)["\']?\s*[:=]\s*["\']?([A-Za-z0-9._-]{20,})["\']?', re.IGNORECASE)
        }
    
    def format(self, record):
        """Format log record with security"""
        # Get the original message
        message = record.getMessage()
        
        # Sanitize message if PII masking is enabled
        if self.mask_pii:
            message = self._mask_pii(message)
        
        # Truncate if too long
        if len(message) > self.max_size:
            message = message[:self.max_size] + "... [TRUNCATED]"
        
        # Create structured log entry
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": message,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add request ID if available
        if self.include_request_id and hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry, default=str)
    
    def _mask_pii(self, text: str) -> str:
        """Mask PII in text"""
        masked = text
        
        for pattern_name, pattern in self.pii_patterns.items():
            def mask_match(match):
                original = match.group(0)
                if pattern_name in ['email', 'phone', 'credit_card']:
                    return original[:3] + "***" + original[-3:] if len(original) > 6 else "***"
                else:
                    return "***"
            
            masked = pattern.sub(mask_match, masked)
        
        return masked

def with_secure_logging(func):
    """Decorator to add secure logging to functions"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Generate unique request ID
        current_request_id = str(uuid.uuid4())[:8]
        request_id.set(current_request_id)
        
        # Get logger for the function
        logger_name = f"{func.__module__}.{func.__name__}"
        logger = SecureLogger(logger_name)
        
        try:
            logger.info(f"Starting {func.__name__}", function=func.__name__)
            result = await func(*args, **kwargs)
            logger.info(f"Completed {func.__name__}", function=func.__name__)
            return result
        except Exception as e:
            logger.error(f"Error in {func.__name__}", 
                        function=func.__name__, 
                        error=str(e), 
                        error_type=type(e).__name__)
            raise
    
    return wrapper

def get_secure_logger(name: str, config: Dict[str, Any] = None) -> SecureLogger:
    """Get a secure logger instance"""
    return SecureLogger(name, config)

# Audit logging for security events
class SecurityAuditLogger:
    """Specialized logger for security audit events"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.logger = SecureLogger("security_audit", config)
        self.audit_log_file = self.config.get("audit_log_file", "logs/security_audit.log")
        
        # Setup file handler for audit logs
        self._setup_audit_handler()
    
    def _setup_audit_handler(self):
        """Setup dedicated audit log handler"""
        try:
            handler = logging.FileHandler(self.audit_log_file)
            formatter = SecureFormatter(mask_pii=True, include_request_id=True)
            handler.setFormatter(formatter)
            self.logger.logger.addHandler(handler)
        except Exception as e:
            self.logger.logger.error(f"Failed to setup audit handler: {e}")
    
    def log_authentication_event(self, event_type: str, user_id: str, success: bool, 
                              ip_address: str, user_agent: str, details: Dict[str, Any] = None):
        """Log authentication events"""
        self.logger.log_with_context(
            "info" if success else "warning",
            f"Authentication {event_type}: {'SUCCESS' if success else 'FAILED'}",
            event_type=event_type,
            user_id=user_id,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {},
            category="authentication"
        )
    
    def log_authorization_event(self, resource: str, action: str, user_id: str, 
                               success: bool, ip_address: str, details: Dict[str, Any] = None):
        """Log authorization events"""
        self.logger.log_with_context(
            "info" if success else "warning",
            f"Authorization {action} on {resource}: {'GRANTED' if success else 'DENIED'}",
            resource=resource,
            action=action,
            user_id=user_id,
            success=success,
            ip_address=ip_address,
            details=details or {},
            category="authorization"
        )
    
    def log_data_access_event(self, resource: str, user_id: str, action: str, 
                            ip_address: str, data_type: str = None, details: Dict[str, Any] = None):
        """Log data access events"""
        self.logger.log_with_context(
            "info",
            f"Data access: {action} on {resource}",
            resource=resource,
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            data_type=data_type,
            details=details or {},
            category="data_access"
        )
    
    def log_security_violation(self, violation_type: str, severity: str, user_id: str = None,
                             ip_address: str = None, details: Dict[str, Any] = None):
        """Log security violations"""
        self.logger.log_with_context(
            "warning" if severity == "low" else "error",
            f"Security violation: {violation_type}",
            violation_type=violation_type,
            severity=severity,
            user_id=user_id,
            ip_address=ip_address,
            details=details or {},
            category="security_violation"
        )

# Global audit logger instance
audit_logger = SecurityAuditLogger()

# Export for use in other modules
__all__ = [
    'SecureLogger',
    'SecurityAuditLogger',
    'with_secure_logging',
    'get_secure_logger',
    'audit_logger',
    'request_id'
]

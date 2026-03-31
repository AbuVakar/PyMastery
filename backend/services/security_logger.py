"""
Security Logger Service
Handles security event logging and monitoring
"""

import os
import json
import logging
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from enum import Enum
import re

# Configure security logger
security_logger = logging.getLogger("security")


def utc_now() -> datetime:
    """Return current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


def ensure_utc(value: datetime) -> datetime:
    """Normalize possibly naive datetimes to UTC-aware."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

class SecurityEventType(Enum):
    """Security event types"""
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    TOKEN_BLACKLISTED = "token_blacklisted"
    PASSWORD_CHANGED = "password_changed"
    PASSWORD_RESET_REQUEST = "password_reset_request"
    PASSWORD_RESET_SUCCESS = "password_reset_success"
    EMAIL_VERIFICATION = "email_verification"
    ACCOUNT_LOCKED = "account_locked"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    TOKEN_REFRESH = "token_refresh"
    REGISTER_SUCCESS = "register_success"
    REGISTER_FAILED = "register_failed"

class SecurityLogger:
    """Service for logging security events"""
    
    def __init__(self):
        self.log_file_path = os.getenv("SECURITY_LOG_PATH", "logs/security.log")
        self.max_log_size = 10 * 1024 * 1024  # 10MB
        self.sensitive_patterns = [
            r'password["\s]*[:=]["\s]*["\s]*[^"\s]+',
            r'token["\s]*[:=]["\s]*["\s]*[^"\s]+',
            r'secret["\s]*[:=]["\s]*["\s]*[^"\s]+',
            r'key["\s]*[:=]["\s]*["\s]*[^"\s]+',
            r'Bearer\s+[A-Za-z0-9\-._~+/]+=*',
        ]
        
        # Ensure log directory exists
        self._ensure_log_directory()
    
    def _ensure_log_directory(self):
        """Ensure log directory exists"""
        try:
            log_dir = os.path.dirname(self.log_file_path)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir, exist_ok=True)
        except Exception as e:
            security_logger.error(f"Failed to create log directory: {e}")
    
    def _sanitize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize sensitive data from logs"""
        try:
            data_str = json.dumps(data)
            
            # Remove sensitive information
            for pattern in self.sensitive_patterns:
                data_str = re.sub(pattern, lambda m: m.group().split('=')[0] + '=***', data_str, flags=re.IGNORECASE)
            
            # Remove IP addresses for privacy (optional, based on requirements)
            # data_str = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', '***.***.***.***', data_str)
            
            return json.loads(data_str)
            
        except Exception as e:
            security_logger.error(f"Failed to sanitize data: {e}")
            return {"sanitization_error": True}
    
    def _hash_identifier(self, identifier: str) -> str:
        """Hash identifier for privacy"""
        return hashlib.sha256(identifier.encode()).hexdigest()[:16]
    
    def log_security_event(self, event_type: SecurityEventType, details: Dict[str, Any], severity: str = "INFO"):
        """Log a security event"""
        try:
            timestamp = utc_now().isoformat()
            
            # Create log entry
            log_entry = {
                "timestamp": timestamp,
                "event_type": event_type.value,
                "severity": severity,
                "details": self._sanitize_data(details)
            }
            
            # Add structured logging
            log_message = f"[{severity}] {event_type.value}: {json.dumps(log_entry, separators=(',', ':'))}"
            
            # Log to security logger
            if severity.upper() == "CRITICAL":
                security_logger.critical(log_message)
            elif severity.upper() == "ERROR":
                security_logger.error(log_message)
            elif severity.upper() == "WARNING":
                security_logger.warning(log_message)
            elif severity.upper() == "INFO":
                security_logger.info(log_message)
            else:
                security_logger.debug(log_message)
            
            # Also log to file if configured
            if self.log_file_path:
                self._write_to_file(log_entry)
            
            # Check for suspicious patterns
            self._check_suspicious_patterns(event_type, details)
            
        except Exception as e:
            security_logger.error(f"Failed to log security event: {e}")
    
    def _write_to_file(self, log_entry: Dict[str, Any]):
        """Write log entry to file"""
        try:
            # Check file size and rotate if needed
            if os.path.exists(self.log_file_path):
                file_size = os.path.getsize(self.log_file_path)
                if file_size > self.max_log_size:
                    self._rotate_log_file()
            
            # Write to file
            with open(self.log_file_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry, separators=(',', ':')) + '\n')
                f.flush()
                
        except Exception as e:
            security_logger.error(f"Failed to write to security log file: {e}")
    
    def _rotate_log_file(self):
        """Rotate log file when it gets too large"""
        try:
            timestamp = utc_now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"{self.log_file_path}.{timestamp}"
            os.rename(self.log_file_path, backup_path)
            security_logger.info(f"Security log rotated to {backup_path}")
        except Exception as e:
            security_logger.error(f"Failed to rotate log file: {e}")
    
    def _check_suspicious_patterns(self, event_type: SecurityEventType, details: Dict[str, Any]):
        """Check for suspicious activity patterns"""
        try:
            # Check for multiple failed logins
            if event_type == SecurityEventType.LOGIN_FAILED:
                self._check_failed_login_pattern(details)
            
            # Check for rate limit violations
            elif event_type == SecurityEventType.RATE_LIMIT_EXCEEDED:
                self._check_rate_limit_pattern(details)
            
            # Check for suspicious token activity
            elif event_type == SecurityEventType.TOKEN_BLACKLISTED:
                self._check_token_pattern(details)
                
        except Exception as e:
            security_logger.error(f"Failed to check suspicious patterns: {e}")
    
    def _check_failed_login_pattern(self, details: Dict[str, Any]):
        """Check for failed login patterns"""
        try:
            # This could be enhanced with more sophisticated pattern detection
            # For now, just log the event
            pass
        except Exception as e:
            security_logger.error(f"Failed to check failed login pattern: {e}")
    
    def _check_rate_limit_pattern(self, details: Dict[str, Any]):
        """Check for rate limit violation patterns"""
        try:
            # Log rate limit violations for monitoring
            pass
        except Exception as e:
            security_logger.error(f"Failed to check rate limit pattern: {e}")
    
    def _check_token_pattern(self, details: Dict[str, Any]):
        """Check for suspicious token patterns"""
        try:
            # Log token blacklisting events
            pass
        except Exception as e:
            security_logger.error(f"Failed to check token pattern: {e}")
    
    def get_security_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get security statistics for the last N hours"""
        try:
            if not os.path.exists(self.log_file_path):
                return {"error": "No security log file found"}
            
            cutoff_time = utc_now() - timedelta(hours=hours)
            stats = {
                "period_hours": hours,
                "total_events": 0,
                "events_by_type": {},
                "events_by_severity": {},
                "unique_users": set(),
                "suspicious_events": 0
            }
            
            with open(self.log_file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        log_entry = json.loads(line.strip())
                        event_time = ensure_utc(datetime.fromisoformat(log_entry['timestamp']))
                        
                        if event_time >= cutoff_time:
                            stats["total_events"] += 1
                            
                            # Count by type
                            event_type = log_entry.get("event_type", "unknown")
                            stats["events_by_type"][event_type] = stats["events_by_type"].get(event_type, 0) + 1
                            
                            # Count by severity
                            severity = log_entry.get("severity", "INFO")
                            stats["events_by_severity"][severity] = stats["events_by_severity"].get(severity, 0) + 1
                            
                            # Track unique users (if available)
                            details = log_entry.get("details", {})
                            if "user_id" in details:
                                stats["unique_users"].add(details["user_id"])
                            
                            # Count suspicious events
                            if severity in ["WARNING", "ERROR", "CRITICAL"]:
                                stats["suspicious_events"] += 1
                                
                    except (json.JSONDecodeError, ValueError, KeyError) as e:
                        continue  # Skip malformed lines
            
            # Convert set to count
            stats["unique_users"] = len(stats["unique_users"])
            
            return stats
            
        except Exception as e:
            security_logger.error(f"Failed to get security stats: {e}")
            return {"error": str(e)}
    
    def get_recent_security_events(self, limit: int = 50, severity: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get recent security events"""
        try:
            if not os.path.exists(self.log_file_path):
                return []
            
            events = []
            with open(self.log_file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
                # Read from the end (most recent first)
                for line in reversed(lines[-limit*2:]):  # Read more lines in case we need to filter
                    try:
                        log_entry = json.loads(line.strip())
                        
                        # Filter by severity if specified
                        if severity and log_entry.get("severity") != severity:
                            continue
                        
                        events.append(log_entry)
                        
                        if len(events) >= limit:
                            break
                            
                    except (json.JSONDecodeError, ValueError, KeyError):
                        continue  # Skip malformed lines
            
            return events
            
        except Exception as e:
            security_logger.error(f"Failed to get recent security events: {e}")
            return []

# Global instance
_security_logger = None

def get_security_logger() -> SecurityLogger:
    """Get singleton security logger instance"""
    global _security_logger
    if _security_logger is None:
        _security_logger = SecurityLogger()
    return _security_logger

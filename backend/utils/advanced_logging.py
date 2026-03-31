"""
Advanced Logging System for PyMastery
Structured logging with context, performance metrics, and security features
"""

import logging
import json
import sys
import os
import time
import uuid
import asyncio
import threading
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, asdict
from enum import Enum
from contextlib import contextmanager, asynccontextmanager
from logging.handlers import RotatingFileHandler, SysLogHandler
import traceback


class LogLevel(Enum):
    """Log levels for the advanced logging system"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class LogContext:
    """Context information for log entries"""
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    parent_span_id: Optional[str] = None
    environment: str = "development"
    service: str = "pymastery"
    version: str = "2.0.0"


@dataclass
class PerformanceMetrics:
    """Performance metrics for logging"""
    duration_ms: Optional[float] = None
    response_size_bytes: Optional[int] = None
    request_count: Optional[int] = None
    memory_usage_mb: Optional[float] = None
    cpu_usage_percent: Optional[float] = None


@dataclass
class ErrorInfo:
    """Error information for structured logging"""
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    stack_trace: Optional[str] = None
    error_context: Optional[Dict[str, Any]] = None


class AdvancedLogger:
    """Advanced logger with structured output and context management"""
    
    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        self.name = name
        self.config = config or {}
        self.logger = logging.getLogger(name)
        self.context = LogContext()
        
        # Performance tracking
        self.performance_metrics = {}
        self.start_time = time.time()
        
        # Thread-safe context
        self._context_lock = threading.Lock()
        
        # Setup logger
        self._setup_logger()
    
    def _setup_logger(self):
        """Setup logger with handlers and formatters"""
        # Clear existing handlers
        self.logger.handlers.clear()
        
        # Set log level
        log_level = getattr(logging, self.config.get("level", "INFO"))
        self.logger.setLevel(log_level)
        
        # Create formatter
        formatter = self._create_formatter()
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # File handler (if configured)
        log_file = self.config.get("file")
        if log_file:
            # Create logs directory if it doesn't exist
            os.makedirs(os.path.dirname(log_file), exist_ok=True)
            
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=self.config.get("max_file_size", 50 * 1024 * 1024),  # 50MB
                backupCount=self.config.get("backup_count", 10),
                encoding='utf-8'
            )
            file_handler.setLevel(log_level)
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
        
        # Error file handler (if configured)
        error_log_file = self.config.get("error_file")
        if error_log_file:
            os.makedirs(os.path.dirname(error_log_file), exist_ok=True)
            
            error_handler = RotatingFileHandler(
                error_log_file,
                maxBytes=self.config.get("max_file_size", 50 * 1024 * 1024),
                backupCount=self.config.get("backup_count", 10),
                encoding='utf-8'
            )
            error_handler.setLevel(logging.ERROR)
            error_handler.setFormatter(formatter)
            self.logger.addHandler(error_handler)
    
    def _create_formatter(self) -> logging.Formatter:
        """Create structured JSON formatter"""
        class StructuredFormatter(logging.Formatter):
            def format(self, record):
                # Base log entry
                log_entry = {
                    "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
                    "level": record.levelname,
                    "logger": record.name,
                    "message": record.getMessage(),
                    "module": record.module,
                    "function": record.funcName,
                    "line": record.lineno,
                    "thread": record.thread,
                    "process": record.process
                }
                
                # Add context
                if hasattr(record, 'context'):
                    log_entry["context"] = record.context
                
                # Add performance metrics
                if hasattr(record, 'performance_metrics'):
                    log_entry["performance"] = record.performance_metrics
                
                # Add error info
                if hasattr(record, 'error_info'):
                    log_entry["error"] = record.error_info
                
                # Add extra fields
                if hasattr(record, 'extra_fields'):
                    log_entry.update(record.extra_fields)
                
                return json.dumps(log_entry, default=str, ensure_ascii=False)
        
        return StructuredFormatter()
    
    def set_context(self, **kwargs):
        """Set context information"""
        with self._context_lock:
            for key, value in kwargs.items():
                if hasattr(self.context, key):
                    setattr(self.context, key, value)
    
    def update_context(self, context: LogContext):
        """Update entire context"""
        with self._context_lock:
            self.context = context
    
    @contextmanager
    def performance_timer(self, operation: str, **kwargs):
        """Context manager for timing operations"""
        start_time = time.time()
        
        try:
            yield
        finally:
            duration_ms = (time.time() - start_time) * 1000
            metrics = PerformanceMetrics(duration_ms=duration_ms)
            self.log_performance(operation, metrics, **kwargs)
    
    @asynccontextmanager
    async def async_performance_timer(self, operation: str, **kwargs):
        """Async context manager for timing operations"""
        start_time = time.time()
        
        try:
            yield
        finally:
            duration_ms = (time.time() - start_time) * 1000
            metrics = PerformanceMetrics(duration_ms=duration_ms)
            self.log_performance(operation, metrics, **kwargs)
    
    def _log(self, level: LogLevel, message: str, **kwargs):
        """Internal logging method with context"""
        # Prepare log record
        extra = {
            "context": asdict(self.context),
            "extra_fields": kwargs
        }
        
        # Add performance metrics if provided
        if "performance_metrics" in kwargs:
            extra["performance_metrics"] = asdict(kwargs["performance_metrics"])
        
        # Add error info if provided
        if "error_info" in kwargs:
            extra["error_info"] = asdict(kwargs["error_info"])
        
        # Log the message
        log_method = getattr(self.logger, level.value.lower())
        log_method(message, extra=extra)
    
    def debug(self, message: str, **kwargs):
        """Log debug message"""
        self._log(LogLevel.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs):
        """Log info message"""
        self._log(LogLevel.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message"""
        self._log(LogLevel.WARNING, message, **kwargs)
    
    def error(self, message: str, error: Optional[Exception] = None, **kwargs):
        """Log error message"""
        if error:
            error_info = ErrorInfo(
                error_type=type(error).__name__,
                error_message=str(error),
                stack_trace=traceback.format_exc(),
                error_context=kwargs.get("error_context", {})
            )
            kwargs["error_info"] = error_info
        
        self._log(LogLevel.ERROR, message, **kwargs)
    
    def critical(self, message: str, error: Optional[Exception] = None, **kwargs):
        """Log critical message"""
        if error:
            error_info = ErrorInfo(
                error_type=type(error).__name__,
                error_message=str(error),
                stack_trace=traceback.format_exc(),
                error_context=kwargs.get("error_context", {})
            )
            kwargs["error_info"] = error_info
        
        self._log(LogLevel.CRITICAL, message, **kwargs)
    
    def log_performance(self, operation: str, metrics: PerformanceMetrics, **kwargs):
        """Log performance metrics"""
        self.info(f"Performance: {operation}",
                 performance_metrics=asdict(metrics),
                 **kwargs)
    
    def log_api_request(self, method: str, path: str, status_code: int,
                      response_time_ms: float, **kwargs):
        """Log API request"""
        metrics = PerformanceMetrics(
            duration_ms=response_time_ms,
            request_count=1
        )
        
        self.info(f"API {method} {path} {status_code}",
                 performance_metrics=asdict(metrics),
                 extra_fields={
                     'api_method': method,
                     'api_path': path,
                     'api_status_code': status_code
                 },
                 **kwargs)
    
    def log_security_event(self, event_type: str, severity: str = "INFO",
                         details: Optional[Dict[str, Any]] = None, **kwargs):
        """Log security event"""
        self.info(f"Security Event: {event_type}",
                 extra_fields={
                     'security_event_type': event_type,
                     'security_severity': severity,
                     'security_details': details or {}
                 },
                 **kwargs)
    
    def log_business_event(self, event_type: str, user_id: Optional[str] = None,
                         details: Optional[Dict[str, Any]] = None, **kwargs):
        """Log business event"""
        if user_id:
            self.set_context(user_id=user_id)
        
        self.info(f"Business Event: {event_type}",
                 extra_fields={
                     'business_event_type': event_type,
                     'business_user_id': user_id,
                     'business_details': details or {}
                 },
                 **kwargs)


# Global logger registry
_loggers: Dict[str, AdvancedLogger] = {}
_logger_config: Optional[Dict[str, Any]] = None


def setup_logging(config: Optional[Dict[str, Any]] = None):
    """Setup global logging configuration"""
    global _logger_config
    _logger_config = config or {}


def get_logger(name: str, config: Optional[Dict[str, Any]] = None) -> AdvancedLogger:
    """Get or create a logger with the specified name"""
    if name not in _loggers:
        logger_config = config or _logger_config or {}
        _loggers[name] = AdvancedLogger(name, logger_config)
    
    return _loggers[name]


def set_request_context(request_id: str = None, user_id: str = None,
                     ip_address: str = None, user_agent: str = None):
    """Set request context for all loggers"""
    context = {
        'request_id': request_id,
        'user_id': user_id,
        'ip_address': ip_address,
        'user_agent': user_agent
    }
    
    for logger in _loggers.values():
        logger.set_context(**context)


def set_trace_context(trace_id: str = None, span_id: str = None,
                   parent_span_id: str = None):
    """Set trace context for all loggers"""
    context = {
        'trace_id': trace_id,
        'span_id': span_id,
        'parent_span_id': parent_span_id
    }
    
    for logger in _loggers.values():
        logger.set_context(**context)


# Convenience functions
def log_performance(operation: str, duration_ms: float, **kwargs):
    """Log performance operation"""
    metrics = PerformanceMetrics(duration_ms=duration_ms)
    logger = get_logger("performance")
    logger.log_performance(operation, metrics, **kwargs)


def log_api_request(method: str, path: str, status_code: int,
                   response_time_ms: float, **kwargs):
    """Log API request"""
    logger = get_logger("api")
    logger.log_api_request(method, path, status_code, response_time_ms, **kwargs)


def log_security_event(event_type: str, severity: str = "INFO",
                     details: Optional[Dict[str, Any]] = None, **kwargs):
    """Log security event"""
    logger = get_logger("security")
    logger.log_security_event(event_type, severity, details, **kwargs)


def log_business_event(event_type: str, user_id: Optional[str] = None,
                     details: Optional[Dict[str, Any]] = None, **kwargs):
    """Log business event"""
    logger = get_logger("business")
    logger.log_business_event(event_type, user_id, details, **kwargs)

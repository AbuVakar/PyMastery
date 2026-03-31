"""
Centralized Monitoring Service
Integrates logging and monitoring for the entire application
"""

import os
import asyncio
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import traceback
import uuid
from contextlib import asynccontextmanager, contextmanager

from utils.advanced_logging import get_logger, LogContext, PerformanceMetrics, ErrorInfo
from utils.advanced_monitoring import (
    create_monitoring_system, timer_metric, async_timer_metric,
    MetricType, AlertSeverity, HealthCheck, Alert
)

class MonitoringService:
    """Centralized monitoring service"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Initialize logging
        self.logger = get_logger("monitoring", self.config.get("logging", {}))
        
        # Initialize monitoring
        self.monitoring = create_monitoring_system(self.config.get("monitoring", {}))
        
        # Service state
        self.is_running = False
        self.start_time = None
        
        # Request tracking
        self.active_requests: Dict[str, Dict[str, Any]] = {}
        
        # Performance tracking
        self.performance_data: Dict[str, List[PerformanceMetrics]] = {}
        
        # Error tracking
        self.error_counts: Dict[str, int] = {}
        self.recent_errors: List[Dict[str, Any]] = []
        
        # Business metrics
        self.business_metrics: Dict[str, Any] = {}
        
        # Setup default health checks
        self._setup_application_health_checks()
        
        # Setup default alerts
        self._setup_application_alerts()
    
    def _setup_application_health_checks(self):
        """Setup application-specific health checks"""
        # API health check
        async def check_api_health():
            try:
                # Check if API is responsive
                return len(self.active_requests) < 1000  # Less than 1000 active requests
            except:
                return False
        
        self.monitoring.health_checker.add_health_check(HealthCheck(
            name="api_health",
            description="API health check",
            check_function=check_api_health,
            interval_seconds=60,
            timeout_seconds=10
        ))
        
        # Error rate health check
        async def check_error_rate():
            recent_errors = [
                e for e in self.recent_errors 
                if e["timestamp"] > datetime.now(timezone.utc) - timedelta(minutes=5)
            ]
            total_requests = len(self.active_requests)
            
            if total_requests == 0:
                return True
            
            error_rate = len(recent_errors) / max(total_requests, 1)
            return error_rate < 0.05  # Less than 5% error rate
        
        self.monitoring.health_checker.add_health_check(HealthCheck(
            name="error_rate",
            description="Error rate health check",
            check_function=check_error_rate,
            interval_seconds=60,
            timeout_seconds=5
        ))
    
    def _setup_application_alerts(self):
        """Setup application-specific alerts"""
        # High error rate alert
        self.monitoring.alert_manager.add_alert(Alert(
            id="high_error_rate",
            name="High Error Rate",
            description="API error rate exceeded 5%",
            severity=AlertSeverity.ERROR,
            condition="gt",
            threshold=5.0,
            metric_name="error_rate_percent"
        ))
        
        # High latency alert
        self.monitoring.alert_manager.add_alert(Alert(
            id="high_latency",
            name="High Latency",
            description="API average latency exceeded 1s",
            severity=AlertSeverity.WARNING,
            condition="gt",
            threshold=1000.0,
            metric_name="api_response_time_ms"
        ))
        
        # High memory usage alert
        self.monitoring.alert_manager.add_alert(Alert(
            id="high_memory_usage",
            name="High Memory Usage",
            description="System memory usage exceeded 90%",
            severity=AlertSeverity.WARNING,
            condition="gt",
            threshold=90.0,
            metric_name="system.memory_percent"
        ))
    
    async def start(self):
        """Start monitoring service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Start monitoring system
        self.monitoring.start()
        
        self.logger.info("Monitoring service started",
                        service="monitoring",
                        start_time=self.start_time.isoformat()
                        )
        
        # Start periodic tasks
        asyncio.create_task(self._periodic_metrics_update())
        asyncio.create_task(self._periodic_health_check())
    
    async def stop(self):
        """Stop monitoring service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Stop monitoring system
        self.monitoring.stop()
        
        self.logger.info("Monitoring service stopped",
                        service="monitoring",
                        uptime_seconds=(datetime.now(timezone.utc) - self.start_time).total_seconds()
                        )
    
    def set_request_context(self, request_id: str = None, user_id: str = None,
                         ip_address: str = None, user_agent: str = None):
        """Set request context for logging"""
        self.logger.set_request_context(request_id, user_id, ip_address, user_agent)
    
    def set_trace_context(self, trace_id: str = None, span_id: str = None,
                       parent_span_id: str = None):
        """Set distributed tracing context"""
        self.logger.set_trace_context(trace_id, span_id, parent_span_id)
    
    def start_request_tracking(self, request_id: str, method: str, path: str,
                           user_id: str = None, ip_address: str = None,
                           user_agent: str = None) -> str:
        """Start tracking a request"""
        trace_id = str(uuid.uuid4())
        span_id = str(uuid.uuid4())
        
        request_data = {
            "request_id": request_id,
            "trace_id": trace_id,
            "span_id": span_id,
            "method": method,
            "path": path,
            "user_id": user_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "start_time": datetime.now(timezone.utc),
            "status": "active"
        }
        
        self.active_requests[request_id] = request_data
        
        # Set context for logging
        self.set_request_context(request_id, user_id, ip_address, user_agent)
        self.set_trace_context(trace_id, span_id)
        
        # Log request start
        self.logger.info("Request tracking started",
                        request_id=request_id,
                        method=method,
                        path=path,
                        user_id=user_id,
                        ip_address=ip_address
                        )
        
        # Increment request counter
        self.monitoring.metrics_collector.increment_counter(
            "requests.total", 1,
            tags={"method": method, "path": path}
        )
        
        return trace_id
    
    def end_request_tracking(self, request_id: str, status_code: int,
                         response_size: int = None, error: Exception = None):
        """End tracking a request"""
        if request_id not in self.active_requests:
            return
        
        request_data = self.active_requests[request_id]
        end_time = datetime.now(timezone.utc)
        duration_ms = (end_time - request_data["start_time"]).total_seconds() * 1000
        
        # Update request data
        request_data.update({
            "end_time": end_time,
            "duration_ms": duration_ms,
            "status_code": status_code,
            "response_size": response_size,
            "status": "completed"
        })
        
        # Log request completion
        if error:
            # End request tracking with error
            self.logger.error(f"Request failed: {request_id}",
                               error=error,
                               status_code=status_code,
                               duration_ms=duration_ms
                               )
            
            # Track error
            self._track_error(error, request_data)
        else:
            self.logger.info("Request tracking ended",
                            request_id=request_id,
                            status_code=status_code,
                            duration_ms=duration_ms,
                            response_size=response_size
                            )
        
        # Record performance metrics
        self.monitoring.metrics_collector.record_timer(
            "api_response_time_ms", duration_ms,
            tags={
                "method": request_data["method"],
                "path": request_data["path"],
                "status_code": str(status_code)
            }
        )
        
        # Record response size
        if response_size:
            self.monitoring.metrics_collector.record_histogram(
                "api_response_size_bytes", response_size,
                tags={
                    "method": request_data["method"],
                    "path": request_data["path"]
                }
            )
        
        # Update error rate metric
        error_rate = self._calculate_error_rate()
        self.monitoring.metrics_collector.set_gauge("error_rate_percent", error_rate * 100)
        
        # Remove from active requests
        del self.active_requests[request_id]
        
        # Update active requests gauge
        self.monitoring.metrics_collector.set_gauge("active_requests", len(self.active_requests))
    
    def _track_error(self, error: Exception, request_data: Dict[str, Any] = None):
        """Track error occurrence"""
        error_type = type(error).__name__
        error_message = str(error)
        
        # Increment error counter
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
        
        # Add to recent errors
        error_data = {
            "error_type": error_type,
            "error_message": error_message,
            "stack_trace": traceback.format_exc(),
            "timestamp": datetime.now(timezone.utc),
            "request_data": request_data
        }
        
        self.recent_errors.append(error_data)
        
        # Limit recent errors
        if len(self.recent_errors) > 1000:
            self.recent_errors = self.recent_errors[-1000:]
        
        # Log error metrics
        self.monitoring.metrics_collector.increment_counter(
            "errors.total", 1,
            tags={"error_type": error_type}
        )
        
        # Log security event if it's a security-related error
        if any(keyword in error_message.lower() 
               for keyword in ["unauthorized", "forbidden", "authentication", "csrf", "xss"]):
            self.logger.log_security_event(
                "security_error",
                severity="WARNING",
                details={
                    "error_type": error_type,
                    "error_message": error_message,
                    "request_data": request_data
                }
            )
    
    def _calculate_error_rate(self) -> float:
        """Calculate current error rate"""
        recent_errors = [
            e for e in self.recent_errors 
            if e["timestamp"] > datetime.now(timezone.utc) - timedelta(minutes=5)
        ]
        
        total_requests = len(self.active_requests) + len(recent_errors)
        
        if total_requests == 0:
            return 0.0
        
        return len(recent_errors) / total_requests
    
    def log_business_event(self, event_type: str, user_id: str = None,
                         details: Dict[str, Any] = None):
        """Log business event"""
        self.logger.log_business_event(event_type, user_id, details)
        
        # Track business metrics
        if event_type not in self.business_metrics:
            self.business_metrics[event_type] = {"count": 0, "last_occurrence": None}
        
        self.business_metrics[event_type]["count"] += 1
        self.business_metrics[event_type]["last_occurrence"] = datetime.now(timezone.utc).isoformat()
        
        # Increment business event counter
        self.monitoring.metrics_collector.increment_counter(
            f"business_events.{event_type}", 1,
            tags={"user_id": user_id} if user_id else {}
        )
    
    def log_user_action(self, action: str, user_id: str, details: Dict[str, Any] = None):
        """Log user action"""
        self.log_business_event(f"user_action_{action}", user_id, details)
        
        # Track user activity
        self.monitoring.metrics_collector.increment_counter(
            "user_actions.total", 1,
            tags={"action": action}
        )
        
        # Update active users if it's a login action
        if action == "login":
            self.monitoring.metrics_collector.increment_counter("active_users", 1)
        elif action == "logout":
            self.monitoring.metrics_collector.increment_counter("active_users", -1)
    
    def log_database_operation(self, operation: str, table: str, duration_ms: float,
                           rows_affected: int = None, error: Exception = None):
        """Log database operation"""
        if error:
            self.logger.error(f"Database operation failed: {operation} on {table}",
                           error=error,
                           extra_fields={
                               "event_type": "database_error",
                               "operation": operation,
                               "table": table,
                               "duration_ms": duration_ms,
                               "rows_affected": rows_affected
                           })
            
            self.monitoring.metrics_collector.increment_counter(
                "database.errors", 1,
                tags={"operation": operation, "table": table}
            )
        else:
            self.logger.info(f"Database operation completed: {operation} on {table}",
                           extra_fields={
                               "event_type": "database_operation",
                               "operation": operation,
                               "table": table,
                               "duration_ms": duration_ms,
                               "rows_affected": rows_affected
                           })
            
            self.monitoring.metrics_collector.record_timer(
                f"database.{operation}_duration_ms", duration_ms,
                tags={"table": table}
            )
            
            if rows_affected is not None:
                self.monitoring.metrics_collector.record_histogram(
                    f"database.{operation}_rows_affected", rows_affected,
                    tags={"table": table}
                )
    
    def log_cache_operation(self, operation: str, key: str, hit: bool,
                         duration_ms: float = None):
        """Log cache operation"""
        self.logger.log_cache_operation(operation, key, hit, duration_ms)
        
        # Track cache metrics
        self.monitoring.metrics_collector.increment_counter(
            f"cache.{operation}_total", 1,
            tags={"hit": str(hit)}
        )
        
        if hit:
            self.monitoring.metrics_collector.increment_counter(
                f"cache.{operation}_hits", 1
            )
        
        if duration_ms:
            self.monitoring.metrics_collector.record_timer(
                f"cache.{operation}_duration_ms", duration_ms,
                tags={"hit": str(hit)}
            )
    
    def log_external_service_call(self, service: str, endpoint: str, method: str,
                              status_code: int, duration_ms: float,
                              response_size: int = None, error: Exception = None):
        """Log external service call"""
        if error:
            self.logger.error(f"External service call failed: {service} {method} {endpoint}",
                           error=error,
                           extra_fields={
                               "event_type": "external_service_error",
                               "service": service,
                               "endpoint": endpoint,
                               "method": method,
                               "duration_ms": duration_ms
                           })
            
            self.monitoring.metrics_collector.increment_counter(
                f"external_services.{service}.errors", 1,
                tags={"endpoint": endpoint, "method": method}
            )
        else:
            self.logger.info(f"External service call completed: {service} {method} {endpoint} {status_code}",
                           extra_fields={
                               "event_type": "external_service_call",
                               "service": service,
                               "endpoint": endpoint,
                               "method": method,
                               "status_code": status_code,
                               "duration_ms": duration_ms,
                               "response_size": response_size
                           })
            
            self.monitoring.metrics_collector.record_timer(
                f"external_services.{service}.response_time_ms", duration_ms,
                tags={"endpoint": endpoint, "method": method}
            )
            
            self.monitoring.metrics_collector.increment_counter(
                f"external_services.{service}.requests", 1,
                tags={"endpoint": endpoint, "method": method, "status_code": str(status_code)}
            )
    
    @contextmanager
    def performance_timer(self, operation: str, **kwargs):
        """Context manager for timing operations"""
        with timer_metric(self.monitoring.metrics_collector, operation, kwargs.get("tags")):
            with self.logger.performance_timer(operation, **kwargs):
                yield
    
    @asynccontextmanager
    async def async_performance_timer(self, operation: str, **kwargs):
        """Async context manager for timing operations"""
        async with async_timer_metric(self.monitoring.metrics_collector, operation, kwargs.get("tags")):
            async with self.logger.async_performance_timer(operation, **kwargs):
                yield
    
    async def _periodic_metrics_update(self):
        """Periodic metrics update"""
        while self.is_running:
            try:
                # Update business metrics
                for event_type, data in self.business_metrics.items():
                    self.monitoring.metrics_collector.set_gauge(
                        f"business.{event_type}_count", data["count"]
                    )
                
                # Update error counts
                for error_type, count in self.error_counts.items():
                    self.monitoring.metrics_collector.set_gauge(
                        f"errors.{error_type}_count", count
                    )
                
                await asyncio.sleep(60)  # Update every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in periodic metrics update: {e}")
                await asyncio.sleep(60)
    
    async def _periodic_health_check(self):
        """Background task for periodic health checks"""
        while self.is_running:
            try:
                # Get health status summary
                health_status = self.monitoring.get_health()
                
                self.logger.info("Health check completed",
                                 health_status=health_status
                                 )
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Health check task error: {e}", error=e)
                await asyncio.sleep(60)
    
    def get_monitoring_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive monitoring dashboard data"""
        return {
            "service_status": {
                "is_running": self.is_running,
                "start_time": self.start_time.isoformat() if self.start_time else None,
                "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
            },
            "active_requests": {
                "count": len(self.active_requests),
                "requests": list(self.active_requests.values())
            },
            "system_metrics": self.monitoring.get_system_metrics(),
            "health_status": self.monitoring.get_health(),
            "alert_status": self.monitoring.get_alerts(),
            "metrics_summary": self.monitoring.get_metrics(),
            "business_metrics": self.business_metrics,
            "error_summary": {
                "total_errors": sum(self.error_counts.values()),
                "error_counts": self.error_counts,
                "recent_errors": self.recent_errors[-10:] if self.recent_errors else []
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def get_service_health(self) -> Dict[str, Any]:
        """Get service health status"""
        health_status = self.monitoring.get_health()
        
        # Determine overall health
        if health_status["status"] == "healthy":
            overall_status = "healthy"
            status_code = 200
        elif health_status["status"] == "degraded":
            overall_status = "degraded"
            status_code = 200
        else:
            overall_status = "unhealthy"
            status_code = 503
        
        return {
            "status": overall_status,
            "status_code": status_code,
            "checks": health_status["checks"],
            "unhealthy_count": health_status["unhealthy_count"],
            "total_checks": health_status["total_checks"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

# Global monitoring service instance
_monitoring_service: Optional[MonitoringService] = None

def get_monitoring_service(config: Dict[str, Any] = None) -> MonitoringService:
    """Get global monitoring service instance"""
    global _monitoring_service
    if _monitoring_service is None:
        _monitoring_service = MonitoringService(config)
    return _monitoring_service

async def start_monitoring(config: Dict[str, Any] = None):
    """Start monitoring service"""
    service = get_monitoring_service(config)
    await service.start()
    return service

async def stop_monitoring():
    """Stop monitoring service"""
    service = get_monitoring_service()
    await service.stop()

# Decorators for automatic monitoring
def monitor_request(monitoring_service: MonitoringService = None):
    """Decorator to monitor API requests"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            service = monitoring_service or get_monitoring_service()
            
            # Extract request info
            request = kwargs.get('request')
            if not request and args:
                request = args[0]  # First argument is usually request
            
            if request:
                request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
                method = request.method
                path = request.url.path
                
                # Start request tracking
                service.start_request_tracking(
                    request_id, method, path,
                    user_id=getattr(request.state, 'user_id', None),
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get('user-agent')
                )
                
                try:
                    # Execute function
                    result = await func(*args, **kwargs)
                    
                    # End request tracking with success
                    service.end_request_tracking(
                        request_id,
                        getattr(result, 'status_code', 200),
                        getattr(result, 'response_size', None)
                    )
                    
                    return result
                    
                except Exception as e:
                    # End request tracking with error
                    service.end_request_tracking(request_id, 500, error=e)
                    raise
            else:
                # No request available, just execute function
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def monitor_database_operation(monitoring_service: MonitoringService = None):
    """Decorator to monitor database operations"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            service = monitoring_service or get_monitoring_service()
            
            start_time = time.time()
            operation = func.__name__
            
            try:
                # Execute function
                result = await func(*args, **kwargs)
                
                duration_ms = (time.time() - start_time) * 1000
                
                # Log successful operation
                service.log_database_operation(
                    operation, "unknown", duration_ms,
                    rows_affected=getattr(result, 'matched_count', None)
                )
                
                return result
                
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                
                # Log failed operation
                service.log_database_operation(operation, "unknown", duration_ms, error=e)
                raise
        
        return wrapper
    return decorator

if __name__ == "__main__":
    # Example usage
    import asyncio
    
    async def main():
        config = {
            "logging": {
                "level": "INFO",
                "file": "logs/monitoring.log"
            },
            "monitoring": {
                "metrics": {
                    "retention_hours": 24
                },
                "alerts": {
                    "check_interval_seconds": 60,
                    "notification_webhook": "https://hooks.slack.com/your-webhook"
                }
            }
        }
        
        service = await start_monitoring(config)
        
        try:
            # Simulate some activity
            service.log_business_event("user_registration", "user123", {"plan": "premium"})
            service.log_user_action("login", "user123")
            
            with service.performance_timer("test_operation"):
                await asyncio.sleep(0.1)
            
            # Keep running
            while True:
                await asyncio.sleep(1)
                
        except KeyboardInterrupt:
            print("Shutting down monitoring service...")
            await stop_monitoring()
    
    asyncio.run(main())

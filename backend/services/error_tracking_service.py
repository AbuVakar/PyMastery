"""
Error Tracking Service for PyMastery
Provides comprehensive error tracking, monitoring, and alerting
"""

import asyncio
import json
import traceback
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from pathlib import Path

from database.mongodb import get_database

logger = logging.getLogger(__name__)

class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ErrorCategory(Enum):
    """Error categories"""
    SYSTEM = "system"
    DATABASE = "database"
    API = "api"
    AUTHENTICATION = "authentication"
    VALIDATION = "validation"
    BUSINESS_LOGIC = "business_logic"
    EXTERNAL_SERVICE = "external_service"
    USER_INTERFACE = "user_interface"
    PERFORMANCE = "performance"
    SECURITY = "security"

@dataclass
class ErrorEvent:
    """Error event data structure"""
    error_id: str
    timestamp: datetime
    severity: ErrorSeverity
    category: ErrorCategory
    message: str
    stack_trace: Optional[str]
    user_id: Optional[str]
    session_id: Optional[str]
    request_id: Optional[str]
    endpoint: Optional[str]
    method: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    context: Dict[str, Any]
    tags: List[str]
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    occurrence_count: int = 1

@dataclass
class ErrorPattern:
    """Error pattern for grouping similar errors"""
    pattern_id: str
    signature: str
    category: ErrorCategory
    message_template: str
    first_occurrence: datetime
    last_occurrence: datetime
    occurrence_count: int
    affected_users: int
    affected_sessions: int
    severity: ErrorSeverity
    status: str  # active, resolved, ignored

@dataclass
class ErrorAlert:
    """Error alert configuration"""
    alert_id: str
    name: str
    description: str
    conditions: Dict[str, Any]
    severity_threshold: ErrorSeverity
    count_threshold: int
    time_window_minutes: int
    enabled: bool
    channels: List[str]  # email, slack, webhook
    last_triggered: Optional[datetime] = None

class ErrorTrackingService:
    """Service for tracking and managing errors"""
    
    def __init__(self):
        self.db = None
        self.error_buffer: List[ErrorEvent] = []
        self.buffer_size = 50
        self.pattern_cache: Dict[str, ErrorPattern] = {}
        self.alerts: Dict[str, ErrorAlert] = {}
        
    async def initialize(self):
        """Initialize the error tracking service"""
        self.db = get_database()
        await self._load_alerts()
        await self._setup_indexes()
        logger.info("Error Tracking Service initialized")
        
    async def track_error(
        self,
        error: Exception,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        category: ErrorCategory = ErrorCategory.SYSTEM,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        request_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None
    ):
        """Track an error event"""
        try:
            # Generate error signature for pattern matching
            signature = self._generate_error_signature(error, category, endpoint)
            
            # Check if this matches an existing pattern
            pattern = await self._get_or_create_pattern(signature, error, category, endpoint)
            
            # Create error event
            error_event = ErrorEvent(
                error_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                severity=severity,
                category=category,
                message=str(error),
                stack_trace=traceback.format_exc(),
                user_id=user_id,
                session_id=session_id,
                request_id=request_id,
                endpoint=endpoint,
                method=method,
                ip_address=ip_address,
                user_agent=user_agent,
                context=context or {},
                tags=tags or []
            )
            
            # Add to buffer
            self.error_buffer.append(error_event)
            
            # Update pattern
            await self._update_pattern(pattern, error_event)
            
            # Check alerts
            await self._check_alerts(pattern, error_event)
            
            # Flush buffer if needed
            if len(self.error_buffer) >= self.buffer_size:
                await self._flush_errors()
                
        except Exception as e:
            logger.error(f"Error tracking failed: {e}")
    
    async def get_error_patterns(
        self,
        category: Optional[ErrorCategory] = None,
        severity: Optional[ErrorSeverity] = None,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[ErrorPattern]:
        """Get error patterns with optional filtering"""
        try:
            query = {}
            
            if category:
                query["category"] = category.value
            if severity:
                query["severity"] = severity.value
            if status:
                query["status"] = status
            
            cursor = self.db.error_patterns.find(query).sort("last_occurrence", -1).limit(limit)
            results = await cursor.to_list(None)
            
            return [
                ErrorPattern(
                    pattern_id=result["pattern_id"],
                    signature=result["signature"],
                    category=ErrorCategory(result["category"]),
                    message_template=result["message_template"],
                    first_occurrence=result["first_occurrence"],
                    last_occurrence=result["last_occurrence"],
                    occurrence_count=result["occurrence_count"],
                    affected_users=result["affected_users"],
                    affected_sessions=result["affected_sessions"],
                    severity=ErrorSeverity(result["severity"]),
                    status=result["status"]
                )
                for result in results
            ]
            
        except Exception as e:
            logger.error(f"Error getting error patterns: {e}")
            return []
    
    async def get_error_events(
        self,
        pattern_id: Optional[str] = None,
        user_id: Optional[str] = None,
        severity: Optional[ErrorSeverity] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[ErrorEvent]:
        """Get error events with optional filtering"""
        try:
            query = {}
            
            if pattern_id:
                query["pattern_id"] = pattern_id
            if user_id:
                query["user_id"] = user_id
            if severity:
                query["severity"] = severity.value
            if start_date or end_date:
                query["timestamp"] = {}
                if start_date:
                    query["timestamp"]["$gte"] = start_date
                if end_date:
                    query["timestamp"]["$lte"] = end_date
            
            cursor = self.db.error_events.find(query).sort("timestamp", -1).limit(limit)
            results = await cursor.to_list(None)
            
            return [
                ErrorEvent(
                    error_id=result["error_id"],
                    timestamp=result["timestamp"],
                    severity=ErrorSeverity(result["severity"]),
                    category=ErrorCategory(result["category"]),
                    message=result["message"],
                    stack_trace=result.get("stack_trace"),
                    user_id=result.get("user_id"),
                    session_id=result.get("session_id"),
                    request_id=result.get("request_id"),
                    endpoint=result.get("endpoint"),
                    method=result.get("method"),
                    ip_address=result.get("ip_address"),
                    user_agent=result.get("user_agent"),
                    context=result.get("context", {}),
                    tags=result.get("tags", []),
                    resolved=result.get("resolved", False),
                    resolved_at=result.get("resolved_at"),
                    resolved_by=result.get("resolved_by"),
                    occurrence_count=result.get("occurrence_count", 1)
                )
                for result in results
            ]
            
        except Exception as e:
            logger.error(f"Error getting error events: {e}")
            return []
    
    async def get_error_summary(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get error summary for a time period"""
        try:
            pipeline = [
                {
                    "$match": {
                        "timestamp": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "severity": "$severity",
                            "category": "$category"
                        },
                        "count": {"$sum": 1},
                        "unique_users": {"$addToSet": "$user_id"},
                        "unique_sessions": {"$addToSet": "$session_id"}
                    }
                },
                {
                    "$project": {
                        "severity": "$_id.severity",
                        "category": "$_id.category",
                        "count": 1,
                        "unique_users": {"$size": "$unique_users"},
                        "unique_sessions": {"$size": "$unique_sessions"}
                    }
                },
                {"$sort": {"count": -1}}
            ]
            
            results = await self.db.error_events.aggregate(pipeline).to_list(None)
            
            # Calculate totals
            total_errors = sum(r["count"] for r in results)
            total_users = len(set().union(*[r["unique_users"] for r in results if r["unique_users"]]))
            
            # Group by severity
            severity_breakdown = {}
            category_breakdown = {}
            
            for result in results:
                severity = result["severity"]
                category = result["category"]
                count = result["count"]
                
                severity_breakdown[severity] = severity_breakdown.get(severity, 0) + count
                category_breakdown[category] = category_breakdown.get(category, 0) + count
            
            return {
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "total_errors": total_errors,
                "total_affected_users": total_users,
                "severity_breakdown": severity_breakdown,
                "category_breakdown": category_breakdown,
                "detailed_breakdown": results
            }
            
        except Exception as e:
            logger.error(f"Error getting error summary: {e}")
            return {}
    
    async def create_alert(
        self,
        name: str,
        description: str,
        conditions: Dict[str, Any],
        severity_threshold: ErrorSeverity,
        count_threshold: int,
        time_window_minutes: int,
        channels: List[str]
    ) -> ErrorAlert:
        """Create a new error alert"""
        try:
            alert = ErrorAlert(
                alert_id=str(uuid.uuid4()),
                name=name,
                description=description,
                conditions=conditions,
                severity_threshold=severity_threshold,
                count_threshold=count_threshold,
                time_window_minutes=time_window_minutes,
                enabled=True,
                channels=channels
            )
            
            # Save to database
            await self.db.error_alerts.insert_one(asdict(alert))
            
            # Add to local cache
            self.alerts[alert.alert_id] = alert
            
            logger.info(f"Created error alert: {name}")
            return alert
            
        except Exception as e:
            logger.error(f"Error creating alert: {e}")
            raise
    
    async def resolve_error_pattern(
        self,
        pattern_id: str,
        resolved_by: str,
        resolution_notes: Optional[str] = None
    ):
        """Mark an error pattern as resolved"""
        try:
            # Update pattern
            await self.db.error_patterns.update_one(
                {"pattern_id": pattern_id},
                {
                    "$set": {
                        "status": "resolved",
                        "resolved_at": datetime.now(timezone.utc),
                        "resolved_by": resolved_by,
                        "resolution_notes": resolution_notes
                    }
                }
            )
            
            # Update all related error events
            await self.db.error_events.update_many(
                {"pattern_id": pattern_id},
                {
                    "$set": {
                        "resolved": True,
                        "resolved_at": datetime.now(timezone.utc),
                        "resolved_by": resolved_by
                    }
                }
            )
            
            # Update cache
            if pattern_id in self.pattern_cache:
                pattern = self.pattern_cache[pattern_id]
                pattern.status = "resolved"
                pattern.resolved_at = datetime.now(timezone.utc)
                pattern.resolved_by = resolved_by
            
            logger.info(f"Resolved error pattern: {pattern_id}")
            
        except Exception as e:
            logger.error(f"Error resolving pattern: {e}")
            raise
    
    def _generate_error_signature(
        self,
        error: Exception,
        category: ErrorCategory,
        endpoint: Optional[str]
    ) -> str:
        """Generate a signature for error pattern matching"""
        # Use error type, category, and endpoint for signature
        error_type = type(error).__name__
        endpoint_part = endpoint or "no_endpoint"
        
        # Extract key parts of the error message
        message = str(error)
        # Remove dynamic parts like IDs, timestamps, etc.
        import re
        cleaned_message = re.sub(r'\b\d+\b', '[ID]', message)
        cleaned_message = re.sub(r'\b\w{8,}\b', '[HASH]', cleaned_message)
        
        signature = f"{error_type}:{category.value}:{endpoint_part}:{cleaned_message[:100]}"
        return signature
    
    async def _get_or_create_pattern(
        self,
        signature: str,
        error: Exception,
        category: ErrorCategory,
        endpoint: Optional[str]
    ) -> ErrorPattern:
        """Get existing pattern or create new one"""
        # Check cache first
        if signature in self.pattern_cache:
            return self.pattern_cache[signature]
        
        # Check database
        existing = await self.db.error_patterns.find_one({"signature": signature})
        
        if existing:
            pattern = ErrorPattern(
                pattern_id=existing["pattern_id"],
                signature=existing["signature"],
                category=ErrorCategory(existing["category"]),
                message_template=existing["message_template"],
                first_occurrence=existing["first_occurrence"],
                last_occurrence=existing["last_occurrence"],
                occurrence_count=existing["occurrence_count"],
                affected_users=existing["affected_users"],
                affected_sessions=existing["affected_sessions"],
                severity=ErrorSeverity(existing["severity"]),
                status=existing["status"]
            )
        else:
            # Create new pattern
            now = datetime.now(timezone.utc)
            pattern = ErrorPattern(
                pattern_id=str(uuid.uuid4()),
                signature=signature,
                category=category,
                message_template=str(error)[:200],
                first_occurrence=now,
                last_occurrence=now,
                occurrence_count=0,
                affected_users=0,
                affected_sessions=0,
                severity=ErrorSeverity.MEDIUM,
                status="active"
            )
            
            await self.db.error_patterns.insert_one(asdict(pattern))
        
        # Cache the pattern
        self.pattern_cache[signature] = pattern
        return pattern
    
    async def _update_pattern(self, pattern: ErrorPattern, error_event: ErrorEvent):
        """Update error pattern with new event"""
        try:
            # Update counts and timestamps
            pattern.occurrence_count += 1
            pattern.last_occurrence = error_event.timestamp
            
            # Update affected users/sessions
            if error_event.user_id:
                # Get unique users for this pattern
                pipeline = [
                    {"$match": {"pattern_id": pattern.pattern_id}},
                    {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
                    {"$match": {"user_id": {"$ne": None}}}
                ]
                user_results = await self.db.error_events.aggregate(pipeline).to_list(None)
                pattern.affected_users = len(user_results)
            
            if error_event.session_id:
                # Get unique sessions for this pattern
                pipeline = [
                    {"$match": {"pattern_id": pattern.pattern_id}},
                    {"$group": {"_id": "$session_id", "count": {"$sum": 1}}},
                    {"$match": {"session_id": {"$ne": None}}}
                ]
                session_results = await self.db.error_events.aggregate(pipeline).to_list(None)
                pattern.affected_sessions = len(session_results)
            
            # Update in database
            await self.db.error_patterns.update_one(
                {"pattern_id": pattern.pattern_id},
                {
                    "$set": {
                        "last_occurrence": pattern.last_occurrence,
                        "occurrence_count": pattern.occurrence_count,
                        "affected_users": pattern.affected_users,
                        "affected_sessions": pattern.affected_sessions
                    }
                }
            )
            
        except Exception as e:
            logger.error(f"Error updating pattern: {e}")
    
    async def _check_alerts(self, pattern: ErrorPattern, error_event: ErrorEvent):
        """Check if any alerts should be triggered"""
        try:
            for alert in self.alerts.values():
                if not alert.enabled:
                    continue
                
                # Check cooldown
                if (alert.last_triggered and 
                    datetime.now(timezone.utc) - alert.last_triggered < timedelta(minutes=5)):
                    continue
                
                # Check severity threshold
                if self._compare_severity(pattern.severity, alert.severity_threshold) < 0:
                    continue
                
                # Check count threshold in time window
                time_window = datetime.now(timezone.utc) - timedelta(minutes=alert.time_window_minutes)
                recent_count = await self.db.error_events.count_documents({
                    "pattern_id": pattern.pattern_id,
                    "timestamp": {"$gte": time_window}
                })
                
                if recent_count >= alert.count_threshold:
                    await self._trigger_alert(alert, pattern, error_event)
                    
        except Exception as e:
            logger.error(f"Error checking alerts: {e}")
    
    def _compare_severity(self, severity1: ErrorSeverity, severity2: ErrorSeverity) -> int:
        """Compare error severities"""
        severity_order = {
            ErrorSeverity.LOW: 0,
            ErrorSeverity.MEDIUM: 1,
            ErrorSeverity.HIGH: 2,
            ErrorSeverity.CRITICAL: 3
        }
        
        return severity_order[severity1] - severity_order[severity2]
    
    async def _trigger_alert(self, alert: ErrorAlert, pattern: ErrorPattern, error_event: ErrorEvent):
        """Trigger an error alert"""
        try:
            alert.last_triggered = datetime.now(timezone.utc)
            
            # Update in database
            await self.db.error_alerts.update_one(
                {"alert_id": alert.alert_id},
                {"$set": {"last_triggered": alert.last_triggered}}
            )
            
            # Send notifications based on channels
            for channel in alert.channels:
                if channel == "email":
                    await self._send_email_alert(alert, pattern, error_event)
                elif channel == "slack":
                    await self._send_slack_alert(alert, pattern, error_event)
                elif channel == "webhook":
                    await self._send_webhook_alert(alert, pattern, error_event)
            
            logger.warning(f"Triggered alert: {alert.name} for pattern: {pattern.pattern_id}")
            
        except Exception as e:
            logger.error(f"Error triggering alert: {e}")
    
    async def _send_email_alert(self, alert: ErrorAlert, pattern: ErrorPattern, error_event: ErrorEvent):
        """Send email alert (placeholder implementation)"""
        # TODO: Implement email sending
        logger.info(f"Email alert sent for: {alert.name}")
    
    async def _send_slack_alert(self, alert: ErrorAlert, pattern: ErrorPattern, error_event: ErrorEvent):
        """Send Slack alert (placeholder implementation)"""
        # TODO: Implement Slack integration
        logger.info(f"Slack alert sent for: {alert.name}")
    
    async def _send_webhook_alert(self, alert: ErrorAlert, pattern: ErrorPattern, error_event: ErrorEvent):
        """Send webhook alert (placeholder implementation)"""
        # TODO: Implement webhook sending
        logger.info(f"Webhook alert sent for: {alert.name}")
    
    async def _flush_errors(self):
        """Flush error buffer to database"""
        if not self.error_buffer:
            return
        
        try:
            error_data = [asdict(error) for error in self.error_buffer]
            await self.db.error_events.insert_many(error_data)
            self.error_buffer.clear()
            logger.info(f"Flushed {len(error_data)} errors to database")
            
        except Exception as e:
            logger.error(f"Error flushing errors: {e}")
    
    async def _load_alerts(self):
        """Load alerts from database"""
        try:
            cursor = self.db.error_alerts.find({"enabled": True})
            results = await cursor.to_list(None)
            
            for result in results:
                alert = ErrorAlert(
                    alert_id=result["alert_id"],
                    name=result["name"],
                    description=result["description"],
                    conditions=result["conditions"],
                    severity_threshold=ErrorSeverity(result["severity_threshold"]),
                    count_threshold=result["count_threshold"],
                    time_window_minutes=result["time_window_minutes"],
                    enabled=result["enabled"],
                    channels=result["channels"],
                    last_triggered=result.get("last_triggered")
                )
                self.alerts[alert.alert_id] = alert
            
            logger.info(f"Loaded {len(self.alerts)} alerts")
            
        except Exception as e:
            logger.error(f"Error loading alerts: {e}")
    
    async def _setup_indexes(self):
        """Setup database indexes for error tracking"""
        try:
            # Error events indexes
            await self.db.error_events.create_index("timestamp")
            await self.db.error_events.create_index("pattern_id")
            await self.db.error_events.create_index("severity")
            await self.db.error_events.create_index("category")
            await self.db.error_events.create_index("user_id")
            await self.db.error_events.create_index("resolved")
            
            # Error patterns indexes
            await self.db.error_patterns.create_index("signature", unique=True)
            await self.db.error_patterns.create_index("last_occurrence")
            await self.db.error_patterns.create_index("severity")
            await self.db.error_patterns.create_index("status")
            
            # Error alerts indexes
            await self.db.error_alerts.create_index("alert_id", unique=True)
            await self.db.error_alerts.create_index("enabled")
            
            logger.info("Error tracking indexes setup complete")
            
        except Exception as e:
            logger.error(f"Error setting up indexes: {e}")

# Global instance
error_tracking_service = ErrorTrackingService()

async def get_error_tracking_service() -> ErrorTrackingService:
    """Get the error tracking service instance"""
    if not error_tracking_service.db:
        await error_tracking_service.initialize()
    return error_tracking_service

# Decorator for automatic error tracking
def track_errors(
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    tags: Optional[List[str]] = None
):
    """Decorator to automatically track errors in functions"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                # Extract context from kwargs if available
                user_id = kwargs.get('user_id')
                session_id = kwargs.get('session_id')
                request_id = kwargs.get('request_id')
                
                await error_tracking_service.track_error(
                    error=e,
                    severity=severity,
                    category=category,
                    user_id=user_id,
                    session_id=session_id,
                    request_id=request_id,
                    tags=tags
                )
                raise
        return wrapper
    return decorator

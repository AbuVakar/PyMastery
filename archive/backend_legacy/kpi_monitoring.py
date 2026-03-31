"""
Real-time KPI Monitoring and Alerting System
Provides real-time KPI tracking, alerting, and automated monitoring
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import asyncio
from enum import Enum

from database.mongodb import get_database
from services.openai_service import OpenAIService
from services.user_service import UserService

router = APIRouter(prefix="/api/v1/kpi-monitoring", tags=["KPI Monitoring"])

class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertType(str, Enum):
    THRESHOLD = "threshold"
    TREND = "trend"
    ANOMALY = "anomaly"
    PREDICTION = "prediction"

class MonitoringRule(BaseModel):
    id: str
    name: str
    kpi_id: str
    condition: str  # "greater_than", "less_than", "percentage_change", "rate_change"
    threshold_value: float
    severity: AlertSeverity
    alert_type: AlertType
    is_active: bool
    notification_channels: List[str]
    cooldown_minutes: int
    created_at: datetime
    last_triggered: Optional[datetime]

class RealTimeKPI(BaseModel):
    kpi_id: str
    value: float
    timestamp: datetime
    previous_value: Optional[float]
    change_percentage: Optional[float]
    trend: str
    is_anomaly: bool
    anomaly_score: float

class KPIDashboard(BaseModel):
    id: str
    name: str
    layout: List[Dict[str, Any]]
    refresh_interval_seconds: int
    auto_refresh: bool
    created_at: datetime
    updated_at: datetime

class NotificationChannel(BaseModel):
    id: str
    name: str
    type: str  # "email", "slack", "webhook", "sms"
    config: Dict[str, Any]
    is_active: bool
    created_at: datetime

class RealTimeMonitoringEngine:
    def __init__(self):
        self.openai_service = OpenAIService()
        self.user_service = UserService()
        self.active_rules: Dict[str, MonitoringRule] = {}
        self.notification_channels: Dict[str, NotificationChannel] = {}
        self.kpi_cache: Dict[str, List[RealTimeKPI]] = {}
        self.monitoring_active = False
        
        # Initialize monitoring
        self.initialize_monitoring()
    
    def initialize_monitoring(self):
        """Initialize the monitoring system"""
        
        # Load active monitoring rules
        # Don't auto-load in __init__ to avoid event loop issues
        pass
        
        # Load notification channels
        # Don't auto-load in __init__ to avoid event loop issues
        pass
        
        # Start real-time monitoring
        # Don't auto-start in __init__ to avoid event loop issues
        pass
    
    async def load_monitoring_rules(self):
        """Load monitoring rules from database"""
        
        db = await get_database()
        rules = await db.monitoring_rules.find({"is_active": True}).to_list(length=None)
        
        for rule in rules:
            self.active_rules[rule["id"]] = MonitoringRule(**rule)
    
    async def load_notification_channels(self):
        """Load notification channels from database"""
        
        db = await get_database()
        channels = await db.notification_channels.find({"is_active": True}).to_list(length=None)
        
        for channel in channels:
            self.notification_channels[channel["id"]] = NotificationChannel(**channel)
    
    async def start_monitoring(self):
        """Start real-time monitoring"""
        
        self.monitoring_active = True
        
        while self.monitoring_active:
            try:
                # Update KPI values
                await self.update_kpi_values()
                
                # Check monitoring rules
                await self.check_monitoring_rules()
                
                # Detect anomalies
                await self.detect_anomalies()
                
                # Wait before next check
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                print(f"Monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def update_kpi_values(self):
        """Update real-time KPI values"""
        
        # Get current KPI definitions
        kpi_definitions = await self.get_kpi_definitions()
        
        for kpi_def in kpi_definitions:
            try:
                # Calculate current KPI value
                now = datetime.utcnow()
                period_start = now - timedelta(hours=1)
                period_end = now
                
                # This would call the actual KPI calculation
                current_value = await self.calculate_kpi_value(kpi_def["id"], period_start, period_end)
                
                # Get previous value for trend calculation
                previous_value = await self.get_previous_kpi_value(kpi_def["id"])
                
                # Calculate change percentage
                change_percentage = None
                if previous_value and previous_value != 0:
                    change_percentage = ((current_value - previous_value) / previous_value) * 100
                
                # Determine trend
                trend = "stable"
                if change_percentage:
                    if change_percentage > 5:
                        trend = "increasing"
                    elif change_percentage < -5:
                        trend = "decreasing"
                
                # Create real-time KPI
                real_time_kpi = RealTimeKPI(
                    kpi_id=kpi_def["id"],
                    value=current_value,
                    timestamp=now,
                    previous_value=previous_value,
                    change_percentage=change_percentage,
                    trend=trend,
                    is_anomaly=False,
                    anomaly_score=0.0
                )
                
                # Update cache
                if kpi_def["id"] not in self.kpi_cache:
                    self.kpi_cache[kpi_def["id"]] = []
                
                self.kpi_cache[kpi_def["id"]].append(real_time_kpi)
                
                # Keep only last 100 values
                if len(self.kpi_cache[kpi_def["id"]]) > 100:
                    self.kpi_cache[kpi_def["id"]] = self.kpi_cache[kpi_def["id"]][-100:]
                
                # Store in database
                await self.store_real_time_kpi(real_time_kpi)
                
            except Exception as e:
                print(f"Error updating KPI {kpi_def['id']}: {e}")
    
    async def get_kpi_definitions(self) -> List[Dict[str, Any]]:
        """Get KPI definitions"""
        
        db = await get_database()
        return await db.kpi_definitions.find({}).to_list(length=None)
    
    async def calculate_kpi_value(self, kpi_id: str, period_start: datetime, period_end: datetime) -> float:
        """Calculate KPI value for a specific period"""
        
        # This would integrate with the actual KPI calculation engine
        # For now, return a simulated value
        import random
        return random.uniform(50, 150)
    
    async def get_previous_kpi_value(self, kpi_id: str) -> Optional[float]:
        """Get previous KPI value"""
        
        if kpi_id in self.kpi_cache and len(self.kpi_cache[kpi_id]) > 0:
            return self.kpi_cache[kpi_id][-1].value
        
        return None
    
    async def store_real_time_kpi(self, kpi: RealTimeKPI):
        """Store real-time KPI in database"""
        
        db = await get_database()
        await db.real_time_kpis.insert_one(kpi.dict())
    
    async def check_monitoring_rules(self):
        """Check all monitoring rules and trigger alerts if needed"""
        
        now = datetime.utcnow()
        
        for rule in self.active_rules.values():
            try:
                # Check cooldown period
                if rule.last_triggered:
                    cooldown_end = rule.last_triggered + timedelta(minutes=rule.cooldown_minutes)
                    if now < cooldown_end:
                        continue
                
                # Get current KPI value
                if rule.kpi_id not in self.kpi_cache or not self.kpi_cache[rule.kpi_id]:
                    continue
                
                current_kpi = self.kpi_cache[rule.kpi_id][-1]
                
                # Check rule condition
                alert_triggered = False
                
                if rule.condition == "greater_than":
                    alert_triggered = current_kpi.value > rule.threshold_value
                elif rule.condition == "less_than":
                    alert_triggered = current_kpi.value < rule.threshold_value
                elif rule.condition == "percentage_change":
                    if current_kpi.change_percentage:
                        alert_triggered = abs(current_kpi.change_percentage) > rule.threshold_value
                elif rule.condition == "rate_change":
                    # Calculate rate of change
                    if len(self.kpi_cache[rule.kpi_id]) >= 2:
                        recent_kpis = self.kpi_cache[rule.kpi_id][-10:]  # Last 10 values
                        if len(recent_kpis) >= 2:
                            rate = (recent_kpis[-1].value - recent_kpis[0].value) / len(recent_kpis)
                            alert_triggered = abs(rate) > rule.threshold_value
                
                if alert_triggered:
                    await self.trigger_alert(rule, current_kpi)
                    rule.last_triggered = now
                    
                    # Update rule in database
                    db = await get_database()
                    await db.monitoring_rules.update_one(
                        {"id": rule.id},
                        {"$set": {"last_triggered": now}}
                    )
                
            except Exception as e:
                print(f"Error checking rule {rule.id}: {e}")
    
    async def trigger_alert(self, rule: MonitoringRule, kpi: RealTimeKPI):
        """Trigger an alert based on a monitoring rule"""
        
        # Create alert
        alert = {
            "id": f"alert_{datetime.utcnow().timestamp()}",
            "rule_id": rule.id,
            "kpi_id": rule.kpi_id,
            "severity": rule.severity.value,
            "alert_type": rule.alert_type.value,
            "message": f"KPI {rule.kpi_id} {rule.condition.replace('_', ' ')} threshold: {kpi.value:.2f} (threshold: {rule.threshold_value:.2f})",
            "current_value": kpi.value,
            "threshold_value": rule.threshold_value,
            "triggered_at": datetime.utcnow(),
            "acknowledged": False
        }
        
        # Store alert
        db = await get_database()
        await db.kpi_alerts.insert_one(alert)
        
        # Send notifications
        for channel_id in rule.notification_channels:
            if channel_id in self.notification_channels:
                await self.send_notification(self.notification_channels[channel_id], alert)
    
    async def send_notification(self, channel: NotificationChannel, alert: Dict[str, Any]):
        """Send notification through a channel"""
        
        try:
            if channel.type == "email":
                await self.send_email_notification(channel, alert)
            elif channel.type == "slack":
                await self.send_slack_notification(channel, alert)
            elif channel.type == "webhook":
                await self.send_webhook_notification(channel, alert)
            elif channel.type == "sms":
                await self.send_sms_notification(channel, alert)
        except Exception as e:
            print(f"Error sending notification via {channel.type}: {e}")
    
    async def send_email_notification(self, channel: NotificationChannel, alert: Dict[str, Any]):
        """Send email notification"""
        
        # This would integrate with an email service
        print(f"Email notification: {alert['message']}")
    
    async def send_slack_notification(self, channel: NotificationChannel, alert: Dict[str, Any]):
        """Send Slack notification"""
        
        # This would integrate with Slack API
        print(f"Slack notification: {alert['message']}")
    
    async def send_webhook_notification(self, channel: NotificationChannel, alert: Dict[str, Any]):
        """Send webhook notification"""
        
        # This would send HTTP request to webhook URL
        print(f"Webhook notification: {alert['message']}")
    
    async def send_sms_notification(self, channel: NotificationChannel, alert: Dict[str, Any]):
        """Send SMS notification"""
        
        # This would integrate with SMS service
        print(f"SMS notification: {alert['message']}")
    
    async def detect_anomalies(self):
        """Detect anomalies in KPI data"""
        
        for kpi_id, kpi_data in self.kpi_cache.items():
            if len(kpi_data) < 10:  # Need at least 10 data points
                continue
            
            try:
                # Simple anomaly detection using standard deviation
                values = [kpi.value for kpi in kpi_data[-20:]]  # Last 20 values
                
                if len(values) < 10:
                    continue
                
                mean = sum(values) / len(values)
                variance = sum((x - mean) ** 2 for x in values) / len(values)
                std_dev = variance ** 0.5
                
                # Check if latest value is anomalous (more than 2 standard deviations)
                latest_value = kpi_data[-1].value
                
                if std_dev > 0:
                    z_score = abs(latest_value - mean) / std_dev
                    
                    if z_score > 2:  # Anomaly threshold
                        # Update KPI with anomaly info
                        kpi_data[-1].is_anomaly = True
                        kpi_data[-1].anomaly_score = z_score
                        
                        # Create anomaly alert
                        await self.create_anomaly_alert(kpi_id, latest_value, mean, std_dev, z_score)
                
            except Exception as e:
                print(f"Error detecting anomalies for {kpi_id}: {e}")
    
    async def create_anomaly_alert(self, kpi_id: str, value: float, mean: float, std_dev: float, z_score: float):
        """Create an anomaly alert"""
        
        alert = {
            "id": f"anomaly_{datetime.utcnow().timestamp()}",
            "kpi_id": kpi_id,
            "alert_type": "anomaly",
            "severity": "high" if z_score > 3 else "medium",
            "message": f"Anomaly detected in {kpi_id}: {value:.2f} (expected: {mean:.2f} ± {std_dev:.2f})",
            "current_value": value,
            "expected_mean": mean,
            "std_dev": std_dev,
            "z_score": z_score,
            "triggered_at": datetime.utcnow(),
            "acknowledged": False
        }
        
        # Store alert
        db = await get_database()
        await db.kpi_alerts.insert_one(alert)
        
        # Send notifications to anomaly channels
        for channel in self.notification_channels.values():
            if "anomaly" in channel.config.get("alert_types", []):
                await self.send_notification(channel, alert)
    
    async def get_real_time_kpi(self, kpi_id: str) -> Optional[RealTimeKPI]:
        """Get latest real-time KPI value"""
        
        if kpi_id in self.kpi_cache and self.kpi_cache[kpi_id]:
            return self.kpi_cache[kpi_id][-1]
        
        return None
    
    async def get_kpi_history(self, kpi_id: str, hours: int = 24) -> List[RealTimeKPI]:
        """Get KPI history for the specified hours"""
        
        if kpi_id not in self.kpi_cache:
            return []
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        return [kpi for kpi in self.kpi_cache[kpi_id] if kpi.timestamp >= cutoff_time]
    
    async def create_monitoring_rule(self, name: str, kpi_id: str, condition: str, threshold_value: float,
                                  severity: AlertSeverity, alert_type: AlertType, notification_channels: List[str],
                                  cooldown_minutes: int = 60) -> MonitoringRule:
        """Create a new monitoring rule"""
        
        rule = MonitoringRule(
            id=f"rule_{datetime.utcnow().timestamp()}",
            name=name,
            kpi_id=kpi_id,
            condition=condition,
            threshold_value=threshold_value,
            severity=severity,
            alert_type=alert_type,
            is_active=True,
            notification_channels=notification_channels,
            cooldown_minutes=cooldown_minutes,
            created_at=datetime.utcnow(),
            last_triggered=None
        )
        
        # Save to database
        db = await get_database()
        await db.monitoring_rules.insert_one(rule.dict())
        
        # Add to active rules
        self.active_rules[rule.id] = rule
        
        return rule
    
    async def create_notification_channel(self, name: str, channel_type: str, config: Dict[str, Any]) -> NotificationChannel:
        """Create a new notification channel"""
        
        channel = NotificationChannel(
            id=f"channel_{datetime.utcnow().timestamp()}",
            name=name,
            type=channel_type,
            config=config,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        # Save to database
        db = await get_database()
        await db.notification_channels.insert_one(channel.dict())
        
        # Add to active channels
        self.notification_channels[channel.id] = channel
        
        return channel
    
    async def get_monitoring_summary(self) -> Dict[str, Any]:
        """Get monitoring system summary"""
        
        active_rules_count = len(self.active_rules)
        active_channels_count = len(self.notification_channels)
        monitored_kpis_count = len(self.kpi_cache)
        
        # Get recent alerts
        db = await get_database()
        recent_alerts = await db.kpi_alerts.find({
            "triggered_at": {"$gte": datetime.utcnow() - timedelta(hours=24)}
        }).to_list(length=None)
        
        alerts_by_severity = {}
        for alert in recent_alerts:
            severity = alert["severity"]
            alerts_by_severity[severity] = alerts_by_severity.get(severity, 0) + 1
        
        return {
            "monitoring_active": self.monitoring_active,
            "active_rules": active_rules_count,
            "active_channels": active_channels_count,
            "monitored_kpis": monitored_kpis_count,
            "recent_alerts_24h": len(recent_alerts),
            "alerts_by_severity": alerts_by_severity,
            "last_update": datetime.utcnow()
        }

# Initialize monitoring engine
monitoring_engine = RealTimeMonitoringEngine()

@router.get("/summary")
async def get_monitoring_summary():
    """Get monitoring system summary"""
    try:
        summary = await monitoring_engine.get_monitoring_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary error: {str(e)}")

@router.get("/kpi/{kpi_id}/realtime")
async def get_real_time_kpi(kpi_id: str):
    """Get real-time KPI value"""
    try:
        kpi = await monitoring_engine.get_real_time_kpi(kpi_id)
        return kpi
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Real-time KPI error: {str(e)}")

@router.get("/kpi/{kpi_id}/history")
async def get_kpi_history(kpi_id: str, hours: int = 24):
    """Get KPI history"""
    try:
        history = await monitoring_engine.get_kpi_history(kpi_id, hours)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History error: {str(e)}")

@router.post("/rules")
async def create_monitoring_rule(name: str, kpi_id: str, condition: str, threshold_value: float,
                              severity: AlertSeverity, alert_type: AlertType, notification_channels: List[str],
                              cooldown_minutes: int = 60):
    """Create a new monitoring rule"""
    try:
        rule = await monitoring_engine.create_monitoring_rule(
            name, kpi_id, condition, threshold_value, severity, alert_type, notification_channels, cooldown_minutes
        )
        return rule
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rule creation error: {str(e)}")

@router.get("/rules")
async def get_monitoring_rules():
    """Get all monitoring rules"""
    try:
        rules = list(monitoring_engine.active_rules.values())
        return {"rules": rules}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rules retrieval error: {str(e)}")

@router.post("/channels")
async def create_notification_channel(name: str, channel_type: str, config: Dict[str, Any]):
    """Create a new notification channel"""
    try:
        channel = await monitoring_engine.create_notification_channel(name, channel_type, config)
        return channel
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Channel creation error: {str(e)}")

@router.get("/channels")
async def get_notification_channels():
    """Get all notification channels"""
    try:
        channels = list(monitoring_engine.notification_channels.values())
        return {"channels": channels}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Channels retrieval error: {str(e)}")

@router.post("/test-alert")
async def test_alert(kpi_id: str, value: float, threshold_value: float):
    """Test alert generation"""
    try:
        # Create a test alert
        alert = {
            "id": f"test_{datetime.utcnow().timestamp()}",
            "kpi_id": kpi_id,
            "alert_type": "test",
            "severity": "medium",
            "message": f"Test alert for {kpi_id}: {value:.2f} (threshold: {threshold_value:.2f})",
            "current_value": value,
            "threshold_value": threshold_value,
            "triggered_at": datetime.utcnow(),
            "acknowledged": False
        }
        
        # Store test alert
        db = await get_database()
        await db.kpi_alerts.insert_one(alert)
        
        return alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test alert error: {str(e)}")

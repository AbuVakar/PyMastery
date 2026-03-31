"""
Rate Limiting Service
Centralized service for managing advanced rate limiting with monitoring and analytics
"""

import asyncio
import time
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import json
import ipaddress

from utils.advanced_logging import get_logger, LogContext
from utils.advanced_rate_limiter import (
    AdvancedRateLimiter, RateLimitRule, RateLimitStrategy, 
    RateLimitScope, RateLimitAction, get_advanced_rate_limiter
)

@dataclass
class RateLimitAnalytics:
    """Rate limiting analytics data"""
    timestamp: datetime
    total_requests: int
    blocked_requests: int
    block_rate: float
    top_violating_ips: List[Tuple[str, int]]
    top_violating_users: List[Tuple[str, int]]
    top_violating_rules: List[Tuple[str, int]]
    active_rules_count: int
    adaptive_adjustments: int

@dataclass
class RateLimitAlert:
    """Rate limiting alert configuration"""
    name: str
    condition: str  # "block_rate", "violations", "adaptive_factor"
    threshold: float
    window_minutes: int
    enabled: bool = True
    webhook_url: Optional[str] = None
    email_recipients: Optional[List[str]] = None
    cooldown_minutes: int = 60
    last_triggered: Optional[datetime] = None

class RateLimitService:
    """Advanced rate limiting service with monitoring and management"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.logger = get_logger("rate_limit_service", self.config.get("logging", {}))
        
        # Get rate limiter
        self.rate_limiter = get_advanced_rate_limiter(self.config.get("rate_limiter", {}))
        
        # Service state
        self.is_running = False
        self.start_time = None
        
        # Analytics storage
        self.analytics_history: List[RateLimitAnalytics] = []
        self.max_analytics_entries = self.config.get("max_analytics_entries", 1000)
        
        # Alerts configuration
        self.alerts: List[RateLimitAlert] = []
        self.alert_cooldowns: Dict[str, datetime] = {}
        
        # Background tasks
        self.analytics_task: Optional[asyncio.Task] = None
        self.alert_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        
        # Configuration
        self.analytics_interval = self.config.get("analytics_interval", 60)  # 1 minute
        self.alert_check_interval = self.config.get("alert_check_interval", 30)  # 30 seconds
        self.cleanup_interval = self.config.get("cleanup_interval", 300)  # 5 minutes
        
        # Load default alerts
        self._load_default_alerts()
    
    def _load_default_alerts(self):
        """Load default rate limiting alerts"""
        default_alerts = [
            RateLimitAlert(
                name="high_block_rate",
                condition="block_rate",
                threshold=0.1,  # 10% block rate
                window_minutes=5,
                webhook_url=self.config.get("alert_webhook_url"),
                email_recipients=self.config.get("alert_emails", [])
            ),
            RateLimitAlert(
                name="excessive_violations",
                condition="violations",
                threshold=100,  # 100 violations in window
                window_minutes=5,
                webhook_url=self.config.get("alert_webhook_url"),
                email_recipients=self.config.get("alert_emails", [])
            ),
            RateLimitAlert(
                name="adaptive_adjustment",
                condition="adaptive_factor",
                threshold=0.5,  # Adaptive factor below 0.5
                window_minutes=10,
                webhook_url=self.config.get("alert_webhook_url"),
                email_recipients=self.config.get("alert_emails", [])
            )
        ]
        
        for alert in default_alerts:
            self.alerts.append(alert)
    
    async def start(self):
        """Start rate limiting service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Start background tasks
        self.analytics_task = asyncio.create_task(self._analytics_collector())
        self.alert_task = asyncio.create_task(self._alert_monitor())
        self.cleanup_task = asyncio.create_task(self._cleanup_task())
        
        self.logger.info("Rate limiting service started",
                        event_type="rate_limit_service_started",
                        analytics_interval=self.analytics_interval,
                        alert_check_interval=self.alert_check_interval,
                        cleanup_interval=self.cleanup_interval
                        )
    
    async def stop(self):
        """Stop rate limiting service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel background tasks
        if self.analytics_task:
            self.analytics_task.cancel()
        if self.alert_task:
            self.alert_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        
        self.logger.info("Rate limiting service stopped",
                        event_type="rate_limit_service_stopped",
                        uptime_seconds=(datetime.now(timezone.utc) - self.start_time).total_seconds()
                        )
    
    async def _analytics_collector(self):
        """Background task to collect analytics"""
        while self.is_running:
            try:
                analytics = await self.collect_analytics()
                self.analytics_history.append(analytics)
                
                # Keep only recent entries
                if len(self.analytics_history) > self.max_analytics_entries:
                    self.analytics_history = self.analytics_history[-self.max_analytics_entries:]
                
                await asyncio.sleep(self.analytics_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Analytics collection error: {e}")
                await asyncio.sleep(60)
    
    async def _alert_monitor(self):
        """Background task to monitor and trigger alerts"""
        while self.is_running:
            try:
                await self._check_alerts()
                await asyncio.sleep(self.alert_check_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Alert monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def _cleanup_task(self):
        """Background task for cleanup operations"""
        while self.is_running:
            try:
                await self.rate_limiter.cleanup_expired_states()
                await self._cleanup_old_analytics()
                await asyncio.sleep(self.cleanup_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Cleanup task error: {e}")
                await asyncio.sleep(60)
    
    async def collect_analytics(self) -> RateLimitAnalytics:
        """Collect current rate limiting analytics"""
        stats = await self.rate_limiter.get_statistics()
        
        # Get top violators
        top_ips = sorted(stats["violations_by_ip"].items(), 
                        key=lambda x: x[1], reverse=True)[:10]
        top_users = sorted(stats["violations_by_user"].items(), 
                          key=lambda x: x[1], reverse=True)[:10]
        top_rules = sorted(stats["violations_by_rule"].items(), 
                         key=lambda x: x[1], reverse=True)[:10]
        
        return RateLimitAnalytics(
            timestamp=datetime.now(timezone.utc),
            total_requests=stats["total_requests"],
            blocked_requests=stats["blocked_requests"],
            block_rate=stats["block_rate"],
            top_violating_ips=top_ips,
            top_violating_users=top_users,
            top_violating_rules=top_rules,
            active_rules_count=stats["enabled_rules"],
            adaptive_adjustments=len([r for r in self.rate_limiter.rules 
                                   if r.strategy == RateLimitStrategy.ADAPTIVE])
        )
    
    async def _check_alerts(self):
        """Check and trigger alerts based on conditions"""
        current_time = datetime.now(timezone.utc)
        
        for alert in self.alerts:
            if not alert.enabled:
                continue
            
            # Check cooldown
            if (alert.name in self.alert_cooldowns and 
                current_time < self.alert_cooldowns[alert.name]):
                continue
            
            # Check alert condition
            should_trigger = await self._evaluate_alert_condition(alert)
            
            if should_trigger:
                await self._trigger_alert(alert)
                self.alert_cooldowns[alert.name] = current_time + timedelta(minutes=alert.cooldown_minutes)
    
    async def _evaluate_alert_condition(self, alert: RateLimitAlert) -> bool:
        """Evaluate if alert condition is met"""
        # Get recent analytics
        window_start = datetime.now(timezone.utc) - timedelta(minutes=alert.window_minutes)
        recent_analytics = [
            a for a in self.analytics_history 
            if a.timestamp >= window_start
        ]
        
        if not recent_analytics:
            return False
        
        latest = recent_analytics[-1]
        
        if alert.condition == "block_rate":
            return latest.block_rate >= alert.threshold
        elif alert.condition == "violations":
            total_violations = sum(a.blocked_requests for a in recent_analytics)
            return total_violations >= alert.threshold
        elif alert.condition == "adaptive_factor":
            # This would need access to adaptive factors - simplified
            return False
        
        return False
    
    async def _trigger_alert(self, alert: RateLimitAlert):
        """Trigger an alert"""
        self.logger.warning(f"Rate limiting alert triggered: {alert.name}")
        
        # Update last triggered time
        alert.last_triggered = datetime.now(timezone.utc)
        
        # Send webhook notification
        if alert.webhook_url:
            await self._send_webhook_alert(alert)
        
        # Send email notification
        if alert.email_recipients:
            await self._send_email_alert(alert)
    
    async def _send_webhook_alert(self, alert: RateLimitAlert):
        """Send webhook alert notification"""
        try:
            import httpx
            
            payload = {
                "alert_name": alert.name,
                "condition": alert.condition,
                "threshold": alert.threshold,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "service": "rate_limiting"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(alert.webhook_url, json=payload, timeout=10)
                response.raise_for_status()
            
            self.logger.info(f"Webhook alert sent for {alert.name}")
            
        except Exception as e:
            self.logger.error(f"Failed to send webhook alert: {e}")
    
    async def _send_email_alert(self, alert: RateLimitAlert):
        """Send email alert notification"""
        try:
            # This would integrate with email service
            self.logger.info(f"Email alert would be sent for {alert.name} to {alert.email_recipients}")
            
        except Exception as e:
            self.logger.error(f"Failed to send email alert: {e}")
    
    async def _cleanup_old_analytics(self):
        """Clean up old analytics data"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        
        original_count = len(self.analytics_history)
        self.analytics_history = [
            a for a in self.analytics_history 
            if a.timestamp >= cutoff_time
        ]
        
        removed_count = original_count - len(self.analytics_history)
        if removed_count > 0:
            self.logger.info(f"Cleaned up {removed_count} old analytics entries")
    
    async def add_rule(self, rule: RateLimitRule) -> bool:
        """Add a new rate limiting rule"""
        try:
            self.rate_limiter.add_rule(rule)
            self.logger.info(f"Added rate limiting rule: {rule.name}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to add rule {rule.name}: {e}")
            return False
    
    async def remove_rule(self, rule_name: str) -> bool:
        """Remove a rate limiting rule"""
        try:
            self.rate_limiter.remove_rule(rule_name)
            self.logger.info(f"Removed rate limiting rule: {rule_name}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to remove rule {rule_name}: {e}")
            return False
    
    async def update_rule(self, rule_name: str, updates: Dict[str, Any]) -> bool:
        """Update an existing rate limiting rule"""
        try:
            # Find existing rule
            existing_rule = None
            for rule in self.rate_limiter.rules:
                if rule.name == rule_name:
                    existing_rule = rule
                    break
            
            if not existing_rule:
                self.logger.error(f"Rule not found: {rule_name}")
                return False
            
            # Create updated rule
            updated_rule = RateLimitRule(
                name=existing_rule.name,
                strategy=RateLimitStrategy(updates.get("strategy", existing_rule.strategy.value)),
                scope=RateLimitScope(updates.get("scope", existing_rule.scope.value)),
                limit=updates.get("limit", existing_rule.limit),
                window=updates.get("window", existing_rule.window),
                action=RateLimitAction(updates.get("action", existing_rule.action.value)),
                priority=updates.get("priority", existing_rule.priority),
                enabled=updates.get("enabled", existing_rule.enabled),
                endpoints=updates.get("endpoints", existing_rule.endpoints),
                methods=updates.get("methods", existing_rule.methods),
                ip_whitelist=updates.get("ip_whitelist", existing_rule.ip_whitelist),
                user_whitelist=updates.get("user_whitelist", existing_rule.user_whitelist),
                burst_limit=updates.get("burst_limit", existing_rule.burst_limit),
                burst_window=updates.get("burst_window", existing_rule.burst_window),
                penalty_factor=updates.get("penalty_factor", existing_rule.penalty_factor),
                adaptive_threshold=updates.get("adaptive_threshold", existing_rule.adaptive_threshold),
                metadata=updates.get("metadata", existing_rule.metadata)
            )
            
            # Remove old rule and add updated one
            self.rate_limiter.remove_rule(rule_name)
            self.rate_limiter.add_rule(updated_rule)
            
            self.logger.info(f"Updated rate limiting rule: {rule_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to update rule {rule_name}: {e}")
            return False
    
    async def get_rules(self) -> List[Dict[str, Any]]:
        """Get all rate limiting rules"""
        rules = []
        for rule in self.rate_limiter.rules:
            rule_dict = asdict(rule)
            # Convert enums to strings
            rule_dict["strategy"] = rule.strategy.value
            rule_dict["scope"] = rule.scope.value
            rule_dict["action"] = rule.action.value
            rules.append(rule_dict)
        
        return rules
    
    async def get_rule(self, rule_name: str) -> Optional[Dict[str, Any]]:
        """Get a specific rate limiting rule"""
        for rule in self.rate_limiter.rules:
            if rule.name == rule_name:
                rule_dict = asdict(rule)
                rule_dict["strategy"] = rule.strategy.value
                rule_dict["scope"] = rule.scope.value
                rule_dict["action"] = rule.action.value
                return rule_dict
        return None
    
    async def get_analytics(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get analytics data for specified hours"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        filtered_analytics = [
            a for a in self.analytics_history 
            if a.timestamp >= cutoff_time
        ]
        
        return [asdict(a) for a in filtered_analytics]
    
    async def get_current_analytics(self) -> Dict[str, Any]:
        """Get current analytics snapshot"""
        analytics = await self.collect_analytics()
        return asdict(analytics)
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive rate limiting statistics"""
        base_stats = await self.rate_limiter.get_statistics()
        
        # Add service-specific stats
        service_stats = {
            "service_status": {
                "is_running": self.is_running,
                "start_time": self.start_time.isoformat() if self.start_time else None,
                "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
            },
            "analytics": {
                "total_entries": len(self.analytics_history),
                "max_entries": self.max_analytics_entries,
                "collection_interval": self.analytics_interval
            },
            "alerts": {
                "total_alerts": len(self.alerts),
                "enabled_alerts": len([a for a in self.alerts if a.enabled]),
                "active_cooldowns": len(self.alert_cooldowns)
            },
            "background_tasks": {
                "analytics_task_running": self.analytics_task and not self.analytics_task.done(),
                "alert_task_running": self.alert_task and not self.alert_task.done(),
                "cleanup_task_running": self.cleanup_task and not self.cleanup_task.done()
            }
        }
        
        # Merge stats
        return {**base_stats, **service_stats}
    
    async def add_alert(self, alert: RateLimitAlert) -> bool:
        """Add a new alert"""
        try:
            self.alerts.append(alert)
            self.logger.info(f"Added rate limiting alert: {alert.name}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to add alert {alert.name}: {e}")
            return False
    
    async def remove_alert(self, alert_name: str) -> bool:
        """Remove an alert"""
        try:
            self.alerts = [a for a in self.alerts if a.name != alert_name]
            if alert_name in self.alert_cooldowns:
                del self.alert_cooldowns[alert_name]
            self.logger.info(f"Removed rate limiting alert: {alert_name}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to remove alert {alert_name}: {e}")
            return False
    
    async def get_alerts(self) -> List[Dict[str, Any]]:
        """Get all alerts"""
        alerts = []
        for alert in self.alerts:
            alert_dict = asdict(alert)
            # Convert datetime to ISO string
            if alert_dict["last_triggered"]:
                alert_dict["last_triggered"] = alert.last_triggered.isoformat()
            alerts.append(alert_dict)
        return alerts
    
    async def reset_user_limits(self, user_id: str) -> bool:
        """Reset rate limits for a specific user"""
        try:
            await self.rate_limiter.reset_user_limits(user_id)
            self.logger.info(f"Reset rate limits for user: {user_id}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to reset limits for user {user_id}: {e}")
            return False
    
    async def reset_ip_limits(self, ip_address: str) -> bool:
        """Reset rate limits for a specific IP"""
        try:
            await self.rate_limiter.reset_ip_limits(ip_address)
            self.logger.info(f"Reset rate limits for IP: {ip_address}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to reset limits for IP {ip_address}: {e}")
            return False
    
    async def block_ip(self, ip_address: str, duration_minutes: int = 60) -> bool:
        """Block an IP address for specified duration"""
        try:
            # Create a strict rule for this IP
            rule = RateLimitRule(
                name=f"block_ip_{ip_address}",
                strategy=RateLimitStrategy.FIXED_WINDOW,
                scope=RateLimitScope.IP,
                limit=0,
                window=duration_minutes * 60,
                action=RateLimitAction.REJECT,
                priority=1,  # Highest priority
                ip_whitelist=set(),  # No whitelist
                metadata={"blocked_at": datetime.now(timezone.utc).isoformat()}
            )
            
            await self.add_rule(rule)
            self.logger.info(f"Blocked IP {ip_address} for {duration_minutes} minutes")
            return True
        except Exception as e:
            self.logger.error(f"Failed to block IP {ip_address}: {e}")
            return False
    
    async def unblock_ip(self, ip_address: str) -> bool:
        """Unblock an IP address"""
        try:
            rule_name = f"block_ip_{ip_address}"
            await self.remove_rule(rule_name)
            self.logger.info(f"Unblocked IP: {ip_address}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to unblock IP {ip_address}: {e}")
            return False
    
    async def get_blocked_ips(self) -> List[Dict[str, Any]]:
        """Get list of currently blocked IPs"""
        blocked_ips = []
        
        for rule in self.rate_limiter.rules:
            if rule.name.startswith("block_ip_"):
                ip_address = rule.name.replace("block_ip_", "")
                blocked_ips.append({
                    "ip_address": ip_address,
                    "rule_name": rule.name,
                    "limit": rule.limit,
                    "window": rule.window,
                    "metadata": rule.metadata
                })
        
        return blocked_ips
    
    async def export_configuration(self) -> Dict[str, Any]:
        """Export rate limiting configuration"""
        return {
            "rules": await self.get_rules(),
            "alerts": await self.get_alerts(),
            "config": self.config,
            "exported_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def import_configuration(self, config: Dict[str, Any]) -> bool:
        """Import rate limiting configuration"""
        try:
            # Import rules
            if "rules" in config:
                for rule_data in config["rules"]:
                    rule = RateLimitRule(
                        name=rule_data["name"],
                        strategy=RateLimitStrategy(rule_data["strategy"]),
                        scope=RateLimitScope(rule_data["scope"]),
                        limit=rule_data["limit"],
                        window=rule_data["window"],
                        action=RateLimitAction(rule_data.get("action", "reject")),
                        priority=rule_data.get("priority", 100),
                        enabled=rule_data.get("enabled", True),
                        endpoints=set(rule_data.get("endpoints", [])),
                        methods=set(rule_data.get("methods", [])),
                        ip_whitelist=set(rule_data.get("ip_whitelist", [])),
                        user_whitelist=set(rule_data.get("user_whitelist", [])),
                        burst_limit=rule_data.get("burst_limit"),
                        burst_window=rule_data.get("burst_window"),
                        penalty_factor=rule_data.get("penalty_factor", 1.0),
                        adaptive_threshold=rule_data.get("adaptive_threshold"),
                        metadata=rule_data.get("metadata")
                    )
                    await self.add_rule(rule)
            
            # Import alerts
            if "alerts" in config:
                for alert_data in config["alerts"]:
                    alert = RateLimitAlert(
                        name=alert_data["name"],
                        condition=alert_data["condition"],
                        threshold=alert_data["threshold"],
                        window_minutes=alert_data["window_minutes"],
                        enabled=alert_data.get("enabled", True),
                        webhook_url=alert_data.get("webhook_url"),
                        email_recipients=alert_data.get("email_recipients"),
                        cooldown_minutes=alert_data.get("cooldown_minutes", 60)
                    )
                    await self.add_alert(alert)
            
            self.logger.info("Rate limiting configuration imported successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to import configuration: {e}")
            return False

# Global rate limit service instance
_rate_limit_service: Optional[RateLimitService] = None

def get_rate_limit_service(config: Dict[str, Any] = None) -> RateLimitService:
    """Get global rate limit service instance"""
    global _rate_limit_service
    if _rate_limit_service is None:
        _rate_limit_service = RateLimitService(config)
    return _rate_limit_service

async def start_rate_limit_service(config: Dict[str, Any] = None) -> RateLimitService:
    """Start rate limit service"""
    service = get_rate_limit_service(config)
    await service.start()
    return service

async def stop_rate_limit_service():
    """Stop rate limit service"""
    service = get_rate_limit_service()
    await service.stop()

if __name__ == "__main__":
    # Example usage
    import asyncio
    
    async def main():
        config = {
            "rate_limiter": {
                "storage": {
                    "type": "memory"
                }
            },
            "analytics_interval": 60,
            "alert_webhook_url": "https://hooks.slack.com/your-webhook",
            "alert_emails": ["admin@example.com"]
        }
        
        service = await start_rate_limit_service(config)
        
        try:
            # Add custom rule
            custom_rule = RateLimitRule(
                name="custom_api_limit",
                strategy=RateLimitStrategy.SLIDING_WINDOW,
                scope=RateLimitScope.USER,
                limit=50,
                window=60
            )
            
            await service.add_rule(custom_rule)
            
            # Get statistics
            stats = await service.get_statistics()
            print(f"Rate limiting stats: {stats}")
            
            # Keep running
            while True:
                await asyncio.sleep(1)
                
        except KeyboardInterrupt:
            print("Shutting down rate limiting service...")
            await stop_rate_limit_service()
    
    asyncio.run(main())

"""
Promotional Campaign Service for PyMastery
Handles marketing automation, campaign management, and promotional offers
"""

import asyncio
import logging
import json
import time
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
from pathlib import Path
import statistics
from collections import deque

logger = logging.getLogger(__name__)

class CampaignStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CampaignType(Enum):
    DISCOUNT = "discount"
    PROMOTION = "promotion"
    FLASH_SALE = "flash_sale"
    SEASONAL = "seasonal"
    NEW_USER = "new_user"
    RETENTION = "retention"
    REACTIVATION = "reactivation"
    REFERRAL = "referral"

class TriggerType(Enum):
    USER_REGISTRATION = "user_registration"
    PURCHASE = "purchase"
    COURSE_COMPLETION = "course_completion"
    LOGIN_ACTIVITY = "login_activity"
    INACTIVITY = "inactivity"
    MILESTONE = "milestone"
    CUSTOM = "custom"

class ActionType(Enum):
    EMAIL = "email"
    NOTIFICATION = "notification"
    DISCOUNT_CODE = "discount_code"
    FEATURE_UNLOCK = "feature_unlock"
    BADGE_AWARD = "badge_award"
    POINTS_AWARD = "points_award"

@dataclass
class PromotionalCampaign:
    """Promotional campaign configuration"""
    id: str
    name: str
    description: str
    campaign_type: CampaignType
    status: CampaignStatus
    start_date: datetime
    end_date: Optional[datetime]
    target_audience: Dict[str, Any]
    budget: float
    currency: str
    rules: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = None

@dataclass
class CampaignTrigger:
    """Campaign trigger configuration"""
    id: str
    campaign_id: str
    trigger_type: TriggerType
    trigger_conditions: Dict[str, Any]
    is_active: bool
    created_at: datetime

@dataclass
class CampaignAction:
    """Campaign action configuration"""
    id: str
    campaign_id: str
    action_type: ActionType
    action_config: Dict[str, Any]
    delay_minutes: int
    is_active: bool
    created_at: datetime

@dataclass
class CampaignExecution:
    """Campaign execution record"""
    id: str
    campaign_id: str
    user_id: str
    trigger_id: str
    action_id: str
    execution_date: datetime
    status: str
    result: Dict[str, Any]
    error_message: Optional[str] = None

@dataclass
class DiscountCode:
    """Discount code for campaigns"""
    id: str
    campaign_id: str
    code: str
    discount_type: str  # percentage, fixed_amount
    discount_value: float
    max_uses: int
    current_uses: int
    expires_at: Optional[datetime]
    is_active: bool
    created_at: datetime

@dataclass
class CampaignAnalytics:
    """Campaign analytics data"""
    id: str
    campaign_id: str
    period_start: datetime
    period_end: datetime
    total_executions: int
    successful_executions: int
    failed_executions: int
    conversion_rate: float
    revenue_generated: float
    cost_incurred: float
    roi: float
    generated_at: datetime

class PromotionalCampaignService:
    """Promotional campaign service for PyMastery"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Initialize state
        self.is_running = False
        self.start_time = None
        
        # Campaigns
        self.campaigns: Dict[str, PromotionalCampaign] = {}
        
        # Triggers and actions
        self.triggers: Dict[str, List[CampaignTrigger]] = {}
        self.actions: Dict[str, List[CampaignAction]] = {}
        
        # Executions
        self.executions: Dict[str, List[CampaignExecution]] = {}
        
        # Discount codes
        self.discount_codes: Dict[str, DiscountCode] = {}
        
        # Analytics
        self.analytics: List[CampaignAnalytics] = []
        
        # Event queue for processing
        self.event_queue: deque = deque(maxlen=10000)
        
        # HTTP session
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Background tasks
        self.processor_task: Optional[asyncio.Task] = None
        self.analytics_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        self.scheduler_task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the promotional campaign service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Create HTTP session
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        
        # Start background tasks
        self.processor_task = asyncio.create_task(self._event_processor_loop())
        self.analytics_task = asyncio.create_task(self._analytics_loop())
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        self.scheduler_task = asyncio.create_task(self._scheduler_loop())
        
        logger.info("Promotional campaign service started",
                   extra_fields={
                       "event_type": "promotional_campaign_service_started"
                   })
    
    async def stop(self):
        """Stop the promotional campaign service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel background tasks
        if self.processor_task:
            self.processor_task.cancel()
        if self.analytics_task:
            self.analytics_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        if self.scheduler_task:
            self.scheduler_task.cancel()
        
        # Close HTTP session
        if self.session:
            await self.session.close()
        
        logger.info("Promotional campaign service stopped",
                   extra_fields={
                       "event_type": "promotional_campaign_service_stopped"
                   })
    
    async def create_campaign(self, campaign_data: Dict[str, Any]) -> PromotionalCampaign:
        """Create a new promotional campaign"""
        try:
            campaign = PromotionalCampaign(
                id=f"campaign_{int(time.time())}_{campaign_data['name'].replace(' ', '_').lower()}",
                name=campaign_data["name"],
                description=campaign_data.get("description", ""),
                campaign_type=CampaignType(campaign_data["campaign_type"]),
                status=CampaignStatus.DRAFT,
                start_date=campaign_data["start_date"],
                end_date=campaign_data.get("end_date"),
                target_audience=campaign_data.get("target_audience", {}),
                budget=campaign_data.get("budget", 0.0),
                currency=campaign_data.get("currency", "USD"),
                rules=campaign_data.get("rules", {}),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                metadata=campaign_data.get("metadata", {})
            )
            
            # Store campaign
            self.campaigns[campaign.id] = campaign
            
            # Initialize triggers and actions
            self.triggers[campaign.id] = []
            self.actions[campaign.id] = []
            self.executions[campaign.id] = []
            
            logger.info(f"Promotional campaign created: {campaign.id}",
                       extra_fields={
                           "event_type": "promotional_campaign_created",
                           "campaign_id": campaign.id,
                           "campaign_name": campaign.name,
                           "campaign_type": campaign.campaign_type.value
                       })
            
            return campaign
        
        except Exception as e:
            logger.error(f"Failed to create promotional campaign: {e}")
            raise
    
    async def add_campaign_trigger(self, campaign_id: str, trigger_data: Dict[str, Any]) -> CampaignTrigger:
        """Add a trigger to a campaign"""
        try:
            campaign = self.campaigns.get(campaign_id)
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            
            trigger = CampaignTrigger(
                id=f"trigger_{int(time.time())}_{campaign_id}",
                campaign_id=campaign_id,
                trigger_type=TriggerType(trigger_data["trigger_type"]),
                trigger_conditions=trigger_data.get("trigger_conditions", {}),
                is_active=trigger_data.get("is_active", True),
                created_at=datetime.now(timezone.utc)
            )
            
            # Store trigger
            self.triggers[campaign_id].append(trigger)
            
            logger.info(f"Campaign trigger added: {trigger.id}",
                       extra_fields={
                           "event_type": "campaign_trigger_added",
                           "trigger_id": trigger.id,
                           "campaign_id": campaign_id,
                           "trigger_type": trigger.trigger_type.value
                       })
            
            return trigger
        
        except Exception as e:
            logger.error(f"Failed to add campaign trigger: {e}")
            raise
    
    async def add_campaign_action(self, campaign_id: str, action_data: Dict[str, Any]) -> CampaignAction:
        """Add an action to a campaign"""
        try:
            campaign = self.campaigns.get(campaign_id)
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            
            action = CampaignAction(
                id=f"action_{int(time.time())}_{campaign_id}",
                campaign_id=campaign_id,
                action_type=ActionType(action_data["action_type"]),
                action_config=action_data.get("action_config", {}),
                delay_minutes=action_data.get("delay_minutes", 0),
                is_active=action_data.get("is_active", True),
                created_at=datetime.now(timezone.utc)
            )
            
            # Store action
            self.actions[campaign_id].append(action)
            
            logger.info(f"Campaign action added: {action.id}",
                       extra_fields={
                           "event_type": "campaign_action_added",
                           "action_id": action.id,
                           "campaign_id": campaign_id,
                           "action_type": action.action_type.value
                       })
            
            return action
        
        except Exception as e:
            logger.error(f"Failed to add campaign action: {e}")
            raise
    
    async def launch_campaign(self, campaign_id: str) -> bool:
        """Launch a promotional campaign"""
        try:
            campaign = self.campaigns.get(campaign_id)
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            
            if campaign.status != CampaignStatus.DRAFT:
                raise ValueError(f"Campaign {campaign_id} is not in draft status")
            
            # Update campaign status
            campaign.status = CampaignStatus.ACTIVE
            campaign.updated_at = datetime.now(timezone.utc)
            
            logger.info(f"Campaign launched: {campaign_id}",
                       extra_fields={
                           "event_type": "campaign_launched",
                           "campaign_id": campaign_id,
                           "campaign_name": campaign.name
                       })
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to launch campaign: {e}")
            return False
    
    async def trigger_campaign_event(self, trigger_type: str, user_id: str, event_data: Dict[str, Any] = None):
        """Trigger a campaign event"""
        try:
            # Add event to queue for processing
            event = {
                "trigger_type": trigger_type,
                "user_id": user_id,
                "event_data": event_data or {},
                "timestamp": datetime.now(timezone.utc)
            }
            
            self.event_queue.append(event)
            
            logger.debug(f"Campaign event queued: {trigger_type} for user {user_id}")
        
        except Exception as e:
            logger.error(f"Failed to trigger campaign event: {e}")
    
    async def _event_processor_loop(self):
        """Process campaign events from queue"""
        while self.is_running:
            try:
                if self.event_queue:
                    event = self.event_queue.popleft()
                    await self._process_campaign_event(event)
                else:
                    await asyncio.sleep(1)  # Wait for events
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Event processor loop error: {e}")
                await asyncio.sleep(5)
    
    async def _process_campaign_event(self, event: Dict[str, Any]):
        """Process a single campaign event"""
        try:
            trigger_type = TriggerType(event["trigger_type"])
            user_id = event["user_id"]
            event_data = event["event_data"]
            
            # Find matching triggers
            matching_triggers = []
            for campaign_id, triggers in self.triggers.items():
                campaign = self.campaigns.get(campaign_id)
                if not campaign or campaign.status != CampaignStatus.ACTIVE:
                    continue
                
                for trigger in triggers:
                    if (trigger.trigger_type == trigger_type and 
                        trigger.is_active and
                        await self._evaluate_trigger_conditions(trigger, user_id, event_data)):
                        matching_triggers.append((campaign, trigger))
            
            # Execute actions for matching triggers
            for campaign, trigger in matching_triggers:
                await self._execute_campaign_actions(campaign, trigger, user_id, event_data)
        
        except Exception as e:
            logger.error(f"Failed to process campaign event: {e}")
    
    async def _evaluate_trigger_conditions(self, trigger: CampaignTrigger, user_id: str, event_data: Dict[str, Any]) -> bool:
        """Evaluate if trigger conditions are met"""
        try:
            conditions = trigger.trigger_conditions
            
            # Check user segment conditions
            if "user_segments" in conditions:
                # This would check if user belongs to required segments
                pass
            
            # Check time conditions
            if "time_conditions" in conditions:
                time_conditions = conditions["time_conditions"]
                now = datetime.now(timezone.utc)
                
                if "hour_of_day" in time_conditions:
                    if now.hour not in time_conditions["hour_of_day"]:
                        return False
                
                if "day_of_week" in time_conditions:
                    if now.weekday() not in time_conditions["day_of_week"]:
                        return False
            
            # Check event-specific conditions
            if trigger.trigger_type == TriggerType.PURCHASE:
                if "min_purchase_amount" in conditions:
                    purchase_amount = event_data.get("purchase_amount", 0)
                    if purchase_amount < conditions["min_purchase_amount"]:
                        return False
            
            elif trigger.trigger_type == TriggerType.INACTIVITY:
                if "min_inactive_days" in conditions:
                    last_active = event_data.get("last_active")
                    if last_active:
                        days_inactive = (datetime.now(timezone.utc) - last_active).days
                        if days_inactive < conditions["min_inactive_days"]:
                            return False
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to evaluate trigger conditions: {e}")
            return False
    
    async def _execute_campaign_actions(self, campaign: PromotionalCampaign, trigger: CampaignTrigger, user_id: str, event_data: Dict[str, Any]):
        """Execute actions for a campaign trigger"""
        try:
            actions = self.actions.get(campaign.id, [])
            
            for action in actions:
                if not action.is_active:
                    continue
                
                # Apply delay if specified
                if action.delay_minutes > 0:
                    await asyncio.sleep(action.delay_minutes * 60)
                
                # Execute action
                await self._execute_action(action, campaign, user_id, event_data)
        
        except Exception as e:
            logger.error(f"Failed to execute campaign actions: {e}")
    
    async def _execute_action(self, action: CampaignAction, campaign: PromotionalCampaign, user_id: str, event_data: Dict[str, Any]):
        """Execute a single campaign action"""
        try:
            execution_id = f"exec_{int(time.time())}_{action.id}_{user_id}"
            
            execution = CampaignExecution(
                id=execution_id,
                campaign_id=campaign.id,
                user_id=user_id,
                trigger_id="",  # Would be populated from trigger
                action_id=action.id,
                execution_date=datetime.now(timezone.utc),
                status="processing",
                result={}
            )
            
            # Store execution
            if campaign.id not in self.executions:
                self.executions[campaign.id] = []
            self.executions[campaign.id].append(execution)
            
            try:
                if action.action_type == ActionType.EMAIL:
                    result = await self._execute_email_action(action, user_id, event_data)
                elif action.action_type == ActionType.NOTIFICATION:
                    result = await self._execute_notification_action(action, user_id, event_data)
                elif action.action_type == ActionType.DISCOUNT_CODE:
                    result = await self._execute_discount_code_action(action, user_id, event_data)
                elif action.action_type == ActionType.FEATURE_UNLOCK:
                    result = await self._execute_feature_unlock_action(action, user_id, event_data)
                elif action.action_type == ActionType.BADGE_AWARD:
                    result = await self._execute_badge_award_action(action, user_id, event_data)
                elif action.action_type == ActionType.POINTS_AWARD:
                    result = await self._execute_points_award_action(action, user_id, event_data)
                else:
                    result = {"error": f"Unknown action type: {action.action_type}"}
                
                execution.status = "completed"
                execution.result = result
                
                logger.info(f"Campaign action executed: {action.id}",
                           extra_fields={
                               "event_type": "campaign_action_executed",
                               "action_id": action.id,
                               "campaign_id": campaign.id,
                               "user_id": user_id,
                               "action_type": action.action_type.value
                           })
            
            except Exception as e:
                execution.status = "failed"
                execution.error_message = str(e)
                logger.error(f"Failed to execute campaign action: {e}")
        
        except Exception as e:
            logger.error(f"Failed to execute action: {e}")
    
    async def _execute_email_action(self, action: CampaignAction, user_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute email action"""
        try:
            config = action.action_config
            
            # Get user email (would integrate with user service)
            user_email = f"user{user_id}@example.com"  # Placeholder
            
            # Send email (would integrate with email service)
            # For now, just log the action
            logger.info(f"Email action executed for user {user_id}: {config.get('subject')}")
            
            return {
                "action": "email_sent",
                "recipient": user_email,
                "subject": config.get("subject"),
                "template": config.get("template")
            }
        
        except Exception as e:
            logger.error(f"Failed to execute email action: {e}")
            return {"error": str(e)}
    
    async def _execute_notification_action(self, action: CampaignAction, user_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute notification action"""
        try:
            config = action.action_config
            
            # Send notification (would integrate with notification service)
            logger.info(f"Notification action executed for user {user_id}: {config.get('message')}")
            
            return {
                "action": "notification_sent",
                "user_id": user_id,
                "message": config.get("message"),
                "type": config.get("type", "info")
            }
        
        except Exception as e:
            logger.error(f"Failed to execute notification action: {e}")
            return {"error": str(e)}
    
    async def _execute_discount_code_action(self, action: CampaignAction, user_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute discount code action"""
        try:
            config = action.action_config
            
            # Generate discount code
            discount_code = await self._generate_discount_code(action.campaign_id, config)
            
            # Assign code to user (would integrate with user service)
            logger.info(f"Discount code generated for user {user_id}: {discount_code.code}")
            
            return {
                "action": "discount_code_generated",
                "discount_code": discount_code.code,
                "discount_value": discount_code.discount_value,
                "discount_type": discount_code.discount_type
            }
        
        except Exception as e:
            logger.error(f"Failed to execute discount code action: {e}")
            return {"error": str(e)}
    
    async def _execute_feature_unlock_action(self, action: CampaignAction, user_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute feature unlock action"""
        try:
            config = action.action_config
            feature_name = config.get("feature_name")
            
            # Unlock feature (would integrate with user service)
            logger.info(f"Feature unlocked for user {user_id}: {feature_name}")
            
            return {
                "action": "feature_unlocked",
                "user_id": user_id,
                "feature": feature_name,
                "duration_days": config.get("duration_days")
            }
        
        except Exception as e:
            logger.error(f"Failed to execute feature unlock action: {e}")
            return {"error": str(e)}
    
    async def _execute_badge_award_action(self, action: CampaignAction, user_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute badge award action"""
        try:
            config = action.action_config
            badge_name = config.get("badge_name")
            
            # Award badge (would integrate with gamification service)
            logger.info(f"Badge awarded to user {user_id}: {badge_name}")
            
            return {
                "action": "badge_awarded",
                "user_id": user_id,
                "badge": badge_name,
                "badge_description": config.get("badge_description")
            }
        
        except Exception as e:
            logger.error(f"Failed to execute badge award action: {e}")
            return {"error": str(e)}
    
    async def _execute_points_award_action(self, action: CampaignAction, user_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute points award action"""
        try:
            config = action.action_config
            points = config.get("points", 0)
            
            # Award points (would integrate with gamification service)
            logger.info(f"Points awarded to user {user_id}: {points}")
            
            return {
                "action": "points_awarded",
                "user_id": user_id,
                "points": points,
                "reason": config.get("reason")
            }
        
        except Exception as e:
            logger.error(f"Failed to execute points award action: {e}")
            return {"error": str(e)}
    
    async def _generate_discount_code(self, campaign_id: str, config: Dict[str, Any]) -> DiscountCode:
        """Generate a discount code for a campaign"""
        try:
            # Generate unique code
            while True:
                code = self._generate_code()
                if not self._discount_code_exists(code):
                    break
            
            discount_code = DiscountCode(
                id=f"discount_{int(time.time())}_{campaign_id}",
                campaign_id=campaign_id,
                code=code,
                discount_type=config.get("discount_type", "percentage"),
                discount_value=config.get("discount_value", 10.0),
                max_uses=config.get("max_uses", 100),
                current_uses=0,
                expires_at=datetime.now(timezone.utc) + timedelta(days=config.get("expires_days", 30)),
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            
            # Store discount code
            self.discount_codes[discount_code.id] = discount_code
            
            return discount_code
        
        except Exception as e:
            logger.error(f"Failed to generate discount code: {e}")
            raise
    
    def _generate_code(self) -> str:
        """Generate a unique discount code"""
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return ''.join(secrets.choice(chars) for _ in range(8))
    
    def _discount_code_exists(self, code: str) -> bool:
        """Check if discount code already exists"""
        return any(dc.code == code for dc in self.discount_codes.values())
    
    async def get_campaign_analytics(self, campaign_id: str, period_start: datetime, period_end: datetime) -> CampaignAnalytics:
        """Generate analytics for a campaign"""
        try:
            campaign = self.campaigns.get(campaign_id)
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            
            # Get executions in period
            campaign_executions = self.executions.get(campaign_id, [])
            period_executions = [
                exec for exec in campaign_executions
                if period_start <= exec.execution_date <= period_end
            ]
            
            total_executions = len(period_executions)
            successful_executions = len([exec for exec in period_executions if exec.status == "completed"])
            failed_executions = len([exec for exec in period_executions if exec.status == "failed"])
            
            conversion_rate = (successful_executions / total_executions * 100) if total_executions > 0 else 0
            
            # Calculate revenue and cost (would integrate with payment service)
            revenue_generated = successful_executions * 25.0  # Estimated $25 per conversion
            cost_incurred = total_executions * 2.0  # Estimated $2 per execution
            
            roi = ((revenue_generated - cost_incurred) / cost_incurred * 100) if cost_incurred > 0 else 0
            
            analytics = CampaignAnalytics(
                id=f"analytics_{campaign_id}_{int(period_start.timestamp())}",
                campaign_id=campaign_id,
                period_start=period_start,
                period_end=period_end,
                total_executions=total_executions,
                successful_executions=successful_executions,
                failed_executions=failed_executions,
                conversion_rate=conversion_rate,
                revenue_generated=revenue_generated,
                cost_incurred=cost_incurred,
                roi=roi,
                generated_at=datetime.now(timezone.utc)
            )
            
            # Store analytics
            self.analytics.append(analytics)
            
            return analytics
        
        except Exception as e:
            logger.error(f"Failed to generate campaign analytics: {e}")
            raise
    
    async def _analytics_loop(self):
        """Background analytics loop"""
        while self.is_running:
            try:
                # Generate analytics for all active campaigns
                for campaign in self.campaigns.values():
                    if campaign.status == CampaignStatus.ACTIVE:
                        # Generate daily analytics
                        now = datetime.now(timezone.utc)
                        period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                        period_end = period_start + timedelta(days=1)
                        
                        await self.get_campaign_analytics(campaign.id, period_start, period_end)
                
                # Sleep until next analytics cycle
                await asyncio.sleep(86400)  # Generate daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Analytics loop error: {e}")
                await asyncio.sleep(86400)
    
    async def _scheduler_loop(self):
        """Background scheduler for scheduled campaigns"""
        while self.is_running:
            try:
                now = datetime.now(timezone.utc)
                
                # Check for campaigns to start
                for campaign in self.campaigns.values():
                    if (campaign.status == CampaignStatus.SCHEDULED and
                        campaign.start_date <= now):
                        # Launch campaign
                        campaign.status = CampaignStatus.ACTIVE
                        campaign.updated_at = now
                        
                        logger.info(f"Scheduled campaign started: {campaign.id}")
                
                # Check for campaigns to end
                for campaign in self.campaigns.values():
                    if (campaign.status == CampaignStatus.ACTIVE and
                        campaign.end_date and
                        campaign.end_date <= now):
                        # End campaign
                        campaign.status = CampaignStatus.COMPLETED
                        campaign.updated_at = now
                        
                        logger.info(f"Campaign ended: {campaign.id}")
                
                # Sleep until next check
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                await asyncio.sleep(300)
    
    async def _cleanup_loop(self):
        """Cleanup old data"""
        while self.is_running:
            try:
                # Clean up old analytics
                cutoff_date = datetime.now(timezone.utc) - timedelta(days=90)
                
                self.analytics = [
                    analytics for analytics in self.analytics
                    if analytics.generated_at >= cutoff_date
                ]
                
                # Clean up old executions
                for campaign_id, executions in self.executions.items():
                    self.executions[campaign_id] = [
                        exec for exec in executions
                        if exec.execution_date >= cutoff_date
                    ]
                
                logger.debug("Promotional campaign data cleanup completed")
                
                # Sleep until next cleanup
                await asyncio.sleep(86400)  # Clean up daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup loop error: {e}")
                await asyncio.sleep(86400)
    
    def get_promotional_campaign_service_status(self) -> Dict[str, Any]:
        """Get promotional campaign service status"""
        try:
            # Calculate statistics
            total_campaigns = len(self.campaigns)
            active_campaigns = len([c for c in self.campaigns.values() if c.status == CampaignStatus.ACTIVE])
            
            total_triggers = sum(len(triggers) for triggers in self.triggers.values())
            total_actions = sum(len(actions) for actions in self.actions.values())
            
            total_executions = sum(len(executions) for executions in self.executions.values())
            
            total_discount_codes = len(self.discount_codes)
            active_discount_codes = len([dc for dc in self.discount_codes.values() if dc.is_active])
            
            # Queue size
            queue_size = len(self.event_queue)
            
            return {
                "service_status": {
                    "is_running": self.is_running,
                    "start_time": self.start_time.isoformat() if self.start_time else None,
                    "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
                },
                "campaign_stats": {
                    "total_campaigns": total_campaigns,
                    "active_campaigns": active_campaigns,
                    "draft_campaigns": len([c for c in self.campaigns.values() if c.status == CampaignStatus.DRAFT]),
                    "completed_campaigns": len([c for c in self.campaigns.values() if c.status == CampaignStatus.COMPLETED])
                },
                "automation_stats": {
                    "total_triggers": total_triggers,
                    "total_actions": total_actions,
                    "total_executions": total_executions,
                    "queue_size": queue_size
                },
                "discount_stats": {
                    "total_discount_codes": total_discount_codes,
                    "active_discount_codes": active_discount_codes
                },
                "analytics_stats": {
                    "total_analytics": len(self.analytics)
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get promotional campaign service status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global promotional campaign service instance
promotional_campaign_service: Optional[PromotionalCampaignService] = None

def get_promotional_campaign_service(config: Dict[str, Any] = None) -> PromotionalCampaignService:
    """Get or create promotional campaign service instance"""
    global promotional_campaign_service
    if promotional_campaign_service is None:
        promotional_campaign_service = PromotionalCampaignService(config)
    return promotional_campaign_service

async def start_promotional_campaign_service(config: Dict[str, Any] = None) -> PromotionalCampaignService:
    """Start promotional campaign service"""
    service = get_promotional_campaign_service(config)
    await service.start()
    return service

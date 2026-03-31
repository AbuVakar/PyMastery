"""
Email Marketing Service for PyMastery
Handles email campaigns, template management, and email delivery
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

class EmailStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"

class EmailType(Enum):
    PROMOTIONAL = "promotional"
    TRANSACTIONAL = "transactional"
    NEWSLETTER = "newsletter"
    ONBOARDING = "onboarding"
    RETENTION = "retention"
    REENGAGEMENT = "reenagement"
    ANNOUNCEMENT = "announcement"

class CampaignStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TemplateType(Enum):
    MARKETING = "marketing"
    TRANSACTIONAL = "transactional"
    NOTIFICATION = "notification"
    NEWSLETTER = "newsletter"

@dataclass
class EmailTemplate:
    """Email template configuration"""
    id: str
    name: str
    subject: str
    html_content: str
    text_content: str
    template_type: TemplateType
    variables: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = None

@dataclass
class EmailCampaign:
    """Email campaign configuration"""
    id: str
    name: str
    description: str
    campaign_type: EmailType
    template_id: str
    status: CampaignStatus
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    target_audience: Dict[str, Any]
    personalization: Dict[str, Any]
    tracking_enabled: bool
    created_at: datetime
    updated_at: datetime

@dataclass
class EmailList:
    """Email list for segmentation"""
    id: str
    name: str
    description: str
    criteria: Dict[str, Any]
    subscriber_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

@dataclass
class EmailMessage:
    """Individual email message"""
    id: str
    campaign_id: Optional[str]
    template_id: str
    recipient_email: str
    recipient_name: str
    subject: str
    html_content: str
    text_content: str
    status: EmailStatus
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    opened_at: Optional[datetime]
    clicked_at: Optional[datetime]
    bounced_at: Optional[datetime]
    error_message: Optional[str]
    tracking_id: str
    created_at: datetime

@dataclass
class EmailAnalytics:
    """Email campaign analytics"""
    id: str
    campaign_id: str
    period_start: datetime
    period_end: datetime
    total_sent: int
    total_delivered: int
    total_opened: int
    total_clicked: int
    total_bounced: int
    total_failed: int
    delivery_rate: float
    open_rate: float
    click_rate: float
    bounce_rate: float
    generated_at: datetime

class EmailMarketingService:
    """Email marketing service for PyMastery"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Initialize state
        self.is_running = False
        self.start_time = None
        
        # Templates
        self.templates: Dict[str, EmailTemplate] = {}
        self._initialize_templates()
        
        # Campaigns
        self.campaigns: Dict[str, EmailCampaign] = {}
        
        # Email lists
        self.email_lists: Dict[str, EmailList] = {}
        
        # Messages
        self.messages: Dict[str, List[EmailMessage]] = {}
        
        # Analytics
        self.analytics: List[EmailAnalytics] = []
        
        # Email queue for processing
        self.email_queue: deque = deque(maxlen=10000)
        
        # SMTP configuration (would integrate with email service)
        self.smtp_config = self.config.get("smtp", {})
        
        # HTTP session
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Background tasks
        self.sender_task: Optional[asyncio.Task] = None
        self.analytics_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        self.scheduler_task: Optional[asyncio.Task] = None
    
    def _initialize_templates(self):
        """Initialize default email templates"""
        self.templates = {
            "welcome_email": EmailTemplate(
                id="welcome_email",
                name="Welcome Email",
                subject="Welcome to PyMastery! 🎉",
                html_content=self._get_welcome_html_template(),
                text_content=self._get_welcome_text_template(),
                template_type=TemplateType.ONBOARDING,
                variables=["user_name", "verification_link", "dashboard_link"],
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                metadata={"category": "onboarding"}
            ),
            
            "newsletter_template": EmailTemplate(
                id="newsletter_template",
                name="Monthly Newsletter",
                subject="PyMastery Monthly Newsletter - {{month}} {{year}}",
                html_content=self._get_newsletter_html_template(),
                text_content=self._get_newsletter_text_template(),
                template_type=TemplateType.NEWSLETTER,
                variables=["user_name", "month", "year", "top_courses", "new_features"],
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                metadata={"category": "newsletter"}
            ),
            
            "promotion_template": EmailTemplate(
                id="promotion_template",
                name="Promotional Email",
                subject="🔥 Special Offer: {{discount_percentage}}% Off Premium Features!",
                html_content=self._get_promotion_html_template(),
                text_content=self._get_promotion_text_template(),
                template_type=TemplateType.MARKETING,
                variables=["user_name", "discount_percentage", "discount_code", "offer_end_date"],
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                metadata={"category": "promotion"}
            ),
            
            "course_completion": EmailTemplate(
                id="course_completion",
                name="Course Completion",
                subject="🎊 Congratulations! You've Completed {{course_name}}!",
                html_content=self._get_completion_html_template(),
                text_content=self._get_completion_text_template(),
                template_type=TemplateType.TRANSACTIONAL,
                variables=["user_name", "course_name", "certificate_link", "next_courses"],
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                metadata={"category": "achievement"}
            ),
            
            "retention_email": EmailTemplate(
                id="retention_email",
                name="Retention Email",
                subject="We Miss You! Here's {{discount_percentage}}% to Come Back",
                html_content=self._get_retention_html_template(),
                text_content=self._get_retention_text_template(),
                template_type=TemplateType.RETENTION,
                variables=["user_name", "discount_percentage", "discount_code", "last_login"],
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                metadata={"category": "retention"}
            )
        }
    
    def _get_welcome_html_template(self) -> str:
        """Get welcome email HTML template"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to PyMastery</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">Welcome to PyMastery! 🎉</h1>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p>Hi {{user_name}},</p>
                    <p>Welcome to PyMastery! We're excited to have you join our community of learners.</p>
                    <p>To get started, please verify your email address by clicking the button below:</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{verification_link}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p>Once verified, you can:</p>
                    <ul>
                        <li>Access our comprehensive Python courses</li>
                        <li>Track your learning progress</li>
                        <li>Connect with other learners</li>
                        <li>Earn certificates and badges</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{{dashboard_link}}" style="color: #2563eb; text-decoration: none;">Go to Dashboard →</a>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
                    <p>© 2024 PyMastery. All rights reserved.</p>
                    <p>If you didn't sign up for PyMastery, please ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _get_welcome_text_template(self) -> str:
        """Get welcome email text template"""
        return """
        Welcome to PyMastery! 🎉
        
        Hi {{user_name}},
        
        Welcome to PyMastery! We're excited to have you join our community of learners.
        
        To get started, please verify your email address by visiting:
        {{verification_link}}
        
        Once verified, you can:
        - Access our comprehensive Python courses
        - Track your learning progress
        - Connect with other learners
        - Earn certificates and badges
        
        Go to your dashboard: {{dashboard_link}}
        
        © 2024 PyMastery. All rights reserved.
        If you didn't sign up for PyMastery, please ignore this email.
        """
    
    def _get_newsletter_html_template(self) -> str:
        """Get newsletter HTML template"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>PyMastery Newsletter - {{month}} {{year}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">PyMastery Newsletter</h1>
                    <p style="color: #666; margin: 5px 0;">{{month}} {{year}}</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p>Hi {{user_name}},</p>
                    <p>Here's what's new at PyMastery this month!</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #2563eb;">📚 Top Courses This Month</h2>
                    {{#each top_courses}}
                    <div style="margin-bottom: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                        <h3 style="margin: 0 0 5px 0;">{{title}}</h3>
                        <p style="margin: 0; color: #666;">{{description}}</p>
                    </div>
                    {{/each}}
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #2563eb;">🚀 New Features</h2>
                    {{#each new_features}}
                    <div style="margin-bottom: 10px;">
                        <strong>{{name}}:</strong> {{description}}
                    </div>
                    {{/each}}
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://pymastery.com/dashboard" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
                    <p>© 2024 PyMastery. All rights reserved.</p>
                    <p><a href="https://pymastery.com/unsubscribe">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _get_newsletter_text_template(self) -> str:
        """Get newsletter text template"""
        return """
        PyMastery Newsletter - {{month}} {{year}}
        
        Hi {{user_name}},
        
        Here's what's new at PyMastery this month!
        
        📚 Top Courses This Month
        {{#each top_courses}}
        {{title}} - {{description}}
        {{/each}}
        
        🚀 New Features
        {{#each new_features}}
        {{name}}: {{description}}
        {{/each}}
        
        View your dashboard: https://pymastery.com/dashboard
        
        © 2024 PyMastery. All rights reserved.
        Unsubscribe: https://pymastery.com/unsubscribe
        """
    
    def _get_promotion_html_template(self) -> str:
        """Get promotional email HTML template"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Special Offer - {{discount_percentage}}% Off</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #dc2626; margin: 0;">🔥 Special Offer!</h1>
                    <p style="color: #666; margin: 5px 0;">Limited Time Deal</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p>Hi {{user_name}},</p>
                    <p>Get <strong>{{discount_percentage}}% OFF</strong> on Premium Features!</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; padding: 20px; background-color: #fef2f2; border-radius: 10px; border: 2px solid #dc2626;">
                        <div style="font-size: 36px; font-weight: bold; color: #dc2626;">{{discount_percentage}}% OFF</div>
                        <div style="color: #666;">Premium Features</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://pymastery.com/upgrade?code={{discount_code}}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">Claim Your Discount</a>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p><strong>Use code:</strong> <span style="background-color: #f3f4f6; padding: 5px 10px; border-radius: 3px; font-family: monospace;">{{discount_code}}</span></p>
                    <p><strong>Offer expires:</strong> {{offer_end_date}}</p>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
                    <p>© 2024 PyMastery. All rights reserved.</p>
                    <p><a href="https://pymastery.com/unsubscribe">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _get_promotion_text_template(self) -> str:
        """Get promotional email text template"""
        return """
        🔥 Special Offer!
        
        Hi {{user_name}},
        
        Get {{discount_percentage}}% OFF on Premium Features!
        
        Use code: {{discount_code}}
        Offer expires: {{offer_end_date}}
        
        Claim your discount: https://pymastery.com/upgrade?code={{discount_code}}
        
        © 2024 PyMastery. All rights reserved.
        Unsubscribe: https://pymastery.com/unsubscribe
        """
    
    def _get_completion_html_template(self) -> str:
        """Get course completion HTML template"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Congratulations! Course Completed</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #10b981; margin: 0;">🎊 Congratulations!</h1>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p>Hi {{user_name}},</p>
                    <p>You've successfully completed <strong>{{course_name}}</strong>!</p>
                    <p>Your dedication and hard work have paid off!</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; padding: 20px; background-color: #ecfdf5; border-radius: 10px; border: 2px solid #10b981;">
                        <div style="font-size: 24px; font-weight: bold; color: #10b981;">Course Completed!</div>
                        <div style="color: #666;">{{course_name}}</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{certificate_link}}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Certificate</a>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #10b981;">What's Next?</h3>
                    <p>Continue your learning journey with these recommended courses:</p>
                    {{#each next_courses}}
                    <div style="margin-bottom: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                        <strong>{{title}}</strong> - {{description}}
                    </div>
                    {{/each}}
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
                    <p>© 2024 PyMastery. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _get_completion_text_template(self) -> str:
        """Get course completion text template"""
        return """
        🎊 Congratulations!
        
        Hi {{user_name}},
        
        You've successfully completed {{course_name}}!
        
        Your dedication and hard work have paid off!
        
        View your certificate: {{certificate_link}}
        
        What's Next?
        Continue your learning journey with these recommended courses:
        {{#each next_courses}}
        {{title}} - {{description}}
        {{/each}}
        
        © 2024 PyMastery. All rights reserved.
        """
    
    def _get_retention_html_template(self) -> str:
        """Get retention email HTML template"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>We Miss You! Come Back to PyMastery</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #6366f1; margin: 0;">We Miss You! 😊</h1>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p>Hi {{user_name}},</p>
                    <p>It's been a while since your last visit on {{last_login}}.</p>
                    <p>We'd love to have you back! Here's a special offer just for you:</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; padding: 20px; background-color: #e0e7ff; border-radius: 10px; border: 2px solid #6366f1;">
                        <div style="font-size: 36px; font-weight: bold; color: #6366f1;">{{discount_percentage}}% OFF</div>
                        <div style="color: #666;">Welcome Back Offer</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://pymastery.com/welcome-back?code={{discount_code}}" style="background-color: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">Claim Your Offer</a>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p><strong>Use code:</strong> <span style="background-color: #f3f4f6; padding: 5px 10px; border-radius: 3px; font-family: monospace;">{{discount_code}}</span></p>
                    <p>This offer is valid for the next 7 days.</p>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
                    <p>© 2024 PyMastery. All rights reserved.</p>
                    <p><a href="https://pymastery.com/unsubscribe">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _get_retention_text_template(self) -> str:
        """Get retention email text template"""
        return """
        We Miss You! 😊
        
        Hi {{user_name}},
        
        It's been a while since your last visit on {{last_login}}.
        
        We'd love to have you back! Here's a special offer just for you:
        
        {{discount_percentage}}% OFF - Welcome Back Offer
        
        Use code: {{discount_code}}
        This offer is valid for the next 7 days.
        
        Claim your offer: https://pymastery.com/welcome-back?code={{discount_code}}
        
        © 2024 PyMastery. All rights reserved.
        Unsubscribe: https://pymastery.com/unsubscribe
        """
    
    async def start(self):
        """Start the email marketing service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Create HTTP session
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        
        # Start background tasks
        self.sender_task = asyncio.create_task(self._email_sender_loop())
        self.analytics_task = asyncio.create_task(self._analytics_loop())
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        self.scheduler_task = asyncio.create_task(self._scheduler_loop())
        
        logger.info("Email marketing service started",
                   extra_fields={
                       "event_type": "email_marketing_service_started",
                       "templates": len(self.templates)
                   })
    
    async def stop(self):
        """Stop the email marketing service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel background tasks
        if self.sender_task:
            self.sender_task.cancel()
        if self.analytics_task:
            self.analytics_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        if self.scheduler_task:
            self.scheduler_task.cancel()
        
        # Close HTTP session
        if self.session:
            await self.session.close()
        
        logger.info("Email marketing service stopped",
                   extra_fields={
                       "event_type": "email_marketing_service_stopped"
                   })
    
    async def create_email_campaign(self, campaign_data: Dict[str, Any]) -> EmailCampaign:
        """Create a new email campaign"""
        try:
            campaign = EmailCampaign(
                id=f"campaign_{int(time.time())}_{campaign_data['name'].replace(' ', '_').lower()}",
                name=campaign_data["name"],
                description=campaign_data.get("description", ""),
                campaign_type=EmailType(campaign_data["campaign_type"]),
                template_id=campaign_data["template_id"],
                status=CampaignStatus.DRAFT,
                scheduled_at=campaign_data.get("scheduled_at"),
                sent_at=None,
                target_audience=campaign_data.get("target_audience", {}),
                personalization=campaign_data.get("personalization", {}),
                tracking_enabled=campaign_data.get("tracking_enabled", True),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            # Store campaign
            self.campaigns[campaign.id] = campaign
            
            # Initialize messages list
            self.messages[campaign.id] = []
            
            logger.info(f"Email campaign created: {campaign.id}",
                       extra_fields={
                           "event_type": "email_campaign_created",
                           "campaign_id": campaign.id,
                           "campaign_name": campaign.name,
                           "campaign_type": campaign.campaign_type.value
                       })
            
            return campaign
        
        except Exception as e:
            logger.error(f"Failed to create email campaign: {e}")
            raise
    
    async def schedule_campaign(self, campaign_id: str, scheduled_at: datetime) -> bool:
        """Schedule an email campaign"""
        try:
            campaign = self.campaigns.get(campaign_id)
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            
            if campaign.status != CampaignStatus.DRAFT:
                raise ValueError(f"Campaign {campaign_id} is not in draft status")
            
            # Update campaign
            campaign.status = CampaignStatus.SCHEDULED
            campaign.scheduled_at = scheduled_at
            campaign.updated_at = datetime.now(timezone.utc)
            
            logger.info(f"Campaign scheduled: {campaign_id}",
                       extra_fields={
                           "event_type": "campaign_scheduled",
                           "campaign_id": campaign_id,
                           "scheduled_at": scheduled_at.isoformat()
                       })
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to schedule campaign: {e}")
            return False
    
    async def send_campaign_email(self, campaign_id: str, recipient_data: Dict[str, Any]) -> EmailMessage:
        """Send a campaign email to a recipient"""
        try:
            campaign = self.campaigns.get(campaign_id)
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            
            template = self.templates.get(campaign.template_id)
            if not template:
                raise ValueError(f"Template {campaign.template_id} not found")
            
            # Generate tracking ID
            tracking_id = secrets.token_urlsafe(16)
            
            # Personalize content
            personalized_content = await self._personalize_content(
                template, recipient_data, campaign.personalization
            )
            
            # Create email message
            message = EmailMessage(
                id=f"msg_{int(time.time())}_{campaign_id}_{recipient_data['email'].replace('@', '_')}",
                campaign_id=campaign_id,
                template_id=template.id,
                recipient_email=recipient_data["email"],
                recipient_name=recipient_data.get("name", ""),
                subject=personalized_content["subject"],
                html_content=personalized_content["html_content"],
                text_content=personalized_content["text_content"],
                status=EmailStatus.SENDING,
                sent_at=None,
                delivered_at=None,
                opened_at=None,
                clicked_at=None,
                bounced_at=None,
                error_message=None,
                tracking_id=tracking_id,
                created_at=datetime.now(timezone.utc)
            )
            
            # Store message
            self.messages[campaign_id].append(message)
            
            # Add to email queue
            self.email_queue.append({
                "message_id": message.id,
                "campaign_id": campaign_id,
                "recipient_email": recipient_data["email"],
                "subject": message.subject,
                "html_content": message.html_content,
                "text_content": message.text_content,
                "tracking_id": tracking_id
            })
            
            logger.info(f"Campaign email queued: {message.id}",
                       extra_fields={
                           "event_type": "campaign_email_queued",
                           "message_id": message.id,
                           "campaign_id": campaign_id,
                           "recipient": recipient_data["email"]
                       })
            
            return message
        
        except Exception as e:
            logger.error(f"Failed to send campaign email: {e}")
            raise
    
    async def _personalize_content(self, template: EmailTemplate, recipient_data: Dict[str, Any], personalization: Dict[str, Any]) -> Dict[str, str]:
        """Personalize email template content"""
        try:
            # Merge recipient data with personalization settings
            variables = {**recipient_data, **personalization}
            
            # Replace variables in subject
            subject = template.subject
            for var in template.variables:
                if var in variables:
                    subject = subject.replace(f"{{{{{var}}}}}", str(variables[var]))
            
            # Replace variables in HTML content
            html_content = template.html_content
            for var in template.variables:
                if var in variables:
                    html_content = html_content.replace(f"{{{{{var}}}}}", str(variables[var]))
            
            # Replace variables in text content
            text_content = template.text_content
            for var in template.variables:
                if var in variables:
                    text_content = text_content.replace(f"{{{{{var}}}}}", str(variables[var]))
            
            return {
                "subject": subject,
                "html_content": html_content,
                "text_content": text_content
            }
        
        except Exception as e:
            logger.error(f"Failed to personalize content: {e}")
            return {
                "subject": template.subject,
                "html_content": template.html_content,
                "text_content": template.text_content
            }
    
    async def _email_sender_loop(self):
        """Process email queue and send emails"""
        while self.is_running:
            try:
                if self.email_queue:
                    email_data = self.email_queue.popleft()
                    await self._send_email(email_data)
                else:
                    await asyncio.sleep(1)  # Wait for emails
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Email sender loop error: {e}")
                await asyncio.sleep(5)
    
    async def _send_email(self, email_data: Dict[str, Any]):
        """Send an individual email"""
        try:
            message_id = email_data["message_id"]
            campaign_id = email_data["campaign_id"]
            
            # Find message record
            message = None
            for msg in self.messages.get(campaign_id, []):
                if msg.id == message_id:
                    message = msg
                    break
            
            if not message:
                logger.error(f"Message {message_id} not found")
                return
            
            # Simulate email sending (would integrate with email service)
            await asyncio.sleep(0.1)  # Simulate sending delay
            
            # Update message status
            message.status = EmailStatus.SENT
            message.sent_at = datetime.now(timezone.utc)
            
            # Simulate delivery
            await asyncio.sleep(0.05)
            message.status = EmailStatus.SENT  # Would be DELIVERED in real implementation
            message.delivered_at = datetime.now(timezone.utc)
            
            logger.info(f"Email sent: {message_id}",
                       extra_fields={
                           "event_type": "email_sent",
                           "message_id": message_id,
                           "recipient": email_data["recipient_email"],
                           "tracking_id": email_data["tracking_id"]
                       })
        
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            
            # Update message status to failed
            if message:
                message.status = EmailStatus.FAILED
                message.error_message = str(e)
    
    async def track_email_event(self, tracking_id: str, event_type: str, event_data: Dict[str, Any] = None):
        """Track email events (open, click, bounce, etc.)"""
        try:
            # Find message by tracking ID
            message = None
            for campaign_messages in self.messages.values():
                for msg in campaign_messages:
                    if msg.tracking_id == tracking_id:
                        message = msg
                        break
                if message:
                    break
            
            if not message:
                logger.warning(f"Message not found for tracking ID: {tracking_id}")
                return
            
            # Update message based on event type
            if event_type == "open":
                message.opened_at = datetime.now(timezone.utc)
            elif event_type == "click":
                message.clicked_at = datetime.now(timezone.utc)
            elif event_type == "bounce":
                message.status = EmailStatus.FAILED
                message.bounced_at = datetime.now(timezone.utc)
                message.error_message = event_data.get("reason", "Bounced")
            elif event_type == "spam_complaint":
                message.status = EmailStatus.FAILED
                message.error_message = "Marked as spam"
            
            logger.info(f"Email event tracked: {event_type}",
                       extra_fields={
                           "event_type": "email_event_tracked",
                           "tracking_id": tracking_id,
                           "event": event_type
                       })
        
        except Exception as e:
            logger.error(f"Failed to track email event: {e}")
    
    async def get_campaign_analytics(self, campaign_id: str, period_start: datetime, period_end: datetime) -> EmailAnalytics:
        """Generate analytics for an email campaign"""
        try:
            campaign = self.campaigns.get(campaign_id)
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            
            # Get messages in period
            campaign_messages = self.messages.get(campaign_id, [])
            period_messages = [
                msg for msg in campaign_messages
                if period_start <= msg.created_at <= period_end
            ]
            
            total_sent = len(period_messages)
            total_delivered = len([msg for msg in period_messages if msg.delivered_at])
            total_opened = len([msg for msg in period_messages if msg.opened_at])
            total_clicked = len([msg for msg in period_messages if msg.clicked_at])
            total_bounced = len([msg for msg in period_messages if msg.bounced_at])
            total_failed = len([msg for msg in period_messages if msg.status == EmailStatus.FAILED])
            
            # Calculate rates
            delivery_rate = (total_delivered / total_sent * 100) if total_sent > 0 else 0
            open_rate = (total_opened / total_delivered * 100) if total_delivered > 0 else 0
            click_rate = (total_clicked / total_opened * 100) if total_opened > 0 else 0
            bounce_rate = (total_bounced / total_sent * 100) if total_sent > 0 else 0
            
            analytics = EmailAnalytics(
                id=f"analytics_{campaign_id}_{int(period_start.timestamp())}",
                campaign_id=campaign_id,
                period_start=period_start,
                period_end=period_end,
                total_sent=total_sent,
                total_delivered=total_delivered,
                total_opened=total_opened,
                total_clicked=total_clicked,
                total_bounced=total_bounced,
                total_failed=total_failed,
                delivery_rate=delivery_rate,
                open_rate=open_rate,
                click_rate=click_rate,
                bounce_rate=bounce_rate,
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
                # Generate analytics for all campaigns
                for campaign in self.campaigns.values():
                    if campaign.status in [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED]:
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
                
                # Check for campaigns to send
                for campaign in self.campaigns.values():
                    if (campaign.status == CampaignStatus.SCHEDULED and
                        campaign.scheduled_at and
                        campaign.scheduled_at <= now):
                        # Start sending campaign
                        campaign.status = CampaignStatus.ACTIVE
                        campaign.updated_at = now
                        
                        logger.info(f"Scheduled campaign started: {campaign.id}")
                
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
                
                # Clean up old messages
                for campaign_id, messages in self.messages.items():
                    self.messages[campaign_id] = [
                        msg for msg in messages
                        if msg.created_at >= cutoff_date
                    ]
                
                logger.debug("Email marketing data cleanup completed")
                
                # Sleep until next cleanup
                await asyncio.sleep(86400)  # Clean up daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup loop error: {e}")
                await asyncio.sleep(86400)
    
    def get_email_marketing_service_status(self) -> Dict[str, Any]:
        """Get email marketing service status"""
        try:
            # Calculate statistics
            total_campaigns = len(self.campaigns)
            active_campaigns = len([c for c in self.campaigns.values() if c.status == CampaignStatus.ACTIVE])
            
            total_templates = len(self.templates)
            active_templates = len([t for t in self.templates.values() if t.is_active])
            
            total_messages = sum(len(messages) for messages in self.messages.values())
            
            # Queue size
            queue_size = len(self.email_queue)
            
            # Calculate recent metrics
            now = datetime.now(timezone.utc)
            recent_period = now - timedelta(days=7)
            
            recent_sent = 0
            recent_delivered = 0
            recent_opened = 0
            
            for campaign_messages in self.messages.values():
                for msg in campaign_messages:
                    if msg.created_at >= recent_period:
                        if msg.sent_at:
                            recent_sent += 1
                        if msg.delivered_at:
                            recent_delivered += 1
                        if msg.opened_at:
                            recent_opened += 1
            
            recent_open_rate = (recent_opened / recent_delivered * 100) if recent_delivered > 0 else 0
            
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
                "template_stats": {
                    "total_templates": total_templates,
                    "active_templates": active_templates
                },
                "message_stats": {
                    "total_messages": total_messages,
                    "queue_size": queue_size,
                    "recent_sent": recent_sent,
                    "recent_delivered": recent_delivered,
                    "recent_opened": recent_opened,
                    "recent_open_rate": round(recent_open_rate, 2)
                },
                "analytics_stats": {
                    "total_analytics": len(self.analytics)
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get email marketing service status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global email marketing service instance
email_marketing_service: Optional[EmailMarketingService] = None

def get_email_marketing_service(config: Dict[str, Any] = None) -> EmailMarketingService:
    """Get or create email marketing service instance"""
    global email_marketing_service
    if email_marketing_service is None:
        email_marketing_service = EmailMarketingService(config)
    return email_marketing_service

async def start_email_marketing_service(config: Dict[str, Any] = None) -> EmailMarketingService:
    """Start email marketing service"""
    service = get_email_marketing_service(config)
    await service.start()
    return service

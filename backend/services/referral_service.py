"""
Referral Service for PyMastery
Handles user referral programs, referral tracking, and incentive management
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

class ReferralStatus(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class RewardType(Enum):
    DISCOUNT = "discount"
    CREDIT = "credit"
    FREE_MONTHS = "free_months"
    FEATURE_UNLOCK = "feature_unlock"
    CASH_BONUS = "cash_bonus"

class IncentiveType(Enum):
    SIGNUP_BONUS = "signup_bonus"
    REFERRAL_BONUS = "referral_bonus"
    MILESTONE_BONUS = "milestone_bonus"
    RETENTION_BONUS = "retention_bonus"
    CONVERSION_BONUS = "conversion_bonus"

@dataclass
class ReferralCode:
    """Referral code information"""
    id: str
    code: str
    referrer_id: str
    status: ReferralStatus
    max_uses: int
    current_uses: int
    expires_at: Optional[datetime]
    created_at: datetime
    metadata: Dict[str, Any] = None

@dataclass
class ReferralReward:
    """Referral reward configuration"""
    id: str
    name: str
    description: str
    reward_type: RewardType
    reward_value: float
    reward_currency: str
    incentive_type: IncentiveType
    conditions: Dict[str, Any]
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

@dataclass
class Referral:
    """Referral record"""
    id: str
    referrer_id: str
    referred_id: str
    referral_code_id: str
    status: ReferralStatus
    referral_date: datetime
    conversion_date: Optional[datetime]
    reward_claimed: bool = False
    reward_claimed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = None

@dataclass
class ReferralCampaign:
    """Referral campaign configuration"""
    id: str
    name: str
    description: str
    start_date: datetime
    end_date: Optional[datetime]
    referral_reward_id: str
    referred_reward_id: Optional[str]
    max_participants: Optional[int]
    current_participants: int
    is_active: bool
    campaign_rules: Dict[str, Any]
    created_at: datetime

@dataclass
class ReferralAnalytics:
    """Referral analytics data"""
    id: str
    period_start: datetime
    period_end: datetime
    total_referrals: int
    successful_conversions: int
    conversion_rate: float
    top_referrers: List[Dict[str, Any]]
    revenue_generated: float
    rewards_distributed: float
    generated_at: datetime

class ReferralService:
    """Referral service for PyMastery"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Initialize state
        self.is_running = False
        self.start_time = None
        
        # Referral codes
        self.referral_codes: Dict[str, ReferralCode] = {}
        
        # Referrals
        self.referrals: Dict[str, Referral] = {}
        
        # Rewards
        self.rewards: Dict[str, ReferralReward] = {}
        self._initialize_rewards()
        
        # Campaigns
        self.campaigns: Dict[str, ReferralCampaign] = {}
        
        # Analytics
        self.analytics: List[ReferralAnalytics] = []
        
        # Referral tracking
        self.referral_clicks: deque = deque(maxlen=10000)
        
        # HTTP session
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Background tasks
        self.analytics_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        self.expiration_task: Optional[asyncio.Task] = None
    
    def _initialize_rewards(self):
        """Initialize default referral rewards"""
        self.rewards = {
            "referrer_signup": ReferralReward(
                id="referrer_signup",
                name="Referrer Signup Bonus",
                description="Reward for referring a new user",
                reward_type=RewardType.CREDIT,
                reward_value=10.0,
                reward_currency="USD",
                incentive_type=IncentiveType.REFERRAL_BONUS,
                conditions={
                    "min_referred_activity": "complete_profile",
                    "waiting_period_days": 7
                },
                is_active=True,
                created_at=datetime.now(timezone.utc)
            ),
            
            "referred_signup": ReferralReward(
                id="referred_signup",
                name="Referred User Bonus",
                description="Bonus for users who sign up with referral",
                reward_type=RewardType.DISCOUNT,
                reward_value=20.0,
                reward_currency="USD",
                incentive_type=IncentiveType.SIGNUP_BONUS,
                conditions={
                    "apply_to_first_month": True,
                    "max_discount_percentage": 50
                },
                is_active=True,
                created_at=datetime.now(timezone.utc)
            ),
            
            "conversion_bonus": ReferralReward(
                id="conversion_bonus",
                name="Conversion Bonus",
                description="Bonus when referred user converts to paid plan",
                reward_type=RewardType.FREE_MONTHS,
                reward_value=1.0,
                reward_currency="months",
                incentive_type=IncentiveType.CONVERSION_BONUS,
                conditions={
                    "min_plan_tier": "basic",
                    "min_subscription_months": 1
                },
                is_active=True,
                created_at=datetime.now(timezone.utc)
            ),
            
            "milestone_5": ReferralReward(
                id="milestone_5",
                name="5 Referrals Milestone",
                description="Bonus for referring 5 users",
                reward_type=RewardType.FEATURE_UNLOCK,
                reward_value=0.0,
                reward_currency="feature",
                incentive_type=IncentiveType.MILESTONE_BONUS,
                conditions={
                    "referral_count": 5,
                    "min_conversions": 3,
                    "feature_to_unlock": "advanced_analytics"
                },
                is_active=True,
                created_at=datetime.now(timezone.utc)
            ),
            
            "milestone_10": ReferralReward(
                id="milestone_10",
                name="10 Referrals Milestone",
                description="Bonus for referring 10 users",
                reward_type=RewardType.CASH_BONUS,
                reward_value=50.0,
                reward_currency="USD",
                incentive_type=IncentiveType.MILESTONE_BONUS,
                conditions={
                    "referral_count": 10,
                    "min_conversions": 5,
                    "payout_method": "paypal"
                },
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
        }
    
    async def start(self):
        """Start the referral service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Create HTTP session
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        
        # Start background tasks
        self.analytics_task = asyncio.create_task(self._analytics_loop())
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        self.expiration_task = asyncio.create_task(self._expiration_loop())
        
        logger.info("Referral service started",
                   extra_fields={
                       "event_type": "referral_service_started",
                       "rewards": len(self.rewards)
                   })
    
    async def stop(self):
        """Stop the referral service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel background tasks
        if self.analytics_task:
            self.analytics_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        if self.expiration_task:
            self.expiration_task.cancel()
        
        # Close HTTP session
        if self.session:
            await self.session.close()
        
        logger.info("Referral service stopped",
                   extra_fields={
                       "event_type": "referral_service_stopped"
                   })
    
    def generate_referral_code(self, user_id: str, max_uses: int = 100, 
                              expires_days: int = 365) -> str:
        """Generate a unique referral code for user"""
        try:
            # Generate unique code
            while True:
                code = self._generate_code()
                if not self._code_exists(code):
                    break
            
            # Create referral code record
            referral_code = ReferralCode(
                id=f"ref_code_{int(time.time())}_{user_id}",
                code=code,
                referrer_id=user_id,
                status=ReferralStatus.ACTIVE,
                max_uses=max_uses,
                current_uses=0,
                expires_at=datetime.now(timezone.utc) + timedelta(days=expires_days),
                created_at=datetime.now(timezone.utc),
                metadata={"generated_by": "system"}
            )
            
            # Store referral code
            self.referral_codes[referral_code.id] = referral_code
            
            logger.info(f"Referral code generated: {code} for user {user_id}",
                       extra_fields={
                           "event_type": "referral_code_generated",
                           "code": code,
                           "user_id": user_id,
                           "max_uses": max_uses
                       })
            
            return code
        
        except Exception as e:
            logger.error(f"Failed to generate referral code: {e}")
            raise
    
    def _generate_code(self) -> str:
        """Generate a random referral code"""
        # Generate a readable code using uppercase letters and numbers
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return ''.join(secrets.choice(chars) for _ in range(8))
    
    def _code_exists(self, code: str) -> bool:
        """Check if referral code already exists"""
        return any(rc.code == code for rc in self.referral_codes.values())
    
    async def validate_referral_code(self, code: str) -> Optional[ReferralCode]:
        """Validate referral code and return code info"""
        try:
            # Find referral code
            referral_code = None
            for rc in self.referral_codes.values():
                if rc.code == code:
                    referral_code = rc
                    break
            
            if not referral_code:
                return None
            
            # Check status
            if referral_code.status != ReferralStatus.ACTIVE:
                return None
            
            # Check expiration
            if referral_code.expires_at and referral_code.expires_at < datetime.now(timezone.utc):
                return None
            
            # Check usage limit
            if referral_code.current_uses >= referral_code.max_uses:
                return None
            
            return referral_code
        
        except Exception as e:
            logger.error(f"Failed to validate referral code: {e}")
            return None
    
    async def create_referral(self, referrer_id: str, referred_id: str, 
                           referral_code: str) -> Referral:
        """Create a new referral record"""
        try:
            # Validate referral code
            code_info = await self.validate_referral_code(referral_code)
            if not code_info:
                raise ValueError("Invalid or expired referral code")
            
            # Check if referral already exists
            existing_referral = None
            for ref in self.referrals.values():
                if ref.referrer_id == referrer_id and ref.referred_id == referred_id:
                    existing_referral = ref
                    break
            
            if existing_referral:
                raise ValueError("Referral already exists")
            
            # Create referral record
            referral = Referral(
                id=f"ref_{int(time.time())}_{referrer_id}_{referred_id}",
                referrer_id=referrer_id,
                referred_id=referred_id,
                referral_code_id=code_info.id,
                status=ReferralStatus.PENDING,
                referral_date=datetime.now(timezone.utc),
                metadata={
                    "referral_code": referral_code,
                    "ip_address": "",  # Would be populated from request
                    "user_agent": ""   # Would be populated from request
                }
            )
            
            # Store referral
            self.referrals[referral.id] = referral
            
            # Update code usage
            code_info.current_uses += 1
            
            # Track referral click
            self.referral_clicks.append({
                "referral_id": referral.id,
                "referrer_id": referrer_id,
                "referred_id": referred_id,
                "referral_code": referral_code,
                "timestamp": datetime.now(timezone.utc)
            })
            
            logger.info(f"Referral created: {referral.id}",
                       extra_fields={
                           "event_type": "referral_created",
                           "referral_id": referral.id,
                           "referrer_id": referrer_id,
                           "referred_id": referred_id,
                           "referral_code": referral_code
                       })
            
            return referral
        
        except Exception as e:
            logger.error(f"Failed to create referral: {e}")
            raise
    
    async def convert_referral(self, referral_id: str, conversion_data: Dict[str, Any] = None) -> bool:
        """Convert a referral to successful status"""
        try:
            referral = self.referrals.get(referral_id)
            if not referral:
                raise ValueError(f"Referral {referral_id} not found")
            
            if referral.status == ReferralStatus.COMPLETED:
                return True  # Already converted
            
            # Update referral status
            referral.status = ReferralStatus.COMPLETED
            referral.conversion_date = datetime.now(timezone.utc)
            if conversion_data:
                referral.metadata.update(conversion_data)
            
            # Process rewards
            await self._process_referral_rewards(referral)
            
            logger.info(f"Referral converted: {referral_id}",
                       extra_fields={
                           "event_type": "referral_converted",
                           "referral_id": referral_id,
                           "referrer_id": referral.referrer_id,
                           "referred_id": referral.referred_id,
                           "conversion_date": referral.conversion_date.isoformat()
                       })
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to convert referral: {e}")
            return False
    
    async def _process_referral_rewards(self, referral: Referral):
        """Process rewards for converted referral"""
        try:
            # Get referrer signup reward
            referrer_reward = self.rewards.get("referrer_signup")
            if referrer_reward and referrer_reward.is_active:
                await self._award_reward(referral.referrer_id, referrer_reward, referral)
            
            # Get conversion reward
            conversion_reward = self.rewards.get("conversion_bonus")
            if conversion_reward and conversion_reward.is_active:
                await self._award_reward(referral.referrer_id, conversion_reward, referral)
            
            # Check for milestone rewards
            await self._check_milestone_rewards(referral.referrer_id)
        
        except Exception as e:
            logger.error(f"Failed to process referral rewards: {e}")
    
    async def _award_reward(self, user_id: str, reward: ReferralReward, referral: Referral):
        """Award a reward to a user"""
        try:
            # This would integrate with payment/user service
            # For now, just log the reward
            logger.info(f"Reward awarded to user {user_id}: {reward.name}",
                       extra_fields={
                           "event_type": "reward_awarded",
                           "user_id": user_id,
                           "reward_id": reward.id,
                           "reward_type": reward.reward_type.value,
                           "reward_value": reward.reward_value,
                           "referral_id": referral.id
                       })
            
            # In a real implementation, this would:
            # - Add credit to user account
            # - Apply discount to next billing
            # - Unlock features
            # - Process cash payments
            # - Send notification emails
        
        except Exception as e:
            logger.error(f"Failed to award reward: {e}")
    
    async def _check_milestone_rewards(self, user_id: str):
        """Check and award milestone rewards"""
        try:
            # Count user's successful referrals
            user_referrals = [
                ref for ref in self.referrals.values()
                if ref.referrer_id == user_id and ref.status == ReferralStatus.COMPLETED
            ]
            
            referral_count = len(user_referrals)
            
            # Check 5 referrals milestone
            if referral_count >= 5:
                milestone_reward = self.rewards.get("milestone_5")
                if milestone_reward and milestone_reward.is_active:
                    # Check if already awarded
                    # This would require tracking awarded rewards per user
                    await self._award_reward(user_id, milestone_reward, user_referrals[0])
            
            # Check 10 referrals milestone
            if referral_count >= 10:
                milestone_reward = self.rewards.get("milestone_10")
                if milestone_reward and milestone_reward.is_active:
                    await self._award_reward(user_id, milestone_reward, user_referrals[0])
        
        except Exception as e:
            logger.error(f"Failed to check milestone rewards: {e}")
    
    async def get_user_referrals(self, user_id: str, status: Optional[ReferralStatus] = None) -> List[Referral]:
        """Get user's referrals"""
        try:
            referrals = [
                ref for ref in self.referrals.values()
                if ref.referrer_id == user_id
            ]
            
            if status:
                referrals = [ref for ref in referrals if ref.status == status]
            
            return referrals
        
        except Exception as e:
            logger.error(f"Failed to get user referrals: {e}")
            return []
    
    async def get_user_referral_code(self, user_id: str) -> Optional[str]:
        """Get user's active referral code"""
        try:
            for code in self.referral_codes.values():
                if code.referrer_id == user_id and code.status == ReferralStatus.ACTIVE:
                    if not code.expires_at or code.expires_at > datetime.now(timezone.utc):
                        return code.code
            
            return None
        
        except Exception as e:
            logger.error(f"Failed to get user referral code: {e}")
            return None
    
    async def get_referral_stats(self, user_id: str) -> Dict[str, Any]:
        """Get referral statistics for a user"""
        try:
            user_referrals = await self.get_user_referrals(user_id)
            
            total_referrals = len(user_referrals)
            pending_referrals = len([ref for ref in user_referrals if ref.status == ReferralStatus.PENDING])
            completed_referrals = len([ref for ref in user_referrals if ref.status == ReferralStatus.COMPLETED])
            
            # Calculate conversion rate
            conversion_rate = (completed_referrals / total_referrals * 100) if total_referrals > 0 else 0
            
            # Get referral code info
            referral_code = await self.get_user_referral_code(user_id)
            code_info = None
            if referral_code:
                for code in self.referral_codes.values():
                    if code.code == referral_code:
                        code_info = code
                        break
            
            return {
                "user_id": user_id,
                "total_referrals": total_referrals,
                "pending_referrals": pending_referrals,
                "completed_referrals": completed_referrals,
                "conversion_rate": round(conversion_rate, 2),
                "referral_code": referral_code,
                "code_info": asdict(code_info) if code_info else None,
                "rewards_available": len([r for r in self.rewards.values() if r.is_active])
            }
        
        except Exception as e:
            logger.error(f"Failed to get referral stats: {e}")
            return {}
    
    async def create_referral_campaign(self, campaign_data: Dict[str, Any]) -> ReferralCampaign:
        """Create a new referral campaign"""
        try:
            campaign = ReferralCampaign(
                id=f"campaign_{int(time.time())}_{campaign_data.get('name', '').replace(' ', '_').lower()}",
                name=campaign_data["name"],
                description=campaign_data.get("description", ""),
                start_date=campaign_data.get("start_date", datetime.now(timezone.utc)),
                end_date=campaign_data.get("end_date"),
                referral_reward_id=campaign_data["referral_reward_id"],
                referred_reward_id=campaign_data.get("referred_reward_id"),
                max_participants=campaign_data.get("max_participants"),
                current_participants=0,
                is_active=campaign_data.get("is_active", True),
                campaign_rules=campaign_data.get("campaign_rules", {}),
                created_at=datetime.now(timezone.utc)
            )
            
            # Store campaign
            self.campaigns[campaign.id] = campaign
            
            logger.info(f"Referral campaign created: {campaign.id}",
                       extra_fields={
                           "event_type": "referral_campaign_created",
                           "campaign_id": campaign.id,
                           "campaign_name": campaign.name
                       })
            
            return campaign
        
        except Exception as e:
            logger.error(f"Failed to create referral campaign: {e}")
            raise
    
    async def get_referral_analytics(self, period_start: datetime, period_end: datetime) -> ReferralAnalytics:
        """Generate referral analytics for a period"""
        try:
            # Filter referrals in period
            period_referrals = [
                ref for ref in self.referrals.values()
                if period_start <= ref.referral_date <= period_end
            ]
            
            total_referrals = len(period_referrals)
            completed_referrals = len([ref for ref in period_referrals if ref.status == ReferralStatus.COMPLETED])
            conversion_rate = (completed_referrals / total_referrals * 100) if total_referrals > 0 else 0
            
            # Get top referrers
            referrer_counts = {}
            for ref in period_referrals:
                if ref.status == ReferralStatus.COMPLETED:
                    referrer_counts[ref.referrer_id] = referrer_counts.get(ref.referrer_id, 0) + 1
            
            top_referrers = [
                {"user_id": user_id, "referrals": count}
                for user_id, count in sorted(referrer_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            ]
            
            # Calculate revenue (would integrate with payment service)
            revenue_generated = completed_referrals * 20.0  # Estimated $20 per conversion
            
            # Calculate rewards distributed
            rewards_distributed = completed_referrals * 10.0  # Estimated $10 per reward
            
            analytics = ReferralAnalytics(
                id=f"analytics_{int(period_start.timestamp())}",
                period_start=period_start,
                period_end=period_end,
                total_referrals=total_referrals,
                successful_conversions=completed_referrals,
                conversion_rate=conversion_rate,
                top_referrers=top_referrers,
                revenue_generated=revenue_generated,
                rewards_distributed=rewards_distributed,
                generated_at=datetime.now(timezone.utc)
            )
            
            # Store analytics
            self.analytics.append(analytics)
            
            return analytics
        
        except Exception as e:
            logger.error(f"Failed to generate referral analytics: {e}")
            raise
    
    async def _analytics_loop(self):
        """Background analytics loop"""
        while self.is_running:
            try:
                # Generate daily analytics
                now = datetime.now(timezone.utc)
                period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                period_end = period_start + timedelta(days=1)
                
                await self.get_referral_analytics(period_start, period_end)
                
                # Sleep until next analytics cycle
                await asyncio.sleep(86400)  # Generate daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Analytics loop error: {e}")
                await asyncio.sleep(86400)
    
    async def _cleanup_loop(self):
        """Cleanup old data"""
        while self.is_running:
            try:
                # Clean up old referral clicks
                cutoff_date = datetime.now(timezone.utc) - timedelta(days=90)
                
                # Clean up old analytics
                self.analytics = [
                    analytics for analytics in self.analytics
                    if analytics.generated_at >= cutoff_date
                ]
                
                logger.debug("Referral data cleanup completed")
                
                # Sleep until next cleanup
                await asyncio.sleep(86400)  # Clean up daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup loop error: {e}")
                await asyncio.sleep(86400)
    
    async def _expiration_loop(self):
        """Check for expired referral codes and referrals"""
        while self.is_running:
            try:
                now = datetime.now(timezone.utc)
                
                # Check expired referral codes
                for code in self.referral_codes.values():
                    if (code.expires_at and code.expires_at < now and 
                        code.status == ReferralStatus.ACTIVE):
                        code.status = ReferralStatus.EXPIRED
                
                # Check expired referrals (if any have expiration)
                for referral in self.referrals.values():
                    # Referrals don't typically expire, but we could add logic here if needed
                    pass
                
                # Sleep until next check
                await asyncio.sleep(3600)  # Check hourly
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Expiration loop error: {e}")
                await asyncio.sleep(3600)
    
    def get_referral_service_status(self) -> Dict[str, Any]:
        """Get referral service status"""
        try:
            # Calculate statistics
            total_codes = len(self.referral_codes)
            active_codes = len([c for c in self.referral_codes.values() if c.status == ReferralStatus.ACTIVE])
            
            total_referrals = len(self.referrals)
            pending_referrals = len([r for r in self.referrals.values() if r.status == ReferralStatus.PENDING])
            completed_referrals = len([r for r in self.referrals.values() if r.status == ReferralStatus.COMPLETED])
            
            total_campaigns = len(self.campaigns)
            active_campaigns = len([c for c in self.campaigns.values() if c.is_active])
            
            total_rewards = len(self.rewards)
            active_rewards = len([r for r in self.rewards.values() if r.is_active])
            
            # Calculate conversion rate
            conversion_rate = (completed_referrals / total_referrals * 100) if total_referrals > 0 else 0
            
            return {
                "service_status": {
                    "is_running": self.is_running,
                    "start_time": self.start_time.isoformat() if self.start_time else None,
                    "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
                },
                "code_stats": {
                    "total_codes": total_codes,
                    "active_codes": active_codes,
                    "expired_codes": len([c for c in self.referral_codes.values() if c.status == ReferralStatus.EXPIRED])
                },
                "referral_stats": {
                    "total_referrals": total_referrals,
                    "pending_referrals": pending_referrals,
                    "completed_referrals": completed_referrals,
                    "conversion_rate": round(conversion_rate, 2)
                },
                "campaign_stats": {
                    "total_campaigns": total_campaigns,
                    "active_campaigns": active_campaigns
                },
                "reward_stats": {
                    "total_rewards": total_rewards,
                    "active_rewards": active_rewards
                },
                "analytics_stats": {
                    "total_analytics": len(self.analytics),
                    "recent_clicks": len(self.referral_clicks)
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get referral service status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global referral service instance
referral_service: Optional[ReferralService] = None

def get_referral_service(config: Dict[str, Any] = None) -> ReferralService:
    """Get or create referral service instance"""
    global referral_service
    if referral_service is None:
        referral_service = ReferralService(config)
    return referral_service

async def start_referral_service(config: Dict[str, Any] = None) -> ReferralService:
    """Start referral service"""
    service = get_referral_service(config)
    await service.start()
    return service

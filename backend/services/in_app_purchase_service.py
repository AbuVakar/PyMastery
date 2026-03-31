"""
In-App Purchase Service for PyMastery
Handles premium features, one-time purchases, and virtual goods
"""

import asyncio
import logging
import json
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
from pathlib import Path
import statistics
from collections import deque

logger = logging.getLogger(__name__)

class PurchaseType(Enum):
    ONE_TIME = "one_time"
    CONSUMABLE = "consumable"
    SUBSCRIPTION = "subscription"
    LIFETIME = "lifetime"

class PurchaseStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class Platform(Enum):
    WEB = "web"
    IOS = "ios"
    ANDROID = "android"
    DESKTOP = "desktop"

class FeatureCategory(Enum):
    COURSES = "courses"
    MENTORING = "mentoring"
    CERTIFICATES = "certificates"
    AI_FEATURES = "ai_features"
    SUPPORT = "support"
    ANALYTICS = "analytics"
    TOOLS = "tools"
    CONTENT = "content"

@dataclass
class PremiumFeature:
    """Premium feature definition"""
    id: str
    name: str
    description: str
    category: FeatureCategory
    price: float
    currency: str = "USD"
    purchase_type: PurchaseType = PurchaseType.ONE_TIME
    valid_for_days: Optional[int] = None  # None for lifetime
    platform_specific: Dict[Platform, str] = None  # Platform-specific product IDs
    metadata: Dict[str, Any] = None
    active: bool = True
    tags: List[str] = None
    requirements: List[str] = None  # Required features or prerequisites
    benefits: List[str] = None  # Benefits of this feature

@dataclass
class UserPurchase:
    """User purchase record"""
    id: str
    user_id: str
    feature_id: str
    purchase_type: PurchaseType
    platform: Platform
    status: PurchaseStatus
    amount: float
    currency: str
    transaction_id: str
    platform_transaction_id: str
    purchased_at: datetime
    expires_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None
    metadata: Dict[str, Any] = None

@dataclass
class FeatureUsage:
    """Feature usage tracking"""
    user_id: str
    feature_id: str
    usage_count: int
    last_used: datetime
    usage_data: Dict[str, Any] = None

@dataclass
class BundleOffer:
    """Bundle offer for multiple features"""
    id: str
    name: str
    description: str
    feature_ids: List[str]
    discount_percentage: float
    total_price: float
    currency: str = "USD"
    valid_until: Optional[datetime] = None
    limited_quantity: Optional[int] = None
    purchased_count: int = 0
    active: bool = True

class InAppPurchaseService:
    """In-app purchase service for PyMastery"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Initialize state
        self.is_running = False
        self.start_time = None
        
        # Premium features
        self.features: Dict[str, PremiumFeature] = {}
        self._initialize_features()
        
        # Bundle offers
        self.bundles: Dict[str, BundleOffer] = {}
        self._initialize_bundles()
        
        # User purchases
        self.user_purchases: Dict[str, List[UserPurchase]] = {}
        
        # Feature usage tracking
        self.feature_usage: Dict[str, FeatureUsage] = {}
        
        # Revenue tracking
        self.purchase_revenue: deque = deque(maxlen=1000)
        
        # HTTP session
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Background tasks
        self.expiry_task: Optional[asyncio.Task] = None
        self.analytics_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        
        # Platform configurations
        self.ios_config = self.config.get("ios", {})
        self.android_config = self.config.get("android", {})
        self.web_config = self.config.get("web", {})
    
    def _initialize_features(self):
        """Initialize premium features"""
        self.features = {
            # Course-related features
            "advanced_courses": PremiumFeature(
                id="advanced_courses",
                name="Advanced Course Bundle",
                description="Access to all advanced programming courses",
                category=FeatureCategory.COURSES,
                price=49.99,
                purchase_type=PurchaseType.ONE_TIME,
                platform_specific={
                    Platform.WEB: "advanced_courses_web",
                    Platform.IOS: "com.pymastery.advanced_courses",
                    Platform.ANDROID: "com.pymastery.advanced_courses"
                },
                tags=["courses", "advanced", "bundle"],
                benefits=["50+ advanced courses", "Lifetime access", "Certificate of completion"]
            ),
            
            "expert_mentoring": PremiumFeature(
                id="expert_mentoring",
                name="Expert Mentoring Session",
                description="1-hour 1-on-1 mentoring with industry experts",
                category=FeatureCategory.MENTORING,
                price=99.99,
                purchase_type=PurchaseType.CONSUMABLE,
                platform_specific={
                    Platform.WEB: "expert_mentoring_web",
                    Platform.IOS: "com.pymastery.mentoring",
                    Platform.ANDROID: "com.pymastery.mentoring"
                },
                tags=["mentoring", "expert", "1-on-1"],
                benefits=["Industry expert mentor", "Personalized guidance", "Career advice"]
            ),
            
            "premium_certificate": PremiumFeature(
                id="premium_certificate",
                name="Premium Certificate",
                description="Verifiable premium certificate with blockchain verification",
                category=FeatureCategory.CERTIFICATES,
                price=29.99,
                purchase_type=PurchaseType.ONE_TIME,
                platform_specific={
                    Platform.WEB: "premium_cert_web",
                    Platform.IOS: "com.pymastery.premium_cert",
                    Platform.ANDROID: "com.pymastery.premium_cert"
                },
                tags=["certificate", "premium", "blockchain"],
                benefits=["Blockchain verification", "LinkedIn integration", "Digital badge"]
            ),
            
            # AI-related features
            "ai_code_review": PremiumFeature(
                id="ai_code_review",
                name="AI Code Review Pro",
                description="Advanced AI-powered code review and optimization",
                category=FeatureCategory.AI_FEATURES,
                price=19.99,
                purchase_type=PurchaseType.SUBSCRIPTION,
                valid_for_days=30,
                platform_specific={
                    Platform.WEB: "ai_review_web",
                    Platform.IOS: "com.pymastery.ai_review",
                    Platform.ANDROID: "com.pymastery.ai_review"
                },
                tags=["ai", "code review", "optimization"],
                benefits=["Unlimited reviews", "Advanced analysis", "Performance optimization"]
            ),
            
            "ai_tutor_pro": PremiumFeature(
                id="ai_tutor_pro",
                name="AI Tutor Pro",
                description="Advanced AI tutor with personalized learning paths",
                category=FeatureCategory.AI_FEATURES,
                price=39.99,
                purchase_type=PurchaseType.SUBSCRIPTION,
                valid_for_days=30,
                platform_specific={
                    Platform.WEB: "ai_tutor_web",
                    Platform.IOS: "com.pymastery.ai_tutor",
                    Platform.ANDROID: "com.pymastery.ai_tutor"
                },
                tags=["ai", "tutor", "personalized"],
                benefits=["Personalized learning", "24/7 availability", "Progress tracking"]
            ),
            
            # Support features
            "priority_support": PremiumFeature(
                id="priority_support",
                name="Priority Support",
                description="24/7 priority support with dedicated account manager",
                category=FeatureCategory.SUPPORT,
                price=15.99,
                purchase_type=PurchaseType.SUBSCRIPTION,
                valid_for_days=30,
                platform_specific={
                    Platform.WEB: "priority_support_web",
                    Platform.IOS: "com.pymastery.priority_support",
                    Platform.ANDROID: "com.pymastery.priority_support"
                },
                tags=["support", "priority", "24/7"],
                benefits=["24/7 support", "Dedicated manager", "Fast response time"]
            ),
            
            # Analytics features
            "advanced_analytics": PremiumFeature(
                id="advanced_analytics",
                name="Advanced Analytics Dashboard",
                description="Detailed learning analytics and insights",
                category=FeatureCategory.ANALYTICS,
                price=24.99,
                purchase_type=PurchaseType.SUBSCRIPTION,
                valid_for_days=30,
                platform_specific={
                    Platform.WEB: "analytics_web",
                    Platform.IOS: "com.pymastery.analytics",
                    Platform.ANDROID: "com.pymastery.analytics"
                },
                tags=["analytics", "insights", "dashboard"],
                benefits=["Detailed metrics", "Learning insights", "Progress tracking"]
            ),
            
            # Tools features
            "code_editor_pro": PremiumFeature(
                id="code_editor_pro",
                name="Pro Code Editor",
                description="Advanced code editor with AI assistance and collaboration",
                category=FeatureCategory.TOOLS,
                price=34.99,
                purchase_type=PurchaseType.ONE_TIME,
                platform_specific={
                    Platform.WEB: "editor_pro_web",
                    Platform.DESKTOP: "editor_pro_desktop",
                    Platform.IOS: "com.pymastery.editor_pro",
                    Platform.ANDROID: "com.pymastery.editor_pro"
                },
                tags=["editor", "code", "collaboration"],
                benefits=["AI assistance", "Real-time collaboration", "Advanced features"]
            ),
            
            # Content features
            "exclusive_content": PremiumFeature(
                id="exclusive_content",
                name="Exclusive Content Library",
                description="Access to exclusive tutorials, interviews, and case studies",
                category=FeatureCategory.CONTENT,
                price=19.99,
                purchase_type=PurchaseType.SUBSCRIPTION,
                valid_for_days=30,
                platform_specific={
                    Platform.WEB: "exclusive_content_web",
                    Platform.IOS: "com.pymastery.exclusive",
                    Platform.ANDROID: "com.pymastery.exclusive"
                },
                tags=["content", "exclusive", "tutorials"],
                benefits=["Exclusive tutorials", "Industry interviews", "Case studies"]
            ),
            
            "lifetime_access": PremiumFeature(
                id="lifetime_access",
                name="Lifetime All-Access Pass",
                description="Lifetime access to all current and future features",
                category=FeatureCategory.COURSES,
                price=499.99,
                purchase_type=PurchaseType.LIFETIME,
                platform_specific={
                    Platform.WEB: "lifetime_web",
                    Platform.IOS: "com.pymastery.lifetime",
                    Platform.ANDROID: "com.pymastery.lifetime"
                },
                tags=["lifetime", "all-access", "premium"],
                benefits=["All features", "Future updates", "Priority support"]
            )
        }
    
    def _initialize_bundles(self):
        """Initialize bundle offers"""
        self.bundles = {
            "starter_bundle": BundleOffer(
                id="starter_bundle",
                name="Starter Bundle",
                description="Perfect for beginners - courses + basic AI features",
                feature_ids=["advanced_courses", "ai_code_review"],
                discount_percentage=20,
                total_price=59.99,
                valid_until=datetime.now(timezone.utc) + timedelta(days=30),
                limited_quantity=100
            ),
            
            "professional_bundle": BundleOffer(
                id="professional_bundle",
                name="Professional Bundle",
                description="Complete professional development package",
                feature_ids=["advanced_courses", "expert_mentoring", "ai_tutor_pro", "advanced_analytics"],
                discount_percentage=25,
                total_price=179.99,
                valid_until=datetime.now(timezone.utc) + timedelta(days=60),
                limited_quantity=50
            ),
            
            "ultimate_bundle": BundleOffer(
                id="ultimate_bundle",
                name="Ultimate Bundle",
                description="Everything you need for programming mastery",
                feature_ids=["lifetime_access", "premium_certificate", "priority_support"],
                discount_percentage=30,
                total_price=599.99,
                limited_quantity=25
            ),
            
            "ai_powered_bundle": BundleOffer(
                id="ai_powered_bundle",
                name="AI-Powered Bundle",
                description="Complete AI learning and assistance package",
                feature_ids=["ai_code_review", "ai_tutor_pro", "code_editor_pro"],
                discount_percentage=22,
                total_price=79.99,
                valid_until=datetime.now(timezone.utc) + timedelta(days=45)
            )
        }
    
    async def start(self):
        """Start the in-app purchase service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Create HTTP session
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        
        # Start background tasks
        self.expiry_task = asyncio.create_task(self._expiry_check_loop())
        self.analytics_task = asyncio.create_task(self._analytics_loop())
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        logger.info("In-app purchase service started",
                   extra_fields={
                       "event_type": "in_app_purchase_service_started",
                       "features": len(self.features),
                       "bundles": len(self.bundles)
                   })
    
    async def stop(self):
        """Stop the in-app purchase service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel background tasks
        if self.expiry_task:
            self.expiry_task.cancel()
        if self.analytics_task:
            self.analytics_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        
        # Close HTTP session
        if self.session:
            await self.session.close()
        
        logger.info("In-app purchase service stopped",
                   extra_fields={
                       "event_type": "in_app_purchase_service_stopped"
                   })
    
    async def purchase_feature(self, user_id: str, feature_id: str, platform: Platform,
                             payment_method_data: Dict[str, Any] = None) -> UserPurchase:
        """Purchase a premium feature"""
        try:
            feature = self.features.get(feature_id)
            if not feature or not feature.active:
                raise ValueError(f"Feature {feature_id} not available")
            
            # Create purchase record
            purchase_id = f"purchase_{int(time.time())}_{user_id}"
            transaction_id = f"txn_{int(time.time())}_{user_id}"
            
            purchase = UserPurchase(
                id=purchase_id,
                user_id=user_id,
                feature_id=feature_id,
                purchase_type=feature.purchase_type,
                platform=platform,
                status=PurchaseStatus.PENDING,
                amount=feature.price,
                currency=feature.currency,
                transaction_id=transaction_id,
                platform_transaction_id=transaction_id,  # Would be actual platform transaction ID
                purchased_at=datetime.now(timezone.utc),
                expires_at=self._calculate_expiry_date(feature),
                metadata={"purchase_source": "api"}
            )
            
            # Process payment
            payment_success = await self._process_payment(
                purchase, payment_method_data
            )
            
            if payment_success:
                purchase.status = PurchaseStatus.COMPLETED
                
                # Add to user purchases
                if user_id not in self.user_purchases:
                    self.user_purchases[user_id] = []
                self.user_purchases[user_id].append(purchase)
                
                # Track revenue
                self.purchase_revenue.append({
                    "amount": feature.price,
                    "currency": feature.currency,
                    "feature_id": feature_id,
                    "user_id": user_id,
                    "timestamp": datetime.now(timezone.utc),
                    "platform": platform.value
                })
                
                # Grant feature access
                await self._grant_feature_access(user_id, feature_id)
                
                logger.info(f"Feature purchased: {feature_id} by user {user_id}",
                           extra_fields={
                               "event_type": "feature_purchased",
                               "user_id": user_id,
                               "feature_id": feature_id,
                               "platform": platform.value,
                               "amount": feature.price
                           })
                
                return purchase
            else:
                purchase.status = PurchaseStatus.FAILED
                raise Exception("Payment processing failed")
        
        except Exception as e:
            logger.error(f"Failed to purchase feature: {e}")
            raise
    
    async def purchase_bundle(self, user_id: str, bundle_id: str, platform: Platform,
                            payment_method_data: Dict[str, Any] = None) -> List[UserPurchase]:
        """Purchase a bundle of features"""
        try:
            bundle = self.bundles.get(bundle_id)
            if not bundle or not bundle.active:
                raise ValueError(f"Bundle {bundle_id} not available")
            
            # Check if bundle is still valid
            if bundle.valid_until and bundle.valid_until < datetime.now(timezone.utc):
                raise ValueError("Bundle has expired")
            
            # Check limited quantity
            if bundle.limited_quantity and bundle.purchased_count >= bundle.limited_quantity:
                raise ValueError("Bundle sold out")
            
            purchases = []
            
            # Purchase each feature in the bundle
            for feature_id in bundle.feature_ids:
                try:
                    purchase = await self.purchase_feature(
                        user_id, feature_id, platform, payment_method_data
                    )
                    
                    # Apply bundle discount (would be handled in payment processing)
                    purchase.amount = purchase.amount * (1 - bundle.discount_percentage / 100)
                    
                    purchases.append(purchase)
                
                except Exception as e:
                    logger.error(f"Failed to purchase feature {feature_id} in bundle: {e}")
                    # Continue with other features
            
            # Update bundle purchase count
            bundle.purchased_count += 1
            
            logger.info(f"Bundle purchased: {bundle_id} by user {user_id}",
                       extra_fields={
                           "event_type": "bundle_purchased",
                           "user_id": user_id,
                           "bundle_id": bundle_id,
                           "features_count": len(purchases)
                       })
            
            return purchases
        
        except Exception as e:
            logger.error(f"Failed to purchase bundle: {e}")
            raise
    
    async def _process_payment(self, purchase: UserPurchase, 
                             payment_method_data: Dict[str, Any]) -> bool:
        """Process payment for purchase"""
        try:
            # This would integrate with payment providers (Stripe, Apple Pay, Google Pay, etc.)
            # For now, simulate payment processing
            
            # Simulate payment processing delay
            await asyncio.sleep(0.5)
            
            # Simulate payment success (90% success rate)
            import random
            success = random.random() < 0.9
            
            if success:
                # Update platform transaction ID
                purchase.platform_transaction_id = f"platform_{purchase.transaction_id}"
                return True
            else:
                return False
        
        except Exception as e:
            logger.error(f"Failed to process payment: {e}")
            return False
    
    def _calculate_expiry_date(self, feature: PremiumFeature) -> Optional[datetime]:
        """Calculate expiry date for feature"""
        if feature.purchase_type in [PurchaseType.ONE_TIME, PurchaseType.LIFETIME]:
            return None
        elif feature.valid_for_days:
            return datetime.now(timezone.utc) + timedelta(days=feature.valid_for_days)
        else:
            return None
    
    async def _grant_feature_access(self, user_id: str, feature_id: str):
        """Grant feature access to user"""
        try:
            # This would update user's feature access in the database
            # For now, just log the action
            logger.debug(f"Feature access granted: {feature_id} to user {user_id}")
        
        except Exception as e:
            logger.error(f"Failed to grant feature access: {e}")
    
    async def get_user_purchases(self, user_id: str, active_only: bool = True) -> List[UserPurchase]:
        """Get user's purchases"""
        try:
            purchases = self.user_purchases.get(user_id, [])
            
            if active_only:
                now = datetime.now(timezone.utc)
                active_purchases = []
                
                for purchase in purchases:
                    if (purchase.status == PurchaseStatus.COMPLETED and
                        (not purchase.expires_at or purchase.expires_at > now)):
                        active_purchases.append(purchase)
                
                return active_purchases
            
            return purchases
        
        except Exception as e:
            logger.error(f"Failed to get user purchases: {e}")
            return []
    
    async def get_available_features(self, category: Optional[FeatureCategory] = None,
                                   platform: Optional[Platform] = None) -> List[PremiumFeature]:
        """Get available premium features"""
        try:
            features = list(self.features.values())
            
            # Filter by category
            if category:
                features = [f for f in features if f.category == category]
            
            # Filter by platform
            if platform:
                features = [f for f in features if platform in f.platform_specific]
            
            # Filter active features
            features = [f for f in features if f.active]
            
            return features
        
        except Exception as e:
            logger.error(f"Failed to get available features: {e}")
            return []
    
    async def get_available_bundles(self, active_only: bool = True) -> List[BundleOffer]:
        """Get available bundle offers"""
        try:
            bundles = list(self.bundles.values())
            
            if active_only:
                now = datetime.now(timezone.utc)
                bundles = [
                    b for b in bundles 
                    if b.active and 
                       (not b.valid_until or b.valid_until > now) and
                       (not b.limited_quantity or b.purchased_count < b.limited_quantity)
                ]
            
            return bundles
        
        except Exception as e:
            logger.error(f"Failed to get available bundles: {e}")
            return []
    
    async def check_feature_access(self, user_id: str, feature_id: str) -> bool:
        """Check if user has access to a feature"""
        try:
            purchases = await self.get_user_purchases(user_id, active_only=True)
            
            for purchase in purchases:
                if purchase.feature_id == feature_id:
                    return True
            
            return False
        
        except Exception as e:
            logger.error(f"Failed to check feature access: {e}")
            return False
    
    async def track_feature_usage(self, user_id: str, feature_id: str, 
                                usage_data: Dict[str, Any] = None):
        """Track feature usage"""
        try:
            usage_key = f"{user_id}_{feature_id}"
            
            if usage_key in self.feature_usage:
                usage = self.feature_usage[usage_key]
                usage.usage_count += 1
                usage.last_used = datetime.now(timezone.utc)
                if usage_data:
                    usage.usage_data.update(usage_data)
            else:
                self.feature_usage[usage_key] = FeatureUsage(
                    user_id=user_id,
                    feature_id=feature_id,
                    usage_count=1,
                    last_used=datetime.now(timezone.utc),
                    usage_data=usage_data or {}
                )
        
        except Exception as e:
            logger.error(f"Failed to track feature usage: {e}")
    
    async def get_feature_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get feature usage statistics for a user"""
        try:
            user_usage = {
                usage_key: usage for usage_key, usage in self.feature_usage.items()
                if usage.user_id == user_id
            }
            
            # Calculate statistics
            total_usage = sum(usage.usage_count for usage in user_usage.values())
            most_used_feature = max(user_usage.values(), key=lambda x: x.usage_count) if user_usage else None
            
            return {
                "total_usage": total_usage,
                "unique_features": len(user_usage),
                "most_used_feature": most_used_feature.feature_id if most_used_feature else None,
                "most_used_count": most_used_feature.usage_count if most_used_feature else 0,
                "features": {
                    usage.feature_id: {
                        "usage_count": usage.usage_count,
                        "last_used": usage.last_used.isoformat(),
                        "usage_data": usage.usage_data
                    }
                    for usage in user_usage.values()
                }
            }
        
        except Exception as e:
            logger.error(f"Failed to get feature usage stats: {e}")
            return {}
    
    async def refund_purchase(self, user_id: str, purchase_id: str, reason: str = "") -> bool:
        """Refund a purchase"""
        try:
            # Find purchase
            user_purchases = self.user_purchases.get(user_id, [])
            purchase = None
            
            for p in user_purchases:
                if p.id == purchase_id:
                    purchase = p
                    break
            
            if not purchase:
                raise ValueError(f"Purchase {purchase_id} not found")
            
            if purchase.status != PurchaseStatus.COMPLETED:
                raise ValueError("Purchase cannot be refunded")
            
            # Process refund with platform
            refund_success = await self._process_refund(purchase)
            
            if refund_success:
                purchase.status = PurchaseStatus.REFUNDED
                purchase.refunded_at = datetime.now(timezone.utc)
                
                # Revoke feature access
                await self._revoke_feature_access(user_id, purchase.feature_id)
                
                logger.info(f"Purchase refunded: {purchase_id} for user {user_id}",
                           extra_fields={
                               "event_type": "purchase_refunded",
                               "user_id": user_id,
                               "purchase_id": purchase_id,
                               "reason": reason
                           })
                
                return True
            else:
                return False
        
        except Exception as e:
            logger.error(f"Failed to refund purchase: {e}")
            return False
    
    async def _process_refund(self, purchase: UserPurchase) -> bool:
        """Process refund with platform"""
        try:
            # This would integrate with payment provider's refund API
            # For now, simulate refund processing
            
            await asyncio.sleep(1.0)  # Simulate processing time
            
            # Simulate refund success
            return True
        
        except Exception as e:
            logger.error(f"Failed to process refund: {e}")
            return False
    
    async def _revoke_feature_access(self, user_id: str, feature_id: str):
        """Revoke feature access from user"""
        try:
            # This would update user's feature access in the database
            # For now, just log the action
            logger.debug(f"Feature access revoked: {feature_id} from user {user_id}")
        
        except Exception as e:
            logger.error(f"Failed to revoke feature access: {e}")
    
    async def _expiry_check_loop(self):
        """Check for expired purchases"""
        while self.is_running:
            try:
                now = datetime.now(timezone.utc)
                expired_purchases = []
                
                for user_id, purchases in self.user_purchases.items():
                    for purchase in purchases:
                        if (purchase.status == PurchaseStatus.COMPLETED and
                            purchase.expires_at and
                            purchase.expires_at <= now):
                            expired_purchases.append((user_id, purchase))
                
                # Process expired purchases
                for user_id, purchase in expired_purchases:
                    purchase.status = PurchaseStatus.CANCELLED
                    await self._revoke_feature_access(user_id, purchase.feature_id)
                    
                    logger.info(f"Purchase expired: {purchase.id} for user {user_id}",
                               extra_fields={
                                   "event_type": "purchase_expired",
                                   "user_id": user_id,
                                   "purchase_id": purchase.id,
                                   "feature_id": purchase.feature_id
                               })
                
                # Sleep until next check
                await asyncio.sleep(3600)  # Check every hour
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Expiry check loop error: {e}")
                await asyncio.sleep(3600)
    
    async def _analytics_loop(self):
        """Analytics and insights loop"""
        while self.is_running:
            try:
                # Calculate analytics metrics
                await self._calculate_analytics_metrics()
                
                # Sleep until next analytics cycle
                await asyncio.sleep(86400)  # Calculate daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Analytics loop error: {e}")
                await asyncio.sleep(86400)
    
    async def _calculate_analytics_metrics(self):
        """Calculate analytics metrics"""
        try:
            # Calculate daily revenue
            today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            daily_revenue = sum(
                revenue["amount"] for revenue in self.purchase_revenue
                if revenue["timestamp"] >= today
            )
            
            # Calculate feature popularity
            feature_popularity = {}
            for revenue in self.purchase_revenue:
                feature_id = revenue["feature_id"]
                feature_popularity[feature_id] = feature_popularity.get(feature_id, 0) + 1
            
            # Calculate platform distribution
            platform_distribution = {}
            for revenue in self.purchase_revenue:
                platform = revenue["platform"]
                platform_distribution[platform] = platform_distribution.get(platform, 0) + 1
            
            logger.info(f"In-app purchase analytics calculated",
                       extra_fields={
                           "event_type": "in_app_purchase_analytics",
                           "daily_revenue": daily_revenue,
                           "total_purchases": len(self.purchase_revenue),
                           "active_features": len([f for f in self.features.values() if f.active]),
                           "active_bundles": len([b for b in self.bundles.values() if b.active])
                       })
        
        except Exception as e:
            logger.error(f"Failed to calculate analytics metrics: {e}")
    
    async def _cleanup_loop(self):
        """Cleanup expired data"""
        while self.is_running:
            try:
                # Clean up old usage data
                cutoff_date = datetime.now(timezone.utc) - timedelta(days=90)
                
                old_usage_keys = [
                    key for key, usage in self.feature_usage.items()
                    if usage.last_used < cutoff_date
                ]
                
                for key in old_usage_keys:
                    del self.feature_usage[key]
                
                if old_usage_keys:
                    logger.debug(f"Cleaned up {len(old_usage_keys)} old usage records")
                
                # Sleep until next cleanup
                await asyncio.sleep(86400)  # Clean up daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup loop error: {e}")
                await asyncio.sleep(86400)
    
    def get_in_app_purchase_status(self) -> Dict[str, Any]:
        """Get in-app purchase service status"""
        try:
            # Calculate statistics
            total_purchases = sum(len(purchases) for purchases in self.user_purchases.values())
            active_purchases = 0
            
            for purchases in self.user_purchases.values():
                for purchase in purchases:
                    if purchase.status == PurchaseStatus.COMPLETED:
                        if not purchase.expires_at or purchase.expires_at > datetime.now(timezone.utc):
                            active_purchases += 1
            
            # Calculate revenue
            current_month = datetime.now(timezone.utc).replace(day=1)
            monthly_revenue = sum(
                revenue["amount"] for revenue in self.purchase_revenue
                if revenue["timestamp"] >= current_month
            )
            
            # Feature popularity
            feature_popularity = {}
            for revenue in self.purchase_revenue:
                feature_id = revenue["feature_id"]
                feature_popularity[feature_id] = feature_popularity.get(feature_id, 0) + 1
            
            return {
                "service_status": {
                    "is_running": self.is_running,
                    "start_time": self.start_time.isoformat() if self.start_time else None,
                    "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
                },
                "purchase_stats": {
                    "total_purchases": total_purchases,
                    "active_purchases": active_purchases,
                    "unique_users": len(self.user_purchases),
                    "refunded_purchases": len([
                        p for purchases in self.user_purchases.values()
                        for p in purchases
                        if p.status == PurchaseStatus.REFUNDED
                    ])
                },
                "revenue_stats": {
                    "monthly_revenue": monthly_revenue,
                    "total_revenue": sum(r["amount"] for r in self.purchase_revenue),
                    "revenue_history_size": len(self.purchase_revenue)
                },
                "feature_stats": {
                    "total_features": len(self.features),
                    "active_features": len([f for f in self.features.values() if f.active]),
                    "feature_popularity": feature_popularity
                },
                "bundle_stats": {
                    "total_bundles": len(self.bundles),
                    "active_bundles": len([b for b in self.bundles.values() if b.active]),
                    "bundle_purchases": sum(b.purchased_count for b in self.bundles.values())
                },
                "usage_stats": {
                    "total_usage_records": len(self.feature_usage),
                    "unique_features_used": len(set(u.feature_id for u in self.feature_usage.values()))
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get in-app purchase status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global in-app purchase service instance
in_app_purchase_service: Optional[InAppPurchaseService] = None

def get_in_app_purchase_service(config: Dict[str, Any] = None) -> InAppPurchaseService:
    """Get or create in-app purchase service instance"""
    global in_app_purchase_service
    if in_app_purchase_service is None:
        in_app_purchase_service = InAppPurchaseService(config)
    return in_app_purchase_service

async def start_in_app_purchase_service(config: Dict[str, Any] = None) -> InAppPurchaseService:
    """Start in-app purchase service"""
    service = get_in_app_purchase_service(config)
    await service.start()
    return service

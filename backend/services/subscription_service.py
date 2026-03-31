"""
Advanced Subscription Service for PyMastery
Handles subscription plans, billing, payments, and revenue management
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
import stripe
from pathlib import Path
import statistics
from collections import deque

logger = logging.getLogger(__name__)

class SubscriptionPlan(Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"

class SubscriptionStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PENDING = "pending"
    SUSPENDED = "suspended"

class BillingCycle(Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"
    QUARTERLY = "quarterly"

class PaymentMethod(Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    CRYPTO = "crypto"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"

class FeatureType(Enum):
    COURSE_ACCESS = "course_access"
    MENTORING = "mentoring"
    CERTIFICATES = "certificates"
    AI_FEATURES = "ai_features"
    PREMIUM_SUPPORT = "premium_support"
    API_ACCESS = "api_access"
    COLLABORATION = "collaboration"
    ANALYTICS = "analytics"
    CUSTOM_BRANDING = "custom_branding"

@dataclass
class PlanFeature:
    """Subscription plan feature"""
    name: str
    type: FeatureType
    included: bool
    limit: Optional[int] = None
    description: str = ""
    value: Optional[str] = None

@dataclass
class SubscriptionPlan:
    """Subscription plan definition"""
    id: str
    name: str
    tier: SubscriptionPlan
    price_monthly: float
    price_yearly: float
    currency: str = "USD"
    features: List[PlanFeature] = None
    max_users: int = 1
    api_calls_limit: int = 1000
    storage_limit: int = 1024  # MB
    support_level: str = "basic"
    trial_days: int = 0
    setup_fee: float = 0.0
    cancellation_policy: str = "flexible"
    upgrade_discount: float = 0.0
    popular: bool = False
    description: str = ""
    metadata: Dict[str, Any] = None

@dataclass
class UserSubscription:
    """User subscription information"""
    user_id: str
    plan_id: str
    status: SubscriptionStatus
    billing_cycle: BillingCycle
    start_date: datetime
    end_date: Optional[datetime]
    trial_end_date: Optional[datetime]
    cancelled_at: Optional[datetime]
    auto_renew: bool = True
    payment_method_id: Optional[str] = None
    subscription_id: Optional[str] = None  # Stripe subscription ID
    customer_id: Optional[str] = None  # Stripe customer ID
    usage_stats: Dict[str, Any] = None
    created_at: datetime = None
    updated_at: datetime = None

@dataclass
class PaymentMethod:
    """Payment method information"""
    id: str
    user_id: str
    type: PaymentMethod
    provider: str  # stripe, paypal, etc.
    provider_method_id: str
    last_four: Optional[str] = None
    expiry_month: Optional[int] = None
    expiry_year: Optional[int] = None
    brand: Optional[str] = None
    is_default: bool = False
    metadata: Dict[str, Any] = None
    created_at: datetime = None

@dataclass
class Invoice:
    """Invoice information"""
    id: str
    user_id: str
    subscription_id: str
    amount: float
    currency: str
    status: str  # draft, open, paid, void, uncollectible
    due_date: datetime
    paid_at: Optional[datetime]
    payment_method_id: Optional[str] = None
    line_items: List[Dict[str, Any]] = None
    tax: float = 0.0
    total: float = 0.0
    description: str = ""
    metadata: Dict[str, Any] = None
    created_at: datetime = None

@dataclass
class UsageMetric:
    """Usage metric for billing"""
    user_id: str
    metric_name: str
    value: float
    unit: str
    period: str  # daily, weekly, monthly
    recorded_at: datetime

class SubscriptionService:
    """Advanced subscription service for PyMastery"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Initialize state
        self.is_running = False
        self.start_time = None
        
        # Stripe configuration
        self.stripe_secret_key = self.config.get("stripe_secret_key", "")
        self.stripe_publishable_key = self.config.get("stripe_publishable_key", "")
        self.webhook_secret = self.config.get("webhook_secret", "")
        
        # Initialize Stripe
        if self.stripe_secret_key:
            stripe.api_key = self.stripe_secret_key
        
        # Subscription plans
        self.plans: Dict[str, SubscriptionPlan] = {}
        self._initialize_plans()
        
        # User subscriptions
        self.user_subscriptions: Dict[str, UserSubscription] = {}
        
        # Payment methods
        self.payment_methods: Dict[str, PaymentMethod] = {}
        
        # Invoices
        self.invoices: Dict[str, Invoice] = {}
        
        # Usage metrics
        self.usage_metrics: Dict[str, List[UsageMetric]] = {}
        
        # Revenue tracking
        self.revenue_history: deque = deque(maxlen=1000)
        
        # HTTP session
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Background tasks
        self.billing_task: Optional[asyncio.Task] = None
        self.usage_tracking_task: Optional[asyncio.Task] = None
        self.revenue_task: Optional[asyncio.Task] = None
    
    def _initialize_plans(self):
        """Initialize subscription plans"""
        self.plans = {
            "free": SubscriptionPlan(
                id="free",
                name="Free Tier",
                tier=SubscriptionPlan.FREE,
                price_monthly=0.0,
                price_yearly=0.0,
                features=[
                    PlanFeature("Basic Courses", FeatureType.COURSE_ACCESS, True, 5, "Access to 5 basic courses"),
                    PlanFeature("Community Forum", FeatureType.COLLABORATION, True, None, "Access to community forum"),
                    PlanFeature("Basic Support", FeatureType.PREMIUM_SUPPORT, True, None, "Email support"),
                    PlanFeature("API Access", FeatureType.API_ACCESS, True, 100, "100 API calls per month"),
                ],
                max_users=1,
                api_calls_limit=100,
                storage_limit=1024,
                support_level="basic",
                description="Perfect for getting started with programming",
                metadata={"tier": "free", "trial": False}
            ),
            
            "basic": SubscriptionPlan(
                id="basic",
                name="Basic Plan",
                tier=SubscriptionPlan.BASIC,
                price_monthly=9.99,
                price_yearly=99.99,
                features=[
                    PlanFeature("All Courses", FeatureType.COURSE_ACCESS, True, 50, "Access to 50 courses"),
                    PlanFeature("Community Forum", FeatureType.COLLABORATION, True, None, "Full community access"),
                    PlanFeature("Basic Certificates", FeatureType.CERTIFICATES, True, 5, "5 course certificates"),
                    PlanFeature("AI Assistant", FeatureType.AI_FEATURES, True, 50, "50 AI assistant queries"),
                    PlanFeature("Priority Support", FeatureType.PREMIUM_SUPPORT, True, None, "24-hour response time"),
                    PlanFeature("API Access", FeatureType.API_ACCESS, True, 1000, "1000 API calls per month"),
                ],
                max_users=1,
                api_calls_limit=1000,
                storage_limit=5120,
                support_level="priority",
                trial_days=14,
                description="Great for serious learners",
                popular=True,
                metadata={"tier": "basic", "trial": True}
            ),
            
            "pro": SubscriptionPlan(
                id="pro",
                name="Pro Plan",
                tier=SubscriptionPlan.PRO,
                price_monthly=29.99,
                price_yearly=299.99,
                features=[
                    PlanFeature("Unlimited Courses", FeatureType.COURSE_ACCESS, True, None, "Access to all courses"),
                    PlanFeature("1-on-1 Mentoring", FeatureType.MENTORING, True, 2, "2 hours mentoring per month"),
                    PlanFeature("Premium Certificates", FeatureType.CERTIFICATES, True, None, "Unlimited certificates"),
                    PlanFeature("Advanced AI Features", FeatureType.AI_FEATURES, True, None, "Unlimited AI assistant"),
                    PlanFeature("Priority Support", FeatureType.PREMIUM_SUPPORT, True, None, "4-hour response time"),
                    PlanFeature("API Access", FeatureType.API_ACCESS, True, 10000, "10000 API calls per month"),
                    PlanFeature("Analytics Dashboard", FeatureType.ANALYTICS, True, None, "Advanced analytics"),
                ],
                max_users=3,
                api_calls_limit=10000,
                storage_limit=20480,
                support_level="priority",
                trial_days=14,
                description="Professional developers and teams",
                metadata={"tier": "pro", "trial": True}
            ),
            
            "enterprise": SubscriptionPlan(
                id="enterprise",
                name="Enterprise Plan",
                tier=SubscriptionPlan.ENTERPRISE,
                price_monthly=99.99,
                price_yearly=999.99,
                features=[
                    PlanFeature("Unlimited Everything", FeatureType.COURSE_ACCESS, True, None, "Unlimited access to all features"),
                    PlanFeature("Dedicated Mentoring", FeatureType.MENTORING, True, 20, "20 hours mentoring per month"),
                    PlanFeature("Custom Certificates", FeatureType.CERTIFICATES, True, None, "Custom branded certificates"),
                    PlanFeature("Enterprise AI", FeatureType.AI_FEATURES, True, None, "Custom AI models"),
                    PlanFeature("24/7 Support", FeatureType.PREMIUM_SUPPORT, True, None, "24/7 phone support"),
                    PlanFeature("API Access", FeatureType.API_ACCESS, True, 100000, "100000 API calls per month"),
                    PlanFeature("Custom Analytics", FeatureType.ANALYTICS, True, None, "Custom analytics dashboard"),
                    PlanFeature("Custom Branding", FeatureType.CUSTOM_BRANDING, True, None, "White-label options"),
                ],
                max_users=50,
                api_calls_limit=100000,
                storage_limit=102400,
                support_level="enterprise",
                description="For large teams and organizations",
                metadata={"tier": "enterprise", "trial": False}
            )
        }
    
    async def start(self):
        """Start the subscription service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Create HTTP session
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        
        # Start background tasks
        self.billing_task = asyncio.create_task(self._billing_loop())
        self.usage_tracking_task = asyncio.create_task(self._usage_tracking_loop())
        self.revenue_task = asyncio.create_task(self._revenue_tracking_loop())
        
        logger.info("Subscription service started",
                   extra_fields={
                       "event_type": "subscription_service_started",
                       "plans": list(self.plans.keys())
                   })
    
    async def stop(self):
        """Stop the subscription service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel background tasks
        if self.billing_task:
            self.billing_task.cancel()
        if self.usage_tracking_task:
            self.usage_tracking_task.cancel()
        if self.revenue_task:
            self.revenue_task.cancel()
        
        # Close HTTP session
        if self.session:
            await self.session.close()
        
        logger.info("Subscription service stopped",
                   extra_fields={
                       "event_type": "subscription_service_stopped"
                   })
    
    async def create_subscription(self, user_id: str, plan_id: str, 
                                billing_cycle: BillingCycle, payment_method_id: str = None,
                                trial: bool = False) -> UserSubscription:
        """Create a new subscription"""
        try:
            plan = self.plans.get(plan_id)
            if not plan:
                raise ValueError(f"Plan {plan_id} not found")
            
            # Calculate pricing
            if billing_cycle == BillingCycle.YEARLY:
                price = plan.price_yearly
            elif billing_cycle == BillingCycle.QUARTERLY:
                price = plan.price_monthly * 3
            else:
                price = plan.price_monthly
            
            # Create subscription
            now = datetime.now(timezone.utc)
            subscription = UserSubscription(
                user_id=user_id,
                plan_id=plan_id,
                status=SubscriptionStatus.PENDING,
                billing_cycle=billing_cycle,
                start_date=now,
                end_date=None,
                trial_end_date=now + timedelta(days=plan.trial_days) if trial and plan.trial_days > 0 else None,
                auto_renew=True,
                payment_method_id=payment_method_id,
                created_at=now,
                updated_at=now
            )
            
            # Create Stripe subscription if payment method provided
            if payment_method_id and self.stripe_secret_key:
                stripe_subscription = await self._create_stripe_subscription(
                    user_id, plan, billing_cycle, payment_method_id, trial
                )
                subscription.subscription_id = stripe_subscription.id
                subscription.customer_id = stripe_subscription.customer
                subscription.status = SubscriptionStatus.ACTIVE
                
                # Set end date based on billing cycle
                if billing_cycle == BillingCycle.YEARLY:
                    subscription.end_date = now + timedelta(days=365)
                elif billing_cycle == BillingCycle.QUARTERLY:
                    subscription.end_date = now + timedelta(days=90)
                else:
                    subscription.end_date = now + timedelta(days=30)
            else:
                # Free plan or no payment method
                subscription.status = SubscriptionStatus.ACTIVE
                subscription.end_date = now + timedelta(days=365) if plan.tier == SubscriptionPlan.FREE else None
            
            # Store subscription
            self.user_subscriptions[user_id] = subscription
            
            logger.info(f"Subscription created for user {user_id}: {plan_id}",
                       extra_fields={
                           "event_type": "subscription_created",
                           "user_id": user_id,
                           "plan_id": plan_id,
                           "billing_cycle": billing_cycle.value,
                           "trial": trial
                       })
            
            return subscription
        
        except Exception as e:
            logger.error(f"Failed to create subscription: {e}")
            raise
    
    async def _create_stripe_subscription(self, user_id: str, plan: SubscriptionPlan,
                                         billing_cycle: BillingCycle, payment_method_id: str,
                                         trial: bool) -> stripe.Subscription:
        """Create Stripe subscription"""
        try:
            # Get or create Stripe customer
            customer = await self._get_or_create_stripe_customer(user_id)
            
            # Create subscription
            subscription_data = {
                "customer": customer.id,
                "items": [{
                    "price_data": {
                        "currency": plan.currency.lower(),
                        "unit_amount": int(plan.price_monthly * 100),  # Convert to cents
                        "product_data": {
                            "name": plan.name,
                            "description": plan.description,
                        },
                        "recurring": {
                            "interval": billing_cycle.value.replace("ly", ""),
                        },
                    },
                }],
                "default_payment_method": payment_method_id,
                "expand": ["latest_invoice.payment_intent"],
            }
            
            # Add trial if applicable
            if trial and plan.trial_days > 0:
                subscription_data["trial_period_days"] = plan.trial_days
            
            subscription = stripe.Subscription.create(**subscription_data)
            
            return subscription
        
        except Exception as e:
            logger.error(f"Failed to create Stripe subscription: {e}")
            raise
    
    async def _get_or_create_stripe_customer(self, user_id: str) -> stripe.Customer:
        """Get or create Stripe customer"""
        try:
            # This would typically get user info from database
            # For now, create a basic customer
            customer_data = {
                "email": f"user_{user_id}@pymastery.com",
                "name": f"User {user_id}",
                "metadata": {"user_id": user_id}
            }
            
            customer = stripe.Customer.create(**customer_data)
            return customer
        
        except Exception as e:
            logger.error(f"Failed to get/create Stripe customer: {e}")
            raise
    
    async def cancel_subscription(self, user_id: str, immediate: bool = False) -> bool:
        """Cancel user subscription"""
        try:
            subscription = self.user_subscriptions.get(user_id)
            if not subscription:
                raise ValueError(f"No subscription found for user {user_id}")
            
            if subscription.subscription_id and self.stripe_secret_key:
                # Cancel Stripe subscription
                stripe.Subscription.delete(
                    subscription.subscription_id,
                    at_period_end=not immediate
                )
            
            # Update subscription status
            subscription.status = SubscriptionStatus.CANCELLED
            subscription.cancelled_at = datetime.now(timezone.utc)
            subscription.auto_renew = False
            subscription.updated_at = datetime.now(timezone.utc)
            
            logger.info(f"Subscription cancelled for user {user_id}",
                       extra_fields={
                           "event_type": "subscription_cancelled",
                           "user_id": user_id,
                           "immediate": immediate
                       })
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to cancel subscription: {e}")
            return False
    
    async def upgrade_subscription(self, user_id: str, new_plan_id: str) -> UserSubscription:
        """Upgrade user subscription"""
        try:
            current_subscription = self.user_subscriptions.get(user_id)
            if not current_subscription:
                raise ValueError(f"No subscription found for user {user_id}")
            
            new_plan = self.plans.get(new_plan_id)
            if not new_plan:
                raise ValueError(f"Plan {new_plan_id} not found")
            
            # Cancel current subscription
            await self.cancel_subscription(user_id, immediate=True)
            
            # Create new subscription
            new_subscription = await self.create_subscription(
                user_id, new_plan_id, current_subscription.billing_cycle,
                current_subscription.payment_method_id
            )
            
            logger.info(f"Subscription upgraded for user {user_id}: {new_plan_id}",
                       extra_fields={
                           "event_type": "subscription_upgraded",
                           "user_id": user_id,
                           "old_plan": current_subscription.plan_id,
                           "new_plan": new_plan_id
                       })
            
            return new_subscription
        
        except Exception as e:
            logger.error(f"Failed to upgrade subscription: {e}")
            raise
    
    async def add_payment_method(self, user_id: str, payment_method_data: Dict[str, Any]) -> PaymentMethod:
        """Add payment method for user"""
        try:
            if not self.stripe_secret_key:
                raise ValueError("Stripe not configured")
            
            # Create payment method in Stripe
            stripe_payment_method = stripe.PaymentMethod.create(
                type=payment_method_data.get("type", "card"),
                card=payment_method_data.get("card"),
                billing_details=payment_method_data.get("billing_details")
            )
            
            # Attach to customer
            customer = await self._get_or_create_stripe_customer(user_id)
            stripe.PaymentMethod.attach(
                stripe_payment_method.id,
                customer=customer.id
            )
            
            # Create payment method record
            payment_method = PaymentMethod(
                id=stripe_payment_method.id,
                user_id=user_id,
                type=PaymentMethod(payment_method_data.get("type", "card")),
                provider="stripe",
                provider_method_id=stripe_payment_method.id,
                last_four=payment_method_data.get("card", {}).get("last4"),
                expiry_month=payment_method_data.get("card", {}).get("exp_month"),
                expiry_year=payment_method_data.get("card", {}).get("exp_year"),
                brand=payment_method_data.get("card", {}).get("brand"),
                is_default=payment_method_data.get("is_default", False),
                created_at=datetime.now(timezone.utc)
            )
            
            # Store payment method
            self.payment_methods[payment_method.id] = payment_method
            
            logger.info(f"Payment method added for user {user_id}",
                       extra_fields={
                           "event_type": "payment_method_added",
                           "user_id": user_id,
                           "payment_method_id": payment_method.id
                       })
            
            return payment_method
        
        except Exception as e:
            logger.error(f"Failed to add payment method: {e}")
            raise
    
    async def get_user_subscription(self, user_id: str) -> Optional[UserSubscription]:
        """Get user subscription"""
        subscription = self.user_subscriptions.get(user_id)
        
        if subscription:
            # Check if subscription is expired
            if subscription.end_date and subscription.end_date < datetime.now(timezone.utc):
                subscription.status = SubscriptionStatus.EXPIRED
                subscription.updated_at = datetime.now(timezone.utc)
        
        return subscription
    
    async def get_available_plans(self) -> List[SubscriptionPlan]:
        """Get available subscription plans"""
        return list(self.plans.values())
    
    async def get_plan_features(self, plan_id: str) -> List[PlanFeature]:
        """Get features for a specific plan"""
        plan = self.plans.get(plan_id)
        return plan.features if plan else []
    
    async def track_usage(self, user_id: str, metric_name: str, value: float, unit: str, period: str = "monthly"):
        """Track usage for billing"""
        try:
            metric = UsageMetric(
                user_id=user_id,
                metric_name=metric_name,
                value=value,
                unit=unit,
                period=period,
                recorded_at=datetime.now(timezone.utc)
            )
            
            if user_id not in self.usage_metrics:
                self.usage_metrics[user_id] = []
            
            self.usage_metrics[user_id].append(metric)
            
            # Check if user is approaching limits
            await self._check_usage_limits(user_id)
            
        except Exception as e:
            logger.error(f"Failed to track usage: {e}")
    
    async def _check_usage_limits(self, user_id: str):
        """Check if user is approaching usage limits"""
        try:
            subscription = await self.get_user_subscription(user_id)
            if not subscription:
                return
            
            plan = self.plans.get(subscription.plan_id)
            if not plan:
                return
            
            # Check API calls limit
            api_calls = self._get_usage_metric(user_id, "api_calls", "monthly")
            if api_calls and api_calls >= plan.api_calls_limit * 0.9:
                logger.warning(f"User {user_id} approaching API calls limit",
                           extra_fields={
                               "event_type": "usage_limit_warning",
                               "user_id": user_id,
                               "metric": "api_calls",
                               "current": api_calls,
                               "limit": plan.api_calls_limit
                           })
        
        except Exception as e:
            logger.error(f"Failed to check usage limits: {e}")
    
    def _get_usage_metric(self, user_id: str, metric_name: str, period: str) -> Optional[float]:
        """Get usage metric value"""
        if user_id not in self.usage_metrics:
            return None
        
        current_month = datetime.now(timezone.utc).replace(day=1)
        
        total = 0
        for metric in self.usage_metrics[user_id]:
            if (metric.metric_name == metric_name and 
                metric.period == period and 
                metric.recorded_at >= current_month):
                total += metric.value
        
        return total
    
    async def _billing_loop(self):
        """Background billing loop"""
        while self.is_running:
            try:
                # Process recurring billing
                await self._process_recurring_billing()
                
                # Generate invoices
                await self._generate_invoices()
                
                # Sleep until next billing cycle
                await asyncio.sleep(3600)  # Check every hour
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Billing loop error: {e}")
                await asyncio.sleep(3600)
    
    async def _process_recurring_billing(self):
        """Process recurring billing"""
        try:
            now = datetime.now(timezone.utc)
            
            for user_id, subscription in self.user_subscriptions.items():
                if (subscription.status == SubscriptionStatus.ACTIVE and
                    subscription.auto_renew and
                    subscription.end_date and
                    subscription.end_date <= now):
                    
                    # Process renewal
                    await self._process_renewal(subscription)
        
        except Exception as e:
            logger.error(f"Failed to process recurring billing: {e}")
    
    async def _process_renewal(self, subscription: UserSubscription):
        """Process subscription renewal"""
        try:
            plan = self.plans.get(subscription.plan_id)
            if not plan:
                logger.error(f"Plan {subscription.plan_id} not found for renewal")
                return
            
            # Create new invoice
            invoice = await self._create_invoice(
                subscription.user_id,
                subscription.plan_id,
                subscription.billing_cycle
            )
            
            # Process payment
            if subscription.payment_method_id:
                payment_success = await self._process_payment(
                    invoice.id, subscription.payment_method_id
                )
                
                if payment_success:
                    # Update subscription
                    subscription.end_date = self._calculate_next_billing_date(
                        subscription.billing_cycle
                    )
                    subscription.updated_at = datetime.now(timezone.utc)
                    
                    logger.info(f"Subscription renewed for user {subscription.user_id}",
                               extra_fields={
                                   "event_type": "subscription_renewed",
                                   "user_id": subscription.user_id,
                                   "plan_id": subscription.plan_id
                               })
                else:
                    # Handle payment failure
                    subscription.status = SubscriptionStatus.SUSPENDED
                    logger.warning(f"Payment failed for subscription renewal: {subscription.user_id}")
        
        except Exception as e:
            logger.error(f"Failed to process renewal: {e}")
    
    def _calculate_next_billing_date(self, billing_cycle: BillingCycle) -> datetime:
        """Calculate next billing date"""
        now = datetime.now(timezone.utc)
        
        if billing_cycle == BillingCycle.YEARLY:
            return now + timedelta(days=365)
        elif billing_cycle == BillingCycle.QUARTERLY:
            return now + timedelta(days=90)
        else:
            return now + timedelta(days=30)
    
    async def _create_invoice(self, user_id: str, plan_id: str, 
                             billing_cycle: BillingCycle) -> Invoice:
        """Create invoice"""
        try:
            plan = self.plans.get(plan_id)
            if not plan:
                raise ValueError(f"Plan {plan_id} not found")
            
            # Calculate amount
            if billing_cycle == BillingCycle.YEARLY:
                amount = plan.price_yearly
            elif billing_cycle == BillingCycle.QUARTERLY:
                amount = plan.price_monthly * 3
            else:
                amount = plan.price_monthly
            
            # Create invoice
            invoice = Invoice(
                id=f"inv_{int(time.time())}_{user_id}",
                user_id=user_id,
                subscription_id=f"sub_{user_id}",
                amount=amount,
                currency=plan.currency,
                status="draft",
                due_date=datetime.now(timezone.utc) + timedelta(days=7),
                total=amount,
                description=f"{plan.name} - {billing_cycle.value}",
                created_at=datetime.now(timezone.utc)
            )
            
            self.invoices[invoice.id] = invoice
            
            return invoice
        
        except Exception as e:
            logger.error(f"Failed to create invoice: {e}")
            raise
    
    async def _process_payment(self, invoice_id: str, payment_method_id: str) -> bool:
        """Process payment for invoice"""
        try:
            invoice = self.invoices.get(invoice_id)
            if not invoice:
                raise ValueError(f"Invoice {invoice_id} not found")
            
            # Process payment with Stripe
            if self.stripe_secret_key:
                # Create payment intent
                payment_intent = stripe.PaymentIntent.create(
                    amount=int(invoice.total * 100),  # Convert to cents
                    currency=invoice.currency.lower(),
                    payment_method=payment_method_id,
                    confirm=True,
                    customer=self.user_subscriptions[invoice.user_id].customer_id
                )
                
                if payment_intent.status == "succeeded":
                    invoice.status = "paid"
                    invoice.paid_at = datetime.now(timezone.utc)
                    invoice.payment_method_id = payment_method_id
                    
                    # Track revenue
                    self.revenue_history.append({
                        "amount": invoice.total,
                        "currency": invoice.currency,
                        "timestamp": datetime.now(timezone.utc),
                        "user_id": invoice.user_id,
                        "type": "subscription"
                    })
                    
                    return True
                else:
                    invoice.status = "failed"
                    return False
            
            return False
        
        except Exception as e:
            logger.error(f"Failed to process payment: {e}")
            return False
    
    async def _generate_invoices(self):
        """Generate invoices for billing"""
        try:
            # This would generate invoices for all due subscriptions
            # For now, just log the action
            logger.debug("Invoice generation completed")
        
        except Exception as e:
            logger.error(f"Failed to generate invoices: {e}")
    
    async def _usage_tracking_loop(self):
        """Usage tracking loop"""
        while self.is_running:
            try:
                # Aggregate usage metrics
                await self._aggregate_usage_metrics()
                
                # Check for billing events
                await self._check_billing_events()
                
                # Sleep until next tracking cycle
                await asyncio.sleep(3600)  # Track every hour
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Usage tracking loop error: {e}")
                await asyncio.sleep(3600)
    
    async def _aggregate_usage_metrics(self):
        """Aggregate usage metrics"""
        try:
            # This would aggregate usage metrics for billing
            logger.debug("Usage metrics aggregation completed")
        
        except Exception as e:
            logger.error(f"Failed to aggregate usage metrics: {e}")
    
    async def _check_billing_events(self):
        """Check for billing events"""
        try:
            # This would check for billing events from payment providers
            logger.debug("Billing events check completed")
        
        except Exception as e:
            logger.error(f"Failed to check billing events: {e}")
    
    async def _revenue_tracking_loop(self):
        """Revenue tracking loop"""
        while self.is_running:
            try:
                # Calculate revenue metrics
                await self._calculate_revenue_metrics()
                
                # Sleep until next tracking cycle
                await asyncio.sleep(86400)  # Track daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Revenue tracking loop error: {e}")
                await asyncio.sleep(86400)
    
    async def _calculate_revenue_metrics(self):
        """Calculate revenue metrics"""
        try:
            # Calculate daily, monthly, yearly revenue
            now = datetime.now(timezone.utc)
            
            daily_revenue = 0
            monthly_revenue = 0
            yearly_revenue = 0
            
            for revenue in self.revenue_history:
                if (now - revenue["timestamp"]).days <= 1:
                    daily_revenue += revenue["amount"]
                if (now - revenue["timestamp"]).days <= 30:
                    monthly_revenue += revenue["amount"]
                if (now - revenue["timestamp"]).days <= 365:
                    yearly_revenue += revenue["amount"]
            
            logger.info(f"Revenue metrics calculated",
                       extra_fields={
                           "event_type": "revenue_metrics",
                           "daily_revenue": daily_revenue,
                           "monthly_revenue": monthly_revenue,
                           "yearly_revenue": yearly_revenue
                       })
        
        except Exception as e:
            logger.error(f"Failed to calculate revenue metrics: {e}")
    
    def get_subscription_status(self) -> Dict[str, Any]:
        """Get subscription service status"""
        try:
            # Calculate statistics
            total_subscriptions = len(self.user_subscriptions)
            active_subscriptions = len([
                s for s in self.user_subscriptions.values()
                if s.status == SubscriptionStatus.ACTIVE
            ])
            
            # Calculate revenue
            current_month = datetime.now(timezone.utc).replace(day=1)
            monthly_revenue = sum(
                revenue["amount"] for revenue in self.revenue_history
                if revenue["timestamp"] >= current_month
            )
            
            # Plan distribution
            plan_distribution = {}
            for subscription in self.user_subscriptions.values():
                plan = subscription.plan_id
                plan_distribution[plan] = plan_distribution.get(plan, 0) + 1
            
            return {
                "service_status": {
                    "is_running": self.is_running,
                    "start_time": self.start_time.isoformat() if self.start_time else None,
                    "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
                },
                "subscription_stats": {
                    "total_subscriptions": total_subscriptions,
                    "active_subscriptions": active_subscriptions,
                    "cancelled_subscriptions": len([
                        s for s in self.user_subscriptions.values()
                        if s.status == SubscriptionStatus.CANCELLED
                    ]),
                    "expired_subscriptions": len([
                        s for s in self.user_subscriptions.values()
                        if s.status == SubscriptionStatus.EXPIRED
                    ]),
                    "plan_distribution": plan_distribution
                },
                "revenue_stats": {
                    "monthly_revenue": monthly_revenue,
                    "total_revenue": sum(r["amount"] for r in self.revenue_history),
                    "revenue_history_size": len(self.revenue_history)
                },
                "available_plans": len(self.plans),
                "payment_methods": len(self.payment_methods),
                "invoices": len(self.invoices),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get subscription status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global subscription service instance
subscription_service: Optional[SubscriptionService] = None

def get_subscription_service(config: Dict[str, Any] = None) -> SubscriptionService:
    """Get or create subscription service instance"""
    global subscription_service
    if subscription_service is None:
        subscription_service = SubscriptionService(config)
    return subscription_service

async def start_subscription_service(config: Dict[str, Any] = None) -> SubscriptionService:
    """Start subscription service"""
    service = get_subscription_service(config)
    await service.start()
    return service

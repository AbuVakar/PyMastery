# Business & Monetization Features Guide

## Overview

PyMastery now includes comprehensive business and monetization features to support various revenue models and user engagement strategies. This guide covers all implemented features, their usage, and integration points.

## Table of Contents

1. [Subscription Plans](#subscription-plans)
2. [In-App Purchases](#in-app-purchases)
3. [Enterprise Plans](#enterprise-plans)
4. [Freemium Model](#freemium-model)
5. [API Monetization](#api-monetization)
6. [Integration Guide](#integration-guide)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Subscription Plans

### Overview

Subscription plans provide recurring revenue through tiered access to platform features. Users can choose plans based on their needs and budget.

### Available Plans

#### Free Plan
- **Price**: $0/month
- **Features**: Basic course access, community support, progress tracking
- **Target**: New users trying the platform

#### Basic Plan
- **Price**: $9.99/month
- **Features**: All courses, basic certificates, email support, AI assistance (limited)
- **Target**: Individual learners

#### Premium Plan
- **Price**: $19.99/month
- **Features**: Unlimited courses, premium certificates, priority support, advanced AI features
- **Target**: Serious learners and professionals

#### Pro Plan
- **Price**: $39.99/month
- **Features**: Everything in Premium + expert mentoring, custom learning paths, advanced analytics
- **Target**: Career-focused learners

### Key Features

- **Flexible Billing**: Monthly, quarterly, and annual billing cycles
- **Automatic Renewal**: Hassle-free subscription management
- **Easy Upgrades/Downgrades**: Seamless plan changes
- **Trial Periods**: Try before you buy options
- **Payment Methods**: Multiple payment options including credit cards and digital wallets
- **Invoice Management**: Detailed billing history and receipts

### Implementation

```python
# Create a subscription
subscription = await subscription_service.create_subscription(
    user_id="user123",
    plan_id="premium",
    billing_cycle="monthly",
    payment_method_id="pm_123456789",
    trial=True
)

# Upgrade subscription
await subscription_service.upgrade_subscription(user_id="user123", new_plan_id="pro")

# Cancel subscription
await subscription_service.cancel_subscription(user_id="user123", immediate=False)
```

## In-App Purchases

### Overview

In-app purchases allow users to buy specific features and content without subscribing to a full plan. This provides flexibility for users who want targeted functionality.

### Available Features

#### Course Content
- **Individual Courses**: Purchase specific courses
- **Course Bundles**: Discounted course packages
- **Advanced Modules**: Premium course content

#### AI Features
- **AI Tutoring**: Personalized AI assistance
- **Code Review**: Automated code analysis
- **Learning Recommendations**: AI-powered suggestions

#### Certificates
- **Premium Certificates**: Blockchain-verified certificates
- **Specialized Certifications**: Industry-specific credentials
- **Certificate Upgrades**: Enhanced certificate features

#### Support Services
- **Expert Mentoring**: 1-on-1 expert sessions
- **Priority Support**: Faster response times
- **Career Guidance**: Professional development services

### Purchase Types

- **One-time Purchases**: Permanent access to content
- **Consumable Purchases**: Usage-based credits
- **Subscription Add-ons**: Additional features for existing subscribers
- **Lifetime Access**: Permanent feature access

### Implementation

```python
# Purchase a feature
purchase = await in_app_purchase_service.purchase_feature(
    user_id="user123",
    feature_id="ai_tutoring",
    platform="web",
    payment_method_data={"method": "credit_card"}
)

# Purchase a bundle
bundle_purchases = await in_app_purchase_service.purchase_bundle(
    user_id="user123",
    bundle_id="advanced_python_bundle",
    platform="web"
)

# Get user purchases
user_purchases = await in_app_purchase_service.get_user_purchases(user_id="user123")
```

## Enterprise Plans

### Overview

Enterprise plans provide B2B solutions for companies, educational institutions, and organizations that need team-based learning solutions.

### Available Plans

#### Startup Plan
- **Price**: $15.99 per user/month
- **Users**: 5-50 users
- **Features**: Team collaboration, basic analytics, email support
- **Setup Fee**: $500

#### Business Plan
- **Price**: $25.99 per user/month
- **Users**: 10-500 users
- **Features**: Advanced analytics, priority support, custom branding
- **Setup Fee**: $2,000

#### Enterprise Plan
- **Price**: $49.99 per user/month
- **Users**: 50-10,000 users
- **Features**: Full feature access, dedicated support, custom integrations
- **Setup Fee**: $10,000

#### Custom Solution
- **Price**: Custom pricing
- **Users**: 100-50,000 users
- **Features**: Fully customized solutions
- **Setup Fee**: $50,000+

### Key Features

- **Team Management**: Centralized user administration
- **SSO Integration**: Single sign-on support
- **Custom Branding**: White-label options
- **Dedicated Support**: 24/7 enterprise support
- **Compliance**: GDPR, SOC2, and other compliance standards
- **Custom Integrations**: API and webhook integrations
- **Analytics**: Advanced team analytics and reporting
- **On-Premise Deployment**: Optional on-premise hosting

### Implementation

```python
# Create enterprise account
account = await enterprise_service.create_enterprise_account({
    "company_name": "Tech Corp",
    "contact_email": "admin@techcorp.com",
    "contact_name": "John Doe",
    "contact_phone": "+1-555-0123",
    "plan_id": "business",
    "user_count": 25,
    "billing_address": {...}
})

# Add users to account
user = await enterprise_service.add_enterprise_user(
    account_id="ent_123",
    user_data={
        "email": "employee@techcorp.com",
        "name": "Jane Smith",
        "role": "developer",
        "department": "engineering"
    }
)

# Configure SSO
await enterprise_service.configure_sso(
    account_id="ent_123",
    sso_config={
        "provider": "saml",
        "client_id": "saml_client_id",
        "client_secret": "saml_secret"
    }
)
```

## Freemium Model

### Overview

The freemium model provides free access to basic features while encouraging upgrades to premium tiers through intelligent feature gating and conversion optimization.

### Tier Structure

#### Free Tier
- **Features**: Basic course access, community support, progress tracking
- **Limitations**: 5 courses, 10 AI requests/month, basic certificates
- **Target**: New users and casual learners

#### Basic Tier
- **Features**: 20 courses, 50 AI requests/month, priority support
- **Limitations**: No advanced analytics, no expert mentoring
- **Target**: Regular learners

#### Premium Tier
- **Features**: Unlimited courses, 500 AI requests/month, advanced features
- **Limitations**: No custom branding, no dedicated support
- **Target**: Serious learners

#### Pro Tier
- **Features**: Unlimited everything, custom features, dedicated support
- **Limitations**: None
- **Target**: Power users and professionals

### Conversion Strategy

- **Usage-Based Triggers**: Upgrade prompts when limits are reached
- **Feature Requests**: Suggest upgrades for premium features
- **Engagement-Based**: Personalized offers based on usage patterns
- **Time-Based**: Trial expiration and limited-time offers
- **Social Proof**: Show peer adoption and success stories

### Implementation

```python
# Check feature access
access_result = await freemium_service.check_feature_access(
    user_id="user123",
    feature_id="advanced_courses"
)

# Upgrade user tier
await freemium_service.upgrade_user_tier(
    user_id="user123",
    new_tier=UserTier.PREMIUM
)

# Update user activity
await freemium_service.update_user_activity(
    user_id="user123",
    session_data={
        "duration": 45,
        "courses_viewed": 3,
        "ai_requests": 5
    }
)
```

## API Monetization

### Overview

API monetization provides paid access to PyMastery's API endpoints for developers and businesses who want to integrate PyMastery features into their applications.

### Available Plans

#### Free Plan
- **Price**: $0/month
- **Requests**: 1,000 requests/month, 10 requests/minute
- **Endpoints**: Basic course data, leaderboards, progress tracking
- **Target**: Developers trying the API

#### Basic Plan
- **Price**: $19.99/month
- **Requests**: 10,000 requests/month, 60 requests/minute
- **Endpoints**: Code execution, user analytics, course data
- **Target**: Small applications and startups

#### Professional Plan
- **Price**: $99.99/month
- **Requests**: 100,000 requests/month, 300 requests/minute
- **Endpoints**: All endpoints including AI features
- **Target**: Professional applications and growing businesses

#### Enterprise Plan
- **Price**: $499.99/month
- **Requests**: 1,000,000 requests/month, 1,000 requests/minute
- **Endpoints**: All endpoints with custom features
- **Target**: Large enterprises and high-volume applications

### Key Features

- **API Key Management**: Secure key generation and management
- **Rate Limiting**: Intelligent rate limiting with burst handling
- **Usage Analytics**: Detailed usage statistics and reporting
- **Billing Integration**: Automated billing based on usage
- **Endpoint Access**: Granular endpoint access control
- **IP Restrictions**: Optional IP whitelisting
- **Webhooks**: Real-time usage notifications
- **Documentation**: Comprehensive API documentation

### Implementation

```python
# Create API key
api_key = await api_service.create_api_key(
    user_id="user123",
    plan_id="professional",
    key_data={
        "name": "My Application API Key",
        "description": "API key for my learning app",
        "allowed_ips": ["192.168.1.100", "10.0.0.50"]
    }
)

# Validate API key
key_info = await api_service.validate_api_key(
    api_key="pk_live_1234567890abcdef",
    ip_address="192.168.1.100"
)

# Check rate limits
rate_check = await api_service.check_rate_limit(
    api_key_id="key_123",
    endpoint=APIEndpoint.CODE_EXECUTION
)

# Log API request
await api_service.log_api_request(
    api_key_id="key_123",
    endpoint=APIEndpoint.CODE_EXECUTION,
    request_data={
        "method": "POST",
        "path": "/api/v1/code/execute",
        "status_code": 200,
        "response_time_ms": 150,
        "ip_address": "192.168.1.100"
    }
)
```

## Integration Guide

### Backend Integration

1. **Service Initialization**
```python
# In main.py
from services.subscription_service import start_subscription_service
from services.in_app_purchase_service import start_in_app_purchase_service
from services.enterprise_service import start_enterprise_service
from services.freemium_service import start_freemium_service
from services.api_monetization_service import start_api_monetization_service

@app.on_event("startup")
async def startup_event():
    await start_subscription_service()
    await start_in_app_purchase_service()
    await start_enterprise_service()
    await start_freemium_service()
    await start_api_monetization_service()
```

2. **Router Registration**
```python
# In main.py
from routers.business_router import router as business_router

app.include_router(business_router)
```

3. **Middleware Integration**
```python
# Add business-specific middleware
from middleware.business_middleware import BusinessMiddleware

app.add_middleware(BusinessMiddleware)
```

### Frontend Integration

1. **API Service Setup**
```typescript
// In frontend/src/services/api.ts
const businessApi = {
  subscriptions: {
    getPlans: () => api.get('/business/subscriptions/plans'),
    createSubscription: (data) => api.post('/business/subscriptions/create', data),
    getUserSubscription: (userId) => api.get(`/business/subscriptions/user/${userId}`),
    upgradeSubscription: (userId, data) => api.post(`/business/subscriptions/${userId}/upgrade`, data),
    cancelSubscription: (userId, data) => api.post(`/business/subscriptions/${userId}/cancel`, data)
  },
  purchases: {
    getFeatures: (category, platform) => api.get('/business/purchases/features', { params: { category, platform } }),
    getBundles: (activeOnly) => api.get('/business/purchases/bundles', { params: { active_only: activeOnly } }),
    purchaseFeature: (data) => api.post('/business/purchases/buy', data),
    purchaseBundle: (data) => api.post('/business/purchases/buy-bundle', data),
    getUserPurchases: (userId, activeOnly) => api.get(`/business/purchases/user/${userId}`, { params: { active_only: activeOnly } })
  },
  enterprise: {
    getPlans: () => api.get('/business/enterprise/plans'),
    createAccount: (data) => api.post('/business/enterprise/accounts', data),
    getAccounts: (status) => api.get('/business/enterprise/accounts', { params: { status } }),
    addUser: (accountId, userData) => api.post(`/business/enterprise/accounts/${accountId}/users`, userData),
    getUsers: (accountId) => api.get(`/business/enterprise/accounts/${accountId}/users`)
  },
  freemium: {
    getFeatureAccess: (userId) => api.get(`/business/freemium/features/${userId}`),
    checkFeatureAccess: (userId, featureId) => api.get(`/business/freemium/features/${userId}/${featureId}`),
    upgradeTier: (userId, data) => api.post(`/business/freemium/users/${userId}/upgrade`, data),
    updateActivity: (userId, activityData) => api.post(`/business/freemium/users/${userId}/activity`, activityData)
  },
  api: {
    getPlans: () => api.get('/business/api/plans'),
    createKey: (data) => api.post('/business/api/keys', data),
    getUserKeys: (userId) => api.get(`/business/api/keys/${userId}`),
    upgradeKey: (keyId, data) => api.post(`/business/api/keys/${keyId}/upgrade`, data),
    revokeKey: (keyId, data) => api.post(`/business/api/keys/${keyId}/revoke`, data),
    getKeyUsage: (keyId, months) => api.get(`/business/api/keys/${keyId}/usage`, { params: { months } })
  }
};
```

2. **React Components**
```typescript
// Subscription Management Component
const SubscriptionManager = ({ userId }) => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  
  useEffect(() => {
    loadPlans();
    loadUserSubscription();
  }, []);
  
  const loadPlans = async () => {
    const response = await businessApi.subscriptions.getPlans();
    setPlans(response.data.plans);
  };
  
  const loadUserSubscription = async () => {
    const response = await businessApi.subscriptions.getUserSubscription(userId);
    setSubscription(response.data.subscription);
  };
  
  const handleUpgrade = async (newPlanId) => {
    await businessApi.subscriptions.upgradeSubscription(userId, { new_plan_id: newPlanId });
    loadUserSubscription();
  };
  
  return (
    <div>
      <h2>Subscription Management</h2>
      {subscription && (
        <div>
          <p>Current Plan: {subscription.plan_id}</p>
          <p>Status: {subscription.status}</p>
        </div>
      )}
      <div>
        <h3>Available Plans</h3>
        {plans.map(plan => (
          <div key={plan.id}>
            <h4>{plan.name} - ${plan.price_per_month}/month</h4>
            <p>{plan.description}</p>
            <button onClick={() => handleUpgrade(plan.id)}>
              Upgrade to {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Database Integration

1. **Collections Setup**
```javascript
// Subscription collections
db.createCollection("subscriptions");
db.createCollection("subscription_plans");
db.createCollection("payment_methods");
db.createCollection("invoices");

// In-app purchase collections
db.createCollection("premium_features");
db.createCollection("user_purchases");
db.createCollection("bundle_offers");

// Enterprise collections
db.createCollection("enterprise_accounts");
db.createCollection("enterprise_users");
db.createCollection("usage_reports");

// Freemium collections
db.createCollection("user_freemium_profiles");
db.createCollection("upgrade_prompts");
db.createCollection("conversion_events");

// API monetization collections
db.createCollection("api_keys");
db.createCollection("api_usage");
db.createCollection("api_billing");
```

2. **Indexes Creation**
```javascript
// Subscription indexes
db.subscriptions.createIndex({ "user_id": 1 });
db.subscriptions.createIndex({ "status": 1 });
db.subscriptions.createIndex({ "plan_id": 1 });

// Purchase indexes
db.user_purchases.createIndex({ "user_id": 1 });
db.user_purchases.createIndex({ "status": 1 });
db.user_purchases.createIndex({ "feature_id": 1 });

// Enterprise indexes
db.enterprise_accounts.createIndex({ "company_name": 1 });
db.enterprise_users.createIndex({ "account_id": 1 });
db.enterprise_users.createIndex({ "email": 1 });

// API indexes
db.api_keys.createIndex({ "user_id": 1 });
db.api_keys.createIndex({ "key_hash": 1 });
db.api_usage.createIndex({ "api_key_id": 1 });
```

## API Reference

### Subscription Endpoints

#### GET /api/v1/business/subscriptions/plans
Get available subscription plans.

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "basic",
        "name": "Basic Plan",
        "price_per_month": 9.99,
        "features": [...]
      }
    ]
  }
}
```

#### POST /api/v1/business/subscriptions/create
Create a new subscription.

**Request:**
```json
{
  "user_id": "user123",
  "plan_id": "basic",
  "billing_cycle": "monthly",
  "payment_method_id": "pm_123456789",
  "trial": true
}
```

#### GET /api/v1/business/subscriptions/user/{user_id}
Get user's subscription.

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_123",
      "user_id": "user123",
      "plan_id": "basic",
      "status": "active"
    }
  }
}
```

### In-App Purchase Endpoints

#### GET /api/v1/business/purchases/features
Get available premium features.

**Query Parameters:**
- `category` (optional): Feature category filter
- `platform` (optional): Platform filter

#### POST /api/v1/business/purchases/buy
Purchase a premium feature.

**Request:**
```json
{
  "user_id": "user123",
  "feature_id": "ai_tutoring",
  "platform": "web",
  "payment_method_data": {
    "method": "credit_card"
  }
}
```

#### GET /api/v1/business/purchases/user/{user_id}
Get user's purchases.

**Query Parameters:**
- `active_only` (optional): Filter for active purchases only

### Enterprise Endpoints

#### POST /api/v1/business/enterprise/accounts
Create enterprise account.

**Request:**
```json
{
  "company_name": "Tech Corp",
  "contact_email": "admin@techcorp.com",
  "contact_name": "John Doe",
  "plan_id": "business",
  "user_count": 25
}
```

#### POST /api/v1/business/enterprise/accounts/{account_id}/users
Add user to enterprise account.

**Request:**
```json
{
  "email": "employee@techcorp.com",
  "name": "Jane Smith",
  "role": "developer",
  "department": "engineering"
}
```

### Freemium Endpoints

#### GET /api/v1/business/freemium/features/{user_id}
Get user's feature access status.

#### GET /api/v1/business/freemium/features/{user_id}/{feature_id}
Check access to specific feature.

#### POST /api/v1/business/freemium/users/{user_id}/upgrade
Upgrade user tier.

**Request:**
```json
{
  "new_tier": "premium"
}
```

### API Monetization Endpoints

#### POST /api/v1/business/api/keys
Create API key.

**Request:**
```json
{
  "user_id": "user123",
  "plan_id": "professional",
  "name": "My App API Key",
  "description": "API key for my application"
}
```

#### GET /api/v1/business/api/keys/{user_id}
Get user's API keys.

#### POST /api/v1/business/api/keys/{key_id}/revoke
Revoke API key.

## Best Practices

### Subscription Management

1. **Clear Communication**: Always communicate plan differences clearly
2. **Easy Upgrades**: Make the upgrade process seamless
3. **Fair Pricing**: Ensure pricing reflects value provided
4. **Trial Management**: Use trials effectively to convert users
5. **Retention Focus**: Focus on keeping existing subscribers happy

### In-App Purchases

1. **Value Proposition**: Ensure purchases provide clear value
2. **Fair Pricing**: Price features appropriately
3. **Easy Discovery**: Make it easy to find and purchase features
4. **Bundle Strategy**: Use bundles to increase average order value
5. **User Experience**: Ensure smooth purchase experience

### Enterprise Sales

1. **Custom Solutions**: Tailor solutions to enterprise needs
2. **Security Focus**: Emphasize security and compliance
3. **Dedicated Support**: Provide enterprise-level support
4. **Scalability**: Ensure solutions can scale with enterprise growth
5. **Integration**: Support enterprise integration requirements

### Freemium Conversion

1. **Smart Triggers**: Use intelligent triggers for upgrade prompts
2. **Value Demonstration**: Show the value of premium features
3. **Personalization**: Personalize upgrade offers based on usage
4. **Social Proof**: Use social proof to encourage upgrades
5. **A/B Testing**: Continuously test conversion strategies

### API Monetization

1. **Clear Documentation**: Provide comprehensive API documentation
2. **Fair Limits**: Set reasonable rate limits
3. **Usage Analytics**: Provide detailed usage analytics
4. **Developer Experience**: Focus on developer experience
5. **Scalable Infrastructure**: Ensure API can handle enterprise scale

## Troubleshooting

### Common Issues

#### Subscription Issues
- **Payment Failures**: Check payment method validity
- **Plan Upgrades**: Ensure upgrade path is valid
- **Billing Errors**: Verify billing information
- **Account Status**: Check account status and permissions

#### Purchase Issues
- **Feature Access**: Verify purchase completion
- **Payment Processing**: Check payment status
- **Feature Delivery**: Ensure features are properly activated
- **Refund Requests**: Handle refund requests properly

#### Enterprise Issues
- **User Management**: Verify user permissions and roles
- **SSO Configuration**: Check SSO integration settings
- **Billing Calculations**: Verify user count and billing
- **Compliance Requirements**: Ensure compliance settings are correct

#### API Issues
- **Key Validation**: Check API key validity and permissions
- **Rate Limiting**: Monitor rate limit status
- **Endpoint Access**: Verify endpoint access permissions
- **Usage Tracking**: Check usage tracking accuracy

### Debugging Tools

1. **Service Status**: Use health check endpoints
2. **Logging**: Check service logs for errors
3. **Analytics**: Use analytics dashboards for insights
4. **Monitoring**: Set up monitoring for business metrics
5. **Alerting**: Configure alerts for critical issues

### Support Resources

1. **Documentation**: Comprehensive API and feature documentation
2. **Developer Portal**: Developer-focused resources and tools
3. **Community Forum**: Community support and discussions
4. **Enterprise Support**: Dedicated enterprise support channels
5. **Knowledge Base**: Detailed articles and guides

## Conclusion

The business and monetization features provide a comprehensive foundation for generating revenue while delivering value to users. The modular architecture allows for easy customization and expansion as business needs evolve.

### Key Benefits

- **Multiple Revenue Streams**: Diversified revenue through subscriptions, purchases, enterprise plans, and API access
- **Scalable Architecture**: Built to scale with business growth
- **User-Friendly**: Focus on user experience and value delivery
- **Developer-Friendly**: Comprehensive APIs and documentation
- **Enterprise-Ready**: Full enterprise features and compliance

### Next Steps

1. **Testing**: Comprehensive testing of all features
2. **Documentation**: Complete user and developer documentation
3. **Monitoring**: Set up comprehensive monitoring and analytics
4. **Support**: Establish support processes and teams
5. **Optimization**: Continuously optimize based on user feedback and data

For more information, refer to the API documentation and contact the development team for specific implementation guidance.

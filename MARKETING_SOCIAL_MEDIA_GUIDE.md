# Marketing & Social Media Features Guide

## Overview

PyMastery now includes comprehensive marketing and social media features to support user acquisition, engagement, and brand building. This guide covers all implemented features, their usage, and integration points.

## Table of Contents

1. [Referral Program](#referral-program)
2. [Affiliate System](#affiliate-system)
3. [Promotional Campaigns](#promotional-campaigns)
4. [Email Marketing](#email-marketing)
5. [Social Media Integration](#social-media-integration)
6. [Integration Guide](#integration-guide)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Referral Program

### Overview

The referral program encourages users to refer friends and colleagues to PyMastery through incentive-based rewards. Users can generate unique referral codes and earn rewards when their referrals convert to active users.

### Key Features

#### Referral Code Generation
- **Unique Codes**: 8-character alphanumeric codes
- **Customizable Limits**: Set maximum uses and expiration dates
- **Automatic Tracking**: Track clicks, conversions, and rewards
- **Flexible Configuration**: Per-user customization options

#### Reward System
- **Referrer Rewards**: Credits, discounts, or free months for referrers
- **Referred Rewards**: Welcome bonuses for new users
- **Conversion Bonuses**: Additional rewards for paid conversions
- **Milestone Rewards**: Special rewards for reaching referral milestones

#### Analytics & Tracking
- **Real-time Tracking**: Live referral statistics
- **Conversion Metrics**: Detailed conversion analytics
- **Revenue Impact**: Track revenue generated from referrals
- **Performance Insights**: Top referrers and conversion rates

### Implementation

#### Generate Referral Code
```python
# Create referral code for user
code = referral_service.generate_referral_code(
    user_id="user123",
    max_uses=100,
    expires_days=365
)
```

#### Create Referral
```python
# Track referral when new user signs up
referral = await referral_service.create_referral(
    referrer_id="user123",
    referred_id="user456",
    referral_code="ABC12345"
)
```

#### Convert Referral
```python
# Convert referral when user takes desired action
await referral_service.convert_referral(
    referral_id="ref_123",
    conversion_data={"action": "subscription", "value": 19.99}
)
```

### Reward Types

#### Credit Rewards
- **Amount**: $10 per successful referral
- **Usage**: Applied to user account balance
- **Expiration**: 12 months from issue date
- **Redemption**: Can be used for any purchase

#### Discount Rewards
- **Percentage**: 20% discount on first month
- **Duration**: One-time use
- **Restrictions**: Cannot be combined with other offers
- **Expiration**: 30 days from issue

#### Free Month Rewards
- **Duration**: 1 free month of premium features
- **Activation**: Automatic upon conversion
- **Limitations**: One per user per month
- **Stacking**: Cannot be combined with other free months

#### Milestone Rewards
- **5 Referrals**: Unlock advanced analytics features
- **10 Referrals**: $50 cash bonus via PayPal
- **25 Referrals**: Premium features for 6 months
- **50 Referrals**: Custom rewards and recognition

### API Endpoints

#### Referral Code Management
```
POST /api/v1/marketing/referral/codes          # Generate referral code
GET  /api/v1/marketing/referral/codes/{user_id} # Get user's referral code
```

#### Referral Tracking
```
POST /api/v1/marketing/referral/create          # Create referral record
POST /api/v1/marketing/referral/{id}/convert     # Convert referral
GET  /api/v1/marketing/referral/stats/{user_id} # Get referral stats
```

#### Analytics
```
GET /api/v1/marketing/referral/analytics         # Get program analytics
```

## Affiliate System

### Overview

The affiliate system enables partner marketing through commission-based partnerships. Affiliates can promote PyMastery and earn commissions on conversions through their unique tracking links.

### Key Features

#### Affiliate Registration
- **Partner Onboarding**: Simple registration process
- **Account Verification**: Manual approval workflow
- **Custom Profiles**: Professional affiliate profiles
- **Commission Structure**: Flexible commission rates

#### Link Generation & Tracking
- **Unique Tracking**: 16-character tracking codes
- **Custom Links**: Branded landing page URLs
- **Click Tracking**: Comprehensive click analytics
- **Conversion Tracking**: Multi-touch attribution

#### Commission Management
- **Performance-Based**: Tiered commission rates
- **Recurring Commissions**: Monthly recurring revenue share
- **Bonus Tiers**: Performance bonuses for high performers
- **Payout Processing**: Automated monthly payouts

#### Analytics Dashboard
- **Real-time Stats**: Live performance metrics
- **Revenue Tracking**: Earnings and commission analytics
- **Conversion Analytics**: Detailed conversion data
- **Performance Insights**: Top-performing content and channels

### Commission Structure

#### Standard Plans
- **Basic Plan**: 20% commission on first month
- **Professional Plan**: 25% commission on first month
- **Enterprise Plan**: 30% commission on first month

#### Recurring Commissions
- **Monthly**: 10% recurring commission on subscription renewals
- **Quarterly**: 12% recurring commission
- **Annual**: 15% recurring commission

#### Performance Bonuses
- **10 Conversions**: $50 bonus
- **25 Conversions**: $150 bonus
- **50 Conversions**: $400 bonus
- **100 Conversions**: $1,000 bonus

### Implementation

#### Register Affiliate
```python
# Register new affiliate partner
affiliate = await affiliate_service.register_affiliate({
    "name": "Tech Education Partners",
    "email": "contact@techedu.com",
    "website": "https://techedu.com",
    "commission_type": "percentage",
    "commission_rate": 0.25,
    "payout_threshold": 50.0
})
```

#### Create Tracking Link
```python
# Generate tracking link for affiliate
link = await affiliate_service.create_affiliate_link(
    affiliate_id="affiliate_123",
    link_data={
        "destination_url": "https://pymastery.com/premium",
        "campaign_id": "spring_promo"
    }
)
```

#### Track Conversions
```python
# Track conversion from affiliate link
conversion = await affiliate_service.track_affiliate_conversion({
    "tracking_code": "ABCDEF1234567890",
    "user_id": "user456",
    "conversion_type": "subscription",
    "conversion_value": 19.99
})
```

### API Endpoints

#### Affiliate Management
```
POST /api/v1/marketing/affiliate/register           # Register affiliate
POST /api/v1/marketing/affiliate/{id}/approve       # Approve affiliate
```

#### Link Management
```
POST /api/v1/marketing/affiliate/{id}/links          # Create tracking link
GET  /api/v1/marketing/affiliate/{id}/links          # Get affiliate links
```

#### Tracking & Analytics
```
POST /api/v1/marketing/affiliate/track-click        # Track affiliate click
POST /api/v1/marketing/affiliate/track-conversion   # Track conversion
GET  /api/v1/marketing/affiliate/{id}/stats          # Get affiliate stats
```

## Promotional Campaigns

### Overview

Promotional campaigns provide automated marketing workflows that trigger based on user actions and behaviors. The system supports complex trigger-action combinations for personalized marketing automation.

### Key Features

#### Campaign Types
- **Discount Campaigns**: Automated discount distribution
- **Promotional Offers**: Time-limited special offers
- **Flash Sales**: Urgent, time-sensitive promotions
- **Seasonal Campaigns**: Holiday and seasonal marketing
- **Onboarding Campaigns**: New user welcome sequences
- **Retention Campaigns**: User re-engagement campaigns

#### Trigger System
- **User Registration**: Trigger on new user signup
- **Purchase Events**: Trigger on subscription or purchase
- **Course Completion**: Trigger on course milestones
- **Login Activity**: Trigger on user login patterns
- **Inactivity Detection**: Trigger on user inactivity
- **Custom Events**: Custom business logic triggers

#### Action Types
- **Email Notifications**: Automated email delivery
- **Push Notifications**: In-app notification delivery
- **Discount Codes**: Automatic discount code generation
- **Feature Unlocks**: Temporary feature access
- **Badge Awards**: Gamification rewards
- **Points Awards**: Loyalty program points

#### Campaign Management
- **Visual Builder**: Drag-and-drop campaign builder
- **A/B Testing**: Campaign variant testing
- **Performance Analytics**: Campaign effectiveness metrics
- **Budget Management**: Campaign budget tracking

### Implementation

#### Create Campaign
```python
# Create promotional campaign
campaign = await campaign_service.create_campaign({
    "name": "Spring Sale Campaign",
    "description": "Spring promotional campaign with discounts",
    "campaign_type": "discount",
    "start_date": datetime(2024, 3, 1),
    "end_date": datetime(2024, 3, 31),
    "target_audience": {"user_segments": ["free_tier", "trial_users"]},
    "budget": 1000.0,
    "rules": {"max_discount": 30.0}
})
```

#### Add Trigger
```python
# Add trigger to campaign
trigger = await campaign_service.add_campaign_trigger(
    campaign_id="campaign_123",
    trigger_data={
        "trigger_type": "user_registration",
        "trigger_conditions": {
            "user_segments": ["new_users"],
            "time_conditions": {"delay_hours": 24}
        }
    }
)
```

#### Add Action
```python
# Add action to campaign
action = await campaign_service.add_campaign_action(
    campaign_id="campaign_123",
    action_data={
        "action_type": "discount_code",
        "action_config": {
            "discount_type": "percentage",
            "discount_value": 20.0,
            "expires_days": 7
        },
        "delay_minutes": 1440  # 24 hours
    }
)
```

#### Trigger Event
```python
# Trigger campaign event
await campaign_service.trigger_campaign_event(
    trigger_type="user_registration",
    user_id="user123",
    event_data={"registration_source": "referral"}
)
```

### Campaign Templates

#### Welcome Campaign
- **Trigger**: User registration
- **Actions**: Welcome email, onboarding guide, first-week tips
- **Goals**: User activation and engagement

#### Retention Campaign
- **Trigger**: User inactivity (7+ days)
- **Actions**: Re-engagement email, special offer, feature highlights
- **Goals**: User retention and reactivation

#### Upgrade Campaign
- **Trigger**: Feature usage limits reached
- **Actions**: Upgrade prompt, feature benefits, limited-time discount
- **Goals**: Free-to-paid conversion

#### Milestone Campaign
- **Trigger**: Course completion or achievement
- **Actions**: Congratulations email, badge award, social sharing prompt
- **Goals**: User motivation and social proof

### API Endpoints

#### Campaign Management
```
POST /api/v1/marketing/campaigns                   # Create campaign
POST /api/v1/marketing/campaigns/{id}/triggers      # Add trigger
POST /api/v1/marketing/campaigns/{id}/actions       # Add action
POST /api/v1/marketing/campaigns/{id}/launch        # Launch campaign
```

#### Event Triggering
```
POST /api/v1/marketing/campaigns/trigger-event       # Trigger campaign event
```

#### Analytics
```
GET /api/v1/marketing/campaigns/{id}/analytics       # Get campaign analytics
```

## Email Marketing

### Overview

The email marketing system provides comprehensive email campaign management with professional templates, automated delivery, and detailed analytics. It supports transactional emails, marketing campaigns, and personalized communications.

### Key Features

#### Template System
- **Professional Templates**: Beautiful HTML email templates
- **Template Types**: Marketing, transactional, notification, newsletter
- **Personalization**: Dynamic content insertion
- **Responsive Design**: Mobile-optimized templates
- **Custom Branding**: Brand-consistent styling

#### Campaign Management
- **Campaign Creation**: Easy campaign setup and configuration
- **Scheduling**: Advanced scheduling options
- **Audience Segmentation**: Targeted email lists
- **A/B Testing**: Subject line and content testing
- **Automation**: Trigger-based email sequences

#### Delivery & Tracking
- **High-Delivery Rates**: Optimized email delivery
- **Open Tracking**: Email open rate monitoring
- **Click Tracking**: Link click analytics
- **Bounce Handling**: Automated bounce processing
- **Unsubscribe Management**: Compliance with regulations

#### Analytics & Reporting
- **Real-time Stats**: Live campaign performance
- **Detailed Reports**: Comprehensive analytics
- **ROI Tracking**: Revenue attribution
- **List Management**: Email list health monitoring

### Template Types

#### Welcome Email Template
- **Purpose**: New user onboarding
- **Content**: Welcome message, features overview, next steps
- **Personalization**: User name, signup date, referral code
- **Call-to-Action**: Complete profile, start first course

#### Newsletter Template
- **Purpose**: Monthly community updates
- **Content**: Top courses, new features, user stories
- **Personalization**: User progress, recommended content
- **Call-to-Action**: Explore new content, upgrade features

#### Promotion Template
- **Purpose**: Special offers and discounts
- **Content**: Offer details, benefits, urgency
- **Personalization**: User tier, usage history
- **Call-to-Action**: Claim offer, upgrade now

#### Course Completion Template
- **Purpose**: Achievement celebration
- **Content**: Congratulations, certificate link, next steps
- **Personalization**: Course name, completion date
- **Call-to-Action**: Share achievement, continue learning

#### Retention Template
- **Purpose**: Re-engagement inactive users
- **Content**: We miss you, special offer, new features
- **Personalization**: Last activity, progress status
- **Call-to-Action**: Come back, claim offer

### Implementation

#### Create Email Campaign
```python
# Create email campaign
campaign = await email_service.create_email_campaign({
    "name": "Monthly Newsletter - March 2024",
    "description": "Monthly newsletter with updates and features",
    "campaign_type": "newsletter",
    "template_id": "newsletter_template",
    "target_audience": {"user_segments": ["active_users"]},
    "tracking_enabled": True
})
```

#### Send Campaign Email
```python
# Send campaign email to user
message = await email_service.send_campaign_email(
    campaign_id="campaign_123",
    recipient_data={
        "email": "user@example.com",
        "name": "John Doe",
        "user_id": "user123"
    }
)
```

#### Track Email Event
```python
# Track email open event
await email_service.track_email_event(
    tracking_id="ABC123",
    event_type="open",
    event_data={"timestamp": datetime.now(), "user_agent": "Mozilla/5.0"}
)
```

### Email Configuration

#### SMTP Settings
- **Multiple Providers**: Gmail, Outlook, Yahoo, custom SMTP
- **Secure Connection**: TLS/SSL encryption
- **Rate Limiting**: Respect provider rate limits
- **Fallback Providers**: Backup SMTP configurations

#### Personalization Variables
- **User Variables**: Name, email, user ID, tier
- **Content Variables**: Course names, progress, achievements
- **Dynamic Variables**: Current date, referral code, special offers
- **Conditional Logic**: Show/hide content based on conditions

### API Endpoints

#### Template Management
```
GET /api/v1/marketing/email/templates              # Get email templates
```

#### Campaign Management
```
POST /api/v1/marketing/email/campaigns              # Create email campaign
POST /api/v1/marketing/email/campaigns/{id}/schedule # Schedule campaign
POST /api/v1/marketing/email/campaigns/{id}/send     # Send campaign email
```

#### Tracking & Analytics
```
POST /api/v1/marketing/email/track-event           # Track email event
GET /api/v1/marketing/email/campaigns/{id}/analytics  # Get campaign analytics
```

## Social Media Integration

### Overview

The social media integration enables users to share their achievements, course completions, and learning progress across multiple social platforms. It also provides comprehensive analytics and engagement tracking.

### Supported Platforms

#### Major Platforms
- **Facebook**: Posts, shares, comments, reactions
- **Twitter**: Tweets, retweets, likes, mentions
- **LinkedIn**: Professional posts, articles, comments
- **Instagram**: Posts, stories, reels, IGTV

#### Additional Platforms
- **YouTube**: Video content, comments, subscribers
- **TikTok**: Short-form video content
- **Reddit**: Community posts, comments, karma
- **Discord**: Community server integration
- **Telegram**: Channel and bot integration

### Key Features

#### Account Management
- **OAuth Integration**: Secure social media authentication
- **Multi-Platform Support**: Connect multiple accounts
- **Profile Sync**: Automatic profile information sync
- **Token Management**: Secure token storage and refresh

#### Content Creation
- **Auto-Generated Content**: AI-powered content generation
- **Template System**: Pre-built content templates
- **Media Support**: Images, videos, and rich media
- **Customization**: Platform-specific content adaptation

#### Publishing & Scheduling
- **Instant Publishing**: Real-time content publishing
- **Scheduled Publishing**: Advanced scheduling options
- **Batch Publishing**: Publish to multiple platforms
- **Content Optimization**: Platform-specific optimization

#### Analytics & Engagement
- **Real-time Tracking**: Live engagement metrics
- **Performance Analytics**: Detailed performance data
- **Engagement Insights**: Clicks, likes, shares, comments
- **ROI Tracking**: Social media ROI measurement

### Implementation

#### Connect Social Account
```python
# Connect social media account
account = await social_service.connect_social_account(
    user_id="user123",
    platform="twitter",
    auth_data={
        "access_token": "oauth_token",
        "refresh_token": "refresh_token"
    }
)
```

#### Create Social Content
```python
# Create social media content
content = await social_service.create_social_content(
    user_id="user123",
    content_data={
        "content_type": "course_completion",
        "title": "Just completed Python Basics!",
        "text_content": "I'm excited to share that I've just completed the Python Basics course on PyMastery! 🐍 #Python #Learning #Programming",
        "media_urls": ["https://pymastery.com/certificates/python-basics.png"],
        "hashtags": ["Python", "Programming", "Learning", "PyMastery"],
        "link_url": "https://pymastery.com/certificates/python-basics-123"
    }
)
```

#### Share Content
```python
# Share content to social media
share = await social_service.share_content(
    user_id="user123",
    content_id="content_123",
    platform="twitter",
    account_id="twitter_account_456",
    share_options={
        "scheduled_at": datetime.now() + timedelta(hours=1)
    }
)
```

#### Track Engagement
```python
# Track social media engagement
await social_service.track_engagement(
    share_id="share_789",
    engagement_data={
        "type": "like",
        "count": 15,
        "metadata": {"platform": "twitter", "timestamp": datetime.now()}
    }
)
```

### Content Templates

#### Course Completion Template
- **Platforms**: Twitter, LinkedIn, Facebook
- **Content**: Achievement celebration, course details
- **Media**: Certificate image, course thumbnail
- **Call-to-Action**: View certificate, try next course

#### Achievement Template
- **Platforms**: Instagram, Facebook, LinkedIn
- **Content**: Badge celebration, milestone reached
- **Media**: Badge image, progress screenshot
- **Call-to-Action**: Share achievement, view profile

#### Challenge Template
- **Platforms**: Twitter, TikTok, Instagram
- **Content**: Challenge completion, time-lapse video
- **Media**: Challenge screenshot, completion video
- **Call-to-Action**: Join challenge, view leaderboard

#### Learning Streak Template
- **Platforms**: Twitter, Facebook, Instagram
- **Content**: Streak celebration, learning consistency
- **Media**: Streak badge, progress visualization
- **Call-to-Action**: Keep learning, invite friends

### API Endpoints

#### Account Management
```
POST /api/v1/marketing/social/connect              # Connect social account
GET /api/v1/marketing/social/accounts/{user_id}    # Get user's accounts
```

#### Content Management
```
POST /api/v1/marketing/social/content              # Create social content
POST /api/v1/marketing/social/share                 # Share content
GET /api/v1/marketing/social/shares/{user_id}      # Get user's shares
```

#### Analytics
```
POST /api/v1/marketing/social/track-engagement     # Track engagement
GET /api/v1/marketing/social/shares/{id}/analytics  # Get share analytics
GET /api/v1/marketing/social/analytics/{user_id}    # Get user analytics
```

## Integration Guide

### Backend Integration

#### Service Initialization
```python
# In main.py
from services.referral_service import start_referral_service
from services.affiliate_service import start_affiliate_service
from services.promotional_campaign_service import start_promotional_campaign_service
from services.email_marketing_service import start_email_marketing_service
from services.social_media_service import start_social_media_service

@app.on_event("startup")
async def startup_event():
    await start_referral_service()
    await start_affiliate_service()
    await start_promotional_campaign_service()
    await start_email_marketing_service()
    await start_social_media_service()
```

#### Router Registration
```python
# In main.py
from routers.marketing_router import router as marketing_router

app.include_router(marketing_router)
```

#### Database Collections
```python
# MongoDB collections for marketing features
collections = [
    "referral_codes",
    "referrals",
    "referral_rewards",
    "affiliate_partners",
    "affiliate_links",
    "affiliate_clicks",
    "affiliate_conversions",
    "promotional_campaigns",
    "campaign_triggers",
    "campaign_actions",
    "campaign_executions",
    "email_templates",
    "email_campaigns",
    "email_messages",
    "social_accounts",
    "social_content",
    "social_shares",
    "social_engagement"
]
```

### Frontend Integration

#### API Service Setup
```typescript
// In frontend/src/services/api.ts
const marketingApi = {
  referral: {
    createCode: (data) => api.post('/marketing/referral/codes', data),
    getCode: (userId) => api.get(`/marketing/referral/codes/${userId}`),
    createReferral: (data) => api.post('/marketing/referral/create', data),
    convertReferral: (id, data) => api.post(`/marketing/referral/${id}/convert`, data),
    getStats: (userId) => api.get(`/marketing/referral/stats/${userId}`)
  },
  affiliate: {
    register: (data) => api.post('/marketing/affiliate/register', data),
    approve: (id) => api.post(`/marketing/affiliate/${id}/approve`),
    createLink: (id, data) => api.post(`/marketing/affiliate/${id}/links`, data),
    getLinks: (id, activeOnly) => api.get(`/marketing/affiliate/${id}/links`, { params: { active_only: activeOnly } }),
    trackClick: (data) => api.post('/marketing/affiliate/track-click', data),
    trackConversion: (data) => api.post('/marketing/affiliate/track-conversion', data),
    getStats: (id, periodDays) => api.get(`/marketing/affiliate/${id}/stats`, { params: { period_days } })
  },
  campaigns: {
    create: (data) => api.post('/marketing/campaigns', data),
    addTrigger: (id, data) => api.post(`/marketing/campaigns/${id}/triggers`, data),
    addAction: (id, data) => api.post(`/marketing/campaigns/${id}/actions`, data),
    launch: (id) => api.post(`/marketing/campaigns/${id}/launch`),
    triggerEvent: (data) => api.post('/marketing/campaigns/trigger-event', data),
    getAnalytics: (id, periodDays) => api.get(`/marketing/campaigns/${id}/analytics`, { params: { period_days } })
  },
  email: {
    getTemplates: (type) => api.get('/marketing/email/templates', { params: { template_type: type } }),
    createCampaign: (data) => api.post('/marketing/email/campaigns', data),
    scheduleCampaign: (id, data) => api.post(`/marketing/email/campaigns/${id}/schedule`, data),
    sendEmail: (id, data) => api.post(`/marketing/email/campaigns/${id}/send`, data),
    trackEvent: (data) => api.post('/marketing/email/track-event', data),
    getAnalytics: (id, periodDays) => api.get(`/marketing/email/campaigns/${id}/analytics`, { params: { period_days } })
  },
  social: {
    connectAccount: (data) => api.post('/marketing/social/connect', data),
    getAccounts: (userId) => api.get(`/marketing/social/accounts/${userId}`),
    createContent: (data) => api.post('/marketing/social/content', data),
    shareContent: (data) => api.post('/marketing/social/share', data),
    getShares: (userId, platform) => api.get(`/marketing/social/shares/${userId}`, { params: { platform } }),
    trackEngagement: (data) => api.post('/marketing/social/track-engagement', data),
    getAnalytics: (userId, periodDays) => api.get(`/marketing/social/analytics/${userId}`, { params: { period_days } })
  }
};
```

#### React Components
```typescript
// Referral Component
const ReferralProgram: React.FC = () => {
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState(null);
  
  useEffect(() => {
    loadReferralData();
  }, []);
  
  const loadReferralData = async () => {
    try {
      const codeResponse = await marketingApi.referral.getCode(userId);
      setReferralCode(codeResponse.data.referral_code);
      
      const statsResponse = await marketingApi.referral.getStats(userId);
      setReferralStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    }
  };
  
  return (
    <div>
      <h2>Referral Program</h2>
      <p>Your referral code: <strong>{referralCode}</strong></p>
      {referralStats && (
        <div>
          <p>Total referrals: {referralStats.total_referrals}</p>
          <p>Successful conversions: {referralStats.completed_referrals}</p>
          <p>Conversion rate: {referralStats.conversion_rate}%</p>
        </div>
      )}
    </div>
  );
};

// Social Sharing Component
const SocialSharing: React.FC = ({ contentType, contentId }) => {
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [shareResults, setShareResults] = useState([]);
  
  const handleShare = async (platform, accountId) => {
    try {
      const response = await marketingApi.social.share({
        user_id: userId,
        content_id: contentId,
        platform: platform,
        account_id: accountId
      });
      
      setShareResults([...shareResults, response.data]);
    } catch (error) {
      console.error('Failed to share content:', error);
    }
  };
  
  return (
    <div>
      <h3>Share to Social Media</h3>
      {socialAccounts.map(account => (
        <button
          key={account.id}
          onClick={() => handleShare(account.platform, account.account_id)}
        >
          Share to {account.platform}
        </button>
      ))}
    </div>
  );
};
```

### Environment Configuration

#### Environment Variables
```bash
# Marketing Services Configuration
REFERRAL_SERVICE_ENABLED=true
AFFILIATE_SERVICE_ENABLED=true
PROMOTIONAL_CAMPAIGN_SERVICE_ENABLED=true
EMAIL_MARKETING_SERVICE_ENABLED=true
SOCIAL_MEDIA_SERVICE_ENABLED=true

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true

# Social Media Configuration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
```

## API Reference

### Common Response Format

All API endpoints follow a consistent response format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-03-15T10:30:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

### Authentication

All marketing endpoints require JWT authentication:
```http
Authorization: Bearer <jwt_token>
```

### Rate Limiting

Endpoints are rate-limited to prevent abuse:
- **Referral endpoints**: 10 requests per minute
- **Affiliate endpoints**: 20 requests per minute
- **Campaign endpoints**: 5 requests per minute
- **Email endpoints**: 15 requests per minute
- **Social endpoints**: 25 requests per minute

## Best Practices

### Referral Program Best Practices

#### Code Generation
- Use unique, memorable codes
- Set reasonable expiration dates
- Limit code usage to prevent abuse
- Provide clear instructions for sharing

#### Reward Structure
- Balance rewards to prevent fraud
- Use tiered rewards for motivation
- Provide both referrer and referred rewards
- Consider cash vs. credit rewards

#### User Experience
- Make sharing easy with one-click options
- Provide clear value proposition
- Track and display referral progress
- Celebrate successful referrals

### Affiliate System Best Practices

#### Partner Selection
- Vet affiliates for quality and relevance
- Provide clear commission structures
- Offer competitive rates for quality partners
- Maintain professional relationships

#### Link Management
- Use clear, descriptive tracking URLs
- Provide branded landing pages
- Monitor link performance regularly
- Update links for seasonal promotions

#### Commission Management
- Pay commissions promptly and accurately
- Provide detailed commission reports
- Offer performance bonuses
- Handle disputes professionally

### Email Marketing Best Practices

#### Content Quality
- Use professional, responsive templates
- Personalize content for relevance
- Include clear calls-to-action
- Test subject lines for effectiveness

#### Deliverability
- Maintain clean email lists
- Monitor bounce rates and spam complaints
- Use reputable SMTP providers
- Follow email marketing regulations

#### Analytics & Optimization
- Track open rates and click-through rates
- A/B test subject lines and content
- Optimize send times for engagement
- Monitor ROI and adjust strategies

### Social Media Best Practices

#### Content Strategy
- Create platform-specific content
- Use high-quality images and videos
- Include relevant hashtags and mentions
- Maintain consistent brand voice

#### Engagement Management
- Respond to comments and messages promptly
- Monitor brand mentions and sentiment
- Encourage user-generated content
- Build community engagement

#### Analytics & Performance
- Track engagement metrics across platforms
- Monitor follower growth and reach
- Analyze content performance
- Adjust strategy based on insights

## Troubleshooting

### Common Issues and Solutions

#### Referral Code Not Working
**Problem**: Referral code not being recognized
**Solution**: 
- Verify code format and length
- Check code expiration date
- Ensure code is properly associated with user
- Check for duplicate codes

#### Affiliate Link Not Tracking
**Problem**: Affiliate clicks not being tracked
**Solution**:
- Verify tracking code format
- Check affiliate link configuration
- Ensure proper click tracking implementation
- Verify affiliate account status

#### Email Not Sending
**Problem**: Email campaigns not delivering
**Solution**:
- Check SMTP configuration
- Verify email template format
- Check recipient email validity
- Monitor email service status

#### Social Media Post Failing
**Problem**: Social media posts not publishing
**Solution**:
- Verify social media account connection
- Check platform API rate limits
- Verify content format and length
- Check media file formats and sizes

#### Analytics Not Updating
**Problem**: Analytics data not updating
**Solution**:
- Check service status and health
- Verify data collection implementation
- Check for data processing errors
- Monitor background task execution

### Debugging Tools

#### Service Status Check
```python
# Check all marketing services status
GET /api/v1/marketing/health
```

#### Dashboard Overview
```python
# Get comprehensive marketing dashboard
GET /api/v1/marketing/dashboard
```

#### Service-Specific Status
```python
# Check individual service status
GET /api/v1/marketing/referral/analytics
GET /api/v1/marketing/affiliate/stats/{id}
GET /api/v1/marketing/campaigns/{id}/analytics
GET /api/v1/marketing/email/campaigns/{id}/analytics
GET /api/v1/marketing/social/analytics/{user_id}
```

### Support Resources

#### Documentation
- Complete API reference
- Integration guides
- Best practices documentation
- Troubleshooting guides

#### Monitoring
- Service health monitoring
- Performance metrics tracking
- Error logging and alerting
- Usage analytics and reporting

#### Community Support
- Developer forums and discussions
- Knowledge base and FAQs
- Video tutorials and guides
- Direct support contact information

## Conclusion

The marketing and social media features provide a comprehensive solution for user acquisition, engagement, and brand building. The system includes:

- **Referral Program**: User-driven acquisition with incentive rewards
- **Affiliate System**: Partner marketing with commission tracking
- **Promotional Campaigns**: Automated marketing workflows
- **Email Marketing**: Professional email campaigns with templates
- **Social Media Integration**: Multi-platform sharing and analytics

All features are production-ready with comprehensive APIs, analytics, and monitoring capabilities. The system is designed to scale with your business needs and provides the tools necessary for effective marketing and community building.

## Next Steps

### Implementation
1. **Configure Services**: Set up environment variables and dependencies
2. **Initialize Services**: Start all marketing services
3. **Test Integration**: Verify API endpoints and functionality
4. **Frontend Integration**: Implement UI components and user flows
5. **Analytics Setup**: Configure monitoring and reporting

### Optimization
1. **A/B Testing**: Test different reward structures and messaging
2. **Performance Monitoring**: Track service performance and optimize
3. **User Feedback**: Collect and analyze user feedback
4. **Feature Enhancement**: Add advanced features based on usage

### Scaling
1. **Load Testing**: Test system performance under load
2. **Database Optimization**: Optimize queries and indexes
3. **Service Scaling**: Scale individual services as needed
4. **Monitoring Enhancement**: Add advanced monitoring and alerting

The marketing and social media features are now ready for production deployment and can help drive user acquisition, engagement, and growth for PyMastery.

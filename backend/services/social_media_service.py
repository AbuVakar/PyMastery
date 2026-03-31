"""
Social Media Service for PyMastery
Handles social media integration, content sharing, and social engagement tracking
"""

import asyncio
import logging
import json
import time
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
from pathlib import Path
import statistics
from collections import deque

logger = logging.getLogger(__name__)

class SocialPlatform(Enum):
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    REDDIT = "reddit"
    DISCORD = "discord"
    TELEGRAM = "telegram"
    WHATSAPP = "whatsapp"

class ContentType(Enum):
    COURSE_COMPLETION = "course_completion"
    ACHIEVEMENT = "achievement"
    CERTIFICATE = "certificate"
    LEARNING_MILESTONE = "learning_milestone"
    CHALLENGE_COMPLETE = "challenge_complete"
    STREAK_ACHIEVEMENT = "streak_achievement"
    LEADERBOARD_RANKING = "leaderboard_ranking"
    CUSTOM_CONTENT = "custom_content"

class ShareStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELLED = "cancelled"

class EngagementType(Enum):
    LIKE = "like"
    COMMENT = "comment"
    SHARE = "share"
    RETWEET = "retweet"
    SAVE = "save"
    VIEW = "view"
    CLICK = "click"

@dataclass
class SocialAccount:
    """Social media account configuration"""
    id: str
    user_id: str
    platform: SocialPlatform
    account_id: str
    account_name: str
    display_name: str
    profile_image_url: str
    access_token: str
    refresh_token: Optional[str]
    token_expires_at: Optional[datetime]
    is_active: bool
    is_verified: bool
    follower_count: int
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = None

@dataclass
class SocialContent:
    """Social media content"""
    id: str
    user_id: str
    content_type: ContentType
    title: str
    text_content: str
    media_urls: List[str]
    hashtags: List[str]
    mentions: List[str]
    call_to_action: str
    link_url: str
    platform_specific: Dict[str, Any]
    created_at: datetime
    metadata: Dict[str, Any] = None

@dataclass
class SocialShare:
    """Social media share record"""
    id: str
    content_id: str
    user_id: str
    platform: SocialPlatform
    account_id: str
    post_id: str
    post_url: str
    status: ShareStatus
    published_at: Optional[datetime]
    scheduled_at: Optional[datetime]
    engagement_stats: Dict[str, Any]
    error_message: Optional[str]
    created_at: datetime

@dataclass
class SocialEngagement:
    """Social engagement tracking"""
    id: str
    share_id: str
    platform: SocialPlatform
    engagement_type: EngagementType
    count: int
    metadata: Dict[str, Any]
    timestamp: datetime

@dataclass
class SocialCampaign:
    """Social media campaign"""
    id: str
    name: str
    description: str
    start_date: datetime
    end_date: Optional[datetime]
    target_platforms: List[SocialPlatform]
    content_templates: List[Dict[str, Any]]
    hashtag_strategy: Dict[str, Any]
    budget: float
    currency: str
    is_active: bool
    created_at: datetime

@dataclass
class SocialAnalytics:
    """Social media analytics"""
    id: str
    user_id: str
    platform: SocialPlatform
    period_start: datetime
    period_end: datetime
    total_shares: int
    total_engagement: int
    engagement_rate: float
    reach: int
    impressions: int
    clicks: int
    conversions: int
    generated_at: datetime

class SocialMediaService:
    """Social media service for PyMastery"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Initialize state
        self.is_running = False
        self.start_time = None
        
        # Social accounts
        self.social_accounts: Dict[str, SocialAccount] = {}
        
        # Content
        self.content: Dict[str, SocialContent] = {}
        
        # Shares
        self.shares: Dict[str, List[SocialShare]] = {}
        
        # Engagement
        self.engagement: Dict[str, List[SocialEngagement]] = {}
        
        # Campaigns
        self.campaigns: Dict[str, SocialCampaign] = {}
        
        # Analytics
        self.analytics: List[SocialAnalytics] = []
        
        # Share queue for processing
        self.share_queue: deque = deque(maxlen=1000)
        
        # HTTP session
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Platform configurations
        self.platform_configs = self._initialize_platform_configs()
        
        # Background tasks
        self.publisher_task: Optional[asyncio.Task] = None
        self.analytics_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        self.engagement_task: Optional[asyncio.Task] = None
    
    def _initialize_platform_configs(self) -> Dict[str, Any]:
        """Initialize platform-specific configurations"""
        return {
            "facebook": {
                "api_url": "https://graph.facebook.com/v18.0",
                "max_text_length": 63206,
                "supported_media": ["image", "video", "link"],
                "hashtags": True,
                "mentions": True,
                "character_limits": {
                    "post": 63206,
                    "comment": 8000
                }
            },
            "twitter": {
                "api_url": "https://api.twitter.com/2",
                "max_text_length": 280,
                "supported_media": ["image", "video", "gif"],
                "hashtags": True,
                "mentions": True,
                "character_limits": {
                    "tweet": 280,
                    "comment": 280
                }
            },
            "linkedin": {
                "api_url": "https://api.linkedin.com/v2",
                "max_text_length": 3000,
                "supported_media": ["image", "video", "document"],
                "hashtags": True,
                "mentions": True,
                "character_limits": {
                    "post": 3000,
                    "comment": 1250
                }
            },
            "instagram": {
                "api_url": "https://graph.instagram.com/v18.0",
                "max_text_length": 2200,
                "supported_media": ["image", "video", "reel", "story"],
                "hashtags": True,
                "mentions": True,
                "character_limits": {
                    "caption": 2200,
                    "comment": 2200
                }
            },
            "youtube": {
                "api_url": "https://www.googleapis.com/youtube/v3",
                "max_text_length": 5000,
                "supported_media": ["video"],
                "hashtags": False,
                "mentions": True,
                "character_limits": {
                    "description": 5000,
                    "comment": 10000
                }
            },
            "tiktok": {
                "api_url": "https://open.tiktokapis.com/v2",
                "max_text_length": 150,
                "supported_media": ["video"],
                "hashtags": True,
                "mentions": True,
                "character_limits": {
                    "caption": 150,
                    "comment": 150
                }
            }
        }
    
    async def start(self):
        """Start the social media service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Create HTTP session
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        
        # Start background tasks
        self.publisher_task = asyncio.create_task(self._publisher_loop())
        self.analytics_task = asyncio.create_task(self._analytics_loop())
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        self.engagement_task = asyncio.create_task(self._engagement_tracking_loop())
        
        logger.info("Social media service started",
                   extra_fields={
                       "event_type": "social_media_service_started",
                       "platforms": list(self.platform_configs.keys())
                   })
    
    async def stop(self):
        """Stop the social media service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel background tasks
        if self.publisher_task:
            self.publisher_task.cancel()
        if self.analytics_task:
            self.analytics_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        if self.engagement_task:
            self.engagement_task.cancel()
        
        # Close HTTP session
        if self.session:
            await self.session.close()
        
        logger.info("Social media service stopped",
                   extra_fields={
                       "event_type": "social_media_service_stopped"
                   })
    
    async def connect_social_account(self, user_id: str, platform: str, auth_data: Dict[str, Any]) -> SocialAccount:
        """Connect a social media account"""
        try:
            platform_enum = SocialPlatform(platform)
            
            # Validate platform
            if platform not in self.platform_configs:
                raise ValueError(f"Platform {platform} not supported")
            
            # Exchange auth code for access token (platform-specific)
            access_token, refresh_token, expires_at = await self._exchange_auth_code(
                platform_enum, auth_data
            )
            
            # Get account information
            account_info = await self._get_account_info(platform_enum, access_token)
            
            # Create social account record
            social_account = SocialAccount(
                id=f"social_{int(time.time())}_{user_id}_{platform}",
                user_id=user_id,
                platform=platform_enum,
                account_id=account_info["id"],
                account_name=account_info["username"],
                display_name=account_info["display_name"],
                profile_image_url=account_info.get("profile_image_url", ""),
                access_token=access_token,
                refresh_token=refresh_token,
                token_expires_at=expires_at,
                is_active=True,
                is_verified=account_info.get("verified", False),
                follower_count=account_info.get("follower_count", 0),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                metadata=account_info.get("metadata", {})
            )
            
            # Store account
            self.social_accounts[social_account.id] = social_account
            
            logger.info(f"Social account connected: {social_account.id}",
                       extra_fields={
                           "event_type": "social_account_connected",
                           "account_id": social_account.id,
                           "user_id": user_id,
                           "platform": platform
                       })
            
            return social_account
        
        except Exception as e:
            logger.error(f"Failed to connect social account: {e}")
            raise
    
    async def _exchange_auth_code(self, platform: SocialPlatform, auth_data: Dict[str, Any]) -> Tuple[str, Optional[str], Optional[datetime]]:
        """Exchange auth code for access token"""
        try:
            if platform == SocialPlatform.FACEBOOK:
                return await self._exchange_facebook_token(auth_data)
            elif platform == SocialPlatform.TWITTER:
                return await self._exchange_twitter_token(auth_data)
            elif platform == SocialPlatform.LINKEDIN:
                return await self._exchange_linkedin_token(auth_data)
            elif platform == SocialPlatform.INSTAGRAM:
                return await self._exchange_instagram_token(auth_data)
            else:
                # Default implementation
                return auth_data.get("access_token", ""), auth_data.get("refresh_token"), None
        
        except Exception as e:
            logger.error(f"Failed to exchange auth code for {platform}: {e}")
            raise
    
    async def _exchange_facebook_token(self, auth_data: Dict[str, Any]) -> Tuple[str, Optional[str], Optional[datetime]]:
        """Exchange Facebook auth code for access token"""
        # Implementation would call Facebook Graph API
        # For now, return mock data
        return "mock_facebook_token", "mock_refresh_token", datetime.now(timezone.utc) + timedelta(days=60)
    
    async def _exchange_twitter_token(self, auth_data: Dict[str, Any]) -> Tuple[str, Optional[str], Optional[datetime]]:
        """Exchange Twitter auth code for access token"""
        # Implementation would call Twitter API v2
        # For now, return mock data
        return "mock_twitter_token", "mock_refresh_token", datetime.now(timezone.utc) + timedelta(days=90)
    
    async def _exchange_linkedin_token(self, auth_data: Dict[str, Any]) -> Tuple[str, Optional[str], Optional[datetime]]:
        """Exchange LinkedIn auth code for access token"""
        # Implementation would call LinkedIn API
        # For now, return mock data
        return "mock_linkedin_token", "mock_refresh_token", datetime.now(timezone.utc) + timedelta(days=60)
    
    async def _exchange_instagram_token(self, auth_data: Dict[str, Any]) -> Tuple[str, Optional[str], Optional[datetime]]:
        """Exchange Instagram auth code for access token"""
        # Implementation would call Instagram Graph API
        # For now, return mock data
        return "mock_instagram_token", "mock_refresh_token", datetime.now(timezone.utc) + timedelta(days=60)
    
    async def _get_account_info(self, platform: SocialPlatform, access_token: str) -> Dict[str, Any]:
        """Get account information from platform"""
        try:
            if platform == SocialPlatform.FACEBOOK:
                return await self._get_facebook_account_info(access_token)
            elif platform == SocialPlatform.TWITTER:
                return await self._get_twitter_account_info(access_token)
            elif platform == SocialPlatform.LINKEDIN:
                return await self._get_linkedin_account_info(access_token)
            elif platform == SocialPlatform.INSTAGRAM:
                return await self._get_instagram_account_info(access_token)
            else:
                # Default mock data
                return {
                    "id": "mock_account_id",
                    "username": "mock_username",
                    "display_name": "Mock User",
                    "verified": False,
                    "follower_count": 0
                }
        
        except Exception as e:
            logger.error(f"Failed to get account info for {platform}: {e}")
            raise
    
    async def _get_facebook_account_info(self, access_token: str) -> Dict[str, Any]:
        """Get Facebook account information"""
        # Mock implementation
        return {
            "id": "facebook_123456789",
            "username": "pymastery_user",
            "display_name": "PyMastery User",
            "verified": False,
            "follower_count": 1000,
            "profile_image_url": "https://graph.facebook.com/mock_picture"
        }
    
    async def _get_twitter_account_info(self, access_token: str) -> Dict[str, Any]:
        """Get Twitter account information"""
        # Mock implementation
        return {
            "id": "twitter_123456789",
            "username": "pymastery_user",
            "display_name": "PyMastery User",
            "verified": False,
            "follower_count": 500,
            "profile_image_url": "https://pbs.twimg.com/mock_profile_image"
        }
    
    async def _get_linkedin_account_info(self, access_token: str) -> Dict[str, Any]:
        """Get LinkedIn account information"""
        # Mock implementation
        return {
            "id": "linkedin_123456789",
            "username": "pymastery-user",
            "display_name": "PyMastery User",
            "verified": False,
            "follower_count": 200,
            "profile_image_url": "https://media.licdn.com/mock_profile_image"
        }
    
    async def _get_instagram_account_info(self, access_token: str) -> Dict[str, Any]:
        """Get Instagram account information"""
        # Mock implementation
        return {
            "id": "instagram_123456789",
            "username": "pymastery_user",
            "display_name": "PyMastery User",
            "verified": False,
            "follower_count": 1500,
            "profile_image_url": "https://graph.instagram.com/mock_profile_image"
        }
    
    async def create_social_content(self, user_id: str, content_data: Dict[str, Any]) -> SocialContent:
        """Create social media content"""
        try:
            content = SocialContent(
                id=f"content_{int(time.time())}_{user_id}",
                user_id=user_id,
                content_type=ContentType(content_data["content_type"]),
                title=content_data.get("title", ""),
                text_content=content_data.get("text_content", ""),
                media_urls=content_data.get("media_urls", []),
                hashtags=content_data.get("hashtags", []),
                mentions=content_data.get("mentions", []),
                call_to_action=content_data.get("call_to_action", ""),
                link_url=content_data.get("link_url", ""),
                platform_specific=content_data.get("platform_specific", {}),
                created_at=datetime.now(timezone.utc),
                metadata=content_data.get("metadata", {})
            )
            
            # Store content
            self.content[content.id] = content
            
            logger.info(f"Social content created: {content.id}",
                       extra_fields={
                           "event_type": "social_content_created",
                           "content_id": content.id,
                           "user_id": user_id,
                           "content_type": content.content_type.value
                       })
            
            return content
        
        except Exception as e:
            logger.error(f"Failed to create social content: {e}")
            raise
    
    async def share_content(self, user_id: str, content_id: str, platform: str, account_id: str, 
                          share_options: Dict[str, Any] = None) -> SocialShare:
        """Share content to social media platform"""
        try:
            content = self.content.get(content_id)
            if not content:
                raise ValueError(f"Content {content_id} not found")
            
            platform_enum = SocialPlatform(platform)
            
            # Get social account
            social_account = None
            for account in self.social_accounts.values():
                if (account.user_id == user_id and 
                    account.platform == platform_enum and 
                    account.account_id == account_id):
                    social_account = account
                    break
            
            if not social_account:
                raise ValueError(f"Social account {account_id} not found for user {user_id}")
            
            # Create share record
            share = SocialShare(
                id=f"share_{int(time.time())}_{content_id}_{platform}",
                content_id=content_id,
                user_id=user_id,
                platform=platform_enum,
                account_id=account_id,
                post_id="",  # Will be populated after publishing
                post_url="",  # Will be populated after publishing
                status=ShareStatus.DRAFT,
                published_at=None,
                scheduled_at=share_options.get("scheduled_at") if share_options else None,
                engagement_stats={},
                error_message=None,
                created_at=datetime.now(timezone.utc)
            )
            
            # Store share
            if user_id not in self.shares:
                self.shares[user_id] = []
            self.shares[user_id].append(share)
            
            # Add to queue for processing
            self.share_queue.append({
                "share_id": share.id,
                "user_id": user_id,
                "content_id": content_id,
                "platform": platform,
                "account_id": account_id,
                "options": share_options or {}
            })
            
            logger.info(f"Content share queued: {share.id}",
                       extra_fields={
                           "event_type": "content_share_queued",
                           "share_id": share.id,
                           "content_id": content_id,
                           "platform": platform,
                           "account_id": account_id
                       })
            
            return share
        
        except Exception as e:
            logger.error(f"Failed to share content: {e}")
            raise
    
    async def _publisher_loop(self):
        """Process share queue and publish to social media"""
        while self.is_running:
            try:
                if self.share_queue:
                    share_data = self.share_queue.popleft()
                    await self._publish_to_platform(share_data)
                else:
                    await asyncio.sleep(1)  # Wait for shares
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Publisher loop error: {e}")
                await asyncio.sleep(5)
    
    async def _publish_to_platform(self, share_data: Dict[str, Any]):
        """Publish content to specific platform"""
        try:
            share_id = share_data["share_id"]
            platform = SocialPlatform(share_data["platform"])
            content_id = share_data["content_id"]
            account_id = share_data["account_id"]
            options = share_data["options"]
            
            # Find share record
            share = None
            for user_shares in self.shares.values():
                for s in user_shares:
                    if s.id == share_id:
                        share = s
                        break
                if share:
                    break
            
            if not share:
                logger.error(f"Share {share_id} not found")
                return
            
            # Get content
            content = self.content.get(content_id)
            if not content:
                share.status = ShareStatus.FAILED
                share.error_message = "Content not found"
                return
            
            # Get social account
            social_account = None
            for account in self.social_accounts.values():
                if account.account_id == account_id:
                    social_account = account
                    break
            
            if not social_account:
                share.status = ShareStatus.FAILED
                share.error_message = "Social account not found"
                return
            
            # Adapt content for platform
            adapted_content = await self._adapt_content_for_platform(content, platform, options)
            
            # Publish to platform
            post_id, post_url = await self._publish_content_to_platform(
                platform, social_account, adapted_content
            )
            
            # Update share record
            share.post_id = post_id
            share.post_url = post_url
            share.status = ShareStatus.PUBLISHED
            share.published_at = datetime.now(timezone.utc)
            
            logger.info(f"Content published to {platform}: {share_id}",
                       extra_fields={
                           "event_type": "content_published",
                           "share_id": share_id,
                           "platform": platform.value,
                           "post_id": post_id,
                           "post_url": post_url
                       })
        
        except Exception as e:
            logger.error(f"Failed to publish to platform: {e}")
            
            # Update share status to failed
            if share:
                share.status = ShareStatus.FAILED
                share.error_message = str(e)
    
    async def _adapt_content_for_platform(self, content: SocialContent, platform: SocialPlatform, options: Dict[str, Any]) -> Dict[str, Any]:
        """Adapt content for specific platform"""
        try:
            platform_config = self.platform_configs.get(platform.value, {})
            
            adapted = {
                "text": content.text_content,
                "media_urls": content.media_urls,
                "hashtags": content.hashtags,
                "mentions": content.mentions,
                "link_url": content.link_url,
                "call_to_action": content.call_to_action
            }
            
            # Apply platform-specific adaptations
            if platform == SocialPlatform.TWITTER:
                # Twitter has 280 character limit
                max_length = platform_config.get("max_text_length", 280)
                if len(adapted["text"]) > max_length:
                    # Truncate text and add link
                    adapted["text"] = adapted["text"][:max_length - 30] + "... " + adapted["link_url"]
            
            elif platform == SocialPlatform.INSTAGRAM:
                # Instagram focuses on visual content
                if not adapted["media_urls"]:
                    # Add default image if no media provided
                    adapted["media_urls"] = ["https://pymastery.com/default-share-image.png"]
            
            elif platform == SocialPlatform.LINKEDIN:
                # LinkedIn is more professional
                adapted["text"] = f"{content.title}\n\n{content.text_content}\n\n{content.call_to_action}"
            
            # Apply custom options
            if "custom_text" in options:
                adapted["text"] = options["custom_text"]
            
            if "additional_hashtags" in options:
                adapted["hashtags"].extend(options["additional_hashtags"])
            
            return adapted
        
        except Exception as e:
            logger.error(f"Failed to adapt content for {platform}: {e}")
            return {
                "text": content.text_content,
                "media_urls": content.media_urls,
                "hashtags": content.hashtags,
                "mentions": content.mentions,
                "link_url": content.link_url,
                "call_to_action": content.call_to_action
            }
    
    async def _publish_content_to_platform(self, platform: SocialPlatform, account: SocialAccount, content: Dict[str, Any]) -> Tuple[str, str]:
        """Publish content to specific platform API"""
        try:
            if platform == SocialPlatform.FACEBOOK:
                return await self._publish_to_facebook(account, content)
            elif platform == SocialPlatform.TWITTER:
                return await self._publish_to_twitter(account, content)
            elif platform == SocialPlatform.LINKEDIN:
                return await self._publish_to_linkedin(account, content)
            elif platform == SocialPlatform.INSTAGRAM:
                return await self._publish_to_instagram(account, content)
            else:
                # Mock implementation for other platforms
                post_id = f"mock_post_{int(time.time())}"
                post_url = f"https://{platform.value}.com/pymastery/post/{post_id}"
                return post_id, post_url
        
        except Exception as e:
            logger.error(f"Failed to publish to {platform}: {e}")
            raise
    
    async def _publish_to_facebook(self, account: SocialAccount, content: Dict[str, Any]) -> Tuple[str, str]:
        """Publish to Facebook"""
        # Mock implementation - would call Facebook Graph API
        post_id = f"fb_post_{int(time.time())}"
        post_url = f"https://facebook.com/{account.account_id}/posts/{post_id}"
        return post_id, post_url
    
    async def _publish_to_twitter(self, account: SocialAccount, content: Dict[str, Any]) -> Tuple[str, str]:
        """Publish to Twitter"""
        # Mock implementation - would call Twitter API v2
        post_id = f"tweet_{int(time.time())}"
        post_url = f"https://twitter.com/{account.account_name}/status/{post_id}"
        return post_id, post_url
    
    async def _publish_to_linkedin(self, account: SocialAccount, content: Dict[str, Any]) -> Tuple[str, str]:
        """Publish to LinkedIn"""
        # Mock implementation - would call LinkedIn API
        post_id = f"li_post_{int(time.time())}"
        post_url = f"https://linkedin.com/posts/{account.account_id}-{post_id}"
        return post_id, post_url
    
    async def _publish_to_instagram(self, account: SocialAccount, content: Dict[str, Any]) -> Tuple[str, str]:
        """Publish to Instagram"""
        # Mock implementation - would call Instagram Graph API
        post_id = f"ig_post_{int(time.time())}"
        post_url = f"https://instagram.com/p/{post_id}"
        return post_id, post_url
    
    async def track_engagement(self, share_id: str, engagement_data: Dict[str, Any]):
        """Track engagement for a social share"""
        try:
            # Find share record
            share = None
            for user_shares in self.shares.values():
                for s in user_shares:
                    if s.id == share_id:
                        share = s
                        break
                if share:
                    break
            
            if not share:
                logger.warning(f"Share {share_id} not found for engagement tracking")
                return
            
            # Create engagement record
            engagement = SocialEngagement(
                id=f"engagement_{int(time.time())}_{share_id}",
                share_id=share_id,
                platform=share.platform,
                engagement_type=EngagementType(engagement_data["type"]),
                count=engagement_data.get("count", 1),
                metadata=engagement_data.get("metadata", {}),
                timestamp=datetime.now(timezone.utc)
            )
            
            # Store engagement
            if share_id not in self.engagement:
                self.engagement[share_id] = []
            self.engagement[share_id].append(engagement)
            
            # Update share engagement stats
            engagement_type = engagement_data["type"]
            if engagement_type not in share.engagement_stats:
                share.engagement_stats[engagement_type] = 0
            share.engagement_stats[engagement_type] += engagement_data.get("count", 1)
            
            logger.info(f"Engagement tracked: {engagement.id}",
                       extra_fields={
                           "event_type": "engagement_tracked",
                           "engagement_id": engagement.id,
                           "share_id": share_id,
                           "platform": share.platform.value,
                           "type": engagement_type
                       })
        
        except Exception as e:
            logger.error(f"Failed to track engagement: {e}")
    
    async def get_user_social_accounts(self, user_id: str) -> List[SocialAccount]:
        """Get user's connected social accounts"""
        try:
            user_accounts = [
                account for account in self.social_accounts.values()
                if account.user_id == user_id and account.is_active
            ]
            
            return user_accounts
        
        except Exception as e:
            logger.error(f"Failed to get user social accounts: {e}")
            return []
    
    async def get_user_shares(self, user_id: str, platform: Optional[str] = None) -> List[SocialShare]:
        """Get user's social shares"""
        try:
            user_shares = self.shares.get(user_id, [])
            
            if platform:
                platform_enum = SocialPlatform(platform)
                user_shares = [share for share in user_shares if share.platform == platform_enum]
            
            return user_shares
        
        except Exception as e:
            logger.error(f"Failed to get user shares: {e}")
            return []
    
    async def get_share_analytics(self, share_id: str) -> Dict[str, Any]:
        """Get analytics for a specific share"""
        try:
            # Find share record
            share = None
            for user_shares in self.shares.values():
                for s in user_shares:
                    if s.id == share_id:
                        share = s
                        break
                if share:
                    break
            
            if not share:
                raise ValueError(f"Share {share_id} not found")
            
            # Get engagement data
            share_engagement = self.engagement.get(share_id, [])
            
            # Calculate metrics
            total_engagement = sum(eng.count for eng in share_engagement)
            engagement_by_type = {}
            for eng in share_engagement:
                engagement_type = eng.engagement_type.value
                if engagement_type not in engagement_by_type:
                    engagement_by_type[engagement_type] = 0
                engagement_by_type[engagement_type] += eng.count
            
            return {
                "share_id": share_id,
                "platform": share.platform.value,
                "post_id": share.post_id,
                "post_url": share.post_url,
                "status": share.status.value,
                "published_at": share.published_at.isoformat() if share.published_at else None,
                "total_engagement": total_engagement,
                "engagement_by_type": engagement_by_type,
                "engagement_history": [
                    {
                        "type": eng.engagement_type.value,
                        "count": eng.count,
                        "timestamp": eng.timestamp.isoformat()
                    }
                    for eng in share_engagement
                ]
            }
        
        except Exception as e:
            logger.error(f"Failed to get share analytics: {e}")
            return {}
    
    async def get_social_analytics(self, user_id: str, period_days: int = 30) -> SocialAnalytics:
        """Get social media analytics for a user"""
        try:
            # Calculate period
            period_end = datetime.now(timezone.utc)
            period_start = period_end - timedelta(days=period_days)
            
            # Get user's shares in period
            user_shares = self.shares.get(user_id, [])
            period_shares = [
                share for share in user_shares
                if share.published_at and period_start <= share.published_at <= period_end
            ]
            
            total_shares = len(period_shares)
            
            # Calculate engagement
            total_engagement = 0
            platform_stats = {}
            
            for share in period_shares:
                share_engagement = self.engagement.get(share.id, [])
                share_total = sum(eng.count for eng in share_engagement)
                total_engagement += share_total
                
                platform = share.platform.value
                if platform not in platform_stats:
                    platform_stats[platform] = {
                        "shares": 0,
                        "engagement": 0
                    }
                platform_stats[platform]["shares"] += 1
                platform_stats[platform]["engagement"] += share_total
            
            # Calculate rates
            engagement_rate = (total_engagement / total_shares) if total_shares > 0 else 0
            
            # Mock reach and impressions (would be calculated from platform APIs)
            reach = total_engagement * 10  # Estimated reach
            impressions = total_engagement * 25  # Estimated impressions
            clicks = int(total_engagement * 0.1)  # Estimated clicks
            conversions = int(total_engagement * 0.02)  # Estimated conversions
            
            analytics = SocialAnalytics(
                id=f"analytics_{user_id}_{int(period_start.timestamp())}",
                user_id=user_id,
                platform=SocialPlatform.FACEBOOK,  # Overall analytics
                period_start=period_start,
                period_end=period_end,
                total_shares=total_shares,
                total_engagement=total_engagement,
                engagement_rate=engagement_rate,
                reach=reach,
                impressions=impressions,
                clicks=clicks,
                conversions=conversions,
                generated_at=datetime.now(timezone.utc)
            )
            
            # Store analytics
            self.analytics.append(analytics)
            
            return analytics
        
        except Exception as e:
            logger.error(f"Failed to get social analytics: {e}")
            raise
    
    async def _analytics_loop(self):
        """Background analytics loop"""
        while self.is_running:
            try:
                # Generate analytics for all users with social accounts
                users_with_accounts = set(account.user_id for account in self.social_accounts.values())
                
                for user_id in users_with_accounts:
                    try:
                        await self.get_social_analytics(user_id, 7)  # Weekly analytics
                    except Exception as e:
                        logger.error(f"Failed to generate analytics for user {user_id}: {e}")
                
                # Sleep until next analytics cycle
                await asyncio.sleep(86400)  # Generate daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Analytics loop error: {e}")
                await asyncio.sleep(86400)
    
    async def _engagement_tracking_loop(self):
        """Background engagement tracking loop"""
        while self.is_running:
            try:
                # Fetch engagement from platforms for published shares
                for user_shares in self.shares.values():
                    for share in user_shares:
                        if (share.status == ShareStatus.PUBLISHED and 
                            share.published_at and
                            share.post_id):
                            
                            # Check if we should update engagement (e.g., every hour)
                            last_update = share.metadata.get("last_engagement_update")
                            now = datetime.now(timezone.utc)
                            
                            if (not last_update or 
                                now - datetime.fromisoformat(last_update) > timedelta(hours=1)):
                                
                                # Fetch engagement from platform
                                await self._fetch_engagement_from_platform(share)
                
                # Sleep until next check
                await asyncio.sleep(3600)  # Check hourly
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Engagement tracking loop error: {e}")
                await asyncio.sleep(3600)
    
    async def _fetch_engagement_from_platform(self, share: SocialShare):
        """Fetch engagement data from platform API"""
        try:
            # Get social account
            social_account = None
            for account in self.social_accounts.values():
                if account.account_id == share.account_id:
                    social_account = account
                    break
            
            if not social_account:
                return
            
            # Fetch engagement based on platform
            if share.platform == SocialPlatform.FACEBOOK:
                await self._fetch_facebook_engagement(share, social_account)
            elif share.platform == SocialPlatform.TWITTER:
                await self._fetch_twitter_engagement(share, social_account)
            elif share.platform == SocialPlatform.LINKEDIN:
                await self._fetch_linkedin_engagement(share, social_account)
            elif share.platform == SocialPlatform.INSTAGRAM:
                await self._fetch_instagram_engagement(share, social_account)
            
            # Update last fetch time
            share.metadata["last_engagement_update"] = datetime.now(timezone.utc).isoformat()
        
        except Exception as e:
            logger.error(f"Failed to fetch engagement from platform: {e}")
    
    async def _fetch_facebook_engagement(self, share: SocialShare, account: SocialAccount):
        """Fetch engagement from Facebook"""
        # Mock implementation - would call Facebook Graph API
        mock_engagement = {
            "likes": 25,
            "comments": 5,
            "shares": 3,
            "clicks": 10
        }
        
        for engagement_type, count in mock_engagement.items():
            await self.track_engagement(share.id, {
                "type": engagement_type,
                "count": count,
                "metadata": {"source": "api_fetch"}
            })
    
    async def _fetch_twitter_engagement(self, share: SocialShare, account: SocialAccount):
        """Fetch engagement from Twitter"""
        # Mock implementation - would call Twitter API v2
        mock_engagement = {
            "likes": 15,
            "retweets": 2,
            "comments": 1,
            "clicks": 8
        }
        
        for engagement_type, count in mock_engagement.items():
            await self.track_engagement(share.id, {
                "type": engagement_type,
                "count": count,
                "metadata": {"source": "api_fetch"}
            })
    
    async def _fetch_linkedin_engagement(self, share: SocialShare, account: SocialAccount):
        """Fetch engagement from LinkedIn"""
        # Mock implementation - would call LinkedIn API
        mock_engagement = {
            "likes": 20,
            "comments": 3,
            "clicks": 12
        }
        
        for engagement_type, count in mock_engagement.items():
            await self.track_engagement(share.id, {
                "type": engagement_type,
                "count": count,
                "metadata": {"source": "api_fetch"}
            })
    
    async def _fetch_instagram_engagement(self, share: SocialShare, account: SocialAccount):
        """Fetch engagement from Instagram"""
        # Mock implementation - would call Instagram Graph API
        mock_engagement = {
            "likes": 35,
            "comments": 7,
            "clicks": 15
        }
        
        for engagement_type, count in mock_engagement.items():
            await self.track_engagement(share.id, {
                "type": engagement_type,
                "count": count,
                "metadata": {"source": "api_fetch"}
            })
    
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
                
                # Clean up old engagement data
                for share_id, engagement_list in self.engagement.items():
                    self.engagement[share_id] = [
                        eng for eng in engagement_list
                        if eng.timestamp >= cutoff_date
                    ]
                
                logger.debug("Social media data cleanup completed")
                
                # Sleep until next cleanup
                await asyncio.sleep(86400)  # Clean up daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup loop error: {e}")
                await asyncio.sleep(86400)
    
    def get_social_media_service_status(self) -> Dict[str, Any]:
        """Get social media service status"""
        try:
            # Calculate statistics
            total_accounts = len(self.social_accounts)
            active_accounts = len([a for a in self.social_accounts.values() if a.is_active])
            
            total_content = len(self.content)
            total_shares = sum(len(shares) for shares in self.shares.values())
            published_shares = sum(
                len([s for s in shares if s.status == ShareStatus.PUBLISHED])
                for shares in self.shares.values()
            )
            
            total_engagement = sum(
                sum(eng.count for eng in engagement_list)
                for engagement_list in self.engagement.values()
            )
            
            # Queue size
            queue_size = len(self.share_queue)
            
            # Platform distribution
            platform_distribution = {}
            for account in self.social_accounts.values():
                platform = account.platform.value
                platform_distribution[platform] = platform_distribution.get(platform, 0) + 1
            
            return {
                "service_status": {
                    "is_running": self.is_running,
                    "start_time": self.start_time.isoformat() if self.start_time else None,
                    "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
                },
                "account_stats": {
                    "total_accounts": total_accounts,
                    "active_accounts": active_accounts,
                    "platform_distribution": platform_distribution
                },
                "content_stats": {
                    "total_content": total_content,
                    "total_shares": total_shares,
                    "published_shares": published_shares,
                    "queue_size": queue_size
                },
                "engagement_stats": {
                    "total_engagement": total_engagement,
                    "engagement_records": sum(len(engagement_list) for engagement_list in self.engagement.values())
                },
                "analytics_stats": {
                    "total_analytics": len(self.analytics)
                },
                "supported_platforms": list(self.platform_configs.keys()),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get social media service status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global social media service instance
social_media_service: Optional[SocialMediaService] = None

def get_social_media_service(config: Dict[str, Any] = None) -> SocialMediaService:
    """Get or create social media service instance"""
    global social_media_service
    if social_media_service is None:
        social_media_service = SocialMediaService(config)
    return social_media_service

async def start_social_media_service(config: Dict[str, Any] = None) -> SocialMediaService:
    """Start social media service"""
    service = get_social_media_service(config)
    await service.start()
    return service

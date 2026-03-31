"""
Privacy Controls Service for PyMastery
Provides comprehensive granular privacy settings and controls
"""

import logging
import json
import time
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
from collections import defaultdict
import uuid

logger = logging.getLogger(__name__)

class PrivacyLevel(Enum):
    """Privacy levels"""
    PUBLIC = "public"
    FRIENDS = "friends"
    PRIVATE = "private"
    CUSTOM = "custom"

class DataType(Enum):
    """Data types for privacy controls"""
    PROFILE_INFO = "profile_info"
    LEARNING_PROGRESS = "learning_progress"
    COURSE_COMPLETIONS = "course_completions"
    CERTIFICATES = "certificates"
    SUBMISSIONS = "submissions"
    ACTIVITY_LOGS = "activity_logs"
    ANALYTICS_DATA = "analytics_data"
    SOCIAL_ACTIVITY = "social_activity"
    COMMUNICATIONS = "communications"
    PAYMENT_INFO = "payment_info"
    LOCATION_DATA = "location_data"
    BIOMETRIC_DATA = "biometric_data"
    SEARCH_HISTORY = "search_history"
    BROWSING_HISTORY = "browsing_history"
    DEVICE_INFO = "device_info"

class ControlType(Enum):
    """Types of privacy controls"""
    VISIBILITY = "visibility"
    SHARING = "sharing"
    PROCESSING = "processing"
    RETENTION = "retention"
    ACCESS = "access"
    CONSENT = "consent"

class ActionType(Enum):
    """Privacy action types"""
    ALLOW = "allow"
    DENY = "deny"
    LIMIT = "limit"
    ANONYMIZE = "anonymize"
    DELETE = "delete"
    REQUIRE_CONSENT = "require_consent"

@dataclass
class PrivacySetting:
    """Privacy setting configuration"""
    id: str
    user_id: str
    data_type: DataType
    control_type: ControlType
    privacy_level: PrivacyLevel
    action: ActionType
    conditions: Dict[str, Any]
    exceptions: List[str]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    is_active: bool

@dataclass
class PrivacyTemplate:
    """Privacy template configuration"""
    id: str
    name: str
    description: str
    privacy_level: PrivacyLevel
    settings: Dict[str, Dict[str, Any]]
    is_default: bool
    created_at: datetime
    updated_at: datetime
    is_active: bool

@dataclass
class PrivacyAudit:
    """Privacy audit record"""
    id: str
    user_id: str
    action: str
    resource_type: str
    resource_id: str
    privacy_setting_id: str
    decision: str  # "allowed", "denied", "limited"
    reason: str
    context: Dict[str, Any]
    created_at: datetime

class PrivacyControlsService:
    """Privacy controls service"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Service state
        self.is_running = False
        self.start_time = None
        
        # Privacy settings
        self.settings: Dict[str, PrivacySetting] = {}
        self.user_settings: Dict[str, List[str]] = {}  # user_id -> [setting_ids]
        
        # Privacy templates
        self.templates: Dict[str, PrivacyTemplate] = {}
        
        # Privacy audits
        self.audits: Dict[str, PrivacyAudit] = {}
        self.user_audits: Dict[str, List[str]] = {}  # user_id -> [audit_ids]
        
        # Background tasks
        self.cleanup_task: Optional[asyncio.Task] = None
        
        # Configuration
        self.default_retention_days = self.config.get("default_retention_days", 2555)  # 7 years
        self.max_audit_records = self.config.get("max_audit_records", 100000)
        self.audit_retention_days = self.config.get("audit_retention_days", 1095)  # 3 years
        
        # Initialize default templates
        self._initialize_default_templates()
    
    def _initialize_default_templates(self):
        """Initialize default privacy templates"""
        # Public profile template
        self.templates["public_profile"] = PrivacyTemplate(
            id="public_profile",
            name="Public Profile",
            description="Basic public profile with minimal privacy",
            privacy_level=PrivacyLevel.PUBLIC,
            settings={
                "profile_info": {
                    "visibility": "public",
                    "sharing": "limited",
                    "processing": "allowed",
                    "retention": "standard"
                },
                "learning_progress": {
                    "visibility": "public",
                    "sharing": "limited",
                    "processing": "allowed",
                    "retention": "standard"
                },
                "course_completions": {
                    "visibility": "public",
                    "sharing": "allowed",
                    "processing": "allowed",
                    "retention": "permanent"
                },
                "certificates": {
                    "visibility": "public",
                    "sharing": "allowed",
                    "processing": "allowed",
                    "retention": "permanent"
                },
                "submissions": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "activity_logs": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "analytics_data": {
                    "visibility": "private",
                    "sharing": "limited",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "social_activity": {
                    "visibility": "public",
                    "sharing": "allowed",
                    "processing": "allowed",
                    "retention": "standard"
                }
            },
            is_default=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Friends only template
        self.templates["friends_only"] = PrivacyTemplate(
            id="friends_only",
            name="Friends Only",
            description="Profile visible to friends only",
            privacy_level=PrivacyLevel.FRIENDS,
            settings={
                "profile_info": {
                    "visibility": "friends",
                    "sharing": "limited",
                    "processing": "allowed",
                    "retention": "standard"
                },
                "learning_progress": {
                    "visibility": "friends",
                    "sharing": "limited",
                    "processing": "allowed",
                    "retention": "standard"
                },
                "course_completions": {
                    "visibility": "friends",
                    "sharing": "limited",
                    "processing": "allowed",
                    "retention": "standard"
                },
                "certificates": {
                    "visibility": "friends",
                    "sharing": "limited",
                    "processing": "allowed",
                    "retention": "standard"
                },
                "submissions": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "activity_logs": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "analytics_data": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "social_activity": {
                    "visibility": "friends",
                    "sharing": "limited",
                    "processing": "allowed",
                    "retention": "standard"
                }
            },
            is_default=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Private profile template
        self.templates["private_profile"] = PrivacyTemplate(
            id="private_profile",
            name="Private Profile",
            description="Maximum privacy settings",
            privacy_level=PrivacyLevel.PRIVATE,
            settings={
                "profile_info": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "limited",
                    "retention": "limited"
                },
                "learning_progress": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "limited",
                    "retention": "limited"
                },
                "course_completions": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "limited",
                    "retention": "limited"
                },
                "certificates": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "limited",
                    "retention": "limited"
                },
                "submissions": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "activity_logs": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "analytics_data": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "social_activity": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "limited",
                    "retention": "limited"
                }
            },
            is_default=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Custom balanced template
        self.templates["balanced"] = PrivacyTemplate(
            id="balanced",
            name="Balanced Privacy",
            description="Balanced privacy with selective sharing",
            privacy_level=PrivacyLevel.CUSTOM,
            settings={
                "profile_info": {
                    "visibility": "friends",
                    "sharing": "limited",
                    "processing": "allowed",
                    "retention": "standard"
                },
                "learning_progress": {
                    "visibility": "public",
                    "sharing": "limited",
                    "processing": "allowed",
                    "retention": "standard"
                },
                "course_completions": {
                    "visibility": "public",
                    "sharing": "allowed",
                    "processing": "allowed",
                    "retention": "permanent"
                },
                "certificates": {
                    "visibility": "public",
                    "sharing": "allowed",
                    "processing": "allowed",
                    "retention": "permanent"
                },
                "submissions": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "activity_logs": {
                    "visibility": "private",
                    "sharing": "denied",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "analytics_data": {
                    "visibility": "private",
                    "sharing": "limited",
                    "processing": "anonymized",
                    "retention": "limited"
                },
                "social_activity": {
                    "visibility": "friends",
                    "sharing": "limited",
                    "processing": "allowed",
                    "retention": "standard"
                }
            },
            is_default=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
    
    async def start(self):
        """Start the privacy controls service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Load existing data
        await self._load_privacy_data()
        
        # Start background tasks
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        logger.info("Privacy controls service started",
                   extra_fields={
                       "event_type": "privacy_controls_service_started",
                       "active_templates": len([t for t in self.templates.values() if t.is_active]),
                       "default_template": next((t.id for t in self.templates.values() if t.is_default), None)
                   })
    
    async def stop(self):
        """Stop the privacy controls service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel cleanup task
        if self.cleanup_task:
            self.cleanup_task.cancel()
        
        # Save data
        await self._save_privacy_data()
        
        logger.info("Privacy controls service stopped",
                   extra_fields={
                       "event_type": "privacy_controls_service_stopped"
                   })
    
    async def _load_privacy_data(self):
        """Load privacy data from storage"""
        try:
            # In a real implementation, this would load from database
            # For now, use the initialized templates
            pass
        except Exception as e:
            logger.error(f"Error loading privacy data: {e}")
    
    async def _save_privacy_data(self):
        """Save privacy data to storage"""
        try:
            # In a real implementation, this would save to database
            pass
        except Exception as e:
            logger.error(f"Error saving privacy data: {e}")
    
    async def _cleanup_loop(self):
        """Background task for cleanup operations"""
        while self.is_running:
            try:
                await asyncio.sleep(86400)  # Run daily
                await self._cleanup_expired_settings()
                await self._cleanup_old_audits()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
    
    async def _cleanup_expired_settings(self):
        """Clean up expired privacy settings"""
        try:
            current_time = datetime.now(timezone.utc)
            expired_settings = []
            
            for setting_id, setting in self.settings.items():
                if setting.expires_at and current_time >= setting.expires_at:
                    expired_settings.append(setting_id)
            
            for setting_id in expired_settings:
                # Remove from user settings mapping
                if setting_id in self.settings:
                    user_id = self.settings[setting_id].user_id
                    if user_id in self.user_settings:
                        if setting_id in self.user_settings[user_id]:
                            self.user_settings[user_id].remove(setting_id)
                
                del self.settings[setting_id]
            
            if expired_settings:
                logger.info(f"Cleaned up {len(expired_settings)} expired privacy settings")
        
        except Exception as e:
            logger.error(f"Error cleaning up expired settings: {e}")
    
    async def _cleanup_old_audits(self):
        """Clean up old audit records"""
        try:
            cutoff_time = datetime.now(timezone.utc) - timedelta(days=self.audit_retention_days)
            old_audits = []
            
            for audit_id, audit in self.audits.items():
                if audit.created_at < cutoff_time:
                    old_audits.append(audit_id)
            
            # Limit cleanup to avoid removing too many at once
            if len(old_audits) > 1000:
                old_audits = old_audits[:1000]
            
            for audit_id in old_audits:
                # Remove from user audits mapping
                if audit_id in self.audits:
                    user_id = self.audits[audit_id].user_id
                    if user_id in self.user_audits:
                        if audit_id in self.user_audits[user_id]:
                            self.user_audits[user_id].remove(audit_id)
                
                del self.audits[audit_id]
            
            if old_audits:
                logger.info(f"Cleaned up {len(old_audits)} old audit records")
        
        except Exception as e:
            logger.error(f"Error cleaning up old audits: {e}")
    
    def create_privacy_template(self, name: str, description: str, privacy_level: PrivacyLevel,
                              settings: Dict[str, Dict[str, Any]], is_default: bool = False) -> Dict[str, Any]:
        """Create a new privacy template"""
        try:
            template_id = f"template_{int(time.time())}_{secrets.token_hex(8)}"
            
            # If setting as default, unset other defaults
            if is_default:
                for template in self.templates.values():
                    template.is_default = False
            
            template = PrivacyTemplate(
                id=template_id,
                name=name,
                description=description,
                privacy_level=privacy_level,
                settings=settings,
                is_default=is_default,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                is_active=True
            )
            
            self.templates[template_id] = template
            
            logger.info(f"Privacy template created: {template_id}",
                       extra_fields={
                           "event_type": "privacy_template_created",
                           "template_id": template_id,
                           "name": name,
                           "privacy_level": privacy_level.value
                       })
            
            return {
                "success": True,
                "template_id": template_id,
                "name": name,
                "privacy_level": privacy_level.value,
                "is_default": is_default
            }
        
        except Exception as e:
            logger.error(f"Error creating privacy template: {e}")
            return {"success": False, "error": str(e)}
    
    def get_privacy_templates(self, privacy_level: PrivacyLevel = None, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get privacy templates with filtering"""
        try:
            templates = list(self.templates.values())
            
            # Apply filters
            if privacy_level:
                templates = [t for t in templates if t.privacy_level == privacy_level]
            if active_only:
                templates = [t for t in templates if t.is_active]
            
            return [
                {
                    "id": template.id,
                    "name": template.name,
                    "description": template.description,
                    "privacy_level": template.privacy_level.value,
                    "settings": template.settings,
                    "is_default": template.is_default,
                    "created_at": template.created_at.isoformat(),
                    "updated_at": template.updated_at.isoformat(),
                    "is_active": template.is_active
                }
                for template in templates
            ]
        
        except Exception as e:
            logger.error(f"Error getting privacy templates: {e}")
            return []
    
    async def apply_privacy_template(self, user_id: str, template_id: str) -> Dict[str, Any]:
        """Apply a privacy template to a user"""
        try:
            template = self.templates.get(template_id)
            if not template or not template.is_active:
                return {"success": False, "error": "Template not found or inactive"}
            
            # Remove existing settings
            if user_id in self.user_settings:
                existing_setting_ids = self.user_settings[user_id].copy()
                for setting_id in existing_setting_ids:
                    if setting_id in self.settings:
                        del self.settings[setting_id]
                self.user_settings[user_id] = []
            
            # Create new settings from template
            created_settings = []
            
            for data_type_str, config in template.settings.items():
                try:
                    data_type = DataType(data_type_str)
                    
                    # Create privacy setting
                    setting_id = f"setting_{int(time.time())}_{secrets.token_hex(8)}"
                    
                    # Convert config to action and conditions
                    action = self._config_to_action(config)
                    conditions = self._config_to_conditions(config)
                    
                    setting = PrivacySetting(
                        id=setting_id,
                        user_id=user_id,
                        data_type=data_type,
                        control_type=ControlType.VISIBILITY,  # Default to visibility
                        privacy_level=template.privacy_level,
                        action=action,
                        conditions=conditions,
                        exceptions=[],
                        expires_at=None,
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                        is_active=True
                    )
                    
                    self.settings[setting_id] = setting
                    
                    # Add to user settings
                    if user_id not in self.user_settings:
                        self.user_settings[user_id] = []
                    self.user_settings[user_id].append(setting_id)
                    
                    created_settings.append(setting_id)
                
                except ValueError:
                    # Skip invalid data types
                    continue
            
            logger.info(f"Privacy template applied: {template_id} to user {user_id}",
                       extra_fields={
                           "event_type": "privacy_template_applied",
                           "template_id": template_id,
                           "user_id": user_id,
                           "settings_created": len(created_settings)
                       })
            
            return {
                "success": True,
                "template_id": template_id,
                "user_id": user_id,
                "settings_created": len(created_settings),
                "privacy_level": template.privacy_level.value
            }
        
        except Exception as e:
            logger.error(f"Error applying privacy template: {e}")
            return {"success": False, "error": str(e)}
    
    def _config_to_action(self, config: Dict[str, Any]) -> ActionType:
        """Convert configuration to action type"""
        try:
            visibility = config.get("visibility", "private")
            sharing = config.get("sharing", "denied")
            processing = config.get("processing", "limited")
            
            # Determine action based on configuration
            if visibility == "public" and sharing == "allowed":
                return ActionType.ALLOW
            elif visibility == "private" and sharing == "denied":
                return ActionType.DENY
            elif processing == "anonymized":
                return ActionType.ANONYMIZE
            elif processing == "limited":
                return ActionType.LIMIT
            else:
                return ActionType.ALLOW
        
        except Exception:
            return ActionType.ALLOW
    
    def _config_to_conditions(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Convert configuration to conditions"""
        try:
            conditions = {
                "visibility": config.get("visibility", "private"),
                "sharing": config.get("sharing", "denied"),
                "processing": config.get("processing", "limited"),
                "retention": config.get("retention", "standard")
            }
            
            # Add additional conditions based on configuration
            if config.get("require_consent", False):
                conditions["require_consent"] = True
            
            if config.get("age_restriction"):
                conditions["age_restriction"] = config["age_restriction"]
            
            return conditions
        
        except Exception:
            return {}
    
    async def create_privacy_setting(self, user_id: str, data_type: DataType, control_type: ControlType,
                                   privacy_level: PrivacyLevel, action: ActionType,
                                   conditions: Dict[str, Any] = None, exceptions: List[str] = None,
                                   expires_at: datetime = None) -> Dict[str, Any]:
        """Create a new privacy setting"""
        try:
            setting_id = f"setting_{int(time.time())}_{secrets.token_hex(8)}"
            
            setting = PrivacySetting(
                id=setting_id,
                user_id=user_id,
                data_type=data_type,
                control_type=control_type,
                privacy_level=privacy_level,
                action=action,
                conditions=conditions or {},
                exceptions=exceptions or [],
                expires_at=expires_at,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                is_active=True
            )
            
            self.settings[setting_id] = setting
            
            # Add to user settings
            if user_id not in self.user_settings:
                self.user_settings[user_id] = []
            self.user_settings[user_id].append(setting_id)
            
            logger.info(f"Privacy setting created: {setting_id}",
                       extra_fields={
                           "event_type": "privacy_setting_created",
                           "setting_id": setting_id,
                           "user_id": user_id,
                           "data_type": data_type.value,
                           "action": action.value
                       })
            
            return {
                "success": True,
                "setting_id": setting_id,
                "user_id": user_id,
                "data_type": data_type.value,
                "action": action.value
            }
        
        except Exception as e:
            logger.error(f"Error creating privacy setting: {e}")
            return {"success": False, "error": str(e)}
    
    async def update_privacy_setting(self, setting_id: str, action: ActionType = None,
                                   conditions: Dict[str, Any] = None, exceptions: List[str] = None,
                                   expires_at: datetime = None) -> Dict[str, Any]:
        """Update an existing privacy setting"""
        try:
            setting = self.settings.get(setting_id)
            if not setting:
                return {"success": False, "error": "Setting not found"}
            
            # Update setting
            if action is not None:
                setting.action = action
            if conditions is not None:
                setting.conditions.update(conditions)
            if exceptions is not None:
                setting.exceptions = exceptions
            if expires_at is not None:
                setting.expires_at = expires_at
            
            setting.updated_at = datetime.now(timezone.utc)
            
            logger.info(f"Privacy setting updated: {setting_id}",
                       extra_fields={
                           "event_type": "privacy_setting_updated",
                           "setting_id": setting_id
                       })
            
            return {
                "success": True,
                "setting_id": setting_id,
                "updated_at": setting.updated_at.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error updating privacy setting: {e}")
            return {"success": False, "error": str(e)}
    
    def get_user_privacy_settings(self, user_id: str, data_type: DataType = None,
                                control_type: ControlType = None) -> List[Dict[str, Any]]:
        """Get user's privacy settings with filtering"""
        try:
            if user_id not in self.user_settings:
                return []
            
            settings = []
            for setting_id in self.user_settings[user_id]:
                setting = self.settings.get(setting_id)
                if setting and setting.is_active:
                    # Apply filters
                    if data_type and setting.data_type != data_type:
                        continue
                    if control_type and setting.control_type != control_type:
                        continue
                    
                    settings.append(setting)
            
            # Sort by creation time (newest first)
            settings.sort(key=lambda x: x.created_at, reverse=True)
            
            return [
                {
                    "id": setting.id,
                    "user_id": setting.user_id,
                    "data_type": setting.data_type.value,
                    "control_type": setting.control_type.value,
                    "privacy_level": setting.privacy_level.value,
                    "action": setting.action.value,
                    "conditions": setting.conditions,
                    "exceptions": setting.exceptions,
                    "expires_at": setting.expires_at.isoformat() if setting.expires_at else None,
                    "created_at": setting.created_at.isoformat(),
                    "updated_at": setting.updated_at.isoformat(),
                    "is_active": setting.is_active
                }
                for setting in settings
            ]
        
        except Exception as e:
            logger.error(f"Error getting user privacy settings: {e}")
            return []
    
    async def check_privacy_permission(self, user_id: str, data_type: DataType,
                                    action: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Check if a privacy action is allowed"""
        try:
            # Get user's privacy settings for this data type
            user_settings = self.get_user_privacy_settings(user_id, data_type)
            
            if not user_settings:
                # No settings found, apply default (deny for privacy)
                decision = "denied"
                reason = "No privacy settings found, defaulting to deny"
            else:
                # Check each setting
                for setting in user_settings:
                    decision_result = await self._evaluate_privacy_setting(setting, action, context)
                    
                    if decision_result["allowed"]:
                        decision = "allowed"
                        reason = decision_result["reason"]
                        break
                    else:
                        decision = "denied"
                        reason = decision_result["reason"]
            
            # Create audit record
            audit_id = f"audit_{int(time.time())}_{secrets.token_hex(8)}"
            audit = PrivacyAudit(
                id=audit_id,
                user_id=user_id,
                action=action,
                resource_type=data_type.value,
                resource_id=context.get("resource_id", ""),
                privacy_setting_id=user_settings[0].id if user_settings else "",
                decision=decision,
                reason=reason,
                context=context or {},
                created_at=datetime.now(timezone.utc)
            )
            
            self.audits[audit_id] = audit
            
            # Add to user audits
            if user_id not in self.user_audits:
                self.user_audits[user_id] = []
            self.user_audits[user_id].append(audit_id)
            
            # Limit audit records
            if len(self.audits) > self.max_audit_records:
                oldest_audit_id = min(self.audits.keys(), key=lambda k: self.audits[k].created_at)
                oldest_user_id = self.audits[oldest_audit_id].user_id
                del self.audits[oldest_audit_id]
                if oldest_user_id in self.user_audits and oldest_audit_id in self.user_audits[oldest_user_id]:
                    self.user_audits[oldest_user_id].remove(oldest_audit_id)
            
            logger.info(f"Privacy permission check: {user_id} {action} {data_type.value} -> {decision}",
                       extra_fields={
                           "event_type": "privacy_permission_check",
                           "user_id": user_id,
                           "data_type": data_type.value,
                           "action": action,
                           "decision": decision,
                           "reason": reason
                       })
            
            return {
                "allowed": decision == "allowed",
                "decision": decision,
                "reason": reason,
                "audit_id": audit_id
            }
        
        except Exception as e:
            logger.error(f"Error checking privacy permission: {e}")
            return {"allowed": False, "decision": "error", "reason": str(e)}
    
    async def _evaluate_privacy_setting(self, setting: PrivacySetting, action: str,
                                       context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a privacy setting against an action"""
        try:
            # Check if setting has expired
            if setting.expires_at and datetime.now(timezone.utc) >= setting.expires_at:
                return {"allowed": False, "reason": "Privacy setting has expired"}
            
            # Check exceptions
            if setting.exceptions:
                for exception in setting.exceptions:
                    if exception in context.get("tags", []):
                        return {"allowed": True, "reason": "Action allowed by exception"}
            
            # Evaluate based on action type
            if setting.action == ActionType.ALLOW:
                return {"allowed": True, "reason": "Action explicitly allowed"}
            
            elif setting.action == ActionType.DENY:
                return {"allowed": False, "reason": "Action explicitly denied"}
            
            elif setting.action == ActionType.LIMIT:
                # Check conditions for limitation
                conditions = setting.conditions
                
                # Check visibility conditions
                visibility = conditions.get("visibility", "private")
                if visibility == "private" and action in ["view", "access"]:
                    return {"allowed": False, "reason": "Action limited by privacy setting"}
                
                # Check sharing conditions
                sharing = conditions.get("sharing", "denied")
                if sharing == "denied" and action in ["share", "export"]:
                    return {"allowed": False, "reason": "Sharing denied by privacy setting"}
                
                # Check processing conditions
                processing = conditions.get("processing", "limited")
                if processing == "limited" and action in ["process", "analyze"]:
                    return {"allowed": False, "reason": "Processing limited by privacy setting"}
                
                return {"allowed": True, "reason": "Action allowed within limits"}
            
            elif setting.action == ActionType.ANONYMIZE:
                # Allow action but with anonymization
                if action in ["view", "access", "share"]:
                    return {"allowed": True, "reason": "Action allowed with anonymization"}
                else:
                    return {"allowed": False, "reason": "Action requires anonymization"}
            
            elif setting.action == ActionType.DELETE:
                # Deny access if data should be deleted
                return {"allowed": False, "reason": "Data marked for deletion"}
            
            elif setting.action == ActionType.REQUIRE_CONSENT:
                # Check if consent is present in context
                if context.get("consent_given", False):
                    return {"allowed": True, "reason": "Consent provided"}
                else:
                    return {"allowed": False, "reason": "Consent required but not provided"}
            
            else:
                return {"allowed": False, "reason": "Unknown privacy action"}
        
        except Exception as e:
            logger.error(f"Error evaluating privacy setting: {e}")
            return {"allowed": False, "reason": f"Error evaluating setting: {str(e)}"}
    
    def get_privacy_audits(self, user_id: str = None, decision: str = None,
                          limit: int = 100) -> List[Dict[str, Any]]:
        """Get privacy audit records with filtering"""
        try:
            audits = list(self.audits.values())
            
            # Apply filters
            if user_id:
                audits = [a for a in audits if a.user_id == user_id]
            if decision:
                audits = [a for a in audits if a.decision == decision]
            
            # Sort by creation time (newest first) and limit
            audits.sort(key=lambda x: x.created_at, reverse=True)
            audits = audits[:limit]
            
            return [
                {
                    "id": audit.id,
                    "user_id": audit.user_id,
                    "action": audit.action,
                    "resource_type": audit.resource_type,
                    "resource_id": audit.resource_id,
                    "privacy_setting_id": audit.privacy_setting_id,
                    "decision": audit.decision,
                    "reason": audit.reason,
                    "context": audit.context,
                    "created_at": audit.created_at.isoformat()
                }
                for audit in audits
            ]
        
        except Exception as e:
            logger.error(f"Error getting privacy audits: {e}")
            return []
    
    def get_privacy_summary(self, user_id: str) -> Dict[str, Any]:
        """Get privacy summary for a user"""
        try:
            # Get user settings
            settings = self.get_user_privacy_settings(user_id)
            
            # Group settings by data type
            settings_by_type = defaultdict(list)
            for setting in settings:
                settings_by_type[setting["data_type"]].append(setting)
            
            # Calculate privacy level distribution
            privacy_levels = defaultdict(int)
            for setting in settings:
                privacy_levels[setting["privacy_level"]] += 1
            
            # Get recent audits
            recent_audits = self.get_privacy_audits(user_id, limit=50)
            
            # Calculate audit statistics
            audit_stats = {
                "total_audits": len(recent_audits),
                "allowed_count": len([a for a in recent_audits if a["decision"] == "allowed"]),
                "denied_count": len([a for a in recent_audits if a["decision"] == "denied"]),
                "limited_count": len([a for a in recent_audits if a["decision"] == "limited"])
            }
            
            # Determine overall privacy level
            if privacy_levels:
                overall_level = max(privacy_levels.keys(), key=lambda k: privacy_levels[k])
            else:
                overall_level = "private"
            
            return {
                "user_id": user_id,
                "overall_privacy_level": overall_level,
                "total_settings": len(settings),
                "settings_by_type": dict(settings_by_type),
                "privacy_levels": dict(privacy_levels),
                "audit_statistics": audit_stats,
                "recent_activity": recent_audits[:10],  # Last 10 activities
                "privacy_score": self._calculate_privacy_score(settings),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error getting privacy summary: {e}")
            return {"error": str(e)}
    
    def _calculate_privacy_score(self, settings: List[Dict[str, Any]]) -> float:
        """Calculate privacy score (0-100, higher = more private)"""
        try:
            if not settings:
                return 100.0  # No settings = maximum privacy by default
            
            score = 0.0
            
            for setting in settings:
                # Base score by action type
                if setting["action"] == "deny":
                    score += 25
                elif setting["action"] == "limit":
                    score += 20
                elif setting["action"] == "anonymize":
                    score += 15
                elif setting["action"] == "require_consent":
                    score += 20
                elif setting["action"] == "allow":
                    score += 5
                
                # Bonus for private level
                if setting["privacy_level"] == "private":
                    score += 5
                elif setting["privacy_level"] == "friends":
                    score += 3
                elif setting["privacy_level"] == "public":
                    score += 0
            
            # Normalize to 0-100 scale
            max_possible_score = len(settings) * 30  # Maximum per setting
            normalized_score = (score / max_possible_score) * 100 if max_possible_score > 0 else 0
            
            return min(normalized_score, 100.0)
        
        except Exception as e:
            logger.error(f"Error calculating privacy score: {e}")
            return 50.0  # Default to middle value
    
    def get_privacy_statistics(self) -> Dict[str, Any]:
        """Get privacy controls statistics"""
        try:
            # Calculate overall statistics
            total_settings = len(self.settings)
            active_settings = len([s for s in self.settings.values() if s.is_active])
            total_audits = len(self.audits)
            
            # Statistics by data type
            settings_by_data_type = defaultdict(int)
            for setting in self.settings.values():
                settings_by_data_type[setting.data_type.value] += 1
            
            # Statistics by action type
            settings_by_action = defaultdict(int)
            for setting in self.settings.values():
                settings_by_action[setting.action.value] += 1
            
            # Statistics by privacy level
            settings_by_privacy_level = defaultdict(int)
            for setting in self.settings.values():
                settings_by_privacy_level[setting.privacy_level.value] += 1
            
            # Audit statistics
            audit_decisions = defaultdict(int)
            for audit in self.audits.values():
                audit_decisions[audit.decision] += 1
            
            # Recent activity (last 30 days)
            cutoff_time = datetime.now(timezone.utc) - timedelta(days=30)
            recent_audits = len([a for a in self.audits.values() if a.created_at > cutoff_time])
            recent_settings = len([s for s in self.settings.values() if s.created_at > cutoff_time])
            
            # Template statistics
            template_stats = {
                "total_templates": len(self.templates),
                "active_templates": len([t for t in self.templates.values() if t.is_active]),
                "default_template": next((t.id for t in self.templates.values() if t.is_default), None),
                "templates_by_level": {
                    level.value: len([t for t in self.templates.values() if t.privacy_level == level])
                    for level in PrivacyLevel
                }
            }
            
            return {
                "overall_statistics": {
                    "total_settings": total_settings,
                    "active_settings": active_settings,
                    "total_audits": total_audits,
                    "unique_users": len(set(s.user_id for s in self.settings.values()))
                },
                "by_data_type": dict(settings_by_data_type),
                "by_action_type": dict(settings_by_action),
                "by_privacy_level": dict(settings_by_privacy_level),
                "audit_statistics": {
                    "total_audits": total_audits,
                    "decisions": dict(audit_decisions),
                    "recent_audits": recent_audits
                },
                "recent_activity": {
                    "recent_settings": recent_settings,
                    "recent_audits": recent_audits,
                    "period_days": 30
                },
                "template_statistics": template_stats,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error getting privacy statistics: {e}")
            return {"error": str(e)}
    
    def get_privacy_controls_service_status(self) -> Dict[str, Any]:
        """Get privacy controls service status"""
        try:
            return {
                "service_status": {
                    "is_running": self.is_running,
                    "start_time": self.start_time.isoformat() if self.start_time else None,
                    "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
                },
                "configuration": {
                    "default_retention_days": self.default_retention_days,
                    "max_audit_records": self.max_audit_records,
                    "audit_retention_days": self.audit_retention_days
                },
                "statistics": self.get_privacy_statistics(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get privacy controls service status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global privacy controls service instance
privacy_controls_service: Optional[PrivacyControlsService] = None

def get_privacy_controls_service(config: Dict[str, Any] = None) -> PrivacyControlsService:
    """Get or create privacy controls service instance"""
    global privacy_controls_service
    if privacy_controls_service is None:
        privacy_controls_service = PrivacyControlsService(config)
    return privacy_controls_service

async def start_privacy_controls_service(config: Dict[str, Any] = None) -> PrivacyControlsService:
    """Start privacy controls service"""
    service = get_privacy_controls_service(config)
    await service.start()
    return service

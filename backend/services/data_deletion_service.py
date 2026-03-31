"""
Data Deletion Service for PyMastery
Provides comprehensive GDPR-compliant data deletion and right to be forgotten features
"""

import logging
import json
import time
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
from collections import defaultdict
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

class DeletionType(Enum):
    """Types of data deletion"""
    IMMEDIATE = "immediate"
    DEFERRED = "deferred"
    ANONYMIZATION = "anonymization"
    PARTIAL = "partial"
    COMPLETE = "complete"

class DeletionStatus(Enum):
    """Deletion request status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    VERIFIED = "verified"

class DataCategory(Enum):
    """Data categories for deletion"""
    PROFILE = "profile"
    LEARNING_DATA = "learning_data"
    COURSE_DATA = "course_data"
    SUBMISSIONS = "submissions"
    CERTIFICATES = "certificates"
    PAYMENTS = "payments"
    COMMUNICATIONS = "communications"
    ACTIVITY_LOGS = "activity_logs"
    PREFERENCES = "preferences"
    ANALYTICS = "analytics"
    SOCIAL_DATA = "social_data"
    CONSENTS = "consents"
    AUDIT_TRAIL = "audit_trail"
    BACKUPS = "backups"
    CACHE = "cache"
    TEMPORARY = "temporary"

class RetentionPolicy(Enum):
    """Data retention policies"""
    IMMEDIATE_DELETION = "immediate_deletion"
    LEGAL_HOLD = "legal_hold"
    REGULATORY_RETENTION = "regulatory_retention"
    BUSINESS_RETENTION = "business_retention"
    ANONYMIZATION_ONLY = "anonymization_only"

@dataclass
class DeletionPolicy:
    """Deletion policy configuration"""
    id: str
    name: str
    description: str
    category: DataCategory
    retention_policy: RetentionPolicy
    retention_days: Optional[int]
    deletion_type: DeletionType
    anonymization_method: Optional[str]
    verification_required: bool
    backup_retention_days: int
    legal_hold_exceptions: List[str]
    created_at: datetime
    updated_at: datetime
    is_active: bool

@dataclass
class DeletionRequest:
    """Deletion request record"""
    id: str
    user_id: str
    request_type: str  # "account_deletion", "data_deletion", "partial_deletion"
    categories: List[DataCategory]
    deletion_type: DeletionType
    reason: str
    status: DeletionStatus
    progress: float
    total_records: int
    processed_records: int
    deleted_records: int
    anonymized_records: int
    failed_records: int
    verification_code: str
    verification_expires_at: datetime
    requested_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    verified_at: Optional[datetime]
    error_message: Optional[str]
    metadata: Dict[str, Any]

@dataclass
class DeletionResult:
    """Deletion result record"""
    id: str
    request_id: str
    category: DataCategory
    records_count: int
    deleted_count: int
    anonymized_count: int
    failed_count: int
    details: Dict[str, Any]
    created_at: datetime

@dataclass
class DeletionVerification:
    """Deletion verification record"""
    id: str
    request_id: str
    verification_code: str
    verification_method: str
    verification_data: Dict[str, Any]
    verified_at: datetime
    expires_at: datetime
    is_verified: bool
    metadata: Dict[str, Any]

class DataDeletionService:
    """Data deletion service"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Service state
        self.is_running = False
        self.start_time = None
        
        # Deletion policies
        self.policies: Dict[str, DeletionPolicy] = {}
        
        # Deletion requests
        self.requests: Dict[str, DeletionRequest] = {}
        self.user_requests: Dict[str, List[str]] = {}  # user_id -> [request_ids]
        
        # Deletion results
        self.results: Dict[str, DeletionResult] = {}
        
        # Deletion verifications
        self.verifications: Dict[str, DeletionVerification] = {}
        
        # Background tasks
        self.processing_tasks: Dict[str, asyncio.Task] = {}
        self.cleanup_task: Optional[asyncio.Task] = None
        
        # Configuration
        self.max_concurrent_deletions = self.config.get("max_concurrent_deletions", 2)
        self.default_retention_days = self.config.get("default_retention_days", 30)
        self.verification_code_length = self.config.get("verification_code_length", 16)
        self.verification_expiry_hours = self.config.get("verification_expiry_hours", 48)
        self.batch_size = self.config.get("batch_size", 1000)
        
        # Storage configuration
        self.storage_path = Path(self.config.get("storage_path", "data_deletions"))
        self.storage_path.mkdir(exist_ok=True)
        
        # Initialize default policies
        self._initialize_default_policies()
    
    def _initialize_default_policies(self):
        """Initialize default deletion policies"""
        # Profile data policy
        self.policies["profile_policy"] = DeletionPolicy(
            id="profile_policy",
            name="Profile Data Deletion Policy",
            description="Policy for user profile data deletion",
            category=DataCategory.PROFILE,
            retention_policy=RetentionPolicy.IMMEDIATE_DELETION,
            retention_days=0,
            deletion_type=DeletionType.COMPLETE,
            anonymization_method=None,
            verification_required=True,
            backup_retention_days=30,
            legal_hold_exceptions=[],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Learning data policy
        self.policies["learning_data_policy"] = DeletionPolicy(
            id="learning_data_policy",
            name="Learning Data Deletion Policy",
            description="Policy for learning progress and course data",
            category=DataCategory.LEARNING_DATA,
            retention_policy=RetentionPolicy.REGULATORY_RETENTION,
            retention_days=2555,  # 7 years for educational records
            deletion_type=DeletionType.ANONYMIZATION,
            anonymization_method="pseudonymization",
            verification_required=True,
            backup_retention_days=90,
            legal_hold_exceptions=["legal_dispute", "academic_integrity"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Submissions policy
        self.policies["submissions_policy"] = DeletionPolicy(
            id="submissions_policy",
            name="Submissions Deletion Policy",
            description="Policy for code submissions and assessments",
            category=DataCategory.SUBMISSIONS,
            retention_policy=RetentionPolicy.BUSINESS_RETENTION,
            retention_days=1095,  # 3 years for academic integrity
            deletion_type=DeletionType.ANONYMIZATION,
            anonymization_method="content_anonymization",
            verification_required=True,
            backup_retention_days=365,
            legal_hold_exceptions=["academic_integrity", "plagiarism_investigation"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Communications policy
        self.policies["communications_policy"] = DeletionPolicy(
            id="communications_policy",
            name="Communications Deletion Policy",
            description="Policy for email and message communications",
            category=DataCategory.COMMUNICATIONS,
            retention_policy=RetentionPolicy.REGULATORY_RETENTION,
            retention_days=1825,  # 5 years for communications
            deletion_type=DeletionType.COMPLETE,
            anonymization_method=None,
            verification_required=False,
            backup_retention_days=90,
            legal_hold_exceptions=[],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Activity logs policy
        self.policies["activity_logs_policy"] = DeletionPolicy(
            id="activity_logs_policy",
            name="Activity Logs Deletion Policy",
            description="Policy for user activity logs",
            category=DataCategory.ACTIVITY_LOGS,
            retention_policy=RetentionPolicy.REGULATORY_RETENTION,
            retention_days=2555,  # 7 years for audit trail
            deletion_type=DeletionType.ANONYMIZATION,
            anonymization_method="ip_anonymization",
            verification_required=False,
            backup_retention_days=365,
            legal_hold_exceptions=["security_investigation"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Analytics data policy
        self.policies["analytics_policy"] = DeletionPolicy(
            id="analytics_policy",
            name="Analytics Data Deletion Policy",
            description="Policy for analytics and usage data",
            category=DataCategory.ANALYTICS,
            retention_policy=RetentionPolicy.BUSINESS_RETENTION,
            retention_days=730,  # 2 years for analytics
            deletion_type=DeletionType.ANONYMIZATION,
            anonymization_method="statistical_anonymization",
            verification_required=False,
            backup_retention_days=30,
            legal_hold_exceptions=[],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Social data policy
        self.policies["social_data_policy"] = DeletionPolicy(
            id="social_data_policy",
            name="Social Data Deletion Policy",
            description="Policy for social connections and activity",
            category=DataCategory.SOCIAL_DATA,
            retention_policy=RetentionPolicy.IMMEDIATE_DELETION,
            retention_days=0,
            deletion_type=DeletionType.COMPLETE,
            anonymization_method=None,
            verification_required=False,
            backup_retention_days=30,
            legal_hold_exceptions=[],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Preferences policy
        self.policies["preferences_policy"] = DeletionPolicy(
            id="preferences_policy",
            name="Preferences Deletion Policy",
            description="Policy for user preferences and settings",
            category=DataCategory.PREFERENCES,
            retention_policy=RetentionPolicy.IMMEDIATE_DELETION,
            retention_days=0,
            deletion_type=DeletionType.COMPLETE,
            anonymization_method=None,
            verification_required=False,
            backup_retention_days=30,
            legal_hold_exceptions=[],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
    
    async def start(self):
        """Start the data deletion service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Load existing data
        await self._load_deletion_data()
        
        # Start background tasks
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        logger.info("Data deletion service started",
                   extra_fields={
                       "event_type": "data_deletion_service_started",
                       "active_policies": len([p for p in self.policies.values() if p.is_active]),
                       "max_concurrent_deletions": self.max_concurrent_deletions
                   })
    
    async def stop(self):
        """Stop the data deletion service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel all processing tasks
        for task_id, task in self.processing_tasks.items():
            if not task.done():
                task.cancel()
                # Update request status
                if task_id in self.requests:
                    self.requests[task_id].status = DeletionStatus.CANCELLED
        
        # Cancel cleanup task
        if self.cleanup_task:
            self.cleanup_task.cancel()
        
        # Save data
        await self._save_deletion_data()
        
        logger.info("Data deletion service stopped",
                   extra_fields={
                       "event_type": "data_deletion_service_stopped"
                   })
    
    async def _load_deletion_data(self):
        """Load deletion data from storage"""
        try:
            # In a real implementation, this would load from database
            # For now, use the initialized policies
            pass
        except Exception as e:
            logger.error(f"Error loading deletion data: {e}")
    
    async def _save_deletion_data(self):
        """Save deletion data to storage"""
        try:
            # In a real implementation, this would save to database
            pass
        except Exception as e:
            logger.error(f"Error saving deletion data: {e}")
    
    async def _cleanup_loop(self):
        """Background task for cleanup operations"""
        while self.is_running:
            try:
                await asyncio.sleep(86400)  # Run daily
                await self._cleanup_expired_verifications()
                await self._cleanup_completed_requests()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
    
    async def _cleanup_expired_verifications(self):
        """Clean up expired verification codes"""
        try:
            current_time = datetime.now(timezone.utc)
            expired_verifications = []
            
            for verification_id, verification in self.verifications.items():
                if current_time >= verification.expires_at:
                    expired_verifications.append(verification_id)
            
            for verification_id in expired_verifications:
                del self.verifications[verification_id]
            
            if expired_verifications:
                logger.info(f"Cleaned up {len(expired_verifications)} expired verifications")
        
        except Exception as e:
            logger.error(f"Error cleaning up expired verifications: {e}")
    
    async def _cleanup_completed_requests(self):
        """Clean up old completed requests"""
        try:
            cutoff_time = datetime.now(timezone.utc) - timedelta(days=self.default_retention_days)
            old_requests = []
            
            for request_id, request in self.requests.items():
                if (request.status in [DeletionStatus.COMPLETED, DeletionStatus.VERIFIED] and
                    request.completed_at and request.completed_at < cutoff_time):
                    old_requests.append(request_id)
            
            for request_id in old_requests:
                # Remove from user requests mapping
                if request_id in self.requests:
                    user_id = self.requests[request_id].user_id
                    if user_id in self.user_requests:
                        if request_id in self.user_requests[user_id]:
                            self.user_requests[user_id].remove(request_id)
                
                # Remove from requests and results
                del self.requests[request_id]
                
                # Remove related results
                related_results = [r_id for r_id, r in self.results.items() if r.request_id == request_id]
                for result_id in related_results:
                    del self.results[result_id]
            
            if old_requests:
                logger.info(f"Cleaned up {len(old_requests)} old deletion requests")
        
        except Exception as e:
            logger.error(f"Error cleaning up completed requests: {e}")
    
    def create_deletion_policy(self, name: str, description: str, category: DataCategory,
                            retention_policy: RetentionPolicy, retention_days: int = None,
                            deletion_type: DeletionType = DeletionType.COMPLETE,
                            anonymization_method: str = None, verification_required: bool = True,
                            backup_retention_days: int = 30, legal_hold_exceptions: List[str] = None) -> Dict[str, Any]:
        """Create a new deletion policy"""
        try:
            policy_id = f"policy_{int(time.time())}_{secrets.token_hex(8)}"
            
            policy = DeletionPolicy(
                id=policy_id,
                name=name,
                description=description,
                category=category,
                retention_policy=retention_policy,
                retention_days=retention_days,
                deletion_type=deletion_type,
                anonymization_method=anonymization_method,
                verification_required=verification_required,
                backup_retention_days=backup_retention_days,
                legal_hold_exceptions=legal_hold_exceptions or [],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                is_active=True
            )
            
            self.policies[policy_id] = policy
            
            logger.info(f"Deletion policy created: {policy_id}",
                       extra_fields={
                           "event_type": "deletion_policy_created",
                           "policy_id": policy_id,
                           "name": name,
                           "category": category.value
                       })
            
            return {
                "success": True,
                "policy_id": policy_id,
                "name": name,
                "category": category.value,
                "retention_policy": retention_policy.value
            }
        
        except Exception as e:
            logger.error(f"Error creating deletion policy: {e}")
            return {"success": False, "error": str(e)}
    
    def get_deletion_policies(self, category: DataCategory = None, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get deletion policies with filtering"""
        try:
            policies = list(self.policies.values())
            
            # Apply filters
            if category:
                policies = [p for p in policies if p.category == category]
            if active_only:
                policies = [p for p in policies if p.is_active]
            
            return [
                {
                    "id": policy.id,
                    "name": policy.name,
                    "description": policy.description,
                    "category": policy.category.value,
                    "retention_policy": policy.retention_policy.value,
                    "retention_days": policy.retention_days,
                    "deletion_type": policy.deletion_type.value,
                    "anonymization_method": policy.anonymization_method,
                    "verification_required": policy.verification_required,
                    "backup_retention_days": policy.backup_retention_days,
                    "legal_hold_exceptions": policy.legal_hold_exceptions,
                    "created_at": policy.created_at.isoformat(),
                    "updated_at": policy.updated_at.isoformat(),
                    "is_active": policy.is_active
                }
                for policy in policies
            ]
        
        except Exception as e:
            logger.error(f"Error getting deletion policies: {e}")
            return []
    
    async def create_deletion_request(self, user_id: str, request_type: str,
                                   categories: List[DataCategory], deletion_type: DeletionType,
                                   reason: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a new deletion request"""
        try:
            # Check for existing pending requests
            existing_requests = [r_id for r_id in self.user_requests.get(user_id, []) 
                               if self.requests[r_id].status in [DeletionStatus.PENDING, DeletionStatus.PROCESSING]]
            
            if existing_requests:
                return {"success": False, "error": "User already has a pending deletion request"}
            
            # Check concurrent deletion limit
            active_deletions = len([t for t in self.processing_tasks.values() if not t.done()])
            if active_deletions >= self.max_concurrent_deletions:
                return {"success": False, "error": "Maximum concurrent deletions reached"}
            
            # Generate verification code
            verification_code = secrets.token_hex(self.verification_code_length // 2)
            verification_expires_at = datetime.now(timezone.utc) + timedelta(hours=self.verification_expiry_hours)
            
            # Create request
            request_id = f"request_{int(time.time())}_{secrets.token_hex(8)}"
            
            request = DeletionRequest(
                id=request_id,
                user_id=user_id,
                request_type=request_type,
                categories=categories,
                deletion_type=deletion_type,
                reason=reason,
                status=DeletionStatus.PENDING,
                progress=0.0,
                total_records=0,
                processed_records=0,
                deleted_records=0,
                anonymized_records=0,
                failed_records=0,
                verification_code=verification_code,
                verification_expires_at=verification_expires_at,
                requested_at=datetime.now(timezone.utc),
                started_at=None,
                completed_at=None,
                verified_at=None,
                error_message=None,
                metadata=metadata or {}
            )
            
            self.requests[request_id] = request
            
            # Add to user requests mapping
            if user_id not in self.user_requests:
                self.user_requests[user_id] = []
            self.user_requests[user_id].append(request_id)
            
            # Create verification record
            verification = DeletionVerification(
                id=f"verification_{int(time.time())}_{secrets.token_hex(8)}",
                request_id=request_id,
                verification_code=verification_code,
                verification_method="email",
                verification_data={
                    "user_id": user_id,
                    "request_id": request_id,
                    "categories": [c.value for c in categories],
                    "deletion_type": deletion_type.value
                },
                verified_at=None,
                expires_at=verification_expires_at,
                is_verified=False,
                metadata={}
            )
            
            self.verifications[verification.id] = verification
            
            logger.info(f"Deletion request created: {request_id}",
                       extra_fields={
                           "event_type": "deletion_request_created",
                           "request_id": request_id,
                           "user_id": user_id,
                           "request_type": request_type,
                           "categories": [c.value for c in categories]
                       })
            
            return {
                "success": True,
                "request_id": request_id,
                "user_id": user_id,
                "request_type": request_type,
                "categories": [c.value for c in categories],
                "verification_code": verification_code,
                "verification_expires_at": verification_expires_at.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error creating deletion request: {e}")
            return {"success": False, "error": str(e)}
    
    async def verify_deletion_request(self, request_id: str, verification_code: str,
                                    method: str = "email") -> Dict[str, Any]:
        """Verify a deletion request"""
        try:
            request = self.requests.get(request_id)
            if not request:
                return {"success": False, "error": "Request not found"}
            
            if request.status != DeletionStatus.PENDING:
                return {"success": False, "error": "Request is not in pending status"}
            
            # Check verification code
            if not secrets.compare_digest(request.verification_code, verification_code):
                return {"success": False, "error": "Invalid verification code"}
            
            # Check expiration
            if datetime.now(timezone.utc) >= request.verification_expires_at:
                return {"success": False, "error": "Verification code expired"}
            
            # Update verification record
            verification = None
            for v in self.verifications.values():
                if v.request_id == request_id:
                    v.verified_at = datetime.now(timezone.utc)
                    v.is_verified = True
                    v.verification_method = method
                    verification = v
                    break
            
            logger.info(f"Deletion request verified: {request_id}",
                       extra_fields={
                           "event_type": "deletion_request_verified",
                           "request_id": request_id,
                           "user_id": request.user_id,
                           "verification_method": method
                       })
            
            return {
                "success": True,
                "request_id": request_id,
                "verified_at": verification.verified_at.isoformat() if verification else None
            }
        
        except Exception as e:
            logger.error(f"Error verifying deletion request: {e}")
            return {"success": False, "error": str(e)}
    
    async def start_deletion(self, request_id: str) -> Dict[str, Any]:
        """Start processing a deletion request"""
        try:
            request = self.requests.get(request_id)
            if not request:
                return {"success": False, "error": "Request not found"}
            
            if request.status != DeletionStatus.PENDING:
                return {"success": False, "error": "Request is not in pending status"}
            
            # Check if verification is required and completed
            verification_required = False
            for category in request.categories:
                policy = self._get_policy_for_category(category)
                if policy and policy.verification_required:
                    verification_required = True
                    break
            
            if verification_required:
                is_verified = any(v.request_id == request_id and v.is_verified for v in self.verifications.values())
                if not is_verified:
                    return {"success": False, "error": "Request verification required"}
            
            # Update request status
            request.status = DeletionStatus.PROCESSING
            request.started_at = datetime.now(timezone.utc)
            
            # Start processing task
            processing_task = asyncio.create_task(self._process_deletion_request(request_id))
            self.processing_tasks[request_id] = processing_task
            
            logger.info(f"Deletion processing started: {request_id}",
                       extra_fields={
                           "event_type": "deletion_processing_started",
                           "request_id": request_id
                       })
            
            return {
                "success": True,
                "request_id": request_id,
                "status": request.status.value,
                "started_at": request.started_at.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error starting deletion: {e}")
            return {"success": False, "error": str(e)}
    
    async def _process_deletion_request(self, request_id: str):
        """Process a deletion request"""
        try:
            request = self.requests.get(request_id)
            if not request:
                return
            
            # Process each category
            total_records = 0
            
            for category in request.categories:
                # Get policy for category
                policy = self._get_policy_for_category(category)
                if not policy:
                    continue
                
                # Get records to process
                category_records = await self._get_category_records(request.user_id, category)
                total_records += len(category_records)
                request.total_records = total_records
                
                # Process records based on policy
                category_result = await self._process_category_deletion(
                    request.user_id, category, category_records, policy, request
                )
                
                # Create result record
                result = DeletionResult(
                    id=f"result_{int(time.time())}_{secrets.token_hex(8)}",
                    request_id=request_id,
                    category=category,
                    records_count=len(category_records),
                    deleted_count=category_result["deleted_count"],
                    anonymized_count=category_result["anonymized_count"],
                    failed_count=category_result["failed_count"],
                    details=category_result["details"],
                    created_at=datetime.now(timezone.utc)
                )
                self.results[result.id] = result
                
                # Update request counters
                request.deleted_records += category_result["deleted_count"]
                request.anonymized_records += category_result["anonymized_count"]
                request.failed_records += category_result["failed_count"]
                request.processed_records += len(category_records)
                request.progress = (request.processed_records / request.total_records) * 100
                
                # Small delay to prevent overwhelming the system
                await asyncio.sleep(0.1)
            
            # Update request status
            request.status = DeletionStatus.COMPLETED
            request.completed_at = datetime.now(timezone.utc)
            request.progress = 100.0
            
            logger.info(f"Deletion processing completed: {request_id}",
                       extra_fields={
                           "event_type": "deletion_processing_completed",
                           "request_id": request_id,
                           "total_records": request.total_records,
                           "deleted_records": request.deleted_records,
                           "anonymized_records": request.anonymized_records
                       })
        
        except Exception as e:
            # Mark request as failed
            if request_id in self.requests:
                self.requests[request_id].status = DeletionStatus.FAILED
                self.requests[request_id].error_message = str(e)
            
            logger.error(f"Error processing deletion request {request_id}: {e}")
        
        finally:
            # Clean up processing task
            if request_id in self.processing_tasks:
                del self.processing_tasks[request_id]
    
    def _get_policy_for_category(self, category: DataCategory) -> Optional[DeletionPolicy]:
        """Get deletion policy for a category"""
        try:
            for policy in self.policies.values():
                if policy.category == category and policy.is_active:
                    return policy
            return None
        except Exception as e:
            logger.error(f"Error getting policy for category {category.value}: {e}")
            return None
    
    async def _get_category_records(self, user_id: str, category: DataCategory) -> List[Dict[str, Any]]:
        """Get records for a specific category"""
        try:
            # In a real implementation, this would query the database
            # For now, return mock data based on category
            
            if category == DataCategory.PROFILE:
                return [
                    {
                        "id": user_id,
                        "username": "user123",
                        "email": "user@example.com",
                        "first_name": "John",
                        "last_name": "Doe",
                        "date_of_birth": "1990-01-15",
                        "country": "US",
                        "created_at": "2023-01-01T00:00:00Z",
                        "updated_at": "2024-03-15T10:30:00Z"
                    }
                ]
            
            elif category == DataCategory.LEARNING_DATA:
                return [
                    {
                        "id": "learning_001",
                        "user_id": user_id,
                        "course_id": "python_basics",
                        "enrollment_date": "2023-02-01T00:00:00Z",
                        "progress": 85.5,
                        "completion_date": None,
                        "grade": "A-",
                        "time_spent": 3600
                    },
                    {
                        "id": "learning_002",
                        "user_id": user_id,
                        "course_id": "advanced_javascript",
                        "enrollment_date": "2023-03-15T00:00:00Z",
                        "progress": 45.0,
                        "completion_date": None,
                        "grade": None,
                        "time_spent": 1800
                    }
                ]
            
            elif category == DataCategory.SUBMISSIONS:
                return [
                    {
                        "id": "sub_001",
                        "user_id": user_id,
                        "course_id": "python_basics",
                        "lesson_id": "lesson_001",
                        "problem_id": "prob_001",
                        "code": "print('Hello, World!')",
                        "language": "python",
                        "submitted_at": "2023-02-02T10:30:00Z",
                        "score": 100,
                        "feedback": "Great job!"
                    }
                ]
            
            elif category == DataCategory.COMMUNICATIONS:
                return [
                    {
                        "id": "comm_001",
                        "user_id": user_id,
                        "type": "email",
                        "subject": "Welcome to PyMastery",
                        "content": "Thank you for joining PyMastery...",
                        "sent_at": "2023-01-01T12:00:00Z",
                        "status": "delivered"
                    }
                ]
            
            elif category == DataCategory.ACTIVITY_LOGS:
                return [
                    {
                        "id": "log_001",
                        "user_id": user_id,
                        "action": "login",
                        "resource_type": "system",
                        "resource_id": None,
                        "timestamp": "2024-03-15T09:00:00Z",
                        "ip_address": "192.168.1.1"
                    },
                    {
                        "id": "log_002",
                        "user_id": user_id,
                        "action": "course_access",
                        "resource_type": "course",
                        "resource_id": "python_basics",
                        "timestamp": "2024-03-15T09:30:00Z",
                        "ip_address": "192.168.1.1"
                    }
                ]
            
            elif category == DataCategory.ANALYTICS:
                return [
                    {
                        "id": "analytics_001",
                        "user_id": user_id,
                        "login_count": 150,
                        "last_login": "2024-03-15T09:00:00Z",
                        "time_spent": 7200,
                        "courses_completed": 1,
                        "courses_in_progress": 1,
                        "average_score": 92.5
                    }
                ]
            
            elif category == DataCategory.SOCIAL_DATA:
                return [
                    {
                        "id": "social_001",
                        "user_id": user_id,
                        "shares": 5,
                        "followers": 12,
                        "connections": 8,
                        "activity": {
                            "posts": 3,
                            "comments": 15,
                            "likes": 25
                        }
                    }
                ]
            
            elif category == DataCategory.PREFERENCES:
                return [
                    {
                        "id": "pref_001",
                        "user_id": user_id,
                        "theme": "dark",
                        "language": "en",
                        "timezone": "UTC",
                        "notifications": True,
                        "email_preferences": {
                            "marketing": True,
                            "course_updates": True,
                            "newsletter": False
                        },
                        "privacy_settings": {
                            "profile_visibility": "public",
                            "activity_visibility": "friends"
                        }
                    }
                ]
            
            else:
                return []
        
        except Exception as e:
            logger.error(f"Error getting category records for {category.value}: {e}")
            return []
    
    async def _process_category_deletion(self, user_id: str, category: DataCategory,
                                       records: List[Dict[str, Any]], policy: DeletionPolicy,
                                       request: DeletionRequest) -> Dict[str, Any]:
        """Process deletion for a specific category"""
        try:
            deleted_count = 0
            anonymized_count = 0
            failed_count = 0
            details = {
                "policy_id": policy.id,
                "deletion_type": policy.deletion_type.value,
                "anonymization_method": policy.anonymization_method,
                "processed_records": []
            }
            
            for record in records:
                try:
                    # Check legal hold exceptions
                    if policy.legal_hold_exceptions:
                        # In a real implementation, check if user is under legal hold
                        pass
                    
                    # Process based on deletion type
                    if policy.deletion_type == DeletionType.COMPLETE:
                        success = await self._delete_record(record, category)
                        if success:
                            deleted_count += 1
                            details["processed_records"].append({
                                "record_id": record.get("id"),
                                "action": "deleted",
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            })
                        else:
                            failed_count += 1
                    
                    elif policy.deletion_type == DeletionType.ANONYMIZATION:
                        success = await self._anonymize_record(record, category, policy.anonymization_method)
                        if success:
                            anonymized_count += 1
                            details["processed_records"].append({
                                "record_id": record.get("id"),
                                "action": "anonymized",
                                "method": policy.anonymization_method,
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            })
                        else:
                            failed_count += 1
                    
                    elif policy.deletion_type == DeletionType.PARTIAL:
                        success = await self._partial_delete_record(record, category)
                        if success:
                            deleted_count += 1
                            details["processed_records"].append({
                                "record_id": record.get("id"),
                                "action": "partially_deleted",
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            })
                        else:
                            failed_count += 1
                
                except Exception as e:
                    logger.error(f"Error processing record {record.get('id')}: {e}")
                    failed_count += 1
            
            return {
                "deleted_count": deleted_count,
                "anonymized_count": anonymized_count,
                "failed_count": failed_count,
                "details": details
            }
        
        except Exception as e:
            logger.error(f"Error processing category deletion for {category.value}: {e}")
            return {
                "deleted_count": 0,
                "anonymized_count": 0,
                "failed_count": len(records),
                "details": {"error": str(e)}
            }
    
    async def _delete_record(self, record: Dict[str, Any], category: DataCategory) -> bool:
        """Delete a record completely"""
        try:
            # In a real implementation, this would delete from database
            # For now, simulate deletion
            record_id = record.get("id")
            
            logger.info(f"Record deleted: {record_id} from {category.value}",
                       extra_fields={
                           "event_type": "record_deleted",
                           "record_id": record_id,
                           "category": category.value
                       })
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting record {record.get('id')}: {e}")
            return False
    
    async def _anonymize_record(self, record: Dict[str, Any], category: DataCategory,
                              method: str) -> bool:
        """Anonymize a record"""
        try:
            # In a real implementation, this would anonymize in database
            # For now, simulate anonymization
            record_id = record.get("id")
            
            logger.info(f"Record anonymized: {record_id} from {category.value} using {method}",
                       extra_fields={
                           "event_type": "record_anonymized",
                           "record_id": record_id,
                           "category": category.value,
                           "method": method
                       })
            
            return True
        
        except Exception as e:
            logger.error(f"Error anonymizing record {record.get('id')}: {e}")
            return False
    
    async def _partial_delete_record(self, record: Dict[str, Any], category: DataCategory) -> bool:
        """Partially delete a record"""
        try:
            # In a real implementation, this would partially delete from database
            # For now, simulate partial deletion
            record_id = record.get("id")
            
            logger.info(f"Record partially deleted: {record_id} from {category.value}",
                       extra_fields={
                           "event_type": "record_partially_deleted",
                           "record_id": record_id,
                           "category": category.value
                       })
            
            return True
        
        except Exception as e:
            logger.error(f"Error partially deleting record {record.get('id')}: {e}")
            return False
    
    def get_deletion_requests(self, user_id: str = None, status: DeletionStatus = None) -> List[Dict[str, Any]]:
        """Get deletion requests with filtering"""
        try:
            requests = list(self.requests.values())
            
            # Apply filters
            if user_id:
                requests = [r for r in requests if r.user_id == user_id]
            if status:
                requests = [r for r in requests if r.status == status]
            
            # Sort by request date (newest first)
            requests.sort(key=lambda x: x.requested_at, reverse=True)
            
            return [
                {
                    "id": request.id,
                    "user_id": request.user_id,
                    "request_type": request.request_type,
                    "categories": [c.value for c in request.categories],
                    "deletion_type": request.deletion_type.value,
                    "reason": request.reason,
                    "status": request.status.value,
                    "progress": request.progress,
                    "total_records": request.total_records,
                    "processed_records": request.processed_records,
                    "deleted_records": request.deleted_records,
                    "anonymized_records": request.anonymized_records,
                    "failed_records": request.failed_records,
                    "verification_expires_at": request.verification_expires_at.isoformat(),
                    "requested_at": request.requested_at.isoformat(),
                    "started_at": request.started_at.isoformat() if request.started_at else None,
                    "completed_at": request.completed_at.isoformat() if request.completed_at else None,
                    "verified_at": request.verified_at.isoformat() if request.verified_at else None,
                    "error_message": request.error_message
                }
                for request in requests
            ]
        
        except Exception as e:
            logger.error(f"Error getting deletion requests: {e}")
            return []
    
    def get_deletion_request_status(self, request_id: str) -> Dict[str, Any]:
        """Get status of a specific deletion request"""
        try:
            request = self.requests.get(request_id)
            if not request:
                return {"success": False, "error": "Request not found"}
            
            return {
                "success": True,
                "request_id": request_id,
                "status": request.status.value,
                "progress": request.progress,
                "total_records": request.total_records,
                "processed_records": request.processed_records,
                "deleted_records": request.deleted_records,
                "anonymized_records": request.anonymized_records,
                "failed_records": request.failed_records,
                "verification_expires_at": request.verification_expires_at.isoformat(),
                "requested_at": request.requested_at.isoformat(),
                "started_at": request.started_at.isoformat() if request.started_at else None,
                "completed_at": request.completed_at.isoformat() if request.completed_at else None,
                "verified_at": request.verified_at.isoformat() if request.verified_at else None,
                "error_message": request.error_message
            }
        
        except Exception as e:
            logger.error(f"Error getting deletion request status: {e}")
            return {"success": False, "error": str(e)}
    
    def get_deletion_results(self, request_id: str) -> List[Dict[str, Any]]:
        """Get deletion results for a request"""
        try:
            results = [r for r in self.results.values() if r.request_id == request_id]
            
            # Sort by creation time (newest first)
            results.sort(key=lambda x: x.created_at, reverse=True)
            
            return [
                {
                    "id": result.id,
                    "request_id": result.request_id,
                    "category": result.category.value,
                    "records_count": result.records_count,
                    "deleted_count": result.deleted_count,
                    "anonymized_count": result.anonymized_count,
                    "failed_count": result.failed_count,
                    "details": result.details,
                    "created_at": result.created_at.isoformat()
                }
                for result in results
            ]
        
        except Exception as e:
            logger.error(f"Error getting deletion results: {e}")
            return []
    
    def cancel_deletion_request(self, request_id: str) -> Dict[str, Any]:
        """Cancel a deletion request"""
        try:
            request = self.requests.get(request_id)
            if not request:
                return {"success": False, "error": "Request not found"}
            
            if request.status not in [DeletionStatus.PENDING, DeletionStatus.PROCESSING]:
                return {"success": False, "error": "Request cannot be cancelled"}
            
            # Cancel processing task if running
            if request_id in self.processing_tasks:
                self.processing_tasks[request_id].cancel()
                del self.processing_tasks[request_id]
            
            # Update request status
            request.status = DeletionStatus.CANCELLED
            
            logger.info(f"Deletion request cancelled: {request_id}",
                       extra_fields={
                           "event_type": "deletion_request_cancelled",
                           "request_id": request_id
                       })
            
            return {"success": True, "message": "Deletion request cancelled successfully"}
        
        except Exception as e:
            logger.error(f"Error cancelling deletion request: {e}")
            return {"success": False, "error": str(e)}
    
    def get_deletion_statistics(self) -> Dict[str, Any]:
        """Get deletion statistics"""
        try:
            # Calculate overall statistics
            total_requests = len(self.requests)
            pending_requests = len([r for r in self.requests.values() if r.status == DeletionStatus.PENDING])
            processing_requests = len([r for r in self.requests.values() if r.status == DeletionStatus.PROCESSING])
            completed_requests = len([r for r in self.requests.values() if r.status == DeletionStatus.COMPLETED])
            verified_requests = len([r for r in self.requests.values() if r.status == DeletionStatus.VERIFIED])
            failed_requests = len([r for r in self.requests.values() if r.status == DeletionStatus.FAILED])
            
            # Statistics by request type
            requests_by_type = defaultdict(int)
            for request in self.requests.values():
                requests_by_type[request.request_type] += 1
            
            # Statistics by category
            category_counts = defaultdict(int)
            for request in self.requests.values():
                for category in request.categories:
                    category_counts[category.value] += 1
            
            # Statistics by deletion type
            requests_by_deletion_type = defaultdict(int)
            for request in self.requests.values():
                requests_by_deletion_type[request.deletion_type.value] += 1
            
            # Record processing statistics
            total_records = sum(r.total_records for r in self.requests.values())
            total_deleted = sum(r.deleted_records for r in self.requests.values())
            total_anonymized = sum(r.anonymized_records for r in self.requests.values())
            total_failed = sum(r.failed_records for r in self.requests.values())
            
            # Recent activity (last 30 days)
            cutoff_time = datetime.now(timezone.utc) - timedelta(days=30)
            recent_requests = len([r for r in self.requests.values() if r.requested_at > cutoff_time])
            recent_completions = len([r for r in self.requests.values() 
                                    if r.completed_at and r.completed_at > cutoff_time])
            
            return {
                "overall_statistics": {
                    "total_requests": total_requests,
                    "pending_requests": pending_requests,
                    "processing_requests": processing_requests,
                    "completed_requests": completed_requests,
                    "verified_requests": verified_requests,
                    "failed_requests": failed_requests,
                    "success_rate": (completed_requests / total_requests) * 100 if total_requests > 0 else 0
                },
                "by_request_type": dict(requests_by_type),
                "by_category": dict(category_counts),
                "by_deletion_type": dict(requests_by_deletion_type),
                "record_statistics": {
                    "total_records": total_records,
                    "total_deleted": total_deleted,
                    "total_anonymized": total_anonymized,
                    "total_failed": total_failed,
                    "deletion_rate": (total_deleted / total_records) * 100 if total_records > 0 else 0,
                    "anonymization_rate": (total_anonymized / total_records) * 100 if total_records > 0 else 0
                },
                "recent_activity": {
                    "total_recent": recent_requests,
                    "recent_completions": recent_completions,
                    "period_days": 30
                },
                "policy_statistics": {
                    "total_policies": len(self.policies),
                    "active_policies": len([p for p in self.policies.values() if p.is_active]),
                    "policies_by_category": {
                        category.value: len([p for p in self.policies.values() if p.category == category])
                        for category in DataCategory
                    }
                },
                "verification_statistics": {
                    "total_verifications": len(self.verifications),
                    "verified_count": len([v for v in self.verifications.values() if v.is_verified]),
                    "expired_count": len([v for v in self.verifications.values() 
                                        if not v.is_verified and datetime.now(timezone.utc) >= v.expires_at])
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error getting deletion statistics: {e}")
            return {"error": str(e)}
    
    def get_data_deletion_service_status(self) -> Dict[str, Any]:
        """Get data deletion service status"""
        try:
            return {
                "service_status": {
                    "is_running": self.is_running,
                    "start_time": self.start_time.isoformat() if self.start_time else None,
                    "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
                },
                "configuration": {
                    "max_concurrent_deletions": self.max_concurrent_deletions,
                    "default_retention_days": self.default_retention_days,
                    "verification_code_length": self.verification_code_length,
                    "verification_expiry_hours": self.verification_expiry_hours,
                    "batch_size": self.batch_size
                },
                "statistics": self.get_deletion_statistics(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get data deletion service status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global data deletion service instance
data_deletion_service: Optional[DataDeletionService] = None

def get_data_deletion_service(config: Dict[str, Any] = None) -> DataDeletionService:
    """Get or create data deletion service instance"""
    global data_deletion_service
    if data_deletion_service is None:
        data_deletion_service = DataDeletionService(config)
    return data_deletion_service

async def start_data_deletion_service(config: Dict[str, Any] = None) -> DataDeletionService:
    """Start data deletion service"""
    service = get_data_deletion_service(config)
    await service.start()
    return service

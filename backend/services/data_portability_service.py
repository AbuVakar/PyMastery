"""
Data Portability Service for PyMastery
Provides comprehensive GDPR-compliant data export and portability features
"""

import logging
import json
import time
import secrets
import zipfile
import io
import csv
import gzip
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
from collections import defaultdict
import uuid
import pandas as pd
import xml.etree.ElementTree as ET
from pathlib import Path
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class ExportFormat(Enum):
    """Data export formats"""
    JSON = "json"
    CSV = "csv"
    XML = "xml"
    PDF = "pdf"
    EXCEL = "excel"
    HTML = "html"

class ExportStatus(Enum):
    """Export request status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class DataCategory(Enum):
    """Data categories for export"""
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

@dataclass
class ExportTemplate:
    """Export template configuration"""
    id: str
    name: str
    description: str
    format: ExportFormat
    categories: List[DataCategory]
    fields: Dict[str, List[str]]  # category -> [fields]
    filters: Dict[str, Any]
    retention_days: int
    max_file_size_mb: int
    compression: bool
    encryption: bool
    created_at: datetime
    updated_at: datetime
    is_active: bool

@dataclass
class ExportRequest:
    """Export request record"""
    id: str
    user_id: str
    template_id: str
    format: ExportFormat
    categories: List[DataCategory]
    filters: Dict[str, Any]
    status: ExportStatus
    progress: float
    total_records: int
    processed_records: int
    file_path: Optional[str]
    file_size: Optional[int]
    download_url: Optional[str]
    expires_at: datetime
    requested_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]
    metadata: Dict[str, Any]

@dataclass
class ExportResult:
    """Export result record"""
    id: str
    request_id: str
    category: DataCategory
    records_count: int
    data: List[Dict[str, Any]]
    file_path: Optional[str]
    created_at: datetime

class DataPortabilityService:
    """Data portability service"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Service state
        self.is_running = False
        self.start_time = None
        
        # Export templates
        self.templates: Dict[str, ExportTemplate] = {}
        
        # Export requests
        self.requests: Dict[str, ExportRequest] = {}
        self.user_requests: Dict[str, List[str]] = {}  # user_id -> [request_ids]
        
        # Export results
        self.results: Dict[str, ExportResult] = {}
        
        # Background tasks
        self.processing_tasks: Dict[str, asyncio.Task] = {}
        self.cleanup_task: Optional[asyncio.Task] = None
        
        # Configuration
        self.max_concurrent_exports = self.config.get("max_concurrent_exports", 3)
        self.default_retention_days = self.config.get("default_retention_days", 7)
        self.max_file_size_mb = self.config.get("max_file_size_mb", 100)
        self.batch_size = self.config.get("batch_size", 1000)
        
        # Storage configuration
        self.storage_path = Path(self.config.get("storage_path", "data_exports"))
        self.storage_path.mkdir(exist_ok=True)
        
        # Initialize default templates
        self._initialize_default_templates()
    
    def _initialize_default_templates(self):
        """Initialize default export templates"""
        # Complete export template
        self.templates["complete_export"] = ExportTemplate(
            id="complete_export",
            name="Complete Data Export",
            description="Export all user data in machine-readable format",
            format=ExportFormat.JSON,
            categories=list(DataCategory),
            fields={
                "profile": ["id", "username", "email", "name", "created_at", "updated_at"],
                "learning_data": ["course_id", "enrollment_date", "progress", "completion_date", "grade"],
                "course_data": ["id", "title", "description", "difficulty", "duration"],
                "submissions": ["id", "problem_id", "code", "language", "submitted_at", "score"],
                "certificates": ["id", "course_id", "issue_date", "certificate_url", "verification_code"],
                "payments": ["id", "amount", "currency", "payment_date", "payment_method", "status"],
                "communications": ["id", "type", "subject", "content", "sent_at", "status"],
                "activity_logs": ["id", "action", "resource_type", "resource_id", "timestamp", "ip_address"],
                "preferences": ["theme", "language", "notifications", "privacy_settings"],
                "analytics": ["login_count", "last_login", "time_spent", "courses_completed"],
                "social_data": ["shares", "followers", "connections", "activity"],
                "consents": ["consent_type", "status", "granted_at", "withdrawn_at"],
                "audit_trail": ["action", "timestamp", "user_agent", "ip_address"]
            },
            filters={},
            retention_days=7,
            max_file_size_mb=100,
            compression=True,
            encryption=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Learning data export template
        self.templates["learning_data_export"] = ExportTemplate(
            id="learning_data_export",
            name="Learning Data Export",
            description="Export learning progress and course data",
            format=ExportFormat.CSV,
            categories=[DataCategory.LEARNING_DATA, DataCategory.COURSE_DATA, DataCategory.SUBMISSIONS, DataCategory.CERTIFICATES],
            fields={
                "learning_data": ["user_id", "course_id", "enrollment_date", "progress", "completion_date", "grade", "time_spent"],
                "course_data": ["id", "title", "category", "difficulty", "duration", "instructor"],
                "submissions": ["id", "course_id", "lesson_id", "problem_id", "code", "language", "submitted_at", "score", "feedback"],
                "certificates": ["id", "course_id", "issue_date", "certificate_url", "verification_code", "grade"]
            },
            filters={},
            retention_days=7,
            max_file_size_mb=50,
            compression=True,
            encryption=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Profile data export template
        self.templates["profile_export"] = ExportTemplate(
            id="profile_export",
            name="Profile Data Export",
            description="Export user profile and preferences",
            format=ExportFormat.JSON,
            categories=[DataCategory.PROFILE, DataCategory.PREFERENCES, DataCategory.CONSENTS],
            fields={
                "profile": ["id", "username", "email", "first_name", "last_name", "date_of_birth", "country", "created_at", "updated_at"],
                "preferences": ["theme", "language", "timezone", "notifications", "email_preferences", "privacy_settings"],
                "consents": ["consent_type", "status", "granted_at", "withdrawn_at", "method", "template_id"]
            },
            filters={},
            retention_days=7,
            max_file_size_mb=10,
            compression=False,
            encryption=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            is_active=True
        )
    
    async def start(self):
        """Start the data portability service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Load existing data
        await self._load_export_data()
        
        # Start background tasks
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        logger.info("Data portability service started",
                   extra_fields={
                       "event_type": "data_portability_service_started",
                       "active_templates": len([t for t in self.templates.values() if t.is_active]),
                       "max_concurrent_exports": self.max_concurrent_exports
                   })
    
    async def stop(self):
        """Stop the data portability service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel all processing tasks
        for task_id, task in self.processing_tasks.items():
            if not task.done():
                task.cancel()
                # Update request status
                if task_id in self.requests:
                    self.requests[task_id].status = ExportStatus.CANCELLED
        
        # Cancel cleanup task
        if self.cleanup_task:
            self.cleanup_task.cancel()
        
        # Save data
        await self._save_export_data()
        
        logger.info("Data portability service stopped",
                   extra_fields={
                       "event_type": "data_portability_service_stopped"
                   })
    
    async def _load_export_data(self):
        """Load export data from storage"""
        try:
            # In a real implementation, this would load from database
            # For now, use the initialized templates
            pass
        except Exception as e:
            logger.error(f"Error loading export data: {e}")
    
    async def _save_export_data(self):
        """Save export data to storage"""
        try:
            # In a real implementation, this would save to database
            pass
        except Exception as e:
            logger.error(f"Error saving export data: {e}")
    
    async def _cleanup_loop(self):
        """Background task for cleanup operations"""
        while self.is_running:
            try:
                await asyncio.sleep(86400)  # Run daily
                await self._cleanup_expired_exports()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
    
    async def _cleanup_expired_exports(self):
        """Clean up expired export requests and files"""
        try:
            current_time = datetime.now(timezone.utc)
            expired_requests = []
            
            # Find expired requests
            for request_id, request in self.requests.items():
                if current_time >= request.expires_at:
                    expired_requests.append(request_id)
            
            # Clean up expired requests and files
            for request_id in expired_requests:
                request = self.requests[request_id]
                
                # Remove file if exists
                if request.file_path and Path(request.file_path).exists():
                    Path(request.file_path).unlink()
                
                # Remove from user requests mapping
                if request.user_id in self.user_requests:
                    if request_id in self.user_requests[request.user_id]:
                        self.user_requests[request.user_id].remove(request_id)
                
                # Remove from requests and results
                del self.requests[request_id]
                
                # Remove related results
                related_results = [r_id for r_id, r in self.results.items() if r.request_id == request_id]
                for result_id in related_results:
                    del self.results[result_id]
            
            if expired_requests:
                logger.info(f"Cleaned up {len(expired_requests)} expired export requests")
        
        except Exception as e:
            logger.error(f"Error cleaning up expired exports: {e}")
    
    def create_export_template(self, name: str, description: str, format: ExportFormat,
                             categories: List[DataCategory], fields: Dict[str, List[str]],
                             filters: Dict[str, Any] = None, retention_days: int = 7,
                             max_file_size_mb: int = 100, compression: bool = True,
                             encryption: bool = True) -> Dict[str, Any]:
        """Create a new export template"""
        try:
            template_id = f"template_{int(time.time())}_{secrets.token_hex(8)}"
            
            template = ExportTemplate(
                id=template_id,
                name=name,
                description=description,
                format=format,
                categories=categories,
                fields=fields,
                filters=filters or {},
                retention_days=retention_days,
                max_file_size_mb=max_file_size_mb,
                compression=compression,
                encryption=encryption,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                is_active=True
            )
            
            self.templates[template_id] = template
            
            logger.info(f"Export template created: {template_id}",
                       extra_fields={
                           "event_type": "export_template_created",
                           "template_id": template_id,
                           "name": name,
                           "format": format.value
                       })
            
            return {
                "success": True,
                "template_id": template_id,
                "name": name,
                "format": format.value,
                "categories": [c.value for c in categories]
            }
        
        except Exception as e:
            logger.error(f"Error creating export template: {e}")
            return {"success": False, "error": str(e)}
    
    def get_export_templates(self, format: ExportFormat = None, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get export templates with filtering"""
        try:
            templates = list(self.templates.values())
            
            # Apply filters
            if format:
                templates = [t for t in templates if t.format == format]
            if active_only:
                templates = [t for t in templates if t.is_active]
            
            return [
                {
                    "id": template.id,
                    "name": template.name,
                    "description": template.description,
                    "format": template.format.value,
                    "categories": [c.value for c in template.categories],
                    "fields": template.fields,
                    "filters": template.filters,
                    "retention_days": template.retention_days,
                    "max_file_size_mb": template.max_file_size_mb,
                    "compression": template.compression,
                    "encryption": template.encryption,
                    "created_at": template.created_at.isoformat(),
                    "updated_at": template.updated_at.isoformat(),
                    "is_active": template.is_active
                }
                for template in templates
            ]
        
        except Exception as e:
            logger.error(f"Error getting export templates: {e}")
            return []
    
    async def create_export_request(self, user_id: str, template_id: str,
                                 categories: List[DataCategory] = None,
                                 filters: Dict[str, Any] = None,
                                 format: ExportFormat = None) -> Dict[str, Any]:
        """Create a new export request"""
        try:
            # Get template
            template = self.templates.get(template_id)
            if not template or not template.is_active:
                return {"success": False, "error": "Template not found or inactive"}
            
            # Use template categories if not provided
            if not categories:
                categories = template.categories
            
            # Use template format if not provided
            if not format:
                format = template.format
            
            # Check concurrent export limit
            active_exports = len([t for t in self.processing_tasks.values() if not t.done()])
            if active_exports >= self.max_concurrent_exports:
                return {"success": False, "error": "Maximum concurrent exports reached"}
            
            # Create request
            request_id = f"request_{int(time.time())}_{secrets.token_hex(8)}"
            expires_at = datetime.now(timezone.utc) + timedelta(days=template.retention_days)
            
            request = ExportRequest(
                id=request_id,
                user_id=user_id,
                template_id=template_id,
                format=format,
                categories=categories,
                filters=filters or {},
                status=ExportStatus.PENDING,
                progress=0.0,
                total_records=0,
                processed_records=0,
                file_path=None,
                file_size=None,
                download_url=None,
                expires_at=expires_at,
                requested_at=datetime.now(timezone.utc),
                started_at=None,
                completed_at=None,
                error_message=None,
                metadata={}
            )
            
            self.requests[request_id] = request
            
            # Add to user requests mapping
            if user_id not in self.user_requests:
                self.user_requests[user_id] = []
            self.user_requests[user_id].append(request_id)
            
            logger.info(f"Export request created: {request_id}",
                       extra_fields={
                           "event_type": "export_request_created",
                           "request_id": request_id,
                           "user_id": user_id,
                           "template_id": template_id,
                           "format": format.value
                       })
            
            return {
                "success": True,
                "request_id": request_id,
                "user_id": user_id,
                "template_id": template_id,
                "format": format.value,
                "categories": [c.value for c in categories],
                "expires_at": expires_at.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error creating export request: {e}")
            return {"success": False, "error": str(e)}
    
    async def start_export(self, request_id: str) -> Dict[str, Any]:
        """Start processing an export request"""
        try:
            request = self.requests.get(request_id)
            if not request:
                return {"success": False, "error": "Request not found"}
            
            if request.status != ExportStatus.PENDING:
                return {"success": False, "error": "Request is not in pending status"}
            
            # Update request status
            request.status = ExportStatus.PROCESSING
            request.started_at = datetime.now(timezone.utc)
            
            # Start processing task
            processing_task = asyncio.create_task(self._process_export_request(request_id))
            self.processing_tasks[request_id] = processing_task
            
            logger.info(f"Export processing started: {request_id}",
                       extra_fields={
                           "event_type": "export_processing_started",
                           "request_id": request_id
                       })
            
            return {
                "success": True,
                "request_id": request_id,
                "status": request.status.value,
                "started_at": request.started_at.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error starting export: {e}")
            return {"success": False, "error": str(e)}
    
    async def _process_export_request(self, request_id: str):
        """Process an export request"""
        try:
            request = self.requests.get(request_id)
            if not request:
                return
            
            # Get template
            template = self.templates.get(request.template_id)
            if not template:
                request.status = ExportStatus.FAILED
                request.error_message = "Template not found"
                return
            
            # Generate file path
            file_name = f"export_{request.user_id}_{request_id}_{int(time.time())}"
            if request.format == ExportFormat.JSON:
                file_name += ".json"
            elif request.format == ExportFormat.CSV:
                file_name += ".zip"  # CSV files are zipped
            elif request.format == ExportFormat.XML:
                file_name += ".xml"
            elif request.format == ExportFormat.EXCEL:
                file_name += ".xlsx"
            elif request.format == ExportFormat.HTML:
                file_name += ".html"
            else:
                file_name += ".dat"
            
            request.file_path = str(self.storage_path / file_name)
            
            # Collect data for each category
            all_data = {}
            total_records = 0
            
            for category in request.categories:
                category_data = await self._get_category_data(
                    request.user_id,
                    category,
                    template.fields.get(category.value, []),
                    request.filters
                )
                
                if category_data:
                    all_data[category.value] = category_data
                    total_records += len(category_data)
                    
                    # Create result record
                    result = ExportResult(
                        id=f"result_{int(time.time())}_{secrets.token_hex(8)}",
                        request_id=request_id,
                        category=category,
                        records_count=len(category_data),
                        data=category_data,
                        file_path=None,
                        created_at=datetime.now(timezone.utc)
                    )
                    self.results[result.id] = result
            
            request.total_records = total_records
            
            # Export data based on format
            if request.format == ExportFormat.JSON:
                await self._export_json(request, all_data, template)
            elif request.format == ExportFormat.CSV:
                await self._export_csv(request, all_data, template)
            elif request.format == ExportFormat.XML:
                await self._export_xml(request, all_data, template)
            elif request.format == ExportFormat.EXCEL:
                await self._export_excel(request, all_data, template)
            elif request.format == ExportFormat.HTML:
                await self._export_html(request, all_data, template)
            else:
                request.status = ExportStatus.FAILED
                request.error_message = f"Unsupported format: {request.format.value}"
                return
            
            # Update request status
            request.status = ExportStatus.COMPLETED
            request.completed_at = datetime.now(timezone.utc)
            request.progress = 100.0
            request.processed_records = total_records
            
            # Generate download URL
            request.download_url = f"/api/v1/privacy/portability/download/{request_id}"
            
            # Get file size
            if Path(request.file_path).exists():
                request.file_size = Path(request.file_path).stat().st_size
            
            logger.info(f"Export processing completed: {request_id}",
                       extra_fields={
                           "event_type": "export_processing_completed",
                           "request_id": request_id,
                           "total_records": total_records,
                           "file_size": request.file_size
                       })
        
        except Exception as e:
            # Mark request as failed
            if request_id in self.requests:
                self.requests[request_id].status = ExportStatus.FAILED
                self.requests[request_id].error_message = str(e)
            
            logger.error(f"Error processing export request {request_id}: {e}")
        
        finally:
            # Clean up processing task
            if request_id in self.processing_tasks:
                del self.processing_tasks[request_id]
    
    async def _get_category_data(self, user_id: str, category: DataCategory,
                                fields: List[str], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get data for a specific category"""
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
                        "user_id": user_id,
                        "course_id": "python_basics",
                        "enrollment_date": "2023-02-01T00:00:00Z",
                        "progress": 85.5,
                        "completion_date": None,
                        "grade": "A-",
                        "time_spent": 3600
                    },
                    {
                        "user_id": user_id,
                        "course_id": "advanced_javascript",
                        "enrollment_date": "2023-03-15T00:00:00Z",
                        "progress": 45.0,
                        "completion_date": None,
                        "grade": None,
                        "time_spent": 1800
                    }
                ]
            
            elif category == DataCategory.COURSE_DATA:
                return [
                    {
                        "id": "python_basics",
                        "title": "Python Basics",
                        "category": "Programming",
                        "difficulty": "Beginner",
                        "duration": 40,
                        "instructor": "John Smith"
                    },
                    {
                        "id": "advanced_javascript",
                        "title": "Advanced JavaScript",
                        "category": "Programming",
                        "difficulty": "Advanced",
                        "duration": 60,
                        "instructor": "Jane Doe"
                    }
                ]
            
            elif category == DataCategory.SUBMISSIONS:
                return [
                    {
                        "id": "sub_001",
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
            
            elif category == DataCategory.CERTIFICATES:
                return [
                    {
                        "id": "cert_001",
                        "course_id": "python_basics",
                        "issue_date": "2023-03-01T00:00:00Z",
                        "certificate_url": "https://pymastery.com/certificates/python_basics_001.pdf",
                        "verification_code": "ABC123XYZ",
                        "grade": "A-"
                    }
                ]
            
            elif category == DataCategory.PAYMENTS:
                return [
                    {
                        "id": "pay_001",
                        "amount": 29.99,
                        "currency": "USD",
                        "payment_date": "2023-02-01T12:00:00Z",
                        "payment_method": "credit_card",
                        "status": "completed"
                    }
                ]
            
            elif category == DataCategory.COMMUNICATIONS:
                return [
                    {
                        "id": "comm_001",
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
                        "action": "login",
                        "resource_type": "system",
                        "resource_id": None,
                        "timestamp": "2024-03-15T09:00:00Z",
                        "ip_address": "192.168.1.1"
                    },
                    {
                        "id": "log_002",
                        "action": "course_access",
                        "resource_type": "course",
                        "resource_id": "python_basics",
                        "timestamp": "2024-03-15T09:30:00Z",
                        "ip_address": "192.168.1.1"
                    }
                ]
            
            elif category == DataCategory.PREFERENCES:
                return [
                    {
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
            
            elif category == DataCategory.ANALYTICS:
                return [
                    {
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
            
            elif category == DataCategory.CONSENTS:
                return [
                    {
                        "consent_type": "marketing",
                        "status": "granted",
                        "granted_at": "2023-01-01T12:00:00Z",
                        "withdrawn_at": None,
                        "method": "explicit",
                        "template_id": "marketing_en"
                    },
                    {
                        "consent_type": "analytics",
                        "status": "granted",
                        "granted_at": "2023-01-01T12:00:00Z",
                        "withdrawn_at": None,
                        "method": "explicit",
                        "template_id": "analytics_en"
                    }
                ]
            
            elif category == DataCategory.AUDIT_TRAIL:
                return [
                    {
                        "action": "data_export_requested",
                        "timestamp": "2024-03-15T10:00:00Z",
                        "user_agent": "Mozilla/5.0...",
                        "ip_address": "192.168.1.1"
                    }
                ]
            
            else:
                return []
        
        except Exception as e:
            logger.error(f"Error getting category data for {category.value}: {e}")
            return []
    
    async def _export_json(self, request: ExportRequest, data: Dict[str, Any], template: ExportTemplate):
        """Export data in JSON format"""
        try:
            export_data = {
                "export_info": {
                    "request_id": request.id,
                    "user_id": request.user_id,
                    "export_date": datetime.now(timezone.utc).isoformat(),
                    "format": request.format.value,
                    "categories": [c.value for c in request.categories],
                    "total_records": request.total_records
                },
                "data": data
            }
            
            # Write to file
            with open(request.file_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False, default=str)
            
            # Compress if enabled
            if template.compression:
                await self._compress_file(request.file_path)
        
        except Exception as e:
            logger.error(f"Error exporting JSON: {e}")
            raise
    
    async def _export_csv(self, request: ExportRequest, data: Dict[str, Any], template: ExportTemplate):
        """Export data in CSV format"""
        try:
            # Create zip file
            with zipfile.ZipFile(request.file_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for category_name, category_data in data.items():
                    if not category_data:
                        continue
                    
                    # Create CSV in memory
                    csv_buffer = io.StringIO()
                    
                    if category_data:
                        # Use field names from template or extract from data
                        field_names = template.fields.get(category_name, list(category_data[0].keys()))
                        
                        writer = csv.DictWriter(csv_buffer, fieldnames=field_names)
                        writer.writeheader()
                        
                        for record in category_data:
                            # Only include requested fields
                            filtered_record = {k: v for k, v in record.items() if k in field_names}
                            writer.writerow(filtered_record)
                    
                    # Add to zip
                    zip_file.writestr(f"{category_name}.csv", csv_buffer.getvalue())
        
        except Exception as e:
            logger.error(f"Error exporting CSV: {e}")
            raise
    
    async def _export_xml(self, request: ExportRequest, data: Dict[str, Any], template: ExportTemplate):
        """Export data in XML format"""
        try:
            root = ET.Element("export")
            
            # Add export info
            info = ET.SubElement(root, "export_info")
            ET.SubElement(info, "request_id").text = request.id
            ET.SubElement(info, "user_id").text = request.user_id
            ET.SubElement(info, "export_date").text = datetime.now(timezone.utc).isoformat()
            ET.SubElement(info, "format").text = request.format.value
            ET.SubElement(info, "total_records").text = str(request.total_records)
            
            # Add data
            data_elem = ET.SubElement(root, "data")
            
            for category_name, category_data in data.items():
                category_elem = ET.SubElement(data_elem, category_name)
                
                for record in category_data:
                    record_elem = ET.SubElement(category_elem, "record")
                    
                    for key, value in record.items():
                        field_elem = ET.SubElement(record_elem, key)
                        field_elem.text = str(value)
            
            # Write to file
            tree = ET.ElementTree(root)
            tree.write(request.file_path, encoding='utf-8', xml_declaration=True)
        
        except Exception as e:
            logger.error(f"Error exporting XML: {e}")
            raise
    
    async def _export_excel(self, request: ExportRequest, data: Dict[str, Any], template: ExportTemplate):
        """Export data in Excel format"""
        try:
            # Create Excel writer
            with pd.ExcelWriter(request.file_path, engine='xlsxwriter') as writer:
                for category_name, category_data in data.items():
                    if not category_data:
                        continue
                    
                    # Convert to DataFrame
                    df = pd.DataFrame(category_data)
                    
                    # Filter columns based on template fields
                    if category_name in template.fields:
                        available_fields = [f for f in template.fields[category_name] if f in df.columns]
                        df = df[available_fields]
                    
                    # Write to Excel sheet
                    df.to_excel(writer, sheet_name=category_name[:31], index=False)  # Sheet name max 31 chars
        
        except Exception as e:
            logger.error(f"Error exporting Excel: {e}")
            raise
    
    async def _export_html(self, request: ExportRequest, data: Dict[str, Any], template: ExportTemplate):
        """Export data in HTML format"""
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Data Export - {request.user_id}</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; }}
                    table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f2f2f2; }}
                    .category {{ margin-bottom: 30px; }}
                    .category h2 {{ color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; }}
                </style>
            </head>
            <body>
                <h1>Data Export Report</h1>
                <div class="export-info">
                    <p><strong>Request ID:</strong> {request.id}</p>
                    <p><strong>User ID:</strong> {request.user_id}</p>
                    <p><strong>Export Date:</strong> {datetime.now(timezone.utc).isoformat()}</p>
                    <p><strong>Format:</strong> {request.format.value}</p>
                    <p><strong>Total Records:</strong> {request.total_records}</p>
                </div>
            """
            
            # Add data for each category
            for category_name, category_data in data.items():
                html_content += f'<div class="category"><h2>{category_name.title()}</h2>'
                
                if category_data:
                    html_content += '<table>'
                    
                    # Table headers
                    if category_data:
                        headers = list(category_data[0].keys())
                        html_content += '<tr>'
                        for header in headers:
                            html_content += f'<th>{header.title()}</th>'
                        html_content += '</tr>'
                        
                        # Table rows
                        for record in category_data:
                            html_content += '<tr>'
                            for header in headers:
                                value = record.get(header, '')
                                html_content += f'<td>{value}</td>'
                            html_content += '</tr>'
                    
                    html_content += '</table>'
                else:
                    html_content += '<p>No data available for this category.</p>'
                
                html_content += '</div>'
            
            html_content += """
            </body>
            </html>
            """
            
            # Write to file
            with open(request.file_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
        
        except Exception as e:
            logger.error(f"Error exporting HTML: {e}")
            raise
    
    async def _compress_file(self, file_path: str):
        """Compress a file"""
        try:
            compressed_path = file_path + '.gz'
            
            with open(file_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    f_out.writelines(f_in)
            
            # Replace original with compressed
            Path(file_path).unlink()
            Path(compressed_path).rename(file_path)
        
        except Exception as e:
            logger.error(f"Error compressing file: {e}")
            raise
    
    def get_export_requests(self, user_id: str = None, status: ExportStatus = None) -> List[Dict[str, Any]]:
        """Get export requests with filtering"""
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
                    "template_id": request.template_id,
                    "format": request.format.value,
                    "categories": [c.value for c in request.categories],
                    "status": request.status.value,
                    "progress": request.progress,
                    "total_records": request.total_records,
                    "processed_records": request.processed_records,
                    "file_size": request.file_size,
                    "download_url": request.download_url,
                    "expires_at": request.expires_at.isoformat(),
                    "requested_at": request.requested_at.isoformat(),
                    "started_at": request.started_at.isoformat() if request.started_at else None,
                    "completed_at": request.completed_at.isoformat() if request.completed_at else None,
                    "error_message": request.error_message
                }
                for request in requests
            ]
        
        except Exception as e:
            logger.error(f"Error getting export requests: {e}")
            return []
    
    def get_export_request_status(self, request_id: str) -> Dict[str, Any]:
        """Get status of a specific export request"""
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
                "file_size": request.file_size,
                "download_url": request.download_url,
                "expires_at": request.expires_at.isoformat(),
                "requested_at": request.requested_at.isoformat(),
                "started_at": request.started_at.isoformat() if request.started_at else None,
                "completed_at": request.completed_at.isoformat() if request.completed_at else None,
                "error_message": request.error_message
            }
        
        except Exception as e:
            logger.error(f"Error getting export request status: {e}")
            return {"success": False, "error": str(e)}
    
    async def download_export(self, request_id: str) -> FileResponse:
        """Download exported data file"""
        try:
            request = self.requests.get(request_id)
            if not request:
                raise HTTPException(status_code=404, detail="Export request not found")
            
            if request.status != ExportStatus.COMPLETED:
                raise HTTPException(status_code=400, detail="Export not completed")
            
            if datetime.now(timezone.utc) >= request.expires_at:
                raise HTTPException(status_code=410, detail="Export file has expired")
            
            if not request.file_path or not Path(request.file_path).exists():
                raise HTTPException(status_code=404, detail="Export file not found")
            
            # Determine media type
            media_type = "application/octet-stream"
            if request.format == ExportFormat.JSON:
                media_type = "application/json"
            elif request.format == ExportFormat.CSV:
                media_type = "application/zip"
            elif request.format == ExportFormat.XML:
                media_type = "application/xml"
            elif request.format == ExportFormat.EXCEL:
                media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            elif request.format == ExportFormat.HTML:
                media_type = "text/html"
            
            # Generate filename
            filename = f"export_{request.user_id}_{request_id}.{request.format.value}"
            
            return FileResponse(
                path=request.file_path,
                filename=filename,
                media_type=media_type
            )
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error downloading export: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def cancel_export_request(self, request_id: str) -> Dict[str, Any]:
        """Cancel an export request"""
        try:
            request = self.requests.get(request_id)
            if not request:
                return {"success": False, "error": "Request not found"}
            
            if request.status not in [ExportStatus.PENDING, ExportStatus.PROCESSING]:
                return {"success": False, "error": "Request cannot be cancelled"}
            
            # Cancel processing task if running
            if request_id in self.processing_tasks:
                self.processing_tasks[request_id].cancel()
                del self.processing_tasks[request_id]
            
            # Update request status
            request.status = ExportStatus.CANCELLED
            
            logger.info(f"Export request cancelled: {request_id}",
                       extra_fields={
                           "event_type": "export_request_cancelled",
                           "request_id": request_id
                       })
            
            return {"success": True, "message": "Export request cancelled successfully"}
        
        except Exception as e:
            logger.error(f"Error cancelling export request: {e}")
            return {"success": False, "error": str(e)}
    
    def get_export_statistics(self) -> Dict[str, Any]:
        """Get export statistics"""
        try:
            # Calculate overall statistics
            total_requests = len(self.requests)
            pending_requests = len([r for r in self.requests.values() if r.status == ExportStatus.PENDING])
            processing_requests = len([r for r in self.requests.values() if r.status == ExportStatus.PROCESSING])
            completed_requests = len([r for r in self.requests.values() if r.status == ExportStatus.COMPLETED])
            failed_requests = len([r for r in self.requests.values() if r.status == ExportStatus.FAILED])
            
            # Statistics by format
            requests_by_format = defaultdict(int)
            for request in self.requests.values():
                requests_by_format[request.format.value] += 1
            
            # Statistics by category
            category_counts = defaultdict(int)
            for request in self.requests.values():
                for category in request.categories:
                    category_counts[category.value] += 1
            
            # Recent activity (last 30 days)
            cutoff_time = datetime.now(timezone.utc) - timedelta(days=30)
            recent_requests = len([r for r in self.requests.values() if r.requested_at > cutoff_time])
            recent_completions = len([r for r in self.requests.values() 
                                    if r.completed_at and r.completed_at > cutoff_time])
            
            # File size statistics
            completed_requests_with_files = [r for r in self.requests.values() 
                                            if r.status == ExportStatus.COMPLETED and r.file_size]
            total_file_size = sum(r.file_size for r in completed_requests_with_files)
            avg_file_size = total_file_size / len(completed_requests_with_files) if completed_requests_with_files else 0
            
            return {
                "overall_statistics": {
                    "total_requests": total_requests,
                    "pending_requests": pending_requests,
                    "processing_requests": processing_requests,
                    "completed_requests": completed_requests,
                    "failed_requests": failed_requests,
                    "success_rate": (completed_requests / total_requests) * 100 if total_requests > 0 else 0
                },
                "by_format": dict(requests_by_format),
                "by_category": dict(category_counts),
                "recent_activity": {
                    "total_recent": recent_requests,
                    "recent_completions": recent_completions,
                    "period_days": 30
                },
                "file_statistics": {
                    "total_file_size": total_file_size,
                    "average_file_size": avg_file_size,
                    "completed_with_files": len(completed_requests_with_files)
                },
                "template_statistics": {
                    "total_templates": len(self.templates),
                    "active_templates": len([t for t in self.templates.values() if t.is_active]),
                    "templates_by_format": {
                        format.value: len([t for t in self.templates.values() if t.format == format])
                        for format in ExportFormat
                    }
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error getting export statistics: {e}")
            return {"error": str(e)}
    
    def get_data_portability_service_status(self) -> Dict[str, Any]:
        """Get data portability service status"""
        try:
            return {
                "service_status": {
                    "is_running": self.is_running,
                    "start_time": self.start_time.isoformat() if self.start_time else None,
                    "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
                },
                "configuration": {
                    "max_concurrent_exports": self.max_concurrent_exports,
                    "default_retention_days": self.default_retention_days,
                    "max_file_size_mb": self.max_file_size_mb,
                    "batch_size": self.batch_size
                },
                "statistics": self.get_export_statistics(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get data portability service status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global data portability service instance
data_portability_service: Optional[DataPortabilityService] = None

def get_data_portability_service(config: Dict[str, Any] = None) -> DataPortabilityService:
    """Get or create data portability service instance"""
    global data_portability_service
    if data_portability_service is None:
        data_portability_service = DataPortabilityService(config)
    return data_portability_service

async def start_data_portability_service(config: Dict[str, Any] = None) -> DataPortabilityService:
    """Start data portability service"""
    service = get_data_portability_service(config)
    await service.start()
    return service

"""
End-to-End Encryption Service for PyMastery
Provides enterprise-grade encryption for data at rest and in transit
"""

import logging
import json
import time
import secrets
import hashlib
import base64
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
from pathlib import Path
import asyncio
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.asymmetric import rsa, padding as asym_padding
from cryptography.hazmat.backends import default_backend
import cryptography

logger = logging.getLogger(__name__)

class EncryptionAlgorithm(Enum):
    """Supported encryption algorithms"""
    AES_256_GCM = "aes-256-gcm"
    AES_256_CBC = "aes-256-cbc"
    CHACHA20_POLY1305 = "chacha20-poly1305"
    RSA_4096 = "rsa-4096"
    RSA_2048 = "rsa-2048"
    ECDSA_P256 = "ecdsa-p256"
    ECDSA_P384 = "ecdsa-p384"

class KeyType(Enum):
    """Key types"""
    SYMMETRIC = "symmetric"
    ASYMMETRIC = "asymmetric"
    HMAC = "hmac"
    SIGNING = "signing"

class KeyStatus(Enum):
    """Key status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPRECATED = "deprecated"
    COMPROMISED = "compromised"
    EXPIRED = "expired"

class DataClassification(Enum):
    """Data classification levels for encryption requirements"""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    TOP_SECRET = "top_secret"

@dataclass
class EncryptionKey:
    """Encryption key metadata"""
    id: str
    name: str
    key_type: KeyType
    algorithm: EncryptionAlgorithm
    key_size: int
    encrypted_key: str
    salt: str
    iv: str
    created_at: datetime
    expires_at: datetime
    status: KeyStatus
    usage_count: int
    last_used: Optional[datetime]
    classification: DataClassification
    rotation_period_days: int
    metadata: Dict[str, Any]

@dataclass
class EncryptionOperation:
    """Record of encryption/decryption operation"""
    id: str
    operation_type: str
    key_id: str
    user_id: Optional[str]
    resource_id: Optional[str]
    data_hash: str
    algorithm: EncryptionAlgorithm
    success: bool
    error_message: Optional[str]
    timestamp: datetime
    ip_address: str
    user_agent: str
    metadata: Dict[str, Any]

@dataclass
class EncryptionPolicy:
    """Encryption policy for data classification"""
    id: str
    classification: DataClassification
    algorithm: EncryptionAlgorithm
    key_rotation_days: int
    min_key_size: int
    requires_hmac: bool
    requires_key_escrow: bool
    retention_days: int
    created_at: datetime
    is_active: bool

class EncryptionService:
    """End-to-end encryption service"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Service state
        self.is_running = False
        self.start_time = None
        
        # Key storage
        self.keys: Dict[str, EncryptionKey] = {}
        self.active_keys: Dict[str, str] = {}  # classification -> key_id
        
        # Operation logs
        self.operations: List[EncryptionOperation] = []
        
        # Encryption policies
        self.policies: Dict[str, EncryptionPolicy] = {}
        
        # Master key for key encryption
        self.master_key: Optional[bytes] = None
        self.master_key_id: Optional[str] = None
        
        # Background tasks
        self.key_rotation_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        self.audit_task: Optional[asyncio.Task] = None
        
        # Configuration
        self.default_algorithm = EncryptionAlgorithm(self.config.get("default_algorithm", "aes-256-gcm"))
        self.default_key_size = self.config.get("default_key_size", 256)
        self.key_rotation_days = self.config.get("key_rotation_days", 90)
        self.max_operations_per_minute = self.config.get("max_operations_per_minute", 1000)
        self.operation_retention_days = self.config.get("operation_retention_days", 2555)  # 7 years
        
        # Storage configuration
        self.storage_path = Path(self.config.get("storage_path", "encryption_data"))
        self.storage_path.mkdir(exist_ok=True)
        
        # Rate limiting
        self.operation_counters: Dict[str, Dict[str, Any]] = {}
        
        # Initialize default policies
        self._initialize_default_policies()
        
        # Initialize master key
        self._initialize_master_key()
    
    def _initialize_default_policies(self):
        """Initialize default encryption policies"""
        # Public data policy
        self.policies["public"] = EncryptionPolicy(
            id="public",
            classification=DataClassification.PUBLIC,
            algorithm=EncryptionAlgorithm.AES_256_GCM,
            key_rotation_days=365,
            min_key_size=256,
            requires_hmac=False,
            requires_key_escrow=False,
            retention_days=365,
            created_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Internal data policy
        self.policies["internal"] = EncryptionPolicy(
            id="internal",
            classification=DataClassification.INTERNAL,
            algorithm=EncryptionAlgorithm.AES_256_GCM,
            key_rotation_days=180,
            min_key_size=256,
            requires_hmac=True,
            requires_key_escrow=True,
            retention_days=1095,
            created_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Confidential data policy
        self.policies["confidential"] = EncryptionPolicy(
            id="confidential",
            classification=DataClassification.CONFIDENTIAL,
            algorithm=EncryptionAlgorithm.AES_256_GCM,
            key_rotation_days=90,
            min_key_size=256,
            requires_hmac=True,
            requires_key_escrow=True,
            retention_days=2555,
            created_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Restricted data policy
        self.policies["restricted"] = EncryptionPolicy(
            id="restricted",
            classification=DataClassification.RESTRICTED,
            algorithm=EncryptionAlgorithm.AES_256_GCM,
            key_rotation_days=30,
            min_key_size=256,
            requires_hmac=True,
            requires_key_escrow=True,
            retention_days=3650,
            created_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        # Top secret data policy
        self.policies["top_secret"] = EncryptionPolicy(
            id="top_secret",
            classification=DataClassification.TOP_SECRET,
            algorithm=EncryptionAlgorithm.AES_256_GCM,
            key_rotation_days=7,
            min_key_size=256,
            requires_hmac=True,
            requires_key_escrow=True,
            retention_days=7300,  # 20 years
            created_at=datetime.now(timezone.utc),
            is_active=True
        )
    
    def _initialize_master_key(self):
        """Initialize master key for key encryption"""
        try:
            # Generate master key
            self.master_key = os.urandom(32)  # 256-bit master key
            
            # Create master key record
            self.master_key_id = f"master_{int(time.time())}"
            
            logger.info("Master key initialized successfully")
        
        except Exception as e:
            logger.error(f"Error initializing master key: {e}")
            raise
    
    async def start(self):
        """Start the encryption service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Load existing keys
        await self._load_keys()
        
        # Start background tasks
        self.key_rotation_task = asyncio.create_task(self._key_rotation_loop())
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        self.audit_task = asyncio.create_task(self._audit_loop())
        
        # Ensure active keys exist for all classifications
        await self._ensure_active_keys()
        
        logger.info("Encryption service started",
                   extra_fields={
                       "event_type": "encryption_service_started",
                       "default_algorithm": self.default_algorithm.value,
                       "key_rotation_days": self.key_rotation_days,
                       "active_keys": len(self.active_keys)
                   })
    
    async def stop(self):
        """Stop the encryption service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Cancel background tasks
        if self.key_rotation_task:
            self.key_rotation_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        if self.audit_task:
            self.audit_task.cancel()
        
        # Save keys
        await self._save_keys()
        
        logger.info("Encryption service stopped",
                   extra_fields={
                       "event_type": "encryption_service_stopped"
                   })
    
    async def _load_keys(self):
        """Load encryption keys from storage"""
        try:
            keys_file = self.storage_path / "keys.json"
            if keys_file.exists():
                with open(keys_file, 'r') as f:
                    keys_data = json.load(f)
                    for key_id, key_data in keys_data.items():
                        # Convert back to EncryptionKey objects
                        key = EncryptionKey(
                            id=key_data["id"],
                            name=key_data["name"],
                            key_type=KeyType(key_data["key_type"]),
                            algorithm=EncryptionAlgorithm(key_data["algorithm"]),
                            key_size=key_data["key_size"],
                            encrypted_key=key_data["encrypted_key"],
                            salt=key_data["salt"],
                            iv=key_data["iv"],
                            created_at=datetime.fromisoformat(key_data["created_at"]),
                            expires_at=datetime.fromisoformat(key_data["expires_at"]),
                            status=KeyStatus(key_data["status"]),
                            usage_count=key_data["usage_count"],
                            last_used=datetime.fromisoformat(key_data["last_used"]) if key_data["last_used"] else None,
                            classification=DataClassification(key_data["classification"]),
                            rotation_period_days=key_data["rotation_period_days"],
                            metadata=key_data["metadata"]
                        )
                        self.keys[key_id] = key
                        
                        # Update active keys
                        if key.status == KeyStatus.ACTIVE:
                            self.active_keys[key.classification.value] = key_id
            
            logger.info(f"Loaded {len(self.keys)} encryption keys")
        
        except Exception as e:
            logger.error(f"Error loading encryption keys: {e}")
    
    async def _save_keys(self):
        """Save encryption keys to storage"""
        try:
            keys_data = {}
            for key_id, key in self.keys.items():
                keys_data[key_id] = asdict(key)
            
            keys_file = self.storage_path / "keys.json"
            with open(keys_file, 'w') as f:
                json.dump(keys_data, f, default=str, indent=2)
            
            logger.info(f"Saved {len(self.keys)} encryption keys")
        
        except Exception as e:
            logger.error(f"Error saving encryption keys: {e}")
    
    async def _ensure_active_keys(self):
        """Ensure active keys exist for all classifications"""
        for classification in DataClassification:
            if classification.value not in self.active_keys:
                # Generate new key for this classification
                policy = self.policies.get(classification.value)
                if policy:
                    await self.generate_key(
                        key_name=f"Default {classification.value} key",
                        key_type=KeyType.SYMMETRIC,
                        algorithm=policy.algorithm,
                        key_size=policy.min_key_size,
                        classification=classification,
                        rotation_period_days=policy.key_rotation_days
                    )
    
    async def _key_rotation_loop(self):
        """Background task for key rotation"""
        while self.is_running:
            try:
                await asyncio.sleep(86400)  # Run daily
                await self._check_key_rotation()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in key rotation loop: {e}")
    
    async def _cleanup_loop(self):
        """Background task for cleanup operations"""
        while self.is_running:
            try:
                await asyncio.sleep(3600)  # Run hourly
                await self._cleanup_expired_keys()
                await self._cleanup_old_operations()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
    
    async def _audit_loop(self):
        """Background task for audit operations"""
        while self.is_running:
            try:
                await asyncio.sleep(86400)  # Run daily
                await self._generate_audit_report()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in audit loop: {e}")
    
    async def _check_key_rotation(self):
        """Check and rotate keys that need rotation"""
        current_time = datetime.now(timezone.utc)
        
        for key_id, key in self.keys.items():
            if key.status == KeyStatus.ACTIVE:
                rotation_date = key.created_at + timedelta(days=key.rotation_period_days)
                if current_time >= rotation_date:
                    await self._rotate_key(key_id)
    
    async def _rotate_key(self, key_id: str):
        """Rotate an encryption key"""
        try:
            old_key = self.keys.get(key_id)
            if not old_key:
                return
            
            # Generate new key
            new_key = await self.generate_key(
                key_name=f"{old_key.name} (Rotated)",
                key_type=old_key.key_type,
                algorithm=old_key.algorithm,
                key_size=old_key.key_size,
                classification=old_key.classification,
                rotation_period_days=old_key.rotation_period_days
            )
            
            # Update old key status
            old_key.status = KeyStatus.DEPRECATED
            
            # Update active key mapping
            self.active_keys[old_key.classification.value] = new_key.id
            
            logger.info(f"Key rotated: {key_id} -> {new_key.id}")
        
        except Exception as e:
            logger.error(f"Error rotating key {key_id}: {e}")
    
    async def _cleanup_expired_keys(self):
        """Clean up expired keys"""
        current_time = datetime.now(timezone.utc)
        
        expired_keys = []
        for key_id, key in self.keys.items():
            if key.expires_at and current_time > key.expires_at:
                expired_keys.append(key_id)
                key.status = KeyStatus.EXPIRED
        
        if expired_keys:
            logger.info(f"Marked {len(expired_keys)} keys as expired")
    
    async def _cleanup_old_operations(self):
        """Clean up old operation logs"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(days=self.operation_retention_days)
        
        old_operations = [
            op for op in self.operations 
            if op.timestamp < cutoff_time
        ]
        
        for op in old_operations:
            self.operations.remove(op)
        
        if old_operations:
            logger.info(f"Cleaned up {len(old_operations)} old operation logs")
    
    async def _generate_audit_report(self):
        """Generate daily audit report"""
        try:
            current_time = datetime.now(timezone.utc)
            yesterday = current_time - timedelta(days=1)
            
            # Filter operations from yesterday
            yesterday_operations = [
                op for op in self.operations
                if yesterday <= op.timestamp < current_time
            ]
            
            # Calculate statistics
            total_operations = len(yesterday_operations)
            successful_operations = len([op for op in yesterday_operations if op.success])
            failed_operations = total_operations - successful_operations
            
            operations_by_type = {}
            operations_by_algorithm = {}
            
            for op in yesterday_operations:
                operations_by_type[op.operation_type] = operations_by_type.get(op.operation_type, 0) + 1
                operations_by_algorithm[op.algorithm.value] = operations_by_algorithm.get(op.algorithm.value, 0) + 1
            
            audit_report = {
                "date": yesterday.strftime("%Y-%m-%d"),
                "total_operations": total_operations,
                "successful_operations": successful_operations,
                "failed_operations": failed_operations,
                "success_rate": (successful_operations / total_operations) * 100 if total_operations > 0 else 0,
                "operations_by_type": operations_by_type,
                "operations_by_algorithm": operations_by_algorithm,
                "active_keys": len(self.active_keys),
                "total_keys": len(self.keys)
            }
            
            # Save audit report
            audit_file = self.storage_path / "audit" / f"audit_{yesterday.strftime('%Y%m%d')}.json"
            audit_file.parent.mkdir(exist_ok=True)
            
            with open(audit_file, 'w') as f:
                json.dump(audit_report, f, indent=2)
            
            logger.info(f"Generated audit report for {yesterday.strftime('%Y-%m-%d')}")
        
        except Exception as e:
            logger.error(f"Error generating audit report: {e}")
    
    def _check_rate_limit(self, user_id: str = None) -> bool:
        """Check if operation is rate limited"""
        current_time = time.time()
        key = user_id or "anonymous"
        
        if key not in self.operation_counters:
            self.operation_counters[key] = {
                "count": 0,
                "window_start": current_time
            }
        
        counter = self.operation_counters[key]
        
        # Reset window if needed
        if current_time - counter["window_start"] > 60:  # 1 minute window
            counter["count"] = 0
            counter["window_start"] = current_time
        
        # Check limit
        if counter["count"] >= self.max_operations_per_minute:
            return False
        
        counter["count"] += 1
        return True
    
    def _log_operation(self, operation_type: str, key_id: str, success: bool,
                      user_id: str = None, resource_id: str = None, data_hash: str = "",
                      algorithm: EncryptionAlgorithm = None, error_message: str = None,
                      ip_address: str = "", user_agent: str = "", metadata: Dict[str, Any] = None):
        """Log encryption/decryption operation"""
        try:
            operation = EncryptionOperation(
                id=f"op_{int(time.time())}_{secrets.token_hex(8)}",
                operation_type=operation_type,
                key_id=key_id,
                user_id=user_id,
                resource_id=resource_id,
                data_hash=data_hash,
                algorithm=algorithm or self.default_algorithm,
                success=success,
                error_message=error_message,
                timestamp=datetime.now(timezone.utc),
                ip_address=ip_address,
                user_agent=user_agent,
                metadata=metadata or {}
            )
            
            self.operations.append(operation)
            
            # Update key usage
            if key_id in self.keys:
                self.keys[key_id].usage_count += 1
                self.keys[key_id].last_used = operation.timestamp
            
            # Keep only recent operations in memory
            if len(self.operations) > 10000:
                self.operations = self.operations[-5000:]
        
        except Exception as e:
            logger.error(f"Error logging operation: {e}")
    
    async def generate_key(self, key_name: str, key_type: KeyType, algorithm: EncryptionAlgorithm,
                          key_size: int, classification: DataClassification,
                          rotation_period_days: int = None) -> Dict[str, Any]:
        """Generate a new encryption key"""
        try:
            # Check rate limiting
            if not self._check_rate_limit():
                return {"success": False, "error": "Rate limit exceeded"}
            
            # Generate key based on type
            if key_type == KeyType.SYMMETRIC:
                key_data, salt, iv = self._generate_symmetric_key(algorithm, key_size)
            elif key_type == KeyType.ASYMMETRIC:
                key_data, salt, iv = self._generate_asymmetric_key(algorithm, key_size)
            else:
                return {"success": False, "error": "Unsupported key type"}
            
            # Encrypt key with master key
            encrypted_key = self._encrypt_key_with_master(key_data)
            
            # Create key record
            key_id = f"key_{int(time.time())}_{secrets.token_hex(8)}"
            expires_at = datetime.now(timezone.utc) + timedelta(days=rotation_period_days or self.key_rotation_days)
            
            key = EncryptionKey(
                id=key_id,
                name=key_name,
                key_type=key_type,
                algorithm=algorithm,
                key_size=key_size,
                encrypted_key=encrypted_key,
                salt=base64.b64encode(salt).decode(),
                iv=base64.b64encode(iv).decode(),
                created_at=datetime.now(timezone.utc),
                expires_at=expires_at,
                status=KeyStatus.ACTIVE,
                usage_count=0,
                last_used=None,
                classification=classification,
                rotation_period_days=rotation_period_days or self.key_rotation_days,
                metadata={}
            )
            
            # Store key
            self.keys[key_id] = key
            
            # Update active keys
            self.active_keys[classification.value] = key_id
            
            # Log operation
            self._log_operation(
                operation_type="key_generation",
                key_id=key_id,
                success=True,
                metadata={
                    "key_name": key_name,
                    "key_type": key_type.value,
                    "algorithm": algorithm.value,
                    "key_size": key_size,
                    "classification": classification.value
                }
            )
            
            return {
                "success": True,
                "key_id": key_id,
                "key_name": key_name,
                "algorithm": algorithm.value,
                "key_size": key_size,
                "classification": classification.value,
                "expires_at": expires_at.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error generating key: {e}")
            return {"success": False, "error": str(e)}
    
    def _generate_symmetric_key(self, algorithm: EncryptionAlgorithm, key_size: int) -> Tuple[bytes, bytes, bytes]:
        """Generate symmetric key"""
        if algorithm == EncryptionAlgorithm.AES_256_GCM:
            key = os.urandom(32)  # 256-bit key
            salt = os.urandom(16)   # 128-bit salt
            iv = os.urandom(12)    # 96-bit IV for GCM
        elif algorithm == EncryptionAlgorithm.AES_256_CBC:
            key = os.urandom(32)  # 256-bit key
            salt = os.urandom(16)   # 128-bit salt
            iv = os.urandom(16)    # 128-bit IV for CBC
        elif algorithm == EncryptionAlgorithm.CHACHA20_POLY1305:
            key = os.urandom(32)  # 256-bit key
            salt = os.urandom(16)   # 128-bit salt
            iv = os.urandom(12)    # 96-bit nonce
        else:
            raise ValueError(f"Unsupported symmetric algorithm: {algorithm}")
        
        return key, salt, iv
    
    def _generate_asymmetric_key(self, algorithm: EncryptionAlgorithm, key_size: int) -> Tuple[bytes, bytes, bytes]:
        """Generate asymmetric key pair"""
        if algorithm == EncryptionAlgorithm.RSA_4096:
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=4096,
                backend=default_backend()
            )
        elif algorithm == EncryptionAlgorithm.RSA_2048:
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
        else:
            raise ValueError(f"Unsupported asymmetric algorithm: {algorithm}")
        
        # Serialize private key
        private_key_bytes = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        # Generate salt and IV for key encryption
        salt = os.urandom(16)
        iv = os.urandom(16)
        
        return private_key_bytes, salt, iv
    
    def _encrypt_key_with_master(self, key_data: bytes) -> str:
        """Encrypt key with master key"""
        try:
            # Derive key from master key
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b"encryption_service_master_key_salt",
                iterations=100000,
                backend=default_backend()
            )
            derived_key = kdf.derive(self.master_key)
            
            # Encrypt with Fernet
            cipher = Fernet(base64.urlsafe_b64encode(derived_key))
            encrypted_key = cipher.encrypt(key_data)
            
            return base64.b64encode(encrypted_key).decode()
        
        except Exception as e:
            logger.error(f"Error encrypting key with master key: {e}")
            raise
    
    def _decrypt_key_with_master(self, encrypted_key: str) -> bytes:
        """Decrypt key with master key"""
        try:
            # Derive key from master key
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b"encryption_service_master_key_salt",
                iterations=100000,
                backend=default_backend()
            )
            derived_key = kdf.derive(self.master_key)
            
            # Decrypt with Fernet
            cipher = Fernet(base64.urlsafe_b64encode(derived_key))
            encrypted_data = base64.b64decode(encrypted_key.encode())
            decrypted_key = cipher.decrypt(encrypted_data)
            
            return decrypted_key
        
        except Exception as e:
            logger.error(f"Error decrypting key with master key: {e}")
            raise
    
    async def encrypt_data(self, data: str, classification: DataClassification,
                          user_id: str = None, resource_id: str = None,
                          ip_address: str = "", user_agent: str = "") -> Dict[str, Any]:
        """Encrypt data"""
        try:
            # Check rate limiting
            if not self._check_rate_limit(user_id):
                return {"success": False, "error": "Rate limit exceeded"}
            
            # Get active key for classification
            key_id = self.active_keys.get(classification.value)
            if not key_id:
                return {"success": False, "error": "No active key for classification"}
            
            key = self.keys.get(key_id)
            if not key or key.status != KeyStatus.ACTIVE:
                return {"success": False, "error": "Key not available"}
            
            # Get policy
            policy = self.policies.get(classification.value)
            if not policy:
                return {"success": False, "error": "No policy for classification"}
            
            # Decrypt key
            key_data = self._decrypt_key_with_master(key.encrypted_key)
            salt = base64.b64decode(key.salt.encode())
            iv = base64.b64decode(key.iv.encode())
            
            # Encrypt data
            if key.algorithm == EncryptionAlgorithm.AES_256_GCM:
                encrypted_data, tag = self._encrypt_aes_gcm(data.encode(), key_data, iv)
                result = {
                    "encrypted_data": base64.b64encode(encrypted_data).decode(),
                    "tag": base64.b64encode(tag).decode(),
                    "iv": key.iv,
                    "algorithm": key.algorithm.value,
                    "key_id": key_id
                }
            elif key.algorithm == EncryptionAlgorithm.AES_256_CBC:
                encrypted_data = self._encrypt_aes_cbc(data.encode(), key_data, iv)
                result = {
                    "encrypted_data": base64.b64encode(encrypted_data).decode(),
                    "iv": key.iv,
                    "algorithm": key.algorithm.value,
                    "key_id": key_id
                }
            else:
                return {"success": False, "error": "Unsupported algorithm"}
            
            # Add HMAC if required
            if policy.requires_hmac:
                hmac_signature = self._generate_hmac(encrypted_data, key_data)
                result["hmac"] = base64.b64encode(hmac_signature).decode()
            
            # Calculate data hash
            data_hash = hashlib.sha256(data.encode()).hexdigest()
            
            # Log operation
            self._log_operation(
                operation_type="encryption",
                key_id=key_id,
                success=True,
                user_id=user_id,
                resource_id=resource_id,
                data_hash=data_hash,
                algorithm=key.algorithm,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"classification": classification.value}
            )
            
            return {"success": True, **result}
        
        except Exception as e:
            logger.error(f"Error encrypting data: {e}")
            
            # Log failed operation
            self._log_operation(
                operation_type="encryption",
                key_id=key_id if 'key_id' in locals() else "",
                success=False,
                user_id=user_id,
                resource_id=resource_id,
                error_message=str(e),
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            return {"success": False, "error": str(e)}
    
    def _encrypt_aes_gcm(self, data: bytes, key: bytes, iv: bytes) -> Tuple[bytes, bytes]:
        """Encrypt data using AES-GCM"""
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        encrypted_data = encryptor.update(data) + encryptor.finalize()
        return encrypted_data, encryptor.tag
    
    def _encrypt_aes_cbc(self, data: bytes, key: bytes, iv: bytes) -> bytes:
        """Encrypt data using AES-CBC"""
        cipher = Cipher(
            algorithms.AES(key),
            modes.CBC(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        
        # Pad data
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(data) + padder.finalize()
        
        encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
        return encrypted_data
    
    def _generate_hmac(self, data: bytes, key: bytes) -> bytes:
        """Generate HMAC for data integrity"""
        hmac_obj = hashlib.hmac(key, data, hashlib.sha256)
        return hmac_obj.digest()
    
    async def decrypt_data(self, encrypted_data: str, key_id: str, iv: str,
                          classification: DataClassification, tag: str = None,
                          hmac: str = None, user_id: str = None, resource_id: str = None,
                          ip_address: str = "", user_agent: str = "") -> Dict[str, Any]:
        """Decrypt data"""
        try:
            # Check rate limiting
            if not self._check_rate_limit(user_id):
                return {"success": False, "error": "Rate limit exceeded"}
            
            # Get key
            key = self.keys.get(key_id)
            if not key or key.status != KeyStatus.ACTIVE:
                return {"success": False, "error": "Key not available"}
            
            # Get policy
            policy = self.policies.get(classification.value)
            if not policy:
                return {"success": False, "error": "No policy for classification"}
            
            # Decrypt key
            key_data = self._decrypt_key_with_master(key.encrypted_key)
            iv_bytes = base64.b64decode(iv.encode())
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            
            # Verify HMAC if present
            if hmac and policy.requires_hmac:
                hmac_bytes = base64.b64decode(hmac.encode())
                expected_hmac = self._generate_hmac(encrypted_bytes, key_data)
                if not secrets.compare_digest(hmac_bytes, expected_hmac):
                    return {"success": False, "error": "HMAC verification failed"}
            
            # Decrypt data
            if key.algorithm == EncryptionAlgorithm.AES_256_GCM:
                if not tag:
                    return {"success": False, "error": "Missing authentication tag"}
                
                tag_bytes = base64.b64decode(tag.encode())
                decrypted_data = self._decrypt_aes_gcm(encrypted_bytes, key_data, iv_bytes, tag_bytes)
            elif key.algorithm == EncryptionAlgorithm.AES_256_CBC:
                decrypted_data = self._decrypt_aes_cbc(encrypted_bytes, key_data, iv_bytes)
            else:
                return {"success": False, "error": "Unsupported algorithm"}
            
            # Convert to string
            decrypted_text = decrypted_data.decode()
            
            # Calculate data hash
            data_hash = hashlib.sha256(decrypted_text.encode()).hexdigest()
            
            # Log operation
            self._log_operation(
                operation_type="decryption",
                key_id=key_id,
                success=True,
                user_id=user_id,
                resource_id=resource_id,
                data_hash=data_hash,
                algorithm=key.algorithm,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"classification": classification.value}
            )
            
            return {
                "success": True,
                "decrypted_data": decrypted_text,
                "algorithm": key.algorithm.value
            }
        
        except Exception as e:
            logger.error(f"Error decrypting data: {e}")
            
            # Log failed operation
            self._log_operation(
                operation_type="decryption",
                key_id=key_id,
                success=False,
                user_id=user_id,
                resource_id=resource_id,
                error_message=str(e),
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            return {"success": False, "error": str(e)}
    
    def _decrypt_aes_gcm(self, encrypted_data: bytes, key: bytes, iv: bytes, tag: bytes) -> bytes:
        """Decrypt data using AES-GCM"""
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(iv, tag),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        decrypted_data = decryptor.update(encrypted_data) + decryptor.finalize()
        return decrypted_data
    
    def _decrypt_aes_cbc(self, encrypted_data: bytes, key: bytes, iv: bytes) -> bytes:
        """Decrypt data using AES-CBC"""
        cipher = Cipher(
            algorithms.AES(key),
            modes.CBC(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
        
        # Unpad data
        unpadder = padding.PKCS7(128).unpadder()
        decrypted_data = unpadder.update(padded_data) + unpadder.finalize()
        
        return decrypted_data
    
    def get_encryption_service_status(self) -> Dict[str, Any]:
        """Get encryption service status"""
        try:
            # Calculate statistics
            total_keys = len(self.keys)
            active_keys = len([k for k in self.keys.values() if k.status == KeyStatus.ACTIVE])
            total_operations = len(self.operations)
            
            recent_operations = len([
                op for op in self.operations
                if op.timestamp > datetime.now(timezone.utc) - timedelta(hours=24)
            ])
            
            operations_by_type = {}
            for op in self.operations:
                operations_by_type[op.operation_type] = operations_by_type.get(op.operation_type, 0) + 1
            
            keys_by_classification = {}
            for key in self.keys.values():
                keys_by_classification[key.classification.value] = keys_by_classification.get(key.classification.value, 0) + 1
            
            return {
                "service_status": {
                    "is_running": self.is_running,
                    "start_time": self.start_time.isoformat() if self.start_time else None,
                    "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
                },
                "configuration": {
                    "default_algorithm": self.default_algorithm.value,
                    "default_key_size": self.default_key_size,
                    "key_rotation_days": self.key_rotation_days,
                    "max_operations_per_minute": self.max_operations_per_minute,
                    "operation_retention_days": self.operation_retention_days
                },
                "key_statistics": {
                    "total_keys": total_keys,
                    "active_keys": active_keys,
                    "keys_by_classification": keys_by_classification,
                    "master_key_id": self.master_key_id
                },
                "operation_statistics": {
                    "total_operations": total_operations,
                    "recent_operations_24h": recent_operations,
                    "operations_by_type": operations_by_type,
                    "success_rate": (len([op for op in self.operations if op.success]) / total_operations) * 100 if total_operations > 0 else 0
                },
                "policy_statistics": {
                    "total_policies": len(self.policies),
                    "active_policies": len([p for p in self.policies.values() if p.is_active])
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get encryption service status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global encryption service instance
encryption_service: Optional[EncryptionService] = None

def get_encryption_service(config: Dict[str, Any] = None) -> EncryptionService:
    """Get or create encryption service instance"""
    global encryption_service
    if encryption_service is None:
        encryption_service = EncryptionService(config)
    return encryption_service

async def start_encryption_service(config: Dict[str, Any] = None) -> EncryptionService:
    """Start encryption service"""
    service = get_encryption_service(config)
    await service.start()
    return service

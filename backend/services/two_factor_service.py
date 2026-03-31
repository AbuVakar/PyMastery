"""
Two-Factor Authentication (2FA) Service for PyMastery
Provides enterprise-grade two-factor authentication with multiple methods
"""

import logging
import json
import time
import secrets
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
from pathlib import Path
import hashlib
import hmac

logger = logging.getLogger(__name__)

class TwoFactorMethod(Enum):
    """Two-factor authentication methods"""
    TOTP = "totp"  # Time-based One-Time Password
    SMS = "sms"    # SMS verification
    EMAIL = "email"  # Email verification
    AUTHENTICATOR_APP = "authenticator_app"  # Google Authenticator, etc.
    BACKUP_CODES = "backup_codes"  # Backup recovery codes
    HARDWARE_TOKEN = "hardware_token"  # YubiKey, etc.
    BIOMETRIC = "biometric"  # Fingerprint, Face ID
    PUSH_NOTIFICATION = "push_notification"  # Mobile app push

class TwoFactorStatus(Enum):
    """Two-factor authentication status"""
    ENABLED = "enabled"
    DISABLED = "disabled"
    PENDING = "pending"
    LOCKED = "locked"
    EXPIRED = "expired"

class VerificationStatus(Enum):
    """Verification status"""
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"
    EXPIRED = "expired"
    RATE_LIMITED = "rate_limited"

@dataclass
class TwoFactorConfig:
    """Two-factor authentication configuration"""
    user_id: str
    method: TwoFactorMethod
    is_enabled: bool = False
    is_primary: bool = False
    secret_key: Optional[str] = None
    phone_number: Optional[str] = None
    email_address: Optional[str] = None
    backup_codes: List[str] = None
    hardware_token_id: Optional[str] = None
    biometric_data: Optional[str] = None
    push_device_id: Optional[str] = None
    created_at: datetime = None
    updated_at: datetime = None
    last_used: Optional[datetime] = None
    metadata: Dict[str, Any] = None

@dataclass
class TwoFactorSession:
    """Two-factor authentication session"""
    id: str
    user_id: str
    method: TwoFactorMethod
    session_token: str
    verification_code: str
    attempts: int = 0
    max_attempts: int = 3
    expires_at: datetime = None
    created_at: datetime = None
    verified_at: Optional[datetime] = None
    status: VerificationStatus = VerificationStatus.PENDING
    ip_address: str = ""
    user_agent: str = ""
    metadata: Dict[str, Any] = None

@dataclass
class TwoFactorAuditLog:
    """Two-factor authentication audit log"""
    id: str
    event_type: str
    user_id: str
    method: TwoFactorMethod
    session_id: Optional[str]
    ip_address: str
    user_agent: str
    timestamp: datetime
    success: bool
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None

class TwoFactorService:
    """Two-factor authentication service"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Service state
        self.is_running = False
        self.start_time = None
        
        # User configurations
        self.user_configs: Dict[str, List[TwoFactorConfig]] = {}  # user_id -> [configs]
        
        # Active sessions
        self.sessions: Dict[str, TwoFactorSession] = {}  # session_id -> session
        
        # Audit logs
        self.audit_logs: List[TwoFactorAuditLog] = []
        
        # Rate limiting
        self.rate_limits: Dict[str, Dict[str, Any]] = {}  # user_id -> {attempts, last_attempt}
        
        # HTTP session for external services
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Configuration
        self.totp_issuer = self.config.get("totp_issuer", "PyMastery")
        self.totp_digits = self.config.get("totp_digits", 6)
        self.totp_interval = self.config.get("totp_interval", 30)
        self.session_expiry_minutes = self.config.get("session_expiry_minutes", 10)
        self.max_attempts = self.config.get("max_attempts", 3)
        self.rate_limit_window_minutes = self.config.get("rate_limit_window_minutes", 15)
        self.max_attempts_per_window = self.config.get("max_attempts_per_window", 5)
        
        # SMS service configuration
        self.sms_service = self.config.get("sms_service", {})
        self.sms_provider = self.sms_service.get("provider", "twilio")
        self.sms_from_number = self.sms_service.get("from_number")
        self.sms_account_sid = self.sms_service.get("account_sid")
        self.sms_auth_token = self.sms_service.get("auth_token")
        
        # Email service configuration
        self.email_service = self.config.get("email_service", {})
        self.email_from = self.email_service.get("from_email", "noreply@pymastery.com")
        self.email_smtp_host = self.email_service.get("smtp_host")
        self.email_smtp_port = self.email_service.get("smtp_port", 587)
        self.email_smtp_username = self.email_service.get("smtp_username")
        self.email_smtp_password = self.email_service.get("smtp_password")
    
    async def start(self):
        """Start the two-factor authentication service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        
        # Create HTTP session
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        
        # Clean up expired sessions
        await self._cleanup_expired_sessions()
        
        logger.info("Two-factor authentication service started",
                   extra_fields={
                       "event_type": "2fa_service_started",
                       "supported_methods": [method.value for method in TwoFactorMethod],
                       "session_expiry_minutes": self.session_expiry_minutes,
                       "max_attempts": self.max_attempts
                   })
    
    async def stop(self):
        """Stop the two-factor authentication service"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Close HTTP session
        if self.session:
            await self.session.close()
        
        logger.info("Two-factor authentication service stopped",
                   extra_fields={
                       "event_type": "2fa_service_stopped"
                   })
    
    async def _cleanup_expired_sessions(self):
        """Clean up expired sessions"""
        current_time = datetime.now(timezone.utc)
        
        expired_sessions = []
        for session_id, session in self.sessions.items():
            if current_time > session.expires_at:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            session = self.sessions[session_id]
            session.status = VerificationStatus.EXPIRED
            
            # Log session expiration
            self._log_audit_event(
                event_type="session_expired",
                user_id=session.user_id,
                method=session.method,
                session_id=session_id,
                ip_address=session.ip_address,
                user_agent=session.user_agent,
                success=False,
                metadata={"expires_at": session.expires_at.isoformat()}
            )
            
            del self.sessions[session_id]
        
        if expired_sessions:
            logger.info(f"Cleaned up {len(expired_sessions)} expired 2FA sessions")
    
    def check_rate_limit(self, user_id: str) -> Tuple[bool, Optional[str]]:
        """Check if user is rate limited"""
        current_time = datetime.now(timezone.utc)
        
        # Get user rate limit info
        if user_id not in self.rate_limits:
            self.rate_limits[user_id] = {
                "attempts": 0,
                "last_attempt": current_time,
                "window_start": current_time
            }
        
        rate_info = self.rate_limits[user_id]
        
        # Reset window if needed
        window_start = rate_info["window_start"]
        if current_time - window_start > timedelta(minutes=self.rate_limit_window_minutes):
            rate_info["attempts"] = 0
            rate_info["window_start"] = current_time
        
        # Check if rate limited
        if rate_info["attempts"] >= self.max_attempts_per_window:
            return False, "Rate limit exceeded. Please try again later."
        
        return True, None
    
    def increment_rate_limit(self, user_id: str):
        """Increment rate limit counter"""
        if user_id in self.rate_limits:
            self.rate_limits[user_id]["attempts"] += 1
            self.rate_limits[user_id]["last_attempt"] = datetime.now(timezone.utc)
    
    def generate_totp_secret(self) -> str:
        """Generate TOTP secret key"""
        return pyotp.random_base32()
    
    def generate_totp_uri(self, secret: str, user_email: str, issuer: str = None) -> str:
        """Generate TOTP URI for QR code"""
        issuer_name = issuer or self.totp_issuer
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=issuer_name
        )
    
    def generate_qr_code(self, uri: str) -> str:
        """Generate QR code for TOTP setup"""
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """Generate backup recovery codes"""
        codes = []
        for _ in range(count):
            code = secrets.token_hex(4).upper()
            codes.append(code)
        return codes
    
    async def setup_totp(self, user_id: str, user_email: str) -> Dict[str, Any]:
        """Setup TOTP for user"""
        try:
            # Check rate limit
            can_proceed, error_message = self.check_rate_limit(user_id)
            if not can_proceed:
                return {"success": False, "error": error_message}
            
            # Generate secret
            secret = self.generate_totp_secret()
            
            # Generate URI and QR code
            uri = self.generate_totp_uri(secret, user_email)
            qr_code = self.generate_qr_code(uri)
            
            # Create TOTP config
            totp_config = TwoFactorConfig(
                id=f"totp_{user_id}_{int(time.time())}",
                user_id=user_id,
                method=TwoFactorMethod.TOTP,
                is_enabled=False,  # Not enabled until verified
                secret_key=secret,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            # Store configuration
            if user_id not in self.user_configs:
                self.user_configs[user_id] = []
            
            # Remove existing TOTP config if any
            self.user_configs[user_id] = [
                config for config in self.user_configs[user_id] 
                if config.method != TwoFactorMethod.TOTP
            ]
            
            self.user_configs[user_id].append(totp_config)
            
            # Generate backup codes
            backup_codes = self.generate_backup_codes()
            
            # Log setup event
            self._log_audit_event(
                event_type="totp_setup_initiated",
                user_id=user_id,
                method=TwoFactorMethod.TOTP,
                success=True,
                metadata={"secret_generated": True, "backup_codes_count": len(backup_codes)}
            )
            
            return {
                "success": True,
                "secret": secret,
                "qr_code": qr_code,
                "backup_codes": backup_codes,
                "instructions": {
                    "step1": "Scan the QR code with your authenticator app",
                    "step2": "Enter the 6-digit code to verify setup",
                    "step3": "Save your backup codes in a safe place"
                }
            }
        
        except Exception as e:
            logger.error(f"Error setting up TOTP: {e}")
            
            self._log_audit_event(
                event_type="totp_setup_failed",
                user_id=user_id,
                method=TwoFactorMethod.TOTP,
                success=False,
                error_message=str(e)
            )
            
            return {"success": False, "error": "Failed to setup TOTP"}
    
    async def verify_totp_setup(self, user_id: str, code: str) -> Dict[str, Any]:
        """Verify TOTP setup and enable it"""
        try:
            # Find TOTP config
            totp_config = None
            if user_id in self.user_configs:
                for config in self.user_configs[user_id]:
                    if config.method == TwoFactorMethod.TOTP and not config.is_enabled:
                        totp_config = config
                        break
            
            if not totp_config or not totp_config.secret_key:
                return {"success": False, "error": "TOTP setup not found"}
            
            # Verify code
            totp = pyotp.TOTP(totp_config.secret_key, digits=self.totp_digits, interval=self.totp_interval)
            if not totp.verify(code):
                return {"success": False, "error": "Invalid verification code"}
            
            # Enable TOTP
            totp_config.is_enabled = True
            totp_config.is_primary = len([c for c in self.user_configs[user_id] if c.is_enabled]) == 0
            totp_config.updated_at = datetime.now(timezone.utc)
            
            # Log verification
            self._log_audit_event(
                event_type="totp_setup_verified",
                user_id=user_id,
                method=TwoFactorMethod.TOTP,
                success=True,
                metadata={"is_primary": totp_config.is_primary}
            )
            
            return {
                "success": True,
                "message": "TOTP setup completed successfully",
                "is_primary": totp_config.is_primary
            }
        
        except Exception as e:
            logger.error(f"Error verifying TOTP setup: {e}")
            
            self._log_audit_event(
                event_type="totp_setup_verification_failed",
                user_id=user_id,
                method=TwoFactorMethod.TOTP,
                success=False,
                error_message=str(e)
            )
            
            return {"success": False, "error": "Failed to verify TOTP setup"}
    
    async def setup_sms(self, user_id: str, phone_number: str) -> Dict[str, Any]:
        """Setup SMS two-factor authentication"""
        try:
            # Check rate limit
            can_proceed, error_message = self.check_rate_limit(user_id)
            if not can_proceed:
                return {"success": False, "error": error_message}
            
            # Create SMS config
            sms_config = TwoFactorConfig(
                id=f"sms_{user_id}_{int(time.time())}",
                user_id=user_id,
                method=TwoFactorMethod.SMS,
                is_enabled=False,  # Not enabled until verified
                phone_number=phone_number,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            # Store configuration
            if user_id not in self.user_configs:
                self.user_configs[user_id] = []
            
            # Remove existing SMS config if any
            self.user_configs[user_id] = [
                config for config in self.user_configs[user_id] 
                if config.method != TwoFactorMethod.SMS
            ]
            
            self.user_configs[user_id].append(sms_config)
            
            # Send verification SMS
            verification_code = secrets.token_hex(3).upper()
            success = await self._send_sms_verification(phone_number, verification_code)
            
            if not success:
                return {"success": False, "error": "Failed to send verification SMS"}
            
            # Create verification session
            session_id = await self._create_verification_session(
                user_id=user_id,
                method=TwoFactorMethod.SMS,
                verification_code=verification_code,
                metadata={"phone_number": phone_number}
            )
            
            # Log setup event
            self._log_audit_event(
                event_type="sms_setup_initiated",
                user_id=user_id,
                method=TwoFactorMethod.SMS,
                session_id=session_id,
                success=True,
                metadata={"phone_number": phone_number}
            )
            
            return {
                "success": True,
                "session_id": session_id,
                "message": "Verification code sent to your phone",
                "expires_in_minutes": self.session_expiry_minutes
            }
        
        except Exception as e:
            logger.error(f"Error setting up SMS 2FA: {e}")
            
            self._log_audit_event(
                event_type="sms_setup_failed",
                user_id=user_id,
                method=TwoFactorMethod.SMS,
                success=False,
                error_message=str(e)
            )
            
            return {"success": False, "error": "Failed to setup SMS 2FA"}
    
    async def setup_email(self, user_id: str, email_address: str) -> Dict[str, Any]:
        """Setup email two-factor authentication"""
        try:
            # Check rate limit
            can_proceed, error_message = self.check_rate_limit(user_id)
            if not can_proceed:
                return {"success": False, "error": error_message}
            
            # Create email config
            email_config = TwoFactorConfig(
                id=f"email_{user_id}_{int(time.time())}",
                user_id=user_id,
                method=TwoFactorMethod.EMAIL,
                is_enabled=False,  # Not enabled until verified
                email_address=email_address,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            # Store configuration
            if user_id not in self.user_configs:
                self.user_configs[user_id] = []
            
            # Remove existing email config if any
            self.user_configs[user_id] = [
                config for config in self.user_configs[user_id] 
                if config.method != TwoFactorMethod.EMAIL
            ]
            
            self.user_configs[user_id].append(email_config)
            
            # Send verification email
            verification_code = secrets.token_hex(3).upper()
            success = await self._send_email_verification(email_address, verification_code)
            
            if not success:
                return {"success": False, "error": "Failed to send verification email"}
            
            # Create verification session
            session_id = await self._create_verification_session(
                user_id=user_id,
                method=TwoFactorMethod.EMAIL,
                verification_code=verification_code,
                metadata={"email_address": email_address}
            )
            
            # Log setup event
            self._log_audit_event(
                event_type="email_setup_initiated",
                user_id=user_id,
                method=TwoFactorMethod.EMAIL,
                session_id=session_id,
                success=True,
                metadata={"email_address": email_address}
            )
            
            return {
                "success": True,
                "session_id": session_id,
                "message": "Verification code sent to your email",
                "expires_in_minutes": self.session_expiry_minutes
            }
        
        except Exception as e:
            logger.error(f"Error setting up email 2FA: {e}")
            
            self._log_audit_event(
                event_type="email_setup_failed",
                user_id=user_id,
                method=TwoFactorMethod.EMAIL,
                success=False,
                error_message=str(e)
            )
            
            return {"success": False, "error": "Failed to setup email 2FA"}
    
    async def _create_verification_session(self, user_id: str, method: TwoFactorMethod, 
                                        verification_code: str, metadata: Dict[str, Any] = None) -> str:
        """Create verification session"""
        session_id = secrets.token_urlsafe(32)
        
        session = TwoFactorSession(
            id=session_id,
            user_id=user_id,
            method=method,
            session_token=secrets.token_urlsafe(64),
            verification_code=verification_code,
            max_attempts=self.max_attempts,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=self.session_expiry_minutes),
            created_at=datetime.now(timezone.utc),
            metadata=metadata or {}
        )
        
        self.sessions[session_id] = session
        
        return session_id
    
    async def _send_sms_verification(self, phone_number: str, code: str) -> bool:
        """Send SMS verification code"""
        try:
            if self.sms_provider == "twilio":
                return await self._send_twilio_sms(phone_number, code)
            else:
                # Mock implementation for other providers
                logger.info(f"Mock SMS sent to {phone_number}: Your verification code is {code}")
                return True
        
        except Exception as e:
            logger.error(f"Error sending SMS: {e}")
            return False
    
    async def _send_twilio_sms(self, phone_number: str, code: str) -> bool:
        """Send SMS via Twilio"""
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.sms_account_sid}/Messages.json"
            
            data = {
                "From": self.sms_from_number,
                "To": phone_number,
                "Body": f"Your PyMastery verification code is: {code}. This code expires in {self.session_expiry_minutes} minutes."
            }
            
            auth = aiohttp.BasicAuth(self.sms_account_sid, self.sms_auth_token)
            
            async with self.session.post(url, data=data, auth=auth) as response:
                return response.status == 201
        
        except Exception as e:
            logger.error(f"Error sending Twilio SMS: {e}")
            return False
    
    async def _send_email_verification(self, email_address: str, code: str) -> bool:
        """Send email verification code"""
        try:
            # Mock implementation - in production, use actual email service
            logger.info(f"Mock email sent to {email_address}: Your verification code is {code}")
            return True
        
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    async def verify_code(self, session_id: str, code: str, ip_address: str = "", 
                         user_agent: str = "") -> Dict[str, Any]:
        """Verify two-factor authentication code"""
        try:
            session = self.sessions.get(session_id)
            if not session:
                return {"success": False, "error": "Invalid or expired session"}
            
            # Check if session is expired
            if datetime.now(timezone.utc) > session.expires_at:
                session.status = VerificationStatus.EXPIRED
                return {"success": False, "error": "Session expired"}
            
            # Check attempts
            if session.attempts >= session.max_attempts:
                session.status = VerificationStatus.FAILED
                return {"success": False, "error": "Too many failed attempts"}
            
            # Increment attempts
            session.attempts += 1
            
            # Verify code
            if not secrets.compare_digest(session.verification_code.upper(), code.upper()):
                # Log failed attempt
                self._log_audit_event(
                    event_type="verification_failed",
                    user_id=session.user_id,
                    method=session.method,
                    session_id=session_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    error_message="Invalid code",
                    metadata={"attempt": session.attempts, "max_attempts": session.max_attempts}
                )
                
                return {"success": False, "error": "Invalid verification code"}
            
            # Mark session as verified
            session.status = VerificationStatus.VERIFIED
            session.verified_at = datetime.now(timezone.utc)
            
            # Enable the 2FA method
            await self._enable_2fa_method(session.user_id, session.method)
            
            # Log successful verification
            self._log_audit_event(
                event_type="verification_successful",
                user_id=session.user_id,
                method=session.method,
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent,
                success=True,
                metadata={"attempts": session.attempts}
            )
            
            return {
                "success": True,
                "message": "Two-factor authentication verified successfully",
                "method": session.method.value
            }
        
        except Exception as e:
            logger.error(f"Error verifying 2FA code: {e}")
            
            if session_id in self.sessions:
                self._log_audit_event(
                    event_type="verification_error",
                    user_id=self.sessions[session_id].user_id,
                    method=self.sessions[session_id].method,
                    session_id=session_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    error_message=str(e)
                )
            
            return {"success": False, "error": "Failed to verify code"}
    
    async def _enable_2fa_method(self, user_id: str, method: TwoFactorMethod):
        """Enable 2FA method for user"""
        if user_id not in self.user_configs:
            return
        
        for config in self.user_configs[user_id]:
            if config.method == method:
                config.is_enabled = True
                # Make primary if no other primary method exists
                if not any(c.is_primary for c in self.user_configs[user_id] if c.is_enabled):
                    config.is_primary = True
                config.updated_at = datetime.now(timezone.utc)
                break
    
    async def authenticate(self, user_id: str, method: TwoFactorMethod = None, 
                         ip_address: str = "", user_agent: str = "") -> Dict[str, Any]:
        """Initiate two-factor authentication"""
        try:
            # Get user's enabled 2FA methods
            enabled_methods = []
            if user_id in self.user_configs:
                enabled_methods = [
                    config for config in self.user_configs[user_id] 
                    if config.is_enabled
                ]
            
            if not enabled_methods:
                return {"success": False, "error": "No two-factor authentication methods enabled"}
            
            # Use specified method or primary method
            target_method = method
            if not target_method:
                primary_configs = [config for config in enabled_methods if config.is_primary]
                if primary_configs:
                    target_method = primary_configs[0].method
                else:
                    target_method = enabled_methods[0].method
            
            # Find config for target method
            target_config = None
            for config in enabled_methods:
                if config.method == target_method:
                    target_config = config
                    break
            
            if not target_config:
                return {"success": False, "error": f"Two-factor method {target_method.value} not found"}
            
            # Generate verification code
            verification_code = secrets.token_hex(3).upper()
            
            # Send code based on method
            if target_method == TwoFactorMethod.TOTP:
                # For TOTP, user uses their authenticator app
                return {
                    "success": True,
                    "method": target_method.value,
                    "message": "Enter the 6-digit code from your authenticator app",
                    "requires_manual_code": True
                }
            
            elif target_method == TwoFactorMethod.SMS and target_config.phone_number:
                success = await self._send_sms_verification(target_config.phone_number, verification_code)
                if not success:
                    return {"success": False, "error": "Failed to send SMS verification"}
            
            elif target_method == TwoFactorMethod.EMAIL and target_config.email_address:
                success = await self._send_email_verification(target_config.email_address, verification_code)
                if not success:
                    return {"success": False, "error": "Failed to send email verification"}
            
            else:
                return {"success": False, "error": f"Method {target_method.value} not properly configured"}
            
            # Create verification session
            session_id = await self._create_verification_session(
                user_id=user_id,
                method=target_method,
                verification_code=verification_code,
                metadata={"config_id": target_config.id}
            )
            
            # Log authentication initiation
            self._log_audit_event(
                event_type="authentication_initiated",
                user_id=user_id,
                method=target_method,
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent,
                success=True
            )
            
            return {
                "success": True,
                "method": target_method.value,
                "session_id": session_id,
                "message": f"Verification code sent via {target_method.value}",
                "expires_in_minutes": self.session_expiry_minutes
            }
        
        except Exception as e:
            logger.error(f"Error initiating 2FA authentication: {e}")
            
            self._log_audit_event(
                event_type="authentication_initiation_failed",
                user_id=user_id,
                method=method,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                error_message=str(e)
            )
            
            return {"success": False, "error": "Failed to initiate authentication"}
    
    async def verify_totp_code(self, user_id: str, code: str, ip_address: str = "", 
                               user_agent: str = "") -> Dict[str, Any]:
        """Verify TOTP code without session"""
        try:
            # Find TOTP config
            totp_config = None
            if user_id in self.user_configs:
                for config in self.user_configs[user_id]:
                    if config.method == TwoFactorMethod.TOTP and config.is_enabled:
                        totp_config = config
                        break
            
            if not totp_config or not totp_config.secret_key:
                return {"success": False, "error": "TOTP not configured"}
            
            # Verify code
            totp = pyotp.TOTP(totp_config.secret_key, digits=self.totp_digits, interval=self.totp_interval)
            if not totp.verify(code):
                return {"success": False, "error": "Invalid verification code"}
            
            # Update last used time
            totp_config.last_used = datetime.now(timezone.utc)
            
            # Log successful verification
            self._log_audit_event(
                event_type="totp_verification_successful",
                user_id=user_id,
                method=TwoFactorMethod.TOTP,
                ip_address=ip_address,
                user_agent=user_agent,
                success=True
            )
            
            return {
                "success": True,
                "message": "TOTP verification successful",
                "method": TwoFactorMethod.TOTP.value
            }
        
        except Exception as e:
            logger.error(f"Error verifying TOTP code: {e}")
            
            self._log_audit_event(
                event_type="totp_verification_failed",
                user_id=user_id,
                method=TwoFactorMethod.TOTP,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                error_message=str(e)
            )
            
            return {"success": False, "error": "Failed to verify TOTP code"}
    
    async def disable_2fa(self, user_id: str, method: TwoFactorMethod = None, 
                          password: str = None) -> Dict[str, Any]:
        """Disable two-factor authentication"""
        try:
            if user_id not in self.user_configs:
                return {"success": False, "error": "No 2FA methods configured"}
            
            # In production, verify password here
            # For now, we'll skip password verification
            
            if method:
                # Disable specific method
                configs_to_disable = [config for config in self.user_configs[user_id] if config.method == method]
            else:
                # Disable all methods
                configs_to_disable = self.user_configs[user_id]
            
            if not configs_to_disable:
                return {"success": False, "error": "No methods found to disable"}
            
            # Disable methods
            for config in configs_to_disable:
                config.is_enabled = False
                config.is_primary = False
                config.updated_at = datetime.now(timezone.utc)
            
            # Log disabling event
            self._log_audit_event(
                event_type="2fa_disabled",
                user_id=user_id,
                method=method if method else TwoFactorMethod.TOTP,  # Default to TOTP for logging
                success=True,
                metadata={"disabled_methods": [config.method.value for config in configs_to_disable]}
            )
            
            return {
                "success": True,
                "message": f"Two-factor authentication disabled for {len(configs_to_disable)} method(s)",
                "disabled_methods": [config.method.value for config in configs_to_disable]
            }
        
        except Exception as e:
            logger.error(f"Error disabling 2FA: {e}")
            
            self._log_audit_event(
                event_type="2fa_disable_failed",
                user_id=user_id,
                method=method if method else TwoFactorMethod.TOTP,
                success=False,
                error_message=str(e)
            )
            
            return {"success": False, "error": "Failed to disable two-factor authentication"}
    
    def get_user_2fa_methods(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's configured 2FA methods"""
        if user_id not in self.user_configs:
            return []
        
        methods = []
        for config in self.user_configs[user_id]:
            method_info = {
                "id": config.id,
                "method": config.method.value,
                "is_enabled": config.is_enabled,
                "is_primary": config.is_primary,
                "created_at": config.created_at.isoformat() if config.created_at else None,
                "last_used": config.last_used.isoformat() if config.last_used else None
            }
            
            # Add method-specific info
            if config.method == TwoFactorMethod.SMS:
                method_info["phone_number"] = config.phone_number
            elif config.method == TwoFactorMethod.EMAIL:
                method_info["email_address"] = config.email_address
            elif config.method == TwoFactorMethod.TOTP:
                method_info["has_secret"] = bool(config.secret_key)
            
            methods.append(method_info)
        
        return methods
    
    def _log_audit_event(self, event_type: str, user_id: str, method: TwoFactorMethod, 
                        session_id: str = None, ip_address: str = "", user_agent: str = "",
                        success: bool = True, error_message: str = None, metadata: Dict[str, Any] = None):
        """Log 2FA audit event"""
        audit_log = TwoFactorAuditLog(
            id=f"2fa_audit_{int(time.time())}_{secrets.token_hex(8)}",
            event_type=event_type,
            user_id=user_id,
            method=method,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.now(timezone.utc),
            success=success,
            error_message=error_message,
            metadata=metadata or {}
        )
        
        self.audit_logs.append(audit_log)
        
        # Keep only last 10000 audit logs
        if len(self.audit_logs) > 10000:
            self.audit_logs = self.audit_logs[-10000:]
        
        # Log to system logger
        log_level = logging.INFO if success else logging.WARNING
        logger.log(
            log_level,
            f"2FA Audit: {event_type}",
            extra_fields={
                "event_type": f"2fa_audit_{event_type}",
                "user_id": user_id,
                "method": method.value,
                "session_id": session_id,
                "success": success,
                "error_message": error_message
            }
        )
    
    def get_audit_logs(self, user_id: str = None, method: TwoFactorMethod = None,
                      event_type: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit logs with filtering"""
        filtered_logs = self.audit_logs
        
        # Apply filters
        if user_id:
            filtered_logs = [log for log in filtered_logs if log.user_id == user_id]
        
        if method:
            filtered_logs = [log for log in filtered_logs if log.method == method]
        
        if event_type:
            filtered_logs = [log for log in filtered_logs if log.event_type == event_type]
        
        # Sort by timestamp (newest first) and limit
        filtered_logs.sort(key=lambda x: x.timestamp, reverse=True)
        filtered_logs = filtered_logs[:limit]
        
        return [asdict(log) for log in filtered_logs]
    
    def get_2fa_statistics(self) -> Dict[str, Any]:
        """Get two-factor authentication statistics"""
        try:
            total_users = len(self.user_configs)
            enabled_users = len([uid for uid, configs in self.user_configs.items() 
                              if any(config.is_enabled for config in configs)])
            
            # Method statistics
            method_stats = {}
            for method in TwoFactorMethod:
                method_configs = []
                for configs in self.user_configs.values():
                    method_configs.extend([c for c in configs if c.method == method])
                
                method_stats[method.value] = {
                    "total_configured": len(method_configs),
                    "enabled": len([c for c in method_configs if c.is_enabled]),
                    "primary": len([c for c in method_configs if c.is_primary])
                }
            
            # Session statistics
            active_sessions = len([s for s in self.sessions.values() if s.status == VerificationStatus.PENDING])
            verified_sessions = len([s for s in self.sessions.values() if s.status == VerificationStatus.VERIFIED])
            failed_sessions = len([s for s in self.sessions.values() if s.status == VerificationStatus.FAILED])
            
            # Recent activity (last 24 hours)
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
            recent_verifications = len([log for log in self.audit_logs if log.timestamp > cutoff_time and log.success])
            recent_failures = len([log for log in self.audit_logs if log.timestamp > cutoff_time and not log.success])
            
            return {
                "user_statistics": {
                    "total_users": total_users,
                    "enabled_users": enabled_users,
                    "adoption_rate": (enabled_users / total_users) * 100 if total_users > 0 else 0
                },
                "method_statistics": method_stats,
                "session_statistics": {
                    "active_sessions": active_sessions,
                    "verified_sessions": verified_sessions,
                    "failed_sessions": failed_sessions,
                    "total_sessions": len(self.sessions)
                },
                "activity_statistics": {
                    "recent_verifications_24h": recent_verifications,
                    "recent_failures_24h": recent_failures,
                    "total_audit_logs": len(self.audit_logs)
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get 2FA statistics: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    def get_2fa_service_status(self) -> Dict[str, Any]:
        """Get two-factor authentication service status"""
        try:
            return {
                "service_status": {
                    "is_running": self.is_running,
                    "start_time": self.start_time.isoformat() if self.start_time else None,
                    "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
                },
                "configuration": {
                    "supported_methods": [method.value for method in TwoFactorMethod],
                    "totp_issuer": self.totp_issuer,
                    "totp_digits": self.totp_digits,
                    "totp_interval": self.totp_interval,
                    "session_expiry_minutes": self.session_expiry_minutes,
                    "max_attempts": self.max_attempts,
                    "rate_limit_window_minutes": self.rate_limit_window_minutes,
                    "max_attempts_per_window": self.max_attempts_per_window
                },
                "services": {
                    "sms_provider": self.sms_provider,
                    "sms_configured": bool(self.sms_account_sid and self.sms_auth_token),
                    "email_configured": bool(self.email_smtp_host and self.email_smtp_username)
                },
                "statistics": self.get_2fa_statistics(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get 2FA service status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global 2FA service instance
two_factor_service: Optional[TwoFactorService] = None

def get_two_factor_service(config: Dict[str, Any] = None) -> TwoFactorService:
    """Get or create two-factor authentication service instance"""
    global two_factor_service
    if two_factor_service is None:
        two_factor_service = TwoFactorService(config)
    return two_factor_service

async def start_two_factor_service(config: Dict[str, Any] = None) -> TwoFactorService:
    """Start two-factor authentication service"""
    service = get_two_factor_service(config)
    await service.start()
    return service

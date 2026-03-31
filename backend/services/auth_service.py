"""
Enhanced Authentication Service
Handles user authentication, JWT tokens, password reset, and email verification
"""

import os
import secrets
import hashlib
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple, List
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)
MIN_JWT_SECRET_LENGTH = 32
JWT_SECRET_PLACEHOLDER_FRAGMENTS = (
    "your-jwt-secret",
    "placeholder",
    "changeme",
    "replace-me",
    "example-secret",
    "generate-a-secret",
)


def utc_now() -> datetime:
    """Return current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


def ensure_utc(value: datetime) -> datetime:
    """Normalize possibly naive datetimes to UTC-aware."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def load_required_jwt_secret() -> str:
    """Load and validate the JWT signing secret from environment variables."""
    configured_secret = (os.getenv("JWT_SECRET_KEY") or "").strip()

    if not configured_secret:
        raise RuntimeError(
            "JWT_SECRET_KEY is required before starting the backend. "
            "Generate a strong secret with Python: import secrets; print(secrets.token_urlsafe(64))"
        )

    if len(configured_secret) < MIN_JWT_SECRET_LENGTH:
        raise RuntimeError(
            f"JWT_SECRET_KEY must be at least {MIN_JWT_SECRET_LENGTH} characters long. "
            "Generate a strong secret with Python: import secrets; print(secrets.token_urlsafe(64))"
        )

    normalized_secret = configured_secret.lower()
    if any(fragment in normalized_secret for fragment in JWT_SECRET_PLACEHOLDER_FRAGMENTS):
        raise RuntimeError(
            "JWT_SECRET_KEY is still set to a placeholder value. "
            "Generate a strong secret with Python: import secrets; print(secrets.token_urlsafe(64))"
        )

    return configured_secret

class AuthService:
    def __init__(self):
        self.secret_key = load_required_jwt_secret()
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 7
        self.reset_token_expire_hours = 1
        self.verification_token_expire_hours = 24
        
        # Email configuration
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_username = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL") or os.getenv("EMAIL_FROM", "noreply@pymastery.com")
        self.frontend_url = (
            os.getenv("FRONTEND_URL")
            or os.getenv("PUBLIC_APP_URL")
            or os.getenv("APP_URL")
            or "http://localhost:5173"
        )
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        try:
            # Generate salt and hash password
            salt = bcrypt.gensalt(rounds=12)
            hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
            return hashed.decode('utf-8')
        except Exception as e:
            logger.error(f"Error hashing password: {e}")
            raise HTTPException(status_code=500, detail="Password hashing failed")
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            return False
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        try:
            to_encode = data.copy()
            expire = utc_now() + timedelta(minutes=self.access_token_expire_minutes)
            to_encode.update({
                "exp": expire,
                "type": "access",
                "iat": utc_now()
            })
            
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            return encoded_jwt
        except Exception as e:
            logger.error(f"Error creating access token: {e}")
            raise HTTPException(status_code=500, detail="Token creation failed")
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        try:
            to_encode = data.copy()
            expire = utc_now() + timedelta(days=self.refresh_token_expire_days)
            to_encode.update({
                "exp": expire,
                "type": "refresh",
                "iat": utc_now()
            })
            
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            return encoded_jwt
        except Exception as e:
            logger.error(f"Error creating refresh token: {e}")
            raise HTTPException(status_code=500, detail="Refresh token creation failed")
    
    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check token type
            if payload.get("type") != token_type:
                raise HTTPException(status_code=401, detail="Invalid token type")
            
            # Check expiration
            exp_value = payload.get("exp")
            if exp_value is None:
                raise HTTPException(status_code=401, detail="Invalid token payload")

            if isinstance(exp_value, datetime):
                expires_at = ensure_utc(exp_value)
            else:
                expires_at = datetime.fromtimestamp(exp_value, tz=timezone.utc)

            if utc_now() > expires_at:
                raise HTTPException(status_code=401, detail="Token has expired")
            
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            logger.error(f"Error verifying token: {e}")
            raise HTTPException(status_code=401, detail="Token verification failed")
    
    def create_password_reset_token(self, user_id: str, email: str) -> Tuple[str, datetime]:
        """Create password reset token"""
        try:
            # Generate secure token
            token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            # Calculate expiration
            expires_at = utc_now() + timedelta(hours=self.reset_token_expire_hours)
            
            # Store token in database (this would be handled by the calling function)
            return token, expires_at
        except Exception as e:
            logger.error(f"Error creating password reset token: {e}")
            raise HTTPException(status_code=500, detail="Password reset token creation failed")
    
    def create_email_verification_token(self, user_id: str, email: str) -> Tuple[str, datetime]:
        """Create email verification token"""
        try:
            # Generate secure token
            token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            # Calculate expiration
            expires_at = utc_now() + timedelta(hours=self.verification_token_expire_hours)
            
            # Store token in database (this would be handled by the calling function)
            return token, expires_at
        except Exception as e:
            logger.error(f"Error creating email verification token: {e}")
            raise HTTPException(status_code=500, detail="Email verification token creation failed")
    
    def verify_token_hash(self, token: str, stored_hash: str) -> bool:
        """Verify token against stored hash"""
        try:
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            return token_hash == stored_hash
        except Exception as e:
            logger.error(f"Error verifying token hash: {e}")
            return False
    
    def generate_secure_password(self, length: int = 12) -> str:
        """Generate secure random password"""
        try:
            alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
            password = ''.join(secrets.choice(alphabet) for _ in range(length))
            
            # Ensure password meets security requirements
            if (any(c.islower() for c in password) and
                any(c.isupper() for c in password) and
                any(c.isdigit() for c in password) and
                any(c in "!@#$%^&*" for c in password)):
                return password
            else:
                return self.generate_secure_password(length)
        except Exception as e:
            logger.error(f"Error generating secure password: {e}")
            raise HTTPException(status_code=500, detail="Password generation failed")
    
    async def send_password_reset_email(self, email: str, token: str, user_name: str = None) -> bool:
        """Send password reset email"""
        try:
            reset_url = f"{self.frontend_url}/reset-password?token={token}"
            
            subject = "PyMastery - Password Reset Request"
            
            # Create HTML email
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }}
                    .content {{
                        background: #f9f9f9;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                        border: 1px solid #e0e0e0;
                    }}
                    .button {{
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        margin: 20px 0;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 30px;
                        color: #666;
                        font-size: 12px;
                    }}
                    .security-note {{
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        color: #856404;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🔐 PyMastery</h1>
                    <h2>Password Reset Request</h2>
                </div>
                <div class="content">
                    <p>Hi {user_name or 'there'},</p>
                    <p>We received a request to reset your password for your PyMastery account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                        {reset_url}
                    </p>
                    <div class="security-note">
                        <strong>⚠️ Security Notice:</strong><br>
                        • This link will expire in 1 hour<br>
                        • If you didn't request this, please ignore this email<br>
                        • Never share this link with anyone
                    </div>
                </div>
                <div class="footer">
                    <p>© 2024 PyMastery. All rights reserved.</p>
                    <p>If you have questions, contact us at support@pymastery.com</p>
                </div>
            </body>
            </html>
            """
            
            # Send email
            return await self._send_email(email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Error sending password reset email: {e}")
            return False
    
    async def send_email_verification_email(self, email: str, token: str, user_name: str = None) -> bool:
        """Send email verification email"""
        try:
            verification_url = f"{self.frontend_url}/verify-email?token={token}"
            
            subject = "PyMastery - Verify Your Email"
            
            # Create HTML email
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }}
                    .content {{
                        background: #f9f9f9;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                        border: 1px solid #e0e0e0;
                    }}
                    .button {{
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        margin: 20px 0;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 30px;
                        color: #666;
                        font-size: 12px;
                    }}
                    .benefits {{
                        background: #e8f5e8;
                        border: 1px solid #c3e6c3;
                        color: #155724;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎯 PyMastery</h1>
                    <h2>Verify Your Email</h2>
                </div>
                <div class="content">
                    <p>Hi {user_name or 'there'},</p>
                    <p>Welcome to PyMastery! To complete your registration, please verify your email address.</p>
                    <div style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email</a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                        {verification_url}
                    </p>
                    <div class="benefits">
                        <strong>🎉 What you'll get after verification:</strong><br>
                        • Full access to all coding challenges<br>
                        • Personalized learning recommendations<br>
                        • Progress tracking and achievements<br>
                        • Community features and collaboration
                    </div>
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <strong>⏰ Important:</strong><br>
                        • This link will expire in 24 hours<br>
                        • Check your spam folder if you don't see the email
                    </div>
                </div>
                <div class="footer">
                    <p>© 2024 PyMastery. All rights reserved.</p>
                    <p>If you have questions, contact us at support@pymastery.com</p>
                </div>
            </body>
            </html>
            """
            
            # Send email
            return await self._send_email(email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Error sending email verification email: {e}")
            return False
    
    async def send_password_changed_notification(self, email: str, user_name: str = None) -> bool:
        """Send password changed notification"""
        try:
            from services.email_service import build_frontend_url

            subject = "PyMastery - Password Changed Successfully"
            login_url = build_frontend_url("/login")
            
            # Create HTML email
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Changed</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }}
                    .content {{
                        background: #f9f9f9;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                        border: 1px solid #e0e0e0;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 30px;
                        color: #666;
                        font-size: 12px;
                    }}
                    .security-tips {{
                        background: #d4edda;
                        border: 1px solid #c3e6cb;
                        color: #155724;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🔒 PyMastery</h1>
                    <h2>Password Changed</h2>
                </div>
                <div class="content">
                    <p>Hi {user_name or 'there'},</p>
                    <p>Your password has been successfully changed for your PyMastery account.</p>
                    <div class="security-tips">
                        <strong>🔐 Security Tips:</strong><br>
                        • Use a strong, unique password<br>
                        • Enable two-factor authentication if available<br>
                        • Never share your password with anyone<br>
                        • Update your password regularly
                    </div>
                    <p>If you didn't make this change, please contact us immediately at <a href="mailto:support@pymastery.com">support@pymastery.com</a>.</p>
                    <p>You can now log in with your new password at <a href="{login_url}">PyMastery</a>.</p>
                </div>
                <div class="footer">
                    <p>© 2024 PyMastery. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            
            # Send email
            return await self._send_email(email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Error sending password changed notification: {e}")
            return False
    
    async def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email using SMTP"""
        try:
            from services.email_service import send_email

            return await send_email(to_email, subject, html_content)
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    def validate_password_strength(self, password: str) -> Tuple[bool, List[str]]:
        """Validate password strength"""
        errors = []
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        if not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one digit")
        
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            errors.append("Password must contain at least one special character")
        
        return len(errors) == 0, errors
    
    def validate_email_format(self, email: str) -> bool:
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def is_token_expired(self, expires_at: datetime) -> bool:
        """Check if token has expired"""
        return utc_now() > ensure_utc(expires_at)

# Global auth service instance
auth_service = AuthService()

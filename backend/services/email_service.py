import logging
import os
from email.message import EmailMessage
from urllib.parse import urlencode

import aiosmtplib

logger = logging.getLogger(__name__)

PLACEHOLDER_FRAGMENTS = ("your-", "example", "changeme", "replace-me", "placeholder")


def _looks_like_placeholder(value: str) -> bool:
    normalized = (value or "").strip().lower()
    if not normalized:
        return True

    return any(fragment in normalized for fragment in PLACEHOLDER_FRAGMENTS)


def _smtp_settings() -> dict:
    smtp_user = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER", "")

    return {
        "host": os.getenv("SMTP_HOST") or os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": smtp_user,
        "password": os.getenv("SMTP_PASSWORD", ""),
        "from_email": os.getenv("EMAIL_FROM") or os.getenv("FROM_EMAIL") or smtp_user or "noreply@pymastery.com",
    }


def get_frontend_base_url() -> str:
    candidates = (
        os.getenv("FRONTEND_URL"),
        os.getenv("PUBLIC_APP_URL"),
        os.getenv("APP_URL"),
    )

    for candidate in candidates:
        if candidate and candidate.strip():
            return candidate.rstrip("/")

    return "http://localhost:5173"


def build_frontend_url(path: str, query: dict | None = None) -> str:
    base_url = get_frontend_base_url()
    normalized_path = path if path.startswith("/") else f"/{path}"
    url = f"{base_url}{normalized_path}"

    if query:
        return f"{url}?{urlencode(query)}"

    return url


def get_support_email_address() -> str:
    candidates = (
        os.getenv("SUPPORT_EMAIL"),
        os.getenv("CONTACT_EMAIL"),
        os.getenv("SMTP_USERNAME"),
        os.getenv("SMTP_USER"),
        os.getenv("EMAIL_FROM"),
        os.getenv("FROM_EMAIL"),
    )

    for candidate in candidates:
        if candidate and candidate.strip() and not _looks_like_placeholder(candidate):
            return candidate

    return "support@pymastery.com"


def get_email_delivery_status() -> dict:
    settings = _smtp_settings()
    issues: list[str] = []

    if not settings["host"]:
        issues.append("SMTP host is missing")

    if _looks_like_placeholder(settings["user"]):
        issues.append("SMTP username is missing or still set to a placeholder value")

    if _looks_like_placeholder(settings["password"]):
        issues.append("SMTP password is missing or still set to a placeholder value")

    return {
        "configured": len(issues) == 0,
        "reason": "; ".join(issues) if issues else "",
        "settings": settings,
    }


async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    status = get_email_delivery_status()
    if not status["configured"]:
        logger.warning("SMTP configuration is unavailable. %s", status["reason"])
        return False

    settings = status["settings"]
    message = EmailMessage()
    message["From"] = settings["from_email"]
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content("Please enable HTML to view this email.")
    message.add_alternative(html_content, subtype="html")

    try:
        await aiosmtplib.send(
            message,
            hostname=settings["host"],
            port=settings["port"],
            start_tls=True,
            username=settings["user"],
            password=settings["password"],
            timeout=10,
        )
        logger.info("Email sent successfully to %s", to_email)
        return True
    except Exception as starttls_error:
        logger.warning("SMTP STARTTLS send failed (%s); retrying with implicit TLS", starttls_error)

        try:
            await aiosmtplib.send(
                message,
                hostname=settings["host"],
                port=465,
                use_tls=True,
                username=settings["user"],
                password=settings["password"],
                timeout=10,
            )
            logger.info("Email sent successfully to %s via implicit TLS", to_email)
            return True
        except Exception as ssl_error:
            logger.error("Failed to send email to %s: %s", to_email, ssl_error)
            return False


async def send_verification_email(email: str, token: str, name: str) -> bool:
    verification_link = build_frontend_url("/verify-email", {"token": token})
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Welcome to PyMastery, {name}!</h2>
        <p>We're thrilled to have you join our learning platform.</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_link}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p><a href="{verification_link}">{verification_link}</a></p>
        <br/>
        <p>Happy Learning!<br/>The PyMastery Team</p>
    </div>
    """
    return await send_email(email, "Verify your PyMastery account", html_content)


async def send_password_reset_email(email: str, token: str, name: str) -> bool:
    reset_link = build_frontend_url("/reset-password", {"token": token})
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Hi {name},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <br/>
        <p>The PyMastery Team</p>
    </div>
    """
    return await send_email(email, "Reset your PyMastery password", html_content)


async def send_login_otp_email(email: str, otp: str, name: str) -> bool:
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; text-align: center;">
        <h2>PyMastery Login Verification</h2>
        <p>Hi {name},</p>
        <p>Here is your one-time password (OTP) to complete your login:</p>
        <div style="margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background: #e0e7ff; padding: 10px 20px; border-radius: 8px;">{otp}</span>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you did not try to log in, please secure your account.</p>
        <br/>
        <p>The PyMastery Team</p>
    </div>
    """
    return await send_email(email, "Your Login Verification Code", html_content)

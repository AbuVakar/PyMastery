"""
Contact Us API - sends support emails when a user submits the contact form.
"""

import asyncio
import logging
import os

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from services.email_service import (
    build_frontend_url,
    get_email_delivery_status,
    get_support_email_address,
    send_email,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Contact"])


class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str = "General Inquiry"
    message: str


def _contact_recipient() -> str:
    return os.getenv("CONTACT_ADMIN_EMAIL") or get_support_email_address()


@router.post("/contact")
async def submit_contact(form: ContactForm):
    """Handle contact form submission and send an email to support plus an acknowledgement to the user."""
    email_status = get_email_delivery_status()
    admin_email = _contact_recipient()

    if not email_status["configured"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service not configured (demo mode). Contact messages cannot be delivered from this environment.",
        )

    if not admin_email:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Contact email is unavailable because no support inbox has been configured.",
        )

    try:
        learn_url = build_frontend_url("/#learn")
        login_url = build_frontend_url("/login")

        admin_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">New Contact Form Submission</h2>
                <p style="color: #bfdbfe; margin: 5px 0 0;">PyMastery Support Dashboard</p>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; color: #6b7280; width: 30%;">From:</td>
                        <td style="padding: 8px; color: #111827;">{form.name}</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 8px; font-weight: bold; color: #6b7280;">Email:</td>
                        <td style="padding: 8px;"><a href="mailto:{form.email}" style="color: #2563eb;">{form.email}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; color: #6b7280;">Subject:</td>
                        <td style="padding: 8px; color: #111827;">{form.subject}</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 8px; font-weight: bold; color: #6b7280; vertical-align: top;">Message:</td>
                        <td style="padding: 8px; color: #111827; line-height: 1.6;">{form.message}</td>
                    </tr>
                </table>
                <div style="margin-top: 20px; padding: 12px; background: #eff6ff; border-radius: 6px; border-left: 4px solid #2563eb;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">
                        Reply directly to <strong>{form.email}</strong> to respond to this inquiry.
                    </p>
                </div>
            </div>
        </div>
        """

        user_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">We received your message</h2>
                <p style="color: #bfdbfe; margin: 5px 0 0;">PyMastery Support</p>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
                <p>Hi <strong>{form.name}</strong>,</p>
                <p>Thank you for reaching out. We've received your message and our team will get back to you within <strong>24 hours</strong>.</p>
                <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 0; font-weight: bold; color: #6b7280; font-size: 13px;">YOUR MESSAGE:</p>
                    <p style="margin: 8px 0 0; color: #374151;">{form.message}</p>
                </div>
                <p>While you wait, you can explore the platform here:</p>
                <ul style="color: #2563eb; padding-left: 20px;">
                    <li><a href="{learn_url}" style="color: #2563eb;">Explore Learning Paths</a></li>
                    <li><a href="{login_url}" style="color: #2563eb;">Sign in to your account</a></li>
                </ul>
                <br/>
                <p>Best regards,<br/><strong>The PyMastery Team</strong></p>
            </div>
        </div>
        """

        admin_result, user_result = await asyncio.gather(
            send_email(
                admin_email,
                f"[PyMastery Contact] {form.subject} - from {form.name}",
                admin_html,
            ),
            send_email(
                form.email,
                "We received your message - PyMastery Support",
                user_html,
            ),
            return_exceptions=True,
        )

        admin_sent = False if isinstance(admin_result, Exception) else bool(admin_result)
        user_sent = False if isinstance(user_result, Exception) else bool(user_result)

        if not admin_sent:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Contact messages could not be delivered right now. Please try again later.",
            )

        logger.info("Contact form submitted by %s: %s", form.email, form.subject)
        if not user_sent:
            logger.warning("Contact acknowledgement email could not be delivered to %s", form.email)
            return {
                "success": True,
                "message": "Message received! We'll be in touch soon.",
                "warning": "Your confirmation email could not be delivered, but the support team still received your message.",
            }

        return {"success": True, "message": "Message received! We'll be in touch soon."}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Contact form error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to submit contact form")

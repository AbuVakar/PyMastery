import asyncio
import os

from dotenv import load_dotenv
load_dotenv(dotenv_path='backend/.env')

import aiosmtplib
from email.message import EmailMessage

async def test_email():
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    
    print(f"Testing SMTP connection...")
    print(f"Host: {smtp_host}:{smtp_port}")
    print(f"User: {smtp_user}")
    print(f"Password length: {len(smtp_password)} chars")
    
    message = EmailMessage()
    message["From"] = smtp_user
    message["To"] = smtp_user  # Send to self as test
    message["Subject"] = "PyMastery - Email Test"
    message.add_alternative("""
    <div style='font-family:Arial;padding:20px;background:#f0f4ff;border-radius:8px'>
        <h2 style='color:#4F46E5'>Bhai yeh email aaya!</h2>
        <p>PyMastery ka Email System ab fully working hai!</p>
        <p>OTP aur verification emails project mein kaam karenge ab.</p>
    </div>
    """, subtype='html')
    
    try:
        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            start_tls=True,
            username=smtp_user,
            password=smtp_password,
        )
        print("\n SUCCESS! Test email sent!")
        print(f"Check inbox at: {smtp_user}")
    except Exception as e:
        print(f"\n FAILED: {str(e)}")

asyncio.run(test_email())

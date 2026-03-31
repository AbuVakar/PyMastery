from fastapi import APIRouter, Request, HTTPException
from datetime import datetime, timezone
import os
import psutil
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/security", tags=["Security"])

@router.get("/config")
async def get_security_config():
    """Get security configuration (public info only)"""
    return {
        "security_features": {
            "authentication": {
                "jwt_enabled": True,
                "token_expiry": "30 minutes",
                "refresh_token_expiry": "7 days"
            },
            "rate_limiting": {
                "enabled": True,
                "default_limit": "100 requests/hour",
                "auth_limit": "10 requests/minute"
            },
            "input_validation": {
                "enabled": True,
                "xss_protection": True,
                "sql_injection_protection": True
            },
            "headers": {
                "csp": "enabled",
                "hsts": "enabled",
                "x_frame_options": "DENY",
                "x_content_type_options": "nosniff"
            }
        },
        "public_paths": [
            "/api/health",
            "/api/auth/login",
            "/api/auth/register",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/security/config"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/validate-input")
async def validate_input_endpoint(request: Request):
    """Validate input for security threats"""
    try:
        # Get input from request body
        body = await request.body()
        input_data = body.decode('utf-8', errors='ignore')
        
        # Simple validation logic (placeholder for actual sanitization logic)
        from services.input_sanitizer import sanitizer
        is_safe = sanitizer.is_safe(input_data)
        
        return {
            "is_safe": is_safe,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Input validation error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

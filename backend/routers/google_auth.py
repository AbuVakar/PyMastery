"""
Google OAuth 2.0 Authentication Router
Handles Sign in with Google for PyMastery.
"""

import logging
import os
import urllib.parse
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from pydantic import BaseModel

from database.mongodb import get_database
from services.auth_service import auth_service
from services.email_service import build_frontend_url

load_dotenv(override=True)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth/google", tags=["Google OAuth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
SCOPES = "openid email profile"
PLACEHOLDER_FRAGMENTS = ("your-google-client", "placeholder", "example", "changeme", "replace-me")


class GoogleTokenRequest(BaseModel):
    """Frontend sends the auth code via this model (alternative to redirect flow)."""

    code: str
    redirect_uri: Optional[str] = None


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _looks_like_placeholder(value: str) -> bool:
    normalized = (value or "").strip().lower()
    if not normalized:
        return True

    return any(fragment in normalized for fragment in PLACEHOLDER_FRAGMENTS)


def _google_settings() -> Dict[str, str]:
    return {
        "client_id": os.getenv("GOOGLE_CLIENT_ID", "").strip(),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", "").strip(),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback").strip(),
    }


def _google_oauth_status() -> Dict[str, str | bool]:
    settings = _google_settings()
    issues: list[str] = []

    if _looks_like_placeholder(settings["client_id"]):
        issues.append("GOOGLE_CLIENT_ID is missing or still set to a placeholder value")

    if _looks_like_placeholder(settings["client_secret"]):
        issues.append("GOOGLE_CLIENT_SECRET is missing or still set to a placeholder value")

    if not settings["redirect_uri"]:
        issues.append("GOOGLE_REDIRECT_URI is missing")

    return {
        "configured": len(issues) == 0,
        "reason": "; ".join(issues) if issues else "",
        **settings,
    }


def _resolve_source(source: Optional[str]) -> str:
    return source if source in {"login", "signup"} else "login"


def _redirect_to_frontend_error(source: Optional[str], error: str) -> RedirectResponse:
    resolved_source = _resolve_source(source)
    return RedirectResponse(build_frontend_url(f"/{resolved_source}", {"error": error}))


async def _exchange_code_for_tokens(code: str, redirect_uri: str, settings: Dict[str, str | bool]) -> Dict[str, Any]:
    """Exchange Google auth code for access + ID tokens."""

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings["client_id"],
                "client_secret": settings["client_secret"],
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )

    if response.status_code != 200:
        logger.error("Google token exchange failed: %s", response.text)
        raise HTTPException(status_code=400, detail="Google token exchange failed")

    return response.json()


async def _get_google_user(access_token: str) -> Dict[str, Any]:
    """Fetch the user's Google profile."""

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            GOOGLE_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch Google profile")

    return response.json()


async def _upsert_google_user(google_user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Find existing user by email or google_id, or create a new one.
    Returns the stored user document.
    """

    db = await get_database()

    google_id = google_user.get("id") or google_user.get("sub", "")
    email = google_user.get("email", "").lower().strip()
    name = google_user.get("name", "")
    avatar = google_user.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    existing = await db.users.find_one({"$or": [{"google_id": google_id}, {"email": email}]})

    if existing:
        update: Dict[str, Any] = {"last_login": _utc_now().isoformat(), "is_active": True}
        if not existing.get("google_id"):
            update["google_id"] = google_id
        if not existing.get("avatar") and avatar:
            update["avatar"] = avatar
        await db.users.update_one({"_id": existing["_id"]}, {"$set": update})
        existing.update(update)
        return existing

    new_user: Dict[str, Any] = {
        "name": name,
        "email": email,
        "google_id": google_id,
        "avatar": avatar,
        "password_hash": None,
        "role": "user",
        "role_track": "general",
        "is_active": True,
        "is_verified": True,
        "auth_provider": "google",
        "created_at": _utc_now().isoformat(),
        "last_login": _utc_now().isoformat(),
        "subscription": "free",
    }
    result = await db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return new_user


def _build_jwt_response(user: Dict[str, Any]) -> Dict[str, Any]:
    """Create JWT tokens and user payload identical to regular login."""

    user_id = str(user["_id"])
    payload = {
        "sub": user_id,
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
    }

    access_token = auth_service.create_access_token(payload)
    refresh_token = auth_service.create_refresh_token({"sub": user_id})

    user_data = {
        "id": user_id,
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
        "role_track": user.get("role_track", "general"),
        "avatar": user.get("avatar", ""),
        "subscription": user.get("subscription", "free"),
        "auth_provider": user.get("auth_provider", "google"),
        "is_verified": True,
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 3600,
        "user": user_data,
    }


@router.get("/login")
async def google_login(source: Optional[str] = "login"):
    """
    Generate Google OAuth URL and redirect the browser.
    Frontend calls: window.location.assign('/api/v1/auth/google/login?source=login')
    """

    settings = _google_oauth_status()
    if not settings["configured"]:
        return _redirect_to_frontend_error(source, "google_not_configured")

    params = {
        "client_id": settings["client_id"],
        "redirect_uri": settings["redirect_uri"],
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "select_account",
        "state": _resolve_source(source),
    }
    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/callback")
async def google_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    """
    Google redirects here with an authorization code.
    We exchange it for tokens, upsert the user, issue JWTs,
    and redirect to the frontend success handler.
    """

    source = _resolve_source(state)

    if error:
        logger.warning("Google OAuth error: %s", error)
        return _redirect_to_frontend_error(source, "google_cancelled")

    if not code:
        return _redirect_to_frontend_error(source, "no_code")

    settings = _google_oauth_status()
    if not settings["configured"]:
        return _redirect_to_frontend_error(source, "google_not_configured")

    try:
        tokens = await _exchange_code_for_tokens(code, str(settings["redirect_uri"]), settings)
        access_token = tokens.get("access_token", "")
        google_user = await _get_google_user(access_token)
        user = await _upsert_google_user(google_user)
        jwt_data = _build_jwt_response(user)

        return RedirectResponse(
            build_frontend_url(
                "/auth/google/success",
                {
                    "access_token": jwt_data["access_token"],
                    "refresh_token": jwt_data["refresh_token"],
                    "expires_in": jwt_data["expires_in"],
                    "user_id": jwt_data["user"]["id"],
                    "user_name": jwt_data["user"]["name"],
                    "user_email": jwt_data["user"]["email"],
                    "user_avatar": jwt_data["user"]["avatar"],
                },
            )
        )
    except HTTPException as exc:
        logger.warning("Google OAuth callback failed with HTTP error: %s", exc.detail)
        return _redirect_to_frontend_error(source, "google_failed")
    except Exception as exc:
        logger.error("Google OAuth callback error: %s", exc)
        return _redirect_to_frontend_error(source, "google_failed")


@router.post("/token")
async def google_token_exchange(body: GoogleTokenRequest):
    """
    Alternative: frontend gets the code itself and POSTs it here.
    Returns JSON with access_token, refresh_token, and user.
    """

    settings = _google_oauth_status()
    if not settings["configured"]:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured for this environment")

    redirect_uri = body.redirect_uri or str(settings["redirect_uri"])

    try:
        tokens = await _exchange_code_for_tokens(body.code, redirect_uri, settings)
        google_user = await _get_google_user(tokens.get("access_token", ""))
        user = await _upsert_google_user(google_user)
        return _build_jwt_response(user)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Google token exchange error: %s", exc)
        raise HTTPException(status_code=500, detail="Google authentication failed")

"""
Services package initialization.

Keep this module side-effect free so importing a single service module does not
eagerly import the rest of the service layer and fail backend startup on
unrelated optional dependencies.
"""

__all__ = [
    "openai_service",
    "user_service",
    "auth_service",
    "judge0_service",
    "ai_service",
    "gemini_service",
    "analytics_service",
    "security",
]

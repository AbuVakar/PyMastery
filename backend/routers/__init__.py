"""
Router package initialization.

Avoid eager router imports here so importing a single router does not pull in
every optional router and service dependency during app startup.
"""

__all__ = [
    "auth",
    "ai_tutor",
    "dashboard",
    "code_execution",
    "users",
    "content",
]

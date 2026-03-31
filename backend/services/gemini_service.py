"""
Google Gemini AI service for PyMastery.

Uses live Gemini output when configuration is valid and falls back to a clearly
marked backup tutor response when it is not.
"""

import asyncio
import logging
import os
import time
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger(__name__)
_GEMINI_IMPORT_ERROR: Optional[Exception] = None
genai = None
genai_types = None

DEFAULT_GEMINI_MODEL = "gemini-flash-latest"
PLACEHOLDER_FRAGMENTS = ("your-", "placeholder", "changeme", "replace-me", "example")
DEMO_MODE_AI_REASON = "Demo Mode AI is active in this environment."
LIVE_GEMINI_UNAVAILABLE_REASON = "Live Gemini output is unavailable right now."
GEMINI_QUOTA_EXHAUSTED_REASON = "Demo Mode AI is active because the current Gemini quota has been reached."
GEMINI_MODEL_UNAVAILABLE_REASON = "Demo Mode AI is active because the configured Gemini model is unavailable."
GEMINI_NETWORK_UNAVAILABLE_REASON = "Demo Mode AI is active because Gemini is temporarily unreachable."
SAFETY_SETTINGS = [
    ("HARM_CATEGORY_HARASSMENT", "BLOCK_MEDIUM_AND_ABOVE"),
    ("HARM_CATEGORY_HATE_SPEECH", "BLOCK_MEDIUM_AND_ABOVE"),
    ("HARM_CATEGORY_SEXUALLY_EXPLICIT", "BLOCK_MEDIUM_AND_ABOVE"),
    ("HARM_CATEGORY_DANGEROUS_CONTENT", "BLOCK_MEDIUM_AND_ABOVE"),
]

try:
    from google import genai as google_genai
    from google.genai import types as google_genai_types

    genai = google_genai
    genai_types = google_genai_types
    GEMINI_AVAILABLE = True
except ImportError as exc:
    GEMINI_AVAILABLE = False
    _GEMINI_IMPORT_ERROR = exc
except Exception as exc:
    GEMINI_AVAILABLE = False
    _GEMINI_IMPORT_ERROR = exc


def _looks_like_placeholder(value: Optional[str]) -> bool:
    normalized = (value or "").strip().lower()
    if not normalized:
        return True
    return any(fragment in normalized for fragment in PLACEHOLDER_FRAGMENTS)


class GeminiService:
    """Google Gemini AI service for educational content generation."""

    def __init__(self) -> None:
        # Load main key and optional backup keys from environment
        raw_key = (os.getenv("GEMINI_API_KEY") or "").strip()
        backup_key_1 = (os.getenv("GEMINI_API_KEY_2") or "").strip()
        backup_key_2 = (os.getenv("GEMINI_API_KEY_3") or "").strip()

        keys_to_test = [raw_key, backup_key_1, backup_key_2]
        self.api_keys = [k for k in keys_to_test if k and not _looks_like_placeholder(k)]

        self.current_key_idx = 0
        self._active_key_idx = -1
        self.model_name = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
        self.status_cache_ttl_seconds = max(
            10,
            int(os.getenv("GEMINI_STATUS_CACHE_TTL_SECONDS", "60")),
        )
        self.client = None
        self.is_available = False
        self.unavailable_reason = ""
        self.runtime_available = False
        self.runtime_unavailable_reason = ""
        self.last_status_probe_at = 0.0

        logger.debug("GEMINI API Keys loaded: %d", len(self.api_keys))

        if not GEMINI_AVAILABLE:
            self.unavailable_reason = "Google GenAI SDK is not installed correctly."
            self.runtime_unavailable_reason = DEMO_MODE_AI_REASON
            logger.info("Google GenAI SDK unavailable; fallback responses enabled")
            if _GEMINI_IMPORT_ERROR is not None:
                logger.debug("Gemini import detail: %s", _GEMINI_IMPORT_ERROR)
            return

        if not self.api_keys:
            self.unavailable_reason = (
                "No valid GEMINI_API_KEY available."
            )
            self.runtime_unavailable_reason = DEMO_MODE_AI_REASON
            logger.info("GEMINI_API_KEY is missing; fallback responses enabled")
            return

        try:
            logger.debug("Configuring Gemini API client (google-genai)...")
            self.client = genai.Client(api_key=self.api_keys[self.current_key_idx])
            self._active_key_idx = self.current_key_idx
            self.is_available = True
            self.unavailable_reason = ""
            self.runtime_available = True
            self.runtime_unavailable_reason = ""
            logger.info("Gemini AI service initialized successfully")
        except Exception as exc:
            logger.error("Failed to initialize Gemini AI service: %s", exc)
            self.unavailable_reason = f"Gemini configuration failed: {exc}"
            self.runtime_unavailable_reason = DEMO_MODE_AI_REASON
            self.is_available = False

    async def generate_ai_response(
        self,
        message: str,
        message_type: str = "general",
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not self.is_available:
            logger.debug("Using fallback - Gemini not available")
            return self._get_fallback_response(message, message_type, DEMO_MODE_AI_REASON)

        try:
            prompt = self._create_educational_prompt(message, message_type, context)
            response = await self._generate_with_gemini(prompt)
            structured_response = self._parse_gemini_response(response, message_type)
            self._record_runtime_success()
            logger.debug("Gemini API call successful")
            return structured_response
        except Exception as exc:
            logger.error("Gemini AI generation failed: %s", exc)
            public_reason = self._get_public_failure_reason(exc)
            self._record_runtime_failure(public_reason)
            return self._get_fallback_response(
                message,
                message_type,
                public_reason,
            )

    async def _generate_with_gemini(self, prompt: str) -> str:
        if not self.api_keys or not genai_types:
            raise RuntimeError("Gemini client is not initialized")

        generation_config = genai_types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=800,
            top_p=0.9,
            top_k=40,
            safety_settings=[
                genai_types.SafetySetting(category=category, threshold=threshold)
                for category, threshold in SAFETY_SETTINGS
            ],
        )

        loop = asyncio.get_running_loop()
        
        last_exc = None
        max_attempts = len(self.api_keys)
        
        for attempt in range(max_attempts):
            try:
                if self._active_key_idx != self.current_key_idx:
                    self.client = genai.Client(api_key=self.api_keys[self.current_key_idx])
                    self._active_key_idx = self.current_key_idx

                response = await loop.run_in_executor(
                    None,
                    lambda: self.client.models.generate_content(
                        model=self.model_name,
                        contents=prompt,
                        config=generation_config,
                    ),
                )

                response_text = self._extract_response_text(response)
                if not response_text:
                    raise ValueError("Gemini API returned an empty response")

                return response_text
                
            except Exception as exc:
                last_exc = exc
                reason = self._get_public_failure_reason(exc)
                if reason == GEMINI_QUOTA_EXHAUSTED_REASON:
                    logger.warning("Gemini quota exhausted for key index %d, trying next key.", self.current_key_idx)
                    self.current_key_idx = (self.current_key_idx + 1) % len(self.api_keys)
                    continue
                else:
                    logger.error("Gemini API call failed: %s", exc)
                    raise
                    
        raise last_exc

    @staticmethod
    def _extract_response_text(response: Any) -> str:
        direct_text = getattr(response, "text", None)
        if isinstance(direct_text, str) and direct_text.strip():
            return direct_text.strip()

        collected_parts: List[str] = []
        candidates = getattr(response, "candidates", None) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None) or []
            for part in parts:
                part_text = getattr(part, "text", None)
                if isinstance(part_text, str) and part_text:
                    collected_parts.append(part_text)

        return "".join(collected_parts).strip()

    def _create_educational_prompt(
        self,
        message: str,
        message_type: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        _ = context
        base_context = "AI programming tutor. Be concise, helpful, educational."

        if message_type == "greeting":
            return f"""{base_context}

User: "{message}"

Respond in this format:

## Welcome to PyMastery AI Mentor!
Brief intro (1-2 sentences).

### Key Points
- Point 1
- Point 2
- Point 3

What would you like to start with?"""

        if message_type == "question":
            return f"""{base_context}

User asks: "{message}"

Respond in this format:

## [Topic Name]
Brief definition (1-2 sentences).

### Key Points
- Point 1
- Point 2
- Point 3

### Example
```python
# code here
```

### Next Steps
Suggest 1-2 things to explore next.

Aim for 100-150 words."""

        if message_type == "code_help":
            return f"""{base_context}

User needs help with: "{message}"

Respond in this format:

## Issue Identified
Brief explanation of the problem.

### Key Points
- Point 1
- Point 2
- Point 3

### Corrected Code
```python
# fixed code here
```

### Why This Works
Explain the fix briefly."""

        if message_type == "explanation":
            return f"""{base_context}

User wants explanation of: "{message}"

Respond in this format:

## {message[:50]}
Core concept in 1-2 sentences.

### Key Points
- Key aspect 1
- Key aspect 2
- Key aspect 3

### Quick Example
```python
# example
```

Aim for 100-120 words."""

        return f"""{base_context}

User: "{message}"

Respond in this format:

## Answer
Direct answer (2-3 sentences).

### Key Points
- Key point 1
- Key point 2
- Key point 3

### Example (if applicable)
```python
# code if relevant
```

Be clear, educational, and complete."""

    def _parse_gemini_response(self, gemini_response: str, message_type: str) -> Dict[str, Any]:
        emotional_tones = {
            "greeting": "friendly",
            "question": "educational",
            "code_help": "supportive",
            "explanation": "educational",
            "encouragement": "empathetic",
        }

        return {
            "response": gemini_response,
            "message_type": message_type,
            "suggestions": self._generate_suggestions(message_type),
            "next_steps": self._generate_next_steps(message_type),
            "emotional_tone": emotional_tones.get(message_type, "supportive"),
            "confidence": 0.85,
            "learning_objectives": self._generate_learning_objectives(gemini_response, message_type),
            "follow_up_questions": self._generate_follow_up_questions(gemini_response),
            "provider": "gemini",
            "is_fallback": False,
            "fallback_reason": None,
        }

    def _generate_learning_objectives(self, response: str, message_type: str) -> List[str]:
        _ = response
        objectives_map = {
            "greeting": ["Get familiar with the platform", "Set learning goals", "Choose starting topic"],
            "question": ["Understand core concepts", "Apply knowledge practically", "Build confidence"],
            "code_help": ["Identify and fix errors", "Learn debugging techniques", "Improve coding skills"],
            "explanation": ["Grasp fundamental concepts", "Connect theory to practice", "Apply in projects"],
            "encouragement": ["Maintain motivation", "Overcome challenges", "Build resilience"],
        }
        return objectives_map.get(message_type, ["Learn effectively", "Apply knowledge", "Build skills"])

    def _generate_suggestions(self, message_type: str) -> List[str]:
        suggestions_map = {
            "greeting": ["Start with Python basics", "Explore course catalog", "Set up development environment"],
            "question": ["Try similar examples", "Practice with exercises", "Review related concepts"],
            "code_help": ["Break down the problem", "Test each component", "Check documentation"],
            "explanation": ["Take notes", "Create mind maps", "Teach someone else"],
            "encouragement": ["Take a break", "Review progress", "Try a different approach"],
        }
        return suggestions_map.get(message_type, ["Practice regularly", "Ask questions", "Learn from examples"])

    def _generate_next_steps(self, message_type: str) -> List[str]:
        steps_map = {
            "greeting": ["Choose your first programming language", "Complete introductory course", "Build first project"],
            "question": ["Apply concept to a problem", "Explore advanced topics", "Share with others"],
            "code_help": ["Practice similar problems", "Read error messages carefully", "Use debugging tools"],
            "explanation": ["Implement the concept", "Find real-world examples", "Teach someone else"],
            "encouragement": ["Set small achievable goals", "Track your progress", "Celebrate small wins"],
        }
        return steps_map.get(message_type, ["Continue learning", "Practice consistently", "Build projects"])

    def _generate_follow_up_questions(self, response: str) -> List[str]:
        _ = response
        return [
            "What part of this seems most challenging?",
            "How would you apply this to a real problem?",
            "What would you like to learn next?",
            "Can you think of examples where this applies?",
        ]

    def _get_fallback_response(
        self,
        message: str,
        message_type: str = "general",
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        _ = message
        fallback_responses = {
            "greeting": "## Welcome to PyMastery AI Mentor!\n\nI'm your AI programming tutor, here to help you learn programming in a way that works best for you.\n\n### Key Points\n- Personalized learning paths\n- Step-by-step guidance\n- Interactive coding help\n\nWhat would you like to explore today?",
            "question": "## Great Question!\n\nLet me help you understand this concept clearly and step by step.\n\n### Key Points\n- Break down complex ideas\n- Learn with practical examples\n- Build confidence gradually\n\nWould you like me to explain this in more detail?",
            "code_help": "## Code Help\n\nI can see you're working on a coding challenge. Let's approach this systematically.\n\n### Key Points\n- Understand the problem first\n- Identify issues step by step\n- Practice good debugging habits\n\nLet's work through this together!",
            "explanation": "## Important Concept\n\nThis is a fundamental concept in programming. Let me explain it in a way that makes sense.\n\n### Key Points\n- Focus on practical understanding\n- Connect theory to real code\n- Learn by doing\n\nReady to dive deeper?",
            "encouragement": "## You're Doing Great!\n\nEvery programmer faces challenges as part of learning.\n\n### Key Points\n- Progress takes time\n- Every challenge teaches something\n- You're building valuable skills\n\nKeep going, you've got this!",
        }

        response_text = fallback_responses.get(
            message_type,
            "## Here to Help!\n\nI'm here to help you with your programming journey.\n\n### Key Points\n- Take it one step at a time\n- Practice makes progress\n- Every expert was once a beginner\n\nHow can I assist you today?",
        )

        return {
            "response": response_text,
            "message_type": message_type,
            "suggestions": ["Take it one step at a time", "Practice regularly", "Don't hesitate to ask for help"],
            "next_steps": ["Continue learning", "Apply what you've learned", "Build confidence"],
            "emotional_tone": "supportive",
            "confidence": 0.7,
            "learning_objectives": ["Learn effectively", "Build confidence", "Apply knowledge"],
            "follow_up_questions": ["What would you like to learn next?", "How can I help you better?"],
            "provider": "fallback",
            "is_fallback": True,
            "fallback_reason": reason or "Live Gemini output is unavailable right now.",
        }

    def _record_runtime_success(self) -> None:
        self.runtime_available = True
        self.runtime_unavailable_reason = ""
        self.last_status_probe_at = time.monotonic()

    def _record_runtime_failure(self, reason: str) -> None:
        self.runtime_available = False
        self.runtime_unavailable_reason = reason
        self.last_status_probe_at = time.monotonic()

    @staticmethod
    def _get_public_failure_reason(error: Exception) -> str:
        message = str(error).lower()

        if "resource_exhausted" in message or "quota" in message or "429" in message:
            return GEMINI_QUOTA_EXHAUSTED_REASON
        if "not_found" in message or "model" in message and "not found" in message:
            return GEMINI_MODEL_UNAVAILABLE_REASON
        if "connect" in message or "timeout" in message or "dns" in message:
            return GEMINI_NETWORK_UNAVAILABLE_REASON

        return LIVE_GEMINI_UNAVAILABLE_REASON

    async def get_runtime_status(self, force: bool = False) -> Dict[str, Any]:
        _ = force
        if not self.is_available:
            return self.get_service_status()

        self.runtime_available = True
        return self.get_service_status()

    def get_service_status(self) -> Dict[str, Any]:
        available = self.is_available and (
            self.runtime_available if self.last_status_probe_at > 0 else self.is_available
        )
        unavailable_reason = None
        if not available:
            unavailable_reason = (
                self.runtime_unavailable_reason
                or self.unavailable_reason
                or DEMO_MODE_AI_REASON
            )

        return {
            "available": available,
            "api_key_configured": len(self.api_keys) > 0,
            "library_installed": GEMINI_AVAILABLE,
            "model": self.model_name if available else None,
            "fallback_enabled": True,
            "unavailable_reason": unavailable_reason,
        }


gemini_service = GeminiService()


def get_gemini_service() -> GeminiService:
    return gemini_service

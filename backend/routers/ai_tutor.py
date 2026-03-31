"""
AI Learning Assistant - Conversational Tutor Backend Service
Provides intelligent tutoring with emotional intelligence and adaptive learning.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth.dependencies import get_current_user
from services.gemini_service import get_gemini_service
from services.user_service import UserService

router = APIRouter(prefix="/api/v1/ai-tutor", tags=["AI Tutor"])


def utc_now() -> datetime:
    """Return current UTC time as timezone-aware datetime."""
    return datetime.now(timezone.utc)


class MessageType(str, Enum):
    GREETING = "greeting"
    QUESTION = "question"
    CODE_HELP = "code_help"
    EXPLANATION = "explanation"
    ENCOURAGEMENT = "encouragement"
    FRUSTRATION_DETECTION = "frustration_detection"


class TutorMessage(BaseModel):
    message: str
    message_type: MessageType
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None


class TutorResponse(BaseModel):
    response: str
    message_type: str
    suggestions: List[str]
    next_steps: List[str]
    emotional_tone: str
    confidence: float
    learning_objectives: List[str]
    follow_up_questions: List[str]
    provider: Optional[str] = None
    is_fallback: bool = False
    fallback_reason: Optional[str] = None


class LearningStyle(BaseModel):
    visual_learning: float
    auditory_learning: float
    kinesthetic_learning: float
    reading_writing: float


class UserEmotionalState(BaseModel):
    frustration_level: float  # 0-1
    engagement_level: float  # 0-1
    confidence_level: float  # 0-1
    motivation_level: float  # 0-1
    last_updated: str


class AILearningAssistant:
    def __init__(self) -> None:
        self.gemini_service = get_gemini_service()
        self.user_service = UserService()
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

    async def analyze_user_emotion(self, user_id: str, message: str, session_context: Dict[str, Any]) -> UserEmotionalState:
        """Analyze emotional state using lightweight deterministic heuristics."""

        _ = user_id
        _ = session_context
        lowered = message.lower()
        frustration_terms = {
            "stuck",
            "error",
            "confused",
            "frustrated",
            "can't",
            "cannot",
            "not working",
            "fail",
            "why",
        }
        confidence_terms = {"understand", "got it", "solved", "works", "clear", "done"}
        motivation_terms = {"learn", "practice", "improve", "build", "goal", "career"}

        frustration_hits = sum(1 for term in frustration_terms if term in lowered)
        confidence_hits = sum(1 for term in confidence_terms if term in lowered)
        motivation_hits = sum(1 for term in motivation_terms if term in lowered)
        question_bonus = 0.1 if "?" in message else 0.0

        frustration_level = min(1.0, 0.2 + (0.15 * frustration_hits))
        confidence_level = min(1.0, 0.3 + (0.15 * confidence_hits))
        engagement_level = min(1.0, 0.45 + question_bonus + (0.06 * len(message.split()) / 10))
        motivation_level = min(1.0, 0.4 + (0.12 * motivation_hits))

        # If frustration is high, confidence usually drops.
        if frustration_level > 0.65:
            confidence_level = max(0.1, confidence_level - 0.2)
            motivation_level = max(0.2, motivation_level - 0.1)

        return UserEmotionalState(
            frustration_level=round(frustration_level, 2),
            engagement_level=round(engagement_level, 2),
            confidence_level=round(confidence_level, 2),
            motivation_level=round(motivation_level, 2),
            last_updated=utc_now().isoformat(),
        )

    async def generate_empathetic_response(self, emotional_state: UserEmotionalState, message: str) -> str:
        """Generate brief empathetic text for frustrated learners."""
        _ = message
        if emotional_state.frustration_level > 0.75:
            return "You're not behind. This is a normal part of learning, and we'll break it down together."
        if emotional_state.frustration_level > 0.6:
            return "You're close. Let's simplify this into one small step at a time."
        return "Nice progress so far. Let's keep building momentum."

    async def generate_personalized_hint(self, user_id: str, message: str, frustration_level: float) -> str:
        """Generate a contextual hint for code-help requests."""
        _ = user_id
        if frustration_level > 0.65:
            return (
                "Start by isolating the smallest failing part of your code, print intermediate values, "
                "and compare expected vs actual output."
            )
        return f"Great question. For `{message[:40]}`, try writing a tiny test input and trace each step manually."

    async def adapt_explanation_style(self, user_id: str, message: str, learning_style: LearningStyle) -> str:
        """Adapt explanation style to learning preference profile."""
        _ = user_id
        dominant_style = max(
            (
                ("visual", learning_style.visual_learning),
                ("auditory", learning_style.auditory_learning),
                ("kinesthetic", learning_style.kinesthetic_learning),
                ("reading_writing", learning_style.reading_writing),
            ),
            key=lambda pair: pair[1],
        )[0]

        style_prompts = {
            "visual": f"Think of `{message}` as a flowchart with inputs, transformation, and output.",
            "auditory": f"Explain `{message}` aloud as if teaching a friend in plain language.",
            "kinesthetic": f"Practice `{message}` by coding a tiny example and changing one variable at a time.",
            "reading_writing": f"Write a short note defining `{message}`, then summarize it in your own words.",
        }
        return style_prompts[dominant_style]

    async def generate_follow_up_questions(self, message: str, frustration_level: float) -> List[str]:
        """Generate useful follow-up prompts."""
        if frustration_level > 0.65:
            return [
                "Which exact line or concept feels most confusing right now?",
                "What output did you expect, and what did you get instead?",
                "Do you want a hint first or a full step-by-step explanation?",
            ]
        return [
            f"Would you like a quick example related to `{message[:40]}`?",
            "Want a practice question to reinforce this concept?",
            "Should we connect this concept to a real project use-case?",
        ]

    async def _build_fallback_response(
        self,
        message: TutorMessage,
        effective_user_id: str,
        emotional_state: UserEmotionalState,
    ) -> Dict[str, Any]:
        """Fallback response path when Gemini is unavailable/fails."""
        if message.message_type == MessageType.GREETING:
            base_response = (
                "Hello! I'm your AI programming tutor. Tell me your current topic and I'll guide you step by step."
            )
            emotional_tone = "friendly"
            confidence = 0.9
        elif message.message_type == MessageType.CODE_HELP:
            base_response = await self.generate_personalized_hint(
                effective_user_id,
                message.message,
                emotional_state.frustration_level,
            )
            emotional_tone = "supportive"
            confidence = 0.82
        elif message.message_type == MessageType.QUESTION:
            learning_style = LearningStyle(
                visual_learning=0.3,
                auditory_learning=0.3,
                kinesthetic_learning=0.2,
                reading_writing=0.2,
            )
            base_response = await self.adapt_explanation_style(
                effective_user_id,
                message.message,
                learning_style,
            )
            emotional_tone = "educational"
            confidence = 0.84
        else:
            base_response = await self.generate_empathetic_response(emotional_state, message.message)
            emotional_tone = "empathetic"
            confidence = 0.78

        return {
            "response": base_response,
            "emotional_tone": emotional_tone,
            "confidence": confidence,
            "suggestions": [
                "Try breaking this into smaller steps",
                "Test one assumption at a time",
                "Ask for a worked example if needed",
            ],
            "next_steps": [
                "Practice one related exercise",
                "Review the key concept summary",
                "Apply this to a mini project",
            ],
            "learning_objectives": ["Understand core concepts", "Apply problem-solving skills"],
            "follow_up_questions": await self.generate_follow_up_questions(
                message.message,
                emotional_state.frustration_level,
            ),
        }


ai_assistant = AILearningAssistant()


@router.get("/status")
async def get_ai_tutor_status() -> Dict[str, Any]:
    """Return presentation-friendly AI availability for the frontend."""
    status = await ai_assistant.gemini_service.get_runtime_status()
    available = bool(status.get("available"))

    return {
        "available": available,
        "mode": "live" if available else "fallback",
        "label": "Live Gemini" if available else "AI Quota Exhausted" if status.get("unavailable_reason") and "quota" in status.get("unavailable_reason").lower() else "AI Fallback",
        "message": (
            "Live Gemini responses are available."
            if available
            else f"AI is offline: {status.get('unavailable_reason') or 'Fallback AI is active due to quota limits.'}"
        ),
    }


@router.post("/chat", response_model=TutorResponse)
async def chat_with_tutor(
    message: TutorMessage,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> TutorResponse:
    """Main chat endpoint for AI tutor responses."""
    effective_user_id = str(current_user.get("sub"))

    session_id = message.session_id or f"session_{effective_user_id}_{int(utc_now().timestamp())}"
    session = ai_assistant.active_sessions.setdefault(
        session_id,
        {
            "session_id": session_id,
            "user_id": effective_user_id,
            "created_at": utc_now().isoformat(),
            "updated_at": utc_now().isoformat(),
            "messages": [],
            "context": message.context or {},
            "emotional_state": {},
        },
    )

    session_context = {
        "session_id": session_id,
        "history_size": len(session.get("messages", [])),
        "context": message.context or session.get("context", {}),
    }
    emotional_state = await ai_assistant.analyze_user_emotion(
        effective_user_id,
        message.message,
        session_context,
    )
    is_frustrated = (
        message.message_type == MessageType.FRUSTRATION_DETECTION
        or emotional_state.frustration_level > 0.6
    )

    try:
        gemini_response = await ai_assistant.gemini_service.generate_ai_response(
            message=message.message,
            message_type=message.message_type.value,
            context=session_context,
        )
    except Exception:
        gemini_response = await ai_assistant._build_fallback_response(
            message,
            effective_user_id,
            emotional_state,
        )

    base_response = gemini_response.get("response", "I'm here to help you learn programming step by step.")
    emotional_tone = gemini_response.get("emotional_tone", "supportive")
    confidence = float(gemini_response.get("confidence", 0.8))
    suggestions = list(gemini_response.get("suggestions", []))
    next_steps = list(gemini_response.get("next_steps", []))
    learning_objectives = list(gemini_response.get("learning_objectives", []))
    follow_up_questions = list(gemini_response.get("follow_up_questions", []))

    if is_frustrated:
        empathetic_addition = await ai_assistant.generate_empathetic_response(emotional_state, message.message)
        base_response = f"{empathetic_addition}\n\n{base_response}"
        emotional_tone = "empathetic"

    if not suggestions:
        suggestions = [
            "Try one small step before the full solution",
            "Verify assumptions with a tiny input",
            "Share your current code for targeted help",
        ]
    if not next_steps:
        next_steps = [
            "Practice with one similar question",
            "Review concept notes",
            "Apply this in a mini project",
        ]
    if not learning_objectives:
        learning_objectives = ["Understand core concepts", "Apply problem-solving skills"]
    if not follow_up_questions:
        follow_up_questions = await ai_assistant.generate_follow_up_questions(
            message.message,
            emotional_state.frustration_level,
        )

    session["updated_at"] = utc_now().isoformat()
    session["context"] = message.context or session.get("context", {})
    session["emotional_state"] = emotional_state.model_dump()
    session["messages"].append(
        {
            "timestamp": utc_now().isoformat(),
            "user_message": message.message,
            "message_type": message.message_type.value,
            "assistant_response": base_response,
        }
    )

    return TutorResponse(
        response=base_response,
        message_type=message.message_type.value,
        suggestions=suggestions,
        next_steps=next_steps,
        emotional_tone=emotional_tone,
        confidence=max(0.0, min(1.0, confidence)),
        learning_objectives=learning_objectives,
        follow_up_questions=follow_up_questions,
        provider=gemini_response.get("provider"),
        is_fallback=bool(gemini_response.get("is_fallback", False)),
        fallback_reason=gemini_response.get("fallback_reason"),
    )


@router.get("/session/{session_id}")
async def get_session_info(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get session information for the current user."""
    if session_id not in ai_assistant.active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = ai_assistant.active_sessions[session_id]
    if session.get("user_id") != str(current_user.get("sub")):
        raise HTTPException(status_code=403, detail="Access denied")

    return session


@router.post("/emotion-analysis", response_model=UserEmotionalState)
async def analyze_emotion(
    user_id: str,
    message: str,
    session_context: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> UserEmotionalState:
    """Analyze user's emotional state."""
    if str(current_user.get("sub")) != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return await ai_assistant.analyze_user_emotion(user_id, message, session_context)


@router.get("/learning-style/{user_id}", response_model=LearningStyle)
async def get_learning_style(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> LearningStyle:
    """Get user's learning style analysis."""
    if str(current_user.get("sub")) != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return LearningStyle(
        visual_learning=0.3,
        auditory_learning=0.3,
        kinesthetic_learning=0.2,
        reading_writing=0.2,
    )

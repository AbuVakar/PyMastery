"""
AI Router for PyMastery
Handles all AI-related endpoints including code analysis, tutoring, and smart suggestions
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import Dict, Any, Optional
import logging

from services.ai_service import ai_service, AIRequest, AIResponse
from services.auth_service import get_current_user
from models.user import User

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/ai", tags=["AI"])
security = HTTPBearer()

@router.get("/status")
async def get_ai_status():
    """Get AI service status and availability"""
    try:
        status_info = await ai_service.check_status()
        return {
            "success": True,
            "data": status_info
        }
    except Exception as e:
        logger.error(f"AI status check error: {e}")
        return {
            "success": False,
            "error": "Failed to check AI service status",
            "data": {
                "available": False,
                "message": "AI service is currently unavailable"
            }
        }

@router.post("/analyze")
async def analyze_code(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze code and provide insights"""
    try:
        if not request.code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Code is required for analysis"
            )
        
        result = await ai_service.analyze_code(request)
        
        return {
            "success": True,
            "data": {
                "content": result.content,
                "analysis": result.analysis,
                "suggestions": result.suggestions,
                "usage": result.usage
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Code analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze code"
        )

@router.post("/explain")
async def explain_code(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    """Get detailed code explanation"""
    try:
        if not request.code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Code is required for explanation"
            )
        
        result = await ai_service.explain_code(request)
        
        return {
            "success": True,
            "data": {
                "content": result.content,
                "explanation": result.explanation,
                "usage": result.usage
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Code explanation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to explain code"
        )

@router.post("/debug")
async def debug_code(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    """Get debugging assistance"""
    try:
        if not request.code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Code is required for debugging"
            )
        
        result = await ai_service.debug_code(request)
        
        return {
            "success": True,
            "data": {
                "content": result.content,
                "suggestions": result.suggestions,
                "usage": result.usage
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Code debugging error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to debug code"
        )

@router.post("/tutor")
async def get_tutoring(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    """Get AI tutoring assistance"""
    try:
        if not request.question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question is required for tutoring"
            )
        
        result = await ai_service.provide_tutoring(request)
        
        return {
            "success": True,
            "data": {
                "content": result.content,
                "suggestions": result.suggestions,
                "usage": result.usage
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI tutoring error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to provide tutoring assistance"
        )

@router.post("/suggest")
async def get_code_suggestions(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    """Get intelligent code suggestions"""
    try:
        if not request.code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Code is required for suggestions"
            )
        
        result = await ai_service.get_code_suggestions(request)
        
        return {
            "success": True,
            "data": {
                "content": result.content,
                "code_suggestions": result.code_suggestions,
                "usage": result.usage
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Code suggestions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get code suggestions"
        )

@router.post("/learning-path")
async def get_learning_path(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    """Get personalized learning path recommendations"""
    try:
        if not request.current_topic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current topic is required for learning path"
            )
        
        result = await ai_service.get_learning_path(request)
        
        return {
            "success": True,
            "data": {
                "content": result.content,
                "suggestions": result.suggestions,
                "usage": result.usage
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Learning path error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get learning path recommendations"
        )

@router.get("/usage")
async def get_usage_stats(
    current_user: User = Depends(get_current_user)
):
    """Get AI usage statistics for current user"""
    try:
        stats = await ai_service.get_usage_stats()
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        logger.error(f"AI usage stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get usage statistics"
        )

@router.post("/feedback")
async def submit_ai_feedback(
    feedback_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Submit feedback for AI responses"""
    try:
        # Log feedback for improvement
        logger.info(f"AI Feedback from user {current_user.id}: {feedback_data}")
        
        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "data": {
                "user_id": current_user.id,
                "feedback_id": f"fb_{datetime.utcnow().timestamp()}",
                "submitted_at": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"AI feedback submission error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback"
        )

@router.get("/models")
async def get_available_models(
    current_user: User = Depends(get_current_user)
):
    """Get available AI models"""
    try:
        status_info = await ai_service.check_status()
        
        return {
            "success": True,
            "data": {
                "available_models": [
                    {
                        "id": "gpt-3.5-turbo",
                        "name": "GPT-3.5 Turbo",
                        "description": "Fast and efficient for most tasks",
                        "max_tokens": 4096,
                        "available": status_info.get("available", False)
                    },
                    {
                        "id": "gpt-4",
                        "name": "GPT-4",
                        "description": "More powerful for complex tasks",
                        "max_tokens": 8192,
                        "available": False  # Not implemented yet
                    }
                ],
                "current_model": status_info.get("model"),
                "max_tokens": status_info.get("max_tokens")
            }
        }
    except Exception as e:
        logger.error(f"Available models error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get available models"
        )

@router.get("/features")
async def get_ai_features(
    current_user: User = Depends(get_current_user)
):
    """Get available AI features"""
    try:
        status_info = await ai_service.check_status()
        
        features = {
            "code_analysis": {
                "name": "Code Analysis",
                "description": "Analyze code quality, complexity, and improvements",
                "available": status_info.get("available", False),
                "endpoint": "/api/ai/analyze"
            },
            "code_explanation": {
                "name": "Code Explanation",
                "description": "Get detailed explanations of code functionality",
                "available": status_info.get("available", False),
                "endpoint": "/api/ai/explain"
            },
            "debugging": {
                "name": "Debugging Assistance",
                "description": "Get help with debugging code issues",
                "available": status_info.get("available", False),
                "endpoint": "/api/ai/debug"
            },
            "tutoring": {
                "name": "AI Tutoring",
                "description": "Get personalized learning assistance",
                "available": status_info.get("available", False),
                "endpoint": "/api/ai/tutor"
            },
            "code_suggestions": {
                "name": "Code Suggestions",
                "description": "Get intelligent code completion and suggestions",
                "available": status_info.get("available", False),
                "endpoint": "/api/ai/suggest"
            },
            "learning_path": {
                "name": "Learning Path",
                "description": "Get personalized learning recommendations",
                "available": status_info.get("available", False),
                "endpoint": "/api/ai/learning-path"
            }
        }
        
        return {
            "success": True,
            "data": {
                "features": features,
                "service_available": status_info.get("available", False),
                "current_model": status_info.get("model"),
                "usage_stats": await ai_service.get_usage_stats()
            }
        }
    except Exception as e:
        logger.error(f"AI features error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get AI features"
        )

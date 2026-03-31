"""
Analytics API Router for PyMastery
Handles user behavior tracking, insights generation, and learning path optimization
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import logging

from database.mongodb import get_database
from auth.dependencies import get_current_user, get_current_admin_user
from services.analytics_service import get_analytics_service, AnalyticsService, EventType, InsightType
from services.ai_service import get_ai_service

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

logger = logging.getLogger(__name__)

# Pydantic Models
class EventTrackingRequest(BaseModel):
    event_type: str = Field(..., description="Type of event")
    data: Dict[str, Any] = Field(default={}, description="Event data")
    session_id: Optional[str] = Field(default=None, description="Session ID")

class InsightGenerationRequest(BaseModel):
    insight_types: Optional[List[str]] = Field(default=None, description="Types of insights to generate")
    user_id: Optional[str] = Field(default=None, description="User ID (for admin use)")

class LearningPathOptimizationRequest(BaseModel):
    current_path_id: str = Field(..., description="Current learning path ID")
    optimization_goals: Optional[List[str]] = Field(default=[], description="Optimization goals")

class AdaptiveRecommendationsRequest(BaseModel):
    recommendation_types: Optional[List[str]] = Field(default=None, description="Types of recommendations")
    count: int = Field(default=10, ge=1, le=50, description="Number of recommendations")

class EngagementAnalyticsRequest(BaseModel):
    user_id: Optional[str] = Field(default=None, description="Specific user ID")
    days: int = Field(default=30, ge=1, le=365, description="Number of days to analyze")

class RetentionAnalyticsRequest(BaseModel):
    days: int = Field(default=30, ge=1, le=365, description="Number of days to analyze")
    cohort_analysis: bool = Field(default=True, description="Include cohort analysis")

# API Endpoints

@router.post("/track-event")
async def track_event(
    request: EventTrackingRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Track user event for analytics"""
    try:
        # Validate event type
        try:
            event_type = EventType(request.event_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid event type: {request.event_type}")
        
        # Get client information
        ip_address = http_request.client.host if http_request.client else None
        user_agent = http_request.headers.get("user-agent")
        
        # Create event
        from services.analytics_service import UserEvent
        event = UserEvent(
            user_id=str(current_user["_id"]),
            event_type=event_type,
            timestamp=datetime.now(timezone.utc),
            data=request.data,
            session_id=request.session_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Get analytics service and track event
        analytics_service = await get_analytics_service(db)
        success = await analytics_service.track_event(event)
        
        if success:
            return {
                "success": True,
                "message": "Event tracked successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to track event")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/behavior-metrics")
async def get_behavior_metrics(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user behavior metrics"""
    try:
        if days < 1 or days > 365:
            raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
        
        analytics_service = await get_analytics_service(db)
        metrics = await analytics_service.get_user_behavior_metrics(
            str(current_user["_id"]), days
        )
        
        return {
            "success": True,
            "metrics": {
                "user_id": metrics.user_id,
                "total_sessions": metrics.total_sessions,
                "total_time_spent": metrics.total_time_spent,
                "average_session_duration": metrics.average_session_duration,
                "most_active_hour": metrics.most_active_hour,
                "most_active_day": metrics.most_active_day,
                "preferred_features": metrics.preferred_features,
                "engagement_score": metrics.engagement_score,
                "retention_score": metrics.retention_score,
                "learning_velocity": metrics.learning_velocity,
                "difficulty_preference": metrics.difficulty_preference,
                "interaction_patterns": metrics.interaction_patterns
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting behavior metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-insights")
async def generate_insights(
    request: InsightGenerationRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate AI-powered learning insights"""
    try:
        # Validate insight types
        insight_types = None
        if request.insight_types:
            try:
                insight_types = [InsightType(t) for t in request.insight_types]
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid insight type: {e}")
        
        # Get AI service
        ai_service = await get_ai_service(db, "your-openai-api-key")  # Replace with actual API key
        analytics_service = await get_analytics_service(db, ai_service)
        
        # Generate insights
        user_id = request.user_id or str(current_user["_id"])
        insights = await analytics_service.generate_insights(user_id, insight_types)
        
        return {
            "success": True,
            "insights": [
                {
                    "user_id": insight.user_id,
                    "insight_type": insight.insight_type.value,
                    "title": insight.title,
                    "description": insight.description,
                    "confidence": insight.confidence,
                    "actionable": insight.actionable,
                    "recommendations": insight.recommendations,
                    "data": insight.data,
                    "created_at": insight.created_at.isoformat()
                }
                for insight in insights
            ],
            "count": len(insights)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights")
async def get_insights(
    insight_type: Optional[str] = None,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's learning insights"""
    try:
        user_id = str(current_user["_id"])
        
        # Build query
        query = {"user_id": user_id}
        if insight_type:
            query["insight_type"] = insight_type
        
        # Get insights from database
        insights = await db.learning_insights.find(query).sort("created_at", -1).limit(limit).to_list(None)
        
        return {
            "success": True,
            "insights": insights,
            "count": len(insights)
        }
        
    except Exception as e:
        logger.error(f"Error getting insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize-learning-path")
async def optimize_learning_path(
    request: LearningPathOptimizationRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Optimize learning path based on user behavior and performance"""
    try:
        # Get AI service
        ai_service = await get_ai_service(db, "your-openai-api-key")  # Replace with actual API key
        analytics_service = await get_analytics_service(db, ai_service)
        
        # Optimize learning path
        result = await analytics_service.optimize_learning_path(
            str(current_user["_id"]), request.current_path_id
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "optimization": result,
            "message": "Learning path optimized successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error optimizing learning path: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/optimized-paths")
async def get_optimized_paths(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's optimized learning paths"""
    try:
        user_id = str(current_user["_id"])
        
        # Get optimized paths
        paths = await db.learning_paths.find({
            "user_id": user_id,
            "is_optimized": True
        }).sort("created_at", -1).to_list(None)
        
        return {
            "success": True,
            "paths": paths,
            "count": len(paths)
        }
        
    except Exception as e:
        logger.error(f"Error getting optimized paths: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/adaptive-recommendations")
async def get_adaptive_recommendations(
    request: AdaptiveRecommendationsRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get adaptive recommendations based on user behavior"""
    try:
        if request.count < 1 or request.count > 50:
            raise HTTPException(status_code=400, detail="Count must be between 1 and 50")
        
        # Get AI service
        ai_service = await get_ai_service(db, "your-openai-api-key")  # Replace with actual API key
        analytics_service = await get_analytics_service(db, ai_service)
        
        # Get recommendations
        recommendations = await analytics_service.get_adaptive_recommendations(
            str(current_user["_id"]), request.count
        )
        
        return {
            "success": True,
            "recommendations": [
                {
                    "user_id": rec.user_id,
                    "recommendation_type": rec.recommendation_type,
                    "content_id": rec.content_id,
                    "title": rec.title,
                    "description": rec.description,
                    "priority": rec.priority,
                    "reasoning": rec.reasoning,
                    "estimated_difficulty": rec.estimated_difficulty,
                    "estimated_time": rec.estimated_time,
                    "adaptation_factors": rec.adaptation_factors
                }
                for rec in recommendations
            ],
            "count": len(recommendations)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting adaptive recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/engagement-analytics")
async def get_engagement_analytics(
    request: EngagementAnalyticsRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get engagement analytics"""
    try:
        if request.days < 1 or request.days > 365:
            raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
        
        # Check if user is admin for global analytics
        is_admin = current_user.get("role") == "admin"
        user_id = request.user_id if is_admin else str(current_user["_id"])
        
        analytics_service = await get_analytics_service(db)
        analytics = await analytics_service.get_engagement_analytics(user_id, request.days)
        
        return {
            "success": True,
            "analytics": analytics,
            "scope": "global" if is_admin and not request.user_id else "user"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting engagement analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/retention-analytics")
async def get_retention_analytics(
    request: RetentionAnalyticsRequest,
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get retention analytics"""
    try:
        if request.days < 1 or request.days > 365:
            raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
        
        analytics_service = await get_analytics_service(db)
        analytics = await analytics_service.get_retention_analytics(request.days)
        
        return {
            "success": True,
            "analytics": analytics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting retention analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check for analytics service"""
    return {
        "status": "healthy",
        "service": "analytics",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "features": [
            "event_tracking",
            "behavior_metrics",
            "insights_generation",
            "learning_path_optimization",
            "adaptive_recommendations",
            "engagement_analytics",
            "retention_analytics",
            "performance_trends"
        ]
    }
                
                
                            
                                                                                                                                                                                                                                
                                            
                
                                                                                    

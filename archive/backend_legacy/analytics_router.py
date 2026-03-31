"""
Analytics Router for PyMastery
Provides endpoints for user behavior analytics, business intelligence, and monitoring
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse

from services.user_analytics_service import get_user_analytics_service, UserAnalyticsService
from auth.dependencies import get_current_user, require_admin
from models.user import User

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("/real-time")
async def get_real_time_metrics(
    current_user: User = Depends(get_current_user),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Get real-time platform metrics"""
    try:
        # Check if user has permission to view analytics
        if current_user.role not in ["admin", "instructor"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        metrics = await analytics_service.get_real_time_metrics()
        
        return {
            "success": True,
            "data": metrics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching real-time metrics: {str(e)}")

@router.get("/platform")
async def get_platform_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    days: int = Query(30, description="Number of days for analytics"),
    current_user: User = Depends(get_current_user),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Get platform-wide analytics"""
    try:
        # Check if user has permission to view analytics
        if current_user.role not in ["admin", "instructor"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Parse dates
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format")
        else:
            start_dt = datetime.now(timezone.utc) - timedelta(days=days)
        
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format")
        else:
            end_dt = datetime.now(timezone.utc)
        
        analytics = await analytics_service.get_platform_analytics(start_dt, end_dt)
        
        return {
            "success": True,
            "data": analytics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching platform analytics: {str(e)}")

@router.get("/user/{user_id}/engagement")
async def get_user_engagement(
    user_id: str,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    days: int = Query(30, description="Number of days for analytics"),
    current_user: User = Depends(get_current_user),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Get user engagement metrics"""
    try:
        # Check permissions - users can only view their own data, admins/instructors can view others
        if current_user.role == "student" and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Can only view your own engagement data")
        
        # Parse dates
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format")
        else:
            start_dt = datetime.now(timezone.utc) - timedelta(days=days)
        
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format")
        else:
            end_dt = datetime.now(timezone.utc)
        
        engagement_metrics = await analytics_service.get_user_engagement_metrics(
            user_id, start_dt, end_dt
        )
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "period": {
                    "start_date": start_dt.isoformat(),
                    "end_date": end_dt.isoformat()
                },
                "engagement_metrics": [asdict(metric) for metric in engagement_metrics]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user engagement: {str(e)}")

@router.get("/user/{user_id}/behavior")
async def get_user_behavior_insights(
    user_id: str,
    days: int = Query(30, description="Number of days for analysis"),
    current_user: User = Depends(get_current_user),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Get detailed user behavior insights"""
    try:
        # Check permissions - users can only view their own data, admins/instructors can view others
        if current_user.role == "student" and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Can only view your own behavior insights")
        
        if days < 1 or days > 365:
            raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
        
        insights = await analytics_service.get_user_behavior_insights(user_id, days)
        
        return {
            "success": True,
            "data": insights
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user behavior insights: {str(e)}")

@router.get("/dashboard/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Get analytics dashboard summary for current user"""
    try:
        # Get real-time metrics for admins/instructors
        if current_user.role in ["admin", "instructor"]:
            real_time = await analytics_service.get_real_time_metrics()
            
            # Get platform analytics for last 7 days
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=7)
            platform_analytics = await analytics_service.get_platform_analytics(start_date, end_date)
            
            return {
                "success": True,
                "data": {
                    "role": current_user.role,
                    "real_time_metrics": real_time,
                    "platform_analytics": platform_analytics
                }
            }
        
        # For students, get their own behavior insights
        else:
            insights = await analytics_service.get_user_behavior_insights(current_user.id, 30)
            
            return {
                "success": True,
                "data": {
                    "role": current_user.role,
                    "personal_insights": insights
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard summary: {str(e)}")

@router.get("/retention")
async def get_retention_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    days: int = Query(30, description="Number of days for analytics"),
    current_user: User = Depends(require_admin),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Get user retention analytics (Admin only)"""
    try:
        # Parse dates
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format")
        else:
            start_dt = datetime.now(timezone.utc) - timedelta(days=days)
        
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format")
        else:
            end_dt = datetime.now(timezone.utc)
        
        analytics = await analytics_service.get_platform_analytics(start_dt, end_dt)
        retention_metrics = analytics.get("retention_metrics", {})
        
        return {
            "success": True,
            "data": {
                "period": {
                    "start_date": start_dt.isoformat(),
                    "end_date": end_dt.isoformat()
                },
                "retention_metrics": retention_metrics
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching retention analytics: {str(e)}")

@router.get("/feature-usage")
async def get_feature_usage_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    days: int = Query(30, description="Number of days for analytics"),
    current_user: User = Depends(get_current_user),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Get feature usage analytics"""
    try:
        # Check if user has permission to view analytics
        if current_user.role not in ["admin", "instructor"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Parse dates
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format")
        else:
            start_dt = datetime.now(timezone.utc) - timedelta(days=days)
        
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format")
        else:
            end_dt = datetime.now(timezone.utc)
        
        analytics = await analytics_service.get_platform_analytics(start_dt, end_dt)
        feature_usage = analytics.get("feature_usage", [])
        
        return {
            "success": True,
            "data": {
                "period": {
                    "start_date": start_dt.isoformat(),
                    "end_date": end_dt.isoformat()
                },
                "feature_usage": feature_usage
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching feature usage analytics: {str(e)}")

@router.get("/learning-progress")
async def get_learning_progress_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    days: int = Query(30, description="Number of days for analytics"),
    current_user: User = Depends(get_current_user),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Get learning progress analytics"""
    try:
        # Check if user has permission to view analytics
        if current_user.role not in ["admin", "instructor"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Parse dates
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format")
        else:
            start_dt = datetime.now(timezone.utc) - timedelta(days=days)
        
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format")
        else:
            end_dt = datetime.now(timezone.utc)
        
        analytics = await analytics_service.get_platform_analytics(start_dt, end_dt)
        
        return {
            "success": True,
            "data": {
                "period": {
                    "start_date": start_dt.isoformat(),
                    "end_date": end_dt.isoformat()
                },
                "course_completion": analytics.get("course_completion", {}),
                "problem_analytics": analytics.get("problem_analytics", {}),
                "ai_usage": analytics.get("ai_usage", {})
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching learning progress analytics: {str(e)}")

@router.post("/track-event")
async def track_analytics_event(
    event_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Track an analytics event"""
    try:
        from services.user_analytics_service import EventType
        
        # Validate event data
        required_fields = ["event_type", "properties"]
        for field in required_fields:
            if field not in event_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Parse event type
        try:
            event_type = EventType(event_data["event_type"])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid event type: {event_data['event_type']}")
        
        # Extract additional data
        properties = event_data.get("properties", {})
        session_id = event_data.get("session_id")
        
        # Get request context
        from fastapi import Request
        request = Request
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        referrer = request.headers.get("referer") if request else None
        
        # Track the event
        await analytics_service.track_event(
            user_id=current_user.id,
            event_type=event_type,
            properties=properties,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer=referrer
        )
        
        return {
            "success": True,
            "message": "Event tracked successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error tracking event: {str(e)}")

@router.post("/session/start")
async def start_analytics_session(
    session_data: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Start an analytics session"""
    try:
        # Get request context
        from fastapi import Request
        request = Request
        ip_address = request.client.host if request else None
        
        device_info = session_data.get("device_info") if session_data else None
        
        session_id = await analytics_service.start_session(
            user_id=current_user.id,
            device_info=device_info,
            ip_address=ip_address
        )
        
        return {
            "success": True,
            "data": {
                "session_id": session_id,
                "started_at": datetime.now(timezone.utc).isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting session: {str(e)}")

@router.post("/session/end")
async def end_analytics_session(
    session_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """End an analytics session"""
    try:
        session_id = session_data.get("session_id")
        if not session_id:
            raise HTTPException(status_code=400, detail="Missing session_id")
        
        await analytics_service.end_session(session_id)
        
        return {
            "success": True,
            "message": "Session ended successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ending session: {str(e)}")

@router.get("/export")
async def export_analytics_data(
    export_type: str = Query(..., description="Type of data to export"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    format: str = Query("json", description="Export format (json, csv)"),
    current_user: User = Depends(require_admin),
    analytics_service: UserAnalyticsService = Depends(get_user_analytics_service)
):
    """Export analytics data (Admin only)"""
    try:
        # Validate export type
        valid_types = ["platform", "user_engagement", "feature_usage", "retention"]
        if export_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid export type. Must be one of: {valid_types}")
        
        # Validate format
        if format not in ["json", "csv"]:
            raise HTTPException(status_code=400, detail="Format must be 'json' or 'csv'")
        
        # Parse dates
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format")
        else:
            start_dt = datetime.now(timezone.utc) - timedelta(days=30)
        
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format")
        else:
            end_dt = datetime.now(timezone.utc)
        
        # Get data based on export type
        if export_type == "platform":
            data = await analytics_service.get_platform_analytics(start_dt, end_dt)
        elif export_type == "retention":
            analytics = await analytics_service.get_platform_analytics(start_dt, end_dt)
            data = {"retention_metrics": analytics.get("retention_metrics", {})}
        else:
            raise HTTPException(status_code=400, detail=f"Export type '{export_type}' not implemented yet")
        
        # Format response based on format
        if format == "csv":
            # Convert to CSV format (simplified)
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow(["metric", "value"])
            
            # Write data
            def flatten_dict(d, parent_key="", sep="_"):
                items = []
                for k, v in d.items():
                    new_key = f"{parent_key}{sep}{k}" if parent_key else k
                    if isinstance(v, dict):
                        items.extend(flatten_dict(v, new_key, sep=sep).items())
                    else:
                        items.append((new_key, v))
                return dict(items)
            
            flat_data = flatten_dict(data)
            for key, value in flat_data.items():
                writer.writerow([key, value])
            
            csv_content = output.getvalue()
            output.close()
            
            return JSONResponse(
                content=csv_content,
                headers={
                    "Content-Disposition": f"attachment; filename=analytics_{export_type}_{start_dt.date()}_{end_dt.date()}.csv",
                    "Content-Type": "text/csv"
                }
            )
        else:
            return {
                "success": True,
                "data": data,
                "export_info": {
                    "type": export_type,
                    "format": format,
                    "period": {
                        "start_date": start_dt.isoformat(),
                        "end_date": end_dt.isoformat()
                    },
                    "exported_at": datetime.now(timezone.utc).isoformat()
                }
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting analytics data: {str(e)}")

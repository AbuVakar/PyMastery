"""
User Analytics Service for PyMastery
Tracks user behavior, engagement, and business intelligence metrics
"""

import asyncio
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import logging

from database.mongodb import get_database
from models.user import User
from models.course import Course
from models.problem import Problem

logger = logging.getLogger(__name__)

class EventType(Enum):
    """User event types for analytics"""
    PAGE_VIEW = "page_view"
    COURSE_START = "course_start"
    COURSE_COMPLETE = "course_complete"
    PROBLEM_ATTEMPT = "problem_attempt"
    PROBLEM_SOLVE = "problem_solve"
    CODE_EXECUTION = "code_execution"
    AI_INTERACTION = "ai_interaction"
    LOGIN = "login"
    LOGOUT = "logout"
    SESSION_START = "session_start"
    SESSION_END = "session_end"
    ERROR_OCCURRED = "error_occurred"
    FEATURE_USED = "feature_used"

@dataclass
class UserEvent:
    """User event data structure"""
    event_id: str
    user_id: str
    event_type: EventType
    timestamp: datetime
    session_id: str
    properties: Dict[str, Any]
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

@dataclass
class UserSession:
    """User session tracking"""
    session_id: str
    user_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    page_views: int = 0
    interactions: int = 0
    device_info: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None

@dataclass
class UserEngagementMetrics:
    """User engagement metrics"""
    user_id: str
    date: datetime
    session_count: int
    total_time_seconds: float
    page_views: int
    problem_attempts: int
    problem_solves: int
    code_executions: int
    ai_interactions: int
    courses_started: int
    courses_completed: int
    login_count: int
    error_count: int

class UserAnalyticsService:
    """Service for tracking and analyzing user behavior"""
    
    def __init__(self):
        self.db = None
        self.active_sessions: Dict[str, UserSession] = {}
        self.event_buffer: List[UserEvent] = []
        self.buffer_size = 100
        
    async def initialize(self):
        """Initialize the analytics service"""
        self.db = get_database()
        logger.info("User Analytics Service initialized")
        
    async def track_event(
        self,
        user_id: str,
        event_type: EventType,
        properties: Dict[str, Any],
        session_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        referrer: Optional[str] = None
    ):
        """Track a user event"""
        try:
            event = UserEvent(
                event_id=str(uuid.uuid4()),
                user_id=user_id,
                event_type=event_type,
                timestamp=datetime.now(timezone.utc),
                session_id=session_id or self._get_or_create_session(user_id),
                properties=properties,
                ip_address=ip_address,
                user_agent=user_agent,
                referrer=referrer
            )
            
            # Add to buffer
            self.event_buffer.append(event)
            
            # Update session if active
            if event.session_id in self.active_sessions:
                session = self.active_sessions[event.session_id]
                if event_type == EventType.PAGE_VIEW:
                    session.page_views += 1
                elif event_type in [EventType.PROBLEM_ATTEMPT, EventType.PROBLEM_SOLVE, 
                                 EventType.CODE_EXECUTION, EventType.AI_INTERACTION]:
                    session.interactions += 1
            
            # Flush buffer if needed
            if len(self.event_buffer) >= self.buffer_size:
                await self._flush_events()
                
        except Exception as e:
            logger.error(f"Error tracking event: {e}")
    
    async def start_session(
        self,
        user_id: str,
        device_info: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> str:
        """Start a new user session"""
        session_id = str(uuid.uuid4())
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            start_time=datetime.now(timezone.utc),
            device_info=device_info,
            ip_address=ip_address
        )
        
        self.active_sessions[session_id] = session
        
        # Track session start event
        await self.track_event(
            user_id=user_id,
            event_type=EventType.SESSION_START,
            properties=device_info or {},
            session_id=session_id,
            ip_address=ip_address
        )
        
        return session_id
    
    async def end_session(self, session_id: str):
        """End a user session"""
        if session_id not in self.active_sessions:
            return
            
        session = self.active_sessions[session_id]
        session.end_time = datetime.now(timezone.utc)
        session.duration_seconds = (session.end_time - session.start_time).total_seconds()
        
        # Track session end event
        await self.track_event(
            user_id=session.user_id,
            event_type=EventType.SESSION_END,
            properties={
                "duration_seconds": session.duration_seconds,
                "page_views": session.page_views,
                "interactions": session.interactions
            },
            session_id=session_id
        )
        
        # Remove from active sessions
        del self.active_sessions[session_id]
    
    async def get_user_engagement_metrics(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[UserEngagementMetrics]:
        """Get engagement metrics for a user"""
        try:
            pipeline = [
                {
                    "$match": {
                        "user_id": user_id,
                        "timestamp": {
                            "$gte": start_date,
                            "$lte": end_date
                        }
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "date": {
                                "$dateToString": {
                                    "format": "%Y-%m-%d",
                                    "date": "$timestamp"
                                }
                            },
                            "user_id": "$user_id"
                        },
                        "session_count": {
                            "$sum": {
                                "$cond": [{"$eq": ["$event_type", "session_start"]}, 1, 0]
                            }
                        },
                        "total_time_seconds": {
                            "$sum": {
                                "$cond": [
                                    {"$eq": ["$event_type", "session_end"]},
                                    {"$ifNull": ["$properties.duration_seconds", 0]},
                                    0
                                ]
                            }
                        },
                        "page_views": {
                            "$sum": {
                                "$cond": [{"$eq": ["$event_type", "page_view"]}, 1, 0]
                            }
                        },
                        "problem_attempts": {
                            "$sum": {
                                "$cond": [{"$eq": ["$event_type", "problem_attempt"]}, 1, 0]
                            }
                        },
                        "problem_solves": {
                            "$sum": {
                                "$cond": [{"$eq": ["$event_type", "problem_solve"]}, 1, 0]
                            }
                        },
                        "code_executions": {
                            "$sum": {
                                "$cond": [{"$eq": ["$event_type", "code_execution"]}, 1, 0]
                            }
                        },
                        "ai_interactions": {
                            "$sum": {
                                "$cond": [{"$eq": ["$event_type", "ai_interaction"]}, 1, 0]
                            }
                        },
                        "courses_started": {
                            "$sum": {
                                "$cond": [{"$eq": ["$event_type", "course_start"]}, 1, 0]
                            }
                        },
                        "courses_completed": {
                            "$sum": {
                                "$cond": [{"$eq": ["$event_type", "course_complete"]}, 1, 0]
                            }
                        },
                        "login_count": {
                            "$sum": {
                                "$cond": [{"$eq": ["$event_type", "login"]}, 1, 0]
                            }
                        },
                        "error_count": {
                            "$sum": {
                                "$cond": [{"$eq": ["$event_type", "error_occurred"]}, 1, 0]
                            }
                        }
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "user_id": "$_id.user_id",
                        "date": {"$dateFromString": {"dateString": "$_id.date"}},
                        "session_count": 1,
                        "total_time_seconds": 1,
                        "page_views": 1,
                        "problem_attempts": 1,
                        "problem_solves": 1,
                        "code_executions": 1,
                        "ai_interactions": 1,
                        "courses_started": 1,
                        "courses_completed": 1,
                        "login_count": 1,
                        "error_count": 1
                    }
                },
                {"$sort": {"date": 1}}
            ]
            
            results = await self.db.user_events.aggregate(pipeline).to_list(None)
            
            return [
                UserEngagementMetrics(
                    user_id=result["user_id"],
                    date=result["date"],
                    session_count=result["session_count"],
                    total_time_seconds=result["total_time_seconds"],
                    page_views=result["page_views"],
                    problem_attempts=result["problem_attempts"],
                    problem_solves=result["problem_solves"],
                    code_executions=result["code_executions"],
                    ai_interactions=result["ai_interactions"],
                    courses_started=result["courses_started"],
                    courses_completed=result["courses_completed"],
                    login_count=result["login_count"],
                    error_count=result["error_count"]
                )
                for result in results
            ]
            
        except Exception as e:
            logger.error(f"Error getting user engagement metrics: {e}")
            return []
    
    async def get_platform_analytics(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get platform-wide analytics"""
        try:
            # Get daily active users
            daily_active_users = await self._get_daily_active_users(start_date, end_date)
            
            # Get user retention metrics
            retention_metrics = await self._get_retention_metrics(start_date, end_date)
            
            # Get feature usage analytics
            feature_usage = await self._get_feature_usage(start_date, end_date)
            
            # Get course completion rates
            course_completion = await self._get_course_completion_rates(start_date, end_date)
            
            # Get problem solving analytics
            problem_analytics = await self._get_problem_analytics(start_date, end_date)
            
            # Get AI usage analytics
            ai_usage = await self._get_ai_usage_analytics(start_date, end_date)
            
            return {
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "daily_active_users": daily_active_users,
                "retention_metrics": retention_metrics,
                "feature_usage": feature_usage,
                "course_completion": course_completion,
                "problem_analytics": problem_analytics,
                "ai_usage": ai_usage,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting platform analytics: {e}")
            return {}
    
    async def get_real_time_metrics(self) -> Dict[str, Any]:
        """Get real-time platform metrics"""
        try:
            current_time = datetime.now(timezone.utc)
            
            # Active sessions
            active_sessions = len(self.active_sessions)
            
            # Recent activity (last 5 minutes)
            recent_activity_time = current_time - timedelta(minutes=5)
            recent_events = await self.db.user_events.count_documents({
                "timestamp": {"$gte": recent_activity_time}
            })
            
            # Today's metrics
            today_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
            today_metrics = await self._get_today_metrics(today_start)
            
            # Error rate (last hour)
            error_time = current_time - timedelta(hours=1)
            error_count = await self.db.user_events.count_documents({
                "timestamp": {"$gte": error_time},
                "event_type": "error_occurred"
            })
            total_events = await self.db.user_events.count_documents({
                "timestamp": {"$gte": error_time}
            })
            error_rate = (error_count / total_events * 100) if total_events > 0 else 0
            
            return {
                "timestamp": current_time.isoformat(),
                "active_sessions": active_sessions,
                "recent_events_5min": recent_events,
                "today_metrics": today_metrics,
                "error_rate_last_hour": round(error_rate, 2),
                "buffer_size": len(self.event_buffer)
            }
            
        except Exception as e:
            logger.error(f"Error getting real-time metrics: {e}")
            return {}
    
    async def get_user_behavior_insights(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get detailed behavior insights for a specific user"""
        try:
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=days)
            
            # Get engagement metrics
            engagement_metrics = await self.get_user_engagement_metrics(
                user_id, start_date, end_date
            )
            
            # Get learning patterns
            learning_patterns = await self._analyze_learning_patterns(user_id, start_date, end_date)
            
            # Get preferred features
            preferred_features = await self._get_preferred_features(user_id, start_date, end_date)
            
            # Get progress trends
            progress_trends = await self._get_progress_trends(user_id, start_date, end_date)
            
            # Get engagement score
            engagement_score = await self._calculate_engagement_score(user_id, start_date, end_date)
            
            return {
                "user_id": user_id,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "days": days
                },
                "engagement_metrics": [asdict(m) for m in engagement_metrics],
                "learning_patterns": learning_patterns,
                "preferred_features": preferred_features,
                "progress_trends": progress_trends,
                "engagement_score": engagement_score,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting user behavior insights: {e}")
            return {}
    
    def _get_or_create_session(self, user_id: str) -> str:
        """Get existing session or create new one"""
        # Find most recent active session for user
        for session_id, session in self.active_sessions.items():
            if session.user_id == user_id:
                return session_id
        
        # Create new session
        return asyncio.create_task(self.start_session(user_id)).result()
    
    async def _flush_events(self):
        """Flush event buffer to database"""
        if not self.event_buffer:
            return
            
        try:
            events_data = [asdict(event) for event in self.event_buffer]
            await self.db.user_events.insert_many(events_data)
            self.event_buffer.clear()
            logger.info(f"Flushed {len(events_data)} events to database")
            
        except Exception as e:
            logger.error(f"Error flushing events: {e}")
    
    async def _get_daily_active_users(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get daily active users count"""
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "date": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$timestamp"
                            }
                        }
                    },
                    "active_users": {"$addToSet": "$user_id"}
                }
            },
            {
                "$project": {
                    "date": "$_id.date",
                    "active_users": {"$size": "$active_users"}
                }
            },
            {"$sort": {"date": 1}}
        ]
        
        results = await self.db.user_events.aggregate(pipeline).to_list(None)
        return results
    
    async def _get_retention_metrics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Calculate user retention metrics"""
        # Day 1, 7, 30 retention
        retention_windows = [1, 7, 30]
        retention_data = {}
        
        for window in retention_windows:
            cohort_start = start_date
            cohort_end = start_date + timedelta(days=7)  # 1-week cohort
            
            # Get users who signed up in cohort period
            cohort_users = await self.db.user_events.distinct(
                "user_id",
                {
                    "event_type": "session_start",
                    "timestamp": {"$gte": cohort_start, "$lte": cohort_end}
                }
            )
            
            if cohort_users:
                # Check how many returned after window days
                return_date = cohort_start + timedelta(days=window)
                returned_users = await self.db.user_events.distinct(
                    "user_id",
                    {
                        "user_id": {"$in": cohort_users},
                        "timestamp": {"$gte": return_date, "$lte": return_date + timedelta(days=1)}
                    }
                )
                
                retention_rate = (len(returned_users) / len(cohort_users)) * 100
                retention_data[f"day_{window}_retention"] = round(retention_rate, 2)
        
        return retention_data
    
    async def _get_feature_usage(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get feature usage statistics"""
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "event_type": "feature_used"
                }
            },
            {
                "$group": {
                    "_id": "$properties.feature_name",
                    "usage_count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {
                "$project": {
                    "feature_name": "$_id",
                    "usage_count": 1,
                    "unique_users": {"$size": "$unique_users"}
                }
            },
            {"$sort": {"usage_count": -1}}
        ]
        
        results = await self.db.user_events.aggregate(pipeline).to_list(None)
        return results
    
    async def _get_course_completion_rates(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get course completion rates"""
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "event_type": {"$in": ["course_start", "course_complete"]}
                }
            },
            {
                "$group": {
                    "_id": {
                        "course_id": "$properties.course_id",
                        "event_type": "$event_type"
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": "$_id.course_id",
                    "starts": {
                        "$sum": {
                            "$cond": [{"$eq": ["$_id.event_type", "course_start"]}, "$count", 0]
                        }
                    },
                    "completions": {
                        "$sum": {
                            "$cond": [{"$eq": ["_id.event_type", "course_complete"]}, "$count", 0]
                        }
                    }
                }
            },
            {
                "$project": {
                    "course_id": "$_id",
                    "starts": 1,
                    "completions": 1,
                    "completion_rate": {
                        "$cond": [
                            {"$gt": ["$starts", 0]},
                            {"$multiply": [{"$divide": ["$completions", "$starts"]}, 100]},
                            0
                        ]
                    }
                }
            }
        ]
        
        results = await self.db.user_events.aggregate(pipeline).to_list(None)
        return {"courses": results}
    
    async def _get_problem_analytics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get problem solving analytics"""
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "event_type": {"$in": ["problem_attempt", "problem_solve"]}
                }
            },
            {
                "$group": {
                    "_id": {
                        "problem_id": "$properties.problem_id",
                        "event_type": "$event_type"
                    },
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {
                "$group": {
                    "_id": "$_id.problem_id",
                    "attempts": {
                        "$sum": {
                            "$cond": [{"$eq": ["$_id.event_type", "problem_attempt"]}, "$count", 0]
                        }
                    },
                    "solves": {
                        "$sum": {
                            "$cond": [{"$eq": ["_id.event_type", "problem_solve"]}, "$count", 0]
                        }
                    },
                    "unique_attempters": {
                        "$sum": {
                            "$cond": [{"$eq": ["$_id.event_type", "problem_attempt"]}, {"$size": "$unique_users"}, 0]
                        }
                    },
                    "unique_solvers": {
                        "$sum": {
                            "$cond": [{"$eq": ["_id.event_type", "problem_solve"]}, {"$size": "$unique_users"}, 0]
                        }
                    }
                }
            },
            {
                "$project": {
                    "problem_id": "$_id",
                    "attempts": 1,
                    "solves": 1,
                    "success_rate": {
                        "$cond": [
                            {"$gt": ["$attempts", 0]},
                            {"$multiply": [{"$divide": ["$solves", "$attempts"]}, 100]},
                            0
                        ]
                    },
                    "unique_attempters": 1,
                    "unique_solvers": 1
                }
            },
            {"$sort": {"attempts": -1}}
        ]
        
        results = await self.db.user_events.aggregate(pipeline).to_list(None)
        return {"problems": results}
    
    async def _get_ai_usage_analytics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get AI usage analytics"""
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "event_type": "ai_interaction"
                }
            },
            {
                "$group": {
                    "_id": "$properties.ai_feature",
                    "usage_count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"},
                    "avg_response_time": {"$avg": "$properties.response_time"}
                }
            },
            {
                "$project": {
                    "ai_feature": "$_id",
                    "usage_count": 1,
                    "unique_users": {"$size": "$unique_users"},
                    "avg_response_time": {"$round": ["$avg_response_time", 2]}
                }
            },
            {"$sort": {"usage_count": -1}}
        ]
        
        results = await self.db.user_events.aggregate(pipeline).to_list(None)
        return {"ai_features": results}
    
    async def _get_today_metrics(self, today_start: datetime) -> Dict[str, Any]:
        """Get today's metrics"""
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": today_start}
                }
            },
            {
                "$group": {
                    "_id": "$event_type",
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {
                "$project": {
                    "event_type": "$_id",
                    "count": 1,
                    "unique_users": {"$size": "$unique_users"}
                }
            }
        ]
        
        results = await self.db.user_events.aggregate(pipeline).to_list(None)
        return {result["event_type"]: result for result in results}
    
    async def _analyze_learning_patterns(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Analyze user learning patterns"""
        # Get activity by hour of day
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$project": {
                    "hour": {"$hour": "$timestamp"},
                    "day_of_week": {"$dayOfWeek": "$timestamp"}
                }
            },
            {
                "$group": {
                    "_id": {"hour": "$hour", "day_of_week": "$day_of_week"},
                    "activity_count": {"$sum": 1}
                }
            }
        ]
        
        activity_patterns = await self.db.user_events.aggregate(pipeline).to_list(None)
        
        # Find most active times
        most_active_hour = max(activity_patterns, key=lambda x: x["activity_count"])["hour"]
        most_active_day = max(activity_patterns, key=lambda x: x["activity_count"])["day_of_week"]
        
        return {
            "most_active_hour": most_active_hour,
            "most_active_day": most_active_day,
            "activity_patterns": activity_patterns
        }
    
    async def _get_preferred_features(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get user's preferred features"""
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "event_type": "feature_used"
                }
            },
            {
                "$group": {
                    "_id": "$properties.feature_name",
                    "usage_count": {"$sum": 1}
                }
            },
            {"$sort": {"usage_count": -1}},
            {"$limit": 10}
        ]
        
        return await self.db.user_events.aggregate(pipeline).to_list(None)
    
    async def _get_progress_trends(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get user progress trends"""
        # Get daily progress metrics
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "event_type": {"$in": ["problem_solve", "course_complete"]}
                }
            },
            {
                "$group": {
                    "_id": {
                        "date": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$timestamp"
                            }
                        },
                        "event_type": "$event_type"
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": "$_id.date",
                    "problems_solved": {
                        "$sum": {
                            "$cond": [{"$eq": ["$_id.event_type", "problem_solve"]}, "$count", 0]
                        }
                    },
                    "courses_completed": {
                        "$sum": {
                            "$cond": [{"$eq": ["_id.event_type", "course_complete"]}, "$count", 0]
                        }
                    }
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        return await self.db.user_events.aggregate(pipeline).to_list(None)
    
    async def _calculate_engagement_score(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Calculate user engagement score"""
        metrics = await self.get_user_engagement_metrics(user_id, start_date, end_date)
        
        if not metrics:
            return {"score": 0, "factors": {}}
        
        # Calculate weighted score
        total_score = 0
        factors = {}
        
        for metric in metrics:
            # Session frequency (30%)
            session_score = min(metric.session_count * 10, 30)
            factors["session_frequency"] = session_score
            
            # Time spent (25%)
            time_score = min(metric.total_time_seconds / 3600 * 5, 25)
            factors["time_spent"] = time_score
            
            # Problem solving (20%)
            problem_score = min(metric.problem_solves * 2, 20)
            factors["problem_solving"] = problem_score
            
            # Course progress (15%)
            course_score = min(metric.courses_completed * 5, 15)
            factors["course_progress"] = course_score
            
            # AI interaction (10%)
            ai_score = min(metric.ai_interactions * 1, 10)
            factors["ai_interaction"] = ai_score
            
            total_score += session_score + time_score + problem_score + course_score + ai_score
        
        return {
            "score": round(min(total_score, 100), 2),
            "factors": factors,
            "grade": self._get_engagement_grade(min(total_score, 100))
        }
    
    def _get_engagement_grade(self, score: float) -> str:
        """Get engagement grade based on score"""
        if score >= 90:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 60:
            return "Average"
        elif score >= 40:
            return "Below Average"
        else:
            return "Poor"

# Global instance
user_analytics_service = UserAnalyticsService()

async def get_user_analytics_service() -> UserAnalyticsService:
    """Get the user analytics service instance"""
    if not user_analytics_service.db:
        await user_analytics_service.initialize()
    return user_analytics_service

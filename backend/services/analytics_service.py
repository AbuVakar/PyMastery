"""
Analytics Service for PyMastery
Handles user behavior tracking, insights generation, and learning path optimization
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import json
import logging
from collections import defaultdict
import statistics

from database.mongodb import get_database
from services.ai_service import AIService, DifficultyLevel

logger = logging.getLogger(__name__)

class EventType(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    COURSE_START = "course_start"
    COURSE_COMPLETE = "course_complete"
    LESSON_START = "lesson_start"
    LESSON_COMPLETE = "lesson_complete"
    PROBLEM_ATTEMPT = "problem_attempt"
    PROBLEM_SUCCESS = "problem_success"
    PROBLEM_FAILURE = "problem_failure"
    CODE_SUBMIT = "code_submit"
    TUTOR_SESSION = "tutor_session"
    LEARNING_PATH_START = "learning_path_start"
    LEARNING_PATH_COMPLETE = "learning_path_complete"
    RECOMMENDATION_CLICK = "recommendation_click"
    PAGE_VIEW = "page_view"
    FEATURE_USE = "feature_use"

class InsightType(str, Enum):
    ENGAGEMENT = "engagement"
    PERFORMANCE = "performance"
    PROGRESS = "progress"
    BEHAVIOR = "behavior"
    RETENTION = "retention"
    OPTIMIZATION = "optimization"

@dataclass
class UserEvent:
    user_id: str
    event_type: EventType
    timestamp: datetime
    data: Dict[str, Any]
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

@dataclass
class UserBehaviorMetrics:
    user_id: str
    total_sessions: int
    total_time_spent: int
    average_session_duration: float
    most_active_hour: int
    most_active_day: str
    preferred_features: List[str]
    engagement_score: float
    retention_score: float
    learning_velocity: float
    difficulty_preference: str
    interaction_patterns: Dict[str, Any]

@dataclass
class LearningInsight:
    user_id: str
    insight_type: InsightType
    title: str
    description: str
    confidence: float
    actionable: bool
    recommendations: List[str]
    data: Dict[str, Any]
    created_at: datetime

@dataclass
class AdaptiveRecommendation:
    user_id: str
    recommendation_type: str
    content_id: str
    title: str
    description: str
    priority: float
    reasoning: str
    estimated_difficulty: str
    estimated_time: int
    adaptation_factors: Dict[str, Any]

class AnalyticsService:
    def __init__(self, db, ai_service: Optional[AIService] = None):
        self.db = db
        self.ai_service = ai_service
        self.behavior_cache = {}
        self.insight_cache = {}
        
    async def track_event(self, event: UserEvent) -> bool:
        """Track user event for analytics"""
        try:
            # Store event in database
            await self.db.user_events.insert_one({
                "user_id": event.user_id,
                "event_type": event.event_type.value,
                "timestamp": event.timestamp,
                "data": event.data,
                "session_id": event.session_id,
                "ip_address": event.ip_address,
                "user_agent": event.user_agent,
                "created_at": datetime.now(timezone.utc)
            })
            
            # Update real-time metrics
            await self._update_realtime_metrics(event)
            
            # Trigger insight generation if needed
            await self._check_insight_triggers(event)
            
            logger.info(f"Event tracked: {event.event_type.value} for user {event.user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error tracking event: {e}")
            return False
    
    async def get_user_behavior_metrics(self, user_id: str, days: int = 30) -> UserBehaviorMetrics:
        """Get comprehensive user behavior metrics"""
        try:
            # Check cache first
            cache_key = f"behavior_metrics_{user_id}_{days}"
            if cache_key in self.behavior_cache:
                cached_time = self.behavior_cache[cache_key].get("timestamp")
                if cached_time and (datetime.now(timezone.utc) - cached_time).hours < 1:
                    return self.behavior_cache[cache_key]["metrics"]
            
            # Get events from database
            start_date = datetime.now(timezone.utc) - timedelta(days=days)
            events = await self.db.user_events.find({
                "user_id": user_id,
                "timestamp": {"$gte": start_date}
            }).sort("timestamp", 1).to_list(None)
            
            if not events:
                return self._get_default_behavior_metrics(user_id)
            
            # Calculate metrics
            metrics = await self._calculate_behavior_metrics(user_id, events)
            
            # Cache results
            self.behavior_cache[cache_key] = {
                "metrics": metrics,
                "timestamp": datetime.now(timezone.utc)
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting behavior metrics: {e}")
            return self._get_default_behavior_metrics(user_id)
    
    async def generate_insights(self, user_id: str, insight_types: List[InsightType] = None) -> List[LearningInsight]:
        """Generate AI-powered learning insights"""
        try:
            if insight_types is None:
                insight_types = list(InsightType)
            
            insights = []
            
            # Get user data
            behavior_metrics = await self.get_user_behavior_metrics(user_id)
            recent_events = await self._get_recent_events(user_id, days=7)
            learning_progress = await self._get_learning_progress(user_id)
            
            for insight_type in insight_types:
                insight = await self._generate_insight(
                    user_id, insight_type, behavior_metrics, recent_events, learning_progress
                )
                if insight:
                    insights.append(insight)
            
            # Store insights
            if insights:
                await self._store_insights(insights)
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return []
    
    async def optimize_learning_path(self, user_id: str, current_path_id: str) -> Dict[str, Any]:
        """Optimize learning path based on user behavior and performance"""
        try:
            # Get current learning path
            current_path = await self.db.learning_paths.find_one({"path_id": current_path_id})
            if not current_path:
                return {"error": "Learning path not found"}
            
            # Get user behavior and performance data
            behavior_metrics = await self.get_user_behavior_metrics(user_id)
            performance_data = await self._get_performance_data(user_id)
            interaction_data = await self._get_interaction_data(user_id)
            
            # Generate optimization recommendations
            optimizations = await self._generate_path_optimizations(
                current_path, behavior_metrics, performance_data, interaction_data
            )
            
            # Create optimized path
            optimized_path = await self._create_optimized_path(
                current_path, optimizations, user_id
            )
            
            return {
                "original_path": current_path,
                "optimized_path": optimized_path,
                "optimizations": optimizations,
                "confidence": optimizations.get("confidence", 0.8),
                "reasoning": optimizations.get("reasoning", "Based on user behavior patterns")
            }
            
        except Exception as e:
            logger.error(f"Error optimizing learning path: {e}")
            return {"error": str(e)}
    
    async def get_adaptive_recommendations(self, user_id: str, count: int = 10) -> List[AdaptiveRecommendation]:
        """Get adaptive recommendations based on user behavior"""
        try:
            # Get user behavior and preferences
            behavior_metrics = await self.get_user_behavior_metrics(user_id)
            learning_profile = await self._get_learning_profile(user_id)
            recent_activity = await self._get_recent_activity(user_id)
            
            # Generate recommendations
            recommendations = []
            
            # Course recommendations
            course_recs = await self._generate_course_recommendations(
                user_id, behavior_metrics, learning_profile, count // 2
            )
            recommendations.extend(course_recs)
            
            # Problem recommendations
            problem_recs = await self._generate_problem_recommendations(
                user_id, behavior_metrics, recent_activity, count // 2
            )
            recommendations.extend(problem_recs)
            
            # Sort by priority
            recommendations.sort(key=lambda x: x.priority, reverse=True)
            
            return recommendations[:count]
            
        except Exception as e:
            logger.error(f"Error getting adaptive recommendations: {e}")
            return []
    
    async def get_engagement_analytics(self, user_id: str = None, days: int = 30) -> Dict[str, Any]:
        """Get engagement analytics"""
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            if user_id:
                # Single user analytics
                events = await self.db.user_events.find({
                    "user_id": user_id,
                    "timestamp": {"$gte": start_date}
                }).to_list(None)
                
                return await self._calculate_user_engagement(user_id, events, days)
            else:
                # Global analytics
                events = await self.db.user_events.find({
                    "timestamp": {"$gte": start_date}
                }).to_list(None)
                
                return await self._calculate_global_engagement(events, days)
                
        except Exception as e:
            logger.error(f"Error getting engagement analytics: {e}")
            return {}
    
    async def get_retention_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get user retention analytics"""
        try:
            # Get user cohorts
            cohorts = await self._get_user_cohorts(days)
            
            retention_data = {}
            for cohort_name, cohort_users in cohorts.items():
                retention_data[cohort_name] = await self._calculate_cohort_retention(
                    cohort_users, days
                )
            
            return {
                "cohorts": retention_data,
                "overall_retention": await self._calculate_overall_retention(days),
                "retention_rate": await self._calculate_retention_rate(days)
            }
            
        except Exception as e:
            logger.error(f"Error getting retention analytics: {e}")
            return {}
    
    async def _update_realtime_metrics(self, event: UserEvent):
        """Update real-time metrics"""
        try:
            # Update daily active users
            date_key = event.timestamp.strftime("%Y-%m-%d")
            await self.db.daily_metrics.update_one(
                {"date": date_key},
                {
                    "$inc": {
                        "total_events": 1,
                        f"event_types.{event.event_type.value}": 1
                    },
                    "$addToSet": {
                        "active_users": event.user_id
                    }
                },
                upsert=True
            )
            
            # Update user session metrics
            if event.session_id:
                await self.db.user_sessions.update_one(
                    {"session_id": event.session_id},
                    {
                        "$set": {
                            "last_activity": event.timestamp,
                            "user_id": event.user_id
                        },
                        "$inc": {
                            "event_count": 1
                        }
                    },
                    upsert=True
                )
            
        except Exception as e:
            logger.error(f"Error updating realtime metrics: {e}")
    
    async def _check_insight_triggers(self, event: UserEvent):
        """Check if event triggers insight generation"""
        try:
            # Define trigger conditions
            triggers = {
                EventType.PROBLEM_FAILURE: 5,  # Generate insight after 5 failures
                EventType.LESSON_COMPLETE: 10,  # Generate insight after 10 lessons
                EventType.LOGIN: 7,  # Weekly engagement insight
            }
            
            event_type = event.event_type
            if event_type in triggers:
                # Count recent events of this type
                recent_count = await self.db.user_events.count_documents({
                    "user_id": event.user_id,
                    "event_type": event_type.value,
                    "timestamp": {"$gte": datetime.now(timezone.utc) - timedelta(days=7)}
                })
                
                if recent_count >= triggers[event_type]:
                    # Trigger insight generation
                    await self.generate_insights(event.user_id)
            
        except Exception as e:
            logger.error(f"Error checking insight triggers: {e}")
    
    async def _calculate_behavior_metrics(self, user_id: str, events: List[Dict]) -> UserBehaviorMetrics:
        """Calculate comprehensive behavior metrics"""
        try:
            # Session analysis
            sessions = await self._analyze_sessions(events)
            
            # Time analysis
            time_metrics = await self._analyze_time_patterns(events)
            
            # Feature usage
            feature_usage = await self._analyze_feature_usage(events)
            
            # Engagement calculation
            engagement_score = await self._calculate_engagement_score(events)
            
            # Retention calculation
            retention_score = await self._calculate_retention_score(events)
            
            # Learning velocity
            learning_velocity = await self._calculate_learning_velocity(events)
            
            # Difficulty preference
            difficulty_preference = await self._analyze_difficulty_preference(events)
            
            # Interaction patterns
            interaction_patterns = await self._analyze_interaction_patterns(events)
            
            return UserBehaviorMetrics(
                user_id=user_id,
                total_sessions=len(sessions),
                total_time_spent=time_metrics["total_time"],
                average_session_duration=time_metrics["avg_duration"],
                most_active_hour=time_metrics["most_active_hour"],
                most_active_day=time_metrics["most_active_day"],
                preferred_features=feature_usage["top_features"],
                engagement_score=engagement_score,
                retention_score=retention_score,
                learning_velocity=learning_velocity,
                difficulty_preference=difficulty_preference,
                interaction_patterns=interaction_patterns
            )
            
        except Exception as e:
            logger.error(f"Error calculating behavior metrics: {e}")
            return self._get_default_behavior_metrics(user_id)
    
    async def _generate_insight(self, user_id: str, insight_type: InsightType, 
                              behavior_metrics: UserBehaviorMetrics, 
                              recent_events: List[Dict], 
                              learning_progress: Dict) -> Optional[LearningInsight]:
        """Generate specific insight using AI"""
        try:
            if not self.ai_service:
                return None
            
            # Prepare data for AI
            insight_data = {
                "insight_type": insight_type.value,
                "behavior_metrics": {
                    "engagement_score": behavior_metrics.engagement_score,
                    "retention_score": behavior_metrics.retention_score,
                    "learning_velocity": behavior_metrics.learning_velocity,
                    "preferred_features": behavior_metrics.preferred_features,
                    "interaction_patterns": behavior_metrics.interaction_patterns
                },
                "recent_events": recent_events[-10:],  # Last 10 events
                "learning_progress": learning_progress
            }
            
            # Generate insight using AI
            ai_response = await self.ai_service.generate_learning_insight(
                user_id, insight_data
            )
            
            if ai_response:
                return LearningInsight(
                    user_id=user_id,
                    insight_type=insight_type,
                    title=ai_response.get("title", "Learning Insight"),
                    description=ai_response.get("description", ""),
                    confidence=ai_response.get("confidence", 0.8),
                    actionable=ai_response.get("actionable", True),
                    recommendations=ai_response.get("recommendations", []),
                    data=ai_response.get("data", {}),
                    created_at=datetime.now(timezone.utc)
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating insight: {e}")
            return None
    
    async def _generate_path_optimizations(self, current_path: Dict, 
                                          behavior_metrics: UserBehaviorMetrics,
                                          performance_data: Dict,
                                          interaction_data: Dict) -> Dict[str, Any]:
        """Generate learning path optimizations"""
        try:
            optimizations = {
                "content_adjustments": [],
                "difficulty_adjustments": [],
                "sequence_adjustments": [],
                "resource_additions": [],
                "confidence": 0.8,
                "reasoning": ""
            }
            
            # Analyze performance patterns
            if performance_data.get("average_score", 0) < 70:
                optimizations["difficulty_adjustments"].append({
                    "type": "reduce_difficulty",
                    "reason": "Low performance scores suggest difficulty is too high",
                    "adjustment": "Decrease difficulty by 1 level"
                })
            
            # Analyze engagement patterns
            if behavior_metrics.engagement_score < 0.6:
                optimizations["content_adjustments"].append({
                    "type": "increase_engagement",
                    "reason": "Low engagement score",
                    "adjustment": "Add more interactive content and gamification"
                })
            
            # Analyze learning velocity
            if behavior_metrics.learning_velocity < 0.5:
                optimizations["sequence_adjustments"].append({
                    "type": "adjust_pace",
                    "reason": "Slow learning velocity",
                    "adjustment": "Break down complex topics into smaller steps"
                })
            
            # Generate reasoning
            reasoning_parts = []
            if optimizations["content_adjustments"]:
                reasoning_parts.append("content adjustments for better engagement")
            if optimizations["difficulty_adjustments"]:
                reasoning_parts.append("difficulty adjustments based on performance")
            if optimizations["sequence_adjustments"]:
                reasoning_parts.append("sequence adjustments for learning pace")
            
            optimizations["reasoning"] = f"Optimizations recommended: {', '.join(reasoning_parts)}"
            
            return optimizations
            
        except Exception as e:
            logger.error(f"Error generating path optimizations: {e}")
            return {}
    
    async def _create_optimized_path(self, original_path: Dict, 
                                   optimizations: Dict, 
                                   user_id: str) -> Dict[str, Any]:
        """Create optimized learning path"""
        try:
            optimized_path = original_path.copy()
            
            # Apply optimizations
            for adjustment in optimizations.get("difficulty_adjustments", []):
                if adjustment["type"] == "reduce_difficulty":
                    # Reduce difficulty levels
                    optimized_path["difficulty_progression"] = [
                        max(DifficultyLevel.BEGINNER, 
                            DifficultyLevel(level - 1))
                        for level in optimized_path.get("difficulty_progression", [])
                    ]
            
            for adjustment in optimizations.get("content_adjustments", []):
                if adjustment["type"] == "increase_engagement":
                    # Add interactive elements
                    optimized_path["resources"] = optimized_path.get("resources", []) + [
                        "interactive_exercises",
                        "gamified_content",
                        "peer_collaboration"
                    ]
            
            for adjustment in optimizations.get("sequence_adjustments", []):
                if adjustment["type"] == "adjust_pace":
                    # Add more milestones
                    current_milestones = optimized_path.get("milestones", [])
                    if len(current_milestones) > 1:
                        new_milestones = []
                        for i, milestone in enumerate(current_milestones):
                            new_milestones.append(milestone)
                            if i < len(current_milestones) - 1:
                                # Add intermediate milestone
                                next_milestone = current_milestones[i + 1]
                                new_milestones.append({
                                    "title": f"Progress Check: {milestone['title']}",
                                    "day": milestone["day"] + (next_milestone["day"] - milestone["day"]) // 2,
                                    "description": "Intermediate progress check and reinforcement"
                                })
                        optimized_path["milestones"] = new_milestones
            
            # Add optimization metadata
            optimized_path["optimization_metadata"] = {
                "original_path_id": original_path.get("path_id"),
                "optimized_at": datetime.now(timezone.utc).isoformat(),
                "optimization_confidence": optimizations.get("confidence", 0.8),
                "applied_optimizations": len(
                    optimizations.get("content_adjustments", []) +
                    optimizations.get("difficulty_adjustments", []) +
                    optimizations.get("sequence_adjustments", [])
                )
            }
            
            # Save optimized path
            optimized_path_id = f"optimized_{user_id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
            optimized_path["path_id"] = optimized_path_id
            optimized_path["user_id"] = user_id
            optimized_path["is_optimized"] = True
            optimized_path["created_at"] = datetime.now(timezone.utc)
            
            await self.db.learning_paths.insert_one(optimized_path)
            
            return optimized_path
            
        except Exception as e:
            logger.error(f"Error creating optimized path: {e}")
            return original_path
    
    async def _get_default_behavior_metrics(self, user_id: str) -> UserBehaviorMetrics:
        """Get default behavior metrics for new users"""
        return UserBehaviorMetrics(
            user_id=user_id,
            total_sessions=0,
            total_time_spent=0,
            average_session_duration=0.0,
            most_active_hour=12,
            most_active_day="Monday",
            preferred_features=[],
            engagement_score=0.0,
            retention_score=0.0,
            learning_velocity=0.0,
            difficulty_preference="beginner",
            interaction_patterns={}
        )
    
    async def _analyze_sessions(self, events: List[Dict]) -> List[Dict]:
        """Analyze user sessions"""
        sessions = []
        current_session = None
        
        for event in events:
            session_id = event.get("session_id")
            if session_id != current_session:
                current_session = session_id
                sessions.append({
                    "session_id": session_id,
                    "start_time": event["timestamp"],
                    "events": [event]
                })
            else:
                sessions[-1]["events"].append(event)
                sessions[-1]["end_time"] = event["timestamp"]
        
        return sessions
    
    async def _analyze_time_patterns(self, events: List[Dict]) -> Dict[str, Any]:
        """Analyze time patterns"""
        if not events:
            return {"total_time": 0, "avg_duration": 0, "most_active_hour": 12, "most_active_day": "Monday"}
        
        # Calculate total time and session durations
        sessions = await self._analyze_sessions(events)
        total_time = 0
        durations = []
        
        for session in sessions:
            if "end_time" in session:
                duration = (session["end_time"] - session["start_time"]).total_seconds()
                total_time += duration
                durations.append(duration)
        
        # Most active hour
        hours = [event["timestamp"].hour for event in events]
        most_active_hour = int(statistics.mode(hours)) if hours else 12
        
        # Most active day
        days = [event["timestamp"].strftime("%A") for event in events]
        most_active_day = statistics.mode(days) if days else "Monday"
        
        return {
            "total_time": int(total_time),
            "avg_duration": statistics.mean(durations) if durations else 0,
            "most_active_hour": most_active_hour,
            "most_active_day": most_active_day
        }
    
    async def _analyze_feature_usage(self, events: List[Dict]) -> Dict[str, Any]:
        """Analyze feature usage patterns"""
        feature_counts = defaultdict(int)
        
        for event in events:
            if event["event_type"] == EventType.FEATURE_USE.value:
                feature = event["data"].get("feature", "unknown")
                feature_counts[feature] += 1
        
        # Sort by usage and get top features
        sorted_features = sorted(feature_counts.items(), key=lambda x: x[1], reverse=True)
        top_features = [feature for feature, count in sorted_features[:5]]
        
        return {
            "feature_counts": dict(feature_counts),
            "top_features": top_features
        }
    
    async def _calculate_engagement_score(self, events: List[Dict]) -> float:
        """Calculate engagement score"""
        if not events:
            return 0.0
        
        # Engagement factors
        login_events = sum(1 for e in events if e["event_type"] == EventType.LOGIN.value)
        lesson_events = sum(1 for e in events if e["event_type"] in [EventType.LESSON_START.value, EventType.LESSON_COMPLETE.value])
        problem_events = sum(1 for e in events if e["event_type"] in [EventType.PROBLEM_ATTEMPT.value, EventType.PROBLEM_SUCCESS.value])
        
        # Calculate score (0-1 scale)
        engagement_factors = [
            min(login_events / 7, 1.0),  # Weekly logins
            min(lesson_events / 10, 1.0),  # Lesson interactions
            min(problem_events / 20, 1.0)  # Problem attempts
        ]
        
        return statistics.mean(engagement_factors)
    
    async def _calculate_retention_score(self, events: List[Dict]) -> float:
        """Calculate retention score"""
        if not events:
            return 0.0
        
        # Calculate day streak
        dates = set(event["timestamp"].date() for event in events)
        sorted_dates = sorted(dates)
        
        streak = 1
        max_streak = 1
        
        for i in range(1, len(sorted_dates)):
            if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
                streak += 1
                max_streak = max(max_streak, streak)
            else:
                streak = 1
        
        # Normalize to 0-1 scale (30-day max streak)
        return min(max_streak / 30, 1.0)
    
    async def _calculate_learning_velocity(self, events: List[Dict]) -> float:
        """Calculate learning velocity"""
        if not events:
            return 0.0
        
        # Count completed items
        completed_lessons = sum(1 for e in events if e["event_type"] == EventType.LESSON_COMPLETE.value)
        completed_problems = sum(1 for e in events if e["event_type"] == EventType.PROBLEM_SUCCESS.value)
        completed_courses = sum(1 for e in events if e["event_type"] == EventType.COURSE_COMPLETE.value)
        
        # Calculate velocity (completed items per day)
        date_range = (events[-1]["timestamp"] - events[0]["timestamp"]).days + 1
        total_completed = completed_lessons + completed_problems + (completed_courses * 10)  # Weight courses more
        
        return total_completed / date_range if date_range > 0 else 0.0
    
    async def _analyze_difficulty_preference(self, events: List[Dict]) -> str:
        """Analyze difficulty preference"""
        difficulty_counts = defaultdict(int)
        
        for event in events:
            if "difficulty" in event["data"]:
                difficulty = event["data"]["difficulty"]
                difficulty_counts[difficulty] += 1
        
        if not difficulty_counts:
            return "beginner"
        
        # Return most common difficulty
        return max(difficulty_counts.items(), key=lambda x: x[1])[0]
    
    async def _analyze_interaction_patterns(self, events: List[Dict]) -> Dict[str, Any]:
        """Analyze interaction patterns"""
        patterns = {
            "session_frequency": 0,
            "preferred_session_length": 0,
            "feature_diversity": 0,
            "time_of_day_preference": "morning"
        }
        
        # Session frequency
        sessions = await self._analyze_sessions(events)
        if sessions:
            date_range = (events[-1]["timestamp"] - events[0]["timestamp"]).days + 1
            patterns["session_frequency"] = len(sessions) / date_range
        
        # Preferred session length
        durations = []
        for session in sessions:
            if "end_time" in session:
                duration = (session["end_time"] - session["start_time"]).total_seconds() / 60  # minutes
                durations.append(duration)
        
        if durations:
            patterns["preferred_session_length"] = statistics.mean(durations)
        
        # Feature diversity
        features = set()
        for event in events:
            if event["event_type"] == EventType.FEATURE_USE.value:
                features.add(event["data"].get("feature", "unknown"))
        patterns["feature_diversity"] = len(features)
        
        # Time of day preference
        hours = [event["timestamp"].hour for event in events]
        if hours:
            avg_hour = statistics.mean(hours)
            if 6 <= avg_hour < 12:
                patterns["time_of_day_preference"] = "morning"
            elif 12 <= avg_hour < 18:
                patterns["time_of_day_preference"] = "afternoon"
            elif 18 <= avg_hour < 22:
                patterns["time_of_day_preference"] = "evening"
            else:
                patterns["time_of_day_preference"] = "night"
        
        return patterns
    
    async def _get_recent_events(self, user_id: str, days: int = 7) -> List[Dict]:
        """Get recent events for user"""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        return await self.db.user_events.find({
            "user_id": user_id,
            "timestamp": {"$gte": start_date}
        }).sort("timestamp", -1).to_list(None)
    
    async def _get_learning_progress(self, user_id: str) -> Dict[str, Any]:
        """Get learning progress for user"""
        try:
            # Get course progress
            enrollments = await self.db.enrollments.find({"user_id": user_id}).to_list(None)
            
            progress_data = {
                "courses_enrolled": len(enrollments),
                "courses_completed": sum(1 for e in enrollments if e.get("status") == "completed"),
                "average_progress": 0,
                "total_lessons": 0,
                "completed_lessons": 0
            }
            
            if enrollments:
                total_progress = sum(e.get("progress", 0) for e in enrollments)
                progress_data["average_progress"] = total_progress / len(enrollments)
                progress_data["total_lessons"] = sum(e.get("total_lessons", 0) for e in enrollments)
                progress_data["completed_lessons"] = sum(e.get("completed_lessons", 0) for e in enrollments)
            
            return progress_data
            
        except Exception as e:
            logger.error(f"Error getting learning progress: {e}")
            return {}
    
    async def _store_insights(self, insights: List[LearningInsight]):
        """Store insights in database"""
        try:
            for insight in insights:
                await self.db.learning_insights.insert_one({
                    "user_id": insight.user_id,
                    "insight_type": insight.insight_type.value,
                    "title": insight.title,
                    "description": insight.description,
                    "confidence": insight.confidence,
                    "actionable": insight.actionable,
                    "recommendations": insight.recommendations,
                    "data": insight.data,
                    "created_at": insight.created_at
                })
            
            logger.info(f"Stored {len(insights)} insights")
            
        except Exception as e:
            logger.error(f"Error storing insights: {e}")
    
    async def _get_performance_data(self, user_id: str) -> Dict[str, Any]:
        """Get performance data for user"""
        try:
            # Get submission data
            submissions = await self.db.submissions.find({"user_id": user_id}).to_list(None)
            
            performance_data = {
                "total_submissions": len(submissions),
                "successful_submissions": sum(1 for s in submissions if s.get("overall_status") == "success"),
                "average_score": 0,
                "difficulty_distribution": defaultdict(int)
            }
            
            if submissions:
                scores = [s.get("score", 0) for s in submissions if s.get("score") is not None]
                if scores:
                    performance_data["average_score"] = statistics.mean(scores)
                
                for submission in submissions:
                    difficulty = submission.get("difficulty", "unknown")
                    performance_data["difficulty_distribution"][difficulty] += 1
            
            return performance_data
            
        except Exception as e:
            logger.error(f"Error getting performance data: {e}")
            return {}
    
    async def _get_interaction_data(self, user_id: str) -> Dict[str, Any]:
        """Get interaction data for user"""
        try:
            # Get recent interactions
            recent_events = await self._get_recent_events(user_id, days=30)
            
            interaction_data = {
                "total_interactions": len(recent_events),
                "interaction_types": defaultdict(int),
                "session_data": await self._analyze_sessions(recent_events),
                "feature_usage": await self._analyze_feature_usage(recent_events)
            }
            
            for event in recent_events:
                interaction_data["interaction_types"][event["event_type"]] += 1
            
            return interaction_data
            
        except Exception as e:
            logger.error(f"Error getting interaction data: {e}")
            return {}
    
    async def _generate_course_recommendations(self, user_id: str, behavior_metrics: UserBehaviorMetrics,
                                             learning_profile: Dict, count: int) -> List[AdaptiveRecommendation]:
        """Generate course recommendations"""
        try:
            recommendations = []
            
            # Get user's current skills and goals
            current_skills = learning_profile.get("current_skills", [])
            goals = learning_profile.get("goals", [])
            difficulty_preference = behavior_metrics.difficulty_preference
            
            # Get available courses
            courses = await self.db.courses.find({
                "difficulty": difficulty_preference
            }).limit(count * 2).to_list(None)  # Get more to filter
            
            # Filter and score courses
            for course in courses:
                score = 0.0
                reasoning_parts = []
                
                # Skill alignment
                course_skills = course.get("skills_taught", [])
                skill_alignment = len(set(current_skills) & set(course_skills))
                score += skill_alignment * 0.3
                if skill_alignment > 0:
                    reasoning_parts.append(f"aligns with {skill_alignment} current skills")
                
                # Goal alignment
                course_tags = course.get("tags", [])
                goal_alignment = len(set(goals) & set(course_tags))
                score += goal_alignment * 0.4
                if goal_alignment > 0:
                    reasoning_parts.append(f"matches {goal_alignment} learning goals")
                
                # Engagement potential
                if course.get("interactive_elements", 0) > 5:
                    score += 0.2
                    reasoning_parts.append("highly interactive content")
                
                # Difficulty match
                if course.get("difficulty") == difficulty_preference:
                    score += 0.1
                    reasoning_parts.append("matches preferred difficulty")
                
                if score > 0.3:  # Minimum threshold
                    recommendations.append(AdaptiveRecommendation(
                        user_id=user_id,
                        recommendation_type="course",
                        content_id=str(course["_id"]),
                        title=course.get("title", ""),
                        description=course.get("description", ""),
                        priority=score,
                        reasoning="; ".join(reasoning_parts),
                        estimated_difficulty=course.get("difficulty", "beginner"),
                        estimated_time=course.get("estimated_duration", 40),
                        adaptation_factors={
                            "skill_alignment": skill_alignment,
                            "goal_alignment": goal_alignment,
                            "engagement_potential": course.get("interactive_elements", 0)
                        }
                    ))
            
            return sorted(recommendations, key=lambda x: x.priority, reverse=True)[:count]
            
        except Exception as e:
            logger.error(f"Error generating course recommendations: {e}")
            return []
    
    async def _generate_problem_recommendations(self, user_id: str, behavior_metrics: UserBehaviorMetrics,
                                              recent_activity: Dict, count: int) -> List[AdaptiveRecommendation]:
        """Generate problem recommendations"""
        try:
            recommendations = []
            
            # Get user's recent problem attempts
            recent_problems = await self.db.submissions.find({
                "user_id": user_id,
                "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=7)}
            }).sort("created_at", -1).limit(20).to_list(None)
            
            # Analyze performance patterns
            if recent_problems:
                recent_scores = [p.get("score", 0) for p in recent_problems if p.get("score") is not None]
                avg_score = statistics.mean(recent_scores) if recent_scores else 0
                
                # Recommend based on performance
                if avg_score < 70:
                    # Recommend easier problems
                    difficulty = "beginner"
                    reasoning = "recent performance suggests need for practice with easier problems"
                elif avg_score > 90:
                    # Recommend harder problems
                    difficulty = "advanced"
                    reasoning = "excellent performance suggests ready for challenge"
                else:
                    # Recommend similar difficulty
                    difficulty = "intermediate"
                    reasoning = "good performance suggests appropriate difficulty level"
            else:
                # New user - start with beginner
                difficulty = "beginner"
                reasoning = "new user - starting with foundational problems"
            
            # Get problems at recommended difficulty
            problems = await self.db.problems.find({
                "difficulty": difficulty
            }).limit(count).to_list(None)
            
            for problem in problems:
                recommendations.append(AdaptiveRecommendation(
                    user_id=user_id,
                    recommendation_type="problem",
                    content_id=str(problem["_id"]),
                    title=problem.get("title", ""),
                    description=problem.get("description", ""),
                    priority=0.7,  # Base priority for problems
                    reasoning=reasoning,
                    estimated_difficulty=difficulty,
                    estimated_time=problem.get("estimated_time", 30),
                    adaptation_factors={
                        "performance_based": True,
                        "difficulty_adapted": True
                    }
                ))
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating problem recommendations: {e}")
            return []
    
    async def _get_learning_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user learning profile"""
        try:
            profile = await self.db.user_profiles.find_one({"user_id": user_id})
            return profile or {}
        except Exception as e:
            logger.error(f"Error getting learning profile: {e}")
            return {}
    
    async def _get_recent_activity(self, user_id: str) -> Dict[str, Any]:
        """Get recent activity data"""
        try:
            recent_events = await self._get_recent_events(user_id, days=7)
            
            activity_data = {
                "total_events": len(recent_events),
                "event_types": defaultdict(int),
                "daily_activity": defaultdict(int)
            }
            
            for event in recent_events:
                activity_data["event_types"][event["event_type"]] += 1
                day_key = event["timestamp"].strftime("%Y-%m-%d")
                activity_data["daily_activity"][day_key] += 1
            
            return activity_data
            
        except Exception as e:
            logger.error(f"Error getting recent activity: {e}")
            return {}
    
    async def _calculate_user_engagement(self, user_id: str, events: List[Dict], days: int) -> Dict[str, Any]:
        """Calculate engagement for specific user"""
        try:
            # Daily engagement
            daily_engagement = defaultdict(int)
            for event in events:
                day_key = event["timestamp"].strftime("%Y-%m-%d")
                daily_engagement[day_key] += 1
            
            # Engagement metrics
            total_events = len(events)
            avg_daily_events = total_events / days if days > 0 else 0
            
            # Feature usage
            feature_usage = defaultdict(int)
            for event in events:
                if event["event_type"] == EventType.FEATURE_USE.value:
                    feature = event["data"].get("feature", "unknown")
                    feature_usage[feature] += 1
            
            return {
                "user_id": user_id,
                "total_events": total_events,
                "avg_daily_events": avg_daily_events,
                "daily_engagement": dict(daily_engagement),
                "feature_usage": dict(feature_usage),
                "engagement_score": min(avg_daily_events / 10, 1.0)  # Normalize to 0-1
            }
            
        except Exception as e:
            logger.error(f"Error calculating user engagement: {e}")
            return {}
    
    async def _calculate_global_engagement(self, events: List[Dict], days: int) -> Dict[str, Any]:
        """Calculate global engagement metrics"""
        try:
            # Event type distribution
            event_types = defaultdict(int)
            for event in events:
                event_types[event["event_type"]] += 1
            
            # Daily engagement
            daily_engagement = defaultdict(int)
            for event in events:
                day_key = event["timestamp"].strftime("%Y-%m-%d")
                daily_engagement[day_key] += 1
            
            # Active users
            active_users = set(event.get("user_id") for event in events)
            
            # Hourly patterns
            hourly_engagement = defaultdict(int)
            for event in events:
                hour = event["timestamp"].hour
                hourly_engagement[hour] += 1
            
            return {
                "total_events": len(events),
                "unique_users": len(active_users),
                "avg_events_per_user": len(events) / len(active_users) if active_users else 0,
                "event_type_distribution": dict(event_types),
                "daily_engagement": dict(daily_engagement),
                "hourly_engagement": dict(hourly_engagement),
                "avg_daily_events": len(events) / days if days > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error calculating global engagement: {e}")
            return {}
    
    async def _get_user_cohorts(self, days: int) -> Dict[str, List[str]]:
        """Get user cohorts for retention analysis"""
        try:
            cohorts = {
                "new_users": [],
                "returning_users": [],
                "active_users": [],
                "inactive_users": []
            }
            
            # Get all users who had events in the period
            start_date = datetime.now(timezone.utc) - timedelta(days=days)
            user_events = await self.db.user_events.find({
                "timestamp": {"$gte": start_date}
            }).to_list(None)
            
            # Group users by activity patterns
            user_activity = defaultdict(list)
            for event in user_events:
                user_activity[event["user_id"]].append(event)
            
            for user_id, events in user_activity.items():
                # Determine cohort based on activity pattern
                first_event = min(events, key=lambda x: x["timestamp"])
                days_since_first = (datetime.now(timezone.utc) - first_event["timestamp"]).days
                
                if days_since_first <= 7:
                    cohorts["new_users"].append(user_id)
                elif days_since_first <= 30:
                    cohorts["returning_users"].append(user_id)
                
                # Check recent activity
                recent_events = [e for e in events if (datetime.now(timezone.utc) - e["timestamp"]).days <= 7]
                if recent_events:
                    cohorts["active_users"].append(user_id)
                else:
                    cohorts["inactive_users"].append(user_id)
            
            return cohorts
            
        except Exception as e:
            logger.error(f"Error getting user cohorts: {e}")
            return {}
    
    async def _calculate_cohort_retention(self, cohort_users: List[str], days: int) -> Dict[str, Any]:
        """Calculate retention for specific cohort"""
        try:
            if not cohort_users:
                return {}
            
            # Calculate daily retention
            daily_retention = {}
            for day in range(1, days + 1):
                retained_users = 0
                
                for user_id in cohort_users:
                    # Check if user was active on this day
                    day_start = datetime.now(timezone.utc) - timedelta(days=day)
                    day_end = day_start + timedelta(days=1)
                    
                    user_activity = await self.db.user_events.count_documents({
                        "user_id": user_id,
                        "timestamp": {"$gte": day_start, "$lt": day_end}
                    })
                    
                    if user_activity > 0:
                        retained_users += 1
                
                retention_rate = retained_users / len(cohort_users) if cohort_users else 0
                daily_retention[f"day_{day}"] = retention_rate
            
            return daily_retention
            
        except Exception as e:
            logger.error(f"Error calculating cohort retention: {e}")
            return {}
    
    async def _calculate_overall_retention(self, days: int) -> float:
        """Calculate overall retention rate"""
        try:
            # Get users from start of period
            start_date = datetime.now(timezone.utc) - timedelta(days=days)
            period_start_users = await self.db.user_events.distinct(
                "user_id", {"timestamp": {"$gte": start_date, "$lt": start_date + timedelta(days=1)}}
            )
            
            if not period_start_users:
                return 0.0
            
            # Check how many returned
            end_date = datetime.now(timezone.utc) - timedelta(days=1)
            retained_users = await self.db.user_events.distinct(
                "user_id", {"timestamp": {"$gte": end_date, "$lt": end_date + timedelta(days=1)}}
            )
            
            retained_count = len(set(period_start_users) & set(retained_users))
            return retained_count / len(period_start_users)
            
        except Exception as e:
            logger.error(f"Error calculating overall retention: {e}")
            return 0.0
    
    async def _calculate_retention_rate(self, days: int) -> Dict[str, float]:
        """Calculate retention rates by cohort"""
        try:
            cohorts = await self._get_user_cohorts(days)
            retention_rates = {}
            
            for cohort_name, cohort_users in cohorts.items():
                if cohort_users:
                    retention_rate = await self._calculate_overall_retention(days)
                    retention_rates[cohort_name] = retention_rate
            
            return retention_rates
            
        except Exception as e:
            logger.error(f"Error calculating retention rates: {e}")
            return {}

# Service factory function
async def get_analytics_service(db, ai_service: AIService = None) -> AnalyticsService:
    """Get analytics service instance"""
    return AnalyticsService(db, ai_service)

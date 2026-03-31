"""
Advanced Analytics - Learning Insights Backend
Provides comprehensive learning analytics, insights, and predictive analytics
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
from enum import Enum

from database.mongodb import get_database
from services.openai_service import OpenAIService
from services.user_service import UserService

router = APIRouter(prefix="/api/v1/analytics", tags=["Advanced Analytics"])

class MetricType(str, Enum):
    ENGAGEMENT = "engagement"
    PERFORMANCE = "performance"
    PROGRESS = "progress"
    RETENTION = "retention"
    COLLABORATION = "collaboration"
    WELLNESS = "wellness"
    SKILL_DEVELOPMENT = "skill_development"
    TIME_MANAGEMENT = "time_management"

class InsightType(str, Enum):
    TREND = "trend"
    ANOMALY = "anomaly"
    PREDICTION = "prediction"
    RECOMMENDATION = "recommendation"
    MILESTONE = "milestone"
    WARNING = "warning"
    OPPORTUNITY = "opportunity"

class LearningMetric(BaseModel):
    id: str
    user_id: str
    metric_type: MetricType
    value: float
    unit: str
    timestamp: datetime
    context: Dict[str, Any]
    metadata: Dict[str, Any]

class LearningInsight(BaseModel):
    id: str
    user_id: str
    insight_type: InsightType
    title: str
    description: str
    confidence: float
    impact: str  # "low", "medium", "high", "critical"
    actionable: bool
    recommendations: List[str]
    data_sources: List[str]
    generated_at: datetime
    expires_at: datetime

class LearningPattern(BaseModel):
    id: str
    user_id: str
    pattern_type: str
    description: str
    frequency: float
    strength: float
    contexts: List[str]
    first_observed: datetime
    last_observed: datetime
    is_positive: bool

class PredictiveModel(BaseModel):
    id: str
    name: str
    description: str
    model_type: str
    target_variable: str
    features: List[str]
    accuracy: float
    last_trained: datetime
    is_active: bool

class LearningForecast(BaseModel):
    id: str
    user_id: str
    forecast_type: str
    time_horizon_days: int
    predictions: List[Dict[str, Any]]
    confidence_intervals: List[Dict[str, Any]]
    model_id: str
    generated_at: datetime

class AdvancedAnalyticsEngine:
    def __init__(self):
        self.openai_service = OpenAIService()
        self.user_service = UserService()
        
    async def collect_learning_metrics(self, user_id: str, metric_type: MetricType, value: float, unit: str, context: Dict[str, Any] = None) -> LearningMetric:
        """Collect and store learning metrics"""
        
        metric = LearningMetric(
            id=f"metric_{datetime.utcnow().timestamp()}",
            user_id=user_id,
            metric_type=metric_type,
            value=value,
            unit=unit,
            timestamp=datetime.utcnow(),
            context=context or {},
            metadata={}
        )
        
        # Save to database
        db = await get_database()
        await db.learning_metrics.insert_one(metric.dict())
        
        return metric
    
    async def analyze_learning_patterns(self, user_id: str, days: int = 30) -> List[LearningPattern]:
        """Analyze user's learning patterns"""
        
        db = await get_database()
        
        # Get recent metrics
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        metrics = await db.learning_metrics.find({
            "user_id": user_id,
            "timestamp": {"$gte": cutoff_date}
        }).sort("timestamp", 1).to_list(length=None)
        
        patterns = []
        
        # Analyze engagement patterns
        engagement_patterns = await self.analyze_engagement_patterns(user_id, metrics)
        patterns.extend(engagement_patterns)
        
        # Analyze performance patterns
        performance_patterns = await self.analyze_performance_patterns(user_id, metrics)
        patterns.extend(performance_patterns)
        
        # Analyze time patterns
        time_patterns = await self.analyze_time_patterns(user_id, metrics)
        patterns.extend(time_patterns)
        
        return patterns
    
    async def analyze_engagement_patterns(self, user_id: str, metrics: List[Dict[str, Any]]) -> List[LearningPattern]:
        """Analyze engagement patterns"""
        
        engagement_metrics = [m for m in metrics if m.get("metric_type") == "engagement"]
        
        patterns = []
        
        # Check for declining engagement
        if len(engagement_metrics) >= 7:
            recent_avg = sum(m["value"] for m in engagement_metrics[-7:]) / 7
            earlier_avg = sum(m["value"] for m in engagement_metrics[-14:-7]) / 7 if len(engagement_metrics) >= 14 else recent_avg
            
            if recent_avg < earlier_avg * 0.8:
                patterns.append(LearningPattern(
                    id=f"pattern_{datetime.utcnow().timestamp()}_declining_engagement",
                    user_id=user_id,
                    pattern_type="declining_engagement",
                    description="Engagement has been declining over the past week",
                    frequency=1.0,
                    strength=earlier_avg - recent_avg,
                    contexts=["daily_sessions", "lesson_completion"],
                    first_observed=engagement_metrics[-14]["timestamp"] if len(engagement_metrics) >= 14 else engagement_metrics[0]["timestamp"],
                    last_observed=engagement_metrics[-1]["timestamp"],
                    is_positive=False
                ))
        
        # Check for peak engagement times
        hourly_engagement = {}
        for metric in engagement_metrics:
            hour = metric["timestamp"].hour
            if hour not in hourly_engagement:
                hourly_engagement[hour] = []
            hourly_engagement[hour].append(metric["value"])
        
        # Find peak hours
        if hourly_engagement:
            peak_hours = []
            for hour, values in hourly_engagement.items():
                avg_engagement = sum(values) / len(values)
                if avg_engagement > 0.7:  # High engagement threshold
                    peak_hours.append(hour)
            
            if peak_hours:
                patterns.append(LearningPattern(
                    id=f"pattern_{datetime.utcnow().timestamp()}_peak_hours",
                    user_id=user_id,
                    pattern_type="peak_engagement_hours",
                    description=f"User shows highest engagement during hours: {', '.join(map(str, peak_hours))}",
                    frequency=len(peak_hours) / 24,
                    strength=0.8,
                    contexts=["daily_schedule", "time_management"],
                    first_observed=engagement_metrics[0]["timestamp"],
                    last_observed=engagement_metrics[-1]["timestamp"],
                    is_positive=True
                ))
        
        return patterns
    
    async def analyze_performance_patterns(self, user_id: str, metrics: List[Dict[str, Any]]) -> List[LearningPattern]:
        """Analyze performance patterns"""
        
        performance_metrics = [m for m in metrics if m.get("metric_type") == "performance"]
        
        patterns = []
        
        # Check for improvement trends
        if len(performance_metrics) >= 5:
            recent_scores = [m["value"] for m in performance_metrics[-5:]]
            earlier_scores = [m["value"] for m in performance_metrics[-10:-5]] if len(performance_metrics) >= 10 else recent_scores
            
            recent_avg = sum(recent_scores) / len(recent_scores)
            earlier_avg = sum(earlier_scores) / len(earlier_scores)
            
            if recent_avg > earlier_avg * 1.1:
                patterns.append(LearningPattern(
                    id=f"pattern_{datetime.utcnow().timestamp()}_improving_performance",
                    user_id=user_id,
                    pattern_type="improving_performance",
                    description="Performance has been consistently improving",
                    frequency=1.0,
                    strength=(recent_avg - earlier_avg) / earlier_avg,
                    contexts=["skill_development", "practice"],
                    first_observed=performance_metrics[-10]["timestamp"] if len(performance_metrics) >= 10 else performance_metrics[0]["timestamp"],
                    last_observed=performance_metrics[-1]["timestamp"],
                    is_positive=True
                ))
        
        return patterns
    
    async def analyze_time_patterns(self, user_id: str, metrics: List[Dict[str, Any]]) -> List[LearningPattern]:
        """Analyze time-based learning patterns"""
        
        # Group metrics by day of week
        day_patterns = {}
        for metric in metrics:
            day_of_week = metric["timestamp"].weekday()
            if day_of_week not in day_patterns:
                day_patterns[day_of_week] = []
            day_patterns[day_of_week].append(metric)
        
        patterns = []
        
        # Find most active days
        day_activity = {}
        for day, day_metrics in day_patterns.items():
            day_activity[day] = len(day_metrics)
        
        if day_activity:
            most_active_day = max(day_activity, key=day_activity.get)
            day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            
            patterns.append(LearningPattern(
                id=f"pattern_{datetime.utcnow().timestamp()}_most_active_day",
                user_id=user_id,
                pattern_type="most_active_day",
                description=f"User is most active on {day_names[most_active_day]}",
                frequency=day_activity[most_active_day] / sum(day_activity.values()),
                strength=0.6,
                contexts=["weekly_schedule", "consistency"],
                first_observed=metrics[0]["timestamp"],
                last_observed=metrics[-1]["timestamp"],
                is_positive=True
            ))
        
        return patterns
    
    async def generate_learning_insights(self, user_id: str, days: int = 30) -> List[LearningInsight]:
        """Generate AI-powered learning insights"""
        
        # Get user's learning data
        patterns = await self.analyze_learning_patterns(user_id, days)
        metrics = await self.get_user_metrics(user_id, days)
        
        # Generate insights using AI
        insights_prompt = f"""
        Generate comprehensive learning insights for this user:
        
        User ID: {user_id}
        Analysis Period: {days} days
        
        Learning Patterns:
        {json.dumps([pattern.dict() for pattern in patterns], indent=2)}
        
        Recent Metrics:
        {json.dumps(metrics[-10:], indent=2)}  # Last 10 metrics
        
        Generate insights that:
        1. Identify key trends and patterns
        2. Highlight strengths and areas for improvement
        3. Provide actionable recommendations
        4. Predict potential challenges
        5. Suggest optimization strategies
        6. Consider engagement, performance, and wellness
        
        Return as JSON array of insights with:
        - insight_type (trend, anomaly, prediction, recommendation, milestone, warning, opportunity)
        - title (concise, attention-grabbing)
        - description (detailed explanation)
        - confidence (0.0-1.0)
        - impact (low, medium, high, critical)
        - actionable (boolean)
        - recommendations (array of specific actions)
        - data_sources (array of metric types used)
        """
        
        try:
            insights_data = await self.openai_service.generate_response(insights_prompt)
            insights_json = json.loads(insights_data)
            
            insights = []
            for insight_data in insights_json:
                insight = LearningInsight(
                    id=f"insight_{datetime.utcnow().timestamp()}_{len(insights)}",
                    user_id=user_id,
                    insight_type=InsightType(insight_data.get("insight_type", "recommendation")),
                    title=insight_data.get("title", "Learning Insight"),
                    description=insight_data.get("description", ""),
                    confidence=insight_data.get("confidence", 0.5),
                    impact=insight_data.get("impact", "medium"),
                    actionable=insight_data.get("actionable", True),
                    recommendations=insight_data.get("recommendations", []),
                    data_sources=insight_data.get("data_sources", []),
                    generated_at=datetime.utcnow(),
                    expires_at=datetime.utcnow() + timedelta(days=7)
                )
                insights.append(insight)
            
            # Save insights to database
            db = await get_database()
            await db.learning_insights.insert_many([insight.dict() for insight in insights])
            
            return insights
            
        except Exception as e:
            # Fallback insights
            return [LearningInsight(
                id=f"insight_{datetime.utcnow().timestamp()}_fallback",
                user_id=user_id,
                insight_type=InsightType.RECOMMENDATION,
                title="Continue Learning",
                description="Keep up the great work with your learning journey",
                confidence=0.5,
                impact="medium",
                actionable=True,
                recommendations=["Continue with current learning path", "Set daily goals"],
                data_sources=["engagement", "performance"],
                generated_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=7)
            )]
    
    async def get_user_metrics(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get user's learning metrics"""
        
        db = await get_database()
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        metrics = await db.learning_metrics.find({
            "user_id": user_id,
            "timestamp": {"$gte": cutoff_date}
        }).sort("timestamp", -1).to_list(length=None)
        
        return metrics
    
    async def predict_learning_outcomes(self, user_id: str, time_horizon_days: int = 30) -> LearningForecast:
        """Predict learning outcomes using machine learning"""
        
        # Get historical data
        metrics = await self.get_user_metrics(user_id, 90)  # 3 months of data
        
        # Generate predictions using AI
        prediction_prompt = f"""
        Predict learning outcomes for this user:
        
        User ID: {user_id}
        Time Horizon: {time_horizon_days} days
        
        Historical Data (last 90 days):
        {json.dumps(metrics, indent=2)}
        
        Generate predictions for:
        1. Engagement level trend
        2. Performance improvement trajectory
        3. Skill acquisition rate
        4. Completion probability for current goals
        5. Potential challenges or obstacles
        
        For each prediction, provide:
        - predicted_value (expected outcome)
        - confidence_interval (min/max range)
        - probability (likelihood of occurrence)
        - factors (key influencing factors)
        
        Return as JSON with:
        - predictions (array of prediction objects)
        - confidence_intervals (array of confidence intervals)
        """
        
        try:
            prediction_data = await self.openai_service.generate_response(prediction_prompt)
            prediction_json = json.loads(prediction_data)
            
            forecast = LearningForecast(
                id=f"forecast_{datetime.utcnow().timestamp()}",
                user_id=user_id,
                forecast_type="learning_outcomes",
                time_horizon_days=time_horizon_days,
                predictions=prediction_json.get("predictions", []),
                confidence_intervals=prediction_json.get("confidence_intervals", []),
                model_id="ai_predictive_model",
                generated_at=datetime.utcnow()
            )
            
            # Save forecast to database
            db = await get_database()
            await db.learning_forecasts.insert_one(forecast.dict())
            
            return forecast
            
        except Exception as e:
            # Fallback forecast
            return LearningForecast(
                id=f"forecast_{datetime.utcnow().timestamp()}_fallback",
                user_id=user_id,
                forecast_type="learning_outcomes",
                time_horizon_days=time_horizon_days,
                predictions=[
                    {
                        "metric": "engagement",
                        "predicted_value": 0.7,
                        "trend": "stable"
                    },
                    {
                        "metric": "performance",
                        "predicted_value": 0.8,
                        "trend": "improving"
                    }
                ],
                confidence_intervals=[
                    {"metric": "engagement", "min": 0.6, "max": 0.8},
                    {"metric": "performance", "min": 0.7, "max": 0.9}
                ],
                model_id="fallback_model",
                generated_at=datetime.utcnow()
            )
    
    async def generate_learning_report(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Generate comprehensive learning report"""
        
        # Get all data
        patterns = await self.analyze_learning_patterns(user_id, days)
        insights = await self.generate_learning_insights(user_id, days)
        forecast = await self.predict_learning_outcomes(user_id, 30)
        metrics = await self.get_user_metrics(user_id, days)
        
        # Calculate summary statistics
        engagement_metrics = [m for m in metrics if m.get("metric_type") == "engagement"]
        performance_metrics = [m for m in metrics if m.get("metric_type") == "performance"]
        
        avg_engagement = sum(m["value"] for m in engagement_metrics) / len(engagement_metrics) if engagement_metrics else 0
        avg_performance = sum(m["value"] for m in performance_metrics) / len(performance_metrics) if performance_metrics else 0
        
        # Generate AI summary
        summary_prompt = f"""
        Generate a comprehensive learning summary for this user:
        
        User ID: {user_id}
        Report Period: {days} days
        
        Key Metrics:
        - Average Engagement: {avg_engagement:.2f}
        - Average Performance: {avg_performance:.2f}
        - Total Learning Sessions: {len(metrics)}
        - Patterns Identified: {len(patterns)}
        - Insights Generated: {len(insights)}
        
        Learning Patterns:
        {json.dumps([pattern.dict() for pattern in patterns], indent=2)}
        
        Key Insights:
        {json.dumps([insight.dict() for insight in insights], indent=2)}
        
        Generate a summary that includes:
        1. Overall learning performance assessment
        2. Key achievements and milestones
        3. Areas of strength and improvement
        4. Recommended next steps
        5. Long-term learning trajectory
        
        Return as JSON with:
        - overall_assessment (summary statement)
        - key_achievements (array of achievements)
        - strengths (array of strengths)
        - improvement_areas (array of areas)
        - recommendations (array of recommendations)
        - trajectory (learning trajectory description)
        """
        
        try:
            summary_data = await self.openai_service.generate_response(summary_prompt)
            summary_json = json.loads(summary_data)
            
            return {
                "report_period_days": days,
                "generated_at": datetime.utcnow(),
                "summary_statistics": {
                    "average_engagement": avg_engagement,
                    "average_performance": avg_performance,
                    "total_sessions": len(metrics),
                    "patterns_identified": len(patterns),
                    "insights_generated": len(insights)
                },
                "patterns": [pattern.dict() for pattern in patterns],
                "insights": [insight.dict() for insight in insights],
                "forecast": forecast.dict(),
                "ai_summary": summary_json
            }
            
        except Exception as e:
            return {
                "report_period_days": days,
                "generated_at": datetime.utcnow(),
                "summary_statistics": {
                    "average_engagement": avg_engagement,
                    "average_performance": avg_performance,
                    "total_sessions": len(metrics),
                    "patterns_identified": len(patterns),
                    "insights_generated": len(insights)
                },
                "patterns": [pattern.dict() for pattern in patterns],
                "insights": [insight.dict() for insight in insights],
                "forecast": forecast.dict(),
                "ai_summary": {
                    "overall_assessment": "Learning progress is steady",
                    "key_achievements": [],
                    "strengths": [],
                    "improvement_areas": [],
                    "recommendations": ["Continue current learning path"],
                    "trajectory": "Positive"
                }
            }
    
    async def get_comparative_analytics(self, user_id: str, peer_group: str = "all") -> Dict[str, Any]:
        """Get comparative analytics against peer groups"""
        
        db = await get_database()
        
        # Get user's metrics
        user_metrics = await self.get_user_metrics(user_id, 30)
        
        # Get peer group metrics
        peer_query = {}
        if peer_group != "all":
            peer_query["user_profile.skill_level"] = peer_group
        
        peer_metrics = await db.learning_metrics.find({
            "timestamp": {"$gte": datetime.utcnow() - timedelta(days=30)},
            **peer_query
        }).to_list(length=None)
        
        # Calculate percentiles
        user_engagement = [m["value"] for m in user_metrics if m.get("metric_type") == "engagement"]
        user_performance = [m["value"] for m in user_metrics if m.get("metric_type") == "performance"]
        
        peer_engagement = [m["value"] for m in peer_metrics if m.get("metric_type") == "engagement"]
        peer_performance = [m["value"] for m in peer_metrics if m.get("metric_type") == "performance"]
        
        def calculate_percentile(value, distribution):
            if not distribution:
                return 50
            return sum(1 for x in distribution if x <= value) / len(distribution) * 100
        
        avg_user_engagement = sum(user_engagement) / len(user_engagement) if user_engagement else 0
        avg_user_performance = sum(user_performance) / len(user_performance) if user_performance else 0
        
        engagement_percentile = calculate_percentile(avg_user_engagement, peer_engagement)
        performance_percentile = calculate_percentile(avg_user_performance, peer_performance)
        
        return {
            "user_id": user_id,
            "peer_group": peer_group,
            "comparison_period_days": 30,
            "user_averages": {
                "engagement": avg_user_engagement,
                "performance": avg_user_performance
            },
            "peer_averages": {
                "engagement": sum(peer_engagement) / len(peer_engagement) if peer_engagement else 0,
                "performance": sum(peer_performance) / len(peer_performance) if peer_performance else 0
            },
            "percentiles": {
                "engagement": engagement_percentile,
                "performance": performance_percentile
            },
            "rankings": {
                "engagement_rank": f"Top {100 - engagement_percentile:.0f}%",
                "performance_rank": f"Top {100 - performance_percentile:.0f}%"
            }
        }

# Initialize advanced analytics engine
analytics_engine = AdvancedAnalyticsEngine()

@router.post("/metrics")
async def collect_metric(user_id: str, metric_type: MetricType, value: float, unit: str, context: Dict[str, Any] = None):
    """Collect learning metric"""
    try:
        metric = await analytics_engine.collect_learning_metrics(user_id, metric_type, value, unit, context)
        return metric
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metric collection error: {str(e)}")

@router.get("/patterns/{user_id}")
async def get_learning_patterns(user_id: str, days: int = 30):
    """Get user's learning patterns"""
    try:
        patterns = await analytics_engine.analyze_learning_patterns(user_id, days)
        return {"patterns": patterns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pattern analysis error: {str(e)}")

@router.get("/insights/{user_id}")
async def get_learning_insights(user_id: str, days: int = 30):
    """Get user's learning insights"""
    try:
        insights = await analytics_engine.generate_learning_insights(user_id, days)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insight generation error: {str(e)}")

@router.get("/forecast/{user_id}")
async def get_learning_forecast(user_id: str, time_horizon_days: int = 30):
    """Get learning outcome predictions"""
    try:
        forecast = await analytics_engine.predict_learning_outcomes(user_id, time_horizon_days)
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

@router.get("/report/{user_id}")
async def get_learning_report(user_id: str, days: int = 30):
    """Get comprehensive learning report"""
    try:
        report = await analytics_engine.generate_learning_report(user_id, days)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")

@router.get("/comparative/{user_id}")
async def get_comparative_analytics(user_id: str, peer_group: str = "all"):
    """Get comparative analytics against peer groups"""
    try:
        analytics = await analytics_engine.get_comparative_analytics(user_id, peer_group)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparative analytics error: {str(e)}")

@router.get("/metrics/{user_id}")
async def get_user_metrics(user_id: str, days: int = 30):
    """Get user's learning metrics"""
    try:
        metrics = await analytics_engine.get_user_metrics(user_id, days)
        return {"metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metrics retrieval error: {str(e)}")

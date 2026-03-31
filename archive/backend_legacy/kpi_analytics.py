"""
Key Performance Indicators (KPIs) - Analytics and Metrics Backend
Provides comprehensive KPI tracking, analytics, and performance monitoring
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

router = APIRouter(prefix="/api/v1/kpi", tags=["KPI Analytics"])

class KPICategory(str, Enum):
    USER_ENGAGEMENT = "user_engagement"
    LEARNING_OUTCOMES = "learning_outcomes"
    WELLNESS = "wellness"
    COLLABORATION = "collaboration"
    PERFORMANCE = "performance"
    BUSINESS = "business"

class MetricType(str, Enum):
    COUNTER = "counter"
    PERCENTAGE = "percentage"
    DURATION = "duration"
    SCORE = "score"
    RATE = "rate"
    RATIO = "ratio"
    AVERAGE = "average"
    SUM = "sum"

class KPIDefinition(BaseModel):
    id: str
    name: str
    description: str
    category: KPICategory
    metric_type: MetricType
    unit: str
    target_value: float
    current_value: float
    is_positive_trend: bool
    calculation_method: str
    data_sources: List[str]
    reporting_frequency: str  # "daily", "weekly", "monthly"
    created_at: datetime
    last_updated: datetime

class KPIData(BaseModel):
    id: str
    kpi_id: str
    value: float
    timestamp: datetime
    period_start: datetime
    period_end: datetime
    segment: Optional[str]  # For segmented KPIs
    metadata: Dict[str, Any]

class KPIAlert(BaseModel):
    id: str
    kpi_id: str
    alert_type: str  # "threshold", "trend", "anomaly"
    severity: str  # "low", "medium", "high", "critical"
    message: str
    threshold_value: float
    current_value: float
    triggered_at: datetime
    acknowledged: bool = False
    resolved_at: Optional[datetime]

class KPIReport(BaseModel):
    id: str
    report_type: str  # "daily", "weekly", "monthly", "quarterly"
    period_start: datetime
    period_end: datetime
    kpis: Dict[str, Dict[str, Any]]
    insights: List[str]
    recommendations: List[str]
    trends: Dict[str, str]
    created_at: datetime

class KPIEngine:
    def __init__(self):
        self.openai_service = OpenAIService()
        self.user_service = UserService()
        self.kpi_definitions: Dict[str, KPIDefinition] = {}
        
        # Initialize KPI definitions
        self.initialize_kpi_definitions()
    
    def initialize_kpi_definitions(self):
        """Initialize all KPI definitions"""
        
        # User Engagement KPIs
        self.kpi_definitions["daily_active_users"] = KPIDefinition(
            id="daily_active_users",
            name="Daily Active Users",
            description="Number of unique users active per day",
            category=KPICategory.USER_ENGAGEMENT,
            metric_type=MetricType.COUNTER,
            unit="users",
            target_value=1000,
            current_value=0,
            is_positive_trend=True,
            calculation_method="count_unique_users",
            data_sources=["user_sessions", "user_activity"],
            reporting_frequency="daily",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
        
        self.kpi_definitions["session_duration"] = KPIDefinition(
            id="session_duration",
            name="Average Session Duration",
            description="Average time users spend per session",
            category=KPICategory.USER_ENGAGEMENT,
            metric_type=MetricType.DURATION,
            unit="minutes",
            target_value=45,
            current_value=0,
            is_positive_trend=True,
            calculation_method="average_session_time",
            data_sources=["user_sessions"],
            reporting_frequency="daily",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
        
        self.kpi_definitions["retention_rate"] = KPIDefinition(
            id="retention_rate",
            name="User Retention Rate",
            description="Percentage of users who return after initial visit",
            category=KPICategory.USER_ENGAGEMENT,
            metric_type=MetricType.PERCENTAGE,
            unit="%",
            target_value=0.7,
            current_value=0,
            is_positive_trend=True,
            calculation_method="retention_calculation",
            data_sources=["user_activity", "user_sessions"],
            reporting_frequency="weekly",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
        
        # Learning Outcomes KPIs
        self.kpi_definitions["skill_progression"] = KPIDefinition(
            id="skill_progression",
            name="Skill Progression Rate",
            description="Average rate of skill improvement",
            category=KPICategory.LEARNING_OUTCOMES,
            metric_type=MetricType.PERCENTAGE,
            unit="%",
            target_value=0.8,
            current_value=0,
            is_positive_trend=True,
            calculation_method="skill_assessment_analysis",
            data_sources=["user_progress", "skill_assessments"],
            reporting_frequency="weekly",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
        
        self.kpi_definitions["completion_rate"] = KPIDefinition(
            id="completion_rate",
            name="Course Completion Rate",
            description="Percentage of courses completed by users",
            category=KPICategory.LEARNING_OUTCOMES,
            metric_type=MetricType.PERCENTAGE,
            unit="%",
            target_value=0.85,
            current_value=0,
            is_positive_trend=True,
            calculation_method="completion_tracking",
            data_sources=["course_progress", "user_progress"],
            reporting_frequency="monthly",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
        
        # Wellness KPIs
        self.kpi_definitions["burnout_rate"] = KPIDefinition(
            id="burnout_rate",
            name="Burnout Rate",
            description="Percentage of users showing burnout indicators",
            category=KPICategory.WELLNESS,
            metric_type=MetricType.PERCENTAGE,
            unit="%",
            target_value=0.15,
            current_value=0,
            is_positive_trend=False,
            calculation_method="wellness_analysis",
            data_sources=["wellness_metrics", "user_surveys"],
            reporting_frequency="weekly",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
        
        self.kpi_definitions["satisfaction_score"] = KPIDefinition(
            id="satisfaction_score",
            name="User Satisfaction Score",
            description="Average user satisfaction rating",
            category=KPICategory.WELLNESS,
            metric_type=MetricType.SCORE,
            unit="points",
            target_value=4.5,
            current_value=0,
            is_positive_trend=True,
            calculation_method="satisfaction_survey_analysis",
            data_sources=["user_surveys", "feedback_data"],
            reporting_frequency="monthly",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
        
        # Collaboration KPIs
        self.kpi_definitions["peer_interactions"] = KPIDefinition(
            id="peer_interactions",
            name="Peer Interactions",
            description="Number of peer learning interactions per day",
            category=KPICategory.COLLABORATION,
            metric_type=MetricType.COUNTER,
            unit="interactions",
            target_value=500,
            current_value=0,
            is_positive_trend=True,
            calculation_method="interaction_counting",
            data_sources=["collaboration_sessions", "peer_requests"],
            reporting_frequency="daily",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
        
        self.kpi_definitions["group_activities"] = KPIDefinition(
            id="group_activities",
            name="Group Activity Participation",
            description="Percentage of users participating in group activities",
            category=KPICategory.COLLABORATION,
            metric_type=MetricType.PERCENTAGE,
            unit="%",
            target_value=0.6,
            current_value=0,
            is_positive_trend=True,
            calculation_method="group_participation_analysis",
            data_sources=["team_sessions", "group_activities"],
            reporting_frequency="weekly",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
        
        # Performance KPIs
        self.kpi_definitions["response_time"] = KPIDefinition(
            id="response_time",
            name="Average Response Time",
            description="Average system response time",
            category=KPICategory.PERFORMANCE,
            metric_type=MetricType.DURATION,
            unit="milliseconds",
            target_value=200,
            current_value=0,
            is_positive_trend=False,
            calculation_method="response_time_analysis",
            data_sources=["api_logs", "performance_metrics"],
            reporting_frequency="daily",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
        
        self.kpi_definitions["system_uptime"] = KPIDefinition(
            id="system_uptime",
            name="System Uptime",
            description="Percentage of time system is available",
            category=KPICategory.PERFORMANCE,
            metric_type=MetricType.PERCENTAGE,
            unit="%",
            target_value=0.999,
            current_value=0,
            is_positive_trend=True,
            calculation_method="uptime_monitoring",
            data_sources=["system_logs", "availability_monitoring"],
            reporting_frequency="daily",
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )
    
    async def calculate_kpi(self, kpi_id: str, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Calculate KPI value for a specific period"""
        
        kpi_def = self.kpi_definitions.get(kpi_id)
        if not kpi_def:
            raise HTTPException(status_code=404, detail="KPI not found")
        
        if kpi_def.calculation_method == "count_unique_users":
            return await self.count_unique_users(period_start, period_end, segment)
        elif kpi_def.calculation_method == "average_session_time":
            return await self.calculate_average_session_time(period_start, period_end, segment)
        elif kpi_def.calculation_method == "retention_calculation":
            return await self.calculate_retention_rate(period_start, period_end, segment)
        elif kpi_def.calculation_method == "skill_assessment_analysis":
            return await self.calculate_skill_progression(period_start, period_end, segment)
        elif kpi_def.calculation_method == "completion_tracking":
            return await self.calculate_completion_rate(period_start, period_end, segment)
        elif kpi_def.calculation_method == "wellness_analysis":
            return await self.calculate_burnout_rate(period_start, period_end, segment)
        elif kpi_def.calculation_method == "satisfaction_survey_analysis":
            return await self.calculate_satisfaction_score(period_start, period_end, segment)
        elif kpi_def.calculation_method == "interaction_counting":
            return await self.count_peer_interactions(period_start, period_end, segment)
        elif kpi_def.calculation_method == "group_participation_analysis":
            return await self.calculate_group_activities(period_start, period_end, segment)
        elif kpi_def.calculation_method == "response_time_analysis":
            return await self.calculate_response_time(period_start, period_end, segment)
        elif kpi_def.calculation_method == "uptime_monitoring":
            return await self.calculate_system_uptime(period_start, period_end, segment)
        else:
            return 0.0
    
    async def count_unique_users(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Count unique users in a period"""
        
        db = await get_database()
        
        query = {
            "timestamp": {"$gte": period_start, "$lte": period_end}
        }
        
        if segment:
            query["segment"] = segment
        
        # Count unique users from user sessions
        pipeline = [
            {"$match": query},
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
            {"$count": "unique_users"}
        ]
        
        result = await db.user_sessions.aggregate(pipeline).to_list(length=1)
        return float(result[0]["unique_users"]) if result else 0.0
    
    async def calculate_average_session_time(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Calculate average session duration"""
        
        db = await get_database()
        
        query = {
            "timestamp": {"$gte": period_start, "$lte": period_end},
            "duration_minutes": {"$gt": 0}
        }
        
        if segment:
            query["segment"] = segment
        
        pipeline = [
            {"$match": query},
            {"$group": {"_id": None, "avg_duration": {"$avg": "$duration_minutes"}}}
        ]
        
        result = await db.user_sessions.aggregate(pipeline).to_list(length=1)
        return float(result[0]["avg_duration"]) if result else 0.0
    
    async def calculate_retention_rate(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Calculate user retention rate"""
        
        db = await get_database()
        
        # Get users who were active at the beginning of the period
        lookback_start = period_start - timedelta(days=30)
        lookback_end = period_start
        
        new_users = await db.user_sessions.find({
            "timestamp": {"$gte": lookback_start, "$lte": lookback_end}
        }).distinct("user_id")
        
        if not new_users:
            return 0.0
        
        # Check how many returned
        returning_users = await db.user_sessions.find({
            "user_id": {"$in": new_users},
            "timestamp": {"$gte": period_start, "$lte": period_end}
        }).distinct("user_id")
        
        retention_rate = len(returning_users) / len(new_users)
        return retention_rate * 100
    
    async def calculate_skill_progression(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Calculate skill progression rate"""
        
        db = await get_database()
        
        query = {
            "timestamp": {"$gte": period_start, "$lte": period_end}
        }
        
        if segment:
            query["segment"] = segment
        
        # Get skill assessments
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$user_id",
                "initial_skill": {"$first": "$skill_level"},
                "final_skill": {"$last": "$skill_level"},
                "improvement": {"$subtract": ["$final_skill", "$initial_skill"]}
            }},
            {"$group": {
                "_id": None,
                "avg_improvement": {"$avg": "$improvement"}}
            }
        ]
        
        result = await db.skill_assessments.aggregate(pipeline).to_list(length=1)
        return float(result[0]["avg_improvement"]) * 100 if result else 0.0
    
    async def calculate_completion_rate(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Calculate course completion rate"""
        
        db = await get_database()
        
        query = {
            "timestamp": {"$gte": period_start, "$lte": period_end}
        }
        
        if segment:
            query["segment"] = segment
        
        # Get course progress
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$user_id",
                "courses_started": {"$sum": {"$cond": [{"$eq": ["$status", "started"]}, 1, 0]}},
                "courses_completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
                "completion_rate": {"$divide": ["$courses_completed", "$courses_started"]}
            }},
            {"$group": {
                "_id": None,
                "avg_completion_rate": {"$avg": "$completion_rate"}
            }}
        ]
        
        result = await db.course_progress.aggregate(pipeline).to_list(length=1)
        return float(result[0]["avg_completion_rate"]) * 100 if result else 0.0
    
    async def calculate_burnout_rate(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Calculate burnout rate"""
        
        db = await get_database()
        
        query = {
            "timestamp": {"$gte": period_start, "$lte": period_end},
            "burnout_risk": {"$gte": 0.8}  # High burnout risk threshold
        }
        
        if segment:
            query["segment"] = segment
        
        # Get wellness metrics
        total_users = await db.wellness_metrics.count_documents({
            "timestamp": {"$gte": period_start, "$lte": period_end}
        })
        
        burned_out_users = await db.wellness_metrics.count_documents(query)
        
        if total_users == 0:
            return 0.0
        
        return (burned_out_users / total_users) * 100
    
    async def calculate_satisfaction_score(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Calculate user satisfaction score"""
        
        db = await get_database()
        
        query = {
            "timestamp": {"$gte": period_start, "$lte": period_end}
        }
        
        if segment:
            query["segment"] = segment
        
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": None,
                "avg_satisfaction": {"$avg": "$rating"}
            }}
        ]
        
        result = await db.user_surveys.aggregate(pipeline).to_list(length=1)
        return float(result[0]["avg_satisfaction"]) if result else 0.0
    
    async def count_peer_interactions(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Count peer learning interactions"""
        
        db = await get_database()
        
        query = {
            "timestamp": {"$gte": period_start, "$lte": period_end}
        }
        
        if segment:
            query["segment"] = segment
        
        # Count from collaboration sessions and peer requests
        collaboration_count = await db.collaboration_sessions.count_documents(query)
        request_count = await db.collaboration_requests.count_documents(query)
        
        return float(collaboration_count + request_count)
    
    async def calculate_group_activities(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Calculate group activity participation rate"""
        
        db = await get_database()
        
        # Get total active users
        total_active = await self.count_unique_users(period_start, period_end, segment)
        
        if total_active == 0:
            return 0.0
        
        # Get users participating in group activities
        query = {
            "timestamp": {"$gte": period_start, "$lte": period_end},
            "participants": {"$exists": True}
        }
        
        if segment:
            query["segment"] = segment
        
        group_participants = await db.team_sessions.distinct("participants", query)
        
        return (len(group_participants) / total_active) * 100
    
    async def calculate_response_time(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Calculate average response time"""
        
        db = await get_database()
        
        query = {
            "timestamp": {"$gte": period_start, "$lte": period_end},
            "response_time": {"$gt": 0}
        }
        
        if segment:
            query["segment"] = segment
        
        pipeline = [
            {"$match": query},
            {"$group": {"_id": None, "avg_response_time": {"$avg": "$response_time"}}}
        ]
        
        result = await db.api_logs.aggregate(pipeline).to_list(length=1)
        return float(result[0]["avg_response_time"]) if result else 0.0
    
    async def calculate_system_uptime(self, period_start: datetime, period_end: datetime, segment: Optional[str] = None) -> float:
        """Calculate system uptime"""
        
        db = await get_database()
        
        # Get total time and downtime
        total_time = (period_end - period_start).total_seconds()
        
        downtime_query = {
            "timestamp": {"$gte": period_start, "$lte": period_end},
            "status": "down"
        }
        
        if segment:
            downtime_query["segment"] = segment
        
        downtime_events = await db.system_logs.find(downtime_query).to_list(length=None)
        
        total_downtime = sum(event.get("duration", 0) for event in downtime_events)
        
        uptime_time = total_time - total_downtime
        uptime_percentage = (uptime_time / total_time) * 100 if total_time > 0 else 100.0
        
        return uptime_percentage
    
    async def store_kpi_data(self, kpi_id: str, value: float, period_start: datetime, period_end: datetime, segment: Optional[str] = None):
        """Store KPI data point"""
        
        kpi_data = KPIData(
            id=f"kpi_data_{datetime.utcnow().timestamp()}",
            kpi_id=kpi_id,
            value=value,
            timestamp=datetime.utcnow(),
            period_start=period_start,
            period_end=period_end,
            segment=segment,
            metadata={}
        )
        
        # Save to database
        db = await get_database()
        await db.kpi_data.insert_one(kpi_data.dict())
        
        # Update KPI definition current value
        await db.kpi_definitions.update_one(
            {"id": kpi_id},
            {"$set": {"current_value": value, "last_updated": datetime.utcnow()}}
        )
        
        # Check for alerts
        await self.check_kpi_alerts(kpi_id, value)
    
    async def check_kpi_alerts(self, kpi_id: str, current_value: float):
        """Check if KPI triggers any alerts"""
        
        kpi_def = self.kpi_definitions.get(kpi_id)
        if not kpi_def:
            return
        
        alerts = []
        
        # Threshold alert
        if kpi_def.is_positive_trend:
            if current_value < kpi_def.target_value * 0.8:  # Below 80% of target
                alerts.append(KPIAlert(
                    id=f"alert_{datetime.utcnow().timestamp()}_{len(alerts)}",
                    kpi_id=kpi_id,
                    alert_type="threshold",
                    severity="medium",
                    message=f"{kpi_def.name} is below target threshold",
                    threshold_value=kpi_def.target_value * 0.8,
                    current_value=current_value,
                    triggered_at=datetime.utcnow()
                ))
        else:
            if current_value > kpi_def.target_value * 1.2:  # Above 120% of target
                alerts.append(KPIAlert(
                    id=f"alert_{datetime.utcnow().timestamp()}_{len(alerts)}",
                    kpi_id=kpi_id,
                    alert_type="threshold",
                    severity="low",
                    message=f"{kpi_def.name} exceeds target threshold",
                    threshold_value=kpi_def.target_value * 1.2,
                    current_value=current_value,
                    triggered_at=datetime.utcnow()
                ))
        
        # Store alerts
        if alerts:
            db = await get_database()
            await db.kpi_alerts.insert_many([alert.dict() for alert in alerts])
    
    async def get_kpi_dashboard(self, period: str = "daily") -> Dict[str, Any]:
        """Get comprehensive KPI dashboard"""
        
        # Determine period
        now = datetime.utcnow()
        if period == "daily":
            period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=1)
        elif period == "weekly":
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=7)
        elif period == "monthly":
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=30)
        else:
            period_start = now - timedelta(days=1)
            period_end = now
        
        # Calculate all KPIs
        kpi_values = {}
        for kpi_id, kpi_def in self.kpi_definitions.items():
            try:
                value = await self.calculate_kpi(kpi_id, period_start, period_end)
                kpi_values[kpi_id] = {
                    "value": value,
                    "target": kpi_def.target_value,
                    "unit": kpi_def.unit,
                    "trend": "up" if value > kpi_def.current_value else "down",
                    "percentage_of_target": (value / kpi_def.target_value) * 100 if kpi_def.target_value > 0 else 0
                }
            except Exception as e:
                kpi_values[kpi_id] = {
                    "value": 0,
                    "target": kpi_def.target_value,
                    "unit": kpi_def.unit,
                    "trend": "stable",
                    "percentage_of_target": 0,
                    "error": str(e)
                }
        
        # Group by category
        dashboard = {
            "period": period,
            "period_start": period_start,
            "period_end": period_end,
            "categories": {}
        }
        
        for category in KPICategory:
            category_kpis = {}
            for kpi_id, kpi_def in self.kpi_definitions.items():
                if kpi_def.category == category:
                    category_kpis[kpi_id] = kpi_values[kpi_id]
            
            dashboard["categories"][category.value] = {
                "kpis": category_kpis,
                "overall_performance": self.calculate_category_performance(category_kpis)
            }
        
        return dashboard
    
    def calculate_category_performance(self, kpis: Dict[str, Dict[str, Any]]) -> str:
        """Calculate overall performance for a category"""
        
        if not kpis:
            return "no_data"
        
        performance_scores = []
        
        for kpi_data in kpis.values():
            if kpi_data["percentage_of_target"] >= 100:
                performance_scores.append(1.0)
            elif kpi_data["percentage_of_target"] >= 80:
                performance_scores.append(0.8)
            elif kpi_data["percentage_of_target"] >= 60:
                performance_scores.append(0.6)
            elif kpi_data["percentage_of_target"] >= 40:
                performance_scores.append(0.4)
            else:
                performance_scores.append(0.2)
        
        avg_performance = sum(performance_scores) / len(performance_scores) if performance_scores else 0
        
        if avg_performance >= 0.8:
            return "excellent"
        elif avg_performance >= 0.6:
            return "good"
        elif avg_performance >= 0.4:
            return "fair"
        else:
            return "poor"
    
    async def generate_kpi_report(self, period: str = "monthly") -> KPIReport:
        """Generate comprehensive KPI report"""
        
        # Get dashboard data
        dashboard = await self.get_kpi_dashboard(period)
        
        # Generate insights and recommendations using AI
        insights_prompt = f"""
        Generate KPI insights and recommendations based on this dashboard data:
        
        Period: {period}
        Dashboard Data: {json.dumps(dashboard, indent=2)}
        
        Provide:
        1. Key insights from each category
        2. Areas of concern
        3. Recommendations for improvement
        4. Positive highlights to celebrate
        5. Actionable next steps
        
        Return as JSON with:
        - insights (array of insight strings)
        - recommendations (array of recommendation strings)
        - trends (category -> trend description)
        """
        
        try:
            ai_response = await self.openai_service.generate_response(insights_prompt)
            ai_data = json.loads(ai_response)
            
            report = KPIReport(
                id=f"report_{datetime.utcnow().timestamp()}",
                report_type=period,
                period_start=dashboard["period_start"],
                period_end=dashboard["period_end"],
                kpis=dashboard["categories"],
                insights=ai_data.get("insights", []),
                recommendations=ai_data.get("recommendations", []),
                trends=ai_data.get("trends", {}),
                created_at=datetime.utcnow()
            )
            
        except Exception as e:
            # Fallback report
            report = KPIReport(
                id=f"report_{datetime.utcnow().timestamp()}",
                report_type=period,
                period_start=dashboard["period_start"],
                period_end=dashboard["period_end"],
                kpis=dashboard["categories"],
                insights=["KPI data available for analysis"],
                recommendations=["Continue monitoring key metrics"],
                trends={},
                created_at=datetime.utcnow()
            )
        
        # Save report
        db = await get_database()
        await db.kpi_reports.insert_one(report.dict())
        
        return report
    
    async def get_kpi_trends(self, kpi_id: str, days: int = 30) -> Dict[str, Any]:
        """Get KPI trends over time"""
        
        db = await get_database()
        
        # Get historical data
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        pipeline = [
            {"$match": {
                "kpi_id": kpi_id,
                "timestamp": {"$gte": cutoff_date}
            }},
            {"$sort": {"timestamp": 1}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "avg_value": {"$avg": "$value"},
                "count": {"$sum": 1}
            }}
        ]
        
        results = await db.kpi_data.aggregate(pipeline).sort("_id", 1).to_list(length=None)
        
        # Calculate trend
        if len(results) >= 2:
            first_value = results[0]["avg_value"]
            last_value = results[-1]["avg_value"]
            
            if last_value > first_value * 1.05:
                trend = "increasing"
            elif last_value < first_value * 0.95:
                trend = "decreasing"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "kpi_id": kpi_id,
            "period_days": days,
            "trend": trend,
            "data_points": results,
            "first_value": results[0]["avg_value"] if results else 0,
            "last_value": results[-1]["avg_value"] if results else 0,
            "change_percentage": ((results[-1]["avg_value"] - results[0]["avg_value"]) / results[0]["avg_value"] * 100) if results and results[0]["avg_value"] != 0 else 0
        }

# Initialize KPI engine
kpi_engine = KPIEngine()

@router.get("/dashboard")
async def get_kpi_dashboard(period: str = "daily"):
    """Get comprehensive KPI dashboard"""
    try:
        dashboard = await kpi_engine.get_kpi_dashboard(period)
        return dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")

@router.get("/kpi/{kpi_id}")
async def get_kpi(kpi_id: str, period: str = "daily", segment: Optional[str] = None):
    """Get specific KPI value"""
    try:
        now = datetime.utcnow()
        if period == "daily":
            period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=1)
        elif period == "weekly":
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=7)
        elif period == "monthly":
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=30)
        else:
            period_start = now - timedelta(days=1)
            period_end = now
        
        value = await kpi_engine.calculate_kpi(kpi_id, period_start, period_end, segment)
        
        return {
            "kpi_id": kpi_id,
            "value": value,
            "period_start": period_start,
            "period_end": period_end,
            "segment": segment
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KPI calculation error: {str(e)}")

@router.get("/trends/{kpi_id}")
async def get_kpi_trends(kpi_id: str, days: int = 30):
    """Get KPI trends over time"""
    try:
        trends = await kpi_engine.get_kpi_trends(kpi_id, days)
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trends error: {str(e)}")

@router.post("/report")
async def generate_kpi_report(period: str = "monthly"):
    """Generate comprehensive KPI report"""
    try:
        report = await kpi_engine.generate_kpi_report(period)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")

@router.get("/alerts")
async def get_kpi_alerts(severity: Optional[str] = None, acknowledged: Optional[bool] = None):
    """Get KPI alerts"""
    try:
        db = await get_database()
        
        query = {}
        if severity:
            query["severity"] = severity
        if acknowledged is not None:
            query["acknowledged"] = acknowledged
        
        alerts = await db.kpi_alerts.find(query).sort("triggered_at", -1).limit(50).to_list(length=None)
        
        return {"alerts": alerts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alerts error: {str(e)}")

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Acknowledge a KPI alert"""
    try:
        db = await get_database()
        
        await db.kpi_alerts.update_one(
            {"id": alert_id},
            {"$set": {"acknowledged": True, "acknowledged_at": datetime.utcnow()}}
        )
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alert acknowledgment error: {str(e)}")

@router.get("/definitions")
async def get_kpi_definitions():
    """Get all KPI definitions"""
    try:
        definitions = list(kpi_engine.kpi_definitions.values())
        return {"definitions": definitions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Definitions error: {str(e)}")

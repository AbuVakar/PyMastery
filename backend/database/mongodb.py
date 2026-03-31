"""
MongoDB Database Configuration and Connection Setup
Handles database connection, collections, and initial data seeding
"""

import os
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

# Database Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "pymastery")

class DatabaseConnection:
    """Singleton class for managing database connections"""
    
    _instance = None
    _client = None
    _database = None
    _is_connected = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._is_connected:
            # Don't auto-connect in __init__ to avoid event loop issues
            pass
    
    async def connect(self):
        """Establish MongoDB connection"""
        try:
            # Create MongoDB client with optimized configuration
            self._client = AsyncIOMotorClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=3000,  # Reduced from 5000ms
                connectTimeoutMS=3000,  # Reduced from 5000ms
                socketTimeoutMS=3000,  # Reduced from 5000ms
                maxPoolSize=20,  # Reduced from 50 for better resource usage
                minPoolSize=3,   # Reduced from 5
                retryWrites=True,
                w="majority",
                retryReads=True,  # Added for read consistency
                readPreference="secondaryPreferred"  # Better read performance
            )
            
            # Test connection
            await self._client.admin.command('ping')
            
            # Get database reference
            self._database = self._client[DATABASE_NAME]
            self._is_connected = True
            
            logger.info(f"Connected to MongoDB: {MONGODB_URL}")
            return True
            
        except ConnectionFailure as e:
            logger.error(f"MongoDB connection failed: {e}")
            return False
        except ServerSelectionTimeoutError as e:
            logger.error(f"MongoDB server selection timeout: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            return False
    
    async def disconnect(self):
        """Close MongoDB connection"""
        if self._client:
            self._client.close()
            self._is_connected = False
            logger.info("MongoDB connection closed")
    
    async def create_indexes(self):
        """Create database indexes for optimal performance"""
        try:
            if not self._database:
                raise Exception("Database not connected")
            
            # Users collection indexes
            await self._database.users.create_index("email", unique=True)
            await self._database.users.create_index("created_at")
            await self._database.users.create_index("role_track")
            await self._database.users.create_index("login_streak")
            
            # Courses collection indexes
            await self._database.courses.create_index("title")
            await self._database.courses.create_index("status")
            await self._database.courses.create_index("created_at")
            await self._database.courses.create_index("difficulty")
            
            # Enrollments collection indexes
            await self._database.enrollments.create_index([("user_id", "course_id")], unique=True)
            await self._database.enrollments.create_index("user_id")
            await self._database.enrollments.create_index("course_id")
            await self._database.enrollments.create_index("status")
            await self._database.enrollments.create_index("created_at")
            
            # Problems collection indexes
            await self._database.problems.create_index("title")
            await self._database.problems.create_index("difficulty")
            await self._database.problems.create_index("tags")
            await self._database.problems.create_index("created_at")
            
            # Submissions collection indexes
            await self._database.submissions.create_index("user_id")
            await self._database.submissions.create_index("problem_id")
            await self._database.submissions.create_index("created_at")
            await self._database.submissions.create_index("overall_status")
            
            # User activities collection indexes
            await self._database.user_activities.create_index("user_id")
            await self._database.user_activities.create_index("timestamp")
            await self._database.user_activities.create_index("action")
            
            # Code submissions collection indexes
            await self._database.code_submissions.create_index("user_id")
            await self._database.code_submissions.create_index("created_at")
            await self._database.code_submissions.create_index("language")
            await self._database.code_submissions.create_index("status")
            
            # Test runs collection indexes
            await self._database.test_runs.create_index("user_id")
            await self._database.test_runs.create_index("created_at")
            await self._database.test_runs.create_index("overall_status")
            
            # Code execution logs collection indexes
            await self._database.code_execution_logs.create_index("user_id")
            await self._database.code_execution_logs.create_index("timestamp")
            await self._database.code_execution_logs.create_index("language")
            
            # KPI data collection indexes
            await self._database.kpi_data.create_index("kpi_id")
            await self._database.kpi_data.create_index("timestamp")
            await self._database.kpi_data.create_index("period_start")
            await self._database.kpi_data.create_index("period_end")
            
            # KPI alerts collection indexes
            await self._database.kpi_alerts.create_index("kpi_id")
            await self._database.kpi_alerts.create_index("triggered_at")
            await self._database.kpi_alerts.create_index("acknowledged")
            
            # User sessions collection indexes
            await self._database.user_sessions.create_index("user_id")
            await self._database.user_sessions.create_index("timestamp")
            await self._database.user_sessions.create_index("duration_minutes")
            
            # Wellness metrics collection indexes
            await self._database.wellness_metrics.create_index("user_id")
            await self._database.wellness_metrics.create_index("timestamp")
            await self._database.wellness_metrics.create_index("burnout_risk")
            
            # Skill assessments collection indexes
            await self._database.skill_assessments.create_index("user_id")
            await self._database.skill_assessments.create_index("timestamp")
            await self._database.skill_assessments.create_index("skill_level")
            
            # Course progress collection indexes
            await self._database.course_progress.create_index("user_id")
            await self._database.course_progress.create_index("course_id")
            await self._database.course_progress.create_index("status")
            await self._database.course_progress.create_index("timestamp")
            
            # User surveys collection indexes
            await self._database.user_surveys.create_index("user_id")
            await self._database.user_surveys.create_index("timestamp")
            await self._database.user_surveys.create_index("rating")
            
            # Collaboration sessions collection indexes
            await self._database.collaboration_sessions.create_index("user_id")
            await self._database.collaboration_sessions.create_index("timestamp")
            await self._database.collaboration_sessions.create_index("participants")
            
            # Team sessions collection indexes
            await self._database.team_sessions.create_index("participants")
            await self._database.team_sessions.create_index("timestamp")
            
            # System logs collection indexes
            await self._database.system_logs.create_index("timestamp")
            await self._database.system_logs.create_index("status")
            await self._database.system_logs.create_index("duration")
            
            # Auth-related collection indexes
            await self._database.email_verifications.create_index("email")
            await self._database.email_verifications.create_index("token_hash")
            await self._database.email_verifications.create_index("expires_at")
            await self._database.email_verifications.create_index("user_id")
            
            await self._database.password_resets.create_index("email")
            await self._database.password_resets.create_index("token_hash")
            await self._database.password_resets.create_index("expires_at")
            await self._database.password_resets.create_index("user_id")
            
            await self._database.refresh_tokens.create_index("user_id")
            await self._database.refresh_tokens.create_index("token_hash")
            await self._database.refresh_tokens.create_index("expires_at")
            
            await self._database.user_sessions.create_index("user_id")
            await self._database.user_sessions.create_index("session_id")
            await self._database.user_sessions.create_index("expires_at")
            await self._database.user_sessions.create_index("created_at")
            
            logger.info("All database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
            raise
    
    async def drop_database(self):
        """Drop the entire database (for testing/reset)"""
        try:
            if self._client and self._database:
                await self._client.drop_database(DATABASE_NAME)
                logger.info(f"Database {DATABASE_NAME} dropped successfully")
        except Exception as e:
            logger.error(f"Error dropping database: {e}")
            raise
    
    def get_database(self):
        """Get database reference"""
        if self._database is None:
            raise Exception("Database not connected")
        return self._database
    
    async def find_user_by_email_optimized(self, email: str) -> Optional[Dict[str, Any]]:
        """Optimized user lookup by email with projection"""
        try:
            if not self._database:
                raise Exception("Database not connected")
            
            # Use projection to return only needed fields
            user = await self._database.users.find_one(
                {"email": email},
                {
                    "_id": 1,
                    "email": 1,
                    "name": 1,
                    "role": 1,
                    "role_track": 1,
                    "is_verified": 1,
                    "created_at": 1,
                    "last_login": 1,
                    "points": 1,
                    "level": 1,
                    "login_streak": 1
                }
            )
            return user
        except Exception as e:
            logger.error(f"Error finding user by email: {e}")
            return None
    
    async def find_user_sessions_optimized(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Optimized user sessions lookup with limit and sorting"""
        try:
            if not self._database:
                raise Exception("Database not connected")
            
            # Use limit and sort for performance
            sessions = await self._database.user_sessions.find(
                {"user_id": user_id},
                limit=limit,
                sort=[("timestamp", -1)]  # Most recent first
            ).to_list(length=limit)
            
            return sessions
        except Exception as e:
            logger.error(f"Error finding user sessions: {e}")
            return []
    
    async def aggregate_dashboard_stats_optimized(self) -> Dict[str, Any]:
        """Optimized dashboard stats aggregation with pipeline"""
        try:
            if not self._database:
                raise Exception("Database not connected")
            
            # Use aggregation pipeline for better performance
            pipeline = [
                # Total users
                {"$group": {"_id": None, "total_users": {"$sum": 1}}},
                # Active courses
                {"$group": {"_id": None, "active_courses": {"$sum": {"$cond": [{"$eq": ["$status", "active"]}, 1, 0]}}}},
                # Average progress
                {"$group": {"_id": None, "avg_progress": {"$avg": "$progress"}}},
                # Total revenue
                {"$group": {"_id": None, "total_revenue": {"$sum": "$amount"}}}
            ]
            
            results = await self._database.enrollments.aggregate(pipeline).to_list(1)
            
            if results:
                stats = results[0]
                return {
                    "total_users": stats.get("total_users", 0),
                    "active_courses": stats.get("active_courses", 0),
                    "avg_progress": stats.get("avg_progress", 0),
                    "total_revenue": stats.get("total_revenue", 0)
                }
            else:
                return {"total_users": 0, "active_courses": 0, "avg_progress": 0, "total_revenue": 0}
        except Exception as e:
            logger.error(f"Error aggregating dashboard stats: {e}")
            return {"total_users": 0, "active_courses": 0, "avg_progress": 0, "total_revenue": 0}

    async def get_collection_stats(self) -> Dict[str, int]:
        """Get statistics for all collections"""
        try:
            if self._database is None:
                raise Exception("Database not connected")
            
            collections = await self._database.list_collection_names()
            stats = {}
            
            # Get counts in parallel for better performance
            async def get_collection_count(collection_name):
                collection = self._database[collection_name]
                return await collection.count_documents({})
            
            import asyncio
            tasks = [get_collection_count(name) for name in collections]
            counts = await asyncio.gather(*tasks)
            
            for i, collection_name in enumerate(collections):
                stats[collection_name] = counts[i]
                
            return stats
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {}

# Global database connection instance
db_connection = DatabaseConnection()

# Database connection functions
async def init_database():
    """Initialize database connection and create indexes"""
    success = await db_connection.connect()
    if success:
        await db_connection.create_indexes()
        logger.info("Database initialized successfully")
    else:
        raise Exception("Failed to initialize database")

async def check_connection() -> tuple[bool, str]:
    """Check database connection status"""
    try:
        if not db_connection._client:
            success = await db_connection.connect()
            if not success:
                return False, "Failed to connect to MongoDB"
        
        # Test connection
        await db_connection._client.admin.command('ping')
        return True, "Database connection healthy"
        
    except Exception as e:
        return False, f"Connection error: {str(e)}"

async def close_database():
    """Close database connection"""
    await db_connection.disconnect()

# Collection getters
async def get_users_collection():
    """Get users collection"""
    db = await get_database()
    return db.users

async def get_courses_collection():
    """Get courses collection"""
    db = await get_database()
    return db.courses

async def get_enrollments_collection():
    """Get enrollments collection"""
    db = await get_database()
    return db.enrollments

async def get_problems_collection():
    """Get problems collection"""
    db = await get_database()
    return db.problems

async def get_submissions_collection():
    """Get submissions collection"""
    db = await get_database()
    return db.submissions

async def get_user_activities_collection():
    """Get user activities collection"""
    db = await get_database()
    return db.user_activities

async def get_code_submissions_collection():
    """Get code submissions collection"""
    db = await get_database()
    return db.code_submissions

async def get_test_runs_collection():
    """Get test runs collection"""
    db = await get_database()
    return db.test_runs

async def get_code_execution_logs_collection():
    """Get code execution logs collection"""
    db = await get_database()
    return db.code_execution_logs

async def get_kpi_data_collection():
    """Get KPI data collection"""
    db = await get_database()
    return db.kpi_data

async def get_kpi_alerts_collection():
    """Get KPI alerts collection"""
    db = await get_database()
    return db.kpi_alerts

async def get_user_sessions_collection():
    """Get user sessions collection"""
    db = await get_database()
    return db.user_sessions

async def get_wellness_metrics_collection():
    """Get wellness metrics collection"""
    db = await get_database()
    return db.wellness_metrics

async def get_skill_assessments_collection():
    """Get skill assessments collection"""
    db = await get_database()
    return db.skill_assessments

async def get_course_progress_collection():
    """Get course progress collection"""
    db = await get_database()
    return db.course_progress

async def get_user_surveys_collection():
    """Get user surveys collection"""
    db = await get_database()
    return db.user_surveys

async def get_collaboration_sessions_collection():
    """Get collaboration sessions collection"""
    db = await get_database()
    return db.collaboration_sessions

async def get_team_sessions_collection():
    """Get team sessions collection"""
    db = await get_database()
    return db.team_sessions

async def get_system_logs_collection():
    """Get system logs collection"""
    db = await get_database()
    return db.system_logs

async def get_database():
    """Get database instance"""
    if not db_connection._is_connected:
        await db_connection.connect()
    return db_connection.get_database()

async def get_users_collection():
    """Get users collection"""
    db = await get_database()
    return db.users

async def get_progress_collection():
    """Get progress collection"""
    db = await get_database()
    return db.progress

async def get_code_submissions_collection():
    """Get code submissions collection"""
    db = await get_database()
    return db.code_submissions

async def init_database():
    """Initialize database connection"""
    await db_connection.connect()

async def check_connection():
    """Check database connection status"""
    try:
        if db_connection._is_connected:
            return True, "Connected to MongoDB"
        else:
            await db_connection.connect()
            return True, "Connected to MongoDB"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

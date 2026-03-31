"""
MongoDB Database Migrations
Handles database schema migrations, data seeding, and version management
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from bson import ObjectId
from database.mongodb import get_database, init_database
from database.schemas import (
    User, UserRole, RoleTrack, Course, Difficulty, CourseStatus,
    Problem, Enrollment, UserActivity, ActivityType,
    KPIData, KPIAlert, WellnessMetric, SkillAssessment,
    CourseProgress, UserSurvey, CollaborationSession, TeamSession
)

logger = logging.getLogger(__name__)

class Migration:
    """Base migration class"""
    
    def __init__(self, version: str, description: str):
        self.version = version
        self.description = description
        self.created_at = datetime.now(timezone.utc)
        self.applied_at = None
    
    async def up(self):
        """Apply migration"""
        raise NotImplementedError
    
    async def down(self):
        """Rollback migration"""
        raise NotImplementedError
    
    async def is_applied(self) -> bool:
        """Check if migration is already applied"""
        try:
            db = await get_database()
            migration_record = await db.migrations.find_one({"version": self.version})
            return migration_record is not None
        except Exception:
            return False
    
    async def mark_as_applied(self):
        """Mark migration as applied"""
        try:
            db = await get_database()
            await db.migrations.insert_one({
                "version": self.version,
                "description": self.description,
                "created_at": self.created_at,
                "applied_at": datetime.now(timezone.utc)
            })
            self.applied_at = datetime.now(timezone.utc)
        except Exception as e:
            logger.error(f"Failed to mark migration as applied: {e}")
            raise
    
    async def mark_as_rolled_back(self):
        """Mark migration as rolled back"""
        try:
            db = await get_database()
            await db.migrations.delete_one({"version": self.version})
            self.applied_at = None
        except Exception as e:
            logger.error(f"Failed to mark migration as rolled back: {e}")
            raise

class Migration001_CreateCollections(Migration):
    """Create all collections with validation rules"""
    
    def __init__(self):
        super().__init__("001", "Create all collections with validation rules")
    
    async def up(self):
        """Create collections and apply validation rules"""
        try:
            db = await get_database()
            
            # Create collections with validation
            collections_config = {
                "users": {
                    "validator": {
                        "$jsonSchema": {
                            "bsonType": "object",
                            "required": ["name", "email", "password_hash", "role", "role_track"],
                            "properties": {
                                "name": {"bsonType": "string", "minLength": 2, "maxLength": 100},
                                "email": {"bsonType": "string", "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"},
                                "role": {"enum": ["student", "instructor", "admin", "moderator"]},
                                "role_track": {"enum": ["backend", "data", "ml", "automation", "fullstack", "devops", "mobile", "general"]},
                                "points": {"bsonType": "int", "minimum": 0},
                                "level": {"bsonType": "int", "minimum": 1}
                            }
                        }
                    }
                },
                "courses": {
                    "validator": {
                        "$jsonSchema": {
                            "bsonType": "object",
                            "required": ["title", "description", "instructor_id", "instructor_name", "duration_weeks"],
                            "properties": {
                                "title": {"bsonType": "string", "minLength": 3, "maxLength": 200},
                                "description": {"bsonType": "string", "minLength": 10, "maxLength": 2000},
                                "difficulty": {"enum": ["beginner", "intermediate", "advanced", "expert"]},
                                "rating": {"bsonType": "double", "minimum": 0, "maximum": 5}
                            }
                        }
                    }
                },
                "problems": {
                    "validator": {
                        "$jsonSchema": {
                            "bsonType": "object",
                            "required": ["title", "description", "difficulty", "category", "test_cases"],
                            "properties": {
                                "title": {"bsonType": "string", "minLength": 3, "maxLength": 200},
                                "difficulty": {"enum": ["beginner", "intermediate", "advanced", "expert"]},
                                "points": {"bsonType": "int", "minimum": 1}
                            }
                        }
                    }
                }
            }
            
            # Create collections
            collection_names = [
                "users", "courses", "enrollments", "problems", "submissions",
                "user_activities", "code_submissions", "test_runs", "code_execution_logs",
                "kpi_data", "kpi_alerts", "user_sessions", "wellness_metrics",
                "skill_assessments", "course_progress", "user_surveys",
                "collaboration_sessions", "team_sessions", "system_logs", "migrations",
                "email_verifications", "password_resets", "refresh_tokens"
            ]
            
            for collection_name in collection_names:
                try:
                    if collection_name in collections_config:
                        await db.create_collection(
                            collection_name,
                            **collections_config[collection_name]
                        )
                    else:
                        await db.create_collection(collection_name)
                    logger.info(f"Created collection: {collection_name}")
                except Exception as e:
                    if "already exists" not in str(e):
                        logger.warning(f"Collection {collection_name} might already exist: {e}")
            
            logger.info("All collections created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create collections: {e}")
            raise
    
    async def down(self):
        """Drop all collections"""
        try:
            db = await get_database()
            collection_names = await db.list_collection_names()
            
            for collection_name in collection_names:
                await db.drop_collection(collection_name)
                logger.info(f"Dropped collection: {collection_name}")
            
            logger.info("All collections dropped successfully")
            
        except Exception as e:
            logger.error(f"Failed to drop collections: {e}")
            raise

class Migration002_SeedInitialData(Migration):
    """Seed initial data for development"""
    
    def __init__(self):
        super().__init__("002", "Seed initial data for development")
    
    async def up(self):
        """Seed initial data"""
        try:
            db = await get_database()
            
            # Seed users
            await self._seed_users(db)
            
            # Seed courses
            await self._seed_courses(db)
            
            # Seed problems
            await self._seed_problems(db)
            
            # Seed KPI data
            await self._seed_kpi_data(db)
            
            logger.info("Initial data seeded successfully")
            
        except Exception as e:
            logger.error(f"Failed to seed initial data: {e}")
            raise
    
    async def down(self):
        """Remove seeded data"""
        try:
            db = await get_database()
            
            # Remove all data from collections
            collections_to_clean = [
                "users", "courses", "problems", "enrollments",
                "kpi_data", "kpi_alerts", "user_activities"
            ]
            
            for collection_name in collections_to_clean:
                await db[collection_name].delete_many({})
                logger.info(f"Cleared collection: {collection_name}")
            
            logger.info("Seeded data removed successfully")
            
        except Exception as e:
            logger.error(f"Failed to remove seeded data: {e}")
            raise
    
    async def _seed_users(self, db):
        """Seed initial users"""
        users = [
            {
                "name": "Admin User",
                "email": "admin@pymastery.com",
                "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2.1jG",  # password: admin123
                "role": UserRole.ADMIN,
                "role_track": RoleTrack.GENERAL,
                "points": 1000,
                "level": 5,
                "badges": ["early_adopter", "admin"],
                "is_active": True,
                "is_verified": True,
                "login_streak": 30
            },
            {
                "name": "John Doe",
                "email": "john@example.com",
                "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2.1jG",  # password: password
                "role": UserRole.STUDENT,
                "role_track": RoleTrack.BACKEND,
                "points": 250,
                "level": 2,
                "badges": ["first_course"],
                "is_active": True,
                "is_verified": True,
                "login_streak": 7
            },
            {
                "name": "Jane Smith",
                "email": "jane@example.com",
                "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2.1jG",  # password: password
                "role": UserRole.INSTRUCTOR,
                "role_track": RoleTrack.DATA,
                "points": 500,
                "level": 3,
                "badges": ["instructor", "data_expert"],
                "is_active": True,
                "is_verified": True,
                "login_streak": 15
            }
        ]
        
        for user_data in users:
            user_data.update({
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
            await db.users.insert_one(user_data)
        
        logger.info(f"Seeded {len(users)} users")
    
    async def _seed_courses(self, db):
        """Seed initial courses"""
        courses = [
            {
                "title": "Python Fundamentals",
                "description": "Learn the basics of Python programming from scratch. This course covers variables, data types, control flow, functions, and more.",
                "instructor_id": "jane@example.com",
                "instructor_name": "Jane Smith",
                "difficulty": Difficulty.BEGINNER,
                "status": CourseStatus.PUBLISHED,
                "duration_weeks": 8,
                "tags": ["python", "programming", "basics"],
                "price": 0.0,
                "currency": "USD",
                "rating": 4.5,
                "review_count": 12,
                "enrollment_count": 45,
                "completion_count": 23,
                "prerequisites": [],
                "learning_objectives": [
                    "Understand Python syntax and basic concepts",
                    "Write simple Python programs",
                    "Use control flow and functions",
                    "Work with basic data structures"
                ],
                "syllabus": [
                    {"week": 1, "title": "Introduction to Python", "topics": ["Setup", "Variables", "Data Types"]},
                    {"week": 2, "title": "Control Flow", "topics": ["If statements", "Loops", "Functions"]},
                    {"week": 3, "title": "Data Structures", "topics": ["Lists", "Dictionaries", "Tuples"]},
                    {"week": 4, "title": "File Handling", "topics": ["Reading files", "Writing files", "JSON"]}
                ]
            },
            {
                "title": "Advanced JavaScript",
                "description": "Master advanced JavaScript concepts including closures, prototypes, async programming, and modern ES6+ features.",
                "instructor_id": "jane@example.com",
                "instructor_name": "Jane Smith",
                "difficulty": Difficulty.ADVANCED,
                "status": CourseStatus.PUBLISHED,
                "duration_weeks": 12,
                "tags": ["javascript", "web", "advanced"],
                "price": 49.99,
                "currency": "USD",
                "rating": 4.7,
                "review_count": 8,
                "enrollment_count": 28,
                "completion_count": 15,
                "prerequisites": ["Basic JavaScript knowledge"],
                "learning_objectives": [
                    "Master JavaScript closures and prototypes",
                    "Understand async programming patterns",
                    "Use modern ES6+ features",
                    "Build complex web applications"
                ]
            },
            {
                "title": "Data Science with Python",
                "description": "Learn data science fundamentals using Python. Covers pandas, numpy, matplotlib, and basic machine learning concepts.",
                "instructor_id": "jane@example.com",
                "instructor_name": "Jane Smith",
                "difficulty": Difficulty.INTERMEDIATE,
                "status": CourseStatus.PUBLISHED,
                "duration_weeks": 10,
                "tags": ["python", "data-science", "machine-learning"],
                "price": 79.99,
                "currency": "USD",
                "rating": 4.8,
                "review_count": 15,
                "enrollment_count": 67,
                "completion_count": 34,
                "prerequisites": ["Python Fundamentals"],
                "learning_objectives": [
                    "Use pandas for data manipulation",
                    "Create visualizations with matplotlib",
                    "Understand basic machine learning concepts",
                    "Clean and preprocess data"
                ]
            }
        ]
        
        for course_data in courses:
            course_data.update({
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
            await db.courses.insert_one(course_data)
        
        logger.info(f"Seeded {len(courses)} courses")
    
    async def _seed_problems(self, db):
        """Seed initial problems"""
        problems = [
            {
                "title": "Hello World",
                "description": "Write a program that prints 'Hello, World!' to the console.",
                "difficulty": Difficulty.BEGINNER,
                "category": "basics",
                "tags": ["hello-world", "basics", "print"],
                "time_limit_minutes": 5,
                "memory_limit_mb": 128,
                "test_cases": [
                    {"input": "", "expected": "Hello, World!"},
                    {"input": "", "expected": "Hello, World!"}
                ],
                "starter_code": {
                    "python": "# Write your code here\nprint(\"Hello, World!\")",
                    "javascript": "// Write your code here\nconsole.log('Hello, World!');",
                    "java": "// Write your code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}"
                },
                "solution_code": {
                    "python": "print(\"Hello, World!\")",
                    "javascript": "console.log('Hello, World!');",
                    "java": "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}"
                },
                "hints": [
                    "Use the print() function in Python",
                    "Use console.log() in JavaScript",
                    "Use System.out.println() in Java"
                ],
                "points": 10,
                "submission_count": 0,
                "success_rate": 0.0,
                "author_id": "admin@pymastery.com",
                "is_published": True
            },
            {
                "title": "Sum of Two Numbers",
                "description": "Write a program that takes two numbers as input and prints their sum.",
                "difficulty": Difficulty.BEGINNER,
                "category": "basics",
                "tags": ["sum", "addition", "input"],
                "time_limit_minutes": 10,
                "memory_limit_mb": 128,
                "test_cases": [
                    {"input": "5 3", "expected": "8"},
                    {"input": "10 20", "expected": "30"},
                    {"input": "-5 5", "expected": "0"}
                ],
                "starter_code": {
                    "python": "# Read two numbers and print their sum\na, b = map(int, input().split())\nprint(a + b)",
                    "javascript": "// Read two numbers and print their sum\nconst input = require('fs').readFileSync(0, 'utf8').trim().split(' ');\nconst a = parseInt(input[0]);\nconst b = parseInt(input[1]);\nconsole.log(a + b);",
                    "java": "// Read two numbers and print their sum\nimport java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(a + b);\n    }\n}"
                },
                "solution_code": {
                    "python": "a, b = map(int, input().split())\nprint(a + b)",
                    "javascript": "const input = require('fs').readFileSync(0, 'utf8').trim().split(' ');\nconst a = parseInt(input[0]);\nconst b = parseInt(input[1]);\nconsole.log(a + b);",
                    "java": "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(a + b);\n    }\n}"
                },
                "hints": [
                    "Use input().split() to read multiple values in Python",
                    "Use parseInt() to convert strings to numbers",
                    "Don't forget to handle the input format correctly"
                ],
                "points": 15,
                "submission_count": 0,
                "success_rate": 0.0,
                "author_id": "admin@pymastery.com",
                "is_published": True
            },
            {
                "title": "Factorial Calculation",
                "description": "Write a program that calculates the factorial of a given number.",
                "difficulty": Difficulty.INTERMEDIATE,
                "category": "mathematics",
                "tags": ["factorial", "recursion", "loops"],
                "time_limit_minutes": 15,
                "memory_limit_mb": 256,
                "test_cases": [
                    {"input": "5", "expected": "120"},
                    {"input": "0", "expected": "1"},
                    {"input": "10", "expected": "3628800"}
                ],
                "starter_code": {
                    "python": "# Calculate factorial of a number\ndef factorial(n):\n    # Your code here\n    pass\n\nn = int(input())\nprint(factorial(n))",
                    "javascript": "// Calculate factorial of a number\nfunction factorial(n) {\n    // Your code here\n}\n\nconst input = require('fs').readFileSync(0, 'utf8').trim();\nconst n = parseInt(input);\nconsole.log(factorial(n));",
                    "java": "// Calculate factorial of a number\npublic class Main {\n    public static long factorial(int n) {\n        // Your code here\n    }\n    \n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(factorial(n));\n    }\n}"
                },
                "solution_code": {
                    "python": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nn = int(input())\nprint(factorial(n))",
                    "javascript": "function factorial(n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nconst input = require('fs').readFileSync(0, 'utf8').trim();\nconst n = parseInt(input);\nconsole.log(factorial(n));",
                    "java": "public class Main {\n    public static long factorial(int n) {\n        if (n <= 1) return 1;\n        return n * factorial(n - 1);\n    }\n    \n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(factorial(n));\n    }\n}"
                },
                "hints": [
                    "Factorial of n is n * (n-1) * (n-2) * ... * 1",
                    "Factorial of 0 is 1",
                    "You can use recursion or iteration",
                    "Be careful with large numbers - they might overflow"
                ],
                "points": 25,
                "submission_count": 0,
                "success_rate": 0.0,
                "author_id": "admin@pymastery.com",
                "is_published": True
            }
        ]
        
        for problem_data in problems:
            problem_data.update({
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
            await db.problems.insert_one(problem_data)
        
        logger.info(f"Seeded {len(problems)} problems")
    
    async def _seed_kpi_data(self, db):
        """Seed initial KPI data"""
        kpi_data = [
            {
                "kpi_id": "total_users",
                "value": 3,
                "period_start": datetime.now(timezone.utc) - timedelta(days=30),
                "period_end": datetime.now(timezone.utc),
                "metadata": {"source": "database", "category": "user_metrics"}
            },
            {
                "kpi_id": "total_courses",
                "value": 3,
                "period_start": datetime.now(timezone.utc) - timedelta(days=30),
                "period_end": datetime.now(timezone.utc),
                "metadata": {"source": "database", "category": "course_metrics"}
            },
            {
                "kpi_id": "total_problems",
                "value": 3,
                "period_start": datetime.now(timezone.utc) - timedelta(days=30),
                "period_end": datetime.now(timezone.utc),
                "metadata": {"source": "database", "category": "problem_metrics"}
            },
            {
                "kpi_id": "avg_completion_rate",
                "value": 65.5,
                "period_start": datetime.now(timezone.utc) - timedelta(days=30),
                "period_end": datetime.now(timezone.utc),
                "metadata": {"source": "calculated", "category": "engagement_metrics"}
            },
            {
                "kpi_id": "daily_active_users",
                "value": 2,
                "period_start": datetime.now(timezone.utc) - timedelta(days=1),
                "period_end": datetime.now(timezone.utc),
                "metadata": {"source": "analytics", "category": "user_metrics"}
            }
        ]
        
        for kpi in kpi_data:
            kpi.update({
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
            await db.kpi_data.insert_one(kpi)
        
        logger.info(f"Seeded {len(kpi_data)} KPI data points")

class MigrationManager:
    """Manages database migrations"""
    
    def __init__(self):
        self.migrations = [
            Migration001_CreateCollections(),
            Migration002_SeedInitialData()
        ]
    
    async def migrate(self):
        """Run all pending migrations"""
        try:
            logger.info("Starting database migration...")
            
            # Ensure database is initialized
            await init_database()
            
            for migration in self.migrations:
                if not await migration.is_applied():
                    logger.info(f"Applying migration {migration.version}: {migration.description}")
                    await migration.up()
                    await migration.mark_as_applied()
                    logger.info(f"Migration {migration.version} applied successfully")
                else:
                    logger.info(f"Migration {migration.version} already applied, skipping")
            
            logger.info("All migrations completed successfully")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise
    
    async def rollback(self, version: str = None):
        """Rollback migrations"""
        try:
            logger.info("Starting database rollback...")
            
            if version:
                # Rollback to specific version
                for migration in reversed(self.migrations):
                    if migration.version > version and await migration.is_applied():
                        logger.info(f"Rolling back migration {migration.version}")
                        await migration.down()
                        await migration.mark_as_rolled_back()
            else:
                # Rollback last migration
                last_migration = self.migrations[-1]
                if await last_migration.is_applied():
                    logger.info(f"Rolling back migration {last_migration.version}")
                    await last_migration.down()
                    await last_migration.mark_as_rolled_back()
            
            logger.info("Rollback completed successfully")
            
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            raise
    
    async def get_migration_status(self) -> Dict[str, Any]:
        """Get migration status"""
        try:
            db = await get_database()
            applied_migrations = await db.migrations.find({}).to_list(length=None)
            applied_versions = {m["version"] for m in applied_migrations}
            
            status = {
                "total_migrations": len(self.migrations),
                "applied_migrations": len(applied_migrations),
                "pending_migrations": [],
                "migration_details": []
            }
            
            for migration in self.migrations:
                is_applied = migration.version in applied_versions
                status["migration_details"].append({
                    "version": migration.version,
                    "description": migration.description,
                    "applied": is_applied,
                    "applied_at": next((m["applied_at"] for m in applied_migrations if m["version"] == migration.version), None)
                })
                
                if not is_applied:
                    status["pending_migrations"].append(migration.version)
            
            return status
            
        except Exception as e:
            logger.error(f"Failed to get migration status: {e}")
            return {"error": str(e)}

# Global migration manager
migration_manager = MigrationManager()

# Migration functions
async def run_migrations():
    """Run all pending migrations"""
    await migration_manager.migrate()

async def rollback_migrations(version: str = None):
    """Rollback migrations"""
    await migration_manager.rollback(version)

async def get_migration_status():
    """Get migration status"""
    return await migration_manager.get_migration_status()

async def reset_database():
    """Reset entire database (for testing)"""
    try:
        logger.info("Resetting entire database...")
        
        # Drop database
        from database.mongodb import db_connection
        await db_connection.drop_database()
        
        # Re-initialize and run migrations
        await init_database()
        await run_migrations()
        
        logger.info("Database reset completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to reset database: {e}")
        raise

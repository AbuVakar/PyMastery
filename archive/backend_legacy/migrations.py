"""
Database migration scripts for PyMastery
"""
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List

from database import init_database, get_database
from models import User, UserRole, SubscriptionType

async def create_indexes():
    """Create database indexes for performance"""
    try:
        db = await get_database()
        
        # User collection indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("created_at")
        await db.users.create_index("last_login")
        await db.users.create_index("role")
        
        # Progress collection indexes
        await db.progress.create_index([("user_id", 1), ("module_id", 1)])
        await db.progress.create_index([("user_id", 1), ("created_at", -1)])
        await db.progress.create_index([("module_id", 1), ("completed", 1)])
        
        # Code submissions indexes
        await db.code_submissions.create_index([("user_id", 1), ("created_at", -1)])
        await db.code_submissions.create_index([("problem_id", 1), ("status", 1)])
        await db.code_submissions.create_index("language")
        
        # Analytics collection indexes
        await db.analytics.create_index([("user_id", 1), ("timestamp", -1)])
        await db.analytics.create_index([("event_type", 1), ("timestamp", -1)])
        await db.analytics.create_index("timestamp")
        
        # Curriculum progress indexes
        await db.curriculum.create_index([("user_id", 1), ("track", 1)])
        await db.curriculum.create_index([("user_id", 1), ("completed", 1)])
        
        # Placement progress indexes
        await db.placement.create_index([("user_id", 1), ("track", 1)])
        await db.placement.create_index([("user_id", 1), ("completed", 1)])
        
        print("✅ All database indexes created successfully")
        logging.info("All database indexes created successfully")
        
    except Exception as e:
        print(f"❌ Error creating indexes: {str(e)}")
        logging.error(f"Error creating indexes: {str(e)}")
        raise e

async def create_sample_data():
    """Create sample data for testing"""
    try:
        db = await get_database()
        
        # Create sample admin user
        admin_user = {
            "name": "Admin User",
            "email": "admin@pymastery.com",
            "password": "$2b$12$admin123hashed",  # This would be properly hashed
            "role": UserRole.ADMIN,
            "subscription": SubscriptionType.PRO,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        
        # Check if admin user exists
        existing_admin = await db.users.find_one({"email": admin_user["email"]})
        if not existing_admin:
            await db.users.insert_one(admin_user)
            print("✅ Sample admin user created")
        
        # Create sample curriculum data
        sample_curriculum = [
            {
                "track": "basics",
                "modules": [
                    {"id": "variables", "title": "Variables & Data Types", "difficulty": "Beginner"},
                    {"id": "loops", "title": "Loops & Control Flow", "difficulty": "Beginner"},
                    {"id": "functions", "title": "Functions", "difficulty": "Beginner"}
                ]
            },
            {
                "track": "dsa", 
                "modules": [
                    {"id": "arrays", "title": "Arrays & Lists", "difficulty": "Intermediate"},
                    {"id": "sorting", "title": "Sorting Algorithms", "difficulty": "Intermediate"},
                    {"id": "trees", "title": "Trees & Graphs", "difficulty": "Advanced"}
                ]
            }
        ]
        
        # Insert curriculum data
        for track_data in sample_curriculum:
            existing_track = await db.curriculum.find_one({"track": track_data["track"]})
            if not existing_track:
                await db.curriculum.insert_one(track_data)
                print(f"✅ Sample curriculum track created: {track_data['track']}")
        
        print("✅ Sample data creation completed")
        logging.info("Sample data creation completed")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        logging.error(f"Error creating sample data: {str(e)}")
        raise e

async def migrate_user_data():
    """Migrate existing user data structure"""
    try:
        db = await get_database()
        
        # Add new fields to existing users
        update_result = await db.users.update_many(
            {"profile": {"$exists": False}},
            {"$set": {"profile": {}, "updated_at": datetime.utcnow()}}
        )
        
        print(f"✅ Migrated {update_result.modified_count} user documents")
        logging.info(f"Migrated {update_result.modified_count} user documents")
        
    except Exception as e:
        print(f"❌ Error migrating user data: {str(e)}")
        logging.error(f"Error migrating user data: {str(e)}")
        raise e

async def backup_database():
    """Create backup of critical data"""
    try:
        db = await get_database()
        
        # Get all users for backup
        users_cursor = db.users.find({})
        users_backup = []
        
        async for user in users_cursor:
            user_data = dict(user)
            user_data['_id'] = str(user['_id'])
            users_backup.append(user_data)
        
        # Save backup to file (in production, this would go to cloud storage)
        backup_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "users": users_backup,
            "version": "1.0.0"
        }
        
        print(f"✅ Database backup completed with {len(users_backup)} users")
        logging.info(f"Database backup completed with {len(users_backup)} users")
        
        return backup_data
        
    except Exception as e:
        print(f"❌ Error creating backup: {str(e)}")
        logging.error(f"Error creating backup: {str(e)}")
        raise e

async def run_all_migrations():
    """Run all migration scripts"""
    print("🚀 Starting database migrations...")
    
    try:
        # Initialize database
        await init_database()
        
        # Create indexes
        await create_indexes()
        
        # Create sample data (only in development)
        import os
        if os.getenv("ENVIRONMENT", "development") == "development":
            await create_sample_data()
        
        # Migrate existing data
        await migrate_user_data()
        
        print("✅ All database migrations completed successfully")
        logging.info("All database migrations completed successfully")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        logging.error(f"Migration failed: {str(e)}")
        raise e

if __name__ == "__main__":
    asyncio.run(run_all_migrations())

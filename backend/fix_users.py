import asyncio
import sys
sys.path.insert(0, '.')
from database.mongodb import get_database

async def fix():
    db = await get_database()

    # Fix demo users
    result = await db.users.update_many(
        {"email": {"$in": ["demo@test.com", "testuser123@gmail.com"]}},
        {"$set": {"is_active": True, "account_status": "active"}}
    )
    print(f"Updated {result.modified_count} users to is_active=True")

    # Show current state
    async for user in db.users.find({"email": {"$in": ["demo@test.com", "testuser123@gmail.com"]}}):
        print(f"  {user['email']}: is_active={user.get('is_active')}, account_status={user.get('account_status', 'N/A')}")

asyncio.run(fix())

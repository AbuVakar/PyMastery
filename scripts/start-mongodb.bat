@echo off
REM MongoDB Quick Start Script for PyMastery (Windows)
REM This script starts MongoDB using Docker (recommended)

echo 🚀 Starting MongoDB for PyMastery...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Navigate to project root
cd /d "%~dp0"

REM Start MongoDB using docker-compose
echo 📦 Starting MongoDB container...
docker-compose -f docker-compose.mongodb.yml up -d mongodb

REM Wait for MongoDB to be ready
echo ⏳ Waiting for MongoDB to be ready...
timeout /t 10 /nobreak

REM Test connection
echo 🔍 Testing MongoDB connection...
python -c "
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connection():
    try:
        client = AsyncIOMotorClient('mongodb://admin:password123@localhost:27017')
        await client.admin.command('ping')
        print('✅ MongoDB is ready!')
        client.close()
        return True
    except Exception as e:
        print(f'❌ MongoDB not ready: {e}')
        return False

result = asyncio.run(test_connection())
exit(0 if result else 1)
"

if %errorlevel% equ 0 (
    echo.
    echo 🎉 MongoDB started successfully!
    echo.
    echo 📊 MongoDB Express available at: http://localhost:8081
    echo 🔗 MongoDB connection: mongodb://admin:password123@localhost:27017
    echo 🗄️  Database: pymastery
    echo.
    echo 💡 To update your .env file, add:
    echo    MONGODB_URL=mongodb://admin:password123@localhost:27017
    echo    DATABASE_NAME=pymastery
    echo.
    echo 🛑 To stop MongoDB:
    echo    docker-compose -f docker-compose.mongodb.yml down
) else (
    echo ❌ Failed to start MongoDB. Check the logs:
    echo    docker-compose -f docker-compose.mongodb.yml logs mongodb
    pause
    exit /b 1
)

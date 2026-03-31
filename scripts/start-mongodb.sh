#!/bin/bash

# MongoDB Quick Start Script for PyMastery
# This script starts MongoDB using Docker (recommended)

echo "🚀 Starting MongoDB for PyMastery..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Start MongoDB using docker-compose
echo "📦 Starting MongoDB container..."
docker-compose -f docker-compose.mongodb.yml up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Test connection
echo "🔍 Testing MongoDB connection..."
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

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 MongoDB started successfully!"
    echo ""
    echo "📊 MongoDB Express available at: http://localhost:8081"
    echo "🔗 MongoDB connection: mongodb://admin:password123@localhost:27017"
    echo "🗄️  Database: pymastery"
    echo ""
    echo "💡 To update your .env file, add:"
    echo "   MONGODB_URL=mongodb://admin:password123@localhost:27017"
    echo "   DATABASE_NAME=pymastery"
    echo ""
    echo "🛑 To stop MongoDB:"
    echo "   docker-compose -f docker-compose.mongodb.yml down"
else
    echo "❌ Failed to start MongoDB. Check the logs:"
    echo "   docker-compose -f docker-compose.mongodb.yml logs mongodb"
    exit 1
fi

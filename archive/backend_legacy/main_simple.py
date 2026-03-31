"""
PyMastery Backend - Simplified Version
Core functionality for running the application
"""

from typing import List, Optional
from datetime import datetime, timedelta
import os
import logging
import json

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PyMastery API",
    description="A comprehensive programming learning platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Environment variables
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/pymastery")
DATABASE_NAME = os.getenv("DATABASE_NAME", "pymastery")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Global variables for database connection
database = None
client = None

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Pydantic models
class UserCreate(BaseModel):
    email: str
    name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime
    points: int = 0
    level: int = 1

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    environment: str
    database_status: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    return {"email": email}

# Database connection
async def get_database():
    global database, client
    if database is None:
        try:
            client = AsyncIOMotorClient(MONGODB_URL)
            database = client[DATABASE_NAME]
            logger.info("Connected to MongoDB successfully")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise HTTPException(status_code=500, detail="Database connection failed")
    return database

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    logger.info("Starting PyMastery backend...")
    # Test database connection
    try:
        db = await get_database()
        await db.command("ping")
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    global client
    if client:
        client.close()
        logger.info("Database connection closed")

# Basic endpoints
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    db_status = "connected"
    try:
        db = await get_database()
        await db.command("ping")
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0",
        environment=os.getenv('ENVIRONMENT', 'development'),
        database_status=db_status
    )

@app.post("/api/auth/register")
async def register_user(user: UserCreate):
    """Register a new user"""
    try:
        db = await get_database()
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = get_password_hash(user.password)
        
        # Create user document
        user_doc = {
            "email": user.email,
            "name": user.name,
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "points": 0,
            "level": 1,
            "login_streak": 0
        }
        
        # Insert user
        result = await db.users.insert_one(user_doc)
        
        # Create response
        response_user = UserResponse(
            id=str(result.inserted_id),
            email=user.email,
            name=user.name,
            created_at=user_doc["created_at"],
            points=user_doc["points"],
            level=user_doc["level"]
        )
        
        logger.info(f"New user registered: {user.email}")
        return {"success": True, "user": response_user}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/auth/login")
async def login_user(user_login: UserLogin):
    """Login user"""
    try:
        db = await get_database()
        
        # Find user
        user = await db.users.find_one({"email": user_login.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(user_login.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"], "user_id": str(user["_id"])},
            expires_delta=access_token_expires
        )
        
        logger.info(f"User logged in: {user_login.email}")
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user["name"],
                "points": user.get("points", 0),
                "level": user.get("level", 1)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    try:
        db = await get_database()
        
        # Find user
        user = await db.users.find_one({"email": current_user["email"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user["name"],
                "points": user.get("points", 0),
                "level": user.get("level", 1),
                "login_streak": user.get("login_streak", 0),
                "created_at": user["created_at"],
                "is_active": user.get("is_active", True)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user info error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Simple code execution endpoint (fallback)
@app.post("/api/v1/code/execute")
async def execute_code(request: dict):
    """Simple code execution endpoint (fallback mode)"""
    try:
        source_code = request.get("source_code", "")
        language = request.get("language", "python").lower()
        stdin_input = request.get("stdin", "")
        
        if language != "python":
            return {
                "status": "error",
                "stderr": f"Language '{language}' not supported in fallback mode. Only Python is available.",
                "stdout": "",
                "exit_code": 1
            }
        
        import subprocess
        import tempfile
        import sys
        from pathlib import Path
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(source_code)
            temp_file = f.name
        
        try:
            # Execute the code
            result = subprocess.run(
                [sys.executable, temp_file],
                input=stdin_input,
                text=True,
                capture_output=True,
                timeout=10
            )
            
            # Clean up
            Path(temp_file).unlink(missing_ok=True)
            
            return {
                "status": "success" if result.returncode == 0 else "error",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode,
                "execution_method": "local_fallback",
                "language": language
            }
            
        except subprocess.TimeoutExpired:
            Path(temp_file).unlink(missing_ok=True)
            return {
                "status": "error",
                "stderr": "Execution timed out (10 seconds limit)",
                "stdout": "",
                "exit_code": 1
            }
        
    except Exception as e:
        logger.error(f"Code execution error: {e}")
        return {
            "status": "error",
            "stderr": f"Execution error: {str(e)}",
            "stdout": "",
            "exit_code": -1
        }

@app.get("/api/v1/code/languages")
async def get_supported_languages():
    """Get list of supported programming languages"""
    return {
        "languages": [
            {"id": "python", "name": "Python 3", "supported": True},
            {"id": "javascript", "name": "JavaScript", "supported": False, "note": "Requires Judge0 API key"},
            {"id": "java", "name": "Java", "supported": False, "note": "Requires Judge0 API key"},
            {"id": "cpp", "name": "C++", "supported": False, "note": "Requires Judge0 API key"},
            {"id": "c", "name": "C", "supported": False, "note": "Requires Judge0 API key"},
        ]
    }

@app.get("/api/v1/code/service-status")
async def get_service_status():
    """Get code execution service status"""
    return {
        "configured": False,
        "available": True,
        "api_url": "https://judge0-ce.p.rapidapi.com/submissions",
        "supported_languages": ["python"],
        "message": "Using local fallback execution. Configure JUDGE0_API_KEY for full language support.",
        "fallback_mode": True
    }

# Dashboard endpoints
@app.get("/api/v1/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        db = await get_database()
        
        # Get basic stats
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({"is_active": True})
        
        return {
            "success": True,
            "stats": {
                "total_users": total_users,
                "active_users": active_users,
                "total_courses": 0,
                "total_problems": 0,
                "total_submissions": 0
            }
        }
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return {
            "success": True,
            "stats": {
                "total_users": 0,
                "active_users": 0,
                "total_courses": 0,
                "total_problems": 0,
                "total_submissions": 0
            }
        }

@app.get("/api/v1/dashboard/activity")
async def get_dashboard_activity():
    """Get recent activity"""
    return {
        "success": True,
        "activities": [
            {
                "id": "1",
                "type": "user_registration",
                "message": "Welcome to PyMastery! A new user joined the platform.",
                "timestamp": datetime.utcnow().isoformat(),
                "user": "System"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

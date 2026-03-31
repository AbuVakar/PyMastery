# Enhanced FastAPI with Production Optimizations (Auto-Reload Triggered)
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends
import time
import logging
import os
from urllib.parse import urlparse

# Import authentication
from routers.ai_tutor import router as ai_tutor_router
from routers.dashboard import router as dashboard_router
from routers.code_execution import router as code_execution_router
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.content import courses_router, problems_router
from routers.contact import router as contact_router
from routers.google_auth import router as google_auth_router
from auth.dependencies import get_current_user

# Production configuration
app = FastAPI(
    title="PyMastery API",
    description="Production-ready API for PyMastery",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS with production settings
default_allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:4174",
    "http://127.0.0.1:4174",
    "http://localhost:4175",
    "http://127.0.0.1:4175",
    "http://localhost:4176",
    "http://127.0.0.1:4176",
]

configured_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

frontend_url = os.getenv("FRONTEND_URL", "").strip()
frontend_origin = ""
if frontend_url:
    parsed_frontend_url = urlparse(frontend_url)
    if parsed_frontend_url.scheme and parsed_frontend_url.netloc:
        frontend_origin = f"{parsed_frontend_url.scheme}://{parsed_frontend_url.netloc}"

allowed_origins = list(
    dict.fromkeys(
        default_allowed_origins
        + configured_origins
        + ([frontend_origin] if frontend_origin else [])
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    # Allow local development ports like 5174/5175 when 5173 is occupied.
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Response-Time"],
)

# Include authentication routes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
# Google OAuth
app.include_router(google_auth_router, tags=["Google OAuth"])
# Include AI tutor routes
app.include_router(ai_tutor_router, tags=["AI Tutor"])
# Include dashboard routes
app.include_router(dashboard_router, tags=["Dashboard"])
# Include code execution routes
app.include_router(code_execution_router, tags=["Code Execution"])
app.include_router(users_router, tags=["Users"])
app.include_router(courses_router, tags=["Courses"])
app.include_router(problems_router, tags=["Problems"])
app.include_router(contact_router, prefix="/api/v1", tags=["Contact"])

# Protected route example
@app.get("/api/protected/dashboard")
async def protected_dashboard(current_user: dict = Depends(get_current_user)):
    """Protected dashboard route - requires authentication"""
    return {
        "message": "Welcome to protected dashboard",
        "user": current_user
    }

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "base-uri 'self'; "
        "frame-ancestors 'none'; "
        "form-action 'self'; "
        "img-src 'self' data: https:; "
        "style-src 'self' 'unsafe-inline'; "
        "script-src 'self' 'unsafe-inline'; "
        "font-src 'self' data: https:; "
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://generativelanguage.googleapis.com; "
        "frame-src https://accounts.google.com"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response

# Performance monitoring middleware
@app.middleware("http")
async def add_performance_headers(request: Request, call_next):
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = (time.time() - start_time) * 1000
    
    # Add performance headers
    response.headers["X-Response-Time"] = f"{process_time:.2f}ms"
    response.headers["X-Process-Time"] = str(process_time)
    
    # Add cache control headers for static content
    if request.url.path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=31536000"
    
    return response

# Fast health check - optimized for monitoring
@app.get("/api/health")
async def health_check():
    """Fast health check endpoint optimized for monitoring and uptime checks"""
    response = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "2.0.0",
        "response_time_ms": "fast",
    }

    try:
        import psutil

        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=0)
        response["system"] = {
            "memory_percent": memory.percent,
            "memory_used_gb": round(memory.used / (1024**3), 2),
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "cpu_percent": cpu_percent,
        }
    except ImportError:
        response["system"] = {
            "metrics_available": False,
            "reason": "psutil not installed",
        }
    except Exception as e:
        response["status"] = "degraded"
        response["error"] = str(e)

    return response

# Detailed health check endpoint for when metrics are needed
@app.get("/api/health/detailed")
async def detailed_health_check():
    """Detailed health check with full metrics (slower, for admin use)"""
    try:
        import psutil
        cpu_percent = psutil.cpu_percent(interval=0)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        network = psutil.net_io_counters()
        process_count = len(psutil.pids())

        system_info = {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_used_gb": round(memory.used / (1024**3), 2),
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "memory_available_gb": round(memory.available / (1024**3), 2),
            "disk_percent": round((disk.used / disk.total) * 100, 2),
            "disk_used_gb": round(disk.used / (1024**3), 2),
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "network_bytes_sent": network.bytes_sent,
            "network_bytes_recv": network.bytes_recv,
            "process_count": process_count
        }
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": "2.0.0",
            "system": system_info,
            "response_time_ms": "detailed"
        }
    except ImportError:
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": "2.0.0",
            "system": {
                "metrics_available": False,
                "reason": "psutil not installed",
            },
            "response_time_ms": "detailed"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": time.time(),
            "version": "2.0.0",
            "response_time_ms": "detailed"
        }

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Production-ready startup configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    environment = os.getenv("ENVIRONMENT", "development")
    
    # Configure logging
    import logging
    log_level = "info" if environment == "production" else "debug"
    
    # Production settings
    if environment == "production":
        # Production configuration
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            workers=4,
            log_level=log_level,
            access_log=False,  # Reduce noise in production
            reload=False,
            loop="uvloop",
            http="httptools"
        )
    else:
        # Development configuration
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            workers=1,
            log_level=log_level,
            access_log=True,
            reload=True,
            loop="asyncio"
        )

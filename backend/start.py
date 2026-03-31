#!/usr/bin/env python3
"""
Production startup script for PyMastery Backend
This script handles environment validation and graceful startup
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
MIN_JWT_SECRET_LENGTH = 32
JWT_SECRET_PLACEHOLDER_FRAGMENTS = (
    "your-jwt-secret",
    "placeholder",
    "changeme",
    "replace-me",
    "example-secret",
    "generate-a-secret",
)

def setup_logging():
    """Configure logging for production"""
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_file = os.getenv("LOG_FILE", "logs/app.log")
    
    # Create logs directory if it doesn't exist
    Path(log_file).parent.mkdir(parents=True, exist_ok=True)
    
    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout) if os.getenv("ENVIRONMENT") != "production" else logging.NullHandler()
        ]
    )

def validate_environment():
    """Validate critical environment variables"""
    required_vars = ["JWT_SECRET_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"ERROR: Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these variables in your .env file.")
        print("Generate a strong secret with Python: import secrets; print(secrets.token_urlsafe(64))")
        sys.exit(1)

    jwt_secret = os.getenv("JWT_SECRET_KEY", "")
    if len(jwt_secret) < MIN_JWT_SECRET_LENGTH:
        print(f"ERROR: JWT_SECRET_KEY must be at least {MIN_JWT_SECRET_LENGTH} characters long.")
        print("Generate a strong secret with Python: import secrets; print(secrets.token_urlsafe(64))")
        sys.exit(1)

    normalized_secret = jwt_secret.lower()
    if any(fragment in normalized_secret for fragment in JWT_SECRET_PLACEHOLDER_FRAGMENTS):
        print("ERROR: JWT_SECRET_KEY is still set to a placeholder value.")
        print("Generate a strong secret with Python: import secrets; print(secrets.token_urlsafe(64))")
        sys.exit(1)

def main():
    """Main startup function"""
    # Setup logging first
    setup_logging()
    logger = logging.getLogger(__name__)
    
    logger.info("Starting PyMastery Backend...")
    
    # Validate environment
    validate_environment()
    
    # Import and run the app
    try:
        import uvicorn
        
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", 8000))
        environment = os.getenv("ENVIRONMENT", "development")
        
        logger.info(f"Starting in {environment} mode on {host}:{port}")
        
        if environment == "production":
            uvicorn.run(
                "main:app",
                host=host,
                port=port,
                workers=4,
                log_level="info",
                access_log=False,
                reload=False,
                loop="uvloop",
                http="httptools"
            )
        else:
            uvicorn.run(
                "main:app",
                host=host,
                port=port,
                workers=1,
                log_level="debug",
                access_log=True,
                reload=True,
                loop="asyncio"
            )
            
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

"""
Simple test version of main.py to get basic server running
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="PyMastery Backend - Simple Test")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "PyMastery Backend is running!"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "2025-01-01T00:00:00Z",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

# 📚 PyMastery API Documentation

## Overview

PyMastery is a comprehensive programming learning platform with enterprise-grade security, performance optimization, and monitoring capabilities.

## 🚀 Quick Start

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/pymastery.git
cd pymastery

# Backend setup
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration

# Frontend setup
cd frontend
npm install
npm run dev
```

### Environment Variables
```bash
# Required
MONGODB_URL=mongodb://localhost:27017/pymastery
JWT_SECRET_KEY=your-super-secret-jwt-key-32-chars
ENVIRONMENT=development

# Optional (for enhanced features)
JUDGE0_API_KEY=your-judge0-api-key
OPENAI_API_KEY=your-openai-api-key
REDIS_URL=redis://localhost:6379/0
```

---

## 🔐 Authentication API

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role_track": "backend",
  "agree_terms": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for verification.",
  "user": {
    "id": "64f8b3a2c9f4e4b8c9f4e4b8c9f4",
    "name": "John Doe",
    "email": "john@example.com",
    "role_track": "backend",
    "points": 0,
    "level": 1,
    "login_streak": 0,
    "created_at": "2024-03-17T12:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "remember_me": false
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "a1b2c3d4e5f6..."
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

---

## 💻 Code Execution API

### Execute Code
```http
POST /api/v1/code/execute
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "source_code": "print('Hello, World!')",
  "language": "python",
  "stdin": "",
  "time_limit": 5,
  "memory_limit": 128,
  "max_output_size": 1024
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_id": "abc123def456",
    "status": "SUCCESS",
    "stdout": "Hello, World!",
    "stderr": "",
    "compile_output": "",
    "time": "0.123",
    "memory": "15",
    "exit_code": 0,
    "execution_time": "2024-03-17T12:00:00Z",
    "language": "python",
    "fallback_used": null,
    "security_violations": []
  }
}
```

### Batch Execute
```http
POST /api/v1/code/batch-execute
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "executions": [
    {
      "source_code": "print('Hello')",
      "language": "python",
      "stdin": ""
    },
    {
      "source_code": "console.log('World')",
      "language": "javascript",
      "stdin": ""
    }
  ]
}
```

### Test Code
```http
POST /api/v1/code/test-run
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "source_code": "def add(a, b): return a + b",
  "language": "python",
  "test_cases": [
    {
      "input": "1,2",
      "expected_output": "3"
    },
    {
      "input": "5,7",
      "expected_output": "12"
    }
  ]
}
```

### Get Supported Languages
```http
GET /api/v1/code/languages
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "python": {
      "id": 71,
      "name": "Python",
      "version": "3.11.0",
      "extensions": [".py"],
      "features": ["execution", "testing", "debugging"]
    },
    "javascript": {
      "id": 63,
      "name": "JavaScript",
      "version": "18.15.0",
      "extensions": [".js", ".mjs"],
      "features": ["execution", "testing"]
    },
    "java": {
      "id": 62,
      "name": "Java",
      "version": "17.0.6",
      "extensions": [".java"],
      "features": ["execution", "compilation"]
    }
  }
}
```

---

## 📊 Analytics API

### Get Dashboard Stats
```http
GET /api/v1/dashboard/stats
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 1250,
    "active_users": 342,
    "total_courses": 45,
    "total_problems": 234,
    "completion_rate": 78.5,
    "avg_completion_time": 4.2,
    "popular_languages": {
      "python": 45.2,
      "javascript": 32.1,
      "java": 18.7
    }
  }
}
```

### Get User Progress
```http
GET /api/v1/users/progress
Authorization: Bearer <access_token>
```

### Get Performance Metrics
```http
GET /api/v1/analytics/performance-metrics
Authorization: Bearer <access_token>
```

---

## 🔒 Security Features

### Rate Limiting
All endpoints are protected by rate limiting:

- **Global**: 1000 requests per hour
- **Per IP**: 100 requests per minute
- **Per User**: 200 requests per minute
- **Code Execution**: 10 executions per 5 minutes
- **Authentication**: 20 attempts per 5 minutes

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1640995200
X-RateLimit-Strategy: sliding_window
```

### Security Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### Input Validation
All inputs are validated and sanitized:

- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Output encoding
- **Code Injection**: Pattern detection for dangerous code
- **File Upload**: Extension and size validation

---

## 📈 Performance Features

### Caching
Intelligent caching with Redis fallback:

- **Response Caching**: 5-minute TTL for static data
- **Query Caching**: Database query results
- **User Session Caching**: Fast session retrieval
- **Code Execution Caching**: Identical code results

### Database Optimization
- **Connection Pooling**: 20 max connections
- **Query Optimization**: Index-aware queries
- **Aggregation Pipelines**: Efficient data processing
- **Slow Query Detection**: >1 second threshold

### Async Processing
- **Worker Pool**: 4 concurrent workers
- **Request Queue**: 1000 max concurrent requests
- **Timeout Handling**: 30-second default timeout
- **Resource Management**: Memory and CPU limits

---

## 🏥 Monitoring & Health

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-17T12:00:00Z",
  "uptime_seconds": 86400,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "response_time": 0.045,
      "connected": true
    },
    "external_services": {
      "overall": "healthy",
      "judge0": {
        "status": "healthy",
        "response_time": 0.123
      },
      "openai": {
        "status": "not_configured"
      }
    },
    "system": {
      "cpu_percent": 15.2,
      "memory_percent": 45.8,
      "disk_usage_percent": 23.1
    }
  }
}
```

### Performance Metrics
```http
GET /api/performance/metrics
Authorization: Bearer <access_token>
```

### Error Statistics
```http
GET /api/errors/stats
Authorization: Bearer <access_token>
```

---

## 🔄 Fallback System

### Fallback Statistics
```http
GET /api/fallback/statistics
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code_execution": {
      "service_name": "code_execution",
      "performance_metrics": {
        "total_attempts": 1250,
        "successful_attempts": 1187,
        "failed_attempts": 63,
        "success_rate": 0.9496,
        "average_execution_time": 0.234
      },
      "circuit_breaker_state": {
        "is_open": false,
        "failure_count": 1,
        "last_failure_time": null
      }
    },
    "api_calls": {
      "service_name": "api_calls",
      "performance_metrics": {
        "total_attempts": 3420,
        "successful_attempts": 3289,
        "failed_attempts": 131,
        "success_rate": 0.9617,
        "average_execution_time": 0.156
      }
    }
  }
}
```

### Fallback Status
```http
GET /api/fallback/status
Authorization: Bearer <access_token>
```

---

## 🔧 Error Handling

### Error Response Format
All errors return consistent format:

```json
{
  "success": false,
  "error_id": "abc123",
  "error_type": "ValidationException",
  "message": "Invalid input data",
  "timestamp": "2024-03-17T12:00:00Z",
  "request_id": "req_456",
  "debug": {
    "error_category": "validation_errors",
    "stack_trace": "...",
    "context": {...}
  }
}
```

### Error Codes
- **400**: Bad Request / Validation Error
- **401**: Unauthorized / Authentication Error
- **403**: Forbidden / Permission Error
- **404**: Not Found
- **409**: Conflict / Duplicate Resource
- **422**: Unprocessable Entity
- **429**: Too Many Requests / Rate Limit
- **500**: Internal Server Error
- **502**: Bad Gateway / External Service Error
- **504**: Gateway Timeout

---

## 📝 SDK & Libraries

### Python Client
```python
from pymastery_client import PyMasteryClient

client = PyMasteryClient(
    base_url="http://localhost:8000",
    api_key="your-api-key"
)

# Execute code
result = await client.code.execute(
    source_code="print('Hello')",
    language="python"
)

# Get user info
user = await client.auth.get_me()
```

### JavaScript Client
```javascript
import { PyMasteryClient } from '@pymastery/client';

const client = new PyMasteryClient({
  baseURL: 'http://localhost:8000',
  apiKey: 'your-api-key'
});

// Execute code
const result = await client.code.execute({
  sourceCode: "console.log('Hello')",
  language: "javascript"
});

// Get user info
const user = await client.auth.getMe();
```

---

## 🚀 Deployment

### Development
```bash
# Backend
cd backend
python main.py

# Frontend
cd frontend
npm run dev
```

### Production
```bash
# Using Docker
docker-compose -f docker-compose.production.yml up -d

# Using PM2
pm2 start ecosystem.config.js

# Using Kubernetes
kubectl apply -f k8s/
```

### Environment Configuration
```bash
# Production
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Security
JWT_SECRET_KEY=<your-32-char-secret>
CORS_ORIGINS=https://yourdomain.com
RATE_LIMIT_ENABLED=true

# Performance
CACHE_ENABLED=true
DATABASE_POOL_SIZE=20
ASYNC_WORKERS=4
```

---

## 🔍 Testing

### Run Tests
```bash
# Backend tests
cd backend
pytest tests/ -v --cov=app

# Frontend tests
cd frontend
npm test

# Integration tests
pytest tests/integration/ -v

# Performance tests
pytest tests/performance/ -v -m performance
```

### Test Coverage
```bash
# Generate coverage report
pytest --cov=app --cov-report=html

# View coverage
open htmlcov/index.html
```

---

## 📞 Support

### Getting Help
- **Documentation**: https://docs.pymastery.com
- **API Reference**: https://api.pymastery.com/docs
- **Community**: https://community.pymastery.com
- **Issues**: https://github.com/your-org/pymastery/issues

### Contact
- **Email**: support@pymastery.com
- **Discord**: https://discord.gg/pymastery
- **Twitter**: @pymastery

---

## 📄 License

MIT License - see LICENSE file for details.

---

**Last Updated**: March 17, 2024
**Version**: 1.0.0
**API Version**: v1

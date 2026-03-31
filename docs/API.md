# 📚 PyMastery API Documentation

## 📋 **Overview**

PyMastery provides a comprehensive RESTful API for all platform features. The API follows REST conventions and includes authentication, rate limiting, and comprehensive error handling.

## 🔐 **Authentication**

### **JWT Token Authentication**
All API endpoints (except auth endpoints) require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### **Token Refresh**
JWT tokens expire after 24 hours. Use the refresh endpoint to obtain a new token:

```http
POST /api/auth/refresh
Content-Type: application/json
Authorization: Bearer <refresh-token>
```

## 📊 **API Endpoints**

### **Authentication Endpoints**

#### **User Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "student"
    }
  }
}
```

#### **User Registration**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "role_track": "backend",
  "agree_terms": true
}
```

#### **Token Refresh**
```http
POST /api/auth/refresh
Content-Type: application/json
Authorization: Bearer <refresh-token>
```

#### **Logout**
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

### **User Management Endpoints**

#### **Get User Profile**
```http
GET /api/users/me
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "student",
    "role_track": "backend",
    "points": 1500,
    "level": 5,
    "created_at": "2024-01-15T10:30:00Z",
    "last_login": "2024-03-19T09:15:00Z"
  }
}
```

#### **Update User Profile**
```http
PUT /api/users/me
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "learning_style": "visual",
  "time_commitment": 10
}
```

### **Course Management Endpoints**

#### **List Courses**
```http
GET /api/courses?page=1&limit=20&difficulty=beginner&search=python
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course_id",
        "title": "Python Fundamentals",
        "description": "Learn Python programming from scratch",
        "difficulty": "beginner",
        "duration": 8,
        "rating": 4.5,
        "enrollment_count": 1250,
        "instructor": {
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "topics": ["python", "programming", "basics"],
        "prerequisites": [],
        "learning_objectives": [
          "Understand Python syntax",
          "Write basic programs",
          "Use data structures"
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

#### **Get Course Details**
```http
GET /api/courses/{course_id}
Authorization: Bearer <access-token>
```

#### **Enroll in Course**
```http
POST /api/courses/{course_id}/enroll
Authorization: Bearer <access-token>
```

#### **Get User Enrollments**
```http
GET /api/enrollments?status=active
Authorization: Bearer <access-token>
```

### **Problem Management Endpoints**

#### **List Problems**
```http
GET /api/problems?course_id={course_id}&difficulty=intermediate&page=1&limit=10
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "problems": [
      {
        "id": "problem_id",
        "title": "Sum of Two Numbers",
        "description": "Write a function that returns the sum of two numbers",
        "difficulty": "beginner",
        "points": 10,
        "topics": ["arrays", "functions"],
        "test_cases": [
          {
            "input": [1, 2],
            "expected_output": 3
          },
          {
            "input": [-1, 5],
            "expected_output": 4
          }
        ],
        "constraints": {
          "time_limit": "1s",
          "memory_limit": "256MB"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 120,
      "pages": 12
    }
  }
}
```

#### **Get Problem Details**
```http
GET /api/problems/{problem_id}
Authorization: Bearer <access-token>
```

#### **Submit Solution**
```http
POST /api/problems/{problem_id}/submit
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "code": "def sum_two_numbers(a, b):\n    return a + b",
  "language": "python",
  "explanation": "Simple function that adds two numbers"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submission_id": "submission_id",
    "status": "pending",
    "submitted_at": "2024-03-19T10:30:00Z",
    "test_results": null
  }
}
```

#### **Get Submission Results**
```http
GET /api/submissions/{submission_id}
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "submission_id",
    "status": "completed",
    "score": 100,
    "passed_tests": 5,
    "total_tests": 5,
    "execution_time": 0.05,
    "memory_used": 128,
    "test_results": [
      {
        "test_case": 1,
        "status": "passed",
        "input": [1, 2],
        "expected_output": 3,
        "actual_output": 3,
        "execution_time": 0.01
      }
    ],
    "feedback": {
      "overall_score": 100,
      "code_quality": 85,
      "efficiency": 90,
      "suggestions": [
        "Consider adding input validation",
        "Good use of Python conventions"
      ]
    }
  }
}
```

### **AI Integration Endpoints**

#### **Analyze Code**
```http
POST /api/ai/analyze-code
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "code": "def sum_two_numbers(a, b):\n    return a + b",
  "language": "python",
  "problem_context": "Sum of two numbers problem"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "overall_score": 85,
      "complexity_score": 20,
      "style_score": 90,
      "efficiency_score": 85,
      "readability_score": 95,
      "best_practices_score": 80,
      "issues": [
        {
          "type": "style",
          "description": "Missing docstring",
          "line": 1,
          "severity": "minor"
        }
      ],
      "suggestions": [
        {
          "type": "improvement",
          "description": "Add type hints for better code clarity",
          "code": "def sum_two_numbers(a: int, b: int) -> int:"
        }
      ]
    }
  }
}
```

#### **Get AI Hint**
```http
POST /api/ai/generate-hint
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "problem_id": "problem_id",
  "user_code": "def sum_two_numbers(a, b):\n    return a + b",
  "stuck_point": "I'm not sure how to handle negative numbers"
}
```

#### **Start Tutor Session**
```http
POST /api/ai/tutor-session
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "topic": "Python functions",
  "difficulty": "beginner",
  "learning_style": "visual"
}
```

#### **Get Recommendations**
```http
GET /api/ai/recommendations?type=course&limit=5
Authorization: Bearer <access-token>
```

### **Study Groups Endpoints**

#### **List Study Groups**
```http
GET /api/study-groups?page=1&limit=10&topic=python
Authorization: Bearer <access-token>
```

#### **Create Study Group**
```http
POST /api/study-groups
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Python Beginners Study Group",
  "description": "A group for learning Python together",
  "topic": "python",
  "max_members": 20,
  "is_private": false
}
```

#### **Join Study Group**
```http
POST /api/study-groups/{group_id}/join
Authorization: Bearer <access-token>
```

#### **Group Chat**
```http
GET /api/study-groups/{group_id}/messages?page=1&limit=50
Authorization: Bearer <access-token>
```

```http
POST /api/study-groups/{group_id}/messages
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "message": "I'm having trouble with loops, can anyone help?",
  "type": "question"
}
```

### **Progress & Analytics Endpoints**

#### **Get User Progress**
```http
GET /api/progress/overview
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_progress": 65,
    "courses_completed": 3,
    "courses_in_progress": 2,
    "problems_solved": 45,
    "total_points": 1250,
    "current_level": 5,
    "learning_streak": 7,
    "time_spent": 1200,
    "achievements": [
      {
        "id": "first_problem",
        "name": "First Problem Solved",
        "description": "Solved your first coding problem",
        "earned_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### **Get Course Progress**
```http
GET /api/progress/courses/{course_id}
Authorization: Bearer <access-token>
```

#### **Get Learning Analytics**
```http
GET /api/analytics/learning?period=30d
Authorization: Bearer <access-token>
```

### **Real-time Endpoints**

#### **WebSocket Connection**
```javascript
const ws = new WebSocket('wss://yourdomain.com/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-jwt-token'
}));

// Join study group
ws.send(JSON.stringify({
  type: 'join_group',
  group_id: 'group_id'
}));
```

#### **Real-time Notifications**
```http
GET /api/notifications?page=1&limit=20&unread_only=true
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification_id",
        "type": "study_group_message",
        "title": "New message in Python Study Group",
        "message": "John: Can someone help with recursion?",
        "data": {
          "group_id": "group_id",
          "message_id": "message_id"
        },
        "created_at": "2024-03-19T10:30:00Z",
        "read": false
      }
    ],
    "unread_count": 5
  }
}
```

## 🔍 **Error Handling**

### **Standard Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-03-19T10:30:00Z"
}
```

### **Common Error Codes**
- `AUTHENTICATION_REQUIRED` - No valid token provided
- `TOKEN_EXPIRED` - JWT token has expired
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `PERMISSION_DENIED` - Insufficient permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## 📊 **Rate Limiting**

### **Rate Limits**
- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per minute
- **AI endpoints**: 20 requests per minute
- **File uploads**: 10 requests per hour

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🌐 **CORS Configuration**

### **Allowed Origins**
- `http://localhost:3000` (development)
- `https://yourdomain.com` (production)
- `https://www.yourdomain.com` (production)

### **Allowed Methods**
- GET, POST, PUT, DELETE, OPTIONS
- Content-Type: application/json
- Authorization: Bearer <token>

## 📝 **API Versioning**

### **Current Version**
- **Version**: v1
- **Base URL**: `/api/v1`
- **Versioning Strategy**: URL path versioning

### **Backward Compatibility**
- Previous versions supported for 6 months
- Deprecation warnings in response headers
- Migration guides provided

## 🧪 **Testing the API**

### **Using curl**
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get courses
curl -X GET http://localhost:8000/api/courses \
  -H "Authorization: Bearer <your-token>"

# Submit solution
curl -X POST http://localhost:8000/api/problems/123/submit \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"code":"def solution(): pass","language":"python"}'
```

### **Using JavaScript**
```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});

const { data } = await loginResponse.json();
const token = data.access_token;

// Get courses
const coursesResponse = await fetch('/api/courses', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data } = await coursesResponse.json();
```

## 📚 **Interactive Documentation**

### **Swagger UI**
- **URL**: `http://localhost:8000/docs`
- **Features**: Interactive API testing
- **Authentication**: Bearer token required

### **ReDoc**
- **URL**: `http://localhost:8000/redoc`
- **Features**: Beautiful API documentation
- **Examples**: Request/response examples

---

## 📞 **Support**

For API issues:
1. Check [Error Codes](#error-handling)
2. Review [Rate Limits](#rate-limiting)
3. Test with [API Testing Tools](#testing-the-api)
4. Check [GitHub Issues](https://github.com/your-org/pymastery/issues)

---

**📚 PyMastery API - Comprehensive Documentation for Developers!**

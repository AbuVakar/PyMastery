# Authentication System - Complete Implementation Guide

## Overview
PyMastery features a comprehensive authentication system with secure JWT tokens, email verification, password reset, and role-based access control.

## Features

### 🔐 **Core Authentication**
- **JWT Token System**: Secure access and refresh tokens
- **Password Security**: Bcrypt hashing with salt rounds
- **Email Verification**: Required for account activation
- **Password Reset**: Secure token-based password recovery
- **Session Management**: Token refresh and logout functionality

### 🛡️ **Security Features**
- **Rate Limiting**: Prevent brute force attacks
- **Token Expiration**: Configurable token lifetimes
- **Password Strength**: Strong password requirements
- **Email Validation**: Secure email verification process
- **Role-Based Access**: Granular permission system

### 📧 **Email Integration**
- **HTML Email Templates**: Professional email design
- **SMTP Configuration**: Flexible email server setup
- **Background Tasks**: Async email sending
- **Email Tracking**: Delivery status monitoring

## API Endpoints

### Authentication Endpoints

#### **User Registration**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role_track": "backend",
  "agree_terms": true
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "role_track": "backend",
    "is_verified": false,
    "points": 0,
    "level": 1,
    "badges": [],
    "login_streak": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### **User Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "remember_me": false
}
```

#### **Token Refresh**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### **Password Reset Request**
```http
POST /api/auth/password-reset-request
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### **Password Reset Confirmation**
```http
POST /api/auth/password-reset-confirm
Content-Type: application/json

{
  "token": "abc123def456...",
  "new_password": "NewSecurePass123!"
}
```

#### **Email Verification Request**
```http
POST /api/auth/verify-email-request
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### **Email Verification Confirmation**
```http
POST /api/auth/verify-email-confirm
Content-Type: application/json

{
  "token": "abc123def456..."
}
```

#### **Change Password**
```http
POST /api/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_password": "OldPass123!",
  "new_password": "NewSecurePass123!"
}
```

#### **Get Current User**
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

#### **Logout**
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

## Configuration

### Environment Variables
```bash
# JWT Configuration
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@pymastery.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Email Setup

#### Gmail Configuration
1. **Enable 2FA**: Go to Google Account settings
2. **App Password**: Generate app-specific password
3. **Configure Environment**:
   ```bash
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

#### Other Email Providers
```bash
# Outlook
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587

# Yahoo
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587

# Custom SMTP
SMTP_SERVER=smtp.yourdomain.com
SMTP_PORT=587
```

## Security Implementation

### Password Security
```python
# Bcrypt with 12 salt rounds
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))

# Password verification
is_valid = bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
```

### JWT Token Security
```python
# Access token (30 minutes)
access_token = jwt.encode({
    "sub": user_id,
    "email": user_email,
    "exp": datetime.utcnow() + timedelta(minutes=30),
    "type": "access"
}, SECRET_KEY, algorithm="HS256")

# Refresh token (7 days)
refresh_token = jwt.encode({
    "sub": user_id,
    "email": user_email,
    "exp": datetime.utcnow() + timedelta(days=7),
    "type": "refresh"
}, SECRET_KEY, algorithm="HS256")
```

### Token Verification
```python
def verify_token(token: str, token_type: str = "access"):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        
        # Check token type
        if payload.get("type") != token_type:
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        # Check expiration
        if datetime.utcnow() > datetime.fromtimestamp(payload["exp"]):
            raise HTTPException(status_code=401, detail="Token has expired")
        
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Password Strength Validation
```python
def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit")
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        errors.append("Password must contain at least one special character")
    
    return len(errors) == 0, errors
```

## Role-Based Access Control

### User Roles
- **Student**: Basic access to courses and problems
- **Instructor**: Can manage courses and view analytics
- **Admin**: Full system administration

### Permission System
```python
# Role permissions
role_permissions = {
    "student": ["read_own_profile", "submit_problems", "view_courses"],
    "instructor": ["read_own_profile", "submit_problems", "view_courses", "manage_courses", "view_analytics"],
    "admin": ["read_own_profile", "submit_problems", "view_courses", "manage_courses", "view_analytics", "manage_users", "system_admin"]
}

# Usage in endpoints
@router.get("/admin/users")
async def get_users(current_user: Dict[str, Any] = Depends(require_admin)):
    # Only admin can access
    pass

@router.post("/courses")
async def create_course(current_user: Dict[str, Any] = Depends(require_instructor)):
    # Instructor or admin can create courses
    pass
```

### Dependency Examples
```python
# Get current user
current_user: Dict[str, Any] = Depends(get_current_user)

# Get verified user only
current_user: Dict[str, Any] = Depends(get_current_verified_user)

# Get admin user only
current_user: Dict[str, Any] = Depends(get_current_admin_user)

# Get instructor or admin
current_user: Dict[str, Any] = Depends(get_current_instructor_user)
```

## Email Templates

### Password Reset Email
- **Professional Design**: Modern HTML template
- **Security Features**: Token expiration warnings
- **Clear Instructions**: Step-by-step guidance
- **Brand Consistency**: PyMastery branding

### Email Verification Email
- **Welcome Message**: Friendly introduction
- **Benefits Highlight**: What users get after verification
- **Security Notice**: Token expiration information
- **Call to Action**: Clear verification button

### Password Changed Notification
- **Security Alert**: Inform about password change
- **Security Tips**: Best practices for password security
- **Contact Info**: Support information if needed

## Rate Limiting

### Implementation
```python
class AuthRateLimiter:
    def __init__(self):
        self.max_requests = 5  # Max requests per window
        self.window_minutes = 15  # Time window
    
    async def is_allowed(self, identifier: str) -> bool:
        # Check if request is allowed based on rate limit
        pass
```

### Rate Limits
- **Login Attempts**: 5 attempts per 15 minutes
- **Password Reset**: 3 requests per hour
- **Email Verification**: 5 requests per hour
- **Registration**: 3 attempts per hour

## Frontend Integration

### React/TypeScript Example
```typescript
// Login API call
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data.user;
  } else {
    throw new Error(data.detail);
  }
};

// Token refresh
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('access_token', data.access_token);
    return data.user;
  } else {
    // Clear tokens and redirect to login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }
};

// Protected API call
const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Try refreshing token
    await refreshToken();
    // Retry the original request
    const newToken = localStorage.getItem('access_token');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`
      }
    });
  }
  
  return response;
};
```

## Database Schema

### Users Collection
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "John Doe",
  "email": "john@example.com",
  "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2.1jG",
  "role": "student",
  "role_track": "backend",
  "is_active": true,
  "is_verified": false,
  "points": 0,
  "level": 1,
  "badges": [],
  "login_streak": 0,
  "preferences": {},
  "progress": {},
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-01-01T00:00:00Z"),
  "last_login": ISODate("2024-01-01T00:00:00Z")
}
```

### Email Verifications Collection
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "user_id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "token_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2.1jG",
  "expires_at": ISODate("2024-01-02T00:00:00Z"),
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "used": false,
  "used_at": null
}
```

### Password Resets Collection
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "user_id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "token_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2.1jG",
  "expires_at": ISODate("2024-01-01T01:00:00Z"),
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "used": false,
  "used_at": null
}
```

## Testing

### Unit Tests
```python
# Test password hashing
def test_password_hashing():
    password = "TestPass123!"
    hashed = auth_service.hash_password(password)
    assert auth_service.verify_password(password, hashed)
    assert not auth_service.verify_password("WrongPass", hashed)

# Test JWT tokens
def test_jwt_tokens():
    user_data = {"sub": "user123", "email": "test@example.com"}
    token = auth_service.create_access_token(user_data)
    payload = auth_service.verify_token(token)
    assert payload["sub"] == "user123"
    assert payload["email"] == "test@example.com"

# Test password validation
def test_password_strength():
    is_valid, errors = auth_service.validate_password_strength("WeakPass")
    assert not is_valid
    assert "uppercase letter" in errors[0]
    
    is_valid, errors = auth_service.validate_password_strength("StrongPass123!")
    assert is_valid
    assert len(errors) == 0
```

### Integration Tests
```python
# Test registration flow
async def test_registration_flow():
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "TestPass123!",
        "role_track": "backend",
        "agree_terms": True
    }
    
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert not data["user"]["is_verified"]

# Test login flow
async def test_login_flow():
    login_data = {
        "email": "test@example.com",
        "password": "TestPass123!"
    }
    
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
```

## Security Best Practices

### Password Security
- **Strong Requirements**: Minimum 8 characters, mixed case, numbers, special characters
- **Bcrypt Hashing**: 12 salt rounds for secure hashing
- **No Password Storage**: Never store plain text passwords
- **Password History**: Prevent reuse of recent passwords

### Token Security
- **Short Access Tokens**: 30-minute expiration
- **Long Refresh Tokens**: 7-day expiration
- **Token Rotation**: Refresh token rotation on use
- **Secure Storage**: Use httpOnly cookies in production

### Email Security
- **Token Expiration**: 1 hour for password reset, 24 hours for email verification
- **Single Use**: Tokens can only be used once
- **Secure Tokens**: Cryptographically secure random tokens
- **Rate Limiting**: Prevent email bombing

### Network Security
- **HTTPS Only**: Always use HTTPS in production
- **CORS Configuration**: Properly configure allowed origins
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Validate all input data

## Troubleshooting

### Common Issues

#### **JWT Token Errors**
```bash
# Check secret key
echo $SECRET_KEY

# Verify token format
# Should be: "Bearer <token>"
```

#### **Email Not Sending**
```bash
# Check SMTP configuration
# Verify email and password
# Check firewall settings
# Test SMTP connection
```

#### **Password Reset Not Working**
```bash
# Check token expiration
# Verify token hash storage
# Check email delivery
# Test token verification
```

### Debug Mode
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Test token generation
token = auth_service.create_access_token({"sub": "test"})
print(f"Token: {token}")

# Test token verification
payload = auth_service.verify_token(token)
print(f"Payload: {payload}")
```

## Production Considerations

### Security
- **Environment Variables**: Never commit secrets
- **HTTPS**: Always use HTTPS in production
- **Rate Limiting**: Implement proper rate limiting
- **Monitoring**: Monitor auth events and failures

### Performance
- **Token Caching**: Cache token verification results
- **Database Indexes**: Proper indexes on auth collections
- **Email Queue**: Use background tasks for emails
- **Load Balancing**: Distribute auth requests

### Scalability
- **Redis**: Use Redis for session storage
- **Microservices**: Separate auth service
- **CDN**: Serve static assets via CDN
- **Database**: Use read replicas for auth queries

## Support Resources

### Documentation
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Handbook](https://jwt.io/introduction/)
- [Bcrypt Documentation](https://pypi.org/project/bcrypt/)
- [Python SMTP](https://docs.python.org/3/library/smtplib.html)

### Tools
- [JWT Debugger](https://jwt.io/)
- [Password Generator](https://passwordsgenerator.net/)
- [Email Tester](https://www.mail-tester.com/)
- [Rate Limiting](https://github.com/alisaifee/flask-limiter)

### Community
- [Stack Overflow](https://stackoverflow.com/questions/tagged/jwt)
- [Reddit r/webdev](https://www.reddit.com/r/webdev/)
- [GitHub Issues](https://github.com/jwt/pyjwt/issues)
- [Discord Communities](https://discord.gg/)

---

This comprehensive authentication system provides enterprise-grade security for PyMastery with all modern authentication features properly implemented and secured.

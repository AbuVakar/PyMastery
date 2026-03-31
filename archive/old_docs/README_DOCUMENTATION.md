# PyMastery Backend - Complete Documentation

## 📚 Overview

This document provides comprehensive documentation for the PyMastery backend API, including API reference, code structure, deployment guides, and developer resources.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- MongoDB 4.4+
- Redis 6.0+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/pymastery/backend.git
cd backend

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the application
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📖 Documentation Sections

### 1. API Documentation
- **Authentication**: JWT-based authentication system
- **Endpoints**: Complete API reference with examples
- **Rate Limiting**: Request rate limiting and quotas
- **Error Handling**: Standardized error responses
- **WebSocket Events**: Real-time communication

### 2. Code Documentation
- **Architecture**: System design and patterns
- **Services**: Business logic and data processing
- **Middleware**: Request/response processing
- **Utilities**: Helper functions and tools
- **Database**: Data models and operations

### 3. Deployment Guide
- **Environment Setup**: Development and production setup
- **Configuration**: Environment variables and settings
- **Docker**: Container deployment
- **Production**: Production deployment best practices
- **Monitoring**: Performance and error monitoring

### 4. Developer Guide
- **Getting Started**: Development setup and workflow
- **Contributing**: Guidelines for contributing
- **Code Standards**: Coding conventions and best practices
- **Testing**: Unit, integration, and API testing
- **Documentation**: Documentation guidelines

## 🔧 API Reference

### Authentication

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "student"
}
```

### Users

#### Get Profile
```http
GET /api/v1/users/profile
Authorization: Bearer <jwt-token>
```

#### Update Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "John Doe",
  "bio": "Learning programming"
}
```

### Courses

#### List Courses
```http
GET /api/v1/courses?page=1&limit=10&category=python
Authorization: Bearer <jwt-token>
```

#### Get Course Details
```http
GET /api/v1/courses/{course_id}
Authorization: Bearer <jwt-token>
```

### Problems

#### List Problems
```http
GET /api/v1/problems?difficulty=medium&category=algorithms
Authorization: Bearer <jwt-token>
```

#### Submit Solution
```http
POST /api/v1/problems/{problem_id}/submit
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "code": "def solution(): pass",
  "language": "python"
}
```

## 🏗️ Architecture

### System Components

1. **API Layer**: FastAPI application with middleware
2. **Service Layer**: Business logic and data processing
3. **Data Layer**: MongoDB with connection pooling
4. **Cache Layer**: Multi-level caching system
5. **Security Layer**: Authentication and authorization
6. **Monitoring Layer**: Performance and error monitoring

### Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer Pattern**: Business logic separation
- **Dependency Injection**: Loose coupling
- **Middleware Pattern**: Request/response processing
- **Observer Pattern**: Event-driven architecture

### Data Flow

1. Request received by FastAPI
2. Security middleware processes request
3. Rate limiting middleware checks limits
4. Request routed to appropriate service
5. Service processes business logic
6. Data retrieved from cache or database
7. Response processed by middleware
8. Response returned to client

## 🔒 Security

### Authentication
- JWT-based authentication
- Secure password hashing with bcrypt
- Token expiration and refresh
- Session management

### Authorization
- Role-based access control (RBAC)
- Permission-based resource access
- API key authentication for services
- OAuth2 integration support

### Input Validation
- Comprehensive input validation
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting

### Data Protection
- Encryption at rest and in transit
- Sensitive data masking
- Audit logging
- Data retention policies

## 📊 Performance

### Caching
- Multi-level caching (Memory, Redis, Disk)
- Intelligent cache promotion/demotion
- Cache invalidation strategies
- Performance monitoring

### Database Optimization
- Connection pooling
- Query optimization
- Index management
- Database monitoring

### Monitoring
- Real-time performance metrics
- Error tracking and alerting
- Resource utilization monitoring
- Custom metrics and dashboards

## 🧪 Testing

### Test Types
- **Unit Tests**: Individual function and method testing
- **Integration Tests**: Service and database integration
- **API Tests**: Endpoint testing with various scenarios
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability assessment

### Test Structure
```
tests/
├── unit/
│   ├── test_services/
│   ├── test_utils/
│   └── test_models/
├── integration/
│   ├── test_database/
│   ├── test_cache/
│   └── test_external_apis/
├── api/
│   ├── test_auth/
│   ├── test_users/
│   └── test_courses/
└── performance/
    ├── test_load/
    └── test_stress/
```

### Running Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_services/test_auth.py

# Run with coverage
pytest --cov=backend tests/

# Run performance tests
pytest tests/performance/
```

## 📦 Deployment

### Development
```bash
# Local development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# With debug mode
DEBUG=true uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker
```bash
# Build image
docker build -t pymastery-backend .

# Run container
docker run -p 8000:8000 -e DATABASE_URL=mongodb://mongo:27017/pymastery pymastery-backend

# With docker-compose
docker-compose up -d
```

### Production
```bash
# With Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# With environment file
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --env-file .env --bind 0.0.0.0:8000
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=mongodb://localhost:27017/pymastery
DB_NAME=pymastery

# Redis
REDIS_URL=redis://localhost:6379/0
CACHE_ENABLED=true

# Security
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# Application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=http://localhost:3000,https://pymastery.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Performance
PERFORMANCE_MONITORING=true
CACHE_TTL=300
COMPRESSION_ENABLED=true
```

### Configuration Files
- `config.py`: Application configuration
- `logging.conf`: Logging configuration
- `docker-compose.yml`: Docker compose setup
- `Dockerfile`: Container configuration

## 📝 Code Standards

### Python Standards
- Follow PEP 8 guidelines
- Use Black for code formatting
- Use isort for import sorting
- Use flake8 for linting
- Use mypy for type checking

### Naming Conventions
- Variables: `snake_case`
- Functions: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private members: `_prefix`

### Documentation
- Docstrings for all public functions and classes
- Type hints for all function parameters and return values
- Inline comments for complex logic
- README files for modules and packages

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Pull Request Guidelines
- Clear description of changes
- Link to relevant issues
- Include tests
- Update documentation
- Follow code standards

### Code Review Process
- Automated checks (linting, testing)
- Peer review by maintainers
- Security review for sensitive changes
- Performance review for optimizations

## 📊 Monitoring

### Metrics
- Request rate and response time
- Error rate and types
- Database performance
- Cache hit rates
- Resource utilization

### Logging
- Structured logging with correlation IDs
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Log aggregation and analysis
- Alert configuration

### Health Checks
- Application health endpoint
- Database connectivity checks
- Cache availability checks
- External service health checks

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check MongoDB connection
mongosh --eval "db.adminCommand('ismaster')"

# Check connection string
echo $DATABASE_URL
```

#### Redis Connection Errors
```bash
# Check Redis connection
redis-cli ping

# Check Redis configuration
redis-cli config get "*"
```

#### Performance Issues
```bash
# Check system resources
top
htop
iostat

# Check application logs
tail -f logs/app.log
```

### Debug Mode
```bash
# Enable debug mode
DEBUG=true python main.py

# Enable verbose logging
LOG_LEVEL=DEBUG python main.py
```

## 📚 Additional Resources

### Documentation
- [API Reference](./docs/api_documentation.md)
- [Code Documentation](./docs/code_documentation.md)
- [Deployment Guide](./docs/deployment_guide.md)
- [Developer Guide](./docs/developer_guide.md)

### Tools
- [Postman Collection](./docs/postman_collection.json)
- [OpenAPI Spec](./docs/openapi.json)
- [Docker Configuration](./docker-compose.yml)
- [Environment Template](.env.example)

### External Links
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Python Documentation](https://docs.python.org/3/)

## 📞 Support

### Getting Help
- Create an issue on GitHub
- Join our Discord community
- Email support@pymastery.com
- Check the FAQ

### Reporting Issues
- Include error messages and logs
- Provide steps to reproduce
- Include system information
- Use appropriate issue templates

---

**Generated on**: {datetime.now().isoformat()}
**Version**: 1.0.0
**Last Updated**: {datetime.now().strftime("%B %d, %Y")}

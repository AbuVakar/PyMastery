# 🚀 PyMastery - Advanced Programming Learning Platform

<div align="center">

![PyMastery Logo](https://via.placeholder.com/200x80/4F46E5/FFFFFF?text=PyMastery)

**Enterprise-Grade Programming Learning Platform with AI-Powered Features**

[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://python.org)
[![Node Version](https://img.shields.io/badge/node-18.0+-green.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)](#)

[Features](#features) • [Setup](#setup) • [API](#api) • [Contributing](#contributing) • [License](#license)

</div>

---

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🔧 Development](#-development)
- [🚀 Deployment](#-deployment)
- [📚 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Features

### 🎯 Core Learning Features
- **📚 Interactive Courses**: 50+ programming courses with hands-on exercises
- **💻 Code Editor**: Monaco-based IDE with syntax highlighting and IntelliSense
- **🧠 AI Tutor**: OpenAI-powered personalized learning assistance
- **🏆 Gamification**: Points, badges, leaderboards, and achievements
- **📊 Analytics Dashboard**: Comprehensive progress tracking and insights

### 🔧 Advanced Features
- **⚡ Real-time Code Execution**: Judge0 integration with 10+ programming languages
- **🔍 Smart Search**: Advanced search across courses, problems, and solutions
- **👥 Peer Review**: Collaborative code review system
- **🏅 Certificates**: Professional PDF certificates with verification
- **📱 Mobile-First**: Responsive design optimized for all devices

### 🛡️ Enterprise Features
- **🔐 Authentication**: JWT-based auth with OAuth (Google, GitHub)
- **👥 Role Management**: Student, Instructor, Admin roles with permissions
- **📈 Analytics**: Advanced user behavior and performance analytics
- **🔒 Security**: Enterprise-grade security with rate limiting and validation
- **🌐 Multi-language**: Support for multiple programming languages

---

## 🏗️ Architecture

```
PyMastery/
├── backend/                 # FastAPI Python Backend
│   ├── routers/            # API Routes (30+ endpoints)
│   ├── services/           # Business Logic Services
│   ├── database/           # MongoDB Models & Migrations
│   ├── models/             # Pydantic Models
│   ├── utils/              # Utility Functions
│   └── main.py             # FastAPI Application
├── frontend/               # React TypeScript Frontend
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── pages/          # Page Components
│   │   ├── hooks/          # Custom Hooks
│   │   ├── contexts/       # React Contexts
│   │   ├── config/         # Configuration
│   │   └── utils/          # Utility Functions
│   └── package.json
├── docs/                   # Documentation
└── README.md
```

---

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Memory**: 8GB RAM minimum (16GB recommended)
- **Storage**: 5GB free space minimum
- **Network**: Internet connection for external APIs

### Software Requirements

#### Backend (Python)
- **Python**: 3.11+ (recommended 3.11.5)
- **pip**: Latest version
- **MongoDB**: 5.0+ (local or Atlas)
- **Redis**: 6.0+ (optional, for caching)

#### Frontend (Node.js)
- **Node.js**: 18.0+ (recommended 18.17.0)
- **npm**: 8.0+ or **yarn**: 1.22+

#### External Services (Optional)
- **OpenAI API Key**: For AI-powered features
- **Judge0 API Key**: For code execution
- **SMTP Server**: For email functionality
- **Google OAuth**: For social login

---

## 🚀 Quick Start

### One-Command Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/pymastery.git
cd pymastery

# Run the setup script
./setup.sh
```

### Manual Setup

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/pymastery.git
cd pymastery
```

#### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Configure environment variables (see Configuration section)
```

#### 3. Frontend Setup
```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure environment variables
```

#### 4. Start Services
```bash
# Start MongoDB (if using local)
mongod

# Start Redis (if using local)
redis-server

# Start backend (in new terminal)
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start frontend (in new terminal)
cd frontend
npm run dev
```

#### 5. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

---

## 📦 Installation

### Backend Installation

#### 1. Python Environment Setup
```bash
# Install Python 3.11+
# Windows: Download from python.org
# macOS: brew install python@3.11
# Ubuntu: sudo apt update && sudo apt install python3.11

# Verify installation
python --version
pip --version
```

#### 2. Virtual Environment
```bash
# Create virtual environment
python -m venv backend/venv

# Activate
# Windows:
backend\venv\Scripts\activate
# macOS/Linux:
source backend/venv/bin/activate
```

#### 3. Dependencies Installation
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi, uvicorn, motor; print('Dependencies installed successfully')"
```

#### 4. Database Setup
```bash
# Option 1: MongoDB Local
# Install MongoDB Community Server
# Start MongoDB service

# Option 2: MongoDB Atlas (Cloud)
# Create free cluster at https://cloud.mongodb.com
# Get connection string

# Option 3: Docker
docker run -d -p 27017:27017 --name mongodb mongo:5.0
```

### Frontend Installation

#### 1. Node.js Setup
```bash
# Install Node.js 18+
# Windows: Download from nodejs.org
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

#### 2. Dependencies Installation
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Verify installation
npm run build
```

---

## ⚙️ Configuration

### Backend Configuration (.env)

Create `backend/.env` file:

```bash
# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
APP_NAME=PyMastery
APP_VERSION=1.0.0
DEBUG=false
ENVIRONMENT=production

# =============================================================================
# API CONFIGURATION
# =============================================================================
API_HOST=0.0.0.0
API_PORT=8000
API_BASE_URL=http://localhost:8000

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
MONGODB_URL=mongodb://localhost:27017/pymastery
MONGODB_DB_NAME=pymastery
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=5

# =============================================================================
# REDIS CONFIGURATION (Optional)
# =============================================================================
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=
REDIS_MAX_CONNECTIONS=20

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true
FROM_EMAIL=noreply@pymastery.com
FROM_NAME=PyMastery Team

# =============================================================================
# OAUTH CONFIGURATION
# =============================================================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:5173/auth/github/callback

# =============================================================================
# AI SERVICES CONFIGURATION
# =============================================================================
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2048
OPENAI_TEMPERATURE=0.7

# =============================================================================
# CODE EXECUTION CONFIGURATION
# =============================================================================
JUDGE0_API_KEY=your-rapidapi-key
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com/submissions
JUDGE0_HOST=judge0-ce.p.rapidapi.com
DEFAULT_CPU_TIME_LIMIT=5
DEFAULT_MEMORY_LIMIT=128
MAX_CPU_TIME_LIMIT=30
MAX_MEMORY_LIMIT=1024

# =============================================================================
# RATE LIMITING CONFIGURATION
# =============================================================================
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
LOGIN_RATE_LIMIT=5
LOGIN_RATE_WINDOW=900

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOW_HEADERS=*

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10485760
LOG_BACKUP_COUNT=5

# =============================================================================
# MONITORING CONFIGURATION
# =============================================================================
ENABLE_METRICS=false
METRICS_PORT=9090
METRICS_PATH=/metrics

# =============================================================================
# BACKUP CONFIGURATION
# =============================================================================
BACKUP_ENABLED=false
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=
BACKUP_ENCRYPTION_KEY=
```

### Frontend Configuration (.env.local)

Create `frontend/.env.local` file:

```bash
# =============================================================================
# API CONFIGURATION
# =============================================================================
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FRONTEND_URL=http://localhost:5173

# =============================================================================
# FEATURE FLAGS
# =============================================================================
REACT_APP_FEATURE_DARK_MODE=true
REACT_APP_FEATURE_NOTIFICATIONS=true
REACT_APP_FEATURE_ANALYTICS=true
REACT_APP_FEATURE_LIVE_CHAT=false
REACT_APP_FEATURE_VIDEO_CALLS=false

# =============================================================================
# DEVELOPMENT SETTINGS
# =============================================================================
REACT_APP_DEBUG_PANEL=false
REACT_APP_MOCK_APIS=false

# =============================================================================
# ANALYTICS CONFIGURATION
# =============================================================================
REACT_APP_GOOGLE_ANALYTICS_ID=
REACT_APP_SENTRY_DSN=

# =============================================================================
# OAUTH CONFIGURATION
# =============================================================================
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_GITHUB_CLIENT_ID=your-github-client-id
```

---

## 🔧 Development

### Backend Development

#### Running in Development Mode
```bash
# Activate virtual environment
source backend/venv/bin/activate

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run with specific host/port
uvicorn main:app --reload --host 127.0.0.1 --port 8001

# Run with debug mode
uvicorn main:app --reload --log-level debug
```

#### Database Migrations
```bash
# Run migrations
python -m database.cli migrate

# Check migration status
python -m database.cli status

# Rollback migration
python -m database.cli rollback

# Reset database (development only)
python -m database.cli reset
```

#### Code Quality Tools
```bash
# Format code
black backend/
isort backend/

# Lint code
flake8 backend/
mypy backend/

# Run tests
pytest backend/tests/
pytest backend/tests/ -v --cov=backend
```

### Frontend Development

#### Running in Development Mode
```bash
# Start development server
npm run dev

# Start with specific port
npm run dev -- --port 3000

# Start with specific host
npm run dev -- --host 0.0.0.0
```

#### Code Quality Tools
```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

---

## 🚀 Deployment

### Production Deployment

#### Backend Deployment (Docker)

1. **Create Dockerfile**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

2. **Docker Compose**:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - MONGODB_URL=mongodb://mongodb:27017/pymastery
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    restart: unless-stopped

  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:6.2-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  mongodb_data:
```

3. **Deploy**:
```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Frontend Deployment (Vercel/Netlify)

1. **Build for Production**:
```bash
# Navigate to frontend
cd frontend

# Build application
npm run build

# Preview build
npm run preview
```

2. **Environment Variables**:
Configure production environment variables in your hosting platform.

3. **Deploy to Vercel**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 📚 API Documentation

### Available Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

#### Problems (`/api/v1/problems`)
- `GET /api/v1/problems` - List all problems
- `GET /api/v1/problems/{id}` - Get problem details
- `POST /api/v1/problems` - Create problem
- `PUT /api/v1/problems/{id}` - Update problem

#### Code Execution (`/api/v1/code`)
- `POST /api/v1/code/execute` - Execute code
- `POST /api/v1/code/submit` - Submit solution
- `GET /api/v1/code/languages` - Get supported languages

#### Courses (`/api/v1/courses`)
- `GET /api/v1/courses` - List all courses
- `GET /api/v1/courses/{id}` - Get course details
- `POST /api/v1/courses/{id}/enroll` - Enroll in course

#### Analytics (`/api/v1/analytics`)
- `GET /api/v1/analytics/overview` - Get analytics overview
- `GET /api/v1/analytics/performance` - Get performance metrics

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🧪 Testing

### Backend Testing

#### Run Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v

# Run with specific marker
pytest -m unit
pytest -m integration
pytest -m slow
```

#### Test Structure
```
backend/tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/       # Test fixtures
```

### Frontend Testing

#### Run Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui
```

#### Test Structure
```
frontend/src/
├── __tests__/      # Test files
├── components/     # Component tests
├── pages/          # Page tests
└── utils/          # Utility tests
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes**: Follow coding standards and add tests
4. **Run tests**: Ensure all tests pass
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push branch**: `git push origin feature/amazing-feature`
7. **Create Pull Request**: Describe your changes and why they're needed

### Coding Standards

#### Python (Backend)
- Follow PEP 8 style guide
- Use Black for code formatting
- Use type hints for all functions
- Write comprehensive docstrings
- Keep functions small and focused

#### JavaScript/TypeScript (Frontend)
- Follow ESLint configuration
- Use Prettier for code formatting
- Use TypeScript for all new code
- Write meaningful component names
- Add proper error handling

### Commit Messages
```
feat: Add new feature
fix: Fix bug in authentication
docs: Update API documentation
style: Format code with Black
refactor: Refactor user service
test: Add tests for problem submission
chore: Update dependencies
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and API docs
- **Issues**: Create an issue on GitHub
- **Discussions**: Start a discussion on GitHub
- **Email**: support@pymastery.com

### Common Issues

#### Backend Issues
- **Port already in use**: Change port in uvicorn command
- **MongoDB connection failed**: Check MongoDB URL and service status
- **Module not found**: Activate virtual environment and install dependencies

#### Frontend Issues
- **Port already in use**: Change port in npm run dev command
- **API connection failed**: Check backend is running and API URL is correct
- **Build failed**: Check Node.js version and clear node_modules

### Troubleshooting

#### Database Issues
```bash
# Check MongoDB connection
python -c "from motor.motor_asyncio import AsyncIOMotorClient; print('MongoDB OK')"

# Reset database (development only)
python -m database.cli reset
```

#### Backend Issues
```bash
# Check dependencies
pip freeze | grep fastapi

# Check imports
python -c "import main; print('Imports OK')"
```

#### Frontend Issues
```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check build
npm run build
```

---

## 🎉 Acknowledgments

- **FastAPI**: For the excellent web framework
- **React**: For the amazing UI library
- **MongoDB**: For the flexible database
- **OpenAI**: For the AI capabilities
- **Judge0**: For the code execution engine
- **Tailwind CSS**: For the utility-first CSS framework

---

## 📊 Project Status

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

<div align="center">

**Built with ❤️ by the PyMastery Team**

[Website](https://pymastery.com) • [Documentation](https://docs.pymastery.com) • [Support](mailto:support@pymastery.com)

</div>

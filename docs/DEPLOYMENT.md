# 🚀 PyMastery Deployment Guide

## 📋 **Overview**

This guide covers all aspects of deploying PyMastery to production, including local development, staging, and production environments.

## 🏗️ **Deployment Architecture**

### **Production Stack**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx       │    │   Frontend     │    │    Backend     │
│  (Load Balancer)│────│   (React)      │────│   (FastAPI)    │
│   Port: 80/443 │    │  Port: 3000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │     MongoDB    │
                       │   Port: 27017 │
                       └─────────────────┘
```

## 🚀 **Quick Deployment Options**

### **Option 1: Docker Compose (Recommended)**
```bash
# Clone the repository
git clone <repository-url>
cd PyMastery

# Configure environment
cp config/environments/.env.example config/environments/.env
# Edit .env with your configuration

# Deploy
docker-compose -f config/docker/docker-compose.production.yml up -d
```

### **Option 2: Manual Deployment**
```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd frontend
npm install
npm run build
npm run preview
```

## 🔧 **Environment Configuration**

### **Production Environment Variables**
```bash
# Application
NODE_ENV=production
PORT=8000
HOST=0.0.0.0

# Database
MONGODB_URL=mongodb://localhost:27017/pymastery
MONGODB_DB_NAME=pymastery

# Security
JWT_SECRET=your_super_secure_jwt_secret_key_here
ENCRYPTION_KEY=your_32_character_encryption_key_here
CORS_ORIGINS=https://yourdomain.com

# API Keys
OPENAI_API_KEY=sk-your-openai-api-key-here
JUDGE0_API_KEY=your-judge0-api-key-here

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn-here
LOG_LEVEL=INFO
```

## 🐳 **Docker Deployment**

### **Production Docker Compose**
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - VITE_API_URL=http://backend:8000
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongo:27017/pymastery
    env_file:
      - ./config/environments/.env
    depends_on:
      - mongo
      - redis
    restart: unless-stopped

  mongo:
    image: mongo:5.0
    volumes:
      - mongo_data:/data/db
      - ./config/mongodb/mongod.conf:/etc/mongod.conf
    restart: unless-stopped

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
```

## 🔍 **Health Checks**

### **Application Health**
```bash
# Check application health
curl https://yourdomain.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-03-19T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ai": "available"
  }
}
```

## 📊 **Monitoring**

### **Application Monitoring**
```bash
# Access monitoring dashboard
curl https://yourdomain.com/api/monitoring/metrics

# Check error logs
docker-compose -f config/docker/docker-compose.production.yml logs backend | grep ERROR
```

## 🔒 **Security**

### **Production Security Checklist**
- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Database authentication enabled
- [ ] API rate limiting configured
- [ ] Security headers set
- [ ] Log rotation configured
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured

---

**🚀 PyMastery - Ready for Production Deployment!**

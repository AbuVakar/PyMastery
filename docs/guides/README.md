# PyMastery Setup & Configuration Guides

This directory contains comprehensive setup guides and configuration documentation for the PyMastery platform.

## 📚 Guide Categories

### 🔑 API Setup Guides
- `API_KEYS_SETUP_GUIDE.md` - Complete API key setup instructions
- `GET_REAL_API_KEY.md` - How to obtain real API keys
- `JUDGE0_SETUP_GUIDE.md` - Code execution engine setup

### 🚀 Deployment Guides
- `DEPLOYMENT.md` - General deployment instructions
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Production-specific deployment
- `MONGODB_SETUP.md` - MongoDB database setup and configuration

### 📖 Documentation Guides
- `README_DOCUMENTATION.md` - Documentation structure and usage
- `PROJECT_STRUCTURE.md` - Project architecture explanation
- `API.md` - Complete API reference

### 🔒 Security Guides
- `AUTHENTICATION_GUIDE.md` - Authentication system setup
- `SSL_TLS_SETUP.md` - SSL/TLS configuration

### 🌐 Frontend Guides
- `PWA_GUIDE.md` - Progressive Web App setup
- `FRONTEND_BUILD_GUIDE.md` - Frontend build and deployment

## 🎯 Quick Start

### For Development
```bash
# 1. Clone and setup
git clone <repository-url>
cd PyMastery

# 2. Follow API setup guide
cp docs/guides/API_KEYS_SETUP_GUIDE.md ./API_SETUP.md

# 3. Setup MongoDB
cp docs/guides/MONGODB_SETUP.md ./MONGODB_SETUP.md

# 4. Start development
docker-compose -f config/docker/docker-compose.development.yml up
```

### For Production
```bash
# 1. Follow production deployment guide
cp docs/guides/PRODUCTION_DEPLOYMENT_GUIDE.md ./DEPLOY.md

# 2. Setup security
cp docs/guides/AUTHENTICATION_GUIDE.md ./AUTH.md

# 3. Deploy
docker-compose -f config/docker/docker-compose.production.yml up -d
```

## 🔧 Configuration Files

### Environment Variables
- `.env.example` - Template for environment configuration
- `.env.production` - Production environment template

### Docker Configuration
- `config/docker/` - Docker compose files for different environments
- `Dockerfile` - Application container configuration

### Security Configuration
- `config/ssl/` - SSL certificate storage
- `config/nginx/` - Nginx configuration

## 📋 Prerequisites

### Required Software
- **Python 3.9+** - Backend runtime
- **Node.js 16+** - Frontend build tools
- **MongoDB 5.0+** - Database
- **Docker & Docker Compose** - Containerization
- **Git** - Version control

### Optional Services
- **Redis** - Caching and session storage
- **Nginx** - Reverse proxy and load balancing
- **SSL Certificates** - HTTPS security

## 🌍 Environment Setup

### Development Environment
- Local database setup
- Debug configuration
- Hot reload enabled
- Development tools

### Production Environment
- Containerized deployment
- Security hardening
- Performance optimization
- Monitoring setup

### Testing Environment
- Isolated test database
- Automated testing suite
- CI/CD integration
- Performance testing

## 🔗 Related Documentation

- **Main Documentation**: `../README.md`
- **Project Reports**: `../reports/`
- **API Reference**: `../API.md`
- **Project Structure**: `../PROJECT_STRUCTURE.md`

## 📞 Support

For setup issues:
1. Check the relevant guide in this directory
2. Review `../reports/` for known issues
3. Check the main `README.md` for current status
4. Review troubleshooting sections in individual guides

## ⚠️ Important Notes

- Always use `.env.example` as a template
- Never commit actual API keys or secrets
- Follow security best practices in production
- Keep dependencies updated regularly
- Test in development before production deployment

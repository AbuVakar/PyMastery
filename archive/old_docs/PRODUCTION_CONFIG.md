# PyMastery Production Configuration Guide

## Table of Contents
1. [Overview](#overview)
2. [Environment Setup](#environment-setup)
3. [Configuration Files](#configuration-files)
4. [Security Configuration](#security-configuration)
5. [Database Configuration](#database-configuration)
6. [Email Configuration](#email-configuration)
7. [Third-Party Integrations](#third-party-integrations)
8. [Deployment Configuration](#deployment-configuration)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Security Best Practices](#security-best-practices)
11. [Troubleshooting](#troubleshooting)

## Overview

This guide provides comprehensive instructions for setting up PyMastery in a production environment with proper security, monitoring, and operational configurations.

## Environment Setup

### Prerequisites

- Python 3.9+
- MongoDB 5.0+
- Redis 6.0+
- Node.js 16+ (for frontend)
- Docker and Docker Compose (optional)

### Environment Files

PyMastery uses multiple environment configuration files:

- `.env.production` - Production configuration
- `.env.development` - Development configuration  
- `.env.secrets` - Sensitive secrets and credentials
- `.env.example` - Template with all available options

### Quick Setup

1. **Copy the template files:**
```bash
cp .env.example .env.production
cp .env.example .env.development
cp .env.example .env.secrets
```

2. **Generate secure secrets:**
```bash
# Generate secret key
openssl rand -base64 32

# Generate encryption keys
openssl rand -hex 32
```

3. **Update configuration files with your values**

## Configuration Files

### .env.production

Production environment configuration with security-hardened settings:

```bash
# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=https://pymastery.com

# Security
SECRET_KEY=your-secure-secret-key-here
ALLOWED_ORIGINS=https://pymastery.com,https://www.pymastery.com
RATE_LIMIT_PER_MINUTE=60

# Database
MONGODB_URL=mongodb://username:password@mongodb-cluster:27017/pymastery?authSource=admin
REDIS_URL=redis://redis-cluster:6379/0

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@pymastery.com
SMTP_PASSWORD=your-app-password
```

### .env.development

Development environment with relaxed security and debugging enabled:

```bash
# Application
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:5173

# Security
SECRET_KEY=dev-secret-key-for-development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
RATE_LIMIT_PER_MINUTE=1000

# Database
MONGODB_URL=mongodb://localhost:27017/pymastery_dev
REDIS_URL=redis://localhost:6379/0

# Email (use MailHog for testing)
SMTP_SERVER=localhost
SMTP_PORT=1025
```

### .env.secrets

Contains all sensitive information that should never be committed:

```bash
# Critical Security Secrets
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Database Credentials
MONGODB_URL=mongodb://username:password@localhost:27017/pymastery
REDIS_PASSWORD=your-redis-password

# API Keys
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
```

## Security Configuration

### JWT Configuration

```python
# Security settings
SECRET_KEY=your-super-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Token validation
JWT_BLACKLIST_ENABLED=true
JWT_REFRESH_TOKEN_ROTATION=true
```

### CORS Configuration

```python
# Production CORS
ALLOWED_ORIGINS=https://pymastery.com,https://www.pymastery.com,https://admin.pymastery.com
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=*

# Development CORS
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Rate Limiting

```python
# Rate limiting configuration
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=10

# Advanced rate limiting
RATE_LIMIT_AUTHENTICATED=100
RATE_LIMIT_ANONYMOUS=20
RATE_LIMIT_UPLOAD=10
```

## Database Configuration

### MongoDB Setup

```bash
# Production MongoDB
MONGODB_URL=mongodb://username:password@mongodb-cluster:27017/pymastery?authSource=admin
DATABASE_NAME=pymastery
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=5
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000

# Development MongoDB
MONGODB_URL=mongodb://localhost:27017/pymastery_dev
DATABASE_NAME=pymastery_dev
```

### MongoDB Security

```bash
# Security settings
MONGODB_SSL=true
MONGODB_SSL_CERT_FILE=/path/to/cert.pem
MONGODB_SSL_KEY_FILE=/path/to/key.pem
MONGODB_SSL_CA_FILE=/path/to/ca.pem

# Authentication
MONGODB_AUTH_SOURCE=admin
MONGODB_AUTH_MECHANISM=SCRAM-SHA-256
```

### Redis Configuration

```bash
# Production Redis
REDIS_URL=redis://redis-cluster:6379/0
REDIS_PASSWORD=your-redis-password
REDIS_MAX_CONNECTIONS=20
REDIS_DB=0

# Development Redis
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=
REDIS_DB=0
```

### Database Backups

```bash
# Backup configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=pymastery-backups
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key
```

## Email Configuration

### SMTP Setup

```bash
# Gmail (Recommended for small scale)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@pymastery.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true

# Outlook/Exchange
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your-email@pymastery.com
SMTP_PASSWORD=your-password
SMTP_USE_TLS=true

# Custom SMTP
SMTP_SERVER=smtp.your-provider.com
SMTP_PORT=587
SMTP_USERNAME=your-email@pymastery.com
SMTP_PASSWORD=your-password
SMTP_USE_TLS=true
```

### Email Templates

```bash
# Email configuration
FROM_EMAIL=noreply@pymastery.com
FROM_NAME=PyMastery Team
REPLY_EMAIL=support@pymastery.com
EMAIL_TEMPLATE_DIR=templates/emails
EMAIL_LOGO_URL=https://pymastery.com/logo.png
```

### Email Testing

For development, use MailHog to capture emails:

```bash
# Install MailHog
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Development email config
SMTP_SERVER=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
```

## Third-Party Integrations

### Judge0 Code Execution

```bash
# RapidAPI setup
JUDGE0_API_KEY=your-rapidapi-key-here
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com/submissions
JUDGE0_HOST=judge0-ce.p.rapidapi.com

# Execution limits
DEFAULT_CPU_TIME_LIMIT=5
DEFAULT_MEMORY_LIMIT=128
MAX_CPU_TIME_LIMIT=30
MAX_MEMORY_LIMIT=1024
```

### AI/ML Services

```bash
# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2048
OPENAI_TEMPERATURE=0.7

# Hugging Face (Optional)
HUGGINGFACE_API_KEY=your-huggingface-api-key
HUGGINGFACE_MODEL=codeparrot
```

### Payment Processing

```bash
# Stripe (Production)
STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# Stripe (Test)
STRIPE_PUBLIC_KEY=pk_test_your-stripe-test-public-key
STRIPE_SECRET_KEY=sk_test_your-stripe-test-secret-key
```

### Social Login

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://pymastery.com/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://pymastery.com/auth/github/callback
```

## Deployment Configuration

### Docker Configuration

Create `docker-compose.production.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    env_file:
      - .env.production
      - .env.secrets
    ports:
      - "8000:8000"
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  mongodb:
    image: mongo:5.0
    env_file:
      - .env.secrets
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:6.2-alpine
    env_file:
      - .env.secrets
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

### Environment-Specific Settings

```bash
# Production environment
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=INFO

# Staging environment
APP_ENV=staging
APP_DEBUG=false
LOG_LEVEL=DEBUG

# Development environment
APP_ENV=development
APP_DEBUG=true
LOG_LEVEL=DEBUG
```

### SSL/TLS Configuration

```bash
# SSL settings
SSL_CERTIFICATE_PATH=/path/to/ssl/cert.pem
SSL_PRIVATE_KEY_PATH=/path/to/ssl/private.key
SSL_PROTOCOLS=TLSv1.2,TLSv1.3
SSL_CIPHERS=ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256
```

## Monitoring and Logging

### Logging Configuration

```bash
# Logging settings
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10485760  # 10MB
LOG_BACKUP_COUNT=5

# External logging
SENTRY_DSN=https://your-sentry-dsn-here
LOGTAIL_TOKEN=your-logtail-token-here
```

### Monitoring Setup

```bash
# Health check configuration
HEALTH_CHECK_INTERVAL=30
HEALTH_CHECK_TIMEOUT=5

# Metrics configuration
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PATH=/metrics

# Profiling
PROFILING_ENABLED=false
PROFILING_SAMPLE_RATE=0.1
```

### Application Performance Monitoring

```python
# APM Configuration
APM_SERVICE_NAME=pymastery
APM_ENVIRONMENT=production
APM_SAMPLE_RATE=0.1
APM_CAPTURE_HEADERS=true
APM_CAPTURE_BODY=errors
```

## Security Best Practices

### Secret Management

1. **Never commit secrets to version control**
2. **Use environment-specific secrets**
3. **Rotate secrets regularly**
4. **Use strong, unique passwords**
5. **Store secrets in secure vaults**

### Environment Variable Security

```bash
# Secure .env.secrets file
chmod 600 .env.secrets

# Add to .gitignore
echo ".env.secrets" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.development" >> .gitignore
```

### Database Security

```bash
# Use SSL/TLS connections
MONGODB_SSL=true
REDIS_SSL=true

# Use authentication
MONGODB_AUTH_SOURCE=admin
REDIS_PASSWORD=your-redis-password

# Network security
MONGODB_BIND_IP=127.0.0.1
REDIS_BIND_IP=127.0.0.1
```

### API Security

```bash
# Security headers
SECURITY_HSTS_ENABLED=true
SECURITY_CSP_ENABLED=true
SECURITY_XFRAME_ENABLED=true

# Rate limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=10

# Input validation
INPUT_SANITIZATION_ENABLED=true
XSS_PROTECTION_ENABLED=true
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check MongoDB connection
mongosh "mongodb://username:password@localhost:27017/pymastery"

# Check Redis connection
redis-cli ping
```

#### Email Issues

```bash
# Test SMTP connection
python -c "
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login('your-email@gmail.com', 'your-password')
print('SMTP connection successful')
"
```

#### Environment Variable Issues

```bash
# Check environment variables
env | grep -E "(APP_|MONGODB_|REDIS_|SMTP_)"

# Load environment file
set -a
source .env.production
set +a
```

### Debug Mode

```bash
# Enable debug mode temporarily
APP_DEBUG=true
LOG_LEVEL=DEBUG

# Check application logs
tail -f logs/app.log
```

### Performance Issues

```bash
# Check database performance
mongostat --host localhost:27017

# Check Redis performance
redis-cli info stats

# Check system resources
top
htop
df -h
```

### Security Issues

```bash
# Check for exposed secrets
grep -r "password\|secret\|key" --include="*.py" --include="*.js" --include="*.env*" .

# Check file permissions
ls -la .env*

# Check SSL certificates
openssl s_client -connect pymastery.com:443
```

## Deployment Checklist

### Pre-Deployment

- [ ] All secrets are strong and unique
- [ ] Environment variables are properly set
- [ ] Database connections are tested
- [ ] Email configuration is tested
- [ ] SSL certificates are valid
- [ ] Rate limiting is configured
- [ ] Logging is configured
- [ ] Monitoring is set up

### Post-Deployment

- [ ] Application is running correctly
- [ ] Database connections are stable
- [ ] Email sending is working
- [ ] Authentication is working
- [ ] API endpoints are responding
- [ ] Health checks are passing
- [ ] Logs are being generated
- [ ] Metrics are being collected

### Ongoing Maintenance

- [ ] Monitor system performance
- [ ] Check for security updates
- [ ] Rotate secrets regularly
- [ ] Backup data regularly
- [ ] Review logs for issues
- [ ] Update dependencies
- [ ] Test disaster recovery

## Support

For configuration issues:

1. **Check the logs**: `logs/app.log`
2. **Verify environment variables**: `env | grep APP_`
3. **Test database connections**: MongoDB and Redis
4. **Validate email configuration**: Test SMTP connection
5. **Review security settings**: Check SSL/TLS configuration

For additional support:
- Documentation: https://docs.pymastery.com
- Support: support@pymastery.com
- Issues: https://github.com/pymastery/issues

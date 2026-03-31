# 🚀 PyMastery Deployment Guide

## Overview

This guide covers deploying PyMastery in various environments with best practices for security, performance, and scalability.

---

## 📋 Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **Memory**: 4GB RAM
- **Storage**: 20GB SSD
- **Network**: 100 Mbps
- **OS**: Linux (Ubuntu 20.04+), macOS, Windows 10+

#### Recommended Requirements
- **CPU**: 4+ cores
- **Memory**: 8GB+ RAM
- **Storage**: 50GB+ SSD
- **Network**: 1 Gbps
- **OS**: Ubuntu 22.04 LTS

### Software Dependencies

#### Required Software
```bash
# Python 3.11+
python3 --version

# Node.js 18+
node --version
npm --version

# MongoDB 6.0+
mongod --version

# Redis 6.0+ (optional, for caching)
redis-server --version

# Docker & Docker Compose (optional)
docker --version
docker-compose --version
```

#### Development Tools
```bash
# Git
git --version

# Make
make --version

# Curl
curl --version
```

---

## 🔧 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/pymastery.git
cd pymastery
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

---

## 🗄️ Database Setup

### MongoDB Installation

#### Ubuntu/Debian
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community@6.0

# Start MongoDB
brew services start mongodb/brew/mongodb-community
```

#### Windows
```bash
# Download and install MongoDB Community Server
# https://www.mongodb.com/try/download/community

# Start MongoDB as service
net start MongoDB
```

### Database Configuration
```bash
# Connect to MongoDB
mongosh

# Create database and user
use pymastery
db.createUser({
  user: "pymastery_user",
  pwd: "your_secure_password",
  roles: [
    { role: "readWrite", db: "pymastery" }
  ]
})

# Create collections (optional, will be created automatically)
db.createCollection("users")
db.createCollection("code_executions")
db.createCollection("audit_logs")
```

### Redis Installation (Optional)
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
sudo systemctl start redis-server  # Linux
brew services start redis            # macOS
```

---

## 🚀 Deployment Options

### Option 1: Development Deployment

#### Backend Development Server
```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Run development server
python main.py

# Or with uvicorn for better performance
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Development Server
```bash
cd frontend

# Run development server
npm run dev

# Or with specific port
npm run dev -- --port 3000
```

#### Environment Configuration
```bash
# .env (Backend)
ENVIRONMENT=development
DEBUG=true
MONGODB_URL=mongodb://localhost:27017/pymastery_dev
JWT_SECRET_KEY=dev-jwt-secret-key-32-chars
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_ENABLED=false
```

```bash
# .env.local (Frontend)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### Option 2: Production Deployment with Docker

#### Docker Compose Setup
```bash
# Create production environment file
cp .env.example .env.production

# Edit production variables
nano .env.production
```

#### Production Docker Compose
```yaml
# docker-compose.production.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: pymastery_mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DATABASE}
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "27017:27017"
    networks:
      - pymastery_network

  redis:
    image: redis:7-alpine
    container_name: pymastery_redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - pymastery_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.production
    container_name: pymastery_backend
    restart: unless-stopped
    environment:
      - ENVIRONMENT=production
      - MONGODB_URL=mongodb://mongodb:27017/${MONGO_DATABASE}
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - JUDGE0_API_KEY=${JUDGE0_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    ports:
      - "8000:8000"
    depends_on:
      - mongodb
      - redis
    networks:
      - pymastery_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.production
    container_name: pymastery_frontend
    restart: unless-stopped
    environment:
      - VITE_API_URL=http://localhost:8000
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - pymastery_network

  nginx:
    image: nginx:alpine
    container_name: pymastery_nginx
    restart: unless-stopped
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    networks:
      - pymastery_network

volumes:
  mongodb_data:
  redis_data:

networks:
  pymastery_network:
    driver: bridge
```

#### Production Dockerfile (Backend)
```dockerfile
# backend/Dockerfile.production
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash pymastery
RUN chown -R pymastery:pymastery /app
USER pymastery

# Create necessary directories
RUN mkdir -p logs uploads

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Production Dockerfile (Frontend)
```dockerfile
# frontend/Dockerfile.production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Deploy with Docker Compose
```bash
# Build and start services
docker-compose -f docker-compose.production.yml up -d --build

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop services
docker-compose -f docker-compose.production.yml down

# Scale services
docker-compose -f docker-compose.production.yml up -d --scale backend=3
```

### Option 3: Kubernetes Deployment

#### Kubernetes Manifests
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: pymastery
---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pymastery-config
  namespace: pymastery
data:
  ENVIRONMENT: "production"
  DEBUG: "false"
  MONGODB_URL: "mongodb://mongodb-service:27017/pymastery"
  REDIS_URL: "redis://redis-service:6379/0"
---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: pymastery-secrets
  namespace: pymastery
type: Opaque
data:
  JWT_SECRET_KEY: <base64-encoded-secret>
  JUDGE0_API_KEY: <base64-encoded-key>
  OPENAI_API_KEY: <base64-encoded-key>
---
# k8s/mongodb-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: pymastery
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:6.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: pymastery-secrets
              key: MONGO_ROOT_USERNAME
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: pymastery-secrets
              key: MONGO_ROOT_PASSWORD
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
      volumes:
      - name: mongodb-storage
        persistentVolumeClaim:
          claimName: mongodb-pvc
---
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: pymastery
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: pymastery/backend:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: pymastery-config
        - secretRef:
            name: pymastery-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: pymastery
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pymastery-ingress
  namespace: pymastery
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - pymastery.com
    - api.pymastery.com
    secretName: pymastery-tls
  rules:
  - host: pymastery.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: api.pymastery.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
```

#### Deploy to Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n pymastery
kubectl get services -n pymastery
kubectl get ingress -n pymastery

# View logs
kubectl logs -f deployment/backend -n pymastery

# Scale deployment
kubectl scale deployment backend --replicas=5 -n pymastery
```

---

## 🔒 Security Configuration

### SSL/TLS Setup

#### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d pymastery.com -d api.pymastery.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Manual SSL Certificate
```bash
# Generate private key
openssl genrsa -out private.key 4096

# Generate certificate signing request
openssl req -new -key private.key -out certificate.csr

# Generate self-signed certificate (for development)
openssl x509 -req -days 365 -in certificate.csr -signkey private.key -out certificate.crt
```

### Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 27017/tcp  # MongoDB (internal only)
sudo ufw allow 6379/tcp   # Redis (internal only)

# iptables (alternative)
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -j DROP
```

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/pymastery
server {
    listen 80;
    server_name pymastery.com www.pymastery.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pymastery.com www.pymastery.com;

    ssl_certificate /etc/ssl/certs/pymastery.crt;
    ssl_certificate_key /etc/ssl/private/pymastery.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
        limit_req zone=api burst=20 nodelay;
    }
}

# API subdomain
server {
    listen 443 ssl http2;
    server_name api.pymastery.com;

    ssl_certificate /etc/ssl/certs/api.pymastery.crt;
    ssl_certificate_key /etc/ssl/private/api.pymastery.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Monitoring & Logging

### Application Monitoring
```bash
# Install monitoring tools
pip install prometheus-client grafana-api

# Enable Prometheus metrics
# Add to .env:
METRICS_ENABLED=true
METRICS_PORT=9090
```

### Log Management
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/pymastery

# Content:
/var/log/pymastery/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload pymastery
    endscript
}
```

### Health Checks
```bash
# Create health check script
#!/bin/bash
# health_check.sh

# Check backend health
curl -f http://localhost:8000/api/health || exit 1

# Check database connection
mongosh --eval "db.adminCommand('ping')" || exit 1

# Check Redis connection
redis-cli ping || exit 1

echo "All services healthy"
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    - name: Run tests
      run: |
        cd backend
        pytest tests/ -v --cov=app

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build Docker images
      run: |
        docker build -t pymastery/backend:${{ github.sha }} ./backend
        docker build -t pymastery/frontend:${{ github.sha }} ./frontend
    - name: Push to registry
      run: |
        docker push pymastery/backend:${{ github.sha }}
        docker push pymastery/frontend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to production
      run: |
        # SSH into server and deploy
        ssh user@server "
          docker pull pymastery/backend:${{ github.sha }}
          docker pull pymastery/frontend:${{ github.sha }}
          docker-compose -f docker-compose.production.yml up -d
        "
```

---

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh --host localhost --port 27017
```

#### Backend Issues
```bash
# Check backend logs
docker logs pymastery_backend

# Check environment variables
docker exec pymastery_backend env | grep -E "(MONGODB|REDIS|JWT)"

# Restart backend
docker restart pymastery_backend
```

#### Frontend Issues
```bash
# Check frontend logs
docker logs pymastery_frontend

# Check Nginx configuration
nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Performance Issues
```bash
# Check system resources
htop
df -h
free -h

# Check network
netstat -tulpn | grep :8000

# Monitor Docker containers
docker stats
```

### Debug Mode
```bash
# Enable debug mode
export DEBUG=true
export LOG_LEVEL=DEBUG

# Run with verbose logging
python main.py --log-level DEBUG
```

---

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose -f docker-compose.production.yml up -d --scale backend=5

# Kubernetes scaling
kubectl scale deployment backend --replicas=10 -n pymastery
```

### Vertical Scaling
```bash
# Update resource limits
kubectl patch deployment backend -n pymastery -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}'
```

### Database Scaling
```bash
# Enable replica set
mongosh --eval "
rs.initiate({
  _id: 'pymastery-rs',
  members: [
    { _id: 0, host: 'mongodb1:27017' },
    { _id: 1, host: 'mongodb2:27017' },
    { _id: 2, host: 'mongodb3:27017' }
  ]
})
"
```

---

## 🔧 Maintenance

### Backup Strategy
```bash
# Database backup
mongodump --host localhost --port 27017 --db pymastery --out /backup/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
# backup.sh
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup database
mongodump --host localhost --port 27017 --db pymastery --out $BACKUP_DIR

# Backup uploads
tar -czf $BACKUP_DIR/uploads.tar.gz /app/uploads

# Cleanup old backups (keep 30 days)
find /backup -type d -mtime +30 -exec rm -rf {} \;
```

### Update Process
```bash
# Update application
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Verify deployment
curl -f http://localhost:8000/api/health
```

---

## 📞 Support

### Getting Help
- **Documentation**: https://docs.pymastery.com
- **Issues**: https://github.com/your-org/pymastery/issues
- **Community**: https://community.pymastery.com
- **Email**: support@pymastery.com

### Emergency Contacts
- **24/7 Support**: +1-555-PYMASTERY
- **Security Issues**: security@pymastery.com
- **Status Page**: https://status.pymastery.com

---

**Last Updated**: March 17, 2024
**Version**: 1.0.0

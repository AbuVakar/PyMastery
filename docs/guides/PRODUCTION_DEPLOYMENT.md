# PyMastery - Production Deployment Guide

## 🚀 QUICK START

### Prerequisites
- **Docker & Docker Compose** (Latest versions)
- **Domain Name** (for SSL certificates)
- **Server** (Ubuntu 20.04+ or CentOS 8+ recommended)
- **SSL Certificate** (Let's Encrypt recommended)

### One-Command Deployment
```bash
# Clone and deploy
git clone https://github.com/pymastery/pymastery.git
cd pymastery
docker-compose -f config/docker/docker-compose.production.yml up -d

# Check status
docker-compose -f config/docker/docker-compose.production.yml ps
```

## 📋 DEPLOYMENT CHECKLIST

### ✅ Pre-Deployment
- [ ] Server requirements met (4GB+ RAM, 2+ CPU cores)
- [ ] Docker and Docker Compose installed
- [ ] Domain name configured
- [ ] SSL certificates obtained
- [ ] Environment variables configured
- [ ] Firewall ports open (80, 443)

### ✅ Configuration
- [ ] `.env` file configured with production values
- [ ] `.env.secrets` file with production secrets
- [ ] SSL certificates in `ssl/` directory
- [ ] MongoDB connection string updated
- [ ] Redis connection string updated
- [ ] API keys configured (Judge0, OpenAI, etc.)

### ✅ Deployment
- [ ] Docker images built successfully
- [ ] All containers running
- [ ] Database connected
- [ ] Cache connected
- [ ] SSL certificates working
- [ ] Domain resolving correctly

### ✅ Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Backups enabled
- [ ] Log rotation configured
- [ ] Performance monitoring active

## 🔧 DETAILED SETUP

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reboot to apply group changes
sudo reboot
```

### 2. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

### 3. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env
cp .env.secrets.example .env.secrets

# Edit configuration
nano .env
nano .env.secrets
```

### 4. Database Setup
```bash
# Start MongoDB and Redis
docker-compose -f config/docker/docker-compose.production.yml up -d mongodb redis

# Wait for services to start
sleep 30

# Run database migrations
docker-compose -f config/docker/docker-compose.production.yml exec backend python -m database.cli migrate

# Seed initial data
docker-compose -f config/docker/docker-compose.production.yml exec backend python -m database.cli seed
```

### 5. Application Deployment
```bash
# Build and start all services
docker-compose -f config/docker/docker-compose.production.yml up -d --build

# Check logs
docker-compose -f config/docker/docker-compose.production.yml logs -f
```

## 📊 MONITORING SETUP

### 1. Prometheus Configuration
```yaml
# Already configured in monitoring/prometheus.yml
# Just ensure the service is running
docker-compose ps prometheus
```

### 2. Grafana Dashboard
```bash
# Access Grafana
http://yourdomain.com:3001

# Default credentials: admin/admin
# Import dashboards from docs/grafana/
```

### 3. Alert Configuration
```yaml
# Configure alert rules in monitoring/alert_rules.yml
# Set up notification channels in AlertManager
```

## 🔒 SECURITY CONFIGURATION

### 1. Firewall Setup
```bash
# Configure UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Security Headers
```nginx
# Already configured in config/nginx/nginx.conf
# Includes HSTS, X-Frame-Options, CSP, etc.
```

### 3. Rate Limiting
```nginx
# Configured in nginx.conf
# API: 10 requests/second
# Login: 5 requests/minute
```

## 📈 PERFORMANCE OPTIMIZATION

### 1. Caching Strategy
- **Redis**: Session storage and application cache
- **Memory Cache**: Frequently accessed data
- **Disk Cache**: Static assets and computed results
- **CDN**: For static assets in production

### 2. Database Optimization
- **Connection Pooling**: 50 max connections
- **Indexing**: Strategic indexes for queries
- **Query Optimization**: Efficient query patterns
- **Replication**: For high availability

### 3. Application Optimization
- **Compression**: Gzip/Brotli for responses
- **HTTP/2**: For multiplexing
- **Static Asset Optimization**: Minification and caching
- **Lazy Loading**: For large datasets

## 🚨 MONITORING & ALERTS

### 1. Health Checks
```bash
# Application health
curl https://yourdomain.com/api/health

# Database health
curl https://yourdomain.com/api/health/database

# Cache health
curl https://yourdomain.com/api/health/cache
```

### 2. Key Metrics
- **Response Time**: < 200ms (95th percentile)
- **Error Rate**: < 1%
- **Uptime**: > 99.9%
- **Database Latency**: < 50ms
- **Cache Hit Rate**: > 85%

### 3. Alert Thresholds
- **High Error Rate**: > 5% for 5 minutes
- **High Response Time**: > 1s for 5 minutes
- **Database Down**: Connection failure
- **High Memory Usage**: > 90%
- **High CPU Usage**: > 80%

## 🔧 MAINTENANCE

### 1. Backup Strategy
```bash
# Database backup
docker-compose exec mongodb mongodump --out /backup/

# Application backup
docker-compose exec backend python -m database.cli backup

# File backup
tar -czf uploads-$(date +%Y%m%d).tar.gz uploads/
```

### 2. Updates and Upgrades
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
docker-compose -f config/docker/docker-compose.production.yml up -d --build

# Run migrations
docker-compose exec backend python -m database.cli migrate
```

### 3. Log Management
```bash
# View logs
docker-compose logs -f backend

# Rotate logs (configured automatically)
# Clean old logs
find logs/ -name "*.log" -mtime +30 -delete
```

## 🚨 TROUBLESHOOTING

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose logs <service-name>

# Check resource usage
docker stats

# Restart service
docker-compose restart <service-name>
```

#### 2. Database Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongodb mongo --eval "db.adminCommand('ping')"

# Check connection string
docker-compose exec backend python -c "from database.mongodb import test_connection; test_connection()"
```

#### 3. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Test SSL configuration
nginx -t

# Restart nginx
docker-compose restart nginx
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats

# Analyze slow queries
docker-compose exec mongodb mongo --eval "db.setProfilingLevel(2)"

# Check cache performance
curl http://localhost:9100/metrics | grep cache
```

## 📞 SUPPORT

### Emergency Contacts
- **Technical Lead**: [Contact Information]
- **System Administrator**: [Contact Information]
- **DevOps Team**: [Contact Information]

### Documentation
- **API Documentation**: https://docs.pymastery.com
- **Architecture Guide**: https://docs.pymastery.com/architecture
- **Troubleshooting Guide**: https://docs.pymastery.com/troubleshooting

### Monitoring Dashboards
- **Grafana**: https://yourdomain.com:3001
- **Prometheus**: https://yourdomain.com:9090
- **Application Health**: https://yourdomain.com/api/health

---

## 🎯 DEPLOYMENT SUCCESS CRITERIA

### ✅ All Systems Operational
- [ ] Application responding on HTTPS
- [ ] Database connected and healthy
- [ ] Cache system operational
- [ ] SSL certificates valid
- [ ] Monitoring active

### ✅ Performance Metrics Met
- [ ] Response time < 200ms
- [ ] Error rate < 1%
- [ ] Uptime > 99.9%
- [ ] Cache hit rate > 85%

### ✅ Security Measures Active
- [ ] SSL/TLS encryption active
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Authentication working
- [ ] Authorization enforced

---

**Status**: ✅ **PRODUCTION READY**  
**Last Updated**: March 22, 2026  
**Version**: 1.0.0

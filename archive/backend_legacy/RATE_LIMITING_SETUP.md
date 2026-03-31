# Advanced Rate Limiting Setup Guide

## Overview

PyMastery includes a comprehensive advanced rate limiting system that provides sophisticated protection against abuse, DDoS attacks, and unfair resource usage. The system supports multiple strategies, scopes, and actions with real-time monitoring and analytics.

## Features

### 🚀 Core Features
- **Multiple Rate Limiting Strategies**: Fixed window, sliding window, token bucket, leaky bucket, adaptive
- **Flexible Scopes**: Global, IP, user, endpoint, and combination scopes
- **Actions on Limit Exceeded**: Reject, delay, throttle, queue
- **Storage Backends**: In-memory and Redis support
- **Real-time Analytics**: Comprehensive monitoring and statistics
- **Smart Features**: Adaptive rate limiting with anomaly detection
- **Alert System**: Configurable alerts with webhook and email notifications

### 🛡️ Security Features
- **IP Whitelisting**: Trusted IP bypass
- **User Whitelisting**: Premium user bypass
- **Burst Handling**: Temporary burst allowances
- **Adaptive Penalties**: Dynamic penalty factors
- **Auto-blocking**: Automatic IP blocking on repeated violations
- **Request Filtering**: Method and endpoint-based filtering

## Quick Start

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORAGE=memory                    # or "redis"
RATE_LIMIT_REDIS_URL=redis://localhost:6379/2

# Skip Paths and Methods
RATE_LIMIT_SKIP_PATHS=/health,/metrics,/favicon.ico,/static,/docs
RATE_LIMIT_SKIP_METHODS=OPTIONS,HEAD

# Whitelisting
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,::1
RATE_LIMIT_WHITELIST_USERS=admin_user,premium_user

# Response Configuration
RATE_LIMIT_INCLUDE_HEADERS=true
RATE_LIMIT_LOG_VIOLATIONS=true
RATE_LIMIT_BLOCK_MESSAGE="Rate limit exceeded. Please try again later."

# Auto-blocking Configuration
RATE_LIMIT_AUTO_BLOCK_THRESHOLD=50
RATE_LIMIT_AUTO_BLOCK_DURATION=60

# Monitoring and Alerts
RATE_LIMIT_ANALYTICS_INTERVAL=60
RATE_LIMIT_ALERT_CHECK_INTERVAL=30
RATE_LIMIT_ALERT_WEBHOOK_URL=https://hooks.slack.com/your-webhook
RATE_LIMIT_ALERT_EMAILS=admin@example.com,ops@example.com

# Smart Features
RATE_LIMIT_ADAPTIVE_MODE=true
RATE_LIMIT_LEARNING_ENABLED=true
RATE_LIMIT_ANOMALY_DETECTION=true
RATE_LIMIT_ANOMALY_THRESHOLD=2.0
```

### 2. Redis Configuration (Optional)

For production environments, Redis is recommended for better performance and persistence:

```bash
# Install Redis
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                 # macOS

# Start Redis
sudo systemctl start redis-server
redis-server                        # macOS

# Verify Redis is running
redis-cli ping
```

### 3. Basic Usage

The rate limiting system is automatically integrated as middleware. Here's how to use it:

```python
from fastapi import FastAPI
from middleware.rate_limit_middleware import create_rate_limit_middleware
from services.rate_limit_service import get_rate_limit_service

app = FastAPI()

# Add rate limiting middleware
app.add_middleware(
    create_rate_limit_middleware,
    config={
        "enabled": True,
        "storage": {"type": "redis", "redis_url": "redis://localhost:6379/2"},
        "skip_paths": ["/health", "/metrics"],
        "whitelist_ips": ["127.0.0.1"],
        "auto_block_threshold": 50,
        "auto_block_duration": 60
    }
)

# Get rate limiting service for management
rate_limit_service = get_rate_limit_service()
```

## Configuration Options

### Storage Configuration

#### In-Memory Storage (Default)
```python
storage_config = {
    "type": "memory",
    "max_size": 10000,           # Maximum number of rate limit states
    "cleanup_interval": 300,      # Cleanup interval in seconds
    "ttl": 3600                  # Default TTL in seconds
}
```

#### Redis Storage (Recommended for Production)
```python
storage_config = {
    "type": "redis",
    "redis_url": "redis://localhost:6379/2",
    "key_prefix": "rate_limit:",
    "max_connections": 50,
    "retry_on_timeout": True,
    "socket_timeout": 5,
    "socket_connect_timeout": 5
}
```

### Rate Limiting Rules

The system comes with pre-configured default rules:

#### Global Rate Limits
```python
{
    "name": "global_requests",
    "strategy": "sliding_window",
    "scope": "global",
    "limit": 1000,
    "window": 3600,        # 1000 requests per hour globally
    "action": "reject"
}
```

#### IP-Based Rate Limits
```python
{
    "name": "ip_requests",
    "strategy": "sliding_window",
    "scope": "ip",
    "limit": 100,
    "window": 60,           # 100 requests per minute per IP
    "action": "reject",
    "burst_limit": 150,
    "burst_window": 10
}
```

#### User-Based Rate Limits
```python
{
    "name": "user_requests",
    "strategy": "token_bucket",
    "scope": "user",
    "limit": 200,
    "window": 3600,        # 200 requests per hour per user
    "action": "delay",
    "burst_limit": 50
}
```

#### Endpoint-Specific Rate Limits
```python
{
    "name": "api_auth_limits",
    "strategy": "fixed_window",
    "scope": "endpoint",
    "limit": 10,
    "window": 60,           # 10 auth requests per minute
    "endpoints": ["/api/auth/login", "/api/auth/register"],
    "methods": ["POST"],
    "action": "reject"
}
```

#### Adaptive Rate Limits
```python
{
    "name": "adaptive_abuse_detection",
    "strategy": "adaptive",
    "scope": "user_endpoint",
    "limit": 50,
    "window": 300,           # 5 minutes window
    "adaptive_threshold": 0.8,  # Trigger at 80% violation rate
    "penalty_factor": 2.0,
    "action": "throttle"
}
```

## API Endpoints

### Management Endpoints

#### Get Rate Limit Status
```bash
GET /api/rate-limit/status
```

Response:
```json
{
  "success": true,
  "data": {
    "total_requests": 15420,
    "blocked_requests": 342,
    "block_rate": 0.0222,
    "enabled_rules": 8,
    "service_status": {
      "is_running": true,
      "uptime_seconds": 86400,
      "analytics_entries": 1440
    }
  }
}
```

#### Get All Rules
```bash
GET /api/rate-limit/rules
```

#### Get Specific Rule
```bash
GET /api/rate-limit/rules/{rule_name}
```

#### Add New Rule
```bash
POST /api/rate-limit/rules
Content-Type: application/json

{
  "rule": {
    "name": "custom_api_limit",
    "strategy": "sliding_window",
    "scope": "endpoint",
    "limit": 50,
    "window": 300,
    "action": "reject",
    "endpoints": ["/api/custom/*"],
    "methods": ["POST", "PUT"],
    "priority": 50,
    "enabled": true,
    "burst_limit": 75,
    "penalty_factor": 1.5
  }
}
```

#### Update Rule
```bash
PUT /api/rate-limit/rules/{rule_name}
Content-Type: application/json

{
  "updates": {
    "limit": 75,
    "window": 600,
    "enabled": true
  }
}
```

#### Delete Rule
```bash
DELETE /api/rate-limit/rules/{rule_name}
```

### Analytics Endpoints

#### Get Analytics
```bash
GET /api/rate-limit/analytics?hours=24
```

#### Get Current Analytics
```bash
GET /api/rate-limit/current-analytics
```

### Management Endpoints

#### Reset User Limits
```bash
POST /api/rate-limit/reset-user
Content-Type: application/json

{
  "user_id": "user_123"
}
```

#### Reset IP Limits
```bash
POST /api/rate-limit/reset-ip
Content-Type: application/json

{
  "ip_address": "192.168.1.100"
}
```

#### Block IP Address
```bash
POST /api/rate-limit/block-ip
Content-Type: application/json

{
  "ip_address": "192.168.1.100",
  "duration_minutes": 60
}
```

#### Unblock IP Address
```bash
POST /api/rate-limit/unblock-ip
Content-Type: application/json

{
  "ip_address": "192.168.1.100"
}
```

#### Get Blocked IPs
```bash
GET /api/rate-limit/blocked-ips
```

### Alert Management

#### Get Alerts
```bash
GET /api/rate-limit/alerts
```

#### Add Alert
```bash
POST /api/rate-limit/alerts
Content-Type: application/json

{
  "alert": {
    "name": "high_block_rate_alert",
    "condition": "block_rate",
    "threshold": 0.1,
    "window_minutes": 5,
    "enabled": true,
    "webhook_url": "https://hooks.slack.com/alerts",
    "email_recipients": ["admin@example.com"],
    "cooldown_minutes": 60
  }
}
```

#### Delete Alert
```bash
DELETE /api/rate-limit/alerts/{alert_name}
```

### Configuration Management

#### Export Configuration
```bash
GET /api/rate-limit/export
```

#### Import Configuration
```bash
POST /api/rate-limit/import
Content-Type: application/json

{
  "config": {
    "rules": [...],
    "alerts": [...]
  }
}
```

## Advanced Configuration

### Smart Rate Limiting

Enable smart features for adaptive behavior:

```python
smart_config = {
    "adaptive_mode": True,           # Enable adaptive rate limiting
    "learning_enabled": True,         # Enable learning from patterns
    "anomaly_detection": True,       # Enable anomaly detection
    "anomaly_threshold": 2.0        # Anomaly detection threshold
}
```

### Custom Rate Limiting Strategies

Create custom strategies by extending the base class:

```python
from utils.advanced_rate_limiter import RateLimitStrategy

class CustomStrategy(RateLimitStrategy):
    CUSTOM = "custom"

# Implement custom logic in the rate limiter
```

### Complex Rule Configuration

Create sophisticated rules with multiple conditions:

```python
complex_rule = {
    "name": "premium_user_bypass",
    "strategy": "token_bucket",
    "scope": "user",
    "limit": 1000,
    "window": 3600,
    "action": "reject",
    "user_whitelist": ["premium_user_1", "premium_user_2"],
    "ip_whitelist": ["192.168.1.0/24"],
    "endpoints": ["*"],  # All endpoints
    "methods": ["*"],     # All methods
    "burst_limit": 200,
    "burst_window": 60,
    "penalty_factor": 0.5,  # Reduce penalty for premium users
    "metadata": {
        "description": "Premium users get higher limits",
        "tier": "premium"
    }
}
```

## Monitoring and Analytics

### Real-time Monitoring

The system provides comprehensive real-time monitoring:

```python
# Get current statistics
stats = await rate_limit_service.get_statistics()

# Get recent analytics
analytics = await rate_limit_service.get_analytics(hours=24)

# Get current snapshot
current = await rate_limit_service.get_current_analytics()
```

### Performance Metrics

Track key performance indicators:

```json
{
  "performance_metrics": {
    "total_requests": 15420,
    "blocked_requests": 342,
    "block_rate": 0.0222,
    "average_response_time": 0.045,
    "p95_response_time": 0.089,
    "memory_usage": "45.2MB",
    "active_rules": 8,
    "top_violating_ips": [
      {"ip": "192.168.1.100", "violations": 45},
      {"ip": "10.0.0.15", "violations": 32}
    ],
    "top_violating_users": [
      {"user": "user_123", "violations": 28},
      {"user": "user_456", "violations": 19}
    ]
  }
}
```

### Alert Types

Configure different types of alerts:

#### Block Rate Alert
```python
{
  "name": "high_block_rate",
  "condition": "block_rate",
  "threshold": 0.1,  # 10% block rate
  "window_minutes": 5
}
```

#### Violations Count Alert
```python
{
  "name": "excessive_violations",
  "condition": "violations",
  "threshold": 100,  # 100 violations
  "window_minutes": 5
}
```

#### Adaptive Factor Alert
```python
{
  "name": "adaptive_adjustment",
  "condition": "adaptive_factor",
  "threshold": 0.5,  # Adaptive factor below 0.5
  "window_minutes": 10
}
```

## Best Practices

### 1. Rule Design

#### Start Conservative
```python
# Begin with conservative limits
conservative_rule = {
    "name": "api_conservative",
    "strategy": "sliding_window",
    "limit": 60,           # 1 request per second
    "window": 60,
    "action": "reject"
}
```

#### Monitor and Adjust
```python
# Monitor usage patterns and adjust
adjusted_rule = {
    "name": "api_adjusted",
    "strategy": "token_bucket",
    "limit": 120,          # Increased based on usage
    "window": 60,
    "burst_limit": 150,     # Allow bursts
    "action": "delay"       # More lenient action
}
```

### 2. Performance Optimization

#### Use Redis for Production
```python
production_config = {
    "storage": {
        "type": "redis",
        "redis_url": "redis://redis-cluster:6379/2",
        "max_connections": 100,
        "connection_pool": True
    }
}
```

#### Optimize Rule Priority
```python
# Higher priority rules are evaluated first
high_priority_rule = {
    "name": "security_critical",
    "priority": 1,          # Highest priority
    "scope": "ip",
    "limit": 10,
    "window": 60
}

low_priority_rule = {
    "name": "general_usage",
    "priority": 100,        # Lower priority
    "scope": "user",
    "limit": 1000,
    "window": 3600
}
```

### 3. Security Considerations

#### IP-Based Limiting
```python
ip_security_rule = {
    "name": "ip_security",
    "strategy": "fixed_window",
    "scope": "ip",
    "limit": 30,           # Strict IP limits
    "window": 60,
    "action": "reject",
    "auto_block_threshold": 100,  # Auto-block after 100 violations
    "auto_block_duration": 3600   # Block for 1 hour
}
```

#### Endpoint-Specific Limits
```python
auth_security_rule = {
    "name": "auth_security",
    "strategy": "sliding_window",
    "scope": "endpoint",
    "limit": 5,            # Very strict auth limits
    "window": 300,         # 5 minutes
    "endpoints": ["/api/auth/login", "/api/auth/register"],
    "methods": ["POST"],
    "action": "reject"
}
```

### 4. Monitoring Setup

#### Comprehensive Alerting
```python
alerts = [
    {
        "name": "critical_block_rate",
        "condition": "block_rate",
        "threshold": 0.05,     # 5% block rate
        "window_minutes": 1,
        "webhook_url": "https://alerts.example.com/critical",
        "email_recipients": ["oncall@example.com"]
    },
    {
        "name": "daily_usage_spike",
        "condition": "violations",
        "threshold": 1000,
        "window_minutes": 1440,  # 24 hours
        "webhook_url": "https://alerts.example.com/daily"
    }
]
```

## Troubleshooting

### Common Issues

#### 1. High False Positive Rate
**Problem**: Legitimate users being blocked

**Solution**:
```python
# Increase limits or add whitelisting
adjusted_rule = {
    "limit": 200,          # Increase from 100
    "user_whitelist": ["trusted_user_1", "trusted_user_2"],
    "ip_whitelist": ["192.168.1.0/24"]
}
```

#### 2. Redis Connection Issues
**Problem**: Redis connection failures

**Solution**:
```python
# Add connection retry and fallback
redis_config = {
    "redis_url": "redis://localhost:6379/2",
    "retry_on_timeout": True,
    "socket_timeout": 10,
    "socket_connect_timeout": 10,
    "max_connections": 20,
    "fallback_to_memory": True
}
```

#### 3. Memory Usage High
**Problem**: In-memory storage using too much memory

**Solution**:
```python
# Optimize memory usage
memory_config = {
    "max_size": 5000,      # Limit stored states
    "cleanup_interval": 60,  # Frequent cleanup
    "ttl": 1800            # Shorter TTL
}
```

### Debug Mode

Enable debug logging for troubleshooting:

```python
import logging

# Enable debug logging
logging.getLogger("rate_limit_service").setLevel(logging.DEBUG)
logging.getLogger("advanced_rate_limiter").setLevel(logging.DEBUG)
```

### Performance Testing

Test rate limiting performance:

```python
# Load test script
import asyncio
import aiohttp

async def test_rate_limit():
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(1000):
            task = session.get("http://localhost:8000/api/test")
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Analyze results
        success_count = sum(1 for r in results if not isinstance(r, Exception))
        blocked_count = len(results) - success_count
        
        print(f"Success: {success_count}, Blocked: {blocked_count}")

asyncio.run(test_rate_limit())
```

## Production Deployment

### 1. Environment Setup

```bash
# Production environment variables
export RATE_LIMIT_ENABLED=true
export RATE_LIMIT_STORAGE=redis
export RATE_LIMIT_REDIS_URL=redis://redis-cluster:6379/2
export RATE_LIMIT_ADAPTIVE_MODE=true
export RATE_LIMIT_ALERT_WEBHOOK_URL=https://alerts.example.com/webhook
```

### 2. Redis Cluster Setup

```bash
# Redis cluster configuration
redis-cli --cluster create \
  127.0.0.1:7000 \
  127.0.0.1:7001 \
  127.0.0.1:7002 \
  127.0.0.1:7003 \
  127.0.0.1:7004 \
  127.0.0.1:7005 \
  --cluster-replicas 1
```

### 3. Monitoring Integration

```python
# Integrate with monitoring system
from utils.advanced_monitoring import create_monitoring_system

monitoring_system = create_monitoring_system({
    "metrics": {
        "rate_limiting": {
            "enabled": True,
            "export_interval": 60,
            "include_analytics": True
        }
    }
})
```

### 4. Health Checks

```python
# Add rate limiting to health checks
@app.get("/api/health")
async def health_check():
    rate_limit_service = get_rate_limit_service()
    rate_limit_stats = await rate_limit_service.get_statistics()
    
    return {
        "status": "healthy",
        "rate_limiting": {
            "enabled": rate_limit_config["enabled"],
            "storage_type": rate_limit_config["storage"]["type"],
            "active_rules": rate_limit_stats["enabled_rules"],
            "block_rate": rate_limit_stats["block_rate"]
        }
    }
```

## API Reference

### Rate Limit Strategies

| Strategy | Description | Use Case |
|----------|-------------|-----------|
| `fixed_window` | Fixed time window with reset | Simple rate limiting |
| `sliding_window` | Sliding time window | Smooth rate limiting |
| `token_bucket` | Token bucket algorithm | Burst handling |
| `leaky_bucket` | Leaky bucket algorithm | Traffic shaping |
| `adaptive` | Adaptive based on patterns | Intelligent limiting |

### Rate Limit Scopes

| Scope | Description | Example |
|-------|-------------|---------|
| `global` | Across all requests | Global API limits |
| `ip` | Per IP address | Anti-DoS protection |
| `user` | Per authenticated user | User-specific limits |
| `endpoint` | Per API endpoint | Endpoint-specific limits |
| `user_endpoint` | Per user per endpoint | Granular user limits |
| `ip_endpoint` | Per IP per endpoint | IP-specific endpoint limits |

### Rate Limit Actions

| Action | Description | Behavior |
|--------|-------------|----------|
| `reject` | Reject request immediately | HTTP 429 response |
| `delay` | Add delay before processing | Slower response |
| `throttle` | Slow down processing | Gradual slowdown |
| `queue` | Queue request for later | Async processing |

## Conclusion

The advanced rate limiting system provides comprehensive protection for PyMastery with:

- 🚀 **Multiple Strategies**: 5 different rate limiting algorithms
- 🎯 **Flexible Scopes**: 7 different limiting scopes
- 🛡️ **Security Features**: IP blocking, whitelisting, auto-blocking
- 📊 **Real-time Analytics**: Comprehensive monitoring and alerting
- 🧠 **Smart Features**: Adaptive rate limiting with anomaly detection
- ⚡ **High Performance**: Optimized for production workloads
- 🔧 **Easy Management**: RESTful API for configuration and monitoring

The system is production-ready and can be easily configured to meet specific requirements while providing robust protection against abuse and ensuring fair resource usage.

For additional support or questions, refer to the API documentation or contact the development team.

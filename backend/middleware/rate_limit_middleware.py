"""
Rate Limiting Middleware
Comprehensive middleware for advanced rate limiting with monitoring and analytics
"""

import asyncio
import time
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Set
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from utils.advanced_rate_limiter import get_advanced_rate_limiter
from services.rate_limit_service import get_rate_limit_service
from utils.advanced_logging import get_logger

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Advanced rate limiting middleware with comprehensive protection"""
    
    def __init__(self, app, config: Dict[str, Any] = None):
        super().__init__(app)
        self.config = config or {}
        self.logger = get_logger("rate_limit_middleware")
        
        # Get services
        self.rate_limiter = get_advanced_rate_limiter(self.config.get("rate_limiter", {}))
        self.rate_limit_service = get_rate_limit_service(self.config.get("rate_limit_service", {}))
        
        # Middleware configuration
        self.enabled = self.config.get("enabled", True)
        self.skip_paths = set(self.config.get("skip_paths", []))
        self.skip_methods = set(self.config.get("skip_methods", []))
        self.whitelist_ips = set(self.config.get("whitelist_ips", []))
        self.whitelist_users = set(self.config.get("whitelist_users", []))
        
        # Response configuration
        self.include_headers = self.config.get("include_headers", True)
        self.log_violations = self.config.get("log_violations", True)
        self.block_response_message = self.config.get("block_response_message", 
            "Rate limit exceeded. Please try again later.")
        
        # Custom headers
        self.custom_headers = self.config.get("custom_headers", {})
        
        # Statistics
        self.request_count = 0
        self.blocked_count = 0
        self.start_time = time.time()
        
        self.logger.info("Rate limiting middleware initialized",
                        enabled=self.enabled,
                        skip_paths=len(self.skip_paths),
                        skip_methods=len(self.skip_methods),
                        whitelist_ips=len(self.whitelist_ips),
                        whitelist_users=len(self.whitelist_users))
    
    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch method"""
        if not self.enabled:
            return await call_next(request)
        
        start_time = time.time()
        self.request_count += 1
        
        # Check if request should be skipped
        if self._should_skip_request(request):
            return await call_next(request)
        
        # Get client information
        client_ip = self._get_client_ip(request)
        user_id = await self._get_user_id(request)
        
        # Check whitelist
        if self._is_whitelisted(client_ip, user_id):
            return await call_next(request)
        
        # Check rate limits
        rate_limit_result = await self.rate_limiter.check_rate_limit(request, user_id)
        
        # Create response
        if rate_limit_result.allowed:
            response = await call_next(request)
            await self._add_rate_limit_headers(response, rate_limit_result)
            return response
        else:
            # Rate limit exceeded
            await self._handle_rate_limit_exceeded(request, rate_limit_result, client_ip, user_id)
            
            # Create blocked response
            response = self._create_blocked_response(rate_limit_result)
            
            # Add rate limit headers
            if self.include_headers:
                await self._add_rate_limit_headers(response, rate_limit_result)
            
            # Log violation
            if self.log_violations:
                await self._log_violation(request, rate_limit_result, client_ip, user_id, start_time)
            
            self.blocked_count += 1
            return response
    
    def _should_skip_request(self, request: Request) -> bool:
        """Check if request should be skipped from rate limiting"""
        # Skip specific paths
        if request.url.path in self.skip_paths:
            return True
        
        # Skip specific methods
        if request.method in self.skip_methods:
            return True
        
        # Skip health checks and static files
        skip_patterns = [
            "/health",
            "/metrics", 
            "/status",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico",
            "/static/"
        ]
        
        for pattern in skip_patterns:
            if request.url.path.startswith(pattern):
                return True
        
        return False
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address with proxy support"""
        # Check for forwarded headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Check for Cloudflare
        cf_connecting_ip = request.headers.get("cf-connecting-ip")
        if cf_connecting_ip:
            return cf_connecting_ip
        
        # Fall back to client IP
        if request.client:
            return request.client.host
        
        return "unknown"
    
    async def _get_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from request"""
        # Try to get user from request state (set by auth middleware)
        if hasattr(request.state, 'user') and request.state.user:
            return str(request.state.user.get('id', ''))
        
        # Try to get from authorization header
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # This would require JWT decoding - simplified for now
            try:
                # Extract user ID from token if possible
                # For now, return None to use IP-based limiting
                pass
            except Exception:
                pass
        
        return None
    
    def _is_whitelisted(self, client_ip: str, user_id: Optional[str]) -> bool:
        """Check if client is whitelisted"""
        # Check IP whitelist
        if client_ip in self.whitelist_ips:
            return True
        
        # Check user whitelist
        if user_id and user_id in self.whitelist_users:
            return True
        
        return False
    
    async def _add_rate_limit_headers(self, response: Response, rate_limit_result):
        """Add rate limit headers to response"""
        if not self.include_headers:
            return
        
        # Standard rate limit headers
        if rate_limit_result.remaining >= 0:
            response.headers["X-RateLimit-Remaining"] = str(rate_limit_result.remaining)
        
        if rate_limit_result.reset_time > 0:
            response.headers["X-RateLimit-Reset"] = str(int(rate_limit_result.reset_time))
        
        if rate_limit_result.retry_after:
            response.headers["Retry-After"] = str(int(rate_limit_result.retry_after))
        
        # Custom headers
        if rate_limit_result.rule_name:
            response.headers["X-RateLimit-Rule"] = rate_limit_result.rule_name
        
        if rate_limit_result.strategy:
            response.headers["X-RateLimit-Strategy"] = rate_limit_result.strategy.value
        
        # Add custom headers
        for header, value in self.custom_headers.items():
            response.headers[header] = value
    
    async def _handle_rate_limit_exceeded(self, request: Request, rate_limit_result, 
                                       client_ip: str, user_id: Optional[str]):
        """Handle rate limit exceeded event"""
        # Log to service analytics
        try:
            # This would be handled by the rate limit service
            pass
        except Exception as e:
            self.logger.error(f"Failed to log rate limit violation: {e}")
        
        # Trigger additional actions if configured
        await self._trigger_violation_actions(request, rate_limit_result, client_ip, user_id)
    
    async def _trigger_violation_actions(self, request: Request, rate_limit_result,
                                       client_ip: str, user_id: Optional[str]):
        """Trigger additional actions on violation"""
        # Check if this is a repeated violation
        violation_count = rate_limit_result.metadata.get("violation_count", 0) if rate_limit_result.metadata else 0
        
        # Auto-block IP after multiple violations
        auto_block_threshold = self.config.get("auto_block_threshold", 50)
        auto_block_duration = self.config.get("auto_block_duration", 60)  # minutes
        
        if violation_count >= auto_block_threshold:
            try:
                await self.rate_limit_service.block_ip(client_ip, auto_block_duration)
                self.logger.warning(f"Auto-blocked IP {client_ip} after {violation_count} violations")
            except Exception as e:
                self.logger.error(f"Failed to auto-block IP {client_ip}: {e}")
        
        # Send webhook notification for severe violations
        webhook_threshold = self.config.get("webhook_notification_threshold", 20)
        webhook_url = self.config.get("violation_webhook_url")
        
        if violation_count >= webhook_threshold and webhook_url:
            try:
                await self._send_violation_webhook(request, rate_limit_result, 
                                                client_ip, user_id, violation_count)
            except Exception as e:
                self.logger.error(f"Failed to send violation webhook: {e}")
    
    async def _send_violation_webhook(self, request: Request, rate_limit_result,
                                    client_ip: str, user_id: Optional[str], violation_count: int):
        """Send webhook notification for rate limit violation"""
        import httpx
        
        payload = {
            "event_type": "rate_limit_violation",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "client_ip": client_ip,
            "user_id": user_id,
            "violation_count": violation_count,
            "rule_name": rate_limit_result.rule_name,
            "strategy": rate_limit_result.strategy.value if rate_limit_result.strategy else None,
            "request_path": request.url.path,
            "request_method": request.method,
            "user_agent": request.headers.get("user-agent"),
            "retry_after": rate_limit_result.retry_after
        }
        
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json=payload, timeout=10)
    
    def _create_blocked_response(self, rate_limit_result) -> JSONResponse:
        """Create response for blocked request"""
        content = {
            "success": False,
            "error": self.block_response_message,
            "error_code": "RATE_LIMIT_EXCEEDED",
            "retry_after": rate_limit_result.retry_after,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Add additional information if available
        if rate_limit_result.rule_name:
            content["rule_name"] = rate_limit_result.rule_name
        
        if rate_limit_result.strategy:
            content["strategy"] = rate_limit_result.strategy.value
        
        if rate_limit_result.metadata:
            content["metadata"] = rate_limit_result.metadata
        
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content=content
        )
    
    async def _log_violation(self, request: Request, rate_limit_result, 
                            client_ip: str, user_id: Optional[str], start_time: float):
        """Log rate limit violation"""
        response_time = time.time() - start_time
        
        self.logger.warning(
            f"Rate limit exceeded: {rate_limit_result.rule_name}",
            extra={
                "event_type": "rate_limit_violation",
                "client_ip": client_ip,
                "user_id": user_id,
                "request_path": request.url.path,
                "request_method": request.method,
                "rule_name": rate_limit_result.rule_name,
                "strategy": rate_limit_result.strategy.value if rate_limit_result.strategy else None,
                "retry_after": rate_limit_result.retry_after,
                "response_time": response_time,
                "user_agent": request.headers.get("user-agent"),
                "violation_count": rate_limit_result.metadata.get("violation_count", 0) if rate_limit_result.metadata else 0
            }
        )
    
    async def get_middleware_stats(self) -> Dict[str, Any]:
        """Get middleware statistics"""
        uptime = time.time() - self.start_time
        
        return {
            "middleware_stats": {
                "enabled": self.enabled,
                "uptime_seconds": uptime,
                "total_requests": self.request_count,
                "blocked_requests": self.blocked_count,
                "block_rate": self.blocked_count / max(1, self.request_count),
                "requests_per_second": self.request_count / uptime if uptime > 0 else 0,
                "skip_paths": list(self.skip_paths),
                "skip_methods": list(self.skip_methods),
                "whitelist_ips": list(self.whitelist_ips),
                "whitelist_users": list(self.whitelist_users)
            }
        }

class SmartRateLimitMiddleware(RateLimitMiddleware):
    """Smart rate limiting middleware with adaptive behavior"""
    
    def __init__(self, app, config: Dict[str, Any] = None):
        super().__init__(app, config)
        # Use the custom logger from parent class
        # self.logger = logging.getLogger("smart_rate_limit_middleware")
        
        # Smart features
        self.adaptive_mode = self.config.get("adaptive_mode", True)
        self.learning_enabled = self.config.get("learning_enabled", True)
        self.anomaly_detection = self.config.get("anomaly_detection", True)
        
        # Traffic patterns
        self.traffic_patterns: Dict[str, Any] = {}
        self.learning_data: List[Dict[str, Any]] = []
        self.max_learning_entries = 10000
        
        # Anomaly detection
        self.anomaly_threshold = self.config.get("anomaly_threshold", 2.0)  # Standard deviations
        
        self.logger.info("Smart rate limiting middleware initialized",
                        adaptive_mode=self.adaptive_mode,
                        learning_enabled=self.learning_enabled,
                        anomaly_detection=self.anomaly_detection)
    
    async def dispatch(self, request: Request, call_next):
        """Enhanced dispatch with smart features"""
        if not self.enabled:
            return await call_next(request)
        
        start_time = time.time()
        
        # Analyze request pattern
        if self.learning_enabled:
            await self._analyze_request_pattern(request)
        
        # Detect anomalies
        if self.anomaly_detection:
            anomaly_score = await self._detect_anomaly(request)
            if anomaly_score > self.anomaly_threshold:
                await self._handle_anomaly(request, anomaly_score)
        
        # Adaptive rate limiting
        if self.adaptive_mode:
            await self._adaptive_rate_limit_adjustment(request)
        
        # Call parent dispatch
        return await super().dispatch(request, call_next)
    
    async def _analyze_request_pattern(self, request: Request):
        """Analyze request patterns for learning"""
        current_minute = int(time.time() // 60)
        client_ip = self._get_client_ip(request)
        path = request.url.path
        method = request.method
        
        # Track patterns
        pattern_key = f"{client_ip}:{path}:{method}"
        
        if pattern_key not in self.traffic_patterns:
            self.traffic_patterns[pattern_key] = {
                "count": 0,
                "first_seen": time.time(),
                "last_seen": time.time(),
                "minute_pattern": {}
            }
        
        pattern = self.traffic_patterns[pattern_key]
        pattern["count"] += 1
        pattern["last_seen"] = time.time()
        
        if current_minute not in pattern["minute_pattern"]:
            pattern["minute_pattern"][current_minute] = 0
        pattern["minute_pattern"][current_minute] += 1
        
        # Store learning data
        self.learning_data.append({
            "timestamp": time.time(),
            "client_ip": client_ip,
            "path": path,
            "method": method,
            "minute": current_minute
        })
        
        # Limit learning data size
        if len(self.learning_data) > self.max_learning_entries:
            self.learning_data = self.learning_data[-self.max_learning_entries:]
    
    async def _detect_anomaly(self, request: Request) -> float:
        """Detect anomalous request patterns"""
        client_ip = self._get_client_ip(request)
        path = request.url.path
        method = request.method
        
        # Calculate anomaly score based on various factors
        anomaly_score = 0.0
        
        # 1. Request frequency anomaly
        pattern_key = f"{client_ip}:{path}:{method}"
        if pattern_key in self.traffic_patterns:
            pattern = self.traffic_patterns[pattern_key]
            recent_requests = sum(
                count for minute, count in pattern["minute_pattern"].items()
                if time.time() // 60 - minute <= 5  # Last 5 minutes
            )
            
            # Compare with historical average
            if pattern["count"] > 10:  # Have enough data
                avg_requests = pattern["count"] / max(1, (time.time() - pattern["first_seen"]) / 60)
                if recent_requests > avg_requests * 3:
                    anomaly_score += 1.0
        
        # 2. Time-based anomaly
        current_hour = datetime.now(timezone.utc).hour
        if current_hour in range(2, 6):  # Unusual hours
            anomaly_score += 0.5
        
        # 3. Path-based anomaly
        suspicious_paths = [
            "/admin", "/api/admin", "/wp-admin", "/.env",
            "/config", "/backup", "/database", "/shell"
        ]
        if any(suspicious in path.lower() for suspicious in suspicious_paths):
            anomaly_score += 1.5
        
        # 4. User agent anomaly
        user_agent = request.headers.get("user-agent", "")
        if not user_agent or len(user_agent) < 10:
            anomaly_score += 0.5
        
        # 5. Header anomaly
        suspicious_headers = [
            "x-forwarded-for", "x-real-ip", "x-originating-ip"
        ]
        header_count = sum(1 for header in suspicious_headers if header in request.headers)
        if header_count > 2:
            anomaly_score += 0.3
        
        return anomaly_score
    
    async def _handle_anomaly(self, request: Request, anomaly_score: float):
        """Handle detected anomaly"""
        client_ip = self._get_client_ip(request)
        
        self.logger.warning(
            f"Anomalous request detected: score={anomaly_score:.2f}",
            extra={
                "event_type": "anomaly_detected",
                "client_ip": client_ip,
                "anomaly_score": anomaly_score,
                "request_path": request.url.path,
                "request_method": request.method,
                "user_agent": request.headers.get("user-agent")
            }
        )
        
        # Apply stricter rate limiting for high anomaly scores
        if anomaly_score > self.anomaly_threshold * 2:
            # Temporary block for severe anomalies
            await self.rate_limit_service.block_ip(client_ip, 5)  # 5 minutes
    
    async def _adaptive_rate_limit_adjustment(self, request: Request):
        """Adaptively adjust rate limits based on patterns"""
        # This would implement adaptive rate limit adjustments
        # based on learned patterns and current load
        pass
    
    async def get_smart_stats(self) -> Dict[str, Any]:
        """Get smart middleware statistics"""
        base_stats = await self.get_middleware_stats()
        
        smart_stats = {
            "smart_features": {
                "adaptive_mode": self.adaptive_mode,
                "learning_enabled": self.learning_enabled,
                "anomaly_detection": self.anomaly_detection,
                "anomaly_threshold": self.anomaly_threshold
            },
            "learning_data": {
                "total_entries": len(self.learning_data),
                "max_entries": self.max_learning_entries,
                "traffic_patterns": len(self.traffic_patterns)
            }
        }
        
        return {**base_stats, **smart_stats}

# Factory functions for easy middleware creation
def create_rate_limit_middleware(app, config: Dict[str, Any] = None) -> RateLimitMiddleware:
    """Create rate limiting middleware instance"""
    return RateLimitMiddleware(app, config)

def create_smart_rate_limit_middleware(app, config: Dict[str, Any] = None) -> SmartRateLimitMiddleware:
    """Create smart rate limiting middleware instance"""
    return SmartRateLimitMiddleware(app, config)

# Export for easy import
__all__ = [
    "RateLimitMiddleware",
    "SmartRateLimitMiddleware", 
    "create_rate_limit_middleware",
    "create_smart_rate_limit_middleware"
]

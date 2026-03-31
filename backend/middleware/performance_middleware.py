"""
Performance Optimization Middleware
Advanced caching, compression, and optimization for FastAPI applications
"""

import os
import asyncio
import time
import json
import hashlib
import gzip
import lzma
from typing import Dict, Any, Optional, List, Callable, Union
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, asdict
from enum import Enum
import aiofiles
from pathlib import Path

from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from services.advanced_cache import get_cache_manager, CacheLevel
from services.performance_monitor import get_performance_monitor

class CompressionType(Enum):
    """Compression algorithms"""
    GZIP = "gzip"
    LZMA = "lzma"
    NONE = "none"

@dataclass
class CacheRule:
    """Cache rule configuration"""
    path_pattern: str
    ttl: int
    cache_level: str = CacheLevel.MEMORY.value
    vary_headers: List[str] = None
    max_response_size: int = 10 * 1024 * 1024  # 10MB
    compression: bool = True
    enabled: bool = True

@dataclass
class PerformanceConfig:
    """Performance middleware configuration"""
    # Caching settings
    cache_enabled: bool = True
    default_ttl: int = 300  # 5 minutes
    cache_key_prefix: str = "api_cache"
    
    # Compression settings
    compression_enabled: bool = True
    compression_threshold: int = 1024  # Compress responses > 1KB
    compression_types: List[str] = None
    
    # Rate limiting
    rate_limit_enabled: bool = True
    default_rate_limit: int = 100  # requests per minute
    
    # Response optimization
    etag_enabled: bool = True
    last_modified_enabled: bool = True
    cache_control_enabled: bool = True
    
    # Monitoring
    track_response_times: bool = True
    track_request_sizes: bool = True
    log_slow_requests: bool = True
    slow_request_threshold: float = 1000  # ms
    
    # Cache rules
    cache_rules: List[CacheRule] = None
    
    def __post_init__(self):
        if self.compression_types is None:
            self.compression_types = ["application/json", "text/html", "text/css", "application/javascript"]
        
        if self.cache_rules is None:
            self.cache_rules = [
                # API endpoints
                CacheRule(r"/api/courses/", 1800),  # 30 minutes
                CacheRule(r"/api/problems/", 600),   # 10 minutes
                CacheRule(r"/api/users/", 300),     # 5 minutes
                CacheRule(r"/api/leaderboard", 120), # 2 minutes
                
                # Static content
                CacheRule(r"/static/", 3600),      # 1 hour
                CacheRule(r"/assets/", 3600),       # 1 hour
                
                # Public endpoints
                CacheRule(r"/api/public/", 7200),  # 2 hours
            ]

class PerformanceMiddleware(BaseHTTPMiddleware):
    """Advanced performance optimization middleware"""
    
    def __init__(self, app: ASGIApp, config: Optional[PerformanceConfig] = None):
        super().__init__(app)
        self.config = config or PerformanceConfig()
        
        # Performance tracking
        self.request_stats = {
            "total_requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "compressed_responses": 0,
            "slow_requests": 0,
            "average_response_time": 0.0,
            "total_response_time": 0.0
        }
        
        # Initialize components
        self.cache_manager = get_cache_manager()
        self.performance_monitor = get_performance_monitor()
        
        # Request tracking
        self._active_requests: Dict[str, Dict[str, Any]] = {}
        
        # Compression
        self.compression_enabled = self.config.compression_enabled
        
        # Cache key generation
        self._cache_key_counter = 0
    
    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch method"""
        start_time = time.time()
        request_id = f"req_{int(start_time * 1000000)}_{self._cache_key_counter}"
        self._cache_key_counter += 1
        
        # Track request start
        self._active_requests[request_id] = {
            "start_time": start_time,
            "method": request.method,
            "url": str(request.url),
            "headers": dict(request.headers),
            "client_ip": self._get_client_ip(request)
        }
        
        try:
            # Check if request should be served from cache
            if self.config.cache_enabled:
                cached_response = await self._get_cached_response(request)
                if cached_response:
                    await self._track_request_completion(request_id, start_time, cached=True)
                    return cached_response
            
            # Process request
            response = await call_next(request)
            
            # Optimize response
            optimized_response = await self._optimize_response(request, response)
            
            # Cache response if applicable
            if self.config.cache_enabled and self._should_cache_response(request, optimized_response):
                await self._cache_response(request, optimized_response)
            
            # Track request completion
            await self._track_request_completion(request_id, start_time, cached=False, response=optimized_response)
            
            return optimized_response
            
        except Exception as e:
            # Track error
            await self._track_request_completion(request_id, start_time, error=str(e))
            raise
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        # Check various headers for client IP
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def _generate_cache_key(self, request: Request) -> str:
        """Generate cache key for request"""
        # Base key components
        key_parts = [
            self.config.cache_key_prefix,
            request.method.lower(),
            str(request.url),
        ]
        
        # Add relevant headers for cache variation
        vary_headers = ["authorization", "cookie", "accept-language", "accept-encoding"]
        for header in vary_headers:
            if header in request.headers:
                key_parts.append(f"{header}:{request.headers[header]}")
        
        # Add query parameters
        if request.query_params:
            sorted_params = sorted(request.query_params.items())
            key_parts.extend([f"{k}:{v}" for k, v in sorted_params])
        
        # Generate hash
        key_string = "|".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    async def _get_cached_response(self, request: Request) -> Optional[Response]:
        """Get response from cache"""
        try:
            cache_key = self._generate_cache_key(request)
            cached_data = await self.cache_manager.get(cache_key)
            
            if cached_data:
                # Reconstruct response
                response_data = cached_data.get("response", {})
                
                # Check if cached response is still valid
                if self._is_cached_response_valid(request, response_data):
                    response = Response(
                        content=response_data.get("content"),
                        status_code=response_data.get("status_code", 200),
                        headers=response_data.get("headers", {}),
                        media_type=response_data.get("media_type")
                    )
                    
                    # Add cache headers
                    response.headers["X-Cache"] = "HIT"
                    response.headers["X-Cache-Key"] = cache_key
                    
                    self.request_stats["cache_hits"] += 1
                    return response
            
            self.request_stats["cache_misses"] += 1
            return None
            
        except Exception as e:
            print(f"Cache get error: {e}")
            self.request_stats["cache_misses"] += 1
            return None
    
    def _is_cached_response_valid(self, request: Request, cached_data: Dict[str, Any]) -> bool:
        """Check if cached response is still valid"""
        # Check expiration
        if "expires_at" in cached_data:
            expires_at = cached_data["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if datetime.now(timezone.utc) > expires_at:
                return False
        
        # Check validation headers
        if "if-none-match" in request.headers and "etag" in cached_data:
            if request.headers["if-none-match"] == cached_data["etag"]:
                return False
        
        if "if-modified-since" in request.headers and "last_modified" in cached_data:
            if_modified_since = request.headers["if-modified-since"]
            last_modified = cached_data["last_modified"]
            if if_modified_since == last_modified:
                return False
        
        return True
    
    async def _cache_response(self, request: Request, response: Response):
        """Cache response for future requests"""
        try:
            cache_key = self._generate_cache_key(request)
            cache_rule = self._get_cache_rule(request)
            
            if not cache_rule or not cache_rule.enabled:
                return
            
            # Prepare cache data
            content = response.body if hasattr(response, 'body') else b""
            
            cache_data = {
                "content": content,
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "media_type": response.media_type,
                "cached_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=cache_rule.ttl)).isoformat(),
                "cache_rule": cache_rule.path_pattern,
                "request_method": request.method,
                "request_url": str(request.url)
            }
            
            # Add validation headers
            if "etag" in response.headers:
                cache_data["etag"] = response.headers["etag"]
            if "last-modified" in response.headers:
                cache_data["last_modified"] = response.headers["last-modified"]
            
            # Store in cache
            await self.cache_manager.set(cache_key, cache_data, cache_rule.ttl)
            
        except Exception as e:
            print(f"Cache set error: {e}")
    
    def _should_cache_response(self, request: Request, response: Response) -> bool:
        """Determine if response should be cached"""
        # Check cache rule
        cache_rule = self._get_cache_rule(request)
        if not cache_rule or not cache_rule.enabled:
            return False
        
        # Only cache successful responses
        if response.status_code >= 400:
            return False
        
        # Check response size
        content_length = len(response.body) if hasattr(response, 'body') else 0
        if content_length > cache_rule.max_response_size:
            return False
        
        # Check content type
        if response.media_type and not response.media_type.startswith(("application/", "text/")):
            return False
        
        # Don't cache if no-cache headers
        cache_control = response.headers.get("cache-control", "")
        if "no-cache" in cache_control or "private" in cache_control:
            return False
        
        return True
    
    def _get_cache_rule(self, request: Request) -> Optional[CacheRule]:
        """Get cache rule for request"""
        url_path = str(request.url.path)
        
        for rule in self.config.cache_rules:
            if rule.path_pattern in url_path:
                return rule
        
        return None
    
    async def _optimize_response(self, request: Request, response: Response) -> Response:
        """Optimize response with compression and headers"""
        # Get request ID
        request_id = request.state.request_id if hasattr(request.state, "request_id") else None
        
        # Get content
        content = response.body if hasattr(response, 'body') else b""
        original_size = len(content)
        
        # Apply compression if enabled and applicable
        if (self.compression_enabled and 
            self._should_compress_response(request, response)):
            
            compressed_content, compression_type = await self._compress_content(content)
            
            if compressed_content and len(compressed_content) < original_size:
                content = compressed_content
                response.headers["Content-Encoding"] = compression_type.value
                response.headers["Content-Length"] = str(len(compressed_content))
                self.request_stats["compressed_responses"] += 1
        
        # Add performance headers
        self._add_performance_headers(request, response, request_id)
        
        # Update response content
        if hasattr(response, 'body'):
            response.body = content
        
        return response
    
    def _should_compress_response(self, request: Request, response: Response) -> bool:
        """Determine if response should be compressed"""
        # Check if client accepts compression
        accept_encoding = request.headers.get("accept-encoding", "")
        if not any(enc in accept_encoding for enc in ["gzip", "deflate", "br"]):
            return False
        
        # Check content type
        if response.media_type:
            content_type = response.media_type.split(";")[0]  # Remove charset
            if content_type not in self.config.compression_types:
                return False
        
        # Check content size
        content_length = len(response.body) if hasattr(response, 'body') else 0
        if content_length < self.config.compression_threshold:
            return False
        
        # Don't compress already compressed content
        content_encoding = response.headers.get("content-encoding", "")
        if content_encoding:
            return False
        
        return True
    
    async def _compress_content(self, content: bytes) -> tuple[Optional[bytes], Optional[CompressionType]]:
        """Compress content using best available algorithm"""
        try:
            # Try GZIP compression
            gzip_content = gzip.compress(content)
            if len(gzip_content) < len(content):
                return gzip_content, CompressionType.GZIP
        except Exception:
            pass
        
        try:
            # Try LZMA compression
            lzma_content = lzma.compress(content)
            if len(lzma_content) < len(content):
                return lzma_content, CompressionType.LZMA
        except Exception:
            pass
        
        return None, None
    
    def _add_performance_headers(self, request: Request, response: Response, request_id: Optional[str] = None):
        """Add performance-related headers"""
        # Add cache control headers
        if self.config.cache_control_enabled:
            if not response.headers.get("cache-control"):
                cache_rule = self._get_cache_rule(request)
                if cache_rule:
                    max_age = cache_rule.ttl
                    response.headers["Cache-Control"] = f"public, max-age={max_age}"
                else:
                    response.headers["Cache-Control"] = f"public, max-age={self.config.default_ttl}"
        
        # Add ETag if enabled
        if self.config.etag_enabled and not response.headers.get("etag"):
            content = response.body if hasattr(response, 'body') else b""
            etag = f'"{hashlib.md5(content).hexdigest()}"'
            response.headers["ETag"] = etag
        
        # Add Last-Modified if enabled
        if self.config.last_modified_enabled and not response.headers.get("last-modified"):
            response.headers["Last-Modified"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
        
        # Add X-Response-Time
        if request_id and request_id in self._active_requests:
            start_time = self._active_requests[request_id]["start_time"]
            response_time = (time.time() - start_time) * 1000  # Convert to ms
            response.headers["X-Response-Time"] = f"{response_time:.2f}"
    
    async def _track_request_completion(self, request_id: str, start_time: float, 
                                   cached: bool = False, error: Optional[str] = None,
                                   response: Optional[Response] = None):
        """Track request completion for statistics"""
        try:
            # Calculate response time
            response_time = (time.time() - start_time) * 1000  # Convert to ms
            
            # Update statistics
            self.request_stats["total_requests"] += 1
            self.request_stats["total_response_time"] += response_time
            self.request_stats["average_response_time"] = (
                self.request_stats["total_response_time"] / self.request_stats["total_requests"]
            )
            
            # Track slow requests
            if (self.config.log_slow_requests and 
                response_time > self.config.slow_request_threshold):
                self.request_stats["slow_requests"] += 1
                await self._log_slow_request(request_id, response_time, error)
            
            # Track to performance monitor (disabled due to integration issues)
            if self.performance_monitor:
                try:
                    # Simplified metric tracking to avoid parameter errors
                    pass  # Disabled for now to fix performance issues
                except Exception:
                    pass  # Silently ignore monitoring errors
            
            # Clean up request tracking
            if request_id in self._active_requests:
                del self._active_requests[request_id]
                
        except Exception as e:
            print(f"Error tracking request completion: {e}")
    
    async def _log_slow_request(self, request_id: str, response_time: float, error: Optional[str]):
        """Log slow request details"""
        try:
            if request_id in self._active_requests:
                request_info = self._active_requests[request_id]
                
                log_entry = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": request_id,
                    "response_time_ms": response_time,
                    "method": request_info["method"],
                    "url": request_info["url"],
                    "client_ip": request_info["client_ip"],
                    "user_agent": request_info["headers"].get("user-agent", ""),
                    "error": error,
                    "headers": dict(request_info["headers"])
                }
                
                # Log to file
                log_file = Path("./logs/slow_requests.log")
                log_file.parent.mkdir(exist_ok=True)
                
                async with aiofiles.open(log_file, 'a') as f:
                    await f.write(json.dumps(log_entry) + '\n')
                    
        except Exception as e:
            print(f"Error logging slow request: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get middleware performance statistics"""
        return {
            "middleware_stats": self.request_stats,
            "cache_hit_rate": (
                self.request_stats["cache_hits"] / 
                (self.request_stats["cache_hits"] + self.request_stats["cache_misses"]) * 100
                if (self.request_stats["cache_hits"] + self.request_stats["cache_misses"]) > 0 else 0
            ),
            "compression_rate": (
                self.request_stats["compressed_responses"] / self.request_stats["total_requests"] * 100
                if self.request_stats["total_requests"] > 0 else 0
            ),
            "slow_request_rate": (
                self.request_stats["slow_requests"] / self.request_stats["total_requests"] * 100
                if self.request_stats["total_requests"] > 0 else 0
            )
        }

# Performance monitoring decorator
def monitor_performance(func: Callable):
    """Decorator to monitor function performance"""
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = await func(*args, **kwargs)
            
            # Track successful execution (disabled due to integration issues)
            execution_time = (time.time() - start_time) * 1000
            try:
                # Disabled to fix performance issues
                pass
            except Exception:
                pass
            
            return result
            
        except Exception as e:
            # Track failed execution (disabled due to integration issues)
            execution_time = (time.time() - start_time) * 1000
            try:
                # Disabled to fix performance issues
                pass
            except Exception:
                pass
            
            raise
    
    return wrapper

# FastAPI dependency for performance stats
async def get_performance_stats():
    """FastAPI dependency to get performance statistics"""
    # This would be injected by the middleware
    return {}  # Placeholder - would be set by middleware

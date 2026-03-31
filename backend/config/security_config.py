"""
Security Configuration
Centralized security settings and configuration management
"""

import os
from typing import Dict, Any, List
from dataclasses import dataclass
from pathlib import Path

MIN_JWT_SECRET_LENGTH = 32
JWT_SECRET_PLACEHOLDER_FRAGMENTS = (
    "your-jwt-secret",
    "placeholder",
    "changeme",
    "replace-me",
    "example-secret",
    "generate-a-secret",
)

@dataclass
class SecurityConfig:
    """Security configuration settings"""
    
    # General security
    enabled: bool = True
    environment: str = "development"
    debug_mode: bool = False
    
    # Authentication
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    password_min_length: int = 8
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_numbers: bool = True
    password_require_special: bool = True
    
    # Rate limiting
    rate_limiting_enabled: bool = True
    rate_limit_default_requests: int = 100
    rate_limit_default_window: int = 3600
    rate_limit_burst_requests: int = 10
    rate_limit_burst_window: int = 60
    
    # CSRF protection
    csrf_enabled: bool = True
    csrf_token_length: int = 32
    csrf_token_expiry: int = 3600
    
    # Security headers
    security_headers_enabled: bool = True
    csp_enabled: bool = True
    csp_policy: str = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    hsts_enabled: bool = True
    hsts_max_age: int = 31536000
    hsts_include_subdomains: bool = True
    hsts_preload: bool = False
    
    # Input validation
    input_validation_enabled: bool = True
    max_input_size: int = 1048576  # 1MB
    max_field_length: int = 10000
    
    # Data sanitization
    data_sanitization_enabled: bool = True
    mask_pii_in_logs: bool = True
    mask_pii_in_responses: bool = True
    detect_data_leaks: bool = True
    
    # Session security
    session_timeout: int = 3600  # 1 hour
    max_concurrent_sessions: int = 5
    secure_cookies: bool = True
    http_only_cookies: bool = True
    same_site_cookies: str = "strict"
    
    # File upload security
    file_upload_enabled: bool = True
    max_file_size: int = 10485760  # 10MB
    allowed_file_types: List[str] = None
    scan_uploads: bool = True
    
    # API security
    api_key_required: bool = False
    api_key_header: str = "X-API-Key"
    cors_origins: List[str] = None
    cors_methods: List[str] = None
    cors_headers: List[str] = None
    
    # Monitoring and logging
    security_logging_enabled: bool = True
    audit_log_file: str = "logs/security_audit.log"
    log_level: str = "INFO"
    
    # Redis configuration (for rate limiting and sessions)
    redis_url: str = "redis://localhost:6379"
    redis_db: int = 0
    
    # Trusted IPs
    trusted_ips: List[str] = None
    
    # Blocked IPs
    blocked_ips: List[str] = None
    
    # Security endpoints
    security_stats_endpoint: str = "/api/security/stats"
    security_config_endpoint: str = "/api/security/config"

def load_security_config() -> SecurityConfig:
    """Load security configuration from environment variables"""

    jwt_secret = (os.getenv("JWT_SECRET_KEY") or "").strip()
    if not jwt_secret:
        raise RuntimeError(
            "JWT_SECRET_KEY is required before loading the security configuration."
        )

    if len(jwt_secret) < MIN_JWT_SECRET_LENGTH:
        raise RuntimeError(
            f"JWT_SECRET_KEY must be at least {MIN_JWT_SECRET_LENGTH} characters long."
        )

    normalized_secret = jwt_secret.lower()
    if any(fragment in normalized_secret for fragment in JWT_SECRET_PLACEHOLDER_FRAGMENTS):
        raise RuntimeError(
            "JWT_SECRET_KEY is still set to a placeholder value."
        )
    
    config = SecurityConfig(
        # General
        enabled=os.getenv("SECURITY_ENABLED", "true").lower() == "true",
        environment=os.getenv("ENVIRONMENT", "development"),
        debug_mode=os.getenv("DEBUG", "false").lower() == "true",
        
        # Authentication
        jwt_secret_key=jwt_secret,
        jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        jwt_access_token_expire_minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")),
        jwt_refresh_token_expire_days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7")),
        password_min_length=int(os.getenv("PASSWORD_MIN_LENGTH", "8")),
        password_require_uppercase=os.getenv("PASSWORD_REQUIRE_UPPERCASE", "true").lower() == "true",
        password_require_lowercase=os.getenv("PASSWORD_REQUIRE_LOWERCASE", "true").lower() == "true",
        password_require_numbers=os.getenv("PASSWORD_REQUIRE_NUMBERS", "true").lower() == "true",
        password_require_special=os.getenv("PASSWORD_REQUIRE_SPECIAL", "true").lower() == "true",
        
        # Rate limiting
        rate_limiting_enabled=os.getenv("RATE_LIMITING_ENABLED", "true").lower() == "true",
        rate_limit_default_requests=int(os.getenv("RATE_LIMIT_DEFAULT_REQUESTS", "100")),
        rate_limit_default_window=int(os.getenv("RATE_LIMIT_DEFAULT_WINDOW", "3600")),
        rate_limit_burst_requests=int(os.getenv("RATE_LIMIT_BURST_REQUESTS", "10")),
        rate_limit_burst_window=int(os.getenv("RATE_LIMIT_BURST_WINDOW", "60")),
        
        # CSRF protection
        csrf_enabled=os.getenv("CSRF_ENABLED", "true").lower() == "true",
        csrf_token_length=int(os.getenv("CSRF_TOKEN_LENGTH", "32")),
        csrf_token_expiry=int(os.getenv("CSRF_TOKEN_EXPIRY", "3600")),
        
        # Security headers
        security_headers_enabled=os.getenv("SECURITY_HEADERS_ENABLED", "true").lower() == "true",
        csp_enabled=os.getenv("CSP_ENABLED", "true").lower() == "true",
        csp_policy=os.getenv("CSP_POLICY", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"),
        hsts_enabled=os.getenv("HSTS_ENABLED", "true").lower() == "true",
        hsts_max_age=int(os.getenv("HSTS_MAX_AGE", "31536000")),
        hsts_include_subdomains=os.getenv("HSTS_INCLUDE_SUBDOMAINS", "true").lower() == "true",
        hsts_preload=os.getenv("HSTS_PRELOAD", "false").lower() == "true",
        
        # Input validation
        input_validation_enabled=os.getenv("INPUT_VALIDATION_ENABLED", "true").lower() == "true",
        max_input_size=int(os.getenv("MAX_INPUT_SIZE", "1048576")),
        max_field_length=int(os.getenv("MAX_FIELD_LENGTH", "10000")),
        
        # Data sanitization
        data_sanitization_enabled=os.getenv("DATA_SANITIZATION_ENABLED", "true").lower() == "true",
        mask_pii_in_logs=os.getenv("MASK_PII_IN_LOGS", "true").lower() == "true",
        mask_pii_in_responses=os.getenv("MASK_PII_IN_RESPONSES", "true").lower() == "true",
        detect_data_leaks=os.getenv("DETECT_DATA_LEAKS", "true").lower() == "true",
        
        # Session security
        session_timeout=int(os.getenv("SESSION_TIMEOUT", "3600")),
        max_concurrent_sessions=int(os.getenv("MAX_CONCURRENT_SESSIONS", "5")),
        secure_cookies=os.getenv("SECURE_COOKIES", "true").lower() == "true",
        http_only_cookies=os.getenv("HTTP_ONLY_COOKIES", "true").lower() == "true",
        same_site_cookies=os.getenv("SAME_SITE_COOKIES", "strict"),
        
        # File upload security
        file_upload_enabled=os.getenv("FILE_UPLOAD_ENABLED", "true").lower() == "true",
        max_file_size=int(os.getenv("MAX_FILE_SIZE", "10485760")),
        allowed_file_types=os.getenv("ALLOWED_FILE_TYPES", "jpg,jpeg,png,gif,pdf,txt,doc,docx").split(",") if os.getenv("ALLOWED_FILE_TYPES") else ["jpg", "jpeg", "png", "gif", "pdf", "txt", "doc", "docx"],
        scan_uploads=os.getenv("SCAN_UPLOADS", "true").lower() == "true",
        
        # API security
        api_key_required=os.getenv("API_KEY_REQUIRED", "false").lower() == "true",
        api_key_header=os.getenv("API_KEY_HEADER", "X-API-Key"),
        cors_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",") if os.getenv("CORS_ORIGINS") else ["http://localhost:3000", "http://localhost:5173"],
        cors_methods=os.getenv("CORS_METHODS", "GET,POST,PUT,DELETE,OPTIONS").split(",") if os.getenv("CORS_METHODS") else ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        cors_headers=os.getenv("CORS_HEADERS", "Content-Type,Authorization").split(",") if os.getenv("CORS_HEADERS") else ["Content-Type", "Authorization"],
        
        # Monitoring and logging
        security_logging_enabled=os.getenv("SECURITY_LOGGING_ENABLED", "true").lower() == "true",
        audit_log_file=os.getenv("AUDIT_LOG_FILE", "logs/security_audit.log"),
        log_level=os.getenv("SECURITY_LOG_LEVEL", "INFO"),
        
        # Redis
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
        redis_db=int(os.getenv("REDIS_DB", "0")),
        
        # Trusted IPs
        trusted_ips=os.getenv("TRUSTED_IPS", "").split(",") if os.getenv("TRUSTED_IPS") else [],
        
        # Blocked IPs
        blocked_ips=os.getenv("BLOCKED_IPS", "").split(",") if os.getenv("BLOCKED_IPS") else [],
        
        # Security endpoints
        security_stats_endpoint=os.getenv("SECURITY_STATS_ENDPOINT", "/api/security/stats"),
        security_config_endpoint=os.getenv("SECURITY_CONFIG_ENDPOINT", "/api/security/config")
    )
    
    return config

def get_production_security_config() -> SecurityConfig:
    """Get production security configuration with stricter settings"""
    config = load_security_config()
    
    # Override with production-specific settings
    config.debug_mode = False
    config.secure_cookies = True
    config.http_only_cookies = True
    config.same_site_cookies = "strict"
    config.hsts_enabled = True
    config.hsts_include_subdomains = True
    config.hsts_preload = True
    config.csp_enabled = True
    config.csrf_enabled = True
    config.rate_limiting_enabled = True
    config.data_sanitization_enabled = True
    config.mask_pii_in_logs = True
    config.mask_pii_in_responses = True
    config.detect_data_leaks = True
    
    return config

def get_development_security_config() -> SecurityConfig:
    """Get development security configuration with relaxed settings"""
    config = load_security_config()
    
    # Override with development-specific settings
    config.debug_mode = True
    config.hsts_enabled = False
    config.csp_enabled = False
    config.csrf_enabled = False
    config.rate_limiting_enabled = False
    config.mask_pii_in_logs = False
    config.mask_pii_in_responses = False
    
    return config

def validate_security_config(config: SecurityConfig) -> List[str]:
    """Validate security configuration and return list of issues"""
    issues = []
    
    # Check critical security settings
    if not config.jwt_secret_key or len(config.jwt_secret_key) < MIN_JWT_SECRET_LENGTH:
        issues.append(f"JWT secret key should be at least {MIN_JWT_SECRET_LENGTH} characters long")
    elif any(fragment in config.jwt_secret_key.lower() for fragment in JWT_SECRET_PLACEHOLDER_FRAGMENTS):
        issues.append("JWT secret key should not use a placeholder value")
    
    if config.password_min_length < 8:
        issues.append("Password minimum length should be at least 8 characters")
    
    if config.environment == "production" and config.debug_mode:
        issues.append("Debug mode should not be enabled in production")
    
    if config.environment == "production" and not config.secure_cookies:
        issues.append("Secure cookies should be enabled in production")
    
    if config.environment == "production" and not config.hsts_enabled:
        issues.append("HSTS should be enabled in production")
    
    if config.environment == "production" and not config.csrf_enabled:
        issues.append("CSRF protection should be enabled in production")
    
    if config.max_file_size > 50 * 1024 * 1024:  # 50MB
        issues.append("Maximum file size is very large, consider reducing it")
    
    if config.session_timeout > 24 * 3600:  # 24 hours
        issues.append("Session timeout is very long, consider reducing it")
    
    return issues

def get_security_recommendations(config: SecurityConfig) -> List[str]:
    """Get security recommendations based on current configuration"""
    recommendations = []
    
    if config.environment == "production":
        if not config.hsts_preload:
            recommendations.append("Consider enabling HSTS preload for better security")
        
        if not config.api_key_required:
            recommendations.append("Consider enabling API key protection for sensitive endpoints")
        
        if not config.scan_uploads:
            recommendations.append("Enable file upload scanning to prevent malicious files")
        
        if config.max_concurrent_sessions > 10:
            recommendations.append("Consider reducing maximum concurrent sessions")
    
    if config.rate_limiting_enabled:
        if config.rate_limit_default_requests > 1000:
            recommendations.append("Consider reducing default rate limit for better protection")
    
    if not config.data_sanitization_enabled:
        recommendations.append("Enable data sanitization to protect PII")
    
    if not config.detect_data_leaks:
        recommendations.append("Enable data leak detection for better monitoring")
    
    if not config.security_logging_enabled:
        recommendations.append("Enable security logging for better audit trail")
    
    return recommendations

def create_security_directories():
    """Create necessary security directories"""
    directories = [
        "logs",
        "ssl",
        "uploads",
        "temp"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)

def get_environment_specific_config() -> SecurityConfig:
    """Get environment-specific security configuration"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return get_production_security_config()
    elif env == "development":
        return get_development_security_config()
    else:
        return load_security_config()

# Export for use in other modules
__all__ = [
    'SecurityConfig',
    'load_security_config',
    'get_production_security_config',
    'get_development_security_config',
    'validate_security_config',
    'get_security_recommendations',
    'create_security_directories',
    'get_environment_specific_config'
]

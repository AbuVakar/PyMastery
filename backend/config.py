"""
Centralized Configuration for PyMastery
This file contains all configuration settings and environment variables
"""

import os
from typing import Optional

class Config:
    """Application configuration class"""
    
    # API Configuration
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_DEBUG: bool = os.getenv("API_DEBUG", "false").lower() == "true"
    
    # Frontend Configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    FRONTEND_HOST: str = os.getenv("FRONTEND_HOST", "localhost")
    FRONTEND_PORT: int = int(os.getenv("FRONTEND_PORT", "5173"))
    
    # Database Configuration
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017/pymastery")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "pymastery")
    MONGODB_MAX_POOL_SIZE: int = int(os.getenv("MONGODB_MAX_POOL_SIZE", "50"))
    MONGODB_MIN_POOL_SIZE: int = int(os.getenv("MONGODB_MIN_POOL_SIZE", "5"))
    
    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    REDIS_MAX_CONNECTIONS: int = int(os.getenv("REDIS_MAX_CONNECTIONS", "20"))
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Email Configuration
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@pymastery.com")
    FROM_NAME: str = os.getenv("FROM_NAME", "PyMastery Team")
    
    # OAuth Configuration
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "")
    
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    GITHUB_REDIRECT_URI: str = os.getenv("GITHUB_REDIRECT_URI", "")
    
    # Code Execution Configuration
    JUDGE0_API_KEY: str = os.getenv("JUDGE0_API_KEY", "")
    JUDGE0_API_URL: str = os.getenv("JUDGE0_API_URL", "https://judge0-ce.p.rapidapi.com/submissions")
    JUDGE0_HOST: str = os.getenv("JUDGE0_HOST", "judge0-ce.p.rapidapi.com")
    DEFAULT_CPU_TIME_LIMIT: int = int(os.getenv("DEFAULT_CPU_TIME_LIMIT", "5"))
    DEFAULT_MEMORY_LIMIT: int = int(os.getenv("DEFAULT_MEMORY_LIMIT", "128"))
    MAX_CPU_TIME_LIMIT: int = int(os.getenv("MAX_CPU_TIME_LIMIT", "30"))
    MAX_MEMORY_LIMIT: int = int(os.getenv("MAX_MEMORY_LIMIT", "1024"))
    
    # Rate Limiting Configuration
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    LOGIN_RATE_LIMIT: int = int(os.getenv("LOGIN_RATE_LIMIT", "5"))
    LOGIN_RATE_WINDOW: int = int(os.getenv("LOGIN_RATE_WINDOW", "900"))
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    ALLOWED_FILE_TYPES: list = os.getenv("ALLOWED_FILE_TYPES", "jpg,jpeg,png,pdf,txt,py,js").split(",")
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", "uploads")
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    LOG_FILE: str = os.getenv("LOG_FILE", "logs/app.log")
    LOG_MAX_SIZE: int = int(os.getenv("LOG_MAX_SIZE", "10485760"))  # 10MB
    LOG_BACKUP_COUNT: int = int(os.getenv("LOG_BACKUP_COUNT", "5"))
    
    # CORS Configuration
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5184,http://127.0.0.1:5184").split(",")
    CORS_ALLOW_CREDENTIALS: bool = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"
    CORS_ALLOW_METHODS: list = os.getenv("CORS_ALLOW_METHODS", "GET,POST,PUT,DELETE,OPTIONS").split(",")
    CORS_ALLOW_HEADERS: list = os.getenv("CORS_ALLOW_HEADERS", "*").split(",")
    
    # Security Configuration
    SECURITY_PASSWORD_MIN_LENGTH: int = int(os.getenv("SECURITY_PASSWORD_MIN_LENGTH", "8"))
    SECURITY_PASSWORD_REQUIRE_UPPERCASE: bool = os.getenv("SECURITY_PASSWORD_REQUIRE_UPPERCASE", "true").lower() == "true"
    SECURITY_PASSWORD_REQUIRE_LOWERCASE: bool = os.getenv("SECURITY_PASSWORD_REQUIRE_LOWERCASE", "true").lower() == "true"
    SECURITY_PASSWORD_REQUIRE_NUMBERS: bool = os.getenv("SECURITY_PASSWORD_REQUIRE_NUMBERS", "true").lower() == "true"
    SECURITY_PASSWORD_REQUIRE_SPECIAL: bool = os.getenv("SECURITY_PASSWORD_REQUIRE_SPECIAL", "true").lower() == "true"
    
    # Cache Configuration
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour
    SESSION_TTL: int = int(os.getenv("SESSION_TTL", "86400"))  # 24 hours
    CACHE_PREFIX: str = os.getenv("CACHE_PREFIX", "pymastery:")
    
    # Monitoring Configuration
    ENABLE_METRICS: bool = os.getenv("ENABLE_METRICS", "false").lower() == "true"
    METRICS_PORT: int = int(os.getenv("METRICS_PORT", "9090"))
    METRICS_PATH: str = os.getenv("METRICS_PATH", "/metrics")
    
    # Backup Configuration
    BACKUP_ENABLED: bool = os.getenv("BACKUP_ENABLED", "false").lower() == "true"
    BACKUP_SCHEDULE: str = os.getenv("BACKUP_SCHEDULE", "0 2 * * *")  # Daily at 2 AM
    BACKUP_RETENTION_DAYS: int = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))
    BACKUP_S3_BUCKET: str = os.getenv("BACKUP_S3_BUCKET", "")
    BACKUP_ENCRYPTION_KEY: str = os.getenv("BACKUP_ENCRYPTION_KEY", "")
    
    # Development/Testing Configuration
    TESTING: bool = os.getenv("TESTING", "false").lower() == "true"
    DEVELOPMENT: bool = os.getenv("DEVELOPMENT", "false").lower() == "true"
    MOCK_EXTERNAL_APIS: bool = os.getenv("MOCK_EXTERNAL_APIS", "false").lower() == "true"
    
    # Scaling Configuration
    SCALING_ENABLED: bool = os.getenv("SCALING_ENABLED", "true").lower() == "true"
    MIN_REPLICAS: int = int(os.getenv("MIN_REPLICAS", "2"))
    MAX_REPLICAS: int = int(os.getenv("MAX_REPLICAS", "20"))
    SCALE_UP_THRESHOLD: int = int(os.getenv("SCALE_UP_THRESHOLD", "70"))
    SCALE_DOWN_THRESHOLD: int = int(os.getenv("SCALE_DOWN_THRESHOLD", "30"))
    SCALE_UP_COOLDOWN: int = int(os.getenv("SCALE_UP_COOLDOWN", "60"))
    SCALE_DOWN_COOLDOWN: int = int(os.getenv("SCALE_DOWN_COOLDOWN", "300"))
    
    # Load Balancing Configuration
    LOAD_BALANCING_ENABLED: bool = os.getenv("LOAD_BALANCING_ENABLED", "true").lower() == "true"
    LOAD_BALANCING_ALGORITHM: str = os.getenv("LOAD_BALANCING_ALGORITHM", "least_connections")
    HEALTH_CHECK_INTERVAL: int = int(os.getenv("HEALTH_CHECK_INTERVAL", "30"))
    HEALTH_CHECK_TIMEOUT: int = int(os.getenv("HEALTH_CHECK_TIMEOUT", "5"))
    SESSION_AFFINITY: bool = os.getenv("SESSION_AFFINITY", "false").lower() == "true"
    CIRCUIT_BREAKER_THRESHOLD: int = int(os.getenv("CIRCUIT_BREAKER_THRESHOLD", "5"))
    RETRY_ATTEMPTS: int = int(os.getenv("RETRY_ATTEMPTS", "3"))
    
    # CDN Configuration
    CDN_ENABLED: bool = os.getenv("CDN_ENABLED", "true").lower() == "true"
    CDN_PROVIDER: str = os.getenv("CDN_PROVIDER", "cloudflare")
    CDN_API_TOKEN: str = os.getenv("CDN_API_TOKEN", "")
    CDN_ZONE_ID: str = os.getenv("CDN_ZONE_ID", "")
    CDN_DISTRIBUTION_ID: str = os.getenv("CDN_DISTRIBUTION_ID", "")
    CDN_CACHE_TTL: int = int(os.getenv("CDN_CACHE_TTL", "3600"))
    CDN_STATIC_CACHE_TTL: int = int(os.getenv("CDN_STATIC_CACHE_TTL", "86400"))
    CDN_API_CACHE_TTL: int = int(os.getenv("CDN_API_CACHE_TTL", "300"))
    CDN_COMPRESSION_ENABLED: bool = os.getenv("CDN_COMPRESSION_ENABLED", "true").lower() == "true"
    
    # Kubernetes Configuration
    KUBERNETES_ENABLED: bool = os.getenv("KUBERNETES_ENABLED", "false").lower() == "true"
    KUBECONFIG_PATH: str = os.getenv("KUBECONFIG_PATH", "~/.kube/config")
    KUBERNETES_NAMESPACE: str = os.getenv("KUBERNETES_NAMESPACE", "default")
    KUBERNETES_CONTEXT: str = os.getenv("KUBERNETES_CONTEXT", "")
    KUBERNETES_CLUSTER: str = os.getenv("KUBERNETES_CLUSTER", "")
    KUBERNETES_API_SERVER: str = os.getenv("KUBERNETES_API_SERVER", "")
    
    # Multi-Region Configuration
    MULTI_REGION_ENABLED: bool = os.getenv("MULTI_REGION_ENABLED", "false").lower() == "true"
    PRIMARY_REGION: str = os.getenv("PRIMARY_REGION", "us-east-1")
    BACKUP_REGIONS: str = os.getenv("BACKUP_REGIONS", "us-west-2,eu-west-1")
    FAILOVER_MODE: str = os.getenv("FAILOVER_MODE", "automatic")
    FAILOVER_THRESHOLD: int = int(os.getenv("FAILOVER_THRESHOLD", "3"))
    FAILOVER_TIMEOUT: int = int(os.getenv("FAILOVER_TIMEOUT", "30"))
    AUTO_FAILBACK: bool = os.getenv("AUTO_FAILBACK", "true").lower() == "true"
    REPLICATION_TYPE: str = os.getenv("REPLICATION_TYPE", "async")
    REPLICATION_INTERVAL: int = int(os.getenv("REPLICATION_INTERVAL", "60"))
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate critical configuration values"""
        errors = []
        
        # Check critical security values
        if cls.SECRET_KEY == "your-secret-key-change-in-production":
            if not cls.DEVELOPMENT:
                errors.append("SECRET_KEY must be changed in production")
        
        # Check database configuration
        if not cls.MONGODB_URL:
            errors.append("MONGODB_URL is required")
        
        # Check email configuration for production
        if not cls.DEVELOPMENT and not cls.SMTP_USERNAME:
            errors.append("SMTP_USERNAME is required in production")
        
        if errors:
            print("Configuration validation errors:")
            for error in errors:
                print(f"  - {error}")
            return False
        
        return True
    
    @classmethod
    def get_database_url(cls) -> str:
        """Get complete database URL with options"""
        base_url = cls.MONGODB_URL
        options = []
        
        if cls.MONGODB_MAX_POOL_SIZE:
            options.append(f"maxPoolSize={cls.MONGODB_MAX_POOL_SIZE}")
        if cls.MONGODB_MIN_POOL_SIZE:
            options.append(f"minPoolSize={cls.MONGODB_MIN_POOL_SIZE}")
        
        if options:
            separator = "&" if "?" in base_url else "?"
            return f"{base_url}{separator}{'&'.join(options)}"
        
        return base_url
    
    @classmethod
    def get_cors_origins(cls) -> list:
        """Get CORS origins with validation"""
        origins = []
        for origin in cls.CORS_ORIGINS:
            origin = origin.strip()
            if origin:
                origins.append(origin)
        return origins
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production mode"""
        return not cls.DEVELOPMENT and not cls.TESTING
    
    @classmethod
    def is_development(cls) -> bool:
        """Check if running in development mode"""
        return cls.DEVELOPMENT
    
    @classmethod
    def is_testing(cls) -> bool:
        """Check if running in testing mode"""
        return cls.TESTING

# Global config instance
config = Config()

# Environment-specific configurations
class DevelopmentConfig(Config):
    """Development configuration"""
    DEVELOPMENT = True
    DEBUG = True
    API_DEBUG = True
    MOCK_EXTERNAL_APIS = True
    LOG_LEVEL = "DEBUG"

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEVELOPMENT = False
    MOCK_EXTERNAL_APIS = True
    LOG_LEVEL = "WARNING"
    MONGODB_URL = "mongodb://localhost:27017/pymastery_test"

class ProductionConfig(Config):
    """Production configuration"""
    DEVELOPMENT = False
    TESTING = False
    MOCK_EXTERNAL_APIS = False
    LOG_LEVEL = "INFO"
    ENABLE_METRICS = True
    BACKUP_ENABLED = True

# Configuration mapping
config_map = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}

def get_config(env: str = "default") -> Config:
    """Get configuration based on environment"""
    return config_map.get(env, DevelopmentConfig)()

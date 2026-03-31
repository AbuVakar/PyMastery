"""
Middleware package initialization
"""

from .error_middleware import *
# Lazy import for monitoring middleware (depends on missing utilities)
try:
    from .monitoring_middleware import *
except ImportError as e:
    print(f"Warning: Monitoring middleware not available due to missing utilities: {e}")

from .performance_middleware import *
# Lazy import for rate limit middleware (depends on missing utilities)
try:
    from .rate_limit_middleware import *
except ImportError as e:
    print(f"Warning: Rate limit middleware not available due to missing utilities: {e}")

from .security import *
# Lazy import for SSL middleware (depends on missing utilities)
try:
    from .ssl_middleware import *
except ImportError as e:
    print(f"Warning: SSL middleware not available due to missing utilities: {e}")

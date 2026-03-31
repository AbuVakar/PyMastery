"""
Utility functions for PyMastery
Common helper functions and utilities
"""

from typing import List, Optional, Any, Dict
from fastapi import FastAPI
import logging

logger = logging.getLogger(__name__)

def include_routers_safely(app: FastAPI, router_modules: List[Any]) -> None:
    """
    Safely include multiple router modules in FastAPI application
    
    Args:
        app (FastAPI): FastAPI application instance
        router_modules (List[Any]): List of router modules to include
        
    This function handles the repetitive task of checking if a router
    module exists and has a 'router' attribute before including it.
    """
    included_count = 0
    skipped_count = 0
    
    for router_module in router_modules:
        try:
            if router_module and hasattr(router_module, 'router'):
                app.include_router(router_module.router)
                included_count += 1
                logger.info(f"✅ Included router: {router_module.__name__}")
            else:
                skipped_count += 1
                logger.warning(f"⚠️ Skipped router (not available): {getattr(router_module, '__name__', 'Unknown')}")
        except Exception as e:
            skipped_count += 1
            logger.error(f"❌ Error including router {getattr(router_module, '__name__', 'Unknown')}: {e}")
    
    logger.info(f"Router inclusion complete: {included_count} included, {skipped_count} skipped")

def validate_environment_variables(required_vars: List[str], optional_vars: List[str] = None) -> Dict[str, Any]:
    """
    Validate environment variables
    
    Args:
        required_vars (List[str]): List of required environment variable names
        optional_vars (List[str]): List of optional environment variable names
        
    Returns:
        Dict[str, Any]: Dictionary with validation results
    """
    import os
    
    results = {
        'missing_required': [],
        'missing_optional': [],
        'present_required': [],
        'present_optional': [],
        'all_present': True
    }
    
    # Check required variables
    for var in required_vars:
        value = os.getenv(var)
        if value is None or value.strip() == '':
            results['missing_required'].append(var)
            results['all_present'] = False
        else:
            results['present_required'].append(var)
    
    # Check optional variables
    if optional_vars:
        for var in optional_vars:
            value = os.getenv(var)
            if value is None or value.strip() == '':
                results['missing_optional'].append(var)
            else:
                results['present_optional'].append(var)
    
    return results

def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human readable format
    
    Args:
        size_bytes (int): Size in bytes
        
    Returns:
        str: Formatted file size string
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(size_bytes)
    
    while size >= 1024.0 and i < len(size_names) - 1:
        size /= 1024.0
        i += 1
    
    return f"{size:.1f} {size_names[i]}"

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by removing/replacing invalid characters
    
    Args:
        filename (str): Original filename
        
    Returns:
        str: Sanitized filename
    """
    import re
    
    # Remove invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    
    # Replace spaces with underscores
    filename = re.sub(r'\s+', '_', filename)
    
    # Remove leading/trailing dots and spaces
    filename = filename.strip('. ')
    
    # Ensure filename is not empty
    if not filename:
        filename = "unnamed_file"
    
    return filename

def generate_unique_id(prefix: str = "", length: int = 8) -> str:
    """
    Generate unique ID with optional prefix
    
    Args:
        prefix (str): Optional prefix for the ID
        length (int): Length of the random part
        
    Returns:
        str: Unique ID
    """
    import secrets
    import string
    
    # Generate random string
    alphabet = string.ascii_lowercase + string.digits
    random_part = ''.join(secrets.choice(alphabet) for _ in range(length))
    
    # Add prefix if provided
    if prefix:
        return f"{prefix}_{random_part}"
    
    return random_part

def paginate_query(page: int = 1, page_size: int = 20, max_page_size: int = 100) -> tuple:
    """
    Calculate pagination parameters
    
    Args:
        page (int): Page number (1-indexed)
        page_size (int): Number of items per page
        max_page_size (int): Maximum allowed page size
        
    Returns:
        tuple: (skip, limit, page, page_size)
    """
    # Validate and normalize page
    page = max(1, page)
    
    # Validate and normalize page_size
    page_size = max(1, min(page_size, max_page_size))
    
    # Calculate skip and limit
    skip = (page - 1) * page_size
    limit = page_size
    
    return skip, limit, page, page_size

def calculate_pagination_info(total_items: int, page: int, page_size: int) -> Dict[str, Any]:
    """
    Calculate pagination information
    
    Args:
        total_items (int): Total number of items
        page (int): Current page (1-indexed)
        page_size (int): Number of items per page
        
    Returns:
        Dict[str, Any]: Pagination information
    """
    total_pages = (total_items + page_size - 1) // page_size
    
    return {
        'total_items': total_items,
        'total_pages': total_pages,
        'current_page': page,
        'page_size': page_size,
        'has_next': page < total_pages,
        'has_prev': page > 1,
        'next_page': page + 1 if page < total_pages else None,
        'prev_page': page - 1 if page > 1 else None,
    }

def mask_sensitive_data(data: str, mask_char: str = "*", visible_chars: int = 4) -> str:
    """
    Mask sensitive data like passwords, API keys, etc.
    
    Args:
        data (str): Sensitive data to mask
        mask_char (str): Character to use for masking
        visible_chars (int): Number of characters to keep visible at start
        
    Returns:
        str: Masked data
    """
    if not data or len(data) <= visible_chars:
        return mask_char * len(data) if data else ""
    
    return data[:visible_chars] + mask_char * (len(data) - visible_chars)

def validate_email(email: str) -> bool:
    """
    Validate email address format
    
    Args:
        email (str): Email address to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    import re
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password: str) -> Dict[str, Any]:
    """
    Validate password strength
    
    Args:
        password (str): Password to validate
        
    Returns:
        Dict[str, Any]: Validation result with details
    """
    result = {
        'is_valid': True,
        'score': 0,
        'issues': [],
        'suggestions': []
    }
    
    # Length check
    if len(password) < 8:
        result['is_valid'] = False
        result['issues'].append('Password must be at least 8 characters long')
        result['suggestions'].append('Use a longer password')
    else:
        result['score'] += 1
    
    # Uppercase check
    if not any(c.isupper() for c in password):
        result['is_valid'] = False
        result['issues'].append('Password must contain at least one uppercase letter')
        result['suggestions'].append('Add uppercase letters')
    else:
        result['score'] += 1
    
    # Lowercase check
    if not any(c.islower() for c in password):
        result['is_valid'] = False
        result['issues'].append('Password must contain at least one lowercase letter')
        result['suggestions'].append('Add lowercase letters')
    else:
        result['score'] += 1
    
    # Number check
    if not any(c.isdigit() for c in password):
        result['is_valid'] = False
        result['issues'].append('Password must contain at least one number')
        result['suggestions'].append('Add numbers')
    else:
        result['score'] += 1
    
    # Special character check
    special_chars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if not any(c in special_chars for c in password):
        result['is_valid'] = False
        result['issues'].append('Password must contain at least one special character')
        result['suggestions'].append('Add special characters')
    else:
        result['score'] += 1
    
    # Common patterns check
    common_patterns = ['password', '123456', 'qwerty', 'admin', 'letmein']
    if any(pattern in password.lower() for pattern in common_patterns):
        result['score'] -= 2
        result['suggestions'].append('Avoid common password patterns')
    
    return result

def format_duration(seconds: float) -> str:
    """
    Format duration in human readable format
    
    Args:
        seconds (float): Duration in seconds
        
    Returns:
        str: Formatted duration string
    """
    if seconds < 1:
        return f"{int(seconds * 1000)}ms"
    elif seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        remaining_seconds = int(seconds % 60)
        return f"{minutes}m {remaining_seconds}s"
    else:
        hours = int(seconds // 3600)
        remaining_minutes = int((seconds % 3600) // 60)
        return f"{hours}h {remaining_minutes}m"

def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to specified maximum length
    
    Args:
        text (str): Text to truncate
        max_length (int): Maximum length
        suffix (str): Suffix to add when truncated
        
    Returns:
        str: Truncated text
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix

def deep_merge_dict(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deep merge two dictionaries
    
    Args:
        dict1 (Dict[str, Any]): First dictionary
        dict2 (Dict[str, Any]): Second dictionary
        
    Returns:
        Dict[str, Any]: Merged dictionary
    """
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dict(result[key], value)
        else:
            result[key] = value
    
    return result

def get_client_ip(request) -> str:
    """
    Get client IP address from request
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Client IP address
    """
    # Check for forwarded IP
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    # Check for real IP
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    
    # Fall back to client IP
    return request.client.host if request.client else "unknown"

def is_safe_url(url: str, allowed_hosts: List[str]) -> bool:
    """
    Check if URL is safe for redirect
    
    Args:
        url (str): URL to check
        allowed_hosts (List[str]): List of allowed hosts
        
    Returns:
        bool: True if safe, False otherwise
    """
    from urllib.parse import urlparse
    
    if not url:
        return False
    
    parsed = urlparse(url)
    
    # Allow relative URLs
    if not parsed.netloc:
        return True
    
    # Check if host is in allowed list
    return parsed.netloc in allowed_hosts

def generate_slug(text: str) -> str:
    """
    Generate URL-friendly slug from text
    
    Args:
        text (str): Text to convert to slug
        
    Returns:
        str: URL-friendly slug
    """
    import re
    
    # Convert to lowercase and replace spaces with hyphens
    slug = text.lower().strip()
    
    # Remove special characters except hyphens and underscores
    slug = re.sub(r'[^a-z0-9\s-_]', '', slug)
    
    # Replace spaces and multiple hyphens with single hyphen
    slug = re.sub(r'[\s-]+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    return slug

# Export all utility functions
__all__ = [
    'include_routers_safely',
    'validate_environment_variables',
    'format_file_size',
    'sanitize_filename',
    'generate_unique_id',
    'paginate_query',
    'calculate_pagination_info',
    'mask_sensitive_data',
    'validate_email',
    'validate_password_strength',
    'format_duration',
    'truncate_text',
    'deep_merge_dict',
    'get_client_ip',
    'is_safe_url',
    'generate_slug',
]

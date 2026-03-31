"""
Database package initialization
"""
from .mongodb import get_database, get_users_collection, get_progress_collection, get_code_submissions_collection

__all__ = [
    'get_database',
    'get_users_collection', 
    'get_progress_collection',
    'get_code_submissions_collection'
]

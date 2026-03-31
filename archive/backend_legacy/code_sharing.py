from typing import List, Optional
from datetime import datetime
import secrets
from fastapi import HTTPException, Depends
from pydantic import BaseModel
from main import database, users_collection

# Database collection for code snippets
code_snippets_collection = database.code_snippets

class CodeSnippet(BaseModel):
    id: str
    title: str
    code: str
    language: str
    author_id: str
    author_name: str
    created_at: datetime
    is_public: bool = True
    description: Optional[str] = None

class CodeSnippetCreate(BaseModel):
    title: str
    code: str
    language: str
    description: Optional[str] = None

class CodeSnippetResponse(BaseModel):
    id: str
    title: str
    code: str
    language: str
    author_name: str
    created_at: datetime
    description: Optional[str] = None
    share_url: str

def generate_share_id():
    """Generate a unique 8-character share ID"""
    return secrets.token_urlsafe(6)[:8]

async def create_code_snippet(snippet_data: CodeSnippetCreate, user_id: str, user_name: str) -> CodeSnippetResponse:
    """Create a new code snippet and return shareable link"""
    # Generate unique share ID
    share_id = generate_share_id()
    
    # Ensure uniqueness
    while await code_snippets_collection.find_one({"id": share_id}):
        share_id = generate_share_id()
    
    snippet = CodeSnippet(
        id=share_id,
        title=snippet_data.title,
        code=snippet_data.code,
        language=snippet_data.language,
        author_id=user_id,
        author_name=user_name,
        created_at=datetime.utcnow(),
        description=snippet_data.description
    )
    
    # Save to database
    await code_snippets_collection.insert_one(snippet.dict())
    
    # Generate share URL
    share_url = f"http://localhost:5173/share/{share_id}"
    
    return CodeSnippetResponse(
        id=snippet.id,
        title=snippet.title,
        code=snippet.code,
        language=snippet.language,
        author_name=snippet.author_name,
        created_at=snippet.created_at,
        description=snippet.description,
        share_url=share_url
    )

async def get_code_snippet(share_id: str) -> Optional[CodeSnippet]:
    """Get a code snippet by share ID"""
    snippet_data = await code_snippets_collection.find_one({"id": share_id})
    if snippet_data:
        return CodeSnippet(**snippet_data)
    return None

async def get_user_snippets(user_id: str) -> List[CodeSnippetResponse]:
    """Get all code snippets by a user"""
    snippets = await code_snippets_collection.find({"author_id": user_id}).to_list(None)
    
    result = []
    for snippet in snippets:
        share_url = f"http://localhost:5173/share/{snippet['id']}"
        result.append(CodeSnippetResponse(
            id=snippet['id'],
            title=snippet['title'],
            code=snippet['code'],
            language=snippet['language'],
            author_name=snippet['author_name'],
            created_at=snippet['created_at'],
            description=snippet.get('description'),
            share_url=share_url
        ))
    
    return result

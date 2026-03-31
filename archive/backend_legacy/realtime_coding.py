"""
Real-Time Coding - Live Collaboration Backend
Provides real-time collaborative coding, live sharing, and synchronized development
"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import asyncio
from enum import Enum

from database.mongodb import get_database
from services.openai_service import OpenAIService
from services.user_service import UserService

router = APIRouter(prefix="/api/v1/realtime-coding", tags=["Real-Time Coding"])

class CollaborationRole(str, Enum):
    DRIVER = "driver"
    NAVIGATOR = "navigator"
    OBSERVER = "observer"
    REVIEWER = "reviewer"

class CodeChangeType(str, Enum):
    INSERT = "insert"
    DELETE = "delete"
    REPLACE = "replace"
    CURSOR_MOVE = "cursor_move"
    SELECTION_CHANGE = "selection_change"

class SessionStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"
    IDLE = "idle"

class CodeFile(BaseModel):
    id: str
    name: str
    content: str
    language: str
    path: str
    size: int
    last_modified: datetime
    created_at: datetime
    created_by: str

class CodeChange(BaseModel):
    id: str
    session_id: str
    user_id: str
    change_type: CodeChangeType
    position: int
    length: int
    content: str
    timestamp: datetime
    cursor_position: Optional[int]
    selection_start: Optional[int]
    selection_end: Optional[int]

class CollaborativeSession(BaseModel):
    id: str
    title: str
    description: str
    created_by: str
    created_at: datetime
    expires_at: datetime
    status: SessionStatus
    max_participants: int
    current_participants: List[str]
    files: List[CodeFile]
    active_file_id: str
    settings: Dict[str, Any]
    permissions: Dict[str, List[str]]  # user_id -> [permissions]

class Participant(BaseModel):
    user_id: str
    username: str
    avatar_url: Optional[str]
    role: CollaborationRole
    joined_at: datetime
    last_active: datetime
    cursor_position: int
    selection: Optional[Dict[str, int]]
    is_online: bool
    permissions: List[str]

class RealTimeCodingEngine:
    def __init__(self):
        self.openai_service = OpenAIService()
        self.user_service = UserService()
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.session_participants: Dict[str, List[str]] = {}
        self.user_sessions: Dict[str, str] = {}  # user_id -> session_id
        self.websocket_connections: Dict[str, WebSocket] = {}
        
    async def create_collaborative_session(self, creator_id: str, title: str, description: str, 
                                         max_participants: int = 4, expires_hours: int = 24) -> CollaborativeSession:
        """Create a new real-time coding session"""
        
        session = CollaborativeSession(
            id=f"session_{datetime.utcnow().timestamp()}",
            title=title,
            description=description,
            created_by=creator_id,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=expires_hours),
            status=SessionStatus.ACTIVE,
            max_participants=max_participants,
            current_participants=[creator_id],
            files=[],
            active_file_id="",
            settings={
                "auto_save": True,
                "auto_save_interval": 30,
                "allow_anonymous": False,
                "require_approval": False,
                "language": "python"
            },
            permissions={creator_id: ["read", "write", "admin", "invite"]}
        )
        
        # Save session to database
        db = await get_database()
        await db.collaborative_sessions.insert_one(session.dict())
        
        # Initialize session in memory
        self.active_sessions[session.id] = {
            "session": session.dict(),
            "files": {},
            "participants": {},
            "changes": [],
            "last_activity": datetime.utcnow()
        }
        
        self.session_participants[session.id] = [creator_id]
        self.user_sessions[creator_id] = session.id
        
        return session
    
    async def join_session(self, user_id: str, session_id: str, role: CollaborationRole = CollaborationRole.OBSERVER) -> bool:
        """Join a collaborative coding session"""
        
        db = await get_database()
        
        # Get session
        session = await db.collaborative_sessions.find_one({"id": session_id})
        if not session:
            return False
        
        # Check if session is full
        if len(session["current_participants"]) >= session["max_participants"]:
            return False
        
        # Check if session is expired
        if datetime.utcnow() > session["expires_at"]:
            return False
        
        # Get user info
        user = await self.user_service.get_user_by_id(user_id)
        if not user:
            return False
        
        # Add participant to session
        participant = Participant(
            user_id=user_id,
            username=user.username,
            avatar_url=user.avatar_url,
            role=role,
            joined_at=datetime.utcnow(),
            last_active=datetime.utcnow(),
            cursor_position=0,
            selection=None,
            is_online=True,
            permissions=["read"] if role == CollaborationRole.OBSERVER else ["read", "write"]
        )
        
        # Update database
        await db.collaborative_sessions.update_one(
            {"id": session_id},
            {"$push": {"current_participants": user_id}}
        )
        
        # Update memory
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["participants"][user_id] = participant.dict()
            self.session_participants[session_id].append(user_id)
            self.user_sessions[user_id] = session_id
        
        return True
    
    async def leave_session(self, user_id: str, session_id: str) -> bool:
        """Leave a collaborative coding session"""
        
        db = await get_database()
        
        # Update database
        result = await db.collaborative_sessions.update_one(
            {"id": session_id},
            {"$pull": {"current_participants": user_id}}
        )
        
        if result.modified_count > 0:
            # Update memory
            if session_id in self.active_sessions:
                self.active_sessions[session_id]["participants"].pop(user_id, None)
                if user_id in self.session_participants[session_id]:
                    self.session_participants[session_id].remove(user_id)
            
            if user_id in self.user_sessions:
                del self.user_sessions[user_id]
            
            return True
        
        return False
    
    async def create_file(self, session_id: str, user_id: str, name: str, content: str, language: str, path: str) -> CodeFile:
        """Create a new file in the collaborative session"""
        
        file = CodeFile(
            id=f"file_{datetime.utcnow().timestamp()}",
            name=name,
            content=content,
            language=language,
            path=path,
            size=len(content.encode('utf-8')),
            last_modified=datetime.utcnow(),
            created_at=datetime.utcnow(),
            created_by=user_id
        )
        
        # Save to database
        db = await get_database()
        await db.collaborative_sessions.update_one(
            {"id": session_id},
            {"$push": {"files": file.dict()}}
        )
        
        # Update memory
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["files"][file.id] = file.dict()
        
        # Broadcast to session participants
        await self.broadcast_to_session(session_id, {
            "type": "file_created",
            "file": file.dict(),
            "user_id": user_id
        })
        
        return file
    
    async def update_file(self, session_id: str, user_id: str, file_id: str, content: str) -> CodeFile:
        """Update file content"""
        
        db = await get_database()
        
        # Get current file
        session = await db.collaborative_sessions.find_one({"id": session_id, "files.id": file_id})
        if not session:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Find and update file
        updated_file = None
        for file in session["files"]:
            if file["id"] == file_id:
                file["content"] = content
                file["last_modified"] = datetime.utcnow()
                file["size"] = len(content.encode('utf-8'))
                updated_file = file
                break
        
        if not updated_file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Update database
        await db.collaborative_sessions.update_one(
            {"id": session_id, "files.id": file_id},
            {"$set": {"files.$": updated_file}}
        )
        
        # Update memory
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["files"][file_id] = updated_file
        
        # Broadcast to session participants
        await self.broadcast_to_session(session_id, {
            "type": "file_updated",
            "file_id": file_id,
            "content": content,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return CodeFile(**updated_file)
    
    async def apply_code_change(self, session_id: str, user_id: str, file_id: str, 
                              change_type: CodeChangeType, position: int, length: int, 
                              content: str, cursor_position: Optional[int] = None,
                              selection: Optional[Dict[str, int]] = None) -> CodeChange:
        """Apply a code change and broadcast to participants"""
        
        change = CodeChange(
            id=f"change_{datetime.utcnow().timestamp()}",
            session_id=session_id,
            user_id=user_id,
            change_type=change_type,
            position=position,
            length=length,
            content=content,
            timestamp=datetime.utcnow(),
            cursor_position=cursor_position,
            selection_start=selection.get("start") if selection else None,
            selection_end=selection.get("end") if selection else None
        )
        
        # Get current file content
        db = await get_database()
        session = await db.collaborative_sessions.find_one({"id": session_id, "files.id": file_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session or file not found")
        
        current_file = None
        for file in session["files"]:
            if file["id"] == file_id:
                current_file = file
                break
        
        if not current_file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Apply change to content
        new_content = current_file["content"]
        
        if change_type == CodeChangeType.INSERT:
            new_content = new_content[:position] + content + new_content[position:]
        elif change_type == CodeChangeType.DELETE:
            new_content = new_content[:position] + new_content[position + length:]
        elif change_type == CodeChangeType.REPLACE:
            new_content = new_content[:position] + content + new_content[position + length:]
        
        # Update file
        await self.update_file(session_id, user_id, file_id, new_content)
        
        # Store change in memory
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["changes"].append(change.dict())
            # Keep only last 100 changes
            if len(self.active_sessions[session_id]["changes"]) > 100:
                self.active_sessions[session_id]["changes"] = self.active_sessions[session_id]["changes"][-100:]
        
        # Broadcast change to participants
        await self.broadcast_to_session(session_id, {
            "type": "code_change",
            "change": change.dict(),
            "file_id": file_id,
            "user_id": user_id
        })
        
        return change
    
    async def update_cursor_position(self, session_id: str, user_id: str, cursor_position: int, 
                                   selection: Optional[Dict[str, int]] = None):
        """Update user's cursor position and broadcast"""
        
        if session_id in self.active_sessions and user_id in self.active_sessions[session_id]["participants"]:
            participant = self.active_sessions[session_id]["participants"][user_id]
            participant["cursor_position"] = cursor_position
            participant["selection"] = selection
            participant["last_active"] = datetime.utcnow()
            
            # Broadcast to other participants
            await self.broadcast_to_session(session_id, {
                "type": "cursor_update",
                "user_id": user_id,
                "cursor_position": cursor_position,
                "selection": selection
            }, exclude_user=user_id)
    
    async def get_session_participants(self, session_id: str) -> List[Participant]:
        """Get all participants in a session"""
        
        if session_id in self.active_sessions:
            participants = []
            for participant_data in self.active_sessions[session_id]["participants"].values():
                participants.append(Participant(**participant_data))
            return participants
        
        return []
    
    async def get_session_files(self, session_id: str) -> List[CodeFile]:
        """Get all files in a session"""
        
        if session_id in self.active_sessions:
            files = []
            for file_data in self.active_sessions[session_id]["files"].values():
                files.append(CodeFile(**file_data))
            return files
        
        return []
    
    async def get_session_changes(self, session_id: str, limit: int = 50) -> List[CodeChange]:
        """Get recent changes in a session"""
        
        if session_id in self.active_sessions:
            changes = self.active_sessions[session_id]["changes"][-limit:]
            return [CodeChange(**change) for change in changes]
        
        return []
    
    async def broadcast_to_session(self, session_id: str, message: Dict[str, Any], exclude_user: Optional[str] = None):
        """Broadcast a message to all participants in a session"""
        
        if session_id in self.session_participants:
            for user_id in self.session_participants[session_id]:
                if exclude_user and user_id == exclude_user:
                    continue
                
                if user_id in self.websocket_connections:
                    try:
                        await self.websocket_connections[user_id].send_text(json.dumps(message))
                    except:
                        # Connection might be closed
                        pass
    
    async def handle_websocket_connection(self, websocket: WebSocket, user_id: str, session_id: str):
        """Handle WebSocket connection for real-time collaboration"""
        
        await websocket.accept()
        
        # Store connection
        self.websocket_connections[user_id] = websocket
        
        # Send initial session state
        participants = await self.get_session_participants(session_id)
        files = await self.get_session_files(session_id)
        
        await websocket.send_text(json.dumps({
            "type": "session_state",
            "participants": [p.dict() for p in participants],
            "files": [f.dict() for f in files],
            "session_id": session_id
        }))
        
        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                await self.handle_websocket_message(user_id, session_id, message)
                
        except WebSocketDisconnect:
            # Clean up connection
            if user_id in self.websocket_connections:
                del self.websocket_connections[user_id]
            
            # Update participant status
            if session_id in self.active_sessions and user_id in self.active_sessions[session_id]["participants"]:
                self.active_sessions[session_id]["participants"][user_id]["is_online"] = False
    
    async def handle_websocket_message(self, user_id: str, session_id: str, message: Dict[str, Any]):
        """Handle WebSocket message"""
        
        message_type = message.get("type")
        
        if message_type == "code_change":
            await self.apply_code_change(
                session_id, user_id, message["file_id"], 
                CodeChangeType(message["change_type"]),
                message["position"], message["length"], message["content"],
                message.get("cursor_position"), message.get("selection")
            )
        
        elif message_type == "cursor_update":
            await self.update_cursor_position(
                session_id, user_id, message["cursor_position"], message.get("selection")
            )
        
        elif message_type == "file_create":
            await self.create_file(
                session_id, user_id, message["name"], message["content"],
                message["language"], message["path"]
            )
        
        elif message_type == "file_update":
            await self.update_file(session_id, user_id, message["file_id"], message["content"])
        
        elif message_type == "chat":
            await self.broadcast_to_session(session_id, {
                "type": "chat",
                "user_id": user_id,
                "message": message["message"],
                "timestamp": datetime.utcnow().isoformat()
            })
        
        elif message_type == "typing":
            await self.broadcast_to_session(session_id, {
                "type": "typing",
                "user_id": user_id,
                "is_typing": message["is_typing"]
            }, exclude_user=user_id)
    
    async def get_session_analytics(self, session_id: str) -> Dict[str, Any]:
        """Get session analytics and statistics"""
        
        if session_id not in self.active_sessions:
            return {}
        
        session_data = self.active_sessions[session_id]
        
        # Calculate metrics
        participants = session_data["participants"]
        files = session_data["files"]
        changes = session_data["changes"]
        
        total_participants = len(participants)
        active_participants = len([p for p in participants.values() if p["is_online"]])
        total_files = len(files)
        total_changes = len(changes)
        
        # Calculate engagement metrics
        if changes:
            recent_changes = [c for c in changes if (datetime.utcnow() - c["timestamp"]).total_seconds() < 3600]
            engagement_score = len(recent_changes) / max(total_participants, 1)
        else:
            engagement_score = 0.0
        
        # Calculate collaboration metrics
        user_contributions = {}
        for change in changes:
            user_id = change["user_id"]
            user_contributions[user_id] = user_contributions.get(user_id, 0) + 1
        
        return {
            "session_id": session_id,
            "total_participants": total_participants,
            "active_participants": active_participants,
            "total_files": total_files,
            "total_changes": total_changes,
            "engagement_score": min(1.0, engagement_score),
            "user_contributions": user_contributions,
            "session_duration": (datetime.utcnow() - session_data["session"]["created_at"]).total_seconds(),
            "last_activity": session_data["last_activity"]
        }

# Initialize real-time coding engine
realtime_engine = RealTimeCodingEngine()

@router.post("/sessions")
async def create_session(creator_id: str, title: str, description: str, max_participants: int = 4, expires_hours: int = 24):
    """Create a new collaborative coding session"""
    try:
        session = await realtime_engine.create_collaborative_session(
            creator_id, title, description, max_participants, expires_hours
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session creation error: {str(e)}")

@router.post("/sessions/{session_id}/join")
async def join_session(user_id: str, session_id: str, role: CollaborationRole = CollaborationRole.OBSERVER):
    """Join a collaborative coding session"""
    try:
        success = await realtime_engine.join_session(user_id, session_id, role)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session join error: {str(e)}")

@router.post("/sessions/{session_id}/leave")
async def leave_session(user_id: str, session_id: str):
    """Leave a collaborative coding session"""
    try:
        success = await realtime_engine.leave_session(user_id, session_id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session leave error: {str(e)}")

@router.get("/sessions/{session_id}/participants")
async def get_session_participants(session_id: str):
    """Get all participants in a session"""
    try:
        participants = await realtime_engine.get_session_participants(session_id)
        return {"participants": participants}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Participants retrieval error: {str(e)}")

@router.get("/sessions/{session_id}/files")
async def get_session_files(session_id: str):
    """Get all files in a session"""
    try:
        files = await realtime_engine.get_session_files(session_id)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Files retrieval error: {str(e)}")

@router.post("/sessions/{session_id}/files")
async def create_file(session_id: str, user_id: str, name: str, content: str, language: str, path: str):
    """Create a new file in the session"""
    try:
        file = await realtime_engine.create_file(session_id, user_id, name, content, language, path)
        return file
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File creation error: {str(e)}")

@router.put("/sessions/{session_id}/files/{file_id}")
async def update_file(session_id: str, user_id: str, file_id: str, content: str):
    """Update file content"""
    try:
        file = await realtime_engine.update_file(session_id, user_id, file_id, content)
        return file
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File update error: {str(e)}")

@router.post("/sessions/{session_id}/changes")
async def apply_code_change(session_id: str, user_id: str, file_id: str, change_type: CodeChangeType, 
                           position: int, length: int, content: str, cursor_position: Optional[int] = None,
                           selection: Optional[Dict[str, int]] = None):
    """Apply a code change"""
    try:
        change = await realtime_engine.apply_code_change(
            session_id, user_id, file_id, change_type, position, length, content, cursor_position, selection
        )
        return change
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code change error: {str(e)}")

@router.post("/sessions/{session_id}/cursor")
async def update_cursor_position(session_id: str, user_id: str, cursor_position: int, selection: Optional[Dict[str, int]] = None):
    """Update cursor position"""
    try:
        await realtime_engine.update_cursor_position(session_id, user_id, cursor_position, selection)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cursor update error: {str(e)}")

@router.get("/sessions/{session_id}/changes")
async def get_session_changes(session_id: str, limit: int = 50):
    """Get recent changes in a session"""
    try:
        changes = await realtime_engine.get_session_changes(session_id, limit)
        return {"changes": changes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Changes retrieval error: {str(e)}")

@router.get("/sessions/{session_id}/analytics")
async def get_session_analytics(session_id: str):
    """Get session analytics"""
    try:
        analytics = await realtime_engine.get_session_analytics(session_id)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics retrieval error: {str(e)}")

@router.websocket("/ws/{user_id}/{session_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, session_id: str):
    """WebSocket endpoint for real-time collaboration"""
    await realtime_engine.handle_websocket_connection(websocket, user_id, session_id)

"""
Collaboration API Router
Handles real-time collaboration, active users, and chat
"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import asyncio

from database.mongodb import get_database
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/collaboration", tags=["Collaboration"])

class ActiveUser(BaseModel):
    id: str
    name: str
    status: str
    avatar: str
    color: str
    joined_at: datetime

class ChatMessage(BaseModel):
    id: str
    user: str
    message: str
    timestamp: str
    avatar: str

class CollaborationRoom(BaseModel):
    id: str
    name: str
    description: str
    active_users: List[ActiveUser]
    messages: List[ChatMessage]
    code_content: str
    language: str

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_data: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, user_data: Dict):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        
        self.active_connections[room_id].append(websocket)
        self.user_data[user_id] = user_data
        
        # Notify others that user joined
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "user": user_data
        }, exclude_websocket=websocket)

    def disconnect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            
            # Remove from room if empty
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        
        # Notify others that user left
        if user_id in self.user_data:
            asyncio.create_task(self.broadcast_to_room(room_id, {
                "type": "user_left",
                "userId": user_id
            }))
            del self.user_data[user_id]

    async def broadcast_to_room(self, room_id: str, message: Dict, exclude_websocket: WebSocket = None):
        if room_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[room_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_text(json.dumps(message))
                    except:
                        disconnected.append(connection)
            
            # Remove disconnected connections
            for connection in disconnected:
                self.active_connections[room_id].remove(connection)

manager = ConnectionManager()

@router.get("/active-users")
async def get_active_users():
    """Get currently active users in collaboration rooms"""
    try:
        db = await get_database()
        
        # Get active collaboration sessions
        active_sessions = await db.collaboration_sessions.find({
            "last_activity": {"$gte": datetime.utcnow() - timedelta(minutes=5)}
        }).to_list(length=100)
        
        active_users = []
        for session in active_sessions:
            for user in session.get("active_users", []):
                active_users.append({
                    "id": user["id"],
                    "name": user["name"],
                    "status": user["status"],
                    "avatar": user.get("avatar", "👤"),
                    "color": user.get("color", "bg-blue-500")
                })
        
        # Remove duplicates
        seen_users = set()
        unique_users = []
        for user in active_users:
            if user["id"] not in seen_users:
                seen_users.add(user["id"])
                unique_users.append(user)
        
        return {"users": unique_users}
        
    except Exception as e:
        return {"users": []}

@router.get("/rooms")
async def get_collaboration_rooms():
    """Get available collaboration rooms"""
    try:
        db = await get_database()
        
        rooms_cursor = db.collaboration_rooms.find({"status": "active"})
        rooms = await rooms_cursor.to_list(length=20)
        
        room_list = []
        for room in rooms:
            room_list.append({
                "id": str(room["_id"]),
                "name": room["name"],
                "description": room.get("description", ""),
                "active_users": len(room.get("active_users", [])),
                "created_at": room["created_at"],
                "language": room.get("language", "python")
            })
        
        return {"rooms": room_list}
        
    except Exception as e:
        return {"rooms": []}

@router.post("/rooms")
async def create_collaboration_room(
    room_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new collaboration room"""
    try:
        db = await get_database()
        user_id = current_user["sub"]
        
        room = {
            "name": room_data.get("name", "Collaboration Room"),
            "description": room_data.get("description", ""),
            "created_by": user_id,
            "created_at": datetime.utcnow(),
            "status": "active",
            "language": room_data.get("language", "python"),
            "code_content": room_data.get("code_content", ""),
            "active_users": [
                {
                    "id": user_id,
                    "name": current_user.get("name", "Anonymous"),
                    "status": "online",
                    "avatar": "👤",
                    "color": "bg-blue-500",
                    "joined_at": datetime.utcnow()
                }
            ]
        }
        
        result = await db.collaboration_rooms.insert_one(room)
        
        return {
            "message": "Room created successfully",
            "room_id": str(result.inserted_id),
            "room": room
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create room")

@router.get("/rooms/{room_id}")
async def get_room_details(room_id: str):
    """Get details of a specific collaboration room"""
    try:
        db = await get_database()
        
        room = await db.collaboration_rooms.find_one({"_id": room_id})
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Get recent messages
        messages_cursor = db.chat_messages.find({"room_id": room_id}).sort("timestamp", -1).limit(50)
        messages = await messages_cursor.to_list(length=50)
        
        message_list = []
        for msg in reversed(messages):
            message_list.append({
                "id": str(msg["_id"]),
                "user": msg["user_name"],
                "message": msg["message"],
                "timestamp": msg["timestamp"].strftime("%I:%M %p"),
                "avatar": msg.get("avatar", "👤")
            })
        
        room_details = {
            "id": str(room["_id"]),
            "name": room["name"],
            "description": room.get("description", ""),
            "code_content": room.get("code_content", ""),
            "language": room.get("language", "python"),
            "active_users": room.get("active_users", []),
            "messages": message_list
        }
        
        return room_details
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get room details")

@router.post("/rooms/{room_id}/join")
async def join_room(
    room_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Join a collaboration room"""
    try:
        db = await get_database()
        user_id = current_user["sub"]
        
        room = await db.collaboration_rooms.find_one({"_id": room_id})
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Add user to active users if not already there
        user_data = {
            "id": user_id,
            "name": current_user.get("name", "Anonymous"),
            "status": "online",
            "avatar": "👤",
            "color": "bg-blue-500",
            "joined_at": datetime.utcnow()
        }
        
        await db.collaboration_rooms.update_one(
            {"_id": room_id, "active_users.id": {"$ne": user_id}},
            {"$push": {"active_users": user_data}}
        )
        
        # Add join message
        join_message = {
            "room_id": room_id,
            "user_id": user_id,
            "user_name": current_user.get("name", "Anonymous"),
            "message": f"{current_user.get('name', 'Anonymous')} joined the room",
            "type": "system",
            "timestamp": datetime.utcnow()
        }
        
        await db.chat_messages.insert_one(join_message)
        
        return {"message": "Joined room successfully", "user_data": user_data}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to join room")

@router.post("/rooms/{room_id}/leave")
async def leave_room(
    room_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Leave a collaboration room"""
    try:
        db = await get_database()
        user_id = current_user["sub"]
        
        # Remove user from active users
        await db.collaboration_rooms.update_one(
            {"_id": room_id},
            {"$pull": {"active_users": {"id": user_id}}}
        )
        
        # Add leave message
        leave_message = {
            "room_id": room_id,
            "user_id": user_id,
            "user_name": current_user.get("name", "Anonymous"),
            "message": f"{current_user.get('name', 'Anonymous')} left the room",
            "type": "system",
            "timestamp": datetime.utcnow()
        }
        
        await db.chat_messages.insert_one(leave_message)
        
        return {"message": "Left room successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to leave room")

@router.post("/rooms/{room_id}/code")
async def update_room_code(
    room_id: str,
    code_data: Dict[str, str],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update code content in a collaboration room"""
    try:
        db = await get_database()
        user_id = current_user["sub"]
        
        # Update room code
        await db.collaboration_rooms.update_one(
            {"_id": room_id},
            {
                "$set": {
                    "code_content": code_data.get("code", ""),
                    "language": code_data.get("language", "python"),
                    "last_updated": datetime.utcnow(),
                    "last_updated_by": user_id
                }
            }
        )
        
        # Broadcast to WebSocket connections
        await manager.broadcast_to_room(room_id, {
            "type": "code_updated",
            "code": code_data.get("code", ""),
            "language": code_data.get("language", "python"),
            "updated_by": current_user.get("name", "Anonymous")
        })
        
        return {"message": "Code updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update code")

@router.post("/rooms/{room_id}/chat")
async def send_chat_message(
    room_id: str,
    message_data: Dict[str, str],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Send a chat message in a collaboration room"""
    try:
        db = await get_database()
        user_id = current_user["sub"]
        
        # Save message to database
        chat_message = {
            "room_id": room_id,
            "user_id": user_id,
            "user_name": current_user.get("name", "Anonymous"),
            "message": message_data.get("message", ""),
            "type": "user",
            "timestamp": datetime.utcnow()
        }
        
        await db.chat_messages.insert_one(chat_message)
        
        # Broadcast to WebSocket connections
        await manager.broadcast_to_room(room_id, {
            "type": "new_message",
            "user": current_user.get("name", "Anonymous"),
            "message": message_data.get("message", ""),
            "timestamp": datetime.utcnow().strftime("%I:%M %p"),
            "avatar": "👤"
        })
        
        return {"message": "Message sent successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.get("/rooms/{room_id}/messages")
async def get_room_messages(room_id: str, limit: int = 50):
    """Get recent messages from a collaboration room"""
    try:
        db = await get_database()
        
        messages_cursor = db.chat_messages.find({"room_id": room_id}).sort("timestamp", -1).limit(limit)
        messages = await messages_cursor.to_list(length=limit)
        
        message_list = []
        for msg in reversed(messages):
            message_list.append({
                "id": str(msg["_id"]),
                "user": msg["user_name"],
                "message": msg["message"],
                "timestamp": msg["timestamp"].strftime("%I:%M %p"),
                "avatar": msg.get("avatar", "👤"),
                "type": msg.get("type", "user")
            })
        
        return {"messages": message_list}
        
    except Exception as e:
        return {"messages": []}

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """WebSocket endpoint for real-time collaboration"""
    await manager.connect(websocket, room_id, "anonymous", {"name": "Anonymous"})
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Broadcast message to room
            await manager.broadcast_to_room(room_id, message)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, "anonymous")

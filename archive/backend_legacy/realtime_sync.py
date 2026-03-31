"""
Real-time Synchronization Service with WebSocket
"""
import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
import uuid
from fastapi import WebSocket, WebSocketDisconnect
from enum import Enum

logger = logging.getLogger(__name__)

class MessageType(Enum):
    """WebSocket message types"""
    USER_JOIN = "user_join"
    USER_LEAVE = "user_leave"
    CODE_UPDATE = "code_update"
    PROGRESS_UPDATE = "progress_update"
    CHAT_MESSAGE = "chat_message"
    COLLABORATION = "collaboration"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    SUCCESS = "success"

class RoomType(Enum):
    """Room types for different collaboration scenarios"""
    CODE_REVIEW = "code_review"
    STUDY_GROUP = "study_group"
    COMPETITION = "competition"
    MENTORING = "mentoring"
    GENERAL = "general"

class WebSocketManager:
    """WebSocket connection manager for real-time features"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_rooms: Dict[str, Set[str]] = {}  # user_id -> room_ids
        self.room_users: Dict[str, Set[str]] = {}   # room_id -> user_ids
        self.user_metadata: Dict[str, Dict[str, Any]] = {}
        self.room_metadata: Dict[str, Dict[str, Any]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str, metadata: Optional[Dict] = None):
        """Connect a new user"""
        await websocket.accept()
        
        # Store connection
        self.active_connections[user_id] = websocket
        self.user_metadata[user_id] = metadata or {}
        
        # Add to general room by default
        await self.join_room(user_id, RoomType.GENERAL.value)
        
        logger.info(f"User {user_id} connected")
        
        # Broadcast user join
        await self.broadcast_to_room(
            RoomType.GENERAL.value,
            {
                "type": MessageType.USER_JOIN.value,
                "user_id": user_id,
                "metadata": metadata,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def disconnect(self, user_id: str):
        """Disconnect a user"""
        if user_id in self.active_connections:
            # Remove from all rooms
            rooms = list(self.user_rooms.get(user_id, set()))
            for room_id in rooms:
                await self.leave_room(user_id, room_id)
            
            # Remove connection
            del self.active_connections[user_id]
            del self.user_metadata[user_id]
            
            logger.info(f"User {user_id} disconnected")
    
    async def join_room(self, user_id: str, room_id: str, room_metadata: Optional[Dict] = None):
        """Join a room"""
        if user_id not in self.active_connections:
            return
        
        # Initialize room if needed
        if room_id not in self.room_users:
            self.room_users[room_id] = set()
            self.room_metadata[room_id] = room_metadata or {}
        
        # Add user to room
        self.room_users[room_id].add(user_id)
        
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)
        
        logger.info(f"User {user_id} joined room {room_id}")
        
        # Notify room members
        await self.broadcast_to_room(
            room_id,
            {
                "type": MessageType.USER_JOIN.value,
                "user_id": user_id,
                "room_id": room_id,
                "metadata": self.user_metadata.get(user_id, {}),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def leave_room(self, user_id: str, room_id: str):
        """Leave a room"""
        if room_id in self.room_users:
            self.room_users[room_id].discard(user_id)
            
            # Clean up empty rooms
            if not self.room_users[room_id]:
                del self.room_users[room_id]
                if room_id in self.room_metadata:
                    del self.room_metadata[room_id]
        
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(user_id)
            
            # Clean up empty user
            if not self.user_rooms[user_id]:
                del self.user_rooms[user_id]
        
        logger.info(f"User {user_id} left room {room_id}")
        
        # Notify room members
        await self.broadcast_to_room(
            room_id,
            {
                "type": MessageType.USER_LEAVE.value,
                "user_id": user_id,
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def send_personal_message(self, user_id: str, message: Dict[str, Any]):
        """Send message to specific user"""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(json.dumps(message))
    
    async def broadcast_to_room(self, room_id: str, message: Dict[str, Any]):
        """Broadcast message to all users in a room"""
        if room_id in self.room_users:
            disconnected_users = []
            
            for user_id in self.room_users[room_id]:
                try:
                    websocket = self.active_connections.get(user_id)
                    if websocket:
                        await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Failed to send message to {user_id}: {str(e)}")
                    disconnected_users.append(user_id)
            
            # Clean up disconnected users
            for user_id in disconnected_users:
                await self.disconnect(user_id)
    
    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcast message to all connected users"""
        disconnected_users = []
        
        for user_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to broadcast to {user_id}: {str(e)}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(user_id)
    
    async def handle_message(self, user_id: str, message: Dict[str, Any]):
        """Handle incoming message from user"""
        message_type = message.get("type")
        
        try:
            if message_type == MessageType.HEARTBEAT.value:
                await self.send_personal_message(user_id, {
                    "type": MessageType.HEARTBEAT.value,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif message_type == MessageType.CODE_UPDATE.value:
                await self.handle_code_update(user_id, message)
            
            elif message_type == MessageType.PROGRESS_UPDATE.value:
                await self.handle_progress_update(user_id, message)
            
            elif message_type == MessageType.CHAT_MESSAGE.value:
                await self.handle_chat_message(user_id, message)
            
            elif message_type == MessageType.COLLABORATION.value:
                await self.handle_collaboration(user_id, message)
            
            else:
                await self.send_personal_message(user_id, {
                    "type": MessageType.ERROR.value,
                    "message": f"Unknown message type: {message_type}"
                })
        
        except Exception as e:
            logger.error(f"Error handling message from {user_id}: {str(e)}")
            await self.send_personal_message(user_id, {
                "type": MessageType.ERROR.value,
                "message": "Internal server error"
            })
    
    async def handle_code_update(self, user_id: str, message: Dict[str, Any]):
        """Handle code update message"""
        room_id = message.get("room_id", RoomType.GENERAL.value)
        code_data = message.get("code", "")
        
        # Broadcast to room (excluding sender)
        if room_id in self.room_users:
            for other_user_id in self.room_users[room_id]:
                if other_user_id != user_id:
                    await self.send_personal_message(other_user_id, {
                        "type": MessageType.CODE_UPDATE.value,
                        "user_id": user_id,
                        "room_id": room_id,
                        "code": code_data,
                        "timestamp": datetime.utcnow().isoformat()
                    })
    
    async def handle_progress_update(self, user_id: str, message: Dict[str, Any]):
        """Handle progress update message"""
        progress_data = message.get("progress", {})
        
        # Broadcast to all rooms user is in
        if user_id in self.user_rooms:
            for room_id in self.user_rooms[user_id]:
                await self.broadcast_to_room(
                    room_id,
                    {
                        "type": MessageType.PROGRESS_UPDATE.value,
                        "user_id": user_id,
                        "progress": progress_data,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
    
    async def handle_chat_message(self, user_id: str, message: Dict[str, Any]):
        """Handle chat message"""
        room_id = message.get("room_id", RoomType.GENERAL.value)
        chat_message = message.get("message", "")
        
        # Broadcast to room
        await self.broadcast_to_room(
            room_id,
            {
                "type": MessageType.CHAT_MESSAGE.value,
                "user_id": user_id,
                "room_id": room_id,
                "message": chat_message,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def handle_collaboration(self, user_id: str, message: Dict[str, Any]):
        """Handle collaboration message"""
        room_id = message.get("room_id", RoomType.GENERAL.value)
        collaboration_data = message.get("data", {})
        
        # Broadcast to room
        await self.broadcast_to_room(
            room_id,
            {
                "type": MessageType.COLLABORATION.value,
                "user_id": user_id,
                "room_id": room_id,
                "data": collaboration_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def get_room_info(self, room_id: str) -> Dict[str, Any]:
        """Get room information"""
        users = []
        if room_id in self.room_users:
            for user_id in self.room_users[room_id]:
                users.append({
                    "user_id": user_id,
                    "metadata": self.user_metadata.get(user_id, {})
                })
        
        return {
            "room_id": room_id,
            "user_count": len(users),
            "users": users,
            "metadata": self.room_metadata.get(room_id, {})
        }
    
    def get_user_info(self, user_id: str) -> Dict[str, Any]:
        """Get user information"""
        rooms = list(self.user_rooms.get(user_id, set()))
        
        return {
            "user_id": user_id,
            "rooms": rooms,
            "metadata": self.user_metadata.get(user_id, {}),
            "is_connected": user_id in self.active_connections
        }

class RealTimeSyncService:
    """Real-time synchronization service"""
    
    def __init__(self):
        self.manager = WebSocketManager()
        self.sync_data: Dict[str, Dict[str, Any]] = {}
        self.lock = asyncio.Lock()
    
    async def sync_data(self, key: str, data: Dict[str, Any], room_id: Optional[str] = None):
        """Sync data across connected clients"""
        async with self.lock:
            self.sync_data[key] = {
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
                "room_id": room_id
            }
        
        # Broadcast sync message
        message = {
            "type": "data_sync",
            "key": key,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "room_id": room_id
        }
        
        if room_id:
            await self.manager.broadcast_to_room(room_id, message)
        else:
            await self.manager.broadcast_to_all(message)
    
    async def get_sync_data(self, key: str) -> Optional[Dict[str, Any]]:
        """Get synced data"""
        async with self.lock:
            return self.sync_data.get(key)
    
    async def create_collaboration_session(self, session_id: str, creator_id: str, metadata: Optional[Dict] = None):
        """Create a collaboration session"""
        room_id = f"collab_{session_id}"
        
        # Create room with metadata
        await self.manager.join_room(creator_id, room_id, {
            "type": "collaboration",
            "session_id": session_id,
            "creator_id": creator_id,
            "created_at": datetime.utcnow().isoformat(),
            **(metadata or {})
        })
        
        return room_id
    
    async def join_collaboration_session(self, session_id: str, user_id: str):
        """Join a collaboration session"""
        room_id = f"collab_{session_id}"
        await self.manager.join_room(user_id, room_id)
        return room_id
    
    async def leave_collaboration_session(self, session_id: str, user_id: str):
        """Leave a collaboration session"""
        room_id = f"collab_{session_id}"
        await self.manager.leave_room(user_id, room_id)
    
    async def broadcast_collaboration_update(self, session_id: str, user_id: str, update_data: Dict[str, Any]):
        """Broadcast collaboration update"""
        room_id = f"collab_{session_id}"
        
        await self.manager.broadcast_to_room(
            room_id,
            {
                "type": MessageType.COLLABORATION.value,
                "session_id": session_id,
                "user_id": user_id,
                "data": update_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

# Global instances
websocket_manager = WebSocketManager()
realtime_sync = RealTimeSyncService()

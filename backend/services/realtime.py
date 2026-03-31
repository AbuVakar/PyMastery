"""
Real-time Service for PyMastery
Handles WebSocket connections, live coding, notifications, and real-time updates
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Set
from fastapi import WebSocket, WebSocketDisconnect
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import asyncio
from collections import defaultdict
import weakref

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time features"""
    
    def __init__(self):
        # Active connections by user
        self.active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        
        # Connection metadata
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}
        
        # Room management
        self.rooms: Dict[str, Set[str]] = defaultdict(set)  # room -> user_ids
        self.user_rooms: Dict[str, Set[str]] = defaultdict(set)  # user_id -> rooms
        
        # Live coding sessions
        self.coding_sessions: Dict[str, Dict[str, Any]] = {}
        
        # Notification queues
        self.notification_queues: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        
        # Weak references for cleanup
        self._cleanup_refs: List[weakref.ref] = []
        
        # Statistics
        self.stats = {
            "total_connections": 0,
            "active_connections": 0,
            "total_messages": 0,
            "coding_sessions": 0,
            "notifications_sent": 0
        }

    async def connect(self, websocket: WebSocket, user_id: str, metadata: Dict[str, Any] = None):
        """Accept WebSocket connection and register user"""
        await websocket.accept()
        
        # Add connection to user's connection set
        self.active_connections[user_id].add(websocket)
        
        # Store connection metadata
        self.connection_metadata[user_id] = {
            "connected_at": datetime.now(timezone.utc),
            "last_activity": datetime.now(timezone.utc),
            "websocket": websocket,
            **(metadata or {})
        }
        
        # Update statistics
        self.stats["total_connections"] += 1
        self.stats["active_connections"] = len(self.active_connections)
        
        # Add cleanup reference
        self._cleanup_refs.append(weakref.ref(websocket, self._cleanup_connection))
        
        logger.info(f"User {user_id} connected. Total connections: {self.stats['active_connections']}")
        
        # Send welcome message
        await self.send_to_user(user_id, {
            "type": "connection_established",
            "message": "Connected to PyMastery real-time features",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id
        })

    def _cleanup_connection(self, ref):
        """Clean up disconnected WebSocket"""
        try:
            # Find user by websocket
            user_id = None
            for uid, connections in self.active_connections.items():
                for ws in connections:
                    if ws == ref():
                        user_id = uid
                        break
                if user_id:
                    break
            
            if user_id:
                self.disconnect_user(user_id)
        except Exception as e:
            logger.error(f"Error in cleanup: {e}")

    async def disconnect_user(self, user_id: str):
        """Disconnect user and clean up connections"""
        # Close all connections for user
        connections = self.active_connections.get(user_id, set())
        for websocket in connections:
            try:
                await websocket.close()
            except Exception:
                pass
        
        # Remove from active connections
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        # Remove from rooms
        if user_id in self.user_rooms:
            for room_id in self.user_rooms[user_id]:
                if user_id in self.rooms[room_id]:
                    self.rooms[room_id].remove(user_id)
            del self.user_rooms[user_id]
        
        # Remove metadata
        if user_id in self.connection_metadata:
            del self.connection_metadata[user_id]
        
        # Update statistics
        self.stats["active_connections"] = len(self.active_connections)
        
        logger.info(f"User {user_id} disconnected. Total connections: {self.stats['active_connections']}")

    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to specific user"""
        if user_id not in self.active_connections:
            return
        
        # Add to notification queue if it's a notification
        if message.get("type") == "notification":
            self.notification_queues[user_id].append(message)
        
        # Send to all connections for user
        disconnected = set()
        for websocket in self.active_connections[user_id]:
            try:
                await websocket.send_text(json.dumps(message))
                self.stats["total_messages"] += 1
            except Exception as e:
                logger.error(f"Error sending to user {user_id}: {e}")
                disconnected.add(websocket)
        
        # Clean up disconnected connections
        if disconnected:
            self.active_connections[user_id] -= disconnected

    async def send_to_room(self, room_id: str, message: Dict[str, Any], exclude_user: Optional[str] = None):
        """Send message to all users in a room"""
        if room_id not in self.rooms:
            return
        
        for user_id in self.rooms[room_id]:
            if user_id != exclude_user:
                await self.send_to_user(user_id, message)

    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcast message to all connected users"""
        for user_id in self.active_connections:
            await self.send_to_user(user_id, message)

    def join_room(self, user_id: str, room_id: str):
        """Add user to a room"""
        self.rooms[room_id].add(user_id)
        self.user_rooms[user_id].add(room_id)
        
        # Notify room members
        asyncio.create_task(self.send_to_room(room_id, {
            "type": "user_joined",
            "user_id": user_id,
            "room_id": room_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))

    def leave_room(self, user_id: str, room_id: str):
        """Remove user from a room"""
        if room_id in self.rooms:
            self.rooms[room_id].discard(user_id)
        
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
        
        # Notify room members
        asyncio.create_task(self.send_to_room(room_id, {
            "type": "user_left",
            "user_id": user_id,
            "room_id": room_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))

    def get_room_users(self, room_id: str) -> List[str]:
        """Get all users in a room"""
        return list(self.rooms.get(room_id, set()))

    def get_user_rooms(self, user_id: str) -> List[str]:
        """Get all rooms a user is in"""
        return list(self.user_rooms.get(user_id, set()))

    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        return {
            **self.stats,
            "active_connections": len(self.active_connections),
            "active_rooms": len(self.rooms),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

# Global connection manager
connection_manager = ConnectionManager()

class RealtimeService:
    """Real-time service for live coding and notifications"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.connection_manager = connection_manager
        
        # Live coding sessions
        self.coding_sessions_collection = db.coding_sessions
        self.code_submissions_collection = db.code_submissions
        
        # Notifications
        self.notifications_collection = db.notifications
        self.user_preferences_collection = db.user_preferences
        
        # Presence tracking
        self.presence_collection = db.presence
        
        # Real-time events
        self.events_collection = db.realtime_events

    async def initialize_service(self):
        """Initialize real-time service"""
        try:
            await self._create_indexes()
            logger.info("Real-time service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize real-time service: {e}")
            raise

    async def _create_indexes(self):
        """Create database indexes for real-time features"""
        # Coding sessions indexes
        await self.coding_sessions_collection.create_index("session_id", unique=True)
        await self.coding_sessions_collection.create_index("created_by")
        await self.coding_sessions_collection.create_index("status")
        await self.coding_sessions_collection.create_index("created_at", -1)
        
        # Notifications indexes
        await self.notifications_collection.create_index("user_id")
        await self.notifications_collection.create_index("type")
        await self.notifications_collection.create_index("read", -1)
        await self.notifications_collection.create_index("created_at", -1)
        
        # Presence indexes
        await self.presence_collection.create_index("user_id")
        await self.presence_collection.create_index("last_seen", -1)
        
        # Events indexes
        await self.events_collection.create_index("type")
        await self.events_collection.create_index("created_at", -1)
        await self.events_collection.create_index("target_user_id")

    async def create_coding_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new live coding session"""
        try:
            session_id = str(ObjectId())
            
            session = {
                "session_id": session_id,
                "title": session_data.get("title", "Untitled Session"),
                "description": session_data.get("description", ""),
                "language": session_data.get("language", "python"),
                "created_by": session_data["created_by"],
                "participants": [session_data["created_by"]],
                "code": session_data.get("code", ""),
                "status": "active",
                "settings": session_data.get("settings", {}),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "last_activity": datetime.now(timezone.utc)
            }
            
            await self.coding_sessions_collection.insert_one(session)
            
            # Create room for session
            room_id = f"coding_session_{session_id}"
            self.connection_manager.join_room(session_data["created_by"], room_id)
            
            # Track event
            await self._track_event("session_created", {
                "session_id": session_id,
                "created_by": session_data["created_by"],
                "language": session["language"]
            })
            
            return session
        except Exception as e:
            logger.error(f"Error creating coding session: {e}")
            raise

    async def join_coding_session(self, session_id: str, user_id: str) -> bool:
        """Join a live coding session"""
        try:
            session = await self.coding_sessions_collection.find_one({"session_id": session_id})
            if not session:
                return False
            
            # Add user to participants
            await self.coding_sessions_collection.update_one(
                {"session_id": session_id},
                {
                    "$addToSet": {"participants": user_id},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
            
            # Join room
            room_id = f"coding_session_{session_id}"
            self.connection_manager.join_room(user_id, room_id)
            
            # Notify other participants
            await self.connection_manager.send_to_room(room_id, {
                "type": "user_joined_session",
                "session_id": session_id,
                "user_id": user_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }, exclude_user=user_id)
            
            # Send session data to new participant
            await self.connection_manager.send_to_user(user_id, {
                "type": "session_data",
                "session": session,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            return True
        except Exception as e:
            logger.error(f"Error joining coding session: {e}")
            return False

    async def leave_coding_session(self, session_id: str, user_id: str) -> bool:
        """Leave a live coding session"""
        try:
            session = await self.coding_sessions_collection.find_one({"session_id": session_id})
            if not session:
                return False
            
            # Remove user from participants
            await self.coding_sessions_collection.update_one(
                {"session_id": session_id},
                {
                    "$pull": {"participants": user_id},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
            
            # Leave room
            room_id = f"coding_session_{session_id}"
            self.connection_manager.leave_room(user_id, room_id)
            
            # Notify other participants
            await self.connection_manager.send_to_room(room_id, {
                "type": "user_left_session",
                "session_id": session_id,
                "user_id": user_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }, exclude_user=user_id)
            
            return True
        except Exception as e:
            logger.error(f"Error leaving coding session: {e}")
            return False

    async def update_session_code(self, session_id: str, user_id: str, code: str, cursor_position: int = None) -> bool:
        """Update code in a live coding session"""
        try:
            session = await self.coding_sessions_collection.find_one({"session_id": session_id})
            if not session:
                return False
            
            # Check if user is participant
            if user_id not in session["participants"]:
                return False
            
            # Update session code
            await self.coding_sessions_collection.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "code": code,
                        "updated_at": datetime.now(timezone.utc),
                        "last_activity": datetime.now(timezone.utc),
                        "last_updated_by": user_id
                    }
                }
            )
            
            # Broadcast code update to all participants
            room_id = f"coding_session_{session_id}"
            await self.connection_manager.send_to_room(room_id, {
                "type": "code_updated",
                "session_id": session_id,
                "user_id": user_id,
                "code": code,
                "cursor_position": cursor_position,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            return True
        except Exception as e:
            logger.error(f"Error updating session code: {e}")
            return False

    async def send_cursor_position(self, session_id: str, user_id: str, cursor_position: int, selection: Dict[str, Any] = None) -> bool:
        """Send cursor position to session participants"""
        try:
            session = await self.coding_sessions_collection.find_one({"session_id": session_id})
            if not session:
                return False
            
            # Check if user is participant
            if user_id not in session["participants"]:
                return False
            
            # Send cursor position to other participants
            room_id = f"coding_session_{session_id}"
            await self.connection_manager.send_to_room(room_id, {
                "type": "cursor_position",
                "session_id": session_id,
                "user_id": user_id,
                "cursor_position": cursor_position,
                "selection": selection,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }, exclude_user=user_id)
            
            return True
        except Exception as e:
            logger.error(f"Error sending cursor position: {e}")
            return False

    async def send_typing_indicator(self, session_id: str, user_id: str, is_typing: bool) -> bool:
        """Send typing indicator to session participants"""
        try:
            session = await self.coding_sessions_collection.find_one({"session_id": session_id})
            if not session:
                return False
            
            # Check if user is participant
            if user_id not in session["participants"]:
                return False
            
            # Send typing indicator to other participants
            room_id = f"coding_session_{session_id}"
            await self.connection_manager.send_to_room(room_id, {
                "type": "typing_indicator",
                "session_id": session_id,
                "user_id": user_id,
                "is_typing": is_typing,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }, exclude_user=user_id)
            
            return True
        except Exception as e:
            logger.error(f"Error sending typing indicator: {e}")
            return False

    async def create_notification(self, notification_data: Dict[str, Any]) -> str:
        """Create a new notification"""
        try:
            notification_id = str(ObjectId())
            
            notification = {
                "notification_id": notification_id,
                "user_id": notification_data["user_id"],
                "type": notification_data["type"],
                "title": notification_data["title"],
                "message": notification_data["message"],
                "data": notification_data.get("data", {}),
                "read": False,
                "created_at": datetime.now(timezone.utc)
            }
            
            await self.notifications_collection.insert_one(notification)
            
            # Send real-time notification to user
            await self.connection_manager.send_to_user(notification["user_id"], {
                "type": "notification",
                "notification": notification,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            # Update statistics
            connection_manager.stats["notifications_sent"] += 1
            
            return notification_id
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            raise

    async def mark_notification_read(self, user_id: str, notification_id: str) -> bool:
        """Mark notification as read"""
        try:
            result = await self.notifications_collection.update_one(
                {"user_id": user_id, "notification_id": notification_id},
                {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return False

    async def get_user_notifications(self, user_id: str, limit: int = 50, unread_only: bool = False) -> List[Dict[str, Any]]:
        """Get user notifications"""
        try:
            query = {"user_id": user_id}
            if unread_only:
                query["read"] = False
            
            notifications = await self.notifications_collection.find(
                query
            ).sort("created_at", -1).limit(limit).to_list(None)
            
            return notifications
        except Exception as e:
            logger.error(f"Error getting user notifications: {e}")
            return []

    async def update_presence(self, user_id: str, presence_data: Dict[str, Any]) -> bool:
        """Update user presence information"""
        try:
            presence = {
                "user_id": user_id,
                "status": presence_data.get("status", "online"),
                "last_seen": datetime.now(timezone.utc),
                "current_activity": presence_data.get("current_activity"),
                "metadata": presence_data.get("metadata", {}),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await self.presence_collection.update_one(
                {"user_id": user_id},
                {"$set": presence},
                upsert=True
            )
            
            # Broadcast presence update to friends
            await self._broadcast_presence_update(user_id, presence)
            
            return True
        except Exception as e:
            logger.error(f"Error updating presence: {e}")
            return False

    async def get_user_presence(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user presence information"""
        try:
            presence = await self.presence_collection.find_one({"user_id": user_id})
            return presence
        except Exception as e:
            logger.error(f"Error getting user presence: {e}")
            return None

    async def get_friends_presence(self, user_id: str) -> List[Dict[str, Any]]:
        """Get presence information for user's friends"""
        try:
            # This would typically involve a friends collection
            # For now, return all online users as a placeholder
            presence_list = await self.presence_collection.find({
                "status": "online",
                "last_seen": {"$gte": datetime.now(timezone.utc) - timedelta(minutes=5)}
            }).to_list(None)
            
            return presence_list
        except Exception as e:
            logger.error(f"Error getting friends presence: {e}")
            return []

    async def _broadcast_presence_update(self, user_id: str, presence: Dict[str, Any]):
        """Broadcast presence update to relevant users"""
        try:
            # Get user's friends (placeholder implementation)
            friends = await self.get_friends_presence(user_id)
            
            # Send presence update to friends
            for friend in friends:
                if friend["user_id"] != user_id:
                    await self.connection_manager.send_to_user(friend["user_id"], {
                        "type": "presence_update",
                        "user_id": user_id,
                        "presence": presence,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
        except Exception as e:
            logger.error(f"Error broadcasting presence update: {e}")

    async def _track_event(self, event_type: str, data: Dict[str, Any]):
        """Track real-time events for analytics"""
        try:
            event = {
                "type": event_type,
                "data": data,
                "timestamp": datetime.now(timezone.utc)
            }
            
            await self.events_collection.insert_one(event)
        except Exception as e:
            logger.error(f"Error tracking event: {e}")

    async def get_realtime_stats(self) -> Dict[str, Any]:
        """Get real-time service statistics"""
        try:
            connection_stats = self.connection_manager.get_connection_stats()
            
            # Additional stats
            active_sessions = await self.coding_sessions_collection.count_documents({
                "status": "active",
                "last_activity": {"$gte": datetime.now(timezone.utc) - timedelta(minutes=5)}
            })
            
            total_notifications = await self.notifications_collection.count_documents({
                "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(hours=24)}
            })
            
            return {
                **connection_stats,
                "active_coding_sessions": active_sessions,
                "notifications_last_24h": total_notifications,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting realtime stats: {e}")
            return {}

# Global service instance
realtime_service = None

async def get_realtime_service(db: AsyncIOMotorDatabase) -> RealtimeService:
    """Get or create real-time service instance"""
    global realtime_service
    
    if realtime_service is None:
        realtime_service = RealtimeService(db)
        await realtime_service.initialize_service()
    
    return realtime_service

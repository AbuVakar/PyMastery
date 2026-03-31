import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildWsUrl } from '../utils/apiBase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

interface Presence {
  user_id: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  last_seen: string;
  current_activity?: string;
  metadata?: Record<string, unknown>;
}

interface CodingSession {
  session_id: string;
  title: string;
  description: string;
  language: string;
  created_by: string;
  participants: string[];
  code: string;
  status: 'active' | 'inactive' | 'ended';
  created_at: string;
  updated_at: string;
  last_activity: string;
}

interface RealtimeMessageData {
  notification?: Notification;
  user_id?: string;
  presence?: Presence;
  session?: CodingSession;
  session_id?: string;
  code?: string;
  message?: string;
  [key: string]: unknown;
}

interface RealtimeMessage {
  type: string;
  data?: RealtimeMessageData;
  timestamp: string;
}

interface RealtimeCommand {
  type: string;
  [key: string]: unknown;
}

export const useRealtime = () => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const [codingSessions, setCodingSessions] = useState<CodingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CodingSession | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<(() => void) | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        data: notification.data
      });
    }
  }, []);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    heartbeatInterval.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }, []);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  // Send WebSocket message
  const sendMessage = useCallback((message: RealtimeCommand) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Update presence
  const updatePresence = useCallback((
    status: Presence['status'],
    activity?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (isConnected) {
      sendMessage({
        type: 'update_presence',
        status,
        current_activity: activity,
        metadata
      });
    }
  }, [isConnected, sendMessage]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: RealtimeMessage) => {
    switch (message.type) {
      case 'connection_established':
        console.log('Real-time connection established');
        break;

      case 'notification':
        if (message.data?.notification) {
          const notification = message.data.notification;
          setNotifications(prev => [notification, ...prev]);
          if (!notification.read) {
            setUnreadCount(prev => prev + 1);
          }
          
          // Show browser notification if permitted
          showBrowserNotification(notification);
        }
        break;

      case 'presence_update':
        if (message.data?.user_id && message.data?.presence) {
          setPresence(prev => ({
            ...prev,
            [message.data.user_id]: message.data.presence
          }));
        }
        break;

      case 'session_data':
        if (message.data?.session) {
          setCurrentSession(message.data.session);
        }
        break;

      case 'code_updated':
        if (message.data?.session_id && message.data?.code !== undefined) {
          setCurrentSession(prev => 
            prev?.session_id === message.data.session_id
              ? { ...prev, code: message.data.code }
              : prev
          );
        }
        break;

      case 'cursor_position':
        // Handle cursor position updates for live coding
        break;

      case 'typing_indicator':
        // Handle typing indicators
        break;

      case 'user_joined_session':
        console.log('User joined session:', message.data);
        break;

      case 'user_left_session':
        console.log('User left session:', message.data);
        break;

      case 'pong':
        // Heartbeat response
        break;

      case 'error':
        console.error('Real-time error:', message.data?.message);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [showBrowserNotification]);

  // Attempt to reconnect
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);
      
      reconnectTimeout.current = setTimeout(() => {
        connectRef.current?.();
      }, delay);
    } else {
      console.log('Max reconnect attempts reached');
      setConnectionStatus('error');
    }
  }, []);

  // WebSocket connection
  const connect = useCallback(() => {
    if (!token || !user) return;

    try {
      setConnectionStatus('connecting');
      
      // Create WebSocket connection
      const wsUrl = `${buildWsUrl('/api/v1/realtime/ws')}?token=${token}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Start heartbeat
        startHeartbeat();
        
        // Update presence
        updatePresence('online', 'connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        stopHeartbeat();
        
        // Update presence
        updatePresence('offline', 'disconnected');
        
        // Attempt to reconnect
        attemptReconnect();
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [attemptReconnect, handleWebSocketMessage, startHeartbeat, stopHeartbeat, token, updatePresence, user]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    stopHeartbeat();
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [stopHeartbeat]);

  // Create coding session
  const createCodingSession = useCallback(async (sessionData: Partial<CodingSession>) => {
    try {
      // TODO: Implement when realtime endpoints are available in fixedApi
      console.log('Creating coding session:', sessionData);
      const mockSession: CodingSession = {
        session_id: 'session_' + Date.now(),
        title: sessionData.title || 'New Session',
        description: sessionData.description || '',
        language: sessionData.language || 'python',
        created_by: user?.id || 'unknown',
        participants: [user?.id || 'unknown'],
        code: sessionData.code || '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };
      setCodingSessions(prev => [mockSession, ...prev]);
      return mockSession;
    } catch (error) {
      console.error('Failed to create coding session:', error);
      throw error;
    }
  }, [user]);

  // Join coding session
  const joinCodingSession = useCallback((sessionId: string) => {
    if (isConnected) {
      sendMessage({
        type: 'join_session',
        session_id: sessionId
      });
    }
  }, [isConnected, sendMessage]);

  // Get notifications
  const fetchNotifications = useCallback(async (limit: number = 50, unreadOnly: boolean = false) => {
    try {
      // TODO: Implement when notifications endpoint is available in fixedApi
      console.log('Fetching notifications:', { limit, unreadOnly });
      // Mock notifications for now
      const mockNotifications: Notification[] = [];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      // TODO: Implement when notifications endpoint is available in fixedApi
      console.log('Marking notification as read:', notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(async () => {
    try {
      // TODO: Implement when notifications endpoint is available in fixedApi
      console.log('Marking all notifications as read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Get user presence
  const getUserPresence = useCallback(async (userId: string) => {
    try {
      // TODO: Implement when presence endpoint is available in fixedApi
      console.log('Getting user presence:', userId);
      const mockPresence: Presence = {
        user_id: userId,
        status: 'offline',
        last_seen: new Date().toISOString(),
        current_activity: 'coding'
      };
      setPresence(prev => ({
        ...prev,
        [userId]: mockPresence
      }));
      return mockPresence;
    } catch (error) {
      console.error('Failed to get user presence:', error);
      throw error;
    }
  }, []);

  // Get friends presence
  const fetchFriendsPresence = useCallback(async () => {
    try {
      // TODO: Implement when presence endpoint is available in fixedApi
      console.log('Fetching friends presence');
      const presenceMap: Record<string, Presence> = {};
      // Mock empty presence list for now
      setPresence(presenceMap);
    } catch (error) {
      console.error('Failed to fetch friends presence:', error);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return 'Notification' in window && Notification.permission === 'granted';
  }, []);

  // Initialize connection
  useEffect(() => {
    let initializeTimer: NodeJS.Timeout | null = null;

    if (user && token) {
      initializeTimer = setTimeout(() => {
        connect();
        
        // Request notification permission
        void requestNotificationPermission();
        
        // Fetch initial data
        void fetchNotifications();
        void fetchFriendsPresence();
      }, 0);
    }

    return () => {
      if (initializeTimer) {
        clearTimeout(initializeTimer);
      }
      disconnect();
    };
  }, [connect, disconnect, fetchFriendsPresence, fetchNotifications, requestNotificationPermission, token, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    
    // Notifications
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    requestNotificationPermission,
    
    // Presence
    presence,
    getUserPresence,
    fetchFriendsPresence,
    updatePresence,
    
    // Coding sessions
    codingSessions,
    currentSession,
    createCodingSession,
    joinCodingSession,
    
    // Connection management
    connect,
    disconnect,
    sendMessage
  };
};

export default useRealtime;

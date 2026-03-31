import { EventEmitter } from 'events';

// WebSocket connection types
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

// Live coding session types
export interface LiveSession {
  id: string;
  name: string;
  description: string;
  hostId: string;
  participants: Participant[];
  code: string;
  language: string;
  isPublic: boolean;
  maxParticipants: number;
  createdAt: number;
  status: 'active' | 'ended' | 'paused';
}

export interface Participant {
  id: string;
  name: string;
  role: 'host' | 'participant' | 'observer';
  isOnline: boolean;
  cursor?: {
    line: number;
    column: number;
  };
  permissions: {
    canEdit: boolean;
    canExecute: boolean;
    canChat: boolean;
  };
  joinedAt: number;
}

// Chat message types
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  type: 'text' | 'code' | 'system' | 'file';
  timestamp: number;
  sessionId: string;
  replyTo?: string;
  reactions?: Reaction[];
}

export interface Reaction {
  emoji: string;
  userId: string;
  timestamp: number;
}

// Screen sharing types
export interface ScreenShareSession {
  id: string;
  hostId: string;
  participants: string[];
  isActive: boolean;
  quality: 'low' | 'medium' | 'high';
  shareType: 'screen' | 'window' | 'tab';
  startedAt: number;
}

// Real-time event types
export interface CodeChange {
  type: 'insert' | 'delete' | 'replace';
  position: {
    line: number;
    column: number;
  };
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

export interface CursorPosition {
  userId: string;
  position: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  timestamp: number;
}

export interface ExecutionResult {
  sessionId: string;
  userId: string;
  output: string;
  error?: string;
  executionTime: number;
  timestamp: number;
}

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private status: WebSocketStatus = 'disconnected';
  private pingInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private currentSession: LiveSession | null = null;
  private userId: string;

  constructor() {
    super();
    this.url = 'ws://localhost:8000/ws';
    this.userId = this.generateUserId();
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Connection management
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.status = 'connecting';
    this.emit('statusChange', this.status);

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
        
        this.once('connected', () => {
          clearTimeout(timeout);
          resolve(void 0);
        });
        
        this.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

    } catch (error) {
      this.status = 'error';
      this.emit('statusChange', this.status);
      this.emit('error', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.status = 'disconnected';
    this.emit('statusChange', this.status);
  }

  private handleOpen(): void {
    this.status = 'connected';
    this.reconnectAttempts = 0;
    this.emit('statusChange', this.status);
    this.emit('connected');

    // Start ping interval
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', payload: {}, timestamp: Date.now() });
    }, 30000);

    // Send queued messages
    this.flushMessageQueue();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle different message types
      switch (message.type) {
        case 'pong':
          // Ping response, ignore
          break;
        case 'sessionUpdate':
          this.handleSessionUpdate(message.payload);
          break;
        case 'participantJoined':
          this.handleParticipantJoined(message.payload);
          break;
        case 'participantLeft':
          this.handleParticipantLeft(message.payload);
          break;
        case 'codeChange':
          this.handleCodeChange(message.payload);
          break;
        case 'cursorPosition':
          this.handleCursorPosition(message.payload);
          break;
        case 'chatMessage':
          this.handleChatMessage(message.payload);
          break;
        case 'executionResult':
          this.handleExecutionResult(message.payload);
          break;
        case 'screenShareUpdate':
          this.handleScreenShareUpdate(message.payload);
          break;
        case 'error':
          this.emit('error', message.payload);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }

      this.emit('message', message);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    this.status = 'disconnected';
    this.emit('statusChange', this.status);
    this.emit('disconnected', event);

    // Attempt to reconnect if not intentionally closed
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  private handleError(error: Event): void {
    this.status = 'error';
    this.emit('statusChange', this.status);
    this.emit('error', error);
  }

  private attemptReconnect(): void {
    this.status = 'reconnecting';
    this.emit('statusChange', this.status);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.status = 'error';
          this.emit('statusChange', this.status);
          this.emit('error', new Error('Max reconnect attempts reached'));
        }
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Message handling
  private handleSessionUpdate(session: LiveSession): void {
    this.currentSession = session;
    this.emit('sessionUpdate', session);
  }

  private handleParticipantJoined(participant: Participant): void {
    this.emit('participantJoined', participant);
  }

  private handleParticipantLeft(participantId: string): void {
    this.emit('participantLeft', participantId);
  }

  private handleCodeChange(change: CodeChange): void {
    this.emit('codeChange', change);
  }

  private handleCursorPosition(position: CursorPosition): void {
    this.emit('cursorPosition', position);
  }

  private handleChatMessage(message: ChatMessage): void {
    this.emit('chatMessage', message);
  }

  private handleExecutionResult(result: ExecutionResult): void {
    this.emit('executionResult', result);
  }

  private handleScreenShareUpdate(update: ScreenShareSession): void {
    this.emit('screenShareUpdate', update);
  }

  // Message sending
  send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.messageQueue.push(message);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  // Live session methods
  async createSession(sessionData: Partial<LiveSession>): Promise<LiveSession> {
    const message: WebSocketMessage = {
      type: 'createSession',
      payload: {
        ...sessionData,
        hostId: this.userId,
        createdAt: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.send(message);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Session creation timeout')), 10000);
      
      this.once('sessionCreated', (session: LiveSession) => {
        clearTimeout(timeout);
        resolve(session);
      });
      
      this.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async joinSession(sessionId: string): Promise<void> {
    const message: WebSocketMessage = {
      type: 'joinSession',
      payload: { sessionId, userId: this.userId },
      timestamp: Date.now(),
    };

    this.send(message);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Session join timeout')), 10000);
      
      this.once('sessionJoined', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      this.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  leaveSession(sessionId: string): void {
    const message: WebSocketMessage = {
      type: 'leaveSession',
      payload: { sessionId, userId: this.userId },
      timestamp: Date.now(),
    };

    this.send(message);
  }

  // Code collaboration methods
  sendCodeChange(change: CodeChange): void {
    const message: WebSocketMessage = {
      type: 'codeChange',
      payload: change,
      timestamp: Date.now(),
      userId: this.userId,
    };

    this.send(message);
  }

  sendCursorPosition(position: CursorPosition): void {
    const message: WebSocketMessage = {
      type: 'cursorPosition',
      payload: position,
      timestamp: Date.now(),
      userId: this.userId,
    };

    this.send(message);
  }

  executeCode(code: string, language: string, sessionId: string): void {
    const message: WebSocketMessage = {
      type: 'executeCode',
      payload: { code, language, sessionId },
      timestamp: Date.now(),
      userId: this.userId,
    };

    this.send(message);
  }

  // Chat methods
  sendChatMessage(message: string, sessionId: string, type: 'text' | 'code' = 'text'): void {
    const chatMessage: ChatMessage = {
      id: this.generateId(),
      userId: this.userId,
      userName: this.userId, // In real app, this would be user's actual name
      content: message,
      type,
      timestamp: Date.now(),
      sessionId,
    };

    const wsMessage: WebSocketMessage = {
      type: 'chatMessage',
      payload: chatMessage,
      timestamp: Date.now(),
      userId: this.userId,
    };

    this.send(wsMessage);
  }

  // Screen sharing methods
  startScreenShare(sessionId: string, quality: 'low' | 'medium' | 'high' = 'medium'): void {
    const message: WebSocketMessage = {
      type: 'startScreenShare',
      payload: { sessionId, hostId: this.userId, quality },
      timestamp: Date.now(),
      userId: this.userId,
    };

    this.send(message);
  }

  stopScreenShare(sessionId: string): void {
    const message: WebSocketMessage = {
      type: 'stopScreenShare',
      payload: { sessionId, hostId: this.userId },
      timestamp: Date.now(),
      userId: this.userId,
    };

    this.send(message);
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  getCurrentSession(): LiveSession | null {
    return this.currentSession;
  }

  getUserId(): string {
    return this.userId;
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

export default webSocketService;

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';
import {
  Container,
  Card,
  Row,
  Col,
  Text as ResponsiveText,
  Icon as ResponsiveIcon,
  Button as ResponsiveButton,
} from '../components/ResponsiveComponents';
import webSocketService, {
  ChatMessage,
  Reaction,
  WebSocketStatus,
} from '../services/websocketService';

const { width, height } = Dimensions.get('window');

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'session';
  participants: string[];
  messageCount: number;
  lastActivity: number;
  hostId: string;
  isArchived: boolean;
  tags: string[];
}

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
  isTyping: boolean;
  role: 'admin' | 'moderator' | 'member';
}

const LiveChatScreen: React.FC = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>('disconnected');
  const [messageText, setMessageText] = useState('');
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private' | 'session'>('all');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const messageInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    initializeWebSocket();
    loadChatRooms();
    loadOnlineUsers();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const initializeWebSocket = () => {
    // Listen to WebSocket events
    webSocketService.on('statusChange', handleStatusChange);
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('error', handleError);
    webSocketService.on('chatMessage', handleChatMessage);
    webSocketService.on('participantJoined', handleParticipantJoined);
    webSocketService.on('participantLeft', handleParticipantLeft);
    
    // Connect to WebSocket
    webSocketService.connect().catch(console.error);
  };

  const cleanup = () => {
    webSocketService.removeAllListeners();
  };

  const handleStatusChange = (status: WebSocketStatus) => {
    setConnectionStatus(status);
  };

  const handleConnected = () => {
    console.log('WebSocket connected for live chat');
  };

  const handleDisconnected = () => {
    console.log('WebSocket disconnected');
  };

  const handleError = (error: any) => {
    console.error('WebSocket error:', error);
  };

  const handleChatMessage = (message: ChatMessage) => {
    if (currentRoom && message.sessionId === currentRoom.id) {
      setMessages(prev => [...prev, message]);
    }
    
    // Update room's last activity
    setChatRooms(prev => 
      prev.map(room => 
        room.id === message.sessionId 
          ? { ...room, lastActivity: message.timestamp, messageCount: room.messageCount + 1 }
          : room
      )
    );
  };

  const handleParticipantJoined = (participant: any) => {
    // Update online users
    setOnlineUsers(prev => {
      const existing = prev.find(u => u.id === participant.id);
      if (existing) {
        return prev.map(u => 
          u.id === participant.id 
            ? { ...u, status: 'online', lastSeen: Date.now() }
            : u
        );
      } else {
        return [...prev, {
          id: participant.id,
          name: participant.name,
          status: 'online' as const,
          lastSeen: Date.now(),
          isTyping: false,
          role: 'member' as const,
        }];
      }
    });
  };

  const handleParticipantLeft = (participantId: string) => {
    // Update online users
    setOnlineUsers(prev => 
      prev.map(u => 
        u.id === participantId 
          ? { ...u, status: 'offline', lastSeen: Date.now() }
          : u
      )
    );
  };

  const loadChatRooms = async () => {
    try {
      // Mock data for demo
      const mockRooms: ChatRoom[] = [
        {
          id: 'room_1',
          name: 'General Discussion',
          description: 'Open chat for all PyMastery users',
          type: 'public',
          participants: ['user_1', 'user_2', 'user_3', 'user_4'],
          messageCount: 1250,
          lastActivity: Date.now() - 30000,
          hostId: 'admin',
          isArchived: false,
          tags: ['general', 'community'],
        },
        {
          id: 'room_2',
          name: 'Python Help',
          description: 'Get help with Python programming',
          type: 'public',
          participants: ['user_1', 'user_3', 'user_5'],
          messageCount: 890,
          lastActivity: Date.now() - 120000,
          hostId: 'moderator_1',
          isArchived: false,
          tags: ['python', 'help', 'programming'],
        },
        {
          id: 'room_3',
          name: 'JavaScript Study Group',
          description: 'Collaborative JavaScript learning',
          type: 'session',
          participants: ['user_2', 'user_4'],
          messageCount: 456,
          lastActivity: Date.now() - 60000,
          hostId: 'user_2',
          isArchived: false,
          tags: ['javascript', 'study', 'session'],
        },
        {
          id: 'room_4',
          name: 'Private Chat - Alice',
          description: 'Direct conversation with Alice',
          type: 'private',
          participants: ['user_1', 'user_4'],
          messageCount: 234,
          lastActivity: Date.now() - 240000,
          hostId: 'user_1',
          isArchived: false,
          tags: ['private', 'direct'],
        },
      ];
      
      setChatRooms(mockRooms);
    } catch (error: any) {
      console.error('Failed to load chat rooms:', error);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      // Mock data for demo
      const mockUsers: ChatUser[] = [
        {
          id: 'user_1',
          name: 'John Doe',
          status: 'online',
          lastSeen: Date.now(),
          isTyping: false,
          role: 'member',
        },
        {
          id: 'user_2',
          name: 'Jane Smith',
          status: 'online',
          lastSeen: Date.now() - 300000,
          isTyping: true,
          role: 'moderator',
        },
        {
          id: 'user_3',
          name: 'Bob Johnson',
          status: 'away',
          lastSeen: Date.now() - 900000,
          isTyping: false,
          role: 'member',
        },
        {
          id: 'user_4',
          name: 'Alice Brown',
          status: 'online',
          lastSeen: Date.now() - 600000,
          isTyping: false,
          role: 'admin',
        },
        {
          id: 'user_5',
          name: 'Charlie Wilson',
          status: 'offline',
          lastSeen: Date.now() - 3600000,
          isTyping: false,
          role: 'member',
        },
      ];
      
      setOnlineUsers(mockUsers);
    } catch (error: any) {
      console.error('Failed to load online users:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      // Mock data for demo
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg_1',
          userId: 'user_1',
          userName: 'John Doe',
          content: 'Hey everyone! Welcome to the chat room.',
          type: 'text',
          timestamp: Date.now() - 3600000,
          sessionId: roomId,
        },
        {
          id: 'msg_2',
          userId: 'user_2',
          userName: 'Jane Smith',
          content: 'Thanks! Excited to be here!',
          type: 'text',
          timestamp: Date.now() - 3500000,
          sessionId: roomId,
        },
        {
          id: 'msg_3',
          userId: 'user_3',
          userName: 'Bob Johnson',
          content: '```python\ndef hello_world():\n    print("Hello, World!")\n```',
          type: 'code',
          timestamp: Date.now() - 3400000,
          sessionId: roomId,
        },
        {
          id: 'msg_4',
          userId: 'user_4',
          userName: 'Alice Brown',
          content: 'Nice code! Don\'t forget to call the function.',
          type: 'text',
          timestamp: Date.now() - 3300000,
          sessionId: roomId,
          replyTo: 'msg_3',
        },
        {
          id: 'msg_5',
          userId: 'system',
          userName: 'System',
          content: 'Jane Smith is typing...',
          type: 'system',
          timestamp: Date.now() - 30000,
          sessionId: roomId,
        },
      ];
      
      setMessages(mockMessages);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadChatRooms(), loadOnlineUsers()]);
    if (currentRoom) {
      await loadMessages(currentRoom.id);
    }
    setRefreshing(false);
  };

  const joinRoom = async (room: ChatRoom) => {
    try {
      setCurrentRoom(room);
      await loadMessages(room.id);
      
      // Join WebSocket session if it's a session room
      if (room.type === 'session') {
        await webSocketService.joinSession(room.id);
      }
      
      Alert.alert('Success', `Joined ${room.name}`);
    } catch (error: any) {
      console.error('Failed to join room:', error);
      Alert.alert('Error', 'Failed to join room');
    }
  };

  const leaveRoom = () => {
    if (currentRoom) {
      if (currentRoom.type === 'session') {
        webSocketService.leaveSession(currentRoom.id);
      }
      setCurrentRoom(null);
      setMessages([]);
      setReplyingTo(null);
    }
  };

  const sendMessage = () => {
    if (!messageText.trim() || !currentRoom) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      userId: webSocketService.getUserId(),
      userName: 'Current User',
      content: messageText.trim(),
      type: 'text',
      timestamp: Date.now(),
      sessionId: currentRoom.id,
      replyTo: replyingTo?.id,
    };

    // Send message via WebSocket
    webSocketService.sendChatMessage(message.content, currentRoom.id, 'text');

    // Add to local messages immediately for better UX
    setMessages(prev => [...prev, message]);

    // Clear input and reply
    setMessageText('');
    setReplyingTo(null);
    
    // Update room's message count
    setChatRooms(prev => 
      prev.map(room => 
        room.id === currentRoom.id 
          ? { ...room, messageCount: room.messageCount + 1, lastActivity: Date.now() }
          : room
      )
    );
  };

  const sendCodeMessage = (code: string) => {
    if (!code.trim() || !currentRoom) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      userId: webSocketService.getUserId(),
      userName: 'Current User',
      content: code,
      type: 'code',
      timestamp: Date.now(),
      sessionId: currentRoom.id,
    };

    webSocketService.sendChatMessage(code, currentRoom.id, 'code');
    setMessages(prev => [...prev, message]);
    
    setChatRooms(prev => 
      prev.map(room => 
        room.id === currentRoom.id 
          ? { ...room, messageCount: room.messageCount + 1, lastActivity: Date.now() }
          : room
      )
    );
  };

  const addReaction = (messageId: string, emoji: string) => {
    // Add reaction to message
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? {
              ...msg,
              reactions: [
                ...(msg.reactions || []),
                {
                  emoji,
                  userId: webSocketService.getUserId(),
                  timestamp: Date.now(),
                }
              ]
            }
          : msg
      )
    );
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'disconnected': return '#F44336';
      case 'error': return '#F44336';
      case 'reconnecting': return '#FF9800';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'away': return '#FF9800';
      case 'offline': return '#999';
      default: return '#999';
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'public': return '#4CAF50';
      case 'private': return '#2196F3';
      case 'session': return '#FF9800';
      default: return '#666';
    }
  };

  const getFilteredRooms = () => {
    let filtered = chatRooms;

    if (searchQuery) {
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(room => room.type === filterType);
    }

    return filtered;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastActivity = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const ChatRoomCard = ({ room }: { room: ChatRoom }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => joinRoom(room)}
    >
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <View style={[styles.roomTypeIndicator, { backgroundColor: getRoomTypeColor(room.type) }]} />
          <ResponsiveText variant="lg" style={styles.roomName}>
            {room.name}
          </ResponsiveText>
        </View>
        <View style={[styles.roomTypeBadge, { backgroundColor: getRoomTypeColor(room.type) }]}>
          <ResponsiveText variant="xs" style={styles.roomTypeText}>
            {room.type}
          </ResponsiveText>
        </View>
      </View>

      <ResponsiveText variant="sm" style={styles.roomDescription}>
        {room.description}
      </ResponsiveText>

      <View style={styles.roomMeta}>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="people-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {room.participants.length}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="chatbubble-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {room.messageCount}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="time-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {formatLastActivity(room.lastActivity)}
          </ResponsiveText>
        </View>
      </View>

      {room.tags.length > 0 && (
        <View style={styles.roomTags}>
          {room.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <ResponsiveText variant="xs" style={styles.tagText}>
                {tag}
              </ResponsiveText>
            </View>
          ))}
          {room.tags.length > 3 && (
            <View style={styles.tag}>
              <ResponsiveText variant="xs" style={styles.tagText}>
                +{room.tags.length - 3}
              </ResponsiveText>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const MessageItem = ({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) => (
    <View style={[styles.messageItem, isOwn && styles.ownMessage]}>
      {!isOwn && (
        <ResponsiveText variant="sm" style={styles.messageSender}>
          {message.userName}
        </ResponsiveText>
      )}
      
      <View style={[styles.messageBubble, isOwn && styles.ownBubble]}>
        {message.type === 'code' ? (
          <View style={styles.codeBlock}>
            <ResponsiveText variant="sm" style={styles.codeText}>
              {message.content}
            </ResponsiveText>
          </View>
        ) : (
          <ResponsiveText variant="sm" style={styles.messageText}>
            {message.content}
          </ResponsiveText>
        )}
        
        {message.replyTo && (
          <View style={styles.replyIndicator}>
            <ResponsiveIcon name="return-up" size="xs" color="#666" />
            <ResponsiveText variant="xs" style={styles.replyText}>
              Replying to message
            </ResponsiveText>
          </View>
        )}
      </View>

      <View style={styles.messageFooter}>
        <ResponsiveText variant="xs" style={styles.messageTime}>
          {formatTimestamp(message.timestamp)}
        </ResponsiveText>
        
        <View style={styles.messageActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setReplyingTo(message)}
          >
            <ResponsiveIcon name="return-up" size="sm" color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowEmojiPicker(true)}
          >
            <ResponsiveIcon name="happy-outline" size="sm" color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {message.reactions && message.reactions.length > 0 && (
        <View style={styles.reactionsContainer}>
          {message.reactions.map((reaction, index) => (
            <TouchableOpacity
              key={index}
              style={styles.reaction}
              onPress={() => addReaction(message.id, reaction.emoji)}
            >
              <ResponsiveText variant="xs">{reaction.emoji}</ResponsiveText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const OnlineUserItem = ({ user }: { user: ChatUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        setSelectedUser(user);
        setShowUserModal(true);
      }}
    >
      <View style={styles.userHeader}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(user.status) }]} />
        <View style={styles.userInfo}>
          <ResponsiveText variant="md" style={styles.userName}>
            {user.name}
          </ResponsiveText>
          {user.isTyping && (
            <ResponsiveText variant="xs" style={styles.typingIndicator}>
              typing...
            </ResponsiveText>
          )}
        </View>
        <View style={[styles.roleBadge, { backgroundColor: user.role === 'admin' ? '#F44336' : user.role === 'moderator' ? '#FF9800' : '#2196F3' }]}>
          <ResponsiveText variant="xs" style={styles.roleText}>
            {user.role}
          </ResponsiveText>
        </View>
      </View>

      <ResponsiveText variant="xs" style={styles.userStatus}>
        {user.status === 'online' ? 'Online' : user.status === 'away' ? 'Away' : `Last seen ${formatLastActivity(user.lastSeen)}`}
      </ResponsiveText>
    </TouchableOpacity>
  );

  const CreateRoomModal = () => (
    <Modal
      visible={showCreateRoomModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateRoomModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateRoomModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Create Chat Room
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <CreateRoomForm onSubmit={() => setShowCreateRoomModal(false)} />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const UserModal = () => (
    <Modal
      visible={showUserModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowUserModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowUserModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            User Profile
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedUser && (
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <View style={styles.userDetailHeader}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(selectedUser.status) }]} />
                <ResponsiveText variant="xl" style={styles.userDetailName}>
                  {selectedUser.name}
                </ResponsiveText>
              </View>

              <View style={styles.userDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Status
                </ResponsiveText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedUser.status) }]}>
                  <ResponsiveText variant="sm" style={styles.statusText}>
                    {selectedUser.status.toUpperCase()}
                  </ResponsiveText>
                </View>
              </View>

              <View style={styles.userDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Role
                </ResponsiveText>
                <View style={[styles.roleBadge, { backgroundColor: selectedUser.role === 'admin' ? '#F44336' : selectedUser.role === 'moderator' ? '#FF9800' : '#2196F3' }]}>
                  <ResponsiveText variant="sm" style={styles.roleText}>
                    {selectedUser.role.toUpperCase()}
                  </ResponsiveText>
                </View>
              </View>

              <View style={styles.userDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Last Activity
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.userDetailTime}>
                  {new Date(selectedUser.lastSeen).toLocaleString()}
                </ResponsiveText>
              </View>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (currentRoom) {
    return (
      <Container padding margin>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <View style={styles.chatInfo}>
              <TouchableOpacity onPress={leaveRoom}>
                <ResponsiveIcon name="arrow-back" size="lg" />
              </TouchableOpacity>
              <View style={styles.chatDetails}>
                <ResponsiveText variant="lg" style={styles.chatTitle}>
                  {currentRoom.name}
                </ResponsiveText>
                <ResponsiveText variant="xs" style={styles.chatSubtitle}>
                  {currentRoom.participants.length} participants
                </ResponsiveText>
              </View>
            </View>
            <View style={styles.chatActions}>
              <TouchableOpacity style={styles.connectionStatus}>
                <ResponsiveIcon name="wifi-outline" size="md" color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreButton}>
                <ResponsiveIcon name="ellipsis-vertical" size="md" color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <View style={styles.messagesContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={({ item }) => (
                <MessageItem 
                  message={item} 
                  isOwn={item.userId === webSocketService.getUserId()} 
                />
              )}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
            />
          </View>

          {/* Reply Indicator */}
          {replyingTo && (
            <View style={styles.replyBar}>
              <View style={styles.replyContent}>
                <ResponsiveText variant="xs" style={styles.replyLabel}>
                  Replying to {replyingTo.userName}
                </ResponsiveText>
                <ResponsiveText variant="xs" style={styles.replyMessageText}>
                  {replyingTo.content.slice(0, 50)}...
                </ResponsiveText>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <ResponsiveIcon name="close" size="sm" />
              </TouchableOpacity>
            </View>
          )}

          {/* Message Input */}
          <View style={styles.messageInputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <ResponsiveIcon name="attach-outline" size="md" />
            </TouchableOpacity>
            
            <TextInput
              ref={messageInputRef}
              style={styles.messageInput}
              placeholder="Type a message..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity style={styles.emojiButton}>
              <ResponsiveIcon name="happy-outline" size="md" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!messageText.trim()}
            >
              <ResponsiveIcon name="send" size="md" color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Container>
    );
  }

  return (
    <Container padding margin>
      <ScrollView
        refreshControl={
          <ScrollView refreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ResponsiveText variant="xxxl" style={styles.title}>
            Live Chat
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Real-time communication
          </ResponsiveText>
        </View>

        {/* Connection Status */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <View style={styles.connectionStatusRow}>
            <ResponsiveText variant="md" style={styles.connectionLabel}>
              Connection Status:
            </ResponsiveText>
            <View style={[styles.connectionBadge, { backgroundColor: getConnectionStatusColor() }]}>
              <ResponsiveText variant="xs" style={styles.connectionBadgeText}>
                {connectionStatus}
              </ResponsiveText>
            </View>
          </View>
        </Card>

        {/* Action Button */}
        <ResponsiveButton
          variant="primary"
          style={styles.createButton}
          onPress={() => setShowCreateRoomModal(true)}
        >
          <ResponsiveIcon name="add-outline" size="md" />
          <ResponsiveText variant="sm">Create Room</ResponsiveText>
        </ResponsiveButton>

        {/* Search and Filters */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search rooms..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton}>
              <ResponsiveIcon name="search" size="md" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <ResponsiveText variant="sm" style={styles.filterLabel}>
              Room Type:
            </ResponsiveText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterButtons}>
                {['all', 'public', 'private', 'session'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButton,
                      filterType === type && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterType(type as any)}
                  >
                    <ResponsiveText
                      variant="xs"
                      style={[
                        styles.filterButtonText,
                        filterType === type && styles.filterButtonTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </ResponsiveText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </Card>

        {/* Chat Rooms */}
        <View style={styles.section}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Chat Rooms ({getFilteredRooms().length})
          </ResponsiveText>
          
          {getFilteredRooms().map((room) => (
            <ChatRoomCard key={room.id} room={room} />
          ))}
        </View>

        {/* Online Users */}
        <View style={styles.section}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Online Users ({onlineUsers.filter(u => u.status === 'online').length})
          </ResponsiveText>
          
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            {onlineUsers
              .filter(user => user.status === 'online')
              .map((user) => (
                <OnlineUserItem key={user.id} user={user} />
              ))}
          </Card>
        </View>

        {/* Modals */}
        <CreateRoomModal />
        <UserModal />
      </ScrollView>
    </Container>
  );
};

// Create Room Form Component
const CreateRoomForm: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private' | 'session',
    tags: '',
  });

  const { spacing } = useResponsive();

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    // Here you would normally create the room
    console.log('Creating room:', formData);
    onSubmit();
  };

  return (
    <View>
      <View style={styles.formSection}>
        <ResponsiveText variant="md" style={styles.formLabel}>
          Room Name
        </ResponsiveText>
        <TextInput
          style={styles.textInput}
          placeholder="Enter room name"
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
        />
      </View>

      <View style={styles.formSection}>
        <ResponsiveText variant="md" style={styles.formLabel}>
          Description
        </ResponsiveText>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Enter description (optional)"
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formSection}>
        <ResponsiveText variant="md" style={styles.formLabel}>
          Room Type
        </ResponsiveText>
        <View style={styles.typeSelector}>
          {['public', 'private', 'session'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeOption,
                formData.type === type && styles.typeOptionSelected,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, type: type as any }))}
            >
              <ResponsiveText
                variant="sm"
                style={[
                  styles.typeOptionText,
                  formData.type === type && styles.typeOptionTextSelected,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </ResponsiveText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <ResponsiveText variant="md" style={styles.formLabel}>
          Tags (comma separated)
        </ResponsiveText>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., python, help, general"
          value={formData.tags}
          onChangeText={(text) => setFormData(prev => ({ ...prev, tags: text }))}
        />
      </View>

      <View style={styles.formActions}>
        <ResponsiveButton variant="primary" style={styles.submitButton} onPress={handleSubmit}>
          <ResponsiveText variant="sm">Create Room</ResponsiveText>
        </ResponsiveButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    color: '#666',
  },
  connectionStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionLabel: {
    fontWeight: '600',
    color: '#333',
  },
  connectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectionBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 20,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  filterSection: {
    gap: 10,
  },
  filterLabel: {
    fontWeight: '600',
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roomTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  roomName: {
    fontWeight: 'bold',
    color: '#333',
  },
  roomTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roomTypeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  roomDescription: {
    color: '#666',
    marginBottom: 10,
  },
  roomMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: '#666',
    fontSize: 12,
  },
  roomTags: {
    flexDirection: 'row',
    gap: 5,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    color: '#666',
    fontSize: 12,
  },
  userItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: '#333',
  },
  typingIndicator: {
    color: '#007AFF',
    fontStyle: 'italic',
    marginLeft: 5,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userStatus: {
    color: '#666',
    fontSize: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#007AFF',
  },
  chatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatDetails: {
    marginLeft: 15,
  },
  chatTitle: {
    fontWeight: 'bold',
    color: '#fff',
  },
  chatSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  chatActions: {
    flexDirection: 'row',
    gap: 10,
  },
  connectionStatus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageItem: {
    marginBottom: 15,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  messageSender: {
    color: '#666',
    marginBottom: 5,
  },
  messageBubble: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    padding: 12,
    maxWidth: '80%',
  },
  ownBubble: {
    backgroundColor: '#007AFF',
  },
  messageText: {
    color: '#333',
  },
  codeBlock: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#333',
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 5,
  },
  replyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  messageTime: {
    color: '#999',
    fontSize: 12,
  },
  messageActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 2,
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 5,
  },
  reaction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  replyBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  replyMessageText: {
    color: '#666',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  attachButton: {
    padding: 8,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  emojiButton: {
    padding: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  modalSpacer: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 5,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  typeOptionSelected: {
    backgroundColor: '#007AFF',
  },
  typeOptionText: {
    color: '#666',
  },
  typeOptionTextSelected: {
    color: '#fff',
  },
  formActions: {
    gap: 10,
  },
  submitButton: {
    flex: 1,
  },
  userDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userDetailName: {
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  userDetailSection: {
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  userDetailTime: {
    color: '#666',
  },
});

export default LiveChatScreen;

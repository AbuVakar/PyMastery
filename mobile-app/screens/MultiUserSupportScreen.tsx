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
  RefreshControl,
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
  LiveSession,
  Participant,
  WebSocketStatus,
} from '../services/websocketService';

const { width, height } = Dimensions.get('window');

interface UserActivity {
  userId: string;
  userName: string;
  activity: string;
  timestamp: number;
  sessionId?: string;
  type: 'coding' | 'chatting' | 'executing' | 'idle' | 'screen_sharing';
}

interface InteractionEvent {
  id: string;
  type: 'cursor_move' | 'text_change' | 'selection_change' | 'scroll' | 'click';
  userId: string;
  userName: string;
  timestamp: number;
  data: any;
  sessionId: string;
}

const MultiUserSupportScreen: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState<UserActivity[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [interactionEvents, setInteractionEvents] = useState<InteractionEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>('disconnected');
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<InteractionEvent | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActivity, setFilterActivity] = useState<'all' | 'coding' | 'chatting' | 'executing' | 'idle'>('all');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    initializeWebSocket();
    loadActiveUsers();
    loadLiveSessions();
    loadInteractionEvents();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeWebSocket = () => {
    // Listen to WebSocket events
    webSocketService.on('statusChange', handleStatusChange);
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('error', handleError);
    webSocketService.on('sessionUpdate', handleSessionUpdate);
    webSocketService.on('participantJoined', handleParticipantJoined);
    webSocketService.on('participantLeft', handleParticipantLeft);
    webSocketService.on('codeChange', handleCodeChange);
    webSocketService.on('cursorPosition', handleCursorPosition);
    
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
    console.log('WebSocket connected for multi-user support');
  };

  const handleDisconnected = () => {
    console.log('WebSocket disconnected');
  };

  const handleError = (error: any) => {
    console.error('WebSocket error:', error);
  };

  const handleSessionUpdate = (session: LiveSession) => {
    setLiveSessions(prev => 
      prev.map(s => s.id === session.id ? session : s)
    );
  };

  const handleParticipantJoined = (participant: Participant) => {
    // Update active users
    const userActivity: UserActivity = {
      userId: participant.id,
      userName: participant.name,
      activity: 'Joined session',
      timestamp: Date.now(),
      sessionId: participant.id,
      type: 'idle',
    };
    
    setActiveUsers(prev => [userActivity, ...prev.slice(0, 49)]);
  };

  const handleParticipantLeft = (participantId: string) => {
    // Update active users
    setActiveUsers(prev => 
      prev.filter(u => u.userId !== participantId)
    );
  };

  const handleCodeChange = (change: any) => {
    // Add interaction event
    const event: InteractionEvent = {
      id: `event_${Date.now()}_${Math.random()}`,
      type: 'text_change',
      userId: change.userId,
      userName: `User_${change.userId.slice(-4)}`,
      timestamp: change.timestamp,
      data: change,
      sessionId: change.sessionId || 'unknown',
    };
    
    setInteractionEvents(prev => [event, ...prev.slice(0, 99)]);
    
    // Update user activity
    setActiveUsers(prev => 
      prev.map(u => 
        u.userId === change.userId 
          ? { ...u, activity: 'Editing code', type: 'coding', timestamp: change.timestamp }
          : u
      )
    );
  };

  const handleCursorPosition = (position: any) => {
    // Add interaction event
    const event: InteractionEvent = {
      id: `event_${Date.now()}_${Math.random()}`,
      type: 'cursor_move',
      userId: position.userId,
      userName: `User_${position.userId.slice(-4)}`,
      timestamp: position.timestamp,
      data: position,
      sessionId: position.sessionId || 'unknown',
    };
    
    setInteractionEvents(prev => [event, ...prev.slice(0, 99)]);
  };

  const loadActiveUsers = async () => {
    try {
      // Mock data for demo
      const mockUsers: UserActivity[] = [
        {
          userId: 'user_1',
          userName: 'John Doe',
          activity: 'Editing Python code',
          timestamp: Date.now() - 30000,
          sessionId: 'session_1',
          type: 'coding',
        },
        {
          userId: 'user_2',
          userName: 'Jane Smith',
          activity: 'Chatting in session',
          timestamp: Date.now() - 120000,
          sessionId: 'session_2',
          type: 'chatting',
        },
        {
          userId: 'user_3',
          userName: 'Bob Johnson',
          activity: 'Executing JavaScript',
          timestamp: Date.now() - 60000,
          sessionId: 'session_1',
          type: 'executing',
        },
        {
          userId: 'user_4',
          userName: 'Alice Brown',
          activity: 'Screen sharing',
          timestamp: Date.now() - 240000,
          sessionId: 'session_3',
          type: 'screen_sharing',
        },
        {
          userId: 'user_5',
          userName: 'Charlie Wilson',
          activity: 'Idle',
          timestamp: Date.now() - 300000,
          sessionId: 'session_2',
          type: 'idle',
        },
      ];
      
      setActiveUsers(mockUsers);
    } catch (error: any) {
      console.error('Failed to load active users:', error);
    }
  };

  const loadLiveSessions = async () => {
    try {
      // Mock data for demo
      const mockSessions: LiveSession[] = [
        {
          id: 'session_1',
          name: 'Python Algorithms Workshop',
          description: 'Collaborative problem solving',
          hostId: 'host_1',
          participants: [
            { id: 'user_1', name: 'John Doe', role: 'host', isOnline: true, permissions: { canEdit: true, canExecute: true, canChat: true }, joinedAt: Date.now() - 3600000 },
            { id: 'user_3', name: 'Bob Johnson', role: 'participant', isOnline: true, permissions: { canEdit: true, canExecute: false, canChat: true }, joinedAt: Date.now() - 1800000 },
          ],
          code: 'def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)',
          language: 'python',
          isPublic: true,
          maxParticipants: 10,
          createdAt: Date.now() - 3600000,
          status: 'active',
        },
        {
          id: 'session_2',
          name: 'React Components Study',
          description: 'Building React components together',
          hostId: 'host_2',
          participants: [
            { id: 'user_2', name: 'Jane Smith', role: 'host', isOnline: true, permissions: { canEdit: true, canExecute: true, canChat: true }, joinedAt: Date.now() - 7200000 },
            { id: 'user_5', name: 'Charlie Wilson', role: 'participant', isOnline: false, permissions: { canEdit: false, canExecute: false, canChat: true }, joinedAt: Date.now() - 3600000 },
          ],
          code: 'const Button = ({ onClick, children, disabled = false }) => {\n  return (\n    <button\n      onClick={onClick}\n      disabled={disabled}\n      style={{\n        padding: \'10px 20px\',\n        backgroundColor: disabled ? \'#ccc\' : \'#007AFF\',\n        color: \'white\',\n        border: \'none\',\n        borderRadius: \'5px\',\n        cursor: disabled ? \'not-allowed\' : \'pointer\'\n      }}\n    >\n      {children}\n    </button>\n  );\n};',
          language: 'javascript',
          isPublic: true,
          maxParticipants: 8,
          createdAt: Date.now() - 7200000,
          status: 'active',
        },
        {
          id: 'session_3',
          name: 'Data Science Project',
          description: 'Analyzing datasets with Python',
          hostId: 'host_3',
          participants: [
            { id: 'user_4', name: 'Alice Brown', role: 'host', isOnline: true, permissions: { canEdit: true, canExecute: true, canChat: true }, joinedAt: Date.now() - 5400000 },
          ],
          code: 'import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# Load dataset\ndf = pd.read_csv(\'data.csv\')\n\n# Basic statistics\nprint(df.describe())\n\n# Visualization\ndf.plot(kind=\'scatter\', x=\'x\', y=\'y\')\nplt.show()',
          language: 'python',
          isPublic: false,
          maxParticipants: 6,
          createdAt: Date.now() - 5400000,
          status: 'active',
        },
      ];
      
      setLiveSessions(mockSessions);
    } catch (error: any) {
      console.error('Failed to load live sessions:', error);
    }
  };

  const loadInteractionEvents = async () => {
    try {
      // Mock data for demo
      const mockEvents: InteractionEvent[] = [
        {
          id: 'event_1',
          type: 'text_change',
          userId: 'user_1',
          userName: 'John Doe',
          timestamp: Date.now() - 5000,
          data: { position: { line: 5, column: 10 }, content: 'quicksort' },
          sessionId: 'session_1',
        },
        {
          id: 'event_2',
          type: 'cursor_move',
          userId: 'user_3',
          userName: 'Bob Johnson',
          timestamp: Date.now() - 15000,
          data: { position: { line: 2, column: 5 } },
          sessionId: 'session_1',
        },
        {
          id: 'event_3',
          type: 'selection_change',
          userId: 'user_2',
          userName: 'Jane Smith',
          timestamp: Date.now() - 30000,
          data: { selection: { start: { line: 1, column: 0 }, end: { line: 3, column: 0 } } },
          sessionId: 'session_2',
        },
        {
          id: 'event_4',
          type: 'click',
          userId: 'user_4',
          userName: 'Alice Brown',
          timestamp: Date.now() - 45000,
          data: { position: { line: 10, column: 15 } },
          sessionId: 'session_3',
        },
        {
          id: 'event_5',
          type: 'scroll',
          userId: 'user_5',
          userName: 'Charlie Wilson',
          timestamp: Date.now() - 60000,
          data: { scrollPosition: 150 },
          sessionId: 'session_2',
        },
      ];
      
      setInteractionEvents(mockEvents);
    } catch (error: any) {
      console.error('Failed to load interaction events:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadActiveUsers(), loadLiveSessions(), loadInteractionEvents()]);
    setRefreshing(false);
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

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'coding': return '#4CAF50';
      case 'chatting': return '#2196F3';
      case 'executing': return '#FF9800';
      case 'screen_sharing': return '#9C27B0';
      case 'idle': return '#666';
      default: return '#666';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'cursor_move': return 'cursor-outline';
      case 'text_change': return 'create-outline';
      case 'selection_change': return 'text-outline';
      case 'scroll': return 'arrow-down-outline';
      case 'click': return 'finger-print-outline';
      default: return 'ellipse-outline';
    }
  };

  const getFilteredUsers = () => {
    let filtered = activeUsers;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.activity.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterActivity !== 'all') {
      filtered = filtered.filter(user => user.type === filterActivity);
    }

    return filtered;
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const UserActivityCard = ({ user }: { user: UserActivity }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(user);
        setShowUserModal(true);
      }}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.activityIndicator, { backgroundColor: getActivityColor(user.type) }]} />
          <ResponsiveText variant="md" style={styles.userName}>
            {user.userName}
          </ResponsiveText>
        </View>
        <View style={[styles.activityBadge, { backgroundColor: getActivityColor(user.type) }]}>
          <ResponsiveText variant="xs" style={styles.activityText}>
            {user.type.replace('_', ' ')}
          </ResponsiveText>
        </View>
      </View>

      <ResponsiveText variant="sm" style={styles.userActivity}>
        {user.activity}
      </ResponsiveText>

      <View style={styles.userFooter}>
        <ResponsiveText variant="xs" style={styles.userTime}>
          {formatTimestamp(user.timestamp)}
        </ResponsiveText>
        {user.sessionId && (
          <TouchableOpacity
            style={styles.sessionLink}
            onPress={() => {
              const session = liveSessions.find(s => s.id === user.sessionId);
              if (session) {
                setSelectedSession(session);
                setShowSessionModal(true);
              }
            }}
          >
            <ResponsiveIcon name="link-outline" size="sm" color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const SessionCard = ({ session }: { session: LiveSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => {
        setSelectedSession(session);
        setShowSessionModal(true);
      }}
    >
      <View style={styles.sessionHeader}>
        <ResponsiveText variant="lg" style={styles.sessionTitle}>
          {session.name}
        </ResponsiveText>
        <View style={[styles.statusBadge, { backgroundColor: session.status === 'active' ? '#4CAF50' : '#666' }]}>
          <ResponsiveText variant="xs" style={styles.statusText}>
            {session.status}
          </ResponsiveText>
        </View>
      </View>

      <ResponsiveText variant="sm" style={styles.sessionDescription}>
        {session.description}
      </ResponsiveText>

      <View style={styles.sessionMeta}>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="code-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {session.language}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="people-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {session.participants.length}/{session.maxParticipants}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name={session.isPublic ? 'lock-open-outline' : 'lock-outline'} size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {session.isPublic ? 'Public' : 'Private'}
          </ResponsiveText>
        </View>
      </View>

      <View style={styles.participantsList}>
        {session.participants.slice(0, 3).map((participant) => (
          <View key={participant.id} style={styles.participantAvatar}>
            <ResponsiveText variant="xs" style={styles.avatarText}>
              {participant.name.charAt(0).toUpperCase()}
            </ResponsiveText>
          </View>
        ))}
        {session.participants.length > 3 && (
          <View style={styles.participantAvatar}>
            <ResponsiveText variant="xs" style={styles.avatarText}>
              +{session.participants.length - 3}
            </ResponsiveText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const EventItem = ({ event }: { event: InteractionEvent }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => {
        setSelectedEvent(event);
        setShowEventModal(true);
      }}
    >
      <View style={styles.eventHeader}>
        <ResponsiveIcon name={getEventIcon(event.type)} size="md" color="#007AFF" />
        <View style={styles.eventInfo}>
          <ResponsiveText variant="sm" style={styles.eventUser}>
            {event.userName}
          </ResponsiveText>
          <ResponsiveText variant="xs" style={styles.eventType}>
            {event.type.replace('_', ' ')}
          </ResponsiveText>
        </View>
        <ResponsiveText variant="xs" style={styles.eventTime}>
          {formatTimestamp(event.timestamp)}
        </ResponsiveText>
      </View>

      <View style={styles.eventDetails}>
        <ResponsiveText variant="xs" style={styles.eventDescription}>
          {event.type === 'text_change' && `Edited at line ${event.data.position?.line || 0}, column ${event.data.position?.column || 0}`}
          {event.type === 'cursor_move' && `Moved cursor to line ${event.data.position?.line || 0}, column ${event.data.position?.column || 0}`}
          {event.type === 'selection_change' && `Selected text from line ${event.data.selection?.start?.line || 0} to ${event.data.selection?.end?.line || 0}`}
          {event.type === 'scroll' && `Scrolled to position ${event.data.scrollPosition || 0}`}
          {event.type === 'click' && `Clicked at line ${event.data.position?.line || 0}, column ${event.data.position?.column || 0}`}
        </ResponsiveText>
      </View>

      <View style={styles.eventFooter}>
        <ResponsiveText variant="xs" style={styles.eventSession}>
          Session: {event.sessionId}
        </ResponsiveText>
      </View>
    </TouchableOpacity>
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
            User Details
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedUser && (
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <View style={styles.userDetailHeader}>
                <View style={[styles.activityIndicator, { backgroundColor: getActivityColor(selectedUser.type) }]} />
                <ResponsiveText variant="xl" style={styles.userDetailName}>
                  {selectedUser.userName}
                </ResponsiveText>
              </View>

              <View style={styles.userDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Current Activity
                </ResponsiveText>
                <View style={[styles.activityBadge, { backgroundColor: getActivityColor(selectedUser.type) }]}>
                  <ResponsiveText variant="sm" style={styles.activityText}>
                    {selectedUser.type.replace('_', ' ').toUpperCase()}
                  </ResponsiveText>
                </View>
              </View>

              <View style={styles.userDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Activity Description
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.userDetailActivity}>
                  {selectedUser.activity}
                </ResponsiveText>
              </View>

              <View style={styles.userDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Session Information
                </ResponsiveText>
                {selectedUser.sessionId ? (
                  <View>
                    <ResponsiveText variant="sm" style={styles.userDetailSession}>
                      Session ID: {selectedUser.sessionId}
                    </ResponsiveText>
                    <TouchableOpacity
                      style={styles.viewSessionButton}
                      onPress={() => {
                        const session = liveSessions.find(s => s.id === selectedUser.sessionId);
                        if (session) {
                          setSelectedSession(session);
                          setShowSessionModal(true);
                          setShowUserModal(false);
                        }
                      }}
                    >
                      <ResponsiveIcon name="eye-outline" size="sm" />
                      <ResponsiveText variant="sm">View Session</ResponsiveText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ResponsiveText variant="sm" style={styles.userDetailSession}>
                    No active session
                  </ResponsiveText>
                )}
              </View>

              <View style={styles.userDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Timestamp
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.userDetailTime}>
                  {new Date(selectedUser.timestamp).toLocaleString()}
                </ResponsiveText>
              </View>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const SessionModal = () => (
    <Modal
      visible={showSessionModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSessionModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowSessionModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Session Details
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedSession && (
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <View style={styles.sessionDetailHeader}>
                <ResponsiveText variant="xl" style={styles.sessionDetailTitle}>
                  {selectedSession.name}
                </ResponsiveText>
                <View style={[styles.statusBadge, { backgroundColor: selectedSession.status === 'active' ? '#4CAF50' : '#666' }]}>
                  <ResponsiveText variant="sm" style={styles.statusText}>
                    {selectedSession.status}
                  </ResponsiveText>
                </View>
              </View>

              <View style={styles.sessionDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Description
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.sessionDetailDescription}>
                  {selectedSession.description}
                </ResponsiveText>
              </View>

              <View style={styles.sessionDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Participants ({selectedSession.participants.length}/{selectedSession.maxParticipants})
                </ResponsiveText>
                <View style={styles.participantsGrid}>
                  {selectedSession.participants.map((participant) => (
                    <View key={participant.id} style={styles.participantCard}>
                      <View style={[styles.onlineIndicator, participant.isOnline ? styles.online : styles.offline]} />
                      <ResponsiveText variant="sm" style={styles.participantName}>
                        {participant.name}
                      </ResponsiveText>
                      <View style={[styles.roleBadge, { backgroundColor: participant.role === 'host' ? '#FF9800' : '#2196F3' }]}>
                        <ResponsiveText variant="xs" style={styles.roleText}>
                          {participant.role}
                        </ResponsiveText>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.sessionDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Session Settings
                </ResponsiveText>
                <View style={styles.sessionSettings}>
                  <View style={styles.settingItem}>
                    <ResponsiveIcon name="code-outline" size="sm" color="#666" />
                    <ResponsiveText variant="sm">Language: {selectedSession.language}</ResponsiveText>
                  </View>
                  <View style={styles.settingItem}>
                    <ResponsiveIcon name={selectedSession.isPublic ? 'lock-open-outline' : 'lock-outline'} size="sm" color="#666" />
                    <ResponsiveText variant="sm">Visibility: {selectedSession.isPublic ? 'Public' : 'Private'}</ResponsiveText>
                  </View>
                  <View style={styles.settingItem}>
                    <ResponsiveIcon name="time-outline" size="sm" color="#666" />
                    <ResponsiveText variant="sm">Created: {new Date(selectedSession.createdAt).toLocaleString()}</ResponsiveText>
                  </View>
                </View>
              </View>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const EventModal = () => (
    <Modal
      visible={showEventModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEventModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEventModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Event Details
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedEvent && (
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <View style={styles.eventDetailHeader}>
                <ResponsiveIcon name={getEventIcon(selectedEvent.type)} size="lg" color="#007AFF" />
                <ResponsiveText variant="xl" style={styles.eventDetailTitle}>
                  {selectedEvent.type.replace('_', ' ').toUpperCase()}
                </ResponsiveText>
              </View>

              <View style={styles.eventDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  User Information
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.eventDetailUser}>
                  {selectedEvent.userName}
                </ResponsiveText>
                <ResponsiveText variant="xs" style={styles.eventDetailUserId}>
                  ID: {selectedEvent.userId}
                </ResponsiveText>
              </View>

              <View style={styles.eventDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Event Data
                </ResponsiveText>
                <View style={styles.eventData}>
                  {Object.entries(selectedEvent.data).map(([key, value]) => (
                    <View key={key} style={styles.dataItem}>
                      <ResponsiveText variant="xs" style={styles.dataKey}>
                        {key}:
                      </ResponsiveText>
                      <ResponsiveText variant="xs" style={styles.dataValue}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </ResponsiveText>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.eventDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Session Information
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.eventDetailSession}>
                  Session ID: {selectedEvent.sessionId}
                </ResponsiveText>
                <TouchableOpacity
                  style={styles.viewSessionButton}
                  onPress={() => {
                    const session = liveSessions.find(s => s.id === selectedEvent.sessionId);
                    if (session) {
                      setSelectedSession(session);
                      setShowSessionModal(true);
                      setShowEventModal(false);
                    }
                  }}
                >
                  <ResponsiveIcon name="eye-outline" size="sm" />
                  <ResponsiveText variant="sm">View Session</ResponsiveText>
                </TouchableOpacity>
              </View>

              <View style={styles.eventDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Timestamp
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.eventDetailTime}>
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </ResponsiveText>
              </View>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

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
            Multi-User Support
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Real-time collaboration monitoring
          </ResponsiveText>
        </View>

        {/* Connection Status */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <View style={styles.connectionStatusRow}>
            <ResponsiveText variant="md" style={styles.connectionLabel}>
              WebSocket Status:
            </ResponsiveText>
            <View style={[styles.connectionBadge, { backgroundColor: getConnectionStatusColor() }]}>
              <ResponsiveText variant="xs" style={styles.connectionBadgeText}>
                {connectionStatus}
              </ResponsiveText>
            </View>
          </View>
        </Card>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Card shadow padding={spacing.md} margin={spacing.sm} style={styles.statCard}>
            <ResponsiveText variant="lg" style={styles.statNumber}>
              {activeUsers.length}
            </ResponsiveText>
            <ResponsiveText variant="sm" style={styles.statLabel}>
              Active Users
            </ResponsiveText>
          </Card>
          <Card shadow padding={spacing.md} margin={spacing.sm} style={styles.statCard}>
            <ResponsiveText variant="lg" style={styles.statNumber}>
              {liveSessions.length}
            </ResponsiveText>
            <ResponsiveText variant="sm" style={styles.statLabel}>
              Live Sessions
            </ResponsiveText>
          </Card>
          <Card shadow padding={spacing.md} margin={spacing.sm} style={styles.statCard}>
            <ResponsiveText variant="lg" style={styles.statNumber}>
              {interactionEvents.length}
            </ResponsiveText>
            <ResponsiveText variant="sm" style={styles.statLabel}>
              Interactions
            </ResponsiveText>
          </Card>
        </View>

        {/* Active Users */}
        <View style={styles.section}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Active Users ({getFilteredUsers().length})
          </ResponsiveText>
          
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.searchSection}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.searchButton}>
                <ResponsiveIcon name="search" size="md" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <ResponsiveText variant="sm" style={styles.filterLabel}>
                Activity:
              </ResponsiveText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterButtons}>
                  {['all', 'coding', 'chatting', 'executing', 'idle'].map((activity) => (
                    <TouchableOpacity
                      key={activity}
                      style={[
                        styles.filterButton,
                        filterActivity === activity && styles.filterButtonActive,
                      ]}
                      onPress={() => setFilterActivity(activity as any)}
                    >
                      <ResponsiveText
                        variant="xs"
                        style={[
                          styles.filterButtonText,
                          filterActivity === activity && styles.filterButtonTextActive,
                        ]}
                      >
                        {activity.charAt(0).toUpperCase() + activity.slice(1)}
                      </ResponsiveText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Card>

          {getFilteredUsers().map((user) => (
            <UserActivityCard key={user.userId} user={user} />
          ))}
        </View>

        {/* Live Sessions */}
        <View style={styles.section}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Live Sessions ({liveSessions.length})
          </ResponsiveText>
          
          {liveSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </View>

        {/* Recent Interactions */}
        <View style={styles.section}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Recent Interactions ({interactionEvents.length})
          </ResponsiveText>
          
          {interactionEvents.slice(0, 10).map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </View>

        {/* Modals */}
        <UserModal />
        <SessionModal />
        <EventModal />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  userName: {
    fontWeight: 'bold',
    color: '#333',
  },
  activityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  userActivity: {
    color: '#666',
    marginBottom: 10,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userTime: {
    color: '#999',
    fontSize: 12,
  },
  sessionLink: {
    padding: 5,
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionTitle: {
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
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
  sessionDescription: {
    color: '#666',
    marginBottom: 10,
  },
  sessionMeta: {
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
  participantsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventItem: {
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
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 10,
  },
  eventUser: {
    fontWeight: 'bold',
    color: '#333',
  },
  eventType: {
    color: '#666',
  },
  eventTime: {
    color: '#999',
    fontSize: 12,
  },
  eventDetails: {
    marginLeft: 34,
    marginBottom: 5,
  },
  eventDescription: {
    color: '#666',
  },
  eventFooter: {
    marginLeft: 34,
  },
  eventSession: {
    color: '#007AFF',
    fontSize: 12,
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
  userDetailActivity: {
    color: '#666',
    marginTop: 5,
  },
  userDetailSession: {
    color: '#666',
    marginTop: 5,
  },
  userDetailTime: {
    color: '#666',
  },
  viewSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sessionDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionDetailTitle: {
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  sessionDetailDescription: {
    color: '#666',
  },
  participantsGrid: {
    gap: 10,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  participantName: {
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
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
  sessionSettings: {
    gap: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  eventDetailTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  eventDetailUser: {
    fontWeight: 'bold',
    color: '#333',
  },
  eventDetailUserId: {
    color: '#666',
    marginTop: 2,
  },
  eventData: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
  },
  dataItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  dataKey: {
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  dataValue: {
    color: '#666',
    flex: 1,
  },
  eventDetailSession: {
    color: '#666',
  },
  eventDetailTime: {
    color: '#666',
  },
});

export default MultiUserSupportScreen;

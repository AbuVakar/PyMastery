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
  ScreenShareSession,
  WebSocketStatus,
} from '../services/websocketService';

const { width, height } = Dimensions.get('window');

interface CodeReviewSession {
  id: string;
  title: string;
  description: string;
  hostId: string;
  participants: string[];
  code: string;
  language: string;
  screenShareActive: boolean;
  quality: 'low' | 'medium' | 'high';
  shareType: 'screen' | 'window' | 'tab';
  startedAt: number;
  status: 'active' | 'ended' | 'paused';
  annotations: Annotation[];
}

interface Annotation {
  id: string;
  userId: string;
  userName: string;
  type: 'highlight' | 'comment' | 'draw' | 'pointer';
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  content: string;
  color: string;
  timestamp: number;
  replies: AnnotationReply[];
}

interface AnnotationReply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'reviewer' | 'observer';
  isScreenSharing: boolean;
  canAnnotate: boolean;
  joinedAt: number;
}

const ScreenSharingScreen: React.FC = () => {
  const [screenShareSessions, setScreenShareSessions] = useState<CodeReviewSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CodeReviewSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>('disconnected');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareQuality, setShareQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ended' | 'paused'>('all');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    initializeWebSocket();
    loadScreenShareSessions();
    loadParticipants();
    
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
    webSocketService.on('screenShareUpdate', handleScreenShareUpdate);
    webSocketService.on('participantJoined', handleParticipantJoined);
    webSocketService.on('participantLeft', handleParticipantLeft);
    
    // Connect to WebSocket
    webSocketService.connect().catch(console.error);
  };

  const cleanup = () => {
    webSocketService.removeAllListeners();
    if (currentSession && isSharing) {
      stopScreenShare();
    }
  };

  const handleStatusChange = (status: WebSocketStatus) => {
    setConnectionStatus(status);
  };

  const handleConnected = () => {
    console.log('WebSocket connected for screen sharing');
  };

  const handleDisconnected = () => {
    console.log('WebSocket disconnected');
  };

  const handleError = (error: any) => {
    console.error('WebSocket error:', error);
  };

  const handleScreenShareUpdate = (update: ScreenShareSession) => {
    setScreenShareSessions(prev => 
      prev.map(session => 
        session.id === update.id ? { ...session, ...update } : session
      )
    );
    
    if (currentSession && currentSession.id === update.id) {
      setCurrentSession(prev => prev ? { ...prev, ...update } : null);
    }
  };

  const handleParticipantJoined = (participant: any) => {
    const newParticipant: Participant = {
      id: participant.id,
      name: participant.name,
      role: participant.role || 'reviewer',
      isScreenSharing: participant.isScreenSharing || false,
      canAnnotate: participant.canAnnotate !== false,
      joinedAt: Date.now(),
    };
    
    setParticipants(prev => [...prev, newParticipant]);
  };

  const handleParticipantLeft = (participantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  const loadScreenShareSessions = async () => {
    try {
      // Mock data for demo
      const mockSessions: CodeReviewSession[] = [
        {
          id: 'session_1',
          title: 'Python Code Review - Algorithms',
          description: 'Review and discuss Python algorithm implementations',
          hostId: 'host_1',
          participants: ['user_1', 'user_2', 'user_3'],
          code: 'def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)',
          language: 'python',
          screenShareActive: true,
          quality: 'medium',
          shareType: 'screen',
          startedAt: Date.now() - 1800000,
          status: 'active',
          annotations: [
            {
              id: 'annot_1',
              userId: 'user_2',
              userName: 'Jane Smith',
              type: 'comment',
              position: { x: 100, y: 50, width: 200, height: 30 },
              content: 'Consider adding type hints for better readability',
              color: '#FF9800',
              timestamp: Date.now() - 900000,
              replies: [],
            },
            {
              id: 'annot_2',
              userId: 'user_3',
              userName: 'Bob Johnson',
              type: 'highlight',
              position: { x: 50, y: 100, width: 150, height: 20 },
              content: 'This recursive approach is elegant',
              color: '#4CAF50',
              timestamp: Date.now() - 600000,
              replies: [],
            },
          ],
        },
        {
          id: 'session_2',
          title: 'JavaScript React Components',
          description: 'Live code review of React component architecture',
          hostId: 'host_2',
          participants: ['user_2', 'user_4'],
          code: 'const Button = ({ onClick, children, disabled = false }) => {\n  return (\n    <button\n      onClick={onClick}\n      disabled={disabled}\n      style={{\n        padding: \'10px 20px\',\n        backgroundColor: disabled ? \'#ccc\' : \'#007AFF\',\n        color: \'white\',\n        border: \'none\',\n        borderRadius: \'5px\',\n        cursor: disabled ? \'not-allowed\' : \'pointer\'\n      }}\n    >\n      {children}\n    </button>\n  );\n};',
          language: 'javascript',
          screenShareActive: false,
          quality: 'high',
          shareType: 'window',
          startedAt: Date.now() - 3600000,
          status: 'paused',
          annotations: [],
        },
        {
          id: 'session_3',
          title: 'Java Data Structures',
          description: 'Review of Java data structure implementations',
          hostId: 'host_3',
          participants: ['user_1', 'user_3', 'user_4', 'user_5'],
          code: 'public class Stack<T> {\n    private ArrayList<T> items;\n    \n    public Stack() {\n        items = new ArrayList<>();\n    }\n    \n    public void push(T item) {\n        items.add(item);\n    }\n    \n    public T pop() {\n        if (isEmpty()) {\n            throw new EmptyStackException();\n        }\n        return items.remove(items.size() - 1);\n    }\n    \n    public boolean isEmpty() {\n        return items.isEmpty();\n    }\n}',
          language: 'java',
          screenShareActive: true,
          quality: 'low',
          shareType: 'tab',
          startedAt: Date.now() - 7200000,
          status: 'active',
          annotations: [
            {
              id: 'annot_3',
              userId: 'user_1',
              userName: 'John Doe',
              type: 'draw',
              position: { x: 200, y: 150 },
              content: 'Arrow pointing to pop() method',
              color: '#2196F3',
              timestamp: Date.now() - 300000,
              replies: [
                {
                  id: 'reply_1',
                  userId: 'user_4',
                  userName: 'Alice Brown',
                  content: 'Good catch on the empty check!',
                  timestamp: Date.now() - 240000,
                },
              ],
            },
          ],
        },
      ];
      
      setScreenShareSessions(mockSessions);
    } catch (error: any) {
      console.error('Failed to load screen share sessions:', error);
    }
  };

  const loadParticipants = async () => {
    try {
      // Mock data for demo
      const mockParticipants: Participant[] = [
        {
          id: 'user_1',
          name: 'John Doe',
          role: 'host',
          isScreenSharing: false,
          canAnnotate: true,
          joinedAt: Date.now() - 3600000,
        },
        {
          id: 'user_2',
          name: 'Jane Smith',
          role: 'reviewer',
          isScreenSharing: true,
          canAnnotate: true,
          joinedAt: Date.now() - 1800000,
        },
        {
          id: 'user_3',
          name: 'Bob Johnson',
          role: 'reviewer',
          isScreenSharing: false,
          canAnnotate: true,
          joinedAt: Date.now() - 900000,
        },
        {
          id: 'user_4',
          name: 'Alice Brown',
          role: 'observer',
          isScreenSharing: false,
          canAnnotate: false,
          joinedAt: Date.now() - 600000,
        },
        {
          id: 'user_5',
          name: 'Charlie Wilson',
          role: 'reviewer',
          isScreenSharing: false,
          canAnnotate: true,
          joinedAt: Date.now() - 300000,
        },
      ];
      
      setParticipants(mockParticipants);
    } catch (error: any) {
      console.error('Failed to load participants:', error);
    }
  };

  const loadAnnotations = async (sessionId: string) => {
    try {
      const session = screenShareSessions.find(s => s.id === sessionId);
      if (session) {
        setAnnotations(session.annotations);
      }
    } catch (error: any) {
      console.error('Failed to load annotations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadScreenShareSessions(), loadParticipants()]);
    if (currentSession) {
      await loadAnnotations(currentSession.id);
    }
    setRefreshing(false);
  };

  const startScreenShare = async (sessionId: string, quality: 'low' | 'medium' | 'high' = 'medium') => {
    try {
      setIsSharing(true);
      setShareQuality(quality);
      
      webSocketService.startScreenShare(sessionId, quality);
      
      Alert.alert('Success', 'Screen sharing started');
    } catch (error: any) {
      console.error('Failed to start screen share:', error);
      setIsSharing(false);
      Alert.alert('Error', 'Failed to start screen sharing');
    }
  };

  const stopScreenShare = () => {
    if (currentSession) {
      webSocketService.stopScreenShare(currentSession.id);
      setIsSharing(false);
      Alert.alert('Success', 'Screen sharing stopped');
    }
  };

  const joinSession = async (session: CodeReviewSession) => {
    try {
      setCurrentSession(session);
      await loadAnnotations(session.id);
      
      Alert.alert('Success', `Joined ${session.title}`);
    } catch (error: any) {
      console.error('Failed to join session:', error);
      Alert.alert('Error', 'Failed to join session');
    }
  };

  const leaveSession = () => {
    if (currentSession && isSharing) {
      stopScreenShare();
    }
    setCurrentSession(null);
    setAnnotations([]);
  };

  const addAnnotation = (type: 'highlight' | 'comment' | 'draw' | 'pointer', position: any, content: string) => {
    if (!currentSession) return;

    const annotation: Annotation = {
      id: `annot_${Date.now()}_${Math.random()}`,
      userId: webSocketService.getUserId(),
      userName: 'Current User',
      type,
      position,
      content,
      color: '#007AFF',
      timestamp: Date.now(),
      replies: [],
    };

    setAnnotations(prev => [...prev, annotation]);
    
    // Update session annotations
    setScreenShareSessions(prev => 
      prev.map(session => 
        session.id === currentSession.id 
          ? { ...session, annotations: [...session.annotations, annotation] }
          : session
      )
    );
  };

  const addReply = (annotationId: string, content: string) => {
    const reply: AnnotationReply = {
      id: `reply_${Date.now()}_${Math.random()}`,
      userId: webSocketService.getUserId(),
      userName: 'Current User',
      content,
      timestamp: Date.now(),
    };

    setAnnotations(prev => 
      prev.map(annotation => 
        annotation.id === annotationId 
          ? { ...annotation, replies: [...annotation.replies, reply] }
          : annotation
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
      case 'active': return '#4CAF50';
      case 'paused': return '#FF9800';
      case 'ended': return '#666';
      default: return '#666';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#666';
    }
  };

  const getShareTypeIcon = (type: string) => {
    switch (type) {
      case 'screen': return 'desktop-outline';
      case 'window': return 'square-outline';
      case 'tab': return 'browser-outline';
      default: return 'desktop-outline';
    }
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'highlight': return 'color-palette-outline';
      case 'comment': return 'chatbubble-outline';
      case 'draw': return 'create-outline';
      case 'pointer': return 'hand-left-outline';
      default: return 'ellipse-outline';
    }
  };

  const getFilteredSessions = () => {
    let filtered = screenShareSessions;

    if (searchQuery) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(session => session.status === filterStatus);
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

  const SessionCard = ({ session }: { session: CodeReviewSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => joinSession(session)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <ResponsiveText variant="lg" style={styles.sessionTitle}>
            {session.title}
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.sessionDescription}>
            {session.description}
          </ResponsiveText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
          <ResponsiveText variant="xs" style={styles.statusText}>
            {session.status}
          </ResponsiveText>
        </View>
      </View>

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
            {session.participants.length}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name={getShareTypeIcon(session.shareType)} size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {session.shareType}
          </ResponsiveText>
        </View>
      </View>

      <View style={styles.sessionFooter}>
        <View style={styles.qualitySection}>
          <ResponsiveText variant="xs" style={styles.qualityLabel}>
            Quality:
          </ResponsiveText>
          <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(session.quality) }]}>
            <ResponsiveText variant="xs" style={styles.qualityText}>
              {session.quality}
            </ResponsiveText>
          </View>
        </View>
        
        {session.screenShareActive && (
          <View style={styles.sharingIndicator}>
            <ResponsiveIcon name="videocam-outline" size="sm" color="#4CAF50" />
            <ResponsiveText variant="xs" style={styles.sharingText}>
              Sharing
            </ResponsiveText>
          </View>
        )}
        
        <ResponsiveText variant="xs" style={styles.sessionTime}>
          Started: {formatTimestamp(session.startedAt)}
        </ResponsiveText>
      </View>

      {session.annotations.length > 0 && (
        <View style={styles.annotationsSection}>
          <ResponsiveText variant="xs" style={styles.annotationsLabel}>
            {session.annotations.length} annotations
          </ResponsiveText>
        </View>
      )}
    </TouchableOpacity>
  );

  const AnnotationItem = ({ annotation }: { annotation: Annotation }) => (
    <TouchableOpacity
      style={styles.annotationItem}
      onPress={() => {
        setSelectedAnnotation(annotation);
        setShowAnnotationModal(true);
      }}
    >
      <View style={styles.annotationHeader}>
        <ResponsiveIcon name={getAnnotationIcon(annotation.type)} size="md" color={annotation.color} />
        <View style={styles.annotationInfo}>
          <ResponsiveText variant="sm" style={styles.annotationUser}>
            {annotation.userName}
          </ResponsiveText>
          <ResponsiveText variant="xs" style={styles.annotationType}>
            {annotation.type}
          </ResponsiveText>
        </View>
        <ResponsiveText variant="xs" style={styles.annotationTime}>
          {formatTimestamp(annotation.timestamp)}
        </ResponsiveText>
      </View>

      <View style={styles.annotationContent}>
        <ResponsiveText variant="sm" style={styles.annotationText}>
          {annotation.content}
        </ResponsiveText>
      </View>

      {annotation.replies.length > 0 && (
        <View style={styles.repliesSection}>
          <ResponsiveText variant="xs" style={styles.repliesLabel}>
            {annotation.replies.length} replies
          </ResponsiveText>
        </View>
      )}
    </TouchableOpacity>
  );

  const CreateSessionModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Create Code Review Session
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <CreateSessionForm onSubmit={() => setShowCreateModal(false)} />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const AnnotationModal = () => (
    <Modal
      visible={showAnnotationModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAnnotationModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAnnotationModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Annotation Details
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedAnnotation && (
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <View style={styles.annotationDetailHeader}>
                <ResponsiveIcon name={getAnnotationIcon(selectedAnnotation.type)} size="lg" color={selectedAnnotation.color} />
                <ResponsiveText variant="xl" style={styles.annotationDetailTitle}>
                  {selectedAnnotation.type.toUpperCase()}
                </ResponsiveText>
              </View>

              <View style={styles.annotationDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Author
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.annotationDetailUser}>
                  {selectedAnnotation.userName}
                </ResponsiveText>
              </View>

              <View style={styles.annotationDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Content
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.annotationDetailContent}>
                  {selectedAnnotation.content}
                </ResponsiveText>
              </View>

              <View style={styles.annotationDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Position
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.annotationDetailPosition}>
                  X: {selectedAnnotation.position.x}, Y: {selectedAnnotation.position.y}
                  {selectedAnnotation.position.width && `, Width: ${selectedAnnotation.position.width}`}
                  {selectedAnnotation.position.height && `, Height: ${selectedAnnotation.position.height}`}
                </ResponsiveText>
              </View>

              <View style={styles.annotationDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Replies ({selectedAnnotation.replies.length})
                </ResponsiveText>
                {selectedAnnotation.replies.map((reply) => (
                  <View key={reply.id} style={styles.replyItem}>
                    <ResponsiveText variant="sm" style={styles.replyUser}>
                      {reply.userName}
                    </ResponsiveText>
                    <ResponsiveText variant="xs" style={styles.replyContent}>
                      {reply.content}
                    </ResponsiveText>
                    <ResponsiveText variant="xs" style={styles.replyTime}>
                      {formatTimestamp(reply.timestamp)}
                    </ResponsiveText>
                  </View>
                ))}
              </View>

              <View style={styles.annotationDetailSection}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Timestamp
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.annotationDetailTime}>
                  {new Date(selectedAnnotation.timestamp).toLocaleString()}
                </ResponsiveText>
              </View>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (currentSession) {
    return (
      <Container padding margin>
        <View style={styles.sessionContainer}>
          {/* Session Header */}
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <TouchableOpacity onPress={leaveSession}>
                <ResponsiveIcon name="arrow-back" size="lg" />
              </TouchableOpacity>
              <View style={styles.sessionDetails}>
                <ResponsiveText variant="lg" style={styles.sessionTitle}>
                  {currentSession.title}
                </ResponsiveText>
                <ResponsiveText variant="xs" style={styles.sessionSubtitle}>
                  {currentSession.participants.length} participants • {currentSession.language}
                </ResponsiveText>
              </View>
            </View>
            <View style={styles.sessionActions}>
              <TouchableOpacity
                style={[styles.shareButton, isSharing && styles.shareButtonActive]}
                onPress={() => isSharing ? stopScreenShare() : startScreenShare(currentSession.id, shareQuality)}
              >
                <ResponsiveIcon name={isSharing ? 'videocam-off' : 'videocam'} size="md" color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreButton} onPress={() => setShowQualityModal(true)}>
                <ResponsiveIcon name="options" size="md" color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Code Display */}
          <Card shadow padding={spacing.md} margin={spacing.sm} style={styles.codeContainer}>
            <View style={styles.codeHeader}>
              <ResponsiveText variant="md" style={styles.sectionTitle}>
                Code Review
              </ResponsiveText>
              <View style={styles.codeActions}>
                <TouchableOpacity style={styles.annotationButton} onPress={() => addAnnotation('highlight', { x: 0, y: 0, width: 100, height: 20 }, 'Highlight important code')}>
                  <ResponsiveIcon name="color-palette-outline" size="sm" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.annotationButton} onPress={() => addAnnotation('comment', { x: 0, y: 0 }, 'Add comment')}>
                  <ResponsiveIcon name="chatbubble-outline" size="sm" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.annotationButton} onPress={() => addAnnotation('draw', { x: 100, y: 100 }, 'Draw attention')}>
                  <ResponsiveIcon name="create-outline" size="sm" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.codeScrollView}>
              <Text style={styles.codeText}>{currentSession.code}</Text>
            </ScrollView>
          </Card>

          {/* Annotations */}
          <View style={styles.annotationsContainer}>
            <View style={styles.annotationsHeader}>
              <ResponsiveText variant="md" style={styles.sectionTitle}>
                Annotations ({annotations.length})
              </ResponsiveText>
              <TouchableOpacity style={styles.addAnnotationButton} onPress={() => setShowAnnotationModal(true)}>
                <ResponsiveIcon name="add-outline" size="sm" />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={flatListRef}
              data={annotations}
              renderItem={({ item }) => <AnnotationItem annotation={item} />}
              keyExtractor={(item) => item.id}
              style={styles.annotationsList}
              contentContainerStyle={styles.annotationsContent}
            />
          </View>

          {/* Quality Modal */}
          <Modal
            visible={showQualityModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowQualityModal(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowQualityModal(false)}>
                  <ResponsiveIcon name="close" size="lg" />
                </TouchableOpacity>
                <ResponsiveText variant="lg" style={styles.modalTitle}>
                  Screen Share Quality
                </ResponsiveText>
                <View style={styles.modalSpacer} />
              </View>

              <View style={styles.modalContent}>
                <Card shadow padding={spacing.md} margin={spacing.sm}>
                  <View style={styles.qualityOptions}>
                    {(['low', 'medium', 'high'] as const).map((quality) => (
                      <TouchableOpacity
                        key={quality}
                        style={[
                          styles.qualityOption,
                          shareQuality === quality && styles.qualityOptionSelected,
                        ]}
                        onPress={() => {
                          setShareQuality(quality);
                          setShowQualityModal(false);
                          if (isSharing) {
                            stopScreenShare();
                            startScreenShare(currentSession.id, quality);
                          }
                        }}
                      >
                        <View style={[styles.qualityIndicator, { backgroundColor: getQualityColor(quality) }]} />
                        <View style={styles.qualityOptionInfo}>
                          <ResponsiveText variant="md" style={styles.qualityOptionName}>
                            {quality.charAt(0).toUpperCase() + quality.slice(1)}
                          </ResponsiveText>
                          <ResponsiveText variant="xs" style={styles.qualityOptionDesc}>
                            {quality === 'low' && 'Best performance, lower quality'}
                            {quality === 'medium' && 'Balanced performance and quality'}
                            {quality === 'high' && 'Best quality, higher bandwidth'}
                          </ResponsiveText>
                        </View>
                        {shareQuality === quality && (
                          <ResponsiveIcon name="checkmark" size="md" color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>
              </View>
            </SafeAreaView>
          </Modal>

          {/* Annotation Modal */}
          <AnnotationModal />
        </View>
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
            Screen Sharing
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Code review and collaboration
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
          onPress={() => setShowCreateModal(true)}
        >
          <ResponsiveIcon name="add-outline" size="md" />
          <ResponsiveText variant="sm">Create Session</ResponsiveText>
        </ResponsiveButton>

        {/* Search and Filters */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search sessions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton}>
              <ResponsiveIcon name="search" size="md" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <ResponsiveText variant="sm" style={styles.filterLabel}>
              Status:
            </ResponsiveText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterButtons}>
                {['all', 'active', 'paused', 'ended'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterButton,
                      filterStatus === status && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterStatus(status as any)}
                  >
                    <ResponsiveText
                      variant="xs"
                      style={[
                        styles.filterButtonText,
                        filterStatus === status && styles.filterButtonTextActive,
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </ResponsiveText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </Card>

        {/* Sessions */}
        <View style={styles.section}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Code Review Sessions ({getFilteredSessions().length})
          </ResponsiveText>
          
          {getFilteredSessions().map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </View>

        {/* Modals */}
        <CreateSessionModal />
      </ScrollView>
    </Container>
  );
};

// Create Session Form Component
const CreateSessionForm: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'python',
    code: '',
    shareType: 'screen' as 'screen' | 'window' | 'tab',
    quality: 'medium' as 'low' | 'medium' | 'high',
  });

  const { spacing } = useResponsive();

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a session title');
      return;
    }

    if (!formData.code.trim()) {
      Alert.alert('Error', 'Please enter the code to review');
      return;
    }

    // Here you would normally create the session
    console.log('Creating session:', formData);
    onSubmit();
  };

  return (
    <View>
      <View style={styles.formSection}>
        <ResponsiveText variant="md" style={styles.formLabel}>
          Session Title
        </ResponsiveText>
        <TextInput
          style={styles.textInput}
          placeholder="Enter session title"
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
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
          Language
        </ResponsiveText>
        <View style={styles.languageSelector}>
          {['python', 'javascript', 'java', 'cpp', 'c'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageOption,
                formData.language === lang && styles.languageOptionSelected,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, language: lang }))}
            >
              <ResponsiveText
                variant="sm"
                style={[
                  styles.languageOptionText,
                  formData.language === lang && styles.languageOptionTextSelected,
                ]}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </ResponsiveText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <ResponsiveText variant="md" style={styles.formLabel}>
          Code to Review
        </ResponsiveText>
        <TextInput
          style={[styles.textInput, styles.codeTextArea]}
          placeholder="Enter the code you want to review"
          value={formData.code}
          onChangeText={(text) => setFormData(prev => ({ ...prev, code: text }))}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          fontFamily="monospace"
        />
      </View>

      <View style={styles.formSection}>
        <ResponsiveText variant="md" style={styles.formLabel}>
          Share Type
        </ResponsiveText>
        <View style={styles.shareTypeSelector}>
          {['screen', 'window', 'tab'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.shareTypeOption,
                formData.shareType === type && styles.shareTypeOptionSelected,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, shareType: type as any }))}
            >
              <ResponsiveIcon name={type === 'screen' ? 'desktop-outline' : type === 'window' ? 'square-outline' : 'browser-outline'} size="sm" />
              <ResponsiveText
                variant="sm"
                style={[
                  styles.shareTypeOptionText,
                  formData.shareType === type && styles.shareTypeOptionTextSelected,
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
          Default Quality
        </ResponsiveText>
        <View style={styles.qualitySelector}>
          {['low', 'medium', 'high'].map((quality) => (
            <TouchableOpacity
              key={quality}
              style={[
                styles.qualityOption,
                formData.quality === quality && styles.qualityOptionSelected,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, quality: quality as any }))}
            >
              <View style={[styles.qualityIndicator, { backgroundColor: quality === 'low' ? '#4CAF50' : quality === 'medium' ? '#FF9800' : '#F44336' }]} />
              <ResponsiveText
                variant="sm"
                style={[
                  styles.qualityOptionText,
                  formData.quality === quality && styles.qualityOptionTextSelected,
                ]}
              >
                {quality.charAt(0).toUpperCase() + quality.slice(1)}
              </ResponsiveText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formActions}>
        <ResponsiveButton variant="primary" style={styles.submitButton} onPress={handleSubmit}>
          <ResponsiveText variant="sm">Create Session</ResponsiveText>
        </ResponsiveButton>
      </View>
    </View>
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
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sessionDescription: {
    color: '#666',
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
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  qualityLabel: {
    color: '#666',
    fontSize: 12,
  },
  qualityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  qualityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sharingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sharingText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionTime: {
    color: '#999',
    fontSize: 12,
  },
  annotationsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  annotationsLabel: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionContainer: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#007AFF',
  },
  sessionDetails: {
    marginLeft: 15,
  },
  sessionSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonActive: {
    backgroundColor: '#4CAF50',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeContainer: {
    flex: 1,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 10,
  },
  annotationButton: {
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  codeScrollView: {
    flex: 1,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  annotationsContainer: {
    flex: 1,
    marginTop: 20,
  },
  annotationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addAnnotationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  annotationsList: {
    flex: 1,
  },
  annotationsContent: {
    paddingBottom: 20,
  },
  annotationItem: {
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
  annotationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  annotationInfo: {
    flex: 1,
    marginLeft: 10,
  },
  annotationUser: {
    fontWeight: 'bold',
    color: '#333',
  },
  annotationType: {
    color: '#666',
    fontSize: 12,
  },
  annotationTime: {
    color: '#999',
    fontSize: 12,
  },
  annotationContent: {
    marginLeft: 34,
    marginBottom: 5,
  },
  annotationText: {
    color: '#333',
  },
  repliesSection: {
    marginLeft: 34,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  repliesLabel: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  codeTextArea: {
    height: 120,
    fontFamily: 'monospace',
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 5,
  },
  languageOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  languageOptionSelected: {
    backgroundColor: '#007AFF',
  },
  languageOptionText: {
    color: '#666',
  },
  languageOptionTextSelected: {
    color: '#fff',
  },
  shareTypeSelector: {
    flexDirection: 'row',
    gap: 5,
  },
  shareTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  shareTypeOptionSelected: {
    backgroundColor: '#007AFF',
  },
  shareTypeOptionText: {
    color: '#666',
  },
  shareTypeOptionTextSelected: {
    color: '#fff',
  },
  qualitySelector: {
    gap: 10,
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  qualityOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  qualityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  qualityOptionText: {
    flex: 1,
  },
  qualityOptions: {
    gap: 10,
  },
  qualityOptionInfo: {
    flex: 1,
  },
  qualityOptionName: {
    fontWeight: 'bold',
    color: '#333',
  },
  qualityOptionDesc: {
    color: '#666',
    fontSize: 12,
  },
  formActions: {
    gap: 10,
  },
  submitButton: {
    flex: 1,
  },
  annotationDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  annotationDetailTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  annotationDetailSection: {
    marginBottom: 20,
  },
  annotationDetailUser: {
    fontWeight: 'bold',
    color: '#333',
  },
  annotationDetailContent: {
    color: '#333',
    marginTop: 5,
  },
  annotationDetailPosition: {
    color: '#666',
  },
  replyItem: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  replyUser: {
    fontWeight: 'bold',
    color: '#333',
  },
  replyContent: {
    color: '#333',
    marginTop: 2,
  },
  replyTime: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  annotationDetailTime: {
    color: '#666',
  },
});

export default ScreenSharingScreen;

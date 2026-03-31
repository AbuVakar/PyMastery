import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  LiveSession,
  Participant,
  CodeChange,
  CursorPosition,
  ExecutionResult,
  WebSocketStatus,
} from '../services/websocketService';

const { width, height } = Dimensions.get('window');

const LiveCodingSessionScreen: React.FC = () => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>('disconnected');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ended'>('all');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const codeInputRef = useRef<TextInput>(null);
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    initializeWebSocket();
    loadSessions();
    
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
    webSocketService.on('executionResult', handleExecutionResult);
    
    // Connect to WebSocket
    webSocketService.connect().catch(console.error);
  };

  const cleanup = () => {
    webSocketService.removeAllListeners();
    if (currentSession) {
      webSocketService.leaveSession(currentSession.id);
    }
  };

  const handleStatusChange = (status: WebSocketStatus) => {
    setConnectionStatus(status);
  };

  const handleConnected = () => {
    console.log('WebSocket connected');
  };

  const handleDisconnected = () => {
    console.log('WebSocket disconnected');
  };

  const handleError = (error: any) => {
    console.error('WebSocket error:', error);
    Alert.alert('Connection Error', 'Failed to connect to the server');
  };

  const handleSessionUpdate = (session: LiveSession) => {
    setCurrentSession(session);
    setCode(session.code);
    setLanguage(session.language);
    setParticipants(session.participants);
  };

  const handleParticipantJoined = (participant: Participant) => {
    setParticipants(prev => [...prev, participant]);
    Alert.alert('Participant Joined', `${participant.name} joined the session`);
  };

  const handleParticipantLeft = (participantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      Alert.alert('Participant Left', `${participant.name} left the session`);
    }
  };

  const handleCodeChange = (change: CodeChange) => {
    if (change.userId === webSocketService.getUserId()) return;
    
    // Apply code change from other participants
    setCode(prev => {
      const lines = prev.split('\n');
      const line = lines[change.position.line] || '';
      
      switch (change.type) {
        case 'insert':
          lines[change.position.line] = line.slice(0, change.position.column) + 
                                       change.content + 
                                       line.slice(change.position.column);
          break;
        case 'delete':
          lines[change.position.line] = line.slice(0, change.position.column) + 
                                       line.slice(change.position.column + (change.length || 0));
          break;
        case 'replace':
          lines[change.position.line] = line.slice(0, change.position.column) + 
                                       change.content + 
                                       line.slice(change.position.column + (change.length || 0));
          break;
      }
      
      return lines.join('\n');
    });
  };

  const handleCursorPosition = (position: CursorPosition) => {
    if (position.userId === webSocketService.getUserId()) return;
    // Handle cursor position updates from other participants
    console.log('Cursor position from participant:', position);
  };

  const handleExecutionResult = (result: ExecutionResult) => {
    setIsExecuting(false);
    setExecutionResult(result);
    setShowExecutionModal(true);
  };

  const loadSessions = async () => {
    try {
      // Mock data for demo
      const mockSessions: LiveSession[] = [
        {
          id: 'session_1',
          name: 'Python Algorithms Practice',
          description: 'Working on sorting algorithms together',
          hostId: 'host_1',
          participants: [],
          code: 'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr',
          language: 'python',
          isPublic: true,
          maxParticipants: 10,
          createdAt: Date.now() - 3600000,
          status: 'active',
        },
        {
          id: 'session_2',
          name: 'JavaScript React Components',
          description: 'Building React components collaboratively',
          hostId: 'host_2',
          participants: [],
          code: 'function WelcomeComponent({ name }) {\n  return (\n    <div>\n      <h1>Welcome, {name}!</h1>\n    </div>\n  );\n}',
          language: 'javascript',
          isPublic: true,
          maxParticipants: 8,
          createdAt: Date.now() - 7200000,
          status: 'active',
        },
      ];
      
      setSessions(mockSessions);
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const createSession = async (sessionData: any) => {
    try {
      const session = await webSocketService.createSession(sessionData);
      setSessions(prev => [session, ...prev]);
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Session created successfully!');
    } catch (error: any) {
      console.error('Failed to create session:', error);
      Alert.alert('Error', error.message || 'Failed to create session');
    }
  };

  const joinSession = async (session: LiveSession) => {
    try {
      await webSocketService.joinSession(session.id);
      setCurrentSession(session);
      setCode(session.code);
      setLanguage(session.language);
      setParticipants(session.participants);
      
      Alert.alert('Success', 'Joined session successfully!');
    } catch (error: any) {
      console.error('Failed to join session:', error);
      Alert.alert('Error', error.message || 'Failed to join session');
    }
  };

  const leaveSession = () => {
    if (currentSession) {
      webSocketService.leaveSession(currentSession.id);
      setCurrentSession(null);
      setCode('');
      setParticipants([]);
    }
  };

  const executeCode = () => {
    if (!currentSession || !code.trim()) return;
    
    setIsExecuting(true);
    webSocketService.executeCode(code, language, currentSession.id);
  };

  const onCodeChange = (text: string) => {
    setCode(text);
    
    if (currentSession) {
      // Send code change to other participants
      const change: CodeChange = {
        type: 'replace',
        position: { line: 0, column: 0 },
        content: text,
        length: code.length,
        userId: webSocketService.getUserId(),
        timestamp: Date.now(),
      };
      
      webSocketService.sendCodeChange(change);
    }
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

  const getFilteredSessions = () => {
    let filtered = sessions;

    if (searchQuery) {
      filtered = filtered.filter(session =>
        session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(session => session.status === filterStatus);
    }

    return filtered;
  };

  const SessionCard = ({ session }: { session: LiveSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => joinSession(session)}
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
          <ResponsiveIcon name="lock-open-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {session.isPublic ? 'Public' : 'Private'}
          </ResponsiveText>
        </View>
      </View>

      <ResponsiveText variant="xs" style={styles.sessionTime}>
        Started: {new Date(session.createdAt).toLocaleString()}
      </ResponsiveText>
    </TouchableOpacity>
  );

  const ParticipantItem = ({ participant }: { participant: Participant }) => (
    <View style={styles.participantItem}>
      <View style={styles.participantHeader}>
        <View style={[styles.onlineIndicator, participant.isOnline ? styles.online : styles.offline]} />
        <ResponsiveText variant="md" style={styles.participantName}>
          {participant.name}
        </ResponsiveText>
        <View style={[styles.roleBadge, { backgroundColor: participant.role === 'host' ? '#FF9800' : '#2196F3' }]}>
          <ResponsiveText variant="xs" style={styles.roleText}>
            {participant.role}
          </ResponsiveText>
        </View>
      </View>

      <View style={styles.participantPermissions}>
        {participant.permissions.canEdit && (
          <View style={styles.permissionItem}>
            <ResponsiveIcon name="create-outline" size="xs" color="#4CAF50" />
            <ResponsiveText variant="xs" style={styles.permissionText}>Edit</ResponsiveText>
          </View>
        )}
        {participant.permissions.canExecute && (
          <View style={styles.permissionItem}>
            <ResponsiveIcon name="play-outline" size="xs" color="#4CAF50" />
            <ResponsiveText variant="xs" style={styles.permissionText}>Execute</ResponsiveText>
          </View>
        )}
        {participant.permissions.canChat && (
          <View style={styles.permissionItem}>
            <ResponsiveIcon name="chatbubble-outline" size="xs" color="#4CAF50" />
            <ResponsiveText variant="xs" style={styles.permissionText}>Chat</ResponsiveText>
          </View>
        )}
      </View>
    </View>
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
            Create Live Session
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <CreateSessionForm onSubmit={createSession} onCancel={() => setShowCreateModal(false)} />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const ExecutionResultModal = () => (
    <Modal
      visible={showExecutionModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowExecutionModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowExecutionModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Execution Result
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            {isExecuting ? (
              <View style={styles.executionStatus}>
                <ResponsiveIcon name="hourglass" size="lg" color="#007AFF" />
                <ResponsiveText variant="md" style={styles.statusText}>
                  Executing code...
                </ResponsiveText>
              </View>
            ) : executionResult ? (
              <View>
                <View style={styles.resultHeader}>
                  <ResponsiveText variant="md" style={styles.sectionTitle}>
                    Result
                  </ResponsiveText>
                  <ResponsiveText variant="xs" style={styles.executionTime}>
                    {executionResult.executionTime}ms
                  </ResponsiveText>
                </View>

                {executionResult.output && (
                  <View style={styles.resultSection}>
                    <ResponsiveText variant="sm" style={styles.resultLabel}>
                      Output:
                    </ResponsiveText>
                    <Text style={styles.resultText}>{executionResult.output}</Text>
                  </View>
                )}

                {executionResult.error && (
                  <View style={styles.resultSection}>
                    <ResponsiveText variant="sm" style={styles.resultLabel}>
                      Error:
                    </ResponsiveText>
                    <Text style={styles.errorText}>{executionResult.error}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (currentSession) {
    return (
      <Container padding margin>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          {/* Session Header */}
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <ResponsiveText variant="lg" style={styles.sessionTitle}>
                {currentSession.name}
              </ResponsiveText>
              <ResponsiveText variant="sm" style={styles.sessionLanguage}>
                {currentSession.language}
              </ResponsiveText>
            </View>
            <View style={styles.sessionActions}>
              <TouchableOpacity style={styles.connectionStatus} onPress={() => setShowParticipantsModal(true)}>
                <ResponsiveIcon name="people-outline" size="md" color="#fff" />
                <ResponsiveText variant="xs" style={styles.connectionText}>
                  {participants.length}
                </ResponsiveText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.connectionStatus, { backgroundColor: getConnectionStatusColor() }]}>
                <ResponsiveIcon name="wifi-outline" size="md" color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.leaveButton} onPress={leaveSession}>
                <ResponsiveIcon name="exit-outline" size="md" color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Code Editor */}
          <Card shadow padding={spacing.md} margin={spacing.sm} style={styles.flex}>
            <View style={styles.codeEditorHeader}>
              <ResponsiveText variant="md" style={styles.sectionTitle}>
                Code Editor
              </ResponsiveText>
              <ResponsiveButton variant="primary" style={styles.executeButton} onPress={executeCode}>
                <ResponsiveIcon name="play-outline" size="sm" />
                <ResponsiveText variant="xs">Run</ResponsiveText>
              </ResponsiveButton>
            </View>

            <TextInput
              ref={codeInputRef}
              style={styles.codeEditor}
              placeholder="Start coding together..."
              value={code}
              onChangeText={onCodeChange}
              multiline
              textAlignVertical="top"
              numberOfLines={20}
              fontFamily="monospace"
            />
          </Card>

          {/* Participants Modal */}
          <Modal
            visible={showParticipantsModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowParticipantsModal(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowParticipantsModal(false)}>
                  <ResponsiveIcon name="close" size="lg" />
                </TouchableOpacity>
                <ResponsiveText variant="lg" style={styles.modalTitle}>
                  Participants ({participants.length})
                </ResponsiveText>
                <View style={styles.modalSpacer} />
              </View>

              <ScrollView style={styles.modalContent}>
                <Card shadow padding={spacing.md} margin={spacing.sm}>
                  {participants.map((participant) => (
                    <ParticipantItem key={participant.id} participant={participant} />
                  ))}
                </Card>
              </ScrollView>
            </SafeAreaView>
          </Modal>

          {/* Execution Result Modal */}
          <ExecutionResultModal />
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
            Live Coding Sessions
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Collaborative coding in real-time
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
                {['all', 'active', 'ended'].map((status) => (
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
        <View style={styles.sessionsSection}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Sessions ({getFilteredSessions().length})
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
const CreateSessionForm: React.FC<{ onSubmit: (data: any) => void; onCancel: () => void }> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'python',
    isPublic: true,
    maxParticipants: 10,
  });

  const { spacing } = useResponsive();

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a session name');
      return;
    }

    onSubmit(formData);
  };

  return (
    <View>
      <View style={styles.formSection}>
        <ResponsiveText variant="md" style={styles.formLabel}>
          Session Name
        </ResponsiveText>
        <TextInput
          style={styles.textInput}
          placeholder="Enter session name"
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
        <View style={styles.switchRow}>
          <ResponsiveText variant="md" style={styles.switchLabel}>
            Public Session
          </ResponsiveText>
          <TouchableOpacity
            style={[styles.switch, formData.isPublic && styles.switchActive]}
            onPress={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
          >
            <View style={styles.switchThumb} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formSection}>
        <ResponsiveText variant="md" style={styles.formLabel}>
          Max Participants
        </ResponsiveText>
        <TextInput
          style={styles.textInput}
          placeholder="Maximum participants"
          value={formData.maxParticipants.toString()}
          onChangeText={(text) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(text) || 10 }))}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formActions}>
        <ResponsiveButton variant="outline" style={styles.cancelButton} onPress={onCancel}>
          <ResponsiveText variant="sm">Cancel</ResponsiveText>
        </ResponsiveButton>
        <ResponsiveButton variant="primary" style={styles.submitButton} onPress={handleSubmit}>
          <ResponsiveText variant="sm">Create Session</ResponsiveText>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 20,
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
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sessionsSection: {
    marginBottom: 20,
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
  sessionTime: {
    color: '#999',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  switch: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ccc',
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#007AFF',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    marginLeft: 2,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionLanguage: {
    color: '#666',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 5,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  leaveButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F44336',
  },
  codeEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  codeEditor: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
  },
  participantItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  online: {
    backgroundColor: '#4CAF50',
  },
  offline: {
    backgroundColor: '#ccc',
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
  participantPermissions: {
    flexDirection: 'row',
    gap: 10,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  permissionText: {
    fontSize: 12,
    color: '#666',
  },
  executionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  executionTime: {
    color: '#666',
  },
  resultSection: {
    marginBottom: 15,
  },
  resultLabel: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  resultText: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  errorText: {
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#F44336',
  },
});

export default LiveCodingSessionScreen;

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
import AdvancedCodeExecutionService, { CollaborationSession, Participant, Activity } from '../services/advancedCodeExecutionService';

const { width, height } = Dimensions.get('window');

const RealTimeCollaborationScreen: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<CollaborationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    description: '',
    code: '',
    language: 'python',
    is_public: false,
    max_participants: 4,
  });
  const [joinSessionId, setJoinSessionId] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [cursorPositions, setCursorPositions] = useState<Map<string, { line: number; column: number }>>(new Map());
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  
  const collaborationService = AdvancedCodeExecutionService.getInstance();
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    loadActiveSessions();
    setupWebSocket();
    
    return () => {
      cleanupWebSocket();
    };
  }, []);

  const loadActiveSessions = async () => {
    try {
      const sessions = await collaborationService.getPublicCollaborationSessions();
      setActiveSessions(sessions);
    } catch (error: any) {
      console.error('Failed to load active sessions:', error);
      Alert.alert('Error', 'Failed to load active sessions');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActiveSessions();
    setRefreshing(false);
  };

  const setupWebSocket = () => {
    // Mock WebSocket setup
    setIsConnected(true);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (currentSession) {
        // Simulate participant activity
        const mockActivity: Activity = {
          activity_id: Date.now().toString(),
          type: 'cursor_move',
          user_id: 'user123',
          timestamp: new Date().toISOString(),
          data: { line: Math.floor(Math.random() * 10), column: Math.floor(Math.random() * 20) },
        };
        
        setActivities(prev => [mockActivity, ...prev.slice(0, 50)]);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  };

  const cleanupWebSocket = () => {
    setIsConnected(false);
  };

  const createSession = async () => {
    if (!newSessionData.title.trim()) {
      Alert.alert('Error', 'Please enter a session title');
      return;
    }

    try {
      const session = await collaborationService.createCollaborationSession(newSessionData);
      setCurrentSession(session);
      setShowCreateModal(false);
      setNewSessionData({
        title: '',
        description: '',
        code: '',
        language: 'python',
        is_public: false,
        max_participants: 4,
      });
      
      Alert.alert('Success', 'Collaboration session created successfully!');
    } catch (error: any) {
      console.error('Failed to create session:', error);
      Alert.alert('Error', error.message || 'Failed to create session');
    }
  };

  const joinSession = async () => {
    if (!joinSessionId.trim()) {
      Alert.alert('Error', 'Please enter a session ID');
      return;
    }

    try {
      const session = await collaborationService.joinCollaborationSession(joinSessionId, 'current_user');
      setCurrentSession(session);
      setShowJoinModal(false);
      setJoinSessionId('');
      
      Alert.alert('Success', 'Joined collaboration session successfully!');
    } catch (error: any) {
      console.error('Failed to join session:', error);
      Alert.alert('Error', error.message || 'Failed to join session');
    }
  };

  const leaveSession = async () => {
    if (!currentSession) return;

    try {
      await collaborationService.leaveCollaborationSession(currentSession.session_id, 'current_user');
      setCurrentSession(null);
      setSessionCode('');
      setParticipants([]);
      setActivities([]);
      
      Alert.alert('Success', 'Left collaboration session successfully!');
    } catch (error: any) {
      console.error('Failed to leave session:', error);
      Alert.alert('Error', error.message || 'Failed to leave session');
    }
  };

  const updateCode = async (code: string) => {
    setSessionCode(code);
    
    if (currentSession) {
      try {
        await collaborationService.updateCollaborationCode(currentSession.session_id, code, 'current_user');
        
        // Add activity
        const activity: Activity = {
          activity_id: Date.now().toString(),
          type: 'code_change',
          user_id: 'current_user',
          timestamp: new Date().toISOString(),
          data: { code_length: code.length },
        };
        
        setActivities(prev => [activity, ...prev.slice(0, 50)]);
      } catch (error: any) {
        console.error('Failed to update code:', error);
      }
    }
  };

  const executeCode = async () => {
    if (!currentSession || !sessionCode.trim()) {
      Alert.alert('Error', 'Please enter some code to execute');
      return;
    }

    try {
      const result = await collaborationService.executeCode({
        code: sessionCode,
        language: currentSession.language,
        stdin: '',
      });
      
      // Add execution activity
      const activity: Activity = {
        activity_id: Date.now().toString(),
        type: 'execution',
        user_id: 'current_user',
        timestamp: new Date().toISOString(),
        data: { result: result.status },
      };
      
      setActivities(prev => [activity, ...prev.slice(0, 50)]);
      
      Alert.alert('Execution Result', `Status: ${result.status}`);
    } catch (error: any) {
      console.error('Failed to execute code:', error);
      Alert.alert('Error', error.message || 'Failed to execute code');
    }
  };

  const SessionCard = ({ session }: { session: CollaborationSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => setCurrentSession(session)}
    >
      <View style={styles.sessionHeader}>
        <ResponsiveText variant="lg" style={styles.sessionTitle}>
          {session.title}
        </ResponsiveText>
        <View style={[styles.sessionStatus, session.is_public ? styles.publicSession : styles.privateSession]}>
          <ResponsiveIcon 
            name={session.is_public ? 'globe-outline' : 'lock-closed-outline'} 
            size="sm" 
            color="#fff" 
          />
          <ResponsiveText variant="xs" style={styles.statusText}>
            {session.is_public ? 'Public' : 'Private'}
          </ResponsiveText>
        </View>
      </View>

      {session.description && (
        <ResponsiveText variant="sm" style={styles.sessionDescription}>
          {session.description}
        </ResponsiveText>
      )}

      <View style={styles.sessionMeta}>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="people-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {session.participants.length}/{session.max_participants}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="code-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {session.language}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="time-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {new Date(session.created_at).toLocaleDateString()}
          </ResponsiveText>
        </View>
      </View>

      <View style={styles.sessionFooter}>
        <ResponsiveText variant="xs" style={styles.sessionOwner}>
          Created by {session.created_by}
        </ResponsiveText>
        <ResponsiveButton variant="outline" style={styles.joinButton}>
          <ResponsiveIcon name="add-outline" size="sm" />
          <ResponsiveText variant="xs">Join</ResponsiveText>
        </ResponsiveButton>
      </View>
    </TouchableOpacity>
  );

  const ParticipantItem = ({ participant }: { participant: Participant }) => (
    <View style={styles.participantItem}>
      <View style={styles.participantAvatar}>
        <ResponsiveIcon name="person-outline" size="lg" />
      </View>
      <View style={styles.participantInfo}>
        <ResponsiveText variant="md" style={styles.participantName}>
          {participant.username}
        </ResponsiveText>
        <View style={styles.participantStatus}>
          <View style={[styles.statusDot, { backgroundColor: participant.status === 'online' ? '#4CAF50' : participant.status === 'away' ? '#FF9800' : '#ccc' }]} />
          <ResponsiveText variant="xs" style={styles.statusText}>
            {participant.status}
          </ResponsiveText>
          {participant.is_typing && (
            <ResponsiveText variant="xs" style={styles.typingText}>
              typing...
            </ResponsiveText>
          )}
        </View>
      </View>
      <View style={styles.participantRole}>
        <ResponsiveText variant="xs" style={styles.roleText}>
          {participant.role}
        </ResponsiveText>
      </View>
    </View>
  );

  const ActivityItem = ({ activity }: { activity: Activity }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <ResponsiveIcon 
          name={
            activity.type === 'code_change' ? 'code-outline' :
            activity.type === 'execution' ? 'play-outline' :
            activity.type === 'join' ? 'person-add-outline' :
            activity.type === 'leave' ? 'person-remove-outline' :
            'ellipsis-horizontal-outline'
          } 
          size="sm" 
          color="#007AFF" 
        />
      </View>
      <View style={styles.activityContent}>
        <ResponsiveText variant="xs" style={styles.activityUser}>
          {activity.user_id}
        </ResponsiveText>
        <ResponsiveText variant="xs" style={styles.activityAction}>
          {activity.type === 'code_change' ? 'updated code' :
           activity.type === 'execution' ? 'executed code' :
           activity.type === 'join' ? 'joined session' :
           activity.type === 'leave' ? 'left session' :
           'performed action'}
        </ResponsiveText>
        <ResponsiveText variant="xs" style={styles.activityTime}>
          {new Date(activity.timestamp).toLocaleTimeString()}
        </ResponsiveText>
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
            Create Collaboration Session
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Session Title
              </ResponsiveText>
              <TextInput
                style={styles.textInput}
                placeholder="Enter session title"
                value={newSessionData.title}
                onChangeText={(text) => setNewSessionData(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Description (Optional)
              </ResponsiveText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter session description"
                value={newSessionData.description}
                onChangeText={(text) => setNewSessionData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Initial Code
              </ResponsiveText>
              <TextInput
                style={[styles.textInput, styles.codeInput]}
                placeholder="Enter initial code"
                value={newSessionData.code}
                onChangeText={(text) => setNewSessionData(prev => ({ ...prev, code: text }))}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
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
                      newSessionData.language === lang && styles.languageOptionSelected,
                    ]}
                    onPress={() => setNewSessionData(prev => ({ ...prev, language: lang }))}
                  >
                    <ResponsiveText
                      variant="sm"
                      style={[
                        styles.languageOptionText,
                        newSessionData.language === lang && styles.languageOptionTextSelected,
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
                  style={[styles.switch, newSessionData.is_public && styles.switchActive]}
                  onPress={() => setNewSessionData(prev => ({ ...prev, is_public: !prev.is_public }))}
                >
                  <View style={styles.switchThumb} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Max Participants
              </ResponsiveText>
              <View style={styles.participantSelector}>
                {[2, 4, 6, 8].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.participantOption,
                      newSessionData.max_participants === count && styles.participantOptionSelected,
                    ]}
                    onPress={() => setNewSessionData(prev => ({ ...prev, max_participants: count }))}
                  >
                    <ResponsiveText
                      variant="sm"
                      style={[
                        styles.participantOptionText,
                        newSessionData.max_participants === count && styles.participantOptionTextSelected,
                      ]}
                    >
                      {count}
                    </ResponsiveText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <ResponsiveButton
              variant="primary"
              style={styles.createButton}
              onPress={createSession}
            >
              <ResponsiveIcon name="add-outline" size="md" />
              <ResponsiveText variant="sm">Create Session</ResponsiveText>
            </ResponsiveButton>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const JoinSessionModal = () => (
    <Modal
      visible={showJoinModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowJoinModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowJoinModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Join Collaboration Session
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Session ID
              </ResponsiveText>
              <TextInput
                style={styles.textInput}
                placeholder="Enter session ID"
                value={joinSessionId}
                onChangeText={setJoinSessionId}
              />
            </View>

            <ResponsiveButton
              variant="primary"
              style={styles.joinModalButton}
              onPress={joinSession}
            >
              <ResponsiveIcon name="enter-outline" size="md" />
              <ResponsiveText variant="sm">Join Session</ResponsiveText>
            </ResponsiveButton>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (currentSession) {
    return (
      <Container padding margin>
        <ScrollView>
          {/* Session Header */}
          <View style={styles.sessionHeader}>
            <ResponsiveText variant="xxxl" style={styles.sessionTitle}>
              {currentSession.title}
            </ResponsiveText>
            <View style={styles.sessionActions}>
              <TouchableOpacity style={styles.participantButton} onPress={() => setShowParticipantModal(true)}>
                <ResponsiveIcon name="people-outline" size="md" />
                <Text style={styles.participantCount}>{currentSession.participants.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.leaveButton} onPress={leaveSession}>
                <ResponsiveIcon name="exit-outline" size="md" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <View style={[styles.statusIndicator, isConnected ? styles.statusConnected : styles.statusDisconnected]} />
            <ResponsiveText variant="sm" style={styles.connectionText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </ResponsiveText>
          </View>

          {/* Code Editor */}
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.codeEditorHeader}>
              <ResponsiveText variant="md" style={styles.codeEditorTitle}>
                Code Editor
              </ResponsiveText>
              <View style={styles.codeEditorActions}>
                <TouchableOpacity style={styles.codeActionButton}>
                  <ResponsiveIcon name="share-outline" size="sm" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.codeActionButton}>
                  <ResponsiveIcon name="download-outline" size="sm" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.codeActionButton} onPress={executeCode}>
                  <ResponsiveIcon name="play-outline" size="sm" />
                </TouchableOpacity>
              </View>
            </View>
            
            <TextInput
              style={styles.codeEditor}
              placeholder="Write your code here..."
              value={sessionCode}
              onChangeText={updateCode}
              multiline
              textAlignVertical="top"
              numberOfLines={15}
              fontFamily="monospace"
            />

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <View style={styles.typingIndicator}>
                <ResponsiveText variant="xs" style={styles.typingText}>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </ResponsiveText>
              </View>
            )}
          </Card>

          {/* Activity Feed */}
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <ResponsiveText variant="md" style={styles.sectionTitle}>
              Activity Feed
            </ResponsiveText>
            <FlatList
              data={activities}
              renderItem={({ item }) => <ActivityItem activity={item} />}
              keyExtractor={(item) => item.activity_id}
              showsVerticalScrollIndicator={false}
              style={styles.activityList}
            />
          </Card>

          {/* Participants Modal */}
          <Modal
            visible={showParticipantModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowParticipantModal(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowParticipantModal(false)}>
                  <ResponsiveIcon name="close" size="lg" />
                </TouchableOpacity>
                <ResponsiveText variant="lg" style={styles.modalTitle}>
                  Participants
                </ResponsiveText>
                <View style={styles.modalSpacer} />
              </View>

              <ScrollView style={styles.modalContent}>
                {currentSession.participants.map((participant) => (
                  <ParticipantItem key={participant.user_id} participant={participant} />
                ))}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </ScrollView>
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
            Real-time Collaboration
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Live coding sessions with real-time collaboration
          </ResponsiveText>
        </View>

        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={[styles.statusIndicator, isConnected ? styles.statusConnected : styles.statusDisconnected]} />
          <ResponsiveText variant="sm" style={styles.connectionText}>
            {isConnected ? 'Connected to collaboration server' : 'Disconnected'}
          </ResponsiveText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <ResponsiveButton
            variant="primary"
            style={styles.actionButton}
            onPress={() => setShowCreateModal(true)}
          >
            <ResponsiveIcon name="add-outline" size="md" />
            <ResponsiveText variant="sm">Create Session</ResponsiveText>
          </ResponsiveButton>
          <ResponsiveButton
            variant="outline"
            style={styles.actionButton}
            onPress={() => setShowJoinModal(true)}
          >
            <ResponsiveIcon name="enter-outline" size="md" />
            <ResponsiveText variant="sm">Join Session</ResponsiveText>
          </ResponsiveButton>
        </View>

        {/* Active Sessions */}
        <View style={styles.sessionsSection}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Active Sessions ({activeSessions.length})
          </ResponsiveText>
          
          {activeSessions.map((session) => (
            <SessionCard key={session.session_id} session={session} />
          ))}
        </View>

        {/* Modals */}
        <CreateSessionModal />
        <JoinSessionModal />
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDisconnected: {
    backgroundColor: '#F44336',
  },
  connectionText: {
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  sessionsSection: {
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
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionTitle: {
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  publicSession: {
    backgroundColor: '#4CAF50',
  },
  privateSession: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionOwner: {
    color: '#999',
    fontSize: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  participantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5,
  },
  participantCount: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  leaveButton: {
    backgroundColor: '#fff5f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  codeEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeEditorTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  codeEditorActions: {
    flexDirection: 'row',
    gap: 10,
  },
  codeActionButton: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
  },
  codeEditor: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 300,
  },
  typingIndicator: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#f0f8ff',
    borderRadius: 5,
  },
  typingText: {
    color: '#007AFF',
    fontStyle: 'italic',
  },
  activityList: {
    maxHeight: 200,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    fontWeight: 'bold',
    color: '#333',
  },
  activityAction: {
    color: '#666',
  },
  activityTime: {
    color: '#999',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontWeight: 'bold',
    color: '#333',
  },
  participantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  participantRole: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
  },
  roleText: {
    color: '#007AFF',
    fontSize: 10,
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
  codeInput: {
    height: 120,
    fontFamily: 'monospace',
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
  participantSelector: {
    flexDirection: 'row',
    gap: 5,
  },
  participantOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantOptionSelected: {
    backgroundColor: '#007AFF',
  },
  participantOptionText: {
    color: '#666',
    fontWeight: 'bold',
  },
  participantOptionTextSelected: {
    color: '#fff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  joinModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
});

export default RealTimeCollaborationScreen;

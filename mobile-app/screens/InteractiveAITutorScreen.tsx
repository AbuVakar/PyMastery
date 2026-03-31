import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Animated,
  Dimensions,
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
import AdaptiveLearningService, {
  LearningProfile,
  LearningSession,
  AdaptiveContent,
} from '../services/adaptiveLearningService';

const { width, height } = Dimensions.get('window');

const InteractiveAITutorScreen: React.FC = () => {
  const [userProfile, setUserProfile] = useState<LearningProfile | null>(null);
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [adaptiveContent, setAdaptiveContent] = useState<AdaptiveContent[]>([]);
  const [currentContent, setCurrentContent] = useState<AdaptiveContent | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [currentMode, setCurrentMode] = useState<'chat' | 'practice' | 'quiz' | 'review'>('chat');
  const [realTimeAdaptation, setRealTimeAdaptation] = useState<any>(null);
  const [engagementScore, setEngagementScore] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState(50);
  const [learningInsights, setLearningInsights] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const adaptiveService = AdaptiveLearningService.getInstance();
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    initializeTutor();
  }, []);

  const initializeTutor = async () => {
    try {
      // In a real app, get user ID from auth context
      const userId = 'demo-user';
      
      // Get or create user profile
      let profile = await adaptiveService.getUserProfile(userId);
      if (!profile) {
        profile = await adaptiveService.createUserProfile(userId, {
          skill_level: 'intermediate',
          learning_style: 'visual',
          pace_preference: 'moderate',
          difficulty_tolerance: 'balanced',
          strengths: ['python', 'javascript'],
          weaknesses: ['algorithms', 'data structures'],
          interests: ['web development', 'ai'],
          goals: ['career advancement', 'skill improvement'],
          time_available: 30,
          preferred_session_length: 25,
          completion_rate: 0.75,
          average_session_time: 20,
          streak_days: 5,
          last_active: new Date().toISOString(),
        });
      }
      
      setUserProfile(profile);
      
      // Get adaptive content
      const content = await adaptiveService.getAdaptiveContent(userId, {
        session_length: 25,
        current_mood: 'motivated',
      });
      setAdaptiveContent(content);
      
      // Get learning insights
      const insights = await adaptiveService.getLearningInsights(userId);
      setLearningInsights(insights);
      
      // Start with welcome message
      setChatMessages([
        {
          id: '1',
          type: 'tutor',
          content: `Welcome back! I'm your AI tutor. I've analyzed your learning profile and adapted today's content to your visual learning style and intermediate skill level. Ready to continue your learning journey?`,
          timestamp: new Date().toISOString(),
          adaptations: {
            difficulty_adjusted: true,
            pace_modified: false,
            additional_support: false,
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to initialize tutor:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeTutor();
    setRefreshing(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    // Add user message
    const newMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, newMessage]);

    // Simulate AI thinking
    setTimeout(async () => {
      try {
        // Get real-time adaptation
        const adaptation = await adaptiveService.getRealTimeAdaptation('demo-user', {
          current_performance: 0.8,
          time_spent: 15,
          help_requests: 2,
          mistakes: 1,
          engagement_level: 0.9,
        });
        
        setRealTimeAdaptation(adaptation);
        
        // Generate AI response based on adaptation
        let aiResponse = '';
        if (adaptation.should_adjust_difficulty) {
          aiResponse = `I notice you're doing great! I've adjusted the difficulty level to ${adaptation.new_difficulty} to keep you challenged but not overwhelmed. ${adaptation.recommendations[0] || ''}`;
        } else if (adaptation.should_provide_hint) {
          aiResponse = `Let me give you a hint: ${adaptation.recommendations[0] || 'Try breaking down the problem into smaller steps.'}`;
        } else {
          aiResponse = `Great question! Based on your learning style, I recommend ${adaptation.recommendations[0] || 'visualizing the problem with diagrams'}. This approach works well for visual learners like you.`;
        }

        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'tutor',
          content: aiResponse,
          timestamp: new Date().toISOString(),
          adaptations: adaptation,
        };

        setChatMessages(prev => [...prev, aiMessage]);
        
        // Update engagement score
        setEngagementScore(prev => Math.min(100, prev + 5));
        
        // Animate response
        Animated.sequence([
          Animated.timing(fadeAnim, { to: 0.3, duration: 200 }),
          Animated.timing(fadeAnim, { to: 1, duration: 200 }),
        ]).start();
        
      } catch (error) {
        console.error('Failed to get AI response:', error);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    }, 1500);

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const startLearningSession = async (content: AdaptiveContent) => {
    try {
      const session = await adaptiveService.startLearningSession('demo-user', content.id, {
        estimated_duration: content.estimated_time,
        user_mood: 'motivated',
        context: currentMode,
      });
      
      setCurrentSession(session);
      setCurrentContent(content);
      setShowContentModal(true);
      
      // Add tutor message
      const tutorMessage = {
        id: Date.now().toString(),
        type: 'tutor',
        content: `Great choice! I've prepared this ${content.type} for you. Based on your profile, I've adapted it with ${content.adaptations.visual_aids ? 'visual aids' : 'step-by-step instructions'} and adjusted the difficulty to match your current skill level.`,
        timestamp: new Date().toISOString(),
        content_info: {
          title: content.title,
          type: content.type,
          estimated_time: content.estimated_time,
        },
      };
      
      setChatMessages(prev => [...prev, tutorMessage]);
    } catch (error) {
      console.error('Failed to start learning session:', error);
      Alert.alert('Error', 'Failed to start learning session');
    }
  };

  const updateSessionProgress = async (progress: number) => {
    if (!currentSession) return;

    try {
      await adaptiveService.updateLearningSession(currentSession.id, {
        progress,
        performance_metrics: {
          accuracy: 0.85,
          time_efficiency: 0.9,
          help_requests: 2,
          mistakes: 1,
          hints_used: 1,
        },
      });
    } catch (error) {
      console.error('Failed to update session progress:', error);
    }
  };

  const completeSession = async () => {
    if (!currentSession) return;

    try {
      await adaptiveService.completeLearningSession(currentSession.id, {
        final_performance: {
          accuracy: 0.85,
          time_efficiency: 0.9,
          help_requests: 2,
          mistakes: 1,
          hints_used: 1,
        },
        final_feedback: {
          difficulty_rating: 4,
          engagement_rating: 5,
          confidence_rating: 4,
        },
        total_time: currentSession.duration,
      });
      
      setCurrentSession(null);
      setShowContentModal(false);
      
      // Add completion message
      const completionMessage = {
        id: Date.now().toString(),
        type: 'tutor',
        content: `Excellent work! You've completed the session with 85% accuracy. I've updated your learning profile and prepared your next adaptive content. Would you like to continue with a similar topic or try something new?`,
        timestamp: new Date().toISOString(),
        session_completed: true,
      };
      
      setChatMessages(prev => [...prev, completionMessage]);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const UserProfileModal = () => (
    <Modal
      visible={showProfileModal}
      animationType="slide"
      presentationStyle={isTablet ? 'pageSheet' : 'fullScreen'}
      onRequestClose={() => setShowProfileModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowProfileModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Learning Profile
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>
        
        {userProfile && (
          <ScrollView style={styles.modalContent}>
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Skill Level
              </ResponsiveText>
              <ResponsiveText variant="md">
                {userProfile.skill_level.charAt(0).toUpperCase() + userProfile.skill_level.slice(1)}
              </ResponsiveText>
            </Card>

            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Learning Style
              </ResponsiveText>
              <ResponsiveText variant="md">
                {userProfile.learning_style.charAt(0).toUpperCase() + userProfile.learning_style.slice(1)}
              </ResponsiveText>
            </Card>

            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Progress
              </ResponsiveText>
              <ResponsiveText variant="md">
                Completion Rate: {(userProfile.completion_rate * 100).toFixed(1)}%
              </ResponsiveText>
              <ResponsiveText variant="md">
                Streak: {userProfile.streak_days} days
              </ResponsiveText>
            </Card>

            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Strengths
              </ResponsiveText>
              {userProfile.strengths.map((strength, index) => (
                <ResponsiveText key={index} variant="sm">
                  • {strength}
                </ResponsiveText>
              ))}
            </Card>

            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Areas for Improvement
              </ResponsiveText>
              {userProfile.weaknesses.map((weakness, index) => (
                <ResponsiveText key={index} variant="sm">
                  • {weakness}
                </ResponsiveText>
              ))}
            </Card>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const ContentModal = () => (
    <Modal
      visible={showContentModal}
      animationType="slide"
      presentationStyle={isTablet ? 'pageSheet' : 'fullScreen'}
      onRequestClose={() => completeSession()}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => completeSession()}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            {currentContent?.title}
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>
        
        {currentContent && (
          <ScrollView style={styles.modalContent}>
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                {currentContent.description}
              </ResponsiveText>
              <ResponsiveText variant="md" style={styles.contentInfo}>
                Estimated time: {currentContent.estimated_time} minutes
              </ResponsiveText>
              <ResponsiveText variant="md" style={styles.contentInfo}>
                Difficulty: {currentContent.difficulty}/100
              </ResponsiveText>
            </Card>

            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Learning Objectives
              </ResponsiveText>
              {currentContent.learning_objectives.map((objective, index) => (
                <ResponsiveText key={index} variant="sm">
                  • {objective}
                </ResponsiveText>
              ))}
            </Card>

            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Content
              </ResponsiveText>
              <ResponsiveText variant="md">
                {currentContent.content.text || 'Interactive content will appear here...'}
              </ResponsiveText>
            </Card>

            <View style={styles.contentActions}>
              <ResponsiveButton variant="outline" style={styles.contentButton}>
                <ResponsiveIcon name="help-circle-outline" size="md" />
                <ResponsiveText variant="sm">Get Hint</ResponsiveText>
              </ResponsiveButton>
              <ResponsiveButton variant="primary" style={styles.contentButton}>
                <ResponsiveIcon name="checkmark-circle-outline" size="md" />
                <ResponsiveText variant="sm">Complete</ResponsiveText>
              </ResponsiveButton>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const MessageBubble = ({ message }: { message: any }) => (
    <Animated.View style={[styles.messageBubble, message.type === 'user' ? styles.userBubble : styles.tutorBubble]}>
      <ResponsiveText variant="md" style={[styles.messageText, message.type === 'user' ? styles.userText : styles.tutorText]}>
        {message.content}
      </ResponsiveText>
      {message.content_info && (
        <View style={styles.contentInfo}>
          <ResponsiveText variant="sm" style={styles.contentTitle}>
            {message.content_info.title}
          </ResponsiveText>
          <ResponsiveText variant="xs" style={styles.contentMeta}>
            {message.content_info.type} • {message.content_info.estimated_time}min
          </ResponsiveText>
        </View>
      )}
      {message.adaptations && (
        <View style={styles.adaptationInfo}>
          <ResponsiveIcon name="sparkles-outline" size="sm" color="#FF9800" />
          <ResponsiveText variant="xs" style={styles.adaptationText}>
            Content adapted to your learning style
          </ResponsiveText>
        </View>
      )}
      <ResponsiveText variant="xs" style={styles.messageTime}>
        {new Date(message.timestamp).toLocaleTimeString()}
      </ResponsiveText>
    </Animated.View>
  );

  const QuickActionCard = ({ icon, title, description, onPress, color = '#007AFF' }: any) => (
    <TouchableOpacity style={[styles.quickActionCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <ResponsiveIcon name={icon} size="lg" color={color} />
      </View>
      <View style={styles.quickActionContent}>
        <ResponsiveText variant="md" style={styles.quickActionTitle}>
          {title}
        </ResponsiveText>
        <ResponsiveText variant="sm" style={styles.quickActionDescription}>
          {description}
        </ResponsiveText>
      </View>
      <ResponsiveIcon name="chevron-forward" size="md" color="#666" />
    </TouchableOpacity>
  );

  return (
    <Container padding margin>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ResponsiveText variant="xxxl" style={styles.title}>
            AI Tutor
          </ResponsiveText>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.profileButton} onPress={() => setShowProfileModal(true)}>
              <ResponsiveIcon name="person-outline" size="md" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.insightsButton} onPress={() => {}}>
              <ResponsiveIcon name="analytics-outline" size="md" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Learning Status */}
        {userProfile && (
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.learningStatus}>
              <View style={styles.statusItem}>
                <ResponsiveIcon name="flame-outline" size="md" color="#FF9800" />
                <ResponsiveText variant="sm" style={styles.statusText}>
                  {userProfile.streak_days} day streak
                </ResponsiveText>
              </View>
              <View style={styles.statusItem}>
                <ResponsiveIcon name="trending-up-outline" size="md" color="#4CAF50" />
                <ResponsiveText variant="sm" style={styles.statusText}>
                  Level: {userProfile.skill_level}
                </ResponsiveText>
              </View>
              <View style={styles.statusItem}>
                <ResponsiveIcon name="speedometer-outline" size="md" color="#007AFF" />
                <ResponsiveText variant="sm" style={styles.statusText}>
                  Pace: {userProfile.pace_preference}
                </ResponsiveText>
              </View>
            </View>
          </Card>
        )}

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          {[
            { key: 'chat', icon: 'chatbubble-outline', label: 'Chat' },
            { key: 'practice', icon: 'code-outline', label: 'Practice' },
            { key: 'quiz', icon: 'help-circle-outline', label: 'Quiz' },
            { key: 'review', icon: 'refresh-outline', label: 'Review' },
          ].map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.modeButton,
                currentMode === mode.key && styles.modeButtonActive,
              ]}
              onPress={() => setCurrentMode(mode.key as any)}
            >
              <ResponsiveIcon
                name={mode.icon as any}
                size="md"
                color={currentMode === mode.key ? '#fff' : '#666'}
              />
              <ResponsiveText
                variant="sm"
                style={[
                  styles.modeButtonText,
                  currentMode === mode.key && styles.modeButtonTextActive,
                ]}
              >
                {mode.label}
              </ResponsiveText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Quick Actions
          </ResponsiveText>
          <QuickActionCard
            icon="book-outline"
            title="Start Learning"
            description="Begin adaptive learning session"
            onPress={() => {
              if (adaptiveContent.length > 0) {
                startLearningSession(adaptiveContent[0]);
              }
            }}
            color="#4CAF50"
          />
          <QuickActionCard
            icon="analytics-outline"
            title="View Insights"
            description="Check your learning analytics"
            onPress={() => {}}
            color="#FF9800"
          />
          <QuickActionCard
            icon="settings-outline"
            title="Adjust Settings"
            description="Personalize your learning experience"
            onPress={() => setShowProfileModal(true)}
            color="#9C27B0"
          />
        </View>

        {/* Real-time Adaptation Indicator */}
        {realTimeAdaptation && (
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.adaptationIndicator}>
              <ResponsiveIcon name="sparkles" size="md" color="#FF9800" />
              <ResponsiveText variant="sm" style={styles.adaptationText}>
                Content adapted to your performance
              </ResponsiveText>
            </View>
          </Card>
        )}

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {chatMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isTyping && (
            <View style={styles.typingIndicator}>
              <ResponsiveText variant="sm" style={styles.typingText}>
                AI Tutor is typing...
              </ResponsiveText>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything about your learning..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={isLoading}
          >
            <ResponsiveIcon
              name={isLoading ? 'hourglass' : 'send'}
              size="md"
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <UserProfileModal />
        <ContentModal />
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  profileButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  insightsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  learningStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    color: '#666',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  quickActionDescription: {
    color: '#666',
  },
  adaptationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  adaptationText: {
    color: '#666',
    fontStyle: 'italic',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  tutorBubble: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  messageText: {
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  tutorText: {
    color: '#333',
  },
  contentInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  contentTitle: {
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  contentMeta: {
    color: '#666',
    fontStyle: 'italic',
  },
  adaptationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 5,
  },
  adaptationText: {
    color: '#666',
    fontStyle: 'italic',
  },
  messageTime: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  typingIndicator: {
    padding: 10,
    alignItems: 'center',
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
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
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  contentButton: {
    flex: 1,
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
});

export default InteractiveAITutorScreen;

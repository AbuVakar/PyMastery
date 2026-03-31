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
  FlatList,
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
import EnhancedAIService, {
  EnhancedAIResponse,
  CodeAnalysisEnhanced,
  LearningPathEnhanced,
  ProblemRecommendationEnhanced,
} from '../services/enhancedAIService';

const { width, height } = Dimensions.get('window');

const AdvancedAIMentorScreen: React.FC = () => {
  const [messages, setMessages] = useState<EnhancedAIResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [currentMode, setCurrentMode] = useState<'chat' | 'code' | 'learning' | 'problems'>('chat');
  const [codeAnalysis, setCodeAnalysis] = useState<CodeAnalysisEnhanced | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPathEnhanced | null>(null);
  const [problemRecommendations, setProblemRecommendations] = useState<ProblemRecommendationEnhanced[]>([]);
  const [showCodeAnalysis, setShowCodeAnalysis] = useState(false);
  const [showLearningPath, setShowLearningPath] = useState(false);
  const [showProblemRecs, setShowProblemRecs] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const aiService = EnhancedAIService.getInstance();
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    initializeAI();
  }, []);

  const initializeAI = async () => {
    try {
      const providersData = await aiService.getProviders();
      setProviders(providersData);
      
      const modelStatus = await aiService.getModelStatus();
      setSelectedProvider(modelStatus.currentProvider);
      setSelectedModel(modelStatus.currentModel);
      setModels(modelStatus.availableProviders.find(p => p.name === modelStatus.currentProvider)?.models || []);
    } catch (error) {
      console.error('Failed to initialize AI:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeAI();
    setRefreshing(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      let response: EnhancedAIResponse;
      
      switch (currentMode) {
        case 'chat':
          response = await aiService.chatWithAI(userMessage);
          break;
        case 'code':
          if (!codeInput.trim()) {
            Alert.alert('Error', 'Please enter code to analyze');
            setIsLoading(false);
            return;
          }
          response = await aiService.chatWithAI(`Analyze this ${selectedLanguage} code: ${codeInput}\n\nUser question: ${userMessage}`);
          break;
        case 'learning':
          response = await aiService.chatWithAI(`Learning assistance: ${userMessage}`);
          break;
        case 'problems':
          response = await aiService.chatWithAI(`Problem-solving assistance: ${userMessage}`);
          break;
        default:
          response = await aiService.chatWithAI(userMessage);
      }

      setMessages(prev => [...prev, response]);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeCode = async () => {
    if (!codeInput.trim()) {
      Alert.alert('Error', 'Please enter code to analyze');
      return;
    }

    setIsLoading(true);
    try {
      const analysis = await aiService.analyzeCode(codeInput, selectedLanguage);
      setCodeAnalysis(analysis);
      setShowCodeAnalysis(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to analyze code');
    } finally {
      setIsLoading(false);
    }
  };

  const generateLearningPath = async () => {
    setIsLoading(true);
    try {
      const userProfile = {
        currentSkills: ['python', 'javascript'],
        desiredSkills: ['machine learning', 'web development'],
        skillLevel: 'intermediate',
        learningStyle: 'visual',
        interests: ['AI', 'data science'],
        timeAvailable: 10,
        goals: ['career advancement', 'skill improvement'],
      };

      const path = await aiService.generateLearningPath(userProfile);
      setLearningPath(path);
      setShowLearningPath(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate learning path');
    } finally {
      setIsLoading(false);
    }
  };

  const getProblemRecommendations = async () => {
    setIsLoading(true);
    try {
      const userProfile = {
        solvedProblems: ['hello-world', 'sum-of-two-numbers'],
        skillLevel: 'intermediate',
        interests: ['algorithms', 'data structures'],
        weaknesses: ['dynamic programming', 'graph algorithms'],
        learningGoals: ['improve problem-solving', 'prepare for interviews'],
        recentActivity: [],
      };

      const recommendations = await aiService.getProblemRecommendations(userProfile);
      setProblemRecommendations(recommendations);
      setShowProblemRecs(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get problem recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const switchProvider = async (providerName: string) => {
    try {
      await aiService.switchProvider(providerName);
      setSelectedProvider(providerName);
      const provider = providers.find(p => p.name === providerName);
      setModels(provider?.models || []);
      setShowProviderModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to switch provider');
    }
  };

  const switchModel = async (modelName: string) => {
    try {
      await aiService.switchModel(modelName);
      setSelectedModel(modelName);
      setShowModelModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to switch model');
    }
  };

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

  const MessageBubble = ({ message, isUser }: { message: EnhancedAIResponse; isUser: boolean }) => (
    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
      <ResponsiveText variant="md" style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
        {message.content}
      </ResponsiveText>
      <View style={styles.messageMeta}>
        <ResponsiveText variant="xs" style={styles.messageModel}>
          {message.model}
        </ResponsiveText>
        <ResponsiveText variant="xs" style={styles.messageTokens}>
          {message.tokens.total} tokens
        </ResponsiveText>
        <ResponsiveText variant="xs" style={styles.messageTime}>
          {new Date(message.metadata.timestamp).toLocaleTimeString()}
        </ResponsiveText>
      </View>
    </View>
  );

  const CodeAnalysisModal = () => (
    <Modal
      visible={showCodeAnalysis}
      animationType="slide"
      presentationStyle={isTablet ? 'pageSheet' : 'fullScreen'}
      onRequestClose={() => setShowCodeAnalysis(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCodeAnalysis(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Code Analysis
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>
        
        {codeAnalysis && (
          <ScrollView style={styles.modalContent}>
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Overall Score: {codeAnalysis.summary.overallScore}/100
              </ResponsiveText>
              <ResponsiveText variant="md">
                Complexity: {codeAnalysis.summary.complexity}
              </ResponsiveText>
              <ResponsiveText variant="md">
                Readability: {codeAnalysis.summary.readability}/100
              </ResponsiveText>
              <ResponsiveText variant="md">
                Maintainability: {codeAnalysis.summary.maintainability}/100
              </ResponsiveText>
            </Card>

            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Issues Found
              </ResponsiveText>
              {codeAnalysis.issues.slice(0, 5).map((issue, index) => (
                <View key={index} style={styles.issueItem}>
                  <ResponsiveText variant="md" style={styles.issueMessage}>
                    {issue.message}
                  </ResponsiveText>
                  <ResponsiveText variant="sm" style={styles.issueDetails}>
                    Line {issue.line} - {issue.severity}
                  </ResponsiveText>
                </View>
              ))}
            </Card>

            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Suggestions
              </ResponsiveText>
              {codeAnalysis.suggestions.slice(0, 3).map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <ResponsiveText variant="md" style={styles.suggestionText}>
                    {suggestion.description}
                  </ResponsiveText>
                  <ResponsiveText variant="sm" style={styles.suggestionImpact}>
                    Impact: {suggestion.impact}
                  </ResponsiveText>
                </View>
              ))}
            </Card>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const LearningPathModal = () => (
    <Modal
      visible={showLearningPath}
      animationType="slide"
      presentationStyle={isTablet ? 'pageSheet' : 'fullScreen'}
      onRequestClose={() => setShowLearningPath(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowLearningPath(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Learning Path
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>
        
        {learningPath && (
          <ScrollView style={styles.modalContent}>
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                {learningPath.title}
              </ResponsiveText>
              <ResponsiveText variant="md">
                {learningPath.description}
              </ResponsiveText>
              <ResponsiveText variant="md">
                Difficulty: {learningPath.difficulty}
              </ResponsiveText>
              <ResponsiveText variant="md">
                Duration: {learningPath.estimatedDuration.average} hours
              </ResponsiveText>
            </Card>

            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Modules
              </ResponsiveText>
              {learningPath.modules.slice(0, 5).map((module, index) => (
                <View key={index} style={styles.moduleItem}>
                  <ResponsiveText variant="md" style={styles.moduleTitle}>
                    {module.title}
                  </ResponsiveText>
                  <ResponsiveText variant="sm" style={styles.moduleDescription}>
                    {module.description}
                  </ResponsiveText>
                  <ResponsiveText variant="sm" style={styles.moduleDuration}>
                    Duration: {module.duration} minutes
                  </ResponsiveText>
                </View>
              ))}
            </Card>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const ProblemRecommendationsModal = () => (
    <Modal
      visible={showProblemRecs}
      animationType="slide"
      presentationStyle={isTablet ? 'pageSheet' : 'fullScreen'}
      onRequestClose={() => setShowProblemRecs(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowProblemRecs(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Problem Recommendations
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          {problemRecommendations.slice(0, 5).map((problem, index) => (
            <Card key={index} shadow padding={spacing.md} margin={spacing.sm}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                {problem.title}
              </ResponsiveText>
              <ResponsiveText variant="md">
                {problem.description}
              </ResponsiveText>
              <ResponsiveText variant="md">
                Difficulty: {problem.difficulty}
              </ResponsiveText>
              <ResponsiveText variant="md">
                Success Rate: {problem.successRate}%
              </ResponsiveText>
              <ResponsiveText variant="sm" style={styles.reasoningText}>
                Why recommended: {problem.reasoning.whyRecommended}
              </ResponsiveText>
            </Card>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <Container padding margin>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ResponsiveText variant="xxl" style={styles.title}>
            AI Mentor
          </ResponsiveText>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.providerButton}
              onPress={() => setShowProviderModal(true)}
            >
              <ResponsiveIcon name="hardware-chip" size="md" />
              <ResponsiveText variant="sm">
                {selectedProvider}
              </ResponsiveText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.providerButton}
              onPress={() => setShowModelModal(true)}
            >
              <ResponsiveIcon name="brain" size="md" />
              <ResponsiveText variant="sm">
                {selectedModel}
              </ResponsiveText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          {[
            { key: 'chat', icon: 'chatbubble-outline', label: 'Chat' },
            { key: 'code', icon: 'code-outline', label: 'Code' },
            { key: 'learning', icon: 'school-outline', label: 'Learning' },
            { key: 'problems', icon: 'extension-puzzle-outline', label: 'Problems' },
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
            icon="analytics-outline"
            title="Analyze Code"
            description="Get AI-powered code analysis and suggestions"
            onPress={analyzeCode}
            color="#4CAF50"
          />
          <QuickActionCard
            icon="map-outline"
            title="Generate Learning Path"
            description="Create personalized learning path based on your goals"
            onPress={generateLearningPath}
            color="#FF9800"
          />
          <QuickActionCard
            icon="extension-puzzle-outline"
            title="Problem Recommendations"
            description="Get personalized problem recommendations"
            onPress={getProblemRecommendations}
            color="#9C27B0"
          />
        </View>

        {/* Code Input for Code Mode */}
        {currentMode === 'code' && (
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <ResponsiveText variant="md" style={styles.sectionTitle}>
              Code to Analyze
            </ResponsiveText>
            <TextInput
              style={[styles.codeInput, { fontSize: 14 }]}
              value={codeInput}
              onChangeText={setCodeInput}
              placeholder="Enter your code here..."
              multiline
              textAlignVertical="top"
            />
            <View style={styles.codeActions}>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setShowModelModal(true)}
              >
                <ResponsiveText variant="sm">
                  {selectedLanguage}
                </ResponsiveText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={analyzeCode}
                disabled={isLoading}
              >
                <ResponsiveIcon name="analytics-outline" size="md" color="#fff" />
                <ResponsiveText variant="sm" style={styles.analyzeButtonText}>
                  Analyze
                </ResponsiveText>
              </TouchableOpacity>
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
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} isUser={false} />
          ))}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              currentMode === 'chat'
                ? 'Ask me anything about Python...'
                : currentMode === 'code'
                ? 'Ask about your code...'
                : currentMode === 'learning'
                ? 'Ask for learning guidance...'
                : 'Ask for problem-solving help...'
            }
            multiline
            maxLength={1000}
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
        <CodeAnalysisModal />
        <LearningPathModal />
        <ProblemRecommendationsModal />

        {/* Provider Selection Modal */}
        <Modal
          visible={showProviderModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowProviderModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowProviderModal(false)}>
                <ResponsiveIcon name="close" size="lg" />
              </TouchableOpacity>
              <ResponsiveText variant="lg" style={styles.modalTitle}>
                Select AI Provider
              </ResponsiveText>
              <View style={styles.modalSpacer} />
            </View>
            <ScrollView style={styles.modalContent}>
              {providers.map((provider) => (
                <TouchableOpacity
                  key={provider.name}
                  style={[
                    styles.providerItem,
                    selectedProvider === provider.name && styles.providerItemActive,
                  ]}
                  onPress={() => switchProvider(provider.name)}
                >
                  <ResponsiveText variant="md">{provider.displayName}</ResponsiveText>
                  <ResponsiveText variant="sm">{provider.name}</ResponsiveText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Model Selection Modal */}
        <Modal
          visible={showModelModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowModelModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModelModal(false)}>
                <ResponsiveIcon name="close" size="lg" />
              </TouchableOpacity>
              <ResponsiveText variant="lg" style={styles.modalTitle}>
                Select AI Model
              </ResponsiveText>
              <View style={styles.modalSpacer} />
            </View>
            <ScrollView style={styles.modalContent}>
              {models.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.providerItem,
                    selectedModel === model.id && styles.providerItemActive,
                  ]}
                  onPress={() => switchModel(model.id)}
                >
                  <ResponsiveText variant="md">{model.displayName}</ResponsiveText>
                  <ResponsiveText variant="sm">{model.quality} • {model.speed}</ResponsiveText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>

      {/* Modals */}
      <CodeAnalysisModal />
      <LearningPathModal />
      <ProblemRecommendationsModal />
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
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5,
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
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
  codeInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    minHeight: 100,
    marginBottom: 10,
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageButton: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: '500',
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
  aiBubble: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  messageText: {
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#333',
  },
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  messageModel: {
    color: '#666',
    fontStyle: 'italic',
  },
  messageTokens: {
    color: '#666',
    fontStyle: 'italic',
  },
  messageTime: {
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
  providerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  providerItemActive: {
    backgroundColor: '#f0f8ff',
  },
  issueItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
  },
  issueMessage: {
    fontWeight: '500',
    marginBottom: 2,
  },
  issueDetails: {
    color: '#666',
  },
  suggestionItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0fff4',
    borderRadius: 8,
  },
  suggestionText: {
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionImpact: {
    color: '#666',
  },
  moduleItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  moduleTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  moduleDescription: {
    color: '#666',
    marginBottom: 5,
  },
  moduleDuration: {
    color: '#666',
  },
  reasoningText: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export default AdvancedAIMentorScreen;

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
import EnhancedAIService from '../services/enhancedAIService';

const { width, height } = Dimensions.get('window');

const CodeExplanationAIScreen: React.FC = () => {
  const [codeInput, setCodeInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [explanation, setExplanation] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExplanation, setSelectedExplanation] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentExplanationLevel, setCurrentExplanationLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [explanationSettings, setExplanationSettings] = useState({
    includeLineNumbers: true,
    includeComplexity: true,
    includeOptimizations: true,
    includeBestPractices: true,
    includeSecurity: true,
  });
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const aiService = EnhancedAIService.getInstance();
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  const languages = [
    { id: 'python', name: 'Python', icon: 'logo-python' },
    { id: 'javascript', name: 'JavaScript', icon: 'logo-javascript' },
    { id: 'java', name: 'Java', icon: 'logo-java' },
    { id: 'cpp', name: 'C++', icon: 'code-slash' },
    { id: 'csharp', name: 'C#', icon: 'logo-windows' },
    { id: 'typescript', name: 'TypeScript', icon: 'logo-typescript' },
    { id: 'ruby', name: 'Ruby', icon: 'logo-ruby' },
    { id: 'go', name: 'Go', icon: 'logo-go' },
    { id: 'rust', name: 'Rust', icon: 'logo-rust' },
    { id: 'swift', name: 'Swift', icon: 'logo-apple' },
  ];

  const explanationLevels = [
    { id: 'beginner', name: 'Beginner', description: 'Simple explanations for beginners' },
    { id: 'intermediate', name: 'Intermediate', description: 'Detailed explanations with concepts' },
    { id: 'advanced', name: 'Advanced', description: 'Expert-level analysis and insights' },
  ];

  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  const loadAnalysisHistory = async () => {
    try {
      // In a real app, load from storage
      const mockHistory = [
        {
          id: '1',
          code: 'def hello_world():\n    print("Hello, World!")',
          language: 'python',
          explanation: 'This is a simple function that prints "Hello, World!"',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          summary: {
            overallScore: 95,
            complexity: 'simple',
            readability: 100,
          },
        },
        {
          id: '2',
          code: 'function factorial(n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}',
          language: 'javascript',
          explanation: 'This is a recursive function to calculate factorial',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          summary: {
            overallScore: 85,
            complexity: 'moderate',
            readability: 90,
          },
        },
      ];
      setAnalysisHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  };

  const analyzeCode = async () => {
    if (!codeInput.trim()) {
      Alert.alert('Error', 'Please enter some code to analyze');
      return;
    }

    setIsAnalyzing(true);
    
    // Animate analysis start
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.7, duration: 200 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200 }),
    ]).start();

    try {
      const analysis = await aiService.analyzeCode(codeInput, selectedLanguage, {
        analysisType: 'comprehensive',
      });

      // Enhance explanation with additional details
      const enhancedExplanation = {
        ...analysis,
        code: codeInput,
        language: selectedLanguage,
        explanationLevel: currentExplanationLevel,
        timestamp: new Date().toISOString(),
        settings: explanationSettings,
        detailedExplanation: generateDetailedExplanation(analysis, codeInput, selectedLanguage),
        lineByLineExplanation: generateLineByLineExplanation(analysis, codeInput),
        visualRepresentation: generateVisualRepresentation(analysis, codeInput),
        practicalExamples: generatePracticalExamples(analysis, codeInput, selectedLanguage),
      };

      setExplanation(enhancedExplanation);
      
      // Add to history
      const newHistory = [
        {
          id: Date.now().toString(),
          code: codeInput,
          language: selectedLanguage,
          explanation: enhancedExplanation.summary?.overallScore ? 
            `Overall Score: ${enhancedExplanation.summary.overallScore}/100` : 
            'Code analyzed successfully',
          timestamp: new Date().toISOString(),
          summary: enhancedExplanation.summary,
        },
        ...analysisHistory.slice(0, 9), // Keep only last 10
      ];
      setAnalysisHistory(newHistory);

      // Auto-scroll to explanation
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error: any) {
      console.error('Code analysis failed:', error);
      Alert.alert('Error', error.message || 'Failed to analyze code');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateDetailedExplanation = (analysis: any, code: string, language: string) => {
    const level = currentExplanationLevel;
    
    if (level === 'beginner') {
      return {
        overview: `This ${language} code ${analysis.summary?.complexity === 'simple' ? 'is straightforward and easy to understand' : 'contains some interesting concepts'}. Let me break it down for you.`,
        purpose: 'The main purpose of this code is to accomplish a specific task efficiently.',
        keyConcepts: ['Variables', 'Functions', 'Control Flow'],
        nextSteps: 'Try running this code and see what happens! Then try modifying it to learn more.',
      };
    } else if (level === 'intermediate') {
      return {
        overview: `This ${language} code demonstrates ${analysis.summary?.complexity === 'simple' ? 'basic' : 'intermediate'} programming concepts with a focus on clarity and efficiency.`,
        purpose: 'The code implements a solution that balances readability with performance considerations.',
        keyConcepts: ['Data Types', 'Control Structures', 'Error Handling', 'Optimization'],
        nextSteps: 'Consider how this code could be optimized further or adapted for different use cases.',
      };
    } else {
      return {
        overview: `This ${language} code showcases ${analysis.summary?.complexity === 'simple' ? 'fundamental' : 'advanced'} programming patterns and best practices.`,
        purpose: 'The implementation demonstrates sophisticated approaches to problem-solving with attention to performance, maintainability, and scalability.',
        keyConcepts: ['Design Patterns', 'Algorithmic Complexity', 'Memory Management', 'Performance Optimization'],
        nextSteps: 'Analyze the time and space complexity, and consider alternative implementations for different scenarios.',
      };
    }
  };

  const generateLineByLineExplanation = (analysis: any, code: string) => {
    const lines = code.split('\n');
    return lines.map((line, index) => ({
      lineNumber: index + 1,
      code: line.trim(),
      explanation: getLineExplanation(line, index, analysis),
      complexity: getLineComplexity(line, index, analysis),
    }));
  };

  const getLineExplanation = (line: string, index: number, analysis: any) => {
    if (line.trim() === '') return 'Empty line for readability';
    
    // Simple explanation logic based on common patterns
    if (line.includes('def ') || line.includes('function ')) {
      return 'This line defines a function - a reusable block of code';
    } else if (line.includes('print(') || line.includes('console.log(')) {
      return 'This line outputs information to the console';
    } else if (line.includes('return ')) {
      return 'This line returns a value from the function';
    } else if (line.includes('if ')) {
      return 'This line starts a conditional statement';
    } else if (line.includes('for ') || line.includes('while ')) {
      return 'This line creates a loop for iteration';
    } else if (line.includes('import ')) {
      return 'This line imports external modules or libraries';
    } else {
      return 'This line performs an operation or assignment';
    }
  };

  const getLineComplexity = (line: string, index: number, analysis: any) => {
    if (line.trim() === '') return 'none';
    if (line.includes('def ') || line.includes('function ')) return 'medium';
    if (line.includes('for ') || line.includes('while ')) return 'medium';
    if (line.includes('if ') && line.includes('&&') || line.includes('||')) return 'high';
    return 'low';
  };

  const generateVisualRepresentation = (analysis: any, code: string) => {
    // Generate a simple flowchart or diagram representation
    const hasLoops = code.includes('for ') || code.includes('while ');
    const hasConditions = code.includes('if ');
    const hasFunctions = code.includes('def ') || code.includes('function ');
    
    return {
      type: hasLoops ? 'loop' : hasConditions ? 'conditional' : 'sequential',
      description: hasLoops ? 'This code contains iteration logic' : 
                     hasConditions ? 'This code contains conditional logic' : 
                     'This code executes sequentially',
      complexity: hasFunctions && hasLoops ? 'high' : hasFunctions || hasLoops ? 'medium' : 'low',
    };
  };

  const generatePracticalExamples = (analysis: any, code: string, language: string) => {
    const examples = [];
    
    if (language === 'python') {
      if (code.includes('def ')) {
        examples.push({
          title: 'Function Usage Example',
          code: '# Call the function with different arguments\nresult = function_name(arg1, arg2)\nprint(result)',
        });
      }
      if (code.includes('for ')) {
        examples.push({
          title: 'Loop Alternative',
          code: '# Alternative using list comprehension\nresult = [process(item) for item in items]',
        });
      }
    }
    
    return examples;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalysisHistory();
    setRefreshing(false);
  };

  const clearCode = () => {
    setCodeInput('');
    setExplanation(null);
  };

  const loadFromHistory = (item: any) => {
    setCodeInput(item.code);
    setSelectedLanguage(item.language);
    // Optionally auto-analyze
    setTimeout(() => analyzeCode(), 500);
  };

  const showExplanationDetails = (exp: any) => {
    setSelectedExplanation(exp);
    setShowDetailModal(true);
  };

  const CodeExplanationCard = ({ explanation }: { explanation: any }) => (
    <Card shadow padding={spacing.md} margin={spacing.sm}>
      <View style={styles.explanationHeader}>
        <ResponsiveText variant="lg" style={styles.explanationTitle}>
          Code Analysis Results
        </ResponsiveText>
        <View style={styles.explanationMeta}>
          <ResponsiveText variant="sm" style={styles.explanationScore}>
            Score: {explanation.summary?.overallScore || 0}/100
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.explanationComplexity}>
            Complexity: {explanation.summary?.complexity || 'unknown'}
          </ResponsiveText>
        </View>
      </View>

      {explanation.summary && (
        <View style={styles.summarySection}>
          <ResponsiveText variant="md" style={styles.sectionTitle}>
            Summary
          </ResponsiveText>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <ResponsiveIcon name="checkmark-circle-outline" size="md" color="#4CAF50" />
              <ResponsiveText variant="sm">
                Readability: {explanation.summary.readability || 0}%
              </ResponsiveText>
            </View>
            <View style={styles.summaryItem}>
              <ResponsiveIcon name="build-outline" size="md" color="#FF9800" />
              <ResponsiveText variant="sm">
                Maintainability: {explanation.summary.maintainabilityIndex || 0}%
              </ResponsiveText>
            </View>
            <View style={styles.summaryItem}>
              <ResponsiveIcon name="speedometer-outline" size="md" color="#007AFF" />
              <ResponsiveText variant="sm">
                Cyclomatic Complexity: {explanation.summary.cyclomaticComplexity || 0}
              </ResponsiveText>
            </View>
          </View>
        </View>
      )}

      {explanation.detailedExplanation && (
        <View style={styles.detailedSection}>
          <ResponsiveText variant="md" style={styles.sectionTitle}>
            Detailed Explanation ({currentExplanationLevel})
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.explanationText}>
            {explanation.detailedExplanation.overview}
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.explanationText}>
            {explanation.detailedExplanation.purpose}
          </ResponsiveText>
        </View>
      )}

      {explanation.issues && explanation.issues.length > 0 && (
        <View style={styles.issuesSection}>
          <ResponsiveText variant="md" style={styles.sectionTitle}>
            Issues & Suggestions
          </ResponsiveText>
          {explanation.issues.slice(0, 3).map((issue: any, index: number) => (
            <View key={index} style={styles.issueItem}>
              <View style={styles.issueHeader}>
                <ResponsiveIcon 
                  name={issue.severity === 'high' ? 'warning' : issue.severity === 'medium' ? 'alert' : 'information-circle-outline'} 
                  size="sm" 
                  color={issue.severity === 'high' ? '#F44336' : issue.severity === 'medium' ? '#FF9800' : '#4CAF50'} 
                />
                <ResponsiveText variant="sm" style={styles.issueTitle}>
                  {issue.message}
                </ResponsiveText>
              </View>
              <ResponsiveText variant="xs" style={styles.issueDetails}>
                Line {issue.line} • {issue.type}
              </ResponsiveText>
              {issue.suggestion && (
                <ResponsiveText variant="xs" style={styles.issueSuggestion}>
                  Suggestion: {issue.suggestion}
                </ResponsiveText>
              )}
            </View>
          ))}
        </View>
      )}

      {explanation.suggestions && explanation.suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <ResponsiveText variant="md" style={styles.sectionTitle}>
            Optimization Suggestions
          </ResponsiveText>
          {explanation.suggestions.slice(0, 2).map((suggestion: any, index: number) => (
            <View key={index} style={styles.suggestionItem}>
              <ResponsiveIcon name="bulb-outline" size="sm" color="#9C27B0" />
              <ResponsiveText variant="sm" style={styles.suggestionText}>
                {suggestion.description}
              </ResponsiveText>
              <ResponsiveText variant="xs" style={styles.suggestionImpact}>
                Impact: {suggestion.impact} • Effort: {suggestion.effort}
              </ResponsiveText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.explanationActions}>
        <ResponsiveButton variant="outline" style={styles.explanationButton} onPress={() => showExplanationDetails(explanation)}>
          <ResponsiveIcon name="expand-outline" size="md" />
          <ResponsiveText variant="sm">View Details</ResponsiveText>
        </ResponsiveButton>
        <ResponsiveButton variant="primary" style={styles.explanationButton}>
          <ResponsiveIcon name="share-outline" size="md" />
          <ResponsiveText variant="sm">Share</ResponsiveText>
        </ResponsiveButton>
      </View>
    </Card>
  );

  const HistoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.historyItem} onPress={() => loadFromHistory(item)}>
      <View style={styles.historyIcon}>
        <ResponsiveIcon name="code-outline" size="md" color="#007AFF" />
      </View>
      <View style={styles.historyContent}>
        <ResponsiveText variant="sm" style={styles.historyTitle}>
          {item.language.charAt(0).toUpperCase() + item.language.slice(1)} Code
        </ResponsiveText>
        <ResponsiveText variant="xs" style={styles.historyDescription}>
          {item.explanation}
        </ResponsiveText>
        <ResponsiveText variant="xs" style={styles.historyTime}>
          {new Date(item.timestamp).toLocaleDateString()}
        </ResponsiveText>
      </View>
      <View style={styles.historyMeta}>
        <ResponsiveText variant="sm" style={styles.historyScore}>
          {item.summary?.overallScore || 0}
        </ResponsiveText>
        <ResponsiveIcon name="chevron-forward" size="md" color="#666" />
      </View>
    </TouchableOpacity>
  );

  const LanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Select Language
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>
        <ScrollView style={styles.modalContent}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.languageItem,
                selectedLanguage === lang.id && styles.languageItemSelected,
              ]}
              onPress={() => {
                setSelectedLanguage(lang.id);
                setShowLanguageModal(false);
              }}
            >
              <ResponsiveIcon name={lang.icon as any} size="lg" />
              <ResponsiveText variant="md">{lang.name}</ResponsiveText>
              {selectedLanguage === lang.id && (
                <ResponsiveIcon name="checkmark-circle" size="md" color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const DetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      presentationStyle={isTablet ? 'pageSheet' : 'fullScreen'}
      onRequestClose={() => setShowDetailModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowDetailModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Detailed Analysis
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>
        
        {selectedExplanation && (
          <ScrollView style={styles.modalContent}>
            {selectedExplanation.lineByLineExplanation && (
              <Card shadow padding={spacing.md} margin={spacing.sm}>
                <ResponsiveText variant="lg" style={styles.sectionTitle}>
                  Line-by-Line Explanation
                </ResponsiveText>
                {selectedExplanation.lineByLineExplanation.map((line: any, index: number) => (
                  <View key={index} style={styles.lineExplanationItem}>
                    <View style={styles.lineHeader}>
                      <ResponsiveText variant="sm" style={styles.lineNumber}>
                        Line {line.lineNumber}
                      </ResponsiveText>
                      <ResponsiveText variant="xs" style={styles.lineComplexity}>
                        {line.complexity}
                      </ResponsiveText>
                    </View>
                    <ResponsiveText variant="xs" style={styles.lineCode}>
                      {line.code}
                    </ResponsiveText>
                    <ResponsiveText variant="sm" style={styles.lineExplanation}>
                      {line.explanation}
                    </ResponsiveText>
                  </View>
                ))}
              </Card>
            )}

            {selectedExplanation.practicalExamples && selectedExplanation.practicalExamples.length > 0 && (
              <Card shadow padding={spacing.md} margin={spacing.sm}>
                <ResponsiveText variant="lg" style={styles.sectionTitle}>
                  Practical Examples
                </ResponsiveText>
                {selectedExplanation.practicalExamples.map((example: any, index: number) => (
                  <View key={index} style={styles.exampleItem}>
                    <ResponsiveText variant="md" style={styles.exampleTitle}>
                      {example.title}
                    </ResponsiveText>
                    <ResponsiveText variant="sm" style={styles.exampleCode}>
                      {example.code}
                    </ResponsiveText>
                  </View>
                ))}
              </Card>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <Container padding margin>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ResponsiveText variant="xxxl" style={styles.title}>
            Code Explanation AI
          </ResponsiveText>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettingsModal(true)}>
              <ResponsiveIcon name="settings-outline" size="md" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.historyButton} onPress={() => {}}>
              <ResponsiveIcon name="time-outline" size="md" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Language and Level Selector */}
        <View style={styles.selectorRow}>
          <TouchableOpacity style={styles.languageSelector} onPress={() => setShowLanguageModal(true)}>
            <ResponsiveIcon name="code-outline" size="md" />
            <ResponsiveText variant="sm">
              {languages.find(l => l.id === selectedLanguage)?.name || 'Python'}
            </ResponsiveText>
            <ResponsiveIcon name="chevron-down" size="sm" />
          </TouchableOpacity>
          
          <View style={styles.levelSelector}>
            {explanationLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelButton,
                  currentExplanationLevel === level.id && styles.levelButtonActive,
                ]}
                onPress={() => setCurrentExplanationLevel(level.id as any)}
              >
                <ResponsiveText
                  variant="xs"
                  style={[
                    styles.levelButtonText,
                    currentExplanationLevel === level.id && styles.levelButtonTextActive,
                  ]}
                >
                  {level.name}
                </ResponsiveText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Code Input */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <View style={styles.codeInputHeader}>
            <ResponsiveText variant="md" style={styles.sectionTitle}>
              Enter Code to Analyze
            </ResponsiveText>
            <TouchableOpacity style={styles.clearButton} onPress={clearCode}>
              <ResponsiveIcon name="close-circle-outline" size="md" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.codeInput}
            value={codeInput}
            onChangeText={setCodeInput}
            placeholder="Paste your code here..."
            multiline
            textAlignVertical="top"
            fontSize={14}
          />
          <View style={styles.codeInputActions}>
            <ResponsiveButton variant="outline" style={styles.codeButton}>
              <ResponsiveIcon name="document-outline" size="md" />
              <ResponsiveText variant="sm">Load Example</ResponsiveText>
            </ResponsiveButton>
            <ResponsiveButton 
              variant="primary" 
              style={styles.codeButton}
              onPress={analyzeCode}
              disabled={isAnalyzing || !codeInput.trim()}
            >
              <ResponsiveIcon name={isAnalyzing ? 'hourglass' : 'analytics-outline'} size="md" />
              <ResponsiveText variant="sm">
                {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
              </ResponsiveText>
            </ResponsiveButton>
          </View>
        </Card>

        {/* Explanation Results */}
        {explanation && <CodeExplanationCard explanation={explanation} />}

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.historyHeader}>
              <ResponsiveText variant="md" style={styles.sectionTitle}>
                Recent Analysis
              </ResponsiveText>
              <TouchableOpacity onPress={onRefresh}>
                <ResponsiveIcon name="refresh-outline" size="md" />
              </TouchableOpacity>
            </View>
            {analysisHistory.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </Card>
        )}

        {/* Modals */}
        <LanguageModal />
        <DetailModal />
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
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  historyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  levelSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 2,
  },
  levelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  levelButtonActive: {
    backgroundColor: '#007AFF',
  },
  levelButtonText: {
    color: '#666',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  codeInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    padding: 5,
  },
  codeInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    minHeight: 120,
    marginBottom: 10,
  },
  codeInputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeButton: {
    flex: 1,
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  explanationTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  explanationMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  explanationScore: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  explanationComplexity: {
    color: '#FF9800',
    fontWeight: '600',
  },
  summarySection: {
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    gap: 5,
  },
  detailedSection: {
    marginBottom: 15,
  },
  explanationText: {
    color: '#666',
    marginBottom: 5,
    lineHeight: 18,
  },
  issuesSection: {
    marginBottom: 15,
  },
  issueItem: {
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  issueTitle: {
    fontWeight: '600',
    color: '#333',
  },
  issueDetails: {
    color: '#666',
    fontStyle: 'italic',
  },
  issueSuggestion: {
    color: '#666',
    marginTop: 5,
  },
  suggestionsSection: {
    marginBottom: 15,
  },
  suggestionItem: {
    backgroundColor: '#f0fff4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  suggestionText: {
    flex: 1,
    color: '#333',
  },
  suggestionImpact: {
    color: '#666',
    fontStyle: 'italic',
  },
  explanationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  explanationButton: {
    flex: 1,
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  historyDescription: {
    color: '#666',
    marginBottom: 2,
  },
  historyTime: {
    color: '#999',
  },
  historyMeta: {
    alignItems: 'center',
    gap: 10,
  },
  historyScore: {
    color: '#4CAF50',
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
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  languageItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  lineExplanationItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  lineNumber: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  lineComplexity: {
    color: '#666',
    fontStyle: 'italic',
  },
  lineCode: {
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 4,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  lineExplanation: {
    color: '#333',
  },
  exampleItem: {
    marginBottom: 15,
  },
  exampleTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  exampleCode: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
});

export default CodeExplanationAIScreen;

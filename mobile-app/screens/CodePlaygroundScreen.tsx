import React, { useState, useEffect } from 'react';
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
import AdvancedCodeExecutionService from '../services/advancedCodeExecutionService';

const { width, height } = Dimensions.get('window');

const CodePlaygroundScreen: React.FC = () => {
  const [playgrounds, setPlaygrounds] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedPlayground, setSelectedPlayground] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [stdin, setStdin] = useState('');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [newPlayground, setNewPlayground] = useState({
    title: '',
    description: '',
    code: '',
    language: 'python',
    template_id: '',
    is_public: false,
    tags: [],
  });
  
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  
  const codeExecutionService = AdvancedCodeExecutionService.getInstance();
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    loadPlaygrounds();
    loadTemplates();
  }, []);

  const loadPlaygrounds = async () => {
    try {
      // Mock data for demo
      const mockPlaygrounds = [
        {
          id: 'playground_1',
          title: 'Hello World',
          description: 'Basic hello world program',
          code: 'print("Hello, World!")',
          language: 'python',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: true,
          tags: ['basic', 'beginner'],
          difficulty: 'beginner',
          runs: 15,
          forks: 3,
        },
        {
          id: 'playground_2',
          title: 'Calculator',
          description: 'Simple calculator program',
          code: 'def add(a, b):\n    return a + b\n\ndef subtract(a, b):\n    return a - b\n\nprint(add(5, 3))\nprint(subtract(10, 4))',
          language: 'python',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: true,
          tags: ['math', 'functions'],
          difficulty: 'intermediate',
          runs: 8,
          forks: 2,
        },
      ];
      
      setPlaygrounds(mockPlaygrounds);
    } catch (error: any) {
      console.error('Failed to load playgrounds:', error);
      Alert.alert('Error', 'Failed to load playgrounds');
    }
  };

  const loadTemplates = async () => {
    try {
      // Mock data for demo
      const mockTemplates = [
        {
          id: 'template_1',
          name: 'Hello World',
          description: 'Basic hello world template',
          language: 'python',
          code: 'print("Hello, World!")',
          difficulty: 'beginner',
          tags: ['basic', 'beginner'],
        },
        {
          id: 'template_2',
          name: 'For Loop',
          description: 'For loop example',
          language: 'python',
          code: 'for i in range(5):\n    print(f"Iteration {i}")',
          difficulty: 'beginner',
          tags: ['loops', 'control-flow'],
        },
        {
          id: 'template_3',
          name: 'Function Definition',
          description: 'Function definition example',
          language: 'python',
          code: 'def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))',
          difficulty: 'intermediate',
          tags: ['functions', 'beginner'],
        },
        {
          id: 'template_4',
          name: 'Array Operations',
          description: 'Array manipulation example',
          language: 'javascript',
          code: 'const numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);\nconsole.log(doubled);',
          difficulty: 'intermediate',
          tags: ['arrays', 'javascript'],
        },
      ];
      
      setTemplates(mockTemplates);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      Alert.alert('Error', 'Failed to load templates');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPlaygrounds(), loadTemplates()]);
    setRefreshing(false);
  };

  const createPlayground = async () => {
    if (!newPlayground.title.trim() || !newPlayground.code.trim()) {
      Alert.alert('Error', 'Please enter a title and code');
      return;
    }

    try {
      const playground = await codeExecutionService.createPlayground(newPlayground);
      setPlaygrounds(prev => [playground, ...prev]);
      setShowCreateModal(false);
      setNewPlayground({
        title: '',
        description: '',
        code: '',
        language: 'python',
        template_id: '',
        is_public: false,
        tags: [],
      });
      
      Alert.alert('Success', 'Playground created successfully!');
    } catch (error: any) {
      console.error('Failed to create playground:', error);
      Alert.alert('Error', error.message || 'Failed to create playground');
    }
  };

  const executeCode = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    setShowResultModal(true);

    try {
      const result = await codeExecutionService.executeCode({
        code,
        language,
        stdin,
      });
      
      setExecutionResult(result);
    } catch (error: any) {
      console.error('Code execution failed:', error);
      setExecutionResult({
        status: 'error',
        error: error.message,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const loadTemplate = (template: any) => {
    setCode(template.code);
    setLanguage(template.language);
    setSelectedTemplate(template);
    setShowTemplateModal(false);
  };

  const savePlayground = async () => {
    if (!selectedPlayground) return;

    try {
      const updatedPlayground = await codeExecutionService.updatePlayground(
        selectedPlayground.id,
        {
          code,
          language,
        }
      );
      
      setPlaygrounds(prev => 
        prev.map(p => p.id === updatedPlayground.id ? updatedPlayground : p)
      );
      
      Alert.alert('Success', 'Playground saved successfully!');
    } catch (error: any) {
      console.error('Failed to save playground:', error);
      Alert.alert('Error', error.message || 'Failed to save playground');
    }
  };

  const getFilteredPlaygrounds = () => {
    let filtered = playgrounds;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(pg => 
        pg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pg.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pg.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by language
    if (filterLanguage !== 'all') {
      filtered = filtered.filter(pg => pg.language === filterLanguage);
    }

    // Filter by difficulty
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(pg => pg.difficulty === filterDifficulty);
    }

    return filtered;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'error': return '#F44336';
      case 'timeout': return '#FF9800';
      case 'memory_exceeded': return '#9C27B0';
      default: return '#666';
    }
  };

  const PlaygroundCard = ({ playground }: { playground: any }) => (
    <TouchableOpacity
      style={styles.playgroundCard}
      onPress={() => {
        setSelectedPlayground(playground);
        setCode(playground.code);
        setLanguage(playground.language);
      }}
    >
      <View style={styles.playgroundHeader}>
        <ResponsiveText variant="lg" style={styles.playgroundTitle}>
          {playground.title}
        </ResponsiveText>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(playground.difficulty) }]}>
          <ResponsiveText variant="xs" style={styles.difficultyText}>
            {playground.difficulty}
          </ResponsiveText>
        </View>
      </View>

      {playground.description && (
        <ResponsiveText variant="sm" style={styles.playgroundDescription}>
          {playground.description}
        </ResponsiveText>
      )}

      <View style={styles.playgroundMeta}>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="code-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {playground.language}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="play-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {playground.runs} runs
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="git-branch-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {playground.forks} forks
          </ResponsiveText>
        </View>
      </View>

      {playground.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {playground.tags.slice(0, 3).map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <ResponsiveText variant="xs" style={styles.tagText}>
                #{tag}
              </ResponsiveText>
            </View>
          ))}
          {playground.tags.length > 3 && (
            <View style={styles.tag}>
              <ResponsiveText variant="xs" style={styles.tagText}>
                +{playground.tags.length - 3}
              </ResponsiveText>
            </View>
          )}
        </View>
      )}

      <ResponsiveText variant="xs" style={styles.playgroundTime}>
        Updated: {new Date(playground.updated_at).toLocaleDateString()}
      </ResponsiveText>
    </TouchableOpacity>
  );

  const TemplateCard = ({ template }: { template: any }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => loadTemplate(template)}
    >
      <View style={styles.templateHeader}>
        <ResponsiveText variant="md" style={styles.templateName}>
          {template.name}
        </ResponsiveText>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(template.difficulty) }]}>
          <ResponsiveText variant="xs" style={styles.difficultyText}>
            {template.difficulty}
          </ResponsiveText>
        </View>
      </View>

      <ResponsiveText variant="sm" style={styles.templateDescription}>
        {template.description}
      </ResponsiveText>

      <View style={styles.templateMeta}>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="code-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {template.language}
          </ResponsiveText>
        </View>
        {template.tags.length > 0 && (
          <View style={styles.templateTags}>
            {template.tags.slice(0, 2).map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <ResponsiveText variant="xs" style={styles.tagText}>
                  #{tag}
                </ResponsiveText>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const CreatePlaygroundModal = () => (
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
            Create Playground
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Title
              </ResponsiveText>
              <TextInput
                style={styles.textInput}
                placeholder="Enter playground title"
                value={newPlayground.title}
                onChangeText={(text) => setNewPlayground(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Description
              </ResponsiveText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter description (optional)"
                value={newPlayground.description}
                onChangeText={(text) => setNewPlayground(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Code
              </ResponsiveText>
              <TextInput
                style={[styles.textInput, styles.codeInput]}
                placeholder="Enter your code"
                value={newPlayground.code}
                onChangeText={(text) => setNewPlayground(prev => ({ ...prev, code: text }))}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                fontFamily="monospace"
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
                      newPlayground.language === lang && styles.languageOptionSelected,
                    ]}
                    onPress={() => setNewPlayground(prev => ({ ...prev, language: lang }))}
                  >
                    <ResponsiveText
                      variant="sm"
                      style={[
                        styles.languageOptionText,
                        newPlayground.language === lang && styles.languageOptionTextSelected,
                      ]}
                    >
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </ResponsiveText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <ResponsiveButton
              variant="primary"
              style={styles.createButton}
              onPress={createPlayground}
            >
              <ResponsiveIcon name="add-outline" size="md" />
              <ResponsiveText variant="sm">Create Playground</ResponsiveText>
            </ResponsiveButton>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const TemplateModal = () => (
    <Modal
      visible={showTemplateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowTemplateModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Code Templates
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.templatesSection}>
            <ResponsiveText variant="lg" style={styles.sectionTitle}>
              Available Templates
            </ResponsiveText>
            
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const ExecutionResultModal = () => (
    <Modal
      visible={showResultModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowResultModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowResultModal(false)}>
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
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(executionResult.status) }]}>
                    <ResponsiveText variant="xs" style={styles.statusText}>
                      {executionResult.status}
                    </ResponsiveText>
                  </View>
                </View>

                {executionResult.stdout && (
                  <View style={styles.resultSection}>
                    <ResponsiveText variant="sm" style={styles.resultLabel}>
                      Output:
                    </ResponsiveText>
                    <Text style={styles.resultText}>{executionResult.stdout}</Text>
                  </View>
                )}

                {executionResult.stderr && (
                  <View style={styles.resultSection}>
                    <ResponsiveText variant="sm" style={styles.resultLabel}>
                      Error:
                    </ResponsiveText>
                    <Text style={styles.errorText}>{executionResult.stderr}</Text>
                  </View>
                )}

                {executionResult.error && (
                  <View style={styles.resultSection}>
                    <ResponsiveText variant="sm" style={styles.resultLabel}>
                      System Error:
                    </ResponsiveText>
                    <Text style={styles.errorText}>{executionResult.error}</Text>
                  </View>
                )}

                {executionResult.time && (
                  <View style={styles.resultSection}>
                    <ResponsiveText variant="sm" style={styles.resultLabel}>
                      Execution Time: {executionResult.time}s
                    </ResponsiveText>
                    {executionResult.memory && (
                      <ResponsiveText variant="sm" style={styles.resultLabel}>
                        Memory Usage: {(executionResult.memory / 1024 / 1024).toFixed(2)}MB
                      </ResponsiveText>
                    )}
                  </View>
                )}
              </View>
            ) : null}
          </Card>
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
            Code Playground
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Interactive coding environment with templates
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
            <ResponsiveText variant="sm">Create</ResponsiveText>
          </ResponsiveButton>
          <ResponsiveButton
            variant="outline"
            style={styles.actionButton}
            onPress={() => setShowTemplateModal(true)}
          >
            <ResponsiveIcon name="document-outline" size="md" />
            <ResponsiveText variant="sm">Templates</ResponsiveText>
          </ResponsiveButton>
        </View>

        {/* Search and Filters */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search playgrounds..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton}>
              <ResponsiveIcon name="search" size="md" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <ResponsiveText variant="sm" style={styles.filterLabel}>
                Language:
              </ResponsiveText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterButtons}>
                  {['all', 'python', 'javascript', 'java', 'cpp', 'c'].map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.filterButton,
                        filterLanguage === lang && styles.filterButtonActive,
                      ]}
                      onPress={() => setFilterLanguage(lang)}
                    >
                      <ResponsiveText
                        variant="xs"
                        style={[
                          styles.filterButtonText,
                          filterLanguage === lang && styles.filterButtonTextActive,
                        ]}
                      >
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </ResponsiveText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <ResponsiveText variant="sm" style={styles.filterLabel}>
                Difficulty:
              </ResponsiveText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterButtons}>
                  {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.filterButton,
                        filterDifficulty === level && styles.filterButtonActive,
                      ]}
                      onPress={() => setFilterDifficulty(level as any)}
                    >
                      <ResponsiveText
                        variant="xs"
                        style={[
                          styles.filterButtonText,
                          filterDifficulty === level && styles.filterButtonTextActive,
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </ResponsiveText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Card>

        {/* Code Editor */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <View style={styles.codeEditorHeader}>
            <ResponsiveText variant="md" style={styles.sectionTitle}>
              Code Editor
            </ResponsiveText>
            <View style={styles.codeEditorActions}>
              <TouchableOpacity style={styles.codeActionButton} onPress={() => setShowTemplateModal(true)}>
                <ResponsiveIcon name="document-outline" size="sm" />
              </TouchableOpacity>
              {selectedPlayground && (
                <TouchableOpacity style={styles.codeActionButton} onPress={savePlayground}>
                  <ResponsiveIcon name="save-outline" size="sm" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.codeActionButton} onPress={executeCode}>
                <ResponsiveIcon name="play-outline" size="sm" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.languageSelector}>
            {['python', 'javascript', 'java', 'cpp', 'c'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  language === lang && styles.languageOptionSelected,
                ]}
                onPress={() => setLanguage(lang)}
              >
                <ResponsiveText
                  variant="sm"
                  style={[
                    styles.languageOptionText,
                    language === lang && styles.languageOptionTextSelected,
                  ]}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </ResponsiveText>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.codeEditor}
            placeholder="Write your code here..."
            value={code}
            onChangeText={setCode}
            multiline
            textAlignVertical="top"
            numberOfLines={12}
            fontFamily="monospace"
          />

          <View style={styles.inputSection}>
            <ResponsiveText variant="sm" style={styles.inputLabel}>
              Input (stdin):
            </ResponsiveText>
            <TextInput
              style={styles.stdinInput}
              placeholder="Enter input for your program..."
              value={stdin}
              onChangeText={setStdin}
              multiline
              numberOfLines={3}
            />
          </View>
        </Card>

        {/* Playgrounds */}
        <View style={styles.playgroundsSection}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Playgrounds ({getFilteredPlaygrounds().length})
          </ResponsiveText>
          
          {getFilteredPlaygrounds().map((playground) => (
            <PlaygroundCard key={playground.id} playground={playground} />
          ))}
        </View>

        {/* Modals */}
        <CreatePlaygroundModal />
        <TemplateModal />
        <ExecutionResultModal />
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterLabel: {
    fontWeight: '600',
    color: '#333',
    minWidth: 80,
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
  codeEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  languageSelector: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 10,
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
  codeEditor: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 200,
  },
  inputSection: {
    marginTop: 10,
  },
  inputLabel: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  stdinInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  playgroundsSection: {
    marginBottom: 20,
  },
  playgroundCard: {
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
  playgroundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playgroundTitle: {
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  playgroundDescription: {
    color: '#666',
    marginBottom: 10,
  },
  playgroundMeta: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#007AFF',
    fontSize: 12,
  },
  playgroundTime: {
    color: '#999',
    fontSize: 12,
  },
  templatesSection: {
    marginBottom: 20,
  },
  templateCard: {
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
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  templateName: {
    fontWeight: 'bold',
    color: '#333',
  },
  templateDescription: {
    color: '#666',
    marginBottom: 10,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateTags: {
    flexDirection: 'row',
    gap: 5,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  executionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    color: '#007AFF',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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

export default CodePlaygroundScreen;

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
import AdvancedCodeExecutionService, { LanguageInfo, ExecutionRequest } from '../services/advancedCodeExecutionService';

const { width, height } = Dimensions.get('window');

const AdvancedLanguageSupportScreen: React.FC = () => {
  const [supportedLanguages, setSupportedLanguages] = useState<LanguageInfo[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageInfo | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [stdinInput, setStdinInput] = useState('');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executionOptions, setExecutionOptions] = useState({
    timeout: 5,
    memory_limit: 128,
    cpu_time_limit: 5,
    compile_only: false,
    optimize: false,
    debug_mode: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [filterFeature, setFilterFeature] = useState<string>('all');
  
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  
  const codeExecutionService = AdvancedCodeExecutionService.getInstance();
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    loadSupportedLanguages();
  }, []);

  const loadSupportedLanguages = async () => {
    try {
      const languages = await codeExecutionService.getSupportedLanguages();
      setSupportedLanguages(languages);
    } catch (error) {
      console.error('Failed to load supported languages:', error);
      Alert.alert('Error', 'Failed to load supported languages');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSupportedLanguages();
    setRefreshing(false);
  };

  const executeCode = async () => {
    if (!selectedLanguage || !codeInput.trim()) {
      Alert.alert('Error', 'Please select a language and enter code');
      return;
    }

    setIsExecuting(true);
    setShowExecutionModal(true);

    try {
      const request: ExecutionRequest = {
        code: codeInput,
        language: selectedLanguage.id,
        stdin: stdinInput,
        options: executionOptions,
      };

      const result = await codeExecutionService.executeCode(request);
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

  const getFilteredLanguages = () => {
    let filtered = supportedLanguages;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(lang => 
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by difficulty
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(lang => lang.difficulty === filterDifficulty);
    }

    // Filter by feature
    if (filterFeature !== 'all') {
      filtered = filtered.filter(lang => lang.features.includes(filterFeature));
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

  const LanguageCard = ({ language }: { language: LanguageInfo }) => (
    <TouchableOpacity
      style={[
        styles.languageCard,
        selectedLanguage?.id === language.id && styles.languageCardSelected,
      ]}
      onPress={() => setSelectedLanguage(language)}
    >
      <View style={styles.languageHeader}>
        <ResponsiveText variant="lg" style={styles.languageName}>
          {language.name}
        </ResponsiveText>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(language.difficulty) }]}>
          <ResponsiveText variant="xs" style={styles.difficultyText}>
            {language.difficulty}
          </ResponsiveText>
        </View>
      </View>

      <ResponsiveText variant="sm" style={styles.languageVersion}>
        Version: {language.version}
      </ResponsiveText>

      <View style={styles.languageFeatures}>
        {language.features.slice(0, 3).map((feature, index) => (
          <View key={index} style={styles.featureTag}>
            <ResponsiveText variant="xs" style={styles.featureText}>
              {feature}
            </ResponsiveText>
          </View>
        ))}
        {language.features.length > 3 && (
          <View style={styles.featureTag}>
            <ResponsiveText variant="xs" style={styles.featureText}>
              +{language.features.length - 3}
            </ResponsiveText>
          </View>
        )}
      </View>

      <View style={styles.languageMeta}>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="time-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {language.default_timeout}s
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="hardware-chip-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {language.default_memory_limit}MB
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="bug-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {language.supports_debugging ? 'Debug' : 'No Debug'}
          </ResponsiveText>
        </View>
      </View>

      <View style={styles.languageActions}>
        <ResponsiveButton variant="outline" style={styles.languageButton}>
          <ResponsiveIcon name="information-circle-outline" size="sm" />
          <ResponsiveText variant="xs">Details</ResponsiveText>
        </ResponsiveButton>
        <ResponsiveButton variant="primary" style={styles.languageButton}>
          <ResponsiveIcon name="code-outline" size="sm" />
          <ResponsiveText variant="xs">Use</ResponsiveText>
        </ResponsiveButton>
      </View>
    </TouchableOpacity>
  );

  const ExecutionModal = () => (
    <Modal
      visible={showExecutionModal}
      animationType="slide"
      presentationStyle={isTablet ? 'pageSheet' : 'fullScreen'}
      onRequestClose={() => setShowExecutionModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowExecutionModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Code Execution
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <ResponsiveText variant="md" style={styles.sectionTitle}>
              Execution Details
            </ResponsiveText>
            
            {selectedLanguage && (
              <View style={styles.executionInfo}>
                <ResponsiveText variant="sm">
                  Language: {selectedLanguage.name}
                </ResponsiveText>
                <ResponsiveText variant="sm">
                  Timeout: {executionOptions.timeout}s
                </ResponsiveText>
                <ResponsiveText variant="sm">
                  Memory Limit: {executionOptions.memory_limit}MB
                </ResponsiveText>
              </View>
            )}

            <View style={styles.codePreview}>
              <ResponsiveText variant="sm" style={styles.codeLabel}>
                Code Preview:
              </ResponsiveText>
              <Text style={styles.codeText}>
                {codeInput.substring(0, 200)}
                {codeInput.length > 200 && '...'}
              </Text>
            </View>
          </Card>

          {isExecuting && (
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <View style={styles.executionStatus}>
                <ResponsiveIcon name="hourglass" size="lg" color="#007AFF" />
                <ResponsiveText variant="md" style={styles.statusText}>
                  Executing code...
                </ResponsiveText>
              </View>
            </Card>
          )}

          {executionResult && !isExecuting && (
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <View style={styles.resultHeader}>
                <ResponsiveText variant="md" style={styles.sectionTitle}>
                  Execution Result
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
            Advanced Language Support
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Enhanced code execution with multi-language support
          </ResponsiveText>
        </View>

        {/* Search and Filters */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search languages..."
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

            <View style={styles.filterRow}>
              <ResponsiveText variant="sm" style={styles.filterLabel}>
                Features:
              </ResponsiveText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterButtons}>
                  {['all', 'debugging', 'compilation', 'optimization', 'async'].map((feature) => (
                    <TouchableOpacity
                      key={feature}
                      style={[
                        styles.filterButton,
                        filterFeature === feature && styles.filterButtonActive,
                      ]}
                      onPress={() => setFilterFeature(feature)}
                    >
                      <ResponsiveText
                        variant="xs"
                        style={[
                          styles.filterButtonText,
                          filterFeature === feature && styles.filterButtonTextActive,
                        ]}
                      >
                        {feature.charAt(0).toUpperCase() + feature.slice(1)}
                      </ResponsiveText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Card>

        {/* Selected Language Info */}
        {selectedLanguage && (
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.selectedLanguageHeader}>
              <ResponsiveText variant="lg" style={styles.selectedLanguageTitle}>
                Selected: {selectedLanguage.name}
              </ResponsiveText>
              <TouchableOpacity onPress={() => setShowLanguageModal(true)}>
                <ResponsiveIcon name="code-outline" size="md" />
              </TouchableOpacity>
            </View>

            <View style={styles.codeInputSection}>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter your code here..."
                value={codeInput}
                onChangeText={setCodeInput}
                multiline
                textAlignVertical="top"
                numberOfLines={8}
              />
              
              <View style={styles.inputSection}>
                <ResponsiveText variant="sm" style={styles.inputLabel}>
                  Input (stdin):
                </ResponsiveText>
                <TextInput
                  style={styles.stdinInput}
                  placeholder="Enter input for your program..."
                  value={stdinInput}
                  onChangeText={setStdinInput}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <ResponsiveButton
                variant="primary"
                style={styles.executeButton}
                onPress={executeCode}
                disabled={!codeInput.trim() || isExecuting}
              >
                <ResponsiveIcon name="play-outline" size="md" />
                <ResponsiveText variant="sm">
                  {isExecuting ? 'Executing...' : 'Execute Code'}
                </ResponsiveText>
              </ResponsiveButton>
            </View>
          </Card>
        )}

        {/* Languages Grid */}
        <View style={styles.languagesSection}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Supported Languages ({getFilteredLanguages().length})
          </ResponsiveText>
          
          {getFilteredLanguages().map((language) => (
            <LanguageCard key={language.id} language={language} />
          ))}
        </View>

        {/* Execution Modal */}
        <ExecutionModal />
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
  languagesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  languageCard: {
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
  languageCardSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  languageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  languageName: {
    fontWeight: 'bold',
    color: '#333',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  languageVersion: {
    color: '#666',
    marginBottom: 10,
  },
  languageFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  featureTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  featureText: {
    color: '#007AFF',
    fontSize: 12,
  },
  languageMeta: {
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
  languageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageButton: {
    flex: 1,
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  selectedLanguageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedLanguageTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  codeInputSection: {
    gap: 15,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 200,
  },
  inputSection: {
    gap: 5,
  },
  inputLabel: {
    fontWeight: '600',
    color: '#333',
  },
  stdinInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  executionInfo: {
    gap: 5,
    marginBottom: 15,
  },
  codePreview: {
    marginBottom: 15,
  },
  codeLabel: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  codeText: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 12,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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

export default AdvancedLanguageSupportScreen;

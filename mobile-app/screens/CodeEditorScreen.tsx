import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CodeExecutionService, { ExecutionResult, LanguageInfo } from '../services/codeExecutionService';

const { width, height } = Dimensions.get('window');

const CodeEditorScreen: React.FC = () => {
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('python');
  const [isExecuting, setIsExecuting] = useState(false);
  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageInfo | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [showOutput, setShowOutput] = useState(true);
  
  const codeExecutionService = CodeExecutionService.getInstance();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadLanguages();
    loadDefaultCode();
  }, []);

  const loadLanguages = async () => {
    try {
      const supportedLanguages = await codeExecutionService.getSupportedLanguages();
      setLanguages(supportedLanguages);
      
      const pythonLang = supportedLanguages.find(lang => lang.id === 'python');
      if (pythonLang) {
        setCurrentLanguage(pythonLang);
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  const loadDefaultCode = async () => {
    try {
      const langInfo = await codeExecutionService.getLanguageInfo('python');
      if (langInfo) {
        setCode(langInfo.default_code);
      }
    } catch (error) {
      console.error('Failed to load default code:', error);
    }
  };

  const executeCode = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    setOutput('Executing...');

    try {
      const result = await codeExecutionService.executeCode({
        source_code: code,
        language: language,
        stdin: input,
      });

      setExecutionResult(result);
      
      // Format output
      let formattedOutput = '';
      if (result.stdout) {
        formattedOutput += result.stdout;
      }
      if (result.stderr) {
        formattedOutput += result.stderr;
      }
      
      if (result.status === 'success') {
        setOutput(formattedOutput || 'Code executed successfully (no output)');
      } else {
        setOutput(`Error: ${formattedOutput || 'Unknown error'}`);
      }
    } catch (error: any) {
      setOutput(`Execution failed: ${error}`);
      Alert.alert('Execution Failed', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearCode = () => {
    setCode(currentLanguage?.default_code || '');
    setOutput('');
    setExecutionResult(null);
  };

  const clearOutput = () => {
    setOutput('');
    setExecutionResult(null);
  };

  const insertText = (text: string) => {
    setCode(prev => prev + text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'timeout':
        return '#FF9800';
      case 'memory_exceeded':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const CodeTemplate = ({ template }: { template: string }) => (
    <TouchableOpacity
      style={styles.templateButton}
      onPress={() => insertText(template)}
    >
      <Text style={styles.templateText}>{template}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Code Editor</Text>
        <View style={styles.languageSelector}>
          <Text style={styles.languageText}>{currentLanguage?.name || 'Python'}</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Code Templates */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesContainer}>
          <CodeTemplate template="for i in range(10):\n    print(i)" />
          <CodeTemplate template="def hello():\n    return 'Hello'" />
          <CodeTemplate template="if __name__ == '__main__':\n    pass" />
          <CodeTemplate template="try:\n    pass\nexcept:\n    pass" />
        </ScrollView>

        {/* Code Editor */}
        <View style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorTitle}>Code</Text>
            <View style={styles.editorActions}>
              <TouchableOpacity style={styles.actionButton} onPress={clearCode}>
                <Ionicons name="trash-outline" size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="copy-outline" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
          
          <TextInput
            style={styles.codeEditor}
            value={code}
            onChangeText={setCode}
            placeholder="Write your code here..."
            multiline
            textAlignVertical="top"
            fontSize={14}
          />
        </View>

        {/* Input Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowInput(!showInput)}
          >
            <Text style={styles.sectionTitle}>Input</Text>
            <Ionicons
              name={showInput ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#666"
            />
          </TouchableOpacity>
          
          {showInput && (
            <TextInput
              style={styles.inputEditor}
              value={input}
              onChangeText={setInput}
              placeholder="Enter input for your program..."
              multiline
              textAlignVertical="top"
            />
          )}
        </View>

        {/* Output Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Output</Text>
            <View style={styles.outputActions}>
              {output && (
                <TouchableOpacity style={styles.actionButton} onPress={clearOutput}>
                  <Ionicons name="trash-outline" size={16} color="#666" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowOutput(!showOutput)}
              >
                <Ionicons
                  name={showOutput ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {showOutput && (
            <View style={styles.outputContainer}>
              {executionResult && (
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(executionResult.status) }]}>
                  <Text style={styles.statusText}>
                    {executionResult.status.toUpperCase()}
                  </Text>
                </View>
              )}
              
              <ScrollView
                ref={scrollViewRef}
                style={styles.outputEditor}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              >
                <Text style={styles.outputText}>{output}</Text>
              </ScrollView>
              
              {executionResult && (
                <View style={styles.executionStats}>
                  <Text style={styles.statText}>
                    Time: {executionResult.execution_time}s
                  </Text>
                  <Text style={styles.statText}>
                    Memory: {executionResult.memory_usage}KB
                  </Text>
                  <Text style={styles.statText}>
                    Exit: {executionResult.exit_code}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Execute Button */}
        <View style={styles.executeContainer}>
          <TouchableOpacity
            style={[styles.executeButton, isExecuting && styles.executeButtonDisabled]}
            onPress={executeCode}
            disabled={isExecuting}
          >
            <Ionicons
              name={isExecuting ? 'hourglass' : 'play'}
              size={20}
              color="white"
            />
            <Text style={styles.executeButtonText}>
              {isExecuting ? 'Executing...' : 'Run Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languageText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
  templatesContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  templateButton: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
  },
  templateText: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  editorContainer: {
    flex: 2,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  editorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  editorActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginLeft: 8,
  },
  codeEditor: {
    flex: 1,
    padding: 15,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  sectionContainer: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  outputActions: {
    flexDirection: 'row',
  },
  inputEditor: {
    padding: 15,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
    minHeight: 60,
  },
  outputContainer: {
    padding: 15,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  outputEditor: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 15,
    minHeight: 100,
    maxHeight: 200,
  },
  outputText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#00ff00',
  },
  executionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  executeContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
  },
  executeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  executeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CodeEditorScreen;

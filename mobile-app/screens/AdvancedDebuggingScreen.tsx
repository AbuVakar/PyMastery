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
import AdvancedCodeExecutionService, { DebugSession, Breakpoint, Variable, CallStackFrame } from '../services/advancedCodeExecutionService';

const { width, height } = Dimensions.get('window');

const AdvancedDebuggingScreen: React.FC = () => {
  const [debugSessions, setDebugSessions] = useState<DebugSession[]>([]);
  const [currentDebugSession, setCurrentDebugSession] = useState<DebugSession | null>(null);
  const [executionId, setExecutionId] = useState('');
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [callStack, setCallStack] = useState<CallStackFrame[]>([]);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [debugCode, setDebugCode] = useState('');
  const [debugLanguage, setDebugLanguage] = useState('python');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBreakpointModal, setShowBreakpointModal] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [showCallStackModal, setShowCallStackModal] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newBreakpoint, setNewBreakpoint] = useState({
    line: 0,
    condition: '',
    enabled: true,
    log_message: '',
  });
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set());
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  
  const debuggingService = AdvancedCodeExecutionService.getInstance();
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    loadDebugSessions();
  }, []);

  const loadDebugSessions = async () => {
    try {
      // Mock data for demo
      const mockSessions: DebugSession[] = [
        {
          debug_id: 'debug_1',
          execution_id: 'exec_1',
          code: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))',
          language: 'python',
          breakpoints: [
            { line: 2, enabled: true, hit_count: 0 },
            { line: 4, enabled: true, hit_count: 3 },
          ],
          variables: [
            { name: 'n', type: 'int', value: 10, scope: 'local' },
            { name: 'fibonacci', type: 'function', value: '<function>', scope: 'global' },
          ],
          call_stack: [
            { function_name: 'fibonacci', file_name: 'debug.py', line_number: 2 },
            { function_name: '<module>', file_name: 'debug.py', line_number: 6 },
          ],
          status: 'paused',
          current_line: 2,
          step_mode: 'step_over',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      setDebugSessions(mockSessions);
    } catch (error: any) {
      console.error('Failed to load debug sessions:', error);
      Alert.alert('Error', 'Failed to load debug sessions');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDebugSessions();
    setRefreshing(false);
  };

  const startDebugSession = async () => {
    if (!debugCode.trim() || !executionId.trim()) {
      Alert.alert('Error', 'Please enter code and execution ID');
      return;
    }

    setIsDebugging(true);
    
    try {
      // First execute the code
      const executionResult = await debuggingService.executeCode({
        code: debugCode,
        language: debugLanguage,
        stdin: '',
        options: { debug_mode: true },
      });

      if (executionResult.execution_id) {
        // Then start debug session
        const debugSession = await debuggingService.startDebugSession(executionResult.execution_id);
        setCurrentDebugSession(debugSession);
        setDebugSessions(prev => [debugSession, ...prev]);
        setExecutionId(executionResult.execution_id);
        setShowCreateModal(false);
        
        Alert.alert('Success', 'Debug session started successfully!');
      }
    } catch (error: any) {
      console.error('Failed to start debug session:', error);
      Alert.alert('Error', error.message || 'Failed to start debug session');
    } finally {
      setIsDebugging(false);
    }
  };

  const setBreakpoint = async () => {
    if (!currentDebugSession || newBreakpoint.line <= 0) {
      Alert.alert('Error', 'Please enter a valid line number');
      return;
    }

    try {
      const success = await debuggingService.setBreakpoint(
        currentDebugSession.debug_id,
        newBreakpoint.line,
        newBreakpoint.condition || undefined
      );
      
      if (success) {
        const breakpoint: Breakpoint = {
          line: newBreakpoint.line,
          condition: newBreakpoint.condition,
          enabled: newBreakpoint.enabled,
          hit_count: 0,
          log_message: newBreakpoint.log_message,
        };
        
        setBreakpoints(prev => [...prev, breakpoint]);
        setShowBreakpointModal(false);
        setNewBreakpoint({
          line: 0,
          condition: '',
          enabled: true,
          log_message: '',
        });
        
        Alert.alert('Success', 'Breakpoint set successfully!');
      }
    } catch (error: any) {
      console.error('Failed to set breakpoint:', error);
      Alert.alert('Error', error.message || 'Failed to set breakpoint');
    }
  };

  const removeBreakpoint = async (line: number) => {
    if (!currentDebugSession) return;

    try {
      const success = await debuggingService.removeBreakpoint(currentDebugSession.debug_id, line);
      
      if (success) {
        setBreakpoints(prev => prev.filter(bp => bp.line !== line));
        Alert.alert('Success', 'Breakpoint removed successfully!');
      }
    } catch (error: any) {
      console.error('Failed to remove breakpoint:', error);
      Alert.alert('Error', error.message || 'Failed to remove breakpoint');
    }
  };

  const stepOver = async () => {
    if (!currentDebugSession) return;

    try {
      const updatedSession = await debuggingService.stepOver(currentDebugSession.debug_id);
      setCurrentDebugSession(updatedSession);
      setCurrentLine(updatedSession.current_line);
      // Update variables and call stack would happen here
    } catch (error: any) {
      console.error('Failed to step over:', error);
      Alert.alert('Error', error.message || 'Failed to step over');
    }
  };

  const stepInto = async () => {
    if (!currentDebugSession) return;

    try {
      const updatedSession = await debuggingService.stepInto(currentDebugSession.debug_id);
      setCurrentDebugSession(updatedSession);
      setCurrentLine(updatedSession.current_line);
    } catch (error: any) {
      console.error('Failed to step into:', error);
      Alert.alert('Error', error.message || 'Failed to step into');
    }
  };

  const stepOut = async () => {
    if (!currentDebugSession) return;

    try {
      const updatedSession = await debuggingService.stepOut(currentDebugSession.debug_id);
      setCurrentDebugSession(updatedSession);
      setCurrentLine(updatedSession.current_line);
    } catch (error: any) {
      console.error('Failed to step out:', error);
      Alert.alert('Error', error.message || 'Failed to step out');
    }
  };

  const continueExecution = async () => {
    if (!currentDebugSession) return;

    try {
      const updatedSession = await debuggingService.continueExecution(currentDebugSession.debug_id);
      setCurrentDebugSession(updatedSession);
      setCurrentLine(updatedSession.current_line);
    } catch (error: any) {
      console.error('Failed to continue execution:', error);
      Alert.alert('Error', error.message || 'Failed to continue execution');
    }
  };

  const stopDebugSession = async () => {
    if (!currentDebugSession) return;

    try {
      const success = await debuggingService.stopDebugSession(currentDebugSession.debug_id);
      
      if (success) {
        setCurrentDebugSession(null);
        setBreakpoints([]);
        setVariables([]);
        setCallStack([]);
        setCurrentLine(null);
        
        Alert.alert('Success', 'Debug session stopped successfully!');
      }
    } catch (error: any) {
      console.error('Failed to stop debug session:', error);
      Alert.alert('Error', error.message || 'Failed to stop debug session');
    }
  };

  const toggleVariableExpansion = (variableName: string) => {
    const newExpanded = new Set(expandedVariables);
    if (newExpanded.has(variableName)) {
      newExpanded.delete(variableName);
    } else {
      newExpanded.add(variableName);
    }
    setExpandedVariables(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#4CAF50';
      case 'paused': return '#FF9800';
      case 'finished': return '#2196F3';
      case 'error': return '#F44336';
      default: return '#666';
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'local': return '#4CAF50';
      case 'global': return '#2196F3';
      case 'parameter': return '#FF9800';
      default: return '#666';
    }
  };

  const DebugSessionCard = ({ session }: { session: DebugSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => setCurrentDebugSession(session)}
    >
      <View style={styles.sessionHeader}>
        <ResponsiveText variant="lg" style={styles.sessionTitle}>
          Debug Session {session.debug_id}
        </ResponsiveText>
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
          <ResponsiveIcon name="flag-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {session.breakpoints.length} breakpoints
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="layers-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {session.call_stack.length} frames
          </ResponsiveText>
        </View>
      </View>

      {session.current_line && (
        <View style={styles.currentLine}>
          <ResponsiveIcon name="radio-outline" size="sm" color="#FF9800" />
          <ResponsiveText variant="xs" style={styles.currentLineText}>
            Line {session.current_line}
          </ResponsiveText>
        </View>
      )}

      <ResponsiveText variant="xs" style={styles.sessionTime}>
        Created: {new Date(session.created_at).toLocaleString()}
      </ResponsiveText>
    </TouchableOpacity>
  );

  const BreakpointItem = ({ breakpoint, index }: { breakpoint: Breakpoint; index: number }) => (
    <View style={styles.breakpointItem}>
      <View style={styles.breakpointHeader}>
        <View style={styles.breakpointLine}>
          <ResponsiveIcon name="flag-outline" size="md" color="#F44336" />
          <ResponsiveText variant="md" style={styles.breakpointLineText}>
            Line {breakpoint.line}
          </ResponsiveText>
        </View>
        <TouchableOpacity
          style={[styles.breakpointToggle, breakpoint.enabled ? styles.breakpointEnabled : styles.breakpointDisabled]}
          onPress={() => {
            const updatedBreakpoints = [...breakpoints];
            updatedBreakpoints[index].enabled = !updatedBreakpoints[index].enabled;
            setBreakpoints(updatedBreakpoints);
          }}
        >
          <ResponsiveIcon name={breakpoint.enabled ? 'toggle' : 'toggle-outline'} size="sm" color="#fff" />
        </TouchableOpacity>
      </View>

      {breakpoint.condition && (
        <ResponsiveText variant="xs" style={styles.breakpointCondition}>
          Condition: {breakpoint.condition}
        </ResponsiveText>
      )}

      {breakpoint.log_message && (
        <ResponsiveText variant="xs" style={styles.breakpointLog}>
          Log: {breakpoint.log_message}
        </ResponsiveText>
      )}

      <View style={styles.breakpointFooter}>
        <ResponsiveText variant="xs" style={styles.breakpointHits}>
          Hit count: {breakpoint.hit_count}
        </ResponsiveText>
        <TouchableOpacity onPress={() => removeBreakpoint(breakpoint.line)}>
          <ResponsiveIcon name="trash-outline" size="sm" color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const VariableItem = ({ variable, level = 0 }: { variable: Variable; level?: number }) => (
    <View style={[styles.variableItem, { marginLeft: level * 20 }]}>
      <TouchableOpacity
        style={styles.variableHeader}
        onPress={() => toggleVariableExpansion(variable.name)}
      >
        <ResponsiveIcon
          name={expandedVariables.has(variable.name) ? 'chevron-down' : 'chevron-forward'}
          size="sm"
          color="#666"
        />
        <ResponsiveText variant="sm" style={styles.variableName}>
          {variable.name}
        </ResponsiveText>
        <View style={[styles.scopeBadge, { backgroundColor: getScopeColor(variable.scope) }]}>
          <ResponsiveText variant="xs" style={styles.scopeText}>
            {variable.scope}
          </ResponsiveText>
        </View>
      </TouchableOpacity>

      <View style={styles.variableDetails}>
        <ResponsiveText variant="xs" style={styles.variableType}>
          {variable.type}
        </ResponsiveText>
        <ResponsiveText variant="xs" style={styles.variableValue}>
          {typeof variable.value === 'object' ? JSON.stringify(variable.value) : String(variable.value)}
        </ResponsiveText>
      </View>

      {variable.children && expandedVariables.has(variable.name) && (
        <View style={styles.variableChildren}>
          {variable.children.map((child, index) => (
            <VariableItem key={index} variable={child} level={level + 1} />
          ))}
        </View>
      )}
    </View>
  );

  const CallStackItem = ({ frame, index }: { frame: CallStackFrame; index: number }) => (
    <View style={styles.callStackItem}>
      <View style={styles.callStackHeader}>
        <ResponsiveText variant="sm" style={styles.callStackFunction}>
          {frame.function_name}
        </ResponsiveText>
        <ResponsiveText variant="xs" style={styles.callStackLine}>
          Line {frame.line_number}
        </ResponsiveText>
      </View>
      <ResponsiveText variant="xs" style={styles.callStackFile}>
        {frame.file_name}
      </ResponsiveText>
      {frame.module_name && (
        <ResponsiveText variant="xs" style={styles.callStackModule}>
          Module: {frame.module_name}
        </ResponsiveText>
      )}
    </View>
  );

  const CreateDebugModal = () => (
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
            Start Debug Session
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Code to Debug
              </ResponsiveText>
              <TextInput
                style={[styles.textInput, styles.codeInput]}
                placeholder="Enter your code here..."
                value={debugCode}
                onChangeText={setDebugCode}
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
                      debugLanguage === lang && styles.languageOptionSelected,
                    ]}
                    onPress={() => setDebugLanguage(lang)}
                  >
                    <ResponsiveText
                      variant="sm"
                      style={[
                        styles.languageOptionText,
                        debugLanguage === lang && styles.languageOptionTextSelected,
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
                Execution ID (Optional)
              </ResponsiveText>
              <TextInput
                style={styles.textInput}
                placeholder="Will be generated automatically"
                value={executionId}
                onChangeText={setExecutionId}
              />
            </View>

            <ResponsiveButton
              variant="primary"
              style={styles.createButton}
              onPress={startDebugSession}
              disabled={!debugCode.trim() || isDebugging}
            >
              <ResponsiveIcon name="bug-outline" size="md" />
              <ResponsiveText variant="sm">
                {isDebugging ? 'Starting...' : 'Start Debug Session'}
              </ResponsiveText>
            </ResponsiveButton>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const BreakpointModal = () => (
    <Modal
      visible={showBreakpointModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowBreakpointModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowBreakpointModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Set Breakpoint
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Line Number
              </ResponsiveText>
              <TextInput
                style={styles.textInput}
                placeholder="Enter line number"
                value={newBreakpoint.line.toString()}
                onChangeText={(text) => setNewBreakpoint(prev => ({ ...prev, line: parseInt(text) || 0 }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Condition (Optional)
              </ResponsiveText>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., x > 10"
                value={newBreakpoint.condition}
                onChangeText={(text) => setNewBreakpoint(prev => ({ ...prev, condition: text }))}
              />
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Log Message (Optional)
              </ResponsiveText>
              <TextInput
                style={styles.textInput}
                placeholder="Message to log when breakpoint hits"
                value={newBreakpoint.log_message}
                onChangeText={(text) => setNewBreakpoint(prev => ({ ...prev, log_message: text }))}
              />
            </View>

            <View style={styles.formSection}>
              <View style={styles.switchRow}>
                <ResponsiveText variant="md" style={styles.switchLabel}>
                  Enabled
                </ResponsiveText>
                <TouchableOpacity
                  style={[styles.switch, newBreakpoint.enabled && styles.switchActive]}
                  onPress={() => setNewBreakpoint(prev => ({ ...prev, enabled: !prev.enabled }))}
                >
                  <View style={styles.switchThumb} />
                </TouchableOpacity>
              </View>
            </View>

            <ResponsiveButton
              variant="primary"
              style={styles.createButton}
              onPress={setBreakpoint}
            >
              <ResponsiveIcon name="flag-outline" size="md" />
              <ResponsiveText variant="sm">Set Breakpoint</ResponsiveText>
            </ResponsiveButton>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (currentDebugSession) {
    return (
      <Container padding margin>
        <ScrollView>
          {/* Debug Session Header */}
          <View style={styles.debugHeader}>
            <ResponsiveText variant="xxxl" style={styles.debugTitle}>
              Debug Session Active
            </ResponsiveText>
            <View style={styles.debugStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(currentDebugSession.status) }]} />
              <ResponsiveText variant="sm" style={styles.statusText}>
                {currentDebugSession.status}
              </ResponsiveText>
            </View>
          </View>

          {/* Debug Controls */}
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <ResponsiveText variant="md" style={styles.sectionTitle}>
              Debug Controls
            </ResponsiveText>
            <View style={styles.debugControls}>
              <ResponsiveButton variant="outline" style={styles.debugButton} onPress={stepOver}>
                <ResponsiveIcon name="skip-forward-outline" size="md" />
                <ResponsiveText variant="xs">Step Over</ResponsiveText>
              </ResponsiveButton>
              <ResponsiveButton variant="outline" style={styles.debugButton} onPress={stepInto}>
                <ResponsiveIcon name="arrow-down-outline" size="md" />
                <ResponsiveText variant="xs">Step Into</ResponsiveText>
              </ResponsiveButton>
              <ResponsiveButton variant="outline" style={styles.debugButton} onPress={stepOut}>
                <ResponsiveIcon name="arrow-up-outline" size="md" />
                <ResponsiveText variant="xs">Step Out</ResponsiveText>
              </ResponsiveButton>
              <ResponsiveButton variant="primary" style={styles.debugButton} onPress={continueExecution}>
                <ResponsiveIcon name="play-outline" size="md" />
                <ResponsiveText variant="xs">Continue</ResponsiveText>
              </ResponsiveButton>
              <ResponsiveButton variant="outline" style={[styles.debugButton, styles.stopButton]} onPress={stopDebugSession}>
                <ResponsiveIcon name="stop-outline" size="md" />
                <ResponsiveText variant="xs">Stop</ResponsiveText>
              </ResponsiveButton>
            </View>
          </Card>

          {/* Code Viewer */}
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.codeHeader}>
              <ResponsiveText variant="md" style={styles.sectionTitle}>
                Code
              </ResponsiveText>
              {currentLine && (
                <ResponsiveText variant="xs" style={styles.currentLineIndicator}>
                  Current: Line {currentLine}
                </ResponsiveText>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.codeContainer}>
                {currentDebugSession.code.split('\n').map((line, index) => (
                  <View key={index} style={[
                    styles.codeLine,
                    currentLine === index + 1 && styles.currentCodeLine
                  ]}>
                    <Text style={styles.lineNumber}>{index + 1}</Text>
                    <Text style={styles.codeLineText}>{line}</Text>
                    {breakpoints.some(bp => bp.line === index + 1) && (
                      <ResponsiveIcon name="flag-outline" size="sm" color="#F44336" />
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>

          {/* Breakpoints */}
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.sectionHeader}>
              <ResponsiveText variant="md" style={styles.sectionTitle}>
                Breakpoints ({breakpoints.length})
              </ResponsiveText>
              <TouchableOpacity onPress={() => setShowBreakpointModal(true)}>
                <ResponsiveIcon name="add-outline" size="md" />
              </TouchableOpacity>
            </View>
            
            {breakpoints.length > 0 ? (
              breakpoints.map((breakpoint, index) => (
                <BreakpointItem key={index} breakpoint={breakpoint} index={index} />
              ))
            ) : (
              <ResponsiveText variant="sm" style={styles.emptyText}>
                No breakpoints set
              </ResponsiveText>
            )}
          </Card>

          {/* Variables */}
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.sectionHeader}>
              <ResponsiveText variant="md" style={styles.sectionTitle}>
                Variables ({variables.length})
              </ResponsiveText>
              <TouchableOpacity onPress={() => setShowVariableModal(true)}>
                <ResponsiveIcon name="list-outline" size="md" />
              </TouchableOpacity>
            </View>
            
            {variables.length > 0 ? (
              variables.map((variable, index) => (
                <VariableItem key={index} variable={variable} />
              ))
            ) : (
              <ResponsiveText variant="sm" style={styles.emptyText}>
                No variables in current scope
              </ResponsiveText>
            )}
          </Card>

          {/* Call Stack */}
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.sectionHeader}>
              <ResponsiveText variant="md" style={styles.sectionTitle}>
                Call Stack ({callStack.length})
              </ResponsiveText>
              <TouchableOpacity onPress={() => setShowCallStackModal(true)}>
                <ResponsiveIcon name="layers-outline" size="md" />
              </TouchableOpacity>
            </View>
            
            {callStack.length > 0 ? (
              callStack.slice(0, 3).map((frame, index) => (
                <CallStackItem key={index} frame={frame} index={index} />
              ))
            ) : (
              <ResponsiveText variant="sm" style={styles.emptyText}>
                No call stack available
              </ResponsiveText>
            )}
          </Card>

          {/* Modals */}
          <BreakpointModal />
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
            Advanced Debugging
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Integrated debugging tools for code analysis
          </ResponsiveText>
        </View>

        {/* Action Button */}
        <ResponsiveButton
          variant="primary"
          style={styles.createSessionButton}
          onPress={() => setShowCreateModal(true)}
        >
          <ResponsiveIcon name="bug-outline" size="md" />
          <ResponsiveText variant="sm">Start Debug Session</ResponsiveText>
        </ResponsiveButton>

        {/* Debug Sessions */}
        <View style={styles.sessionsSection}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Debug Sessions ({debugSessions.length})
          </ResponsiveText>
          
          {debugSessions.map((session) => (
            <DebugSessionCard key={session.debug_id} session={session} />
          ))}
        </View>

        {/* Create Debug Modal */}
        <CreateDebugModal />
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
  createSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 20,
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
  currentLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  currentLineText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  sessionTime: {
    color: '#999',
    fontSize: 12,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  debugTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  debugStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  debugControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  debugButton: {
    flex: 1,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  stopButton: {
    borderColor: '#F44336',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  currentLineIndicator: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  codeContainer: {
    minWidth: '100%',
  },
  codeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    minWidth: '100%',
  },
  currentCodeLine: {
    backgroundColor: '#fff3cd',
  },
  lineNumber: {
    width: 30,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginRight: 10,
    fontFamily: 'monospace',
  },
  codeLineText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  breakpointItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  breakpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  breakpointLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  breakpointLineText: {
    fontWeight: 'bold',
    color: '#333',
  },
  breakpointToggle: {
    padding: 5,
    borderRadius: 12,
  },
  breakpointEnabled: {
    backgroundColor: '#4CAF50',
  },
  breakpointDisabled: {
    backgroundColor: '#ccc',
  },
  breakpointCondition: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  breakpointLog: {
    color: '#2196F3',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  breakpointFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakpointHits: {
    color: '#666',
    fontSize: 12,
  },
  variableItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  variableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  variableName: {
    fontWeight: 'bold',
    color: '#333',
  },
  scopeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scopeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  variableDetails: {
    marginLeft: 20,
    gap: 2,
  },
  variableType: {
    color: '#666',
    fontStyle: 'italic',
  },
  variableValue: {
    color: '#333',
    fontFamily: 'monospace',
  },
  variableChildren: {
    marginTop: 5,
  },
  callStackItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  callStackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  callStackFunction: {
    fontWeight: 'bold',
    color: '#333',
  },
  callStackLine: {
    color: '#666',
  },
  callStackFile: {
    color: '#2196F3',
    fontSize: 12,
  },
  callStackModule: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
});

export default AdvancedDebuggingScreen;

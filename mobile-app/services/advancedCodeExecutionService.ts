import axios from 'axios';

// Advanced Code Execution Service Configuration
const CODE_EXECUTION_URL = 'http://localhost:8000/api/v1/code';
const COLLABORATION_URL = 'http://localhost:8000/api/v1/collaboration';
const DEBUGGING_URL = 'http://localhost:8000/api/v1/debugging';

export interface ExecutionRequest {
  code: string;
  language: string;
  stdin?: string;
  expected_output?: string;
  test_cases?: TestCase[];
  options?: {
    timeout?: number;
    memory_limit?: number;
    cpu_time_limit?: number;
    compile_only?: boolean;
    optimize?: boolean;
    debug_mode?: boolean;
  };
}

export interface TestCase {
  input: string;
  expected_output: string;
  description?: string;
  points?: number;
  hidden?: boolean;
}

export interface ExecutionResult {
  execution_id: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'timeout' | 'memory_exceeded';
  language: string;
  code: string;
  stdin?: string;
  stdout?: string;
  stderr?: string;
  exit_code?: number;
  signal?: string;
  time?: number; // execution time in seconds
  memory?: number; // memory usage in bytes
  compile_time?: number; // compilation time in seconds
  compile_output?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
  test_results?: TestResult[];
  performance_metrics?: {
    cpu_usage: number;
    memory_peak: number;
    disk_usage: number;
    network_io: number;
  };
}

export interface TestResult {
  test_case_id: number;
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  execution_time: number;
  memory_usage: number;
  error?: string;
  points_earned?: number;
  points_total?: number;
}

export interface LanguageInfo {
  id: string;
  name: string;
  version: string;
  extensions: string[];
  compile_command?: string;
  run_command: string;
  default_timeout: number;
  default_memory_limit: number;
  supports_debugging: boolean;
  supports_compilation: boolean;
  features: string[];
  popularity: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface CollaborationSession {
  session_id: string;
  title: string;
  description?: string;
  created_by: string;
  created_at: string;
  participants: Participant[];
  code: string;
  language: string;
  is_public: boolean;
  max_participants: number;
  settings: {
    allow_anonymous: boolean;
    require_approval: boolean;
    auto_save: boolean;
    voice_chat: boolean;
    video_chat: boolean;
  };
  activity: Activity[];
}

export interface Participant {
  user_id: string;
  username: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
  last_active: string;
  cursor_position?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  is_typing: boolean;
  status: 'online' | 'away' | 'offline';
}

export interface Activity {
  activity_id: string;
  type: 'code_change' | 'cursor_move' | 'selection' | 'execution' | 'chat' | 'join' | 'leave';
  user_id: string;
  timestamp: string;
  data: any;
}

export interface CodeShare {
  share_id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  created_by: string;
  created_at: string;
  expires_at?: string;
  is_public: boolean;
  view_count: number;
  fork_count: number;
  tags: string[];
  license: string;
  permissions: {
    allow_comments: boolean;
    allow_forks: boolean;
    allow_edits: boolean;
  };
  analytics: {
    views: number;
    copies: number;
    runs: number;
    shares: number;
  };
}

export interface DebugSession {
  debug_id: string;
  execution_id: string;
  code: string;
  language: string;
  breakpoints: Breakpoint[];
  variables: Variable[];
  call_stack: CallStackFrame[];
  status: 'running' | 'paused' | 'finished' | 'error';
  current_line?: number;
  step_mode: 'step_over' | 'step_into' | 'step_out' | 'continue';
  created_at: string;
  updated_at: string;
}

export interface Breakpoint {
  line: number;
  condition?: string;
  enabled: boolean;
  hit_count: number;
  log_message?: string;
}

export interface Variable {
  name: string;
  type: string;
  value: any;
  scope: 'local' | 'global' | 'parameter';
  address?: string;
  size?: number;
  children?: Variable[];
}

export interface CallStackFrame {
  function_name: string;
  file_name: string;
  line_number: number;
  module_name?: string;
  parameters?: Variable[];
}

class AdvancedCodeExecutionService {
  private static instance: AdvancedCodeExecutionService;
  private currentSession: CollaborationSession | null = null;
  private currentDebugSession: DebugSession | null = null;
  private executionHistory: ExecutionResult[] = [];
  private collaborationCallbacks: Map<string, Function> = new Map();

  static getInstance(): AdvancedCodeExecutionService {
    if (!AdvancedCodeExecutionService.instance) {
      AdvancedCodeExecutionService.instance = new AdvancedCodeExecutionService();
    }
    return AdvancedCodeExecutionService.instance;
  }

  // Language Support
  async getSupportedLanguages(): Promise<LanguageInfo[]> {
    try {
      const response = await axios.get(`${CODE_EXECUTION_URL}/languages`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get supported languages:', error);
      throw new Error(error.response?.data?.message || 'Failed to get supported languages');
    }
  }

  async getLanguageInfo(languageId: string): Promise<LanguageInfo> {
    try {
      const response = await axios.get(`${CODE_EXECUTION_URL}/languages/${languageId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get language info:', error);
      throw new Error(error.response?.data?.message || 'Failed to get language info');
    }
  }

  // Advanced Code Execution
  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      const response = await axios.post(`${CODE_EXECUTION_URL}/execute`, request);
      const result = response.data.data;
      
      // Add to history
      this.executionHistory.unshift(result);
      if (this.executionHistory.length > 100) {
        this.executionHistory = this.executionHistory.slice(0, 100);
      }
      
      return result;
    } catch (error: any) {
      console.error('Code execution failed:', error);
      throw new Error(error.response?.data?.message || 'Code execution failed');
    }
  }

  async getExecutionStatus(executionId: string): Promise<ExecutionResult> {
    try {
      const response = await axios.get(`${CODE_EXECUTION_URL}/execution/${executionId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get execution status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get execution status');
    }
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    try {
      const response = await axios.delete(`${CODE_EXECUTION_URL}/execution/${executionId}`);
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to cancel execution:', error);
      throw new Error(error.response?.data?.message || 'Failed to cancel execution');
    }
  }

  async runTestCases(request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      const response = await axios.post(`${CODE_EXECUTION_URL}/test`, request);
      const result = response.data.data;
      
      // Add to history
      this.executionHistory.unshift(result);
      if (this.executionHistory.length > 100) {
        this.executionHistory = this.executionHistory.slice(0, 100);
      }
      
      return result;
    } catch (error: any) {
      console.error('Test execution failed:', error);
      throw new Error(error.response?.data?.message || 'Test execution failed');
    }
  }

  // Real-time Collaboration
  async createCollaborationSession(sessionData: {
    title: string;
    description?: string;
    code: string;
    language: string;
    is_public?: boolean;
    max_participants?: number;
    settings?: any;
  }): Promise<CollaborationSession> {
    try {
      const response = await axios.post(`${COLLABORATION_URL}/sessions`, sessionData);
      this.currentSession = response.data.data;
      return this.currentSession;
    } catch (error: any) {
      console.error('Failed to create collaboration session:', error);
      throw new Error(error.response?.data?.message || 'Failed to create collaboration session');
    }
  }

  async joinCollaborationSession(sessionId: string, userId: string): Promise<CollaborationSession> {
    try {
      const response = await axios.post(`${COLLABORATION_URL}/sessions/${sessionId}/join`, {
        user_id: userId,
      });
      this.currentSession = response.data.data;
      return this.currentSession;
    } catch (error: any) {
      console.error('Failed to join collaboration session:', error);
      throw new Error(error.response?.data?.message || 'Failed to join collaboration session');
    }
  }

  async leaveCollaborationSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const response = await axios.post(`${COLLABORATION_URL}/sessions/${sessionId}/leave`, {
        user_id: userId,
      });
      if (this.currentSession?.session_id === sessionId) {
        this.currentSession = null;
      }
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to leave collaboration session:', error);
      throw new Error(error.response?.data?.message || 'Failed to leave collaboration session');
    }
  }

  async updateCollaborationCode(sessionId: string, code: string, userId: string): Promise<boolean> {
    try {
      const response = await axios.put(`${COLLABORATION_URL}/sessions/${sessionId}/code`, {
        code,
        user_id: userId,
      });
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to update collaboration code:', error);
      throw new Error(error.response?.data?.message || 'Failed to update collaboration code');
    }
  }

  async getCollaborationSession(sessionId: string): Promise<CollaborationSession> {
    try {
      const response = await axios.get(`${COLLABORATION_URL}/sessions/${sessionId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get collaboration session:', error);
      throw new Error(error.response?.data?.message || 'Failed to get collaboration session');
    }
  }

  async getPublicCollaborationSessions(limit: number = 20, offset: number = 0): Promise<CollaborationSession[]> {
    try {
      const response = await axios.get(`${COLLABORATION_URL}/sessions/public`, {
        params: { limit, offset },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get public collaboration sessions:', error);
      throw new Error(error.response?.data?.message || 'Failed to get public collaboration sessions');
    }
  }

  // Code Sharing
  async createCodeShare(shareData: {
    title: string;
    description?: string;
    code: string;
    language: string;
    is_public?: boolean;
    expires_at?: string;
    tags?: string[];
    license?: string;
    permissions?: any;
  }): Promise<CodeShare> {
    try {
      const response = await axios.post(`${CODE_EXECUTION_URL}/share`, shareData);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create code share:', error);
      throw new Error(error.response?.data?.message || 'Failed to create code share');
    }
  }

  async getCodeShare(shareId: string): Promise<CodeShare> {
    try {
      const response = await axios.get(`${CODE_EXECUTION_URL}/share/${shareId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get code share:', error);
      throw new Error(error.response?.data?.message || 'Failed to get code share');
    }
  }

  async updateCodeShare(shareId: string, updates: Partial<CodeShare>): Promise<CodeShare> {
    try {
      const response = await axios.put(`${CODE_EXECUTION_URL}/share/${shareId}`, updates);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update code share:', error);
      throw new Error(error.response?.data?.message || 'Failed to update code share');
    }
  }

  async deleteCodeShare(shareId: string): Promise<boolean> {
    try {
      const response = await axios.delete(`${CODE_EXECUTION_URL}/share/${shareId}`);
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to delete code share:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete code share');
    }
  }

  async searchCodeShares(query: string, filters?: {
    language?: string;
    tags?: string[];
    license?: string;
    is_public?: boolean;
  }): Promise<CodeShare[]> {
    try {
      const response = await axios.get(`${CODE_EXECUTION_URL}/share/search`, {
        params: { query, ...filters },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to search code shares:', error);
      throw new Error(error.response?.data?.message || 'Failed to search code shares');
    }
  }

  async getMyCodeShares(userId: string): Promise<CodeShare[]> {
    try {
      const response = await axios.get(`${CODE_EXECUTION_URL}/share/my`, {
        params: { user_id: userId },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get my code shares:', error);
      throw new Error(error.response?.data?.message || 'Failed to get my code shares');
    }
  }

  async forkCodeShare(shareId: string, userId: string): Promise<CodeShare> {
    try {
      const response = await axios.post(`${CODE_EXECUTION_URL}/share/${shareId}/fork`, {
        user_id: userId,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fork code share:', error);
      throw new Error(error.response?.data?.message || 'Failed to fork code share');
    }
  }

  // Advanced Debugging
  async startDebugSession(executionId: string): Promise<DebugSession> {
    try {
      const response = await axios.post(`${DEBUGGING_URL}/sessions`, {
        execution_id: executionId,
      });
      this.currentDebugSession = response.data.data;
      return this.currentDebugSession;
    } catch (error: any) {
      console.error('Failed to start debug session:', error);
      throw new Error(error.response?.data?.message || 'Failed to start debug session');
    }
  }

  async setBreakpoint(debugId: string, line: number, condition?: string): Promise<boolean> {
    try {
      const response = await axios.post(`${DEBUGGING_URL}/sessions/${debugId}/breakpoints`, {
        line,
        condition,
      });
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to set breakpoint:', error);
      throw new Error(error.response?.data?.message || 'Failed to set breakpoint');
    }
  }

  async removeBreakpoint(debugId: string, line: number): Promise<boolean> {
    try {
      const response = await axios.delete(`${DEBUGGING_URL}/sessions/${debugId}/breakpoints/${line}`);
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to remove breakpoint:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove breakpoint');
    }
  }

  async stepOver(debugId: string): Promise<DebugSession> {
    try {
      const response = await axios.post(`${DEBUGGING_URL}/sessions/${debugId}/step/over`);
      this.currentDebugSession = response.data.data;
      return this.currentDebugSession;
    } catch (error: any) {
      console.error('Failed to step over:', error);
      throw new Error(error.response?.data?.message || 'Failed to step over');
    }
  }

  async stepInto(debugId: string): Promise<DebugSession> {
    try {
      const response = await axios.post(`${DEBUGGING_URL}/sessions/${debugId}/step/into`);
      this.currentDebugSession = response.data.data;
      return this.currentDebugSession;
    } catch (error: any) {
      console.error('Failed to step into:', error);
      throw new Error(error.response?.data?.message || 'Failed to step into');
    }
  }

  async stepOut(debugId: string): Promise<DebugSession> {
    try {
      const response = await axios.post(`${DEBUGGING_URL}/sessions/${debugId}/step/out`);
      this.currentDebugSession = response.data.data;
      return this.currentDebugSession;
    } catch (error: any) {
      console.error('Failed to step out:', error);
      throw new Error(error.response?.data?.message || 'Failed to step out');
    }
  }

  async continueExecution(debugId: string): Promise<DebugSession> {
    try {
      const response = await axios.post(`${DEBUGGING_URL}/sessions/${debugId}/continue`);
      this.currentDebugSession = response.data.data;
      return this.currentDebugSession;
    } catch (error: any) {
      console.error('Failed to continue execution:', error);
      throw new Error(error.response?.data?.message || 'Failed to continue execution');
    }
  }

  async getDebugSession(debugId: string): Promise<DebugSession> {
    try {
      const response = await axios.get(`${DEBUGGING_URL}/sessions/${debugId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get debug session:', error);
      throw new Error(error.response?.data?.message || 'Failed to get debug session');
    }
  }

  async stopDebugSession(debugId: string): Promise<boolean> {
    try {
      const response = await axios.delete(`${DEBUGGING_URL}/sessions/${debugId}`);
      if (this.currentDebugSession?.debug_id === debugId) {
        this.currentDebugSession = null;
      }
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to stop debug session:', error);
      throw new Error(error.response?.data?.message || 'Failed to stop debug session');
    }
  }

  // Code Playground Features
  async createPlayground(playgroundData: {
    title: string;
    description?: string;
    code?: string;
    language?: string;
    template_id?: string;
    is_public?: boolean;
    tags?: string[];
  }): Promise<any> {
    try {
      const response = await axios.post(`${CODE_EXECUTION_URL}/playground`, playgroundData);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create playground:', error);
      throw new Error(error.response?.data?.message || 'Failed to create playground');
    }
  }

  async getPlaygroundTemplates(language?: string): Promise<any[]> {
    try {
      const response = await axios.get(`${CODE_EXECUTION_URL}/playground/templates`, {
        params: { language },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get playground templates:', error);
      throw new Error(error.response?.data?.message || 'Failed to get playground templates');
    }
  }

  async getPlayground(playgroundId: string): Promise<any> {
    try {
      const response = await axios.get(`${CODE_EXECUTION_URL}/playground/${playgroundId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get playground:', error);
      throw new Error(error.response?.data?.message || 'Failed to get playground');
    }
  }

  async updatePlayground(playgroundId: string, updates: any): Promise<any> {
    try {
      const response = await axios.put(`${CODE_EXECUTION_URL}/playground/${playgroundId}`, updates);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update playground:', error);
      throw new Error(error.response?.data?.message || 'Failed to update playground');
    }
  }

  // Utility Methods
  getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  getCurrentDebugSession(): DebugSession | null {
    return this.currentDebugSession;
  }

  getExecutionHistory(): ExecutionResult[] {
    return this.executionHistory;
  }

  clearExecutionHistory(): void {
    this.executionHistory = [];
  }

  // WebSocket for real-time collaboration
  setupCollaborationWebSocket(sessionId: string, callback: Function): void {
    // In a real implementation, this would establish a WebSocket connection
    this.collaborationCallbacks.set(sessionId, callback);
    
    // Mock WebSocket events for demonstration
    setTimeout(() => {
      callback({
        type: 'user_joined',
        data: {
          user_id: 'user123',
          username: 'demo_user',
          role: 'editor',
        },
      });
    }, 1000);
  }

  sendCollaborationMessage(sessionId: string, message: any): void {
    // In a real implementation, this would send a message via WebSocket
    const callback = this.collaborationCallbacks.get(sessionId);
    if (callback) {
      callback({
        type: 'message',
        data: message,
      });
    }
  }

  closeCollaborationWebSocket(sessionId: string): void {
    this.collaborationCallbacks.delete(sessionId);
  }
}

export default AdvancedCodeExecutionService;

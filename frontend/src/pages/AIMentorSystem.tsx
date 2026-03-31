import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fixedApiService } from '../services/fixedApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  code?: string;
  language?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface MentorUserResponse {
  data?: {
    id?: string;
  };
}

interface MentorChatResponse {
  success: boolean;
  data?: {
    response?: string;
    message?: string;
  };
  error?: string;
}

const AIMentorSystem: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const freeModels = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast responses, good for basic questions', free: true },
    { id: 'llama-3-8b', name: 'Llama 3 8B', description: 'Open source, good for code', free: true },
    { id: 'mistral-7b', name: 'Mistral 7B', description: 'Fast, good for Python', free: true }
  ];

  const paidModels = [
    { id: 'gpt-4', name: 'GPT-4', description: 'Best for complex problems', free: false },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Fast and powerful', free: false },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Excellent for coding', free: false }
  ];

  const pythonTopics = [
    'Python Basics', 'Data Structures', 'Algorithms', 'OOP Concepts',
    'Django/Flask', 'Data Science', 'Machine Learning', 'Testing'
  ];

  useEffect(() => {
    const savedSessions = localStorage.getItem('aiMentorSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Chat ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date()
    };
    setSessions((previousSessions) => [newSession, ...previousSessions]);
    setCurrentSession(newSession);
  }, [sessions.length]);

  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    } else if (!currentSession) {
      setCurrentSession(sessions[0]);
    }
  }, [createNewSession, currentSession, sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('aiMentorSessions', JSON.stringify(updatedSessions));
  };

  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    console.log('🚀 Starting AI response for:', userMessage);
    console.log('📊 Using backend AI tutor API');

    try {
      // Get current user info for user_id
      const userResponse = (await fixedApiService.users.getProfile()) as MentorUserResponse;
      const userId = userResponse.data?.id || 'anonymous';
      
      // Use backend AI tutor API with correct format
      const response = (await fixedApiService.aiTutor.chat({
        message: userMessage,
        message_type: 'question',
        user_id: userId,
        session_id: currentSession?.id,
        context: { messages: currentSession?.messages || [] }
      })) as MentorChatResponse;

      console.log('✅ Backend AI API response received:', response);
      
      if (response.success && response.data) {
        return response.data.response || response.data.message || 'No response received';
      } else {
        throw new Error(response.error || 'Unknown error from backend');
      }
    } catch (error) {
      console.error('❌ Backend AI API failed:', error);
      
      // Fallback to local simulation if backend fails
      const fallbackResponses = [
        "I'm here to help you learn Python! Could you clarify what specific topic you'd like to explore?",
        "That's a great question! Let me help you understand this concept better.",
        "I can assist you with Python programming. What would you like to learn about?",
        "Let's work through this step by step. What have you tried so far?"
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage]
    };

    setCurrentSession(updatedSession);
    const updatedSessions = sessions.map(s => s.id === currentSession.id ? updatedSession : s);
    saveSessions(updatedSessions);

    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await simulateAIResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage]
      };

      setCurrentSession(finalSession);
      const finalSessions = sessions.map(s => s.id === currentSession.id ? finalSession : s);
      saveSessions(finalSessions);
    } catch (error) {
      console.error('Error getting AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Python Mentor
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your personal Python programming assistant - Powered by AI
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4">
              
              {/* New Chat Button */}
              <button
                onClick={createNewSession}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 mb-4"
              >
                ➕ New Chat
              </button>

              {/* Model Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">AI Model</h3>
                
                {/* Free Models */}
                <div className="mb-4">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">🆓 FREE Models</p>
                  {freeModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                        selectedModel === model.id
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs opacity-75">{model.description}</div>
                    </button>
                  ))}
                </div>

                {/* Paid Models */}
                <div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-2">💎 Premium Models</p>
                  {paidModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        alert(`${model.name} requires a premium subscription. Upgrade to access!`);
                        setSelectedModel(model.id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                        selectedModel === model.id
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-medium flex items-center justify-between">
                        <span>{model.name}</span>
                        <span className="text-xs">🔒</span>
                      </div>
                      <div className="text-xs opacity-75">{model.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Python Topics */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Python Topics</h3>
                <div className="space-y-1">
                  {pythonTopics.map(topic => (
                    <button
                      key={topic}
                      onClick={() => setInput(`Can you help me with ${topic}?`)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      🐍 {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat History */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Chat History</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => setCurrentSession(session)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentSession?.id === session.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-medium truncate">{session.title}</div>
                      <div className="text-xs opacity-75">
                        {session.messages.length} messages
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 flex flex-col h-[600px]">
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentSession?.messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Hello! I'm your AI Python Mentor
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Ask me anything about Python programming - from basics to advanced topics!
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                      <button
                        onClick={() => setInput('How do I create a Python class?')}
                        className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm"
                      >
                        Python Classes
                      </button>
                      <button
                        onClick={() => setInput('Explain list comprehensions')}
                        className="px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm"
                      >
                        List Comprehensions
                      </button>
                      <button
                        onClick={() => setInput('Help me debug this code')}
                        className="px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg text-sm"
                      >
                        Debug Help
                      </button>
                      <button
                        onClick={() => setInput('Best practices for Python?')}
                        className="px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-lg text-sm"
                      >
                        Best Practices
                      </button>
                    </div>
                  </div>
                ) : (
                  currentSession.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white selection:bg-white/30 selection:text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-green-400 selection:bg-blue-300 selection:text-slate-900 dark:selection:bg-blue-600 dark:selection:text-white'
                        }`}
                      >
                        <div className="overflow-hidden">
                          {message.role === 'user' ? (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          )}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-slate-700 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask anything about Python programming..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 dark:bg-slate-700 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                    className="px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    title="Code Editor"
                  >
                    📝
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '...' : 'Send'}
                  </button>
                </div>
                
                {/* Code Editor */}
                {showCodeEditor && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-600 dark:text-white"
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                      <button
                        onClick={() => {
                          setInput(`Can you help me with this ${selectedLanguage} code?\n\n\`\`\`${selectedLanguage}\n${codeInput}\n\`\`\``);
                          setShowCodeEditor(false);
                          setCodeInput('');
                        }}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Add to Chat
                      </button>
                    </div>
                    <textarea
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      placeholder={`Paste your ${selectedLanguage} code here...`}
                      className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-mono text-sm dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMentorSystem;

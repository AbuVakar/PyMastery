import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AITutorStatus, fixedApiService } from '../services/fixedApi';
import { useToast } from '../components/Toast';
import { useAuth } from '../components/AuthProvider';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

interface ChatResponsePayload {
  response?: string;
  message?: string;
  provider?: string;
  is_fallback?: boolean;
  fallback_reason?: string;
  data?: {
    response?: string;
    message?: string;
  };
}

const demoModeStatus: AITutorStatus = {
  available: false,
  mode: 'demo',
  label: 'Demo Mode AI',
  message: 'Demo Mode AI is active in this environment.'
};

const liveModeStatus: AITutorStatus = {
  available: true,
  mode: 'live',
  label: 'Live Gemini',
  message: 'Live Gemini responses are available.'
};

const AIChatPage: React.FC = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [assistantStatus, setAssistantStatus] = useState<AITutorStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDemoMode = assistantStatus?.mode === 'demo';
  const demoBannerMessage = assistantStatus?.message || demoModeStatus.message;

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        type: 'bot',
        message: "Hello. I'm your AI learning assistant. Ask me about Python, React, debugging, or interview prep.",
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadAssistantStatus = async () => {
      try {
        const status = await fixedApiService.aiTutor.getStatus();
        if (mounted) {
          setAssistantStatus(status);
        }
      } catch {
        if (mounted) {
          setAssistantStatus(demoModeStatus);
        }
      }
    };

    void loadAssistantStatus();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);



  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      message: trimmedMessage,
      timestamp: new Date()
    };

    setMessages((previousMessages) => [...previousMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsBotTyping(true);

    try {
      const response = (await fixedApiService.aiTutor.chat({
        message: trimmedMessage,
        message_type: 'question',
        user_id: user?.id || 'anonymous_user',
        session_id: sessionId
      })) as ChatResponsePayload;

      const botMessage =
        response?.response ||
        response?.message ||
        response?.data?.response ||
        response?.data?.message ||
        'I am here to help you learn programming.';

      if (response?.is_fallback) {
        setAssistantStatus({
          ...demoModeStatus,
          message: response.fallback_reason || demoModeStatus.message
        });
      } else {
        setAssistantStatus(liveModeStatus);
      }

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `bot_${Date.now()}`,
          type: 'bot',
          message: botMessage,
          timestamp: new Date()
        }
      ]);
    } catch {
      const failureMessage = isDemoMode
        ? 'Demo Mode AI is temporarily unavailable. Please try again in a moment.'
        : 'The AI assistant is temporarily unavailable. Please try again in a moment.';

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `bot_error_${Date.now()}`,
          type: 'bot',
          message: failureMessage,
          timestamp: new Date()
        }
      ]);

      addToast({
        type: 'error',
        title: 'AI Temporarily Unavailable',
        message: failureMessage
      });
    } finally {
      setIsLoading(false);
      setIsBotTyping(false);
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-lg dark:bg-slate-800">
        <div className="bg-blue-600 px-6 py-5 text-white dark:bg-blue-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Bot className="h-8 w-8 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold">AI Learning Assistant</h1>
                <p className="truncate text-sm text-blue-100">Ask for explanations, code help, or study guidance.</p>
              </div>
            </div>
            {isDemoMode && (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Demo Mode AI
              </span>
            )}
            <button
              onClick={() =>
                setMessages([
                  {
                    id: 'welcome-reset',
                    type: 'bot',
                    message: 'Chat cleared. What would you like to learn next?',
                    timestamp: new Date()
                  }
                ])
              }
              className="rounded-lg border border-white/20 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10"
            >
              Clear Chat
            </button>
          </div>
        </div>

        <div className="h-[60vh] min-h-[22rem] max-h-[40rem] overflow-y-auto p-6">
          {isDemoMode && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
              <p>{demoBannerMessage}</p>
              <p className="mt-1">Responses come from the built-in tutor.</p>
            </div>
          )}
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-2xl items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-white'
                    }`}
                  >
                    {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white selection:bg-white/30 selection:text-white'
                        : 'bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-white prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-green-400 selection:bg-blue-300 selection:text-slate-900 dark:selection:bg-blue-600 dark:selection:text-white'
                    }`}
                  >
                    <div className="text-sm overflow-hidden">
                      {message.type === 'user' ? (
                        <div className="whitespace-pre-wrap">{message.message}</div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.message}
                        </ReactMarkdown>
                      )}
                    </div>
                    <p className="mt-2 text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}

            {isBotTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-900 dark:bg-slate-700 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI is typing...
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 dark:border-slate-700 sm:p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <textarea
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              placeholder="Ask me anything about programming..."
              className="min-h-[52px] flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;

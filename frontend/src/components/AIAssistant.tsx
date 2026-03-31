import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { Button, Card, Input } from './ui';
import { cn } from '../utils';
import { useAuth } from './AuthProvider';
import { AITutorStatus, fixedApiService } from '../services/fixedApi';

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderLine = (line: string, index: number): React.ReactNode => {
    if (line.startsWith('### ')) return <h4 key={index} className="mb-1 mt-3 text-sm font-semibold text-slate-900 dark:text-white">{line.slice(4)}</h4>;
    if (line.startsWith('## ')) return <h3 key={index} className="mb-1 mt-3 text-sm font-bold text-blue-700 dark:text-blue-400">{line.slice(3)}</h3>;
    if (line.startsWith('# ')) return <h2 key={index} className="mb-1 mt-2 text-base font-bold text-blue-700 dark:text-blue-400">{line.slice(2)}</h2>;
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={index} className="ml-4 list-disc text-slate-700 dark:text-slate-300">{renderInline(line.slice(2))}</li>;
    }
    const numberedMatch = line.match(/^(\d+)\. (.+)/);
    if (numberedMatch) {
      return <li key={index} className="ml-4 list-decimal text-slate-700 dark:text-slate-300">{renderInline(numberedMatch[2])}</li>;
    }
    if (line.trim() === '') return <div key={index} className="h-1" />;
    return <p key={index} className="leading-relaxed text-slate-700 dark:text-slate-300">{renderInline(line)}</p>;
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="rounded bg-slate-200 px-1 py-0.5 font-mono text-xs text-blue-700 dark:bg-slate-700 dark:text-blue-300">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inCode = false;
  let codeLang = '';
  let codeLines: string[] = [];

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
      } else {
        blocks.push(
          <div key={`code-${index}`} className="my-2 overflow-hidden rounded-lg">
            {codeLang && <div className="bg-slate-700 px-3 py-1 font-mono text-xs text-slate-300">{codeLang}</div>}
            <pre className="overflow-x-auto whitespace-pre-wrap bg-slate-800 p-3 font-mono text-xs leading-relaxed text-green-300">{codeLines.join('\n')}</pre>
          </div>
        );
        inCode = false;
        codeLines = [];
      }
    } else if (inCode) {
      codeLines.push(line);
    } else {
      blocks.push(renderLine(line, index));
    }
  });

  return <div className="space-y-0.5 text-sm">{blocks}</div>;
};

interface AssistantResponse {
  data?: {
    response?: string;
    message?: string;
  };
  response?: string;
  message?: string;
  provider?: string;
  is_fallback?: boolean;
  fallback_reason?: string;
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

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I am your PyMastery AI mentor. Ask me anything about your learning path.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState<AITutorStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isDemoMode = assistantStatus?.mode === 'demo';
  const demoBannerMessage = assistantStatus?.message || demoModeStatus.message;

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
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, isLoading, messages]);

  const handleSend = async () => {
    const userText = input.trim();

    if (!userText || isLoading) {
      return;
    }

    setMessages((previousMessages) => [...previousMessages, { role: 'user', content: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = (await fixedApiService.aiTutor.chat({
        message: userText,
        message_type: 'question',
        user_id: user?.id || 'anonymous_user',
        context: {}
      })) as AssistantResponse;

      const reply =
        response.response ||
        response.data?.response ||
        response.data?.message ||
        response.message ||
        'I could not generate a response just now.';

      if (response.is_fallback) {
        setAssistantStatus({
          ...demoModeStatus,
          message: response.fallback_reason || demoModeStatus.message
        });
      } else {
        setAssistantStatus(liveModeStatus);
      }

      setMessages((previousMessages) => [...previousMessages, { role: 'assistant', content: reply }]);
    } catch {
      const message = isDemoMode
        ? 'Demo Mode AI is temporarily unavailable. Please try again in a moment.'
        : 'The AI assistant is temporarily unavailable. Please try again in a moment.';
      setMessages((previousMessages) => [
        ...previousMessages,
        { role: 'assistant', content: message }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] sm:bottom-6 sm:right-6 sm:left-auto">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((previousValue) => !previousValue)}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95',
            isOpen && 'rotate-90'
          )}
          aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <Card className="absolute bottom-16 left-0 right-0 flex h-[32rem] max-h-[calc(100vh-6rem)] flex-col overflow-hidden border-white/10 bg-white/95 p-0 shadow-2xl backdrop-blur dark:bg-slate-900/95 sm:bottom-20 sm:left-auto sm:w-96">
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Mentor</h3>
              <p className="text-xs text-cyan-100">Ask for hints, explanations, and next steps.</p>
            </div>
            {isDemoMode && (
              <span className="ml-auto rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                Demo Mode AI
              </span>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {isDemoMode && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                <p>{demoBannerMessage}</p>
                <p className="mt-1">Responses come from the built-in tutor.</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  'max-w-[85%] rounded-2xl p-3 text-sm',
                  message.role === 'assistant'
                    ? 'rounded-tl-none bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    : 'ml-auto rounded-tr-none bg-blue-600 text-white'
                )}
              >
                {message.role === 'assistant'
                  ? <MarkdownRenderer content={message.content} />
                  : message.content}
              </div>
            ))}

            {isLoading && (
              <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-slate-100 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {!user ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-slate-500">You need to log in to chat with the mentor.</p>
                <Button onClick={() => { window.location.href = '/login'; }} className="h-10 w-full">Log In Now</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Ask the AI mentor..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  className="h-10 text-sm"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  onClick={() => void handleSend()}
                  size="sm"
                  className="h-10 w-10 rounded-lg p-0"
                  disabled={isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AIAssistant;

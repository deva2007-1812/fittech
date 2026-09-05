import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Bot, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { aiService } from '../../services/aiService';
import { getApiErrorMessage } from '../../services/api';
import { generateId } from '../../utils/helpers';
import type { ChatMessage } from '../../types';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

function ChatBubble({ message, onRetry }: { message: ChatMessage; onRetry?: () => void }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3 animate-slide-up', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold',
        isUser ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-emerald-600'
      )}>
        {isUser ? 'U' : <Bot size={16} />}
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-emerald-600 text-white rounded-tr-sm'
          : 'bg-white border border-neutral-100 text-neutral-800 rounded-tl-sm shadow-card'
      )}>
        {message.isLoading ? (
          <div className="flex items-center gap-2 py-1">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <span className="text-xs text-neutral-400">Thinking…</span>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}

        <div className="flex items-center justify-between mt-1.5 gap-2">
          <p className={cn('text-[10px] opacity-60', isUser ? 'text-right' : 'text-left')}>
            {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {!isUser && !message.isLoading && message.content.includes('Sorry') && onRetry && (
            <button
              onClick={onRetry}
              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5"
            >
              <RotateCcw size={10} /> Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting_01',
  role: 'assistant',
  content: "Hello! I'm your FitMind AI Coach. I'm connected to your fitness profile, today's nutrition totals, workouts, and water intake. Ask me anything about your diet, workouts, or personalized suggestions!",
  timestamp: new Date().toISOString(),
};

export function AICoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('fitmind_ai_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [INITIAL_GREETING];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Sync chat to localStorage
  useEffect(() => {
    localStorage.setItem('fitmind_ai_chat', JSON.stringify(messages.filter(m => !m.isLoading)));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    setMessages([INITIAL_GREETING]);
    localStorage.removeItem('fitmind_ai_chat');
    toast.success('Conversation reset');
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    setLastUserMessage(text);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const loadingMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => !m.isLoading)
        .map(m => ({ role: m.role, content: m.content }));

      const { reply } = await aiService.sendMessage(text.trim(), history);

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? { ...m, content: reply || "I've reviewed your request! How else can I help?", isLoading: false }
            : m
        )
      );
    } catch (err) {
      const errorMsg = getApiErrorMessage(err);
      toast.error(errorMsg);
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content: `Sorry, I ran into an issue connecting to the AI service (${errorMsg}). Please try asking again.`,
                isLoading: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleRetry = () => {
    if (lastUserMessage) {
      sendMessage(lastUserMessage);
    }
  };

  const toggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Voice recognition failed. Please try typing.');
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      toast.success('Listening… speak now', { icon: '🎤', duration: 2000 });
    } catch {
      toast.error('Could not activate microphone');
      setIsListening(false);
    }
  };

  const suggestions = [
    'What should I eat for dinner based on my remaining calories?',
    'Did I hit my protein goal today?',
    'Suggest a quick 20-minute bodyweight workout.',
    'How much more water should I drink today?',
  ];

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Bot size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="font-bold text-neutral-900">AI Coach</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-xs text-neutral-500">Context-Aware · Powered by FitMind AI</p>
            </div>
          </div>
        </div>
        {messages.length > 1 && (
          <button
            onClick={clearChat}
            className="text-xs text-neutral-400 hover:text-red-500 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-100 hover:border-red-100 hover:bg-red-50 transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
        {messages.length === 0 ? (
          <EmptyState
            icon={<Bot size={40} />}
            title="Start a conversation"
            description="Ask me anything about nutrition, fitness, or your daily targets."
          />
        ) : (
          messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} onRetry={handleRetry} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 sm:px-6 pb-4">
          <p className="text-xs text-neutral-400 mb-2.5 font-medium">Try asking…</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-xs text-neutral-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all duration-150"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-neutral-100 bg-white px-4 sm:px-6 py-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0',
              isListening
                ? 'bg-red-500 text-white animate-pulse-slow'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isListening ? 'Listening…' : 'Ask your AI coach anything…'}
            className="flex-1 input"
            disabled={isListening}
            aria-label="Chat input"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>

        {isListening && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-1 rounded-full bg-red-400 animate-bounce" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
            <span className="text-xs text-red-500 font-medium">Tap microphone to stop</span>
          </div>
        )}
      </div>
    </div>
  );
}

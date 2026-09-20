import { useState, useRef, useCallback, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { getApiErrorMessage } from '../services/api';
import { generateId } from '../utils/helpers';
import type { ChatMessage } from '../types';
import type { SpriteState } from './useSpriteAnimation';
import toast from 'react-hot-toast';

export type AICoachState = 'idle' | 'listening' | 'thinking' | 'responding' | 'error';

const AI_STATE_TO_SPRITE: Record<AICoachState, SpriteState> = {
  idle:       'idle',
  listening:  'look-a',
  thinking:   'review',
  responding: 'running-right',
  error:      'failed',
};

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting_01',
  role: 'assistant',
  content: "Hi! I'm your FitMind AI Coach 👋 I'm connected to your fitness profile, nutrition, workouts, and water intake. How can I help you today?",
  timestamp: new Date().toISOString(),
};

const STORAGE_KEY = 'fitmind_ai_chat';

function loadMessages(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {/* ignore */}
  return [INITIAL_GREETING];
}

export interface UseAICoachReturn {
  isOpen: boolean;
  aiState: AICoachState;
  spriteState: SpriteState;
  messages: ChatMessage[];
  input: string;
  isListening: boolean;
  setInput: (v: string) => void;
  toggleOpen: () => void;
  closePanel: () => void;
  sendMessage: (text: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => void;
  toggleVoice: () => void;
  clearChat: () => void;
}

export function useAICoach(): UseAICoachReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [aiState, setAiState] = useState<AICoachState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Persist messages (filter out loading states)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.filter(m => !m.isLoading)));
  }, [messages]);

  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || aiState === 'thinking' || aiState === 'responding') return;

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
    setAiState('thinking');

    try {
      const history = messages
        .filter(m => !m.isLoading)
        .map(m => ({ role: m.role, content: m.content }));

      setAiState('responding');
      const { reply } = await aiService.sendMessage(text.trim(), history);

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? { ...m, content: reply || "I've reviewed your data! How else can I help?", isLoading: false }
            : m
        )
      );
      setAiState('idle');
    } catch (err) {
      const errorMsg = getApiErrorMessage(err);
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content: `Sorry, I ran into a connection issue (${errorMsg}). Please try again.`,
                isLoading: false,
              }
            : m
        )
      );
      setAiState('error');
      toast.error(errorMsg);
      // Auto-recover to idle after a moment
      setTimeout(() => setAiState('idle'), 3000);
    }
  }, [aiState, messages]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  const toggleVoice = useCallback(() => {
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
      setAiState('idle');
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
        setAiState('idle');
        sendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setAiState('idle');
        toast.error('Voice recognition failed. Please try typing.');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (aiState === 'listening') setAiState('idle');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setAiState('listening');
      toast.success('Listening… speak now', { icon: '🎤', duration: 2000 });
    } catch {
      toast.error('Could not activate microphone');
      setIsListening(false);
      setAiState('idle');
    }
  }, [isListening, aiState, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([INITIAL_GREETING]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Conversation reset');
  }, []);

  return {
    isOpen,
    aiState,
    spriteState: AI_STATE_TO_SPRITE[aiState],
    messages,
    input,
    isListening,
    setInput,
    toggleOpen,
    closePanel,
    sendMessage,
    handleSubmit,
    toggleVoice,
    clearChat,
  };
}

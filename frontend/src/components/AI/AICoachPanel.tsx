import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Send, Loader2, Trash2, Zap } from 'lucide-react';
import { AIChatMessages } from './AIChatMessages';
import { AIVoiceInput } from './AIVoiceInput';
import { AIQuickActions } from './AIQuickActions';
import type { UseAICoachReturn } from '../../hooks/useAICoach';
import { cn } from '../../utils/helpers';

interface AICoachPanelProps extends Omit<UseAICoachReturn, 'toggleOpen' | 'spriteState'> {
  onClose: () => void;
}

const AI_STATE_LABELS = {
  idle:       { text: 'Ready to help', color: 'text-emerald-500' },
  listening:  { text: 'Listening…', color: 'text-emerald-400' },
  thinking:   { text: 'Thinking…', color: 'text-amber-500' },
  responding: { text: 'Preparing your response…', color: 'text-blue-500' },
  error:      { text: 'Connection error', color: 'text-red-500' },
};

export function AICoachPanel({
  onClose,
  aiState,
  messages,
  input,
  isListening,
  setInput,
  sendMessage,
  handleSubmit,
  toggleVoice,
  clearChat,
}: AICoachPanelProps) {
  const [isExiting, setIsExiting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const stateInfo = AI_STATE_LABELS[aiState];
  const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content ?? '';

  // Focus input on open
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 220);
  }, [onClose]);

  const handleRetry = useCallback(() => {
    if (lastUserMsg) sendMessage(lastUserMsg);
  }, [lastUserMsg, sendMessage]);

  const showQuickActions = messages.length <= 1;
  const isProcessing = aiState === 'thinking' || aiState === 'responding';

  return (
    /*
     * Panel: positioned by parent (FloatingAICoach) as absolute above the sprite.
     * On desktop: 380px wide, 540px tall.
     * On mobile: full-width bottom sheet via parent wrapper.
     */
    <div
      role="dialog"
      aria-label="FitMind AI Coach"
      aria-modal="true"
      className={cn(
        'flex flex-col bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden',
        'border border-neutral-100 dark:border-neutral-800',
        'shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2),0_8px_24px_-6px_rgba(0,0,0,0.1)]',
        'dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6),0_8px_24px_-6px_rgba(0,0,0,0.4)]',
        isExiting ? 'ai-panel-exit' : 'ai-panel-enter'
      )}
      style={{ width: '380px', height: '540px' }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0 bg-white dark:bg-neutral-900">
        {/* Brand icon */}
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Zap size={15} className="text-white" />
        </div>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">FitMind AI</h2>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              Coach
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', {
              idle: 'bg-emerald-500',
              listening: 'bg-emerald-400 ai-dot-online',
              thinking: 'bg-amber-400 ai-dot-online',
              responding: 'bg-blue-400 ai-dot-online',
              error: 'bg-red-400',
            }[aiState])} />
            <p className={cn('text-[11px] font-medium transition-all duration-300', stateInfo.color)}>
              {stateInfo.text}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {messages.length > 1 && (
            <button
              onClick={clearChat}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-150"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150"
            aria-label="Close AI Coach"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────── */}
      <AIChatMessages
        messages={messages}
        aiState={aiState}
        onRetry={handleRetry}
      />

      {/* ── Quick Actions (first open only) ────────────── */}
      {showQuickActions && (
        <AIQuickActions onSelect={(text) => { sendMessage(text); }} />
      )}

      {/* ── Input bar ──────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <AIVoiceInput isListening={isListening} onToggle={toggleVoice} />

          <input
            ref={inputRef}
            id="ai-coach-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isListening ? 'Listening…' : 'Ask your AI coach anything…'}
            disabled={isListening || isProcessing}
            aria-label="Message to AI Coach"
            className="flex-1 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
          />

          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            aria-label="Send message"
            className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 shadow-sm"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>

        {/* Listening waveform hint text */}
        {isListening && (
          <p className="text-center text-[11px] text-red-500 font-medium mt-1.5 animate-fade-in">
            Tap microphone to stop
          </p>
        )}
      </div>
    </div>
  );
}

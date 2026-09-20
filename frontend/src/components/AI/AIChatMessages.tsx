import React, { useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import type { ChatMessage } from '../../types';
import type { AICoachState } from '../../hooks/useAICoach';
import { cn } from '../../utils/helpers';

interface AIChatMessagesProps {
  messages: ChatMessage[];
  aiState: AICoachState;
  onRetry: () => void;
}

function ThinkingBubble() {
  return (
    <div className="flex gap-2.5 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0 text-lg">
        🤖
      </div>
      <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-card">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {{
              thinking: 'Thinking…',
              responding: 'Preparing response…',
            }['thinking']}
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message, onRetry }: { message: ChatMessage; onRetry: () => void }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2.5 animate-slide-up', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
        isUser
          ? 'bg-emerald-600 text-white'
          : 'bg-emerald-100 dark:bg-emerald-950/60 text-lg'
      )}>
        {isUser ? 'U' : '🤖'}
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
        isUser
          ? 'bg-emerald-600 text-white rounded-tr-sm'
          : 'bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-tl-sm shadow-card'
      )}>
        {message.isLoading ? (
          <div className="flex items-center gap-2 py-1">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <span className="text-xs text-neutral-400">Thinking…</span>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}

        <div className="flex items-center justify-between mt-1 gap-2">
          <p className={cn('text-[10px] opacity-50', isUser ? 'text-right' : 'text-left')}>
            {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {!isUser && !message.isLoading && message.content.includes('Sorry') && (
            <button
              onClick={onRetry}
              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5"
            >
              <RotateCcw size={9} /> Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AIChatMessages({ messages, aiState, onRetry }: AIChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isThinking = aiState === 'thinking' || aiState === 'responding';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 hide-scrollbar">
      {messages.map(msg => (
        <ChatBubble key={msg.id} message={msg} onRetry={onRetry} />
      ))}
      {isThinking && <ThinkingBubble />}
      <div ref={bottomRef} />
    </div>
  );
}

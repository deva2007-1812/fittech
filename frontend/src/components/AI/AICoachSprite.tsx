import React, { useState, useCallback } from 'react';
import { useSpriteAnimation } from '../../hooks/useSpriteAnimation';
import type { SpriteState } from '../../hooks/useSpriteAnimation';
import type { AICoachState } from '../../hooks/useAICoach';
import { cn } from '../../utils/helpers';

interface AICoachSpriteProps {
  spriteState: SpriteState;
  aiState: AICoachState;
  isOpen: boolean;
  onClick: () => void;
}

const STATE_GLOW: Record<AICoachState, string> = {
  idle:       '',
  listening:  'ring-2 ring-emerald-400 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950',
  thinking:   'ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950',
  responding: 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950',
  error:      'ring-2 ring-red-400 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950',
};

export function AICoachSprite({ spriteState, aiState, isOpen, onClick }: AICoachSpriteProps) {
  const [isHovered, setIsHovered] = useState(false);

  // When hovered and idle, switch to waving
  const effectiveState: SpriteState = isHovered && aiState === 'idle' ? 'waving' : spriteState;

  const { backgroundPosition, backgroundSize, width, height } = useSpriteAnimation(
    effectiveState,
    // After waving animation ends, no callback needed (loop:false handles it)
    undefined
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Hover tooltip */}
      {isHovered && !isOpen && (
        <div
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap
                     bg-neutral-900 dark:bg-neutral-800 text-white text-xs font-medium
                     px-3 py-1.5 rounded-full shadow-lg pointer-events-none
                     animate-fade-in z-10"
        >
          Talk to your AI Coach
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-800" />
        </div>
      )}

      {/* Sprite button */}
      <button
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Open FitMind AI Coach"
        aria-expanded={isOpen}
        className={cn(
          'relative rounded-2xl cursor-pointer select-none transition-all duration-200 overflow-hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          // Float animation when idle
          aiState === 'idle' && 'ai-float',
          // Pulse ring when listening
          aiState === 'listening' && 'ai-pulse-ring',
          // Scale on hover
          isHovered && 'scale-110',
          // State-specific ring
          STATE_GLOW[aiState]
        )}
        style={{ width, height }}
      >
        {/* Sprite canvas — pure CSS, no WebGL */}
        <div
          style={{
            width,
            height,
            backgroundImage: 'url(/ai-coach/spritesheet.webp)',
            backgroundPosition,
            backgroundSize,
            backgroundRepeat: 'no-repeat',
            imageRendering: 'auto',
          }}
        />
      </button>

      {/* Online indicator dot */}
      <div className="mt-1 flex items-center gap-1.5">
        <div className={cn(
          'w-2 h-2 rounded-full ai-dot-online',
          {
            idle:       'bg-emerald-500',
            listening:  'bg-emerald-400',
            thinking:   'bg-amber-400',
            responding: 'bg-blue-400',
            error:      'bg-red-400',
          }[aiState]
        )} />
        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
          {{
            idle:       'FitMind AI',
            listening:  'Listening…',
            thinking:   'Thinking…',
            responding: 'Responding…',
            error:      'Error',
          }[aiState]}
        </span>
      </div>
    </div>
  );
}

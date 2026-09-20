import React, { useEffect, useRef } from 'react';
import { AICoachSprite } from './AICoachSprite';
import { AICoachPanel } from './AICoachPanel';
import { useAICoach } from '../../hooks/useAICoach';
import { cn } from '../../utils/helpers';

/**
 * FloatingAICoach
 *
 * A persistent floating AI assistant anchored to the bottom-right of the
 * authenticated app. Always available, never obtrusive.
 *
 * Z-index: 900 — above sidebar (40) and bottom nav (50), below modals (1000+).
 *
 * Layout:
 *   ┌─────────────────┐
 *   │  AI Coach Panel │  ← absolute, above sprite
 *   └────────┬────────┘
 *            │
 *         [Sprite]       ← fixed bottom-right
 *
 * Mobile: Panel becomes near-full-width, sprite stays visible at bottom.
 */
export function FloatingAICoach() {
  const coach = useAICoach();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click (but not when clicking the sprite itself)
  useEffect(() => {
    if (!coach.isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        coach.closePanel();
      }
    };
    // Small delay so the opening click doesn't immediately close
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [coach.isOpen, coach.closePanel]);

  return (
    /*
     * Outer wrapper: fixed to viewport, bottom-right.
     * On mobile, pushed up above the bottom navigation bar (72px tall).
     */
    <div
      ref={containerRef}
      className={cn(
        'fixed z-[900] flex flex-col items-end',
        // Desktop: 24px from edges
        'right-6 bottom-6',
        // Mobile: stay above bottom nav (~72px) + safe area
        'max-sm:right-4 max-sm:bottom-[84px]'
      )}
      aria-live="polite"
    >
      {/* ── Chat Panel (shown when open) ───────────────────── */}
      {coach.isOpen && (
        <div
          className={cn(
            'mb-3 relative',
            // Desktop: fixed width panel
            'max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:bottom-[168px]'
          )}
        >
          <AICoachPanel
            onClose={coach.closePanel}
            aiState={coach.aiState}
            isOpen={coach.isOpen}
            messages={coach.messages}
            input={coach.input}
            isListening={coach.isListening}
            setInput={coach.setInput}
            sendMessage={coach.sendMessage}
            handleSubmit={coach.handleSubmit}
            toggleVoice={coach.toggleVoice}
            clearChat={coach.clearChat}
          />
        </div>
      )}

      {/* ── Sprite (always visible) ────────────────────────── */}
      <AICoachSprite
        spriteState={coach.spriteState}
        aiState={coach.aiState}
        isOpen={coach.isOpen}
        onClick={coach.toggleOpen}
      />
    </div>
  );
}

import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface AIVoiceInputProps {
  isListening: boolean;
  onToggle: () => void;
}

export function AIVoiceInput({ isListening, onToggle }: AIVoiceInputProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0',
          isListening
            ? 'bg-red-500 text-white shadow-md shadow-red-200 dark:shadow-red-900/40'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
        )}
      >
        {isListening ? <MicOff size={17} /> : <Mic size={17} />}
      </button>

      {/* Waveform bars when listening */}
      {isListening && (
        <div className="flex items-end gap-[3px] h-4">
          {[3, 6, 10, 7, 4, 8, 5].map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-red-400 animate-bounce"
              style={{
                height: `${h}px`,
                animationDelay: `${i * 80}ms`,
                animationDuration: '600ms',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

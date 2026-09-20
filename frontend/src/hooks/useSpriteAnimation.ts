import { useEffect, useRef, useState } from 'react';

// Spritesheet constants (matches spritesheet.webp)
// Original cell size: 192×208px, rendered at half: 96×104px
// background-size: 768px 1144px  (8 cols × 96, 11 rows × 104)
const COLS = 8;
const CELL_W = 96;   // rendered width  (192 / 2)
const CELL_H = 104;  // rendered height (208 / 2)

export type SpriteState =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review'
  | 'look-a'
  | 'look-b';

interface SpriteConfig {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
}

const SPRITE_CONFIGS: Record<SpriteState, SpriteConfig> = {
  idle:           { row: 0,  frames: 7, fps: 7,  loop: true },
  'running-right':{ row: 1,  frames: 8, fps: 10, loop: true },
  'running-left': { row: 2,  frames: 8, fps: 10, loop: true },
  waving:         { row: 3,  frames: 4, fps: 8,  loop: false },
  jumping:        { row: 4,  frames: 5, fps: 8,  loop: false },
  failed:         { row: 5,  frames: 8, fps: 6,  loop: true },
  waiting:        { row: 6,  frames: 6, fps: 5,  loop: true },
  running:        { row: 7,  frames: 6, fps: 8,  loop: true },
  review:         { row: 8,  frames: 6, fps: 4,  loop: true },
  'look-a':       { row: 9,  frames: 8, fps: 6,  loop: true },
  'look-b':       { row: 10, frames: 8, fps: 6,  loop: true },
};

interface UseSpriteAnimationResult {
  backgroundPosition: string;
  backgroundSize: string;
  width: number;
  height: number;
}

export function useSpriteAnimation(
  state: SpriteState,
  onAnimationEnd?: () => void
): UseSpriteAnimationResult {
  const [frame, setFrame] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameRef = useRef(0);
  const onEndRef = useRef(onAnimationEnd);
  onEndRef.current = onAnimationEnd;

  // Respect prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Reset frame when state changes
    frameRef.current = 0;
    setFrame(0);

    if (prefersReducedMotion) return;

    const config = SPRITE_CONFIGS[state];
    const msPerFrame = 1000 / config.fps;

    const tick = (time: number) => {
      if (time - lastTimeRef.current >= msPerFrame) {
        lastTimeRef.current = time;
        const nextFrame = frameRef.current + 1;

        if (nextFrame >= config.frames) {
          if (config.loop) {
            frameRef.current = 0;
            setFrame(0);
          } else {
            // Hold last frame and notify
            frameRef.current = config.frames - 1;
            setFrame(config.frames - 1);
            onEndRef.current?.();
            return; // Stop RAF
          }
        } else {
          frameRef.current = nextFrame;
          setFrame(nextFrame);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [state, prefersReducedMotion]);

  const config = SPRITE_CONFIGS[state];
  const col = frame % COLS;
  const x = -(col * CELL_W);
  const y = -(config.row * CELL_H);

  return {
    backgroundPosition: `${x}px ${y}px`,
    backgroundSize: `${COLS * CELL_W}px ${11 * CELL_H}px`,
    width: CELL_W,
    height: CELL_H,
  };
}

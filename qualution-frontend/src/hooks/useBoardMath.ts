/**
 * useBoardMath.ts
 *
 * PHASE 8: Mathematical Teaching — Board Math State Machine & Coordination Hook.
 *
 * Responsibilities:
 * - Manages list of BoardMathItem elements rendered via KaTeX on the Teaching Board.
 * - Provides `writeMath()`, `teachMath()`, and `replaceMath()` promise-based APIs.
 * - Supports progressive mathematical reveal, replacement without ghosting,
 *   and coordinated teacher cursor motion.
 * - Full token-based animation cancellation and reset safety.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { BoardMathItem } from '../components/teaching/BoardMathLayer';
import type { BoardCursorController } from './useBoardCursor';
import type { MathItemStyle } from '../features/theory/teachingActions';

export interface WriteMathOptions {
  id?: string;
  latex: string;
  x: number;
  y: number;
  durationMs?: number;
  style?: MathItemStyle;
  replaceId?: string;
  cursor?: BoardCursorController;
  cursorMoveDuration?: number;
  beforePause?: number;
  afterPause?: number;
}

export interface TeachMathOptions extends WriteMathOptions {}

export interface ReplaceMathOptions {
  durationMs?: number;
  cursor?: BoardCursorController;
  cursorMoveDuration?: number;
  beforePause?: number;
  afterPause?: number;
  newX?: number;
  newY?: number;
  style?: MathItemStyle;
}

export interface BoardMathOptions {
  cursor?: BoardCursorController;
}

export interface BoardMathController {
  items: BoardMathItem[];
  writeMath: (options: WriteMathOptions) => Promise<void>;
  teachMath: (options: TeachMathOptions) => Promise<void>;
  replaceMath: (id: string, newLatex: string, options?: ReplaceMathOptions) => Promise<void>;
  setMathProgress: (id: string, progress: number) => void;
  removeMath: (id: string) => void;
  clear: () => void;
  reset: () => void;
  isWriting: boolean;
}

const DEFAULT_FADE_MS = 250;
const DEFAULT_CURSOR_MOVE_MS = 500;
const DEFAULT_PAUSE_MS = 200;

function makeMathId(): string {
  return `math-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function useBoardMath(mathOpts?: BoardMathOptions): BoardMathController {
  const defaultCursor = mathOpts?.cursor;
  const [items, setItems] = useState<BoardMathItem[]>([]);
  const [isWriting, setIsWriting] = useState<boolean>(false);

  const tokenRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      timeoutIdsRef.current.forEach((t) => clearTimeout(t));
      timeoutIdsRef.current.clear();
    };
  }, []);

  const cancelActive = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    timeoutIdsRef.current.forEach((t) => clearTimeout(t));
    timeoutIdsRef.current.clear();
    tokenRef.current += 1;
    if (isMountedRef.current) setIsWriting(false);
  }, []);

  const clear = useCallback(() => {
    cancelActive();
    if (isMountedRef.current) setItems([]);
  }, [cancelActive]);

  const reset = useCallback(() => {
    cancelActive();
    if (isMountedRef.current) {
      setItems([]);
      setIsWriting(false);
    }
  }, [cancelActive]);

  const wait = useCallback((ms: number, token: number): Promise<boolean> => {
    if (ms <= 0) return Promise.resolve(tokenRef.current === token && isMountedRef.current);
    return new Promise<boolean>((resolve) => {
      let timer: ReturnType<typeof setTimeout>;
      timer = setTimeout(() => {
        timeoutIdsRef.current.delete(timer);
        resolve(tokenRef.current === token && isMountedRef.current);
      }, ms);
      timeoutIdsRef.current.add(timer);
    });
  }, []);

  // ── Opacity Animation Helper ─────────────────────────────────────────────

  function animateOpacity(
    id: string,
    fromOpacity: number,
    toOpacity: number,
    durationMs: number,
    token: number
  ): Promise<void> {
    if (durationMs <= 0 || !isMountedRef.current) {
      if (isMountedRef.current) {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, opacity: toOpacity, progress: toOpacity } : it))
        );
      }
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      let startTs: number | null = null;

      const tick = (ts: number) => {
        if (tokenRef.current !== token || !isMountedRef.current) {
          resolve();
          return;
        }
        if (startTs === null) startTs = ts;

        const elapsed = ts - startTs;
        const t = Math.min(1, elapsed / durationMs);
        const currentOp = fromOpacity + (toOpacity - fromOpacity) * t;

        if (isMountedRef.current) {
          setItems((prev) =>
            prev.map((it) => (it.id === id ? { ...it, opacity: currentOp, progress: currentOp } : it))
          );
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          resolve();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    });
  }

  // ── writeMath ────────────────────────────────────────────────────────────

  const writeMath = useCallback(
    async (options: WriteMathOptions): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;
      if (isMountedRef.current) setIsWriting(true);

      const id = options.id ?? makeMathId();
      const { latex, x, y, durationMs = DEFAULT_FADE_MS, style, replaceId } = options;
      const scale = style?.scale ?? 1.0;
      const fontSize = style?.fontSize;
      const color = style?.color ?? '#f5c842';

      const newItem: BoardMathItem = {
        id,
        latex,
        x,
        y,
        scale,
        fontSize,
        color,
        opacity: durationMs > 0 ? 0 : 1,
        progress: durationMs > 0 ? 0 : 1,
      };

      if (isMountedRef.current) {
        setItems((prev) => {
          if (replaceId) {
            // Replace matching existing item in-place
            const idx = prev.findIndex((it) => it.id === replaceId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = newItem;
              return copy;
            }
          }
          // Remove duplicate if same ID already exists
          const filtered = prev.filter((it) => it.id !== id);
          return [...filtered, newItem];
        });
      }

      if (durationMs > 0) {
        await animateOpacity(id, 0, 1, durationMs, token);
      }

      if (tokenRef.current === token && isMountedRef.current) {
        setIsWriting(false);
      }
    },
    [cancelActive]
  );

  // ── teachMath ────────────────────────────────────────────────────────────

  const teachMath = useCallback(
    async (options: TeachMathOptions): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;
      if (isMountedRef.current) setIsWriting(true);

      const id = options.id ?? makeMathId();
      const {
        latex,
        x,
        y,
        durationMs = DEFAULT_FADE_MS,
        style,
        replaceId,
        cursorMoveDuration = DEFAULT_CURSOR_MOVE_MS,
        beforePause = DEFAULT_PAUSE_MS,
        afterPause = DEFAULT_PAUSE_MS,
      } = options;
      const activeCursor = options.cursor ?? defaultCursor;

      // 1. Move cursor to math position
      if (activeCursor) {
        activeCursor.show();
        await activeCursor.moveTo(x, y, cursorMoveDuration);
        if (tokenRef.current !== token || !isMountedRef.current) return;
      }

      // 2. Before pause
      if (beforePause > 0) {
        const ok = await wait(beforePause, token);
        if (!ok) return;
      }

      // 3. Write math
      const scale = style?.scale ?? 1.0;
      const fontSize = style?.fontSize;
      const color = style?.color ?? '#f5c842';

      const newItem: BoardMathItem = {
        id,
        latex,
        x,
        y,
        scale,
        fontSize,
        color,
        opacity: durationMs > 0 ? 0 : 1,
        progress: durationMs > 0 ? 0 : 1,
      };

      if (isMountedRef.current) {
        setItems((prev) => {
          if (replaceId) {
            const idx = prev.findIndex((it) => it.id === replaceId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = newItem;
              return copy;
            }
          }
          const filtered = prev.filter((it) => it.id !== id);
          return [...filtered, newItem];
        });
      }

      if (durationMs > 0) {
        await animateOpacity(id, 0, 1, durationMs, token);
        if (tokenRef.current !== token || !isMountedRef.current) return;
      }

      // 4. After pause
      if (afterPause > 0) {
        const ok = await wait(afterPause, token);
        if (!ok) return;
      }

      if (tokenRef.current === token && isMountedRef.current) {
        setIsWriting(false);
      }
    },
    [cancelActive, defaultCursor, wait]
  );

  // ── replaceMath ──────────────────────────────────────────────────────────

  const replaceMath = useCallback(
    async (id: string, newLatex: string, options: ReplaceMathOptions = {}): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;
      if (isMountedRef.current) setIsWriting(true);

      const {
        durationMs = DEFAULT_FADE_MS,
        cursorMoveDuration = DEFAULT_CURSOR_MOVE_MS,
        beforePause = 100,
        afterPause = DEFAULT_PAUSE_MS,
        newX,
        newY,
        style,
      } = options;
      const activeCursor = options.cursor ?? defaultCursor;

      // 1. Move cursor if requested
      if (activeCursor && newX !== undefined && newY !== undefined) {
        activeCursor.show();
        await activeCursor.moveTo(newX, newY, cursorMoveDuration);
        if (tokenRef.current !== token || !isMountedRef.current) return;
      }

      if (beforePause > 0) {
        const ok = await wait(beforePause, token);
        if (!ok) return;
      }

      // 2. Replace the formula
      if (isMountedRef.current) {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it;
            return {
              ...it,
              latex: newLatex,
              x: newX ?? it.x,
              y: newY ?? it.y,
              scale: style?.scale ?? it.scale,
              color: style?.color ?? it.color,
              fontSize: style?.fontSize ?? it.fontSize,
              opacity: durationMs > 0 ? 0.3 : 1,
              progress: durationMs > 0 ? 0.3 : 1,
            };
          })
        );
      }

      // 3. Fade in smoothly to 1
      if (durationMs > 0) {
        await animateOpacity(id, 0.3, 1, durationMs, token);
        if (tokenRef.current !== token || !isMountedRef.current) return;
      }

      if (afterPause > 0) {
        const ok = await wait(afterPause, token);
        if (!ok) return;
      }

      if (tokenRef.current === token && isMountedRef.current) {
        setIsWriting(false);
      }
    },
    [cancelActive, defaultCursor, wait]
  );

  // ── setMathProgress ──────────────────────────────────────────────────────

  const setMathProgress = useCallback((id: string, progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    if (isMountedRef.current) {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, opacity: clamped, progress: clamped } : it))
      );
    }
  }, []);

  // ── removeMath ───────────────────────────────────────────────────────────

  const removeMath = useCallback((id: string) => {
    if (isMountedRef.current) {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }
  }, []);

  return {
    items,
    writeMath,
    teachMath,
    replaceMath,
    setMathProgress,
    removeMath,
    clear,
    reset,
    isWriting,
  };
}

export default useBoardMath;

/**
 * useBoardWriter.ts
 *
 * PHASE 3: Board Writing State Machine & Cursor Synchronization Hook.
 *
 * Responsibilities:
 * - Manages list of BoardTextItems rendered on the Teaching Board.
 * - Provides `writeText({ text, x, y, durationMs, style, cursor })` promise-based action.
 * - Synchronously drives both text progressive reveal (clip-path) and cursor writing-head motion.
 * - Allows deterministic seeking via `setTextProgress(id, progress)`.
 * - Supports cancellation, clear(), and reset().
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { BoardTextItem } from '../components/teaching/BoardTextLayer';
import type { BoardCursorController } from './useBoardCursor';
import {
  computeTextBounds,
  computeWritingHeadPosition,
  interpolateWritingPosition,
  type TextAlign,
} from '../features/theory/textMotion';
import { distance } from '../features/theory/cursorMotion';

export interface BoardTextStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  color?: string;
  align?: TextAlign;
  letterSpacing?: number;
  opacity?: number;
}

export interface WriteTextOptions {
  id?: string;
  text: string;
  x: number;
  y: number;
  durationMs?: number;
  style?: BoardTextStyle;
  /** Optional cursor controller to synchronize writing motion */
  cursor?: BoardCursorController;
  /** Duration in ms to move cursor to start point before writing begins (default: auto) */
  travelDurationMs?: number;
}

export interface TeachTextOptions {
  id?: string;
  text: string;
  x: number;
  y: number;
  duration?: number;
  durationMs?: number;
  style?: BoardTextStyle;
  cursorMoveDuration?: number;
  beforePause?: number;
  afterPause?: number;
  cursor?: BoardCursorController;
}

export interface BoardWriterOptions {
  /** Optional default cursor controller attached to this writer */
  cursor?: BoardCursorController;
}

export interface BoardWriterController {
  /** All text items currently tracked on the board */
  items: BoardTextItem[];
  /** Progressively writes a text element onto the board (supports options object or positional args) */
  writeText: {
    (options: WriteTextOptions): Promise<void>;
    (
      text: string,
      x: number,
      y: number,
      durationMs?: number,
      style?: BoardTextStyle,
      cursor?: BoardCursorController
    ): Promise<void>;
  };
  /**
   * PHASE 4: Coordinated single teacher action:
   * CURSOR -> MOVE -> PAUSE -> WRITE -> FINISH -> PAUSE
   */
  teachText: (options: TeachTextOptions) => Promise<void>;
  /** Directly sets the reveal progress (0..1) of a specific text item */
  setTextProgress: (id: string, progress: number) => void;
  /** Removes all text items from the board */
  clear: () => void;
  /** Cancels active animations and clears all text items */
  reset: () => void;
  /** Whether a writing animation is currently active */
  isWriting: boolean;
}

export function useBoardWriter(writerOpts?: BoardWriterOptions): BoardWriterController {
  const defaultCursor = writerOpts?.cursor;
  const [items, setItems] = useState<BoardTextItem[]>([]);
  const [isWriting, setIsWriting] = useState<boolean>(false);

  const animFrameIdRef = useRef<number | null>(null);
  const animTokenRef = useRef<number>(0);
  const resolveRef = useRef<(() => void) | null>(null);
  const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      timeoutIdsRef.current.forEach((t) => clearTimeout(t));
      timeoutIdsRef.current.clear();
      resolveRef.current?.();
      resolveRef.current = null;
    };
  }, []);

  const cancelActiveAnimation = useCallback(() => {
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    timeoutIdsRef.current.forEach((t) => clearTimeout(t));
    timeoutIdsRef.current.clear();
    animTokenRef.current += 1;
    if (resolveRef.current) {
      const resolve = resolveRef.current;
      resolveRef.current = null;
      resolve();
    }
    if (isMountedRef.current) {
      setIsWriting(false);
    }
  }, []);

  const wait = useCallback((ms: number, token: number): Promise<boolean> => {
    if (ms <= 0) return Promise.resolve(animTokenRef.current === token && isMountedRef.current);
    return new Promise<boolean>((resolve) => {
      let timer: ReturnType<typeof setTimeout>;
      timer = setTimeout(() => {
        timeoutIdsRef.current.delete(timer);
        resolve(animTokenRef.current === token && isMountedRef.current);
      }, ms);
      timeoutIdsRef.current.add(timer);
    });
  }, []);

  const clear = useCallback(() => {
    cancelActiveAnimation();
    if (isMountedRef.current) {
      setItems([]);
    }
  }, [cancelActiveAnimation]);

  const reset = useCallback(() => {
    cancelActiveAnimation();
    if (isMountedRef.current) {
      setItems([]);
    }
    defaultCursor?.reset();
  }, [cancelActiveAnimation, defaultCursor]);

  const setTextProgress = useCallback((id: string, progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, progress: clamped } : item))
    );
  }, []);

  const writeText = useCallback(
    async (
      optionsOrText: WriteTextOptions | string,
      argX?: number,
      argY?: number,
      argDurationMs?: number,
      argStyle?: BoardTextStyle,
      argCursor?: BoardCursorController
    ): Promise<void> => {
      cancelActiveAnimation();

      let options: WriteTextOptions;
      if (typeof optionsOrText === 'string') {
        options = {
          text: optionsOrText,
          x: argX ?? 100,
          y: argY ?? 100,
          durationMs: argDurationMs ?? 1200,
          style: argStyle,
          cursor: argCursor ?? defaultCursor,
        };
      } else {
        options = {
          ...optionsOrText,
          cursor: optionsOrText.cursor ?? defaultCursor,
        };
      }

      const {
        text,
        x,
        y,
        durationMs = 1200,
        style = {},
        cursor,
        travelDurationMs,
      } = options;

      const itemId = options.id ?? `text-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const fontSize = style.fontSize ?? 44;
      const align = style.align ?? 'left';
      const fontFamily = style.fontFamily ?? 'Inter, sans-serif';
      const letterSpacing = style.letterSpacing ?? 0;

      // 1. Calculate text bounds & initial writing head point
      const bounds = computeTextBounds(
        text,
        x,
        y,
        fontSize,
        align,
        fontFamily,
        letterSpacing
      );
      const startPoint = computeWritingHeadPosition(
        text,
        x,
        y,
        fontSize,
        align,
        fontFamily,
        letterSpacing,
        0
      );

      // 2. If cursor is provided, travel to the start point before writing begins
      if (cursor) {
        const curX = cursor.state.x;
        const curY = cursor.state.y;
        const dist = distance(curX, curY, startPoint.x, startPoint.y);

        if (!cursor.state.visible) {
          cursor.teleport(startPoint.x, startPoint.y);
          cursor.show();
        } else if (dist > 8) {
          const travelDuration =
            travelDurationMs ?? Math.min(700, Math.max(350, Math.round(dist * 0.75)));
          await cursor.moveTo(startPoint.x, startPoint.y, travelDuration);
        } else {
          cursor.teleport(startPoint.x, startPoint.y);
        }
      }

      // Check if unmounted or cancelled during travel
      if (!isMountedRef.current) return;

      // 3. Create initial item at progress 0
      const newItem: BoardTextItem = {
        id: itemId,
        text,
        x,
        y,
        fontSize,
        fontFamily,
        fontWeight: style.fontWeight ?? 600,
        color: style.color ?? 'rgba(240, 245, 255, 0.96)',
        align,
        letterSpacing,
        opacity: style.opacity ?? 1,
        progress: 0,
        visible: true,
      };

      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.id === itemId);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = newItem;
          return next;
        }
        return [...prev, newItem];
      });

      // Instant write case (duration <= 0)
      if (durationMs <= 0) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, progress: 1 } : i))
        );
        if (cursor) {
          const endPoint = computeWritingHeadPosition(
            text,
            x,
            y,
            fontSize,
            align,
            fontFamily,
            letterSpacing,
            1
          );
          cursor.teleport(endPoint.x, endPoint.y);
        }
        return;
      }

      // 4. Progressively reveal text and advance cursor synchronously
      setIsWriting(true);
      const token = ++animTokenRef.current;

      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        let startTimestamp: number | null = null;

        const tick = (timestamp: number) => {
          if (animTokenRef.current !== token || !isMountedRef.current) {
            resolve();
            return;
          }

          if (startTimestamp === null) {
            startTimestamp = timestamp;
          }

          const elapsed = timestamp - startTimestamp;
          const progress = Math.min(1, elapsed / durationMs);

          // Update text item progress
          setItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, progress } : i))
          );

          // Update cursor position to writing tip
          if (cursor) {
            const currentHead = computeWritingHeadPosition(
              text,
              x,
              y,
              fontSize,
              align,
              fontFamily,
              letterSpacing,
              progress
            );
            cursor.teleport(currentHead.x, currentHead.y);
          }

          if (progress < 1) {
            animFrameIdRef.current = requestAnimationFrame(tick);
          } else {
            animFrameIdRef.current = null;
            resolveRef.current = null;
            if (isMountedRef.current) {
              setIsWriting(false);
            }
            resolve();
          }
        };

        animFrameIdRef.current = requestAnimationFrame(tick);
      });
    },
    [cancelActiveAnimation, defaultCursor]
  );

  const teachText = useCallback(
    async (options: TeachTextOptions): Promise<void> => {
      cancelActiveAnimation();
      const token = ++animTokenRef.current;

      const {
        text,
        x,
        y,
        duration = options.durationMs ?? 1500,
        style = {},
        cursorMoveDuration,
        beforePause = 300,
        afterPause = 400,
        cursor = defaultCursor,
      } = options;

      const itemId = options.id ?? `teach-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const fontSize = style.fontSize ?? 40;
      const align = style.align ?? 'left';
      const fontFamily = style.fontFamily ?? 'Inter, sans-serif';
      const letterSpacing = style.letterSpacing ?? 0;

      // Calculate initial writing head position
      const startPoint = computeWritingHeadPosition(
        text,
        x,
        y,
        fontSize,
        align,
        fontFamily,
        letterSpacing,
        0
      );

      // Step 1: Cursor becomes visible
      if (cursor) {
        if (!cursor.state.visible) {
          cursor.show();
        }

        // Step 2: Cursor moves smoothly to the target
        const curX = cursor.state.x;
        const curY = cursor.state.y;
        const dist = distance(curX, curY, startPoint.x, startPoint.y);
        const moveDur =
          cursorMoveDuration ?? Math.min(800, Math.max(350, Math.round(dist * 0.75)));

        if (dist > 4) {
          await cursor.moveTo(startPoint.x, startPoint.y, moveDur);
        } else {
          cursor.teleport(startPoint.x, startPoint.y);
        }
      }

      if (animTokenRef.current !== token || !isMountedRef.current) return;

      // Step 3: Short pause before writing begins
      if (beforePause > 0) {
        const ok = await wait(beforePause, token);
        if (!ok) return;
      }

      // Step 4: Text progressively appears (progressive writing)
      const newItem: BoardTextItem = {
        id: itemId,
        text,
        x,
        y,
        fontSize,
        fontFamily,
        fontWeight: style.fontWeight ?? 600,
        color: style.color ?? 'rgba(240, 245, 255, 0.96)',
        align,
        letterSpacing,
        opacity: style.opacity ?? 1,
        progress: 0,
        visible: true,
      };

      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.id === itemId);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = newItem;
          return next;
        }
        return [...prev, newItem];
      });

      if (duration <= 0) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, progress: 1 } : i))
        );
        if (cursor) {
          const endPoint = computeWritingHeadPosition(
            text,
            x,
            y,
            fontSize,
            align,
            fontFamily,
            letterSpacing,
            1
          );
          cursor.teleport(endPoint.x, endPoint.y);
        }
      } else {
        setIsWriting(true);
        await new Promise<void>((resolve) => {
          resolveRef.current = resolve;
          let startTimestamp: number | null = null;

          const tick = (timestamp: number) => {
            if (animTokenRef.current !== token || !isMountedRef.current) {
              resolve();
              return;
            }

            if (startTimestamp === null) {
              startTimestamp = timestamp;
            }

            const elapsed = timestamp - startTimestamp;
            const progress = Math.min(1, elapsed / duration);

            setItems((prev) =>
              prev.map((i) => (i.id === itemId ? { ...i, progress } : i))
            );

            if (cursor) {
              const currentHead = computeWritingHeadPosition(
                text,
                x,
                y,
                fontSize,
                align,
                fontFamily,
                letterSpacing,
                progress
              );
              cursor.teleport(currentHead.x, currentHead.y);
            }

            if (progress < 1) {
              animFrameIdRef.current = requestAnimationFrame(tick);
            } else {
              animFrameIdRef.current = null;
              resolveRef.current = null;
              if (isMountedRef.current) {
                setIsWriting(false);
              }
              resolve();
            }
          };

          animFrameIdRef.current = requestAnimationFrame(tick);
        });
      }

      if (animTokenRef.current !== token || !isMountedRef.current) return;

      // Step 5: Text finishes, cursor remains near written content. Short pause afterward.
      if (afterPause > 0) {
        const ok = await wait(afterPause, token);
        if (!ok) return;
      }
    },
    [cancelActiveAnimation, defaultCursor, wait]
  );

  return {
    items,
    writeText,
    teachText,
    setTextProgress,
    clear,
    reset,
    isWriting,
  };
}

export default useBoardWriter;

/**
 * useBoardDrawing.ts
 *
 * PHASE 5: Board Drawing State Machine & Cursor Synchronization Hook.
 *
 * Responsibilities:
 * - Manages list of DrawingItems rendered on the Teaching Board SVG layer (Layer 2).
 * - Provides drawLine / drawArrow / drawCircle / drawRect / drawRectangle actions.
 * - Provides coordinated teacher actions:
 *     teachDrawLine / teachDrawArrow / teachDrawCircle / teachDrawRectangle.
 * - Sequence for teacher actions:
 *     1. Register item at progress=0.
 *     2. Cursor visible.
 *     3. Cursor moves smoothly to start position.
 *     4. Short pause (beforePause, default 300ms for teach actions).
 *     5. Drawing begins — progressive reveal of the shape.
 *     6. Cursor follows drawing endpoint continuously without lag.
 *     7. Drawing completes.
 *     8. Cursor remains at final endpoint.
 *     9. Short pause (afterPause, default 400ms for teach actions).
 * - Supports cancellation, clear(), and reset().
 * - Deterministic: logical board coordinates (1280 × 720).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { DrawingItem, DrawingItemStyle } from '../components/teaching/BoardDrawingLayer';
import type { BoardCursorController, BoardCursorAPI } from './useBoardCursor';
import {
  lineLength,
  pointOnLine,
  circleCircumference,
  pointOnCircle,
  pointOnRect,
  DEFAULT_ARROW_SIZE,
} from '../features/theory/drawingMotion';

// ── Public types ───────────────────────────────────────────────────────────

export interface BaseDrawOptions {
  id?: string;
  duration?: number;
  durationMs?: number;
  cursorMoveDuration?: number;
  beforePause?: number;
  afterPause?: number;
  style?: DrawingItemStyle;
  cursor?: BoardCursorController | BoardCursorAPI;
}

export interface DrawLineOptions extends BaseDrawOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DrawArrowOptions extends BaseDrawOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  arrowSize?: number;
}

export interface DrawCircleOptions extends BaseDrawOptions {
  cx: number;
  cy: number;
  r: number;
  filled?: boolean;
}

export interface DrawRectOptions extends BaseDrawOptions {
  x: number;
  y: number;
  w?: number;
  h?: number;
  width?: number;
  height?: number;
  filled?: boolean;
}

export interface BoardDrawingOptions {
  cursor?: BoardCursorController | BoardCursorAPI;
}

export interface BoardDrawingController {
  items: DrawingItem[];
  drawLine: {
    (opts: DrawLineOptions): Promise<void>;
    (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      duration?: number,
      style?: DrawingItemStyle,
      cursor?: BoardCursorController | BoardCursorAPI
    ): Promise<void>;
  };
  drawArrow: {
    (opts: DrawArrowOptions): Promise<void>;
    (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      duration?: number,
      arrowSize?: number,
      style?: DrawingItemStyle,
      cursor?: BoardCursorController | BoardCursorAPI
    ): Promise<void>;
  };
  drawCircle: {
    (opts: DrawCircleOptions): Promise<void>;
    (
      cx: number,
      cy: number,
      r: number,
      duration?: number,
      filled?: boolean,
      style?: DrawingItemStyle,
      cursor?: BoardCursorController | BoardCursorAPI
    ): Promise<void>;
  };
  drawRect: {
    (opts: DrawRectOptions): Promise<void>;
    (
      x: number,
      y: number,
      w: number,
      h: number,
      duration?: number,
      filled?: boolean,
      style?: DrawingItemStyle,
      cursor?: BoardCursorController | BoardCursorAPI
    ): Promise<void>;
  };
  drawRectangle: {
    (opts: DrawRectOptions): Promise<void>;
    (
      x: number,
      y: number,
      w: number,
      h: number,
      duration?: number,
      filled?: boolean,
      style?: DrawingItemStyle,
      cursor?: BoardCursorController | BoardCursorAPI
    ): Promise<void>;
  };
  teachDrawLine: (opts: DrawLineOptions) => Promise<void>;
  teachDrawArrow: (opts: DrawArrowOptions) => Promise<void>;
  teachDrawCircle: (opts: DrawCircleOptions) => Promise<void>;
  teachDrawRectangle: (opts: DrawRectOptions) => Promise<void>;
  clear: () => void;
  reset: () => void;
  isDrawing: boolean;
}

// ── Internal helpers ────────────────────────────────────────────────────────

function makeId(): string {
  return `drawing-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

const DEFAULT_DURATION_MS = 1000;

// ── Hook ───────────────────────────────────────────────────────────────────

export function useBoardDrawing(drawingOpts?: BoardDrawingOptions): BoardDrawingController {
  const defaultCursor = drawingOpts?.cursor;
  const [items, setItems] = useState<DrawingItem[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const rafRef = useRef<number | null>(null);
  const tokenRef = useRef<number>(0);
  const resolveRef = useRef<(() => void) | null>(null);
  const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      timeoutIdsRef.current.forEach((t) => clearTimeout(t));
      timeoutIdsRef.current.clear();
      resolveRef.current?.();
      resolveRef.current = null;
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
    const res = resolveRef.current;
    resolveRef.current = null;
    res?.();
    if (isMountedRef.current) setIsDrawing(false);
  }, []);

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

  const clear = useCallback(() => {
    cancelActive();
    if (isMountedRef.current) setItems([]);
  }, [cancelActive]);

  const reset = useCallback(() => {
    cancelActive();
    if (isMountedRef.current) setItems([]);
    defaultCursor?.reset();
  }, [cancelActive, defaultCursor]);

  // ── Core animation loop ──────────────────────────────────────────────────

  function animateProgress(
    durationMs: number,
    token: number,
    onProgress: (t: number) => void
  ): Promise<void> {
    if (!isMountedRef.current) return Promise.resolve();
    setIsDrawing(true);

    return new Promise<void>((resolve) => {
      resolveRef.current = resolve;
      let startTs: number | null = null;

      const tick = (ts: number) => {
        if (tokenRef.current !== token || !isMountedRef.current) {
          resolve();
          return;
        }
        if (startTs === null) startTs = ts;

        const elapsed = ts - startTs;
        const t = Math.min(1, elapsed / durationMs);

        onProgress(t);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          resolveRef.current = null;
          if (isMountedRef.current) setIsDrawing(false);
          resolve();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    });
  }

  // ── 1. LINE ──────────────────────────────────────────────────────────────

  const drawLine = useCallback(
    async (
      optsOrX1: DrawLineOptions | number,
      argY1?: number,
      argX2?: number,
      argY2?: number,
      argDuration?: number,
      argStyle?: DrawingItemStyle,
      argCursor?: BoardCursorController | BoardCursorAPI
    ): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;

      let opts: DrawLineOptions;
      if (typeof optsOrX1 === 'number') {
        opts = {
          x1: optsOrX1,
          y1: argY1 ?? 0,
          x2: argX2 ?? 0,
          y2: argY2 ?? 0,
          duration: argDuration,
          style: argStyle,
          cursor: argCursor,
        };
      } else {
        opts = optsOrX1;
      }

      const {
        x1,
        y1,
        x2,
        y2,
        duration = opts.durationMs ?? DEFAULT_DURATION_MS,
        cursorMoveDuration,
        beforePause = 0,
        afterPause = 0,
        style,
        cursor = defaultCursor,
      } = opts;
      const id = opts.id ?? makeId();

      // Register item immediately at progress 0
      const newItem: DrawingItem = { kind: 'line', id, x1, y1, x2, y2, progress: 0, style };
      setItems((prev) => upsert(prev, newItem));

      // 1. Move cursor to start
      if (cursor) {
        if (!cursor.state.visible) {
          cursor.teleport(x1, y1);
          cursor.show();
        } else {
          const dist = lineLength(cursor.state.x, cursor.state.y, x1, y1);
          const travelMs =
            cursorMoveDuration ?? Math.min(700, Math.max(300, Math.round(dist * 0.7)));
          if (dist > 6) {
            await cursor.moveTo(x1, y1, travelMs);
          } else {
            cursor.teleport(x1, y1);
          }
        }
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      // 2. Short pause before drawing
      if (beforePause > 0) {
        const ok = await wait(beforePause, token);
        if (!ok) return;
      }

      if (duration <= 0) {
        setItems((prev) => updateProgress(prev, id, 1));
        if (cursor) cursor.teleport(x2, y2);
      } else {
        await animateProgress(duration, token, (t) => {
          setItems((prev) => updateProgress(prev, id, t));
          if (cursor) {
            const pos = pointOnLine(x1, y1, x2, y2, t);
            cursor.teleport(pos.x, pos.y);
          }
        });
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      // 3. Short pause after drawing
      if (afterPause > 0) {
        const ok = await wait(afterPause, token);
        if (!ok) return;
      }
    },
    [cancelActive, defaultCursor, wait]
  ) as BoardDrawingController['drawLine'];

  // ── 2. ARROW ─────────────────────────────────────────────────────────────

  const drawArrow = useCallback(
    async (
      optsOrX1: DrawArrowOptions | number,
      argY1?: number,
      argX2?: number,
      argY2?: number,
      argDuration?: number,
      argArrowSize?: number,
      argStyle?: DrawingItemStyle,
      argCursor?: BoardCursorController | BoardCursorAPI
    ): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;

      let opts: DrawArrowOptions;
      if (typeof optsOrX1 === 'number') {
        opts = {
          x1: optsOrX1,
          y1: argY1 ?? 0,
          x2: argX2 ?? 0,
          y2: argY2 ?? 0,
          duration: argDuration,
          arrowSize: argArrowSize,
          style: argStyle,
          cursor: argCursor,
        };
      } else {
        opts = optsOrX1;
      }

      const {
        x1,
        y1,
        x2,
        y2,
        duration = opts.durationMs ?? DEFAULT_DURATION_MS,
        arrowSize = DEFAULT_ARROW_SIZE,
        cursorMoveDuration,
        beforePause = 0,
        afterPause = 0,
        style,
        cursor = defaultCursor,
      } = opts;
      const id = opts.id ?? makeId();

      const newItem: DrawingItem = {
        kind: 'arrow',
        id,
        x1,
        y1,
        x2,
        y2,
        progress: 0,
        arrowSize,
        style,
      };
      setItems((prev) => upsert(prev, newItem));

      // 1. Move cursor to start
      if (cursor) {
        if (!cursor.state.visible) {
          cursor.teleport(x1, y1);
          cursor.show();
        } else {
          const dist = lineLength(cursor.state.x, cursor.state.y, x1, y1);
          const travelMs =
            cursorMoveDuration ?? Math.min(700, Math.max(300, Math.round(dist * 0.7)));
          if (dist > 6) {
            await cursor.moveTo(x1, y1, travelMs);
          } else {
            cursor.teleport(x1, y1);
          }
        }
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      // 2. Short pause before drawing
      if (beforePause > 0) {
        const ok = await wait(beforePause, token);
        if (!ok) return;
      }

      if (duration <= 0) {
        setItems((prev) => updateProgress(prev, id, 1));
        if (cursor) cursor.teleport(x2, y2);
      } else {
        // Cursor tracks from (x1, y1) smoothly to the exact arrow tip (x2, y2)
        await animateProgress(duration, token, (t) => {
          setItems((prev) => updateProgress(prev, id, t));
          if (cursor) {
            const pos = pointOnLine(x1, y1, x2, y2, t);
            cursor.teleport(pos.x, pos.y);
          }
        });
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      // 3. Short pause after drawing
      if (afterPause > 0) {
        const ok = await wait(afterPause, token);
        if (!ok) return;
      }
    },
    [cancelActive, defaultCursor, wait]
  ) as BoardDrawingController['drawArrow'];

  // ── 3. CIRCLE ────────────────────────────────────────────────────────────

  const drawCircle = useCallback(
    async (
      optsOrCx: DrawCircleOptions | number,
      argCy?: number,
      argR?: number,
      argDuration?: number,
      argFilled?: boolean,
      argStyle?: DrawingItemStyle,
      argCursor?: BoardCursorController | BoardCursorAPI
    ): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;

      let opts: DrawCircleOptions;
      if (typeof optsOrCx === 'number') {
        opts = {
          cx: optsOrCx,
          cy: argCy ?? 0,
          r: argR ?? 0,
          duration: argDuration,
          filled: argFilled,
          style: argStyle,
          cursor: argCursor,
        };
      } else {
        opts = optsOrCx;
      }

      const {
        cx,
        cy,
        r,
        duration = opts.durationMs ?? DEFAULT_DURATION_MS,
        filled = false,
        cursorMoveDuration,
        beforePause = 0,
        afterPause = 0,
        style,
        cursor = defaultCursor,
      } = opts;
      const id = opts.id ?? makeId();

      const newItem: DrawingItem = {
        kind: 'circle',
        id,
        cx,
        cy,
        r,
        progress: 0,
        filled,
        style,
      };
      setItems((prev) => upsert(prev, newItem));

      // Top of circle (start of arc at 12 o'clock)
      const startX = cx;
      const startY = cy - r;

      if (cursor) {
        if (!cursor.state.visible) {
          cursor.teleport(startX, startY);
          cursor.show();
        } else {
          const dist = lineLength(cursor.state.x, cursor.state.y, startX, startY);
          const travelMs =
            cursorMoveDuration ?? Math.min(700, Math.max(300, Math.round(dist * 0.7)));
          if (dist > 6) {
            await cursor.moveTo(startX, startY, travelMs);
          } else {
            cursor.teleport(startX, startY);
          }
        }
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      if (beforePause > 0) {
        const ok = await wait(beforePause, token);
        if (!ok) return;
      }

      if (duration <= 0) {
        setItems((prev) => updateProgress(prev, id, 1));
        if (cursor) cursor.teleport(startX, startY);
      } else {
        await animateProgress(duration, token, (t) => {
          setItems((prev) => updateProgress(prev, id, t));
          if (cursor) {
            const pos = pointOnCircle(cx, cy, r, t);
            cursor.teleport(pos.x, pos.y);
          }
        });
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      if (afterPause > 0) {
        const ok = await wait(afterPause, token);
        if (!ok) return;
      }
    },
    [cancelActive, defaultCursor, wait]
  ) as BoardDrawingController['drawCircle'];

  // ── 4. RECTANGLE ─────────────────────────────────────────────────────────

  const drawRect = useCallback(
    async (
      optsOrX: DrawRectOptions | number,
      argY?: number,
      argW?: number,
      argH?: number,
      argDuration?: number,
      argFilled?: boolean,
      argStyle?: DrawingItemStyle,
      argCursor?: BoardCursorController | BoardCursorAPI
    ): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;

      let opts: DrawRectOptions;
      if (typeof optsOrX === 'number') {
        opts = {
          x: optsOrX,
          y: argY ?? 0,
          w: argW ?? 0,
          h: argH ?? 0,
          duration: argDuration,
          filled: argFilled,
          style: argStyle,
          cursor: argCursor,
        };
      } else {
        opts = optsOrX;
      }

      const {
        x,
        y,
        w = opts.width ?? 0,
        h = opts.height ?? 0,
        duration = opts.durationMs ?? DEFAULT_DURATION_MS,
        filled = false,
        cursorMoveDuration,
        beforePause = 0,
        afterPause = 0,
        style,
        cursor = defaultCursor,
      } = opts;
      const id = opts.id ?? makeId();

      const newItem: DrawingItem = {
        kind: 'rect',
        id,
        x,
        y,
        w,
        h,
        progress: 0,
        filled,
        style,
      };
      setItems((prev) => upsert(prev, newItem));

      // Top-left corner (start of perimeter)
      if (cursor) {
        if (!cursor.state.visible) {
          cursor.teleport(x, y);
          cursor.show();
        } else {
          const dist = lineLength(cursor.state.x, cursor.state.y, x, y);
          const travelMs =
            cursorMoveDuration ?? Math.min(700, Math.max(300, Math.round(dist * 0.7)));
          if (dist > 6) {
            await cursor.moveTo(x, y, travelMs);
          } else {
            cursor.teleport(x, y);
          }
        }
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      if (beforePause > 0) {
        const ok = await wait(beforePause, token);
        if (!ok) return;
      }

      if (duration <= 0) {
        setItems((prev) => updateProgress(prev, id, 1));
        if (cursor) cursor.teleport(x, y);
      } else {
        await animateProgress(duration, token, (t) => {
          setItems((prev) => updateProgress(prev, id, t));
          if (cursor) {
            const pos = pointOnRect(x, y, w, h, t);
            cursor.teleport(pos.x, pos.y);
          }
        });
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      if (afterPause > 0) {
        const ok = await wait(afterPause, token);
        if (!ok) return;
      }
    },
    [cancelActive, defaultCursor, wait]
  ) as BoardDrawingController['drawRect'];

  // ── Coordinated Teacher Actions ──────────────────────────────────────────

  const teachDrawLine = useCallback(
    (opts: DrawLineOptions) => {
      return drawLine({
        ...opts,
        beforePause: opts.beforePause ?? 300,
        afterPause: opts.afterPause ?? 400,
      });
    },
    [drawLine]
  );

  const teachDrawArrow = useCallback(
    (opts: DrawArrowOptions) => {
      return drawArrow({
        ...opts,
        beforePause: opts.beforePause ?? 300,
        afterPause: opts.afterPause ?? 400,
      });
    },
    [drawArrow]
  );

  const teachDrawCircle = useCallback(
    (opts: DrawCircleOptions) => {
      return drawCircle({
        ...opts,
        beforePause: opts.beforePause ?? 300,
        afterPause: opts.afterPause ?? 400,
      });
    },
    [drawCircle]
  );

  const teachDrawRectangle = useCallback(
    (opts: DrawRectOptions) => {
      return drawRect({
        ...opts,
        beforePause: opts.beforePause ?? 300,
        afterPause: opts.afterPause ?? 400,
      });
    },
    [drawRect]
  );

  return {
    items,
    drawLine,
    drawArrow,
    drawCircle,
    drawRect,
    drawRectangle: drawRect,
    teachDrawLine,
    teachDrawArrow,
    teachDrawCircle,
    teachDrawRectangle,
    clear,
    reset,
    isDrawing,
  };
}

// ── Pure state helpers ──────────────────────────────────────────────────────

function upsert(items: DrawingItem[], newItem: DrawingItem): DrawingItem[] {
  const idx = items.findIndex((i) => i.id === newItem.id);
  if (idx >= 0) {
    const next = [...items];
    next[idx] = newItem;
    return next;
  }
  return [...items, newItem];
}

function updateProgress(items: DrawingItem[], id: string, progress: number): DrawingItem[] {
  return items.map((i) => (i.id === id ? { ...i, progress } : i));
}

export default useBoardDrawing;

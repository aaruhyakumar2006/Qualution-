/**
 * useBoardEmphasis.ts
 *
 * PHASE 6: Board Teacher Emphasis State Machine & Coordination Hook.
 *
 * Responsibilities:
 * - Manages list of EmphasisItems rendered on the Teaching Board SVG layer (Layer 2).
 * - Provides subtle, calm, academic emphasis actions:
 *     - teachPoint(x, y, durationMs) / point(x, y, durationMs)
 *     - teachHighlight(opts) / highlight(opts)
 *     - teachUnderline(opts) / underline(opts)
 *     - teachCircleAroundTarget(opts) / circleAroundTarget(opts)
 * - Layering:
 *     - Highlights and underlines render on Layer 2 (SVG) below Layer 3 (DOM Typography),
 *       guaranteeing 100% text legibility without obscuring mathematical/textual notation.
 * - Supports cancellation, clear(), and reset().
 * - Uses standard logical board coordinate units (1280 × 720).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { BoardCursorController, BoardCursorAPI } from './useBoardCursor';
import type { BoardDrawingController } from './useBoardDrawing';
import type { DrawingItemStyle } from '../components/teaching/BoardDrawingLayer';
import {
  type TargetRegion,
  type TargetInput,
  normalizeTargetRegion,
} from '../features/theory/teachingActions';
import { lineLength, pointOnLine } from '../features/theory/drawingMotion';

// ── Public Types ───────────────────────────────────────────────────────────

export interface HighlightEmphasisItem {
  kind: 'highlight';
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  progress: number;
  persistent?: boolean;
}

export interface UnderlineEmphasisItem {
  kind: 'underline';
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  style?: DrawingItemStyle;
}

export type EmphasisItem = HighlightEmphasisItem | UnderlineEmphasisItem;

export interface BaseEmphasisOptions {
  cursorMoveDuration?: number;
  beforePause?: number;
  afterPause?: number;
  cursor?: BoardCursorController | BoardCursorAPI;
}

export interface PointOptions extends BaseEmphasisOptions {
  x?: number;
  y?: number;
  target?: TargetInput;
  duration?: number;
  durationMs?: number;
}

export interface HighlightOptions extends BaseEmphasisOptions {
  id?: string;
  target: TargetInput;
  duration?: number;
  durationMs?: number;
  color?: string;
  persistent?: boolean;
}

export interface UnderlineOptions extends BaseEmphasisOptions {
  id?: string;
  target: TargetInput;
  duration?: number;
  durationMs?: number;
  style?: DrawingItemStyle;
  offsetY?: number;
}

export interface CircleTargetOptions extends BaseEmphasisOptions {
  id?: string;
  target: TargetInput;
  duration?: number;
  durationMs?: number;
  style?: DrawingItemStyle;
  padding?: number;
}

export interface BoardEmphasisOptions {
  cursor?: BoardCursorController | BoardCursorAPI;
  drawing?: BoardDrawingController;
}

export interface BoardEmphasisController {
  items: EmphasisItem[];
  teachPoint: (optsOrX: PointOptions | number, y?: number, durationMs?: number) => Promise<void>;
  point: (optsOrX: PointOptions | number, y?: number, durationMs?: number) => Promise<void>;
  teachHighlight: (opts: HighlightOptions) => Promise<void>;
  highlight: (opts: HighlightOptions) => Promise<void>;
  teachUnderline: (opts: UnderlineOptions) => Promise<void>;
  underline: (opts: UnderlineOptions) => Promise<void>;
  teachCircleAroundTarget: (opts: CircleTargetOptions) => Promise<void>;
  circleAroundTarget: (opts: CircleTargetOptions) => Promise<void>;
  clear: () => void;
  reset: () => void;
  isEmphasizing: boolean;
}

// ── Default Styles ──────────────────────────────────────────────────────────

export const DEFAULT_HIGHLIGHT_COLOR = 'rgba(250, 204, 21, 0.22)';
export const DEFAULT_UNDERLINE_COLOR = 'rgba(56, 189, 248, 0.85)';
export const DEFAULT_UNDERLINE_STROKE = 2.5;

function makeId(prefix = 'emphasis'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useBoardEmphasis(emphasisOpts?: BoardEmphasisOptions): BoardEmphasisController {
  const defaultCursor = emphasisOpts?.cursor;
  const defaultDrawing = emphasisOpts?.drawing;

  const [items, setItems] = useState<EmphasisItem[]>([]);
  const [isEmphasizing, setIsEmphasizing] = useState(false);

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
    if (isMountedRef.current) setIsEmphasizing(false);
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

  function animateProgress(
    durationMs: number,
    token: number,
    onProgress: (t: number) => void
  ): Promise<void> {
    if (!isMountedRef.current) return Promise.resolve();
    setIsEmphasizing(true);

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
        const t = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);

        onProgress(t);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          resolveRef.current = null;
          if (isMountedRef.current) setIsEmphasizing(false);
          resolve();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    });
  }

  // ── 1. POINT ─────────────────────────────────────────────────────────────

  const point = useCallback(
    async (
      optsOrX: PointOptions | number,
      argY?: number,
      argDuration?: number
    ): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;

      let opts: PointOptions;
      if (typeof optsOrX === 'number') {
        opts = {
          x: optsOrX,
          y: argY ?? 0,
          durationMs: argDuration ?? 800,
        };
      } else {
        opts = optsOrX;
      }

      let targetX = opts.x ?? 0;
      let targetY = opts.y ?? 0;
      if (opts.target) {
        const reg = normalizeTargetRegion(opts.target);
        targetX = reg.x + reg.width / 2;
        targetY = reg.y;
      }

      const duration = opts.durationMs ?? opts.duration ?? 800;
      const cursor = opts.cursor ?? defaultCursor;
      const {
        cursorMoveDuration,
        beforePause = 0,
        afterPause = 0,
      } = opts;

      // 1. Move cursor to target
      if (cursor) {
        if (!cursor.state.visible) {
          cursor.teleport(targetX, targetY);
          cursor.show();
        } else {
          const dist = lineLength(cursor.state.x, cursor.state.y, targetX, targetY);
          const travelMs =
            cursorMoveDuration ?? Math.min(700, Math.max(300, Math.round(dist * 0.7)));
          if (dist > 6) {
            await cursor.moveTo(targetX, targetY, travelMs);
          } else {
            cursor.teleport(targetX, targetY);
          }
        }
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      // 2. Pre-pause
      if (beforePause > 0) {
        const ok = await wait(beforePause, token);
        if (!ok) return;
      }

      // 3. Point: Cursor holds intentionally at target for duration
      if (duration > 0) {
        setIsEmphasizing(true);
        const ok = await wait(duration, token);
        if (isMountedRef.current) setIsEmphasizing(false);
        if (!ok) return;
      }

      // 4. Post-pause
      if (afterPause > 0) {
        const ok = await wait(afterPause, token);
        if (!ok) return;
      }
    },
    [cancelActive, defaultCursor, wait]
  );

  const teachPoint = useCallback(
    (optsOrX: PointOptions | number, y?: number, durationMs?: number) => {
      if (typeof optsOrX === 'number') {
        return point({
          x: optsOrX,
          y: y ?? 0,
          durationMs: durationMs ?? 800,
          beforePause: 200,
          afterPause: 300,
        });
      }
      return point({
        ...optsOrX,
        beforePause: optsOrX.beforePause ?? 200,
        afterPause: optsOrX.afterPause ?? 300,
      });
    },
    [point]
  );

  // ── 2. HIGHLIGHT ─────────────────────────────────────────────────────────

  const highlight = useCallback(
    async (opts: HighlightOptions): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;

      const reg = normalizeTargetRegion(opts.target);
      const duration = opts.durationMs ?? opts.duration ?? 600;
      const color = opts.color ?? DEFAULT_HIGHLIGHT_COLOR;
      const persistent = opts.persistent ?? true;
      const id = opts.id ?? makeId('highlight');
      const cursor = opts.cursor ?? defaultCursor;
      const {
        cursorMoveDuration,
        beforePause = 0,
        afterPause = 0,
      } = opts;

      // Register initial highlight item with progress 0
      const newItem: HighlightEmphasisItem = {
        kind: 'highlight',
        id,
        x: reg.x,
        y: reg.y,
        width: reg.width,
        height: reg.height,
        color,
        progress: 0,
        persistent,
      };
      setItems((prev) => upsertEmphasis(prev, newItem));

      // 1. Move cursor towards target area
      const targetCenterX = reg.x + reg.width / 2;
      const targetTopY = reg.y;
      if (cursor) {
        if (!cursor.state.visible) {
          cursor.teleport(targetCenterX, targetTopY);
          cursor.show();
        } else {
          const dist = lineLength(cursor.state.x, cursor.state.y, targetCenterX, targetTopY);
          const travelMs =
            cursorMoveDuration ?? Math.min(700, Math.max(300, Math.round(dist * 0.7)));
          if (dist > 6) {
            await cursor.moveTo(targetCenterX, targetTopY, travelMs);
          } else {
            cursor.teleport(targetCenterX, targetTopY);
          }
        }
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      // 2. Pre-pause
      if (beforePause > 0) {
        const ok = await wait(beforePause, token);
        if (!ok) return;
      }

      // 3. Reveal highlight smoothly (fades in via progress 0 → 1)
      if (duration <= 0) {
        setItems((prev) => updateEmphasisProgress(prev, id, 1));
      } else {
        await animateProgress(duration, token, (t) => {
          setItems((prev) => updateEmphasisProgress(prev, id, t));
        });
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      // If not persistent, fade out or remove
      if (!persistent) {
        // Subtle hold before fade out
        await wait(400, token);
        if (tokenRef.current !== token || !isMountedRef.current) return;

        await animateProgress(duration, token, (t) => {
          setItems((prev) => updateEmphasisProgress(prev, id, 1 - t));
        });
        if (tokenRef.current !== token || !isMountedRef.current) return;
        setItems((prev) => prev.filter((i) => i.id !== id));
      }

      // 4. Post-pause
      if (afterPause > 0) {
        const ok = await wait(afterPause, token);
        if (!ok) return;
      }
    },
    [cancelActive, defaultCursor, wait]
  );

  const teachHighlight = useCallback(
    (opts: HighlightOptions) => {
      return highlight({
        ...opts,
        beforePause: opts.beforePause ?? 200,
        afterPause: opts.afterPause ?? 300,
      });
    },
    [highlight]
  );

  // ── 3. UNDERLINE ─────────────────────────────────────────────────────────

  const underline = useCallback(
    async (opts: UnderlineOptions): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;

      const reg = normalizeTargetRegion(opts.target);
      const offsetY = opts.offsetY ?? 4;
      const startX = reg.x;
      const startY = reg.y + reg.height + offsetY;
      const endX = reg.x + reg.width;
      const endY = startY;

      const duration = opts.durationMs ?? opts.duration ?? 800;
      const id = opts.id ?? makeId('underline');
      const cursor = opts.cursor ?? defaultCursor;
      const style: DrawingItemStyle = {
        color: DEFAULT_UNDERLINE_COLOR,
        strokeWidth: DEFAULT_UNDERLINE_STROKE,
        ...opts.style,
      };
      const {
        cursorMoveDuration,
        beforePause = 0,
        afterPause = 0,
      } = opts;

      // Register initial underline item with progress 0
      const newItem: UnderlineEmphasisItem = {
        kind: 'underline',
        id,
        x1: startX,
        y1: startY,
        x2: endX,
        y2: endY,
        progress: 0,
        style,
      };
      setItems((prev) => upsertEmphasis(prev, newItem));

      // 1. Move cursor to underline start
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

      // 2. Pre-pause
      if (beforePause > 0) {
        const ok = await wait(beforePause, token);
        if (!ok) return;
      }

      // 3. Progressive underline draw with cursor tracking
      if (duration <= 0) {
        setItems((prev) => updateEmphasisProgress(prev, id, 1));
        if (cursor) cursor.teleport(endX, endY);
      } else {
        await animateProgress(duration, token, (t) => {
          setItems((prev) => updateEmphasisProgress(prev, id, t));
          if (cursor) {
            const pos = pointOnLine(startX, startY, endX, endY, t);
            cursor.teleport(pos.x, pos.y);
          }
        });
      }
      if (tokenRef.current !== token || !isMountedRef.current) return;

      // 4. Post-pause
      if (afterPause > 0) {
        const ok = await wait(afterPause, token);
        if (!ok) return;
      }
    },
    [cancelActive, defaultCursor, wait]
  );

  const teachUnderline = useCallback(
    (opts: UnderlineOptions) => {
      return underline({
        ...opts,
        beforePause: opts.beforePause ?? 200,
        afterPause: opts.afterPause ?? 300,
      });
    },
    [underline]
  );

  // ── 4. CIRCLE AROUND TARGET ──────────────────────────────────────────────

  const circleAroundTarget = useCallback(
    async (opts: CircleTargetOptions): Promise<void> => {
      const reg = normalizeTargetRegion(opts.target);
      const padding = opts.padding ?? 12;
      const cx = reg.x + reg.width / 2;
      const cy = reg.y + reg.height / 2;
      const r = Math.max(reg.width, reg.height) / 2 + padding;

      const duration = opts.durationMs ?? opts.duration ?? 1200;
      const id = opts.id ?? makeId('circle-target');
      const drawing = defaultDrawing;

      if (drawing) {
        // Reuse Phase 5 progressive circle drawing
        await drawing.drawCircle({
          id,
          cx,
          cy,
          r,
          duration,
          style: {
            color: 'rgba(56, 189, 248, 0.85)',
            strokeWidth: 2,
            ...opts.style,
          },
          cursorMoveDuration: opts.cursorMoveDuration,
          beforePause: opts.beforePause,
          afterPause: opts.afterPause,
          cursor: opts.cursor ?? defaultCursor,
        });
      }
    },
    [defaultCursor, defaultDrawing]
  );

  const teachCircleAroundTarget = useCallback(
    (opts: CircleTargetOptions) => {
      return circleAroundTarget({
        ...opts,
        beforePause: opts.beforePause ?? 200,
        afterPause: opts.afterPause ?? 300,
      });
    },
    [circleAroundTarget]
  );

  return {
    items,
    teachPoint,
    point,
    teachHighlight,
    highlight,
    teachUnderline,
    underline,
    teachCircleAroundTarget,
    circleAroundTarget,
    clear,
    reset,
    isEmphasizing,
  };
}

// ── Pure helpers ───────────────────────────────────────────────────────────

function upsertEmphasis(items: EmphasisItem[], newItem: EmphasisItem): EmphasisItem[] {
  const idx = items.findIndex((i) => i.id === newItem.id);
  if (idx >= 0) {
    const next = [...items];
    next[idx] = newItem;
    return next;
  }
  return [...items, newItem];
}

function updateEmphasisProgress(
  items: EmphasisItem[],
  id: string,
  progress: number
): EmphasisItem[] {
  return items.map((i) => (i.id === id ? ({ ...i, progress } as EmphasisItem) : i));
}

export default useBoardEmphasis;

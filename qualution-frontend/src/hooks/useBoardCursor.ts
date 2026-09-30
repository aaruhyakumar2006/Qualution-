/**
 * useBoardCursor.ts
 *
 * PHASE 2: Teacher Cursor State Machine for the QUALUTION Teaching Board.
 *
 * Responsibilities:
 * - Owns the cursor's logical position (x, y in board coordinates).
 * - Animates movements via requestAnimationFrame using Bézier arc easing.
 * - Exposes a stable imperative API: moveTo / show / hide / reset.
 * - Ensures no teleportation unless explicitly requested via `teleport`.
 * - Works entirely in the board's logical coordinate space (default 1280×720).
 * - Remains resize-safe: the cursor layer uses percentage positioning,
 *   so the visual position is always correct regardless of viewport scale.
 *
 * Usage:
 *   const cursor = useBoardCursor({ initialX: 100, initialY: 80 });
 *   cursor.moveTo(640, 360, 800);   // smooth 800 ms move
 *   cursor.show();
 *   cursor.hide();
 *   cursor.reset();
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  easeInOutCubic,
  easeOutCubic,
  arcControlPoint,
  quadraticBezier,
  distance,
} from '../features/theory/cursorMotion';
import {
  DEFAULT_LOGICAL_WIDTH,
  DEFAULT_LOGICAL_HEIGHT,
  clampLogical,
  type Point2D,
} from '../features/theory/boardCoordinates';

// ── Public API types ───────────────────────────────────────────────────────

export interface BoardCursorState {
  /** Current logical X position. */
  x: number;
  /** Current logical Y position. */
  y: number;
  /** Whether the cursor is visible on the board. */
  visible: boolean;
  /** True while a moveTo animation is in progress. */
  moving: boolean;
}

export type CursorEasing = 'inOutCubic' | 'outCubic';

export interface MoveCursorOptions {
  /**
   * Duration of the movement in milliseconds.
   * Default: 900 ms — deliberate, academic pacing.
   */
  durationMs?: number;
  /**
   * Easing curve. Default: 'inOutCubic' (teacher-style: accelerate then decelerate).
   */
  easing?: CursorEasing;
  /**
   * Bow factor for the arc (0 = straight line, 0.18 = gentle human arc).
   * Default: 0.18
   */
  bowFactor?: number;
}

export type BoardCursorController = BoardCursorAPI;

export interface BoardCursorAPI {
  /** Current rendered state — bind directly to the BoardCursor component. */
  state: BoardCursorState;
  /**
   * Smoothly moves the cursor from its current position to (x, y).
   * Returns a Promise that resolves when the movement completes.
   * If another moveTo is called before completion, the previous animation
   * is cancelled and the new one begins from the interrupted position.
   */
  moveTo: (x: number, y: number, durationMs?: number, opts?: MoveCursorOptions) => Promise<void>;
  /**
   * Instantly positions the cursor at (x, y) with no animation.
   * Use only for initial placement or hard scene resets.
   */
  teleport: (x: number, y: number) => void;
  /** Makes the cursor visible (does not move it). */
  show: () => void;
  /** Hides the cursor (does not move it). */
  hide: () => void;
  /**
   * Resets the cursor to its initial position and hides it.
   * Cancels any in-progress animation.
   */
  reset: () => void;
}

export interface UseBoardCursorOptions {
  /** Initial logical X position. Default: 100 */
  initialX?: number;
  /** Initial logical Y position. Default: 80 */
  initialY?: number;
  /** Initial visibility. Default: false */
  initialVisible?: boolean;
  /** Logical width of the board (for clamping). Default: 1280 */
  logicalWidth?: number;
  /** Logical height of the board (for clamping). Default: 720 */
  logicalHeight?: number;
}

// ── Implementation ─────────────────────────────────────────────────────────

const EASING_MAP: Record<CursorEasing, (t: number) => number> = {
  inOutCubic: easeInOutCubic,
  outCubic: easeOutCubic,
};

// Minimum distance (in logical units) to treat as "already there"
const SNAP_THRESHOLD = 1;
// Minimum movement duration allowed (prevents jitter on micro-moves)
const MIN_DURATION_MS = 80;

export function useBoardCursor({
  initialX = 100,
  initialY = 80,
  initialVisible = false,
  logicalWidth = DEFAULT_LOGICAL_WIDTH,
  logicalHeight = DEFAULT_LOGICAL_HEIGHT,
}: UseBoardCursorOptions = {}): BoardCursorAPI {
  const [state, setState] = useState<BoardCursorState>({
    x: initialX,
    y: initialY,
    visible: initialVisible,
    moving: false,
  });

  // Stable refs so animation callbacks always read current values
  // without needing to be recreated on every render.
  const posRef = useRef<Point2D>({ x: initialX, y: initialY });
  const rafRef = useRef<number | null>(null);
  // Each moveTo gets a unique token; if a newer moveTo cancels us, we stop.
  const animTokenRef = useRef<number>(0);
  // The resolve() function of the currently running moveTo Promise, if any.
  const resolveRef = useRef<(() => void) | null>(null);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      // Resolve any pending promise so callers don't leak
      resolveRef.current?.();
      resolveRef.current = null;
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Increment token to invalidate any running animation loop
    animTokenRef.current += 1;
    // Resolve any pending Promise from a prior moveTo() so callers don't hang
    resolveRef.current?.();
    resolveRef.current = null;
  }, []);

  const setPos = useCallback((p: Point2D) => {
    posRef.current = p;
    setState(prev => ({ ...prev, x: p.x, y: p.y }));
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────

  const teleport = useCallback(
    (x: number, y: number) => {
      cancelAnimation();
      const clamped = clampLogical({ x, y }, logicalWidth, logicalHeight);
      posRef.current = clamped;
      setState(prev => ({ ...prev, x: clamped.x, y: clamped.y, moving: false }));
    },
    [cancelAnimation, logicalWidth, logicalHeight]
  );

  const show = useCallback(() => {
    setState(prev => ({ ...prev, visible: true }));
  }, []);

  const hide = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  const reset = useCallback(() => {
    cancelAnimation();
    const origin: Point2D = { x: initialX, y: initialY };
    posRef.current = origin;
    setState({
      x: initialX,
      y: initialY,
      visible: false,
      moving: false,
    });
  }, [cancelAnimation, initialX, initialY]);

  const moveTo = useCallback(
    (
      x: number,
      y: number,
      durationMs: number = 900,
      opts: MoveCursorOptions = {}
    ): Promise<void> => {
      const {
        easing = 'inOutCubic',
        bowFactor = 0.18,
      } = opts;

      const targetRaw = clampLogical({ x, y }, logicalWidth, logicalHeight);
      const from: Point2D = { ...posRef.current };
      const dist = distance(from, targetRaw);

      // If already at target (within snap threshold), resolve immediately
      if (dist < SNAP_THRESHOLD) {
        return Promise.resolve();
      }

      // Cancel any prior animation (resolves its promise)
      cancelAnimation();

      const safeDuration = Math.max(MIN_DURATION_MS, durationMs);
      const easeFn = EASING_MAP[easing];
      const ctrl = arcControlPoint(from, targetRaw, bowFactor);
      const token = animTokenRef.current;

      setState(prev => ({ ...prev, moving: true }));

      return new Promise<void>(resolve => {
        // Register our resolve so cancelAnimation() can call it
        resolveRef.current = resolve;

        let startTime: number | null = null;

        const tick = (timestamp: number) => {
          // Stale animation — a newer moveTo was called; promise already resolved by cancelAnimation
          if (animTokenRef.current !== token) {
            return;
          }

          if (startTime === null) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const rawT = Math.min(elapsed / safeDuration, 1);
          const easedT = easeFn(rawT);

          const nextPos = quadraticBezier(easedT, from, ctrl, targetRaw);
          setPos(nextPos);

          if (rawT < 1) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            // Snap exactly to target to prevent float drift
            setPos(targetRaw);
            setState(prev => ({ ...prev, moving: false }));
            rafRef.current = null;
            resolveRef.current = null;
            resolve();
          }
        };

        rafRef.current = requestAnimationFrame(tick);
      });
    },
    [cancelAnimation, setPos, logicalWidth, logicalHeight]
  );

  return { state, moveTo, teleport, show, hide, reset };
}

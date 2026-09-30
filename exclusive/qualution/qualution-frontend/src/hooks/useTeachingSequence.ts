/**
 * useTeachingSequence.ts
 *
 * PHASE 4: Teaching Action Executor Hook.
 *
 * Executes a `TeachingAction[]` produced by `teacherWrite()` (or manually
 * composed) against live cursor and writer controllers.
 *
 * Design principles:
 * - Stateless with respect to the board — the cursor and writer own their state.
 * - Sequence-token pattern: a new `run()` call or `reset()` invalidates any
 *   in-progress sequence so stale async chains never touch state after cancel.
 * - `run()` returns a Promise that resolves when all actions complete, or
 *   resolves early (without throw) if cancelled.
 * - Cursor travel duration is auto-computed from distance when the MOVE action
 *   carries the AUTO_TRAVEL_SENTINEL value.
 *
 * Usage:
 *   const sequence = useTeachingSequence({ cursor, writer });
 *   await sequence.run([
 *     { kind: 'APPEAR', x: 80, y: 80 },
 *     ...teacherWrite({ id: 'title', text: 'What is a Qubit?', x: 200, y: 220 }),
 *   ]);
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import type { BoardCursorAPI } from './useBoardCursor';
import type { BoardWriterController } from './useBoardWriter';
import type { BoardDrawingController } from './useBoardDrawing';
import type { BoardEmphasisController } from './useBoardEmphasis';
import type { TeachingCaptionController } from './useTeachingCaption';
import type { BoardMathController } from './useBoardMath';
import {
  AUTO_TRAVEL_SENTINEL,
  type TeachingAction,
} from '../features/theory/teachingActions';
import { distance } from '../features/theory/cursorMotion';

// ── Public types ───────────────────────────────────────────────────────────

export interface UseTeachingSequenceOptions {
  cursor: BoardCursorAPI;
  writer: BoardWriterController;
  /** Optional drawing controller for Phase 5 DRAW_* actions. */
  drawing?: BoardDrawingController;
  /** Optional emphasis controller for Phase 6 actions. */
  emphasis?: BoardEmphasisController;
  /** Optional caption controller for Phase 7 actions. */
  caption?: TeachingCaptionController;
  /** Optional math controller for Phase 8 actions. */
  math?: BoardMathController;
}

export interface TeachingSequenceController {
  /**
   * Executes the given action array sequentially.
   * Returns a Promise that resolves when all actions complete.
   * If `reset()` is called or a new `run()` starts while a sequence is active,
   * the in-progress sequence is cancelled and the returned Promise resolves.
   */
  run: (actions: TeachingAction[]) => Promise<void>;

  /**
   * Immediately cancels any running sequence. The cursor and writer are left
   * in their current mid-sequence state — call `cursor.reset()` /
   * `writer.reset()` separately if you need a full board clear.
   */
  reset: () => void;

  /** True while a sequence is executing. */
  isRunning: boolean;
}

// ── Auto-travel duration heuristic ─────────────────────────────────────────

const MIN_TRAVEL_MS = 350;
const MAX_TRAVEL_MS = 900;
const TRAVEL_MS_PER_UNIT = 0.75;

function autoTravelMs(dist: number): number {
  return Math.round(
    Math.min(MAX_TRAVEL_MS, Math.max(MIN_TRAVEL_MS, dist * TRAVEL_MS_PER_UNIT))
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useTeachingSequence({
  cursor,
  writer,
  drawing,
  emphasis,
  caption,
  math,
}: UseTeachingSequenceOptions): TeachingSequenceController {
  const [isRunning, setIsRunning] = useState(false);

  // Each run() increments the sequence token. Actions check the token
  // before each step; if it changed, they stop silently.
  const seqTokenRef = useRef(0);
  // Resolve function for the currently active run() promise.
  const resolveRef = useRef<(() => void) | null>(null);
  // Whether the component is still mounted.
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      resolveRef.current?.();
      resolveRef.current = null;
    };
  }, []);

  // ── Internal: cancel helper ─────────────────────────────────────────────

  const cancelSequence = useCallback(() => {
    seqTokenRef.current += 1;
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.();
    if (isMountedRef.current) {
      setIsRunning(false);
    }
  }, []);

  // ── Public: reset ───────────────────────────────────────────────────────

  const reset = useCallback(() => {
    cancelSequence();
  }, [cancelSequence]);

  // ── Public: run ────────────────────────────────────────────────────────

  const run = useCallback(
    (actions: TeachingAction[]): Promise<void> => {
      // Cancel any prior sequence
      cancelSequence();

      if (!isMountedRef.current || actions.length === 0) {
        return Promise.resolve();
      }

      const token = ++seqTokenRef.current;

      if (isMountedRef.current) {
        setIsRunning(true);
      }

      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;

        // ── Async executor ──────────────────────────────────────────────
        const execute = async () => {
          for (const action of actions) {
            // Check for cancellation before each action
            if (seqTokenRef.current !== token || !isMountedRef.current) {
              return;
            }

            switch (action.kind) {
              // ── APPEAR: teleport cursor and show it ─────────────────
              case 'APPEAR': {
                cursor.teleport(action.x, action.y);
                cursor.show();
                break;
              }

              // ── MOVE: smooth cursor movement ─────────────────────────
              case 'MOVE': {
                // Compute travel duration from distance if sentinel
                let durationMs = action.durationMs;
                if (durationMs === AUTO_TRAVEL_SENTINEL) {
                  const dist = distance(
                    { x: cursor.state.x, y: cursor.state.y },
                    { x: action.x, y: action.y }
                  );
                  durationMs = dist < 8 ? 0 : autoTravelMs(dist);
                }

                if (durationMs <= 0) {
                  cursor.teleport(action.x, action.y);
                } else {
                  await cursor.moveTo(action.x, action.y, durationMs);
                }

                // Re-check after await
                if (seqTokenRef.current !== token || !isMountedRef.current) {
                  return;
                }
                break;
              }

              // ── PAUSE: fixed wait ─────────────────────────────────────
              case 'PAUSE': {
                await sleep(action.durationMs, token, seqTokenRef);
                if (seqTokenRef.current !== token || !isMountedRef.current) {
                  return;
                }
                break;
              }

              // ── WRITE: progressive text with cursor tracking ──────────
              case 'WRITE': {
                await writer.writeText({
                  id: action.id,
                  text: action.text,
                  x: action.x,
                  y: action.y,
                  durationMs: action.durationMs,
                  style: action.style,
                  // Pass cursor so the writer syncs writing-head position
                  cursor,
                  travelDurationMs: 0,
                });

                if (seqTokenRef.current !== token || !isMountedRef.current) {
                  return;
                }
                break;
              }

              // ── HIDE: hide cursor ───────────────────────────────────
              case 'HIDE': {
                cursor.hide();
                break;
              }

              // ── DRAW_LINE: progressive line with cursor tracking ────────
              case 'DRAW_LINE': {
                if (drawing) {
                  await drawing.drawLine({
                    id: action.id,
                    x1: action.x1, y1: action.y1,
                    x2: action.x2, y2: action.y2,
                    durationMs: action.durationMs,
                    style: action.style,
                    cursor,
                  });
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── DRAW_ARROW: progressive arrow with cursor tracking ──────
              case 'DRAW_ARROW': {
                if (drawing) {
                  await drawing.drawArrow({
                    id: action.id,
                    x1: action.x1, y1: action.y1,
                    x2: action.x2, y2: action.y2,
                    durationMs: action.durationMs,
                    arrowSize: action.arrowSize,
                    style: action.style,
                    cursor,
                  });
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── DRAW_CIRCLE: progressive circle with cursor tracking ─────
              case 'DRAW_CIRCLE': {
                if (drawing) {
                  await drawing.drawCircle({
                    id: action.id,
                    cx: action.cx, cy: action.cy, r: action.r,
                    durationMs: action.durationMs,
                    filled: action.filled,
                    style: action.style,
                    cursor,
                  });
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── DRAW_RECT: progressive rectangle with cursor tracking ────
              case 'DRAW_RECT': {
                if (drawing) {
                  await drawing.drawRect({
                    id: action.id,
                    x: action.x, y: action.y,
                    w: action.w, h: action.h,
                    durationMs: action.durationMs,
                    filled: action.filled,
                    style: action.style,
                    cursor,
                  });
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── POINT: hold cursor intentionally at target ──────────────
              case 'POINT': {
                if (emphasis) {
                  await emphasis.point({
                    x: action.x,
                    y: action.y,
                    durationMs: action.durationMs,
                    cursor,
                  });
                } else {
                  cursor.teleport(action.x, action.y);
                  await sleep(action.durationMs, token, seqTokenRef);
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── HIGHLIGHT: translucent emphasize overlay ─────────────────
              case 'HIGHLIGHT': {
                if (emphasis) {
                  await emphasis.highlight({
                    id: action.id,
                    target: action.target,
                    durationMs: action.durationMs,
                    color: action.color,
                    persistent: action.persistent,
                    cursor,
                  });
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── UNDERLINE: progressive underline with cursor tracking ─────
              case 'UNDERLINE': {
                if (emphasis) {
                  await emphasis.underline({
                    id: action.id,
                    target: action.target,
                    durationMs: action.durationMs,
                    style: action.style,
                    cursor,
                  });
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── CIRCLE_TARGET: progressive circle around target ──────────
              case 'CIRCLE_TARGET': {
                if (emphasis) {
                  await emphasis.circleAroundTarget({
                    id: action.id,
                    target: action.target,
                    durationMs: action.durationMs,
                    style: action.style,
                    padding: action.padding,
                    cursor,
                  });
                } else if (drawing) {
                  const reg = action.target;
                  const pad = action.padding ?? 12;
                  await drawing.drawCircle({
                    id: action.id,
                    cx: reg.x + reg.width / 2,
                    cy: reg.y + reg.height / 2,
                    r: Math.max(reg.width, reg.height) / 2 + pad,
                    durationMs: action.durationMs,
                    style: action.style,
                    cursor,
                  });
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── CAPTION: display teaching caption subtitle ──────────────
              case 'CAPTION': {
                if (caption) {
                  await caption.showCaption(action.text, {
                    id: action.id,
                    durationMs: action.durationMs,
                    position: action.position,
                    fontSize: action.fontSize,
                    align: action.align,
                  });
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── HIDE_CAPTION: hide active teaching caption ───────────────
              case 'HIDE_CAPTION': {
                if (caption) {
                  await caption.hideCaption();
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── WRITE_MATH: write KaTeX formula progressively ────────────
              case 'WRITE_MATH': {
                if (math) {
                  await math.writeMath({
                    id: action.id,
                    latex: action.latex,
                    x: action.x,
                    y: action.y,
                    durationMs: action.durationMs,
                    style: action.style,
                    replaceId: action.replaceId,
                  });
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              // ── REPLACE_MATH: replace existing mathematical formula ──────
              case 'REPLACE_MATH': {
                if (math) {
                  await math.replaceMath(action.id, action.newLatex, {
                    durationMs: action.durationMs,
                  });
                }
                if (seqTokenRef.current !== token || !isMountedRef.current) return;
                break;
              }

              default:
                break;
            }
          }

          // All actions completed
          if (seqTokenRef.current === token && isMountedRef.current) {
            resolveRef.current = null;
            setIsRunning(false);
          }
          resolve();
        };

        execute().catch(() => {
          // Sequences should never throw; this is a safety net
          if (isMountedRef.current) setIsRunning(false);
          resolve();
        });
      });
    },
    [cursor, writer, drawing, emphasis, caption, math, cancelSequence]
  );

  return { run, reset, isRunning };
}

// ── Utilities ──────────────────────────────────────────────────────────────

/**
 * Cancellable sleep: resolves early if the sequence token changes.
 * This keeps PAUSE actions from blocking after reset() is called.
 *
 * Implementation note: uses a 16ms setTimeout poll instead of rAF so that
 * vi.useFakeTimers() in tests can drain all polling steps deterministically.
 * rAF-based polls create an infinite cascade under fake timers because each
 * callback re-schedules itself before the outer setTimeout fires.
 */
function sleep(
  ms: number,
  token: number,
  tokenRef: React.RefObject<number>
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (ms <= 0) {
      resolve();
      return;
    }

    let resolved = false;

    const finish = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(pollId);
        clearTimeout(sleepId);
        resolve();
      }
    };

    // Primary sleep: fires when the full duration has elapsed.
    const sleepId = setTimeout(finish, ms);

    // Cancellation poll: checks every ~16ms whether the token changed.
    // Uses setTimeout (not rAF) so vi.useFakeTimers() works correctly.
    let pollId: ReturnType<typeof setTimeout>;
    const poll = () => {
      if (resolved) return;
      if (tokenRef.current !== token) {
        finish();
        return;
      }
      pollId = setTimeout(poll, 16);
    };
    pollId = setTimeout(poll, 16);
  });
}

export default useTeachingSequence;

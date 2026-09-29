/**
 * lessonTimeline.ts
 *
 * PHASE 10: Deterministic Lesson Timeline Builder.
 *
 * Transforms a list of sequential `TeachingAction` objects (from declarative
 * JSON or imperative builders) into a continuous, deterministic timeline with
 * exact absolute millisecond intervals: [startTimeMs, endTimeMs].
 *
 * Key guarantees:
 * - Contiguous, non-overlapping sequential action execution.
 * - Total duration is deterministic and known ahead of time.
 * - Supports O(1) or binary-search time indexing for `renderAt(timeMs)`.
 */

import type { TeachingAction } from './teachingActions';
import { distance } from './cursorMotion';

export interface CursorWaypoint {
  x: number;
  y: number;
  visible: boolean;
}

export interface TimelineAction {
  /** Unique ID for action tracking */
  id: string;
  /** Index in the action sequence */
  index: number;
  /** The underlying teaching action */
  action: TeachingAction;
  /** Absolute start timestamp in ms from lesson start */
  startTimeMs: number;
  /** Total duration in ms */
  durationMs: number;
  /** Absolute end timestamp in ms from lesson start */
  endTimeMs: number;
  /** Cursor position at action start */
  startCursor: CursorWaypoint;
  /** Cursor position at action completion */
  endCursor: CursorWaypoint;
}

export interface LessonTimeline {
  /** Ordered list of normalized timeline actions */
  actions: TimelineAction[];
  /** Total cumulative duration in milliseconds */
  totalDurationMs: number;
  /** Initial cursor state at time 0 */
  initialCursor: CursorWaypoint;
  /** Find action active at given timestamp */
  findActionAt: (timeMs: number) => TimelineAction | null;
  /** Get all actions that should be completed by given timestamp */
  getCompletedActionsAt: (timeMs: number) => TimelineAction[];
}

const DEFAULT_INITIAL_CURSOR: CursorWaypoint = {
  x: 256,
  y: 216,
  visible: true,
};

const MIN_TRAVEL_MS = 350;
const MAX_TRAVEL_MS = 900;
const TRAVEL_MS_PER_UNIT = 0.75;

function computeAutoTravelMs(dist: number): number {
  return Math.round(
    Math.min(MAX_TRAVEL_MS, Math.max(MIN_TRAVEL_MS, dist * TRAVEL_MS_PER_UNIT))
  );
}

/**
 * Builds a deterministic, contiguous LessonTimeline from an array of TeachingActions.
 */
export function buildLessonTimeline(
  actions: TeachingAction[],
  initialCursor: CursorWaypoint = DEFAULT_INITIAL_CURSOR
): LessonTimeline {
  const timelineActions: TimelineAction[] = [];
  let currentTimeMs = 0;
  let currentCursor: CursorWaypoint = { ...initialCursor };

  actions.forEach((action, index) => {
    let durationMs = 0;
    const startCursor: CursorWaypoint = { ...currentCursor };
    let endCursor: CursorWaypoint = { ...currentCursor };

    switch (action.kind) {
      case 'APPEAR': {
        durationMs = 0;
        endCursor = { x: action.x, y: action.y, visible: true };
        break;
      }

      case 'MOVE': {
        let dur = action.durationMs;
        if (dur === -1 || dur === 0) {
          const dist = distance(currentCursor, { x: action.x, y: action.y });
          dur = dist < 8 ? 0 : computeAutoTravelMs(dist);
        }
        durationMs = Math.max(0, dur);
        endCursor = { x: action.x, y: action.y, visible: true };
        break;
      }

      case 'PAUSE': {
        durationMs = Math.max(0, action.durationMs);
        break;
      }

      case 'WRITE': {
        durationMs = Math.max(0, action.durationMs);
        // During write, cursor moves to end of text
        const approxCharWidth = (action.style?.fontSize ?? 28) * 0.58;
        const totalTextWidth = action.text.length * approxCharWidth;
        endCursor = {
          x: action.x + totalTextWidth + 12,
          y: action.y + 4,
          visible: true,
        };
        break;
      }

      case 'HIDE': {
        durationMs = 0;
        endCursor = { ...currentCursor, visible: false };
        break;
      }

      case 'DRAW_LINE':
      case 'DRAW_ARROW': {
        durationMs = Math.max(0, action.durationMs ?? 1000);
        endCursor = { x: action.x2, y: action.y2, visible: true };
        break;
      }

      case 'DRAW_CIRCLE': {
        durationMs = Math.max(0, action.durationMs ?? 1000);
        // Ends where it started (12 o'clock)
        endCursor = { x: action.cx, y: action.cy - action.r, visible: true };
        break;
      }

      case 'DRAW_RECT': {
        durationMs = Math.max(0, action.durationMs ?? 1000);
        // Ends at top-left corner
        endCursor = { x: action.x, y: action.y, visible: true };
        break;
      }

      case 'POINT': {
        durationMs = Math.max(0, action.durationMs ?? 800);
        const pointX = (action as { x?: number; target?: { x: number; width: number } }).x ??
          ((action as { target?: { x: number; width: number } }).target?.x ?? 0) + 15;
        const pointY = (action as { y?: number; target?: { y: number; height: number } }).y ??
          ((action as { target?: { y: number; height: number } }).target?.y ?? 0) + 15;
        endCursor = { x: pointX, y: pointY, visible: true };
        break;
      }

      case 'HIGHLIGHT':
      case 'UNDERLINE':
      case 'CIRCLE_EMPHASIS':
      case 'CIRCLE_TARGET': {
        durationMs = Math.max(0, action.durationMs ?? 700);
        const target = (action as { target?: { x: number; y: number; width: number; height: number } }).target;
        if (target) {
          const targetCenterX = target.x + target.width / 2;
          const targetCenterY = target.y + target.height / 2;
          endCursor = { x: targetCenterX + 10, y: targetCenterY + 10, visible: true };
        }
        break;
      }

      case 'CAPTION': {
        durationMs = Math.max(0, action.durationMs ?? (action as { appearDurationMs?: number }).appearDurationMs ?? 300);
        break;
      }

      case 'HIDE_CAPTION': {
        durationMs = 0;
        break;
      }

      case 'MATH':
      case 'WRITE_MATH': {
        const mathAct = action as { latex?: string; x?: number; y?: number; durationMs?: number };
        durationMs = Math.max(0, mathAct.durationMs ?? 400);
        const latexStr = mathAct.latex ?? '';
        const approxMathWidth = latexStr.length * 14;
        endCursor = {
          x: (mathAct.x ?? 0) + approxMathWidth + 12,
          y: (mathAct.y ?? 0) + 10,
          visible: true,
        };
        break;
      }

      case 'REPLACE_MATH': {
        durationMs = Math.max(0, action.durationMs ?? 400);
        break;
      }

      case 'NARRATE': {
        durationMs = Math.max(0, action.durationMs ?? 0);
        endCursor = { ...currentCursor };
        break;
      }

      case 'CHECKPOINT': {
        durationMs = 0;
        endCursor = { ...currentCursor };
        break;
      }

      case 'WORKBENCH': {
        durationMs = 0;
        endCursor = { ...currentCursor };
        break;
      }

      case 'ASSESSMENT': {
        durationMs = 0;
        endCursor = { ...currentCursor };
        break;
      }

      default:
        durationMs = 0;
    }

    const startTimeMs = currentTimeMs;
    const endTimeMs = startTimeMs + durationMs;
    currentTimeMs = endTimeMs;
    currentCursor = { ...endCursor };

    const actionId = (action as { id?: string }).id ?? `action-${index}`;

    timelineActions.push({
      id: `${actionId}-${index}`,
      index,
      action,
      startTimeMs,
      durationMs,
      endTimeMs,
      startCursor,
      endCursor,
    });
  });

  const totalDurationMs = currentTimeMs;

  return {
    actions: timelineActions,
    totalDurationMs,
    initialCursor,
    findActionAt(timeMs: number): TimelineAction | null {
      const clampedTime = Math.max(0, Math.min(totalDurationMs, timeMs));
      for (const item of timelineActions) {
        if (clampedTime >= item.startTimeMs && clampedTime < item.endTimeMs) {
          return item;
        }
      }
      // If at exactly totalDurationMs, return the last non-zero action or last action
      if (clampedTime >= totalDurationMs && timelineActions.length > 0) {
        return timelineActions[timelineActions.length - 1];
      }
      return null;
    },
    getCompletedActionsAt(timeMs: number): TimelineAction[] {
      const clampedTime = Math.max(0, Math.min(totalDurationMs, timeMs));
      return timelineActions.filter((item) => item.endTimeMs <= clampedTime);
    },
  };
}

// ── Legacy Compatibility Helpers ──────────────────────────────────────────

export function buildTimeline(script: any): any[] {
  if (!script || !Array.isArray(script.steps)) return [];
  return script.steps;
}

export function timelineDuration(timeline: any[]): number {
  if (!Array.isArray(timeline)) return 0;
  return timeline.reduce((acc, step) => acc + (step.durationMs || step.duration || 1000), 0);
}

export function lessonProgress(timeline: any[], currentTimeMs: number): number {
  const dur = timelineDuration(timeline);
  if (dur <= 0) return 0;
  return Math.min(1, Math.max(0, currentTimeMs / dur));
}

export function activeStepIndex(timeline: any[], currentTimeMs: number): number {
  if (!Array.isArray(timeline) || timeline.length === 0) return 0;
  let accumulated = 0;
  for (let i = 0; i < timeline.length; i++) {
    const stepDur = timeline[i].durationMs || timeline[i].duration || 1000;
    if (currentTimeMs >= accumulated && currentTimeMs < accumulated + stepDur) {
      return i;
    }
    accumulated += stepDur;
  }
  return timeline.length - 1;
}


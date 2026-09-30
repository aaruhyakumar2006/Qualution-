/**
 * lessonSanitizer.ts
 *
 * PHASE 15: Lesson Sanitizer — Numeric Safety for the Player.
 *
 * Runs AFTER parseLesson() and BEFORE TheoryBoardEngine.load().
 *
 * Responsibilities:
 * - Clamp coordinates to the safe renderer range.
 * - Clamp durations to [0, DURATION_HARD_LIMIT_MS].
 * - Replace NaN / Infinity with safe fallback values.
 * - Ensure no numeric field can cause the animation engine to hang or crash.
 *
 * ── Coordinate policy ─────────────────────────────────────────────────────
 *
 * Coordinates are CLAMPED to [-500, 1700] × [-200, 900].
 * This allows intentional off-screen placement (e.g. entry from left edge)
 * while preventing extreme values from breaking SVG rendering.
 *
 * The logical board is 1200 × 700. The clamp range adds ±500/±200 margin.
 *
 * ── Duration policy ───────────────────────────────────────────────────────
 *
 * Durations are clamped to [0, 60 000] ms.
 * NaN and Infinity are replaced with 0.
 *
 * ── Design ────────────────────────────────────────────────────────────────
 *
 * - Pure TypeScript — no React, no DOM, no side effects.
 * - Deterministic: same input always produces the same output.
 * - Does NOT mutate the input — returns a new sanitized script.
 * - Runs once at load time, not per frame.
 */

import type { BoardLessonScript, BoardAction, BoardTeachingStep } from './boardTypes';
import { LESSON_LIMITS } from './lessonValidator';

// ── Clamp helpers ──────────────────────────────────────────────────────────

const COORD_X_MIN = -500;
const COORD_X_MAX = 1700;
const COORD_Y_MIN = -200;
const COORD_Y_MAX = 900;

function safeNum(v: number, fallback: number): number {
  return isFinite(v) ? v : fallback;
}

function clampX(x: number): number {
  return Math.max(COORD_X_MIN, Math.min(COORD_X_MAX, safeNum(x, 0)));
}

function clampY(y: number): number {
  return Math.max(COORD_Y_MIN, Math.min(COORD_Y_MAX, safeNum(y, 0)));
}

function clampDuration(ms: number): number {
  // Non-finite values: NaN → 0, ±Infinity → clamp to limit
  if (!isFinite(ms)) {
    return ms > 0 ? LESSON_LIMITS.DURATION_HARD_LIMIT_MS : 0;
  }
  return Math.max(0, Math.min(LESSON_LIMITS.DURATION_HARD_LIMIT_MS, ms));
}

function clampPositive(v: number, fallback: number): number {
  const safe = safeNum(v, fallback);
  return safe > 0 ? safe : fallback;
}

// ── Action sanitizer ───────────────────────────────────────────────────────

function sanitizeAction(action: BoardAction): BoardAction {
  switch (action.type) {
    case 'MOVE_CURSOR':
      return { ...action, x: clampX(action.x), y: clampY(action.y) };

    case 'POINT':
      return {
        ...action,
        x: clampX(action.x),
        y: clampY(action.y),
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'PAUSE':
      return { ...action, duration: clampDuration(action.duration) };

    case 'NARRATE':
      // text is a string — no numeric fields to sanitize
      return action;

    case 'CLEAR_BOARD':
      return action;

    case 'ERASE_REGION':
      return {
        ...action,
        x: clampX(action.x),
        y: clampY(action.y),
        w: clampPositive(action.w, 1),
        h: clampPositive(action.h, 1),
      };

    case 'WRITE_TEXT':
      return {
        ...action,
        x: clampX(action.x),
        y: clampY(action.y),
        fontSize: action.fontSize !== undefined ? clampPositive(action.fontSize, 28) : undefined,
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'WRITE_MATH':
      return {
        ...action,
        x: clampX(action.x),
        y: clampY(action.y),
        scale: action.scale !== undefined ? clampPositive(action.scale, 1) : undefined,
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'DRAW_LINE':
      return {
        ...action,
        x1: clampX(action.x1), y1: clampY(action.y1),
        x2: clampX(action.x2), y2: clampY(action.y2),
        strokeWidth: action.strokeWidth !== undefined ? clampPositive(action.strokeWidth, 2) : undefined,
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'DRAW_ARROW':
      return {
        ...action,
        x1: clampX(action.x1), y1: clampY(action.y1),
        x2: clampX(action.x2), y2: clampY(action.y2),
        strokeWidth: action.strokeWidth !== undefined ? clampPositive(action.strokeWidth, 2) : undefined,
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'DRAW_RECT':
      return {
        ...action,
        x: clampX(action.x),
        y: clampY(action.y),
        w: clampPositive(action.w, 1),
        h: clampPositive(action.h, 1),
        strokeWidth: action.strokeWidth !== undefined ? clampPositive(action.strokeWidth, 2) : undefined,
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'DRAW_CIRCLE':
      return {
        ...action,
        cx: clampX(action.cx),
        cy: clampY(action.cy),
        r: clampPositive(action.r, 1),
        strokeWidth: action.strokeWidth !== undefined ? clampPositive(action.strokeWidth, 2) : undefined,
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'DRAW_UNDERLINE':
      return {
        ...action,
        x: clampX(action.x),
        y: clampY(action.y),
        width: clampPositive(action.width, 1),
        strokeWidth: action.strokeWidth !== undefined ? clampPositive(action.strokeWidth, 2) : undefined,
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'HIGHLIGHT':
      return {
        ...action,
        x: clampX(action.x),
        y: clampY(action.y),
        w: clampPositive(action.w, 1),
        h: clampPositive(action.h, 1),
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'DRAW_QUBIT_WIRE':
      return {
        ...action,
        x: clampX(action.x),
        y: clampY(action.y),
        length: clampPositive(action.length, 1),
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'DRAW_GATE_BOX':
      return {
        ...action,
        cx: clampX(action.cx),
        cy: clampY(action.cy),
        size: action.size !== undefined ? clampPositive(action.size, 40) : undefined,
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    case 'DRAW_MEASURE_SYMBOL':
      return {
        ...action,
        cx: clampX(action.cx),
        cy: clampY(action.cy),
        size: action.size !== undefined ? clampPositive(action.size, 40) : undefined,
        duration: action.duration !== undefined ? clampDuration(action.duration) : undefined,
      };

    default:
      return action;
  }
}

// ── Step sanitizer ─────────────────────────────────────────────────────────

function sanitizeStep(step: BoardTeachingStep): BoardTeachingStep {
  return {
    ...step,
    actions: step.actions.map(sanitizeAction),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns a new `BoardLessonScript` with all numeric fields clamped to safe
 * ranges. The input is not mutated.
 *
 * Call this after `parseLesson()` and before `TheoryBoardEngine.load()`.
 *
 * This function is deterministic: same input → same output every time.
 */
export function sanitizeLessonScript(script: BoardLessonScript): BoardLessonScript {
  return {
    ...script,
    steps: script.steps.map(sanitizeStep),
  };
}

/** Exported clamp bounds for tests. */
export const SANITIZER_BOUNDS = {
  COORD_X_MIN,
  COORD_X_MAX,
  COORD_Y_MIN,
  COORD_Y_MAX,
} as const;

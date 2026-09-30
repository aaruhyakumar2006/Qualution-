/**
 * emphasisActions.ts
 *
 * PHASE 6: Teacher Emphasis — Pure Action Builders.
 *
 * Provides builder functions that construct canonical emphasis sequences
 * as plain `BoardAction[]` arrays for use with TheoryBoardEngine.
 *
 * Four emphasis types:
 *   teacherPoint()         — cursor moves to target and pauses
 *   teacherHighlight()     — semi-transparent overlay that fades after duration
 *   teacherUnderline()     — progressively drawn underline beneath content
 *   teacherCircleAround()  — progressively drawn circle around existing content
 *
 * Design: Pure TypeScript — no React, no DOM, no side effects.
 * All functions are deterministic: same inputs → same outputs.
 *
 * Coordinate system: logical board units (default 1200 × 700).
 */

import type { BoardAction, PointAction, HighlightAction, DrawUnderlineAction, DrawCircleAction, MoveCursorAction } from './boardTypes';

// ── POINT ──────────────────────────────────────────────────────────────────

export interface TeacherPointOptions {
  /** Logical X of the target. */
  x: number;
  /** Logical Y of the target. */
  y: number;
  /**
   * How long the cursor holds at the target in ms.
   * Default: 1200 ms
   */
  durationMs?: number;
  /** Optional label shown near the cursor tip during the pause. */
  label?: string;
}

/**
 * Builds the canonical "teacher points at a target" sequence.
 *
 * Sequence: MOVE_CURSOR → POINT (hold)
 *
 * The MOVE_CURSOR snaps the cursor to the target quickly (fast=true),
 * then POINT holds it there for `durationMs` with an optional label.
 *
 * @example
 * ```ts
 * const actions = teacherPoint({ x: 400, y: 300, durationMs: 1500, label: 'Here!' });
 * await engine.executeActions(actions);
 * ```
 */
export function teacherPoint(opts: TeacherPointOptions): BoardAction[] {
  const { x, y, durationMs = 1200, label } = opts;

  const move: MoveCursorAction = { type: 'MOVE_CURSOR', x, y, fast: false };
  const point: PointAction = { type: 'POINT', x, y, duration: durationMs, label };

  return [move, point];
}

// ── HIGHLIGHT ──────────────────────────────────────────────────────────────

export interface TeacherHighlightOptions {
  /** Logical X of the top-left corner of the highlight region. */
  x: number;
  /** Logical Y of the top-left corner of the highlight region. */
  y: number;
  /** Width of the highlight region in logical units. */
  w: number;
  /** Height of the highlight region in logical units. */
  h: number;
  /**
   * CSS color with alpha for the highlight overlay.
   * Default: 'rgba(255, 200, 50, 0.28)' (warm amber)
   */
  color?: string;
  /**
   * Duration in ms the highlight stays visible before fading out.
   * 0 = permanent (stays until board is cleared).
   * Default: 2000 ms
   */
  durationMs?: number;
  /**
   * If true, the highlight pulses to draw extra attention.
   * Default: false
   */
  pulse?: boolean;
}

/**
 * Builds the canonical "teacher highlights a region" sequence.
 *
 * Sequence: HIGHLIGHT (appears smoothly, holds for durationMs, then fades)
 *
 * The engine handles the smooth appear/fade animation internally.
 * When durationMs > 0 the highlight is automatically removed after fading,
 * so it does not permanently clutter the board.
 */
export function teacherHighlight(opts: TeacherHighlightOptions): BoardAction[] {
  const {
    x, y, w, h,
    color = 'rgba(255, 200, 50, 0.28)',
    durationMs = 2000,
    pulse = false,
  } = opts;

  const highlight: HighlightAction = {
    type: 'HIGHLIGHT',
    x, y, w, h,
    color,
    duration: durationMs,
    pulse,
  };

  return [highlight];
}

// ── UNDERLINE ──────────────────────────────────────────────────────────────

export interface TeacherUnderlineOptions {
  /** Logical X of the left edge of the underline. */
  x: number;
  /** Logical Y of the underline (typically text baseline + small offset). */
  y: number;
  /** Width of the underline in logical units. */
  width: number;
  /**
   * CSS color of the underline stroke.
   * Default: 'rgba(255, 200, 50, 0.9)' (warm amber, matching highlight)
   */
  color?: string;
  /**
   * Stroke width in logical units.
   * Default: 3
   */
  strokeWidth?: number;
  /**
   * Duration of the progressive draw animation in ms.
   * Default: 500 ms
   */
  durationMs?: number;
  /**
   * Pre-draw deliberation pause in ms.
   * Default: 150 ms
   */
  preDrawPauseMs?: number;
}

/**
 * Builds the canonical "teacher underlines content" sequence.
 *
 * Sequence: MOVE_CURSOR (to start) → [PAUSE (pre)] → DRAW_UNDERLINE
 *
 * The underline is drawn progressively left-to-right while the cursor
 * tracks the drawing tip. It persists on the board after completion.
 */
export function teacherUnderline(opts: TeacherUnderlineOptions): BoardAction[] {
  const {
    x, y, width,
    color = 'rgba(255, 200, 50, 0.9)',
    strokeWidth = 3,
    durationMs = 500,
    preDrawPauseMs = 150,
  } = opts;

  const actions: BoardAction[] = [];

  actions.push({ type: 'MOVE_CURSOR', x, y, fast: false });

  if (preDrawPauseMs > 0) {
    actions.push({ type: 'PAUSE', duration: preDrawPauseMs });
  }

  const underline: DrawUnderlineAction = {
    type: 'DRAW_UNDERLINE',
    x, y, width,
    color,
    strokeWidth,
    duration: durationMs,
  };
  actions.push(underline);

  return actions;
}

// ── CIRCLE AROUND TARGET ───────────────────────────────────────────────────

export interface TeacherCircleAroundOptions {
  /** Logical X center of the circle. */
  cx: number;
  /** Logical Y center of the circle. */
  cy: number;
  /** Radius of the circle in logical units. */
  r: number;
  /**
   * CSS color of the circle stroke.
   * Default: 'rgba(255, 200, 50, 0.9)' (warm amber)
   */
  color?: string;
  /**
   * Stroke width in logical units.
   * Default: 3
   */
  strokeWidth?: number;
  /**
   * Duration of the progressive draw animation in ms.
   * Default: 900 ms
   */
  durationMs?: number;
  /**
   * Pre-draw deliberation pause in ms.
   * Default: 200 ms
   */
  preDrawPauseMs?: number;
}

/**
 * Builds the canonical "teacher draws a circle around existing content" sequence.
 *
 * Sequence: MOVE_CURSOR (to top of circle) → [PAUSE (pre)] → DRAW_CIRCLE
 *
 * The circle is drawn progressively clockwise from 12 o'clock while the
 * cursor tracks along the arc. It persists on the board after completion.
 *
 * Designed to work with content already rendered by the board — the circle
 * is drawn around an existing target, not a new element.
 */
export function teacherCircleAround(opts: TeacherCircleAroundOptions): BoardAction[] {
  const {
    cx, cy, r,
    color = 'rgba(255, 200, 50, 0.9)',
    strokeWidth = 3,
    durationMs = 900,
    preDrawPauseMs = 200,
  } = opts;

  const actions: BoardAction[] = [];

  // Move to top of circle (12 o'clock — where drawing starts)
  actions.push({ type: 'MOVE_CURSOR', x: cx, y: cy - r, fast: false });

  if (preDrawPauseMs > 0) {
    actions.push({ type: 'PAUSE', duration: preDrawPauseMs });
  }

  const circle: DrawCircleAction = {
    type: 'DRAW_CIRCLE',
    cx, cy, r,
    color,
    strokeWidth,
    duration: durationMs,
  };
  actions.push(circle);

  return actions;
}

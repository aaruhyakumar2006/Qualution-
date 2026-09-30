/**
 * mathActions.ts
 *
 * PHASE 8: Mathematical Teaching — Pure Action Builders.
 *
 * Provides builder functions that construct canonical math sequences
 * as plain `BoardAction[]` arrays for use with TheoryBoardEngine.
 *
 * Three builders:
 *   teacherWriteMath()    — cursor moves to position, math fades in
 *   teacherReplaceMath()  — replaces an existing math item in-place
 *   teacherExtendMath()   — writes a new math item below/beside an existing one
 *
 * Also exports the canonical superposition demonstration sequence used
 * in the Phase 8 demo:
 *   |0⟩  →  H|0⟩  →  1/√2(|0⟩ + |1⟩)
 *
 * Design: Pure TypeScript — no React, no DOM, no KaTeX, no side effects.
 * All functions are deterministic: same inputs → same outputs.
 *
 * Coordinate system: logical board units (default 1200 × 700).
 */

import type { BoardAction, WriteMathAction, MoveCursorAction } from './boardTypes';

// ── Shared defaults ────────────────────────────────────────────────────────

/** Default chalk-yellow color for board math. */
export const MATH_DEFAULT_COLOR = '#f5c842';

/** Default font scale (1.0 ≈ 22 px base at 1:1 board scale). */
export const MATH_DEFAULT_SCALE = 1.0;

/** Default fade-in duration in ms. */
export const MATH_DEFAULT_DURATION = 400;

// ── teacherWriteMath ───────────────────────────────────────────────────────

export interface TeacherWriteMathOptions {
  /**
   * Stable unique ID for this math item on the board.
   * Required — used by the engine to track and update the item.
   */
  id: string;
  /** LaTeX string without delimiters. e.g. "|0\\rangle" */
  latex: string;
  /** Logical X of the math anchor (left edge). */
  x: number;
  /** Logical Y of the math anchor (top edge). */
  y: number;
  /** Font scale multiplier. Default: 1.0 */
  scale?: number;
  /** CSS color. Default: '#f5c842' (chalk yellow) */
  color?: string;
  /** Fade-in duration in ms. Default: 400 */
  durationMs?: number;
  /**
   * Cursor travel duration in ms before the math appears.
   * Default: 500 ms
   */
  travelDurationMs?: number;
  /**
   * Brief pause after cursor arrives, before math appears.
   * Default: 200 ms
   */
  preWritePauseMs?: number;
  /**
   * Resting pause after math fully appears.
   * Default: 0 ms
   */
  postWritePauseMs?: number;
}

/**
 * Builds the canonical "teacher writes math on the board" sequence.
 *
 * Sequence: MOVE_CURSOR → [PAUSE (pre)] → WRITE_MATH → [PAUSE (post)]
 */
export function teacherWriteMath(opts: TeacherWriteMathOptions): BoardAction[] {
  const {
    id, latex, x, y,
    scale = MATH_DEFAULT_SCALE,
    color = MATH_DEFAULT_COLOR,
    durationMs = MATH_DEFAULT_DURATION,
    travelDurationMs = 500,
    preWritePauseMs = 200,
    postWritePauseMs = 0,
  } = opts;

  const actions: BoardAction[] = [];

  const move: MoveCursorAction = { type: 'MOVE_CURSOR', x, y, fast: travelDurationMs === 0 };
  actions.push(move);

  if (preWritePauseMs > 0) {
    actions.push({ type: 'PAUSE', duration: preWritePauseMs });
  }

  const write: WriteMathAction = {
    type: 'WRITE_MATH',
    latex, x, y, scale, color,
    duration: durationMs,
    itemId: id,
  };
  actions.push(write);

  if (postWritePauseMs > 0) {
    actions.push({ type: 'PAUSE', duration: postWritePauseMs });
  }

  return actions;
}

// ── teacherReplaceMath ─────────────────────────────────────────────────────

export interface TeacherReplaceMathOptions {
  /**
   * The ID of the existing math item to replace.
   * The engine will overwrite the item at this ID.
   */
  id: string;
  /** New LaTeX string. */
  latex: string;
  /** Position of the replacement (same as original, or shifted). */
  x: number;
  y: number;
  scale?: number;
  color?: string;
  durationMs?: number;
  /** Pause before the replacement appears. Default: 300 ms */
  preWritePauseMs?: number;
  postWritePauseMs?: number;
}

/**
 * Builds the canonical "teacher replaces an equation" sequence.
 *
 * Moves the cursor back to the item's position, then overwrites it
 * with the new LaTeX using the same itemId so the renderer updates
 * the existing DOM node rather than appending a new one.
 *
 * Sequence: MOVE_CURSOR → [PAUSE (pre)] → WRITE_MATH (same id) → [PAUSE (post)]
 */
export function teacherReplaceMath(opts: TeacherReplaceMathOptions): BoardAction[] {
  const {
    id, latex, x, y,
    scale = MATH_DEFAULT_SCALE,
    color = MATH_DEFAULT_COLOR,
    durationMs = MATH_DEFAULT_DURATION,
    preWritePauseMs = 300,
    postWritePauseMs = 0,
  } = opts;

  const actions: BoardAction[] = [];

  actions.push({ type: 'MOVE_CURSOR', x, y, fast: false });

  if (preWritePauseMs > 0) {
    actions.push({ type: 'PAUSE', duration: preWritePauseMs });
  }

  const write: WriteMathAction = {
    type: 'WRITE_MATH',
    latex, x, y, scale, color,
    duration: durationMs,
    itemId: id,
  };
  actions.push(write);

  if (postWritePauseMs > 0) {
    actions.push({ type: 'PAUSE', duration: postWritePauseMs });
  }

  return actions;
}

// ── teacherExtendMath ──────────────────────────────────────────────────────

export interface TeacherExtendMathOptions {
  /** New unique ID for the extension item. */
  id: string;
  /** LaTeX for the extension (e.g. the next step of a derivation). */
  latex: string;
  /** Logical X of the extension anchor. */
  x: number;
  /** Logical Y of the extension anchor. */
  y: number;
  scale?: number;
  color?: string;
  durationMs?: number;
  /** Pause before the extension appears. Default: 400 ms */
  preWritePauseMs?: number;
  postWritePauseMs?: number;
}

/**
 * Builds the canonical "teacher extends an equation" sequence.
 *
 * Writes a new math item at a different position (below or beside
 * the previous one), leaving the original intact. Used to show
 * progressive derivation steps.
 *
 * Sequence: MOVE_CURSOR → [PAUSE (pre)] → WRITE_MATH (new id) → [PAUSE (post)]
 */
export function teacherExtendMath(opts: TeacherExtendMathOptions): BoardAction[] {
  return teacherWriteMath({
    ...opts,
    travelDurationMs: 500,
    preWritePauseMs: opts.preWritePauseMs ?? 400,
  });
}

// ── Superposition demonstration sequence ──────────────────────────────────

/**
 * Canonical positions for the three-step superposition demo.
 * All in logical board units (1200 × 700).
 */
export const DEMO_POSITIONS = {
  step1: { x: 200, y: 260 },  // |0⟩
  step2: { x: 200, y: 360 },  // H|0⟩
  step3: { x: 200, y: 460 },  // 1/√2(|0⟩ + |1⟩)
  arrow1: { x1: 340, y1: 285, x2: 340, y2: 345 },
  arrow2: { x1: 340, y1: 385, x2: 340, y2: 445 },
} as const;

/**
 * Builds the complete superposition demonstration sequence:
 *
 *   Step 1: |0⟩                    appears at y=260
 *   Arrow:  ↓ (drawn between steps)
 *   Step 2: H|0⟩                   appears at y=360
 *   Arrow:  ↓
 *   Step 3: \frac{1}{\sqrt{2}}(|0⟩ + |1⟩)  appears at y=460
 *
 * The learner sees the mathematical explanation being constructed
 * progressively — each step fades in after the previous one settles.
 *
 * Returns a plain `BoardAction[]` that can be passed directly to
 * TheoryBoardEngine via a BoardLessonScript step.
 */
export function buildSuperpositionDemo(): BoardAction[] {
  const actions: BoardAction[] = [];

  // ── Step 1: |0⟩ ──────────────────────────────────────────────────────
  actions.push(
    ...teacherWriteMath({
      id: 'demo-step1',
      latex: '|0\\rangle',
      x: DEMO_POSITIONS.step1.x,
      y: DEMO_POSITIONS.step1.y,
      scale: 1.6,
      postWritePauseMs: 600,
    })
  );

  // Arrow from step 1 to step 2
  actions.push({
    type: 'DRAW_ARROW',
    x1: DEMO_POSITIONS.arrow1.x1,
    y1: DEMO_POSITIONS.arrow1.y1,
    x2: DEMO_POSITIONS.arrow1.x2,
    y2: DEMO_POSITIONS.arrow1.y2,
    duration: 300,
  });

  actions.push({ type: 'PAUSE', duration: 200 });

  // ── Step 2: H|0⟩ ─────────────────────────────────────────────────────
  actions.push(
    ...teacherExtendMath({
      id: 'demo-step2',
      latex: 'H|0\\rangle',
      x: DEMO_POSITIONS.step2.x,
      y: DEMO_POSITIONS.step2.y,
      scale: 1.6,
      postWritePauseMs: 600,
    })
  );

  // Arrow from step 2 to step 3
  actions.push({
    type: 'DRAW_ARROW',
    x1: DEMO_POSITIONS.arrow2.x1,
    y1: DEMO_POSITIONS.arrow2.y1,
    x2: DEMO_POSITIONS.arrow2.x2,
    y2: DEMO_POSITIONS.arrow2.y2,
    duration: 300,
  });

  actions.push({ type: 'PAUSE', duration: 200 });

  // ── Step 3: 1/√2(|0⟩ + |1⟩) ─────────────────────────────────────────
  actions.push(
    ...teacherExtendMath({
      id: 'demo-step3',
      latex: '\\frac{1}{\\sqrt{2}}\\bigl(|0\\rangle + |1\\rangle\\bigr)',
      x: DEMO_POSITIONS.step3.x,
      y: DEMO_POSITIONS.step3.y,
      scale: 1.6,
      postWritePauseMs: 800,
    })
  );

  return actions;
}

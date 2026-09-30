/**
 * teachingActions.ts
 *
 * PHASE 4 + 5: Pure Teaching Action Definitions + Sequence Builders.
 *
 * This module is intentionally free of React, DOM, and animation concerns.
 * It defines the vocabulary of what a "teaching action" is and provides
 * builder functions that construct canonical sequences as plain data arrays.
 *
 * Phase 4 builders: teacherWrite()
 * Phase 5 builders: teacherDraw()
 *
 * The executor (useTeachingSequence) reads these actions and drives the
 * live cursor / writer / drawing controllers.
 *
 * Coordinate system: logical board units (default 1280 × 720).
 */

import type { BoardTextStyle } from '../../hooks/useBoardWriter';
import type { DrawingItemStyle } from '../../components/teaching/BoardDrawingLayer';

// ── Action Types ───────────────────────────────────────────────────────────

/**
 * Teleport the cursor to (x, y) and make it visible.
 * Use for the very first appearance or hard scene resets.
 * Does NOT animate — this is an instantaneous placement.
 */
export interface AppearAction {
  kind: 'APPEAR';
  x: number;
  y: number;
}

/**
 * Smoothly move the cursor from its current position to (x, y).
 * Uses the Bézier arc easing from Phase 2 (inOutCubic by default).
 */
export interface MoveAction {
  kind: 'MOVE';
  x: number;
  y: number;
  /** Movement duration in milliseconds. Default: 900 */
  durationMs: number;
}

/**
 * Wait for a fixed duration — the board stays visible, cursor stays put.
 * Represents a deliberate teacher pause (thinking, emphasis, rest).
 */
export interface PauseAction {
  kind: 'PAUSE';
  durationMs: number;
}

/**
 * Progressively write text onto the board while the cursor tracks the
 * writing tip in real time. The cursor moves from the text start to the
 * text end as the reveal progresses.
 *
 * The executor handles cursor synchronization automatically.
 */
export interface WriteAction {
  kind: 'WRITE';
  /** Unique stable ID for this text item on the board. */
  id: string;
  text: string;
  /** Logical X of the text anchor point. */
  x: number;
  /** Logical Y of the text anchor point (baseline). */
  y: number;
  /** Total duration of the progressive write animation. */
  durationMs: number;
  /** Optional style overrides (font, size, color, weight, alignment). */
  style?: BoardTextStyle;
}

/**
 * Hide the cursor (fade out or instant hide).
 * Use at the end of a teaching sequence or before a scene cut.
 */
export interface HideAction {
  kind: 'HIDE';
}

// ── Phase 5: Drawing Actions ───────────────────────────────────────────────

/**
 * Progressively draw a line from (x1,y1) to (x2,y2).
 * The cursor tracks the drawing tip in real time.
 */
export interface DrawLineAction {
  kind: 'DRAW_LINE';
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  durationMs?: number;
  style?: DrawingItemStyle;
}

/**
 * Progressively draw an arrow from (x1,y1) to (x2,y2).
 * The arrowhead appears when the shaft is nearly complete.
 */
export interface DrawArrowAction {
  kind: 'DRAW_ARROW';
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  durationMs?: number;
  arrowSize?: number;
  style?: DrawingItemStyle;
}

/**
 * Progressively draw a circle circumference starting from the top (12 o'clock),
 * going clockwise. The cursor tracks along the arc.
 */
export interface DrawCircleAction {
  kind: 'DRAW_CIRCLE';
  id: string;
  cx: number;
  cy: number;
  r: number;
  durationMs?: number;
  filled?: boolean;
  style?: DrawingItemStyle;
}

/**
 * Progressively trace the perimeter of a rectangle starting from the
 * top-left corner, going clockwise.
 */
export interface DrawRectAction {
  kind: 'DRAW_RECT';
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  durationMs?: number;
  filled?: boolean;
  style?: DrawingItemStyle;
}

// ── Phase 6: Emphasis Actions & Target Representation ──────────────────────

/**
 * Standard rectangular target region representation for board content.
 * Everything is in logical board units (1280 × 720).
 */
export interface TargetRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Flexible input format for target regions, accepting width/w and height/h.
 */
export type TargetInput =
  | TargetRegion
  | { x: number; y: number; w: number; h: number }
  | { x: number; y: number; width?: number; height?: number };

/**
 * Helper to normalize any TargetInput into a canonical TargetRegion.
 */
export function normalizeTargetRegion(target: TargetInput): TargetRegion {
  const x = target.x;
  const y = target.y;
  const width = 'width' in target && typeof target.width === 'number'
    ? target.width
    : 'w' in target && typeof (target as { w: number }).w === 'number'
      ? (target as { w: number }).w
      : 0;
  const height = 'height' in target && typeof target.height === 'number'
    ? target.height
    : 'h' in target && typeof (target as { h: number }).h === 'number'
      ? (target as { h: number }).h
      : 0;
  return { x, y, width, height };
}

/**
 * POINT action: Move cursor to target (or coordinates) and hold intentionally.
 */
export interface PointAction {
  kind: 'POINT';
  x: number;
  y: number;
  durationMs: number;
}

/**
 * HIGHLIGHT action: Visually emphasize an existing region with a subtle translucent overlay.
 */
export interface HighlightAction {
  kind: 'HIGHLIGHT';
  id: string;
  target: TargetRegion;
  durationMs?: number;
  color?: string;
  persistent?: boolean;
}

/**
 * UNDERLINE action: Progressive underline below the target region.
 */
export interface UnderlineAction {
  kind: 'UNDERLINE';
  id: string;
  target: TargetRegion;
  durationMs?: number;
  style?: DrawingItemStyle;
}

/**
 * CIRCLE_TARGET action: Progressive circle around the target region.
 */
export interface CircleTargetAction {
  kind: 'CIRCLE_TARGET';
  id: string;
  target: TargetRegion;
  durationMs?: number;
  style?: DrawingItemStyle;
  padding?: number;
}

// ── Phase 7: Teaching Caption Actions ──────────────────────────────────────

export type CaptionPositionPreset = 'top' | 'center' | 'bottom';
export type CaptionAlignPreset = 'left' | 'center' | 'right';

export interface CaptionOptions {
  id?: string;
  position?: CaptionPositionPreset;
  fontSize?: number;
  align?: CaptionAlignPreset;
  durationMs?: number;
  appearDurationMs?: number;
  disappearDurationMs?: number;
}

/**
 * CAPTION action: Show a supporting teaching explanation subtitle in the caption overlay.
 */
export interface CaptionAction {
  kind: 'CAPTION';
  text: string;
  id?: string;
  durationMs?: number;
  position?: CaptionPositionPreset;
  fontSize?: number;
  align?: CaptionAlignPreset;
}

/**
 * HIDE_CAPTION action: Hide any currently visible teaching caption.
 */
export interface HideCaptionAction {
  kind: 'HIDE_CAPTION';
}

// ── Phase 8: Mathematical Teaching Actions ─────────────────────────────────

export interface MathItemStyle {
  scale?: number;
  color?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  opacity?: number;
}

/**
 * WRITE_MATH action: Render a KaTeX mathematical formula progressively on the board.
 */
export interface WriteMathAction {
  kind: 'WRITE_MATH';
  id: string;
  latex: string;
  x: number;
  y: number;
  durationMs?: number;
  style?: MathItemStyle;
  replaceId?: string;
}

/**
 * REPLACE_MATH action: Smoothly replace an existing mathematical formula with new LaTeX.
 */
export interface ReplaceMathAction {
  kind: 'REPLACE_MATH';
  id: string;
  newLatex: string;
  durationMs?: number;
}

// ── Phase 11: Teacher Narration / TTS Actions ──────────────────────────────

export interface NarrateOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  prePauseMs?: number;
  postPauseMs?: number;
}

/**
 * NARRATE action: Speak teacher narration synchronized with the lesson timeline.
 */
export interface NarrateAction {
  kind: 'NARRATE';
  text: string;
  durationMs?: number;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// ── Phase 12: Theory Prediction Checkpoint Actions ─────────────────────────

export interface CheckpointOption {
  id: string;
  text: string;
}

export interface CheckpointAction {
  kind: 'CHECKPOINT';
  id: string;
  question: string;
  options: CheckpointOption[];
  correct: string;
  explanation: string;
  durationMs?: number;
}

// ── Phase 13: Theory → Quantum Workbench Transition Actions ───────────────

export interface WorkbenchGateSetup {
  gate: string;
  qubit: number;
  column?: number;
}

export interface WorkbenchSetup {
  qubits: number;
  gates?: WorkbenchGateSetup[];
  measure?: boolean;
  shots?: number;
}

export interface WorkbenchExplanation {
  title?: string;
  math?: string[];
  text: string;
}

export interface WorkbenchAction {
  kind: 'WORKBENCH';
  id: string;
  title: string;
  description: string;
  formula?: string;
  setup: WorkbenchSetup;
  explanation?: WorkbenchExplanation;
  durationMs?: number;
}

// ── Phase 15: Assessment, Learning Evidence & Concept Mastery ──────────────

export interface AssessmentOption {
  id: string;
  text: string;
}

export interface AssessmentAction {
  kind: 'ASSESSMENT';
  id: string;
  question: string;
  options: AssessmentOption[];
  correct: string;
  explanation: string;
  concept?: string;
  durationMs?: number;
}

// ── Union Type ─────────────────────────────────────────────────────────────

export type TeachingAction =
  | AppearAction
  | MoveAction
  | PauseAction
  | WriteAction
  | HideAction
  | DrawLineAction
  | DrawArrowAction
  | DrawCircleAction
  | DrawRectAction
  | PointAction
  | HighlightAction
  | UnderlineAction
  | CircleTargetAction
  | CaptionAction
  | HideCaptionAction
  | WriteMathAction
  | ReplaceMathAction
  | NarrateAction
  | CheckpointAction
  | WorkbenchAction
  | AssessmentAction;

// ── Sequence Builder ───────────────────────────────────────────────────────

export interface TeacherWriteOptions {
  /**
   * Unique stable ID for the text item on the board.
   * Required — used by the writer to track and update the item.
   */
  id: string;

  /** The text to write progressively. */
  text: string;

  /** Logical X position of the text anchor. */
  x: number;

  /** Logical Y position of the text anchor (top-left baseline). */
  y: number;

  /**
   * Duration of the progressive writing animation in ms.
   * Default: 1400 ms
   */
  durationMs?: number;

  /**
   * Optional style overrides applied to the written text.
   */
  style?: BoardTextStyle;

  /**
   * Duration of the cursor movement from its current position to the
   * text start point, in ms.
   * Default: auto-computed from distance (minimum 350 ms, maximum 900 ms)
   * Pass 0 to skip the travel and teleport directly to the start.
   */
  travelDurationMs?: number;

  /**
   * Brief deliberate pause BEFORE writing begins, in ms.
   * Simulates the teacher gathering thought before putting pen to board.
   * Default: 400 ms
   * Pass 0 to omit the pre-write pause entirely.
   */
  preWritePauseMs?: number;

  /**
   * Resting pause AFTER writing completes, in ms.
   * Lets the viewer read what was written before the next action.
   * Default: 0 ms (no automatic rest — caller controls pacing)
   * Pass > 0 to include a natural rest after writing.
   */
  postWritePauseMs?: number;

  /**
   * If true, a MOVE action is emitted before writing.
   * If false (or travelDurationMs === 0), an APPEAR (teleport) is used.
   * Default: true
   */
  travel?: boolean;
}

/**
 * Builds the canonical "teacher writes on the board" action sequence.
 *
 * Returns a plain `TeachingAction[]` array that can be composed with other
 * actions and passed to `useTeachingSequence.run()`.
 *
 * Canonical order:
 *   [MOVE | APPEAR] → [PAUSE (pre)] → WRITE → [PAUSE (post)]
 *
 * Note: This function does NOT include an initial APPEAR action — the
 * caller is responsible for showing the cursor before the first teacherWrite.
 * This allows sequences of multiple writes without re-appearing the cursor.
 *
 * @example
 * ```ts
 * const actions: TeachingAction[] = [
 *   { kind: 'APPEAR', x: 80, y: 80 },
 *   ...teacherWrite({ id: 'title', text: 'What is a Qubit?', x: 200, y: 220 }),
 *   { kind: 'PAUSE', durationMs: 800 },
 *   ...teacherWrite({ id: 'sub',   text: '0 or 1',           x: 440, y: 360 }),
 * ];
 * await sequence.run(actions);
 * ```
 */
export function teacherWrite(opts: TeacherWriteOptions): TeachingAction[] {
  const {
    id,
    text,
    x,
    y,
    durationMs = 1400,
    style,
    travelDurationMs,
    preWritePauseMs = 400,
    postWritePauseMs = 0,
    travel = true,
  } = opts;

  const actions: TeachingAction[] = [];

  // ── 1. Travel to start point ─────────────────────────────────────────────
  const useTravel = travel && (travelDurationMs === undefined || travelDurationMs > 0);

  if (useTravel) {
    const moveDuration = travelDurationMs ?? AUTO_TRAVEL_SENTINEL;
    actions.push({ kind: 'MOVE', x, y, durationMs: moveDuration });
  } else {
    // Teleport directly (no animation)
    actions.push({ kind: 'APPEAR', x, y });
  }

  // ── 2. Pre-write deliberation pause ──────────────────────────────────────
  if (preWritePauseMs > 0) {
    actions.push({ kind: 'PAUSE', durationMs: preWritePauseMs });
  }

  // ── 3. Progressive write ─────────────────────────────────────────────────
  actions.push({ kind: 'WRITE', id, text, x, y, durationMs, style });

  // ── 4. Post-write resting pause ──────────────────────────────────────────
  if (postWritePauseMs > 0) {
    actions.push({ kind: 'PAUSE', durationMs: postWritePauseMs });
  }

  return actions;
}

// ── Internal sentinels ─────────────────────────────────────────────────────

/**
 * Sentinel value for `travelDurationMs` when the caller did not specify an
 * explicit value. The executor (`useTeachingSequence`) detects this value and
 * auto-computes travel duration from the current cursor–to–target distance.
 *
 * Range: distance × 0.75, clamped to [350, 900] ms — same formula as the
 * existing Phase 3 `useBoardWriter` travel heuristic.
 */
export const AUTO_TRAVEL_SENTINEL = -1;

// ── Phase 5: Drawing Sequence Builder ─────────────────────────────────────

export interface TeacherDrawLineOptions {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  durationMs?: number;
  style?: DrawingItemStyle;
  /** Pre-draw deliberation pause in ms. Default: 200 */
  preDrawPauseMs?: number;
  /** Post-draw resting pause in ms. Default: 0 */
  postDrawPauseMs?: number;
}

export interface TeacherDrawArrowOptions {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  durationMs?: number;
  arrowSize?: number;
  style?: DrawingItemStyle;
  preDrawPauseMs?: number;
  postDrawPauseMs?: number;
}

export interface TeacherDrawCircleOptions {
  id: string;
  cx: number;
  cy: number;
  r: number;
  durationMs?: number;
  filled?: boolean;
  style?: DrawingItemStyle;
  preDrawPauseMs?: number;
  postDrawPauseMs?: number;
}

export interface TeacherDrawRectOptions {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  durationMs?: number;
  filled?: boolean;
  style?: DrawingItemStyle;
  preDrawPauseMs?: number;
  postDrawPauseMs?: number;
}

/**
 * Builds the canonical "teacher draws on the board" sequence for a LINE.
 * Returns: [MOVE] → [PAUSE (pre)] → DRAW_LINE → [PAUSE (post)]
 */
export function teacherDrawLine(opts: TeacherDrawLineOptions): TeachingAction[] {
  const { id, x1, y1, x2, y2, durationMs = 800, style,
    preDrawPauseMs = 200, postDrawPauseMs = 0 } = opts;
  const actions: TeachingAction[] = [];
  actions.push({ kind: 'MOVE', x: x1, y: y1, durationMs: AUTO_TRAVEL_SENTINEL });
  if (preDrawPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: preDrawPauseMs });
  actions.push({ kind: 'DRAW_LINE', id, x1, y1, x2, y2, durationMs, style });
  if (postDrawPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postDrawPauseMs });
  return actions;
}

/**
 * Builds the canonical "teacher draws on the board" sequence for an ARROW.
 * Returns: [MOVE] → [PAUSE (pre)] → DRAW_ARROW → [PAUSE (post)]
 */
export function teacherDrawArrow(opts: TeacherDrawArrowOptions): TeachingAction[] {
  const { id, x1, y1, x2, y2, durationMs = 900, arrowSize, style,
    preDrawPauseMs = 200, postDrawPauseMs = 0 } = opts;
  const actions: TeachingAction[] = [];
  actions.push({ kind: 'MOVE', x: x1, y: y1, durationMs: AUTO_TRAVEL_SENTINEL });
  if (preDrawPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: preDrawPauseMs });
  actions.push({ kind: 'DRAW_ARROW', id, x1, y1, x2, y2, durationMs, arrowSize, style });
  if (postDrawPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postDrawPauseMs });
  return actions;
}

/**
 * Builds the canonical "teacher draws on the board" sequence for a CIRCLE.
 * Returns: [MOVE to top] → [PAUSE (pre)] → DRAW_CIRCLE → [PAUSE (post)]
 */
export function teacherDrawCircle(opts: TeacherDrawCircleOptions): TeachingAction[] {
  const { id, cx, cy, r, durationMs = 1200, filled, style,
    preDrawPauseMs = 200, postDrawPauseMs = 0 } = opts;
  const actions: TeachingAction[] = [];
  // Move to top of circle (12 o'clock — where drawing starts)
  actions.push({ kind: 'MOVE', x: cx, y: cy - r, durationMs: AUTO_TRAVEL_SENTINEL });
  if (preDrawPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: preDrawPauseMs });
  actions.push({ kind: 'DRAW_CIRCLE', id, cx, cy, r, durationMs, filled, style });
  if (postDrawPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postDrawPauseMs });
  return actions;
}

/**
 * Builds the canonical "teacher draws on the board" sequence for a RECTANGLE.
 * Returns: [MOVE to top-left] → [PAUSE (pre)] → DRAW_RECT → [PAUSE (post)]
 */
export function teacherDrawRect(opts: TeacherDrawRectOptions): TeachingAction[] {
  const { id, x, y, w, h, durationMs = 1000, filled, style,
    preDrawPauseMs = 200, postDrawPauseMs = 0 } = opts;
  const actions: TeachingAction[] = [];
  actions.push({ kind: 'MOVE', x, y, durationMs: AUTO_TRAVEL_SENTINEL });
  if (preDrawPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: preDrawPauseMs });
  actions.push({ kind: 'DRAW_RECT', id, x, y, w, h, durationMs, filled, style });
  if (postDrawPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postDrawPauseMs });
  return actions;
}

// ── Phase 6: Emphasis Sequence Builders ───────────────────────────────────

export interface TeacherPointOptions {
  /** Target position (x, y) or TargetInput region */
  x?: number;
  y?: number;
  target?: TargetInput;
  durationMs?: number;
  /** Deliberate pause before pointing. Default: 200ms */
  prePauseMs?: number;
  /** Deliberate pause after pointing. Default: 0ms */
  postPauseMs?: number;
}

export interface TeacherHighlightOptions {
  id: string;
  target: TargetInput;
  durationMs?: number;
  color?: string;
  persistent?: boolean;
  prePauseMs?: number;
  postPauseMs?: number;
}

export interface TeacherUnderlineOptions {
  id: string;
  target: TargetInput;
  durationMs?: number;
  style?: DrawingItemStyle;
  offsetY?: number;
  prePauseMs?: number;
  postPauseMs?: number;
}

export interface TeacherCircleTargetOptions {
  id: string;
  target: TargetInput;
  durationMs?: number;
  style?: DrawingItemStyle;
  padding?: number;
  prePauseMs?: number;
  postPauseMs?: number;
}

/**
 * Builds the canonical "teacher points at target" sequence:
 * [MOVE to target] → [PAUSE (pre)] → POINT (hold at target) → [PAUSE (post)]
 */
export function teacherPoint(opts: TeacherPointOptions): TeachingAction[] {
  const {
    durationMs = 800,
    prePauseMs = 200,
    postPauseMs = 0,
  } = opts;

  let posX = opts.x ?? 0;
  let posY = opts.y ?? 0;

  if (opts.target) {
    const reg = normalizeTargetRegion(opts.target);
    // Point at top-center of target by default
    posX = reg.x + reg.width / 2;
    posY = reg.y;
  }

  const actions: TeachingAction[] = [];
  actions.push({ kind: 'MOVE', x: posX, y: posY, durationMs: AUTO_TRAVEL_SENTINEL });
  if (prePauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: prePauseMs });
  actions.push({ kind: 'POINT', x: posX, y: posY, durationMs });
  if (postPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postPauseMs });
  return actions;
}

/**
 * Builds the canonical "teacher highlights target" sequence:
 * [MOVE towards target] → [PAUSE (pre)] → HIGHLIGHT → [PAUSE (post)]
 */
export function teacherHighlight(opts: TeacherHighlightOptions): TeachingAction[] {
  const {
    id,
    target,
    durationMs = 600,
    color,
    persistent = true,
    prePauseMs = 200,
    postPauseMs = 300,
  } = opts;

  const reg = normalizeTargetRegion(target);
  const actions: TeachingAction[] = [];

  // Move cursor near the target
  actions.push({
    kind: 'MOVE',
    x: reg.x + reg.width / 2,
    y: reg.y,
    durationMs: AUTO_TRAVEL_SENTINEL,
  });
  if (prePauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: prePauseMs });
  actions.push({
    kind: 'HIGHLIGHT',
    id,
    target: reg,
    durationMs,
    color,
    persistent,
  });
  if (postPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postPauseMs });
  return actions;
}

/**
 * Builds the canonical "teacher underlines target" sequence:
 * [MOVE to start of underline] → [PAUSE (pre)] → UNDERLINE → [PAUSE (post)]
 */
export function teacherUnderline(opts: TeacherUnderlineOptions): TeachingAction[] {
  const {
    id,
    target,
    durationMs = 800,
    style,
    offsetY = 4,
    prePauseMs = 200,
    postPauseMs = 300,
  } = opts;

  const reg = normalizeTargetRegion(target);
  const startX = reg.x;
  const startY = reg.y + reg.height + offsetY;

  const actions: TeachingAction[] = [];
  actions.push({ kind: 'MOVE', x: startX, y: startY, durationMs: AUTO_TRAVEL_SENTINEL });
  if (prePauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: prePauseMs });
  actions.push({ kind: 'UNDERLINE', id, target: reg, durationMs, style });
  if (postPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postPauseMs });
  return actions;
}

/**
 * Builds the canonical "teacher circles target" sequence:
 * [MOVE to top of target circle] → [PAUSE (pre)] → CIRCLE_TARGET → [PAUSE (post)]
 */
export function teacherCircleTarget(opts: TeacherCircleTargetOptions): TeachingAction[] {
  const {
    id,
    target,
    durationMs = 1200,
    style,
    padding = 12,
    prePauseMs = 200,
    postPauseMs = 300,
  } = opts;

  const reg = normalizeTargetRegion(target);
  const cx = reg.x + reg.width / 2;
  const cy = reg.y + reg.height / 2;
  const r = Math.max(reg.width, reg.height) / 2 + padding;

  const actions: TeachingAction[] = [];
  // Move to top of circle (12 o'clock)
  actions.push({ kind: 'MOVE', x: cx, y: cy - r, durationMs: AUTO_TRAVEL_SENTINEL });
  if (prePauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: prePauseMs });
  actions.push({ kind: 'CIRCLE_TARGET', id, target: reg, durationMs, style, padding });
  if (postPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postPauseMs });
  return actions;
}

// ── Phase 7: Teaching Caption Sequence Builders ───────────────────────────

export interface TeacherCaptionOptions extends CaptionOptions {
  /** Deliberate pause before showing caption. Default: 0ms */
  prePauseMs?: number;
  /** Deliberate pause after showing caption. Default: 0ms */
  postPauseMs?: number;
}

/**
 * Builds the canonical sequence for displaying a teaching caption:
 * [PAUSE (pre)] → CAPTION → [PAUSE (post)]
 */
export function teacherCaption(text: string, opts: TeacherCaptionOptions = {}): TeachingAction[] {
  const {
    id,
    durationMs,
    position = 'bottom',
    fontSize = 15,
    align = 'center',
    prePauseMs = 0,
    postPauseMs = 0,
  } = opts;

  const actions: TeachingAction[] = [];
  if (prePauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: prePauseMs });
  actions.push({
    kind: 'CAPTION',
    text,
    id,
    durationMs,
    position,
    fontSize,
    align,
  });
  if (postPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postPauseMs });
  return actions;
}

/**
 * Builds the sequence to hide any active caption:
 */
export function teacherHideCaption(): TeachingAction[] {
  return [{ kind: 'HIDE_CAPTION' }];
}

// ── Phase 8: Mathematical Teaching Sequence Builders ──────────────────────

export interface TeacherMathOptions {
  id?: string;
  latex: string;
  x: number;
  y: number;
  durationMs?: number;
  style?: MathItemStyle;
  replaceId?: string;
  prePauseMs?: number;
  postPauseMs?: number;
}

/**
 * Builds the canonical sequence for teaching a mathematical formula:
 * MOVE → [PAUSE (pre)] → WRITE_MATH → [PAUSE (post)]
 */
export function teacherMath(opts: TeacherMathOptions): TeachingAction[] {
  const {
    id = `math-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    latex,
    x,
    y,
    durationMs = 600,
    style,
    replaceId,
    prePauseMs = 200,
    postPauseMs = 300,
  } = opts;

  const actions: TeachingAction[] = [];
  actions.push({ kind: 'MOVE', x, y, durationMs: AUTO_TRAVEL_SENTINEL });
  if (prePauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: prePauseMs });
  actions.push({ kind: 'WRITE_MATH', id, latex, x, y, durationMs, style, replaceId });
  if (postPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postPauseMs });
  return actions;
}

/**
 * Builds the sequence for replacing an existing equation state:
 * [PAUSE (pre)] → REPLACE_MATH → [PAUSE (post)]
 */
export function teacherReplaceMath(
  id: string,
  newLatex: string,
  opts: { durationMs?: number; prePauseMs?: number; postPauseMs?: number } = {}
): TeachingAction[] {
  const { durationMs = 400, prePauseMs = 150, postPauseMs = 250 } = opts;
  const actions: TeachingAction[] = [];
  if (prePauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: prePauseMs });
  actions.push({ kind: 'REPLACE_MATH', id, newLatex, durationMs });
  if (postPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postPauseMs });
  return actions;
}

/**
 * Builds the sequence for a teacher narration cue:
 * [PAUSE (pre)] → NARRATE → [PAUSE (post)]
 */
export function teacherNarrate(
  text: string,
  durationMs: number = 3000,
  opts: NarrateOptions = {}
): TeachingAction[] {
  const {
    voice,
    rate,
    pitch,
    volume,
    prePauseMs = 0,
    postPauseMs = 0,
  } = opts;

  const actions: TeachingAction[] = [];
  if (prePauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: prePauseMs });
  actions.push({
    kind: 'NARRATE',
    text,
    durationMs,
    voice,
    rate,
    pitch,
    volume,
  });
  if (postPauseMs > 0) actions.push({ kind: 'PAUSE', durationMs: postPauseMs });
  return actions;
}

/**
 * Builds a teacher prediction checkpoint action:
 */
export function teacherCheckpoint(
  id: string,
  question: string,
  options: CheckpointOption[],
  correct: string,
  explanation: string
): TeachingAction[] {
  return [
    {
      kind: 'CHECKPOINT',
      id,
      question,
      options,
      correct,
      explanation,
      durationMs: 0,
    },
  ];
}

/**
 * Builds a teacher Workbench transition action:
 */
export function teacherWorkbench(
  id: string,
  title: string,
  description: string,
  setup: WorkbenchSetup,
  formula?: string,
  explanation?: WorkbenchExplanation
): TeachingAction[] {
  return [
    {
      kind: 'WORKBENCH',
      id,
      title,
      description,
      setup,
      formula,
      explanation,
      durationMs: 0,
    },
  ];
}

/**
 * Builds a teacher Assessment action:
 */
export function teacherAssessment(
  id: string,
  question: string,
  options: AssessmentOption[],
  correct: string,
  explanation: string,
  concept?: string
): TeachingAction[] {
  return [
    {
      kind: 'ASSESSMENT',
      id,
      question,
      options,
      correct,
      explanation,
      concept,
      durationMs: 0,
    },
  ];
}






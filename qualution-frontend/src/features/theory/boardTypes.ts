/**
 * boardTypes.ts
 *
 * TypeScript type definitions for the Theory Board teaching system.
 * This is intentionally separate from `src/features/teaching/types.ts`
 * (which is circuit/workbench-oriented). The board system operates only on
 * a blank digital teaching board — no gates, no drag-drop, no workbench.
 *
 * Coordinate system: All x/y values are in a logical 1200×700 viewport.
 * The TheoryBoard component scales this to the actual pixel dimensions at
 * render time so lessons look identical on any screen size.
 */

// ── Playback State ────────────────────────────────────────────────────────

export type BoardPlaybackState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'COMPLETED' | 'ERROR';

// ── Board Actions ─────────────────────────────────────────────────────────

/** Write plain text at a board position, revealing it progressively (typewriter). */
export interface WriteTextAction {
  type: 'WRITE_TEXT';
  /** The text to write. Supports newlines. */
  text: string;
  /** Logical X position (0–1200). */
  x: number;
  /** Logical Y position (0–700). */
  y: number;
  /** Font size in logical units. Default: 28. */
  fontSize?: number;
  /** CSS color string. Default: '#e8e8e8' (chalk white). */
  color?: string;
  /** Font weight. Default: 'normal'. */
  fontWeight?: 'normal' | 'bold';
  /** Font style. Default: 'normal'. */
  fontStyle?: 'normal' | 'italic';
  /** Total time in ms to write the full text. Default: characters × 40ms. */
  duration?: number;
  /** Unique ID so this text item can be highlighted or referenced later. */
  itemId?: string;
}

/** Render a LaTeX formula at a board position. Appears after a brief cursor pause. */
export interface WriteMathAction {
  type: 'WRITE_MATH';
  /** LaTeX string (without $…$ delimiters). e.g. "H|0\\rangle = |+\\rangle". */
  latex: string;
  x: number;
  y: number;
  /** Font scale multiplier. Default: 1.0 (≈ 22px base). */
  scale?: number;
  /** CSS color. Default: '#f5c842' (chalk yellow). */
  color?: string;
  /** Delay in ms before the formula appears (cursor pauses here first). Default: 400. */
  duration?: number;
  /** Unique ID for later reference. */
  itemId?: string;
}

/** Draw a straight line between two points, animated progressively. */
export interface DrawLineAction {
  type: 'DRAW_LINE';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** CSS color. Default: '#e8e8e8'. */
  color?: string;
  /** Stroke width in logical units. Default: 2. */
  strokeWidth?: number;
  /** Time in ms to draw the line. Default: 500. */
  duration?: number;
  /** If true, draws a dashed line. */
  dashed?: boolean;
}

/** Draw an arrow from (x1,y1) to (x2,y2) with an arrowhead, animated. */
export interface DrawArrowAction {
  type: 'DRAW_ARROW';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  strokeWidth?: number;
  /** Time in ms to draw. Default: 600. */
  duration?: number;
}

/** Draw a rectangle outline, animated progressively. */
export interface DrawRectAction {
  type: 'DRAW_RECT';
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  strokeWidth?: number;
  /** Fill color (transparent by default). */
  fillColor?: string;
  duration?: number;
}

/** Draw a circle outline, animated progressively. */
export interface DrawCircleAction {
  type: 'DRAW_CIRCLE';
  cx: number;
  cy: number;
  r: number;
  color?: string;
  strokeWidth?: number;
  fillColor?: string;
  duration?: number;
}

/** Draw an underline beneath a specific board region. */
export interface DrawUnderlineAction {
  type: 'DRAW_UNDERLINE';
  x: number;
  y: number;
  /** Width of the underline in logical units. */
  width: number;
  color?: string;
  strokeWidth?: number;
  duration?: number;
}

/** Highlight a rectangular region with a semi-transparent overlay. */
export interface HighlightAction {
  type: 'HIGHLIGHT';
  x: number;
  y: number;
  w: number;
  h: number;
  /** CSS color with alpha. Default: 'rgba(255, 200, 50, 0.25)'. */
  color?: string;
  /** Duration in ms before the highlight fades. 0 = permanent. Default: 0. */
  duration?: number;
  /** If true, highlight pulses to draw attention. Default: false. */
  pulse?: boolean;
}

/** Move the teaching cursor to a logical board position. */
export interface MoveCursorAction {
  type: 'MOVE_CURSOR';
  x: number;
  y: number;
  /** If true, cursor moves fast (no bezier arc, snap-like). Default: false. */
  fast?: boolean;
}

/** Point the cursor at a board position and hold briefly. */
export interface PointAction {
  type: 'POINT';
  x: number;
  y: number;
  /** How long to hold the pointer in ms. Default: 800. */
  duration?: number;
  /** Optional label to show near cursor tip. */
  label?: string;
}

/** Speak narration text. Runs concurrently with following board actions unless awaited. */
export interface NarrateAction {
  type: 'NARRATE';
  text: string;
  /** If true, the engine waits for speech to finish before next action. Default: true. */
  await?: boolean;
}

/**
 * Pause the lesson for a duration. Optionally show a narration label.
 * Learner sees a "pulsing" board — all drawn content stays visible.
 */
export interface PauseAction {
  type: 'PAUSE';
  /** Pause duration in ms. */
  duration: number;
  /** Short text shown in caption during the pause. */
  caption?: string;
}

/** Clear all drawn content from the board (like erasing a blackboard). */
export interface ClearBoardAction {
  type: 'CLEAR_BOARD';
  /** If true, clears with a smooth wipe animation. Default: true. */
  animated?: boolean;
}

/** Erase a specific rectangular region. */
export interface EraseRegionAction {
  type: 'ERASE_REGION';
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Draw a simple qubit wire with optional label. */
export interface DrawQubitWireAction {
  type: 'DRAW_QUBIT_WIRE';
  /** Start X of the wire. */
  x: number;
  /** Y position of the wire. */
  y: number;
  /** Length of the wire. */
  length: number;
  /** Label shown at the left of the wire, e.g. "|0⟩". */
  label?: string;
  /** Color. Default: '#e8e8e8'. */
  color?: string;
  duration?: number;
}

/** Draw a gate box on a qubit wire at a specific horizontal position. */
export interface DrawGateBoxAction {
  type: 'DRAW_GATE_BOX';
  /** X center of the gate box. */
  cx: number;
  /** Y center of the gate box. */
  cy: number;
  /** Gate label e.g. "H", "X", "CNOT". */
  label: string;
  /** Box size. Default: 40. */
  size?: number;
  /** Box color. Default: '#1a6fff'. */
  color?: string;
  duration?: number;
}

/** Draw a measurement symbol (⟨M⟩ box with a gauge arc) on a wire. */
export interface DrawMeasureSymbolAction {
  type: 'DRAW_MEASURE_SYMBOL';
  cx: number;
  cy: number;
  size?: number;
  duration?: number;
}

// ── Union of all board actions ────────────────────────────────────────────

export type BoardAction =
  | WriteTextAction
  | WriteMathAction
  | DrawLineAction
  | DrawArrowAction
  | DrawRectAction
  | DrawCircleAction
  | DrawUnderlineAction
  | HighlightAction
  | MoveCursorAction
  | PointAction
  | NarrateAction
  | PauseAction
  | ClearBoardAction
  | EraseRegionAction
  | DrawQubitWireAction
  | DrawGateBoxAction
  | DrawMeasureSymbolAction;

// ── Lesson Structure ──────────────────────────────────────────────────────

export interface BoardTeachingStep {
  /** Unique identifier for this step. */
  id: string;
  /** Optional title shown in progress bar. */
  title?: string;
  /**
   * Primary narration spoken as this step begins.
   * Can also be triggered via a NARRATE action within the step.
   */
  narration?: string;
  /** Ordered list of actions the engine executes. */
  actions: BoardAction[];
}

export interface BoardLessonScript {
  /** Unique ID. Convention: 't{sprint}-{slug}'. e.g. 't1-classical-to-quantum'. */
  id: string;
  /** Display title. */
  title: string;
  /** Topic tag. */
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  /** Shown before lesson starts. */
  learningObjectives: string[];
  steps: BoardTeachingStep[];
  /**
   * If set, a "Try This in the Workbench" CTA is shown at lesson end
   * pointing to this circuit lesson ID.
   */
  transitionToLessonId?: string;
  /**
   * If set, the practical lesson label is shown in the CTA button.
   */
  transitionLabel?: string;
}

// ── Engine State ──────────────────────────────────────────────────────────

export interface BoardEngineState {
  playback: BoardPlaybackState;
  currentStepIndex: number;
  totalSteps: number;
  /** Caption text from current narration or pause. */
  caption: string;
  /** Whether speech synthesis is actively speaking. */
  isSpeaking: boolean;
  /** Cursor logical position. */
  cursorX: number;
  cursorY: number;
  cursorVisible: boolean;
  /** Annotation mode on the cursor. */
  cursorAnnotation?: 'circle' | 'arrow' | 'underline';
  /** Progress 0.0 – 1.0 through the whole lesson. */
  progress: number;
  error: string | null;
}

// ── Painted Items (what the board remembers) ──────────────────────────────

export type PaintedItemKind =
  | 'text'
  | 'math'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'underline'
  | 'highlight'
  | 'qubit-wire'
  | 'gate-box'
  | 'measure-symbol';

export interface PaintedItem {
  id: string;
  kind: PaintedItemKind;
  /** Progressive reveal progress 0.0 – 1.0. 1.0 = fully visible. */
  progress: number;
  /** Whether the item is fading out. */
  fading?: boolean;
  data: BoardAction;
}

export type BoardSubscriber = (state: BoardEngineState) => void;

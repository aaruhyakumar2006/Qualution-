/**
 * declarativeLesson.ts
 *
 * PHASE 9: Declarative JSON Lesson Schema, Validator, and Normalizer.
 *
 * Core principles:
 * - A lesson is purely declarative DATA, not executable code.
 * - Absolutely NO eval(), Function(), arbitrary JS, or media blobs.
 * - Validates schema, types, coordinates, durations, and security before execution.
 * - Normalizes declarative actions into canonical TeachingAction[] for the executor.
 */

import type {
  TeachingAction,
  MathItemStyle,
  DrawingItemStyle,
  CaptionPositionPreset,
  CaptionAlignPreset,
} from './teachingActions';
import type { BoardTextStyle } from '../../hooks/useBoardWriter';
import { AUTO_TRAVEL_SENTINEL } from './teachingActions';

// ── Declarative Action Types ───────────────────────────────────────────────

export interface MoveActionDecl {
  type: 'MOVE';
  x: number;
  y: number;
  duration?: number;
}

export interface WriteActionDecl {
  type: 'WRITE';
  id?: string;
  text: string;
  x: number;
  y: number;
  duration?: number;
  style?: BoardTextStyle;
  cursorMoveDuration?: number;
}

export interface DrawActionDecl {
  type: 'DRAW';
  id?: string;
  shape: 'line' | 'arrow' | 'circle' | 'rect' | 'rectangle';
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
  radius?: number;
  x?: number;
  y?: number;
  w?: number;
  width?: number;
  h?: number;
  height?: number;
  duration?: number;
  style?: DrawingItemStyle;
}

export interface PointActionDecl {
  type: 'POINT';
  x: number;
  y: number;
  duration?: number;
}

export interface HighlightActionDecl {
  type: 'HIGHLIGHT';
  id?: string;
  x: number;
  y: number;
  width?: number;
  w?: number;
  height?: number;
  h?: number;
  duration?: number;
  color?: string;
  persistent?: boolean;
}

export interface UnderlineActionDecl {
  type: 'UNDERLINE';
  id?: string;
  x: number;
  y: number;
  width?: number;
  w?: number;
  duration?: number;
  style?: DrawingItemStyle;
}

export interface CircleActionDecl {
  type: 'CIRCLE';
  id?: string;
  x: number;
  y: number;
  radius?: number;
  r?: number;
  width?: number;
  w?: number;
  height?: number;
  h?: number;
  duration?: number;
  style?: DrawingItemStyle;
}

export interface PauseActionDecl {
  type: 'PAUSE';
  duration: number;
}

export interface CaptionActionDecl {
  type: 'CAPTION';
  id?: string;
  text: string;
  position?: CaptionPositionPreset;
  fontSize?: number;
  align?: CaptionAlignPreset;
  duration?: number;
}

export interface HideCaptionActionDecl {
  type: 'HIDE_CAPTION';
  duration?: number;
}

export interface MathActionDecl {
  type: 'MATH';
  id?: string;
  expression?: string;
  latex?: string;
  x: number;
  y: number;
  duration?: number;
  style?: MathItemStyle;
  replaceId?: string;
}

export interface ReplaceMathActionDecl {
  type: 'REPLACE_MATH';
  id: string;
  expression?: string;
  newLatex?: string;
  latex?: string;
  duration?: number;
}

export interface NarrateActionDecl {
  type: 'NARRATE';
  text: string;
  duration?: number;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface CheckpointOptionDecl {
  id: string;
  text: string;
}

export interface CheckpointActionDecl {
  type: 'CHECKPOINT';
  id: string;
  question: string;
  options: CheckpointOptionDecl[];
  correct: string;
  explanation: string;
}

export interface WorkbenchGateDecl {
  gate: string;
  qubit: number;
  column?: number;
}

export interface WorkbenchSetupDecl {
  qubits: number;
  gates?: WorkbenchGateDecl[];
  measure?: boolean;
  shots?: number;
}

export interface WorkbenchExplanationDecl {
  title?: string;
  math?: string[];
  text: string;
}

export interface WorkbenchActionDecl {
  type: 'WORKBENCH';
  id?: string;
  title?: string;
  description?: string;
  formula?: string;
  setup: WorkbenchSetupDecl;
  explanation?: WorkbenchExplanationDecl;
  duration?: number;
}

export interface AssessmentOptionDecl {
  id: string;
  text: string;
}

export interface AssessmentActionDecl {
  type: 'ASSESSMENT';
  id: string;
  question: string;
  options: AssessmentOptionDecl[];
  correct: string;
  explanation: string;
  concept?: string;
  duration?: number;
}

export type DeclarativeAction =
  | MoveActionDecl
  | WriteActionDecl
  | DrawActionDecl
  | PointActionDecl
  | HighlightActionDecl
  | UnderlineActionDecl
  | CircleActionDecl
  | PauseActionDecl
  | CaptionActionDecl
  | HideCaptionActionDecl
  | MathActionDecl
  | ReplaceMathActionDecl
  | NarrateActionDecl
  | CheckpointActionDecl
  | WorkbenchActionDecl
  | AssessmentActionDecl;

// ── Declarative Lesson Document ────────────────────────────────────────────

export interface DeclarativeLessonDefaults {
  duration?: number;
  color?: string;
  mathColor?: string;
  textStyle?: BoardTextStyle;
}

export interface DeclarativeLesson {
  version: number;
  id: string;
  title: string;
  description?: string;
  concepts?: string[];
  misconceptions?: string[];
  defaults?: DeclarativeLessonDefaults;
  actions: DeclarativeAction[];
}

export interface LessonValidationResult {
  valid: boolean;
  errors: string[];
  lesson?: DeclarativeLesson;
}

// ── Security & Validation ──────────────────────────────────────────────────

const FORBIDDEN_SECURITY_PATTERNS = [
  /<script\b/i,
  /javascript:/i,
  /eval\s*\(/i,
  /Function\s*\(/i,
  /__proto__/i,
  /constructor\s*\.\s*constructor/i,
];

function checkSecurity(val: unknown, path: string, errors: string[]) {
  if (typeof val === 'string') {
    for (const pat of FORBIDDEN_SECURITY_PATTERNS) {
      if (pat.test(val)) {
        errors.push(`Security violation at ${path}: forbidden executable pattern detected`);
      }
    }
  } else if (typeof val === 'object' && val !== null) {
    for (const [k, v] of Object.entries(val)) {
      checkSecurity(v, `${path}.${k}`, errors);
    }
  }
}

function isNumber(val: unknown): val is number {
  return typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val);
}

export function validateDeclarativeLesson(input: unknown): LessonValidationResult {
  const errors: string[] = [];

  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Lesson must be a non-null JSON object'] };
  }

  // Security scan across entire payload
  checkSecurity(input, 'root', errors);
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const raw = input as Record<string, unknown>;

  // 1. Version check
  if (raw.version !== 1) {
    errors.push(`Invalid lesson version: expected 1, received ${String(raw.version)}`);
  }

  // 2. ID check
  if (typeof raw.id !== 'string' || raw.id.trim().length === 0) {
    errors.push('Lesson "id" is required and must be a non-empty string');
  }

  // 3. Title check
  if (typeof raw.title !== 'string' || raw.title.trim().length === 0) {
    errors.push('Lesson "title" is required and must be a non-empty string');
  }

  // Concepts & Misconceptions metadata check
  if (raw.concepts !== undefined) {
    if (!Array.isArray(raw.concepts) || raw.concepts.some((c) => typeof c !== 'string' || c.trim().length === 0)) {
      errors.push('Lesson "concepts" must be an array of non-empty strings');
    }
  }

  if (raw.misconceptions !== undefined) {
    if (!Array.isArray(raw.misconceptions) || raw.misconceptions.some((m) => typeof m !== 'string' || m.trim().length === 0)) {
      errors.push('Lesson "misconceptions" must be an array of non-empty strings');
    }
  }

  // 4. Actions array check
  if (!Array.isArray(raw.actions)) {
    errors.push('Lesson "actions" is required and must be an array');
    return { valid: false, errors };
  }

  if (raw.actions.length === 0) {
    errors.push('Lesson "actions" array must contain at least one action');
  }

  // 5. Per-action validation
  raw.actions.forEach((act, idx) => {
    const p = `actions[${idx}]`;
    if (typeof act !== 'object' || act === null) {
      errors.push(`${p} must be a valid object`);
      return;
    }

    const a = act as Record<string, unknown>;
    const type = a.type;

    if (typeof type !== 'string') {
      errors.push(`${p}.type is required and must be a string`);
      return;
    }

    switch (type) {
      case 'MOVE':
        if (!isNumber(a.x) || !isNumber(a.y)) {
          errors.push(`${p} (MOVE) requires numeric "x" and "y" coordinates`);
        }
        break;

      case 'WRITE':
        if (typeof a.text !== 'string' || a.text.length === 0) {
          errors.push(`${p} (WRITE) requires a non-empty "text" string`);
        }
        if (!isNumber(a.x) || !isNumber(a.y)) {
          errors.push(`${p} (WRITE) requires numeric "x" and "y" coordinates`);
        }
        break;

      case 'DRAW': {
        const shape = a.shape;
        const validShapes = ['line', 'arrow', 'circle', 'rect', 'rectangle'];
        if (typeof shape !== 'string' || !validShapes.includes(shape)) {
          errors.push(`${p} (DRAW) invalid "shape": must be one of ${validShapes.join(', ')}`);
          break;
        }
        if (shape === 'line' || shape === 'arrow') {
          if (!isNumber(a.x1) || !isNumber(a.y1) || !isNumber(a.x2) || !isNumber(a.y2)) {
            errors.push(`${p} (DRAW ${shape}) requires numeric "x1", "y1", "x2", "y2"`);
          }
        } else if (shape === 'circle') {
          const hasCenter = isNumber(a.cx) && isNumber(a.cy) && (isNumber(a.r) || isNumber(a.radius));
          const hasPos = isNumber(a.x) && isNumber(a.y);
          if (!hasCenter && !hasPos) {
            errors.push(`${p} (DRAW circle) requires coordinates ("cx","cy","r" or "x","y","radius")`);
          }
        } else if (shape === 'rect' || shape === 'rectangle') {
          const w = a.width ?? a.w;
          const h = a.height ?? a.h;
          if (!isNumber(a.x) || !isNumber(a.y) || !isNumber(w) || !isNumber(h)) {
            errors.push(`${p} (DRAW rect) requires numeric "x", "y", "width" (or "w"), and "height" (or "h")`);
          }
        }
        break;
      }

      case 'POINT':
        if (!isNumber(a.x) || !isNumber(a.y)) {
          errors.push(`${p} (POINT) requires numeric "x" and "y" coordinates`);
        }
        break;

      case 'HIGHLIGHT': {
        const w = a.width ?? a.w;
        const h = a.height ?? a.h;
        if (!isNumber(a.x) || !isNumber(a.y) || !isNumber(w) || !isNumber(h)) {
          errors.push(`${p} (HIGHLIGHT) requires numeric "x", "y", "width", and "height"`);
        }
        break;
      }

      case 'UNDERLINE': {
        const w = a.width ?? a.w;
        if (!isNumber(a.x) || !isNumber(a.y) || !isNumber(w)) {
          errors.push(`${p} (UNDERLINE) requires numeric "x", "y", and "width"`);
        }
        break;
      }

      case 'CIRCLE': {
        const r = a.radius ?? a.r;
        const w = a.width ?? a.w;
        if (!isNumber(a.x) || !isNumber(a.y) || (!isNumber(r) && !isNumber(w))) {
          errors.push(`${p} (CIRCLE) requires numeric "x", "y", and "radius" (or "width")`);
        }
        break;
      }

      case 'PAUSE':
        if (!isNumber(a.duration) || a.duration < 0) {
          errors.push(`${p} (PAUSE) requires a non-negative numeric "duration"`);
        }
        break;

      case 'CAPTION':
        if (typeof a.text !== 'string' || a.text.trim().length === 0) {
          errors.push(`${p} (CAPTION) requires a non-empty "text" string`);
        }
        break;

      case 'HIDE_CAPTION':
        break;

      case 'MATH': {
        const latex = a.expression ?? a.latex;
        if (typeof latex !== 'string' || latex.trim().length === 0) {
          errors.push(`${p} (MATH) requires a non-empty "expression" or "latex" string`);
        }
        if (!isNumber(a.x) || !isNumber(a.y)) {
          errors.push(`${p} (MATH) requires numeric "x" and "y" coordinates`);
        }
        break;
      }

      case 'REPLACE_MATH': {
        if (typeof a.id !== 'string' || a.id.trim().length === 0) {
          errors.push(`${p} (REPLACE_MATH) requires a target "id" string`);
        }
        const latex = a.expression ?? a.newLatex ?? a.latex;
        if (typeof latex !== 'string' || latex.trim().length === 0) {
          errors.push(`${p} (REPLACE_MATH) requires a non-empty "expression" or "newLatex" string`);
        }
        break;
      }

      case 'NARRATE': {
        if (typeof a.text !== 'string' || a.text.trim().length === 0) {
          errors.push(`${p} (NARRATE) requires a non-empty "text" string`);
        }
        if (a.duration !== undefined && (!isNumber(a.duration) || a.duration < 0)) {
          errors.push(`${p} (NARRATE) "duration" must be a non-negative number`);
        }
        if (a.rate !== undefined && (!isNumber(a.rate) || a.rate <= 0 || a.rate > 4)) {
          errors.push(`${p} (NARRATE) "rate" must be a positive number between 0.1 and 4`);
        }
        if (a.pitch !== undefined && (!isNumber(a.pitch) || a.pitch < 0 || a.pitch > 2)) {
          errors.push(`${p} (NARRATE) "pitch" must be a number between 0 and 2`);
        }
        if (a.volume !== undefined && (!isNumber(a.volume) || a.volume < 0 || a.volume > 1)) {
          errors.push(`${p} (NARRATE) "volume" must be a number between 0 and 1`);
        }
        if (a.voice !== undefined && (typeof a.voice !== 'string' || a.voice.trim().length === 0)) {
          errors.push(`${p} (NARRATE) "voice" must be a non-empty string`);
        }
        break;
      }

      case 'CHECKPOINT': {
        if (typeof a.id !== 'string' || a.id.trim().length === 0) {
          errors.push(`${p} (CHECKPOINT) requires a non-empty "id" string`);
        }
        if (typeof a.question !== 'string' || a.question.trim().length === 0) {
          errors.push(`${p} (CHECKPOINT) requires a non-empty "question" string`);
        }
        if (!Array.isArray(a.options) || a.options.length < 2) {
          errors.push(`${p} (CHECKPOINT) requires an "options" array with at least 2 items`);
        } else {
          const seenOptionIds = new Set<string>();
          for (let oIdx = 0; oIdx < a.options.length; oIdx++) {
            const opt = a.options[oIdx];
            if (typeof opt !== 'object' || opt === null) {
              errors.push(`${p}.options[${oIdx}] must be a valid object`);
              continue;
            }
            const optObj = opt as Record<string, unknown>;
            if (typeof optObj.id !== 'string' || optObj.id.trim().length === 0) {
              errors.push(`${p}.options[${oIdx}] requires a non-empty "id" string`);
            } else {
              if (seenOptionIds.has(optObj.id)) {
                errors.push(`${p}.options[${oIdx}] has duplicate option id "${optObj.id}"`);
              }
              seenOptionIds.add(optObj.id);
            }
            if (typeof optObj.text !== 'string' || optObj.text.trim().length === 0) {
              errors.push(`${p}.options[${oIdx}] requires a non-empty "text" string`);
            }
          }
          if (typeof a.correct !== 'string' || !seenOptionIds.has(a.correct)) {
            errors.push(`${p} (CHECKPOINT) "correct" must match one of the valid option IDs`);
          }
        }
        if (typeof a.explanation !== 'string' || a.explanation.trim().length === 0) {
          errors.push(`${p} (CHECKPOINT) requires a non-empty "explanation" string`);
        }
        break;
      }

      case 'WORKBENCH': {
        if (a.id !== undefined && (typeof a.id !== 'string' || a.id.trim().length === 0)) {
          errors.push(`${p} (WORKBENCH) "id" must be a non-empty string`);
        }
        if (a.title !== undefined && typeof a.title !== 'string') {
          errors.push(`${p} (WORKBENCH) "title" must be a string`);
        }
        if (a.description !== undefined && typeof a.description !== 'string') {
          errors.push(`${p} (WORKBENCH) "description" must be a string`);
        }
        if (a.formula !== undefined && typeof a.formula !== 'string') {
          errors.push(`${p} (WORKBENCH) "formula" must be a string`);
        }
        if (typeof a.setup !== 'object' || a.setup === null) {
          errors.push(`${p} (WORKBENCH) requires a "setup" object`);
        } else {
          const s = a.setup as Record<string, unknown>;
          if (!isNumber(s.qubits) || !Number.isInteger(s.qubits) || (s.qubits as number) < 1 || (s.qubits as number) > 10) {
            errors.push(`${p}.setup requires integer "qubits" between 1 and 10`);
          }
          const numQubits = isNumber(s.qubits) ? (s.qubits as number) : 1;
          if (s.gates !== undefined) {
            if (!Array.isArray(s.gates)) {
              errors.push(`${p}.setup.gates must be an array`);
            } else {
              for (let gIdx = 0; gIdx < s.gates.length; gIdx++) {
                const g = s.gates[gIdx];
                if (typeof g !== 'object' || g === null) {
                  errors.push(`${p}.setup.gates[${gIdx}] must be a valid object`);
                  continue;
                }
                const gObj = g as Record<string, unknown>;
                if (typeof gObj.gate !== 'string' || gObj.gate.trim().length === 0) {
                  errors.push(`${p}.setup.gates[${gIdx}] requires a non-empty "gate" string`);
                }
                if (!isNumber(gObj.qubit) || !Number.isInteger(gObj.qubit) || (gObj.qubit as number) < 0 || (gObj.qubit as number) >= numQubits) {
                  errors.push(`${p}.setup.gates[${gIdx}] requires a valid "qubit" index in range [0, ${numQubits - 1}]`);
                }
              }
            }
          }
          if (s.measure !== undefined && typeof s.measure !== 'boolean') {
            errors.push(`${p}.setup.measure must be a boolean`);
          }
          if (s.shots !== undefined && (!isNumber(s.shots) || (s.shots as number) <= 0 || (s.shots as number) > 10000)) {
            errors.push(`${p}.setup.shots must be a positive integer <= 10000`);
          }
        }
        if (a.explanation !== undefined) {
          if (typeof a.explanation !== 'object' || a.explanation === null) {
            errors.push(`${p}.explanation must be a valid object`);
          } else {
            const exp = a.explanation as Record<string, unknown>;
            if (typeof exp.text !== 'string' || exp.text.trim().length === 0) {
              errors.push(`${p}.explanation requires a non-empty "text" string`);
            }
            if (exp.title !== undefined && typeof exp.title !== 'string') {
              errors.push(`${p}.explanation "title" must be a string`);
            }
            if (exp.math !== undefined) {
              if (!Array.isArray(exp.math)) {
                errors.push(`${p}.explanation "math" must be an array of LaTeX strings`);
              } else {
                for (let mIdx = 0; mIdx < exp.math.length; mIdx++) {
                  if (typeof exp.math[mIdx] !== 'string' || (exp.math[mIdx] as string).trim().length === 0) {
                    errors.push(`${p}.explanation.math[${mIdx}] must be a non-empty string`);
                  }
                }
              }
            }
          }
        }
        break;
      }

      case 'ASSESSMENT': {
        if (typeof a.id !== 'string' || a.id.trim().length === 0) {
          errors.push(`${p} (ASSESSMENT) requires a non-empty "id" string`);
        }
        if (typeof a.question !== 'string' || a.question.trim().length === 0) {
          errors.push(`${p} (ASSESSMENT) requires a non-empty "question" string`);
        }
        if (!Array.isArray(a.options) || a.options.length < 2) {
          errors.push(`${p} (ASSESSMENT) requires an "options" array with at least 2 items`);
        } else {
          const optIds = new Set<string>();
          for (let oIdx = 0; oIdx < a.options.length; oIdx++) {
            const opt = a.options[oIdx];
            if (typeof opt !== 'object' || opt === null) {
              errors.push(`${p}.options[${oIdx}] must be a valid object`);
              continue;
            }
            const optObj = opt as Record<string, unknown>;
            if (typeof optObj.id !== 'string' || optObj.id.trim().length === 0) {
              errors.push(`${p}.options[${oIdx}] requires a non-empty "id" string`);
            } else if (optIds.has(optObj.id)) {
              errors.push(`${p}.options[${oIdx}] duplicate option id "${optObj.id}"`);
            } else {
              optIds.add(optObj.id);
            }
            if (typeof optObj.text !== 'string' || optObj.text.trim().length === 0) {
              errors.push(`${p}.options[${oIdx}] requires a non-empty "text" string`);
            }
          }
          if (typeof a.correct !== 'string' || !optIds.has(a.correct)) {
            errors.push(`${p} (ASSESSMENT) "correct" must match one of the valid option IDs`);
          }
        }
        if (typeof a.explanation !== 'string' || a.explanation.trim().length === 0) {
          errors.push(`${p} (ASSESSMENT) requires a non-empty "explanation" string`);
        }
        if (a.concept !== undefined && (typeof a.concept !== 'string' || a.concept.trim().length === 0)) {
          errors.push(`${p} (ASSESSMENT) "concept" must be a non-empty string`);
        }
        break;
      }

      default:
        errors.push(`${p} unknown action type "${String(type)}"`);
        break;
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    lesson: input as DeclarativeLesson,
  };
}

// ── Normalizer ─────────────────────────────────────────────────────────────

/**
 * Normalizes duration values:
 * If duration is <= 20, assumes seconds and converts to milliseconds.
 * If duration > 20, assumes milliseconds.
 */
function toDurationMs(dur: number | undefined, defaultMs: number): number {
  if (dur === undefined) return defaultMs;
  return dur <= 20 ? Math.round(dur * 1000) : Math.round(dur);
}

let autoIdCounter = 0;
function nextAutoId(prefix: string): string {
  return `${prefix}-${++autoIdCounter}`;
}

export function normalizeDeclarativeLesson(lesson: DeclarativeLesson): TeachingAction[] {
  const actions: TeachingAction[] = [];
  const defaults = lesson.defaults;
  const defaultDurationMs = toDurationMs(defaults?.duration, 1000);

  for (const act of lesson.actions) {
    switch (act.type) {
      case 'MOVE': {
        const durationMs = toDurationMs(act.duration, AUTO_TRAVEL_SENTINEL);
        actions.push({ kind: 'MOVE', x: act.x, y: act.y, durationMs });
        break;
      }

      case 'WRITE': {
        const id = act.id ?? nextAutoId('text');
        const durationMs = toDurationMs(act.duration, defaultDurationMs);
        const style = { ...defaults?.textStyle, ...act.style };
        // Auto-lead with move if not already at position
        actions.push({ kind: 'MOVE', x: act.x, y: act.y, durationMs: AUTO_TRAVEL_SENTINEL });
        actions.push({ kind: 'WRITE', id, text: act.text, x: act.x, y: act.y, durationMs, style });
        break;
      }

      case 'DRAW': {
        const id = act.id ?? nextAutoId('draw');
        const durationMs = toDurationMs(act.duration, 800);
        const shape = act.shape;

        if (shape === 'line') {
          actions.push({
            kind: 'DRAW_LINE',
            id,
            x1: act.x1!,
            y1: act.y1!,
            x2: act.x2!,
            y2: act.y2!,
            durationMs,
            style: act.style,
          });
        } else if (shape === 'arrow') {
          actions.push({
            kind: 'DRAW_ARROW',
            id,
            x1: act.x1!,
            y1: act.y1!,
            x2: act.x2!,
            y2: act.y2!,
            durationMs,
            style: act.style,
          });
        } else if (shape === 'circle') {
          const cx = act.cx ?? act.x!;
          const cy = act.cy ?? act.y!;
          const r = act.r ?? act.radius ?? 30;
          actions.push({
            kind: 'DRAW_CIRCLE',
            id,
            cx,
            cy,
            r,
            durationMs,
            style: act.style,
          });
        } else if (shape === 'rect' || shape === 'rectangle') {
          const w = act.width ?? act.w!;
          const h = act.height ?? act.h!;
          actions.push({
            kind: 'DRAW_RECT',
            id,
            x: act.x!,
            y: act.y!,
            w,
            h,
            durationMs,
            style: act.style,
          });
        }
        break;
      }

      case 'POINT': {
        const durationMs = toDurationMs(act.duration, 800);
        actions.push({ kind: 'POINT', x: act.x, y: act.y, durationMs });
        break;
      }

      case 'HIGHLIGHT': {
        const id = act.id ?? nextAutoId('hl');
        const durationMs = toDurationMs(act.duration, 600);
        const w = act.width ?? act.w!;
        const h = act.height ?? act.h!;
        actions.push({
          kind: 'HIGHLIGHT',
          id,
          target: { x: act.x, y: act.y, width: w, height: h },
          durationMs,
          color: act.color,
          persistent: act.persistent ?? true,
        });
        break;
      }

      case 'UNDERLINE': {
        const id = act.id ?? nextAutoId('ul');
        const durationMs = toDurationMs(act.duration, 700);
        const w = act.width ?? act.w!;
        actions.push({
          kind: 'UNDERLINE',
          id,
          target: { x: act.x, y: act.y, width: w, height: 30 },
          durationMs,
          style: act.style,
        });
        break;
      }

      case 'CIRCLE': {
        const id = act.id ?? nextAutoId('circ');
        const durationMs = toDurationMs(act.duration, 900);
        const r = act.radius ?? act.r ?? (act.width ? act.width / 2 : 30);
        actions.push({
          kind: 'CIRCLE_TARGET',
          id,
          target: { x: act.x - r, y: act.y - r, width: r * 2, height: r * 2 },
          durationMs,
          style: act.style,
        });
        break;
      }

      case 'PAUSE': {
        const durationMs = toDurationMs(act.duration, 500);
        actions.push({ kind: 'PAUSE', durationMs });
        break;
      }

      case 'CAPTION': {
        const durationMs = act.duration ? toDurationMs(act.duration, 0) : 0;
        actions.push({
          kind: 'CAPTION',
          id: act.id,
          text: act.text,
          position: act.position ?? 'bottom',
          fontSize: act.fontSize ?? 16,
          align: act.align ?? 'center',
          durationMs,
        });
        break;
      }

      case 'HIDE_CAPTION': {
        actions.push({ kind: 'HIDE_CAPTION' });
        break;
      }

      case 'MATH': {
        const id = act.id ?? nextAutoId('math');
        const latex = act.expression ?? act.latex!;
        const durationMs = toDurationMs(act.duration, 400);
        actions.push({ kind: 'MOVE', x: act.x, y: act.y, durationMs: AUTO_TRAVEL_SENTINEL });
        actions.push({
          kind: 'WRITE_MATH',
          id,
          latex,
          x: act.x,
          y: act.y,
          durationMs,
          style: act.style,
          replaceId: act.replaceId,
        });
        break;
      }

      case 'REPLACE_MATH': {
        const latex = act.expression ?? act.newLatex ?? act.latex!;
        const durationMs = toDurationMs(act.duration, 350);
        actions.push({
          kind: 'REPLACE_MATH',
          id: act.id,
          newLatex: latex,
          durationMs,
        });
        break;
      }

      case 'NARRATE': {
        const durationMs = act.duration !== undefined ? toDurationMs(act.duration, 0) : 0;
        actions.push({
          kind: 'NARRATE',
          text: act.text,
          durationMs,
          voice: act.voice,
          rate: act.rate,
          pitch: act.pitch,
          volume: act.volume,
        });
        break;
      }

      case 'CHECKPOINT': {
        actions.push({
          kind: 'CHECKPOINT',
          id: act.id,
          question: act.question,
          options: act.options.map((opt) => ({ id: opt.id, text: opt.text })),
          correct: act.correct,
          explanation: act.explanation,
          durationMs: 0,
        });
        break;
      }

      case 'WORKBENCH': {
        actions.push({
          kind: 'WORKBENCH',
          id: act.id ?? nextAutoId('wb'),
          title: act.title ?? 'Try it in Quantum Workbench',
          description: act.description ?? 'Build and run the experiment in the Workbench.',
          formula: act.formula,
          setup: {
            qubits: act.setup.qubits,
            gates: act.setup.gates?.map((g) => ({
              gate: g.gate,
              qubit: g.qubit,
              column: g.column,
            })),
            measure: act.setup.measure,
            shots: act.setup.shots,
          },
          explanation: act.explanation
            ? {
                title: act.explanation.title,
                math: act.explanation.math ? [...act.explanation.math] : undefined,
                text: act.explanation.text,
              }
            : undefined,
          durationMs: 0,
        });
        break;
      }

      case 'ASSESSMENT': {
        actions.push({
          kind: 'ASSESSMENT',
          id: act.id,
          question: act.question,
          options: act.options.map((opt) => ({ id: opt.id, text: opt.text })),
          correct: act.correct,
          explanation: act.explanation,
          concept: act.concept,
          durationMs: 0,
        });
        break;
      }
    }
  }

  return actions;
}

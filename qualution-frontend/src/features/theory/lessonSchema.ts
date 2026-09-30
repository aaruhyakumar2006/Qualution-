/**
 * lessonSchema.ts
 *
 * PHASE 9 + PHASE 12: Compact JSON Schema for board lessons.
 *
 * Design goals (in priority order):
 *   1. Small file size   — single-letter opcodes, numeric coords, shared defaults
 *   2. Readability       — short but recognisable codes, inline defaults
 *   3. Deterministic     — no random, no eval, no executable code
 *   4. Extensible        — new opcodes can be added without breaking old parsers
 *   5. Validated         — every document is checked before execution
 *   6. Reusable defaults — top-level `defaults` block avoids repetition
 *   7. Reusable styles   — named style presets eliminate per-command repetition
 *   8. Reusable objects  — named visual object templates for quantum diagrams
 *   9. No binary assets  — plain JSON only; 5–80 KB target per lesson
 *
 * ── Compact Command Encoding ──────────────────────────────────────────────
 *
 *   ["m",  x, y]                     MOVE cursor to (x, y)
 *   ["w",  text, x, y]               WRITE text at (x, y)
 *   ["w",  text, x, y, scale]        WRITE text with font scale
 *   ["ws", text, x, y, styleId]      WRITE text using named style
 *   ["wm", latex, x, y]              WRITE_MATH latex at (x, y)
 *   ["wm", latex, x, y, scale]       WRITE_MATH with scale
 *   ["d",  "l", x1, y1, x2, y2]     DRAW line
 *   ["d",  "a", x1, y1, x2, y2]     DRAW arrow
 *   ["d",  "r", x, y, w, h]         DRAW rect
 *   ["d",  "c", cx, cy, r]          DRAW circle
 *   ["d",  "u", x, y, width]        DRAW underline
 *   ["h",  [x, y, w, h]]            HIGHLIGHT region
 *   ["pt", x, y]                    POINT at (x, y)
 *   ["p",  ms]                      PAUSE for ms
 *   ["clr"]                         CLEAR board
 *   ["n",  text]                    NARRATE (spoken, concurrent with visual)
 *   ["o",  objectId, x, y]          PLACE reusable object at (x, y)
 *   ["o",  objectId, x, y, scale]   PLACE reusable object with scale
 *
 * ── Styles block ──────────────────────────────────────────────────────────
 *
 *   "styles": {
 *     "title":    { "scale": 1.8, "color": "#ffffff", "bold": true },
 *     "heading":  { "scale": 1.4, "color": "#e8e8e8", "bold": true },
 *     "body":     { "scale": 1.0, "color": "#e8e8e8" },
 *     "equation": { "scale": 1.5, "color": "#f5c842" },
 *     "caption":  { "scale": 0.9, "color": "#aaaaaa", "italic": true }
 *   }
 *
 * ── Objects block ─────────────────────────────────────────────────────────
 *
 *   "objects": {
 *     "qubitWire": { "type": "qubit-wire", "length": 400, "label": "|0⟩" },
 *     "hGate":     { "type": "gate-box",   "label": "H",  "size": 40 },
 *     "measure":   { "type": "measure-symbol", "size": 40 }
 *   }
 *
 * ── Example Document ──────────────────────────────────────────────────────
 *
 * {
 *   "v": 1,
 *   "id": "qubit-intro",
 *   "title": "What is a Qubit?",
 *   "defaults": { "color": "#e8e8e8", "mathColor": "#f5c842" },
 *   "styles": {
 *     "title": { "scale": 1.8, "color": "#ffffff", "bold": true },
 *     "body":  { "scale": 1.0, "color": "#e8e8e8" }
 *   },
 *   "objects": {
 *     "hGate": { "type": "gate-box", "label": "H", "size": 40 }
 *   },
 *   "steps": [
 *     { "id": "s1", "cmds": [
 *       ["m", 400, 150],
 *       ["ws", "What is a Qubit?", 400, 150, "title"],
 *       ["p", 800]
 *     ]},
 *     { "id": "s2", "cmds": [
 *       ["o", "hGate", 500, 300],
 *       ["wm", "|0\\rangle", 300, 300]
 *     ]}
 *   ]
 * }
 */

// ── Opcode union ───────────────────────────────────────────────────────────

/** All valid first-element opcodes for a compact command tuple. */
export type CmdOpcode =
  | 'm'    // MOVE cursor
  | 'w'    // WRITE text (numeric scale)
  | 'ws'   // WRITE text with named style
  | 'wm'   // WRITE_MATH
  | 'd'    // DRAW (sub-typed by second element)
  | 'h'    // HIGHLIGHT
  | 'pt'   // POINT
  | 'p'    // PAUSE
  | 'clr'  // CLEAR
  | 'n'    // NARRATE
  | 'o';   // PLACE reusable object

/** Draw sub-type codes. */
export type DrawSubtype = 'l' | 'a' | 'r' | 'c' | 'u';

/**
 * A compact command tuple. The first element is always the opcode string.
 * Remaining elements are positional arguments (numbers, strings, or arrays).
 */
export type RawCmd = [CmdOpcode, ...unknown[]];

// ── Step ──────────────────────────────────────────────────────────────────

export interface RawStep {
  /** Unique step identifier within the lesson. */
  id: string;
  /** Optional human-readable title (shown in progress UI). */
  title?: string;
  /** Ordered list of compact commands. */
  cmds: RawCmd[];
}

// ── Defaults ──────────────────────────────────────────────────────────────

export interface LessonDefaults {
  /** Default CSS color for text and drawing commands. Default: '#e8e8e8'. */
  color?: string;
  /** Default CSS color for math items. Default: '#f5c842'. */
  mathColor?: string;
  /** Default stroke width for drawing commands. Default: 2. */
  strokeWidth?: number;
  /** Default font size scale for text commands. Default: 1.0. */
  fontSize?: number;
}

// ── Style preset ──────────────────────────────────────────────────────────

/**
 * A named style preset. Referenced by the `ws` opcode.
 * All fields are optional; unset fields fall back to lesson defaults.
 */
export interface LessonStyle {
  /** Font scale multiplier (base 28 logical units). */
  scale?: number;
  /** CSS color string. */
  color?: string;
  /** Bold text. */
  bold?: boolean;
  /** Italic text. */
  italic?: boolean;
}

// ── Object template ───────────────────────────────────────────────────────

/**
 * A named reusable visual object template. Referenced by the `o` opcode.
 * The renderer expands this into one or more board actions at the given position.
 *
 * Supported types:
 *   "qubit-wire"      — horizontal wire with optional label
 *   "gate-box"        — labelled gate rectangle
 *   "measure-symbol"  — measurement symbol
 *   "ket"             — ket state label (e.g. |0⟩)
 */
export interface LessonObject {
  /** Renderer type identifier. */
  type: 'qubit-wire' | 'gate-box' | 'measure-symbol' | 'ket';
  /** Gate/ket label text (required for gate-box and ket). */
  label?: string;
  /** Wire length in logical units (qubit-wire only). Default: 400. */
  length?: number;
  /** Symbol size in logical units. Default: 40. */
  size?: number;
  /** CSS color override. Falls back to lesson defaults. */
  color?: string;
}

// ── Lesson Document ───────────────────────────────────────────────────────

export interface LessonDoc {
  /** Schema version. Must be 1. */
  v: 1;
  /** Unique lesson identifier. Alphanumeric, dashes, underscores only. */
  id: string;
  /** Human-readable lesson title. */
  title: string;
  /** Optional topic tag (e.g. 'superposition', 'measurement'). */
  topic?: string;
  /** Optional difficulty label. */
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Optional estimated duration in minutes. */
  estimatedMinutes?: number;
  /** Optional learning objectives shown before the lesson starts. */
  objectives?: string[];
  /** Shared defaults applied to all commands that omit optional fields. */
  defaults?: LessonDefaults;
  /**
   * Named style presets. Referenced by the `ws` opcode.
   * Eliminates per-command style repetition.
   */
  styles?: Record<string, LessonStyle>;
  /**
   * Named reusable visual object templates. Referenced by the `o` opcode.
   * Enables compact representation of repeated quantum diagram components.
   */
  objects?: Record<string, LessonObject>;
  /** Ordered list of teaching steps. Must be non-empty. */
  steps: RawStep[];
}

// ── Validation ────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ID_RE = /^[a-zA-Z0-9_-]+$/;
const CSS_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)$/;

function isNum(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v);
}

function isStr(v: unknown): v is string {
  return typeof v === 'string';
}

function validateCmd(
  cmd: unknown,
  stepId: string,
  idx: number,
  errors: string[],
  knownStyles: Set<string>,
  knownObjects: Set<string>
): void {
  const prefix = `Step "${stepId}", cmd[${idx}]`;

  if (!Array.isArray(cmd) || cmd.length === 0) {
    errors.push(`${prefix}: must be a non-empty array.`);
    return;
  }

  const [op, ...args] = cmd as unknown[];

  if (!isStr(op)) {
    errors.push(`${prefix}: opcode must be a string.`);
    return;
  }

  switch (op as CmdOpcode) {
    case 'm':
      if (!isNum(args[0]) || !isNum(args[1])) {
        errors.push(`${prefix} (m): requires numeric x, y.`);
      }
      break;

    case 'w':
      if (!isStr(args[0]) || !(args[0] as string).trim()) {
        errors.push(`${prefix} (w): requires non-empty text string.`);
      }
      if (!isNum(args[1]) || !isNum(args[2])) {
        errors.push(`${prefix} (w): requires numeric x, y.`);
      }
      if (args[3] !== undefined && !isNum(args[3])) {
        errors.push(`${prefix} (w): optional scale must be a number.`);
      }
      break;

    case 'ws':
      // ["ws", text, x, y, styleId]
      if (!isStr(args[0]) || !(args[0] as string).trim()) {
        errors.push(`${prefix} (ws): requires non-empty text string.`);
      }
      if (!isNum(args[1]) || !isNum(args[2])) {
        errors.push(`${prefix} (ws): requires numeric x, y.`);
      }
      if (!isStr(args[3]) || !(args[3] as string).trim()) {
        errors.push(`${prefix} (ws): requires non-empty styleId string.`);
      } else if (knownStyles.size > 0 && !knownStyles.has(args[3] as string)) {
        errors.push(`${prefix} (ws): unknown style "${args[3]}".`);
      }
      break;

    case 'wm':
      if (!isStr(args[0]) || !(args[0] as string).trim()) {
        errors.push(`${prefix} (wm): requires non-empty latex string.`);
      }
      if (!isNum(args[1]) || !isNum(args[2])) {
        errors.push(`${prefix} (wm): requires numeric x, y.`);
      }
      if (args[3] !== undefined && !isNum(args[3])) {
        errors.push(`${prefix} (wm): optional scale must be a number.`);
      }
      break;

    case 'd': {
      const sub = args[0];
      if (!isStr(sub)) {
        errors.push(`${prefix} (d): second element must be draw subtype string.`);
        break;
      }
      switch (sub as DrawSubtype) {
        case 'l':
        case 'a':
          if (!isNum(args[1]) || !isNum(args[2]) || !isNum(args[3]) || !isNum(args[4])) {
            errors.push(`${prefix} (d/${sub}): requires x1, y1, x2, y2.`);
          }
          break;
        case 'r':
          if (!isNum(args[1]) || !isNum(args[2]) || !isNum(args[3]) || !isNum(args[4])) {
            errors.push(`${prefix} (d/r): requires x, y, w, h.`);
          }
          if (isNum(args[3]) && (args[3] as number) <= 0) {
            errors.push(`${prefix} (d/r): w must be > 0.`);
          }
          if (isNum(args[4]) && (args[4] as number) <= 0) {
            errors.push(`${prefix} (d/r): h must be > 0.`);
          }
          break;
        case 'c':
          if (!isNum(args[1]) || !isNum(args[2]) || !isNum(args[3])) {
            errors.push(`${prefix} (d/c): requires cx, cy, r.`);
          }
          if (isNum(args[3]) && (args[3] as number) <= 0) {
            errors.push(`${prefix} (d/c): r must be > 0.`);
          }
          break;
        case 'u':
          if (!isNum(args[1]) || !isNum(args[2]) || !isNum(args[3])) {
            errors.push(`${prefix} (d/u): requires x, y, width.`);
          }
          if (isNum(args[3]) && (args[3] as number) <= 0) {
            errors.push(`${prefix} (d/u): width must be > 0.`);
          }
          break;
        default:
          errors.push(`${prefix} (d): unknown draw subtype "${sub}". Valid: l, a, r, c, u.`);
      }
      break;
    }

    case 'h': {
      const region = args[0];
      if (
        !Array.isArray(region) ||
        region.length !== 4 ||
        !isNum(region[0]) || !isNum(region[1]) ||
        !isNum(region[2]) || !isNum(region[3])
      ) {
        errors.push(`${prefix} (h): requires [x, y, w, h] array of 4 numbers.`);
      }
      break;
    }

    case 'pt':
      if (!isNum(args[0]) || !isNum(args[1])) {
        errors.push(`${prefix} (pt): requires numeric x, y.`);
      }
      break;

    case 'p':
      if (!isNum(args[0]) || (args[0] as number) < 0) {
        errors.push(`${prefix} (p): requires non-negative duration in ms.`);
      }
      break;

    case 'clr':
      break;

    case 'n':
      if (!isStr(args[0]) || !(args[0] as string).trim()) {
        errors.push(`${prefix} (n): requires non-empty narration text string.`);
      }
      break;

    case 'o':
      // ["o", objectId, x, y] or ["o", objectId, x, y, scale]
      if (!isStr(args[0]) || !(args[0] as string).trim()) {
        errors.push(`${prefix} (o): requires non-empty objectId string.`);
      } else if (knownObjects.size > 0 && !knownObjects.has(args[0] as string)) {
        errors.push(`${prefix} (o): unknown object "${args[0]}".`);
      }
      if (!isNum(args[1]) || !isNum(args[2])) {
        errors.push(`${prefix} (o): requires numeric x, y.`);
      }
      if (args[3] !== undefined && !isNum(args[3])) {
        errors.push(`${prefix} (o): optional scale must be a number.`);
      }
      break;

    default:
      errors.push(`${prefix}: unknown opcode "${op}". Valid: m, w, ws, wm, d, h, pt, p, clr, n, o.`);
  }
}

function validateDefaults(defaults: unknown, errors: string[]): void {
  if (defaults === undefined || defaults === null) return;
  if (typeof defaults !== 'object' || Array.isArray(defaults)) {
    errors.push('"defaults" must be an object.');
    return;
  }
  const d = defaults as Record<string, unknown>;
  if (d.color !== undefined && (!isStr(d.color) || !CSS_COLOR_RE.test(d.color as string))) {
    errors.push('"defaults.color" must be a valid CSS color string.');
  }
  if (d.mathColor !== undefined && (!isStr(d.mathColor) || !CSS_COLOR_RE.test(d.mathColor as string))) {
    errors.push('"defaults.mathColor" must be a valid CSS color string.');
  }
  if (d.strokeWidth !== undefined && (!isNum(d.strokeWidth) || (d.strokeWidth as number) <= 0)) {
    errors.push('"defaults.strokeWidth" must be a positive number.');
  }
  if (d.fontSize !== undefined && (!isNum(d.fontSize) || (d.fontSize as number) <= 0)) {
    errors.push('"defaults.fontSize" must be a positive number.');
  }
}

function validateStyles(styles: unknown, errors: string[]): Set<string> {
  const known = new Set<string>();
  if (styles === undefined || styles === null) return known;
  if (typeof styles !== 'object' || Array.isArray(styles)) {
    errors.push('"styles" must be an object.');
    return known;
  }
  const map = styles as Record<string, unknown>;
  for (const [key, val] of Object.entries(map)) {
    if (!ID_RE.test(key)) {
      errors.push(`"styles.${key}": key must be alphanumeric/dash/underscore.`);
      continue;
    }
    known.add(key);
    if (!val || typeof val !== 'object' || Array.isArray(val)) {
      errors.push(`"styles.${key}": must be an object.`);
      continue;
    }
    const s = val as Record<string, unknown>;
    if (s.scale !== undefined && (!isNum(s.scale) || (s.scale as number) <= 0)) {
      errors.push(`"styles.${key}.scale": must be a positive number.`);
    }
    if (s.color !== undefined && (!isStr(s.color) || !CSS_COLOR_RE.test(s.color as string))) {
      errors.push(`"styles.${key}.color": must be a valid CSS color string.`);
    }
    if (s.bold !== undefined && typeof s.bold !== 'boolean') {
      errors.push(`"styles.${key}.bold": must be a boolean.`);
    }
    if (s.italic !== undefined && typeof s.italic !== 'boolean') {
      errors.push(`"styles.${key}.italic": must be a boolean.`);
    }
  }
  return known;
}

const VALID_OBJECT_TYPES = new Set(['qubit-wire', 'gate-box', 'measure-symbol', 'ket']);

function validateObjects(objects: unknown, errors: string[]): Set<string> {
  const known = new Set<string>();
  if (objects === undefined || objects === null) return known;
  if (typeof objects !== 'object' || Array.isArray(objects)) {
    errors.push('"objects" must be an object.');
    return known;
  }
  const map = objects as Record<string, unknown>;
  for (const [key, val] of Object.entries(map)) {
    if (!ID_RE.test(key)) {
      errors.push(`"objects.${key}": key must be alphanumeric/dash/underscore.`);
      continue;
    }
    known.add(key);
    if (!val || typeof val !== 'object' || Array.isArray(val)) {
      errors.push(`"objects.${key}": must be an object.`);
      continue;
    }
    const o = val as Record<string, unknown>;
    if (!isStr(o.type) || !VALID_OBJECT_TYPES.has(o.type as string)) {
      errors.push(`"objects.${key}.type": must be one of: ${[...VALID_OBJECT_TYPES].join(', ')}.`);
    }
    if (o.label !== undefined && !isStr(o.label)) {
      errors.push(`"objects.${key}.label": must be a string.`);
    }
    if (o.length !== undefined && (!isNum(o.length) || (o.length as number) <= 0)) {
      errors.push(`"objects.${key}.length": must be a positive number.`);
    }
    if (o.size !== undefined && (!isNum(o.size) || (o.size as number) <= 0)) {
      errors.push(`"objects.${key}.size": must be a positive number.`);
    }
    if (o.color !== undefined && (!isStr(o.color) || !CSS_COLOR_RE.test(o.color as string))) {
      errors.push(`"objects.${key}.color": must be a valid CSS color string.`);
    }
  }
  return known;
}

/**
 * Validates a raw JSON object as a LessonDoc.
 *
 * Returns `{ valid: true, errors: [] }` on success.
 * Returns `{ valid: false, errors: [...] }` with all discovered errors on failure.
 *
 * Does NOT throw — callers decide how to handle errors.
 */
export function validateLessonDoc(raw: unknown): ValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['Lesson document must be a non-null object.'] };
  }

  const doc = raw as Record<string, unknown>;

  // Version
  if (doc.v !== 1) {
    errors.push(`"v" must be 1 (got ${JSON.stringify(doc.v)}).`);
  }

  // ID
  if (!isStr(doc.id) || !(doc.id as string).trim()) {
    errors.push('"id" must be a non-empty string.');
  } else if (!ID_RE.test(doc.id as string)) {
    errors.push(`"id" ("${doc.id}") contains invalid characters. Use alphanumeric, dashes, underscores.`);
  }

  // Title
  if (!isStr(doc.title) || !(doc.title as string).trim()) {
    errors.push('"title" must be a non-empty string.');
  }

  // Optional scalar fields
  if (doc.difficulty !== undefined &&
      !['Beginner', 'Intermediate', 'Advanced'].includes(doc.difficulty as string)) {
    errors.push('"difficulty" must be "Beginner", "Intermediate", or "Advanced".');
  }

  if (doc.estimatedMinutes !== undefined &&
      (!isNum(doc.estimatedMinutes) || (doc.estimatedMinutes as number) <= 0)) {
    errors.push('"estimatedMinutes" must be a positive number.');
  }

  // objectives
  if (doc.objectives !== undefined) {
    if (!Array.isArray(doc.objectives)) {
      errors.push('"objectives" must be an array.');
    } else {
      (doc.objectives as unknown[]).forEach((obj, i) => {
        if (!isStr(obj) || !(obj as string).trim()) {
          errors.push(`"objectives[${i}]" must be a non-empty string.`);
        }
      });
    }
  }

  // Defaults, styles, objects blocks
  validateDefaults(doc.defaults, errors);
  const knownStyles = validateStyles(doc.styles, errors);
  const knownObjects = validateObjects(doc.objects, errors);

  // Steps
  if (!Array.isArray(doc.steps) || doc.steps.length === 0) {
    errors.push('"steps" must be a non-empty array.');
    return { valid: errors.length === 0, errors };
  }

  const seenIds = new Set<string>();
  (doc.steps as unknown[]).forEach((step, si) => {
    const stepPrefix = `Step[${si}]`;

    if (!step || typeof step !== 'object' || Array.isArray(step)) {
      errors.push(`${stepPrefix}: must be an object.`);
      return;
    }

    const s = step as Record<string, unknown>;

    if (!isStr(s.id) || !(s.id as string).trim()) {
      errors.push(`${stepPrefix}: "id" must be a non-empty string.`);
    } else {
      if (seenIds.has(s.id as string)) {
        errors.push(`${stepPrefix}: duplicate step id "${s.id}".`);
      }
      seenIds.add(s.id as string);
    }

    if (s.title !== undefined && (!isStr(s.title) || !(s.title as string).trim())) {
      errors.push(`${stepPrefix}: "title" must be a non-empty string when provided.`);
    }

    if (!Array.isArray(s.cmds)) {
      errors.push(`${stepPrefix}: "cmds" must be an array.`);
    } else {
      (s.cmds as unknown[]).forEach((cmd, ci) => {
        validateCmd(cmd, (s.id as string) || String(si), ci, errors, knownStyles, knownObjects);
      });
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Asserts that `raw` is a valid LessonDoc, throwing a descriptive error if not.
 */
export function assertValidLessonDoc(raw: unknown): asserts raw is LessonDoc {
  const result = validateLessonDoc(raw);
  if (!result.valid) {
    const id = (raw as any)?.id ?? 'unknown';
    throw new Error(
      `[LessonSchema] Invalid lesson "${id}":\n  - ${result.errors.join('\n  - ')}`
    );
  }
}

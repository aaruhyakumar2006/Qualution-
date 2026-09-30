/**
 * lessonParser.ts
 *
 * PHASE 9: Script-Driven Lesson Engine — Lesson Parser.
 *
 * Converts a validated `LessonDoc` (compact JSON) into a `BoardLessonScript`
 * (the rich action format consumed by `TheoryBoardEngine`).
 *
 * Design:
 * - Pure TypeScript — no React, no DOM, no side effects.
 * - Deterministic: same input always produces the same output.
 * - Applies `LessonDefaults` to every command that omits optional fields.
 * - Each compact command tuple maps 1-to-1 to one or more `BoardAction`s.
 * - Unknown opcodes are skipped safely (forward-compatibility).
 *
 * Compact → BoardAction mapping:
 *   ["m",  x, y]              → MOVE_CURSOR { x, y }
 *   ["w",  text, x, y, ?sc]   → WRITE_TEXT  { text, x, y, fontSize }
 *   ["wm", latex, x, y, ?sc]  → WRITE_MATH  { latex, x, y, scale, color }
 *   ["d",  "l", x1,y1,x2,y2]  → DRAW_LINE
 *   ["d",  "a", x1,y1,x2,y2]  → DRAW_ARROW
 *   ["d",  "r", x,y,w,h]      → DRAW_RECT
 *   ["d",  "c", cx,cy,r]      → DRAW_CIRCLE
 *   ["d",  "u", x,y,width]    → DRAW_UNDERLINE
 *   ["h",  [x,y,w,h]]         → HIGHLIGHT
 *   ["pt", x, y]              → MOVE_CURSOR + POINT
 *   ["p",  ms]                → PAUSE
 *   ["clr"]                   → CLEAR_BOARD
 *   ["n",  text]              → NARRATE { text, await: false }
 *   ["ws", text, x, y, sid]   → WRITE_TEXT using named style
 *   ["o",  objId, x, y, ?sc]  → DRAW_QUBIT_WIRE / DRAW_GATE_BOX / DRAW_MEASURE_SYMBOL / WRITE_TEXT
 */

import type {
  LessonDoc,
  LessonDefaults,
  LessonStyle,
  LessonObject,
  RawCmd,
  RawStep,
} from './lessonSchema';
import { assertValidLessonDoc } from './lessonSchema';
import type {
  BoardLessonScript,
  BoardTeachingStep,
  BoardAction,
} from './boardTypes';

// ── Internal defaults ──────────────────────────────────────────────────────

const FALLBACK_DEFAULTS: Required<LessonDefaults> = {
  color: '#e8e8e8',
  mathColor: '#f5c842',
  strokeWidth: 2,
  fontSize: 1.0,
};

// ── Item ID counter (per parse call) ──────────────────────────────────────

function makeIdGen(): () => string {
  let n = 0;
  return () => `item-${++n}`;
}

// ── Command → BoardAction(s) ───────────────────────────────────────────────

function parseCmd(
  cmd: RawCmd,
  defs: Required<LessonDefaults>,
  nextId: () => string,
  styles: Record<string, LessonStyle>,
  objects: Record<string, LessonObject>
): BoardAction[] {
  const [op, ...args] = cmd;

  switch (op) {
    case 'm': {
      const [x, y] = args as [number, number];
      return [{ type: 'MOVE_CURSOR', x, y }];
    }

    case 'w': {
      const [text, x, y, scale] = args as [string, number, number, number | undefined];
      // scale is treated as a font-size multiplier; base is 28 logical units
      const fontSize = Math.round(28 * (scale ?? defs.fontSize));
      return [{
        type: 'WRITE_TEXT',
        text,
        x,
        y,
        fontSize,
        color: defs.color,
        itemId: nextId(),
      }];
    }

    case 'wm': {
      const [latex, x, y, scale] = args as [string, number, number, number | undefined];
      return [{
        type: 'WRITE_MATH',
        latex,
        x,
        y,
        scale: scale ?? defs.fontSize,
        color: defs.mathColor,
        itemId: nextId(),
      }];
    }

    case 'd': {
      const [sub, ...coords] = args as [string, ...number[]];
      switch (sub) {
        case 'l':
          return [{
            type: 'DRAW_LINE',
            x1: coords[0], y1: coords[1],
            x2: coords[2], y2: coords[3],
            color: defs.color,
            strokeWidth: defs.strokeWidth,
          }];
        case 'a':
          return [{
            type: 'DRAW_ARROW',
            x1: coords[0], y1: coords[1],
            x2: coords[2], y2: coords[3],
            color: defs.color,
            strokeWidth: defs.strokeWidth,
          }];
        case 'r':
          return [{
            type: 'DRAW_RECT',
            x: coords[0], y: coords[1],
            w: coords[2], h: coords[3],
            color: defs.color,
            strokeWidth: defs.strokeWidth,
          }];
        case 'c':
          return [{
            type: 'DRAW_CIRCLE',
            cx: coords[0], cy: coords[1],
            r: coords[2],
            color: defs.color,
            strokeWidth: defs.strokeWidth,
          }];
        case 'u':
          return [{
            type: 'DRAW_UNDERLINE',
            x: coords[0], y: coords[1],
            width: coords[2],
            color: defs.color,
            strokeWidth: defs.strokeWidth,
          }];
        default:
          return []; // unknown sub-type: skip safely
      }
    }

    case 'h': {
      const region = args[0] as [number, number, number, number];
      return [{
        type: 'HIGHLIGHT',
        x: region[0], y: region[1],
        w: region[2], h: region[3],
        color: 'rgba(255, 200, 50, 0.28)',
      }];
    }

    case 'pt': {
      const [x, y] = args as [number, number];
      return [
        { type: 'MOVE_CURSOR', x, y },
        { type: 'POINT', x, y, duration: 1000 },
      ];
    }

    case 'p': {
      const [ms] = args as [number];
      return [{ type: 'PAUSE', duration: ms }];
    }

    case 'clr':
      return [{ type: 'CLEAR_BOARD' }];

    case 'n': {
      const [text] = args as [string];
      return [{ type: 'NARRATE', text, await: false }];
    }

    case 'ws': {
      // ["ws", text, x, y, styleId]
      const [text, x, y, styleId] = args as [string, number, number, string];
      const style = styles[styleId] ?? {};
      const scale = style.scale ?? defs.fontSize;
      const fontSize = Math.round(28 * scale);
      return [{
        type: 'WRITE_TEXT',
        text,
        x,
        y,
        fontSize,
        color: style.color ?? defs.color,
        fontWeight: style.bold ? 'bold' : 'normal',
        fontStyle: style.italic ? 'italic' : 'normal',
        itemId: nextId(),
      }];
    }

    case 'o': {
      // ["o", objectId, x, y] or ["o", objectId, x, y, scale]
      const [objectId, x, y, scale] = args as [string, number, number, number | undefined];
      const obj = objects[objectId];
      if (!obj) return []; // unknown object: skip safely
      const sc = scale ?? 1.0;
      const color = obj.color ?? defs.color;
      switch (obj.type) {
        case 'qubit-wire':
          return [{
            type: 'DRAW_QUBIT_WIRE',
            x,
            y,
            length: Math.round((obj.length ?? 400) * sc),
            label: obj.label,
            color,
          }];
        case 'gate-box':
          return [{
            type: 'DRAW_GATE_BOX',
            cx: x,
            cy: y,
            label: obj.label ?? '?',
            size: Math.round((obj.size ?? 40) * sc),
            color,
          }];
        case 'measure-symbol':
          return [{
            type: 'DRAW_MEASURE_SYMBOL',
            cx: x,
            cy: y,
            size: Math.round((obj.size ?? 40) * sc),
          }];
        case 'ket':
          return [{
            type: 'WRITE_TEXT',
            text: obj.label ?? '|?⟩',
            x,
            y,
            fontSize: Math.round(28 * sc),
            color,
            itemId: nextId(),
          }];
        default:
          return [];
      }
    }

    default:
      return []; // unknown opcode: skip safely (forward-compat)
  }
}

// ── Step parser ────────────────────────────────────────────────────────────

function parseStep(
  raw: RawStep,
  defs: Required<LessonDefaults>,
  nextId: () => string,
  styles: Record<string, LessonStyle>,
  objects: Record<string, LessonObject>
): BoardTeachingStep {
  const actions: BoardAction[] = raw.cmds.flatMap((cmd) =>
    parseCmd(cmd as RawCmd, defs, nextId, styles, objects)
  );

  return {
    id: raw.id,
    title: raw.title,
    actions,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Parses a validated `LessonDoc` into a `BoardLessonScript`.
 *
 * Validates the document first — throws if invalid.
 * Applies `doc.defaults` (merged with built-in fallbacks) to every command.
 *
 * @throws if the document fails schema validation.
 */
export function parseLesson(raw: unknown): BoardLessonScript {
  assertValidLessonDoc(raw);

  const doc = raw as LessonDoc;

  const defs: Required<LessonDefaults> = {
    ...FALLBACK_DEFAULTS,
    ...doc.defaults,
  };

  const styles: Record<string, LessonStyle> = doc.styles ?? {};
  const objects: Record<string, LessonObject> = doc.objects ?? {};

  const nextId = makeIdGen();

  const steps: BoardTeachingStep[] = doc.steps.map((step) =>
    parseStep(step, defs, nextId, styles, objects)
  );

  return {
    id: doc.id,
    title: doc.title,
    topic: doc.topic ?? '',
    difficulty: doc.difficulty ?? 'Beginner',
    estimatedMinutes: doc.estimatedMinutes ?? 5,
    learningObjectives: doc.objectives ?? [],
    steps,
  };
}

/**
 * Parses a JSON string directly.
 * Throws on JSON parse error or schema validation failure.
 */
export function parseLessonFromJson(json: string): BoardLessonScript {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    throw new Error(`[LessonParser] Invalid JSON: ${(e as Error).message}`);
  }
  return parseLesson(raw);
}

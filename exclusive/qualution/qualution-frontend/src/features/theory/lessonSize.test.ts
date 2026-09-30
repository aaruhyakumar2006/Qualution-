/**
 * lessonSize.test.ts
 *
 * PHASE 12: Tests for lesson JSON size measurement and the three test lessons.
 */

import { describe, it, expect } from 'vitest';
import { measureLessonSize, measureJsonString, SIZE_TARGET } from './lessonSize';
import { validateLessonDoc } from './lessonSchema';
import { parseLesson } from './lessonParser';
import tinyLesson from './lessons/test-tiny.json';
import normalLesson from './lessons/test-normal.json';
import largeLesson from './lessons/test-large.json';

// ── measureLessonSize ──────────────────────────────────────────────────────

describe('measureLessonSize()', () => {
  it('returns positive rawBytes and minifiedBytes', () => {
    const result = measureLessonSize({ v: 1, id: 'x', title: 'X', steps: [] });
    expect(result.rawBytes).toBeGreaterThan(0);
    expect(result.minifiedBytes).toBeGreaterThan(0);
  });

  it('minifiedBytes <= rawBytes', () => {
    const doc = { v: 1, id: 'x', title: 'X', steps: [{ id: 's1', cmds: [] }] };
    const result = measureLessonSize(doc);
    expect(result.minifiedBytes).toBeLessThanOrEqual(result.rawBytes);
  });

  it('rawLabel is a non-empty string', () => {
    const result = measureLessonSize({ v: 1, id: 'x', title: 'X', steps: [] });
    expect(result.rawLabel.length).toBeGreaterThan(0);
  });

  it('minifiedLabel is a non-empty string', () => {
    const result = measureLessonSize({ v: 1, id: 'x', title: 'X', steps: [] });
    expect(result.minifiedLabel.length).toBeGreaterThan(0);
  });

  it('withinTarget is true for a small document', () => {
    const result = measureLessonSize({ v: 1, id: 'x', title: 'X', steps: [] });
    expect(result.withinTarget).toBe(true);
  });

  it('isTiny is true for a very small document', () => {
    const result = measureLessonSize({ v: 1, id: 'x', title: 'X', steps: [] });
    expect(result.isTiny).toBe(true);
  });

  it('withinTarget is false for a document exceeding 80 KB', () => {
    const bigText = 'A'.repeat(90 * 1024);
    const result = measureLessonSize({ v: 1, id: 'x', title: bigText, steps: [] });
    expect(result.withinTarget).toBe(false);
  });
});

describe('measureJsonString()', () => {
  it('measures a raw JSON string', () => {
    const json = JSON.stringify({ v: 1, id: 'x', title: 'X', steps: [] }, null, 2);
    const result = measureJsonString(json);
    expect(result.rawBytes).toBeGreaterThan(0);
    expect(result.minifiedBytes).toBeLessThanOrEqual(result.rawBytes);
  });

  it('handles invalid JSON gracefully', () => {
    const result = measureJsonString('not valid json {{{');
    expect(result.rawBytes).toBeGreaterThan(0);
  });
});

// ── SIZE_TARGET constants ──────────────────────────────────────────────────

describe('SIZE_TARGET', () => {
  it('MAX_BYTES is 80 * 1024', () => {
    expect(SIZE_TARGET.MAX_BYTES).toBe(80 * 1024);
  });

  it('MAX_KB is 80', () => {
    expect(SIZE_TARGET.MAX_KB).toBe(80);
  });
});

// ── Tiny lesson ────────────────────────────────────────────────────────────

describe('test-tiny.json', () => {
  it('validates successfully', () => {
    const r = validateLessonDoc(tinyLesson);
    expect(r.valid).toBe(true);
  });

  it('parses without throwing', () => {
    expect(() => parseLesson(tinyLesson)).not.toThrow();
  });

  it('minified size is below 5 KB', () => {
    const result = measureLessonSize(tinyLesson);
    expect(result.minifiedBytes).toBeLessThan(5 * 1024);
  });

  it('is within the 80 KB target', () => {
    const result = measureLessonSize(tinyLesson);
    expect(result.withinTarget).toBe(true);
  });

  it('isTiny flag is true', () => {
    const result = measureLessonSize(tinyLesson);
    expect(result.isTiny).toBe(true);
  });

  it('has 3 steps', () => {
    const script = parseLesson(tinyLesson);
    expect(script.steps).toHaveLength(3);
  });

  it('contains MOVE_CURSOR, WRITE_TEXT, and PAUSE actions', () => {
    const script = parseLesson(tinyLesson);
    const all = script.steps.flatMap((s) => s.actions);
    const types = new Set(all.map((a) => a.type));
    expect(types.has('MOVE_CURSOR')).toBe(true);
    expect(types.has('WRITE_TEXT')).toBe(true);
    expect(types.has('PAUSE')).toBe(true);
  });
});

// ── Normal lesson ──────────────────────────────────────────────────────────

describe('test-normal.json', () => {
  it('validates successfully', () => {
    const r = validateLessonDoc(normalLesson);
    expect(r.valid).toBe(true);
  });

  it('parses without throwing', () => {
    expect(() => parseLesson(normalLesson)).not.toThrow();
  });

  it('minified size is below 80 KB', () => {
    const result = measureLessonSize(normalLesson);
    expect(result.minifiedBytes).toBeLessThan(SIZE_TARGET.MAX_BYTES);
  });

  it('is within the 80 KB target', () => {
    const result = measureLessonSize(normalLesson);
    expect(result.withinTarget).toBe(true);
  });

  it('has 7 steps', () => {
    const script = parseLesson(normalLesson);
    expect(script.steps).toHaveLength(7);
  });

  it('contains WRITE_TEXT actions from ws opcode', () => {
    const script = parseLesson(normalLesson);
    const all = script.steps.flatMap((s) => s.actions);
    expect(all.some((a) => a.type === 'WRITE_TEXT')).toBe(true);
  });

  it('contains WRITE_MATH actions', () => {
    const script = parseLesson(normalLesson);
    const all = script.steps.flatMap((s) => s.actions);
    expect(all.some((a) => a.type === 'WRITE_MATH')).toBe(true);
  });

  it('contains HIGHLIGHT actions', () => {
    const script = parseLesson(normalLesson);
    const all = script.steps.flatMap((s) => s.actions);
    expect(all.some((a) => a.type === 'HIGHLIGHT')).toBe(true);
  });

  it('contains NARRATE actions', () => {
    const script = parseLesson(normalLesson);
    const all = script.steps.flatMap((s) => s.actions);
    expect(all.some((a) => a.type === 'NARRATE')).toBe(true);
  });

  it('contains DRAW_QUBIT_WIRE from o opcode', () => {
    const script = parseLesson(normalLesson);
    const all = script.steps.flatMap((s) => s.actions);
    expect(all.some((a) => a.type === 'DRAW_QUBIT_WIRE')).toBe(true);
  });

  it('contains DRAW_GATE_BOX from o opcode', () => {
    const script = parseLesson(normalLesson);
    const all = script.steps.flatMap((s) => s.actions);
    expect(all.some((a) => a.type === 'DRAW_GATE_BOX')).toBe(true);
  });

  it('populates learningObjectives from objectives field', () => {
    const script = parseLesson(normalLesson);
    expect(script.learningObjectives.length).toBeGreaterThan(0);
  });
});

// ── Large lesson ───────────────────────────────────────────────────────────

describe('test-large.json', () => {
  it('validates successfully', () => {
    const r = validateLessonDoc(largeLesson);
    expect(r.valid).toBe(true);
  });

  it('parses without throwing', () => {
    expect(() => parseLesson(largeLesson)).not.toThrow();
  });

  it('minified size is below 80 KB', () => {
    const result = measureLessonSize(largeLesson);
    expect(result.minifiedBytes).toBeLessThan(SIZE_TARGET.MAX_BYTES);
  });

  it('is within the 80 KB target', () => {
    const result = measureLessonSize(largeLesson);
    expect(result.withinTarget).toBe(true);
  });

  it('has 17 steps', () => {
    const script = parseLesson(largeLesson);
    expect(script.steps).toHaveLength(17);
  });

  it('contains DRAW_GATE_BOX actions from o opcode', () => {
    const script = parseLesson(largeLesson);
    const all = script.steps.flatMap((s) => s.actions);
    expect(all.some((a) => a.type === 'DRAW_GATE_BOX')).toBe(true);
  });

  it('contains DRAW_MEASURE_SYMBOL actions from o opcode', () => {
    const script = parseLesson(largeLesson);
    const all = script.steps.flatMap((s) => s.actions);
    expect(all.some((a) => a.type === 'DRAW_MEASURE_SYMBOL')).toBe(true);
  });

  it('contains WRITE_MATH actions', () => {
    const script = parseLesson(largeLesson);
    const all = script.steps.flatMap((s) => s.actions);
    expect(all.some((a) => a.type === 'WRITE_MATH')).toBe(true);
  });

  it('contains HIGHLIGHT actions', () => {
    const script = parseLesson(largeLesson);
    const all = script.steps.flatMap((s) => s.actions);
    expect(all.some((a) => a.type === 'HIGHLIGHT')).toBe(true);
  });

  it('has 5 learning objectives', () => {
    const script = parseLesson(largeLesson);
    expect(script.learningObjectives).toHaveLength(5);
  });
});

// ── ws opcode (styled write) ───────────────────────────────────────────────

describe('schema — ws opcode', () => {
  it('accepts ["ws", text, x, y, styleId] when style exists', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      styles: { title: { scale: 1.5 } },
      steps: [{ id: 's1', cmds: [['ws', 'Hello', 100, 200, 'title']] }],
    });
    expect(r.valid).toBe(true);
  });

  it('rejects ["ws"] with missing text', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      styles: { title: { scale: 1.5 } },
      steps: [{ id: 's1', cmds: [['ws', '', 100, 200, 'title']] }],
    });
    expect(r.valid).toBe(false);
  });

  it('rejects ["ws"] with unknown styleId when styles block is present', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      styles: { title: { scale: 1.5 } },
      steps: [{ id: 's1', cmds: [['ws', 'Hi', 100, 200, 'nonexistent']] }],
    });
    expect(r.valid).toBe(false);
  });

  it('accepts ["ws"] with any styleId when no styles block is defined', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      steps: [{ id: 's1', cmds: [['ws', 'Hi', 100, 200, 'anyStyle']] }],
    });
    expect(r.valid).toBe(true);
  });
});

describe('parser — ws opcode', () => {
  it('produces WRITE_TEXT with style scale applied', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      styles: { big: { scale: 2.0, color: '#ff0000' } },
      steps: [{ id: 's1', cmds: [['ws', 'Hello', 100, 200, 'big']] }],
    });
    const action = script.steps[0].actions[0] as any;
    expect(action.type).toBe('WRITE_TEXT');
    expect(action.fontSize).toBe(56); // 28 * 2.0
    expect(action.color).toBe('#ff0000');
  });

  it('applies bold from style', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      styles: { bold: { bold: true } },
      steps: [{ id: 's1', cmds: [['ws', 'Hello', 100, 200, 'bold']] }],
    });
    const action = script.steps[0].actions[0] as any;
    expect(action.fontWeight).toBe('bold');
  });

  it('applies italic from style', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      styles: { ital: { italic: true } },
      steps: [{ id: 's1', cmds: [['ws', 'Hello', 100, 200, 'ital']] }],
    });
    const action = script.steps[0].actions[0] as any;
    expect(action.fontStyle).toBe('italic');
  });

  it('falls back to defaults when style has no color', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      defaults: { color: '#aabbcc' },
      styles: { plain: { scale: 1.0 } },
      steps: [{ id: 's1', cmds: [['ws', 'Hello', 100, 200, 'plain']] }],
    });
    const action = script.steps[0].actions[0] as any;
    expect(action.color).toBe('#aabbcc');
  });
});

// ── o opcode (reusable objects) ────────────────────────────────────────────

describe('schema — o opcode', () => {
  it('accepts ["o", objectId, x, y] when object exists', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objects: { hGate: { type: 'gate-box', label: 'H' } },
      steps: [{ id: 's1', cmds: [['o', 'hGate', 400, 300]] }],
    });
    expect(r.valid).toBe(true);
  });

  it('accepts ["o", objectId, x, y, scale]', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objects: { hGate: { type: 'gate-box', label: 'H' } },
      steps: [{ id: 's1', cmds: [['o', 'hGate', 400, 300, 1.5]] }],
    });
    expect(r.valid).toBe(true);
  });

  it('rejects ["o"] with unknown objectId when objects block is present', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objects: { hGate: { type: 'gate-box', label: 'H' } },
      steps: [{ id: 's1', cmds: [['o', 'unknown', 400, 300]] }],
    });
    expect(r.valid).toBe(false);
  });

  it('rejects ["o"] with non-numeric coords', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objects: { hGate: { type: 'gate-box', label: 'H' } },
      steps: [{ id: 's1', cmds: [['o', 'hGate', 'x', 300]] }],
    });
    expect(r.valid).toBe(false);
  });
});

describe('parser — o opcode', () => {
  it('gate-box object produces DRAW_GATE_BOX', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      objects: { hGate: { type: 'gate-box', label: 'H', size: 44 } },
      steps: [{ id: 's1', cmds: [['o', 'hGate', 500, 300]] }],
    });
    const action = script.steps[0].actions[0] as any;
    expect(action.type).toBe('DRAW_GATE_BOX');
    expect(action.label).toBe('H');
    expect(action.cx).toBe(500);
    expect(action.cy).toBe(300);
  });

  it('qubit-wire object produces DRAW_QUBIT_WIRE', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      objects: { wire: { type: 'qubit-wire', length: 400, label: '|0⟩' } },
      steps: [{ id: 's1', cmds: [['o', 'wire', 100, 300]] }],
    });
    const action = script.steps[0].actions[0] as any;
    expect(action.type).toBe('DRAW_QUBIT_WIRE');
    expect(action.length).toBe(400);
  });

  it('measure-symbol object produces DRAW_MEASURE_SYMBOL', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      objects: { m: { type: 'measure-symbol', size: 40 } },
      steps: [{ id: 's1', cmds: [['o', 'm', 600, 300]] }],
    });
    const action = script.steps[0].actions[0] as any;
    expect(action.type).toBe('DRAW_MEASURE_SYMBOL');
  });

  it('ket object produces WRITE_TEXT', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      objects: { ket0: { type: 'ket', label: '|0⟩' } },
      steps: [{ id: 's1', cmds: [['o', 'ket0', 300, 300]] }],
    });
    const action = script.steps[0].actions[0] as any;
    expect(action.type).toBe('WRITE_TEXT');
    expect(action.text).toBe('|0⟩');
  });

  it('scale argument scales gate size', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      objects: { hGate: { type: 'gate-box', label: 'H', size: 40 } },
      steps: [{ id: 's1', cmds: [['o', 'hGate', 500, 300, 2.0]] }],
    });
    const action = script.steps[0].actions[0] as any;
    expect(action.size).toBe(80); // 40 * 2.0
  });

  it('unknown object id is skipped safely', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      steps: [{ id: 's1', cmds: [['o', 'ghost', 500, 300]] }],
    });
    expect(script.steps[0].actions).toHaveLength(0);
  });
});

// ── styles block validation ────────────────────────────────────────────────

describe('schema — styles block', () => {
  it('accepts a valid styles block', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      styles: {
        title: { scale: 1.8, color: '#ffffff', bold: true },
        body:  { scale: 1.0, color: '#e8e8e8' },
      },
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(true);
  });

  it('rejects styles as array', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      styles: [],
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(false);
  });

  it('rejects style with invalid color', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      styles: { bad: { color: 'not!!acolor' } },
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(false);
  });

  it('rejects style with non-boolean bold', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      styles: { bad: { bold: 'yes' as any } },
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(false);
  });

  it('rejects style with negative scale', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      styles: { bad: { scale: -1 } },
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(false);
  });
});

// ── objects block validation ───────────────────────────────────────────────

describe('schema — objects block', () => {
  it('accepts a valid objects block', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objects: {
        hGate:  { type: 'gate-box', label: 'H', size: 40 },
        wire:   { type: 'qubit-wire', length: 400 },
        meas:   { type: 'measure-symbol', size: 40 },
        ket0:   { type: 'ket', label: '|0⟩' },
      },
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(true);
  });

  it('rejects objects as array', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objects: [],
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(false);
  });

  it('rejects object with unknown type', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objects: { bad: { type: 'laser-cannon' as any } },
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(false);
  });

  it('rejects object with negative size', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objects: { bad: { type: 'gate-box', label: 'H', size: -5 } },
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(false);
  });
});

// ── objectives field ───────────────────────────────────────────────────────

describe('schema — objectives field', () => {
  it('accepts a valid objectives array', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objectives: ['Learn A', 'Learn B'],
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(true);
  });

  it('rejects objectives as non-array', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objectives: 'Learn A' as any,
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(false);
  });

  it('rejects objectives with empty string entry', () => {
    const r = validateLessonDoc({
      v: 1, id: 'x', title: 'X',
      objectives: ['Learn A', ''],
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(r.valid).toBe(false);
  });
});

describe('parser — objectives field', () => {
  it('populates learningObjectives from objectives', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      objectives: ['Understand qubits', 'Apply gates'],
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(script.learningObjectives).toEqual(['Understand qubits', 'Apply gates']);
  });

  it('learningObjectives is empty array when objectives omitted', () => {
    const script = parseLesson({
      v: 1, id: 'x', title: 'X',
      steps: [{ id: 's1', cmds: [] }],
    });
    expect(script.learningObjectives).toEqual([]);
  });
});

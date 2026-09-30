/**
 * mathActions.test.ts
 *
 * PHASE 8: Pure unit tests for mathActions builders.
 *
 * No DOM, no React, no KaTeX required.
 * Verifies action array structure, ordering, field values, and determinism.
 */

import { describe, it, expect } from 'vitest';
import {
  teacherWriteMath,
  teacherReplaceMath,
  teacherExtendMath,
  buildSuperpositionDemo,
  MATH_DEFAULT_COLOR,
  MATH_DEFAULT_SCALE,
  MATH_DEFAULT_DURATION,
  DEMO_POSITIONS,
} from './mathActions';
import type { BoardAction } from './boardTypes';

// ── Helpers ────────────────────────────────────────────────────────────────

function ofType<T extends BoardAction['type']>(
  actions: BoardAction[],
  type: T
): Extract<BoardAction, { type: T }>[] {
  return actions.filter((a): a is Extract<BoardAction, { type: T }> => a.type === type);
}

// ── teacherWriteMath() ─────────────────────────────────────────────────────

describe('teacherWriteMath()', () => {
  const BASE = { id: 'm1', latex: '|0\\rangle', x: 200, y: 300 };

  it('produces MOVE_CURSOR → PAUSE → WRITE_MATH by default', () => {
    const actions = teacherWriteMath(BASE);
    expect(actions).toHaveLength(3);
    expect(actions[0].type).toBe('MOVE_CURSOR');
    expect(actions[1].type).toBe('PAUSE');
    expect(actions[2].type).toBe('WRITE_MATH');
  });

  it('omits pre-write PAUSE when preWritePauseMs is 0', () => {
    const actions = teacherWriteMath({ ...BASE, preWritePauseMs: 0 });
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe('MOVE_CURSOR');
    expect(actions[1].type).toBe('WRITE_MATH');
  });

  it('appends post-write PAUSE when postWritePauseMs > 0', () => {
    const actions = teacherWriteMath({ ...BASE, postWritePauseMs: 500 });
    expect(actions).toHaveLength(4);
    expect(actions[3].type).toBe('PAUSE');
    const pause = actions[3] as Extract<BoardAction, { type: 'PAUSE' }>;
    expect(pause.duration).toBe(500);
  });

  it('MOVE_CURSOR targets the math anchor position', () => {
    const actions = teacherWriteMath({ ...BASE, x: 400, y: 250 });
    const move = actions[0] as Extract<BoardAction, { type: 'MOVE_CURSOR' }>;
    expect(move.x).toBe(400);
    expect(move.y).toBe(250);
  });

  it('WRITE_MATH carries correct id, latex, x, y', () => {
    const actions = teacherWriteMath(BASE);
    const write = ofType(actions, 'WRITE_MATH')[0];
    expect(write.itemId).toBe('m1');
    expect(write.latex).toBe('|0\\rangle');
    expect(write.x).toBe(200);
    expect(write.y).toBe(300);
  });

  it('uses default scale, color, duration', () => {
    const actions = teacherWriteMath(BASE);
    const write = ofType(actions, 'WRITE_MATH')[0];
    expect(write.scale).toBe(MATH_DEFAULT_SCALE);
    expect(write.color).toBe(MATH_DEFAULT_COLOR);
    expect(write.duration).toBe(MATH_DEFAULT_DURATION);
  });

  it('respects explicit scale, color, durationMs overrides', () => {
    const actions = teacherWriteMath({
      ...BASE, scale: 2.0, color: '#ffffff', durationMs: 800,
    });
    const write = ofType(actions, 'WRITE_MATH')[0];
    expect(write.scale).toBe(2.0);
    expect(write.color).toBe('#ffffff');
    expect(write.duration).toBe(800);
  });

  it('MOVE_CURSOR fast=true when travelDurationMs is 0', () => {
    const actions = teacherWriteMath({ ...BASE, travelDurationMs: 0 });
    const move = actions[0] as Extract<BoardAction, { type: 'MOVE_CURSOR' }>;
    expect(move.fast).toBe(true);
  });

  it('MOVE_CURSOR fast=false when travelDurationMs > 0', () => {
    const actions = teacherWriteMath({ ...BASE, travelDurationMs: 500 });
    const move = actions[0] as Extract<BoardAction, { type: 'MOVE_CURSOR' }>;
    expect(move.fast).toBe(false);
  });

  it('is deterministic', () => {
    expect(teacherWriteMath(BASE)).toEqual(teacherWriteMath(BASE));
  });

  it('returns plain serialisable objects', () => {
    const actions = teacherWriteMath(BASE);
    expect(() => JSON.stringify(actions)).not.toThrow();
    expect(JSON.parse(JSON.stringify(actions))).toEqual(actions);
  });
});

// ── teacherReplaceMath() ───────────────────────────────────────────────────

describe('teacherReplaceMath()', () => {
  const BASE = { id: 'eq1', latex: 'H|0\\rangle', x: 200, y: 300 };

  it('produces MOVE_CURSOR → PAUSE → WRITE_MATH', () => {
    const actions = teacherReplaceMath(BASE);
    expect(actions).toHaveLength(3);
    expect(actions[0].type).toBe('MOVE_CURSOR');
    expect(actions[1].type).toBe('PAUSE');
    expect(actions[2].type).toBe('WRITE_MATH');
  });

  it('WRITE_MATH uses the same itemId as the original', () => {
    const actions = teacherReplaceMath(BASE);
    const write = ofType(actions, 'WRITE_MATH')[0];
    expect(write.itemId).toBe('eq1');
  });

  it('WRITE_MATH carries the new latex', () => {
    const actions = teacherReplaceMath({ ...BASE, latex: '\\frac{1}{\\sqrt{2}}(|0\\rangle+|1\\rangle)' });
    const write = ofType(actions, 'WRITE_MATH')[0];
    expect(write.latex).toBe('\\frac{1}{\\sqrt{2}}(|0\\rangle+|1\\rangle)');
  });

  it('default preWritePauseMs is 300', () => {
    const actions = teacherReplaceMath(BASE);
    const pause = actions[1] as Extract<BoardAction, { type: 'PAUSE' }>;
    expect(pause.duration).toBe(300);
  });

  it('omits PAUSE when preWritePauseMs is 0', () => {
    const actions = teacherReplaceMath({ ...BASE, preWritePauseMs: 0 });
    expect(actions).toHaveLength(2);
    expect(actions[1].type).toBe('WRITE_MATH');
  });

  it('is deterministic', () => {
    expect(teacherReplaceMath(BASE)).toEqual(teacherReplaceMath(BASE));
  });
});

// ── teacherExtendMath() ────────────────────────────────────────────────────

describe('teacherExtendMath()', () => {
  const BASE = { id: 'ext1', latex: '\\frac{1}{\\sqrt{2}}(|0\\rangle+|1\\rangle)', x: 200, y: 460 };

  it('produces MOVE_CURSOR → PAUSE → WRITE_MATH', () => {
    const actions = teacherExtendMath(BASE);
    expect(actions).toHaveLength(3);
    expect(actions[0].type).toBe('MOVE_CURSOR');
    expect(actions[1].type).toBe('PAUSE');
    expect(actions[2].type).toBe('WRITE_MATH');
  });

  it('WRITE_MATH uses a new unique id (not overwriting existing)', () => {
    const actions = teacherExtendMath(BASE);
    const write = ofType(actions, 'WRITE_MATH')[0];
    expect(write.itemId).toBe('ext1');
  });

  it('default preWritePauseMs is 400', () => {
    const actions = teacherExtendMath(BASE);
    const pause = actions[1] as Extract<BoardAction, { type: 'PAUSE' }>;
    expect(pause.duration).toBe(400);
  });

  it('positions at the given x, y', () => {
    const actions = teacherExtendMath({ ...BASE, x: 300, y: 500 });
    const write = ofType(actions, 'WRITE_MATH')[0];
    expect(write.x).toBe(300);
    expect(write.y).toBe(500);
  });

  it('is deterministic', () => {
    expect(teacherExtendMath(BASE)).toEqual(teacherExtendMath(BASE));
  });
});

// ── buildSuperpositionDemo() ───────────────────────────────────────────────

describe('buildSuperpositionDemo()', () => {
  it('returns a non-empty action array', () => {
    const actions = buildSuperpositionDemo();
    expect(actions.length).toBeGreaterThan(0);
  });

  it('contains exactly three WRITE_MATH actions', () => {
    const actions = buildSuperpositionDemo();
    expect(ofType(actions, 'WRITE_MATH')).toHaveLength(3);
  });

  it('first WRITE_MATH has latex |0\\rangle', () => {
    const writes = ofType(buildSuperpositionDemo(), 'WRITE_MATH');
    expect(writes[0].latex).toBe('|0\\rangle');
    expect(writes[0].itemId).toBe('demo-step1');
  });

  it('second WRITE_MATH has latex H|0\\rangle', () => {
    const writes = ofType(buildSuperpositionDemo(), 'WRITE_MATH');
    expect(writes[1].latex).toBe('H|0\\rangle');
    expect(writes[1].itemId).toBe('demo-step2');
  });

  it('third WRITE_MATH has the full superposition latex', () => {
    const writes = ofType(buildSuperpositionDemo(), 'WRITE_MATH');
    expect(writes[2].latex).toContain('frac');
    expect(writes[2].latex).toContain('sqrt');
    expect(writes[2].itemId).toBe('demo-step3');
  });

  it('contains exactly two DRAW_ARROW actions (between steps)', () => {
    const actions = buildSuperpositionDemo();
    expect(ofType(actions, 'DRAW_ARROW')).toHaveLength(2);
  });

  it('steps are positioned at DEMO_POSITIONS coordinates', () => {
    const writes = ofType(buildSuperpositionDemo(), 'WRITE_MATH');
    expect(writes[0].x).toBe(DEMO_POSITIONS.step1.x);
    expect(writes[0].y).toBe(DEMO_POSITIONS.step1.y);
    expect(writes[1].x).toBe(DEMO_POSITIONS.step2.x);
    expect(writes[1].y).toBe(DEMO_POSITIONS.step2.y);
    expect(writes[2].x).toBe(DEMO_POSITIONS.step3.x);
    expect(writes[2].y).toBe(DEMO_POSITIONS.step3.y);
  });

  it('steps are at increasing y positions (top to bottom)', () => {
    const writes = ofType(buildSuperpositionDemo(), 'WRITE_MATH');
    expect(writes[0].y).toBeLessThan(writes[1].y);
    expect(writes[1].y).toBeLessThan(writes[2].y);
  });

  it('is deterministic — same output on every call', () => {
    expect(buildSuperpositionDemo()).toEqual(buildSuperpositionDemo());
  });

  it('returns plain serialisable objects', () => {
    const actions = buildSuperpositionDemo();
    expect(() => JSON.stringify(actions)).not.toThrow();
    expect(JSON.parse(JSON.stringify(actions))).toEqual(actions);
  });

  it('all WRITE_MATH items have scale 1.6', () => {
    const writes = ofType(buildSuperpositionDemo(), 'WRITE_MATH');
    writes.forEach((w) => expect(w.scale).toBe(1.6));
  });

  it('MOVE_CURSOR actions precede each WRITE_MATH', () => {
    const actions = buildSuperpositionDemo();
    const writeIndices = actions
      .map((a, i) => (a.type === 'WRITE_MATH' ? i : -1))
      .filter((i) => i > 0);

    for (const wi of writeIndices) {
      // There must be a MOVE_CURSOR somewhere before this WRITE_MATH
      const before = actions.slice(0, wi);
      expect(before.some((a) => a.type === 'MOVE_CURSOR')).toBe(true);
    }
  });
});

// ── Composability ──────────────────────────────────────────────────────────

describe('math actions composability', () => {
  it('write + replace + extend can be concatenated', () => {
    const seq: BoardAction[] = [
      ...teacherWriteMath({ id: 'a', latex: '|0\\rangle', x: 100, y: 200 }),
      ...teacherReplaceMath({ id: 'a', latex: 'H|0\\rangle', x: 100, y: 200 }),
      ...teacherExtendMath({ id: 'b', latex: '\\frac{1}{\\sqrt{2}}(|0\\rangle+|1\\rangle)', x: 100, y: 300 }),
    ];

    const writes = ofType(seq, 'WRITE_MATH');
    expect(writes).toHaveLength(3);
    // First two share the same itemId (replace pattern)
    expect(writes[0].itemId).toBe('a');
    expect(writes[1].itemId).toBe('a');
    // Third is a new item
    expect(writes[2].itemId).toBe('b');
  });
});

// ── Engine integration: WRITE_MATH action ─────────────────────────────────

describe('mathActions — engine integration', () => {
  it('WRITE_MATH action is accepted by TheoryBoardEngine without error', async () => {
    const { TheoryBoardEngine } = await import('./TheoryBoardEngine');
    const { vi } = await import('vitest');

    vi.useFakeTimers();
    try {
      const paintCommands: unknown[] = [];
      const engine = new TheoryBoardEngine({
        speak: async () => {},
        stop: () => {},
        pause: () => {},
        resume: () => {},
        isAvailable: () => true,
        isMuted: () => false,
        setMuted: () => {},
      } as any);

      engine.load(
        {
          id: 'math-test',
          title: 'Math Test',
          topic: 'Testing',
          difficulty: 'Beginner',
          estimatedMinutes: 1,
          learningObjectives: [],
          steps: [{
            id: 's1',
            actions: [{
              type: 'WRITE_MATH',
              latex: '|0\\rangle',
              x: 200,
              y: 300,
              itemId: 'test-math',
              duration: 50,
            }],
          }],
        },
        (cmd) => paintCommands.push(cmd)
      );

      engine.play();
      await vi.runAllTimersAsync();

      const addCmds = (paintCommands as any[]).filter((c) => c.type === 'ADD');
      const mathCmd = addCmds.find((c) => c.item?.kind === 'math');
      expect(mathCmd).toBeDefined();
      expect(mathCmd.item.data.latex).toBe('|0\\rangle');

      engine.dispose();
    } finally {
      vi.useRealTimers();
    }
  });
});

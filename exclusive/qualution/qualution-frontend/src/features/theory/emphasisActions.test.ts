/**
 * emphasisActions.test.ts
 *
 * PHASE 6: Pure unit tests for the emphasisActions module.
 *
 * No DOM, no React, no mocks required.
 * Verifies action array structure, ordering, and field values.
 */

import { describe, it, expect } from 'vitest';
import {
  teacherPoint,
  teacherHighlight,
  teacherUnderline,
  teacherCircleAround,
} from './emphasisActions';
import type { BoardAction } from './boardTypes';

// ── Helpers ────────────────────────────────────────────────────────────────

function ofType<T extends BoardAction['type']>(
  actions: BoardAction[],
  type: T
): Extract<BoardAction, { type: T }>[] {
  return actions.filter((a): a is Extract<BoardAction, { type: T }> => a.type === type);
}

// ── teacherPoint() ─────────────────────────────────────────────────────────

describe('teacherPoint()', () => {
  it('produces MOVE_CURSOR → POINT', () => {
    const actions = teacherPoint({ x: 400, y: 300 });
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe('MOVE_CURSOR');
    expect(actions[1].type).toBe('POINT');
  });

  it('MOVE_CURSOR targets the same x, y as the point', () => {
    const actions = teacherPoint({ x: 500, y: 250 });
    const move = actions[0] as Extract<BoardAction, { type: 'MOVE_CURSOR' }>;
    expect(move.x).toBe(500);
    expect(move.y).toBe(250);
  });

  it('POINT carries the correct x, y, and default duration', () => {
    const actions = teacherPoint({ x: 100, y: 200 });
    const point = actions[1] as Extract<BoardAction, { type: 'POINT' }>;
    expect(point.x).toBe(100);
    expect(point.y).toBe(200);
    expect(point.duration).toBe(1200);
  });

  it('uses custom durationMs', () => {
    const actions = teacherPoint({ x: 0, y: 0, durationMs: 2500 });
    const point = actions[1] as Extract<BoardAction, { type: 'POINT' }>;
    expect(point.duration).toBe(2500);
  });

  it('carries optional label on POINT action', () => {
    const actions = teacherPoint({ x: 0, y: 0, label: 'Look here' });
    const point = actions[1] as Extract<BoardAction, { type: 'POINT' }>;
    expect(point.label).toBe('Look here');
  });

  it('label is undefined when not provided', () => {
    const actions = teacherPoint({ x: 0, y: 0 });
    const point = actions[1] as Extract<BoardAction, { type: 'POINT' }>;
    expect(point.label).toBeUndefined();
  });

  it('MOVE_CURSOR uses fast=false for deliberate movement', () => {
    const actions = teacherPoint({ x: 0, y: 0 });
    const move = actions[0] as Extract<BoardAction, { type: 'MOVE_CURSOR' }>;
    expect(move.fast).toBe(false);
  });

  it('is deterministic', () => {
    const opts = { x: 300, y: 400, durationMs: 800, label: 'X' };
    expect(teacherPoint(opts)).toEqual(teacherPoint(opts));
  });

  it('returns plain serialisable objects', () => {
    const actions = teacherPoint({ x: 100, y: 100 });
    expect(() => JSON.stringify(actions)).not.toThrow();
    expect(JSON.parse(JSON.stringify(actions))).toEqual(actions);
  });
});

// ── teacherHighlight() ─────────────────────────────────────────────────────

describe('teacherHighlight()', () => {
  const BASE = { x: 100, y: 80, w: 300, h: 40 };

  it('produces exactly one HIGHLIGHT action', () => {
    const actions = teacherHighlight(BASE);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('HIGHLIGHT');
  });

  it('HIGHLIGHT carries correct region geometry', () => {
    const actions = teacherHighlight(BASE);
    const h = actions[0] as Extract<BoardAction, { type: 'HIGHLIGHT' }>;
    expect(h.x).toBe(100);
    expect(h.y).toBe(80);
    expect(h.w).toBe(300);
    expect(h.h).toBe(40);
  });

  it('uses default color when not specified', () => {
    const actions = teacherHighlight(BASE);
    const h = actions[0] as Extract<BoardAction, { type: 'HIGHLIGHT' }>;
    expect(h.color).toBe('rgba(255, 200, 50, 0.28)');
  });

  it('uses custom color when provided', () => {
    const actions = teacherHighlight({ ...BASE, color: 'rgba(0,200,255,0.3)' });
    const h = actions[0] as Extract<BoardAction, { type: 'HIGHLIGHT' }>;
    expect(h.color).toBe('rgba(0,200,255,0.3)');
  });

  it('uses default durationMs of 2000', () => {
    const actions = teacherHighlight(BASE);
    const h = actions[0] as Extract<BoardAction, { type: 'HIGHLIGHT' }>;
    expect(h.duration).toBe(2000);
  });

  it('uses custom durationMs', () => {
    const actions = teacherHighlight({ ...BASE, durationMs: 3500 });
    const h = actions[0] as Extract<BoardAction, { type: 'HIGHLIGHT' }>;
    expect(h.duration).toBe(3500);
  });

  it('durationMs 0 produces a permanent highlight', () => {
    const actions = teacherHighlight({ ...BASE, durationMs: 0 });
    const h = actions[0] as Extract<BoardAction, { type: 'HIGHLIGHT' }>;
    expect(h.duration).toBe(0);
  });

  it('pulse defaults to false', () => {
    const actions = teacherHighlight(BASE);
    const h = actions[0] as Extract<BoardAction, { type: 'HIGHLIGHT' }>;
    expect(h.pulse).toBe(false);
  });

  it('pulse can be set to true', () => {
    const actions = teacherHighlight({ ...BASE, pulse: true });
    const h = actions[0] as Extract<BoardAction, { type: 'HIGHLIGHT' }>;
    expect(h.pulse).toBe(true);
  });

  it('is deterministic', () => {
    expect(teacherHighlight(BASE)).toEqual(teacherHighlight(BASE));
  });

  it('returns plain serialisable objects', () => {
    const actions = teacherHighlight(BASE);
    expect(() => JSON.stringify(actions)).not.toThrow();
    expect(JSON.parse(JSON.stringify(actions))).toEqual(actions);
  });
});

// ── teacherUnderline() ─────────────────────────────────────────────────────

describe('teacherUnderline()', () => {
  const BASE = { x: 120, y: 310, width: 280 };

  it('produces MOVE_CURSOR → PAUSE → DRAW_UNDERLINE by default', () => {
    const actions = teacherUnderline(BASE);
    expect(actions).toHaveLength(3);
    expect(actions[0].type).toBe('MOVE_CURSOR');
    expect(actions[1].type).toBe('PAUSE');
    expect(actions[2].type).toBe('DRAW_UNDERLINE');
  });

  it('omits PAUSE when preDrawPauseMs is 0', () => {
    const actions = teacherUnderline({ ...BASE, preDrawPauseMs: 0 });
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe('MOVE_CURSOR');
    expect(actions[1].type).toBe('DRAW_UNDERLINE');
  });

  it('MOVE_CURSOR targets the underline start position', () => {
    const actions = teacherUnderline(BASE);
    const move = actions[0] as Extract<BoardAction, { type: 'MOVE_CURSOR' }>;
    expect(move.x).toBe(120);
    expect(move.y).toBe(310);
  });

  it('DRAW_UNDERLINE carries correct geometry', () => {
    const actions = teacherUnderline(BASE);
    const u = actions[2] as Extract<BoardAction, { type: 'DRAW_UNDERLINE' }>;
    expect(u.x).toBe(120);
    expect(u.y).toBe(310);
    expect(u.width).toBe(280);
  });

  it('uses default color', () => {
    const actions = teacherUnderline(BASE);
    const u = actions[2] as Extract<BoardAction, { type: 'DRAW_UNDERLINE' }>;
    expect(u.color).toBe('rgba(255, 200, 50, 0.9)');
  });

  it('uses custom color', () => {
    const actions = teacherUnderline({ ...BASE, color: '#ff4444' });
    const u = actions[2] as Extract<BoardAction, { type: 'DRAW_UNDERLINE' }>;
    expect(u.color).toBe('#ff4444');
  });

  it('uses default strokeWidth of 3', () => {
    const actions = teacherUnderline(BASE);
    const u = actions[2] as Extract<BoardAction, { type: 'DRAW_UNDERLINE' }>;
    expect(u.strokeWidth).toBe(3);
  });

  it('uses custom strokeWidth', () => {
    const actions = teacherUnderline({ ...BASE, strokeWidth: 5 });
    const u = actions[2] as Extract<BoardAction, { type: 'DRAW_UNDERLINE' }>;
    expect(u.strokeWidth).toBe(5);
  });

  it('uses default durationMs of 500', () => {
    const actions = teacherUnderline(BASE);
    const u = actions[2] as Extract<BoardAction, { type: 'DRAW_UNDERLINE' }>;
    expect(u.duration).toBe(500);
  });

  it('uses custom durationMs', () => {
    const actions = teacherUnderline({ ...BASE, durationMs: 800 });
    const u = actions[2] as Extract<BoardAction, { type: 'DRAW_UNDERLINE' }>;
    expect(u.duration).toBe(800);
  });

  it('is deterministic', () => {
    expect(teacherUnderline(BASE)).toEqual(teacherUnderline(BASE));
  });

  it('returns plain serialisable objects', () => {
    const actions = teacherUnderline(BASE);
    expect(() => JSON.stringify(actions)).not.toThrow();
    expect(JSON.parse(JSON.stringify(actions))).toEqual(actions);
  });
});

// ── teacherCircleAround() ──────────────────────────────────────────────────

describe('teacherCircleAround()', () => {
  const BASE = { cx: 400, cy: 300, r: 60 };

  it('produces MOVE_CURSOR → PAUSE → DRAW_CIRCLE by default', () => {
    const actions = teacherCircleAround(BASE);
    expect(actions).toHaveLength(3);
    expect(actions[0].type).toBe('MOVE_CURSOR');
    expect(actions[1].type).toBe('PAUSE');
    expect(actions[2].type).toBe('DRAW_CIRCLE');
  });

  it('omits PAUSE when preDrawPauseMs is 0', () => {
    const actions = teacherCircleAround({ ...BASE, preDrawPauseMs: 0 });
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe('MOVE_CURSOR');
    expect(actions[1].type).toBe('DRAW_CIRCLE');
  });

  it('MOVE_CURSOR targets the top of the circle (12 o\'clock)', () => {
    const actions = teacherCircleAround(BASE);
    const move = actions[0] as Extract<BoardAction, { type: 'MOVE_CURSOR' }>;
    expect(move.x).toBe(400);       // cx
    expect(move.y).toBe(300 - 60);  // cy - r
  });

  it('DRAW_CIRCLE carries correct center and radius', () => {
    const actions = teacherCircleAround(BASE);
    const c = actions[2] as Extract<BoardAction, { type: 'DRAW_CIRCLE' }>;
    expect(c.cx).toBe(400);
    expect(c.cy).toBe(300);
    expect(c.r).toBe(60);
  });

  it('uses default color', () => {
    const actions = teacherCircleAround(BASE);
    const c = actions[2] as Extract<BoardAction, { type: 'DRAW_CIRCLE' }>;
    expect(c.color).toBe('rgba(255, 200, 50, 0.9)');
  });

  it('uses custom color', () => {
    const actions = teacherCircleAround({ ...BASE, color: 'rgba(0,255,128,0.8)' });
    const c = actions[2] as Extract<BoardAction, { type: 'DRAW_CIRCLE' }>;
    expect(c.color).toBe('rgba(0,255,128,0.8)');
  });

  it('uses default strokeWidth of 3', () => {
    const actions = teacherCircleAround(BASE);
    const c = actions[2] as Extract<BoardAction, { type: 'DRAW_CIRCLE' }>;
    expect(c.strokeWidth).toBe(3);
  });

  it('uses default durationMs of 900', () => {
    const actions = teacherCircleAround(BASE);
    const c = actions[2] as Extract<BoardAction, { type: 'DRAW_CIRCLE' }>;
    expect(c.duration).toBe(900);
  });

  it('uses custom durationMs', () => {
    const actions = teacherCircleAround({ ...BASE, durationMs: 1400 });
    const c = actions[2] as Extract<BoardAction, { type: 'DRAW_CIRCLE' }>;
    expect(c.duration).toBe(1400);
  });

  it('MOVE_CURSOR uses fast=false for deliberate movement', () => {
    const actions = teacherCircleAround(BASE);
    const move = actions[0] as Extract<BoardAction, { type: 'MOVE_CURSOR' }>;
    expect(move.fast).toBe(false);
  });

  it('is deterministic', () => {
    expect(teacherCircleAround(BASE)).toEqual(teacherCircleAround(BASE));
  });

  it('returns plain serialisable objects', () => {
    const actions = teacherCircleAround(BASE);
    expect(() => JSON.stringify(actions)).not.toThrow();
    expect(JSON.parse(JSON.stringify(actions))).toEqual(actions);
  });
});

// ── Composability ──────────────────────────────────────────────────────────

describe('emphasis actions composability', () => {
  it('all four emphasis builders can be concatenated into a single sequence', () => {
    const seq: BoardAction[] = [
      ...teacherPoint({ x: 400, y: 300 }),
      ...teacherHighlight({ x: 100, y: 280, w: 300, h: 40 }),
      ...teacherUnderline({ x: 100, y: 320, width: 300 }),
      ...teacherCircleAround({ cx: 400, cy: 300, r: 50 }),
    ];

    const types = seq.map((a) => a.type);
    expect(types).toContain('MOVE_CURSOR');
    expect(types).toContain('POINT');
    expect(types).toContain('HIGHLIGHT');
    expect(types).toContain('DRAW_UNDERLINE');
    expect(types).toContain('DRAW_CIRCLE');
  });

  it('ofType helper correctly filters by action type', () => {
    const seq: BoardAction[] = [
      ...teacherPoint({ x: 0, y: 0 }),
      ...teacherHighlight({ x: 0, y: 0, w: 100, h: 30 }),
    ];
    expect(ofType(seq, 'POINT')).toHaveLength(1);
    expect(ofType(seq, 'HIGHLIGHT')).toHaveLength(1);
    expect(ofType(seq, 'DRAW_CIRCLE')).toHaveLength(0);
  });
});

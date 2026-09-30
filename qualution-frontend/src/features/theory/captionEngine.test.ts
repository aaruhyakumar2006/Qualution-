/**
 * captionEngine.test.ts
 *
 * PHASE 7: Pure unit tests for CaptionEngine.
 *
 * No DOM, no React, no mocks required.
 * Covers: load, tick, seekTo, reset, getActive, subscribe, opacity/fade.
 */

import { describe, it, expect, vi } from 'vitest';
import { CaptionEngine, CAPTION_FADE_MS } from './captionEngine';
import type { CaptionEntry, ActiveCaption } from './captionEngine';

// ── Fixtures ───────────────────────────────────────────────────────────────

const SIMPLE: CaptionEntry = {
  id: 'c1',
  text: 'Hello board',
  startMs: 0,
  durationMs: 2000,
};

const DELAYED: CaptionEntry = {
  id: 'c2',
  text: 'Delayed caption',
  startMs: 1000,
  durationMs: 1500,
};

const PERMANENT: CaptionEntry = {
  id: 'c3',
  text: 'Permanent caption',
  startMs: 0,
  durationMs: 0,
};

// ── Initial state ──────────────────────────────────────────────────────────

describe('CaptionEngine — initial state', () => {
  it('starts with no active captions', () => {
    const engine = new CaptionEngine();
    expect(engine.getActive()).toHaveLength(0);
  });

  it('starts with elapsed time 0', () => {
    const engine = new CaptionEngine();
    expect(engine.getElapsed()).toBe(0);
  });
});

// ── load() ─────────────────────────────────────────────────────────────────

describe('CaptionEngine — load()', () => {
  it('resets clock to 0 on load', () => {
    const engine = new CaptionEngine();
    engine.tick(500);
    engine.load([SIMPLE]);
    expect(engine.getElapsed()).toBe(0);
  });

  it('makes captions with startMs=0 immediately active after load', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE]);
    expect(engine.getActive()).toHaveLength(1);
    expect(engine.getActive()[0].id).toBe('c1');
  });

  it('does not activate captions before their startMs', () => {
    const engine = new CaptionEngine();
    engine.load([DELAYED]);
    // At t=0, DELAYED starts at 1000ms — not yet active
    expect(engine.getActive()).toHaveLength(0);
  });

  it('replaces previous entries on second load', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE]);
    engine.load([DELAYED]);
    // Clock reset to 0, DELAYED not yet active
    expect(engine.getActive()).toHaveLength(0);
  });

  it('notifies subscribers on load', () => {
    const engine = new CaptionEngine();
    const spy = vi.fn();
    engine.subscribe(spy);
    engine.load([SIMPLE]);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ── tick() ─────────────────────────────────────────────────────────────────

describe('CaptionEngine — tick()', () => {
  it('advances elapsed time', () => {
    const engine = new CaptionEngine();
    engine.tick(300);
    expect(engine.getElapsed()).toBe(300);
  });

  it('accumulates multiple ticks', () => {
    const engine = new CaptionEngine();
    engine.tick(100);
    engine.tick(200);
    engine.tick(50);
    expect(engine.getElapsed()).toBe(350);
  });

  it('ignores zero or negative deltas', () => {
    const engine = new CaptionEngine();
    engine.tick(0);
    engine.tick(-100);
    expect(engine.getElapsed()).toBe(0);
  });

  it('activates a delayed caption once its startMs is reached', () => {
    const engine = new CaptionEngine();
    engine.load([DELAYED]);
    engine.tick(999);
    expect(engine.getActive()).toHaveLength(0);
    engine.tick(1); // now at 1000ms
    expect(engine.getActive()).toHaveLength(1);
    expect(engine.getActive()[0].id).toBe('c2');
  });

  it('deactivates a caption once its durationMs has elapsed', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE]); // startMs=0, durationMs=2000
    engine.tick(1999);
    expect(engine.getActive()).toHaveLength(1);
    engine.tick(1); // now at 2000ms — end = start + duration = 2000
    expect(engine.getActive()).toHaveLength(0);
  });

  it('notifies subscribers on each tick', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE]);
    const spy = vi.fn();
    engine.subscribe(spy);
    engine.tick(100);
    engine.tick(100);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

// ── seekTo() ───────────────────────────────────────────────────────────────

describe('CaptionEngine — seekTo()', () => {
  it('sets elapsed to the given time', () => {
    const engine = new CaptionEngine();
    engine.seekTo(750);
    expect(engine.getElapsed()).toBe(750);
  });

  it('clamps negative values to 0', () => {
    const engine = new CaptionEngine();
    engine.seekTo(-100);
    expect(engine.getElapsed()).toBe(0);
  });

  it('activates captions at the seeked time', () => {
    const engine = new CaptionEngine();
    engine.load([DELAYED]); // startMs=1000
    engine.seekTo(1200);
    expect(engine.getActive()).toHaveLength(1);
  });

  it('deactivates captions past their end at the seeked time', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE]); // durationMs=2000
    engine.seekTo(2500);
    expect(engine.getActive()).toHaveLength(0);
  });

  it('notifies subscribers on seekTo', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE]);
    const spy = vi.fn();
    engine.subscribe(spy);
    engine.seekTo(500);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ── reset() ────────────────────────────────────────────────────────────────

describe('CaptionEngine — reset()', () => {
  it('clears all entries', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE, DELAYED]);
    engine.reset();
    expect(engine.getActive()).toHaveLength(0);
  });

  it('resets elapsed time to 0', () => {
    const engine = new CaptionEngine();
    engine.tick(800);
    engine.reset();
    expect(engine.getElapsed()).toBe(0);
  });

  it('notifies subscribers on reset', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE]);
    const spy = vi.fn();
    engine.subscribe(spy);
    engine.reset();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith([]);
  });
});

// ── Permanent captions (durationMs = 0) ───────────────────────────────────

describe('CaptionEngine — permanent captions', () => {
  it('stays active indefinitely when durationMs is 0', () => {
    const engine = new CaptionEngine();
    engine.load([PERMANENT]);
    engine.tick(999_999);
    expect(engine.getActive()).toHaveLength(1);
    expect(engine.getActive()[0].id).toBe('c3');
  });

  it('is removed only by reset()', () => {
    const engine = new CaptionEngine();
    engine.load([PERMANENT]);
    engine.tick(5000);
    engine.reset();
    expect(engine.getActive()).toHaveLength(0);
  });
});

// ── Fade opacity ───────────────────────────────────────────────────────────

describe('CaptionEngine — fade opacity', () => {
  it('opacity is 0 at the exact startMs (no elapsed time in fade window)', () => {
    const engine = new CaptionEngine();
    engine.load([{ ...SIMPLE, appear: 'fade' }]);
    // At t=0, elapsed in fade window = 0 → opacity = 0/FADE_MS = 0
    expect(engine.getActive()[0].opacity).toBeCloseTo(0, 5);
  });

  it('opacity reaches 1 after CAPTION_FADE_MS has elapsed', () => {
    const engine = new CaptionEngine();
    engine.load([{ ...SIMPLE, appear: 'fade' }]);
    engine.tick(CAPTION_FADE_MS);
    expect(engine.getActive()[0].opacity).toBeCloseTo(1, 5);
  });

  it('opacity is 1 in the middle of a long caption', () => {
    const engine = new CaptionEngine();
    engine.load([{ ...SIMPLE, durationMs: 4000, appear: 'fade' }]);
    engine.tick(2000); // well past fade-in, well before fade-out
    expect(engine.getActive()[0].opacity).toBeCloseTo(1, 5);
  });

  it('opacity fades out near the end of the caption', () => {
    const engine = new CaptionEngine();
    engine.load([{ ...SIMPLE, durationMs: 2000, appear: 'fade' }]);
    // 1 ms before end: remaining = 1ms → fadeOut = 1/FADE_MS ≈ very small
    engine.seekTo(1999);
    const opacity = engine.getActive()[0].opacity;
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it('instant appear captions always have opacity 1 when active', () => {
    const engine = new CaptionEngine();
    engine.load([{ ...SIMPLE, appear: 'instant' }]);
    engine.tick(1); // just past startMs
    expect(engine.getActive()[0].opacity).toBe(1);
  });

  it('permanent fade caption has opacity 1 after fade-in', () => {
    const engine = new CaptionEngine();
    engine.load([{ ...PERMANENT, appear: 'fade' }]);
    engine.tick(CAPTION_FADE_MS);
    expect(engine.getActive()[0].opacity).toBeCloseTo(1, 5);
  });
});

// ── Defaults ───────────────────────────────────────────────────────────────

describe('CaptionEngine — defaults applied to ActiveCaption', () => {
  it('applies default position "bottom"', () => {
    const engine = new CaptionEngine();
    engine.load([{ id: 'd1', text: 'x', startMs: 0, durationMs: 1000 }]);
    engine.tick(500);
    expect(engine.getActive()[0].position).toBe('bottom');
  });

  it('applies default fontSize 15', () => {
    const engine = new CaptionEngine();
    engine.load([{ id: 'd2', text: 'x', startMs: 0, durationMs: 1000 }]);
    engine.tick(500);
    expect(engine.getActive()[0].fontSize).toBe(15);
  });

  it('applies default align "center"', () => {
    const engine = new CaptionEngine();
    engine.load([{ id: 'd3', text: 'x', startMs: 0, durationMs: 1000 }]);
    engine.tick(500);
    expect(engine.getActive()[0].align).toBe('center');
  });

  it('applies default appear "fade"', () => {
    const engine = new CaptionEngine();
    engine.load([{ id: 'd4', text: 'x', startMs: 0, durationMs: 1000 }]);
    engine.tick(500);
    expect(engine.getActive()[0].appear).toBe('fade');
  });

  it('respects explicit overrides', () => {
    const engine = new CaptionEngine();
    engine.load([{
      id: 'ov1', text: 'x', startMs: 0, durationMs: 1000,
      position: 'top', fontSize: 20, align: 'left', appear: 'instant',
    }]);
    engine.tick(500);
    const c = engine.getActive()[0];
    expect(c.position).toBe('top');
    expect(c.fontSize).toBe(20);
    expect(c.align).toBe('left');
    expect(c.appear).toBe('instant');
  });
});

// ── Multiple captions ──────────────────────────────────────────────────────

describe('CaptionEngine — multiple captions', () => {
  it('returns all captions active at the same time', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE, DELAYED]);
    engine.seekTo(1200); // both active: SIMPLE (0–2000), DELAYED (1000–2500)
    expect(engine.getActive()).toHaveLength(2);
  });

  it('returns only the captions active at the current time', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE, DELAYED]);
    engine.seekTo(500); // only SIMPLE active
    expect(engine.getActive()).toHaveLength(1);
    expect(engine.getActive()[0].id).toBe('c1');
  });

  it('returns an empty array when no captions are active', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE]);
    engine.seekTo(3000); // past end of SIMPLE
    expect(engine.getActive()).toHaveLength(0);
  });
});

// ── subscribe / unsubscribe ────────────────────────────────────────────────

describe('CaptionEngine — subscribe / unsubscribe', () => {
  it('unsubscribe stops receiving notifications', () => {
    const engine = new CaptionEngine();
    const spy = vi.fn();
    const unsub = engine.subscribe(spy);
    engine.load([SIMPLE]);
    unsub();
    engine.tick(100);
    // spy called once for load, not again after unsub
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('multiple subscribers all receive notifications', () => {
    const engine = new CaptionEngine();
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    engine.subscribe(spy1);
    engine.subscribe(spy2);
    engine.load([SIMPLE]);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
  });
});

// ── Determinism ────────────────────────────────────────────────────────────

describe('CaptionEngine — determinism', () => {
  it('same load + tick sequence always produces the same active set', () => {
    const run = () => {
      const engine = new CaptionEngine();
      engine.load([SIMPLE, DELAYED]);
      engine.tick(1200);
      return engine.getActive().map((c) => ({ id: c.id, opacity: c.opacity }));
    };
    expect(run()).toEqual(run());
  });

  it('getActive() is pure — calling it twice returns equal results', () => {
    const engine = new CaptionEngine();
    engine.load([SIMPLE]);
    engine.tick(500);
    expect(engine.getActive()).toEqual(engine.getActive());
  });

  it('load() does not mutate the original entry objects', () => {
    const entry: CaptionEntry = { id: 'mut', text: 'x', startMs: 0, durationMs: 1000 };
    const engine = new CaptionEngine();
    engine.load([entry]);
    engine.tick(500);
    // Original entry should be unchanged
    expect(entry.startMs).toBe(0);
    expect(entry.durationMs).toBe(1000);
  });
});

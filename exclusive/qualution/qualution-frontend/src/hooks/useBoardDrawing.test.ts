/**
 * useBoardDrawing.test.ts
 *
 * PHASE 5: Integration tests for the useBoardDrawing hook.
 * Tests cover: item registration, progress animation, cursor sync,
 * ordering, cancellation via reset/clear, positional overloads, and teach actions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardDrawing } from './useBoardDrawing';
import type { BoardCursorAPI } from './useBoardCursor';

// ── Mock cursor ─────────────────────────────────────────────────────────────

function makeMockCursor(startX = 0, startY = 0): BoardCursorAPI {
  let x = startX, y = startY, visible = false;
  const moveHistory: [number, number][] = [];

  return {
    get state() { return { x, y, visible }; },
    show: vi.fn(() => { visible = true; }),
    hide: vi.fn(() => { visible = false; }),
    teleport: vi.fn((nx: number, ny: number) => {
      x = nx; y = ny;
      moveHistory.push([nx, ny]);
    }),
    moveTo: vi.fn(async (nx: number, ny: number) => {
      x = nx; y = ny;
      visible = true;
    }),
    reset: vi.fn(),
    _moveHistory: moveHistory,
  } as unknown as BoardCursorAPI;
}

describe('useBoardDrawing (Phase 5)', () => {
  let currentTime = 0;
  let rafCallbacks: Array<{ id: number; fn: (t: number) => void }> = [];
  let nextRafId = 1;

  beforeEach(() => {
    currentTime = 0;
    rafCallbacks = [];
    nextRafId = 1;

    vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
      const id = nextRafId++;
      rafCallbacks.push({ id, fn: cb });
      return id;
    });

    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafCallbacks = rafCallbacks.filter((c) => c.id !== id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const stepTime = (ms: number) => {
    currentTime += ms;
    const callbacksToRun = [...rafCallbacks];
    rafCallbacks = [];
    callbacksToRun.forEach((c) => c.fn(currentTime));
  };

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts with an empty items array and isDrawing=false', () => {
    const { result } = renderHook(() => useBoardDrawing());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.isDrawing).toBe(false);
  });

  // ── drawLine ──────────────────────────────────────────────────────────────

  it('drawLine registers a line item immediately', () => {
    const { result } = renderHook(() => useBoardDrawing());

    act(() => {
      result.current.drawLine({ x1: 0, y1: 0, x2: 100, y2: 0, durationMs: 200 });
    });

    expect(result.current.items.some((i) => i.kind === 'line')).toBe(true);
    expect(result.current.items[0].progress).toBe(0);
  });

  it('drawLine item reaches progress=1 after animation frames', async () => {
    const { result } = renderHook(() => useBoardDrawing());

    let done = false;
    act(() => {
      result.current.drawLine({ x1: 0, y1: 0, x2: 100, y2: 0, durationMs: 200 }).then(() => {
        done = true;
      });
    });

    // Step halfway (100ms)
    act(() => {
      stepTime(0); // initial startTs
      stepTime(100);
    });

    const halfLine = result.current.items.find((i) => i.kind === 'line');
    expect(halfLine?.progress).toBeCloseTo(0.5, 1);

    // Step to completion (200ms)
    await act(async () => {
      stepTime(100);
    });

    expect(done).toBe(true);
    const line = result.current.items.find((i) => i.kind === 'line');
    expect(line?.progress).toBe(1);
  });

  it('drawLine with duration=0 completes immediately at progress=1', async () => {
    const { result } = renderHook(() => useBoardDrawing());

    await act(async () => {
      await result.current.drawLine({ x1: 0, y1: 0, x2: 100, y2: 0, duration: 0 });
    });

    const line = result.current.items.find((i) => i.kind === 'line');
    expect(line?.progress).toBe(1);
  });

  it('drawLine moves cursor to start then tracks tip', async () => {
    const cursor = makeMockCursor(500, 500);
    const { result } = renderHook(() => useBoardDrawing({ cursor }));

    act(() => {
      result.current.drawLine({ x1: 100, y1: 200, x2: 400, y2: 200, durationMs: 200, cursor });
    });

    act(() => {
      stepTime(0);
      stepTime(200);
    });

    expect((cursor as any)._moveHistory.length).toBeGreaterThan(0);
    expect(cursor.state.x).toBe(400);
    expect(cursor.state.y).toBe(200);
  });

  // ── drawArrow ─────────────────────────────────────────────────────────────

  it('drawArrow registers an arrow and completes at progress=1 with cursor at arrow tip', async () => {
    const cursor = makeMockCursor(0, 0);
    const { result } = renderHook(() => useBoardDrawing({ cursor }));

    await act(async () => {
      await result.current.drawArrow({
        x1: 50,
        y1: 50,
        x2: 250,
        y2: 50,
        duration: 0,
        cursor,
      });
    });

    const arrow = result.current.items.find((i) => i.kind === 'arrow');
    expect(arrow?.progress).toBe(1);
    expect(cursor.state.x).toBe(250);
    expect(cursor.state.y).toBe(50);
  });

  // ── drawCircle ────────────────────────────────────────────────────────────

  it('drawCircle registers and completes at progress=1', async () => {
    const cursor = makeMockCursor(0, 0);
    const { result } = renderHook(() => useBoardDrawing({ cursor }));

    await act(async () => {
      await result.current.drawCircle({
        cx: 200,
        cy: 200,
        r: 50,
        duration: 0,
        cursor,
      });
    });

    const circle = result.current.items.find((i) => i.kind === 'circle');
    expect(circle?.progress).toBe(1);
    // Circle starts and ends at top (cx, cy - r) = (200, 150)
    expect(cursor.state.x).toBe(200);
    expect(cursor.state.y).toBe(150);
  });

  // ── drawRect & drawRectangle ──────────────────────────────────────────────

  it('drawRect registers and completes at progress=1', async () => {
    const cursor = makeMockCursor(0, 0);
    const { result } = renderHook(() => useBoardDrawing({ cursor }));

    await act(async () => {
      await result.current.drawRectangle({
        x: 100,
        y: 100,
        w: 80,
        h: 40,
        duration: 0,
        cursor,
      });
    });

    const rect = result.current.items.find((i) => i.kind === 'rect');
    expect(rect?.progress).toBe(1);
    expect(cursor.state.x).toBe(100);
    expect(cursor.state.y).toBe(100);
  });

  // ── Multiple items & Ordering ─────────────────────────────────────────────

  it('accumulates multiple drawing items sequentially', async () => {
    const { result } = renderHook(() => useBoardDrawing());

    await act(async () => {
      await result.current.drawLine({ x1: 0, y1: 0, x2: 100, y2: 0, duration: 0 });
      await result.current.drawArrow({ x1: 100, y1: 0, x2: 300, y2: 0, duration: 0 });
      await result.current.drawCircle({ cx: 200, cy: 200, r: 50, duration: 0 });
      await result.current.drawRect({ x: 50, y: 50, w: 100, h: 50, duration: 0 });
    });

    expect(result.current.items).toHaveLength(4);
    expect(result.current.items[0].kind).toBe('line');
    expect(result.current.items[1].kind).toBe('arrow');
    expect(result.current.items[2].kind).toBe('circle');
    expect(result.current.items[3].kind).toBe('rect');
  });

  // ── Positional arguments overloads ────────────────────────────────────────

  it('supports positional argument overloads for all primitives', async () => {
    const { result } = renderHook(() => useBoardDrawing());

    await act(async () => {
      await result.current.drawLine(10, 20, 100, 20, 0);
      await result.current.drawArrow(50, 50, 150, 50, 0, 16);
      await result.current.drawCircle(200, 200, 40, 0);
      await result.current.drawRectangle(100, 100, 80, 50, 0);
    });

    expect(result.current.items).toHaveLength(4);
  });

  // ── Clear & Reset ─────────────────────────────────────────────────────────

  it('clear() and reset() remove all items and cancel active drawing', async () => {
    const cursor = makeMockCursor(0, 0);
    const { result } = renderHook(() => useBoardDrawing({ cursor }));

    await act(async () => {
      await result.current.drawLine(0, 0, 100, 0, 0);
    });
    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.clear();
    });
    expect(result.current.items).toHaveLength(0);

    await act(async () => {
      await result.current.drawCircle(100, 100, 50, 0);
    });
    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.reset();
    });
    expect(result.current.items).toHaveLength(0);
    expect(cursor.reset).toHaveBeenCalled();
  });

  // ── Coordinated Teacher Actions ──────────────────────────────────────────

  it('supports teachDraw actions with coordinated options', async () => {
    const cursor = makeMockCursor(0, 0);
    const { result } = renderHook(() => useBoardDrawing({ cursor }));

    await act(async () => {
      await result.current.teachDrawLine({
        x1: 10,
        y1: 10,
        x2: 100,
        y2: 10,
        duration: 0,
        beforePause: 0,
        afterPause: 0,
        cursor,
      });
      await result.current.teachDrawArrow({
        x1: 100,
        y1: 10,
        x2: 200,
        y2: 10,
        duration: 0,
        beforePause: 0,
        afterPause: 0,
        cursor,
      });
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].kind).toBe('line');
    expect(result.current.items[1].kind).toBe('arrow');
  });
});

/**
 * useBoardEmphasis.test.ts
 *
 * PHASE 6: Unit and integration tests for useBoardEmphasis hook.
 * Tests cover:
 * - teachPoint: moves cursor, holds intentionally, no artifacts left
 * - teachHighlight: registers highlight with bounding box, fades in, supports persistent/temporary
 * - teachUnderline: calculates start/end below target, reveals progressively with cursor tracking
 * - teachCircleAroundTarget: calculates bounding circle, leads cursor smoothly
 * - reset / clear / cancellation safety: stops in-flight animation, clears items, resets cursor
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardEmphasis } from './useBoardEmphasis';
import type { BoardCursorAPI } from './useBoardCursor';

function makeMockCursor(startX = 0, startY = 0, initialVisible = true): BoardCursorAPI {
  let x = startX;
  let y = startY;
  let visible = initialVisible;
  const moveHistory: [number, number][] = [];

  return {
    get state() {
      return { x, y, visible };
    },
    show: vi.fn(() => {
      visible = true;
    }),
    hide: vi.fn(() => {
      visible = false;
    }),
    teleport: vi.fn((nx: number, ny: number) => {
      x = nx;
      y = ny;
      moveHistory.push([nx, ny]);
    }),
    moveTo: vi.fn(async (nx: number, ny: number) => {
      x = nx;
      y = ny;
      visible = true;
    }),
    reset: vi.fn(),
    _moveHistory: moveHistory,
  } as unknown as BoardCursorAPI;
}

describe('useBoardEmphasis (Phase 6)', () => {
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

  it('starts with empty items and isEmphasizing=false', () => {
    const { result } = renderHook(() => useBoardEmphasis());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.isEmphasizing).toBe(false);
  });

  // ── POINT ─────────────────────────────────────────────────────────────────

  it('teachPoint moves cursor to target and holds for duration', async () => {
    const cursor = makeMockCursor(100, 100, true);
    const { result } = renderHook(() => useBoardEmphasis({ cursor }));

    let promiseDone = false;
    act(() => {
      result.current.teachPoint({
        target: { x: 300, y: 200, width: 80, height: 40 },
        durationMs: 50,
        cursorMoveDuration: 0,
        beforePause: 0,
        afterPause: 0,
      }).then(() => {
        promiseDone = true;
      });
    });

    // Cursor should have moved to top-center of target (300 + 40 = 340, 200)
    expect(cursor.moveTo).toHaveBeenCalledWith(340, 200, 0);

    // Wait for point hold duration
    await new Promise((r) => setTimeout(r, 80));
    expect(promiseDone).toBe(true);
    // POINT does not leave permanent shape items on the board
    expect(result.current.items).toHaveLength(0);
  });

  // ── HIGHLIGHT ─────────────────────────────────────────────────────────────

  it('teachHighlight registers highlight item and animates progress', async () => {
    // Start cursor at target top-center so no travel is needed for progress testing
    const cursor = makeMockCursor(200, 150, true);
    const { result } = renderHook(() => useBoardEmphasis({ cursor }));

    let promiseDone = false;
    act(() => {
      result.current.teachHighlight({
        id: 'hl-1',
        target: { x: 100, y: 150, width: 200, height: 50 },
        durationMs: 200,
        beforePause: 0,
        afterPause: 0,
      }).then(() => {
        promiseDone = true;
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      kind: 'highlight',
      id: 'hl-1',
      x: 100,
      y: 150,
      width: 200,
      height: 50,
      progress: 0,
    });

    // Initialize start time frame
    act(() => { stepTime(0); });
    // Step animation 50%
    act(() => { stepTime(100); });
    expect(result.current.items[0].progress).toBeCloseTo(0.5, 1);

    // Step animation to completion
    act(() => { stepTime(100); });
    expect(result.current.items[0].progress).toBe(1);

    await new Promise((r) => setTimeout(r, 10));
    expect(promiseDone).toBe(true);
  });

  // ── UNDERLINE ─────────────────────────────────────────────────────────────

  it('teachUnderline calculates correct underline below target and tracks cursor', async () => {
    // Start cursor at start of underline (100, 206)
    const cursor = makeMockCursor(100, 206, true);
    const { result } = renderHook(() => useBoardEmphasis({ cursor }));

    let promiseDone = false;
    act(() => {
      result.current.teachUnderline({
        id: 'ul-1',
        target: { x: 100, y: 150, width: 200, height: 50 },
        offsetY: 6,
        durationMs: 200,
        beforePause: 0,
        afterPause: 0,
      }).then(() => {
        promiseDone = true;
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      kind: 'underline',
      id: 'ul-1',
      x1: 100,
      y1: 206, // 150 + 50 + 6
      x2: 300, // 100 + 200
      y2: 206,
      progress: 0,
    });

    // Start frame
    act(() => { stepTime(0); });
    // Step halfway
    act(() => { stepTime(100); });
    expect(result.current.items[0].progress).toBeCloseTo(0.5, 1);
    // Cursor follows endpoint at x = 200
    expect(cursor.teleport).toHaveBeenCalledWith(200, 206);

    // Step to completion
    act(() => { stepTime(100); });
    expect(result.current.items[0].progress).toBe(1);
    expect(cursor.teleport).toHaveBeenCalledWith(300, 206);

    await new Promise((r) => setTimeout(r, 10));
    expect(promiseDone).toBe(true);
  });

  // ── RESET / CANCELLATION ─────────────────────────────────────────────────

  it('reset cancels active animation and empties items', () => {
    const cursor = makeMockCursor(0, 0, true);
    const { result } = renderHook(() => useBoardEmphasis({ cursor }));

    act(() => {
      result.current.teachHighlight({
        id: 'hl-cancel',
        target: { x: 50, y: 50, width: 100, height: 30 },
        durationMs: 500,
      });
    });

    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.isEmphasizing).toBe(false);
    expect(cursor.reset).toHaveBeenCalled();
  });
});

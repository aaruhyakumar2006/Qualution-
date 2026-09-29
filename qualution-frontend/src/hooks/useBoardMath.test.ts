/**
 * useBoardMath.test.ts
 *
 * PHASE 8: Unit tests for useBoardMath hook.
 * Tests cover:
 * - writeMath: creates item, animates opacity from 0 to 1, sets isWriting
 * - teachMath: coordinates cursor moveTo, before/after pause, and mathematical reveal
 * - replaceMath: updates existing math expression in place without creating duplicate items
 * - replaceId option in writeMath: replaces matching item seamlessly
 * - setMathProgress, removeMath, clear, reset
 * - cancellation safety: reset() immediately stops in-flight animations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardMath } from './useBoardMath';
import type { BoardCursorController } from './useBoardCursor';

function makeMockCursor(startX = 0, startY = 0): BoardCursorController {
  let x = startX;
  let y = startY;
  let visible = true;

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
    }),
    moveTo: vi.fn(async (nx: number, ny: number) => {
      x = nx;
      y = ny;
      visible = true;
    }),
    reset: vi.fn(),
  };
}

describe('useBoardMath (Phase 8)', () => {
  let currentTime = 0;
  let rafCallbacks: Array<{ id: number; fn: (t: number) => void }> = [];
  let nextRafId = 1;

  beforeEach(() => {
    currentTime = 0;
    rafCallbacks = [];
    nextRafId = 1;
    vi.useFakeTimers();

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
    vi.useRealTimers();
  });

  const stepTime = (deltaMs: number) => {
    currentTime += deltaMs;
    const toRun = [...rafCallbacks];
    rafCallbacks = [];
    for (const c of toRun) {
      c.fn(currentTime);
    }
  };

  it('starts with empty items and isWriting false', () => {
    const { result } = renderHook(() => useBoardMath());
    expect(result.current.items).toEqual([]);
    expect(result.current.isWriting).toBe(false);
  });

  it('writeMath adds an item and reveals it progressively with opacity animation', async () => {
    const { result } = renderHook(() => useBoardMath());

    let promise!: Promise<void>;
    act(() => {
      promise = result.current.writeMath({
        id: 'qubit-0',
        latex: '|0\\rangle',
        x: 300,
        y: 200,
        durationMs: 200,
      });
    });

    expect(result.current.isWriting).toBe(true);
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].latex).toBe('|0\\rangle');
    expect(result.current.items[0].opacity).toBe(0);

    // Step rAF
    act(() => {
      stepTime(0);
      stepTime(100);
    });
    expect(result.current.items[0].opacity).toBeCloseTo(0.5, 1);

    act(() => {
      stepTime(100);
    });
    await act(async () => {
      await promise;
    });

    expect(result.current.items[0].opacity).toBe(1);
    expect(result.current.isWriting).toBe(false);
  });

  it('teachMath coordinates cursor movement, pause, and reveal', async () => {
    const cursor = makeMockCursor(100, 100);
    const { result } = renderHook(() => useBoardMath({ cursor }));

    let promise!: Promise<void>;
    act(() => {
      promise = result.current.teachMath({
        id: 'hadamard-expr',
        latex: 'H|0\\rangle = |+\\rangle',
        x: 450,
        y: 250,
        durationMs: 200,
        cursorMoveDuration: 300,
        beforePause: 100,
        afterPause: 100,
      });
    });

    // Advance cursor move
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(cursor.moveTo).toHaveBeenCalledWith(450, 250, 300);

    // Advance before pause
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Step opacity animation
    act(() => {
      stepTime(0);
      stepTime(200);
    });

    // Advance after pause
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].latex).toBe('H|0\\rangle = |+\\rangle');
    expect(result.current.items[0].opacity).toBe(1);
  });

  it('replaceMath updates equation state in place without creating duplicate items', async () => {
    const { result } = renderHook(() => useBoardMath());

    // 1. Initial equation: H|0>
    await act(async () => {
      const p = result.current.writeMath({
        id: 'eq-main',
        latex: 'H|0\\rangle',
        x: 400,
        y: 300,
        durationMs: 0,
      });
      await p;
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].latex).toBe('H|0\\rangle');

    // 2. Replace with H|0> = |+>
    let repPromise!: Promise<void>;
    act(() => {
      repPromise = result.current.replaceMath('eq-main', 'H|0\\rangle = |+\\rangle', {
        durationMs: 200,
        beforePause: 0,
        afterPause: 0,
      });
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].latex).toBe('H|0\\rangle = |+\\rangle');

    act(() => {
      stepTime(0);
      stepTime(200);
    });

    await act(async () => {
      await repPromise;
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].latex).toBe('H|0\\rangle = |+\\rangle');
    expect(result.current.items[0].opacity).toBe(1);

    // 3. Replace with full superposition formula
    await act(async () => {
      const p3 = result.current.replaceMath(
        'eq-main',
        '|+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)',
        { durationMs: 0, beforePause: 0, afterPause: 0 }
      );
      await p3;
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].latex).toBe(
      '|+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)'
    );
  });

  it('writeMath with replaceId replaces matching target seamlessly', async () => {
    const { result } = renderHook(() => useBoardMath());

    await act(async () => {
      await result.current.writeMath({
        id: 'state-psi',
        latex: '|\\psi\\rangle',
        x: 350,
        y: 200,
        durationMs: 0,
      });
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].latex).toBe('|\\psi\\rangle');

    await act(async () => {
      await result.current.writeMath({
        id: 'state-psi-expanded',
        latex: '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle',
        x: 350,
        y: 200,
        durationMs: 0,
        replaceId: 'state-psi',
      });
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].latex).toBe(
      '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle'
    );
  });

  it('setMathProgress updates opacity deterministically', async () => {
    const { result } = renderHook(() => useBoardMath());

    await act(async () => {
      await result.current.writeMath({
        id: 'm1',
        latex: '|1\\rangle',
        x: 100,
        y: 100,
        durationMs: 0,
      });
    });

    act(() => {
      result.current.setMathProgress('m1', 0.42);
    });
    expect(result.current.items[0].opacity).toBeCloseTo(0.42, 2);

    act(() => {
      result.current.setMathProgress('m1', 1.5); // clamps to 1
    });
    expect(result.current.items[0].opacity).toBe(1);
  });

  it('removeMath and clear remove math items', async () => {
    const { result } = renderHook(() => useBoardMath());

    await act(async () => {
      await result.current.writeMath({ id: 'm1', latex: '|0\\rangle', x: 100, y: 100, durationMs: 0 });
      await result.current.writeMath({ id: 'm2', latex: '|1\\rangle', x: 200, y: 100, durationMs: 0 });
    });
    expect(result.current.items.length).toBe(2);

    act(() => {
      result.current.removeMath('m1');
    });
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].id).toBe('m2');

    act(() => {
      result.current.clear();
    });
    expect(result.current.items).toEqual([]);
  });

  it('reset() cancels in-flight animations and clears all math state', async () => {
    const { result } = renderHook(() => useBoardMath());

    act(() => {
      result.current.writeMath({
        id: 'in-flight-math',
        latex: 'H|0\\rangle = |+\\rangle',
        x: 300,
        y: 200,
        durationMs: 500,
      });
    });

    act(() => {
      stepTime(0);
      stepTime(100);
    });
    expect(result.current.items.length).toBe(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.isWriting).toBe(false);

    // Further timer or rAF advancement should not update state
    act(() => {
      stepTime(500);
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.items).toEqual([]);
  });
});

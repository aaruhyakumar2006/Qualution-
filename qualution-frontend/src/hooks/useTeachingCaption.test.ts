/**
 * useTeachingCaption.test.ts
 *
 * PHASE 7: Unit tests for useTeachingCaption hook.
 * Tests cover:
 * - showCaption: creates active caption, animates opacity to 1, isVisible true
 * - hideCaption: fades out active caption, clears state, isVisible false
 * - single active caption enforcement: showing a new caption replaces previous
 * - auto-dismiss: when durationMs is set, caption stays and fades out automatically
 * - reset / cancellation: cancels in-flight animation, cleans up state immediately
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTeachingCaption } from './useTeachingCaption';

describe('useTeachingCaption (Phase 7)', () => {
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

  it('starts with empty captions and isVisible false', () => {
    const { result } = renderHook(() => useTeachingCaption());
    expect(result.current.captions).toEqual([]);
    expect(result.current.activeCaption).toBeNull();
    expect(result.current.isVisible).toBe(false);
  });

  it('shows caption and animates opacity from 0 to 1', async () => {
    const { result } = renderHook(() => useTeachingCaption());

    let promise!: Promise<void>;
    act(() => {
      promise = result.current.showCaption('A classical bit has one definite value: 0 or 1.', {
        appearDurationMs: 200,
      });
    });

    // Caption should be initially in state with opacity 0 and isVisible = true
    expect(result.current.isVisible).toBe(true);
    expect(result.current.activeCaption?.text).toBe('A classical bit has one definite value: 0 or 1.');

    // Step rAF
    act(() => {
      stepTime(0); // initial tick
    });
    act(() => {
      stepTime(100); // halfway
    });
    expect(result.current.activeCaption?.opacity).toBeCloseTo(0.5, 1);

    act(() => {
      stepTime(100); // complete
    });
    await act(async () => {
      await promise;
    });

    expect(result.current.activeCaption?.opacity).toBe(1);
    expect(result.current.isVisible).toBe(true);
  });

  it('replaces existing caption with single active caption rule', async () => {
    const { result } = renderHook(() => useTeachingCaption());

    await act(async () => {
      const p1 = result.current.showCaption('First caption', { appearDurationMs: 0 });
      stepTime(0);
      await p1;
    });

    expect(result.current.activeCaption?.text).toBe('First caption');
    expect(result.current.captions.length).toBe(1);

    await act(async () => {
      const p2 = result.current.showCaption('Second replacement caption', { appearDurationMs: 0 });
      stepTime(0);
      await p2;
    });

    expect(result.current.activeCaption?.text).toBe('Second replacement caption');
    expect(result.current.captions.length).toBe(1);
  });

  it('hides caption with fade out transition and clears', async () => {
    const { result } = renderHook(() => useTeachingCaption());

    await act(async () => {
      const p1 = result.current.showCaption('Temporary caption', { appearDurationMs: 0 });
      stepTime(0);
      await p1;
    });

    expect(result.current.isVisible).toBe(true);

    let hidePromise!: Promise<void>;
    act(() => {
      hidePromise = result.current.hideCaption({ durationMs: 200 });
    });

    act(() => {
      stepTime(0);
      stepTime(100);
    });
    expect(result.current.activeCaption?.opacity).toBeCloseTo(0.5, 1);

    act(() => {
      stepTime(100);
    });
    await act(async () => {
      await hidePromise;
    });

    expect(result.current.captions).toEqual([]);
    expect(result.current.activeCaption).toBeNull();
    expect(result.current.isVisible).toBe(false);
  });

  it('auto-dismisses when durationMs > 0', async () => {
    const { result } = renderHook(() => useTeachingCaption());

    let promise!: Promise<void>;
    act(() => {
      promise = result.current.showCaption('Timed caption', {
        appearDurationMs: 0,
        durationMs: 500,
        disappearDurationMs: 0,
      });
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.activeCaption?.text).toBe('Timed caption');

    // Advance timer past duration
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.captions).toEqual([]);
    expect(result.current.isVisible).toBe(false);
  });

  it('reset() immediately clears all captions and cancels animation', async () => {
    const { result } = renderHook(() => useTeachingCaption());

    act(() => {
      result.current.showCaption('In flight caption', { appearDurationMs: 500 });
    });

    act(() => {
      stepTime(0);
      stepTime(100);
    });
    expect(result.current.captions.length).toBe(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.captions).toEqual([]);
    expect(result.current.activeCaption).toBeNull();
    expect(result.current.isVisible).toBe(false);

    // Advancing timers should not cause any errors or state updates
    act(() => {
      stepTime(500);
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.captions).toEqual([]);
  });
});

/**
 * BoardCursor.test.tsx
 *
 * PHASE 2 Tests: Teacher Cursor
 *
 * Coverage:
 * 1. Initial state — position, visibility, moving flag.
 * 2. show() / hide() — toggles visibility without moving cursor.
 * 3. moveTo() — smooth movement with duration, resolves Promise.
 * 4. moveTo() — duration is respected (animation completes asynchronously).
 * 5. moveTo() cancellation — a second moveTo() cancels the first.
 * 6. teleport() — instant reposition, no animation state.
 * 7. reset() — returns to initial position and hides cursor.
 * 8. BoardCursor component — renders when visible, hidden when not.
 * 9. BoardCursor component — percentage positioning from logical coords.
 * 10. Resize coordinate consistency — percentage positioning makes
 *     the cursor board-relative, immune to container pixel size changes.
 */

import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

import { useBoardCursor } from '../../hooks/useBoardCursor';
import { BoardCursor } from './BoardCursor';

// ── rAF mock helpers ───────────────────────────────────────────────────────

/**
 * Installs synchronous rAF mock that immediately fires each callback
 * at a simulated timestamp, letting animation loops complete in tests
 * without real timers.
 */
function installRafMock() {
  let time = 0;
  const pending: Array<(t: number) => void> = [];

  const mockRaf = vi.fn((cb: FrameRequestCallback) => {
    pending.push(cb);
    return pending.length; // fake handle
  });

  const mockCaf = vi.fn((handle: number) => {
    pending.splice(handle - 1, 1);
  });

  vi.stubGlobal('requestAnimationFrame', mockRaf);
  vi.stubGlobal('cancelAnimationFrame', mockCaf);

  /** Advance time by `ms` and flush all pending rAF callbacks. */
  const flush = (ms: number = 0) => {
    time += ms;
    const callbacks = [...pending];
    pending.length = 0;
    for (const cb of callbacks) {
      cb(time);
    }
  };

  /** Run flush repeatedly until no rAF callbacks remain. */
  const flushAll = (maxMs: number = 10000, step: number = 16) => {
    let elapsed = 0;
    while (pending.length > 0 && elapsed < maxMs) {
      flush(step);
      elapsed += step;
    }
  };

  return { flush, flushAll, getTime: () => time };
}

// ══════════════════════════════════════════════════════════════════════════
// 1–7. useBoardCursor hook tests
// ══════════════════════════════════════════════════════════════════════════

describe('useBoardCursor hook (Phase 2)', () => {
  let raf: ReturnType<typeof installRafMock>;

  beforeEach(() => {
    raf = installRafMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ── 1. Initial state ───────────────────────────────────────────────────

  it('initialises with correct default position, hidden, and not moving', () => {
    const { result } = renderHook(() => useBoardCursor({ initialX: 200, initialY: 150 }));
    expect(result.current.state.x).toBe(200);
    expect(result.current.state.y).toBe(150);
    expect(result.current.state.visible).toBe(false);
    expect(result.current.state.moving).toBe(false);
  });

  it('defaults to (100, 80) when no initial position is provided', () => {
    const { result } = renderHook(() => useBoardCursor());
    expect(result.current.state.x).toBe(100);
    expect(result.current.state.y).toBe(80);
  });

  it('can start visible when initialVisible is true', () => {
    const { result } = renderHook(() => useBoardCursor({ initialVisible: true }));
    expect(result.current.state.visible).toBe(true);
  });

  // ── 2. show() / hide() ─────────────────────────────────────────────────

  it('show() makes the cursor visible without changing position', () => {
    const { result } = renderHook(() => useBoardCursor({ initialX: 300, initialY: 200 }));
    act(() => { result.current.show(); });
    expect(result.current.state.visible).toBe(true);
    expect(result.current.state.x).toBe(300);
    expect(result.current.state.y).toBe(200);
  });

  it('hide() hides the cursor without changing position', () => {
    const { result } = renderHook(() => useBoardCursor({ initialVisible: true, initialX: 400, initialY: 300 }));
    act(() => { result.current.hide(); });
    expect(result.current.state.visible).toBe(false);
    expect(result.current.state.x).toBe(400);
    expect(result.current.state.y).toBe(300);
  });

  // ── 3. moveTo() — position and moving flag ─────────────────────────────

  it('moveTo() sets moving=true during animation and moving=false on completion', async () => {
    const { result } = renderHook(() => useBoardCursor({ initialX: 0, initialY: 0 }));

    let promise: Promise<void>;
    act(() => {
      promise = result.current.moveTo(640, 360, 500);
    });

    // After the first tick, moving should be true
    act(() => { raf.flush(16); });
    expect(result.current.state.moving).toBe(true);

    // Complete the animation
    act(() => { raf.flushAll(600); });
    await act(async () => { await promise; });

    expect(result.current.state.moving).toBe(false);
    expect(result.current.state.x).toBeCloseTo(640, 0);
    expect(result.current.state.y).toBeCloseTo(360, 0);
  });

  // ── 4. moveTo() — duration respected ──────────────────────────────────

  it('moveTo() with a short duration resolves faster than a long duration', async () => {
    // Short move
    const { result: r1 } = renderHook(() => useBoardCursor({ initialX: 0, initialY: 0 }));
    let shortDone = false;
    act(() => {
      r1.current.moveTo(100, 100, 100).then(() => { shortDone = true; });
    });
    // After 200ms of simulated rAF time it should be done
    act(() => { raf.flushAll(200); });
    await act(async () => { await Promise.resolve(); });
    expect(shortDone).toBe(true);

    // Long move — reset rAF mock
    vi.unstubAllGlobals();
    raf = installRafMock();

    const { result: r2 } = renderHook(() => useBoardCursor({ initialX: 0, initialY: 0 }));
    let longDone = false;
    act(() => {
      r2.current.moveTo(1000, 600, 2000).then(() => { longDone = true; });
    });
    // After only 500ms it should NOT be done yet
    act(() => { raf.flushAll(500); });
    await act(async () => { await Promise.resolve(); });
    expect(longDone).toBe(false);
  });

  // ── 5. moveTo() cancellation ───────────────────────────────────────────

  it('a second moveTo() cancels the first and completes to the new target', async () => {
    const { result } = renderHook(() => useBoardCursor({ initialX: 0, initialY: 0 }));

    let firstDone = false;
    let secondDone = false;

    // Start a long first move (2000ms)
    act(() => {
      result.current.moveTo(1280, 720, 2000).then(() => { firstDone = true; });
    });

    // Advance partway through the first animation
    act(() => { raf.flush(300); });
    act(() => { raf.flush(300); });

    // At this point, the cursor has moved somewhat but not finished.
    // Now cancel by starting a second moveTo.
    act(() => {
      result.current.moveTo(640, 360, 200).then(() => { secondDone = true; });
    });

    // First promise resolves immediately on cancellation (by design)
    await act(async () => { await Promise.resolve(); });
    expect(firstDone).toBe(true);

    // The second move is now in progress — cursor should not be at (1280, 720)
    expect(result.current.state.x).toBeLessThan(1280);
    expect(result.current.state.y).toBeLessThan(720);

    // Complete the second move
    act(() => { raf.flushAll(400); });
    await act(async () => { await Promise.resolve(); });

    expect(secondDone).toBe(true);
    // Final position is the second target
    expect(result.current.state.x).toBeCloseTo(640, 0);
    expect(result.current.state.y).toBeCloseTo(360, 0);
    expect(result.current.state.moving).toBe(false);
  });

  // ── 6. teleport() ─────────────────────────────────────────────────────

  it('teleport() instantly moves to position with no animation', () => {
    const { result } = renderHook(() => useBoardCursor({ initialX: 0, initialY: 0 }));
    act(() => { result.current.teleport(800, 500); });
    expect(result.current.state.x).toBe(800);
    expect(result.current.state.y).toBe(500);
    expect(result.current.state.moving).toBe(false);
  });

  it('teleport() clamps coordinates to board bounds', () => {
    const { result } = renderHook(() =>
      useBoardCursor({ logicalWidth: 1280, logicalHeight: 720 })
    );
    act(() => { result.current.teleport(9999, -100); });
    expect(result.current.state.x).toBe(1280);
    expect(result.current.state.y).toBe(0);
  });

  // ── 7. reset() ─────────────────────────────────────────────────────────

  it('reset() returns cursor to initial position, hides it, and cancels animation', async () => {
    const { result } = renderHook(() =>
      useBoardCursor({ initialX: 100, initialY: 80, initialVisible: false })
    );

    // Move somewhere and show
    act(() => {
      result.current.show();
      result.current.moveTo(900, 500, 1000);
    });
    act(() => { raf.flush(200); });

    // Reset mid-flight
    act(() => { result.current.reset(); });
    await act(async () => { await Promise.resolve(); });

    expect(result.current.state.x).toBe(100);
    expect(result.current.state.y).toBe(80);
    expect(result.current.state.visible).toBe(false);
    expect(result.current.state.moving).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8–10. BoardCursor component tests
// ══════════════════════════════════════════════════════════════════════════

describe('BoardCursor component (Phase 2)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── 8. Render / visibility ─────────────────────────────────────────────

  it('renders the cursor element when visible=true', () => {
    render(
      <BoardCursor x={640} y={360} visible={true} />
    );
    expect(screen.getByTestId('board-cursor')).toBeInTheDocument();
  });

  it('renders nothing when visible=false', () => {
    render(
      <BoardCursor x={640} y={360} visible={false} />
    );
    expect(screen.queryByTestId('board-cursor')).toBeNull();
  });

  it('has aria-hidden so screen readers ignore it', () => {
    render(<BoardCursor x={100} y={100} visible={true} />);
    expect(screen.getByTestId('board-cursor')).toHaveAttribute('aria-hidden', 'true');
  });

  // ── 9. Percentage positioning from logical coordinates ─────────────────

  it('positions cursor at correct percentages for board center (640, 360) in 1280×720', () => {
    render(
      <BoardCursor
        x={640}
        y={360}
        visible={true}
        logicalWidth={1280}
        logicalHeight={720}
      />
    );
    const el = screen.getByTestId('board-cursor');
    expect(el.style.left).toBe('50%');
    expect(el.style.top).toBe('50%');
  });

  it('positions cursor at top-left (0, 0) as 0% 0%', () => {
    render(<BoardCursor x={0} y={0} visible={true} logicalWidth={1280} logicalHeight={720} />);
    const el = screen.getByTestId('board-cursor');
    expect(el.style.left).toBe('0%');
    expect(el.style.top).toBe('0%');
  });

  it('positions cursor at (1280, 720) as 100% 100%', () => {
    render(<BoardCursor x={1280} y={720} visible={true} logicalWidth={1280} logicalHeight={720} />);
    const el = screen.getByTestId('board-cursor');
    expect(el.style.left).toBe('100%');
    expect(el.style.top).toBe('100%');
  });

  it('calculates non-trivial percentage positions correctly', () => {
    render(
      <BoardCursor
        x={320}
        y={180}
        visible={true}
        logicalWidth={1280}
        logicalHeight={720}
      />
    );
    const el = screen.getByTestId('board-cursor');
    // 320/1280 = 0.25 = 25%, 180/720 = 0.25 = 25%
    expect(el.style.left).toBe('25%');
    expect(el.style.top).toBe('25%');
  });

  // ── 10. Resize coordinate consistency ─────────────────────────────────

  it('maintains identical percentage positioning regardless of physical container size', () => {
    // The key insight: because BoardCursor uses % positioning, the same
    // logical coordinate produces the same % position no matter how large
    // the physical stage is. This test verifies that by rendering in two
    // containers of different sizes and asserting identical % values.

    const { unmount } = render(
      <div style={{ width: '640px', height: '360px' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <BoardCursor
            x={384}
            y={216}
            visible={true}
            logicalWidth={1280}
            logicalHeight={720}
          />
        </div>
      </div>
    );

    const el1 = screen.getByTestId('board-cursor');
    const left1 = el1.style.left;
    const top1 = el1.style.top;
    unmount();

    render(
      <div style={{ width: '1920px', height: '1080px' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <BoardCursor
            x={384}
            y={216}
            visible={true}
            logicalWidth={1280}
            logicalHeight={720}
          />
        </div>
      </div>
    );

    const el2 = screen.getByTestId('board-cursor');
    expect(el2.style.left).toBe(left1); // Same % regardless of physical size
    expect(el2.style.top).toBe(top1);

    // 384/1280 = 30%, 216/720 = 30%
    expect(left1).toBe('30%');
    expect(top1).toBe('30%');
  });
});

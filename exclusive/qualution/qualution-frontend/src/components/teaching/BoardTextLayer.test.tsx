import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import {
  BoardTextLayer,
  type BoardTextItem,
} from './BoardTextLayer';
import { useBoardWriter } from '../../hooks/useBoardWriter';
import type { BoardCursorController } from '../../hooks/useBoardCursor';

describe('BoardTextLayer Component (Phase 3)', () => {
  // ── 1. Text Rendering ───────────────────────────────────────────────────

  it('renders text items with academic styling and correct typography properties', () => {
    const items: BoardTextItem[] = [
      {
        id: 'title-1',
        text: 'WHAT IS A QUBIT?',
        x: 300,
        y: 150,
        fontSize: 48,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        color: 'rgba(240, 245, 255, 0.95)',
        progress: 1,
        visible: true,
      },
    ];

    render(<BoardTextLayer items={items} />);

    const item = screen.getByTestId('board-text-item-title-1');
    expect(item).toBeInTheDocument();
    expect(item.textContent).toBe('WHAT IS A QUBIT?');
    expect(item.style.fontFamily).toBe('Inter, sans-serif');
    expect(item.style.fontWeight).toBe('700');
    expect(item.style.color).toBe('rgba(240, 245, 255, 0.95)');
  });

  it('does not render items when visible is explicitly false', () => {
    const items: BoardTextItem[] = [
      {
        id: 'hidden-item',
        text: 'Hidden Text',
        x: 100,
        y: 100,
        progress: 1,
        visible: false,
      },
    ];

    render(<BoardTextLayer items={items} />);
    expect(screen.queryByTestId('board-text-item-hidden-item')).toBeNull();
  });

  it('positions elements using percentage-based board coordinates', () => {
    const items: BoardTextItem[] = [
      {
        id: 'pos-test',
        text: 'TEST',
        x: 640,
        y: 360,
        fontSize: 40,
        align: 'left',
        progress: 1,
      },
    ];

    render(<BoardTextLayer items={items} logicalWidth={1280} logicalHeight={720} />);
    const item = screen.getByTestId('board-text-item-pos-test');

    // (640 / 1280) * 100 = 50%
    expect(item.style.left).toBe('50%');
    // (360 / 720) * 100 = 50%
    expect(item.style.top).toBe('50%');
  });

  // ── 2. Progressive Reveal ───────────────────────────────────────────────

  it('applies inset(0 100% 0 0) clip-path at progress 0 (fully hidden)', () => {
    const items: BoardTextItem[] = [
      {
        id: 'prog-0',
        text: 'WHAT IS A QUBIT?',
        x: 100,
        y: 100,
        progress: 0,
      },
    ];

    render(<BoardTextLayer items={items} />);
    const item = screen.getByTestId('board-text-item-prog-0');
    expect(item.style.clipPath).toBe('inset(0 100% 0 0)');
  });

  it('applies inset(0 50% 0 0) clip-path at progress 0.5 (half revealed)', () => {
    const items: BoardTextItem[] = [
      {
        id: 'prog-50',
        text: 'WHAT IS A QUBIT?',
        x: 100,
        y: 100,
        progress: 0.5,
      },
    ];

    render(<BoardTextLayer items={items} />);
    const item = screen.getByTestId('board-text-item-prog-50');
    expect(item.style.clipPath).toBe('inset(0 50% 0 0)');
  });

  it('applies inset(0 0% 0 0) clip-path at progress 1 (fully revealed)', () => {
    const items: BoardTextItem[] = [
      {
        id: 'prog-100',
        text: 'WHAT IS A QUBIT?',
        x: 100,
        y: 100,
        progress: 1,
      },
    ];

    render(<BoardTextLayer items={items} />);
    const item = screen.getByTestId('board-text-item-prog-100');
    expect(item.style.clipPath).toBe('inset(0 0% 0 0)');
  });
});

// ── 3. useBoardWriter Hook (Progression, Sync, Determinism) ─────────────────

describe('useBoardWriter Hook (Phase 3)', () => {
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

  it('starts with empty text items', () => {
    const { result } = renderHook(() => useBoardWriter());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.isWriting).toBe(false);
  });

  it('allows direct deterministic scrubbing via setTextProgress', () => {
    const { result } = renderHook(() => useBoardWriter());

    act(() => {
      result.current.writeText({
        id: 'scrub-test',
        text: 'QUBIT',
        x: 100,
        y: 100,
        durationMs: 0, // instant
      });
    });

    expect(result.current.items[0].progress).toBe(1);

    act(() => {
      result.current.setTextProgress('scrub-test', 0.42);
    });

    expect(result.current.items[0].progress).toBe(0.42);
  });

  it('progressively advances progress from 0 to 1 over durationMs', async () => {
    const { result } = renderHook(() => useBoardWriter());

    let finished = false;
    act(() => {
      result.current
        .writeText({
          id: 'anim-test',
          text: 'WHAT IS A QUBIT?',
          x: 200,
          y: 200,
          durationMs: 1000,
        })
        .then(() => {
          finished = true;
        });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].progress).toBe(0);
    expect(result.current.isWriting).toBe(true);

    // Initial frame establishes startTimestamp
    act(() => {
      stepTime(0);
    });

    // Advance 500ms (50% progress)
    act(() => {
      stepTime(500);
    });

    expect(result.current.items[0].progress).toBeCloseTo(0.5, 2);
    expect(finished).toBe(false);

    // Advance remaining 500ms and flush microtasks
    await act(async () => {
      stepTime(500);
    });

    expect(result.current.items[0].progress).toBe(1);
    expect(finished).toBe(true);
    expect(result.current.isWriting).toBe(false);
  });

  it('synchronizes cursor movement with the advancing writing head', async () => {
    const { result } = renderHook(() => useBoardWriter());

    // Mock cursor controller positioned at the start coordinate
    const teleportMock = vi.fn();
    const mockCursor: BoardCursorController = {
      state: { x: 300, y: 250, visible: true, moving: false },
      moveTo: vi.fn().mockResolvedValue(undefined),
      teleport: teleportMock,
      show: vi.fn(),
      hide: vi.fn(),
      reset: vi.fn(),
    };

    act(() => {
      result.current.writeText({
        id: 'sync-test',
        text: 'WHAT IS A QUBIT?',
        x: 300,
        y: 250,
        durationMs: 1000,
        cursor: mockCursor,
      });
    });

    // Initial tick to register start time
    act(() => {
      stepTime(0);
    });

    // Advance 500ms through writing duration
    act(() => {
      stepTime(500);
    });

    // The cursor teleport should have been called with progressive X coordinates
    expect(teleportMock).toHaveBeenCalled();
    const midCall = teleportMock.mock.calls[teleportMock.mock.calls.length - 1];
    expect(midCall[0]).toBeGreaterThan(300); // advanced past startX
  });

  it('clears and resets board text state cleanly', () => {
    const { result } = renderHook(() => useBoardWriter());

    act(() => {
      result.current.writeText({
        id: 'clear-test',
        text: 'REMOVE ME',
        x: 100,
        y: 100,
        durationMs: 0,
      });
    });

    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.isWriting).toBe(false);
  });

  it('cancels the active write animation when reset() is called', async () => {
    const { result } = renderHook(() => useBoardWriter());

    let finished = false;
    act(() => {
      result.current
        .writeText({
          id: 'cancel-test',
          text: 'CANCEL ME',
          x: 100,
          y: 100,
          durationMs: 2000,
        })
        .then(() => {
          finished = true;
        });
    });

    expect(result.current.isWriting).toBe(true);

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.isWriting).toBe(false);
    expect(finished).toBe(true); // Promise resolved on cancellation
  });

  // ── 4. Phase 3 Requirements: Positional API, Multiline, Sequence & Re-write ──

  it('supports positional argument signature: writeText(text, x, y, duration, style)', async () => {
    const { result } = renderHook(() => useBoardWriter());

    act(() => {
      result.current.writeText('WHAT IS A QUBIT?', 240, 140, 1000, {
        fontSize: 48,
        fontWeight: 700,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].text).toBe('WHAT IS A QUBIT?');
    expect(result.current.items[0].x).toBe(240);
    expect(result.current.items[0].y).toBe(140);
    expect(result.current.items[0].fontSize).toBe(48);
  });

  it('preserves multiline strings with newlines and spacing', () => {
    const multilineText = 'A classical bit\n0       1';
    const items: BoardTextItem[] = [
      {
        id: 'multiline-item',
        text: multilineText,
        x: 200,
        y: 200,
        progress: 1,
      },
    ];

    render(<BoardTextLayer items={items} />);
    const item = screen.getByTestId('board-text-item-multiline-item');
    expect(item).toBeInTheDocument();
    expect(item.textContent).toBe(multilineText);
  });

  it('supports WRITE -> RESET -> WRITE with clean state and no duplicate text', async () => {
    const { result } = renderHook(() => useBoardWriter());

    // 1. Write first text
    act(() => {
      result.current.writeText('First Text', 100, 100, 0);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].text).toBe('First Text');

    // 2. Reset board
    act(() => {
      result.current.reset();
    });
    expect(result.current.items).toHaveLength(0);

    // 3. Write second text
    act(() => {
      result.current.writeText('Second Text', 200, 200, 0);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].text).toBe('Second Text');
  });

  it('keeps completed text stably on the board after write completes', async () => {
    const { result } = renderHook(() => useBoardWriter());

    act(() => {
      result.current.writeText('WHAT IS A QUBIT?', 240, 140, 0);
    });
    act(() => {
      result.current.writeText('A classical bit is either 0 or 1.', 240, 240, 0);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].text).toBe('WHAT IS A QUBIT?');
    expect(result.current.items[0].progress).toBe(1);
    expect(result.current.items[1].text).toBe('A classical bit is either 0 or 1.');
    expect(result.current.items[1].progress).toBe(1);
  });

  // ── Phase 4: Coordinated Teacher Action (teachText) ──────────────────────────

  it('executes teachText and progressively adds item to board', async () => {
    const mockCursor: any = {
      state: { x: 256, y: 216, visible: true },
      show: vi.fn(),
      hide: vi.fn(),
      moveTo: vi.fn().mockResolvedValue(undefined),
      teleport: vi.fn((x: number, y: number) => {
        mockCursor.state.x = x;
        mockCursor.state.y = y;
      }),
      reset: vi.fn(),
    };

    const { result } = renderHook(() => useBoardWriter({ cursor: mockCursor }));

    // Instant teachText
    await act(async () => {
      await result.current.teachText({
        text: 'WHAT IS A CLASSICAL BIT?',
        x: 240,
        y: 140,
        duration: 0,
        beforePause: 0,
        afterPause: 0,
        cursor: mockCursor,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].text).toBe('WHAT IS A CLASSICAL BIT?');
    expect(result.current.items[0].progress).toBe(1);
    expect(mockCursor.teleport).toHaveBeenCalled();
  });

  it('supports sequential teachText calls without duplicating or dropping items', async () => {
    const mockCursor: any = {
      state: { x: 256, y: 216, visible: true },
      show: vi.fn(),
      hide: vi.fn(),
      moveTo: vi.fn().mockResolvedValue(undefined),
      teleport: vi.fn(),
      reset: vi.fn(),
    };

    const { result } = renderHook(() => useBoardWriter({ cursor: mockCursor }));

    await act(async () => {
      await result.current.teachText({
        text: 'WHAT IS A CLASSICAL BIT?',
        x: 240,
        y: 140,
        duration: 0,
        beforePause: 0,
        afterPause: 0,
        cursor: mockCursor,
      });
      await result.current.teachText({
        text: '0 OR 1',
        x: 240,
        y: 220,
        duration: 0,
        beforePause: 0,
        afterPause: 0,
        cursor: mockCursor,
      });
      await result.current.teachText({
        text: 'A classical bit has one definite value:\n0 or 1.',
        x: 240,
        y: 290,
        duration: 0,
        beforePause: 0,
        afterPause: 0,
        cursor: mockCursor,
      });
    });

    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0].text).toBe('WHAT IS A CLASSICAL BIT?');
    expect(result.current.items[1].text).toBe('0 OR 1');
    expect(result.current.items[2].text).toBe('A classical bit has one definite value:\n0 or 1.');
    expect(result.current.items.every((i) => i.progress === 1)).toBe(true);
  });

  it('cancels active teachText and clears board on reset', async () => {
    const mockCursor: any = {
      state: { x: 256, y: 216, visible: true },
      show: vi.fn(),
      hide: vi.fn(),
      moveTo: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500))),
      teleport: vi.fn(),
      reset: vi.fn(),
    };

    const { result } = renderHook(() => useBoardWriter({ cursor: mockCursor }));

    // Start a long teachText
    act(() => {
      result.current.teachText({
        text: 'WILL BE CANCELLED',
        x: 240,
        y: 140,
        duration: 3000,
        beforePause: 500,
        cursor: mockCursor,
      });
    });

    // Reset immediately mid-flight
    act(() => {
      result.current.reset();
    });

    expect(result.current.items).toHaveLength(0);
    expect(mockCursor.reset).toHaveBeenCalled();
  });
});


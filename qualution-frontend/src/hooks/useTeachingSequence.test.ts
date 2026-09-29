/**
 * useTeachingSequence.test.ts
 *
 * PHASE 4: Integration tests for the useTeachingSequence hook.
 *
 * Tests cover:
 * - Actions execute in order
 * - PAUSE waits the correct duration
 * - reset() during a running sequence stops it cleanly
 * - Same inputs produce identical final state (determinism)
 * - isRunning transitions correctly
 * - APPEAR, MOVE, WRITE, HIDE actions invoke correct controller methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTeachingSequence } from './useTeachingSequence';
import type { BoardCursorAPI, BoardCursorState } from './useBoardCursor';
import type { BoardWriterController } from './useBoardWriter';
import type { TeachingAction } from '../features/theory/teachingActions';
import { teacherWrite, AUTO_TRAVEL_SENTINEL } from '../features/theory/teachingActions';

// ── Mock factories ─────────────────────────────────────────────────────────

function makeMockCursor(overrides: Partial<BoardCursorState> = {}): BoardCursorAPI {
  const state: BoardCursorState = {
    x: 100,
    y: 100,
    visible: false,
    moving: false,
    ...overrides,
  };

  const moveTo = vi.fn((_x: number, _y: number, _ms?: number) => Promise.resolve());
  const teleport = vi.fn((x: number, y: number) => {
    state.x = x;
    state.y = y;
  });
  const show = vi.fn(() => { state.visible = true; });
  const hide = vi.fn(() => { state.visible = false; });
  const reset = vi.fn(() => {
    state.x = 100;
    state.y = 100;
    state.visible = false;
  });

  return { state, moveTo, teleport, show, hide, reset };
}

function makeMockWriter(): BoardWriterController {
  return {
    items: [],
    isWriting: false,
    writeText: vi.fn(() => Promise.resolve()),
    setTextProgress: vi.fn(),
    clear: vi.fn(),
    reset: vi.fn(),
  };
}

// ── Test helpers ───────────────────────────────────────────────────────────

/** Flush all pending microtasks */
async function flushAll() {
  await act(async () => {
    await Promise.resolve();
  });
}

/** Advance fake timers and flush microtasks */
async function advanceAndFlush(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('useTeachingSequence', () => {
  let cursor: BoardCursorAPI;
  let writer: BoardWriterController;

  beforeEach(() => {
    vi.useFakeTimers();
    cursor = makeMockCursor();
    writer = makeMockWriter();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ── 1. isRunning starts false ────────────────────────────────────────────

  it('isRunning is false initially', () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );
    expect(result.current.isRunning).toBe(false);
  });

  // ── 2. Empty action array resolves immediately ────────────────────────────

  it('run([]) resolves immediately without setting isRunning', async () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    await act(async () => {
      await result.current.run([]);
    });

    expect(result.current.isRunning).toBe(false);
  });

  // ── 3. APPEAR action calls teleport + show ───────────────────────────────

  it('APPEAR calls cursor.teleport and cursor.show', async () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    const actions: TeachingAction[] = [{ kind: 'APPEAR', x: 200, y: 150 }];

    await act(async () => {
      await result.current.run(actions);
    });

    expect(cursor.teleport).toHaveBeenCalledWith(200, 150);
    expect(cursor.show).toHaveBeenCalledTimes(1);
  });

  // ── 4. HIDE action calls cursor.hide ────────────────────────────────────

  it('HIDE calls cursor.hide', async () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    const actions: TeachingAction[] = [{ kind: 'HIDE' }];

    await act(async () => {
      await result.current.run(actions);
    });

    expect(cursor.hide).toHaveBeenCalledTimes(1);
  });

  // ── 5. MOVE action calls cursor.moveTo with correct args ─────────────────

  it('MOVE with explicit duration calls cursor.moveTo with that duration', async () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    const actions: TeachingAction[] = [
      { kind: 'MOVE', x: 400, y: 300, durationMs: 800 },
    ];

    await act(async () => {
      await result.current.run(actions);
    });

    expect(cursor.moveTo).toHaveBeenCalledWith(400, 300, 800);
  });

  // ── 6. MOVE with sentinel auto-computes travel duration ──────────────────

  it('MOVE with AUTO_TRAVEL_SENTINEL computes duration from cursor distance', async () => {
    // Cursor starts at (100, 100), move target (500, 100) → dist = 400
    // autoTravelMs(400) = min(900, max(350, 400 × 0.75)) = min(900, 300) = 350
    // Wait — 400 × 0.75 = 300 which is < 350, so result = 350
    cursor = makeMockCursor({ x: 100, y: 100 });

    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    const actions: TeachingAction[] = [
      { kind: 'MOVE', x: 500, y: 100, durationMs: AUTO_TRAVEL_SENTINEL },
    ];

    await act(async () => {
      await result.current.run(actions);
    });

    expect(cursor.moveTo).toHaveBeenCalledTimes(1);
    const [, , calledDuration] = (cursor.moveTo as ReturnType<typeof vi.fn>).mock.calls[0];
    // Duration should be clamped to [350, 900] range
    expect(calledDuration).toBeGreaterThanOrEqual(350);
    expect(calledDuration).toBeLessThanOrEqual(900);
  });

  // ── 7. WRITE calls writer.writeText with correct fields ──────────────────

  it('WRITE calls writer.writeText with the correct action fields', async () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    const style = { fontSize: 56, color: 'rgba(255,220,80,0.9)' };
    const actions: TeachingAction[] = [
      {
        kind: 'WRITE',
        id: 'test-write',
        text: 'Hello Board',
        x: 300,
        y: 250,
        durationMs: 1200,
        style,
      },
    ];

    await act(async () => {
      await result.current.run(actions);
    });

    expect(writer.writeText).toHaveBeenCalledTimes(1);
    const callArgs = (writer.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArgs.id).toBe('test-write');
    expect(callArgs.text).toBe('Hello Board');
    expect(callArgs.x).toBe(300);
    expect(callArgs.y).toBe(250);
    expect(callArgs.durationMs).toBe(1200);
    expect(callArgs.style).toEqual(style);
    // Cursor should be passed through for writing-head sync
    expect(callArgs.cursor).toBe(cursor);
    // Travel should be suppressed (we already moved cursor via MOVE/APPEAR)
    expect(callArgs.travelDurationMs).toBe(0);
  });

  // ── 8. PAUSE action waits before next action ─────────────────────────────

  it('PAUSE waits the specified duration before executing the next action', async () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    const actions: TeachingAction[] = [
      { kind: 'PAUSE', durationMs: 500 },
      { kind: 'APPEAR', x: 200, y: 150 },
    ];

    let resolved = false;
    act(() => {
      result.current.run(actions).then(() => { resolved = true; });
    });

    // After 0ms: pause not elapsed, APPEAR not called yet
    await flushAll();
    expect(cursor.teleport).not.toHaveBeenCalled();
    expect(resolved).toBe(false);

    // After 499ms: still pausing
    await advanceAndFlush(499);
    expect(cursor.teleport).not.toHaveBeenCalled();

    // After 500ms total: pause elapsed, APPEAR runs
    await advanceAndFlush(1);
    expect(cursor.teleport).toHaveBeenCalledWith(200, 150);
  });

  // ── 9. Actions execute in strict order ───────────────────────────────────

  it('executes actions in the correct order', async () => {
    const callOrder: string[] = [];

    cursor = {
      ...makeMockCursor(),
      teleport: vi.fn((x, y) => { callOrder.push(`teleport(${x},${y})`); }),
      show: vi.fn(() => { callOrder.push('show'); }),
      moveTo: vi.fn(() => { callOrder.push('moveTo'); return Promise.resolve(); }),
      hide: vi.fn(() => { callOrder.push('hide'); }),
    } as unknown as BoardCursorAPI;

    writer = {
      ...makeMockWriter(),
      writeText: vi.fn(() => { callOrder.push('writeText'); return Promise.resolve(); }),
    };

    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    const actions: TeachingAction[] = [
      { kind: 'APPEAR', x: 100, y: 100 },
      { kind: 'MOVE', x: 300, y: 200, durationMs: 100 },
      { kind: 'WRITE', id: 'w1', text: 'Hi', x: 300, y: 200, durationMs: 500 },
      { kind: 'HIDE' },
    ];

    await act(async () => {
      await result.current.run(actions);
    });

    expect(callOrder[0]).toMatch(/teleport/);  // APPEAR
    expect(callOrder[1]).toBe('show');          // APPEAR
    expect(callOrder[2]).toBe('moveTo');        // MOVE
    expect(callOrder[3]).toBe('writeText');     // WRITE
    expect(callOrder[4]).toBe('hide');          // HIDE
  });

  // ── 10. isRunning is true during execution and false after ───────────────

  it('isRunning is true while sequence runs and false after completion', async () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    // Make writeText take time so we can observe isRunning mid-sequence
    (writer.writeText as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise<void>((resolve) => setTimeout(resolve, 200))
    );

    const actions: TeachingAction[] = [
      { kind: 'WRITE', id: 'w', text: 'Test', x: 100, y: 100, durationMs: 200 },
    ];

    let runPromise: Promise<void>;
    act(() => {
      runPromise = result.current.run(actions);
    });

    await flushAll();
    expect(result.current.isRunning).toBe(true);

    await advanceAndFlush(300);
    await runPromise!;
    expect(result.current.isRunning).toBe(false);
  });

  // ── 11. reset() cancels an in-progress sequence ──────────────────────────

  it('reset() cancels an in-progress sequence before it completes', async () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    // A long pause followed by an action we'll check was NOT called
    const actions: TeachingAction[] = [
      { kind: 'PAUSE', durationMs: 2000 },
      { kind: 'APPEAR', x: 999, y: 999 },
    ];

    act(() => {
      result.current.run(actions);
    });

    await flushAll();
    expect(result.current.isRunning).toBe(true);

    // Cancel mid-pause
    act(() => {
      result.current.reset();
    });

    await advanceAndFlush(2500);

    // APPEAR should NOT have been called
    expect(cursor.teleport).not.toHaveBeenCalledWith(999, 999);
    expect(result.current.isRunning).toBe(false);
  });

  // ── 12. Deterministic replay ─────────────────────────────────────────────

  it('running the same sequence twice calls the same methods with the same args', async () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    const actions: TeachingAction[] = [
      { kind: 'APPEAR', x: 150, y: 100 },
      { kind: 'WRITE', id: 'rep', text: 'Replay', x: 150, y: 100, durationMs: 600 },
    ];

    // Run 1
    await act(async () => { await result.current.run(actions); });
    const calls1 = JSON.stringify(
      (writer.writeText as ReturnType<typeof vi.fn>).mock.calls
    );

    vi.clearAllMocks();

    // Run 2
    await act(async () => { await result.current.run(actions); });
    const calls2 = JSON.stringify(
      (writer.writeText as ReturnType<typeof vi.fn>).mock.calls
    );

    expect(calls1).toBe(calls2);
  });

  // ── 13. teacherWrite actions integrate end-to-end ────────────────────────

  it('teacherWrite actions correctly invoke cursor and writer', async () => {
    const { result } = renderHook(() =>
      useTeachingSequence({ cursor, writer })
    );

    const actions: TeachingAction[] = [
      { kind: 'APPEAR', x: 80, y: 80 },
      ...teacherWrite({
        id: 'integration-title',
        text: 'What is a Classical Bit?',
        x: 200,
        y: 240,
        durationMs: 100,
        preWritePauseMs: 50,
      }),
    ];

    let runPromise: Promise<void>;
    act(() => {
      runPromise = result.current.run(actions);
    });

    await flushAll();
    await advanceAndFlush(600);
    await runPromise!;

    // APPEAR was first — cursor.teleport and cursor.show
    expect(cursor.teleport).toHaveBeenCalled();
    expect(cursor.show).toHaveBeenCalled();

    // WRITE was called
    expect(writer.writeText).toHaveBeenCalledTimes(1);
    const writeCall = (writer.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(writeCall.text).toBe('What is a Classical Bit?');
    expect(writeCall.id).toBe('integration-title');
  });
});

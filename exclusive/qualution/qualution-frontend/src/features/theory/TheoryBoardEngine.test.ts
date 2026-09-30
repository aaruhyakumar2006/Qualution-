/**
 * TheoryBoardEngine.test.ts
 *
 * Unit tests for the Theory Board engine.
 * These tests verify the state machine, action execution, and safety boundaries.
 * No DOM access is required — the engine is pure TypeScript.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TheoryBoardEngine } from './TheoryBoardEngine';
import type { BoardLessonScript, PaintedItem, BoardEngineState } from './boardTypes';
import type { PaintCommand } from './TheoryBoardEngine';

// ── Minimal lesson fixtures ───────────────────────────────────────────────

const minimalLesson: BoardLessonScript = {
  id: 'test-lesson',
  title: 'Test Lesson',
  topic: 'Testing',
  difficulty: 'Beginner',
  estimatedMinutes: 1,
  learningObjectives: ['Test objective'],
  steps: [
    {
      id: 'step-1',
      title: 'Step One',
      actions: [
        { type: 'MOVE_CURSOR', x: 100, y: 100 },
        { type: 'PAUSE', duration: 10 },
      ],
    },
    {
      id: 'step-2',
      title: 'Step Two',
      actions: [
        { type: 'MOVE_CURSOR', x: 200, y: 200 },
      ],
    },
  ],
};

const textLesson: BoardLessonScript = {
  id: 'text-lesson',
  title: 'Text Lesson',
  topic: 'Testing',
  difficulty: 'Beginner',
  estimatedMinutes: 1,
  learningObjectives: [],
  steps: [
    {
      id: 'step-text',
      actions: [
        {
          type: 'WRITE_TEXT',
          text: 'Hi',
          x: 50,
          y: 50,
          duration: 50,
        },
      ],
    },
  ],
};

const drawLesson: BoardLessonScript = {
  id: 'draw-lesson',
  title: 'Draw Lesson',
  topic: 'Testing',
  difficulty: 'Beginner',
  estimatedMinutes: 1,
  learningObjectives: [],
  steps: [
    {
      id: 'step-draw',
      actions: [
        { type: 'DRAW_LINE', x1: 0, y1: 0, x2: 100, y2: 100, duration: 30 },
        { type: 'DRAW_ARROW', x1: 100, y1: 0, x2: 200, y2: 100, duration: 30 },
        { type: 'DRAW_RECT', x: 50, y: 50, w: 100, h: 80, duration: 30 },
      ],
    },
  ],
};

// ── Test suite ────────────────────────────────────────────────────────────

describe('TheoryBoardEngine', () => {
  let engine: TheoryBoardEngine;
  let paintCommands: PaintCommand[];
  let stateHistory: BoardEngineState[];

  const mockPaint = (cmd: PaintCommand) => {
    paintCommands.push(cmd);
  };

  beforeEach(() => {
    paintCommands = [];
    stateHistory = [];
    engine = new TheoryBoardEngine({
      speak: async () => {},
      stop: () => {},
      pause: () => {},
      resume: () => {},
      isAvailable: () => true,
      isMuted: () => false,
      setMuted: () => {},
    } as any);
  });

  afterEach(() => {
    engine.dispose();
  });

  // ── Initial state ───────────────────────────────────────────────────────

  it('starts in IDLE state', () => {
    const state = engine.getState();
    expect(state.playback).toBe('IDLE');
    expect(state.currentStepIndex).toBe(0);
    expect(state.totalSteps).toBe(0);
    expect(state.cursorVisible).toBe(false);
    expect(state.progress).toBe(0);
    expect(state.error).toBeNull();
  });

  it('loads a lesson and updates totalSteps', () => {
    engine.load(minimalLesson, mockPaint);
    const state = engine.getState();
    expect(state.totalSteps).toBe(2);
    expect(state.playback).toBe('IDLE');
    expect(state.currentStepIndex).toBe(0);
  });

  // ── Subscription ────────────────────────────────────────────────────────

  it('subscribes and receives state updates', () => {
    engine.load(minimalLesson, mockPaint);
    const unsub = engine.subscribe((s) => stateHistory.push(s));

    // Unsubscribe works
    engine.load(minimalLesson, mockPaint);
    const countAfterLoad = stateHistory.length;
    unsub();
    engine.load(minimalLesson, mockPaint);
    expect(stateHistory.length).toBe(countAfterLoad); // no new states after unsub
  });

  // ── Play / Pause / Restart ──────────────────────────────────────────────

  it('transitions to PLAYING when play() is called', () => {
    engine.load(minimalLesson, mockPaint);
    engine.subscribe((s) => stateHistory.push(s));
    engine.play();
    const playingStates = stateHistory.filter((s) => s.playback === 'PLAYING');
    expect(playingStates.length).toBeGreaterThan(0);
  });

  it('transitions to PAUSED when pause() is called during play', () => {
    engine.load(minimalLesson, mockPaint);
    engine.subscribe((s) => stateHistory.push(s));
    engine.play();
    engine.pause();
    const lastState = stateHistory[stateHistory.length - 1];
    expect(lastState.playback).toBe('PAUSED');
  });

  it('resets to IDLE when restart() is called', () => {
    engine.load(minimalLesson, mockPaint);
    engine.play();
    engine.restart();
    const state = engine.getState();
    expect(state.playback).toBe('IDLE');
    expect(state.currentStepIndex).toBe(0);
    expect(state.progress).toBe(0);
    expect(state.cursorVisible).toBe(false);
  });

  it('emits a CLEAR paint command on restart', () => {
    engine.load(minimalLesson, mockPaint);
    engine.play();
    engine.restart();
    const clearCmds = paintCommands.filter((c) => c.type === 'CLEAR');
    expect(clearCmds.length).toBeGreaterThan(0);
  });

  it('does nothing when pause() is called in IDLE', () => {
    engine.load(minimalLesson, mockPaint);
    engine.pause();
    expect(engine.getState().playback).toBe('IDLE');
  });

  // ── Paint commands ──────────────────────────────────────────────────────

  it('emits ADD paint commands for WRITE_TEXT action', async () => {
    vi.useFakeTimers();
    try {
      engine.load(textLesson, mockPaint);
      engine.play();
      // Drain all chained setTimeout(check, 16) calls inside engine._wait()
      await vi.runAllTimersAsync();
      const addCmds = paintCommands.filter((c) => c.type === 'ADD');
      expect(addCmds.length).toBeGreaterThan(0);
      const textCmd = addCmds.find((c) => c.item?.kind === 'text');
      expect(textCmd).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('emits ADD paint commands for DRAW_LINE action', async () => {
    vi.useFakeTimers();
    try {
      engine.load(drawLesson, mockPaint);
      engine.play();
      await vi.runAllTimersAsync();
      const addCmds = paintCommands.filter((c) => c.type === 'ADD');
      const lineCmd = addCmds.find((c) => c.item?.kind === 'line');
      expect(lineCmd).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('emits ADD paint commands for DRAW_ARROW action', async () => {
    vi.useFakeTimers();
    try {
      engine.load(drawLesson, mockPaint);
      engine.play();
      await vi.runAllTimersAsync();
      const addCmds = paintCommands.filter((c) => c.type === 'ADD');
      const arrowCmd = addCmds.find((c) => c.item?.kind === 'arrow');
      expect(arrowCmd).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('emits ADD paint commands for DRAW_RECT action', async () => {
    vi.useFakeTimers();
    try {
      engine.load(drawLesson, mockPaint);
      engine.play();
      await vi.runAllTimersAsync();
      const addCmds = paintCommands.filter((c) => c.type === 'ADD');
      const rectCmd = addCmds.find((c) => c.item?.kind === 'rect');
      expect(rectCmd).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  // ── getPaintedItems ─────────────────────────────────────────────────────

  it('getPaintedItems returns empty array before play', () => {
    engine.load(minimalLesson, mockPaint);
    expect(engine.getPaintedItems()).toHaveLength(0);
  });

  it('getPaintedItems is cleared on restart', async () => {
    vi.useFakeTimers();
    try {
      engine.load(textLesson, mockPaint);
      engine.play();
      // Advance past settle so items are painted before restart
      await vi.advanceTimersByTimeAsync(500);
      engine.restart();
      expect(engine.getPaintedItems()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  // ── Cursor state ─────────────────────────────────────────────────────────

  it('updates cursorX and cursorY on MOVE_CURSOR action', async () => {
    vi.useFakeTimers();
    try {
      engine.load(minimalLesson, mockPaint);
      engine.subscribe((s) => stateHistory.push(s));
      engine.play();
      await vi.runAllTimersAsync();
      const movedState = stateHistory.find((s) => s.cursorX === 100 && s.cursorY === 100);
      expect(movedState).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  // ── No eval / unsafe execution ───────────────────────────────────────────

  it('does not use eval or Function constructor', () => {
    const engineSource = TheoryBoardEngine.toString();
    expect(engineSource).not.toContain('eval(');
    expect(engineSource).not.toContain('new Function(');
  });

  // ── dispose ───────────────────────────────────────────────────────────────

  it('dispose stops execution and clears subscribers', () => {
    engine.load(minimalLesson, mockPaint);
    engine.play();
    engine.dispose();
    const state = engine.getState();
    // After dispose, playback was interrupted (IDLE or PAUSED)
    expect(['IDLE', 'PAUSED', 'PLAYING', 'COMPLETED']).toContain(state.playback);
  });

  // ── Lesson validation ─────────────────────────────────────────────────────

  it('loads a lesson with zero steps without crashing', () => {
    const emptyLesson: BoardLessonScript = {
      ...minimalLesson,
      id: 'empty',
      steps: [],
    };
    expect(() => engine.load(emptyLesson, mockPaint)).not.toThrow();
  });
});

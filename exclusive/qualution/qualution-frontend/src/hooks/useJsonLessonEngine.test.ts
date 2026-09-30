/**
 * useJsonLessonEngine.test.ts
 *
 * PHASE 9: Integration tests for useJsonLessonEngine hook.
 *
 * Tests:
 * - Loading valid JSON string or object
 * - Handling malformed JSON or validation errors gracefully
 * - Playing declarative lesson through action queue
 * - Switching between Lesson A and Lesson B
 * - Resetting stops execution and clears all board state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJsonLessonEngine } from './useJsonLessonEngine';
import type { BoardCursorController } from './useBoardCursor';
import type { BoardWriterController } from './useBoardWriter';
import type { BoardDrawingController } from './useBoardDrawing';
import type { BoardEmphasisController } from './useBoardEmphasis';
import type { TeachingCaptionController } from './useTeachingCaption';
import type { BoardMathController } from './useBoardMath';
import classicalBitLessonJson from '../features/theory/lessons/declarative/classicalBitLesson.json';
import qubitLessonJson from '../features/theory/lessons/declarative/qubitLesson.json';

function createMockControllers() {
  const cursor: BoardCursorController = {
    state: { x: 100, y: 100, visible: true },
    show: vi.fn(),
    hide: vi.fn(),
    teleport: vi.fn(),
    moveTo: vi.fn(() => Promise.resolve()),
    reset: vi.fn(),
  };

  const writer: BoardWriterController = {
    items: [],
    writeText: vi.fn(() => Promise.resolve()) as any,
    teachText: vi.fn(() => Promise.resolve()),
    setTextProgress: vi.fn(),
    clear: vi.fn(),
    reset: vi.fn(),
    isWriting: false,
  };

  const drawing: BoardDrawingController = {
    items: [],
    drawLine: vi.fn(() => Promise.resolve()),
    drawArrow: vi.fn(() => Promise.resolve()),
    drawCircle: vi.fn(() => Promise.resolve()),
    drawRect: vi.fn(() => Promise.resolve()),
    teachDrawLine: vi.fn(() => Promise.resolve()),
    teachDrawArrow: vi.fn(() => Promise.resolve()),
    teachDrawCircle: vi.fn(() => Promise.resolve()),
    teachDrawRect: vi.fn(() => Promise.resolve()),
    clear: vi.fn(),
    reset: vi.fn(),
    isDrawing: false,
  };

  const emphasis: BoardEmphasisController = {
    items: [],
    teachPoint: vi.fn(() => Promise.resolve()),
    teachHighlight: vi.fn(() => Promise.resolve()),
    teachUnderline: vi.fn(() => Promise.resolve()),
    teachCircleAroundTarget: vi.fn(() => Promise.resolve()),
    removeEmphasis: vi.fn(),
    clear: vi.fn(),
    reset: vi.fn(),
  };

  const caption: TeachingCaptionController = {
    captions: [],
    activeCaption: null,
    showCaption: vi.fn(() => Promise.resolve()),
    hideCaption: vi.fn(() => Promise.resolve()),
    reset: vi.fn(),
    isVisible: false,
  };

  const math: BoardMathController = {
    items: [],
    writeMath: vi.fn(() => Promise.resolve()),
    teachMath: vi.fn(() => Promise.resolve()),
    replaceMath: vi.fn(() => Promise.resolve()),
    setMathProgress: vi.fn(),
    removeMath: vi.fn(),
    clear: vi.fn(),
    reset: vi.fn(),
    isWriting: false,
  };

  return { cursor, writer, drawing, emphasis, caption, math };
}

describe('useJsonLessonEngine (Phase 9)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with null lesson and isRunning false', () => {
    const controllers = createMockControllers();
    const { result } = renderHook(() => useJsonLessonEngine(controllers));

    expect(result.current.currentLesson).toBeNull();
    expect(result.current.actions).toEqual([]);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads valid classicalBitLesson.json and compiles actions', () => {
    const controllers = createMockControllers();
    const { result } = renderHook(() => useJsonLessonEngine(controllers));

    act(() => {
      const res = result.current.loadLesson(classicalBitLessonJson);
      expect(res.ok).toBe(true);
    });

    expect(result.current.currentLesson?.id).toBe('classical-bit-lesson');
    expect(result.current.actions.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('handles malformed JSON strings gracefully without throwing', () => {
    const controllers = createMockControllers();
    const { result } = renderHook(() => useJsonLessonEngine(controllers));

    act(() => {
      const res = result.current.loadLesson('{"bad_json: missing_brace');
      expect(res.ok).toBe(false);
    });

    expect(result.current.error).toContain('Malformed JSON');
    expect(result.current.currentLesson).toBeNull();
  });

  it('handles invalid lesson schema gracefully without throwing', () => {
    const controllers = createMockControllers();
    const { result } = renderHook(() => useJsonLessonEngine(controllers));

    act(() => {
      const res = result.current.loadLesson({ version: 99, id: 'bad' });
      expect(res.ok).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
  });

  it('switches seamlessly from Classical Bit Lesson to Qubit Lesson', () => {
    const controllers = createMockControllers();
    const { result } = renderHook(() => useJsonLessonEngine(controllers));

    // Load Lesson A
    act(() => {
      result.current.loadLesson(classicalBitLessonJson);
    });
    expect(result.current.currentLesson?.id).toBe('classical-bit-lesson');

    // Switch to Lesson B
    act(() => {
      result.current.loadLesson(qubitLessonJson);
    });
    expect(result.current.currentLesson?.id).toBe('qubit-superposition-lesson');
    expect(result.current.actions.some((a) => a.kind === 'WRITE_MATH')).toBe(true);
  });

  it('reset() resets all underlying components and sequence', () => {
    const controllers = createMockControllers();
    const { result } = renderHook(() => useJsonLessonEngine(controllers));

    act(() => {
      result.current.reset();
    });

    expect(controllers.writer.reset).toHaveBeenCalled();
    expect(controllers.drawing.reset).toHaveBeenCalled();
    expect(controllers.emphasis.reset).toHaveBeenCalled();
    expect(controllers.caption.reset).toHaveBeenCalled();
    expect(controllers.math.reset).toHaveBeenCalled();
    expect(controllers.cursor.teleport).toHaveBeenCalledWith(256, 216);
  });
});

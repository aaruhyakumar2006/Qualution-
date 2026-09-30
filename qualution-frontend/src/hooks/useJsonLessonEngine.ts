/**
 * useJsonLessonEngine.ts
 *
 * PHASE 9: Declarative JSON Lesson Engine Hook.
 *
 * Connects the JSON validation and normalization pipeline to the existing
 * teaching controllers via `useTeachingSequence`.
 *
 * Flow:
 *   LESSON JSON (raw string or object)
 *         ↓
 *   VALIDATOR (validateDeclarativeLesson)
 *         ↓
 *   NORMALIZER (normalizeDeclarativeLesson)
 *         ↓
 *   ACTION QUEUE / SEQUENCE (useTeachingSequence)
 *         ↓
 *   EXISTING TEACHING COMPONENTS (cursor, writer, drawing, emphasis, caption, math)
 */

import { useState, useCallback, useRef } from 'react';
import type { BoardCursorController } from './useBoardCursor';
import type { BoardWriterController } from './useBoardWriter';
import type { BoardDrawingController } from './useBoardDrawing';
import type { BoardEmphasisController } from './useBoardEmphasis';
import type { TeachingCaptionController } from './useTeachingCaption';
import type { BoardMathController } from './useBoardMath';
import { useTeachingSequence } from './useTeachingSequence';
import {
  validateDeclarativeLesson,
  normalizeDeclarativeLesson,
  type DeclarativeLesson,
} from '../features/theory/declarativeLesson';
import type { TeachingAction } from '../features/theory/teachingActions';

export interface UseJsonLessonEngineOptions {
  cursor: BoardCursorController;
  writer: BoardWriterController;
  drawing?: BoardDrawingController;
  emphasis?: BoardEmphasisController;
  caption?: TeachingCaptionController;
  math?: BoardMathController;
}

export interface JsonLessonEngineController {
  /** The currently loaded and validated lesson, or null if none loaded */
  currentLesson: DeclarativeLesson | null;
  /** Compiled TeachingAction[] ready for execution */
  actions: TeachingAction[];
  /** Whether the lesson is currently executing */
  isRunning: boolean;
  /** Primary error message if loading or validation failed */
  error: string | null;
  /** Complete list of validation errors if validation failed */
  validationErrors: string[];
  /** Loads and validates a declarative lesson from string or object */
  loadLesson: (input: unknown | string) => { ok: boolean; errors: string[]; actions?: TeachingAction[] };
  /** Plays the currently loaded lesson from the beginning */
  play: (actionsToPlay?: TeachingAction[]) => Promise<void>;
  /** Resets board state, cancels execution, and restores clean empty board */
  reset: () => void;
}

export function useJsonLessonEngine(
  options: UseJsonLessonEngineOptions
): JsonLessonEngineController {
  const { cursor, writer, drawing, emphasis, caption, math } = options;

  const [currentLesson, setCurrentLesson] = useState<DeclarativeLesson | null>(null);
  const [actions, setActions] = useState<TeachingAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const sequence = useTeachingSequence({
    cursor,
    writer,
    drawing,
    emphasis,
    caption,
    math,
  });

  const actionsRef = useRef<TeachingAction[]>([]);

  const resetAllComponents = useCallback(() => {
    sequence.reset();
    writer.reset();
    drawing?.reset();
    emphasis?.reset();
    caption?.reset();
    math?.reset();
    cursor.teleport(256, 216);
    cursor.show();
  }, [sequence, writer, drawing, emphasis, caption, math, cursor]);

  const loadLesson = useCallback(
    (input: unknown | string): { ok: boolean; errors: string[]; actions?: TeachingAction[] } => {
      let parsed: unknown = input;

      if (typeof input === 'string') {
        try {
          parsed = JSON.parse(input);
        } catch (e) {
          const err = `Malformed JSON: ${(e as Error).message}`;
          setError(err);
          setValidationErrors([err]);
          return { ok: false, errors: [err] };
        }
      }

      const result = validateDeclarativeLesson(parsed);
      if (!result.valid || !result.lesson) {
        setError(result.errors[0] || 'Lesson validation failed');
        setValidationErrors(result.errors);
        return { ok: false, errors: result.errors };
      }

      const compiledActions = normalizeDeclarativeLesson(result.lesson);
      actionsRef.current = compiledActions;
      setCurrentLesson(result.lesson);
      setActions(compiledActions);
      setError(null);
      setValidationErrors([]);
      return { ok: true, errors: [], actions: compiledActions };
    },
    []
  );

  const play = useCallback(async (actionsToPlay?: TeachingAction[]): Promise<void> => {
    const targetActions = actionsToPlay ?? actionsRef.current;
    if (targetActions.length === 0) return;
    resetAllComponents();
    await sequence.run(targetActions);
  }, [resetAllComponents, sequence]);

  const reset = useCallback(() => {
    resetAllComponents();
  }, [resetAllComponents]);

  return {
    currentLesson,
    actions,
    isRunning: sequence.isRunning,
    error,
    validationErrors,
    loadLesson,
    play,
    reset,
  };
}

export default useJsonLessonEngine;

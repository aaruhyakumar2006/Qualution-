/**
 * boardLessonRegistry.ts
 *
 * Registry for Theory Board lessons (BoardLessonScript).
 * Parallel to the circuit LessonRegistry but for board-only lessons.
 *
 * Maps theory lesson IDs (the IDs used in TheoreticalLessonReader) to
 * their BoardLessonScript so the reader can automatically show a live
 * teaching board instead of / before static text content.
 */

import type { BoardLessonScript } from './boardTypes';
import { t1ClassicalToQuantum } from './lessons/t1-classical-to-quantum';
import { t2SuperpositionMechanics } from './lessons/t2-superposition-mechanics';
import { t3MeasurementAndBornRule } from './lessons/t3-measurement-and-born-rule';
import { t8GroverSearch } from './lessons/t8-grover-search';

// ── Registry Map ─────────────────────────────────────────────────────────

/**
 * Primary registry: boardLessonId → BoardLessonScript.
 */
const _boardLessons = new Map<string, BoardLessonScript>();

/**
 * Secondary mapping: theoryConceptId → boardLessonId.
 * This allows TheoreticalLessonReader to look up "do I have a board
 * lesson for this concept?" using the IDs already in theoreticalCurriculum.ts.
 */
const _theoryToBoardMap = new Map<string, string>([
  // Map theory concept IDs to board lessons
  ['s1-theory-what-is-quantum', 't1-classical-to-quantum'],
  ['s1-theory-qubits-states', 't1-classical-to-quantum'],
  ['s1-theory-computational-basis', 't1-classical-to-quantum'],
  ['s1-theory-superposition', 't2-superposition-mechanics'],
  ['s1-theory-measurement-probability', 't3-measurement-and-born-rule'],
  ['s2-theory-grover', 't8-grover-search'],
  ['lesson-8-grovers-search', 't8-grover-search'],
  ['grover-theory', 't8-grover-search'],
  ['grover', 't8-grover-search'],
]);

// ── Registration ─────────────────────────────────────────────────────────

function register(lesson: BoardLessonScript): void {
  if (!lesson.id || !lesson.steps || lesson.steps.length === 0) {
    console.warn(`[BoardLessonRegistry] Skipping invalid lesson: ${lesson.id}`);
    return;
  }
  _boardLessons.set(lesson.id.trim().toLowerCase(), lesson);
}

// Register all board lessons here
register(t1ClassicalToQuantum);
register(t2SuperpositionMechanics);
register(t3MeasurementAndBornRule);
register(t8GroverSearch);

// ── Public API ────────────────────────────────────────────────────────────

export const TOTAL_GROVER_DURATION_MS = 315000;

export const GROVER_BEATS = [
  { id: 'T1', number: 1, title: 'The Four Boxes', subtitle: 'Classical Search Bottleneck vs. Quantum Interference', durationMs: 40000 },
  { id: 'T2', number: 2, title: 'Amplitudes', subtitle: 'Equal Superposition & The Born Rule', durationMs: 50000 },
  { id: 'T3', number: 3, title: 'The Hidden Mark', subtitle: 'Phase Inversion (Probabilities Unchanged)', durationMs: 55000 },
  { id: 'T4', number: 4, title: 'The Mirror', subtitle: 'Grover Diffusion Operator (Inversion About the Mean)', durationMs: 70000 },
  { id: 'T5', number: 5, title: 'The Compass', subtitle: 'State Space Rotation & Overshoot Dynamics', durationMs: 55000 },
  { id: 'T6', number: 6, title: 'Scale and Handoff', subtitle: 'O(√N) Quadratic Speedup & Practical Lab Handoff', durationMs: 45000 },
];

/**
 * Direct reference to the board lessons map.
 */
export const BOARD_LESSON_REGISTRY = _boardLessons;

/**
 * Get a board lesson by its own ID (e.g. 't1-classical-to-quantum') or concept ID ('lesson-8-grovers-search').
 */
export function getBoardLesson(id: string | null | undefined): BoardLessonScript | null {
  if (!id) return null;
  const normalized = id.trim().toLowerCase();
  return _boardLessons.get(normalized) ?? getBoardLessonForConcept(normalized);
}

/**
 * Given a theory concept ID (from theoreticalCurriculum.ts), return the
 * matching board lesson — or null if none exists.
 */
export function getBoardLessonForConcept(conceptId: string | null | undefined): BoardLessonScript | null {
  if (!conceptId) return null;
  const boardId = _theoryToBoardMap.get(conceptId.trim().toLowerCase());
  if (!boardId) return null;
  return _boardLessons.get(boardId) ?? null;
}

/**
 * Check whether a theory concept has a board lesson available.
 */
export function hasBoardLesson(conceptId: string | null | undefined): boolean {
  return getBoardLessonForConcept(conceptId) !== null;
}

/**
 * List all registered board lesson IDs.
 */
export function getAllBoardLessonIds(): string[] {
  return Array.from(_boardLessons.keys());
}

/**
 * Generate a complete workbench handoff payload for a given theory lesson.
 */
export function getBoardLessonHandoffPayload(lessonId: string) {
  const lesson = getBoardLesson(lessonId);
  if (!lesson) return null;
  return {
    sourceLessonId: 'lesson-8-grovers-search',
    lessonId: 'lesson-8-grovers-search',
    lessonTitle: lesson.title,
    conceptTitle: lesson.transitionLabel || lesson.title,
    completedAt: Date.now(),
    beatsSeen: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    watchedToEnd: true,
    targetState: '11',
    recommendedExperimentId: 'lesson-8-grovers-search',
    returnPath: '/?theory-lesson=lesson-8-grovers-search',
    circuit: {
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measure: false,
      shots: 1000,
    },
  };
}

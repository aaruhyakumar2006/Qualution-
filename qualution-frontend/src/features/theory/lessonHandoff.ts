/**
 * lessonHandoff.ts
 *
 * PHASE 13: Theory → Quantum Workbench Transition & Context Handoff.
 *
 * Manages the structured handoff object from a theory lesson into the Quantum Workbench IDE.
 * Preserves lesson title, core formula/concept, prediction checkpoint results,
 * and initial circuit state for hands-on experimentation.
 */

import type { CircuitRequest, Gate } from '../circuit/types';
import type { WorkbenchAction, WorkbenchExplanation } from './teachingActions';
import type { DeclarativeLesson } from './declarativeLesson';

export interface CheckpointPredictionSummary {
  checkpointId: string;
  question: string;
  selectedOptionId: string;
  selectedOptionText: string;
  isCorrect: boolean;
  explanation: string;
}

export interface LessonWorkbenchHandoff {
  lessonId: string;
  lessonTitle: string;
  conceptTitle?: string;
  conceptFormula?: string;
  promptText?: string;
  prediction?: CheckpointPredictionSummary;
  explanation?: WorkbenchExplanation;
  circuit: CircuitRequest;
  sourceLessonId?: string;
  completedAt?: number;
  beatsSeen?: string[];
  watchedToEnd?: boolean;
  targetState?: string;
  recommendedExperimentId?: string;
  returnPath?: string;
}

/**
 * Converts a WorkbenchAction setup into a valid CircuitRequest for the Workbench IDE.
 */
export function buildCircuitFromWorkbenchAction(action: WorkbenchAction): CircuitRequest {
  const numQubits = Math.max(1, Math.min(10, action.setup.qubits));
  const gates: Gate[] = (action.setup.gates ?? []).map((g, idx) => ({
    id: `wb-gate-${idx}-${g.gate}-${g.qubit}`,
    gate: g.gate.toLowerCase(),
    targets: [g.qubit],
    column: g.column ?? idx,
  }));

  return {
    qubits: numQubits,
    classical_bits: numQubits,
    gates,
    measure: action.setup.measure ?? true,
    shots: action.setup.shots ?? 1000,
  };
}

/**
 * Creates a structured LessonWorkbenchHandoff object from a lesson, a target workbench action,
 * and optional prediction checkpoint outcome.
 */
export function createLessonHandoff(
  lesson: DeclarativeLesson,
  action: WorkbenchAction,
  prediction?: CheckpointPredictionSummary
): LessonWorkbenchHandoff {
  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    conceptTitle: action.title || lesson.title,
    conceptFormula: action.formula,
    promptText: action.description || 'Build and run the experiment in Quantum Workbench.',
    prediction,
    explanation: action.explanation,
    circuit: buildCircuitFromWorkbenchAction(action),
  };
}

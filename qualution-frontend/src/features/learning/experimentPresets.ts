/**
 * Phase 17: Experiment Presets
 * 
 * Maps theory lessons to practical experiments in the Quantum Workbench.
 * Each preset defines the initial circuit state for hands-on learning.
 */

import type { CircuitRequest } from '../circuit/types';

export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  circuit: CircuitRequest;
  learningObjective: string;
  expectedOutcome: string;
  relatedTheoryLessons: string[];
}

/**
 * Hadamard Superposition Experiment
 * Theory: s1-theory-what-is-quantum, s1-theory-superposition
 * Practice: Apply H gate to |0⟩, observe 50/50 measurement distribution
 */
export const HADAMARD_SUPERPOSITION_EXPERIMENT: ExperimentPreset = {
  id: 'hadamard-superposition',
  name: 'Hadamard Superposition',
  description: 'Create an equal superposition state using the Hadamard gate',
  circuit: {
    qubits: 1,
    classical_bits: 1,
    gates: [
      { id: 'gate-h-0', gate: 'h', targets: [0], column: 0 },
    ],
    measure: true,
    shots: 1000,
  },
  learningObjective: 'Understand how the Hadamard gate creates superposition from the ground state |0⟩',
  expectedOutcome: 'Approximately 50% probability of measuring |0⟩ and 50% probability of measuring |1⟩',
  relatedTheoryLessons: ['s1-theory-what-is-quantum', 's1-theory-superposition', 's1-theory-qubits-states'],
};

/**
 * Experiment Presets Registry
 * Maps experiment IDs to their configurations
 */
const EXPERIMENT_PRESETS: Record<string, ExperimentPreset> = {
  'hadamard-superposition': HADAMARD_SUPERPOSITION_EXPERIMENT,
};

/**
 * Get experiment preset by ID
 * @param experimentId - The unique experiment identifier
 * @returns ExperimentPreset or undefined if not found (returns a deep copy)
 */
export function getExperimentPreset(experimentId: string): ExperimentPreset | undefined {
  const preset = EXPERIMENT_PRESETS[experimentId];
  if (!preset) return undefined;
  
  // Return a deep copy to prevent mutation of registry data
  return JSON.parse(JSON.stringify(preset));
}

/**
 * Check if an experiment preset exists
 * @param experimentId - The unique experiment identifier
 * @returns true if the experiment exists
 */
export function hasExperimentPreset(experimentId: string): boolean {
  return experimentId in EXPERIMENT_PRESETS;
}

/**
 * Get all available experiment presets
 * @returns Array of all experiment presets
 */
export function getAllExperimentPresets(): ExperimentPreset[] {
  return Object.values(EXPERIMENT_PRESETS);
}

/**
 * Get experiments related to a theory lesson
 * @param theoryLessonId - The theory lesson ID
 * @returns Array of related experiment presets (returns deep copies)
 */
export function getExperimentsForTheoryLesson(theoryLessonId: string): ExperimentPreset[] {
  const experiments = Object.values(EXPERIMENT_PRESETS).filter(preset =>
    preset.relatedTheoryLessons.includes(theoryLessonId)
  );
  
  // Return deep copies to prevent mutation
  return JSON.parse(JSON.stringify(experiments));
}

import { describe, it, expect } from 'vitest';
import {
  validateLessonScript,
  assertValidLessonScript,
  evaluateCompletionCriteria,
  evaluateStructuredComparison,
  LessonValidationError,
} from './lessonValidator';
import { s1HadamardSuperpositionLesson } from './lessons/sprint-01/hadamard-superposition';
import type { LessonScript } from './types';
import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';

describe('LessonValidator & Structured Evaluation', () => {
  it('validates canonical Hadamard lesson successfully', () => {
    const res = validateLessonScript(s1HadamardSuperpositionLesson);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(() => assertValidLessonScript(s1HadamardSuperpositionLesson)).not.toThrow();
  });

  it('rejects invalid lessons missing required top-level metadata', () => {
    const invalid: any = {
      id: '',
      title: '',
      sprint: -1,
      difficulty: 'Expert', // Invalid difficulty
      steps: [],
    };

    const res = validateLessonScript(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(() => assertValidLessonScript(invalid)).toThrow(LessonValidationError);
  });

  it('rejects steps with invalid action types or negative qubit indices', () => {
    const badStepLesson: LessonScript = {
      id: 'bad-actions-lesson',
      title: 'Bad Actions Lesson',
      sprint: 1,
      difficulty: 'Beginner',
      estimatedMinutes: 5,
      xpReward: 100,
      learningObjectives: ['Testing validator'],
      prerequisites: [],
      conceptTags: ['test'],
      summary: 'Testing action validation',
      steps: [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Step 1',
          explanation: 'Expl',
          narrationText: 'Narr',
          actions: [
            { type: 'unrecognized_magic_action' as any },
            { type: 'initialize_qubits', qubits: 0 },
            { type: 'highlight_qubit', qubitIndex: -2 },
          ],
        },
      ],
    };

    const res = validateLessonScript(badStepLesson);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('Unrecognized action type'))).toBe(true);
    expect(res.errors.some((e) => e.includes('qubits" must be an integer >= 1'))).toBe(true);
    expect(res.errors.some((e) => e.includes('qubitIndex" must be a non-negative integer'))).toBe(true);
  });

  it('rejects prediction checkpoints with out-of-bounds correctOptionIndex or fewer than 2 options', () => {
    const badCheckpointLesson: LessonScript = {
      id: 'bad-checkpoint-lesson',
      title: 'Bad Checkpoint Lesson',
      sprint: 1,
      difficulty: 'Beginner',
      estimatedMinutes: 5,
      xpReward: 100,
      learningObjectives: ['Testing checkpoint'],
      prerequisites: [],
      conceptTags: ['test'],
      summary: 'Testing checkpoint validation',
      steps: [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Step 1',
          explanation: 'Expl',
          narrationText: 'Narr',
          actions: [],
          checkpoint: {
            id: 'bad-pred',
            prompt: 'Prompt',
            question: 'Question',
            options: [{ id: 'opt-1', label: 'Only one option' }],
            correctOptionIndex: 5, // Out of bounds
            explanation: 'Expl',
          },
        },
      ],
    };

    const res = validateLessonScript(badCheckpointLesson);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('at least 2 options'))).toBe(true);
    expect(res.errors.some((e) => e.includes('out of bounds'))).toBe(true);
  });

  describe('evaluateCompletionCriteria', () => {
    const testCircuit: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: 'g1', gate: 'h', targets: [0], column: 0 },
        { id: 'g2', gate: 'cx', targets: [0, 1], column: 1 },
      ],
      measure: true,
      shots: 1000,
    };

    it('evaluates explicit_finish criterion', () => {
      expect(evaluateCompletionCriteria({ type: 'explicit_finish' }, testCircuit)).toBe(true);
    });

    it('evaluates circuit_has_gates criterion', () => {
      // Must have at least 2 gates and contain 'cx'
      expect(
        evaluateCompletionCriteria(
          {
            type: 'circuit_has_gates',
            minGates: 2,
            requiredGates: ['cx', 'h'],
          },
          testCircuit
        )
      ).toBe(true);

      // Fails if requiring gate not in circuit
      expect(
        evaluateCompletionCriteria(
          {
            type: 'circuit_has_gates',
            requiredGates: ['swap'],
          },
          testCircuit
        )
      ).toBe(false);
    });

    it('evaluates circuit_topology criterion', () => {
      expect(
        evaluateCompletionCriteria(
          {
            type: 'circuit_topology',
            qubits: 2,
            exactGateSequence: ['h', 'cx'],
          },
          testCircuit
        )
      ).toBe(true);

      expect(
        evaluateCompletionCriteria(
          {
            type: 'circuit_topology',
            qubits: 3, // Circuit only has 2
          },
          testCircuit
        )
      ).toBe(false);
    });

    it('evaluates simulation_probability criterion with tolerance', () => {
      const mockResult = {
        simulation: {
          probabilities: { '00': 0.51, '11': 0.49 },
        },
      } as unknown as CircuitRunResponse;

      expect(
        evaluateCompletionCriteria(
          {
            type: 'simulation_probability',
            state: '00',
            minProbability: 0.45,
            maxProbability: 0.55,
          },
          testCircuit,
          mockResult
        )
      ).toBe(true);

      // Fails if probability out of bounds
      expect(
        evaluateCompletionCriteria(
          {
            type: 'simulation_probability',
            state: '00',
            minProbability: 0.9,
          },
          testCircuit,
          mockResult
        )
      ).toBe(false);
    });

    it('evaluates combinations of criteria via all_of and any_of', () => {
      expect(
        evaluateCompletionCriteria(
          {
            type: 'all_of',
            criteria: [
              { type: 'circuit_has_gates', minGates: 2 },
              { type: 'circuit_topology', qubits: 2 },
            ],
          },
          testCircuit
        )
      ).toBe(true);

      expect(
        evaluateCompletionCriteria(
          {
            type: 'any_of',
            criteria: [
              { type: 'circuit_has_gates', requiredGates: ['non_existent'] },
              { type: 'circuit_has_gates', requiredGates: ['h'] },
            ],
          },
          testCircuit
        )
      ).toBe(true);
    });
  });

  describe('evaluateStructuredComparison', () => {
    const mockResult = {
      simulation: {
        probabilities: { '0': 0.495, '1': 0.505 },
      },
    } as unknown as CircuitRunResponse;

    it('confirms prediction when choice is correct and distribution meets expectation', () => {
      const res = evaluateStructuredComparison(
        1, // Selected option index
        1, // Correct option index
        {
          expectedDistribution: {
            '0': { min: 0.4, max: 0.6 },
            '1': { min: 0.4, max: 0.6 },
          },
          matchSummary: 'Superposition matched!',
        },
        mockResult,
        'Explanation of Born rule'
      );

      expect(res.isMatch).toBe(true);
      expect(res.userSummary).toBe('Superposition matched!');
    });

    it('detects divergence when choice is incorrect', () => {
      const res = evaluateStructuredComparison(
        0, // Wrong option
        1, // Correct
        {
          expectedDistribution: {
            '0': { min: 0.4, max: 0.6 },
          },
        },
        mockResult,
        'Explanation of Born rule'
      );

      expect(res.isMatch).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { s1AssessmentScript } from './sprint-01-assessment';
import { lessonRegistry } from '../lessonRegistry';
import { validateLessonScript, evaluateCompletionCriteria } from '../lessonValidator';
import { TeachingController, type TeachingIDEHooks } from '../teachingController';
import type { CircuitRequest, CircuitRunResponse } from '../../circuit/types';

describe('Sprint 1 Assessment: Predict, Build & Explain', () => {
  let mockCircuit: CircuitRequest;
  let mockRunResult: CircuitRunResponse;
  let hooks: TeachingIDEHooks;

  beforeEach(() => {
    mockCircuit = {
      qubits: 1,
      classical_bits: 1,
      gates: [],
      measure: true,
      shots: 500,
    };

    mockRunResult = {
      valid: true,
      simulation: {
        backend: 'qiskit_aer',
        execution_time_ms: 10,
        counts: { '0': 0, '1': 500 },
        probabilities: { '0': 0.0, '1': 1.0 },
        statevector: [
          { real: 0.0, imag: 0 },
          { real: 1.0, imag: 0 },
        ],
      },
      visualization: {
        bloch: { x: 0.0, y: 0.0, z: -1.0, purity: 1.0, magnitude: 1.0 },
      },
      metrics: {
        gate_count: 1,
        depth: 1,
        multi_qubit_gates: 0,
        qubit_count: 1,
      },
    } as unknown as CircuitRunResponse;

    hooks = {
      getCircuit: vi.fn(() => mockCircuit),
      updateCircuit: vi.fn((newCirc) => {
        mockCircuit = newCirc;
      }),
      runSimulation: vi.fn(async () => mockRunResult),
      getSimulationResult: vi.fn(() => mockRunResult),
      focusVisualization: vi.fn(),
      highlightGate: vi.fn(),
      highlightQubit: vi.fn(),
      clearHighlights: vi.fn(),
      showToast: vi.fn(),
    };
  });

  it('1. passes validateLessonScript with zero errors', () => {
    const validation = validateLessonScript(s1AssessmentScript);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('2. is registered in the central LessonRegistry under ID s1-assessment', () => {
    const fromRegistry = lessonRegistry.getLesson('s1-assessment');
    expect(fromRegistry).toBeDefined();
    expect(fromRegistry?.id).toBe('s1-assessment');
    expect(fromRegistry?.title).toBe('Sprint 1 Assessment: Predict, Build & Explain');
    expect(fromRegistry?.curriculumModuleId).toBe('lesson-1-sprint-1-assessment');
    expect(fromRegistry?.isAssessment).toBe(true);
    expect(fromRegistry?.steps).toHaveLength(14);

    const allLessons = lessonRegistry.getAllLessons();
    expect(allLessons.some((l) => l.id === 's1-assessment')).toBe(true);
  });

  it('3. verifies Task 1 prediction occurs before execution and expects 100% 1 for Pauli-X', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1AssessmentScript);
    await controller.start();

    // Starts directly at Task 1
    expect(controller.getState().currentStepIndex).toBe(0);
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(hooks.runSimulation).not.toHaveBeenCalled();

    const cp = controller.getState().currentStep?.checkpoint;
    expect(cp?.id).toBe('pred-s1-task1-x');
    expect(cp?.options[cp.correctOptionIndex].label).toBe('Approximately 100% 1');

    // Submitting wrong option does not match correctOptionIndex
    expect(cp?.options[1].isCorrect).toBe(false);
  });

  it('4. verifies Task 2 requires actual simulation and Pauli-X gate for P(1) >= 0.95', () => {
    const task2 = s1AssessmentScript.steps[1];
    expect(task2.takeover).toBeDefined();
    const criteria = task2.takeover!.completionCriteria!;

    // Empty circuit fails
    expect(evaluateCompletionCriteria(criteria, mockCircuit, null)).toBe(false);

    // Circuit with X but no simulation result fails
    const xCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [{ id: 'g-x', gate: 'x', targets: [0], column: 0 }],
      measure: true,
      shots: 500,
    };
    expect(evaluateCompletionCriteria(criteria, xCircuit, null)).toBe(false);

    // Circuit with X and valid simulation passes
    expect(
      evaluateCompletionCriteria(criteria, xCircuit, {
        valid: true,
        simulation: { probabilities: { '0': 0.0, '1': 1.0 } },
      } as unknown as CircuitRunResponse)
    ).toBe(true);
  });

  it('5. verifies Task 3 superposition prediction expects balanced 50/50 distribution', () => {
    const task3 = s1AssessmentScript.steps[2];
    expect(task3.checkpoint).toBeDefined();
    const cp = task3.checkpoint!;

    expect(cp.correctOptionIndex).toBe(0);
    expect(cp.options[0].label).toContain('Approximately 50% 0 and 50% 1');
  });

  it('6. verifies Task 4 phase reasoning identifies state |−⟩ with 50/50 computational measurement', () => {
    const task4 = s1AssessmentScript.steps[3];
    expect(task4.checkpoint).toBeDefined();
    const cp = task4.checkpoint!;

    expect(cp.correctOptionIndex).toBe(0);
    expect(cp.options[0].label).toContain('State |−⟩');
    expect(cp.options[0].label).toContain('50% 0 and 50% 1');
    expect(cp.options[0].isCorrect).toBe(true);

    // Distractors
    expect(cp.options[1].isCorrect).toBe(false);
    expect(cp.options[2].isCorrect).toBe(false);
    expect(cp.options[3].isCorrect).toBe(false);
  });

  it('7. verifies Task 5 gate ordering contrasts Circuit A (|+⟩) and Circuit B (|−⟩)', () => {
    const task5 = s1AssessmentScript.steps[4];
    expect(task5.checkpoint).toBeDefined();
    const cp = task5.checkpoint!;

    expect(cp.correctOptionIndex).toBe(0);
    expect(cp.options[0].label).toContain('Circuit A produces |+⟩ and Circuit B produces |−⟩');
    expect(cp.options[0].label).toContain('physically distinct states');
  });

  it('8. verifies Task 6 interference transfer predicts and requires H-Z-H producing >= 95% outcome 1', () => {
    const task6a = s1AssessmentScript.steps[5];
    expect(task6a.checkpoint?.options[task6a.checkpoint.correctOptionIndex].label).toBe(
      'Approximately 100% outcome 1'
    );

    const task6b = s1AssessmentScript.steps[6];
    const criteria = task6b.takeover!.completionCriteria!;
    const hzhCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'g1', gate: 'h', targets: [0], column: 0 },
        { id: 'g2', gate: 'z', targets: [0], column: 1 },
        { id: 'g3', gate: 'h', targets: [0], column: 2 },
      ],
      measure: true,
      shots: 500,
    };
    const simSuccess = {
      valid: true,
      simulation: { probabilities: { '0': 0.0, '1': 1.0 } },
    } as unknown as CircuitRunResponse;

    expect(evaluateCompletionCriteria(criteria, hzhCircuit, simSuccess)).toBe(true);

    // Missing Z gate fails
    const hhCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'g1', gate: 'h', targets: [0], column: 0 },
        { id: 'g2', gate: 'h', targets: [0], column: 1 },
      ],
      measure: true,
      shots: 500,
    };
    expect(evaluateCompletionCriteria(criteria, hhCircuit, simSuccess)).toBe(false);
  });

  it('9. verifies Task 7 debugging evaluates diagnosis and experimental correction', () => {
    // 7a Diagnosis
    const task7a = s1AssessmentScript.steps[7];
    expect(task7a.checkpoint?.correctOptionIndex).toBe(0);
    expect(task7a.checkpoint?.options[0].label).toContain('applying X to |+⟩ leaves the state as |+⟩');

    // 7b Correction
    const task7b = s1AssessmentScript.steps[8];
    const criteria = task7b.takeover!.completionCriteria!;

    // Erroneous circuit producing 0 fails
    const brokenCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'h1', gate: 'h', targets: [0], column: 0 },
        { id: 'x', gate: 'x', targets: [0], column: 1 },
        { id: 'h2', gate: 'h', targets: [0], column: 2 },
      ],
      measure: true,
      shots: 500,
    };
    const brokenSim = {
      valid: true,
      simulation: { probabilities: { '0': 1.0, '1': 0.0 } },
    } as unknown as CircuitRunResponse;
    expect(evaluateCompletionCriteria(criteria, brokenCircuit, brokenSim)).toBe(false);

    // Repaired circuit producing outcome 1 passes
    const repairedSim = {
      valid: true,
      simulation: { probabilities: { '0': 0.02, '1': 0.98 } },
    } as unknown as CircuitRunResponse;
    expect(evaluateCompletionCriteria(criteria, brokenCircuit, repairedSim)).toBe(true);
  });

  it('10. verifies Task 8 novel transfer requires synthesizing state |−⟩ with 50/50 distribution', () => {
    const task8 = s1AssessmentScript.steps[9];
    const criteria = task8.takeover!.completionCriteria!;

    const xhCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'x', gate: 'x', targets: [0], column: 0 },
        { id: 'h', gate: 'h', targets: [0], column: 1 },
      ],
      measure: true,
      shots: 500,
    };
    const xhSim = {
      valid: true,
      simulation: { probabilities: { '0': 0.48, '1': 0.52 } },
    } as unknown as CircuitRunResponse;

    expect(evaluateCompletionCriteria(criteria, xhCircuit, xhSim)).toBe(true);

    // Single gate fails minGates
    const hOnly = {
      qubits: 1,
      classical_bits: 1,
      gates: [{ id: 'h', gate: 'h', targets: [0], column: 0 }],
      measure: true,
      shots: 500,
    };
    expect(evaluateCompletionCriteria(criteria, hOnly, xhSim)).toBe(false);
  });

  it('11. verifies Task 9 conceptual explanation covers measurement basis, amplitudes, and phase', () => {
    const task9 = s1AssessmentScript.steps[10];
    const cp = task9.checkpoint!;
    expect(cp.correctOptionIndex).toBe(0);
    expect(cp.options[0].label).toContain('computational-basis measurement samples only amplitude squared');
    expect(cp.options[0].label).toContain('discarding the relative phase angle θ');
  });

  it('12. verifies Task 10 final mastery tests full interference loop (X → H → Z → H → 100% 0)', () => {
    // 10a Prediction
    const task10a = s1AssessmentScript.steps[11];
    expect(task10a.checkpoint?.correctOptionIndex).toBe(0);
    expect(task10a.checkpoint?.options[0].label).toBe('Approximately 100% outcome 0');

    // 10b Build
    const task10b = s1AssessmentScript.steps[12];
    const criteria = task10b.takeover!.completionCriteria!;
    const xhzhCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'g1', gate: 'x', targets: [0], column: 0 },
        { id: 'g2', gate: 'h', targets: [0], column: 1 },
        { id: 'g3', gate: 'z', targets: [0], column: 2 },
        { id: 'g4', gate: 'h', targets: [0], column: 3 },
      ],
      measure: true,
      shots: 500,
    };
    const xhzhSim = {
      valid: true,
      simulation: { probabilities: { '0': 1.0, '1': 0.0 } },
    } as unknown as CircuitRunResponse;

    expect(evaluateCompletionCriteria(criteria, xhzhCircuit, xhzhSim)).toBe(true);
  });

  it('13. verifies failed challenge does NOT automatically complete when allowEarlyCompletion is false', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1AssessmentScript);
    await controller.start();

    // Step 1: Submit Prediction 1 -> Advances to Step 2 (Task 2 Takeover)
    await controller.submitPrediction(0);
    expect(controller.getState().currentStepIndex).toBe(1);
    expect(controller.getState().status).toBe('LEARNER_TURN');

    // Circuit is empty, simulation is null
    mockCircuit.gates = [];
    (hooks.getSimulationResult as any).mockReturnValue(null);

    // Attempt to finish without fulfilling criteria
    await controller.completeLearnerTurn();

    // Must remain on Step 2 in LEARNER_TURN
    expect(controller.getState().status).toBe('LEARNER_TURN');
    expect(controller.getState().currentStepIndex).toBe(1);
    expect(hooks.showToast).toHaveBeenCalledWith('info', expect.stringContaining('Task 2'));
  });

  it('14. verifies hints are populated progressively across all assessment build tasks', () => {
    const takeoverSteps = s1AssessmentScript.steps.filter((s) => s.takeover);
    expect(takeoverSteps.length).toBe(5); // Tasks 2, 6, 7, 8, 10

    for (const step of takeoverSteps) {
      expect(step.takeover?.hints).toBeDefined();
      expect(step.takeover!.hints!.length).toBeGreaterThanOrEqual(2);
      expect(step.takeover?.allowEarlyCompletion).toBe(false);
    }
  });

  it('15. verifies TeachingController contains zero assessment-specific branching', () => {
    const controller = new TeachingController(hooks);
    expect((controller as any).handleAssessment).toBeUndefined();
    expect((controller as any).sprintAssessmentStep).toBeUndefined();
    expect((controller as any).gradeAssessment).toBeUndefined();
  });

  it('16. verifies no Sprint 2 content is introduced in the assessment', () => {
    expect(s1AssessmentScript.sprint).toBe(1);
    expect(s1AssessmentScript.starterCircuit?.qubits).toBe(1);

    for (const step of s1AssessmentScript.steps) {
      for (const action of step.actions) {
        if (action.type === 'add_gate') {
          expect(['x', 'h', 'z']).toContain(action.gate.toLowerCase());
        }
      }
      expect(step.title).not.toContain('CNOT');
      expect(step.title).not.toContain('Bell');
      expect(step.explanation).not.toContain('CNOT');
      expect(step.explanation).not.toContain('Bell state');
    }
  });
});

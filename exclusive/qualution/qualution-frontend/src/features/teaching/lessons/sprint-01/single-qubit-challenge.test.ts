import { describe, it, expect, vi, beforeEach } from 'vitest';
import { s1SingleQubitChallengeLesson } from './single-qubit-challenge';
import { lessonRegistry } from '../../lessonRegistry';
import { validateLessonScript, evaluateCompletionCriteria } from '../../lessonValidator';
import { TeachingController, type TeachingIDEHooks } from '../../teachingController';
import type { CircuitRequest, CircuitRunResponse } from '../../../circuit/types';

describe('Sprint 1 Lesson 6: Single-Qubit Challenge (Predict, Build & Prove)', () => {
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
    const validation = validateLessonScript(s1SingleQubitChallengeLesson);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('2. is registered in the central LessonRegistry', () => {
    const fromRegistry = lessonRegistry.getLesson('s1-single-qubit-challenge');
    expect(fromRegistry).toBeDefined();
    expect(fromRegistry?.id).toBe('s1-single-qubit-challenge');
    expect(fromRegistry?.title).toBe('Single-Qubit Challenge: Predict, Build & Prove');
    expect(fromRegistry?.curriculumModuleId).toBe('lesson-1-single-qubit-challenge');
    expect(fromRegistry?.steps).toHaveLength(11);

    const allLessons = lessonRegistry.getAllLessons();
    expect(allLessons.some((l) => l.id === 's1-single-qubit-challenge')).toBe(true);
  });

  it('3. verifies Challenge 1 target behavior (Pauli-X produces 100% 1)', () => {
    const ch1Step = s1SingleQubitChallengeLesson.steps[2]; // Step 3
    expect(ch1Step.takeover).toBeDefined();
    const criteria = ch1Step.takeover!.completionCriteria!;

    // Circuit with Pauli-X
    const xCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [{ id: 'g-x', gate: 'x', targets: [0], column: 0 }],
      measure: true,
      shots: 500,
    };
    const xResult: CircuitRunResponse = {
      valid: true,
      simulation: { probabilities: { '0': 0.0, '1': 1.0 } },
    } as unknown as CircuitRunResponse;

    expect(evaluateCompletionCriteria(criteria, xCircuit, xResult)).toBe(true);

    // Empty circuit fails
    expect(evaluateCompletionCriteria(criteria, mockCircuit, null)).toBe(false);
  });

  it('4. verifies Challenge 2 target behavior (Hadamard produces balanced 50/50 superposition)', () => {
    const ch2Step = s1SingleQubitChallengeLesson.steps[4]; // Step 5
    expect(ch2Step.takeover).toBeDefined();
    const criteria = ch2Step.takeover!.completionCriteria!;

    // Circuit with H
    const hCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [{ id: 'g-h', gate: 'h', targets: [0], column: 0 }],
      measure: true,
      shots: 500,
    };
    // Noisy 50/50 simulation
    const hResult: CircuitRunResponse = {
      valid: true,
      simulation: { probabilities: { '0': 0.49, '1': 0.51 } },
    } as unknown as CircuitRunResponse;

    expect(evaluateCompletionCriteria(criteria, hCircuit, hResult)).toBe(true);

    // Unbalanced result fails
    const skewedResult: CircuitRunResponse = {
      valid: true,
      simulation: { probabilities: { '0': 0.85, '1': 0.15 } },
    } as unknown as CircuitRunResponse;
    expect(evaluateCompletionCriteria(criteria, hCircuit, skewedResult)).toBe(false);
  });

  it('5. verifies Challenge 3 target behavior (H-Z-H produces >= 95% outcome 1 via interference)', () => {
    const ch3Step = s1SingleQubitChallengeLesson.steps[6]; // Step 7
    expect(ch3Step.takeover).toBeDefined();
    const criteria = ch3Step.takeover!.completionCriteria!;

    const hzhCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'g-h1', gate: 'h', targets: [0], column: 0 },
        { id: 'g-z', gate: 'z', targets: [0], column: 1 },
        { id: 'g-h2', gate: 'h', targets: [0], column: 2 },
      ],
      measure: true,
      shots: 500,
    };
    const hzhResult: CircuitRunResponse = {
      valid: true,
      simulation: { probabilities: { '0': 0.0, '1': 1.0 } },
    } as unknown as CircuitRunResponse;

    expect(evaluateCompletionCriteria(criteria, hzhCircuit, hzhResult)).toBe(true);

    // Missing Z gate fails gate requirement
    const hhCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'g-h1', gate: 'h', targets: [0], column: 0 },
        { id: 'g-h2', gate: 'h', targets: [0], column: 1 },
      ],
      measure: true,
      shots: 500,
    };
    expect(evaluateCompletionCriteria(criteria, hhCircuit, hzhResult)).toBe(false);
  });

  it('6. verifies Challenge 4 broken circuit (H-X-H) is genuinely incorrect for target 1', () => {
    // Mathematical proof:
    // |0⟩ -> H -> |+⟩ = (|0⟩+|1⟩)/√2
    // |+⟩ -> X -> |+⟩ (since X swaps |0⟩ and |1⟩)
    // |+⟩ -> H -> |0⟩!
    // Therefore H-X-H|0⟩ = |0⟩, measuring 100% 0, NOT 1!
    const step8Actions = s1SingleQubitChallengeLesson.steps[7].actions;
    const gateActions = step8Actions.filter((a): a is any => a.type === 'add_gate');
    expect(gateActions.map((a) => a.gate)).toEqual(['h', 'x', 'h']);

    const brokenSimResult: CircuitRunResponse = {
      valid: true,
      simulation: { probabilities: { '0': 1.0, '1': 0.0 } },
    } as unknown as CircuitRunResponse;

    const ch4Criteria = s1SingleQubitChallengeLesson.steps[8].takeover!.completionCriteria!;
    const brokenCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'g-h1', gate: 'h', targets: [0], column: 0 },
        { id: 'g-x', gate: 'x', targets: [0], column: 1 },
        { id: 'g-h2', gate: 'h', targets: [0], column: 2 },
      ],
      measure: true,
      shots: 500,
    };

    // Broken circuit produces 0, fails criteria requiring state '1' >= 0.95
    expect(evaluateCompletionCriteria(ch4Criteria, brokenCircuit, brokenSimResult)).toBe(false);
  });

  it('7. verifies Challenge 4 corrected circuit passes criteria', () => {
    const ch4Criteria = s1SingleQubitChallengeLesson.steps[8].takeover!.completionCriteria!;
    // Corrected to H-Z-H or X alone
    const correctedCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'g-h1', gate: 'h', targets: [0], column: 0 },
        { id: 'g-z', gate: 'z', targets: [0], column: 1 },
        { id: 'g-h2', gate: 'h', targets: [0], column: 2 },
      ],
      measure: true,
      shots: 500,
    };
    const correctedSimResult: CircuitRunResponse = {
      valid: true,
      simulation: { probabilities: { '0': 0.01, '1': 0.99 } },
    } as unknown as CircuitRunResponse;

    expect(evaluateCompletionCriteria(ch4Criteria, correctedCircuit, correctedSimResult)).toBe(true);
  });

  it('8. verifies simulation-based criteria use actual simulation results', () => {
    const ch1Criteria = s1SingleQubitChallengeLesson.steps[2].takeover!.completionCriteria!;
    const xCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [{ id: 'g-x', gate: 'x', targets: [0], column: 0 }],
      measure: true,
      shots: 500,
    };

    // Without simulation result, it must not pass
    expect(evaluateCompletionCriteria(ch1Criteria, xCircuit, null)).toBe(false);

    // With simulation meeting probability, it passes
    expect(
      evaluateCompletionCriteria(ch1Criteria, xCircuit, {
        valid: true,
        simulation: { probabilities: { '0': 0.02, '1': 0.98 } },
      } as unknown as CircuitRunResponse)
    ).toBe(true);
  });

  it('9. verifies prediction checkpoints occur before corresponding challenge builds/simulations', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1SingleQubitChallengeLesson);
    await controller.start();

    // Step 1: Overview
    expect(controller.getState().currentStepIndex).toBe(0);

    // Move to Step 2: Challenge 1 Prediction Checkpoint
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(1);
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStep?.checkpoint?.id).toBe('pred-ch1-bitflip');

    // Submit prediction for Challenge 1 -> moves to Step 3: Challenge 1 Takeover Build
    await controller.submitPrediction(0);
    expect(controller.getState().currentStepIndex).toBe(2);
    expect(controller.getState().status).toBe('LEARNER_TURN');

    // Setup X circuit and simulation result to pass Challenge 1
    mockCircuit.gates = [{ id: 'g-x', gate: 'x', targets: [0], column: 0 }];
    mockRunResult.simulation.probabilities = { '0': 0.0, '1': 1.0 };
    await controller.completeLearnerTurn();

    // Step 4: Challenge 2 Prediction Checkpoint
    expect(controller.getState().currentStepIndex).toBe(3);
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStep?.checkpoint?.id).toBe('pred-ch2-superposition');

    // Submit prediction for Challenge 2 -> moves to Step 5: Challenge 2 Takeover Build
    await controller.submitPrediction(0);
    expect(controller.getState().currentStepIndex).toBe(4);
    expect(controller.getState().status).toBe('LEARNER_TURN');
  });

  it('10. verifies learner takeover preserves learner modifications', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1SingleQubitChallengeLesson);
    await controller.start();

    // Advance to Step 3 (Challenge 1 Build)
    await controller.next(); // Step 2 (Prediction)
    await controller.submitPrediction(0); // Step 3 (Takeover)

    expect(controller.getState().status).toBe('LEARNER_TURN');

    // Learner adds X gate
    mockCircuit.gates = [{ id: 'learner-x', gate: 'x', targets: [0], column: 0 }];
    mockRunResult.simulation.probabilities = { '0': 0.0, '1': 1.0 };

    await controller.completeLearnerTurn();

    // Modifications remain intact on the circuit
    expect(mockCircuit.gates).toHaveLength(1);
    expect(mockCircuit.gates[0].gate).toBe('x');
    expect(mockCircuit.gates[0].id).toBe('learner-x');
  });

  it('11. verifies failed challenge does NOT automatically complete when allowEarlyCompletion is false', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1SingleQubitChallengeLesson);
    await controller.start();

    // Advance to Step 3 (Challenge 1 Build)
    await controller.next();
    await controller.submitPrediction(0);
    expect(controller.getState().status).toBe('LEARNER_TURN');

    // Leave circuit empty and null simulation
    mockCircuit.gates = [];
    (hooks.getSimulationResult as any).mockReturnValue(null);

    // Attempt to complete learner turn without meeting criteria
    await controller.completeLearnerTurn();

    // Controller must remain in LEARNER_TURN and not advance!
    expect(controller.getState().status).toBe('LEARNER_TURN');
    expect(controller.getState().currentStepIndex).toBe(2);
    expect(hooks.showToast).toHaveBeenCalledWith(
      'info',
      expect.stringContaining('Challenge 1: Create State |1⟩')
    );
  });

  it('12. verifies required core challenges must be passed for lesson progression', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1SingleQubitChallengeLesson);
    await controller.start();

    // Verify all 4 takeover steps have allowEarlyCompletion: false
    const takeovers = s1SingleQubitChallengeLesson.steps
      .filter((s) => s.takeover)
      .map((s) => s.takeover!);

    expect(takeovers).toHaveLength(4);
    for (const takeover of takeovers) {
      expect(takeover.allowEarlyCompletion).toBe(false);
      expect(takeover.completionCriteria).toBeDefined();
    }
  });

  it('13. verifies progressive hint system is populated for challenges', () => {
    const step3 = s1SingleQubitChallengeLesson.steps[2]; // Ch 1
    const step5 = s1SingleQubitChallengeLesson.steps[4]; // Ch 2
    const step7 = s1SingleQubitChallengeLesson.steps[6]; // Ch 3
    const step9 = s1SingleQubitChallengeLesson.steps[8]; // Ch 4

    expect(step3.takeover?.hints).toBeDefined();
    expect(step3.takeover!.hints!.length).toBeGreaterThanOrEqual(2);

    expect(step5.takeover?.hints).toBeDefined();
    expect(step5.takeover!.hints!.length).toBeGreaterThanOrEqual(2);

    expect(step7.takeover?.hints).toBeDefined();
    expect(step7.takeover!.hints!.length).toBeGreaterThanOrEqual(3);

    expect(step9.takeover?.hints).toBeDefined();
    expect(step9.takeover!.hints!.length).toBeGreaterThanOrEqual(2);
  });

  it('14. verifies Challenge 5 conceptual explanation has valid options and explanation', () => {
    const ch5Step = s1SingleQubitChallengeLesson.steps[9]; // Step 10
    expect(ch5Step.checkpoint).toBeDefined();
    const cp = ch5Step.checkpoint!;

    expect(cp.options).toHaveLength(4);
    expect(cp.correctOptionIndex).toBe(0);
    expect(cp.options[0].label).toContain(
      'Because gates such as H can create a superposition, which produces probabilistic outcomes'
    );

    // Distractors
    expect(cp.options.some((o) => o.label.includes('randomly chooses which gates'))).toBe(true);
    expect(cp.options.some((o) => o.label.includes('randomizes the state into noise'))).toBe(true);
    expect(cp.options.some((o) => o.label.includes('measurement always happens before'))).toBe(true);
  });

  it('15. verifies TeachingController contains zero challenge-specific branching', () => {
    const controller = new TeachingController(hooks);
    expect((controller as any).handleChallengeLesson).toBeUndefined();
    expect((controller as any).singleQubitChallengeStep).toBeUndefined();
    expect((controller as any).evaluateChallenge).toBeUndefined();
  });

  it('16. verifies no Sprint 2 content is introduced in Lesson 6', () => {
    expect(s1SingleQubitChallengeLesson.sprint).toBe(1);
    expect(s1SingleQubitChallengeLesson.starterCircuit?.qubits).toBe(1);

    // Ensure no 2-qubit gates or concepts like CNOT / Bell states
    for (const step of s1SingleQubitChallengeLesson.steps) {
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

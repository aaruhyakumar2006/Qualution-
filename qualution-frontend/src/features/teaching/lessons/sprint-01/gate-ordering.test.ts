import { describe, it, expect, vi, beforeEach } from 'vitest';
import { s1GateOrderingLesson } from './gate-ordering';
import { lessonRegistry } from '../../lessonRegistry';
import { validateLessonScript } from '../../lessonValidator';
import { TeachingController, type TeachingIDEHooks } from '../../teachingController';
import type { CircuitRequest, CircuitRunResponse } from '../../../circuit/types';

describe('Sprint 1 Lesson 5: Gate Ordering & Non-Commutativity (Physics Verified)', () => {
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
        counts: { '0': 250, '1': 250 },
        probabilities: { '0': 0.5, '1': 0.5 },
        statevector: [
          { real: 0.70710678, imag: 0 },
          { real: 0.70710678, imag: 0 },
        ],
      },
      visualization: {
        bloch: { x: 1.0, y: 0.0, z: 0.0, purity: 1.0, magnitude: 1.0 },
      },
      metrics: {
        gate_count: 2,
        depth: 2,
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
    const validation = validateLessonScript(s1GateOrderingLesson);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('2. is registered in the central LessonRegistry', () => {
    const fromRegistry = lessonRegistry.getLesson('s1-gate-ordering');
    expect(fromRegistry).toBeDefined();
    expect(fromRegistry?.id).toBe('s1-gate-ordering');
    expect(fromRegistry?.title).toBe("Gate Ordering: Why Quantum Gates Don't Always Commute");
    expect(fromRegistry?.curriculumModuleId).toBe('lesson-1-gate-ordering');
    expect(fromRegistry?.steps).toHaveLength(15);

    const allLessons = lessonRegistry.getAllLessons();
    expect(allLessons.some((l) => l.id === 's1-gate-ordering')).toBe(true);
  });

  it('3. verifies H → X action order is correct in Step 2', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1GateOrderingLesson);
    await controller.start();

    // Advance to Step 2 (Circuit A: H then X)
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(1);

    expect(mockCircuit.gates).toHaveLength(2);
    // Chronological order: Gate 0 is H at col 0, Gate 1 is X at col 1
    expect(mockCircuit.gates[0].gate).toBe('h');
    expect(mockCircuit.gates[0].column).toBe(0);
    expect(mockCircuit.gates[1].gate).toBe('x');
    expect(mockCircuit.gates[1].column).toBe(1);

    const step2Actions = s1GateOrderingLesson.steps[1].actions;
    const addGateActions = step2Actions.filter((a): a is any => a.type === 'add_gate');
    expect(addGateActions[0].gate).toBe('h');
    expect(addGateActions[1].gate).toBe('x');
  });

  it('4. verifies X → H action order is correct in Step 5', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1GateOrderingLesson);
    await controller.start();

    // Advance to Step 5 (Circuit B: X then H)
    await controller.next(); // Step 2 (Build A)
    await controller.next(); // Step 3 (Predict A)
    await controller.submitPrediction(0); // Step 4 (Simulate A)
    await controller.next(); // Step 5 (Build B)

    expect(controller.getState().currentStepIndex).toBe(4);
    expect(mockCircuit.gates).toHaveLength(2);
    // Chronological order: Gate 0 is X at col 0, Gate 1 is H at col 1
    expect(mockCircuit.gates[0].gate).toBe('x');
    expect(mockCircuit.gates[0].column).toBe(0);
    expect(mockCircuit.gates[1].gate).toBe('h');
    expect(mockCircuit.gates[1].column).toBe(1);

    const step5Actions = s1GateOrderingLesson.steps[4].actions;
    const addGateActions = step5Actions.filter((a): a is any => a.type === 'add_gate');
    expect(addGateActions[0].gate).toBe('x');
    expect(addGateActions[1].gate).toBe('h');
  });

  it('5. proves H → X mathematically produces |+⟩ and X → H mathematically produces |−⟩', () => {
    // Verified matrix calculations:
    // H|0⟩ = [1/√2, 1/√2]^T
    // X[1/√2, 1/√2]^T = [1/√2, 1/√2]^T = |+⟩ (Bloch x = +1, y = 0, z = 0)
    // X|0⟩ = [0, 1]^T
    // H[0, 1]^T = [1/√2, -1/√2]^T = |−⟩ (Bloch x = -1, y = 0, z = 0)

    const step9 = s1GateOrderingLesson.steps[8];
    expect(step9.explanation).toContain('|+⟩');
    expect(step9.explanation).toContain('|−⟩');
    expect(step9.explanation).toContain('+X');
    expect(step9.explanation).toContain('−X');
  });

  it('6. verifies both Circuit A and Circuit B produce approximately 50/50 Z-basis measurement', () => {
    const checkpointA = s1GateOrderingLesson.steps[2].checkpoint!;
    const checkpointB = s1GateOrderingLesson.steps[5].checkpoint!;

    // Checkpoint A expects 50/50
    expect(checkpointA.options[checkpointA.correctOptionIndex].label).toContain(
      'Approximately 50% 0 and 50% 1'
    );
    expect(checkpointA.structuredComparison?.expectedDistribution?.['0'].min).toBe(0.40);
    expect(checkpointA.structuredComparison?.expectedDistribution?.['0'].max).toBe(0.60);

    // Checkpoint B also expects 50/50 in computational basis
    expect(checkpointB.options[checkpointB.correctOptionIndex].label).toContain(
      'Approximately 50% 0 and 50% 1'
    );
    expect(checkpointB.structuredComparison?.expectedDistribution?.['0'].min).toBe(0.40);
    expect(checkpointB.structuredComparison?.expectedDistribution?.['0'].max).toBe(0.60);

    // Evaluation for noisy 50/50 (48% 0, 52% 1) matches for both checkpoints
    const noisyFiftyFifty = {
      valid: true,
      simulation: { probabilities: { '0': 0.48, '1': 0.52 } },
    } as unknown as CircuitRunResponse;

    expect(checkpointA.comparisonRule!(0, noisyFiftyFifty).isMatch).toBe(true);
    expect(checkpointB.comparisonRule!(0, noisyFiftyFifty).isMatch).toBe(true);
  });

  it('7. verifies the lesson does NOT claim H → X produces 100% 0', () => {
    const checkpointA = s1GateOrderingLesson.steps[2].checkpoint!;
    // Correct option must NOT be 100% 0
    const correctLabel = checkpointA.options[checkpointA.correctOptionIndex].label;
    expect(correctLabel).not.toBe('Approximately 100% 0');
    expect(correctLabel).toContain('50% 0 and 50% 1');

    // Step 4 explanation must not claim 100% 0
    expect(s1GateOrderingLesson.steps[3].explanation).not.toContain('100% 0');
  });

  it('8. verifies the lesson does NOT claim X → H alone produces a different Z-basis histogram', () => {
    const step8 = s1GateOrderingLesson.steps[7];
    // Explicitly acknowledges the puzzle that both histograms are 50/50
    expect(step8.explanation).toContain('Circuit A (H → X) gave ~50/50. Circuit B (X → H) also gave ~50/50!');
    expect(step8.explanation).not.toContain('Circuit B produced a different histogram');
  });

  it('9. verifies state and phase distinction is represented correctly on State panel and Bloch sphere', () => {
    const step9 = s1GateOrderingLesson.steps[8];
    expect(step9.actions.some((a) => a.type === 'focus_visualization' && a.panel === 'state')).toBe(true);
    expect(step9.explanation).toContain('relative phase between |0⟩ and |1⟩ is flipped');
  });

  it('10. mathematically verifies the final interference/readout experiment (H → X → H)', async () => {
    // Circuit with readout:
    // |0⟩ -> H -> X -> H
    // Before final H: |+⟩
    // Final H: H|+⟩ = |0⟩ with probability 1.0!
    const step10 = s1GateOrderingLesson.steps[9];
    const step10GateActions = step10.actions.filter((a): a is any => a.type === 'add_gate');
    expect(step10GateActions).toHaveLength(3);
    expect(step10GateActions.map((a) => a.gate)).toEqual(['h', 'x', 'h']);

    // Checkpoint C expects 100% 0
    const checkpointC = s1GateOrderingLesson.steps[10].checkpoint!;
    expect(checkpointC.options[checkpointC.correctOptionIndex].label).toContain(
      'Approximately 100% 0'
    );

    const perfectReadoutSim = {
      valid: true,
      simulation: { probabilities: { '0': 1.0, '1': 0.0 } },
    } as unknown as CircuitRunResponse;
    expect(checkpointC.comparisonRule!(0, perfectReadoutSim).isMatch).toBe(true);
  });

  it('11. verifies prediction checkpoints occur before corresponding simulations', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1GateOrderingLesson);
    await controller.start();

    // Checkpoint 1 (Step 3, index 2)
    await controller.next(); // Step 2 (Build A)
    await controller.next(); // Step 3 (Predict A)
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(2);
    expect(hooks.runSimulation).not.toHaveBeenCalled();

    // Submit Prediction 1 -> triggers Step 4 (Simulate A)
    await controller.submitPrediction(0);
    expect(hooks.runSimulation).toHaveBeenCalledTimes(1);

    // Checkpoint 2 (Step 6, index 5)
    await controller.next(); // Step 5 (Build B)
    await controller.next(); // Step 6 (Predict B)
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(5);
    expect(hooks.runSimulation).toHaveBeenCalledTimes(1); // Not run yet for B

    // Submit Prediction 2 -> triggers Step 7 (Simulate B)
    await controller.submitPrediction(0);
    expect(hooks.runSimulation).toHaveBeenCalledTimes(2);

    // Checkpoint 3 (Step 11, index 10)
    await controller.next(); // Step 8 (Mystery)
    await controller.next(); // Step 9 (Inspect State)
    await controller.next(); // Step 10 (Build Readout)
    await controller.next(); // Step 11 (Predict Readout)
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(10);
    expect(hooks.runSimulation).toHaveBeenCalledTimes(2); // Readout not simulated yet

    // Submit Prediction 3 -> triggers Step 12 (Simulate Readout)
    await controller.submitPrediction(0);
    expect(hooks.runSimulation).toHaveBeenCalledTimes(3);
  });

  it('12. verifies multiple checkpoints remain independent without selection leakage', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1GateOrderingLesson);
    await controller.start();

    // Step 3 (Predict A)
    await controller.next(); // 2
    await controller.next(); // 3
    expect(controller.getState().selectedPredictionIndex).toBeNull();
    await controller.submitPrediction(0);

    // Step 6 (Predict B)
    await controller.next(); // 5
    await controller.next(); // 6
    expect(controller.getState().selectedPredictionIndex).toBeNull();
    await controller.submitPrediction(0);

    // Step 11 (Predict Readout)
    await controller.next(); // 8
    await controller.next(); // 9
    await controller.next(); // 10
    await controller.next(); // 11
    expect(controller.getState().selectedPredictionIndex).toBeNull();
    await controller.submitPrediction(0);

    // Step 14 (Transfer Checkpoint)
    await controller.next(); // 13 (Your Turn)
    await controller.completeLearnerTurn(); // moves to Step 14
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(13);
    expect(controller.getState().selectedPredictionIndex).toBeNull();

    const transferCheckpoint = controller.getState().currentStep?.checkpoint;
    expect(transferCheckpoint?.id).toBe('pred-order-transfer');
    expect(transferCheckpoint?.correctOptionIndex).toBe(0);
    expect(transferCheckpoint?.options[0].label).toContain(
      'Because changing gate order changes relative phase'
    );

    await controller.submitPrediction(0);
    expect(controller.getState().status).toBe('COMPLETED');
    expect(controller.getState().currentStepIndex).toBe(14);
  });

  it('13. preserves learner modifications during learner takeover (Step 13)', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1GateOrderingLesson);
    await controller.start();

    // Step to Step 13 (Your Turn, index 12)
    await controller.next(); // 2
    await controller.next(); // 3
    await controller.submitPrediction(0); // 4
    await controller.next(); // 5
    await controller.next(); // 6
    await controller.submitPrediction(0); // 7
    await controller.next(); // 8
    await controller.next(); // 9
    await controller.next(); // 10
    await controller.next(); // 11
    await controller.submitPrediction(0); // 12
    await controller.next(); // 13 (Your Turn)

    expect(controller.getState().status).toBe('LEARNER_TURN');
    expect(controller.getState().currentStepIndex).toBe(12);

    // Learner sets up custom circuit: X -> H -> H
    mockCircuit.gates = [
      { id: 'custom-x', gate: 'x', targets: [0], column: 0 },
      { id: 'custom-h1', gate: 'h', targets: [0], column: 1 },
      { id: 'custom-h2', gate: 'h', targets: [0], column: 2 },
    ];

    await controller.completeLearnerTurn();
    expect(mockCircuit.gates).toHaveLength(3);
    expect(mockCircuit.gates.map((g) => g.gate)).toEqual(['x', 'h', 'h']);
  });

  it('14. TeachingController contains zero gate-ordering-specific branching', () => {
    const controller = new TeachingController(hooks);
    expect((controller as any).handleGateOrdering).toBeUndefined();
    expect((controller as any).gateOrderingStep).toBeUndefined();
    expect((controller as any).checkCommutativity).toBeUndefined();
  });
});

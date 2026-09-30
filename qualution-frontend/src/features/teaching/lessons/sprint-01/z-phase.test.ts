import { describe, it, expect, vi, beforeEach } from 'vitest';
import { s1ZPhaseLesson } from './z-phase';
import { lessonRegistry } from '../../lessonRegistry';
import { validateLessonScript } from '../../lessonValidator';
import { TeachingController, type TeachingIDEHooks } from '../../teachingController';
import type { CircuitRequest, CircuitRunResponse } from '../../../circuit/types';

describe('Sprint 1 Lesson 4: Z Gate & Phase', () => {
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
        counts: { '0': 500 },
        probabilities: { '0': 1.0 },
        statevector: [
          { real: 1.0, imag: 0 },
          { real: 0.0, imag: 0 },
        ],
      },
      visualization: {
        bloch: { x: 0.0, y: 0.0, z: 1.0, purity: 1.0, magnitude: 1.0 },
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
    const validation = validateLessonScript(s1ZPhaseLesson);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('2. is registered in the central LessonRegistry', () => {
    const fromRegistry = lessonRegistry.getLesson('s1-z-phase');
    expect(fromRegistry).toBeDefined();
    expect(fromRegistry?.id).toBe('s1-z-phase');
    expect(fromRegistry?.title).toBe('Z Gate: Understanding Quantum Phase');
    expect(fromRegistry?.curriculumModuleId).toBe('lesson-1-phase');
    expect(fromRegistry?.steps).toHaveLength(12);

    const allLessons = lessonRegistry.getAllLessons();
    expect(allLessons.some((l) => l.id === 's1-z-phase')).toBe(true);
  });

  it('3. places a Z gate onto wire q[0] during Step 2', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1ZPhaseLesson);
    await controller.start();

    // Step 1: Starting State |0⟩ with qubit wire highlighted
    expect(controller.getState().currentStepIndex).toBe(0);
    expect(hooks.highlightQubit).toHaveBeenCalledWith(0);

    // Step 2: Apply Z Gate
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(1);
    expect(mockCircuit.gates).toHaveLength(1);
    expect(mockCircuit.gates[0].gate).toBe('z');
    expect(mockCircuit.gates[0].targets).toEqual([0]);
    expect(hooks.highlightGate).toHaveBeenCalledWith('z-gate-demo-1');
  });

  it('4. halts at first Prediction Checkpoint (Step 3) before simulation of Z on |0⟩', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1ZPhaseLesson);
    await controller.start();

    await controller.next(); // to Step 2
    await controller.next(); // to Step 3 (Prediction Checkpoint 1)

    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(2);
    expect(hooks.runSimulation).not.toHaveBeenCalled();

    const checkpoint = controller.getState().currentStep?.checkpoint;
    expect(checkpoint).toBeDefined();
    expect(checkpoint?.id).toBe('pred-z-phase-zero');
    expect(checkpoint?.correctOptionIndex).toBe(0);
    expect(checkpoint?.options[0].label).toBe('100% 0');
  });

  it('5. evaluates first prediction and accepts finite-shot tolerance for 100% 0', () => {
    const checkpoint = s1ZPhaseLesson.steps[2].checkpoint;
    expect(checkpoint).toBeDefined();

    // Ideal 100% 0
    const perfectSimResult = {
      valid: true,
      simulation: { probabilities: { '0': 1.0, '1': 0.0 } },
    } as unknown as CircuitRunResponse;
    const matchEvaluation = checkpoint!.comparisonRule!(0, perfectSimResult);
    expect(matchEvaluation.isMatch).toBe(true);

    // Empirical sampling tolerance (e.g. 98% 0)
    const noisySimResult = {
      valid: true,
      simulation: { probabilities: { '0': 0.98, '1': 0.02 } },
    } as unknown as CircuitRunResponse;
    const noisyEvaluation = checkpoint!.comparisonRule!(0, noisySimResult);
    expect(noisyEvaluation.isMatch).toBe(true);

    // Counts fallback (e.g. 495 out of 500)
    const countsSimResult = {
      valid: true,
      simulation: { counts: { '0': 495, '1': 5 } },
    } as unknown as CircuitRunResponse;
    const countsEvaluation = checkpoint!.comparisonRule!(0, countsSimResult);
    expect(countsEvaluation.isMatch).toBe(true);

    // Wrong option selected (Option 2: 100% 1)
    const incorrectEvaluation = checkpoint!.comparisonRule!(2, perfectSimResult);
    expect(incorrectEvaluation.isMatch).toBe(false);
  });

  it('6. represents the H → Z → H sequence correctly in Step 7', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1ZPhaseLesson);
    await controller.start();

    // Advance to Step 7 (index 6)
    await controller.next(); // Step 2
    await controller.next(); // Step 3
    await controller.submitPrediction(0); // Step 4 (experiment A)
    await controller.next(); // Step 5 (observe A)
    await controller.next(); // Step 6 (explain distinction)
    await controller.next(); // Step 7 (setup H-Z-H)

    expect(controller.getState().currentStepIndex).toBe(6);
    expect(mockCircuit.gates).toHaveLength(3);
    expect(mockCircuit.gates[0].gate).toBe('h');
    expect(mockCircuit.gates[1].gate).toBe('z');
    expect(mockCircuit.gates[2].gate).toBe('h');
    expect(hooks.highlightGate).toHaveBeenCalledWith('hzh-z');
  });

  it('7. halts at second Prediction Checkpoint (Step 8) before running H → Z → H simulation', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1ZPhaseLesson);
    await controller.start();

    // Step to Step 7
    await controller.next(); // 2
    await controller.next(); // 3
    await controller.submitPrediction(0); // 4
    await controller.next(); // 5
    await controller.next(); // 6
    await controller.next(); // 7

    // Advance to Step 8 (Prediction Checkpoint 2)
    await controller.next();
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(7);

    // Ensure selectedPredictionIndex was reset to null for Checkpoint 2
    expect(controller.getState().selectedPredictionIndex).toBeNull();

    const checkpoint2 = controller.getState().currentStep?.checkpoint;
    expect(checkpoint2?.id).toBe('pred-z-phase-hzh');
    expect(checkpoint2?.correctOptionIndex).toBe(2);
    expect(checkpoint2?.options[2].label).toContain('Approximately 100% 1');
  });

  it('8. executes second simulation (Step 9) and compares result correctly for 100% 1', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1ZPhaseLesson);
    await controller.start();

    // Advance to Step 8
    await controller.next(); // 2
    await controller.next(); // 3
    await controller.submitPrediction(0); // 4
    await controller.next(); // 5
    await controller.next(); // 6
    await controller.next(); // 7
    await controller.next(); // 8

    // Configure simulation mock for H-Z-H producing outcome 1
    mockRunResult = {
      valid: true,
      simulation: {
        backend: 'qiskit_aer',
        probabilities: { '1': 1.0, '0': 0.0 },
        counts: { '1': 500 },
      },
    } as unknown as CircuitRunResponse;

    // Learner selects Option 2 (100% 1) and submits
    await controller.submitPrediction(2);
    expect(hooks.runSimulation).toHaveBeenCalledWith(500, undefined);
    expect(controller.getState().currentStepIndex).toBe(8); // Step 9: Experiment B & Observe

    // Prediction comparison should be matched for Checkpoint 2
    expect(controller.getState().predictionComparison).not.toBeNull();
    expect(controller.getState().predictionComparison?.isMatch).toBe(true);
    expect(controller.getState().predictionComparison?.userSummary).toContain('Outstanding');
  });

  it('9. preserves learner modifications during learner takeover (Step 10)', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1ZPhaseLesson);
    await controller.start();

    // Step through to Step 10 (Takeover, index 9)
    await controller.next(); // 2
    await controller.next(); // 3
    await controller.submitPrediction(0); // 4
    await controller.next(); // 5
    await controller.next(); // 6
    await controller.next(); // 7
    await controller.next(); // 8
    await controller.submitPrediction(2); // 9
    await controller.next(); // 10 (Your Turn)

    expect(controller.getState().status).toBe('LEARNER_TURN');
    expect(controller.getState().currentStepIndex).toBe(9);

    // Learner removes Z to test H-H = I
    mockCircuit.gates = [
      { id: 'h1', gate: 'h', targets: [0], column: 0 },
      { id: 'h2', gate: 'h', targets: [0], column: 1 },
    ];

    await controller.completeLearnerTurn();
    expect(mockCircuit.gates).toHaveLength(2);
    expect(mockCircuit.gates.map((g) => g.gate)).toEqual(['h', 'h']);
  });

  it('10. resets state cleanly for third Transfer Checkpoint (Step 11) and completes lesson', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1ZPhaseLesson);
    await controller.start();

    // Advance to Step 10
    await controller.next(); // 2
    await controller.next(); // 3
    await controller.submitPrediction(0); // 4
    await controller.next(); // 5
    await controller.next(); // 6
    await controller.next(); // 7
    await controller.next(); // 8
    await controller.submitPrediction(2); // 9
    await controller.next(); // 10

    // Complete learner turn -> moves to Step 11 (Transfer Checkpoint)
    await controller.completeLearnerTurn();
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(10);

    // Ensure selectedPredictionIndex was reset to null for Checkpoint 3!
    expect(controller.getState().selectedPredictionIndex).toBeNull();

    const transferCheckpoint = controller.getState().currentStep?.checkpoint;
    expect(transferCheckpoint?.id).toBe('pred-z-phase-transfer');
    expect(transferCheckpoint?.correctOptionIndex).toBe(0);
    expect(transferCheckpoint?.options[0].label).toContain(
      'Because Z leaves |0⟩ unchanged; its phase effect becomes important when relative phase exists in a superposition'
    );

    // Learner selects correct answer and submits -> Step 12 (Complete)
    await controller.submitPrediction(0);
    expect(controller.getState().status).toBe('COMPLETED');
    expect(controller.getState().currentStepIndex).toBe(11);
    expect(controller.getState().activeLesson?.completionMessage).toContain(
      'You explored the difference between bit value and quantum phase, and saw how phase can become observable through interference.'
    );
  });

  it('11. TeachingController contains zero Z-specific branching logic', () => {
    const controller = new TeachingController(hooks);
    expect((controller as any).handleZPhase).toBeUndefined();
    expect((controller as any).zPhaseStep).toBeUndefined();
    expect((controller as any).hzhInterference).toBeUndefined();
  });
});

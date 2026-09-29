import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeachingController, type TeachingIDEHooks } from './teachingController';
import { s1HadamardSuperpositionLesson } from './lessons/s1HadamardSuperposition';
import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';

describe('TeachingController', () => {
  let mockCircuit: CircuitRequest;
  let mockRunResult: CircuitRunResponse;
  let hooks: TeachingIDEHooks;

  beforeEach(() => {
    mockCircuit = {
      qubits: 1,
      classical_bits: 1,
      gates: [],
      measure: true,
      shots: 1000,
    };

    mockRunResult = {
      valid: true,
      simulation: {
        backend: 'qiskit_aer',
        execution_time_ms: 12.5,
        counts: { '0': 508, '1': 492 },
        probabilities: { '0': 0.508, '1': 0.492 },
        statevector: [
          { real: 0.7071, imag: 0 },
          { real: 0.7071, imag: 0 },
        ],
      },
      visualization: {
        bloch: { x: 1.0, y: 0.0, z: 0.0, purity: 1.0, magnitude: 1.0 },
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

  it('initializes with IDLE state and empty active lesson', () => {
    const controller = new TeachingController(hooks);
    const state = controller.getState();
    expect(state.status).toBe('IDLE');
    expect(state.activeLesson).toBeNull();
    expect(state.currentStepIndex).toBe(0);
    expect(state.totalSteps).toBe(0);
  });

  it('safely handles unknown lesson IDs and updates error state without crashing', async () => {
    const controller = new TeachingController(hooks);
    const success = await controller.loadLesson('unknown-lesson-xyz');
    expect(success).toBe(false);

    const state = controller.getState();
    expect(state.status).toBe('ERROR');
    expect(state.error).toContain('Unknown lesson');
    expect(hooks.showToast).toHaveBeenCalledWith('warning', expect.any(String));
  });

  it('loads valid lesson script and sets up starter circuit', async () => {
    const controller = new TeachingController(hooks);
    const success = await controller.loadLesson(s1HadamardSuperpositionLesson);
    expect(success).toBe(true);

    const state = controller.getState();
    expect(state.status).toBe('IDLE');
    expect(state.activeLesson?.id).toBe('s1-hadamard-superposition');
    expect(state.totalSteps).toBe(s1HadamardSuperpositionLesson.steps.length);
    expect(hooks.updateCircuit).toHaveBeenCalled();
  });

  it('steps through the pedagogical sequence: start, teach, highlight, and gate addition', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);

    // Step 1: Starting state |0⟩ with qubit highlight
    await controller.start();
    expect(controller.getState().status).toBe('TEACHING');
    expect(controller.getState().currentStepIndex).toBe(0);
    expect(controller.getState().currentStep?.title).toBe('Starting State |0⟩');
    expect(hooks.highlightQubit).toHaveBeenCalledWith(0);
    expect(controller.getState().highlightedQubitIndex).toBe(0);

    // Step 2: Add H gate to q[0]
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(1);
    expect(mockCircuit.gates.some((g) => g.gate === 'h')).toBe(true);
    expect(hooks.highlightGate).toHaveBeenCalledWith('h-gate-demo-1');
  });

  it('detects prediction checkpoint and halts in WAITING_FOR_PREDICTION state', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
    await controller.start();

    // Advance to Step 3 (index 2): Prediction Checkpoint
    await controller.next(); // to step 2
    await controller.next(); // to step 3

    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(2);
    expect(controller.getState().currentStep?.checkpoint).toBeDefined();

    // Trying to advance via next() while waiting for prediction is blocked
    await controller.next();
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(hooks.showToast).toHaveBeenCalledWith('info', expect.stringContaining('submit your prediction'));
  });

  it('submits prediction, records choice, and proceeds to simulation and comparison', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
    await controller.start();

    await controller.next();
    await controller.next(); // At prediction checkpoint (step 3)

    // Submit prediction (index 1: ~50% 0 and 50% 1)
    await controller.submitPrediction(1);
    expect(controller.getState().selectedPredictionIndex).toBe(1);

    // Should have advanced to Step 4 (Run simulation)
    expect(hooks.runSimulation).toHaveBeenCalled();

    // Advance to Step 5 (Focus visualization / observe)
    await controller.next();
    expect(hooks.focusVisualization).toHaveBeenCalledWith('results');

    // Advance to Step 6 (Compare prediction)
    await controller.next();
    expect(controller.getState().predictionComparison).not.toBeNull();
    expect(controller.getState().predictionComparison?.isMatch).toBe(true);
  });

  it('supports pause and resume during teaching', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
    await controller.start();

    controller.pause();
    expect(controller.getState().status).toBe('PAUSED');

    await controller.resume();
    expect(controller.getState().status).toBe('TEACHING');
  });

  it('transitions to LEARNER_TURN and relinquishes automation for hands-on experimentation', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
    await controller.start();

    // Step forward to Step 8 (Learner Turn, index 7)
    await controller.next(); // Step 2 (apply H)
    await controller.next(); // Step 3 (prediction checkpoint)
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    await controller.submitPrediction(1); // Step 4 (experiment simulation)
    await controller.next(); // Step 5 (observe)
    await controller.next(); // Step 6 (compare)
    await controller.next(); // Step 7 (explain superposition)
    await controller.next(); // Step 8 (your turn / learner takeover)

    expect(controller.getState().status).toBe('LEARNER_TURN');
    expect(controller.getState().currentStepIndex).toBe(7);
    expect(controller.getState().currentStep?.takeover).toBeDefined();

    // Completing learner turn advances to Step 9 (Transfer Checkpoint)
    await controller.completeLearnerTurn();
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(8);
    expect(controller.getState().currentStep?.checkpoint?.id).toBe('pred-hadamard-transfer');
    // Ensure selectedPredictionIndex was reset
    expect(controller.getState().selectedPredictionIndex).toBeNull();

    // Submit correct answer to transfer question (index 1) -> completes lesson
    await controller.submitPrediction(1);
    expect(controller.getState().status).toBe('COMPLETED');
    expect(controller.getState().currentStepIndex).toBe(9);
  });

  it('restarts lesson cleanly back to Step 1', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
    await controller.start();
    await controller.next();

    await controller.restart();
    expect(controller.getState().currentStepIndex).toBe(0);
    expect(controller.getState().status).toBe('TEACHING');
  });

  it('manages autoPlay state via setAutoPlay and toggleAutoPlay', () => {
    const controller = new TeachingController(hooks);
    expect(controller.getState().isAutoPlay).toBe(false);

    controller.setAutoPlay(true);
    expect(controller.getState().isAutoPlay).toBe(true);

    controller.toggleAutoPlay();
    expect(controller.getState().isAutoPlay).toBe(false);
  });
});

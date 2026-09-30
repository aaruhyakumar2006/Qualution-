import { describe, it, expect, vi, beforeEach } from 'vitest';
import { s1HadamardSuperpositionLesson } from './hadamard-superposition';
import { lessonRegistry } from '../../lessonRegistry';
import { validateLessonScript } from '../../lessonValidator';
import { TeachingController, type TeachingIDEHooks } from '../../teachingController';
import type { CircuitRequest, CircuitRunResponse } from '../../../circuit/types';

describe('Sprint 1 Lesson 3: Hadamard Gate & Superposition', () => {
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
        counts: { '0': 258, '1': 242 },
        probabilities: { '0': 0.516, '1': 0.484 },
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

  it('1. passes validateLessonScript with zero errors', () => {
    const validation = validateLessonScript(s1HadamardSuperpositionLesson);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('2. is registered as the single canonical Hadamard lesson in the lesson registry', () => {
    const fromRegistry = lessonRegistry.getLesson('s1-hadamard-superposition');
    expect(fromRegistry).toBeDefined();
    expect(fromRegistry?.id).toBe('s1-hadamard-superposition');
    expect(fromRegistry?.title).toBe('Hadamard Gate & Superposition');
    expect(fromRegistry?.curriculumModuleId).toBe('lesson-1-superposition');

    // Confirm no duplicate Hadamard lessons are registered
    const allLessons = lessonRegistry.getAllLessons();
    const hadamardMatches = allLessons.filter(
      (l) => l.id.includes('hadamard') || l.title.toLowerCase().includes('hadamard')
    );
    expect(hadamardMatches).toHaveLength(1);
    expect(hadamardMatches[0].id).toBe('s1-hadamard-superposition');
  });

  it('3. places an H gate onto wire q[0] during Step 2', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
    await controller.start();

    // Step 1: Starting State |0⟩ with qubit wire highlighted
    expect(controller.getState().currentStepIndex).toBe(0);
    expect(hooks.highlightQubit).toHaveBeenCalledWith(0);

    // Step 2: Apply Hadamard Gate
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(1);
    expect(mockCircuit.gates).toHaveLength(1);
    expect(mockCircuit.gates[0].gate).toBe('h');
    expect(mockCircuit.gates[0].targets).toEqual([0]);
    expect(hooks.highlightGate).toHaveBeenCalledWith('h-gate-demo-1');
  });

  it('4. halts at Prediction Checkpoint (Step 3) before any simulation runs', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
    await controller.start();

    await controller.next(); // to Step 2
    await controller.next(); // to Step 3 (Prediction Checkpoint)

    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(2);
    expect(hooks.runSimulation).not.toHaveBeenCalled();

    const checkpoint = controller.getState().currentStep?.checkpoint;
    expect(checkpoint).toBeDefined();
    expect(checkpoint?.question).toContain('what measurement distribution do you expect');
    expect(checkpoint?.options[checkpoint.correctOptionIndex].label).toContain('Approximately 50% 0 and 50% 1');
  });

  it('5. validates structured prediction comparison with finite-shot sampling tolerance', () => {
    const checkpoint = s1HadamardSuperpositionLesson.steps[2].checkpoint;
    expect(checkpoint).toBeDefined();
    expect(checkpoint?.correctOptionIndex).toBe(1);

    // Theoretical 50/50
    const perfectSimResult = {
      valid: true,
      simulation: {
        probabilities: { '0': 0.5, '1': 0.5 },
      },
    } as unknown as CircuitRunResponse;
    const matchEvaluation = checkpoint!.comparisonRule!(1, perfectSimResult);
    expect(matchEvaluation.isMatch).toBe(true);

    // Finite-shot statistical fluctuation (e.g., 48% / 52%)
    const noisySimResult = {
      valid: true,
      simulation: {
        probabilities: { '0': 0.48, '1': 0.52 },
      },
    } as unknown as CircuitRunResponse;
    const noisyEvaluation = checkpoint!.comparisonRule!(1, noisySimResult);
    expect(noisyEvaluation.isMatch).toBe(true);

    // Finite-shot counts-only fallback (e.g. counts: 255 vs 245 out of 500)
    const countsOnlySimResult = {
      valid: true,
      simulation: {
        counts: { '0': 255, '1': 245 },
      },
    } as unknown as CircuitRunResponse;
    const countsEvaluation = checkpoint!.comparisonRule!(1, countsOnlySimResult);
    expect(countsEvaluation.isMatch).toBe(true);

    // Wrong prediction option (Option 0: 100% 0)
    const incorrectEvaluation = checkpoint!.comparisonRule!(0, noisySimResult);
    expect(incorrectEvaluation.isMatch).toBe(false);
  });

  it('6. runs experiment via generic simulation pipeline and compares result', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
    await controller.start();

    // Advance to Step 3
    await controller.next();
    await controller.next();

    // Learner selects Option 1 (~50/50) and submits
    await controller.submitPrediction(1);
    expect(hooks.runSimulation).toHaveBeenCalledWith(500, undefined);
    expect(controller.getState().currentStepIndex).toBe(3); // Step 4: Experiment

    // Step 5: Observe (Focus results visualization)
    await controller.next();
    expect(hooks.focusVisualization).toHaveBeenCalledWith('results');

    // Step 6: Compare prediction
    await controller.next();
    expect(controller.getState().predictionComparison).not.toBeNull();
    expect(controller.getState().predictionComparison?.isMatch).toBe(true);
  });

  it('7. preserves learner circuit modifications during learner takeover (Step 8)', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
    await controller.start();

    // Step through to Step 8 (Learner Turn, index 7)
    await controller.next(); // Step 2 (apply H)
    await controller.next(); // Step 3 (checkpoint)
    await controller.submitPrediction(1); // Step 4 (experiment)
    await controller.next(); // Step 5 (observe)
    await controller.next(); // Step 6 (compare)
    await controller.next(); // Step 7 (explain superposition)
    await controller.next(); // Step 8 (your turn)

    expect(controller.getState().status).toBe('LEARNER_TURN');
    expect(controller.getState().currentStepIndex).toBe(7);

    // Learner adds a second H gate on q[0]
    mockCircuit.gates.push({
      id: 'learner-h2',
      gate: 'h',
      targets: [0],
      column: 1,
    });
    expect(mockCircuit.gates).toHaveLength(2);

    // Advancing does NOT clobber the learner's modified circuit
    await controller.completeLearnerTurn();
    expect(mockCircuit.gates).toHaveLength(2);
    expect(mockCircuit.gates[1].id).toBe('learner-h2');
  });

  it('8. resets checkpoint selection state for Step 9 Transfer Checkpoint and validates answer', async () => {
    const controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
    await controller.start();

    // Advance through Step 3 and submit prediction
    await controller.next();
    await controller.next();
    await controller.submitPrediction(1); // Step 3 selection was 1
    expect(controller.getState().selectedPredictionIndex).toBe(1);

    // Advance to Step 8 (Learner Turn)
    await controller.next(); // Step 5
    await controller.next(); // Step 6
    await controller.next(); // Step 7
    await controller.next(); // Step 8

    // Learner completes open turn -> transitions to Step 9 (Transfer Checkpoint)
    await controller.completeLearnerTurn();
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStepIndex).toBe(8);

    // CRITICAL: Ensure previous prediction selection index is cleanly reset to null!
    expect(controller.getState().selectedPredictionIndex).toBeNull();

    const transferCheckpoint = controller.getState().currentStep?.checkpoint;
    expect(transferCheckpoint?.id).toBe('pred-hadamard-transfer');
    expect(transferCheckpoint?.correctOptionIndex).toBe(1);
    expect(transferCheckpoint?.options[1].label).toContain(
      'It creates an equal superposition whose computational-basis measurements are approximately 50/50'
    );

    // Learner answers transfer question correctly
    await controller.submitPrediction(1);
    expect(controller.getState().status).toBe('COMPLETED');
    expect(controller.getState().currentStepIndex).toBe(9);
    expect(controller.getState().activeLesson?.completionMessage).toContain(
      'Excellent! You predicted, simulated, and explained how the Hadamard gate creates quantum superposition.'
    );
  });

  it('9. TeachingController contains zero Hadamard-specific branching logic', () => {
    // Inspect controller interface and method presence
    const controller = new TeachingController(hooks);
    expect((controller as any).handleHadamard).toBeUndefined();
    expect((controller as any).hadamardStep).toBeUndefined();
    expect((controller as any).hadamardTolerance).toBeUndefined();
  });
});

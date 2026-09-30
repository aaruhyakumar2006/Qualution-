import { describe, it, expect, vi, beforeEach } from 'vitest';
import { s1XGateLesson } from './x-gate';
import { validateLessonScript, evaluateCompletionCriteria } from '../../lessonValidator';
import { lessonRegistry } from '../../lessonRegistry';
import { TeachingController } from '../../teachingController';
import type { TeachingIDEHooks } from '../../teachingController';
import type { CircuitRequest, CircuitRunResponse } from '../../../circuit/types';
import type { TeachingEvent } from '../../types';
import * as teachingEvents from '../../teachingEvents';

describe('Sprint 1 Lesson 2: The Pauli-X Gate (s1-x-gate)', () => {
  let mockCircuit: CircuitRequest;
  let mockSimResult: CircuitRunResponse;
  let mockHooks: TeachingIDEHooks;
  let dispatchedEvents: TeachingEvent[];

  beforeEach(() => {
    dispatchedEvents = [];
    vi.spyOn(teachingEvents, 'emitTeachingEvent').mockImplementation((ev) => {
      dispatchedEvents.push(ev);
    });

    mockCircuit = {
      qubits: 1,
      classical_bits: 1,
      gates: [],
      measure: true,
      shots: 500,
    };

    mockSimResult = {
      simulation: {
        backend: 'aer_simulator',
        mode: 'shots',
        execution_time_ms: 12,
        shots: 500,
        probabilities: {
          '0': 0.0,
          '1': 1.0,
        },
        counts: {
          '1': 500,
        },
      },
    } as unknown as CircuitRunResponse;

    mockHooks = {
      getCircuit: vi.fn(() => mockCircuit),
      updateCircuit: vi.fn((updated) => {
        mockCircuit = updated;
      }),
      runSimulation: vi.fn(async () => mockSimResult),
      getSimulationResult: vi.fn(() => mockSimResult),
      highlightGate: vi.fn(),
      highlightQubit: vi.fn(),
      clearHighlights: vi.fn(),
      focusVisualization: vi.fn(),
      showToast: vi.fn(),
    };
  });

  // 1. Lesson passes validateLessonScript()
  it('passes validateLessonScript without any schema or semantic errors', () => {
    const res = validateLessonScript(s1XGateLesson);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  // 2. Lesson is registered
  it('is properly registered and retrievable case-insensitively from lessonRegistry', () => {
    const lesson = lessonRegistry.getLesson('s1-x-gate');
    expect(lesson).toBeDefined();
    expect(lesson?.id).toBe('s1-x-gate');
    expect(lesson?.title).toBe('The Pauli-X Gate: Quantum Bit Flip');
    expect(lesson?.curriculumModuleId).toBe('lesson-1-bit-flip');

    const upperCaseLesson = lessonRegistry.getLesson('S1-X-GATE');
    expect(upperCaseLesson?.id).toBe('s1-x-gate');
  });

  // 3. Lesson metadata checks
  it('conforms to Sprint 1 beginner metadata requirements', () => {
    expect(s1XGateLesson.sprint).toBe(1);
    expect(s1XGateLesson.difficulty).toBe('Beginner');
    expect(s1XGateLesson.estimatedMinutes).toBe(5);
    expect(s1XGateLesson.learningObjectives.length).toBe(5);
    expect(s1XGateLesson.learningObjectives).toContain('Understand X|0⟩ = |1⟩');
    expect(s1XGateLesson.learningObjectives).toContain('Recognize that applying X twice returns the qubit to |0⟩');
  });

  // 4. Prediction checkpoint has correct answer
  it('contains the expected prediction checkpoint in Step 3 with correct answer 100% 1', () => {
    const predStep = s1XGateLesson.steps[2]; // Step 3
    expect(predStep.id).toBe('step-3-prediction');
    expect(predStep.checkpoint).toBeDefined();

    const checkpoint = predStep.checkpoint!;
    expect(checkpoint.id).toBe('pred-x-gate');
    expect(checkpoint.question).toContain('What result do you expect when we measure the qubit after applying an X gate');
    expect(checkpoint.options).toHaveLength(3);

    // Option 2 is correct (100% 1)
    expect(checkpoint.correctOptionIndex).toBe(2);
    expect(checkpoint.options[2].label).toBe('100% 1');
    expect(checkpoint.options[2].isCorrect).toBe(true);
    expect(checkpoint.options[0].isCorrect).toBe(false);
    expect(checkpoint.options[1].isCorrect).toBe(false);
  });

  // 5. Simulation cannot occur before prediction & 6. X gate is placed on q[0]
  it('places X gate on q[0] in Step 2 and does not simulate before prediction in Step 3', async () => {
    const mockSpeech = {
      speak: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      isSpeaking: vi.fn(() => false),
      isAvailable: vi.fn(() => true),
      setMuted: vi.fn(),
      isMuted: vi.fn(() => false),
    };

    const controller = new TeachingController(mockHooks, mockSpeech);
    await controller.loadLesson(s1XGateLesson);
    await controller.start();

    // Step 1: Init state
    expect(controller.getState().currentStepIndex).toBe(0);

    // Step 2: Apply X gate
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(1);
    expect(mockHooks.updateCircuit).toHaveBeenCalledWith(
      expect.objectContaining({
        gates: expect.arrayContaining([
          expect.objectContaining({
            gate: 'x',
            targets: [0],
          }),
        ]),
      })
    );
    expect(mockHooks.highlightGate).toHaveBeenCalledWith('x-gate-demo');

    // Step 3: Prediction checkpoint
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(2);
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');

    // Simulation MUST NOT have occurred yet
    expect(mockHooks.runSimulation).not.toHaveBeenCalled();

    // Submitting prediction advances to Step 4 (Run simulation)
    await controller.submitPrediction(2);
    expect(controller.getState().currentStepIndex).toBe(3);
    expect(mockHooks.runSimulation).toHaveBeenCalledWith(500, undefined);

    controller.destroy();
  });

  // 7. Learner takeover does not overwrite learner modifications
  it('preserves learner modifications during takeover without unexpected circuit overwrites', async () => {
    const mockSpeech = {
      speak: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      isSpeaking: vi.fn(() => false),
      isAvailable: vi.fn(() => true),
      setMuted: vi.fn(),
      isMuted: vi.fn(() => false),
    };

    const controller = new TeachingController(mockHooks, mockSpeech);
    await controller.loadLesson(s1XGateLesson);
    await controller.start();

    // Advance through Step 1, 2, 3 (predict), 4 (sim), 5 (observe), 6 (explain)
    await controller.next(); // Step 2 (adds X gate)
    await controller.next(); // Step 3 (predict)
    await controller.submitPrediction(2); // Step 4 (sim)
    await controller.next(); // Step 5 (observe)
    await controller.next(); // Step 6 (explain)
    await controller.next(); // Step 7 (learner turn)

    expect(controller.getState().currentStepIndex).toBe(6);
    expect(controller.getState().status).toBe('LEARNER_TURN');

    // Circuit contains demonstrated X gate on q[0]
    expect(mockCircuit.gates).toHaveLength(1);
    expect(mockCircuit.gates[0].gate).toBe('x');

    // Learner adds a second X gate on q[0]
    mockCircuit.gates.push({
      id: 'learner-x-2',
      gate: 'x',
      targets: [0],
      column: 1,
    });
    expect(mockCircuit.gates).toHaveLength(2);

    // Complete learner turn -> advances to Step 8 (Transfer / Reflection)
    await controller.completeLearnerTurn();
    expect(controller.getState().currentStepIndex).toBe(7);
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');

    // Learner's 2 X gates remain intact (NOT overwritten by entering Step 8)
    expect(mockCircuit.gates).toHaveLength(2);
    expect(mockCircuit.gates[0].gate).toBe('x');
    expect(mockCircuit.gates[1].gate).toBe('x');

    controller.destroy();
  });

  // 8. Structured completion criteria correctly detect two X gates
  it('structured completion criteria correctly enforces two X gates on q[0]', () => {
    const takeoverStep = s1XGateLesson.steps[6]; // Step 7
    expect(takeoverStep.takeover).toBeDefined();
    const criteria = takeoverStep.takeover!.completionCriteria!;

    // Case A: 0 gates -> fails
    const zeroGatesCircuit: CircuitRequest = { qubits: 1, classical_bits: 1, gates: [], measure: true, shots: 500 };
    expect(evaluateCompletionCriteria(criteria, zeroGatesCircuit)).toBe(false);

    // Case B: 1 X gate -> fails
    const oneXCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [{ id: 'x1', gate: 'x', targets: [0], column: 0 }],
      measure: true,
      shots: 500,
    };
    expect(evaluateCompletionCriteria(criteria, oneXCircuit)).toBe(false);

    // Case C: 1 X gate and 1 H gate -> fails (requires 2 X gates)
    const xAndHCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'x1', gate: 'x', targets: [0], column: 0 },
        { id: 'h1', gate: 'h', targets: [0], column: 1 },
      ],
      measure: true,
      shots: 500,
    };
    expect(evaluateCompletionCriteria(criteria, xAndHCircuit)).toBe(false);

    // Case D: 2 X gates on q[0] -> passes
    const twoXCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'x1', gate: 'x', targets: [0], column: 0 },
        { id: 'x2', gate: 'x', targets: [0], column: 1 },
      ],
      measure: true,
      shots: 500,
    };
    expect(evaluateCompletionCriteria(criteria, twoXCircuit)).toBe(true);
  });

  // 9. Transfer/reflection checkpoint has correct answer
  it('contains transfer/reflection checkpoint in Step 8 with correct answer "The qubit returns to |0⟩"', () => {
    const reflectionStep = s1XGateLesson.steps[7]; // Step 8
    expect(reflectionStep.id).toBe('step-8-reflection');
    expect(reflectionStep.checkpoint).toBeDefined();

    const checkpoint = reflectionStep.checkpoint!;
    expect(checkpoint.id).toBe('pred-x-double');
    expect(checkpoint.question).toContain('What should happen after applying X twice to |0⟩?');
    expect(checkpoint.options).toHaveLength(3);

    // Option 0: "The qubit returns to |0⟩" is correct
    expect(checkpoint.correctOptionIndex).toBe(0);
    expect(checkpoint.options[0].label).toBe('The qubit returns to |0⟩');
    expect(checkpoint.options[0].isCorrect).toBe(true);
  });

  // 10. No X-specific controller/UI conditionals were introduced
  it('executes full lesson lifecycle through generic TeachingController and emits standard events', async () => {
    const mockSpeech = {
      speak: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      isSpeaking: vi.fn(() => false),
      isAvailable: vi.fn(() => true),
      setMuted: vi.fn(),
      isMuted: vi.fn(() => false),
    };

    const controller = new TeachingController(mockHooks, mockSpeech);
    await controller.loadLesson(s1XGateLesson);
    await controller.start();

    expect(controller.getState().activeLesson?.id).toBe('s1-x-gate');
    expect(controller.getState().totalSteps).toBe(9);

    // Step 1 -> 2 -> 3
    await controller.next();
    await controller.next();
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');

    // Submit prediction for checkpoint 1 (option 2 = 100% 1) -> advances to Step 4 (sim)
    await controller.submitPrediction(2);
    expect(controller.getState().currentStepIndex).toBe(3);

    // Step 4 -> 5 (observe & compare)
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(4);
    expect(controller.getState().predictionComparison?.isMatch).toBe(true);

    // Step 5 -> 6 (explain)
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(5);

    // Step 6 -> 7 (learner turn)
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(6);
    expect(controller.getState().status).toBe('LEARNER_TURN');

    // Add second X gate to satisfy takeover
    mockCircuit.gates.push({ id: 'x2', gate: 'x', targets: [0], column: 1 });

    // Complete learner turn -> advances to Step 8 (Transfer / Reflection)
    await controller.completeLearnerTurn();
    expect(controller.getState().currentStepIndex).toBe(7);
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');

    // Submit reflection prediction (option 0 = returns to |0>) -> advances to Step 9 (completion)
    await controller.submitPrediction(0);
    expect(controller.getState().status).toBe('COMPLETED');
    expect(controller.getState().activeLesson?.completionMessage).toBe(
      'Excellent! You used the Pauli-X gate to flip a qubit and verified that two X gates return it to |0⟩.'
    );

    // Verify standardized events emitted
    const eventTypes = dispatchedEvents.map((e) => e.type);
    expect(eventTypes).toContain('lesson_started');
    expect(eventTypes).toContain('step_started');
    expect(eventTypes).toContain('action_executed');
    expect(eventTypes).toContain('prediction_requested');
    expect(eventTypes).toContain('prediction_submitted');
    expect(eventTypes).toContain('simulation_started');
    expect(eventTypes).toContain('simulation_completed');
    expect(eventTypes).toContain('learner_takeover');
    expect(eventTypes).toContain('lesson_completed');

    controller.destroy();
  });
});

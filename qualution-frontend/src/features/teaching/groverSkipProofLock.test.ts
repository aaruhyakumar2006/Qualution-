import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TeachingController, type TeachingIDEHooks } from './teachingController';
import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';
import type { LessonScript } from './types';
import {
  STAGE_0_DATA,
  STAGE_1_DATA,
  STAGE_2_DATA,
  STAGE_3_DATA,
  STAGE_4_DATA,
  STAGE_5_DATA,
  STAGE_6_DATA,
} from './lessons/sprint-02/groverLessonData';
import {
  validateGroverStage1,
  validateAndDiagnoseGroverOracle,
} from './lessons/sprint-02/groverBehavioralValidators';
import {
  offlineProgressDb,
  saveOfflineLessonProgress,
  getOfflineLessonProgress,
  clearOfflineLessonProgress,
} from '../../services/db/offlineProgressDb';

describe('Phase 4: Grover Skip-Proof Lock Invariants (L1, L2, L3)', () => {
  let mockCircuit: CircuitRequest;
  let hooks: TeachingIDEHooks;

  // Construct a canonical 7-stage test lesson modeled on Grover data
  const testGroverLesson: LessonScript = {
    id: 'lesson-8-grovers-search',
    title: "Grover's Search Algorithm",
    sprint: 2,
    difficulty: 'Intermediate',
    estimatedMinutes: 5,
    xpReward: 350,
    conceptTags: ['Grover Search', 'Oracle', 'Diffusion Operator'],
    learningObjectives: ['Equal superposition', 'Phase oracle', 'Diffusion operator'],
    prerequisites: ['Hadamard Superposition'],
    summary: "Master Grover's Search Algorithm",
    starterCircuit: {
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measure: false,
      shots: 1000,
    },
    steps: [
      // Step 0: Stage 0 Classical Intuition (Checkpoint Gate)
      {
        id: STAGE_0_DATA.id,
        stepNumber: 0,
        title: STAGE_0_DATA.title,
        explanation: STAGE_0_DATA.classicalScalingText,
        narrationText: STAGE_0_DATA.tutorIntro,
        checkpoint: STAGE_0_DATA.checkpoint as any,
        actions: [],
      },
      // Step 1: Stage 1 Superposition Build (Takeover Gate)
      {
        id: STAGE_1_DATA.id,
        stepNumber: 1,
        title: STAGE_1_DATA.title,
        explanation: STAGE_1_DATA.observeExplanation,
        narrationText: STAGE_1_DATA.tutorIntro,
        actions: [],
        takeover: {
          prompt: 'Place a Hadamard gate on each qubit.',
          taskType: 'modify_circuit',
          goalDescription: 'Create equal superposition',
          instructions: ['Add H on qubit 0 and H on qubit 1'],
          customValidator: (circ: CircuitRequest) => validateGroverStage1(circ).isCorrect,
          customDiagnoser: (circ: CircuitRequest) => {
            const val = validateGroverStage1(circ);
            return {
              isCorrect: val.isCorrect,
              isInitial: circ.gates.length === 0,
              shouldCountAttempt: circ.gates.length > 0 && !val.isCorrect,
              message: val.message,
              misconceptionId: val.misconceptionId,
            };
          },
        },
      },
      // Step 2: Stage 2 Oracle Build (Takeover Gate)
      {
        id: STAGE_2_DATA.id,
        stepNumber: 2,
        title: STAGE_2_DATA.title,
        explanation: 'Oracle phase inversion for |11⟩',
        narrationText: STAGE_2_DATA.tutorIntro,
        actions: [],
        takeover: {
          prompt: 'Connect CZ between qubit 0 and qubit 1.',
          taskType: 'modify_circuit',
          goalDescription: 'Phase-flip state |11⟩',
          instructions: ['Add CZ gate across wires 0 and 1'],
          customValidator: (circ: CircuitRequest) => validateAndDiagnoseGroverOracle(circ).isCorrect,
          customDiagnoser: (circ: CircuitRequest) => {
            const val = validateAndDiagnoseGroverOracle(circ);
            return {
              isCorrect: val.isCorrect,
              isInitial: circ.gates.length <= 2,
              shouldCountAttempt: circ.gates.length > 2 && !val.isCorrect,
              message: val.message,
              misconceptionId: val.misconceptionId,
            };
          },
        },
      },
      // Step 3: Stage 3 Diffuser
      {
        id: 'stage-3-diffuser',
        stepNumber: 3,
        title: 'Stage 3 — Diffuser',
        explanation: 'Inversion about the mean',
        narrationText: 'Construct the Grover diffusion operator.',
        actions: [],
        takeover: {
          prompt: 'Construct H-X-CZ-X-H diffusion operator.',
          taskType: 'modify_circuit',
          goalDescription: 'Reflect amplitudes about mean',
          instructions: ['Build diffusion circuit'],
          completionCriteria: {
            type: 'circuit_has_gates',
            requiredGates: ['x'],
          },
        },
      },
      // Step 4: Stage 4 Measurement
      {
        id: 'stage-4-measurement',
        stepNumber: 4,
        title: 'Stage 4 — Measurement',
        explanation: 'Measurement verification',
        narrationText: 'Attach measurement gates.',
        checkpoint: {
          id: 'checkpoint-grover-iter',
          prompt: 'Iterations required',
          question: 'How many iterations?',
          options: [
            { id: '1', label: '1 iteration', description: 'Optimal', isCorrect: true },
            { id: '2', label: '2 iterations', description: 'Over-rotation', isCorrect: false },
          ],
          correctOptionIndex: 0,
          explanation: '1 iteration achieves 100% for N=4',
        },
        actions: [],
      },
      // Step 5: Stage 5 Overshoot
      {
        id: 'stage-5-overshoot',
        stepNumber: 5,
        title: 'Stage 5 — Overshoot',
        explanation: 'Over-rotation demonstration',
        narrationText: 'What happens with 2 iterations?',
        checkpoint: {
          id: 'checkpoint-overshoot',
          prompt: 'Predict P(11) after 2 iterations',
          question: 'What is P(11)?',
          options: [
            { id: '100', label: '100%', description: '', isCorrect: false },
            { id: '25', label: '25%', description: '', isCorrect: true },
          ],
          correctOptionIndex: 1,
          explanation: 'Over-rotates to 150 degrees, dropping P(11) to 25%',
        },
        actions: [],
      },
      // Step 6: Stage 6 Assessment
      {
        id: 'stage-6-assessment',
        stepNumber: 6,
        title: 'Stage 6 — Assessment',
        explanation: 'Final assessment',
        narrationText: 'Complete the assessment.',
        checkpoint: {
          id: 'checkpoint-final-assessment',
          prompt: 'Final Grover question',
          question: 'What is the role of diffusion?',
          options: [
            { id: 'opt-a', label: 'Inversion about the mean', description: '', isCorrect: true },
            { id: 'opt-b', label: 'Random guessing', description: '', isCorrect: false },
          ],
          correctOptionIndex: 0,
          explanation: 'Diffusion reflects amplitudes across the average',
        },
        actions: [],
      },
    ],
  };

  beforeEach(async () => {
    await clearOfflineLessonProgress('lesson-8-grovers-search');
    mockCircuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measure: false,
      shots: 1000,
    };

    hooks = {
      getCircuit: () => mockCircuit,
      updateCircuit: (c) => {
        mockCircuit = JSON.parse(JSON.stringify(c));
      },
      runSimulation: async () => null,
      getSimulationResult: () => null,
      focusVisualization: vi.fn(),
      highlightGate: vi.fn(),
      highlightQubit: vi.fn(),
      clearHighlights: vi.fn(),
      showToast: vi.fn(),
      clearToasts: vi.fn(),
    };
  });

  afterEach(async () => {
    await clearOfflineLessonProgress('lesson-8-grovers-search');
  });

  // ==========================================================================
  // INVARIANT L1: Controller-Level Gate Lock
  // ==========================================================================
  describe('Invariant L1: Controller step advancement refuses to leave unresolved gates', () => {
    it('L1.1: Refuses next(), goToStep(1), jumpToStep(5) when Step 0 checkpoint is unresolved', async () => {
      const ctrl = new TeachingController(hooks);
      await ctrl.loadLesson(testGroverLesson);
      await ctrl.start();

      expect(ctrl.getState().currentStepIndex).toBe(0);
      expect(ctrl.getState().status).toBe('WAITING_FOR_PREDICTION');
      expect(ctrl.isStepValidated(0)).toBe(false);

      // Attempt 1: call next() while prediction unresolved
      await ctrl.next();
      expect(ctrl.getState().currentStepIndex).toBe(0); // Refuses to leave!

      // Attempt 2: call jumpToStep(1)
      await ctrl.jumpToStep(1);
      expect(ctrl.getState().currentStepIndex).toBe(0); // Blocked!

      // Attempt 3: call jumpToStep(5)
      await ctrl.jumpToStep(5);
      expect(ctrl.getState().currentStepIndex).toBe(0); // Blocked!

      // Resolve Step 0 checkpoint by submitting correct prediction
      await ctrl.submitPrediction(2); // Option 2 is 3 boxes (correct)

      // Step 0 is now validated
      expect(ctrl.isStepValidated(0)).toBe(true);
      // And controller has naturally advanced to Step 1
      expect(ctrl.getState().currentStepIndex).toBe(1);
    });

    it('L1.2: Refuses advancement at Step 1 (Superposition build) until actual validator passes', async () => {
      const ctrl = new TeachingController(hooks);
      await ctrl.loadLesson(testGroverLesson);
      await ctrl.start();

      // Submit step 0 prediction
      await ctrl.submitPrediction(2);
      expect(ctrl.getState().currentStepIndex).toBe(1);
      expect(ctrl.getState().status).toBe('LEARNER_TURN');
      expect(ctrl.isStepValidated(1)).toBe(false);

      // Attempt to jump or advance with empty circuit (unvalidated)
      await ctrl.next();
      expect(ctrl.getState().currentStepIndex).toBe(1);
      await ctrl.jumpToStep(2);
      expect(ctrl.getState().currentStepIndex).toBe(1);

      // Attempt with invalid circuit (only 1 H gate)
      mockCircuit.gates = [{ id: 'g0', gate: 'h', targets: [0], column: 0 }];
      await ctrl.onUserCircuitChange(mockCircuit);
      expect(ctrl.getState().isTakeoverSatisfied).toBe(false);
      expect(ctrl.isStepValidated(1)).toBe(false);

      await ctrl.next();
      expect(ctrl.getState().currentStepIndex).toBe(1); // Still blocked!

      // Now place correct 2 Hadamard gates
      mockCircuit.gates = [
        { id: 'g0', gate: 'h', targets: [0], column: 0 },
        { id: 'g1', gate: 'h', targets: [1], column: 0 },
      ];
      await ctrl.onUserCircuitChange(mockCircuit);

      expect(ctrl.getState().isTakeoverSatisfied).toBe(true);
      expect(ctrl.isStepValidated(1)).toBe(true);

      // Advance now succeeds
      await ctrl.next();
      expect(ctrl.getState().currentStepIndex).toBe(2);
    });

    it('L1.3: Locks every gate across Stages 0 through 6; only validators set validated flag', async () => {
      const ctrl = new TeachingController(hooks);
      await ctrl.loadLesson(testGroverLesson);
      await ctrl.start();

      // 0. Stage 0: Checkpoint
      expect(ctrl.isStepValidated(0)).toBe(false);
      await ctrl.submitPrediction(2);
      expect(ctrl.isStepValidated(0)).toBe(true);
      expect(ctrl.getState().currentStepIndex).toBe(1);

      // 1. Stage 1: Superposition Build
      expect(ctrl.isStepValidated(1)).toBe(false);
      mockCircuit.gates = [
        { id: 'h0', gate: 'h', targets: [0], column: 0 },
        { id: 'h1', gate: 'h', targets: [1], column: 0 },
      ];
      await ctrl.onUserCircuitChange(mockCircuit);
      expect(ctrl.isStepValidated(1)).toBe(true);
      await ctrl.next();
      expect(ctrl.getState().currentStepIndex).toBe(2);

      // 2. Stage 2: Oracle Build
      expect(ctrl.isStepValidated(2)).toBe(false);
      // Try jumping to Stage 4 without solving Oracle
      await ctrl.jumpToStep(4);
      expect(ctrl.getState().currentStepIndex).toBe(2); // Blocked!

      // Add CZ gate to satisfy Oracle
      mockCircuit.gates.push({ id: 'cz', gate: 'cz', targets: [0, 1], column: 1 });
      await ctrl.onUserCircuitChange(mockCircuit);
      expect(ctrl.isStepValidated(2)).toBe(true);
      await ctrl.next();
      expect(ctrl.getState().currentStepIndex).toBe(3);

      // 3. Stage 3: Diffuser
      expect(ctrl.isStepValidated(3)).toBe(false);
      await ctrl.next();
      expect(ctrl.getState().currentStepIndex).toBe(3); // Blocked!
      // Add required gate for Diffuser takeover
      mockCircuit.gates.push({ id: 'x0', gate: 'x', targets: [0], column: 3 });
      await ctrl.completeLearnerTurn();
      expect(ctrl.isStepValidated(3)).toBe(true);
      expect(ctrl.getState().currentStepIndex).toBe(4);

      // 4. Stage 4: Checkpoint
      expect(ctrl.isStepValidated(4)).toBe(false);
      await ctrl.jumpToStep(6);
      expect(ctrl.getState().currentStepIndex).toBe(4); // Blocked!
      await ctrl.submitPrediction(0);
      expect(ctrl.isStepValidated(4)).toBe(true);
      expect(ctrl.getState().currentStepIndex).toBe(5);

      // 5. Stage 5: Checkpoint
      expect(ctrl.isStepValidated(5)).toBe(false);
      await ctrl.submitPrediction(1);
      expect(ctrl.isStepValidated(5)).toBe(true);
      expect(ctrl.getState().currentStepIndex).toBe(6);

      // 6. Stage 6: Assessment Checkpoint
      expect(ctrl.isStepValidated(6)).toBe(false);
      await ctrl.submitPrediction(0);
      expect(ctrl.isStepValidated(6)).toBe(true);
    });
  });

  // ==========================================================================
  // INVARIANT L2: Scrubber & Forward/Backward Navigation Guards
  // ==========================================================================
  describe('Invariant L2: UI non-interactivity and navigation guards', () => {
    it('L2.1: canAdvance() returns false while on unresolved gate', async () => {
      const ctrl = new TeachingController(hooks);
      await ctrl.loadLesson(testGroverLesson);
      await ctrl.start();

      expect(ctrl.canAdvance()).toBe(false);
      await ctrl.submitPrediction(2);
      // On step 1 (takeover not satisfied)
      expect(ctrl.canAdvance()).toBe(false);
    });

    it('L2.2: Backward navigation to re-read prior completed steps is ALLOWED; forward navigation past furthest validated step is BLOCKED', async () => {
      const ctrl = new TeachingController(hooks);
      await ctrl.loadLesson(testGroverLesson);
      await ctrl.start();

      // Complete Step 0
      await ctrl.submitPrediction(2);
      expect(ctrl.getState().currentStepIndex).toBe(1);

      // Complete Step 1
      mockCircuit.gates = [
        { id: 'h0', gate: 'h', targets: [0], column: 0 },
        { id: 'h1', gate: 'h', targets: [1], column: 0 },
      ];
      await ctrl.onUserCircuitChange(mockCircuit);
      await ctrl.next();
      expect(ctrl.getState().currentStepIndex).toBe(2); // Now on Step 2 (unresolved)

      // Learner wants to review prior Step 0:
      await ctrl.jumpToStep(0);
      expect(ctrl.getState().currentStepIndex).toBe(0); // Allowed!

      // Learner wants to review Step 1:
      await ctrl.jumpToStep(1);
      expect(ctrl.getState().currentStepIndex).toBe(1); // Allowed!

      // From Step 1, learner can return forward to Step 2 (furthest reached gate):
      await ctrl.jumpToStep(2);
      expect(ctrl.getState().currentStepIndex).toBe(2); // Allowed!

      // BUT from Step 2, learner CANNOT jump ahead to Step 3 or 5:
      await ctrl.jumpToStep(3);
      expect(ctrl.getState().currentStepIndex).toBe(2); // BLOCKED!
      await ctrl.jumpToStep(5);
      expect(ctrl.getState().currentStepIndex).toBe(2); // BLOCKED!
    });
  });

  // ==========================================================================
  // INVARIANT L3: Session / Dexie Persistence & Idempotency
  // ==========================================================================
  describe('Invariant L3: Session persistence returns to exact unresolved step; XP is idempotent', () => {
    it('L3.1: Page reload mid-step returns to the exact unresolved step in Dexie, never past it', async () => {
      const ctrl1 = new TeachingController(hooks);
      await ctrl1.loadLesson(testGroverLesson);
      await ctrl1.start();

      // Solve Step 0
      await ctrl1.submitPrediction(2);
      expect(ctrl1.getState().currentStepIndex).toBe(1);

      // Step 1 is in progress (unresolved)
      // Check Dexie persistence state
      const saved = await getOfflineLessonProgress('lesson-8-grovers-search');
      expect(saved).toBeDefined();
      expect(saved?.lastActiveStepIndex).toBe(1);
      expect(saved?.completedStepIndices).toContain(0);
      expect(saved?.completedStepIndices).not.toContain(1); // 1 is unresolved!

      // Simulate browser reload: create a new controller instance resuming lesson
      const ctrl2 = new TeachingController(hooks);
      await ctrl2.loadLesson(testGroverLesson);
      await ctrl2.resumeFromSavedProgress();

      // Must be at Step 1, NOT Step 2 or beyond!
      expect(ctrl2.getState().currentStepIndex).toBe(1);
      expect(ctrl2.isStepValidated(1)).toBe(false);
    });

    it('L3.2: Replay of lesson yields idempotent completion (no duplicate XP or badge corruption)', async () => {
      const ctrl = new TeachingController(hooks);
      await ctrl.loadLesson(testGroverLesson);
      await ctrl.start();

      // Fast-forward solve all 7 steps
      // 0
      await ctrl.submitPrediction(2);
      // 1
      mockCircuit.gates = [
        { id: 'h0', gate: 'h', targets: [0], column: 0 },
        { id: 'h1', gate: 'h', targets: [1], column: 0 },
      ];
      await ctrl.onUserCircuitChange(mockCircuit);
      await ctrl.next();
      // 2
      mockCircuit.gates.push({ id: 'cz', gate: 'cz', targets: [0, 1], column: 1 });
      await ctrl.onUserCircuitChange(mockCircuit);
      await ctrl.next();
      // 3
      mockCircuit.gates.push({ id: 'x0', gate: 'x', targets: [0], column: 3 });
      await ctrl.completeLearnerTurn();
      // 4
      await ctrl.submitPrediction(0);
      // 5
      await ctrl.submitPrediction(1);
      // 6
      await ctrl.submitPrediction(0);

      // Lesson completed
      expect(ctrl.getState().status).toBe('COMPLETED');
      const firstProgress = await getOfflineLessonProgress('lesson-8-grovers-search');
      expect(firstProgress?.isCompleted).toBe(true);
      expect(firstProgress?.completedStepIndices.length).toBe(7);

      // Now learner replays the lesson
      await ctrl.restart();
      expect(ctrl.getState().currentStepIndex).toBe(0);

      // Re-complete lesson
      await ctrl.submitPrediction(2);
      mockCircuit.gates = [
        { id: 'h0', gate: 'h', targets: [0], column: 0 },
        { id: 'h1', gate: 'h', targets: [1], column: 0 },
      ];
      await ctrl.onUserCircuitChange(mockCircuit);
      await ctrl.next();
      mockCircuit.gates.push({ id: 'cz', gate: 'cz', targets: [0, 1], column: 1 });
      await ctrl.onUserCircuitChange(mockCircuit);
      await ctrl.next();
      mockCircuit.gates.push({ id: 'x0', gate: 'x', targets: [0], column: 3 });
      await ctrl.completeLearnerTurn();
      await ctrl.submitPrediction(0);
      await ctrl.submitPrediction(1);
      await ctrl.submitPrediction(0);

      // Check DB after second completion
      const replayProgress = await getOfflineLessonProgress('lesson-8-grovers-search');
      expect(replayProgress?.isCompleted).toBe(true);
      // Completed step indices should remain a set of unique indices [0, 1, 2, 3, 4, 5, 6]
      const uniqueIndices = Array.from(new Set(replayProgress?.completedStepIndices));
      expect(uniqueIndices.length).toBe(7);
      expect(replayProgress?.completedStepIndices.length).toBe(7); // No duplicates!
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeachingController, type TeachingIDEHooks } from './teachingController';
import type { LessonScript, TeachingEvent } from './types';
import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';
import { onTeachingEvent } from './teachingEvents';

describe('Generic Practical Lesson Engine (Content-Agnostic Execution)', () => {
  let mockCircuit: CircuitRequest;
  let hooks: TeachingIDEHooks;
  let events: TeachingEvent[];
  let unsubscribeEvents: () => void;

  beforeEach(() => {
    mockCircuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measure: true,
      shots: 1000,
    };

    events = [];
    unsubscribeEvents = onTeachingEvent((ev) => events.push(ev));

    hooks = {
      getCircuit: () => mockCircuit,
      updateCircuit: (c) => {
        mockCircuit = { ...c };
      },
      runSimulation: async () => {
        return {
          valid: true,
          circuit: {
            qubits: mockCircuit.qubits,
            classical_bits: mockCircuit.classical_bits,
            gates: mockCircuit.gates,
          },
          simulation: {
            backend: 'qiskit_aer',
            mode: 'shots',
            shots: 1000,
            execution_time_ms: 15,
            probabilities: { '00': 0.498, '11': 0.502 },
            counts: { '00': 498, '11': 502 },
          },
          visualization: {},
          metrics: { gate_count: mockCircuit.gates.length, depth: 2, multi_qubit_gates: 1, qubit_count: 2 },
        } as unknown as CircuitRunResponse;
      },
      getSimulationResult: () => null,
      focusVisualization: vi.fn(),
      highlightGate: vi.fn(),
      highlightQubit: vi.fn(),
      clearHighlights: vi.fn(),
      showToast: vi.fn(),
    };
  });

  // Synthetic 2-qubit Bell State lesson with Pauli-X, CNOT, and structured criteria
  const syntheticBellLesson: LessonScript = {
    id: 's2-bell-entanglement',
    title: 'Bell State & Quantum Entanglement',
    sprint: 2,
    difficulty: 'Intermediate',
    estimatedMinutes: 8,
    xpReward: 250,
    curriculumModuleId: 'lesson-3-bell-state',
    conceptTags: ['Entanglement', 'Bell State', 'CNOT'],
    learningObjectives: ['Create maximally entangled Bell state |Φ+⟩', 'Observe correlated measurement statistics'],
    prerequisites: ['Single qubit gates'],
    summary: 'Construct the maximally entangled Bell pair using H and CNOT gates.',
    completionMessage: 'Outstanding achievement! You have synthesized non-local quantum entanglement.',
    starterCircuit: {
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measure: true,
      shots: 1000,
    },
    steps: [
      {
        id: 'step-1-init',
        stepNumber: 1,
        title: 'Initialize 2-Qubit Register',
        explanation: 'Initialize q[0] and q[1] in ground state |00⟩.',
        narrationText: 'Initializing two qubit register.',
        actions: [
          { type: 'initialize_qubits', qubits: 2, classicalBits: 2 },
          { type: 'highlight_qubit', qubitIndex: 1 },
        ],
      },
      {
        id: 'step-2-add-gates',
        stepNumber: 2,
        title: 'Apply H and CNOT Gates',
        explanation: 'H on q[0] creates superposition, then CNOT targets q[1] to entangle.',
        narrationText: 'Placing H and CNOT gates.',
        actions: [
          { type: 'add_gate', gate: 'h', targets: [0], column: 0, gateId: 'h-gate-bell' },
          { type: 'add_gate', gate: 'cx', targets: [0, 1], column: 1, gateId: 'cx-gate-bell' },
          { type: 'highlight_gate', gateId: 'cx-gate-bell' },
        ],
      },
      {
        id: 'step-3-predict',
        stepNumber: 3,
        title: 'Prediction Checkpoint',
        explanation: 'Predict outcomes for entangled pair |Φ+⟩ = (|00⟩ + |11⟩) / √2.',
        narrationText: 'What basis states will be measured?',
        actions: [],
        checkpoint: {
          id: 'pred-bell',
          prompt: 'Predict Bell State Outcomes',
          question: 'What measurement outcomes will appear?',
          options: [
            { id: 'opt-0', label: '25% each of 00, 01, 10, 11', isCorrect: false },
            { id: 'opt-1', label: '50% |00⟩ and 50% |11⟩ (perfect correlation)', isCorrect: true },
          ],
          correctOptionIndex: 1,
          explanation: 'The Bell state yields correlated outcomes: only 00 and 11 can be observed.',
          structuredComparison: {
            expectedDistribution: {
              '00': { min: 0.4, max: 0.6 },
              '11': { min: 0.4, max: 0.6 },
            },
            matchSummary: 'Entanglement confirmed! Correlated 50/50 distribution observed.',
          },
        },
      },
      {
        id: 'step-4-sim',
        stepNumber: 4,
        title: 'Simulate and Compare',
        explanation: 'Execute simulation and compare prediction.',
        narrationText: 'Executing simulation.',
        actions: [
          { type: 'run_simulation', shots: 1000 },
          { type: 'focus_visualization', panel: 'results' },
          { type: 'compare_prediction' },
        ],
      },
      {
        id: 'step-5-your-turn',
        stepNumber: 5,
        title: 'Your Turn: Add Pauli-Z Gate',
        explanation: 'Add a Pauli-Z phase gate on q[0] to transform |Φ+⟩ into |Φ-⟩.',
        narrationText: 'Experiment with phase flip.',
        actions: [],
        takeover: {
          taskType: 'modify_circuit',
          prompt: 'Add a Z gate on q[0]',
          goalDescription: 'Add a Z gate on q[0] to observe phase inversion.',
          instructions: ['Add Z gate on wire q[0]', 'Observe state changes'],
          allowEarlyCompletion: true,
          completionCriteria: {
            type: 'circuit_has_gates',
            requiredGates: ['z'],
          },
        },
      },
      {
        id: 'step-6-complete',
        stepNumber: 6,
        title: 'Completed',
        explanation: 'Lesson complete.',
        narrationText: 'Entanglement mastered.',
        actions: [{ type: 'complete_lesson' }],
      },
    ],
  };

  it('executes a synthetic multi-qubit lesson without any Hadamard-specific dependencies', async () => {
    const controller = new TeachingController(hooks);

    // 1. Load synthetic lesson
    const loadSuccess = await controller.loadLesson(syntheticBellLesson);
    expect(loadSuccess).toBe(true);

    const state = controller.getState();
    expect(state.activeLesson?.title).toBe('Bell State & Quantum Entanglement');
    expect(state.totalSteps).toBe(6);

    // 2. Start lesson -> Step 1 initializes 2 qubits and highlights q[1]
    await controller.start();
    expect(mockCircuit.qubits).toBe(2);
    expect(hooks.highlightQubit).toHaveBeenCalledWith(1);

    // 3. Advance to Step 2 -> Adds H and CNOT (cx) gates
    await controller.next();
    expect(mockCircuit.gates).toHaveLength(2);
    expect(mockCircuit.gates[0].gate).toBe('h');
    expect(mockCircuit.gates[1].gate).toBe('cx');
    expect(mockCircuit.gates[1].targets).toEqual([0, 1]);
    expect(hooks.highlightGate).toHaveBeenCalledWith('cx-gate-bell');

    // 4. Advance to Step 3 -> Prediction checkpoint
    await controller.next();
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
    expect(controller.getState().currentStep?.checkpoint?.id).toBe('pred-bell');

    // 5. Submit prediction (Option 1 is correct)
    await controller.submitPrediction(1);

    // 6. Step 4 runs simulation and evaluates structured comparison
    expect(controller.getState().status).toBe('TEACHING');
    expect(hooks.focusVisualization).toHaveBeenCalledWith('results');

    // Verification of structured comparison without any custom JS comparison rule
    const comp = controller.getState().predictionComparison;
    expect(comp).not.toBeNull();
    expect(comp?.isMatch).toBe(true);
    expect(comp?.userSummary).toContain('Entanglement confirmed!');

    // 7. Advance to Step 5 -> "Your Turn" takeover with structured completion criteria
    await controller.next();
    expect(controller.getState().status).toBe('LEARNER_TURN');

    // Initially, circuit has no Z gate, so structured criteria is false
    expect(controller.checkLearnerTurnSatisfied()).toBe(false);

    // Learner adds Z gate to circuit
    mockCircuit.gates.push({ id: 'z1', gate: 'z', targets: [0], column: 2 });
    expect(controller.checkLearnerTurnSatisfied()).toBe(true);

    // 8. Complete learner turn -> advances to complete step
    await controller.completeLearnerTurn();
    expect(controller.getState().status).toBe('COMPLETED');

    // Verify completion event produced with rich metadata
    const completedEvent = events.find((e) => e.type === 'lesson_completed');
    expect(completedEvent).toBeDefined();
    expect(completedEvent?.metadata?.xpReward).toBe(250);
    expect(completedEvent?.metadata?.curriculumModuleId).toBe('lesson-3-bell-state');
    expect(completedEvent?.metadata?.concept).toBe('entanglement');
    expect(typeof completedEvent?.metadata?.timeSpentMs).toBe('number');
    expect(completedEvent?.metadata?.simulationCount).toBe(1);
    expect(completedEvent?.metadata?.predictionAttempts).toBe(1);

    // Verify granular action_executed events were emitted for 3D/audio layer compatibility
    const actionEvents = events.filter((e) => e.type === 'action_executed');
    expect(actionEvents.length).toBeGreaterThan(0);
    expect(actionEvents.some((e) => e.metadata?.actionType === 'add_gate')).toBe(true);
    expect(actionEvents.some((e) => e.metadata?.actionType === 'highlight_gate')).toBe(true);

    unsubscribeEvents();
    controller.destroy();
  });
});

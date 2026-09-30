import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lesson8GroversSearchLesson } from './lessons/sprint-02/lesson-8-grovers-search';
import { TeachingController, type TeachingIDEHooks } from './teachingController';
import type { CircuitRequest } from '../circuit/types';
import { simulateStatevectorCircuit } from '../circuit/statevectorEngine';
import { STAGE_0_DATA, STAGE_1_DATA, STAGE_2_DATA } from './lessons/sprint-02/groverLessonData';
import { validateAndDiagnoseGroverOracle } from './lessons/sprint-02/groverOracleDiagnoser';

describe('Phase 5 — Grover Stages 0-2 Wired End-to-End with Live Workbench Interaction', () => {
  let circuit: CircuitRequest;
  let hooks: TeachingIDEHooks;
  let liveSimResults: any;
  let focusedPanel: string | null = null;

  beforeEach(() => {
    circuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measure: false,
      shots: 1000,
    };
    liveSimResults = null;
    focusedPanel = null;

    hooks = {
      getCircuit: vi.fn(() => circuit),
      updateCircuit: vi.fn((newCirc) => {
        circuit = { ...newCirc };
      }),
      runSimulation: vi.fn(async () => {
        // Execute on the REAL simulateStatevectorCircuit (no hardcoded/mocked outputs)
        const simRes = simulateStatevectorCircuit(circuit, { shots: 1000, includeStatevector: true });
        liveSimResults = {
          success: true,
          backend: 'statevector',
          execution_time_ms: simRes.runtime_ms,
          circuit: { ...circuit },
          simulation: {
            probabilities: simRes.probabilities,
            counts: simRes.counts,
            shots: simRes.shots,
            statevector: simRes.statevector,
          },
        };
        return liveSimResults;
      }),
      getSimulationResult: vi.fn(() => liveSimResults),
      focusVisualization: vi.fn((panel) => {
        focusedPanel = panel;
      }),
      highlightGate: vi.fn(),
      highlightQubit: vi.fn(),
      clearHighlights: vi.fn(),
      clearToasts: vi.fn(),
      showToast: vi.fn(),
      updateMetrics: vi.fn(),
    };
  });

  it('1. Stage 0 (Classical Intuition): Renders 4-box intuition without prediction checkpoint cards', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);
    await ctrl.start();

    // Controller starts at Step 0: Stage 0 Classical Intuition
    const st0 = ctrl.getState();
    expect(st0.currentStepIndex).toBe(0);
    expect(st0.status).not.toBe('WAITING_FOR_PREDICTION');
    expect(st0.currentStep?.id).toBe(STAGE_0_DATA.id);
    expect(st0.currentStep?.checkpoint).toBeUndefined();

    // Advances to step 1
    await ctrl.next();
    expect(ctrl.getState().currentStepIndex).toBe(1);
  });

  it('2. Stage 1 (Equal Superposition): Dispatches H gates on q0 & q1 to real Workbench, runs Statevector simulator, verifies live 25% probabilities', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);
    
    // Jump directly to Stage 1 (Step 1)
    await ctrl.jumpToStep(1, { force: true });

    // Step 1 executes actions: places H on q0 and H on q1
    expect(circuit.qubits).toBe(2);
    expect(circuit.gates).toHaveLength(2);
    expect(circuit.gates[0].gate).toBe('h');
    expect(circuit.gates[0].targets).toEqual([0]);
    expect(circuit.gates[1].gate).toBe('h');
    expect(circuit.gates[1].targets).toEqual([1]);

    // Actions also triggered real Statevector simulation and focused the 'state' panel
    expect(hooks.runSimulation).toHaveBeenCalled();
    expect(focusedPanel).toBe('state');

    // Verify simulator-derived statevector values from REAL Statevector engine
    expect(liveSimResults).not.toBeNull();
    const probs = liveSimResults.simulation.probabilities;
    expect(probs['00']).toBeCloseTo(0.25, 4);
    expect(probs['01']).toBeCloseTo(0.25, 4);
    expect(probs['10']).toBeCloseTo(0.25, 4);
    expect(probs['11']).toBeCloseTo(0.25, 4);

    // Stage 1 executes actions without blocking on checkpoint cards
    const st1 = ctrl.getState();
    expect(st1.status).not.toBe('WAITING_FOR_PREDICTION');
    expect(st1.currentStep?.checkpoint).toBeUndefined();

    // Learner advances to Stage 2
    await ctrl.next();
    expect(ctrl.getState().currentStepIndex).toBe(2); // Auto-advances to Stage 2
  });

  it('3. Stage 2 (Phase Oracle): Enters LEARNER_TURN, diagnoses wrong gate attempts, validates real CZ, simulates Statevector showing -0.5 amplitude on |11⟩', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);

    // Jump to Stage 2 (Step 2: Phase Oracle)
    await ctrl.jumpToStep(2, { force: true });

    const st2 = ctrl.getState();
    expect(st2.status).toBe('LEARNER_TURN');
    expect(st2.currentStep?.id).toBe('stage-2-oracle-phase-inversion');
    expect(st2.isTakeoverSatisfied).toBe(false);

    // Pre-seeded with Stage 1 circuit (2 H gates)
    expect(circuit.gates).toHaveLength(2);

    // ── Misconception 1: Student places Pauli-X (bit flip) on q0 ──
    const xCirc: CircuitRequest = {
      ...circuit,
      gates: [...circuit.gates, { id: 'test-x', gate: 'x', targets: [0], column: 1 }],
    };
    await ctrl.onUserCircuitChange(xCirc);
    expect(ctrl.getState().isTakeoverSatisfied).toBe(false);
    expect(ctrl.getState().takeoverFailedAttempts).toBe(1);
    expect(ctrl.getState().takeoverFeedback?.misconceptionId).toBe('grover-oracle-bit-flip');

    // ── Misconception 2: Student places Pauli-Z (single wire phase) on q0 ──
    const zCirc: CircuitRequest = {
      ...circuit,
      gates: [...circuit.gates, { id: 'test-z', gate: 'z', targets: [0], column: 1 }],
    };
    await ctrl.onUserCircuitChange(zCirc);
    expect(ctrl.getState().isTakeoverSatisfied).toBe(false);
    expect(ctrl.getState().takeoverFailedAttempts).toBe(2);
    expect(ctrl.getState().takeoverFeedback?.misconceptionId).toBe('grover-oracle-single-qubit-phase');

    // ── Correct placement: Student places Controlled-Z between q0 and q1 ──
    const czCirc: CircuitRequest = {
      ...circuit,
      gates: [...circuit.gates, { id: 'g-s2-cz', gate: 'cz', targets: [0, 1], column: 1 }],
    };
    await ctrl.onUserCircuitChange(czCirc);
    expect(ctrl.getState().isTakeoverSatisfied).toBe(true);

    // Verify Oracle circuit on the real simulator
    const simRes = simulateStatevectorCircuit(czCirc, { includeStatevector: true });
    const sv = simRes.statevector!;
    expect(sv).toBeDefined();

    // |00⟩ amplitude: +0.5 (real: 0.5, imag: 0)
    expect(sv[0].real).toBeCloseTo(0.5, 4);
    expect(sv[0].imag).toBeCloseTo(0.0, 4);
    // |01⟩ amplitude: +0.5
    expect(sv[1].real).toBeCloseTo(0.5, 4);
    // |10⟩ amplitude: +0.5
    expect(sv[2].real).toBeCloseTo(0.5, 4);
    // |11⟩ amplitude: -0.5 (phase-inverted by oracle!)
    expect(sv[3].real).toBeCloseTo(-0.5, 4);
    expect(sv[3].imag).toBeCloseTo(0.0, 4);

    // However, probabilities remain uniform 25% each! (The mark is invisible)
    expect(simRes.probabilities['00']).toBeCloseTo(0.25, 4);
    expect(simRes.probabilities['01']).toBeCloseTo(0.25, 4);
    expect(simRes.probabilities['10']).toBeCloseTo(0.25, 4);
    expect(simRes.probabilities['11']).toBeCloseTo(0.25, 4);
  });

  it('4. Full End-to-End Progression from Stage 0 through Stage 2 on Real Workbench', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);
    await ctrl.start();

    // Step 0: Stage 0 Classical Intuition
    expect(ctrl.getState().currentStepIndex).toBe(0);
    await ctrl.next();

    // Transitions to Step 1: Stage 1 Superposition
    expect(ctrl.getState().currentStepIndex).toBe(1);
    expect(circuit.gates).toHaveLength(2); // H on q0 and q1 placed

    // Step 1: Advances cleanly to Stage 2
    await ctrl.next();

    // Transitions to Step 2: Stage 2 Oracle Takeover
    expect(ctrl.getState().currentStepIndex).toBe(2);
    expect(ctrl.getState().status).toBe('LEARNER_TURN');

    // Complete the takeover with CZ
    circuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
        { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
        { id: 'g-s2-cz', gate: 'cz', targets: [0, 1], column: 1 },
      ],
      measure: false,
      shots: 1000,
    };
    await ctrl.completeLearnerTurn();

    // Advances to Stage 3 (Diffuser)
    expect(ctrl.getState().currentStepIndex).toBe(3);
    expect(ctrl.getState().currentStep?.title).toContain('Diffuser');
  });
});

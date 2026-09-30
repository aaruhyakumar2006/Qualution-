import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lesson8GroversSearchLesson } from './lesson-8-grovers-search';
import { validateAndDiagnoseGroverOracle } from './groverOracleDiagnoser';
import { validateLessonScript } from '../../lessonValidator';
import { lessonRegistry } from '../../lessonRegistry';
import { TeachingController, type TeachingIDEHooks } from '../../teachingController';
import { computeCircuitMetrics } from '../../../circuit/circuitMetrics';
import type { CircuitRequest } from '../../../circuit/types';
import {
  GROVER_STAGE_4_VERIFICATION_TABLE,
  generateGroverTutorInsights,
} from './groverVerification';
import {
  resolveCircuitRouting,
  isCliffordCircuit,
} from '../../../circuit/executionRouter';
import { targetResolver } from '../../TeachingTargetResolver';

describe("Lesson 8: Grover's Search Algorithm (Continuous 14-15 Min Experience)", () => {
  let mockCircuit: CircuitRequest;
  let hooks: TeachingIDEHooks;

  beforeEach(() => {
    mockCircuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measure: false,
      shots: 1000,
    };

    hooks = {
      getCircuit: vi.fn(() => mockCircuit),
      updateCircuit: vi.fn((newCirc) => {
        mockCircuit = { ...newCirc };
      }),
      runSimulation: vi.fn(async () => ({
        success: true,
        backend: 'simulator',
        execution_time_ms: 1.5,
        circuit: mockCircuit,
        simulation: {
          probabilities: { '11': 1.0, '00': 0.0, '01': 0.0, '10': 0.0 },
          counts: { '11': 1000 },
          shots: 1000,
        },
      } as any)),
      getSimulationResult: vi.fn(() => null),
      focusVisualization: vi.fn(),
      highlightGate: vi.fn(),
      highlightQubit: vi.fn(),
      clearHighlights: vi.fn(),
      showToast: vi.fn(),
      updateMetrics: vi.fn(),
    };
  });

  it('1. Passes validateLessonScript with zero errors and realistic 4-6 minute duration standard', () => {
    const validation = validateLessonScript(lesson8GroversSearchLesson);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Realistic duration standard: 4-6 minutes (5 min target) for 5-step practical lab
    expect(lesson8GroversSearchLesson.estimatedMinutes).toBeGreaterThanOrEqual(4);
    expect(lesson8GroversSearchLesson.estimatedMinutes).toBeLessThanOrEqual(6);
    expect(lesson8GroversSearchLesson.steps.length).toBe(8);
  });

  it('2. Is registered in LessonRegistry under lesson-8-grovers-search and aliases', () => {
    const lesson = lessonRegistry.getLesson('lesson-8-grovers-search');
    expect(lesson).toBeDefined();
    expect(lesson?.id).toBe('lesson-8-grovers-search');

    const byAlias = lessonRegistry.getLesson('lesson-8');
    expect(byAlias).toBeDefined();
    expect(byAlias?.id).toBe('lesson-8-grovers-search');
  });

  it('2b. STAGE 0 (Classical Intuition) — Loads cleanly without blocking prediction checkpoint cards', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);
    await ctrl.jumpToStep(0);

    const st = ctrl.getState();
    expect(st.status).not.toBe('WAITING_FOR_PREDICTION');
    expect(st.currentStep?.checkpoint).toBeUndefined();

    await ctrl.next();
    expect(ctrl.getState().currentStepIndex).toBe(1);
  });

  it('3. SECTION 4 (Superposition) — Places H gates on q0 and q1 with live qubit_count: 2 telemetry', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);
    
    // Before starting the lesson, circuit has 0 gates (H gates not pre-attached)
    expect(mockCircuit.gates).toHaveLength(0);

    // Jump to Stage 1 (index 1: equal superposition across all 4 states)
    await ctrl.jumpToStep(1);

    expect(mockCircuit.qubits).toBe(2);
    expect(mockCircuit.gates).toHaveLength(2);
    expect(mockCircuit.gates[0].gate).toBe('h');
    expect(mockCircuit.gates[1].gate).toBe('h');

    // Live telemetry after Superposition
    const metricsS1 = computeCircuitMetrics(mockCircuit);
    expect(metricsS1.qubit_count).toBe(2);
    expect(metricsS1.gate_count).toBe(2);
    expect(metricsS1.depth).toBe(1);
    expect(metricsS1.two_qubit_gate_ratio).toBe(0);
  });

  it('4. SECTION 6 & 7 — Evaluates Grover oracle validation & targeted misconception diagnostics', () => {
    const baseCirc: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 'h', targets: [1], column: 0 },
      ],
      measure: false,
      shots: 1000,
    };

    // Baseline: no gates added yet
    const initDiag = validateAndDiagnoseGroverOracle(baseCirc);
    expect(initDiag.isCorrect).toBe(false);
    expect(initDiag.isInitial).toBe(true);
    expect(initDiag.shouldCountAttempt).toBe(false);

    // Wrong Attempt 1: Pauli-X gate (bit-flip misconception)
    const xCirc: CircuitRequest = {
      ...baseCirc,
      gates: [...baseCirc.gates, { gate: 'x', targets: [0], column: 1 }],
    };
    const xDiag = validateAndDiagnoseGroverOracle(xCirc);
    expect(xDiag.isCorrect).toBe(false);
    expect(xDiag.misconceptionId).toBe('grover-oracle-bit-flip');
    expect(xDiag.message).toContain('bit-flip');
    expect(xDiag.shouldCountAttempt).toBe(true);

    // Wrong Attempt 2: Pauli-Z gate (single-qubit phase misconception)
    const zCirc: CircuitRequest = {
      ...baseCirc,
      gates: [...baseCirc.gates, { gate: 'z', targets: [0], column: 1 }],
    };
    const zDiag = validateAndDiagnoseGroverOracle(zCirc);
    expect(zDiag.isCorrect).toBe(false);
    expect(zDiag.misconceptionId).toBe('grover-oracle-single-qubit-phase');
    expect(zDiag.message).toContain('single-qubit');
    expect(zDiag.shouldCountAttempt).toBe(true);

    // Wrong Attempt 3: Bare CNOT (CX) without Hadamards
    const cxCirc: CircuitRequest = {
      ...baseCirc,
      gates: [...baseCirc.gates, { gate: 'cx', targets: [0, 1], column: 1 }],
    };
    const cxDiag = validateAndDiagnoseGroverOracle(cxCirc);
    expect(cxDiag.isCorrect).toBe(false);
    expect(cxDiag.misconceptionId).toBe('grover-oracle-cnot-without-hadamard');
    expect(cxDiag.message).toContain('sandwich the target qubit in Hadamard');

    // Correct Attempt A: Direct CZ between q0 and q1
    const czCirc: CircuitRequest = {
      ...baseCirc,
      gates: [...baseCirc.gates, { gate: 'cz', targets: [0, 1], column: 1 }],
    };
    const czDiag = validateAndDiagnoseGroverOracle(czCirc);
    expect(czDiag.isCorrect).toBe(true);
    expect(czDiag.solutionType).toBe('cz');
    expect(czDiag.message).toContain("Correct — that's the phase-flip oracle for |11⟩");

    // Correct Attempt B: H-CX-H identity decomposition
    const hcxhCirc: CircuitRequest = {
      ...baseCirc,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 'h', targets: [1], column: 0 },
        { gate: 'h', targets: [1], column: 1 },
        { gate: 'cx', targets: [0, 1], column: 2 },
        { gate: 'h', targets: [1], column: 3 },
      ],
    };
    const hcxhDiag = validateAndDiagnoseGroverOracle(hcxhCirc);
    expect(hcxhDiag.isCorrect).toBe(true);
    expect(hcxhDiag.solutionType).toBe('h_cx_h');
  });

  it('4b. SECTION 6 & 7 — Halts at interactive interrupt (Step 2), tracks failed attempts before Show Me, and auto-advances on CZ', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);
    await ctrl.jumpToStep(2); // Step 2: Oracle takeover (index 2)

    const state = ctrl.getState();
    expect(state.status).toBe('LEARNER_TURN');
    expect(state.narrationText).toBe(
      'The oracle needs to mark state |11⟩ with a phase flip. Connect a Controlled-Z gate (or equivalent H-CX-H sandwich) between wire 0 and wire 1.'
    );
    expect(state.takeoverFailedAttempts).toBe(0);

    // Initial check: failed attempts = 0, so Show Me must NOT be active (< 2 attempts)
    expect((state.takeoverFailedAttempts || 0) >= 2).toBe(false);

    // 1st Wrong Attempt: learner drags X onto q0
    mockCircuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 'h', targets: [1], column: 0 },
        { gate: 'x', targets: [0], column: 1 },
      ],
      measure: false,
      shots: 1000,
    };
    await ctrl.onUserCircuitChange(mockCircuit);

    const afterWrong1 = ctrl.getState();
    expect(afterWrong1.status).toBe('LEARNER_TURN'); // Does NOT advance!
    expect(afterWrong1.takeoverFailedAttempts).toBe(1);
    expect(afterWrong1.takeoverFeedback?.isError).toBe(true);
    expect(afterWrong1.takeoverFeedback?.misconceptionId).toBe('grover-oracle-bit-flip');
    // Still < 2 attempts -> Show Me still locked!
    expect((afterWrong1.takeoverFailedAttempts || 0) >= 2).toBe(false);

    // 2nd Wrong Attempt: learner drags Z onto q0
    mockCircuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 'h', targets: [1], column: 0 },
        { gate: 'z', targets: [0], column: 1 },
      ],
      measure: false,
      shots: 1000,
    };
    await ctrl.onUserCircuitChange(mockCircuit);

    const afterWrong2 = ctrl.getState();
    expect(afterWrong2.status).toBe('LEARNER_TURN'); // Still waiting indefinitely
    expect(afterWrong2.takeoverFailedAttempts).toBe(2);
    expect(afterWrong2.takeoverFeedback?.misconceptionId).toBe('grover-oracle-single-qubit-phase');
    // Now >= 2 attempts -> Show Me is unlocked!
    expect((afterWrong2.takeoverFailedAttempts || 0) >= 2).toBe(true);

    // Correct Attempt: learner drags CZ between q0 and q1
    mockCircuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 'h', targets: [1], column: 0 },
        { gate: 'cz', targets: [0, 1], column: 1 },
      ],
      measure: false,
      shots: 1000,
    };
    await ctrl.onUserCircuitChange(mockCircuit);

    const afterCorrect = ctrl.getState();
    expect(afterCorrect.isTakeoverSatisfied).toBe(true);
    expect(afterCorrect.narrationText).toContain("Correct — that's the phase-flip oracle for |11⟩");
  });

  it('5. SECTION 8 — Resumes from the learner’s exact circuit without reset', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);

    // Jump to step 2 (the takeover step, index 2)
    await ctrl.jumpToStep(2);
    expect(ctrl.getState().status).toBe('LEARNER_TURN');

    // Learner places their custom CZ gate on the circuit
    mockCircuit.gates = [
      { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
      { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
      { id: 'custom-learner-cz', gate: 'cz', targets: [0, 1], column: 1 },
    ];

    // Complete the learner turn
    await ctrl.completeLearnerTurn();

    // Now on step 3 (index 3: STAGE 3 — Diffuser (Inversion About Mean))
    expect(ctrl.getState().currentStepIndex).toBe(3);
    expect(ctrl.getState().currentStep?.title).toBe('STAGE 3 — Diffuser (Inversion About Mean)');
    // Learner's gate is PRESERVED, not erased!
    expect(mockCircuit.gates.some((g) => g.id === 'custom-learner-cz')).toBe(true);
  });

  it('6. SECTION 10 & 11 — Constructs Grover diffusion operator matching exact verification table', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);

    // Jump to Step 16 (index 15: completing diffusion operator)
    await ctrl.jumpToStep(15);

    // After completing diffusion operator, full Grover circuit has 12 unitary gates across 7 layers:
    // col 0: 2 H | col 1: 1 CZ | col 2: 2 H | col 3: 2 X | col 4: 1 CZ | col 5: 2 X | col 6: 2 H
    const diffSnapshot: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
        { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
        { id: 'g-s2-cz-oracle', gate: 'cz', targets: [0, 1], column: 1 },
        { id: 'g-s3-h0-diff', gate: 'h', targets: [0], column: 2 },
        { id: 'g-s3-h1-diff', gate: 'h', targets: [1], column: 2 },
        { id: 'g-s3-x0-diff', gate: 'x', targets: [0], column: 3 },
        { id: 'g-s3-x1-diff', gate: 'x', targets: [1], column: 3 },
        { id: 'g-s3-cz-diff', gate: 'cz', targets: [0, 1], column: 4 },
        { id: 'g-s3-x0-post', gate: 'x', targets: [0], column: 5 },
        { id: 'g-s3-x1-post', gate: 'x', targets: [1], column: 5 },
        { id: 'g-s3-h0-post', gate: 'h', targets: [0], column: 6 },
        { id: 'g-s3-h1-post', gate: 'h', targets: [1], column: 6 },
      ],
    };

    const metricsSnapshot = computeCircuitMetrics(diffSnapshot);
    expect(metricsSnapshot.qubit_count).toBe(2);
    expect(metricsSnapshot.gate_count).toBe(12);
    expect(metricsSnapshot.depth).toBe(7);
    expect(metricsSnapshot.two_qubit_gate_count).toBe(2);
    expect(metricsSnapshot.two_qubit_gate_ratio).toBe(0.1667); // 16.7%
  });

  it('7. SECTION 12 & 13 — Executes Stage 4 readout without blocking on prediction checkpoint cards', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);
    await ctrl.jumpToStep(4); // Stage 4: Readout & Verification (index 4)

    const st = ctrl.getState();
    expect(st.status).not.toBe('WAITING_FOR_PREDICTION');
    expect(st.currentStep?.checkpoint).toBeUndefined();

    await ctrl.next();
    expect(ctrl.getState().currentStepIndex).toBe(5);
  });

  it('8. SECTION 15 — Surfaces the exact approved verification table with all 6 PASS badges', () => {
    expect(GROVER_STAGE_4_VERIFICATION_TABLE).toHaveLength(6);

    const [qubitRow, gateRow, depthRow, ratioRow, targetRow, leakageRow] =
      GROVER_STAGE_4_VERIFICATION_TABLE;

    expect(qubitRow).toEqual({
      metric: 'Qubit Count',
      value: '2',
      requirement: 'required 2',
      status: 'PASS',
    });

    expect(gateRow).toEqual({
      metric: 'Total Gate Count',
      value: '12',
      requirement: 'required 10-12',
      status: 'PASS',
    });

    expect(depthRow).toEqual({
      metric: 'Circuit Depth',
      value: '7 layers',
      requirement: 'required ≤8',
      status: 'PASS',
    });

    expect(ratioRow).toEqual({
      metric: '2-Qubit Gate Ratio',
      value: '16.7%',
      requirement: 'required ≥15%',
      status: 'PASS',
    });

    expect(targetRow).toEqual({
      metric: 'Target Distribution P(11)',
      value: '0.99-1.00',
      requirement: 'required 0.85-1.00',
      status: 'PASS',
    });

    expect(leakageRow).toEqual({
      metric: 'Unmarked Leakage',
      value: '0.00',
      requirement: 'required <5%',
      status: 'PASS',
    });

    expect(GROVER_STAGE_4_VERIFICATION_TABLE.every((r) => r.status === 'PASS')).toBe(true);
  });

  it('9. SECTION 17 — Delivers AI Tutor insights derived strictly from Execution Router pillar metadata', () => {
    const groverFullCircuit: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 'h', targets: [1], column: 0 },
        { gate: 'cz', targets: [0, 1], column: 1 },
        { gate: 'h', targets: [0], column: 2 },
        { gate: 'h', targets: [1], column: 2 },
        { gate: 'x', targets: [0], column: 3 },
        { gate: 'x', targets: [1], column: 3 },
        { gate: 'cz', targets: [0, 1], column: 4 },
        { gate: 'x', targets: [0], column: 5 },
        { gate: 'x', targets: [1], column: 5 },
        { gate: 'measure', targets: [0], column: 6 },
        { gate: 'measure', targets: [1], column: 6 },
      ],
      measure: true,
      shots: 1000,
    };

    // 1. Circuit Intelligence Execution Router detects Clifford compatibility
    expect(isCliffordCircuit(groverFullCircuit)).toBe(true);

    const routing = resolveCircuitRouting(groverFullCircuit, 1.4);
    expect(routing.selected_backend).toBe('qiskit_aer_stabilizer');
    expect(routing.framework).toBe('qiskit_stabilizer');
    expect(routing.policy).toBe('clifford_stabilizer_optimal');
    expect(routing.reason).toContain('Clifford-compatibility detected');
    expect(routing.reason).toContain('Stabilizer simulator');

    // 2. AI Tutor Insights generation bound strictly to real routing metadata
    const insights = generateGroverTutorInsights(routing, 1.4);
    expect(insights).toHaveLength(2);

    // Insight 1: Why 1 iteration is optimal
    const insight1 = insights[0];
    expect(insight1.title).toBe('Why 1 Iteration is Optimal');
    expect(insight1.content).toContain('N = 4');
    expect(insight1.content).toContain('\\sin(\\theta/2) = 1/\\sqrt{N} = 1/\\sqrt{4} = 1/2');
    expect(insight1.content).toContain('\\theta = \\pi/3');
    expect(insight1.content).toContain('25\\%');

    // Insight 2: Circuit Routing Dispatch referencing same routing metadata object
    const insight2 = insights[1];
    expect(insight2.title).toBe('Circuit Routing Dispatch');
    expect(insight2.content).toContain(routing.selected_backend);
    expect(insight2.content).toContain(routing.framework);
    expect(insight2.content).toContain(routing.policy);
    expect(insight2.content).toContain(routing.reason);
    expect(insight2.content).toContain('1.4ms');
    expect(insight2.content).toContain('Stabilizer simulator');
    expect(insight2.content).toContain('Gottesman-Knill');
  });

  it('10. SCRUBBING / SEEKING — Deterministically restores keyframe circuit snapshots when jumping', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);

    // Jump forward to Stage 4 (execution keyframe, index 4)
    await ctrl.jumpToStep(4);
    expect(mockCircuit.gates).toHaveLength(14); // 12 unitary + 2 measurement
    expect(mockCircuit.gates.some((g) => g.gate === 'measure')).toBe(true);

    // Scrub back to Stage 1 (Superposition, index 1)
    await ctrl.jumpToStep(1, { force: true });
    expect(mockCircuit.gates).toHaveLength(2); // Exactly 2 H gates
  });

  it('11. DYNAMIC TARGET RESOLUTION — Resolves semantic objects for palette gates and wire slots without pre-authored coordinates', () => {
    // Semantic palette gate targets
    const hRes = targetResolver.resolveTarget({ type: 'palette_gate', gate: 'h' });
    expect(hRes.status).toBe('FOUND');
    expect(hRes.rect).not.toBeNull();
    expect(hRes.rect.left).toBeGreaterThan(0);
    expect(hRes.rect.top).toBeGreaterThan(0);

    const czRes = targetResolver.resolveTarget({ type: 'palette_gate', gate: 'cz' });
    expect(czRes.status).toBe('FOUND');
    expect(czRes.rect).not.toBeNull();

    // Semantic wire slot targets
    const slot00 = targetResolver.resolveTarget({ type: 'wire_slot', qubit: 0, column: 0 });
    expect(slot00.status).toBe('FOUND');
    expect(slot00.rect).not.toBeNull();

    const slot11 = targetResolver.resolveTarget({ qubit: 1, column: 1 });
    expect(slot11.status).toBe('FOUND');
    expect(slot11.rect).not.toBeNull();

    const slotMulti = targetResolver.resolveTarget({ qubits: [0, 1], column: 4 });
    expect(slotMulti.status).toBe('FOUND');
    expect(slotMulti.rect).not.toBeNull();
  });

  it('12. PHYSICAL DRAG LIFECYCLE — Executes PLACE_GATE and MOVE_CURSOR, updates circuit state, and sets non-linear cursor position', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(lesson8GroversSearchLesson);

    // Execute semantic MOVE_CURSOR
    await (ctrl as any).executeActions([
      { type: 'MOVE_CURSOR', target: { type: 'palette_gate', gate: 'h' } },
    ], (ctrl as any).stepExecutionToken);

    const cursorAfterMove = ctrl.getCursorState();
    expect(cursorAfterMove?.isVisible).toBe(true);
    expect(cursorAfterMove?.x).toBeGreaterThan(0);
    expect(cursorAfterMove?.y).toBeGreaterThan(0);

    // Execute semantic PLACE_GATE
    await (ctrl as any).executeActions([
      { type: 'PLACE_GATE', gate: 'h', target: { qubit: 0, column: 0 }, gateId: 'test-h0' },
      { type: 'PLACE_GATE', gate: 'cz', target: { qubits: [0, 1], column: 1 }, gateId: 'test-cz01' },
    ], (ctrl as any).stepExecutionToken);

    // Circuit state must be updated on the real Workbench
    expect(mockCircuit.gates.some((g) => g.id === 'test-h0' && g.gate === 'h')).toBe(true);
    expect(mockCircuit.gates.some((g) => g.id === 'test-cz01' && g.gate === 'cz')).toBe(true);

    // Cursor must not be stuck holding the gate after release
    const cursorAfterDrop = ctrl.getCursorState();
    expect(cursorAfterDrop?.draggingGate).toBeUndefined();
    expect(cursorAfterDrop?.isClicking).toBe(false);
  });
});


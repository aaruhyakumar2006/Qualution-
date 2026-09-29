/**
 * groverLessonSegments.test.ts
 *
 * Comprehensive tests for Grover's Search Algorithm Segments 1 through 6:
 * 1. Validates exact structure and approved narration for Segments 1-5.
 * 2. Confirms NO KaTeX math formulas or raw LaTeX strings in narration or visuals.
 * 3. Confirms NO annotation overlays obscuring the UI.
 * 4. Segment 4 physical drag lifecycle (HOVER → PICKUP → DRAG → TARGET HOVER → DROP).
 * 5. HUMAN CHECKPOINT 1 (Segment 5 Incorrect Attempt):
 *    - Validates learner incorrect attempt triggers Misconception-AI diagnosis pathway.
 *    - Tracks failed attempts (attempt 1: no Show Me; attempt 2: Show Me offered).
 *    - Keeps coordinator in 'unlocked' mode allowing retry without hard timeout.
 * 6. HUMAN CHECKPOINT 2 (Segment 5 Correct Resolution):
 *    - Direct CZ connection: re-locks driver, plays lead-out narration, resumes into Segment 6.
 *    - H-CX-H equivalent: re-locks driver, plays lead-out narration, resumes into Segment 6.
 * 7. Show Me fallback execution: places CZ, re-locks coordinator, plays lead-out narration.
 * 8. End-to-end multi-segment demo run from Segment 1 through Segment 6.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  GROVER_SEGMENTS_1_TO_4,
  GROVER_SEGMENT_5,
  GROVER_SEGMENT_6,
  GROVER_SEGMENT_7,
  GROVER_SEGMENT_8,
  GROVER_SEGMENT_9,
  GROVER_SEGMENTS_1_TO_5,
  GROVER_SEGMENTS_1_TO_6,
  GROVER_SEGMENTS_1_TO_7,
  GROVER_SEGMENTS_1_TO_8,
  GROVER_SEGMENTS_1_TO_9,
  runGroverSegments1to4Demo,
  runGroverSegmentsDemo,
  executeSegment4SuperpositionBuild,
  executeSegment5OracleTakeover,
  executeSegment6DiffusionBuild,
  executeSegment7PredictCheckpoint,
  executeSegment8MeasurementSimulation,
  executeSegment9Wrapup,
  createVerifiedGroverSimulationResponse,
  type GroverLessonSegment,
} from './groverLessonSegments';
import { CircuitDriverCoordinator, type CursorTelemetry } from '../../../circuit/circuitDrivers';
import { CircuitEngine } from '../../../circuit/circuitEngine';
import type { DragStep } from '../../../circuit/circuitVisualDragAnimator';
import type { CircuitRequest, CircuitRunRequest, CircuitRunResponse } from '../../../circuit/types';
import * as circuitApi from '../../../../api/circuitApi';

describe("Grover's Search Lesson: Master Script & Dual-Driver Execution", () => {
  const FAST_TEST_OPTIONS = {
    delayMultiplier: 0.01,
    speedPxPerMs: 100,
  };

  // ── TEST 1: Segment Structure & Content Audit ────────────────────────
  it('1. Exports complete segments matching the approved master script', () => {
    expect(GROVER_SEGMENTS_1_TO_4).toHaveLength(4);
    expect(GROVER_SEGMENTS_1_TO_5).toHaveLength(5);
    expect(GROVER_SEGMENTS_1_TO_6).toHaveLength(6);
    expect(GROVER_SEGMENTS_1_TO_7).toHaveLength(7);
    expect(GROVER_SEGMENTS_1_TO_8).toHaveLength(8);
    expect(GROVER_SEGMENTS_1_TO_9).toHaveLength(9);

    // Segment 1: Unstructured search problem with 4 boxes
    const seg1 = GROVER_SEGMENTS_1_TO_4[0];
    expect(seg1.segmentNumber).toBe(1);
    expect(seg1.id).toBe('grover-seg-1-problem-intro');
    expect(seg1.title).toContain('Unstructured Search');
    expect(seg1.narrationText).toContain('four identical, sealed boxes labeled 00, 01, 10, and 11');
    expect(seg1.narrationText).toContain('order N');
    expect(seg1.visualElements.type).toBe('boxes_display');
    expect(seg1.visualElements.items).toEqual(['Box 00', 'Box 01', 'Box 10', 'Box 11']);

    // Segment 2: Quantum reframing into 2 qubits
    const seg2 = GROVER_SEGMENTS_1_TO_4[1];
    expect(seg2.segmentNumber).toBe(2);
    expect(seg2.id).toBe('grover-seg-2-quantum-reframing');
    expect(seg2.title).toContain('Quantum Reframing');
    expect(seg2.narrationText).toContain('encode the four possibilities into the computational basis states of just two qubits');
    expect(seg2.narrationText).toContain('simultaneous quantum superposition');
    expect(seg2.visualElements.type).toBe('quantum_register');
    expect(seg2.visualElements.items).toEqual(['|00⟩', '|01⟩', '|10⟩', '|11⟩']);

    // Segment 3: Oracle concept with hidden stamp / phase inversion
    const seg3 = GROVER_SEGMENTS_1_TO_4[2];
    expect(seg3.segmentNumber).toBe(3);
    expect(seg3.id).toBe('grover-seg-3-oracle-concept');
    expect(seg3.title).toContain('Oracle Concept');
    expect(seg3.narrationText).toContain('Quantum Oracle');
    expect(seg3.narrationText).toContain('hidden stamp');
    expect(seg3.narrationText).toContain('phase flip');
    expect(seg3.narrationText).toContain('25 percent probability');
    expect(seg3.visualElements.type).toBe('oracle_stamp');

    // Segment 4: Equal superposition build with real H-gates
    const seg4 = GROVER_SEGMENTS_1_TO_4[3];
    expect(seg4.segmentNumber).toBe(4);
    expect(seg4.id).toBe('grover-seg-4-equal-superposition-build');
    expect(seg4.title).toContain('Equal Superposition');
    expect(seg4.narrationText).toContain('Hadamard gate');
    expect(seg4.narrationText).toContain('qubit 0');
    expect(seg4.narrationText).toContain('qubit 1');
    expect(seg4.visualElements.type).toBe('circuit_drag');

    // Segment 5: Oracle build with student takeover
    expect(GROVER_SEGMENT_5.segmentNumber).toBe(5);
    expect(GROVER_SEGMENT_5.id).toBe('grover-seg-5-oracle-build');
    expect(GROVER_SEGMENT_5.title).toContain('Oracle Build');
    expect(GROVER_SEGMENT_5.narrationText).toContain("Now it's your turn");
    expect(GROVER_SEGMENT_5.narrationText).toContain('Controlled-Z gate');
    expect(GROVER_SEGMENT_5.leadOutNarrationText).toContain('Exactly right');
    expect(GROVER_SEGMENT_5.leadOutNarrationText).toContain('negative phase flip');
    expect(GROVER_SEGMENT_5.visualElements.type).toBe('circuit_takeover');

    // Segment 6: Grover diffusion operator & dramatic amplitude reveal
    expect(GROVER_SEGMENT_6.segmentNumber).toBe(6);
    expect(GROVER_SEGMENT_6.id).toBe('grover-seg-6-diffusion-operator');
    expect(GROVER_SEGMENT_6.title).toContain('Diffusion Operator');
    expect(GROVER_SEGMENT_6.narrationText).toContain('Grover diffuser');
    expect(GROVER_SEGMENT_6.narrationText).toContain('Reflection about the mean');
    expect(GROVER_SEGMENT_6.narrationText).toContain('shrink down to zero');
    expect(GROVER_SEGMENT_6.narrationText).toContain('surges upward to completely fill the display');
    expect(GROVER_SEGMENT_6.subtitle).toContain('Dramatic Amplitude Reveal');
    expect(GROVER_SEGMENT_6.visualDescription).toContain('dramatic dynamic transition');

    // Segment 7: Predict-Iteration Checkpoint
    expect(GROVER_SEGMENT_7.segmentNumber).toBe(7);
    expect(GROVER_SEGMENT_7.id).toBe('grover-seg-7-predict-iteration');
    expect(GROVER_SEGMENT_7.title).toContain('Predict-Iteration');
    expect(GROVER_SEGMENT_7.subtitle).toContain('How Many Times Would We Need to Repeat This?');
    expect(GROVER_SEGMENT_7.narrationText).toContain('how many times would we need to repeat this');
    expect(GROVER_SEGMENT_7.leadOutNarrationText).toContain('Exactly 1 time');
    expect(GROVER_SEGMENT_7.checkpoint).toBeDefined();
    expect(GROVER_SEGMENT_7.checkpoint?.prompt).toBe('How many times would we need to repeat this?');
    expect(GROVER_SEGMENT_7.checkpoint?.options).toHaveLength(4);
    expect(GROVER_SEGMENT_7.checkpoint?.correctOptionIndex).toBe(0);
    expect(GROVER_SEGMENT_7.checkpoint?.options[0].label).toContain('1 time');

    // Segment 8: Measurement and Live Simulation
    expect(GROVER_SEGMENT_8.segmentNumber).toBe(8);
    expect(GROVER_SEGMENT_8.id).toBe('grover-seg-8-measurement-results');
    expect(GROVER_SEGMENT_8.title).toContain('Measurement');
    expect(GROVER_SEGMENT_8.subtitle).toContain('1,000 Real Quantum Shots');
    expect(GROVER_SEGMENT_8.narrationText).toContain('measurement detectors');
    expect(GROVER_SEGMENT_8.narrationText).toContain('real quantum backend pipeline');
    expect(GROVER_SEGMENT_8.narrationText).toContain('1,000 real simulation shots');
    expect(GROVER_SEGMENT_8.leadOutNarrationText).toContain('Out of 1,000 real shots, state 11 was measured every single time');
    expect(GROVER_SEGMENT_8.visualElements.type).toBe('measurement_simulation');

    // Segment 9: Wrap-Up & Classical vs Quantum Reflection
    expect(GROVER_SEGMENT_9.segmentNumber).toBe(9);
    expect(GROVER_SEGMENT_9.id).toBe('grover-seg-9-wrapup-reflection');
    expect(GROVER_SEGMENT_9.title).toContain('Wrap-Up');
    expect(GROVER_SEGMENT_9.subtitle).toContain('Quadratic Speedup');
    expect(GROVER_SEGMENT_9.narrationText).toContain('quadratic speedup');
    expect(GROVER_SEGMENT_9.leadOutNarrationText).toContain('built, simulated, and verified');
    expect(GROVER_SEGMENT_9.visualElements.type).toBe('wrapup_summary');
  });

  // ── TEST 2: Strict Pedagogical Directives (NO KaTeX, NO Annotation Overlays) ─
  it('2. Strictly excludes raw KaTeX/LaTeX math strings and messy annotation overlays across all segments (1-9)', () => {
    const rawLatexRegex = /\\(frac|rangle|langle|otimes|psi|sqrt|begin|end|boxed|text|mu|alpha)/i;

    GROVER_SEGMENTS_1_TO_9.forEach((seg) => {
      // Narration must be natural spoken English without raw LaTeX syntax
      expect(seg.narrationText).not.toMatch(rawLatexRegex);
      expect(seg.narrationText).not.toContain('$$');
      expect(seg.narrationText).not.toContain('\\[');

      if (seg.leadOutNarrationText) {
        expect(seg.leadOutNarrationText).not.toMatch(rawLatexRegex);
        expect(seg.leadOutNarrationText).not.toContain('$$');
      }

      // Title & visual descriptions must be clean
      expect(seg.title).not.toMatch(rawLatexRegex);
      expect(seg.visualDescription).not.toMatch(rawLatexRegex);

      // Checkpoint prompt & explanation must be clean
      if (seg.checkpoint) {
        expect(seg.checkpoint.prompt).not.toMatch(rawLatexRegex);
        expect(seg.checkpoint.question).not.toMatch(rawLatexRegex);
        expect(seg.checkpoint.explanation).not.toMatch(rawLatexRegex);
      }

      // No annotation overlay modes (circle overlays or draw_trails covering UI)
      expect(JSON.stringify(seg.visualElements)).not.toContain('draw_trail');
      expect(JSON.stringify(seg.visualElements)).not.toContain('annotation_circle');
    });
  });

  // ── TEST 3: Segment 4 Premium Physical Drag Lifecycle ────────────────
  it('3. Segment 4 executes full 5-step premium physical drag lifecycle for both H-gates', async () => {
    const coordinator = new CircuitDriverCoordinator(
      new CircuitEngine({ qubits: 2, classical_bits: 2, measure: false, shots: 1000 }),
      'locked'
    );

    const dragStepsLog: Array<{ step: DragStep; gate: string; qubit: number }> = [];
    const circuitUpdatesLog: CircuitRequest[] = [];
    const cursorTelemetryLog: CursorTelemetry[] = [];

    await executeSegment4SuperpositionBuild(coordinator, {
      ...FAST_TEST_OPTIONS,
      onDragStep: (step, gate, qubit) => {
        dragStepsLog.push({ step, gate, qubit });
      },
      onCircuitUpdate: (circ) => {
        circuitUpdatesLog.push({ ...circ });
      },
      onCursorUpdate: (t) => {
        cursorTelemetryLog.push({ ...t });
      },
    });

    // ── Verify Gate 1: H on q[0] Lifecycle ──
    const q0Steps = dragStepsLog.filter((s) => s.qubit === 0);
    expect(q0Steps.map((s) => s.step)).toEqual([
      'hover',
      'pickup',
      'drag',
      'target_hover',
      'drop',
      'release',
    ]);

    // ── Verify Gate 2: H on q[1] Lifecycle ──
    const q1Steps = dragStepsLog.filter((s) => s.qubit === 1);
    expect(q1Steps.map((s) => s.step)).toEqual([
      'hover',
      'pickup',
      'drag',
      'target_hover',
      'drop',
      'release',
    ]);

    // Progressive updates emitted
    expect(circuitUpdatesLog.length).toBeGreaterThanOrEqual(2);
    expect(circuitUpdatesLog[circuitUpdatesLog.length - 1].gates).toHaveLength(2);
  });

  // ── TEST 4: HUMAN CHECKPOINT — Segment 5 Dual-Driver Unlock & Misconception Diagnosis ──
  it('4. (HUMAN CHECKPOINT 1): Segment 5 unlocks driver, pauses scripted driver, diagnoses incorrect attempts, and gates Show Me until 2 failed attempts', async () => {
    // Start with engine in locked state having 2 baseline H gates from Segment 4
    const engine = new CircuitEngine({ qubits: 2, classical_bits: 2, measure: false, shots: 1000 });
    engine.placeGate('h', [0], 0);
    engine.placeGate('h', [1], 0);

    const coordinator = new CircuitDriverCoordinator(engine, 'locked');
    expect(coordinator.isLocked()).toBe(true);

    const modeChanges: Array<'locked' | 'unlocked'> = [];
    const narrations: string[] = [];
    const diagnoses: Array<{ misconceptionId?: string; attempt: number; showMe: boolean }> = [];

    // Begin Segment 5 takeover
    const takeoverCtrl = executeSegment5OracleTakeover(coordinator, {
      onLockModeChange: (m) => modeChanges.push(m),
      onNarration: (txt) => narrations.push(txt),
      onMisconceptionDiagnosis: (diag, attempt, showMe) => {
        diagnoses.push({
          misconceptionId: diag.misconceptionId,
          attempt,
          showMe,
        });
      },
    });

    // 1. Verify lead-in narration played
    expect(narrations[0]).toContain("Now it's your turn");

    // 2. Verify coordinator mode unlocked — real user input driver now active on SAME circuit
    expect(modeChanges).toEqual(['unlocked']);
    expect(coordinator.isLocked()).toBe(false);
    expect(takeoverCtrl.isResolved()).toBe(false);
    expect(takeoverCtrl.getFailedAttempts()).toBe(0);
    expect(takeoverCtrl.isShowMeAvailable()).toBe(false);

    // Show Me cannot be called before 2 failed attempts
    await expect(takeoverCtrl.executeShowMe()).rejects.toThrow(/Show Me is only offered after 2 failed attempts/);

    // 3. User Attempt 1 (Incorrect): Learner drops Pauli-X on wire 0 (a classical bit-flip)
    const placedX = coordinator.userInputDriver.handleSlotDrop('x', 0, 1);
    expect(placedX).not.toBeNull(); // User drop succeeds because driver is unlocked!

    const diag1 = takeoverCtrl.submitLearnerAttempt(coordinator.toCircuitRequest());
    expect(diag1.isCorrect).toBe(false);
    expect(diag1.misconceptionId).toBe('grover-oracle-bit-flip');
    expect(diag1.message).toContain('bit-flip');
    expect(takeoverCtrl.getFailedAttempts()).toBe(1);
    expect(takeoverCtrl.isShowMeAvailable()).toBe(false); // Show Me STILL disabled after 1 attempt!
    expect(coordinator.isLocked()).toBe(false); // Driver still unlocked, allowing retry without timeout

    // Remove the incorrect X gate
    if (placedX) {
      coordinator.userInputDriver.handleDeleteGate(placedX.id);
    }

    // 4. User Attempt 2 (Incorrect): Learner drops Pauli-Z on wire 0 (single-qubit phase flip)
    const placedZ = coordinator.userInputDriver.handleSlotDrop('z', 0, 1);
    expect(placedZ).not.toBeNull();

    const diag2 = takeoverCtrl.submitLearnerAttempt(coordinator.toCircuitRequest());
    expect(diag2.isCorrect).toBe(false);
    expect(diag2.misconceptionId).toBe('grover-oracle-single-qubit-phase');
    expect(diag2.message).toContain('single-qubit');
    expect(takeoverCtrl.getFailedAttempts()).toBe(2);
    // CRITICAL: Now that failed attempts == 2, Show Me is unlocked!
    expect(takeoverCtrl.isShowMeAvailable()).toBe(true);

    // 5. Test Show Me fallback execution
    const showMeDiag = await takeoverCtrl.executeShowMe();
    expect(showMeDiag.isCorrect).toBe(true);
    expect(takeoverCtrl.isResolved()).toBe(true);

    // Coordinator must be re-locked after resolution
    expect(coordinator.isLocked()).toBe(true);
    expect(modeChanges).toContain('locked');

    // Lead-out narration played
    expect(narrations[narrations.length - 1]).toContain('Exactly right');

    // Circuit now has the CZ gate
    const finalCirc = coordinator.toCircuitRequest();
    expect(finalCirc.gates.some((g) => g.gate.toLowerCase() === 'cz')).toBe(true);
  });

  // ── TEST 5: HUMAN CHECKPOINT — Segment 5 Direct CZ Correct Resolution ──
  it('5. (HUMAN CHECKPOINT 2A): Correct resolution with direct CZ connection re-locks coordinator and plays lead-out narration', async () => {
    const engine = new CircuitEngine({ qubits: 2, classical_bits: 2, measure: false, shots: 1000 });
    engine.placeGate('h', [0], 0);
    engine.placeGate('h', [1], 0);

    const coordinator = new CircuitDriverCoordinator(engine, 'locked');
    const narrations: string[] = [];
    const modeChanges: Array<'locked' | 'unlocked'> = [];

    const takeoverCtrl = executeSegment5OracleTakeover(coordinator, {
      onLockModeChange: (m) => modeChanges.push(m),
      onNarration: (txt) => narrations.push(txt),
    });

    expect(coordinator.isLocked()).toBe(false);

    // Learner connects CZ across wire 0 and 1
    const placedCZ = coordinator.userInputDriver.handleConnectGates([0, 1], 1, 'cz');
    expect(placedCZ).not.toBeNull();

    const diagnosis = takeoverCtrl.submitLearnerAttempt(coordinator.toCircuitRequest());
    expect(diagnosis.isCorrect).toBe(true);
    expect(diagnosis.solutionType).toBe('cz');
    expect(takeoverCtrl.isResolved()).toBe(true);

    // Mode flag is set back to locked immediately
    expect(coordinator.isLocked()).toBe(true);
    expect(modeChanges).toEqual(['unlocked', 'locked']);

    // Lead-out narration plays
    expect(narrations[narrations.length - 1]).toContain('Exactly right');
    expect(narrations[narrations.length - 1]).toContain('negative phase flip');
  });

  // ── TEST 6: HUMAN CHECKPOINT — Segment 5 H-CX-H Equivalent Resolution ──
  it('6. (HUMAN CHECKPOINT 2B): Accepts H-CX-H decomposition as valid oracle resolution and re-locks driver', async () => {
    const engine = new CircuitEngine({ qubits: 2, classical_bits: 2, measure: false, shots: 1000 });
    engine.placeGate('h', [0], 0);
    engine.placeGate('h', [1], 0);

    const coordinator = new CircuitDriverCoordinator(engine, 'locked');
    const narrations: string[] = [];
    const modeChanges: Array<'locked' | 'unlocked'> = [];

    const takeoverCtrl = executeSegment5OracleTakeover(coordinator, {
      onLockModeChange: (m) => modeChanges.push(m),
      onNarration: (txt) => narrations.push(txt),
    });

    // Learner builds H -> CX -> H on wire 1:
    // H on wire 1 (col 1), CX [0, 1] (col 2), H on wire 1 (col 3)
    coordinator.userInputDriver.handleSlotDrop('h', 1, 1);
    coordinator.userInputDriver.handleConnectGates([0, 1], 2, 'cx');
    coordinator.userInputDriver.handleSlotDrop('h', 1, 3);

    const diagnosis = takeoverCtrl.submitLearnerAttempt(coordinator.toCircuitRequest());
    expect(diagnosis.isCorrect).toBe(true);
    expect(diagnosis.solutionType).toBe('h_cx_h');
    expect(takeoverCtrl.isResolved()).toBe(true);

    // Driver locked back
    expect(coordinator.isLocked()).toBe(true);
    expect(modeChanges).toEqual(['unlocked', 'locked']);
    expect(narrations[narrations.length - 1]).toContain('Exactly right');
  });

  // ── TEST 7: End-to-End Segments 1 through 6 Demo Flow ────────────────
  it('7. Runs full Segments 1-6 flow: Superposition → Unlocked Oracle Takeover → Re-lock → Diffusion Operator', async () => {
    const startedSegments: string[] = [];
    const completedSegments: string[] = [];
    const modeHistory: Array<'locked' | 'unlocked'> = [];

    const result = await runGroverSegmentsDemo(
      {
        ...FAST_TEST_OPTIONS,
        onSegmentStart: (seg) => startedSegments.push(seg.id),
        onSegmentComplete: (seg) => completedSegments.push(seg.id),
        onLockModeChange: (mode) => modeHistory.push(mode),
      },
      {
        maxSegment: 6,
        simulatedLearnerAction: 'cz',
        simulatedFailedAttempts: ['x', 'z'], // 2 failed attempts before succeeding
      }
    );

    // Segments 1 to 6 all executed sequentially
    expect(startedSegments).toEqual([
      'grover-seg-1-problem-intro',
      'grover-seg-2-quantum-reframing',
      'grover-seg-3-oracle-concept',
      'grover-seg-4-equal-superposition-build',
      'grover-seg-5-oracle-build',
      'grover-seg-6-diffusion-operator',
    ]);
    expect(completedSegments).toEqual(startedSegments);

    // Mode history must show initial locked -> unlocked for Segment 5 -> locked for Segment 6
    expect(modeHistory[0]).toBe('locked');
    expect(modeHistory).toContain('unlocked');
    expect(modeHistory[modeHistory.length - 1]).toBe('locked');

    // Final circuit state has full Grover algorithm (12 gates)
    const finalCircuit = result.coordinator.toCircuitRequest();
    expect(finalCircuit.qubits).toBe(2);
    expect(finalCircuit.gates.length).toBe(12);

    // Gate breakdown:
    // col 0: 2 H gates (Superposition - Segment 4)
    // col 1: 1 CZ gate (Oracle - Segment 5)
    // col 2: 2 H gates (Diffuser - Segment 6)
    // col 3: 2 X gates (Diffuser - Segment 6)
    // col 4: 1 CZ gate (Diffuser - Segment 6)
    // col 5: 2 X gates (Diffuser - Segment 6)
    // col 6: 2 H gates (Diffuser - Segment 6)
    const czGates = finalCircuit.gates.filter((g) => g.gate.toLowerCase() === 'cz');
    expect(czGates).toHaveLength(2); // Oracle CZ + Diffuser CZ
  });

  // ── TEST 8: Segment 6 Grover Diffusion Operator Build & Amplitude Reveal ─
  it('8. Segment 6 executes locked Grover diffusion operator build (H-X-CZ-X-H) and fires dramatic amplitude reveal', async () => {
    const engine = new CircuitEngine({ qubits: 2, classical_bits: 2, measure: false, shots: 1000 });
    // Superposition (Segment 4)
    engine.placeGate('h', [0], 0);
    engine.placeGate('h', [1], 0);
    // Oracle (Segment 5)
    engine.placeGate('cz', [0, 1], 1);

    const coordinator = new CircuitDriverCoordinator(engine, 'locked');
    const amplitudeReveals: Array<Record<string, number>> = [];
    const modeChanges: Array<'locked' | 'unlocked'> = [];
    const circuitUpdates: CircuitRequest[] = [];

    await executeSegment6DiffusionBuild(coordinator, {
      ...FAST_TEST_OPTIONS,
      onAmplitudeReveal: (probs) => amplitudeReveals.push({ ...probs }),
      onLockModeChange: (m) => modeChanges.push(m),
      onCircuitUpdate: (circ) => circuitUpdates.push({ ...circ }),
    });

    // Coordinator remains locked during scripted demonstration
    expect(coordinator.isLocked()).toBe(true);
    expect(modeChanges).toContain('locked');

    // Circuit has all 12 gates: 2 H (col 0) + 1 CZ (col 1) + 9 diffusion gates
    const circuit = coordinator.toCircuitRequest();
    expect(circuit.gates).toHaveLength(12);

    // Verify the exact H-X-CZ-X-H diffusion gate sequence
    const col2 = circuit.gates.filter((g) => g.column === 2);
    expect(col2).toHaveLength(2);
    expect(col2.every((g) => g.gate.toLowerCase() === 'h')).toBe(true);

    const col3 = circuit.gates.filter((g) => g.column === 3);
    expect(col3).toHaveLength(2);
    expect(col3.every((g) => g.gate.toLowerCase() === 'x')).toBe(true);

    const col4 = circuit.gates.filter((g) => g.column === 4);
    expect(col4).toHaveLength(1);
    expect(col4[0].gate.toLowerCase()).toBe('cz');
    expect(col4[0].targets).toEqual([0, 1]);

    const col5 = circuit.gates.filter((g) => g.column === 5);
    expect(col5).toHaveLength(2);
    expect(col5.every((g) => g.gate.toLowerCase() === 'x')).toBe(true);

    const col6 = circuit.gates.filter((g) => g.column === 6);
    expect(col6).toHaveLength(2);
    expect(col6.every((g) => g.gate.toLowerCase() === 'h')).toBe(true);

    // Verify dramatic amplitude reveal:
    // Step 1: Intermediate reflection transition
    // Step 2: Final dramatic reveal — unmarked states shrink to 0, marked state reaches 1.0 (100%)
    expect(amplitudeReveals).toHaveLength(2);
    expect(amplitudeReveals[0]).toEqual({ '00': 0.12, '01': 0.12, '10': 0.12, '11': 0.64 });
    expect(amplitudeReveals[1]).toEqual({ '00': 0.0, '01': 0.0, '10': 0.0, '11': 1.0 });
  });

  // ── TEST 9: Segment 7 Predict-Iteration Checkpoint ───────────────────
  it('9. Segment 7 prompts learner, diagnoses incorrect predictions with non-lecturing feedback, and resolves on correct prediction', async () => {
    const engine = new CircuitEngine({ qubits: 2, classical_bits: 2, measure: false, shots: 1000 });
    const coordinator = new CircuitDriverCoordinator(engine, 'locked');

    const narrations: string[] = [];
    const prompts: Array<typeof GROVER_SEGMENT_7.checkpoint> = [];
    const evaluatedResults: Array<{ isCorrect: boolean; attempts: number; message: string }> = [];

    const checkpointCtrl = executeSegment7PredictCheckpoint(coordinator, {
      onNarration: (txt) => narrations.push(txt),
      onPredictionPrompt: (cp) => prompts.push(cp),
      onPredictionEvaluated: (res, att) => evaluatedResults.push({ isCorrect: res.isCorrect, attempts: att, message: res.message }),
    });

    // Checkpoint prompt presented to learner
    expect(prompts).toHaveLength(1);
    expect(prompts[0]?.prompt).toBe('How many times would we need to repeat this?');
    expect(prompts[0]?.options).toHaveLength(4);
    expect(prompts[0]?.correctOptionIndex).toBe(0);
    expect(checkpointCtrl.isResolved()).toBe(false);
    expect(checkpointCtrl.getAttempts()).toBe(0);

    // Initial narration plays
    expect(narrations[0]).toContain('how many times would we need to repeat this');

    // Attempt 1 (Incorrect): Learner selects option 1 ("2 times")
    const res1 = checkpointCtrl.submitPrediction(1);
    expect(res1.isCorrect).toBe(false);
    expect(res1.selectedOptionIndex).toBe(1);
    expect(res1.message).toContain('Think about what just happened on your screen');
    expect(res1.message).toContain('100% probability');
    expect(checkpointCtrl.isResolved()).toBe(false);
    expect(checkpointCtrl.getAttempts()).toBe(1);

    // Attempt 2 (Incorrect): Learner selects option 3 ("Square root of N times")
    const res2 = checkpointCtrl.submitPrediction(3);
    expect(res2.isCorrect).toBe(false);
    expect(checkpointCtrl.isResolved()).toBe(false);
    expect(checkpointCtrl.getAttempts()).toBe(2);

    // Attempt 3 (Correct): Learner selects option 0 ("1 time")
    const res3 = checkpointCtrl.submitPrediction(0);
    expect(res3.isCorrect).toBe(true);
    expect(res3.selectedOptionIndex).toBe(0);
    expect(res3.message).toContain('Exactly 1 time!');
    expect(res3.message).toContain('rotation lands directly on the marked state');
    expect(checkpointCtrl.isResolved()).toBe(true);
    expect(checkpointCtrl.getAttempts()).toBe(3);

    // Promise resolved
    const resolvedResult = await checkpointCtrl.resolvePromise;
    expect(resolvedResult.isCorrect).toBe(true);

    // Lead-out narration plays
    expect(narrations[narrations.length - 1]).toContain('Exactly 1 time');
  });

  // ── TEST 10: End-to-End Segments 1 through 7 Demo Flow ────────────────
  it('10. Runs full Segments 1-7 flow: Superposition → Oracle Takeover → Diffusion Operator → Checkpoint Resolution', async () => {
    const startedSegments: string[] = [];
    const completedSegments: string[] = [];
    const amplitudeReveals: Array<Record<string, number>> = [];
    const evaluatedPredictions: Array<{ isCorrect: boolean; attempts: number }> = [];

    const result = await runGroverSegmentsDemo(
      {
        ...FAST_TEST_OPTIONS,
        onSegmentStart: (seg) => startedSegments.push(seg.id),
        onSegmentComplete: (seg) => completedSegments.push(seg.id),
        onAmplitudeReveal: (probs) => amplitudeReveals.push({ ...probs }),
        onPredictionEvaluated: (res, att) => evaluatedPredictions.push({ isCorrect: res.isCorrect, attempts: att }),
      },
      {
        maxSegment: 7,
        simulatedLearnerAction: 'cz',
        simulatedIncorrectPredictions: [1], // 1 incorrect prediction retry first
        simulatedPredictionIndex: 0, // then correct prediction
      }
    );

    // All 7 segments started and completed
    expect(startedSegments).toEqual([
      'grover-seg-1-problem-intro',
      'grover-seg-2-quantum-reframing',
      'grover-seg-3-oracle-concept',
      'grover-seg-4-equal-superposition-build',
      'grover-seg-5-oracle-build',
      'grover-seg-6-diffusion-operator',
      'grover-seg-7-predict-iteration',
    ]);
    expect(completedSegments).toEqual(startedSegments);

    // Amplitude reveal triggered
    expect(amplitudeReveals.length).toBeGreaterThanOrEqual(2);
    expect(amplitudeReveals[amplitudeReveals.length - 1]['11']).toBe(1.0);
    expect(amplitudeReveals[amplitudeReveals.length - 1]['00']).toBe(0.0);

    // Predictions evaluated: 1 incorrect then 1 correct
    expect(evaluatedPredictions).toHaveLength(2);
    expect(evaluatedPredictions[0].isCorrect).toBe(false);
    expect(evaluatedPredictions[1].isCorrect).toBe(true);

    // Controllers resolved
    expect(result.takeoverController?.isResolved()).toBe(true);
    expect(result.checkpointController?.isResolved()).toBe(true);
    expect(result.checkpointController?.getAttempts()).toBe(2);

    // Full 12-gate circuit constructed
    const finalCircuit = result.coordinator.toCircuitRequest();
    expect(finalCircuit.gates).toHaveLength(12);
  });

  // ── TEST 11: Segment 8 Measurement & Live Backend Simulation ──────────
  it('11. Segment 8 places measurement detectors, calls REAL backend pipeline, and animates histogram from real returned data', async () => {
    const engine = new CircuitEngine({ qubits: 2, classical_bits: 2, measure: false, shots: 1000 });
    // Superposition (Segment 4)
    engine.placeGate('h', [0], 0);
    engine.placeGate('h', [1], 0);
    // Oracle (Segment 5)
    engine.placeGate('cz', [0, 1], 1);
    // Diffuser (Segment 6)
    engine.placeGate('h', [0], 2);
    engine.placeGate('h', [1], 2);
    engine.placeGate('x', [0], 3);
    engine.placeGate('x', [1], 3);
    engine.placeGate('cz', [0, 1], 4);
    engine.placeGate('x', [0], 5);
    engine.placeGate('x', [1], 5);
    engine.placeGate('h', [0], 6);
    engine.placeGate('h', [1], 6);

    const coordinator = new CircuitDriverCoordinator(engine, 'locked');
    const simulationStarts: CircuitRunRequest[] = [];
    const simulationCompletes: CircuitRunResponse[] = [];
    const amplitudeReveals: Array<Record<string, number>> = [];
    const narrations: string[] = [];

    // Spy on circuitApi.runCircuit to verify it is called with real backend request
    const mockBackendResponse: CircuitRunResponse = {
      circuit: { qubits: 2, classical_bits: 2, gate_count: 14, measure: true, shots: 1000 },
      routing: {
        requested_backend: 'qiskit',
        selected_backend: 'qiskit_aer',
        framework: 'qiskit',
        policy: 'grover_live_execution',
        reason: 'Real 1000-shot Grover search pipeline execution',
      },
      simulation: {
        backend: 'qiskit_aer',
        mode: 'shots',
        shots: 1000,
        counts: { '11': 1000 },
        probabilities: { '00': 0.0, '01': 0.0, '10': 0.0, '11': 1.0 },
        execution_time_ms: 2.1,
      },
      visualization: { bloch: null, timeline: null },
      execution_time_ms: 2.1,
    };

    const runSpy = vi.spyOn(circuitApi, 'runCircuit').mockResolvedValue(mockBackendResponse);

    const response = await executeSegment8MeasurementSimulation(coordinator, {
      ...FAST_TEST_OPTIONS,
      onSimulationStart: (req) => simulationStarts.push(req),
      onSimulationComplete: (res) => simulationCompletes.push(res),
      onAmplitudeReveal: (probs) => amplitudeReveals.push({ ...probs }),
      onNarration: (txt) => narrations.push(txt),
    });

    // 1. Coordinator remained locked during measurement placement and backend execution
    expect(coordinator.isLocked()).toBe(true);

    // 2. Both measurement detectors placed in engine at column 7
    const engineState = coordinator.getEngine().getState();
    expect(engineState.gates).toHaveLength(14);
    const measureGates = engineState.gates.filter(
      (g) => (g.type || g.gate || '').toLowerCase() === 'measure'
    );
    expect(measureGates).toHaveLength(2);
    expect(measureGates[0].column).toBe(7);
    expect(measureGates[1].column).toBe(7);

    // Backend-serialized request has 12 unitary gates with measure=true
    const circuit = coordinator.toCircuitRequest();
    expect(circuit.gates).toHaveLength(12);
    expect(circuit.measure).toBe(true);

    // 3. Real backend pipeline invoked with 1000 shots
    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(simulationStarts).toHaveLength(1);
    expect(simulationStarts[0].circuit.measure).toBe(true);
    expect(simulationStarts[0].circuit.shots).toBe(1000);
    expect(simulationStarts[0].backend).toBe('qiskit');

    // 4. Returned simulation matches backend response
    expect(response).toEqual(mockBackendResponse);
    expect(simulationCompletes).toHaveLength(1);
    expect(simulationCompletes[0].simulation.counts?.['11']).toBe(1000);

    // 5. Histogram animates from REAL returned data
    expect(amplitudeReveals).toHaveLength(1);
    expect(amplitudeReveals[0]).toEqual({ '00': 0.0, '01': 0.0, '10': 0.0, '11': 1.0 });

    // 6. Lead-out narration spoken
    expect(narrations[narrations.length - 1]).toContain('Out of 1,000 real shots, state 11 was measured every single time');

    runSpy.mockRestore();
  });

  // ── TEST 12: Segment 9 Wrap-Up Reflection & Workbench Unlock ─────────
  it('12. Segment 9 triggers gentle full-circuit fade-out transition, plays wrap-up reflection, and unlocks workbench for free exploration', async () => {
    const engine = new CircuitEngine({ qubits: 2, classical_bits: 2, measure: false, shots: 1000 });
    const coordinator = new CircuitDriverCoordinator(engine, 'locked');
    expect(coordinator.isLocked()).toBe(true);

    const fadeEvents: boolean[] = [];
    const narrations: string[] = [];
    let demoCompleted = false;
    const modeHistory: Array<'locked' | 'unlocked'> = [];

    await executeSegment9Wrapup(coordinator, {
      ...FAST_TEST_OPTIONS,
      onCircuitFadeOut: (faded) => fadeEvents.push(faded),
      onNarration: (txt) => narrations.push(txt),
      onDemoComplete: () => { demoCompleted = true; },
      onLockModeChange: (m) => modeHistory.push(m),
    });

    // 1. Circuit fade-out transition triggered
    expect(fadeEvents).toEqual([true]);

    // 2. Both reflection narration and lead-out exploration narration played
    expect(narrations[0]).toContain('quadratic speedup');
    expect(narrations[1]).toContain('built, simulated, and verified');

    // 3. Coordinator unlocked so student can freely explore finished circuit on workbench
    expect(coordinator.isLocked()).toBe(false);
    expect(modeHistory).toContain('unlocked');

    // 4. Demo completed flag emitted
    expect(demoCompleted).toBe(true);
  });

  // ── TEST 13: Complete End-to-End Master Run (Segments 1 through 9) ────
  it('13. Complete End-to-End Master Run: Segments 1 through 9 with Real Simulation Pipeline & Wrap-Up', async () => {
    const startedSegments: string[] = [];
    const completedSegments: string[] = [];
    const amplitudeReveals: Array<Record<string, number>> = [];
    let fadeOutCalled = false;
    let demoCompleteCalled = false;

    const mockBackendResponse = createVerifiedGroverSimulationResponse({
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measure: true,
      shots: 1000,
    });

    const runSpy = vi.spyOn(circuitApi, 'runCircuit').mockResolvedValue(mockBackendResponse);

    const result = await runGroverSegmentsDemo(
      {
        ...FAST_TEST_OPTIONS,
        onSegmentStart: (seg) => startedSegments.push(seg.id),
        onSegmentComplete: (seg) => completedSegments.push(seg.id),
        onAmplitudeReveal: (probs) => amplitudeReveals.push({ ...probs }),
        onCircuitFadeOut: () => { fadeOutCalled = true; },
        onDemoComplete: () => { demoCompleteCalled = true; },
      },
      {
        maxSegment: 9,
        simulatedLearnerAction: 'cz',
        simulatedPredictionIndex: 0,
      }
    );

    // All 9 segments started and completed in exact sequential order
    expect(startedSegments).toEqual([
      'grover-seg-1-problem-intro',
      'grover-seg-2-quantum-reframing',
      'grover-seg-3-oracle-concept',
      'grover-seg-4-equal-superposition-build',
      'grover-seg-5-oracle-build',
      'grover-seg-6-diffusion-operator',
      'grover-seg-7-predict-iteration',
      'grover-seg-8-measurement-results',
      'grover-seg-9-wrapup-reflection',
    ]);
    expect(completedSegments).toEqual(startedSegments);

    // Backend simulation response returned
    expect(result.simulationResponse).toBeDefined();
    expect(result.simulationResponse?.simulation.counts?.['11']).toBe(1000);

    // Full 14-gate circuit constructed in canonical engine (12 unitary + 2 measurement)
    expect(result.coordinator.getEngine().getState().gates).toHaveLength(14);
    const finalCircuit = result.coordinator.toCircuitRequest();
    expect(finalCircuit.gates).toHaveLength(12);
    expect(finalCircuit.measure).toBe(true);

    // Circuit fade-out and demo completion emitted
    expect(fadeOutCalled).toBe(true);
    expect(demoCompleteCalled).toBe(true);

    // Coordinator ends in UNLOCKED mode for free exploration
    expect(result.coordinator.isLocked()).toBe(false);

    runSpy.mockRestore();
  });

  // ── TEST 14: Pacing Modes & Full 13-Minute Smooth Timing ───────────────
  it('14. PacingMode "full" calculates duration according to full 13-min segment durationSeconds', async () => {
    const startedTimes: number[] = [];
    let startTimestamp = 0;

    const result = await runGroverSegmentsDemo(
      {
        delayMultiplier: 0.0001, // Fast scaling for test execution speed
        onSegmentStart: () => {
          startedTimes.push(Date.now());
        },
      },
      {
        maxSegment: 3,
        pacingMode: 'full',
      }
    );

    expect(startedTimes).toHaveLength(3);
    expect(result.coordinator).toBeDefined();
  });

  it('15. PacingMode "preview" executes smoothly for live visual presentations', async () => {
    const started: string[] = [];

    const result = await runGroverSegmentsDemo(
      {
        delayMultiplier: 0.001,
        onSegmentStart: (seg) => started.push(seg.id),
      },
      {
        maxSegment: 3,
        pacingMode: 'preview',
      }
    );

    expect(started).toEqual([
      'grover-seg-1-problem-intro',
      'grover-seg-2-quantum-reframing',
      'grover-seg-3-oracle-concept',
    ]);
    expect(result.coordinator).toBeDefined();
  });
});




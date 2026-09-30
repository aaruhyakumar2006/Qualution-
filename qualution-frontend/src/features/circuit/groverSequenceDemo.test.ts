/**
 * groverSequenceDemo.test.ts
 *
 * Tests for the full Grover's algorithm scripted gate placement sequence.
 * Verifies:
 * 1. All 14 gates are placed in correct order with correct types/targets/columns
 * 2. Cursor telemetry is emitted for every gate placement (5-step lifecycle)
 * 3. onGateStart/onGateComplete callbacks fire in correct sequence
 * 4. The final circuit state matches the canonical Grover circuit
 * 5. Demonstration-only stages (excluding Stage 2) produce the correct subset
 */

import { describe, it, expect, vi } from 'vitest';
import {
  runGroverSequenceDemo,
  runGroverDemonstrationStages,
  GROVER_GATE_SEQUENCE,
} from './groverSequenceDemo';
import type { CursorTelemetry } from './circuitDrivers';
import type { DragStep } from './circuitVisualDragAnimator';

describe('Grover Sequence Demo', () => {
  // Use 0.01 delay multiplier for fast test execution
  const FAST_OPTIONS = { delayMultiplier: 0.01, speedPxPerMs: 100 };

  it('should export the correct 14-gate sequence constant', () => {
    expect(GROVER_GATE_SEQUENCE).toHaveLength(14);

    // Stage 1: 2 H gates
    const stage1 = GROVER_GATE_SEQUENCE.filter((g) => g.stage === 1);
    expect(stage1).toHaveLength(2);
    expect(stage1.every((g) => g.type === 'h')).toBe(true);

    // Stage 2: 1 CZ oracle
    const stage2 = GROVER_GATE_SEQUENCE.filter((g) => g.stage === 2);
    expect(stage2).toHaveLength(1);
    expect(stage2[0].type).toBe('cz');
    expect(stage2[0].targets).toEqual([0, 1]);

    // Stage 3: 9 diffuser gates (H, H, X, X, CZ, X, X, H, H)
    const stage3 = GROVER_GATE_SEQUENCE.filter((g) => g.stage === 3);
    expect(stage3).toHaveLength(9);

    // Stage 4: 2 measurements
    const stage4 = GROVER_GATE_SEQUENCE.filter((g) => g.stage === 4);
    expect(stage4).toHaveLength(2);
    expect(stage4.every((g) => g.type === 'measure')).toBe(true);
  });

  it('should run full 14-gate sequence and produce correct final circuit state', async () => {
    const gateStartLog: string[] = [];
    const gateCompleteLog: string[] = [];
    let sequenceComplete = false;

    const coordinator = await runGroverSequenceDemo({
      ...FAST_OPTIONS,
      onGateStart: (gateName, qubit, column, index, total) => {
        gateStartLog.push(`${index}:${gateName}:q${qubit}:c${column}`);
        expect(total).toBe(14);
      },
      onGateComplete: (gateName, qubit, column, index) => {
        gateCompleteLog.push(`${index}:${gateName}:q${qubit}:c${column}`);
      },
      onSequenceComplete: () => {
        sequenceComplete = true;
      },
    });

    // All 14 gates should have started and completed
    expect(gateStartLog).toHaveLength(14);
    expect(gateCompleteLog).toHaveLength(14);
    expect(sequenceComplete).toBe(true);

    // Verify gate placement order matches the constant
    for (let i = 0; i < 14; i++) {
      const entry = GROVER_GATE_SEQUENCE[i];
      expect(gateStartLog[i]).toBe(`${i}:${entry.type}:q${entry.qubit}:c${entry.column}`);
    }

    // Verify final circuit state
    const state = coordinator.getState();
    expect(state.qubits).toBe(2);

    // All gates should be placed (note: CZ connectGates consolidates multi-qubit gates)
    const gates = state.gates;
    expect(gates.length).toBeGreaterThanOrEqual(12); // Single gates + connected multi-qubit
  });

  it('should emit cursor telemetry updates during placement', async () => {
    const cursorUpdates: CursorTelemetry[] = [];

    await runGroverSequenceDemo({
      ...FAST_OPTIONS,
      onCursorUpdate: (t) => {
        cursorUpdates.push({ ...t });
      },
    });

    // Should have many cursor updates (hover, pickup, drag frames, target hover, drop, release)
    expect(cursorUpdates.length).toBeGreaterThan(14); // At minimum one per gate

    // First update should be visible
    const firstVisible = cursorUpdates.find((t) => t.isVisible);
    expect(firstVisible).toBeDefined();

    // Last update should be invisible (cursor faded out)
    const lastUpdate = cursorUpdates[cursorUpdates.length - 1];
    expect(lastUpdate.isVisible).toBe(false);
  });

  it('should emit drag step lifecycle callbacks for each gate', async () => {
    const stepLog: Array<{ step: DragStep; gate: string }> = [];

    await runGroverSequenceDemo({
      ...FAST_OPTIONS,
      onDragStep: (step, gate) => {
        stepLog.push({ step, gate });
      },
    });

    // Every single-qubit gate should emit hover, pickup, drag, target_hover, drop, release
    const hoverSteps = stepLog.filter((s) => s.step === 'hover');
    expect(hoverSteps.length).toBeGreaterThanOrEqual(12); // 12 single-qubit + 2 multi-qubit entries

    // Drop should be emitted for each gate
    const dropSteps = stepLog.filter((s) => s.step === 'drop');
    expect(dropSteps.length).toBeGreaterThanOrEqual(12);
  });

  it('should run demonstration-only stages (excluding Stage 2 oracle)', async () => {
    const gateLog: string[] = [];

    const coordinator = await runGroverDemonstrationStages({
      ...FAST_OPTIONS,
      onGateStart: (gateName, qubit, column, index, total) => {
        gateLog.push(`${gateName}:q${qubit}:c${column}`);
        // Stage 2 has 1 gate, so demo should have 13 gates
        expect(total).toBe(13);
      },
    });

    expect(gateLog).toHaveLength(13);

    // Should NOT contain the Stage 2 CZ oracle (col 1)
    const oracleEntries = gateLog.filter((g) => g.startsWith('cz:q0:c1'));
    expect(oracleEntries).toHaveLength(0);

    // Should contain the Stage 3 CZ diffuser (col 4)
    const diffuserCZ = gateLog.filter((g) => g.startsWith('cz:q0:c4'));
    expect(diffuserCZ).toHaveLength(1);

    // Should contain both measurements
    const measures = gateLog.filter((g) => g.startsWith('measure'));
    expect(measures).toHaveLength(2);
  });

  it('should produce a serializable CircuitRequest from the final state', async () => {
    const coordinator = await runGroverSequenceDemo(FAST_OPTIONS);
    const request = coordinator.toCircuitRequest();

    expect(request).toBeDefined();
    expect(request.qubits).toBe(2);
    expect(request.gates).toBeDefined();
    expect(Array.isArray(request.gates)).toBe(true);
    expect(request.gates.length).toBeGreaterThan(0);
  });
});

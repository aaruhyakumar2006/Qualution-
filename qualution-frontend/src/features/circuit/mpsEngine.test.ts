/**
 * mpsEngine.test.ts
 *
 * Phase 8 Verification: Matrix Product State (MPS) Simulation Path
 * Validates real network round-trip to the Python FastAPI backend running Qiskit Aer MPS.
 * Asserts genuine probabilities, real fidelity / truncation-error fields,
 * measured payload size, and routing integration.
 */

import { describe, it, expect } from 'vitest';
import { simulateMpsCircuit } from './mpsEngine';
import { executeRoutedCircuit, selectExecutionPath } from './executionRouter';
import { analyzeCircuit } from './circuitAnalyzer';
import type { CanonicalCircuit } from './types';

describe('Phase 8: Matrix Product State (MPS) Simulation Path', () => {
  // ── TEST 1: 25-Qubit Low-Entanglement Circuit (Live Network Round-Trip) ───
  it('1. Executes 25-qubit bounded-entanglement circuit via MPS over live REST network', async () => {
    const circuit25: CanonicalCircuit = {
      qubits: 25,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 't', targets: [1], column: 0 },
        { id: 'g2', type: 'rx', targets: [0], column: 1, angle: 0.4 },
        { id: 'g3', type: 'cx', targets: [0, 1], column: 2 },
      ],
      shots: 1000,
    };

    const result = await simulateMpsCircuit(circuit25);

    console.log('\n[HUMAN CHECKPOINT - TEST 1: 25-QUBIT MPS SIMULATION]');
    console.log('Backend:', result.backend);
    console.log('Execution Location:', result.execution_location);
    console.log('Execution Method:', result.execution_method);
    console.log('Qubit Count:', result.qubit_count);
    console.log('Fidelity:', result.fidelity);
    console.log('Truncation Error:', result.truncation_error);
    console.log('Reported Aer Engine Runtime (ms):', result.runtime_ms);
    console.log('Total Network Round-Trip (ms):', result.resource_estimate?.round_trip_ms);
    console.log('Response Payload (bytes):', result.resource_estimate?.payload_bytes);
    console.log('Routing Reason:', result.routing_reason);

    // Exact contract assertions
    expect(result.backend).toBe('qiskit_aer_mps');
    expect(result.execution_location).toBe('local_python');
    expect(result.execution_method).toBe('mps');
    expect(result.qubit_count).toBe(25);
    expect(result.shots).toBe(1000);
    expect(result.fidelity).toBe(1.0);
    expect(result.truncation_error).toBe(0.0);
    expect(result.approximation).toBe(false);
    expect(result.runtime_ms).toBeGreaterThan(0);
    expect(result.resource_estimate?.max_bond_dimension).toBe(2);
    expect(result.resource_estimate?.payload_bytes).toBeGreaterThan(0);
    expect(result.probabilities).toBeDefined();
    expect(Object.keys(result.probabilities).length).toBeGreaterThan(0);
  });

  // ── TEST 2: 30-Qubit Circuit (Well beyond local statevector limit) ─────────
  it('2. Executes 30-qubit circuit with genuine probabilities and real fidelity', async () => {
    const gates = [
      { id: 'g0', type: 'h', targets: [0], column: 0 },
      { id: 'g1', type: 't', targets: [1], column: 0 },
      { id: 'g2', type: 'rx', targets: [2], column: 0, angle: 0.5 },
    ];
    for (let i = 0; i < 10; i++) {
      gates.push({ id: `cx_${i}`, type: 'cx', targets: [i, i + 1], column: i + 1 });
    }

    const circuit30: CanonicalCircuit = {
      qubits: 30,
      gates,
      shots: 1000,
    };

    const result = await simulateMpsCircuit(circuit30);

    console.log('\n[HUMAN CHECKPOINT - TEST 2: 30-QUBIT MPS SIMULATION]');
    console.log('Qubits:', result.qubit_count);
    console.log('Fidelity:', result.fidelity);
    console.log('Truncation Error:', result.truncation_error);
    console.log('Aer Engine Runtime (ms):', result.runtime_ms);
    console.log('Payload Size (bytes):', result.resource_estimate?.payload_bytes);

    expect(result.qubit_count).toBe(30);
    expect(result.fidelity).toBe(1.0);
    expect(result.truncation_error).toBe(0.0);
    expect(result.runtime_ms).toBeGreaterThan(0);
    expect(result.counts).toBeDefined();
  });

  // ── TEST 3: Forced Truncation Reports Real Non-Zero Error & Reduced Fidelity ─
  it('3. Forced bond dimension limitation accurately reports real truncation error and fidelity', async () => {
    const entangledCircuit: CanonicalCircuit = {
      qubits: 4,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'rx', targets: [1], column: 0, angle: 0.7 },
        { id: 'g2', type: 'cx', targets: [0, 1], column: 1 },
      ],
      shots: 1000,
    };

    const result = await simulateMpsCircuit(entangledCircuit, { max_bond_dimension: 1 });

    console.log('\n[HUMAN CHECKPOINT - TEST 3: FORCED TRUNCATION REAL TELEMETRY]');
    console.log('Approximation:', result.approximation);
    console.log('Real Truncation Error:', result.truncation_error);
    console.log('Real Fidelity:', result.fidelity);
    console.log('Warnings:', result.warnings);

    expect(result.approximation).toBe(true);
    expect(result.truncation_error).toBeGreaterThan(0.0);
    expect(result.fidelity).toBeLessThan(1.0);
    expect(result.fidelity).toBeGreaterThanOrEqual(0.0);
    expect(result.warnings?.[0]).toContain('MPS simulation truncated state');
  });

  // ── TEST 4: Full Multi-Signal Router Integration ──────────────────────────
  it('4. executeRoutedCircuit automatically routes 25-qubit bounded entanglement to MPS (Tier 3)', async () => {
    const mpsCircuit: CanonicalCircuit = {
      qubits: 25,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 't', targets: [1], column: 0 },
        { id: 'cx1', type: 'cx', targets: [0, 1], column: 1 },
        { id: 'cx2', type: 'cx', targets: [1, 2], column: 2 },
      ],
      shots: 1000,
    };

    // Verify routing decision first
    const analysis = analyzeCircuit(mpsCircuit);
    expect(analysis.mps_candidate).toBe(true);
    expect(analysis.local_statevector_candidate).toBe(false);

    const decision = selectExecutionPath(analysis);
    expect(decision.priority_tier).toBe(3);
    expect(decision.method).toBe('mps');
    expect(decision.location).toBe('local_python');

    // Now execute through full pipeline
    const result = await executeRoutedCircuit(mpsCircuit);

    console.log('\n[HUMAN CHECKPOINT - TEST 4: ROUTER TO MPS DISPATCH]');
    console.log('Dispatched Backend:', result.backend);
    console.log('Dispatched Method:', result.execution_method);
    console.log('Routing Reason:', result.routing_reason);

    expect(result.backend).toBe('qiskit_aer_mps');
    expect(result.execution_method).toBe('mps');
    expect(result.execution_location).toBe('local_python');
    expect(result.qubit_count).toBe(25);
  });

  // ── TEST 5: Graceful and Honest Error When Backend is Unreachable ─────────
  it('5. Returns clear, informative error if backend is unreachable rather than failing silently', async () => {
    const circuit: CanonicalCircuit = {
      qubits: 25,
      gates: [{ id: 'g0', type: 'h', targets: [0], column: 0 }],
    };

    // Point to non-existent port 59999
    await expect(
      simulateMpsCircuit(circuit, { backendUrl: 'http://127.0.0.1:59999', timeoutMs: 1000 })
    ).rejects.toThrow(/MPS Simulation Backend Unreachable/);
  });
});

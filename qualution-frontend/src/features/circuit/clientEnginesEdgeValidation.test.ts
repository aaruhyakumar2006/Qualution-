/**
 * clientEnginesEdgeValidation.test.ts
 *
 * Edge & Low-Bandwidth Device Validation:
 * 1. Confirms ZERO network requests (fetch / HTTP calls) fire for any circuit
 *    routed to Stabilizer or Statevector client-side engines.
 * 2. Confirms network requests ONLY fire when a circuit deliberately leaves
 *    the browser for Tier 3 (MPS) or remote execution.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeRoutedCircuit } from './executionRouter';
import { simulateStabilizerCircuit } from './stabilizerEngine';
import { simulateStatevectorCircuit } from './statevectorEngine';
import type { CanonicalCircuit } from './types';

describe('Edge & Low-Bandwidth Device Validation: Zero Network Egress', () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.fn().mockImplementation((url: string) => {
      // Return a valid mock response for MPS if called
      const mockData = {
        probabilities: { '0': 1 },
        counts: { '0': 100 },
        fidelity: 1.0,
        truncation_error: 0.0,
        approximation: false,
        max_bond_dimension_used: 1,
        runtime_ms: 1.5,
      };
      return Promise.resolve({
        ok: true,
        json: async () => mockData,
        text: async () => JSON.stringify(mockData),
      });
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ── TEST 1: ZERO NETWORK REQUESTS FOR STABILIZER ENGINE ───────────────────────
  it('1. Confirm ZERO network requests fire for 50-qubit GHZ Clifford circuit routed to Stabilizer', async () => {
    const gates = [{ id: 'g0', type: 'h', targets: [0], column: 0 }];
    const measurements = [{ qubit: 0, classical_bit: 0 }];
    for (let q = 1; q < 50; q++) {
      gates.push({ id: `g${q}`, type: 'cx', targets: [q - 1, q], column: q });
      measurements.push({ qubit: q, classical_bit: q });
    }

    const ghz50: CanonicalCircuit = {
      qubits: 50,
      gates,
      measurements,
      shots: 100,
    };

    // Execute via top-level multi-signal router
    const result = await executeRoutedCircuit(ghz50, { shots: 100 });

    // Assertions
    expect(result.execution_method).toBe('stabilizer');
    expect(result.execution_location).toBe('local_browser');
    expect(result.backend).toBe('stabilizer_engine');
    expect(result.status).toBe('success');

    // CRITICAL: 0 network requests fired
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  // ── TEST 2: ZERO NETWORK REQUESTS FOR DIRECT STABILIZER SIMULATION ────────────
  it('2. Confirm ZERO network requests fire for direct simulateStabilizerCircuit execution', () => {
    const bellCircuit: CanonicalCircuit = {
      qubits: 2,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'cx', targets: [0, 1], column: 1 },
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
      ],
      shots: 500,
    };

    const result = simulateStabilizerCircuit(bellCircuit, { shots: 500 });

    expect(result.execution_method).toBe('stabilizer');
    expect(result.execution_location).toBe('local_browser');
    expect(result.counts['00']! + result.counts['11']!).toBe(500);

    // CRITICAL: 0 network requests fired
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  // ── TEST 3: ZERO NETWORK REQUESTS FOR STATEVECTOR ENGINE ──────────────────────
  it('3. Confirm ZERO network requests fire for arbitrary non-Clifford circuit routed to Statevector', async () => {
    const nonCliffordCircuit: CanonicalCircuit = {
      qubits: 3,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'rx', targets: [0], column: 1, angle: Math.PI / 3 },
        { id: 'g2', type: 't', targets: [1], column: 1 },
        { id: 'g3', type: 'cx', targets: [0, 1], column: 2 },
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
      ],
      shots: 500,
    };

    // Execute via top-level multi-signal router
    const result = await executeRoutedCircuit(nonCliffordCircuit, { shots: 500 });

    // Assertions
    expect(result.execution_method).toBe('statevector');
    expect(result.execution_location).toBe('local_browser');
    expect(result.backend).toBe('statevector_engine');
    expect(result.status).toBe('success');

    // CRITICAL: 0 network requests fired
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  // ── TEST 4: ZERO NETWORK REQUESTS FOR DIRECT STATEVECTOR SIMULATION ───────────
  it('4. Confirm ZERO network requests fire for direct simulateStatevectorCircuit execution', () => {
    const nonCliffordCircuit: CanonicalCircuit = {
      qubits: 2,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'rz', targets: [1], column: 0, angle: Math.PI / 4 },
        { id: 'g2', type: 'cx', targets: [0, 1], column: 1 },
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
      ],
      shots: 250,
    };

    const result = simulateStatevectorCircuit(nonCliffordCircuit, { shots: 250 });

    expect(result.execution_method).toBe('statevector');
    expect(result.execution_location).toBe('local_browser');
    expect(result.probabilities).toBeDefined();

    // CRITICAL: 0 network requests fired
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  // ── POSITIVE CONTROL: CONFIRM SPY ACCURATELY DETECTS MPS TIER 3 EGRESS ────────
  it('5. POSITIVE CONTROL: Network request DOES fire when circuit routes to Tier 3 MPS', async () => {
    // 25-qubit circuit with bounded entanglement exceeds local statevector safe RAM
    const gates = [{ id: 'g0', type: 'h', targets: [0], column: 0 }];
    const measurements = [{ qubit: 0, classical_bit: 0 }];
    for (let q = 1; q < 25; q++) {
      if (q <= 2) {
        gates.push({ id: `g${q}`, type: 'cx', targets: [q - 1, q], column: q });
      }
      measurements.push({ qubit: q, classical_bit: q });
    }
    // Add non-Clifford gate
    gates.push({ id: 'non_cliff', type: 't', targets: [0], column: 10 });

    const mpsCircuit: CanonicalCircuit = {
      qubits: 25,
      gates,
      measurements,
      shots: 100,
    };

    const result = await executeRoutedCircuit(mpsCircuit, { shots: 100 });

    expect(result.execution_method).toBe('mps');
    expect(result.execution_location).toBe('local_python');

    // POSITIVE CONTROL ASSERTION: exactly 1 request fired to /simulate/mps
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toContain('/simulate/mps');
  });
});

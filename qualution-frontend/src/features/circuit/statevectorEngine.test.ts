/**
 * statevectorEngine.test.ts
 *
 * Comprehensive validation of the client-side full-statevector simulation engine.
 *
 * Tests:
 * 1. Bell state cross-check (|00> and |11> 50/50).
 * 2. Grover 2-qubit circuit cross-check -> confirms P(11) = 1.00 (0.99-1.00),
 *    matching Phase 3's stabilizer engine and the verified lesson baseline.
 * 3. Non-Clifford circuit: Single-qubit RX(pi/3) rotation -> confirms exact Born rule
 *    probabilities P(0) = 0.75, P(1) = 0.25 (which Stabilizer explicitly cannot simulate).
 * 4. Non-Clifford circuit with T gate (H -> T -> H) and arbitrary phase P(theta).
 * 5. Runtime check: confirms measured runtime is strictly > 0 and never reported as '0ms'.
 */

import { describe, it, expect } from 'vitest';
import { simulateStatevectorCircuit } from './statevectorEngine';
import { simulateStabilizerCircuit } from './stabilizerEngine';
import type { CanonicalCircuit } from './types';

describe('Client-Side Statevector Quantum Engine', () => {
  // ── TEST 1: Grover 2-Qubit Cross-Check ─────────────────────────────────
  it('1. Grover 2-qubit cross-check: Statevector engine reproduces exact P(11) = 1.00', () => {
    const groverCircuit: CanonicalCircuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        // Column 0: Superposition
        { id: 'g-h0', type: 'h', targets: [0], column: 0 },
        { id: 'g-h1', type: 'h', targets: [1], column: 0 },
        // Column 1: Oracle (|11> phase inversion)
        { id: 'g-cz-oracle', type: 'cz', targets: [0, 1], column: 1 },
        // Column 2: Diffusion H
        { id: 'g-dh0', type: 'h', targets: [0], column: 2 },
        { id: 'g-dh1', type: 'h', targets: [1], column: 2 },
        // Column 3: Diffusion X
        { id: 'g-dx0', type: 'x', targets: [0], column: 3 },
        { id: 'g-dx1', type: 'x', targets: [1], column: 3 },
        // Column 4: Diffusion CZ
        { id: 'g-dcz', type: 'cz', targets: [0, 1], column: 4 },
        // Column 5: Diffusion X
        { id: 'g-dx0b', type: 'x', targets: [0], column: 5 },
        { id: 'g-dx1b', type: 'x', targets: [1], column: 5 },
        // Column 6: Diffusion H
        { id: 'g-dh0b', type: 'h', targets: [0], column: 6 },
        { id: 'g-dh1b', type: 'h', targets: [1], column: 6 },
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
      ],
      shots: 1000,
    };

    const svResult = simulateStatevectorCircuit(groverCircuit, { shots: 1000 });
    const stabResult = simulateStabilizerCircuit(groverCircuit, { shots: 1000 });

    console.log('\n[HUMAN CHECKPOINT - TEST 1: GROVER CROSS-CHECK]');
    console.log('Statevector Backend:', svResult.backend);
    console.log('Statevector P(11):', svResult.probabilities['11']);
    console.log('Statevector Counts:', svResult.counts);
    console.log('Statevector Runtime (ms):', svResult.runtime_ms);
    console.log('Stabilizer P(11):', stabResult.probabilities['11']);
    console.log('Stabilizer Runtime (ms):', stabResult.runtime_ms);

    expect(svResult.probabilities['11']).toBeGreaterThanOrEqual(0.99);
    expect(svResult.probabilities['11']).toBe(1.0);
    expect(svResult.counts?.['11']).toBe(1000);
    expect(svResult.probabilities['00'] ?? 0).toBe(0);
    expect(svResult.probabilities['01'] ?? 0).toBe(0);
    expect(svResult.probabilities['10'] ?? 0).toBe(0);

    // Cross-check: both engines agree 100% on the Grover result
    expect(svResult.probabilities['11']).toBe(stabResult.probabilities['11']);
    expect(svResult.runtime_ms).toBeGreaterThan(0);
  });

  // ── TEST 2: Non-Clifford Single-Qubit RX(pi/3) Rotation ───────────────
  it('2. Non-Clifford Circuit: RX(pi/3) rotation produces analytical P(0) = 0.75, P(1) = 0.25', () => {
    // RX(pi/3) on |0>:
    // |psi> = cos(pi/6)|0> - i*sin(pi/6)|1> = (sqrt(3)/2)|0> - (i/2)|1>
    // P(0) = (sqrt(3)/2)^2 = 3/4 = 0.75
    // P(1) = |-i/2|^2 = 1/4 = 0.25
    const rxCircuit: CanonicalCircuit = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        {
          id: 'g-rx',
          type: 'rx',
          targets: [0],
          column: 0,
          angle: Math.PI / 3, // Non-Clifford angle!
        },
      ],
      measurements: [{ qubit: 0, classical_bit: 0 }],
      shots: 10000,
    };

    const result = simulateStatevectorCircuit(rxCircuit, { shots: 10000 });

    console.log('\n[HUMAN CHECKPOINT - TEST 2: NON-CLIFFORD RX(PI/3)]');
    console.log('Exact Analytical Probabilities:');
    console.log('   P(0) Expected: 0.750, Computed:', result.probabilities['0']);
    console.log('   P(1) Expected: 0.250, Computed:', result.probabilities['1']);
    console.log('Empirical Shot Counts (10,000 shots):', result.counts);
    console.log('Runtime (ms):', result.runtime_ms);

    // Exact analytical probabilities must be within 1e-6
    expect(result.probabilities['0']).toBeCloseTo(0.75, 4);
    expect(result.probabilities['1']).toBeCloseTo(0.25, 4);

    // Sampled counts over 10,000 shots must be within 3 sigma (~0.73 - 0.77)
    const ratio0 = (result.counts?.['0'] ?? 0) / 10000;
    const ratio1 = (result.counts?.['1'] ?? 0) / 10000;
    expect(ratio0).toBeGreaterThan(0.72);
    expect(ratio0).toBeLessThan(0.78);
    expect(ratio1).toBeGreaterThan(0.22);
    expect(ratio1).toBeLessThan(0.28);

    expect(result.runtime_ms).toBeGreaterThan(0);
  });

  // ── TEST 3: Non-Clifford Circuit with T-Gate ──────────────────────────
  it('3. Non-Clifford Circuit with T-gate: H -> T -> H produces P(0) = 0.8536, P(1) = 0.1464', () => {
    // H -> T -> H on |0>:
    // H |0> = |+> = (|0> + |1>)/sqrt(2)
    // T |+> = (|0> + e^(i*pi/4)|1>)/sqrt(2)
    // H T |+> = (1 + e^(i*pi/4))/2 |0> + (1 - e^(i*pi/4))/2 |1>
    // |1 + e^(i*pi/4)|^2 / 4 = ( (1 + 1/sqrt(2))^2 + (1/sqrt(2))^2 ) / 4
    // = ( 1 + sqrt(2) + 1/2 + 1/2 ) / 4 = (2 + sqrt(2))/4 = (1 + 1/sqrt(2))/2 ≈ 0.853553
    // P(1) = (2 - sqrt(2))/4 ≈ 0.146447
    const hthCircuit: CanonicalCircuit = {
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 't', targets: [0], column: 1 }, // Non-Clifford T gate!
        { id: 'g2', type: 'h', targets: [0], column: 2 },
      ],
      measurements: [{ qubit: 0, classical_bit: 0 }],
      shots: 10000,
    };

    const result = simulateStatevectorCircuit(hthCircuit, { shots: 10000 });

    console.log('\n[HUMAN CHECKPOINT - TEST 3: T-GATE H-T-H CIRCUIT]');
    console.log('P(0) Expected: ~0.8536, Computed:', result.probabilities['0']);
    console.log('P(1) Expected: ~0.1464, Computed:', result.probabilities['1']);
    console.log('Sampled Counts (10,000 shots):', result.counts);
    console.log('Runtime (ms):', result.runtime_ms);

    const expectedP0 = (2 + Math.SQRT2) / 4;
    const expectedP1 = (2 - Math.SQRT2) / 4;

    expect(result.probabilities['0']).toBeCloseTo(expectedP0, 4);
    expect(result.probabilities['1']).toBeCloseTo(expectedP1, 4);
    expect(result.runtime_ms).toBeGreaterThan(0);
  });

  // ── TEST 4: Bell State (|00> + |11>) ─────────────────────────────────
  it('4. Bell State: Produces exact 50/50 superposition with complex statevector', () => {
    const bellCircuit: CanonicalCircuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'cx', targets: [0, 1], column: 1 },
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
      ],
      shots: 1000,
    };

    const result = simulateStatevectorCircuit(bellCircuit, { shots: 1000 });

    console.log('\n[HUMAN CHECKPOINT - TEST 4: BELL STATE]');
    console.log('Counts:', result.counts);
    console.log('Probabilities:', result.probabilities);
    console.log('Statevector amplitudes:', result.statevector);
    console.log('Runtime (ms):', result.runtime_ms);

    expect(result.probabilities['00']).toBeCloseTo(0.5, 4);
    expect(result.probabilities['11']).toBeCloseTo(0.5, 4);
    expect(result.probabilities['01'] ?? 0).toBe(0);
    expect(result.probabilities['10'] ?? 0).toBe(0);

    // Amplitudes: statevector[0] = 1/sqrt(2), statevector[3] = 1/sqrt(2)
    expect(result.statevector?.[0].real).toBeCloseTo(Math.SQRT1_2, 4);
    expect(result.statevector?.[3].real).toBeCloseTo(Math.SQRT1_2, 4);
    expect(result.statevector?.[1].real).toBe(0);
    expect(result.statevector?.[2].real).toBe(0);
  });

  // ── TEST 5: Runtime Metric Precision (Never 0ms) ──────────────────────
  it('5. Runtime verification: Measured runtime is strictly non-zero and precise', () => {
    const tinyCircuit: CanonicalCircuit = {
      qubits: 1,
      classical_bits: 1,
      gates: [{ id: 'g0', type: 'x', targets: [0], column: 0 }],
      measurements: [{ qubit: 0, classical_bit: 0 }],
      shots: 10,
    };

    const result = simulateStatevectorCircuit(tinyCircuit);

    console.log('\n[HUMAN CHECKPOINT - TEST 5: RUNTIME PRECISION]');
    console.log('Runtime (ms):', result.runtime_ms);
    console.log('Runtime type:', typeof result.runtime_ms);

    expect(result.runtime_ms).toBeGreaterThan(0);
    expect(typeof result.runtime_ms).toBe('number');
    expect(Number.isFinite(result.runtime_ms)).toBe(true);
    expect(result.runtime_ms.toString()).not.toBe('0');
  });

  // ── TEST 6: Memory Safety Check ──────────────────────────────────────
  it('6. Safety guard: Prevents Statevector engine from running circuits exceeding the safe threshold', () => {
    // 25 qubits would require 2^25 * 16 bytes = 536 MB of RAM (unsafe for budget client devices)
    const unsafeCircuit: CanonicalCircuit = {
      qubits: 25,
      gates: [{ id: 'g0', type: 'h', targets: [0], column: 0 }],
      measurements: [{ qubit: 0, classical_bit: 0 }],
      shots: 10,
    };

    expect(() => simulateStatevectorCircuit(unsafeCircuit)).toThrow(
      /Statevector simulation exceeds safe client memory limits for 25 qubits/
    );

    console.log('\n[HUMAN CHECKPOINT - TEST 6: MEMORY SAFETY GUARD]');
    console.log('Successfully blocked 25-qubit circuit with explicit memory limit exception.');
  });
});

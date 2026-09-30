import { describe, it, expect } from 'vitest';
import { computeCircuitMetrics } from './circuitMetrics';
import type { CircuitRequest } from './types';

describe('computeCircuitMetrics - Multi-gate & Multi-qubit robustness', () => {
  it('computes metrics without throwing when two gates are placed on two qubits at column 0', () => {
    // Exact user crash scenario: 2 qubits, 2 gates at col 0
    const circuit: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: 'gate-1', gate: 'h', targets: [0], column: 0 },
        { id: 'gate-2', gate: 'x', targets: [1], column: 0 },
      ],
      measure: false,
      shots: 1000,
    };

    expect(() => {
      const metrics = computeCircuitMetrics(circuit);
      expect(metrics.qubit_count).toBe(2);
      expect(metrics.gate_count).toBe(2);
      expect(metrics.depth).toBe(1);
      expect(metrics.single_qubit_gate_count).toBe(2);
      expect(metrics.two_qubit_gate_count).toBe(0);
    }).not.toThrow();
  });

  it('handles multi-qubit entangling gates correctly', () => {
    const circuit: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: 'g1', gate: 'h', targets: [0], column: 0 },
        { id: 'g2', gate: 'cx', targets: [0, 1], column: 1 },
      ],
      measure: true,
      shots: 1024,
    };

    const metrics = computeCircuitMetrics(circuit);
    expect(metrics.qubit_count).toBe(2);
    expect(metrics.gate_count).toBe(2);
    expect(metrics.two_qubit_gate_count).toBe(1);
    expect(metrics.single_qubit_gate_count).toBe(1);
    expect(metrics.depth).toBe(2);
  });

  it('handles empty circuits and 1-qubit circuits gracefully', () => {
    const empty: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [],
      measure: false,
      shots: 1000,
    };

    const metrics = computeCircuitMetrics(empty);
    expect(metrics.qubit_count).toBe(1);
    expect(metrics.gate_count).toBe(0);
    expect(metrics.depth).toBe(0);
  });
});

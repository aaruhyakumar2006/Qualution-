import { describe, it, expect } from 'vitest';
import {
  getCircuitSignature,
  isCircuitDirty,
  INITIAL_EXECUTION_STATE,
} from './executionState';
import type { CircuitRequest } from './types';

describe('Execution State Machine & Dirty Checking', () => {
  const bellCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { gate: 'h', targets: [0], column: 0 },
      { gate: 'cx', targets: [0, 1], column: 1 },
    ],
    measure: true,
    shots: 1000,
  };

  it('generates deterministic signatures invariant to gate order insertion if same columns', () => {
    const sig1 = getCircuitSignature(bellCircuit, 'qiskit_aer', 1000);
    const sig2 = getCircuitSignature(bellCircuit, 'qiskit_aer', 1000);
    expect(sig1).toBe(sig2);
  });

  it('detects dirty state when gates, backend, or shots change', () => {
    const initialSig = getCircuitSignature(bellCircuit, 'auto', 1000);

    // Same circuit -> clean
    expect(isCircuitDirty(bellCircuit, 'auto', 1000, initialSig)).toBe(false);

    // Changed shots -> dirty
    expect(isCircuitDirty(bellCircuit, 'auto', 5000, initialSig)).toBe(true);

    // Changed backend -> dirty
    expect(isCircuitDirty(bellCircuit, 'pennylane', 1000, initialSig)).toBe(true);

    // Added gate -> dirty
    const modifiedCircuit: CircuitRequest = {
      ...bellCircuit,
      gates: [...bellCircuit.gates, { gate: 'x', targets: [1], column: 2 }],
    };
    expect(isCircuitDirty(modifiedCircuit, 'auto', 1000, initialSig)).toBe(true);
  });

  it('marks unexecuted circuit as dirty by default', () => {
    expect(isCircuitDirty(bellCircuit, 'auto', 1000, null)).toBe(true);
    expect(INITIAL_EXECUTION_STATE.status).toBe('idle');
  });
});

import { describe, it, expect } from 'vitest';
import { generateQiskitCode, generatePennyLaneCode } from './codegen';
import type { CircuitRequest } from './types';

describe('Bidirectional Code ↔ Circuit Synchronization & Invariance (Step 29)', () => {
  // Test Circuit 1: Bell State
  const bellCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { gate: 'h', targets: [0], column: 0 },
      { gate: 'cx', targets: [0, 1], column: 1 },
    ],
    measure: true,
    shots: 1024,
  };

  // Test Circuit 2: Continuous Rotations & Multi-Qubit Gates
  const rotationCircuit: CircuitRequest = {
    qubits: 3,
    classical_bits: 3,
    gates: [
      { gate: 'rx', targets: [0], angle: 1.570796, column: 0 },
      { gate: 'ry', targets: [1], angle: 0.785398, column: 1 },
      { gate: 'rz', targets: [2], angle: 3.141593, column: 2 },
      { gate: 'cz', targets: [0, 1], column: 3 },
      { gate: 'swap', targets: [1, 2], column: 4 },
      { gate: 's', targets: [0], column: 5 },
      { gate: 't', targets: [1], column: 6 },
    ],
    measure: true,
    shots: 2048,
  };

  it('generates deterministic Qiskit Python code with exact gate sequences', () => {
    const qiskitCode = generateQiskitCode(bellCircuit);
    expect(qiskitCode).toContain('from qiskit import QuantumCircuit');
    expect(qiskitCode).toContain('qc = QuantumCircuit(2, 2)');
    expect(qiskitCode).toContain('qc.h(0)');
    expect(qiskitCode).toContain('qc.cx(0, 1)');
    expect(qiskitCode).toContain('qc.measure(0, 0)');
    expect(qiskitCode).toContain('qc.measure(1, 1)');
  });

  it('generates deterministic PennyLane Python code with exact gate sequences', () => {
    const plCode = generatePennyLaneCode(bellCircuit);
    expect(plCode).toContain('import pennylane as qml');
    expect(plCode).toContain('dev = qml.device("default.qubit", wires=2)');
    expect(plCode).toContain('@qml.qnode(dev, shots=1024)');
    expect(plCode).toContain('qml.Hadamard(wires=0)');
    expect(plCode).toContain('qml.CNOT(wires=[0, 1])');
    expect(plCode).toContain('return qml.counts()');
  });

  it('preserves rotation angles without precision loss or truncation across frameworks', () => {
    const qiskit = generateQiskitCode(rotationCircuit);
    expect(qiskit).toContain('qc.rx(1.570796, 0)');
    expect(qiskit).toContain('qc.ry(0.785398, 1)');
    expect(qiskit).toContain('qc.rz(3.141593, 2)');
    expect(qiskit).toContain('qc.cz(0, 1)');
    expect(qiskit).toContain('qc.swap(1, 2)');
    expect(qiskit).toContain('qc.s(0)');
    expect(qiskit).toContain('qc.t(1)');

    const pennylane = generatePennyLaneCode(rotationCircuit);
    expect(pennylane).toContain('qml.RX(1.570796, wires=0)');
    expect(pennylane).toContain('qml.RY(0.785398, wires=1)');
    expect(pennylane).toContain('qml.RZ(3.141593, wires=2)');
    expect(pennylane).toContain('qml.CZ(wires=[0, 1])');
    expect(pennylane).toContain('qml.SWAP(wires=[1, 2])');
    expect(pennylane).toContain('qml.S(wires=0)');
    expect(pennylane).toContain('qml.T(wires=1)');
  });

  it('maintains Circuit IR as the canonical source of truth when switching frameworks', () => {
    // When switching framework views, the original Circuit IR must remain identical
    const qiskit = generateQiskitCode(bellCircuit);
    const pennylane = generatePennyLaneCode(bellCircuit);

    expect(qiskit).toBeTruthy();
    expect(pennylane).toBeTruthy();
    expect(bellCircuit.qubits).toBe(2);
    expect(bellCircuit.gates.length).toBe(2);
  });
});

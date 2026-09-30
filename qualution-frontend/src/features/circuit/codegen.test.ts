import { describe, it, expect } from 'vitest';
import { generateQiskitCode, generatePennyLaneCode } from './codegen';
import type { CircuitRequest } from './types';

describe('Bidirectional Code Generation (Step 18)', () => {
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

  const rotationCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { gate: 'rx', targets: [0], angle: 1.570796, column: 0 },
      { gate: 'ry', targets: [1], angle: 0.785398, column: 1 },
      { gate: 'cz', targets: [0, 1], column: 2 },
    ],
    measure: false,
    shots: 500,
  };

  it('generates accurate Qiskit Python code for Bell state', () => {
    const code = generateQiskitCode(bellCircuit);

    expect(code).toContain('from qiskit import QuantumCircuit');
    expect(code).toContain('qc = QuantumCircuit(2, 2)');
    expect(code).toContain('qc.h(0)');
    expect(code).toContain('qc.cx(0, 1)');
    expect(code).toContain('qc.measure(0, 0)');
    expect(code).toContain('qc.measure(1, 1)');
    expect(code).toContain('job = simulator.run(qc, shots=1000)');
  });

  it('generates accurate PennyLane Python code for Bell state', () => {
    const code = generatePennyLaneCode(bellCircuit);

    expect(code).toContain('import pennylane as qml');
    expect(code).toContain('dev = qml.device("default.qubit", wires=2)');
    expect(code).toContain('@qml.qnode(dev, shots=1000)');
    expect(code).toContain('qml.Hadamard(wires=0)');
    expect(code).toContain('qml.CNOT(wires=[0, 1])');
    expect(code).toContain('return qml.counts()');
  });

  it('preserves rotation angles and two-qubit gates in generated code', () => {
    const qiskitCode = generateQiskitCode(rotationCircuit);
    expect(qiskitCode).toContain('qc.rx(1.570796, 0)');
    expect(qiskitCode).toContain('qc.ry(0.785398, 1)');
    expect(qiskitCode).toContain('qc.cz(0, 1)');

    const plCode = generatePennyLaneCode(rotationCircuit);
    expect(plCode).toContain('qml.RX(1.570796, wires=0)');
    expect(plCode).toContain('qml.RY(0.785398, wires=1)');
    expect(plCode).toContain('qml.CZ(wires=[0, 1])');
    expect(plCode).toContain('return qml.state()');
  });
});

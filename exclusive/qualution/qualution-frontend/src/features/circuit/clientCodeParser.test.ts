import { describe, it, expect } from 'vitest';
import {
  parseOpenQASMClient,
  parseQiskitClient,
  parsePennyLaneClient,
  parseCirqClient,
  safeEvalAngle,
} from './clientCodeParser';

describe('clientCodeParser', () => {
  describe('safeEvalAngle', () => {
    it('evaluates numeric strings and pi constants', () => {
      expect(safeEvalAngle('1.57')).toBeCloseTo(1.57);
      expect(safeEvalAngle('pi')).toBeCloseTo(Math.PI);
      expect(safeEvalAngle('math.pi / 2')).toBeCloseTo(Math.PI / 2);
      expect(safeEvalAngle('np.pi / 4')).toBeCloseTo(Math.PI / 4);
      expect(safeEvalAngle('3 * pi / 2')).toBeCloseTo((3 * Math.PI) / 2);
      expect(safeEvalAngle('-pi / 2')).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('parseOpenQASMClient', () => {
    it('parses OpenQASM single qubit and two qubit gates', () => {
      const qasm = `
OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;
bit[2] c;

h q[0];
cx q[0], q[1];
rx(pi/2) q[1];
c[0] = measure q[0];
`;
      const res = parseOpenQASMClient(qasm);
      expect(res.framework).toBe('openqasm');
      expect(res.circuit.qubits).toBe(2);
      expect(res.circuit.gates.length).toBe(3);
      expect(res.circuit.gates[0]).toEqual({ gate: 'h', targets: [0] });
      expect(res.circuit.gates[1]).toEqual({ gate: 'cx', targets: [0, 1] });
      expect(res.circuit.gates[2].gate).toBe('rx');
      expect(res.circuit.gates[2].angle).toBeCloseTo(Math.PI / 2);
      expect(res.circuit.measure).toBe(true);
    });

    it('parses Toffoli / CCX in OpenQASM', () => {
      const qasm = `
qubit[3] q;
ccx q[0], q[1], q[2];
`;
      const res = parseOpenQASMClient(qasm);
      expect(res.circuit.qubits).toBe(3);
      expect(res.circuit.gates[0]).toEqual({ gate: 'ccx', targets: [0, 1, 2] });
    });
  });

  describe('parseQiskitClient', () => {
    it('parses standard Qiskit code with gates and measurements', () => {
      const qiskitCode = `
from qiskit import QuantumCircuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure(0, 0)
qc.measure(1, 1)
`;
      const res = parseQiskitClient(qiskitCode);
      expect(res.framework).toBe('qiskit');
      expect(res.circuit.qubits).toBe(2);
      expect(res.circuit.gates.length).toBe(2);
      expect(res.circuit.gates[0]).toEqual({ gate: 'h', targets: [0] });
      expect(res.circuit.gates[1]).toEqual({ gate: 'cx', targets: [0, 1] });
      expect(res.circuit.measure).toBe(true);
    });

    it('parses parameterized rotations and Toffoli gate', () => {
      const qiskitCode = `
from qiskit import QuantumCircuit
import numpy as np

qc = QuantumCircuit(3)
qc.h(0)
qc.rz(np.pi / 2, 0)
qc.p(3.14159, 1)
qc.ccx(0, 1, 2)
`;
      const res = parseQiskitClient(qiskitCode);
      expect(res.circuit.qubits).toBe(3);
      expect(res.circuit.gates.length).toBe(4);
      expect(res.circuit.gates[1].gate).toBe('rz');
      expect(res.circuit.gates[1].angle).toBeCloseTo(Math.PI / 2);
      expect(res.circuit.gates[2].gate).toBe('p');
      expect(res.circuit.gates[3]).toEqual({ gate: 'ccx', targets: [0, 1, 2] });
    });

    it('handles subscript indexing like q[0] and ignores barriers and simulation code', () => {
      const qiskitCode = `
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2, 2)
qc.h(q[0])
qc.barrier()
qc.cx(q[0], q[1])
simulator = AerSimulator()
job = simulator.run(qc, shots=500)
`;
      const res = parseQiskitClient(qiskitCode);
      expect(res.circuit.qubits).toBe(2);
      expect(res.circuit.gates.length).toBe(2);
      expect(res.circuit.shots).toBe(500);
    });
  });

  describe('parsePennyLaneClient', () => {
    it('parses PennyLane operations', () => {
      const plCode = `
import pennylane as qml
dev = qml.device("default.qubit", wires=2)

@qml.qnode(dev)
def circuit():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.probs(wires=[0, 1])
`;
      const res = parsePennyLaneClient(plCode);
      expect(res.circuit.qubits).toBe(2);
      expect(res.circuit.gates.length).toBe(2);
      expect(res.circuit.gates[0].gate).toBe('h');
      expect(res.circuit.gates[1].gate).toBe('cx');
    });
  });

  describe('parseCirqClient', () => {
    it('parses Cirq operations', () => {
      const cirqCode = `
import cirq
q = cirq.LineQubit.range(2)
circuit = cirq.Circuit()
circuit.append([
    cirq.H(q[0]),
    cirq.CNOT(q[0], q[1]),
    cirq.rx(1.57)(q[0])
])
`;
      const res = parseCirqClient(cirqCode);
      expect(res.circuit.qubits).toBe(2);
      expect(res.circuit.gates.length).toBe(3);
      expect(res.circuit.gates[0].gate).toBe('h');
      expect(res.circuit.gates[1].gate).toBe('cx');
      expect(res.circuit.gates[2].gate).toBe('rx');
      expect(res.circuit.gates[2].angle).toBeCloseTo(1.57);
    });
  });
});

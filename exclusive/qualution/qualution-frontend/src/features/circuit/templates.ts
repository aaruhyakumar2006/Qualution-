import type { CircuitRequest } from './types';

export const GROVERS_2Q: CircuitRequest = {
  qubits: 2,
  classical_bits: 2,
  gates: [
    // Superposition
    { id: 'g1', gate: 'h', targets: [0], column: 0 },
    { id: 'g2', gate: 'h', targets: [1], column: 0 },
    // Oracle (Mark state |11>)
    { id: 'g3', gate: 'cz', targets: [0, 1], column: 1 },
    // Diffusion
    { id: 'g4', gate: 'h', targets: [0], column: 2 },
    { id: 'g5', gate: 'h', targets: [1], column: 2 },
    { id: 'g6', gate: 'x', targets: [0], column: 3 },
    { id: 'g7', gate: 'x', targets: [1], column: 3 },
    { id: 'g8', gate: 'cz', targets: [0, 1], column: 4 },
    { id: 'g9', gate: 'x', targets: [0], column: 5 },
    { id: 'g10', gate: 'x', targets: [1], column: 5 },
    { id: 'g11', gate: 'h', targets: [0], column: 6 },
    { id: 'g12', gate: 'h', targets: [1], column: 6 },
  ],
  measure: true,
  shots: 1000,
};

export const QFT_3Q: CircuitRequest = {
  qubits: 3,
  classical_bits: 3,
  gates: [
    // Qubit 0
    { id: 'q1', gate: 'h', targets: [0], column: 0 },
    { id: 'q2', gate: 'cp', targets: [1, 0], angle: Math.PI / 2, column: 1 },
    { id: 'q3', gate: 'cp', targets: [2, 0], angle: Math.PI / 4, column: 2 },
    // Qubit 1
    { id: 'q4', gate: 'h', targets: [1], column: 3 },
    { id: 'q5', gate: 'cp', targets: [2, 1], angle: Math.PI / 2, column: 4 },
    // Qubit 2
    { id: 'q6', gate: 'h', targets: [2], column: 5 },
    // SWAP
    { id: 'q7', gate: 'swap', targets: [0, 2], column: 6 },
  ],
  measure: true,
  shots: 1000,
};

export const QPE_3Q: CircuitRequest = {
  qubits: 3,
  classical_bits: 2,
  gates: [
    // Initialize target state (e.g. |1> for phase estimation)
    { id: 'p1', gate: 'x', targets: [2], column: 0 },
    // Superposition for counting qubits
    { id: 'p2', gate: 'h', targets: [0], column: 1 },
    { id: 'p3', gate: 'h', targets: [1], column: 1 },
    // Controlled-U operations (e.g. T gate where U = P(pi/4), phase is 1/8)
    { id: 'p4', gate: 'cp', targets: [0, 2], angle: Math.PI / 4, column: 2 },
    { id: 'p5', gate: 'cp', targets: [1, 2], angle: Math.PI / 2, column: 3 },
    // Inverse QFT on counting qubits
    { id: 'p6', gate: 'swap', targets: [0, 1], column: 4 },
    { id: 'p7', gate: 'h', targets: [1], column: 5 },
    { id: 'p8', gate: 'cp', targets: [0, 1], angle: -Math.PI / 2, column: 6 },
    { id: 'p9', gate: 'h', targets: [0], column: 7 },
  ],
  measure: true,
  shots: 1000,
};

export const VQE_ANSATZ: CircuitRequest = {
  qubits: 2,
  classical_bits: 2,
  gates: [
    { id: 'v1', gate: 'rx', targets: [0], angle: Math.PI / 4, column: 0 },
    { id: 'v2', gate: 'rx', targets: [1], angle: Math.PI / 4, column: 0 },
    { id: 'v3', gate: 'cx', targets: [0, 1], column: 1 },
    { id: 'v4', gate: 'rz', targets: [0], angle: Math.PI / 2, column: 2 },
    { id: 'v5', gate: 'rz', targets: [1], angle: Math.PI / 2, column: 2 },
    { id: 'v6', gate: 'cx', targets: [0, 1], column: 3 },
  ],
  measure: true,
  shots: 1000,
};

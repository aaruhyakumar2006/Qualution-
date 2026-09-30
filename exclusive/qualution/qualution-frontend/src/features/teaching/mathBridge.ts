import type { ComplexNumber } from '../circuit/types';

export interface GroverMathStep {
  stepId: string;
  phaseName: string;
  latexFormula: string;
  explanation: string;
  meanAmplitude?: number;
  amplitudes: Record<string, ComplexNumber>;
  probabilities: Record<string, number>;
}

export function complexAdd(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return { real: a.real + b.real, imag: a.imag + b.imag };
}

export function complexMultiply(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real,
  };
}

export function probabilityFromAmplitude(c: ComplexNumber): number {
  return c.real * c.real + c.imag * c.imag;
}

export function calculateOptimalGroverIterations(numQubits: number, numMarked: number = 1): number {
  if (numQubits <= 0) throw new Error('numQubits must be greater than 0');
  if (numMarked <= 0) throw new Error('numMarked must be greater than 0');
  const searchSpace = Math.pow(2, numQubits);
  if (numMarked > searchSpace) throw new Error('numMarked cannot exceed search space size');
  const iters = Math.floor((Math.PI / 4) * Math.sqrt(searchSpace / numMarked));
  return Math.max(1, iters);
}

/**
 * Deterministic mathematical evolution of Grover 2-qubit algorithm searching for target |11⟩.
 * Matches the canonical equations in backend app/services/math/engine.py and bridge.py.
 */
export const GROVER_2Q_CANONICAL_MATH: Record<string, GroverMathStep> = {
  initial: {
    stepId: 'initial',
    phaseName: 'Ground State Initialization',
    latexFormula: '|\\psi_0\\rangle = |00\\rangle = \\begin{pmatrix} 1 \\\\ 0 \\\\ 0 \\\\ 0 \\end{pmatrix}',
    explanation: 'Both qubits begin in the ground state |00⟩ with 100% certainty.',
    amplitudes: {
      '00': { real: 1, imag: 0 },
      '01': { real: 0, imag: 0 },
      '10': { real: 0, imag: 0 },
      '11': { real: 0, imag: 0 },
    },
    probabilities: { '00': 1.0, '01': 0.0, '10': 0.0, '11': 0.0 },
  },
  superposition: {
    stepId: 'superposition',
    phaseName: 'Equal Superposition (H ⊗ H)',
    latexFormula: '|s\\rangle = H^{\\otimes 2}|00\\rangle = \\frac{1}{2}(|00\\rangle + |01\\rangle + |10\\rangle + |11\\rangle) = \\begin{pmatrix} 1/2 \\\\ 1/2 \\\\ 1/2 \\\\ 1/2 \\end{pmatrix}',
    explanation: 'Hadamard gates distribute amplitude equally across all N = 4 basis states: 25% probability each.',
    amplitudes: {
      '00': { real: 0.5, imag: 0 },
      '01': { real: 0.5, imag: 0 },
      '10': { real: 0.5, imag: 0 },
      '11': { real: 0.5, imag: 0 },
    },
    probabilities: { '00': 0.25, '01': 0.25, '10': 0.25, '11': 0.25 },
  },
  oracle: {
    stepId: 'oracle',
    phaseName: 'Oracle Phase Inversion',
    latexFormula: 'U_\\omega = I - 2|11\\rangle\\langle 11|, \\quad |\\psi_2\\rangle = \\frac{1}{2}(|00\\rangle + |01\\rangle + |10\\rangle - |11\\rangle)',
    explanation: 'Controlled-Z inverts the phase of target |11⟩: amplitude becomes -1/2. Measurement probabilities remain 25% because |-1/2|² = 0.25.',
    meanAmplitude: 0.25,
    amplitudes: {
      '00': { real: 0.5, imag: 0 },
      '01': { real: 0.5, imag: 0 },
      '10': { real: 0.5, imag: 0 },
      '11': { real: -0.5, imag: 0 },
    },
    probabilities: { '00': 0.25, '01': 0.25, '10': 0.25, '11': 0.25 },
  },
  diffuser: {
    stepId: 'diffuser',
    phaseName: 'Diffuser (Inversion About the Mean)',
    latexFormula: 'D = 2|s\\rangle\\langle s| - I, \\quad \\alpha_i\' = 2\\mu - \\alpha_i \\quad (\\mu = 0.25)',
    explanation: 'Reflecting about mean μ = 0.25: Non-targets: 2(0.25) - 0.5 = 0. Target |11⟩: 2(0.25) - (-0.5) = 1.0.',
    meanAmplitude: 0.25,
    amplitudes: {
      '00': { real: 0, imag: 0 },
      '01': { real: 0, imag: 0 },
      '10': { real: 0, imag: 0 },
      '11': { real: 1.0, imag: 0 },
    },
    probabilities: { '00': 0.0, '01': 0.0, '10': 0.0, '11': 1.0 },
  },
  measurement: {
    stepId: 'measurement',
    phaseName: 'Quantum Measurement Collapse',
    latexFormula: 'P(|11\\rangle) = |\\alpha_{11}|^2 = |1.0|^2 = 1.0 \\quad (100\\%)',
    explanation: 'All 1000 experimental shots collapse into marked state |11⟩ with 100% deterministic fidelity.',
    amplitudes: {
      '00': { real: 0, imag: 0 },
      '01': { real: 0, imag: 0 },
      '10': { real: 0, imag: 0 },
      '11': { real: 1.0, imag: 0 },
    },
    probabilities: { '00': 0.0, '01': 0.0, '10': 0.0, '11': 1.0 },
  },
};

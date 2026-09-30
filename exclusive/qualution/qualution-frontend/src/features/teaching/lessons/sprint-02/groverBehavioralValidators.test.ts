import { describe, it, expect } from 'vitest';
import type { CircuitRequest } from '../../../circuit/types';
import {
  validateGroverStage1,
  validateAndDiagnoseGroverOracle,
  validateAndDiagnoseGroverDiffusion,
  validateGroverStage4Measurement,
  validateGroverStage5Overshoot,
  validateGroverTransferChallenge,
} from './groverBehavioralValidators';

describe('groverBehavioralValidators (Phase 3 Behavioral Diagnosers)', () => {
  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 1 DIAGNOSES
  // ══════════════════════════════════════════════════════════════════════════
  describe('Stage 1 — Equal Superposition', () => {
    it('1. Passes when H is placed on q0 and q1 at col 0', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'h0', gate: 'h', targets: [0], column: 0 },
          { id: 'h1', gate: 'h', targets: [1], column: 0 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateGroverStage1(circuit);
      expect(result.isCorrect).toBe(true);
      expect(result.message).toContain('Superposition created');
    });

    it('2. Diagnoses when H is on only one wire', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [{ id: 'h0', gate: 'h', targets: [0], column: 0 }],
        measure: false,
        shots: 1000,
      };

      const result = validateGroverStage1(circuit);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toContain('Hadamard is only placed on wire q[0]');
    });

    it('3. Diagnoses when X gate is placed instead of H', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [{ id: 'x0', gate: 'x', targets: [0], column: 0 }],
        measure: false,
        shots: 1000,
      };

      const result = validateGroverStage1(circuit);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toContain('An X gate flips a qubit deterministically');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 2 DIAGNOSES (Section C Table)
  // ══════════════════════════════════════════════════════════════════════════
  describe('Stage 2 — Phase Oracle', () => {
    const baseHadamards = [
      { id: 'h0', gate: 'h', targets: [0], column: 0 },
      { id: 'h1', gate: 'h', targets: [1], column: 0 },
    ];

    it('4. Passes with direct Controlled-Z (CZ) oracle', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          ...baseHadamards,
          { id: 'cz', gate: 'cz', targets: [0, 1], column: 1 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateAndDiagnoseGroverOracle(circuit);
      expect(result.isCorrect).toBe(true);
      expect(result.solutionType).toBe('cz');
      expect(result.message).toContain("phase-flip oracle for |11⟩");
    });

    it('5. Passes with H-CX-H identity oracle', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          ...baseHadamards,
          { id: 'h-pre', gate: 'h', targets: [1], column: 1 },
          { id: 'cx', gate: 'cx', targets: [0, 1], column: 2 },
          { id: 'h-post', gate: 'h', targets: [1], column: 3 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateAndDiagnoseGroverOracle(circuit);
      expect(result.isCorrect).toBe(true);
      expect(result.solutionType).toBe('h_cx_h');
      expect(result.message).toContain('H-CX-H identity');
    });

    it('6. Diagnosis 2a: CX/CNOT without Hadamards leaves state unchanged', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          ...baseHadamards,
          { id: 'cx', gate: 'cx', targets: [0, 1], column: 1 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateAndDiagnoseGroverOracle(circuit);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toContain(
        'All four amplitudes are equal and CNOT only moves amplitude between boxes. Shuffling equal amplitudes changes nothing. We need to change a sign, not a position.'
      );
      expect(result.message).toContain('sandwich the target qubit in Hadamard');
    });

    it('7. Diagnosis 2b: Z on ONE wire flips two boxes', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          ...baseHadamards,
          { id: 'z0', gate: 'z', targets: [0], column: 1 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateAndDiagnoseGroverOracle(circuit);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toContain('That flipped two boxes');
      expect(result.message).toContain("it can't single out both wires being 1");
    });

    it('8. Diagnosis 2c: X or SWAP leaves equal amplitudes unchanged', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          ...baseHadamards,
          { id: 'swap', gate: 'swap', targets: [0, 1], column: 1 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateAndDiagnoseGroverOracle(circuit);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toBe(
        'All four amplitudes are equal and swapping or bit-flipping moves amplitude between boxes. Shuffling equal amplitudes changes nothing. We need to change a sign, not a position.'
      );
    });

    it('9. Diagnosis 2d: H again cancels superposition back to 00', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          ...baseHadamards,
          { id: 'h-again', gate: 'h', targets: [0], column: 1 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateAndDiagnoseGroverOracle(circuit);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toBe('Two Hadamards cancel; that undid the superposition.');
    });

    it('10. Diagnosis 2e: CZ placed before H gates (col 0) marks nothing', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'cz-early', gate: 'cz', targets: [0, 1], column: 0 },
          { id: 'h0', gate: 'h', targets: [0], column: 1 },
          { id: 'h1', gate: 'h', targets: [1], column: 1 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateAndDiagnoseGroverOracle(circuit);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toBe('At that point the register is 00, so there is no 11 to mark. Mark the boxes after they exist.');
    });

    it('11. Spotlight assistance offered after 2 failed attempts', () => {
      const circuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          ...baseHadamards,
          { id: 'wrong-gate', gate: 'x', targets: [0], column: 1 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateAndDiagnoseGroverOracle(circuit, 2);
      expect(result.isCorrect).toBe(false);
      expect(result.showSpotlight).toBe(true);
      expect(result.spotlightGate).toBe('cz');
      expect(result.spotlightTargets).toEqual([0, 1]);
      expect(result.spotlightColumn).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 3 DIAGNOSES (Diffusion Operator)
  // ══════════════════════════════════════════════════════════════════════════
  describe('Stage 3 — Grover Diffusion Operator', () => {
    const fullGroverCircuit: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        // Stage 1: Superposition
        { id: 'h0', gate: 'h', targets: [0], column: 0 },
        { id: 'h1', gate: 'h', targets: [1], column: 0 },
        // Stage 2: Oracle
        { id: 'cz-oracle', gate: 'cz', targets: [0, 1], column: 1 },
        // Stage 3 Chunk A: H
        { id: 'h-a0', gate: 'h', targets: [0], column: 2 },
        { id: 'h-a1', gate: 'h', targets: [1], column: 2 },
        // Stage 3 Chunk B: X - CZ - X
        { id: 'x-b0-pre', gate: 'x', targets: [0], column: 3 },
        { id: 'x-b1-pre', gate: 'x', targets: [1], column: 3 },
        { id: 'cz-diff', gate: 'cz', targets: [0, 1], column: 4 },
        { id: 'x-b0-post', gate: 'x', targets: [0], column: 5 },
        { id: 'x-b1-post', gate: 'x', targets: [1], column: 5 },
        // Stage 3 Chunk C: H
        { id: 'h-c0', gate: 'h', targets: [0], column: 6 },
        { id: 'h-c1', gate: 'h', targets: [1], column: 6 },
      ],
      measure: false,
      shots: 1000,
    };

    it('12. Passes authoritative behavioral validation on complete Grover circuit', () => {
      const result = validateAndDiagnoseGroverDiffusion(fullGroverCircuit);
      expect(result.isCorrect).toBe(true);
      expect(result.message).toContain(
        'that overall minus sign is a global phase; no measurement can see it.'
      );
    });

    it('13. Diagnosis 3a: Missing X gates (H-CZ-H) concentrates 100% on box 00', () => {
      const missingXCircuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          // Stage 1: Superposition
          { id: 'h0', gate: 'h', targets: [0], column: 0 },
          { id: 'h1', gate: 'h', targets: [1], column: 0 },
          // Stage 2: Oracle
          { id: 'cz-oracle', gate: 'cz', targets: [0, 1], column: 1 },
          // Chunk A: H
          { id: 'h-a0', gate: 'h', targets: [0], column: 2 },
          { id: 'h-a1', gate: 'h', targets: [1], column: 2 },
          // Middle CZ without X
          { id: 'cz-diff', gate: 'cz', targets: [0, 1], column: 4 },
          // Chunk C: H
          { id: 'h-c0', gate: 'h', targets: [0], column: 6 },
          { id: 'h-c1', gate: 'h', targets: [1], column: 6 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateAndDiagnoseGroverDiffusion(missingXCircuit);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toBe(
        'You found box 00 with certainty, which is the wrong box. Without the X gates the mirror is set on the wrong state. The X gates are what move it to the average.'
      );
    });

    it('14. Diagnosis 3b: Diffs circuit and identifies first differing gate and column', () => {
      // Chunk A missing: learner placed X at col 2 instead of H
      const wrongChunkACircuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'h0', gate: 'h', targets: [0], column: 0 },
          { id: 'h1', gate: 'h', targets: [1], column: 0 },
          { id: 'cz-oracle', gate: 'cz', targets: [0, 1], column: 1 },
          { id: 'wrong-x', gate: 'x', targets: [0], column: 2 }, // Expected H on q0
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateAndDiagnoseGroverDiffusion(wrongChunkACircuit);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toContain('Diffusion mismatch at column 2 on wire q[0]');
      expect(result.message).toContain('expected H (Chunk A (H on q0))');
      expect(result.message).toContain('found X');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // STAGES 4, 5, & TRANSFER CHALLENGE
  // ══════════════════════════════════════════════════════════════════════════
  describe('Stage 4, 5 & Transfer Challenge', () => {
    it('15. Stage 4 verifies measurements and high probability on |11⟩', () => {
      const measuredCircuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'm0', gate: 'measure', targets: [0], column: 7 },
          { id: 'm1', gate: 'measure', targets: [1], column: 7 },
        ],
        measure: true,
        shots: 1000,
      };

      const mockRunResult: any = {
        simulation: {
          shots: 1000,
          probabilities: { '11': 1.0 },
        },
      };

      const result = validateGroverStage4Measurement(measuredCircuit, mockRunResult);
      expect(result.isCorrect).toBe(true);
      expect(result.message).toContain('Target state |11⟩ verified');
    });

    it('16. Stage 5 verifies overshoot returns all 4 outcomes to ~25%', () => {
      const mockOvershootResult: any = {
        simulation: {
          shots: 1000,
          probabilities: {
            '00': 0.25,
            '01': 0.24,
            '10': 0.26,
            '11': 0.25,
          },
        },
      };

      const result = validateGroverStage5Overshoot(mockOvershootResult);
      expect(result.isCorrect).toBe(true);
      expect(result.message).toContain('all four outcomes collapsed back to a flat uniform distribution (~25% each');
    });

    it('17. Transfer Challenge verifies finding box |01⟩ by wrapping X around q0', () => {
      const transferCircuit: CircuitRequest = {
        qubits: 2,
        classical_bits: 2,
        gates: [
          // Superposition
          { id: 'h0', gate: 'h', targets: [0], column: 0 },
          { id: 'h1', gate: 'h', targets: [1], column: 0 },
          // Oracle for |01⟩: X on q0, CZ, X on q0
          { id: 'x-oracle-pre', gate: 'x', targets: [0], column: 1 },
          { id: 'cz-oracle', gate: 'cz', targets: [0, 1], column: 2 },
          { id: 'x-oracle-post', gate: 'x', targets: [0], column: 3 },
          // Diffusion (unchanged)
          { id: 'h-a0', gate: 'h', targets: [0], column: 4 },
          { id: 'h-a1', gate: 'h', targets: [1], column: 4 },
          { id: 'x-b0-pre', gate: 'x', targets: [0], column: 5 },
          { id: 'x-b1-pre', gate: 'x', targets: [1], column: 5 },
          { id: 'cz-diff', gate: 'cz', targets: [0, 1], column: 6 },
          { id: 'x-b0-post', gate: 'x', targets: [0], column: 7 },
          { id: 'x-b1-post', gate: 'x', targets: [1], column: 7 },
          { id: 'h-c0', gate: 'h', targets: [0], column: 8 },
          { id: 'h-c1', gate: 'h', targets: [1], column: 8 },
        ],
        measure: false,
        shots: 1000,
      };

      const result = validateGroverTransferChallenge(transferCircuit);
      expect(result.isCorrect).toBe(true);
      expect(result.message).toContain('Transfer Challenge Mastered');
    });
  });
});

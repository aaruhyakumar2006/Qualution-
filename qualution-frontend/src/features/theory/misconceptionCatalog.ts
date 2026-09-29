/**
 * misconceptionCatalog.ts
 *
 * PHASE 16: Structured, Explainable Quantum Misconception Catalog.
 *
 * Defines explicit misconception rules grounded in quantum mechanics education.
 * Every rule defines unambiguous response patterns without relying on LLMs or
 * speculative heuristics.
 */

export interface MisconceptionRule {
  id: string;
  concept: string;
  name: string;
  description: string;
  /**
   * Educational, learner-facing remediation guidance (no internal IDs exposed).
   */
  learnerFeedback: string;
  /**
   * Specific options or answers across checkpoints/assessments that indicate this misconception.
   */
  matchingAnswers: {
    checkpointOptionIds?: string[];
    checkpointTexts?: string[];
    assessmentOptionIds?: string[];
    assessmentTexts?: string[];
  };
}

export const MISCONCEPTION_CATALOG: Record<string, MisconceptionRule> = {
  'measurement-deterministic': {
    id: 'measurement-deterministic',
    concept: 'measurement',
    name: 'Deterministic Measurement Assumption',
    description: 'Learner expects a single deterministic measurement outcome (e.g. Always 0 or Always 1) from an equal superposition state.',
    learnerFeedback: "Let's revisit one key idea: measuring a quantum superposition state like |+⟩ does not produce a single fixed outcome. Repeated measurements yield 0 and 1 with approximately equal probability (~50/50).",
    matchingAnswers: {
      checkpointOptionIds: ['a', 'b'], // 'Always 0' or 'Always 1' in measure-plus checkpoint
      assessmentOptionIds: ['a', 'b'],  // 'Always 0' or 'Always 1' in superposition-final assessment
      checkpointTexts: ['always 0', 'always 1'],
      assessmentTexts: ['always 0', 'always 1'],
    },
  },

  'superposition-not-mixture': {
    id: 'superposition-not-mixture',
    concept: 'superposition',
    name: 'Superposition as Classical Mixture',
    description: 'Learner treats quantum superposition as an ignorance-based classical probability mixture before measurement.',
    learnerFeedback: "Remember: a qubit in superposition |+⟩ is not simply 'either 0 or 1' with hidden information. It exists in a genuine linear combination of basis states with quantum phase.",
    matchingAnswers: {
      checkpointOptionIds: ['d'],
      assessmentOptionIds: ['d'],
      checkpointTexts: ['classical mixture', 'measurement is impossible', 'hidden variable'],
      assessmentTexts: ['classical mixture', 'measurement cannot occur'],
    },
  },

  'hadamard-inverts-classical': {
    id: 'hadamard-inverts-classical',
    concept: 'hadamard',
    name: 'Hadamard as Bit Flip',
    description: 'Learner conflates the Hadamard gate (superposition creator) with the Pauli-X gate (NOT / bit-flip).',
    learnerFeedback: "The Hadamard gate does not merely flip 0 to 1 like a NOT gate; it transforms basis states into equal superpositions (e.g., H|0⟩ = |+⟩).",
    matchingAnswers: {
      checkpointOptionIds: ['b'],
      assessmentOptionIds: ['b'],
      checkpointTexts: ['flips to 1', 'always 1'],
      assessmentTexts: ['always 1'],
    },
  },

  'grover-oracle-bit-flip': {
    id: 'grover-oracle-bit-flip',
    concept: 'grover-oracle',
    name: 'Conflating Bit-Flip with Phase Inversion',
    description: 'Learner applies an X or bit-flip gate instead of a phase inversion, altering computational basis populations instead of amplitudes.',
    learnerFeedback: "An X gate flips |0⟩ ↔ |1⟩ (a classical bit-flip), which permutes basis amplitudes rather than inverting the quantum phase. The Grover oracle must preserve computational basis states and only negate the amplitude sign of |11⟩ (… → -|11⟩).",
    matchingAnswers: {
      checkpointTexts: ['bit flip', 'pauli-x', 'x gate on q0'],
      assessmentTexts: ['bit flip', 'x gate'],
    },
  },

  'grover-oracle-single-qubit-phase': {
    id: 'grover-oracle-single-qubit-phase',
    concept: 'grover-oracle',
    name: 'Unconditional / Single-Qubit Phase Shift',
    description: 'Learner applies a single-qubit Z gate instead of a conditional 2-qubit CZ gate, affecting multiple basis states indiscriminately.',
    learnerFeedback: "A single-qubit Z gate inverts any state where that specific qubit is 1 — which flips both |10⟩ and |11⟩ (or |01⟩ and |11⟩). The Grover oracle must be an entangled 2-qubit interaction (CZ) that only inverts when BOTH qubits are 1.",
    matchingAnswers: {
      checkpointTexts: ['single z gate', 'z gate on q0', 'z gate on q1'],
      assessmentTexts: ['z gate'],
    },
  },

  'grover-oracle-cnot-without-hadamard': {
    id: 'grover-oracle-cnot-without-hadamard',
    concept: 'grover-oracle',
    name: 'Bare CNOT as Phase Oracle without Basis Rotation',
    description: 'Learner uses a bare CX gate without sandwiching Hadamards, resulting in a conditional bit-flip instead of a conditional phase flip.',
    learnerFeedback: "A bare CNOT gate performs a conditional bit-flip (X), swapping |11⟩ ↔ |10⟩ instead of applying a phase inversion. To use CNOT as a phase-flip oracle, you must sandwich the target qubit in Hadamard gates (H · CX · H = CZ).",
    matchingAnswers: {
      checkpointTexts: ['bare cnot', 'cx without hadamard'],
      assessmentTexts: ['cnot only'],
    },
  },
};

/**
 * Retrieves a misconception definition by ID.
 */
export function getMisconceptionRule(id: string): MisconceptionRule | null {
  return MISCONCEPTION_CATALOG[id] || null;
}

import type { ConceptDefinition } from './progressTypes';

export const CANONICAL_CONCEPTS: ConceptDefinition[] = [
  // FOUNDATIONS
  {
    id: 'qubit',
    name: 'Quantum Bit (Qubit)',
    category: 'foundations',
    prerequisites: [],
    description: 'Fundamental unit of quantum information existing as a 2-dimensional Hilbert state.',
  },
  {
    id: 'computational_basis',
    name: 'Computational Basis (|0⟩, |1⟩)',
    category: 'foundations',
    prerequisites: ['qubit'],
    description: 'Standard orthogonal coordinate basis representing classical binary outcomes.',
  },
  {
    id: 'measurement',
    name: 'Quantum Measurement',
    category: 'foundations',
    prerequisites: ['computational_basis'],
    description: 'Born rule projection collapsing quantum superposition into classical outcomes.',
  },
  {
    id: 'probability_amplitude',
    name: 'Probability Amplitude',
    category: 'foundations',
    prerequisites: ['measurement'],
    description: 'Complex coefficients whose squared magnitude represents outcome probability.',
  },
  {
    id: 'statevector',
    name: 'Quantum Statevector',
    category: 'foundations',
    prerequisites: ['probability_amplitude'],
    description: 'Normalized complex vector fully describing pure quantum register states.',
  },

  // GATES
  {
    id: 'hadamard',
    name: 'Hadamard Gate (H)',
    category: 'gates',
    prerequisites: ['qubit', 'computational_basis'],
    description: 'Creates equal superposition between |0⟩ and |1⟩.',
  },
  {
    id: 'pauli_x',
    name: 'Pauli-X Gate (NOT)',
    category: 'gates',
    prerequisites: ['qubit'],
    description: 'Standard quantum bit-flip operator around the X-axis.',
  },
  {
    id: 'pauli_y',
    name: 'Pauli-Y Gate',
    category: 'gates',
    prerequisites: ['qubit', 'probability_amplitude'],
    description: 'Pauli operator combining bit flip and relative phase shift.',
  },
  {
    id: 'pauli_z',
    name: 'Pauli-Z Gate (Phase Flip)',
    category: 'gates',
    prerequisites: ['qubit'],
    description: 'Flips the relative sign of |1⟩ while leaving |0⟩ invariant.',
  },
  {
    id: 'phase',
    name: 'Phase Gates (S, T)',
    category: 'gates',
    prerequisites: ['pauli_z'],
    description: 'Discrete fractional phase rotations (π/2 and π/4) around the Z-axis.',
  },
  {
    id: 'rotations',
    name: 'Continuous Rotations (Rx, Ry, Rz)',
    category: 'gates',
    prerequisites: ['phase'],
    description: 'Parameterized continuous single-qubit rotations by arbitrary angles.',
  },
  {
    id: 'controlled_gates',
    name: 'Controlled Gates (CX, CZ)',
    category: 'gates',
    prerequisites: ['hadamard', 'pauli_x'],
    description: 'Two-qubit conditional gates that entangle or conditionally flip target qubits.',
  },
  {
    id: 'swap',
    name: 'SWAP Gate',
    category: 'gates',
    prerequisites: ['controlled_gates'],
    description: 'Exchanges the quantum states of two designated qubit wires.',
  },

  // CORE CONCEPTS
  {
    id: 'superposition',
    name: 'Quantum Superposition',
    category: 'core_concepts',
    prerequisites: ['hadamard'],
    description: 'Linear combination of basis states prior to measurement collapse.',
  },
  {
    id: 'interference',
    name: 'Quantum Interference',
    category: 'core_concepts',
    prerequisites: ['superposition', 'probability_amplitude'],
    description: 'Constructive and destructive amplitude cancellation driving quantum algorithms.',
  },
  {
    id: 'entanglement',
    name: 'Quantum Entanglement',
    category: 'core_concepts',
    prerequisites: ['controlled_gates', 'superposition'],
    description: 'Non-separable quantum state with non-local correlations across subsystems.',
  },
  {
    id: 'quantum_phase',
    name: 'Relative Phase',
    category: 'core_concepts',
    prerequisites: ['phase'],
    description: 'Observable complex phase angle distinguishing states like |+⟩ and |-⟩.',
  },
  {
    id: 'global_phase',
    name: 'Global Phase',
    category: 'core_concepts',
    prerequisites: ['quantum_phase'],
    description: 'Unobservable overall complex factor e^(iθ) with no physical difference.',
  },
  {
    id: 'bloch_sphere',
    name: 'Bloch Sphere Geometry',
    category: 'core_concepts',
    prerequisites: ['rotations', 'quantum_phase'],
    description: '3D geometrical sphere mapping pure and mixed single-qubit density states.',
  },

  // CIRCUITS
  {
    id: 'circuit_depth',
    name: 'Circuit Depth',
    category: 'circuits',
    prerequisites: ['gates'],
    description: 'Longest path of sequentially dependent operations determining circuit latency.',
  },
  {
    id: 'circuit_composition',
    name: 'Circuit Composition',
    category: 'circuits',
    prerequisites: ['circuit_depth'],
    description: 'Assembling multi-wire registers and column-aligned unitary sequences.',
  },
  {
    id: 'measurement_distribution',
    name: 'Measurement Distribution',
    category: 'circuits',
    prerequisites: ['measurement'],
    description: 'Empirical shot frequency histograms vs exact theoretical probabilities.',
  },
  {
    id: 'state_evolution',
    name: 'State Evolution Timeline',
    category: 'circuits',
    prerequisites: ['statevector', 'circuit_composition'],
    description: 'Step-by-step unitary transformation of amplitudes across the execution timeline.',
  },

  // ALGORITHMS
  {
    id: 'bell_state',
    name: 'Bell State Generation',
    category: 'algorithms',
    prerequisites: ['hadamard', 'controlled_gates', 'entanglement'],
    description: 'Canonical 2-qubit maximally entangled EPR pair (|00⟩ + |11⟩)/√2.',
  },
  {
    id: 'ghz_state',
    name: 'GHZ State Multi-Entanglement',
    category: 'algorithms',
    prerequisites: ['bell_state'],
    description: 'Multi-qubit tripartite entangled state (|000...⟩ + |111...⟩)/√2.',
  },
  {
    id: 'deutsch',
    name: 'Deutsch Algorithm',
    category: 'algorithms',
    prerequisites: ['hadamard', 'interference'],
    description: 'Evaluates if a single-bit function is constant or balanced in 1 query.',
  },
  {
    id: 'deutsch_jozsa',
    name: 'Deutsch-Jozsa Algorithm',
    category: 'algorithms',
    prerequisites: ['deutsch'],
    description: 'N-bit generalization demonstrating deterministic quantum advantage.',
  },
  {
    id: 'bernstein_vazirani',
    name: 'Bernstein-Vazirani Algorithm',
    category: 'algorithms',
    prerequisites: ['deutsch_jozsa'],
    description: 'Determines an N-bit hidden bitstring in a single oracle query.',
  },
  {
    id: 'grover',
    name: 'Grover Search Algorithm',
    category: 'algorithms',
    prerequisites: ['interference', 'superposition'],
    description: 'Quadratic speedup for unstructured database and oracle searching.',
  },
  {
    id: 'teleportation',
    name: 'Quantum Teleportation Protocol',
    category: 'algorithms',
    prerequisites: ['bell_state', 'measurement'],
    description: 'Transfers unknown quantum states using entanglement and 2 classical bits.',
  },
  {
    id: 'qft',
    name: 'Quantum Fourier Transform',
    category: 'algorithms',
    prerequisites: ['rotations', 'phase'],
    description: 'Linear transformation on quantum amplitudes mapping computational to phase basis.',
  },
  {
    id: 'vqe',
    name: 'Variational Quantum Eigensolver (VQE)',
    category: 'algorithms',
    prerequisites: ['rotations', 'measurement_distribution'],
    description: 'Hybrid quantum-classical optimization finding ground state energies.',
  },
  {
    id: 'qaoa',
    name: 'QAOA Optimization',
    category: 'algorithms',
    prerequisites: ['vqe'],
    description: 'Quantum Approximate Optimization Algorithm for combinatorial problems.',
  },
];

export const CONCEPTS_BY_ID: Record<string, ConceptDefinition> = CANONICAL_CONCEPTS.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<string, ConceptDefinition>
);

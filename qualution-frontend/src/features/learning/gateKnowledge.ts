import type { GateKnowledge } from './learningTypes';

export const GATE_KNOWLEDGE_CATALOG: Record<string, GateKnowledge> = {
  h: {
    gate: 'h',
    name: 'Hadamard Gate',
    category: 'superposition',
    beginnerDescription:
      'Creates a 50/50 superposition by mapping definite states |0⟩ and |1⟩ into equal-amplitude combinations.',
    technicalDescription:
      'Performs a π rotation around the (X+Z)/√2 axis, converting computational basis states into X-basis eigenstates |+⟩ and |−⟩.',
    matrix: ['1/√2 [ 1   1 ]', '     [ 1  -1 ]'],
    equations: {
      stateTransition: '|0⟩ → (|0⟩ + |1⟩)/√2  =  |+⟩\n|1⟩ → (|0⟩ - |1⟩)/√2  =  |−⟩',
      transformation: 'H|ψ⟩ = (X + Z)/√2 |ψ⟩',
    },
    blochEffect: 'Rotates the state vector from the Z-axis (+1 or -1) to the positive or negative X-axis.',
    commonUses: ['Superposition initialization', 'Interference generation', 'Quantum Fourier Transform', 'Qubit basis change'],
  },
  x: {
    gate: 'x',
    name: 'Pauli-X Gate',
    category: 'pauli',
    beginnerDescription:
      'The quantum equivalent of a classical NOT gate. It flips |0⟩ to |1⟩ and |1⟩ to |0⟩.',
    technicalDescription:
      'Performs a π rotation around the X-axis of the Bloch sphere, inverting computational basis amplitudes.',
    matrix: ['[ 0  1 ]', '[ 1  0 ]'],
    equations: {
      stateTransition: '|0⟩ → |1⟩\n|1⟩ → |0⟩',
      transformation: 'X (α|0⟩ + β|1⟩) = β|0⟩ + α|1⟩',
    },
    blochEffect: 'Rotates 180° around the X-axis, mirroring states across the Y-Z plane.',
    commonUses: ['Bit flipping', 'State initialization into |1⟩', 'Parity checks'],
  },
  y: {
    gate: 'y',
    name: 'Pauli-Y Gate',
    category: 'pauli',
    beginnerDescription:
      'Combines a bit flip (like X) and a phase flip (like Z) along with an imaginary phase factor i.',
    technicalDescription:
      'Performs a π rotation around the Y-axis of the Bloch sphere, introducing a relative phase shift of i.',
    matrix: ['[  0  -i ]', '[  i   0 ]'],
    equations: {
      stateTransition: '|0⟩ → i|1⟩\n|1⟩ → -i|0⟩',
      transformation: 'Y = i X Z',
    },
    blochEffect: 'Rotates 180° around the Y-axis of the Bloch sphere.',
    commonUses: ['Basis transformation', 'Hamiltonian simulation', 'Quantum error correction'],
  },
  z: {
    gate: 'z',
    name: 'Pauli-Z Gate',
    category: 'pauli',
    beginnerDescription:
      'Flips the quantum phase of the |1⟩ state by 180° without changing measurement probabilities.',
    technicalDescription:
      'Applies a phase shift of e^(iπ) = -1 to the |1⟩ basis state, leaving |0⟩ unchanged.',
    matrix: ['[ 1   0 ]', '[ 0  -1 ]'],
    equations: {
      stateTransition: '|0⟩ → |0⟩\n|1⟩ → -|1⟩',
      transformation: 'Z (α|0⟩ + β|1⟩) = α|0⟩ - β|1⟩',
    },
    blochEffect: 'Rotates 180° around the Z-axis, swapping |+⟩ and |−⟩ states along the X-axis.',
    commonUses: ['Phase kickback', 'Sign flipping', 'Interference alignment in Grover search'],
  },
  s: {
    gate: 's',
    name: 'Phase Gate (S)',
    category: 'phase',
    beginnerDescription:
      'Applies a quarter-turn (90°) phase shift to the |1⟩ state. Often called the √Z gate.',
    technicalDescription:
      'Applies a relative phase shift of e^(iπ/2) = i to the |1⟩ state; S² = Z.',
    matrix: ['[ 1  0 ]', '[ 0  i ]'],
    equations: {
      stateTransition: '|0⟩ → |0⟩\n|1⟩ → i|1⟩',
      transformation: 'S|ψ⟩ = Rz(π/2)|ψ⟩ (up to global phase)',
    },
    blochEffect: 'Rotates 90° clockwise around the Z-axis of the Bloch sphere.',
    commonUses: ['Clifford group operations', 'Creating Y-basis states from X-basis states'],
  },
  t: {
    gate: 't',
    name: 'T Gate (π/8 Gate)',
    category: 'phase',
    beginnerDescription:
      'Applies an eighth-turn (45°) phase shift to the |1⟩ state. Essential for universal quantum computation.',
    technicalDescription:
      'Applies a phase shift of e^(iπ/4) to |1⟩; T² = S, T⁴ = Z. Enables non-Clifford fault-tolerant universality.',
    matrix: ['[ 1      0     ]', '[ 0  e^(iπ/4) ]'],
    equations: {
      stateTransition: '|0⟩ → |0⟩\n|1⟩ → e^(iπ/4)|1⟩',
      transformation: 'T|ψ⟩ = Rz(π/4)|ψ⟩ (up to global phase)',
    },
    blochEffect: 'Rotates 45° around the Z-axis of the Bloch sphere.',
    commonUses: ['Universal quantum gate sets', 'Magic state distillation', 'Fine phase rotation'],
  },
  rx: {
    gate: 'rx',
    name: 'Rotation-X (Rx)',
    category: 'rotation',
    beginnerDescription:
      'Rotates the quantum state smoothly around the X-axis by a specified angle θ (in radians).',
    technicalDescription:
      'Exponential Hamiltonian evolution under Pauli-X: Rx(θ) = exp(-i θ X / 2) = cos(θ/2) I - i sin(θ/2) X.',
    matrix: ['[ cos(θ/2)   -i sin(θ/2) ]', '[ -i sin(θ/2)   cos(θ/2) ]'],
    equations: {
      stateTransition: '|0⟩ → cos(θ/2)|0⟩ - i sin(θ/2)|1⟩\n|1⟩ → -i sin(θ/2)|0⟩ + cos(θ/2)|1⟩',
      transformation: 'Rx(θ) = exp(-i θ X / 2)',
    },
    blochEffect: 'Continuous rotation of angle θ around the X-axis vector.',
    commonUses: ['Variational Quantum Eigensolvers (VQE)', 'Continuous state preparation', 'QAOA ansatz'],
  },
  ry: {
    gate: 'ry',
    name: 'Rotation-Y (Ry)',
    category: 'rotation',
    beginnerDescription:
      'Rotates the quantum state around the Y-axis by angle θ, adjusting real-valued superposition amplitudes.',
    technicalDescription:
      'Evolution under Pauli-Y: Ry(θ) = exp(-i θ Y / 2) = cos(θ/2) I - i sin(θ/2) Y, preserving purely real amplitudes.',
    matrix: ['[ cos(θ/2)  -sin(θ/2) ]', '[ sin(θ/2)   cos(θ/2) ]'],
    equations: {
      stateTransition: '|0⟩ → cos(θ/2)|0⟩ + sin(θ/2)|1⟩\n|1⟩ → -sin(θ/2)|0⟩ + cos(θ/2)|1⟩',
      transformation: 'Ry(θ) = exp(-i θ Y / 2)',
    },
    blochEffect: 'Continuous rotation of angle θ around the Y-axis vector.',
    commonUses: ['Arbitrary real-amplitude superposition', 'Quantum Machine Learning', 'VQE parameterized circuits'],
  },
  rz: {
    gate: 'rz',
    name: 'Rotation-Z (Rz)',
    category: 'rotation',
    beginnerDescription:
      'Rotates the quantum state around the Z-axis by angle θ, adjusting the relative quantum phase.',
    technicalDescription:
      'Evolution under Pauli-Z: Rz(θ) = exp(-i θ Z / 2) = diag(e^(-iθ/2), e^(iθ/2)).',
    matrix: ['[ e^(-iθ/2)     0     ]', '[    0      e^(iθ/2) ]'],
    equations: {
      stateTransition: '|0⟩ → e^(-iθ/2)|0⟩\n|1⟩ → e^(iθ/2)|1⟩',
      transformation: 'Rz(θ) = exp(-i θ Z / 2)',
    },
    blochEffect: 'Continuous rotation of angle θ around the Z-axis (latitude line).',
    commonUses: ['Phase estimation', 'Diagonal unitary synthesis', 'Quantum chemistry Hamiltonian mapping'],
  },
  cx: {
    gate: 'cx',
    name: 'Controlled-NOT (CX / CNOT)',
    category: 'two-qubit',
    beginnerDescription:
      'Flips the target qubit if and only if the control qubit is in state |1⟩. The primary tool for creating quantum entanglement.',
    technicalDescription:
      'Two-qubit entangling unitary: |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ X. Maps product states into maximally entangled Bell states when control is in superposition.',
    matrix: ['[ 1 0 0 0 ]', '[ 0 1 0 0 ]', '[ 0 0 0 1 ]', '[ 0 0 1 0 ]'],
    equations: {
      stateTransition: '|00⟩ → |00⟩\n|01⟩ → |01⟩\n|10⟩ → |11⟩\n|11⟩ → |10⟩',
      transformation: 'CX |c, t⟩ = |c, c ⊕ t⟩',
    },
    blochEffect: 'Non-local operation that entangles two qubits, making individual single-qubit Bloch vectors indeterminate.',
    commonUses: ['Bell & GHZ state preparation', 'Quantum error correction syndrome extraction', 'Quantum teleportation'],
  },
  cz: {
    gate: 'cz',
    name: 'Controlled-Phase / Controlled-Z (CZ)',
    category: 'two-qubit',
    beginnerDescription:
      'Applies a phase flip (-1) if and only if both qubits are in state |1⟩. Symmetric between control and target.',
    technicalDescription:
      'Two-qubit unitary: diag(1, 1, 1, -1). Symmetric entangler equivalent to (I ⊗ H) CX (I ⊗ H).',
    matrix: ['[ 1 0 0  0 ]', '[ 0 1 0  0 ]', '[ 0 0 1  0 ]', '[ 0 0 0 -1 ]'],
    equations: {
      stateTransition: '|00⟩ → |00⟩\n|01⟩ → |01⟩\n|10⟩ → |10⟩\n|11⟩ → -|11⟩',
      transformation: 'CZ |c, t⟩ = (-1)^(c·t) |c, t⟩',
    },
    blochEffect: 'Entangles two qubits through conditional phase shifts.',
    commonUses: ['Cluster state generation in measurement-based quantum computing', 'Surface codes'],
  },
  swap: {
    gate: 'swap',
    name: 'SWAP Gate',
    category: 'two-qubit',
    beginnerDescription:
      'Exchanges the quantum states of two qubits: state of q0 moves to q1 and vice versa.',
    technicalDescription:
      'Two-qubit permutation unitary: |00⟩⟨00| + |01⟩⟨10| + |10⟩⟨01| + |11⟩⟨11|. Synthesizable via 3 alternating CNOT gates.',
    matrix: ['[ 1 0 0 0 ]', '[ 0 0 1 0 ]', '[ 0 1 0 0 ]', '[ 0 0 0 1 ]'],
    equations: {
      stateTransition: '|01⟩ ↔ |10⟩\n|00⟩ → |00⟩\n|11⟩ → |11⟩',
      transformation: 'SWAP |a, b⟩ = |b, a⟩',
    },
    blochEffect: 'Swaps the coordinates of the two individual qubit states.',
    commonUses: ['Qubit routing on constrained quantum hardware architectures', 'Quantum sorting algorithms'],
  },
};

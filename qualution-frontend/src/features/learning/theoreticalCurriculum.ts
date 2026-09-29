export interface TheorySection {
  id: string;
  title: string;
  content: string[];
  formula?: string;
  formulaCaption?: string;
  keyTakeaway?: string;
  callout?: {
    type: 'info' | 'tip' | 'warning' | 'insight';
    title: string;
    text: string;
  };
}

export interface TheoryQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptTag: string;
}

export interface TheoreticalLesson {
  id: string;
  lessonNumber: number;
  sprintNumber: number;
  sprintTitle: string;
  title: string;
  tag: string;
  difficulty: 'Beginner';
  estimatedDuration: string;
  xpReward: number;
  description: string;
  video?: {
    src: string;
    poster?: string;
    durationSeconds?: number;
    title?: string;
  };
  learningObjectives: string[];
  sections: TheorySection[];
  practicalConnection?: {
    lessonId: string;
    label: string;
    description: string;
  };
  quiz?: TheoryQuizQuestion;
  knowledgeCheckQuestions?: TheoryQuizQuestion[];
  assessmentQuestions?: TheoryQuizQuestion[];
  isAssessment?: boolean;
  isKnowledgeCheck?: boolean;
}

export const THEORETICAL_SPRINT_1_LESSONS: TheoreticalLesson[] = [
  // ── Lesson 1: Classical Bits vs. Qubits ─────────────────────────
  {
    id: 's1-theory-what-is-quantum',
    lessonNumber: 1,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'Classical Bits vs. Qubits',
    tag: 'Foundations',
    difficulty: 'Beginner',
    estimatedDuration: '1:40 min',
    xpReward: 100,
    description: 'Understand the fundamental shift from classical deterministic bits to quantum states, superposition, and entanglement.',
    video: {
      src: '/player',
      poster: '/videos/lesson01_demo_bits_to_qubits_poster.png',
      durationSeconds: 100,
      title: 'Classical Bits vs. Qubits',
    },
    learningObjectives: [
      'Understand the core architectural differences between classical and quantum computing.',
      'Explain why quantum computers manipulate probability amplitudes rather than binary bitstrings.',
      'Recognize qubits as the fundamental information units of quantum hardware.',
      'Develop accurate, hype-free intuition for quantum computational advantages.',
    ],
    sections: [
      {
        id: 'sec-1-classical-vs-quantum',
        title: '1. Classical vs. Quantum Computing',
        content: [
          'Classical computers—from smartphones to supercomputers—process information encoded into binary digits (bits). At any given moment, a classical bit physically exists in exactly one of two discrete voltage states: 0 (off) or 1 (on).',
          'A quantum computer, in contrast, encodes information into quantum bits (qubits). Because qubits obey the laws of quantum mechanics, a qubit is not confined to being solely 0 or 1. Instead, it can exist in a continuous mathematical space of linear superpositions of both states simultaneously.',
        ],
        formula: 'Bit \\in \\{0, 1\\} \\quad \\longleftrightarrow \\quad |\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle',
        formulaCaption: 'Classical discrete bit values vs. continuous complex quantum state vectors',
        keyTakeaway: 'Classical bits are discrete and deterministic; qubits exist in a continuous complex vector space.',
      },
      {
        id: 'sec-2-why-different',
        title: '2. Why Quantum Computing Is Fundamentally Different',
        content: [
          'Quantum computing is not simply "classical computing with faster clock speeds." It represents a fundamentally distinct model of computation governed by three physical phenomena: Superposition, Interference, and Entanglement.',
          'While a classical register of n bits can represent exactly one 2^n binary combination at a time, an n-qubit quantum state vector holds 2^n complex probability amplitudes simultaneously. By executing quantum gates, algorithms manipulate all 2^n amplitudes concurrently.',
        ],
        callout: {
          type: 'insight',
          title: 'Quantum Advantage Intuition',
          text: 'Quantum algorithms do not merely try every answer in parallel; they use quantum interference to cancel out wrong answers destructively while amplifying the correct answer constructively before measurement.',
        },
      },
      {
        id: 'sec-3-qubit-unit',
        title: '3. Qubits: The Basic Unit of Quantum Information',
        content: [
          'A qubit is any physical two-level quantum system. Physical implementations include superconducting circuits (transmons), trapped ions, photonic waveguides, and semiconductor quantum dots.',
          'Regardless of physical substrate, all qubits share the same mathematical formalism: a two-dimensional complex Hilbert space spanned by the orthonormal basis states |0⟩ and |1⟩.',
        ],
        keyTakeaway: 'Any two-level quantum mechanical system governed by 2D Hilbert space mathematics functions as a qubit.',
      },
      {
        id: 'sec-4-high-level-intuition',
        title: '4. High-Level Intuition for Beginners',
        content: [
          'Think of a classical bit like a coin lying flat on a table: it is either showing Heads (0) or Tails (1).',
          'A qubit is like a coin spinning in continuous motion. While spinning, it has aspects of both Heads and Tails with continuous probability amplitudes. When you stop the coin (measurement), it collapses into a definite Head or Tail.',
        ],
      },
    ],
    quiz: {
      id: 'q-s1-1',
      question: 'What is the primary difference between a classical bit and a quantum qubit?',
      options: [
        'A classical bit has faster clock frequencies than a qubit.',
        'A classical bit is strictly 0 or 1, whereas a qubit can exist in a linear superposition of |0⟩ and |1⟩.',
        'A qubit can hold infinite amounts of classical data without measurement.',
        'A qubit only works with negative numbers.',
      ],
      correctIndex: 1,
      explanation: 'Classical bits are strictly binary (0 or 1). Qubits exist in a 2-dimensional complex vector space, allowing linear superpositions of |0⟩ and |1⟩ prior to measurement.',
      conceptTag: 'Foundations',
    },
  },

  // ── Lesson 2: Qubits & Quantum States ─────────────────────────────
  {
    id: 's1-theory-qubits-states',
    lessonNumber: 2,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'Qubits & Quantum States',
    tag: 'Quantum States',
    difficulty: 'Beginner',
    estimatedDuration: '5–6 min',
    xpReward: 120,
    description: 'Explore the mathematical language of quantum computing: Dirac bra-ket notation, state vectors, and complex amplitudes.',
    learningObjectives: [
      'Learn Dirac bra-ket notation (|ψ⟩) for expressing quantum states.',
      'Represent single-qubit states as two-dimensional complex column vectors.',
      'Understand the role of probability amplitude coefficients α and β.',
      'Contrast the continuous nature of quantum state space with discrete classical bits.',
    ],
    sections: [
      {
        id: 'sec-2-what-qubit-represents',
        title: '1. What a Qubit Represents',
        content: [
          'Mathematically, a qubit represents a normalized vector in a 2-dimensional complex vector space (Hilbert space denoted \\mathbb{C}^2).',
          'The state of a qubit contains all the probabilistic information about how that qubit will interact with quantum gates and how it will behave when measured.',
        ],
      },
      {
        id: 'sec-2-dirac-notation',
        title: '2. Quantum State Notation (Dirac Notation)',
        content: [
          'Physicist Paul Dirac introduced "bra-ket" notation to represent quantum states cleanly. A quantum state vector is written inside a "ket": |ψ⟩ (pronounced "ket psi").',
          'The fundamental basis states are denoted |0⟩ ("ket zero") and |1⟩ ("ket one"). Any arbitrary pure single-qubit state |ψ⟩ is written as a linear combination of these basis vectors.',
        ],
        formula: '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle = \\begin{pmatrix} \\alpha \\\\ \\beta \\end{pmatrix}',
        formulaCaption: 'Ket notation and its equivalent 2D column vector representation',
        keyTakeaway: 'The ket |ψ⟩ is shorthand for a column vector whose components are complex amplitudes α and β.',
      },
      {
        id: 'sec-2-intro-state-vectors',
        title: '3. State Vectors at an Introductory Level',
        content: [
          'In the vector representation, the top entry represents the amplitude along the |0⟩ axis, and the bottom entry represents the amplitude along the |1⟩ axis.',
          'The coefficients α and β are complex numbers (\\alpha, \\beta \\in \\mathbb{C}). This means they have both a magnitude and an angle (phase), which enables quantum interference.',
        ],
        callout: {
          type: 'info',
          title: 'Geometric Interpretation',
          text: 'Because quantum states are normalized (|α|² + |β|² = 1), any pure single-qubit state can be mapped to a unique point on the surface of a unit sphere called the Bloch Sphere.',
        },
      },
      {
        id: 'sec-2-classical-vs-qubit-diff',
        title: '4. Summary: Bit vs. Qubit',
        content: [
          'Classical bit: Belongs to discrete set {0, 1}. State space consists of 2 isolated points.',
          'Quantum bit: Belongs to continuous sphere of complex superpositions. State space consists of uncountably infinite vectors constrained by |α|² + |β|² = 1.',
        ],
      },
    ],
    quiz: {
      id: 'q-s1-2',
      question: 'In the state vector |ψ⟩ = α|0⟩ + β|1⟩, what do α and β represent?',
      options: [
        'The classical voltage and current of the circuit.',
        'Complex probability amplitudes whose squared magnitudes determine measurement probabilities.',
        'The number of gates executed on the qubit.',
        'The physical temperature of the quantum processor.',
      ],
      correctIndex: 1,
      explanation: 'α and β are complex probability amplitudes. By the Born Rule, |α|² gives the probability of measuring 0, and |β|² gives the probability of measuring 1.',
      conceptTag: 'Quantum States',
    },
  },

  // ── Lesson 3: Computational Basis: |0⟩ and |1⟩ ────────────────────
  {
    id: 's1-theory-computational-basis',
    lessonNumber: 3,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'Computational Basis: |0⟩ and |1⟩',
    tag: 'Basis States',
    difficulty: 'Beginner',
    estimatedDuration: '4–5 min',
    xpReward: 120,
    description: 'Master the standard orthonormal reference frame: the meaning of ground state |0⟩ and excited state |1⟩.',
    learningObjectives: [
      'Define the computational basis (Z-basis) in quantum mechanics.',
      'Understand the column vector representation of |0⟩ and |1⟩.',
      'Understand the physical meaning of ground state initialization.',
      'Recognize the orthonormality condition ⟨0|1⟩ = 0 and ⟨0|0⟩ = ⟨1|1⟩ = 1.',
    ],
    sections: [
      {
        id: 'sec-3-basis-definition',
        title: '1. What Are Basis States?',
        content: [
          'In linear algebra, a basis is a set of linearly independent vectors that span the entire vector space. In quantum computing, the standard reference frame is called the Computational Basis (also known as the Z-basis).',
          'Every single-qubit state can be uniquely described as a superposition of these two basis states.',
        ],
      },
      {
        id: 'sec-3-state-zero',
        title: '2. The Ground State: |0⟩',
        content: [
          'The state |0⟩ represents the standard ground state (the lowest energy state of the physical qubit).',
          'In quantum computing platforms like Qiskit, Cirq, and Qualution Quantum Lab, all qubit wires automatically initialize in state |0⟩ at the start of every circuit execution.',
        ],
        formula: '|0\\rangle = \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}',
        formulaCaption: 'Vector representation of |0⟩: amplitude 1 on |0⟩, amplitude 0 on |1⟩',
      },
      {
        id: 'sec-3-state-one',
        title: '3. The Excited State: |1⟩',
        content: [
          'The state |1⟩ represents the orthogonal excited state. Applying a bit-flip operator (Pauli-X gate) to |0⟩ transforms the qubit into state |1⟩.',
          'When measured in the computational basis, state |1⟩ yields measurement outcome 1 with 100% certainty.',
        ],
        formula: '|1\\rangle = \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}',
        formulaCaption: 'Vector representation of |1⟩: amplitude 0 on |0⟩, amplitude 1 on |1⟩',
      },
      {
        id: 'sec-3-orthonormality',
        title: '4. Orthonormality of the Computational Basis',
        content: [
          'The basis states |0⟩ and |1⟩ are orthonormal: they are mutually orthogonal (their inner product is 0) and each has unit length (norm 1).',
          'This mutual orthogonality ensures that |0⟩ and |1⟩ are perfectly distinguishable upon measurement.',
        ],
        formula: '\\langle 0|0\\rangle = 1, \\quad \\langle 1|1\\rangle = 1, \\quad \\langle 0|1\\rangle = 0',
        formulaCaption: 'Orthonormality conditions in Dirac notation',
        keyTakeaway: 'The computational basis {|0⟩, |1⟩} forms a mutually orthogonal, standardized coordinate system for quantum information.',
      },
    ],
    practicalConnection: {
      lessonId: 's1-initialize-measure',
      label: 'Launch Practical Lesson 1',
      description: 'Practice initializing and measuring a qubit in state |0⟩ in the Quantum Lab.',
    },
    quiz: {
      id: 'q-s1-3',
      question: 'What is the inner product ⟨0|1⟩ between the basis states |0⟩ and |1⟩?',
      options: [
        '1 (they are parallel)',
        '0 (they are mutually orthogonal)',
        '-1 (they have opposite phases)',
        '1/√2 (they are in equal superposition)',
      ],
      correctIndex: 1,
      explanation: 'Because |0⟩ and |1⟩ are orthonormal basis vectors, their inner product ⟨0|1⟩ = (1)(0) + (0)(1) = 0. They are perfectly orthogonal and distinguishable.',
      conceptTag: 'Basis States',
    },
  },

  // ── Lesson 4: Superposition ───────────────────────────────────────
  {
    id: 's1-theory-superposition',
    lessonNumber: 4,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'Superposition',
    tag: 'Superposition',
    difficulty: 'Beginner',
    estimatedDuration: '5–6 min',
    xpReward: 150,
    description: 'Demystify quantum superposition: equal vs. unequal superpositions, state vectors, and the iconic Hadamard transform.',
    learningObjectives: [
      'Define quantum superposition as a linear combination of basis states.',
      'Differentiate between equal superpositions (|+) and unequal superpositions.',
      'Understand how the Hadamard gate (H) creates the symmetric state |+⟩ from |0⟩.',
      'Connect mathematical superpositions to the 50/50 measurement distributions in the Quantum Lab.',
    ],
    sections: [
      {
        id: 'sec-4-what-is-superposition',
        title: '1. What Superposition Truly Means',
        content: [
          'Superposition is often described in popular science as "being in two states at once." In rigorous quantum mechanics, superposition means a quantum state is a linear combination of basis vectors with specific complex coefficients.',
          'Until a measurement occurs, the qubit does not have a single definite classical value; it evolves deterministically as a continuous wave-like state vector.',
        ],
      },
      {
        id: 'sec-4-equal-vs-unequal',
        title: '2. Equal and Unequal Superpositions',
        content: [
          'In an Equal Superposition, the probability of measuring 0 equals the probability of measuring 1. The quintessential equal superposition state is |+⟩ ("plus state"):',
          'In an Unequal Superposition, the amplitudes have different magnitudes (e.g., α = √0.8 and β = √0.2), giving an 80% chance of 0 and a 20% chance of 1 upon measurement.',
        ],
        formula: '|+⟩ = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} = \\begin{pmatrix} 1/\\sqrt{2} \\\\ 1/\\sqrt{2} \\end{pmatrix}',
        formulaCaption: 'The symmetric equal superposition state |+⟩',
        keyTakeaway: 'In the state |+⟩, both amplitudes equal 1/√2, yielding exact 50% / 50% measurement probabilities.',
      },
      {
        id: 'sec-4-hadamard-connection',
        title: '3. The Hadamard Gate: Gateway to Superposition',
        content: [
          'The Hadamard gate (H) is the primary tool for creating superpositions. When applied to the default ground state |0⟩, it rotates the state vector into |+⟩.',
          'If applied to |1⟩, it produces the orthogonal minus state |-⟩ = (|0⟩ - |1⟩)/√2.',
        ],
        formula: 'H|0\\rangle = |+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}, \\quad H|1\\rangle = |-\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}',
        formulaCaption: 'Action of the Hadamard operator on computational basis states',
        callout: {
          type: 'tip',
          title: 'Quantum Lab Verification',
          text: 'Running 1000 shots on a circuit with an H gate produces approximately 500 counts of "0" and 500 counts of "1" due to statistical sampling convergence.',
        },
      },
    ],
    practicalConnection: {
      lessonId: 's1-hadamard-superposition',
      label: 'Launch Practical Lesson 3',
      description: 'Experience active prediction, simulation, and comparison for the Hadamard gate in the Quantum Lab.',
    },
    quiz: {
      id: 'q-s1-4',
      question: 'What is the theoretical probability of measuring 1 after applying a Hadamard gate to |0⟩?',
      options: [
        '0% (deterministically 0)',
        '50% (probability = 0.5)',
        '100% (deterministically 1)',
        '25% (probability = 0.25)',
      ],
      correctIndex: 1,
      explanation: 'Applying H to |0⟩ creates (|0⟩ + |1⟩)/√2. The probability of outcome 1 is |1/√2|² = 1/2 = 50%.',
      conceptTag: 'Superposition',
    },
  },

  // ── Lesson 5: Measurement & Probability ───────────────────────────
  {
    id: 's1-theory-measurement-probability',
    lessonNumber: 5,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'Measurement & Probability',
    tag: 'Measurement',
    difficulty: 'Beginner',
    estimatedDuration: '5–6 min',
    xpReward: 150,
    description: 'Learn how quantum measurement collapses continuous state vectors into discrete classical bits via the Born Rule.',
    learningObjectives: [
      'Understand computational basis measurement and projective state collapse.',
      'Apply the Born Rule: P(0) = |α|² and P(1) = |β|².',
      'Explain why repeated shots are necessary to reconstruct probability distributions.',
      'Differentiate between deterministic measurements (|0⟩, |1⟩) and probabilistic outcomes (superpositions).',
    ],
    sections: [
      {
        id: 'sec-5-measurement-process',
        title: '1. Measurement in the Computational Basis',
        content: [
          'Measurement is an irreversible physical operation that forces a quantum superposition to choose one of the basis states (|0⟩ or |1⟩). This process is known as Wavefunction Collapse (or state reduction).',
          'After measuring outcome 0, the state vector is no longer in superposition; it becomes strictly |0⟩ for all subsequent measurements unless acted upon by new gates.',
        ],
      },
      {
        id: 'sec-5-born-rule',
        title: '2. The Born Rule & Probability Interpretation',
        content: [
          'Formulated by physicist Max Born in 1926, the Born Rule states that the probability of obtaining outcome x when measuring state |ψ⟩ is equal to the squared magnitude of the amplitude corresponding to basis state |x⟩.',
        ],
        formula: 'P(0) = |\\alpha|^2 = |\\langle 0|\\psi\\rangle|^2, \\quad P(1) = |\\beta|^2 = |\\langle 1|\\psi\\rangle|^2',
        formulaCaption: 'The Born Rule for single-qubit computational basis measurement',
        keyTakeaway: 'Amplitudes can be positive, negative, or complex, but probabilities are strictly real non-negative numbers between 0 and 1.',
      },
      {
        id: 'sec-5-shots-statistics',
        title: '3. Repeated Measurements and "Shots"',
        content: [
          'A single measurement run returns only a single binary digit (0 or 1). It does NOT output the values of α or β directly.',
          'To reconstruct the underlying probability distribution, a quantum computer repeats the circuit initialization, gate sequence, and measurement many times. Each iteration is called a "shot".',
          'By running 1000 or 10000 shots, the empirical frequency of 0s and 1s converges to the theoretical probabilities P(0) and P(1) by the Law of Large Numbers.',
        ],
        callout: {
          type: 'info',
          title: 'Quantum Sampling',
          text: 'In the Qualution Quantum Lab, setting shots=1000 simulates 1000 independent circuit executions on the Qiskit Aer backend to generate the probability histogram.',
        },
      },
    ],
    quiz: {
      id: 'q-s1-5',
      question: 'If a qubit is in state |ψ⟩ = 0.6|0⟩ + 0.8|1⟩, what is the probability P(1) of measuring outcome 1?',
      options: [
        '0.8 (80%)',
        '0.64 (64%)',
        '0.36 (36%)',
        '0.48 (48%)',
      ],
      correctIndex: 1,
      explanation: 'By the Born Rule, P(1) = |β|² = (0.8)² = 0.64 (64%). Similarly, P(0) = (0.6)² = 0.36 (36%). Notice that 0.36 + 0.64 = 1.0 (normalized).',
      conceptTag: 'Measurement',
    },
  },

  // ── Lesson 6: Probability Amplitudes ──────────────────────────────
  {
    id: 's1-theory-probability-amplitudes',
    lessonNumber: 6,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'Probability Amplitudes',
    tag: 'Amplitudes',
    difficulty: 'Beginner',
    estimatedDuration: '5–6 min',
    xpReward: 150,
    description: 'Master complex amplitudes, the squared magnitude intuition, and the vital normalization condition.',
    learningObjectives: [
      'Distinguish complex probability amplitudes from classical probabilities.',
      'Understand squared magnitude calculation |c|² = Re(c)² + Im(c)².',
      'Master the state vector normalization condition |α|² + |β|² = 1.',
      'Solve single-qubit amplitude and probability equations with confidence.',
    ],
    sections: [
      {
        id: 'sec-6-amplitudes-vs-probabilities',
        title: '1. Amplitudes vs. Probabilities',
        content: [
          'In classical probability theory, probabilities must be real numbers between 0 and 1, and probabilities always add together directly: P_total = P_1 + P_2.',
          'In quantum mechanics, the fundamental quantities are complex amplitudes. Amplitudes can be positive, negative, or purely imaginary. When two quantum pathways combine, their amplitudes add (α_total = α_1 + α_2), allowing them to cancel out—a phenomenon impossible with classical probabilities.',
        ],
        keyTakeaway: 'Amplitudes add linearly before squaring, creating quantum interference.',
      },
      {
        id: 'sec-6-squared-magnitude',
        title: '2. Squared Magnitude of Complex Numbers',
        content: [
          'A complex number c has the form c = a + bi, where a is the real part and b is the imaginary part (i = √-1).',
          'The squared magnitude |c|² is calculated as |c|² = c* · c = a² + b². It is always a non-negative real number.',
        ],
        formula: '|a + bi|^2 = a^2 + b^2',
        formulaCaption: 'Squared magnitude of a complex amplitude',
      },
      {
        id: 'sec-6-normalization',
        title: '3. Normalization: Conservation of Probability',
        content: [
          'Because the total probability of all possible measurement outcomes in a complete basis must sum to 100% (1.0), every valid quantum state vector must be normalized to unit length.',
        ],
        formula: '|\\alpha|^2 + |\\beta|^2 = 1',
        formulaCaption: 'Single-qubit normalization condition',
        callout: {
          type: 'warning',
          title: 'Non-Normalized States',
          text: 'If a mathematical expression does not satisfy |α|² + |β|² = 1, it does not represent a valid physical quantum state until it is divided by its norm √( |α|² + |β|² ).',
        },
      },
      {
        id: 'sec-6-worked-example',
        title: '4. Worked Example: Non-Equal Superposition',
        content: [
          'Consider state |ψ⟩ = (1/2)|0⟩ + (√3/2)|1⟩.',
          '1. Amplitude for |0⟩ is α = 1/2. Probability P(0) = (1/2)² = 1/4 = 0.25 (25%).',
          '2. Amplitude for |1⟩ is β = √3/2. Probability P(1) = (√3/2)² = 3/4 = 0.75 (75%).',
          '3. Check normalization: 0.25 + 0.75 = 1.0. The state is valid and normalized.',
        ],
      },
    ],
    quiz: {
      id: 'q-s1-6',
      question: 'Which of the following represents a valid, normalized quantum state vector?',
      options: [
        '|ψ⟩ = (1/2)|0⟩ + (1/2)|1⟩',
        '|ψ⟩ = (1/√2)|0⟩ + (1/√2)|1⟩',
        '|ψ⟩ = (1)|0⟩ + (1)|1⟩',
        '|ψ⟩ = (0.6)|0⟩ + (0.6)|1⟩',
      ],
      correctIndex: 1,
      explanation: 'In |ψ⟩ = (1/√2)|0⟩ + (1/√2)|1⟩, |1/√2|² + |1/√2|² = 1/2 + 1/2 = 1.0. For option A, (1/2)² + (1/2)² = 0.5 (not normalized).',
      conceptTag: 'Amplitudes',
    },
  },

  // ── Lesson 7: Quantum Phase ───────────────────────────────────────
  {
    id: 's1-theory-quantum-phase',
    lessonNumber: 7,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'Quantum Phase',
    tag: 'Relative Phase',
    difficulty: 'Beginner',
    estimatedDuration: '5–6 min',
    xpReward: 160,
    description: 'Understand the hidden dimension of quantum information: global phase vs. relative phase, interference, and the Pauli-Z gate.',
    learningObjectives: [
      'Differentiate between unobservable global phase and physically crucial relative phase.',
      'Understand why |+⟩ and |-⟩ have identical 50/50 measurement histograms but are distinct orthogonal states.',
      'Explain how relative phase enables constructive and destructive interference.',
      'Connect phase shifts to the Pauli-Z gate in the Quantum Lab.',
    ],
    sections: [
      {
        id: 'sec-7-global-vs-relative',
        title: '1. Global Phase vs. Relative Phase',
        content: [
          'Phase refers to the complex angle θ in an amplitude written in polar form r e^(iθ).',
          'Global Phase: A phase factor multiplying the ENTIRE state vector: e^(iγ)|ψ⟩ = e^(iγ)(α|0⟩ + β|1⟩). Global phase has NO observable physical effect because |e^(iγ)|² = 1 for all measurement bases.',
          'Relative Phase: A phase difference BETWEEN basis state components: |ψ⟩ = α|0⟩ + e^(iθ)β|1⟩. Relative phase is physically profound and measurable through interference!',
        ],
        formula: '|\\psi_{\\text{global}}\\rangle = e^{i\\gamma}(\\alpha|0\\rangle + \\beta|1\\rangle) \\quad \\text{vs.} \\quad |\\psi_{\\text{relative}}\\rangle = \\alpha|0\\rangle + e^{i\\theta}\\beta|1\\rangle',
        formulaCaption: 'Global phase (unphysical multiplier) vs. Relative phase (physical state distinction)',
      },
      {
        id: 'sec-7-plus-vs-minus',
        title: '2. The Crucial Comparison: |+⟩ vs. |-⟩',
        content: [
          'State |+⟩ = (|0⟩ + |1⟩)/√2 (relative phase θ = 0, pointing along +X on Bloch sphere).',
          'State |-⟩ = (|0⟩ - |1⟩)/√2 = (|0⟩ + e^(iπ)|1⟩)/√2 (relative phase θ = π, pointing along -X).',
          'Both states produce an identical 50/50 measurement histogram in the Z-basis! However, they are completely orthogonal: ⟨+|-⟩ = 0.',
        ],
        keyTakeaway: 'Identical computational measurement histograms DO NOT imply identical quantum states.',
      },
      {
        id: 'sec-7-phase-interference',
        title: '3. Phase Drives Quantum Interference',
        content: [
          'How do we reveal the relative phase difference between |+⟩ and |-⟩? By applying a Hadamard gate before measurement!',
          'H|+⟩ = |0⟩ (constructive interference on 0, destructive on 1).',
          'H|-⟩ = |1⟩ (constructive interference on 1, destructive on 0).',
          'The phase difference of π completely inverts the final measurement outcome from 100% 0 to 100% 1.',
        ],
        formula: 'H|+⟩ = |0\\rangle \\quad \\text{(100% 0)}, \\qquad H|-\\rangle = |1\\rangle \\quad \\text{(100% 1)}',
        formulaCaption: 'Interference transforms relative phase into observable measurement differences',
      },
    ],
    practicalConnection: {
      lessonId: 's1-z-phase',
      label: 'Launch Practical Lesson 4',
      description: 'Explore the Pauli-Z gate and phase shifts in the Quantum Lab.',
    },
    quiz: {
      id: 'q-s1-7',
      question: 'Why are the states |+⟩ and |-⟩ considered physically distinct even though both yield 50% 0 and 50% 1 upon Z-basis measurement?',
      options: [
        'They require different numbers of classical wires.',
        'They have a relative phase difference of π, which rotates to 100% 0 vs 100% 1 when transformed by an H gate.',
        '|-⟩ has higher energy than |+⟩.',
        'They are not distinct; they are mathematically and physically identical.',
      ],
      correctIndex: 1,
      explanation: 'States |+⟩ and |-⟩ differ by a relative phase of π (e^(iπ) = -1). Applying H to |+⟩ yields |0⟩ (100% 0), whereas applying H to |-⟩ yields |1⟩ (100% 1).',
      conceptTag: 'Relative Phase',
    },
  },

  // ── Lesson 8: Single-Qubit Quantum Gates ──────────────────────────
  {
    id: 's1-theory-single-qubit-gates',
    lessonNumber: 8,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'Single-Qubit Quantum Gates',
    tag: 'Quantum Gates',
    difficulty: 'Beginner',
    estimatedDuration: '6–7 min',
    xpReward: 160,
    description: 'Learn the primary single-qubit quantum gates (X, Z, H), their unitary properties, and basic matrix transformation intuition.',
    learningObjectives: [
      'Understand quantum gates as reversible unitary operators preserving state normalization.',
      'Learn the Pauli-X gate as the quantum bit-flip (NOT) operator.',
      'Learn the Pauli-Z gate as the quantum phase-flip operator.',
      'Learn the Hadamard (H) gate as the superposition and basis rotation operator.',
      'Build basic 2x2 matrix multiplication intuition without tedious manual calculations.',
    ],
    sections: [
      {
        id: 'sec-8-gates-unitary',
        title: '1. What Are Quantum Gates?',
        content: [
          'Quantum gates are the building blocks of quantum circuits. Mathematically, quantum gates are represented by Unitary Matrices (operators satisfying U† U = I).',
          'Unitary operations have two essential properties: they are completely reversible, and they preserve vector lengths (ensuring total probability remains exactly 1.0).',
        ],
      },
      {
        id: 'sec-8-pauli-x',
        title: '2. The Pauli-X Gate (Bit Flip / NOT)',
        content: [
          'The Pauli-X gate swaps the computational basis amplitudes: X|0⟩ = |1⟩ and X|1⟩ = |0⟩.',
          'Geometrically, it corresponds to a 180° (π radian) rotation around the X-axis of the Bloch sphere.',
        ],
        formula: 'X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}, \\quad X\\begin{pmatrix} \\alpha \\\\ \\beta \\end{pmatrix} = \\begin{pmatrix} \\beta \\\\ \\alpha \\end{pmatrix}',
        formulaCaption: 'Matrix representation and action of the Pauli-X operator',
      },
      {
        id: 'sec-8-pauli-z',
        title: '3. The Pauli-Z Gate (Phase Flip)',
        content: [
          'The Pauli-Z gate leaves amplitude α on |0⟩ unchanged, but multiplies amplitude β on |1⟩ by -1: Z|0⟩ = |0⟩ and Z|1⟩ = -|1⟩.',
          'Geometrically, it corresponds to a 180° rotation around the Z-axis of the Bloch sphere.',
        ],
        formula: 'Z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}, \\quad Z\\begin{pmatrix} \\alpha \\\\ \\beta \\end{pmatrix} = \\begin{pmatrix} \\alpha \\\\ -\\beta \\end{pmatrix}',
        formulaCaption: 'Matrix representation and action of the Pauli-Z operator',
      },
      {
        id: 'sec-8-hadamard',
        title: '4. The Hadamard Gate (H)',
        content: [
          'The Hadamard gate creates superposition and rotates between the Z-basis and the X-basis: H|0⟩ = |+⟩ and H|1⟩ = |-⟩.',
          'Applying Hadamard twice returns the qubit to its original state: H · H = I (H is its own inverse).',
        ],
        formula: 'H = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}, \\quad H^2 = I',
        formulaCaption: 'Matrix representation and self-inversion of the Hadamard operator',
        keyTakeaway: 'The three core single-qubit gates are X (bit flip), Z (phase flip), and H (superposition/basis rotation). All are unitary and reversible.',
      },
    ],
    practicalConnection: {
      lessonId: 's1-x-gate',
      label: 'Launch Practical Lesson 2',
      description: 'Interact directly with the Pauli-X gate in the Quantum Lab.',
    },
    quiz: {
      id: 'q-s1-8',
      question: 'What is the resulting state vector when a Hadamard gate is applied to state |1⟩?',
      options: [
        '|+⟩ = (|0⟩ + |1⟩)/√2',
        '|-⟩ = (|0⟩ - |1⟩)/√2',
        '|1⟩ (unchanged)',
        '-|1⟩',
      ],
      correctIndex: 1,
      explanation: 'Applying H to basis state |1⟩ produces the minus state: H|1⟩ = (1/√2)|0⟩ - (1/√2)|1⟩ = |-⟩.',
      conceptTag: 'Quantum Gates',
    },
  },

  // ── Lesson 9: From States to Quantum Circuits ─────────────────────
  {
    id: 's1-theory-states-to-circuits',
    lessonNumber: 9,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'From States to Quantum Circuits',
    tag: 'Quantum Circuits',
    difficulty: 'Beginner',
    estimatedDuration: '6–7 min',
    xpReward: 160,
    description: 'Bridge abstract quantum linear algebra to practical circuit diagrams: wires, gate ordering, execution pipelines, and simulation.',
    learningObjectives: [
      'Understand how quantum circuit diagrams visually depict time evolution from left to right.',
      'Explain why gate order matters due to matrix non-commutativity (HX ≠ XH).',
      'Understand how matrix multiplication order (right-to-left) maps to circuit layout (left-to-right).',
      'Connect circuit diagrams to simulation backends in the Quantum Lab.',
    ],
    sections: [
      {
        id: 'sec-9-circuit-wires',
        title: '1. Circuit Diagrams and Wires',
        content: [
          'A quantum circuit diagram represents the chronological sequence of quantum operations applied to a set of qubits.',
          'Horizontal lines represent qubit wires. Time flows from left to right: a qubit initializes at the far left (typically in |0⟩), passes through gates placed along the wire, and is measured into classical bits at the far right.',
        ],
      },
      {
        id: 'sec-9-gate-ordering-math',
        title: '2. Gate Ordering and Non-Commutativity',
        content: [
          'Because quantum gates are represented by matrices, and matrix multiplication is generally non-commutative (A · B ≠ B · A), the order in which gates are applied is critical.',
          'Circuit notation reads left-to-right, whereas mathematical operator notation applies right-to-left: applying gate A followed by gate B is written mathematically as B · A |ψ⟩.',
        ],
        formula: '\\text{Circuit: } |0\\rangle \\xrightarrow{\\quad A \\quad} \\xrightarrow{\\quad B \\quad} \\quad \\Longleftrightarrow \\quad |\\psi_{\\text{final}}\\rangle = B \\cdot A |0\\rangle',
        formulaCaption: 'Left-to-right circuit flow maps to right-to-left matrix product',
      },
      {
        id: 'sec-9-hx-vs-xh',
        title: '3. Case Study: H followed by X versus X followed by H',
        content: [
          'Sequence 1: |0⟩ → H → X produces state |+⟩ (relative phase θ = 0).',
          'Sequence 2: |0⟩ → X → H produces state |-⟩ (relative phase θ = π).',
          'Even though both circuits produce identical 50/50 measurement histograms in the Z-basis, they produce orthogonal quantum states because H and X do not commute: XH ≠ HX.',
        ],
        keyTakeaway: 'Gate sequence order determines the final quantum state vector. Never assume quantum gates commute!',
      },
      {
        id: 'sec-9-simulation-bridge',
        title: '4. Connecting Theory to the Quantum Lab',
        content: [
          'In the Qualution Quantum Lab, you can drag gates from the palette onto qubit wires, inspect real-time statevectors and Bloch sphere rotations, and run simulations with custom shot counts on Qiskit Aer.',
        ],
      },
    ],
    practicalConnection: {
      lessonId: 's1-gate-ordering',
      label: 'Launch Practical Lesson 5',
      description: 'Verify non-commutativity and state distinctions directly in the Quantum Lab.',
    },
    quiz: {
      id: 'q-s1-9',
      question: 'In quantum circuit mathematics, why is applying gate A followed by gate B written as B · A |ψ⟩?',
      options: [
        'Because matrix multiplication is associative.',
        'Because operators act on the vector directly to their right: B acts on the resulting state (A|ψ⟩).',
        'Because quantum circuits run backwards in time.',
        'Because B has higher numerical priority than A.',
      ],
      correctIndex: 1,
      explanation: 'In linear algebra, operators act from right to left on column vectors: B(A|ψ⟩) means A transforms |ψ⟩ first, and B acts on the resulting vector second.',
      conceptTag: 'Quantum Circuits',
    },
  },

  // ── Lesson 10: Sprint 1 Knowledge Check ───────────────────────────
  {
    id: 's1-theory-knowledge-check',
    lessonNumber: 10,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'Sprint 1 Knowledge Check',
    tag: 'Checkpoint',
    difficulty: 'Beginner',
    estimatedDuration: '8–10 min',
    xpReward: 200,
    isKnowledgeCheck: true,
    description: 'Consolidate your conceptual understanding across Lessons 1 through 9 with focused theoretical check questions.',
    learningObjectives: [
      'Self-evaluate understanding of qubits, state vectors, and basis states.',
      'Check mastery of superposition, Born rule probabilities, and normalization.',
      'Review single-qubit gates (X, Z, H), relative phase, and gate ordering.',
      'Identify any remaining knowledge gaps before the formal Sprint 1 Assessment.',
    ],
    sections: [
      {
        id: 'sec-10-intro',
        title: 'Sprint 1 Conceptual Review',
        content: [
          'Congratulations on completing the core theoretical lessons of Sprint 1! This Knowledge Check provides multi-concept questions covering everything from qubit state vectors to gate ordering.',
          'Answer each question below to receive immediate step-by-step explanations. You can retry as many times as needed to solidify your understanding.',
        ],
      },
    ],
    knowledgeCheckQuestions: [
      {
        id: 'kc-1',
        question: 'Which statement accurately describes an arbitrary single-qubit quantum state |ψ⟩ = α|0⟩ + β|1⟩?',
        options: [
          'α and β are classical boolean bits that switch between 0 and 1.',
          'α and β are complex probability amplitudes constrained by |α|² + |β|² = 1.',
          'α and β must always be positive real integers.',
          'α must always equal β for any valid quantum state.',
        ],
        correctIndex: 1,
        explanation: 'Single-qubit states are described by complex amplitudes α, β in a 2D Hilbert space satisfying normalization |α|² + |β|² = 1.',
        conceptTag: 'Quantum States',
      },
      {
        id: 'kc-2',
        question: 'What happens physically when a qubit in equal superposition |+⟩ = (|0⟩ + |1⟩)/√2 is measured in the computational basis?',
        options: [
          'The measurement device outputs a mixture value of 0.5.',
          'The state collapses to either |0⟩ (with 50% probability) or |1⟩ (with 50% probability).',
          'The qubit remains in superposition after measurement.',
          'The qubit is erased and cannot be measured again.',
        ],
        correctIndex: 1,
        explanation: 'Measurement in the computational basis is projective: it collapses the superposition to outcome 0 or 1 with probability equal to the amplitude squared (1/√2)² = 0.5.',
        conceptTag: 'Measurement',
      },
      {
        id: 'kc-3',
        question: 'What is the probability of measuring 0 for the state |ψ⟩ = (√3/2)|0⟩ - (1/2)|1⟩?',
        options: [
          '0.50 (50%)',
          '0.75 (75%)',
          '0.25 (25%)',
          '0.866 (86.6%)',
        ],
        correctIndex: 1,
        explanation: 'By the Born Rule, P(0) = |α|² = (√3/2)² = 3/4 = 0.75 (75%).',
        conceptTag: 'Measurement',
      },
      {
        id: 'kc-4',
        question: 'What is the action of the Pauli-Z gate on the basis state |1⟩?',
        options: [
          'Z|1⟩ = |0⟩ (flips bit to 0)',
          'Z|1⟩ = -|1⟩ (inverts the relative phase)',
          'Z|1⟩ = |1⟩ (leaves state unchanged)',
          'Z|1⟩ = |+⟩ (creates superposition)',
        ],
        correctIndex: 1,
        explanation: 'The Pauli-Z gate acts as a phase-flip: Z|0⟩ = |0⟩ and Z|1⟩ = -|1⟩ (adding a relative phase of π).',
        conceptTag: 'Quantum Gates',
      },
      {
        id: 'kc-5',
        question: 'Why does applying H followed by X produce a different quantum state than applying X followed by H?',
        options: [
          'Because H and X act on different wires.',
          'Because matrix multiplication is non-commutative: X·H ≠ H·X, producing |+⟩ vs |-⟩.',
          'Because X gate cannot be used after an H gate.',
          'They do not produce different states; they produce the exact same state.',
        ],
        correctIndex: 1,
        explanation: 'X·H applied to |0⟩ yields |-⟩, while H·X applied to |0⟩ yields |+⟩. These are distinct orthogonal states with different relative phases.',
        conceptTag: 'Quantum Circuits',
      },
      {
        id: 'kc-6',
        question: 'How does quantum interference allow quantum algorithms to solve problems efficiently?',
        options: [
          'By speeding up the CPU clock rate.',
          'By destructively canceling amplitudes of incorrect paths while constructively reinforcing amplitudes of correct answers.',
          'By converting all numbers into binary strings before running.',
          'By preventing any measurements from ever occurring.',
        ],
        correctIndex: 1,
        explanation: 'Quantum algorithms use phase differences so that probability amplitudes of incorrect answers cancel destructively, while correct answers interfere constructively.',
        conceptTag: 'Foundations',
      },
    ],
  },

  // ── Lesson 11: Sprint 1 Assessment ────────────────────────────────
  {
    id: 's1-theory-assessment',
    lessonNumber: 11,
    sprintNumber: 1,
    sprintTitle: 'Sprint 1 — Quantum Foundations',
    title: 'Sprint 1 Assessment: Quantum Foundations',
    tag: 'Sprint Evaluation',
    difficulty: 'Beginner',
    estimatedDuration: '12–15 min',
    xpReward: 350,
    isAssessment: true,
    description: 'Comprehensive 10-question theoretical assessment testing state representation, probability calculations, phase reasoning, and quantum gate mechanics.',
    learningObjectives: [
      'Demonstrate rigorous understanding of single-qubit quantum states and Dirac notation.',
      'Calculate measurement probabilities accurately using the Born Rule.',
      'Reason about relative phase shifts, state distinctions, and interference.',
      'Analyze single-qubit gate sequences and circuit transformations.',
      'Earn verified Sprint 1 Theoretical Mastery credentials and 350 XP.',
    ],
    sections: [
      {
        id: 'sec-11-assessment-instructions',
        title: 'Assessment Guidelines',
        content: [
          'Welcome to the Sprint 1 Theoretical Assessment. This formal evaluation consists of 10 comprehensive questions designed to test your conceptual and mathematical mastery of single-qubit quantum foundations.',
          'To achieve a passing score and unlock your Sprint 1 Theoretical Mastery badge, you must score at least 70% (7 out of 10 correct).',
          'Take your time to read each question carefully. When you submit, your score will be auto-graded and saved directly to your learner profile.',
        ],
        callout: {
          type: 'insight',
          title: 'Sprint 1 Mastery Badge',
          text: 'Scoring ≥70% awards +350 XP and certifies your theoretical foundation for single-qubit quantum mechanics.',
        },
      },
    ],
    assessmentQuestions: [
      {
        id: 'assess-1',
        question: '1. In Dirac notation, which column vector correctly corresponds to basis state |1⟩ in the standard computational basis?',
        options: [
          '[1, 0]ᵀ (top row 1, bottom row 0)',
          '[0, 1]ᵀ (top row 0, bottom row 1)',
          '[1/√2, 1/√2]ᵀ',
          '[1, 1]ᵀ',
        ],
        correctIndex: 1,
        explanation: 'In the computational Z-basis, |0⟩ = [1, 0]ᵀ and |1⟩ = [0, 1]ᵀ.',
        conceptTag: 'Basis States',
      },
      {
        id: 'assess-2',
        question: '2. If a qubit is prepared in state |ψ⟩ = (1/2)|0⟩ + (√3/2)|1⟩, what is the probability of measuring outcome 1 in the computational basis?',
        options: [
          '25% (0.25)',
          '50% (0.50)',
          '75% (0.75)',
          '86.6% (0.866)',
        ],
        correctIndex: 2,
        explanation: 'By the Born Rule: P(1) = |β|² = (√3/2)² = 3/4 = 0.75 (75%).',
        conceptTag: 'Measurement',
      },
      {
        id: 'assess-3',
        question: '3. A normalized state |ψ⟩ has amplitude α = i/√2 on basis state |0⟩. What is the probability P(0) of measuring 0?',
        options: [
          '-0.5 (negative probability)',
          '0.5 (50%)',
          '0.0 (imaginary numbers yield zero probability)',
          '1.0 (100%)',
        ],
        correctIndex: 1,
        explanation: 'The probability is the squared magnitude: |i/√2|² = (i/√2)(-i/√2) = 1/2 = 0.5 (50%). Complex amplitudes always yield non-negative real probabilities.',
        conceptTag: 'Amplitudes',
      },
      {
        id: 'assess-4',
        question: '4. What state is produced when a Pauli-X gate is applied to state |1⟩?',
        options: [
          '|1⟩',
          '|0⟩',
          '-|0⟩',
          '|+⟩',
        ],
        correctIndex: 1,
        explanation: 'Pauli-X acts as the bit-flip operator: X|1⟩ = |0⟩ and X|0⟩ = |1⟩.',
        conceptTag: 'Quantum Gates',
      },
      {
        id: 'assess-5',
        question: '5. Which gate converts basis state |0⟩ into the equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2?',
        options: [
          'Pauli-X gate',
          'Pauli-Z gate',
          'Hadamard (H) gate',
          'Measurement operator',
        ],
        correctIndex: 2,
        explanation: 'The Hadamard gate creates symmetric equal superpositions from computational basis states: H|0⟩ = |+⟩ and H|1⟩ = |-⟩.',
        conceptTag: 'Superposition',
      },
      {
        id: 'assess-6',
        question: '6. How do the states |+⟩ and |-⟩ behave when measured in the computational (Z) basis?',
        options: [
          '|+⟩ yields 100% 0, while |-⟩ yields 100% 1.',
          'Both states yield an identical ~50% 0 and ~50% 1 distribution.',
          '|+⟩ yields 50/50, while |-⟩ yields 100% 0.',
          'Neither state can be measured in the Z-basis.',
        ],
        correctIndex: 1,
        explanation: 'Both |+⟩ and |-⟩ have amplitude magnitudes |1/√2| = 1/√2, so both produce 50% 0 and 50% 1 when measured in the Z-basis. Their difference lies entirely in relative phase.',
        conceptTag: 'Relative Phase',
      },
      {
        id: 'assess-7',
        question: '7. What is the effect of applying the gate sequence H → Z → H to the initial state |0⟩?',
        options: [
          'Final state is |0⟩ with 100% probability.',
          'Final state is |1⟩ with 100% probability.',
          'Final state is |+⟩ with 50/50 probability.',
          'Final state is |-⟩ with 50/50 probability.',
        ],
        correctIndex: 1,
        explanation: '|0⟩ → H → |+⟩ → Z → |-⟩ → H → |1⟩. Because H|-⟩ = |1⟩, the interference causes deterministic constructive reinforcement on outcome 1 (P(1) = 1.0).',
        conceptTag: 'Quantum Circuits',
      },
      {
        id: 'assess-8',
        question: '8. If a state vector is given by |ψ⟩ = (1/2)|0⟩ + c|1⟩, what value must |c| have for |ψ⟩ to be physically normalized?',
        options: [
          '1/2',
          '√3/2',
          '3/4',
          '1',
        ],
        correctIndex: 1,
        explanation: 'Normalization requires |1/2|² + |c|² = 1 => 1/4 + |c|² = 1 => |c|² = 3/4 => |c| = √3/2.',
        conceptTag: 'Amplitudes',
      },
      {
        id: 'assess-9',
        question: '9. Why does global phase e^(iγ)|ψ⟩ have no observable consequences in quantum experiments?',
        options: [
          'Because global phase is erased by the hardware refrigerator.',
          'Because when computing any measurement probability |e^(iγ)c|², the phase magnitude factor |e^(iγ)|² equals exactly 1.',
          'Because quantum gates cannot generate global phase.',
          'Because classical computers cannot detect complex numbers.',
        ],
        correctIndex: 1,
        explanation: 'For any complex angle γ, |e^(iγ)|² = cos²(γ) + sin²(γ) = 1. Thus, global phase cancels out in all expectation values and measurement probabilities.',
        conceptTag: 'Relative Phase',
      },
      {
        id: 'assess-10',
        question: '10. What is the fundamental property of all quantum gates represented by unitary matrices U?',
        options: [
          'They only operate on classical bits.',
          'They are reversible and preserve the total probability norm of the quantum state (U†U = I).',
          'They always measure the qubit immediately after execution.',
          'They convert all quantum superpositions into discrete deterministic integers.',
        ],
        correctIndex: 1,
        explanation: 'Unitary matrices satisfy U†U = I, which guarantees that all quantum gate transformations are reversible and preserve the Euclidean norm (total probability = 1).',
        conceptTag: 'Quantum Gates',
      },
    ],
  },
];

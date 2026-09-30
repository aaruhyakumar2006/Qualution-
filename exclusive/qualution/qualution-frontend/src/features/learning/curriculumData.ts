import type { CircuitRequest } from '../circuit/types';

export interface AssessmentCriteria {
  minQubits: number;
  maxQubits: number;
  requiredGates?: string[];
  forbiddenGates?: string[];
  maxGateCount?: number;
  targetProbabilities?: Record<string, { min: number; max: number }>;
  forbiddenOutcomes?: string[];
  targetStateDescription: string;
  minimumShots?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonModule {
  id: string;
  lessonNumber: number;
  trackId: 'track-1' | 'track-2' | 'track-3';
  trackTitle: string;
  title: string;
  theoryBeat: string;
  practicalBeat: string;
  assessmentGate: string;
  badge: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  xpReward: number;
  summary: string;
  formula: string;
  formulaDescription: string;
  theoryParagraphs: string[];
  keyTakeaways: string[];
  conceptTags: string[];
  video?: {
    src: string;
    poster: string;
    durationSeconds: number;
  };
  quiz: QuizQuestion;
  assessment: {
    title: string;
    objective: string;
    instructions: string[];
    hint: string;
    starterCircuit: CircuitRequest;
    criteria: AssessmentCriteria;
  };
}

export interface CurriculumTrack {
  id: 'track-1' | 'track-2' | 'track-3';
  trackNumber: number;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  modules: LessonModule[];
}

export const QUANTUM_CURRICULUM: LessonModule[] = [
  // ═════════════════════════════════════════════════════════════════
  // TRACK 1 — FOUNDATIONS (BEGINNER)
  // ═════════════════════════════════════════════════════════════════
  {
    id: 'lesson-1-bits-vs-qubits',
    lessonNumber: 1,
    trackId: 'track-1',
    trackTitle: 'Track 1 — Foundations (Beginner)',
    title: 'Bits vs. Qubits',
    theoryBeat: 'Classical determinism vs. quantum state — your existing 4-min JSON-driven lesson',
    practicalBeat: 'Apply an X gate on the Workbench, observe the bit flip live',
    assessmentGate: 'Predict-and-pause: "What will the state be after X?"',
    badge: 'Quantum Pioneer',
    difficulty: 'Beginner',
    estimatedMinutes: 6,
    xpReward: 150,
    summary: 'Understand the fundamental transition from classical deterministic bits (0 or 1) to quantum qubits capable of existing as continuous 2D complex state vectors.',
    formula: '|ψ⟩ = α|0⟩ + β|1⟩  where  |α|² + |β|² = 1,  X|0⟩ = |1⟩',
    formulaDescription: 'Classical bits are discrete; quantum states span a continuous complex Hilbert space.',
    video: {
      src: '/player',
      poster: '/videos/lesson01_demo_bits_to_qubits_poster.png',
      durationSeconds: 100,
    },
    theoryParagraphs: [
      'Classical computers—from smartphones to supercomputers—process information encoded into binary digits (bits). At any given moment, a classical bit physically exists in exactly one of two discrete voltage states: 0 (off) or 1 (on).',
      'A quantum computer, in contrast, encodes information into quantum bits (qubits). Because qubits obey the laws of quantum mechanics, a qubit is not confined to being solely 0 or 1. Instead, it exists in a continuous mathematical space of linear superpositions of both states simultaneously.',
      'Applying a Pauli-X gate acts as the quantum NOT operator: it rotates the state vector by π radians around the X-axis of the Bloch sphere, deterministically flipping the ground state |0⟩ into the excited state |1⟩.'
    ],
    keyTakeaways: [
      'Classical bits are deterministic; qubits are continuous state vectors in ℂ².',
      'The Pauli-X operator deterministically flips |0⟩ to |1⟩ and |1⟩ to |0⟩.',
      'Measurement collapses the quantum state into a definite classical bit outcome.'
    ],
    conceptTags: ['Qubit', 'Classical Bit', 'Pauli-X', 'State Vector', 'Bit Flip'],
    quiz: {
      question: 'What will the state of a qubit initialized to |0⟩ be after applying a single Pauli-X gate?',
      options: ['State |0⟩ (unchanged)', 'State |1⟩ (flipped)', 'Equal superposition (|0⟩ + |1⟩)/√2', 'State |-⟩'],
      correctIndex: 1,
      explanation: 'The Pauli-X gate performs a bit-flip operation: X|0⟩ = |1⟩ and X|1⟩ = |0⟩ with 100% deterministic fidelity.'
    },
    assessment: {
      title: 'Predict-and-Pause: Bit Flip with Pauli-X',
      objective: 'Apply a Pauli-X gate to wire q[0] initialized at |0⟩, and verify the qubit flips deterministically to |1⟩ with 100% measurement probability.',
      instructions: [
        'Place a Pauli-X gate on wire q[0].',
        'Ensure measurement is enabled on wire q[0].',
        'Run the simulation with at least 500 shots.',
        'Verify that 100% of measurement outcomes are 1.'
      ],
      hint: 'Drag the X gate from the single-qubit gate palette onto qubit wire q[0].',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        requiredGates: ['x'],
        minimumShots: 500,
        targetProbabilities: {
          '1': { min: 0.90, max: 1.00 }
        },
        targetStateDescription: 'State |1⟩ (~100% outcome 1 after Pauli-X flip)'
      }
    }
  },
  {
    id: 'lesson-2-superposition-hadamard',
    lessonNumber: 2,
    trackId: 'track-1',
    trackTitle: 'Track 1 — Foundations (Beginner)',
    title: 'Superposition & Hadamard',
    theoryBeat: 'What superposition means; Bloch sphere as a visual model',
    practicalBeat: 'Build an H gate circuit, view the resulting probability histogram',
    assessmentGate: 'Coding challenge: build H, predict probability split',
    badge: 'Superposition Builder',
    difficulty: 'Beginner',
    estimatedMinutes: 8,
    xpReward: 150,
    summary: 'Master the creation of quantum superposition using the Hadamard gate and visualize state vectors on the 3D Bloch sphere.',
    formula: 'H|0⟩ = |+⟩ = (|0⟩ + |1⟩) / √2,  H|1⟩ = |-⟩ = (|0⟩ - |1⟩) / √2',
    formulaDescription: 'Hadamard maps computational basis states into symmetric equal-superposition states.',
    theoryParagraphs: [
      'Superposition is the core principle that gives quantum computing its power: placing a qubit into an equal linear combination of |0⟩ and |1⟩ simultaneously.',
      'The Hadamard (H) gate creates an equal superposition from the ground state |0⟩, producing |+⟩ = (|0⟩ + |1⟩)/√2 with identical probability amplitudes of 1/√2.',
      'On the Bloch sphere, |0⟩ is the North pole and |1⟩ is the South pole; the Hadamard gate rotates |0⟩ to the equator along the positive X-axis.'
    ],
    keyTakeaways: [
      'The Hadamard gate creates a 50/50 probability split from basis state |0⟩.',
      'The state |+⟩ points to (+1, 0, 0) on the equator of the Bloch sphere.',
      'Measuring |+⟩ yields outcomes 0 and 1 with equal 50% probability.'
    ],
    conceptTags: ['Superposition', 'Hadamard', 'Bloch Sphere', 'Born Rule'],
    quiz: {
      question: 'On the Bloch sphere, where does the equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2 point?',
      options: ['The North Pole (+Z)', 'The South Pole (-Z)', 'The equator along the +X axis', 'The equator along the +Y axis'],
      correctIndex: 2,
      explanation: 'The |+⟩ state corresponds to polar coordinates θ = π/2, φ = 0 on the Bloch sphere, pointing directly along the positive X-axis.'
    },
    assessment: {
      title: 'Coding Challenge: Build H Gate Circuit',
      objective: 'Construct a 1-qubit circuit with a Hadamard gate on q[0] and verify a 50/50 probability split across outcomes 0 and 1.',
      instructions: [
        'Place a Hadamard (H) gate on wire q[0].',
        'Set simulation shots to at least 500.',
        'Run the simulation and inspect the histogram distribution.'
      ],
      hint: 'Drag the H gate onto wire q[0] and verify measurement is enabled.',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        requiredGates: ['h'],
        minimumShots: 500,
        targetProbabilities: {
          '0': { min: 0.40, max: 0.60 },
          '1': { min: 0.40, max: 0.60 }
        },
        targetStateDescription: 'Equal Superposition: |+⟩ = (|0⟩ + |1⟩) / √2 (~50% 0, ~50% 1)'
      }
    }
  },
  {
    id: 'lesson-3-entanglement-bell',
    lessonNumber: 3,
    trackId: 'track-1',
    trackTitle: 'Track 1 — Foundations (Beginner)',
    title: 'Multi-Qubit Systems & Entanglement',
    theoryBeat: "Correlated measurement; why entangled qubits aren't independent",
    practicalBeat: 'Build a Bell state (H + CNOT) in the Workbench',
    assessmentGate: 'Misconception-engine trigger: classic Bell-state independence error (your Tier-1 AI\'s flagship example)',
    badge: 'Entanglement Architect',
    difficulty: 'Beginner',
    estimatedMinutes: 10,
    xpReward: 200,
    summary: 'Synthesize non-local quantum correlations in a 2-qubit Bell state and avoid the common misconception that entangled qubits behave independently.',
    formula: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2 ≠ |ψ_A⟩ ⊗ |ψ_B⟩',
    formulaDescription: 'Entangled state cannot be factored into a tensor product of individual qubit states.',
    theoryParagraphs: [
      'In multi-qubit systems, the Hilbert space dimension grows exponentially as 2^n. Entanglement occurs when a composite state cannot be written as a product of individual subsystem states.',
      'By applying a Hadamard to qubit 0 and then a Controlled-NOT (CX) with control q[0] and target q[1], we synthesize the canonical Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.',
      'A classic misconception is that measuring qubit 0 and qubit 1 produce independent coin flips. In reality, their outcomes are perfectly correlated: measuring qubit 0 instantaneously dictates the outcome of qubit 1.'
    ],
    keyTakeaways: [
      'Entangled states cannot be factored into independent subsystems.',
      'A Bell pair requires H followed by CNOT.',
      'Outcomes |01⟩ and |10⟩ have strictly zero theoretical probability.'
    ],
    conceptTags: ['Entanglement', 'Bell State', 'CNOT', 'Non-separability', 'Correlation'],
    quiz: {
      question: 'Why can the Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 NOT be treated as two independent qubits?',
      options: [
        'Because it operates at higher clock speeds.',
        'Because its joint state cannot be factored into |ψ_A⟩ ⊗ |ψ_B⟩, and measurements are 100% correlated.',
        'Because it only works at absolute zero temperature.',
        'Because both qubits must always measure 0.'
      ],
      correctIndex: 1,
      explanation: 'Entanglement implies non-separability: no individual state vectors |ψ_A⟩ and |ψ_B⟩ exist such that |ψ_A⟩ ⊗ |ψ_B⟩ = (|00⟩ + |11⟩)/√2.'
    },
    assessment: {
      title: 'Bell State |Φ⁺⟩ Synthesizer',
      objective: 'Construct a 2-qubit Bell state circuit using H on q[0] and CNOT from q[0] to q[1]. Verify outcomes |00⟩ and |11⟩ are observed with zero leakage into |01⟩ or |10⟩.',
      instructions: [
        'Configure a 2-qubit, 2-classical-bit circuit.',
        'Place a Hadamard (H) gate on wire q[0].',
        'Place a CNOT (CX) gate with control q[0] and target q[1].',
        'Verify that only |00⟩ and |11⟩ appear in the measurement histogram.'
      ],
      hint: 'First put H on q[0]. Then place CX with control on q[0] and target on q[1].',
      starterCircuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 2,
        maxQubits: 2,
        requiredGates: ['h', 'cx'],
        minimumShots: 500,
        targetProbabilities: {
          '00': { min: 0.40, max: 0.60 },
          '11': { min: 0.40, max: 0.60 }
        },
        forbiddenOutcomes: ['01', '10'],
        targetStateDescription: 'Bell State: |Φ⁺⟩ = (|00⟩ + |11⟩) / √2 (~50% |00⟩, ~50% |11⟩)'
      }
    }
  },
  {
    id: 'lesson-4-measurement-probability',
    lessonNumber: 4,
    trackId: 'track-1',
    trackTitle: 'Track 1 — Foundations (Beginner)',
    title: 'Measurement & Probability',
    theoryBeat: 'Collapse on measurement; amplitude vs. probability',
    practicalBeat: 'Run a circuit across multiple shots, read the resulting histogram',
    assessmentGate: 'Quiz: amplitude vs. measured probability',
    badge: 'Probability Master',
    difficulty: 'Beginner',
    estimatedMinutes: 8,
    xpReward: 150,
    summary: 'Understand quantum wave-function collapse, distinguish complex probability amplitudes from real probabilities, and read empirical measurement histograms.',
    formula: 'P(x) = |⟨x|ψ⟩|² = |α_x|²,  ∑_x P(x) = 1',
    formulaDescription: 'The Born Rule connects abstract complex amplitudes to observable physical probabilities.',
    theoryParagraphs: [
      'A quantum state vector stores complex probability amplitudes α_x. These amplitudes can be positive, negative, or complex, enabling constructive and destructive interference.',
      'Upon measurement in the computational basis, the quantum state irreversibly collapses into one of the eigenstates |x⟩. The Born Rule establishes that the probability of observing outcome x is given by the squared magnitude |α_x|².',
      'Running a circuit for N shots produces an empirical count distribution that converges to the true Born probability distribution as N increases (by the Law of Large Numbers).'
    ],
    keyTakeaways: [
      'Amplitudes are complex numbers; probabilities are non-negative real numbers.',
      'Probability is the modulus squared of the amplitude: P(x) = |α_x|².',
      'Higher shot counts reduce statistical noise and reveal true probability distributions.'
    ],
    conceptTags: ['Born Rule', 'Measurement', 'Collapse', 'Histogram', 'Shots'],
    quiz: {
      question: 'If a quantum state has a probability amplitude of α = -1/√2 for state |1⟩, what is the measured probability of observing 1?',
      options: ['-50%', '0%', '50% (0.50)', '100%'],
      correctIndex: 2,
      explanation: 'Probabilities are always non-negative: P(1) = |-1/√2|² = (-1/√2) × (-1/√2) = 1/2 = 50%.'
    },
    assessment: {
      title: 'Measurement & Probability Verification',
      objective: 'Run a superposition circuit with at least 1000 shots and verify that empirical histogram counts match Born rule theoretical probabilities.',
      instructions: [
        'Place a Hadamard (H) gate on wire q[0].',
        'Set simulation shots to 1000.',
        'Run the simulation and observe the histogram bar chart.'
      ],
      hint: 'Place H on q[0] and run 1000 shots.',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [{ id: '1', gate: 'h', targets: [0] }],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        minimumShots: 1000,
        targetProbabilities: {
          '0': { min: 0.45, max: 0.55 },
          '1': { min: 0.45, max: 0.55 }
        },
        targetStateDescription: 'Measurement Verification: 1000 shots converging to 50/50 Born distribution'
      }
    }
  },

  // ═════════════════════════════════════════════════════════════════
  // TRACK 2 — CIRCUIT DESIGN & ALGORITHMS (INTERMEDIATE)
  // ═════════════════════════════════════════════════════════════════
  {
    id: 'lesson-5-gate-library',
    lessonNumber: 5,
    trackId: 'track-2',
    trackTitle: 'Track 2 — Circuit Design & Algorithms (Intermediate)',
    title: 'Gate Library Deep Dive',
    theoryBeat: 'Pauli gates, phase gates, rotation gates, and their matrix representations',
    practicalBeat: 'Build a multi-gate circuit, inspect its matrix output',
    assessmentGate: 'Circuit-matching challenge',
    badge: 'Unitary Architect',
    difficulty: 'Intermediate',
    estimatedMinutes: 12,
    xpReward: 250,
    summary: 'Deep dive into the universal gate set: Pauli X/Y/Z, Phase S/T, and parameterized rotations Rx/Ry/Rz with their unitary matrix forms.',
    formula: 'S = [[1, 0], [0, i]],  T = [[1, 0], [0, e^{iπ/4}]],  R_y(θ)',
    formulaDescription: 'All quantum gates are unitary matrices U satisfying U†U = I.',
    theoryParagraphs: [
      'Every valid quantum operation corresponds to a unitary transformation. Unitary matrices preserve the total probability norm of state vectors (⟨ψ|ψ⟩ = 1).',
      'The Pauli matrices (X, Y, Z) form orthogonal generators of rotations on the Bloch sphere. The Phase gate (S) performs a π/2 rotation around the Z-axis, while the T gate performs a π/4 rotation.',
      'Arbitrary single-qubit unitaries can be decomposed into Euler angle rotations: U = e^(iα) Rz(β) Ry(γ) Rz(δ).'
    ],
    keyTakeaways: [
      'Quantum gates are represented by unitary matrices (U†U = I).',
      'S gate is the square root of Z (S² = Z); T gate is the fourth root of Z (T⁴ = Z).',
      'Continuous rotation gates Rx(θ), Ry(θ), and Rz(θ) allow tuning arbitrary superposition angles.'
    ],
    conceptTags: ['Unitary Matrix', 'Pauli Gates', 'S Gate', 'T Gate', 'Rotation Gates', 'Euler Decomposition'],
    quiz: {
      question: 'What mathematical property must every quantum gate satisfy to preserve probability conservation?',
      options: ['The matrix must be symmetric', 'The matrix must be unitary (U†U = I)', 'The determinant must be zero', 'All elements must be real'],
      correctIndex: 1,
      explanation: 'Unitary matrices guarantee that the inner product ⟨Uψ|Uψ⟩ = ⟨ψ|U†U|ψ⟩ = ⟨ψ|ψ⟩ = 1, ensuring total probability is conserved.'
    },
    assessment: {
      title: 'Circuit-Matching Challenge: Phase & Rotation',
      objective: 'Construct a multi-gate circuit using Pauli-X, S, and Hadamard gates to match a target unitary state on wire q[0].',
      instructions: [
        'Place an X gate, followed by an S gate, followed by an H gate on wire q[0].',
        'Run simulation and inspect the statevector and unitary matrix panels.'
      ],
      hint: 'Sequence: X -> S -> H on wire q[0].',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        requiredGates: ['x', 's', 'h'],
        minimumShots: 500,
        targetStateDescription: 'Unitary Sequence: H · S · X on |0⟩'
      }
    }
  },
  {
    id: 'lesson-6-circuit-complexity',
    lessonNumber: 6,
    trackId: 'track-2',
    trackTitle: 'Track 2 — Circuit Design & Algorithms (Intermediate)',
    title: 'Circuit Design & Complexity',
    theoryBeat: 'Circuit depth, gate count, and why structure — not just qubit count — matters',
    practicalBeat: 'Use the live Circuit Analyzer panel on a real circuit to see these metrics computed',
    assessmentGate: 'Optimize a given circuit for lower depth',
    badge: 'Circuit Optimizer',
    difficulty: 'Intermediate',
    estimatedMinutes: 12,
    xpReward: 250,
    summary: 'Understand circuit depth, parallel gate execution, and gate complexity metrics that drive the Execution Router\'s backend selection.',
    formula: 'Depth = max_q { layers on wire q },  T_c ≫ Depth × t_gate',
    formulaDescription: 'Circuit depth dictates whether a circuit completes within qubit coherence time before decoherence noise destroys the state.',
    theoryParagraphs: [
      'Circuit depth is the number of time slices (layers) required to execute all gates in a quantum circuit. Two gates acting on disjoint qubits can execute simultaneously in parallel.',
      'Lowering circuit depth is critical in quantum computing because physical qubits have finite coherence times (T1 relaxation and T2 dephasing). High-depth circuits accumulate gate errors and decohere.',
      'Qualution\'s live Circuit Analyzer calculates depth, 2-qubit gate ratios, and Clifford fraction in real-time, directing circuits to the optimal simulator backend.'
    ],
    keyTakeaways: [
      'Circuit depth equals the longest critical path of sequential operations.',
      'Parallel gates on disjoint qubits reduce depth without changing gate count.',
      'Circuit structure directly determines hardware feasibility and simulator routing.'
    ],
    conceptTags: ['Circuit Depth', 'Gate Count', 'Circuit Analyzer', 'Optimization', 'Coherence Time'],
    quiz: {
      question: 'If two Hadamard gates are placed on wire q[0] and wire q[1] at the same time slice, what is the circuit depth?',
      options: ['Depth = 2', 'Depth = 1', 'Depth = 0', 'Depth = 4'],
      correctIndex: 1,
      explanation: 'Because q[0] and q[1] are independent disjoint qubits, both gates execute in parallel in a single layer, giving Depth = 1.'
    },
    assessment: {
      title: 'Depth Optimization Challenge',
      objective: 'Design a 2-qubit circuit with at least 4 gates whose depth does not exceed 2 layers by exploiting parallel gate execution.',
      instructions: [
        'Place gates in parallel across q[0] and q[1] (e.g. H on q[0] and H on q[1] in layer 1; X on q[0] and Z on q[1] in layer 2).',
        'Verify that the total gate count is at least 4 while depth is 2.'
      ],
      hint: 'Apply H to q[0] and q[1], then X to q[0] and Z to q[1].',
      starterCircuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 2,
        maxQubits: 2,
        maxGateCount: 6,
        requiredGates: ['h'],
        minimumShots: 500,
        targetStateDescription: 'Parallel 2-Qubit Circuit with Optimized Depth ≤ 2'
      }
    }
  },
  {
    id: 'lesson-7-deutsch-jozsa',
    lessonNumber: 7,
    trackId: 'track-2',
    trackTitle: 'Track 2 — Circuit Design & Algorithms (Intermediate)',
    title: 'Deutsch-Jozsa Algorithm',
    theoryBeat: 'Oracle-based problems; constant vs. balanced functions',
    practicalBeat: 'Build and run the Deutsch-Jozsa circuit on the Workbench',
    assessmentGate: 'Coding challenge: implement the oracle',
    badge: 'Algorithm Pioneer',
    difficulty: 'Intermediate',
    estimatedMinutes: 15,
    xpReward: 300,
    summary: 'Implement the first algorithm to demonstrate an exponential quantum speedup over deterministic classical computation using quantum phase kickback.',
    formula: 'U_f|x⟩|y⟩ = |x⟩|y ⊕ f(x)⟩',
    formulaDescription: 'Single query determines constant vs. balanced functions using phase kickback: evaluating into |-⟩ transfers f(x) into relative phase (-1)^f(x).',
    theoryParagraphs: [
      'The Deutsch-Jozsa algorithm solves a black-box problem: given an oracle computing a function f: {0,1}^n → {0,1} promised to be either constant (same output for all inputs) or balanced (output 0 for half, 1 for half), determine which it is.',
      'A classical deterministic computer must query the oracle up to 2^(n-1) + 1 times in the worst case. Deutsch-Jozsa determines the answer with 100% certainty in exactly 1 quantum query.',
      'The algorithm prepares the ancillary qubit in |-⟩ = (|0⟩ - |1⟩)/√2. By the phase kickback effect, applying the oracle kicks the function value into the phase: |x⟩ → (-1)^f(x) |x⟩.'
    ],
    keyTakeaways: [
      'Deutsch-Jozsa achieves exponential speedup over classical deterministic search.',
      'Phase kickback encodes function values into global/relative quantum phases.',
      'Interference cancels out all non-zero input states for constant functions.'
    ],
    conceptTags: ['Deutsch-Jozsa', 'Quantum Oracle', 'Phase Kickback', 'Speedup', 'Interference'],
    quiz: {
      question: 'How many queries does the Deutsch-Jozsa algorithm require to distinguish a constant function from a balanced function for n inputs?',
      options: ['2^n queries', '2^(n-1) + 1 queries', 'Exactly 1 query', 'n/2 queries'],
      correctIndex: 2,
      explanation: 'Deutsch-Jozsa requires exactly 1 quantum query, whereas a classical deterministic algorithm requires 2^(n-1) + 1 queries in the worst case.'
    },
    assessment: {
      title: 'Coding Challenge: Implement Deutsch-Jozsa Balanced Oracle',
      objective: 'Assemble a 2-qubit Deutsch-Jozsa circuit with a balanced oracle (CNOT from input q[0] to ancilla q[1]) and verify interference reveals the balanced nature.',
      instructions: [
        'Initialize input q[0] with H, and ancilla q[1] with X then H.',
        'Implement the balanced oracle: CX with control q[0] and target q[1].',
        'Apply Hadamard to input q[0] before measurement.',
        'Verify that measuring q[0] yields outcome 1 with 100% probability (indicating balanced).'
      ],
      hint: 'Input wire: H, CX(0->1), H. Ancilla wire: X, H.',
      starterCircuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 2,
        maxQubits: 2,
        requiredGates: ['h', 'x', 'cx'],
        minimumShots: 500,
        targetProbabilities: {
          '01': { min: 0.85, max: 1.00 }
        },
        targetStateDescription: 'Deutsch-Jozsa Balanced Oracle: Deterministic detection of balanced function'
      }
    }
  },
  {
    id: 'lesson-8-grovers-search',
    lessonNumber: 8,
    trackId: 'track-2',
    trackTitle: 'Track 2 — Circuit Design & Algorithms (Intermediate)',
    title: "Grover's Search Algorithm",
    theoryBeat: 'Amplitude amplification, why it beats classical search',
    practicalBeat: "Build Grover's algorithm for a small search space",
    assessmentGate: 'Predict required iteration count before running',
    badge: 'Quantum Searcher',
    difficulty: 'Intermediate',
    estimatedMinutes: 5,
    xpReward: 350,
    summary: 'Harness amplitude amplification to locate a marked target item in an unstructured N-item database in O(√N) iterations.',
    formula: 'G = (2|s⟩⟨s| - I) O_target,  R ≈ (π/4)√N',
    formulaDescription: 'Repeated application of Oracle reflection followed by Diffusion reflection amplifies the target state.',
    theoryParagraphs: [
      'Grover\'s search algorithm provides a provable quadratic speedup for searching unsorted databases of size N. While classical algorithms require O(N) evaluations, Grover solves it in O(√N).',
      'The algorithm consists of two geometric reflections: first, the Oracle inverts the phase of the marked state; second, the Grover Diffusion operator reflects all amplitudes about their mean.',
      'For a 2-qubit search space (N=4), exactly R = 1 Grover iteration amplifies the target state probability to 100%.'
    ],
    keyTakeaways: [
      'Grover provides a quadratic speedup: O(√N) vs classical O(N).',
      'Amplitude amplification uses geometric reflections about the mean amplitude.',
      'Over-rotating beyond the optimal iteration count R decreases target probability.'
    ],
    conceptTags: ['Grover Search', 'Amplitude Amplification', 'Diffusion Operator', 'Oracle', 'Unstructured Search'],
    quiz: {
      question: 'What is the optimal number of Grover iterations required to find a marked state in an N = 4 (2-qubit) search space?',
      options: ['4 iterations', '2 iterations', '1 iteration', '16 iterations'],
      correctIndex: 2,
      explanation: 'For N = 4, the formula R ≈ (π/4)√4 ≈ π/2 ≈ 1.57 rounds to 1 iteration, which achieves exactly 100% theoretical probability.'
    },
    assessment: {
      title: '2-Qubit Grover Search Implementation',
      objective: 'Construct a 2-qubit Grover search circuit targeting state |11⟩. Apply superposition, CZ oracle, and the H-X-CZ-X-H diffusion operator.',
      instructions: [
        'Place H on both q[0] and q[1].',
        'Oracle for |11⟩: apply CZ (or H-CX-H) between q[0] and q[1].',
        'Diffusion: apply H on both, X on both, CZ between q[0] and q[1], X on both, H on both.',
        'Verify measurement results show state |11⟩ with > 85% probability.'
      ],
      hint: 'Init: H, H. Oracle: CZ. Diffusion: H, X, CZ, X, H on wires.',
      starterCircuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 2,
        maxQubits: 2,
        requiredGates: ['h', 'x'],
        minimumShots: 500,
        targetProbabilities: {
          '11': { min: 0.85, max: 1.00 }
        },
        targetStateDescription: 'Grover Search: State |11⟩ amplified to near 100% probability'
      }
    }
  },

  // ═════════════════════════════════════════════════════════════════
  // TRACK 3 — ADVANCED / VARIATIONAL ALGORITHMS (ADVANCED)
  // ═════════════════════════════════════════════════════════════════
  {
    id: 'lesson-9-variational-circuits',
    lessonNumber: 9,
    trackId: 'track-3',
    trackTitle: 'Track 3 — Advanced / Variational Algorithms (Advanced)',
    title: 'Variational Circuits Intro',
    theoryBeat: 'Parameterized gates; the hybrid classical-quantum optimization loop',
    practicalBeat: 'Build a simple ansatz circuit',
    assessmentGate: 'Quiz on ansatz structure',
    badge: 'Ansatz Designer',
    difficulty: 'Advanced',
    estimatedMinutes: 15,
    xpReward: 350,
    summary: 'Enter the NISQ era: explore parameterized quantum circuits (ansatzes) and the hybrid classical-quantum optimization loop.',
    formula: '|ψ(θ)⟩ = U(θ)|0⟩,  min_θ ⟨ψ(θ)|H|ψ(θ)⟩',
    formulaDescription: 'Hybrid loop: quantum processor executes circuit and measures expectation values; classical optimizer adjusts parameters.',
    theoryParagraphs: [
      'Noisy Intermediate-Scale Quantum (NISQ) devices cannot sustain deep, fault-tolerant circuits. Variational Quantum Algorithms (VQAs) address this constraint by keeping circuit depth shallow.',
      'A parameterized quantum circuit (or ansatz) U(θ) applies rotation gates (Rx, Ry, Rz) with variable continuous angles θ, coupled with fixed entangling gates (CNOTs).',
      'A classical optimization algorithm (such as COBYLA, SPSA, or Gradient Descent) iteratively adjusts the parameter vector θ to minimize an objective cost function.'
    ],
    keyTakeaways: [
      'VQAs combine short-depth quantum execution with classical parameter optimization.',
      'Ansatz architecture balances expressive power against trainability and barren plateaus.',
      'Expectation values are estimated via repeated quantum measurements.'
    ],
    conceptTags: ['VQA', 'Ansatz', 'Parameterized Gates', 'Hybrid Loop', 'NISQ'],
    quiz: {
      question: 'In a hybrid classical-quantum variational algorithm, what primary task is performed by the classical co-processor?',
      options: [
        'Simulating the exponential statevector',
        'Updating circuit parameters θ using optimization routines based on measured costs',
        'Maintaining qubit physical cryogenics',
        'Replacing quantum entangling gates'
      ],
      correctIndex: 1,
      explanation: 'The classical co-processor runs numerical optimizers (like SPSA or COBYLA) to update parameters θ based on measured expectation values from the QPU.'
    },
    assessment: {
      title: 'Build a Hardware-Efficient Ansatz',
      objective: 'Construct a 2-qubit parameterized ansatz with single-qubit rotations followed by an entangling CNOT gate.',
      instructions: [
        'Place single-qubit rotation gates on q[0] and q[1].',
        'Add an entangling CNOT gate between q[0] and q[1].',
        'Measure both qubits to inspect the parameterized distribution.'
      ],
      hint: 'Use Ry or Rx on both wires followed by a CX gate.',
      starterCircuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 2,
        maxQubits: 2,
        requiredGates: ['cx'],
        minimumShots: 500,
        targetStateDescription: 'Parameterized Ansatz: Entangled 2-Qubit Variational State'
      }
    }
  },
  {
    id: 'lesson-10-qaoa',
    lessonNumber: 10,
    trackId: 'track-3',
    trackTitle: 'Track 3 — Advanced / Variational Algorithms (Advanced)',
    title: 'QAOA',
    theoryBeat: 'Mapping combinatorial optimization problems onto quantum circuits',
    practicalBeat: 'Run QAOA on a small MaxCut instance',
    assessmentGate: 'Coding challenge: tune circuit parameters',
    badge: 'Optimization Specialist',
    difficulty: 'Advanced',
    estimatedMinutes: 18,
    xpReward: 400,
    summary: 'Map NP-hard combinatorial optimization problems like MaxCut to quantum Ising Hamiltonians using the Quantum Approximate Optimization Algorithm.',
    formula: '|γ, β⟩ = ∏_{l=1}^p e^{-iβ_l H_M} e^{-iγ_l H_C} |+⟩^{⊗n}',
    formulaDescription: 'Alternates problem Cost Hamiltonian evolution (e^{-iγ H_C}) and transverse Mixer Hamiltonian evolution (e^{-iβ H_M}).',
    theoryParagraphs: [
      'The Quantum Approximate Optimization Algorithm (QAOA) is designed to find near-optimal solutions to combinatorial optimization problems.',
      'For MaxCut on a graph G = (V, E), the goal is to partition vertices into two sets to maximize cut edges. Each vertex maps to a qubit, and each edge (u, v) maps to an Ising interaction term Z_u Z_v.',
      'QAOA begins in the equal superposition state |+⟩^⊗n, then alternates p layers of Cost Hamiltonian evolution (e^(-iγ Z_u Z_v)) and Mixer Hamiltonian evolution (e^(-iβ X_v)).'
    ],
    keyTakeaways: [
      'Graph cut problems map directly to pairwise Ising ZZ interaction terms.',
      'Cost Hamiltonian penalizes un-cut edges; Mixer Hamiltonian drives quantum tunneling.',
      'Higher layer depth p increases approximation ratio toward the exact optimum.'
    ],
    conceptTags: ['QAOA', 'MaxCut', 'Combinatorial Optimization', 'Ising Model', 'Cost Hamiltonian'],
    quiz: {
      question: 'In QAOA for MaxCut, what type of quantum gate interaction encodes an edge between two connected vertices?',
      options: ['A single Pauli-X gate', 'A pairwise ZZ interaction (e.g. CNOT - Rz - CNOT)', 'A Hadamard gate', 'A swap gate'],
      correctIndex: 1,
      explanation: 'Edges in MaxCut map to Ising Hamiltonian terms H_C = Σ (I - Z_u Z_v)/2, which are synthesized as ZZ interactions using CNOT and Rz gates.'
    },
    assessment: {
      title: 'QAOA MaxCut 2-Qubit Challenge',
      objective: 'Construct a 1-layer QAOA circuit for a 2-vertex graph. Prepare |++⟩, apply a ZZ cost interaction, and follow with an X mixer layer.',
      instructions: [
        'Initialize q[0] and q[1] with Hadamard (H) gates.',
        'Synthesize ZZ cost term: CX(0->1), Rz/Z on q[1], CX(0->1).',
        'Synthesize X mixer: Rx or X on both qubits.',
        'Run simulation and evaluate graph partition cuts.'
      ],
      hint: 'Init: H on both. Cost: CX(0,1), Z on q[1], CX(0,1). Mixer: X on both.',
      starterCircuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 2,
        maxQubits: 2,
        requiredGates: ['h', 'cx'],
        minimumShots: 500,
        targetStateDescription: 'QAOA Circuit: Alternating Cost and Mixer layers for MaxCut'
      }
    }
  },
  {
    id: 'lesson-11-vqe',
    lessonNumber: 11,
    trackId: 'track-3',
    trackTitle: 'Track 3 — Advanced / Variational Algorithms (Advanced)',
    title: 'VQE',
    theoryBeat: 'Molecular energy estimation; the chemistry application of quantum computing',
    practicalBeat: 'Run VQE on a simple Hamiltonian',
    assessmentGate: 'Project-style challenge with instructor review',
    badge: 'Quantum Chemist',
    difficulty: 'Advanced',
    estimatedMinutes: 20,
    xpReward: 450,
    summary: 'Estimate molecular ground state energies and chemical binding curves using the Variational Quantum Eigensolver and the Rayleigh-Ritz variational principle.',
    formula: 'E₀ ≤ ⟨ψ(θ)|H_mol|ψ(θ)⟩ = ∑_i c_i ⟨ψ(θ)|P_i|ψ(θ)⟩',
    formulaDescription: 'Second-quantized molecular electronic Hamiltonians map to linear combinations of Pauli strings P_i.',
    theoryParagraphs: [
      'Simulating quantum chemistry—such as catalyst design and molecular reaction pathways—is one of the most promising applications of quantum computing.',
      'The electronic Hamiltonian of a molecule (e.g. H2, LiH) is mapped to qubit operators via transformations such as Jordan-Wigner or Bravyi-Kitaev, producing a sum of Pauli strings H = Σ c_i P_i.',
      'The Rayleigh-Ritz variational principle guarantees that the expectation value of any trial state |ψ(θ)⟩ is bounded below by the ground state energy E_0. Minimizing this expectation value yields the ground state energy.'
    ],
    keyTakeaways: [
      'Molecular Hamiltonians decompose into weighted sums of Pauli string measurements.',
      'Rayleigh-Ritz theorem guarantees the variational expectation value is an upper bound on ground state energy.',
      'VQE is inherently resilient to certain coherent quantum errors.'
    ],
    conceptTags: ['VQE', 'Quantum Chemistry', 'Rayleigh-Ritz', 'Jordan-Wigner', 'Ground State Energy'],
    quiz: {
      question: 'According to the Rayleigh-Ritz variational theorem, what is the relationship between the measured expectation value ⟨ψ(θ)|H|ψ(θ)⟩ and true ground state energy E_0?',
      options: [
        '⟨ψ(θ)|H|ψ(θ)⟩ is strictly less than E_0',
        '⟨ψ(θ)|H|ψ(θ)⟩ is greater than or equal to E_0',
        '⟨ψ(θ)|H|ψ(θ)⟩ is always zero',
        '⟨ψ(θ)|H|ψ(θ)⟩ is completely unrelated to E_0'
      ],
      correctIndex: 1,
      explanation: 'The Rayleigh-Ritz theorem states that the expectation value of any state is an upper bound: ⟨ψ(θ)|H|ψ(θ)⟩ ≥ E_0, with equality achieved if and only if |ψ(θ)⟩ is the exact ground state.'
    },
    assessment: {
      title: 'Project Challenge: Molecular Hamiltonian Estimation',
      objective: 'Assemble a trial wavefunction for an H2 molecule minimal basis. Prepare an entangled state with parameterized rotations and measure the expectation value.',
      instructions: [
        'Initialize 2 qubits for the minimal active space.',
        'Prepare an entangled trial state using H on q[0] and CNOT(0->1).',
        'Apply parameterized rotations to explore energy landscapes.',
        'Verify measurement distributions satisfy the symmetry constraints.'
      ],
      hint: 'Prepare H on q[0], CX(0,1), followed by phase adjustments.',
      starterCircuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 2,
        maxQubits: 2,
        requiredGates: ['h', 'cx'],
        minimumShots: 500,
        targetStateDescription: 'VQE Molecular Trial Circuit: Entangled Ansatz for Hamiltonian Expectation'
      }
    }
  },
  {
    id: 'lesson-12-adaptive-execution',
    lessonNumber: 12,
    trackId: 'track-3',
    trackTitle: 'Track 3 — Advanced / Variational Algorithms (Advanced)',
    title: 'Capstone — Adaptive Execution',
    theoryBeat: 'Recap of how the Circuit Analyzer and Execution Router work together end-to-end',
    practicalBeat: 'Submit an original circuit and observe the live routing decision (Local / Stabilizer / MPS / Cloud)',
    assessmentGate: 'Reflective report, visible on instructor dashboard',
    badge: 'Capstone Master',
    difficulty: 'Advanced',
    estimatedMinutes: 25,
    xpReward: 500,
    summary: 'Synthesize your quantum engineering expertise: design complex circuits, observe adaptive routing decisions (Local Statevector, Clifford/Stabilizer, MPS, Cloud), and generate a capstone report.',
    formula: 'Backend = R(Qubits, Depth, Clifford Fraction, Entanglement Entropy)',
    formulaDescription: 'Qualution Execution Router chooses optimal simulation technique or cloud dispatch dynamically.',
    theoryParagraphs: [
      'In industrial quantum computing, no single simulator or hardware platform suffices for all workloads. Highly entangled circuits require statevector simulation or physical QPUs; stabilizer circuits can simulate thousands of qubits via the Gottesman-Knill theorem; weakly entangled circuits thrive on Matrix Product States (MPS).',
      'Qualution\'s Execution Router performs static and dynamic analysis of your circuit: checking qubit count, circuit depth, 2-qubit gate density, and non-Clifford T/rotation gates.',
      'In this capstone, you submit an original multi-qubit circuit, observe the router\'s real-time backend selection, and compile a reflective quantum engineering report.'
    ],
    keyTakeaways: [
      'Adaptive routing eliminates memory bottlenecks and optimizes execution latency.',
      'Clifford circuits scale polynomially via the stabilizer formalism.',
      'Hardware-aware design is essential for scaling quantum software in production.'
    ],
    conceptTags: ['Execution Router', 'Adaptive Execution', 'Clifford / Stabilizer', 'MPS', 'Capstone', 'Cloud QPU'],
    quiz: {
      question: 'If a circuit has 60 qubits but uses exclusively Clifford gates (H, S, CNOT) and Z-measurements, which backend will Qualution\'s Execution Router select for instant execution?',
      options: [
        'Local Full Statevector (which requires exabytes of RAM)',
        'Stabilizer / Clifford Simulator (polynomial-time via Gottesman-Knill theorem)',
        'Classical Monte Carlo Brute Force',
        'Hardware Cloud QPU with 2-hour queue'
      ],
      correctIndex: 1,
      explanation: 'By the Gottesman-Knill theorem, Clifford circuits can be simulated classically in polynomial time using the stabilizer formalism, avoiding exponential statevector memory overhead.'
    },
    assessment: {
      title: 'Capstone Challenge: Adaptive Circuit Synthesis',
      objective: 'Design a comprehensive 3-qubit circuit synthesizing superposition, multi-qubit entanglement, and phase manipulation to trigger the live Execution Router.',
      instructions: [
        'Configure a 3-qubit circuit.',
        'Apply single-qubit gates (H, X, Z) across multiple wires.',
        'Include at least one multi-qubit entangling gate (CX).',
        'Run simulation and inspect the Execution Router badge and telemetry.'
      ],
      hint: 'Combine H, X, CX across 3 qubits.',
      starterCircuit: {
        qubits: 3,
        classical_bits: 3,
        gates: [],
        measure: true,
        shots: 1000
      },
      criteria: {
        minQubits: 3,
        maxQubits: 3,
        requiredGates: ['h', 'cx'],
        minimumShots: 500,
        targetStateDescription: 'Capstone Multi-Qubit Circuit: Adaptive Routing Demonstration'
      }
    }
  }
];

export const CURRICULUM_TRACKS: CurriculumTrack[] = [
  {
    id: 'track-1',
    trackNumber: 1,
    title: 'Track 1 — Foundations (Beginner)',
    subtitle: 'Beginner',
    difficulty: 'Beginner',
    description: 'Master core quantum principles from deterministic bits to superposition, non-local entanglement, and Born rule measurement.',
    modules: QUANTUM_CURRICULUM.filter((m) => m.trackId === 'track-1')
  },
  {
    id: 'track-2',
    trackNumber: 2,
    title: 'Track 2 — Circuit Design & Algorithms (Intermediate)',
    subtitle: 'Intermediate',
    difficulty: 'Intermediate',
    description: 'Explore universal gate libraries, matrix representations, circuit depth optimization, and flagship quantum algorithms (Deutsch-Jozsa & Grover).',
    modules: QUANTUM_CURRICULUM.filter((m) => m.trackId === 'track-2')
  },
  {
    id: 'track-3',
    trackNumber: 3,
    title: 'Track 3 — Advanced / Variational Algorithms (Advanced)',
    subtitle: 'Advanced',
    difficulty: 'Advanced',
    description: 'Dive into NISQ-era variational algorithms (VQA, QAOA, VQE) and capstone adaptive execution routing across simulation paradigms.',
    modules: QUANTUM_CURRICULUM.filter((m) => m.trackId === 'track-3')
  }
];

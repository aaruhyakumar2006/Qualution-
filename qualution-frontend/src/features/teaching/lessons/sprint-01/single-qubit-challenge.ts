import type { LessonScript } from '../../types';

export const s1SingleQubitChallengeLesson: LessonScript = {
  id: 's1-single-qubit-challenge',
  title: 'Single-Qubit Challenge: Predict, Build & Prove',
  sprint: 1,
  difficulty: 'Intermediate',
  estimatedMinutes: 10,
  xpReward: 250,
  curriculumModuleId: 'lesson-1-single-qubit-challenge',
  completionMessage:
    'Outstanding achievement! You conquered the Single-Qubit Challenge by predicting, building, debugging, and proving single-qubit circuits across bit flips, superposition, and quantum phase interference.',
  conceptTags: [
    'Assessment',
    'Pauli-X',
    'Hadamard',
    'Pauli-Z',
    'Superposition',
    'Relative Phase',
    'Interference',
    'Debugging',
  ],
  learningObjectives: [
    'Apply knowledge of X, H and Z gates independently',
    'Predict quantum measurement outcomes before running a circuit',
    'Construct a circuit from a behavioral objective',
    'Distinguish deterministic measurement from superposition',
    'Reason about phase and interference',
    'Debug a circuit that does not produce the expected behavior',
    'Demonstrate transfer beyond guided demonstrations',
  ],
  prerequisites: [
    'Initialize & Measure a Qubit',
    'The Pauli-X Gate',
    'Hadamard Gate & Superposition',
    'Z Gate: Understanding Quantum Phase',
    'Gate Ordering & Non-Commutativity',
  ],
  summary:
    'Test your single-qubit mastery in this hands-on challenge. Solve 5 progressive tasks: create |1⟩, generate superposition, build phase interference, debug a broken circuit, and prove your understanding.',
  starterCircuit: {
    qubits: 1,
    classical_bits: 1,
    gates: [],
    measure: true,
    shots: 500,
  },
  steps: [
    // ── STEP 1: Overview ──────────────────────────────────────────
    {
      id: 'step-1-overview',
      stepNumber: 1,
      title: 'Challenge Overview: Single-Qubit Mastery',
      explanation:
        'Welcome to the Sprint 1 Single-Qubit Challenge! In this practical assessment, you will prove your quantum circuit skills across 5 real challenges: 1) Create state |1⟩, 2) Create balanced superposition, 3) Build phase interference, 4) Debug an erroneous circuit, and 5) Explain quantum probability. Predict, build, and prove your circuits!',
      narrationText:
        'Welcome to the Single-Qubit Challenge! You will solve five progressive hands-on tasks using the Pauli-X, Hadamard, and Pauli-Z gates. Ready your quantum toolkit.',
      actions: [
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'highlight_qubit', qubitIndex: 0 },
        {
          type: 'explain',
          title: 'Sprint 1 Final Assessment',
          message: 'Wire q[0] is in |0⟩. Solve each challenge using the Quantum Lab.',
        },
      ],
    },

    // ── STEP 2: Challenge 1 Theory & Prediction ──────────────────
    {
      id: 'step-2-ch1-theory',
      stepNumber: 2,
      title: 'Challenge 1: Prediction',
      explanation:
        'Challenge 1 Goal: Transform ground state |0⟩ into state |1⟩ with 100% deterministic measurement.',
      narrationText:
        'Challenge 1: Think about which single-qubit operation transforms ground state |0⟩ into state |1⟩ with 100% certainty.',
      actions: [
        {
          type: 'explain',
          title: 'Deterministic Flip',
          message: 'The Pauli-X gate performs a quantum NOT operation: X|0⟩ = |1⟩.',
        }
      ],
      checkpoint: {
        id: 'pred-ch1-bitflip',
        prompt: 'Challenge 1 Prediction',
        question: 'Which single-qubit operation transforms ground state |0⟩ into state |1⟩ with 100% certainty?',
        options: [
          {
            id: 'opt-0',
            label: 'Pauli-X (Bit Flip)',
            description: 'Flips |0⟩ directly to |1⟩ deterministically',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Hadamard (Superposition)',
            description: 'Creates equal superposition (|0⟩ + |1⟩)/√2',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Pauli-Z (Phase Flip)',
            description: 'Leaves |0⟩ unchanged: Z|0⟩ = |0⟩',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'The Pauli-X gate performs a quantum NOT operation: X|0⟩ = |1⟩, yielding classical bit 1 with 100% probability.',
      },
    },

    // ── STEP 3: Challenge 1 Build & Prove |1⟩ ─────────────────────
    {
      id: 'step-3-ch1-build',
      stepNumber: 3,
      title: 'Challenge 1: Build & Prove |1⟩',
      explanation:
        'Objective: Build a circuit on wire q[0] that starts in |0⟩ and produces |1⟩ with approximately 100% probability when measured. Place the gate, run the simulation, and submit your solution.',
      narrationText:
        'Now build Challenge 1: add the appropriate gate to wire q[0], simulate the circuit, and submit your solution once outcome 1 reaches at least 95%.',
      actions: [{ type: 'clear_highlights' }],
      takeover: {
        taskType: 'add_gate',
        prompt: 'Challenge 1: Create State |1⟩',
        goalDescription: 'Build a circuit starting in |0⟩ that measures outcome 1 with approximately 100% probability.',
        instructions: [
          'Add a gate to wire q[0] to transform |0⟩ into |1⟩.',
          'Click Run Simulation to test your circuit.',
          'Submit your solution once outcome 1 reaches at least 95%.',
        ],
        hints: [
          'Think about the gate that flips the computational-basis value.',
          'Which gate maps |0⟩ directly to |1⟩?',
        ],
        allowEarlyCompletion: false,
        suggestedActionLabel: 'Submit Challenge 1',
        completionCriteria: {
          type: 'all_of',
          criteria: [
            {
              type: 'circuit_has_gates',
              minGates: 1,
              requiredGates: ['x'],
              targetQubits: [0],
            },
            {
              type: 'simulation_probability',
              state: '1',
              minProbability: 0.95,
            },
          ],
        },
      },
    },

    // ── STEP 4: Challenge 2 Theory & Prediction ──────────────────
    {
      id: 'step-4-ch2-theory',
      stepNumber: 4,
      title: 'Challenge 2: Prediction',
      explanation:
        'Challenge 2 Goal: Create a balanced quantum superposition.',
      narrationText:
        'Challenge 2: Consider what measurement distribution a balanced quantum superposition circuit produces in the computational basis.',
      actions: [
        {
          type: 'explain',
          title: 'Equal Probability',
          message: 'An equal superposition state like |+⟩ = (|0⟩ + |1⟩)/√2 has equal probability amplitudes, measuring 50% 0 and 50% 1.',
        }
      ],
      checkpoint: {
        id: 'pred-ch2-superposition',
        prompt: 'Challenge 2 Prediction',
        question:
          'What measurement distribution should an equal quantum superposition circuit produce in the computational basis?',
        options: [
          {
            id: 'opt-0',
            label: 'Approximately 50% 0 and 50% 1',
            description: 'Equal probability across both basis outcomes',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Approximately 100% 0',
            description: 'Deterministic outcome 0',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Approximately 100% 1',
            description: 'Deterministic outcome 1',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'An equal superposition state like |+⟩ = (|0⟩ + |1⟩)/√2 has equal probability amplitudes |1/√2|² = 0.5, measuring 50% 0 and 50% 1.',
      },
    },

    // ── STEP 5: Challenge 2 Build Superposition ───────────────────
    {
      id: 'step-5-ch2-build',
      stepNumber: 5,
      title: 'Challenge 2: Build Superposition',
      explanation:
        'Objective: Build a circuit on wire q[0] that produces approximately 50% 0 and 50% 1 when measured. Run the simulation to verify the distribution.',
      narrationText:
        'Now build Challenge 2: add the gate that creates an equal superposition from |0⟩, run the simulation, and submit your solution.',
      actions: [
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
      ],
      takeover: {
        taskType: 'add_gate',
        prompt: 'Challenge 2: Create Superposition',
        goalDescription: 'Build a circuit starting in |0⟩ that produces an equal 50/50 measurement distribution.',
        instructions: [
          'Add a gate to wire q[0] that transforms |0⟩ into an equal superposition.',
          'Run the simulation to inspect the histogram.',
          'Submit your solution when both outcome 0 and outcome 1 fall between 40% and 60%.',
        ],
        hints: [
          'Think about the gate that creates an equal superposition from |0⟩.',
          'The Hadamard (H) gate creates state |+⟩.',
        ],
        allowEarlyCompletion: false,
        suggestedActionLabel: 'Submit Challenge 2',
        completionCriteria: {
          type: 'all_of',
          criteria: [
            {
              type: 'circuit_has_gates',
              minGates: 1,
              requiredGates: ['h'],
              targetQubits: [0],
            },
            {
              type: 'simulation_probability',
              state: '0',
              minProbability: 0.4,
              maxProbability: 0.6,
            },
            {
              type: 'simulation_probability',
              state: '1',
              minProbability: 0.4,
              maxProbability: 0.6,
            },
          ],
        },
      },
    },

    // ── STEP 6: Challenge 3 Theory & Prediction ──────────────────
    {
      id: 'step-6-ch3-theory',
      stepNumber: 6,
      title: 'Challenge 3: Prediction',
      explanation:
        'Challenge 3 Goal: Produce outcome 1 with 100% probability using ONLY Hadamard (H) and Pauli-Z gates.',
      narrationText:
        'Challenge 3: If your circuit correctly uses H and Z to manipulate relative phase, it will convert phase into constructive interference for a deterministic outcome.',
      actions: [
        {
          type: 'explain',
          title: 'Phase to Interference',
          message: 'By using H → Z → H, H creates |+⟩, Z flips the relative phase to |−⟩, and the final H converts the phase difference into constructive interference for state |1⟩.',
        }
      ],
      checkpoint: {
        id: 'pred-ch3-phase',
        prompt: 'Challenge 3 Prediction',
        question:
          'If your circuit correctly manipulates relative phase using only H and Z, what final measurement result must it produce to reach state |1⟩?',
        options: [
          {
            id: 'opt-0',
            label: 'Approximately 100% 1',
            description: 'Constructive interference for 1 and destructive for 0',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Approximately 50% 0 and 50% 1',
            description: 'Equal superposition without interference',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Approximately 100% 0',
            description: 'Destructive interference for 1',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'By using H → Z → H, H creates |+⟩, Z flips the relative phase to |−⟩, and the final H converts the phase difference into constructive interference for state |1⟩ (100% 1).',
      },
    },

    // ── STEP 7: Challenge 3 Build Phase Interference ──────────────
    {
      id: 'step-7-ch3-build',
      stepNumber: 7,
      title: 'Challenge 3: Hidden Phase & Interference',
      explanation:
        'Objective: Build a circuit starting from |0⟩ that produces approximately 100% outcome 1 using ONLY H and Z gates. Construct the sequence, simulate, and submit your solution.',
      narrationText:
        'Now build Challenge 3: create state |1⟩ using only H and Z gates on wire q[0]. Run the simulation and submit when outcome 1 reaches at least 95%.',
      actions: [
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
      ],
      takeover: {
        taskType: 'observe_interference',
        prompt: 'Challenge 3: Phase & Interference',
        goalDescription: 'Produce approximately 100% outcome 1 starting from |0⟩ using only H and Z gates.',
        instructions: [
          'Place H and Z gates on wire q[0].',
          'Run the simulation to observe how relative phase interferes.',
          'Submit your solution when outcome 1 reaches at least 95%.',
        ],
        hints: [
          'Use H to create an equal superposition.',
          'Use Z to flip the relative phase of the |1⟩ component.',
          'Use a final H gate to convert that relative phase into computational interference.',
        ],
        allowEarlyCompletion: false,
        suggestedActionLabel: 'Submit Challenge 3',
        completionCriteria: {
          type: 'all_of',
          criteria: [
            {
              type: 'circuit_has_gates',
              minGates: 3,
              requiredGates: ['h', 'z', 'h'],
              targetQubits: [0],
            },
            {
              type: 'simulation_probability',
              state: '1',
              minProbability: 0.95,
            },
          ],
        },
      },
    },

    // ── STEP 8: Challenge 4 Debug Intro ───────────────────────────
    {
      id: 'step-8-ch4-debug-intro',
      stepNumber: 8,
      title: 'Challenge 4: Debug the Circuit',
      explanation:
        'Challenge 4: A student built the circuit H → X → H intending to produce outcome 1 with 100% probability. However, running this circuit produces outcome 0 instead! Inspect the gates on wire q[0] and diagnose why.',
      narrationText:
        'Challenge 4: This circuit was intended to produce outcome 1, but running it yields outcome 0! Inspect the circuit and prepare to fix it.',
      actions: [
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 0,
          gateId: 'broken-h1',
        },
        {
          type: 'add_gate',
          gate: 'x',
          targets: [0],
          column: 1,
          gateId: 'broken-x',
        },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 2,
          gateId: 'broken-h2',
        },
        { type: 'highlight_gate', gateId: 'broken-x', targetQubit: 0, column: 1 },
        {
          type: 'explain',
          title: 'Bug Diagnosed',
          message:
            'H|+⟩ = |+⟩ under X, and the second H returns the state to |0⟩! The circuit fails to produce outcome 1.',
        },
      ],
    },

    // ── STEP 9: Challenge 4 Fix & Prove ───────────────────────────
    {
      id: 'step-9-ch4-debug-fix',
      stepNumber: 9,
      title: 'Challenge 4: Fix & Prove',
      explanation:
        'Objective: Modify wire q[0] so that the circuit achieves the intended target: approximately 100% outcome 1. You may replace gates or reconfigure the circuit.',
      narrationText:
        'Now fix the circuit: modify the gates on wire q[0] so outcome 1 reaches at least 95%, run the simulation, and submit your solution.',
      actions: [{ type: 'clear_highlights' }],
      takeover: {
        taskType: 'modify_circuit',
        prompt: 'Challenge 4: Circuit Debugging',
        goalDescription: 'Modify the circuit so it reaches the target outcome 1 with at least 95% probability.',
        instructions: [
          'Inspect the gates on wire q[0].',
          'Correct the error (for example, swap X with Z to create H-Z-H, or simplify).',
          'Run the simulation to verify outcome 1.',
          'Submit your solution once outcome 1 reaches at least 95%.',
        ],
        hints: [
          'Remember that X on |+⟩ leaves the state as |+⟩, so the second H rotates it back to |0⟩.',
          'Which gate applies a relative phase flip to |+⟩ so that H rotates it to |1⟩?',
        ],
        allowEarlyCompletion: false,
        suggestedActionLabel: 'Submit Challenge 4',
        completionCriteria: {
          type: 'all_of',
          criteria: [
            {
              type: 'simulation_probability',
              state: '1',
              minProbability: 0.95,
            },
          ],
        },
      },
    },

    // ── STEP 10: Challenge 5 Conceptual Explanation ──────────────
    {
      id: 'step-10-ch5-concept',
      stepNumber: 10,
      title: 'Challenge 5: Conceptual Explanation',
      explanation:
        'Prove your conceptual mastery by explaining why single-qubit quantum circuits can produce probabilistic results.',
      narrationText:
        'Final question: Why can a circuit containing only single-qubit gates produce a result that is probabilistic when measured in the computational basis?',
      actions: [],
      checkpoint: {
        id: 'pred-ch5-concept',
        prompt: 'Module Assessment 4',
        question:
          'Why can a circuit containing only single-qubit gates produce a result that is probabilistic when measured in the computational basis?',
        options: [
          {
            id: 'opt-0',
            label:
              'Because gates such as H can create a superposition, which produces probabilistic outcomes when measured in the computational basis.',
            description: 'Superposition amplitudes determine measurement probabilities',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Because the quantum simulator randomly chooses which gates to execute.',
            description: 'Gates execute deterministically according to the circuit layout',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Because the Pauli-X gate always randomizes the state into noise.',
            description: 'Pauli-X is a deterministic bit-flip operation',
            isCorrect: false,
          },
          {
            id: 'opt-3',
            label: 'Because measurement always happens before any gates execute on the wire.',
            description: 'Measurement occurs after gate transformations',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'Quantum superposition allows a qubit to exist in a linear combination of |0⟩ and |1⟩. When measured in the computational basis, Born’s rule dictating |amplitude|² determines the probability of each outcome, resulting in intrinsic physical probabilities.',
      },
    },

    // ── STEP 11: Complete ─────────────────────────────────────────
    {
      id: 'step-11-complete',
      stepNumber: 11,
      title: 'Challenge Mastered: Sprint 1 Complete',
      explanation:
        'Outstanding achievement! You conquered the Single-Qubit Challenge by predicting, building, debugging, and proving single-qubit circuits across bit flips, superposition, and quantum phase interference.',
      narrationText:
        'Outstanding achievement! You conquered the Single-Qubit Challenge by predicting, building, debugging, and proving single-qubit circuits across bit flips, superposition, and quantum phase interference.',
      actions: [
        { type: 'clear_highlights' },
        { type: 'focus_visualization', panel: 'results' },
        { type: 'complete_lesson' },
      ],
    },
  ],
};

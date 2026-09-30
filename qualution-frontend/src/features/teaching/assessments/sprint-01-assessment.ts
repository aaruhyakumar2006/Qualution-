import type { LessonScript } from '../types';

export const s1AssessmentScript: LessonScript = {
  id: 's1-assessment',
  title: 'Sprint 1 Assessment: Predict, Build & Explain',
  sprint: 1,
  difficulty: 'Intermediate',
  estimatedMinutes: 12,
  xpReward: 300,
  curriculumModuleId: 'lesson-1-sprint-1-assessment',
  isAssessment: true,
  completionMessage:
    'Sprint 1 Assessment Complete! You demonstrated rigorous single-qubit mastery across basis predictions, Pauli-X bit flips, Hadamard superposition, Pauli-Z relative phase, gate non-commutativity, circuit debugging, and interference loops.',
  conceptTags: [
    'Assessment',
    'Computational Basis',
    'Pauli-X',
    'Hadamard',
    'Pauli-Z',
    'Superposition',
    'Relative Phase',
    'Gate Ordering',
    'Interference',
    'Debugging',
    'Transfer',
  ],
  learningObjectives: [
    'Predict computational-basis measurement outcomes before running single-qubit circuits',
    'Construct quantum circuits matching precise behavioral objectives from scratch',
    'Distinguish quantum states by relative phase when measurement histograms are identical',
    'Reason about quantum gate non-commutativity and chronological application order',
    'Diagnose and correct erroneous circuits using phase and interference principles',
    'Synthesize novel target states using multi-gate combinations (X, H, Z)',
    'Explain the physical mechanism connecting superposition amplitudes, relative phase, and constructive interference',
  ],
  prerequisites: [
    'Initialize & Measure a Qubit',
    'The Pauli-X Gate',
    'Hadamard Gate & Superposition',
    'Z Gate: Understanding Quantum Phase',
    'Gate Ordering & Non-Commutativity',
    'Single-Qubit Challenge: Predict, Build & Prove',
  ],
  summary:
    'Comprehensive end-of-sprint assessment evaluating transfer of single-qubit quantum concepts. Complete 10 rigorous tasks across prediction, construction, phase reasoning, debugging, and interference synthesis.',
  starterCircuit: {
    qubits: 1,
    classical_bits: 1,
    gates: [],
    measure: true,
    shots: 500,
  },
  steps: [
    // ── TASK 1: Predict X ─────────────────────────────────────────
    {
      id: 'task-1-predict-x',
      stepNumber: 1,
      title: 'Task 1: Basis Prediction',
      explanation:
        'Sprint 1 Assessment begins. Wire q[0] starts in ground state |0⟩. Before executing any circuit, predict the computational-basis measurement outcome of applying the Pauli-X gate.',
      narrationText:
        'Welcome to the Sprint 1 Assessment. Task 1: Starting from ground state |0⟩, what measurement result will applying the Pauli-X gate produce in the computational basis?',
      actions: [
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'highlight_qubit', qubitIndex: 0 },
      ],
      checkpoint: {
        id: 'pred-s1-task1-x',
        prompt: 'Task 1: Basis Prediction',
        question:
          'Starting from ground state |0⟩, what measurement outcome will applying the Pauli-X gate produce when measured in the computational basis?',
        options: [
          {
            id: 'opt-0',
            label: 'Approximately 100% 1',
            description: 'Pauli-X flips |0⟩ to |1⟩ deterministically',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Approximately 100% 0',
            description: 'Ground state remains unchanged',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Approximately 50% 0 and 50% 1',
            description: 'Equal superposition across both basis states',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'The Pauli-X gate performs a quantum bit flip: X|0⟩ = |1⟩. Measurement in the computational basis deterministically yields outcome 1 with 100% probability.',
      },
    },

    // ── TASK 2: Build a Target State |1⟩ ──────────────────────────
    {
      id: 'task-2-build-target-1',
      stepNumber: 2,
      title: 'Task 2: Construct Target State |1⟩',
      explanation:
        'Objective: Starting from ground state |0⟩ on wire q[0], construct a circuit that produces outcome 1 with at least 95% probability when measured. Place the gate, run the simulation, and submit your solution.',
      narrationText:
        'Task 2: Build a circuit on wire q[0] that produces state |1⟩ with at least 95% probability. Run the simulation to prove your result.',
      actions: [{ type: 'clear_highlights' }],
      takeover: {
        taskType: 'add_gate',
        prompt: 'Task 2: Construct State |1⟩',
        goalDescription: 'Construct a circuit starting from |0⟩ that produces outcome 1 with at least 95% probability.',
        instructions: [
          'Add a gate to wire q[0] to transform |0⟩ into |1⟩.',
          'Run the simulation to inspect the measurement distribution.',
          'Submit your solution once outcome 1 reaches at least 95%.',
        ],
        hints: [
          'Think about what operation flips the computational basis value.',
          'Which single-qubit gate maps |0⟩ directly to |1⟩?',
        ],
        allowEarlyCompletion: false,
        suggestedActionLabel: 'Submit Task 2',
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

    // ── TASK 3: Predict Superposition ─────────────────────────────
    {
      id: 'task-3-predict-superposition',
      stepNumber: 3,
      title: 'Task 3: Superposition Prediction',
      explanation:
        'Consider wire q[0] initialized in |0⟩ with a Hadamard (H) gate attached. Predict the resulting computational-basis measurement distribution before running the simulator.',
      narrationText:
        'Task 3: Starting from ground state |0⟩, what computational-basis measurement distribution will applying the Hadamard gate produce?',
      actions: [
        { type: 'reset_circuit' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 0,
          gateId: 'task3-h',
        },
      ],
      checkpoint: {
        id: 'pred-s1-task3-superposition',
        prompt: 'Task 3: Superposition Prediction',
        question:
          'Starting from ground state |0⟩, what computational-basis measurement distribution will applying the Hadamard (H) gate produce?',
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
          'Hadamard transforms |0⟩ into state |+⟩ = (|0⟩ + |1⟩)/√2. By the Born rule, P(0) = |1/√2|² = 0.5 and P(1) = |1/√2|² = 0.5.',
      },
    },

    // ── TASK 4: Phase Reasoning Checkpoint ────────────────────────
    {
      id: 'task-4-phase-reasoning',
      stepNumber: 4,
      title: 'Task 4: Phase Reasoning',
      explanation:
        'Consider the sequence |0⟩ → H → Z. What is the quantum state after this circuit, and what measurement behavior should you expect in the computational basis?',
      narrationText:
        'Task 4: What is the quantum state after circuit |0⟩ → H → Z, and what measurement distribution should you expect in the computational basis?',
      actions: [
        { type: 'reset_circuit' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 0,
          gateId: 'task4-h',
        },
        {
          type: 'add_gate',
          gate: 'z',
          targets: [0],
          column: 1,
          gateId: 'task4-z',
        },
      ],
      checkpoint: {
        id: 'pred-s1-task4-phase',
        prompt: 'Task 4: Phase Reasoning',
        question:
          'What is the quantum state after the circuit |0⟩ → H → Z, and what measurement behavior should you expect in the computational basis?',
        options: [
          {
            id: 'opt-0',
            label:
              'State |−⟩ = (|0⟩ - |1⟩)/√2, which still measures approximately 50% 0 and 50% 1 in the computational basis',
            description: 'Z flips relative phase, but squared amplitudes remain 0.5 each',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'State |+⟩, which measures 100% 0 in the computational basis',
            description: 'Incorrect state and deterministic assumption',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'State |1⟩, because Z flips bit 0 to bit 1',
            description: 'Confusing phase-flip Z with bit-flip X',
            isCorrect: false,
          },
          {
            id: 'opt-3',
            label: 'State |0⟩, because Z cancels H',
            description: 'Incorrect algebraic cancellation',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'Z leaves |0⟩ unchanged and applies a phase factor of -1 to |1⟩: Z|+⟩ = |−⟩ = (|0⟩ - |1⟩)/√2. Because computational measurement probabilities depend only on amplitude squared, P(0) = |1/√2|² = 0.5 and P(1) = |-1/√2|² = 0.5.',
      },
    },

    // ── TASK 5: Gate Ordering & State Distinction ─────────────────
    {
      id: 'task-5-gate-ordering',
      stepNumber: 5,
      title: 'Task 5: Gate Ordering & State Distinction',
      explanation:
        'Compare Circuit A (|0⟩ → H → X) and Circuit B (|0⟩ → X → H). Do they produce the same quantum state?',
      narrationText:
        'Task 5: Compare Circuit A (H then X) and Circuit B (X then H). Do they produce the same quantum state?',
      actions: [{ type: 'reset_circuit' }, { type: 'clear_highlights' }],
      checkpoint: {
        id: 'pred-s1-task5-ordering',
        prompt: 'Task 5: Gate Ordering & State Distinction',
        question:
          'Compare Circuit A (|0⟩ → H → X) and Circuit B (|0⟩ → X → H). Do they produce the same quantum state?',
        options: [
          {
            id: 'opt-0',
            label:
              'No: Circuit A produces |+⟩ and Circuit B produces |−⟩. They are physically distinct states (differing by relative phase) despite yielding identical ~50/50 measurement histograms in the computational basis.',
            description: 'Different quantum states along +X and -X on the Bloch sphere',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label:
              'Yes: Because both measure approximately 50% 0 and 50% 1 in the computational basis, they are identical quantum states.',
            description: 'Falsely conflating measurement histogram with full statevector',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label:
              'Yes: Single-qubit quantum gates always commute regardless of chronological execution order.',
            description: 'Quantum operators do not generally commute',
            isCorrect: false,
          },
          {
            id: 'opt-3',
            label: 'No: Circuit A produces 100% 0 and Circuit B produces 100% 1.',
            description: 'Incorrect deterministic prediction',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'H|0⟩ = |+⟩ and X|+⟩ = |+⟩ (Circuit A). In contrast, X|0⟩ = |1⟩ and H|1⟩ = |−⟩ (Circuit B). The states |+⟩ and |−⟩ are distinct orthogonal states pointing in opposite directions (+X vs -X) on the Bloch sphere.',
      },
    },

    // ── TASK 6a: Interference Prediction ──────────────────────────
    {
      id: 'task-6a-interference-predict',
      stepNumber: 6,
      title: 'Task 6: Interference Prediction',
      explanation:
        'Consider the sequence |0⟩ → H → Z → H. If your circuit correctly converts relative phase into constructive interference, what will the final measurement outcome be?',
      narrationText:
        'Task 6: What will the sequence H → Z → H produce when measured in the computational basis?',
      actions: [
        { type: 'reset_circuit' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
      ],
      checkpoint: {
        id: 'pred-s1-task6-interference',
        prompt: 'Task 6: Interference Prediction',
        question:
          'Starting from ground state |0⟩, what computational-basis measurement will the sequence H → Z → H produce?',
        options: [
          {
            id: 'opt-0',
            label: 'Approximately 100% outcome 1',
            description: 'Phase flip leads to constructive interference for |1⟩ and destructive for |0⟩',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Approximately 100% outcome 0',
            description: 'Returns to ground state |0⟩',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Approximately 50% 0 and 50% 1',
            description: 'No interference occurring',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'Tracing the state: |0⟩ → (H) → |+⟩ → (Z) → |−⟩ → (H) → |1⟩. The second Hadamard converts the negative relative phase into constructive interference for basis state |1⟩.',
      },
    },

    // ── TASK 6b: Interference Build & Run ─────────────────────────
    {
      id: 'task-6b-interference-build',
      stepNumber: 7,
      title: 'Task 6: Construct Phase Interference',
      explanation:
        'Objective: Build the sequence H → Z → H on wire q[0] and simulate it to confirm outcome 1 with at least 95% probability.',
      narrationText:
        'Now construct the circuit H → Z → H on wire q[0], simulate it, and verify that outcome 1 reaches at least 95%.',
      actions: [{ type: 'clear_highlights' }],
      takeover: {
        taskType: 'observe_interference',
        prompt: 'Task 6: Construct Phase Interference',
        goalDescription: 'Build the circuit H → Z → H on wire q[0] and simulate it to confirm outcome 1 with >= 95% probability.',
        instructions: [
          'Place H, Z, and H on wire q[0] in order.',
          'Run the simulation to observe phase interference.',
          'Submit your solution once outcome 1 reaches at least 95%.',
        ],
        hints: [
          'Start with H to create an equal superposition.',
          'Add Z in column 1 to flip the relative phase.',
          'Add a second H in column 2 to transform the phase difference into computational interference.',
        ],
        allowEarlyCompletion: false,
        suggestedActionLabel: 'Submit Task 6',
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

    // ── TASK 7a: Debugging Diagnosis Checkpoint ───────────────────
    {
      id: 'task-7a-debug-diagnose',
      stepNumber: 8,
      title: 'Task 7: Circuit Diagnosis',
      explanation:
        'A student built H → X → H intending to produce outcome 1 with 100% certainty. However, running this circuit yields outcome 0 with 100% certainty. Inspect the circuit and diagnose the error.',
      narrationText:
        'Task 7: A student built H → X → H intending to produce outcome 1, but running it yields outcome 0! Why does this circuit fail?',
      actions: [
        { type: 'reset_circuit' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 0,
          gateId: 'err-h1',
        },
        {
          type: 'add_gate',
          gate: 'x',
          targets: [0],
          column: 1,
          gateId: 'err-x',
        },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 2,
          gateId: 'err-h2',
        },
        { type: 'highlight_gate', gateId: 'err-x', targetQubit: 0, column: 1 },
      ],
      checkpoint: {
        id: 'pred-s1-task7-debug',
        prompt: 'Task 7: Circuit Diagnosis',
        question:
          'A student built H → X → H intending to produce outcome 1, but running it yields outcome 0 with 100% certainty. Why does this circuit fail?',
        options: [
          {
            id: 'opt-0',
            label:
              'Because applying X to |+⟩ leaves the state as |+⟩, and the second H then rotates |+⟩ back to |0⟩ instead of |1⟩.',
            description: 'X|+⟩ = |+⟩, and H|+⟩ = |0⟩',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Because the X gate cancels out all other gates on the wire.',
            description: 'Incorrect gate interaction model',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Because a Hadamard gate cannot be placed more than once on the same qubit.',
            description: 'Gates can be applied repeatedly',
            isCorrect: false,
          },
          {
            id: 'opt-3',
            label: 'Because quantum measurement only works if a Z gate is present.',
            description: 'Measurement occurs in computational basis by default',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'Since |+⟩ = (|0⟩+|1⟩)/√2, applying X swaps |0⟩ and |1⟩, keeping the state as |+⟩. The second Hadamard then computes H|+⟩ = |0⟩, yielding 100% outcome 0.',
      },
    },

    // ── TASK 7b: Debugging Fix & Prove ────────────────────────────
    {
      id: 'task-7b-debug-fix',
      stepNumber: 9,
      title: 'Task 7: Repair the Circuit',
      explanation:
        'Objective: Modify wire q[0] so that the circuit achieves the intended target: outcome 1 with at least 95% probability. You may replace gates or reconfigure the circuit.',
      narrationText:
        'Now repair the circuit on wire q[0] so that outcome 1 reaches at least 95%, run the simulation, and submit your solution.',
      actions: [{ type: 'clear_highlights' }],
      takeover: {
        taskType: 'modify_circuit',
        prompt: 'Task 7: Repair Circuit',
        goalDescription: 'Modify wire q[0] so outcome 1 reaches at least 95% probability.',
        instructions: [
          'Inspect the gates on wire q[0].',
          'Repair the circuit (e.g. replace X with Z to create H-Z-H, or simplify).',
          'Run the simulation to confirm outcome 1 reaches >= 95%.',
          'Submit your repaired circuit.',
        ],
        hints: [
          'Remember that X leaves |+⟩ unchanged, rotating back to |0⟩ under the second H.',
          'Replacing X with Z applies a relative phase flip, so the second H rotates to |1⟩.',
        ],
        allowEarlyCompletion: false,
        suggestedActionLabel: 'Submit Task 7',
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

    // ── TASK 8: Synthesize State |−⟩ ──────────────────────────────
    {
      id: 'task-8-transfer-challenge',
      stepNumber: 10,
      title: 'Task 8: Synthesize State |−⟩',
      explanation:
        'Objective: Starting from ground state |0⟩, construct a circuit that creates state |−⟩ = (|0⟩ - |1⟩)/√2 using X and H gates, producing approximately 50% 0 and 50% 1 with negative relative phase.',
      narrationText:
        'Task 8: Construct a circuit using X and H that creates state |−⟩ from |0⟩, producing an equal 50/50 measurement distribution.',
      actions: [
        { type: 'reset_circuit' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
      ],
      takeover: {
        taskType: 'modify_circuit',
        prompt: 'Task 8: Synthesize State |−⟩',
        goalDescription: 'Create state |−⟩ using X and H gates starting from |0⟩, verifying a 50/50 distribution.',
        instructions: [
          'Place X and H in the correct chronological order on wire q[0].',
          'Run the simulation to inspect the 50/50 measurement distribution.',
          'Submit when outcome 0 and outcome 1 both fall between 40% and 60%.',
        ],
        hints: [
          'First flip |0⟩ to |1⟩.',
          'Then apply H to transform |1⟩ into |−⟩ = (|0⟩ - |1⟩)/√2.',
        ],
        allowEarlyCompletion: false,
        suggestedActionLabel: 'Submit Task 8',
        completionCriteria: {
          type: 'all_of',
          criteria: [
            {
              type: 'circuit_has_gates',
              minGates: 2,
              requiredGates: ['x', 'h'],
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

    // ── TASK 9: Conceptual Explanation Checkpoint ─────────────────
    {
      id: 'task-9-conceptual-explanation',
      stepNumber: 11,
      title: 'Task 9: Conceptual Mastery',
      explanation:
        'Why can two quantum circuits produce identical measurement histograms in the computational basis but represent fundamentally different quantum states?',
      narrationText:
        'Task 9: Why can two circuits produce identical measurement histograms in the computational basis but represent fundamentally different quantum states?',
      actions: [],
      checkpoint: {
        id: 'pred-s1-task9-explanation',
        prompt: 'Task 9: Conceptual Mastery',
        question:
          'Why can two quantum circuits produce identical measurement histograms in the computational basis but represent fundamentally different quantum states?',
        options: [
          {
            id: 'opt-0',
            label:
              'Because computational-basis measurement samples only amplitude squared (|c|²), discarding the relative phase angle θ that distinguishes orthogonal or rotated quantum states until interference is applied.',
            description: 'Measurement projects onto Z basis, discarding relative phase information',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label:
              'Because simulators randomly discard quantum information whenever more than one gate is executed.',
            description: 'Quantum simulation is mathematically deterministic for statevectors',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label:
              'Because single-qubit gates only affect the global phase, which has no physical meaning.',
            description: 'Gates like Z alter physical relative phase',
            isCorrect: false,
          },
          {
            id: 'opt-3',
            label: 'Because measurement occurs before the gates are applied to the qubit.',
            description: 'Measurement is applied after circuit transformations',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'A single-qubit quantum state vector |ψ⟩ = α|0⟩ + β|1⟩ contains complex probability amplitudes. Standard computational-basis measurement samples only |α|² and |β|², completely discarding the relative phase angle θ between α and β until an interference gate maps phase differences back into measurable amplitude differences.',
      },
    },

    // ── TASK 10a: Final Mastery Prediction ────────────────────────
    {
      id: 'task-10a-mastery-predict',
      stepNumber: 12,
      title: 'Task 10: Final Mastery Prediction',
      explanation:
        'Trace the complete 4-gate sequence starting from |0⟩: X → H → Z → H. What will be the final computational-basis measurement outcome?',
      narrationText:
        'Task 10: Trace the four-gate sequence starting from |0⟩: X then H then Z then H. What will be the final computational-basis measurement?',
      actions: [
        { type: 'reset_circuit' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
      ],
      checkpoint: {
        id: 'pred-s1-task10-mastery',
        prompt: 'Task 10: Final Mastery Prediction',
        question:
          'Trace the 4-gate sequence starting from |0⟩: X → H → Z → H. What will be the final computational-basis measurement?',
        options: [
          {
            id: 'opt-0',
            label: 'Approximately 100% outcome 0',
            description:
              '|0⟩ →(X) |1⟩ →(H) |−⟩ →(Z) |+⟩ →(H) |0⟩ via reversed phase interference',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Approximately 100% outcome 1',
            description: 'Destructive interference for 0',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Approximately 50% 0 and 50% 1',
            description: 'Superposition without complete interference',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'Step-by-step state evolution: |0⟩ → (X) → |1⟩ → (H) → |−⟩ = (|0⟩-|1⟩)/√2 → (Z) → |+⟩ = (|0⟩+|1⟩)/√2 → (H) → |0⟩. The relative phase flip converts constructive interference into state |0⟩ with 100% deterministic probability.',
      },
    },

    // ── TASK 10b: Final Mastery Build & Prove ─────────────────────
    {
      id: 'task-10b-mastery-build',
      stepNumber: 13,
      title: 'Task 10: Build the Full Interference Loop',
      explanation:
        'Objective: Construct the circuit X → H → Z → H on wire q[0] and simulate it to prove deterministic return to |0⟩ with at least 95% probability.',
      narrationText:
        'Now construct the circuit X → H → Z → H on wire q[0], run the simulation, and verify that outcome 0 reaches at least 95%.',
      actions: [{ type: 'clear_highlights' }],
      takeover: {
        taskType: 'modify_circuit',
        prompt: 'Task 10: Complete Interference Loop',
        goalDescription: 'Construct X → H → Z → H on wire q[0] and prove deterministic measurement of |0⟩ (>= 95%).',
        instructions: [
          'Add X, H, Z, and H to wire q[0] in order.',
          'Run the simulation to observe deterministic return to |0⟩.',
          'Submit once outcome 0 reaches at least 95%.',
        ],
        hints: [
          'Apply X first to flip ground state |0⟩ to |1⟩.',
          'Apply H to produce state |−⟩, then Z to flip the phase back to |+⟩.',
          'Apply the final H to interfere constructively into basis state |0⟩.',
        ],
        allowEarlyCompletion: false,
        suggestedActionLabel: 'Submit Task 10',
        completionCriteria: {
          type: 'all_of',
          criteria: [
            {
              type: 'circuit_has_gates',
              minGates: 4,
              requiredGates: ['x', 'h', 'z', 'h'],
              targetQubits: [0],
            },
            {
              type: 'simulation_probability',
              state: '0',
              minProbability: 0.95,
            },
          ],
        },
      },
    },

    // ── RESULTS & MASTERY ─────────────────────────────────────────
    {
      id: 'task-14-results',
      stepNumber: 14,
      title: 'Sprint 1 Assessment Complete',
      explanation:
        'Sprint 1 Assessment Complete! You demonstrated rigorous single-qubit mastery across basis predictions, Pauli-X bit flips, Hadamard superposition, Pauli-Z relative phase, gate non-commutativity, circuit debugging, and interference loops.',
      narrationText:
        'Sprint 1 Assessment Complete! Outstanding performance across all single-qubit tasks. You demonstrated proven mastery in quantum prediction, construction, debugging, and interference.',
      actions: [
        { type: 'clear_highlights' },
        { type: 'focus_visualization', panel: 'results' },
        { type: 'complete_lesson' },
      ],
    },
  ],
};

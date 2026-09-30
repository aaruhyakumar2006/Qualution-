import type { LessonScript } from '../../types';

export const s2BellStateEntanglementLesson: LessonScript = {
  id: 's2-bell-state-entanglement',
  title: 'Bell State & Quantum Entanglement',
  sprint: 2,
  difficulty: 'Intermediate',
  estimatedMinutes: 8,
  xpReward: 250,
  curriculumModuleId: 'lesson-8-bell-state',
  completionMessage:
    'Fantastic! You created maximally entangled qubits |Φ+⟩ = (|00⟩ + |11⟩)/√2 and verified non-local quantum correlations.',
  conceptTags: ['Entanglement', 'Bell State', 'CNOT Gate', 'Hadamard', 'Non-locality'],
  learningObjectives: [
    'Understand how Hadamard followed by CNOT creates a maximally entangled Bell state',
    'Observe how measuring qubit 0 instantaneously determines qubit 1 outcome',
    'Predict 2-qubit measurement outcomes for entangled basis states (|00⟩ and |11⟩)',
    'Verify that separable product states do not produce non-local correlations',
  ],
  prerequisites: ['Single-qubit superposition', 'Pauli gates'],
  summary:
    'Construct the canonical Bell state |Φ+⟩ using Hadamard and CNOT gates, and observe how measurement outcomes become perfectly correlated across qubits.',
  starterCircuit: {
    qubits: 2,
    classical_bits: 2,
    gates: [],
    measure: true,
    shots: 1000,
  },
  steps: [
    {
      id: 'step-1-init-2q',
      stepNumber: 1,
      title: 'Initialize 2-Qubit System',
      explanation:
        'We begin with two qubits initialized to state |00⟩. To create entanglement, we will first put qubit 0 into superposition.',
      narrationText:
        'Welcome to Sprint 2! In this lesson we explore Quantum Entanglement. We begin with a two-qubit system initialized in state |00⟩.',
      actions: [
        { type: 'initialize_qubits', qubits: 2, classicalBits: 2 },
        { type: 'reset_circuit' },
        { type: 'highlight_qubit', qubitIndex: 0 },
        {
          type: 'explain',
          title: '2-Qubit Initial State |00⟩',
          message: 'Both qubit 0 and qubit 1 start in the ground state |0⟩.',
        },
      ],
    },
    {
      id: 'step-2-hadamard-q0',
      stepNumber: 2,
      title: 'Superposition on Control Qubit (H on q0)',
      explanation:
        'Applying H to qubit 0 produces state (|0⟩ + |1⟩) ⊗ |0⟩ = (|00⟩ + |10⟩) / √2.',
      narrationText:
        'First, we place a Hadamard gate on qubit 0. This creates an equal superposition on qubit 0 while qubit 1 remains in state |0⟩.',
      actions: [
        { type: 'add_gate', gate: 'h', targets: [0], column: 0, gateId: 'h-q0-bell' },
        { type: 'highlight_gate', gateId: 'h-q0-bell' },
        {
          type: 'explain',
          title: 'Superposition Created',
          message: 'State is now (|00⟩ + |10⟩) / √2. The qubits are still separable.',
        },
      ],
    },
    {
      id: 'step-3-cnot-q0-q1',
      stepNumber: 3,
      title: 'Apply CNOT (Control q0, Target q1)',
      explanation:
        'Applying CNOT conditionally flips qubit 1 whenever qubit 0 is |1⟩. This converts (|00⟩ + |10⟩)/√2 into (|00⟩ + |11⟩)/√2, creating maximal entanglement!',
      narrationText:
        'Now we apply a CNOT gate with control on qubit 0 and target on qubit 1. This entangles the two qubits.',
      actions: [
        { type: 'add_gate', gate: 'cx', targets: [0, 1], column: 1, gateId: 'cx-bell' },
        { type: 'highlight_gate', gateId: 'cx-bell' },
        {
          type: 'explain',
          title: 'Bell State |Φ+⟩ Created',
          message: 'The system is now in state (|00⟩ + |11⟩)/√2. Measuring one qubit immediately determines the other!',
        },
      ],
    },
    {
      id: 'step-4-prediction-bell-theory',
      stepNumber: 4,
      title: 'Entanglement Correlation Theory',
      explanation:
        'The Bell state is in an entangled superposition (|00⟩ + |11⟩)/√2. Because the qubits are entangled, measuring one qubit immediately determines the other.',
      narrationText:
        'When measuring this entangled Bell state, observe the perfect quantum correlation: only |00⟩ and |11⟩ will ever appear, each with 50% probability, with 0% chance of observing |01⟩ or |10⟩!',
      actions: [
        {
          type: 'explain',
          title: 'Perfect Correlation',
          message: 'Because the statevector is (|00⟩ + |11⟩)/√2, amplitudes for |01⟩ and |10⟩ are zero. Thus you will only observe correlated states |00⟩ and |11⟩.',
        }
      ],
    },
    {
      id: 'step-5-learner-takeover',
      stepNumber: 5,
      title: 'Lab Challenge: Create Bell State |Ψ+⟩',
      explanation:
        'Now modify the circuit to create the Bell state |Ψ+⟩ = (|01⟩ + |10⟩)/√2 by adding an X gate before measurement.',
      narrationText:
        'Now it is your turn! Modify the circuit to produce the Bell state |Ψ+⟩ = (|01⟩ + |10⟩)/√2.',
      actions: [],
      takeover: {
        taskType: 'modify_circuit',
        prompt: 'Lab Challenge: Create Bell State |Ψ+⟩',
        goalDescription: 'Add an X gate on qubit 1 to convert (|00⟩ + |11⟩)/√2 into (|01⟩ + |10⟩)/√2.',
        instructions: [
          'Add an X gate on wire q[1] after the CNOT gate.',
          'Run the simulation to inspect the updated measurement distribution.',
          'Verify that outcomes |01⟩ and |10⟩ appear with equal 50% probability.',
        ],
        hints: [
          'Add an X gate on wire q[1] after the CNOT gate.',
          'Notice how X flips state |00⟩ -> |01⟩ and |11⟩ -> |10⟩.',
        ],
        suggestedActionLabel: 'Verify Bell State |Ψ+⟩',
        solutionActions: [
          { type: 'initialize_qubits', qubits: 2 },
          { type: 'add_gate', gate: 'h', targets: [0] },
          { type: 'add_gate', gate: 'cx', targets: [0, 1] },
          { type: 'add_gate', gate: 'x', targets: [1] }
        ],
      },
    },
    {
      id: 'step-5-1-annotation-demo',
      stepNumber: 5.1,
      title: 'Annotation Demonstration',
      explanation:
        'Notice how the X gate successfully flipped the probabilities.',
      narrationText:
        'Excellent job! Look closely at the new probability distribution on the left. Notice how the X gate completely flipped the states.',
      actions: [
        { type: 'ANNOTATE', shape: 'arrow', target: 'probability-panel', durationMs: 2500 },
        { type: 'ANNOTATE', shape: 'underline', target: 'qsphere-panel', durationMs: 2500 }
      ],
    },
    {
      id: 'step-6-assessment-1',
      stepNumber: 6,
      title: 'Assessment 1: Entanglement Correlation',
      explanation:
        'Let us review what we learned about the Bell state.',
      narrationText:
        'Let us review what we learned. When measuring the Bell state (|00⟩ + |11⟩)/√2, what measurement outcomes will you observe?',
      actions: [],
      checkpoint: {
        id: 'pred-bell-state',
        prompt: 'Module Assessment 1',
        question:
          'When measuring the Bell state (|00⟩ + |11⟩)/√2, what measurement outcomes will you observe?',
        options: [
          {
            id: 'opt-0',
            label: '25% |00⟩, 25% |01⟩, 25% |10⟩, 25% |11⟩',
            description: 'All 4 outcomes appear with equal probability',
            isCorrect: false,
          },
          {
            id: 'opt-1',
            label: '50% |00⟩ and 50% |11⟩ (0% |01⟩ and 0% |10⟩)',
            description: 'Perfect 100% correlation between qubit 0 and qubit 1',
            isCorrect: true,
          },
          {
            id: 'opt-2',
            label: '100% |00⟩',
            description: 'Circuit returns exclusively ground state',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 1,
        explanation:
          'Because the statevector is (|00⟩ + |11⟩)/√2, amplitudes for |01⟩ and |10⟩ are zero. Thus you will only observe correlated states |00⟩ and |11⟩ with ~50% probability each.',
      },
    },
    {
      id: 'step-7-complete',
      stepNumber: 7,
      title: 'Lesson Completed: Entanglement Mastered',
      explanation:
        'Fantastic! You created maximally entangled qubits |Φ+⟩ = (|00⟩ + |11⟩)/√2 and verified non-local quantum correlations.',
      narrationText:
        'Fantastic! You created maximally entangled qubits |Φ+⟩ = (|00⟩ + |11⟩)/√2 and verified non-local quantum correlations.',
      actions: [
        { type: 'complete_lesson' },
      ],
    },
  ],
};

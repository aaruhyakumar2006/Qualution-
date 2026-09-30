import type { TheoryConcept } from '../types';

export const superpositionConcept: TheoryConcept = {
  id: 'c-superposition',
  slug: 'quantum-superposition',
  title: 'Quantum Superposition',
  shortDescription: 'Discover how a qubit can exist in a combination of multiple states simultaneously, and how we create it using the Hadamard gate.',
  difficulty: 'Beginner',
  prerequisites: [
    { conceptId: 'c-qubit', relationship: 'prerequisite' }
  ],
  relatedConcepts: [
    { conceptId: 'c-measurement', relationship: 'next' },
    { conceptId: 'c-entanglement', relationship: 'related' }
  ],
  learningObjectives: [
    { type: 'KNOW', description: 'Recognize the Hadamard (H) gate as the primary operation to create superposition.' },
    { type: 'UNDERSTAND', description: 'Understand the mathematical relationship between probability amplitudes and measurement outcomes.' },
    { type: 'DO', description: 'Place a Hadamard gate on a qubit and simulate the resulting probabilities.' },
    { type: 'EXPLAIN', description: 'Explain the difference between a classical random state and a quantum superposition.' }
  ],
  sections: [
    {
      id: 'sec-sup-intuition',
      type: 'intuition',
      title: 'Intuition: The Spinning Coin',
      content: 'If classical bits are like a coin lying flat on a table (either Heads or Tails), **superposition** is like the coin spinning in the air. While it spins, its state is undefined as a single value—it is a combination of both. When you stop it (measure it), it collapses into exactly one state. A quantum computer performs calculations on these spinning coins, exploring many possibilities at once.'
    },
    {
      id: 'sec-sup-math',
      type: 'math',
      title: 'The Mathematics of Superposition',
      content: 'A qubit in superposition is described by a state vector $|\\psi\\rangle$ that is a linear combination of the computational basis states $|0\\rangle$ and $|1\\rangle$. The values $\\alpha$ and $\\beta$ are complex numbers known as **probability amplitudes**. The probability of measuring $|0\\rangle$ is $|\\alpha|^2$, and the probability of measuring $|1\\rangle$ is $|\\beta|^2$. Since the qubit must be found in *some* state when measured, the probabilities must sum to 1.',
      mathContext: {
        formulas: [
          '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle',
          '|\\alpha|^2 + |\\beta|^2 = 1'
        ],
        variables: {
          '\\alpha': 'Amplitude for state |0⟩',
          '\\beta': 'Amplitude for state |1⟩'
        }
      }
    },
    {
      id: 'sec-sup-circuit',
      type: 'circuit',
      title: 'The Hadamard Gate',
      content: 'To put a qubit into an equal superposition (where it has a 50/50 chance of being measured as 0 or 1), we apply the **Hadamard (H) gate**. Applying an H gate to a qubit initially in $|0\\rangle$ transforms it into the $|+\\rangle$ state.',
      mathContext: {
        formulas: [
          'H|0\\rangle = \\frac{1}{\\sqrt{2}}|0\\rangle + \\frac{1}{\\sqrt{2}}|1\\rangle = |+\\rangle'
        ],
        variables: {}
      },
      circuitId: 's1-hadamard-superposition'
    },
    {
      id: 'sec-sup-experiment',
      type: 'experiment',
      title: 'Interactive Experiment',
      content: 'Run the circuit to observe the probabilities. You will see that the simulator returns roughly a 50% distribution for both $|0\\rangle$ and $|1\\rangle$.',
      experimentDef: {
        expectedMeasurements: { '0': 0.5, '1': 0.5 },
        allowLearnerModification: true
      }
    }
  ],
  misconceptions: [
    {
      wrongBelief: 'A qubit in superposition is just randomly switching between 0 and 1 very quickly.',
      correction: 'A qubit in superposition is in a definite, well-defined mathematical state that is a combination of 0 and 1. It is not "random" until the moment of measurement.'
    }
  ],
  practice: [
    {
      type: 'predict-state',
      question: 'If you apply a Hadamard gate to a qubit in state |0⟩, what is the probability of measuring |1⟩?',
      options: [
        '0%',
        '50%',
        '100%',
        'It depends on the observer'
      ],
      correctAnswer: 1, // 50%
      hints: [
        'Look at the normalization equation.',
        'The amplitude for |1⟩ is 1/sqrt(2). What is its square?'
      ]
    }
  ],
  masteryCriteria: {
    requiredPracticeScore: 1,
    requiredExperiments: 1
  }
};

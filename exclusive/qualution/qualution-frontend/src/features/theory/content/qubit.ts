import type { TheoryConcept } from '../types';

export const qubitConcept: TheoryConcept = {
  id: 'c-qubit',
  slug: 'what-is-a-qubit',
  title: 'The Quantum Bit (Qubits)',
  shortDescription: 'Understand the fundamental unit of quantum information and how it differs from a classical bit.',
  difficulty: 'Beginner',
  prerequisites: [],
  relatedConcepts: [
    { conceptId: 'c-superposition', relationship: 'next' },
    { conceptId: 'c-measurement', relationship: 'next' }
  ],
  learningObjectives: [
    { type: 'KNOW', description: 'Define what a qubit is in relation to a classical bit.' },
    { type: 'UNDERSTAND', description: 'Understand that a qubit exists in a continuous vector space.' },
    { type: 'EXPLAIN', description: 'Explain why qubits can hold more complex information than binary bits.' }
  ],
  sections: [
    {
      id: 'sec-q-question',
      type: 'intuition',
      title: 'The Question',
      content: 'If classical computers are built out of bits (0s and 1s), what are quantum computers built out of, and why does it matter?'
    },
    {
      id: 'sec-q-intuition',
      type: 'intuition',
      title: 'Intuition',
      content: 'Imagine a coin. When a classical coin lands on the table, it is firmly either Heads (1) or Tails (0). But while the coin is spinning in the air, what state is it in? It is a blur of both. A **qubit** (quantum bit) is the quantum equivalent of this spinning coin. Until we force it to stop and measure it, it exists in a complex, continuous state between 0 and 1.'
    },
    {
      id: 'sec-q-math',
      type: 'math',
      title: 'Formal Mathematics',
      content: 'Mathematically, we represent the state of a qubit using a vector called a **state vector**, denoted by the Greek letter psi $|\\psi\\rangle$. Unlike a classical bit $b \\in \\{0, 1\\}$, a qubit is a linear combination of two basis states $|0\\rangle$ and $|1\\rangle$.',
      mathContext: {
        formulas: [
          '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle'
        ],
        variables: {
          '\\alpha': 'Probability amplitude of measuring 0',
          '\\beta': 'Probability amplitude of measuring 1'
        }
      }
    },
    {
      id: 'sec-q-circuit',
      type: 'circuit',
      title: 'Circuit Connection',
      content: 'In our Quantum Composer, each horizontal line represents one qubit evolving over time. By default, all qubits start perfectly still in the ground state $|0\\rangle$. Click **Show Me** to let the AI Tutor point out the qubits in your workspace.',
      circuitId: 's1-initialize-measure'
    }
  ],
  misconceptions: [
    {
      wrongBelief: 'A qubit literally stores two classical bits simultaneously.',
      correction: 'A qubit does not store two classical bits. It stores two continuous complex probability amplitudes, which collapse into a single classical bit upon measurement.'
    }
  ],
  practice: [
    {
      type: 'multiple-choice',
      question: 'Which of the following best describes a qubit before it is measured?',
      options: [
        'It is exactly 0 and 1 at the same time.',
        'It rapidly flips back and forth between 0 and 1.',
        'It is in a continuous mathematical vector space defined by amplitudes.',
        'It is unknown to us, but internally it is definitely either 0 or 1.'
      ],
      correctAnswer: 2,
      hints: [
        'Think about the spinning coin analogy.',
        'Is the state purely unknown, or is it physically continuous?'
      ]
    }
  ],
  masteryCriteria: {
    requiredPracticeScore: 1,
    requiredExperiments: 0
  }
};

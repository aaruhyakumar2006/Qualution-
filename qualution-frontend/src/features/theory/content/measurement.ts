import type { TheoryConcept } from '../types';

export const measurementConcept: TheoryConcept = {
  id: 'c-measurement',
  slug: 'quantum-measurement',
  title: 'Measurement & Probability',
  shortDescription: 'Understand how extracting information from a quantum system forces it to collapse into a single classical state.',
  difficulty: 'Beginner',
  prerequisites: [
    { conceptId: 'c-qubit', relationship: 'prerequisite' },
    { conceptId: 'c-superposition', relationship: 'prerequisite' }
  ],
  relatedConcepts: [
    { conceptId: 'c-entanglement', relationship: 'next' }
  ],
  learningObjectives: [
    { type: 'KNOW', description: 'Define quantum measurement and wave function collapse.' },
    { type: 'UNDERSTAND', description: 'Understand why measurement is irreversible.' },
    { type: 'DO', description: 'Add measurement operations to a circuit and run multiple shots.' },
    { type: 'EXPLAIN', description: 'Explain why we need multiple "shots" (runs) to understand a probabilistic quantum state.' }
  ],
  sections: [
    {
      id: 'sec-meas-intuition',
      type: 'intuition',
      title: 'Intuition: Stopping the Coin',
      content: 'If a qubit in superposition is like a spinning coin, **measurement** is the act of slamming your hand down on the table to stop it. The coin is forced to pick a side: Heads or Tails. In quantum mechanics, observing a system forces its complex, continuous state to collapse into a single, discrete classical reality.'
    },
    {
      id: 'sec-meas-math',
      type: 'math',
      title: 'The Mathematics of Collapse',
      content: 'When we measure a qubit in the state $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$, two things happen:\n1. We get outcome `0` with probability $p(0) = |\\alpha|^2$, or outcome `1` with probability $p(1) = |\\beta|^2$.\n2. The state vector is destroyed and replaced by the classical outcome we observed (either $|0\\rangle$ or $|1\\rangle$). This is called **wave function collapse**.',
      mathContext: {
        formulas: [
          'p(0) = |\\alpha|^2',
          'p(1) = |\\beta|^2'
        ],
        variables: {
          'p(0)': 'Probability of measuring classical 0',
          'p(1)': 'Probability of measuring classical 1'
        }
      }
    },
    {
      id: 'sec-meas-circuit',
      type: 'circuit',
      title: 'Measurement in Circuits',
      content: 'In our Quantum Composer, the Measurement operation (represented by a meter icon) takes a quantum state from a horizontal wire and extracts a classical bit, sending it to the classical register line (the double-line at the bottom).',
      circuitId: 's1-initialize-measure'
    },
    {
      id: 'sec-meas-experiment',
      type: 'experiment',
      title: 'Why We Need Multiple Shots',
      content: 'Because quantum outcomes are probabilistic, running an experiment exactly once only gives you a single classical bit (0 or 1). To discover the hidden amplitudes $\\alpha$ and $\\beta$, we must run the exact same circuit hundreds of times. These repeated runs are called **shots**.',
      experimentDef: {
        expectedMeasurements: { '0': 0.5, '1': 0.5 },
        allowLearnerModification: true
      }
    }
  ],
  misconceptions: [
    {
      wrongBelief: 'Measurement simply reveals a value that the qubit had secretly chosen all along.',
      correction: 'Measurement physically alters the system. The qubit did not "secretly" have a value of 0 or 1 before measurement; the value did not exist in a classical sense until the measurement forced it to collapse.'
    }
  ],
  practice: [
    {
      type: 'multiple-choice',
      question: 'If you prepare a qubit in the state |+⟩ and measure it 1000 times, what will you most likely observe?',
      options: [
        '1000 results of |+⟩',
        'Roughly 500 results of 0 and 500 results of 1',
        'Exactly 500 results of 0 and exactly 500 results of 1',
        '1000 results of either 0 or 1, depending on the first shot'
      ],
      correctAnswer: 1, // Roughly 500/500
      hints: [
        'Remember that quantum measurement is probabilistic.',
        'Does flipping a real coin 1000 times guarantee exactly 500 heads?'
      ]
    }
  ],
  masteryCriteria: {
    requiredPracticeScore: 1,
    requiredExperiments: 1
  }
};

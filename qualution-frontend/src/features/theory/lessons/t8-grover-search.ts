/**
 * t8-grover-search.ts
 *
 * BoardLessonScript for Grover's Search Algorithm (Module 8 Theory Lesson).
 * Registered in boardLessonRegistry and integrated beside Module 8 in curriculum.
 */

import type { BoardLessonScript } from '../boardTypes';

export const t8GroverSearch: BoardLessonScript = {
  id: 't8-grover-search',
  title: "Grover's Search Algorithm: Amplitude Amplification",
  topic: 'Quantum Algorithms',
  difficulty: 'Intermediate',
  estimatedMinutes: 5,
  learningObjectives: [
    'Understand the classical unsorted search bottleneck (O(N) queries)',
    'Explain how equal superposition prepares balanced probability amplitudes across 4 states',
    'Describe how the Oracle marks the target state with a phase inversion (+1/2 to -1/2)',
    'Understand geometric inversion about the mean amplitude (the Grover diffuser)',
    'Calculate why 2-qubit Grover search achieves 100% certainty in exactly 1 iteration',
    'Recognize overshoot dynamics and transition to the practical Workbench lab',
  ],
  transitionToLessonId: 'lesson-8-grovers-search',
  transitionLabel: "Grover's Search Practical Lab",
  steps: [
    {
      id: 't8-s01-classical-boxes',
      title: 'The Four Boxes (Classical Search)',
      narration:
        'Imagine four closed boxes, labeled 00, 01, 10, and 11. One box holds a hidden prize. A classical search algorithm has no choice but to inspect them one by one, requiring order N checks in the worst case.',
      actions: [
        { type: 'MOVE_CURSOR', x: 100, y: 80 },
        {
          type: 'WRITE_TEXT',
          text: "GROVER'S SEARCH ALGORITHM",
          x: 80,
          y: 70,
          fontSize: 36,
          color: '#00f2ff',
          fontWeight: 'bold',
          duration: 900,
        },
        {
          type: 'DRAW_LINE',
          x1: 80,
          y1: 115,
          x2: 600,
          y2: 115,
          color: '#00f2ff',
          duration: 500,
        },
        {
          type: 'WRITE_TEXT',
          text: 'Unsorted Database (N = 4 items):',
          x: 80,
          y: 145,
          fontSize: 22,
          color: '#94a3b8',
          duration: 600,
        },
        {
          type: 'WRITE_MATH',
          latex: 'N = 4 \\implies \\text{Classical Worst Case: } 4 \\text{ checks } (\\mathcal{O}(N))',
          x: 80,
          y: 190,
          scale: 1.1,
          color: '#f8fafc',
          duration: 600,
        },
      ],
    },
    {
      id: 't8-s02-superposition',
      title: 'Equal Superposition & Amplitudes',
      narration:
        'A quantum computer initializes two qubits into equal superposition using Hadamard gates. Each of the four computational states receives an identical amplitude of positive one-half, giving a 25% measurement probability.',
      actions: [
        {
          type: 'WRITE_MATH',
          latex: '|s\\rangle = H^{\\otimes 2}|00\\rangle = \\frac{1}{2}|00\\rangle + \\frac{1}{2}|01\\rangle + \\frac{1}{2}|10\\rangle + \\frac{1}{2}|11\\rangle',
          x: 80,
          y: 270,
          scale: 1.15,
          color: '#38bdf8',
          duration: 800,
        },
        {
          type: 'WRITE_MATH',
          latex: 'P(x) = |\\alpha_x|^2 = \\left(\\frac{1}{2}\\right)^2 = \\frac{1}{4} = 25\\%',
          x: 80,
          y: 340,
          scale: 1.1,
          color: '#34d399',
          duration: 600,
        },
      ],
    },
    {
      id: 't8-s03-oracle',
      title: 'The Oracle (Phase Inversion)',
      narration:
        'The Oracle marks target state |11⟩ by flipping its phase from positive one-half to negative one-half. Crucially, measurement probabilities remain 25% because negative one-half squared is still one-fourth.',
      actions: [
        {
          type: 'WRITE_MATH',
          latex: 'O_{11}|s\\rangle = \\frac{1}{2}|00\\rangle + \\frac{1}{2}|01\\rangle + \\frac{1}{2}|10\\rangle - \\frac{1}{2}|11\\rangle',
          x: 80,
          y: 420,
          scale: 1.15,
          color: '#f59e0b',
          duration: 800,
        },
      ],
    },
    {
      id: 't8-s04-diffusion',
      title: 'The Mirror (Diffusion About the Mean)',
      narration:
        'The Grover diffuser calculates the average amplitude (mean mu = +1/4) and reflects every state across it. The unmarked states drop to 0, while target state |11⟩ rises to positive 1.0, achieving 100% deterministic certainty in one single iteration.',
      actions: [
        {
          type: 'WRITE_MATH',
          latex: '\\mu = +\\frac{1}{4}, \\quad \\alpha\' = 2\\mu - \\alpha \\implies \\alpha_{11}\' = 2\\left(\\frac{1}{4}\\right) - \\left(-\\frac{1}{2}\\right) = +1.00',
          x: 80,
          y: 500,
          scale: 1.15,
          color: '#00f2ff',
          duration: 900,
        },
      ],
    },
  ],
};

/**
 * t2-superposition-mechanics.ts
 *
 * BOARD LESSON: "Understanding Superposition Mechanics"
 *
 * This lesson dives deep into what superposition actually means,
 * how to interpret equal vs unequal superpositions, and connects
 * to the Hadamard gate transformation.
 *
 * Learning flow:
 * 1. What does "superposition" truly mean?
 * 2. Equal superposition: |+⟩ state
 * 3. Unequal superposition examples
 * 4. The Hadamard gate creates superposition
 * 5. Visualization: Bloch sphere intuition
 * 6. Practice connection
 *
 * Coordinate system: 1200 × 700 logical units.
 */

import type { BoardLessonScript } from '../boardTypes';

export const t2SuperpositionMechanics: BoardLessonScript = {
  id: 't2-superposition-mechanics',
  title: 'Understanding Superposition Mechanics',
  topic: 'Superposition',
  difficulty: 'Beginner',
  estimatedMinutes: 7,
  learningObjectives: [
    'Define quantum superposition as a linear combination of basis states',
    'Differentiate between equal and unequal superpositions',
    'Understand how the Hadamard gate creates the |+⟩ state',
    'Connect mathematical superposition to 50/50 measurement distributions',
  ],
  transitionToLessonId: 's1-hadamard-superposition',
  transitionLabel: 'Practice Superposition in Lab',
  steps: [
    // ──────────────────────────────────────────────────────────────────────
    // Step 1: Opening - What is superposition?
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't2-s01-opening',
      title: 'What Is Superposition?',
      narration:
        'Superposition is often described in popular science as being in two states at once. But what does that really mean mathematically?',
      actions: [
        { type: 'MOVE_CURSOR', x: 100, y: 60 },
        {
          type: 'WRITE_TEXT',
          text: 'UNDERSTANDING SUPERPOSITION',
          x: 80,
          y: 50,
          fontSize: 38,
          color: '#7dd3fc',
          fontWeight: 'bold',
          duration: 1000,
        },
        {
          type: 'DRAW_UNDERLINE',
          x: 80,
          y: 92,
          width: 630,
          color: '#0ea5e9',
          strokeWidth: 3,
          duration: 500,
        },
        { type: 'PAUSE', duration: 700 },
        {
          type: 'WRITE_TEXT',
          text: 'What does "being in two states at once" actually mean?',
          x: 80,
          y: 130,
          fontSize: 22,
          color: '#cbd5e1',
          fontStyle: 'italic',
          duration: 1100,
        },
        { type: 'PAUSE', duration: 800 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 2: Linear combination definition
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't2-s02-linear-combination',
      title: 'Linear Combination',
      narration:
        'In rigorous quantum mechanics, superposition means a quantum state is a linear combination of basis vectors with specific complex coefficients.',
      actions: [
        { type: 'MOVE_CURSOR', x: 100, y: 210 },
        {
          type: 'WRITE_TEXT',
          text: 'Superposition = Linear Combination',
          x: 80,
          y: 200,
          fontSize: 28,
          color: '#f0abfc',
          fontWeight: 'bold',
          duration: 900,
        },
        { type: 'PAUSE', duration: 500 },
        {
          type: 'WRITE_MATH',
          latex: '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle',
          x: 120,
          y: 255,
          scale: 1.8,
          color: '#e8e8e8',
          duration: 800,
        },
        { type: 'PAUSE', duration: 800 },
        {
          type: 'DRAW_ARROW',
          x1: 150,
          y1: 320,
          x2: 138,
          y2: 275,
          color: '#34d399',
          strokeWidth: 2,
          duration: 400,
        },
        {
          type: 'WRITE_TEXT',
          text: 'amplitude for |0⟩',
          x: 100,
          y: 330,
          fontSize: 18,
          color: '#34d399',
          duration: 600,
        },
        {
          type: 'DRAW_ARROW',
          x1: 460,
          y1: 320,
          x2: 445,
          y2: 275,
          color: '#fbbf24',
          strokeWidth: 2,
          duration: 400,
        },
        {
          type: 'WRITE_TEXT',
          text: 'amplitude for |1⟩',
          x: 410,
          y: 330,
          fontSize: 18,
          color: '#fbbf24',
          duration: 600,
        },
        { type: 'PAUSE', duration: 900 },
        {
          type: 'WRITE_TEXT',
          text: 'Until measurement, the qubit evolves as a continuous',
          x: 80,
          y: 390,
          fontSize: 19,
          color: '#94a3b8',
          duration: 900,
        },
        {
          type: 'WRITE_TEXT',
          text: 'wave-like state vector with both components active.',
          x: 80,
          y: 415,
          fontSize: 19,
          color: '#94a3b8',
          duration: 900,
        },
        { type: 'PAUSE', duration: 1000 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 3: Equal Superposition - The |+⟩ state
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't2-s03-equal-superposition',
      title: 'Equal Superposition',
      narration:
        'In an equal superposition, the probability of measuring zero equals the probability of measuring one. The quintessential example is the plus state.',
      actions: [
        { type: 'MOVE_CURSOR', x: 650, y: 210 },
        {
          type: 'WRITE_TEXT',
          text: 'EQUAL SUPERPOSITION',
          x: 630,
          y: 200,
          fontSize: 28,
          color: '#60efff',
          fontWeight: 'bold',
          duration: 800,
        },
        {
          type: 'DRAW_UNDERLINE',
          x: 630,
          y: 230,
          width: 380,
          color: '#0ef',
          strokeWidth: 2,
          duration: 300,
        },
        { type: 'PAUSE', duration: 500 },
        {
          type: 'WRITE_TEXT',
          text: 'The |+⟩ (plus) state:',
          x: 630,
          y: 265,
          fontSize: 22,
          color: '#cbd5e1',
          duration: 700,
        },
        {
          type: 'WRITE_MATH',
          latex: '|{+}\\rangle = \\dfrac{1}{\\sqrt{2}}|0\\rangle + \\dfrac{1}{\\sqrt{2}}|1\\rangle',
          x: 630,
          y: 315,
          scale: 1.5,
          color: '#60efff',
          duration: 1000,
        },
        { type: 'PAUSE', duration: 900 },
        {
          type: 'HIGHLIGHT',
          x: 630,
          y: 303,
          w: 180,
          h: 45,
          color: 'rgba(74, 222, 128, 0.2)',
          pulse: true,
          duration: 1000,
        },
        {
          type: 'WRITE_TEXT',
          text: 'P(0) = |1/√2|² = 1/2 = 50%',
          x: 640,
          y: 370,
          fontSize: 18,
          color: '#4ade80',
          duration: 700,
        },
        {
          type: 'HIGHLIGHT',
          x: 820,
          y: 303,
          w: 180,
          h: 45,
          color: 'rgba(251, 191, 36, 0.2)',
          pulse: true,
          duration: 1000,
        },
        {
          type: 'WRITE_TEXT',
          text: 'P(1) = |1/√2|² = 1/2 = 50%',
          x: 830,
          y: 370,
          fontSize: 18,
          color: '#fbbf24',
          duration: 700,
        },
        { type: 'PAUSE', duration: 1200 },
        {
          type: 'DRAW_RECT',
          x: 625,
          y: 195,
          w: 550,
          h: 210,
          color: 'rgba(96, 239, 255, 0.25)',
          strokeWidth: 2,
          duration: 600,
        },
        { type: 'PAUSE', duration: 500 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 4: Unequal Superposition example
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't2-s04-unequal-superposition',
      title: 'Unequal Superposition',
      narration:
        'In an unequal superposition, the amplitudes have different magnitudes, giving different measurement probabilities. For example, eighty percent chance of zero and twenty percent chance of one.',
      actions: [
        { type: 'MOVE_CURSOR', x: 650, y: 455 },
        {
          type: 'WRITE_TEXT',
          text: 'UNEQUAL SUPERPOSITION',
          x: 630,
          y: 445,
          fontSize: 28,
          color: '#fb923c',
          fontWeight: 'bold',
          duration: 800,
        },
        {
          type: 'DRAW_UNDERLINE',
          x: 630,
          y: 475,
          width: 420,
          color: '#f97316',
          strokeWidth: 2,
          duration: 300,
        },
        { type: 'PAUSE', duration: 500 },
        {
          type: 'WRITE_TEXT',
          text: 'Example: 80% / 20% split',
          x: 630,
          y: 510,
          fontSize: 22,
          color: '#cbd5e1',
          duration: 700,
        },
        {
          type: 'WRITE_MATH',
          latex: '|\\psi\\rangle = \\sqrt{0.8}|0\\rangle + \\sqrt{0.2}|1\\rangle',
          x: 630,
          y: 560,
          scale: 1.4,
          color: '#fb923c',
          duration: 1000,
        },
        { type: 'PAUSE', duration: 800 },
        {
          type: 'WRITE_TEXT',
          text: 'P(0) = (√0.8)² = 0.8 = 80%',
          x: 640,
          y: 615,
          fontSize: 18,
          color: '#4ade80',
          duration: 700,
        },
        {
          type: 'WRITE_TEXT',
          text: 'P(1) = (√0.2)² = 0.2 = 20%',
          x: 640,
          y: 640,
          fontSize: 18,
          color: '#fbbf24',
          duration: 700,
        },
        { type: 'PAUSE', duration: 1000 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 5: The Hadamard Gate - Gateway to Superposition
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't2-s05-hadamard-gate',
      title: 'The Hadamard Gate',
      narration:
        'The Hadamard gate is the primary tool for creating superpositions. When applied to the ground state, it rotates the state vector into the plus state.',
      actions: [
        { type: 'CLEAR_BOARD', animated: true },
        { type: 'PAUSE', duration: 500 },
        { type: 'MOVE_CURSOR', x: 100, y: 70 },
        {
          type: 'WRITE_TEXT',
          text: 'THE HADAMARD GATE',
          x: 80,
          y: 60,
          fontSize: 36,
          color: '#818cf8',
          fontWeight: 'bold',
          duration: 900,
        },
        {
          type: 'DRAW_UNDERLINE',
          x: 80,
          y: 100,
          width: 410,
          color: '#6366f1',
          strokeWidth: 3,
          duration: 400,
        },
        { type: 'PAUSE', duration: 600 },
        {
          type: 'WRITE_TEXT',
          text: 'Gateway to Equal Superposition',
          x: 80,
          y: 130,
          fontSize: 22,
          color: '#a5b4fc',
          fontStyle: 'italic',
          duration: 800,
        },
        { type: 'PAUSE', duration: 600 },

        // Draw transformation diagram
        { type: 'MOVE_CURSOR', x: 150, y: 240 },
        {
          type: 'WRITE_MATH',
          latex: '|0\\rangle',
          x: 120,
          y: 220,
          scale: 1.6,
          color: '#4ade80',
          duration: 500,
        },
        {
          type: 'DRAW_ARROW',
          x1: 210,
          y1: 238,
          x2: 320,
          y2: 238,
          color: '#cbd5e1',
          strokeWidth: 3,
          duration: 500,
        },
        {
          type: 'DRAW_GATE_BOX',
          cx: 375,
          cy: 238,
          label: 'H',
          size: 54,
          color: '#818cf8',
          duration: 400,
        },
        {
          type: 'DRAW_ARROW',
          x1: 430,
          y1: 238,
          x2: 540,
          y2: 238,
          color: '#cbd5e1',
          strokeWidth: 3,
          duration: 500,
        },
        {
          type: 'WRITE_MATH',
          latex: '|{+}\\rangle',
          x: 560,
          y: 220,
          scale: 1.6,
          color: '#60efff',
          duration: 500,
        },
        { type: 'PAUSE', duration: 800 },

        // Write the equation
        {
          type: 'WRITE_TEXT',
          text: 'Mathematically:',
          x: 80,
          y: 320,
          fontSize: 22,
          color: '#cbd5e1',
          duration: 600,
        },
        {
          type: 'WRITE_MATH',
          latex: 'H|0\\rangle = |{+}\\rangle = \\dfrac{|0\\rangle + |1\\rangle}{\\sqrt{2}}',
          x: 80,
          y: 370,
          scale: 1.5,
          color: '#e8e8e8',
          duration: 1100,
        },
        { type: 'PAUSE', duration: 900 },

        // Applied to |1⟩
        {
          type: 'WRITE_TEXT',
          text: 'Applied to |1⟩, it produces the minus state:',
          x: 80,
          y: 445,
          fontSize: 20,
          color: '#cbd5e1',
          duration: 900,
        },
        {
          type: 'WRITE_MATH',
          latex: 'H|1\\rangle = |-\\rangle = \\dfrac{|0\\rangle - |1\\rangle}{\\sqrt{2}}',
          x: 80,
          y: 490,
          scale: 1.4,
          color: '#e8e8e8',
          duration: 1000,
        },
        { type: 'PAUSE', duration: 1000 },

        // Key insight
        {
          type: 'DRAW_RECT',
          x: 70,
          y: 550,
          w: 700,
          h: 90,
          color: 'rgba(129, 140, 248, 0.25)',
          strokeWidth: 2,
          fillColor: 'rgba(129, 140, 248, 0.05)',
          duration: 500,
        },
        {
          type: 'WRITE_TEXT',
          text: '⟶  The Hadamard gate is reversible: H·H = I',
          x: 90,
          y: 575,
          fontSize: 20,
          color: '#a5b4fc',
          fontStyle: 'italic',
          duration: 900,
        },
        {
          type: 'WRITE_TEXT',
          text: '   Applying H twice returns to the original state.',
          x: 90,
          y: 605,
          fontSize: 18,
          color: '#94a3b8',
          duration: 800,
        },
        { type: 'PAUSE', duration: 1200 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 6: Lab connection and measurement
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't2-s06-lab-connection',
      title: 'Verification in the Lab',
      narration:
        'Running one thousand shots on a circuit with a Hadamard gate produces approximately five hundred counts of zero and five hundred counts of one, due to statistical sampling convergence.',
      actions: [
        { type: 'MOVE_CURSOR', x: 800, y: 180 },
        {
          type: 'WRITE_TEXT',
          text: 'VERIFY IN THE LAB',
          x: 780,
          y: 170,
          fontSize: 28,
          color: '#10b981',
          fontWeight: 'bold',
          duration: 700,
        },
        {
          type: 'DRAW_UNDERLINE',
          x: 780,
          y: 200,
          width: 340,
          color: '#059669',
          strokeWidth: 2,
          duration: 300,
        },
        { type: 'PAUSE', duration: 500 },

        // Circuit diagram
        {
          type: 'DRAW_QUBIT_WIRE',
          x: 780,
          y: 260,
          length: 380,
          label: '|0⟩',
          color: '#e8e8e8',
          duration: 600,
        },
        {
          type: 'DRAW_GATE_BOX',
          cx: 920,
          cy: 260,
          label: 'H',
          size: 48,
          color: '#818cf8',
          duration: 400,
        },
        {
          type: 'DRAW_MEASURE_SYMBOL',
          cx: 1070,
          cy: 260,
          size: 48,
          duration: 400,
        },
        { type: 'PAUSE', duration: 600 },

        {
          type: 'WRITE_TEXT',
          text: 'Run 1000 shots ⟶',
          x: 780,
          y: 320,
          fontSize: 20,
          color: '#cbd5e1',
          duration: 600,
        },
        { type: 'PAUSE', duration: 400 },

        // Results bar chart
        {
          type: 'DRAW_RECT',
          x: 800,
          y: 370,
          w: 140,
          h: 120,
          color: '#4ade80',
          strokeWidth: 2,
          fillColor: 'rgba(74, 222, 128, 0.2)',
          duration: 600,
        },
        {
          type: 'WRITE_TEXT',
          text: '≈ 500',
          x: 840,
          y: 415,
          fontSize: 24,
          color: '#4ade80',
          fontWeight: 'bold',
          duration: 400,
        },
        {
          type: 'WRITE_TEXT',
          text: 'outcome 0',
          x: 825,
          y: 505,
          fontSize: 16,
          color: '#cbd5e1',
          duration: 400,
        },

        {
          type: 'DRAW_RECT',
          x: 970,
          y: 370,
          w: 140,
          h: 120,
          color: '#fbbf24',
          strokeWidth: 2,
          fillColor: 'rgba(251, 191, 36, 0.2)',
          duration: 600,
        },
        {
          type: 'WRITE_TEXT',
          text: '≈ 500',
          x: 1010,
          y: 415,
          fontSize: 24,
          color: '#fbbf24',
          fontWeight: 'bold',
          duration: 400,
        },
        {
          type: 'WRITE_TEXT',
          text: 'outcome 1',
          x: 995,
          y: 505,
          fontSize: 16,
          color: '#cbd5e1',
          duration: 400,
        },
        { type: 'PAUSE', duration: 1500 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 7: Summary
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't2-s07-summary',
      title: 'Summary',
      narration:
        'To summarize: superposition means a linear combination of basis states. Equal superposition means equal probabilities. And the Hadamard gate is your primary tool for creating these states.',
      actions: [
        { type: 'MOVE_CURSOR', x: 120, y: 140 },
        {
          type: 'WRITE_TEXT',
          text: '✓ Superposition = Linear combination of basis states',
          x: 100,
          y: 130,
          fontSize: 20,
          color: '#10b981',
          duration: 1000,
        },
        {
          type: 'WRITE_TEXT',
          text: '✓ Equal superposition = Equal measurement probabilities',
          x: 100,
          y: 165,
          fontSize: 20,
          color: '#10b981',
          duration: 1000,
        },
        {
          type: 'WRITE_TEXT',
          text: '✓ Hadamard gate creates |+⟩ from |0⟩',
          x: 100,
          y: 200,
          fontSize: 20,
          color: '#10b981',
          duration: 900,
        },
        {
          type: 'WRITE_TEXT',
          text: '✓ Verification: Run experiments in the Quantum Lab',
          x: 100,
          y: 235,
          fontSize: 20,
          color: '#10b981',
          duration: 1000,
        },
        { type: 'PAUSE', duration: 1500 },
      ],
    },
  ],
};

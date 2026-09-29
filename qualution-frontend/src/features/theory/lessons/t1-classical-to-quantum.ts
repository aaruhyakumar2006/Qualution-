/**
 * t1-classical-to-quantum.ts
 *
 * BOARD LESSON: "Classical Bit → Qubit → Superposition"
 *
 * This is the first complete production-quality theory board lesson.
 *
 * The board begins completely empty. The teacher cursor progressively:
 * 1. Introduces the classical bit
 * 2. Draws the 0 and 1
 * 3. Introduces the qubit concept
 * 4. Writes the state notation progressively
 * 5. Derives the Hadamard transformation step by step
 * 6. Draws a simple circuit diagram
 * 7. Explains measurement intuition
 * 8. Transitions to the Quantum Workbench
 *
 * Coordinate system: 1200 × 700 logical units.
 */

import type { BoardLessonScript } from '../boardTypes';

export const t1ClassicalToQuantum: BoardLessonScript = {
  id: 't1-classical-to-quantum',
  title: 'Classical Bit → Qubit → Superposition',
  topic: 'Quantum Foundations',
  difficulty: 'Beginner',
  estimatedMinutes: 6,
  learningObjectives: [
    'Understand the difference between a classical bit and a qubit',
    'Read and write quantum state notation using ket vectors',
    'Understand how the Hadamard gate creates superposition',
    'Predict measurement outcomes for a qubit in superposition',
  ],
  transitionToLessonId: 's1-hadamard-superposition',
  transitionLabel: 'Hadamard Superposition Lab',
  steps: [
    // ──────────────────────────────────────────────────────────────────────
    // Step 1: Opening — empty board, cursor enters, writes heading
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't1-s01-opening',
      title: 'Classical Information',
      narration: 'Let us start from the very beginning. What is a classical bit?',
      actions: [
        { type: 'MOVE_CURSOR', x: 100, y: 80 },
        {
          type: 'WRITE_TEXT',
          text: 'CLASSICAL INFORMATION',
          x: 80,
          y: 70,
          fontSize: 38,
          color: '#00f2ff',
          fontWeight: 'bold',
          duration: 900,
        },
        { type: 'PAUSE', duration: 600 },
        {
          type: 'DRAW_UNDERLINE',
          x: 80,
          y: 112,
          width: 520,
          color: '#00f2ff',
          strokeWidth: 3,
          duration: 400,
        },
        { type: 'PAUSE', duration: 500 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 2: Classical bit — 0 and 1
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't1-s02-classical-bit',
      title: 'The Classical Bit',
      narration:
        'A classical bit is the fundamental unit of classical computing. It can be in exactly one of two states: zero, or one. Nothing in between.',
      actions: [
        { type: 'MOVE_CURSOR', x: 120, y: 160 },
        {
          type: 'WRITE_TEXT',
          text: 'A classical bit holds exactly one value:',
          x: 100,
          y: 155,
          fontSize: 24,
          color: '#d0d0d0',
          duration: 1200,
        },
        { type: 'PAUSE', duration: 400 },

        // Draw "0" in a box on the left
        { type: 'MOVE_CURSOR', x: 200, y: 270 },
        {
          type: 'DRAW_RECT',
          x: 150,
          y: 220,
          w: 100,
          h: 100,
          color: '#4CAF50',
          strokeWidth: 3,
          duration: 500,
        },
        {
          type: 'WRITE_TEXT',
          text: '0',
          x: 185,
          y: 240,
          fontSize: 56,
          color: '#4CAF50',
          fontWeight: 'bold',
          duration: 300,
        },

        { type: 'PAUSE', duration: 300 },

        // Draw "OR" text
        {
          type: 'WRITE_TEXT',
          text: 'OR',
          x: 290,
          y: 253,
          fontSize: 24,
          color: '#888888',
          fontStyle: 'italic',
          duration: 300,
        },

        // Draw "1" in a box on the right
        { type: 'MOVE_CURSOR', x: 430, y: 270 },
        {
          type: 'DRAW_RECT',
          x: 380,
          y: 220,
          w: 100,
          h: 100,
          color: '#FF7043',
          strokeWidth: 3,
          duration: 500,
        },
        {
          type: 'WRITE_TEXT',
          text: '1',
          x: 415,
          y: 240,
          fontSize: 56,
          color: '#FF7043',
          fontWeight: 'bold',
          duration: 300,
        },

        { type: 'PAUSE', duration: 500 },

        // Caption below
        {
          type: 'WRITE_TEXT',
          text: 'Never both. Never in between.',
          x: 155,
          y: 345,
          fontSize: 18,
          color: '#aaaaaa',
          fontStyle: 'italic',
          duration: 800,
        },
        { type: 'PAUSE', duration: 800 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 3: Introduce quantum information heading on the right half
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't1-s03-quantum-heading',
      title: 'Quantum Information',
      narration:
        'Now let us talk about the quantum bit — the qubit. The qubit operates under completely different rules.',
      actions: [
        { type: 'MOVE_CURSOR', x: 650, y: 80 },
        {
          type: 'WRITE_TEXT',
          text: 'QUANTUM INFORMATION',
          x: 630,
          y: 70,
          fontSize: 38,
          color: '#ff00ff',
          fontWeight: 'bold',
          duration: 900,
        },
        {
          type: 'DRAW_UNDERLINE',
          x: 630,
          y: 112,
          width: 500,
          color: '#ff00ff',
          strokeWidth: 3,
          duration: 400,
        },
        { type: 'PAUSE', duration: 500 },
        // Vertical divider line in center
        {
          type: 'DRAW_LINE',
          x1: 575,
          y1: 50,
          x2: 575,
          y2: 680,
          color: '#333355',
          strokeWidth: 2,
          duration: 600,
          dashed: true,
        },
        { type: 'PAUSE', duration: 400 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 4: Qubit state vector notation
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't1-s04-qubit-notation',
      title: 'Qubit State Notation',
      narration:
        'A qubit is described by a state vector — we write it using Dirac notation, called a ket. This single ket vector encodes the complete quantum state of the qubit.',
      actions: [
        { type: 'MOVE_CURSOR', x: 700, y: 150 },
        {
          type: 'WRITE_TEXT',
          text: 'A qubit state is written as:',
          x: 640,
          y: 150,
          fontSize: 22,
          color: '#ff00ff',
          duration: 900,
        },
        { type: 'PAUSE', duration: 600 },

        // The ket vector
        {
          type: 'WRITE_MATH',
          latex: '|\\psi\\rangle',
          x: 680,
          y: 195,
          scale: 1.8,
          color: '#ffff00',
          duration: 600,
        },
        { type: 'PAUSE', duration: 700 },

        {
          type: 'WRITE_TEXT',
          text: 'This is called a "ket" — it describes',
          x: 640,
          y: 255,
          fontSize: 19,
          color: '#bbbbbb',
          duration: 900,
        },
        {
          type: 'WRITE_TEXT',
          text: 'the full quantum state of the qubit.',
          x: 640,
          y: 280,
          fontSize: 19,
          color: '#bbbbbb',
          duration: 800,
        },
        { type: 'PAUSE', duration: 600 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 5: Superposition — the key difference
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't1-s05-superposition',
      title: 'Superposition',
      narration:
        'Here is the critical difference. A qubit can exist in a superposition — a combination of zero and one simultaneously. The general state is alpha times zero ket, plus beta times one ket.',
      actions: [
        { type: 'MOVE_CURSOR', x: 640, y: 330 },
        {
          type: 'WRITE_TEXT',
          text: 'A qubit can be in superposition:',
          x: 640,
          y: 325,
          fontSize: 20,
          color: '#f5c842',
          fontWeight: 'bold',
          duration: 900,
        },
        { type: 'PAUSE', duration: 500 },

        // Full state equation step by step
        { type: 'MOVE_CURSOR', x: 680, y: 375 },
        {
          type: 'WRITE_MATH',
          latex: '|\\psi\\rangle = \\alpha|0\\rangle',
          x: 640,
          y: 375,
          scale: 1.4,
          color: '#e8e8e8',
          duration: 700,
        },
        { type: 'PAUSE', duration: 600 },

        {
          type: 'WRITE_MATH',
          latex: '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle',
          x: 640,
          y: 375,
          scale: 1.4,
          color: '#e8e8e8',
          duration: 700,
          itemId: 'full-state',
        },
        { type: 'PAUSE', duration: 600 },

        // Explain α
        {
          type: 'DRAW_ARROW',
          x1: 680,
          y1: 440,
          x2: 662,
          y2: 393,
          color: '#4ade80',
          strokeWidth: 2,
          duration: 400,
        },
        {
          type: 'WRITE_TEXT',
          text: 'α: amplitude for |0⟩',
          x: 630,
          y: 450,
          fontSize: 17,
          color: '#4ade80',
          duration: 600,
        },

        // Explain β
        {
          type: 'DRAW_ARROW',
          x1: 1010,
          y1: 440,
          x2: 990,
          y2: 393,
          color: '#f87171',
          strokeWidth: 2,
          duration: 400,
        },
        {
          type: 'WRITE_TEXT',
          text: 'β: amplitude for |1⟩',
          x: 960,
          y: 450,
          fontSize: 17,
          color: '#f87171',
          duration: 600,
        },
        { type: 'PAUSE', duration: 700 },

        // Normalization constraint
        {
          type: 'WRITE_MATH',
          latex: '|\\alpha|^2 + |\\beta|^2 = 1',
          x: 700,
          y: 490,
          scale: 1.2,
          color: '#94a3b8',
          duration: 600,
        },
        {
          type: 'WRITE_TEXT',
          text: '(probabilities must sum to 1)',
          x: 700,
          y: 530,
          fontSize: 16,
          color: '#666688',
          fontStyle: 'italic',
          duration: 700,
        },
        { type: 'PAUSE', duration: 800 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 6: Hadamard gate — creating equal superposition
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't1-s06-hadamard',
      title: 'The Hadamard Gate',
      narration:
        'To create an equal superposition, we apply the Hadamard gate. When applied to the zero state, it creates a perfect 50-50 superposition called the plus state.',
      actions: [
        // Clear bottom portion of classical side for Hadamard diagram
        { type: 'MOVE_CURSOR', x: 100, y: 420 },
        {
          type: 'WRITE_TEXT',
          text: 'THE HADAMARD GATE',
          x: 80,
          y: 415,
          fontSize: 26,
          color: '#60efff',
          fontWeight: 'bold',
          duration: 700,
        },
        {
          type: 'DRAW_UNDERLINE',
          x: 80,
          y: 445,
          width: 350,
          color: '#0ef',
          strokeWidth: 2,
          duration: 300,
        },
        { type: 'PAUSE', duration: 400 },

        // Draw the circuit: |0⟩ — [H] — ⟨M⟩
        { type: 'MOVE_CURSOR', x: 80, y: 520 },
        {
          type: 'DRAW_QUBIT_WIRE',
          x: 80,
          y: 520,
          length: 430,
          label: '|0⟩',
          color: '#e8e8e8',
          duration: 600,
        },
        { type: 'PAUSE', duration: 300 },

        // H gate box
        {
          type: 'DRAW_GATE_BOX',
          cx: 250,
          cy: 520,
          label: 'H',
          size: 44,
          color: '#60efff',
          duration: 300,
        },

        // Measurement symbol
        {
          type: 'DRAW_MEASURE_SYMBOL',
          cx: 440,
          cy: 520,
          size: 44,
          duration: 300,
        },

        { type: 'PAUSE', duration: 500 },

        // Write the equation below the circuit
        {
          type: 'WRITE_MATH',
          latex: 'H|0\\rangle = |{+}\\rangle',
          x: 100,
          y: 570,
          scale: 1.3,
          color: '#60efff',
          duration: 600,
        },
        { type: 'PAUSE', duration: 500 },

        {
          type: 'WRITE_MATH',
          latex: '= \\dfrac{1}{\\sqrt{2}}|0\\rangle + \\dfrac{1}{\\sqrt{2}}|1\\rangle',
          x: 100,
          y: 620,
          scale: 1.2,
          color: '#e8e8e8',
          duration: 700,
        },
        { type: 'PAUSE', duration: 700 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 7: Highlight and interpret
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't1-s07-interpretation',
      title: 'Interpreting Superposition',
      narration:
        'The probability of measuring zero is one-half, and the probability of measuring one is also one-half. This is equal superposition — the qubit has equal chances of collapsing to either state upon measurement.',
      actions: [
        // Highlight the 1/√2 |0⟩ part
        {
          type: 'HIGHLIGHT',
          x: 100,
          y: 608,
          w: 160,
          h: 40,
          color: 'rgba(74, 222, 128, 0.25)',
          pulse: true,
          duration: 1200,
        },
        {
          type: 'WRITE_TEXT',
          text: 'P(0) = 50%',
          x: 110,
          y: 658,
          fontSize: 18,
          color: '#4ade80',
          duration: 400,
        },

        { type: 'PAUSE', duration: 600 },

        // Highlight the 1/√2 |1⟩ part
        {
          type: 'HIGHLIGHT',
          x: 270,
          y: 608,
          w: 160,
          h: 40,
          color: 'rgba(248, 113, 113, 0.25)',
          pulse: true,
          duration: 1200,
        },
        {
          type: 'WRITE_TEXT',
          text: 'P(1) = 50%',
          x: 280,
          y: 658,
          fontSize: 18,
          color: '#f87171',
          duration: 400,
        },

        { type: 'PAUSE', duration: 1000 },
      ],
    },

    // ──────────────────────────────────────────────────────────────────────
    // Step 8: Summary comparison
    // ──────────────────────────────────────────────────────────────────────
    {
      id: 't1-s08-comparison',
      title: 'Classical vs. Quantum',
      narration:
        'To summarise: a classical bit is always either zero or one. A qubit can be both simultaneously — until it is measured, at which point it collapses to a definite value. This is the fundamental principle that gives quantum computers their power.',
      actions: [
        // Classical summary box
        {
          type: 'DRAW_RECT',
          x: 88,
          y: 138,
          w: 465,
          h: 228,
          color: 'rgba(74,222,128,0.3)',
          strokeWidth: 1.5,
          duration: 600,
        },

        // Quantum summary box
        {
          type: 'DRAW_RECT',
          x: 628,
          y: 138,
          w: 545,
          h: 408,
          color: 'rgba(199,125,255,0.3)',
          strokeWidth: 1.5,
          duration: 600,
        },

        { type: 'PAUSE', duration: 800 },

        // Key insight at the bottom
        {
          type: 'WRITE_TEXT',
          text: '⟶  Superposition is the engine of quantum advantage.',
          x: 310,
          y: 652,
          fontSize: 20,
          color: '#f5c842',
          fontStyle: 'italic',
          duration: 1200,
        },
        { type: 'PAUSE', duration: 1200 },
      ],
    },
  ],
};

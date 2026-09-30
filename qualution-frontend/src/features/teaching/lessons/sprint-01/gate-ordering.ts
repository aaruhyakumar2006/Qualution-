import type { LessonScript } from '../../types';

export const s1GateOrderingLesson: LessonScript = {
  id: 's1-gate-ordering',
  title: "Gate Ordering: Why Quantum Gates Don't Always Commute",
  sprint: 1,
  difficulty: 'Beginner',
  estimatedMinutes: 7,
  xpReward: 150,
  curriculumModuleId: 'lesson-1-gate-ordering',
  completionMessage:
    'Excellent! You discovered that quantum gates generally do not commute: changing gate order produces different quantum states whose phase difference can be revealed through interference.',
  conceptTags: ['Gate Ordering', 'Non-Commutativity', 'Relative Phase', 'Interference', 'Hadamard', 'Pauli-X'],
  learningObjectives: [
    'Understand that the order of quantum gates changes the resulting quantum state',
    'Understand that quantum gates generally do not commute',
    'Recognize that different quantum states can produce identical measurement distributions in a given basis',
    'Discover that H → X produces state |+⟩ while X → H produces state |−⟩',
    'Inspect statevector and Bloch sphere representations to reveal relative phase differences',
    'Use an interference readout operation to convert phase differences into measurable bit flips',
  ],
  prerequisites: ['Hadamard Gate & Superposition', 'Pauli-X Gate', 'Z Gate & Phase'],
  summary:
    'Discover why gate order matters in quantum computing. Compare H → X with X → H, learn why both yield 50/50 computational measurements, uncover their phase difference on the Bloch sphere, and make the distinction measurable through quantum interference.',
  starterCircuit: {
    qubits: 1,
    classical_bits: 1,
    gates: [],
    measure: true,
    shots: 500,
  },
  steps: [
    // ── STEP 1: Introduction ──────────────────────────────────────
    {
      id: 'step-1-intro',
      stepNumber: 1,
      title: 'Introduction to Gate Ordering',
      explanation:
        'A quantum circuit is an ordered sequence of physical transformations. Today we will test whether changing the order of gates changes the resulting quantum state and measurement outcome.',
      narrationText:
        'A quantum circuit is an ordered sequence of transformations. Today we will test whether changing the order of gates changes the result.',
      actions: [
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'highlight_qubit', qubitIndex: 0 },
        {
          type: 'explain',
          title: 'Gate Ordering',
          message: 'Wire q[0] is initialized in |0⟩. We will test whether reversing gate order changes the quantum state.',
        },
      ],
    },

    // ── STEP 2: Build Circuit A: H → X ────────────────────────────
    {
      id: 'step-2-build-circuit-a',
      stepNumber: 2,
      title: 'Build Circuit A: H → X',
      explanation:
        'We construct Circuit A by placing a Hadamard (H) gate first at column 0, followed by a Pauli-X gate at column 1 on wire q[0]. We apply H first, then X.',
      narrationText:
        'In Circuit A, we place H first at column zero, followed by X at column one. We apply H first, then X.',
      actions: [
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 0,
          gateId: 'exp-a-gate-h',
        },
        {
          type: 'add_gate',
          gate: 'x',
          targets: [0],
          column: 1,
          gateId: 'exp-a-gate-x',
        },
        { type: 'highlight_gate', gateId: 'exp-a-gate-h', targetQubit: 0, column: 0 },
        {
          type: 'explain',
          title: 'Circuit A: H then X',
          message: 'H applied first at col 0, followed by X at col 1 on wire q[0].',
        },
      ],
    },

    // ── STEP 3: Theoretical Expectation A ──────────────────────────────────────
    {
      id: 'step-3-predict-a',
      stepNumber: 3,
      title: 'Theoretical Expectation: Circuit A (H → X)',
      explanation:
        'H|0⟩ creates state |+⟩ = (|0⟩ + |1⟩)/√2. Since X swaps |0⟩ and |1⟩, applying X to |+⟩ yields (|1⟩ + |0⟩)/√2 = |+⟩! Measuring |+⟩ in the computational basis produces approximately 50% 0 and 50% 1.',
      narrationText:
        'Before measuring, consider the theory: H creates state |+⟩, and X leaves |+⟩ unchanged. So we expect an equal 50/50 distribution.',
      actions: [
        {
          type: 'explain',
          title: 'Expected 50/50',
          message: 'H → X prepares state |+⟩, which yields approximately 50% 0 and 50% 1.',
        },
      ],
      checkpoint: {
        id: 'pred-order-a',
        prompt: 'Prediction Checkpoint: Circuit A',
        question: 'What measurement distribution do you expect from H → X starting from |0⟩?',
        options: [
          {
            id: 'opt-0',
            label: 'Approximately 50% 0 and 50% 1',
            description: 'Equal superposition of 0 and 1 (state |+⟩)',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Approximately 100% 0',
            description: 'Deterministic outcome at 0',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Approximately 100% 1',
            description: 'Deterministic outcome at 1',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'H|0⟩ creates state |+⟩ = (|0⟩ + |1⟩)/√2. Since X swaps |0⟩ and |1⟩, applying X to |+⟩ yields (|1⟩ + |0⟩)/√2 = |+⟩! Measuring |+⟩ in the computational basis produces approximately 50% 0 and 50% 1.',
        structuredComparison: {
          expectedDistribution: {
            '0': { min: 0.40, max: 0.60 },
          },
        },
        comparisonRule: (predictionIndex, simResult) => {
          let p0 = 0.5;
          if (simResult?.simulation?.probabilities) {
            p0 = simResult.simulation.probabilities['0'] ?? 0.5;
          } else if (simResult?.simulation?.counts) {
            const c0 = simResult.simulation.counts['0'] || 0;
            const c1 = simResult.simulation.counts['1'] || 0;
            const total = c0 + c1;
            if (total > 0) p0 = c0 / total;
          }
          const isMatch = predictionIndex === 0 && Math.abs(p0 - 0.5) <= 0.15;
          return {
            isMatch,
            userSummary: isMatch
              ? 'Prediction Confirmed: Circuit A produces ~50/50 distribution'
              : 'Result Divergence Observed',
            detailedExplanation: isMatch
              ? `The simulation measured ${(p0 * 100).toFixed(0)}% |0⟩, confirming equal superposition.`
              : `Expected ~50/50, but observed ${(p0 * 100).toFixed(0)}% |0⟩.`,
          };
        },
      },
    },

    // ── STEP 4: Experiment A ──────────────────────────────────────
    {
      id: 'step-4-experiment-a',
      stepNumber: 4,
      title: 'Simulate Circuit A (H → X)',
      explanation:
        'We execute 500 shots on Circuit A to observe the empirical computational-basis measurement distribution.',
      narrationText:
        'Let us execute 500 shots on Circuit A and analyze the measurement histogram.',
      actions: [
        { type: 'run_simulation', shots: 500 },
        { type: 'clear_highlights' },
        { type: 'focus_visualization', panel: 'results' },
        { type: 'show_result' },
        { type: 'compare_prediction' },
      ],
    },

    // ── STEP 5: Build Circuit B: X → H ────────────────────────────
    {
      id: 'step-5-build-circuit-b',
      stepNumber: 5,
      title: 'Build Circuit B: X → H (Reversed Order)',
      explanation:
        'Now we use exactly the same two gates, but reverse their order: we place Pauli-X first at column 0, followed by Hadamard (H) at column 1 on wire q[0].',
      narrationText:
        'Now we use exactly the same two gates, but reverse their order: X first, then H.',
      actions: [
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        {
          type: 'add_gate',
          gate: 'x',
          targets: [0],
          column: 0,
          gateId: 'exp-b-gate-x',
        },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 1,
          gateId: 'exp-b-gate-h',
        },
        { type: 'highlight_gate', gateId: 'exp-b-gate-x', targetQubit: 0, column: 0 },
        {
          type: 'explain',
          title: 'Circuit B: X then H',
          message: 'X applied first at col 0, followed by H at col 1 on wire q[0]. Gate order is reversed!',
        },
      ],
    },

    // ── STEP 6: Theoretical Expectation B ──────────────────────────────────────
    {
      id: 'step-6-predict-b',
      stepNumber: 6,
      title: 'Theoretical Expectation: Circuit B (X → H)',
      explanation:
        'X first flips |0⟩ to |1⟩. Then H transforms |1⟩ into state |−⟩ = (|0⟩ - |1⟩)/√2. Because computational-basis measurement measures amplitude squared (|1/√2|² = 0.5), it also yields approximately 50% 0 and 50% 1!',
      narrationText:
        'Think about the expected outcome: X then H yields state |−⟩, which also gives a 50/50 measurement distribution.',
      actions: [
        {
          type: 'explain',
          title: 'Expected 50/50',
          message: 'X → H produces state |−⟩, yielding approximately 50% 0 and 50% 1.',
        },
      ],
      checkpoint: {
        id: 'pred-order-b',
        prompt: 'Prediction Checkpoint: Circuit B',
        question: 'What computational-basis measurement distribution do you expect from X → H starting from |0⟩?',
        options: [
          {
            id: 'opt-0',
            label: 'Approximately 50% 0 and 50% 1',
            description: 'Equal probabilities across both outcomes (state |−⟩)',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Approximately 100% 0',
            description: 'Deterministic outcome at 0',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Approximately 100% 1',
            description: 'Deterministic outcome at 1',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'X first flips |0⟩ to |1⟩. Then H transforms |1⟩ into state |−⟩ = (|0⟩ - |1⟩)/√2. Because computational-basis measurement measures amplitude squared (|1/√2|² = 0.5), it also yields approximately 50% 0 and 50% 1!',
        structuredComparison: {
          expectedDistribution: {
            '0': { min: 0.40, max: 0.60 },
          },
        },
        comparisonRule: (predictionIndex, simResult) => {
          let p0 = 0.5;
          if (simResult?.simulation?.probabilities) {
            p0 = simResult.simulation.probabilities['0'] ?? 0.5;
          } else if (simResult?.simulation?.counts) {
            const c0 = simResult.simulation.counts['0'] || 0;
            const c1 = simResult.simulation.counts['1'] || 0;
            const total = c0 + c1;
            if (total > 0) p0 = c0 / total;
          }
          const isMatch = predictionIndex === 0 && Math.abs(p0 - 0.5) <= 0.15;
          return {
            isMatch,
            userSummary: isMatch
              ? 'Prediction Confirmed: Circuit B also produces ~50/50 distribution'
              : 'Result Divergence Observed',
            detailedExplanation: isMatch
              ? `The simulation measured ${(p0 * 100).toFixed(0)}% |0⟩, confirming equal superposition.`
              : `Expected ~50/50, but observed ${(p0 * 100).toFixed(0)}% |0⟩.`,
          };
        },
      },
    },

    // ── STEP 7: Experiment B ──────────────────────────────────────
    {
      id: 'step-7-experiment-b',
      stepNumber: 7,
      title: 'Simulate Circuit B (X → H)',
      explanation:
        'We execute 500 shots on Circuit B with reversed gate ordering to measure the computational distribution.',
      narrationText:
        'Let us execute 500 shots on Circuit B and observe the measurement results.',
      actions: [
        { type: 'run_simulation', shots: 500 },
        { type: 'clear_highlights' },
        { type: 'focus_visualization', panel: 'results' },
        { type: 'show_result' },
        { type: 'compare_prediction' },
      ],
    },

    // ── STEP 8: The Mystery: Both Histograms are 50/50 ─────────────
    {
      id: 'step-8-the-puzzle',
      stepNumber: 8,
      title: 'The Mystery: Same Measurement Histograms',
      explanation:
        'Look closely at both experiments: Circuit A (H → X) gave ~50/50. Circuit B (X → H) also gave ~50/50! Does this mean the two circuits created the same quantum state? No! Standard computational measurement only detects amplitude magnitudes (|c|²), completely blind to relative phase.',
      narrationText:
        'Notice that both histograms are 50/50! Does that mean the quantum states are identical? Let us inspect the statevector to uncover the hidden difference.',
      actions: [
        {
          type: 'explain',
          title: 'The Measurement Paradox',
          message:
            'Both circuits measured ~50/50 in the computational basis. But are the underlying quantum states actually identical?',
        },
      ],
    },

    // ── STEP 9: Inspect State & Phase: |+⟩ vs |−⟩ ──────────────────
    {
      id: 'step-9-inspect-state',
      stepNumber: 9,
      title: 'Inspect State & Phase: |+⟩ vs |−⟩',
      explanation:
        'Examine the State panel. Circuit A (H → X) produced state |+⟩ = (|0⟩ + |1⟩)/√2 (Bloch vector along +X). Circuit B (X → H) produced state |−⟩ = (|0⟩ − |1⟩)/√2 (Bloch vector along −X). The relative phase between |0⟩ and |1⟩ is flipped from positive to negative! Reversing gate order transformed the qubit into an entirely different state.',
      narrationText:
        'Look at the State panel: Circuit A produced |+⟩ with a plus sign, while Circuit B produced |−⟩ with a minus sign! On the Bloch sphere, they point in opposite directions along the X axis.',
      actions: [
        { type: 'focus_visualization', panel: 'state' },
        {
          type: 'explain',
          title: 'Relative Phase Revealed',
          message:
            'H → X gives |+⟩ (Bloch +X). X → H gives |−⟩ (Bloch −X). Gate order changed the quantum state: HX ≠ XH!',
        },
      ],
    },

    // ── STEP 10: Interference Readout Experiment Setup ─────────────
    {
      id: 'step-10-setup-readout',
      stepNumber: 10,
      title: 'Interference Readout: Making Phase Measurable',
      explanation:
        'How can a physical measurement distinguish |+⟩ from |−⟩? By adding an interference operation! A Hadamard gate rotates the X-basis into the computational basis: H|+⟩ = |0⟩ (100% 0), while H|−⟩ = |1⟩ (100% 1). Let us append a Hadamard gate to Circuit A, building H → X → H.',
      narrationText:
        'How can we measure this phase difference directly? By adding a Hadamard gate as an interferometer! Let us test Circuit A with readout: H → X → H.',
      actions: [
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 0,
          gateId: 'readout-a-h1',
        },
        {
          type: 'add_gate',
          gate: 'x',
          targets: [0],
          column: 1,
          gateId: 'readout-a-x',
        },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 2,
          gateId: 'readout-a-h2',
        },
        { type: 'highlight_gate', gateId: 'readout-a-h2', targetQubit: 0, column: 2 },
        {
          type: 'explain',
          title: 'Interference Readout: H → X → H',
          message: 'The final H gate acts as an interferometer, converting phase into measurable computational outcomes.',
        },
      ],
    },

    // ── STEP 11: Theoretical Expectation C ────────────────────────────────
    {
      id: 'step-11-predict-readout',
      stepNumber: 11,
      title: 'Theoretical Expectation: Interference Readout',
      explanation:
        'H → X prepared state |+⟩. The final Hadamard performs constructive interference for |0⟩: H|+⟩ = |0⟩. By contrast, applying readout to Circuit B (X → H → H) would yield |1⟩ because H|−⟩ = |1⟩. The readout gate makes the non-commutativity directly visible in the measurement counts!',
      narrationText:
        'Since the first two gates produce |+⟩, and H|+⟩ = |0⟩, we expect approximately 100% 0 from H → X → H.',
      actions: [
        {
          type: 'explain',
          title: 'Interference to 0',
          message: 'The readout gate converts the phase of |+⟩ into a deterministic 100% 0.',
        },
      ],
      checkpoint: {
        id: 'pred-order-readout',
        prompt: 'Prediction Checkpoint: Interference Readout',
        question: 'Starting from |0⟩, what measurement result will H → X → H produce?',
        options: [
          {
            id: 'opt-0',
            label: 'Approximately 100% 0',
            description: 'Constructive interference for 0 and destructive for 1 (H|+⟩ = |0⟩)',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Approximately 50% 0 and 50% 1',
            description: 'Remains in equal superposition',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Approximately 100% 1',
            description: 'Constructive interference for 1 (H|−⟩ = |1⟩)',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'H → X prepared state |+⟩. The final Hadamard performs constructive interference for |0⟩: H|+⟩ = |0⟩.',
        comparisonRule: (predictionIndex, simResult) => {
          let p0 = 1.0;
          if (simResult?.simulation?.probabilities) {
            p0 = simResult.simulation.probabilities['0'] ?? 1.0;
          } else if (simResult?.simulation?.counts) {
            const c0 = simResult.simulation.counts['0'] || 0;
            const c1 = simResult.simulation.counts['1'] || 0;
            const total = c0 + c1;
            if (total > 0) p0 = c0 / total;
          }
          const isMatch = predictionIndex === 0 && p0 >= 0.85;
          return {
            isMatch,
            userSummary: isMatch
              ? 'Prediction Confirmed: 100% 0 through constructive interference'
              : 'Result Divergence Observed',
            detailedExplanation: isMatch
              ? `The simulation measured ${(p0 * 100).toFixed(0)}% |0⟩, confirming constructive interference.`
              : `Expected ~100% 0, but measured ${(p0 * 100).toFixed(0)}% |0⟩.`,
          };
        },
      },
    },

    // ── STEP 12: Experiment C: Simulate Readout ────────────────────
    {
      id: 'step-12-experiment-c',
      stepNumber: 12,
      title: 'Simulate Readout Circuit (H → X → H)',
      explanation:
        'We execute 500 shots on the readout circuit. The measurement reveals approximately 100% 0, confirming that Circuit A prepared state |+⟩!',
      narrationText:
        'Let us execute 500 shots on the readout circuit and observe the dramatic result.',
      actions: [
        { type: 'run_simulation', shots: 500 },
        { type: 'clear_highlights' },
        { type: 'focus_visualization', panel: 'results' },
        { type: 'show_result' },
        { type: 'compare_prediction' },
      ],
    },

    // ── STEP 13: Your Turn ────────────────────────────────────────
    {
      id: 'step-13-your-turn',
      stepNumber: 13,
      title: 'Your Turn: Test Gate Ordering & Readout',
      explanation:
        'Now experiment yourself! Compare H → X → H (which gives 100% 0) with X → H → H (which gives 100% 1). Verify how gate order directly impacts quantum interference.',
      narrationText:
        'Now it is your turn! Experiment with H → X → H and X → H → H, run the circuits, and compare their outcomes.',
      actions: [{ type: 'clear_highlights' }],
      takeover: {
        taskType: 'free_experiment',
        prompt: 'Your Turn: Test Gate Ordering & Readout',
        goalDescription:
          'Compare H → X → H with X → H → H on wire q[0] and observe their distinct readout measurements.',
        instructions: [
          'Build H → X → H on wire q[0] and run it to observe outcome 0.',
          'Build X → H → H on wire q[0] and run it to observe outcome 1.',
          'Click "Finish Lesson" when ready to proceed.',
        ],
        allowEarlyCompletion: true,
        completionCriteria: {
          type: 'explicit_finish',
        },
      },
    },

    // ── STEP 14: Transfer Checkpoint ──────────────────────────────
    {
      id: 'step-14-transfer',
      stepNumber: 14,
      title: 'Transfer Checkpoint: Non-Commutativity & Measurement',
      explanation:
        'Reflect on what you discovered about gate ordering, quantum state evolution, and measurement bases.',
      narrationText:
        'Here is your final question: Why can two circuits containing the same gates produce different quantum states that look identical in a standard measurement basis?',
      actions: [],
      checkpoint: {
        id: 'pred-order-transfer',
        prompt: 'Transfer Checkpoint',
        question:
          'Why can two circuits containing the same gates produce different quantum states that look identical in a standard measurement basis?',
        options: [
          {
            id: 'opt-0',
            label:
              'Because changing gate order changes relative phase, which does not affect computational-basis probabilities until an interference operation converts phase into bit values.',
            description: 'Relative phase difference between |+⟩ and |−⟩ is revealed via interference',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Because the quantum simulator randomly shuffles gate positions during execution.',
            description: 'Gates execute strictly in chronological sequence',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Because quantum gates always commute and never change the underlying state.',
            description: 'We experimentally verified that quantum gates generally do not commute',
            isCorrect: false,
          },
          {
            id: 'opt-3',
            label: 'Because measurement always occurs before any gates execute on the wire.',
            description: 'Measurement occurs after the gates transform the state',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'Reordering quantum gates produces distinct physical states that can differ in relative phase (such as |+⟩ versus |−⟩). While ordinary computational-basis measurement measures amplitude squared and cannot distinguish them, an interference operation (like a Hadamard readout gate) converts that relative phase difference into a deterministic measurement difference.',
      },
    },

    // ── STEP 15: Complete ─────────────────────────────────────────
    {
      id: 'step-15-complete',
      stepNumber: 15,
      title: 'Lesson Complete: Gate Ordering Mastered',
      explanation:
        'Excellent! You discovered that quantum gates generally do not commute: changing gate order produces different quantum states whose phase difference can be revealed through interference.',
      narrationText:
        'Excellent! You discovered that quantum gates generally do not commute: changing gate order produces different quantum states whose phase difference can be revealed through interference.',
      actions: [
        { type: 'clear_highlights' },
        { type: 'focus_visualization', panel: 'results' },
        { type: 'complete_lesson' },
      ],
    },
  ],
};

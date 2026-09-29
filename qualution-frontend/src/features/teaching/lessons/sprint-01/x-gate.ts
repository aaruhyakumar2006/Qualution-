import type { LessonScript } from '../../types';

export const s1XGateLesson: LessonScript = {
  id: 's1-x-gate',
  title: 'The Pauli-X Gate: Quantum Bit Flip',
  sprint: 1,
  difficulty: 'Beginner',
  estimatedMinutes: 5,
  xpReward: 100,
  curriculumModuleId: 'lesson-1-bit-flip',
  completionMessage:
    'Excellent! You used the Pauli-X gate to flip a qubit and verified that two X gates return it to |0⟩.',
  conceptTags: ['Pauli-X', 'Bit Flip', 'NOT Gate', 'Qubit', 'Involution'],
  learningObjectives: [
    'Understand that Pauli-X acts like a quantum bit flip',
    'Understand X|0⟩ = |1⟩',
    'Predict the measurement result after applying X',
    'Experiment with X in the Quantum Lab',
    'Recognize that applying X twice returns the qubit to |0⟩',
  ],
  prerequisites: ['Basic computational basis state |0⟩', 'Measurement foundations'],
  summary:
    'Discover the Pauli-X gate as the quantum analogue of the classical NOT bit-flip, explore X|0⟩ = |1⟩ through simulation, and verify that X is self-inverse (X·X = I).',
  starterCircuit: {
    qubits: 1,
    classical_bits: 1,
    gates: [],
    measure: true,
    shots: 500,
  },
  steps: [
    // ── STEP 1: Initial State ─────────────────────────────────────
    {
      id: 'step-1-init',
      stepNumber: 1,
      title: 'Initial Ground State |0⟩',
      explanation:
        'The qubit starts in the ground state |0⟩. In this lesson, we will apply the Pauli-X gate. X is often described as the quantum analogue of a classical NOT or bit-flip operation in the computational basis.',
      narrationText:
        'Welcome to Lesson 2. Our qubit begins in ground state |0⟩. We are about to apply the Pauli-X gate, the quantum counterpart of the classical NOT operation.',
      actions: [
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'highlight_qubit', qubitIndex: 0 },
        {
          type: 'explain',
          title: 'Initial State',
          message: 'Qubit 0 is active in state |0⟩ ready for a bit-flip operation.',
        },
      ],
    },

    // ── STEP 2: Introduce X ───────────────────────────────────────
    {
      id: 'step-2-introduce-x',
      stepNumber: 2,
      title: 'Apply Pauli-X Gate',
      explanation:
        'We place a Pauli-X gate onto wire q[0]. Mathematically, X acts on the basis vectors by swapping them: X|0⟩ = |1⟩ and X|1⟩ = |0⟩.',
      narrationText:
        'We now place an X gate on wire q[0]. The X gate flips the state: X applied to |0⟩ produces |1⟩.',
      actions: [
        {
          type: 'add_gate',
          gate: 'x',
          targets: [0],
          column: 0,
          gateId: 'x-gate-demo',
        },
        { type: 'highlight_gate', gateId: 'x-gate-demo', targetQubit: 0, column: 0 },
        {
          type: 'explain',
          title: 'Bit Flip Applied',
          message: 'The X gate rotates the state: X|0⟩ = |1⟩.',
        },
      ],
    },

    // ── STEP 3: Prediction Checkpoint ──────────────────────────────
    {
      id: 'step-3-prediction',
      stepNumber: 3,
      title: 'Theoretical Expectation',
      explanation:
        'Because the X gate flips |0⟩ into |1⟩, measuring the qubit in the computational basis deterministically yields classical bit 1 with 100% probability.',
      narrationText:
        'Before we measure, think about the expectation: the X gate flips |0⟩ to |1⟩, so we expect a 100% probability of measuring 1.',
      actions: [
        {
          type: 'explain',
          title: 'Deterministic Flip',
          message: 'Applying an X gate to |0⟩ produces |1⟩ with 100% certainty.',
        },
      ],
      checkpoint: {
        id: 'pred-x-gate',
        prompt: 'Prediction Checkpoint',
        question:
          'What result do you expect when we measure the qubit after applying an X gate to |0⟩?',
        options: [
          {
            id: 'opt-0',
            label: '100% 0',
            description: 'The state remains unchanged in |0⟩',
            isCorrect: false,
          },
          {
            id: 'opt-1',
            label: '50% 0 / 50% 1',
            description: 'Equal superposition across both states',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: '100% 1',
            description: 'The qubit has been flipped to state |1⟩',
            isCorrect: true,
          },
        ],
        correctOptionIndex: 2,
        explanation:
          'Because the X gate flips |0⟩ into |1⟩, measuring the qubit in the computational basis deterministically yields classical bit 1 with 100% probability.',
        comparisonRule: (predictionIndex, simResult) => {
          let p1 = 1.0;
          if (simResult?.simulation?.probabilities) {
            p1 = simResult.simulation.probabilities['1'] ?? 1.0;
          } else if (simResult?.simulation?.counts) {
            const c0 = simResult.simulation.counts['0'] || 0;
            const c1 = simResult.simulation.counts['1'] || 0;
            const total = c0 + c1;
            if (total > 0) {
              p1 = c1 / total;
            }
          }
          const isMatch = predictionIndex === 2 && p1 >= 0.90;
          return {
            isMatch,
            userSummary: isMatch
              ? 'Prediction Confirmed: 100% Outcome 1 (Bit Flip)'
              : 'Result Divergence Observed',
            detailedExplanation: isMatch
              ? `The simulation measured ${(p1 * 100).toFixed(0)}% |1⟩, confirming the bit flip.`
              : `Expected 100% 1, but measured ${(p1 * 100).toFixed(0)}% |1⟩.`,
          };
        },
      },
    },

    // ── STEP 4: Experiment ────────────────────────────────────────
    {
      id: 'step-4-simulate',
      stepNumber: 4,
      title: 'Execute Simulation on Quantum Backend',
      explanation:
        'The circuit is sent to the quantum simulator to execute across 500 shots.',
      narrationText:
        'Let us run the simulation across 500 shots to observe the empirical outcome.',
      actions: [
        { type: 'run_simulation', shots: 500 },
        { type: 'clear_highlights' },
      ],
    },

    // ── STEP 5: Observe ───────────────────────────────────────────
    {
      id: 'step-5-observe',
      stepNumber: 5,
      title: 'Analyze Measurement Distribution',
      explanation:
        'In the Results histogram, all shots landed on outcome 1, confirming the deterministic bit flip.',
      narrationText:
        'Look at the histogram. All 500 shots resulted in classical bit 1, confirming our prediction.',
      actions: [
        { type: 'focus_visualization', panel: 'results' },
        { type: 'show_result' },
        { type: 'compare_prediction' },
      ],
    },

    // ── STEP 6: Physical Explanation ──────────────────────────────
    {
      id: 'step-6-explain',
      stepNumber: 6,
      title: 'Deterministic Flip vs. Superposition',
      explanation:
        'X maps |0⟩ to |1⟩. Measurement in the computational basis therefore returns 1 with certainty. This is fundamentally different from the Hadamard gate, which creates a superposition of both states.',
      narrationText:
        'Unlike the Hadamard gate which creates superposition, the Pauli-X gate performs a deterministic bit flip.',
      actions: [
        {
          type: 'explain',
          title: 'Quantum NOT Gate',
          message: 'X|0⟩ = |1⟩. The operation is deterministic, not probabilistic.',
        },
      ],
    },

    // ── STEP 7: Your Turn ─────────────────────────────────────────
    {
      id: 'step-7-your-turn',
      stepNumber: 7,
      title: 'Your Turn: Discover Double-X Cancellation',
      explanation:
        'The Quantum Lab is now under your control. Add another X gate right after the first one on wire q[0], and run the circuit to see what happens.',
      narrationText:
        'Now it is your turn! Add another X gate to wire q[0] and run the simulation to see what happens when X is applied twice.',
      actions: [],
      takeover: {
        taskType: 'modify_circuit',
        prompt: 'Add a second X gate to qubit 0',
        goalDescription:
          'Add another X gate to the qubit and predict what will happen when you run the circuit.',
        instructions: [
          'Wire q[0] already has one X gate from our demonstration.',
          'Drag or click an X gate from the palette onto wire q[0] in the second column.',
          'Verify that two X gates now exist on wire q[0].',
          'Run the circuit (Ctrl+Enter) to observe the outcome.',
          'Click "Finish Lesson" to proceed to the reflection checkpoint.',
        ],
        allowEarlyCompletion: false,
        completionCriteria: {
          type: 'circuit_has_gates',
          minGates: 2,
          requiredGates: ['x', 'x'],
          targetQubits: [0],
        },
      },
    },

    // ── STEP 8: Reflection Checkpoint ─────────────────────────────
    {
      id: 'step-8-reflection',
      stepNumber: 8,
      title: 'Assessment: Self-Inverse Property',
      explanation:
        'Think about the algebraic property of applying NOT twice in succession: NOT(NOT(0)) = 0.',
      narrationText:
        'Here is your final question: What should happen after applying the Pauli-X gate twice?',
      actions: [],
      checkpoint: {
        id: 'pred-x-double',
        prompt: 'Reflection Checkpoint',
        question: 'What should happen after applying X twice to |0⟩?',
        options: [
          {
            id: 'opt-0',
            label: 'The qubit returns to |0⟩',
            description: 'X · X = I (identity operator)',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'The qubit remains in |1⟩',
            description: 'The second gate has no effect',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'The qubit becomes an equal superposition',
            description: 'Superposition like a Hadamard gate',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'The Pauli-X gate is its own inverse (unitary and Hermitian, X² = I). Flipping the bit twice (0 ⟶ 1 ⟶ 0) returns the qubit to its initial ground state |0⟩.',
      },
    },

    // ── STEP 9: Complete Lesson ───────────────────────────────────
    {
      id: 'step-9-complete',
      stepNumber: 9,
      title: 'Lesson Completed',
      explanation:
        'Excellent! You used the Pauli-X gate to flip a qubit and verified that two X gates return it to |0⟩.',
      narrationText:
        'Excellent! You used the Pauli-X gate to flip a qubit and verified that two X gates return it to |0⟩.',
      actions: [
        { type: 'complete_lesson' },
      ],
    },
  ],
};

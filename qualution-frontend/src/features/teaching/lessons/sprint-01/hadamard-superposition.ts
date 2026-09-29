import type { LessonScript } from '../../types';

export const s1HadamardSuperpositionLesson: LessonScript = {
  id: 's1-hadamard-superposition',
  title: 'Hadamard Gate & Superposition',
  sprint: 1,
  difficulty: 'Beginner',
  estimatedMinutes: 6,
  xpReward: 150,
  curriculumModuleId: 'lesson-1-superposition',
  completionMessage:
    'Excellent! You predicted, simulated, and explained how the Hadamard gate creates quantum superposition.',
  conceptTags: ['Hadamard', 'Superposition', 'Born Rule', 'Qubit'],
  learningObjectives: [
    'Understand that the Hadamard gate transforms |0⟩ into an equal superposition of |0⟩ and |1⟩',
    'Understand that superposition produces probabilistic measurement outcomes',
    'Predict the measurement distribution before running the circuit',
    'Compare theoretical probability with empirical simulation results',
    'Distinguish superposition from the deterministic behavior of Pauli-X',
  ],
  prerequisites: ['Basic computational basis state |0⟩', 'Measurement foundations'],
  summary:
    'Witness how a quantum computer creates superposition from ground state |0⟩ using the Hadamard gate, and verify the Born rule through live simulation.',
  starterCircuit: {
    qubits: 1,
    classical_bits: 1,
    gates: [],
    measure: true,
    shots: 500,
  },
  steps: [
    // ── STEP 1: Starting State ────────────────────────────────────
    {
      id: 'step-1-init',
      stepNumber: 1,
      title: 'Starting State |0⟩',
      explanation:
        'The qubit begins in the canonical ground state |0⟩. In this lesson, we will apply the Hadamard gate (H) to explore quantum superposition.',
      narrationText:
        'Welcome to Lesson 3. Our qubit starts in the ground state |0⟩. We are about to apply the Hadamard gate to create quantum superposition.',
      actions: [
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        { type: 'reset_circuit' },
        { type: 'highlight_qubit', qubitIndex: 0 },
        {
          type: 'explain',
          title: 'Ground State |0⟩',
          message: 'The qubit starts in the ground state |0⟩. Notice wire q[0] is active.',
        },
      ],
    },

    // ── STEP 2: Apply Hadamard ────────────────────────────────────
    {
      id: 'step-2-apply-hadamard',
      stepNumber: 2,
      title: 'Apply Hadamard Gate (H)',
      explanation:
        'We place a Hadamard gate onto wire q[0]. Conceptually, H transforms |0⟩ into an equal linear superposition: |+⟩ = (|0⟩ + |1⟩) / √2. The qubit now has equal probability amplitudes for outcomes 0 and 1.',
      narrationText:
        'We now place an H gate on wire q[0]. The Hadamard gate rotates |0⟩ into an equal superposition of |0⟩ and |1⟩.',
      actions: [
        { type: 'add_gate', gate: 'h', targets: [0], column: 0, gateId: 'h-gate-demo-1' },
        { type: 'highlight_gate', gateId: 'h-gate-demo-1' },
        {
          type: 'explain',
          title: 'Hadamard Applied',
          message: 'Wire q[0] is now in equal superposition |+⟩ = (|0⟩ + |1⟩) / √2.',
        },
      ],
    },

    // ── STEP 3: Theoretical Expectation ─────────────────────────────
    {
      id: 'step-3-prediction-theory',
      stepNumber: 3,
      title: 'Theoretical Expectation (The Born Rule)',
      explanation:
        'Before measuring or simulating, let us think about what will happen. According to the Born Rule, the measurement probability of state |i⟩ is the squared magnitude of its amplitude. For |+⟩ = (1/√2)|0⟩ + (1/√2)|1⟩, we expect P(0) = |1/√2|² = 1/2 (50%) and P(1) = 1/2 (50%).',
      narrationText:
        'According to the Born Rule, we expect the equal superposition to result in a 50/50 probability distribution between the 0 and 1 states.',
      actions: [
        {
          type: 'explain',
          title: 'The Born Rule',
          message: 'The probability of measuring a state is the absolute square of its amplitude: P(x) = |α|^2.',
        },
      ],
      checkpoint: {
        id: 'pred-hadamard-superposition',
        prompt: 'Prediction Checkpoint',
        question:
          'After applying H to |0⟩, what measurement distribution do you expect to observe?',
        options: [
          {
            id: 'opt-0',
            label: 'Approximately 100% 0',
            description: 'State remains completely deterministic in |0⟩',
            isCorrect: false,
          },
          {
            id: 'opt-1',
            label: 'Approximately 50% 0 and 50% 1',
            description: 'Equal probabilities for both computational basis states',
            isCorrect: true,
          },
          {
            id: 'opt-2',
            label: 'Approximately 100% 1',
            description: 'State is inverted completely into |1⟩ (like an X gate)',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 1,
        explanation:
          'According to the Born rule, the measurement probability of state |i⟩ is the squared magnitude of its amplitude: P(0) = |1/√2|² = 1/2 (50%) and P(1) = |1/√2|² = 1/2 (50%).',
        comparisonRule: (predictionIndex, simResult) => {
          let p0 = 0.5;
          let p1 = 0.5;
          if (simResult?.simulation?.probabilities) {
            p0 = simResult.simulation.probabilities['0'] ?? 0.5;
            p1 = simResult.simulation.probabilities['1'] ?? 0.5;
          } else if (simResult?.simulation?.counts) {
            const c0 = simResult.simulation.counts['0'] || 0;
            const c1 = simResult.simulation.counts['1'] || 0;
            const total = c0 + c1;
            if (total > 0) {
              p0 = c0 / total;
              p1 = c1 / total;
            }
          }
          const isBalanced = Math.abs(p0 - 0.5) < 0.15 && Math.abs(p1 - 0.5) < 0.15;
          const isMatch = predictionIndex === 1 && isBalanced;
          return {
            isMatch,
            userSummary: isMatch
              ? 'Prediction Confirmed: Equal 50/50 Superposition'
              : 'Result Divergence Observed',
            detailedExplanation: isMatch
              ? `The simulation measured approximately ${(p0 * 100).toFixed(0)}% |0⟩ and ${(p1 * 100).toFixed(0)}% |1⟩, confirming equal probability.`
              : `The simulation produced ${(p0 * 100).toFixed(0)}% |0⟩ and ${(p1 * 100).toFixed(0)}% |1⟩, which diverges from your predicted outcome.`,
          };
        },
      },
    },

    // ── STEP 4: Experiment ────────────────────────────────────────
    {
      id: 'step-4-experiment',
      stepNumber: 4,
      title: 'Execute Simulation on Quantum Backend',
      explanation:
        'The circuit is sent to the high-performance quantum simulator to compute state evolution and sampling outcomes across 500 shots.',
      narrationText:
        'Let us execute the simulation across 500 shots on our quantum backend to test your prediction.',
      actions: [
        { type: 'run_simulation', shots: 500 },
      ],
    },

    // ── STEP 5: Observe ───────────────────────────────────────────
    {
      id: 'step-5-observe',
      stepNumber: 5,
      title: 'Analyze Measurement Distribution',
      explanation:
        'The probability histogram displays the relative frequency of measuring basis states |0⟩ and |1⟩ across all shots. Notice that both outcomes occurred with approximately equal probability (~50% each).',
      narrationText:
        'Examine the Results panel. The histogram shows the measurement counts and percentage distribution for basis states |0⟩ and |1⟩.',
      actions: [
        { type: 'focus_visualization', panel: 'results' },
        { type: 'show_result' },
      ],
    },

    // ── STEP 6: Compare ───────────────────────────────────────────
    {
      id: 'step-6-compare',
      stepNumber: 6,
      title: 'Compare Theory vs. Experiment',
      explanation:
        'Theoretical expectation: P(0) = 0.5 and P(1) = 0.5. Notice how both bars are approximately equal height (~50%). Statistical sampling fluctuations in a 500-shot run can produce results like 48%/52% or 51%/49% rather than exactly 50/50.',
      narrationText:
        'Comparing your prediction with the simulation: the outcomes show balanced bars at approximately 50% each.',
      actions: [
        { type: 'compare_prediction' },
      ],
    },

    // ── STEP 7: Explain Superposition ─────────────────────────────
    {
      id: 'step-7-explain-superposition',
      stepNumber: 7,
      title: 'What Superposition Really Means',
      explanation:
        'H does not randomly choose 0 or 1 before measurement in the classical sense. It creates a genuine quantum superposition. Measurement produces a classical result according to the probability amplitudes.',
      narrationText:
        'The Hadamard gate does not secretly choose an outcome beforehand. It creates a true superposition that only collapses upon measurement.',
      actions: [
        {
          type: 'explain',
          title: 'What Superposition Means',
          message:
            'H transforms |0⟩ into (|0⟩ + |1⟩)/√2. The probability of measuring each outcome is 1/2 (50%).',
        },
      ],
    },

    // ── STEP 8: Your Turn ─────────────────────────────────────────
    {
      id: 'step-8-learner-turn',
      stepNumber: 8,
      title: 'Your Turn: Hands-on Experimentation',
      explanation:
        'The Quantum Lab is now under your complete control. Experiment with the circuit. Try removing H, adding H again, and observe how the measurement distribution changes.',
      narrationText:
        'Now it is your turn! The Quantum Lab is under your control. Experiment with the circuit freely.',
      actions: [],
      takeover: {
        taskType: 'free_experiment',
        prompt: 'Explore Superposition & Interference',
        goalDescription:
          'Experiment with the circuit. Try removing H, adding H again, and observe how the measurement distribution changes.',
        instructions: [
          'Wire q[0] currently has one H gate creating equal superposition.',
          'Try adding a second H gate on wire q[0] to observe quantum interference (H·H = I).',
          'Run the simulation again (Ctrl+Enter) to verify the outcome.',
          'When you are satisfied with your experimentation, click "Finish Lesson" to proceed to the reflection checkpoint.',
        ],
        allowEarlyCompletion: true,
        completionCriteria: {
          type: 'explicit_finish',
        },
      },
    },

    // ── STEP 9: Assessment (Conceptual Understanding) ─────────────────────────
    {
      id: 'step-9-transfer-checkpoint',
      stepNumber: 9,
      title: 'Assessment: Conceptual Understanding',
      explanation:
        'Reflect on the physical transformation produced by the Hadamard gate compared to deterministic gates like Pauli-X.',
      narrationText:
        'Here is your final question: Which statement best describes the effect of H on |0⟩?',
      actions: [],
      checkpoint: {
        id: 'pred-hadamard-transfer',
        prompt: 'Transfer Checkpoint',
        question: 'Which statement best describes the effect of H on |0⟩?',
        options: [
          {
            id: 'opt-0',
            label: 'It deterministically flips |0⟩ to |1⟩.',
            description: 'That is the behavior of the Pauli-X gate.',
            isCorrect: false,
          },
          {
            id: 'opt-1',
            label:
              'It creates an equal superposition whose computational-basis measurements are approximately 50/50.',
            description: 'Transforms |0⟩ into equal probability amplitudes for 0 and 1.',
            isCorrect: true,
          },
          {
            id: 'opt-2',
            label: 'It leaves the qubit unchanged.',
            description: 'That is the identity operator.',
            isCorrect: false,
          },
          {
            id: 'opt-3',
            label: "It removes the qubit's quantum state.",
            description: 'State evolution is unitary and norm-preserving.',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 1,
        explanation:
          'The Hadamard gate creates an equal superposition (|0⟩ + |1⟩)/√2 from ground state |0⟩, yielding ~50% probability for 0 and ~50% probability for 1 upon measurement.',
      },
    },

    // ── STEP 10: Complete Lesson ──────────────────────────────────
    {
      id: 'step-10-complete',
      stepNumber: 10,
      title: 'Lesson Completed: Superposition Mastered',
      explanation:
        'Excellent! You predicted, simulated, and explained how the Hadamard gate creates quantum superposition.',
      narrationText:
        'Excellent! You predicted, simulated, and explained how the Hadamard gate creates quantum superposition.',
      actions: [
        { type: 'complete_lesson' },
      ],
    },
  ],
};

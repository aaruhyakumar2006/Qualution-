import type { LessonScript } from '../../types';

export const s1InitializeMeasureLesson: LessonScript = {
  id: 's1-initialize-measure',
  title: 'Initialize & Measure a Qubit',
  sprint: 1,
  difficulty: 'Beginner',
  estimatedMinutes: 4,
  xpReward: 100,
  curriculumModuleId: 'lesson-1-initialize-measure',
  completionMessage: 'You verified your first quantum measurement: an initialized qubit produces 0 in the computational basis.',
  conceptTags: ['Qubit', 'Ground State', 'Measurement', 'Computational Basis'],
  learningObjectives: [
    'Understand that a freshly initialized qubit is in |0⟩ by default in the practical lab',
    'Understand that |0⟩ is a computational-basis state',
    'Understand that computational-basis measurement of |0⟩ produces classical outcome 0',
    'Predict measurement outcomes for an unperturbed ground state',
    'Observe deterministic measurement distributions in an ideal quantum simulator',
  ],
  prerequisites: ['Basic familiarity with binary 0 and 1'],
  summary:
    'Learn how a qubit is initialized to |0⟩ by default and verify that computational-basis measurement of |0⟩ produces 0 with deterministic certainty in an ideal simulator.',
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
      title: 'Default Ground State |0⟩',
      explanation:
        'In quantum computing, every qubit is initialized to the ground state |0⟩ by default in the practical lab. This state is a fundamental computational-basis state. When we perform a measurement, we ask the quantum system to reveal a classical result.',
      narrationText:
        'Welcome to your first practical lesson. In our quantum lab, every qubit is initialized to the canonical ground state |0⟩ by default.',
      actions: [
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        {
          type: 'explain',
          title: 'Ground State |0⟩',
          message:
            'A fresh quantum circuit starts with all qubits in the |0⟩ ground state.',
        },
      ],
    },

    // ── STEP 2: Show the Initial Circuit ──────────────────────────
    {
      id: 'step-2-inspect-circuit',
      stepNumber: 2,
      title: 'Inspect Qubit Wire q[0]',
      explanation:
        'Notice wire q[0] on the circuit canvas. It represents a single qubit initialized to |0⟩. There are no quantum gates applied to it yet.',
      narrationText:
        'Look at wire q[0]. It represents our initialized qubit, resting in computational basis state |0⟩ without any gates applied.',
      actions: [
        { type: 'highlight_qubit', qubitIndex: 0 },
        {
          type: 'explain',
          title: 'Qubit Wire q[0]',
          message: 'Wire q[0] is active and ready. Notice there are no gates placed yet.',
        },
      ],
    },

    // ── STEP 3: Theoretical Expectation ─────────────────────────────
    {
      id: 'step-3-prediction-theory',
      stepNumber: 3,
      title: 'Theoretical Expectation',
      explanation:
        'Before running the simulation, let us think about what classical measurement result we expect when measuring this unperturbed qubit. State |0⟩ is an eigenstate of computational-basis measurement. Without gates like H or X to perturb it, measuring |0⟩ yields classical bit 0 with 100% probability.',
      narrationText:
        'Before we simulate, let us think about the expected result. Since the qubit is unperturbed in state |0⟩, we expect it to measure as 0 with 100% probability.',
      actions: [
        {
          type: 'explain',
          title: 'Deterministic Outcome',
          message: 'An unperturbed qubit in |0⟩ yields classical bit 0 with 100% probability.',
        },
      ],
      checkpoint: {
        id: 'pred-init-measure',
        prompt: 'Prediction Checkpoint',
        question: 'What result do you expect when we measure an unperturbed initialized qubit?',
        options: [
          {
            id: 'opt-0',
            label: '100% 0',
            description: 'The qubit stays deterministically in |0⟩, yielding classical bit 0',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: '50% 0 / 50% 1',
            description: 'Random distribution across both binary outcomes',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: '100% 1',
            description: 'The qubit flips to state |1⟩',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'State |0⟩ is an eigenstate of computational-basis measurement. Without gates like H or X to perturb it, measuring |0⟩ yields classical bit 0 with 100% probability.',
        comparisonRule: (predictionIndex, simResult) => {
          let p0 = 1.0;
          if (simResult?.simulation?.probabilities) {
            p0 = simResult.simulation.probabilities['0'] ?? 1.0;
          } else if (simResult?.simulation?.counts) {
            const c0 = simResult.simulation.counts['0'] || 0;
            const c1 = simResult.simulation.counts['1'] || 0;
            const total = c0 + c1;
            if (total > 0) {
              p0 = c0 / total;
            }
          }
          const isMatch = predictionIndex === 0 && p0 >= 0.90;
          return {
            isMatch,
            userSummary: isMatch
              ? 'Prediction Confirmed: Deterministic Ground State |0⟩'
              : 'Result Divergence Observed',
            detailedExplanation: isMatch
              ? `The simulation measured ${(p0 * 100).toFixed(0)}% |0⟩, confirming ground-state measurement.`
              : `Expected 100% 0 for state |0⟩, but measured ${(p0 * 100).toFixed(0)}% |0⟩.`,
          };
        },
      },
    },

    // ── STEP 4: Run Experiment ─────────────────────────────────────
    {
      id: 'step-4-simulate',
      stepNumber: 4,
      title: 'Execute Simulation on Quantum Backend',
      explanation:
        'Now we simulate the measurement of qubit q[0] across 500 shots using the quantum simulation backend.',
      narrationText:
        'Let us execute the simulation across 500 shots to test your prediction.',
      actions: [
        { type: 'run_simulation', shots: 500 },
      ],
    },

    // ── STEP 5: Observe & Compare Result ───────────────────────────
    {
      id: 'step-5-observe-compare',
      stepNumber: 5,
      title: 'Analyze Measurement Distribution',
      explanation:
        'In an ideal quantum simulator, measuring |0⟩ produces 100% 0 with zero probability for outcome 1.',
      narrationText:
        'Look at the histogram. All shots resulted in classical bit 0, confirming our prediction.',
      actions: [
        { type: 'focus_visualization', panel: 'results' },
        { type: 'show_result' },
        { type: 'compare_prediction' },
      ],
    },

    // ── STEP 6: Physical Explanation ──────────────────────────────
    {
      id: 'step-6-physics-explanation',
      stepNumber: 6,
      title: 'Computational Basis Eigenstate',
      explanation:
        'Why did this happen? |0⟩ is an eigenstate of computational-basis measurement. Because no gates (such as Hadamard or Pauli-X) were applied, the state remained pure |0⟩. Measurement therefore reveals classical bit 0 with certainty.',
      narrationText:
        'Because no gates were applied, our qubit remained undisturbed in state |0⟩, yielding classical bit 0 with absolute certainty.',
      actions: [
        {
          type: 'explain',
          title: 'Basis State |0⟩',
          message:
            'Measuring an unperturbed |0⟩ qubit deterministically outputs 0 in the computational basis.',
        },
      ],
    },

    // ── STEP 7: Learner Turn ───────────────────────────────────────
    {
      id: 'step-7-learner-turn',
      stepNumber: 7,
      title: 'Your Turn: Hands-on Verification',
      explanation:
        'The Quantum Lab is now under your control. Run the circuit yourself to verify that the qubit produces 0, or inspect the state panels.',
      narrationText:
        'Now it is your turn! Run the circuit yourself in the Quantum Lab to verify that the qubit produces 0.',
      actions: [],
      takeover: {
        taskType: 'free_experiment',
        prompt: 'Run the Circuit in Quantum Lab',
        goalDescription: 'Run the circuit yourself and verify that the qubit produces 0.',
        instructions: [
          'Notice the single-qubit circuit initialized to |0⟩.',
          'Click the "Run" button (or press Ctrl+Enter) to simulate the circuit yourself.',
          'Confirm that the measurement histogram shows 100% outcome 0.',
          'Click "Finish Lesson" when you have verified the measurement.',
        ],
        allowEarlyCompletion: true,
        completionCriteria: {
          type: 'any_of',
          criteria: [
            { type: 'explicit_finish' },
            {
              type: 'simulation_probability',
              state: '0',
              minProbability: 0.95,
            },
          ],
        },
      },
    },

    // ── STEP 8: Complete Lesson ────────────────────────────────────
    {
      id: 'step-8-complete',
      stepNumber: 8,
      title: 'Lesson Completed',
      explanation:
        'You verified your first quantum measurement: an initialized qubit produces 0 in the computational basis.',
      narrationText:
        'Congratulations! You verified your first quantum measurement: an initialized qubit produces 0 in the computational basis.',
      actions: [
        { type: 'complete_lesson' },
      ],
    },
  ],
};

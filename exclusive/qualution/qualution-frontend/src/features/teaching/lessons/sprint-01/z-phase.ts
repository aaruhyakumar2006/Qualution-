import type { LessonScript } from '../../types';

export const s1ZPhaseLesson: LessonScript = {
  id: 's1-z-phase',
  title: 'Z Gate: Understanding Quantum Phase',
  sprint: 1,
  difficulty: 'Beginner',
  estimatedMinutes: 6,
  xpReward: 150,
  curriculumModuleId: 'lesson-1-phase',
  completionMessage:
    'Excellent! You explored the difference between bit value and quantum phase, and saw how phase can become observable through interference.',
  conceptTags: ['Pauli-Z', 'Phase Flip', 'Relative Phase', 'Interference', 'Hadamard'],
  learningObjectives: [
    'Understand that the Pauli-Z gate applies a phase flip',
    'Understand Z|0⟩ = |0⟩ and Z|1⟩ = -|1⟩',
    'Understand that phase can exist without changing computational-basis measurement probabilities',
    'Predict what happens when Z is applied to |0⟩',
    'Explore why phase becomes observable when combined with another gate such as H',
    'Distinguish bit flip from phase flip',
  ],
  prerequisites: ['Computational basis states |0⟩ and |1⟩', 'Hadamard Gate & Superposition'],
  summary:
    'Explore the Pauli-Z phase-flip gate, learn why phase does not change measurement on basis states, and discover how interference in an H-Z-H circuit makes phase directly observable.',
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
        'The qubit begins in the canonical ground state |0⟩. In this lesson, we will apply the Pauli-Z gate to explore quantum phase and its physical consequences.',
      narrationText:
        'Welcome to Lesson 4. Our qubit starts in the ground state |0⟩. We are going to apply the Pauli-Z gate to investigate quantum phase.',
      actions: [
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'highlight_qubit', qubitIndex: 0 },
        {
          type: 'explain',
          title: 'Initial State',
          message: 'Wire q[0] is initialized in ground state |0⟩ ready for Pauli-Z.',
        },
      ],
    },

    // ── STEP 2: Apply Z ───────────────────────────────────────────
    {
      id: 'step-2-apply-z',
      stepNumber: 2,
      title: 'Apply Pauli-Z Gate',
      explanation:
        'We place a Pauli-Z gate onto wire q[0]. Mathematically, Z leaves |0⟩ unchanged while flipping the phase of |1⟩: Z|0⟩ = |0⟩ and Z|1⟩ = -|1⟩. The minus sign represents a phase change, not a change into another computational basis state.',
      narrationText:
        'We now place a Z gate on wire q[0]. Notice that Z leaves |0⟩ unchanged: Z|0⟩ = |0⟩, but flips the phase of |1⟩: Z|1⟩ = -|1⟩.',
      actions: [
        {
          type: 'add_gate',
          gate: 'z',
          targets: [0],
          column: 0,
          gateId: 'z-gate-demo-1',
        },
        { type: 'highlight_gate', gateId: 'z-gate-demo-1', targetQubit: 0, column: 0 },
        {
          type: 'explain',
          title: 'Pauli-Z Applied',
          message: 'Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩. Z alters phase, not the computational value of |0⟩.',
        },
      ],
    },

    // ── STEP 3: Theoretical Expectation (Z on |0⟩) ──────────────────
    {
      id: 'step-3-prediction-z0',
      stepNumber: 3,
      title: 'Z Gate Hypothesis: Ground State Invariance |0⟩',
      explanation:
        'The Z gate applies a relative phase of -1 to |1⟩: Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩. When applied to |0⟩, it introduces no phase shift at all.',
      narrationText:
        'Now consider the expected outcome: since Z leaves state |0⟩ unchanged, measuring this circuit will yield 100% |0⟩ with zero bit flips.',
      actions: [
        {
          type: 'explain',
          title: 'Unchanged State',
          message: 'Because Z|0⟩ = |0⟩, measuring the qubit in the computational basis deterministically yields classical bit 0 with 100% probability.',
        },
      ],
      checkpoint: {
        id: 'pred-z-phase-zero',
        prompt: 'Prediction Checkpoint 1',
        question: 'What measurement result do you expect after applying Z to |0⟩?',
        options: [
          {
            id: 'opt-0',
            label: '100% 0',
            description: 'Z leaves |0⟩ completely unchanged',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: '50% 0 and 50% 1',
            description: 'Creates an equal superposition like Hadamard',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: '100% 1',
            description: 'Flips the bit completely like a Pauli-X gate',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'Because Z|0⟩ = |0⟩, the qubit remains in state |0⟩. Measuring in the computational basis deterministically yields classical bit 0 with 100% probability.',
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
              ? 'Confirmed: Z on |0⟩ preserves the state with 100% outcome 0'
              : 'Result Divergence Observed',
            detailedExplanation: isMatch
              ? `The simulation measured ${(p0 * 100).toFixed(0)}% |0⟩, confirming that Z|0⟩ = |0⟩.`
              : `Expected 100% 0 since Z leaves |0⟩ unchanged, but measured ${(p0 * 100).toFixed(0)}% |0⟩.`,
          };
        },
      },
    },

    // ── STEP 4: Experiment (Circuit A) ────────────────────────────
    {
      id: 'step-4-experiment-z0',
      stepNumber: 4,
      title: 'Simulate Circuit A (Z on |0⟩)',
      explanation:
        'The circuit with a single Z gate on |0⟩ is simulated across 500 shots to measure the basis distribution.',
      narrationText:
        'Let us execute 500 shots on the quantum backend to verify the measurement result.',
      actions: [
        { type: 'run_simulation', shots: 500 },
        { type: 'clear_highlights' },
      ],
    },

    // ── STEP 5: Observe (Circuit A) ───────────────────────────────
    {
      id: 'step-5-observe-z0',
      stepNumber: 5,
      title: 'Analyze Measurement Distribution',
      explanation:
        'In the Results panel, 100% of the shots measured outcome 0. The computational-basis distribution is identical to an un-gated initialized qubit.',
      narrationText:
        'Examine the Results panel. Every single measurement returned 0, just as predicted.',
      actions: [
        { type: 'focus_visualization', panel: 'results' },
        { type: 'show_result' },
        { type: 'compare_prediction' },
      ],
    },

    // ── STEP 6: Explain the Important Distinction ─────────────────
    {
      id: 'step-6-explain-distinction',
      stepNumber: 6,
      title: 'Phase vs. Computational Measurement',
      explanation:
        'Z leaves |0⟩ unchanged, but changes the phase of |1⟩: Z|1⟩ = -|1⟩. Standard computational-basis measurement measures amplitude squared (|α|² and |β|²), which does not directly reveal a phase sign on an eigenstate. Does this mean Z has no effect? No! Phase becomes observable through interference when qubits are in a superposition.',
      narrationText:
        'Z leaves |0⟩ unchanged, but flips the phase of |1⟩. While a phase sign alone cannot be seen when measuring |0⟩, it becomes crucial in a superposition.',
      actions: [
        {
          type: 'explain',
          title: 'Phase vs Bit Flip',
          message: 'Z does not change bit probabilities of |0⟩. Its physical power emerges through quantum interference.',
        },
      ],
    },

    // ── STEP 7: Phase Becomes Interesting (Circuit B) ─────────────
    {
      id: 'step-7-setup-hzh',
      stepNumber: 7,
      title: 'Experiment B: Revealing Phase with H → Z → H',
      explanation:
        'Now we demonstrate why phase matters using the H → Z → H sequence: 1) The first H creates equal superposition (|0⟩ + |1⟩)/√2. 2) Z flips the relative phase of the |1⟩ component, producing (|0⟩ - |1⟩)/√2 (state |-⟩). 3) The second H acts as an interferometer, converting that relative phase difference into constructive interference for |1⟩!',
      narrationText:
        'Now let us see phase in action! We build an H-Z-H sequence. H creates superposition, Z flips the relative phase, and the second H converts that phase into a measurable bit flip.',
      actions: [
        { type: 'reset_circuit' },
        { type: 'clear_highlights' },
        { type: 'initialize_qubits', qubits: 1, classicalBits: 1 },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 0,
          gateId: 'hzh-h1',
        },
        {
          type: 'add_gate',
          gate: 'z',
          targets: [0],
          column: 1,
          gateId: 'hzh-z',
        },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 2,
          gateId: 'hzh-h2',
        },
        { type: 'highlight_gate', gateId: 'hzh-z', targetQubit: 0, column: 1 },
        {
          type: 'explain',
          title: 'Interference Sequence',
          message: 'H creates |+⟩, Z transforms it to |-⟩, and the final H rotates |-⟩ into |1⟩.',
        },
      ],
    },

    // ── STEP 8: Theoretical Expectation (H → Z → H) ──────────
    {
      id: 'step-8-prediction-hzh',
      stepNumber: 8,
      title: 'Phase Interference Hypothesis: H → Z → H',
      explanation:
        'Sandwiched between Hadamards, the Z gate inverts quantum phase interference. H|0⟩ = |+⟩. Z|+⟩ = |-⟩ = (|0⟩ - |1⟩)/√2. Finally, H|-⟩ = |1⟩.',
      narrationText:
        'Notice the fascinating effect of quantum phase interference: sandwiched between Hadamards, the phase flip inverts the interference, transforming |0⟩ into approximately 100% |1⟩.',
      actions: [
        {
          type: 'explain',
          title: 'Constructive Interference',
          message: 'The relative phase flip introduced by Z causes destructive interference for outcome 0 and constructive interference for outcome 1!',
        },
      ],
      checkpoint: {
        id: 'pred-z-phase-hzh',
        prompt: 'Prediction Checkpoint 2',
        question: 'Starting from |0⟩, what should H → Z → H produce when measured?',
        options: [
          {
            id: 'opt-0',
            label: 'Approximately 100% 0',
            description: 'Phase had no effect, identical to H · H = I',
            isCorrect: false,
          },
          {
            id: 'opt-1',
            label: 'Approximately 50% 0 and 50% 1',
            description: 'Remains in equal balanced superposition',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Approximately 100% 1',
            description: 'The relative phase flip interfered destructively for 0 and constructively for 1',
            isCorrect: true,
          },
        ],
        correctOptionIndex: 2,
        explanation:
          'H|0⟩ = |+⟩. Z|+⟩ = |-⟩ = (|0⟩ - |1⟩)/√2. Finally, H|-⟩ = |1⟩. The relative phase flip introduced by Z causes destructive interference for outcome 0 and constructive interference for outcome 1!',
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
          const isMatch = predictionIndex === 2 && p1 >= 0.85;
          return {
            isMatch,
            userSummary: isMatch
              ? 'Outstanding: As predicted, the H-Z-H sequence caused destructive interference on 0 and constructive interference on 1!'
              : 'Result Divergence Observed',
            detailedExplanation: isMatch
              ? `The simulation measured ${(p1 * 100).toFixed(0)}% |1⟩, confirming phase interference.`
              : `Expected ~100% 1 from interference, but observed ${(p1 * 100).toFixed(0)}% |1⟩.`,
          };
        },
      },
    },

    // ── STEP 9: Experiment & Observe (Circuit B) ───────────────────
    {
      id: 'step-9-experiment-hzh',
      stepNumber: 9,
      title: 'Simulate Experiment B & Observe Interference',
      explanation:
        'Simulation executes across 500 shots. In the Results panel, 100% of shots yield outcome 1! Without the Z gate, H-H would yield 0. The single Z gate flipped the relative phase, completely reversing the interference outcome from 0 to 1.',
      narrationText:
        'Look at the result: 100% outcome 1! Without the Z gate, H-H would yield 0. The Z gate inserted a relative phase that completely reversed the interference.',
      actions: [
        { type: 'run_simulation', shots: 500 },
        { type: 'clear_highlights' },
        { type: 'focus_visualization', panel: 'results' },
        { type: 'show_result' },
        { type: 'compare_prediction' },
      ],
    },

    // ── STEP 10: Your Turn ────────────────────────────────────────
    {
      id: 'step-10-learner-turn',
      stepNumber: 10,
      title: 'Your Turn: Hands-on Phase & Interference',
      explanation:
        'The Quantum Lab is now under your full control. Experiment with Z. Compare the circuits Z and H → Z → H and observe how their measurement behavior differs.',
      narrationText:
        'Now it is your turn! Experiment with Z and H gates freely. Try removing the Z gate from H-Z-H and observe how the distribution flips.',
      actions: [],
      takeover: {
        taskType: 'free_experiment',
        prompt: 'Experiment with Z and Quantum Phase',
        goalDescription:
          'Experiment with Z. Compare the circuits Z and H → Z → H and observe how their measurement behavior differs.',
        instructions: [
          'The circuit currently has H → Z → H producing 100% 1.',
          'Try removing the Z gate and re-running (Ctrl+Enter) to observe H·H = I producing 100% 0.',
          'Try building just a single Z gate on wire q[0] and verifying that Z|0⟩ = |0⟩.',
          'When you are satisfied with your experimentation, click "Finish Lesson" to proceed to the reflection checkpoint.',
        ],
        allowEarlyCompletion: true,
        completionCriteria: {
          type: 'explicit_finish',
        },
      },
    },

    // ── STEP 11: Transfer Checkpoint ──────────────────────────────
    {
      id: 'step-11-transfer',
      stepNumber: 11,
      title: 'Transfer Checkpoint: Conceptual Understanding',
      explanation:
        'Reflect on why the phase flip of Z is fundamental to quantum algorithms.',
      narrationText:
        'Here is your final question: Why can applying Z to |0⟩ leave the measurement result unchanged?',
      actions: [],
      checkpoint: {
        id: 'pred-z-phase-transfer',
        prompt: 'Transfer Checkpoint',
        question: 'Why can applying Z to |0⟩ leave the measurement result unchanged?',
        options: [
          {
            id: 'opt-0',
            label:
              'Because Z leaves |0⟩ unchanged; its phase effect becomes important when relative phase exists in a superposition',
            description: 'Z|0⟩ = |0⟩ and Z|1⟩ = -|1⟩; phase shifts become observable through interference.',
            isCorrect: true,
          },
          {
            id: 'opt-1',
            label: 'Z always flips 0 to 1 like a classical NOT gate.',
            description: 'That is the behavior of the Pauli-X gate.',
            isCorrect: false,
          },
          {
            id: 'opt-2',
            label: 'Z creates an equal 50/50 superposition across computational basis states.',
            description: 'That is the behavior of the Hadamard gate.',
            isCorrect: false,
          },
          {
            id: 'opt-3',
            label: "Z removes the qubit's quantum state from the circuit.",
            description: 'State evolution is unitary and norm-preserving.',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 0,
        explanation:
          'Z acts as a phase flip: Z|0⟩ = |0⟩ with zero phase shift, while Z|1⟩ = -|1⟩. Because |0⟩ is an eigenstate with eigenvalue +1, its computational-basis measurement is identical. The phase flip on |1⟩ only affects measurement when both states are present in superposition, producing quantum interference.',
      },
    },

    // ── STEP 12: Complete Lesson ──────────────────────────────────
    {
      id: 'step-12-complete',
      stepNumber: 12,
      title: 'Lesson Completed: Phase Mastered',
      explanation:
        'Excellent! You explored the difference between bit value and quantum phase, and saw how phase can become observable through interference.',
      narrationText:
        'Excellent! You explored the difference between bit value and quantum phase, and saw how phase can become observable through interference.',
      actions: [
        { type: 'complete_lesson' },
      ],
    },
  ],
};

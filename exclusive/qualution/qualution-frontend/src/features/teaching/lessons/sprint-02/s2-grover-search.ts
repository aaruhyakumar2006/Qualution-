import type { LessonScript } from '../../types';

export const s2GroverSearchLesson: LessonScript = {
  id: 's2-grover-search',
  title: "Grover's Search Algorithm (2-Qubit)",
  sprint: 2,
  difficulty: 'Advanced',
  estimatedMinutes: 10,
  xpReward: 300,
  curriculumModuleId: 'lesson-9-grover-search',
  completionMessage:
    "Congratulations! You implemented and mastered Grover's quantum search algorithm, achieving quadratic speedup by amplifying the marked target state probability amplitude to 100%.",
  conceptTags: ['Grover Search', 'Oracle', 'Amplitude Amplification', 'Diffuser', 'Quantum Speedup'],
  learningObjectives: [
    'Understand how an Oracle flips the phase of the target marked item |11⟩',
    'Understand why measurement probabilities remain 25% after phase inversion alone',
    'Understand how the Grover Diffuser reflects amplitudes about the average mean',
    'Observe amplitude amplification boosting target probability from 25% to 100% in a single query',
    'Compare classical O(N) unstructured search vs quantum O(√N) quadratic speedup',
  ],
  prerequisites: ['Bell State & Entanglement', 'Phase Kickback', 'Hadamard Superposition'],
  summary:
    "Master Grover's Search Algorithm on 2 qubits to locate marked item |11⟩ in a single query with 100% probability using Oracle phase inversion and Amplitude Amplification.",
  starterCircuit: {
    qubits: 2,
    classical_bits: 2,
    gates: [],
    measure: true,
    shots: 1000,
  },
  steps: [
    // ── STEP 1: Introduction ──────────────────────────────────────
    {
      id: 'step-1-introduction',
      stepNumber: 1,
      title: "Introduction: The Power of Quantum Search",
      explanation:
        "Grover's Algorithm searches an unsorted database of N items in O(√N) queries, delivering a quadratic speedup over classical algorithms that require O(N) queries.",
      narrationText:
        "Welcome to the Grover's Algorithm Masterclass. In classical computing, searching an unsorted database of N items requires scanning item by item, taking order N queries. Grover's quantum search finds the target in only order square root of N queries, achieving a provable quadratic speedup. Today, you will watch the quantum circuit build, transform, and amplify the target state before your eyes.",
      actions: [
        { type: 'initialize_qubits', qubits: 2, classicalBits: 2 },
        { type: 'reset_circuit' },
        { type: 'focus_visualization', panel: 'state' },
        {
          type: 'explain',
          title: "Quantum Search & Grover's Algorithm",
          message:
            "Grover's Algorithm searches an unsorted database of N items in O(√N) queries, delivering a quadratic speedup over classical O(N) search.",
        },
      ],
    },

    // ── STEP 2: Problem Definition ────────────────────────────────
    {
      id: 'step-2-problem',
      stepNumber: 2,
      title: "The Problem: Locating Marked State |11⟩",
      explanation:
        "With 2 qubits, we encode N = 2² = 4 possible database entries: |00⟩, |01⟩, |10⟩, and our marked target item |11⟩. A classical computer requires up to 4 queries to find it.",
      narrationText:
        "Let's define our database. With two qubits, we encode four possible entries: |00⟩, |01⟩, |10⟩, and our marked target item |11⟩. A classical computer would have to test up to four entries to find it. Grover's algorithm will isolate it with 100% certainty in a single quantum query.",
      actions: [
        { type: 'focus_visualization', panel: 'state' },
        {
          type: 'explain',
          title: "Database Representation",
          message:
            "With 2 qubits, we encode N = 4 entries: |00⟩, |01⟩, |10⟩, and target |11⟩. Classical search takes up to 4 checks; quantum search needs only 1 query.",
        },
      ],
    },

    // ── STEP 3: Theoretical Expectation ────────────────────────────
    {
      id: 'step-3-prediction',
      stepNumber: 3,
      title: 'Prediction: Quantum vs Classical Queries',
      explanation:
        "For N = 4 (2 qubits), the required number of Grover iterations is R ≈ (π/4)√4 = π/2 ≈ 1 iteration. Grover algorithm finds the marked item in exactly one single query!",
      narrationText:
        "Before we place our first quantum gate, consider how many oracle queries Grover's algorithm will require. For a 4-item database, it isolates the target with 100% certainty in a single quantum query due to constructive quantum interference.",
      actions: [
        {
          type: 'explain',
          title: 'Single Query Speedup',
          message: 'Grover algorithm finds the marked item in exactly one single query, compared to a classical worst-case of 4 queries.',
        },
      ],
      checkpoint: {
        id: 'pred-grover-queries',
        prompt: 'Prediction Checkpoint',
        question:
          'In an unsorted database of N = 4 items (2 qubits), how many queries does Grover quantum search need to isolate the marked target with 100% certainty?',
        options: [
          {
            id: 'opt-classical',
            label: '4 queries (must check every possibility)',
            description: 'Classical worst-case search',
            isCorrect: false,
          },
          {
            id: 'opt-quantum',
            label: '1 single query (due to constructive quantum interference)',
            description: 'Perfect amplitude amplification in a single iteration',
            isCorrect: true,
          },
          {
            id: 'opt-average',
            label: '2 queries on average',
            description: 'Classical average-case search',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 1,
        explanation:
          'For N = 4 (2 qubits), the required number of Grover iterations is R ≈ (π/4)√4 = π/2 ≈ 1 iteration. Grover algorithm finds the marked item in exactly one single query!',
      },
    },

    // ── STEP 4: Gate Placement (Equal Superposition) ──────────────
    {
      id: 'step-4-gate-placement',
      stepNumber: 4,
      title: "Equal Superposition (H Gates on q0 & q1)",
      explanation:
        "Applying Hadamard gates to both qubits creates an equal superposition: |s⟩ = 1/2 (|00⟩ + |01⟩ + |10⟩ + |11⟩). Every state has an equal 25% probability.",
      narrationText:
        "We begin by placing Hadamard gates on both qubits. This prepares an equal superposition state |s⟩, spreading probability equally across all four computational basis states: 00, 01, 10, and 11.",
      actions: [
        { type: 'add_gate', gate: 'h', targets: [0], column: 0, gateId: 'grover-h0' },
        { type: 'add_gate', gate: 'h', targets: [1], column: 0, gateId: 'grover-h1' },
        { type: 'run_simulation', shots: 1000 },
        {
          type: 'explain',
          title: "Equal Superposition Prepared",
          message:
            "State |s⟩ = 1/2 (|00⟩ + |01⟩ + |10⟩ + |11⟩). Every basis state has equal probability amplitude +1/2 and 25% probability.",
        },
      ],
    },







    // ── STEP 5: Oracle Construction (Grover Step) ──────────────────
    {
      id: 'step-5-oracle',
      stepNumber: 5,
      title: "The Quantum Oracle: Phase Inversion on Target |11⟩",
      explanation:
        "The Controlled-Z (CZ) gate acts as the Oracle U_ω = I - 2|11⟩⟨11|. It marks target state |11⟩ by flipping its amplitude from +1/2 to -1/2.",
      narrationText:
        "Next, we apply the Quantum Oracle. A Controlled-Z gate flips the phase of our marked target state 11 from positive one-half to negative one-half. The oracle marks the item not by flipping bits, but by inverting its quantum phase.",
      actions: [
        { type: 'add_gate', gate: 'cz', targets: [0, 1], column: 1, gateId: 'grover-oracle-cz' },
        { type: 'highlight_gate', gateId: 'grover-oracle-cz' },
        { type: 'run_simulation', shots: 1000 },
        {
          type: 'explain',
          title: "Oracle Marks |11⟩ with π Phase Flip",
          message:
            "Controlled-Z marks target |11⟩ with a π phase shift: |11⟩ → -|11⟩. The 4 amplitudes are now (+1/2, +1/2, +1/2, -1/2).",
        },
      ],
    },



    // ── STEP 6: Probability Invariance ───────────────────────────
    {
      id: 'step-6-probability',
      stepNumber: 6,
      title: "Probability Invariance: Why Phase Alone Isn't Enough",
      explanation:
        "Because measurement probability equals amplitude squared (|-1/2|² = 1/4 = 25%), phase inversion alone cannot be measured directly. All 4 states still show 25% probability!",
      narrationText:
        "Look at the probability distribution. Even though the phase of state 11 was flipped to negative one-half, every state still has an identical twenty-five percent measurement probability! Because measurement squares the amplitude, phase differences cannot be detected by measurement alone. We need amplitude amplification.",
      actions: [
        { type: 'clear_highlights' },
        { type: 'focus_visualization', panel: 'results' },
        { type: 'show_result' },
        {
          type: 'explain',
          title: "Probability Invariance",
          message:
            "Probabilities are still 25% each (|-1/2|² = 25%). Phase inversion alone cannot be detected by measurement. We need the Diffuser to amplify the amplitude.",
        },
      ],
    },

    // ── STEP 7: Diffuser Construction ────────────────────────────
    {
      id: 'step-7-diffuser',
      stepNumber: 7,
      title: "The Grover Diffuser: Inversion About the Mean",
      explanation:
        "The Grover Diffuser operator D = 2|s⟩⟨s| - I reflects all state amplitudes about their average mean, amplifying the marked target state.",
      narrationText:
        "Now we construct the Grover Diffuser. Composed of Hadamard, Pauli-X, and Controlled-Z gates, this operator performs an inversion about the mean, reflecting all state amplitudes across their average value.",
      actions: [
        { type: 'add_gate', gate: 'h', targets: [0], column: 2, gateId: 'diff-h0-1' },
        { type: 'add_gate', gate: 'h', targets: [1], column: 2, gateId: 'diff-h1-1' },
        { type: 'add_gate', gate: 'x', targets: [0], column: 3, gateId: 'diff-x0-1' },
        { type: 'add_gate', gate: 'x', targets: [1], column: 3, gateId: 'diff-x1-1' },
        { type: 'add_gate', gate: 'cz', targets: [0, 1], column: 4, gateId: 'diff-cz' },
        { type: 'add_gate', gate: 'x', targets: [0], column: 5, gateId: 'diff-x0-2' },
        { type: 'add_gate', gate: 'x', targets: [1], column: 5, gateId: 'diff-x1-2' },
        { type: 'add_gate', gate: 'h', targets: [0], column: 6, gateId: 'diff-h0-2' },
        { type: 'add_gate', gate: 'h', targets: [1], column: 6, gateId: 'diff-h1-2' },
        { type: 'run_simulation', shots: 1000 },
        {
          type: 'explain',
          title: "Diffuser Operator Assembled",
          message:
            "Diffuser D = 2|s⟩⟨s| - I assembled. It reflects state amplitudes across their mean, causing constructive interference on target |11⟩.",
        },
      ],
    },

    // ── STEP 8: Q-Sphere After Diffuser (Key Visual Moment) ────────
    {
      id: 'step-8-diffuser-qsphere',
      stepNumber: 8,
      title: "Q-Sphere After Diffuser: Amplitude Amplification!",
      explanation:
        "After the Diffuser, the Q-Sphere shows only ONE large node at |11⟩ — the target state. All other nodes have vanished. The negative phase was flipped into a constructive amplitude of +1.0, while positive states destructively cancelled to 0.",
      narrationText:
        "This is the key moment. Watch the Q-Sphere transform. Before the Diffuser, the |11⟩ node was red and equal in size to the others. Now, |11⟩ is the only visible node — massive and bright. The three non-target states have destructively interfered and collapsed to zero. This is amplitude amplification in action.",
      actions: [
        { type: 'focus_visualization', panel: 'qsphere' },
        {
          type: 'explain',
          title: "Q-Sphere: Amplitude Amplification Achieved",
          message:
            "Compare: Normal circuit Q-Sphere had 4 equal nodes. Grover Q-Sphere now shows ONE dominant node at |11⟩ with 100% probability. The negative phase is the Diffuser's lever — it becomes constructive after reflection.",
        },
      ],
    },



    // ── STEP 9: Grover Iteration Math ────────────────────────────
    {
      id: 'step-9-grover-iteration',
      stepNumber: 9,
      title: "The Grover Iteration: Mathematical Amplitude Amplification",
      explanation:
        "Mean amplitude: μ = (1/2 + 1/2 + 1/2 - 1/2)/4 = 1/4. Non-targets: 2(1/4) - 1/2 = 0. Target |11⟩: 2(1/4) - (-1/2) = 1.0. Target amplitude is amplified to 100%!",
      narrationText:
        "Let's examine the exact mathematics. The average mean amplitude before the diffuser was one-fourth. Reflecting about the mean: two times one-fourth minus one-half gives zero for non-target states, while two times one-fourth minus negative one-half equals exactly one for target state 11!",
      actions: [
        { type: 'focus_visualization', panel: 'state' },
        {
          type: 'explain',
          title: "Mathematical Inversion-About-the-Mean",
          message:
            "Mean μ = 1/4. Non-targets: 2(1/4) - 1/2 = 0. Target |11⟩: 2(1/4) - (-1/2) = 1.0. Target probability is 100%!",
        },
      ],
    },

    // ── STEP 10: Quantum Simulation ──────────────────────────────
    {
      id: 'step-10-simulation',
      stepNumber: 10,
      title: "Full Quantum Circuit Simulation",
      explanation:
        "Executing full quantum simulation of the 2-qubit Grover search circuit across 1000 shots using the quantum simulation engine.",
      narrationText:
        "We now execute a full quantum simulation of the complete Grover circuit across one thousand shots. Watch the simulation engine compute the physical statevector evolution.",
      actions: [
        { type: 'focus_visualization', panel: 'results' },
        { type: 'run_simulation', shots: 1000 },
        { type: 'show_result' },
        {
          type: 'explain',
          title: "Quantum Simulation Executed",
          message: "1000 shots simulated. Calculating exact quantum statevector collapse.",
        },
      ],
    },

    // ── STEP 11: Measurement Collapse ────────────────────────────
    {
      id: 'step-11-measurement',
      stepNumber: 11,
      title: "Measurement Collapse & Histogram",
      explanation:
        "All 1000 shots collapse into target marked state |11⟩ with 100% probability. Non-target states |00⟩, |01⟩, |10⟩ have 0 counts.",
      narrationText:
        "Look at the resulting measurement histogram! Every single one of the one thousand experimental trials collapsed into our target marked state 11. States 00, 01, and 10 have zero counts.",
      actions: [
        { type: 'focus_visualization', panel: 'results' },
        { type: 'show_result' },
        {
          type: 'explain',
          title: "Measurement Histogram",
          message: "1000/1000 shots measured |11⟩. Target probability = 1.0 (100%). States |00⟩, |01⟩, |10⟩ = 0%.",
        },
      ],
    },

    // ── STEP 12: Interpretation ──────────────────────────────────
    {
      id: 'step-12-interpretation',
      stepNumber: 12,
      title: "Interpretation: Why Target |11⟩ Was Amplified",
      explanation:
        "Destructive interference cancelled out non-target states |00⟩, |01⟩, |10⟩ to 0, while constructive interference amplified marked target |11⟩ to 100%.",
      narrationText:
        "Let's interpret what just occurred. Through destructive interference, the probability amplitudes of the three incorrect states cancelled out completely to zero. Meanwhile, constructive interference boosted our target item 11 from twenty-five percent to one hundred percent probability in a single query.",
      actions: [
        { type: 'focus_visualization', panel: 'results' },
        {
          type: 'explain',
          title: "Constructive vs Destructive Interference",
          message:
            "Oracle phase inversion + Diffuser reflection converted a 25% uniform distribution into 100% deterministic identification of target |11⟩.",
        },
      ],
    },

    // ── STEP 13: Socratic Check ────────────────────────────────────
    {
      id: 'step-13-socratic-check',
      stepNumber: 13,
      title: "Socratic Check: The Amplitude Amplification Principle",
      explanation:
        "Because the Oracle flipped the phase of |11⟩ to negative, its amplitude was below the average mean. Reflecting about the mean caused destructive interference for positive non-targets and constructive interference for the negative target.",
      narrationText:
        "Consider why the target state 11 reached one hundred percent probability while the other three states dropped to zero. The Diffuser reflected amplitudes about the mean: negative phase on |11⟩ caused constructive interference, while positive states cancelled destructively.",
      actions: [
        {
          type: 'explain',
          title: 'Reflection about the Mean',
          message: 'Negative phase on |11⟩ caused constructive interference during the Diffuser operation.',
        },
      ],
      checkpoint: {
        id: 'pred-grover-mechanism',
        prompt: 'Socratic Check',
        question:
          'Why did the target state |11⟩ achieve 100% measurement probability while states |00⟩, |01⟩, |10⟩ dropped to 0%?',
        options: [
          {
            id: 'opt-meas-delete',
            label: 'The Oracle directly measured and deleted the other states',
            description: 'Misconception: Oracle as classical filter',
            isCorrect: false,
          },
          {
            id: 'opt-interference-correct',
            label:
              'The Diffuser reflected amplitudes about the mean: negative phase on |11⟩ caused constructive interference, while positive states cancelled destructively',
            description: 'Correct quantum amplitude amplification principle',
            isCorrect: true,
          },
          {
            id: 'opt-hadamard-not',
            label: 'The Hadamard gates acted as classical NOT gates to invert the bits',
            description: 'Misconception: H as NOT',
            isCorrect: false,
          },
        ],
        correctOptionIndex: 1,
        explanation:
          'Because the Oracle flipped the phase of |11⟩ to negative, its amplitude was below the average mean (μ = 1/4). Reflecting about the mean (2|s⟩⟨s| - I) caused destructive interference for positive non-targets (2(1/4) - 1/2 = 0) and constructive interference for the negative target (2(1/4) - (-1/2) = 1.0).',
      },
    },

    // ── STEP 14: Mastery & Summary ───────────────────────────────
    {
      id: 'step-14-mastery',
      stepNumber: 14,
      title: "Mastery: Grover Algorithm Mastered!",
      explanation:
        "You have completed the Grover Algorithm live demonstration! You observed quadratic quantum search speedup O(√N) powered by Oracle phase marking and Diffuser amplitude amplification.",
      narrationText:
        "Congratulations! You have completed the Grover Algorithm Masterclass. You've experienced how quantum superposition, phase marking, and amplitude amplification work in harmony to solve unsorted database searches with quadratic speedup. You are now ready for multi-qubit Grover search and quantum phase estimation!",
      actions: [
        { type: 'focus_visualization', panel: 'results' },
        {
          type: 'explain',
          title: "Quantum Search Mastered!",
          message:
            "Mastery Achieved! +300 XP awarded. Grover's Algorithm quadratic speedup O(√N) is a foundational pillar of quantum algorithms.",
        },
        { type: 'complete_lesson' },
      ],
    },
  ],
};

export const groverAlgorithmLesson = s2GroverSearchLesson;

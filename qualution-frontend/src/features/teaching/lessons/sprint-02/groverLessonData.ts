import type {
  PredictionCheckpoint,
  LearnerTakeoverConfig,
  PredictionOption,
} from '../../types';

// ============================================================================
// EXPLANATION SPINE (3 Depths: Story, Bars, Compass)
// ============================================================================
export interface ExplanationSpineDepth {
  depth: 'story' | 'bars' | 'compass';
  title: string;
  summary: string;
  body: string;
}

export const GROVER_EXPLANATION_SPINE: Record<'story' | 'bars' | 'compass', ExplanationSpineDepth> = {
  story: {
    depth: 'story',
    title: 'The Search Story: Mark, Amplify, Repeat',
    summary: 'The oracle quietly marks the answer with a sign flip; diffusion turns that hidden mark into visible probability; repeat the right number of times.',
    body: 'Imagine searching four closed boxes. The oracle cannot shout the answer out loud; it quietly marks the prize with a negative phase (-1). To our classical measurements, probabilities are amplitude squared, so (-1/2)² is still +1/4 — the mark is invisible! The diffusion operator acts as an amplifier: it reflects all amplitudes across their average, turning the hidden negative sign into near 100% probability. Repeat the right number of times to reveal the prize.',
  },
  bars: {
    depth: 'bars',
    title: 'Amplitudes as Bars: Inversion About the Mean',
    summary: 'Amplitudes as bars around their average; diffusion mirrors every bar across that average.',
    body: 'Picture the four amplitudes as vertical bars. Initially, all four sit at +1/2, so their average is +1/2. When the oracle flips box 11 to -1/2, the average drops to (+1/2 + +1/2 + +1/2 - 1/2) / 4 = +1/4. Diffusion mirrors every bar across that average line: the three wrong boxes sit 1/4 above average (+1/2), so mirroring sends them 1/4 below (+1/4 - 1/4 = 0). The marked box sits 3/4 below average (-1/2), so mirroring sends it 3/4 above (+1/4 + 3/4 = 1.0)!',
  },
  compass: {
    depth: 'compass',
    title: 'The Quantum Compass: 2D State Rotation',
    summary: 'Axis "wrong boxes" horizontal, "the prize" vertical. Start 30 deg up (1/2 = sin 30). Each round rotates 60 deg. One round = 90 deg = certainty. Two rounds = 150 deg = overshoot.',
    body: 'The entire 4-dimensional state space can be visualized on a 2D compass. The horizontal axis represents the uniform superposition of all wrong boxes (|00⟩+|01⟩+|10⟩)/√3, and the vertical axis is the prize (|11⟩). The initial uniform state starts at exactly 30° above horizontal because sin(30°) = 1/2 = 1/√4. Each combined round of Oracle + Diffusion rotates the state vector by exactly 2θ = 60°. One round rotates 30° + 60° = 90° directly onto the prize axis (|11⟩, 100% certainty). A second round rotates another 60° to 150° — overshooting the target and collapsing probability back to sin²(150°) = 25%!',
  },
};

// ============================================================================
// STAGE 0: Classical vs Quantum Search Scaling
// ============================================================================
export const STAGE_0_DATA = {
  id: 'stage-0-classical-intuition',
  stepNumber: 0,
  title: 'Classical vs. Quantum Search',
  tutorIntro:
    'Four boxes. One hides a prize. You can open one at a time. How many do you have to open to be certain where the prize is?',
  classicalScalingText:
    "That's classical search. Double the boxes, double the work. A million boxes takes about half a million openings on average. Grover needs about the square root of N rounds: roughly 785 for a million boxes. For our four boxes, exactly one. Our boxes are the four two-bit outcomes 00, 01, 10, 11. The prize is in box 11.",
  checkpoint: {
    id: 'pred-g-classical',
    prompt: 'Classical Search Worst-Case',
    question:
      'Four boxes. One hides a prize. You can open one at a time. How many do you have to open to be certain where the prize is?',
    options: [
      { id: 'opt-1', label: '1 box', description: 'Open a single box', isCorrect: false },
      { id: 'opt-2', label: '2 boxes', description: 'Open half the boxes', isCorrect: false },
      { id: 'opt-3', label: '3 boxes', description: 'Open three boxes', isCorrect: true },
      { id: 'opt-4', label: '4 boxes', description: 'Open all four boxes', isCorrect: false },
    ],
    correctOptionIndex: 2, // 3 boxes
    explanation:
      'In the worst case, checking 3 empty boxes leaves only one unopened box, which must contain the prize. You do not need to open the 4th.',
    feedback: {
      wrong4: 'Nearly. After three empty boxes you already know the fourth holds it.',
      wrong1or2: "That's the lucky case. To be certain, plan for the worst case: 3.",
      correct: 'Exactly right. In the worst case, 3 openings guarantee certainty.',
    },
  },
};

// ============================================================================
// STAGE 1: Equal Superposition (H on q0 and q1)
// ============================================================================
export const STAGE_1_DATA = {
  id: 'stage-1-superposition',
  stepNumber: 1,
  title: 'Stage 1 — Equal Superposition',
  tutorIntro: 'Two qubits give four outcomes. Place a Hadamard on each wire.',
  observeExplanation:
    'Each box has an amplitude of 1/2. Probability is amplitude squared, so 1/4. Amplitude first, probability second. That order matters in a moment. This is NOT trying every box at once: measuring still gives one random box. Superposition is the starting line, not the answer.',
  checkpoint: {
    id: 'pred-g-uniform',
    prompt: 'Predict Measurement Probabilities',
    question: 'If we measured now, how likely is each box?',
    options: [
      { id: 'opt-deterministic', label: '0% / 0% / 0% / 100%', description: 'One state dominates', isCorrect: false },
      { id: 'opt-split-two', label: '50/50 between two', description: 'Two states share probability', isCorrect: false },
      { id: 'opt-uniform', label: '25% each', description: 'All four boxes equally likely', isCorrect: true },
      { id: 'opt-unknown', label: "Can't say", description: 'Distribution is indeterminate', isCorrect: false },
    ],
    correctOptionIndex: 2,
    explanation:
      'Two qubits in equal superposition yield 2² = 4 computational basis states, each with amplitude 1/2 and probability (1/2)² = 1/4 = 25%.',
    feedback: {
      wrong50: 'Four outcomes, all equal, so each gets a quarter. Two qubits at 50/50 each give four combinations.',
      wrongOther: 'Each of the 4 basis states has amplitude 1/2. The Born rule gives (1/2)² = 25% each.',
      correct: 'Spot on! 4 outcomes with amplitude 1/2 yield exactly 25% probability each.',
    },
  },
  expectedStatevector: [0.5, 0.5, 0.5, 0.5],
};

// ============================================================================
// STAGE 2: The Phase Inversion Oracle
// ============================================================================
export const STAGE_2_DATA = {
  id: 'stage-2-oracle',
  stepNumber: 2,
  title: 'Stage 2 — The Phase Oracle',
  tutorIntro:
    'The prize is in box 11. The oracle must recognise it without moving anything. It flips one sign: the amplitude of 11 goes from +1/2 to -1/2. Physicists call that sign the phase. Place the connection that flips the sign of 11 only.',
  hintAfterMiss: 'You need a gate that acts only when both wires are 1.',
  checkpoint: {
    id: 'pred-g-oracle-prob',
    prompt: 'Predict P(11) After Phase Inversion',
    question: "We've marked 11. If we measured now, what is P(11)?",
    options: [
      { id: 'opt-0', label: '0%', description: 'Outcome 11 vanishes', isCorrect: false },
      { id: 'opt-25', label: '25% unchanged', description: 'Probability is unchanged', isCorrect: true },
      { id: 'opt-50', label: '50%', description: 'Marked state gains probability', isCorrect: false },
      { id: 'opt-100', label: '100%', description: 'Oracle amplifies state directly', isCorrect: false },
    ],
    correctOptionIndex: 1,
    explanation:
      'A mark is not a boost. Probability is amplitude squared, and (-1/2)² is +1/4 = 25%. The minus sign vanishes under measurement!',
    feedback: {
      wrongBoost: "A mark isn't a boost. Probability is amplitude squared, and (-1/2)^2 is +1/4. The minus sign vanishes.",
      wrongZero: "The amplitude is -1/2, not 0! Squaring -1/2 still gives +1/4 (25%).",
      correct: 'Exactly right! (-1/2)² = +1/4 = 25%. The mark is a relative phase, invisible to direct measurement.',
    },
  },
  observeExplanation:
    "The answer is marked but invisible to a direct measurement. We need one more move to turn a hidden sign into a visible probability. In a real search the oracle is a circuit that CHECKS a candidate, such as 'is this the right password?'. It doesn't know the answer in advance. We hard-wire 11 here only so there is something to find.",
  diagnoses: {
    cnot: 'All four amplitudes are equal and CNOT only moves amplitude between boxes. Shuffling equal amplitudes changes nothing. We need to change a sign, not a position. To use CNOT as a phase-flip oracle, you must sandwich the target qubit in Hadamard gates (H · CX · H = CZ).',
    singleZ: "That flipped two boxes. A single-qubit Z looks at one wire, so it can't single out both wires being 1.",
    xOrSwap: 'All four amplitudes are equal and swapping or bit-flipping moves amplitude between boxes. Shuffling equal amplitudes changes nothing. We need to change a sign, not a position.',
    hadamardAgain: 'Two Hadamards cancel; that undid the superposition.',
    czBeforeH: 'At that point the register is 00, so there is no 11 to mark. Mark the boxes after they exist.',
  },
  expectedStatevector: [0.5, 0.5, 0.5, -0.5],
};

// ============================================================================
// STAGE 3: Amplitude Diffusion Operator (Inversion About Mean)
// ============================================================================
export const STAGE_3_DATA = {
  id: 'stage-3-diffusion',
  stepNumber: 3,
  title: 'Stage 3 — Grover Diffusion Operator',
  tutorIntro:
    'Now the amplitudes are 1/2, 1/2, 1/2, -1/2. Their average is 1/4. Diffusion mirrors every amplitude across that average. The three boxes sitting 1/4 above it land 1/4 below it, at 0. The marked box sits 3/4 below the average, so it lands 3/4 above: 1/4 + 3/4 = 1.',
  checkpoint: {
    id: 'pred-g-mirror',
    prompt: 'Mirroring Across Average',
    question: 'The average is 1/4 and the marked amplitude is -1/2. After mirroring across the average, where does it land?',
    options: [
      { id: 'opt-neg-half', label: '-1/2', description: 'Remains unchanged', isCorrect: false },
      { id: 'opt-0', label: '0', description: 'Drops to zero', isCorrect: false },
      { id: 'opt-half', label: '1/2', description: 'Flips across zero', isCorrect: false },
      { id: 'opt-1', label: '1', description: 'Lands at amplitude 1.0', isCorrect: true },
    ],
    correctOptionIndex: 3,
    explanation:
      'Distance from average: 1/4 - (-1/2) = 3/4 below average. Mirroring lands 3/4 above average: 1/4 + 3/4 = 1.0!',
    feedback: {
      wrongHalf: "That's mirroring across zero, not across the average.",
      wrongZero: '0 is where the OTHER three land. Distance from the average is what gets mirrored.',
      wrongNegHalf: 'That would leave it un-mirrored. 1/4 - (-1/2) = 3/4 distance, reflected to 1/4 + 3/4 = 1.',
      correct: 'Brilliant! 1/4 + (1/4 - (-1/2)) = 1/4 + 3/4 = 1.0. Complete constructive interference!',
    },
  },
  chunks: {
    chunkA: {
      name: 'Chunk A (Column 2)',
      gates: [{ gate: 'h', qubit: 0, col: 2 }, { gate: 'h', qubit: 1, col: 2 }],
      explanation: 'H on both wires. The uniform state becomes 00.',
    },
    chunkB: {
      name: 'Chunk B (Columns 3-5)',
      gates: [
        { gate: 'x', qubit: 0, col: 3 }, { gate: 'x', qubit: 1, col: 3 },
        { gate: 'cz', targets: [0, 1], col: 4 },
        { gate: 'x', qubit: 0, col: 5 }, { gate: 'x', qubit: 1, col: 5 },
      ],
      explanation: 'X on both, CZ, X on both. Now box 00 plays the answer’s role: the X gates move 00 to 11, CZ marks it, the X gates move it back.',
    },
    chunkC: {
      name: 'Chunk C (Column 6)',
      gates: [{ gate: 'h', qubit: 0, col: 6 }, { gate: 'h', qubit: 1, col: 6 }],
      explanation: 'H on both wires. Return to the original view.',
    },
  },
  tutorSummary:
    'Diffusion is the oracle’s trick on a different target. The oracle marks the ANSWER; diffusion marks the AVERAGE STATE. Two mirrors in a row make a rotation, and it points at the prize.',
  observeExplanation:
    'Statevector shows 0 on the wrong boxes, and -1 on 11. that overall minus sign is a global phase; no measurement can see it.',
  diagnoses: {
    missingX:
      'You found box 00 with certainty, which is the wrong box. Without the X gates the mirror is set on the wrong state. The X gates are what move it to the average.',
  },
  expectedStatevector: [0, 0, 0, -1], // Target state |11⟩ with global phase -1
};

// ============================================================================
// STAGE 4: Measurement, 1000 Shots, & Analyzer Metrics
// ============================================================================
export const STAGE_4_DATA = {
  id: 'stage-4-measurement-telemetry',
  stepNumber: 4,
  title: 'Stage 4 — Measure & Verify',
  checkpoint: {
    id: 'pred-g-rounds',
    aliasId: 'checkpoint-grover-iterations',
    prompt: 'Predict Optimal Grover Rounds',
    question: 'How many rounds of oracle + diffusion do four boxes need?',
    options: [
      { id: 'opt-1', label: '1 round', description: 'Single query', isCorrect: true },
      { id: 'opt-2', label: '2 rounds', description: 'Two iterations', isCorrect: false },
      { id: 'opt-3', label: '3 rounds', description: 'Three iterations', isCorrect: false },
      { id: 'opt-4', label: '4 rounds', description: 'Four iterations', isCorrect: false },
    ],
    correctOptionIndex: 0,
    explanation:
      'The rule of thumb is (pi/4) x sqrt(N). For N=4 that is (pi/4) x 2 ≈ 1.57, and the exact geometric rotation reaches 90° in exactly one round.',
  },
  tutorExplanation:
    'Found in one round. Honest aside: this tiny case is all Clifford gates, so a stabilizer simulator handles it easily. It’s a teaching case. The advantage shows up on big searches.',
  expectedMetrics: {
    totalGates: 12,
    circuitDepth: 7,
    twoQubitGates: 2,
    twoQubitGateRatioPercent: 16.7,
    cliffordCompatible: true,
  },
};

// ============================================================================
// STAGE 5: Break It On Purpose (Overshoot)
// ============================================================================
export const STAGE_5_DATA = {
  id: 'stage-5-overshoot',
  stepNumber: 5,
  title: 'Stage 5 — Break It On Purpose (Overshoot)',
  checkpoint: {
    id: 'pred-g-overshoot',
    prompt: 'Predict Outcome of a 2nd Grover Round',
    question: 'Run oracle + diffusion a second time. What happens to P(11)?',
    options: [
      { id: 'opt-stay-100', label: 'Stays 100%', description: 'Remains peaked at target', isCorrect: false },
      { id: 'opt-drops-25', label: 'Drops to 25%', description: 'Collapses back to uniform distribution', isCorrect: true },
      { id: 'opt-drops-0', label: 'Drops to 0%', description: 'Completely extinguishes target', isCorrect: false },
      { id: 'opt-rises', label: 'Rises higher', description: 'Gains even greater certainty', isCorrect: false },
    ],
    correctOptionIndex: 1,
    explanation:
      'Two rounds and the histogram is flat again. Each round rotates the state 60 degrees. One round hits the bullseye at 90. A second overshoots to 150.',
  },
  tutorExplanation:
    "Two rounds and the histogram is flat again. Each round rotates the state 60 degrees. One round hits the bullseye at 90. A second overshoots to 150. Grover isn't 'more rounds is better'. It's the RIGHT number of rounds.",
  expectedDistribution: {
    '00': { min: 0.20, max: 0.30 },
    '01': { min: 0.20, max: 0.30 },
    '10': { min: 0.20, max: 0.30 },
    '11': { min: 0.20, max: 0.30 },
  },
};

// ============================================================================
// STAGE 6: Zoom Out, Misconceptions, & Assessment
// ============================================================================
export interface ScalingTableRow {
  databaseSizeN: string;
  classicalQueries: string;
  groverRounds: string;
}

export const SCALING_TABLE: ScalingTableRow[] = [
  { databaseSizeN: '4', classicalQueries: '~2-3', groverRounds: '1' },
  { databaseSizeN: '1,000', classicalQueries: '~500', groverRounds: '~25' },
  { databaseSizeN: '1,000,000', classicalQueries: '~500,000', groverRounds: '~785' },
  { databaseSizeN: '10^12', classicalQueries: '~5x10^11', groverRounds: '~785,000' },
];

export const WHAT_GROVER_IS_NOT = [
  {
    title: 'NOT "Try Everything At Once"',
    body: 'Quantum computers do not test every candidate simultaneously and spit out the answer. Superposition is just the canvas; interference is what amplifies the answer.',
  },
  {
    title: 'Quadratic, Not Exponential',
    body: 'Grover provides an O(√N) quadratic speedup, not an exponential speedup like Shor’s algorithm. It is mathematically proven optimal for unstructured search.',
  },
  {
    title: 'Requires an Efficient Oracle',
    body: 'Grover requires an oracle that can verify a solution in polynomial time. If checking a solution is computationally heavy, the quantum advantage narrows.',
  },
  {
    title: 'Classical Binary Search Wins on Structured Data',
    body: 'If data is already sorted or indexed, classical binary search takes O(log N), easily beating Grover’s O(√N). Grover is exclusively for unsorted, unstructured search.',
  },
];

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const STAGE_6_ASSESSMENT: AssessmentQuestion[] = [
  {
    id: 'q1-oracle-histogram',
    question: 'Why did the histogram look completely unchanged right after the oracle phase inversion?',
    options: [
      'The simulator encountered an execution error.',
      'Measurement probability equals amplitude squared, so (-1/2)² is +1/4 (+25%).',
      'The oracle had not yet executed its gate sequence.',
      'The phase was cancelled by environmental decoherence.',
    ],
    correctIndex: 1,
    explanation:
      'Probability equals amplitude squared (|α|²). The oracle flipped the amplitude sign to -1/2, but (-1/2)² = +1/4 = 25%, exactly matching the other states before measurement.',
  },
  {
    id: 'q2-rounds-for-16',
    question: 'For an unsorted database of N = 16 items, approximately how many Grover rounds are needed?',
    options: [
      '1 round',
      '~3 rounds (giving ~96% probability)',
      '8 rounds',
      '16 rounds',
    ],
    correctIndex: 1,
    explanation:
      'Using R ≈ (π/4)√N = (π/4)·4 ≈ 3.14 rounds. Exactly 3 iterations yields ~96% target probability.',
  },
  {
    id: 'q3-diffusion-role',
    question: 'What is the physical mechanism of the Grover diffusion operator?',
    options: [
      'It randomly shuffles quantum states across all wires.',
      'It mirrors amplitudes across their average, constructively amplifying the marked one.',
      'It applies classical error correction to eliminate bit flips.',
      'It measures the quantum state and projects it onto the computational basis.',
    ],
    correctIndex: 1,
    explanation:
      'Diffusion performs inversion about the mean (2|ψ⟩⟨ψ| - I), reflecting all amplitudes across their average line to amplify the marked state.',
  },
  {
    id: 'q4-more-rounds-myth',
    question: 'True or False: Applying more Grover rounds always makes the target answer more certain.',
    options: [
      'True: each iteration monotonically increases target amplitude toward 100%.',
      'False: extra rounds over-rotate the quantum state vector (e.g. N=4 drops from 100% to 25% on round 2).',
    ],
    correctIndex: 1,
    explanation:
      'False. Grover search is a geometric rotation in a 2D subspace. Extra iterations rotate past 90°, overshooting the target and collapsing probability.',
  },
];
export const STAGE_6_DATA = {
  id: 'stage-6-zoom-out-assessment',
  stepNumber: 6,
  title: 'Stage 6 — Zoom Out, Misconceptions, & Assessment',
  scalingTable: SCALING_TABLE,
  whatGroverIsNot: WHAT_GROVER_IS_NOT,
  assessment: STAGE_6_ASSESSMENT,
};

// ============================================================================
// TRANSFER CHALLENGE (STRETCH): Search for Prize in Box |01⟩ (q0=0, q1=1)
// ============================================================================
export const TRANSFER_CHALLENGE_DATA = {
  id: 'transfer-stretch-box-01',
  title: 'Transfer Challenge: Find Box |01⟩',
  targetBox: '01',
  targetQubits: { q0: 0, q1: 1 },
  tutorPrompt:
    'Transfer Challenge: Now mark a different prize: box |01⟩ (q0=0, q1=1). Wrap X gates around the oracle CZ on wire q0. The diffusion block remains unchanged: only the oracle knows the answer!',
  instructions: [
    'Place an X gate on q0 before and after the oracle CZ connection.',
    'Leave wire q1 as normal.',
    'Leave the diffusion block completely untouched.',
    'Run simulation to verify P(01) reaches > 95%!',
  ],
  expectedTargetState: '01',
  minProbability: 0.95,
};

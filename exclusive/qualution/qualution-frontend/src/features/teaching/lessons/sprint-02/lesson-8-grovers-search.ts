import type { LessonScript } from '../../types';
import { validateAndDiagnoseGroverOracle } from './groverOracleDiagnoser';
import {
  STAGE_0_DATA,
  STAGE_1_DATA,
  STAGE_2_DATA,
  STAGE_5_DATA,
  TRANSFER_CHALLENGE_DATA,
} from './groverLessonData';
import {
  validateGroverTransferChallenge,
} from './groverBehavioralValidators';

export const lesson8GroversSearchLesson: LessonScript = {
  id: 'lesson-8-grovers-search',
  title: "Grover's Search Algorithm",
  sprint: 2,
  difficulty: 'Intermediate',
  estimatedMinutes: 5,
  xpReward: 350,
  curriculumModuleId: 'lesson-8-grovers-search',
  badge: 'Quantum Searcher' as any,
  completionMessage:
    "Mastery achieved! You designed, verified, and analyzed Grover's Search Algorithm on the live Workbench, isolating marked state |11⟩ with 100% probability in a single quantum iteration.",
  conceptTags: [
    'Grover Search',
    'Oracle',
    'Amplitude Amplification',
    'Diffusion Operator',
    'Quantum Searcher',
  ],
  learningObjectives: [
    'Analyze classical vs. quantum search complexity scaling on unstructured data',
    'Prepare equal superposition across 4 computational basis states using Hadamard gates',
    'Implement the phase-inverting Oracle using Controlled-Z to mark target |11⟩',
    'Construct the Grover Diffusion operator for inversion about the mean',
    'Verify 100% measurement probability on |11⟩ with live Circuit Analyzer metrics',
    'Understand why extra iterations overshoot the target and degrade probability',
  ],
  prerequisites: ['Hadamard Superposition', 'Controlled-Z Gate', 'Phase Kickback'],
  summary:
    "Build, analyze, and execute Grover's Search Algorithm inside the live Workbench to locate marked item |11⟩ with 100% probability in a single quantum iteration.",
  starterCircuit: {
    qubits: 2,
    classical_bits: 2,
    gates: [],
    measure: false,
    shots: 1000,
  },
  steps: [
    // ══════════════════════════════════════════════════════════════════
    // STAGE 0 — CLASSICAL VS QUANTUM SEARCH (Intuition Layer)
    // ══════════════════════════════════════════════════════════════════
    {
      id: STAGE_0_DATA.id,
      stepNumber: 0,
      title: STAGE_0_DATA.title,
      explanation: STAGE_0_DATA.classicalScalingText,
      narrationText: STAGE_0_DATA.tutorIntro,
      actions: [],
      circuitSnapshot: {
        qubits: 2,
        classical_bits: 2,
        gates: [],
        measure: false,
        shots: 1000,
      },
    },

    // ══════════════════════════════════════════════════════════════════
    // STAGE 1 — EQUAL SUPERPOSITION (Demonstration Layer)
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'stage-1-equal-superposition',
      stepNumber: 1,
      title: 'STAGE 1 — Equal Superposition',
      explanation: STAGE_1_DATA.observeExplanation,
      narrationText: STAGE_1_DATA.tutorIntro,
      actions: [
        {
          type: 'MOVE_CURSOR',
          target: { type: 'palette_gate', gate: 'h' },
        },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [0],
          column: 0,
          gateId: 'g-s1-h0',
        },
        {
          type: 'add_gate',
          gate: 'h',
          targets: [1],
          column: 0,
          gateId: 'g-s1-h1',
        },
        {
          type: 'run_simulation',
          backend: 'statevector',
        },
        {
          type: 'focus_visualization',
          panel: 'state',
        },
      ],
      circuitSnapshot: {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
          { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
        ],
        measure: false,
        shots: 1000,
      },
    },

    // ══════════════════════════════════════════════════════════════════
    // STAGE 2 — ORACLE PHASE INVERSION (Interactive Student Interrupt)
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'stage-2-oracle-phase-inversion',
      stepNumber: 2,
      title: 'STAGE 2 — Oracle (Phase Inversion)',
      explanation: STAGE_2_DATA.observeExplanation,
      narrationText:
        'The oracle needs to mark state |11⟩ with a phase flip. Connect a Controlled-Z gate (or equivalent H-CX-H sandwich) between wire 0 and wire 1.',
      actions: [],
      takeover: {
        prompt:
          'The oracle needs to mark state |11⟩ with a phase flip. Connect a Controlled-Z gate (or equivalent H-CX-H sandwich) between wire 0 and wire 1.',
        taskType: 'modify_circuit',
        goalDescription:
          'Connect the Oracle: place a Controlled-Z gate (or H-CX-H decomposition) across wire 0 and wire 1 to invert the phase of |11⟩.',
        instructions: [
          'Drag a Controlled-Z (CZ) gate from the palette onto column 1 connecting qubit 0 and qubit 1.',
          'Alternatively, synthesize the CZ operation using an H gate on qubit 1, a CX gate from qubit 0 to qubit 1, followed by an H gate on qubit 1.',
        ],
        completionCriteria: {
          type: 'circuit_has_gates',
          requiredGates: ['cz'],
        },
        customDiagnoser: (circ) => validateAndDiagnoseGroverOracle(circ),
        solutionActions: [
          { type: 'add_gate', gate: 'cz', targets: [0, 1], column: 1, gateId: 'g-s2-cz' },
          { type: 'run_simulation', backend: 'statevector' },
          { type: 'focus_visualization', panel: 'state' },
        ],
        minFailedAttemptsForSolution: 2,
        successNarration:
          "Correct — that's the phase-flip oracle for |11⟩. Statevector shows: amplitude is -0.5 on |11⟩ with phase π. The mark is an invisible relative phase!",
      },
      circuitSnapshot: {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
          { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
          { id: 'g-s2-cz', gate: 'cz', targets: [0, 1], column: 1 },
        ],
        measure: false,
        shots: 1000,
      },
    },

    // ══════════════════════════════════════════════════════════════════
    // STAGE 3 — DIFFUSION OPERATOR (Inversion About the Mean)
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'stage-3-diffuser-amplification',
      stepNumber: 3,
      title: 'STAGE 3 — Diffuser (Inversion About Mean)',
      explanation:
        'Statevector shows 0 on the wrong boxes, and -1 on 11. That overall minus sign is a global phase; no measurement can see it. Diffusion mirrors every amplitude across their average (1/4), inverting the hidden mark into certainty.',
      narrationText:
        'Now we construct the Grover diffuser: H on both wires, X on both wires, CZ across wires, X on both wires, and H on both wires. Reflection about the mean amplifies the marked state to certainty, while the unmarked states completely disappear.',
      actions: [
        { type: 'add_gate', gate: 'h', targets: [0], column: 2, gateId: 'g-s3-h0a' },
        { type: 'add_gate', gate: 'h', targets: [1], column: 2, gateId: 'g-s3-h1a' },
        { type: 'add_gate', gate: 'x', targets: [0], column: 3, gateId: 'g-s3-x0a' },
        { type: 'add_gate', gate: 'x', targets: [1], column: 3, gateId: 'g-s3-x1a' },
        { type: 'add_gate', gate: 'cz', targets: [0, 1], column: 4, gateId: 'g-s3-cz' },
        { type: 'add_gate', gate: 'x', targets: [0], column: 5, gateId: 'g-s3-x0b' },
        { type: 'add_gate', gate: 'x', targets: [1], column: 5, gateId: 'g-s3-x1b' },
        { type: 'add_gate', gate: 'h', targets: [0], column: 6, gateId: 'g-s3-h0b' },
        { type: 'add_gate', gate: 'h', targets: [1], column: 6, gateId: 'g-s3-h1b' },
        { type: 'run_simulation', backend: 'statevector' },
        { type: 'focus_visualization', panel: 'state' },
      ],
      circuitSnapshot: {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
          { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
          { id: 'g-s2-cz', gate: 'cz', targets: [0, 1], column: 1 },
          { id: 'g-s3-h0a', gate: 'h', targets: [0], column: 2 },
          { id: 'g-s3-h1a', gate: 'h', targets: [1], column: 2 },
          { id: 'g-s3-x0a', gate: 'x', targets: [0], column: 3 },
          { id: 'g-s3-x1a', gate: 'x', targets: [1], column: 3 },
          { id: 'g-s3-cz', gate: 'cz', targets: [0, 1], column: 4 },
          { id: 'g-s3-x0b', gate: 'x', targets: [0], column: 5 },
          { id: 'g-s3-x1b', gate: 'x', targets: [1], column: 5 },
          { id: 'g-s3-h0b', gate: 'h', targets: [0], column: 6 },
          { id: 'g-s3-h1b', gate: 'h', targets: [1], column: 6 },
        ],
        measure: false,
        shots: 1000,
      },
    },

    // ══════════════════════════════════════════════════════════════════
    // STAGE 4 — MEASUREMENT & VERIFICATION (Analysis Layer)
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'stage-4-measurement-verification',
      stepNumber: 4,
      title: 'STAGE 4 — Measurement & Telemetry Verification',
      explanation:
        'Attach measurement gates to both wires and verify 100% probability on target state |11⟩ with depth 7 and Clifford stabilizer telemetry.',
      narrationText:
        'Finally, we attach measurement operations to both wires and execute the quantum simulation. The state collapses to |11⟩ with 100% probability!',
      actions: [
        { type: 'add_gate', gate: 'measure', targets: [0], column: 7, gateId: 'g-s4-m0' },
        { type: 'add_gate', gate: 'measure', targets: [1], column: 7, gateId: 'g-s4-m1' },
        { type: 'run_simulation' },
        { type: 'focus_visualization', panel: 'results' },
      ],
      circuitSnapshot: {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
          { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
          { id: 'g-s2-cz', gate: 'cz', targets: [0, 1], column: 1 },
          { id: 'g-s3-h0a', gate: 'h', targets: [0], column: 2 },
          { id: 'g-s3-h1a', gate: 'h', targets: [1], column: 2 },
          { id: 'g-s3-x0a', gate: 'x', targets: [0], column: 3 },
          { id: 'g-s3-x1a', gate: 'x', targets: [1], column: 3 },
          { id: 'g-s3-cz', gate: 'cz', targets: [0, 1], column: 4 },
          { id: 'g-s3-x0b', gate: 'x', targets: [0], column: 5 },
          { id: 'g-s3-x1b', gate: 'x', targets: [1], column: 5 },
          { id: 'g-s3-h0b', gate: 'h', targets: [0], column: 6 },
          { id: 'g-s3-h1b', gate: 'h', targets: [1], column: 6 },
          { id: 'g-s4-m0', gate: 'measure', targets: [0], column: 7 },
          { id: 'g-s4-m1', gate: 'measure', targets: [1], column: 7 },
        ],
        measure: true,
        shots: 1000,
      },
    },

    // ══════════════════════════════════════════════════════════════════
    // STAGE 5 — BREAK IT ON PURPOSE (Overshoot)
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'stage-5-overshoot',
      stepNumber: 5,
      title: 'STAGE 5 — Break It On Purpose (Overshoot)',
      explanation: STAGE_5_DATA.tutorExplanation,
      narrationText: STAGE_5_DATA.tutorExplanation,
      actions: [
        { type: 'run_simulation' },
        { type: 'focus_visualization', panel: 'results' },
      ],
      circuitSnapshot: {
        qubits: 2,
        classical_bits: 2,
        gates: [
          // Round 1
          { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
          { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
          { id: 'g-s2-cz', gate: 'cz', targets: [0, 1], column: 1 },
          { id: 'g-s3-h0a', gate: 'h', targets: [0], column: 2 },
          { id: 'g-s3-h1a', gate: 'h', targets: [1], column: 2 },
          { id: 'g-s3-x0a', gate: 'x', targets: [0], column: 3 },
          { id: 'g-s3-x1a', gate: 'x', targets: [1], column: 3 },
          { id: 'g-s3-cz', gate: 'cz', targets: [0, 1], column: 4 },
          { id: 'g-s3-x0b', gate: 'x', targets: [0], column: 5 },
          { id: 'g-s3-x1b', gate: 'x', targets: [1], column: 5 },
          { id: 'g-s3-h0b', gate: 'h', targets: [0], column: 6 },
          { id: 'g-s3-h1b', gate: 'h', targets: [1], column: 6 },
          // Round 2 (Overshoot)
          { id: 'g-r2-cz', gate: 'cz', targets: [0, 1], column: 7 },
          { id: 'g-r2-h0a', gate: 'h', targets: [0], column: 8 },
          { id: 'g-r2-h1a', gate: 'h', targets: [1], column: 8 },
          { id: 'g-r2-x0a', gate: 'x', targets: [0], column: 9 },
          { id: 'g-r2-x1a', gate: 'x', targets: [1], column: 9 },
          { id: 'g-r2-cz2', gate: 'cz', targets: [0, 1], column: 10 },
          { id: 'g-r2-x0b', gate: 'x', targets: [0], column: 11 },
          { id: 'g-r2-x1b', gate: 'x', targets: [1], column: 11 },
          { id: 'g-r2-h0b', gate: 'h', targets: [0], column: 12 },
          { id: 'g-r2-h1b', gate: 'h', targets: [1], column: 12 },
          // Readout
          { id: 'g-r2-m0', gate: 'measure', targets: [0], column: 13 },
          { id: 'g-r2-m1', gate: 'measure', targets: [1], column: 13 },
        ],
        measure: true,
        shots: 1000,
      },
    },

    // ══════════════════════════════════════════════════════════════════
    // STAGE 6 — ZOOM OUT, SCALING, & ASSESSMENT
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'stage-6-zoom-out-assessment',
      stepNumber: 6,
      title: 'STAGE 6 — Complexity Scaling & Assessment',
      explanation:
        'Classical search: O(N) queries. Grover search: O(√N) rounds. For N=4, exactly 1 round. Extra rounds cause overshoot (P(11) collapses back to 25%). Grover is NOT trying everything at once; it is constructive quantum amplitude interference.',
      narrationText:
        "Mastery achieved! You designed, verified, and analyzed Grover's Search Algorithm on the live Workbench, isolating marked state |11⟩ with 100% probability in a single quantum iteration.",
      actions: [],
      circuitSnapshot: {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
          { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
          { id: 'g-s2-cz', gate: 'cz', targets: [0, 1], column: 1 },
          { id: 'g-s3-h0a', gate: 'h', targets: [0], column: 2 },
          { id: 'g-s3-h1a', gate: 'h', targets: [1], column: 2 },
          { id: 'g-s3-x0a', gate: 'x', targets: [0], column: 3 },
          { id: 'g-s3-x1a', gate: 'x', targets: [1], column: 3 },
          { id: 'g-s3-cz', gate: 'cz', targets: [0, 1], column: 4 },
          { id: 'g-s3-x0b', gate: 'x', targets: [0], column: 5 },
          { id: 'g-s3-x1b', gate: 'x', targets: [1], column: 5 },
          { id: 'g-s3-h0b', gate: 'h', targets: [0], column: 6 },
          { id: 'g-s3-h1b', gate: 'h', targets: [1], column: 6 },
          { id: 'g-s4-m0', gate: 'measure', targets: [0], column: 7 },
          { id: 'g-s4-m1', gate: 'measure', targets: [1], column: 7 },
        ],
        measure: true,
        shots: 1000,
      },
    },

    // ══════════════════════════════════════════════════════════════════
    // STAGE 7 — TRANSFER CHALLENGE: Find Box |01⟩ (Stretch S2)
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'stage-7-transfer-challenge',
      stepNumber: 7,
      title: 'STAGE 7 — Transfer Challenge: Find Box |01⟩',
      explanation: TRANSFER_CHALLENGE_DATA.tutorPrompt,
      narrationText: TRANSFER_CHALLENGE_DATA.tutorPrompt,
      actions: [],
      takeover: {
        prompt: TRANSFER_CHALLENGE_DATA.tutorPrompt,
        taskType: 'modify_circuit',
        goalDescription:
          'Wrap X gates around oracle CZ on wire q0 to mark and find box |01⟩ with > 95% probability.',
        instructions: TRANSFER_CHALLENGE_DATA.instructions,
        completionCriteria: {
          type: 'circuit_has_gates',
          requiredGates: ['x', 'cz'],
        },
        customDiagnoser: (circ) => validateGroverTransferChallenge(circ),
        solutionActions: [
          { type: 'add_gate', gate: 'x', targets: [0], column: 1, gateId: 'g-tr-x0a' },
          { type: 'add_gate', gate: 'cz', targets: [0, 1], column: 2, gateId: 'g-tr-cz' },
          { type: 'add_gate', gate: 'x', targets: [0], column: 3, gateId: 'g-tr-x0b' },
          { type: 'run_simulation' },
          { type: 'focus_visualization', panel: 'results' },
        ],
        minFailedAttemptsForSolution: 2,
        successNarration:
          'Transfer challenge mastered! You wrapped X around q[0] to find marked state |01⟩ with 100% probability!',
      },
      circuitSnapshot: {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'g-tr-h0', gate: 'h', targets: [0], column: 0 },
          { id: 'g-tr-h1', gate: 'h', targets: [1], column: 0 },
          { id: 'g-tr-x0a', gate: 'x', targets: [0], column: 1 },
          { id: 'g-tr-cz', gate: 'cz', targets: [0, 1], column: 2 },
          { id: 'g-tr-x0b', gate: 'x', targets: [0], column: 3 },
          { id: 'g-tr-h0b', gate: 'h', targets: [0], column: 4 },
          { id: 'g-tr-h1b', gate: 'h', targets: [1], column: 4 },
          { id: 'g-tr-x0c', gate: 'x', targets: [0], column: 5 },
          { id: 'g-tr-x1c', gate: 'x', targets: [1], column: 5 },
          { id: 'g-tr-cz2', gate: 'cz', targets: [0, 1], column: 6 },
          { id: 'g-tr-x0d', gate: 'x', targets: [0], column: 7 },
          { id: 'g-tr-x1d', gate: 'x', targets: [1], column: 7 },
          { id: 'g-tr-h0c', gate: 'h', targets: [0], column: 8 },
          { id: 'g-tr-h1c', gate: 'h', targets: [1], column: 8 },
          { id: 'g-tr-m0', gate: 'measure', targets: [0], column: 9 },
          { id: 'g-tr-m1', gate: 'measure', targets: [1], column: 9 },
        ],
        measure: true,
        shots: 1000,
      },
    },
  ],
};

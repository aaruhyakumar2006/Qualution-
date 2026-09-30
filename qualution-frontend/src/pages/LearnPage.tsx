import React, { useState, useEffect, useMemo } from 'react';
import {
  Atom,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Trophy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  LogOut,
  Sun,
  Moon,
  Zap,
  Search,
  X,
  Play,
  HelpCircle,
  Clock,
  Check,
  FileText,
  Video,
  Star,
  Users,
  Compass,
  Layers,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';
import {
  QUANTUM_CURRICULUM,
  CURRICULUM_TRACKS,
  type LessonModule,
} from '../features/learning/curriculumData';
import { TheoreticalLessonReader } from '../components/learning/TheoreticalLessonReader';
import {
  getCompletedLessonIds,
  getTotalXP,
} from '../features/learning/assessmentEngine';
import { hasBoardLesson } from '../features/theory/boardLessonRegistry';
import type { CircuitRequest } from '../features/circuit/types';
import AcidSquares from '../components/AcidSquares';
import './LearnPage.css';

export interface PathwayStage {
  id: string;
  num: string;
  title: string;
  short: string;
  count: string;
}

export const PATHWAY_STAGES: PathwayStage[] = [
  { id: 'tracks-overview', num: '01', title: '3 Learning Tracks (12 Modules)', short: '3 Tracks', count: '12 Modules' },
  { id: 'track-1', num: '02', title: 'Track 1 — Foundations (Beginner)', short: 'Track 1', count: '4 Modules' },
  { id: 'track-2', num: '03', title: 'Track 2 — Circuit Design & Algorithms (Intermediate)', short: 'Track 2', count: '4 Modules' },
  { id: 'track-3', num: '04', title: 'Track 3 — Advanced / Variational Algorithms (Advanced)', short: 'Track 3', count: '4 Modules' },
  { id: 'faq', num: '05', title: 'Knowledge Base & FAQ', short: 'Guide & FAQ', count: '4 Q&A' },
];

export interface Sprint1TrackItem {
  id: string;
  moduleId: string;
  stepNumber: string;
  title: string;
  tag: string;
  summary: string;
  duration: string;
  xpReward: number;
  isAssessment?: boolean;
}

export const SPRINT_1_TRACK: Sprint1TrackItem[] = [
  {
    id: 's1-initialize-measure',
    moduleId: 'lesson-1-initialize-measure',
    stepNumber: '01',
    title: 'Initialize & Measure a Qubit',
    tag: 'Basis & State',
    summary: 'Ground state preparation |0⟩ and deterministic computational measurement.',
    duration: '3–4 min',
    xpReward: 100,
  },
  {
    id: 's1-x-gate',
    moduleId: 'lesson-1-bit-flip',
    stepNumber: '02',
    title: 'The Pauli-X Gate (Bit Flip)',
    tag: 'Quantum NOT',
    summary: 'Quantum NOT operation, flipping |0⟩ to |1⟩ with deterministic inversion.',
    duration: '4–5 min',
    xpReward: 150,
  },
  {
    id: 's1-hadamard-superposition',
    moduleId: 'lesson-1-superposition',
    stepNumber: '03',
    title: 'Hadamard Gate & Superposition',
    tag: 'Superposition',
    summary: 'Creating equal superpositions |+⟩ and observing 50/50 measurement statistics.',
    duration: '5–6 min',
    xpReward: 200,
  },
  {
    id: 's1-z-phase',
    moduleId: 'lesson-1-phase',
    stepNumber: '04',
    title: 'Z Gate: Understanding Phase',
    tag: 'Relative Phase',
    summary: 'Relative phase shifts, |+⟩ vs |−⟩, and phase invariance under Z measurement.',
    duration: '5–6 min',
    xpReward: 200,
  },
  {
    id: 's1-gate-ordering',
    moduleId: 'lesson-1-gate-ordering',
    stepNumber: '05',
    title: 'Gate Ordering & Non-Commutativity',
    tag: 'Non-Commutativity',
    summary: 'Why gate order matters: comparing H-X vs X-H with identical histograms but different states.',
    duration: '6–8 min',
    xpReward: 250,
  },
  {
    id: 's1-single-qubit-challenge',
    moduleId: 'lesson-1-single-qubit-challenge',
    stepNumber: '06',
    title: 'Single-Qubit Capstone Challenge',
    tag: 'Capstone',
    summary: 'Multi-step challenges synthesizing target states and predicting measurement distributions.',
    duration: '8–10 min',
    xpReward: 250,
  },
  {
    id: 's1-assessment',
    moduleId: 'lesson-1-sprint-1-assessment',
    stepNumber: '07',
    title: 'Sprint 1 Final Assessment',
    tag: 'Certification',
    summary: 'Comprehensive evaluation of single-qubit quantum concepts and state manipulation.',
    duration: '10–12 min',
    xpReward: 300,
    isAssessment: true,
  },
];

export const SINGLE_QUBIT_TASK_MODULES: Record<string, LessonModule> = {
  's1-initialize-measure': {
    id: 's1-initialize-measure',
    lessonNumber: 1,
    trackId: 'track-1',
    trackTitle: 'Single-Qubit Tasks',
    title: 'Initialize & Measure a Qubit',
    theoryBeat: 'Ground state initialization',
    practicalBeat: 'Verify measurement in computational basis',
    assessmentGate: 'Measure |0⟩ with 100% deterministic probability',
    badge: 'Basis & State',
    difficulty: 'Beginner',
    estimatedMinutes: 4,
    xpReward: 100,
    summary: 'Verify ground state preparation |0⟩ and execute deterministic computational measurement.',
    formula: '|ψ⟩ = |0⟩, P(0) = 1.0',
    formulaDescription: 'Qubits initialize to ground state |0⟩ with deterministic collapse to outcome 0.',
    theoryParagraphs: [
      'In a quantum simulator, every qubit begins in the canonical ground state |0⟩. Performing a computational-basis measurement projects this state onto classical bit outcome 0 with 100% certainty.',
    ],
    keyTakeaways: [
      'Qubits initialize in |0⟩ by default.',
      'Measuring |0⟩ deterministically yields outcome 0.',
    ],
    conceptTags: ['Qubit', 'Ground State', 'Measurement'],
    quiz: {
      question: 'What is the default state of a newly initialized quantum register wire?',
      options: ['|1⟩', '|0⟩', '|+⟩', '|−⟩'],
      correctIndex: 1,
      explanation: 'Quantum registers are initialized to ground state |0⟩ by default.',
    },
    assessment: {
      title: 'Task: Ground State Verification',
      objective: 'Verify that an unperturbed single-qubit wire initialized at |0⟩ produces outcome 0 with 100% measurement probability.',
      instructions: [
        'Keep wire q[0] in its default initialized ground state |0⟩ (no perturbing gates).',
        'Ensure measurement is enabled on wire q[0].',
        'Click "Verify Assessment" to evaluate your circuit and earn 100 XP points.',
      ],
      hint: 'Leave wire q[0] in its ground state |0⟩ and run measurement to verify 100% 0 outcome.',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [],
        measure: true,
        shots: 500,
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        minimumShots: 100,
        targetProbabilities: {
          '0': { min: 0.95, max: 1.0 },
        },
        targetStateDescription: 'Ground State |0⟩ (100% outcome 0)',
      },
    },
  },
  's1-x-gate': {
    id: 's1-x-gate',
    lessonNumber: 2,
    trackId: 'track-1',
    trackTitle: 'Single-Qubit Tasks',
    title: 'The Pauli-X Gate (Bit Flip)',
    theoryBeat: 'Pauli-X NOT rotation',
    practicalBeat: 'Invert |0⟩ to |1⟩ with X gate',
    assessmentGate: 'Synthesize state |1⟩ with ≥ 95% fidelity',
    badge: 'Quantum NOT',
    difficulty: 'Beginner',
    estimatedMinutes: 5,
    xpReward: 150,
    summary: 'Apply the Pauli-X operator to invert the ground state |0⟩ into excited state |1⟩.',
    formula: 'X|0⟩ = |1⟩, X|1⟩ = |0⟩',
    formulaDescription: 'Pauli-X acts as quantum NOT, rotating π radians around the Bloch X-axis.',
    theoryParagraphs: [
      'The Pauli-X gate inverts computational basis states, transforming |0⟩ into |1⟩ with 100% fidelity.',
    ],
    keyTakeaways: [
      'Pauli-X flips |0⟩ to |1⟩ deterministically.',
      'Acts as the quantum equivalent of the classical NOT gate.',
    ],
    conceptTags: ['Pauli-X', 'Bit Flip', 'NOT Gate'],
    quiz: {
      question: 'What is the matrix action of the Pauli-X gate on basis state |0⟩?',
      options: ['Maps |0⟩ to |0⟩', 'Maps |0⟩ to |1⟩', 'Creates an equal superposition', 'Applies a π phase shift'],
      correctIndex: 1,
      explanation: 'X|0⟩ = |1⟩ performs a deterministic bit flip.',
    },
    assessment: {
      title: 'Task: Pauli-X Bit Flip Synthesis',
      objective: 'Synthesize excited state |1⟩ by applying a Pauli-X gate to wire q[0] initialized at |0⟩.',
      instructions: [
        'Place a Pauli-X gate onto wire q[0].',
        'Verify that the state flips to |1⟩ on the Bloch sphere.',
        'Click "Verify Assessment" to confirm 100% outcome 1 and claim your 150 XP points.',
      ],
      hint: 'Drag the X gate from the single-qubit gate palette onto qubit wire q[0].',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [],
        measure: true,
        shots: 500,
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        requiredGates: ['x'],
        minimumShots: 100,
        targetProbabilities: {
          '1': { min: 0.95, max: 1.0 },
        },
        targetStateDescription: 'Excited State |1⟩ (~100% outcome 1)',
      },
    },
  },
  's1-hadamard-superposition': {
    id: 's1-hadamard-superposition',
    lessonNumber: 3,
    trackId: 'track-1',
    trackTitle: 'Single-Qubit Tasks',
    title: 'Hadamard Gate & Superposition',
    theoryBeat: 'Superposition creation',
    practicalBeat: 'Synthesize state |+⟩ with H gate',
    assessmentGate: 'Verify 50/50 measurement distribution',
    badge: 'Superposition',
    difficulty: 'Beginner',
    estimatedMinutes: 6,
    xpReward: 200,
    summary: 'Construct an equal superposition state |+⟩ using Hadamard gate and verify 50/50 measurement collapse.',
    formula: 'H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2',
    formulaDescription: 'Hadamard maps basis state |0⟩ to the equator of the Bloch sphere (+X axis).',
    theoryParagraphs: [
      'The Hadamard operator creates an equal superposition of |0⟩ and |1⟩, resulting in 50% probability of measuring either state.',
    ],
    keyTakeaways: [
      'Hadamard creates equal superposition |+⟩.',
      'Measurement collapses with equal 50% probability.',
    ],
    conceptTags: ['Hadamard', 'Superposition', 'Bloch Sphere'],
    quiz: {
      question: 'What measurement probability distribution does state |+⟩ yield?',
      options: ['100% 0', '100% 1', '50% 0 and 50% 1', '75% 0 and 25% 1'],
      correctIndex: 2,
      explanation: 'State |+⟩ = (|0⟩+|1⟩)/√2 gives |1/√2|² = 0.5 for both outcomes.',
    },
    assessment: {
      title: 'Task: Equal Superposition Generator',
      objective: 'Construct an equal superposition state |+⟩ on wire q[0] and verify a 50/50 probability distribution.',
      instructions: [
        'Place a Hadamard (H) gate on wire q[0].',
        'Observe the Bloch vector pointing along the positive X-axis.',
        'Click "Verify Assessment" to check 50% probability balance and earn 200 XP points.',
      ],
      hint: 'Place an H gate on wire q[0] and run the simulation.',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [],
        measure: true,
        shots: 1000,
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        requiredGates: ['h'],
        minimumShots: 500,
        targetProbabilities: {
          '0': { min: 0.40, max: 0.60 },
          '1': { min: 0.40, max: 0.60 },
        },
        targetStateDescription: 'Equal Superposition |+⟩ (50% |0⟩, 50% |1⟩)',
      },
    },
  },
  's1-z-phase': {
    id: 's1-z-phase',
    lessonNumber: 4,
    trackId: 'track-1',
    trackTitle: 'Single-Qubit Tasks',
    title: 'Z Gate: Understanding Phase',
    theoryBeat: 'Relative quantum phase',
    practicalBeat: 'Synthesize state |−⟩ using H and Z gates',
    assessmentGate: 'Verify phase invariance under Z measurement',
    badge: 'Relative Phase',
    difficulty: 'Beginner',
    estimatedMinutes: 6,
    xpReward: 200,
    summary: 'Apply Pauli-Z to create relative phase shift, converting |+⟩ into |−⟩ without altering measurement magnitudes.',
    formula: 'Z|+⟩ = |−⟩ = (|0⟩ − |1⟩)/√2',
    formulaDescription: 'Pauli-Z leaves |0⟩ invariant and negates the amplitude of |1⟩.',
    theoryParagraphs: [
      'The Pauli-Z gate induces a relative phase of π radians between |0⟩ and |1⟩, rotating equatorial Bloch vectors by 180° around the Z-axis.',
    ],
    keyTakeaways: [
      'Pauli-Z shifts relative phase without altering measurement statistics in the computational basis.',
      'Z maps |+⟩ to |−⟩.',
    ],
    conceptTags: ['Pauli-Z', 'Phase', 'Bloch Sphere'],
    quiz: {
      question: 'How does the Pauli-Z gate alter the state |+⟩ = (|0⟩+|1⟩)/√2?',
      options: ['Flips it to |0⟩', 'Flips it to |1⟩', 'Transforms it into |−⟩ = (|0⟩−|1⟩)/√2', 'Leaves it completely unchanged'],
      correctIndex: 2,
      explanation: 'Z|+⟩ = (|0⟩ − |1⟩)/√2 = |−⟩ by applying a π phase to |1⟩.',
    },
    assessment: {
      title: 'Task: Relative Phase Shift (|−⟩)',
      objective: 'Synthesize state |−⟩ by applying an H gate followed by a Z gate on wire q[0].',
      instructions: [
        'Place a Hadamard (H) gate on wire q[0].',
        'Follow with a Pauli-Z gate on wire q[0].',
        'Observe the Bloch vector rotating to the negative X-axis.',
        'Click "Verify Assessment" to confirm state preparation and claim 200 XP points.',
      ],
      hint: 'Place H then Z on wire q[0]. Both operators are required.',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [],
        measure: true,
        shots: 1000,
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        requiredGates: ['h', 'z'],
        minimumShots: 500,
        targetProbabilities: {
          '0': { min: 0.40, max: 0.60 },
          '1': { min: 0.40, max: 0.60 },
        },
        targetStateDescription: 'Phase State |−⟩ = (|0⟩ − |1⟩)/√2 (Relative phase π)',
      },
    },
  },
  's1-gate-ordering': {
    id: 's1-gate-ordering',
    lessonNumber: 5,
    trackId: 'track-1',
    trackTitle: 'Single-Qubit Tasks',
    title: 'Gate Ordering & Non-Commutativity',
    theoryBeat: 'Operator non-commutativity',
    practicalBeat: 'Sequence H and X gates to prove order matters',
    assessmentGate: 'Synthesize target unitary transformation',
    badge: 'Non-Commutativity',
    difficulty: 'Intermediate',
    estimatedMinutes: 7,
    xpReward: 250,
    summary: 'Prove matrix non-commutativity by sequencing H and X gates to synthesize the target state.',
    formula: '[H, X] = HX − XH ≠ 0',
    formulaDescription: 'Quantum gate operators do not commute in general; order of application determines final state.',
    theoryParagraphs: [
      'Because quantum gates are represented by unitary matrices, their product is generally non-commutative: HX is distinct from XH.',
    ],
    keyTakeaways: [
      'Quantum gate ordering is strictly non-commutative.',
      'HX|0⟩ produces |−⟩, while XH|0⟩ produces |+⟩.',
    ],
    conceptTags: ['Non-Commutativity', 'Matrix Operators', 'Gate Order'],
    quiz: {
      question: 'Why does applying H then X produce a different state than X then H on ground state |0⟩?',
      options: ['Because gates decay over time', 'Because quantum matrix multiplication is non-commutative', 'Because X gate has lower resistance', 'They produce identical states'],
      correctIndex: 1,
      explanation: 'Matrix multiplication is non-commutative: HX ≠ XH, yielding |−⟩ vs |+⟩.',
    },
    assessment: {
      title: 'Task: Gate Order Proof (H·X)',
      objective: 'Synthesize the state resulting from applying an X gate followed by an H gate on wire q[0].',
      instructions: [
        'Place a Pauli-X gate on wire q[0].',
        'Follow immediately with a Hadamard (H) gate on wire q[0].',
        'Verify that both required gates are present in the circuit.',
        'Click "Verify Assessment" to confirm gate order and earn 250 XP points.',
      ],
      hint: 'Place X then H on wire q[0]. Order matters for state synthesis.',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [],
        measure: true,
        shots: 1000,
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        requiredGates: ['x', 'h'],
        minimumShots: 500,
        targetProbabilities: {
          '0': { min: 0.40, max: 0.60 },
          '1': { min: 0.40, max: 0.60 },
        },
        targetStateDescription: 'Non-Commutative Unitary Synthesis (X followed by H)',
      },
    },
  },
  's1-single-qubit-challenge': {
    id: 's1-single-qubit-challenge',
    lessonNumber: 6,
    trackId: 'track-1',
    trackTitle: 'Single-Qubit Tasks',
    title: 'Single-Qubit Capstone Challenge',
    theoryBeat: 'Composite single-qubit synthesis',
    practicalBeat: 'Synthesize bit flip |1⟩ using H and Z gates without lone X gate',
    assessmentGate: 'Synthesize state |1⟩ via H·Z·H equivalence',
    badge: 'Capstone',
    difficulty: 'Intermediate',
    estimatedMinutes: 8,
    xpReward: 250,
    summary: 'Synthesize target bit-flip state |1⟩ using composite single-qubit gates (H·Z·H) without using a lone X gate.',
    formula: 'H·Z·H = X, HZH|0⟩ = |1⟩',
    formulaDescription: 'Unitary equivalence: a Z gate sandwiched between two Hadamards implements a Pauli-X bit flip.',
    theoryParagraphs: [
      'Unitary decomposition reveals deep equivalence in quantum mechanics: conjugating a phase flip Z with Hadamard gates yields an exact Pauli-X bit flip.',
    ],
    keyTakeaways: [
      'Conjugation H·Z·H equals X.',
      'Demonstrates universality and algebraic equivalence of quantum gates.',
    ],
    conceptTags: ['Unitary Equivalence', 'Conjugation', 'Synthesis'],
    quiz: {
      question: 'What quantum operator is algebraically equivalent to H·Z·H?',
      options: ['Identity (I)', 'Pauli-X (NOT)', 'Pauli-Y', 'Phase (S)'],
      correctIndex: 1,
      explanation: 'Conjugating the Z gate by Hadamards flips the axis from Z to X, producing the Pauli-X operator.',
    },
    assessment: {
      title: 'Task: Composite Bit Flip (H·Z·H)',
      objective: 'Synthesize the excited state |1⟩ on wire q[0] using the composite sequence H, Z, H (without a standalone X gate).',
      instructions: [
        'Place a Hadamard (H) gate on wire q[0].',
        'Place a Pauli-Z gate on wire q[0].',
        'Place a second Hadamard (H) gate on wire q[0].',
        'Verify that the composite sequence deterministically flips the qubit to |1⟩.',
        'Click "Verify Assessment" to claim 250 XP points.',
      ],
      hint: 'Construct the sequence H -> Z -> H on wire q[0].',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [],
        measure: true,
        shots: 1000,
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        requiredGates: ['h', 'z'],
        minimumShots: 500,
        targetProbabilities: {
          '1': { min: 0.90, max: 1.0 },
        },
        targetStateDescription: 'State |1⟩ synthesized via H·Z·H unitary equivalence (~100% outcome 1)',
      },
    },
  },
  's1-assessment': {
    id: 's1-assessment',
    lessonNumber: 7,
    trackId: 'track-1',
    trackTitle: 'Single-Qubit Tasks',
    title: 'Sprint 1 Final Assessment',
    theoryBeat: 'Comprehensive Single-Qubit Verification',
    practicalBeat: 'Full single-qubit state synthesis and fidelity certification',
    assessmentGate: 'Pass single-qubit certification criteria with ≥ 95% fidelity',
    badge: 'Certification',
    difficulty: 'Intermediate',
    estimatedMinutes: 10,
    xpReward: 300,
    summary: 'Comprehensive certification challenge evaluating single-qubit state synthesis, gate placement, and measurement fidelity.',
    formula: '|ψ⟩ = α|0⟩ + β|1⟩, F ≥ 0.95',
    formulaDescription: 'Rigorous state verification requiring high-fidelity single-qubit circuit construction.',
    theoryParagraphs: [
      'Sprint 1 culminates in comprehensive practical evaluation: demonstrate full mastery of state initialization, superpositions, and phase rotations.',
    ],
    keyTakeaways: [
      'Single-qubit mastery requires understanding basis states, superpositions, and phases.',
      'Achieving high state fidelity confirms circuit correctness.',
    ],
    conceptTags: ['Certification', 'Fidelity', 'State Preparation'],
    quiz: {
      question: 'Which sequence creates equal superpositions with a relative phase of π on ground state |0⟩?',
      options: ['X then Z', 'H then Z', 'Z then X', 'H then H'],
      correctIndex: 1,
      explanation: 'H creates |+⟩ and Z applies the π relative phase to produce |−⟩.',
    },
    assessment: {
      title: 'Task: Single-Qubit Certification Assessment',
      objective: 'Construct an equal superposition state on wire q[0], verify probability balance and state fidelity ≥ 95% to earn Single-Qubit Certification.',
      instructions: [
        'Place a Hadamard (H) gate on wire q[0].',
        'Verify that measurement distribution shows equal 50/50 balance.',
        'Click "Verify Assessment" to evaluate your circuit and earn your 300 XP Certification Badge!',
      ],
      hint: 'Place an H gate on wire q[0] and verify with at least 500 shots.',
      starterCircuit: {
        qubits: 1,
        classical_bits: 1,
        gates: [],
        measure: true,
        shots: 1000,
      },
      criteria: {
        minQubits: 1,
        maxQubits: 1,
        requiredGates: ['h'],
        minimumShots: 500,
        targetProbabilities: {
          '0': { min: 0.40, max: 0.60 },
          '1': { min: 0.40, max: 0.60 },
        },
        targetStateDescription: 'Certified Superposition State (fidelity ≥ 95%)',
      },
    },
  },
};

export interface QuantumChallengeItem {
  id: string;
  challengeNumber: string;
  category: 'guided' | 'foundation' | 'algorithm' | 'advanced';
  categoryLabel: string;
  title: string;
  badge: string;
  description: string;
  criteriaSummary: string;
  requiredGates?: string[];
  targetState?: string;
  duration: string;
  xpReward: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'task' | 'curriculum' | 'guided';
  guidedLessonId?: string;
  curriculumModuleId?: string;
  taskModule?: LessonModule;
}

export const ALL_QUANTUM_CHALLENGES: QuantumChallengeItem[] = [
  // ── Single-Qubit Tasks & Assessments (Unguided Evaluation Tasks) ────────
  {
    id: 's1-initialize-measure',
    challengeNumber: '01',
    category: 'guided',
    categoryLabel: 'Single-Qubit Task',
    title: 'Initialize & Measure a Qubit',
    badge: 'Basis & State',
    description: 'Ground state preparation |0⟩ and deterministic computational measurement verification.',
    criteriaSummary: 'Circuit initialization, measurement operator placement (100% |0⟩)',
    requiredGates: ['M'],
    targetState: '|0⟩',
    duration: '3–4 min',
    xpReward: 100,
    difficulty: 'Beginner',
    type: 'task',
    taskModule: SINGLE_QUBIT_TASK_MODULES['s1-initialize-measure'],
  },
  {
    id: 's1-x-gate',
    challengeNumber: '02',
    category: 'guided',
    categoryLabel: 'Single-Qubit Task',
    title: 'The Pauli-X Gate (Bit Flip)',
    badge: 'Quantum NOT',
    description: 'Synthesize excited state |1⟩ with Pauli-X gate from ground state |0⟩ with deterministic collapse.',
    criteriaSummary: 'Apply Pauli-X gate to invert ground state to |1⟩ (100% |1⟩)',
    requiredGates: ['X'],
    targetState: '|1⟩',
    duration: '4–5 min',
    xpReward: 150,
    difficulty: 'Beginner',
    type: 'task',
    taskModule: SINGLE_QUBIT_TASK_MODULES['s1-x-gate'],
  },
  {
    id: 's1-hadamard-superposition',
    challengeNumber: '03',
    category: 'guided',
    categoryLabel: 'Single-Qubit Task',
    title: 'Hadamard Gate & Superposition',
    badge: 'Superposition',
    description: 'Construct equal superposition |+⟩ using Hadamard gate and verify 50/50 measurement probabilities.',
    criteriaSummary: 'Apply Hadamard gate, observe 50% |0⟩ and 50% |1⟩ collapse',
    requiredGates: ['H'],
    targetState: '|+⟩',
    duration: '5–6 min',
    xpReward: 200,
    difficulty: 'Beginner',
    type: 'task',
    taskModule: SINGLE_QUBIT_TASK_MODULES['s1-hadamard-superposition'],
  },
  {
    id: 's1-z-phase',
    challengeNumber: '04',
    category: 'guided',
    categoryLabel: 'Single-Qubit Task',
    title: 'Z Gate: Understanding Phase',
    badge: 'Relative Phase',
    description: 'Synthesize phase state |−⟩ using H and Z gates; observe equatorial phase rotation without altering measurement statistics.',
    criteriaSummary: 'Rotate phase on Bloch equator; observe phase invariance',
    requiredGates: ['H', 'Z'],
    targetState: '|−⟩',
    duration: '5–6 min',
    xpReward: 200,
    difficulty: 'Beginner',
    type: 'task',
    taskModule: SINGLE_QUBIT_TASK_MODULES['s1-z-phase'],
  },
  {
    id: 's1-gate-ordering',
    challengeNumber: '05',
    category: 'guided',
    categoryLabel: 'Single-Qubit Task',
    title: 'Gate Ordering & Non-Commutativity',
    badge: 'Non-Commutativity',
    description: 'Demonstrate non-commutative gate ordering by sequencing H and X gates to synthesize the target state.',
    criteriaSummary: 'Compare matrix operators H·X vs X·H; prove non-commutativity',
    requiredGates: ['H', 'X'],
    targetState: 'Order Proof',
    duration: '6–8 min',
    xpReward: 250,
    difficulty: 'Intermediate',
    type: 'task',
    taskModule: SINGLE_QUBIT_TASK_MODULES['s1-gate-ordering'],
  },
  {
    id: 's1-single-qubit-challenge',
    challengeNumber: '06',
    category: 'guided',
    categoryLabel: 'Single-Qubit Task',
    title: 'Single-Qubit Capstone Challenge',
    badge: 'Capstone',
    description: 'Synthesize target bit flip |1⟩ using composite unitary sequence H·Z·H without a lone X gate.',
    criteriaSummary: 'Target state synthesis via composite gate sequence H·Z·H',
    requiredGates: ['H', 'Z'],
    targetState: 'Multi-Target',
    duration: '8–10 min',
    xpReward: 250,
    difficulty: 'Intermediate',
    type: 'task',
    taskModule: SINGLE_QUBIT_TASK_MODULES['s1-single-qubit-challenge'],
  },
  {
    id: 's1-assessment',
    challengeNumber: '07',
    category: 'guided',
    categoryLabel: 'Single-Qubit Task',
    title: 'Sprint 1 Final Assessment',
    badge: 'Certification',
    description: 'Comprehensive single-qubit certification: prepare target superposition state with ≥ 95% fidelity to earn certification.',
    criteriaSummary: 'Pass all single-qubit criteria with ≥ 95% fidelity',
    requiredGates: ['H'],
    targetState: 'Certified',
    duration: '10–12 min',
    xpReward: 300,
    difficulty: 'Intermediate',
    type: 'task',
    taskModule: SINGLE_QUBIT_TASK_MODULES['s1-assessment'],
  },

  // ── Curriculum Foundations (Track 1) ───────────────────────────────────
  {
    id: 'challenge-lesson-1',
    challengeNumber: '08',
    category: 'foundation',
    categoryLabel: 'Track 1 • Foundations',
    title: 'Bit Flip Verification',
    badge: 'Quantum Pioneer',
    description: 'Apply an X gate to ground state |0⟩, observe the bit flip live, and predict deterministic collapse.',
    criteriaSummary: 'Target state |1⟩, 100% probability, fidelity ≥ 95%',
    requiredGates: ['X'],
    targetState: '|1⟩',
    duration: '6 min',
    xpReward: 150,
    difficulty: 'Beginner',
    type: 'curriculum',
    curriculumModuleId: 'lesson-1-bits-vs-qubits',
  },
  {
    id: 'challenge-lesson-2',
    challengeNumber: '09',
    category: 'foundation',
    categoryLabel: 'Track 1 • Foundations',
    title: 'Superposition Generator',
    badge: 'Wave Pioneer',
    description: 'Construct an equal superposition state |+⟩ using Hadamard gate and verify 50/50 measurement probabilities.',
    criteriaSummary: '50% |0⟩ ±5%, 50% |1⟩ ±5%, 1000 shots',
    requiredGates: ['H'],
    targetState: '|+⟩',
    duration: '8 min',
    xpReward: 200,
    difficulty: 'Beginner',
    type: 'curriculum',
    curriculumModuleId: 'lesson-2-superposition-hadamard',
  },
  {
    id: 'challenge-lesson-3',
    challengeNumber: '10',
    category: 'foundation',
    categoryLabel: 'Track 1 • Foundations',
    title: 'Bell State Entangler',
    badge: 'Entanglement Master',
    description: 'Synthesize the maximally entangled Bell state |Φ+⟩ = (|00⟩+|11⟩)/√2 using Hadamard and CNOT gates.',
    criteriaSummary: 'Outcomes 00 and 11 each ~50%, outcomes 01 and 10 forbidden',
    requiredGates: ['H', 'CX'],
    targetState: '|Φ+⟩',
    duration: '10 min',
    xpReward: 250,
    difficulty: 'Beginner',
    type: 'curriculum',
    curriculumModuleId: 'lesson-3-entanglement-bell',
  },
  {
    id: 'challenge-lesson-4',
    challengeNumber: '11',
    category: 'foundation',
    categoryLabel: 'Track 1 • Foundations',
    title: 'Measurement Statistics Verifier',
    badge: 'Probability Virtuoso',
    description: 'Apply rotations to prepare a 75/25 biased state and verify Born rule statistical convergence.',
    criteriaSummary: 'Target outcome 0 ~75%, outcome 1 ~25%, min 1024 shots',
    requiredGates: ['Ry'],
    targetState: 'Biased State',
    duration: '8 min',
    xpReward: 200,
    difficulty: 'Beginner',
    type: 'curriculum',
    curriculumModuleId: 'lesson-4-measurement-probability',
  },

  // ── Curriculum Circuit Design & Algorithms (Track 2) ───────────────────
  {
    id: 'challenge-lesson-5',
    challengeNumber: '12',
    category: 'algorithm',
    categoryLabel: 'Track 2 • Circuit Design',
    title: 'Universal Gate Library Mastery',
    badge: 'Gate Architect',
    description: 'Synthesize arbitrary single-qubit rotations with Clifford+T gate set: H, T, S, and Z.',
    criteriaSummary: 'Target phase angle π/4, target fidelity ≥ 95%',
    requiredGates: ['H', 'T', 'S'],
    targetState: 'Phase π/4',
    duration: '12 min',
    xpReward: 250,
    difficulty: 'Intermediate',
    type: 'curriculum',
    curriculumModuleId: 'lesson-5-gate-library',
  },
  {
    id: 'challenge-lesson-6',
    challengeNumber: '13',
    category: 'algorithm',
    categoryLabel: 'Track 2 • Circuit Design',
    title: 'Circuit Depth Optimization',
    badge: 'Efficiency Engineer',
    description: 'Optimize circuit topology to minimize gate depth and eliminate redundant self-inverse gates.',
    criteriaSummary: 'Circuit depth ≤ 4, gate count ≤ 5, preserve unitary',
    requiredGates: ['H', 'CX', 'X'],
    targetState: 'Depth ≤ 4',
    duration: '10 min',
    xpReward: 250,
    difficulty: 'Intermediate',
    type: 'curriculum',
    curriculumModuleId: 'lesson-6-circuit-complexity',
  },
  {
    id: 'challenge-lesson-7',
    challengeNumber: '14',
    category: 'algorithm',
    categoryLabel: 'Track 2 • Algorithms',
    title: 'Deutsch-Jozsa Oracle Evaluator',
    badge: 'Algorithm Strategist',
    description: 'Implement the Deutsch-Jozsa quantum algorithm to evaluate constant vs balanced oracles in a single query.',
    criteriaSummary: 'Single query distinction with 100% deterministic measurement',
    requiredGates: ['H', 'X', 'CX'],
    targetState: '|00...0⟩ or |1...⟩',
    duration: '15 min',
    xpReward: 300,
    difficulty: 'Intermediate',
    type: 'curriculum',
    curriculumModuleId: 'lesson-7-deutsch-jozsa',
  },
  {
    id: 'challenge-lesson-8',
    challengeNumber: '15',
    category: 'algorithm',
    categoryLabel: 'Track 2 • Algorithms',
    title: "Grover's Search: 2-Qubit Oracle & Diffusion",
    badge: 'Quantum Searcher',
    description: 'Implement phase inversion oracle and Grover diffusion operator to amplify marked state |11⟩ to >90% probability.',
    criteriaSummary: 'Marked state |11⟩ probability ≥ 90%, 1 iteration',
    requiredGates: ['H', 'CZ', 'X', 'Z'],
    targetState: '|11⟩ (Amplify)',
    duration: '15 min',
    xpReward: 300,
    difficulty: 'Intermediate',
    type: 'curriculum',
    curriculumModuleId: 'lesson-8-grovers-search',
  },

  // ── Curriculum Advanced & Variational Algorithms (Track 3) ─────────────
  {
    id: 'challenge-lesson-9',
    challengeNumber: '16',
    category: 'advanced',
    categoryLabel: 'Track 3 • Variational',
    title: 'Parameterized Rotation Synthesis',
    badge: 'Ansatz Specialist',
    description: 'Construct a parameterized hardware-efficient ansatz using Rx, Ry, and entangling layers to span target Hilbert subspace.',
    criteriaSummary: 'Parameterized rotations Rx(θ), Ry(ϕ), CNOT entangling layer',
    requiredGates: ['Rx', 'Ry', 'CX'],
    targetState: 'Variational Subspace',
    duration: '15 min',
    xpReward: 300,
    difficulty: 'Advanced',
    type: 'curriculum',
    curriculumModuleId: 'lesson-9-variational-circuits',
  },
  {
    id: 'challenge-lesson-10',
    challengeNumber: '17',
    category: 'advanced',
    categoryLabel: 'Track 3 • Optimization',
    title: 'Max-Cut 2-Qubit QAOA Ansatz',
    badge: 'Optimization Pioneer',
    description: 'Implement alternating problem Hamiltonian (γ) and transverse field mixer (β) layers for combinatorial graph cut optimization.',
    criteriaSummary: 'Cost unitary U(C, γ), mixer unitary U(B, β), target cut state',
    requiredGates: ['H', 'Rzz', 'Rx'],
    targetState: 'Max-Cut Solution',
    duration: '20 min',
    xpReward: 350,
    difficulty: 'Advanced',
    type: 'curriculum',
    curriculumModuleId: 'lesson-10-qaoa',
  },
  {
    id: 'challenge-lesson-11',
    challengeNumber: '18',
    category: 'advanced',
    categoryLabel: 'Track 3 • Molecular',
    title: 'H2 Molecular Ground State VQE',
    badge: 'Chemistry Pioneer',
    description: 'Synthesize the unitary coupled cluster (UCCD) ansatz and measure Pauli expectation values to compute molecular hydrogen ground energy.',
    criteriaSummary: 'Expectation value ⟨H⟩ within chemical accuracy (1.6 mHartree)',
    requiredGates: ['Ry', 'CX', 'Rz'],
    targetState: 'Ground State |Ψ_0⟩',
    duration: '20 min',
    xpReward: 350,
    difficulty: 'Advanced',
    type: 'curriculum',
    curriculumModuleId: 'lesson-11-vqe',
  },
  {
    id: 'challenge-lesson-12',
    challengeNumber: '19',
    category: 'advanced',
    categoryLabel: 'Track 3 • Mitigation',
    title: 'Zero-Noise Extrapolation (ZNE) Circuit',
    badge: 'Noise Buster',
    description: 'Synthesize unitary pulse folding (scale factor λ=1, 3, 5) and readout error mitigation to recover ideal state fidelity.',
    criteriaSummary: 'Pulse folded unitary scaling, Richardson extrapolation fit',
    requiredGates: ['H', 'CX', 'X'],
    targetState: 'Mitigated Fidelity',
    duration: '18 min',
    xpReward: 350,
    difficulty: 'Advanced',
    type: 'curriculum',
    curriculumModuleId: 'lesson-12-adaptive-execution',
  },
];

interface LearnPageProps {
  initialTheoryLessonId?: string;
  onLaunchIDE: (assessmentCircuit?: CircuitRequest, assessmentData?: LessonModule, guidedLessonId?: string) => void;
  onLaunchTheoryLesson?: (theoryLessonId: string) => void;
  onNavigateHome: () => void;
  onOpenLogin: () => void;
  onOpenSignUp: () => void;
}

export const LearnPage: React.FC<LearnPageProps> = ({
  initialTheoryLessonId,
  onLaunchIDE,
  onLaunchTheoryLesson,
  onNavigateHome,
  onOpenLogin,
  onOpenSignUp,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Completed lessons and XP state
  const [completedIds, setCompletedIds] = useState<string[]>(() => getCompletedLessonIds());
  const [totalXP, setTotalXP] = useState<number>(() => getTotalXP());
  const [selectedLesson, setSelectedLesson] = useState<LessonModule>(QUANTUM_CURRICULUM[0]);
  const [expandedTheoryLessonId, setExpandedTheoryLessonId] = useState<string | null>(QUANTUM_CURRICULUM[0].id);

  // Section Accordion state (all sections open by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'track-1': true,
    'track-2': true,
    'track-3': true,
  });

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quiz interactive state
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number | null>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  // FAQ interactive state
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Scroll back to top
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Challenges filter state
  const [activeChallengeFilter, setActiveChallengeFilter] = useState<'all' | 'guided' | 'foundation' | 'algorithm' | 'advanced'>('all');

  const handleLaunchChallenge = (challenge: QuantumChallengeItem) => {
    if (challenge.taskModule) {
      handleLaunchAssessment(challenge.taskModule);
    } else if (challenge.curriculumModuleId) {
      const matchedModule = QUANTUM_CURRICULUM.find((m) => m.id === challenge.curriculumModuleId);
      if (matchedModule) {
        handleLaunchAssessment(matchedModule);
      }
    } else if (challenge.guidedLessonId && SINGLE_QUBIT_TASK_MODULES[challenge.guidedLessonId]) {
      handleLaunchAssessment(SINGLE_QUBIT_TASK_MODULES[challenge.guidedLessonId]);
    }
  };

  const isChallengeCompleted = (challenge: QuantumChallengeItem): boolean => {
    return (
      completedIds.includes(challenge.id) ||
      (challenge.taskModule ? completedIds.includes(challenge.taskModule.id) : false) ||
      (challenge.curriculumModuleId ? completedIds.includes(challenge.curriculumModuleId) : false) ||
      (challenge.guidedLessonId ? completedIds.includes(challenge.guidedLessonId) : false)
    );
  };

  const filteredChallenges = useMemo(() => {
    if (activeChallengeFilter === 'all') return ALL_QUANTUM_CHALLENGES;
    return ALL_QUANTUM_CHALLENGES.filter((c) => c.category === activeChallengeFilter);
  }, [activeChallengeFilter]);

  useEffect(() => {
    setCompletedIds(getCompletedLessonIds());
    setTotalXP(getTotalXP());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSection = (trackId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [trackId]: !prev[trackId],
    }));
  };

  const areAllSectionsOpen = useMemo(() => {
    return CURRICULUM_TRACKS.every((t) => openSections[t.id]);
  }, [openSections]);

  const toggleAllSections = () => {
    const nextState = !areAllSectionsOpen;
    const updated: Record<string, boolean> = {};
    CURRICULUM_TRACKS.forEach((t) => {
      updated[t.id] = nextState;
    });
    setOpenSections(updated);
  };

  const handleSelectQuizOption = (lessonId: string, optionIdx: number) => {
    setSelectedQuizAnswers((prev) => ({ ...prev, [lessonId]: optionIdx }));
    setQuizSubmitted((prev) => ({ ...prev, [lessonId]: true }));
  };

  // Theory reader modal state
  const parseTheoryLessonId = (): string | null => {
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const qTheory = searchParams.get('theory') || searchParams.get('theoryLesson');
        if (qTheory) return qTheory;
      } catch {
        // Ignore
      }
    }
    return null;
  };

  const [activeTheoryLessonId, setActiveTheoryLessonId] = useState<string | null>(
    () => initialTheoryLessonId || parseTheoryLessonId()
  );

  const handleResumeNextLesson = () => {
    const nextLesson =
      QUANTUM_CURRICULUM.find(
        (m) =>
          !completedIds.includes(m.id) &&
          !(m.id === 'lesson-1-superposition' && completedIds.includes('s1-hadamard-superposition'))
      ) || QUANTUM_CURRICULUM[0];
    setSelectedLesson(nextLesson);
    setExpandedTheoryLessonId(nextLesson.id);

    const parentTrack = CURRICULUM_TRACKS.find((t) => t.modules.some((m) => m.id === nextLesson.id));
    if (parentTrack) {
      setOpenSections((prev) => ({ ...prev, [parentTrack.id]: true }));
    }

    const el = document.getElementById(`module-beat-${nextLesson.id}`) || document.getElementById('tracks-overview');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleOpenTheoryLesson = (theoryId: string) => {
    // These lessons have explicit video entries in the curriculum and should open in the reader
    const isVideoLesson = ['s1-theory-what-is-quantum', 'lesson-1-bits-vs-qubits', 'classical-vs-qubit', 'lesson-8-grovers-search', 's1-theory-grover', 'grover-search'].includes(theoryId);

    if (hasBoardLesson(theoryId) && onLaunchTheoryLesson && !isVideoLesson) {
      onLaunchTheoryLesson(theoryId);
    } else {
      setActiveTheoryLessonId(theoryId);
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ theory: theoryId }, '', `?theory=${theoryId}`);
      }
    }
  };

  const handleCloseTheoryLesson = () => {
    setActiveTheoryLessonId(null);
    setCompletedIds(getCompletedLessonIds());
    setTotalXP(getTotalXP());
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const handleLaunchAssessment = (lesson: LessonModule) => {
    setSelectedLesson(lesson);
    onLaunchIDE(lesson.assessment.starterCircuit, lesson);
  };

  const completedCount = completedIds.length;
  const progressPercent = Math.round((completedCount / QUANTUM_CURRICULUM.length) * 100);

  const whatYouWillLearn = [
    'Transition from classical determinism to quantum statevectors |0⟩ and |1⟩ on the Bloch sphere',
    'Synthesize single and multi-qubit gates (Pauli-X, Y, Z, Hadamard, Phase, CNOT)',
    'Create non-local Bell state entanglement and simulate Quantum Teleportation protocols',
    'Execute real-time quantum circuit simulations with measurement probability collapse',
    'Design algorithmic subroutines: Quantum Fourier Transform (QFT) and Grover Search',
    'Implement Variational Quantum Eigensolver (VQE) ansatze and verify state fidelity ≥ 95%',
  ];

  const faqs = [
    {
      q: 'Do I need prior quantum physics or advanced linear algebra knowledge?',
      a: 'Not at all! Qualution Academy starts with intuitive geometric analogies on the Bloch sphere and vector visualizations before introducing state equations step-by-step.',
    },
    {
      q: 'How does the Quantum Lab verify my circuit during assessments?',
      a: 'When you click "Verify Assessment", your circuit is compiled and executed through our real backend simulation engine (Qiskit Aer / Cirq). The evaluation engine computes state fidelity, checks required operators, ensures sufficient shot sampling, and verifies probability tolerances.',
    },
    {
      q: 'Can I export my completed assessment circuits into Python code?',
      a: 'Yes! In the Quantum Lab IDE, you can view, copy, and export your circuit directly to native Qiskit Python, PennyLane, or OpenQASM 2.0/3.0 format.',
    },
    {
      q: 'How is Quantum XP awarded and saved?',
      a: 'Each hands-on assessment awards between 150 and 350 XP depending on algorithmic complexity. Your achievements, completed modules, and mastery rank are securely stored in your local session and profile.',
    },
  ];

  return (
    <div className="learn-page-landing-style" data-testid="learn-page">
      {/* ── Top Laser Pulse Accent Line (Matches Landing Page) ──────── */}
      <div className="lp-laser-accent-line" aria-hidden="true">
        <div className="lp-laser-track" />
        <div className="lp-laser-glow-pulse" />
      </div>

      {/* ── AcidSquares WebGL Raymarching Corridor (Matches Landing Page) ── */}
      <div className="lp-webgl-background-layer" aria-hidden="true">
        <AcidSquares
          color1="#041226"
          color2="#38bdf8"
          color3="#ffffff"
          detail="medium"
          speed={0.45}
          waveDepth={1}
          zoom={1.25}
          density={8.5}
          glow={1.1}
          exposure={2600}
          spread={0.28}
          stepSize={0.002}
          colorShift={0}
          contrast={1.05}
          brightness={1.0}
          opacity={theme === 'dark' ? 0.72 : 0.25}
          mouseInteraction={true}
          mouseStrength={0.12}
          mouseRadius={0.35}
          blur={0}
          grain={true}
          grainIntensity={0.04}
          lightMode={theme === 'light'}
        />
      </div>

      {/* ── Depth Vignette Overlay (Matches Landing Page) ───────────── */}
      <div className="lp-depth-vignette" aria-hidden="true" />

      {/* ── Subtle Quantum Grid Background (Matches Landing Page) ─── */}
      <div className="lp-grid-backdrop" aria-hidden="true" />

      {/* ══════════════════════════════════════════════════════════════
          1. TOP NAVIGATION BAR (Matches Landing Page)
          ══════════════════════════════════════════════════════════════ */}
      <header className="lp-academy-nav" data-testid="academy-nav">
        <div className="lp-nav-container">
          <div className="lp-nav-left">
            <button
              type="button"
              className="lp-academy-brand"
              onClick={onNavigateHome}
              title="Return to Qualution Home"
              data-testid="academy-brand-btn"
            >
              <div className="lp-brand-copy">
                <span className="lp-brand-main">QUALUTION</span>
                <span className="lp-brand-tag">ACADEMY</span>
              </div>
            </button>

            <nav className="lp-nav-menu">
              <a
                href="#tracks-overview"
                className="lp-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('tracks-overview')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Curriculum (12)
              </a>
              <a
                href="#challenges"
                className="lp-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('challenges')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Challenges ({ALL_QUANTUM_CHALLENGES.length})
              </a>
              <a
                href="#what-you-will-learn"
                className="lp-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('what-you-will-learn')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Core Concepts
              </a>
              <a
                href="#faq"
                className="lp-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                FAQ
              </a>
              <button
                type="button"
                className="lp-nav-lab-button"
                onClick={() => onLaunchIDE()}
                title="Launch Quantum Studio Simulator"
                data-testid="nav-quantum-lab-btn"
              >
                <Cpu size={14} />
                <span>Quantum Lab Studio</span>
              </button>
            </nav>
          </div>

          <div className="lp-nav-right">
            <button
              type="button"
              className="lp-theme-switch-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div className="lp-nav-xp-pill" title="Mastery Experience Points">
              <Trophy size={14} className="lp-xp-icon" />
              <span>{totalXP} XP</span>
            </div>

            {isAuthenticated && user ? (
              <div className="lp-nav-user-cluster" data-testid="academy-user-group">
                <div className="lp-nav-avatar">
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <button
                  type="button"
                  className="lp-nav-logout-btn"
                  onClick={logout}
                  title="Sign out"
                  data-testid="academy-logout-btn"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="lp-nav-auth-actions">
                <button
                  type="button"
                  className="lp-auth-login-btn"
                  onClick={onOpenLogin}
                  data-testid="academy-signin-btn"
                >
                  Log In
                </button>
                <button
                  type="button"
                  className="lp-auth-signup-btn"
                  onClick={onOpenSignUp}
                  data-testid="academy-signup-btn"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          2. GRAND LANDING-PAGE HERO BANNER
          ══════════════════════════════════════════════════════════════ */}
      <section className="lp-academy-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-tagline">
            <span className="lp-pulse-point" />
            <Sparkles size={13} />
            <span>ENTERPRISE QUANTUM COMPUTING ACADEMY</span>
          </div>

          <h1 className="lp-hero-main-title">
            Quantum Computing <span className="lp-gradient-title-text">Academy</span>
          </h1>

          <div className="lp-hero-cta-cluster">
            <button
              type="button"
              className="lp-hero-explore-button"
              onClick={() => {
                document.getElementById('tracks-overview')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Explore Curriculum (12)</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="lp-hero-workbench-button"
              onClick={() => onLaunchIDE()}
              data-testid="hero-open-lab-btn"
            >
              <Cpu size={16} />
              <span>Open Quantum Lab Studio</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. FULL-WIDTH MASTERY & ACTIVE MISSION DASHBOARD
          ══════════════════════════════════════════════════════════════ */}
      <section className="lp-dashboard-strip-section">
        <div className="lp-dashboard-strip-container">
          {/* Left Segment: Mastery Progress */}
          <div className="lp-mastery-segment">
            <div className="lp-segment-header">
              <div className="lp-segment-title-wrap">
                <span className="lp-segment-title">Curriculum Mastery</span>
                <span className="lp-segment-count">
                  {completedCount} of {QUANTUM_CURRICULUM.length} Lessons Completed
                </span>
              </div>
              <span className="lp-segment-percent">{progressPercent}%</span>
            </div>

            <div className="lp-progress-track">
              <div
                className="lp-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="lp-stat-pills-row">
              <div className="lp-stat-box">
                <span className="lp-stat-val">{completedCount}</span>
                <span className="lp-stat-lbl">Assessments Passed</span>
              </div>
              <div className="lp-stat-box">
                <span className="lp-stat-val">+{totalXP}</span>
                <span className="lp-stat-lbl">Quantum XP</span>
              </div>
              <div className="lp-stat-box">
                <span className="lp-stat-val">
                  {completedCount === 12 ? 'Pioneer' : completedCount > 3 ? 'Practitioner' : 'Explorer'}
                </span>
                <span className="lp-stat-lbl">Rank</span>
              </div>
              <button
                type="button"
                className="lp-resume-mission-btn"
                onClick={handleResumeNextLesson}
              >
                <span>{completedCount > 0 ? 'Resume Lesson' : 'Start Course'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right Segment: Active Mission HUD */}
          <div className="lp-hud-segment" data-testid="assessment-sidebar">
            <div className="lp-hud-top-bar">
              <div className="lp-hud-active-tag">
                <span className="lp-hud-live-dot" />
                <span>ACTIVE MISSION HUD • MODULE 0{selectedLesson.lessonNumber}</span>
              </div>
              <span className="lp-hud-xp-badge">+{selectedLesson.xpReward} XP</span>
            </div>

            <h4 className="lp-hud-title">
              {selectedLesson.title}: {selectedLesson.assessment.title}
            </h4>
            <p className="lp-hud-objective">{selectedLesson.assessment.objective}</p>

            <div className="lp-hud-specs-row">
              <span className="lp-spec-pill">Target: {selectedLesson.assessment.criteria.targetStateDescription}</span>
              <span className="lp-spec-pill">Wires: {selectedLesson.assessment.criteria.minQubits} Qubit</span>
              {selectedLesson.assessment.criteria.requiredGates && (
                <span className="lp-spec-pill">
                  Gates: {selectedLesson.assessment.criteria.requiredGates.join(', ').toUpperCase()}
                </span>
              )}
              <span className="lp-spec-pill">Fidelity: ≥ 95%</span>
            </div>

            <div className="lp-hud-actions-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(selectedLesson.id === 'lesson-1-superposition' || selectedLesson.lessonNumber === 1) && (
                <button
                  type="button"
                  className="lp-hud-launch-action-btn guided-btn"
                  onClick={() => onLaunchIDE(undefined, undefined, 's1-hadamard-superposition')}
                  data-testid="hud-launch-guided-lesson-btn"
                  style={{
                    background: 'linear-gradient(135deg, #0f62fe 0%, #0043ce 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                  title="Start Guided Practical Lesson on Workbench"
                >
                  <Sparkles size={15} />
                  <span>Start Guided Lesson</span>
                  <ArrowRight size={15} />
                </button>
              )}
              {(selectedLesson.id === 'lesson-8-grovers-search' || selectedLesson.lessonNumber === 8) && (
                <button
                  type="button"
                  className="lp-hud-launch-action-btn preview-btn"
                  onClick={() => handleOpenTheoryLesson('lesson-8-grovers-search')}
                  data-testid="hud-grover-theory-video-btn"
                  style={{
                    background: 'linear-gradient(135deg, #00f2ff 0%, #0f62fe 100%)',
                    color: '#000000',
                    fontWeight: 700,
                  }}
                  title="Watch 16-scene JSON-driven Grover theory masterclass"
                >
                  <Play size={15} fill="currentColor" />
                  <span>Start Theory Masterclass</span>
                  <ArrowRight size={15} />
                </button>
              )}

              <button
                type="button"
                className="lp-hud-launch-action-btn"
                onClick={() => handleLaunchAssessment(selectedLesson)}
                data-testid="hud-launch-assessment-btn"
              >
                <Cpu size={15} />
                <span>Launch Mission in Quantum Lab</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. "WHAT YOU'LL LEARN" COMPETENCY MATRIX
          ══════════════════════════════════════════════════════════════ */}
      <section className="lp-competency-section" id="what-you-will-learn">
        <div className="lp-competency-container">
          <h2 className="lp-sub-heading">What you'll learn in this curriculum</h2>
          <div className="lp-competency-grid">
            {whatYouWillLearn.map((item, idx) => (
              <div key={idx} className="lp-competency-item">
                <div className="lp-check-wrapper">
                  <Check size={15} className="lp-check-glyph" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. UNIFIED CURRICULUM SYLLABUS: 3 TRACKS (12 MODULES)
          ══════════════════════════════════════════════════════════════ */}
      <section className="lp-curriculum-flow-section" id="tracks-overview" data-testid="tracks-overview">
        <div className="lp-curriculum-flow-container">
          {/* Syllabus Header Bar */}
          <div className="lp-syllabus-control-bar">
            <div>
              <h2 className="lp-sub-heading" style={{ margin: 0 }}>Course Curriculum</h2>
              <div className="lp-syllabus-metrics">
                <span>3 Structured Tracks</span>
                <span className="metric-dot">•</span>
                <span>12 Interactive Modules</span>
                <span className="metric-dot">•</span>
                <span>~2h 15m Total Length</span>
              </div>
            </div>

            <div className="lp-syllabus-actions">
              <button
                type="button"
                className="lp-expand-all-btn"
                onClick={toggleAllSections}
              >
                {areAllSectionsOpen ? 'Collapse all tracks' : 'Expand all tracks'}
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="lp-search-box-row">
            <div className="lp-search-field">
              <Search size={15} className="lp-search-icon" />
              <input
                type="text"
                placeholder="Search topics, gates, or algorithms (e.g. Hadamard, Bell, VQE, Phase)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="lp-search-input-elem"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="lp-clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* 3 Tracks Accordion List */}
          <div className="lp-tracks-container">
            {CURRICULUM_TRACKS.map((track) => {
              const isOpen = openSections[track.id] ?? true;
              const matchingModules = track.modules.filter((m) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  m.title.toLowerCase().includes(q) ||
                  m.summary.toLowerCase().includes(q) ||
                  m.theoryBeat.toLowerCase().includes(q) ||
                  m.practicalBeat.toLowerCase().includes(q) ||
                  m.assessmentGate.toLowerCase().includes(q) ||
                  m.conceptTags.some((tag) => tag.toLowerCase().includes(q))
                );
              });

              if (searchQuery.trim() && matchingModules.length === 0) return null;

              return (
                <div
                  key={track.id}
                  id={track.id}
                  className="lp-track-accordion-card"
                  data-testid={`track-card-${track.id}`}
                >
                  {/* Track Header Bar */}
                  <button
                    type="button"
                    className={`lp-track-header-button ${isOpen ? 'expanded' : ''}`}
                    onClick={() => toggleSection(track.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="lp-track-header-left">
                      <span className="lp-track-chevron">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                      <div className="lp-track-title-group">
                        <span className="lp-track-title">
                          {track.title}
                        </span>
                        <span className={`lp-track-diff-pill ${track.difficulty.toLowerCase()}`}>
                          {track.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="lp-track-header-right">
                      <span>{track.modules.length} modules</span>
                      <span className="metric-dot">•</span>
                      <span>{track.trackNumber === 1 ? '45m' : track.trackNumber === 2 ? '50m' : '40m'}</span>
                    </div>
                  </button>

                  {/* Modules in this Track */}
                  {isOpen && (
                    <div className="lp-modules-flow-list">
                      {matchingModules.map((m) => {
                        const isMastered =
                          completedIds.includes(m.id) ||
                          (m.id === 'lesson-1-superposition' && completedIds.includes('s1-hadamard-superposition')) ||
                          ((m.id === 'lesson-1-bits-vs-qubits' || m.lessonNumber === 1) &&
                            (completedIds.includes('lesson-1-superposition') || completedIds.includes('s1-hadamard-superposition')));
                        const isTheoryExpanded = expandedTheoryLessonId === m.id;
                        const isSelected = selectedLesson.id === m.id;

                        return (
                          <article
                            key={m.id}
                            id={`module-beat-${m.id}`}
                            className={`lp-module-row ${isMastered ? 'mastered' : ''} ${isSelected ? 'active-highlight' : ''}`}
                            data-testid={`module-beat-${m.id}`}
                            onClick={() => setSelectedLesson(m)}
                          >
                            <div className="lp-module-top-row">
                              <div className="lp-module-identity">
                                <span className="lp-module-icon">
                                  {m.lessonNumber === 1 || m.lessonNumber === 8 || m.id === 'lesson-8-grovers-search' ? <Video size={15} /> : <FileText size={15} />}
                                </span>
                                <span className="lp-module-index">0{m.lessonNumber}.</span>
                                <h4 className="lp-module-name">{m.title}</h4>
                              </div>

                              <div className="lp-module-controls">
                                <span className="lp-xp-reward-tag">+{m.xpReward} XP</span>

                                {isMastered ? (
                                  <span
                                    className="lp-status-pill mastered"
                                    data-testid={m.lessonNumber === 1 ? 'status-completed-lesson-1-superposition' : `status-completed-${m.id}`}
                                  >
                                    <CheckCircle2 size={12} /> Mastered
                                  </span>
                                ) : (
                                  <span className="lp-status-pill ready">Ready</span>
                                )}

                                {/* Action Buttons */}
                                {m.lessonNumber === 1 && (
                                  <>
                                    <button
                                      type="button"
                                      className="lp-row-action-btn guided"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onLaunchIDE(undefined, undefined, 's1-hadamard-superposition');
                                      }}
                                      data-testid="launch-guided-lesson-btn-s1"
                                      title="Start Guided Practical Lesson (QUALUTION)"
                                    >
                                      <Sparkles size={12} />
                                      <span>Guided Lesson</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="lp-row-action-btn preview"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenTheoryLesson(m.id);
                                      }}
                                      data-testid="module-1-visual-btn"
                                      title="Watch 4-min JSON-driven visual lesson"
                                    >
                                      <Play size={12} fill="currentColor" />
                                      <span>4-min Lesson</span>
                                    </button>
                                  </>
                                )}

                                {(m.id === 'lesson-8-grovers-search' || m.lessonNumber === 8) && (
                                  <button
                                    type="button"
                                    className="lp-row-action-btn preview"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenTheoryLesson(m.id);
                                    }}
                                    data-testid="module-8-theory-video-btn"
                                    title="Watch 16-scene JSON-driven Grover theory masterclass"
                                  >
                                    <Play size={12} fill="currentColor" />
                                    <span>Theory Video</span>
                                  </button>
                                )}


                                <button
                                  type="button"
                                  className={`lp-row-action-btn notes ${isTheoryExpanded ? 'open' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLesson(m);
                                    setExpandedTheoryLessonId(isTheoryExpanded ? null : m.id);
                                  }}
                                  data-testid={`theory-toggle-${m.id}`}
                                  title="Toggle theory notes and concept quiz"
                                >
                                  <BookOpen size={12} />
                                  <span>{isTheoryExpanded ? 'Hide Notes' : 'Notes & Quiz'}</span>
                                  {isTheoryExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>

                                <button
                                  type="button"
                                  className="lp-row-action-btn assessment"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLaunchAssessment(m);
                                  }}
                                  data-testid={`launch-assessment-btn-${m.id}`}
                                  title="Launch verified hands-on assessment in Quantum Lab"
                                >
                                  <Cpu size={12} />
                                  <span>Practice Lab</span>
                                </button>
                              </div>
                            </div>

                            {/* Summary description */}
                            <p className="lp-module-summary-text">{m.summary}</p>

                            {/* Beat Elements (Theory, Practical, Assessment Gate) */}
                            <div className="lp-module-beats-container">
                              <div className="lp-beat-tag theory">
                                <strong>Theory:</strong> {m.theoryBeat}
                              </div>
                              <div className="lp-beat-tag practical">
                                <strong>Practical:</strong> {m.practicalBeat}
                                <button
                                  type="button"
                                  className="lp-inline-workbench-link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLaunchAssessment(m);
                                  }}
                                  data-testid={`workbench-btn-${m.id}`}
                                >
                                  Apply on Workbench
                                </button>
                              </div>
                              <div className="lp-beat-tag assessment">
                                <strong>Gate:</strong> {m.assessmentGate}
                              </div>
                            </div>

                            {/* Expandable Theory & Quiz Drawer */}
                            {isTheoryExpanded && (
                              <div className="lp-module-drawer" onClick={(e) => e.stopPropagation()}>
                                <div className="lp-drawer-heading">
                                  <BookOpen size={15} />
                                  <span>Theory Takeaways &amp; Concept Check</span>
                                </div>

                                <div className="lp-drawer-text-body">
                                  {m.theoryParagraphs.map((p, idx) => (
                                    <p key={idx}>{p}</p>
                                  ))}
                                </div>

                                <div className="lp-takeaways-highlight">
                                  <h5 className="takeaways-header">Key Theoretical Takeaways</h5>
                                  <ul>
                                    {m.keyTakeaways.map((takeaway, idx) => (
                                      <li key={idx}>{takeaway}</li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Concept Quiz */}
                                <div className="lp-concept-quiz-block">
                                  <div className="lp-quiz-top-bar">
                                    <Award size={14} />
                                    <span>Quick Concept Check</span>
                                  </div>
                                  <p className="lp-quiz-question-text">{m.quiz.question}</p>
                                  <div className="lp-quiz-options-grid">
                                    {m.quiz.options.map((opt, optIdx) => {
                                      const isChosen = selectedQuizAnswers[m.id] === optIdx;
                                      const isCorrect = optIdx === m.quiz.correctIndex;
                                      const submitted = quizSubmitted[m.id];

                                      let optionClass = 'lp-quiz-option-button';
                                      if (submitted) {
                                        if (isCorrect) optionClass += ' correct';
                                        else if (isChosen) optionClass += ' incorrect';
                                      } else if (isChosen) {
                                        optionClass += ' chosen';
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          className={optionClass}
                                          onClick={() => handleSelectQuizOption(m.id, optIdx)}
                                        >
                                          <span className="opt-marker">{String.fromCharCode(65 + optIdx)}</span>
                                          <span className="opt-caption">{opt}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {quizSubmitted[m.id] && (
                                    <div className="lp-quiz-feedback-box">
                                      {selectedQuizAnswers[m.id] === m.quiz.correctIndex ? (
                                        <span className="feedback-msg success">
                                          ✓ Correct! {m.quiz.explanation}
                                        </span>
                                      ) : (
                                        <span className="feedback-msg error">
                                          ✗ Incorrect. Correct answer is {String.fromCharCode(65 + m.quiz.correctIndex)}. {m.quiz.explanation}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. ALL QUANTUM CHALLENGES (Directly Below Curriculum)
          ══════════════════════════════════════════════════════════════ */}
      <section className="lp-challenges-section" id="challenges" data-testid="all-challenges-section">
        <div className="lp-challenges-container">
          {/* Header */}
          <div className="lp-challenges-header">
            <div className="lp-challenges-badge">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>PRACTICAL QUANTUM TASK MISSIONS</span>
            </div>
            <h2 className="lp-challenges-title">Quantum Circuit Challenges &amp; Tasks</h2>
            <p className="lp-challenges-subtitle">
              Hands-on quantum tasks and algorithmic challenges. Build and manipulate quantum circuits to satisfy objective criteria, then verify your circuit in the Quantum IDE to earn Quantum XP points.
            </p>

            {/* Stats Bar */}
            <div className="lp-challenges-stats-bar">
              <div className="lp-cstat">
                <span className="lp-cstat-val">19</span>
                <span className="lp-cstat-lbl">Total Tasks</span>
              </div>
              <div className="lp-cstat-div" />
              <div className="lp-cstat">
                <span className="lp-cstat-val">7</span>
                <span className="lp-cstat-lbl">Single-Qubit Tasks</span>
              </div>
              <div className="lp-cstat-div" />
              <div className="lp-cstat">
                <span className="lp-cstat-val">12</span>
                <span className="lp-cstat-lbl">Algorithmic Tasks</span>
              </div>
              <div className="lp-cstat-div" />
              <div className="lp-cstat">
                <span className="lp-cstat-val">4,450 XP</span>
                <span className="lp-cstat-lbl">Total Mastery XP</span>
              </div>
              <div className="lp-cstat-div" />
              <div className="lp-cstat">
                <span className="lp-cstat-val">95%+</span>
                <span className="lp-cstat-lbl">Target Fidelity</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="lp-challenges-filters" role="tablist">
              <button
                type="button"
                className={`lp-cfilter-btn ${activeChallengeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveChallengeFilter('all')}
                data-testid="filter-all-challenges"
              >
                All Tasks ({ALL_QUANTUM_CHALLENGES.length})
              </button>
              <button
                type="button"
                className={`lp-cfilter-btn ${activeChallengeFilter === 'guided' ? 'active' : ''}`}
                onClick={() => setActiveChallengeFilter('guided')}
                data-testid="filter-guided-challenges"
              >
                Single-Qubit Tasks (7)
              </button>
              <button
                type="button"
                className={`lp-cfilter-btn ${activeChallengeFilter === 'foundation' ? 'active' : ''}`}
                onClick={() => setActiveChallengeFilter('foundation')}
                data-testid="filter-foundation-challenges"
              >
                Foundations (4)
              </button>
              <button
                type="button"
                className={`lp-cfilter-btn ${activeChallengeFilter === 'algorithm' ? 'active' : ''}`}
                onClick={() => setActiveChallengeFilter('algorithm')}
                data-testid="filter-algorithm-challenges"
              >
                Algorithms &amp; Complexity (4)
              </button>
              <button
                type="button"
                className={`lp-cfilter-btn ${activeChallengeFilter === 'advanced' ? 'active' : ''}`}
                onClick={() => setActiveChallengeFilter('advanced')}
                data-testid="filter-advanced-challenges"
              >
                Advanced &amp; Variational (4)
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="lp-challenges-grid" data-testid="challenges-grid">
            {filteredChallenges.map((challenge) => {
              const completed = isChallengeCompleted(challenge);
              return (
                <div
                  key={challenge.id}
                  className={`lp-challenge-card ${completed ? 'completed' : ''}`}
                  data-testid={`challenge-card-${challenge.id}`}
                >
                  <div>
                    <div className="lp-c-top">
                      <div className="lp-c-badges-wrap">
                        <span className="lp-c-num-badge">
                          TASK {challenge.challengeNumber}
                        </span>
                        <span className={`lp-c-cat-badge ${challenge.category}`}>
                          {challenge.categoryLabel}
                        </span>
                      </div>
                      {completed ? (
                        <span className="lp-c-status-done" title="Challenge Task Completed">
                          <Check className="w-3 h-3 text-emerald-400" />
                          Done
                        </span>
                      ) : (
                        <span className="lp-c-status-ready">Ready to Solve</span>
                      )}
                    </div>

                    <div className="lp-c-body">
                      <h3 className="lp-c-title">{challenge.title}</h3>
                      <p className="lp-c-desc">{challenge.description}</p>

                      <div className="lp-c-criteria-box">
                        <div className="lp-c-criteria-row">
                          {challenge.targetState && (
                            <div className="lp-c-target-state">
                              <span className="text-slate-400 font-normal text-xs">Target:</span>
                              <span>{challenge.targetState}</span>
                            </div>
                          )}
                          {challenge.requiredGates && challenge.requiredGates.length > 0 && (
                            <div className="lp-c-gates-list">
                              <span className="text-slate-400 font-normal text-xs">Gates:</span>
                              {challenge.requiredGates.map((g, gi) => (
                                <span key={gi} className="lp-c-gate-chip">
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="lp-c-criteria-summary">
                          {challenge.criteriaSummary}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lp-c-footer">
                    <div className="lp-c-meta">
                      <span className="lp-c-meta-item">
                        <Clock className="w-3.5 h-3.5" />
                        {challenge.duration}
                      </span>
                      <span className="lp-c-meta-item lp-c-xp">
                        <Zap className="w-3.5 h-3.5" />
                        +{challenge.xpReward} XP
                      </span>
                      <span className={`lp-c-difficulty ${challenge.difficulty}`}>
                        {challenge.difficulty}
                      </span>
                    </div>

                    <div className="lp-c-actions">
                      {challenge.curriculumModuleId && (
                        <button
                          type="button"
                          className="lp-c-theory-btn"
                          onClick={() => handleOpenTheoryLesson(challenge.curriculumModuleId!)}
                          title="Read concept theory"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Theory
                        </button>
                      )}
                      <button
                        type="button"
                        className="lp-c-launch-btn"
                        onClick={() => handleLaunchChallenge(challenge)}
                        data-testid={`launch-challenge-btn-${challenge.id}`}
                        title="Start task in Quantum Studio IDE to earn points"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {challenge.type === 'task' ? 'Start Task' : 'Launch Task'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. PREREQUISITES & DESCRIPTION
          ══════════════════════════════════════════════════════════════ */}
      <section className="lp-details-section">
        <div className="lp-details-container">
          <div className="lp-details-block">
            <h3 className="lp-details-title">Requirements &amp; Prerequisites</h3>
            <ul className="lp-details-list">
              <li>No quantum physics or quantum hardware background required. Every concept starts from ground zero.</li>
              <li>Basic high-school algebra (vectors and matrices are taught visually with Bloch sphere representations).</li>
              <li>A modern desktop web browser to access the embedded Quantum Studio IDE (zero installation required).</li>
            </ul>
          </div>

          <div className="lp-details-block">
            <h3 className="lp-details-title">Curriculum Description</h3>
            <p>
              Qualution Academy bridges quantum information theory and practical algorithmic execution.
              Instead of abstract chalkboard derivations, each lesson pairs mathematical formalism with an interactive
              simulation challenge verified on our high-performance quantum backend.
            </p>
            <p>
              From single-qubit superpositions to multi-qubit entanglement and Variational Quantum Eigensolvers (VQE),
              you build and test real circuits with 95%+ fidelity verification.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          7. FREQUENTLY ASKED QUESTIONS
          ══════════════════════════════════════════════════════════════ */}
      <section className="lp-faq-section" id="faq">
        <div className="lp-faq-container">
          <h2 className="lp-sub-heading">Frequently Asked Questions</h2>
          <div className="lp-faq-flow-list">
            {faqs.map((faq, index) => {
              const isOpen = expandedFaqIndex === index;
              return (
                <div key={index} className="lp-faq-card">
                  <button
                    type="button"
                    className="lp-faq-question-btn"
                    onClick={() => setExpandedFaqIndex(isOpen ? null : index)}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <div className="lp-faq-answer-block">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          8. PLATFORM FOOTER
          ══════════════════════════════════════════════════════════════ */}
      <footer className="lp-platform-footer">
        <div className="lp-footer-container">
          <div className="lp-footer-left">
            <Atom size={18} color="var(--lp-accent, #00f0ff)" />
            <span style={{ fontWeight: 800, letterSpacing: '0.12em' }}>QUALUTION ACADEMY</span>
          </div>
          <span className="lp-footer-copy">
            &copy; {new Date().getFullYear()} Qualution Quantum Studio. All quantum simulators operational.
          </span>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          className="lp-back-to-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to Top"
        >
          <ChevronUp size={18} />
        </button>
      )}

      {/* Theoretical Lesson Reader Modal */}
      {activeTheoryLessonId && (
        <TheoreticalLessonReader
          lessonId={activeTheoryLessonId}
          onSelectLesson={handleOpenTheoryLesson}
          onClose={handleCloseTheoryLesson}
          onLaunchPracticalLesson={(lessonId) => onLaunchIDE(undefined, undefined, lessonId)}
        />
      )}
    </div>
  );
};

export default LearnPage;

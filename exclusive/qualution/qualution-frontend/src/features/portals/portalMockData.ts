export interface StudentTopicProgress {
  topicId: string;
  topicName: string;
  category: 'Foundations' | 'Circuits & Multi-Qubit' | 'Algorithms' | 'Advanced';
  status: 'completed' | 'in-progress' | 'locked';
  score: number; // 0 - 100
  theoryMastery: number; // 0 - 100
  circuitApplication: number; // 0 - 100
  circuitsSubmitted: number;
  timeSpentMinutes: number;
  lastAttemptAt: string;
  notes?: string;
}

export interface StudentCognitiveAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  topic: string;
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface StudentCircuitSubmission {
  id: string;
  circuitName: string;
  qubitCount: number;
  gateCount: number;
  codeSnippet: string;
  stateFidelity: number;
  shotsSimulated: number;
  submittedAt: string;
  teacherFeedback?: string;
  status: 'verified' | 'needs-review' | 'partial';
}

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  role: 'student';
  currentStatus: 'active-studio' | 'reviewing-theory' | 'needs-assistance' | 'offline';
  currentActivityDescription: string;
  overallScore: number; // 0 - 100
  overallGrade: string; // 'A+', 'A', 'B+', etc.
  curriculumCompletionPercent: number;
  streakDays: number;
  level: number;
  rankTitle: string;
  
  // Concept vs Application dual metrics
  theoryUnderstandingScore: number; // 0 - 100
  circuitApplicationScore: number; // 0 - 100
  errorDebuggingScore: number; // 0 - 100
  
  topics: StudentTopicProgress[];
  cognitiveAlerts: StudentCognitiveAlert[];
  circuits: StudentCircuitSubmission[];
  lastActive: string;
}

export interface TeacherCohortSummary {
  cohortName: string;
  courseCode: string;
  instructorName: string;
  totalStudents: number;
  activeNowCount: number;
  needsAssistanceCount: number;
  classAverageScore: number;
  averageTheoryMastery: number;
  averageCircuitApplication: number;
  topFallacyInterception: string;
}

export const MOCK_STUDENTS: StudentProfile[] = [
  {
    id: 'std-001',
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@quantum.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    currentStatus: 'active-studio',
    currentActivityDescription: 'Constructing Grover 2-Qubit Oracle with Phase Kickback in Studio',
    overallScore: 92,
    overallGrade: 'A',
    curriculumCompletionPercent: 85,
    streakDays: 8,
    level: 4,
    rankTitle: 'Senior Quantum Algorithmist',
    theoryUnderstandingScore: 94,
    circuitApplicationScore: 89,
    errorDebuggingScore: 86,
    lastActive: 'Just now',
    topics: [
      {
        topicId: 'top-1',
        topicName: 'Qubits & Computational Basis States',
        category: 'Foundations',
        status: 'completed',
        score: 98,
        theoryMastery: 99,
        circuitApplication: 97,
        circuitsSubmitted: 3,
        timeSpentMinutes: 45,
        lastAttemptAt: '2 days ago',
        notes: 'Flawless comprehension of Dirac notation |0⟩ and |1⟩.',
      },
      {
        topicId: 'top-2',
        topicName: 'Hadamard Gate & Superposition',
        category: 'Foundations',
        status: 'completed',
        score: 95,
        theoryMastery: 96,
        circuitApplication: 94,
        circuitsSubmitted: 4,
        timeSpentMinutes: 60,
        lastAttemptAt: 'Yesterday',
        notes: 'Understands H^2 = I destructive interference.',
      },
      {
        topicId: 'top-3',
        topicName: 'Two-Qubit Bell State (|Φ⁺⟩ Entanglement)',
        category: 'Circuits & Multi-Qubit',
        status: 'completed',
        score: 92,
        theoryMastery: 94,
        circuitApplication: 90,
        circuitsSubmitted: 5,
        timeSpentMinutes: 80,
        lastAttemptAt: 'Yesterday',
        notes: 'Successfully generated (|00⟩+|11⟩)/√2 and verified non-local correlation.',
      },
      {
        topicId: 'top-4',
        topicName: 'Quantum Teleportation Protocol',
        category: 'Circuits & Multi-Qubit',
        status: 'completed',
        score: 88,
        theoryMastery: 91,
        circuitApplication: 85,
        circuitsSubmitted: 2,
        timeSpentMinutes: 75,
        lastAttemptAt: '12 hours ago',
        notes: 'Minor initial delay in applying classical Bob feed-forward corrections.',
      },
      {
        topicId: 'top-5',
        topicName: "Grover's Search Algorithm (2-Qubit)",
        category: 'Algorithms',
        status: 'in-progress',
        score: 78,
        theoryMastery: 84,
        circuitApplication: 72,
        circuitsSubmitted: 3,
        timeSpentMinutes: 110,
        lastAttemptAt: 'Active now',
        notes: 'Actively designing the diffusion operator inversion about the mean.',
      },
    ],
    cognitiveAlerts: [
      {
        id: 'cog-1',
        type: 'info',
        topic: "Grover's Oracle",
        title: 'Phase Inversion Resolved',
        description: 'Successfully placed CZ gate to mark target state |11⟩ after reviewing AI hint.',
        timestamp: '18 mins ago',
        resolved: true,
      },
      {
        id: 'cog-2',
        type: 'warning',
        topic: 'Diffusion Operator',
        title: 'Watch Gate Ordering',
        description: 'Student placed H gate before X gate on Q0 during diffusion loop.',
        timestamp: '3 mins ago',
        resolved: false,
      },
    ],
    circuits: [
      {
        id: 'circ-101',
        circuitName: 'Bell State |Φ⁺⟩ Generator',
        qubitCount: 2,
        gateCount: 3,
        codeSnippet: `// 2-Qubit Bell Pair
OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];

h q[0];
cx q[0], q[1];
measure q -> c;`,
        stateFidelity: 99.8,
        shotsSimulated: 2048,
        submittedAt: 'Yesterday, 16:40',
        teacherFeedback: 'Outstanding clean layout. Perfect 50/50 measurement distribution.',
        status: 'verified',
      },
      {
        id: 'circ-102',
        circuitName: "Grover 2-Qubit Oracle (|11⟩)",
        qubitCount: 2,
        gateCount: 7,
        codeSnippet: `// Grover Search Target |11⟩
OPENQASM 2.0;
qreg q[2];
creg c[2];
h q[0];
h q[1];
// Oracle
cz q[0], q[1];
// Diffusion
h q[0]; h q[1];
x q[0]; x q[1];
cz q[0], q[1];`,
        stateFidelity: 96.5,
        shotsSimulated: 4096,
        submittedAt: '25 mins ago',
        status: 'needs-review',
      },
    ],
  },
  {
    id: 'std-002',
    fullName: 'Maya Lin',
    email: 'maya.lin@quantum.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    currentStatus: 'active-studio',
    currentActivityDescription: 'Testing Phase Shift & Hadamard Decoherence in Circuit Analyzer',
    overallScore: 97,
    overallGrade: 'A+',
    curriculumCompletionPercent: 96,
    streakDays: 14,
    level: 5,
    rankTitle: 'Master Quantum Architect',
    theoryUnderstandingScore: 98,
    circuitApplicationScore: 96,
    errorDebuggingScore: 97,
    lastActive: '5 mins ago',
    topics: [
      {
        topicId: 'top-1',
        topicName: 'Qubits & Computational Basis States',
        category: 'Foundations',
        status: 'completed',
        score: 100,
        theoryMastery: 100,
        circuitApplication: 100,
        circuitsSubmitted: 4,
        timeSpentMinutes: 30,
        lastAttemptAt: '5 days ago',
      },
      {
        topicId: 'top-2',
        topicName: 'Hadamard Gate & Superposition',
        category: 'Foundations',
        status: 'completed',
        score: 99,
        theoryMastery: 100,
        circuitApplication: 98,
        circuitsSubmitted: 5,
        timeSpentMinutes: 40,
        lastAttemptAt: '4 days ago',
      },
      {
        topicId: 'top-3',
        topicName: 'Two-Qubit Bell State (|Φ⁺⟩ Entanglement)',
        category: 'Circuits & Multi-Qubit',
        status: 'completed',
        score: 98,
        theoryMastery: 99,
        circuitApplication: 97,
        circuitsSubmitted: 6,
        timeSpentMinutes: 50,
        lastAttemptAt: '3 days ago',
      },
      {
        topicId: 'top-4',
        topicName: 'Quantum Teleportation Protocol',
        category: 'Circuits & Multi-Qubit',
        status: 'completed',
        score: 96,
        theoryMastery: 97,
        circuitApplication: 95,
        circuitsSubmitted: 4,
        timeSpentMinutes: 65,
        lastAttemptAt: '2 days ago',
      },
      {
        topicId: 'top-5',
        topicName: "Grover's Search Algorithm (2-Qubit)",
        category: 'Algorithms',
        status: 'completed',
        score: 95,
        theoryMastery: 97,
        circuitApplication: 93,
        circuitsSubmitted: 4,
        timeSpentMinutes: 80,
        lastAttemptAt: 'Yesterday',
      },
    ],
    cognitiveAlerts: [
      {
        id: 'cog-201',
        type: 'success',
        topic: 'Capstone Assessment',
        title: 'Top Performance Distinction',
        description: 'Completed 2-Qubit Grover with 100% amplification on first simulation pass.',
        timestamp: '1 day ago',
        resolved: true,
      },
    ],
    circuits: [
      {
        id: 'circ-201',
        circuitName: 'Quantum Teleportation Complete Circuit',
        qubitCount: 3,
        gateCount: 8,
        codeSnippet: `// 3-Qubit Quantum Teleportation
h q[1];
cx q[1], q[2];
cx q[0], q[1];
h q[0];
measure q[0] -> c[0];
measure q[1] -> c[1];`,
        stateFidelity: 99.9,
        shotsSimulated: 4096,
        submittedAt: 'Yesterday, 14:15',
        teacherFeedback: 'Flawless execution of Bell basis measurement and reconstruction.',
        status: 'verified',
      },
    ],
  },
  {
    id: 'std-003',
    fullName: 'Alex Chen',
    email: 'alex.chen@quantum.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    currentStatus: 'needs-assistance',
    currentActivityDescription: 'Stuck on Bell State |Ψ⁻⟩ Phase Parity Check in Workbench',
    overallScore: 74,
    overallGrade: 'C+',
    curriculumCompletionPercent: 48,
    streakDays: 3,
    level: 2,
    rankTitle: 'Quantum Practitioner',
    theoryUnderstandingScore: 79,
    circuitApplicationScore: 68,
    errorDebuggingScore: 65,
    lastActive: '12 mins ago',
    topics: [
      {
        topicId: 'top-1',
        topicName: 'Qubits & Computational Basis States',
        category: 'Foundations',
        status: 'completed',
        score: 86,
        theoryMastery: 89,
        circuitApplication: 83,
        circuitsSubmitted: 2,
        timeSpentMinutes: 50,
        lastAttemptAt: '3 days ago',
      },
      {
        topicId: 'top-2',
        topicName: 'Hadamard Gate & Superposition',
        category: 'Foundations',
        status: 'completed',
        score: 75,
        theoryMastery: 82,
        circuitApplication: 68,
        circuitsSubmitted: 3,
        timeSpentMinutes: 70,
        lastAttemptAt: '2 days ago',
        notes: 'Confused relative phase with global phase; needed 2 hints.',
      },
      {
        topicId: 'top-3',
        topicName: 'Two-Qubit Bell State (|Φ⁺⟩ Entanglement)',
        category: 'Circuits & Multi-Qubit',
        status: 'in-progress',
        score: 65,
        theoryMastery: 72,
        circuitApplication: 58,
        circuitsSubmitted: 4,
        timeSpentMinutes: 95,
        lastAttemptAt: 'Active now',
        notes: 'CNOT control/target inverted repeatedly. Needs conceptual intervention.',
      },
    ],
    cognitiveAlerts: [
      {
        id: 'cog-301',
        type: 'warning',
        topic: 'Two-Qubit Entanglement',
        title: 'CNOT Inversion Misconception',
        description: 'Placed target qubit on wire 0 instead of wire 1, resulting in unentangled separable product state.',
        timestamp: '15 mins ago',
        resolved: false,
      },
      {
        id: 'cog-302',
        type: 'warning',
        topic: 'Measurement Collapse',
        title: 'Premature Measurement',
        description: 'Measured qubit q[0] before completing the CNOT entangling gate.',
        timestamp: '8 mins ago',
        resolved: false,
      },
    ],
    circuits: [
      {
        id: 'circ-301',
        circuitName: 'Attempted Bell State |Ψ⁻⟩',
        qubitCount: 2,
        gateCount: 4,
        codeSnippet: `// Attempted Bell State
h q[0];
x q[1];
cx q[1], q[0]; // Error: Inverted control/target
z q[0];`,
        stateFidelity: 61.2,
        shotsSimulated: 1024,
        submittedAt: '30 mins ago',
        teacherFeedback: 'Remember: wire 0 is the control and wire 1 is target. Swap CX indices.',
        status: 'needs-review',
      },
    ],
  },
  {
    id: 'std-004',
    fullName: 'Priya Patel',
    email: 'priya.patel@quantum.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    currentStatus: 'reviewing-theory',
    currentActivityDescription: 'Studying Quantum Teleportation Bell Basis Measurement Notes',
    overallScore: 89,
    overallGrade: 'A-',
    curriculumCompletionPercent: 72,
    streakDays: 6,
    level: 3,
    rankTitle: 'Variational Specialist',
    theoryUnderstandingScore: 92,
    circuitApplicationScore: 86,
    errorDebuggingScore: 88,
    lastActive: '45 mins ago',
    topics: [
      {
        topicId: 'top-1',
        topicName: 'Qubits & Computational Basis States',
        category: 'Foundations',
        status: 'completed',
        score: 95,
        theoryMastery: 96,
        circuitApplication: 94,
        circuitsSubmitted: 2,
        timeSpentMinutes: 35,
        lastAttemptAt: '4 days ago',
      },
      {
        topicId: 'top-2',
        topicName: 'Hadamard Gate & Superposition',
        category: 'Foundations',
        status: 'completed',
        score: 92,
        theoryMastery: 94,
        circuitApplication: 90,
        circuitsSubmitted: 3,
        timeSpentMinutes: 45,
        lastAttemptAt: '3 days ago',
      },
      {
        topicId: 'top-3',
        topicName: 'Two-Qubit Bell State (|Φ⁺⟩ Entanglement)',
        category: 'Circuits & Multi-Qubit',
        status: 'completed',
        score: 88,
        theoryMastery: 90,
        circuitApplication: 86,
        circuitsSubmitted: 3,
        timeSpentMinutes: 60,
        lastAttemptAt: 'Yesterday',
      },
    ],
    cognitiveAlerts: [
      {
        id: 'cog-401',
        type: 'info',
        topic: 'No-Cloning Theorem',
        title: 'Solid Theoretical Insight',
        description: 'Accurately articulated why quantum states cannot be cloned classically in assessment.',
        timestamp: '2 hours ago',
        resolved: true,
      },
    ],
    circuits: [
      {
        id: 'circ-401',
        circuitName: 'Hadamard Interference & Phase Shift',
        qubitCount: 1,
        gateCount: 4,
        codeSnippet: `h q[0];
s q[0];
h q[0];
measure q[0] -> c[0];`,
        stateFidelity: 98.4,
        shotsSimulated: 2048,
        submittedAt: 'Yesterday, 19:20',
        teacherFeedback: 'Great demonstration of phase rotation affecting interference outcome.',
        status: 'verified',
      },
    ],
  },
  {
    id: 'std-005',
    fullName: 'Jordan Lee',
    email: 'jordan.lee@quantum.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    currentStatus: 'active-studio',
    currentActivityDescription: 'Simulating 3-Qubit GHZ State Entanglement with 4096 Shots',
    overallScore: 91,
    overallGrade: 'A',
    curriculumCompletionPercent: 82,
    streakDays: 9,
    level: 4,
    rankTitle: 'Senior Quantum Algorithmist',
    theoryUnderstandingScore: 88,
    circuitApplicationScore: 94,
    errorDebuggingScore: 90,
    lastActive: '3 mins ago',
    topics: [
      {
        topicId: 'top-1',
        topicName: 'Qubits & Computational Basis States',
        category: 'Foundations',
        status: 'completed',
        score: 96,
        theoryMastery: 95,
        circuitApplication: 97,
        circuitsSubmitted: 3,
        timeSpentMinutes: 30,
        lastAttemptAt: '4 days ago',
      },
      {
        topicId: 'top-2',
        topicName: 'Hadamard Gate & Superposition',
        category: 'Foundations',
        status: 'completed',
        score: 93,
        theoryMastery: 90,
        circuitApplication: 96,
        circuitsSubmitted: 4,
        timeSpentMinutes: 45,
        lastAttemptAt: '3 days ago',
      },
      {
        topicId: 'top-3',
        topicName: 'Two-Qubit Bell State (|Φ⁺⟩ Entanglement)',
        category: 'Circuits & Multi-Qubit',
        status: 'completed',
        score: 94,
        theoryMastery: 91,
        circuitApplication: 97,
        circuitsSubmitted: 4,
        timeSpentMinutes: 55,
        lastAttemptAt: '2 days ago',
      },
    ],
    cognitiveAlerts: [
      {
        id: 'cog-501',
        type: 'info',
        topic: 'Multi-Qubit Gates',
        title: 'High Circuit Efficiency',
        description: 'Created 3-Qubit GHZ state with minimal gate depth (depth: 3).',
        timestamp: '40 mins ago',
        resolved: true,
      },
    ],
    circuits: [
      {
        id: 'circ-501',
        circuitName: '3-Qubit GHZ Entangled State',
        qubitCount: 3,
        gateCount: 4,
        codeSnippet: `h q[0];
cx q[0], q[1];
cx q[1], q[2];
measure q -> c;`,
        stateFidelity: 99.2,
        shotsSimulated: 4096,
        submittedAt: 'Today, 11:30',
        teacherFeedback: 'Very efficient gate depth! Verified state (|000⟩+|111⟩)/√2.',
        status: 'verified',
      },
    ],
  },
];

export const MOCK_COHORT_SUMMARY: TeacherCohortSummary = {
  cohortName: 'Quantum Information & Computing 401',
  courseCode: 'PHYS-CS 401 · Fall Cohort',
  instructorName: 'Prof. Katherine Vance',
  totalStudents: 28,
  activeNowCount: 4,
  needsAssistanceCount: 3,
  classAverageScore: 88.6,
  averageTheoryMastery: 89.2,
  averageCircuitApplication: 84.8,
  topFallacyInterception: 'CNOT Target/Control Inversion on Bell States',
};

export interface CollabUser {
  id: string;
  name: string;
  avatar: string;
  role: 'driver' | 'navigator' | 'instructor' | 'peer';
  color: string; // cursor and aura color
  cursorPos?: { x: number; y: number; wireIndex: number; slotIndex: number };
  isSpeaking: boolean;
  isMuted: boolean;
  activeAction?: string;
}

export interface CollabChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'instructor' | 'ai';
  userColor: string;
  text: string;
  timestamp: string;
  circuitSnippet?: string;
  isAiDiagnostic?: boolean;
}

export interface CollabObjective {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedBy?: string;
}

export interface CollabGate {
  id: string;
  name: string;
  wire: number; // 0, 1, 2
  slot: number; // 0, 1, 2, 3, 4
  type: 'H' | 'X' | 'Z' | 'CX_CONTROL' | 'CX_TARGET' | 'CZ' | 'MEASURE';
  targetWire?: number;
  placedBy: string;
}

export interface CollabRoomState {
  roomId: string;
  roomTitle: string;
  cohort: string;
  activeUsers: CollabUser[];
  objectives: CollabObjective[];
  messages: CollabChatMessage[];
  gates: CollabGate[];
  teamSynergyMultiplier: number;
  totalTeamXP: number;
  simulationState: {
    fidelity: number;
    qubits: number;
    shots: number;
    distribution: { state: string; probability: number }[];
  };
}

export const INITIAL_COLLAB_ROOM: CollabRoomState = {
  roomId: 'QL-ENTANGLE-401',
  roomTitle: 'Team Lab: Bell State Entanglement & Teleportation Protocol',
  cohort: 'PHYS-CS 401 · Group Alpha',
  teamSynergyMultiplier: 3.4,
  totalTeamXP: 1450,
  activeUsers: [
    {
      id: 'usr-1',
      name: 'Aarav Sharma',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'driver',
      color: '#38bdf8', // Cyan
      cursorPos: { x: 380, y: 145, wireIndex: 0, slotIndex: 1 },
      isSpeaking: true,
      isMuted: false,
      activeAction: 'Synthesizing H on wire q[0]',
    },
    {
      id: 'usr-2',
      name: 'Maya Lin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'navigator',
      color: '#c084fc', // Violet
      cursorPos: { x: 520, y: 215, wireIndex: 1, slotIndex: 2 },
      isSpeaking: false,
      isMuted: false,
      activeAction: 'Verifying CNOT control/target parity',
    },
    {
      id: 'usr-3',
      name: 'Prof. Katherine Vance',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      role: 'instructor',
      color: '#fbbf24', // Amber / Gold
      cursorPos: { x: 670, y: 180, wireIndex: 0, slotIndex: 3 },
      isSpeaking: false,
      isMuted: true,
      activeAction: 'Reviewing team density matrix',
    },
    {
      id: 'usr-4',
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      role: 'peer',
      color: '#34d399', // Emerald
      cursorPos: { x: 450, y: 310, wireIndex: 2, slotIndex: 1 },
      isSpeaking: false,
      isMuted: true,
      activeAction: 'Observing state vector evolution',
    },
  ],
  objectives: [
    {
      id: 'obj-1',
      title: 'Initialize Qubits in Ground State |00⟩',
      description: 'Reset register to ensure zero thermal noise before unitary manipulation.',
      completed: true,
      completedBy: 'Aarav Sharma',
    },
    {
      id: 'obj-2',
      title: 'Create Superposition on Control Qubit q[0]',
      description: 'Apply Hadamard gate H to map |0⟩ to (|0⟩ + |1⟩)/√2.',
      completed: true,
      completedBy: 'Maya Lin',
    },
    {
      id: 'obj-3',
      title: 'Entangle q[0] and q[1] with CNOT Gate',
      description: 'Connect control wire q[0] to target wire q[1] to create Bell state |Φ⁺⟩.',
      completed: true,
      completedBy: 'Aarav & Maya (Pair)',
    },
    {
      id: 'obj-4',
      title: 'Add Teleportation Alice Bell Measurement',
      description: 'Place CNOT between unknown qubit q[0] and entangled qubit q[1], then H on q[0].',
      completed: false,
    },
    {
      id: 'obj-5',
      title: 'Verify Classical Correlation with 2048 Shots',
      description: 'Achieve >98% state fidelity on synchronized Qiskit Aer simulation.',
      completed: false,
    },
  ],
  messages: [
    {
      id: 'msg-1',
      userId: 'usr-3',
      userName: 'Prof. Katherine Vance',
      userRole: 'instructor',
      userColor: '#fbbf24',
      text: 'Welcome team! For this session, remember to watch the gate ordering. Make sure q[0] is in equal superposition before firing CX.',
      timestamp: '20:45',
    },
    {
      id: 'msg-2',
      userId: 'usr-1',
      userName: 'Aarav Sharma',
      userRole: 'student',
      userColor: '#38bdf8',
      text: 'Got it professor! I just placed the H gate on wire q[0]. Maya, do you want to place the CNOT target?',
      timestamp: '20:46',
    },
    {
      id: 'msg-3',
      userId: 'usr-2',
      userName: 'Maya Lin',
      userRole: 'student',
      userColor: '#c084fc',
      text: 'On it! Placed CX control on q[0] and target on q[1]. Check the state vector: (|00⟩ + |11⟩)/√2 is forming perfectly!',
      timestamp: '20:47',
    },
    {
      id: 'msg-4',
      userId: 'ai-companion',
      userName: 'Erwin AI Copilot',
      userRole: 'ai',
      userColor: '#a78bfa',
      text: '🤖 Cognitive Analysis: Superposition and entangling gates verified. Quantum mutual information between q[0] and q[1] is 2.00 bits (Maximal Entanglement).',
      timestamp: '20:48',
      isAiDiagnostic: true,
    },
    {
      id: 'msg-5',
      userId: 'usr-4',
      userName: 'Alex Chen',
      userRole: 'student',
      userColor: '#34d399',
      text: 'This makes so much sense seeing both cursors wire the circuit in real time. Can I place the measurement gate on q[1]?',
      timestamp: '20:49',
    },
  ],
  gates: [
    { id: 'g-1', name: 'H', wire: 0, slot: 0, type: 'H', placedBy: 'Aarav Sharma' },
    { id: 'g-2', name: 'CX_CTRL', wire: 0, slot: 1, type: 'CX_CONTROL', targetWire: 1, placedBy: 'Maya Lin' },
    { id: 'g-3', name: 'CX_TGT', wire: 1, slot: 1, type: 'CX_TARGET', placedBy: 'Maya Lin' },
    { id: 'g-4', name: 'Z', wire: 0, slot: 2, type: 'Z', placedBy: 'Aarav Sharma' },
    { id: 'g-5', name: 'M', wire: 0, slot: 3, type: 'MEASURE', placedBy: 'Alex Chen' },
    { id: 'g-6', name: 'M', wire: 1, slot: 3, type: 'MEASURE', placedBy: 'Alex Chen' },
  ],
  simulationState: {
    fidelity: 99.8,
    qubits: 3,
    shots: 2048,
    distribution: [
      { state: '|00⟩', probability: 49.8 },
      { state: '|01⟩', probability: 0.1 },
      { state: '|10⟩', probability: 0.1 },
      { state: '|11⟩', probability: 50.0 },
    ],
  },
};

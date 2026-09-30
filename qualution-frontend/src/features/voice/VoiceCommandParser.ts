export type VoiceIntent =
  | { type: 'ADD_GATE'; gate: string; target: number; control?: number }
  | { type: 'REMOVE_GATE'; gate?: string; target?: number }
  | { type: 'CLEAR_CIRCUIT' }
  | { type: 'RUN_CIRCUIT' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'UNKNOWN'; original: string };

const GATE_SYNONYMS: Record<string, string> = {
  'hadamard': 'h',
  'h': 'h',
  'paulix': 'x',
  'pauli x': 'x',
  'x': 'x',
  'not': 'x',
  'pauliy': 'y',
  'pauli y': 'y',
  'y': 'y',
  'pauliz': 'z',
  'pauli z': 'z',
  'z': 'z',
  'phase': 'p',
  's': 's',
  't': 't',
  'cnot': 'cx',
  'controlled not': 'cx',
  'cx': 'cx',
  'cz': 'cz',
  'swap': 'swap'
};

const wordToNumber = (word: string): number | null => {
  const map: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4
  };
  return map[word.toLowerCase()] ?? null;
};

export const parseVoiceCommand = (transcript: string): VoiceIntent => {
  const lower = transcript.toLowerCase().trim();

  // 1. Run commands
  if (lower.includes('run') || lower.includes('simulate') || lower.includes('execute')) {
    return { type: 'RUN_CIRCUIT' };
  }

  // 2. Clear commands
  if (lower.includes('clear') || lower.includes('reset') || lower.includes('empty')) {
    return { type: 'CLEAR_CIRCUIT' };
  }

  // 3. Undo / Redo
  if (lower.includes('undo')) return { type: 'UNDO' };
  if (lower.includes('redo')) return { type: 'REDO' };

  // 4. Add/Place Gate commands
  // Pattern: "add [gate] on [qubit]" or "put [gate] on [qubit]"
  const addMatch = lower.match(/(add|put|place|insert)\s+(?:a\s+)?([a-z\s]+?)\s+(?:gate\s+)?(?:on|at|to)\s+(?:qubit\s+)?([a-z0-9]+)/i);
  if (addMatch) {
    const rawGate = addMatch[2].trim();
    const rawTarget = addMatch[3].trim();
    
    const gateId = GATE_SYNONYMS[rawGate];
    const targetQubit = wordToNumber(rawTarget);

    if (gateId && targetQubit !== null) {
      return { type: 'ADD_GATE', gate: gateId, target: targetQubit };
    }
  }

  // 5. CNOT specific
  // Pattern: "add cnot from [qubit] to [qubit]"
  const cnotMatch = lower.match(/(add|put|place)\s+(cnot|cx|controlled not)\s+(?:from\s+)?(?:qubit\s+)?([a-z0-9]+)\s+to\s+(?:qubit\s+)?([a-z0-9]+)/i);
  if (cnotMatch) {
    const control = wordToNumber(cnotMatch[3]);
    const target = wordToNumber(cnotMatch[4]);
    if (control !== null && target !== null) {
      return { type: 'ADD_GATE', gate: 'cx', control: control, target: target };
    }
  }

  return { type: 'UNKNOWN', original: transcript };
};

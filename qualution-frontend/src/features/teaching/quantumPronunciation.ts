export const quantumPronunciationDict: Record<string, string> = {
  'qubit': 'cue-bit',
  'qubits': 'cue-bits',
  'hadamard': 'had-uh-mard',
  'cnot': 'see-not',
  'c-not': 'see-not',
  'toffoli': 'toff-uh-lee',
  'bloch': 'block',
  'bloch sphere': 'block sphere',
  'pauli': 'pow-lee',
  'pauli-x': 'pow-lee-ex',
  'pauli-y': 'pow-lee-why',
  'pauli-z': 'pow-lee-zee',
  'entanglement': 'en-tang-gull-ment',
  'superposition': 'super-po-zi-shun',
  'decoherence': 'dee-co-here-ence',
  'qiskit': 'kiss-kit',
  'ry': 'are-why',
  'rz': 'are-zee',
  'rx': 'are-ex',
};

/**
 * Applies phonetics mapping to quantum terminology for better TTS pronunciation.
 */
export function applyQuantumPronunciation(text: string): string {
  if (!text) return text;
  
  let result = text;
  
  // Replace tokens regardless of case
  Object.entries(quantumPronunciationDict).forEach(([term, phonetic]) => {
    // Regex matches whole words only, case insensitive
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    result = result.replace(regex, phonetic);
  });
  
  return result;
}

import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';
import type { CircuitExplanation, PatternExplanation, PracticeQuestion } from './learningTypes';
import { GATE_KNOWLEDGE_CATALOG } from './gateKnowledge';

/**
 * Infer educational quantum concepts from circuit composition
 */
export function inferCircuitConcepts(circuit: CircuitRequest): string[] {
  const concepts = new Set<string>();
  const gates = circuit.gates.map((g) => g.gate.toLowerCase());

  if (gates.includes('h')) {
    concepts.add('Superposition');
  }
  if (gates.includes('cx') || gates.includes('cz')) {
    concepts.add('Conditional Operation');
    concepts.add('Entanglement');
  }
  if (gates.some((g) => ['rx', 'ry', 'rz'].includes(g))) {
    concepts.add('Continuous Rotations');
    concepts.add('Bloch Sphere Mapping');
  }
  if (gates.includes('z') || gates.includes('s') || gates.includes('t') || gates.includes('cz')) {
    concepts.add('Quantum Phase');
  }
  if (gates.includes('x') || gates.includes('y')) {
    concepts.add('Bit Flip / Pauli Operators');
  }
  if (gates.includes('swap')) {
    concepts.add('State Permutation & Routing');
  }
  if (circuit.measure) {
    concepts.add('Measurement & Wavefunction Collapse');
  }

  return Array.from(concepts);
}

/**
 * Recognize known quantum circuit patterns (Bell State, GHZ State, etc.)
 */
export function recognizeCircuitPattern(circuit: CircuitRequest): PatternExplanation | null {
  const gates = circuit.gates;
  const nQubits = circuit.qubits;

  // 1. Bell State: Exactly 2 qubits, H(0) followed by CX(0, 1) [or vice-versa]
  if (
    nQubits === 2 &&
    gates.length === 2 &&
    gates[0].gate.toLowerCase() === 'h' &&
    gates[0].targets[0] === 0 &&
    gates[1].gate.toLowerCase() === 'cx' &&
    gates[1].targets[0] === 0 &&
    gates[1].targets[1] === 1
  ) {
    return {
      patternId: 'bell_state',
      name: 'Bell State (|Φ⁺⟩)',
      summary: 'Maximally entangled 2-qubit state: (|00⟩ + |11⟩)/√2.',
      description:
        'Hadamard puts qubit 0 into equal superposition (|0⟩+|1⟩)/√2. The CX gate then flips qubit 1 whenever qubit 0 is |1⟩, entangling both qubits so their measurement outcomes are perfectly correlated.',
      expectedOutcomes: ['|00⟩ ≈ 50%', '|11⟩ ≈ 50%'],
    };
  }

  // 2. GHZ State: n >= 3 qubits, H(0) followed by cascading CX(0, 1), CX(1, 2), ... CX(n-2, n-1)
  if (nQubits >= 3 && gates.length === nQubits && gates[0].gate.toLowerCase() === 'h' && gates[0].targets[0] === 0) {
    let isGHZ = true;
    for (let i = 1; i < gates.length; i++) {
      const g = gates[i];
      if (
        g.gate.toLowerCase() !== 'cx' ||
        g.targets[0] !== i - 1 ||
        g.targets[1] !== i
      ) {
        isGHZ = false;
        break;
      }
    }

    if (isGHZ) {
      const allZeros = '0'.repeat(nQubits);
      const allOnes = '1'.repeat(nQubits);
      return {
        patternId: 'ghz_state',
        name: `${nQubits}-Qubit GHZ State`,
        summary: `Maximally entangled ${nQubits}-qubit state: (|${allZeros}⟩ + |${allOnes}⟩)/√2.`,
        description:
          'Superposition on qubit 0 is propagated across all subsequent qubits using a cascade of CNOT gates, creating a global macroscopic quantum superposition.',
        expectedOutcomes: [`|${allZeros}⟩ ≈ 50%`, `|${allOnes}⟩ ≈ 50%`],
      };
    }
  }

  // 3. Single-Qubit Superposition
  if (nQubits === 1 && gates.length === 1 && gates[0].gate.toLowerCase() === 'h') {
    return {
      patternId: 'single_superposition',
      name: 'Single-Qubit Equal Superposition (|+⟩)',
      summary: 'State: (|0⟩ + |1⟩)/√2 with equal 50% probability.',
      description: 'Hadamard maps the computational ground state |0⟩ into the X-basis eigenstate |+⟩.',
      expectedOutcomes: ['|0⟩ = 50%', '|1⟩ = 50%'],
    };
  }

  // 4. Single-Qubit Bit Flip
  if (nQubits === 1 && gates.length === 1 && gates[0].gate.toLowerCase() === 'x') {
    return {
      patternId: 'single_bit_flip',
      name: 'Excited State (|1⟩)',
      summary: 'Deterministic bit flip from |0⟩ to |1⟩.',
      description: 'Pauli-X inverts the computational basis state with 100% probability.',
      expectedOutcomes: ['|1⟩ = 100%'],
    };
  }

  return null;
}

/**
 * Generate full circuit explanation
 */
export function explainCircuit(
  circuit: CircuitRequest,
  _simulationResult?: CircuitRunResponse | null
): CircuitExplanation {
  const concepts = inferCircuitConcepts(circuit);
  const pattern = recognizeCircuitPattern(circuit);

  const difficultyLevel =
    circuit.qubits <= 2 && circuit.gates.length <= 4
      ? 'Beginner'
      : circuit.qubits <= 5 && circuit.gates.length <= 12
      ? 'Intermediate'
      : 'Advanced';

  const stepExplanations = circuit.gates.map((g, idx) => {
    const knowledge = GATE_KNOWLEDGE_CATALOG[g.gate.toLowerCase()];
    const gateName = knowledge?.name ?? g.gate.toUpperCase();
    const targetText = g.targets.length > 1
      ? `control q[${g.targets[0]}] → target q[${g.targets[1]}]`
      : `q[${g.targets[0]}]`;

    let explanation = knowledge?.beginnerDescription ?? 'Applies quantum operation.';
    if (g.angle !== undefined) {
      explanation += ` Rotates by ${(g.angle / Math.PI).toFixed(2)}π radians.`;
    }

    return {
      step: idx + 1,
      gateName,
      targetText,
      explanation,
    };
  });

  let summary = `This circuit operates on ${circuit.qubits} qubit(s) using ${circuit.gates.length} gate(s).`;
  if (pattern) {
    summary = `Recognized Architecture: ${pattern.name}. ${pattern.description}`;
  } else if (concepts.includes('Entanglement')) {
    summary += ' It includes multi-qubit entangling operations that generate quantum correlations.';
  } else if (concepts.includes('Superposition')) {
    summary += ' It creates quantum superposition states across computational basis vectors.';
  }

  return {
    title: pattern ? pattern.name : `${circuit.qubits}-Qubit Quantum Circuit`,
    learningLevel: difficultyLevel,
    concepts,
    pattern,
    stepExplanations,
    summary,
  };
}

/**
 * Generate deterministic practice questions based on active circuit
 */
export function generatePracticeQuestions(circuit: CircuitRequest): PracticeQuestion[] {
  const questions: PracticeQuestion[] = [];
  const gates = circuit.gates.map((g) => g.gate.toLowerCase());
  const pattern = recognizeCircuitPattern(circuit);

  if (pattern?.patternId === 'bell_state') {
    questions.push({
      id: 'bell_outcomes',
      question: 'Which measurement outcomes are observed for a standard Bell state (|Φ⁺⟩)?',
      options: ['|00⟩ and |11⟩ with ~50% each', '|01⟩ and |10⟩ with ~50% each', '|00⟩ with 100%', 'All four basis states equally'],
      correctIndex: 0,
      explanation: 'The Bell state (|00⟩+|11⟩)/√2 produces correlated outcomes 00 and 11 with equal probability.',
      hint: 'The control qubit in superposition conditionally flips the target qubit.',
    });
  }

  if (gates.includes('h')) {
    questions.push({
      id: 'h_self_inverse',
      question: 'What is the resulting state if you apply two Hadamard gates in sequence to |0⟩ (i.e. H · H |0⟩)?',
      options: ['|0⟩', '|1⟩', '|+⟩', '|−⟩'],
      correctIndex: 0,
      explanation: 'The Hadamard gate is unitary and Hermitian (self-inverse), meaning H² = I. Applying it twice returns to the initial state.',
      hint: 'Hadamard is its own inverse operation.',
    });
  }

  if (gates.includes('cx')) {
    questions.push({
      id: 'cx_condition',
      question: 'Under what condition does a Controlled-NOT (CX) gate flip its target qubit?',
      options: [
        'Only when the control qubit is |1⟩',
        'Only when the control qubit is |0⟩',
        'Always, regardless of control state',
        'Only when both qubits are in superposition',
      ],
      correctIndex: 0,
      explanation: 'CX applies a Pauli-X (NOT) gate to the target qubit if and only if the control qubit evaluates to |1⟩.',
      hint: 'Think of it as a quantum IF statement conditioned on the control qubit.',
    });
  }

  if (gates.some((g) => ['rx', 'ry', 'rz'].includes(g))) {
    questions.push({
      id: 'rotation_axis',
      question: 'How does an Rx(θ) gate affect the state vector on the Bloch sphere?',
      options: [
        'Rotates the state vector around the X-axis by angle θ',
        'Rotates the state vector around the Z-axis by angle θ',
        'Reflects the vector across the equator',
        'Collapses the state vector to +Z',
      ],
      correctIndex: 0,
      explanation: 'Parameterized Pauli rotation gates generate continuous rotations around their respective Cartesian axis on the Bloch sphere.',
      hint: 'The letter in Rx specifies the axis of rotation.',
    });
  }

  // Fallback generic question
  if (questions.length === 0) {
    questions.push({
      id: 'quantum_basis',
      question: 'In standard quantum computing, what is the default initial state of all qubits before gates are applied?',
      options: ['|0⟩ (Ground State)', '|1⟩ (Excited State)', '|+⟩ (Equal Superposition)', 'Random state'],
      correctIndex: 0,
      explanation: 'Quantum registers are initialized in the ground computational basis state |00...0⟩.',
      hint: 'Quantum circuits always start from the ground state.',
    });
  }

  return questions;
}

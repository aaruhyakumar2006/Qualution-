import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';
import type { AssessmentCriteria } from './curriculumData';

export interface AssessmentEvaluationResult {
  passed: boolean;
  fidelityScore: number; // 0 - 100
  title: string;
  summary: string;
  details: string[];
  hints: string[];
}

const STORAGE_COMPLETED_KEY = 'qualution_completed_lessons';
const STORAGE_XP_KEY = 'qualution_total_xp';

export function getCompletedLessonIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_COMPLETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isLessonCompleted(lessonId: string): boolean {
  return getCompletedLessonIds().includes(lessonId);
}

export function markLessonCompleted(lessonId: string, xpGain: number = 200): string[] {
  if (typeof window === 'undefined') return [lessonId];
  try {
    const current = getCompletedLessonIds();
    if (!current.includes(lessonId)) {
      const updated = [...current, lessonId];
      localStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify(updated));

      const currentXP = getTotalXP();
      localStorage.setItem(STORAGE_XP_KEY, String(currentXP + xpGain));
      return updated;
    }
    return current;
  } catch {
    return [lessonId];
  }
}

export function getTotalXP(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_XP_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function resetLearningProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_COMPLETED_KEY);
    localStorage.removeItem(STORAGE_XP_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function diagnoseGroverCircuit(circuit: CircuitRequest): string | null {
  const gates = circuit.gates || [];
  const hasInitH0 = gates.some((g) => g.gate.toLowerCase() === 'h' && g.targets.includes(0) && (g.column === undefined || g.column === 0));
  const hasInitH1 = gates.some((g) => g.gate.toLowerCase() === 'h' && g.targets.includes(1) && (g.column === undefined || g.column === 0));
  const hasCz = gates.some((g) => g.gate.toLowerCase() === 'cz');
  const hasCx = gates.some((g) => g.gate.toLowerCase() === 'cx' || g.gate.toLowerCase() === 'cnot');
  const xGates = gates.filter((g) => g.gate.toLowerCase() === 'x');
  const zGates = gates.filter((g) => g.gate.toLowerCase() === 'z' && g.targets.length === 1);

  if (!hasInitH0 || !hasInitH1) {
    return "Before the Oracle can mark anything, every state needs an equal chance of being the answer. Right now, what state is q[0] and q[1] in at column 0 — and what gate is famous for turning a definite |0⟩ into exactly that equal mix?"
  }
  if (hasCx && !hasCz) {
    return "The Oracle's job is to mark |11⟩ invisibly — without changing any measurement probabilities, only the sign. What does a CNOT actually do to the target qubit? Does that leave the probabilities unchanged?"
  }
  if (zGates.length > 0 && !hasCz) {
    return "A single-qubit Z gate flips the phase of |1⟩ on that wire alone. Think about which computational basis states will actually get a phase flip here — does that match only |11⟩, or other states too?"
  }
  if (xGates.length < 4) {
    return "The Grover diffuser reflects all amplitudes about their average. For that reflection to boost the marked state, the circuit needs to temporarily shift perspective to |00⟩. Which single-qubit gate flips |0⟩ ↔ |1⟩ — and how many of those do you think you'd need for a 2-qubit system?"
  }
  return null;
}

/**
 * Evaluates whether a circuit and its simulation response satisfy the assessment criteria.
 */
export function evaluateAssessment(
  circuit: CircuitRequest,
  runResponse: CircuitRunResponse | null,
  criteria: AssessmentCriteria
): AssessmentEvaluationResult {
  const details: string[] = [];
  const hints: string[] = [];
  let passed = true;

  // 1. Qubit Count Check
  if (circuit.qubits < criteria.minQubits || circuit.qubits > criteria.maxQubits) {
    passed = false;
    details.push(
      `Qubit mismatch: circuit has ${circuit.qubits} qubit(s), but assessment requires ${
        criteria.minQubits === criteria.maxQubits ? criteria.minQubits : `${criteria.minQubits}-${criteria.maxQubits}`
      }.`
    );
    hints.push(`Adjust the qubit wire count in the circuit settings to exactly ${criteria.minQubits}.`);
  } else {
    details.push(`Qubit count: ${circuit.qubits} (satisfied)`);
  }

  // 2. Required Gates Check
  const presentGates = new Set(circuit.gates.map((g) => g.gate.toLowerCase()));
  if (criteria.requiredGates) {
    const missingGates = criteria.requiredGates.filter((g) => !presentGates.has(g.toLowerCase()));
    if (missingGates.length > 0) {
      passed = false;
      details.push(`Missing required quantum operator(s): ${missingGates.map((g) => g.toUpperCase()).join(', ')}.`);
      hints.push(`Your circuit is missing the ${missingGates.map((g) => g.toUpperCase()).join(' & ')} operator(s). Think about what role each of those gates plays in the target quantum state — which qubits need to interact for that operation to make sense?`);
    } else {
      details.push(`Required gates: ${criteria.requiredGates.map((g) => g.toUpperCase()).join(', ')} present.`);
    }
  }

  // 3. Forbidden Gates Check
  if (criteria.forbiddenGates) {
    const usedForbidden = criteria.forbiddenGates.filter((g) => presentGates.has(g.toLowerCase()));
    if (usedForbidden.length > 0) {
      passed = false;
      details.push(`Forbidden gate(s) used: ${usedForbidden.map((g) => g.toUpperCase()).join(', ')}.`);
      hints.push(`Remove the ${usedForbidden.map((g) => g.toUpperCase()).join(', ')} gate(s) from your circuit.`);
    }
  }

  // 4. Max Gate Count Check
  if (criteria.maxGateCount && circuit.gates.length > criteria.maxGateCount) {
    passed = false;
    details.push(`Too many gates: ${circuit.gates.length} used, maximum allowed is ${criteria.maxGateCount}.`);
    hints.push('Optimize your circuit by removing redundant gates.');
  }

  // 4b. Grover Specific Static Misconception Check
  if (criteria.targetStateDescription?.toLowerCase().includes('grover')) {
    const groverDiagnostic = diagnoseGroverCircuit(circuit);
    if (groverDiagnostic) {
      hints.unshift(groverDiagnostic);
    }
  }

  // 5. Simulation Response Evaluation
  if (!runResponse || !runResponse.simulation) {
    passed = false;
    details.push('No simulation output found: circuit must be simulated to verify assessment.');
    hints.push('Click "Set up and run" or "Verify Assessment" to execute your circuit on the quantum simulator.');
    return {
      passed: false,
      fidelityScore: 0,
      title: 'Simulation Required',
      summary: 'Circuit must be executed before quantum verification can take place.',
      details,
      hints
    };
  }

  // Check shots
  const actualShots = runResponse.circuit.shots || runResponse.simulation.shots;
  if (criteria.minimumShots && actualShots < criteria.minimumShots) {
    passed = false;
    details.push(`Insufficient shots: ${actualShots} executed, required minimum is ${criteria.minimumShots}.`);
    hints.push(`Increase shots in the header or run configuration to at least ${criteria.minimumShots}.`);
  }

  // Check measurement probabilities
  const probabilities = runResponse.simulation.probabilities || {};
  let totalProbabilityScore = 1.0;

  if (criteria.targetProbabilities) {
    for (const [state, range] of Object.entries(criteria.targetProbabilities)) {
      const prob = probabilities[state] || 0.0;
      if (prob < range.min || prob > range.max) {
        passed = false;
        details.push(
          `Outcome |${state}⟩ probability is ${(prob * 100).toFixed(1)}%, expected between ${(range.min * 100).toFixed(0)}% and ${(
            range.max * 100
          ).toFixed(0)}%.`
        );
        totalProbabilityScore -= Math.abs(prob - (range.min + range.max) / 2);
      } else {
        details.push(`Outcome |${state}⟩: ${(prob * 100).toFixed(1)}% (within expected range)`);
      }
    }
  }

  // Check forbidden outcomes
  if (criteria.forbiddenOutcomes) {
    for (const state of criteria.forbiddenOutcomes) {
      const prob = probabilities[state] || 0.0;
      if (prob > 0.08) {
        passed = false;
        details.push(`Unexpected leakage into state |${state}⟩: ${(prob * 100).toFixed(1)}% (should be 0%).`);
        totalProbabilityScore -= prob;
        hints.push(`Probability is leaking into |${state}⟩, which should not appear in the target state. For a two-qubit gate, which qubit acts as the control and which as the target? What happens to the outcome if those roles are swapped?`);
      }
    }
  }

  // 6. Specialized Grover Misconception Diagnostics
  if (!passed && criteria.targetStateDescription?.toLowerCase().includes('grover')) {
    const gates = circuit.gates || [];
    const hasInitH0 = gates.some((g) => g.gate.toLowerCase() === 'h' && g.targets.includes(0) && (g.column === undefined || g.column === 0));
    const hasInitH1 = gates.some((g) => g.gate.toLowerCase() === 'h' && g.targets.includes(1) && (g.column === undefined || g.column === 0));
    const hasCz = gates.some((g) => g.gate.toLowerCase() === 'cz');
    const hasCx = gates.some((g) => g.gate.toLowerCase() === 'cx' || g.gate.toLowerCase() === 'cnot');
    const xGates = gates.filter((g) => g.gate.toLowerCase() === 'x');
    const zGates = gates.filter((g) => g.gate.toLowerCase() === 'z' && g.targets.length === 1);

    if (!hasInitH0 || !hasInitH1) {
      hints.unshift("Grover's algorithm needs every possible answer to start with the same chance. Right now, what is the state of your input qubits before the oracle? What gate would give you that equal-probability starting point?");
    } else if (hasCx && !hasCz) {
      hints.unshift("The oracle is supposed to be a 'phase oracle' — it must change a sign, not a bit. What does a CX gate actually do to the target qubit's value? Is that reversible in a way that keeps all measurement outcomes unchanged?");
    } else if (zGates.length > 0 && !hasCz) {
      hints.unshift("A single-qubit Z flips phase on one wire. In a 2-qubit system, how many computational basis states get their phase flipped by that — and should only one of those states be the marked one?");
    } else if (xGates.length < 4) {
      hints.unshift("The diffuser reflects amplitudes about their mean. For it to work correctly, it needs to map the current state to |00⟩ and back. How many qubits do you have, and for each one — what gate swaps |0⟩ and |1⟩?");
    } else {
      hints.unshift("The gate sequence looks nearly right. Trace through the circuit step by step: after the initial superposition, does each stage — oracle, then diffusion — end up on the right wires and in the right order?");
    }
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(totalProbabilityScore * 100)));
  const fidelityScore = passed ? Math.max(95, clampedScore) : Math.min(85, clampedScore);

  return {
    passed,
    fidelityScore,
    title: passed ? 'Assessment Passed! 🎉' : 'Assessment Verification Incomplete',
    summary: passed
      ? `Quantum state verified with ${fidelityScore}% fidelity. Target state ${criteria.targetStateDescription} successfully synthesized.`
      : `Circuit did not meet all verification criteria for ${criteria.targetStateDescription}.`,
    details,
    hints
  };
}

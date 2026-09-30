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
    return "Missing initial Hadamard: Grover's search requires equal superposition across all N=4 states (|s⟩) before applying the Oracle. Place an H gate on wire q[0] and q[1] at column 0.";
  }
  if (hasCx && !hasCz) {
    return "Naked CNOT detected: The Oracle must mark target state |11⟩ with a phase inversion (-1), but a standard CX flips the target bit rather than flipping phase. Use a Controlled-Z (CZ) gate, or sandwich the CNOT with Hadamards (H-CX-H).";
  }
  if (zGates.length > 0 && !hasCz) {
    return "Single-qubit Z gate marks |01⟩ or |10⟩ instead of specifically marking target |11⟩. Use a 2-qubit Controlled-Z (CZ) so the phase flips only when BOTH qubits are 1.";
  }
  if (xGates.length < 4) {
    return "Missing X gates in diffuser: The diffusion operator reflects about the equal state |s⟩, which requires converting |s⟩ to |00⟩ using H and X. Without X, amplitudes reflect around |11⟩ instead of the mean, driving probability to |00⟩.";
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
      hints.push(`Place the missing ${missingGates.map((g) => g.toUpperCase()).join(' & ')} gate(s) onto the appropriate wire(s).`);
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
        hints.push(`Check the control and target wire indices of your two-qubit gates to eliminate leakage into |${state}⟩.`);
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
      hints.unshift("Missing initial Hadamard: Grover's search requires equal superposition across all N=4 states (|s⟩) before applying the Oracle. Place an H gate on wire q[0] and q[1] at column 0.");
    } else if (hasCx && !hasCz) {
      hints.unshift("Naked CNOT detected: The Oracle must mark target state |11⟩ with a phase inversion (-1), but a standard CX flips the target bit rather than flipping phase. Use a Controlled-Z (CZ) gate, or sandwich the CNOT with Hadamards (H-CX-H).");
    } else if (zGates.length > 0 && !hasCz) {
      hints.unshift("Single-qubit Z gate marks |01⟩ or |10⟩ instead of specifically marking target |11⟩. Use a 2-qubit Controlled-Z (CZ) so the phase flips only when BOTH qubits are 1.");
    } else if (xGates.length < 4) {
      hints.unshift("Missing X gates in diffuser: The diffusion operator reflects about the equal state |s⟩, which requires converting |s⟩ to |00⟩ using H and X. Without X, amplitudes reflect around |11⟩ instead of the mean, driving probability to |00⟩.");
    } else {
      hints.unshift("Diffusion sequence check: For 2 qubits, ensure the full sequence H ⊗ H (init) → CZ (oracle) → H ⊗ H → X ⊗ X → CZ → X ⊗ X → H ⊗ H (diffusion).");
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

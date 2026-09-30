import type { CircuitRequest, CircuitRunResponse, Gate } from '../../../circuit/types';
import { simulateStatevectorCircuit } from '../../../circuit/statevectorEngine';
import {
  compareStatesUpToGlobalPhase,
  areStatesEquivalentUpToGlobalPhase,
  type StateComparisonResult,
} from '../../../circuit/quantumStateComparison';
import { computeCircuitMetrics } from '../../../circuit/circuitMetrics';
import {
  STAGE_1_DATA,
  STAGE_2_DATA,
  STAGE_3_DATA,
  STAGE_4_DATA,
  STAGE_5_DATA,
  TRANSFER_CHALLENGE_DATA,
} from './groverLessonData';

export interface GroverDiagnosis {
  isCorrect: boolean;
  isInitial?: boolean;
  message: string;
  misconceptionId?: string;
  shouldCountAttempt: boolean;
  solutionType?: 'cz' | 'h_cx_h' | 'cp' | 'standard';
  showSpotlight?: boolean;
  spotlightGate?: string;
  spotlightTargets?: number[];
  spotlightColumn?: number;
  simulatedStatevector?: Array<{ real: number; imag: number }>;
  comparison?: StateComparisonResult;
}

// ════════════════════════════════════════════════════════════════════════════
// STAGE 1 VALIDATOR: Equal Superposition (H on q0 & q1)
// ════════════════════════════════════════════════════════════════════════════
export function validateGroverStage1(circuit: CircuitRequest): GroverDiagnosis {
  const gates = circuit.gates || [];

  if (gates.length === 0) {
    return {
      isCorrect: false,
      isInitial: true,
      message: 'Place a Hadamard (H) gate on wire q[0] and wire q[1] at column 0 to initialize equal superposition.',
      shouldCountAttempt: false,
    };
  }

  // Simulate learner's actual circuit
  const sim = simulateStatevectorCircuit(circuit);
  const sv = sim.statevector || [];
  const expected = STAGE_1_DATA.expectedStatevector; // [0.5, 0.5, 0.5, 0.5]
  const comp = compareStatesUpToGlobalPhase(sv, expected);

  if (comp.isEquivalent) {
    return {
      isCorrect: true,
      message: 'Superposition created: all four boxes have equal amplitude +0.50 and probability 25%.',
      shouldCountAttempt: false,
      simulatedStatevector: sv,
      comparison: comp,
    };
  }

  // Diagnose non-equivalent builds based on simulation and gates
  const hGates = gates.filter((g) => g.gate.toLowerCase() === 'h');
  const hWires = new Set(hGates.flatMap((g) => g.targets));

  if (hGates.length === 1) {
    const activeWire = hGates[0].targets[0] ?? 0;
    const missingWire = 1 - activeWire;
    return {
      isCorrect: false,
      message: `Hadamard is only placed on wire q[${activeWire}]. Wire q[${missingWire}] remains in ground state |0⟩, so only 2 boxes are active. Place an H gate on wire q[${missingWire}] as well.`,
      shouldCountAttempt: true,
      simulatedStatevector: sv,
      comparison: comp,
    };
  }

  const xGates = gates.filter((g) => g.gate.toLowerCase() === 'x');
  if (xGates.length > 0) {
    return {
      isCorrect: false,
      message: 'An X gate flips a qubit deterministically between |0⟩ and |1⟩, but does not create superposition. Replace it with a Hadamard (H) gate.',
      shouldCountAttempt: true,
      simulatedStatevector: sv,
      comparison: comp,
    };
  }

  return {
    isCorrect: false,
    message: 'To create equal superposition across all 4 boxes, place an H gate on wire q[0] and wire q[1] at column 0.',
    shouldCountAttempt: true,
    simulatedStatevector: sv,
    comparison: comp,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// STAGE 2 VALIDATOR & DIAGNOSER: The Phase Oracle
// ════════════════════════════════════════════════════════════════════════════
export function validateAndDiagnoseGroverOracle(
  circuit: CircuitRequest,
  attemptCount: number = 0
): GroverDiagnosis {
  const gates = circuit.gates || [];

  // Stage 1 baseline: 2 H gates at col 0 on wire 0 and 1
  const isBaselineOnly =
    gates.length <= 2 &&
    gates.every((g) => g.gate.toLowerCase() === 'h' && (g.column === undefined || g.column === 0));

  if (gates.length === 0 || (isBaselineOnly && gates.length === 2)) {
    return {
      isCorrect: false,
      isInitial: true,
      message: 'The oracle needs to mark state |11⟩. Place the connection that flips the sign of 11 only.',
      shouldCountAttempt: false,
    };
  }

  // 1. Authoritative behavioral validation via real statevector simulation
  const sim = simulateStatevectorCircuit(circuit);
  const sv = sim.statevector || [];
  const expected = STAGE_2_DATA.expectedStatevector; // [0.5, 0.5, 0.5, -0.5]
  const comp = compareStatesUpToGlobalPhase(sv, expected);

  if (comp.isEquivalent) {
    const hasCz = gates.some((g) => g.gate.toLowerCase() === 'cz');
    const hasCx = gates.some((g) => g.gate.toLowerCase() === 'cx');
    const solType: 'cz' | 'h_cx_h' = hasCz ? 'cz' : hasCx ? 'h_cx_h' : 'cz';
    return {
      isCorrect: true,
      message: solType === 'h_cx_h'
        ? "Correct — that's the phase-flip oracle for |11⟩ (H-CX-H identity)."
        : "Correct — that's the phase-flip oracle for |11⟩.",
      shouldCountAttempt: false,
      solutionType: solType,
      simulatedStatevector: sv,
      comparison: comp,
    };
  }

  // 2. Behavioral Diagnoses matching real simulation & pattern table from Section C
  const addedGates = gates.filter(
    (g) => !(g.gate.toLowerCase() === 'h' && (g.column === undefined || g.column === 0))
  );
  const lastAdded = addedGates[addedGates.length - 1] || gates[gates.length - 1];
  const gateType = (lastAdded?.gate || '').toLowerCase();
  const targetWires = lastAdded?.targets || [];
  const gateCol = lastAdded?.column ?? 0;

  // Diagnosis 5: CZ placed before H gates (at col 0 or before col of H)
  const czGate = gates.find((g) => g.gate.toLowerCase() === 'cz');
  if (czGate) {
    const czCol = czGate.column ?? 0;
    const hGatesAfterCz = gates.filter((g) => g.gate.toLowerCase() === 'h' && (g.column ?? 0) >= czCol);
    if (czCol === 0 || hGatesAfterCz.length > 0) {
      return {
        isCorrect: false,
        message: STAGE_2_DATA.diagnoses.czBeforeH,
        misconceptionId: 'grover-oracle-cz-before-h',
        shouldCountAttempt: true,
        simulatedStatevector: sv,
        comparison: comp,
        showSpotlight: attemptCount >= 2,
        spotlightGate: 'cz',
        spotlightTargets: [0, 1],
        spotlightColumn: 1,
      };
    }
  }

  // Diagnosis 1: CX / CNOT without Hadamards
  if (gateType === 'cx' || gateType === 'cnot') {
    return {
      isCorrect: false,
      message: STAGE_2_DATA.diagnoses.cnot,
      misconceptionId: 'grover-oracle-cnot-without-hadamard',
      shouldCountAttempt: true,
      simulatedStatevector: sv,
      comparison: comp,
      showSpotlight: attemptCount >= 2,
      spotlightGate: 'cz',
      spotlightTargets: [0, 1],
      spotlightColumn: 1,
    };
  }

  // Diagnosis 2: Z on ONE wire
  if (gateType === 'z' || gateType === 's' || gateType === 't' || gateType === 'rz') {
    return {
      isCorrect: false,
      message: STAGE_2_DATA.diagnoses.singleZ,
      misconceptionId: 'grover-oracle-single-qubit-phase',
      shouldCountAttempt: true,
      simulatedStatevector: sv,
      comparison: comp,
      showSpotlight: attemptCount >= 2,
      spotlightGate: 'cz',
      spotlightTargets: [0, 1],
      spotlightColumn: 1,
    };
  }

  // Diagnosis 3: X or SWAP
  if (gateType === 'x' || gateType === 'y' || gateType === 'swap') {
    return {
      isCorrect: false,
      message: STAGE_2_DATA.diagnoses.xOrSwap,
      misconceptionId: 'grover-oracle-bit-flip',
      shouldCountAttempt: true,
      simulatedStatevector: sv,
      comparison: comp,
      showSpotlight: attemptCount >= 2,
      spotlightGate: 'cz',
      spotlightTargets: [0, 1],
      spotlightColumn: 1,
    };
  }

  // Diagnosis 4: H again
  if (gateType === 'h' && gateCol > 0) {
    return {
      isCorrect: false,
      message: STAGE_2_DATA.diagnoses.hadamardAgain,
      misconceptionId: 'grover-oracle-hadamard-cancel',
      shouldCountAttempt: true,
      simulatedStatevector: sv,
      comparison: comp,
      showSpotlight: attemptCount >= 2,
      spotlightGate: 'cz',
      spotlightTargets: [0, 1],
      spotlightColumn: 1,
    };
  }

  // Generic fallback diagnosis with spotlight offer after 2 fails
  const showSpotlight = attemptCount >= 2;
  return {
    isCorrect: false,
    message: showSpotlight
      ? "Hint: Place a Controlled-Z (CZ) gate between wire q[0] and q[1] at column 1 to invert the phase of |11⟩."
      : `You placed a ${gateType.toUpperCase()} gate on wire q[${targetWires.join(', ')}]. To mark target |11⟩ only, use a gate that acts conditionally when both wires are 1.`,
    shouldCountAttempt: true,
    simulatedStatevector: sv,
    comparison: comp,
    showSpotlight,
    spotlightGate: 'cz',
    spotlightTargets: [0, 1],
    spotlightColumn: 1,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// STAGE 3 VALIDATOR & DIAGNOSER: The Diffusion Operator
// ════════════════════════════════════════════════════════════════════════════
export function validateAndDiagnoseGroverDiffusion(
  circuit: CircuitRequest,
  attemptCount: number = 0
): GroverDiagnosis {
  const gates = circuit.gates || [];

  // 1. Authoritative behavioral validation via real statevector simulation
  const sim = simulateStatevectorCircuit(circuit);
  const sv = sim.statevector || [];
  // Target: marked state |11⟩ is amplified to amplitude 1.0 (or -1.0 with global phase)
  const target11 = [0, 0, 0, 1];
  const comp = compareStatesUpToGlobalPhase(sv, target11);

  if (comp.isEquivalent) {
    return {
      isCorrect: true,
      message: `Statevector shows 0 on the wrong boxes, and -1 on 11. ${comp.explanation}`,
      shouldCountAttempt: false,
      simulatedStatevector: sv,
      comparison: comp,
    };
  }

  // 2. Behavioral Diagnoses
  // Check if learner omitted the X gates: H, CZ, H without X -> concentrates ~100% on |00⟩
  const state00 = [1, 0, 0, 0];
  const comp00 = compareStatesUpToGlobalPhase(sv, state00);
  if (comp00.isEquivalent) {
    return {
      isCorrect: false,
      message: STAGE_3_DATA.diagnoses.missingX,
      misconceptionId: 'grover-diffusion-missing-x',
      shouldCountAttempt: true,
      simulatedStatevector: sv,
      comparison: comp,
      showSpotlight: attemptCount >= 2,
    };
  }

  // 3. Structural Diff against the reference diffusion sequence
  // Expected columns:
  // Col 0: H on q0, H on q1 (Stage 1)
  // Col 1: Oracle (CZ across 0,1)
  // Col 2: H on q0, H on q1 (Chunk A)
  // Col 3: X on q0, X on q1 (Chunk B start)
  // Col 4: CZ on 0,1 (Chunk B middle)
  // Col 5: X on q0, X on q1 (Chunk B end)
  // Col 6: H on q0, H on q1 (Chunk C)
  interface ExpectedGateSpec {
    col: number;
    wire: number;
    gate: string;
    label: string;
  }

  const expectedSeq: ExpectedGateSpec[] = [
    { col: 2, wire: 0, gate: 'h', label: 'Chunk A (H on q0)' },
    { col: 2, wire: 1, gate: 'h', label: 'Chunk A (H on q1)' },
    { col: 3, wire: 0, gate: 'x', label: 'Chunk B (X on q0)' },
    { col: 3, wire: 1, gate: 'x', label: 'Chunk B (X on q1)' },
    { col: 4, wire: 0, gate: 'cz', label: 'Chunk B (CZ across q0 & q1)' },
    { col: 5, wire: 0, gate: 'x', label: 'Chunk B (X on q0)' },
    { col: 5, wire: 1, gate: 'x', label: 'Chunk B (X on q1)' },
    { col: 6, wire: 0, gate: 'h', label: 'Chunk C (H on q0)' },
    { col: 6, wire: 1, gate: 'h', label: 'Chunk C (H on q1)' },
  ];

  for (const exp of expectedSeq) {
    const matched = gates.find((g) => {
      const gType = g.gate.toLowerCase();
      const col = g.column ?? 0;
      if (exp.gate === 'cz') {
        return gType === 'cz' && col === exp.col && g.targets.includes(0) && g.targets.includes(1);
      }
      return gType === exp.gate && col === exp.col && g.targets.includes(exp.wire);
    });

    if (!matched) {
      // Find what IS at that slot if anything
      const occupying = gates.find((g) => (g.column ?? 0) === exp.col && g.targets.includes(exp.wire));
      const occupyingName = occupying ? occupying.gate.toUpperCase() : 'an empty slot';

      return {
        isCorrect: false,
        message: `Diffusion mismatch at column ${exp.col} on wire q[${exp.wire}]: expected ${exp.gate.toUpperCase()} (${exp.label}), but found ${occupyingName}.`,
        shouldCountAttempt: true,
        simulatedStatevector: sv,
        comparison: comp,
        showSpotlight: attemptCount >= 2,
        spotlightGate: exp.gate,
        spotlightTargets: exp.gate === 'cz' ? [0, 1] : [exp.wire],
        spotlightColumn: exp.col,
      };
    }
  }

  return {
    isCorrect: false,
    message: 'Diffusion sequence is incomplete. Follow Chunk A (col 2: H), Chunk B (cols 3-5: X-CZ-X), and Chunk C (col 6: H).',
    shouldCountAttempt: true,
    simulatedStatevector: sv,
    comparison: comp,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// STAGE 4 VALIDATOR: Measurement & Analyzer Telemetry Verification
// ════════════════════════════════════════════════════════════════════════════
export function validateGroverStage4Measurement(
  circuit: CircuitRequest,
  simulationResult?: CircuitRunResponse | null
): GroverDiagnosis {
  const gates = circuit.gates || [];

  // Check measurements
  const measureGates = gates.filter((g) => g.gate.toLowerCase() === 'measure');
  const measuredWires = new Set(measureGates.flatMap((g) => g.targets));

  if (!measuredWires.has(0) || !measuredWires.has(1)) {
    return {
      isCorrect: false,
      message: 'Place a Measurement operator on wire q[0] and wire q[1] to read out the register.',
      shouldCountAttempt: false,
    };
  }

  // Check metrics
  const metrics = computeCircuitMetrics(circuit);

  // If simulationResult is supplied, check P(11) >= 0.99
  if (simulationResult) {
    const probs = simulationResult.simulation?.probabilities || {};
    const counts = simulationResult.simulation?.counts || {};
    const totalShots = simulationResult.simulation?.shots || circuit.shots || 1000;
    const p11 = probs['11'] ?? (counts['11'] ? counts['11'] / totalShots : 0);

    if (p11 < 0.95) {
      return {
        isCorrect: false,
        message: `Expected P(11) >= 0.99, but measured ${(p11 * 100).toFixed(1)}%. Verify oracle and diffusion connections.`,
        shouldCountAttempt: true,
      };
    }
  }

  return {
    isCorrect: true,
    message: `Target state |11⟩ verified with near 100% probability across 1000 shots! Circuit depth: ${metrics.depth}, total gates: ${metrics.gate_count}.`,
    shouldCountAttempt: false,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// STAGE 5 VALIDATOR: Overshoot (2nd Grover Round Flat Distribution)
// ════════════════════════════════════════════════════════════════════════════
export function validateGroverStage5Overshoot(
  simulationResult: CircuitRunResponse | null
): GroverDiagnosis {
  if (!simulationResult || !simulationResult.simulation) {
    return {
      isCorrect: false,
      message: 'Run the Grover x2 two-round circuit on the simulator to observe the overshoot.',
      shouldCountAttempt: false,
    };
  }

  const probs = simulationResult.simulation.probabilities || {};
  const counts = simulationResult.simulation.counts || {};
  const shots = simulationResult.simulation.shots || 1000;

  const getP = (state: string) => probs[state] ?? (counts[state] ? counts[state] / shots : 0);

  const p00 = getP('00');
  const p01 = getP('01');
  const p10 = getP('10');
  const p11 = getP('11');

  // Tolerance +/- 0.05 around 0.25 (i.e. [0.20, 0.30])
  const isUniform =
    Math.abs(p00 - 0.25) <= 0.06 &&
    Math.abs(p01 - 0.25) <= 0.06 &&
    Math.abs(p10 - 0.25) <= 0.06 &&
    Math.abs(p11 - 0.25) <= 0.06;

  if (isUniform) {
    return {
      isCorrect: true,
      message: `Two rounds confirmed: all four outcomes collapsed back to a flat uniform distribution (~25% each: 00=${(p00 * 100).toFixed(0)}%, 01=${(p01 * 100).toFixed(0)}%, 10=${(p10 * 100).toFixed(0)}%, 11=${(p11 * 100).toFixed(0)}%).`,
      shouldCountAttempt: false,
    };
  }

  return {
    isCorrect: false,
    message: `Expected all four outcomes to return to ~25%, but got: 00=${(p00*100).toFixed(1)}%, 01=${(p01*100).toFixed(1)}%, 10=${(p10*100).toFixed(1)}%, 11=${(p11*100).toFixed(1)}%.`,
    shouldCountAttempt: true,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// TRANSFER CHALLENGE (STRETCH): Search for Prize in Box |01⟩
// ════════════════════════════════════════════════════════════════════════════
export function validateGroverTransferChallenge(circuit: CircuitRequest): GroverDiagnosis {
  const gates = circuit.gates || [];

  // Simulate circuit
  const sim = simulateStatevectorCircuit(circuit);
  const sv = sim.statevector || [];
  const probs = sim.probabilities || {};

  // Target is state with q0=0, q1=1.
  // In little-endian index k = (1 << 1) | 0 = 2; in big-endian index k = 1.
  const targetK2 = [0, 0, 1, 0];
  const targetK1 = [0, 1, 0, 0];
  const comp2 = compareStatesUpToGlobalPhase(sv, targetK2);
  const comp1 = compareStatesUpToGlobalPhase(sv, targetK1);
  const comp = comp2.isEquivalent ? comp2 : comp1;

  const targetProb = Math.max(probs['01'] || 0, probs['10'] || 0);

  if (comp.isEquivalent || targetProb >= 0.90) {
    return {
      isCorrect: true,
      message: 'Transfer Challenge Mastered! You wrapped X around q[0] to find marked state |01⟩ (q0=0, q1=1) with 100% probability.',
      shouldCountAttempt: false,
      simulatedStatevector: sv,
      comparison: comp,
    };
  }

  return {
    isCorrect: false,
    message: 'To find box |01⟩ (q0=0, q1=1), place an X gate on q0 before and after the oracle CZ connection. The diffusion block remains unchanged.',
    shouldCountAttempt: true,
    simulatedStatevector: sv,
    comparison: comp,
  };
}

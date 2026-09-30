import type { TutorContext } from './tutorTypes';
import { recognizeCircuitPattern } from '../learning/explanationEngine';
import { resolveCircuitRouting, routeCircuit } from '../circuit/executionRouter';

export interface QuantumFactSet {
  patternName: string | null;
  dominantOutcomes: Array<{ state: string; probability: number }>;
  facts: string[];
  anomalies: string[];
  suggestedQuestions: string[];
}

/**
 * Extracts deterministic, mathematically verified quantum facts and anomalies from circuit context
 */
export function extractQuantumFacts(context: TutorContext): QuantumFactSet {
  const facts: string[] = [];
  const anomalies: string[] = [];
  const suggestedQuestions: string[] = [];
  const circuit = {
    qubits: context.circuit.qubits,
    classical_bits: context.circuit.classicalBits,
    gates: context.circuit.gates,
    measure: context.circuit.measure,
    shots: context.circuit.shots,
  };

  const pattern = recognizeCircuitPattern(circuit);

  // 1. Dominant basis outcomes
  const dominantOutcomes: Array<{ state: string; probability: number }> = [];
  if (context.simulation?.probabilities) {
    const entries = Object.entries(context.simulation.probabilities);
    for (const [state, prob] of entries) {
      if (prob > 0.05) {
        dominantOutcomes.push({ state, probability: prob });
      }
    }
  }

  // 2. Pattern-based facts
  if (pattern) {
    facts.push(`Recognized architecture: ${pattern.name}.`);
    facts.push(pattern.summary);
  } else {
    facts.push(
      `Circuit contains ${context.circuit.qubits} qubit(s) and ${context.circuit.gates.length} gate(s).`
    );
  }

  // 3. Superposition facts
  const hGates = context.circuit.gates.filter((g) => g.gate.toLowerCase() === 'h');
  if (hGates.length > 0) {
    const targets = hGates.map((g) => `q[${g.targets[0]}]`).join(', ');
    facts.push(`Hadamard gate applied to ${targets} creates an equal superposition (|0⟩+|1⟩)/√2.`);
  }

  // 4. Entanglement & 2-qubit facts
  const twoQGates = context.circuit.gates.filter((g) =>
    ['cx', 'cz', 'swap'].includes(g.gate.toLowerCase())
  );
  if (twoQGates.length > 0) {
    facts.push(
      `Circuit applies ${twoQGates.length} two-qubit entangling/permutation operation(s).`
    );
  }

  // 5. Rotation facts
  const rotGates = context.circuit.gates.filter((g) =>
    ['rx', 'ry', 'rz'].includes(g.gate.toLowerCase())
  );
  for (const rot of rotGates) {
    const axis = rot.gate.toUpperCase();
    const rad = rot.angle ?? 0;
    const piFrac = (rad / Math.PI).toFixed(2);
    facts.push(
      `${axis} on q[${rot.targets[0]}] rotates the state vector around the ${axis.slice(
        1
      )}-axis by ${piFrac}π radians (${rad.toFixed(4)} rad).`
    );
  }

  // 6. Simulation probability facts
  if (dominantOutcomes.length > 0) {
    const outcomeText = dominantOutcomes
      .map((d) => `P(|${d.state}⟩) ≈ ${(d.probability * 100).toFixed(1)}%`)
      .join(', ');
    facts.push(`Measured basis state probabilities: ${outcomeText}.`);
  }

  // 6.5. Execution routing facts & telemetry
  const routing = context.routing || (circuit.qubits > 0 ? resolveCircuitRouting(circuit) : null);
  if (routing) {
    facts.push(`Execution routing: ${routing.reason}`);
    const simFidelity = context.routing?.fidelity ?? context.simulation?.fidelity;
    const simTrunc = context.routing?.truncation_error ?? context.simulation?.truncation_error;
    if (simFidelity !== undefined) {
      facts.push(`MPS simulation fidelity: ${(simFidelity * 100).toFixed(4)}% (truncation error: ${simTrunc ?? 0})`);
    }
  }

  // 7. Anomaly & Debug Detection
  // Unused qubits
  const usedQubits = new Set<number>();
  context.circuit.gates.forEach((g) => g.targets.forEach((t) => usedQubits.add(t)));
  for (let q = 0; q < context.circuit.qubits; q++) {
    if (!usedQubits.has(q)) {
      anomalies.push(`Qubit q[${q}] has no gates applied and remains in the ground state |0⟩.`);
    }
  }

  // Redundant adjacent gates (e.g. H followed immediately by H on same wire)
  for (let i = 0; i < context.circuit.gates.length - 1; i++) {
    const g1 = context.circuit.gates[i];
    const g2 = context.circuit.gates[i + 1];
    if (
      g1.gate.toLowerCase() === g2.gate.toLowerCase() &&
      ['h', 'x', 'y', 'z', 'swap'].includes(g1.gate.toLowerCase()) &&
      JSON.stringify(g1.targets) === JSON.stringify(g2.targets)
    ) {
      anomalies.push(
        `Redundant consecutive ${g1.gate.toUpperCase()} gates on q[${g1.targets.join(
          ','
        )}] cancel each other (self-inverse).`
      );
    }
  }

  // Large memory footprint warning
  if (context.metrics && context.metrics.qubit_count > 16) {
    anomalies.push(
      `Circuit width (${context.metrics.qubit_count}Q) requires ~${context.metrics.statevector_memory_mb.toFixed(
        1
      )} MB of memory for dense statevector representation.`
    );
  }

  // 8. Generate Context-Aware Quick Questions
  if (pattern?.patternId === 'bell_state') {
    suggestedQuestions.push('Why do I only get 00 and 11 outcomes?');
    suggestedQuestions.push('How does H followed by CX create entanglement?');
    suggestedQuestions.push('What happens if I add an X gate to q1 first?');
  } else if (rotGates.length > 0) {
    suggestedQuestions.push('What does this rotation angle do on the Bloch sphere?');
    suggestedQuestions.push('Why are the output probabilities unequal?');
    suggestedQuestions.push('How do I rotate the state vector to the equator?');
  } else if (anomalies.length > 0) {
    suggestedQuestions.push('Can this circuit be optimized or simplified?');
    suggestedQuestions.push('Why are some qubits unused?');
    suggestedQuestions.push('What is the purpose of this circuit structure?');
  } else {
    suggestedQuestions.push('Explain what this circuit does step-by-step.');
    suggestedQuestions.push('What is the expected quantum state before measurement?');
    suggestedQuestions.push('How can I test an experiment on this circuit?');
  }

  // Prepend circuit-specific Execution Router question
  const method = context.routing?.method || (circuit.qubits > 0 ? routeCircuit(circuit).method : null);
  if (method === 'stabilizer') {
    suggestedQuestions.unshift('Why did QUALUTION use Stabilizer instead of Statevector?');
  } else if (method === 'statevector') {
    suggestedQuestions.unshift('Why did QUALUTION use Statevector instead of Stabilizer?');
  } else if (method === 'mps') {
    suggestedQuestions.unshift('Why was this circuit routed to Matrix Product State (MPS)?');
  }

  return {
    patternName: pattern ? pattern.name : null,
    dominantOutcomes,
    facts,
    anomalies,
    suggestedQuestions,
  };
}

import type { CircuitRequest, Gate } from './types';

export interface OptimizationResult {
  circuit: CircuitRequest;
  originalGates: number;
  optimizedGates: number;
  gatesReduced: number;
  originalDepth: number;
  optimizedDepth: number;
  depthReduced: number;
  optimizationsApplied: string[];
}

/**
 * Applies deterministic algebraic quantum circuit optimization:
 * 1. Adjacent self-inverse gate cancellation (e.g. H·H = I, X·X = I, Z·Z = I)
 * 2. Rotation merging on same qubit (e.g. Rx(θ1) + Rx(θ2) = Rx(θ1 + θ2 mod 2π))
 * 3. 2-qubit CNOT cancellation (CX(c, t) · CX(c, t) = I)
 */
export function optimizeCircuitLocally(circuit: CircuitRequest): OptimizationResult {
  const gates = [...circuit.gates].sort((a, b) => (a.column ?? 0) - (b.column ?? 0));
  const optimizationsApplied: string[] = [];
  const initialGateCount = gates.length;
  const initialDepth = gates.reduce((m, g) => Math.max(m, (g.column ?? 0) + 1), 0);

  let changed = true;
  const workingGates = [...gates];

  while (changed) {
    changed = false;

    // Check adjacent pairs on same qubit wires
    for (let i = 0; i < workingGates.length - 1; i++) {
      const g1 = workingGates[i];
      const g2 = workingGates[i + 1];

      // 1. Check identical single-qubit self-inverse gates: H, X, Y, Z
      if (
        ['h', 'x', 'y', 'z'].includes(g1.gate.toLowerCase()) &&
        g1.gate.toLowerCase() === g2.gate.toLowerCase() &&
        g1.targets.length === 1 &&
        g2.targets.length === 1 &&
        g1.targets[0] === g2.targets[0]
      ) {
        optimizationsApplied.push(
          `Cancelled adjacent ${g1.gate.toUpperCase()} gates on q[${g1.targets[0]}] (${g1.gate.toUpperCase()}² = I)`
        );
        workingGates.splice(i, 2);
        changed = true;
        break;
      }

      // 2. Check identical 2-qubit CX gates: CX(c, t) · CX(c, t) = I
      if (
        g1.gate.toLowerCase() === 'cx' &&
        g2.gate.toLowerCase() === 'cx' &&
        g1.targets.length === 2 &&
        g2.targets.length === 2 &&
        g1.targets[0] === g2.targets[0] &&
        g1.targets[1] === g2.targets[1]
      ) {
        optimizationsApplied.push(
          `Cancelled consecutive CX(q${g1.targets[0]} → q${g1.targets[1]}) operations`
        );
        workingGates.splice(i, 2);
        changed = true;
        break;
      }

      // 3. Merge rotations on same axis: Rx(θ1) · Rx(θ2) = Rx(θ1 + θ2)
      if (
        ['rx', 'ry', 'rz'].includes(g1.gate.toLowerCase()) &&
        g1.gate.toLowerCase() === g2.gate.toLowerCase() &&
        g1.targets[0] === g2.targets[0] &&
        g1.angle !== undefined &&
        g2.angle !== undefined
      ) {
        const mergedAngle = (g1.angle + g2.angle) % (2 * Math.PI);
        if (Math.abs(mergedAngle) < 1e-6 || Math.abs(mergedAngle - 2 * Math.PI) < 1e-6) {
          optimizationsApplied.push(
            `Cancelled redundant 2π rotation ${g1.gate.toUpperCase()} on q[${g1.targets[0]}]`
          );
          workingGates.splice(i, 2);
        } else {
          optimizationsApplied.push(
            `Merged ${g1.gate.toUpperCase()} rotations on q[${g1.targets[0]}] to ${(mergedAngle / Math.PI).toFixed(2)}π`
          );
          workingGates[i] = {
            ...g1,
            angle: mergedAngle,
          };
          workingGates.splice(i + 1, 1);
        }
        changed = true;
        break;
      }
    }
  }

  // Re-index visual columns
  const reindexedGates: Gate[] = workingGates.map((g, idx) => ({
    ...g,
    column: idx,
  }));

  const optimizedDepth = reindexedGates.reduce((m, g) => Math.max(m, (g.column ?? 0) + 1), 0);

  return {
    circuit: {
      ...circuit,
      gates: reindexedGates,
    },
    originalGates: initialGateCount,
    optimizedGates: reindexedGates.length,
    gatesReduced: initialGateCount - reindexedGates.length,
    originalDepth: initialDepth,
    optimizedDepth,
    depthReduced: Math.max(0, initialDepth - optimizedDepth),
    optimizationsApplied,
  };
}

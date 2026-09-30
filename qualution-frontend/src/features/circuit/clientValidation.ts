import type { CircuitRequest } from './types';

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  field?: string;
}

export interface ClientValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Perform client-side sanity validation before sending to backend execution
 */
export function validateCircuitClientSide(circuit: CircuitRequest): ClientValidationResult {
  const issues: ValidationIssue[] = [];

  if (circuit.qubits < 1) {
    issues.push({ type: 'error', message: 'Circuit must have at least 1 qubit.' });
  }

  if (circuit.qubits > 2000) {
    issues.push({ type: 'error', message: 'Visual IDE currently supports up to 2000 qubits.' });
  }

  for (let i = 0; i < circuit.gates.length; i++) {
    const g = circuit.gates[i];
    const gName = g.gate.toUpperCase();

    // Check targets out of bounds
    for (const t of g.targets) {
      if (t < 0 || t >= circuit.qubits) {
        issues.push({
          type: 'error',
          message: `Gate ${gName} references non-existent qubit q[${t}].`,
        });
      }
    }

    // Check two-qubit duplicate targets
    if (g.targets.length > 1) {
      const uniqueTargets = new Set(g.targets);
      if (uniqueTargets.size !== g.targets.length) {
        issues.push({
          type: 'error',
          message: `${gName} requires distinct control and target qubits (got q[${g.targets.join(', ')}]).`,
        });
      }
    }

    // Check rotation angle presence
    if (['RX', 'RY', 'RZ', 'P'].includes(gName) && g.angle === undefined) {
      issues.push({
        type: 'error',
        message: `Rotation gate ${gName} is missing required angle parameter.`,
      });
    }
  }

  return {
    valid: issues.filter((i) => i.type === 'error').length === 0,
    issues,
  };
}

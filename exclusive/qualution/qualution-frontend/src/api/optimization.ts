import { apiClient } from './client';
import type { CircuitRequest } from '../features/circuit/types';
import type { CircuitMetricsResponse } from '../features/circuit/types';

export interface OptimizationImprovements {
  gate_count_reduction: number;
  gate_count_reduction_percent: number;
  depth_reduction: number;
  depth_reduction_percent: number;
  two_qubit_gate_reduction: number;
  two_qubit_gate_reduction_percent: number;
}

export interface OptimizationResponse {
  original_circuit: CircuitRequest;
  optimized_circuit: CircuitRequest;
  changed: boolean;
  correctness_verified: boolean;
  optimization_passes_applied: string[];
  original_metrics: CircuitMetricsResponse;
  optimized_metrics: CircuitMetricsResponse;
  improvements: OptimizationImprovements;
  explanation: string[];
  execution_time_ms: number;
}

const ROTATION_GATES = new Set(['rx', 'ry', 'rz', 'p', 'cp', 'crx', 'cry', 'crz']);
const TWO_QUBIT_GATES = new Set(['cx', 'cz', 'swap', 'cp', 'crx', 'cry', 'crz', 'ch']);
const THREE_QUBIT_GATES = new Set(['ccx']);
const VALID_OPTIMIZATION_GATES = new Set([
  'h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'p', 'id',
  'cx', 'cz', 'swap', 'ccx', 'measure', 'reset', 'barrier', 'control',
  'cp', 'crx', 'cry', 'crz', 'ch', 'tdg', 'sdg', 'sx', 'mcx',
  'if', 'for', 'while', 'box', 'phase_disk', 'custom'
]);

export function sanitizeCircuitForOptimization(circuit: CircuitRequest): CircuitRequest {
  const qubits = Math.max(1, Number(circuit?.qubits) || 1);
  const rawGates = Array.isArray(circuit?.gates) ? circuit.gates : [];
  const sanitizedGates: any[] = [];

  const processGate = (g: any) => {
    if (!g) return;
    let gateName = String(g.gate || g.type || '').trim().toLowerCase();
    if (!gateName) return;

    // Normalize aliases
    if (gateName === '|0⟩' || gateName === '|0>' || gateName === 'dirac 0' || gateName === 'dirac0') {
      gateName = 'reset';
    } else if (gateName === 'cnot') {
      gateName = 'cx';
    } else if (gateName === 'toffoli') {
      gateName = 'ccx';
    } else if (gateName === 'u1') {
      gateName = 'p';
    }

    // Expand custom sub_circuit if available
    if (gateName === 'custom' && Array.isArray(g.sub_circuit) && g.sub_circuit.length > 0) {
      for (const sg of g.sub_circuit) {
        processGate(sg);
      }
      return;
    }

    if (!VALID_OPTIMIZATION_GATES.has(gateName)) {
      return;
    }

    // Sanitize targets
    const rawTargets = Array.isArray(g.targets)
      ? g.targets.map(Number).filter((t: number) => !isNaN(t) && t >= 0 && t < qubits)
      : [0];

    let targets = rawTargets;
    if (THREE_QUBIT_GATES.has(gateName)) {
      if (targets.length < 3) {
        const available = [0, 1, 2].filter((q) => q < qubits);
        while (available.length < 3) available.push(available[available.length - 1] ?? 0);
        targets = [targets[0] ?? 0, available[1] ?? 1, available[2] ?? 2];
      } else {
        targets = [targets[0], targets[1], targets[2]];
      }
      if (new Set(targets).size !== 3) {
        targets = [0, Math.min(1, qubits - 1), Math.min(2, qubits - 1)];
      }
    } else if (TWO_QUBIT_GATES.has(gateName)) {
      if (targets.length < 2) {
        const other = targets[0] === 0 ? Math.min(1, qubits - 1) : 0;
        targets = [targets[0] ?? 0, other];
      } else if (targets[0] === targets[1]) {
        targets = [targets[0], targets[0] === 0 ? Math.min(1, qubits - 1) : 0];
      } else {
        targets = [targets[0], targets[1]];
      }
    } else if (gateName === 'measure' || gateName === 'barrier' || gateName === 'mcx') {
      targets = targets.length > 0 ? targets : [0];
    } else {
      // Single qubit gate
      targets = targets.length > 0 ? [targets[0]] : [0];
    }

    // Angle handling
    const isRot = ROTATION_GATES.has(gateName);
    const angle = isRot
      ? typeof g.angle === 'number' && !isNaN(g.angle)
        ? g.angle
        : Math.PI / 2
      : undefined;

    sanitizedGates.push({
      gate: gateName,
      targets,
      ...(angle !== undefined ? { angle } : {}),
      column: typeof g.column === 'number' ? g.column : 0,
      ...(g.id ? { id: String(g.id) } : {}),
      ...(g.name ? { name: String(g.name) } : {}),
    });
  };

  for (const g of rawGates) {
    processGate(g);
  }

  const shouldMeasure = Boolean(circuit?.measure);
  const classical_bits = Math.max(
    Number(circuit?.classical_bits) || 0,
    shouldMeasure ? qubits : 0
  );

  return {
    qubits,
    classical_bits,
    gates: sanitizedGates,
    measure: shouldMeasure,
    shots: circuit?.shots || 1024,
    ...(circuit?.topology ? { topology: circuit.topology } : {}),
  };
}

/**
 * Request backend circuit optimization passes with formal unitary equivalence verification.
 */
export async function optimizeCircuit(circuit: CircuitRequest): Promise<OptimizationResponse> {
  const sanitized = sanitizeCircuitForOptimization(circuit);
  return apiClient<OptimizationResponse>('/circuits/optimize', {
    method: 'POST',
    body: JSON.stringify(sanitized),
  });
}

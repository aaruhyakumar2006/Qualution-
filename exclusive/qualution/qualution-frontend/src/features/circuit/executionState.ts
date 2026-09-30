import type {
  CircuitRequest,
  CircuitRunResponse,
  TimelineResponse,
  ComplexNumber,
  CircuitMetricsResponse,
} from './types';

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export type ExecutionPhase =
  | 'validating'
  | 'selecting_backend'
  | 'simulating'
  | 'computing_state'
  | 'preparing_visualizations'
  | 'complete';

export interface ExecutionState {
  status: ExecutionStatus;
  phase: ExecutionPhase | null;
  executionId: string | null;
  requestedBackend: string;
  selectedBackend: string | null;
  executionStartTime: number | null;
  executionDurationMs: number | null;
  latestResult: CircuitRunResponse | null;
  latestTimeline: TimelineResponse | null;
  latestStatevector: ComplexNumber[] | null;
  latestMetrics: CircuitMetricsResponse | null;
  latestError: string | null;
  errorCategory: 'validation' | 'network' | 'backend' | 'simulation' | 'parse' | 'unknown' | null;
  lastExecutedCircuitSignature: string | null;
}

export const INITIAL_EXECUTION_STATE: ExecutionState = {
  status: 'idle',
  phase: null,
  executionId: null,
  requestedBackend: 'auto',
  selectedBackend: null,
  executionStartTime: null,
  executionDurationMs: null,
  latestResult: null,
  latestTimeline: null,
  latestStatevector: null,
  latestMetrics: null,
  latestError: null,
  errorCategory: null,
  lastExecutedCircuitSignature: null,
};

/**
 * Creates a deterministic deterministic hash/signature string for a CircuitRequest and execution settings
 */
export function getCircuitSignature(
  circuit: CircuitRequest,
  backend: string,
  shots: number,
  mode: string = 'shots'
): string {
  if (!circuit) return '';
  const gates = Array.isArray(circuit.gates) ? circuit.gates : [];
  const normalizedGates = gates.map((g) => ({
    gate: (g.gate || (g as any).type || '').toLowerCase(),
    targets: Array.isArray(g.targets) ? [...g.targets].sort((a, b) => a - b) : [0],
    angle: typeof g.angle === 'number' && !isNaN(g.angle) ? Number(g.angle.toFixed(6)) : undefined,
    column: typeof g.column === 'number' ? g.column : 0,
  }));

  // Sort gates deterministically by column then targets
  normalizedGates.sort((a, b) => (a.column - b.column) || ((a.targets[0] ?? 0) - (b.targets[0] ?? 0)));

  return JSON.stringify({
    qubits: circuit.qubits,
    classical_bits: circuit.classical_bits,
    measure: circuit.measure,
    shots: shots,
    backend: (typeof backend === 'string' ? backend : 'qiskit_aer').toLowerCase(),
    mode: (typeof mode === 'string' ? mode : 'shots').toLowerCase(),
    gates: normalizedGates,
  });
}

/**
 * Checks if the current circuit configuration differs from the last successfully executed simulation
 */
export function isCircuitDirty(
  circuit: CircuitRequest,
  backend: string,
  shots: number,
  lastSignature: string | null
): boolean {
  if (!lastSignature) return true;
  const currentSignature = getCircuitSignature(circuit, backend, shots);
  return currentSignature !== lastSignature;
}

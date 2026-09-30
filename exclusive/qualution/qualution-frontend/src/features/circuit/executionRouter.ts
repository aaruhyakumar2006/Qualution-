import type {
  CircuitRequest,
  CircuitRunRoutingSummary,
  CanonicalCircuit,
  CircuitAnalyzerOutput,
  UnifiedExecutionResult,
} from './types';
import { analyzeCircuit } from './circuitAnalyzer';
import { simulateStabilizerCircuit } from './stabilizerEngine';
import { simulateStatevectorCircuit } from './statevectorEngine';
import { simulateMpsCircuit, type MpsSimulationOptions } from './mpsEngine';
import { simulateViaCloud, type CloudSimulationOptions } from './cloudEngine';
import { normalizeExecutionResult } from './resultNormalizer';



/**
 * Clifford gate primitives that satisfy the Gottesman-Knill theorem:
 * H, X, Y, Z, S, S-dagger, CNOT, CZ, SWAP, identity, and measurement.
 * Circuits consisting entirely of these operations can be simulated in polynomial time O(N^2)
 * using the Stabilizer formalism rather than exponential statevector allocation.
 */
export const CLIFFORD_GATES = new Set([
  'h',
  'x',
  'y',
  'z',
  's',
  'sdg',
  's_dagger',
  'sdag',
  'cx',
  'cnot',
  'cz',
  'swap',
  'id',
  'i',
  'barrier',
  'reset',
  'measure',
]);

/**
 * Pure function: Checks if all gates in a circuit belong to the Clifford group.
 * Returns false on the first non-Clifford gate encountered, true otherwise.
 * An empty circuit returns true.
 * Works seamlessly with both CanonicalCircuit and backend CircuitRequest.
 */
export function isCliffordCompatible(
  circuit:
    | CanonicalCircuit
    | CircuitRequest
    | { gates?: Array<{ gate?: string; type?: string; angle?: number }> }
    | null
    | undefined
): boolean {
  if (!circuit || !circuit.gates || circuit.gates.length === 0) {
    return true;
  }

  for (const g of circuit.gates) {
    const raw = ((g as any).gate || (g as any).type || '').trim().toLowerCase();
    if (!CLIFFORD_GATES.has(raw)) {
      return false;
    }
  }

  return true;
}

/** Backward-compatibility alias for existing imports */
export const isCliffordCircuit = isCliffordCompatible;

export interface ExecutionPathDecision {
  method: 'stabilizer' | 'statevector' | 'mps' | 'cloud' | 'qpu';
  location: 'local_browser' | 'local_python' | 'remote' | 'cloud';
  backend: string;
  routing_reason: string;
  priority_tier: 1 | 2 | 3 | 4;
  tier_name: 'clifford' | 'local_statevector' | 'mps' | 'cloud_qpu';
}

export interface ExecutionRouterOptions {
  deviceMemoryGb?: number;
  requires_full_state?: boolean;
}

/**
 * Multi-Signal Execution Router: selectExecutionPath
 *
 * Implements strict hierarchical priority routing driven by quantum complexity signals:
 * 1. Tier 1: clifford_compatible === true -> Stabilizer engine (regardless of qubit count).
 *    EXCEPTION (Defect B2): When a full-state view is active (requires_full_state === true)
 *    AND the circuit is under the local statevector memory guard (local_statevector_candidate === true),
 *    route to local Statevector engine even if Clifford, providing signed amplitudes and Q-sphere phases.
 *    A 50-qubit Clifford circuit has local_statevector_candidate === false, so it still routes to Stabilizer.
 * 2. Tier 2: local_statevector_candidate === true -> Local Statevector engine (within memory safe threshold).
 * 3. Tier 3: mps_candidate === true -> Matrix Product State (MPS) tensor network (bounded entanglement).
 * 4. Tier 4: Fallback -> Remote Cloud / QPU execution.
 *
 * Generates dynamic, signal-aware routing_reason strings for AI Tutor and execution telemetry.
 */
export function selectExecutionPath(
  analyzerOutput: CircuitAnalyzerOutput,
  options?: ExecutionRouterOptions
): ExecutionPathDecision {
  const {
    qubit_count,
    gate_count,
    depth,
    two_qubit_gate_count,
    clifford_compatible,
    estimated_statevector_memory_bytes,
    local_statevector_candidate,
    mps_candidate,
  } = analyzerOutput;

  const memMb = (estimated_statevector_memory_bytes / (1024 * 1024)).toFixed(1);
  const memGb = (estimated_statevector_memory_bytes / (1024 * 1024 * 1024)).toFixed(1);

  // ── Priority a (Tier 1): Clifford Group Compatibility ────────────────
  // Regardless of qubit count (even 50, 100, 1000 qubits), pure Clifford circuits
  // scale in polynomial time (O(N^2) gate evolution, ~O(N^3) full-register measurement) via Aaronson-Gottesman stabilizer tableau.
  if (clifford_compatible === true) {
    if (options?.requires_full_state && local_statevector_candidate) {
      const reason =
        `Clifford-compatible circuit detected across all ${gate_count} gates on ${qubit_count} qubits (depth ${depth}), ` +
        `but full-state amplitudes / Q-sphere phase visualization was requested (requires_full_state=true). ` +
        `Dense statevector requires ~${memMb} MB RAM, which is within the client safe memory threshold. Routed to local Statevector engine.`;

      console.log(`[ExecutionRouter] Route Decision -> Tier 2 (Local Statevector via requires_full_state): ${reason}`);

      return {
        method: 'statevector',
        location: 'local_browser',
        backend: 'statevector_engine',
        routing_reason: reason,
        priority_tier: 2,
        tier_name: 'local_statevector',
      };
    }

    const reason =
      `Clifford-compatibility detected: Clifford-compatible circuit detected across all ${gate_count} gates on ${qubit_count} qubits (depth ${depth}). ` +
      `By the Gottesman-Knill theorem, the state is represented via an Aaronson-Gottesman stabilizer tableau and routed to the Stabilizer simulator for polynomial time O(N^2) gate evolution, ~O(N^3) full-register measurement without exponential statevector memory overhead.`;

    console.log(`[ExecutionRouter] Route Decision -> Tier 1 (Stabilizer): ${reason}`);

    return {
      method: 'stabilizer',
      location: 'local_browser',
      backend: 'stabilizer_engine',
      routing_reason: reason,
      priority_tier: 1,
      tier_name: 'clifford',
    };
  }

  // ── Priority b (Tier 2): Local Statevector Candidate ─────────────────
  // Non-Clifford circuits with arbitrary rotations/T-gates that fit safely within
  // the client hardware memory threshold (default <= 20 qubits, ~16.8 MB).
  if (local_statevector_candidate === true) {
    const reason =
      `Circuit contains non-Clifford operations across ${qubit_count} qubits (depth ${depth}, ${two_qubit_gate_count} entangling gates). ` +
      `The dense statevector requires ~${memMb} MB RAM (2^${qubit_count} complex amplitudes), which is within the client safe memory threshold. Routed to local Statevector engine.`;

    console.log(`[ExecutionRouter] Route Decision -> Tier 2 (Local Statevector): ${reason}`);

    return {
      method: 'statevector',
      location: 'local_browser',
      backend: 'statevector_engine',
      routing_reason: reason,
      priority_tier: 2,
      tier_name: 'local_statevector',
    };
  }

  // ── Priority c (Tier 3): Matrix Product State (MPS) Candidate ────────
  // High qubit count exceeding statevector RAM, but low/bounded entanglement
  // allows 1D tensor network decomposition with low bond dimension.
  if (mps_candidate === true) {
    const reason =
      `Non-Clifford circuit on ${qubit_count} qubits exceeds client statevector memory (~${memMb} MB), ` +
      `but exhibits bounded two-qubit entanglement (${two_qubit_gate_count} entangling gates). Routed to Matrix Product State (MPS) tensor network simulation.`;

    console.log(`[ExecutionRouter] Route Decision -> Tier 3 (MPS): ${reason}`);

    return {
      method: 'mps',
      location: 'local_python',
      backend: 'mps_simulator',
      routing_reason: reason,
      priority_tier: 3,
      tier_name: 'mps',
    };
  }

  // ── Priority d (Tier 4): Cloud / QPU Fallback ────────────────────────
  // High qubit count, deep two-qubit entanglement that cannot be contracted as MPS
  // and cannot fit in client statevector memory.
  const reason =
    `High-complexity non-Clifford workload on ${qubit_count} qubits with deep entanglement (${two_qubit_gate_count} entangling gates, depth ${depth}). ` +
    `Classical statevector requires ~${estimated_statevector_memory_bytes >= 1024 * 1024 * 1024 ? memGb + ' GB' : memMb + ' MB'} RAM, exceeding local client capabilities. ` +
    `Routed to Cloud / Remote QPU execution.`;

  console.log(`[ExecutionRouter] Route Decision -> Tier 4 (Cloud / QPU): ${reason}`);

  return {
    method: 'cloud',
    location: 'cloud',
    backend: 'cloud_qpu',
    routing_reason: reason,
    priority_tier: 4,
    tier_name: 'cloud_qpu',
  };
}

/**
 * High-level circuit router helper: analyzes circuit and selects execution path.
 */
export function routeCircuit(
  circuit: CanonicalCircuit | CircuitRequest,
  options?: ExecutionRouterOptions
): ExecutionPathDecision {
  const analysis = analyzeCircuit(circuit, options);
  return selectExecutionPath(analysis, options);
}

/**
 * Circuit-Intelligence Execution Router (Backward-Compatible Telemetry Formatter)
 * Evaluates circuit structure, gate set, and resource profile to dispatch
 * the workload to the optimal backend and framework.
 */
export function resolveCircuitRouting(
  circuit: CircuitRequest | CanonicalCircuit,
  executionTimeMs: number = 1.2,
  options?: ExecutionRouterOptions
): CircuitRunRoutingSummary {
  const analysis = analyzeCircuit(circuit, options);
  const decision = selectExecutionPath(analysis, options);

  if (decision.method === 'stabilizer') {
    return {
      requested_backend: 'auto',
      selected_backend: 'qiskit_aer_stabilizer',
      framework: 'qiskit_stabilizer',
      policy: 'clifford_stabilizer_optimal',
      reason: decision.routing_reason,
    };
  }

  if (decision.method === 'statevector') {
    return {
      requested_backend: 'auto',
      selected_backend: 'qiskit_aer',
      framework: 'qiskit',
      policy: 'statevector_dense',
      reason: decision.routing_reason,
    };
  }

  if (decision.method === 'mps') {
    return {
      requested_backend: 'auto',
      selected_backend: 'qiskit_aer_mps',
      framework: 'qiskit_mps',
      policy: 'tensor_network_bounded_entanglement',
      reason: decision.routing_reason,
    };
  }

  return {
    requested_backend: 'auto',
    selected_backend: 'cloud_qpu',
    framework: 'qbraid_cloud',
    policy: 'remote_hardware_dispatch',
    reason: decision.routing_reason,
  };
}

export interface ExecuteCircuitOptions extends MpsSimulationOptions, CloudSimulationOptions {
  shots?: number;
  deviceMemoryGb?: number;
  requires_full_state?: boolean;
}

/**
 * End-to-End Multi-Signal Circuit Executor
 * Dispatches the circuit dynamically to the optimal quantum engine based on the
 * hierarchical multi-signal routing decision:
 * - Tier 1: Stabilizer Engine (local browser)
 * - Tier 2: Statevector Engine (local browser)
 * - Tier 3: Matrix Product State (MPS) Engine (local Python backend)
 * - Tier 4: Cloud / Remote QPU (cloud - honest roadmap stub)
 */
export async function executeRoutedCircuit(
  circuit: CanonicalCircuit,
  options?: ExecuteCircuitOptions
): Promise<UnifiedExecutionResult> {
  const decision = routeCircuit(circuit, {
    deviceMemoryGb: options?.deviceMemoryGb,
    requires_full_state: options?.requires_full_state,
  });

  let rawResult: UnifiedExecutionResult;
  if (decision.method === 'stabilizer') {
    rawResult = simulateStabilizerCircuit(circuit, { shots: options?.shots });
  } else if (decision.method === 'statevector') {
    rawResult = simulateStatevectorCircuit(circuit, { shots: options?.shots });
  } else if (decision.method === 'mps') {
    rawResult = await simulateMpsCircuit(circuit, options);
  } else {
    // Tier 4: Honest Cloud / QPU Hardware stub (status: 'not_implemented')
    rawResult = simulateViaCloud(circuit, {
      shots: options?.shots,
      provider: options?.provider,
      device: options?.device,
      routing_reason: decision.routing_reason,
    });
  }

  return normalizeExecutionResult(rawResult, decision.method);
}

export { simulateViaCloud };



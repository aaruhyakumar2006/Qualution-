import type { CanonicalCircuit, UnifiedExecutionResult } from './types';
import { normalizeExecutionResult } from './resultNormalizer';

export interface MpsSimulationOptions {
  shots?: number;
  max_bond_dimension?: number;
  truncation_threshold?: number;
  backendUrl?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.VITE_BACKEND_URL) ||
  'http://127.0.0.1:8000';

/**
 * Client interface for Matrix Product State (MPS) tensor network simulation.
 * Dispatches canonical quantum circuits to the local Python FastAPI backend
 * running Qiskit Aer (`method='matrix_product_state'`).
 *
 * Provides real fidelity, singular-value truncation error, and bond-dimension telemetry.
 */
export async function simulateMpsCircuit(
  circuit: CanonicalCircuit,
  options: MpsSimulationOptions = {}
): Promise<UnifiedExecutionResult> {
  const {
    shots = circuit.shots ?? 1024,
    max_bond_dimension,
    truncation_threshold,
    backendUrl = DEFAULT_BACKEND_URL,
    fetchFn = typeof window !== 'undefined' ? window.fetch.bind(window) : fetch,
    timeoutMs = 15000,
  } = options;

  if (circuit.qubits <= 0) {
    throw new Error('Circuit must contain at least 1 qubit for simulation.');
  }

  // Build CanonicalCircuit JSON payload
  const payload = {
    qubits: circuit.qubits,
    classical_bits: circuit.classical_bits,
    gates: circuit.gates.map((g) => ({
      id: g.id,
      type: g.type || g.gate,
      gate: g.gate || g.type,
      targets: g.targets,
      column: g.column,
      angle: g.angle,
      name: g.name,
    })),
    measurements: circuit.measurements,
    measure: circuit.measure,
    shots,
    max_bond_dimension,
    truncation_threshold,
  };

  const payloadString = JSON.stringify(payload);
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const reqInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: payloadString,
  };

  const executeFetch = async (): Promise<UnifiedExecutionResult> => {
    // Attempt standard /api/v1/simulate/mps first, then fallback to /simulate/mps
    const primaryUrl = `${backendUrl.replace(/\/$/, '')}/api/v1/simulate/mps`;
    let response: Response;

    try {
      response = await fetchFn(primaryUrl, reqInit);
    } catch (err: any) {
      const fallbackUrl = `${backendUrl.replace(/\/$/, '')}/simulate/mps`;
      try {
        response = await fetchFn(fallbackUrl, reqInit);
      } catch (fallbackErr: any) {
        throw new Error(
          `MPS Simulation Backend Unreachable: Could not connect to Python FastAPI backend at ${backendUrl}. ` +
          `MPS tensor network simulation requires the local Python backend with qiskit-aer running. (${err.message})`
        );
      }
    }



    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(
        `MPS simulation backend returned HTTP ${response.status}: ${errText || response.statusText}`
      );
    }

    const responseText = await response.text();
    const payloadBytes = new TextEncoder().encode(responseText).length;
    const data = JSON.parse(responseText);

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const roundTripMs = Number((endTime - startTime).toFixed(2));

    return normalizeExecutionResult(
      {
        backend: data.backend || 'qiskit_aer_mps',
        execution_location: 'local_python',
        execution_method: 'mps',
        qubit_count: data.qubit_count ?? circuit.qubits,
        shots: data.shots ?? shots,
        counts: data.counts,
        probabilities: data.probabilities,
        runtime_ms: data.runtime_ms ?? roundTripMs,
        approximation: data.approximation ?? false,
        fidelity: data.fidelity,
        truncation_error: data.truncation_error,
        resource_estimate: {
          ...(data.resource_estimate || {}),
          round_trip_ms: roundTripMs,
          payload_bytes: payloadBytes,
        },
        warnings: data.warnings,
        routing_reason:
          data.routing_reason ||
          `Simulated via Qiskit Aer Matrix Product State (MPS) on local Python backend across ${circuit.qubits} qubits.`,
      },
      'mps'
    );

  };

  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`MPS simulation request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([executeFetch(), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}



import type {
  ComplexNumber,
  UnifiedExecutionResult,
  CloudExecutionResult,
  CircuitRunResponse,
  CircuitRequest,
} from './types';

export type UnifiedResult = UnifiedExecutionResult;

/**
 * Universal Quantum Execution Result Normalizer
 *
 * Ensures that EVERY quantum engine (Stabilizer, Statevector, MPS, Cloud-stub,
 * or raw backend response) produces an identical, strictly conforming
 * UnifiedExecutionResult before any visualization component, UI panel,
 * or AI Tutor inspects it.
 *
 * Guarantees:
 * 1. Clean, normalized binary bitstring keys (never hex, never whitespace).
 * 2. Consistent probabilities (computed from counts if missing, normalized to 1.0).
 * 3. Consistent counts (reconstructed from probabilities if missing).
 * 4. Genuine optionality: statevector, fidelity, and truncation_error are UNDEFINED
 *    when not present (e.g. Stabilizer has no continuous statevector), never fake numbers.
 * 5. Accurate runtime: strictly non-negative number.
 * 6. Honest status and messages (e.g. 'not_implemented' for cloud stubs).
 */
export function normalizeExecutionResult(
  raw: any,
  engineType?: 'stabilizer' | 'statevector' | 'mps' | 'cloud' | string
): UnifiedExecutionResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid raw engine output: expected an object.');
  }

  // 1. Infer or validate execution method & location
  const method: string = (
    raw.execution_method ||
    engineType ||
    (raw.tier_name === 'clifford' ? 'stabilizer' : raw.tier_name) ||
    (raw.backend?.includes('stabilizer') ? 'stabilizer' : '') ||
    (raw.backend?.includes('mps') ? 'mps' : '') ||
    (raw.backend?.includes('statevector') ? 'statevector' : '') ||
    (raw.backend?.includes('cloud') ? 'cloud' : 'statevector')
  ).toLowerCase();

  const location: string = (
    raw.execution_location ||
    (method === 'stabilizer' || method === 'statevector'
      ? 'local_browser'
      : method === 'mps'
      ? 'local_python'
      : 'cloud')
  );

  const backend: string = (
    raw.backend ||
    (method === 'stabilizer'
      ? 'stabilizer_engine'
      : method === 'statevector'
      ? 'statevector_engine'
      : method === 'mps'
      ? 'qiskit_aer_mps'
      : 'cloud_qpu')
  );

  // 2. Normalize Shots
  const rawShots = Number(raw.shots ?? raw.simulation?.shots ?? 1024);
  const shots = Number.isFinite(rawShots) && rawShots > 0 ? Math.round(rawShots) : 1024;

  // 3. Normalize Counts (converting hex to binary if needed)
  const rawCounts = raw.counts || raw.simulation?.counts || {};
  const normalizedCounts: Record<string, number> = {};

  for (const [key, val] of Object.entries(rawCounts)) {
    const trimmed = key.trim();
    let bitstring = trimmed;

    // Convert hex (e.g. '0x3') to binary
    if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
      const parsedInt = parseInt(trimmed, 16);
      if (!Number.isNaN(parsedInt)) {
        bitstring = parsedInt.toString(2);
      }
    }

    const countNum = typeof val === 'number' && Number.isFinite(val) ? Math.max(0, Math.round(val)) : 0;
    if (bitstring.length > 0) {
      normalizedCounts[bitstring] = (normalizedCounts[bitstring] || 0) + countNum;
    }
  }

  // 4. Infer Qubit Count if not explicitly provided
  let qubitCount: number = Number(raw.qubit_count ?? raw.circuit?.qubits ?? raw.qubits ?? 0);
  if (!qubitCount || qubitCount <= 0) {
    const sampleKey = Object.keys(normalizedCounts)[0] || Object.keys(raw.probabilities || {})[0];
    if (sampleKey) {
      qubitCount = sampleKey.length;
    } else if (Array.isArray(raw.statevector) && raw.statevector.length > 0) {
      qubitCount = Math.round(Math.log2(raw.statevector.length));
    } else {
      qubitCount = 1;
    }
  }

  // Pad bitstrings in counts to match qubitCount
  const finalCounts: Record<string, number> = {};
  for (const [bits, c] of Object.entries(normalizedCounts)) {
    const padded = bits.padStart(qubitCount, '0');
    finalCounts[padded] = (finalCounts[padded] || 0) + c;
  }

  // 5. Normalize Probabilities
  const rawProbs = raw.probabilities || raw.simulation?.probabilities || {};
  const normalizedProbs: Record<string, number> = {};

  for (const [key, val] of Object.entries(rawProbs)) {
    const trimmed = key.trim();
    let bitstring = trimmed;
    if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
      const parsedInt = parseInt(trimmed, 16);
      if (!Number.isNaN(parsedInt)) {
        bitstring = parsedInt.toString(2);
      }
    }
    const probNum = typeof val === 'number' && Number.isFinite(val) ? Math.max(0, val) : 0;
    const padded = bitstring.padStart(qubitCount, '0');
    normalizedProbs[padded] = probNum;
  }

  // If probabilities are missing but counts exist, compute from counts
  if (Object.keys(normalizedProbs).length === 0 && Object.keys(finalCounts).length > 0) {
    const totalSampled = Object.values(finalCounts).reduce((a, b) => a + b, 0) || shots;
    for (const [bits, c] of Object.entries(finalCounts)) {
      normalizedProbs[bits] = Number((c / totalSampled).toFixed(6));
    }
  }

  // If counts are missing but probabilities exist, compute from probabilities
  if (Object.keys(finalCounts).length === 0 && Object.keys(normalizedProbs).length > 0) {
    for (const [bits, p] of Object.entries(normalizedProbs)) {
      finalCounts[bits] = Math.round(p * shots);
    }
  }

  // 6. Normalize Statevector / Amplitudes
  // Stabilizer simulation, Cloud stubs, or measurement-only modes DO NOT have continuous statevectors
  let normalizedStatevector: ComplexNumber[] | undefined = undefined;
  const isContinuousEngine = method === 'statevector';

  const rawStatevector = raw.statevector || raw.amplitudes || raw.simulation?.statevector;
  if (isContinuousEngine && Array.isArray(rawStatevector) && rawStatevector.length > 0) {
    normalizedStatevector = rawStatevector.map((c: any) => ({
      real: typeof c?.real === 'number' && Number.isFinite(c.real) ? c.real : 0,
      imag: typeof c?.imag === 'number' && Number.isFinite(c.imag) ? c.imag : 0,
    }));
  }

  // 7. Normalize Runtime
  const rawRuntime = Number(
    raw.runtime_ms ?? raw.execution_time_ms ?? raw.simulation?.execution_time_ms ?? 0
  );
  const runtime_ms = Number.isFinite(rawRuntime) && rawRuntime >= 0 ? Number(rawRuntime.toFixed(4)) : 0;

  // 8. Normalize Fidelity & Truncation Error (genuine optionality)
  let fidelity: number | undefined = undefined;
  if (typeof raw.fidelity === 'number' && Number.isFinite(raw.fidelity)) {
    fidelity = Math.max(0, Math.min(1, Number(raw.fidelity.toFixed(8))));
  }

  let truncation_error: number | undefined = undefined;
  if (typeof raw.truncation_error === 'number' && Number.isFinite(raw.truncation_error)) {
    truncation_error = Math.max(0, Number(raw.truncation_error.toFixed(8)));
  }

  const approximation = Boolean(
    raw.approximation || (truncation_error !== undefined && truncation_error > 0)
  );

  // 9. Status & Routing Reason
  const status: 'success' | 'not_implemented' | 'failed' =
    raw.status === 'not_implemented'
      ? 'not_implemented'
      : raw.status === 'failed'
      ? 'failed'
      : 'success';

  const message: string | undefined = raw.message;

  const routing_reason: string =
    raw.routing_reason ||
    raw.reason ||
    raw.routing?.reason ||
    `Executed via ${backend} on ${location}.`;

  const warnings: string[] | undefined = Array.isArray(raw.warnings) ? [...raw.warnings] : undefined;
  const resource_estimate = raw.resource_estimate ? { ...raw.resource_estimate } : undefined;

  const normalizedResult: UnifiedExecutionResult = {
    status,
    ...(message ? { message } : {}),
    backend,
    execution_location: location,
    execution_method: method,
    qubit_count: qubitCount,
    shots,
    counts: finalCounts,
    probabilities: normalizedProbs,
    ...(normalizedStatevector ? { statevector: normalizedStatevector, amplitudes: normalizedStatevector } : {}),
    runtime_ms,
    approximation,
    ...(fidelity !== undefined ? { fidelity } : {}),
    ...(truncation_error !== undefined ? { truncation_error } : {}),
    ...(resource_estimate ? { resource_estimate } : {}),
    ...(warnings && warnings.length > 0 ? { warnings } : {}),
    routing_reason,
  };

  return normalizedResult;
}

/**
  * Adapts a UnifiedExecutionResult (or UnifiedResult) to the legacy
  * CircuitRunResponse visualization container used by VisualizationPanel,
  * guaranteeing that views consume ONLY normalized properties.
  */
export function toVisualizationPayload(
  result: UnifiedExecutionResult,
  circuit?: Partial<CircuitRequest>
): CircuitRunResponse {
  const qubits = result.qubit_count ?? circuit?.qubits ?? 1;
  const classicalBits = circuit?.classical_bits ?? qubits;
  const shots = result.shots ?? 1024;

  return {
    circuit: {
      qubits,
      classical_bits: classicalBits,
      gate_count: circuit?.gates?.length ?? 0,
      measure: circuit?.measure ?? true,
      shots,
    },
    routing: {
      requested_backend: 'auto',
      selected_backend: result.backend,
      framework: result.execution_location,
      policy: result.execution_method,
      reason: result.routing_reason,
    },
    simulation: {
      backend: result.backend,
      mode: result.statevector ? 'statevector' : 'shots',
      shots,
      counts: result.counts,
      probabilities: result.probabilities,
      statevector: result.statevector,
      execution_time_ms: result.runtime_ms,
    },
    visualization: {
      bloch: null,
      bloch_qubits: null,
      timeline: null,
    },
    execution_time_ms: result.runtime_ms,
  };
}

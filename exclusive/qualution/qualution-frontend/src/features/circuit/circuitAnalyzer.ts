import type { CanonicalCircuit, CircuitRequest, CircuitAnalyzerOutput } from './types';
import { isCliffordCompatible } from './executionRouter';

export { isCliffordCompatible };

/** Default conservative statevector ceiling safe on any budget device (~16.8 MB) */
export const DEFAULT_SAFE_STATEVECTOR_QUBIT_CEILING = 20;

/**
 * Calculates estimated memory in bytes required for a statevector of n qubits:
 * 2^n amplitudes * 16 bytes (complex128: Float64 real + Float64 imag).
 * Caps at Number.MAX_VALUE when exceeding JS 53-bit/1024-exponent limits.
 */
export function estimateStatevectorMemory(qubitCount: number): number {
  if (qubitCount <= 0) return 0;
  if (qubitCount > 1020) return Number.MAX_VALUE;
  return Math.pow(2, qubitCount) * 16;
}

/**
 * Cleanly formats estimated memory into appropriate units without printing Infinity/NaN.
 */
export function formatMemoryEstimate(memoryMb: number, nQubits: number): string {
  if (nQubits > 50 || !Number.isFinite(memoryMb) || memoryMb > 1e12) {
    return '> 1 Exabyte';
  }
  if (memoryMb >= 1024 * 1024) {
    return `${(memoryMb / (1024 * 1024)).toFixed(1)} TB`;
  }
  if (memoryMb >= 1024) {
    return `${(memoryMb / 1024).toFixed(1)} GB`;
  }
  return `${memoryMb.toFixed(0)} MB`;
}

/**
 * Evaluates the safe client-side statevector qubit threshold.
 * Uses navigator.deviceMemory (GB) when available to grant a slightly higher threshold
 * on confirmed high-memory hardware, otherwise defaults to the conservative 20-qubit cap.
 */
export function getSafeStatevectorQubitThreshold(deviceMemoryGb?: number): number {
  const ramGb =
    deviceMemoryGb ??
    (typeof navigator !== 'undefined' && typeof (navigator as any).deviceMemory === 'number'
      ? (navigator as any).deviceMemory
      : undefined);

  if (ramGb === undefined) {
    return DEFAULT_SAFE_STATEVECTOR_QUBIT_CEILING;
  }

  if (ramGb >= 8) {
    return 24; // ~268 MB statevector RAM on confirmed high-memory systems (8 GB+ RAM)
  }
  if (ramGb >= 4) {
    return 22; // ~67 MB statevector RAM on confirmed 4 GB+ systems
  }
  return DEFAULT_SAFE_STATEVECTOR_QUBIT_CEILING; // 20 qubits (~16.8 MB) on budget or low-memory devices
}

/**
 * Standard Circuit Analyzer
 * Analyzes arbitrary quantum circuits according to the Phase 1 canonical contract:
 * Computes structural metrics, evaluates Clifford group compatibility, estimates statevector memory,
 * and classifies optimal simulation candidates with hardware-aware memory safety guards.
 */
export function analyzeCircuit(
  circuit: CanonicalCircuit | CircuitRequest,
  options?: { deviceMemoryGb?: number }
): CircuitAnalyzerOutput {
  const gates = circuit.gates || [];
  const nQubits = Math.max(1, circuit.qubits || 1);

  const twoQGateNames = new Set(['cx', 'cnot', 'cz', 'swap', 'cp', 'crx', 'cry', 'crz', 'ch']);

  let twoQCount = 0;
  let maxCol = -1;

  for (const g of gates) {
    const rawName = ((g as any).gate || (g as any).type || '').trim().toLowerCase();
    const isTwoQ = (g.targets && g.targets.length > 1) || twoQGateNames.has(rawName);
    if (isTwoQ) {
      twoQCount++;
    }
    const col = g.column ?? 0;
    if (col > maxCol) {
      maxCol = col;
    }
  }

  const gateCount = gates.length;
  let depth = gateCount > 0 ? maxCol + 1 : 0;

  // Topological fallback if columns are not present or all 0
  if (maxCol <= 0 && gateCount > 1) {
    const wireDepths = new Array(Math.min(nQubits, 10000)).fill(0);
    for (const g of gates) {
      const tgts = g.targets && g.targets.length > 0 ? g.targets : [0];
      let maxW = 0;
      for (const t of tgts) {
        if (t < wireDepths.length) maxW = Math.max(maxW, wireDepths[t]);
      }
      for (const t of tgts) {
        if (t < wireDepths.length) wireDepths[t] = maxW + 1;
      }
    }
    const computed = Math.max(...wireDepths);
    if (computed > depth) depth = computed;
  }

  // Generalized Clifford compatibility check — replaces any Grover-specific hardcoded checks
  const cliffordCompatible = isCliffordCompatible(circuit);

  // Theoretical statevector memory: 2^n amplitudes * 16 bytes (complex128: 8 real + 8 imag)
  const estimatedMemoryBytes = estimateStatevectorMemory(nQubits);
  const estimatedMemoryMb = estimatedMemoryBytes / (1024 * 1024);

  // Aaronson-Gottesman stabilizer tableau memory: (2n+1)^2 bits / 8 + metadata overhead (< 1 MB even for 1000 qubits)
  const tableauDim = 2 * nQubits + 1;
  const stabilizerMemoryBytes = Math.floor((tableauDim * tableauDim) / 8) + 1024;

  // Hardware-aware safe threshold evaluation
  const safeQubitThreshold = getSafeStatevectorQubitThreshold(options?.deviceMemoryGb);
  const exceedsSafeThreshold = nQubits > safeQubitThreshold;

  // Candidate evaluation based on quantum complexity and memory safety limits
  const stabilizerCandidate = cliffordCompatible;

  // local_statevector_candidate: eligible ONLY if within the safe threshold.
  // If a circuit exceeds the safe threshold AND isn't Clifford-compatible,
  // it is marked ineligible for local execution to prevent browser OOM crashes.
  const localStatevectorCandidate = !exceedsSafeThreshold;

  const mpsCandidate = !cliffordCompatible && twoQCount <= 12 && nQubits > 16;
  const remoteCandidate =
    nQubits > 28 || (!cliffordCompatible && (estimatedMemoryMb > 2048 || exceedsSafeThreshold));

  // Recommendation dispatch logic
  let recommendedMethod: string;
  let recommendedLocation: string;
  let reason: string;

  const formattedMem = formatMemoryEstimate(estimatedMemoryMb, nQubits);

  if (cliffordCompatible) {
    recommendedMethod = 'stabilizer';
    recommendedLocation = 'local_python';
    reason =
      'Clifford-compatible circuit detected (H, X, Y, Z, S, S-dagger, CNOT, CZ, SWAP). Routed to Stabilizer simulator for polynomial time O(N^2) gate evolution, ~O(N^3) full-register measurement via the Gottesman-Knill theorem.';
  } else if (mpsCandidate && !exceedsSafeThreshold) {
    recommendedMethod = 'mps';
    recommendedLocation = 'local_python';
    reason =
      'Large qubit circuit with moderate two-qubit entanglement: recommended Matrix Product State (MPS) tensor network simulation.';
  } else if (remoteCandidate || exceedsSafeThreshold) {
    recommendedMethod = 'statevector';
    recommendedLocation = 'remote';
    reason =
      `Non-Clifford workload (${nQubits} qubits, ~${formattedMem}) exceeds client safe statevector threshold (${safeQubitThreshold} qubits); routed to remote cloud execution to prevent client out-of-memory crash.`;
  } else {
    recommendedMethod = 'statevector';
    recommendedLocation = 'local_python';
    reason =
      `Circuit contains non-Clifford gates requiring full dense statevector simulation (~${estimatedMemoryMb.toFixed(2)} MB memory footprint).`;
  }

  return {
    qubit_count: nQubits,
    gate_count: gateCount,
    depth,
    two_qubit_gate_count: twoQCount,
    clifford_compatible: cliffordCompatible,
    estimated_statevector_memory_bytes: estimatedMemoryBytes,
    stabilizer_memory_bytes: stabilizerMemoryBytes,
    stabilizer_candidate: stabilizerCandidate,
    local_statevector_candidate: localStatevectorCandidate,
    mps_candidate: mpsCandidate,
    remote_candidate: remoteCandidate,
    recommended_execution_method: recommendedMethod,
    recommended_execution_location: recommendedLocation,
    reason,
  };
}

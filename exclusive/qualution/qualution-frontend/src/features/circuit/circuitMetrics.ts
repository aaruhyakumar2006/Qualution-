import type { CircuitRequest, CircuitMetricsResponse } from './types';
import { isCliffordCompatible } from './executionRouter';

/**
 * Computes live circuit structural, depth, and scaling metrics directly from the circuit model.
 * Produces exact matches for the verification table:
 * - Qubit count
 * - Gate count
 * - Depth (DAG / column layers)
 * - Two-qubit gate count and ratio
 * - Clifford group compatibility & Stabilizer tableau memory footprint (< 1 MB)
 */
export function computeCircuitMetrics(circuit: CircuitRequest): CircuitMetricsResponse {
  const nQubits = Math.max(1, circuit?.qubits || 1);
  const singleQGates = new Set(['h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'p', 'u', 'u1', 'u2', 'u3', 'id']);
  const twoQGates = new Set(['cx', 'cz', 'swap', 'cp', 'crx', 'cry', 'crz', 'ch']);
  const rotationGates = new Set(['rx', 'ry', 'rz', 'p', 'cp', 'crx', 'cry', 'crz']);

  let singleQCount = 0;
  let twoQCount = 0;
  let rotationCount = 0;
  let maxCol = -1;

  const gates = Array.isArray(circuit?.gates) ? circuit.gates : [];
  for (const g of gates) {
    if (!g) continue;
    const name = ((g as any).gate || (g as any).type || '').toLowerCase();
    const targets = Array.isArray(g.targets) ? g.targets : [];
    const isMulti = targets.length > 1 || twoQGates.has(name);
    if (isMulti) {
      twoQCount++;
    } else {
      singleQCount++;
    }
    if (rotationGates.has(name)) {
      rotationCount++;
    }
    const col = typeof g.column === 'number' ? g.column : 0;
    if (col > maxCol) {
      maxCol = col;
    }
  }

  const gateCount = gates.length;
  let depth = gateCount > 0 ? maxCol + 1 : 0;
  // Topological fallback if columns are unassigned or 0
  if (maxCol <= 0 && gateCount > 1) {
    const wireDepths = new Array(Math.min(nQubits, 10000)).fill(0);
    for (const g of gates) {
      const tgts = Array.isArray(g.targets) && g.targets.length > 0 ? g.targets : [0];
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
  const twoQRatio = gateCount > 0 ? twoQCount / gateCount : 0;
  const amplitudes = nQubits > 1020 ? Number.MAX_VALUE : Math.pow(2, nQubits);
  const memoryBytes = nQubits > 1020 ? Number.MAX_VALUE : amplitudes * 16;
  const memoryMb = Number.isFinite(memoryBytes) ? memoryBytes / (1024 * 1024) : 1e300;
  const memoryGb = Number.isFinite(memoryBytes) ? memoryBytes / (1024 * 1024 * 1024) : 1e300;

  // Aaronson-Gottesman (2004) stabilizer tableau memory: (2n+1)^2 bits / 8 + metadata
  const isClifford = isCliffordCompatible(circuit);
  const tableauDim = 2 * nQubits + 1;
  const stabilizerMemoryBytes = Math.ceil((tableauDim * tableauDim) / 8) + 1024;

  return {
    qubit_count: nQubits,
    classical_bit_count: circuit.classical_bits ?? nQubits,
    gate_count: gateCount,
    depth: depth,
    single_qubit_gate_count: singleQCount,
    two_qubit_gate_count: twoQCount,
    rotation_gate_count: rotationCount,
    measurement_count: circuit.measure ? nQubits : 0,
    two_qubit_gate_ratio: Number(twoQRatio.toFixed(4)),
    statevector_amplitudes: amplitudes,
    statevector_memory_bytes: memoryBytes,
    statevector_memory_mb: Number(memoryMb.toFixed(6)),
    statevector_memory_gb: Number(memoryGb.toFixed(8)),
    simulation_memory_class: isClifford
      ? 'Clifford Stabilizer (< 1 MB)'
      : (nQubits <= 16 ? 'Lightweight desktop simulation' : 'High-memory simulation'),
    is_clifford: isClifford,
    stabilizer_memory_bytes: stabilizerMemoryBytes,
    recommended_simulation_method: isClifford ? 'stabilizer' : (nQubits <= 16 ? 'statevector' : 'mps'),
  };
}

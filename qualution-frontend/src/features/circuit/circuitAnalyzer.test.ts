import { describe, it, expect } from 'vitest';
import {
  isCliffordCompatible,
  analyzeCircuit,
  estimateStatevectorMemory,
  getSafeStatevectorQubitThreshold,
  DEFAULT_SAFE_STATEVECTOR_QUBIT_CEILING,
} from './circuitAnalyzer';
import type { CircuitRequest, CanonicalCircuit } from './types';

describe('Generalized Clifford Circuit Detection & Circuit Analyzer', () => {
  // Existing Grover 2-qubit case (pure Clifford decomposition: H, X, CZ, measure)
  const groverPureCliffordCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { gate: 'h', targets: [0], column: 0 },
      { gate: 'h', targets: [1], column: 0 },
      { gate: 'cz', targets: [0, 1], column: 1 },
      { gate: 'h', targets: [0], column: 2 },
      { gate: 'h', targets: [1], column: 2 },
      { gate: 'x', targets: [0], column: 3 },
      { gate: 'x', targets: [1], column: 3 },
      { gate: 'cz', targets: [0, 1], column: 4 },
      { gate: 'x', targets: [0], column: 5 },
      { gate: 'x', targets: [1], column: 5 },
      { gate: 'h', targets: [0], column: 6 },
      { gate: 'h', targets: [1], column: 6 },
      { gate: 'measure', targets: [0], column: 7 },
      { gate: 'measure', targets: [1], column: 7 },
    ],
    measure: true,
    shots: 1024,
  };

  it('evaluates an empty circuit as Clifford-compatible (must return true)', () => {
    // Both CircuitRequest and CanonicalCircuit empty shapes
    const emptyCircuitRequest: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measure: false,
      shots: 1024,
    };
    expect(isCliffordCompatible(emptyCircuitRequest)).toBe(true);

    const emptyCanonicalCircuit: CanonicalCircuit = {
      qubits: 3,
      gates: [],
      measurements: [],
    };
    expect(isCliffordCompatible(emptyCanonicalCircuit)).toBe(true);

    expect(isCliffordCompatible({ gates: [] })).toBe(true);
    expect(isCliffordCompatible(null)).toBe(true);
    expect(isCliffordCompatible(undefined)).toBe(true);
  });

  it('evaluates a pure-Clifford circuit as Clifford-compatible (reuse existing Grover case)', () => {
    expect(isCliffordCompatible(groverPureCliffordCircuit)).toBe(true);

    const analyzerResult = analyzeCircuit(groverPureCliffordCircuit);
    expect(analyzerResult.clifford_compatible).toBe(true);
    expect(analyzerResult.stabilizer_candidate).toBe(true);
    expect(analyzerResult.recommended_execution_method).toBe('stabilizer');
    expect(analyzerResult.reason).toContain('Clifford-compatible circuit detected');
  });

  it('evaluates a circuit with one T gate as non-Clifford (must return false)', () => {
    // Clone Grover circuit and insert a single non-Clifford T gate
    const circuitWithTGate: CircuitRequest = {
      ...groverPureCliffordCircuit,
      gates: [
        ...groverPureCliffordCircuit.gates,
        { gate: 't', targets: [0], column: 8 },
      ],
    };

    expect(isCliffordCompatible(circuitWithTGate)).toBe(false);

    const analyzerResult = analyzeCircuit(circuitWithTGate);
    expect(analyzerResult.clifford_compatible).toBe(false);
    expect(analyzerResult.stabilizer_candidate).toBe(false);
    expect(analyzerResult.recommended_execution_method).not.toBe('stabilizer');
    expect(analyzerResult.reason).toContain('non-Clifford gates');
  });

  it('identifies all Clifford group primitives (H, X, Y, Z, S, S-dagger, CNOT, CZ, SWAP) as compatible', () => {
    const allCliffordPrimitives: CanonicalCircuit = {
      qubits: 4,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'x', targets: [1], column: 0 },
        { id: 'g2', type: 'y', targets: [2], column: 0 },
        { id: 'g3', type: 'z', targets: [3], column: 0 },
        { id: 'g4', type: 's', targets: [0], column: 1 },
        { id: 'g5', type: 'sdg', targets: [1], column: 1 }, // S-dagger
        { id: 'g6', type: 's_dagger', targets: [2], column: 1 }, // S-dagger alias
        { id: 'g7', type: 'cx', targets: [0, 1], column: 2 }, // CNOT
        { id: 'g8', type: 'cnot', targets: [2, 3], column: 2 }, // CNOT alias
        { id: 'g9', type: 'cz', targets: [1, 2], column: 3 }, // CZ
        { id: 'g10', type: 'swap', targets: [0, 3], column: 4 }, // SWAP
        { id: 'g11', type: 'id', targets: [0], column: 5 }, // Identity
      ],
      measurements: [{ qubit: 0, classical_bit: 0 }],
    };

    expect(isCliffordCompatible(allCliffordPrimitives)).toBe(true);

    const analysis = analyzeCircuit(allCliffordPrimitives);
    expect(analysis.clifford_compatible).toBe(true);
    expect(analysis.stabilizer_candidate).toBe(true);
    expect(analysis.gate_count).toBe(12);
  });

  it('rejects arbitrary rotation gates and multi-controlled gates as non-Clifford', () => {
    const rxCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [{ gate: 'rx', targets: [0], column: 0, angle: Math.PI / 4 }],
      measure: false,
      shots: 1024,
    };
    expect(isCliffordCompatible(rxCircuit)).toBe(false);

    const rzCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [{ gate: 'rz', targets: [0], column: 0, angle: 1.23 }],
      measure: false,
      shots: 1024,
    };
    expect(isCliffordCompatible(rzCircuit)).toBe(false);

    const toffoliCircuit: CircuitRequest = {
      qubits: 3,
      classical_bits: 3,
      gates: [{ gate: 'ccx', targets: [0, 1, 2], column: 0 }],
      measure: false,
      shots: 1024,
    };
    expect(isCliffordCompatible(toffoliCircuit)).toBe(false);
  });

  it('satisfies the complete CircuitAnalyzerOutput contract shape', () => {
    const result = analyzeCircuit(groverPureCliffordCircuit);

    expect(result).toHaveProperty('qubit_count', 2);
    expect(result).toHaveProperty('gate_count', 14);
    expect(result).toHaveProperty('depth');
    expect(result).toHaveProperty('two_qubit_gate_count');
    expect(result).toHaveProperty('clifford_compatible', true);
    expect(result).toHaveProperty('estimated_statevector_memory_bytes');
    expect(result).toHaveProperty('stabilizer_candidate', true);
    expect(result).toHaveProperty('local_statevector_candidate', true);
    expect(result).toHaveProperty('mps_candidate', false);
    expect(result).toHaveProperty('remote_candidate', false);
    expect(result).toHaveProperty('recommended_execution_method', 'stabilizer');
    expect(result).toHaveProperty('recommended_execution_location', 'local_python');
    expect(result).toHaveProperty('reason');
  });

  // ── Hardware Memory Safety Checks (estimateStatevectorMemory & safe threshold) ──
  it('correctly calculates estimateStatevectorMemory for various qubit counts', () => {
    expect(estimateStatevectorMemory(0)).toBe(0);
    expect(estimateStatevectorMemory(-5)).toBe(0);
    expect(estimateStatevectorMemory(1)).toBe(32); // 2^1 * 16 bytes
    expect(estimateStatevectorMemory(2)).toBe(64); // 2^2 * 16 bytes
    expect(estimateStatevectorMemory(10)).toBe(16384); // 1024 * 16 = 16 KB
    expect(estimateStatevectorMemory(20)).toBe(16777216); // 2^20 * 16 = ~16.78 MB
    expect(estimateStatevectorMemory(30)).toBe(17179869184); // ~17.18 GB
  });

  it('evaluates safe statevector threshold dynamically based on deviceMemory', () => {
    expect(DEFAULT_SAFE_STATEVECTOR_QUBIT_CEILING).toBe(20);

    // Default without device memory
    expect(getSafeStatevectorQubitThreshold(undefined)).toBe(20);

    // Budget devices (<= 2GB)
    expect(getSafeStatevectorQubitThreshold(2)).toBe(20);

    // Mid-range devices (4GB)
    expect(getSafeStatevectorQubitThreshold(4)).toBe(22);

    // High-memory workstations (8GB+)
    expect(getSafeStatevectorQubitThreshold(8)).toBe(24);
    expect(getSafeStatevectorQubitThreshold(16)).toBe(24);
  });

  it('marks non-Clifford circuit exceeding safe threshold as ineligible for local statevector execution', () => {
    // 22-qubit circuit with T-gate (non-Clifford)
    const largeNonCliffordCircuit: CanonicalCircuit = {
      qubits: 22,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 't', targets: [0], column: 1 },
      ],
      measurements: [{ qubit: 0, classical_bit: 0 }],
    };

    // On standard device (20-qubit cap): exceeds safe threshold!
    const analysisStandard = analyzeCircuit(largeNonCliffordCircuit, { deviceMemoryGb: 2 });
    expect(analysisStandard.clifford_compatible).toBe(false);
    expect(analysisStandard.local_statevector_candidate).toBe(false);
    expect(analysisStandard.recommended_execution_location).toBe('remote');
    expect(analysisStandard.reason).toContain('exceeds client safe statevector threshold');

    // On confirmed 8GB device: 22 qubits is within the 24-qubit safe threshold
    const analysisHighMem = analyzeCircuit(largeNonCliffordCircuit, { deviceMemoryGb: 8 });
    expect(analysisHighMem.local_statevector_candidate).toBe(true);
  });

  it('safely analyzes 1000-qubit Clifford circuit without overflow or crash', () => {
    const thousandQubitClifford: CircuitRequest = {
      qubits: 1000,
      classical_bits: 1000,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 'cx', targets: [0, 500], column: 1 },
        { gate: 'cx', targets: [500, 999], column: 2 },
      ],
      measure: true,
      shots: 1024,
    };

    const analysis = analyzeCircuit(thousandQubitClifford);
    expect(analysis.qubit_count).toBe(1000);
    expect(analysis.clifford_compatible).toBe(true);
    expect(analysis.stabilizer_candidate).toBe(true);
    expect(analysis.recommended_execution_method).toBe('stabilizer');
    expect(analysis.stabilizer_memory_bytes).toBeLessThan(1000000); // Under 1 MB!
    expect(Number.isFinite(analysis.stabilizer_memory_bytes)).toBe(true);
  });

  it('safely analyzes 1000-qubit non-Clifford circuit without overflow or crash', () => {
    const thousandQubitNonClifford: CircuitRequest = {
      qubits: 1000,
      classical_bits: 1000,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 't', targets: [0], column: 1 },
      ],
      measure: true,
      shots: 1024,
    };

    const analysis = analyzeCircuit(thousandQubitNonClifford);
    expect(analysis.qubit_count).toBe(1000);
    expect(analysis.clifford_compatible).toBe(false);
    expect(analysis.local_statevector_candidate).toBe(false);
    expect(analysis.remote_candidate).toBe(true);
    expect(analysis.recommended_execution_location).toBe('remote');
    expect(analysis.reason).toContain('exceeds client safe statevector threshold');
    expect(analysis.reason).not.toContain('NaN');
    expect(analysis.reason).not.toContain('Infinity');
  });
});


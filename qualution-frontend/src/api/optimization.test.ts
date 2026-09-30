import { describe, it, expect, vi } from 'vitest';
import * as optimizationApi from './optimization';
import type { CircuitRequest } from '../features/circuit/types';

describe('optimization API client', () => {
  const sampleCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { id: 'g1', gate: 'h', targets: [0], column: 0 },
      { id: 'g2', gate: 'h', targets: [0], column: 1 },
    ],
    measure: true,
    shots: 1000,
  };

  it('sends circuit to POST /api/v1/circuits/optimize and returns structured response', async () => {
    const mockResponse: optimizationApi.OptimizationResponse = {
      original_circuit: sampleCircuit,
      optimized_circuit: {
        ...sampleCircuit,
        gates: [],
      },
      changed: true,
      correctness_verified: true,
      optimization_passes_applied: ['self_inverse_cancellation'],
      original_metrics: {
        qubit_count: 2,
        classical_bit_count: 2,
        gate_count: 2,
        depth: 2,
        single_qubit_gate_count: 2,
        two_qubit_gate_count: 0,
        rotation_gate_count: 0,
        measurement_count: 2,
        two_qubit_gate_ratio: 0,
        statevector_amplitudes: 4,
        statevector_memory_bytes: 64,
        statevector_memory_mb: 0.000061,
        statevector_memory_gb: 0.00000006,
        simulation_memory_class: 'small',
      },
      optimized_metrics: {
        qubit_count: 2,
        classical_bit_count: 2,
        gate_count: 0,
        depth: 0,
        single_qubit_gate_count: 0,
        two_qubit_gate_count: 0,
        rotation_gate_count: 0,
        measurement_count: 2,
        two_qubit_gate_ratio: 0,
        statevector_amplitudes: 4,
        statevector_memory_bytes: 64,
        statevector_memory_mb: 0.000061,
        statevector_memory_gb: 0.00000006,
        simulation_memory_class: 'small',
      },
      improvements: {
        gate_count_reduction: 2,
        gate_count_reduction_percent: 100.0,
        depth_reduction: 2,
        depth_reduction_percent: 100.0,
        two_qubit_gate_reduction: 0,
        two_qubit_gate_reduction_percent: 0.0,
      },
      explanation: ['Cancelled adjacent self-inverse Hadamard gates on qubit 0 (H · H = I).'],
      execution_time_ms: 1.45,
    };

    vi.spyOn(optimizationApi, 'optimizeCircuit').mockResolvedValueOnce(mockResponse);

    const result = await optimizationApi.optimizeCircuit(sampleCircuit);
    expect(result.correctness_verified).toBe(true);
    expect(result.improvements.gate_count_reduction).toBe(2);
    expect(result.explanation[0]).toContain('Hadamard');
  });
});

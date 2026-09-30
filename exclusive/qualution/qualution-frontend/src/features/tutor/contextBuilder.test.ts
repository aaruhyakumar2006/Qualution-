import { describe, it, expect } from 'vitest';
import { buildTutorContext } from './contextBuilder';
import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';

describe('Tutor Context Builder', () => {
  const bellCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { gate: 'h', targets: [0], column: 0 },
      { gate: 'cx', targets: [0, 1], column: 1 },
    ],
    measure: true,
    shots: 1000,
  };

  const mockRunResponse: CircuitRunResponse = {
    circuit: { qubits: 2, classical_bits: 2, gate_count: 2, measure: true, shots: 1000 },
    routing: { requested_backend: 'auto', selected_backend: 'qiskit_aer', framework: 'qiskit', policy: 'lowest_measured_latency', reason: 'ok' },
    simulation: {
      backend: 'qiskit_aer',
      mode: 'shots',
      shots: 1000,
      probabilities: { '00': 0.504, '11': 0.496 },
      statevector: [
        { real: 0.707107, imag: 0 },
        { real: 0, imag: 0 },
        { real: 0, imag: 0 },
        { real: 0.707107, imag: 0 },
      ],
      execution_time_ms: 1.45,
    },
    visualization: {
      bloch: null,
      timeline: {
        total_steps: 2,
        qubits: 2,
        steps: [
          { step: 1, operation: 'h', qubits: [0], probabilities: { '00': 0.5, '10': 0.5 } },
          { step: 2, operation: 'cx', qubits: [0, 1], probabilities: { '00': 0.5, '11': 0.5 } },
        ],
      },
      timeline_notice: null,
    },
    execution_time_ms: 2.34,
  };

  it('builds structured context for a 2-qubit Bell circuit', () => {
    const ctx = buildTutorContext(bellCircuit, mockRunResponse, null, 'beginner');

    expect(ctx.circuit.qubits).toBe(2);
    expect(ctx.circuit.gates.length).toBe(2);
    expect(ctx.simulation?.probabilities['00']).toBe(0.504);
    expect(ctx.statevector?.amplitudes.length).toBe(4);
    expect(ctx.timeline?.totalSteps).toBe(2);
  });

  it('handles missing simulation result gracefully', () => {
    const ctx = buildTutorContext(bellCircuit, null, null, 'technical');

    expect(ctx.circuit.qubits).toBe(2);
    expect(ctx.simulation).toBeNull();
    expect(ctx.statevector).toBeNull();
    expect(ctx.bloch).toBeNull();
  });
});

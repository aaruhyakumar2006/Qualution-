import { describe, it, expect } from 'vitest';
import { extractQuantumFacts } from './quantumFacts';
import { buildTutorContext } from './contextBuilder';
import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';

describe('Quantum Facts Extraction', () => {
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

  const redundantCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { gate: 'h', targets: [0], column: 0 },
      { gate: 'h', targets: [0], column: 1 },
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
      execution_time_ms: 1.45,
    },
    visualization: { bloch: null, timeline: null, timeline_notice: null },
    execution_time_ms: 2.34,
  };

  it('extracts Bell state facts and dominant outcomes', () => {
    const ctx = buildTutorContext(bellCircuit, mockRunResponse, null);
    const facts = extractQuantumFacts(ctx);

    expect(facts.patternName).toContain('Bell State');
    expect(facts.dominantOutcomes.length).toBe(2);
    expect(facts.facts.some((f) => f.includes('Hadamard gate'))).toBe(true);
    expect(facts.suggestedQuestions.some((q) => q.includes('00 and 11'))).toBe(true);
  });

  it('detects redundant consecutive self-inverse gates and unused qubits as anomalies', () => {
    const ctx = buildTutorContext(redundantCircuit, null, null);
    const facts = extractQuantumFacts(ctx);

    expect(facts.anomalies.some((a) => a.includes('Redundant consecutive H'))).toBe(true);
    expect(facts.anomalies.some((a) => a.includes('q[1] has no gates'))).toBe(true);
  });
});

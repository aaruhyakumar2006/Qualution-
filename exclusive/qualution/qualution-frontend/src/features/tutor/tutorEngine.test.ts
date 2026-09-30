import { describe, it, expect } from 'vitest';
import { answerTutorQuestion } from './tutorEngine';
import { buildTutorContext } from './contextBuilder';
import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';

describe('Tutor Engine Answers', () => {
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
      execution_time_ms: 1.45,
    },
    visualization: { bloch: null, timeline: null, timeline_notice: null },
    execution_time_ms: 2.34,
  };

  it('answers "Why do I only get 00 and 11?" with Bell state explanation', async () => {
    const ctx = buildTutorContext(bellCircuit, mockRunResponse, null, 'beginner');
    const res = await answerTutorQuestion('Why do I only get 00 and 11?', ctx);

    expect(res.confidence).toBe('high');
    expect(res.answer).toContain('Hadamard');
    expect(res.answer).toContain('Controlled-NOT');
    expect(res.answer).toContain('50%');
    expect(res.facts.length).toBeGreaterThan(0);
    expect(res.actions.some((a) => a.type === 'open_state')).toBe(true);
  });

  it('gives technical matrix explanation in technical mode', async () => {
    const ctx = buildTutorContext(bellCircuit, mockRunResponse, null, 'technical');
    const res = await answerTutorQuestion('Why do I only get 00 and 11?', ctx);

    expect(res.answer).toContain('|00⟩');
    expect(res.answer).toContain('Z-basis');
    expect(res.answer).toContain('maximally entangled');
  });

  it('handles debug question', async () => {
    const ctx = buildTutorContext(bellCircuit, mockRunResponse, null, 'beginner');
    const res = await answerTutorQuestion('Is there anything wrong or redundant with this circuit?', ctx);

    expect(res.confidence).toBe('high');
    expect(res.actions.some((a) => a.type === 'open_metrics')).toBe(true);
  });

  it('handles prediction question for X gate addition', async () => {
    const ctx = buildTutorContext(bellCircuit, mockRunResponse, null, 'beginner');
    const res = await answerTutorQuestion('What happens if I add an X gate to q1?', ctx);

    expect(res.confidence).toBe('medium');
    expect(res.answer).toContain('flip');
  });

  it('explains schema validation literal_error for unsupported gates p and sdg', async () => {
    const rawError = `[{"type":"literal_error","loc":["body","circuit","gates",4,"gate"],"msg":"Input should be 'h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'cx', 'cz' or 'swap'","input":"p"},{"type":"literal_error","loc":["body","circuit","gates",6,"gate"],"msg":"Input should be 'h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'cx', 'cz' or 'swap'","input":"sdg"}]`;
    const ctx = buildTutorContext(bellCircuit, null, null, 'beginner', rawError);
    const res = await answerTutorQuestion(`Why did this error happen? ${rawError}`, ctx);

    expect(res.confidence).toBe('high');
    expect(res.answer).toContain('Schema Validation Error');
    expect(res.answer).toContain('rz');
    expect(res.answer).toContain('Phase Gate');
    expect(res.answer).toContain('S-dagger');
    expect(res.facts.some((f) => f.includes('RZ'))).toBe(true);
  });

  // ── PHASE 10 / TASK 1: GENERAL ROUTING REASON (NOT HARDCODED GROVER) ─────────
  it('Task 1: Answers "Why did QUALUTION use Stabilizer instead of Statevector?" using GENERAL routing_reason without Grover hardcoding', async () => {
    // 4-qubit Clifford circuit (NOT Grover: 4-qubit GHZ state)
    const ghz4Circuit: CircuitRequest = {
      qubits: 4,
      classical_bits: 4,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 'cx', targets: [0, 1], column: 1 },
        { gate: 'cx', targets: [1, 2], column: 2 },
        { gate: 'cx', targets: [2, 3], column: 3 },
      ],
      measure: true,
      shots: 1000,
    };

    const ctx = buildTutorContext(ghz4Circuit, null, null, 'technical');
    const res = await answerTutorQuestion('Why did QUALUTION use Stabilizer instead of Statevector?', ctx);

    expect(res.confidence).toBe('high');
    // Confirms driven by GENERAL Phase 7 routing_reason:
    expect(res.answer).toContain('Execution Router Decision: Clifford Stabilizer Engine');
    expect(res.answer).toContain('Gottesman-Knill');
    expect(res.answer).toContain('Clifford-compatible circuit detected across all 4 gates on 4 qubits');
    expect(res.answer).toContain('polynomial time O(N^2)');
    expect(res.answer).toContain('4 qubit(s)');
    // CRITICAL: Strictly confirms NO hardcoded Grover text (no "database elements", no "marked state |11>")
    expect(res.answer).not.toContain('database elements');
    expect(res.answer).not.toContain('marked state |11⟩');
    expect(res.answer).not.toContain('Grover step');
  });

  // ── PHASE 10 / TASK 2: NON-GROVER CIRCUIT ROUTED TO STATEVECTOR ──────────────
  it('Task 2: Generates correct, DIFFERENT explanation for non-Clifford circuit referencing actual qubit count and structure', async () => {
    // 3-qubit non-Clifford circuit with RZ(pi/3) and T-gate
    const nonClifford3Circuit: CircuitRequest = {
      qubits: 3,
      classical_bits: 3,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 'rz', targets: [1], column: 0, angle: Math.PI / 3 },
        { gate: 'cx', targets: [0, 1], column: 1 },
        { gate: 't', targets: [2], column: 2 },
      ],
      measure: true,
      shots: 1000,
    };

    const ctx = buildTutorContext(nonClifford3Circuit, null, null, 'technical');
    const res = await answerTutorQuestion('Why did QUALUTION use Statevector instead of Stabilizer?', ctx);

    expect(res.confidence).toBe('high');
    // Confirms Statevector engine selection
    expect(res.answer).toContain('Execution Router Decision: Local Dense Statevector Engine (Tier 2)');
    // Accurately references actual non-Clifford gates in the circuit
    expect(res.answer).toMatch(/RZ|T/);
    expect(res.answer).toContain('3 qubit(s)');
    expect(res.answer).toContain('2^{3} = 8');
    // Cites the general Phase 7 routing_reason
    expect(res.answer).toContain('Circuit contains non-Clifford operations across 3 qubits');
    expect(res.answer).toContain('safe memory threshold');
  });

  // ── PHASE 10 / TASK 3: MPS TELEMETRY & APPROXIMATION IN TUTOR ───────────────
  it('Task 3: Surfaces real fidelity, truncation_error, and approximation metadata in MPS Tutor explanation', async () => {
    // 25-qubit circuit with bounded entanglement routed to MPS
    const mps25Circuit: CircuitRequest = {
      qubits: 25,
      classical_bits: 25,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 't', targets: [0], column: 1 },
        { gate: 'cx', targets: [0, 1], column: 2 },
        { gate: 'cx', targets: [1, 2], column: 3 },
      ],
      measure: true,
      shots: 1024,
    };

    const mockMpsResponse: any = {
      circuit: { qubits: 25, classical_bits: 25, gate_count: 4, measure: true, shots: 1024 },
      routing: {
        requested_backend: 'auto',
        selected_backend: 'qiskit_aer_mps',
        framework: 'qiskit_mps',
        policy: 'tensor_network_bounded_entanglement',
        reason: 'Non-Clifford circuit on 25 qubits exceeds client statevector memory (~512.0 MB), but exhibits bounded two-qubit entanglement (2 entangling gates). Routed to Matrix Product State (MPS) tensor network simulation.',
      },
      simulation: {
        backend: 'qiskit_aer_mps',
        mode: 'shots',
        shots: 1024,
        probabilities: { '0000000000000000000000000': 1.0 },
        execution_time_ms: 35.4,
        fidelity: 0.999987,
        truncation_error: 0.000013,
        approximation: true,
      },
      fidelity: 0.999987,
      truncation_error: 0.000013,
      approximation: true,
      routing_reason: 'Non-Clifford circuit on 25 qubits exceeds client statevector memory (~512.0 MB), but exhibits bounded two-qubit entanglement (2 entangling gates). Routed to Matrix Product State (MPS) tensor network simulation.',
    };

    const ctx = buildTutorContext(mps25Circuit, mockMpsResponse, null, 'technical');
    const res = await answerTutorQuestion('Why did QUALUTION use MPS for this circuit?', ctx);

    expect(res.confidence).toBe('high');
    expect(res.answer).toContain('Matrix Product State (MPS) Tensor Network (Tier 3)');
    expect(res.answer).toContain('25 qubits');
    expect(res.answer).toContain('bounded two-qubit entanglement');
    // Real fidelity and truncation error surfaced:
    expect(res.answer).toContain('99.9987%');
    expect(res.answer).toMatch(/1\.3000e-5|0\.000013/);
    expect(res.answer).toContain('True (Bond dimension truncated)');
    // Facts contain real fidelity
    expect(res.facts.some((f) => f.includes('99.9987%'))).toBe(true);
  });
});

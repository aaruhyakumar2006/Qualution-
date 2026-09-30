import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateAssessment,
  isLessonCompleted,
  markLessonCompleted,
  getCompletedLessonIds,
  resetLearningProgress,
  getTotalXP
} from './assessmentEngine';
import { QUANTUM_CURRICULUM } from './curriculumData';
import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';

describe('assessmentEngine', () => {
  beforeEach(() => {
    resetLearningProgress();
  });

  it('tracks completed lessons and XP correctly in storage', () => {
    expect(getCompletedLessonIds()).toEqual([]);
    expect(getTotalXP()).toBe(0);
    expect(isLessonCompleted('lesson-1-bits-vs-qubits')).toBe(false);

    markLessonCompleted('lesson-1-bits-vs-qubits', 150);
    expect(getCompletedLessonIds()).toContain('lesson-1-bits-vs-qubits');
    expect(isLessonCompleted('lesson-1-bits-vs-qubits')).toBe(true);
    expect(getTotalXP()).toBe(150);

    // Duplicate completion should not add extra XP
    markLessonCompleted('lesson-1-bits-vs-qubits', 150);
    expect(getTotalXP()).toBe(150);

    // Add another lesson
    markLessonCompleted('lesson-2-superposition-hadamard', 200);
    expect(getCompletedLessonIds().length).toBe(2);
    expect(getTotalXP()).toBe(350);
  });

  it('evaluates Lesson 1 Bits vs Qubits (X Gate) criteria accurately', () => {
    const lesson1 = QUANTUM_CURRICULUM[0];
    const emptyCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [],
      measure: true,
      shots: 1000
    };

    // Missing X gate
    const failRes = evaluateAssessment(emptyCircuit, null, lesson1.assessment.criteria);
    expect(failRes.passed).toBe(false);
    expect(failRes.details.some((d) => d.includes('Missing required quantum operator'))).toBe(true);

    // Correct X circuit with simulation
    const validCircuit: CircuitRequest = {
      qubits: 1,
      classical_bits: 1,
      gates: [{ id: '1', gate: 'x', targets: [0] }],
      measure: true,
      shots: 1000
    };

    const mockRunResponse = {
      circuit: { qubits: 1, classical_bits: 1, gate_count: 1, measure: true, shots: 1000 },
      routing: { requested_backend: 'auto', selected_backend: 'qiskit_aer', framework: 'qiskit' },
      metrics: {
        qubit_count: 1,
        classical_bit_count: 1,
        gate_count: 1,
        depth: 1,
        single_qubit_gate_count: 1,
        two_qubit_gate_count: 0,
        rotation_gate_count: 0,
        measurement_count: 1,
        two_qubit_gate_ratio: 0,
        statevector_amplitudes: 2,
        statevector_memory_bytes: 32,
        statevector_memory_mb: 0.00003,
        statevector_memory_gb: 0.00000003,
        simulation_memory_class: 'small'
      },
      simulation: {
        backend: 'qiskit_aer',
        shots: 1000,
        counts: { '1': 1000 },
        probabilities: { '1': 1.0 },
        execution_time_ms: 1.2
      }
    } as unknown as CircuitRunResponse;

    const passRes = evaluateAssessment(validCircuit, mockRunResponse, lesson1.assessment.criteria);
    expect(passRes.passed).toBe(true);
    expect(passRes.fidelityScore).toBeGreaterThanOrEqual(95);
    expect(passRes.title).toContain('Assessment Passed');
  });

  it('evaluates Lesson 3 Bell State with forbidden leakage checks', () => {
    const lesson3 = QUANTUM_CURRICULUM[2];
    const bellCircuit: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: '1', gate: 'h', targets: [0] },
        { id: '2', gate: 'cx', targets: [0, 1] }
      ],
      measure: true,
      shots: 1000
    };

    // Leaking circuit into 01/10
    const leakingResponse = {
      circuit: { qubits: 2, classical_bits: 2, gate_count: 2, measure: true, shots: 1000 },
      routing: { requested_backend: 'auto', selected_backend: 'qiskit_aer', framework: 'qiskit' },
      metrics: {
        qubit_count: 2,
        classical_bit_count: 2,
        gate_count: 2,
        depth: 2,
        single_qubit_gate_count: 1,
        two_qubit_gate_count: 1,
        rotation_gate_count: 0,
        measurement_count: 2,
        two_qubit_gate_ratio: 0.5,
        statevector_amplitudes: 4,
        statevector_memory_bytes: 64,
        statevector_memory_mb: 0.00006,
        statevector_memory_gb: 0.00000006,
        simulation_memory_class: 'small'
      },
      simulation: {
        backend: 'qiskit_aer',
        shots: 1000,
        counts: { '00': 300, '01': 300, '10': 200, '11': 200 },
        probabilities: { '00': 0.3, '01': 0.3, '10': 0.2, '11': 0.2 },
        execution_time_ms: 1.5
      }
    } as unknown as CircuitRunResponse;

    const failLeak = evaluateAssessment(bellCircuit, leakingResponse, lesson3.assessment.criteria);
    expect(failLeak.passed).toBe(false);
    expect(failLeak.details.some((d) => d.includes('Unexpected leakage'))).toBe(true);

    // Correct Bell state
    const cleanBellResponse = {
      ...leakingResponse,
      simulation: {
        backend: 'qiskit_aer',
        shots: 1000,
        counts: { '00': 510, '11': 490 },
        probabilities: { '00': 0.51, '11': 0.49, '01': 0.0, '10': 0.0 },
        execution_time_ms: 1.5
      }
    } as unknown as CircuitRunResponse;

    const passBell = evaluateAssessment(bellCircuit, cleanBellResponse, lesson3.assessment.criteria);
    expect(passBell.passed).toBe(true);
    expect(passBell.fidelityScore).toBeGreaterThanOrEqual(95);
  });

  it('evaluates Lesson 8 Grover Search (2-Qubit Target |11⟩) with misconception diagnostics', () => {
    const groverModule = QUANTUM_CURRICULUM.find((m) => m.id === 'lesson-8-grovers-search')!;
    expect(groverModule).toBeDefined();

    // 1. Missing initial Hadamard diagnostic
    const missingHCircuit: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: '1', gate: 'cz', targets: [0, 1] }
      ],
      measure: true,
      shots: 1000
    };
    const failHRes = evaluateAssessment(missingHCircuit, null, groverModule.assessment.criteria);
    expect(failHRes.passed).toBe(false);

    // 2. Naked CNOT diagnostic
    const nakedCxCircuit: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: '1', gate: 'h', targets: [0], column: 0 },
        { id: '2', gate: 'h', targets: [1], column: 0 },
        { id: '3', gate: 'cx', targets: [0, 1], column: 1 }
      ],
      measure: true,
      shots: 1000
    };
    const failCxRes = evaluateAssessment(nakedCxCircuit, null, groverModule.assessment.criteria);
    expect(failCxRes.passed).toBe(false);
    expect(failCxRes.hints.some((h) => h.includes('Naked CNOT detected'))).toBe(true);

    // 3. Missing X in diffuser diagnostic
    const missingXDiffCircuit: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: '1', gate: 'h', targets: [0], column: 0 },
        { id: '2', gate: 'h', targets: [1], column: 0 },
        { id: '3', gate: 'cz', targets: [0, 1], column: 1 },
        { id: '4', gate: 'h', targets: [0], column: 2 },
        { id: '5', gate: 'h', targets: [1], column: 2 }
      ],
      measure: true,
      shots: 1000
    };
    const failXRes = evaluateAssessment(missingXDiffCircuit, null, groverModule.assessment.criteria);
    expect(failXRes.passed).toBe(false);
    expect(failXRes.hints.some((h) => h.includes('Missing X gates in diffuser'))).toBe(true);

    // 4. Valid full Grover circuit passing with >95% probability on |11⟩
    const validGroverCircuit: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        // Init
        { id: '1', gate: 'h', targets: [0], column: 0 },
        { id: '2', gate: 'h', targets: [1], column: 0 },
        // Oracle
        { id: '3', gate: 'cz', targets: [0, 1], column: 1 },
        // Diffusion
        { id: '4', gate: 'h', targets: [0], column: 2 },
        { id: '5', gate: 'h', targets: [1], column: 2 },
        { id: '6', gate: 'x', targets: [0], column: 3 },
        { id: '7', gate: 'x', targets: [1], column: 3 },
        { id: '8', gate: 'cz', targets: [0, 1], column: 4 },
        { id: '9', gate: 'x', targets: [0], column: 5 },
        { id: '10', gate: 'x', targets: [1], column: 5 },
        { id: '11', gate: 'h', targets: [0], column: 6 },
        { id: '12', gate: 'h', targets: [1], column: 6 }
      ],
      measure: true,
      shots: 1000
    };

    const groverRunResponse = {
      circuit: validGroverCircuit,
      routing: { requested_backend: 'auto', selected_backend: 'qiskit_aer', framework: 'qiskit' },
      simulation: {
        backend: 'qiskit_aer',
        shots: 1000,
        counts: { '11': 1000 },
        probabilities: { '11': 1.0, '00': 0.0, '01': 0.0, '10': 0.0 },
        execution_time_ms: 2.1
      }
    } as unknown as CircuitRunResponse;

    const passGrover = evaluateAssessment(validGroverCircuit, groverRunResponse, groverModule.assessment.criteria);
    expect(passGrover.passed).toBe(true);
    expect(passGrover.fidelityScore).toBeGreaterThanOrEqual(95);
    expect(passGrover.title).toContain('Assessment Passed');

    // Verify progress persistence for Grover
    markLessonCompleted('lesson-8-grovers-search', 350);
    expect(isLessonCompleted('lesson-8-grovers-search')).toBe(true);
    expect(getTotalXP()).toBe(350);
  });
});

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { normalizeExecutionResult, toVisualizationPayload } from './resultNormalizer';
import { simulateStabilizerCircuit } from './stabilizerEngine';
import { simulateStatevectorCircuit } from './statevectorEngine';
import { simulateViaCloud } from './cloudEngine';
import { ProbabilityHistogram } from '../../components/visualization/ProbabilityHistogram';
import { StatevectorView } from '../../components/visualization/StatevectorView';
import { QSphereView } from '../../components/visualization/QSphereView';
import { BlochSphere } from '../../components/visualization/BlochSphere';
import type { CanonicalCircuit } from './types';

describe('normalizeExecutionResult Unit Tests', () => {
  it('normalizes Stabilizer output: ensures statevector is undefined and counts/probs are uniform binary', () => {
    const rawStabilizer = {
      backend: 'stabilizer_engine',
      qubit_count: 2,
      shots: 500,
      counts: { '00': 250, '11': 250 },
      probabilities: { '00': 0.5, '11': 0.5 },
      runtime_ms: 1.42,
    };

    const normalized = normalizeExecutionResult(rawStabilizer, 'stabilizer');

    expect(normalized.backend).toBe('stabilizer_engine');
    expect(normalized.execution_method).toBe('stabilizer');
    expect(normalized.execution_location).toBe('local_browser');
    expect(normalized.qubit_count).toBe(2);
    expect(normalized.shots).toBe(500);
    expect(normalized.counts).toEqual({ '00': 250, '11': 250 });
    expect(normalized.probabilities).toEqual({ '00': 0.5, '11': 0.5 });
    // CRITICAL: Genuine optionality - Stabilizer must NOT have continuous statevector
    expect(normalized.statevector).toBeUndefined();
    expect(normalized.amplitudes).toBeUndefined();
    expect(normalized.fidelity).toBeUndefined();
    expect(normalized.truncation_error).toBeUndefined();
    expect(normalized.runtime_ms).toBe(1.42);
  });

  it('normalizes Statevector output: preserves continuous amplitudes and validates probabilities', () => {
    const rawStatevector = {
      backend: 'statevector_engine',
      qubit_count: 1,
      shots: 1000,
      counts: { '0': 500, '1': 500 },
      probabilities: { '0': 0.5, '1': 0.5 },
      statevector: [
        { real: Math.SQRT1_2, imag: 0 },
        { real: Math.SQRT1_2, imag: 0 },
      ],
      runtime_ms: 0.85,
    };

    const normalized = normalizeExecutionResult(rawStatevector, 'statevector');

    expect(normalized.backend).toBe('statevector_engine');
    expect(normalized.execution_method).toBe('statevector');
    expect(normalized.qubit_count).toBe(1);
    expect(normalized.statevector).toBeDefined();
    expect(normalized.statevector?.length).toBe(2);
    expect(normalized.statevector?.[0].real).toBeCloseTo(Math.SQRT1_2, 5);
    expect(normalized.statevector?.[1].real).toBeCloseTo(Math.SQRT1_2, 5);
    expect(normalized.probabilities).toEqual({ '0': 0.5, '1': 0.5 });
  });

  it('normalizes MPS output: converts hex bitstrings to padded binary and preserves real fidelity/truncation_error', () => {
    const rawMps = {
      backend: 'qiskit_aer_mps',
      qubit_count: 3,
      shots: 1024,
      counts: { '0x0': 512, '0x7': 512 },
      fidelity: 0.999987,
      truncation_error: 0.000013,
      runtime_ms: 12.4,
    };

    const normalized = normalizeExecutionResult(rawMps, 'mps');

    expect(normalized.backend).toBe('qiskit_aer_mps');
    expect(normalized.execution_method).toBe('mps');
    expect(normalized.execution_location).toBe('local_python');
    expect(normalized.qubit_count).toBe(3);
    // '0x0' -> '000', '0x7' -> '111'
    expect(normalized.counts).toEqual({ '000': 512, '111': 512 });
    expect(normalized.probabilities).toHaveProperty('000', 0.5);
    expect(normalized.probabilities).toHaveProperty('111', 0.5);
    // Genuine fidelity and truncation error
    expect(normalized.fidelity).toBe(0.999987);
    expect(normalized.truncation_error).toBe(0.000013);
    expect(normalized.approximation).toBe(true);
    // MPS on 3 qubits does not produce continuous statevector unless explicitly computed
    expect(normalized.statevector).toBeUndefined();
  });

  it('normalizes Cloud-stub output: strictly preserves honest status and roadmap message', () => {
    const rawCloud = {
      status: 'not_implemented',
      message: 'Cloud/QPU execution is on the roadmap',
      backend: 'cloud_qpu',
      qubit_count: 50,
      shots: 1024,
      counts: {},
      probabilities: {},
      runtime_ms: 0,
    };

    const normalized = normalizeExecutionResult(rawCloud, 'cloud');

    expect(normalized.status).toBe('not_implemented');
    expect(normalized.message).toBe('Cloud/QPU execution is on the roadmap');
    expect(normalized.backend).toBe('cloud_qpu');
    expect(normalized.execution_location).toBe('cloud');
    expect(normalized.execution_method).toBe('cloud');
    expect(normalized.qubit_count).toBe(50);
    expect(normalized.counts).toEqual({});
    expect(normalized.probabilities).toEqual({});
    expect(normalized.statevector).toBeUndefined();
    expect(normalized.runtime_ms).toBe(0);
  });

  it('reconstructs missing probabilities from counts and vice-versa', () => {
    // Only counts provided
    const withCountsOnly = normalizeExecutionResult(
      { qubit_count: 2, shots: 100, counts: { '00': 70, '11': 30 } },
      'stabilizer'
    );
    expect(withCountsOnly.probabilities).toEqual({ '00': 0.7, '11': 0.3 });

    // Only probabilities provided
    const withProbsOnly = normalizeExecutionResult(
      { qubit_count: 2, shots: 100, probabilities: { '00': 0.6, '11': 0.4 } },
      'stabilizer'
    );
    expect(withProbsOnly.counts).toEqual({ '00': 60, '11': 40 });
  });

  it('toVisualizationPayload maps UnifiedExecutionResult to normalized CircuitRunResponse', () => {
    const unified = normalizeExecutionResult({
      backend: 'stabilizer_engine',
      qubit_count: 2,
      shots: 1000,
      counts: { '00': 500, '11': 500 },
      runtime_ms: 2.5,
      routing_reason: 'Aaronson-Gottesman polynomial-time Clifford simulation',
    }, 'stabilizer');

    const payload = toVisualizationPayload(unified);

    expect(payload.circuit.qubits).toBe(2);
    expect(payload.simulation.backend).toBe('stabilizer_engine');
    expect(payload.simulation.counts).toEqual({ '00': 500, '11': 500 });
    expect(payload.simulation.probabilities).toEqual({ '00': 0.5, '11': 0.5 });
    expect(payload.simulation.statevector).toBeUndefined();
    expect(payload.routing.selected_backend).toBe('stabilizer_engine');
    expect(payload.routing.reason).toContain('Aaronson-Gottesman');
  });
});

describe('Engine Output Path Normalization Confirmations', () => {
  const bellCircuit: CanonicalCircuit = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { id: 'g0', type: 'h', targets: [0], column: 0 },
      { id: 'g1', type: 'cx', targets: [0, 1], column: 1 },
    ],
    measurements: [
      { qubit: 0, classical_bit: 0 },
      { qubit: 1, classical_bit: 1 },
    ],
    measure: true,
    shots: 500,
  };

  it('simulateStabilizerCircuit output is fully normalized with undefined continuous statevector', () => {
    const result = simulateStabilizerCircuit(bellCircuit, { shots: 200 });

    expect(result.backend).toBe('stabilizer_engine');
    expect(result.execution_method).toBe('stabilizer');
    expect(result.shots).toBe(200);
    expect(result.qubit_count).toBe(2);
    expect(result.counts).toBeDefined();
    expect(result.probabilities).toBeDefined();
    // Genuine absence of statevector
    expect(result.statevector).toBeUndefined();
    expect(result.amplitudes).toBeUndefined();
    expect(result.runtime_ms).toBeGreaterThanOrEqual(0);
  });

  it('simulateStatevectorCircuit output is fully normalized with complex amplitudes', () => {
    const result = simulateStatevectorCircuit(bellCircuit, { shots: 200 });

    expect(result.backend).toBe('statevector_engine');
    expect(result.execution_method).toBe('statevector');
    expect(result.qubit_count).toBe(2);
    expect(result.statevector).toBeDefined();
    expect(result.statevector?.length).toBe(4);
    expect(result.runtime_ms).toBeGreaterThanOrEqual(0);
  });

  it('simulateViaCloud output is fully normalized with honest not_implemented status', () => {
    const result = simulateViaCloud(bellCircuit, { shots: 100 });

    expect(result.status).toBe('not_implemented');
    expect(result.message).toBe('Cloud/QPU execution is on the roadmap');
    expect(result.backend).toBe('cloud_qpu');
    expect(result.statevector).toBeUndefined();
    expect(result.counts).toEqual({});
    expect(result.probabilities).toEqual({});
  });
});

describe('Visualization Components Graceful Absence & Resilience Tests', () => {
  it('ProbabilityHistogram renders correctly with Stabilizer results and does not crash', () => {
    const stabilizerRes = simulateStabilizerCircuit({
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'cx', targets: [0, 1], column: 1 },
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
      ],
      shots: 500,
    });

    render(
      <ProbabilityHistogram
        probabilities={stabilizerRes.probabilities}
        counts={stabilizerRes.counts}
        totalShots={stabilizerRes.shots}
      />
    );

    expect(screen.getByTestId('probability-histogram')).toBeInTheDocument();
  });

  it('ProbabilityHistogram gracefully handles empty/undefined distributions (e.g. Cloud stub)', () => {
    const cloudRes = simulateViaCloud({
      qubits: 10,
      classical_bits: 10,
      gates: [],
      measurements: [],
    });

    render(
      <ProbabilityHistogram
        probabilities={cloudRes.probabilities}
        counts={cloudRes.counts}
        totalShots={cloudRes.shots}
      />
    );

    expect(screen.getByTestId('probability-histogram')).toBeInTheDocument();
    expect(screen.getByText(/No Measurement Distribution Available/i)).toBeInTheDocument();
  });

  it('StatevectorView gracefully handles undefined statevector without crashing', () => {
    const stabilizerRes = simulateStabilizerCircuit({
      qubits: 2,
      classical_bits: 2,
      gates: [{ id: 'g0', type: 'h', targets: [0], column: 0 }],
      measurements: [],
    });

    // Stabilizer results have statevector === undefined
    expect(stabilizerRes.statevector).toBeUndefined();

    render(
      <StatevectorView
        statevector={stabilizerRes.statevector}
        probabilities={stabilizerRes.probabilities}
      />
    );

    expect(screen.getByTestId('statevector-empty')).toBeInTheDocument();
    expect(screen.getByText(/Continuous Statevector Unavailable/i)).toBeInTheDocument();
  });

  it('StatevectorView renders properly when continuous statevector is present', () => {
    const statevectorRes = simulateStatevectorCircuit({
      qubits: 1,
      classical_bits: 1,
      gates: [{ id: 'g0', type: 'h', targets: [0], column: 0 }],
      measurements: [],
    });

    render(
      <StatevectorView
        statevector={statevectorRes.statevector}
        probabilities={statevectorRes.probabilities}
      />
    );

    expect(screen.getByTestId('statevector-view')).toBeInTheDocument();
  });

  it('QSphereView gracefully handles undefined statevector without crashing', () => {
    const stabilizerRes = simulateStabilizerCircuit({
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measurements: [],
    });

    render(
      <QSphereView
        statevector={stabilizerRes.statevector ?? null}
        qubitCount={stabilizerRes.qubit_count}
      />
    );

    expect(screen.getByTestId('qsphere-empty')).toBeInTheDocument();
    expect(screen.getByText(/Continuous statevector amplitudes are required for spherical projection/i)).toBeInTheDocument();
  });

  it('BlochSphere gracefully handles absent Bloch vectors without crashing', () => {
    render(
      <BlochSphere
        bloch={null}
        blochQubits={null}
        qubitCount={2}
      />
    );

    expect(screen.getByTestId('bloch-sphere-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Bloch Sphere Ready/i)).toBeInTheDocument();
  });
});

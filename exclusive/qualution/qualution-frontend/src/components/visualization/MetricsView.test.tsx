import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MetricsView } from './MetricsView';
import type { CircuitMetricsResponse, CircuitRunRoutingSummary } from '../../features/circuit/types';
import type { VerificationTableRow } from '../../features/teaching/lessons/sprint-02/groverVerification';

const mockMetrics: CircuitMetricsResponse = {
  qubit_count: 3,
  classical_bit_count: 3,
  gate_count: 5,
  depth: 4,
  single_qubit_gate_count: 3,
  two_qubit_gate_count: 2,
  rotation_gate_count: 0,
  measurement_count: 3,
  two_qubit_gate_ratio: 0.4,
  statevector_amplitudes: 8,
  statevector_memory_bytes: 128,
  statevector_memory_mb: 0.000122,
  statevector_memory_gb: 0.00000012,
  simulation_memory_class: 'lightweight desktop simulation',
};

const mockRouting: CircuitRunRoutingSummary = {
  requested_backend: 'auto',
  selected_backend: 'qiskit_aer',
  framework: 'qiskit',
  policy: 'lowest_measured_latency',
  reason: 'Selected qiskit_aer with lowest measured latency of 1.45 ms across benchmark iterations.',
};

const mockVerificationTable: VerificationTableRow[] = [
  {
    metric: 'Target State Superposition',
    value: '|111⟩ 100%',
    requirement: 'P(|111⟩) >= 95%',
    status: 'PASS',
  },
  {
    metric: 'Diffusion Gate Count',
    value: '4 Gates',
    requirement: '<= 6 Gates',
    status: 'PASS',
  },
];

describe('MetricsView (Circuit Analyzer Redesign)', () => {
  it('renders the Phase 2 standard header bar with title and live telemetry pill', () => {
    render(<MetricsView metrics={mockMetrics} routing={mockRouting} executionTimeMs={2.3} />);

    expect(screen.getByTestId('metrics-view')).toBeInTheDocument();
    expect(screen.getByText('Circuit Analyzer')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getAllByText('2.3 ms').length).toBeGreaterThanOrEqual(1);
  });

  it('renders measured circuit facts in scannable cards with empirical distinction', () => {
    render(<MetricsView metrics={mockMetrics} routing={mockRouting} executionTimeMs={2.3} />);

    // Section title
    expect(screen.getByText('Measured Circuit Facts')).toBeInTheDocument();
    expect(screen.getByText('EMPIRICAL TOPOLOGY')).toBeInTheDocument();

    // Metric numbers and labels
    expect(screen.getByText('Qubits')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('Total Gates')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Circuit Depth')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    expect(screen.getByText('2Q Gate Ratio')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();

    // Secondary scaling strip
    expect(screen.getByText('128 Bytes')).toBeInTheDocument();
    expect(screen.getByText(/2\^3 = 8/)).toBeInTheDocument();
  });

  it('renders AI-derived recommendation with distinct styling, backend target, and routing rationale', () => {
    render(<MetricsView metrics={mockMetrics} routing={mockRouting} executionTimeMs={2.3} />);

    // AI recommendation section title & badge
    expect(screen.getByText('AI Execution Recommendation')).toBeInTheDocument();
    expect(screen.getByText('AI ROUTING')).toBeInTheDocument();

    // Recommendation card contents
    expect(screen.getByText('Qiskit Aer Simulator')).toBeInTheDocument();
    expect(screen.getByText('RECOMMENDED')).toBeInTheDocument();
    expect(screen.getByText(/Local Hardware \(C\+\+ Aer Acceleration\)/)).toBeInTheDocument();

    // AI routing rationale
    expect(screen.getByText('AI Routing Rationale')).toBeInTheDocument();
    expect(
      screen.getByText('Selected qiskit_aer with lowest measured latency of 1.45 ms across benchmark iterations.')
    ).toBeInTheDocument();
  });

  it('applies live-updated CSS animation class when metric values change dynamically', () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <MetricsView metrics={mockMetrics} routing={mockRouting} executionTimeMs={2.3} />
    );

    // Initial render should not have live-updated on gate count
    const gateCountCard = screen.getByText('Total Gates').closest('.metric-card');
    expect(gateCountCard).not.toHaveClass('live-updated');

    // Update gate count and depth
    const updatedMetrics: CircuitMetricsResponse = {
      ...mockMetrics,
      gate_count: 6,
      depth: 5,
    };

    act(() => {
      rerender(<MetricsView metrics={updatedMetrics} routing={mockRouting} executionTimeMs={2.8} />);
    });

    // Both updated metric cards should now have the live-updated class
    expect(screen.getByText('Total Gates').closest('.metric-card')).toHaveClass('live-updated');
    expect(screen.getByText('Circuit Depth').closest('.metric-card')).toHaveClass('live-updated');
    expect(screen.getByText('UPDATED')).toBeInTheDocument();

    // After animation timeout (1100ms), highlight class resets
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByText('Total Gates').closest('.metric-card')).not.toHaveClass('live-updated');
    expect(screen.getByText('Circuit Depth').closest('.metric-card')).not.toHaveClass('live-updated');

    vi.useRealTimers();
  });

  it('renders warning banner when circuit memory or qubit count is high', () => {
    const largeMetrics: CircuitMetricsResponse = {
      ...mockMetrics,
      qubit_count: 18,
      statevector_memory_mb: 4096,
      statevector_memory_gb: 4.0,
    };

    render(<MetricsView metrics={largeMetrics} routing={mockRouting} executionTimeMs={2.3} />);

    expect(screen.getByText('High Quantum Resource Consumption')).toBeInTheDocument();
    expect(screen.getByText(/18 qubits require ~4.00 GB/)).toBeInTheDocument();
  });

  it('renders algorithm verification matrix when verificationTable is provided', () => {
    render(
      <MetricsView
        metrics={mockMetrics}
        routing={mockRouting}
        executionTimeMs={2.3}
        verificationTable={mockVerificationTable}
      />
    );

    expect(screen.getByTestId('circuit-analyzer-verification-table')).toBeInTheDocument();
    expect(screen.getByTestId('verification-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('verification-row-1')).toBeInTheDocument();
    expect(screen.getByText('Target State Superposition')).toBeInTheDocument();
    expect(screen.getByText('ALL CONSTRAINTS PASSED')).toBeInTheDocument();
  });

  it('renders empty state when metrics is null or undefined', () => {
    render(<MetricsView metrics={null} routing={null} executionTimeMs={0} />);

    expect(screen.getByTestId('metrics-view')).toHaveClass('empty');
    expect(screen.getByText('Circuit Analyzer Idle')).toBeInTheDocument();
  });
});

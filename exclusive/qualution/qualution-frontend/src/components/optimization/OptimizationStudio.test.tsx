import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OptimizationStudio } from './OptimizationStudio';
import * as optimizationApi from '../../api/optimization';
import type { CircuitRequest } from '../../features/circuit/types';

describe('OptimizationStudio Component', () => {
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

  const mockSuccessResponse: optimizationApi.OptimizationResponse = {
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

  it('renders loading state when opening and analyzing circuit', async () => {
    vi.spyOn(optimizationApi, 'optimizeCircuit').mockReturnValue(new Promise(() => {}));
    render(
      <OptimizationStudio
        isOpen={true}
        circuit={sampleCircuit}
        onClose={vi.fn()}
        onApplyOptimization={vi.fn()}
      />
    );

    expect(screen.getByTestId('optimization-loading')).toBeInTheDocument();
    expect(screen.getByText(/Analyzing circuit and computing formal unitary equivalence/i)).toBeInTheDocument();
  });

  it('renders formal verification, metrics, diffs, and explanations upon success', async () => {
    vi.spyOn(optimizationApi, 'optimizeCircuit').mockResolvedValueOnce(mockSuccessResponse);
    render(
      <OptimizationStudio
        isOpen={true}
        circuit={sampleCircuit}
        originalExecutionTimeMs={2.5}
        onClose={vi.fn()}
        onApplyOptimization={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('formal-verification-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/✓ Formal Equivalence Verified/i)).toBeInTheDocument();
    expect(screen.getByTestId('metric-gate-count')).toBeInTheDocument();
    expect(screen.getByTestId('circuit-comparison')).toBeInTheDocument();
    expect(screen.getByText(/Hadamard gates on qubit 0/i)).toBeInTheDocument();

    const applyBtn = screen.getByTestId('btn-apply-optimization');
    expect(applyBtn).not.toBeDisabled();
  });

  it('handles backend optimization errors gracefully and preserves circuit', async () => {
    vi.spyOn(optimizationApi, 'optimizeCircuit').mockRejectedValueOnce(new Error('Optimization backend timeout'));
    render(
      <OptimizationStudio
        isOpen={true}
        circuit={sampleCircuit}
        onClose={vi.fn()}
        onApplyOptimization={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('optimization-error-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/Optimization backend timeout/i)).toBeInTheDocument();
    expect(screen.getByText(/Your original circuit was preserved without modification/i)).toBeInTheDocument();

    const applyBtn = screen.getByTestId('btn-apply-optimization');
    expect(applyBtn).toBeDisabled();
  });

  it('disables apply button when formal equivalence is not verified', async () => {
    const unverifiedResponse: optimizationApi.OptimizationResponse = {
      ...mockSuccessResponse,
      correctness_verified: false,
    };

    vi.spyOn(optimizationApi, 'optimizeCircuit').mockResolvedValueOnce(unverifiedResponse);
    render(
      <OptimizationStudio
        isOpen={true}
        circuit={sampleCircuit}
        onClose={vi.fn()}
        onApplyOptimization={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('formal-verification-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/⚠ Optimization Rejected/i)).toBeInTheDocument();
    const applyBtn = screen.getByTestId('btn-apply-optimization');
    expect(applyBtn).toBeDisabled();
  });

  it('calls onApplyOptimization callback when Apply Optimization is clicked', async () => {
    const handleApply = vi.fn();
    const handleClose = vi.fn();

    vi.spyOn(optimizationApi, 'optimizeCircuit').mockResolvedValueOnce(mockSuccessResponse);
    render(
      <OptimizationStudio
        isOpen={true}
        circuit={sampleCircuit}
        onClose={handleClose}
        onApplyOptimization={handleApply}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('btn-apply-optimization')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('btn-apply-optimization'));
    expect(handleApply).toHaveBeenCalledWith(mockSuccessResponse.optimized_circuit, mockSuccessResponse);
    expect(handleClose).toHaveBeenCalled();
  });

  it('enables Circuit Already Optimal button when verified and calls onApplyOptimization and onClose when clicked', async () => {
    const handleApply = vi.fn();
    const handleClose = vi.fn();

    const optimalResponse: optimizationApi.OptimizationResponse = {
      ...mockSuccessResponse,
      changed: false,
      correctness_verified: true,
      optimization_passes_applied: [],
      improvements: {
        gate_count_reduction: 0,
        gate_count_reduction_percent: 0,
        depth_reduction: 0,
        depth_reduction_percent: 0,
        two_qubit_gate_reduction: 0,
        two_qubit_gate_reduction_percent: 0,
      },
    };

    vi.spyOn(optimizationApi, 'optimizeCircuit').mockResolvedValueOnce(optimalResponse);
    render(
      <OptimizationStudio
        isOpen={true}
        circuit={sampleCircuit}
        onClose={handleClose}
        onApplyOptimization={handleApply}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Circuit Already Optimal/i)).toBeInTheDocument();
    });

    const optimalBtn = screen.getByTestId('btn-apply-optimization');
    expect(optimalBtn).not.toBeDisabled();

    fireEvent.click(optimalBtn);
    expect(handleApply).toHaveBeenCalledWith(optimalResponse.optimized_circuit, optimalResponse);
    expect(handleClose).toHaveBeenCalled();
  });
});

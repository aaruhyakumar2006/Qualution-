import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TimelineView } from './TimelineView';
import type { TimelineResponse } from '../../features/circuit/types';

describe('TimelineView Component (Dynamic Execution Tracking & Playback)', () => {
  const mockBellTimeline: TimelineResponse = {
    backend: 'qiskit_statevector_timeline',
    qubits: 2,
    total_steps: 3,
    steps: [
      {
        step: 0,
        operation: 'initial',
        qubits: [],
        parameters: null,
        statevector: [
          { real: 1.0, imag: 0.0 },
          { real: 0.0, imag: 0.0 },
          { real: 0.0, imag: 0.0 },
          { real: 0.0, imag: 0.0 },
        ],
        probabilities: { '00': 1.0, '01': 0.0, '10': 0.0, '11': 0.0 },
        bloch_qubits: {
          '0': { x: 0.0, y: 0.0, z: 1.0, purity: 1.0, magnitude: 1.0 },
          '1': { x: 0.0, y: 0.0, z: 1.0, purity: 1.0, magnitude: 1.0 },
        },
      },
      {
        step: 1,
        operation: 'h',
        qubits: [0],
        parameters: null,
        statevector: [
          { real: 0.70710678, imag: 0.0 },
          { real: 0.70710678, imag: 0.0 },
          { real: 0.0, imag: 0.0 },
          { real: 0.0, imag: 0.0 },
        ],
        probabilities: { '00': 0.5, '01': 0.5, '10': 0.0, '11': 0.0 },
        bloch_qubits: {
          '0': { x: 1.0, y: 0.0, z: 0.0, purity: 1.0, magnitude: 1.0 },
          '1': { x: 0.0, y: 0.0, z: 1.0, purity: 1.0, magnitude: 1.0 },
        },
      },
      {
        step: 2,
        operation: 'cx',
        qubits: [0, 1],
        parameters: null,
        statevector: [
          { real: 0.70710678, imag: 0.0 },
          { real: 0.0, imag: 0.0 },
          { real: 0.0, imag: 0.0 },
          { real: 0.70710678, imag: 0.0 },
        ],
        probabilities: { '00': 0.5, '01': 0.0, '10': 0.0, '11': 0.5 },
        bloch_qubits: {
          '0': { x: 0.0, y: 0.0, z: 0.0, purity: 0.5, magnitude: 0.0 },
          '1': { x: 0.0, y: 0.0, z: 0.0, purity: 0.5, magnitude: 0.0 },
        },
      },
    ],
    execution_time_ms: 1.2,
  };

  it('renders one initial step + one step per executed gate dynamically', () => {
    render(<TimelineView timeline={mockBellTimeline} />);

    expect(screen.getByTestId('timeline-view')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-step-btn-0')).toHaveTextContent('Init');
    expect(screen.getByTestId('timeline-step-btn-1')).toHaveTextContent('H');
    expect(screen.getByTestId('timeline-step-btn-2')).toHaveTextContent('CX');
  });

  it('dynamically displays intermediate state when clicking earlier steps', () => {
    const handleSelectGate = vi.fn();
    render(<TimelineView timeline={mockBellTimeline} onSelectGateByTimelineStep={handleSelectGate} />);

    // Click step 1 (Hadamard on q0)
    const step1Btn = screen.getByTestId('timeline-step-btn-1');
    fireEvent.click(step1Btn);

    // Snapshot title reflects Step 1
    expect(screen.getByText(/State at Step 1 \(H on q\[0\]\):/i)).toBeInTheDocument();
    expect(handleSelectGate).toHaveBeenCalledWith('h', [0]);

    // Click step 0 (Initial state)
    const step0Btn = screen.getByTestId('timeline-step-btn-0');
    fireEvent.click(step0Btn);
    expect(screen.getByText(/State at Step 0 \(INITIAL STATE \|0\.\.\.0⟩\):/i)).toBeInTheDocument();
  });

  it('stepper prev/next navigation correctly steps through evolution history', () => {
    render(<TimelineView timeline={mockBellTimeline} />);

    const prevBtn = screen.getByTestId('timeline-prev-btn');
    fireEvent.click(prevBtn);

    expect(screen.getByText(/State at Step 1/i)).toBeInTheDocument();

    const firstBtn = screen.getByTestId('timeline-first-btn');
    fireEvent.click(firstBtn);
    expect(screen.getByText(/State at Step 0/i)).toBeInTheDocument();
  });

  it('provides Play and Pause playback functionality across timeline steps', () => {
    vi.useFakeTimers();
    const handleStepChange = vi.fn();
    render(<TimelineView timeline={mockBellTimeline} selectedStepIdx={0} onStepChange={handleStepChange} />);

    const playBtn = screen.getByTestId('timeline-play-btn');
    expect(playBtn).toBeInTheDocument();

    fireEvent.click(playBtn);
    expect(screen.getByText(/Pause/i)).toBeInTheDocument();

    // Advance timer by 900ms to trigger step 0 -> step 1
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(handleStepChange).toHaveBeenCalledWith(1);

    vi.useRealTimers();
  });

  it('changes playback speed (0.5x, 1x, 2x)', () => {
    render(<TimelineView timeline={mockBellTimeline} />);

    const speedHalfBtn = screen.getByTestId('speed-0.5x');
    const speedDoubleBtn = screen.getByTestId('speed-2x');

    fireEvent.click(speedHalfBtn);
    expect(speedHalfBtn).toHaveClass('active');

    fireEvent.click(speedDoubleBtn);
    expect(speedDoubleBtn).toHaveClass('active');
    expect(speedHalfBtn).not.toHaveClass('active');
  });

  it('displays Before/After state transition information', () => {
    render(<TimelineView timeline={mockBellTimeline} selectedStepIdx={1} />);

    expect(screen.getByTestId('step-transition-card')).toBeInTheDocument();
    expect(screen.getByText(/Before Operation:/i)).toBeInTheDocument();
    expect(screen.getByText(/After Operation:/i)).toBeInTheDocument();
  });

  it('supports continuous scrubber slider and displays intermediate complex statevector', () => {
    const handleStepChange = vi.fn();
    render(<TimelineView timeline={mockBellTimeline} selectedStepIdx={1} onStepChange={handleStepChange} />);

    // Continuous scrubber input
    const slider = screen.getByTestId('timeline-scrubber-slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('1');

    fireEvent.change(slider, { target: { value: '2' } });
    expect(handleStepChange).toHaveBeenCalledWith(2);

    // Intermediate statevector complex amplitude card
    expect(screen.getByTestId('snapshot-statevector-card')).toBeInTheDocument();
    expect(screen.getByText(/Statevector \|ψ⟩ Amplitudes & Phases:/i)).toBeInTheDocument();
    expect(screen.getAllByText('|00⟩').length).toBeGreaterThan(0);
  });
});

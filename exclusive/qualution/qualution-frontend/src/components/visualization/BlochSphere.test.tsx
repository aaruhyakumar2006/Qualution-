import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlochSphere } from './BlochSphere';
import { projectBlochVector, DEFAULT_CAMERA, easeInOutCubic } from './blochProjection';
import type { TimelineStep } from '../../features/circuit/types';

describe('Bloch Projection & 3D Math', () => {
  it('projects |0⟩ (0, 0, 1) upward (+Z)', () => {
    const pt = projectBlochVector(0, 0, 1, 100, 100, 68, DEFAULT_CAMERA);
    // +Z should decrease screen Y (upwards from center 100)
    expect(pt.y).toBeLessThan(100);
  });

  it('projects |1⟩ (0, 0, -1) downward (-Z)', () => {
    const pt = projectBlochVector(0, 0, -1, 100, 100, 68, DEFAULT_CAMERA);
    // -Z should increase screen Y (downwards from center 100)
    expect(pt.y).toBeGreaterThan(100);
  });

  it('projects |+⟩ (1, 0, 0) eastward (+X)', () => {
    const pt = projectBlochVector(1, 0, 0, 100, 100, 68, DEFAULT_CAMERA);
    expect(pt.x).toBeGreaterThan(100);
  });

  it('projects |-i⟩ (0, -1, 0) along -Y projection', () => {
    const pt = projectBlochVector(0, -1, 0, 100, 100, 68, DEFAULT_CAMERA);
    expect(typeof pt.x).toBe('number');
    expect(typeof pt.y).toBe('number');
  });

  it('easeInOutCubic bounds t from 0 to 1 smoothly', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBe(0.5);
  });
});

describe('BlochSphere Component (Dynamic & Interactive Step 23.6)', () => {
  it('renders |0⟩ ground state with coordinates (0, 0, 1) for 1-qubit circuit', () => {
    render(<BlochSphere bloch={{ x: 0.0, y: 0.0, z: 1.0 }} qubitCount={1} />);

    expect(screen.getByTestId('bloch-sphere')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-coord-x')).toHaveTextContent('0.000');
    expect(screen.getByTestId('bloch-coord-y')).toHaveTextContent('0.000');
    expect(screen.getByTestId('bloch-coord-z')).toHaveTextContent('1.000');
    expect(screen.getByTestId('bloch-state-label')).toHaveTextContent('|0⟩ Ground State');
  });

  it('renders H|0⟩ state (|+⟩) with coordinates (1, 0, 0)', () => {
    render(<BlochSphere bloch={{ x: 1.0, y: 0.0, z: 0.0 }} qubitCount={1} />);

    expect(screen.getByTestId('bloch-sphere')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-coord-x')).toHaveTextContent('1.000');
    expect(screen.getByTestId('bloch-coord-y')).toHaveTextContent('0.000');
    expect(screen.getByTestId('bloch-coord-z')).toHaveTextContent('0.000');
    expect(screen.getByTestId('bloch-state-label')).toHaveTextContent('|+⟩ Symmetric Superposition');
  });

  it('renders X|0⟩ state (|1⟩) with coordinates (0, 0, -1)', () => {
    render(<BlochSphere bloch={{ x: 0.0, y: 0.0, z: -1.0 }} qubitCount={1} />);

    expect(screen.getByTestId('bloch-sphere')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-coord-x')).toHaveTextContent('0.000');
    expect(screen.getByTestId('bloch-coord-y')).toHaveTextContent('0.000');
    expect(screen.getByTestId('bloch-coord-z')).toHaveTextContent('-1.000');
    expect(screen.getByTestId('bloch-state-label')).toHaveTextContent('|1⟩ Excited State');
  });

  it('renders 2-qubit product state H(q0) and RX(pi/2)(q1) with individual per-qubit Bloch spheres', () => {
    const blochQubits = {
      '0': { x: 1.0, y: 0.0, z: 0.0, purity: 1.0, magnitude: 1.0 },
      '1': { x: 0.0, y: -1.0, z: 0.0, purity: 1.0, magnitude: 1.0 },
    };

    render(<BlochSphere blochQubits={blochQubits} qubitCount={2} />);

    expect(screen.getByTestId('bloch-sphere-multi')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-sphere-q0')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-sphere-q1')).toBeInTheDocument();

    expect(screen.getByText('Qubit q[0]')).toBeInTheDocument();
    expect(screen.getByText('Qubit q[1]')).toBeInTheDocument();
  });

  it('renders 2-qubit entangled Bell state with reduced mixed state indicators and explanatory notice', () => {
    const bellBlochQubits = {
      '0': { x: 0.0, y: 0.0, z: 0.0, purity: 0.5, magnitude: 0.0 },
      '1': { x: 0.0, y: 0.0, z: 0.0, purity: 0.5, magnitude: 0.0 },
    };

    render(<BlochSphere blochQubits={bellBlochQubits} qubitCount={2} />);

    expect(screen.getByTestId('bloch-sphere-multi')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-entangled-notice')).toBeInTheDocument();
    expect(screen.getByText(/This circuit is entangled/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Purity: 0.50/i).length).toBe(2);
    expect(screen.getAllByText(/Mixed \/ Entangled Subsystem/i).length).toBe(2);
  });

  it('renders trajectory path across multiple timeline steps', () => {
    const mockSteps: TimelineStep[] = [
      {
        step: 0,
        operation: 'initial',
        qubits: [],
        probabilities: { '0': 1.0, '1': 0.0 },
        bloch: { x: 0.0, y: 0.0, z: 1.0 },
      },
      {
        step: 1,
        operation: 'h',
        qubits: [0],
        probabilities: { '0': 0.5, '1': 0.5 },
        bloch: { x: 1.0, y: 0.0, z: 0.0 },
      },
    ];

    render(
      <BlochSphere
        bloch={{ x: 1.0, y: 0.0, z: 0.0 }}
        qubitCount={1}
        stepInfo={{ step: 1, operation: 'h', qubits: [0] }}
        timelineSteps={mockSteps}
      />
    );

    expect(screen.getByTestId('bloch-trajectory')).toBeInTheDocument();
  });

  it('allows 3D camera view reset when clicking Reset View button', () => {
    const blochQubits = {
      '0': { x: 1.0, y: 0.0, z: 0.0, purity: 1.0, magnitude: 1.0 },
    };

    render(<BlochSphere blochQubits={blochQubits} qubitCount={1} />);

    const resetBtn = screen.getByRole('button', { name: /reset view/i });
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
  });
});

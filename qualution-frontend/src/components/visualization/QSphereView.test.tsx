import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QSphereView } from './QSphereView';
import type { ComplexNumber } from '../../features/circuit/types';

describe('QSphereView Component (Step 24.5)', () => {
  // (|00⟩ + |11⟩)/√2
  const bellStatevector: ComplexNumber[] = [
    { real: 1 / Math.SQRT2, imag: 0 },
    { real: 0, imag: 0 },
    { real: 0, imag: 0 },
    { real: 1 / Math.SQRT2, imag: 0 },
  ];

  it('renders empty state when no statevector is provided', () => {
    render(<QSphereView statevector={null} qubitCount={2} />);
    expect(screen.getByTestId('qsphere-empty')).toBeInTheDocument();
  });

  it('renders interactive 3D Q-Sphere with non-zero basis state nodes', () => {
    render(<QSphereView statevector={bellStatevector} qubitCount={2} />);
    expect(screen.getByTestId('qsphere-view')).toBeInTheDocument();
    expect(screen.getByText('Multi-Qubit Q-Sphere')).toBeInTheDocument();
    expect(screen.getByText('|00⟩')).toBeInTheDocument();
    expect(screen.getByText('|11⟩')).toBeInTheDocument();
  });

  it('displays truncation notice for circuits exceeding 8 qubits', () => {
    render(<QSphereView statevector={bellStatevector} qubitCount={9} />);
    expect(screen.getByTestId('qsphere-limit')).toBeInTheDocument();
  });

  it('renders Q-Sphere from measurement probabilities when statevector is null', () => {
    render(
      <QSphereView
        statevector={null}
        probabilities={{ '00': 0.5, '11': 0.5 }}
        qubitCount={2}
      />
    );
    expect(screen.getByTestId('qsphere-view')).toBeInTheDocument();
    expect(screen.getByText('|00⟩')).toBeInTheDocument();
    expect(screen.getByText('|11⟩')).toBeInTheDocument();
  });

  it('safely renders Q-Sphere for 1000-qubit circuit without crash', () => {
    const q1000 = '0'.repeat(1000);
    render(
      <QSphereView
        statevector={null}
        probabilities={{ [q1000]: 1.0 }}
        qubitCount={1000}
      />
    );
    expect(screen.getByTestId('qsphere-view')).toBeInTheDocument();
    expect(screen.getByTestId('qsphere-limit')).toBeInTheDocument();
  });
});

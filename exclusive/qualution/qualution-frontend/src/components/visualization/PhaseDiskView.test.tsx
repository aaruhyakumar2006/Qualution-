import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhaseDiskView } from './PhaseDiskView';
import type { ComplexNumber } from '../../features/circuit/types';

describe('PhaseDiskView Component (Step 24.5)', () => {
  const plusState: ComplexNumber[] = [
    { real: 1 / Math.SQRT2, imag: 0 },
    { real: 1 / Math.SQRT2, imag: 0 },
  ];

  it('renders empty notice when statevector is null', () => {
    render(<PhaseDiskView statevector={null} qubitCount={1} />);
    expect(screen.getByTestId('phase-disk-empty')).toBeInTheDocument();
  });

  it('renders single-qubit phase disk card with relative phase', () => {
    render(<PhaseDiskView statevector={plusState} qubitCount={1} stepIndex={1} />);
    expect(screen.getByTestId('phase-disk-view')).toBeInTheDocument();
    expect(screen.getByTestId('phase-disk-q0')).toBeInTheDocument();
    expect(screen.getByText('P(|1⟩):')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });
});

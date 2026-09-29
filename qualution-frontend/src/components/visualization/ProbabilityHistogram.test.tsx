import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProbabilityHistogram } from './ProbabilityHistogram';

describe('ProbabilityHistogram Component (Step 23.5)', () => {
  it('clearly distinguishes theoretical probabilities from finite shot counts', () => {
    render(
      <ProbabilityHistogram
        probabilities={{ '00': 0.5, '11': 0.5 }}
        counts={{ '00': 504, '11': 496 }}
        totalShots={1000}
      />
    );

    expect(screen.getByTestId('probability-histogram')).toBeInTheDocument();
    expect(screen.getByText(/Theoretical Probability/i)).toBeInTheDocument();
    expect(screen.getByText(/Measured Distribution \(1,000 shots\)/i)).toBeInTheDocument();

    // Verify row items
    expect(screen.getByTestId('hist-row-00')).toBeInTheDocument();
    expect(screen.getByTestId('hist-row-11')).toBeInTheDocument();

    // Theoretical probability stays exactly 50.0%
    const pcts = screen.getAllByText('50.0%');
    expect(pcts.length).toBe(2);

    // Measured counts can vary around expected
    expect(screen.getByText(/504 \(50.4%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/496 \(49.6%\)/i)).toBeInTheDocument();
  });
});

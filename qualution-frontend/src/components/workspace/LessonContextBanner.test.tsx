import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LessonContextBanner } from './LessonContextBanner';
import type { LessonWorkbenchHandoff } from '../../features/theory/lessonHandoff';
import type { CircuitRunResponse } from '../../features/circuit/types';

describe('LessonContextBanner (Phase 13 & 14)', () => {
  const sampleHandoff: LessonWorkbenchHandoff = {
    lessonId: 'qubit-superposition-checkpoint',
    lessonTitle: 'Qubit and Superposition',
    conceptTitle: 'Hadamard Experiment',
    conceptFormula: 'H|0\\rangle = |+\\rangle',
    promptText: 'Build a circuit with one qubit, apply the Hadamard gate, and observe the 50/50 measurement distribution.',
    circuit: {
      qubits: 1,
      classical_bits: 1,
      gates: [{ gate: 'h', targets: [0], column: 0 }],
      measure: true,
      shots: 1000,
    },
    prediction: {
      checkpointId: 'measure-plus',
      question: 'What do you expect to observe when |+⟩ is measured?',
      selectedOptionId: 'c',
      selectedOptionText: '50% 0 and 50% 1',
      isCorrect: true,
      explanation: 'The |+⟩ state is an equal superposition of |0⟩ and |1⟩.',
    },
    explanation: {
      title: 'Why did this happen?',
      math: [
        'H|0\\rangle = |+\\rangle',
        '|+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)',
        'P(0) = \\frac{1}{2}',
        'P(1) = \\frac{1}{2}',
      ],
      text: 'The Hadamard gate creates an equal superposition of |0⟩ and |1⟩. Measurement samples this state repeatedly, producing approximately 50% |0⟩ and 50% |1⟩ with natural statistical fluctuation.',
    },
  };

  const sampleRunResponse: CircuitRunResponse = {
    circuit: {
      qubits: 1,
      classical_bits: 1,
      gate_count: 1,
      measure: true,
      shots: 1000,
    },
    routing: {
      requested_backend: 'auto',
      selected_backend: 'local_simulator',
      framework: 'qiskit',
      policy: 'auto',
      reason: 'Optimal for single-qubit simulation',
    },
    simulation: {
      backend: 'local_simulator',
      mode: 'shots',
      shots: 1000,
      counts: { '0': 503, '1': 497 },
      probabilities: { '0': 0.503, '1': 0.497 },
      execution_time_ms: 12.4,
    },
    visualization: {},
    execution_time_ms: 12.4,
  };

  it('renders initial educational context, prediction review, and run hint before execution', () => {
    render(<LessonContextBanner handoff={sampleHandoff} />);

    expect(screen.getByTestId('lesson-context-banner')).toBeDefined();
    expect(screen.getByText('Qubit and Superposition')).toBeDefined();
    expect(screen.getByTestId('lcb-formula')).toBeDefined();
    expect(screen.getByTestId('lcb-prediction')).toBeDefined();
    expect(screen.getByText(/50% 0 and 50% 1/)).toBeDefined();
    expect(screen.getByTestId('lcb-prompt')).toBeDefined();
    expect(screen.getByTestId('lcb-run-hint')).toBeDefined();
    expect(screen.queryByTestId('lcb-experiment-result')).toBeNull();
  });

  it('triggers onNavigateBackToTheory and onDismiss callbacks', () => {
    const onBack = vi.fn();
    const onDismiss = vi.fn();

    render(
      <LessonContextBanner
        handoff={sampleHandoff}
        onNavigateBackToTheory={onBack}
        onDismiss={onDismiss}
      />
    );

    const backBtn = screen.getByTestId('lcb-back-to-theory-button');
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);

    const dismissBtn = screen.getByTestId('lcb-dismiss-button');
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders simulating state indicator when execution is in progress', () => {
    render(
      <LessonContextBanner
        handoff={sampleHandoff}
        executionStatus="running"
      />
    );

    expect(screen.getByTestId('lcb-running-state')).toBeDefined();
    expect(screen.getByText(/Simulating quantum circuit/)).toBeDefined();
  });

  it('renders actual experiment distribution, prediction comparison, and KaTeX explanation when result arrives', () => {
    render(
      <LessonContextBanner
        handoff={sampleHandoff}
        latestResult={sampleRunResponse}
        executionStatus="success"
      />
    );

    // Distribution
    const resultSection = screen.getByTestId('lcb-experiment-result');
    expect(resultSection).toBeDefined();
    expect(screen.getByText(/1,000 shots/)).toBeDefined();
    expect(screen.getByText('|0⟩')).toBeDefined();
    expect(screen.getByText(/503 \(50.3%\)/)).toBeDefined();
    expect(screen.getByText('|1⟩')).toBeDefined();
    expect(screen.getByText(/497 \(49.7%\)/)).toBeDefined();

    // Prediction comparison match
    expect(screen.getByTestId('lcb-comparison-badge')).toBeDefined();
    expect(screen.getByText(/Outcome matches prediction/)).toBeDefined();

    // Structured explanation with math cards
    const explanationSection = screen.getByTestId('lcb-explanation');
    expect(explanationSection).toBeDefined();
    expect(screen.getByText('Why did this happen?')).toBeDefined();
    expect(screen.getByTestId('lcb-math-cards')).toBeDefined();
    expect(screen.getByTestId('lcb-explanation-text')).toBeDefined();
    expect(screen.getByText(/The Hadamard gate creates an equal superposition/)).toBeDefined();
  });
});

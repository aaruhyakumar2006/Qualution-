import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SocraticQuestionRenderer } from './SocraticQuestionRenderer';
import type { SocraticQuestion } from '../types';

describe('SocraticQuestionRenderer', () => {
  const mockQuestion: SocraticQuestion = {
    id: 'test_q_01',
    ladder_step: 'PREDICT',
    question_type: 'PREDICTION',
    difficulty: 2,
    prompt: 'What do you predict will happen when H is applied to |0⟩?',
    response_type: 'PREDICTION',
    reasoning_goal: 'Predict equal superposition',
    options: [
      { id: 'opt_1', label: 'Flips to |1⟩', description: 'Bit flip' },
      { id: 'opt_plus', label: 'Superposition (|0⟩ + |1⟩)/√2', description: 'Equal superposition' },
    ],
    scaffold_hint: 'Hadamard is not an X gate.',
  };

  it('renders question prompt and options correctly', () => {
    render(
      <SocraticQuestionRenderer
        question={mockQuestion}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByTestId('socratic-prompt-text')).toHaveTextContent(
      'What do you predict will happen when H is applied to |0⟩?'
    );
    expect(screen.getByTestId('socratic-ladder-badge')).toHaveTextContent('PREDICT');
    expect(screen.getByTestId('socratic-option-opt_1')).toBeInTheDocument();
    expect(screen.getByTestId('socratic-option-opt_plus')).toBeInTheDocument();
  });

  it('disables submit until option is selected and submits with confidence', () => {
    const handleSubmit = vi.fn();
    render(
      <SocraticQuestionRenderer
        question={mockQuestion}
        onSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByTestId('socratic-submit-response-btn');
    expect(submitBtn).toBeDisabled();

    // Select option
    fireEvent.click(screen.getByTestId('socratic-option-opt_plus'));
    expect(submitBtn).not.toBeDisabled();

    // Select confidence
    fireEvent.click(screen.getByTestId('socratic-confidence-very'));

    // Submit
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledWith({
      response_value: 'opt_plus',
      confidence_level: 'VERY_CONFIDENT',
      explanation: undefined,
    });
  });

  it('toggles scaffold hint display', () => {
    render(
      <SocraticQuestionRenderer
        question={mockQuestion}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.queryByTestId('socratic-hint-box')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('socratic-toggle-hint-btn'));
    expect(screen.getByTestId('socratic-hint-box')).toBeInTheDocument();
    expect(screen.getByTestId('socratic-hint-box')).toHaveTextContent('Hadamard is not an X gate.');
  });

  it('renders embedded MicroBlochPreview and empirical simulation outcome histogram', () => {
    render(
      <SocraticQuestionRenderer
        question={mockQuestion}
        onSubmit={vi.fn()}
        lastEvaluation={{
          is_correct: true,
          score: 1.0,
          reasoning_quality: 'EXCELLENT',
          feedback: 'Correct! H puts |0⟩ into equal superposition.',
          next_action: 'CONTINUE',
          simulation_payload: {
            counts: { '0': 502, '1': 498 },
            statevector: [{ real: 0.7071, imag: 0 }, { real: 0.7071, imag: 0 }],
          },
        }}
      />
    );

    expect(screen.getByTestId('micro-bloch-preview')).toBeInTheDocument();
    expect(screen.getByTestId('socratic-sim-results')).toBeInTheDocument();
    expect(screen.getByText('502 (50.2%)')).toBeInTheDocument();
    expect(screen.getByText('498 (49.8%)')).toBeInTheDocument();
  });
});

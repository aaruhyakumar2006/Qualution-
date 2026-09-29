import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TeachingAssessmentOverlay } from './TeachingAssessmentOverlay';
import type { AssessmentAction } from '../../features/theory/teachingActions';

describe('TeachingAssessmentOverlay (Phase 15)', () => {
  const sampleAssessment: AssessmentAction = {
    kind: 'ASSESSMENT',
    id: 'superposition-final',
    concept: 'superposition',
    question: 'What happens when |0⟩ is transformed by a Hadamard gate and measured repeatedly?',
    options: [
      { id: 'a', text: 'Always 0' },
      { id: 'b', text: 'Always 1' },
      { id: 'c', text: 'Approximately equal numbers of 0 and 1' },
      { id: 'd', text: 'Measurement cannot occur' },
    ],
    correct: 'c',
    explanation: 'The Hadamard gate transforms |0⟩ into |+⟩, an equal superposition of |0⟩ and |1⟩.',
  };

  it('renders nothing when assessment is null', () => {
    const { container } = render(
      <TeachingAssessmentOverlay
        assessment={null}
        selectedOptionId={null}
        onSelectOption={vi.fn()}
        isSubmitted={false}
        isCorrect={false}
        onSubmit={vi.fn()}
        onContinue={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders question and options with disabled submit button initially', () => {
    render(
      <TeachingAssessmentOverlay
        assessment={sampleAssessment}
        selectedOptionId={null}
        onSelectOption={vi.fn()}
        isSubmitted={false}
        isCorrect={false}
        onSubmit={vi.fn()}
        onContinue={vi.fn()}
      />
    );

    expect(screen.getByTestId('teaching-assessment-overlay')).toBeDefined();
    expect(screen.getByText('CONCEPT ASSESSMENT')).toBeDefined();
    expect(screen.getByText(sampleAssessment.question)).toBeDefined();
    expect(screen.getByTestId('assessment-option-a')).toBeDefined();
    expect(screen.getByTestId('assessment-option-c')).toBeDefined();

    const submitBtn = screen.getByTestId('assessment-submit-btn') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('handles option selection and submission triggers onSubmit', () => {
    const onSelect = vi.fn();
    const onSubmit = vi.fn();

    render(
      <TeachingAssessmentOverlay
        assessment={sampleAssessment}
        selectedOptionId="c"
        onSelectOption={onSelect}
        isSubmitted={false}
        isCorrect={false}
        onSubmit={onSubmit}
        onContinue={vi.fn()}
      />
    );

    const optionC = screen.getByTestId('assessment-option-c');
    fireEvent.click(optionC);
    expect(onSelect).toHaveBeenCalledWith('c');

    const submitBtn = screen.getByTestId('assessment-submit-btn') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(false);
    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('displays correct feedback, reveals explanation, and enables continue button after correct submission', () => {
    const onContinue = vi.fn();

    render(
      <TeachingAssessmentOverlay
        assessment={sampleAssessment}
        selectedOptionId="c"
        onSelectOption={vi.fn()}
        isSubmitted={true}
        isCorrect={true}
        onSubmit={vi.fn()}
        onContinue={onContinue}
      />
    );

    expect(screen.getByTestId('assessment-feedback-pane')).toBeDefined();
    expect(screen.getByText('Correct.')).toBeDefined();
    expect(screen.getByTestId('assessment-explanation')).toBeDefined();
    expect(screen.getByText(sampleAssessment.explanation)).toBeDefined();

    const continueBtn = screen.getByTestId('assessment-continue-btn');
    fireEvent.click(continueBtn);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('displays incorrect feedback and allows retry after incorrect submission', () => {
    const onRetry = vi.fn();

    render(
      <TeachingAssessmentOverlay
        assessment={sampleAssessment}
        selectedOptionId="a"
        onSelectOption={vi.fn()}
        isSubmitted={true}
        isCorrect={false}
        onSubmit={vi.fn()}
        onContinue={vi.fn()}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Not quite.')).toBeDefined();
    const retryBtn = screen.getByTestId('assessment-retry-btn');
    expect(retryBtn).toBeDefined();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LessonCompletionOverlay } from './LessonCompletionOverlay';

describe('LessonCompletionOverlay (Phase 15)', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <LessonCompletionOverlay
        isOpen={false}
        conceptTitle="Qubit and Superposition"
        conceptName="Superposition"
        conceptMastery="UNDERSTOOD"
        onReviewLesson={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders completion title, mastery status UNDERSTOOD, and milestones when open', () => {
    const onReview = vi.fn();
    const onAcademy = vi.fn();
    const onWorkbench = vi.fn();

    render(
      <LessonCompletionOverlay
        isOpen={true}
        conceptTitle="Qubit and Superposition"
        conceptName="Superposition"
        conceptMastery="UNDERSTOOD"
        onReviewLesson={onReview}
        onReturnToAcademy={onAcademy}
        onOpenWorkbench={onWorkbench}
      />
    );

    expect(screen.getByTestId('lesson-completion-overlay')).toBeDefined();
    expect(screen.getByText('LESSON COMPLETE')).toBeDefined();
    expect(screen.getByText('Qubit and Superposition')).toBeDefined();
    expect(screen.getByTestId('mastery-status-badge')).toBeDefined();
    expect(screen.getByText('UNDERSTOOD')).toBeDefined();
    expect(screen.getByText(/Qubit representation/)).toBeDefined();
    expect(screen.getByText(/Finite-shot quantum circuit experiment/)).toBeDefined();

    // Trigger buttons
    const reviewBtn = screen.getByTestId('completion-review-btn');
    fireEvent.click(reviewBtn);
    expect(onReview).toHaveBeenCalledTimes(1);

    const wbBtn = screen.getByTestId('completion-workbench-btn');
    fireEvent.click(wbBtn);
    expect(onWorkbench).toHaveBeenCalledTimes(1);

    const academyBtn = screen.getByTestId('completion-academy-btn');
    fireEvent.click(academyBtn);
    expect(onAcademy).toHaveBeenCalledTimes(1);
  });

  it('renders ATTEMPTED status when mastery is not yet understood', () => {
    render(
      <LessonCompletionOverlay
        isOpen={true}
        conceptTitle="Qubit and Superposition"
        conceptName="Superposition"
        conceptMastery="ATTEMPTED"
        onReviewLesson={vi.fn()}
      />
    );

    expect(screen.getByText('ATTEMPTED')).toBeDefined();
  });

  it('renders NEEDS REINFORCEMENT status and targeted remediation guidance (Phase 16)', () => {
    const sampleEvidence = {
      lessonId: 'qubit-superposition',
      concept: 'superposition',
      evidence: {},
      conceptStatus: 'NEEDS_REINFORCEMENT' as const,
      remediationFeedback: "Let's revisit one key idea: measuring a quantum superposition state like |+⟩ does not produce a single fixed outcome.",
    };

    render(
      <LessonCompletionOverlay
        isOpen={true}
        conceptTitle="Qubit and Superposition"
        conceptName="Superposition"
        conceptMastery="NEEDS_REINFORCEMENT"
        learningEvidence={sampleEvidence}
        onReviewLesson={vi.fn()}
      />
    );

    expect(screen.getByText('NEEDS REINFORCEMENT')).toBeDefined();
    expect(screen.getByTestId('remediation-feedback-box')).toBeDefined();
    expect(screen.getByText(/Concept Insight to Revisit/)).toBeDefined();
    expect(screen.getByText(/measuring a quantum superposition state/)).toBeDefined();
  });
});

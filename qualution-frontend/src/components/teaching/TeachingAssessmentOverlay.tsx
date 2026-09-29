/**
 * TeachingAssessmentOverlay.tsx
 *
 * PHASE 15: Final Concept Assessment Overlay.
 *
 * Provides a clean, academic learner assessment panel that tests conceptual
 * understanding after the theory, prediction, and quantum experiment phases.
 */

import React, { useEffect, useRef } from 'react';
import { Award, CheckCircle2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import type { AssessmentAction } from '../../features/theory/teachingActions';
import './TeachingAssessmentOverlay.css';

export interface TeachingAssessmentOverlayProps {
  assessment: AssessmentAction | null;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  isSubmitted: boolean;
  isCorrect: boolean;
  onSubmit: () => void;
  onContinue: () => void;
  onRetry?: () => void;
}

export const TeachingAssessmentOverlay: React.FC<TeachingAssessmentOverlayProps> = ({
  assessment,
  selectedOptionId,
  onSelectOption,
  isSubmitted,
  isCorrect,
  onSubmit,
  onContinue,
  onRetry,
}) => {
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSubmitted) {
      continueButtonRef.current?.focus();
    }
  }, [isSubmitted]);

  if (!assessment) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent, optionId: string) => {
    if (isSubmitted) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectOption(optionId);
    }
  };

  return (
    <div
      className="assessment-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-question-title"
      data-testid="teaching-assessment-overlay"
    >
      <div className="assessment-card">
        {/* Header with Assessment Badge */}
        <div className="assessment-header">
          <div className="assessment-badge">
            <Award size={15} aria-hidden="true" />
            <span>CONCEPT ASSESSMENT</span>
          </div>
          <h2 id="assessment-question-title" className="assessment-question">
            {assessment.question}
          </h2>
        </div>

        {/* Option List */}
        <div
          className="assessment-options-list"
          role="radiogroup"
          aria-label="Assessment options"
        >
          {assessment.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const letter = String.fromCharCode(65 + idx); // A, B, C, D

            let optionClass = 'assessment-option';
            if (isSelected) optionClass += ' selected';
            if (isSubmitted) {
              if (option.id === assessment.correct) {
                optionClass += ' correct-reveal';
              } else if (isSelected && !isCorrect) {
                optionClass += ' incorrect-selected';
              }
            }

            return (
              <button
                key={option.id}
                type="button"
                className={optionClass}
                onClick={() => !isSubmitted && onSelectOption(option.id)}
                onKeyDown={(e) => handleKeyDown(e, option.id)}
                disabled={isSubmitted}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSubmitted ? -1 : 0}
                data-testid={`assessment-option-${option.id}`}
              >
                <span className="option-letter">{letter}</span>
                <span className="option-text">{option.text}</span>
              </button>
            );
          })}
        </div>

        {/* Footer / Actions & Explanation */}
        <div className="assessment-footer">
          {!isSubmitted ? (
            <button
              ref={submitButtonRef}
              type="button"
              className="assessment-submit-btn"
              onClick={onSubmit}
              disabled={!selectedOptionId}
              data-testid="assessment-submit-btn"
              aria-label="Submit assessment answer"
            >
              <span>Submit Answer</span>
            </button>
          ) : (
            <div className="assessment-feedback-pane" data-testid="assessment-feedback-pane">
              <div className={`feedback-header ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? (
                  <>
                    <CheckCircle2 size={18} className="feedback-icon" aria-hidden="true" />
                    <span>Correct.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} className="feedback-icon" aria-hidden="true" />
                    <span>Not quite.</span>
                  </>
                )}
              </div>
              <p className="feedback-explanation" data-testid="assessment-explanation">
                {assessment.explanation}
              </p>
              <div className="feedback-actions">
                {!isCorrect && onRetry && (
                  <button
                    type="button"
                    className="assessment-retry-btn"
                    onClick={onRetry}
                    data-testid="assessment-retry-btn"
                    aria-label="Retry question"
                  >
                    <RotateCcw size={15} aria-hidden="true" />
                    <span>Retry Question</span>
                  </button>
                )}
                <button
                  ref={continueButtonRef}
                  type="button"
                  className="assessment-continue-btn"
                  onClick={onContinue}
                  data-testid="assessment-continue-btn"
                  aria-label="Complete Lesson"
                >
                  <span>Complete Lesson</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

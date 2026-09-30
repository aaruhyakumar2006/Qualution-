/**
 * TeachingCheckpointOverlay.tsx
 *
 * PHASE 12: Theory → Prediction Checkpoint Overlay.
 *
 * Provides a clean, academic learner prediction panel that pauses the
 * theory board, collects learner reasoning, and reveals the explanation.
 */

import React, { useEffect, useRef } from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import type { CheckpointAction } from '../../features/theory/teachingActions';
import './TeachingCheckpointOverlay.css';

export interface TeachingCheckpointOverlayProps {
  checkpoint: CheckpointAction | null;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  isSubmitted: boolean;
  isCorrect: boolean;
  onSubmit: () => void;
  onContinue: () => void;
}

export const TeachingCheckpointOverlay: React.FC<TeachingCheckpointOverlayProps> = ({
  checkpoint,
  selectedOptionId,
  onSelectOption,
  isSubmitted,
  isCorrect,
  onSubmit,
  onContinue,
}) => {
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSubmitted) {
      continueButtonRef.current?.focus();
    }
  }, [isSubmitted]);

  if (!checkpoint) {
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
      className="checkpoint-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkpoint-question-title"
      data-testid="teaching-checkpoint-overlay"
    >
      <div className="checkpoint-card">
        {/* Header with Think Badge */}
        <div className="checkpoint-header">
          <div className="checkpoint-badge">
            <HelpCircle size={15} />
            <span>THINK</span>
          </div>
          <h2 id="checkpoint-question-title" className="checkpoint-question">
            {checkpoint.question}
          </h2>
        </div>

        {/* Option List */}
        <div className="checkpoint-options-list" role="radiogroup" aria-label="Prediction options">
          {checkpoint.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const letter = String.fromCharCode(65 + idx); // A, B, C, D

            let optionClass = 'checkpoint-option';
            if (isSelected) optionClass += ' selected';
            if (isSubmitted) {
              if (option.id === checkpoint.correct) {
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
                data-testid={`checkpoint-option-${option.id}`}
              >
                <span className="option-letter">{letter}</span>
                <span className="option-text">{option.text}</span>
              </button>
            );
          })}
        </div>

        {/* Footer / Actions & Explanation */}
        <div className="checkpoint-footer">
          {!isSubmitted ? (
            <button
              ref={submitButtonRef}
              type="button"
              className="checkpoint-submit-btn"
              onClick={onSubmit}
              disabled={!selectedOptionId}
              data-testid="checkpoint-submit-btn"
              aria-label="Submit prediction"
            >
              <span>Submit Prediction</span>
            </button>
          ) : (
            <div className="checkpoint-feedback-pane" data-testid="checkpoint-feedback-pane">
              <div className={`feedback-header ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? (
                  <>
                    <CheckCircle2 size={18} className="feedback-icon" />
                    <span>Correct.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} className="feedback-icon" />
                    <span>Not quite.</span>
                  </>
                )}
              </div>
              <p className="feedback-explanation" data-testid="checkpoint-explanation">
                {checkpoint.explanation}
              </p>
              <button
                ref={continueButtonRef}
                type="button"
                className="checkpoint-continue-btn"
                onClick={onContinue}
                data-testid="checkpoint-continue-btn"
                aria-label="Continue lesson"
              >
                <span>Continue Lesson</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

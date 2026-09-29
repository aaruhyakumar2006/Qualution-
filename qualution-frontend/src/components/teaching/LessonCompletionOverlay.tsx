/**
 * LessonCompletionOverlay.tsx
 *
 * PHASE 15 & PHASE 16: Clean Lesson Completion, Mastery Recap & Remediation Overlay.
 *
 * Displays a compact, academic completion state showing the learner's
 * concept mastery status (UNDERSTOOD, NEEDS_REINFORCEMENT, ATTEMPTED),
 * targeted educational remediation feedback, learned milestones, and navigation options.
 */

import React from 'react';
import {
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  BookOpen,
  FlaskConical,
  Award,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import type { ConceptMasteryStatus, LessonEvidence } from '../../features/theory/learningEvidence';
import './LessonCompletionOverlay.css';

export interface LessonCompletionOverlayProps {
  isOpen: boolean;
  conceptTitle?: string;
  conceptName?: string;
  conceptMastery: ConceptMasteryStatus;
  learningEvidence?: LessonEvidence | null;
  onReviewLesson: () => void;
  onReturnToAcademy?: () => void;
  onOpenWorkbench?: () => void;
}

export const LessonCompletionOverlay: React.FC<LessonCompletionOverlayProps> = ({
  isOpen,
  conceptTitle = 'Qubit and Superposition',
  conceptName = 'Superposition',
  conceptMastery,
  learningEvidence,
  onReviewLesson,
  onReturnToAcademy,
  onOpenWorkbench,
}) => {
  if (!isOpen) {
    return null;
  }

  const isUnderstood = conceptMastery === 'UNDERSTOOD';
  const needsReinforcement = conceptMastery === 'NEEDS_REINFORCEMENT';

  const statusClassName = isUnderstood
    ? 'mastery-understood'
    : needsReinforcement
    ? 'mastery-needs-reinforcement'
    : 'mastery-attempted';

  const statusLabel = isUnderstood
    ? 'UNDERSTOOD'
    : needsReinforcement
    ? 'NEEDS REINFORCEMENT'
    : 'ATTEMPTED';

  const remediationText = learningEvidence?.remediationFeedback;

  return (
    <div
      className="completion-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
      data-testid="lesson-completion-overlay"
    >
      <div className="completion-card">
        {/* Header */}
        <div className="completion-header">
          <div className="completion-badge">
            <Award size={16} aria-hidden="true" />
            <span>LESSON COMPLETE</span>
          </div>
          <h2 id="completion-title" className="completion-title">
            {conceptTitle}
          </h2>
        </div>

        {/* Concept Mastery Banner */}
        <div className={`mastery-banner ${statusClassName}`}>
          <div className="mastery-info">
            <span className="mastery-label">Concept Status:</span>
            <span className="mastery-status" data-testid="mastery-status-badge">
              {statusLabel}
            </span>
          </div>
          <span className="mastery-concept-name">Concept: {conceptName}</span>
        </div>

        {/* Phase 16: Targeted Remediation Guidance (if needs reinforcement) */}
        {needsReinforcement && remediationText && (
          <div className="remediation-box" data-testid="remediation-feedback-box">
            <div className="remediation-header">
              <Lightbulb size={16} className="remediation-icon" aria-hidden="true" />
              <span className="remediation-title">Concept Insight to Revisit</span>
            </div>
            <p className="remediation-text">{remediationText}</p>
          </div>
        )}

        {/* Learning Milestones Checklist */}
        <div className="completion-milestones">
          <span className="milestones-heading">You explored:</span>
          <ul className="milestones-list">
            <li className="milestone-item">
              <CheckCircle2 size={16} className="milestone-icon" aria-hidden="true" />
              <span>Qubit representation and state notation</span>
            </li>
            <li className="milestone-item">
              <CheckCircle2 size={16} className="milestone-icon" aria-hidden="true" />
              <span>Hadamard gate transformation ($H|0\rangle = |+\rangle$)</span>
            </li>
            <li className="milestone-item">
              <CheckCircle2 size={16} className="milestone-icon" aria-hidden="true" />
              <span>Superposition & probabilistic measurement</span>
            </li>
            <li className="milestone-item">
              <CheckCircle2 size={16} className="milestone-icon" aria-hidden="true" />
              <span>Finite-shot quantum circuit experiment</span>
            </li>
            <li className="milestone-item">
              <CheckCircle2 size={16} className="milestone-icon" aria-hidden="true" />
              <span>Conceptual assessment & learning evidence</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="completion-actions">
          <button
            type="button"
            className="completion-btn completion-btn-secondary"
            onClick={onReviewLesson}
            data-testid="completion-review-btn"
            aria-label="Review lesson from start"
          >
            <RotateCcw size={15} aria-hidden="true" />
            <span>Review Lesson</span>
          </button>

          {onOpenWorkbench && (
            <button
              type="button"
              className="completion-btn completion-btn-workbench"
              onClick={onOpenWorkbench}
              data-testid="completion-workbench-btn"
              aria-label="Open Quantum Workbench"
            >
              <FlaskConical size={15} aria-hidden="true" />
              <span>Workbench</span>
            </button>
          )}

          {onReturnToAcademy && (
            <button
              type="button"
              className="completion-btn completion-btn-primary"
              onClick={onReturnToAcademy}
              data-testid="completion-academy-btn"
              aria-label="Return to Academy"
            >
              <BookOpen size={15} aria-hidden="true" />
              <span>Academy</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

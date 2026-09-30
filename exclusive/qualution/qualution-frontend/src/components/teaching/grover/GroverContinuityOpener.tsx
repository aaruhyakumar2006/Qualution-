import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, BookOpen } from 'lucide-react';
import './GroverContinuityOpener.css';

export type GroverOpenerVariant = 'theory' | 'direct' | 'mid_progress';

export interface GroverContinuityOpenerProps {
  variant: GroverOpenerVariant;
  completedStepCount?: number;
  totalSteps?: number;
  onNavigateToTheory?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const GroverContinuityOpener: React.FC<GroverContinuityOpenerProps> = ({
  variant,
  completedStepCount = 1,
  totalSteps = 6,
  onNavigateToTheory,
  onDismiss,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <aside
      className={`grover-continuity-opener ${className}`}
      data-testid="grover-continuity-opener"
      role="region"
      aria-label="Erwin's Grover Continuity Guidance"
    >
      <div className="grover-opener-erwin-avatar" aria-hidden="true">
        <span className="erwin-ear erwin-ear-left" />
        <span className="erwin-ear erwin-ear-right" />
        <span className="erwin-eye erwin-eye-left" />
        <span className="erwin-eye erwin-eye-right" />
        <Sparkles size={13} className="erwin-sparkle" />
      </div>

      <div className="grover-opener-content">
        <div className="grover-opener-header">
          <span className="grover-opener-speaker">Erwin</span>
          <span className="grover-opener-tag">
            {variant === 'theory' && 'Continuity from Theory'}
            {variant === 'direct' && 'Grover Lab Primer'}
            {variant === 'mid_progress' && 'Resumed Session'}
          </span>
        </div>

        <div className="grover-opener-message" data-testid="teaching-erwin-bubble">
          {variant === 'theory' && (
            <p data-testid="erwin-opener-theory">
              In the theory lesson, you marked the winning state. Now build the circuit that actually finds it. Step 1: put both qubits in equal superposition.
            </p>
          )}

          {variant === 'direct' && (
            <p data-testid="erwin-opener-direct">
              Welcome to the Grover search lab. In this lab you will mark |11⟩ and amplify it. If you haven't seen the theory yet,{' '}
              <button
                type="button"
                className="grover-theory-link-btn"
                onClick={onNavigateToTheory}
                data-testid="watch-theory-link"
              >
                <BookOpen size={12} style={{ marginRight: 4, display: 'inline' }} />
                Watch the 5-minute theory first
              </button>
            </p>
          )}

          {variant === 'mid_progress' && (
            <p data-testid="erwin-opener-midprogress">
              Welcome back. You completed step {completedStepCount} of {totalSteps}. Let's pick up at step {completedStepCount + 1}.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        className="grover-opener-close-btn"
        onClick={handleDismiss}
        data-testid="dismiss-opener-btn"
        aria-label="Dismiss message"
        title="Dismiss message (or start building)"
      >
        <X size={14} />
      </button>
    </aside>
  );
};

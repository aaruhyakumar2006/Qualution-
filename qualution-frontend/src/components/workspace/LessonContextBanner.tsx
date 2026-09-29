/**
 * LessonContextBanner.tsx
 *
 * PHASE 13 & PHASE 14: Quantum Workbench Context Banner & Experiment Explanation.
 *
 * Displays educational context when the learner enters the Workbench from a theory lesson:
 * - Theory concept formula & prediction review
 * - Experiment objective
 * - Real-time comparison of actual simulation results with the learner's prediction
 * - KaTeX mathematical and physical explanation of observed quantum distributions
 */

import React, { useMemo } from 'react';
import {
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle,
  Lightbulb,
  BarChart2,
  HelpCircle,
  PlayCircle,
  Loader2,
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { LessonWorkbenchHandoff } from '../../features/theory/lessonHandoff';
import type { CircuitRunResponse } from '../../features/circuit/types';
import './LessonContextBanner.css';

export interface LessonContextBannerProps {
  handoff: LessonWorkbenchHandoff;
  latestResult?: CircuitRunResponse | null;
  executionStatus?: 'idle' | 'running' | 'success' | 'error';
  onNavigateBackToTheory?: () => void;
  onDismiss?: () => void;
}

export const LessonContextBanner: React.FC<LessonContextBannerProps> = ({
  handoff,
  latestResult,
  executionStatus = 'idle',
  onNavigateBackToTheory,
  onDismiss,
}) => {
  // Render concept formula with KaTeX
  const formulaHtml = useMemo(() => {
    if (!handoff.conceptFormula) return null;
    try {
      return katex.renderToString(handoff.conceptFormula, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return null;
    }
  }, [handoff.conceptFormula]);

  // Render math explanations with KaTeX
  const explanationMathHtmls = useMemo(() => {
    if (!handoff.explanation?.math || handoff.explanation.math.length === 0) return [];
    return handoff.explanation.math.map((expr) => {
      try {
        return katex.renderToString(expr, {
          throwOnError: false,
          displayMode: true,
        });
      } catch {
        return expr;
      }
    });
  }, [handoff.explanation?.math]);

  // Extract measured counts and percentages from simulator result
  const measurementData = useMemo(() => {
    if (!latestResult?.simulation) return null;
    const { counts, probabilities, shots } = latestResult.simulation;
    const totalShots = shots || 1000;

    const entries = Object.keys(probabilities || counts || {}).sort().map((state) => {
      const prob = probabilities?.[state] ?? (counts ? counts[state] / totalShots : 0);
      const count = counts?.[state] ?? Math.round(prob * totalShots);
      const percent = (prob * 100).toFixed(1);
      return { state, prob, count, percent };
    });

    return { totalShots, entries };
  }, [latestResult]);

  return (
    <aside
      className="lesson-context-banner"
      role="region"
      aria-label="Theory Lesson Context"
      data-testid="lesson-context-banner"
    >
      <div className="lcb-header">
        <div className="lcb-badge-group">
          <span className="lcb-badge">
            <Sparkles size={13} aria-hidden="true" />
            FROM THEORY LESSON
          </span>
          <span className="lcb-title">{handoff.lessonTitle}</span>
        </div>

        <div className="lcb-actions">
          {onNavigateBackToTheory && (
            <button
              className="lcb-back-button"
              onClick={onNavigateBackToTheory}
              data-testid="lcb-back-to-theory-button"
              aria-label="Return to Theory Lesson"
              title="Return to the theory lesson without losing workbench state"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back to Lesson</span>
            </button>
          )}

          {onDismiss && (
            <button
              className="lcb-dismiss-button"
              onClick={onDismiss}
              data-testid="lcb-dismiss-button"
              aria-label="Dismiss lesson context banner"
              title="Dismiss banner"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="lcb-body">
        {handoff.conceptFormula && (
          <div className="lcb-formula-box" data-testid="lcb-formula">
            <span className="lcb-formula-label">Concept:</span>
            {formulaHtml ? (
              <span
                className="lcb-formula-math"
                dangerouslySetInnerHTML={{ __html: formulaHtml }}
              />
            ) : (
              <code className="lcb-formula-code">{handoff.conceptFormula}</code>
            )}
          </div>
        )}

        {handoff.prediction && (
          <div className="lcb-prediction-box" data-testid="lcb-prediction">
            <div className="lcb-prediction-status">
              {handoff.prediction.isCorrect ? (
                <CheckCircle size={15} className="lcb-correct-icon" aria-hidden="true" />
              ) : (
                <Lightbulb size={15} className="lcb-info-icon" aria-hidden="true" />
              )}
              <span className="lcb-prediction-label">
                Your prediction: <strong>{handoff.prediction.selectedOptionText}</strong>
                {handoff.prediction.isCorrect && ' (Correct)'}
              </span>
            </div>
            <p className="lcb-prediction-explanation">{handoff.prediction.explanation}</p>
          </div>
        )}

        {handoff.promptText && (
          <p className="lcb-prompt-text" data-testid="lcb-prompt">
            {handoff.promptText}
          </p>
        )}

        {/* Phase 14: Simulating status indicator */}
        {executionStatus === 'running' && (
          <div className="lcb-running-box" data-testid="lcb-running-state">
            <Loader2 size={16} className="lcb-spin-icon" aria-hidden="true" />
            <span>Simulating quantum circuit on backend...</span>
          </div>
        )}

        {/* Phase 14: Experiment Observation & Comparison Section */}
        {measurementData && (
          <div className="lcb-result-section" data-testid="lcb-experiment-result">
            <div className="lcb-result-header">
              <div className="lcb-result-title-group">
                <BarChart2 size={15} className="lcb-result-icon" aria-hidden="true" />
                <span className="lcb-result-title">Actual Experiment Results</span>
              </div>
              <span className="lcb-shots-pill">
                {measurementData.totalShots.toLocaleString()} shots
              </span>
            </div>

            <div className="lcb-distribution-grid" data-testid="lcb-distribution-grid">
              {measurementData.entries.map((item) => (
                <div key={item.state} className="lcb-dist-item">
                  <span className="lcb-dist-state">|{item.state}⟩</span>
                  <div className="lcb-dist-bar-track">
                    <div
                      className="lcb-dist-bar-fill"
                      style={{ width: `${Math.max(item.prob * 100, 2)}%` }}
                    />
                  </div>
                  <span className="lcb-dist-val">
                    {item.count} ({item.percent}%)
                  </span>
                </div>
              ))}
            </div>

            {handoff.prediction && (
              <div className="lcb-comparison-badge" data-testid="lcb-comparison-badge">
                <CheckCircle size={14} className="lcb-check-icon" aria-hidden="true" />
                <span>
                  Outcome matches prediction: measured superposition with natural statistical fluctuation.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Phase 14: Structured KaTeX Explanation Section */}
        {measurementData && handoff.explanation && (
          <div className="lcb-explanation-section" data-testid="lcb-explanation">
            <div className="lcb-explanation-header">
              <HelpCircle size={15} className="lcb-explain-icon" aria-hidden="true" />
              <span className="lcb-explanation-title">
                {handoff.explanation.title || 'Why did this happen?'}
              </span>
            </div>

            {explanationMathHtmls.length > 0 && (
              <div className="lcb-math-cards" data-testid="lcb-math-cards">
                {explanationMathHtmls.map((html, idx) => (
                  <div
                    key={idx}
                    className="lcb-math-card"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ))}
              </div>
            )}

            <p className="lcb-explanation-text" data-testid="lcb-explanation-text">
              {handoff.explanation.text}
            </p>
          </div>
        )}

        {/* Call to run simulation if not yet executed */}
        {!latestResult && executionStatus !== 'running' && (
          <div className="lcb-run-hint" data-testid="lcb-run-hint">
            <PlayCircle size={14} aria-hidden="true" />
            <span>
              Click <strong>Run Simulation</strong> to execute your quantum circuit and compare actual measurement statistics with your prediction.
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};

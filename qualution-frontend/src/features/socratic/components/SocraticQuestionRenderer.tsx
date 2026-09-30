import React, { useState, useEffect } from 'react';
import type {
  SocraticQuestion,
  SocraticResponseSubmission,
  SocraticEvaluationResult,
  ConfidenceLevel,
} from '../types';
import {
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { MicroBlochPreview } from './MicroBlochPreview';
import './SocraticQuestionRenderer.css';

interface SocraticQuestionRendererProps {
  question: SocraticQuestion;
  onSubmit: (submission: SocraticResponseSubmission) => void;
  isSubmitting?: boolean;
  lastEvaluation?: SocraticEvaluationResult | null;
  onReset?: () => void;
  currentBlochVector?: { x: number; y: number; z: number };
}

export const SocraticQuestionRenderer: React.FC<SocraticQuestionRendererProps> = ({
  question,
  onSubmit,
  isSubmitting = false,
  lastEvaluation = null,
  onReset,
  currentBlochVector,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [numericValue, setNumericValue] = useState<string>('');
  const [explanationText, setExplanationText] = useState<string>('');
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Reset inputs when question changes
  useEffect(() => {
    setSelectedOption(null);
    setNumericValue('');
    setExplanationText('');
    setConfidence(null);
    setShowHint(false);
  }, [question.id]);

  const canSubmit = (): boolean => {
    if (isSubmitting) return false;
    switch (question.response_type) {
      case 'MULTIPLE_CHOICE':
      case 'PREDICTION':
        return selectedOption !== null;
      case 'NUMERIC':
        return numericValue.trim() !== '' && !isNaN(Number(numericValue));
      case 'EXPLANATION':
        return explanationText.trim().length >= 3;
      default:
        return true;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;

    let responseValue: unknown = null;
    if (question.response_type === 'MULTIPLE_CHOICE' || question.response_type === 'PREDICTION') {
      responseValue = selectedOption;
    } else if (question.response_type === 'NUMERIC') {
      responseValue = Number(numericValue);
    } else if (question.response_type === 'EXPLANATION') {
      responseValue = explanationText;
    }

    onSubmit({
      response_value: responseValue,
      confidence_level: confidence ?? undefined,
      explanation: explanationText ? explanationText : undefined,
    });
  };

  return (
    <div className="socratic-renderer-container" data-testid="socratic-renderer">
      {/* Header with Ladder Step Badge */}
      <div className="socratic-header">
        <span className="socratic-ladder-badge" data-testid="socratic-ladder-badge">
          <Zap size={13} />
          {question.ladder_step}
        </span>
        <div className="socratic-difficulty" title={`Difficulty: ${question.difficulty}/5`}>
          <span>Diff</span>
          {[1, 2, 3, 4, 5].map((d) => (
            <span
              key={d}
              className={`socratic-difficulty-dot ${d <= question.difficulty ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Question Prompt */}
      <h3 className="socratic-prompt" data-testid="socratic-prompt-text">
        {question.prompt}
      </h3>

      {/* Math Formula if present */}
      {question.math_formula && (
        <div className="socratic-math-box" data-testid="socratic-math-formula">
          {question.math_formula}
        </div>
      )}

      {/* Embedded Live Bloch Sphere Geometric Visualization */}
      <MicroBlochPreview
        vector={currentBlochVector || { x: 0, y: 0, z: 1 }}
        targetVector={
          selectedOption === 'opt_1' || selectedOption === 'pred_one' || selectedOption === 'opt_flip_one'
            ? { x: 0, y: 0, z: -1 }
            : selectedOption === 'opt_plus' || selectedOption === 'pred_superposition' || selectedOption === 'opt_super'
            ? { x: 1, y: 0, z: 0 }
            : selectedOption === 'opt_minus'
            ? { x: -1, y: 0, z: 0 }
            : selectedOption === 'opt_0' || selectedOption === 'pred_zero' || selectedOption === 'opt_return_zero'
            ? { x: 0, y: 0, z: 1 }
            : null
        }
        label="Initial State: |0⟩"
        targetLabel="Predicted Statevector"
        interactive={true}
        onVectorSelect={(coords) => {
          // If learner clicks a preset state on the sphere, select corresponding option if available
          if (coords.z === 1) {
            const match = question.options?.find((o) => o.id.includes('zero') || o.label.includes('|0'));
            if (match) setSelectedOption(match.id);
          } else if (coords.z === -1) {
            const match = question.options?.find((o) => o.id.includes('one') || o.label.includes('|1'));
            if (match) setSelectedOption(match.id);
          } else if (coords.x === 1) {
            const match = question.options?.find((o) => o.id.includes('super') || o.id.includes('plus') || o.label.includes('|+'));
            if (match) setSelectedOption(match.id);
          }
        }}
        selectedOptionTarget={
          selectedOption?.includes('zero') || selectedOption?.includes('0')
            ? '|0⟩'
            : selectedOption?.includes('one') || selectedOption?.includes('1')
            ? '|1⟩'
            : selectedOption?.includes('super') || selectedOption?.includes('plus')
            ? '|+⟩'
            : null
        }
      />

      {/* Interaction Form based on response_type */}
      <form onSubmit={handleSubmit} className="socratic-form">
        {/* Multiple Choice / Prediction */}
        {(question.response_type === 'MULTIPLE_CHOICE' ||
          question.response_type === 'PREDICTION') &&
          question.options && (
            <div className="socratic-options-grid" role="radiogroup" aria-label="Question options">
              {question.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedOption === opt.id}
                  className={`socratic-option-btn ${selectedOption === opt.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(opt.id)}
                  data-testid={`socratic-option-${opt.id}`}
                  disabled={isSubmitting}
                >
                  <span className="socratic-option-label">{opt.label}</span>
                  {opt.description && (
                    <span className="socratic-option-desc">{opt.description}</span>
                  )}
                </button>
              ))}
            </div>
          )}

        {/* Numeric Input */}
        {question.response_type === 'NUMERIC' && (
          <div className="socratic-numeric-box">
            <input
              type="number"
              step="any"
              className="socratic-numeric-input"
              placeholder="e.g. 50"
              value={numericValue}
              onChange={(e) => setNumericValue(e.target.value)}
              data-testid="socratic-numeric-input"
              disabled={isSubmitting}
              aria-label="Numeric answer"
            />
            <span className="socratic-numeric-unit">% expected probability</span>
          </div>
        )}

        {/* Open-Ended Explanation */}
        {question.response_type === 'EXPLANATION' && (
          <textarea
            className="socratic-explanation-area"
            placeholder="Explain your reasoning in your own words..."
            value={explanationText}
            onChange={(e) => setExplanationText(e.target.value)}
            data-testid="socratic-explanation-textarea"
            disabled={isSubmitting}
            aria-label="Your explanation"
          />
        )}

        {/* Optional Confidence Calibration Bar */}
        <div className="socratic-confidence-section">
          <span className="socratic-confidence-label">How confident are you?</span>
          <div className="socratic-confidence-buttons">
            <button
              type="button"
              className={`socratic-confidence-btn ${confidence === 'GUESSING' ? 'selected' : ''}`}
              onClick={() => setConfidence('GUESSING')}
              data-testid="socratic-confidence-guessing"
              disabled={isSubmitting}
            >
              ❓ Guessing
            </button>
            <button
              type="button"
              className={`socratic-confidence-btn ${confidence === 'SOMEWHAT_CONFIDENT' ? 'selected' : ''}`}
              onClick={() => setConfidence('SOMEWHAT_CONFIDENT')}
              data-testid="socratic-confidence-somewhat"
              disabled={isSubmitting}
            >
              💭 Somewhat
            </button>
            <button
              type="button"
              className={`socratic-confidence-btn ${confidence === 'VERY_CONFIDENT' ? 'selected' : ''}`}
              onClick={() => setConfidence('VERY_CONFIDENT')}
              data-testid="socratic-confidence-very"
              disabled={isSubmitting}
            >
              🎯 Confident
            </button>
          </div>
        </div>

        {/* Scaffold Hint Card */}
        {showHint && question.scaffold_hint && (
          <div className="socratic-hint-card" data-testid="socratic-hint-box">
            <Lightbulb size={16} />
            <span>{question.scaffold_hint}</span>
          </div>
        )}

        {/* Evaluation Feedback Banner if available */}
        {lastEvaluation && (
          <div
            className={`socratic-feedback-banner ${
              lastEvaluation.reasoning_quality === 'MISCONCEPTION'
                ? 'misconception'
                : lastEvaluation.is_correct
                ? 'correct'
                : 'incorrect'
            }`}
            data-testid="socratic-feedback-banner"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              {lastEvaluation.is_correct ? (
                <>
                  <CheckCircle2 size={16} /> Verified Discovery
                </>
              ) : (
                <>
                  <AlertTriangle size={16} /> Pedagogical Insight
                </>
              )}
            </div>
            <p style={{ margin: 0 }}>{lastEvaluation.feedback}</p>

            {/* Empirical Simulation Measurement Outcome Histogram */}
            {lastEvaluation.simulation_payload?.counts && (
              <div className="socratic-sim-results" data-testid="socratic-sim-results">
                <div className="socratic-sim-title">
                  <span>🔬 Empirical Aer Simulation ({lastEvaluation.simulation_payload.shots || 1000} shots):</span>
                </div>
                <div className="socratic-sim-bars">
                  {Object.entries(lastEvaluation.simulation_payload.counts).map(([state, count]) => {
                    const totalShots = lastEvaluation.simulation_payload?.shots || 1000;
                    const pct = ((count / totalShots) * 100).toFixed(1);
                    return (
                      <div key={state} className="socratic-sim-row">
                        <span className="socratic-sim-label">|{state}⟩</span>
                        <div className="socratic-sim-track">
                          <div
                            className="socratic-sim-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="socratic-sim-pct">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="socratic-action-footer">
          {question.scaffold_hint ? (
            <button
              type="button"
              className="socratic-hint-btn"
              onClick={() => setShowHint(!showHint)}
              data-testid="socratic-toggle-hint-btn"
            >
              <Lightbulb size={14} />
              <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onReset && (
              <button
                type="button"
                className="socratic-hint-btn"
                onClick={onReset}
                title="Reset checkpoint"
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              type="submit"
              className="socratic-submit-btn"
              disabled={!canSubmit()}
              data-testid="socratic-submit-response-btn"
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Analyzing...' : 'Submit & Inquire'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

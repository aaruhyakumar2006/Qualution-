/**
 * GroverAmplitudeBars.tsx
 *
 * Shared component: 4-state probability amplitude and measurement probability visualization.
 * Reused across Theory Lesson (Beats T2, T3, T4) and the Workbench Lab.
 *
 * Rules:
 * - Four bars around a horizontal zero line with values (+0.50, -0.50, +1.00, etc.)
 * - Probability bars underneath (25%, 0%, 100%)
 * - Step-by-step formula reveal: "probability = amplitude squared" (P = |alpha|^2)
 * - Mean line: dashed horizontal line at average (mu = +0.25)
 * - Mirror reflection animation: 0.50 -> 0, -0.50 -> 1.00
 * - One fixed token color (#00f2ff) for marked state |11⟩
 * - Motion strictly uses transform and opacity
 */

import React from 'react';
import './groverShared.css';

export interface GroverAmplitudeBarsProps {
  /** Amplitudes for [00, 01, 10, 11] (e.g. [0.5, 0.5, 0.5, 0.5] or [0.5, 0.5, 0.5, -0.5] or [0, 0, 0, 1.0]) */
  amplitudes: [number, number, number, number];
  /** Whether to show the dashed mean line (e.g. mu = +0.25) */
  mean?: number | null;
  /** Whether to show reflection vectors across the mean line */
  showReflectionArrows?: boolean;
  /** Whether the reflection animation is active */
  isReflecting?: boolean;
  /** Formula reveal stage: 0 = hidden, 1 = formula only, 2 = full calculation */
  formulaStep?: 0 | 1 | 2;
  /** Target state index (default: 3, which is |11⟩) */
  markedIndex?: number;
  /** Optional container style */
  className?: string;
}

const STATES = ['00', '01', '10', '11'] as const;

export const GroverAmplitudeBars: React.FC<GroverAmplitudeBarsProps> = ({
  amplitudes,
  mean = null,
  showReflectionArrows = false,
  isReflecting = false,
  formulaStep = 2,
  markedIndex = 3,
  className = '',
}) => {
  return (
    <div className={`grover-amp-bars-container ${className}`} data-testid="grover-amplitude-bars">
      {/* Formula Reveal Bar */}
      {formulaStep > 0 && (
        <div className="grover-born-rule-banner" data-testid="born-rule-formula">
          <span className="formula-tag">BORN RULE:</span>
          <span className="formula-main">
            {formulaStep === 1
              ? 'P(x) = |αₓ|²'
              : 'P(x) = |αₓ|²  ⟹  |±0.50|² = 0.25 (25%)'}
          </span>
          <span className="formula-note">
            (Squaring removes negative signs: quantum phase is invisible to direct measurement!)
          </span>
        </div>
      )}

      {/* Main Bar Chart Stage */}
      <div className="grover-amp-chart-stage">
        {/* Zero Axis Line */}
        <div className="grover-zero-axis" title="Amplitude = 0">
          <span className="zero-label">0.00</span>
        </div>

        {/* Dashed Mean Line (μ = +0.25) */}
        {mean !== null && (
          <div
            className="grover-mean-line"
            style={{
              // Position relative to zero axis: zero is at 50%, scale is 120px per 1.0 amplitude
              bottom: `calc(50% + ${mean * 120}px)`,
            }}
            data-testid="grover-mean-line"
          >
            <span className="mean-line-tag">
              Mean μ = {mean >= 0 ? `+${mean.toFixed(2)}` : mean.toFixed(2)}
            </span>
          </div>
        )}

        {/* 4 State Amplitude Columns */}
        <div className="grover-amp-bars-grid">
          {STATES.map((state, idx) => {
            const amp = amplitudes[idx];
            const isMarked = idx === markedIndex;
            const isNegative = amp < 0;
            const absAmp = Math.abs(amp);
            const probPct = Math.round(amp * amp * 100);

            // Bar height: 1.0 amplitude = 120px
            const barHeightPx = Math.min(130, Math.round(absAmp * 120));

            return (
              <div
                key={state}
                className={`grover-amp-col ${isMarked ? 'is-marked-state' : ''}`}
                data-testid={`amp-col-${state}`}
              >
                {/* Amplitude Value Tag (Top or Bottom of bar) */}
                <div
                  className="grover-amp-value-tag"
                  style={{
                    transform: isNegative ? 'translateY(16px)' : 'translateY(-16px)',
                  }}
                >
                  <span className={`amp-num ${isNegative ? 'negative-val' : ''}`}>
                    {amp > 0 ? `+${amp.toFixed(2)}` : amp.toFixed(2)}
                  </span>
                </div>

                {/* Vertical Track Area (Zero line at 50%) */}
                <div className="grover-amp-track">
                  {/* Fill Bar: extends UP for positive, DOWN for negative */}
                  <div
                    className={`grover-amp-fill ${isNegative ? 'is-negative' : 'is-positive'} ${
                      isMarked ? 'is-target' : ''
                    } ${isReflecting ? 'anim-reflect' : ''}`}
                    style={{
                      height: `${barHeightPx}px`,
                      bottom: isNegative ? undefined : '50%',
                      top: isNegative ? '50%' : undefined,
                    }}
                  >
                    {isNegative && <span className="amp-phase-marker">-π Phase</span>}
                    {isMarked && amp >= 0.9 && <span className="amp-star-marker">★ 100%</span>}
                  </div>

                  {/* Reflection Arrow (in Beat T4) */}
                  {showReflectionArrows && mean !== null && (
                    <div
                      className={`grover-reflection-arrow ${isNegative ? 'reflect-up' : 'reflect-down'}`}
                      title={
                        isNegative
                          ? 'Reflects across μ = +0.25: -0.50 -> +1.00'
                          : 'Reflects across μ = +0.25: +0.50 -> 0.00'
                      }
                    >
                      <span className="arrow-sym">{isNegative ? '▲ +1.50' : '▼ -0.50'}</span>
                    </div>
                  )}
                </div>

                {/* State Label */}
                <div className="grover-state-label-wrap">
                  <span className={`grover-state-label ${isMarked ? 'target-label' : ''}`}>
                    |{state}⟩
                  </span>
                </div>

                {/* Probability Bar Underneath */}
                <div className="grover-prob-meter-wrap">
                  <div className="prob-bar-track">
                    <div
                      className={`prob-bar-fill ${isMarked ? 'target-prob' : ''}`}
                      style={{ width: `${probPct}%` }}
                    />
                  </div>
                  <span className={`prob-text ${isMarked && probPct >= 90 ? 'target-prob-text' : ''}`}>
                    {probPct}% Prob
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

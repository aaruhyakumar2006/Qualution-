/**
 * GroverCompass.tsx
 *
 * Shared component: 2D Geometric Subspace Compass & State Vector Rotation.
 * Reused across Theory Lesson (Beat T5) and the Workbench Lab.
 *
 * Rules:
 * - 2D Subspace spanned by |w⟩ (horizontal axis) and |11⟩ (vertical target axis)
 * - Arc with angle marker 30° -> 90° -> 150°
 * - Probability meter: 25% -> 100% -> 25%
 * - Overshoot warning when angle reaches 150° (Tripwire c: 25% across all 4, NOT 6.25%)
 * - Motion is CSS transform (rotate) and opacity only
 * - Fixed marked state token color: #00f2ff
 */

import React from 'react';
import { AlertTriangle, CheckCircle, RotateCw } from 'lucide-react';
import './groverShared.css';

export interface GroverCompassProps {
  /** Angle in degrees (e.g. 30, 90, 150) */
  angleDeg: number;
  /** Probability of target state (e.g. 25, 100, 25) */
  targetProbability: number;
  /** Current Grover iteration round (0, 1, 2) */
  iterationRound?: number;
  /** Optional container style */
  className?: string;
}

export const GroverCompass: React.FC<GroverCompassProps> = ({
  angleDeg,
  targetProbability,
  iterationRound = 1,
  className = '',
}) => {
  const isOptimal = Math.abs(angleDeg - 90) < 5;
  const isOvershot = angleDeg >= 135;

  return (
    <div className={`grover-compass-container ${className}`} data-testid="grover-compass">
      <div className="grover-compass-header">
        <span className="compass-badge">2D GEOMETRIC ROTATION SUBSPACE</span>
        <span className="compass-round-tag">
          {iterationRound === 0
            ? 'Initial Superposition (R = 0)'
            : iterationRound === 1
            ? 'Round 1 Completed (R = 1)'
            : 'Round 2: Overshoot (R = 2)'}
        </span>
      </div>

      <div className="grover-compass-body">
        {/* Dial & Vector Arc Stage */}
        <div className="compass-dial-viewport">
          <svg className="compass-svg" viewBox="0 0 320 320">
            <defs>
              <filter id="vector-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Subspace Quadrant Arc (0 to 180 degrees) */}
            <circle
              cx="160"
              cy="240"
              r="120"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Horizontal Axis: |w⟩ Unmarked Basis */}
            <line x1="40" y1="240" x2="280" y2="240" stroke="#334155" strokeWidth="2" />
            <text x="285" y="244" fill="#64748b" fontSize="12" fontWeight="700">
              |w⟩ (Unmarked)
            </text>

            {/* Vertical Axis: |11⟩ Target Basis */}
            <line x1="160" y1="240" x2="160" y2="70" stroke="rgba(0, 242, 255, 0.4)" strokeWidth="2" strokeDasharray="3 3" />
            <text x="160" y="55" textAnchor="middle" fill="#00f2ff" fontSize="13" fontWeight="800">
              |11⟩ Target (90°)
            </text>

            {/* Key Angle Guides */}
            {/* 30 degree line */}
            <line
              x1="160"
              y1="240"
              x2={160 + 120 * Math.cos((30 * Math.PI) / 180)}
              y2={240 - 120 * Math.sin((30 * Math.PI) / 180)}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            <text
              x={160 + 135 * Math.cos((30 * Math.PI) / 180)}
              y={240 - 135 * Math.sin((30 * Math.PI) / 180)}
              fill="#38bdf8"
              fontSize="11"
              fontWeight="600"
            >
              30° (|s⟩)
            </text>

            {/* 150 degree line */}
            <line
              x1="160"
              y1="240"
              x2={160 - 120 * Math.cos((30 * Math.PI) / 180)}
              y2={240 - 120 * Math.sin((30 * Math.PI) / 180)}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            <text
              x={160 - 145 * Math.cos((30 * Math.PI) / 180)}
              y={240 - 135 * Math.sin((30 * Math.PI) / 180)}
              fill="#ef4444"
              fontSize="11"
              fontWeight="600"
            >
              150°
            </text>

            {/* Origin Pivot Point */}
            <circle cx="160" cy="240" r="5" fill="#f8fafc" />

            {/* Dynamic Rotating State Vector Arrow */}
            <g
              style={{
                transformOrigin: '160px 240px',
                transform: `rotate(${-(angleDeg - 0)}deg)`,
                transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            >
              <line
                x1="160"
                y1="240"
                x2="280"
                y2="240"
                stroke={isOptimal ? '#00f2ff' : isOvershot ? '#ef4444' : '#38bdf8'}
                strokeWidth="4"
                filter="url(#vector-glow)"
              />
              <polygon
                points="285,240 274,234 274,246"
                fill={isOptimal ? '#00f2ff' : isOvershot ? '#ef4444' : '#38bdf8'}
              />
            </g>
          </svg>

          <div className="compass-center-readout">
            <span className="compass-angle-val" data-testid="compass-angle-value">
              {angleDeg}°
            </span>
            <span className="compass-angle-sub">Current State Vector θ</span>
          </div>
        </div>

        {/* Status & Probability Meter Beside the Compass */}
        <div className="compass-metrics-panel">
          <div className="prob-meter-card">
            <span className="meter-label">TARGET STATE |11⟩ PROBABILITY</span>
            <div className="meter-val-row">
              <span className={`meter-huge-val ${isOptimal ? 'is-peak' : isOvershot ? 'is-drop' : ''}`}>
                {targetProbability}%
              </span>
              {isOptimal && (
                <span className="peak-badge">
                  <CheckCircle size={14} /> PEAK CERTAINTY
                </span>
              )}
              {isOvershot && (
                <span className="overshot-badge">
                  <AlertTriangle size={14} /> OVER-ROTATED
                </span>
              )}
            </div>

            <div className="meter-track-lg">
              <div
                className={`meter-fill-lg ${isOptimal ? 'fill-peak' : isOvershot ? 'fill-drop' : ''}`}
                style={{ width: `${targetProbability}%` }}
              />
            </div>
            <span className="meter-formula">
              P(|11⟩) = sin²({angleDeg}°) = {(targetProbability / 100).toFixed(2)}
            </span>
          </div>

          {/* Overshoot Educational Insight Box */}
          {isOvershot ? (
            <div className="overshoot-alert-box" data-testid="overshoot-warning">
              <div className="alert-title">
                <AlertTriangle size={16} />
                <span>OVERSHOOT DYNAMICS (TRIPWIRE C)</span>
              </div>
              <p className="alert-text">
                Quantum search does <strong>NOT</strong> improve monotonically! Running a 2nd iteration rotates
                the vector by another +60° to <strong>150°</strong>. Because sin²(150°) = (1/2)² = 25%, target
                probability collapses back down to 25%, returning the register to uniform distribution!
              </p>
            </div>
          ) : isOptimal ? (
            <div className="optimal-callout-box">
              <div className="alert-title text-cyan">
                <CheckCircle size={16} />
                <span>R = 1 OPTIMAL STOPPING CONDITION</span>
              </div>
              <p className="alert-text">
                For N = 4, rotation angle per step is θ = π/3 (60°). Starting from 30°, exactly <strong>1 single iteration</strong> lands
                directly on |11⟩ at 90° with <strong>100% deterministic probability</strong>.
              </p>
            </div>
          ) : (
            <div className="initial-callout-box">
              <div className="alert-title">
                <RotateCw size={16} />
                <span>INITIAL SUPERPOSITION (R = 0)</span>
              </div>
              <p className="alert-text">
                All 4 states share equal probability amplitude (1/2). In the 2D subspace, sin(30°) = 0.5,
                giving sin²(30°) = 25% baseline target probability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

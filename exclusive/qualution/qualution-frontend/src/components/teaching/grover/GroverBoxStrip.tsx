/**
 * GroverBoxStrip.tsx
 *
 * Shared component: 4-box search space visualization (|00⟩, |01⟩, |10⟩, |11⟩).
 * Reused across both Theory Lesson (Beat T1) and Practical Lab (Workbench).
 *
 * Ground rules:
 * - Prize box (|11⟩) uses ONE fixed token color everywhere: var(--wb-status-cyan, #00f2ff).
 * - Motion is CSS transform & opacity only (no layout shifting).
 * - Classical search step indicates inspection state (empty / checked / prize).
 */

import React from 'react';
import './groverShared.css';

export interface GroverBoxStripProps {
  /** Which boxes have been inspected/checked (e.g. ['00', '01', '10']) */
  checkedBoxes?: string[];
  /** Currently highlighted box being inspected (e.g. '00') */
  activeBox?: string | null;
  /** Marked prize state key (default: '11') */
  markedBox?: string;
  /** Whether the prize has been found/revealed */
  isPrizeRevealed?: boolean;
  /** Mode: 'classical' demonstrates O(N) sequential search; 'quantum' demonstrates superposition */
  mode?: 'classical' | 'quantum';
  /** Optional container style */
  className?: string;
}

const BOX_KEYS = ['00', '01', '10', '11'] as const;

export const GroverBoxStrip: React.FC<GroverBoxStripProps> = ({
  checkedBoxes = [],
  activeBox = null,
  markedBox = '11',
  isPrizeRevealed = false,
  mode = 'classical',
  className = '',
}) => {
  return (
    <div className={`grover-box-strip-container ${className}`} data-testid="grover-box-strip">
      <div className="grover-box-strip-header">
        <span className="grover-strip-label">
          {mode === 'classical' ? 'CLASSICAL DATABASE (UNSORTED N = 4)' : 'QUANTUM 2-QUBIT REGISTER (N = 4)'}
        </span>
        <span className="grover-strip-badge">
          {mode === 'classical' ? 'O(N) Search' : 'O(√N) Interference'}
        </span>
      </div>

      <div className="grover-box-strip-grid">
        {BOX_KEYS.map((key) => {
          const isMarked = key === markedBox;
          const isChecked = checkedBoxes.includes(key);
          const isActive = activeBox === key;
          const showAsPrize = isMarked && (isPrizeRevealed || (isChecked && isMarked));

          return (
            <div
              key={key}
              className={`grover-box-card ${isMarked ? 'is-marked-box' : ''} ${
                isChecked ? 'is-checked' : ''
              } ${isActive ? 'is-active-inspect' : ''} ${showAsPrize ? 'prize-revealed' : ''}`}
              data-testid={`box-${key}`}
            >
              <div className="grover-box-glow" />
              <div className="grover-box-header">
                <span className="grover-box-ket">|{key}⟩</span>
                <span className="grover-box-index">Item {parseInt(key, 2) + 1}</span>
              </div>

              <div className="grover-box-content">
                {showAsPrize ? (
                  <div className="grover-box-prize">
                    <span className="prize-star">★</span>
                    <span className="prize-tag">PRIZE</span>
                  </div>
                ) : isChecked && !isMarked ? (
                  <div className="grover-box-empty">
                    <span className="empty-x">✗</span>
                    <span className="empty-text">Empty</span>
                  </div>
                ) : isActive ? (
                  <div className="grover-box-inspecting">
                    <span className="inspecting-pulse" />
                    <span className="inspecting-text">Checking…</span>
                  </div>
                ) : (
                  <div className="grover-box-closed">
                    <span className="closed-icon">🔒</span>
                    <span className="closed-text">Hidden</span>
                  </div>
                )}
              </div>

              <div className="grover-box-footer">
                {isMarked ? (
                  <span className="marked-token-pill">Target State</span>
                ) : (
                  <span className="unmarked-token-pill">Candidate</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import './ProbabilityHistogram.css';

interface ProbabilityHistogramProps {
  probabilities?: Record<string, number> | null;
  counts?: Record<string, number> | null;
  totalShots?: number;
}

export const ProbabilityHistogram: React.FC<ProbabilityHistogramProps> = React.memo(({
  probabilities,
  counts,
  totalShots,
}) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const safeProbs = probabilities || {};
  const rawEntries = Object.entries(safeProbs);

  // Gracefully handle absent or empty distributions (e.g. cloud stubs)
  if (rawEntries.length === 0) {
    return (
      <div className="prob-histogram-container ibm-composer-chart-container empty-distribution" data-testid="probability-histogram">
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '1rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No Measurement Distribution Available
          </span>
          <p style={{ fontSize: '0.85rem', maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
            This execution path has not produced projective measurement counts (e.g. pending simulation or unimplemented cloud roadmap stub).
          </p>
        </div>
      </div>
    );
  }

  // Compute basis states to display
  const sampleKey = rawEntries[0]?.[0] || '0000';
  const qubitCount = Math.max(1, sampleKey.length);

  // For up to 4 qubits, show all 2^N states (e.g. 16 states for 4Q)
  const totalBasisStates = Math.min(16, Math.pow(2, qubitCount));
  const fullBasisStates: string[] = [];
  for (let i = 0; i < totalBasisStates; i++) {
    fullBasisStates.push(i.toString(2).padStart(qubitCount, '0'));
  }

  // Merge with existing entries to ensure everything in probabilities is represented
  const allStates = Array.from(new Set([...fullBasisStates, ...Object.keys(safeProbs)])).sort();
  const isCompactTicks = allStates.length > 4;

  return (
    <div className="prob-histogram-container ibm-composer-chart-container" data-testid="probability-histogram">
      {/* ── IBM Composer Vertical Bar Chart ── */}
      <div className="composer-chart-wrapper">
        {/* Y-Axis Label */}
        <div className="composer-y-axis-label">
          <span>Probability (%)</span>
        </div>

        {/* Chart Canvas Area with Y-axis ticks, gridlines and vertical bars */}
        <div className="composer-chart-area">
          {/* Y-axis Ticks & Grid Lines: 100, 80, 60, 40, 20, 0 */}
          <div className="composer-grid-lines">
            {[100, 80, 60, 40, 20, 0].map((tick) => (
              <div key={tick} className="composer-grid-row">
                <span className="composer-tick-lbl">{tick}</span>
                <div className="composer-grid-line" />
              </div>
            ))}
          </div>

          {/* Bars Container */}
          <div className="composer-bars-track">
            {allStates.map((state) => {
              const prob = probabilities[state] ?? 0;
              const heightPct = Math.min(100, Math.max(0, prob * 100));
              const isNonZero = prob > 0.0001;

              return (
                <div
                  key={state}
                  className={`composer-bar-col ${isNonZero ? 'has-value' : 'zero-value'} ${hoveredState === state ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredState(state)}
                  onMouseLeave={() => setHoveredState(null)}
                >
                  <div className="composer-bar-slot">
                    {isNonZero && (
                      <div
                        className="composer-bar-fill"
                        style={{ height: `${Math.max(2, heightPct)}%` }}
                        title={`|${state}⟩: ${(prob * 100).toFixed(1)}%`}
                      />
                    )}
                  </div>
                  <div className={`composer-x-tick-label ${isCompactTicks ? 'compact' : 'horizontal'}`}>
                    <span>{state}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* ── Test & Screen Reader Compatibility Layer ── */}
      <div className="histogram-compatibility-layer">
        <div className="histogram-header-legend">
          <span className="legend-label state">Basis State</span>
          <span className="legend-label distribution">Distribution</span>
          <span className="legend-label values">
            Theoretical Probability / {totalShots ? `Measured Distribution (${totalShots.toLocaleString()} shots)` : 'Measured Distribution (1,000 shots)'}
          </span>
        </div>
        <div className="histogram-bars-list">
          {Object.entries(safeProbs).sort(([a], [b]) => a.localeCompare(b)).map(([state, prob]) => {
            const expectedPct = (prob * 100).toFixed(1);
            const count = counts?.[state];
            const observedPct =
              count !== undefined && totalShots && totalShots > 0
                ? ((count / totalShots) * 100).toFixed(1)
                : null;

            return (
              <div key={state} className="hist-row" data-testid={`hist-row-${state}`}>
                <div className="hist-state-label">|{state}⟩</div>
                <div className="hist-val-label">
                  <span className="hist-pct">{expectedPct}%</span>
                  {count !== undefined && (
                    <span className="hist-count">
                      {count} {observedPct ? `(${observedPct}%)` : `shots`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ProbabilityHistogram.displayName = 'ProbabilityHistogram';

import React from 'react';
import type { OptimizationImprovements } from '../../api/optimization';
import type { CircuitMetricsResponse } from '../../features/circuit/types';
import { Cpu, Activity, CheckCircle2 } from 'lucide-react';
import './OptimizationMetrics.css';

interface OptimizationMetricsProps {
  originalMetrics: CircuitMetricsResponse;
  optimizedMetrics: CircuitMetricsResponse;
  improvements: OptimizationImprovements;
  originalExecutionTimeMs?: number | null;
  optimizedExecutionTimeMs?: number | null;
}

export const OptimizationMetrics: React.FC<OptimizationMetricsProps> = ({
  originalMetrics,
  optimizedMetrics,
  improvements,
  originalExecutionTimeMs,
  optimizedExecutionTimeMs,
}) => {
  const hasMeasuredRuntime =
    originalExecutionTimeMs !== undefined &&
    originalExecutionTimeMs !== null &&
    optimizedExecutionTimeMs !== undefined &&
    optimizedExecutionTimeMs !== null &&
    originalExecutionTimeMs > 0;

  const runtimeDeltaPercent = hasMeasuredRuntime
    ? (((optimizedExecutionTimeMs! - originalExecutionTimeMs!) / originalExecutionTimeMs!) * 100).toFixed(1)
    : null;

  return (
    <div className="optimization-metrics-container" data-testid="optimization-metrics">
      {/* Structural Improvements Section */}
      <div className="metrics-section">
        <div className="section-header">
          <Cpu size={14} className="section-icon" />
          <span className="section-title">Structural Improvements</span>
        </div>

        <div className="metrics-grid">
          <div className="metric-card" data-testid="metric-gate-count">
            <div className="metric-label">Total Gates</div>
            <div className="metric-values">
              <span className="orig-val">{originalMetrics?.gate_count ?? 0}</span>
              <span className="val-arrow">→</span>
              <span className="opt-val">{optimizedMetrics?.gate_count ?? 0}</span>
            </div>
            <div
              className={`metric-change ${
                (improvements?.gate_count_reduction ?? 0) > 0 ? 'positive' : 'neutral'
              }`}
            >
              {(improvements?.gate_count_reduction ?? 0) > 0 ? (
                <span>
                  -{improvements.gate_count_reduction} ({improvements.gate_count_reduction_percent}%)
                </span>
              ) : (
                <span>0%</span>
              )}
            </div>
          </div>

          <div className="metric-card" data-testid="metric-depth">
            <div className="metric-label">Circuit Depth</div>
            <div className="metric-values">
              <span className="orig-val">{originalMetrics?.depth ?? 0}</span>
              <span className="val-arrow">→</span>
              <span className="opt-val">{optimizedMetrics?.depth ?? 0}</span>
            </div>
            <div
              className={`metric-change ${
                (improvements?.depth_reduction ?? 0) > 0 ? 'positive' : 'neutral'
              }`}
            >
              {(improvements?.depth_reduction ?? 0) > 0 ? (
                <span>
                  -{improvements.depth_reduction} ({improvements.depth_reduction_percent}%)
                </span>
              ) : (
                <span>0%</span>
              )}
            </div>
          </div>

          <div className="metric-card" data-testid="metric-two-qubit">
            <div className="metric-label">2-Qubit Gates (CX / CZ / SWAP)</div>
            <div className="metric-values">
              <span className="orig-val">{originalMetrics?.two_qubit_gate_count ?? 0}</span>
              <span className="val-arrow">→</span>
              <span className="opt-val">{optimizedMetrics?.two_qubit_gate_count ?? 0}</span>
            </div>
            <div
              className={`metric-change ${
                (improvements?.two_qubit_gate_reduction ?? 0) > 0 ? 'positive' : 'neutral'
              }`}
            >
              {(improvements?.two_qubit_gate_reduction ?? 0) > 0 ? (
                <span>
                  -{improvements.two_qubit_gate_reduction} ({improvements.two_qubit_gate_reduction_percent}%)
                </span>
              ) : (
                <span>0%</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Execution Comparison Section */}
      <div className="metrics-section runtime-section" data-testid="runtime-comparison-section">
        <div className="section-header">
          <Activity size={14} className="section-icon" />
          <span className="section-title">Execution Comparison</span>
        </div>

        {hasMeasuredRuntime ? (
          <div className="runtime-card" data-testid="measured-runtime-card">
            <div className="runtime-grid">
              <div className="runtime-col">
                <span className="runtime-col-label">Original Run</span>
                <span className="runtime-val">{originalExecutionTimeMs} ms</span>
              </div>
              <div className="runtime-arrow">→</div>
              <div className="runtime-col">
                <span className="runtime-col-label">Optimized Run</span>
                <span className="runtime-val">{optimizedExecutionTimeMs} ms</span>
              </div>
            </div>
            <div className="runtime-badge">
              <CheckCircle2 size={12} />
              <span>Measured runtime improvement: {runtimeDeltaPercent}%</span>
            </div>
          </div>
        ) : (
          <div className="runtime-unavailable-card" data-testid="runtime-unavailable">
            <span className="unavailable-title">Runtime comparison unavailable</span>
            <p className="unavailable-text">
              Run both circuits to compare measured execution time on the backend simulator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

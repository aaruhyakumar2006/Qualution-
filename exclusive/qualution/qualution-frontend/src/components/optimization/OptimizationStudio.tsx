import React, { useEffect, useState } from 'react';
import type { CircuitRequest } from '../../features/circuit/types';
import { optimizeCircuit, type OptimizationResponse } from '../../api/optimization';
import { CircuitComparison } from './CircuitComparison';
import { OptimizationMetrics } from './OptimizationMetrics';
import {
  Cpu,
  X,
  AlertTriangle,
  HelpCircle,
  Clock,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import './OptimizationStudio.css';

interface OptimizationStudioProps {
  isOpen: boolean;
  inlineMode?: boolean;
  circuit: CircuitRequest;
  originalExecutionTimeMs?: number | null;
  onClose: () => void;
  onApplyOptimization: (optimizedCircuit: CircuitRequest, response: OptimizationResponse) => void;
}

export const OptimizationStudio: React.FC<OptimizationStudioProps> = ({
  isOpen,
  inlineMode = false,
  circuit,
  originalExecutionTimeMs,
  onClose,
  onApplyOptimization,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [optimizationData, setOptimizationData] = useState<OptimizationResponse | null>(null);
  const [aiInsights, setAiInsights] = useState<{
    architectural_summary?: string;
    hardware_fidelity_impact?: string;
    key_takeaways?: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setOptimizationData(null);
      setAiInsights(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    optimizeCircuit(circuit)
      .then((res) => {
        if (isMounted) {
          setOptimizationData(res);
          setIsLoading(false);

          // Fetch deep NVIDIA AI hardware & physical fidelity analysis
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
          fetch(`${baseUrl}/ai/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              original_circuit: circuit,
              optimized_circuit: res.optimized_circuit,
              passes: res.optimization_passes_applied,
              improvements: res.improvements,
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (isMounted && data) {
                setAiInsights(data);
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to communicate with the optimization backend service.'
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, circuit]);

  if (!isOpen && !inlineMode) return null;
  if (inlineMode && !isOpen) return null;

  const isVerified = optimizationData?.correctness_verified === true;
  const canApply = isVerified && !isLoading && !error && optimizationData !== null;

  const inner = (
    <div className={inlineMode ? 'optimization-studio-inline' : 'optimization-studio-modal'}>
      {/* Studio Header */}
      <div className="studio-header">
        <div className="studio-title-area">
          <div className="studio-icon-badge">
            <Cpu size={16} />
          </div>
          <div>
              <h2 className="studio-title">Circuit Optimization Studio</h2>
              <span className="studio-subtitle">
                Deterministic rewrite passes with formal mathematical equivalence verification
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-close-studio"
            onClick={onClose}
            aria-label="Close Optimization Studio"
            data-testid="btn-close-studio"
          >
            <X size={16} />
          </button>
        </div>

        {/* Studio Content Body */}
        <div className="studio-body">
          {isLoading && (
            <div className="studio-loading-state" data-testid="optimization-loading">
              <RotateCw size={24} className="studio-spinner" />
              <span className="loading-text">Analyzing circuit and computing formal unitary equivalence...</span>
              <span className="loading-subtext">Running backend algebraic passes & equivalence verification</span>
            </div>
          )}

          {error && (
            <div className="studio-error-banner" role="alert" data-testid="optimization-error-banner">
              <AlertTriangle size={18} className="error-icon" />
              <div className="error-text-container">
                <span className="error-title">Optimization Failed</span>
                <span className="error-msg">{error}</span>
                <span className="error-note">Your original circuit was preserved without modification.</span>
              </div>
            </div>
          )}

          {!isLoading && !error && optimizationData && (
            <div className="studio-results-container">
              {/* Formal Verification Banner */}
              <div
                className={`verification-banner ${isVerified ? (optimizationData.changed ? 'verified' : 'optimal') : 'unverified'}`}
                data-testid="formal-verification-banner"
              >
                {isVerified ? (
                  optimizationData.changed ? (
                    <>
                      <ShieldCheck size={18} className="verify-icon success" />
                      <div className="verify-content">
                        <span className="verify-title">✓ Formal Equivalence Verified</span>
                        <span className="verify-desc">
                          The optimized candidate is mathematically proven equivalent to your original circuit up to a global phase ($U_{'{opt}'} = e^{'{i\\phi}'} U_{'{orig}'}$).
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} className="verify-icon success" />
                      <div className="verify-content">
                        <span className="verify-title">✓ Circuit Is Already Optimal</span>
                        <span className="verify-desc">
                          Formal algebraic analysis confirms no redundant self-inverses, cancellable gates, or mergeable rotations were found. Your circuit is already in its minimal, optimal unitary form.
                        </span>
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <AlertTriangle size={18} className="verify-icon failure" />
                    <div className="verify-content">
                      <span className="verify-title">⚠ Optimization Rejected</span>
                      <span className="verify-desc">
                        The candidate circuit failed formal unitary equivalence verification. Applying is disabled to guarantee mathematical correctness.
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Structural & Runtime Metrics */}
              <OptimizationMetrics
                originalMetrics={optimizationData.original_metrics}
                optimizedMetrics={optimizationData.optimized_metrics}
                improvements={optimizationData.improvements}
                originalExecutionTimeMs={originalExecutionTimeMs}
              />

              {/* Gate-by-Gate Diff List */}
              <div className="studio-section">
                <div className="section-title-strip">
                  <span className="section-label">Circuit Comparison & Transformation Diff</span>
                </div>
                <CircuitComparison
                  originalCircuit={optimizationData.original_circuit}
                  optimizedCircuit={optimizationData.optimized_circuit}
                  passesApplied={optimizationData.optimization_passes_applied}
                />
              </div>

              {/* Educational Explanations */}
              {optimizationData.explanation && optimizationData.explanation.length > 0 && (
                <div className="studio-section explanations-section" data-testid="optimization-explanations">
                  <div className="section-title-strip">
                    <HelpCircle size={13} />
                    <span className="section-label">Optimization Insights & Applied Rules</span>
                  </div>
                  <ul className="explanation-list">
                    {optimizationData.explanation.map((item, idx) => (
                      <li key={idx} className="explanation-item">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* NVIDIA AI Quantum Architect Analysis */}
              {aiInsights && (
                <div className="studio-section nvidia-ai-section" data-testid="nvidia-ai-optimization-insights">
                  <div className="section-title-strip nvidia-strip">
                    <Cpu size={13} color="#76b900" />
                    <span className="section-label">
                      {optimizationData.changed
                        ? 'NVIDIA AI Quantum Architect Analysis (Optimization Gains)'
                        : 'NVIDIA AI Quantum Architect Analysis (Optimal Circuit Verification)'}
                    </span>
                    <span className="nvidia-tag">Nemotron-3 120B</span>
                  </div>
                  <div className="nvidia-ai-content">
                    {aiInsights.architectural_summary && (
                      <p className="nvidia-ai-summary">{aiInsights.architectural_summary}</p>
                    )}
                    {aiInsights.hardware_fidelity_impact && (
                      <div className="nvidia-ai-fidelity">
                        <ShieldCheck size={13} color="#76b900" />
                        <span>{aiInsights.hardware_fidelity_impact}</span>
                      </div>
                    )}
                    {Array.isArray(aiInsights.key_takeaways) && aiInsights.key_takeaways.length > 0 && (
                      <ul className="nvidia-takeaways-list">
                        {aiInsights.key_takeaways.map((takeaway, tIdx) => (
                          <li key={tIdx} className="nvidia-takeaway-item">
                            {takeaway}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Studio Action Footer */}
        <div className="studio-footer">
          <div className="footer-meta">
            {optimizationData && (
              <span className="opt-timing" data-testid="opt-execution-time">
                <Clock size={11} /> Verification completed in {optimizationData.execution_time_ms} ms
              </span>
            )}
          </div>
          <div className="footer-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              data-testid="btn-reject-optimization"
            >
              {optimizationData?.changed ? 'Keep Original' : 'Close'}
            </button>
            {isLoading ? (
              <button
                type="button"
                className="btn-primary apply-btn loading-btn"
                disabled={true}
                data-testid="btn-apply-optimization"
                style={{ opacity: 0.7, cursor: 'wait' }}
              >
                <RotateCw size={14} className="studio-spinner" />
                <span>Optimizing Circuit...</span>
              </button>
            ) : error ? (
              <button
                type="button"
                className="btn-primary apply-btn error-btn"
                disabled={true}
                data-testid="btn-apply-optimization"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                <AlertTriangle size={14} />
                <span>Optimization Unavailable</span>
              </button>
            ) : optimizationData?.changed ? (
              <button
                type="button"
                className="btn-primary apply-btn"
                disabled={!canApply}
                onClick={() => {
                  if (optimizationData && isVerified) {
                    onApplyOptimization(optimizationData.optimized_circuit, optimizationData);
                    onClose();
                  }
                }}
                data-testid="btn-apply-optimization"
              >
                <Cpu size={14} />
                <span>Apply Optimization</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary apply-btn optimal"
                disabled={!isVerified}
                onClick={() => {
                  if (optimizationData && isVerified) {
                    onApplyOptimization(optimizationData.optimized_circuit, optimizationData);
                  }
                  onClose();
                }}
                title={
                  isVerified
                    ? 'Circuit is already in its verified minimal form. Click to confirm and return to editor.'
                    : 'Circuit is already in its verified minimal form.'
                }
                data-testid="btn-apply-optimization"
                style={{
                  opacity: isVerified ? 1 : 0.85,
                  cursor: isVerified ? 'pointer' : 'not-allowed',
                }}
              >
                <ShieldCheck size={14} />
                <span>Circuit Already Optimal</span>
              </button>
            )}
          </div>
        </div>
      </div>
  );

  if (inlineMode) {
    return <div data-testid="optimization-studio" style={{ height: '100%', overflow: 'auto' }}>{inner}</div>;
  }

  return (
    <div className="optimization-studio-backdrop" role="dialog" aria-modal="true" data-testid="optimization-studio">
      {inner}
    </div>
  );
};

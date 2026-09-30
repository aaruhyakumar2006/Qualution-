import React from 'react';
import type { CircuitRequest } from '../../features/circuit/types';
import { buildGateDiffList, type GateDiffItem } from '../../features/optimization/types';
import { MinusCircle, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import './CircuitComparison.css';

interface CircuitComparisonProps {
  originalCircuit: CircuitRequest;
  optimizedCircuit: CircuitRequest;
  passesApplied: string[];
}

export const CircuitComparison: React.FC<CircuitComparisonProps> = ({
  originalCircuit,
  optimizedCircuit,
  passesApplied,
}) => {
  const diffs: GateDiffItem[] = buildGateDiffList(originalCircuit, optimizedCircuit, passesApplied);

  const origCount = (originalCircuit?.gates || []).length;
  const optCount = (optimizedCircuit?.gates || []).length;

  const formatGateLabel = (gate?: { gate?: string; type?: string; targets?: number[]; angle?: number; params?: Record<string, number> }) => {
    if (!gate) return '-';
    const name = (gate.gate || gate.type || '').toUpperCase() || 'GATE';
    let label = name;
    if (gate.params && Object.keys(gate.params).length > 0) {
      const p = Object.entries(gate.params)
        .map(([k, v]) => `${k}=${v.toFixed(2)}`)
        .join(', ');
      label += `(${p})`;
    } else if (typeof gate.angle === 'number') {
      label += `(${gate.angle.toFixed(2)} rad)`;
    }
    const t = Array.isArray(gate.targets) ? gate.targets : [0];
    label += ` on q[${t.join(',')}]`;
    return label;
  };

  const isAllOptimal = diffs.length === 0 || diffs.every((d) => d.type === 'unchanged');

  return (
    <div className="circuit-comparison-container" data-testid="circuit-comparison">
      {isAllOptimal && (
        <div
          className="optimal-notice-bar"
          data-testid="circuit-optimal-notice"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <CheckCircle size={14} />
          <span>
            All {origCount} gates in this circuit are already optimal. No redundant operations or self-cancellations detected.
          </span>
        </div>
      )}

      <div className="comparison-columns-header">
        <div className="comp-col-header original">Original Circuit ({origCount} gates)</div>
        <div className="comp-col-header status">Transformation</div>
        <div className="comp-col-header optimized">Optimized Circuit ({optCount} gates)</div>
      </div>

      <div className="diff-list" data-testid="diff-list">
        {diffs.length === 0 ? (
          <div className="empty-diff">No structural gate differences. Circuit is already optimal.</div>
        ) : (
          diffs.map((item, idx) => (
            <div key={item.id || idx} className={`diff-row ${item.type}`} data-testid={`diff-row-${item.type}`}>
              {/* Left: Original Gate */}
              <div className="diff-cell orig">
                {item.originalGate ? (
                  <span className={`gate-pill orig ${item.type === 'removed' ? 'struck' : ''}`}>
                    {formatGateLabel(item.originalGate)}
                  </span>
                ) : (
                  <span className="empty-slot">—</span>
                )}
              </div>

              {/* Middle: Action Badge */}
              <div className="diff-cell transform">
                {item.type === 'unchanged' && (
                  <span className="badge-transform unchanged" title="Preserved without change">
                    <CheckCircle size={11} /> Unchanged
                  </span>
                )}
                {item.type === 'removed' && (
                  <span className="badge-transform removed" title="Removed redundant gate">
                    <MinusCircle size={11} /> Cancelled
                  </span>
                )}
                {item.type === 'combined' && (
                  <span className="badge-transform combined" title="Combined rotations">
                    <RefreshCw size={11} /> Merged
                  </span>
                )}
                {item.type === 'modified' && (
                  <span className="badge-transform modified" title="Synthesized gate replacement">
                    <ArrowRight size={11} /> Rewritten
                  </span>
                )}
                {item.type === 'added' && (
                  <span className="badge-transform added" title="Added gate">
                    + Added
                  </span>
                )}
              </div>

              {/* Right: Optimized Gate */}
              <div className="diff-cell opt">
                {item.optimizedGate ? (
                  <span className="gate-pill opt">
                    {formatGateLabel(item.optimizedGate)}
                  </span>
                ) : (
                  <span className="empty-slot removed-label">Gate Removed</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

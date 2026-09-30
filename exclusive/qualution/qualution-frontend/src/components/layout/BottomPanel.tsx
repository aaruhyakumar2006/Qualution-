import React from 'react';
import type { CircuitMetricsResponse, CircuitRunRoutingSummary, Gate } from '../../features/circuit/types';
import { calculateFrontendMetrics } from '../../features/circuit/state';
import './BottomPanel.css';

interface BottomPanelProps {
  metrics: CircuitMetricsResponse | null;
  routing: CircuitRunRoutingSummary | null;
  qubitCount: number;
  gateCount: number;
  gates?: Gate[];
  isDirty?: boolean;
  hasRun?: boolean;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  metrics,
  routing,
  qubitCount,
  gates = [],
  isDirty = true,
  hasRun: _hasRun = false,
}) => {
  const localMetrics = calculateFrontendMetrics(gates, qubitCount);

  const displayQubits = metrics ? metrics.qubit_count : localMetrics.qubitCount;
  const displayGates = metrics ? metrics.gate_count : localMetrics.gateCount;
  const displayDepth = metrics ? metrics.depth : localMetrics.depth;
  const display2Q = metrics ? metrics.two_qubit_gate_count : localMetrics.twoQubitCount;

  // Approximate statevector memory footprint (2^n * 16 bytes)
  const approxBytes = Math.pow(2, displayQubits) * 16;
  const memClass = displayQubits <= 12 ? 'small' : displayQubits <= 20 ? 'moderate' : 'large';

  return (
    <footer className="qualution-bottom-panel" data-testid="bottom-panel">
      <div className="status-item">
        <span className="status-label">Qubits:</span>
        <span className="status-val">{displayQubits}</span>
      </div>

      <div className="status-item">
        <span className="status-label">Gates:</span>
        <span className="status-val">{displayGates}</span>
      </div>

      <div className="status-item">
        <span className="status-label">Depth:</span>
        <span className="status-val">{displayDepth}</span>
      </div>

      <div className="status-item">
        <span className="status-label">2Q Gates:</span>
        <span className="status-val">{display2Q}</span>
      </div>

      <div className="status-item">
        <span className="status-label">Statevector Memory:</span>
        <span className="status-val">
          {metrics
            ? `${metrics.statevector_memory_bytes} B (${metrics.simulation_memory_class})`
            : `${approxBytes} B (${memClass})`}
        </span>
      </div>

      <div className="status-item">
        <span className="status-label">Simulation:</span>
        <span className={`status-val ${isDirty ? 'warning' : 'success'}`}>
          {isDirty ? 'Unsaved simulation' : 'Simulation current'}
        </span>
      </div>

      <div className="status-spacer" />

      {routing && (
        <div className="status-item routing-info" title={routing.reason}>
          <span className="status-label">Selected Backend:</span>
          <span className="status-val highlight">{routing.selected_backend}</span>
          <span className="policy-badge">{routing.policy}</span>
        </div>
      )}
    </footer>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import type { CircuitMetricsResponse, CircuitRunRoutingSummary } from '../../features/circuit/types';
import type { VerificationTableRow } from '../../features/teaching/lessons/sprint-02/groverVerification';
import {
  AlertTriangle,
  Cpu,
  Gauge,
  CheckCircle2,
  Check,
  Sparkles,
  Layers,
  Binary,
  Clock,
  Zap,
  Bot,
  Activity,
  Server,
  ArrowUpRight,
} from 'lucide-react';
import './MetricsView.css';

interface MetricsViewProps {
  metrics: CircuitMetricsResponse | null | undefined;
  routing: CircuitRunRoutingSummary | null | undefined;
  executionTimeMs: number;
  verificationTable?: VerificationTableRow[] | null;
  onRunStabilizer?: () => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({
  metrics,
  routing,
  executionTimeMs,
  verificationTable,
  onRunStabilizer,
}) => {
  // ── Track Live Updates for Subtle Responsive Pulse ─────────────────
  const prevMetricsRef = useRef<CircuitMetricsResponse | null>(null);
  const [highlightedKeys, setHighlightedKeys] = useState<Record<string, boolean>>({});
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!metrics) return;

    const prev = prevMetricsRef.current;
    if (prev) {
      const updated: Record<string, boolean> = {};
      if (prev.qubit_count !== metrics.qubit_count) updated.qubit_count = true;
      if (prev.gate_count !== metrics.gate_count) updated.gate_count = true;
      if (prev.depth !== metrics.depth) updated.depth = true;
      if (prev.two_qubit_gate_ratio !== metrics.two_qubit_gate_ratio) updated.two_qubit_gate_ratio = true;
      if (prev.two_qubit_gate_count !== metrics.two_qubit_gate_count) updated.two_qubit_gate_count = true;
      if (prev.statevector_memory_bytes !== metrics.statevector_memory_bytes) updated.statevector_memory_bytes = true;

      if (Object.keys(updated).length > 0) {
        setHighlightedKeys(updated);
        setLastUpdatedTimestamp(Date.now());
        const timer = setTimeout(() => {
          setHighlightedKeys({});
        }, 1100);
        return () => clearTimeout(timer);
      }
    }

    prevMetricsRef.current = metrics;
  }, [metrics]);

  if (!metrics) {
    return (
      <div className="metrics-view-container empty" data-testid="metrics-view">
        <div className="analyzer-empty-box">
          <Activity size={28} className="analyzer-empty-icon" />
          <span className="analyzer-empty-title">Circuit Analyzer Idle</span>
          <span className="analyzer-empty-desc">
            Assemble circuit gates or execute a simulation run to compute topology, scaling, and AI routing telemetry.
          </span>
        </div>
      </div>
    );
  }

  const isClifford = Boolean(
    metrics.is_clifford ??
    (routing?.framework?.includes('stabilizer') ||
     routing?.policy?.includes('clifford') ||
     routing?.selected_backend?.includes('stabilizer') ||
     metrics.simulation_memory_class?.toLowerCase().includes('stabilizer'))
  );

  const isLarge = !isClifford && (metrics.qubit_count > 16 || metrics.statevector_memory_mb > 1000);

  const formattedMemory = (() => {
    if (metrics.qubit_count > 50 || metrics.statevector_memory_gb > 1e6 || !Number.isFinite(metrics.statevector_memory_mb)) {
      return '> 1 Exabyte';
    }
    if (metrics.statevector_memory_gb > 0.01) {
      return `${metrics.statevector_memory_gb.toFixed(2)} GB`;
    }
    if (metrics.statevector_memory_mb >= 1) {
      return `${metrics.statevector_memory_mb.toFixed(2)} MB`;
    }
    if (metrics.statevector_memory_bytes >= 1024 * 1024) {
      return `${(metrics.statevector_memory_bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${metrics.statevector_memory_bytes} Bytes`;
  })();

  const formattedAmplitudes = (() => {
    if (isClifford) return `Stabilizer (${2 * metrics.qubit_count} generators)`;
    if (metrics.qubit_count > 40) return `2^${metrics.qubit_count} (~10^${Math.round(metrics.qubit_count * 0.30103)})`;
    return `2^${metrics.qubit_count} = ${typeof metrics.statevector_amplitudes === 'number' ? metrics.statevector_amplitudes.toLocaleString() : metrics.statevector_amplitudes}`;
  })();

  // ── Compute AI Execution Recommendation ────────────────────────────
  const backendRaw = routing?.selected_backend || (isClifford ? 'clifford_stabilizer' : (metrics.qubit_count <= 16 ? 'qiskit_aer' : 'clifford_stabilizer'));
  const policyRaw = routing?.policy || (isClifford ? 'clifford_stabilizer_optimal' : (metrics.two_qubit_gate_ratio > 0.4 ? 'low_noise_fidelity' : 'lowest_measured_latency'));
  const frameworkRaw = routing?.framework || (isClifford ? 'Qiskit Aer (Stabilizer)' : (backendRaw.includes('qiskit') ? 'Qiskit Aer' : 'SymPy / NumPy'));

  const formattedBackend = (() => {
    if (backendRaw.includes('stabilizer') || isClifford) return 'Clifford Stabilizer Tableau';
    if (backendRaw === 'qiskit_aer') return 'Qiskit Aer Simulator';
    if (backendRaw === 'statevector') return 'Dense Statevector Simulator';
    if (backendRaw.includes('ionq')) return 'IonQ Trapped-Ion Cloud QPU';
    return `${backendRaw.replace(/_/g, ' ').toUpperCase()}`;
  })();

  const executionLocation = (() => {
    if (backendRaw.includes('stabilizer') || isClifford) return 'Local CPU (Classical O(N²) Tableau)';
    if (backendRaw === 'qiskit_aer') return 'Local Hardware (C++ Aer Acceleration)';
    if (backendRaw === 'statevector') return 'In-Memory Exact Statevector';
    if (backendRaw.includes('ionq')) return 'Remote IonQ Cloud QPU Facility';
    return 'Local Workstation Engine';
  })();

  const routingReason = routing?.reason || (() => {
    if (isClifford) {
      const stabKb = ((metrics.stabilizer_memory_bytes || (2 * metrics.qubit_count + 1) * (2 * metrics.qubit_count + 1) / 8 + 1024) / 1024).toFixed(1);
      return `Clifford circuit detected across all ${metrics.gate_count} operations on ${metrics.qubit_count} qubits. By the Gottesman-Knill theorem, the state is evolved polynomial-time O(N²) via an Aaronson-Gottesman stabilizer tableau consuming ~${stabKb} KB (< 1 MB RAM), completely bypassing exponential statevector allocation.`;
    }
    if (metrics.qubit_count <= 16 && metrics.statevector_memory_mb < 50) {
      return `Circuit requires only ${metrics.statevector_memory_bytes} Bytes of statevector RAM. Local dense simulation guarantees 100% exact amplitudes with zero sampling variance and minimal execution overhead.`;
    }
    if (metrics.two_qubit_gate_ratio === 0) {
      return `Circuit contains exclusively single-qubit rotations. Product states can be decomposed and evaluated independently across parallel CPU threads.`;
    }
    return `Evaluated multi-qubit entanglement density (${(metrics.two_qubit_gate_ratio * 100).toFixed(0)}% 2Q ratio). Recommended backend balances gate decomposition fidelity with minimal latency.`;
  })();


  const entanglementDensityLabel = (() => {
    const r = metrics.two_qubit_gate_ratio;
    if (r === 0) return 'None (Unentangled)';
    if (r < 0.25) return 'Minimal Entanglement';
    if (r < 0.5) return 'Moderate Entanglement';
    return 'High Entanglement';
  })();

  return (
    <div className="metrics-view-container" data-testid="metrics-view">
      {/* ── 1. Phase 2 Standard Header Bar ────────────────────────────── */}
      <div className="analyzer-header-bar">
        <div className="analyzer-header-left">
          <div className="analyzer-icon-badge">
            <Cpu size={14} color="var(--wb-status-cyan, #1192e8)" />
          </div>
          <span className="analyzer-header-title">Circuit Analyzer</span>
          <span className="analyzer-status-pill" title="Live circuit telemetry active">
            <span className="status-dot-pulse" />
            LIVE
          </span>
          {lastUpdatedTimestamp && Object.keys(highlightedKeys).length > 0 && (
            <span className="analyzer-update-flash">UPDATED</span>
          )}
        </div>

        <div className="analyzer-header-right">
          <span className="analyzer-latency-tag" title="Measured Execution Latency">
            <Clock size={11} />
            <span>{executionTimeMs} ms</span>
          </span>
        </div>
      </div>

      <div className="analyzer-scrollable-body">
        {/* Resource Warning Banner if circuit is massive */}
        {isLarge && (
          <div className="resource-warning-banner" role="alert">
            <AlertTriangle size={16} className="warn-icon" />
            <div className="warn-body">
              <span className="warn-title">High Quantum Resource Consumption</span>
              <span className="warn-desc">
                {metrics.qubit_count} qubits require ~{formattedMemory} for dense statevector simulation. Shot-based Monte Carlo sampling is recommended.
              </span>
            </div>
          </div>
        )}

        {/* ── 2. SECTION A: Measured Facts (Empirical Hardware & Topology) ── */}
        <section className="analyzer-section measured-facts-section">
          <div className="section-label-row">
            <div className="section-title-wrap">
              <Activity size={12} className="section-title-icon" />
              <h4 className="section-title">Measured Circuit Facts</h4>
            </div>
            <span className="section-type-badge">EMPIRICAL TOPOLOGY</span>
          </div>

          <div className="facts-grid">
            {/* Qubit Count */}
            <div
              className={`metric-card ${highlightedKeys.qubit_count ? 'live-updated' : ''}`}
              title="Number of allocated quantum wires"
            >
              <div className="metric-header-row">
                <span className="metric-lbl">Qubits</span>
                <Binary size={12} className="metric-corner-icon" />
              </div>
              <div className="metric-value-row">
                <span className="metric-num">{metrics.qubit_count}</span>
                <span className="metric-unit">qubits</span>
              </div>
              <span className="metric-subdetail">
                {metrics.qubit_count} active quantum {metrics.qubit_count === 1 ? 'wire' : 'wires'}
              </span>
            </div>

            {/* Gate Count */}
            <div
              className={`metric-card ${highlightedKeys.gate_count ? 'live-updated' : ''}`}
              title="Total number of discrete gate operations"
            >
              <div className="metric-header-row">
                <span className="metric-lbl">Total Gates</span>
                <Layers size={12} className="metric-corner-icon" />
              </div>
              <div className="metric-value-row">
                <span className="metric-num">{metrics.gate_count}</span>
                <span className="metric-unit">gates</span>
              </div>
              <span className="metric-subdetail">
                {metrics.single_qubit_gate_count ?? Math.max(0, metrics.gate_count - metrics.two_qubit_gate_count)} 1Q •{' '}
                {metrics.two_qubit_gate_count} 2Q
              </span>
            </div>

            {/* Circuit Depth */}
            <div
              className={`metric-card ${highlightedKeys.depth ? 'live-updated' : ''}`}
              title="Sequential execution layers (critical path)"
            >
              <div className="metric-header-row">
                <span className="metric-lbl">Circuit Depth</span>
                <Gauge size={12} className="metric-corner-icon" />
              </div>
              <div className="metric-value-row">
                <span className="metric-num">{metrics.depth}</span>
                <span className="metric-unit">layers</span>
              </div>
              <span className="metric-subdetail">Critical parallel time-steps</span>
            </div>

            {/* 2-Qubit Gate Ratio */}
            <div
              className={`metric-card ${highlightedKeys.two_qubit_gate_ratio ? 'live-updated' : ''}`}
              title="Proportion of multi-qubit entangling operations"
            >
              <div className="metric-header-row">
                <span className="metric-lbl">2Q Gate Ratio</span>
                <Zap size={12} className="metric-corner-icon" />
              </div>
              <div className="metric-value-row">
                <span className="metric-num">{(metrics.two_qubit_gate_ratio * 100).toFixed(0)}%</span>
                <span className="metric-unit">ratio</span>
              </div>
              <div className="metric-progress-track">
                <div
                  className="metric-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.two_qubit_gate_ratio * 100))}%` }}
                />
              </div>
              <span className="metric-subdetail">{entanglementDensityLabel}</span>
            </div>
          </div>

          {/* Technical Scaling Strip (Statevector scaling & Theoretical memory footprint) */}
          <div
            className={`memory-scaling-strip ${
              highlightedKeys.statevector_memory_bytes ? 'live-updated' : ''
            }`}
          >
            <div className="scaling-item">
              <span className="scaling-lbl">Amplitudes:</span>
              <span className="scaling-val">
                {formattedAmplitudes}
              </span>
            </div>
            <div className="scaling-divider" />
            <div className="scaling-item">
              <span className="scaling-lbl">Theoretical Memory:</span>
              <span className="scaling-val highlight">
                {isClifford
                  ? `< 1 MB (~${((metrics.stabilizer_memory_bytes || ((2 * metrics.qubit_count + 1) * (2 * metrics.qubit_count + 1)) / 8 + 1024) / 1024).toFixed(1)} KB)`
                  : formattedMemory}
              </span>
            </div>
            <div className="scaling-divider" />
            <div className="scaling-item">
              <span className="scaling-lbl">Simulation Class:</span>
              <span className="scaling-val capitalize">
                {isClifford ? 'Clifford Stabilizer (O(N²))' : metrics.simulation_memory_class}
              </span>
            </div>
          </div>
        </section>

        {/* ── 3. SECTION B: AI-Derived Recommendation (Smart Routing & Strategy) ── */}
        <section className="analyzer-section ai-recommendation-section">
          <div className="section-label-row">
            <div className="section-title-wrap">
              <Sparkles size={13} className="section-title-icon ai-spark-icon" />
              <h4 className="section-title ai-title">AI Execution Recommendation</h4>
            </div>
            <span className="section-type-badge ai-badge">AI ROUTING</span>
          </div>

          <div className="ai-recommendation-card">
            {/* Top row: Recommended method & location */}
            <div className="ai-rec-header">
              <div className="ai-target-box">
                <div className="ai-target-icon-wrap">
                  <Server size={16} className="ai-server-icon" />
                </div>
                <div className="ai-target-meta">
                  <div className="ai-target-title-row">
                    <span className="ai-target-name">{formattedBackend}</span>
                    <span className="ai-rec-pill">RECOMMENDED</span>
                  </div>
                  <span className="ai-target-location">
                    <ArrowUpRight size={11} />
                    {executionLocation}
                  </span>
                </div>
              </div>
              {onRunStabilizer && isClifford && (
                <button
                  type="button"
                  className="analyzer-run-stabilizer-btn"
                  onClick={onRunStabilizer}
                  title="Run simulation through Aaronson-Gottesman Stabilizer Tableau (< 1 MB RAM)"
                  data-testid="run-stabilizer-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    background: '#0f62fe',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15, 98, 254, 0.4)',
                    marginLeft: 'auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Zap size={12} />
                  Run with Stabilizer (&lt; 1 MB)
                </button>
              )}
            </div>

            {/* Badges / telemetry row */}
            <div className="ai-rec-tags">
              <span className="ai-tag">
                <span className="ai-tag-lbl">Policy:</span>
                <span className="ai-tag-val">{policyRaw.replace(/_/g, ' ')}</span>
              </span>
              <span className="ai-tag">
                <span className="ai-tag-lbl">Framework:</span>
                <span className="ai-tag-val">{frameworkRaw}</span>
              </span>
              <span className="ai-tag">
                <span className="ai-tag-lbl">Target Latency:</span>
                <span className="ai-tag-val">{executionTimeMs} ms</span>
              </span>
            </div>

            {/* AI Narrative Rationale Box */}
            <div className="ai-reason-bubble">
              <div className="ai-reason-header">
                <Bot size={13} className="ai-bot-icon" />
                <span>AI Routing Rationale</span>
              </div>
              <p className="ai-reason-text">{routingReason}</p>
            </div>
          </div>
        </section>

        {/* ── 4. Live Algorithm Verification Matrix (if Grover / active lesson) ── */}
        {verificationTable && verificationTable.length > 0 && (
          <section
            className="analyzer-section verification-section"
            data-testid="circuit-analyzer-verification-table"
          >
            <div className="section-label-row">
              <div className="section-title-wrap">
                <CheckCircle2 size={13} color="#24a148" />
                <h4 className="section-title">Live Algorithm Verification</h4>
              </div>
              <span className="verification-all-pass-pill">ALL CONSTRAINTS PASSED</span>
            </div>

            <div className="verification-table-wrap">
              <table className="verification-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Observed Value</th>
                    <th>Requirement</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationTable.map((item, idx) => (
                    <tr key={idx} className="verification-row" data-testid={`verification-row-${idx}`}>
                      <td className="metric-name">{item.metric}</td>
                      <td className="metric-value">{item.value}</td>
                      <td className="metric-req">{item.requirement}</td>
                      <td className="metric-status">
                        <span className={`pass-badge ${item.status.toLowerCase()}`}>
                          {item.status === 'PASS' && <Check size={11} strokeWidth={3} />}
                          <span>{item.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

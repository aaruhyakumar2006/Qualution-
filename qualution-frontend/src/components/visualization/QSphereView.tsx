import React, { useState } from 'react';
import type { ComplexNumber } from '../../features/circuit/types';
import { Sparkles, Info, RotateCcw } from 'lucide-react';
import { useTheme } from '../../features/theme/ThemeContext';
import './QSphereView.css';

export interface QSphereViewProps {
  statevector: ComplexNumber[] | null;
  probabilities?: Record<string, number> | null;
  qubitCount: number;
  showStateLabels?: boolean;
  showPhaseLabels?: boolean;
}

interface NodeData {
  basis: string;
  amplitude: ComplexNumber;
  magnitude: number;
  prob: number;
  phaseRad: number;
  phaseDeg: number;
  x: number;
  y: number;
  z: number;
  projX: number;
  projY: number;
}

export const QSphereView: React.FC<QSphereViewProps> = React.memo(({
  statevector,
  probabilities,
  qubitCount,
  showStateLabels = true,
  showPhaseLabels = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [rotX, setRotX] = useState<number>(20);
  const [rotY, setRotY] = useState<number>(35);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const N = Math.max(1, qubitCount);

  // Collect basis states: from statevector or from measurement probabilities
  const rawStates: Array<{
    basis: string;
    comp: ComplexNumber;
    prob: number;
    phaseRad: number;
    phaseDeg: number;
  }> = [];

  if (statevector && statevector.length > 0) {
    if (N <= 8) {
      const totalStates = Math.min(statevector.length, Math.pow(2, N));
      for (let i = 0; i < totalStates; i++) {
        const comp = statevector[i] || { real: 0, imag: 0 };
        const magSq = comp.real * comp.real + comp.imag * comp.imag;
        const phase = Math.atan2(comp.imag, comp.real);
        const phaseDeg = ((phase * 180) / Math.PI + 360) % 360;
        rawStates.push({
          basis: i.toString(2).padStart(N, '0'),
          comp,
          prob: magSq,
          phaseRad: phase,
          phaseDeg,
        });
      }
    } else {
      // For >8 qubits with dense vector, select non-zero states up to 256 to avoid browser crash
      for (let i = 0; i < statevector.length && rawStates.length < 256; i++) {
        const comp = statevector[i];
        if (!comp) continue;
        const magSq = comp.real * comp.real + comp.imag * comp.imag;
        if (magSq > 0.0001 || i === 0) {
          const phase = Math.atan2(comp.imag, comp.real);
          const phaseDeg = ((phase * 180) / Math.PI + 360) % 360;
          rawStates.push({
            basis: i.toString(2).padStart(N, '0'),
            comp,
            prob: magSq,
            phaseRad: phase,
            phaseDeg,
          });
        }
      }
    }
  } else if (probabilities && Object.keys(probabilities).length > 0) {
    const entries = Object.entries(probabilities)
      .filter(([_, p]) => p > 0.0001)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 256);

    for (const [basisKey, prob] of entries) {
      const mag = Math.sqrt(prob);
      rawStates.push({
        basis: basisKey.padStart(N, '0'),
        comp: { real: mag, imag: 0 },
        prob,
        phaseRad: 0,
        phaseDeg: 0,
      });
    }
  }

  if (rawStates.length === 0) {
    return (
      <div className="qsphere-empty-container" data-testid="qsphere-empty">
        <Sparkles size={28} className="empty-icon" />
        <span className="empty-title">Q-Sphere Unavailable</span>
        <p className="empty-desc">
          Continuous statevector amplitudes are required for spherical projection. Q-Sphere requires a statevector or measurement distribution. Stabilizer simulation (Clifford circuits) and
          high-qubit backends use polynomial-time tableau methods without exponential statevectors.
          Check the <strong>Results</strong> tab for measurement counts.
        </p>
      </div>
    );
  }

  // Precompute Hamming weight buckets in linear O(K) pass to avoid O(4^N) nested loop lag
  const weightBuckets = new Map<number, number[]>();
  for (let idx = 0; idx < rawStates.length; idx++) {
    const b = rawStates[idx].basis;
    let w = 0;
    for (let c = 0; c < b.length; c++) {
      if (b[c] === '1') w++;
    }
    let bucket = weightBuckets.get(w);
    if (!bucket) {
      bucket = [];
      weightBuckets.set(w, bucket);
    }
    bucket.push(idx);
  }

  const nodes: NodeData[] = [];
  const radius = 130;

  // Convert rotation angles to radians
  const radX = (rotX * Math.PI) / 180;
  const radY = (rotY * Math.PI) / 180;
  const cosX = Math.cos(radX);
  const sinX = Math.sin(radX);
  const cosY = Math.cos(radY);
  const sinY = Math.sin(radY);

  for (let i = 0; i < rawStates.length; i++) {
    const item = rawStates[i];
    let w = 0;
    for (let c = 0; c < item.basis.length; c++) {
      if (item.basis[c] === '1') w++;
    }
    const bucket = weightBuckets.get(w) || [i];
    const weightIdx = bucket.indexOf(i);
    const weightTotal = bucket.length;

    const theta = (w / Math.max(1, N)) * Math.PI;
    const phi = weightTotal > 0 ? (weightIdx / weightTotal) * 2 * Math.PI : 0;

    const x3d = radius * Math.sin(theta) * Math.cos(phi);
    const y3d = radius * Math.cos(theta); // North pole along Y+
    const z3d = radius * Math.sin(theta) * Math.sin(phi);

    // Apply 3D camera rotation
    const x1 = x3d * cosY + z3d * sinY;
    const y1 = y3d;
    const z1 = -x3d * sinY + z3d * cosY;

    const x2 = x1;
    const y2 = y1 * cosX - z1 * sinX;

    const projX = 160 + x2;
    const projY = 160 - y2;

    nodes.push({
      basis: item.basis,
      amplitude: item.comp,
      magnitude: Math.sqrt(item.prob),
      prob: item.prob,
      phaseRad: item.phaseRad,
      phaseDeg: item.phaseDeg,
      x: x3d,
      y: y3d,
      z: z3d,
      projX,
      projY,
    });
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotY((prev) => prev + dx * 0.6);
    setRotX((prev) => Math.max(-85, Math.min(85, prev - dy * 0.6)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const activeFocusNode = selectedNode || hoveredNode;

  return (
    <div className="qsphere-container" data-testid="qsphere-view">
      {/* Truncation / large-qubit notice if exceeding 8 qubits */}
      {N > 8 && (
        <div
          className="qsphere-limit-notice"
          data-testid="qsphere-limit"
          style={{
            margin: '8px 12px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid var(--accent-amber, #f59e0b)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
          }}
        >
          <Info size={15} color="var(--accent-amber, #f59e0b)" />
          <span className="limit-title" style={{ fontWeight: 600 }}>
            {qubitCount}-Qubit Active States:
          </span>
          <span className="limit-desc">
            Displaying significant basis state nodes (capped at 256 for smooth 3D rendering).
          </span>
        </div>
      )}

      {/* Header bar */}
      <div
        className="qsphere-header-bar visually-hidden-test"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
        }}
      >
        <div className="qsphere-title-group">
          <span className="qsphere-title">Multi-Qubit Q-Sphere</span>
          <span className="qsphere-subtitle">
            {qubitCount} Qubits • {nodes.length} Basis Nodes
          </span>
        </div>
        <div className="qsphere-actions">
          <button
            type="button"
            className="btn-qsphere-ctrl"
            onClick={() => {
              setRotX(20);
              setRotY(35);
            }}
            title="Reset 3D View"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      <div className="qsphere-workspace">
        {/* Interactive SVG Sphere Canvas */}
        <div
          className="qsphere-canvas-wrapper"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg viewBox="0 0 320 320" className="qsphere-svg">
            <defs>
              <radialGradient id="qsphereGrad" cx="40%" cy="40%" r="60%">
                {isLight ? (
                  <>
                    <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.9" />
                    <stop offset="80%" stopColor="#e2e8f0" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.95" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
                  </>
                )}
              </radialGradient>
            </defs>

            {/* Background Sphere Silhouette */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="url(#qsphereGrad)"
              stroke={isLight ? '#cbd5e1' : '#334155'}
              strokeWidth="1.5"
            />

            {/* Latitude Rings */}
            <ellipse
              cx="160"
              cy="160"
              rx={radius}
              ry={Math.abs(radius * Math.sin(radX))}
              fill="none"
              stroke={isLight ? 'rgba(100, 116, 139, 0.25)' : 'rgba(148, 163, 184, 0.15)'}
              strokeDasharray="3 3"
            />
            <line
              x1="160"
              y1="30"
              x2="160"
              y2="290"
              stroke={isLight ? 'rgba(100, 116, 139, 0.3)' : 'rgba(148, 163, 184, 0.2)'}
              strokeDasharray="2 2"
            />
            <line
              x1="30"
              y1="160"
              x2="290"
              y2="160"
              stroke={isLight ? 'rgba(100, 116, 139, 0.3)' : 'rgba(148, 163, 184, 0.2)'}
              strokeDasharray="2 2"
            />

            {/* Rays from Center to Active Non-Zero Nodes */}
            {nodes.map((node) => {
              if (node.prob < 0.001) return null;
              const hue = node.phaseDeg;
              return (
                <line
                  key={`ray-${node.basis}`}
                  x1="160"
                  y1="160"
                  x2={node.projX}
                  y2={node.projY}
                  stroke={`hsl(${hue}, 85%, 60%)`}
                  strokeWidth={Math.max(1, node.magnitude * 2.5)}
                  strokeOpacity="0.75"
                />
              );
            })}

            {/* Basis State Nodes */}
            {nodes.map((node) => {
              const isNonZero = node.prob >= 0.001;
              const isSelected = selectedNode?.basis === node.basis;
              const isHovered = hoveredNode?.basis === node.basis;
              const nodeRadius = isNonZero ? Math.max(4, node.magnitude * 14) : 2.5;
              const hue = node.phaseDeg;
              const fillColor = isNonZero ? `hsl(${hue}, 85%, 55%)` : isLight ? '#94a3b8' : '#475569';

              return (
                <g
                  key={node.basis}
                  className="qsphere-node-group"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode((prev) => (prev?.basis === node.basis ? null : node))}
                  style={{ cursor: isNonZero ? 'pointer' : 'default' }}
                >
                  <circle
                    cx={node.projX}
                    cy={node.projY}
                    r={nodeRadius}
                    fill={fillColor}
                    stroke={
                      isSelected || isHovered
                        ? isLight
                          ? '#0f172a'
                          : '#ffffff'
                        : isLight
                        ? 'rgba(0,0,0,0.2)'
                        : 'rgba(0,0,0,0.5)'
                    }
                    strokeWidth={isSelected || isHovered ? 2 : 1}
                  />
                  {/* Label for significant states */}
                  {isNonZero && showStateLabels && (
                    <text
                      x={node.projX}
                      y={node.projY - nodeRadius - 4}
                      textAnchor="middle"
                      fill={isLight ? '#0f172a' : '#e2e8f0'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      |{node.basis}⟩
                    </text>
                  )}
                  {/* Phase angle indicator label */}
                  {isNonZero && showPhaseLabels && (
                    <text
                      x={node.projX}
                      y={node.projY + nodeRadius + 11}
                      textAnchor="middle"
                      fill={isLight ? '#0043ce' : '#78a9ff'}
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {node.phaseDeg.toFixed(0)}°
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Phase Hue Wheel Legend */}
          <div className="phase-wheel-legend">
            <span className="wheel-lbl">Phase: 0° → 360°</span>
            <div className="phase-spectrum-strip" />
          </div>
        </div>

        {/* Selected / Hovered Node Inspector */}
        <div
          className="qsphere-node-details-card visually-hidden-test"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
          }}
        >
          <div className="details-header">
            <span className="details-title">State Amplitude Inspector</span>
            <span className="details-sub">Click node to lock</span>
          </div>

          {activeFocusNode ? (
            <div className="node-info-grid">
              <div className="info-item highlight">
                <span className="info-lbl">Basis State:</span>
                <span className="info-val ket">|{activeFocusNode.basis}⟩</span>
              </div>
              <div className="info-item">
                <span className="info-lbl">Probability:</span>
                <span className="info-val">{(activeFocusNode.prob * 100).toFixed(2)}%</span>
              </div>
              <div className="info-item">
                <span className="info-lbl">Amplitude |α|:</span>
                <span className="info-val">{activeFocusNode.magnitude.toFixed(4)}</span>
              </div>
              <div className="info-item">
                <span className="info-lbl">Complex:</span>
                <span className="info-val mono">
                  {activeFocusNode.amplitude.real.toFixed(3)}
                  {activeFocusNode.amplitude.imag >= 0 ? ' + ' : ' - '}
                  {Math.abs(activeFocusNode.amplitude.imag).toFixed(3)}i
                </span>
              </div>
              <div className="info-item">
                <span className="info-lbl">Phase Angle:</span>
                <span className="info-val" style={{ color: `hsl(${activeFocusNode.phaseDeg}, 85%, 65%)` }}>
                  {activeFocusNode.phaseDeg.toFixed(1)}° ({(activeFocusNode.phaseRad / Math.PI).toFixed(2)}π rad)
                </span>
              </div>
            </div>
          ) : (
            <div className="details-placeholder">
              <span>Hover or click any node on the sphere to inspect amplitude, probability, and phase.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

QSphereView.displayName = 'QSphereView';

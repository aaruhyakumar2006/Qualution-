import React, { useState } from 'react';
import type { Gate, CircuitRequest } from '../../features/circuit/types';
import { GATE_KNOWLEDGE_CATALOG } from '../../features/learning/gateKnowledge';
import { GATE_PALETTE_ITEMS } from '../../features/circuit/state';
import { Trash2, Copy, Info, ChevronDown, ChevronUp } from 'lucide-react';
import './GateInspector.css';

interface GateInspectorProps {
  gate: Gate | null;
  circuit: CircuitRequest;
  onUpdateCircuit: (updated: CircuitRequest) => void;
  onDeselectGate: () => void;
}

// Find palette item for a gate ID
function findPaletteItem(gateId: string) {
  for (const group of GATE_PALETTE_ITEMS) {
    const found = group.gates.find((g) => g.id === gateId.toLowerCase());
    if (found) return found;
  }
  return null;
}

export const GateInspector: React.FC<GateInspectorProps> = ({
  gate,
  circuit,
  onUpdateCircuit,
  onDeselectGate,
}) => {
  const [showMatrix, setShowMatrix] = useState(false);

  if (!gate) {
    const totalDepth = circuit.gates.reduce((max, g) => Math.max(max, (g.column ?? 0) + 1), 0);
    return (
      <div className="gate-inspector gate-inspector-empty" data-testid="gate-inspector-empty">
        <div className="gi-header">
          <div className="gi-title-group">
            <span className="gi-gate-name">Circuit Inspector</span>
            <span className="gi-gate-id">OVERVIEW</span>
          </div>
        </div>

        <div className="gi-section">
          <span className="gi-section-label">Circuit Specifications</span>
          <div className="gi-circuit-metrics-grid">
            <div className="gi-metric-box">
              <span className="gi-metric-label">Qubits</span>
              <span className="gi-metric-value">{circuit.qubits}</span>
            </div>
            <div className="gi-metric-box">
              <span className="gi-metric-label">Gates</span>
              <span className="gi-metric-value">{circuit.gates.length}</span>
            </div>
            <div className="gi-metric-box">
              <span className="gi-metric-label">Depth</span>
              <span className="gi-metric-value">{totalDepth}</span>
            </div>
            <div className="gi-metric-box">
              <span className="gi-metric-label">Shots</span>
              <span className="gi-metric-value">{circuit.shots}</span>
            </div>
          </div>
        </div>

        <div className="gi-section">
          <span className="gi-section-label">Hint</span>
          <p className="gi-empty-desc" style={{ padding: '0', textAlign: 'left' }}>
            Click any gate on the canvas to inspect its unitary matrix, rotation angles, targets, and physical Bloch effect.
          </p>
        </div>
      </div>
    );
  }

  const knowledge = GATE_KNOWLEDGE_CATALOG[gate.gate.toLowerCase()];
  const paletteItem = findPaletteItem(gate.gate);
  const gateColor = paletteItem?.color ?? 'var(--accent-indigo)';
  const gateName = knowledge?.name ?? paletteItem?.label ?? gate.gate.toUpperCase();

  const handleDelete = () => {
    onUpdateCircuit({
      ...circuit,
      gates: circuit.gates.filter((g) => g.id !== gate.id),
    });
    onDeselectGate();
  };

  const handleDuplicate = () => {
    const dupGate: Gate = {
      ...gate,
      id: `gate-${Date.now()}-dup`,
      column: (gate.column ?? 0) + 1,
    };
    onUpdateCircuit({
      ...circuit,
      gates: [...circuit.gates, dupGate],
    });
  };

  const handleAngleChange = (value: string) => {
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return;
    onUpdateCircuit({
      ...circuit,
      gates: circuit.gates.map((g) =>
        g.id === gate.id ? { ...g, angle: numVal } : g
      ),
    });
  };

  return (
    <div className="gate-inspector" data-testid="gate-inspector">
      {/* Gate Header */}
      <div className="gi-header">
        <div className="gi-symbol" style={{ background: gateColor }}>
          {gate.gate.toUpperCase().substring(0, 3)}
        </div>
        <div className="gi-title-group">
          <span className="gi-gate-name">{gateName}</span>
          <span className="gi-gate-id">{gate.gate.toUpperCase()}</span>
        </div>
      </div>

      {/* Target Qubits */}
      <div className="gi-section">
        <span className="gi-section-label">Target Qubits</span>
        <div className="gi-qubit-list">
          {gate.targets.map((q) => (
            <span key={q} className="gi-qubit-chip">q[{q}]</span>
          ))}
        </div>
      </div>

      {/* Rotation Angle (if applicable) */}
      {paletteItem?.hasAngle && (
        <div className="gi-section">
          <span className="gi-section-label">Rotation Angle</span>
          <div className="gi-angle-row">
            <input
              type="number"
              className="gi-angle-input"
              value={gate.angle !== undefined ? gate.angle : 0}
              step={0.01}
              onChange={(e) => handleAngleChange(e.target.value)}
              aria-label="Gate rotation angle"
              data-testid="gate-angle-input"
            />
            <span className="gi-angle-unit">rad</span>
            <span className="gi-angle-equiv">
              ≈ {((gate.angle ?? 0) / Math.PI).toFixed(3)}π
            </span>
          </div>
        </div>
      )}

      {/* Column Position */}
      <div className="gi-section">
        <span className="gi-section-label">Circuit Column</span>
        <span className="gi-value">{gate.column ?? '—'}</span>
      </div>

      {/* Gate Knowledge */}
      {knowledge && (
        <>
          <div className="gi-section">
            <span className="gi-section-label">Overview</span>
            <p className="gi-desc">{knowledge.beginnerDescription}</p>
          </div>

          <div className="gi-section">
            <span className="gi-section-label">Bloch Effect</span>
            <p className="gi-desc">{knowledge.blochEffect}</p>
          </div>

          {/* Matrix (collapsible) */}
          {knowledge.matrix && (
            <div className="gi-section">
              <button
                type="button"
                className="gi-matrix-toggle"
                onClick={() => setShowMatrix((v) => !v)}
              >
                <Info size={11} />
                <span>Unitary Matrix</span>
                {showMatrix ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
              {showMatrix && (
                <pre className="gi-matrix">{knowledge.matrix.join('\n')}</pre>
              )}
            </div>
          )}

          {/* Common Uses */}
          <div className="gi-section">
            <span className="gi-section-label">Common Uses</span>
            <div className="gi-uses">
              {knowledge.commonUses.slice(0, 3).map((u, i) => (
                <span key={i} className="gi-use-chip">{u}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="gi-actions">
        <button
          type="button"
          className="gi-action-btn gi-action-dupe"
          onClick={handleDuplicate}
          title="Duplicate gate to next column"
          data-testid="gate-duplicate-btn"
        >
          <Copy size={13} />
          <span>Duplicate</span>
        </button>
        <button
          type="button"
          className="gi-action-btn gi-action-delete"
          onClick={handleDelete}
          title="Delete gate (Delete / Backspace)"
          data-testid="gate-delete-inspector-btn"
        >
          <Trash2 size={13} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

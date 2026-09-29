import React, { useState, useEffect } from 'react';
import { IBM_OPERATIONS_PALETTE } from '../../features/circuit/state';
import './GateConfigModal.css';

interface GateConfigModalProps {
  gateName: string;
  droppedOnQubit: number;
  totalQubits: number;
  isOpen: boolean;
  onConfirm: (config: { targets: number[]; angle?: number }) => void;
  onCancel: () => void;
}

export const GateConfigModal: React.FC<GateConfigModalProps> = ({
  gateName,
  droppedOnQubit,
  totalQubits,
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const gateInfo = IBM_OPERATIONS_PALETTE.find((g) => g.id === gateName.toLowerCase());

  const [angle, setAngle] = useState<number>(Math.PI / 2);
  const [selectedTargets, setSelectedTargets] = useState<number[]>([]);
  // For MCX specifically:
  const [mcxControls, setMcxControls] = useState<number[]>([]);
  const [mcxTarget, setMcxTarget] = useState<number>(
    droppedOnQubit === 0 ? (totalQubits > 1 ? 1 : 0) : 0
  );

  useEffect(() => {
    if (isOpen) {
      setAngle(Math.PI / 2);
      if (gateInfo?.id === 'ccx') {
        const available = Array.from({ length: totalQubits }, (_, i) => i).filter((q) => q !== droppedOnQubit);
        setSelectedTargets([available[0] ?? 0, available[1] ?? 1]);
      } else if (gateInfo?.qubits === 2) {
        const available = Array.from({ length: totalQubits }, (_, i) => i).filter((q) => q !== droppedOnQubit);
        setSelectedTargets([available[0] ?? 0]);
      } else {
        setSelectedTargets([]);
      }
      setMcxControls([droppedOnQubit]);
    }
  }, [isOpen, gateInfo, droppedOnQubit, totalQubits]);

  if (!isOpen || !gateInfo) return null;

  const handleConfirm = () => {
    if (gateInfo.id === 'mcx') {
      onConfirm({
        targets: [...mcxControls, mcxTarget],
        ...(gateInfo.hasAngle ? { angle } : {}),
      });
      return;
    }

    onConfirm({
      targets: [droppedOnQubit, ...selectedTargets],
      ...(gateInfo.hasAngle ? { angle } : {}),
    });
  };

  const renderAngleInput = () => {
    if (!gateInfo.hasAngle) return null;
    return (
      <div className="gate-config-section">
        <label className="gate-config-label">Rotation Angle (radians)</label>
        <div className="angle-input-group">
          <input
            type="number"
            step="0.01"
            value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value))}
            className="angle-input"
          />
          <div className="angle-presets">
            <button type="button" onClick={() => setAngle(Math.PI / 4)}>π/4</button>
            <button type="button" onClick={() => setAngle(Math.PI / 2)}>π/2</button>
            <button type="button" onClick={() => setAngle(Math.PI)}>π</button>
          </div>
        </div>
      </div>
    );
  };

  const renderTargetSelectors = () => {
    if (gateInfo.id === 'mcx') {
      return (
        <div className="gate-config-section">
          <label className="gate-config-label">Select Controls (multi)</label>
          <div className="qubit-options-grid">
            {Array.from({ length: totalQubits }, (_, i) => i).map((q) => {
              if (q === mcxTarget) return null;
              const isSelected = mcxControls.includes(q);
              return (
                <button
                  key={`control-${q}`}
                  type="button"
                  className={`qubit-option-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    if (isSelected) setMcxControls(mcxControls.filter(c => c !== q));
                    else setMcxControls([...mcxControls, q]);
                  }}
                >
                  q[{q}]
                </button>
              );
            })}
          </div>
          <label className="gate-config-label" style={{marginTop: '1rem'}}>Select Target</label>
          <div className="qubit-options-grid">
            {Array.from({ length: totalQubits }, (_, i) => i).map((q) => {
              if (mcxControls.includes(q)) return null;
              return (
                <button
                  key={`target-${q}`}
                  type="button"
                  className={`qubit-option-btn ${mcxTarget === q ? 'active-target' : ''}`}
                  onClick={() => setMcxTarget(q)}
                >
                  q[{q}]
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (gateInfo.qubits <= 1) return null;

    const extraNeeded = gateInfo.qubits - 1;
    const available = Array.from({ length: totalQubits }, (_, i) => i).filter((q) => q !== droppedOnQubit);

    return (
      <div className="gate-config-section">
        {Array.from({ length: extraNeeded }).map((_, idx) => (
          <div key={`extra-${idx}`} style={{marginBottom: '1rem'}}>
            <label className="gate-config-label">
              Select {gateInfo.id === 'ccx' && idx === 0 ? 'Control 2' : 'Target'} Qubit:
            </label>
            <div className="qubit-options-grid">
              {available.map((q) => {
                // Don't allow picking the same qubit for multiple extra targets
                const isPickedByOther = selectedTargets.some((st, stIdx) => st === q && stIdx !== idx);
                if (isPickedByOther) return null;
                const isSelected = selectedTargets[idx] === q;
                return (
                  <button
                    key={`q-${q}`}
                    type="button"
                    className={`qubit-option-btn ${isSelected ? 'active-target' : ''}`}
                    onClick={() => {
                      const newTargets = [...selectedTargets];
                      newTargets[idx] = q;
                      setSelectedTargets(newTargets);
                    }}
                  >
                    q[{q}]
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="gate-config-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Configure {gateInfo.label || gateInfo.name.toUpperCase()}</span>
          <span className="modal-badge">Base: q[{droppedOnQubit}]</span>
        </div>

        <div className="modal-body">
          {renderAngleInput()}
          {renderTargetSelectors()}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-modal btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal btn-confirm"
            onClick={handleConfirm}
            disabled={gateInfo.id === 'mcx' && mcxControls.length === 0}
          >
            Place Gate
          </button>
        </div>
      </div>
    </div>
  );
};

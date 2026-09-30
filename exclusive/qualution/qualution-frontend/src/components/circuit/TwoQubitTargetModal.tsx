import React, { useState } from 'react';
import './TwoQubitTargetModal.css';

interface TwoQubitTargetModalProps {
  gateName: string;
  controlQubit: number;
  totalQubits: number;
  isOpen: boolean;
  onConfirm: (targetQubit: number) => void;
  onCancel: () => void;
}

export const TwoQubitTargetModal: React.FC<TwoQubitTargetModalProps> = ({
  gateName,
  controlQubit,
  totalQubits,
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const candidateQubits = Array.from({ length: totalQubits }, (_, i) => i).filter(
    (q) => q !== controlQubit
  );

  const [selectedTarget, setSelectedTarget] = useState<number>(
    candidateQubits[0] ?? (controlQubit === 0 ? 1 : 0)
  );

  if (!isOpen) return null;

  const isCX = gateName.toLowerCase() === 'cx';

  return (
    <div className="modal-backdrop" onClick={onCancel} data-testid="twoqubit-modal-backdrop">
      <div className="twoqubit-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {gateName.toUpperCase()} {isCX ? 'Target Selection' : 'Second Qubit'}
          </span>
          <span className="modal-badge">
            {isCX ? `Control: q[${controlQubit}]` : `Qubit 1: q[${controlQubit}]`}
          </span>
        </div>

        <div className="modal-body">
          <span className="selection-prompt">
            {isCX
              ? `Select target qubit for controlled operation:`
              : `Select paired qubit for ${gateName.toUpperCase()}:`}
          </span>

          <div className="qubit-options-grid">
            {candidateQubits.map((q) => (
              <button
                key={q}
                type="button"
                className={`qubit-option-btn ${selectedTarget === q ? 'active' : ''}`}
                onClick={() => setSelectedTarget(q)}
                data-testid={`target-qubit-option-${q}`}
              >
                <span className="qubit-btn-label">q[{q}]</span>
                <span className="qubit-btn-role">{isCX ? 'Target' : 'Paired'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-modal btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal btn-confirm"
            onClick={() => onConfirm(selectedTarget)}
            data-testid="twoqubit-confirm-btn"
          >
            Place Gate
          </button>
        </div>
      </div>
    </div>
  );
};

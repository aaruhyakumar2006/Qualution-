import React from 'react';
import type { CircuitRequest } from '../../features/circuit/types';
import './SyncConflictModal.css';

interface SyncConflictModalProps {
  isOpen: boolean;
  currentCircuit: CircuitRequest;
  parsedCircuit: CircuitRequest;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  isOpen,
  currentCircuit,
  parsedCircuit,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const currentSummary = currentCircuit.gates.length > 0
    ? currentCircuit.gates.map((g) => `${g.gate.toUpperCase()}(${g.targets.join(',')})`).join(' → ')
    : 'Empty Circuit';

  const parsedSummary = parsedCircuit.gates.length > 0
    ? parsedCircuit.gates.map((g) => `${g.gate.toUpperCase()}(${g.targets.join(',')})`).join(' → ')
    : 'Empty Circuit';

  return (
    <div className="modal-backdrop" onClick={onCancel} data-testid="sync-conflict-backdrop">
      <div className="conflict-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="conflict-header">
          <span className="conflict-title">Apply Code Changes to Visual Circuit?</span>
        </div>

        <div className="conflict-body">
          <p className="conflict-desc">
            Synchronizing will replace the current visual circuit on the canvas with the parsed code.
          </p>

          <div className="circuit-diff-box">
            <div className="diff-section">
              <span className="diff-label">Current Visual Circuit ({currentCircuit.qubits}Q):</span>
              <div className="diff-val current">{currentSummary}</div>
            </div>

            <div className="diff-arrow">↓</div>

            <div className="diff-section">
              <span className="diff-label">Parsed Code Circuit ({parsedCircuit.qubits}Q):</span>
              <div className="diff-val parsed">{parsedSummary}</div>
            </div>
          </div>
        </div>

        <div className="conflict-footer">
          <button type="button" className="btn-modal btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal btn-confirm-sync"
            onClick={onConfirm}
            data-testid="confirm-sync-btn"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

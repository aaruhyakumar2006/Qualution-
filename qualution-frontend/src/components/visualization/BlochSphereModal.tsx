import React from 'react';
import { X, Globe } from 'lucide-react';
import { BlochSphere } from './BlochSphere';
import type { BlochVector, BlochQubits } from '../../features/circuit/types';
import './BlochSphereModal.css';

interface BlochSphereModalProps {
  isOpen: boolean;
  onClose: () => void;
  bloch?: BlochVector | null;
  blochQubits?: BlochQubits;
  qubitCount?: number;
  showStateLabels?: boolean;
  showPhaseLabels?: boolean;
  interactiveMode?: boolean;
  onPredictClick?: (vec: { x: number; y: number; z: number }) => void;
}

export const BlochSphereModal: React.FC<BlochSphereModalProps> = ({
  isOpen,
  onClose,
  bloch,
  blochQubits,
  qubitCount = 1,
  showStateLabels = true,
  showPhaseLabels = false,
  interactiveMode = false,
  onPredictClick,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="bloch-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bloch-modal-window"
        role="dialog"
        aria-modal="true"
        aria-label="Bloch Sphere Viewer"
      >
        <div className="bloch-modal-header">
          <div className="bloch-modal-title-area">
            <div className="bloch-modal-icon-badge">
              <Globe size={16} />
            </div>
            <div>
              <h2 className="bloch-modal-title">Bloch Sphere Viewer</h2>
              <span className="bloch-modal-subtitle">
                Reduced single-qubit state — 3D Bloch vector representation
              </span>
            </div>
          </div>
          <button
            type="button"
            className="bloch-modal-close-btn"
            onClick={onClose}
            aria-label="Close Bloch Sphere Viewer"
            data-testid="btn-close-bloch-modal"
          >
            <X size={16} />
          </button>
        </div>
        <div className="bloch-modal-body">
          <BlochSphere
            bloch={bloch}
            blochQubits={blochQubits}
            qubitCount={qubitCount}
            showStateLabels={showStateLabels}
            showPhaseLabels={showPhaseLabels}
            interactiveMode={interactiveMode}
            onPredictClick={onPredictClick}
          />
        </div>
      </div>
    </div>
  );
};

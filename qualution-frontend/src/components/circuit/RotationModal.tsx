import React, { useState } from 'react';
import './RotationModal.css';

interface RotationModalProps {
  gateName: string;
  qubit: number;
  initialAngle?: number;
  isOpen: boolean;
  onConfirm: (angle: number) => void;
  onCancel: () => void;
}

export const RotationModal: React.FC<RotationModalProps> = ({
  gateName,
  qubit,
  initialAngle = 1.570796,
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [angleStr, setAngleStr] = useState<string>(initialAngle.toString());
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    let numVal: number;

    const trimmed = angleStr.trim().toLowerCase();
    if (trimmed === 'pi' || trimmed === 'π') {
      numVal = Math.PI;
    } else if (trimmed === 'pi/2' || trimmed === 'π/2') {
      numVal = Math.PI / 2;
    } else if (trimmed === 'pi/4' || trimmed === 'π/4') {
      numVal = Math.PI / 4;
    } else if (trimmed === '-pi/2' || trimmed === '-π/2') {
      numVal = -Math.PI / 2;
    } else if (trimmed === '2pi' || trimmed === '2π') {
      numVal = 2 * Math.PI;
    } else {
      numVal = parseFloat(trimmed);
    }

    if (isNaN(numVal)) {
      setError('Please enter a valid numeric angle (e.g. 1.5708, 3.14159, or π/2)');
      return;
    }

    setError(null);
    onConfirm(numVal);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel} data-testid="rotation-modal-backdrop">
      <div className="rotation-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{gateName.toUpperCase()} Rotation Angle</span>
          <span className="modal-badge">q[{qubit}]</span>
        </div>

        <form onSubmit={handleApply}>
          <div className="modal-body">
            <label className="input-label" htmlFor="rotation-angle-input">
              Angle (Radians):
            </label>
            <input
              id="rotation-angle-input"
              type="text"
              className="angle-input"
              value={angleStr}
              onChange={(e) => {
                setAngleStr(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 1.570796, π/2, 3.14159"
              autoFocus
            />

            <div className="preset-buttons">
              <button type="button" className="btn-preset" onClick={() => setAngleStr('1.570796')}>
                π/2 (1.57)
              </button>
              <button type="button" className="btn-preset" onClick={() => setAngleStr('3.141592')}>
                π (3.14)
              </button>
              <button type="button" className="btn-preset" onClick={() => setAngleStr('0.785398')}>
                π/4 (0.78)
              </button>
            </div>

            {error && <span className="modal-error">{error}</span>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-modal btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-modal btn-confirm">
              Add Gate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { projectBlochVector, DEFAULT_CAMERA, type CameraRotation } from '../../../components/visualization/blochProjection';
import './MicroBlochPreview.css';

export interface MicroBlochPreviewProps {
  vector: { x: number; y: number; z: number };
  targetVector?: { x: number; y: number; z: number } | null;
  label?: string;
  targetLabel?: string;
  size?: number;
  interactive?: boolean;
  onVectorSelect?: (coords: { x: number; y: number; z: number }) => void;
  selectedOptionTarget?: string | null;
}

export const MicroBlochPreview: React.FC<MicroBlochPreviewProps> = ({
  vector,
  targetVector,
  label = 'Current State',
  targetLabel = 'Predicted State',
  size = 140,
  interactive = false,
  onVectorSelect,
  selectedOptionTarget,
}) => {
  const camera: CameraRotation = DEFAULT_CAMERA;
  const center = size / 2;
  const radius = (size / 2) * 0.72;

  // Project axes
  const pNorth = projectBlochVector(0, 0, 1, center, center, radius, camera);
  const pSouth = projectBlochVector(0, 0, -1, center, center, radius, camera);
  const pEast = projectBlochVector(1, 0, 0, center, center, radius, camera);
  const pWest = projectBlochVector(-1, 0, 0, center, center, radius, camera);

  // Current State Vector
  const pVec = projectBlochVector(vector.x, vector.y, vector.z, center, center, radius, camera);

  // Optional Target / Predicted Vector
  const pTarget = targetVector
    ? projectBlochVector(targetVector.x, targetVector.y, targetVector.z, center, center, radius, camera)
    : null;

  // Quick preset targets for interactive prediction clicks
  const presets = [
    { name: '|0⟩', coords: { x: 0, y: 0, z: 1 } },
    { name: '|1⟩', coords: { x: 0, y: 0, z: -1 } },
    { name: '|+⟩', coords: { x: 1, y: 0, z: 0 } },
    { name: '|-⟩', coords: { x: -1, y: 0, z: 0 } },
    { name: '|i⟩', coords: { x: 0, y: 1, z: 0 } },
    { name: '|-i⟩', coords: { x: 0, y: -1, z: 0 } },
  ];

  return (
    <div className="micro-bloch-container" data-testid="micro-bloch-preview">
      <div className="micro-bloch-header">
        <span className="micro-bloch-title">{label}</span>
        {targetVector && <span className="micro-bloch-target-badge">{targetLabel}</span>}
      </div>

      <div className="micro-bloch-canvas-wrapper">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="micro-bloch-svg"
          aria-label="Bloch sphere micro projection"
        >
          <defs>
            <radialGradient id="microSphereGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#21262d" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0d1117" stopOpacity="0.95" />
            </radialGradient>
            <marker
              id="microCurrentArrow"
              markerWidth="6"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,1 L5,3 L0,5 z" fill="#00f2ff" />
            </marker>
            <marker
              id="microTargetArrow"
              markerWidth="6"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,1 L5,3 L0,5 z" fill="#a371f7" />
            </marker>
          </defs>

          {/* Sphere Body */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="url(#microSphereGrad)"
            stroke="rgba(88, 166, 255, 0.35)"
            strokeWidth="1.2"
          />

          {/* Equator Ellipse */}
          <ellipse
            cx={center}
            cy={center}
            rx={radius}
            ry={radius * 0.32}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeDasharray="2 3"
            strokeWidth="0.8"
          />

          {/* Z-Axis (North-South) */}
          <line
            x1={pSouth.x}
            y1={pSouth.y}
            x2={pNorth.x}
            y2={pNorth.y}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="0.9"
          />

          {/* X-Axis */}
          <line
            x1={pWest.x}
            y1={pWest.y}
            x2={pEast.x}
            y2={pEast.y}
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="0.8"
          />

          {/* Basis State Labels */}
          <text x={pNorth.x} y={pNorth.y - 4} className="micro-bloch-axis-label" textAnchor="middle">
            |0⟩
          </text>
          <text x={pSouth.x} y={pSouth.y + 11} className="micro-bloch-axis-label" textAnchor="middle">
            |1⟩
          </text>
          <text x={pEast.x + 8} y={pEast.y + 3} className="micro-bloch-axis-label" textAnchor="start">
            |+⟩
          </text>
          <text x={pWest.x - 8} y={pWest.y + 3} className="micro-bloch-axis-label" textAnchor="end">
            |-⟩
          </text>

          {/* Target Predicted Vector (if defined) */}
          {pTarget && (
            <line
              x1={center}
              y1={center}
              x2={pTarget.x}
              y2={pTarget.y}
              stroke="#a371f7"
              strokeWidth="2"
              strokeDasharray="3 2"
              markerEnd="url(#microTargetArrow)"
            />
          )}

          {/* Current State Vector */}
          <line
            x1={center}
            y1={center}
            x2={pVec.x}
            y2={pVec.y}
            stroke="#00f2ff"
            strokeWidth="2.2"
            markerEnd="url(#microCurrentArrow)"
          />

          {/* Vector tip glow dot */}
          <circle cx={pVec.x} cy={pVec.y} r="3" fill="#00f2ff" />
          {pTarget && <circle cx={pTarget.x} cy={pTarget.y} r="2.8" fill="#a371f7" />}
        </svg>
      </div>

      {/* Optional Interactive Hotspots for Socratic Prediction */}
      {interactive && onVectorSelect && (
        <div className="micro-bloch-presets">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className={`micro-bloch-preset-btn ${selectedOptionTarget === preset.name ? 'active' : ''}`}
              onClick={() => onVectorSelect(preset.coords)}
              title={`Predict state: ${preset.name}`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

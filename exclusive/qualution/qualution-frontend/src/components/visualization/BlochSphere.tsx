import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { BlochVector, BlochQubits, TimelineStep } from '../../features/circuit/types';
import {
  projectBlochVector,
  easeInOutCubic,
  DEFAULT_CAMERA,
  type CameraRotation,
} from './blochProjection';
import { RotateCcw } from 'lucide-react';
import { useTheme } from '../../features/theme/ThemeContext';
import './BlochSphere.css';

export interface TrajectoryPoint {
  step: number;
  x: number;
  y: number;
  z: number;
  op: string;
}

interface SingleBlochSphereCardProps {
  qubitIndex?: string;
  bloch: BlochVector;
  stepInfo?: {
    step: number;
    operation: string;
    qubits: number[];
  } | null;
  camera: CameraRotation;
  onCameraChange: (cam: CameraRotation) => void;
  onResetCamera: () => void;
  trajectory?: TrajectoryPoint[];
  showStateLabels?: boolean;
  showPhaseLabels?: boolean;
  interactiveMode?: boolean;
  onPredictClick?: (vec: {x:number, y:number, z:number}) => void;
}

export const SingleBlochSphereCard: React.FC<SingleBlochSphereCardProps> = React.memo(({
  qubitIndex,
  bloch,
  stepInfo,
  camera,
  onCameraChange,
  onResetCamera,
  trajectory = [],
  showStateLabels = true,
  showPhaseLabels = false,
  interactiveMode = false,
  onPredictClick,
}) => {
  const safeBloch: BlochVector = bloch || { x: 0, y: 0, z: 1, purity: 1, magnitude: 1 };
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Check if system prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animated vector state (x, y, z, purity, magnitude)
  const [animatedVector, setAnimatedVector] = useState<BlochVector>({
    x: safeBloch.x ?? 0,
    y: safeBloch.y ?? 0,
    z: safeBloch.z ?? 1,
    purity: safeBloch.purity ?? 1,
    magnitude: safeBloch.magnitude ?? 1,
  });

  // Pulse animation trigger on arrival/target update
  const [isPulsing, setIsPulsing] = useState<boolean>(false);

  // References for requestAnimationFrame interpolation
  const animRef = useRef<number | null>(null);
  const currentVecRef = useRef<BlochVector>({
    x: safeBloch.x ?? 0,
    y: safeBloch.y ?? 0,
    z: safeBloch.z ?? 1,
    purity: safeBloch.purity ?? 1,
    magnitude: safeBloch.magnitude ?? 1,
  });

  // Track previous target to prevent redundant loop triggers
  const prevTargetRef = useRef<{ x: number; y: number; z: number }>({
    x: safeBloch.x ?? 0,
    y: safeBloch.y ?? 0,
    z: safeBloch.z ?? 1,
  });

  // Smooth vector animation effect when bloch changes
  useEffect(() => {
    const targetX = safeBloch.x ?? 0;
    const targetY = safeBloch.y ?? 0;
    const targetZ = safeBloch.z ?? 1;
    const rawMag = Math.sqrt(targetX * targetX + targetY * targetY + targetZ * targetZ);
    const targetPurity = safeBloch.purity ?? (rawMag > 0.95 ? 1.0 : 0.5);
    const targetMag = bloch.magnitude ?? rawMag;

    // Reduced motion or immediate snap
    if (prefersReducedMotion) {
      setAnimatedVector({
        x: targetX,
        y: targetY,
        z: targetZ,
        purity: targetPurity,
        magnitude: targetMag,
      });
      currentVecRef.current = {
        x: targetX,
        y: targetY,
        z: targetZ,
        purity: targetPurity,
        magnitude: targetMag,
      };
      prevTargetRef.current = { x: targetX, y: targetY, z: targetZ };
      return;
    }

    const prevX = currentVecRef.current.x;
    const prevY = currentVecRef.current.y;
    const prevZ = currentVecRef.current.z;
    const prevPurity = currentVecRef.current.purity ?? 1.0;
    const prevMag = currentVecRef.current.magnitude ?? 1.0;

    const dx = Math.abs(targetX - prevX);
    const dy = Math.abs(targetY - prevY);
    const dz = Math.abs(targetZ - prevZ);

    // If change is negligible, set directly
    if (dx < 0.001 && dy < 0.001 && dz < 0.001) {
      setAnimatedVector({
        x: targetX,
        y: targetY,
        z: targetZ,
        purity: targetPurity,
        magnitude: targetMag,
      });
      currentVecRef.current = {
        x: targetX,
        y: targetY,
        z: targetZ,
        purity: targetPurity,
        magnitude: targetMag,
      };
      prevTargetRef.current = { x: targetX, y: targetY, z: targetZ };
      return;
    }

    // Start requestAnimationFrame smooth easing
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }

    const startTime = performance.now();
    const duration = 500; // ms transition

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const ease = easeInOutCubic(progress);

      const curX = prevX + (targetX - prevX) * ease;
      const curY = prevY + (targetY - prevY) * ease;
      const curZ = prevZ + (targetZ - prevZ) * ease;
      const curPurity = prevPurity + (targetPurity - prevPurity) * ease;
      const curMag = prevMag + (targetMag - prevMag) * ease;

      const newVec: BlochVector = {
        x: progress === 1.0 ? targetX : curX,
        y: progress === 1.0 ? targetY : curY,
        z: progress === 1.0 ? targetZ : curZ,
        purity: progress === 1.0 ? targetPurity : curPurity,
        magnitude: progress === 1.0 ? targetMag : curMag,
      };

      setAnimatedVector(newVec);
      currentVecRef.current = newVec;

      if (progress < 1.0) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        prevTargetRef.current = { x: targetX, y: targetY, z: targetZ };
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 300);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [bloch.x, bloch.y, bloch.z, bloch.purity, bloch.magnitude, prefersReducedMotion]);

  // Drag-to-rotate 3D interaction state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number }>({
    x: 0,
    y: 0,
    rotX: camera.rotX,
    rotY: camera.rotY,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: camera.rotX,
      rotY: camera.rotY,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      onCameraChange({
        ...camera,
        rotY: dragStartRef.current.rotY + dx * 0.6,
        rotX: Math.max(-85, Math.min(85, dragStartRef.current.rotX - dy * 0.6)),
      });
    },
    [camera, onCameraChange]
  );

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    onCameraChange({
      ...camera,
      zoom: Math.max(0.6, Math.min(1.8, camera.zoom + zoomDelta)),
    });
  };

  // State classification helper based on current destination or animated position
  const getStateLabel = (x: number, y: number, z: number): string | null => {
    const eps = 0.08;
    const mag = Math.sqrt(x * x + y * y + z * z);
    if (mag < 0.15) return 'Mixed / Entangled Subsystem';
    if (Math.abs(z - 1.0) < eps && Math.abs(x) < eps && Math.abs(y) < eps) return '|0⟩ Ground State';
    if (Math.abs(z - (-1.0)) < eps && Math.abs(x) < eps && Math.abs(y) < eps) return '|1⟩ Excited State';
    if (Math.abs(x - 1.0) < eps && Math.abs(y) < eps && Math.abs(z) < eps) return '|+⟩ Symmetric Superposition';
    if (Math.abs(x - (-1.0)) < eps && Math.abs(y) < eps && Math.abs(z) < eps) return '|-⟩ Anti-symmetric Superposition';
    if (Math.abs(y - 1.0) < eps && Math.abs(x) < eps && Math.abs(z) < eps) return '|i⟩ Circular (+Y)';
    if (Math.abs(y - (-1.0)) < eps && Math.abs(x) < eps && Math.abs(z) < eps) return '|-i⟩ Circular (-Y)';
    return null;
  };

  const stateLabel = getStateLabel(bloch.x, bloch.y, bloch.z);
  const currentMagnitude = animatedVector.magnitude ?? Math.sqrt(
    animatedVector.x * animatedVector.x +
    animatedVector.y * animatedVector.y +
    animatedVector.z * animatedVector.z
  );

  const cx = 100;
  const cy = 100;
  const radius = 68;

  // 3D projected points
  const origin = useMemo(() => projectBlochVector(0, 0, 0, cx, cy, radius, camera), [camera]);
  const tip = useMemo(
    () => projectBlochVector(animatedVector.x, animatedVector.y, animatedVector.z, cx, cy, radius, camera),
    [animatedVector.x, animatedVector.y, animatedVector.z, camera]
  );

  // Axis Endpoints
  const zNorth = useMemo(() => projectBlochVector(0, 0, 1.15, cx, cy, radius, camera), [camera]);
  const zSouth = useMemo(() => projectBlochVector(0, 0, -1.15, cx, cy, radius, camera), [camera]);
  const xEast = useMemo(() => projectBlochVector(1.15, 0, 0, cx, cy, radius, camera), [camera]);
  const xWest = useMemo(() => projectBlochVector(-1.15, 0, 0, cx, cy, radius, camera), [camera]);
  const yFront = useMemo(() => projectBlochVector(0, 1.15, 0, cx, cy, radius, camera), [camera]);
  const yBack = useMemo(() => projectBlochVector(0, -1.15, 0, cx, cy, radius, camera), [camera]);

  // Equator Path Generation (36 discrete points)
  const equatorPath = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= 36; i++) {
      const angle = (i * 10 * Math.PI) / 180;
      const ex = Math.cos(angle);
      const ey = Math.sin(angle);
      const pt = projectBlochVector(ex, ey, 0, cx, cy, radius, camera);
      points.push(`${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`);
    }
    return points.join(' ') + ' Z';
  }, [camera]);

  // Meridian Path Generation
  const meridianPath = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= 36; i++) {
      const angle = (i * 10 * Math.PI) / 180;
      const mx = Math.cos(angle);
      const mz = Math.sin(angle);
      const pt = projectBlochVector(mx, 0, mz, cx, cy, radius, camera);
      points.push(`${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`);
    }
    return points.join(' ') + ' Z';
  }, [camera]);

  // Trajectory Path & Markers from actual timeline steps
  const projectedTrajectory = useMemo(() => {
    if (!trajectory || trajectory.length <= 1) return null;
    const pts = trajectory.map((p) => {
      const proj = projectBlochVector(p.x, p.y, p.z, cx, cy, radius, camera);
      return {
        ...p,
        projX: proj.x,
        projY: proj.y,
      };
    });

    let pathD = '';
    for (let i = 0; i < pts.length; i++) {
      pathD += `${i === 0 ? 'M' : 'L'} ${pts[i].projX.toFixed(2)} ${pts[i].projY.toFixed(2)} `;
    }

    return {
      points: pts,
      pathD,
    };
  }, [trajectory, camera]);

  const uniqueCardId = qubitIndex !== undefined ? `q${qubitIndex}` : 'single';

  return (
    <div
      className={`bloch-sphere-card ${isPulsing ? 'bloch-pulse' : ''}`}
      data-testid={qubitIndex !== undefined ? `bloch-sphere-q${qubitIndex}` : 'bloch-sphere'}
    >
      {/* Card Header with Qubit Index, Step Context, and Purity */}
      <div className="bloch-qubit-header">
        <div className="qubit-title-row">
          <span className="qubit-badge">
            {qubitIndex !== undefined ? `Qubit q[${qubitIndex}]` : 'Qubit State'}
          </span>
          {stepInfo && (
            <span className="bloch-step-tag" title={`Step ${stepInfo.step}`}>
              {stepInfo.step === 0 ? 'Init' : `${stepInfo.operation.toUpperCase()}`}
            </span>
          )}
        </div>

        <div className="qubit-header-actions">
          {animatedVector.purity !== undefined && (
            <span
              className={`purity-badge ${animatedVector.purity > 0.95 ? 'pure' : 'mixed'}`}
              title={`Quantum Purity Tr(ρ²): ${animatedVector.purity.toFixed(3)}`}
            >
              Purity: {animatedVector.purity.toFixed(2)}
            </span>
          )}
          <button
            type="button"
            className="btn-camera-reset"
            onClick={onResetCamera}
            title="Reset View"
            aria-label="Reset View"
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* 3D Coordinate Pill Displays */}
      <div className="bloch-coords-header">
        <div className="bloch-coord-pill" data-testid="bloch-coord-x">
          <span className="coord-lbl">X:</span>
          <span className="coord-val">{animatedVector.x.toFixed(3)}</span>
        </div>
        <div className="bloch-coord-pill" data-testid="bloch-coord-y">
          <span className="coord-lbl">Y:</span>
          <span className="coord-val">{animatedVector.y.toFixed(3)}</span>
        </div>
        <div className="bloch-coord-pill" data-testid="bloch-coord-z">
          <span className="coord-lbl">Z:</span>
          <span className="coord-val">{animatedVector.z.toFixed(3)}</span>
        </div>
        {showPhaseLabels && (
          <div className="bloch-coord-pill" data-testid="bloch-coord-phase" title="Azimuthal Relative Phase Angle ϕ">
            <span className="coord-lbl">ϕ:</span>
            <span className="coord-val" style={{ color: `hsl(${((Math.atan2(animatedVector.y, animatedVector.x) * 180 / Math.PI + 360) % 360).toFixed(0)}, 85%, 65%)` }}>
              {((Math.atan2(animatedVector.y, animatedVector.x) * 180 / Math.PI + 360) % 360).toFixed(1)}°
            </span>
          </div>
        )}
      </div>

      {/* Magnitude & State Classification Subrow */}
      <div className="bloch-meta-subrow">
        <span className="bloch-mag-pill" title="Bloch Vector Magnitude |r|">
          |r| = {currentMagnitude.toFixed(3)}
        </span>
        {showStateLabels && stateLabel && (
          <div className="bloch-state-badge" data-testid="bloch-state-label">
            <span>{stateLabel}</span>
          </div>
        )}
      </div>

      {/* Interactive 3D SVG Bloch Sphere Render */}
      <div
        className="bloch-svg-wrapper"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        title="Click & Drag to rotate 3D view | Scroll to zoom"
      >
        <svg viewBox="0 0 200 200" className="bloch-svg" aria-label="3D Bloch Sphere Diagram">
          <defs>
            <radialGradient id={`sphereGrad-${uniqueCardId}`} cx="40%" cy="40%" r="60%">
              {isLight ? (
                <>
                  <stop offset="0%" stopColor="rgba(124, 58, 237, 0.05)" />
                  <stop offset="80%" stopColor="rgba(226, 232, 240, 0.6)" />
                  <stop offset="100%" stopColor="rgba(241, 245, 249, 0.95)" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
                  <stop offset="80%" stopColor="rgba(30, 40, 60, 0.4)" />
                  <stop offset="100%" stopColor="rgba(10, 13, 20, 0.85)" />
                </>
              )}
            </radialGradient>
            <linearGradient id={`vectorGrad-${uniqueCardId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-cyan, #0d9488)" />
              <stop offset="100%" stopColor="var(--accent-primary, #7c3aed)" />
            </linearGradient>
            <marker id={`arrowHead-${uniqueCardId}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="var(--accent-cyan, #0d9488)" />
            </marker>
          </defs>

          {/* 3D Sphere Outline */}
          <circle
            cx={cx}
            cy={cy}
            r={radius * camera.zoom}
            fill={`url(#sphereGrad-${uniqueCardId})`}
            stroke="var(--border-color, #cbd5e1)"
            strokeWidth="1.5"
          />

          {/* 3D Equator & Meridian Guide Paths */}
          <path d={equatorPath} fill="none" stroke={isLight ? "rgba(0, 0, 0, 0.14)" : "rgba(255, 255, 255, 0.12)"} strokeDasharray="3,3" />
          <path d={meridianPath} fill="none" stroke={isLight ? "rgba(0, 0, 0, 0.09)" : "rgba(255, 255, 255, 0.08)"} strokeDasharray="3,3" />

          {/* Axis Z: |0⟩ to |1⟩ */}
          <line
            x1={zSouth.x}
            y1={zSouth.y}
            x2={zNorth.x}
            y2={zNorth.y}
            stroke={isLight ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.35)"}
            strokeWidth="1"
          />
          {showStateLabels && (
            <>
              <text x={zNorth.x + 4} y={zNorth.y - 2} className="axis-label ket">|0⟩ (+Z)</text>
              <text x={zSouth.x + 4} y={zSouth.y + 8} className="axis-label ket">|1⟩ (-Z)</text>
            </>
          )}

          {/* Axis X: |+⟩ to |-⟩ */}
          <line
            x1={xWest.x}
            y1={xWest.y}
            x2={xEast.x}
            y2={xEast.y}
            stroke={isLight ? "rgba(15, 23, 42, 0.35)" : "rgba(255, 255, 255, 0.22)"}
            strokeWidth="1"
          />
          {showStateLabels && (
            <>
              <text x={xEast.x + 4} y={xEast.y + 3} className="axis-label">|+⟩ (+X)</text>
              <text x={xWest.x - 22} y={xWest.y + 3} className="axis-label">|-⟩ (-X)</text>
            </>
          )}

          {/* Axis Y: |i⟩ to |-i⟩ */}
          <line
            x1={yBack.x}
            y1={yBack.y}
            x2={yFront.x}
            y2={yFront.y}
            stroke={isLight ? "rgba(15, 23, 42, 0.25)" : "rgba(255, 255, 255, 0.18)"}
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          {showStateLabels && (
            <>
              <text x={yFront.x + 3} y={yFront.y + 4} className="axis-label">|i⟩ (+Y)</text>
              <text x={yBack.x - 22} y={yBack.y + 4} className="axis-label">|-i⟩ (-Y)</text>
            </>
          )}

          {/* Real Execution Trajectory Path across Steps */}
          {projectedTrajectory && (
            <g className="bloch-trajectory-group" data-testid="bloch-trajectory">
              <path
                d={projectedTrajectory.pathD}
                fill="none"
                stroke="rgba(88, 166, 255, 0.35)"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              {projectedTrajectory.points.map((pt, pIdx) => (
                <circle
                  key={pIdx}
                  cx={pt.projX}
                  cy={pt.projY}
                  r="2.5"
                  fill="rgba(188, 140, 255, 0.7)"
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="0.8"
                >
                  <title>{`Step ${pt.step}: ${pt.op.toUpperCase()} (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)})`}</title>
                </circle>
              ))}
            </g>
          )}

          {/* State Vector Line from Origin (0,0,0) to Tip (x,y,z) */}
          {currentMagnitude > 0.05 ? (
            <>
              <line
                x1={origin.x}
                y1={origin.y}
                x2={tip.x}
                y2={tip.y}
                stroke={`url(#vectorGrad-${uniqueCardId})`}
                strokeWidth="3.2"
                strokeLinecap="round"
                markerEnd={`url(#arrowHead-${uniqueCardId})`}
              />
              {/* Dynamic Tip Marker Dot */}
              <circle
                cx={tip.x}
                cy={tip.y}
                r="4.5"
                fill="var(--accent-cyan, #58a6ff)"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            </>
          ) : (
            /* For Maximally Mixed states (e.g. Bell state), render pulsing amber core indicator */
            <g className="mixed-state-origin">
              <circle cx={origin.x} cy={origin.y} r="7" fill="rgba(210, 153, 34, 0.4)" />
              <circle cx={origin.x} cy={origin.y} r="3.5" fill="#d29922" />
            </g>
          )}

          {/* Origin Dot */}
          <circle cx={origin.x} cy={origin.y} r="2.5" fill="var(--text-muted, #8b949e)" />
          
          {/* Interactive Snap Points */}
          {interactiveMode && (
            <g className="interactive-snap-group">
              {[
                { label: '|0⟩', vec: { x: 0, y: 0, z: 1 }, proj: zNorth },
                { label: '|1⟩', vec: { x: 0, y: 0, z: -1 }, proj: zSouth },
                { label: '|+⟩', vec: { x: 1, y: 0, z: 0 }, proj: xEast },
                { label: '|-⟩', vec: { x: -1, y: 0, z: 0 }, proj: xWest },
                { label: '|i⟩', vec: { x: 0, y: 1, z: 0 }, proj: yFront },
                { label: '|-i⟩', vec: { x: 0, y: -1, z: 0 }, proj: yBack },
              ].map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.proj.x}
                  cy={pt.proj.y}
                  r="14"
                  className="interactive-snap-point"
                  onClick={(e) => { e.stopPropagation(); onPredictClick?.(pt.vec); }}
                >
                  <title>Predict {pt.label}</title>
                </circle>
              ))}
            </g>
          )}
        </svg>
      </div>

      <div className="bloch-card-footer-tip">
        <span>Click & drag to rotate 3D view</span>
      </div>
    </div>
  );
});

SingleBlochSphereCard.displayName = 'SingleBlochSphereCard';

interface BlochSphereProps {
  bloch?: BlochVector | null;
  blochQubits?: BlochQubits | null;
  qubitCount: number;
  stepInfo?: {
    step: number;
    operation: string;
    qubits: number[];
  } | null;
  timelineSteps?: TimelineStep[] | null;
  showStateLabels?: boolean;
  showPhaseLabels?: boolean;
  interactiveMode?: boolean;
  onPredictClick?: (vec: {x:number, y:number, z:number}) => void;
}

export const BlochSphere: React.FC<BlochSphereProps> = React.memo(({
  bloch,
  blochQubits,
  qubitCount,
  stepInfo,
  timelineSteps,
  showStateLabels = true,
  showPhaseLabels = false,
  interactiveMode = false,
  onPredictClick,
}) => {
  // Shared camera rotation for synchronizing multi-qubit viewports
  const [camera, setCamera] = useState<CameraRotation>(DEFAULT_CAMERA);

  const handleResetCamera = useCallback(() => {
    setCamera(DEFAULT_CAMERA);
  }, []);

  // Compute per-qubit trajectory history up to current step (or full timeline)
  const trajectoryMap = useMemo<Record<string, TrajectoryPoint[]>>(() => {
    const map: Record<string, TrajectoryPoint[]> = {};
    if (!timelineSteps || timelineSteps.length === 0) return map;

    const maxStep = stepInfo ? stepInfo.step : timelineSteps.length - 1;

    for (let sIdx = 0; sIdx <= maxStep && sIdx < timelineSteps.length; sIdx++) {
      const step = timelineSteps[sIdx];
      if (step.bloch_qubits) {
        for (const [qKey, bVec] of Object.entries(step.bloch_qubits)) {
          if (!map[qKey]) map[qKey] = [];
          map[qKey].push({
            step: step.step,
            x: bVec.x,
            y: bVec.y,
            z: bVec.z,
            op: step.operation,
          });
        }
      } else if (step.bloch && qubitCount <= 1) {
        if (!map['0']) map['0'] = [];
        map['0'].push({
          step: step.step,
          x: step.bloch.x,
          y: step.bloch.y,
          z: step.bloch.z,
          op: step.operation,
        });
      }
    }
    return map;
  }, [timelineSteps, stepInfo, qubitCount]);

  const [activeQubitView, setActiveQubitView] = useState<string>('all');

  // 1. Single-qubit circuit (renders with data-testid="bloch-sphere")
  if ((bloch && qubitCount <= 1) || (qubitCount <= 1 && blochQubits && blochQubits['0'])) {
    const singleVec = bloch || blochQubits?.['0'];
    return (
      <div className="bloch-multi-container">
        <SingleBlochSphereCard
          bloch={singleVec!}
          stepInfo={stepInfo}
          camera={camera}
          onCameraChange={setCamera}
          onResetCamera={handleResetCamera}
          trajectory={trajectoryMap['0'] || []}
          showStateLabels={showStateLabels}
          showPhaseLabels={showPhaseLabels}
          interactiveMode={interactiveMode}
          onPredictClick={onPredictClick}
        />
      </div>
    );
  }

  // 2. If blochQubits is provided (multi-qubit circuits), render all per-qubit Bloch spheres in a responsive grid
  if (blochQubits && Object.keys(blochQubits).length > 0) {
    const qubitKeys = Object.keys(blochQubits).sort((a, b) => Number(a) - Number(b));
    const isEntangled = qubitKeys.some((k) => (blochQubits[k]?.purity ?? 1.0) < 0.95);
    const displayedKeys = activeQubitView === 'all' ? qubitKeys : [activeQubitView];

    return (
      <div className="bloch-multi-container" data-testid="bloch-sphere-multi">
        <div className="bloch-section-header">
          <div className="bloch-selector-row">
            <span className="section-title">Reduced State Bloch Spheres</span>
            {qubitKeys.length > 1 && (
              <div className="bloch-qubit-selector-group" role="tablist">
                <button
                  type="button"
                  className={`btn-bloch-sel ${activeQubitView === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveQubitView('all')}
                >
                  All ({qubitKeys.length})
                </button>
                {qubitKeys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`btn-bloch-sel ${activeQubitView === k ? 'active' : ''}`}
                    onClick={() => setActiveQubitView(k)}
                  >
                    q[{k}]
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn-sync-camera"
            onClick={handleResetCamera}
            title="Reset All 3D Views"
          >
            <RotateCcw size={12} />
            <span>Reset View</span>
          </button>
        </div>

        <div
          className={`bloch-qubits-grid ${
            displayedKeys.length === 1
              ? 'grid-1'
              : displayedKeys.length === 2
              ? 'grid-2'
              : 'grid-multi'
          }`}
        >
          {displayedKeys.map((k) => (
            <SingleBlochSphereCard
              key={k}
              qubitIndex={k}
              bloch={blochQubits[k] || { x: 0, y: 0, z: 1, purity: 1, magnitude: 1 }}
              stepInfo={stepInfo}
              camera={camera}
              onCameraChange={setCamera}
              onResetCamera={handleResetCamera}
              trajectory={trajectoryMap[k] || []}
              showStateLabels={showStateLabels}
              showPhaseLabels={showPhaseLabels}
            />
          ))}
        </div>

        {isEntangled && (
          <div className="bloch-entangled-notice" data-testid="bloch-entangled-notice">
            <span className="notice-title">Reduced Single-Qubit State</span>
            <p className="notice-text">
              This circuit is entangled. Entanglement correlations are not represented by one Bloch sphere; vectors show reduced single-qubit states (|r| &lt; 1, purity &lt; 1).
            </p>
          </div>
        )}
      </div>
    );
  }

  // 3. Fallback when execution has not yet run
  return (
    <div className="bloch-sphere-container" data-testid="bloch-sphere-unavailable">
      <div className="bloch-notice-box">
        <div className="bloch-notice-icon">🌐</div>
        <span className="bloch-notice-title">Bloch Sphere Ready</span>
        <p className="bloch-notice-desc">
          Run the circuit to compute the exact reduced density matrix and 3D Bloch sphere vector for each qubit wire.
        </p>
      </div>
    </div>
  );
});

BlochSphere.displayName = 'BlochSphere';

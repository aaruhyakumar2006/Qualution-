/**
 * TeachingCursor.tsx
 *
 * PHASE 2: Teacher Cursor Rebuilt & Unified.
 *
 * Responsibilities:
 * - Renders an unmistakable academic teacher pointer on the Teaching Board.
 * - Anchored at the exact pointer tip (0, 0) -> cursor tip = logical (x, y).
 * - Resolution-independent: logical board coordinates (1280 × 720) map directly
 *   to stage percentage offsets (left: ...%, top: ...%), guaranteeing correct
 *   positioning on any viewport resolution, aspect ratio, or DPR without drift.
 * - Visible immediately on mount (not hidden by default).
 * - Exposes a clean, imperative API via ref: show, hide, moveTo, setPosition, reset.
 * - Runs a 5-second development movement demonstration sequence (Section 12):
 *   0s: visible at (20%, 30%)
 *   1s: move to upper-left teaching position
 *   2s: move to center
 *   3s: move to lower-right teaching position
 *   4s: pause
 *   5s: reset to initial position
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import './TeachingCursor.css';

export interface TeachingCursorProps {
  /** Logical X position on the teaching board (default 0..1280 or percentage) */
  x?: number;
  /** Logical Y position on the teaching board (default 0..720 or percentage) */
  y?: number;
  /** Visibility flag (standard prop) */
  isVisible?: boolean;
  /** Visibility flag alias for backwards-compatibility */
  visible?: boolean;
  /** Whether the teacher is currently clicking/pressing */
  isClicking?: boolean;
  /** Optional text label / badge below pointer */
  label?: string;
  /** Optional spotlight halo around pointer */
  isSpotlight?: boolean;
  /** Optional dragged gate symbol */
  draggingGate?: string;
  /** Annotation mode for visual teacher guides */
  annotationMode?: 'circle' | 'draw_trail' | 'arrow' | 'underline';
  /** Logical width of the teaching board (default: 1280) */
  logicalWidth?: number;
  /** Logical height of the teaching board (default: 720) */
  logicalHeight?: number;
  /** Whether to execute the Phase 2 development movement demo sequence */
  demoMode?: boolean;
  /** Whether coordinates are raw screen pixels (for IDE full-window fallback) */
  isScreenCoords?: boolean;
  /** Whether to disable CSS transitions for per-frame animation (e.g. anime.js) */
  isInstant?: boolean;
  /** Whether the cursor is currently executing the drop overshoot-and-settle animation */
  isDropping?: boolean;
  /** Whether the cursor is executing the post-drop lift-and-fade exit */
  isLifting?: boolean;
}

export interface TeachingCursorRef {
  /** Makes the cursor visible */
  show: () => void;
  /** Hides the cursor */
  hide: () => void;
  /** Smoothly moves the cursor to logical (x, y) */
  moveTo: (x: number, y: number, durationMs?: number) => Promise<void>;
  /** Instantly places the cursor at logical (x, y) without animation */
  setPosition: (x: number, y: number) => void;
  /** Alias for setPosition to match BoardCursorController */
  teleport: (x: number, y: number) => void;
  /** Resets the cursor to initial position (20%, 30%) and visibility */
  reset: () => void;
  /** Returns the current logical position */
  getPosition: () => { x: number; y: number };
  /** State object for direct BoardCursorController compatibility */
  state: { x: number; y: number; visible: boolean; moving: boolean };
}

// ── Default Initial Development Coordinates: 20%, 30% ─────────────────────────
const DEFAULT_LOGICAL_W = 1280;
const DEFAULT_LOGICAL_H = 720;
const INITIAL_LOGICAL_X = 256; // 20% of 1280
const INITIAL_LOGICAL_Y = 216; // 30% of 720

export const TeachingCursor = forwardRef<TeachingCursorRef, TeachingCursorProps>(
  (
    {
      x: propX,
      y: propY,
      isVisible: propIsVisible,
      visible: propVisible,
      isClicking = false,
      label,
      isSpotlight = false,
      draggingGate,
      annotationMode,
      logicalWidth = DEFAULT_LOGICAL_W,
      logicalHeight = DEFAULT_LOGICAL_H,
      demoMode = false,
      isScreenCoords = false,
      isInstant: propIsInstant = false,
      isDropping = false,
      isLifting = false,
    },
    ref
  ) => {
    // Determine effective initial visibility:
    const propVisibility = propIsVisible !== undefined ? propIsVisible : propVisible;
    const initialVisibility = propVisibility !== undefined ? propVisibility : true;

    // State for logical position and transitions
    const [posX, setPosX] = useState<number>(propX !== undefined ? propX : INITIAL_LOGICAL_X);
    const [posY, setPosY] = useState<number>(propY !== undefined ? propY : INITIAL_LOGICAL_Y);
    const [visible, setVisible] = useState<boolean>(initialVisibility);
    const [transitionDuration, setTransitionDuration] = useState<number>(800);
    const [isInstant, setIsInstant] = useState<boolean>(false);
    const effectiveIsInstant = propIsInstant || isInstant;

    // Sync with incoming props if they change
    const isFirstMountRef = useRef<boolean>(true);
    useEffect(() => {
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
        return;
      }
      if (propX !== undefined) setPosX(propX);
      if (propY !== undefined) setPosY(propY);
      if (propVisibility !== undefined) setVisible(propVisibility);
    }, [propX, propY, propVisibility]);

    // ── Imperative API implementation ──────────────────────────────────────────
    const show = useCallback(() => {
      setVisible(true);
    }, []);

    const hide = useCallback(() => {
      setVisible(false);
    }, []);

    const moveTo = useCallback(
      (targetX: number, targetY: number, durationMs: number = 800): Promise<void> => {
        setIsInstant(false);
        setTransitionDuration(durationMs);
        setVisible(true);
        setPosX(targetX);
        setPosY(targetY);
        return new Promise<void>((resolve) => setTimeout(resolve, durationMs));
      },
      []
    );

    const setPosition = useCallback((targetX: number, targetY: number) => {
      setIsInstant(true);
      setTransitionDuration(0);
      setVisible(true);
      setPosX(targetX);
      setPosY(targetY);
    }, []);

    const reset = useCallback(() => {
      setIsInstant(false);
      setTransitionDuration(800);
      setVisible(true);
      setPosX(INITIAL_LOGICAL_X);
      setPosY(INITIAL_LOGICAL_Y);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        show,
        hide,
        moveTo,
        setPosition,
        teleport: setPosition,
        reset,
        getPosition: () => ({ x: posX, y: posY }),
        state: {
          x: posX,
          y: posY,
          visible,
          moving: !isInstant,
        },
      }),
      [show, hide, moveTo, setPosition, reset, posX, posY, visible, isInstant]
    );

    // ── Phase 2 Development Movement Demo Sequence (Section 12) ───────────────
    // Sequence:
    // 0s -> cursor visible at initial position (20%, 30%)
    // 1s -> move to upper-left teaching position (x: 180, y: 130)
    // 2s -> move to center (x: 640, y: 360)
    // 3s -> move to lower-right teaching position (x: 960, y: 520)
    // 4s -> pause
    // 5s -> reset back to initial position
    // Repeats every 6 seconds while in demoMode
    useEffect(() => {
      if (!demoMode) return;

      let timerUL: ReturnType<typeof setTimeout> | undefined;
      let timerC: ReturnType<typeof setTimeout> | undefined;
      let timerLR: ReturnType<typeof setTimeout> | undefined;
      let timerReset: ReturnType<typeof setTimeout> | undefined;

      const runDemoCycle = () => {
        // 0s: reset to initial position (20%, 30%)
        setPosition(INITIAL_LOGICAL_X, INITIAL_LOGICAL_Y);

        // 1s: move to upper-left
        timerUL = setTimeout(() => {
          moveTo(180, 130, 800);
        }, 1000);

        // 2s: move to center
        timerC = setTimeout(() => {
          moveTo(640, 360, 800);
        }, 2000);

        // 3s: move to lower-right
        timerLR = setTimeout(() => {
          moveTo(960, 520, 800);
        }, 3000);

        // 4s: pause at lower-right

        // 5s: reset back to initial position
        timerReset = setTimeout(() => {
          reset();
        }, 5000);
      };

      // Run immediately on mount
      runDemoCycle();

      // Repeat cycle every 6s
      const cycleInterval = setInterval(runDemoCycle, 6000);

      return () => {
        clearInterval(cycleInterval);
        clearTimeout(timerUL);
        clearTimeout(timerC);
        clearTimeout(timerLR);
        clearTimeout(timerReset);
      };
    }, [demoMode, moveTo, setPosition, reset]);

    if (!visible) return null;

    // ── Coordinate Mapping ──────────────────────────────────────────────────
    // Convert logical coordinates into exact CSS percentage offsets inside stage.
    // If raw screen coords are requested (IDE overlay mode), use px.
    const leftStyle = isScreenCoords
      ? `${posX}px`
      : `${((posX / Math.max(1, logicalWidth)) * 100).toFixed(4)}%`;
    const topStyle = isScreenCoords
      ? `${posY}px`
      : `${((posY / Math.max(1, logicalHeight)) * 100).toFixed(4)}%`;

    return (
      <div
        className={`teaching-cursor-container ${isScreenCoords ? 'is-screen-coords' : ''} ${
          effectiveIsInstant ? 'is-instant' : ''
        } ${draggingGate ? 'has-dragging-gate' : ''} ${isDropping ? 'is-dropping' : ''} ${
          isLifting ? 'is-lifting' : ''
        }`.trim()}
        data-testid="teaching-cursor"
        style={{
          left: leftStyle,
          top: topStyle,
          transitionDuration: `${transitionDuration}ms`,
        }}
        aria-hidden="true"
      >
        {/*
          Academic Teacher Pointer SVG
          Size: 32 × 38 logical pixels.
          Hotspot: tip is anchored strictly at (0, 0).
          High contrast chalk-white body (#F8FAFC) with dark border (#070B19)
          and crisp drop shadow for clear legibility over dark chalkboard.
        */}
        <svg
          className={`teaching-cursor-arrow ${isClicking ? 'clicking' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="38"
          viewBox="0 0 28 38"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="tc-academic-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* Main Pointer Arrow Body */}
          <path
            d="M 0,0 L 0,26 L 6.5,20.5 L 13,34 L 17.5,31.5 L 11,18.5 L 19.5,18.5 Z"
            fill="#F8FAFC"
            stroke="#070B19"
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#tc-academic-shadow)"
          />

          {/* Academic Inner Accent Facet */}
          <path
            d="M 2.2,4.5 L 2.2,22 L 6,18.5 L 11.5,30"
            stroke="#CBD5E1"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Tip focus indicator for clicking / spotlight */}
        {(isClicking || isSpotlight) && <div className="teaching-cursor-tip-dot" />}

        {/* Spotlight halo */}
        {isSpotlight && <div className="cursor-spotlight-glow" />}

        {/* Annotation overlays */}
        {annotationMode === 'circle' && (
          <svg className="teaching-cursor-annotation-circle" viewBox="0 0 100 100" width="100" height="100">
            <circle cx="50" cy="50" r="40" stroke="rgba(56, 189, 248, 0.9)" strokeWidth="3" fill="none" strokeDasharray="250" strokeDashoffset="250" />
          </svg>
        )}

        {annotationMode === 'underline' && (
          <svg className="teaching-cursor-annotation-underline" viewBox="0 0 100 20" width="100" height="20">
            <path d="M 10 10 Q 50 15 90 5" stroke="rgba(244, 63, 94, 0.9)" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="100" strokeDashoffset="100" />
          </svg>
        )}

        {annotationMode === 'arrow' && (
          <svg className="teaching-cursor-annotation-arrow" viewBox="0 0 100 100" width="100" height="100">
            <path d="M 20 80 Q 30 40 70 30" stroke="rgba(56, 189, 248, 0.9)" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="150" strokeDashoffset="150" />
            <path d="M 50 20 L 75 28 L 65 50" stroke="rgba(56, 189, 248, 0.9)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset="100" />
          </svg>
        )}

        {/* Drag Ghost Badge */}
        {draggingGate && (
          <div className="teaching-cursor-drag-ghost" data-testid="teaching-cursor-ghost">
            {draggingGate}
          </div>
        )}

        {/* Teacher Label */}
        {label && (
          <div className="teaching-cursor-label">
            {label}
          </div>
        )}
      </div>
    );
  }
);

TeachingCursor.displayName = 'TeachingCursor';
export default TeachingCursor;

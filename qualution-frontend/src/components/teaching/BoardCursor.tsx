/**
 * BoardCursor.tsx
 *
 * PHASE 2: The Teacher Cursor — visual component for the QUALUTION Teaching Board.
 *
 * Responsibilities:
 * - Renders a single academic pointer cursor inside the TeachingBoard cursor layer.
 * - Positions itself using percentage-based coordinates derived from the board's
 *   logical coordinate system (1280 × 720), so it stays correctly placed on any
 *   viewport size or DPR without manual recalculation.
 * - Appearance is intentional and academic: a clean chalk-white arrow with a
 *   soft ambient glow — not a game cursor, not a cyberpunk UI element.
 * - Visibility is controlled externally via the `visible` prop.
 * - Does NOT move itself — position comes entirely from `useBoardCursor` state.
 * - Does NOT contain annotation, drag-ghost, or clicking logic (Phase 2 scope).
 */

import React from 'react';
import {
  DEFAULT_LOGICAL_WIDTH,
  DEFAULT_LOGICAL_HEIGHT,
} from '../../features/theory/boardCoordinates';
import './BoardCursor.css';

// ── Props ──────────────────────────────────────────────────────────────────

export interface BoardCursorProps {
  /** Current logical X position (board coordinate units). */
  x: number;
  /** Current logical Y position (board coordinate units). */
  y: number;
  /** Whether the cursor should be rendered. */
  visible: boolean;
  /** Whether a movement animation is actively in progress. */
  moving?: boolean;
  /** Logical width of the board (used to compute % positioning). Default: 1280 */
  logicalWidth?: number;
  /** Logical height of the board (used to compute % positioning). Default: 720 */
  logicalHeight?: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export const BoardCursor: React.FC<BoardCursorProps> = ({
  x,
  y,
  visible,
  moving = false,
  logicalWidth = DEFAULT_LOGICAL_WIDTH,
  logicalHeight = DEFAULT_LOGICAL_HEIGHT,
}) => {
  if (!visible) return null;

  // Convert logical coordinates to percentage of stage dimensions.
  // This means the cursor position is always correct relative to the stage
  // regardless of the physical viewport scale — no viewport subscription needed.
  const leftPercent = (x / logicalWidth) * 100;
  const topPercent = (y / logicalHeight) * 100;

  return (
    <div
      className={`board-cursor${moving ? ' board-cursor--moving' : ''}`}
      data-testid="board-cursor"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
      }}
      aria-hidden="true"
    >
      {/* Academic chalk-white arrow pointer */}
      <svg
        className="board-cursor__arrow"
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="26"
        viewBox="0 0 22 26"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="bc-drop-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0.5"
              dy="1"
              stdDeviation="1"
              floodColor="rgba(0,0,0,0.6)"
              floodOpacity="1"
            />
          </filter>
        </defs>
        {/*
          Classic OS-style arrow cursor path.
          Hotspot is at the tip (top-left corner of the arrow).
          The shape is clean, minimal, and readable at all board scales.
        */}
        <path
          d="M3 1.5 L3 20 L7.5 15.5 L11.5 22.5 L14 21.5 L10 14.5 L16.5 14.5 Z"
          fill="rgba(240, 240, 240, 0.97)"
          stroke="rgba(30, 30, 30, 0.85)"
          strokeWidth="1.25"
          strokeLinejoin="round"
          filter="url(#bc-drop-shadow)"
        />
      </svg>

      {/* Soft ambient presence glow (non-distracting, educational) */}
      <div className="board-cursor__glow" aria-hidden="true" />
    </div>
  );
};

BoardCursor.displayName = 'BoardCursor';
export default BoardCursor;

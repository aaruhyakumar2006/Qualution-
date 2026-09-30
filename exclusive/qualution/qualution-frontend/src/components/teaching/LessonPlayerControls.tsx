/**
 * LessonPlayerControls.tsx
 *
 * PHASE 10: Minimal lesson playback controls.
 *
 * Renders:
 *   ▶/⏸  play/pause toggle
 *   ↺    restart button
 *   ━━━━━●━━━━━  read-only progress bar
 *   00:18 / 00:42  time display
 *
 * Design:
 * - Receives state and callbacks from useLessonPlayer — owns no internal clock.
 * - Progress bar is read-only in Phase 10 (seeking not yet implemented).
 * - Minimal, non-distracting UI that sits below the teaching board.
 * - Accessible: buttons have aria-labels, progress has role="progressbar".
 */

import React, { useCallback } from 'react';
import type { PlayerState } from '../../features/theory/lessonPlayer';
import './LessonPlayerControls.css';

// ── Time formatting ────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface LessonPlayerControlsProps {
  state: PlayerState;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  /** Optional CSS class for the outer container. */
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export const LessonPlayerControls: React.FC<LessonPlayerControlsProps> = ({
  state,
  onPlay,
  onPause,
  onRestart,
  className = '',
}) => {
  const { playback, currentTimeMs, durationMs, progress } = state;

  const isPlaying = playback === 'PLAYING';
  const isCompleted = playback === 'COMPLETED';
  const isIdle = playback === 'IDLE';
  const canPlay = !isPlaying && (isIdle || playback === 'PAUSED' || isCompleted);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  const progressPercent = Math.min(100, Math.max(0, progress * 100));
  const currentLabel = formatTime(currentTimeMs);
  const durationLabel = formatTime(durationMs);

  return (
    <div
      className={`lesson-player-controls ${className}`.trim()}
      data-testid="lesson-player-controls"
      data-playback={playback}
    >
      {/* Play / Pause button */}
      <button
        className="lpc-btn lpc-btn--play"
        onClick={handlePlayPause}
        aria-label={isPlaying ? 'Pause lesson' : 'Play lesson'}
        data-testid="lpc-play-pause"
        disabled={durationMs === 0}
        type="button"
      >
        {isPlaying ? (
          // Pause icon
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <rect x="3" y="2" width="4" height="12" rx="1" />
            <rect x="9" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          // Play icon
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4 2.5 L13 8 L4 13.5 Z" />
          </svg>
        )}
      </button>

      {/* Restart button */}
      <button
        className="lpc-btn lpc-btn--restart"
        onClick={onRestart}
        aria-label="Restart lesson"
        data-testid="lpc-restart"
        disabled={durationMs === 0}
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 7 A5 5 0 1 1 4.5 11.5" />
          <polyline points="2,4 2,7 5,7" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        className="lpc-progress"
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Lesson progress: ${currentLabel} of ${durationLabel}`}
        data-testid="lpc-progress"
      >
        <div className="lpc-progress__track">
          <div
            className="lpc-progress__fill"
            style={{ width: `${progressPercent}%` }}
            data-testid="lpc-progress-fill"
          />
          <div
            className="lpc-progress__thumb"
            style={{ left: `${progressPercent}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Time display */}
      <div
        className="lpc-time"
        data-testid="lpc-time"
        aria-label={`${currentLabel} of ${durationLabel}`}
      >
        <span className="lpc-time__current">{currentLabel}</span>
        <span className="lpc-time__sep" aria-hidden="true"> / </span>
        <span className="lpc-time__total">{durationLabel}</span>
      </div>

      {/* Completed badge */}
      {isCompleted && (
        <div className="lpc-completed" data-testid="lpc-completed" aria-live="polite">
          ✓ Complete
        </div>
      )}
    </div>
  );
};

LessonPlayerControls.displayName = 'LessonPlayerControls';
export default LessonPlayerControls;

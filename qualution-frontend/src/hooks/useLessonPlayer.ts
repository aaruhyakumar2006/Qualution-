/**
 * useLessonPlayer.ts
 *
 * PHASE 10: React hook bridging LessonPlayer to React state.
 *
 * Provides a stable, ref-based API so the player instance is never
 * recreated on re-renders. React state is updated only when PlayerState
 * actually changes, preventing unnecessary re-renders.
 *
 * Usage:
 * ```tsx
 * const { state, play, pause, restart, load } = useLessonPlayer();
 *
 * useEffect(() => {
 *   load(lessonDoc, paintCallback);
 * }, []);
 * ```
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { LessonPlayer, type PlayerState, type PlayerLoadResult } from '../features/theory/lessonPlayer';
import type { PaintCallback } from '../features/theory/TheoryBoardEngine';
import type { TTSProvider } from '../features/teaching/speechService';

const INITIAL_STATE: PlayerState = {
  playback: 'IDLE',
  currentTimeMs: 0,
  durationMs: 0,
  progress: 0,
  currentStepIndex: 0,
  totalSteps: 0,
  cursorX: 600,
  cursorY: 350,
  cursorVisible: false,
};

export interface UseLessonPlayerOptions {
  speech?: TTSProvider;
}

export interface UseLessonPlayerResult {
  /** Current player state (reactive). */
  state: PlayerState;
  /** Load a lesson document. Returns load result synchronously. */
  load: (raw: unknown, paint: PaintCallback) => PlayerLoadResult;
  /** Start or resume playback. */
  play: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Restart from the beginning. */
  restart: () => void;
}

export function useLessonPlayer(opts?: UseLessonPlayerOptions): UseLessonPlayerResult {
  const playerRef = useRef<LessonPlayer | null>(null);
  const [state, setState] = useState<PlayerState>(INITIAL_STATE);

  // Create the player once
  if (playerRef.current === null) {
    playerRef.current = new LessonPlayer({ speech: opts?.speech });
  }

  // Subscribe to player state changes
  useEffect(() => {
    if (playerRef.current === null) {
      playerRef.current = new LessonPlayer({ speech: opts?.speech });
    }
    const player = playerRef.current;
    const unsub = player.subscribe((s) => setState(s));
    return () => {
      unsub();
      player.dispose();
      playerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback((raw: unknown, paint: PaintCallback): PlayerLoadResult => {
    return playerRef.current!.load(raw, paint);
  }, []);

  const play = useCallback(() => {
    playerRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const restart = useCallback(() => {
    playerRef.current?.restart();
  }, []);

  return { state, load, play, pause, restart };
}

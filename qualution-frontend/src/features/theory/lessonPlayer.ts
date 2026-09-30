/**
 * lessonPlayer.ts
 *
 * PHASE 10: Deterministic Timeline + Playback Engine — Lesson Player.
 *
 * `LessonPlayer` is the single orchestrator for Phase 10. It wires together:
 *
 *   LessonClock    — one authoritative time source
 *   LessonTimeline — pre-computed action schedule
 *   LessonEngine   — Phase 9 engine (validate → parse → TheoryBoardEngine)
 *
 * Pipeline:
 *
 *   LESSON JSON
 *     ↓ LessonEngine.load()
 *   VALIDATOR + PARSER
 *     ↓ buildTimeline()
 *   LESSON TIMELINE  (startMs, durationMs per action)
 *     ↓ LessonClock.tick() on every RAF frame
 *   CENTRAL CLOCK    (currentTimeMs, isPlaying)
 *     ↓ LessonEngine.play() / pause() / restart()
 *   ACTION EXECUTOR  (TheoryBoardEngine)
 *     ↓ PaintCallback
 *   BOARD / CURSOR / DRAWING / MATH / CAPTIONS
 *
 * ── Determinism ───────────────────────────────────────────────────────────
 *
 * The clock drives the engine — not the other way around.
 * `TheoryBoardEngine` still owns action execution (its existing `_wait()` loop
 * is the executor). `LessonPlayer` owns the clock and exposes `PlayerState`
 * (currentTimeMs, duration, progress, playback) to the UI.
 *
 * ── Pause / Resume ────────────────────────────────────────────────────────
 *
 * pause():  clock.pause() + engine.pause()
 *           → clock freezes, engine's _wait() resolves early, board freezes
 * play():   clock.play() + engine.play()
 *           → clock resumes from pausedAt, engine re-enters execution loop
 *
 * ── Restart ───────────────────────────────────────────────────────────────
 *
 * restart(): clock.reset() + engine.restart()
 *            → clock back to 0, engine clears board and resets to IDLE
 *
 * ── Seeking ───────────────────────────────────────────────────────────────
 *
 * Seeking is NOT implemented in Phase 10. The progress bar is read-only.
 * The clock exposes `seek()` for future use, but the engine does not yet
 * support state reconstruction at arbitrary times.
 * See Phase 10 limitations in the implementation report.
 *
 * ── RAF loop ──────────────────────────────────────────────────────────────
 *
 * The player owns one `requestAnimationFrame` loop (or a test-injectable
 * tick function). On each frame it calls `clock.tick()` and notifies
 * subscribers with the updated `PlayerState`. The engine runs its own
 * async loop independently — the RAF loop only reads the clock for the UI.
 */

import { LessonClock } from './lessonClock';
import { LessonEngine } from './lessonEngine';
import { buildTimeline, timelineDuration, lessonProgress, activeStepIndex } from './lessonTimeline';
import { parseLesson } from './lessonParser';
import { validateLesson, formatValidationErrors, type LessonValidationError } from './lessonValidator';
import { NarrationScheduler } from './narrationScheduler';
import type { PaintCallback } from './TheoryBoardEngine';
import type { BoardPlaybackState } from './boardTypes';
import type { TTSProvider } from '../teaching/speechService';
import { BrowserSpeechService } from '../teaching/speechService';

// ── PlayerState ────────────────────────────────────────────────────────────

export interface PlayerState {
  /** Mirrors BoardPlaybackState from the engine. */
  playback: BoardPlaybackState;
  /** Current lesson time in ms. */
  currentTimeMs: number;
  /** Total lesson duration in ms. */
  durationMs: number;
  /** Progress fraction 0.0–1.0. */
  progress: number;
  /** Current step index (0-based). -1 before play. */
  currentStepIndex: number;
  /** Total number of steps. */
  totalSteps: number;
  /** Cursor logical position. */
  cursorX: number;
  cursorY: number;
  cursorVisible: boolean;
}

export type PlayerSubscriber = (state: PlayerState) => void;

export interface PlayerLoadResult {
  ok: boolean;
  errors: string[];
  /** Total lesson duration in ms (0 if load failed). */
  durationMs: number;
  /** Detailed validation errors (if available). */
  validationErrors?: LessonValidationError[];
  /** Validation warnings (non-critical issues). */
  warnings?: string[];
}

// ── LessonPlayer ───────────────────────────────────────────────────────────

export class LessonPlayer {
  private _engine: LessonEngine;
  private _clock: LessonClock;
  private _narration: NarrationScheduler;
  private _timeline: ReturnType<typeof buildTimeline> = [];
  private _durationMs = 0;
  private _subscribers: Set<PlayerSubscriber> = new Set();
  private _rafHandle: number | null = null;
  private _rafFn: ((cb: FrameRequestCallback) => number) | null = null;
  private _cancelRafFn: ((id: number) => void) | null = null;
  private _loaded = false;

  constructor(opts?: {
    speech?: TTSProvider;
    /** Inject requestAnimationFrame for testing. */
    raf?: (cb: FrameRequestCallback) => number;
    /** Inject cancelAnimationFrame for testing. */
    cancelRaf?: (id: number) => void;
    /** Inject clock now() for testing. */
    now?: () => number;
  }) {
    const speech = opts?.speech ?? new BrowserSpeechService();
    this._engine = new LessonEngine(speech);
    this._clock = new LessonClock({ durationMs: 0, now: opts?.now });
    this._narration = new NarrationScheduler(speech);
    this._rafFn = opts?.raf ?? null;
    this._cancelRafFn = opts?.cancelRaf ?? null;
  }

  // ── Load ──────────────────────────────────────────────────────────────

  /**
   * Validate, parse, build timeline, and load the lesson.
   * Returns `{ ok, errors, durationMs, validationErrors, warnings }`.
   *
   * PHASE 15: Enhanced with comprehensive validation pipeline:
   * 1. JSON parsing (safe, no crashes)
   * 2. Size validation (80 KB limit)
   * 3. Schema validation (structure, types)
   * 4. Numeric safety (NaN, Infinity, ranges)
   * 5. Action count validation (5000 limit)
   *
   * If validation fails, the player remains in a safe, usable state.
   * The application will NOT crash due to invalid lesson data.
   */
  public load(raw: unknown, paint: PaintCallback): PlayerLoadResult {
    // Stop any running playback
    this._stopRaf();

    // Reset to safe initial state
    this._loaded = false;
    this._timeline = [];
    this._durationMs = 0;

    // PHASE 15: Comprehensive validation pipeline
    const validation = validateLesson(raw);

    if (!validation.valid) {
      // Validation failed — return detailed error information
      const criticalErrors = validation.errors.filter((e) => e.severity === 'CRITICAL');
      const warnings = validation.errors.filter((e) => e.severity === 'WARNING');

      // Format errors for display
      const errorMessages = criticalErrors.map((e) => {
        let msg = e.message;
        if (e.lessonId) msg = `Lesson "${e.lessonId}": ${msg}`;
        if (e.stepId) msg = `Step "${e.stepId}": ${msg}`;
        if (e.actionIndex !== undefined) msg = `Action[${e.actionIndex}]: ${msg}`;
        return msg;
      });

      // Log detailed validation report in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error(
          '[LessonPlayer] Validation failed:\n',
          formatValidationErrors(validation.errors, 'developer')
        );
        console.error('[LessonPlayer] Lesson metadata:', validation.meta);
      }

      return {
        ok: false,
        errors: errorMessages.length > 0 ? errorMessages : ['Lesson validation failed.'],
        durationMs: 0,
        validationErrors: criticalErrors,
        warnings: warnings.map((w) => w.message),
      };
    }

    // Validation succeeded — proceed with parsing
    let script;
    try {
      script = parseLesson(validation.lesson);
    } catch (e) {
      const errMsg = (e as Error).message;
      console.error('[LessonPlayer] Parse error:', errMsg);
      return {
        ok: false,
        errors: [`Lesson parsing failed: ${errMsg}`],
        durationMs: 0,
      };
    }

    // Build timeline from the parsed script
    try {
      this._timeline = buildTimeline(script);
      this._durationMs = timelineDuration(this._timeline);
    } catch (e) {
      const errMsg = (e as Error).message;
      console.error('[LessonPlayer] Timeline build error:', errMsg);
      return {
        ok: false,
        errors: [`Timeline construction failed: ${errMsg}`],
        durationMs: 0,
      };
    }

    // Reset clock with new duration
    this._clock.setDuration(this._durationMs);
    this._clock.reset();

    // Load narration cues from the timeline
    try {
      this._narration.load(this._timeline);
    } catch (e) {
      // Narration load failure is non-critical — log warning and continue
      console.warn('[LessonPlayer] Narration load failed (non-critical):', (e as Error).message);
    }

    // Load into engine
    const result = this._engine.load(raw, paint);
    if (!result.ok) {
      return {
        ok: false,
        errors: result.errors,
        durationMs: 0,
      };
    }

    // Success — mark as loaded and notify
    this._loaded = true;
    this._notify();

    // Collect any validation warnings
    const warnings = validation.errors
      .filter((e) => e.severity === 'WARNING')
      .map((w) => w.message);

    return {
      ok: true,
      errors: [],
      durationMs: this._durationMs,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // ── Playback controls ─────────────────────────────────────────────────

  /**
   * Start or resume playback.
   *
   * PHASE 15: Safe to call multiple times. Will not start if no lesson loaded.
   */
  public play(): void {
    if (!this._loaded) {
      console.warn('[LessonPlayer] Cannot play: no lesson loaded.');
      return;
    }
    this._clock.play();
    this._engine.play();
    this._narration.play();
    this._startRaf();
    this._notify();
  }

  /**
   * Pause playback.
   *
   * PHASE 15: Safe to call multiple times or when already paused.
   */
  public pause(): void {
    if (!this._loaded) return;
    this._clock.pause();
    this._engine.pause();
    this._narration.pause();
    this._stopRaf();
    this._notify();
  }

  /**
   * Restart from the beginning.
   *
   * PHASE 15: Complete reset to initial state. Safe to call at any time.
   * Guarantees deterministic behavior — same initial state every time.
   */
  public restart(): void {
    if (!this._loaded) {
      console.warn('[LessonPlayer] Cannot restart: no lesson loaded.');
      return;
    }
    this._stopRaf();
    this._clock.reset();
    this._engine.restart();
    this._narration.restart();
    this._notify();
  }

  // ── State ─────────────────────────────────────────────────────────────

  public getState(): PlayerState {
    return this._buildState();
  }

  public subscribe(fn: PlayerSubscriber): () => void {
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  /**
   * Clean up all resources.
   *
   * PHASE 15: Safe to call multiple times. Ensures complete cleanup.
   */
  public dispose(): void {
    this._stopRaf();
    this._engine.dispose();
    this._clock.dispose();
    this._narration.dispose();
    this._subscribers.clear();
    this._loaded = false;
    this._timeline = [];
    this._durationMs = 0;
  }

  // ── Internal: RAF loop ────────────────────────────────────────────────

  private _startRaf(): void {
    if (this._rafHandle !== null) return; // already running
    const raf = this._rafFn ?? (typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame.bind(window)
      : null);
    if (!raf) return; // no RAF available (pure Node test environment)

    const loop = () => {
      const t = this._clock.tick();
      this._narration.tick(t);
      this._notify();

      // Auto-stop when clock reaches end
      if (!this._clock.isPlaying) {
        // Clock auto-stopped at end — sync engine state
        this._narration.complete();
        this._rafHandle = null;
        this._notify();
        return;
      }

      this._rafHandle = raf(loop);
    };

    this._rafHandle = raf(loop);
  }

  private _stopRaf(): void {
    if (this._rafHandle === null) return;
    const cancel = this._cancelRafFn ?? (typeof cancelAnimationFrame !== 'undefined'
      ? cancelAnimationFrame.bind(window)
      : null);
    if (cancel) cancel(this._rafHandle);
    this._rafHandle = null;
  }

  // ── Internal: state builder ───────────────────────────────────────────

  private _buildState(): PlayerState {
    const engineState = this._engine.getState();
    const t = this._clock.currentTimeMs;
    const progress = lessonProgress(this._timeline, t);
    const stepIdx = activeStepIndex(this._timeline, t);

    return {
      playback: engineState.playback,
      currentTimeMs: t,
      durationMs: this._durationMs,
      progress,
      currentStepIndex: stepIdx === -1 ? engineState.currentStepIndex : stepIdx,
      totalSteps: engineState.totalSteps,
      cursorX: engineState.cursorX,
      cursorY: engineState.cursorY,
      cursorVisible: engineState.cursorVisible,
    };
  }

  private _notify(): void {
    const state = this._buildState();
    this._subscribers.forEach((fn) => fn(state));
  }
}

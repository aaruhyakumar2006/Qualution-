/**
 * lessonClock.ts
 *
 * PHASE 10: Central Deterministic Lesson Clock.
 *
 * Single source of truth for lesson playback timing.
 * Driven by requestAnimationFrame.
 *
 * Guarantees:
 * - Exactly ONE animation loop running at any time.
 * - Idempotent play() and pause() calls.
 * - Accurate time accumulation on pause/resume without time acceleration.
 * - onComplete() fires exactly once per run when reaching duration.
 */

import type { LessonTimeline } from './lessonTimeline';

export type PlaybackState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'COMPLETED';

export type TickCallback = (currentTimeMs: number, progress: number, state: PlaybackState) => void;
export type CompleteCallback = () => void;
export type StateChangeCallback = (state: PlaybackState) => void;

export class LessonClock {
  private _state: PlaybackState = 'IDLE';
  private _currentTimeMs: number = 0;
  private _durationMs: number = 0;
  private _timeline: LessonTimeline | null = null;

  private _rafId: number | null = null;
  private _lastFrameTime: number = 0;
  private _completedFired: boolean = false;
  private _tickListeners: Set<TickCallback> = new Set();
  private _completeListeners: Set<CompleteCallback> = new Set();
  private _stateChangeListeners: Set<StateChangeCallback> = new Set();
  private _nowFn: () => number = () => performance.now();

  constructor(timelineOrOpts?: LessonTimeline | { durationMs?: number; now?: () => number }) {
    if (timelineOrOpts) {
      if ('actions' in timelineOrOpts) {
        this.loadTimeline(timelineOrOpts);
      } else {
        if (timelineOrOpts.durationMs !== undefined) {
          this._durationMs = timelineOrOpts.durationMs;
        }
        if (timelineOrOpts.now) {
          this._nowFn = timelineOrOpts.now;
        }
      }
    }
  }

  // ── Public Accessors ─────────────────────────────────────────────────────

  public get state(): PlaybackState {
    return this._state;
  }

  public get currentTimeMs(): number {
    return this._currentTimeMs;
  }

  public get durationMs(): number {
    return this._durationMs;
  }

  public setDuration(durationMs: number): void {
    this._durationMs = durationMs;
  }

  public get progress(): number {
    if (this._durationMs <= 0) return 0;
    return Math.min(1, Math.max(0, this._currentTimeMs / this._durationMs));
  }

  public get timeline(): LessonTimeline | null {
    return this._timeline;
  }

  // ── Timeline Loading ─────────────────────────────────────────────────────

  public loadTimeline(timeline: LessonTimeline): void {
    this.stopRaf();
    this._timeline = timeline;
    this._durationMs = timeline.totalDurationMs;
    this._currentTimeMs = 0;
    this._completedFired = false;
    this.setState('IDLE');
    this.notifyTick();
  }

  // ── Controls ─────────────────────────────────────────────────────────────

  public play(): void {
    if (!this._timeline) return;

    if (this._state === 'PLAYING') {
      return; // Already playing, do nothing
    }

    if (this._state === 'COMPLETED' || this._currentTimeMs >= this._durationMs) {
      this._currentTimeMs = 0;
      this._completedFired = false;
    }

    this._lastFrameTime = performance.now();
    this.setState('PLAYING');
    this.startRaf();
  }

  public pause(): void {
    if (this._state !== 'PLAYING') return;

    this.stopRaf();
    this.setState('PAUSED');
    this.notifyTick();
  }

  public resume(): void {
    if (this._state !== 'PAUSED') return;

    this._lastFrameTime = performance.now();
    this.setState('PLAYING');
    this.startRaf();
  }

  public restart(): void {
    this.stopRaf();
    this._currentTimeMs = 0;
    this._completedFired = false;
    this.setState('IDLE');
    this.notifyTick();
    this.play();
  }

  public reset(): void {
    this.stopRaf();
    this._currentTimeMs = 0;
    this._completedFired = false;
    this.setState('IDLE');
    this.notifyTick();
  }

  public seek(timeMs: number): void {
    const clamped = Math.max(0, Math.min(this._durationMs, timeMs));
    this._currentTimeMs = clamped;
    if (this._currentTimeMs < this._durationMs) {
      this._completedFired = false;
      if (this._state === 'COMPLETED') {
        this.setState('PAUSED');
      }
    }
    this.notifyTick();
  }

  public destroy(): void {
    this.stopRaf();
    this._tickListeners.clear();
    this._completeListeners.clear();
    this._stateChangeListeners.clear();
    this._timeline = null;
  }

  public dispose(): void {
    this.destroy();
  }

  // ── Event Subscriptions ──────────────────────────────────────────────────

  public onTick(cb: TickCallback): () => void {
    this._tickListeners.add(cb);
    return () => this._tickListeners.delete(cb);
  }

  public onComplete(cb: CompleteCallback): () => void {
    this._completeListeners.add(cb);
    return () => this._completeListeners.delete(cb);
  }

  public onStateChange(cb: StateChangeCallback): () => void {
    this._stateChangeListeners.add(cb);
    return () => this._stateChangeListeners.delete(cb);
  }

  // ── Internal Clock Loop ──────────────────────────────────────────────────

  private startRaf(): void {
    if (this._rafId !== null) return;

    const frame = (now: number) => {
      if (this._state !== 'PLAYING') {
        this._rafId = null;
        return;
      }

      const deltaMs = Math.max(0, now - this._lastFrameTime);
      this._lastFrameTime = now;

      this._currentTimeMs = Math.min(this._durationMs, this._currentTimeMs + deltaMs);
      this.notifyTick();

      if (this._state === 'PLAYING' && this._currentTimeMs >= this._durationMs) {
        this.stopRaf();
        this.setState('COMPLETED');
        if (!this._completedFired) {
          this._completedFired = true;
          this.notifyComplete();
        }
        return;
      }

      this._rafId = requestAnimationFrame(frame);
    };

    this._rafId = requestAnimationFrame(frame);
  }

  private stopRaf(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  private setState(newState: PlaybackState): void {
    if (this._state === newState) return;
    this._state = newState;
    this._stateChangeListeners.forEach((cb) => cb(newState));
  }

  private notifyTick(): void {
    const current = this._currentTimeMs;
    const prog = this.progress;
    const st = this._state;
    this._tickListeners.forEach((cb) => cb(current, prog, st));
  }

  private notifyComplete(): void {
    this._completeListeners.forEach((cb) => cb());
  }
}

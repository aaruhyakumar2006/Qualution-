/**
 * narrationScheduler.ts
 *
 * PHASE 11: Narration + TTS Synchronization.
 *
 * `NarrationScheduler` bridges the central `LessonClock` and the existing
 * `TTSProvider` (BrowserSpeechService / ElevenLabsSpeechService).
 *
 * Design:
 * - One authoritative clock — no second timer, no second playback engine.
 * - Narration cues are derived from the deterministic `LessonTimeline`.
 * - On every clock tick the scheduler checks which cue should be active and
 *   fires speech exactly once per cue.
 * - Pause/resume/restart delegate directly to the TTSProvider.
 * - Graceful fallback: if TTS is unavailable the lesson still plays visually.
 */

import type { TTSProvider, SpeechOptions } from '../teaching/speechService';
import type { LessonTimeline, TimelineAction } from './lessonTimeline';
import type { NarrateAction } from './teachingActions';

export interface NarrationCue {
  /** Unique ID for cue tracking */
  id: string;
  /** Absolute start time in ms (from the lesson timeline). */
  startMs: number;
  /** The narration text to speak. */
  text: string;
  /** Voice options */
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  /** Whether this cue has already been fired in the current playthrough. */
  fired: boolean;
}

export class NarrationScheduler {
  private _speech: TTSProvider;
  private _cues: NarrationCue[] = [];
  private _active = false;
  private _enabled = true;
  private _currentCueIndex = -1;

  constructor(speech: TTSProvider) {
    this._speech = speech;
  }

  // ── Setup ──────────────────────────────────────────────────────────────

  /**
   * Load narration cues from the pre-built timeline or array of timeline actions.
   * Extracts all NARRATE actions and records their startMs.
   * Resets all fired flags.
   */
  public load(timeline: LessonTimeline | TimelineAction[]): void {
    const actions = Array.isArray(timeline) ? timeline : timeline.actions;
    this._cues = actions
      .filter((entry): entry is TimelineAction & { action: NarrateAction } =>
        entry.action.kind === 'NARRATE'
      )
      .map((entry, idx) => ({
        id: entry.id ?? `cue-${idx}`,
        startMs: entry.startTimeMs,
        text: (entry.action as NarrateAction).text,
        voice: (entry.action as NarrateAction).voice,
        rate: (entry.action as NarrateAction).rate,
        pitch: (entry.action as NarrateAction).pitch,
        volume: (entry.action as NarrateAction).volume,
        fired: false,
      }));
    this._active = false;
    this._currentCueIndex = -1;
  }

  // ── Narration Enable / Disable ─────────────────────────────────────────

  public isEnabled(): boolean {
    return this._enabled && !this._speech.isMuted();
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    if (!enabled) {
      this._speech.stop();
    }
  }

  public isAvailable(): boolean {
    return this._speech.isAvailable();
  }

  // ── Playback controls ──────────────────────────────────────────────────

  /** Called when the lesson clock starts playing. */
  public play(): void {
    this._active = true;
    if (this._enabled && this._speech.isAvailable()) {
      this._speech.resume();
    }
  }

  /** Called when the lesson clock pauses. */
  public pause(): void {
    this._active = false;
    if (this._speech.isAvailable()) {
      this._speech.pause();
    }
  }

  /** Called when the lesson clock resumes. */
  public resume(): void {
    this._active = true;
    if (this._enabled && this._speech.isAvailable()) {
      this._speech.resume();
    }
  }

  /** Called on restart — stop speech and reset all cues. */
  public restart(): void {
    this._active = false;
    this._speech.stop();
    this._currentCueIndex = -1;
    for (const cue of this._cues) {
      cue.fired = false;
    }
  }

  /** Called on reset to initial state. */
  public reset(): void {
    this.restart();
  }

  /** Called when the lesson completes. */
  public complete(): void {
    this._active = false;
  }

  /** Release all resources. */
  public dispose(): void {
    this._active = false;
    this._speech.stop();
    this._cues = [];
    this._currentCueIndex = -1;
  }

  // ── Tick ───────────────────────────────────────────────────────────────

  /**
   * Called on every clock tick with the current lesson time.
   * Fires any narration cues whose startMs has been reached.
   *
   * Speech duration never controls the lesson clock. The visual lesson remains
   * deterministic.
   */
  public tick(currentTimeMs: number): void {
    if (!this._active) return;

    for (let i = 0; i < this._cues.length; i++) {
      const cue = this._cues[i];
      if (!cue.fired && currentTimeMs >= cue.startMs) {
        cue.fired = true;
        this._currentCueIndex = i;
        if (this._enabled) {
          this._speak(cue);
        }
      }
    }
  }

  // ── Internal ───────────────────────────────────────────────────────────

  private _speak(cue: NarrationCue): void {
    if (!cue.text.trim()) return;
    if (!this._speech.isAvailable()) return;

    const options: SpeechOptions = {
      rate: cue.rate ?? 0.95,
      pitch: cue.pitch ?? 1.0,
      volume: cue.volume ?? 1.0,
      onError: () => {
        // Graceful fallback: speech error does not affect visual lesson
      },
    };

    this._speech.speak(cue.text, options).catch(() => {
      // Graceful fallback: promise rejection does not affect visual lesson
    });
  }

  // ── Accessors (for testing) ────────────────────────────────────────────

  /** @internal */
  public getCues(): readonly NarrationCue[] {
    return this._cues;
  }

  /** @internal */
  public isActive(): boolean {
    return this._active;
  }

  /** @internal */
  public getCurrentCueIndex(): number {
    return this._currentCueIndex;
  }
}


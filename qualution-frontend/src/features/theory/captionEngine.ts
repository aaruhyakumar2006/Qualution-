/**
 * captionEngine.ts
 *
 * PHASE 7: Teaching Caption Engine — Pure TypeScript.
 *
 * Manages a list of CaptionEntry records and computes which are active
 * at a given elapsed time. Completely separate from board content.
 *
 * Design:
 * - No React, no DOM, no side effects.
 * - Deterministic: same inputs always produce the same output.
 * - The engine holds a clock (elapsed ms) that callers advance via tick().
 * - Subscribers are notified whenever the active set changes.
 *
 * Coordinate system for position: normalised 0–1 fractions of the
 * caption container (not board logical units — captions are DOM overlays).
 */

// ── Caption Data Model ─────────────────────────────────────────────────────

export type CaptionAlign = 'left' | 'center' | 'right';
export type CaptionAppear = 'fade' | 'instant';
export type CaptionPosition = 'top' | 'center' | 'bottom';

export interface CaptionEntry {
  /** Stable unique identifier. */
  id: string;
  /** The text to display. */
  text: string;
  /**
   * Time in ms (relative to the caption clock) at which this caption
   * becomes active. Default: 0 (active from the start).
   */
  startMs: number;
  /**
   * How long the caption stays visible in ms.
   * 0 = stays until reset() is called.
   */
  durationMs: number;
  /**
   * Vertical position preset.
   * Default: 'bottom'
   */
  position?: CaptionPosition;
  /**
   * Font size in px. Default: 15.
   */
  fontSize?: number;
  /**
   * Text alignment. Default: 'center'.
   */
  align?: CaptionAlign;
  /**
   * Appear/disappear behaviour. Default: 'fade'.
   */
  appear?: CaptionAppear;
}

// ── Active Caption (what the renderer receives) ────────────────────────────

export interface ActiveCaption extends Required<CaptionEntry> {
  /**
   * Opacity 0–1 driven by the appear animation.
   * 'instant' captions are always 1 when active.
   * 'fade' captions ramp up over FADE_MS and ramp down over FADE_MS.
   */
  opacity: number;
}

// ── Engine ─────────────────────────────────────────────────────────────────

export type CaptionSubscriber = (active: ActiveCaption[]) => void;

/** Duration of the fade-in / fade-out ramp in ms. */
export const CAPTION_FADE_MS = 180;

const DEFAULTS = {
  position: 'bottom' as CaptionPosition,
  fontSize: 15,
  align: 'center' as CaptionAlign,
  appear: 'fade' as CaptionAppear,
};

export class CaptionEngine {
  private entries: CaptionEntry[] = [];
  private elapsedMs = 0;
  private subscribers: Set<CaptionSubscriber> = new Set();

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Replace the full caption list and reset the clock to 0.
   * Notifies subscribers immediately.
   */
  public load(entries: CaptionEntry[]): void {
    this.entries = entries.map((e) => ({ ...e }));
    this.elapsedMs = 0;
    this._notify();
  }

  /**
   * Advance the clock by `deltaMs` milliseconds and notify subscribers
   * if the active set has changed.
   */
  public tick(deltaMs: number): void {
    if (deltaMs <= 0) return;
    this.elapsedMs += deltaMs;
    this._notify();
  }

  /**
   * Seek to an absolute time in ms.
   * Useful for scrubbing or synchronising with an external clock.
   */
  public seekTo(ms: number): void {
    this.elapsedMs = Math.max(0, ms);
    this._notify();
  }

  /**
   * Reset the clock to 0 and clear all captions.
   * Notifies subscribers.
   */
  public reset(): void {
    this.elapsedMs = 0;
    this.entries = [];
    this._notify();
  }

  /** Returns the current elapsed time in ms. */
  public getElapsed(): number {
    return this.elapsedMs;
  }

  /** Returns a snapshot of the currently active captions. */
  public getActive(): ActiveCaption[] {
    return this._computeActive(this.elapsedMs);
  }

  public subscribe(fn: CaptionSubscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  // ── Internal ───────────────────────────────────────────────────────────

  private _computeActive(now: number): ActiveCaption[] {
    const result: ActiveCaption[] = [];

    for (const entry of this.entries) {
      const start = entry.startMs;
      const dur = entry.durationMs;
      const end = dur === 0 ? Infinity : start + dur;

      if (now < start || now >= end) continue;

      const appear = entry.appear ?? DEFAULTS.appear;
      let opacity = 1;

      if (appear === 'fade') {
        const elapsed = now - start;
        const remaining = end === Infinity ? CAPTION_FADE_MS : end - now;
        const fadeIn = Math.min(1, elapsed / CAPTION_FADE_MS);
        const fadeOut = end === Infinity ? 1 : Math.min(1, remaining / CAPTION_FADE_MS);
        opacity = Math.min(fadeIn, fadeOut);
      }

      result.push({
        id: entry.id,
        text: entry.text,
        startMs: start,
        durationMs: dur,
        position: entry.position ?? DEFAULTS.position,
        fontSize: entry.fontSize ?? DEFAULTS.fontSize,
        align: entry.align ?? DEFAULTS.align,
        appear,
        opacity,
      });
    }

    return result;
  }

  private _notify(): void {
    const active = this._computeActive(this.elapsedMs);
    this.subscribers.forEach((fn) => fn(active));
  }
}

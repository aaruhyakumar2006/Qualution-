/**
 * narrationScheduler.test.ts
 *
 * PHASE 11: Unit tests for NarrationScheduler and TTS lifecycle.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NarrationScheduler } from './narrationScheduler';
import type { TTSProvider, SpeechOptions } from '../teaching/speechService';
import { buildLessonTimeline } from './lessonTimeline';
import type { TeachingAction } from './teachingActions';

class MockTTSProvider implements TTSProvider {
  public spokeTexts: string[] = [];
  public speakCallCount = 0;
  public pauseCallCount = 0;
  public resumeCallCount = 0;
  public stopCallCount = 0;
  public available = true;
  public muted = false;

  public async speak(text: string, _options?: SpeechOptions): Promise<void> {
    if (!this.available || this.muted) return;
    this.spokeTexts.push(text);
    this.speakCallCount++;
  }

  public pause(): void {
    this.pauseCallCount++;
  }

  public resume(): void {
    this.resumeCallCount++;
  }

  public stop(): void {
    this.stopCallCount++;
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.stop();
  }
}

describe('NarrationScheduler', () => {
  let mockTTS: MockTTSProvider;
  let scheduler: NarrationScheduler;

  beforeEach(() => {
    mockTTS = new MockTTSProvider();
    scheduler = new NarrationScheduler(mockTTS);
  });

  it('extracts NARRATE actions from timeline and calculates cue timestamps', () => {
    const actions: TeachingAction[] = [
      { kind: 'WRITE', id: 't1', text: 'Hello', x: 100, y: 100, durationMs: 1000 },
      { kind: 'NARRATE', text: 'Introduction speech', durationMs: 3000 },
      { kind: 'WRITE', id: 't2', text: 'World', x: 200, y: 200, durationMs: 1500 },
      { kind: 'NARRATE', text: 'Second explanation', durationMs: 2500 },
    ];

    const timeline = buildLessonTimeline(actions);
    scheduler.load(timeline);

    const cues = scheduler.getCues();
    expect(cues.length).toBe(2);
    expect(cues[0].text).toBe('Introduction speech');
    expect(cues[0].startMs).toBe(1000);
    expect(cues[0].fired).toBe(false);

    expect(cues[1].text).toBe('Second explanation');
    expect(cues[1].startMs).toBe(1000 + 3000 + 1500); // 5500
    expect(cues[1].fired).toBe(false);
  });

  it('fires cues at correct timeline times and never fires the same cue twice', () => {
    const actions: TeachingAction[] = [
      { kind: 'WRITE', id: 't1', text: 'Intro', x: 100, y: 100, durationMs: 1000 },
      { kind: 'NARRATE', text: 'First speech', durationMs: 2000 },
      { kind: 'NARRATE', text: 'Second speech', durationMs: 2000 },
    ];

    const timeline = buildLessonTimeline(actions);
    scheduler.load(timeline);
    scheduler.play();

    // Before first cue
    scheduler.tick(500);
    expect(mockTTS.speakCallCount).toBe(0);

    // At first cue startMs (1000)
    scheduler.tick(1000);
    expect(mockTTS.speakCallCount).toBe(1);
    expect(mockTTS.spokeTexts).toEqual(['First speech']);

    // Later in first cue interval (1500) -> should not re-fire
    scheduler.tick(1500);
    expect(mockTTS.speakCallCount).toBe(1);

    // At second cue startMs (3000)
    scheduler.tick(3000);
    expect(mockTTS.speakCallCount).toBe(2);
    expect(mockTTS.spokeTexts).toEqual(['First speech', 'Second speech']);
  });

  it('pauses and resumes TTS correctly without restarting sentence', () => {
    scheduler.play();
    expect(mockTTS.resumeCallCount).toBe(1);

    scheduler.pause();
    expect(mockTTS.pauseCallCount).toBe(1);
    expect(scheduler.isActive()).toBe(false);

    scheduler.resume();
    expect(mockTTS.resumeCallCount).toBe(2);
    expect(scheduler.isActive()).toBe(true);
  });

  it('stops speech and resets cues on restart', () => {
    const actions: TeachingAction[] = [
      { kind: 'NARRATE', text: 'Start speech', durationMs: 2000 },
    ];
    const timeline = buildLessonTimeline(actions);
    scheduler.load(timeline);
    scheduler.play();

    scheduler.tick(0);
    expect(mockTTS.speakCallCount).toBe(1);
    expect(scheduler.getCues()[0].fired).toBe(true);

    scheduler.restart();
    expect(mockTTS.stopCallCount).toBe(1);
    expect(scheduler.getCues()[0].fired).toBe(false);
    expect(scheduler.isActive()).toBe(false);

    // Play again from beginning
    scheduler.play();
    scheduler.tick(0);
    expect(mockTTS.speakCallCount).toBe(2);
    expect(scheduler.getCues()[0].fired).toBe(true);
  });

  it('respects narration enabled/disabled toggle without halting lesson timeline', () => {
    const actions: TeachingAction[] = [
      { kind: 'NARRATE', text: 'Muted speech', durationMs: 2000 },
    ];
    const timeline = buildLessonTimeline(actions);
    scheduler.load(timeline);

    // Disable narration
    scheduler.setEnabled(false);
    expect(scheduler.isEnabled()).toBe(false);

    scheduler.play();
    scheduler.tick(0);

    // Cue is marked fired so it consumes timeline without speaking
    expect(scheduler.getCues()[0].fired).toBe(true);
    expect(mockTTS.speakCallCount).toBe(0);
  });

  it('handles unavailable TTS gracefully without crashing', () => {
    mockTTS.available = false;

    const actions: TeachingAction[] = [
      { kind: 'NARRATE', text: 'Silent speech', durationMs: 2000 },
    ];
    const timeline = buildLessonTimeline(actions);
    scheduler.load(timeline);
    scheduler.play();

    expect(() => {
      scheduler.tick(0);
    }).not.toThrow();

    expect(mockTTS.speakCallCount).toBe(0);
  });

  it('cleans up properly on dispose', () => {
    scheduler.dispose();
    expect(mockTTS.stopCallCount).toBe(1);
    expect(scheduler.getCues().length).toBe(0);
    expect(scheduler.isActive()).toBe(false);
  });
});

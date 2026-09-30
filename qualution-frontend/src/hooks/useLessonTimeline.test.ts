import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLessonTimeline } from './useLessonTimeline';
import classicalBitLessonData from '../features/theory/lessons/declarative/classicalBitLesson.json';
import qubitLessonData from '../features/theory/lessons/declarative/qubitLesson.json';
import classicalBitToQubitLessonData from '../features/theory/lessons/declarative/classicalBitToQubitLesson.json';
import qubitSuperpositionCheckpointLessonData from '../features/theory/lessons/declarative/qubitSuperpositionCheckpointLesson.json';
import type { TTSProvider } from '../features/teaching/speechService';

class MockSpeechService implements TTSProvider {
  public spokeTexts: string[] = [];
  public pauseCount = 0;
  public resumeCount = 0;
  public stopCount = 0;
  private muted = false;

  public async speak(text: string): Promise<void> {
    if (!this.muted) {
      this.spokeTexts.push(text);
    }
  }

  public pause(): void {
    this.pauseCount++;
  }

  public resume(): void {
    this.resumeCount++;
  }

  public stop(): void {
    this.stopCount++;
  }

  public isAvailable(): boolean {
    return true;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.stop();
  }
}

describe('useLessonTimeline (Phase 10 & 11)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes in IDLE state with 0 currentTime and progress', () => {
    const { result } = renderHook(() => useLessonTimeline());
    expect(result.current.playbackState).toBe('IDLE');
    expect(result.current.currentTimeMs).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.currentLesson).toBeNull();
    expect(result.current.isNarrationEnabled).toBe(true);
  });

  it('loads a declarative JSON lesson and builds the timeline', () => {
    const { result } = renderHook(() => useLessonTimeline());

    act(() => {
      const loadRes = result.current.loadLesson(classicalBitLessonData);
      expect(loadRes.ok).toBe(true);
    });

    expect(result.current.currentLesson?.id).toBe('classical-bit-lesson');
    expect(result.current.durationMs).toBeGreaterThan(0);
    expect(result.current.timeline).not.toBeNull();
  });

  it('plays and pauses cleanly, freezing visual state', () => {
    const { result } = renderHook(() => useLessonTimeline());

    act(() => {
      result.current.loadLesson(qubitLessonData);
    });

    act(() => {
      result.current.play();
    });

    expect(result.current.playbackState).toBe('PLAYING');

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(result.current.currentTimeMs).toBeGreaterThan(0);

    act(() => {
      result.current.pause();
    });

    expect(result.current.playbackState).toBe('PAUSED');
    const pausedTime = result.current.currentTimeMs;

    // Advance time while paused
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentTimeMs).toBe(pausedTime);
  });

  it('restarts cleanly from 0', () => {
    const { result } = renderHook(() => useLessonTimeline());

    act(() => {
      result.current.loadLesson(classicalBitLessonData);
      result.current.play();
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.restart();
    });

    expect(result.current.currentTimeMs).toBe(0);
    expect(result.current.playbackState).toBe('PLAYING');
  });

  it('handles invalid lesson JSON gracefully', () => {
    const { result } = renderHook(() => useLessonTimeline());

    act(() => {
      const loadRes = result.current.loadLesson({ invalid: 'data' });
      expect(loadRes.ok).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
  });

  it('synchronizes narration cues during timeline playback and handles mute/unmute', () => {
    const mockSpeech = new MockSpeechService();
    const { result } = renderHook(() =>
      useLessonTimeline({ speechService: mockSpeech })
    );

    act(() => {
      result.current.loadLesson(classicalBitToQubitLessonData);
    });

    expect(result.current.currentLesson?.id).toBe('classical-bit-to-qubit');
    expect(result.current.timeline?.actions.length).toBeGreaterThan(0);

    act(() => {
      result.current.play();
    });

    // Advance to first NARRATE cue (after travel + WRITE at ~2000ms)
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(mockSpeech.spokeTexts.length).toBeGreaterThanOrEqual(1);
    expect(mockSpeech.spokeTexts[0]).toContain('classical bit has one definite value');

    // Test mute toggle
    act(() => {
      result.current.toggleNarration();
    });

    expect(result.current.isNarrationEnabled).toBe(false);
  });

  it('handles the Phase 12 checkpoint lifecycle: auto-pause, option selection, submit evaluation, and continue', () => {
    const mockSpeech = new MockSpeechService();
    const { result } = renderHook(() =>
      useLessonTimeline({ speechService: mockSpeech })
    );

    act(() => {
      result.current.loadLesson(qubitSuperpositionCheckpointLessonData);
    });

    expect(result.current.currentLesson?.id).toBe('qubit-superposition-checkpoint');
    expect(result.current.activeCheckpoint).toBeNull();

    act(() => {
      result.current.play();
    });

    // Advance timeline past the checkpoint trigger timestamp
    act(() => {
      vi.advanceTimersByTime(12000);
    });

    // Checkpoint should be active and playback paused
    expect(result.current.activeCheckpoint).not.toBeNull();
    expect(result.current.activeCheckpoint?.id).toBe('measure-plus');
    expect(result.current.playbackState).toBe('PAUSED');
    expect(mockSpeech.pauseCount).toBeGreaterThanOrEqual(1);

    // Select an option
    act(() => {
      result.current.selectCheckpointOption('c');
    });
    expect(result.current.selectedCheckpointOptionId).toBe('c');
    expect(result.current.isCheckpointSubmitted).toBe(false);

    // Submit answer
    act(() => {
      result.current.submitCheckpointAnswer();
    });
    expect(result.current.isCheckpointSubmitted).toBe(true);
    expect(result.current.isCheckpointCorrect).toBe(true);

    // Continue from checkpoint
    act(() => {
      result.current.continueFromCheckpoint();
    });

    expect(result.current.activeCheckpoint).toBeNull();
    expect(result.current.selectedCheckpointOptionId).toBeNull();
    expect(result.current.isCheckpointSubmitted).toBe(false);
    expect(result.current.playbackState).toBe('PLAYING');
    expect(mockSpeech.resumeCount).toBeGreaterThanOrEqual(1);

    // Verify Phase 13 getLessonHandoff contains prediction and circuit setup
    const handoff = result.current.getLessonHandoff();
    expect(handoff).not.toBeNull();
    expect(handoff?.lessonId).toBe('qubit-superposition-checkpoint');
    expect(handoff?.conceptFormula).toBe('H|0\\rangle = |+\\rangle');
    expect(handoff?.prediction?.selectedOptionId).toBe('c');
    expect(handoff?.prediction?.isCorrect).toBe(true);
    expect(handoff?.circuit.qubits).toBe(1);
    expect(handoff?.circuit.gates.length).toBe(1);
    expect(handoff?.circuit.gates[0].gate).toBe('h');

    // Advance timeline to reach final assessment
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Assessment should now be active and playback paused
    expect(result.current.activeAssessment).not.toBeNull();
    expect(result.current.activeAssessment?.id).toBe('superposition-final');
    expect(result.current.playbackState).toBe('PAUSED');

    // Select correct option
    act(() => {
      result.current.selectAssessmentOption('c');
    });
    expect(result.current.selectedAssessmentOptionId).toBe('c');

    // Submit assessment
    act(() => {
      result.current.submitAssessmentAnswer();
    });
    expect(result.current.isAssessmentSubmitted).toBe(true);
    expect(result.current.isAssessmentCorrect).toBe(true);
    expect(result.current.conceptMastery).toBe('UNDERSTOOD');
    expect(result.current.learningEvidence).not.toBeNull();
    expect(result.current.learningEvidence?.conceptStatus).toBe('UNDERSTOOD');
    expect(result.current.learningEvidence?.evidence.assessment?.correct).toBe(true);

    // Continue from assessment opens completion recap
    act(() => {
      result.current.continueFromAssessment();
    });

    expect(result.current.activeAssessment).toBeNull();
    expect(result.current.isLessonCompleteRecapOpen).toBe(true);
  });
});

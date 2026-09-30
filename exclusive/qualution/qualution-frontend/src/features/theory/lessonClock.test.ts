import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LessonClock } from './lessonClock';
import { buildLessonTimeline } from './lessonTimeline';
import type { TeachingAction } from './teachingActions';

describe('LessonClock (Phase 10)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const actions: TeachingAction[] = [
    { kind: 'MOVE', x: 200, y: 200, durationMs: 1000 },
    { kind: 'WRITE', id: 't1', text: 'Quantum', x: 200, y: 200, durationMs: 2000 },
  ];
  const timeline = buildLessonTimeline(actions);

  it('initializes in IDLE state with 0 currentTime and calculated duration', () => {
    const clock = new LessonClock(timeline);
    expect(clock.state).toBe('IDLE');
    expect(clock.currentTimeMs).toBe(0);
    expect(clock.durationMs).toBe(3000);
    expect(clock.progress).toBe(0);
  });

  it('starts playback on play() and updates progress via requestAnimationFrame', () => {
    const clock = new LessonClock(timeline);
    const tickListener = vi.fn();
    clock.onTick(tickListener);

    clock.play();
    expect(clock.state).toBe('PLAYING');

    // Advance time
    vi.advanceTimersByTime(1000);

    expect(clock.currentTimeMs).toBeGreaterThanOrEqual(950);
    expect(clock.progress).toBeGreaterThanOrEqual(0.3);
    expect(tickListener).toHaveBeenCalled();
  });

  it('freezes time accurately on pause() and resumes seamlessly on resume()', () => {
    const clock = new LessonClock(timeline);
    clock.play();

    vi.advanceTimersByTime(1200);
    clock.pause();

    expect(clock.state).toBe('PAUSED');
    const pausedTime = clock.currentTimeMs;
    expect(pausedTime).toBeGreaterThanOrEqual(1150);

    // Advance timers while paused - time must not advance
    vi.advanceTimersByTime(2000);
    expect(clock.currentTimeMs).toBe(pausedTime);

    // Resume
    clock.resume();
    expect(clock.state).toBe('PLAYING');

    vi.advanceTimersByTime(500);
    expect(clock.currentTimeMs).toBeGreaterThan(pausedTime);
  });

  it('restarts from 0 on restart() and plays again', () => {
    const clock = new LessonClock(timeline);
    clock.play();
    vi.advanceTimersByTime(1500);

    clock.restart();
    expect(clock.currentTimeMs).toBe(0);
    expect(clock.state).toBe('PLAYING');
  });

  it('fires onComplete exactly once when reaching duration', () => {
    const clock = new LessonClock(timeline);
    const completeListener = vi.fn();
    clock.onComplete(completeListener);

    clock.play();
    vi.advanceTimersByTime(3500);

    expect(clock.state).toBe('COMPLETED');
    expect(clock.currentTimeMs).toBe(3000);
    expect(clock.progress).toBe(1);
    expect(completeListener).toHaveBeenCalledTimes(1);

    // Further timer ticks do not fire complete again
    vi.advanceTimersByTime(1000);
    expect(completeListener).toHaveBeenCalledTimes(1);
  });

  it('is idempotent on rapid play() and pause() calls', () => {
    const clock = new LessonClock(timeline);
    clock.play();
    clock.play();
    clock.play();
    expect(clock.state).toBe('PLAYING');

    clock.pause();
    clock.pause();
    expect(clock.state).toBe('PAUSED');
  });
});

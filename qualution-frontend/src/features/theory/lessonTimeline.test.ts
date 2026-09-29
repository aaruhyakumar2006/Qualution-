import { describe, it, expect } from 'vitest';
import { buildLessonTimeline } from './lessonTimeline';
import type { TeachingAction } from './teachingActions';

describe('LessonTimeline (Phase 10)', () => {
  it('builds a contiguous timeline from sequential teaching actions', () => {
    const actions: TeachingAction[] = [
      { kind: 'APPEAR', x: 100, y: 100 },
      { kind: 'MOVE', x: 200, y: 200, durationMs: 500 },
      { kind: 'PAUSE', durationMs: 300 },
      { kind: 'WRITE', id: 'txt1', text: 'Hello', x: 200, y: 200, durationMs: 1200 },
      { kind: 'DRAW_LINE', id: 'line1', x1: 200, y1: 250, x2: 400, y2: 250, durationMs: 800 },
      { kind: 'HIDE' },
    ];

    const timeline = buildLessonTimeline(actions);

    expect(timeline.actions).toHaveLength(6);
    expect(timeline.actions[0].startTimeMs).toBe(0);
    expect(timeline.actions[0].endTimeMs).toBe(0);

    expect(timeline.actions[1].startTimeMs).toBe(0);
    expect(timeline.actions[1].durationMs).toBe(500);
    expect(timeline.actions[1].endTimeMs).toBe(500);

    expect(timeline.actions[2].startTimeMs).toBe(500);
    expect(timeline.actions[2].durationMs).toBe(300);
    expect(timeline.actions[2].endTimeMs).toBe(800);

    expect(timeline.actions[3].startTimeMs).toBe(800);
    expect(timeline.actions[3].durationMs).toBe(1200);
    expect(timeline.actions[3].endTimeMs).toBe(2000);

    expect(timeline.actions[4].startTimeMs).toBe(2000);
    expect(timeline.actions[4].durationMs).toBe(800);
    expect(timeline.actions[4].endTimeMs).toBe(2800);

    expect(timeline.totalDurationMs).toBe(2800);
  });

  it('finds active action at any timestamp accurately', () => {
    const actions: TeachingAction[] = [
      { kind: 'MOVE', x: 200, y: 200, durationMs: 1000 },
      { kind: 'WRITE', id: 'txt1', text: 'Qubit', x: 200, y: 200, durationMs: 2000 },
    ];

    const timeline = buildLessonTimeline(actions);

    const actionAt500 = timeline.findActionAt(500);
    expect(actionAt500?.action.kind).toBe('MOVE');

    const actionAt1500 = timeline.findActionAt(1500);
    expect(actionAt1500?.action.kind).toBe('WRITE');

    const completedAt1200 = timeline.getCompletedActionsAt(1200);
    expect(completedAt1200).toHaveLength(1);
    expect(completedAt1200[0].action.kind).toBe('MOVE');
  });

  it('handles empty action array gracefully', () => {
    const timeline = buildLessonTimeline([]);
    expect(timeline.actions).toHaveLength(0);
    expect(timeline.totalDurationMs).toBe(0);
    expect(timeline.findActionAt(0)).toBeNull();
    expect(timeline.getCompletedActionsAt(0)).toEqual([]);
  });
});

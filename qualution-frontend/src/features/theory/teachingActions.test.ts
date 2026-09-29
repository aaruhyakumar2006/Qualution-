/**
 * teachingActions.test.ts
 *
 * PHASE 4: Pure unit tests for the teachingActions module.
 *
 * These tests require NO DOM, NO React, NO mocks.
 * They verify action array structure, ordering, and field values.
 */

import { describe, it, expect } from 'vitest';
import {
  teacherWrite,
  AUTO_TRAVEL_SENTINEL,
  type TeachingAction,
  type MoveAction,
  type AppearAction,
  type PauseAction,
  type WriteAction,
} from './teachingActions';

// ── Helpers ────────────────────────────────────────────────────────────────

function actionsOfKind<K extends TeachingAction['kind']>(
  actions: TeachingAction[],
  kind: K
): Extract<TeachingAction, { kind: K }>[] {
  return actions.filter((a): a is Extract<TeachingAction, { kind: K }> => a.kind === kind);
}

// ── teacherWrite() — structure ─────────────────────────────────────────────

describe('teacherWrite()', () => {
  const BASE_OPTS = {
    id: 'test-item',
    text: 'Hello Board',
    x: 300,
    y: 250,
  } as const;

  // ── 1. Default sequence order ────────────────────────────────────────────

  it('produces MOVE → PAUSE → WRITE in the default configuration', () => {
    const actions = teacherWrite(BASE_OPTS);

    expect(actions).toHaveLength(3); // MOVE + PAUSE + WRITE
    expect(actions[0].kind).toBe('MOVE');
    expect(actions[1].kind).toBe('PAUSE');
    expect(actions[2].kind).toBe('WRITE');
  });

  // ── 2. With postWritePauseMs > 0 ────────────────────────────────────────

  it('appends a trailing PAUSE when postWritePauseMs > 0', () => {
    const actions = teacherWrite({ ...BASE_OPTS, postWritePauseMs: 600 });

    expect(actions).toHaveLength(4);
    expect(actions[0].kind).toBe('MOVE');
    expect(actions[1].kind).toBe('PAUSE');
    expect(actions[2].kind).toBe('WRITE');
    expect(actions[3].kind).toBe('PAUSE');

    const postPause = actions[3] as PauseAction;
    expect(postPause.durationMs).toBe(600);
  });

  // ── 3. Omit pre-write pause ──────────────────────────────────────────────

  it('omits the pre-write PAUSE when preWritePauseMs is 0', () => {
    const actions = teacherWrite({ ...BASE_OPTS, preWritePauseMs: 0 });

    expect(actions).toHaveLength(2); // MOVE + WRITE only
    expect(actions[0].kind).toBe('MOVE');
    expect(actions[1].kind).toBe('WRITE');
  });

  // ── 4. Omit pre AND post pause ───────────────────────────────────────────

  it('returns only MOVE + WRITE when both pauses are 0', () => {
    const actions = teacherWrite({
      ...BASE_OPTS,
      preWritePauseMs: 0,
      postWritePauseMs: 0,
    });

    expect(actions).toHaveLength(2);
    expect(actions[0].kind).toBe('MOVE');
    expect(actions[1].kind).toBe('WRITE');
  });

  // ── 5. travel: false → APPEAR instead of MOVE ───────────────────────────

  it('emits APPEAR (not MOVE) when travel is false', () => {
    const actions = teacherWrite({ ...BASE_OPTS, travel: false });

    expect(actions[0].kind).toBe('APPEAR');
    const appear = actions[0] as AppearAction;
    expect(appear.x).toBe(BASE_OPTS.x);
    expect(appear.y).toBe(BASE_OPTS.y);
  });

  // ── 6. travelDurationMs: 0 → APPEAR ─────────────────────────────────────

  it('emits APPEAR (teleport) when travelDurationMs is 0', () => {
    const actions = teacherWrite({ ...BASE_OPTS, travelDurationMs: 0 });

    expect(actions[0].kind).toBe('APPEAR');
  });

  // ── 7. Explicit travelDurationMs is used in MOVE action ─────────────────

  it('uses the explicit travelDurationMs in the MOVE action', () => {
    const actions = teacherWrite({ ...BASE_OPTS, travelDurationMs: 1200 });

    const move = actions[0] as MoveAction;
    expect(move.kind).toBe('MOVE');
    expect(move.durationMs).toBe(1200);
  });

  // ── 8. Auto-travel emits sentinel value ──────────────────────────────────

  it('uses the AUTO_TRAVEL_SENTINEL when no travelDurationMs is specified', () => {
    const actions = teacherWrite(BASE_OPTS);

    const move = actions[0] as MoveAction;
    expect(move.durationMs).toBe(AUTO_TRAVEL_SENTINEL);
  });

  // ── 9. WRITE action carries all required fields ──────────────────────────

  it('WRITE action carries correct id, text, position, and duration', () => {
    const actions = teacherWrite({
      ...BASE_OPTS,
      durationMs: 1800,
    });

    const write = actionsOfKind(actions, 'WRITE')[0];
    expect(write.id).toBe('test-item');
    expect(write.text).toBe('Hello Board');
    expect(write.x).toBe(300);
    expect(write.y).toBe(250);
    expect(write.durationMs).toBe(1800);
  });

  // ── 10. WRITE action carries style overrides ─────────────────────────────

  it('WRITE action carries style overrides when provided', () => {
    const style = { fontSize: 72, color: 'rgba(255,220,80,0.9)', fontWeight: 700 };
    const actions = teacherWrite({ ...BASE_OPTS, style });

    const write = actionsOfKind(actions, 'WRITE')[0];
    expect(write.style).toEqual(style);
  });

  // ── 11. WRITE action has no style when omitted ────────────────────────────

  it('WRITE action style is undefined when not provided', () => {
    const actions = teacherWrite(BASE_OPTS);

    const write = actionsOfKind(actions, 'WRITE')[0];
    expect(write.style).toBeUndefined();
  });

  // ── 12. MOVE action targets text anchor position ─────────────────────────

  it('MOVE action targets the same x, y as the text anchor', () => {
    const actions = teacherWrite({ ...BASE_OPTS, x: 480, y: 310 });

    const move = actions[0] as MoveAction;
    expect(move.x).toBe(480);
    expect(move.y).toBe(310);
  });

  // ── 13. Default pre-write pause duration ─────────────────────────────────

  it('uses 400 ms as the default pre-write pause duration', () => {
    const actions = teacherWrite(BASE_OPTS);

    const pause = actions[1] as PauseAction;
    expect(pause.durationMs).toBe(400);
  });

  // ── 14. Custom pre-write pause ────────────────────────────────────────────

  it('uses the specified preWritePauseMs value', () => {
    const actions = teacherWrite({ ...BASE_OPTS, preWritePauseMs: 750 });

    const pause = actions[1] as PauseAction;
    expect(pause.durationMs).toBe(750);
  });

  // ── 15. Determinism — same inputs produce identical output ────────────────

  it('is deterministic: same inputs always produce the same action array', () => {
    const opts = {
      ...BASE_OPTS,
      durationMs: 1600,
      preWritePauseMs: 300,
      postWritePauseMs: 500,
    };

    const run1 = teacherWrite(opts);
    const run2 = teacherWrite(opts);
    const run3 = teacherWrite(opts);

    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
  });

  // ── 16. Composability — two sequences can be concatenated ─────────────────

  it('two teacherWrite arrays can be concatenated into a single action sequence', () => {
    const seq1 = teacherWrite({ id: 'a', text: 'Line A', x: 100, y: 200 });
    const seq2 = teacherWrite({ id: 'b', text: 'Line B', x: 100, y: 320 });

    const combined = [...seq1, ...seq2];

    // Each sequence = MOVE + PAUSE + WRITE = 3 items × 2 = 6 total
    expect(combined).toHaveLength(6);

    // First sequence
    expect(combined[0].kind).toBe('MOVE');
    expect(combined[1].kind).toBe('PAUSE');
    expect(combined[2].kind).toBe('WRITE');

    // Second sequence
    expect(combined[3].kind).toBe('MOVE');
    expect(combined[4].kind).toBe('PAUSE');
    expect(combined[5].kind).toBe('WRITE');

    // Text content is correct
    expect((combined[2] as WriteAction).text).toBe('Line A');
    expect((combined[5] as WriteAction).text).toBe('Line B');
  });

  // ── 17. All actions are plain JSON-serialisable objects ──────────────────

  it('all returned actions are plain serialisable objects (no class instances)', () => {
    const actions = teacherWrite({
      ...BASE_OPTS,
      postWritePauseMs: 400,
    });

    expect(() => JSON.stringify(actions)).not.toThrow();
    const round = JSON.parse(JSON.stringify(actions));
    expect(round).toEqual(actions);
  });
});

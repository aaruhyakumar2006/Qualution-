/**
 * LessonScreen.tsx
 *
 * PHASE 5: Lesson Screen — Synchronized Teacher Cursor + Writing + Drawing Demo.
 *
 * Demonstrates the full Phase 1–5 stack:
 *   1. "What is a Classical Bit?" — cursor appears, moves, writes progressively
 *   2. Horizontal divider line    — teacherDrawLine
 *   3. "0  or  1"                 — cursor continues, writes in gold accent
 *   4. Circle illustrating "0"    — teacherDrawCircle
 *   5. Rectangle illustrating "1" — teacherDrawRect
 *   6. Arrows pointing to each    — teacherDrawArrow × 2
 *
 * The entire demo is driven by a declarative TeachingAction[] array.
 * Zero hand-coded cursor calls inside the loop.
 */

import React, { useEffect, useRef } from 'react';
import { TeachingBoard, type TeachingBoardRef } from '../components/teaching/TeachingBoard';
import { BoardCursor } from '../components/teaching/BoardCursor';
import { BoardTextLayer } from '../components/teaching/BoardTextLayer';
import { BoardDrawingLayer } from '../components/teaching/BoardDrawingLayer';
import { useBoardCursor } from '../hooks/useBoardCursor';
import { useBoardWriter } from '../hooks/useBoardWriter';
import { useBoardDrawing } from '../hooks/useBoardDrawing';
import { useTeachingSequence } from '../hooks/useTeachingSequence';
import {
  teacherWrite,
  teacherDrawLine,
  teacherDrawArrow,
  teacherDrawCircle,
  teacherDrawRect,
  type TeachingAction,
} from '../features/theory/teachingActions';
import './LessonScreen.css';

// ── Demo sequence definition ─────────────────────────────────────────────
// Plain declarative data — no imperative calls in the loop.

const DEMO_ACTIONS: TeachingAction[] = [
  // 1. Cursor appears at the top-left approach point
  { kind: 'APPEAR', x: 80, y: 80 },

  // 2. Write the question title
  ...teacherWrite({
    id: 'q1-title',
    text: 'What is a Classical Bit?',
    x: 160,
    y: 200,
    durationMs: 2200,
    style: {
      fontSize: 52,
      fontWeight: 700,
      fontFamily: 'Inter, sans-serif',
      color: 'rgba(240, 245, 255, 0.96)',
      letterSpacing: 1,
    },
    preWritePauseMs: 500,
    postWritePauseMs: 600,
  }),

  // 3. Draw a thin divider line under the title
  ...teacherDrawLine({
    id: 'divider',
    x1: 160, y1: 228,
    x2: 900, y2: 228,
    durationMs: 700,
    style: { color: 'rgba(255,255,255,0.25)', strokeWidth: 1.5 },
    preDrawPauseMs: 100,
    postDrawPauseMs: 500,
  }),

  // 4. Write the answer in gold accent
  ...teacherWrite({
    id: 'q1-answer',
    text: '0  or  1',
    x: 400,
    y: 360,
    durationMs: 1300,
    style: {
      fontSize: 72,
      fontWeight: 700,
      fontFamily: 'Inter, sans-serif',
      color: 'rgba(255, 210, 70, 0.95)',
      letterSpacing: 6,
    },
    preWritePauseMs: 350,
    postWritePauseMs: 800,
  }),

  // 5. Circle to illustrate "0"
  ...teacherDrawCircle({
    id: 'circle-zero',
    cx: 300,
    cy: 530,
    r: 55,
    durationMs: 1300,
    style: { color: 'rgba(100, 200, 255, 0.85)', strokeWidth: 3 },
    preDrawPauseMs: 200,
    postDrawPauseMs: 400,
  }),

  // 6. Rectangle to illustrate "1" (tall narrow bar)
  ...teacherDrawRect({
    id: 'rect-one',
    x: 620,
    y: 480,
    w: 60,
    h: 110,
    durationMs: 1000,
    style: { color: 'rgba(100, 200, 255, 0.85)', strokeWidth: 3 },
    preDrawPauseMs: 200,
    postDrawPauseMs: 400,
  }),

  // 7. Arrow from answer to circle (0)
  ...teacherDrawArrow({
    id: 'arrow-to-zero',
    x1: 430, y1: 400,
    x2: 320, y2: 480,
    durationMs: 700,
    style: { color: 'rgba(255, 210, 70, 0.6)', strokeWidth: 2 },
    preDrawPauseMs: 150,
    postDrawPauseMs: 300,
  }),

  // 8. Arrow from answer to rect (1)
  ...teacherDrawArrow({
    id: 'arrow-to-one',
    x1: 620, y1: 400,
    x2: 650, y2: 480,
    durationMs: 700,
    style: { color: 'rgba(255, 210, 70, 0.6)', strokeWidth: 2 },
    preDrawPauseMs: 150,
    postDrawPauseMs: 500,
  }),

  // 9. Cursor rests, then hides
  { kind: 'PAUSE', durationMs: 1400 },
  { kind: 'HIDE' },
];

// ── Timing constants ─────────────────────────────────────────────────────
const INITIAL_SETTLE_MS = 700;
const LOOP_REST_MS      = 3000;

// ── Component ────────────────────────────────────────────────────────────

export const LessonScreen: React.FC = () => {
  const boardRef = useRef<TeachingBoardRef>(null);
  const abortRef = useRef(false);

  const cursor   = useBoardCursor({ initialX: 80, initialY: 80, initialVisible: false });
  const writer   = useBoardWriter();
  const drawing  = useBoardDrawing();
  const sequence = useTeachingSequence({ cursor, writer, drawing });

  useEffect(() => {
    abortRef.current = false;

    const sleep = (ms: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const loop = async () => {
      await sleep(INITIAL_SETTLE_MS);

      while (!abortRef.current) {
        // Reset all board state for a clean loop
        writer.clear();
        drawing.clear();
        cursor.reset();

        // Run the full teaching sequence
        await sequence.run(DEMO_ACTIONS);
        if (abortRef.current) break;

        // Hold the completed scene before looping
        await sleep(LOOP_REST_MS);
      }
    };

    loop();

    return () => {
      abortRef.current = true;
      sequence.reset();
      cursor.reset();
      writer.reset();
      drawing.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="lesson-screen" data-testid="lesson-screen">
      <TeachingBoard
        ref={boardRef}
        showGrid={false}
        svgChildren={
          /* Phase 5: Progressive vector drawing layer (SVG Layer 2) */
          <BoardDrawingLayer items={drawing.items} />
        }
        textChildren={
          /* Phase 3/4: Progressive text layer (DOM Typography Layer 3) */
          <BoardTextLayer items={writer.items} />
        }
      >
        {/* Phase 2/4: Teacher cursor (Layer 4) */}
        <BoardCursor
          x={cursor.state.x}
          y={cursor.state.y}
          visible={cursor.state.visible}
          moving={cursor.state.moving}
          logicalWidth={1280}
          logicalHeight={720}
        />
      </TeachingBoard>
    </div>
  );
};

export default LessonScreen;

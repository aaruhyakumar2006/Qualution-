/**
 * TheoryBoard.tsx
 *
 * The React component that renders the Theory Board teaching experience.
 *
 * Architecture:
 * - A <canvas> (via SVG) handles all vector drawing (lines, arrows, shapes).
 * - A DOM overlay handles text and KaTeX math (so KaTeX CSS just works).
 * - The existing TeachingCursor (with Bézier motion) is reused as-is.
 * - TheoryBoardEngine drives all state; this component only renders.
 *
 * The learner's controls: Play / Pause / Restart + Progress.
 * No editing. No drag-drop. Watch and learn.
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Play, Pause, RotateCcw, Atom, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { TeachingCursor } from '../teaching/TeachingCursor';
import { TheoryBoardEngine } from '../../features/theory/TheoryBoardEngine';
import type {
  BoardLessonScript,
  BoardEngineState,
  PaintedItem,
  PaintedItemKind,
} from '../../features/theory/boardTypes';
import type { PaintCommand } from '../../features/theory/TheoryBoardEngine';
import './TheoryBoard.css';

// ── Constants ─────────────────────────────────────────────────────────────

/** Logical board dimensions. All lesson coordinates are in these units. */
const BOARD_W = 1200;
const BOARD_H = 700;

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Convert a logical board position to a CSS percentage string so elements
 * are positioned correctly at any physical board size.
 */
function toPercX(logicalX: number): string {
  return `${((logicalX / BOARD_W) * 100).toFixed(4)}%`;
}
function toPercY(logicalY: number): string {
  return `${((logicalY / BOARD_H) * 100).toFixed(4)}%`;
}
function toPercW(logicalW: number): string {
  return `${((logicalW / BOARD_W) * 100).toFixed(4)}%`;
}
function toPercH(logicalH: number): string {
  return `${((logicalH / BOARD_H) * 100).toFixed(4)}%`;
}

/** Scale a logical font size to viewport-relative units. */
function fontSizeVW(logicalPx: number): string {
  return `${((logicalPx / BOARD_W) * 100).toFixed(3)}vw`;
}

/** Clamp progress to [0, 1]. */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ── SVG Item Renderers ────────────────────────────────────────────────────

interface SvgItemProps {
  item: PaintedItem;
  /** Board stage pixel size (to convert logical to SVG coords). */
  stageW: number;
  stageH: number;
}

function toSvgX(lx: number, sw: number): number {
  return (lx / BOARD_W) * sw;
}
function toSvgY(ly: number, sh: number): number {
  return (ly / BOARD_H) * sh;
}

const SvgLineItem: React.FC<SvgItemProps> = ({ item, stageW, stageH }) => {
  const a = item.data as any;
  const x1 = toSvgX(a.x1, stageW);
  const y1 = toSvgY(a.y1, stageH);
  const x2 = toSvgX(a.x2, stageW);
  const y2 = toSvgY(a.y2, stageH);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const drawn = len * clamp01(item.progress);
  const sw = ((a.strokeWidth ?? 2) / BOARD_W) * stageW;

  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={a.color ?? '#e8e8e8'}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeDasharray={`${len} ${len}`}
      strokeDashoffset={len - drawn}
      strokeDashoffsetUnit="px"
      opacity={item.progress > 0 ? 1 : 0}
    />
  );
};

const SvgArrowItem: React.FC<SvgItemProps> = ({ item, stageW, stageH }) => {
  const a = item.data as any;
  const x1 = toSvgX(a.x1, stageW);
  const y1 = toSvgY(a.y1, stageH);
  const x2 = toSvgX(a.x2, stageW);
  const y2 = toSvgY(a.y2, stageH);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const drawn = len * clamp01(item.progress);
  const sw = ((a.strokeWidth ?? 2) / BOARD_W) * stageW;
  const color = a.color ?? '#e8e8e8';
  const markerId = `arrow-${item.id}`;

  // Intermediate tip point for progressive drawing
  const t = clamp01(item.progress);
  const tipX = x1 + (x2 - x1) * t;
  const tipY = y1 + (y2 - y1) * t;

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          markerWidth="8" markerHeight="8"
          refX="6" refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1}
        x2={tipX} y2={tipY}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        markerEnd={t >= 0.9 ? `url(#${markerId})` : undefined}
        strokeDasharray={`${len} ${len}`}
        strokeDashoffset={len - drawn}
        opacity={item.progress > 0 ? 1 : 0}
      />
    </g>
  );
};

const SvgRectItem: React.FC<SvgItemProps> = ({ item, stageW, stageH }) => {
  const a = item.data as any;
  const x = toSvgX(a.x, stageW);
  const y = toSvgY(a.y, stageH);
  const w = toSvgX(a.w, stageW);
  const h = toSvgY(a.h, stageH);
  const perimeter = 2 * (w + h);
  const drawn = perimeter * clamp01(item.progress);
  const sw = ((a.strokeWidth ?? 2) / BOARD_W) * stageW;

  return (
    <rect
      x={x} y={y} width={w} height={h}
      fill={a.fillColor ?? 'none'}
      stroke={a.color ?? '#e8e8e8'}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeDasharray={`${perimeter} ${perimeter}`}
      strokeDashoffset={perimeter - drawn}
      rx={4}
      opacity={item.progress > 0 ? 1 : 0}
    />
  );
};

const SvgCircleItem: React.FC<SvgItemProps> = ({ item, stageW, stageH }) => {
  const a = item.data as any;
  const cx = toSvgX(a.cx, stageW);
  const cy = toSvgY(a.cy, stageH);
  const r = (a.r / BOARD_W) * stageW;
  const circumference = 2 * Math.PI * r;
  const drawn = circumference * clamp01(item.progress);
  const sw = ((a.strokeWidth ?? 2) / BOARD_W) * stageW;

  return (
    <circle
      cx={cx} cy={cy} r={r}
      fill={a.fillColor ?? 'none'}
      stroke={a.color ?? '#e8e8e8'}
      strokeWidth={sw}
      strokeDasharray={`${drawn} ${circumference}`}
      strokeLinecap="round"
      opacity={item.progress > 0 ? 1 : 0}
    />
  );
};

const SvgUnderlineItem: React.FC<SvgItemProps> = ({ item, stageW, stageH }) => {
  const a = item.data as any;
  const x1 = toSvgX(a.x, stageW);
  const y = toSvgY(a.y, stageH);
  const len = (a.width / BOARD_W) * stageW;
  const drawn = len * clamp01(item.progress);
  const sw = ((a.strokeWidth ?? 2) / BOARD_W) * stageW;

  return (
    <line
      x1={x1} y1={y} x2={x1 + len} y2={y}
      stroke={a.color ?? '#4d9de0'}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeDasharray={`${len} ${len}`}
      strokeDashoffset={len - drawn}
      opacity={item.progress > 0 ? 1 : 0}
    />
  );
};

const SvgQubitWireItem: React.FC<SvgItemProps> = ({ item, stageW, stageH }) => {
  const a = item.data as any;
  const x1 = toSvgX(a.x, stageW);
  const y = toSvgY(a.y, stageH);
  const len = (a.length / BOARD_W) * stageW;
  const drawn = len * clamp01(item.progress);
  const sw = ((1.5) / BOARD_W) * stageW;
  const color = a.color ?? '#e8e8e8';

  // Label font size
  const fontSize = (18 / BOARD_W) * stageW;

  return (
    <g>
      {/* Wire label */}
      {a.label && (
        <text
          x={x1 - (24 / BOARD_W) * stageW}
          y={y + (6 / BOARD_H) * stageH}
          textAnchor="end"
          fill={color}
          fontSize={fontSize}
          fontFamily="monospace"
          opacity={clamp01(item.progress * 3)}
        >
          {a.label}
        </text>
      )}
      {/* Wire line */}
      <line
        x1={x1} y1={y} x2={x1 + len} y2={y}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${len} ${len}`}
        strokeDashoffset={len - drawn}
        opacity={item.progress > 0 ? 1 : 0}
      />
    </g>
  );
};

const SvgGateBoxItem: React.FC<SvgItemProps> = ({ item, stageW, stageH }) => {
  const a = item.data as any;
  const cx = toSvgX(a.cx, stageW);
  const cy = toSvgY(a.cy, stageH);
  const size = ((a.size ?? 40) / BOARD_W) * stageW;
  const half = size / 2;
  const color = a.color ?? '#1a6fff';
  const alpha = clamp01(item.progress);
  const fontSize = (size * 0.45);

  return (
    <g opacity={alpha}>
      <rect
        x={cx - half} y={cy - half}
        width={size} height={size}
        fill={`rgba(26,111,255,0.15)`}
        stroke={color}
        strokeWidth={1.5}
        rx={3}
      />
      <text
        x={cx} y={cy + fontSize * 0.35}
        textAnchor="middle"
        fill={color}
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="monospace"
      >
        {a.label}
      </text>
    </g>
  );
};

const SvgMeasureSymbolItem: React.FC<SvgItemProps> = ({ item, stageW, stageH }) => {
  const a = item.data as any;
  const cx = toSvgX(a.cx, stageW);
  const cy = toSvgY(a.cy, stageH);
  const size = ((a.size ?? 40) / BOARD_W) * stageW;
  const half = size / 2;
  const alpha = clamp01(item.progress);
  const color = '#e8c44a';

  // Arc path for gauge
  const r = size * 0.28;
  const arcX1 = cx - r;
  const arcX2 = cx + r;
  const arcY = cy + r * 0.3;

  return (
    <g opacity={alpha}>
      <rect
        x={cx - half} y={cy - half}
        width={size} height={size}
        fill="rgba(232,196,74,0.1)"
        stroke={color}
        strokeWidth={1.5}
        rx={3}
      />
      {/* Gauge arc */}
      <path
        d={`M ${arcX1} ${arcY} A ${r} ${r} 0 0 1 ${arcX2} ${arcY}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Needle */}
      <line
        x1={cx} y1={arcY}
        x2={cx + r * 0.7} y2={cy - r * 0.2}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </g>
  );
};

// ── SVG Canvas ─────────────────────────────────────────────────────────────

interface BoardSvgCanvasProps {
  items: PaintedItem[];
  stageW: number;
  stageH: number;
}

const SVG_KINDS: PaintedItemKind[] = [
  'line', 'arrow', 'rect', 'circle', 'underline', 'qubit-wire', 'gate-box', 'measure-symbol',
];

const BoardSvgCanvas: React.FC<BoardSvgCanvasProps> = ({ items, stageW, stageH }) => {
  const svgItems = items.filter(i => SVG_KINDS.includes(i.kind));

  return (
    <svg
      className="theory-board-svg"
      viewBox={`0 0 ${stageW} ${stageH}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {svgItems.map(item => {
        switch (item.kind) {
          case 'line': return <SvgLineItem key={item.id} item={item} stageW={stageW} stageH={stageH} />;
          case 'arrow': return <SvgArrowItem key={item.id} item={item} stageW={stageW} stageH={stageH} />;
          case 'rect': return <SvgRectItem key={item.id} item={item} stageW={stageW} stageH={stageH} />;
          case 'circle': return <SvgCircleItem key={item.id} item={item} stageW={stageW} stageH={stageH} />;
          case 'underline': return <SvgUnderlineItem key={item.id} item={item} stageW={stageW} stageH={stageH} />;
          case 'qubit-wire': return <SvgQubitWireItem key={item.id} item={item} stageW={stageW} stageH={stageH} />;
          case 'gate-box': return <SvgGateBoxItem key={item.id} item={item} stageW={stageW} stageH={stageH} />;
          case 'measure-symbol': return <SvgMeasureSymbolItem key={item.id} item={item} stageW={stageW} stageH={stageH} />;
          default: return null;
        }
      })}
    </svg>
  );
};

// ── DOM Text/Math Layer ────────────────────────────────────────────────────

interface DomItemProps {
  item: PaintedItem;
}

const DomTextItem: React.FC<DomItemProps> = ({ item }) => {
  const a = item.data as any;
  const chars = a.text?.length ?? 0;
  const visibleChars = Math.round(chars * clamp01(item.progress));
  const visibleText = (a.text ?? '').slice(0, visibleChars);

  return (
    <div
      className="theory-board-text-item"
      style={{
        left: toPercX(a.x),
        top: toPercY(a.y),
        fontSize: fontSizeVW(a.fontSize ?? 26),
        color: a.color ?? '#e8e8e8',
        fontWeight: a.fontWeight ?? 'normal',
        fontStyle: a.fontStyle ?? 'normal',
      }}
    >
      {visibleText}
    </div>
  );
};

const DomMathItem: React.FC<DomItemProps> = ({ item }) => {
  const a = item.data as any;
  const alpha = clamp01(item.progress);

  let html = '';
  try {
    html = katex.renderToString(a.latex ?? '', {
      throwOnError: false,
      displayMode: false,
    });
  } catch {
    html = `<span style="color:#ff6b6b">${a.latex}</span>`;
  }

  return (
    <div
      className="theory-board-math-item"
      style={{
        left: toPercX(a.x),
        top: toPercY(a.y),
        opacity: alpha,
        fontSize: `${(a.scale ?? 1) * 1.4}em`,
        color: a.color ?? '#f5c842',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
      aria-label={`Math: ${a.latex}`}
    />
  );
};

const DomHighlightItem: React.FC<DomItemProps> = ({ item }) => {
  const a = item.data as any;
  const alpha = clamp01(item.progress);

  return (
    <div
      className={`theory-board-highlight ${a.pulse ? 'pulsing' : ''}`}
      style={{
        left: toPercX(a.x),
        top: toPercY(a.y),
        width: toPercW(a.w),
        height: toPercH(a.h),
        background: a.color ?? 'rgba(255, 200, 50, 0.25)',
        opacity: alpha,
      }}
    />
  );
};

interface DomLayerProps {
  items: PaintedItem[];
}

const DOM_KINDS: PaintedItemKind[] = ['text', 'math', 'highlight'];

const BoardDomLayer: React.FC<DomLayerProps> = ({ items }) => {
  const domItems = items.filter(i => DOM_KINDS.includes(i.kind));
  return (
    <div className="theory-board-dom-layer" aria-live="polite">
      {domItems.map(item => {
        switch (item.kind) {
          case 'text': return <DomTextItem key={item.id} item={item} />;
          case 'math': return <DomMathItem key={item.id} item={item} />;
          case 'highlight': return <DomHighlightItem key={item.id} item={item} />;
          default: return null;
        }
      })}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────

export interface TheoryBoardProps {
  lesson: BoardLessonScript;
  /** Called when the learner clicks the "Try in Workbench" CTA. */
  onTransitionToWorkbench?: (lessonId: string) => void;
  /** Called when the board lesson is completed. */
  onComplete?: () => void;
  /** Whether audio is muted. */
  initialMuted?: boolean;
}

export const TheoryBoard: React.FC<TheoryBoardProps> = ({
  lesson,
  onTransitionToWorkbench,
  onComplete,
  initialMuted = false,
}) => {
  const engineRef = useRef<TheoryBoardEngine | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [boardState, setBoardState] = useState<BoardEngineState>({
    playback: 'IDLE',
    currentStepIndex: 0,
    totalSteps: lesson.steps.length,
    caption: '',
    isSpeaking: false,
    cursorX: 100,
    cursorY: 80,
    cursorVisible: false,
    progress: 0,
    error: null,
  });

  const [paintedItems, setPaintedItems] = useState<PaintedItem[]>([]);
  const [stageSize, setStageSize] = useState({ w: 1200, h: 700 });
  const [isMuted, setIsMuted] = useState(initialMuted);

  // ── Paint callback ────────────────────────────────────────────────────

  const handlePaintCmd = useCallback((cmd: PaintCommand) => {
    setPaintedItems(prev => {
      if (cmd.type === 'CLEAR') return [];
      if (cmd.type === 'REMOVE' && cmd.id) {
        return prev.filter(i => i.id !== cmd.id);
      }
      if (!cmd.item) return prev;
      if (cmd.type === 'ADD') {
        return [...prev, { ...cmd.item }];
      }
      if (cmd.type === 'UPDATE') {
        return prev.map(i => (i.id === cmd.item!.id ? { ...cmd.item! } : i));
      }
      return prev;
    });
  }, []);

  // ── Engine lifecycle ──────────────────────────────────────────────────

  useEffect(() => {
    const engine = new TheoryBoardEngine();
    engineRef.current = engine;

    const unsub = engine.subscribe(state => {
      setBoardState(state);
      if (state.playback === 'COMPLETED') {
        onComplete?.();
      }
    });

    engine.load(lesson, handlePaintCmd);
    engine.setSpeech(engine['speech']); // keeps existing speech service

    // Apply mute state
    (engine as any).speech?.setMuted(isMuted);

    return () => {
      unsub();
      engine.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  // Apply mute to engine when it changes
  useEffect(() => {
    const eng = engineRef.current as any;
    eng?.speech?.setMuted(isMuted);
  }, [isMuted]);

  // ── Stage size observer ───────────────────────────────────────────────

  useEffect(() => {
    if (!stageRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setStageSize({ w: Math.round(width), h: Math.round(height) });
        }
      }
    });
    obs.observe(stageRef.current);
    return () => obs.disconnect();
  }, []);

  // ── Control handlers ──────────────────────────────────────────────────

  const handlePlay = useCallback(() => {
    engineRef.current?.play();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const handleRestart = useCallback(() => {
    setPaintedItems([]);
    engineRef.current?.restart();
  }, []);

  // ── Cursor position in CSS % (within the stage) ───────────────────────

  const cursorCssPct = useMemo(() => ({
    x: (boardState.cursorX / BOARD_W) * stageSize.w,
    y: (boardState.cursorY / BOARD_H) * stageSize.h,
  }), [boardState.cursorX, boardState.cursorY, stageSize]);

  // ── Current step title ────────────────────────────────────────────────

  const currentStep = lesson.steps[boardState.currentStepIndex];
  const stepTitle = currentStep?.title ?? '';

  // ── Derived flags ─────────────────────────────────────────────────────

  const isIdle = boardState.playback === 'IDLE';
  const isPlaying = boardState.playback === 'PLAYING';
  const isPaused = boardState.playback === 'PAUSED';
  const isCompleted = boardState.playback === 'COMPLETED';
  const showBoard = !isIdle;

  return (
    <section className="theory-board-wrap" aria-label={`Theory Board: ${lesson.title}`}>
      {/* ── Header ── */}
      <div className="theory-board-header">
        <div className="theory-board-title-group">
          <div className="theory-board-badge">
            <Atom size={10} />
            LIVE TEACHING
          </div>
          <span className="theory-board-lesson-title">{lesson.title}</span>
        </div>
        <span className="theory-board-step-label">
          {showBoard && !isIdle && stepTitle ? stepTitle : `${lesson.estimatedMinutes} min · ${lesson.difficulty}`}
        </span>
      </div>

      {/* ── Board Stage ── */}
      <div className="theory-board-stage" ref={stageRef}>
        {/* SVG layer: lines, shapes, arrows */}
        {showBoard && (
          <BoardSvgCanvas
            items={paintedItems}
            stageW={stageSize.w}
            stageH={stageSize.h}
          />
        )}

        {/* DOM layer: text and math */}
        {showBoard && <BoardDomLayer items={paintedItems} />}

        {/* Teaching cursor */}
        {showBoard && boardState.cursorVisible && (
          <div className="theory-board-cursor-layer">
            <TeachingCursor
              x={cursorCssPct.x}
              y={cursorCssPct.y}
              isVisible={boardState.cursorVisible}
              isClicking={false}
              label={undefined}
              isSpotlight={false}
            />
          </div>
        )}

        {/* IDLE overlay */}
        {isIdle && (
          <div className="theory-board-idle-overlay">
            <div className="theory-board-idle-icon">
              <Atom size={28} />
            </div>
            <p className="theory-board-idle-title">{lesson.title}</p>
            <p className="theory-board-idle-subtitle">
              Watch the teacher cursor build this concept progressively on the board.
            </p>
            <button
              type="button"
              className="theory-board-start-btn"
              onClick={handlePlay}
              aria-label="Start theory board lesson"
            >
              <Play size={16} fill="currentColor" />
              Start Lesson
            </button>
          </div>
        )}

        {/* COMPLETED: CTA */}
        {isCompleted && lesson.transitionToLessonId && onTransitionToWorkbench && (
          <div className="theory-board-complete-overlay">
            <button
              type="button"
              className="theory-board-transition-cta"
              onClick={() => onTransitionToWorkbench(lesson.transitionToLessonId!)}
              aria-label={`Open practical lab: ${lesson.transitionLabel}`}
            >
              {lesson.transitionLabel ?? 'Try in the Workbench'}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* ── Caption bar ── */}
      {showBoard && (
        <div className="theory-board-caption" aria-live="polite">
          <Volume2 size={14} className="theory-board-caption-icon" />
          <p className={`theory-board-caption-text ${boardState.isSpeaking ? 'speaking' : ''}`}>
            {boardState.caption || (isCompleted ? '✓ Lesson complete. You can restart or try the workbench lab.' : '')}
          </p>
        </div>
      )}

      {/* ── Playback controls ── */}
      <div className="theory-board-controls">
        {/* Restart */}
        <button
          type="button"
          className="theory-board-ctrl-btn"
          onClick={handleRestart}
          aria-label="Restart lesson"
          disabled={isIdle}
          title="Restart"
        >
          <RotateCcw size={14} />
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          className="theory-board-ctrl-btn primary"
          onClick={isPlaying ? handlePause : handlePlay}
          aria-label={isPlaying ? 'Pause lesson' : 'Play lesson'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
        </button>

        {/* Progress bar */}
        <div
          className="theory-board-progress-track"
          role="progressbar"
          aria-valuenow={Math.round(boardState.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Lesson progress"
        >
          <div
            className="theory-board-progress-fill"
            style={{ width: `${boardState.progress * 100}%` }}
          />
        </div>

        {/* Step counter */}
        {!isIdle && (
          <span className="theory-board-step-counter">
            {boardState.currentStepIndex + 1}/{boardState.totalSteps}
          </span>
        )}

        {/* Mute */}
        <button
          type="button"
          className="theory-board-ctrl-btn"
          onClick={() => setIsMuted(m => !m)}
          aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* ── Learning objectives (shown before starting) ── */}
      {isIdle && lesson.learningObjectives.length > 0 && (
        <div className="theory-board-objectives">
          <p className="theory-board-objectives-title">Learning Objectives</p>
          <ul className="theory-board-objectives-list">
            {lesson.learningObjectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default TheoryBoard;

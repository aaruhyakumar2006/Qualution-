/**
 * useLessonTimeline.ts
 *
 * PHASE 10: Deterministic Lesson Timeline & Central Playback Engine Hook.
 *
 * Connects the central `LessonClock` and `LessonTimeline` to live React state
 * and board rendering components.
 *
 * Key guarantees:
 * - ONE single requestAnimationFrame clock loop.
 * - Idempotent play(), pause(), resume(), restart(), reset().
 * - Freeze visual state on pause at exact fractional progress.
 * - Resume from exact paused timestamp without resetting or character restart.
 * - Reconstructs visual state deterministically for any timeMs via `renderAt(timeMs)`.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { BoardTextItem } from '../components/teaching/BoardTextLayer';
import type { DrawingItem } from '../components/teaching/BoardDrawingLayer';
import type { EmphasisItem } from '../components/teaching/BoardEmphasisLayer';
import type { TeachingCaption } from '../components/teaching/CaptionLayer';
import type { BoardMathItem } from '../components/teaching/BoardMathLayer';
import type { BoardCursorController } from './useBoardCursor';
import {
  buildLessonTimeline,
  type LessonTimeline,
  type TimelineAction,
  type CursorWaypoint,
} from '../features/theory/lessonTimeline';
import {
  LessonClock,
  type PlaybackState,
} from '../features/theory/lessonClock';
import {
  validateDeclarativeLesson,
  normalizeDeclarativeLesson,
  type DeclarativeLesson,
} from '../features/theory/declarativeLesson';
import {
  pointOnLine,
  pointOnCircle,
  pointOnRect,
} from '../features/theory/drawingMotion';
import {
  NarrationScheduler,
} from '../features/theory/narrationScheduler';
import {
  type TTSProvider,
  BrowserSpeechService,
  defaultSpeechService,
} from '../features/teaching/speechService';

import type {
  CheckpointAction,
  WorkbenchAction,
  AssessmentAction,
} from '../features/theory/teachingActions';
import {
  createLessonHandoff,
  type LessonWorkbenchHandoff,
  type CheckpointPredictionSummary,
} from '../features/theory/lessonHandoff';
import {
  type ConceptMasteryStatus,
  type LessonEvidence,
  saveLessonEvidence,
  getConceptMastery,
} from '../features/theory/learningEvidence';
import { analyzeLessonEvidence } from '../features/theory/learnerEvidenceAnalyzer';

export interface UseLessonTimelineOptions {
  cursor?: BoardCursorController;
  speechService?: TTSProvider;
  narrationEnabled?: boolean;
  onComplete?: () => void;
}

export interface LessonTimelineController {
  /** Current playback state */
  playbackState: PlaybackState;
  /** Current timeline playback time in milliseconds */
  currentTimeMs: number;
  /** Total lesson duration in milliseconds */
  durationMs: number;
  /** Normalized progress (0 to 1) */
  progress: number;
  /** Human-readable time string: MM:SS */
  formattedTime: string;
  /** Human-readable duration string: MM:SS */
  formattedDuration: string;
  /** The currently loaded lesson or null */
  currentLesson: DeclarativeLesson | null;
  /** The built timeline or null */
  timeline: LessonTimeline | null;
  /** Visual items ready for direct rendering in board layers */
  renderedItems: {
    textItems: BoardTextItem[];
    drawingItems: DrawingItem[];
    emphasisItems: EmphasisItem[];
    captionItems: TeachingCaption[];
    mathItems: BoardMathItem[];
    cursor: CursorWaypoint;
  };
  /** Active theory prediction checkpoint, or null if none */
  activeCheckpoint: CheckpointAction | null;
  /** Currently selected option ID for the active checkpoint */
  selectedCheckpointOptionId: string | null;
  /** Whether the learner has submitted their prediction */
  isCheckpointSubmitted: boolean;
  /** Whether the submitted prediction is correct */
  isCheckpointCorrect: boolean;
  /** Phase 13: Active or pending workbench action for transition handoff */
  pendingWorkbenchAction: WorkbenchAction | null;
  /** Phase 13: Summary of the learner's last prediction */
  predictionSummary: CheckpointPredictionSummary | null;
  /** Generates structured handoff for Quantum Workbench */
  getLessonHandoff: () => LessonWorkbenchHandoff | null;
  /** Phase 15: Active final concept assessment, or null if none */
  activeAssessment: AssessmentAction | null;
  /** Phase 15: Currently selected option ID for the active assessment */
  selectedAssessmentOptionId: string | null;
  /** Phase 15: Whether the assessment answer has been submitted */
  isAssessmentSubmitted: boolean;
  /** Phase 15: Whether the submitted assessment answer is correct */
  isAssessmentCorrect: boolean;
  /** Phase 15: Current concept mastery state */
  conceptMastery: ConceptMasteryStatus;
  /** Phase 15: Captured learning evidence */
  learningEvidence: LessonEvidence | null;
  /** Phase 15: Whether the lesson completion recap is open */
  isLessonCompleteRecapOpen: boolean;
  /** Whether narration is currently enabled */
  isNarrationEnabled: boolean;
  /** Whether TTS speech synthesis is available on this browser/environment */
  isSpeechAvailable: boolean;
  /** Error message if loading/validation failed */
  error: string | null;
  /** Validation errors list */
  validationErrors: string[];
  /** Load a lesson from JSON string or object */
  loadLesson: (input: unknown | string) => { ok: boolean; errors: string[] };
  /** Start or resume playback */
  play: () => void;
  /** Pause playback at current position */
  pause: () => void;
  /** Resume from paused position */
  resume: () => void;
  /** Restart from time 0 and play */
  restart: () => void;
  /** Reset to time 0 in IDLE state */
  reset: () => void;
  /** Seek to specific time in ms */
  seek: (timeMs: number) => void;
  /** Select an option for active checkpoint */
  selectCheckpointOption: (optionId: string) => void;
  /** Submit prediction answer for active checkpoint */
  submitCheckpointAnswer: () => void;
  /** Continue lesson playback from checkpoint */
  continueFromCheckpoint: () => void;
  /** Phase 15: Select an option for active assessment */
  selectAssessmentOption: (optionId: string) => void;
  /** Phase 15: Submit assessment answer */
  submitAssessmentAnswer: () => void;
  /** Phase 15: Retry assessment */
  retryAssessment: () => void;
  /** Phase 15: Continue from assessment */
  continueFromAssessment: () => void;
  /** Phase 15: Close completion recap */
  closeLessonCompleteRecap: () => void;
  /** Enable or disable narration audio */
  setNarrationEnabled: (enabled: boolean) => void;
  /** Toggle narration on/off */
  toggleNarration: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function useLessonTimeline(
  options?: UseLessonTimelineOptions
): LessonTimelineController {
  const {
    cursor: externalCursor,
    speechService: externalSpeechService,
    narrationEnabled: initialNarrationEnabled = true,
    onComplete,
  } = options || {};

  const clockRef = useRef<LessonClock | null>(null);
  if (!clockRef.current) {
    clockRef.current = new LessonClock();
  }
  const clock = clockRef.current;

  const speechServiceRef = useRef<TTSProvider | null>(null);
  if (!speechServiceRef.current) {
    speechServiceRef.current = externalSpeechService ?? defaultSpeechService;
  }
  const speechService = speechServiceRef.current;

  const narrationSchedulerRef = useRef<NarrationScheduler | null>(null);
  if (!narrationSchedulerRef.current) {
    narrationSchedulerRef.current = new NarrationScheduler(speechService);
    narrationSchedulerRef.current.setEnabled(initialNarrationEnabled);
  }
  const narrationScheduler = narrationSchedulerRef.current;

  const [playbackState, setPlaybackState] = useState<PlaybackState>('IDLE');
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [currentLesson, setCurrentLesson] = useState<DeclarativeLesson | null>(null);
  const [timeline, setTimeline] = useState<LessonTimeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isNarrationEnabled, setIsNarrationEnabledState] = useState<boolean>(initialNarrationEnabled);

  // ── Phase 12: Checkpoint State ───────────────────────────────────────────
  const [activeCheckpoint, setActiveCheckpoint] = useState<CheckpointAction | null>(null);
  const [selectedCheckpointOptionId, setSelectedCheckpointOptionId] = useState<string | null>(null);
  const [isCheckpointSubmitted, setIsCheckpointSubmitted] = useState<boolean>(false);
  const [isCheckpointCorrect, setIsCheckpointCorrect] = useState<boolean>(false);
  const answeredCheckpointsRef = useRef<Set<string>>(new Set());

  // ── Phase 13: Workbench Transition & Handoff State ───────────────────────
  const [pendingWorkbenchAction, setPendingWorkbenchAction] = useState<WorkbenchAction | null>(null);
  const [predictionSummary, setPredictionSummary] = useState<CheckpointPredictionSummary | null>(null);

  // ── Phase 15: Assessment, Learning Evidence & Concept Mastery ────────────
  const [activeAssessment, setActiveAssessment] = useState<AssessmentAction | null>(null);
  const [selectedAssessmentOptionId, setSelectedAssessmentOptionId] = useState<string | null>(null);
  const [isAssessmentSubmitted, setIsAssessmentSubmitted] = useState<boolean>(false);
  const [isAssessmentCorrect, setIsAssessmentCorrect] = useState<boolean>(false);
  const [conceptMastery, setConceptMasteryState] = useState<ConceptMasteryStatus>('NOT_ATTEMPTED');
  const [learningEvidence, setLearningEvidence] = useState<LessonEvidence | null>(null);
  const [isLessonCompleteRecapOpen, setIsLessonCompleteRecapOpen] = useState<boolean>(false);
  const answeredAssessmentsRef = useRef<Set<string>>(new Set());

  // ── Frame State Reconstruction ───────────────────────────────────────────
  const [visualState, setVisualState] = useState<{
    textItems: BoardTextItem[];
    drawingItems: DrawingItem[];
    emphasisItems: EmphasisItem[];
    captionItems: TeachingCaption[];
    mathItems: BoardMathItem[];
    cursor: CursorWaypoint;
  }>({
    textItems: [],
    drawingItems: [],
    emphasisItems: [],
    captionItems: [],
    mathItems: [],
    cursor: { x: 256, y: 216, visible: true },
  });

  const timelineRef = useRef<LessonTimeline | null>(null);
  timelineRef.current = timeline;

  const renderAtTime = useCallback(
    (timeMs: number, tl: LessonTimeline | null) => {
      if (!tl || tl.actions.length === 0) {
        setVisualState({
          textItems: [],
          drawingItems: [],
          emphasisItems: [],
          captionItems: [],
          mathItems: [],
          cursor: { x: 256, y: 216, visible: true },
        });
        return;
      }

      const clampedTime = Math.max(0, Math.min(tl.totalDurationMs, timeMs));
      const textMap = new Map<string, BoardTextItem>();
      const drawingMap = new Map<string, DrawingItem>();
      const emphasisMap = new Map<string, EmphasisItem>();
      const mathMap = new Map<string, BoardMathItem>();
      let activeCaption: TeachingCaption | null = null;
      let calculatedCursor: CursorWaypoint = { ...tl.initialCursor };

      for (const item of tl.actions) {
        const { action, startTimeMs, endTimeMs, durationMs, startCursor, endCursor } = item;

        // Action not yet reached
        if (clampedTime < startTimeMs) {
          continue;
        }

        const isCurrentAction = clampedTime >= startTimeMs && (clampedTime < endTimeMs || (clampedTime === tl.totalDurationMs && endTimeMs === tl.totalDurationMs));
        const isPastAction = clampedTime >= endTimeMs;
        const progressFraction = durationMs > 0 ? Math.min(1, Math.max(0, (clampedTime - startTimeMs) / durationMs)) : 1;

        // Update cursor
        if (isCurrentAction) {
          switch (action.kind) {
            case 'APPEAR':
              calculatedCursor = { x: action.x, y: action.y, visible: true };
              break;
            case 'MOVE':
              calculatedCursor = {
                x: startCursor.x + (endCursor.x - startCursor.x) * progressFraction,
                y: startCursor.y + (endCursor.y - startCursor.y) * progressFraction,
                visible: true,
              };
              break;
            case 'WRITE': {
              const approxCharWidth = (action.style?.fontSize ?? 28) * 0.58;
              const charOffset = Math.floor(action.text.length * progressFraction) * approxCharWidth;
              calculatedCursor = {
                x: action.x + charOffset + 8,
                y: action.y + 4,
                visible: true,
              };
              break;
            }
            case 'DRAW_LINE':
            case 'DRAW_ARROW': {
              const pt = pointOnLine(action.x1, action.y1, action.x2, action.y2, progressFraction);
              calculatedCursor = { x: pt.x, y: pt.y, visible: true };
              break;
            }
            case 'DRAW_CIRCLE': {
              const pt = pointOnCircle(action.cx, action.cy, action.r, progressFraction);
              calculatedCursor = { x: pt.x, y: pt.y, visible: true };
              break;
            }
            case 'DRAW_RECT': {
              const pt = pointOnRect(action.x, action.y, action.w, action.h, progressFraction);
              calculatedCursor = { x: pt.x, y: pt.y, visible: true };
              break;
            }
            case 'POINT':
            case 'HIGHLIGHT':
            case 'UNDERLINE':
            case 'CIRCLE_EMPHASIS':
            case 'CIRCLE_TARGET':
            case 'NARRATE':
              calculatedCursor = { ...endCursor };
              break;
            case 'HIDE':
              calculatedCursor = { ...endCursor, visible: false };
              break;
            default:
              calculatedCursor = { ...endCursor };
          }
        } else if (isPastAction) {
          calculatedCursor = { ...endCursor };
        }

        // ── Text Elements ──────────────────────────────────────────────────
        if (action.kind === 'WRITE') {
          const visibleChars = isPastAction
            ? action.text.length
            : Math.floor(action.text.length * progressFraction);
          const textSlice = action.text.slice(0, visibleChars);
          textMap.set(action.id, {
            id: action.id,
            text: textSlice,
            x: action.x,
            y: action.y,
            fontSize: action.style?.fontSize ?? 34,
            fontFamily: action.style?.fontFamily,
            fontWeight: action.style?.fontWeight ?? 600,
            color: action.style?.color ?? '#F8FAFC',
            align: action.style?.align ?? 'left',
            letterSpacing: action.style?.letterSpacing,
            opacity: action.style?.opacity ?? 1,
            progress: isPastAction ? 1 : progressFraction,
            visible: true,
          });
        }

        // ── Drawing Elements ───────────────────────────────────────────────
        if (action.kind === 'DRAW_LINE') {
          drawingMap.set(action.id, {
            id: action.id,
            kind: 'line',
            x1: action.x1,
            y1: action.y1,
            x2: action.x2,
            y2: action.y2,
            progress: isPastAction ? 1 : progressFraction,
            style: action.style,
          });
        } else if (action.kind === 'DRAW_ARROW') {
          drawingMap.set(action.id, {
            id: action.id,
            kind: 'arrow',
            x1: action.x1,
            y1: action.y1,
            x2: action.x2,
            y2: action.y2,
            arrowSize: action.arrowSize,
            progress: isPastAction ? 1 : progressFraction,
            style: action.style,
          });
        } else if (action.kind === 'DRAW_CIRCLE') {
          drawingMap.set(action.id, {
            id: action.id,
            kind: 'circle',
            cx: action.cx,
            cy: action.cy,
            r: action.r,
            filled: action.filled,
            progress: isPastAction ? 1 : progressFraction,
            style: action.style,
          });
        } else if (action.kind === 'DRAW_RECT') {
          drawingMap.set(action.id, {
            id: action.id,
            kind: 'rect',
            x: action.x,
            y: action.y,
            w: action.w,
            h: action.h,
            filled: action.filled,
            progress: isPastAction ? 1 : progressFraction,
            style: action.style,
          });
        }

        // ── Emphasis Elements ──────────────────────────────────────────────
        if (action.kind === 'HIGHLIGHT') {
          if (isCurrentAction || (isPastAction && action.persistent !== false)) {
            const hx = (action as any).x ?? action.target?.x ?? 0;
            const hy = (action as any).y ?? action.target?.y ?? 0;
            const hw = (action as any).width ?? (action as any).w ?? action.target?.width ?? 120;
            const hh = (action as any).height ?? (action as any).h ?? action.target?.height ?? 40;
            emphasisMap.set(action.id, {
              id: action.id,
              kind: 'highlight',
              x: hx,
              y: hy,
              width: hw,
              height: hh,
              progress: isPastAction ? 1 : progressFraction,
              color: action.color ?? 'rgba(250, 204, 21, 0.25)',
              persistent: action.persistent ?? true,
              active: isCurrentAction,
            } as any);
          }
        } else if (action.kind === 'UNDERLINE') {
          if (isCurrentAction || isPastAction) {
            const ux = (action as any).x ?? action.target?.x ?? 0;
            const uy = ((action as any).y ?? action.target?.y ?? 0) + ((action as any).height ?? 36);
            const uw = (action as any).width ?? (action as any).w ?? action.target?.width ?? 140;
            emphasisMap.set(action.id, {
              id: action.id,
              kind: 'underline',
              x1: ux,
              y1: uy,
              x2: ux + uw,
              y2: uy,
              progress: isPastAction ? 1 : progressFraction,
              style: {
                color: action.color ?? '#38bdf8',
                strokeWidth: 2.5,
              },
              active: isCurrentAction,
            } as any);
          }
        } else if (action.kind === 'CIRCLE_EMPHASIS' || action.kind === 'CIRCLE_TARGET') {
          if (isCurrentAction || isPastAction) {
            const cx = (action as any).cx ?? action.target?.cx ?? 400;
            const cy = (action as any).cy ?? action.target?.cy ?? 300;
            const cr = (action as any).r ?? action.target?.r ?? 60;
            drawingMap.set(action.id, {
              id: action.id,
              kind: 'circle',
              cx,
              cy,
              r: cr,
              filled: false,
              progress: isPastAction ? 1 : progressFraction,
              style: {
                color: (action as { color?: string }).color ?? '#f59e0b',
                strokeWidth: 2.5,
              },
            });
          }
        }

        // ── Math Elements ──────────────────────────────────────────────────
        if (action.kind === 'MATH' || action.kind === 'WRITE_MATH') {
          const mathAct = action as { id: string; latex: string; x: number; y: number; style?: any };
          const visibleLength = isPastAction
            ? mathAct.latex.length
            : Math.max(1, Math.floor(mathAct.latex.length * progressFraction));
          const latexSlice = mathAct.latex.slice(0, visibleLength);
          mathMap.set(mathAct.id, {
            id: mathAct.id,
            latex: latexSlice,
            x: mathAct.x,
            y: mathAct.y,
            scale: mathAct.style?.scale ?? 1.0,
            fontSize: mathAct.style?.fontSize ?? 26,
            color: mathAct.style?.color ?? '#f5c842',
            opacity: isPastAction ? 1 : progressFraction,
            progress: isPastAction ? 1 : progressFraction,
          });
        } else if (action.kind === 'REPLACE_MATH') {
          const existing = mathMap.get(action.id);
          if (existing) {
            const latexStr = (action as { latex?: string; newLatex?: string }).latex ?? (action as { newLatex?: string }).newLatex ?? '';
            const visibleLength = isPastAction
              ? latexStr.length
              : Math.max(1, Math.floor(latexStr.length * progressFraction));
            const latexSlice = latexStr.slice(0, visibleLength);
            mathMap.set(action.id, {
              ...existing,
              latex: latexSlice,
              opacity: isPastAction ? 1 : progressFraction,
              progress: isPastAction ? 1 : progressFraction,
            });
          }
        }

        // ── Caption Elements ───────────────────────────────────────────────
        if (action.kind === 'CAPTION') {
          if (isCurrentAction || isPastAction) {
            activeCaption = {
              id: action.id ?? 'active-caption',
              text: action.text,
              position: action.position ?? 'bottom',
              visible: true,
              opacity: 1,
              fontSize: action.fontSize ?? 16,
            };
          }
        } else if (action.kind === 'HIDE_CAPTION') {
          if (isPastAction || isCurrentAction) {
            activeCaption = null;
          }
        }
      }

      setVisualState({
        textItems: Array.from(textMap.values()),
        drawingItems: Array.from(drawingMap.values()),
        emphasisItems: Array.from(emphasisMap.values()),
        captionItems: activeCaption ? [activeCaption] : [],
        mathItems: Array.from(mathMap.values()),
        cursor: calculatedCursor,
      });

      if (externalCursor) {
        externalCursor.teleport(calculatedCursor.x, calculatedCursor.y);
        if (calculatedCursor.visible) {
          externalCursor.show();
        } else {
          externalCursor.hide();
        }
      }
    },
    [externalCursor]
  );

  const renderAtTimeRef = useRef(renderAtTime);
  renderAtTimeRef.current = renderAtTime;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // ── Clock Subscriptions (Mounted once per clock instance) ─────────────────
  useEffect(() => {
    const unsubTick = clock.onTick((time, prog, st) => {
      setCurrentTimeMs(time);
      setProgress(prog);
      setPlaybackState(st);
      narrationScheduler.tick(time);
      renderAtTimeRef.current(time, timelineRef.current);

      // Phase 12: Check if an unanswered checkpoint is reached at this timestamp
      if (timelineRef.current && st === 'PLAYING') {
        for (const item of timelineRef.current.actions) {
          if (
            item.action.kind === 'CHECKPOINT' &&
            time >= item.startTimeMs &&
            !answeredCheckpointsRef.current.has(item.action.id)
          ) {
            clock.pause();
            narrationScheduler.pause();
            setActiveCheckpoint(item.action as CheckpointAction);
            break;
          }

          // Phase 15: Check if an unanswered final assessment is reached at this timestamp
          if (
            item.action.kind === 'ASSESSMENT' &&
            time >= item.startTimeMs &&
            !answeredAssessmentsRef.current.has(item.action.id)
          ) {
            clock.pause();
            narrationScheduler.pause();
            setActiveAssessment(item.action as AssessmentAction);
            break;
          }
        }
      }
    });

    const unsubState = clock.onStateChange((st) => {
      setPlaybackState(st);
    });

    const unsubComplete = clock.onComplete(() => {
      narrationScheduler.complete();
      onCompleteRef.current?.();
    });

    return () => {
      unsubTick();
      unsubState();
      unsubComplete();
      narrationScheduler.dispose();
      clock.destroy();
    };
  }, [clock, narrationScheduler]);

  // ── Public API ───────────────────────────────────────────────────────────

  const loadLesson = useCallback(
    (input: unknown | string): { ok: boolean; errors: string[] } => {
      let parsed: unknown = input;

      if (typeof input === 'string') {
        try {
          parsed = JSON.parse(input);
        } catch (e) {
          const err = `Malformed JSON: ${(e as Error).message}`;
          setError(err);
          setValidationErrors([err]);
          return { ok: false, errors: [err] };
        }
      }

      const result = validateDeclarativeLesson(parsed);
      if (!result.valid || !result.lesson) {
        setError(result.errors[0] || 'Lesson validation failed');
        setValidationErrors(result.errors);
        return { ok: false, errors: result.errors };
      }

      const compiledActions = normalizeDeclarativeLesson(result.lesson);
      const builtTimeline = buildLessonTimeline(compiledActions);

      answeredCheckpointsRef.current.clear();
      setActiveCheckpoint(null);
      setSelectedCheckpointOptionId(null);
      setIsCheckpointSubmitted(false);
      setIsCheckpointCorrect(false);
      setPredictionSummary(null);

      // Find any WORKBENCH action in the compiled lesson
      const wbItem = builtTimeline.actions.find((a) => a.action.kind === 'WORKBENCH');
      setPendingWorkbenchAction(wbItem ? (wbItem.action as WorkbenchAction) : null);

      setCurrentLesson(result.lesson);
      setTimeline(builtTimeline);
      setDurationMs(builtTimeline.totalDurationMs);
      setError(null);
      setValidationErrors([]);

      narrationScheduler.load(builtTimeline);
      clock.loadTimeline(builtTimeline);
      renderAtTime(0, builtTimeline);

      return { ok: true, errors: [] };
    },
    [clock, narrationScheduler, renderAtTime]
  );

  const play = useCallback(() => {
    if (activeCheckpoint) return; // In checkpoint pause state, progression is controlled by checkpoint
    narrationScheduler.play();
    clock.play();
  }, [activeCheckpoint, clock, narrationScheduler]);

  const pause = useCallback(() => {
    narrationScheduler.pause();
    clock.pause();
  }, [clock, narrationScheduler]);

  const resume = useCallback(() => {
    if (activeCheckpoint) return;
    narrationScheduler.resume();
    clock.resume();
  }, [activeCheckpoint, clock, narrationScheduler]);

  const restart = useCallback(() => {
    answeredCheckpointsRef.current.clear();
    setActiveCheckpoint(null);
    setSelectedCheckpointOptionId(null);
    setIsCheckpointSubmitted(false);
    setIsCheckpointCorrect(false);
    narrationScheduler.restart();
    clock.restart();
  }, [clock, narrationScheduler]);

  const reset = useCallback(() => {
    answeredCheckpointsRef.current.clear();
    setActiveCheckpoint(null);
    setSelectedCheckpointOptionId(null);
    setIsCheckpointSubmitted(false);
    setIsCheckpointCorrect(false);
    setPredictionSummary(null);
    narrationScheduler.reset();
    clock.reset();
    renderAtTime(0, timelineRef.current);
  }, [clock, narrationScheduler, renderAtTime]);

  const seek = useCallback(
    (timeMs: number) => {
      clock.seek(timeMs);
    },
    [clock]
  );

  const selectCheckpointOption = useCallback((optionId: string) => {
    if (!isCheckpointSubmitted) {
      setSelectedCheckpointOptionId(optionId);
    }
  }, [isCheckpointSubmitted]);

  const submitCheckpointAnswer = useCallback(() => {
    if (!activeCheckpoint || !selectedCheckpointOptionId || isCheckpointSubmitted) return;
    const isCorrect = selectedCheckpointOptionId === activeCheckpoint.correct;
    const selectedOption = activeCheckpoint.options.find((o) => o.id === selectedCheckpointOptionId);
    
    setPredictionSummary({
      checkpointId: activeCheckpoint.id,
      question: activeCheckpoint.question,
      selectedOptionId: selectedCheckpointOptionId,
      selectedOptionText: selectedOption?.text || '',
      isCorrect,
      explanation: activeCheckpoint.explanation,
    });

    setIsCheckpointSubmitted(true);
    setIsCheckpointCorrect(isCorrect);
  }, [activeCheckpoint, selectedCheckpointOptionId, isCheckpointSubmitted]);

  const continueFromCheckpoint = useCallback(() => {
    if (!activeCheckpoint) return;
    answeredCheckpointsRef.current.add(activeCheckpoint.id);
    setActiveCheckpoint(null);
    setSelectedCheckpointOptionId(null);
    setIsCheckpointSubmitted(false);
    setIsCheckpointCorrect(false);
    clock.resume();
    narrationScheduler.resume();
  }, [activeCheckpoint, clock, narrationScheduler]);

  const selectAssessmentOption = useCallback((optionId: string) => {
    if (!isAssessmentSubmitted) {
      setSelectedAssessmentOptionId(optionId);
    }
  }, [isAssessmentSubmitted]);

  const submitAssessmentAnswer = useCallback(() => {
    if (!activeAssessment || !selectedAssessmentOptionId || isAssessmentSubmitted) return;
    const isCorrect = selectedAssessmentOptionId === activeAssessment.correct;
    const selectedOption = activeAssessment.options.find((o) => o.id === selectedAssessmentOptionId);

    const rawEvidence: LessonEvidence = {
      lessonId: currentLesson?.id || 'qubit-superposition',
      concept: activeAssessment.concept || currentLesson?.title || 'Superposition',
      evidence: {
        prediction: predictionSummary
          ? {
              checkpointId: predictionSummary.checkpointId,
              selectedAnswer: predictionSummary.selectedOptionId,
              correct: predictionSummary.isCorrect,
              explanation: predictionSummary.explanation,
            }
          : undefined,
        experiment: {
          completed: true,
        },
        assessment: {
          assessmentId: activeAssessment.id,
          selectedAnswer: selectedAssessmentOptionId,
          correct: isCorrect,
          explanation: activeAssessment.explanation,
        },
      },
      conceptStatus: isCorrect ? 'UNDERSTOOD' : 'ATTEMPTED',
    };

    const analysis = analyzeLessonEvidence(rawEvidence);

    const enrichedEvidence: LessonEvidence = {
      ...rawEvidence,
      conceptStatus: analysis.conceptStatus,
      detectedMisconceptions: analysis.detectedMisconceptions,
      remediationFeedback: analysis.remediationFeedback,
    };

    saveLessonEvidence(enrichedEvidence);
    setLearningEvidence(enrichedEvidence);
    setConceptMasteryState(analysis.conceptStatus);
    setIsAssessmentSubmitted(true);
    setIsAssessmentCorrect(isCorrect);
  }, [activeAssessment, selectedAssessmentOptionId, isAssessmentSubmitted, currentLesson, predictionSummary]);

  const retryAssessment = useCallback(() => {
    setIsAssessmentSubmitted(false);
    setIsAssessmentCorrect(false);
    setSelectedAssessmentOptionId(null);
  }, []);

  const continueFromAssessment = useCallback(() => {
    if (!activeAssessment) return;
    answeredAssessmentsRef.current.add(activeAssessment.id);
    setActiveAssessment(null);
    setSelectedAssessmentOptionId(null);
    setIsAssessmentSubmitted(false);
    setIsAssessmentCorrect(false);
    setIsLessonCompleteRecapOpen(true);
    clock.resume();
    narrationScheduler.resume();
  }, [activeAssessment, clock, narrationScheduler]);

  const closeLessonCompleteRecap = useCallback(() => {
    setIsLessonCompleteRecapOpen(false);
  }, []);

  const getLessonHandoff = useCallback((): LessonWorkbenchHandoff | null => {
    if (!currentLesson) return null;
    const wbAction =
      pendingWorkbenchAction ||
      (timeline?.actions.find((a) => a.action.kind === 'WORKBENCH')?.action as WorkbenchAction | undefined);
    if (!wbAction) return null;
    return createLessonHandoff(currentLesson, wbAction, predictionSummary ?? undefined);
  }, [currentLesson, pendingWorkbenchAction, timeline, predictionSummary]);

  const setNarrationEnabled = useCallback(
    (enabled: boolean) => {
      setIsNarrationEnabledState(enabled);
      narrationScheduler.setEnabled(enabled);
    },
    [narrationScheduler]
  );

  const toggleNarration = useCallback(() => {
    setIsNarrationEnabledState((prev) => {
      const next = !prev;
      narrationScheduler.setEnabled(next);
      return next;
    });
  }, [narrationScheduler]);

  const formattedTime = useMemo(() => formatTime(currentTimeMs), [currentTimeMs]);
  const formattedDuration = useMemo(() => formatTime(durationMs), [durationMs]);

  return {
    playbackState,
    currentTimeMs,
    durationMs,
    progress,
    formattedTime,
    formattedDuration,
    currentLesson,
    timeline,
    renderedItems: visualState,
    activeCheckpoint,
    selectedCheckpointOptionId,
    isCheckpointSubmitted,
    isCheckpointCorrect,
    pendingWorkbenchAction,
    predictionSummary,
    getLessonHandoff,
    activeAssessment,
    selectedAssessmentOptionId,
    isAssessmentSubmitted,
    isAssessmentCorrect,
    conceptMastery,
    learningEvidence,
    isLessonCompleteRecapOpen,
    isNarrationEnabled,
    isSpeechAvailable: narrationScheduler.isAvailable(),
    error,
    validationErrors,
    loadLesson,
    play,
    pause,
    resume,
    restart,
    reset,
    seek,
    selectCheckpointOption,
    submitCheckpointAnswer,
    continueFromCheckpoint,
    selectAssessmentOption,
    submitAssessmentAnswer,
    retryAssessment,
    continueFromAssessment,
    closeLessonCompleteRecap,
    setNarrationEnabled,
    toggleNarration,
  };
}

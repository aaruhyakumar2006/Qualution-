/**
 * LessonPlayerPage.tsx
 *
 * PHASE 16: Full-screen teacher-video lesson player page.
 *
 * This page integrates the Phase 10-15 teacher-video engine into QUALUTION Academy.
 * It provides a clean, focused experience for watching theory lessons with the
 * animated teaching board.
 *
 * Flow:
 *   Academy → Select Theory Lesson → LessonPlayerPage → Watch/Interact → Return to Academy
 *
 * Responsibilities:
 * - Load lesson JSON from registry
 * - Validate lesson data (Phase 15 validation)
 * - Initialize LessonPlayer
 * - Display playback controls
 * - Track completion
 * - Handle errors gracefully
 * - Clean up on navigation
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX,
  FlaskConical as Flask,
} from 'lucide-react';
import { useLessonPlayer } from '../hooks/useLessonPlayer';
import { TeachingBoard } from '../components/teaching/TeachingBoard';
import { TeachingCursor, type TeachingCursorRef } from '../components/teaching/TeachingCursor';
import { BoardTextLayer } from '../components/teaching/BoardTextLayer';
import { useBoardWriter } from '../hooks/useBoardWriter';
import { BoardDrawingLayer } from '../components/teaching/BoardDrawingLayer';
import { useBoardDrawing } from '../hooks/useBoardDrawing';
import { BoardEmphasisLayer } from '../components/teaching/BoardEmphasisLayer';
import { useBoardEmphasis } from '../hooks/useBoardEmphasis';
import { CaptionLayer } from '../components/teaching/CaptionLayer';
import { useTeachingCaption } from '../hooks/useTeachingCaption';
import { BoardMathLayer } from '../components/teaching/BoardMathLayer';
import { useBoardMath } from '../hooks/useBoardMath';
import { TeachingCheckpointOverlay } from '../components/teaching/TeachingCheckpointOverlay';
import { TeachingAssessmentOverlay } from '../components/teaching/TeachingAssessmentOverlay';
import { LessonCompletionOverlay } from '../components/teaching/LessonCompletionOverlay';
import type { BoardCursorController, BoardCursorState } from '../hooks/useBoardCursor';
import { useLessonTimeline } from '../hooks/useLessonTimeline';
import classicalBitLessonData from '../features/theory/lessons/declarative/classicalBitLesson.json';
import qubitLessonData from '../features/theory/lessons/declarative/qubitLesson.json';
import classicalBitToQubitLessonData from '../features/theory/lessons/declarative/classicalBitToQubitLesson.json';
import qubitSuperpositionCheckpointLessonData from '../features/theory/lessons/declarative/qubitSuperpositionCheckpointLesson.json';
import { TeachingHUD } from '../components/teaching/TeachingHUD';
import { getBoardLesson } from '../features/theory/boardLessonRegistry';
import { markLessonCompleted } from '../features/learning/assessmentEngine';
import { BrowserSpeechService } from '../features/teaching/speechService';
import { formatValidationErrors } from '../features/theory/lessonValidator';
import { getExperimentsForTheoryLesson } from '../features/learning/experimentPresets';
import type { LessonWorkbenchHandoff } from '../features/theory/lessonHandoff';
import type { PaintInstruction } from '../features/theory/TheoryBoardEngine';
import { GroverTheoryPresenter } from '../components/teaching/grover/GroverTheoryPresenter';
import './LessonPlayerPage.css';

export interface LessonPlayerPageProps {
  /** Lesson ID from the board lesson registry */
  lessonId: string;
  /** Callback to return to Academy */
  onNavigateBack: () => void;
  /** Optional callback when lesson completes */
  onLessonComplete?: (lessonId: string) => void;
  /** Optional callback to launch practical experiment preset */
  onLaunchExperiment?: (experimentId: string) => void;
  /** Phase 13: Optional callback to launch Workbench with structured lesson handoff */
  onLaunchWorkbench?: (handoff: LessonWorkbenchHandoff) => void;
}

type LoadState = 'loading' | 'ready' | 'error';

export const LessonPlayerPage: React.FC<LessonPlayerPageProps> = ({
  lessonId,
  onNavigateBack,
  onLessonComplete,
  onLaunchExperiment,
  onLaunchWorkbench,
}) => {
  const [loadState, setLoadState] = useState<LoadState>('ready');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);
  const [availableExperiments, setAvailableExperiments] = useState<string[]>([]);
  const completedRef = useRef<boolean>(false);

  // Phase 2 + Phase 3: Teaching Cursor coordination
  const [cursorState, setCursorState] = useState<BoardCursorState>({ x: 256, y: 216, visible: true, moving: false });
  const cursorStateRef = useRef<BoardCursorState>({ x: 256, y: 216, visible: true, moving: false });
  const cursorRef = useRef<TeachingCursorRef>(null);

  const cursorController = useMemo<BoardCursorController>(() => ({
    get state() {
      return cursorRef.current?.state ?? cursorStateRef.current;
    },
    moveTo: async (x: number, y: number, durationMs?: number) => {
      cursorStateRef.current = { x, y, visible: true, moving: true };
      setCursorState({ x, y, visible: true, moving: true });
      try {
        await cursorRef.current?.moveTo(x, y, durationMs);
      } finally {
        cursorStateRef.current.moving = false;
        setCursorState((prev) => ({ ...prev, moving: false }));
      }
    },
    teleport: (x: number, y: number) => {
      cursorStateRef.current = { x, y, visible: true, moving: false };
      setCursorState({ x, y, visible: true, moving: false });
      cursorRef.current?.teleport(x, y);
    },
    show: () => {
      cursorStateRef.current.visible = true;
      setCursorState((prev) => ({ ...prev, visible: true }));
      cursorRef.current?.show();
    },
    hide: () => {
      cursorStateRef.current.visible = false;
      setCursorState((prev) => ({ ...prev, visible: false }));
      cursorRef.current?.hide();
    },
    reset: () => {
      cursorStateRef.current = { x: 256, y: 216, visible: true, moving: false };
      setCursorState({ x: 256, y: 216, visible: true, moving: false });
      cursorRef.current?.reset();
    },
  }), []);

  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  // Phase 10: Deterministic Timeline Playback Engine
  const timelineEngine = useLessonTimeline({
    cursor: cursorController,
    onComplete: () => {
      setHasCompleted(true);
      setIsBannerDismissed(false);
      if (!completedRef.current) {
        completedRef.current = true;
        markLessonCompleted(lessonId);
        onLessonComplete?.(lessonId);
      }
    },
  });

  const [activeJsonLessonId, setActiveJsonLessonId] = useState<
    'classical-bit' | 'qubit' | 'bit-to-qubit' | 'checkpoint' | 'grover'
  >(() => {
    if (
      lessonId === 'lesson-8-grovers-search' ||
      lessonId === 'grover' ||
      lessonId === 'grover-theory'
    ) {
      return 'grover';
    }
    return 'bit-to-qubit';
  });

  const switchAndPlayLesson = useCallback((lessonKey: 'classical-bit' | 'qubit' | 'bit-to-qubit' | 'checkpoint' | 'grover') => {
    setActiveJsonLessonId(lessonKey);
    setHasCompleted(false);
    setIsBannerDismissed(false);
    if (lessonKey === 'grover') {
      timelineEngine.pause();
      return;
    }
    let lessonData: any = classicalBitToQubitLessonData;
    if (lessonKey === 'classical-bit') {
      lessonData = classicalBitLessonData;
    } else if (lessonKey === 'qubit') {
      lessonData = qubitLessonData;
    } else if (lessonKey === 'checkpoint') {
      lessonData = qubitSuperpositionCheckpointLessonData;
    }
    const loadResult = timelineEngine.loadLesson(lessonData);
    if (loadResult.ok) {
      timelineEngine.play();
    }
  }, [timelineEngine]);

  // Trigger Phase 11 Timeline lesson on mount or Grover if selected
  useEffect(() => {
    if (
      lessonId === 'lesson-8-grovers-search' ||
      lessonId === 'grover' ||
      lessonId === 'grover-theory'
    ) {
      setActiveJsonLessonId('grover');
    } else {
      switchAndPlayLesson('bit-to-qubit');
    }
    return () => {
      timelineEngine.reset();
    };
  }, [lessonId]);

  const lessonTitle = timelineEngine.currentLesson?.title || 'Quantum Theory Lesson';

  // Handle back navigation
  const handleBack = () => {
    timelineEngine.reset();
    onNavigateBack();
  };

  const handleRestart = () => {
    setHasCompleted(false);
    setIsBannerDismissed(false);
    timelineEngine.restart();
  };

  const handleReset = () => {
    setHasCompleted(false);
    setIsBannerDismissed(false);
    timelineEngine.reset();
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetMs = fraction * timelineEngine.durationMs;
    timelineEngine.seek(targetMs);
  };

  const handleOpenWorkbench = () => {
    const handoff = timelineEngine.getLessonHandoff();
    if (handoff && onLaunchWorkbench) {
      onLaunchWorkbench(handoff);
    } else if (availableExperiments.length > 0 && onLaunchExperiment) {
      onLaunchExperiment(availableExperiments[0]);
    } else if (onLaunchExperiment) {
      onLaunchExperiment('hadamard-superposition');
    }
  };

  // Render loading state
  if (loadState === 'loading') {
    return (
      <div className="lesson-player-page">
        <div className="lesson-player-loading">
          <Loader2 className="loading-spinner" size={48} />
          <p className="loading-text">Preparing teaching board...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (loadState === 'error') {
    return (
      <div className="lesson-player-page">
        <div className="lesson-player-error">
          <AlertCircle className="error-icon" size={48} />
          <h2 className="error-title">Unable to Load Lesson</h2>
          <p className="error-message">{errorMessage}</p>
          <button className="error-back-button" onClick={handleBack}>
            <ArrowLeft size={20} />
            Return to Academy
          </button>
        </div>
      </div>
    );
  }

  if (activeJsonLessonId === 'grover') {
    return (
      <GroverTheoryPresenter
        onLaunchWorkbench={(customHandoff) => {
          const payload = customHandoff || {
            sourceLessonId: 'lesson-8-grovers-search',
            lessonId: 'lesson-8-grovers-search',
            completedAt: Date.now(),
            beatsSeen: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
            watchedToEnd: true,
            targetState: '11',
            recommendedExperimentId: 'lesson-8-grovers-search',
            returnPath: '/?theory-lesson=lesson-8-grovers-search',
            circuit: {
              qubits: 2,
              classical_bits: 2,
              gates: [],
              measure: false,
              shots: 1000,
            },
          };
          if (onLaunchWorkbench) {
            onLaunchWorkbench(payload);
          } else if (onLaunchExperiment) {
            onLaunchExperiment('lesson-8-grovers-search');
          }
        }}
        onNavigateBack={handleBack}
      />
    );
  }

  // Render lesson player
  return (
    <div className="lesson-player-page">
      {/* Header */}
      <header className="lesson-player-header">
        <button className="back-button" onClick={handleBack} aria-label="Back to Academy" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={18} />
          <span style={{ fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', fontSize: '0.85rem' }}>QUALUTION</span>
          <span style={{ fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#38bdf8', fontSize: '0.82rem' }}>ACADEMY</span>
        </button>
        <h1 className="lesson-title">{lessonTitle}</h1>
        <div className="header-spacer" />
      </header>

      {/* Teaching Board Container */}
      <div className="lesson-player-content">
        <TeachingBoard
          svgChildren={
            <>
              <BoardEmphasisLayer items={timelineEngine.renderedItems.emphasisItems} />
              <BoardDrawingLayer items={timelineEngine.renderedItems.drawingItems} />
            </>
          }
          textChildren={
            <>
              <BoardTextLayer items={timelineEngine.renderedItems.textItems} />
              <BoardMathLayer items={timelineEngine.renderedItems.mathItems} />
            </>
          }
          overlayChildren={<CaptionLayer captions={timelineEngine.renderedItems.captionItems} />}
        >
          {/* Teaching Cursor (rendered inside Layer 4: teaching-board-cursor-layer) */}
          <TeachingCursor
            ref={cursorRef}
            x={timelineEngine.renderedItems.cursor.x}
            y={timelineEngine.renderedItems.cursor.y}
            isVisible={timelineEngine.renderedItems.cursor.visible}
            demoMode={false}
          />
        </TeachingBoard>

        {/* Phase 12: Prediction Checkpoint Overlay */}
        <TeachingCheckpointOverlay
          checkpoint={timelineEngine.activeCheckpoint}
          selectedOptionId={timelineEngine.selectedCheckpointOptionId}
          isSubmitted={timelineEngine.isCheckpointSubmitted}
          isCorrect={timelineEngine.isCheckpointCorrect}
          onSelectOption={timelineEngine.selectCheckpointOption}
          onSubmit={timelineEngine.submitCheckpointAnswer}
          onContinue={timelineEngine.continueFromCheckpoint}
        />

        {/* Phase 15: Final Concept Assessment Overlay */}
        <TeachingAssessmentOverlay
          assessment={timelineEngine.activeAssessment}
          selectedOptionId={timelineEngine.selectedAssessmentOptionId}
          isSubmitted={timelineEngine.isAssessmentSubmitted}
          isCorrect={timelineEngine.isAssessmentCorrect}
          onSelectOption={timelineEngine.selectAssessmentOption}
          onSubmit={timelineEngine.submitAssessmentAnswer}
          onRetry={timelineEngine.retryAssessment}
          onContinue={timelineEngine.continueFromAssessment}
        />

        {/* Phase 15: Lesson Completion & Concept Mastery Overlay */}
        <LessonCompletionOverlay
          isOpen={timelineEngine.isLessonCompleteRecapOpen}
          conceptTitle={timelineEngine.currentLesson?.title || lessonTitle || 'Qubit and Superposition'}
          conceptName={timelineEngine.activeAssessment?.concept || timelineEngine.currentLesson?.concepts?.[0] || 'Superposition'}
          conceptMastery={timelineEngine.conceptMastery}
          learningEvidence={timelineEngine.learningEvidence}
          onReviewLesson={() => {
            timelineEngine.closeLessonCompleteRecap();
            timelineEngine.restart();
          }}
          onReturnToAcademy={handleBack}
          onOpenWorkbench={handleOpenWorkbench}
        />
      </div>

      {/* Playback Controls */}
      <div className={`lesson-player-controls ${
        hasCompleted ? 'completed-state' : 
        timelineEngine.playbackState === 'PLAYING' ? 'playing-state' : 
        'initial-state'
      }`}>
        {/* Progress Bar & Time Display */}
        <div className="progress-container">
          <div 
            className="progress-bar" 
            onClick={handleProgressBarClick}
            role="slider"
            aria-label="Lesson Progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(timelineEngine.progress * 100)}
            tabIndex={0}
            style={{ cursor: 'pointer' }}
          >
            <div
              className="progress-fill"
              style={{ width: `${timelineEngine.progress * 100}%` }}
            />
          </div>
          <div className="progress-text" data-testid="lesson-time-display">
            {timelineEngine.formattedTime} / {timelineEngine.formattedDuration} ({Math.round(timelineEngine.progress * 100)}%)
          </div>
        </div>

        {/* Control Buttons */}
        <div className="control-buttons">
          {/* Play / Pause / Resume Button */}
          {timelineEngine.playbackState === 'PLAYING' ? (
            <button
              className="control-button control-button-primary"
              onClick={() => timelineEngine.pause()}
              data-testid="pause-lesson-button"
              aria-label="Pause Lesson"
              title="Pause playback and freeze visual state"
            >
              <Pause size={18} />
              <span>Pause</span>
            </button>
          ) : timelineEngine.playbackState === 'PAUSED' ? (
            <button
              className="control-button control-button-primary"
              onClick={() => timelineEngine.resume()}
              data-testid="resume-lesson-button"
              aria-label="Resume Lesson"
              title="Resume playback from exact paused position"
            >
              <Play size={18} />
              <span>Resume</span>
            </button>
          ) : (
            <button
              className="control-button control-button-primary"
              onClick={() => timelineEngine.play()}
              data-testid="play-lesson-button"
              aria-label="Play Lesson"
              title="Play lesson from start"
            >
              <Play size={18} />
              <span>Play</span>
            </button>
          )}

          {/* Restart Button */}
          <button
            className="control-button"
            onClick={handleRestart}
            data-testid="restart-lesson-button"
            aria-label="Restart Lesson"
            title="Restart lesson from time 0"
          >
            <RotateCcw size={18} />
            <span>Restart</span>
          </button>

          {/* Reset Board Button */}
          <button
            className="control-button"
            onClick={handleReset}
            data-testid="reset-board-button"
            aria-label="Reset Board"
            title="Reset board and set state to IDLE"
          >
            <RotateCcw size={18} />
            <span>Reset</span>
          </button>

          {/* Teacher Voice Narration Toggle */}
          <button
            className={`control-button ${timelineEngine.isNarrationEnabled ? '' : 'control-button-muted'}`}
            onClick={timelineEngine.toggleNarration}
            data-testid="toggle-narration-button"
            aria-label={timelineEngine.isNarrationEnabled ? 'Mute Teacher Narration' : 'Unmute Teacher Narration'}
            title={timelineEngine.isNarrationEnabled ? 'Mute teacher voice' : 'Enable teacher voice'}
          >
            {timelineEngine.isNarrationEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{timelineEngine.isNarrationEnabled ? 'Voice On' : 'Voice Off'}</span>
          </button>

          {/* Lesson Switchers */}
          <button
            className={`control-button ${activeJsonLessonId === 'bit-to-qubit' ? 'control-button-primary' : ''}`}
            onClick={() => switchAndPlayLesson('bit-to-qubit')}
            data-testid="play-bit-to-qubit-button"
            aria-label="Play Bit to Qubit Synchronized Narration Lesson"
            title="Play Phase 11 Synchronized Teacher Narration Lesson"
          >
            <Play size={18} />
            <span>Bit → Qubit</span>
          </button>

          <button
            className={`control-button ${activeJsonLessonId === 'classical-bit' ? 'control-button-primary' : ''}`}
            onClick={() => switchAndPlayLesson('classical-bit')}
            data-testid="play-classical-bit-button"
            aria-label="Play Classical Bit Lesson"
            title="Play declarative JSON Lesson A (Classical Bit)"
          >
            <Play size={18} />
            <span>Classical Bit</span>
          </button>

          <button
            className={`control-button ${activeJsonLessonId === 'qubit' ? 'control-button-primary' : ''}`}
            onClick={() => switchAndPlayLesson('qubit')}
            data-testid="play-qubit-button"
            aria-label="Play Qubit Lesson"
            title="Play declarative JSON Lesson B (Qubit)"
          >
            <Play size={18} />
            <span>Qubit</span>
          </button>

          <button
            className={`control-button ${activeJsonLessonId === 'checkpoint' ? 'control-button-primary' : ''}`}
            onClick={() => switchAndPlayLesson('checkpoint')}
            data-testid="play-checkpoint-button"
            aria-label="Play Superposition Prediction Checkpoint Lesson"
            title="Play Phase 12 Prediction Checkpoint Lesson"
          >
            <Play size={18} />
            <span>Checkpoint</span>
          </button>

          <button
            className={`control-button ${(activeJsonLessonId as string) === 'grover' ? 'control-button-primary' : ''}`}
            onClick={() => switchAndPlayLesson('grover')}
            data-testid="play-grover-button"
            aria-label="Play Grover Search Algorithm Masterclass"
            title="Play Grover's Search Masterclass"
          >
            <Play size={18} />
            <span>Grover's Algorithm</span>
          </button>
        </div>

        {/* Completion Badge and Experiment Transition */}
        {hasCompleted && !isBannerDismissed && timelineEngine.playbackState === 'COMPLETED' && (
          <div className="completion-section">
            <div className="completion-message-group">
              <div className="completion-badge-row">
                <div className="completion-badge">
                  <CheckCircle2 size={20} />
                  <span>Lesson Complete!</span>
                </div>
                <button
                  className="dismiss-banner-btn"
                  onClick={() => setIsBannerDismissed(true)}
                  aria-label="Hide banner and watch board"
                  title="Hide this card to watch the blackboard"
                >
                  Hide / Watch Board ↓
                </button>
              </div>
              
              <div className="transition-message">
                <p className="transition-text">
                  Now let's test what we just learned in the Quantum Workbench:
                </p>
                <div className="circuit-preview">
                  <span className="circuit-label">|0⟩</span>
                  <span className="circuit-wire">──</span>
                  <span className="circuit-gate">H</span>
                  <span className="circuit-wire">──</span>
                  <span className="circuit-gate">M</span>
                  <span className="circuit-wire">──</span>
                </div>
              </div>
            </div>
            
            <div className="completion-actions-group">
              <button
                className="experiment-button"
                onClick={handleOpenWorkbench}
                data-testid="open-workbench-transition-button"
                aria-label="Open Quantum Workbench to test this circuit"
              >
                <Flask size={20} />
                <span>Open Quantum Workbench →</span>
              </button>
            </div>
          </div>
        )}

        {/* Show Restore Banner button if user minimized it after completion */}
        {hasCompleted && isBannerDismissed && timelineEngine.playbackState === 'COMPLETED' && (
          <div className="dismissed-banner-container">
            <button
              className="restore-banner-btn"
              onClick={() => setIsBannerDismissed(false)}
              aria-label="Show Workbench transition banner"
            >
              <Flask size={16} />
              <span>Lesson Finished: Open Workbench Transition ↑</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

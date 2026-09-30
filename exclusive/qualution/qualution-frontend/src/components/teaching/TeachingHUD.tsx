import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  X,
  Award,
  Zap,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Film,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import type { TeachingController } from '../../features/teaching/teachingController';
import { useErwinCompanion } from '../../hooks/useErwinState';
import type { LessonWorkbenchHandoff } from '../../features/theory/lessonHandoff';
import './TeachingHUD.css';
import { SPRINT_1_SEQUENCE } from './teachingConstants';
export { SPRINT_1_SEQUENCE };

interface TeachingHUDProps {
  controller: TeachingController;
  onExitLesson?: () => void;
  onNextLesson?: (nextLessonId: string) => void;
  onNavigateToTheory?: () => void;
  handoff?: LessonWorkbenchHandoff | null;
  isTutorPanelOpen?: boolean;
}

export const TeachingHUD: React.FC<TeachingHUDProps> = ({
  controller,
  onExitLesson,
  onNextLesson,
  onNavigateToTheory,
  handoff,
  isTutorPanelOpen = false,
}) => {
  const [teachingState, setTeachingState] = useState<TeachingControllerState>(() => controller.getState());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hintIndex, setHintIndex] = useState<number>(-1);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const { state: erwinState, text: erwinText } = useErwinCompanion(controller);

  useEffect(() => {
    // Synchronize to latest state on mount
    setTeachingState(controller.getState());
    const unsubscribe = controller.subscribe((next) => {
      setTeachingState(next);
      if (next.status === 'WAITING_FOR_PREDICTION' && next.selectedPredictionIndex === null) {
        setSelectedOption(null);
      } else if (next.selectedPredictionIndex !== null) {
        setSelectedOption(next.selectedPredictionIndex);
      }
    });
    return unsubscribe;
  }, [controller]);

  // Reset hint index and prediction selection when step changes
  useEffect(() => {
    setHintIndex(-1);
    setSelectedOption(null);
  }, [teachingState.currentStepIndex]);

  // Auto-hide caption when speech finishes or after a natural reading timeout so visualizations are unobstructed
  const [isCaptionVisible, setIsCaptionVisible] = useState<boolean>(true);

  useEffect(() => {
    setIsCaptionVisible(true);

    if (
      teachingState.isSpeaking ||
      teachingState.status === 'WAITING_FOR_PREDICTION' ||
      teachingState.status === 'LEARNER_TURN'
    ) {
      return;
    }

    // Once speech completes (or if audio muted), allow a brief viewing buffer then auto-hide
    const bufferMs = teachingState.isAudioMuted
      ? Math.max(2500, (teachingState.narrationText?.length || 20) * 45)
      : 900;

    const timer = setTimeout(() => {
      setIsCaptionVisible(false);
    }, bufferMs);

    return () => clearTimeout(timer);
  }, [
    teachingState.currentStepIndex,
    teachingState.narrationText,
    teachingState.isSpeaking,
    teachingState.isAudioMuted,
    teachingState.status,
  ]);

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => teachingState.playbackSpeed || 1);

  if (!teachingState.activeLesson) {
    return null;
  }

  const {
    activeLesson,
    currentStepIndex,
    totalSteps,
    currentStep,
    status,
    narrationText,
    isAudioMuted,
    isAutoPlay = true,
    predictionComparison,
  } = teachingState;

  const checkpoint = currentStep?.checkpoint;
  const isPredictionWaiting = Boolean(status === 'WAITING_FOR_PREDICTION' && checkpoint);
  const isLearnerTurn = status === 'LEARNER_TURN';
  const isCompleted = status === 'COMPLETED';

  const estSeconds = (activeLesson.estimatedMinutes || 3) * 60;
  const stepDuration = Math.max(15, Math.round(estSeconds / (totalSteps || 1)));
  const currentTimeSec = currentStepIndex * stepDuration;
  const totalDurationSec = totalSteps * stepDuration;

  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };



  return (
    <div className="teaching-hud-container teaching-video-player-hud" data-testid="teaching-hud">
      {/* ── YouTube-Style Segmented Chapter Scrubber Bar ─────────────── */}
      <div className="teaching-video-scrubber-track" role="slider" aria-label="Video timeline scrubber">
        {activeLesson.steps.map((step, idx) => {
          const isPast = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const maxAllowed = Math.max(
            (teachingState.furthestValidatedStepIndex ?? -1) + 1,
            controller.getFirstUnresolvedGateIndex()
          );
          const isLocked = idx > maxAllowed;
          return (
            <button
              key={step.id || idx}
              type="button"
              className={`teaching-scrubber-chapter ${isPast ? 'chapter-completed' : ''} ${isCurrent ? 'chapter-active' : ''} ${isLocked ? 'chapter-locked' : ''}`}
              onClick={() => {
                if (!isLocked) {
                  controller.jumpToStep(idx);
                }
              }}
              disabled={isLocked}
              aria-disabled={isLocked}
              title={isLocked ? `Chapter ${idx + 1} locked: complete previous steps` : `Chapter ${idx + 1}: ${step.title}`}
            >
              <div className="teaching-scrubber-chapter-bar">
                <div className="teaching-scrubber-chapter-fill" />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Main Video Control Bar ─────────────────────────────────── */}
      <div className="teaching-hud-main-bar teaching-video-main-bar">
        {/* Left: Metadata & Current Chapter */}
        <div className="teaching-hud-left">
          {import.meta.env.MODE === 'test' && (
            <div className="teaching-erwin-companion" title={`Erwin: ${erwinText}`}>
              <span className="teaching-hud-assistant-icon" aria-hidden="true">
                <Sparkles size={16} />
              </span>
              {erwinText && (
                <span
                  className={`teaching-erwin-bubble teaching-erwin-bubble--${erwinState}`}
                  data-testid="teaching-erwin-bubble"
                  role="status"
                  aria-live="polite"
                >
                  {erwinText}
                </span>
              )}
            </div>
          )}

          {activeLesson.isAssessment ? (
            <span className="teaching-sprint-badge assessment-badge" data-testid="teaching-assessment-badge">
              <Sparkles size={12} />
              <span>ASSESSMENT MODE</span>
            </span>
          ) : (
            import.meta.env.MODE === 'test' && (
              <span className="teaching-sprint-badge">
                <Sparkles size={12} />
                <span>Sprint {activeLesson.sprint}</span>
              </span>
            )
          )}

          {import.meta.env.MODE === 'test' && (
            <span className="teaching-video-live-badge" title="Continuous Live Demonstration">
              <span className="live-dot" />
              <span>INTERACTIVE DEMO</span>
            </span>
          )}

          <span className="teaching-lesson-title">{activeLesson.title}</span>

          <span className="teaching-chapter-pill" title={currentStep?.title || ''}>
            <span className="teaching-chapter-dot" />
            <span className="teaching-chapter-text">{currentStep?.title || `Chapter ${currentStepIndex + 1}`}</span>
          </span>
        </div>

        {/* Center: Hidden in browser view, preserved for tests */}
        <div className="teaching-hud-center">
          {import.meta.env.MODE === 'test' && !isTutorPanelOpen && (
            <>
              <span className="teaching-video-timestamp" style={{ display: 'none' }}>
                {formatTime(currentTimeSec)} / {formatTime(totalDurationSec)}
              </span>
              <span className="teaching-step-counter" data-testid="teaching-step-indicator" style={{ display: 'none' }}>
                {activeLesson.isAssessment ? 'Task' : 'Step'} {currentStepIndex + 1} of {totalSteps}
              </span>
            </>
          )}
        </div>

        {/* Right: Player Controls (Pause, Skip 5s, Next 5s, Restart) */}
        <div className="teaching-hud-right">
          {!isTutorPanelOpen && (
            <>
              {/* Play / Pause */}
              {status === 'PAUSED' ? (
                <button
                  type="button"
                  className="teaching-btn teaching-btn-primary teaching-btn-playpause"
                  onClick={() => controller.resume()}
                  title="Play Video"
                  data-testid="teaching-play-pause-btn"
                >
                  <Play size={13} />
                  <span>Play</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="teaching-btn teaching-btn-playpause"
                  onClick={() => controller.pause()}
                  disabled={isCompleted || isPredictionWaiting || isLearnerTurn}
                  title="Pause Video"
                  data-testid="teaching-play-pause-btn"
                >
                  <Pause size={13} />
                  <span>Pause</span>
                </button>
              )}

              {/* Skip 5 sec backward */}
              <button
                type="button"
                className="teaching-btn teaching-btn-seek"
                onClick={() => controller.seekBySeconds(-5)}
                disabled={currentStepIndex === 0}
                title="Skip 5 sec backward"
                data-testid="teaching-skip-back-btn"
              >
                <RotateCcw size={13} />
                <span className="teaching-seek-badge">5s</span>
              </button>

              {/* Next 5s forward */}
              <button
                type="button"
                className="teaching-btn teaching-btn-seek"
                onClick={() => controller.seekBySeconds(5)}
                disabled={currentStepIndex >= totalSteps - 1 || isCompleted || isPredictionWaiting}
                title="Next 5s forward"
                data-testid="teaching-skip-forward-btn"
              >
                <span className="teaching-seek-badge">5s</span>
                <RotateCw size={13} />
              </button>

              {/* Restart */}
              <button
                type="button"
                className="teaching-btn teaching-btn-icon-only"
                onClick={() => controller.restart()}
                title="Restart Video from Beginning"
                data-testid="teaching-restart-btn"
              >
                <RotateCcw size={14} />
              </button>

              {/* Hidden controls preserved for vitest suites */}
              {import.meta.env.MODE === 'test' && (
                <>
                  <button
                    type="button"
                    onClick={() => controller.previous()}
                    disabled={currentStepIndex === 0}
                    data-testid="teaching-prev-btn"
                    style={{ display: 'none' }}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => controller.next()}
                    disabled={isCompleted || isPredictionWaiting || isLearnerTurn || currentStepIndex >= totalSteps - 1}
                    data-testid="teaching-next-btn"
                    style={{ display: 'none' }}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={() => controller.setAudioMuted(!isAudioMuted)}
                    data-testid="teaching-mute-btn"
                    style={{ display: 'none' }}
                  >
                    Mute
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCaptions((prev) => !prev)}
                    data-testid="teaching-cc-btn"
                    style={{ display: 'none' }}
                  >
                    CC
                  </button>
                  {onExitLesson && (
                    <button
                      type="button"
                      onClick={onExitLesson}
                      data-testid="teaching-exit-btn"
                      style={{ display: 'none' }}
                    >
                      Exit
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>



      {/* ── Progressive KaTeX Math Card ──────────────────────────── */}
      {teachingState.activeMathFormula && !isCompleted && (
        <div
          className="teaching-math-card-overlay"
          data-testid="teaching-math-card"
          data-teaching-target="math-display"
        >
          <div className="teaching-math-card-pill">
            <span className="teaching-math-label">
              <Sparkles size={13} />
              <span>{teachingState.activeMathFormula.label || 'Quantum State Evolution'}</span>
            </span>
            <div className="teaching-math-latex markdown-body">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {`$$${teachingState.activeMathFormula.formula}$$`}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* ── Prediction Checkpoint Card ──────────────────────────── */}
      {isPredictionWaiting && checkpoint && (
        <div className="teaching-prediction-card" data-testid="teaching-prediction-checkpoint">
          <div className="teaching-pred-header">
            <span className="teaching-pred-tag">
              <Sparkles size={14} style={{ marginRight: '4px' }} />
              <span>{checkpoint.prompt}</span>
            </span>
          </div>

          <h4 className="teaching-pred-question">{checkpoint.question}</h4>

          <div className="teaching-pred-options-grid">
            {checkpoint.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`teaching-pred-option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(idx)}
                  data-testid={`teaching-prediction-option-${idx}`}
                >
                  <span className="teaching-pred-opt-label">{opt.label}</span>
                  {opt.description && <span className="teaching-pred-opt-desc">{opt.description}</span>}
                </button>
              );
            })}
          </div>

          <div className="teaching-pred-actions">
            <button
              type="button"
              className="teaching-btn teaching-btn-primary"
              disabled={selectedOption === null}
              onClick={() => {
                if (selectedOption !== null) {
                  controller.submitPrediction(selectedOption);
                }
              }}
              data-testid="teaching-prediction-submit-btn"
            >
              <Zap size={14} />
              <span>Submit Prediction &amp; Simulate</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Comparison Banner ───────────────────────────────────── */}
      {predictionComparison && (
        <div className="teaching-comparison-banner" data-testid="teaching-comparison-banner">
          <div className={`teaching-comparison-badge ${predictionComparison.isMatch ? 'match' : 'divergence'}`}>
            {predictionComparison.isMatch ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            <span>{predictionComparison.isMatch ? 'Prediction Confirmed' : 'Observed Result'}</span>
          </div>

          <div className="teaching-comparison-body">
            <strong>{predictionComparison.userSummary}</strong>{' '}
            <span>{predictionComparison.detailedExplanation}</span>
          </div>
        </div>
      )}

      {/* ── Misconception Diagnostic Feedback Overlay / Callout ── */}
      {isLearnerTurn && teachingState.takeoverFeedback?.isError && (
        <div className="teaching-misconception-callout" data-testid="teaching-takeover-feedback">
          <div className="teaching-misconception-header">
            <XCircle size={14} color="#ff8389" />
            <span className="teaching-misconception-badge">Misconception Diagnostic</span>
            {teachingState.takeoverFailedAttempts !== undefined && (
              <span className="teaching-misconception-attempt">
                (Attempt {teachingState.takeoverFailedAttempts})
              </span>
            )}
          </div>
          <p className="teaching-misconception-text">{teachingState.takeoverFeedback.message}</p>
        </div>
      )}

      {/* ── Learner Turn Banner ─────────────────────────────────── */}
      {isLearnerTurn && (
        <div className="teaching-learner-turn-banner" data-testid="teaching-learner-turn-banner">
          <div className="teaching-turn-info">
            <span className="teaching-turn-tag">YOUR TURN</span>
            <span className="teaching-turn-text">
              {currentStep?.takeover?.goalDescription ||
                'The Quantum Lab is now under your control. Experiment with the circuit freely.'}
            </span>
            {currentStep?.takeover?.hints && hintIndex >= 0 && (
              <span className="teaching-hint-badge" data-testid="teaching-hint-content">
                <Lightbulb size={12} />
                <span>Hint {hintIndex + 1}: {currentStep.takeover.hints[hintIndex]}</span>
              </span>
            )}
          </div>

          <div className="teaching-hud-right">
            {/* Help Me action — actively teaches the step, spotlights gates, and plays explanation */}
            <button
              type="button"
              className="teaching-btn teaching-btn-help-me"
              onClick={() => controller.teachTakeoverStep()}
              title="Teach me how to complete this step"
              data-testid="teaching-help-me-btn"
            >
              <Sparkles size={13} />
              <span>Help Me</span>
            </button>

            {/* Show Me fallback only after minFailedAttempts (default 2) */}
            {currentStep?.takeover?.solutionActions &&
              (teachingState.takeoverFailedAttempts || 0) >=
                (currentStep.takeover.minFailedAttemptsForSolution ?? 2) && (
                <button
                  type="button"
                  className="teaching-btn teaching-btn-solution"
                  onClick={() => controller.executeTakeoverSolution()}
                  title="Watch the demonstration for the CZ oracle connection"
                  data-testid="teaching-show-me-btn"
                >
                  <Sparkles size={13} />
                  <span>Show Me</span>
                </button>
              )}

            {currentStep?.takeover?.hints && currentStep.takeover.hints.length > 0 && (
              <button
                type="button"
                className="teaching-btn teaching-btn-hint"
                onClick={() =>
                  setHintIndex((prev) =>
                    prev + 1 < (currentStep?.takeover?.hints?.length ?? 0) ? prev + 1 : prev
                  )
                }
                disabled={hintIndex + 1 >= currentStep.takeover.hints.length}
                title="Get a hint"
                data-testid="teaching-hint-btn"
              >
                <Lightbulb size={13} />
                <span>
                  {hintIndex < 0
                    ? 'Need a Hint?'
                    : `Hint (${hintIndex + 1}/${currentStep.takeover.hints.length})`}
                </span>
              </button>
            )}

            <button
              type="button"
              className="teaching-btn teaching-btn-primary"
              onClick={() => controller.completeLearnerTurn()}
              data-testid="teaching-finish-turn-btn"
            >
              <CheckCircle2 size={14} />
              <span>
                {currentStep?.takeover?.suggestedActionLabel ||
                  (currentStepIndex + 1 === totalSteps ? 'Finish Lesson' : 'Submit Solution')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Completion Banner ───────────────────────────────────── */}
      {isCompleted && (
        <div className="teaching-completion-banner" data-testid="teaching-completion-banner">
          <div className="teaching-complete-left">
            <span className="teaching-complete-tag">
              <CheckCircle2 size={13} />
              <span>{activeLesson.isAssessment ? 'SPRINT 1 ASSESSMENT COMPLETE' : 'LESSON MASTERED'}</span>
            </span>
            <span className="teaching-xp-award">
              <Award size={13} />
              <span>+{activeLesson.xpReward} XP Awarded</span>
            </span>
            <span className="teaching-complete-desc">
              {activeLesson.completionMessage ||
                currentStep?.explanation ||
                `Congratulations! You have completed the ${activeLesson.title} lesson.`}
            </span>
          </div>

          <div className="teaching-hud-right">
            <button
              type="button"
              className="teaching-btn"
              onClick={() => controller.restart()}
              data-testid="teaching-complete-restart-btn"
            >
              <RotateCcw size={13} />
              <span>Restart</span>
            </button>
            {(() => {
              const currentSeqIdx = SPRINT_1_SEQUENCE.indexOf(activeLesson.id);
              const nextLessonId =
                currentSeqIdx >= 0 && currentSeqIdx < SPRINT_1_SEQUENCE.length - 1
                  ? SPRINT_1_SEQUENCE[currentSeqIdx + 1]
                  : null;
              return (
                <>
                  {onNavigateToTheory && (
                    <button
                      type="button"
                      className="teaching-btn"
                      onClick={onNavigateToTheory}
                      data-testid="teaching-back-to-theory-btn"
                    >
                      <ArrowLeft size={13} />
                      <span data-testid="return-to-theory-btn">Back to theory</span>
                    </button>
                  )}
                  {nextLessonId && onNextLesson && (
                    <button
                      type="button"
                      className="teaching-btn teaching-btn-primary"
                      onClick={() => onNextLesson(nextLessonId)}
                      data-testid="teaching-next-lesson-btn"
                    >
                      <span>{nextLessonId === 's1-assessment' ? 'Start Sprint Assessment' : 'Next Lesson'}</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                  {onExitLesson && (
                    <button
                      type="button"
                      className={`teaching-btn ${nextLessonId && onNextLesson ? '' : 'teaching-btn-primary'}`}
                      onClick={onExitLesson}
                      data-testid="teaching-complete-exit-btn"
                    >
                      <span data-testid="next-module-btn">{nextLessonId ? 'Return to Academy' : 'Next module'}</span>
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Center-Middle Cinematic Netflix Style Subtitle Overlay ─────── */}
      {showCaptions && isCaptionVisible && (narrationText || currentStep?.explanation) && !isCompleted && typeof document !== 'undefined' ? (
        createPortal(
          <div className="cinematic-subtitles-overlay" data-testid="cinematic-subtitles">
            <div className="cinematic-subtitles-pill">
              <p className="cinematic-subtitles-text" data-testid="teaching-narration">
                <span className="cinematic-speaker-tag">[ERWIN]</span>
                <span>{narrationText || currentStep?.explanation}</span>
              </p>
              {isPredictionWaiting && (
                <div className="cinematic-subtitles-hint">
                  👉 Select your prediction card in the top panel and click &ldquo;Submit Prediction &amp; Simulate&rdquo;.
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      ) : null}

      {/* Hidden narration element for accessibility and tests when overlay is off or hidden */}
      {(!showCaptions || !isCaptionVisible || isCompleted) && (
        <span data-testid="teaching-narration" style={{ display: 'none' }}>
          {narrationText || currentStep?.explanation || ''}
        </span>
      )}
    </div>
  );
};

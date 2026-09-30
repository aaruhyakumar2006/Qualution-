import type {
  LessonScript,
  TeachingAction,
  TeachingControllerState,
  CursorState,
} from './types';
import { animate } from 'animejs';
import { inOutQuint } from './CursorTrainingRenderer';
import { lessonRegistry } from './lessonRegistry';
import { defaultSpeechService, type SpeechService } from './speechService';
import { emitTeachingEvent } from './teachingEvents';
import {
  validateLessonScript,
  evaluateCompletionCriteria,
  explainCriteriaFailure,
  evaluateStructuredComparison,
} from './lessonValidator';
import { targetResolver } from './TeachingTargetResolver';
import type { CircuitRequest, CircuitRunResponse, Gate, CircuitMetricsResponse } from '../circuit/types';
import { routeCircuit } from '../circuit/executionRouter';
import { saveOfflineLessonProgress, getOfflineLessonProgress } from '../../services/db/offlineProgressDb';

export interface TeachingIDEHooks {
  getCircuit: () => CircuitRequest;
  updateCircuit: (circuit: CircuitRequest) => void;
  runSimulation: (shots?: number, backend?: string) => Promise<CircuitRunResponse | null>;
  getSimulationResult: () => CircuitRunResponse | null;
  focusVisualization: (panel: 'results' | 'state' | 'math' | 'bloch' | 'qsphere' | 'timeline' | 'metrics' | 'phase') => void;
  highlightGate: (gateId: string | null) => void;
  highlightQubit: (qubitIndex: number | null) => void;
  clearHighlights: () => void;
  /** Dismiss all active toast notifications */
  clearToasts?: () => void;
  showToast?: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
  updateMetrics?: (metrics: CircuitMetricsResponse) => void;
}

export type StateListener = (state: TeachingControllerState) => void;

export class TeachingController {
  private hooks: TeachingIDEHooks;
  private speech: SpeechService;
  private listeners: Set<StateListener> = new Set();

  private state: TeachingControllerState = {
    status: 'IDLE',
    activeLesson: null,
    currentStepIndex: 0,
    totalSteps: 0,
    currentStep: null,
    selectedPredictionIndex: null,
    predictionComparison: null,
    highlightedGateId: null,
    highlightedQubitIndex: null,
    narrationText: '',
    isAudioMuted: true,
    isSpeaking: false,
    isAutoPlay: false,
    isTakeoverSatisfied: false,
    cursorState: null,
    playbackSpeed: 1,
    furthestValidatedStepIndex: -1,
    validatedStepIndices: [],
    error: null,
  };

  private stepExecutionToken: number = 0;
  private lessonStartTime: number = 0;
  private stepStartTime: number = 0;
  private simulationCount: number = 0;
  private predictionAttempts: number = 0;
  private isPredictionCorrect: boolean | null = null;
  private lastSimResult: CircuitRunResponse | null = null;
  private stageCoordCache: Map<string, { x: number; y: number }> = new Map();
  private validatedStepIndices: Set<number> = new Set();
  private furthestValidatedStepIndex: number = -1;

  constructor(hooks: TeachingIDEHooks, speech: SpeechService = defaultSpeechService) {
    this.hooks = hooks;
    this.speech = speech;
    this.state.isAudioMuted = speech.isMuted();
  }

  public getState(): TeachingControllerState {
    return { ...this.state };
  }

  public getCursorState(): CursorState | null {
    return this.state.cursorState || null;
  }

  public updateCursor(partial: Partial<CursorState> | null): void {
    if (partial === null) {
      this.updateState({ cursorState: null });
      return;
    }
    const current = this.state.cursorState || {
      x: 0,
      y: 0,
      isVisible: false,
      isClicking: false,
    };
    this.updateState({
      cursorState: { ...current, ...partial },
    });
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(updates: Partial<TeachingControllerState>): void {
    this.state = { ...this.state, ...updates };
    const snapshot = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(snapshot);
      } catch {
        // Ignore subscriber error
      }
    });
  }

  public isStepValidated(stepIndex?: number): boolean {
    const idx = stepIndex !== undefined ? stepIndex : this.state.currentStepIndex;
    if (this.validatedStepIndices.has(idx)) return true;
    const step = this.state.activeLesson?.steps[idx];
    if (!step) return false;
    // An informational or demonstration step with no blocking gate validates naturally
    if (!step.checkpoint && !step.takeover) {
      return true;
    }
    if (step.takeover && this.state.currentStepIndex === idx && this.state.isTakeoverSatisfied) {
      return true;
    }
    return false;
  }

  public markStepValidated(stepIndex: number): void {
    this.validatedStepIndices.add(stepIndex);
    if (stepIndex > this.furthestValidatedStepIndex) {
      this.furthestValidatedStepIndex = stepIndex;
    }
    this.updateState({
      furthestValidatedStepIndex: this.furthestValidatedStepIndex,
      validatedStepIndices: Array.from(this.validatedStepIndices),
    });
    if (this.state.activeLesson?.id) {
      saveOfflineLessonProgress(this.state.activeLesson.id, {
        completedStepIndices: Array.from(this.validatedStepIndices),
        lastActiveStepIndex: this.state.currentStepIndex,
      }).catch(() => {});
    }
  }

  public canAdvance(): boolean {
    if (!this.state.activeLesson) return false;
    if (this.state.status === 'COMPLETED') return false;
    const curIdx = this.state.currentStepIndex;
    if (this.validatedStepIndices.has(curIdx)) {
      return true;
    }
    if (this.state.status === 'WAITING_FOR_PREDICTION') return false;
    if (this.state.status === 'LEARNER_TURN' && !this.state.isTakeoverSatisfied) return false;
    const step = this.state.currentStep;
    if (step?.checkpoint && !this.validatedStepIndices.has(curIdx)) {
      return false;
    }
    if (step?.takeover && !this.state.isTakeoverSatisfied && !this.validatedStepIndices.has(curIdx)) {
      return false;
    }
    return true;
  }

  public getFirstUnresolvedGateIndex(): number {
    if (!this.state.activeLesson) return 0;
    for (let i = 0; i < this.state.activeLesson.steps.length; i++) {
      const s = this.state.activeLesson.steps[i];
      if ((s.checkpoint || s.takeover) && !this.validatedStepIndices.has(i)) {
        return i;
      }
    }
    return this.state.activeLesson.steps.length - 1;
  }

  public async resumeFromSavedProgress(): Promise<boolean> {
    if (!this.state.activeLesson?.id) return false;
    const saved = await getOfflineLessonProgress(this.state.activeLesson.id);
    if (!saved) return false;

    if (saved.completedStepIndices && Array.isArray(saved.completedStepIndices)) {
      this.validatedStepIndices = new Set(saved.completedStepIndices);
      this.furthestValidatedStepIndex = saved.completedStepIndices.length > 0
        ? Math.max(...saved.completedStepIndices)
        : -1;
    }

    const targetIndex = Math.min(
      this.state.totalSteps - 1,
      Math.max(0, saved.lastActiveStepIndex ?? 0)
    );
    await this.goToStep(targetIndex, { force: true });
    return true;
  }

  // ── Lesson Loading & Validation ───────────────────────────────────

  public async loadLesson(lessonOrId: string | LessonScript): Promise<boolean> {
    this.speech.stop();
    this.stepExecutionToken++;

    let lesson: LessonScript | null = null;
    if (typeof lessonOrId === 'string') {
      lesson = lessonRegistry.getLesson(lessonOrId);
    } else if (lessonOrId && typeof lessonOrId === 'object') {
      lesson = lessonOrId;
    }

    if (!lesson) {
      const err = `Unknown lesson requested: ${typeof lessonOrId === 'string' ? lessonOrId : 'Invalid lesson object'}`;
      this.updateState({
        status: 'ERROR',
        error: err,
        activeLesson: null,
        currentStep: null,
      });
      this.hooks.showToast?.('warning', err);
      return false;
    }

    // Runtime validation of the lesson definition
    const validation = validateLessonScript(lesson);
    if (!validation.valid) {
      const err = `Lesson "${lesson.id}" validation failed: ${validation.errors.join('; ')}`;
      this.updateState({
        status: 'ERROR',
        error: err,
        activeLesson: null,
        currentStep: null,
      });
      this.hooks.showToast?.('error', err);
      return false;
    }

    // Initialize telemetry timers and counters
    this.lessonStartTime = Date.now();
    this.stepStartTime = Date.now();
    this.simulationCount = 0;
    this.predictionAttempts = 0;
    this.isPredictionCorrect = null;
    this.lastSimResult = null;

    // Set initial starter circuit if specified by the lesson
    if (lesson.starterCircuit) {
      this.hooks.updateCircuit(JSON.parse(JSON.stringify(lesson.starterCircuit)));
    }

    this.validatedStepIndices.clear();
    this.furthestValidatedStepIndex = -1;

    this.updateState({
      status: 'IDLE',
      activeLesson: lesson,
      currentStepIndex: 0,
      totalSteps: lesson.steps.length,
      currentStep: lesson.steps[0] || null,
      selectedPredictionIndex: null,
      predictionComparison: null,
      highlightedGateId: null,
      highlightedQubitIndex: null,
      narrationText: lesson.steps[0]?.narrationText || '',
      isTakeoverSatisfied: false,
      furthestValidatedStepIndex: -1,
      validatedStepIndices: [],
      error: null,
    });

    emitTeachingEvent({
      type: 'lesson_started',
      lessonId: lesson.id,
      timestamp: Date.now(),
      metadata: {
        title: lesson.title,
        difficulty: lesson.difficulty,
        xpReward: lesson.xpReward,
        concept: lesson.conceptTags[0]?.toLowerCase() || 'quantum',
        curriculumModuleId: lesson.curriculumModuleId || null,
        stepsCount: lesson.steps.length,
      },
    });

    return true;
  }

  // ── Controller Controls ───────────────────────────────────────────

  public async startLesson(lessonOrId: string | LessonScript, autoPlay: boolean = true): Promise<boolean> {
    const loaded = await this.loadLesson(lessonOrId);
    if (loaded) {
      if (autoPlay) {
        this.setAutoPlay(true);
      }
      await this.start();
    }
    return loaded;
  }

  public async start(): Promise<void> {
    if (!this.state.activeLesson || this.state.totalSteps === 0) {
      return;
    }
    await this.goToStep(0);
  }

  public pause(): void {
    if (this.state.status === 'TEACHING' || this.state.status === 'RUNNING_SIMULATION') {
      this.speech.pause();
      this.updateState({ status: 'PAUSED' });
    }
  }

  public async resume(): Promise<void> {
    if (this.state.status === 'PAUSED') {
      this.speech.resume();
      this.updateState({ status: 'TEACHING' });
      // If in continuous autoplay mode and not blocked by a prediction or student takeover, continue progression
      if (this.state.isAutoPlay && !this.state.currentStep?.checkpoint && !this.state.currentStep?.takeover) {
        const token = this.stepExecutionToken;
        const speed = this.state.playbackSpeed || 1;
        const isTesting = Boolean((globalThis as any).process?.env?.NODE_ENV === 'test');
        if (!isTesting) {
          setTimeout(async () => {
            if (this.stepExecutionToken === token && this.state.status === 'TEACHING' && this.state.isAutoPlay) {
              await this.next();
            }
          }, Math.round(1500 / speed));
        }
      }
    }
  }

  public async play(): Promise<void> {
    this.setAutoPlay(true);
    if (this.state.status === 'PAUSED') {
      await this.resume();
    } else if (this.state.status === 'IDLE' || this.state.status === 'COMPLETED') {
      await this.start();
    }
  }

  public async replay(): Promise<void> {
    await this.restart();
  }

  public destroy(): void {
    this.speech.stop();
    this.cleanupDragDOM();
    if (this.hooks?.clearHighlights) {
      this.hooks.clearHighlights();
    }
    this.stepExecutionToken++; // Invalidates any pending timeouts
    this.listeners.clear();
    this.updateState({ status: 'IDLE' });
  }

  public setAutoPlay(enabled: boolean): void {
    this.updateState({ isAutoPlay: enabled });
  }

  public toggleAutoPlay(): void {
    this.updateState({ isAutoPlay: !this.state.isAutoPlay });
  }

  public async next(): Promise<void> {
    if (!this.state.activeLesson) return;

    if (!this.canAdvance()) {
      if (this.state.status === 'WAITING_FOR_PREDICTION') {
        this.hooks.showToast?.('info', 'Please submit your prediction to proceed.');
      } else if (this.state.status === 'LEARNER_TURN') {
        this.hooks.showToast?.('info', 'Please complete the circuit task before proceeding.');
      } else {
        this.hooks.showToast?.('info', 'Please complete the current step to proceed.');
      }
      return;
    }

    const nextIndex = this.state.currentStepIndex + 1;
    if (nextIndex < this.state.totalSteps) {
      await this.goToStep(nextIndex);
    } else {
      await this.completeLesson();
    }
  }

  public async previous(): Promise<void> {
    if (!this.state.activeLesson) return;
    const prevIndex = Math.max(0, this.state.currentStepIndex - 1);
    if (prevIndex !== this.state.currentStepIndex) {
      await this.goToStep(prevIndex);
    }
  }

  public async replayStep(): Promise<void> {
    if (!this.state.activeLesson) return;
    await this.goToStep(this.state.currentStepIndex, { force: true });
  }

  public async seekBySeconds(deltaSeconds: number): Promise<void> {
    if (!this.state.activeLesson) return;
    if (deltaSeconds < 0) {
      if (this.state.currentStepIndex > 0) {
        await this.previous();
      } else {
        await this.replayStep();
      }
    } else {
      if (this.canAdvance() && this.state.currentStepIndex < this.state.totalSteps - 1) {
        await this.next();
      }
    }
  }

  public async restart(): Promise<void> {
    if (!this.state.activeLesson) return;
    this.speech.stop();
    this.hooks.clearHighlights();

    this.lessonStartTime = Date.now();
    this.simulationCount = 0;
    this.predictionAttempts = 0;
    this.isPredictionCorrect = null;
    this.lastSimResult = null;

    if (this.state.activeLesson.starterCircuit) {
      this.hooks.updateCircuit(JSON.parse(JSON.stringify(this.state.activeLesson.starterCircuit)));
    }

    this.validatedStepIndices.clear();
    this.furthestValidatedStepIndex = -1;

    this.updateState({
      selectedPredictionIndex: null,
      predictionComparison: null,
      highlightedGateId: null,
      highlightedQubitIndex: null,
      isTakeoverSatisfied: false,
      furthestValidatedStepIndex: -1,
      validatedStepIndices: [],
    });

    await this.goToStep(0, { force: true });
  }

  public setAudioMuted(muted: boolean): void {
    this.speech.setMuted(muted);
    this.updateState({ isAudioMuted: muted });
  }

  public toggleMute(): void {
    this.setAudioMuted(!this.state.isAudioMuted);
  }

  public async jumpToStep(index: number, options?: { force?: boolean }): Promise<void> {
    if (!this.state.activeLesson) return;
    const target = Math.max(0, Math.min(this.state.totalSteps - 1, index));
    await this.goToStep(target, options);
  }

  public setPlaybackSpeed(speed: number): void {
    this.updateState({ playbackSpeed: speed });
  }

  public async skipForward(): Promise<void> {
    await this.next();
  }

  public async skipBackward(): Promise<void> {
    await this.previous();
  }

  public getHooks(): TeachingIDEHooks {
    return this.hooks;
  }

  // ── Prediction Handling ───────────────────────────────────────────

  public async submitPrediction(optionIndex: number): Promise<void> {
    if (!this.state.currentStep?.checkpoint) return;

    const checkpoint = this.state.currentStep.checkpoint;
    const option = checkpoint.options[optionIndex];
    if (!option) return;

    const isCorrect = optionIndex === checkpoint.correctOptionIndex;
    this.predictionAttempts++;
    this.isPredictionCorrect = isCorrect;

    this.updateState({
      status: 'TEACHING',
      selectedPredictionIndex: optionIndex,
    });
    this.markStepValidated(this.state.currentStepIndex);

    emitTeachingEvent({
      type: 'prediction_submitted',
      lessonId: this.state.activeLesson?.id || '',
      stepId: this.state.currentStep.id,
      stepNumber: this.state.currentStep.stepNumber,
      timestamp: Date.now(),
      metadata: {
        predictionId: checkpoint.id,
        optionIndex,
        isCorrect,
        attempts: this.predictionAttempts,
        conceptId: this.state.activeLesson?.conceptTags[0]?.toLowerCase() || 'quantum',
        message: !isCorrect ? (option.description || checkpoint.explanation) : undefined,
        explanation: checkpoint.explanation,
        optionText: option.label,
        optionDescription: option.description,
      },
    });

    if (this.state.activeLesson?.id) {
      await saveOfflineLessonProgress(this.state.activeLesson.id, {
        lastActiveStepIndex: this.state.currentStepIndex,
        completedStepIndices: Array.from(this.validatedStepIndices),
        predictionAnswers: {
          [checkpoint.id]: {
            optionIndex,
            isCorrect,
            attempts: this.predictionAttempts,
            timestamp: Date.now(),
          },
        },
      }).catch(() => {});
    }

    // Advance to next step automatically after prediction
    const nextIndex = this.state.currentStepIndex + 1;
    if (nextIndex < this.state.totalSteps) {
      await this.goToStep(nextIndex);
    } else {
      await this.completeLesson();
    }
  }

  public async submitInteractivePrediction(vec: {x:number, y:number, z:number}): Promise<void> {
    if (!this.state.currentStep?.checkpoint) return;
    const checkpoint = this.state.currentStep.checkpoint;
    
    let isCorrect = false;
    
    if (checkpoint.expectedBlochVector) {
      const exp = checkpoint.expectedBlochVector;
      const dist = Math.sqrt(
        Math.pow(exp.x - vec.x, 2) + 
        Math.pow(exp.y - vec.y, 2) + 
        Math.pow(exp.z - vec.z, 2)
      );
      isCorrect = dist < 0.2;
    } else {
      // Fallback: compare clicked vector with correct option's label if possible
      const correctOpt = checkpoint.options[checkpoint.correctOptionIndex];
      if (correctOpt) {
        if (correctOpt.label.includes('|0') && vec.z > 0.8) isCorrect = true;
        else if (correctOpt.label.includes('|1') && vec.z < -0.8) isCorrect = true;
        else if (correctOpt.label.includes('|+') && vec.x > 0.8) isCorrect = true;
        else if (correctOpt.label.includes('|-') && vec.x < -0.8) isCorrect = true;
        else if (correctOpt.label.includes('|i') && vec.y > 0.8) isCorrect = true;
      }
    }

    this.predictionAttempts++;
    this.isPredictionCorrect = isCorrect;

    this.updateState({
      status: 'TEACHING',
      selectedPredictionIndex: checkpoint.correctOptionIndex, // Fake selection for UI state
    });
    this.markStepValidated(this.state.currentStepIndex);
    
    emitTeachingEvent({
      type: 'prediction_submitted',
      lessonId: this.state.activeLesson?.id || '',
      stepId: this.state.currentStep.id,
      stepNumber: this.state.currentStep.stepNumber,
      timestamp: Date.now(),
      metadata: {
        predictionId: checkpoint.id,
        isCorrect,
        attempts: this.predictionAttempts,
        interactive: true,
        vector: vec
      },
    });

    const nextIndex = this.state.currentStepIndex + 1;
    if (nextIndex < this.state.totalSteps) {
      await this.goToStep(nextIndex);
    } else {
      await this.completeLesson();
    }
  }

  // ── Learner Turn & Completion ─────────────────────────────────────

  public checkLearnerTurnSatisfied(): boolean {
    const takeover = this.state.currentStep?.takeover;
    if (!takeover) return true;

    if (takeover.completionCriteria) {
      const currentCirc = this.hooks.getCircuit();
      const simRes = this.hooks.getSimulationResult() || this.lastSimResult;
      const satisfied = evaluateCompletionCriteria(takeover.completionCriteria, currentCirc, simRes);
      this.updateState({ isTakeoverSatisfied: satisfied });
      if (satisfied) {
        this.markStepValidated(this.state.currentStepIndex);
      }
      return satisfied;
    }

    if (takeover.customValidator) {
      const satisfied = takeover.customValidator(this.hooks.getCircuit(), this.hooks.getSimulationResult());
      this.updateState({ isTakeoverSatisfied: satisfied });
      if (satisfied) {
        this.markStepValidated(this.state.currentStepIndex);
      }
      return satisfied;
    }

    return true;
  }

  public async onUserCircuitChange(newCircuit: CircuitRequest): Promise<void> {
    if (this.state.status !== 'LEARNER_TURN') return;
    const takeover = this.state.currentStep?.takeover;
    if (!takeover) return;

    if (takeover.customDiagnoser) {
      const diagnosis = takeover.customDiagnoser(newCircuit);
      if (diagnosis.isInitial) {
        this.updateState({
          isTakeoverSatisfied: false,
          takeoverFeedback: null,
        });
        return;
      }

      if (diagnosis.isCorrect) {
        this.updateState({
          isTakeoverSatisfied: true,
          takeoverFeedback: null,
        });
        this.markStepValidated(this.state.currentStepIndex);
        const successMsg =
          takeover.successNarration || diagnosis.message || "Correct — that's the phase-flip oracle for |11⟩.";
        this.speech.speak(successMsg);
        this.updateState({ narrationText: successMsg });
        this.hooks.showToast?.('success', successMsg);

        if (takeover.autoAdvanceOnSuccess !== false) {
          const isTesting = Boolean((globalThis as any).process?.env?.NODE_ENV === 'test');
          if (!isTesting) {
            setTimeout(async () => {
              if (this.state.status === 'LEARNER_TURN' && this.state.isTakeoverSatisfied) {
                await this.next();
              }
            }, 1400);
          }
        }
        return;
      }

      if (diagnosis.shouldCountAttempt) {
        const nextFails = (this.state.takeoverFailedAttempts || 0) + 1;
        this.updateState({
          takeoverFailedAttempts: nextFails,
          isTakeoverSatisfied: false,
          takeoverFeedback: {
            isError: true,
            message: diagnosis.message,
            misconceptionId: diagnosis.misconceptionId,
          },
        });
        this.speech.speak(diagnosis.message);
        this.hooks.showToast?.('warning', diagnosis.message);
        emitTeachingEvent({
          type: 'action_executed',
          lessonId: this.state.activeLesson?.id || 'lesson',
          metadata: {
            misconceptionId: diagnosis.misconceptionId || 'incorrect_attempt',
            attempt: nextFails,
          },
        });
        return;
      }
    }

    // Default criteria evaluation
    this.checkLearnerTurnSatisfied();
  }

  public async completeLearnerTurn(): Promise<void> {
    if (this.state.status !== 'LEARNER_TURN') return;

    const takeover = this.state.currentStep?.takeover;
    if (takeover) {
      if (takeover.customDiagnoser) {
        const diagnosis = takeover.customDiagnoser(this.hooks.getCircuit());
        if (!diagnosis.isCorrect) {
          const nextFails = (this.state.takeoverFailedAttempts || 0) + (diagnosis.shouldCountAttempt ? 1 : 0);
          this.updateState({
            takeoverFailedAttempts: nextFails,
            isTakeoverSatisfied: false,
            takeoverFeedback: {
              isError: true,
              message: diagnosis.message,
              misconceptionId: diagnosis.misconceptionId,
            },
          });

          // Play the teaching stream: spotlight the gate and guide the learner
          const requiredGate = takeover.completionCriteria?.requiredGates?.[0] || 'cz';
          this.hooks.clearHighlights?.();
          this.hooks.highlightGate?.(requiredGate);

          const helpGuidance = `${diagnosis.message} Let me help: select the ${requiredGate.toUpperCase()} gate from the palette.`;
          this.speech.speak(helpGuidance);
          this.updateState({ narrationText: helpGuidance });
          this.hooks.showToast?.('warning', diagnosis.message);
          return;
        } else {
          // Different streamline for correct solution!
          this.hooks.clearHighlights?.();
          this.updateState({
            isTakeoverSatisfied: true,
            takeoverFeedback: null,
          });
          this.markStepValidated(this.state.currentStepIndex);
          const successMsg =
            takeover.successNarration || diagnosis.message || "Correct — that's the phase-flip oracle for |11⟩.";
          this.speech.speak(successMsg);
          this.updateState({ narrationText: successMsg });
          this.hooks.showToast?.('success', successMsg);
          await this.next();
          return;
        }
      }

      if (takeover.allowEarlyCompletion === false) {
        const satisfied = this.checkLearnerTurnSatisfied();
        if (!satisfied) {
          const currentCirc = this.hooks.getCircuit();
          const simRes = this.hooks.getSimulationResult() || this.lastSimResult;
          const failureReason = takeover.completionCriteria
            ? explainCriteriaFailure(takeover.completionCriteria, currentCirc, simRes)
            : null;
          const requiredGate = takeover.completionCriteria?.requiredGates?.[0] || 'x';
          this.hooks.clearHighlights?.();
          this.hooks.highlightGate?.(requiredGate);

          const msg = failureReason
            ? `${takeover.prompt ? takeover.prompt + ': ' : ''}${failureReason}`
            : takeover.prompt || `Please place the ${requiredGate.toUpperCase()} gate to fulfill the circuit task.`;
          this.speech.speak(msg);
          this.updateState({
            narrationText: msg,
            takeoverFeedback: {
              isError: true,
              message: msg,
            },
          });
          this.hooks.showToast?.('info', msg);
          return;
        }
      } else {
        const satisfied = this.checkLearnerTurnSatisfied();
        if (satisfied) {
          this.hooks.clearHighlights?.();
          this.updateState({
            isTakeoverSatisfied: true,
            takeoverFeedback: null,
          });
          this.markStepValidated(this.state.currentStepIndex);
          const successMsg = takeover.successNarration || 'Task completed successfully!';
          this.speech.speak(successMsg);
          this.updateState({ narrationText: successMsg });
          this.hooks.showToast?.('success', successMsg);
          await this.next();
          return;
        } else {
          // Play the teaching streamline if not satisfied
          const requiredGate = takeover.completionCriteria?.requiredGates?.[0] || 'h';
          this.hooks.clearHighlights?.();
          this.hooks.highlightGate?.(requiredGate);
          const helpMsg = takeover.instructions?.[0] || takeover.prompt || `Place the ${requiredGate.toUpperCase()} gate on the wire.`;
          this.speech.speak(helpMsg);
          this.updateState({
            narrationText: helpMsg,
            takeoverFeedback: {
              isError: true,
              message: helpMsg,
            },
          });
          this.hooks.showToast?.('info', helpMsg);
          return;
        }
      }
    }

    await this.next();
  }

  public async teachTakeoverStep(): Promise<void> {
    if (this.state.status !== 'LEARNER_TURN') return;
    const takeover = this.state.currentStep?.takeover;
    if (!takeover) return;

    // 1. Identify the required gate(s) and highlight them in the toolbox palette
    const requiredGate = takeover.completionCriteria?.requiredGates?.[0] || 'cz';
    this.hooks.clearHighlights?.();
    this.hooks.highlightGate?.(requiredGate);

    // 2. Formulate teaching guidance
    let teachingMsg = '';
    if (this.state.activeLesson?.id === 'lesson-8-grovers-search') {
      teachingMsg =
        "Here's how to complete this step: Select the Controlled-Z (CZ) gate from the palette and connect qubit 0 and qubit 1. This inverts the phase of |11⟩ to mark our target state!";
    } else if (Array.isArray(takeover.instructions) && takeover.instructions.length > 0) {
      teachingMsg = `Let's work through this step: ${takeover.instructions.join(' ')}`;
    } else if (typeof takeover.instructions === 'string') {
      teachingMsg = `Here is how to complete this: ${takeover.instructions}`;
    } else if (takeover.goalDescription) {
      teachingMsg = `Target goal: ${takeover.goalDescription}`;
    } else if (takeover.prompt) {
      teachingMsg = `Guide: ${takeover.prompt}`;
    } else {
      teachingMsg = `Select and place the ${requiredGate.toUpperCase()} gate onto the circuit wire.`;
    }

    // 3. Update state so Netflix subtitles display it, feedback callout appears, and speak it via TTS
    this.speech.speak(teachingMsg);
    this.updateState({
      narrationText: teachingMsg,
      takeoverFeedback: {
        isError: false,
        message: teachingMsg,
      },
    });
    this.hooks.showToast?.('info', teachingMsg);

    // 4. Also demonstrate if solution actions are provided and it's not a strict no-auto-place lesson
    if (takeover.solutionActions && takeover.solutionActions.length > 0 && this.state.activeLesson?.id !== 'lesson-8-grovers-search') {
      await this.executeTakeoverSolution();
    }
  }

  public async executeTakeoverSolution(): Promise<void> {
    const takeover = this.state.currentStep?.takeover;
    if (!takeover) return;

    if (this.state.activeLesson?.id === 'lesson-8-grovers-search') {
      // Ground Rule: "SPOTLIGHT the needed gate and slots (highlight only, using --wb-status-cyan). Do NOT auto-place gates for the learner."
      const requiredGate = takeover.completionCriteria?.requiredGates?.[0] || 'cz';
      this.hooks.clearHighlights?.();
      this.hooks.highlightGate?.(requiredGate);

      const spotlightMsg =
        takeover.instructions?.[0] ||
        `Spotlight: Place the ${requiredGate.toUpperCase()} gate across qubit 0 and qubit 1.`;
      this.speech.speak(spotlightMsg);
      this.hooks.showToast?.('info', spotlightMsg);
      this.updateState({
        narrationText: spotlightMsg,
        takeoverFeedback: {
          isError: false,
          message: spotlightMsg,
        },
      });
      return;
    }

    if (!takeover.solutionActions) return;

    const prevStatus = this.state.status;
    this.updateState({ status: 'TEACHING' });

    // Execute the auto-solve actions
    await this.executeActions(takeover.solutionActions, this.stepExecutionToken);

    const confirmMsg = 'Here is the gate connection demonstrated on the circuit.';
    this.speech.speak(confirmMsg);
    this.updateState({
      narrationText: confirmMsg,
      isTakeoverSatisfied: true,
      takeoverFeedback: null,
    });
    this.markStepValidated(this.state.currentStepIndex);

    // Automatically proceed to next stage
    setTimeout(async () => {
      await this.next();
    }, 1500);
  }

  public async completeLesson(): Promise<void> {
    this.speech.stop();
    this.hooks.clearHighlights();

    this.markStepValidated(this.state.totalSteps - 1);

    this.updateState({
      status: 'COMPLETED',
      highlightedGateId: null,
      highlightedQubitIndex: null,
    });

    const timeSpentMs = this.lessonStartTime > 0 ? Date.now() - this.lessonStartTime : 0;

    emitTeachingEvent({
      type: 'lesson_completed',
      lessonId: this.state.activeLesson?.id || '',
      timestamp: Date.now(),
      metadata: {
        xpReward: this.state.activeLesson?.xpReward || 100,
        curriculumModuleId: this.state.activeLesson?.curriculumModuleId || null,
        concept: this.state.activeLesson?.conceptTags[0]?.toLowerCase() || 'quantum',
        timeSpentMs,
        simulationCount: this.simulationCount,
        predictionAttempts: this.predictionAttempts,
        isPredictionCorrect: this.isPredictionCorrect,
      },
    });

    if (this.state.activeLesson?.id) {
      await saveOfflineLessonProgress(this.state.activeLesson.id, {
        isCompleted: true,
        completedStepIndices: Array.from(this.validatedStepIndices),
        lastActiveStepIndex: this.state.totalSteps - 1,
        totalTimeSpentMs: timeSpentMs,
      }).catch(() => {});
    }

    this.hooks.showToast?.(
      'success',
      `Lesson Completed! +${this.state.activeLesson?.xpReward ?? 100} XP`
    );
  }

  // ── Step Execution Engine ─────────────────────────────────────────

  private async goToStep(index: number, options?: { force?: boolean }): Promise<void> {
    if (!this.state.activeLesson) return;
    const step = this.state.activeLesson.steps[index];
    if (!step) return;

    if (!options?.force && this.state.status !== 'IDLE') {
      // 1. Refuse forward advance if current step is unresolved
      if (index > this.state.currentStepIndex && !this.canAdvance()) {
        return;
      }
      // 2. Refuse forward advance beyond furthest validated step + 1 (or first unresolved gate)
      const maxAllowed = Math.max(
        this.furthestValidatedStepIndex + 1,
        this.getFirstUnresolvedGateIndex()
      );
      if (index > maxAllowed) {
        return;
      }
    }

    this.speech.stop();
    const token = ++this.stepExecutionToken;
    this.stepStartTime = Date.now();

    emitTeachingEvent({
      type: 'step_started',
      lessonId: this.state.activeLesson.id,
      stepId: step.id,
      stepNumber: step.stepNumber,
      timestamp: Date.now(),
      metadata: {
        stepTitle: step.title,
      },
    });

    // Always hide cursor AND clear toasts at the START of every step
    this.updateCursor({ isVisible: false, draggingGate: undefined, label: undefined });
    this.hooks.clearToasts?.();

    // Real live Workbench only — no shadow DOM clones
    if (this.state.activeLesson.id === 'lesson-8-grovers-search' && step.stepNumber === 1) {
      this.hooks.updateCircuit({
        qubits: 2,
        classical_bits: 2,
        gates: [],
      });
    }

    // If seeking/jumping across chapters (not normal step+1 linear advance), restore circuit keyframe snapshot if available
    const isSeek = index !== this.state.currentStepIndex + 1;
    if ((isSeek || index === 0) && step.circuitSnapshot) {
      if (this.state.activeLesson.id === 'lesson-8-grovers-search' && step.stepNumber === 1) {
        // Stage 1 must begin with empty circuit so H gates are placed dynamically during the demonstration
        this.hooks.updateCircuit({
          qubits: 2,
          classical_bits: 2,
          gates: [],
          measure: false,
          shots: 1000,
        });
      } else {
        this.hooks.updateCircuit(JSON.parse(JSON.stringify(step.circuitSnapshot)));
      }
    }

    this.updateState({
      status: 'TEACHING',
      currentStepIndex: index,
      currentStep: step,
      narrationText: step.narrationText,
      activeMathFormula: null,
      activeTextCard: null,
    });

    if (this.state.activeLesson?.id) {
      await saveOfflineLessonProgress(this.state.activeLesson.id, {
        lastActiveStepIndex: index,
        completedStepIndices: Array.from(this.validatedStepIndices),
      }).catch(() => {});
    }

    if (!step.checkpoint && !step.takeover) {
      this.markStepValidated(index);
    }

    // 1. Speak step narration text (non-blocking if muted/unavailable)
    let narrationPromise: Promise<void> = Promise.resolve();
    if (step.narrationText) {
      this.updateState({ isSpeaking: true });
      narrationPromise = new Promise<void>((resolve) => {
        this.speech
          .speak(step.narrationText, {
            onEnd: () => {
              if (this.stepExecutionToken === token) {
                this.updateState({ isSpeaking: false });
              }
              resolve();
            },
          })
          .catch(() => {
            if (this.stepExecutionToken === token) {
              this.updateState({ isSpeaking: false });
            }
            resolve();
          });
      });
    }

    // 2. Execute deterministic actions
    await this.executeActions(step.actions, token);

    // If step was cancelled or advanced during execution, stop
    if (this.stepExecutionToken !== token) return;

    // 3. Determine post-action state
    const isTesting = Boolean((globalThis as any).process?.env?.NODE_ENV === 'test');

    if (step.checkpoint) {
      // Ensure cursor is hidden and clear toasts
      this.updateCursor({ isVisible: false, draggingGate: undefined, label: undefined });
      this.hooks.clearToasts?.();

      // Checkpoints always require learner cognitive pause for prediction (even in AutoPlay mode)
      this.updateState({
        status: 'WAITING_FOR_PREDICTION',
        selectedPredictionIndex: null,
        predictionComparison: null,
      });
      emitTeachingEvent({
        type: 'prediction_requested',
        lessonId: this.state.activeLesson.id,
        stepId: step.id,
        stepNumber: step.stepNumber,
        timestamp: Date.now(),
        metadata: {
          checkpointId: step.checkpoint.id,
          optionsCount: step.checkpoint.options.length,
        },
      });
      return;
    }

    if (step.takeover) {
      this.stageCoordCache.clear();

      if (this.state.activeLesson.id === 'lesson-8-grovers-search' && step.stepNumber === 2) {
        // Pre-seed REAL live production Workbench with Stage 1 circuit snapshot
        this.hooks.updateCircuit({
          qubits: 2,
          classical_bits: 2,
          gates: [
            { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
            { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
          ],
        });
      }

      // Hide AI cursor and clear toasts — learner is in control
      this.updateCursor({ isVisible: false, draggingGate: undefined, label: undefined });
      this.hooks.clearToasts?.();
      let isSatisfied = false;
      if (step.takeover.completionCriteria) {
        isSatisfied = evaluateCompletionCriteria(
          step.takeover.completionCriteria,
          this.hooks.getCircuit(),
          this.hooks.getSimulationResult() || this.lastSimResult
        );
      }
      this.updateState({
        status: 'LEARNER_TURN',
        isTakeoverSatisfied: isSatisfied,
        takeoverFailedAttempts: 0,
        takeoverFeedback: null,
        predictionComparison: null,
      });
      emitTeachingEvent({
        type: 'learner_takeover',
        lessonId: this.state.activeLesson.id,
        stepId: step.id,
        stepNumber: step.stepNumber,
        timestamp: Date.now(),
        metadata: {
          taskType: step.takeover.taskType || 'free_experiment',
          goalDescription: step.takeover.goalDescription,
        },
      });
      return;
    }

    // Mark step completed
    emitTeachingEvent({
      type: 'step_completed',
      lessonId: this.state.activeLesson.id,
      stepId: step.id,
      stepNumber: step.stepNumber,
      timestamp: Date.now(),
      metadata: {
        durationMs: Date.now() - this.stepStartTime,
      },
    });

    if (this.state.activeLesson?.id) {
      this.markStepValidated(index);
      saveOfflineLessonProgress(this.state.activeLesson.id, {
        completedStepIndices: Array.from(this.validatedStepIndices),
        lastActiveStepIndex: index,
      }).catch(() => {});
    }

    // Automatic Step Progression (Continuous Video Mode)
    if (this.state.isAutoPlay && !isTesting) {
      // Wait for audio speech narration to complete if actively speaking
      await narrationPromise;
      if (this.stepExecutionToken !== token || !this.state.isAutoPlay || this.state.status === 'PAUSED') {
        return;
      }

      // Ensure cursor is completely hidden during transitions — NEVER show automated cursor clicks on UI buttons
      this.updateCursor({ isVisible: false, isClicking: false, label: undefined });

      // Natural pause allowing the learner to read narration and observe the circuit state
      // Minimum reading time based on narration length (approx 150-200 WPM, ~35ms per character)
      const narrationReadingTime = step.narrationText ? Math.min(6000, Math.max(1800, step.narrationText.length * 35)) : 1800;
      const basePause = Math.max(2500, narrationReadingTime);
      const pauseDuration = Math.round(basePause / (this.state.playbackSpeed || 1));
      await new Promise((resolve) => setTimeout(resolve, pauseDuration));

      if (this.stepExecutionToken !== token || !this.state.isAutoPlay || (this.state.status as string) === 'PAUSED') {
        return;
      }

      // Automatically proceed to next keyframe step like a video
      await this.next();
    }
  }

  // ── Deterministic Action Executor & Physical Drag Lifecycle ─────────

  private cleanupDragDOM(): void {
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.teaching-held-active, .teaching-hover-active').forEach((el) => {
        el.classList.remove('teaching-held-active', 'teaching-hover-active');
      });
      document.querySelectorAll('.gate-grid-slot.drag-over').forEach((el) => {
        el.classList.remove('drag-over');
      });
    }
  }

  /**
   * Builds the full physical drag lifecycle for Live-Taught Workbench gate placement:
   * 1. Query runtime position of palette gate & wire-slot via getBoundingClientRect()
   * 2. Lifecycle stages:
   *    a. HOVER: Cursor moves to palette gate, gate button gets subtle hover glow (.teaching-hover-active)
   *    b. PICKUP: Gate element lifts (translateY -4px, scale 1.05, drop-shadow, .teaching-held-active)
   *    c. DRAG PATH: Eased path via anime.js ('inOutCubic') with subtle upward convex arc
   *    d. TARGET HOVER: Destination wire-slot shows genuine .drag-over state as gate approaches
   *    e. DROP: Gate snaps into slot with overshoot-and-settle (scale 1.05 -> 0.97 -> 1.0),
   *             THEN triggers real updateCircuit() on Workbench
   *    f. RELEASE: Cursor lifts away and clears draggingGate so it doesn't freeze on top of gate
   * 3. Duration scales dynamically with actual pixel distance (pixels/ms)
   * 4. Multi-qubit (CZ) connector animation step: explicit animation dwell for control-line draw
   */
  private async executePhysicalGateDrag(
    gateName: string,
    targetQubits: number[],
    column: number,
    gateId?: string,
    angle?: number
  ): Promise<void> {
    const isTesting = Boolean((globalThis as any).process?.env?.NODE_ENV === 'test');
    const speedMultiplier = this.state.playbackSpeed || 1;
    const gateUpper = gateName.toUpperCase();
    const primaryQubit = targetQubits[0] ?? 0;
    // ── 1. Query runtime positions via getBoundingClientRect() on real live Workbench ──
    const paletteRes = targetResolver.resolveTarget({ type: 'palette_gate', gate: gateName });
    const slotRes = targetResolver.resolveTarget({ type: 'wire_slot', qubit: primaryQubit, column });
    const startX = paletteRes.status === 'FOUND' && paletteRes.rect ? paletteRes.rect.left + paletteRes.rect.width / 2 : 200;
    const startY = paletteRes.status === 'FOUND' && paletteRes.rect ? paletteRes.rect.top + paletteRes.rect.height / 2 : 300;
    const targetX = slotRes.status === 'FOUND' && slotRes.rect ? slotRes.rect.left + slotRes.rect.width / 2 : 400;
    const targetY = slotRes.status === 'FOUND' && slotRes.rect ? slotRes.rect.top + slotRes.rect.height / 2 : 300;

    const currentPos = this.state.cursorState
      ? { x: this.state.cursorState.x, y: this.state.cursorState.y }
      : { x: startX - 40, y: startY - 40 };

    // ── 2a. HOVER: Cursor arrives above palette gate, gate button gets real hover state ──
    const toPaletteDist = Math.hypot(startX - currentPos.x, startY - currentPos.y);
    const hoverDuration = isTesting
      ? 0
      : Math.max(180, Math.min(480, Math.round(toPaletteDist / (0.9 * speedMultiplier))));

    this.updateCursor({
      isVisible: true,
      isClicking: false,
      label: `Select ${gateUpper}`,
      isSpotlight: true,
      isInstant: true,
    });

    if (!isTesting && hoverDuration > 0) {
      const pPos = { ...currentPos };
      await animate(pPos, {
        x: startX,
        y: startY,
        duration: hoverDuration,
        ease: 'inOutCubic',
        onUpdate: () => {
          this.updateCursor({ x: pPos.x, y: pPos.y, isInstant: true });
        },
      });
    }
    this.updateCursor({ x: startX, y: startY, isInstant: true });

    document.querySelector(`[data-testid="palette-gate-${gateName.toLowerCase()}"]`)?.classList.add('teaching-hover-active');
    if (!isTesting) {
      await new Promise((r) => setTimeout(r, Math.round(140 / speedMultiplier)));
    }

    // ── 2b. PICKUP: Gate element lifts (translateY -4px, scale 1.05, drop-shadow) ──
    const el = document.querySelector(`[data-testid="palette-gate-${gateName.toLowerCase()}"]`);
    el?.classList.remove('teaching-hover-active');
    el?.classList.add('teaching-held-active');

    this.updateCursor({
      isClicking: true,
      draggingGate: gateUpper,
      label: `Dragging ${gateUpper}`,
      isSpotlight: false,
      isInstant: true,
    });

    if (!isTesting) {
      await new Promise((r) => setTimeout(r, Math.round(150 / speedMultiplier)));
    }

    // ── 2c & 2d. DRAG PATH & TARGET HOVER: Eased arc path ('inOutQuint') + slot highlight ──
    const dragDist = Math.hypot(targetX - startX, targetY - startY);
    // RULE 3: Consistent 0.65 px/ms rate
    const dragDuration = isTesting ? 0 : Math.max(400, Math.min(1300, Math.round(dragDist / (0.65 * speedMultiplier))));
    // Natural upward hand-drag arc curve
    const arcHeight = -Math.min(48, Math.max(18, dragDist * 0.09));

    if (!isTesting && dragDuration > 0) {
      const dragProgress = { t: 0 };
      let targetHoverTriggered = false;

      await animate(dragProgress, {
        t: 1,
        duration: dragDuration,
        ease: 'linear',
        onUpdate: () => {
          const rawT = dragProgress.t;
          const easedT = inOutQuint(rawT);
          const arc = Math.sin(easedT * Math.PI) * arcHeight;
          const curX = startX + (targetX - startX) * easedT;
          const curY = startY + (targetY - startY) * easedT + arc;
          this.updateCursor({ x: curX, y: curY, isInstant: true });

          // 2d. TARGET HOVER: Slot shows genuine .drag-over state as dragged gate approaches
          if (easedT >= 0.7 && !targetHoverTriggered) {
            targetHoverTriggered = true;
            document.querySelector(`[data-testid="slot-${primaryQubit}-${column}"]`)?.classList.add('drag-over');
          }
        },
      });
    }

    this.updateCursor({ x: targetX, y: targetY, isInstant: true });
    document.querySelector(`[data-testid="slot-${primaryQubit}-${column}"]`)?.classList.add('drag-over');

    if (!isTesting) {
      await new Promise((r) => setTimeout(r, Math.round(100 / speedMultiplier)));
    }

    // ── 2e. DROP: Gate snaps into slot with overshoot-and-settle ──
    this.updateCursor({
      isDropping: true,
      isClicking: false,
      label: `Placed ${gateUpper}`,
      isInstant: true,
    });

    if (!isTesting) {
      await new Promise((r) => setTimeout(r, Math.round(220 / speedMultiplier)));
    }

    // Clean up temporary DOM classes
    document.querySelector(`[data-testid="palette-gate-${gateName.toLowerCase()}"]`)?.classList.remove('teaching-held-active', 'teaching-hover-active');
    document.querySelector(`[data-testid="slot-${primaryQubit}-${column}"]`)?.classList.remove('drag-over');

    // Trigger REAL circuit state update on Workbench (or memory)
    const initialCirc = this.hooks.getCircuit();
    const actualGateId = gateId || `gate-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newGate: Gate = {
      id: actualGateId,
      gate: gateName.toLowerCase() as any,
      targets: targetQubits,
      column: column,
      angle: angle,
    };
    const filtered = initialCirc.gates.filter((g) => g.id !== actualGateId);
    this.hooks.updateCircuit({
      ...initialCirc,
      gates: [...filtered, newGate],
    });

    // ── 4. Multi-qubit (CZ) control-line connector animation step ──
    const isMultiQubit = targetQubits.length > 1;
    if (isMultiQubit) {
      this.updateCursor({
        isDropping: false,
        label: `Connecting q[${targetQubits[0]}] ↔ q[${targetQubits[1]}]`,
        isInstant: true,
      });
      if (!isTesting) {
        await new Promise((r) => setTimeout(r, Math.round(350 / speedMultiplier)));
      }
    }

    // ── 2f. RELEASE: Cursor icon lifts away and fades out — never remains visually stuck ──
    this.updateCursor({
      isDropping: false,
      draggingGate: undefined,
      label: undefined,
      isInstant: true,
    });

    if (!isTesting) {
      const liftPos = { x: targetX, y: targetY };
      await animate(liftPos, {
        x: targetX + 32,
        y: targetY - 28,
        duration: Math.round(220 / speedMultiplier),
        ease: 'outCubic',
        onUpdate: () => {
          this.updateCursor({ x: liftPos.x, y: liftPos.y, isInstant: true });
        },
      });

      // Clear cursor visibility if no subsequent drag
      setTimeout(() => {
        if (this.state.status === 'TEACHING' && !this.state.cursorState?.draggingGate) {
          this.updateCursor({ isVisible: false, label: undefined });
        }
      }, 1200);
    }
  }

  private async executeActions(actions: TeachingAction[], token: number): Promise<void> {
    this.cleanupDragDOM();

    for (const action of actions) {
      if (this.stepExecutionToken !== token) return;

      // Emit granular action event for external/3D avatars to react to
      emitTeachingEvent({
        type: 'action_executed',
        lessonId: this.state.activeLesson?.id || '',
        stepId: this.state.currentStep?.id,
        stepNumber: this.state.currentStep?.stepNumber,
        timestamp: Date.now(),
        metadata: {
          actionType: action.type,
          ...(action.type === 'add_gate' || action.type === 'PLACE_GATE' ? { gate: (action as any).gate } : {}),
          ...(action.type === 'highlight_qubit' ? { qubitIndex: (action as any).qubitIndex } : {}),
          ...(action.type === 'highlight_gate' ? { gateId: (action as any).gateId || null } : {}),
        },
      });

      switch (action.type) {
        case 'initialize_qubits': {
          const current = this.hooks.getCircuit();
          this.hooks.updateCircuit({
            ...current,
            qubits: action.qubits,
            classical_bits: action.classicalBits ?? action.qubits,
            gates: [],
          });
          break;
        }

        case 'reset_circuit': {
          const current = this.hooks.getCircuit();
          this.hooks.updateCircuit({
            ...current,
            gates: [],
          });
          this.hooks.clearHighlights();
          break;
        }

        case 'ANNOTATE': {
          const targetRes = targetResolver.resolveTarget(action.target as string);
          if (targetRes.status === 'FOUND' && targetRes.rect) {
            const centerX = targetRes.rect.left + targetRes.rect.width / 2;
            const centerY = targetRes.rect.top + targetRes.rect.height / 2;
            
            this.updateCursor({
              x: centerX,
              y: centerY,
              isVisible: true,
              annotationMode: action.shape
            });
            
            const isTesting = Boolean((globalThis as any).process?.env?.NODE_ENV === 'test');
            if (!isTesting) {
              const speed = this.state.playbackSpeed || 1;
              await new Promise((r) => setTimeout(r, action.durationMs || Math.round(1500 / speed)));
              if (this.state.status === 'TEACHING') {
                this.updateCursor({ isVisible: false, annotationMode: undefined });
              }
            }
          }
          break;
        }

        case 'ADD_GATE':
        case 'add_gate': {
          const initialCirc = this.hooks.getCircuit();
          const maxCol = initialCirc.gates.reduce((m, g) => Math.max(m, g.column ?? 0), -1);
          const col = action.column !== undefined ? action.column : maxCol + 1;
          const targets = action.targets && action.targets.length > 0
            ? action.targets
            : ((action as any).qubit !== undefined ? [(action as any).qubit] : [0]);

          await this.executePhysicalGateDrag(
            action.gate,
            targets,
            col,
            action.gateId,
            action.angle
          );
          break;
        }

        case 'PLACE_GATE':
        case 'place_gate': {
          const act = action as any;
          const initialCirc = this.hooks.getCircuit();
          const maxCol = initialCirc.gates.reduce((m, g) => Math.max(m, g.column ?? 0), -1);

          let targets: number[] = [0];
          let col = maxCol + 1;

          if (act.target && typeof act.target === 'object') {
            if (act.target.qubit !== undefined) {
              targets = [Number(act.target.qubit)];
            } else if (Array.isArray(act.target.qubits)) {
              targets = act.target.qubits.map(Number);
            }
            if (act.target.column !== undefined) {
              col = Number(act.target.column);
            }
          }
          if (act.targets && Array.isArray(act.targets)) {
            targets = act.targets.map(Number);
          }
          if (act.column !== undefined) {
            col = Number(act.column);
          }

          await this.executePhysicalGateDrag(
            act.gate,
            targets,
            col,
            act.gateId,
            act.angle
          );
          break;
        }

        case 'REMOVE_GATE':
        case 'remove_gate': {
          const current = this.hooks.getCircuit();
          const updatedGates = current.gates.filter((g) => {
            if (action.gateId) return g.id !== action.gateId;
            if (action.qubit !== undefined && action.column !== undefined) {
              return !(g.targets.includes(action.qubit) && g.column === action.column);
            }
            return true;
          });
          this.hooks.updateCircuit({
            ...current,
            gates: updatedGates,
          });
          break;
        }

        case 'highlight_gate': {
          this.hooks.highlightGate(action.gateId || null);
          this.updateState({ highlightedGateId: action.gateId || null });
          if (action.gateId) {
            const gateRes = targetResolver.resolveTarget(`placed-gate-${action.gateId}`);
            if (gateRes.status === 'FOUND' && gateRes.rect) {
              this.updateCursor({
                x: gateRes.rect.left + gateRes.rect.width / 2,
                y: gateRes.rect.top + gateRes.rect.height / 2,
                isVisible: true,
                isClicking: false,
                label: 'Gate Inspector',
                isSpotlight: true,
              });
            }
          }
          break;
        }

        case 'highlight_qubit': {
          this.hooks.highlightQubit(action.qubitIndex);
          this.updateState({ highlightedQubitIndex: action.qubitIndex });
          const targetRes = targetResolver.resolveTarget(`circuit-q${action.qubitIndex}`);
          if (targetRes.status === 'FOUND' && targetRes.rect) {
            this.updateCursor({
              x: targetRes.rect.left + 50,
              y: targetRes.rect.top + targetRes.rect.height / 2,
              isVisible: true,
              isClicking: false,
              label: `Wire q[${action.qubitIndex}]`,
              isSpotlight: true,
            });
          }
          break;
        }

        case 'clear_highlights': {
          this.hooks.clearHighlights();
          this.updateState({ highlightedGateId: null, highlightedQubitIndex: null });
          this.updateCursor({ isVisible: false, draggingGate: undefined, label: undefined });
          break;
        }

        case 'focus_visualization': {
          this.hooks.focusVisualization(action.panel);
          this.updateState({ activeVisualizationTab: action.panel });
          break;
        }

        case 'SHOW_STATE': {
          this.hooks.focusVisualization('state');
          this.updateState({ activeVisualizationTab: 'state' });
          break;
        }

        case 'SHOW_PROBABILITY': {
          this.hooks.focusVisualization('results');
          this.updateState({ activeVisualizationTab: 'results', status: 'SHOWING_RESULT' });
          break;
        }

        case 'SHOW_QSPHERE': {
          this.hooks.focusVisualization('qsphere');
          this.updateState({ activeVisualizationTab: 'qsphere' });
          break;
        }

        case 'SHOW_MATH':
        case 'RENDER_KATEX': {
          const act = action as any;
          const formula = act.formula || act.expression;
          const label = act.label || act.id || 'Equation';
          this.updateState({
            activeMathFormula: { formula, label },
          });
          if (act.duration && act.duration > 0) {
            const isTesting = Boolean((globalThis as any).process?.env?.NODE_ENV === 'test');
            if (!isTesting) {
              await new Promise((r) => setTimeout(r, Math.min(act.duration, 800)));
            }
          }
          break;
        }

        case 'SHOW_TEXT': {
          this.updateState({
            activeTextCard: action.text,
            narrationText: action.text,
          });
          break;
        }

        case 'EXPLAIN':
        case 'explain': {
          // Show explanation through the narration bar, not as a toast (avoids stacking)
          if (action.message) {
            const text = action.title ? `${action.title}: ${action.message}` : action.message;
            this.updateState({ narrationText: text, activeTextCard: text });
          }
          break;
        }

        case 'NARRATE':
        case 'narrate': {
          this.updateState({ narrationText: action.text, activeTextCard: action.text });
          this.speech?.speak(action.text).catch(() => {});
          break;
        }

        case 'SIMULATE':
        case 'run_simulation': {
          this.updateState({ status: 'RUNNING_SIMULATION' });
          this.simulationCount++;

          let routingReason: string | undefined;
          let executionMethod: string | undefined;
          try {
            const currentCirc = this.hooks.getCircuit?.();
            if (currentCirc) {
              const decision = routeCircuit(currentCirc);
              routingReason = decision.routing_reason;
              executionMethod = decision.method;
            }
          } catch {
            // Non-blocking
          }

          emitTeachingEvent({
            type: 'simulation_started',
            lessonId: this.state.activeLesson?.id || '',
            timestamp: Date.now(),
            metadata: {
              shots: action.shots || 1000,
              backend: action.backend || 'auto',
              routingReason,
              executionMethod,
            },
          });

          const simResult = await this.hooks.runSimulation(action.shots, action.backend);
          this.lastSimResult = simResult;

          emitTeachingEvent({
            type: 'simulation_completed',
            lessonId: this.state.activeLesson?.id || '',
            timestamp: Date.now(),
            metadata: {
              backend: simResult?.simulation?.backend || 'simulator',
              executionTimeMs: simResult?.simulation?.execution_time_ms || 0,
            },
          });

          this.updateState({ status: 'TEACHING' });
          break;
        }

        case 'WAIT_FOR_STATE': {
          const isTesting = Boolean((globalThis as any).process?.env?.NODE_ENV === 'test');
          if (!isTesting) {
            await new Promise((r) => setTimeout(r, 200));
          }
          break;
        }

        case 'show_result': {
          this.updateState({ status: 'SHOWING_RESULT' });
          this.hooks.focusVisualization('results');
          break;
        }

        case 'compare_prediction': {
          const step = this.state.currentStep;
          let checkpoint = step?.checkpoint;
          if (!checkpoint && this.state.activeLesson) {
            for (let i = this.state.currentStepIndex; i >= 0; i--) {
              if (this.state.activeLesson.steps[i].checkpoint) {
                checkpoint = this.state.activeLesson.steps[i].checkpoint;
                break;
              }
            }
          }
          const simResult = this.hooks.getSimulationResult() || this.lastSimResult;

          if (checkpoint && this.state.selectedPredictionIndex !== null) {
            const rule = action.comparisonRule || checkpoint.comparisonRule;
            if (rule) {
              const comp = rule(this.state.selectedPredictionIndex, simResult);
              this.updateState({ predictionComparison: comp });
            } else if (checkpoint.structuredComparison) {
              const comp = evaluateStructuredComparison(
                this.state.selectedPredictionIndex,
                checkpoint.correctOptionIndex,
                checkpoint.structuredComparison,
                simResult,
                checkpoint.explanation
              );
              this.updateState({ predictionComparison: comp });
            } else {
              const isCorrect = this.state.selectedPredictionIndex === checkpoint.correctOptionIndex;
              this.updateState({
                predictionComparison: {
                  isMatch: isCorrect,
                  userSummary: isCorrect ? 'Your prediction was accurate!' : 'Prediction evaluated.',
                  detailedExplanation: checkpoint.explanation,
                },
              });
            }
          }
          break;
        }

        case 'MOVE_CURSOR':
        case 'MOVE': {
          const res = targetResolver.resolveTarget(action.target);
          if (res.status === 'FOUND' && res.rect) {
            const destX = res.rect.left + res.rect.width / 2;
            const destY = res.rect.top + res.rect.height / 2;
            const currentPos = this.state.cursorState
              ? { x: this.state.cursorState.x, y: this.state.cursorState.y }
              : { x: destX - 40, y: destY - 40 };

            const isTesting = Boolean((globalThis as any).process?.env?.NODE_ENV === 'test');
            const speedMultiplier = this.state.playbackSpeed || 1;
            const dist = Math.hypot(destX - currentPos.x, destY - currentPos.y);
            const travelDuration = isTesting ? 0 : Math.max(220, Math.min(800, Math.round(dist / (0.9 * speedMultiplier))));

            this.updateCursor({
              isVisible: true,
              isClicking: false,
              isInstant: true,
            });

            if (!isTesting && travelDuration > 0) {
              const movePos = { ...currentPos };
              await animate(movePos, {
                x: destX,
                y: destY,
                duration: travelDuration,
                ease: 'inOutCubic',
                onUpdate: () => {
                  this.updateCursor({ x: movePos.x, y: movePos.y, isInstant: true });
                },
              });
            }
            this.updateCursor({
              x: destX,
              y: destY,
              isVisible: true,
              isClicking: false,
              isInstant: true,
            });
          }
          break;
        }

        case 'CLICK': {
          if (action.target) {
            const targetStr = typeof action.target === 'string' ? action.target : action.target.id;
            const res = targetResolver.resolveTarget(targetStr);
            if (res.status === 'FOUND' && res.rect) {
              this.updateCursor({
                x: res.rect.left + res.rect.width / 2,
                y: res.rect.top + res.rect.height / 2,
                isVisible: true,
              });
            }
          }
          this.updateCursor({ isClicking: true });
          const isTesting = Boolean((globalThis as any).process?.env?.NODE_ENV === 'test');
          if (!isTesting) {
            await new Promise((r) => setTimeout(r, 150));
          }
          this.updateCursor({ isClicking: false });
          break;
        }

        case 'DRAG': {
          const targetStr = typeof action.target === 'string' ? action.target : action.target.id;
          const res = targetResolver.resolveTarget(targetStr);
          const gateMatch = targetStr.match(/gate-(?:palette-)?([a-zA-Z0-9]+)/i);
          const draggingGate = gateMatch ? gateMatch[1].toUpperCase() : undefined;
          if (res.status === 'FOUND' && res.rect) {
            this.updateCursor({
              x: res.rect.left + res.rect.width / 2,
              y: res.rect.top + res.rect.height / 2,
              isVisible: true,
              isClicking: true,
              isSpotlight: true,
              draggingGate,
              label: draggingGate ? `Dragging ${draggingGate}` : undefined,
            });
          }
          break;
        }

        case 'DROP': {
          const targetStr = typeof action.target === 'string' ? action.target : action.target.id;
          const res = targetResolver.resolveTarget(targetStr);
          if (res.status === 'FOUND' && res.rect) {
            this.updateCursor({
              x: res.rect.left + res.rect.width / 2,
              y: res.rect.top + res.rect.height / 2,
              isVisible: true,
              isClicking: false,
              isSpotlight: false,
              draggingGate: undefined,
              label: 'Placed',
            });
          }
          break;
        }

        case 'HIGHLIGHT':
        case 'FOCUS': {
          const targetStr = typeof action.target === 'string' ? action.target : action.target.id;
          
          // Clear previous highlights
          this.hooks.clearHighlights();

          // 1. Hook into IDE for internal highlighting and panel focus
          if (targetStr.startsWith('gate-')) {
            const gateId = targetStr.replace(/^gate-(?:palette-)?/, '');
            this.hooks.highlightGate(gateId);
          } else if (targetStr.startsWith('qubit-')) {
            const qIdx = parseInt(targetStr.replace(/^qubit-/, ''), 10);
            if (!isNaN(qIdx)) this.hooks.highlightQubit(qIdx);
          } else if (targetStr.match(/panel|results|state|math|bloch|qsphere|timeline|metrics|phase/i)) {
             const knownPanels = ['results', 'state', 'math', 'bloch', 'qsphere', 'timeline', 'metrics', 'phase'] as const;
             const matched = knownPanels.find(p => targetStr.toLowerCase().includes(p));
             if (matched) {
               this.hooks.focusVisualization(matched);
             }
          }

          // 2. Existing DOM cursor highlighting
          const res = targetResolver.resolveTarget(targetStr);
          if (res.status === 'FOUND' && res.rect) {
            this.updateCursor({
              x: res.rect.left + res.rect.width / 2,
              y: res.rect.top + res.rect.height / 2,
              isVisible: true,
              isSpotlight: true,
            });
          }
          break;
        }

        case 'SPEAK': {
          if (action.text) {
            this.updateState({ narrationText: action.text });
            this.speech?.speak(action.text).catch(() => {});
          }
          break;
        }

        case 'PAUSE': {
          if (action.duration && action.duration > 0) {
            const isTesting = Boolean((globalThis as any).process?.env?.NODE_ENV === 'test');
            if (!isTesting) {
              await new Promise((r) => setTimeout(r, Math.min(action.duration, 1000)));
            }
          }
          break;
        }

        case 'pause':
        case 'wait': {
          const duration = (action as any).durationMs || (action as any).duration || 0;
          if (duration > 0) {
            await new Promise((resolve) => setTimeout(resolve, duration));
          }
          break;
        }

        case 'RESUME': {
          await this.resume();
          break;
        }

        case 'WAIT_FOR_LEARNER':
        case 'learner_turn': {
          const takeover = (action as any).config || this.state.currentStep?.takeover;
          let isSatisfied = false;
          if (takeover?.completionCriteria) {
            const currentCirc = this.hooks.getCircuit();
            const simRes = this.hooks.getSimulationResult() || this.lastSimResult;
            isSatisfied = evaluateCompletionCriteria(takeover.completionCriteria, currentCirc, simRes);
          } else if (takeover?.customValidator) {
            isSatisfied = takeover.customValidator(this.hooks.getCircuit(), this.hooks.getSimulationResult());
          }
          this.updateState({
            status: 'LEARNER_TURN',
            isTakeoverSatisfied: isSatisfied,
          });
          break;
        }

        case 'VALIDATE': {
          if ((action as any).criteria) {
            const currentCirc = this.hooks.getCircuit();
            const simRes = this.hooks.getSimulationResult() || this.lastSimResult;
            const isSatisfied = evaluateCompletionCriteria((action as any).criteria, currentCirc, simRes);
            this.updateState({ isTakeoverSatisfied: isSatisfied });
          }
          break;
        }

        case 'COMPLETE':
        case 'complete_lesson': {
          await this.completeLesson();
          break;
        }
      }
    }
  }



}

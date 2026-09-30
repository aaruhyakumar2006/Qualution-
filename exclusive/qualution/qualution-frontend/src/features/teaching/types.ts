import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';

export type TutorState =
  | 'IDLE'
  | 'PREPARING'
  | 'PLAYING'
  | 'PAUSED'
  | 'WAITING_FOR_LEARNER'
  | 'WAITING_FOR_SOCRATIC'
  | 'VALIDATING'
  | 'RESPONDING'
  | 'SIMULATING'
  | 'COMPLETED'
  | 'ERROR';

export type TeachingStatus =
  | 'IDLE'
  | 'TEACHING'
  | 'WAITING_FOR_PREDICTION'
  | 'WAITING_FOR_SOCRATIC'
  | 'RUNNING_SIMULATION'
  | 'SHOWING_RESULT'
  | 'LEARNER_TURN'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ERROR';

export type TeachingDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

// ── Semantic Teaching Targets ──────────────────────────────────────────
export interface TeachingTarget {
  kind: 'teaching-target';
  id: string; // e.g. "gate-palette-H", "circuit-q0"
}

export interface CursorState {
  x: number;
  y: number;
  isVisible: boolean;
  isClicking: boolean;
  label?: string;
  isSpotlight?: boolean;
  draggingGate?: string;
  annotationMode?: 'circle' | 'draw_trail';
  isInstant?: boolean;
  isDropping?: boolean;
}

// ── Structured Deterministic Teaching Actions ───────────────────────

export type BaseTeachingAction = {
  id?: string;
  duration?: number;
};

export type TargetRef =
  | string
  | TeachingTarget
  | { type?: string; gate?: string; qubit?: number; qubits?: number[]; column?: number; id?: string };

export type MoveAction = BaseTeachingAction & { type: 'MOVE' | 'MOVE_CURSOR'; target: TargetRef };
export type PlaceGateAction = BaseTeachingAction & {
  type: 'PLACE_GATE' | 'place_gate';
  gate: string;
  target?: {
    qubit?: number;
    qubits?: number[];
    column?: number;
    type?: string;
  } | TargetRef;
  targets?: number[];
  column?: number;
  gateId?: string;
  angle?: number;
};
export type RenderKatexAction = BaseTeachingAction & {
  type: 'RENDER_KATEX';
  id?: string;
  expression: string;
  x?: number;
  y?: number;
  duration?: number;
};
export type NarrateAction = BaseTeachingAction & {
  type: 'NARRATE' | 'narrate';
  text: string;
};
export type ClickAction = BaseTeachingAction & { type: 'CLICK'; target?: TargetRef };
export type DragAction = BaseTeachingAction & { type: 'DRAG'; target: TargetRef };
export type DropAction = BaseTeachingAction & { type: 'DROP'; target: TargetRef };
export type PauseAction = BaseTeachingAction & { type: 'PAUSE'; duration: number };
export type HighlightAction = BaseTeachingAction & { type: 'HIGHLIGHT'; target: TargetRef };
export type FocusAction = BaseTeachingAction & { type: 'FOCUS'; target: TargetRef };
export type SpeakAction = BaseTeachingAction & { type: 'SPEAK'; audioId?: string; text?: string };
export type WaitForStateAction = BaseTeachingAction & { type: 'WAIT_FOR_STATE'; targetState: string; timeoutMs?: number };
export type ShowConceptAction = BaseTeachingAction & { type: 'SHOW_CONCEPT'; concept: string };
export type ShowMathAction = BaseTeachingAction & { type: 'SHOW_MATH'; formula: string; label?: string };
export type ShowTextAction = BaseTeachingAction & { type: 'SHOW_TEXT'; text: string; title?: string };
export type ShowCircuitAction = BaseTeachingAction & { type: 'SHOW_CIRCUIT' };
export type ShowResultAction = BaseTeachingAction & { type: 'SHOW_RESULT' | 'SHOW_PROBABILITY' };
export type ShowStateAction = BaseTeachingAction & { type: 'SHOW_STATE' };
export type ShowQSphereAction = BaseTeachingAction & { type: 'SHOW_QSPHERE' };
export type AddGateAction = BaseTeachingAction & {
  type: 'ADD_GATE' | 'add_gate';
  gate: string;
  targets: number[];
  column?: number;
  angle?: number;
  gateId?: string;
};
export type RemoveGateAction = BaseTeachingAction & {
  type: 'REMOVE_GATE' | 'remove_gate';
  gateId?: string;
  qubit?: number;
  column?: number;
};
export type SimulateAction = BaseTeachingAction & {
  type: 'SIMULATE' | 'run_simulation';
  shots?: number;
  backend?: string;
};
export type AskQuestionAction = BaseTeachingAction & {
  type: 'ASK_QUESTION';
  question: string;
  options?: Array<{ id: string; label: string; description?: string; isCorrect?: boolean }> | string[];
  checkpoint?: PredictionCheckpoint;
};
export type SocraticCheckpointAction = BaseTeachingAction & {
  type: 'SOCRATIC_CHECKPOINT';
  conceptKey: string;
  questionId?: string;
};
export type HandoffToStudentAction = BaseTeachingAction & { type: 'HANDOFF_TO_STUDENT'; expectedAction: any };
export type WaitForLearnerAction = BaseTeachingAction & { type: 'WAIT_FOR_LEARNER'; config?: LearnerTakeoverConfig };
export type ValidateAction = BaseTeachingAction & { type: 'VALIDATE'; criteria?: TaskCompletionCriterion };
export type ExplainAction = BaseTeachingAction & { type: 'EXPLAIN' | 'explain'; title?: string; message: string };
export type CompleteAction = BaseTeachingAction & { type: 'COMPLETE' | 'complete_lesson' };
export type AnnotateAction = BaseTeachingAction & { type: 'ANNOTATE'; shape: 'circle' | 'draw_trail' | 'arrow' | 'underline'; target: TargetRef; durationMs?: number };

export type TeachingAction =
  | MoveAction
  | ClickAction
  | DragAction
  | DropAction
  | PauseAction
  | HighlightAction
  | FocusAction
  | SpeakAction
  | WaitForStateAction
  | ShowConceptAction
  | ShowMathAction
  | ShowTextAction
  | ShowCircuitAction
  | ShowResultAction
  | ShowStateAction
  | ShowQSphereAction
  | AddGateAction
  | PlaceGateAction
  | RenderKatexAction
  | NarrateAction
  | RemoveGateAction
  | SimulateAction
  | AskQuestionAction
  | SocraticCheckpointAction
  | { id?: string; type: 'socratic_checkpoint'; conceptKey: string; questionId?: string }
  | HandoffToStudentAction
  | WaitForLearnerAction
  | ValidateAction
  | ExplainAction
  | CompleteAction
  | { id?: string; type: 'initialize_qubits'; qubits: number; classicalBits?: number }
  | { id?: string; type: 'reset_circuit' }
  | { id?: string; type: 'highlight_gate'; gateId?: string | null; targetQubit?: number; column?: number }
  | { id?: string; type: 'highlight_qubit'; qubitIndex: number }
  | { id?: string; type: 'clear_highlights' }
  | { id?: string; type: 'focus_visualization'; panel: 'results' | 'state' | 'bloch' | 'qsphere' | 'timeline' | 'metrics' | 'phase' }
  | { id?: string; type: 'narrate'; text: string }
  | { id?: string; type: 'show_result' }
  | { id?: string; type: 'compare_prediction'; comparisonRule?: any }
  | { id?: string; type: 'pause'; durationMs: number }
  | { id?: string; type: 'wait'; durationMs: number }
  | { id?: string; type: 'RESUME' }
  | { id?: string; type: 'learner_turn'; config?: any }
  | AnnotateAction;

// ── Prediction & Comparison Models ──────────────────────────────────

export type PredictionComparisonRule = (
  predictionIndex: number,
  simulationResult: CircuitRunResponse | null
) => PredictionComparisonResult;

export interface PredictionOption {
  id: string;
  label: string;
  description?: string;
  isCorrect?: boolean;
}

export interface PredictionComparisonResult {
  isMatch: boolean;
  userSummary: string;
  detailedExplanation: string;
}

export interface StructuredPredictionComparison {
  targetState?: string;
  expectedDistribution?: Record<string, { min: number; max: number }>;
  matchSummary?: string;
  divergenceSummary?: string;
}

export interface PredictionCheckpoint {
  id: string;
  prompt: string;
  question: string;
  options: PredictionOption[];
  correctOptionIndex: number;
  explanation: string;
  comparisonRule?: PredictionComparisonRule;
  structuredComparison?: StructuredPredictionComparison;
  interactivePredict?: 'bloch_click';
  expectedBlochVector?: { x: number; y: number; z: number };
}

// ── Structured Learner Task Criteria (No Unsafe JS Execution) ───────

export type TaskCompletionCriterion =
  | { type: 'explicit_finish' }
  | {
      type: 'circuit_has_gates';
      minGates?: number;
      maxGates?: number;
      requiredGates?: string[];
      targetQubits?: number[];
    }
  | {
      type: 'circuit_topology';
      qubits: number;
      exactGateSequence?: string[];
    }
  | {
      type: 'simulation_probability';
      state: string;
      minProbability?: number;
      maxProbability?: number;
    }
  | {
      type: 'all_of';
      criteria: TaskCompletionCriterion[];
    }
  | {
      type: 'any_of';
      criteria: TaskCompletionCriterion[];
    };

export interface LearnerTakeoverConfig {
  taskType?: 'recreate_circuit' | 'modify_circuit' | 'add_gate' | 'observe_interference' | 'free_experiment';
  prompt: string;
  instructions: string[];
  goalDescription: string;
  suggestedActionLabel?: string;
  allowEarlyCompletion?: boolean;
  hints?: string[];
  completionCriteria?: TaskCompletionCriterion;
  customValidator?: (circuit: CircuitRequest, simulationResult?: CircuitRunResponse | null) => boolean;
  customDiagnoser?: (circuit: CircuitRequest) => {
    isCorrect: boolean;
    isInitial?: boolean;
    message: string;
    misconceptionId?: string;
    shouldCountAttempt?: boolean;
  };
  solutionActions?: TeachingAction[];
  minFailedAttemptsForSolution?: number;
  autoAdvanceOnSuccess?: boolean;
  successNarration?: string;
}

// ── Teaching Step & Lesson Script Model ─────────────────────────────

export interface TeachingStep {
  id: string;
  stepNumber: number;
  title: string;
  explanation: string;
  narrationText: string;
  actions: TeachingAction[];
  checkpoint?: PredictionCheckpoint;
  takeover?: LearnerTakeoverConfig;
  autoAdvance?: boolean;
  delayAfterActionsMs?: number;
  circuitSnapshot?: CircuitRequest;
}

export interface LessonScript {
  id: string;
  title: string;
  sprint: number | string;
  difficulty: TeachingDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  learningObjectives: string[];
  prerequisites: string[];
  conceptTags: string[];
  summary: string;
  completionMessage?: string;
  curriculumModuleId?: string;
  starterCircuit?: CircuitRequest;
  isAssessment?: boolean;
  steps: TeachingStep[];
}

// ── Teaching Controller State ───────────────────────────────────────

export interface TeachingControllerState {
  status: TeachingStatus;
  activeLesson: LessonScript | null;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: TeachingStep | null;
  selectedPredictionIndex: number | null;
  predictionComparison: PredictionComparisonResult | null;
  highlightedGateId: string | null;
  highlightedQubitIndex: number | null;
  narrationText: string;
  activeMathFormula?: { formula: string; label?: string } | null;
  activeTextCard?: string | null;
  activeVisualizationTab?: 'results' | 'state' | 'bloch' | 'qsphere' | 'timeline' | 'metrics' | 'phase';
  isAudioMuted: boolean;
  isSpeaking: boolean;
  isAutoPlay: boolean;
  isTakeoverSatisfied: boolean;
  takeoverFailedAttempts?: number;
  takeoverFeedback?: {
    isError: boolean;
    message: string;
    misconceptionId?: string;
  } | null;
  cursorState?: CursorState | null;
  playbackSpeed?: number;
  furthestValidatedStepIndex?: number;
  validatedStepIndices?: number[];
  error: string | null;
}

// ── Teaching Telemetry & Analytics Events ───────────────────────────

export type TeachingEventType =
  | 'lesson_started'
  | 'step_started'
  | 'step_completed'
  | 'action_executed'
  | 'prediction_requested'
  | 'prediction_submitted'
  | 'simulation_started'
  | 'simulation_completed'
  | 'learner_takeover'
  | 'lesson_completed';

export interface TeachingEvent {
  type: TeachingEventType;
  lessonId: string;
  stepId?: string;
  stepNumber?: number;
  timestamp: number;
  metadata?: Record<string, string | number | boolean | null>;
}

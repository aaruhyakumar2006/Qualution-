import type {
  LessonScript,
  TeachingStep,
  TeachingAction,
  PredictionCheckpoint,
  LearnerTakeoverConfig,
  TaskCompletionCriterion,
  StructuredPredictionComparison,
  PredictionComparisonResult,
} from './types';
import type { CircuitRequest, CircuitRunResponse } from '../circuit/types';

export class LessonValidationError extends Error {
  public readonly errors: string[];

  constructor(lessonId: string, errors: string[]) {
    super(`[LessonValidator] Lesson "${lessonId}" has ${errors.length} validation error(s):\n - ${errors.join('\n - ')}`);
    this.name = 'LessonValidationError';
    this.errors = errors;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_ACTION_TYPES = new Set([
  'MOVE',
  'MOVE_CURSOR',
  'CLICK',
  'DRAG',
  'DROP',
  'PAUSE',
  'HIGHLIGHT',
  'FOCUS',
  'SPEAK',
  'WAIT_FOR_STATE',
  'SHOW_CONCEPT',
  'SHOW_MATH',
  'SHOW_TEXT',
  'SHOW_CIRCUIT',
  'SHOW_RESULT',
  'SHOW_PROBABILITY',
  'SHOW_STATE',
  'SHOW_QSPHERE',
  'ASK_QUESTION',
  'HANDOFF_TO_STUDENT',
  'WAIT_FOR_LEARNER',
  'VALIDATE',
  'EXPLAIN',
  'COMPLETE',
  'RESUME',
  'initialize_qubits',
  'reset_circuit',
  'ADD_GATE',
  'add_gate',
  'PLACE_GATE',
  'place_gate',
  'NARRATE',
  'RENDER_KATEX',
  'REMOVE_GATE',
  'remove_gate',
  'highlight_gate',
  'highlight_qubit',
  'clear_highlights',
  'focus_visualization',
  'explain',
  'narrate',
  'SIMULATE',
  'run_simulation',
  'show_result',
  'compare_prediction',
  'pause',
  'wait',
  'learner_turn',
  'complete_lesson',
  'ANNOTATE',
  'annotate',
]);

const VALID_PANELS = new Set(['results', 'state', 'bloch', 'qsphere', 'timeline', 'metrics', 'phase']);

/**
 * Validates an action configuration.
 */
function validateAction(action: TeachingAction, stepNum: number, actionIdx: number, errors: string[]): void {
  const prefix = `Step ${stepNum}, action ${actionIdx} (${action.type})`;

  if (!action.type || !VALID_ACTION_TYPES.has(action.type)) {
    errors.push(`${prefix}: Unrecognized action type "${(action as any).type}".`);
    return;
  }

  // Common target validation
  if (['MOVE', 'MOVE_CURSOR', 'CLICK', 'DRAG', 'DROP', 'HIGHLIGHT', 'FOCUS'].includes(action.type)) {
    const targetAction = action as any;
    if (action.type !== 'CLICK') {
      const hasTarget = typeof targetAction.target === 'string'
        ? Boolean(targetAction.target.trim())
        : Boolean(
            targetAction.target &&
            (targetAction.target.id || targetAction.target.type || targetAction.target.qubit !== undefined || targetAction.target.qubits !== undefined)
          );
      if (!hasTarget) {
        errors.push(`${prefix}: Missing semantic target id.`);
      }
    }
  }

  switch (action.type) {
    case 'initialize_qubits':
      if (typeof action.qubits !== 'number' || action.qubits < 1 || !Number.isInteger(action.qubits)) {
        errors.push(`${prefix}: "qubits" must be an integer >= 1.`);
      }
      break;
    case 'ADD_GATE':
    case 'add_gate': {
      const act = action as any;
      if (!act.gate || typeof act.gate !== 'string') {
        errors.push(`${prefix}: "gate" must be a non-empty string.`);
      }
      if (!Array.isArray(act.targets) || act.targets.length === 0 || act.targets.some((t: any) => typeof t !== 'number' || t < 0)) {
        errors.push(`${prefix}: "targets" must be a non-empty array of non-negative integers.`);
      }
      break;
    }
    case 'PLACE_GATE':
    case 'place_gate': {
      const act = action as any;
      if (!act.gate || typeof act.gate !== 'string') {
        errors.push(`${prefix}: "gate" must be a non-empty string.`);
      }
      if (!act.target && !act.targets) {
        errors.push(`${prefix}: Missing target wire or slot.`);
      }
      break;
    }
    case 'NARRATE':
    case 'RENDER_KATEX':
      break;
    case 'highlight_qubit': {
      const act = action as any;
      if (typeof act.qubitIndex !== 'number' || act.qubitIndex < 0 || !Number.isInteger(act.qubitIndex)) {
        errors.push(`${prefix}: "qubitIndex" must be a non-negative integer.`);
      }
      break;
    }
    case 'focus_visualization': {
      const act = action as any;
      if (!VALID_PANELS.has(act.panel)) {
        errors.push(`${prefix}: Unrecognized panel "${act.panel}". Valid: ${Array.from(VALID_PANELS).join(', ')}.`);
      }
      break;
    }
    case 'pause': {
      const act = action as any;
      if (typeof act.durationMs !== 'number' || act.durationMs < 0) {
        errors.push(`${prefix}: "durationMs" must be a non-negative number.`);
      }
      break;
    }
    case 'SIMULATE':
    case 'run_simulation': {
      const act = action as any;
      if (act.shots !== undefined && (typeof act.shots !== 'number' || act.shots < 1)) {
        errors.push(`${prefix}: "shots" must be a positive integer.`);
      }
      break;
    }
    case 'SHOW_MATH': {
      const act = action as any;
      if (!act.formula || typeof act.formula !== 'string') {
        errors.push(`${prefix}: "formula" string is required for SHOW_MATH.`);
      }
      break;
    }
    case 'SHOW_TEXT': {
      const act = action as any;
      if (!act.text || typeof act.text !== 'string') {
        errors.push(`${prefix}: "text" string is required for SHOW_TEXT.`);
      }
      break;
    }
    case 'SPEAK':
      if (!action.text && !action.audioId) {
        errors.push(`${prefix}: "text" or "audioId" must be provided for SPEAK action.`);
      }
      break;
    case 'PAUSE':
      if (typeof action.duration !== 'number' || action.duration < 0) {
        errors.push(`${prefix}: "duration" must be a non-negative number.`);
      }
      break;
    case 'WAIT_FOR_STATE':
      if (!action.targetState) {
        errors.push(`${prefix}: "targetState" string is required.`);
      }
      break;
    case 'HANDOFF_TO_STUDENT':
      if (!action.expectedAction) {
        errors.push(`${prefix}: "expectedAction" object is required.`);
      }
      break;
  }
}

/**
 * Validates prediction checkpoint configuration.
 */
function validateCheckpoint(checkpoint: PredictionCheckpoint, stepNum: number, errors: string[]): void {
  const prefix = `Step ${stepNum}, Checkpoint "${checkpoint.id || 'unnamed'}"`;

  if (!checkpoint.id || typeof checkpoint.id !== 'string' || !checkpoint.id.trim()) {
    errors.push(`${prefix}: Missing checkpoint "id".`);
  }
  if (!checkpoint.prompt || typeof checkpoint.prompt !== 'string' || !checkpoint.prompt.trim()) {
    errors.push(`${prefix}: Missing checkpoint "prompt".`);
  }
  if (!checkpoint.question || typeof checkpoint.question !== 'string' || !checkpoint.question.trim()) {
    errors.push(`${prefix}: Missing checkpoint "question".`);
  }
  if (!Array.isArray(checkpoint.options) || checkpoint.options.length < 2) {
    errors.push(`${prefix}: Checkpoint must provide at least 2 options.`);
  } else {
    checkpoint.options.forEach((opt, idx) => {
      if (!opt.id || !opt.label) {
        errors.push(`${prefix}, option ${idx}: Option must provide non-empty "id" and "label".`);
      }
    });
  }

  const optCount = Array.isArray(checkpoint.options) ? checkpoint.options.length : 0;
  if (
    typeof checkpoint.correctOptionIndex !== 'number' ||
    !Number.isInteger(checkpoint.correctOptionIndex) ||
    checkpoint.correctOptionIndex < 0 ||
    (optCount > 0 && checkpoint.correctOptionIndex >= optCount)
  ) {
    errors.push(
      `${prefix}: "correctOptionIndex" (${checkpoint.correctOptionIndex}) is out of bounds (0 to ${Math.max(0, optCount - 1)}).`
    );
  }

  if (!checkpoint.explanation || typeof checkpoint.explanation !== 'string' || !checkpoint.explanation.trim()) {
    errors.push(`${prefix}: Missing explanation string.`);
  }
}

/**
 * Validates learner takeover configuration.
 */
function validateTakeover(takeover: LearnerTakeoverConfig, stepNum: number, errors: string[]): void {
  const prefix = `Step ${stepNum}, LearnerTakeover`;

  if (!takeover.prompt || typeof takeover.prompt !== 'string' || !takeover.prompt.trim()) {
    errors.push(`${prefix}: Missing takeover "prompt".`);
  }
  if (!takeover.goalDescription || typeof takeover.goalDescription !== 'string' || !takeover.goalDescription.trim()) {
    errors.push(`${prefix}: Missing takeover "goalDescription".`);
  }
  if (!Array.isArray(takeover.instructions) || takeover.instructions.length === 0) {
    errors.push(`${prefix}: Takeover must provide at least 1 instruction.`);
  }
  if (takeover.hints !== undefined) {
    if (!Array.isArray(takeover.hints) || takeover.hints.some((h) => typeof h !== 'string' || !h.trim())) {
      errors.push(`${prefix}: "hints" must be an array of non-empty strings.`);
    }
  }
}

/**
 * Validates a complete LessonScript definition against core invariants.
 */
export function validateLessonScript(lesson: unknown): ValidationResult {
  const errors: string[] = [];

  if (!lesson || typeof lesson !== 'object') {
    return { valid: false, errors: ['Lesson definition must be a non-null object.'] };
  }

  const l = lesson as Partial<LessonScript>;

  // Metadata validation
  if (!l.id || typeof l.id !== 'string' || !l.id.trim()) {
    errors.push('Lesson "id" must be a non-empty string.');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(l.id)) {
    errors.push(`Lesson "id" ("${l.id}") contains invalid characters. Use alphanumeric, dashes, and underscores.`);
  }

  if (!l.title || typeof l.title !== 'string' || !l.title.trim()) {
    errors.push('Lesson "title" must be a non-empty string.');
  }

  if (l.sprint === undefined || l.sprint === null || (typeof l.sprint === 'number' && l.sprint < 1)) {
    errors.push('Lesson "sprint" must be a positive integer or non-empty string.');
  }

  if (!l.difficulty || !['Beginner', 'Intermediate', 'Advanced'].includes(l.difficulty)) {
    errors.push('Lesson "difficulty" must be "Beginner", "Intermediate", or "Advanced".');
  }

  if (typeof l.estimatedMinutes !== 'number' || l.estimatedMinutes <= 0) {
    errors.push('Lesson "estimatedMinutes" must be a positive number.');
  }

  if (typeof l.xpReward !== 'number' || l.xpReward < 0) {
    errors.push('Lesson "xpReward" must be a non-negative number.');
  }

  if (!Array.isArray(l.learningObjectives) || l.learningObjectives.length === 0) {
    errors.push('Lesson must provide at least 1 item in "learningObjectives".');
  }

  if (!Array.isArray(l.steps) || l.steps.length === 0) {
    errors.push('Lesson must define at least one teaching step.');
    return { valid: errors.length === 0, errors };
  }

  // Step invariants
  const seenStepIds = new Set<string>();
  l.steps.forEach((step: TeachingStep, idx: number) => {
    const stepNum = step.stepNumber || idx + 1;
    const prefix = `Step ${stepNum} (index ${idx})`;

    if (!step.id || typeof step.id !== 'string' || !step.id.trim()) {
      errors.push(`${prefix}: Missing step "id".`);
    } else {
      if (seenStepIds.has(step.id)) {
        errors.push(`${prefix}: Duplicate step id "${step.id}".`);
      }
      seenStepIds.add(step.id);
    }

    if (!step.title || typeof step.title !== 'string' || !step.title.trim()) {
      errors.push(`${prefix}: Missing step "title".`);
    }

    if (typeof step.explanation !== 'string') {
      errors.push(`${prefix}: Step "explanation" must be a string.`);
    }

    if (typeof step.narrationText !== 'string') {
      errors.push(`${prefix}: Step "narrationText" must be a string.`);
    }

    if (!Array.isArray(step.actions)) {
      errors.push(`${prefix}: Step "actions" must be an array.`);
    } else {
      step.actions.forEach((act, actIdx) => validateAction(act, stepNum, actIdx, errors));
    }

    if (step.checkpoint) {
      validateCheckpoint(step.checkpoint, stepNum, errors);
    }

    if (step.takeover) {
      validateTakeover(step.takeover, stepNum, errors);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Asserts that a lesson script is valid, throwing a descriptive LessonValidationError if not.
 */
export function assertValidLessonScript(lesson: unknown): asserts lesson is LessonScript {
  const res = validateLessonScript(lesson);
  if (!res.valid) {
    const id = (lesson as any)?.id || 'unknown';
    throw new LessonValidationError(id, res.errors);
  }
}

// ── Pure Structured Evaluation Utilities ────────────────────────────

/**
 * Evaluates safe structured completion criteria without arbitrary code execution.
 */
export function evaluateCompletionCriteria(
  criterion: TaskCompletionCriterion,
  circuit: CircuitRequest,
  simResult?: CircuitRunResponse | null
): boolean {
  switch (criterion.type) {
    case 'explicit_finish':
      return true;

    case 'circuit_has_gates': {
      const gates = circuit.gates || [];
      if (criterion.minGates !== undefined && gates.length < criterion.minGates) return false;
      if (criterion.maxGates !== undefined && gates.length > criterion.maxGates) return false;
      if (criterion.requiredGates && criterion.requiredGates.length > 0) {
        const remainingGates = gates.map((g) => g.gate.toLowerCase());
        for (const req of criterion.requiredGates) {
          const idx = remainingGates.indexOf(req.toLowerCase());
          if (idx === -1) return false;
          remainingGates.splice(idx, 1);
        }
      }
      if (criterion.targetQubits && criterion.targetQubits.length > 0) {
        const matchingTargets = gates.filter((g) =>
          g.targets.some((t) => criterion.targetQubits!.includes(t))
        );
        if (criterion.minGates !== undefined && matchingTargets.length < criterion.minGates) {
          return false;
        }
      }
      return true;
    }

    case 'circuit_topology': {
      if (circuit.qubits !== criterion.qubits) return false;
      if (criterion.exactGateSequence) {
        const seq = (circuit.gates || []).map((g) => g.gate.toLowerCase());
        if (seq.length !== criterion.exactGateSequence.length) return false;
        for (let i = 0; i < seq.length; i++) {
          if (seq[i] !== criterion.exactGateSequence[i].toLowerCase()) return false;
        }
      }
      return true;
    }

    case 'simulation_probability': {
      const probs = simResult?.simulation?.probabilities || {};
      let p = probs[criterion.state];
      if (p === undefined && simResult?.simulation?.counts) {
        const counts = simResult.simulation.counts;
        const total = Object.values(counts).reduce((acc, c) => acc + c, 0);
        if (total > 0) {
          p = (counts[criterion.state] ?? 0) / total;
        }
      }
      if (p === undefined) return false;
      if (criterion.minProbability !== undefined && p < criterion.minProbability) return false;
      if (criterion.maxProbability !== undefined && p > criterion.maxProbability) return false;
      return true;
    }

    case 'all_of':
      return criterion.criteria.every((c) => evaluateCompletionCriteria(c, circuit, simResult));

    case 'any_of':
      return criterion.criteria.some((c) => evaluateCompletionCriteria(c, circuit, simResult));

    default:
      return true;
  }
}

/**
 * Generates an educational explanation of what criteria failed, why, and what to try next.
 */
export function explainCriteriaFailure(
  criterion: TaskCompletionCriterion,
  circuit: CircuitRequest,
  simResult?: CircuitRunResponse | null
): string | null {
  switch (criterion.type) {
    case 'explicit_finish':
      return null;

    case 'circuit_has_gates': {
      const gates = circuit.gates || [];
      if (criterion.minGates !== undefined && gates.length < criterion.minGates) {
        return `Circuit has ${gates.length} gate(s), but requires at least ${criterion.minGates}. Try adding the necessary gates to the circuit.`;
      }
      if (criterion.maxGates !== undefined && gates.length > criterion.maxGates) {
        return `Circuit has ${gates.length} gates, which exceeds the limit of ${criterion.maxGates}. Try simplifying your circuit.`;
      }
      if (criterion.requiredGates && criterion.requiredGates.length > 0) {
        const remainingGates = gates.map((g) => g.gate.toLowerCase());
        for (const req of criterion.requiredGates) {
          const idx = remainingGates.indexOf(req.toLowerCase());
          if (idx === -1) {
            return `Circuit is missing required gate "${req.toUpperCase()}". Try placing it on wire q[0].`;
          }
          remainingGates.splice(idx, 1);
        }
      }
      return null;
    }

    case 'circuit_topology': {
      if (circuit.qubits !== criterion.qubits) {
        return `Circuit has ${circuit.qubits} qubit(s), but task requires ${criterion.qubits}.`;
      }
      if (criterion.exactGateSequence) {
        const seq = (circuit.gates || []).map((g) => g.gate.toLowerCase());
        const exp = criterion.exactGateSequence.map((g) => g.toLowerCase());
        if (seq.join('-') !== exp.join('-')) {
          return `Gate sequence is [${seq.map((g) => g.toUpperCase()).join(', ')}], but expected [${exp.map((g) => g.toUpperCase()).join(', ')}]. Check gate order and try again.`;
        }
      }
      return null;
    }

    case 'simulation_probability': {
      if (!simResult) {
        return `No simulation results found. Run the simulation to verify your circuit behavior before submitting.`;
      }
      const probs = simResult?.simulation?.probabilities || {};
      let p = probs[criterion.state];
      if (p === undefined && simResult?.simulation?.counts) {
        const counts = simResult.simulation.counts;
        const total = Object.values(counts).reduce((acc, c) => acc + c, 0);
        if (total > 0) {
          p = (counts[criterion.state] ?? 0) / total;
        }
      }
      if (p === undefined) {
        return `Target state |${criterion.state}⟩ was not observed in simulation counts. Check your gates and run simulation again.`;
      }
      if (criterion.minProbability !== undefined && p < criterion.minProbability) {
        return `Your circuit produced P(${criterion.state}) = ${p.toFixed(2)}, but this task requires P(${criterion.state}) ≥ ${criterion.minProbability.toFixed(2)}. Check your gate sequence and run the simulation again.`;
      }
      if (criterion.maxProbability !== undefined && p > criterion.maxProbability) {
        return `Your circuit produced P(${criterion.state}) = ${p.toFixed(2)}, which exceeds the maximum of ${criterion.maxProbability.toFixed(2)}. Check your gate sequence and re-run.`;
      }
      return null;
    }

    case 'all_of': {
      for (const c of criterion.criteria) {
        const failure = explainCriteriaFailure(c, circuit, simResult);
        if (failure) return failure;
      }
      return null;
    }

    case 'any_of': {
      const anyPassed = criterion.criteria.some((c) => evaluateCompletionCriteria(c, circuit, simResult));
      if (!anyPassed) {
        return `None of the accepted target criteria were met. Check task instructions and re-run your simulation.`;
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Evaluates structured prediction comparisons based on empirical simulator outputs.
 */
export function evaluateStructuredComparison(
  selectedIndex: number,
  correctOptionIndex: number,
  config: StructuredPredictionComparison,
  simResult: CircuitRunResponse | null,
  fallbackExplanation: string
): PredictionComparisonResult {
  const isChoiceCorrect = selectedIndex === correctOptionIndex;
  const probs = simResult?.simulation?.probabilities || {};

  let distributionMatch = true;
  if (config.expectedDistribution) {
    for (const [state, range] of Object.entries(config.expectedDistribution)) {
      let p = probs[state];
      if (p === undefined && simResult?.simulation?.counts) {
        const counts = simResult.simulation.counts;
        const total = Object.values(counts).reduce((acc, c) => acc + c, 0);
        if (total > 0) {
          p = (counts[state] ?? 0) / total;
        }
      }
      if (p === undefined || p < range.min || p > range.max) {
        distributionMatch = false;
        break;
      }
    }
  }

  const isMatch = isChoiceCorrect && distributionMatch;
  const userSummary = isMatch
    ? config.matchSummary || 'Your prediction was verified by the quantum simulator!'
    : config.divergenceSummary || 'Your prediction differed from the observed physical distribution.';

  return {
    isMatch,
    userSummary,
    detailedExplanation: fallbackExplanation,
  };
}

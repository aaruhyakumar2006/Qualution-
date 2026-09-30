import type {
  LessonScript,
  TeachingStep,
  TeachingAction,
  TeachingDifficulty,
  PredictionCheckpoint,
  LearnerTakeoverConfig,
} from '../types';
import type { CircuitRequest } from '../../circuit/types';

export interface JsonLessonSegment {
  id: string;
  title?: string;
  explanation?: string;
  narrationText?: string;
  actions: TeachingAction[];
  checkpoint?: PredictionCheckpoint;
  takeover?: LearnerTakeoverConfig;
  autoAdvance?: boolean;
  delayAfterActionsMs?: number;
}

export interface JsonTeachingVideo {
  lessonId: string;
  title: string;
  version: number;
  mode: 'LIVE' | 'STEP';
  initialState: string;
  qubits?: number;
  classicalBits?: number;
  sprint?: number | string;
  difficulty?: TeachingDifficulty;
  estimatedMinutes?: number;
  xpReward?: number;
  learningObjectives?: string[];
  prerequisites?: string[];
  conceptTags?: string[];
  summary?: string;
  completionMessage?: string;
  curriculumModuleId?: string;
  starterCircuit?: CircuitRequest;
  segments: JsonLessonSegment[];
}

export interface JsonLessonValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateJsonTeachingVideo(json: any): JsonLessonValidationResult {
  const errors: string[] = [];

  if (!json || typeof json !== 'object') {
    return { valid: false, errors: ['JSON teaching video must be an object.'] };
  }

  if (!json.lessonId || typeof json.lessonId !== 'string' || !json.lessonId.trim()) {
    errors.push('Missing or invalid "lessonId".');
  }

  if (!json.title || typeof json.title !== 'string' || !json.title.trim()) {
    errors.push('Missing or invalid "title".');
  }

  if (typeof json.version !== 'number' || json.version < 1) {
    errors.push('"version" must be a positive integer >= 1.');
  }

  if (json.mode !== 'LIVE' && json.mode !== 'STEP') {
    errors.push('"mode" must be either "LIVE" or "STEP".');
  }

  if (!Array.isArray(json.segments) || json.segments.length === 0) {
    errors.push('"segments" must be a non-empty array.');
  } else {
    json.segments.forEach((seg: any, idx: number) => {
      const prefix = `Segment ${idx + 1} (${seg?.id || 'unnamed'})`;
      if (!seg || typeof seg !== 'object') {
        errors.push(`${prefix}: Segment must be an object.`);
        return;
      }
      if (!seg.id || typeof seg.id !== 'string') {
        errors.push(`${prefix}: Segment missing "id".`);
      }
      if (!Array.isArray(seg.actions)) {
        errors.push(`${prefix}: Segment "actions" must be an array.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function convertJsonToLessonScript(video: JsonTeachingVideo): LessonScript {
  const validation = validateJsonTeachingVideo(video);
  if (!validation.valid) {
    throw new Error(`Invalid JSON Teaching Video: ${validation.errors.join('; ')}`);
  }

  const steps: TeachingStep[] = video.segments.map((seg, idx) => ({
    id: seg.id,
    stepNumber: idx + 1,
    title: seg.title || `Segment ${idx + 1}`,
    explanation: seg.explanation || '',
    narrationText: seg.narrationText || '',
    actions: seg.actions || [],
    checkpoint: seg.checkpoint,
    takeover: seg.takeover,
    autoAdvance: seg.autoAdvance ?? true,
    delayAfterActionsMs: seg.delayAfterActionsMs,
  }));

  const numQubits = video.qubits ?? (video.initialState ? video.initialState.length : 2);
  const classicalBits = video.classicalBits ?? numQubits;

  return {
    id: video.lessonId,
    title: video.title,
    sprint: video.sprint ?? 2,
    difficulty: video.difficulty ?? 'Advanced',
    estimatedMinutes: video.estimatedMinutes ?? 8,
    xpReward: video.xpReward ?? 300,
    learningObjectives: video.learningObjectives ?? [
      "Understand Grover's quantum search algorithm",
      "Construct Oracle phase marking on target state",
      "Construct Grover Diffuser for amplitude amplification",
      "Observe deterministic measurement collapse",
    ],
    prerequisites: video.prerequisites ?? ['Hadamard Superposition', 'Phase Kickback'],
    conceptTags: video.conceptTags ?? ["Grover's Algorithm", 'Oracle', 'Diffuser', 'Quantum Search'],
    summary: video.summary ?? video.title,
    completionMessage: video.completionMessage,
    curriculumModuleId: video.curriculumModuleId ?? 'grover-search-module',
    starterCircuit: video.starterCircuit ?? {
      qubits: numQubits,
      classical_bits: classicalBits,
      gates: [],
      measure: true,
      shots: 1000,
    },
    steps,
  };
}

import { describe, it, expect } from 'vitest';
import { analyzeLessonEvidence } from './learnerEvidenceAnalyzer';
import type { LessonEvidence } from './learningEvidence';

describe('learnerEvidenceAnalyzer (Phase 16)', () => {
  it('returns NOT_ATTEMPTED when no evidence is present', () => {
    const emptyEvidence: LessonEvidence = {
      lessonId: 'qubit-superposition',
      concept: 'superposition',
      evidence: {},
      conceptStatus: 'NOT_ATTEMPTED',
    };

    const result = analyzeLessonEvidence(emptyEvidence);
    expect(result.conceptStatus).toBe('NOT_ATTEMPTED');
    expect(result.detectedMisconceptions).toHaveLength(0);
    expect(result.remediationFeedback).toBeUndefined();
  });

  it('classifies Golden Understanding scenario as UNDERSTOOD with 0 misconceptions', () => {
    const understandingEvidence: LessonEvidence = {
      lessonId: 'qubit-superposition-checkpoint',
      concept: 'superposition',
      evidence: {
        prediction: {
          checkpointId: 'measure-plus',
          selectedAnswer: 'c', // '50% 0 and 50% 1'
          correct: true,
          explanation: 'Equal superposition produces 50/50 probability.',
        },
        experiment: {
          completed: true,
          shots: 1000,
          counts: { '0': 503, '1': 497 },
          probabilities: { '0': 0.503, '1': 0.497 },
        },
        assessment: {
          assessmentId: 'superposition-final',
          selectedAnswer: 'c', // 'Approximately equal numbers of 0 and 1'
          correct: true,
          explanation: 'Hadamard creates an equal superposition.',
        },
      },
      conceptStatus: 'UNDERSTOOD',
    };

    const result = analyzeLessonEvidence(understandingEvidence);
    expect(result.conceptStatus).toBe('UNDERSTOOD');
    expect(result.detectedMisconceptions).toHaveLength(0);
    expect(result.remediationFeedback).toBeUndefined();
    expect(result.evidenceSummary.predictionCorrect).toBe(true);
    expect(result.evidenceSummary.assessmentCorrect).toBe(true);
  });

  it('classifies Golden Misconception scenario as NEEDS_REINFORCEMENT with SUPPORTED confidence', () => {
    const misconceptionEvidence: LessonEvidence = {
      lessonId: 'qubit-superposition-checkpoint',
      concept: 'superposition',
      evidence: {
        prediction: {
          checkpointId: 'measure-plus',
          selectedAnswer: 'a', // 'Always 0'
          correct: false,
          explanation: 'Expect always 0.',
        },
        experiment: {
          completed: true,
          shots: 1000,
          counts: { '0': 495, '1': 505 },
        },
        assessment: {
          assessmentId: 'superposition-final',
          selectedAnswer: 'a', // 'Always 0'
          correct: false,
          explanation: 'Expect always 0.',
        },
      },
      conceptStatus: 'ATTEMPTED',
    };

    const result = analyzeLessonEvidence(misconceptionEvidence);
    expect(result.conceptStatus).toBe('NEEDS_REINFORCEMENT');
    expect(result.detectedMisconceptions.length).toBeGreaterThanOrEqual(1);

    const match = result.detectedMisconceptions.find(
      (m) => m.misconceptionId === 'measurement-deterministic'
    );
    expect(match).toBeDefined();
    expect(match?.confidence).toBe('SUPPORTED');
    expect(match?.evidence).toHaveLength(2);
    expect(result.remediationFeedback).toContain('measuring a quantum superposition state');
  });

  it('does NOT over-diagnose on a single isolated mistake when final assessment is correct', () => {
    const singleErrorEvidence: LessonEvidence = {
      lessonId: 'qubit-superposition-checkpoint',
      concept: 'superposition',
      evidence: {
        prediction: {
          checkpointId: 'measure-plus',
          selectedAnswer: 'a', // Single initial error
          correct: false,
        },
        experiment: {
          completed: true,
        },
        assessment: {
          assessmentId: 'superposition-final',
          selectedAnswer: 'c', // Correct in final assessment
          correct: true,
        },
      },
      conceptStatus: 'UNDERSTOOD',
    };

    const result = analyzeLessonEvidence(singleErrorEvidence);
    expect(result.conceptStatus).toBe('UNDERSTOOD');
    // Must NOT classify as NEEDS_REINFORCEMENT
    expect(result.detectedMisconceptions).toHaveLength(0);
  });

  it('classifies unpatterned assessment error as ATTEMPTED', () => {
    const genericMistakeEvidence: LessonEvidence = {
      lessonId: 'qubit-superposition-checkpoint',
      concept: 'superposition',
      evidence: {
        prediction: {
          checkpointId: 'measure-plus',
          selectedAnswer: 'c',
          correct: true,
        },
        experiment: {
          completed: true,
        },
        assessment: {
          assessmentId: 'superposition-final',
          selectedAnswer: 'd', // 'Measurement cannot occur'
          correct: false,
        },
      },
      conceptStatus: 'ATTEMPTED',
    };

    const result = analyzeLessonEvidence(genericMistakeEvidence);
    expect(result.conceptStatus).toBe('ATTEMPTED');
  });

  it('does not infer misconception from empirical shot statistical fluctuation', () => {
    const fluctuatingEvidence: LessonEvidence = {
      lessonId: 'qubit-superposition-checkpoint',
      concept: 'superposition',
      evidence: {
        prediction: {
          checkpointId: 'measure-plus',
          selectedAnswer: 'c',
          correct: true,
        },
        experiment: {
          completed: true,
          shots: 500,
          counts: { '0': 241, '1': 259 }, // 48.2% / 51.8%
          probabilities: { '0': 0.482, '1': 0.518 },
        },
        assessment: {
          assessmentId: 'superposition-final',
          selectedAnswer: 'c',
          correct: true,
        },
      },
      conceptStatus: 'UNDERSTOOD',
    };

    const result = analyzeLessonEvidence(fluctuatingEvidence);
    expect(result.conceptStatus).toBe('UNDERSTOOD');
    expect(result.detectedMisconceptions).toHaveLength(0);
  });
});

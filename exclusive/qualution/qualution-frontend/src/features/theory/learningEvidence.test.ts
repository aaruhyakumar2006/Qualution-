import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveLessonEvidence,
  getLessonEvidence,
  getConceptMastery,
  setConceptMastery,
  clearLearningEvidence,
  type LessonEvidence,
} from './learningEvidence';

describe('learningEvidence (Phase 15)', () => {
  beforeEach(() => {
    clearLearningEvidence();
  });

  it('defaults concept mastery to NOT_ATTEMPTED', () => {
    expect(getConceptMastery('superposition')).toBe('NOT_ATTEMPTED');
  });

  it('updates and retrieves concept mastery state correctly', () => {
    setConceptMastery('superposition', 'ATTEMPTED');
    expect(getConceptMastery('superposition')).toBe('ATTEMPTED');

    setConceptMastery('superposition', 'UNDERSTOOD');
    expect(getConceptMastery('superposition')).toBe('UNDERSTOOD');
  });

  it('saves and retrieves structured lesson evidence with prediction, experiment, and assessment', () => {
    const evidence: LessonEvidence = {
      lessonId: 'qubit-superposition-checkpoint',
      concept: 'superposition',
      evidence: {
        prediction: {
          checkpointId: 'measure-plus',
          selectedAnswer: 'c',
          correct: true,
          explanation: '50% 0 and 50% 1',
        },
        experiment: {
          completed: true,
          shots: 1000,
          counts: { '0': 503, '1': 497 },
        },
        assessment: {
          assessmentId: 'superposition-final',
          selectedAnswer: 'c',
          correct: true,
          explanation: 'Equal superposition produces equal frequencies.',
        },
      },
      conceptStatus: 'UNDERSTOOD',
    };

    saveLessonEvidence(evidence);

    const retrieved = getLessonEvidence('qubit-superposition-checkpoint');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.lessonId).toBe('qubit-superposition-checkpoint');
    expect(retrieved?.concept).toBe('superposition');
    expect(retrieved?.conceptStatus).toBe('UNDERSTOOD');
    expect(retrieved?.evidence.prediction?.correct).toBe(true);
    expect(retrieved?.evidence.experiment?.completed).toBe(true);
    expect(retrieved?.evidence.assessment?.correct).toBe(true);

    // Also verify concept mastery was synchronized
    expect(getConceptMastery('superposition')).toBe('UNDERSTOOD');
  });

  it('handles multiple lessons independently', () => {
    const ev1: LessonEvidence = {
      lessonId: 'lesson-1',
      concept: 'superposition',
      evidence: { assessment: { assessmentId: 'q1', selectedAnswer: 'a', correct: true } },
      conceptStatus: 'UNDERSTOOD',
    };
    const ev2: LessonEvidence = {
      lessonId: 'lesson-2',
      concept: 'entanglement',
      evidence: { assessment: { assessmentId: 'q2', selectedAnswer: 'b', correct: false } },
      conceptStatus: 'ATTEMPTED',
    };

    saveLessonEvidence(ev1);
    saveLessonEvidence(ev2);

    expect(getLessonEvidence('lesson-1')?.conceptStatus).toBe('UNDERSTOOD');
    expect(getLessonEvidence('lesson-2')?.conceptStatus).toBe('ATTEMPTED');
    expect(getConceptMastery('superposition')).toBe('UNDERSTOOD');
    expect(getConceptMastery('entanglement')).toBe('ATTEMPTED');
  });
});

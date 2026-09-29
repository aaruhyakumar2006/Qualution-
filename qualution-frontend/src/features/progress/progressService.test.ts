import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressService } from './progressService';
import {
  LocalStorageProgressRepository,
  createInitialProgress,
} from './progressRepository';
import type { ProgressRepository } from './progressRepository';
import type { LearningProgress } from './progressTypes';

class MemoryProgressRepository implements ProgressRepository {
  private state: LearningProgress;

  constructor() {
    this.state = createInitialProgress();
  }

  public loadProgress(): LearningProgress {
    return JSON.parse(JSON.stringify(this.state));
  }

  public saveProgress(progress: LearningProgress): void {
    this.state = JSON.parse(JSON.stringify(progress));
  }

  public resetProgress(): LearningProgress {
    this.state = createInitialProgress();
    return JSON.parse(JSON.stringify(this.state));
  }
}

describe('Learner Progress Domain & Service (Step 24)', () => {
  let memoryRepo: MemoryProgressRepository;
  let service: ProgressService;

  beforeEach(() => {
    memoryRepo = new MemoryProgressRepository();
    service = new ProgressService(memoryRepo);
  });

  it('initializes default learner profile with level and zeroed scores', () => {
    const profile = service.getLearnerProfile();
    expect(profile.id).toBe('learner-local-001');
    expect(profile.displayName).toBe('Quantum Explorer');
    expect(profile.currentLevel).toBe('beginner');
    expect(profile.overallProgress).toBe(0.0);
    expect(profile.lessonsCompleted).toBe(0);
    expect(profile.currentStreak).toBe(1);
  });

  it('updates profile display name and learning level', () => {
    const updated = service.updateLearnerProfile({
      displayName: 'Dr. Quantum',
      currentLevel: 'advanced',
    });

    expect(updated.displayName).toBe('Dr. Quantum');
    expect(updated.currentLevel).toBe('advanced');

    const loaded = service.getLearnerProfile();
    expect(loaded.displayName).toBe('Dr. Quantum');
    expect(loaded.currentLevel).toBe('advanced');
  });

  it('calculates deterministic mastery score and clamps correctly', () => {
    // 0 attempts -> 0
    expect(service.calculateMastery(0, 0).score).toBe(0.0);

    // 1 attempt, 1 correct -> 0.75 * 1.0 + 0.25 * 0.2 = 0.80
    const m1 = service.calculateMastery(1, 1);
    expect(m1.score).toBe(0.80);

    // 5 attempts, 5 correct -> 0.75 * 1.0 + 0.25 * 1.0 = 1.00
    const m5 = service.calculateMastery(5, 5);
    expect(m5.score).toBe(1.0);

    // 10 attempts, 5 correct (50% accuracy) -> 0.75 * 0.5 + 0.25 * 1.0 = 0.625
    const m10 = service.calculateMastery(10, 5);
    expect(m10.score).toBe(0.625);
  });

  it('records concept attempts and promotes status (learning -> practiced -> mastered)', () => {
    // 1st correct attempt on Hadamard
    const r1 = service.recordConceptAttempt('hadamard', true, 'quiz', 10);
    expect(r1.attempts).toBe(1);
    expect(r1.correctAttempts).toBe(1);
    expect(r1.status).toBe('learning'); // needs >=2 for practiced, >=3 for mastered

    // 2nd correct attempt
    const r2 = service.recordConceptAttempt('hadamard', true, 'quiz', 10);
    expect(r2.attempts).toBe(2);
    expect(r2.status).toBe('practiced');

    // 3rd correct attempt
    const r3 = service.recordConceptAttempt('hadamard', true, 'quiz', 10);
    expect(r3.attempts).toBe(3);
    expect(r3.masteryScore).toBeGreaterThanOrEqual(0.85);
    expect(r3.status).toBe('mastered');

    // Overall progress increased
    const profile = service.getLearnerProfile();
    expect(profile.overallProgress).toBeGreaterThan(0.0);
    expect(profile.assessmentsCompleted).toBe(3);
  });

  it('records generic learning activities', () => {
    const act = service.recordActivity('lesson', ['superposition'], 45, 'Completed Superposition Lesson', 1.0);
    expect(act.type).toBe('lesson');
    expect(act.durationSeconds).toBe(45);

    const progress = service.getProgress();
    expect(progress.recentActivities.length).toBe(1);
    expect(progress.learner.lessonsCompleted).toBe(1);
    expect(progress.learner.totalLearningTime).toBe(45);
  });

  it('computes learning statistics with strongest and weakest concepts', () => {
    service.recordConceptAttempt('hadamard', true, 'quiz');
    service.recordConceptAttempt('hadamard', true, 'quiz');
    service.recordConceptAttempt('hadamard', true, 'quiz');

    service.recordConceptAttempt('pauli_x', false, 'quiz');

    const stats = service.getLearningStatistics();
    expect(stats.masteredCount).toBe(1);
    expect(stats.totalActivitiesCount).toBe(4);
    expect(stats.strongestConcepts[0]?.conceptId).toBe('hadamard');
    expect(stats.weakestConcepts.length).toBeGreaterThan(0);
  });

  it('resets progress cleanly to initial state', () => {
    service.recordConceptAttempt('hadamard', true, 'quiz');
    service.updateLearnerProfile({ displayName: 'Temp User' });

    const reset = service.resetProgress();
    expect(reset.learner.displayName).toBe('Quantum Explorer');
    expect(reset.learner.overallProgress).toBe(0.0);
    expect(reset.recentActivities.length).toBe(0);
  });

  it('LocalStorageProgressRepository recovers from corrupted JSON safely', () => {
    const mockStorage: Record<string, string> = {};
    const repo = new LocalStorageProgressRepository('test_key');
    // Save corrupted JSON
    mockStorage['test_key'] = 'CORRUPTED_JSON_NOT_VALID';

    // loadProgress should handle safely without throwing
    const loaded = repo.loadProgress();
    expect(loaded.learner.id).toBe('learner-local-001');
    expect(loaded.conceptMastery.hadamard).toBeDefined();
  });
});

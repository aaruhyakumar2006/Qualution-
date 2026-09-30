import type {
  LearnerProfile,
  ConceptMastery,
  LearningActivity,
  LearningProgress,
  LearningStatistics,
  ActivityType,
} from './progressTypes';
import { CANONICAL_CONCEPTS, CONCEPTS_BY_ID } from './conceptRegistry';
import { progressRepository, type ProgressRepository } from './progressRepository';

export class ProgressService {
  private repo: ProgressRepository;

  constructor(repo: ProgressRepository = progressRepository) {
    this.repo = repo;
  }

  public getProgress(): LearningProgress {
    return this.repo.loadProgress();
  }

  public getLearnerProfile(): LearnerProfile {
    return this.getProgress().learner;
  }

  public updateLearnerProfile(updates: Partial<Pick<LearnerProfile, 'displayName' | 'currentLevel'>>): LearnerProfile {
    const progress = this.getProgress();
    progress.learner = {
      ...progress.learner,
      ...updates,
      lastActiveAt: Date.now(),
    };
    this.repo.saveProgress(progress);
    return progress.learner;
  }

  /**
   * Mastery calculation formula:
   * accuracy = correctAttempts / attempts
   * confidence = min(1.0, attempts / 5)
   * recencyFactor = 1.0 (recent attempt)
   * rawMastery = (0.75 * accuracy) + (0.25 * confidence)
   * clamped to [0.0, 1.0]
   */
  public calculateMastery(attempts: number, correctAttempts: number): { score: number; confidence: number } {
    if (attempts <= 0) {
      return { score: 0.0, confidence: 0.0 };
    }
    const accuracy = Math.max(0.0, Math.min(1.0, correctAttempts / attempts));
    const confidence = Math.max(0.0, Math.min(1.0, attempts / 5));
    const raw = 0.75 * accuracy + 0.25 * confidence;
    const clamped = Math.max(0.0, Math.min(1.0, Number(raw.toFixed(4))));
    return { score: clamped, confidence };
  }

  public recordConceptAttempt(
    conceptId: string,
    isCorrect: boolean,
    activityType: ActivityType = 'quiz',
    durationSeconds = 15
  ): ConceptMastery {
    const progress = this.getProgress();
    const existing = progress.conceptMastery[conceptId] || {
      conceptId,
      conceptName: CONCEPTS_BY_ID[conceptId]?.name ?? conceptId,
      category: CONCEPTS_BY_ID[conceptId]?.category ?? 'foundations',
      masteryScore: 0.0,
      attempts: 0,
      correctAttempts: 0,
      lastAttemptAt: null,
      confidence: 0.0,
      status: 'learning',
    };

    const newAttempts = existing.attempts + 1;
    const newCorrect = existing.correctAttempts + (isCorrect ? 1 : 0);
    const { score, confidence } = this.calculateMastery(newAttempts, newCorrect);

    let status: ConceptMastery['status'] = existing.status;
    if (score >= 0.85 && newAttempts >= 3) {
      status = 'mastered';
    } else if (score >= 0.5 && newAttempts >= 2) {
      status = 'practiced';
    } else {
      status = 'learning';
    }

    const updatedMastery: ConceptMastery = {
      ...existing,
      attempts: newAttempts,
      correctAttempts: newCorrect,
      masteryScore: score,
      confidence,
      lastAttemptAt: Date.now(),
      status,
    };

    progress.conceptMastery[conceptId] = updatedMastery;

    // Check unlocking prerequisites for other concepts
    this.checkAndUnlockPrerequisites(progress);

    // Record activity
    const activity: LearningActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      learnerId: progress.learner.id,
      type: activityType,
      timestamp: Date.now(),
      durationSeconds,
      conceptIds: [conceptId],
      score: isCorrect ? 1.0 : 0.0,
      title: `${isCorrect ? 'Completed' : 'Attempted'} ${updatedMastery.conceptName}`,
    };

    progress.recentActivities = [activity, ...progress.recentActivities.slice(0, 49)];
    progress.learner.totalLearningTime += durationSeconds;
    progress.learner.lastActiveAt = Date.now();
    if (activityType === 'quiz') {
      progress.learner.assessmentsCompleted += 1;
    }

    // Recalculate overall progress
    progress.learner.overallProgress = this.calculateOverallProgress(progress.conceptMastery);

    this.repo.saveProgress(progress);
    return updatedMastery;
  }

  public recordActivity(
    type: ActivityType,
    conceptIds: string[],
    durationSeconds: number,
    title: string,
    score: number | null = null,
    metadata?: Record<string, string | number | boolean | null>
  ): LearningActivity {
    const progress = this.getProgress();

    const activity: LearningActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      learnerId: progress.learner.id,
      type,
      timestamp: Date.now(),
      durationSeconds,
      conceptIds,
      score,
      title,
      metadata,
    };

    progress.recentActivities = [activity, ...progress.recentActivities.slice(0, 49)];
    progress.learner.totalLearningTime += durationSeconds;
    progress.learner.lastActiveAt = Date.now();

    if (type === 'lesson') {
      progress.learner.lessonsCompleted += 1;
    } else if (type === 'coding_challenge') {
      progress.learner.challengesCompleted += 1;
    } else if (type === 'assessment' || type === 'quiz') {
      progress.learner.assessmentsCompleted += 1;
    }

    this.repo.saveProgress(progress);
    return activity;
  }

  private checkAndUnlockPrerequisites(progress: LearningProgress): void {
    for (const c of CANONICAL_CONCEPTS) {
      const current = progress.conceptMastery[c.id];
      if (current && current.status === 'locked' && c.prerequisites.length > 0) {
        const allPrereqsMet = c.prerequisites.every((pId) => {
          const prereqMastery = progress.conceptMastery[pId];
          return prereqMastery && prereqMastery.masteryScore >= 0.5;
        });

        if (allPrereqsMet) {
          progress.conceptMastery[c.id].status = 'learning';
        }
      }
    }
  }

  public calculateOverallProgress(masteryMap: Record<string, ConceptMastery>): number {
    const values = Object.values(masteryMap);
    if (values.length === 0) return 0.0;
    const totalScore = values.reduce((sum, m) => sum + m.masteryScore, 0);
    return Number((totalScore / values.length).toFixed(4));
  }

  public getLearningStatistics(): LearningStatistics {
    const progress = this.getProgress();
    const masteryList = Object.values(progress.conceptMastery);

    const masteredCount = masteryList.filter((m) => m.status === 'mastered').length;
    const practicedCount = masteryList.filter((m) => m.status === 'practiced').length;
    const learningCount = masteryList.filter((m) => m.status === 'learning').length;
    const lockedCount = masteryList.filter((m) => m.status === 'locked').length;

    const totalScore = masteryList.reduce((sum, m) => sum + m.masteryScore, 0);
    const averageMasteryScore = masteryList.length > 0 ? Number((totalScore / masteryList.length).toFixed(3)) : 0;

    const sortedByMastery = [...masteryList].sort((a, b) => b.masteryScore - a.masteryScore);
    const strongestConcepts = sortedByMastery.filter((m) => m.attempts > 0).slice(0, 4);

    const sortedAsc = [...masteryList].sort((a, b) => a.masteryScore - b.masteryScore);
    const weakestConcepts = sortedAsc.filter((m) => m.status !== 'locked').slice(0, 4);

    return {
      totalConcepts: masteryList.length,
      masteredCount,
      practicedCount,
      learningCount,
      lockedCount,
      averageMasteryScore,
      totalActivitiesCount: progress.recentActivities.length,
      totalTimeMinutes: Math.round(progress.learner.totalLearningTime / 60),
      strongestConcepts,
      weakestConcepts,
    };
  }

  public resetProgress(): LearningProgress {
    return this.repo.resetProgress();
  }
}

export const progressService = new ProgressService();

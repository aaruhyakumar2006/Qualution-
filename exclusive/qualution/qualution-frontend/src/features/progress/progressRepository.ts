import type {
  LearnerProfile,
  ConceptMastery,
  LearningProgress,
} from './progressTypes';
import { CANONICAL_CONCEPTS } from './conceptRegistry';

export const PROGRESS_SCHEMA_VERSION = 1;
export const LOCAL_STORAGE_PROGRESS_KEY = `qualution_progress_v${PROGRESS_SCHEMA_VERSION}`;
export const DEFAULT_LEARNER_ID = 'learner-local-001';

export function createDefaultProfile(): LearnerProfile {
  const now = Date.now();
  return {
    id: DEFAULT_LEARNER_ID,
    displayName: 'Quantum Explorer',
    createdAt: now,
    lastActiveAt: now,
    currentLevel: 'beginner',
    overallProgress: 0.0,
    totalLearningTime: 0,
    lessonsCompleted: 0,
    challengesCompleted: 0,
    assessmentsCompleted: 0,
    currentStreak: 1,
    longestStreak: 1,
  };
}

export function createInitialConceptMastery(): Record<string, ConceptMastery> {
  const mastery: Record<string, ConceptMastery> = {};
  for (const c of CANONICAL_CONCEPTS) {
    mastery[c.id] = {
      conceptId: c.id,
      conceptName: c.name,
      category: c.category,
      masteryScore: 0.0,
      attempts: 0,
      correctAttempts: 0,
      lastAttemptAt: null,
      confidence: 0.0,
      status: c.prerequisites.length === 0 ? 'learning' : 'locked',
    };
  }
  return mastery;
}

export function createInitialProgress(): LearningProgress {
  return {
    learner: createDefaultProfile(),
    conceptMastery: createInitialConceptMastery(),
    recentActivities: [],
  };
}

export interface ProgressRepository {
  loadProgress(): LearningProgress;
  saveProgress(progress: LearningProgress): void;
  resetProgress(): LearningProgress;
}

export class LocalStorageProgressRepository implements ProgressRepository {
  private key: string;

  constructor(key: string = LOCAL_STORAGE_PROGRESS_KEY) {
    this.key = key;
  }

  public loadProgress(): LearningProgress {
    if (typeof window === 'undefined' || !window.localStorage) {
      return createInitialProgress();
    }

    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) {
        const initial = createInitialProgress();
        this.saveProgress(initial);
        return initial;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.learner || !parsed.conceptMastery) {
        console.warn('Invalid learner progress schema in localStorage. Reinitializing safe default.');
        const initial = createInitialProgress();
        this.saveProgress(initial);
        return initial;
      }

      // Ensure all canonical concepts exist even if registry expanded
      const initialMastery = createInitialConceptMastery();
      const mergedMastery: Record<string, ConceptMastery> = {
        ...initialMastery,
        ...(parsed.conceptMastery || {}),
      };

      return {
        learner: {
          ...createDefaultProfile(),
          ...parsed.learner,
        },
        conceptMastery: mergedMastery,
        recentActivities: Array.isArray(parsed.recentActivities) ? parsed.recentActivities : [],
      };
    } catch (err) {
      console.warn('Failed to parse localStorage progress payload:', err);
      const fallback = createInitialProgress();
      this.saveProgress(fallback);
      return fallback;
    }
  }

  public saveProgress(progress: LearningProgress): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      window.localStorage.setItem(this.key, JSON.stringify(progress));
    } catch (err) {
      console.warn('Failed to write progress to localStorage:', err);
    }
  }

  public resetProgress(): LearningProgress {
    const initial = createInitialProgress();
    this.saveProgress(initial);
    return initial;
  }
}

export const progressRepository: ProgressRepository = new LocalStorageProgressRepository();

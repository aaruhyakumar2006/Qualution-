export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

export type ConceptCategory =
  | 'foundations'
  | 'gates'
  | 'core_concepts'
  | 'circuits'
  | 'algorithms';

export type MasteryStatus = 'locked' | 'learning' | 'practiced' | 'mastered';

export type ActivityType =
  | 'lesson'
  | 'quiz'
  | 'coding_challenge'
  | 'circuit_exercise'
  | 'simulation'
  | 'tutor_session'
  | 'assessment';

export interface ConceptDefinition {
  id: string;
  name: string;
  category: ConceptCategory;
  prerequisites: string[];
  description: string;
}

export interface ConceptMastery {
  conceptId: string;
  conceptName: string;
  category: ConceptCategory;
  masteryScore: number; // [0.0, 1.0]
  attempts: number;
  correctAttempts: number;
  lastAttemptAt: number | null; // unix timestamp in ms
  confidence: number; // [0.0, 1.0] based on volume & consistency
  status: MasteryStatus;
}

export interface LearningActivity {
  id: string;
  learnerId: string;
  type: ActivityType;
  timestamp: number; // unix timestamp in ms
  durationSeconds: number;
  conceptIds: string[];
  score: number | null; // [0.0, 1.0] or null if completion-based
  title?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface LearnerProfile {
  id: string;
  displayName: string;
  createdAt: number;
  lastActiveAt: number;
  currentLevel: LearningLevel;
  overallProgress: number; // [0.0, 1.0]
  totalLearningTime: number; // in seconds
  lessonsCompleted: number;
  challengesCompleted: number;
  assessmentsCompleted: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LearningProgress {
  learner: LearnerProfile;
  conceptMastery: Record<string, ConceptMastery>;
  recentActivities: LearningActivity[];
}

export interface LearningStatistics {
  totalConcepts: number;
  masteredCount: number;
  practicedCount: number;
  learningCount: number;
  lockedCount: number;
  averageMasteryScore: number;
  totalActivitiesCount: number;
  totalTimeMinutes: number;
  strongestConcepts: ConceptMastery[];
  weakestConcepts: ConceptMastery[];
}

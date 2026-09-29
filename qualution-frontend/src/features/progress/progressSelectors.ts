import type { ConceptMastery, LearningProgress } from './progressTypes';

export function selectConceptMasteryByCategory(
  progress: LearningProgress,
  category: string
): ConceptMastery[] {
  return Object.values(progress.conceptMastery).filter((c) => c.category === category);
}

export function selectRecentActivities(progress: LearningProgress, limit = 10) {
  return progress.recentActivities.slice(0, limit);
}

export function selectMasterySummary(progress: LearningProgress) {
  const list = Object.values(progress.conceptMastery);
  return {
    total: list.length,
    mastered: list.filter((m) => m.status === 'mastered').length,
    practiced: list.filter((m) => m.status === 'practiced').length,
    learning: list.filter((m) => m.status === 'learning').length,
    locked: list.filter((m) => m.status === 'locked').length,
  };
}

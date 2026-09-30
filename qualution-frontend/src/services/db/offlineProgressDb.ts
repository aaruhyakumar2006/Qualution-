/**
 * offlineProgressDb.ts
 *
 * Dexie.js-backed IndexedDB persistence for offline learning progress.
 * Stores completed steps, prediction answers, timestamps, and scores per lesson.
 * Operates 100% offline with zero network connectivity requirements.
 */

import Dexie, { type Table } from 'dexie';

export interface TheoryHandoffPayload {
  sourceLessonId: string;
  beatsSeen: string[];
  watchedToEnd: boolean;
  completedAt: number;
  returnPath: string;
}

export interface LessonProgressEntry {
  lessonId: string; // e.g. "lesson-8-grovers-search" or "initialize-measure"
  completedStepIndices: number[];
  predictionAnswers: Record<string, any>;
  lastActiveStepIndex: number;
  isCompleted: boolean;
  score?: number;
  totalTimeSpentMs?: number;
  updatedAt: number;
  /** Phase 3 Continuity Contract: Theory -> Lab payload */
  theoryHandoff?: TheoryHandoffPayload;
}

export class QualutionOfflineDb extends Dexie {
  lessonProgress!: Table<LessonProgressEntry, string>;

  constructor() {
    super('QualutionOfflineDB');
    this.version(1).stores({
      lessonProgress: 'lessonId, updatedAt, isCompleted',
    });
  }
}

export const offlineProgressDb = new QualutionOfflineDb();

/**
 * Persists learner progress for a specific lesson to Dexie IndexedDB.
 */
export async function saveOfflineLessonProgress(
  lessonId: string,
  progress: Partial<Omit<LessonProgressEntry, 'lessonId' | 'updatedAt'>>
): Promise<LessonProgressEntry> {
  const existing = await offlineProgressDb.lessonProgress.get(lessonId);
  const updated: LessonProgressEntry = {
    lessonId,
    completedStepIndices: progress.completedStepIndices
      ? Array.from(new Set([...(existing?.completedStepIndices || []), ...progress.completedStepIndices]))
      : (existing?.completedStepIndices ?? []),
    predictionAnswers: { ...(existing?.predictionAnswers || {}), ...(progress.predictionAnswers || {}) },
    lastActiveStepIndex: progress.lastActiveStepIndex ?? existing?.lastActiveStepIndex ?? 0,
    isCompleted: progress.isCompleted ?? existing?.isCompleted ?? false,
    score: progress.score ?? existing?.score,
    totalTimeSpentMs: (existing?.totalTimeSpentMs || 0) + (progress.totalTimeSpentMs || 0),
    theoryHandoff: progress.theoryHandoff ?? existing?.theoryHandoff,
    updatedAt: Date.now(),
  };

  await offlineProgressDb.lessonProgress.put(updated);
  return updated;
}

/**
 * Saves Phase 3 Continuity Contract theory handoff payload to Dexie.
 */
export async function saveTheoryHandoffPayload(
  lessonId: string,
  payload: TheoryHandoffPayload
): Promise<LessonProgressEntry> {
  return saveOfflineLessonProgress(lessonId, { theoryHandoff: payload });
}

/**
 * Retrieves Phase 3 Continuity Contract theory handoff payload from Dexie.
 */
export async function getTheoryHandoffPayload(
  lessonId: string
): Promise<TheoryHandoffPayload | undefined> {
  const entry = await offlineProgressDb.lessonProgress.get(lessonId);
  return entry?.theoryHandoff;
}

/**
 * Retrieves learner progress for a specific lesson from Dexie IndexedDB.
 */
export async function getOfflineLessonProgress(
  lessonId: string
): Promise<LessonProgressEntry | undefined> {
  return offlineProgressDb.lessonProgress.get(lessonId);
}

/**
 * Retrieves all stored lesson progress entries.
 */
export async function getAllOfflineLessonProgress(): Promise<LessonProgressEntry[]> {
  return offlineProgressDb.lessonProgress.toArray();
}

/**
 * Clears lesson progress (single lesson or all).
 */
export async function clearOfflineLessonProgress(lessonId?: string): Promise<void> {
  if (lessonId) {
    await offlineProgressDb.lessonProgress.delete(lessonId);
  } else {
    await offlineProgressDb.lessonProgress.clear();
  }
}

import type { TeachingEvent } from './types';
import { progressService } from '../progress/progressService';
import { markLessonCompleted } from '../learning/assessmentEngine';

export type TeachingEventListener = (event: TeachingEvent) => void;

const listeners: Set<TeachingEventListener> = new Set();

/**
 * Emits a structured teaching event, notifying active listeners,
 * dispatching a global browser event for external observers or future 3D layers,
 * and safely updating learner progress via the existing progress architecture.
 */
export function emitTeachingEvent(event: TeachingEvent): void {
  // 1. Notify direct controller / service listeners
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // Isolate listener errors
    }
  });

  // 2. Dispatch custom DOM event (consumed by analytics, audio, or future 3D QUALUTION avatar)
  if (typeof window !== 'undefined') {
    try {
      const domEvent = new CustomEvent<TeachingEvent>('qualution:teaching-event', {
        detail: event,
      });
      window.dispatchEvent(domEvent);
    } catch {
      // Ignore in non-DOM environments
    }
  }

  // 3. Seamlessly integrate with existing ProgressService and Assessment tracking (lesson-agnostic)
  try {
    if (event.type === 'prediction_submitted' && event.metadata) {
      const isCorrect = Boolean(event.metadata.isCorrect);
      const conceptId = String(event.metadata.conceptId || event.metadata.concept || 'quantum');
      progressService.recordConceptAttempt(conceptId, isCorrect, 'simulation', 20);
    } else if (event.type === 'lesson_completed') {
      const xp = Number(event.metadata?.xpReward ?? 100);
      markLessonCompleted(event.lessonId, xp);

      // If this practical lesson maps to a curriculum module, also sync completion to the module
      const curriculumId = event.metadata?.curriculumModuleId as string | undefined;
      if (curriculumId) {
        markLessonCompleted(curriculumId, 0);
      }

      const concept = String(event.metadata?.concept || event.metadata?.conceptId || 'quantum');
      progressService.recordConceptAttempt(concept, true, 'simulation', 60);
    }
  } catch {
    // Progress integration is non-blocking
  }
}

/**
 * Subscribes to teaching events. Returns an unsubscribe callback.
 */
export function onTeachingEvent(listener: TeachingEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

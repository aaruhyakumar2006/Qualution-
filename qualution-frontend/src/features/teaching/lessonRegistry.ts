import type { LessonScript } from './types';
import { assertValidLessonScript } from './lessonValidator';
import {
  s1HadamardSuperpositionLesson,
  s1InitializeMeasureLesson,
  s1XGateLesson,
  s1ZPhaseLesson,
  s1GateOrderingLesson,
  s1SingleQubitChallengeLesson,
  s1IntroQuantumInteractiveLesson,
} from './lessons/sprint-01';
import {
  s2BellStateEntanglementLesson,
  s2GroverSearchLesson,
  grover2q11Lesson,
  s2GroverInteractiveLesson,
  lesson8GroversSearchLesson,
} from './lessons/sprint-02';
import { s1AssessmentScript } from './assessments';

export class LessonRegistry {
  private lessons: Map<string, LessonScript> = new Map();

  constructor() {
    this.register(s1InitializeMeasureLesson);
    this.register(s1IntroQuantumInteractiveLesson as unknown as LessonScript);
    this.register(s1XGateLesson);
    this.register(s1HadamardSuperpositionLesson);
    this.register(s1ZPhaseLesson);
    this.register(s1GateOrderingLesson);
    this.register(s1SingleQubitChallengeLesson);
    this.register(s1AssessmentScript);
    this.register(s2BellStateEntanglementLesson);
    this.register(s2GroverSearchLesson);
    this.register(grover2q11Lesson);
    this.register(s2GroverInteractiveLesson as unknown as LessonScript);
    this.register(lesson8GroversSearchLesson);
  }

  /**
   * Registers a lesson after validating its structure and invariants.
   * Throws LessonValidationError if lesson is invalid.
   */
  public register(lesson: LessonScript): void {
    try {
      assertValidLessonScript(lesson);
      this.lessons.set(lesson.id.trim().toLowerCase(), lesson);
    } catch (err: any) {
      console.warn(`[LessonRegistry] Failed to register lesson "${lesson.id}":`, err.message);
    }
  }

  /**
   * Retrieves a lesson by ID (case-insensitive).
   */
  public getLesson(id: string | null | undefined): LessonScript | null {
    if (!id || typeof id !== 'string') {
      return null;
    }
    const cleanId = id.trim().toLowerCase();
    if (this.lessons.has(cleanId)) {
      return this.lessons.get(cleanId)!;
    }
    if (cleanId === 'grover-2q') {
      return this.lessons.get('grover-2q-11') || null;
    }
    if (cleanId === 'grover-algorithm' || cleanId === 'grover') {
      return this.lessons.get('s2-grover-search') || null;
    }
    if (
      cleanId === 'lesson-8-grovers-search' ||
      cleanId === 'lesson-8' ||
      cleanId === 'grover-search' ||
      cleanId === 'grover-live'
    ) {
      return this.lessons.get('lesson-8-grovers-search') || null;
    }
    const match = this.lessons.get(cleanId);
    if (!match) {
      for (const [key, lesson] of this.lessons.entries()) {
        if (key.toLowerCase() === cleanId) {
          return lesson;
        }
      }
      console.warn(`[LessonRegistry] Requested lesson ID not found: "${id}"`);
      return null;
    }
    return match;
  }

  /**
   * Returns all currently registered lessons.
   */
  public getAllLessons(): LessonScript[] {
    return Array.from(this.lessons.values());
  }

  /**
   * Checks if a lesson exists by ID.
   */
  public hasLesson(id: string): boolean {
    return this.getLesson(id) !== null;
  }

  /**
   * Clears the registry (useful for isolated unit testing).
   */
  public clear(): void {
    this.lessons.clear();
  }
}

export const lessonRegistry = new LessonRegistry();
export const getLesson = (id: string | null | undefined): LessonScript | null => lessonRegistry.getLesson(id);
export const getLessonIds = (): string[] => lessonRegistry.getAllLessons().map((l) => l.id);

/**
 * learningEvidence.ts
 *
 * PHASE 15 & PHASE 16: Assessment, Learning Evidence, Concept Mastery & Misconception Tracking.
 *
 * Captures structured learning evidence across the complete pedagogical loop:
 * TEACH → PREDICT → BUILD → RUN → OBSERVE → EXPLAIN → ASSESS → ANALYZE EVIDENCE
 *
 * Persists learner evidence and concept mastery status:
 * - NOT_ATTEMPTED: Learner has not taken the assessment.
 * - ATTEMPTED: Learner interacted with the concept, but evidence is insufficient or mixed.
 * - UNDERSTOOD: Available evidence consistently supports correct conceptual understanding.
 * - NEEDS_REINFORCEMENT: Responses contain evidence consistent with a documented misconception.
 */

export type ConceptMasteryStatus =
  | 'NOT_ATTEMPTED'
  | 'ATTEMPTED'
  | 'UNDERSTOOD'
  | 'NEEDS_REINFORCEMENT';

export interface PredictionEvidence {
  checkpointId: string;
  selectedAnswer: string;
  correct: boolean;
  explanation?: string;
}

export interface ExperimentEvidence {
  completed: boolean;
  shots?: number;
  counts?: Record<string, number>;
  probabilities?: Record<string, number>;
}

export interface AssessmentEvidence {
  assessmentId: string;
  selectedAnswer: string;
  correct: boolean;
  explanation?: string;
}

export interface MisconceptionAnalysis {
  misconceptionId: string;
  concept: string;
  confidence: 'NOT_SUPPORTED' | 'POSSIBLE' | 'SUPPORTED';
  evidence: Array<{
    source: 'checkpoint' | 'experiment' | 'assessment';
    id: string;
    selectedAnswer?: string;
  }>;
  reason: string;
  learnerFeedback: string;
}

export interface LessonEvidence {
  lessonId: string;
  concept: string;
  evidence: {
    prediction?: PredictionEvidence;
    experiment?: ExperimentEvidence;
    assessment?: AssessmentEvidence;
  };
  conceptStatus: ConceptMasteryStatus;
  detectedMisconceptions?: MisconceptionAnalysis[];
  remediationFeedback?: string;
  completedAt?: string;
}

const STORAGE_EVIDENCE_KEY = 'qualution_learning_evidence';
const STORAGE_MASTERY_KEY = 'qualution_concept_mastery';

/**
 * Retrieves all stored lesson evidence objects.
 */
export function getAllEvidence(): Record<string, LessonEvidence> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_EVIDENCE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Retrieves recorded evidence for a specific lesson ID.
 */
export function getLessonEvidence(lessonId: string): LessonEvidence | null {
  const all = getAllEvidence();
  return all[lessonId] || null;
}

/**
 * Saves or updates evidence for a lesson and updates the associated concept mastery status.
 */
export function saveLessonEvidence(evidence: LessonEvidence): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllEvidence();
    all[evidence.lessonId] = {
      ...evidence,
      completedAt: evidence.completedAt || new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_EVIDENCE_KEY, JSON.stringify(all));

    // Update concept mastery map
    if (evidence.concept) {
      setConceptMastery(evidence.concept, evidence.conceptStatus);
    }
  } catch {
    // Gracefully handle storage quota / privacy mode exceptions
  }
}

/**
 * Retrieves the concept mastery state for a given concept name (e.g. 'superposition').
 */
export function getConceptMastery(concept: string): ConceptMasteryStatus {
  if (typeof window === 'undefined') return 'NOT_ATTEMPTED';
  try {
    const raw = localStorage.getItem(STORAGE_MASTERY_KEY);
    const masteryMap: Record<string, ConceptMasteryStatus> = raw ? JSON.parse(raw) : {};
    return masteryMap[concept.toLowerCase()] || 'NOT_ATTEMPTED';
  } catch {
    return 'NOT_ATTEMPTED';
  }
}

/**
 * Sets concept mastery status ('NOT_ATTEMPTED' | 'ATTEMPTED' | 'UNDERSTOOD' | 'NEEDS_REINFORCEMENT').
 */
export function setConceptMastery(concept: string, status: ConceptMasteryStatus): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_MASTERY_KEY);
    const masteryMap: Record<string, ConceptMasteryStatus> = raw ? JSON.parse(raw) : {};
    masteryMap[concept.toLowerCase()] = status;
    localStorage.setItem(STORAGE_MASTERY_KEY, JSON.stringify(masteryMap));
  } catch {
    // Gracefully handle storage exceptions
  }
}

/**
 * Resets all evidence and concept mastery (useful for testing or full progress reset).
 */
export function clearLearningEvidence(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_EVIDENCE_KEY);
    localStorage.removeItem(STORAGE_MASTERY_KEY);
  } catch {
    // Gracefully handle storage exceptions
  }
}

/**
 * Evidence & Misconception API Client
 * 
 * Handles all communication with the misconception engine backend.
 */
import { apiClient } from './client';

// ============================================================================
// TYPES
// ============================================================================

export type EventType =
  | 'QUIZ_ANSWER'
  | 'PREDICTION_ANSWER'
  | 'CIRCUIT_CONSTRUCTION'
  | 'CIRCUIT_MODIFICATION'
  | 'SIMULATION_RUN'
  | 'SIMULATION_INTERPRETATION'
  | 'GATE_PLACEMENT'
  | 'GATE_REMOVAL'
  | 'EXPLANATION_VIEW'
  | 'LESSON_STEP';

export interface LearningEventCreate {
  concept_id: string;
  event_type: EventType;
  lesson_id?: string;
  question_id?: string;
  circuit_id?: string;
  correct?: boolean;
  expected?: Record<string, any>;
  actual?: Record<string, any>;
  context?: Record<string, any>;
}

export interface LearningEventResponse {
  id: string;
  user_id: string;
  concept_id: string;
  event_type: EventType;
  lesson_id?: string;
  question_id?: string;
  circuit_id?: string;
  correct?: boolean;
  expected?: Record<string, any>;
  actual?: Record<string, any>;
  context?: Record<string, any>;
  created_at: string;
}

export interface DetectionResult {
  event_id: string;
  new_detections: Array<{
    misconception_code: string;
    misconception_name: string;
    confidence: number;
    status: string;
    detection_reason: string;
  }>;
  updated_misconceptions: Array<{
    misconception_code: string;
    old_confidence: number;
    new_confidence: number;
    old_status: string;
    new_status: string;
  }>;
  interventions: InterventionRecommendation[];
  requires_immediate_intervention: boolean;
}

export interface InterventionRecommendation {
  misconception_id: string;
  misconception_code: string;
  misconception_name: string;
  concept_id: string;
  intervention_type: 'MICRO_CORRECTION' | 'MINI_REMEDIATION' | 'FULL_REMEDIATION';
  remediation_strategy: 'COMPARE' | 'DEMONSTRATE' | 'VISUALIZE' | 'EXPLAIN' | 'SIMULATE' | 'PRACTICE';
  confidence: number;
  status: string;
  strategy_config: Record<string, any>;
  explanation: string;
  auto_resume: boolean;
}

export interface EvidenceSubmissionRequest {
  event: LearningEventCreate;
  run_detection?: boolean;
}

export interface EvidenceSubmissionResponse {
  event: LearningEventResponse;
  detection_result?: DetectionResult;
}

export interface LearnerMisconceptionSummary {
  misconception_id: string;
  code: string;
  name: string;
  status: string;
  confidence: number;
  severity: number;
  last_detected_at: string;
}

export interface LearnerMisconceptionProfile {
  user_id: string;
  active_misconceptions: LearnerMisconceptionSummary[];
  resolved_misconceptions: LearnerMisconceptionSummary[];
  total_misconceptions_detected: number;
  total_misconceptions_resolved: number;
  total_interventions: number;
  struggling_concepts: Array<{
    concept_id: string;
    concept_name: string;
    misconception_count: number;
  }>;
  mastered_concepts: Array<{
    concept_id: string;
    concept_name: string;
  }>;
}

// ============================================================================
// EVIDENCE SUBMISSION
// ============================================================================

/**
 * Submit a learning event with automatic misconception detection
 */
export async function submitEvidence(
  request: EvidenceSubmissionRequest
): Promise<EvidenceSubmissionResponse> {
  return apiClient<EvidenceSubmissionResponse>('/learning/evidence', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Create a learning event without running detection
 */
export async function createLearningEvent(
  event: LearningEventCreate
): Promise<LearningEventResponse> {
  return apiClient<LearningEventResponse>('/learning/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

// ============================================================================
// MISCONCEPTION QUERIES
// ============================================================================

/**
 * Get complete misconception profile for current user
 */
export async function getLearnerProfile(): Promise<LearnerMisconceptionProfile> {
  return apiClient<LearnerMisconceptionProfile>('/learning/misconceptions/profile');
}

/**
 * Get active misconceptions
 */
export async function getActiveMisconceptions(params?: {
  concept_id?: string;
  min_confidence?: number;
}): Promise<LearnerMisconceptionSummary[]> {
  const queryParams = new URLSearchParams();
  if (params?.concept_id) queryParams.append('concept_id', params.concept_id);
  if (params?.min_confidence !== undefined) queryParams.append('min_confidence', params.min_confidence.toString());
  
  const query = queryParams.toString();
  return apiClient<LearnerMisconceptionSummary[]>(
    `/learning/misconceptions/active${query ? `?${query}` : ''}`
  );
}

/**
 * Get intervention recommendations
 */
export async function getInterventionRecommendations(params?: {
  concept_id?: string;
}): Promise<InterventionRecommendation[]> {
  const queryParams = new URLSearchParams();
  if (params?.concept_id) queryParams.append('concept_id', params.concept_id);
  
  const query = queryParams.toString();
  return apiClient<InterventionRecommendation[]>(
    `/learning/interventions${query ? `?${query}` : ''}`
  );
}

// ============================================================================
// INTERVENTION LIFECYCLE
// ============================================================================

/**
 * Mark intervention as started
 */
export async function startIntervention(misconceptionId: string): Promise<void> {
  await apiClient(`/learning/interventions/${misconceptionId}/start`, {
    method: 'POST',
  });
}

/**
 * Mark intervention as completed
 */
export async function completeIntervention(
  misconceptionId: string,
  masteryAchieved: boolean
): Promise<void> {
  await apiClient(`/learning/interventions/${misconceptionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ mastery_achieved: masteryAchieved }),
  });
}

// ============================================================================
// TEACHING INTEGRATION
// ============================================================================

export interface LessonEventRequest {
  lesson_id: string;
  step_id: string;
  step_number: number;
  event: LearningEventCreate;
}

export interface LessonEventResponse {
  success: boolean;
  event_id: string;
  detection_result: DetectionResult;
  should_inject_intervention: boolean;
  intervention?: InterventionRecommendation;
}

/**
 * Process a learning event during a lesson
 */
export async function processLessonEvent(
  request: LessonEventRequest
): Promise<LessonEventResponse> {
  return apiClient<LessonEventResponse>('/teaching/lessons/events', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export interface InterventionCheckRequest {
  concept_id?: string;
  current_lesson_id?: string;
}

export interface InterventionCheckResponse {
  should_inject: boolean;
  intervention?: InterventionRecommendation;
  current_lesson_id?: string;
}

/**
 * Check if intervention should be injected
 */
export async function checkIntervention(
  request: InterventionCheckRequest
): Promise<InterventionCheckResponse> {
  return apiClient<InterventionCheckResponse>('/teaching/lessons/check-intervention', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export interface InterventionLessonResponse {
  lesson: any; // LessonScript type
  misconception_id: string;
  intervention_type: string;
}

/**
 * Get intervention lesson script
 */
export async function getInterventionLesson(
  misconceptionId: string
): Promise<InterventionLessonResponse> {
  return apiClient<InterventionLessonResponse>(
    `/teaching/interventions/${misconceptionId}/lesson`
  );
}

/**
 * Mark intervention lesson as started
 */
export async function startInterventionLesson(
  misconceptionId: string,
  lessonId: string
): Promise<void> {
  await apiClient('/teaching/interventions/start', {
    method: 'POST',
    body: JSON.stringify({ misconception_id: misconceptionId, lesson_id: lessonId }),
  });
}

/**
 * Mark intervention lesson as completed
 */
export async function completeInterventionLesson(
  misconceptionId: string,
  masteryAchieved: boolean,
  postAssessmentData?: Record<string, any>
): Promise<void> {
  await apiClient('/teaching/interventions/complete', {
    method: 'POST',
    body: JSON.stringify({
      misconception_id: misconceptionId,
      mastery_achieved: masteryAchieved,
      post_assessment_data: postAssessmentData,
    }),
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface ConceptHealthScore {
  concept_id: string;
  concept_name: string;
  total_learners: number;
  learners_with_misconceptions: number;
  misconception_frequency: number;
  common_misconceptions: Array<{
    code: string;
    name: string;
    confidence: number;
    severity: number;
  }>;
  health_score: number;
}

/**
 * Get concept health score
 */
export async function getConceptHealth(conceptId: string): Promise<ConceptHealthScore> {
  return apiClient<ConceptHealthScore>(`/learning/analytics/concept-health/${conceptId}`);
}

/**
 * Get confidence trajectory for a misconception
 */
export async function getConfidenceTrajectory(misconceptionId: string): Promise<any> {
  return apiClient(`/learning/misconceptions/${misconceptionId}/trajectory`);
}

/**
 * Get evidence breakdown for a misconception
 */
export async function getEvidenceBreakdown(misconceptionId: string): Promise<any> {
  return apiClient(`/learning/misconceptions/${misconceptionId}/evidence`);
}

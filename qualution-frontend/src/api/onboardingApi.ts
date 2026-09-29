import { apiClient } from './client';

export interface QuestionOption {
  id: string;
  text: string;
  subtext?: string;
}

export interface OnboardingQuestion {
  id: string;
  dimension: 'knowledge' | 'circuits' | 'programming' | 'goals';
  title: string;
  prompt: string;
  code_snippet?: string;
  options: QuestionOption[];
}

export interface DimensionScores {
  knowledge: number;
  circuits: number;
  programming: number;
  algorithms: number;
}

export interface DetectedMisconception {
  rule_id: string;
  name: string;
  remediation: string;
}

export interface OnboardingAssessPayload {
  answers: Record<string, string>;
  learning_goals?: string[];
  preferred_style?: string;
}

export interface OnboardingStatusResponse {
  is_onboarded: boolean;
  level?: 'beginner' | 'intermediate' | 'advanced';
  overall_mastery?: number;
  recommended_path: string[];
  profile?: {
    id: string;
    student_id: string;
    overall_mastery: number;
    prediction_accuracy: number;
    circuit_skill: number;
    coding_skill: number;
  };
}

export interface OnboardingAssessResponse {
  level: 'beginner' | 'intermediate' | 'advanced';
  score: number;
  dimension_scores: DimensionScores;
  detected_misconceptions: DetectedMisconception[];
  recommended_path: string[];
  curriculum_summary: string;
  ai_tutor_mode: string;
  learner_profile_id: string;
}

export async function getOnboardingQuestions(token?: string): Promise<OnboardingQuestion[]> {
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  return apiClient<OnboardingQuestion[]>('/onboarding/questions', {
    method: 'GET',
    headers,
  });
}

export async function getOnboardingStatus(token: string): Promise<OnboardingStatusResponse> {
  return apiClient<OnboardingStatusResponse>('/onboarding/status', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function submitOnboardingAssessment(
  payload: OnboardingAssessPayload,
  token: string
): Promise<OnboardingAssessResponse> {
  return apiClient<OnboardingAssessResponse>('/onboarding/assess', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

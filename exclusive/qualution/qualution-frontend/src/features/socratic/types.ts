export type SocraticState =
  | 'IDLE'
  | 'LOADING'
  | 'READY'
  | 'ASKING'
  | 'THINKING'
  | 'WAITING_FOR_RESPONSE'
  | 'ANALYZING'
  | 'FOLLOW_UP'
  | 'DEMONSTRATING'
  | 'EXPERIMENTING'
  | 'INTERPRETING'
  | 'REMEDIATING'
  | 'MASTERY_CHECK'
  | 'COMPLETED'
  | 'PAUSED'
  | 'ERROR';

export type SocraticStrategy =
  | 'DIRECT_CHECK'
  | 'GUIDED_DISCOVERY'
  | 'PREDICTION_EXPERIMENT'
  | 'CONCEPT_CONTRAST'
  | 'MISCONCEPTION_REPAIR'
  | 'CIRCUIT_DISCOVERY'
  | 'MATHEMATICAL_DISCOVERY'
  | 'TRANSFER'
  | 'GENERALIZATION'
  | 'MASTERY_CHECK';

export type LadderStep =
  | 'RECALL'
  | 'PREDICT'
  | 'JUSTIFY'
  | 'CONTRAST'
  | 'EXPERIMENT'
  | 'OBSERVE'
  | 'INTERPRET'
  | 'TRANSFER'
  | 'GENERALIZE';

export type ConfidenceLevel = 'GUESSING' | 'SOMEWHAT_CONFIDENT' | 'VERY_CONFIDENT';

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface SocraticQuestion {
  id: string;
  concept_id?: string;
  objective_id?: string;
  ladder_step: LadderStep;
  question_type: string;
  difficulty: number;
  prompt: string;
  response_type: 'MULTIPLE_CHOICE' | 'NUMERIC' | 'PREDICTION' | 'EXPLANATION' | 'CIRCUIT_CONSTRUCTION' | 'MATH_REASONING';
  reasoning_goal: string;
  options?: QuestionOption[];
  circuit_ir?: Record<string, unknown>;
  math_formula?: string;
  scaffold_hint?: string;
  misconception_targets?: string[];
  simulation_required?: boolean;
  teaching_narration?: string;
}

export interface SocraticEvaluationResult {
  is_correct: boolean;
  score: number;
  reasoning_quality: 'EXCELLENT' | 'ADEQUATE' | 'WEAK' | 'MISCONCEPTION';
  feedback: string;
  candidate_misconceptions?: Array<{
    code: string;
    confidence: number;
    explanation: string;
  }>;
  next_action: 'CONTINUE' | 'SCAFFOLD' | 'EXPERIMENT' | 'REMEDIATE' | 'MASTERY_CHECK' | 'COMPLETE';
  next_ladder_step?: LadderStep;
  next_strategy?: SocraticStrategy;
  simulation_payload?: {
    counts?: Record<string, number>;
    statevector?: Array<{ real: number; imag: number }>;
    shots?: number;
  };
  math_evidence?: Record<string, unknown>;
  teaching_actions?: Array<{
    type: string;
    text?: string;
    formula?: string;
    counts?: Record<string, number>;
  }>;
}

export interface SocraticSession {
  id: string;
  user_id: string;
  concept_id: string;
  lesson_id?: string;
  current_state: SocraticState;
  current_strategy: SocraticStrategy;
  ladder_step: LadderStep;
  current_question?: SocraticQuestion;
  scaffold_level: number;
  is_active: boolean;
  session_data?: Record<string, unknown>;
  last_evaluation?: SocraticEvaluationResult;
  created_at: string;
  updated_at: string;
}

export interface SocraticResponseSubmission {
  response_value: unknown;
  confidence_level?: ConfidenceLevel;
  explanation?: string;
  time_spent_ms?: number;
}

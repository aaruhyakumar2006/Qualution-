import type {
  Gate,
  CircuitMetricsResponse,
  BlochVector,
} from '../circuit/types';

export type TutorMode =
  | 'ask'
  | 'explain'
  | 'debug'
  | 'predict'
  | 'compare'
  | 'optimize'
  | 'learn'
  | 'challenge'
  | 'reflect'
  | 'experiment';

export type LearningLevel = 'beginner' | 'intermediate' | 'advanced' | 'technical';

export type TutorActionType =
  | 'inspect_gate'
  | 'open_state'
  | 'open_bloch'
  | 'open_timeline'
  | 'open_metrics'
  | 'open_optimize'
  | 'select_gate'
  | 'predict'
  | 'compare'
  | 'challenge';

export interface TutorAction {
  type: TutorActionType | string;
  label: string;
  payload?: {
    gateId?: string;
    stepIndex?: number;
    tab?: 'results' | 'state' | 'bloch' | 'timeline' | 'metrics' | 'learn';
    prediction?: string;
    challengeId?: string;
  };
}

export interface TutorResponse {
  status?: 'success' | 'degraded' | 'provider_timeout' | 'provider_unavailable' | 'configuration_error';
  answer: string | null;
  fallback_answer?: string | null;
  retryable?: boolean;
  error_code?: string | null;
  error_message?: string | null;
  latency_ms?: number | null;
  confidence: 'high' | 'medium' | 'low';
  facts: string[];
  actions: TutorAction[];
  suggestions: string[];
  provider?: string;
  reasoning_provider?: string;
  response_optimizer?: string | null;
  technical_analysis?: string;
  context_used?: string[];
  follow_up?: string;
  visualization_hint?: string;
  code?: string | null;
  simplified_by?: string | null;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode: TutorMode;
  response?: TutorResponse;
  statusText?: string;
  isStreaming?: boolean;
}

export interface CompactStatevectorSummary {
  amplitudes: Array<{
    binary: string;
    magnitude: number;
    real: number;
    imag: number;
  }>;
  isTruncated: boolean;
}

export interface TutorContext {
  circuit: {
    qubits: number;
    classicalBits: number;
    gates: Gate[];
    measure: boolean;
    shots: number;
  };
  selectedGate: Gate | null;
  metrics: CircuitMetricsResponse | null;
  simulation: {
    backend: string;
    mode: string;
    shots: number;
    executionTimeMs: number;
    probabilities: Record<string, number>;
    counts?: Record<string, number>;
    fidelity?: number;
    truncation_error?: number;
    approximation?: boolean;
    routing_reason?: string;
  } | null;
  routing?: {
    requested_backend: string;
    selected_backend: string;
    framework: string;
    policy: string;
    reason: string;
    method?: string;
    fidelity?: number;
    truncation_error?: number;
    approximation?: boolean;
  } | null;
  statevector: CompactStatevectorSummary | null;
  bloch: BlochVector | null;
  timeline: {
    totalSteps: number;
    qubits: number;
    steps: Array<{
      step: number;
      operation: string;
      qubits: number[];
      probabilities: Record<string, number>;
    }>;
  } | null;
  learningLevel: LearningLevel;
  error?: string | null;
  user?: {
    currentLevel: string;
    overallProgress?: number;
    currentStreak?: number;
    activeLesson?: string;
  };
  code?: {
    framework: string;
    hasErrors?: boolean;
  };
}

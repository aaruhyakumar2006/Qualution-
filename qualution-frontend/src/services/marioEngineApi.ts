import type { CircuitRequest } from '../features/circuit/types';

export interface MarioTurnResponse {
  kind: 'question' | 'experiment_offer' | 'reflection_prompt' | 'verification' | 'encouragement' | 'handoff';
  text: string;
  hint_level: number;
  experiment_id?: string;
  facts_used?: Record<string, any>[];
  state: 'IDLE' | 'DETECT' | 'DIAGNOSE' | 'QUESTION' | 'EXPERIMENT' | 'REFLECT' | 'VERIFY' | 'RESOLVED' | 'HANDOFF';
  misconception_id?: string;
  path_used?: string;
}

export interface ExperimentDiffResponse {
  misconception_id: string;
  universe_a: {
    label: string;
    circuit: any;
    probabilities: Record<string, number>;
    purity: number;
  };
  universe_b: {
    label: string;
    circuit: any;
    probabilities: Record<string, number>;
    purity: number;
  };
  diff_summary: {
    tvd_distance: number;
    purity_delta: number;
    is_distinguishable: boolean;
  };
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function submitSocraticTurn(
  sessionId: string,
  lessonId: string,
  stepId: string,
  circuit: CircuitRequest,
  studentPrediction: Record<string, number> | string,
  confidence: number = 0.8,
  authToken: string = 'jwt-eval-usr-student-999'
): Promise<MarioTurnResponse> {
  const res = await fetch(`${API_BASE}/misconception/turn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      session_id: sessionId,
      lesson_id: lessonId,
      step_id: stepId,
      circuit,
      student_prediction: studentPrediction,
      confidence
    })
  });

  if (!res.ok) {
    throw new Error(`Mario engine turn request failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.turn;
}

export async function fetchSocraticExperiment(
  misconceptionId: string,
  circuit: CircuitRequest,
  authToken: string = 'jwt-eval-usr-student-999'
): Promise<ExperimentDiffResponse> {
  const res = await fetch(`${API_BASE}/misconception/experiment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      misconception_id: misconceptionId,
      circuit
    })
  });

  if (!res.ok) {
    throw new Error(`Mario experiment request failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.experiment;
}

export interface SocraticReplyResponse {
  reply: string;
  provider: 'nim' | 'groq' | 'static';
}

/**
 * Calls the NIM-powered Socratic reply endpoint.
 * Given the educator's question and the student's typed reasoning,
 * returns a contextual follow-up that acknowledges their thinking
 * without revealing the answer.
 * Falls back gracefully if the backend is unreachable.
 */
export async function fetchSocraticReply(
  educatorQuestion: string,
  studentReply: string,
  assessmentContext?: string
): Promise<SocraticReplyResponse> {
  try {
    const res = await fetch(`${API_BASE}/misconception/socratic-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        educator_question: educatorQuestion,
        student_reply: studentReply,
        assessment_context: assessmentContext ?? null,
      }),
    });
    if (!res.ok) throw new Error(`socratic-reply ${res.status}`);
    return await res.json();
  } catch {
    // Client-side static fallback — identical to backend static pool
    const FALLBACK = [
      'That is a meaningful observation. Connect it to your circuit: does the gate you placed actually encode what you just described?',
      'You are reasoning in the right direction. Verify that instinct by running your updated circuit and examining how the probability distribution shifts.',
      'Solid thinking. Consider whether gate order matters here — quantum operations generally do not commute, so position on the wire is significant.',
      'Good. Does your circuit preserve the mathematical relationship you would expect from theory? Trace through it gate by gate.',
      'Interesting point. What would the statevector look like mid-circuit, before measurement, if your reasoning is correct?',
    ];
    return {
      reply: FALLBACK[Math.floor(Math.random() * FALLBACK.length)],
      provider: 'static',
    };
  }
}

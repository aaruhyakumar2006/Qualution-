import type { TutorContext, TutorResponse } from './tutorTypes';
import type { TutorProvider } from './providers/base';
import { NvidiaTutorProvider } from './providers/nvidiaTutor';

const defaultNvidiaProvider = new NvidiaTutorProvider();
const defaultProvider: TutorProvider = defaultNvidiaProvider;

/**
 * High-level entry point to query the Quantum Tutor
 */
export async function answerTutorQuestion(
  question: string,
  context: TutorContext,
  provider: TutorProvider = defaultProvider
): Promise<TutorResponse> {
  if (!question || question.trim().length === 0) {
    return {
      answer: 'Please ask a quantum question about your active circuit or select a suggested topic.',
      confidence: 'high',
      facts: [],
      actions: [],
      suggestions: [
        'Why do I get 50/50 probabilities?',
        'Explain what the H gate does.',
        'Find anomalies or redundant gates.',
      ],
      provider: 'groq-nvidia-dual',
      reasoning_provider: 'nvidia',
      response_optimizer: 'groq',
    };
  }

  return provider.answer(question, context);
}

/**
 * High-level streaming entry point for the Agent-Style UI
 */
export async function streamTutorQuestion(
  question: string,
  context: TutorContext,
  onStatus?: (status: string) => void,
  onDelta?: (delta: string) => void,
  provider: NvidiaTutorProvider = defaultNvidiaProvider
): Promise<TutorResponse> {
  if (!question || question.trim().length === 0) {
    return answerTutorQuestion(question, context, provider);
  }

  return provider.streamAnswer(question, context, onStatus, onDelta);
}

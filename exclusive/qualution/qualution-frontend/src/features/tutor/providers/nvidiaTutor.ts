import type { TutorContext, TutorResponse } from '../tutorTypes';
import type { TutorProvider } from './base';
import { LocalTutorProvider } from './localTutor';

export class NvidiaTutorProvider implements TutorProvider {
  name = 'NVIDIA NIM (Primary Reasoning) + Groq (Response Optimizer)';
  private localFallback = new LocalTutorProvider();
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

  async answer(question: string, context: TutorContext): Promise<TutorResponse> {
    if (import.meta.env.MODE === 'test') {
      return this.localFallback.answer(question, context);
    }

    try {
      const controller = new AbortController();
      // 50s fetch timeout: allows backend 45s total request budget to complete cleanly
      const timeoutId = setTimeout(() => controller.abort(), 50000);

      let mode = 'explain';
      const qLower = question.toLowerCase();
      if (qLower.includes('debug') || qLower.includes('error') || qLower.includes('why error') || context.error) {
        mode = 'debug';
      } else if (qLower.includes('predict') || qLower.includes('what happens if')) {
        mode = 'predict';
      } else if (qLower.includes('compare')) {
        mode = 'compare';
      } else if (
        qLower.includes('optimi') ||
        qLower.includes('simplif') ||
        qLower.includes('redundant') ||
        qLower.includes('cancel') ||
        qLower.includes('minimal')
      ) {
        mode = 'optimize';
      } else if (qLower.includes('challenge')) {
        mode = 'challenge';
      } else if (qLower.includes('what should i study') || qLower.includes('recommend') || qLower.includes('next')) {
        mode = 'learn';
      }

      const response = await fetch(`${this.baseUrl}/ai/tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          context,
          mode,
          level: context.learningLevel || 'beginner',
          simplify_for_students: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI Tutor backend gateway returned ${response.status}`);
      }

      const data = await response.json();
      if (data && (data.answer !== undefined || data.status)) {
        return {
          status: data.status || 'success',
          answer: data.answer ?? null,
          fallback_answer: data.fallback_answer ?? null,
          retryable: data.retryable ?? false,
          error_code: data.error_code ?? null,
          error_message: data.error_message ?? null,
          latency_ms: data.latency_ms ?? null,
          confidence: data.confidence || 'high',
          facts: data.facts || ['Powered by NVIDIA NIM & Groq Pedagogy.'],
          actions: data.actions || [],
          suggestions: data.suggestions || [
            'Can you explain this in even simpler terms?',
            'What happens in the next timeline step?',
            'Can this circuit be optimized?',
          ],
          provider: data.provider || 'nvidia',
          reasoning_provider: data.reasoning_provider || 'nvidia',
          response_optimizer: data.response_optimizer ?? null,
          technical_analysis: data.technical_analysis || data.fallback_answer || data.answer || '',
          context_used: data.context_used || ['circuit'],
          follow_up: data.follow_up,
          visualization_hint: data.visualization_hint,
          code: data.code,
          simplified_by: data.simplified_by,
        };
      }
    } catch (err) {
      console.warn('AI Tutor gateway request failed or timed out, using local fallback:', err);
    }

    const fallbackRes = await this.localFallback.answer(question, context);
    return {
      ...fallbackRes,
      provider: 'local-fallback',
      reasoning_provider: 'local-fallback',
      response_optimizer: undefined,
      technical_analysis: fallbackRes.answer ?? undefined,
    };
  }

  async streamAnswer(
    question: string,
    context: TutorContext,
    onStatus?: (status: string) => void,
    onDelta?: (delta: string) => void
  ): Promise<TutorResponse> {
    if (import.meta.env.MODE === 'test') {
      return this.answer(question, context);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(`${this.baseUrl}/ai/tutor/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          context,
          mode: 'explain',
          level: context.learningLevel || 'beginner',
          simplify_for_students: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        return this.answer(question, context);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: TutorResponse | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed) continue;

          if (trimmed.includes('event: status')) {
            const dataMatch = trimmed.match(/data:\s*(\{.*\})/);
            if (dataMatch) {
              try {
                const parsed = JSON.parse(dataMatch[1]);
                if (parsed.status && onStatus) onStatus(parsed.status);
              } catch {
                // Ignore malformed status chunk
              }
            }
          } else if (trimmed.includes('event: delta')) {
            const dataMatch = trimmed.match(/data:\s*(\{.*\})/);
            if (dataMatch) {
              try {
                const parsed = JSON.parse(dataMatch[1]);
                if (parsed.delta && onDelta) onDelta(parsed.delta);
              } catch {
                // Ignore malformed delta chunk
              }
            }
          } else if (trimmed.includes('event: done')) {
            const dataMatch = trimmed.match(/data:\s*(\{.*\})/);
            if (dataMatch) {
              try {
                finalResult = JSON.parse(dataMatch[1]);
              } catch {
                // Ignore malformed done chunk
              }
            }
          }
        }
      }

      if (finalResult && finalResult.answer) {
        return finalResult;
      }
    } catch (err) {
      console.warn('AI Tutor streaming failed or interrupted, falling back to synchronous query:', err);
    }

    return this.answer(question, context);
  }
}

import { apiClient } from '../../api/client';
import type {
  SocraticSession,
  SocraticResponseSubmission,
  SocraticStrategy,
} from './types';

export interface CreateSessionParams {
  concept_id: string;
  lesson_id?: string;
  initial_strategy?: SocraticStrategy;
}

export const socraticClient = {
  createOrResumeSession: async (params: CreateSessionParams): Promise<SocraticSession> => {
    return apiClient<SocraticSession>('/socratic/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getSession: async (sessionId: string): Promise<SocraticSession> => {
    return apiClient<SocraticSession>(`/socratic/sessions/${sessionId}`);
  },

  submitResponse: async (
    sessionId: string,
    submission: SocraticResponseSubmission
  ): Promise<SocraticSession> => {
    return apiClient<SocraticSession>(`/socratic/sessions/${sessionId}/respond`, {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  },

  pauseSession: async (sessionId: string): Promise<SocraticSession> => {
    return apiClient<SocraticSession>(`/socratic/sessions/${sessionId}/pause`, {
      method: 'POST',
    });
  },

  resumeSession: async (sessionId: string): Promise<SocraticSession> => {
    return apiClient<SocraticSession>(`/socratic/sessions/${sessionId}/resume`, {
      method: 'POST',
    });
  },
};

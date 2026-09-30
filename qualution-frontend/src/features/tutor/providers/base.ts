import type { TutorContext, TutorResponse } from '../tutorTypes';

export interface TutorProvider {
  name: string;
  answer(question: string, context: TutorContext): Promise<TutorResponse>;
}

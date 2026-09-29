export type LearningLevel = 'beginner' | 'technical';

export interface GateKnowledge {
  gate: string;
  name: string;
  category: 'superposition' | 'pauli' | 'phase' | 'rotation' | 'two-qubit' | 'measurement';
  beginnerDescription: string;
  technicalDescription: string;
  matrix?: string[];
  equations: {
    stateTransition: string;
    transformation: string;
  };
  blochEffect: string;
  commonUses: string[];
}

export interface PatternExplanation {
  patternId: string;
  name: string;
  summary: string;
  description: string;
  expectedOutcomes: string[];
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

export interface CircuitExplanation {
  title: string;
  learningLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  concepts: string[];
  pattern: PatternExplanation | null;
  stepExplanations: Array<{
    step: number;
    gateName: string;
    targetText: string;
    explanation: string;
    beforeState?: string;
    afterState?: string;
  }>;
  summary: string;
}

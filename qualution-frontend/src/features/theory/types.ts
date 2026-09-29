export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ConceptReference {
  conceptId: string;
  relationship: 'prerequisite' | 'related' | 'next';
}

export interface LearningObjective {
  type: 'KNOW' | 'UNDERSTAND' | 'DO' | 'EXPLAIN' | 'APPLY';
  description: string;
}

export type TheorySectionType = 
  | 'intuition' 
  | 'formal' 
  | 'math' 
  | 'visualization' 
  | 'circuit' 
  | 'interactive' 
  | 'experiment' 
  | 'practice';

export interface TheorySection {
  id: string;
  type: TheorySectionType;
  title?: string;
  content: string; // Markdown / MDX content
  
  // Specific data for certain types
  mathContext?: MathContext;
  circuitId?: string; // Reference to a CircuitIR object
  experimentDef?: ExperimentDefinition;
}

export interface MathContext {
  formulas: string[];
  variables: Record<string, string>;
}

export interface ExperimentDefinition {
  expectedMeasurements?: Record<string, number>; // e.g. {'0': 0.5, '1': 0.5}
  allowLearnerModification: boolean;
}

export interface Misconception {
  wrongBelief: string;
  correction: string;
}

export interface PracticeDefinition {
  type: 'multiple-choice' | 'predict-state' | 'build-circuit';
  question: string;
  options?: string[];
  correctAnswer: any;
  hints: string[];
}

export interface MasteryCriteria {
  requiredPracticeScore: number;
  requiredExperiments: number;
}

export interface TheoryConcept {
  id: string;
  slug: string;
  
  title: string;
  shortDescription: string;
  
  difficulty: DifficultyLevel;
  
  prerequisites: ConceptReference[];
  relatedConcepts?: ConceptReference[];
  
  learningObjectives: LearningObjective[];
  
  sections: TheorySection[];
  
  misconceptions?: Misconception[];
  practice?: PracticeDefinition[];
  masteryCriteria?: MasteryCriteria;
}

export interface TheoryModule {
  id: string;
  title: string;
  description: string;
  concepts: string[]; // Ordered list of Concept IDs
}

export interface TheoryCurriculum {
  modules: TheoryModule[];
}

export const __THEORY_TYPES = true;

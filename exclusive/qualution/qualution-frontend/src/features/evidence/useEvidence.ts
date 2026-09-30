/**
 * Evidence Collection React Hooks
 * 
 * Provides easy-to-use hooks for instrumenting learning interactions.
 */
import { useCallback, useEffect, useState } from 'react';
import { evidenceCollector } from './evidenceCollector';
import type {
  EvidenceSubmissionResponse,
  LessonEventResponse,
  InterventionRecommendation,
  LearnerMisconceptionProfile,
} from '../../api/evidenceApi';
import { getLearnerProfile, getActiveMisconceptions } from '../../api/evidenceApi';

/**
 * Hook for collecting evidence with automatic detection
 * 
 * @example
 * const { collectQuizAnswer, lastDetection } = useEvidenceCollection();
 * 
 * const handleSubmit = () => {
 *   collectQuizAnswer({
 *     conceptId: '...',
 *     questionId: '...',
 *     correct: isCorrect,
 *     expected: correctAnswer,
 *     actual: userAnswer
 *   });
 * };
 */
export function useEvidenceCollection() {
  const [lastDetection, setLastDetection] = useState<
    EvidenceSubmissionResponse | LessonEventResponse | null
  >(null);
  const [pendingIntervention, setPendingIntervention] = useState<InterventionRecommendation | null>(
    null
  );

  useEffect(() => {
    // Listen for detection responses
    const unsubscribe = evidenceCollector.addListener((response) => {
      setLastDetection(response);

      // Check for pending intervention
      if ('should_inject_intervention' in response) {
        if (response.should_inject_intervention && response.intervention) {
          setPendingIntervention(response.intervention);
        }
      } else if ('detection_result' in response && response.detection_result) {
        // Check if any interventions in detection result
        if (response.detection_result.interventions?.length > 0) {
          setPendingIntervention(response.detection_result.interventions[0]);
        }
      }
    });

    return unsubscribe;
  }, []);

  const collectQuizAnswer = useCallback(
    async (params: {
      conceptId: string;
      questionId: string;
      correct: boolean;
      expected: any;
      actual: any;
      context?: Record<string, any>;
    }) => {
      await evidenceCollector.collectQuizAnswer(params);
    },
    []
  );

  const collectPredictionAnswer = useCallback(
    async (params: {
      conceptId: string;
      lessonId?: string;
      checkpointId: string;
      correct: boolean;
      expectedOption: number;
      actualOption: number;
      context?: Record<string, any>;
    }) => {
      await evidenceCollector.collectPredictionAnswer(params);
    },
    []
  );

  const collectCircuitConstruction = useCallback(
    async (params: {
      conceptId: string;
      circuitId: string;
      gates: any[];
      qubits: number;
      context?: Record<string, any>;
    }) => {
      await evidenceCollector.collectCircuitConstruction(params);
    },
    []
  );

  const collectGatePlacement = useCallback(
    async (params: {
      conceptId: string;
      circuitId: string;
      gate: string;
      qubit: number;
      column: number;
      context?: Record<string, any>;
    }) => {
      await evidenceCollector.collectGatePlacement(params);
    },
    []
  );

  const collectSimulationInterpretation = useCallback(
    async (params: {
      conceptId: string;
      circuitId: string;
      simulationResults: any;
      userInterpretation?: string;
      correct?: boolean;
      context?: Record<string, any>;
    }) => {
      await evidenceCollector.collectSimulationInterpretation(params);
    },
    []
  );

  const clearPendingIntervention = useCallback(() => {
    setPendingIntervention(null);
  }, []);

  return {
    collectQuizAnswer,
    collectPredictionAnswer,
    collectCircuitConstruction,
    collectGatePlacement,
    collectSimulationInterpretation,
    lastDetection,
    pendingIntervention,
    clearPendingIntervention,
  };
}

/**
 * Hook for accessing learner's misconception profile
 * 
 * @example
 * const { profile, loading, refresh } = useMisconceptionProfile();
 * 
 * if (loading) return <Spinner />;
 * 
 * return (
 *   <div>
 *     <h2>Active Misconceptions: {profile.active_misconceptions.length}</h2>
 *     {profile.active_misconceptions.map(m => (
 *       <MisconceptionCard key={m.misconception_id} misconception={m} />
 *     ))}
 *   </div>
 * );
 */
export function useMisconceptionProfile() {
  const [profile, setProfile] = useState<LearnerMisconceptionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLearnerProfile();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      console.error('Failed to load misconception profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    refresh: loadProfile,
  };
}

/**
 * Hook for monitoring active misconceptions for a concept
 * 
 * @example
 * const { misconceptions, loading } = useActiveMisconceptions(conceptId);
 * 
 * if (misconceptions.length > 0) {
 *   return <Alert>You have {misconceptions.length} active misconceptions</Alert>;
 * }
 */
export function useActiveMisconceptions(conceptId?: string, minConfidence: number = 0.3) {
  const [misconceptions, setMisconceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMisconceptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActiveMisconceptions({
        concept_id: conceptId,
        min_confidence: minConfidence,
      });
      setMisconceptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load misconceptions');
      console.error('Failed to load active misconceptions:', err);
    } finally {
      setLoading(false);
    }
  }, [conceptId, minConfidence]);

  useEffect(() => {
    loadMisconceptions();
  }, [loadMisconceptions]);

  return {
    misconceptions,
    loading,
    error,
    refresh: loadMisconceptions,
  };
}

/**
 * Hook for setting lesson context for evidence collection
 * 
 * @example
 * const MyLesson = ({ lessonId }) => {
 *   useLessonContext(lessonId, currentStepId, currentStepNumber);
 *   
 *   // All evidence collected in this component will be associated with this lesson
 *   return <LessonContent />;
 * };
 */
export function useLessonContext(lessonId: string, stepId: string, stepNumber: number) {
  useEffect(() => {
    evidenceCollector.setLessonContext(lessonId, stepId, stepNumber);
    return () => {
      evidenceCollector.clearLessonContext();
    };
  }, [lessonId, stepId, stepNumber]);
}

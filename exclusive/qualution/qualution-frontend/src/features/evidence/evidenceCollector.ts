/**
 * Evidence Collector Service
 * 
 * Centralized service for collecting learning evidence and submitting to backend.
 * Handles batching, debouncing, and error recovery.
 */
import {
  submitEvidence,
  processLessonEvent,
  type LearningEventCreate,
  type EvidenceSubmissionResponse,
  type LessonEventResponse,
  type EventType,
} from '../../api/evidenceApi';

export interface EvidenceConfig {
  /** Enable automatic submission (default: true) */
  autoSubmit?: boolean;
  /** Batch multiple events before submission (default: false) */
  enableBatching?: boolean;
  /** Batch size (default: 5) */
  batchSize?: number;
  /** Batch timeout in ms (default: 2000) */
  batchTimeout?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

export interface CollectedEvidence {
  event: LearningEventCreate;
  timestamp: number;
  submitted: boolean;
  error?: string;
}

type EvidenceListener = (response: EvidenceSubmissionResponse | LessonEventResponse) => void;

/**
 * Evidence Collector
 * 
 * Collects learning events and submits them for misconception detection.
 */
class EvidenceCollector {
  private config: Required<EvidenceConfig> = {
    autoSubmit: true,
    enableBatching: false,
    batchSize: 5,
    batchTimeout: 2000,
    debug: false,
  };

  private eventQueue: CollectedEvidence[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<EvidenceListener> = new Set();
  private currentLesson: { id: string; stepId: string; stepNumber: number } | null = null;

  configure(config: EvidenceConfig): void {
    this.config = { ...this.config, ...config };
    this.log('Configured:', this.config);
  }

  /**
   * Set current lesson context for evidence submission
   */
  setLessonContext(lessonId: string, stepId: string, stepNumber: number): void {
    this.currentLesson = { id: lessonId, stepId, stepNumber };
    this.log('Lesson context set:', this.currentLesson);
  }

  /**
   * Clear lesson context
   */
  clearLessonContext(): void {
    this.currentLesson = null;
    this.log('Lesson context cleared');
  }

  /**
   * Register listener for evidence submission responses
   */
  addListener(listener: EvidenceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Collect a learning event
   */
  async collect(event: LearningEventCreate): Promise<void> {
    const evidence: CollectedEvidence = {
      event,
      timestamp: Date.now(),
      submitted: false,
    };

    this.eventQueue.push(evidence);
    this.log('Event collected:', event.event_type, event);

    if (this.config.autoSubmit) {
      if (this.config.enableBatching) {
        this.scheduleBatchSubmission();
      } else {
        await this.submitSingle(evidence);
      }
    }
  }

  /**
   * Collect a quiz answer event
   */
  async collectQuizAnswer(params: {
    conceptId: string;
    questionId: string;
    correct: boolean;
    expected: any;
    actual: any;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.collect({
      concept_id: params.conceptId,
      event_type: 'QUIZ_ANSWER',
      question_id: params.questionId,
      correct: params.correct,
      expected: params.expected,
      actual: params.actual,
      context: params.context,
    });
  }

  /**
   * Collect a prediction answer event
   */
  async collectPredictionAnswer(params: {
    conceptId: string;
    lessonId?: string;
    checkpointId: string;
    correct: boolean;
    expectedOption: number;
    actualOption: number;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.collect({
      concept_id: params.conceptId,
      event_type: 'PREDICTION_ANSWER',
      lesson_id: params.lessonId,
      question_id: params.checkpointId,
      correct: params.correct,
      expected: { option: params.expectedOption },
      actual: { option: params.actualOption },
      context: params.context,
    });
  }

  /**
   * Collect a circuit construction event
   */
  async collectCircuitConstruction(params: {
    conceptId: string;
    circuitId: string;
    gates: any[];
    qubits: number;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.collect({
      concept_id: params.conceptId,
      event_type: 'CIRCUIT_CONSTRUCTION',
      circuit_id: params.circuitId,
      actual: {
        gates: params.gates,
        qubits: params.qubits,
      },
      context: params.context,
    });
  }

  /**
   * Collect a gate placement event
   */
  async collectGatePlacement(params: {
    conceptId: string;
    circuitId: string;
    gate: string;
    qubit: number;
    column: number;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.collect({
      concept_id: params.conceptId,
      event_type: 'GATE_PLACEMENT',
      circuit_id: params.circuitId,
      actual: {
        gate: params.gate,
        qubit: params.qubit,
        column: params.column,
      },
      context: params.context,
    });
  }

  /**
   * Collect a simulation interpretation event
   */
  async collectSimulationInterpretation(params: {
    conceptId: string;
    circuitId: string;
    simulationResults: any;
    userInterpretation?: string;
    correct?: boolean;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.collect({
      concept_id: params.conceptId,
      event_type: 'SIMULATION_INTERPRETATION',
      circuit_id: params.circuitId,
      correct: params.correct,
      actual: {
        results: params.simulationResults,
        interpretation: params.userInterpretation,
      },
      context: params.context,
    });
  }

  /**
   * Manually submit all pending events
   */
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const pending = this.eventQueue.filter((e) => !e.submitted);
    if (pending.length === 0) return;

    this.log('Flushing', pending.length, 'pending events');

    await Promise.all(pending.map((evidence) => this.submitSingle(evidence)));
  }

  /**
   * Get collected events history
   */
  getHistory(): CollectedEvidence[] {
    return [...this.eventQueue];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventQueue = [];
    this.log('History cleared');
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async submitSingle(evidence: CollectedEvidence): Promise<void> {
    if (evidence.submitted) return;

    try {
      let response: EvidenceSubmissionResponse | LessonEventResponse;

      // If in lesson context, use lesson event endpoint
      if (this.currentLesson) {
        response = await processLessonEvent({
          lesson_id: this.currentLesson.id,
          step_id: this.currentLesson.stepId,
          step_number: this.currentLesson.stepNumber,
          event: evidence.event,
        });
      } else {
        // Otherwise use standalone evidence submission
        response = await submitEvidence({
          event: evidence.event,
          run_detection: true,
        });
      }

      evidence.submitted = true;
      this.log('Event submitted:', evidence.event.event_type, response);

      // Notify listeners
      this.listeners.forEach((listener) => {
        try {
          listener(response);
        } catch (error) {
          console.error('Evidence listener error:', error);
        }
      });
    } catch (error) {
      evidence.error = error instanceof Error ? error.message : String(error);
      console.error('Failed to submit evidence:', error);
      this.log('Submission failed:', evidence.event.event_type, evidence.error);
    }
  }

  private scheduleBatchSubmission(): void {
    const pending = this.eventQueue.filter((e) => !e.submitted);

    // Submit immediately if batch size reached
    if (pending.length >= this.config.batchSize) {
      this.submitBatch();
      return;
    }

    // Schedule batch submission
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.submitBatch();
      }, this.config.batchTimeout);
    }
  }

  private async submitBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const pending = this.eventQueue.filter((e) => !e.submitted);
    if (pending.length === 0) return;

    this.log('Submitting batch of', pending.length, 'events');

    // Submit all pending events
    await Promise.all(pending.map((evidence) => this.submitSingle(evidence)));
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[EvidenceCollector]', ...args);
    }
  }
}

// Singleton instance
export const evidenceCollector = new EvidenceCollector();

// Configure based on environment
if (import.meta.env.DEV) {
  evidenceCollector.configure({
    debug: true,
  });
}

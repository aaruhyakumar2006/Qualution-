/**
 * Teaching Controller Evidence Integration
 * 
 * Integrates misconception detection with the teaching controller.
 * Automatically collects evidence and injects interventions.
 */
import type { TeachingController } from './teachingController';
import { evidenceCollector } from '../evidence/evidenceCollector';
import {
  checkIntervention,
  getInterventionLesson,
  startInterventionLesson,
  completeInterventionLesson,
  type InterventionRecommendation,
} from '../../api/evidenceApi';

export interface InterventionInjectorConfig {
  /** Enable automatic intervention injection (default: true) */
  autoInject?: boolean;
  /** Inject MICRO_CORRECTION interventions (default: true) */
  injectMicro?: boolean;
  /** Inject MINI_REMEDIATION interventions (default: true) */
  injectMini?: boolean;
  /** Inject FULL_REMEDIATION interventions (default: true) */
  injectFull?: boolean;
  /** Show intervention notifications (default: true) */
  showNotifications?: boolean;
  /** Debug logging (default: false) */
  debug?: boolean;
}

/**
 * Teaching Evidence Integrator
 * 
 * Connects the teaching controller with the misconception engine.
 */
export class TeachingEvidenceIntegrator {
  private controller: TeachingController;
  private config: Required<InterventionInjectorConfig> = {
    autoInject: true,
    injectMicro: true,
    injectMini: true,
    injectFull: true,
    showNotifications: true,
    debug: false,
  };

  private savedLesson: {
    lessonId: string;
    stepIndex: number;
  } | null = null;

  private interventionActive = false;
  private currentIntervention: InterventionRecommendation | null = null;

  constructor(controller: TeachingController, config?: InterventionInjectorConfig) {
    this.controller = controller;
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.setupEvidenceCollection();
  }

  /**
   * Configure the integrator
   */
  configure(config: InterventionInjectorConfig): void {
    this.config = { ...this.config, ...config };
    this.log('Configuration updated:', this.config);
  }

  /**
   * Check if intervention should be injected and inject if needed
   */
  async checkAndInject(conceptId?: string): Promise<boolean> {
    if (!this.config.autoInject || this.interventionActive) {
      return false;
    }

    try {
      const state = this.controller.getState();
      const response = await checkIntervention({
        concept_id: conceptId,
        current_lesson_id: state.activeLesson?.id,
      });

      if (response.should_inject && response.intervention) {
        return await this.injectIntervention(response.intervention);
      }

      return false;
    } catch (error) {
      console.error('Failed to check intervention:', error);
      return false;
    }
  }

  /**
   * Inject an intervention lesson
   */
  async injectIntervention(intervention: InterventionRecommendation): Promise<boolean> {
    // Check if this intervention type should be injected
    if (
      (intervention.intervention_type === 'MICRO_CORRECTION' && !this.config.injectMicro) ||
      (intervention.intervention_type === 'MINI_REMEDIATION' && !this.config.injectMini) ||
      (intervention.intervention_type === 'FULL_REMEDIATION' && !this.config.injectFull)
    ) {
      this.log('Skipping intervention:', intervention.intervention_type);
      return false;
    }

    try {
      this.log('Injecting intervention:', intervention);

      // Get intervention lesson
      const lessonResponse = await getInterventionLesson(intervention.misconception_id);

      // Save current lesson state
      const state = this.controller.getState();
      if (state.activeLesson) {
        this.savedLesson = {
          lessonId: state.activeLesson.id,
          stepIndex: state.currentStepIndex,
        };
      }

      // Show notification
      if (this.config.showNotifications) {
        this.showInterventionNotification(intervention);
      }

      // Mark intervention started
      await startInterventionLesson(
        intervention.misconception_id,
        lessonResponse.lesson.id
      );

      this.interventionActive = true;
      this.currentIntervention = intervention;

      // Load and start intervention lesson
      await this.controller.loadLesson(lessonResponse.lesson);
      await this.controller.start();

      // Wait for completion
      await this.waitForLessonCompletion();

      // Mark intervention completed
      const masteryAchieved = await this.assessMastery();
      await completeInterventionLesson(
        intervention.misconception_id,
        masteryAchieved
      );

      this.interventionActive = false;
      this.currentIntervention = null;

      // Resume original lesson if auto-resume
      if (intervention.auto_resume && this.savedLesson) {
        await this.resumeSavedLesson();
      }

      return true;
    } catch (error) {
      console.error('Failed to inject intervention:', error);
      this.interventionActive = false;
      this.currentIntervention = null;
      return false;
    }
  }

  /**
   * Get intervention status
   */
  getStatus(): {
    interventionActive: boolean;
    currentIntervention: InterventionRecommendation | null;
    savedLesson: { lessonId: string; stepIndex: number } | null;
  } {
    return {
      interventionActive: this.interventionActive,
      currentIntervention: this.currentIntervention,
      savedLesson: this.savedLesson,
    };
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private setupEvidenceCollection(): void {
    // Listen for teaching events and collect evidence
    const unsubscribe = this.controller.subscribe((state) => {
      // Update lesson context
      if (state.activeLesson && state.currentStep) {
        evidenceCollector.setLessonContext(
          state.activeLesson.id,
          state.currentStep.id,
          state.currentStep.stepNumber
        );
      }
    });

    this.log('Evidence collection setup complete');
  }

  private showInterventionNotification(intervention: InterventionRecommendation): void {
    // Use controller's toast if available
    const hooks = (this.controller as any).hooks;
    if (hooks?.showToast) {
      const typeMap = {
        MICRO_CORRECTION: 'info' as const,
        MINI_REMEDIATION: 'warning' as const,
        FULL_REMEDIATION: 'warning' as const,
      };

      hooks.showToast(
        typeMap[intervention.intervention_type],
        intervention.explanation
      );
    }
  }

  private async waitForLessonCompletion(): Promise<void> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        const state = this.controller.getState();
        if (state.status === 'COMPLETED') {
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      checkCompletion();
    });
  }

  private async assessMastery(): Promise<boolean> {
    // For now, assume mastery if lesson completed
    // In future, could analyze lesson performance
    const state = this.controller.getState();
    return state.status === 'COMPLETED';
  }

  private async resumeSavedLesson(): Promise<void> {
    if (!this.savedLesson) return;

    try {
      // Note: Would need to reload the original lesson
      // This is a placeholder - actual implementation depends on lesson loading mechanism
      this.log('Resuming saved lesson:', this.savedLesson);

      // Clear saved lesson
      this.savedLesson = null;
    } catch (error) {
      console.error('Failed to resume saved lesson:', error);
    }
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[TeachingEvidenceIntegrator]', ...args);
    }
  }
}

/**
 * Helper to create evidence collection hooks for teaching controller
 * 
 * @example
 * const controller = new TeachingController(hooks);
 * const integrator = createTeachingEvidenceIntegration(controller);
 * 
 * // Automatically collects evidence and checks for interventions
 */
export function createTeachingEvidenceIntegration(
  controller: TeachingController,
  config?: InterventionInjectorConfig
): TeachingEvidenceIntegrator {
  return new TeachingEvidenceIntegrator(controller, config);
}

/**
 * Extend TeachingController with evidence collection methods
 * 
 * This adds misconception detection capabilities to the teaching controller.
 */
export function enableEvidenceCollection(
  controller: TeachingController,
  config?: InterventionInjectorConfig
): TeachingEvidenceIntegrator {
  const integrator = new TeachingEvidenceIntegrator(controller, config);

  // Auto-check for interventions at key points
  const originalNext = controller.next.bind(controller);
  controller.next = async function (this: TeachingController) {
    // Check for intervention before moving to next step
    const state = this.getState();
    if (state.activeLesson) {
      const conceptId = state.activeLesson.conceptTags[0];
      await integrator.checkAndInject(conceptId);
    }

    // Proceed to next step
    await originalNext();
  };

  const originalSubmitPrediction = controller.submitPrediction.bind(controller);
  controller.submitPrediction = async function (this: TeachingController, optionIndex: number) {
    const state = this.getState();
    
    // Collect evidence
    if (state.currentStep?.checkpoint && state.activeLesson) {
      const checkpoint = state.currentStep.checkpoint;
      const conceptId = state.activeLesson.conceptTags[0];
      const isCorrect = optionIndex === checkpoint.correctOptionIndex;

      await evidenceCollector.collectPredictionAnswer({
        conceptId,
        lessonId: state.activeLesson.id,
        checkpointId: checkpoint.id,
        correct: isCorrect,
        expectedOption: checkpoint.correctOptionIndex,
        actualOption: optionIndex,
        context: {
          step_id: state.currentStep.id,
          step_number: state.currentStep.stepNumber,
        },
      });
    }

    // Submit prediction
    await originalSubmitPrediction(optionIndex);

    // Check for intervention after prediction
    if (state.activeLesson) {
      const conceptId = state.activeLesson.conceptTags[0];
      await integrator.checkAndInject(conceptId);
    }
  };

  return integrator;
}

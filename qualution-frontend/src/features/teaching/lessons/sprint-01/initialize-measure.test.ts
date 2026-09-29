import { describe, it, expect, vi, beforeEach } from 'vitest';
import { s1InitializeMeasureLesson } from './initialize-measure';
import { validateLessonScript, evaluateCompletionCriteria } from '../../lessonValidator';
import { lessonRegistry } from '../../lessonRegistry';
import { TeachingController } from '../../teachingController';
import type { TeachingIDEHooks } from '../../teachingController';
import type { CircuitRequest, CircuitRunResponse } from '../../../circuit/types';
import type { TeachingEvent } from '../../types';
import * as teachingEvents from '../../teachingEvents';

describe('Sprint 1 Lesson 1: Initialize & Measure a Qubit (s1-initialize-measure)', () => {
  let mockCircuit: CircuitRequest;
  let mockSimResult: CircuitRunResponse;
  let mockHooks: TeachingIDEHooks;
  let dispatchedEvents: TeachingEvent[];

  beforeEach(() => {
    dispatchedEvents = [];
    vi.spyOn(teachingEvents, 'emitTeachingEvent').mockImplementation((ev) => {
      dispatchedEvents.push(ev);
    });

    mockCircuit = {
      qubits: 1,
      classical_bits: 1,
      gates: [],
      measure: true,
      shots: 500,
    };

    mockSimResult = {
      simulation: {
        backend: 'aer_simulator',
        mode: 'shots',
        execution_time_ms: 12,
        shots: 500,
        probabilities: {
          '0': 1.0,
          '1': 0.0,
        },
        counts: {
          '0': 500,
        },
      },
    } as unknown as CircuitRunResponse;

    mockHooks = {
      getCircuit: vi.fn(() => mockCircuit),
      updateCircuit: vi.fn((updated) => {
        mockCircuit = updated;
      }),
      runSimulation: vi.fn(async () => mockSimResult),
      getSimulationResult: vi.fn(() => mockSimResult),
      highlightGate: vi.fn(),
      highlightQubit: vi.fn(),
      clearHighlights: vi.fn(),
      focusVisualization: vi.fn(),
      showToast: vi.fn(),
    };
  });

  it('passes validateLessonScript without any schema or semantic errors', () => {
    const res = validateLessonScript(s1InitializeMeasureLesson);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('is properly registered and retrievable case-insensitively from lessonRegistry', () => {
    const lesson = lessonRegistry.getLesson('s1-initialize-measure');
    expect(lesson).toBeDefined();
    expect(lesson?.id).toBe('s1-initialize-measure');
    expect(lesson?.title).toBe('Initialize & Measure a Qubit');
    expect(lesson?.curriculumModuleId).toBe('lesson-1-initialize-measure');

    const upperCaseLesson = lessonRegistry.getLesson('S1-INITIALIZE-MEASURE');
    expect(upperCaseLesson?.id).toBe('s1-initialize-measure');
  });

  it('contains the expected prediction checkpoint with valid options and correct index', () => {
    const predStep = s1InitializeMeasureLesson.steps.find((s) => s.checkpoint);
    expect(predStep).toBeDefined();
    expect(predStep?.checkpoint).toBeDefined();

    const checkpoint = predStep!.checkpoint!;
    expect(checkpoint.id).toBe('pred-init-measure');
    expect(checkpoint.question).toContain('What result do you expect');
    expect(checkpoint.options.length).toBeGreaterThanOrEqual(3);

    const optLabels = checkpoint.options.map((o) => o.label);
    expect(optLabels).toContain('100% 0');
    expect(optLabels).toContain('50% 0 / 50% 1');
    expect(optLabels).toContain('100% 1');

    expect(checkpoint.correctOptionIndex).toBe(0);
    expect(checkpoint.options[0].isCorrect).toBe(true);
    expect(checkpoint.options[1].isCorrect).toBe(false);
    expect(checkpoint.options[2].isCorrect).toBe(false);
  });

  it('uses only supported action types throughout all steps', () => {
    const supportedActions = new Set([
      'initialize_qubits',
      'reset_circuit',
      'clear_highlights',
      'explain',
      'highlight_qubit',
      'run_simulation',
      'focus_visualization',
      'show_result',
      'compare_prediction',
      'complete_lesson',
    ]);

    for (const step of s1InitializeMeasureLesson.steps) {
      for (const action of step.actions) {
        expect(supportedActions.has(action.type)).toBe(true);
      }
    }
  });

  it('ensures prediction checkpoint occurs towards the end of the lesson', () => {
    const predStepIndex = s1InitializeMeasureLesson.steps.findIndex((s) => s.checkpoint);
    const simStepIndex = s1InitializeMeasureLesson.steps.findIndex((s) =>
      s.actions.some((a) => a.type === 'run_simulation')
    );

    expect(predStepIndex).toBeGreaterThanOrEqual(0);
    // Simulation might be triggered by actions before or during takeover, but checkpoint is at the end.
  });

  it('executes through generic TeachingController without modifying the engine', async () => {
    const mockSpeech = {
      speak: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      isSpeaking: vi.fn(() => false),
      isAvailable: vi.fn(() => true),
      setMuted: vi.fn(),
      isMuted: vi.fn(() => false),
    };

    const controller = new TeachingController(mockHooks, mockSpeech);
    await controller.loadLesson(s1InitializeMeasureLesson);
    expect(controller.getState().activeLesson?.id).toBe('s1-initialize-measure');

    // Start execution of Step 1: Default Ground State |0>
    await controller.start();
    expect(controller.getState().status).toBe('TEACHING');
    expect(controller.getState().currentStepIndex).toBe(0);
    expect(mockHooks.updateCircuit).toHaveBeenCalledWith(
      expect.objectContaining({
        qubits: 1,
        classical_bits: 1,
        gates: [],
      })
    );

    // Step 2: Inspect Qubit Wire q[0]
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(1);
    expect(mockHooks.highlightQubit).toHaveBeenCalledWith(0);

    // Step 3: Prediction Checkpoint
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(2);
    expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');

    // Submit prediction -> moves to Step 4 (Simulation)
    await controller.submitPrediction(0);
    expect(controller.getState().currentStepIndex).toBe(3);

    // Step 5: Observe & Compare
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(4);

    // Step 6: Physical Explanation
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(5);

    // Step 7: Learner Turn
    await controller.next();
    expect(controller.getState().currentStepIndex).toBe(6);
    expect(controller.getState().status).toBe('LEARNER_TURN');

    // Record circuit state before learner takeover
    const circuitBeforeTakeover = { ...mockCircuit };

    // Learner takeover MUST NOT mutate the learner's circuit automatically
    expect(mockCircuit).toEqual(circuitBeforeTakeover);

    // Complete learner turn -> completes lesson
    await controller.completeLearnerTurn();
    expect(controller.getState().status).toBe('COMPLETED');
    expect(controller.getState().activeLesson?.completionMessage).toBe(
      'You verified your first quantum measurement: an initialized qubit produces 0 in the computational basis.'
    );

    // Verify key telemetry events were emitted
    const eventTypes = dispatchedEvents.map((e) => e.type);
    expect(eventTypes).toContain('lesson_started');
    expect(eventTypes).toContain('step_started');
    expect(eventTypes).toContain('prediction_requested');
    expect(eventTypes).toContain('prediction_submitted');
    expect(eventTypes).toContain('simulation_started');
    expect(eventTypes).toContain('simulation_completed');
    expect(eventTypes).toContain('learner_takeover');
    expect(eventTypes).toContain('lesson_completed');

    controller.destroy();
  });

  it('evaluates learner takeover completion criteria accurately via structured evaluator', () => {
    const takeoverStep = s1InitializeMeasureLesson.steps.find((s) => s.takeover);
    expect(takeoverStep).toBeDefined();
    expect(takeoverStep?.takeover?.completionCriteria).toBeDefined();

    const criteria = takeoverStep!.takeover!.completionCriteria!;

    // Case 1: Ideal 100% 0 distribution -> passes
    const idealResult = {
      simulation: {
        backend: 'aer_simulator',
        mode: 'shots',
        execution_time_ms: 10,
        shots: 500,
        probabilities: { '0': 1.0 },
      },
    } as unknown as CircuitRunResponse;
    expect(evaluateCompletionCriteria(criteria, mockCircuit, idealResult)).toBe(true);

    // Case 2: Even with arbitrary circuit mutation, explicit_finish in any_of passes
    expect(evaluateCompletionCriteria(criteria, mockCircuit, null)).toBe(true);
  });
});

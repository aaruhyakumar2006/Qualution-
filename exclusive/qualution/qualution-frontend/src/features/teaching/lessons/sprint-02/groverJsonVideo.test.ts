import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeachingController, type TeachingIDEHooks } from '../../teachingController';
import { getLesson, getLessonIds } from '../../lessonRegistry';
import {
  validateJsonTeachingVideo,
  convertJsonToLessonScript,
} from '../../schema/jsonLessonSchema';
import {
  calculateOptimalGroverIterations,
  complexAdd,
  complexMultiply,
  probabilityFromAmplitude,
  GROVER_2Q_CANONICAL_MATH,
} from '../../mathBridge';
import { TeachingTargetResolver } from '../../TeachingTargetResolver';
import { grover2q11JsonData, grover2q11Lesson } from './grover-2q-11';
import type { CircuitRequest, CircuitRunResponse } from '../../../circuit/types';

describe('Grover 2-Qubit JSON Video & Teaching Pipeline', () => {
  let mockCircuit: CircuitRequest;
  let mockRunResult: CircuitRunResponse;
  let hooks: TeachingIDEHooks;

  beforeEach(() => {
    mockCircuit = {
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measure: true,
      shots: 1000,
    };

    mockRunResult = {
      valid: true,
      simulation: {
        backend: 'qiskit_aer',
        execution_time_ms: 18.2,
        counts: { '11': 1000 },
        probabilities: { '00': 0.0, '01': 0.0, '10': 0.0, '11': 1.0 },
        statevector: [
          { real: 0, imag: 0 },
          { real: 0, imag: 0 },
          { real: 0, imag: 0 },
          { real: 1.0, imag: 0 },
        ],
      },
      visualization: {
        qsphere: {
          nodes: [
            { state: '11', amplitude: 1.0, phase: 0.0, x: 0, y: 0, z: 1.0, probability: 1.0 },
          ],
        },
      },
      metrics: {
        gate_count: 8,
        depth: 5,
        multi_qubit_gates: 2,
        qubit_count: 2,
      },
    } as unknown as CircuitRunResponse;

    hooks = {
      getCircuit: vi.fn(() => mockCircuit),
      updateCircuit: vi.fn((newCirc) => {
        mockCircuit = newCirc;
      }),
      runSimulation: vi.fn(async () => mockRunResult),
      getSimulationResult: vi.fn(() => mockRunResult),
      focusVisualization: vi.fn(),
      highlightGate: vi.fn(),
      highlightQubit: vi.fn(),
      clearHighlights: vi.fn(),
      showToast: vi.fn(),
    };
  });

  describe('1. Schema Validation & JSON Conversion', () => {
    it('validates the canonical grover-2q-11.json with zero errors', () => {
      const result = validateJsonTeachingVideo(grover2q11JsonData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid JSON payloads with descriptive errors', () => {
      expect(validateJsonTeachingVideo(null).valid).toBe(false);
      expect(validateJsonTeachingVideo({}).valid).toBe(false);
      expect(validateJsonTeachingVideo({ lessonId: 'test', title: 't', version: 0, mode: 'INVALID', segments: [] }).valid).toBe(false);
    });

    it('converts JSON data into a full 19-step LessonScript', () => {
      const lesson = convertJsonToLessonScript(grover2q11JsonData);
      expect(lesson.id).toBe('grover-2q-11');
      expect(lesson.title).toContain("Grover's Algorithm");
      expect(lesson.steps).toHaveLength(19);

      // Check structure of key steps
      expect(lesson.steps[0].id).toBe('segment-1-initialization');
      expect(lesson.steps[3].id).toBe('segment-4-place-h0');
      expect(lesson.steps[5].id).toBe('segment-6-place-h1');
      expect(lesson.steps[7].id).toBe('segment-8-show-probabilities-25');
      expect(lesson.steps[9].id).toBe('segment-10-build-oracle');
      expect(lesson.steps[14].id).toBe('segment-15-socratic-question');
      expect(lesson.steps[15].id).toBe('segment-16-run-simulation');
      expect(lesson.steps[18].id).toBe('segment-19-mastery-complete');
    });
  });

  describe('2. Canonical Mathematical Bridge Fidelity', () => {
    it('calculates optimal iterations for 2-qubit single marked item as exactly 1', () => {
      const iters = calculateOptimalGroverIterations(2, 1);
      expect(iters).toBe(1);
    });

    it('performs complex arithmetic and probability conversions without drift', () => {
      const c1 = { real: 0.5, imag: 0 };
      const c2 = { real: -0.5, imag: 0 };
      const sum = complexAdd(c1, c2);
      expect(sum.real).toBe(0);
      expect(sum.imag).toBe(0);

      const prob = probabilityFromAmplitude(c2);
      expect(prob).toBe(0.25);
    });

    it('verifies canonical Grover 2Q state evolution and reflection about the mean', () => {
      const { initial, superposition, oracle, diffuser, measurement } = GROVER_2Q_CANONICAL_MATH;

      // Ground state: |00> has 100% probability
      expect(initial.probabilities['00']).toBe(1.0);

      // Superposition: all states have 0.25 probability
      expect(superposition.probabilities['00']).toBe(0.25);
      expect(superposition.probabilities['11']).toBe(0.25);

      // Oracle: target |11> has negative phase, mean amplitude is 0.25
      expect(oracle.amplitudes['11'].real).toBe(-0.5);
      expect(oracle.meanAmplitude).toBe(0.25);
      expect(oracle.probabilities['11']).toBe(0.25);

      // Diffuser: reflection about mean 2(0.25) - (-0.5) = 1.0 for target
      expect(diffuser.amplitudes['11'].real).toBe(1.0);
      expect(diffuser.probabilities['11']).toBe(1.0);
      expect(diffuser.probabilities['00']).toBe(0.0);

      // Measurement: 100% collapse to |11>
      expect(measurement.probabilities['11']).toBe(1.0);
    });
  });

  describe('3. TeachingTargetResolver Semantic Targets', () => {
    it('resolves all Grover semantic targets without throwing', () => {
      const targets = [
        'gate-H',
        'qubit-q0',
        'qubit-q1',
        'grover-workspace',
        'target-state',
        'oracle-region',
        'diffuser-region',
        'probability-panel',
        'qsphere-panel',
        'simulation-button',
        'histogram',
        'measurement-result',
        'math-display',
      ];

      for (const targetId of targets) {
        const resolved = TeachingTargetResolver.resolve(targetId);
        expect(resolved).not.toBeNull();
        expect(resolved?.rect).not.toBeNull();
        expect(resolved?.rect?.x).toBeGreaterThan(0);
        expect(resolved?.rect?.y).toBeGreaterThan(0);
        expect(resolved?.rect?.width).toBeGreaterThan(0);
        expect(resolved?.rect?.height).toBeGreaterThan(0);
      }
    });
  });

  describe('4. Lesson Registry Integration', () => {
    it('registers grover-2q-11 and resolves all standard aliases', () => {
      const allIds = getLessonIds();
      expect(allIds).toContain('grover-2q-11');

      const primary = getLesson('grover-2q-11');
      expect(primary).toBeDefined();
      expect(primary?.id).toBe('grover-2q-11');

      // Aliases
      expect(getLesson('grover-2q')?.id).toBe('grover-2q-11');
      expect(getLesson('GROVER-2Q-11')?.id).toBe('grover-2q-11');
    });
  });

  describe('5. TeachingController Live Grover Execution', () => {
    it('initializes, executes gate additions, displays math cards, and builds the Grover circuit', async () => {
      const controller = new TeachingController(hooks);
      const loaded = await controller.loadLesson('grover-2q-11');
      expect(loaded).toBe(true);

      // Start lesson (Step 1: segment-1-initialization)
      await controller.start();
      expect(controller.getState().status).toBe('TEACHING');
      expect(controller.getState().currentStepIndex).toBe(0);
      expect(controller.getState().activeMathFormula?.formula).toContain('|00\\rangle');

      // Step 4 (index 3): segment-4-place-h0 (adds H to q0)
      await controller.jumpToStep(3);
      expect(controller.getState().currentStepIndex).toBe(3);
      expect(mockCircuit.gates.some((g) => g.gate.toLowerCase() === 'h' && g.targets.includes(0))).toBe(true);

      // Step 6 (index 5): segment-6-place-h1 (adds H to q1)
      await controller.jumpToStep(5);
      expect(mockCircuit.gates.filter((g) => g.gate.toLowerCase() === 'h')).toHaveLength(2);

      // Step 10 (index 9): segment-10-build-oracle (adds CZ to q0, q1)
      await controller.jumpToStep(9);
      expect(controller.getState().currentStepIndex).toBe(9);
      expect(mockCircuit.gates.some((g) => g.gate.toLowerCase() === 'cz')).toBe(true);
    });

    it('pauses at Socratic prediction checkpoint and correctly processes learner responses', async () => {
      const controller = new TeachingController(hooks);
      await controller.loadLesson(grover2q11Lesson);
      await controller.start();

      // Jump to Step 15 (index 14): Socratic prediction checkpoint
      await controller.jumpToStep(14);
      expect(controller.getState().status).toBe('WAITING_FOR_PREDICTION');
      expect(controller.getState().currentStep?.checkpoint?.id).toBe('pred-grover-final-measurement');

      // Learner selects the correct prediction (index 1: |11⟩ with 100% probability)
      await controller.submitPrediction(1);

      // Should automatically advance to Step 16 (index 15: Simulation execution)
      expect(controller.getState().currentStepIndex).toBe(15);
      expect(hooks.runSimulation).toHaveBeenCalled();
    });

    it('supports pause, resume, speed change, and mute controls during automated teaching', async () => {
      const controller = new TeachingController(hooks);
      await controller.loadLesson(grover2q11Lesson);
      await controller.start();

      controller.pause();
      expect(controller.getState().status).toBe('PAUSED');

      await controller.resume();
      expect(controller.getState().status).toBe('TEACHING');

      controller.setPlaybackSpeed(1.5);
      expect(controller.getState().playbackSpeed).toBe(1.5);

      controller.toggleMute();
      expect(controller.getState().isAudioMuted).toBe(true);
      controller.toggleMute();
      expect(controller.getState().isAudioMuted).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { s2GroverSearchLesson, groverAlgorithmLesson } from './s2-grover-search';
import { lessonRegistry } from '../../lessonRegistry';
import { validateLessonScript } from '../../lessonValidator';
import { TeachingController, type TeachingIDEHooks } from '../../teachingController';
import type { CircuitRequest, CircuitRunResponse } from '../../../circuit/types';

describe('Sprint 2: Grover Algorithm Live AI Tutor (14-Step Master Journey)', () => {
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
        execution_time_ms: 12,
        counts: { '11': 1000 },
        probabilities: { '00': 0.0, '01': 0.0, '10': 0.0, '11': 1.0 },
        statevector: [
          { real: 0.0, imag: 0.0 },
          { real: 0.0, imag: 0.0 },
          { real: 0.0, imag: 0.0 },
          { real: 1.0, imag: 0.0 },
        ],
      },
      visualization: {
        bloch: { x: 0.0, y: 0.0, z: -1.0, purity: 1.0, magnitude: 1.0 },
      },
      metrics: {
        gate_count: 12,
        depth: 7,
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
      clearToasts: vi.fn(),
      showToast: vi.fn(),
    };
  });

  it('1. passes validateLessonScript with zero errors', () => {
    const validation = validateLessonScript(s2GroverSearchLesson);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('2. has exactly 14 steps implementing the exact required learning journey', () => {
    expect(s2GroverSearchLesson.steps).toHaveLength(14);

    const stepTitles = s2GroverSearchLesson.steps.map((s) => s.title);
    expect(stepTitles[0]).toMatch(/Introduction/i);
    expect(stepTitles[1]).toMatch(/Problem/i);
    expect(stepTitles[2]).toMatch(/Prediction/i);
    expect(stepTitles[3]).toMatch(/Superposition|Gate Placement/i);
    expect(stepTitles[4]).toMatch(/Oracle/i);
    expect(stepTitles[5]).toMatch(/Probability/i);
    expect(stepTitles[6]).toMatch(/Diffuser/i);
    expect(stepTitles[7]).toMatch(/Q-Sphere|Bloch/i);
    expect(stepTitles[8]).toMatch(/Iteration/i);
    expect(stepTitles[9]).toMatch(/Simulation/i);
    expect(stepTitles[10]).toMatch(/Measurement/i);
    expect(stepTitles[11]).toMatch(/Interpretation/i);
    expect(stepTitles[12]).toMatch(/Socratic/i);
    expect(stepTitles[13]).toMatch(/Mastery/i);
  });

  it('3. is registered in lessonRegistry under both s2-grover-search and grover-algorithm', () => {
    const byId = lessonRegistry.getLesson('s2-grover-search');
    const byAlias = lessonRegistry.getLesson('grover-algorithm');
    const byShort = lessonRegistry.getLesson('grover');

    expect(byId).toBeDefined();
    expect(byId?.id).toBe('s2-grover-search');
    expect(byAlias).toBeDefined();
    expect(byAlias?.id).toBe('s2-grover-search');
    expect(byShort).toBeDefined();
    expect(byShort?.id).toBe('s2-grover-search');
  });

  it('4. groverAlgorithmLesson is identical to s2GroverSearchLesson', () => {
    expect(groverAlgorithmLesson).toBe(s2GroverSearchLesson);
  });

  it('5. starts at Step 1 and executes deterministic actions', async () => {
    const ctrl = new TeachingController(hooks);
    const loaded = await ctrl.loadLesson(s2GroverSearchLesson);
    expect(loaded).toBe(true);

    await ctrl.start();
    const st = ctrl.getState();

    expect(st.currentStepIndex).toBe(0);
    expect(st.status).toBe('TEACHING');
    expect(st.currentStep?.narrationText).toContain("Welcome to the Grover's Algorithm Masterclass");
    expect(st.narrationText).toContain("Quantum Search & Grover's Algorithm");
  });

  it('6. Step 3 Prediction halts playback until learner answers', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(s2GroverSearchLesson);
    await ctrl.jumpToStep(2); // Step 3 (index 2)

    const st = ctrl.getState();
    expect(st.status).toBe('WAITING_FOR_PREDICTION');
    expect(st.currentStep?.checkpoint?.id).toBe('pred-grover-queries');
    expect(st.currentStep?.checkpoint?.correctOptionIndex).toBe(1);

    // Submitting answer index 1 advances to Step 4
    await ctrl.submitPrediction(1);
    expect(ctrl.getState().currentStepIndex).toBe(3);
  });

  it('7. Step 4 places H gates on both qubits and runs simulation', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(s2GroverSearchLesson);
    await ctrl.jumpToStep(3); // Step 4 (index 3)

    expect(hooks.updateCircuit).toHaveBeenCalled();
    expect(mockCircuit.gates.some((g) => g.gate === 'h' && g.targets.includes(0))).toBe(true);
    expect(mockCircuit.gates.some((g) => g.gate === 'h' && g.targets.includes(1))).toBe(true);
    expect(hooks.runSimulation).toHaveBeenCalled();
  });

  it('8. Step 5 places Controlled-Z Oracle and highlights it', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(s2GroverSearchLesson);
    await ctrl.jumpToStep(4); // Step 5 (index 4)

    expect(mockCircuit.gates.some((g) => g.gate === 'cz' && g.id === 'grover-oracle-cz')).toBe(true);
    expect(hooks.highlightGate).toHaveBeenCalledWith('grover-oracle-cz');
  });

  it('9. Step 6 focuses results to demonstrate probability invariance (25% each)', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(s2GroverSearchLesson);
    await ctrl.jumpToStep(5); // Step 6 (index 5)

    expect(hooks.focusVisualization).toHaveBeenCalledWith('results');
    expect(hooks.clearHighlights).toHaveBeenCalled();
  });

  it('10. Step 7 constructs full Diffuser (H-X-CZ-X-H) and runs simulation', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(s2GroverSearchLesson);
    await ctrl.jumpToStep(6); // Step 7 (index 6)

    const gateTypes = mockCircuit.gates.map((g) => g.gate);
    expect(gateTypes).toContain('h');
    expect(gateTypes).toContain('x');
    expect(gateTypes).toContain('cz');
    expect(hooks.runSimulation).toHaveBeenCalled();
  });

  it('11. Step 8 focuses Q-Sphere visualization', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(s2GroverSearchLesson);
    await ctrl.jumpToStep(7); // Step 8 (index 7)

    expect(hooks.focusVisualization).toHaveBeenCalledWith('qsphere');
  });

  it('12. Step 10 executes simulation and Step 11 shows 100% histogram collapse on |11⟩', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(s2GroverSearchLesson);
    await ctrl.jumpToStep(10); // Step 11 (index 10)

    expect(hooks.focusVisualization).toHaveBeenCalledWith('results');
    expect(ctrl.getState().currentStep?.explanation).toContain('100%');
  });

  it('13. Step 13 Socratic Check evaluates understanding and advances', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(s2GroverSearchLesson);
    await ctrl.jumpToStep(12); // Step 13 (index 12)

    const st = ctrl.getState();
    expect(st.status).toBe('WAITING_FOR_PREDICTION');
    expect(st.currentStep?.checkpoint?.id).toBe('pred-grover-mechanism');
    expect(st.currentStep?.checkpoint?.correctOptionIndex).toBe(1);

    // Learner responds with index 1
    await ctrl.submitPrediction(1);
    expect(ctrl.getState().currentStepIndex).toBe(13);
  });

  it('14. Step 14 completes lesson and awards +300 XP', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(s2GroverSearchLesson);
    await ctrl.jumpToStep(13); // Step 14 (index 13)

    expect(ctrl.getState().status).toBe('COMPLETED');
    expect(hooks.showToast).toHaveBeenCalledWith(
      'success',
      expect.stringContaining('+300 XP')
    );
  });

  it('15. supports play, pause, resume, replay, speed and mute controls seamlessly', async () => {
    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson(s2GroverSearchLesson);
    await ctrl.start();

    // Pause
    ctrl.pause();
    expect(ctrl.getState().status).toBe('PAUSED');

    // Resume
    await ctrl.resume();
    expect(ctrl.getState().status).toBe('TEACHING');

    // Speed
    ctrl.setPlaybackSpeed(1.5);
    expect(ctrl.getState().playbackSpeed).toBe(1.5);

    // Mute
    ctrl.setAudioMuted(true);
    expect(ctrl.getState().isAudioMuted).toBe(true);

    // Replay restarts at Step 0
    await ctrl.jumpToStep(5);
    expect(ctrl.getState().currentStepIndex).toBe(5);
    await ctrl.replay();
    expect(ctrl.getState().currentStepIndex).toBe(0);
  });
});

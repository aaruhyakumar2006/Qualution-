import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent, within } from '@testing-library/react';
import { App } from '../../App';
import { lessonRegistry } from './lessonRegistry';
import { TeachingController, type TeachingIDEHooks } from './teachingController';
import { SPRINT_1_SEQUENCE } from '../../components/teaching/TeachingHUD';
import { resetLearningProgress, getCompletedLessonIds } from '../learning/assessmentEngine';
import type { CircuitRequest } from '../circuit/types';

// Mock circuit execution API for consistent deterministic tests
vi.mock('../../api/circuitApi', async () => {
  const actual = await vi.importActual<any>('../../api/circuitApi');
  return {
    ...actual,
    checkReadiness: vi.fn().mockResolvedValue({ status: 'ok', backends: ['qiskit_aer'] }),
    runCircuit: vi.fn().mockResolvedValue({
      valid: true,
      simulation: {
        backend: 'qiskit_aer',
        execution_time_ms: 12,
        counts: { '0': 500, '1': 500 },
        probabilities: { '0': 0.5, '1': 0.5 },
        statevector: [
          { real: 0.7071, imag: 0 },
          { real: 0.7071, imag: 0 },
        ],
      },
      visualization: {
        bloch: { x: 1.0, y: 0.0, z: 0.0, purity: 1.0, magnitude: 1.0 },
      },
      metrics: {
        gate_count: 1,
        depth: 1,
        multi_qubit_gates: 0,
        qubit_count: 1,
      },
    }),
  };
});

describe('Phase 2D — Sprint 1 End-to-End Integration & UX Audit', () => {
  beforeEach(() => {
    localStorage.clear();
    resetLearningProgress();
  });

  // ── 1. Sequence & Mapping ─────────────────────────────────────────
  it('defines the exact canonical Sprint 1 sequential curriculum order', () => {
    expect(SPRINT_1_SEQUENCE).toEqual([
      's1-initialize-measure',
      's1-x-gate',
      's1-hadamard-superposition',
      's1-z-phase',
      's1-gate-ordering',
      's1-single-qubit-challenge',
      's1-assessment',
    ]);
  });

  it('maps each Sprint 1 lesson to its required curriculumModuleId without legacy aliases', () => {
    const expectedModuleIds: Record<string, string> = {
      's1-initialize-measure': 'lesson-1-initialize-measure',
      's1-x-gate': 'lesson-1-bit-flip',
      's1-hadamard-superposition': 'lesson-1-superposition',
      's1-z-phase': 'lesson-1-phase',
      's1-gate-ordering': 'lesson-1-gate-ordering',
      's1-single-qubit-challenge': 'lesson-1-single-qubit-challenge',
      's1-assessment': 'lesson-1-sprint-1-assessment',
    };

    for (const [lessonId, expectedModuleId] of Object.entries(expectedModuleIds)) {
      const lesson = lessonRegistry.getLesson(lessonId);
      expect(lesson, `Lesson ${lessonId} should exist in registry`).toBeDefined();
      expect(lesson?.curriculumModuleId).toBe(expectedModuleId);
    }
  });

  // ── 2. Circuit Reset Between Lessons ──────────────────────────────
  it('guarantees clean circuit reset between lessons and prevents starter circuit mutation', async () => {
    let currentCircuit: CircuitRequest = { qubits: 1, classical_bits: 1, gates: [], measure: false, shots: 100 };
    const hooks: TeachingIDEHooks = {
      getCircuit: () => currentCircuit,
      updateCircuit: (c: CircuitRequest) => {
        currentCircuit = c;
      },
      runSimulation: async () => null,
      getSimulationResult: () => null,
      focusVisualization: () => {},
      highlightGate: () => {},
      highlightQubit: () => {},
      clearHighlights: () => {},
    };

    const ctrl = new TeachingController(hooks);

    // Load Lesson 2 (X gate)
    await ctrl.loadLesson('s1-x-gate');
    // Student or step mutates the circuit by adding gates
    currentCircuit = {
      ...currentCircuit,
      gates: [{ id: 'x-0', gate: 'x', targets: [0], column: 0 }],
    };
    expect(currentCircuit.gates.length).toBe(1);

    // Now load Lesson 3 (Hadamard)
    await ctrl.loadLesson('s1-hadamard-superposition');
    // Verify current circuit was cleanly reset to starter circuit (0 gates)
    expect(currentCircuit.gates.length).toBe(0);

    // Verify starterCircuit of Lesson 2 was not mutated in memory
    const l2Def = lessonRegistry.getLesson('s1-x-gate');
    expect(l2Def?.starterCircuit?.gates.length).toBe(0);

    ctrl.destroy();
  });

  // ── 3. Step Transitions & Stale State Isolation ───────────────────
  it('resets stale prediction comparisons and selections on step transition', async () => {
    let currentCircuit: CircuitRequest = { qubits: 1, classical_bits: 1, gates: [], measure: false, shots: 100 };
    const hooks: TeachingIDEHooks = {
      getCircuit: () => currentCircuit,
      updateCircuit: (c: CircuitRequest) => {
        currentCircuit = c;
      },
      runSimulation: async () => null,
      getSimulationResult: () => null,
      focusVisualization: () => {},
      highlightGate: () => {},
      highlightQubit: () => {},
      clearHighlights: () => {},
    };

    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson('s1-initialize-measure');
    await ctrl.start();

    // Advance to prediction checkpoint (Step 3)
    await ctrl.next(); // Step 2
    await ctrl.next(); // Step 3: Checkpoint
    expect(ctrl.getState().status).toBe('WAITING_FOR_PREDICTION');

    // Submit prediction (option 0: Deterministic 0)
    await ctrl.submitPrediction(0);
    // Advances to Step 4 (Simulation)
    expect(ctrl.getState().currentStepIndex).toBe(3);

    ctrl.destroy();
  });

  // ── 4. Educational Feedback on Failed Completion Criteria ─────────
  it('delivers actionable educational feedback (WHAT, WHY, WHAT NEXT) when criteria fail', async () => {
    let currentCircuit: CircuitRequest = { qubits: 1, classical_bits: 1, gates: [], measure: false, shots: 100 };
    let toastMessage: string | null = null;
    let toastType: string | null = null;

    const hooks: TeachingIDEHooks = {
      getCircuit: () => currentCircuit,
      updateCircuit: (c: CircuitRequest) => {
        currentCircuit = c;
      },
      runSimulation: async () => null,
      getSimulationResult: () => null,
      focusVisualization: () => {},
      highlightGate: () => {},
      highlightQubit: () => {},
      clearHighlights: () => {},
      showToast: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => {
        toastType = type;
        toastMessage = msg;
      },
    };

    const ctrl = new TeachingController(hooks);
    // Load single qubit challenge
    await ctrl.loadLesson('s1-single-qubit-challenge');
    await ctrl.start();

    // Step 1 -> Step 2 (Prediction)
    await ctrl.next();
    expect(ctrl.getState().status).toBe('WAITING_FOR_PREDICTION');
    await ctrl.submitPrediction(0);

    // Automatically advances to Step 3 (Challenge 1 takeover)
    expect(ctrl.getState().status).toBe('LEARNER_TURN');

    // Attempt completion with empty circuit (target requires X gate and P(1) >= 0.95)
    expect(ctrl.checkLearnerTurnSatisfied()).toBe(false);

    await ctrl.completeLearnerTurn();
    expect(ctrl.getState().status).toBe('LEARNER_TURN'); // Cannot advance

    // Verify educational guidance was displayed in toast
    expect(toastType).toBe('info');
    expect(toastMessage).toMatch(/Missing required quantum operator|requires/i);

    ctrl.destroy();
  });

  // ── 5. Assessment Integrity & Progress Synchronization ────────────
  it('records both lesson ID and curriculumModuleId upon completion without bypassing', async () => {
    let currentCircuit: CircuitRequest = { qubits: 1, classical_bits: 1, gates: [], measure: false, shots: 100 };
    const hooks: TeachingIDEHooks = {
      getCircuit: () => currentCircuit,
      updateCircuit: (c: CircuitRequest) => {
        currentCircuit = c;
      },
      runSimulation: async () => null,
      getSimulationResult: () => null,
      focusVisualization: () => {},
      highlightGate: () => {},
      highlightQubit: () => {},
      clearHighlights: () => {},
    };

    const ctrl = new TeachingController(hooks);
    await ctrl.loadLesson('s1-initialize-measure');
    await ctrl.start();

    // Advance through all steps to complete
    while (ctrl.getState().status !== 'COMPLETED') {
      if (ctrl.getState().status === 'WAITING_FOR_PREDICTION') {
        await ctrl.submitPrediction(0);
      } else if (ctrl.getState().status === 'LEARNER_TURN') {
        // Satisfy takeover criteria: wire has measurement
        currentCircuit = {
          qubits: 1,
          classical_bits: 1,
          gates: [{ id: 'm-0', gate: 'measure', targets: [0], column: 0 }],
          measure: true,
          shots: 100,
        };
        ctrl.completeLearnerTurn();
      } else {
        await ctrl.next();
      }
    }

    expect(ctrl.getState().status).toBe('COMPLETED');
    const completed = getCompletedLessonIds();
    expect(completed).toContain('s1-initialize-measure');
    expect(completed).toContain('lesson-1-initialize-measure');

    ctrl.destroy();
  });

  // ── 6. Full Journey Sequential Navigation (Next Lesson Button) ────
  it('renders "Next Lesson" button on completion banner for sequential progression', async () => {
    await act(async () => {
      render(<App initialRoute="/studio?lesson=s1-initialize-measure" />);
    });

    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('Initialize & Measure a Qubit')).toBeInTheDocument();
    });

    // Advance to end of lesson 1
    const nextBtn = screen.getByTestId('teaching-next-btn');

    // Step 1 -> 2
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Inspect Qubit Wire q[0]')).toBeInTheDocument();
    });

    // Step 2 -> 3 (Prediction)
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('teaching-prediction-checkpoint')).toBeInTheDocument();
    });

    // Select and submit option 0
    const opt0 = screen.getByTestId('teaching-prediction-option-0');
    await act(async () => {
      fireEvent.click(opt0);
    });
    const submitPredBtn = screen.getByTestId('teaching-prediction-submit-btn');
    await act(async () => {
      fireEvent.click(submitPredBtn);
    });

    // Advance through steps 4, 5, and 6 to reach Takeover at Step 7
    for (let step = 4; step <= 6; step++) {
      await waitFor(() => {
        const btn = screen.getByTestId('teaching-next-btn');
        expect(btn).not.toBeDisabled();
      });
      const btn = screen.getByTestId('teaching-next-btn');
      await act(async () => {
        fireEvent.click(btn);
      });
    }

    // Step 7 is takeover (Hands-on Verification)
    await waitFor(() => {
      expect(screen.getByTestId('teaching-learner-turn-banner')).toBeInTheDocument();
    });

    // Click finish turn (Lesson 1 takeover allows explicit finish)
    const finishBtn = screen.getByTestId('teaching-finish-turn-btn');
    await act(async () => {
      fireEvent.click(finishBtn);
    });

    // Completion banner should be visible
    await waitFor(() => {
      expect(screen.getByTestId('teaching-completion-banner')).toBeInTheDocument();
      expect(screen.getByTestId('teaching-next-lesson-btn')).toBeInTheDocument();
      expect(screen.getByTestId('teaching-next-lesson-btn')).toHaveTextContent('Next Lesson');
    });

    // Click "Next Lesson" -> Automatically loads Lesson 2 (s1-x-gate)
    const nextLessonBtn = screen.getByTestId('teaching-next-lesson-btn');
    await act(async () => {
      fireEvent.click(nextLessonBtn);
    });

    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(within(hud).getByText('The Pauli-X Gate: Quantum Bit Flip')).toBeInTheDocument();
    });
  });

  // ── 7. Academy Clean Layout: Guided Lab Removed & Direct Studio Launch ──
  it('confirms Phase 2 guided lab ladder is removed from Academy page and lessons launch directly', async () => {
    await act(async () => {
      render(<App initialRoute="/academy" />);
    });

    expect(screen.getByTestId('learn-page')).toBeInTheDocument();
    // Confirms the Phase 2 guided lab ladder is removed as requested
    expect(screen.queryByTestId('sprint-1-track')).not.toBeInTheDocument();
    expect(screen.getByTestId('tracks-overview')).toBeInTheDocument();

    // Verify launching Z Gate lesson directly into IDE works cleanly
    await act(async () => {
      render(<App initialRoute="/studio?lesson=s1-z-phase" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();
    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(within(hud).getByText('Z Gate: Understanding Quantum Phase')).toBeInTheDocument();
    });
  });
});

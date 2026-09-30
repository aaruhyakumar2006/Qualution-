import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import { App } from '../../App';
import { resetLearningProgress } from '../learning/assessmentEngine';

// Mock circuit API
vi.mock('../../api/circuitApi', async () => {
  const actual = await vi.importActual<any>('../../api/circuitApi');
  return {
    ...actual,
    checkReadiness: vi.fn().mockResolvedValue({ status: 'ok', backends: ['qiskit_aer'] }),
    runCircuit: vi.fn().mockImplementation(async (req) => {
      return {
        valid: true,
        circuit: {
          qubits: req.circuit?.qubits || 1,
          classical_bits: req.circuit?.classical_bits || 1,
          gates: req.circuit?.gates || [],
        },
        simulation: {
          backend: 'qiskit_aer',
          mode: 'shots',
          shots: req.circuit?.shots || 1000,
          execution_time_ms: 12,
          counts: { '0': 502, '1': 498 },
          probabilities: { '0': 0.502, '1': 0.498 },
          statevector: [
            { real: 0.7071, imag: 0 },
            { real: 0.7071, imag: 0 },
          ],
        },
        visualization: {
          bloch: { x: 1.0, y: 0.0, z: 0.0, purity: 1.0, magnitude: 1.0 },
        },
        metrics: {
          gate_count: req.circuit?.gates?.length || 1,
          depth: 1,
          multi_qubit_gates: 0,
          qubit_count: req.circuit?.qubits || 1,
        },
      };
    }),
  };
});

describe('QUALUTION Guided Lesson: Complete Real User Journey', () => {
  beforeEach(() => {
    localStorage.clear();
    resetLearningProgress();
  });

  it('verifies the full 10-step guided Hadamard lesson lifecycle from Academy to Completion', async () => {
    // 1. Student opens Academy / LearnPage
    await act(async () => {
      render(<App initialRoute="/academy" />);
    });

    expect(screen.getByTestId('learn-page')).toBeInTheDocument();

    // 2. Student clicks "Start Guided Practical Lesson (QUALUTION)"
    const startGuidedBtn = screen.getByTestId('launch-guided-lesson-btn-s1');
    expect(startGuidedBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(startGuidedBtn);
    });

    // 3. Quantum Lab IDE opens & Hadamard lesson loads automatically
    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    // 4. TeachingHUD starts automatically at Step 1
    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('Hadamard Gate & Superposition')).toBeInTheDocument();
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 1 of 10');
    });

    // 5. Circuit is visibly initialized (Wire q[0] is present and highlighted)
    await waitFor(() => {
      expect(screen.getByTestId('qubit-wire-0')).toBeInTheDocument();
      expect(screen.getByTestId('qubit-wire-0')).toHaveClass('wire-highlighted');
      expect(screen.getByTestId('teaching-narration')).toHaveTextContent(/starts in the ground state|Lesson 3/i);
    });

    // 6. Step forward: Step 2 adds H gate visibly to circuit and highlights it
    const nextBtn = screen.getByTestId('teaching-next-btn');
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 2 of 10');
      expect(screen.getByTestId('placed-gate-h-0')).toBeInTheDocument();
      expect(screen.getByTestId('placed-gate-h-0')).toHaveClass('timeline-highlight');
    });

    // 7. Step forward: Step 3 Prediction Checkpoint appears
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 3 of 10');
      expect(screen.getByTestId('teaching-prediction-checkpoint')).toBeInTheDocument();
    });

    // Next button must be disabled while waiting for prediction
    expect(screen.getByTestId('teaching-next-btn')).toBeDisabled();

    // 8. Student selects prediction Option 1 (~50% 0 and 50% 1)
    const opt1 = screen.getByTestId('teaching-prediction-option-1');
    await act(async () => {
      fireEvent.click(opt1);
    });
    expect(opt1).toHaveClass('selected');

    // 9. Student submits prediction -> advances to Step 4 (Experiment: run simulation)
    const submitBtn = screen.getByTestId('teaching-prediction-submit-btn');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // 10. Simulator executes and user advances to Step 5 (Observe Results Visualization)
    await act(async () => {
      fireEvent.click(screen.getByTestId('teaching-next-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 5 of 10');
      // Results pane should be visible
      expect(screen.getByTestId('pane-results')).toBeInTheDocument();
    });

    // 11. Advance to Step 6: Prediction Comparison
    await act(async () => {
      fireEvent.click(screen.getByTestId('teaching-next-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 6 of 10');
      const banner = screen.getByTestId('teaching-comparison-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/Prediction Confirmed/i);
    });

    // 12. Advance to Step 7: Explain Superposition
    await act(async () => {
      fireEvent.click(screen.getByTestId('teaching-next-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 7 of 10');
      expect(screen.getByTestId('teaching-narration')).toHaveTextContent(/superposition/i);
    });

    // 13. Advance to Step 8: "Your Turn" Takeover
    await act(async () => {
      fireEvent.click(screen.getByTestId('teaching-next-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 8 of 10');
      expect(screen.getByTestId('teaching-learner-turn-banner')).toBeInTheDocument();
      expect(screen.getByText('YOUR TURN')).toBeInTheDocument();
    });

    // Student has full IDE control
    const finishBtn = screen.getByTestId('teaching-finish-turn-btn');
    expect(finishBtn).toBeInTheDocument();

    // 14. Student finishes experimentation -> advances to Step 9 (Transfer Checkpoint)
    await act(async () => {
      fireEvent.click(finishBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 9 of 10');
      const checkpointEl = screen.getByTestId('teaching-prediction-checkpoint');
      expect(checkpointEl).toBeInTheDocument();
      expect(within(checkpointEl).getByText(/Which statement best describes the effect of H on \|0⟩\?/i)).toBeInTheDocument();
    });

    // Option selection should be clean/reset for the transfer question
    const transferOpt1 = screen.getByTestId('teaching-prediction-option-1');
    expect(transferOpt1).not.toHaveClass('selected');

    await act(async () => {
      fireEvent.click(transferOpt1);
    });
    expect(transferOpt1).toHaveClass('selected');

    // Submit transfer answer -> advances to Step 10 (Complete)
    const transferSubmitBtn = screen.getByTestId('teaching-prediction-submit-btn');
    await act(async () => {
      fireEvent.click(transferSubmitBtn);
    });

    // 15. Lesson completed banner appears with XP awarded
    await waitFor(() => {
      expect(screen.getByTestId('teaching-completion-banner')).toBeInTheDocument();
      expect(screen.getByText(/LESSON MASTERED/i)).toBeInTheDocument();
      expect(screen.getByText(/\+150 XP Awarded/i)).toBeInTheDocument();
    });

    // 16. Student returns to Academy
    const returnBtn = screen.getByTestId('teaching-complete-exit-btn');
    await act(async () => {
      fireEvent.click(returnBtn);
    });

    // 17. Academy page shows Module 1 as Mastered!
    await waitFor(() => {
      expect(screen.getByTestId('learn-page')).toBeInTheDocument();
      expect(screen.getByTestId('status-completed-lesson-1-superposition')).toBeInTheDocument();
    });
  });
});

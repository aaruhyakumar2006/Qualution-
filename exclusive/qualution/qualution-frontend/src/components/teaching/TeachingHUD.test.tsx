import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within, waitFor } from '@testing-library/react';
import { TeachingHUD } from './TeachingHUD';
import { TeachingController } from '../../features/teaching/teachingController';
import { s1HadamardSuperpositionLesson } from '../../features/teaching/lessons/s1HadamardSuperposition';

describe('TeachingHUD Component', () => {
  let controller: TeachingController;
  let hooks: any;

  beforeEach(async () => {
    hooks = {
      getCircuit: vi.fn(() => ({ qubits: 1, classical_bits: 1, gates: [], measure: true, shots: 1000 })),
      updateCircuit: vi.fn(),
      runSimulation: vi.fn(async () => ({
        valid: true,
        simulation: { backend: 'qiskit_aer', probabilities: { '0': 0.5, '1': 0.5 } },
      })),
      getSimulationResult: vi.fn(() => ({
        valid: true,
        simulation: { backend: 'qiskit_aer', probabilities: { '0': 0.5, '1': 0.5 } },
      })),
      focusVisualization: vi.fn(),
      highlightGate: vi.fn(),
      highlightQubit: vi.fn(),
      clearHighlights: vi.fn(),
      showToast: vi.fn(),
    };

    controller = new TeachingController(hooks);
    await controller.loadLesson(s1HadamardSuperpositionLesson);
  });

  it('renders lesson title, sprint badge, and step indicator', async () => {
    await controller.start();
    render(<TeachingHUD controller={controller} />);

    expect(screen.getByTestId('teaching-hud')).toBeInTheDocument();
    expect(screen.getByText('Hadamard Gate & Superposition')).toBeInTheDocument();
    expect(screen.getByText('Sprint 1')).toBeInTheDocument();
    expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 1 of');
    expect(screen.getByTestId('teaching-narration')).toBeInTheDocument();
  });

  it('toggles audio mute/unmute when clicking speaker button', async () => {
    await controller.start();
    render(<TeachingHUD controller={controller} />);

    const muteBtn = screen.getByTestId('teaching-mute-btn');
    expect(muteBtn).toBeInTheDocument();

    fireEvent.click(muteBtn);
    expect(controller.getState().isAudioMuted).toBe(true);

    fireEvent.click(muteBtn);
    expect(controller.getState().isAudioMuted).toBe(false);
  });

  it('interacts with Play/Pause, Next, and Restart controls', async () => {
    await controller.start();
    render(<TeachingHUD controller={controller} />);

    // Click Pause
    const playPauseBtn = screen.getByTestId('teaching-play-pause-btn');
    fireEvent.click(playPauseBtn);
    expect(controller.getState().status).toBe('PAUSED');

    // Click Resume
    fireEvent.click(screen.getByTestId('teaching-play-pause-btn'));
    expect(controller.getState().status).toBe('TEACHING');

    // Click Next
    const nextBtn = screen.getByTestId('teaching-next-btn');
    await act(async () => {
      fireEvent.click(nextBtn);
    });
    expect(controller.getState().currentStepIndex).toBe(1);

    // Click Restart
    const restartBtn = screen.getByTestId('teaching-restart-btn');
    await act(async () => {
      fireEvent.click(restartBtn);
    });
    expect(controller.getState().currentStepIndex).toBe(0);
  });

  it('renders prediction checkpoint card and allows learner to select and submit prediction', async () => {
    await controller.start();
    // Advance to step 3 (prediction checkpoint, index 2)
    await controller.jumpToStep(2);

    render(<TeachingHUD controller={controller} />);

    const checkpointEl = screen.getByTestId('teaching-prediction-checkpoint');
    expect(checkpointEl).toBeInTheDocument();
    expect(
      within(checkpointEl).getByText(/what measurement distribution do you expect/i)
    ).toBeInTheDocument();

    const submitBtn = screen.getByTestId('teaching-prediction-submit-btn');
    expect(submitBtn).toBeDisabled();

    // Select option 1 (50% |0⟩ and 50% |1⟩)
    const opt1 = screen.getByTestId('teaching-prediction-option-1');
    fireEvent.click(opt1);
    expect(submitBtn).not.toBeDisabled();

    // Submit prediction
    await act(async () => {
      fireEvent.click(submitBtn);
    });
    expect(controller.getState().selectedPredictionIndex).toBe(1);
  });

  it('reveals progressive hints and shows custom action label during challenge takeover', async () => {
    const { s1SingleQubitChallengeLesson } = await import(
      '../../features/teaching/lessons/sprint-01/single-qubit-challenge'
    );
    await controller.loadLesson(s1SingleQubitChallengeLesson);
    await controller.start();

    // Step 3: Challenge 1 takeover (index 2)
    await controller.jumpToStep(2, { force: true });

    render(<TeachingHUD controller={controller} />);

    const takeoverEl = screen.getByTestId('teaching-learner-turn-banner');
    expect(takeoverEl).toBeInTheDocument();

    // Action button label should be custom
    const submitChallengeBtn = screen.getByTestId('teaching-finish-turn-btn');
    expect(submitChallengeBtn).toHaveTextContent('Submit Challenge 1');

    // Hint button should be present
    const hintBtn = screen.getByTestId('teaching-hint-btn');
    expect(hintBtn).toHaveTextContent('Need a Hint?');

    // Click hint button to reveal Hint 1
    fireEvent.click(hintBtn);
    const hintContent = screen.getByTestId('teaching-hint-content');
    expect(hintContent).toBeInTheDocument();
    expect(hintContent).toHaveTextContent('Hint 1: Think about the gate that flips the computational-basis value.');
    expect(hintBtn).toHaveTextContent('Hint (1/2)');

    // Click hint button again to reveal Hint 2
    fireEvent.click(hintBtn);
    expect(screen.getByTestId('teaching-hint-content')).toHaveTextContent(
      'Hint 2: Which gate maps |0⟩ directly to |1⟩?'
    );
    expect(hintBtn).toHaveTextContent('Hint (2/2)');
  });

  it('updates Erwin speech bubble in response to real teachingController signals', async () => {
    await controller.start();
    await controller.jumpToStep(2, { force: true }); // Prediction checkpoint

    render(<TeachingHUD controller={controller} />);
    const erwinBubble = screen.getByTestId('teaching-erwin-bubble');
    expect(erwinBubble).toHaveClass('teaching-erwin-bubble--idle');
    expect(erwinBubble).toHaveTextContent('Ready when you are.');

    // 1. Submit wrong prediction (index 0 is wrong for hadamard checkpoint)
    const wrongOptionBtn = screen.getByTestId('teaching-prediction-option-0');
    fireEvent.click(wrongOptionBtn);
    const submitBtn = screen.getByTestId('teaching-prediction-submit-btn');

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Erwin reacts to real incorrect prediction event with real corrective text
    expect(erwinBubble).toHaveClass('teaching-erwin-bubble--incorrect');
    expect(erwinBubble.textContent).toContain('State remains completely deterministic');

    // Reverts to idle after 1 second
    await waitFor(() => {
      expect(erwinBubble).toHaveClass('teaching-erwin-bubble--idle');
    }, { timeout: 2000 });

    // 2. Jump back to prediction checkpoint and submit correct prediction (index 1)
    await act(async () => {
      await controller.jumpToStep(2, { force: true });
    });

    const correctOptionBtn = screen.getByTestId('teaching-prediction-option-1');
    fireEvent.click(correctOptionBtn);
    const submitBtn2 = screen.getByTestId('teaching-prediction-submit-btn');

    await act(async () => {
      fireEvent.click(submitBtn2);
    });

    // Erwin reacts to real correct prediction event with positive acknowledgment
    expect(erwinBubble).toHaveClass('teaching-erwin-bubble--correct');
    expect(erwinBubble).toHaveTextContent("Nice — that's right.");

    // Reverts to idle after 1 second
    await waitFor(() => {
      expect(erwinBubble).toHaveClass('teaching-erwin-bubble--idle');
    }, { timeout: 2000 });
  });
});

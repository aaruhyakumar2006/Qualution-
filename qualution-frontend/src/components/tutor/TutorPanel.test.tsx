import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TutorPanel } from './TutorPanel';
import type { CircuitRequest, CircuitRunResponse, Gate } from '../../features/circuit/types';
import * as tutorEngineModule from '../../features/tutor/tutorEngine';

vi.mock('../../features/tutor/tutorEngine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../features/tutor/tutorEngine')>();
  return {
    ...actual,
    streamTutorQuestion: vi.fn(actual.streamTutorQuestion),
    answerTutorQuestion: vi.fn(actual.answerTutorQuestion),
  };
});

describe('TutorPanel Component', () => {
  const bellCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { gate: 'h', targets: [0], column: 0 },
      { gate: 'cx', targets: [0, 1], column: 1 },
    ],
    measure: true,
    shots: 1000,
  };

  const mockRunResponse: CircuitRunResponse = {
    circuit: { qubits: 2, classical_bits: 2, gate_count: 2, measure: true, shots: 1000 },
    routing: { requested_backend: 'auto', selected_backend: 'qiskit_aer', framework: 'qiskit', policy: 'lowest_measured_latency', reason: 'ok' },
    simulation: {
      backend: 'qiskit_aer',
      mode: 'shots',
      shots: 1000,
      probabilities: { '00': 0.504, '11': 0.496 },
      execution_time_ms: 1.45,
    },
    visualization: { bloch: null, timeline: null, timeline_notice: null },
    execution_time_ms: 2.34,
  };

  const selectedHGate: Gate = {
    id: 'g-h-0',
    gate: 'h',
    targets: [0],
    column: 0,
  };

  it('renders TutorPanel with initial welcome and circuit context', () => {
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    expect(screen.getByTestId('tutor-panel')).toBeInTheDocument();
    expect(screen.getByText('AI Quantum Tutor')).toBeInTheDocument();
    expect(screen.getAllByText(/Bell State/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('tutor-messages-stream')).toBeInTheDocument();
    expect(screen.getByTestId('tutor-nvidia-badge')).toBeInTheDocument();
  });

  it('switches tutor modes (Debug, Predict, Compare, Experiment)', async () => {
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    const debugBtn = screen.getByTestId('mode-debug');
    await userEvent.click(debugBtn);
    expect(debugBtn).toHaveClass('active');

    const predictBtn = screen.getByTestId('mode-predict');
    await userEvent.click(predictBtn);
    expect(predictBtn).toHaveClass('active');

    const compareBtn = screen.getByTestId('mode-compare');
    await userEvent.click(compareBtn);
    expect(compareBtn).toHaveClass('active');
  });

  it('asks a question via suggested topic and displays facts and action buttons', async () => {
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    // Hover over suggestions box to reveal them
    const suggBox = screen.getByText(/Suggested Topics/).closest('.tutor-suggestions-box');
    fireEvent.mouseEnter(suggBox!);

    // Click suggested question 0
    const sugg0 = await screen.findByTestId('quick-sugg-0');
    await userEvent.click(sugg0);

    // Verify assistant answer appears
    await waitFor(() => {
      expect(screen.getByText(/Ground Truth Quantum Facts/i)).toBeInTheDocument();
      expect(screen.getByTestId('tutor-action-open_state')).toBeInTheDocument();
    });

    // Click an action button
    const actionBtn = screen.getByTestId('tutor-action-open_state');
    await userEvent.click(actionBtn);
    expect(onSelectTab).toHaveBeenCalledWith('state');
  });

  it('submits a custom typed question and displays structured response', async () => {
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    const input = screen.getByTestId('tutor-input');
    await userEvent.type(input, 'What does the CX gate do?');

    const form = screen.getByTestId('tutor-form');
    fireEvent.submit(form);

    await waitFor(() => {
      const msgs = screen.getByTestId('tutor-messages-stream');
      expect(msgs.textContent).toContain('Controlled-NOT');
    });
  });

  it('updates contextual quick actions when a gate is selected', () => {
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={selectedHGate}
        onSelectTab={onSelectTab}
      />
    );

    // Should display circuit-aware contextual actions for H gate
    expect(screen.getByText(/What does H on q0 do\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Predict state outcome/i)).toBeInTheDocument();
  });

  it('interacts with Predict -> Simulate -> Compare flow', async () => {
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    // Switch to predict mode
    const predictBtn = screen.getByTestId('mode-predict');
    await userEvent.click(predictBtn);

    // Expect predict flow card
    expect(screen.getByText(/Predict → Simulate → Compare/i)).toBeInTheDocument();

    // Click quick prediction pill
    const pill = screen.getByText('50% |00> & 50% |11>');
    await userEvent.click(pill);

    // Commit prediction
    const commitBtn = screen.getByText('Commit');
    await userEvent.click(commitBtn);

    // Step 2 compare button should appear
    await waitFor(() => {
      expect(screen.getByText('Compare Prediction vs Result')).toBeInTheDocument();
    });
  });

  it('changes learner level between Beginner, Intermediate, and Technical', async () => {
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    const select = screen.getByTestId('tutor-level-select');
    await userEvent.selectOptions(select, 'technical');
    expect(select).toHaveValue('technical');
  });

  it('handles collapse and close actions when docked', async () => {
    const onSelectTab = vi.fn();
    const onToggleDock = vi.fn();
    const onClose = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
        isDocked={true}
        onToggleDock={onToggleDock}
        onClose={onClose}
      />
    );

    const collapseBtn = screen.getByTestId('tutor-collapse-btn');
    expect(collapseBtn).toBeInTheDocument();
    await userEvent.click(collapseBtn);
    expect(onToggleDock).toHaveBeenCalled();
  });

  it('toggles structured context drawer via Context button', async () => {
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    const ctxBtn = screen.getByTestId('composer-context-btn');
    await userEvent.click(ctxBtn);
    expect(screen.getByText(/Active Agent Context Snapshot/i)).toBeInTheDocument();

    await userEvent.click(ctxBtn);
    expect(screen.queryByText(/Active Agent Context Snapshot/i)).not.toBeInTheDocument();
  });

  // The welcome action pills test was removed because the redundant pills were deleted in the UI redesign.

  it('runs circuit analysis from the composer action bar', async () => {
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    const analysisBtn = screen.getByTestId('composer-analysis-btn');
    await userEvent.click(analysisBtn);
    await waitFor(() => {
      const msgs = screen.getByTestId('tutor-messages-stream');
      expect(msgs.textContent).toContain('Analyze this quantum circuit');
    });
  });

  it('renders confirmed provider badge and respects theme changes without errors', () => {
    const onSelectTab = vi.fn();
    const { container } = render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    expect(screen.getByTestId('tutor-nvidia-badge')).toBeInTheDocument();

    document.documentElement.setAttribute('data-theme', 'light');
    expect(container.querySelector('.tutor-panel-container')).toBeInTheDocument();

    document.documentElement.setAttribute('data-theme', 'dark');
    expect(container.querySelector('.tutor-panel-container')).toBeInTheDocument();
  });

  it('renders provider timeout state with retry and ask again actions and fallback label', async () => {
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    vi.mocked(tutorEngineModule.streamTutorQuestion).mockResolvedValueOnce({
      status: 'provider_timeout',
      answer: null,
      fallback_answer: '### Entangled Bell State\nThis circuit creates maximally entangled Bell state.',
      retryable: true,
      error_code: 'PROVIDER_TIMEOUT',
      error_message: 'NVIDIA Tutor is taking too long to respond.',
      confidence: 'high',
      facts: ['Bell state created.'],
      actions: [],
      suggestions: ['Try modifying a gate'],
      reasoning_provider: 'fallback',
      response_optimizer: null,
      provider: 'nvidia',
    });

    const input = screen.getByTestId('tutor-input');
    await userEvent.type(input, 'Explain entanglement in this circuit');
    const form = screen.getByTestId('tutor-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('tutor-timeout-banner')).toBeInTheDocument();
      expect(screen.getByText(/NVIDIA Tutor is taking too long to respond/i)).toBeInTheDocument();
      expect(screen.getByTestId('tutor-timeout-retry-btn')).toBeInTheDocument();
      expect(screen.getByTestId('tutor-timeout-ask-again-btn')).toBeInTheDocument();
      expect(screen.getByTestId('tutor-fallback-label')).toBeInTheDocument();
      expect(screen.getByText(/Quantum Lab fallback explanation/i)).toBeInTheDocument();
    });
  });

  it('opens ElevenLabs Voice Studio modal, allows voice selection and saves API key', async () => {
    localStorage.clear();
    const onSelectTab = vi.fn();
    render(
      <TutorPanel
        circuit={bellCircuit}
        simulationResult={mockRunResponse}
        selectedGate={null}
        onSelectTab={onSelectTab}
      />
    );

    // Open modal from header
    const voiceBtn = screen.getByTestId('tutor-voice-settings-header-btn');
    fireEvent.click(voiceBtn);

    expect(screen.getByTestId('tutor-voice-modal')).toBeInTheDocument();
    expect(screen.getByText(/ElevenLabs Neural Voice Studio/i)).toBeInTheDocument();

    // Select Adam voice
    const adamOption = screen.getByTestId('voice-option-adam');
    fireEvent.click(adamOption);
    expect(adamOption).toHaveClass('selected');

    // Input API Key
    const apiKeyInput = screen.getByTestId('voice-api-key-input');
    fireEvent.change(apiKeyInput, { target: { value: 'xi-mock-test-key-123' } });

    // Save preferences
    const saveBtn = screen.getByTestId('save-voice-btn');
    fireEvent.click(saveBtn);

    expect(screen.getByTestId('voice-save-status')).toBeInTheDocument();
    expect(localStorage.getItem('qualution_elevenlabs_api_key')).toBe('xi-mock-test-key-123');

    // Close modal
    const closeBtn = screen.getByTestId('close-voice-modal-btn');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('tutor-voice-modal')).not.toBeInTheDocument();
  });
});

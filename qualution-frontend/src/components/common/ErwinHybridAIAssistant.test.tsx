import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ErwinHybridAIAssistant } from './ErwinHybridAIAssistant';

// Mock the tutorEngine
vi.mock('../../features/tutor/tutorEngine', () => ({
  answerTutorQuestion: vi.fn().mockResolvedValue({
    answer: 'A Hadamard gate places |0⟩ into equal superposition: $\\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)$.',
    confidence: 'high',
    facts: ['Hadamard is self-inverse: H = H†', 'Creates uniform phase coherence'],
    actions: [],
    suggestions: ['What happens with a second H gate?'],
    reasoning_provider: 'nvidia',
    response_optimizer: 'groq',
    technical_analysis: 'Unitary matrix H transforms computational basis to X-basis.',
    latency_ms: 120,
  }),
  streamTutorQuestion: vi.fn().mockImplementation(async (q, ctx, onStatus, onDelta) => {
    if (onStatus) onStatus('🧠 NVIDIA NIM reasoning complete...');
    if (onDelta) onDelta('A Hadamard gate creates superposition.');
    return {
      answer: 'A Hadamard gate creates superposition.',
      confidence: 'high',
      facts: ['Unitary transformation'],
      actions: [],
      suggestions: [],
      reasoning_provider: 'nvidia',
      response_optimizer: 'groq',
      technical_analysis: 'Applies rotation around X+Z axis.',
      latency_ms: 95,
    };
  }),
}));

describe('ErwinHybridAIAssistant Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ErwinHybridAIAssistant isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders open assistant window with Hybrid AI badge and engine strip', () => {
    render(<ErwinHybridAIAssistant isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId('erwin-hybrid-ai-panel')).toBeInTheDocument();
    expect(screen.getByTestId('erwin-hybrid-badge')).toHaveTextContent(/Hybrid AI Model/i);
    expect(screen.getByTestId('erwin-engine-strip')).toHaveTextContent(/NVIDIA NIM/i);
    expect(screen.getByTestId('erwin-engine-strip')).toHaveTextContent(/Groq LPU/i);
  });

  it('renders welcome message from Erwin detailing dual-core intelligence', () => {
    render(<ErwinHybridAIAssistant isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId('erwin-chat-area')).toHaveTextContent(/Hybrid Quantum AI Copilot/i);
    expect(screen.getByTestId('erwin-chat-area')).toHaveTextContent(/NVIDIA NIM Core/i);
  });

  it('allows switching Socratic modes (Explain, Debug, Predict, Optimize)', () => {
    render(<ErwinHybridAIAssistant isOpen={true} onClose={vi.fn()} />);

    const debugTab = screen.getByTestId('erwin-mode-debug');
    const predictTab = screen.getByTestId('erwin-mode-predict');
    const optimizeTab = screen.getByTestId('erwin-mode-optimize');
    const explainTab = screen.getByTestId('erwin-mode-explain');

    expect(explainTab).toHaveClass('is-active');

    fireEvent.click(debugTab);
    expect(debugTab).toHaveClass('is-active');
    expect(explainTab).not.toHaveClass('is-active');

    fireEvent.click(predictTab);
    expect(predictTab).toHaveClass('is-active');

    fireEvent.click(optimizeTab);
    expect(optimizeTab).toHaveClass('is-active');
  });

  it('submits a question and renders Erwin response with reasoning accordion', async () => {
    const onStateChange = vi.fn();
    render(
      <ErwinHybridAIAssistant
        isOpen={true}
        onClose={vi.fn()}
        onCompanionStateChange={onStateChange}
      />
    );

    const input = screen.getByTestId('erwin-chat-input');
    const sendBtn = screen.getByTestId('erwin-send-btn');

    fireEvent.change(input, { target: { value: 'Explain the H gate' } });
    fireEvent.click(sendBtn);

    expect(onStateChange).toHaveBeenCalledWith('thinking');

    await waitFor(() => {
      expect(screen.getByTestId('erwin-chat-area')).toHaveTextContent(/Explain the H gate/i);
      expect(screen.getByTestId('erwin-chat-area')).toHaveTextContent(/Hadamard gate/i);
    });

    // Verify expandable Hybrid AI Reasoning Accordion
    const accordionToggle = screen.getByText(/Hybrid AI Reasoning Pipeline/i);
    expect(accordionToggle).toBeInTheDocument();

    fireEvent.click(accordionToggle);
    expect(screen.getByText(/NVIDIA NIM Deduction:/i)).toBeInTheDocument();
    expect(screen.getByText(/Physical Principles & Invariants:/i)).toBeInTheDocument();
  });

  it('clicking a suggested inquiry chip automatically submits the query', async () => {
    render(<ErwinHybridAIAssistant isOpen={true} onClose={vi.fn()} />);

    const chip = screen.getByRole('button', { name: /Quantum Superposition/i });
    fireEvent.click(chip);

    await waitFor(() => {
      expect(screen.getByTestId('erwin-chat-area')).toHaveTextContent(/Hadamard gate/i);
    });
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<ErwinHybridAIAssistant isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByTestId('erwin-close-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

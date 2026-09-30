import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GroverSmoothLayer } from './GroverSmoothLayer';
import type { PredictionCheckpoint } from '../../features/teaching/types';

describe('GroverSmoothLayer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockCheckpoint: PredictionCheckpoint = {
    id: 'chk-grover-iterations',
    question: 'How many Grover iterations are required to find 1 marked item among 4 possibilities with 100% probability?',
    options: [
      { id: 'opt-1', label: 'Exactly 1 iteration' },
      { id: 'opt-2', label: '2 iterations' },
      { id: 'opt-3', label: '4 iterations' },
    ],
    correctOptionIndex: 0,
    explanation: 'For N = 4, a single Grover iteration rotates the state vector by exactly 90 degrees directly onto |11⟩.',
  };

  it('1. Returns null when inactive and no narration is present', () => {
    const { container } = render(
      <GroverSmoothLayer
        activeSegment={null}
        narrationText={null}
        isSimulationRunning={false}
        predictionCheckpoint={null}
        isAwaitingPrediction={false}
        onPredictionSelect={vi.fn()}
        selectedPredictionIndex={null}
        predictionIsCorrect={null}
        predictionFeedback={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('2. Renders Segment 1 conceptual stage: 4 boxes with sequential classical checks', () => {
    render(
      <GroverSmoothLayer
        activeSegment={1}
        narrationText="Imagine four boxes in front of you. One of them hides the answer you're looking for."
        isSimulationRunning={false}
        predictionCheckpoint={null}
        isAwaitingPrediction={false}
        onPredictionSelect={vi.fn()}
        selectedPredictionIndex={null}
        predictionIsCorrect={null}
        predictionFeedback={null}
      />
    );

    expect(screen.getByText('Segment 1 — The Problem')).toBeInTheDocument();
    expect(screen.getByText(/Classical Brute-Force/i)).toBeInTheDocument();
    expect(screen.getByText('Box 00')).toBeInTheDocument();
    expect(screen.getByText('Box 01')).toBeInTheDocument();
    expect(screen.getByText('Box 10')).toBeInTheDocument();
    expect(screen.getByText('Box 11')).toBeInTheDocument();
    expect(screen.getByText(/Classical Complexity:/i)).toBeInTheDocument();

    // Advance timer to trigger sequential box inspection
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/Query Progress:/i)).toBeInTheDocument();
  });

  it('3. Renders Segment 2 conceptual stage: 4 glowing quantum superposition states', () => {
    render(
      <GroverSmoothLayer
        activeSegment={2}
        narrationText="Instead of opening boxes one by one, we encode all four states into two qubits in superposition."
        isSimulationRunning={false}
        predictionCheckpoint={null}
        isAwaitingPrediction={false}
        onPredictionSelect={vi.fn()}
        selectedPredictionIndex={null}
        predictionIsCorrect={null}
        predictionFeedback={null}
      />
    );

    expect(screen.getByText('Segment 2 — Quantum Reframing')).toBeInTheDocument();
    expect(screen.getByText('|00⟩')).toBeInTheDocument();
    expect(screen.getByText('|01⟩')).toBeInTheDocument();
    expect(screen.getByText('|10⟩')).toBeInTheDocument();
    expect(screen.getByText('|11⟩')).toBeInTheDocument();
    expect(screen.getAllByText('Amp: +1/2')).toHaveLength(4);
    expect(screen.getByText(/Register State:/i)).toBeInTheDocument();
  });

  it('4. Renders Segment 3 conceptual stage: Oracle phase flip on marked state |11⟩', () => {
    render(
      <GroverSmoothLayer
        activeSegment={3}
        narrationText="The oracle marks the target state with a phase inversion, flipping the amplitude of |11⟩."
        isSimulationRunning={false}
        predictionCheckpoint={null}
        isAwaitingPrediction={false}
        onPredictionSelect={vi.fn()}
        selectedPredictionIndex={null}
        predictionIsCorrect={null}
        predictionFeedback={null}
      />
    );

    expect(screen.getByText('Segment 3 — The Quantum Oracle')).toBeInTheDocument();
    expect(screen.getByText('Oracle Mark')).toBeInTheDocument();
    expect(screen.getAllByText('Amp: +1/2')).toHaveLength(3);
    expect(screen.getByText('Amp: -1/2')).toBeInTheDocument();
    expect(screen.getByText(/Measurement Paradox:/i)).toBeInTheDocument();
  });

  it('5. Segment 4 hides conceptual stage to let Workbench circuit shine', () => {
    const { container } = render(
      <GroverSmoothLayer
        activeSegment={4}
        narrationText="Now let's place Hadamard gates on both qubits to prepare equal superposition."
        isSimulationRunning={false}
        predictionCheckpoint={null}
        isAwaitingPrediction={false}
        onPredictionSelect={vi.fn()}
        selectedPredictionIndex={null}
        predictionIsCorrect={null}
        predictionFeedback={null}
      />
    );

    const stage = container.querySelector('.grover-conceptual-stage');
    expect(stage).toHaveClass('hide');
  });

  it('6. Cross-fades narration text smoothly without snapping', () => {
    const { rerender } = render(
      <GroverSmoothLayer
        activeSegment={1}
        narrationText="Initial segment narration text."
        isSimulationRunning={false}
        predictionCheckpoint={null}
        isAwaitingPrediction={false}
        onPredictionSelect={vi.fn()}
        selectedPredictionIndex={null}
        predictionIsCorrect={null}
        predictionFeedback={null}
      />
    );

    expect(screen.getByText('Initial segment narration text.')).toBeInTheDocument();

    rerender(
      <GroverSmoothLayer
        activeSegment={1}
        narrationText="Updated smooth narration text."
        isSimulationRunning={false}
        predictionCheckpoint={null}
        isAwaitingPrediction={false}
        onPredictionSelect={vi.fn()}
        selectedPredictionIndex={null}
        predictionIsCorrect={null}
        predictionFeedback={null}
      />
    );

    // Initial transition is fading out
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText('Updated smooth narration text.')).toBeInTheDocument();
  });

  it('7. Renders 9 progress dots with accurate active and completed styling', () => {
    const { container } = render(
      <GroverSmoothLayer
        activeSegment={5}
        narrationText="Segment 5 active."
        isSimulationRunning={false}
        predictionCheckpoint={null}
        isAwaitingPrediction={false}
        onPredictionSelect={vi.fn()}
        selectedPredictionIndex={null}
        predictionIsCorrect={null}
        predictionFeedback={null}
      />
    );

    const dots = container.querySelectorAll('.grover-progress-dot');
    expect(dots).toHaveLength(9);
    // Dots 1-4 should be completed
    expect(container.querySelectorAll('.grover-progress-dot.completed')).toHaveLength(4);
    // Dot 5 should be active
    expect(container.querySelectorAll('.grover-progress-dot.active')).toHaveLength(1);
  });

  it('8. Renders live simulation badge when isSimulationRunning is true (Segment 8)', () => {
    render(
      <GroverSmoothLayer
        activeSegment={8}
        narrationText="Simulating 1,000 shots live on quantum backend..."
        isSimulationRunning={true}
        predictionCheckpoint={null}
        isAwaitingPrediction={false}
        onPredictionSelect={vi.fn()}
        selectedPredictionIndex={null}
        predictionIsCorrect={null}
        predictionFeedback={null}
      />
    );

    expect(screen.getByText(/Quantum backend computing 1,000 shots live…/i)).toBeInTheDocument();
  });

  it('9. Renders interactive prediction checkpoint card and handles clicks in Segment 7', () => {
    const onSelect = vi.fn();
    render(
      <GroverSmoothLayer
        activeSegment={7}
        narrationText="Predict the required iterations before execution."
        isSimulationRunning={false}
        predictionCheckpoint={mockCheckpoint}
        isAwaitingPrediction={true}
        onPredictionSelect={onSelect}
        selectedPredictionIndex={null}
        predictionIsCorrect={null}
        predictionFeedback={null}
      />
    );

    expect(screen.getByText('⚡ Predict Before You Run')).toBeInTheDocument();
    expect(screen.getByText(/How many Grover iterations are required/i)).toBeInTheDocument();

    const optButton = screen.getByText('Exactly 1 iteration');
    fireEvent.click(optButton);
    expect(onSelect).toHaveBeenCalledWith(0);
  });
});

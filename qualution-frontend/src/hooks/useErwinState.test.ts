import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useErwinState,
  useErwinCompanion,
  toSingleSentence,
  getErwinIdleLine,
  getErwinCorrectLine,
  getErwinIncorrectLine,
  getErwinThinkingLine,
  ERWIN_IDLE_LINES,
} from './useErwinState';
import { emitTeachingEvent } from '../features/teaching/teachingEvents';

describe('useErwinState and useErwinCompanion — Real Signal Text & State Connection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── 1. Unit Tests for Helper Functions ─────────────────────────────

  describe('toSingleSentence helper', () => {
    it('returns empty string for empty or null inputs', () => {
      expect(toSingleSentence('')).toBe('');
      expect(toSingleSentence(null)).toBe('');
      expect(toSingleSentence(undefined)).toBe('');
    });

    it('extracts strictly the first sentence from multi-sentence paragraphs', () => {
      const input =
        'An X gate on q[0] flips |0⟩ ↔ |1⟩ (a classical bit-flip), which permutes basis amplitudes rather than inverting the quantum phase. The Grover oracle must preserve computational basis states and only negate the amplitude sign of |11⟩.';
      expect(toSingleSentence(input)).toBe(
        'An X gate on q[0] flips |0⟩ ↔ |1⟩ (a classical bit-flip), which permutes basis amplitudes rather than inverting the quantum phase.'
      );
    });

    it('handles sentences ending with exclamation or question mark', () => {
      expect(toSingleSentence('Nice work! Next challenge ahead.')).toBe('Nice work!');
      expect(toSingleSentence('Is this right? Yes it is.')).toBe('Is this right?');
    });

    it('ensures trailing period if missing', () => {
      expect(toSingleSentence('Running your circuit')).toBe('Running your circuit.');
    });
  });

  describe('getErwinIdleLine', () => {
    it('returns rotating generic idle lines', () => {
      expect(getErwinIdleLine(0)).toBe('Ready when you are.');
      expect(getErwinIdleLine(1)).toBe("Let's build something.");
      expect(getErwinIdleLine(2)).toBe('Quantum workbench ready.');
      expect(getErwinIdleLine(3)).toBe('Standing by for input.');
      expect(getErwinIdleLine(4)).toBe('Ready when you are.'); // Wraps around
    });
  });

  describe('getErwinCorrectLine', () => {
    it('defaults to short generic positive acknowledgment', () => {
      expect(getErwinCorrectLine()).toBe("Nice — that's right.");
      expect(getErwinCorrectLine(null)).toBe("Nice — that's right.");
      expect(getErwinCorrectLine('')).toBe("Nice — that's right.");
    });

    it('preserves genuine step-taught feedback if provided, formatted to single sentence', () => {
      const msg = "Correct — that's the phase-flip oracle for |11⟩.";
      expect(getErwinCorrectLine(msg)).toBe("Correct — that's the phase-flip oracle for |11⟩.");
    });
  });

  describe('getErwinIncorrectLine', () => {
    it('uses real Misconception-AI diagnosis message when provided', () => {
      const diag =
        'A single-qubit Z gate on q[0] flips the phase of any state where q[0] is 1 (affecting both |10⟩ and |11⟩). The Grover oracle must be an entangled 2-qubit interaction (CZ).';
      expect(getErwinIncorrectLine(diag)).toBe(
        'A single-qubit Z gate on q[0] flips the phase of any state where q[0] is 1 (affecting both |10⟩ and |11⟩).'
      );
    });

    it('falls back to grounded amplitude prompt if no message provided', () => {
      expect(getErwinIncorrectLine()).toBe('Review the state amplitudes and try again.');
    });
  });

  describe('getErwinThinkingLine', () => {
    it('surfaces Clifford stabilizer information when detected by Execution Router', () => {
      expect(getErwinThinkingLine('Clifford-compatibility detected across all gates', 'stabilizer')).toBe(
        'Routing to Stabilizer — Clifford circuit detected.'
      );
    });

    it('surfaces Statevector information when non-Clifford detected', () => {
      expect(getErwinThinkingLine('Circuit contains non-Clifford operations', 'statevector')).toBe(
        'Routing to Statevector — Non-Clifford operations detected.'
      );
    });

    it('surfaces MPS information for tensor networks', () => {
      expect(getErwinThinkingLine('Bounded two-qubit entanglement', 'mps')).toBe(
        'Routing to MPS — Tensor network simulation.'
      );
    });

    it('falls back to honest generic status when routing reason is unavailable', () => {
      expect(getErwinThinkingLine(null, null)).toBe('Running your circuit...');
    });
  });

  // ── 2. Backward Compatibility for useErwinState ─────────────────────

  it('starts in the idle state by default via useErwinState', () => {
    const { result } = renderHook(() => useErwinState(null));
    expect(result.current).toBe('idle');
  });

  it('transitions to "correct" on correct prediction_submitted, then reverts to "idle" after 1s', () => {
    const { result } = renderHook(() => useErwinState(null));

    act(() => {
      emitTeachingEvent({
        type: 'prediction_submitted',
        lessonId: 's1-hadamard-superposition',
        timestamp: Date.now(),
        metadata: {
          isCorrect: true,
          optionIndex: 1,
        },
      });
    });

    expect(result.current).toBe('correct');

    // Fast-forward timer by 1000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe('idle');
  });

  it('transitions to "incorrect" on incorrect prediction_submitted, then reverts to "idle" after 1s', () => {
    const { result } = renderHook(() => useErwinState(null));

    act(() => {
      emitTeachingEvent({
        type: 'prediction_submitted',
        lessonId: 's1-hadamard-superposition',
        timestamp: Date.now(),
        metadata: {
          isCorrect: false,
          optionIndex: 0,
        },
      });
    });

    expect(result.current).toBe('incorrect');

    // Fast-forward timer by 1000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe('idle');
  });

  it('transitions to "thinking" during simulation_started and returns to "idle" on simulation_completed', () => {
    const { result } = renderHook(() => useErwinState(null));

    act(() => {
      emitTeachingEvent({
        type: 'simulation_started',
        lessonId: 's1-hadamard-superposition',
        timestamp: Date.now(),
        metadata: { shots: 1000 },
      });
    });

    expect(result.current).toBe('thinking');

    act(() => {
      emitTeachingEvent({
        type: 'simulation_completed',
        lessonId: 's1-hadamard-superposition',
        timestamp: Date.now(),
        metadata: { executionTimeMs: 12 },
      });
    });

    expect(result.current).toBe('idle');
  });

  // ── 3. useErwinCompanion Text Lines Grounding Tests ──────────────────

  it('rotates idle lines on interval', () => {
    const { result } = renderHook(() => useErwinCompanion(null));
    expect(result.current.state).toBe('idle');
    expect(result.current.text).toBe(ERWIN_IDLE_LINES[0]);

    act(() => {
      vi.advanceTimersByTime(8500);
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.text).toBe(ERWIN_IDLE_LINES[1]);

    act(() => {
      vi.advanceTimersByTime(8500);
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.text).toBe(ERWIN_IDLE_LINES[2]);
  });

  it('surfaces genuine Misconception-AI message in incorrect state', () => {
    const { result } = renderHook(() => useErwinCompanion(null));

    act(() => {
      emitTeachingEvent({
        type: 'prediction_submitted',
        lessonId: 's2-grover-search',
        timestamp: Date.now(),
        metadata: {
          isCorrect: false,
          message:
            'A bare CNOT gate performs a conditional bit-flip (X), swapping |11⟩ ↔ |10⟩ instead of applying a phase inversion. To use CNOT as a phase-flip oracle, you must sandwich the target qubit in Hadamard gates.',
        },
      });
    });

    expect(result.current.state).toBe('incorrect');
    expect(result.current.text).toBe(
      'A bare CNOT gate performs a conditional bit-flip (X), swapping |11⟩ ↔ |10⟩ instead of applying a phase inversion.'
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.state).toBe('idle');
  });

  it('surfaces generic positive acknowledgment in correct state', () => {
    const { result } = renderHook(() => useErwinCompanion(null));

    act(() => {
      emitTeachingEvent({
        type: 'prediction_submitted',
        lessonId: 's1-hadamard-superposition',
        timestamp: Date.now(),
        metadata: {
          isCorrect: true,
        },
      });
    });

    expect(result.current.state).toBe('correct');
    expect(result.current.text).toBe("Nice — that's right.");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.state).toBe('idle');
  });

  it('surfaces Execution Router Clifford routing reason in thinking state', () => {
    const { result } = renderHook(() => useErwinCompanion(null));

    act(() => {
      emitTeachingEvent({
        type: 'simulation_started',
        lessonId: 's1-hadamard-superposition',
        timestamp: Date.now(),
        metadata: {
          routingReason: 'Clifford-compatibility detected: Clifford circuit detected',
          executionMethod: 'stabilizer',
        },
      });
    });

    expect(result.current.state).toBe('thinking');
    expect(result.current.text).toBe('Routing to Stabilizer — Clifford circuit detected.');

    act(() => {
      emitTeachingEvent({
        type: 'simulation_completed',
        lessonId: 's1-hadamard-superposition',
        timestamp: Date.now(),
      });
    });

    expect(result.current.state).toBe('idle');
  });

  it('integrates with controller takeover feedback for Grover oracle step', () => {
    const mockController: any = {
      getState: () => ({ status: 'IDLE' }),
      subscribe: (fn: (st: any) => void) => {
        mockController._listener = fn;
        return () => { mockController._listener = null; };
      },
    };

    const { result } = renderHook(() => useErwinCompanion(mockController));
    expect(result.current.state).toBe('idle');

    act(() => {
      mockController._listener({
        status: 'LEARNER_TURN',
        takeoverFeedback: {
          isError: true,
          message:
            'An X gate on q[0] flips |0⟩ ↔ |1⟩ (a classical bit-flip), which permutes basis amplitudes rather than inverting the quantum phase. The Grover oracle must preserve computational basis states.',
          misconceptionId: 'grover-oracle-bit-flip',
        },
      });
    });

    expect(result.current.state).toBe('incorrect');
    expect(result.current.text).toBe(
      'An X gate on q[0] flips |0⟩ ↔ |1⟩ (a classical bit-flip), which permutes basis amplitudes rather than inverting the quantum phase.'
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.state).toBe('idle');
  });
});

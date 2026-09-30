import { useState, useEffect, useRef } from 'react';
import type { TeachingController } from '../features/teaching/teachingController';
import { onTeachingEvent } from '../features/teaching/teachingEvents';
import type { ErwinMascotState } from '../components/common/ErwinMascot';
import { routeCircuit } from '../features/circuit/executionRouter';

export interface ErwinCompanionState {
  state: ErwinMascotState;
  text: string;
}

/**
 * Small, rotating set of short generic personality lines for idle state.
 */
export const ERWIN_IDLE_LINES: readonly string[] = [
  'Ready when you are.',
  "Let's build something.",
  'Quantum workbench ready.',
  'Standing by for input.',
];

/**
 * Formats any string to strictly one sentence max (honest, grounded, non-verbose).
 */
export function toSingleSentence(text?: string | null): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^([^.!?]+[.!?])/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

/**
 * Generates an idle line from the rotating set.
 */
export function getErwinIdleLine(index: number = 0): string {
  const safeIdx = Math.abs(index) % ERWIN_IDLE_LINES.length;
  return ERWIN_IDLE_LINES[safeIdx];
}

/**
 * Generates a short, generic positive acknowledgment.
 * Never invents circuit-specific claims unless that specific concept is actually taught.
 */
export function getErwinCorrectLine(conceptOrSuccessMessage?: string | null): string {
  if (conceptOrSuccessMessage && conceptOrSuccessMessage.trim().length > 0) {
    const single = toSingleSentence(conceptOrSuccessMessage);
    if (single.length > 0 && single.length < 90) {
      return single;
    }
  }
  return "Nice — that's right.";
}

/**
 * Generates the corrective message for an incorrect state.
 * Grounded in real data from the Misconception-AI diagnosis pathway.
 */
export function getErwinIncorrectLine(diagnosisMessage?: string | null): string {
  if (diagnosisMessage && diagnosisMessage.trim().length > 0) {
    return toSingleSentence(diagnosisMessage);
  }
  return 'Review the state amplitudes and try again.';
}

/**
 * Generates a short, honest status line for thinking / simulation state.
 * Surfaces real Execution Router routing_reason information when available.
 */
export function getErwinThinkingLine(
  routingReason?: string | null,
  method?: string | null
): string {
  const reasonLower = (routingReason || '').toLowerCase();
  const methodLower = (method || '').toLowerCase();

  if (
    methodLower === 'statevector' ||
    reasonLower.includes('statevector') ||
    reasonLower.includes('non-clifford')
  ) {
    return 'Routing to Statevector — Non-Clifford operations detected.';
  }
  if (methodLower === 'stabilizer' || (reasonLower.includes('clifford') && !reasonLower.includes('non-clifford'))) {
    return 'Routing to Stabilizer — Clifford circuit detected.';
  }
  if (methodLower === 'mps' || reasonLower.includes('mps')) {
    return 'Routing to MPS — Tensor network simulation.';
  }
  if (
    methodLower === 'cloud' ||
    reasonLower.includes('cloud') ||
    reasonLower.includes('qpu')
  ) {
    return 'Routing to Cloud — High complexity circuit.';
  }
  return 'Running your circuit...';
}

/**
 * useErwinCompanion — Connects Erwin's visual states AND grounded text lines
 * to signals that already exist in teachingController.ts.
 *
 * 1. Idle state: small, rotating set of short generic lines.
 * 2. Correct state: short, generic positive acknowledgment.
 * 3. Incorrect state: real corrective message from Misconception-AI diagnosis.
 * 4. Thinking state: honest status line from real Execution Router routing_reason.
 */
export function useErwinCompanion(controller?: TeachingController | null): ErwinCompanionState {
  const [state, setState] = useState<ErwinMascotState>('idle');
  const [text, setText] = useState<string>(ERWIN_IDLE_LINES[0]);
  const [idleIndex, setIdleIndex] = useState<number>(0);

  const idleIndexRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransientRef = useRef<boolean>(false);
  const isSimulatingRef = useRef<boolean>(false);

  const incorrectMsgRef = useRef<string | undefined>(undefined);
  const routingReasonRef = useRef<string | undefined>(undefined);
  const executionMethodRef = useRef<string | undefined>(undefined);

  // 1. Idle text rotation loop (every 8.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setIdleIndex((prev) => {
        const next = (prev + 1) % ERWIN_IDLE_LINES.length;
        idleIndexRef.current = next;
        if (!isTransientRef.current && !isSimulatingRef.current) {
          setText(ERWIN_IDLE_LINES[next]);
        }
        return next;
      });
    }, 8500);

    return () => clearInterval(interval);
  }, []);

  // 2. Subscribe to teaching events and controller state
  useEffect(() => {
    const unsubEvents = onTeachingEvent((event) => {
      if (event.type === 'prediction_submitted') {
        const isCorrect = Boolean(event.metadata?.isCorrect);
        if (timerRef.current) clearTimeout(timerRef.current);
        isTransientRef.current = true;

        if (isCorrect) {
          setState('correct');
          const successMsg = event.metadata?.message || event.metadata?.explanation;
          setText(getErwinCorrectLine(successMsg));
        } else {
          setState('incorrect');
          const rawErr = event.metadata?.message || event.metadata?.explanation;
          incorrectMsgRef.current = rawErr;
          setText(getErwinIncorrectLine(rawErr));
        }

        timerRef.current = setTimeout(() => {
          isTransientRef.current = false;
          if (isSimulatingRef.current) {
            setState('thinking');
            setText(getErwinThinkingLine(routingReasonRef.current, executionMethodRef.current));
          } else {
            setState('idle');
            setText(ERWIN_IDLE_LINES[idleIndexRef.current]);
          }
        }, 1000);
      } else if (event.type === 'action_executed' && event.metadata?.isCorrect === false) {
        if (timerRef.current) clearTimeout(timerRef.current);
        isTransientRef.current = true;
        setState('incorrect');
        const rawErr = event.metadata?.message;
        incorrectMsgRef.current = rawErr;
        setText(getErwinIncorrectLine(rawErr));

        timerRef.current = setTimeout(() => {
          isTransientRef.current = false;
          if (isSimulatingRef.current) {
            setState('thinking');
            setText(getErwinThinkingLine(routingReasonRef.current, executionMethodRef.current));
          } else {
            setState('idle');
            setText(ERWIN_IDLE_LINES[idleIndexRef.current]);
          }
        }, 1000);
      } else if (event.type === 'simulation_started') {
        isSimulatingRef.current = true;
        routingReasonRef.current = event.metadata?.routingReason;
        executionMethodRef.current = event.metadata?.executionMethod;

        if (!routingReasonRef.current && controller) {
          try {
            const circ = (controller as any).getHooks?.()?.getCircuit?.() || (controller as any).hooks?.getCircuit?.();
            if (circ) {
              const decision = routeCircuit(circ);
              routingReasonRef.current = decision.routing_reason;
              executionMethodRef.current = decision.method;
            }
          } catch {
            // Non-blocking
          }
        }

        if (!isTransientRef.current) {
          setState('thinking');
          setText(getErwinThinkingLine(routingReasonRef.current, executionMethodRef.current));
        }
      } else if (event.type === 'simulation_completed') {
        isSimulatingRef.current = false;
        routingReasonRef.current = undefined;
        executionMethodRef.current = undefined;

        if (!isTransientRef.current) {
          setState('idle');
          setText(ERWIN_IDLE_LINES[idleIndexRef.current]);
        }
      }
    });

    let unsubController: (() => void) | undefined;
    if (controller) {
      unsubController = controller.subscribe((ctrlState) => {
        // Handle Takeover Misconception Feedback (Grover's Oracle diagnosis)
        if (ctrlState.takeoverFeedback?.isError && ctrlState.takeoverFeedback.message) {
          incorrectMsgRef.current = ctrlState.takeoverFeedback.message;
          if (ctrlState.status === 'LEARNER_TURN') {
            if (!isTransientRef.current) {
              isTransientRef.current = true;
              setState('incorrect');
              setText(getErwinIncorrectLine(ctrlState.takeoverFeedback.message));

              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => {
                isTransientRef.current = false;
                if (isSimulatingRef.current) {
                  setState('thinking');
                  setText(getErwinThinkingLine(routingReasonRef.current, executionMethodRef.current));
                } else {
                  setState('idle');
                  setText(ERWIN_IDLE_LINES[idleIndexRef.current]);
                }
              }, 1000);
            }
          }
        }

        if (ctrlState.status === 'RUNNING_SIMULATION') {
          isSimulatingRef.current = true;
          if (!routingReasonRef.current) {
            try {
              const circ = (controller as any).getHooks?.()?.getCircuit?.() || (controller as any).hooks?.getCircuit?.();
              if (circ) {
                const decision = routeCircuit(circ);
                routingReasonRef.current = decision.routing_reason;
                executionMethodRef.current = decision.method;
              }
            } catch {
              // Non-blocking
            }
          }
          if (!isTransientRef.current) {
            setState('thinking');
            setText(getErwinThinkingLine(routingReasonRef.current, executionMethodRef.current));
          }
        } else if (ctrlState.status !== 'RUNNING_SIMULATION') {
          if (isSimulatingRef.current) {
            isSimulatingRef.current = false;
            routingReasonRef.current = undefined;
            executionMethodRef.current = undefined;
            if (!isTransientRef.current) {
              setState('idle');
              setText(ERWIN_IDLE_LINES[idleIndexRef.current]);
            }
          }
        }
      });
    }

    return () => {
      unsubEvents();
      if (unsubController) unsubController();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [controller]);

  return { state, text };
}

/**
 * useErwinState — Backward-compatible wrapper returning strictly ErwinMascotState.
 */
export function useErwinState(controller?: TeachingController | null): ErwinMascotState {
  const { state } = useErwinCompanion(controller);
  return state;
}

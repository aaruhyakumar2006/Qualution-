/**
 * groverSequenceDemo.ts
 *
 * Scripted full Grover's Search Algorithm gate placement sequence using
 * the Phase 8 VisualCircuitDragAnimator to produce premium physical cursor
 * drag animations for every gate in the Grover circuit.
 *
 * This is the canonical demonstration sequence that drives BOTH:
 * - Standalone browser verification (`window.__qualutionDemoGroverFullSequence`)
 * - Lesson-driven Stage 1 + Stage 3 automated gate placements
 *
 * The sequence follows the exact same gate ordering from lesson-8-grovers-search:
 * Stage 1: H(q0,col0), H(q1,col0) — Equal Superposition
 * Stage 2: CZ(q0-q1,col1) — Oracle (interactive in lesson, scripted in demo)
 * Stage 3: H(q0,col2), H(q1,col2), X(q0,col3), X(q1,col3), CZ(q0-q1,col4),
 *          X(q0,col5), X(q1,col5), H(q0,col6), H(q1,col6) — Diffuser
 * Stage 4: M(q0,col7), M(q1,col7) — Measurement
 */

import { CircuitDriverCoordinator, type CursorTelemetry } from './circuitDrivers';
import { CircuitEngine } from './circuitEngine';
import type { CircuitRequest } from './types';
import {
  VisualCircuitDragAnimator,
  type VisualDragOptions,
  type MultiQubitVisualDragOptions,
  type DragStep,
} from './circuitVisualDragAnimator';

export interface GroverSequenceCallbacks {
  /** Called with cursor telemetry updates for rendering the teaching cursor */
  onCursorUpdate?: (cursor: CursorTelemetry) => void;
  /** Called after each gate is placed, with the current circuit state for progressive rendering */
  onCircuitUpdate?: (circuit: CircuitRequest) => void;
  /** Called when each gate placement begins, with gate info */
  onGateStart?: (gateName: string, qubit: number, column: number, index: number, total: number) => void;
  /** Called when each gate placement completes */
  onGateComplete?: (gateName: string, qubit: number, column: number, index: number) => void;
  /** Called when a lifecycle step changes during a placement */
  onDragStep?: (step: DragStep, gateName: string) => void;
  /** Called when the full sequence completes */
  onSequenceComplete?: () => void;
  /** Inter-gate pause multiplier (default 1.0; set to 0.01 for tests) */
  delayMultiplier?: number;
  /** Speed in px/ms for drag animations (default 0.7) */
  speedPxPerMs?: number;
}

/**
 * Gate placement descriptors for the full Grover circuit.
 * Each entry maps directly to a gate in the lesson-8-grovers-search definition.
 */
const GROVER_GATE_SEQUENCE = [
  // Stage 1 — Equal Superposition
  { stage: 1, type: 'h',  qubit: 0, column: 0, label: 'H gate on q[0] (superposition)' },
  { stage: 1, type: 'h',  qubit: 1, column: 0, label: 'H gate on q[1] (superposition)' },
  // Stage 2 — Oracle (CZ)
  { stage: 2, type: 'cz', qubit: 0, column: 1, targets: [0, 1], label: 'CZ Oracle (marks |11⟩)' },
  // Stage 3 — Diffuser
  { stage: 3, type: 'h',  qubit: 0, column: 2, label: 'H gate on q[0] (diffuser)' },
  { stage: 3, type: 'h',  qubit: 1, column: 2, label: 'H gate on q[1] (diffuser)' },
  { stage: 3, type: 'x',  qubit: 0, column: 3, label: 'X gate on q[0] (diffuser)' },
  { stage: 3, type: 'x',  qubit: 1, column: 3, label: 'X gate on q[1] (diffuser)' },
  { stage: 3, type: 'cz', qubit: 0, column: 4, targets: [0, 1], label: 'CZ (diffuser reflection)' },
  { stage: 3, type: 'x',  qubit: 0, column: 5, label: 'X gate on q[0] (diffuser)' },
  { stage: 3, type: 'x',  qubit: 1, column: 5, label: 'X gate on q[1] (diffuser)' },
  { stage: 3, type: 'h',  qubit: 0, column: 6, label: 'H gate on q[0] (diffuser)' },
  { stage: 3, type: 'h',  qubit: 1, column: 6, label: 'H gate on q[1] (diffuser)' },
  // Stage 4 — Measurement
  { stage: 4, type: 'measure', qubit: 0, column: 7, label: 'Measure q[0]' },
  { stage: 4, type: 'measure', qubit: 1, column: 7, label: 'Measure q[1]' },
] as const;

/**
 * Runs the complete Grover's algorithm gate placement sequence with physical drag animations.
 *
 * @param callbacks - Optional hooks for cursor rendering, progress tracking, and timing control
 * @returns The CircuitDriverCoordinator containing the final circuit state
 */
export async function runGroverSequenceDemo(
  callbacks?: GroverSequenceCallbacks
): Promise<CircuitDriverCoordinator> {
  const mult = callbacks?.delayMultiplier ?? 1.0;
  const speed = callbacks?.speedPxPerMs ?? 0.7;

  // Create a fresh engine + coordinator pair for this demo
  const engine = new CircuitEngine({ qubits: 2, classical_bits: 2 });
  const coordinator = new CircuitDriverCoordinator(engine, 'locked');
  const animator = new VisualCircuitDragAnimator(coordinator);

  // Wire cursor telemetry to the callback
  if (callbacks?.onCursorUpdate) {
    coordinator.scriptedDriver.onCursorUpdate(callbacks.onCursorUpdate);
  }

  const totalGates = GROVER_GATE_SEQUENCE.length;

  for (let i = 0; i < totalGates; i++) {
    const entry = GROVER_GATE_SEQUENCE[i];
    callbacks?.onGateStart?.(entry.type, entry.qubit, entry.column, i, totalGates);

    const isMultiQubit = 'targets' in entry && entry.targets && entry.targets.length > 1;

    if (isMultiQubit) {
      await animator.placeMultiQubitGateWithPhysicalDrag({
        gateType: entry.type,
        targets: [...entry.targets!],
        column: entry.column,
        speedPxPerMs: speed,
        delayMultiplier: mult,
        onStepChange: (step) => {
          callbacks?.onDragStep?.(step, entry.type);
        },
      });
    } else {
      await animator.placeSingleGateWithPhysicalDrag({
        gateType: entry.type,
        qubit: entry.qubit,
        column: entry.column,
        speedPxPerMs: speed,
        delayMultiplier: mult,
        onStepChange: (step) => {
          callbacks?.onDragStep?.(step, entry.type);
        },
      });
    }

    callbacks?.onGateComplete?.(entry.type, entry.qubit, entry.column, i);

    // Emit current circuit state so the visible canvas updates progressively
    callbacks?.onCircuitUpdate?.(coordinator.toCircuitRequest());

    // Inter-gate pause for visual breathing room (250ms at 1x speed)
    if (i < totalGates - 1) {
      const interGatePause = Math.max(1, Math.round(250 * mult));
      await new Promise((r) => setTimeout(r, interGatePause));
    }
  }

  // Fade out cursor after sequence completes
  callbacks?.onCursorUpdate?.({
    x: 0,
    y: 0,
    isVisible: false,
    isClicking: false,
    isDropping: false,
  });

  callbacks?.onSequenceComplete?.();

  return coordinator;
}

/**
 * Runs only Stage 1 (H gates) + Stage 3 (diffuser) of the Grover sequence.
 * This is what the teaching controller's demonstration layers call —
 * Stage 2 (oracle) is an interactive student takeover.
 */
export async function runGroverDemonstrationStages(
  callbacks?: GroverSequenceCallbacks
): Promise<CircuitDriverCoordinator> {
  const mult = callbacks?.delayMultiplier ?? 1.0;
  const speed = callbacks?.speedPxPerMs ?? 0.7;

  const engine = new CircuitEngine({ qubits: 2, classical_bits: 2 });
  const coordinator = new CircuitDriverCoordinator(engine, 'locked');
  const animator = new VisualCircuitDragAnimator(coordinator);

  if (callbacks?.onCursorUpdate) {
    coordinator.scriptedDriver.onCursorUpdate(callbacks.onCursorUpdate);
  }

  // Only the demonstration stages (1, 3, 4 — not 2 which is interactive)
  const demoGates = GROVER_GATE_SEQUENCE.filter((g) => g.stage !== 2);
  const total = demoGates.length;

  for (let i = 0; i < total; i++) {
    const entry = demoGates[i];
    callbacks?.onGateStart?.(entry.type, entry.qubit, entry.column, i, total);

    const isMultiQubit = 'targets' in entry && entry.targets && entry.targets.length > 1;

    if (isMultiQubit) {
      await animator.placeMultiQubitGateWithPhysicalDrag({
        gateType: entry.type,
        targets: [...entry.targets!],
        column: entry.column,
        speedPxPerMs: speed,
        delayMultiplier: mult,
        onStepChange: (step) => callbacks?.onDragStep?.(step, entry.type),
      });
    } else {
      await animator.placeSingleGateWithPhysicalDrag({
        gateType: entry.type,
        qubit: entry.qubit,
        column: entry.column,
        speedPxPerMs: speed,
        delayMultiplier: mult,
        onStepChange: (step) => callbacks?.onDragStep?.(step, entry.type),
      });
    }

    callbacks?.onGateComplete?.(entry.type, entry.qubit, entry.column, i);
    callbacks?.onCircuitUpdate?.(coordinator.toCircuitRequest());

    if (i < total - 1) {
      await new Promise((r) => setTimeout(r, Math.max(1, Math.round(250 * mult))));
    }
  }

  callbacks?.onCursorUpdate?.({
    x: 0, y: 0, isVisible: false,
  });

  callbacks?.onSequenceComplete?.();
  return coordinator;
}

export { GROVER_GATE_SEQUENCE };

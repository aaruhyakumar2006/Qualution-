/**
 * circuitEngine.ts
 *
 * The canonical single, shared quantum circuit engine.
 * Powers BOTH lesson demonstrations and real user-driven circuit building.
 *
 * Exposes:
 * 1. ONE canonical serializable circuit state model:
 *    { qubits: number, classical_bits: number, gates: [{id, type, targets, column}], measurements: [...] }
 * 2. Pure mutation functions: placeGate(type, targets, column), removeGate(gateId), connectGates(targets, column)
 * 3. CircuitEngine class and useCircuitEngine React hook
 * 4. Bidirectional conversion helpers for backend API serialization (CircuitRequest)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  CircuitRequest,
  Gate,
  CanonicalGate,
  CanonicalMeasurement,
  CanonicalCircuit,
  CanonicalCircuitState,
} from './types';

// Re-export canonical types from single source of truth
export type {
  CanonicalGate,
  CanonicalMeasurement,
  CanonicalCircuit,
  CanonicalCircuitState,
};

// ── 2. Factory and Serialization Helpers ───────────────────────────────

export const DEFAULT_INITIAL_CIRCUIT: CanonicalCircuitState = {
  qubits: 2,
  classical_bits: 2,
  gates: [
    { id: 'gate-0', type: 'h', gate: 'h', targets: [0], column: 0 },
    { id: 'gate-1', type: 'cx', gate: 'cx', targets: [0, 1], column: 1 },
  ],
  measurements: [
    { qubit: 0, classical_bit: 0 },
    { qubit: 1, classical_bit: 1 },
  ],
  measure: true,
  shots: 1000,
};

export function createCanonicalCircuitState(
  partial?: Partial<CanonicalCircuitState>
): CanonicalCircuitState {
  const qubits = partial?.qubits ?? 2;
  const classical_bits = partial?.classical_bits ?? qubits;
  const rawGates = partial?.gates ?? [];

  const gates: CanonicalGate[] = rawGates.map((g) => {
    const rawType = (g.type || (g as any).gate || 'h').toLowerCase();
    return {
      id: g.id || generateGateId(rawType),
      type: rawType,
      gate: rawType,
      targets: [...g.targets],
      column: g.column ?? 0,
      ...(g.angle !== undefined ? { angle: g.angle } : {}),
      ...(g.name !== undefined ? { name: g.name } : {}),
      ...(g.sub_circuit !== undefined ? { sub_circuit: g.sub_circuit } : {}),
    };
  });

  const measurements: CanonicalMeasurement[] = partial?.measurements
    ? [...partial.measurements]
    : Array.from({ length: qubits }, (_, i) => ({ qubit: i, classical_bit: i }));

  return {
    qubits,
    classical_bits,
    gates,
    measurements,
    measure: partial?.measure ?? true,
    shots: partial?.shots ?? 1000,
  };
}

export function generateGateId(type: string): string {
  return `gate-${type.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Converts a legacy CircuitRequest into the CanonicalCircuitState model.
 */
export function toCanonicalCircuitState(circuit: CircuitRequest): CanonicalCircuitState {
  const gates: CanonicalGate[] = circuit.gates.map((g) => {
    const normalizedType = g.gate.toLowerCase();
    return {
      id: g.id || generateGateId(normalizedType),
      type: normalizedType,
      gate: normalizedType,
      targets: [...g.targets],
      column: g.column ?? 0,
      ...(g.angle !== undefined ? { angle: g.angle } : {}),
      ...(g.name !== undefined ? { name: g.name } : {}),
      ...(g.sub_circuit ? { sub_circuit: g.sub_circuit.map((sg) => ({
        id: sg.id || generateGateId(sg.gate),
        type: sg.gate.toLowerCase(),
        gate: sg.gate.toLowerCase(),
        targets: [...sg.targets],
        column: sg.column ?? 0,
      })) } : {}),
    };
  });

  const measurements: CanonicalMeasurement[] = Array.from(
    { length: circuit.qubits },
    (_, i) => ({ qubit: i, classical_bit: i })
  );

  return {
    qubits: circuit.qubits,
    classical_bits: circuit.classical_bits,
    gates,
    measurements,
    measure: circuit.measure,
    shots: circuit.shots,
  };
}

/**
 * Converts a CanonicalCircuitState back to the backend-compatible CircuitRequest.
 * Guarantees strict compliance with backend schemas and executionRouter:
 * - Unitary quantum gates only in gates[]
 * - Explicit measure gates converted to measure=true with valid classical_bits
 * - Angles attached only to rotation gates
 */
export function fromCanonicalCircuitState(state: CanonicalCircuitState): CircuitRequest {
  const isRotation = (type: string) =>
    ['rx', 'ry', 'rz', 'p', 'cp', 'crx', 'cry', 'crz'].includes(type);

  const hasMeasure = Boolean(
    state.measure ||
      state.gates.some((g) => (g.type || g.gate || '').toLowerCase() === 'measure')
  );

  const unitaryGates = state.gates.filter(
    (g) => (g.type || g.gate || '').toLowerCase() !== 'measure'
  );

  const gates: Gate[] = unitaryGates.map((g) => {
    const gateType = (g.type || g.gate || 'h').toLowerCase();
    return {
      id: g.id,
      gate: gateType,
      targets: [...g.targets],
      column: g.column,
      ...(isRotation(gateType) && g.angle !== undefined ? { angle: g.angle } : {}),
      ...(g.name !== undefined ? { name: g.name } : {}),
      ...(g.sub_circuit
        ? {
            sub_circuit: g.sub_circuit.map((sg) => ({
              id: sg.id,
              gate: (sg.type || sg.gate || 'h').toLowerCase(),
              targets: [...sg.targets],
              column: sg.column,
            })),
          }
        : {}),
    };
  });

  const qubits = Math.max(1, state.qubits);
  const classical_bits = Math.max(
    state.classical_bits ?? qubits,
    hasMeasure ? qubits : 0
  );

  return {
    qubits,
    classical_bits,
    gates,
    measure: hasMeasure,
    shots: state.shots ?? 1024,
  };
}

// ── 3. Pure Mutation Functions ─────────────────────────────────────────

/**
 * Core mutation 1: placeGate
 * Places a gate on specified target wires at the given column.
 * Replaces any existing gate in those exact wire/column coordinates to preserve layout integrity.
 * Returns the updated state and the placed CanonicalGate.
 */
export function placeGateInState(
  state: CanonicalCircuitState,
  type: string,
  targets: number[],
  column: number,
  options?: {
    id?: string;
    angle?: number;
    name?: string;
    sub_circuit?: CanonicalGate[];
  }
): { state: CanonicalCircuitState; gate: CanonicalGate } {
  const normalizedType = type.toLowerCase();
  const sortedTargets = [...targets];
  const gateId = options?.id || generateGateId(normalizedType);

  const newGate: CanonicalGate = {
    id: gateId,
    type: normalizedType,
    gate: normalizedType, // backward compatibility
    targets: sortedTargets,
    column,
    ...(options?.angle !== undefined ? { angle: options.angle } : {}),
    ...(options?.name !== undefined ? { name: options.name } : {}),
    ...(options?.sub_circuit ? { sub_circuit: options.sub_circuit } : {}),
  };

  // Remove any conflicting gate occupying any of these target wires at this column
  const remainingGates = state.gates.filter((g) => {
    if (g.column !== column) return true;
    // Conflict exists if any target wires overlap
    const hasOverlap = g.targets.some((t) => sortedTargets.includes(t));
    return !hasOverlap;
  });

  // Handle measurement tracking if placing a measure gate
  let updatedMeasurements = state.measurements;
  if (normalizedType === 'measure') {
    const primaryTarget = sortedTargets[0] ?? 0;
    const existingIndex = updatedMeasurements.findIndex((m) => m.qubit === primaryTarget);
    if (existingIndex >= 0) {
      updatedMeasurements = updatedMeasurements.map((m, idx) =>
        idx === existingIndex ? { ...m, column } : m
      );
    } else {
      updatedMeasurements = [
        ...updatedMeasurements,
        { qubit: primaryTarget, classical_bit: primaryTarget, column },
      ];
    }
  }

  // Ensure qubit count can accommodate targets if needed
  const maxTarget = Math.max(...sortedTargets, -1);
  const nextQubits = Math.max(state.qubits, maxTarget + 1);

  const nextState: CanonicalCircuitState = {
    ...state,
    qubits: nextQubits,
    classical_bits: Math.max(state.classical_bits, nextQubits),
    gates: [...remainingGates, newGate],
    measurements: updatedMeasurements,
  };

  return { state: nextState, gate: newGate };
}

/**
 * Core mutation 2: removeGate
 * Removes the gate identified by gateId from the circuit state.
 * Returns the updated state and whether the gate was found and removed.
 */
export function removeGateFromState(
  state: CanonicalCircuitState,
  gateId: string
): { state: CanonicalCircuitState; removed: boolean } {
  const targetGate = state.gates.find((g) => g.id === gateId);
  if (!targetGate) {
    return { state, removed: false };
  }

  const remainingGates = state.gates.filter((g) => g.id !== gateId);

  // If removing a measurement gate, update measurement metadata
  let updatedMeasurements = state.measurements;
  if (targetGate.type === 'measure') {
    updatedMeasurements = state.measurements.filter(
      (m) => !(m.qubit === targetGate.targets[0] && m.column === targetGate.column)
    );
  }

  const nextState: CanonicalCircuitState = {
    ...state,
    gates: remainingGates,
    measurements: updatedMeasurements,
  };

  return { state: nextState, removed: true };
}

/**
 * Core mutation 3: connectGates
 * Connects multiple qubit targets at a given column into an entangling multi-qubit operation.
 * If a gate already exists at (targets[0], column), links the secondary targets to it.
 * If no gate exists, places a connected entangling gate (e.g. CX or CZ).
 * Returns the updated state and the connected CanonicalGate.
 */
export function connectGatesInState(
  state: CanonicalCircuitState,
  targets: number[],
  column: number,
  gateType?: string
): { state: CanonicalCircuitState; gate: CanonicalGate } {
  if (targets.length < 2) {
    throw new Error('connectGates requires at least 2 target qubits.');
  }

  const existingGate = state.gates.find(
    (g) => g.column === column && g.targets.some((t) => targets.includes(t))
  );

  if (existingGate) {
    // Merge targets to establish multi-qubit connectivity
    const mergedTargets = Array.from(new Set([...existingGate.targets, ...targets]));
    const effectiveType = gateType
      ? gateType.toLowerCase()
      : (existingGate.type === 'h' || existingGate.type === 'x')
      ? 'cx'
      : existingGate.type;

    const updatedGate: CanonicalGate = {
      ...existingGate,
      type: effectiveType,
      gate: effectiveType,
      targets: mergedTargets,
    };

    const remainingGates = state.gates.filter((g) => g.id !== existingGate.id);
    const nextState: CanonicalCircuitState = {
      ...state,
      gates: [...remainingGates, updatedGate],
    };

    return { state: nextState, gate: updatedGate };
  }

  // No existing gate: place a new connected gate (defaulting to cx)
  const defaultConnectedType = (gateType || 'cx').toLowerCase();
  return placeGateInState(state, defaultConnectedType, targets, column);
}

/**
 * Adjusts the number of qubit wires in the circuit.
 */
export function setQubitsInState(
  state: CanonicalCircuitState,
  newCount: number
): CanonicalCircuitState {
  const boundedCount = Math.max(1, Math.min(16, newCount));
  // Remove gates located on pruned wires
  const validGates = state.gates.filter((g) =>
    g.targets.every((t) => t < boundedCount)
  );

  return {
    ...state,
    qubits: boundedCount,
    classical_bits: boundedCount,
    gates: validGates,
    measurements: state.measurements.filter((m) => m.qubit < boundedCount),
  };
}

/**
 * Clears all gates from the circuit.
 */
export function clearCircuitInState(state: CanonicalCircuitState): CanonicalCircuitState {
  return {
    ...state,
    gates: [],
    measurements: Array.from({ length: state.qubits }, (_, i) => ({
      qubit: i,
      classical_bit: i,
    })),
  };
}

// ── 4. Canonical Circuit Engine Class ───────────────────────────────────

export class CircuitEngine {
  private state: CanonicalCircuitState;
  private listeners: Set<(state: CanonicalCircuitState) => void> = new Set();

  constructor(initial?: Partial<CanonicalCircuitState>) {
    this.state = createCanonicalCircuitState(initial);
  }

  /**
   * Returns a snapshot of the current canonical circuit state.
   */
  public getState(): CanonicalCircuitState {
    return this.state;
  }

  /**
   * Subscribes a listener to circuit state changes. Returns an unsubscribe function.
   */
  public subscribe(listener: (state: CanonicalCircuitState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[CircuitEngine] Error in state listener:', err);
      }
    });
  }

  /**
   * Mutation: placeGate
   */
  public placeGate(
    type: string,
    targets: number[],
    column: number,
    options?: { id?: string; angle?: number; name?: string; sub_circuit?: CanonicalGate[] }
  ): CanonicalGate {
    const { state: nextState, gate } = placeGateInState(
      this.state,
      type,
      targets,
      column,
      options
    );
    this.state = nextState;
    this.notify();
    return gate;
  }

  /**
   * Mutation: removeGate
   */
  public removeGate(gateId: string): boolean {
    const { state: nextState, removed } = removeGateFromState(this.state, gateId);
    if (removed) {
      this.state = nextState;
      this.notify();
    }
    return removed;
  }

  /**
   * Mutation: connectGates
   */
  public connectGates(targets: number[], column: number, gateType?: string): CanonicalGate {
    const { state: nextState, gate } = connectGatesInState(
      this.state,
      targets,
      column,
      gateType
    );
    this.state = nextState;
    this.notify();
    return gate;
  }

  /**
   * Sets the number of active qubit wires.
   */
  public setQubits(count: number): void {
    this.state = setQubitsInState(this.state, count);
    this.notify();
  }

  /**
   * Clears all gates from the circuit.
   */
  public clear(): void {
    this.state = clearCircuitInState(this.state);
    this.notify();
  }

  /**
   * Sets the circuit state in bulk (e.g. when loading templates or restoring undo state).
   */
  public setCircuit(partialState: Partial<CanonicalCircuitState>): void {
    this.state = createCanonicalCircuitState({
      ...this.state,
      ...partialState,
    });
    this.notify();
  }

  /**
   * Exports to backend-compatible CircuitRequest.
   */
  public toCircuitRequest(): CircuitRequest {
    return fromCanonicalCircuitState(this.state);
  }

  /**
   * Hydrates from a backend-compatible CircuitRequest.
   */
  public fromCircuitRequest(circuit: CircuitRequest): void {
    this.state = toCanonicalCircuitState(circuit);
    this.notify();
  }
}

// ── 5. React Hook: useCircuitEngine ────────────────────────────────────

export function useCircuitEngine(initialState?: Partial<CanonicalCircuitState>) {
  const engineRef = useRef<CircuitEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new CircuitEngine(initialState);
  }

  const [state, setState] = useState<CanonicalCircuitState>(() =>
    engineRef.current!.getState()
  );

  useEffect(() => {
    const unsubscribe = engineRef.current!.subscribe((nextState) => {
      setState(nextState);
    });
    return unsubscribe;
  }, []);

  const placeGate = useCallback(
    (
      type: string,
      targets: number[],
      column: number,
      options?: { id?: string; angle?: number; name?: string; sub_circuit?: CanonicalGate[] }
    ) => {
      return engineRef.current!.placeGate(type, targets, column, options);
    },
    []
  );

  const removeGate = useCallback((gateId: string) => {
    return engineRef.current!.removeGate(gateId);
  }, []);

  const connectGates = useCallback(
    (targets: number[], column: number, gateType?: string) => {
      return engineRef.current!.connectGates(targets, column, gateType);
    },
    []
  );

  const setQubits = useCallback((count: number) => {
    engineRef.current!.setQubits(count);
  }, []);

  const clear = useCallback(() => {
    engineRef.current!.clear();
  }, []);

  const setCircuit = useCallback((partial: Partial<CanonicalCircuitState>) => {
    engineRef.current!.setCircuit(partial);
  }, []);

  return {
    engine: engineRef.current!,
    state,
    placeGate,
    removeGate,
    connectGates,
    setQubits,
    clear,
    setCircuit,
  };
}

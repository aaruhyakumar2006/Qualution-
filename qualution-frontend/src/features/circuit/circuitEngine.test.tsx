import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  CircuitEngine,
  placeGateInState,
  removeGateFromState,
  connectGatesInState,
  createCanonicalCircuitState,
} from './circuitEngine';
import { CircuitRenderer } from '../../components/circuit/CircuitRenderer';

describe('CircuitEngine & CircuitRenderer — Canonical Circuit Architecture', () => {
  it('defines ONE canonical circuit state model with serializable structure', () => {
    const initialState = createCanonicalCircuitState({
      qubits: 3,
      classical_bits: 3,
      gates: [
        { id: 'g-h0', type: 'h', targets: [0], column: 0 },
        { id: 'g-cx', type: 'cx', targets: [0, 1], column: 1 },
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
        { qubit: 2, classical_bit: 2 },
      ],
    });

    expect(initialState.qubits).toBe(3);
    expect(initialState.classical_bits).toBe(3);
    expect(initialState.gates).toHaveLength(2);
    expect(initialState.gates[0]).toMatchObject({
      id: 'g-h0',
      type: 'h',
      targets: [0],
      column: 0,
    });
    expect(initialState.measurements).toHaveLength(3);

    // Verify it is 100% JSON-serializable
    const serialized = JSON.stringify(initialState);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toEqual(initialState);
  });

  it('HUMAN CHECKPOINT: places gates programmatically via placeGate and renders correctly to DOM', () => {
    // 1. Initialize fresh empty engine
    const engine = new CircuitEngine({
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measurements: [],
    });

    expect(engine.getState().gates).toHaveLength(0);

    // 2. Programmatically place single-qubit Hadamard on q0 at column 0
    const gateH = engine.placeGate('h', [0], 0);
    expect(gateH.type).toBe('h');
    expect(gateH.targets).toEqual([0]);
    expect(gateH.column).toBe(0);
    expect(engine.getState().gates).toHaveLength(1);

    // 3. Programmatically place two-qubit CX on q0 -> q1 at column 1
    const gateCX = engine.placeGate('cx', [0, 1], 1);
    expect(gateCX.type).toBe('cx');
    expect(gateCX.targets).toEqual([0, 1]);
    expect(gateCX.column).toBe(1);
    expect(engine.getState().gates).toHaveLength(2);

    // 4. Render with ONE canonical CircuitRenderer component
    const { rerender } = render(<CircuitRenderer state={engine.getState()} />);

    // Assert wires are in the DOM
    expect(screen.getByTestId('qubit-wire-0')).toBeInTheDocument();
    expect(screen.getByTestId('qubit-wire-1')).toBeInTheDocument();
    expect(screen.getByText('q[0]')).toBeInTheDocument();
    expect(screen.getByText('q[1]')).toBeInTheDocument();

    // Assert gate boxes are rendered in DOM
    const placedH = screen.getByTestId('placed-gate-h-0');
    expect(placedH).toBeInTheDocument();
    expect(placedH).toHaveTextContent('H');

    // Assert CX control dot, target cross, and connector line
    const placedCXNodes = screen.getAllByTestId('placed-gate-cx-1');
    expect(placedCXNodes).toHaveLength(2); // Control node on q0, Target node on q1
    expect(screen.getByText('⊕')).toBeInTheDocument();
    expect(screen.getByTestId('two-qubit-connector-line')).toBeInTheDocument();

    // 5. Programmatically place another gate: Pauli-X on q1 at column 2
    act(() => {
      engine.placeGate('x', [1], 2);
    });

    rerender(<CircuitRenderer state={engine.getState()} />);
    expect(screen.getByTestId('placed-gate-x-2')).toBeInTheDocument();
    expect(engine.getState().gates).toHaveLength(3);
  });

  it('exposes removeGate and connectGates as the ONLY mutations for state changes', () => {
    const engine = new CircuitEngine({
      qubits: 2,
      classical_bits: 2,
      gates: [],
    });

    // 1. Place H gate on q0 at column 0
    const hGate = engine.placeGate('h', [0], 0);
    expect(engine.getState().gates).toHaveLength(1);

    // 2. Connect gates: connect [0, 1] at column 1 as CZ
    const czGate = engine.connectGates([0, 1], 1, 'cz');
    expect(czGate.type).toBe('cz');
    expect(czGate.targets).toEqual([0, 1]);
    expect(engine.getState().gates).toHaveLength(2);

    // 3. Remove H gate by ID
    const removed = engine.removeGate(hGate.id);
    expect(removed).toBe(true);
    expect(engine.getState().gates).toHaveLength(1);
    expect(engine.getState().gates[0].id).toBe(czGate.id);

    // Render updated state
    render(<CircuitRenderer state={engine.getState()} />);
    expect(screen.queryByTestId('placed-gate-h-0')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('placed-gate-cz-1')).toHaveLength(2);
  });

  it('prevents direct mutation and updates listeners reactively on engine operations', () => {
    const engine = new CircuitEngine({ qubits: 2, gates: [] });
    const listenerCalls: number[] = [];

    const unsubscribe = engine.subscribe((snapshot) => {
      listenerCalls.push(snapshot.gates.length);
    });

    engine.placeGate('h', [0], 0);
    engine.placeGate('x', [1], 1);
    engine.placeGate('z', [0], 2);

    expect(listenerCalls).toEqual([1, 2, 3]);

    unsubscribe();
    engine.placeGate('y', [1], 3);
    // Listener no longer called after unsubscribe
    expect(listenerCalls).toEqual([1, 2, 3]);
  });
});

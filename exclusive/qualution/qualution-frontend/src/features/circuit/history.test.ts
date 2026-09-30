import { describe, it, expect } from 'vitest';
import { CircuitHistory } from './history';
import type { CircuitRequest } from './types';

describe('CircuitHistory Manager', () => {
  const initialCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [{ gate: 'h', targets: [0], column: 0 }],
    measure: true,
    shots: 1000,
  };

  const mutatedCircuit1: CircuitRequest = {
    ...initialCircuit,
    gates: [
      { gate: 'h', targets: [0], column: 0 },
      { gate: 'cx', targets: [0, 1], column: 1 },
    ],
  };

  const mutatedCircuit2: CircuitRequest = {
    ...mutatedCircuit1,
    gates: [
      ...mutatedCircuit1.gates,
      { gate: 'x', targets: [1], column: 2 },
    ],
  };

  it('initializes with empty past and future', () => {
    const history = new CircuitHistory(initialCircuit);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
    expect(history.current.gates.length).toBe(1);
  });

  it('pushes mutations and allows undo/redo', () => {
    const history = new CircuitHistory(initialCircuit);
    history.push(mutatedCircuit1);

    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
    expect(history.current.gates.length).toBe(2);

    history.push(mutatedCircuit2);
    expect(history.current.gates.length).toBe(3);

    // Undo step 1
    const step1 = history.undo();
    expect(step1?.gates.length).toBe(2);
    expect(history.canRedo).toBe(true);

    // Undo step 0
    const step0 = history.undo();
    expect(step0?.gates.length).toBe(1);
    expect(history.canUndo).toBe(false);

    // Redo step 1
    const redo1 = history.redo();
    expect(redo1?.gates.length).toBe(2);
    expect(history.canUndo).toBe(true);
  });

  it('clears future on branching history push', () => {
    const history = new CircuitHistory(initialCircuit);
    history.push(mutatedCircuit1);
    history.undo();
    expect(history.canRedo).toBe(true);

    // Push new branch
    const branchCircuit: CircuitRequest = {
      ...initialCircuit,
      gates: [{ gate: 'z', targets: [0], column: 0 }],
    };
    history.push(branchCircuit);
    expect(history.canRedo).toBe(false);
    expect(history.current.gates[0].gate).toBe('z');
  });

  it('ignores no-op identical pushes', () => {
    const history = new CircuitHistory(initialCircuit);
    history.push(initialCircuit);
    expect(history.canUndo).toBe(false);
  });
});

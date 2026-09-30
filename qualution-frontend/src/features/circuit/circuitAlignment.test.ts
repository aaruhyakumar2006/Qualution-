import { describe, it, expect } from 'vitest';
import { alignCircuitGates } from './circuitAlignment';
import type { Gate } from './types';

describe('Circuit Alignment Modes (Step 24.5)', () => {
  const sampleGates: Gate[] = [
    { id: 'g1', gate: 'h', targets: [0], column: 4 },
    { id: 'g2', gate: 'x', targets: [1], column: 5 },
    { id: 'g3', gate: 'cx', targets: [0, 1], column: 8 },
  ];

  it('preserves user columns in freeform mode', () => {
    const freeform = alignCircuitGates(sampleGates, 2, 'freeform');
    expect(freeform[0].column).toBe(4);
    expect(freeform[1].column).toBe(5);
    expect(freeform[2].column).toBe(8);
  });

  it('left-packs gates on independent wires in compact mode', () => {
    const compact = alignCircuitGates(sampleGates, 2, 'compact');
    // H on q0 and X on q1 are independent, so both pack to column 0
    expect(compact[0].column).toBe(0);
    expect(compact[1].column).toBe(0);
    // CX on q0,q1 must follow layer 0, so it occupies column 1
    expect(compact[2].column).toBe(1);
  });

  it('reserves multi-qubit span in DAG layer alignment mode', () => {
    const threeQubitGates: Gate[] = [
      { id: 'g1', gate: 'h', targets: [0] },
      { id: 'g2', gate: 'h', targets: [2] },
      { id: 'g3', gate: 'cx', targets: [0, 2] }, // spans across wire 1
    ];
    const layered = alignCircuitGates(threeQubitGates, 3, 'layers');
    expect(layered[0].column).toBe(0);
    expect(layered[1].column).toBe(0);
    expect(layered[2].column).toBe(1);
  });
});

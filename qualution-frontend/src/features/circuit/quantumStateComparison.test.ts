import { describe, it, expect } from 'vitest';
import {
  compareStatesUpToGlobalPhase,
  areStatesEquivalentUpToGlobalPhase,
} from './quantumStateComparison';

describe('quantumStateComparison (Defect B3 Global Phase Handling)', () => {
  it('1. Returns fidelity 1.0 and isEquivalent=true for identical states', () => {
    const stateA = [0.5, 0.5, 0.5, 0.5];
    const stateB = [0.5, 0.5, 0.5, 0.5];
    const result = compareStatesUpToGlobalPhase(stateA, stateB);

    expect(result.fidelity).toBeCloseTo(1.0, 5);
    expect(result.isEquivalent).toBe(true);
    expect(result.globalPhaseAngleDeg).toBeCloseTo(0, 1);
  });

  it('2. Correctly identifies overall minus sign (-1 global phase) as equivalent', () => {
    // Stage 3 output: -|11⟩ produced by H-X-CZ-X-H sequence vs target |11⟩
    const actualMinus11 = [0, 0, 0, -1];
    const target11 = [0, 0, 0, 1];

    const result = compareStatesUpToGlobalPhase(actualMinus11, target11);

    expect(result.fidelity).toBeCloseTo(1.0, 5);
    expect(result.isEquivalent).toBe(true);
    // Tutor required string
    expect(result.explanation).toBe(
      'that overall minus sign is a global phase; no measurement can see it.'
    );
  });

  it('3. Handles arbitrary complex global phase factor e^(i * pi/4)', () => {
    const angle = Math.PI / 4;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const base = [0.5, 0.5, 0.5, 0.5];
    const rotated = base.map((v) => ({
      real: v * cosA,
      imag: v * sinA,
    }));

    const result = compareStatesUpToGlobalPhase(rotated, base);
    expect(result.fidelity).toBeCloseTo(1.0, 4);
    expect(result.isEquivalent).toBe(true);
    expect(result.globalPhaseAngleDeg).toBeCloseTo(45, 1);
  });

  it('4. Rejects divergent states that do not match up to global phase', () => {
    const uniform = [0.5, 0.5, 0.5, 0.5];
    const marked = [0.5, 0.5, 0.5, -0.5];

    const result = compareStatesUpToGlobalPhase(uniform, marked);
    // Inner product = 0.25 + 0.25 + 0.25 - 0.25 = 0.5
    expect(result.fidelity).toBeCloseTo(0.5, 4);
    expect(result.isEquivalent).toBe(false);
  });

  it('5. areStatesEquivalentUpToGlobalPhase helper works seamlessly', () => {
    expect(areStatesEquivalentUpToGlobalPhase([0, 0, 0, -1], [0, 0, 0, 1])).toBe(true);
    expect(areStatesEquivalentUpToGlobalPhase([0.5, 0.5, 0.5, 0.5], [1, 0, 0, 0])).toBe(false);
  });
});

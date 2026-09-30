import type { ComplexNumber } from './types';

export type StateAmplitude = ComplexNumber | number;

export interface StateComparisonResult {
  fidelity: number;
  innerProduct: ComplexNumber;
  globalPhaseAngleRad: number;
  globalPhaseAngleDeg: number;
  isEquivalent: boolean;
  explanation: string;
}

/**
 * Normalizes an amplitude input into standard { real, imag } ComplexNumber format.
 */
function toComplex(amp: StateAmplitude | undefined | null): ComplexNumber {
  if (amp === null || amp === undefined) {
    return { real: 0, imag: 0 };
  }
  if (typeof amp === 'number') {
    return { real: amp, imag: 0 };
  }
  return {
    real: typeof amp.real === 'number' ? amp.real : 0,
    imag: typeof amp.imag === 'number' ? amp.imag : 0,
  };
}

/**
 * Computes the quantum state fidelity |⟨expected|actual⟩| up to an arbitrary global phase e^(iθ).
 *
 * Ground Rule B3:
 * In quantum mechanics, quantum states |ψ⟩ and e^(iθ)|ψ⟩ represent the exact same physical state.
 * Any reflection sequence like H-X-CZ-X-H implements the reflection operator with an overall -1
 * phase factor (-|11⟩ instead of +|11⟩).
 * This comparison utility evaluates fidelity up to global phase and verifies |⟨expected|actual⟩| ≈ 1.
 */
export function compareStatesUpToGlobalPhase(
  actual: StateAmplitude[],
  expected: StateAmplitude[],
  tolerance: number = 0.02
): StateComparisonResult {
  const len = Math.max(actual.length, expected.length);

  let innerReal = 0;
  let innerImag = 0;
  let normActualSq = 0;
  let normExpectedSq = 0;

  for (let i = 0; i < len; i++) {
    const act = toComplex(actual[i]);
    const exp = toComplex(expected[i]);

    // ⟨expected | actual⟩ = Σ (exp_r - i*exp_i) * (act_r + i*act_i)
    // = Σ [ (exp_r * act_r + exp_i * act_i) + i*(exp_r * act_i - exp_i * act_r) ]
    innerReal += exp.real * act.real + exp.imag * act.imag;
    innerImag += exp.real * act.imag - exp.imag * act.real;

    normActualSq += act.real * act.real + act.imag * act.imag;
    normExpectedSq += exp.real * exp.real + exp.imag * exp.imag;
  }

  const normActual = Math.sqrt(normActualSq);
  const normExpected = Math.sqrt(normExpectedSq);

  const denom = normActual * normExpected;
  const rawFidelityMagnitude = Math.sqrt(innerReal * innerReal + innerImag * innerImag);
  const normalizedFidelity = denom > 1e-9 ? Math.min(1.0, rawFidelityMagnitude / denom) : 0;

  const phaseRad = Math.atan2(innerImag, innerReal);
  const phaseDeg = (phaseRad * 180) / Math.PI;

  const isEquivalent = Math.abs(normalizedFidelity - 1.0) <= tolerance;

  let explanation: string;
  const isOppositePhase = Math.abs(Math.abs(phaseDeg) - 180) < 5 || Math.abs(phaseDeg + 180) < 5;

  if (isEquivalent) {
    if (isOppositePhase) {
      explanation = 'that overall minus sign is a global phase; no measurement can see it.';
    } else if (Math.abs(phaseDeg) < 5) {
      explanation = 'The quantum state matches the target expectation with zero phase divergence.';
    } else {
      explanation = `The quantum state matches the target state up to a global phase of ${phaseDeg.toFixed(1)}° (global phases do not affect measurement probabilities).`;
    }
  } else {
    explanation = `State fidelity is ${(normalizedFidelity * 100).toFixed(1)}% (overlap < 1 - tolerance ${tolerance}), indicating state divergence.`;
  }

  return {
    fidelity: normalizedFidelity,
    innerProduct: { real: innerReal, imag: innerImag },
    globalPhaseAngleRad: phaseRad,
    globalPhaseAngleDeg: phaseDeg,
    isEquivalent,
    explanation,
  };
}

/**
 * Convenience helper returning boolean state equivalence up to global phase.
 */
export function areStatesEquivalentUpToGlobalPhase(
  actual: StateAmplitude[],
  expected: StateAmplitude[],
  tolerance: number = 0.02
): boolean {
  return compareStatesUpToGlobalPhase(actual, expected, tolerance).isEquivalent;
}

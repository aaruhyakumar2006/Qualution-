/**
 * statevectorEngine.ts
 *
 * Full-statevector quantum circuit simulation engine in pure TypeScript.
 * Simulates arbitrary non-Clifford quantum circuits (T-gates, arbitrary single-qubit
 * rotations RX/RY/RZ/Phase/U3, and multi-qubit interactions) via in-place tensor-index
 * bit manipulation on a (Float64Array, Float64Array) complex statevector pair.
 *
 * Conforms to the Unified Result contract defined in Phase 1 (UnifiedExecutionResult).
 */

import type {
  CanonicalCircuit,
  CircuitRequest,
  ComplexNumber,
  UnifiedExecutionResult,
} from './types';
import {
  estimateStatevectorMemory,
  getSafeStatevectorQubitThreshold,
} from './circuitAnalyzer';
import { normalizeExecutionResult } from './resultNormalizer';

export { estimateStatevectorMemory, getSafeStatevectorQubitThreshold };

export interface StatevectorSimulationOptions {
  shots?: number;
  rng?: () => number;
  includeStatevector?: boolean;
}

interface NormalizedGate {
  type: string;
  targets: number[];
  column: number;
  angle?: number;
  angles?: number[];
}

interface PlannedMeasurement {
  qubit: number;
  classicalBit: number;
}

/**
 * Normalizes input circuit into a unified execution structure.
 */
function normalizeCircuit(
  circuit: CanonicalCircuit | CircuitRequest
): {
  numQubits: number;
  numClassicalBits: number;
  gates: NormalizedGate[];
  measurements: PlannedMeasurement[];
} {
  const numQubits = circuit.qubits;
  if (!numQubits || numQubits < 1) {
    throw new Error(`Statevector simulation requires at least 1 qubit, got ${numQubits}`);
  }

  const safeCap = getSafeStatevectorQubitThreshold();
  if (numQubits > safeCap) {
    const memoryMb = (estimateStatevectorMemory(numQubits) / (1024 * 1024)).toFixed(1);
    throw new Error(
      `Statevector simulation exceeds safe client memory limits for ${numQubits} qubits (requires ~${memoryMb} MB statevector RAM; safe threshold is ${safeCap} qubits). Use stabilizer or remote cloud execution.`
    );
  }

  const rawGates = (circuit.gates || []) as Array<any>;
  const gates: NormalizedGate[] = [];
  const inlineMeasurements: Array<{ qubit: number; column: number }> = [];

  for (const g of rawGates) {
    const type = (g.type || g.gate || '').trim().toLowerCase();
    const targets = Array.isArray(g.targets) ? g.targets : [];
    const column = typeof g.column === 'number' ? g.column : 0;
    const angle = typeof g.angle === 'number' ? g.angle : undefined;
    const angles = Array.isArray(g.angles)
      ? g.angles
      : (Array.isArray(g.params) ? g.params : undefined);

    if (type === 'measure') {
      inlineMeasurements.push({ qubit: targets[0] ?? 0, column });
    } else {
      gates.push({ type, targets, column, angle, angles });
    }
  }

  // Sort gates chronologically by execution column
  gates.sort((a, b) => a.column - b.column);

  const plannedMeasurements: PlannedMeasurement[] = [];
  const canonicalMeasurements = (circuit as CanonicalCircuit).measurements;

  if (canonicalMeasurements && canonicalMeasurements.length > 0) {
    for (const m of canonicalMeasurements) {
      plannedMeasurements.push({
        qubit: m.qubit,
        classicalBit: m.classical_bit,
      });
    }
  } else if (inlineMeasurements.length > 0) {
    inlineMeasurements.sort((a, b) => a.column - b.column);
    inlineMeasurements.forEach((m, idx) => {
      plannedMeasurements.push({
        qubit: m.qubit,
        classicalBit: idx,
      });
    });
  } else {
    // Default: measure all qubits into classical bits 0..n-1
    for (let q = 0; q < numQubits; q++) {
      plannedMeasurements.push({
        qubit: q,
        classicalBit: q,
      });
    }
  }

  const maxCbit = plannedMeasurements.reduce((acc, m) => Math.max(acc, m.classicalBit), -1);
  const numClassicalBits = Math.max(
    circuit.classical_bits || 0,
    maxCbit + 1,
    plannedMeasurements.length
  );

  return {
    numQubits,
    numClassicalBits,
    gates,
    measurements: plannedMeasurements,
  };
}

export class QuantumStatevector {
  public readonly numQubits: number;
  public readonly size: number;
  public readonly real: Float64Array;
  public readonly imag: Float64Array;

  constructor(numQubits: number) {
    if (numQubits < 1 || numQubits > 20) {
      throw new Error(`QuantumStatevector size invalid: ${numQubits} qubits`);
    }
    this.numQubits = numQubits;
    this.size = 1 << numQubits;
    this.real = new Float64Array(this.size);
    this.imag = new Float64Array(this.size);

    // Initialized to ground state |0...0>
    this.real[0] = 1.0;
  }

  /**
   * Applies an arbitrary 2x2 single-qubit unitary matrix in-place:
   * U = [[u00_r + i*u00_i, u01_r + i*u01_i], [u10_r + i*u10_i, u11_r + i*u11_i]]
   */
  public applySingleQubitMatrix(
    target: number,
    u00_r: number, u00_i: number,
    u01_r: number, u01_i: number,
    u10_r: number, u10_i: number,
    u11_r: number, u11_i: number
  ): void {
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i0 = base + j;
        const i1 = i0 + halfStep;

        const r0 = real[i0];
        const c0 = imag[i0];
        const r1 = real[i1];
        const c1 = imag[i1];

        real[i0] = (u00_r * r0 - u00_i * c0) + (u01_r * r1 - u01_i * c1);
        imag[i0] = (u00_r * c0 + u00_i * r0) + (u01_r * c1 + u01_i * r1);

        real[i1] = (u10_r * r0 - u10_i * c0) + (u11_r * r1 - u11_i * c1);
        imag[i1] = (u10_r * c0 + u10_i * r0) + (u11_r * c1 + u11_i * r1);
      }
    }
  }

  // ── Specialized Fast-Path Single Qubit Gates ─────────────────────────

  public applyH(target: number): void {
    const invSqrt2 = Math.SQRT1_2;
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i0 = base + j;
        const i1 = i0 + halfStep;

        const r0 = real[i0];
        const c0 = imag[i0];
        const r1 = real[i1];
        const c1 = imag[i1];

        real[i0] = (r0 + r1) * invSqrt2;
        imag[i0] = (c0 + c1) * invSqrt2;
        real[i1] = (r0 - r1) * invSqrt2;
        imag[i1] = (c0 - c1) * invSqrt2;
      }
    }
  }

  public applyX(target: number): void {
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i0 = base + j;
        const i1 = i0 + halfStep;

        const r0 = real[i0];
        const c0 = imag[i0];
        real[i0] = real[i1];
        imag[i0] = imag[i1];
        real[i1] = r0;
        imag[i1] = c0;
      }
    }
  }

  public applyY(target: number): void {
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i0 = base + j;
        const i1 = i0 + halfStep;

        const r0 = real[i0];
        const c0 = imag[i0];
        const r1 = real[i1];
        const c1 = imag[i1];

        // i0' = -i * psi1 = (c1, -r1)
        real[i0] = c1;
        imag[i0] = -r1;
        // i1' = i * psi0 = (-c0, r0)
        real[i1] = -c0;
        imag[i1] = r0;
      }
    }
  }

  public applyZ(target: number): void {
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i1 = base + j + halfStep;
        real[i1] = -real[i1];
        imag[i1] = -imag[i1];
      }
    }
  }

  public applyS(target: number): void {
    // S: |1> -> i |1> => (real, imag) -> (-imag, real)
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i1 = base + j + halfStep;
        const r1 = real[i1];
        const c1 = imag[i1];
        real[i1] = -c1;
        imag[i1] = r1;
      }
    }
  }

  public applySdg(target: number): void {
    // Sdg: |1> -> -i |1> => (real, imag) -> (imag, -real)
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i1 = base + j + halfStep;
        const r1 = real[i1];
        const c1 = imag[i1];
        real[i1] = c1;
        imag[i1] = -r1;
      }
    }
  }

  public applyT(target: number): void {
    // T: |1> -> e^(i*pi/4) |1> = (1 + i)/sqrt(2) * |1>
    const invSqrt2 = Math.SQRT1_2;
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i1 = base + j + halfStep;
        const r1 = real[i1];
        const c1 = imag[i1];
        real[i1] = (r1 - c1) * invSqrt2;
        imag[i1] = (r1 + c1) * invSqrt2;
      }
    }
  }

  public applyTdg(target: number): void {
    // Tdg: |1> -> e^(-i*pi/4) |1> = (1 - i)/sqrt(2) * |1>
    const invSqrt2 = Math.SQRT1_2;
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i1 = base + j + halfStep;
        const r1 = real[i1];
        const c1 = imag[i1];
        real[i1] = (r1 + c1) * invSqrt2;
        imag[i1] = (c1 - r1) * invSqrt2;
      }
    }
  }

  public applyRx(target: number, theta: number): void {
    // RX(theta) = cos(theta/2)*I - i*sin(theta/2)*X
    const half = theta * 0.5;
    const c = Math.cos(half);
    const s = Math.sin(half);
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i0 = base + j;
        const i1 = i0 + halfStep;

        const r0 = real[i0];
        const c0 = imag[i0];
        const r1 = real[i1];
        const c1 = imag[i1];

        // i0' = c*psi0 - i*s*psi1 = (c*r0 + s*c1) + i*(c*c0 - s*r1)
        real[i0] = c * r0 + s * c1;
        imag[i0] = c * c0 - s * r1;

        // i1' = -i*s*psi0 + c*psi1 = (s*c0 + c*r1) + i*(-s*r0 + c*c1)
        real[i1] = s * c0 + c * r1;
        imag[i1] = -s * r0 + c * c1;
      }
    }
  }

  public applyRy(target: number, theta: number): void {
    // RY(theta) = cos(theta/2)*I - sin(theta/2)*(i*Y) = [[cos, -sin], [sin, cos]]
    const half = theta * 0.5;
    const c = Math.cos(half);
    const s = Math.sin(half);
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i0 = base + j;
        const i1 = i0 + halfStep;

        const r0 = real[i0];
        const c0 = imag[i0];
        const r1 = real[i1];
        const c1 = imag[i1];

        real[i0] = c * r0 - s * r1;
        imag[i0] = c * c0 - s * c1;

        real[i1] = s * r0 + c * r1;
        imag[i1] = s * c0 + c * c1;
      }
    }
  }

  public applyRz(target: number, theta: number): void {
    // RZ(theta) = diag(e^(-i*theta/2), e^(i*theta/2))
    const half = theta * 0.5;
    const cosVal = Math.cos(half);
    const sinVal = Math.sin(half);
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i0 = base + j;
        const i1 = i0 + halfStep;

        const r0 = real[i0];
        const c0 = imag[i0];
        const r1 = real[i1];
        const c1 = imag[i1];

        // psi0' = (cos - i*sin)*(r0 + i*c0)
        real[i0] = cosVal * r0 + sinVal * c0;
        imag[i0] = cosVal * c0 - sinVal * r0;

        // psi1' = (cos + i*sin)*(r1 + i*c1)
        real[i1] = cosVal * r1 - sinVal * c1;
        imag[i1] = cosVal * c1 + sinVal * r1;
      }
    }
  }

  public applyP(target: number, lambda: number): void {
    // P(lambda) = diag(1, e^(i*lambda))
    const cosVal = Math.cos(lambda);
    const sinVal = Math.sin(lambda);
    const total = this.size;
    const halfStep = 1 << target;
    const step = halfStep << 1;
    const real = this.real;
    const imag = this.imag;

    for (let base = 0; base < total; base += step) {
      for (let j = 0; j < halfStep; j++) {
        const i1 = base + j + halfStep;
        const r1 = real[i1];
        const c1 = imag[i1];

        real[i1] = cosVal * r1 - sinVal * c1;
        imag[i1] = sinVal * r1 + cosVal * c1;
      }
    }
  }

  // ── Controlled Two-Qubit Gates ───────────────────────────────────────

  public applyCNOT(control: number, target: number): void {
    const cMask = 1 << control;
    const tMask = 1 << target;
    const total = this.size;
    const real = this.real;
    const imag = this.imag;

    for (let k = 0; k < total; k++) {
      if ((k & cMask) !== 0 && (k & tMask) === 0) {
        const partner = k | tMask;
        const r = real[k];
        const c = imag[k];
        real[k] = real[partner];
        imag[k] = imag[partner];
        real[partner] = r;
        imag[partner] = c;
      }
    }
  }

  public applyCZ(control: number, target: number): void {
    const mask = (1 << control) | (1 << target);
    const total = this.size;
    const real = this.real;
    const imag = this.imag;

    for (let k = 0; k < total; k++) {
      if ((k & mask) === mask) {
        real[k] = -real[k];
        imag[k] = -imag[k];
      }
    }
  }

  public applySWAP(qubitA: number, qubitB: number): void {
    if (qubitA === qubitB) return;
    const maskA = 1 << qubitA;
    const maskB = 1 << qubitB;
    const total = this.size;
    const real = this.real;
    const imag = this.imag;

    for (let k = 0; k < total; k++) {
      if ((k & maskA) !== 0 && (k & maskB) === 0) {
        const partner = (k ^ maskA) | maskB;
        const r = real[k];
        const c = imag[k];
        real[k] = real[partner];
        imag[k] = imag[partner];
        real[partner] = r;
        imag[partner] = c;
      }
    }
  }
}

/**
 * Applies a normalized gate to the quantum statevector.
 */
function dispatchGate(sv: QuantumStatevector, g: NormalizedGate): void {
  const { type, targets, angle } = g;
  const q0 = targets[0] ?? 0;
  const q1 = targets[1] ?? 1;

  switch (type) {
    case 'h':
      sv.applyH(q0);
      break;
    case 'x':
      sv.applyX(q0);
      break;
    case 'y':
      sv.applyY(q0);
      break;
    case 'z':
      sv.applyZ(q0);
      break;
    case 's':
      sv.applyS(q0);
      break;
    case 'sdg':
    case 's_dagger':
    case 's-dagger':
      sv.applySdg(q0);
      break;
    case 't':
      sv.applyT(q0);
      break;
    case 'tdg':
    case 't_dagger':
    case 't-dagger':
      sv.applyTdg(q0);
      break;
    case 'rx':
      sv.applyRx(q0, angle ?? 0);
      break;
    case 'ry':
      sv.applyRy(q0, angle ?? 0);
      break;
    case 'rz':
      sv.applyRz(q0, angle ?? 0);
      break;
    case 'p':
    case 'phase':
    case 'u1':
      sv.applyP(q0, angle ?? 0);
      break;
    case 'cx':
    case 'cnot':
      sv.applyCNOT(q0, q1);
      break;
    case 'cz':
      sv.applyCZ(q0, q1);
      break;
    case 'swap':
      sv.applySWAP(q0, q1);
      break;
    case 'id':
    case 'identity':
      // Identity is a no-op
      break;
    default:
      throw new Error(`Unsupported gate in statevector simulation: ${type}`);
  }
}

/**
 * Simulates an arbitrary quantum circuit using the full-statevector formalism.
 *
 * @param circuit The circuit to simulate (CanonicalCircuit or CircuitRequest).
 * @param options Simulation options including shot count and custom RNG.
 * @returns UnifiedExecutionResult conforming to Phase 1 contract.
 */
export function simulateStatevectorCircuit(
  circuit: CanonicalCircuit | CircuitRequest,
  options: StatevectorSimulationOptions | number = {}
): UnifiedExecutionResult {
  const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const opts: StatevectorSimulationOptions =
    typeof options === 'number' ? { shots: options } : options;
  const shots = opts.shots ?? circuit.shots ?? 1024;
  const rng = opts.rng ?? Math.random;
  const includeStatevector = opts.includeStatevector ?? true;

  const { numQubits, numClassicalBits, gates, measurements } = normalizeCircuit(circuit);

  const sv = new QuantumStatevector(numQubits);

  // Apply all gates in sequential column order
  for (const gate of gates) {
    dispatchGate(sv, gate);
  }

  // ── Compute Analytical Probability Distribution ─────────────────────
  const total = sv.size;
  const exactProbs = new Float64Array(total);
  let norm = 0;

  for (let k = 0; k < total; k++) {
    const r = sv.real[k];
    const c = sv.imag[k];
    const p = r * r + c * c;
    exactProbs[k] = p;
    norm += p;
  }

  // Normalize if slight numerical drift occurred
  if (norm > 0 && Math.abs(norm - 1.0) > 1e-12) {
    const invNorm = 1.0 / norm;
    for (let k = 0; k < total; k++) {
      exactProbs[k] *= invNorm;
    }
  }

  // Build Cumulative Distribution Function (CDF) for O(log N) shot sampling
  const cdf = new Float64Array(total);
  let cum = 0;
  for (let k = 0; k < total; k++) {
    cum += exactProbs[k];
    cdf[k] = cum;
  }
  cdf[total - 1] = 1.0;

  // ── Map Basis Index to Classical Bitstring ───────────────────────────
  const bitstringCache: string[] = new Array(total);
  const isDefaultFullMeasure =
    measurements.length === numQubits &&
    measurements.every((m, idx) => m.qubit === idx && m.classicalBit === idx);

  for (let k = 0; k < total; k++) {
    if (isDefaultFullMeasure) {
      bitstringCache[k] = k.toString(2).padStart(numQubits, '0');
    } else {
      const bitBuffer = new Uint8Array(numClassicalBits);
      for (const m of measurements) {
        const bitVal = (k >> m.qubit) & 1;
        if (m.classicalBit < numClassicalBits) {
          bitBuffer[numClassicalBits - 1 - m.classicalBit] = bitVal + 48;
        }
      }
      bitstringCache[k] = Array.from(bitBuffer, (b) => String.fromCharCode(b)).join('');
    }
  }

  // ── Sample Shots via Binary Search on CDF ────────────────────────────
  const counts: Record<string, number> = {};

  for (let s = 0; s < shots; s++) {
    const r = rng();
    // Binary search on CDF
    let low = 0;
    let high = total - 1;
    let chosenIdx = 0;

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (r <= cdf[mid]) {
        chosenIdx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    const bitstring = bitstringCache[chosenIdx];
    counts[bitstring] = (counts[bitstring] || 0) + 1;
  }

  // ── Form Output Probabilities ────────────────────────────────────────
  const probabilities: Record<string, number> = {};
  for (let k = 0; k < total; k++) {
    const rawP = exactProbs[k];
    if (rawP > 1e-9) {
      const bs = bitstringCache[k];
      // Clean up floating point epsilon drift (e.g. 1.0000000000000004 -> 1.0)
      const p = Math.abs(rawP - Math.round(rawP)) < 1e-12
        ? Math.round(rawP)
        : Number(rawP.toFixed(8));
      probabilities[bs] = (probabilities[bs] || 0) + p;
    }
  }

  // Optional complex statevector array
  let statevector: ComplexNumber[] | undefined = undefined;
  if (includeStatevector && total <= 1024) {
    statevector = new Array(total);
    for (let k = 0; k < total; k++) {
      statevector[k] = {
        real: Number(sv.real[k].toFixed(6)),
        imag: Number(sv.imag[k].toFixed(6)),
      };
    }
  }

  const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const elapsed = tEnd - tStart;
  // Precise non-zero runtime (never report 0ms)
  const runtime_ms = elapsed > 0 ? Number(elapsed.toFixed(3)) : 0.001;

  const memoryBytes = total * 16; // 8 bytes real + 8 bytes imag per amplitude

  return normalizeExecutionResult(
    {
      backend: 'statevector_engine',
      execution_location: 'local_browser',
      execution_method: 'statevector',
      qubit_count: numQubits,
      shots,
      counts,
      probabilities,
      statevector,
      runtime_ms,
      routing_reason: 'Simulated via local in-place tensor-index full-statevector amplitudes',
      resource_estimate: {
        amplitudes: total,
        memory_bytes: memoryBytes,
        memory_kb: Math.round((memoryBytes / 1024) * 100) / 100,
      },
    },
    'statevector'
  );
}

/**
 * stabilizerEngine.ts
 *
 * Aaronson-Gottesman (2004) Stabilizer Simulation Engine in pure TypeScript.
 * Provides polynomial-time simulation for Clifford circuits on thousands of qubits:
 * O(N^2) gate evolution, ~O(N^3) full-register measurement,
 * still polynomial and exponentially superior to 2^N statevector allocation.
 *
 * Conforms to the Unified Result contract defined in Phase 1 (UnifiedExecutionResult).
 */

import { StabilizerTableau } from './stabilizerTableau';
import { isCliffordCompatible } from './executionRouter';
import type {
  CanonicalCircuit,
  CircuitRequest,
  UnifiedExecutionResult,
} from './types';
import { normalizeExecutionResult } from './resultNormalizer';


export interface StabilizerSimulationOptions {
  shots?: number;
  rng?: () => number;
}

interface PlannedMeasurement {
  qubit: number;
  classicalBit: number;
}

interface NormalizedGate {
  type: string;
  targets: number[];
  column: number;
}

/**
 * Normalizes a circuit (CanonicalCircuit or legacy CircuitRequest) into standard structures.
 */
function normalizeCircuit(
  circuit: CanonicalCircuit | CircuitRequest
): {
  numQubits: number;
  numClassicalBits: number;
  unitaryGates: NormalizedGate[];
  measurements: PlannedMeasurement[];
  hasInterleavedMeasurements: boolean;
} {
  const numQubits = circuit.qubits;
  if (!numQubits || numQubits < 1) {
    throw new Error(`Stabilizer simulation requires at least 1 qubit, got ${numQubits}`);
  }

  // Check Clifford compatibility
  if (!isCliffordCompatible(circuit)) {
    throw new Error(
      'Circuit contains non-Clifford gates. Stabilizer simulation strictly requires Clifford circuits (H, S, Sdg, X, Y, Z, CX, CZ, SWAP, Measure).'
    );
  }

  const rawGates = (circuit.gates || []) as Array<any>;
  const unitaryGates: NormalizedGate[] = [];
  const inlineMeasurements: Array<{ qubit: number; column: number }> = [];

  let maxCol = -1;
  let minMeasureCol = Infinity;
  let maxMeasureCol = -1;

  for (const g of rawGates) {
    const type = (g.type || g.gate || '').trim().toLowerCase();
    const targets = Array.isArray(g.targets) ? g.targets : [];
    const column = typeof g.column === 'number' ? g.column : 0;

    if (type === 'measure') {
      inlineMeasurements.push({ qubit: targets[0] ?? 0, column });
      minMeasureCol = Math.min(minMeasureCol, column);
      maxMeasureCol = Math.max(maxMeasureCol, column);
    } else {
      unitaryGates.push({ type, targets, column });
      maxCol = Math.max(maxCol, column);
    }
  }

  // Sort unitary gates by column to respect circuit execution timeline
  unitaryGates.sort((a, b) => a.column - b.column);

  // Determine planned measurements
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
    // If no explicit measurement gates or array, default to measuring all qubits 0..n-1
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

  const hasInterleavedMeasurements = inlineMeasurements.length > 0 && maxCol > minMeasureCol;

  return {
    numQubits,
    numClassicalBits,
    unitaryGates,
    measurements: plannedMeasurements,
    hasInterleavedMeasurements,
  };
}

/**
 * Applies a single Clifford gate to the stabilizer tableau.
 */
function applyCliffordGate(tableau: StabilizerTableau, gate: NormalizedGate): void {
  const { type, targets } = gate;
  switch (type) {
    case 'h':
      tableau.applyH(targets[0]);
      break;
    case 's':
      tableau.applyS(targets[0]);
      break;
    case 'sdg':
    case 's_dagger':
    case 's-dagger':
      tableau.applySdg(targets[0]);
      break;
    case 'x':
      tableau.applyX(targets[0]);
      break;
    case 'y':
      tableau.applyY(targets[0]);
      break;
    case 'z':
      tableau.applyZ(targets[0]);
      break;
    case 'cx':
    case 'cnot':
      tableau.applyCNOT(targets[0], targets[1]);
      break;
    case 'cz':
      tableau.applyCZ(targets[0], targets[1]);
      break;
    case 'swap':
      tableau.applySWAP(targets[0], targets[1]);
      break;
    case 'id':
    case 'identity':
      // Identity is a no-op
      break;
    default:
      throw new Error(`Unsupported Clifford gate in stabilizer simulation: ${type}`);
  }
}

/**
 * Simulates a Clifford quantum circuit using the Aaronson-Gottesman stabilizer tableau formalism.
 *
 * @param circuit The canonical circuit or CircuitRequest to simulate.
 * @param options Simulation options including shot count and custom RNG.
 * @returns UnifiedExecutionResult conforming to Phase 1 contract.
 */
export function simulateStabilizerCircuit(
  circuit: CanonicalCircuit | CircuitRequest,
  options: StabilizerSimulationOptions = {}
): UnifiedExecutionResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const {
    numQubits,
    numClassicalBits,
    unitaryGates,
    measurements,
    hasInterleavedMeasurements,
  } = normalizeCircuit(circuit);

  const shots = options.shots ?? circuit.shots ?? 1024;
  const rng = options.rng ?? Math.random;
  const counts: Record<string, number> = {};

  const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;

  if (!hasInterleavedMeasurements) {
    // ── Fast Path: Apply all unitary gates ONCE to the base tableau ──────
    const baseTableau = new StabilizerTableau(numQubits);
    for (const gate of unitaryGates) {
      applyCliffordGate(baseTableau, gate);
    }

    const bitBuffer = new Uint8Array(numClassicalBits);

    // For each shot, clone the pre-measurement tableau and projectively measure
    for (let s = 0; s < shots; s++) {
      const shotTableau = baseTableau.clone();

      for (const m of measurements) {
        const outcome = shotTableau.measure(m.qubit, rng);
        if (m.classicalBit < numClassicalBits) {
          // Store directly as ASCII char: '0' is 48, '1' is 49
          // In standard Qiskit / little-endian: classical bit c goes to index (numClassicalBits - 1 - c)
          bitBuffer[numClassicalBits - 1 - m.classicalBit] = outcome + 48;
        }
      }

      const bitstring = textDecoder
        ? textDecoder.decode(bitBuffer)
        : Array.from(bitBuffer, (b) => String.fromCharCode(b)).join('');

      counts[bitstring] = (counts[bitstring] || 0) + 1;
    }
  } else {
    // ── Interleaved Measurements Path ──────────────────────────────────
    // If gates occur after measurements, simulate the full circuit per shot
    const allInstructions = [
      ...unitaryGates.map((g) => ({ kind: 'gate' as const, gate: g, col: g.column })),
      ...measurements.map((m, idx) => ({ kind: 'measure' as const, measure: m, col: 0 })),
    ];
    allInstructions.sort((a, b) => a.col - b.col);
    const bitBuffer = new Uint8Array(numClassicalBits);

    for (let s = 0; s < shots; s++) {
      const tableau = new StabilizerTableau(numQubits);

      for (const inst of allInstructions) {
        if (inst.kind === 'gate') {
          applyCliffordGate(tableau, inst.gate);
        } else {
          const outcome = tableau.measure(inst.measure.qubit, rng);
          if (inst.measure.classicalBit < numClassicalBits) {
            bitBuffer[numClassicalBits - 1 - inst.measure.classicalBit] = outcome + 48;
          }
        }
      }

      const bitstring = textDecoder
        ? textDecoder.decode(bitBuffer)
        : Array.from(bitBuffer, (b) => String.fromCharCode(b)).join('');

      counts[bitstring] = (counts[bitstring] || 0) + 1;
    }
  }

  // Calculate probabilities
  const totalObserved = Object.values(counts).reduce((acc, c) => acc + c, 0) || shots;
  const probabilities: Record<string, number> = {};
  for (const [bitstring, count] of Object.entries(counts)) {
    probabilities[bitstring] = count / totalObserved;
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const runtime_ms = Math.max(0.01, Math.round((endTime - startTime) * 100) / 100);

  const tableauDimension = 2 * numQubits + 1;
  const memoryBytes = tableauDimension * tableauDimension;

  return normalizeExecutionResult(
    {
      backend: 'stabilizer_engine',
      execution_location: 'local_browser',
      execution_method: 'stabilizer',
      qubit_count: numQubits,
      shots,
      counts,
      probabilities,
      runtime_ms,
      routing_reason: 'Simulated via Aaronson-Gottesman polynomial-time Clifford stabilizer tableau',
      resource_estimate: {
        tableau_rows: tableauDimension,
        tableau_cols: tableauDimension,
        memory_bytes: memoryBytes,
        memory_kb: Math.round((memoryBytes / 1024) * 100) / 100,
      },
    },
    'stabilizer'
  );
}


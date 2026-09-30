/**
 * benchmarkGhzReal.ts
 *
 * Ground-Truth Empirical Benchmark of Aaronson-Gottesman Stabilizer Simulation Engine.
 * Evaluates GHZ state preparation and measurement across 10, 50, 100, 500, and 1000 qubits.
 *
 * Measures:
 * 1. Exact tableau buffer size in bytes: (2n + 1) * (2n + 1) bytes.
 * 2. Process memory allocation before & after.
 * 3. High-resolution wall-clock runtime (ms).
 * 4. Verification that output contains strictly |0...0> and |1...1>.
 */

import { simulateStabilizerCircuit } from './src/features/circuit/stabilizerEngine';
import type { CanonicalCircuit } from './src/features/circuit/types';

function createGhzCircuit(numQubits: number, shots: number): CanonicalCircuit {
  const gates = [{ id: 'g0', type: 'h', targets: [0], column: 0 }];
  const measurements = [{ qubit: 0, classical_bit: 0 }];

  for (let q = 1; q < numQubits; q++) {
    gates.push({ id: `g${q}`, type: 'cx', targets: [q - 1, q], column: q });
    measurements.push({ qubit: q, classical_bit: q });
  }

  return {
    qubits: numQubits,
    classical_bits: numQubits,
    gates,
    measurements,
    shots,
  };
}

export interface BenchmarkRow {
  qubits: number;
  shots: number;
  runtimeMs: number;
  tableauBytes: number;
  tableauFormatted: string;
  heapUsedBytes: number;
  statevectorReqBytes: string;
  countsSummary: string;
  status: 'SUCCESS' | 'FAIL' | 'TIMEOUT';
}

async function runSingleBenchmark(qubits: number, shots: number): Promise<BenchmarkRow> {
  const circuit = createGhzCircuit(qubits, shots);
  const tableauDimension = 2 * qubits + 1;
  const tableauBytes = tableauDimension * tableauDimension;

  // Format tableau size
  let tableauFormatted = `${tableauBytes} B`;
  if (tableauBytes >= 1024 * 1024) {
    tableauFormatted = `${(tableauBytes / (1024 * 1024)).toFixed(2)} MB`;
  } else if (tableauBytes >= 1024) {
    tableauFormatted = `${(tableauBytes / 1024).toFixed(2)} KB`;
  }

  // Classical statevector theoretical requirement (2^n * 16 bytes)
  let statevectorReq = '';
  if (qubits < 30) {
    statevectorReq = `${((2 ** qubits * 16) / 1024).toFixed(1)} KB`;
  } else if (qubits <= 35) {
    statevectorReq = `${((2 ** qubits * 16) / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  } else if (qubits <= 50) {
    statevectorReq = `~${(2 ** (qubits - 50) * 16).toFixed(0)} PB (Petabytes)`;
  } else {
    statevectorReq = `~10^${Math.round(qubits * 0.301 - 18)} YB (Physically Impossible)`;
  }

  if (global.gc) {
    global.gc();
  }
  const memBefore = process.memoryUsage().heapUsed;

  const tStart = performance.now();
  let result: any;
  let status: 'SUCCESS' | 'FAIL' | 'TIMEOUT' = 'SUCCESS';

  try {
    result = simulateStabilizerCircuit(circuit, { shots });
  } catch (err) {
    status = 'FAIL';
    return {
      qubits,
      shots,
      runtimeMs: -1,
      tableauBytes,
      tableauFormatted,
      heapUsedBytes: 0,
      statevectorReqBytes: statevectorReq,
      countsSummary: `ERROR: ${err}`,
      status: 'FAIL',
    };
  }

  const tEnd = performance.now();
  const memAfter = process.memoryUsage().heapUsed;
  const runtimeMs = Math.round((tEnd - tStart) * 100) / 100;

  const observedKeys = Object.keys(result.counts || {});
  const allZeros = '0'.repeat(qubits);
  const allOnes = '1'.repeat(qubits);
  const isValid =
    observedKeys.length <= 2 &&
    observedKeys.every((k) => k === allZeros || k === allOnes);

  const countsSummary = isValid
    ? `|0...0>: ${result.counts[allZeros] ?? 0}, |1...1>: ${result.counts[allOnes] ?? 0}`
    : `INVALID LEAKAGE: ${observedKeys.length} states`;

  return {
    qubits,
    shots,
    runtimeMs,
    tableauBytes,
    tableauFormatted,
    heapUsedBytes: Math.max(0, memAfter - memBefore),
    statevectorReqBytes: statevectorReq,
    countsSummary,
    status: isValid ? 'SUCCESS' : 'FAIL',
  };
}

async function main() {
  console.log('========================================================================');
  console.log('       AARONSON-GOTTESMAN STABILIZER BENCHMARK (GROUND TRUTH)           ');
  console.log('========================================================================\n');

  const qubitSizes = [10, 50, 100, 500, 1000];

  // ── SUITE 1: 100 SHOTS (Standard Statistical Sampling) ───────────────
  console.log('--- SUITE 1: 100 SHOTS (10 to 1000 Qubits) ---');
  for (const n of qubitSizes) {
    process.stdout.write(`Benchmarking ${n} qubits (100 shots)... `);
    const row = await runSingleBenchmark(n, 100);
    console.log(`DONE in ${row.runtimeMs} ms | Tableau: ${row.tableauFormatted} | Status: ${row.status}`);
    console.log(`   Counts: ${row.countsSummary}`);
    console.log(`   Statevector would need: ${row.statevectorReqBytes}\n`);
  }

  // ── SUITE 2: 1 SHOT (Unitary Preparation + Single Readout) ───────────
  console.log('--- SUITE 2: 1 SHOT (Fast Path Unitary + Single Measurement) ---');
  for (const n of qubitSizes) {
    process.stdout.write(`Benchmarking ${n} qubits (1 shot)... `);
    const row = await runSingleBenchmark(n, 1);
    console.log(`DONE in ${row.runtimeMs} ms | Tableau: ${row.tableauFormatted} | Status: ${row.status}`);
  }
}

main().catch(console.error);

/**
 * executionRouter.test.ts
 *
 * Comprehensive validation of the Multi-Signal Circuit Execution Router.
 * Verifies that routing decisions are strictly driven by quantum complexity signals
 * (Clifford-compatibility, statevector memory footprint, entanglement structure)
 * and CANNOT regress to a flat "qubit > X" threshold.
 *
 * Specific Regression Tests:
 * 1. 50-qubit Clifford circuit -> routes to Stabilizer (NOT rejected for qubit count).
 * 2. 18-qubit non-Clifford circuit -> routes to local Statevector (within safe memory threshold).
 * 3. 25-qubit non-Clifford circuit -> does NOT route to local Statevector (falls through to MPS or Cloud).
 * 4. 25-qubit deep entanglement non-Clifford circuit -> falls through to Cloud/QPU.
 * 5. Dynamic signal generation in routing_reason -> asserts string contains actual qubit counts,
 *    depths, and memory figures, never a flat static string.
 */

import { describe, it, expect } from 'vitest';
import {
  selectExecutionPath,
  routeCircuit,
  isCliffordCompatible,
  resolveCircuitRouting,
} from './executionRouter';
import { analyzeCircuit } from './circuitAnalyzer';
import type { CanonicalCircuit } from './types';

describe('Execution Router: Multi-Signal Priority Dispatch', () => {
  // ── REGRESSION TEST 1: 50-Qubit Clifford Circuit Routes to Stabilizer ───
  it('1. REGRESSION TEST: 50-qubit Clifford circuit routes to Stabilizer (NOT rejected for qubit count)', () => {
    // Construct 50-qubit GHZ Clifford circuit
    const gates = [{ id: 'g0', type: 'h', targets: [0], column: 0 }];
    const measurements = [{ qubit: 0, classical_bit: 0 }];

    for (let q = 1; q < 50; q++) {
      gates.push({ id: `g${q}`, type: 'cx', targets: [q - 1, q], column: q });
      measurements.push({ qubit: q, classical_bit: q });
    }

    const clifford50Circuit: CanonicalCircuit = {
      qubits: 50,
      gates,
      measurements,
    };

    // 1. Analyze the circuit
    const analysis = analyzeCircuit(clifford50Circuit);
    expect(analysis.clifford_compatible).toBe(true);
    expect(analysis.stabilizer_candidate).toBe(true);
    // Notice: local_statevector_candidate MUST be false because 50 qubits requires 16 Petabytes
    expect(analysis.local_statevector_candidate).toBe(false);

    // 2. Select execution path
    const decision = selectExecutionPath(analysis);

    console.log('\n[HUMAN CHECKPOINT - TEST 1: 50-QUBIT CLIFFORD CIRCUIT ROUTING]');
    console.log('Qubits:', analysis.qubit_count);
    console.log('Clifford Compatible:', analysis.clifford_compatible);
    console.log('Chosen Method:', decision.method);
    console.log('Chosen Location:', decision.location);
    console.log('Priority Tier:', decision.priority_tier, `(${decision.tier_name})`);
    console.log('Routing Reason:', decision.routing_reason);

    // Core Assertions: Must route to Stabilizer via Tier 1
    expect(decision.method).toBe('stabilizer');
    expect(decision.location).toBe('local_browser');
    expect(decision.backend).toBe('stabilizer_engine');
    expect(decision.priority_tier).toBe(1);
    expect(decision.tier_name).toBe('clifford');

    // routing_reason must contain dynamic signals
    expect(decision.routing_reason).toContain('50 qubits');
    expect(decision.routing_reason).toContain('Clifford-compatible');
    expect(decision.routing_reason).toContain('Gottesman-Knill theorem');
  });

  // ── REGRESSION TEST 2: 18-Qubit Non-Clifford Routes to Local Statevector ─
  it('2. REGRESSION TEST: 18-qubit arbitrary non-Clifford circuit routes to local Statevector', () => {
    // 18-qubit circuit with arbitrary non-Clifford rotations
    const nonClifford18Circuit: CanonicalCircuit = {
      qubits: 18,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'rx', targets: [0], column: 1, angle: Math.PI / 5 }, // Non-Clifford
        { id: 'g2', type: 't', targets: [1], column: 1 }, // Non-Clifford
        { id: 'g3', type: 'cx', targets: [0, 1], column: 2 },
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
      ],
    };

    const analysis = analyzeCircuit(nonClifford18Circuit);
    expect(analysis.clifford_compatible).toBe(false);
    expect(analysis.stabilizer_candidate).toBe(false);
    // 18 qubits requires 2^18 * 16 bytes = 4.19 MB RAM, which is under the 20-qubit safe threshold
    expect(analysis.local_statevector_candidate).toBe(true);

    const decision = selectExecutionPath(analysis);

    console.log('\n[HUMAN CHECKPOINT - TEST 2: 18-QUBIT NON-CLIFFORD CIRCUIT ROUTING]');
    console.log('Qubits:', analysis.qubit_count);
    console.log('Clifford Compatible:', analysis.clifford_compatible);
    console.log('Local Statevector Candidate:', analysis.local_statevector_candidate);
    console.log('Estimated Memory (MB):', (analysis.estimated_statevector_memory_bytes / (1024 * 1024)).toFixed(2));
    console.log('Chosen Method:', decision.method);
    console.log('Chosen Location:', decision.location);
    console.log('Priority Tier:', decision.priority_tier, `(${decision.tier_name})`);
    console.log('Routing Reason:', decision.routing_reason);

    // Core Assertions: Must route to local Statevector via Tier 2
    expect(decision.method).toBe('statevector');
    expect(decision.location).toBe('local_browser');
    expect(decision.backend).toBe('statevector_engine');
    expect(decision.priority_tier).toBe(2);
    expect(decision.tier_name).toBe('local_statevector');

    // Dynamic signals in routing_reason
    expect(decision.routing_reason).toContain('18 qubits');
    expect(decision.routing_reason).toContain('non-Clifford');
    expect(decision.routing_reason).toContain('4.0 MB');
  });

  // ── REGRESSION TEST 3: 25-Qubit Non-Clifford Does NOT Route Locally ─────
  it('3. REGRESSION TEST: 25-qubit arbitrary non-Clifford circuit does NOT route to local Statevector', () => {
    // 25-qubit circuit with heavy two-qubit entanglement and arbitrary rotations
    const nonClifford25Circuit: CanonicalCircuit = {
      qubits: 25,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'rx', targets: [0], column: 1, angle: Math.PI / 7 },
        { id: 'g2', type: 't', targets: [1], column: 1 },
      ],
      measurements: [{ qubit: 0, classical_bit: 0 }],
    };

    // Add deep entanglement across all 25 qubits (24 CX gates)
    for (let q = 1; q < 25; q++) {
      nonClifford25Circuit.gates.push({
        id: `cx-${q}`,
        type: 'cx',
        targets: [q - 1, q],
        column: 1 + q,
      });
    }

    const analysis = analyzeCircuit(nonClifford25Circuit);
    expect(analysis.clifford_compatible).toBe(false);
    expect(analysis.stabilizer_candidate).toBe(false);
    // 25 qubits requires 2^25 * 16 bytes = 512 MB RAM, exceeding the safe threshold (20 qubits)
    expect(analysis.local_statevector_candidate).toBe(false);

    const decision = selectExecutionPath(analysis);

    console.log('\n[HUMAN CHECKPOINT - TEST 3: 25-QUBIT NON-CLIFFORD CIRCUIT ROUTING]');
    console.log('Qubits:', analysis.qubit_count);
    console.log('Local Statevector Candidate:', analysis.local_statevector_candidate);
    console.log('Chosen Method:', decision.method);
    console.log('Chosen Location:', decision.location);
    console.log('Priority Tier:', decision.priority_tier, `(${decision.tier_name})`);
    console.log('Routing Reason:', decision.routing_reason);

    // Core Assertions: MUST NOT be local statevector!
    expect(decision.method).not.toBe('local_statevector');
    expect(decision.backend).not.toBe('statevector_engine');
    expect(decision.location).not.toBe('local_browser');

    // Because 2-qubit count is 24 (> 12), mps_candidate is false, so it must route to Cloud/QPU (Tier 4)
    expect(decision.priority_tier).toBe(4);
    expect(decision.tier_name).toBe('cloud_qpu');
    expect(decision.method).toBe('cloud');
    expect(decision.location).toBe('cloud');

    // Dynamic signals in routing_reason
    expect(decision.routing_reason).toContain('25 qubits');
    expect(decision.routing_reason).toContain('512.0 MB');
    expect(decision.routing_reason).toContain('Cloud / Remote QPU');
  });

  // ── TEST 4: 25-Qubit Bounded Entanglement Routes to MPS ─────────────────
  it('4. Bounded-entanglement 25-qubit non-Clifford circuit routes to MPS (Tier 3)', () => {
    // 25 qubits, non-Clifford (T gate), but only 4 two-qubit CX gates (<= 12)
    const mpsCircuit: CanonicalCircuit = {
      qubits: 25,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 't', targets: [1], column: 0 },
        { id: 'cx1', type: 'cx', targets: [0, 1], column: 1 },
        { id: 'cx2', type: 'cx', targets: [1, 2], column: 2 },
        { id: 'cx3', type: 'cx', targets: [2, 3], column: 3 },
        { id: 'cx4', type: 'cx', targets: [3, 4], column: 4 },
      ],
      measurements: [{ qubit: 0, classical_bit: 0 }],
    };

    const analysis = analyzeCircuit(mpsCircuit);
    expect(analysis.clifford_compatible).toBe(false);
    expect(analysis.mps_candidate).toBe(true);
    expect(analysis.local_statevector_candidate).toBe(false);

    const decision = selectExecutionPath(analysis);

    console.log('\n[HUMAN CHECKPOINT - TEST 4: BOUNDED ENTANGLEMENT MPS ROUTING]');
    console.log('Qubits:', analysis.qubit_count);
    console.log('Entangling Gate Count:', analysis.two_qubit_gate_count);
    console.log('MPS Candidate:', analysis.mps_candidate);
    console.log('Chosen Method:', decision.method);
    console.log('Priority Tier:', decision.priority_tier, `(${decision.tier_name})`);
    console.log('Routing Reason:', decision.routing_reason);

    expect(decision.method).toBe('mps');
    expect(decision.backend).toBe('mps_simulator');
    expect(decision.priority_tier).toBe(3);
    expect(decision.tier_name).toBe('mps');
    expect(decision.routing_reason).toContain('Matrix Product State (MPS)');
  });

  // ── TEST 5: routeCircuit High-Level Helper & Parity Check ──────────────
  it('5. routeCircuit helper returns identical decision to analyzeCircuit + selectExecutionPath', () => {
    const testCircuit: CanonicalCircuit = {
      qubits: 5,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'rx', targets: [1], column: 0, angle: 0.5 },
      ],
      measurements: [{ qubit: 0, classical_bit: 0 }],
    };

    const directDecision = routeCircuit(testCircuit);
    const manualDecision = selectExecutionPath(analyzeCircuit(testCircuit));

    expect(directDecision).toEqual(manualDecision);
    expect(directDecision.method).toBe('statevector');
    expect(directDecision.priority_tier).toBe(2);
  });

  // ── TEST 6: Defect B2 requires_full_state routes Clifford within memory guard to Statevector ──
  it('6. Defect B2: 2-qubit Clifford circuit routes to Statevector when requires_full_state=true', () => {
    const bellCircuit: CanonicalCircuit = {
      qubits: 2,
      gates: [
        { id: 'h0', type: 'h', targets: [0], column: 0 },
        { id: 'cx01', type: 'cx', targets: [0, 1], column: 1 },
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
      ],
    };

    // Standard routing without requires_full_state routes to Stabilizer
    const defaultDecision = routeCircuit(bellCircuit);
    expect(defaultDecision.method).toBe('stabilizer');
    expect(defaultDecision.priority_tier).toBe(1);

    // Full-state requested routing routes to local Statevector
    const fullStateDecision = routeCircuit(bellCircuit, { requires_full_state: true });
    expect(fullStateDecision.method).toBe('statevector');
    expect(fullStateDecision.backend).toBe('statevector_engine');
    expect(fullStateDecision.priority_tier).toBe(2);
    expect(fullStateDecision.routing_reason).toContain('requires_full_state=true');
    expect(fullStateDecision.routing_reason).toContain('within the client safe memory threshold');

    const routingSummary = resolveCircuitRouting(bellCircuit, 1.5, { requires_full_state: true });
    expect(routingSummary.selected_backend).toBe('qiskit_aer');
    expect(routingSummary.policy).toBe('statevector_dense');
    expect(routingSummary.reason).toContain('requires_full_state=true');
  });

  // ── TEST 7: Defect B2 Regression Guard: 50-qubit Clifford STILL routes to Stabilizer even with requires_full_state=true ──
  it('7. Defect B2 REGRESSION GUARD: 50-qubit Clifford STILL routes to Stabilizer even if requires_full_state=true', () => {
    const gates = [{ id: 'g0', type: 'h', targets: [0], column: 0 }];
    const measurements = [{ qubit: 0, classical_bit: 0 }];

    for (let q = 1; q < 50; q++) {
      gates.push({ id: `g${q}`, type: 'cx', targets: [q - 1, q], column: q });
      measurements.push({ qubit: q, classical_bit: q });
    }

    const clifford50Circuit: CanonicalCircuit = {
      qubits: 50,
      gates,
      measurements,
    };

    // Even if full state is requested, 50 qubits exceeds statevector memory guard (> 20 qubits)
    const decision = routeCircuit(clifford50Circuit, { requires_full_state: true });
    expect(decision.method).toBe('stabilizer');
    expect(decision.backend).toBe('stabilizer_engine');
    expect(decision.priority_tier).toBe(1);
    expect(decision.routing_reason).toContain('Aaronson-Gottesman stabilizer tableau');
  });
});


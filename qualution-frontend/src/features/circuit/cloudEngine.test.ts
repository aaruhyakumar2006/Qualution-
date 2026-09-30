/**
 * cloudEngine.test.ts
 *
 * Phase 9 Verification: Honest Cloud / QPU Execution Interface Contract
 * Validates that simulateViaCloud strictly returns an honest roadmap status
 * and never fabricates quantum simulation results or silently falls back.
 */

import { describe, it, expect } from 'vitest';
import { simulateViaCloud, isCloudExecutionStub } from './cloudEngine';
import { executeRoutedCircuit, selectExecutionPath } from './executionRouter';
import { analyzeCircuit } from './circuitAnalyzer';
import type { CanonicalCircuit } from './types';

describe('Phase 9: Honest Cloud / QPU Interface Contract', () => {
  // ── TEST 1: Direct simulateViaCloud Contract ──────────────────────────────
  it('1. simulateViaCloud returns structured { status: "not_implemented", message: "Cloud/QPU execution is on the roadmap" }', () => {
    const circuit: CanonicalCircuit = {
      qubits: 35,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'rx', targets: [1], column: 0, angle: 0.8 },
      ],
      shots: 2048,
    };

    const result = simulateViaCloud(circuit, { provider: 'qbraid', device: 'rigetti_aspen_m3' });

    console.log('\n[HUMAN CHECKPOINT - TEST 1: HONEST CLOUD STUB RESPONSE]');
    console.log('Status:', result.status);
    console.log('Message:', result.message);
    console.log('Backend:', result.backend);
    console.log('Execution Location:', result.execution_location);
    console.log('Execution Method:', result.execution_method);
    console.log('Qubit Count:', result.qubit_count);
    console.log('Shots:', result.shots);
    console.log('Probabilities:', result.probabilities);
    console.log('Counts:', result.counts);
    console.log('Runtime (ms):', result.runtime_ms);
    console.log('Warnings:', result.warnings);

    // Exact contract assertions
    expect(result.status).toBe('not_implemented');
    expect(result.message).toBe('Cloud/QPU execution is on the roadmap');
    expect(result.backend).toBe('cloud_qpu');
    expect(result.execution_location).toBe('cloud');
    expect(result.execution_method).toBe('cloud');
    expect(result.qubit_count).toBe(35);
    expect(result.shots).toBe(2048);

    // Never fabricates counts, probabilities, or runtimes
    expect(result.probabilities).toEqual({});
    expect(result.counts).toEqual({});
    expect(result.runtime_ms).toBe(0);
    expect(result.approximation).toBe(false);

    // Explicit warnings explaining honest stub
    expect(result.warnings?.[0]).toContain('Cloud/QPU execution is on the roadmap');
    expect(result.warnings?.[0]).toContain('no classical simulation was faked');

    // Telemetry indicates provider and device requested
    expect(result.resource_estimate?.provider).toBe('qbraid');
    expect(result.resource_estimate?.device).toBe('rigetti_aspen_m3');
    expect(result.resource_estimate?.simulated).toBe(false);

    // Type guard validation
    expect(isCloudExecutionStub(result)).toBe(true);
  });

  // ── TEST 2: Router Dispatch Integration to Honest Cloud Stub ─────────────
  it('2. executeRoutedCircuit automatically dispatches deeply entangled non-Clifford circuit to Tier 4 Cloud stub', async () => {
    // 25-qubit non-Clifford with 24 CX entangling gates (depth > 20, exceeding MPS and Statevector)
    const deepCircuit: CanonicalCircuit = {
      qubits: 25,
      gates: [
        { id: 'g0', type: 'h', targets: [0], column: 0 },
        { id: 'g1', type: 'rx', targets: [0], column: 1, angle: Math.PI / 7 },
        { id: 'g2', type: 't', targets: [1], column: 1 },
      ],
      shots: 1024,
    };

    for (let q = 1; q < 25; q++) {
      deepCircuit.gates.push({
        id: `cx-${q}`,
        type: 'cx',
        targets: [q - 1, q],
        column: 1 + q,
      });
    }

    // 1. Analyze and verify routing decision is Tier 4 Cloud
    const analysis = analyzeCircuit(deepCircuit);
    expect(analysis.clifford_compatible).toBe(false);
    expect(analysis.local_statevector_candidate).toBe(false);
    expect(analysis.mps_candidate).toBe(false);

    const decision = selectExecutionPath(analysis);
    expect(decision.priority_tier).toBe(4);
    expect(decision.tier_name).toBe('cloud_qpu');
    expect(decision.method).toBe('cloud');
    expect(decision.location).toBe('cloud');

    // 2. Execute through full router pipeline
    const executionResult = await executeRoutedCircuit(deepCircuit);

    console.log('\n[HUMAN CHECKPOINT - TEST 2: ROUTER DISPATCH TO CLOUD STUB]');
    console.log('Result Status:', executionResult.status);
    console.log('Result Message:', executionResult.message);
    console.log('Routing Reason:', executionResult.routing_reason);

    // Assert that the router cleanly returned the honest stub without faking execution
    expect(executionResult.status).toBe('not_implemented');
    expect(executionResult.message).toBe('Cloud/QPU execution is on the roadmap');
    expect(executionResult.execution_location).toBe('cloud');
    expect(executionResult.backend).toBe('cloud_qpu');
    expect(executionResult.probabilities).toEqual({});
    expect(executionResult.counts).toEqual({});
    expect(executionResult.runtime_ms).toBe(0);
    expect(isCloudExecutionStub(executionResult)).toBe(true);
  });
});

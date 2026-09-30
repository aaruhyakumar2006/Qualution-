import type {
  CanonicalCircuit,
  CircuitRequest,
  CloudExecutionResult,
  UnifiedExecutionResult,
} from './types';
import { normalizeExecutionResult } from './resultNormalizer';

export interface CloudSimulationOptions {
  shots?: number;
  provider?: 'qbraid' | 'ibm' | 'aws' | 'rigetti' | 'ionq';
  device?: string;
  routing_reason?: string;
}

/**
 * Honest Cloud / QPU Execution Interface Contract
 *
 * This function defines the pluggable cloud/hardware dispatch contract.
 * It strictly returns an honest `{ status: 'not_implemented', message: 'Cloud/QPU execution is on the roadmap' }`
 * response. It NEVER fabricates probabilities, shots, or counts, and NEVER silently falls back
 * to a local simulation engine without explicit notification.
 */
export function simulateViaCloud(
  circuit: CanonicalCircuit | CircuitRequest,
  options: CloudSimulationOptions = {}
): CloudExecutionResult {
  const qubitCount = circuit.qubits;
  const shots = options.shots ?? ('shots' in circuit && typeof circuit.shots === 'number' ? circuit.shots : 1024);

  const defaultReason =
    `Workload on ${qubitCount} qubits exceeds local classical client RAM and dense tensor contraction limits. ` +
    `Routed to Cloud / Remote QPU hardware execution.`;

  return normalizeExecutionResult(
    {
      status: 'not_implemented',
      message: 'Cloud/QPU execution is on the roadmap',
      backend: 'cloud_qpu',
      execution_location: 'cloud',
      execution_method: 'cloud',
      qubit_count: qubitCount,
      shots,
      counts: {},
      probabilities: {},
      runtime_ms: 0,
      approximation: false,
      resource_estimate: {
        provider: options.provider ?? 'qbraid',
        device: options.device ?? 'default_qpu',
        hardware_queue: 'pending_implementation',
        simulated: false,
      },
      warnings: [
        'Cloud/QPU execution is on the roadmap. No remote hardware job was submitted, and no classical simulation was faked.',
      ],
      routing_reason: options.routing_reason || defaultReason,
    },
    'cloud'
  ) as CloudExecutionResult;
}

/**
 * Helper to check whether an execution result is an unimplemented cloud roadmap stub.
 */
export function isCloudExecutionStub(
  result: UnifiedExecutionResult | CloudExecutionResult
): result is CloudExecutionResult {
  return result.status === 'not_implemented' && result.execution_location === 'cloud';
}

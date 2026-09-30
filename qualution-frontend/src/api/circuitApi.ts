import { apiClient } from './client';
import type {
  CircuitRunRequest,
  CircuitRunResponse,
  CircuitRequest,
} from '../features/circuit/types';

export interface ReadinessResponse {
  status: string;
  ready: boolean;
  dependencies: Record<string, { installed: boolean; version?: string; error?: string }>;
}

export interface BackendListResponse {
  backends: Array<{
    name: string;
    framework: string;
    provider?: string;
    status?: string;
    available?: boolean;
    capabilities: {
      shots?: boolean;
      shot_simulation?: boolean;
      statevector: boolean;
      probabilities?: boolean;
      timeline: boolean;
      bloch: boolean;
      hardware?: boolean;
      local_simulator?: boolean;
      remote_provider?: boolean;
    };
  }>;
}

export interface ParseWarning {
  message: string;
  line?: number;
  column?: number;
}

export interface ParseResponse {
  framework: string;
  circuit: CircuitRequest;
  warnings: ParseWarning[];
  metadata: {
    qubit_count: number;
    gate_count: number;
    measure: boolean;
  };
}

export async function runCircuit(request: CircuitRunRequest): Promise<CircuitRunResponse> {
  return apiClient<CircuitRunResponse>('/circuits/run', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function checkReadiness(): Promise<ReadinessResponse> {
  return apiClient<ReadinessResponse>('/ready', {
    method: 'GET',
  });
}

export async function fetchBackends(): Promise<BackendListResponse> {
  return apiClient<BackendListResponse>('/backends', {
    method: 'GET',
  });
}

import { parseCodeClient } from '../features/circuit/clientCodeParser';

export async function parseCode(framework: 'qiskit' | 'pennylane' | 'cirq' | 'openqasm', code: string): Promise<ParseResponse> {
  try {
    return await apiClient<ParseResponse>(`/codeparse/${framework}`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  } catch (backendErr) {
    // Graceful client-side fallback if backend server is offline or syntax unsupported by backend AST
    try {
      const clientResult = parseCodeClient(framework, code);
      if (clientResult && clientResult.circuit) {
        return clientResult;
      }
    } catch {
      // If client-side parse also fails, re-throw backend error
    }
    throw backendErr;
  }
}


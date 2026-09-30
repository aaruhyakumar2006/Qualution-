import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from './client';
import { runCircuit, parseCode } from './circuitApi';
import type { CircuitRunRequest } from '../features/circuit/types';

describe('Circuit API Client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('constructs POST /circuits/run request with proper JSON body and headers', async () => {
    const mockResponse = { simulation: { backend: 'qiskit_aer' } };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const request: CircuitRunRequest = {
      circuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [{ gate: 'h', targets: [0] }],
        measure: true,
        shots: 500,
      },
      mode: 'shots',
      backend: 'auto',
    };

    const res = await runCircuit(request);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/circuits/run'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
    );
    expect(res).toEqual(mockResponse);
  });

  it('constructs POST /codeparse/qiskit request for AST parsing', async () => {
    const mockParseResult = {
      framework: 'qiskit',
      circuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [{ gate: 'h', targets: [0] }],
        measure: true,
        shots: 1024,
      },
      warnings: [],
      metadata: { qubit_count: 2, gate_count: 1, measure: true },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockParseResult,
    });

    const pythonCode = 'from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)';
    const res = await parseCode('qiskit', pythonCode);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/codeparse/qiskit'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pythonCode }),
      })
    );
    expect(res).toEqual(mockParseResult);
  });

  it('throws descriptive error on non-ok HTTP responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ detail: 'Circuit invalid: missing angle' }),
    });

    await expect(apiClient('/test')).rejects.toThrow('Circuit invalid: missing angle');
  });
});

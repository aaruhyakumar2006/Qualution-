/**
 * stabilizerWorker.ts
 *
 * Dedicated Web Worker runner for non-blocking stabilizer circuit simulation.
 * Ensures the main UI thread stays completely fluid (60fps) even on 100+ qubit circuits.
 *
 * Provides both the worker script message handler and a resilient client wrapper
 * with automatic fallback to direct execution in non-DOM/test environments.
 */

import { simulateStabilizerCircuit, type StabilizerSimulationOptions } from './stabilizerEngine';
import type { CanonicalCircuit, CircuitRequest, UnifiedExecutionResult } from './types';

export interface StabilizerWorkerRequest {
  id: string;
  circuit: CanonicalCircuit | CircuitRequest;
  options?: StabilizerSimulationOptions;
}

export interface StabilizerWorkerResponse {
  id: string;
  result?: UnifiedExecutionResult;
  error?: string;
}

// ── Web Worker Script Entry Point ─────────────────────────────────────
// When executed inside a Web Worker context, listen for incoming simulation requests
if (typeof self !== 'undefined' && typeof (self as any).importScripts !== 'undefined') {
  self.onmessage = (event: MessageEvent<StabilizerWorkerRequest>) => {
    const { id, circuit, options } = event.data;
    try {
      const result = simulateStabilizerCircuit(circuit, options);
      self.postMessage({ id, result } satisfies StabilizerWorkerResponse);
    } catch (err: any) {
      self.postMessage({
        id,
        error: err?.message || String(err),
      } satisfies StabilizerWorkerResponse);
    }
  };
}

// ── Web Worker Client Invoker ─────────────────────────────────────────

let sharedWorker: Worker | null = null;
const pendingRequests = new Map<
  string,
  {
    resolve: (res: UnifiedExecutionResult) => void;
    reject: (err: Error) => void;
  }
>();

function getOrCreateWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  if (!sharedWorker) {
    try {
      sharedWorker = new Worker(new URL('./stabilizerWorker.ts', import.meta.url), {
        type: 'module',
      });

      sharedWorker.onmessage = (event: MessageEvent<StabilizerWorkerResponse>) => {
        const { id, result, error } = event.data;
        const pending = pendingRequests.get(id);
        if (pending) {
          pendingRequests.delete(id);
          if (error) {
            pending.reject(new Error(error));
          } else if (result) {
            pending.resolve(result);
          }
        }
      };

      sharedWorker.onerror = (err) => {
        console.warn('[StabilizerWorker] Worker error encountered, falling back to direct:', err);
        for (const [id, pending] of pendingRequests.entries()) {
          pending.reject(new Error(`Worker error: ${err.message}`));
          pendingRequests.delete(id);
        }
        sharedWorker?.terminate();
        sharedWorker = null;
      };
    } catch (e) {
      console.warn('[StabilizerWorker] Could not instantiate Web Worker:', e);
      return null;
    }
  }

  return sharedWorker;
}

/**
 * Executes a stabilizer circuit inside a Web Worker.
 * If Web Workers are unavailable (e.g. Node/Vitest or disabled by browser policy),
 * falls back cleanly and synchronously to direct simulateStabilizerCircuit.
 */
export async function runStabilizerInWorker(
  circuit: CanonicalCircuit | CircuitRequest,
  options: StabilizerSimulationOptions = {}
): Promise<UnifiedExecutionResult> {
  const worker = getOrCreateWorker();

  if (!worker) {
    // Graceful direct fallback
    return simulateStabilizerCircuit(circuit, options);
  }

  const id = `sim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return new Promise<UnifiedExecutionResult>((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    worker.postMessage({ id, circuit, options } satisfies StabilizerWorkerRequest);
  });
}

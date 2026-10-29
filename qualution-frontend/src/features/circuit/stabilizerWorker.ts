/**
 * stabilizerWorker.ts
 *
 * Dedicated Web Worker runner for non-blocking stabilizer circuit simulation.
 * Uses high-performance Rust/WASM Aaronson-Gottesman stabilizer engine with graceful
 * fallback to TypeScript simulation.
 * Ensures the main UI thread stays completely fluid (60fps) even on 1000+ qubit circuits.
 */

import { simulateStabilizerCircuit, type StabilizerSimulationOptions } from './stabilizerEngine';
import type { CanonicalCircuit, CircuitRequest, UnifiedExecutionResult } from './types';
import initWasm, {
  simulate_stabilizer_circuit as simulateWasmStabilizer,
} from '../../wasm/qualution-core/pkg/qualution_core.js';
import wasmUrl from '../../wasm/qualution-core/pkg/qualution_core_bg.wasm?url';

export interface StabilizerWorkerRequest {
  id: string;
  circuit: CanonicalCircuit | CircuitRequest;
  options?: StabilizerSimulationOptions & { useWasm?: boolean };
}

export interface StabilizerWorkerResponse {
  id: string;
  result?: UnifiedExecutionResult;
  error?: string;
}

let wasmInitPromise: Promise<any> | null = null;
async function ensureWasmReady() {
  if (!wasmInitPromise) {
    wasmInitPromise = initWasm(wasmUrl);
  }
  return wasmInitPromise;
}

// ── Web Worker Script Entry Point ─────────────────────────────────────
// When executed inside a Web Worker context, listen for incoming simulation requests
if (typeof self !== 'undefined' && typeof (self as any).importScripts !== 'undefined') {
  self.onmessage = async (event: MessageEvent<StabilizerWorkerRequest>) => {
    const { id, circuit, options } = event.data;
    try {
      let result: UnifiedExecutionResult;
      const shots = options?.shots ?? circuit.shots ?? 1024;

      try {
        await ensureWasmReady();
        result = simulateWasmStabilizer(circuit, shots);
      } catch (wasmErr) {
        console.warn(
          '[StabilizerWorker] Rust/WASM execution failed or unavailable, falling back to TypeScript engine:',
          wasmErr
        );
        result = simulateStabilizerCircuit(circuit, options);
      }

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
 * Executes a stabilizer circuit inside a Web Worker using Rust/WASM.
 * If Web Workers are unavailable (e.g. Node/Vitest or disabled by browser policy),
 * falls back cleanly to direct execution.
 */
export async function runStabilizerInWorker(
  circuit: CanonicalCircuit | CircuitRequest,
  options: StabilizerSimulationOptions & { useWasm?: boolean } = {}
): Promise<UnifiedExecutionResult> {
  const worker = getOrCreateWorker();

  if (!worker) {
    // Graceful direct fallback
    try {
      await ensureWasmReady();
      const shots = options.shots ?? circuit.shots ?? 1024;
      return simulateWasmStabilizer(circuit, shots);
    } catch {
      return simulateStabilizerCircuit(circuit, options);
    }
  }

  const id = `sim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return new Promise<UnifiedExecutionResult>((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    worker.postMessage({ id, circuit, options } satisfies StabilizerWorkerRequest);
  });
}

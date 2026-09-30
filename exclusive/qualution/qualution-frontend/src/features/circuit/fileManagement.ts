import type { CircuitRequest } from './types';

export interface SavedCircuitMeta {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  circuit: CircuitRequest;
}

export interface CircuitFileStorage {
  circuits: SavedCircuitMeta[];
  activeCircuitId: string | null;
}

export const SAVED_CIRCUITS_STORAGE_KEY = 'qualution_saved_circuits_v1';

export function loadSavedCircuits(): SavedCircuitMeta[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(SAVED_CIRCUITS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCircuitToStorage(meta: SavedCircuitMeta): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const existing = loadSavedCircuits();
    const idx = existing.findIndex((c) => c.id === meta.id);
    if (idx >= 0) {
      existing[idx] = meta;
    } else {
      existing.unshift(meta);
    }
    window.localStorage.setItem(SAVED_CIRCUITS_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to save circuit:', err);
  }
}

export function deleteSavedCircuit(id: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const existing = loadSavedCircuits().filter((c) => c.id !== id);
    window.localStorage.setItem(SAVED_CIRCUITS_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to delete circuit:', err);
  }
}

export function exportCircuitAsJson(circuit: CircuitRequest, name: string): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(circuit, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${name.toLowerCase().replace(/\s+/g, '_')}.qualution.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportCodeAsFile(code: string, filename: string): void {
  const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(code);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

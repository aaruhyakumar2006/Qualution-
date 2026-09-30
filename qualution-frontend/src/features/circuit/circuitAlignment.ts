import type { Gate } from './types';

export type AlignmentMode = 'freeform' | 'compact' | 'layers';

/**
 * Computes layer/depth execution alignment based on circuit DAG dependencies.
 * Two gates on disjoint qubit sets can share the same layer.
 */
export function alignCircuitGates(
  gates: Gate[],
  _qubitCount: number,
  mode: AlignmentMode
): Gate[] {
  if (!gates || !Array.isArray(gates)) return [];

  if (mode === 'freeform') {
    // Preserve existing column coordinates or default to index
    return gates.map((g, idx) => ({
      ...g,
      targets: Array.isArray(g.targets) && g.targets.length > 0 ? g.targets : [0],
      column: g.column !== undefined ? g.column : idx,
    }));
  }

  if (mode === 'compact') {
    // Left-pack gates preserving wire order
    const qubitLastCol: Record<number, number> = {};
    return gates.map((g) => {
      const targets = Array.isArray(g.targets) && g.targets.length > 0 ? g.targets : [0];
      let targetCol = 0;
      for (const t of targets) {
        if (qubitLastCol[t] !== undefined) {
          targetCol = Math.max(targetCol, qubitLastCol[t] + 1);
        }
      }
      for (const t of targets) {
        qubitLastCol[t] = targetCol;
      }
      return {
        ...g,
        targets,
        column: targetCol,
      };
    });
  }

  if (mode === 'layers') {
    // Explicit DAG layer alignment reserving full multi-wire spans for multi-qubit gates
    const qubitLastLayer: Record<number, number> = {};
    return gates.map((g) => {
      const targets = Array.isArray(g.targets) && g.targets.length > 0 ? g.targets : [0];
      const minQ = Math.min(...targets);
      const maxQ = Math.max(...targets);
      let targetLayer = 0;

      for (let q = minQ; q <= maxQ; q++) {
        if (qubitLastLayer[q] !== undefined) {
          targetLayer = Math.max(targetLayer, qubitLastLayer[q] + 1);
        }
      }

      for (let q = minQ; q <= maxQ; q++) {
        qubitLastLayer[q] = targetLayer;
      }

      return {
        ...g,
        targets,
        column: targetLayer,
      };
    });
  }

  return gates;
}

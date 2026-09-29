import type { CircuitRequest } from '../circuit/types';
import type { OptimizationResponse } from '../../api/optimization';

export interface OptimizationState {
  isOpen: boolean;
  status: 'idle' | 'analyzing' | 'success' | 'error';
  data: OptimizationResponse | null;
  error: string | null;
  selectedGateIndex: number | null;
}

export interface GateDiffItem {
  id: string;
  type: 'unchanged' | 'removed' | 'combined' | 'modified' | 'added';
  originalGate?: {
    gate: string;
    targets: number[];
    angle?: number;
  };
  optimizedGate?: {
    gate: string;
    targets: number[];
    angle?: number;
  };
  passName?: string;
  description?: string;
}

/**
 * Compare original vs optimized gates aligned by wire / position
 */
export function buildGateDiffList(
  original?: CircuitRequest,
  optimized?: CircuitRequest,
  passes?: string[]
): GateDiffItem[] {
  const origGates = original?.gates || [];
  const optGates = optimized?.gates || [];
  const appliedPasses = passes || [];
  const diffs: GateDiffItem[] = [];
  const maxLen = Math.max(origGates.length, optGates.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = origGates[i];
    const opt = optGates[i];

    if (orig && opt) {
      const origName = (orig.gate || (orig as any).type || '').toLowerCase();
      const optName = (opt.gate || (opt as any).type || '').toLowerCase();
      const sameGate = origName === optName;
      const sameTargets = JSON.stringify(orig.targets || []) === JSON.stringify(opt.targets || []);
      const sameAngle = orig.angle === opt.angle;

      if (sameGate && sameTargets && sameAngle) {
        diffs.push({
          id: `diff-${i}`,
          type: 'unchanged',
          originalGate: orig,
          optimizedGate: opt,
        });
      } else if (sameGate && sameTargets && !sameAngle) {
        diffs.push({
          id: `diff-${i}`,
          type: 'combined',
          originalGate: orig,
          optimizedGate: opt,
          description: `Combined rotation angle (${orig.angle?.toFixed(3) ?? ''} → ${opt.angle?.toFixed(3) ?? ''})`,
        });
      } else {
        diffs.push({
          id: `diff-${i}`,
          type: 'modified',
          originalGate: orig,
          optimizedGate: opt,
          description: `Transformed ${origName.toUpperCase() || 'GATE'} to ${optName.toUpperCase() || 'GATE'}`,
        });
      }
    } else if (orig && !opt) {
      const origName = (orig.gate || (orig as any).type || 'gate').toUpperCase();
      diffs.push({
        id: `diff-${i}`,
        type: 'removed',
        originalGate: orig,
        description: `Cancelled or reduced redundant ${origName} via ${appliedPasses[0] || 'algebraic simplification'}`,
      });
    } else if (!orig && opt) {
      const optName = (opt.gate || (opt as any).type || 'gate').toUpperCase();
      diffs.push({
        id: `diff-${i}`,
        type: 'added',
        optimizedGate: opt,
        description: `Optimized synthesis transformation (${optName})`,
      });
    }
  }

  return diffs;
}

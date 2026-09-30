import type { CircuitRequest, Gate } from './types';

export const INITIAL_IBM_COMPOSER_CIRCUIT: CircuitRequest = {
  qubits: 2,
  classical_bits: 2,
  gates: [],
  measure: false,
  shots: 1024,
};

export const INITIAL_BELL_CIRCUIT: CircuitRequest = {
  qubits: 2,
  classical_bits: 2,
  gates: [
    { id: 'gate-0', gate: 'h', targets: [0], column: 0 },
    { id: 'gate-1', gate: 'cx', targets: [0, 1], column: 1 },
  ],
  measure: true,
  shots: 1000,
};

export interface PaletteGateItem {
  id: string;
  name: string;
  label: string;
  color: string;
  textColor?: string;
  symbol?: string;
  hasAngle?: boolean;
  qubits?: number;
}

export const IBM_OPERATIONS_PALETTE: PaletteGateItem[] = [
  // Row 1 (Red & Blue)
  { id: 'h', name: 'H', label: 'Hadamard', color: '#fa4d56', textColor: '#000000', symbol: 'H', qubits: 1 },
  { id: 'x', name: '⊕', label: 'Pauli-X (NOT)', color: '#4589ff', textColor: '#000000', symbol: '⊕', qubits: 1 },
  { id: 'cx', name: 'CX', label: 'Controlled-NOT', color: '#4589ff', textColor: '#000000', symbol: 'cx_icon', qubits: 2 },
  { id: 'cz', name: 'CZ', label: 'Controlled-Z', color: '#4589ff', textColor: '#000000', symbol: 'CZ', qubits: 2 },
  { id: 'ccx', name: 'CCX', label: 'Toffoli (CCNOT)', color: '#4589ff', textColor: '#000000', symbol: 'ccx_icon', qubits: 3 },
  { id: 'swap', name: 'SWAP', label: 'Swap', color: '#4589ff', textColor: '#000000', symbol: 'swap_icon', qubits: 2 },
  { id: 'id', name: 'I', label: 'Identity', color: '#4589ff', textColor: '#000000', symbol: 'I', qubits: 1 },

  // Row 2 (Light Powder Blue)
  { id: 't', name: 'T', label: 'π/8 (T Gate)', color: '#a6c8ff', textColor: '#000000', symbol: 'T', qubits: 1 },
  { id: 's', name: 'S', label: 'Phase (π/2)', color: '#a6c8ff', textColor: '#000000', symbol: 'S', qubits: 1 },
  { id: 'z', name: 'Z', label: 'Pauli-Z (Phase)', color: '#a6c8ff', textColor: '#000000', symbol: 'Z', qubits: 1 },
  { id: 'tdg', name: 'T†', label: 'T Dagger', color: '#a6c8ff', textColor: '#000000', symbol: 'T†', qubits: 1 },
  { id: 'sdg', name: 'S†', label: 'S Dagger', color: '#a6c8ff', textColor: '#000000', symbol: 'S†', qubits: 1 },
  { id: 'p', name: 'P', label: 'Phase P(λ)', color: '#a6c8ff', textColor: '#000000', symbol: 'P', hasAngle: true, qubits: 1 },

  // Row 3 (Light Blue & Slate Gray)
  { id: 'rz', name: 'RZ', label: 'Rotation Z(θ)', color: '#a6c8ff', textColor: '#000000', symbol: 'RZ', hasAngle: true, qubits: 1 },
  { id: 'measure', name: 'Measure', label: 'Measurement', color: '#8d8d8d', textColor: '#000000', symbol: 'measure_icon', qubits: 1 },
  { id: 'reset', name: '|0⟩', label: 'Reset State', color: '#8d8d8d', textColor: '#000000', symbol: '|0⟩', qubits: 1 },
  { id: 'barrier', name: '⋮', label: 'Barrier', color: '#8d8d8d', textColor: '#000000', symbol: '⋮', qubits: 1 },
  { id: 'control', name: '•', label: 'Control Node', color: '#8d8d8d', textColor: '#000000', symbol: '•', qubits: 1 },
  { id: 'if', name: 'if', label: 'Conditional If', color: '#8d8d8d', textColor: '#000000', symbol: 'if', qubits: 1 },

  // Row 4 (Slate Gray & Pink)
  { id: 'for', name: 'for', label: 'Loop For', color: '#8d8d8d', textColor: '#000000', symbol: 'for', qubits: 1 },
  { id: 'while', name: 'while', label: 'Loop While', color: '#8d8d8d', textColor: '#000000', symbol: 'while', qubits: 1 },
  { id: 'box', name: 'box', label: 'Custom Box Unitary', color: '#8d8d8d', textColor: '#000000', symbol: 'box', qubits: 1 },
  { id: 'sx', name: '√X', label: 'Square Root X', color: '#ff8389', textColor: '#000000', symbol: '√X', qubits: 1 },
  { id: 'y', name: 'Y', label: 'Pauli-Y', color: '#ff8389', textColor: '#000000', symbol: 'Y', qubits: 1 },
  { id: 'rx', name: 'RX', label: 'Rotation X(θ)', color: '#ff8389', textColor: '#000000', symbol: 'RX', hasAngle: true, qubits: 1 },

  // Row 5 (Pink & State Disk)
  { id: 'ry', name: 'RY', label: 'Rotation Y(θ)', color: '#ff8389', textColor: '#000000', symbol: 'RY', hasAngle: true, qubits: 1 },
  { id: 'mcx', name: 'MCX', label: 'Multi-Controlled X', color: '#4589ff', textColor: '#000000', symbol: 'MCX', qubits: -1 },
  { id: 'cp', name: 'CP', label: 'Controlled Phase P(λ)', color: '#a6c8ff', textColor: '#000000', symbol: 'CP', hasAngle: true, qubits: 2 },
  { id: 'crx', name: 'CRX', label: 'Controlled RX(θ)', color: '#ff8389', textColor: '#000000', symbol: 'CRX', hasAngle: true, qubits: 2 },
  { id: 'cry', name: 'CRY', label: 'Controlled RY(θ)', color: '#ff8389', textColor: '#000000', symbol: 'CRY', hasAngle: true, qubits: 2 },
  { id: 'crz', name: 'CRZ', label: 'Controlled RZ(θ)', color: '#a6c8ff', textColor: '#000000', symbol: 'CRZ', hasAngle: true, qubits: 2 },
  { id: 'phase_disk', name: 'Phase Disk', label: 'State / Phase Disk', color: 'transparent', textColor: '#000000', symbol: 'disk_icon', qubits: 1 },
];

export const GATE_PALETTE_ITEMS: Array<{
  category: string;
  gates: PaletteGateItem[];
}> = [
  {
    category: 'Operations',
    gates: IBM_OPERATIONS_PALETTE,
  },
];

const BACKEND_SUPPORTED_GATES = new Set([
  'h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'cx', 'cz', 'swap',
  'ccx', 'p', 'cp', 'crx', 'cry', 'crz', 'ch', 'tdg', 'sdg', 'sx', 'id'
]);

const ROTATION_GATES = new Set(['rx', 'ry', 'rz', 'p', 'cp', 'crx', 'cry', 'crz']);

/**
 * Format circuit to strictly match backend JSON expectations (FastAPI / Pydantic GateRequest schema)
 */
export function sanitizeCircuitForBackend(circuit: CircuitRequest): CircuitRequest {
  const sanitizeGate = (g: Gate): Gate | null => {
    const rawGate = (g.gate || '').toLowerCase();
    const gateType = rawGate;

    // Filter out non-unitary or UI helper gates (measure, barrier, reset, etc.)
    if (!BACKEND_SUPPORTED_GATES.has(gateType)) {
      return null;
    }

    const rawTargets = Array.isArray(g.targets) ? g.targets : [];
    const validTargets = rawTargets.filter(
      (t) => typeof t === 'number' && Number.isInteger(t) && t >= 0 && t < circuit.qubits
    );

    // Gate-specific target count & distinctness validation
    if (gateType === 'ccx') {
      if (validTargets.length < 3 || new Set(validTargets.slice(0, 3)).size < 3) return null;
    } else if (['cx', 'cz', 'swap', 'cp', 'crx', 'cry', 'crz', 'ch'].includes(gateType)) {
      if (validTargets.length < 2 || validTargets[0] === validTargets[1]) return null;
    } else {
      if (validTargets.length < 1) return null;
    }

    const isRotation = ROTATION_GATES.has(gateType);
    return {
      gate: gateType,
      targets: [...validTargets],
      ...(isRotation ? { angle: typeof g.angle === 'number' ? g.angle : Math.PI / 2 } : {}),
      ...(g.name !== undefined ? { name: g.name } : {}),
      ...(g.sub_circuit !== undefined
        ? {
            sub_circuit: g.sub_circuit
              .map(sanitizeGate)
              .filter((sg): sg is Gate => sg !== null),
          }
        : {}),
    };
  };

  const hasExplicitMeasure = circuit.gates.some(
    (g) => (g.gate || '').toLowerCase() === 'measure'
  );
  // Default to true for simulation so shots-based backend simulation always computes probabilities
  const shouldMeasure = Boolean(circuit.measure || hasExplicitMeasure || true);

  const validGates: Gate[] = [];
  for (const g of circuit.gates) {
    const sanitized = sanitizeGate(g);
    if (sanitized) {
      validGates.push(sanitized);
    }
  }

  const qubits = Math.max(1, circuit.qubits);
  const classical_bits = Math.max(
    circuit.classical_bits || 0,
    shouldMeasure ? Math.max(1, qubits) : 0
  );

  return {
    qubits,
    classical_bits,
    gates: validGates,
    measure: shouldMeasure,
    shots: circuit.shots || 1000,
    ...(circuit.noise_model ? { noise_model: circuit.noise_model } : {}),
    ...(circuit.topology ? { topology: circuit.topology } : {}),
  };
}

/**
 * Calculate instantaneous frontend structural metrics
 */
export function calculateFrontendMetrics(gates: Gate[], qubitCount: number) {
  const gateCount = gates.length;
  const twoQubitCount = gates.filter((g) => g.targets.length > 1).length;
  const maxColumn = gates.reduce((max, g) => Math.max(max, g.column ?? 0), -1);
  const depth = maxColumn >= 0 ? maxColumn + 1 : 0;

  return {
    gateCount,
    twoQubitCount,
    depth,
    qubitCount,
  };
}

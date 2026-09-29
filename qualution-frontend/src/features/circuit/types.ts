// ── 1. Canonical Circuit Contract ───────────────────────────────────────

export interface CanonicalGate {
  id: string;
  type: string;             // Normalized gate identifier (e.g. 'h', 'x', 'cx', 'cz', 'swap', 'rz')
  targets: number[];        // Target qubit wire indices (0-indexed, ascending or [control, target])
  column: number;           // Sequential execution column (0-indexed)
  angle?: number;           // Rotation angle in radians (for parameterized gates: rx, ry, rz, p, etc.)
  name?: string;            // Custom sub-circuit or composite gate label
  sub_circuit?: CanonicalGate[];
  gate?: string;            // Backward-compatibility alias for legacy code expecting gate.gate
}

export interface CanonicalMeasurement {
  qubit: number;
  classical_bit: number;
  column?: number;
}

export interface CanonicalCircuit {
  qubits: number;
  classical_bits?: number;
  gates: CanonicalGate[];
  measurements: CanonicalMeasurement[];
  measure?: boolean;
  shots?: number;
}

/** Backward-compatibility alias for CanonicalCircuit */
export type CanonicalCircuitState = CanonicalCircuit;

// ── 2. Circuit Analyzer Output Contract ────────────────────────────────

export interface CircuitAnalyzerOutput {
  qubit_count: number;
  gate_count: number;
  depth: number;
  two_qubit_gate_count: number;
  clifford_compatible: boolean;
  estimated_statevector_memory_bytes: number;
  stabilizer_memory_bytes?: number;
  stabilizer_candidate: boolean;
  local_statevector_candidate: boolean;
  mps_candidate: boolean;
  remote_candidate: boolean;
  recommended_execution_method: string;
  recommended_execution_location: string;
  reason: string;
}

// ── 3. Unified Result Contract ─────────────────────────────────────────

export interface UnifiedExecutionResult {
  status?: 'success' | 'not_implemented' | 'failed';
  message?: string;
  backend: string;
  execution_location: string; // e.g. 'local_browser' | 'local_python' | 'cloud'
  execution_method: string;   // e.g. 'stabilizer' | 'statevector' | 'mps' | 'hardware' | 'cloud'
  qubit_count: number;
  shots: number;
  counts?: Record<string, number>;
  probabilities: Record<string, number>;
  statevector?: ComplexNumber[];
  amplitudes?: ComplexNumber[];
  runtime_ms: number;
  approximation?: boolean;
  fidelity?: number;
  truncation_error?: number;
  resource_estimate?: Record<string, any>;
  warnings?: string[];
  routing_reason: string;
}

export interface CloudExecutionResult extends UnifiedExecutionResult {
  status: 'not_implemented';
  message: 'Cloud/QPU execution is on the roadmap';
}


// ── Legacy / Workbench Wire Types ─────────────────────────────────────

export interface Gate {
  id?: string;
  gate: string;
  targets: number[];
  angle?: number;
  column?: number;
  name?: string;
  sub_circuit?: Gate[];
}

export interface NoiseProfile {
  type: 'depolarizing' | 'thermal';
  probability: number;
}

export interface CircuitRequest {
  qubits: number;
  classical_bits: number;
  gates: Gate[];
  measure: boolean;
  shots: number;
  noise_model?: NoiseProfile;
  topology?: string;
}

export type RunMode = 'shots' | 'statevector';

export interface CircuitRunInclude {
  metrics?: boolean;
  timeline?: boolean;
  bloch?: boolean;
}

export interface CircuitRunRequest {
  circuit: CircuitRequest;
  mode?: RunMode;
  backend?: string;
  include?: CircuitRunInclude;
}

export interface CircuitRunCircuitSummary {
  qubits: number;
  classical_bits: number;
  gate_count: number;
  measure: boolean;
  shots: number;
}

export interface CircuitRunRoutingSummary {
  requested_backend: string;
  selected_backend: string;
  framework: string;
  policy: string;
  reason: string;
}

export interface CircuitMetricsResponse {
  qubit_count: number;
  classical_bit_count: number;
  gate_count: number;
  depth: number;
  single_qubit_gate_count: number;
  two_qubit_gate_count: number;
  rotation_gate_count: number;
  measurement_count: number;
  two_qubit_gate_ratio: number;
  statevector_amplitudes: number;
  statevector_memory_bytes: number;
  statevector_memory_mb: number;
  statevector_memory_gb: number;
  simulation_memory_class: string;
  is_clifford?: boolean;
  stabilizer_memory_bytes?: number;
  recommended_simulation_method?: string;
}

export interface ComplexNumber {
  real: number;
  imag: number;
}

export interface BlochVector {
  x: number;
  y: number;
  z: number;
  purity?: number;
  magnitude?: number;
}

export type BlochQubits = Record<string, BlochVector>;

export interface TimelineStep {
  step: number;
  operation: string;
  qubits: number[];
  angle?: number;
  parameters?: Record<string, number> | null;
  statevector?: ComplexNumber[];
  probabilities: Record<string, number>;
  bloch?: BlochVector | null;
  bloch_qubits?: BlochQubits | null;
}

export interface TimelineResponse {
  backend?: string;
  total_steps: number;
  qubits: number;
  steps: TimelineStep[];
  execution_time_ms?: number;
}

export interface CircuitRunSimulationResult {
  backend: string;
  mode: RunMode;
  shots: number;
  counts?: Record<string, number>;
  probabilities: Record<string, number>;
  statevector?: ComplexNumber[];
  execution_time_ms: number;
}

export interface CircuitRunVisualization {
  bloch?: BlochVector | null;
  bloch_qubits?: BlochQubits | null;
  timeline?: TimelineResponse | null;
  timeline_notice?: string | null;
}

export interface CircuitRunResponse {
  circuit: CircuitRunCircuitSummary;
  routing: CircuitRunRoutingSummary;
  metrics?: CircuitMetricsResponse | null;
  simulation: CircuitRunSimulationResult;
  visualization: CircuitRunVisualization;
  execution_time_ms: number;
  transpiled_instructions?: Gate[] | null;
}

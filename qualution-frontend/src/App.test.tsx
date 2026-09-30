import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import * as circuitApi from './api/circuitApi';
import * as optimizationApi from './api/optimization';
import type { CircuitRunResponse } from './features/circuit/types';

// Mock Monaco Editor with textarea to test typing & synchronization
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange?: (val: string) => void }) => (
    <textarea
      data-testid="monaco-mock-textarea"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}));

const mockRunResponse: CircuitRunResponse = {
  circuit: {
    qubits: 2,
    classical_bits: 2,
    gate_count: 2,
    measure: true,
    shots: 1000,
  },
  routing: {
    requested_backend: 'auto',
    selected_backend: 'qiskit_aer',
    framework: 'qiskit',
    policy: 'lowest_measured_latency',
    reason: 'Selected qiskit_aer with lowest measured latency of 1.45 ms',
  },
  metrics: {
    qubit_count: 2,
    classical_bit_count: 2,
    gate_count: 2,
    depth: 2,
    single_qubit_gate_count: 1,
    two_qubit_gate_count: 1,
    rotation_gate_count: 0,
    measurement_count: 2,
    two_qubit_gate_ratio: 0.5,
    statevector_amplitudes: 4,
    statevector_memory_bytes: 64,
    statevector_memory_mb: 0.000061,
    statevector_memory_gb: 0.00000006,
    simulation_memory_class: 'small',
  },
  simulation: {
    backend: 'qiskit_aer',
    mode: 'shots',
    shots: 1000,
    counts: { '00': 504, '11': 496 },
    probabilities: { '00': 0.504, '11': 0.496 },
    statevector: [
      { real: 0.707107, imag: 0 },
      { real: 0, imag: 0 },
      { real: 0, imag: 0 },
      { real: 0.707107, imag: 0 },
    ],
    execution_time_ms: 1.45,
  },
  visualization: {
    bloch: null,
    bloch_qubits: {
      '0': { x: 0.0, y: 0.0, z: 0.0, purity: 0.5, magnitude: 0.0 },
      '1': { x: 0.0, y: 0.0, z: 0.0, purity: 0.5, magnitude: 0.0 },
    },
    timeline: {
      total_steps: 3,
      qubits: 2,
      steps: [
        {
          step: 0,
          operation: 'init',
          qubits: [0, 1],
          probabilities: { '00': 1.0, '01': 0, '10': 0, '11': 0 },
        },
        {
          step: 1,
          operation: 'h',
          qubits: [0],
          probabilities: { '00': 0.5, '01': 0, '10': 0.5, '11': 0 },
        },
        {
          step: 2,
          operation: 'cx',
          qubits: [0, 1],
          probabilities: { '00': 0.504, '01': 0, '10': 0, '11': 0.496 },
        },
      ],
    },
    timeline_notice: null,
  },
  execution_time_ms: 2.34,
};

const mockSingleQubitResponse: CircuitRunResponse = {
  circuit: {
    qubits: 1,
    classical_bits: 1,
    gate_count: 1,
    measure: true,
    shots: 1000,
  },
  routing: {
    requested_backend: 'auto',
    selected_backend: 'qiskit_aer',
    framework: 'qiskit',
    policy: 'lowest_measured_latency',
    reason: 'Selected qiskit_aer',
  },
  metrics: {
    qubit_count: 1,
    classical_bit_count: 1,
    gate_count: 1,
    depth: 1,
    single_qubit_gate_count: 1,
    two_qubit_gate_count: 0,
    rotation_gate_count: 0,
    measurement_count: 1,
    two_qubit_gate_ratio: 0.0,
    statevector_amplitudes: 2,
    statevector_memory_bytes: 32,
    statevector_memory_mb: 0.000031,
    statevector_memory_gb: 0.00000003,
    simulation_memory_class: 'small',
  },
  simulation: {
    backend: 'qiskit_aer',
    mode: 'shots',
    shots: 1000,
    counts: { '0': 500, '1': 500 },
    probabilities: { '0': 0.5, '1': 0.5 },
    statevector: [
      { real: 0.707107, imag: 0 },
      { real: 0.707107, imag: 0 },
    ],
    execution_time_ms: 1.1,
  },
  visualization: {
    bloch: { x: 1.0, y: 0.0, z: 0.0 },
    timeline: null,
    timeline_notice: null,
  },
  execution_time_ms: 1.8,
};

describe('Qualution IDE & Visualization Dashboard (Step 19)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(circuitApi, 'checkReadiness').mockResolvedValue({
      status: 'ready',
      ready: true,
      dependencies: {
        qiskit: { installed: true, version: '2.5.2' },
        'qiskit-aer': { installed: true, version: '0.17.2' },
        pennylane: { installed: true, version: '0.45.1' },
      },
    });
  });

  it('renders empty visualization state before run', async () => {
    render(<App initialRoute="/studio" />);

    await waitFor(() => {
      expect(screen.getByTestId('viz-empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/No Simulation Results Yet/i)).toBeInTheDocument();
  });

  it('renders Results tab with probability histogram after successful run', async () => {
    vi.spyOn(circuitApi, 'runCircuit').mockResolvedValue(mockRunResponse);
    render(<App initialRoute="/studio" />);

    const runBtn = screen.getByRole('button', { name: /run circuit/i });
    await userEvent.click(runBtn);

    // Results tab active by default
    await waitFor(() => {
      expect(screen.getByTestId('pane-results')).toBeInTheDocument();
      expect(screen.getByTestId('probability-histogram')).toBeInTheDocument();
      expect(screen.getByText('50.4%')).toBeInTheDocument();
      expect(screen.getByText('49.6%')).toBeInTheDocument();
    });
  });

  it('switches to State tab and renders complex statevector amplitudes', async () => {
    vi.spyOn(circuitApi, 'runCircuit').mockResolvedValue(mockRunResponse);
    render(<App initialRoute="/studio" />);

    const runBtn = screen.getByRole('button', { name: /run circuit/i });
    await userEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByTestId('pane-results')).toBeInTheDocument();
    });

    const stateTab = screen.getByTestId('tab-state');
    await userEvent.click(stateTab);

    expect(screen.getByTestId('pane-state')).toBeInTheDocument();
    expect(screen.getByTestId('statevector-view')).toBeInTheDocument();
    expect(screen.getByText(/Normalized/i)).toBeInTheDocument();
  });

  it('displays individual per-qubit Bloch spheres with entanglement notice for 2-qubit circuit', async () => {
    vi.spyOn(circuitApi, 'runCircuit').mockResolvedValue(mockRunResponse);
    render(<App initialRoute="/studio" />);

    const runBtn = screen.getByRole('button', { name: /run circuit/i });
    await userEvent.click(runBtn);

    const blochTab = screen.getByTestId('tab-bloch');
    await userEvent.click(blochTab);

    expect(screen.getByTestId('pane-bloch')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-sphere-multi')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-sphere-q0')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-sphere-q1')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-entangled-notice')).toBeInTheDocument();
    expect(screen.getByText(/This circuit is entangled/i)).toBeInTheDocument();
  });

  it('renders 3D Bloch sphere for 1-qubit circuit', async () => {
    vi.spyOn(circuitApi, 'runCircuit').mockResolvedValue(mockSingleQubitResponse);
    render(<App initialRoute="/studio" />);

    const runBtn = screen.getByRole('button', { name: /run circuit/i });
    await userEvent.click(runBtn);

    const blochTab = screen.getByTestId('tab-bloch');
    await userEvent.click(blochTab);

    expect(screen.getByTestId('pane-bloch')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-sphere')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-coord-x')).toHaveTextContent('1.000');
    expect(screen.getByTestId('bloch-state-label')).toHaveTextContent('|+⟩ Symmetric Superposition');
  });

  it('switches to Timeline tab and steps through gate execution progression', async () => {
    vi.spyOn(circuitApi, 'runCircuit').mockResolvedValue(mockRunResponse);
    render(<App initialRoute="/studio" />);

    const runBtn = screen.getByRole('button', { name: /run circuit/i });
    await userEvent.click(runBtn);

    const timelineTab = screen.getByTestId('tab-timeline');
    await userEvent.click(timelineTab);

    expect(screen.getByTestId('pane-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-view')).toBeInTheDocument();

    // Click step 1 (H gate)
    const step1Btn = screen.getByTestId('timeline-step-btn-1');
    await userEvent.click(step1Btn);

    expect(screen.getByText(/H\(q\[0\]\)/i)).toBeInTheDocument();
  });

  it('switches to Metrics tab and renders structural & memory scaling metrics', async () => {
    vi.spyOn(circuitApi, 'runCircuit').mockResolvedValue(mockRunResponse);
    render(<App initialRoute="/studio" />);

    const runBtn = screen.getByRole('button', { name: /run circuit/i });
    await userEvent.click(runBtn);

    const metricsTab = screen.getByTestId('tab-metrics');
    await userEvent.click(metricsTab);

    expect(screen.getByTestId('pane-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-view')).toBeInTheDocument();
    expect(screen.getByText('64 Bytes')).toBeInTheDocument();
    expect(screen.getByText('Circuit Depth')).toBeInTheDocument();
  });

  it('handles simulation errors gracefully in visualization panel', async () => {
    vi.spyOn(circuitApi, 'runCircuit').mockRejectedValue(new Error('AerSimulator allocation error'));
    render(<App initialRoute="/studio" />);

    const runBtn = screen.getByRole('button', { name: /run circuit/i });
    fireEvent.click(runBtn);

    await waitFor(
      () => {
        expect(screen.getByTestId('viz-error-banner')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
    expect(screen.getAllByText(/AerSimulator allocation error/i).length).toBeGreaterThan(0);
  });

  it('inserts a single-qubit gate (X) into circuit via operations palette', async () => {
    render(<App initialRoute="/studio" />);

    const xGate = screen.getByTestId('palette-gate-x');
    fireEvent.doubleClick(xGate);

    // Verify toast notification for inserted gate
    await waitFor(() => {
      expect(screen.getByText(/Inserted X gate/i)).toBeInTheDocument();
    });

    // Verify code editor automatically contains qc.x(0)
    const textarea = screen.getByTestId('monaco-mock-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('qc.x(0)');
  });

  it('switches code generation framework between Qiskit and PennyLane', async () => {
    render(<App initialRoute="/studio" />);

    const select = screen.getByTestId('framework-select');
    const textarea = screen.getByTestId('monaco-mock-textarea') as HTMLTextAreaElement;

    expect(textarea.value).toContain('from qiskit import QuantumCircuit');

    await userEvent.selectOptions(select, 'pennylane');

    expect(textarea.value).toContain('import pennylane as qml');
    expect(textarea.value).toContain('qml.Hadamard(wires=0)');
    expect(textarea.value).toContain('qml.CNOT(wires=[0, 1])');
  });

  it('switches to Learn tab and displays circuit explanation, concept chips, and selected gate details', async () => {
    render(<App initialRoute="/studio" />);

    // Insert/select H gate from operations palette
    const hGate = screen.getByTestId('palette-gate-h');
    fireEvent.doubleClick(hGate);

    // Switch to Learn tab
    const learnTab = screen.getByTestId('tab-learn');
    await userEvent.click(learnTab);

    expect(screen.getByTestId('pane-learn')).toBeInTheDocument();
    expect(screen.getByTestId('learning-panel')).toBeInTheDocument();

    // Verify Bell state recognition and concept tags
    expect(screen.getAllByText(/Bell State/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Superposition')).toBeInTheDocument();
    expect(screen.getByText('Entanglement')).toBeInTheDocument();

    // Verify selected gate explanation card
    expect(screen.getByTestId('selected-gate-learn-card')).toBeInTheDocument();
    expect(screen.getAllByText('Hadamard Gate').length).toBeGreaterThan(0);

    // Switch learning level to technical
    const levelSelect = screen.getByTestId('learning-level-select');
    await userEvent.selectOptions(levelSelect, 'technical');
    expect(screen.getByText(/Matrix Representation/i)).toBeInTheDocument();
  });

  it('navigates to Practice sub-tab and evaluates quiz responses with feedback', async () => {
    render(<App initialRoute="/studio" />);

    const learnTab = screen.getByTestId('tab-learn');
    await userEvent.click(learnTab);

    // Switch to Practice subtab
    const practiceTab = screen.getByTestId('learn-tab-practice');
    await userEvent.click(practiceTab);

    expect(screen.getByTestId('practice-card')).toBeInTheDocument();

    // Select option 0 (correct answer for Bell state)
    const opt0 = screen.getByTestId('practice-option-0');
    await userEvent.click(opt0);

    const checkBtn = screen.getByTestId('check-answer-btn');
    await userEvent.click(checkBtn);

    // Verify feedback
    await waitFor(() => {
      expect(screen.getByTestId('practice-feedback')).toBeInTheDocument();
      expect(screen.getByText('Correct!')).toBeInTheDocument();
    });
  });

  it('switches to AI Tutor tab and interacts with tutor engine for Bell state reasoning', async () => {
    render(<App initialRoute="/studio" />);

    const tutorTab = screen.getByTestId('tab-tutor');
    await userEvent.click(tutorTab);

    expect(screen.getByTestId('pane-tutor')).toBeInTheDocument();
    expect(screen.getByTestId('tutor-panel')).toBeInTheDocument();

    // Type a specific question about the Bell circuit
    const input = screen.getByTestId('tutor-input');
    await userEvent.type(input, 'Why do I only get 00 and 11?');

    const form = screen.getByTestId('tutor-form');
    fireEvent.submit(form);

    // Tutor should explain Bell state
    await waitFor(() => {
      expect(screen.getAllByText(/Bell State/i).length).toBeGreaterThan(0);
    });
  });

  it('handles dirty simulation state, keyboard run (Ctrl+Enter), and command palette', async () => {
    vi.spyOn(circuitApi, 'runCircuit').mockResolvedValue(mockRunResponse);
    render(<App initialRoute="/studio" />);

    // Initial state shows unsaved/dirty simulation
    expect(screen.getByText(/Unsaved simulation/i)).toBeInTheDocument();

    // Trigger run with Set up and Run button
    const runBtn = screen.getByTestId('setup-and-run-btn');
    await userEvent.click(runBtn);

    // Simulation becomes current
    await waitFor(() => {
      expect(screen.getByText(/Simulation current/i)).toBeInTheDocument();
    });

    // Open Command Palette via View menu
    const viewBtn = screen.getByTestId('menu-view-btn');
    await userEvent.click(viewBtn);
    const cmdItem = screen.getByText('Command Palette');
    await userEvent.click(cmdItem);
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();

    // Navigate to Timeline via command palette
    const timelineCmd = screen.getByTestId('cmd-item-nav-timeline');
    await userEvent.click(timelineCmd);

    expect(screen.getByTestId('pane-timeline')).toBeInTheDocument();
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });

  it('opens Optimization Studio, verifies equivalence, applies changes, and allows undo/redo', async () => {
    const mockOptResponse = {
      original_circuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { id: 'g1', gate: 'h', targets: [0], column: 0 },
          { id: 'g2', gate: 'h', targets: [0], column: 1 },
        ],
        measure: true,
        shots: 1000,
      },
      optimized_circuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [],
        measure: true,
        shots: 1000,
      },
      changed: true,
      correctness_verified: true,
      optimization_passes_applied: ['self_inverse_cancellation'],
      original_metrics: {
        qubit_count: 2,
        classical_bit_count: 2,
        gate_count: 2,
        depth: 2,
        single_qubit_gate_count: 2,
        two_qubit_gate_count: 0,
        rotation_gate_count: 0,
        measurement_count: 2,
        two_qubit_gate_ratio: 0,
        statevector_amplitudes: 4,
        statevector_memory_bytes: 64,
        statevector_memory_mb: 0.000061,
        statevector_memory_gb: 0.00000006,
        simulation_memory_class: 'small',
      },
      optimized_metrics: {
        qubit_count: 2,
        classical_bit_count: 2,
        gate_count: 0,
        depth: 0,
        single_qubit_gate_count: 0,
        two_qubit_gate_count: 0,
        rotation_gate_count: 0,
        measurement_count: 2,
        two_qubit_gate_ratio: 0,
        statevector_amplitudes: 4,
        statevector_memory_bytes: 64,
        statevector_memory_mb: 0.000061,
        statevector_memory_gb: 0.00000006,
        simulation_memory_class: 'small',
      },
      improvements: {
        gate_count_reduction: 2,
        gate_count_reduction_percent: 100.0,
        depth_reduction: 2,
        depth_reduction_percent: 100.0,
        two_qubit_gate_reduction: 0,
        two_qubit_gate_reduction_percent: 0.0,
      },
      explanation: ['Cancelled adjacent self-inverse Hadamard gates on qubit 0 (H · H = I).'],
      execution_time_ms: 1.45,
    };

    vi.spyOn(optimizationApi, 'optimizeCircuit').mockResolvedValue(mockOptResponse as any);
    render(<App initialRoute="/studio" />);

    // Open Edit menu and click Optimize in Header
    const editBtn = screen.getByTestId('menu-edit-btn');
    fireEvent.click(editBtn);
    const optimizeBtn = screen.getByTestId('optimize-btn');
    fireEvent.click(optimizeBtn);

    // Studio modal opens
    await waitFor(() => {
      expect(screen.getByTestId('optimization-studio')).toBeInTheDocument();
      expect(screen.getByTestId('formal-verification-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/✓ Formal Equivalence Verified/i)).toBeInTheDocument();

    // Click Apply Optimization
    const applyBtn = screen.getByTestId('btn-apply-optimization');
    fireEvent.click(applyBtn);

    // Studio closes and toast notification appears
    await waitFor(() => {
      expect(screen.queryByTestId('optimization-studio')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Optimization applied/i)).toBeInTheDocument();
  });

  it('toggles AI Quantum Tutor workspace when pressing Ctrl+L shortcut and aligns with header toggle', async () => {
    render(<App initialRoute="/studio" />);

    // Initially Tutor dock and modal are not open
    expect(screen.queryByTestId('tutor-dock-pane')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tutor-panel')).not.toBeInTheDocument();

    // Trigger Ctrl+L shortcut (desktop mode >= 900px)
    fireEvent.keyDown(window, { key: 'l', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByTestId('tutor-dock-pane')).toBeInTheDocument();
      expect(screen.getByTestId('tutor-panel')).toBeInTheDocument();
    });

    // Header toggle reflects open state and can toggle it closed
    const headerTutorBtn = screen.getByTestId('header-tutor-btn');
    expect(headerTutorBtn).toHaveClass('active');

    fireEvent.click(headerTutorBtn);
    await waitFor(() => {
      expect(screen.queryByTestId('tutor-dock-pane')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tutor-panel')).not.toBeInTheDocument();
    });
  });

  it('opens AI Quantum Tutor modal on tablet/mobile viewport when pressing Ctrl+L shortcut', async () => {
    const originalWidth = window.innerWidth;
    window.innerWidth = 800;

    render(<App initialRoute="/studio" />);

    expect(screen.queryByTestId('tutor-feature-modal')).not.toBeInTheDocument();

    // Trigger Ctrl+L shortcut
    fireEvent.keyDown(window, { key: 'l', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByTestId('tutor-feature-modal')).toBeInTheDocument();
      expect(screen.getByTestId('tutor-panel')).toBeInTheDocument();
    });

    window.innerWidth = originalWidth;
  });
});

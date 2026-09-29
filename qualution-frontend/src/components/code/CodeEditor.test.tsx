import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor } from './CodeEditor';
import * as circuitApi from '../../api/circuitApi';
import type { CircuitRequest } from '../../features/circuit/types';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange?: (val: string) => void }) => (
    <textarea
      data-testid="monaco-mock-textarea"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}));

describe('CodeEditor Bidirectional Sync & Parsing', () => {
  const initialCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [{ gate: 'h', targets: [0], column: 0 }],
    measure: true,
    shots: 1024,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with synchronized status and framework options', () => {
    render(<CodeEditor circuit={initialCircuit} onUpdateCircuit={vi.fn()} />);

    expect(screen.getByTestId('sync-status')).toHaveTextContent('Synchronized');
    const select = screen.getByTestId('framework-select') as HTMLSelectElement;
    expect(select.options.length).toBe(4);
    expect(screen.getByRole('option', { name: 'OpenQASM 3.0' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Qiskit (Python)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'PennyLane (Python)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Google Cirq (Python)' })).toBeInTheDocument();
  });

  it('updates dirty state when code is edited in Monaco editor', async () => {
    render(<CodeEditor circuit={initialCircuit} onUpdateCircuit={vi.fn()} />);

    const textarea = screen.getByTestId('monaco-mock-textarea');
    fireEvent.change(textarea, { target: { value: 'OPENQASM 3.0;\nqubit[2] q;\nx q[0];' } });

    expect(screen.getByTestId('sync-status')).toHaveTextContent('Code Modified');
    const syncBtn = screen.getByTestId('sync-code-btn');
    expect(syncBtn).not.toBeDisabled();
  });

  it('successfully triggers sync, opens conflict modal, and applies changes to visual circuit', async () => {
    const onUpdateCircuit = vi.fn();
    const mockParsedResponse: circuitApi.ParseResponse = {
      framework: 'openqasm',
      circuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [
          { gate: 'h', targets: [0] },
          { gate: 'cx', targets: [0, 1] },
        ],
        measure: true,
        shots: 1024,
      },
      warnings: [],
      metadata: { qubit_count: 2, gate_count: 2, measure: true },
    };

    vi.spyOn(circuitApi, 'parseCode').mockResolvedValue(mockParsedResponse);

    render(<CodeEditor circuit={initialCircuit} onUpdateCircuit={onUpdateCircuit} />);

    const select = screen.getByTestId('framework-select');
    fireEvent.change(select, { target: { value: 'openqasm' } });

    const textarea = screen.getByTestId('monaco-mock-textarea');
    fireEvent.change(textarea, {
      target: { value: 'OPENQASM 3.0;\nqubit[2] q;\nh q[0];\ncx q[0], q[1];' },
    });

    const syncBtn = screen.getByTestId('sync-code-btn');
    await userEvent.click(syncBtn);

    expect(circuitApi.parseCode).toHaveBeenCalledWith(
      'openqasm',
      'OPENQASM 3.0;\nqubit[2] q;\nh q[0];\ncx q[0], q[1];'
    );

    // Conflict modal should appear with diff preview
    expect(screen.getByText('Apply Code Changes to Visual Circuit?')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-sync-btn')).toBeInTheDocument();

    // Confirm sync
    await userEvent.click(screen.getByTestId('confirm-sync-btn'));

    expect(onUpdateCircuit).toHaveBeenCalledTimes(1);
    const updated = onUpdateCircuit.mock.calls[0][0];
    expect(updated.gates.length).toBe(2);
    expect(updated.gates[0].gate).toBe('h');
    expect(updated.gates[1].gate).toBe('cx');

    expect(screen.getByTestId('sync-status')).toHaveTextContent('Synchronized');
  });

  it('handles parse error gracefully with error banner and status', async () => {
    vi.spyOn(circuitApi, 'parseCode').mockRejectedValue(new Error('Syntax error on line 3'));

    render(<CodeEditor circuit={initialCircuit} onUpdateCircuit={vi.fn()} />);

    const textarea = screen.getByTestId('monaco-mock-textarea');
    fireEvent.change(textarea, { target: { value: 'invalid syntax !!' } });

    const syncBtn = screen.getByTestId('sync-code-btn');
    await userEvent.click(syncBtn);

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('Parse Error');
      expect(screen.getByTestId('parse-error-banner')).toBeInTheDocument();
      expect(screen.getByText('Syntax error on line 3')).toBeInTheDocument();
    });

    // Dismiss banner
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByTestId('parse-error-banner')).not.toBeInTheDocument();
  });

  it('triggers sync via global qualution:sync-code custom event', async () => {
    const mockParsedResponse: circuitApi.ParseResponse = {
      framework: 'qiskit',
      circuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [{ gate: 'x', targets: [1] }],
        measure: true,
        shots: 1024,
      },
      warnings: [],
      metadata: { qubit_count: 2, gate_count: 1, measure: true },
    };
    vi.spyOn(circuitApi, 'parseCode').mockResolvedValue(mockParsedResponse);

    render(<CodeEditor circuit={initialCircuit} onUpdateCircuit={vi.fn()} />);

    const textarea = screen.getByTestId('monaco-mock-textarea');
    fireEvent.change(textarea, { target: { value: 'modified code' } });

    // Fire custom event wrapped in act
    await act(async () => {
      window.dispatchEvent(new CustomEvent('qualution:sync-code'));
    });

    await waitFor(() => {
      expect(circuitApi.parseCode).toHaveBeenCalledWith('qiskit', 'modified code');
    });
  });

  it('replicates code changes automatically to circuit via debounced sync without resetting editor text', async () => {
    const onUpdateCircuit = vi.fn();
    const { rerender } = render(<CodeEditor circuit={initialCircuit} onUpdateCircuit={onUpdateCircuit} />);

    const textarea = screen.getByTestId('monaco-mock-textarea') as HTMLTextAreaElement;
    const typedCode = 'from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.x(1)';

    fireEvent.change(textarea, { target: { value: typedCode } });
    expect(screen.getByTestId('sync-status')).toHaveTextContent('Code Modified');

    // Wait for debounced replication (600ms)
    await waitFor(() => {
      expect(onUpdateCircuit).toHaveBeenCalled();
    }, { timeout: 1500 });

    const updatedCircuit = onUpdateCircuit.mock.calls[0][0];
    expect(updatedCircuit.gates.length).toBe(2);
    expect(updatedCircuit.gates[0].gate).toBe('h');
    expect(updatedCircuit.gates[1].gate).toBe('x');
    expect(updatedCircuit.gates[1].targets).toEqual([1]);

    // When parent rerenders with updated circuit, editor must NOT overwrite typed text
    rerender(<CodeEditor circuit={updatedCircuit} onUpdateCircuit={onUpdateCircuit} />);
    expect(textarea.value).toBe(typedCode);
    expect(screen.getByTestId('sync-status')).toHaveTextContent('Synchronized');
  });

  it('replicates visual canvas changes to code editor when circuit prop is updated externally', async () => {
    const onUpdateCircuit = vi.fn();
    const { rerender } = render(<CodeEditor circuit={initialCircuit} onUpdateCircuit={onUpdateCircuit} />);

    const textarea = screen.getByTestId('monaco-mock-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('qc.h(0)');

    // External canvas update adds a CX gate
    const externalCircuit: CircuitRequest = {
      ...initialCircuit,
      gates: [
        { gate: 'h', targets: [0], column: 0 },
        { gate: 'cx', targets: [0, 1], column: 1 },
      ],
    };

    rerender(<CodeEditor circuit={externalCircuit} onUpdateCircuit={onUpdateCircuit} />);

    expect(textarea.value).toContain('qc.cx(0, 1)');
    expect(screen.getByTestId('sync-status')).toHaveTextContent('Synchronized');
  });
});


import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CircuitCanvas } from './CircuitCanvas';
import type { CircuitRequest } from '../../features/circuit/types';

const mockCircuit: CircuitRequest = {
  qubits: 2,
  classical_bits: 2,
  gates: [
    { id: 'gate-1', gate: 'h', targets: [0], column: 0 },
    { id: 'gate-2', gate: 'cx', targets: [0, 1], column: 1 },
  ],
  measure: true,
  shots: 1000,
};

describe('CircuitCanvas Component — Zoom Controls (Zoom + and Reduce Zoom -)', () => {
  it('renders toolbar zoom controls with initial 100% zoom level', () => {
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={vi.fn()}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const zoomControls = screen.getByTestId('circuit-zoom-controls');
    expect(zoomControls).toBeInTheDocument();

    const zoomInBtn = screen.getByTestId('zoom-in-btn');
    const zoomOutBtn = screen.getByTestId('zoom-out-btn');
    const zoomResetBtn = screen.getByTestId('zoom-reset-btn');

    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();
    expect(zoomResetBtn).toBeInTheDocument();
    expect(zoomResetBtn).toHaveTextContent('100%');
  });

  it('increases zoom level when clicking Zoom + and updates badge', () => {
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={vi.fn()}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const zoomInBtn = screen.getByTestId('zoom-in-btn');
    const zoomResetBtn = screen.getByTestId('zoom-reset-btn');

    act(() => {
      fireEvent.click(zoomInBtn);
    });
    expect(zoomResetBtn).toHaveTextContent('110%');

    act(() => {
      fireEvent.click(zoomInBtn);
    });
    expect(zoomResetBtn).toHaveTextContent('120%');
  });

  it('reduces zoom level when clicking Reduce Zoom - and resets to 100% on badge click', () => {
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={vi.fn()}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const zoomOutBtn = screen.getByTestId('zoom-out-btn');
    const zoomResetBtn = screen.getByTestId('zoom-reset-btn');

    act(() => {
      fireEvent.click(zoomOutBtn);
    });
    expect(zoomResetBtn).toHaveTextContent('90%');

    act(() => {
      fireEvent.click(zoomOutBtn);
    });
    expect(zoomResetBtn).toHaveTextContent('80%');

    // Click badge to reset to 100%
    act(() => {
      fireEvent.click(zoomResetBtn);
    });
    expect(zoomResetBtn).toHaveTextContent('100%');
  });

  it('interacts with floating zoom HUD in canvas viewport', () => {
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={vi.fn()}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const floatingHUD = screen.getByTestId('canvas-floating-zoom');
    expect(floatingHUD).toBeInTheDocument();

    const floatingZoomIn = screen.getByTestId('floating-zoom-in-btn');
    const floatingZoomOut = screen.getByTestId('floating-zoom-out-btn');
    const floatingZoomReset = screen.getByTestId('floating-zoom-reset-btn');

    act(() => {
      fireEvent.click(floatingZoomIn);
    });
    expect(floatingZoomReset).toHaveTextContent('110%');

    act(() => {
      fireEvent.click(floatingZoomOut);
    });
    expect(floatingZoomReset).toHaveTextContent('100%');
  });

  it('disables zoom buttons at minimum (50%) and maximum (200%) zoom boundaries', () => {
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={vi.fn()}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const zoomInBtn = screen.getByTestId('zoom-in-btn');
    const zoomOutBtn = screen.getByTestId('zoom-out-btn');
    const zoomResetBtn = screen.getByTestId('zoom-reset-btn');

    // Zoom in until max (200%)
    for (let i = 0; i < 15; i++) {
      act(() => {
        fireEvent.click(zoomInBtn);
      });
    }
    expect(zoomResetBtn).toHaveTextContent('200%');
    expect(zoomInBtn).toBeDisabled();
    expect(zoomOutBtn).not.toBeDisabled();

    // Reset back
    act(() => {
      fireEvent.click(zoomResetBtn);
    });
    expect(zoomResetBtn).toHaveTextContent('100%');

    // Zoom out until min (50%)
    for (let i = 0; i < 10; i++) {
      act(() => {
        fireEvent.click(zoomOutBtn);
      });
    }
    expect(zoomResetBtn).toHaveTextContent('50%');
    expect(zoomOutBtn).toBeDisabled();
    expect(zoomInBtn).not.toBeDisabled();
  });

  it('handles keyboard shortcuts (Ctrl+=, Ctrl+-, Ctrl+0) on canvas container', () => {
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={vi.fn()}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const container = screen.getByTestId('circuit-canvas');
    const zoomResetBtn = screen.getByTestId('zoom-reset-btn');

    // Ctrl + = (Zoom In)
    act(() => {
      fireEvent.keyDown(container, { key: '=', ctrlKey: true });
    });
    expect(zoomResetBtn).toHaveTextContent('110%');

    // Ctrl + - (Zoom Out)
    act(() => {
      fireEvent.keyDown(container, { key: '-', ctrlKey: true });
    });
    expect(zoomResetBtn).toHaveTextContent('100%');

    act(() => {
      fireEvent.keyDown(container, { key: '-', ctrlKey: true });
    });
    expect(zoomResetBtn).toHaveTextContent('90%');

    // Ctrl + 0 (Reset Zoom)
    act(() => {
      fireEvent.keyDown(container, { key: '0', ctrlKey: true });
    });
    expect(zoomResetBtn).toHaveTextContent('100%');
  });

  it('responds to global qualution:circuit-zoom custom events', () => {
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={vi.fn()}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const zoomResetBtn = screen.getByTestId('zoom-reset-btn');

    act(() => {
      window.dispatchEvent(new CustomEvent('qualution:circuit-zoom', { detail: 'in' }));
    });
    expect(zoomResetBtn).toHaveTextContent('110%');

    act(() => {
      window.dispatchEvent(new CustomEvent('qualution:circuit-zoom', { detail: 'out' }));
    });
    expect(zoomResetBtn).toHaveTextContent('100%');

    act(() => {
      window.dispatchEvent(new CustomEvent('qualution:circuit-zoom', { detail: 'out' }));
    });
    expect(zoomResetBtn).toHaveTextContent('90%');

    act(() => {
      window.dispatchEvent(new CustomEvent('qualution:circuit-zoom', { detail: 'reset' }));
    });
    expect(zoomResetBtn).toHaveTextContent('100%');
  });
});

describe('CircuitCanvas Component — Inspect Mode and Alignment Modes', () => {
  it('toggles Inspect mode and shows active prompt, then gate details on gate selection or hover', () => {
    const onSelectGate = vi.fn();
    const { rerender } = render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={vi.fn()}
        selectedGateIds={[]}
        onSelectGate={onSelectGate}
      />
    );

    // Toggle inspect switch
    const inspectInput = screen.getByTestId('inspect-toggle-input');
    expect(inspectInput).not.toBeChecked();

    act(() => {
      fireEvent.click(inspectInput);
    });
    expect(inspectInput).toBeChecked();

    // Idle prompt is not rendered (clean canvas)
    expect(screen.queryByTestId('inspector-idle-prompt')).not.toBeInTheDocument();

    // When gate-1 (H gate) is selected
    rerender(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={vi.fn()}
        selectedGateIds={["gate-1"]}
        onSelectGate={onSelectGate}
      />
    );

    // Inspector now shows rich details for Hadamard Gate
    expect(screen.getByText('Hadamard Gate')).toBeInTheDocument();
    expect(screen.getByText('SUPERPOSITION')).toBeInTheDocument();
    expect(screen.getByText(/MATRIX U:/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/√2/i)).toBeInTheDocument();
    expect(screen.getByTestId('inspector-delete-btn')).toBeInTheDocument();
  });

  it('switches alignment modes between Left alignment, Layers, and Freeform', () => {
    const onUpdateCircuit = vi.fn();
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={onUpdateCircuit}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    // Initial mode is compact
    const alignSelect = screen.getByTestId('align-select');
    expect(screen.getByTestId('compact-badge')).toBeInTheDocument();

    // Switch to layers
    act(() => {
      fireEvent.change(alignSelect, { target: { value: 'layers' } });
    });
    expect(screen.getByTestId('layers-depth-badge')).toBeInTheDocument();
    expect(screen.getByText(/Depth: 2 Layers/i)).toBeInTheDocument();
    expect(screen.getByText('L0')).toBeInTheDocument();
    expect(screen.getByText('L1')).toBeInTheDocument();
    expect(onUpdateCircuit).toHaveBeenCalled();

    // Switch to freeform
    act(() => {
      fireEvent.change(alignSelect, { target: { value: 'freeform' } });
    });
    expect(screen.getByTestId('freeform-badge')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('enforces view-only inspection in Inspect mode where no mutations or changes can be made', () => {
    const onUpdateCircuit = vi.fn();
    const onSelectGate = vi.fn();
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={onUpdateCircuit}
        selectedGateIds={['gate-1']}
        onSelectGate={onSelectGate}
        isInspectMode={true}
        canUndo={true}
        canRedo={true}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />
    );

    // 1. Inspect toggle is active
    const inspectInput = screen.getByTestId('inspect-toggle-input');
    expect(inspectInput).toBeChecked();

    // 2. Wire and clear buttons are disabled
    expect(screen.getByTestId('add-qubit-btn')).toBeDisabled();
    expect(screen.getByTestId('remove-qubit-btn')).toBeDisabled();
    expect(screen.getByTestId('clear-circuit-btn')).toBeDisabled();

    // 3. Delete buttons in inspector bar are disabled
    const deleteBtn = screen.getByTestId('inspector-delete-btn');
    expect(deleteBtn).toBeDisabled();
    fireEvent.click(deleteBtn);
    expect(onUpdateCircuit).not.toHaveBeenCalled();

    // 4. Keyboard Delete key on canvas is ignored
    const canvas = screen.getByTestId('circuit-canvas');
    fireEvent.keyDown(canvas, { key: 'Delete' });
    expect(onUpdateCircuit).not.toHaveBeenCalled();

    // 5. Clicking slot does not add a gate
    const emptySlot = screen.getByTestId('slot-0-2');
    fireEvent.click(emptySlot);
    expect(onUpdateCircuit).not.toHaveBeenCalled();

    // 6. Placed gate details are still visible (inspection works!)
    expect(screen.getByText('Hadamard Gate')).toBeInTheDocument();
    expect(screen.getByText(/LIVE INSPECT/i)).toBeInTheDocument();
  });

  it('allows adding wires beyond 8 qubits without limit', () => {
    const onUpdateCircuit = vi.fn();
    const eightQubitCircuit: CircuitRequest = {
      qubits: 8,
      classical_bits: 8,
      gates: [],
      measure: false,
      shots: 1000,
    };

    render(
      <CircuitCanvas
        circuit={eightQubitCircuit}
        onUpdateCircuit={onUpdateCircuit}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const addQubitBtn = screen.getByTestId('add-qubit-btn');
    expect(addQubitBtn).not.toBeDisabled();

    fireEvent.click(addQubitBtn);
    expect(onUpdateCircuit).toHaveBeenCalledWith(
      expect.objectContaining({
        qubits: 9,
        classical_bits: 9,
      })
    );
  });

  it('places gate on wire slot when dropped with application/qualution-gate payload', () => {
    const onUpdateCircuit = vi.fn();
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={onUpdateCircuit}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const slot = screen.getByTestId('slot-0-3');
    fireEvent.dragOver(slot, {
      dataTransfer: { dropEffect: 'none' },
    });
    fireEvent.drop(slot, {
      dataTransfer: {
        getData: (format: string) => (format === 'application/qualution-gate' ? 'x' : ''),
      },
    });

    expect(onUpdateCircuit).toHaveBeenCalledWith(
      expect.objectContaining({
        gates: expect.arrayContaining([
          expect.objectContaining({
            gate: 'x',
            targets: [0],
            column: 3,
          }),
        ]),
      })
    );
  });

  it('places gate on wire slot when dropped with text/plain fallback', () => {
    const onUpdateCircuit = vi.fn();
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={onUpdateCircuit}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const slot = screen.getByTestId('slot-1-4');
    fireEvent.drop(slot, {
      dataTransfer: {
        getData: (format: string) => (format === 'text/plain' ? 'h' : ''),
      },
    });

    expect(onUpdateCircuit).toHaveBeenCalledWith(
      expect.objectContaining({
        gates: expect.arrayContaining([
          expect.objectContaining({
            gate: 'h',
            targets: [1],
            column: 4,
          }),
        ]),
      })
    );
  });

  it('places 2-qubit CX gate on wire slot immediately upon drop', () => {
    const onUpdateCircuit = vi.fn();
    render(
      <CircuitCanvas
        circuit={mockCircuit}
        onUpdateCircuit={onUpdateCircuit}
        selectedGateIds={[]}
        onSelectGate={vi.fn()}
      />
    );

    const slot = screen.getByTestId('slot-0-5');
    fireEvent.drop(slot, {
      dataTransfer: {
        getData: (format: string) => (format === 'application/qualution-gate' ? 'cx' : ''),
      },
    });

    expect(onUpdateCircuit).toHaveBeenCalledWith(
      expect.objectContaining({
        gates: expect.arrayContaining([
          expect.objectContaining({
            gate: 'cx',
            targets: [0, 1],
            column: 5,
          }),
        ]),
      })
    );
  });
});


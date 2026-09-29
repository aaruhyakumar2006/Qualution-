import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Sidebar } from './Sidebar';

describe('Sidebar Component — Operations Palette & Wire Controls', () => {
  it('renders Operations title, wire controls, and gate grid', () => {
    const onAddWire = vi.fn();
    const onRemoveWire = vi.fn();
    const onClearCircuit = vi.fn();
    const onInsertGate = vi.fn();

    render(
      <Sidebar
        onAddWire={onAddWire}
        onRemoveWire={onRemoveWire}
        onClearCircuit={onClearCircuit}
        onInsertGate={onInsertGate}
      />
    );

    // Operations title
    expect(screen.getByText('Operations')).toBeInTheDocument();

    // Wire toolbar buttons
    const addWireBtn = screen.getByTestId('btn-add-wire');
    const removeWireBtn = screen.getByTestId('btn-remove-wire');
    const clearBtn = screen.getByTestId('btn-clear-circuit');

    expect(addWireBtn).toBeInTheDocument();
    expect(removeWireBtn).toBeInTheDocument();
    expect(clearBtn).toBeInTheDocument();

    // Trigger wire actions
    fireEvent.click(addWireBtn);
    expect(onAddWire).toHaveBeenCalledTimes(1);

    fireEvent.click(removeWireBtn);
    expect(onRemoveWire).toHaveBeenCalledTimes(1);

    fireEvent.click(clearBtn);
    expect(onClearCircuit).toHaveBeenCalledTimes(1);
  });

  it('renders standard IBM operations like H, X (⊕), CX, T, Z, RX, RY, S and triggers double-click insertion', () => {
    const onInsertGate = vi.fn();

    render(<Sidebar onInsertGate={onInsertGate} />);

    // Check presence of tiles
    const hGate = screen.getByTestId('palette-gate-h');
    const xGate = screen.getByTestId('palette-gate-x');
    const cxGate = screen.getByTestId('palette-gate-cx');

    expect(hGate).toBeInTheDocument();
    expect(xGate).toBeInTheDocument();
    expect(cxGate).toBeInTheDocument();

    // Double-click to insert
    act(() => {
      fireEvent.doubleClick(hGate);
    });

    expect(onInsertGate).toHaveBeenCalledWith('h');
  });

  it('filters operations when searching', () => {
    render(<Sidebar />);

    // Open search
    const searchBtn = screen.getByLabelText('Search Operations');
    fireEvent.click(searchBtn);

    const searchInput = screen.getByTestId('gate-search-input');
    fireEvent.change(searchInput, { target: { value: 'hadamard' } });

    expect(screen.getByTestId('palette-gate-h')).toBeInTheDocument();
    expect(screen.queryByTestId('palette-gate-cx')).not.toBeInTheDocument();
  });
});

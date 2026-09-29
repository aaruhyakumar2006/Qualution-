import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette Component', () => {
  it('does not render when closed', () => {
    render(
      <CommandPalette
        isOpen={false}
        onClose={vi.fn()}
        onRunCircuit={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onDeleteSelectedGate={vi.fn()}
        onSelectTab={vi.fn()}
        onSelectBackend={vi.fn()}
        onSyncCode={vi.fn()}
        onOptimize={vi.fn()}
        canUndo={false}
        canRedo={false}
        hasSelectedGate={false}
        hasMultipleSelectedGates={false}
        isCustomGateSelected={false}
        onGroupGates={vi.fn()}
        onUngroupGate={vi.fn()}
      />
    );

    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });

  it('renders commands and triggers action on click', () => {
    const onRun = vi.fn();
    const onClose = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={onClose}
        onRunCircuit={onRun}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onDeleteSelectedGate={vi.fn()}
        onSelectTab={vi.fn()}
        onSelectBackend={vi.fn()}
        onSyncCode={vi.fn()}
        onOptimize={vi.fn()}
        canUndo={true}
        canRedo={false}
        hasSelectedGate={false}
        hasMultipleSelectedGates={false}
        isCustomGateSelected={false}
        onGroupGates={vi.fn()}
        onUngroupGate={vi.fn()}
      />
    );

    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type a command/i)).toBeInTheDocument();

    const runCmd = screen.getByTestId('cmd-item-run-circuit');
    fireEvent.click(runCmd);

    expect(onRun).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('filters commands according to search query', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={vi.fn()}
        onRunCircuit={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onDeleteSelectedGate={vi.fn()}
        onSelectTab={vi.fn()}
        onSelectBackend={vi.fn()}
        onSyncCode={vi.fn()}
        onOptimize={vi.fn()}
        canUndo={true}
        canRedo={false}
        hasSelectedGate={false}
        hasMultipleSelectedGates={false}
        isCustomGateSelected={false}
        onGroupGates={vi.fn()}
        onUngroupGate={vi.fn()}
      />
    );

    const input = screen.getByTestId('command-input');
    fireEvent.change(input, { target: { value: 'Timeline' } });

    expect(screen.getByText(/Open Execution Timeline/i)).toBeInTheDocument();
    expect(screen.queryByText(/Open Bloch Sphere/i)).not.toBeInTheDocument();
  });
});

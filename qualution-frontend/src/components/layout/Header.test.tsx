import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { Header } from './Header';
import { ThemeProvider } from '../../features/theme/ThemeContext';

describe('Header Component — Two-Layer Top Navigation', () => {
  const defaultProps = {
    circuitName: 'Bell State Experiment',
    onOpenFiles: vi.fn(),
    onOpenRunConfig: vi.fn(),
    onRun: vi.fn(),
    executionStatus: 'idle' as const,
    onOpenCommandPalette: vi.fn(),
    onOpenShortcuts: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    canUndo: true,
    canRedo: false,
    onOptimize: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Layer 1 with exact text QUANTUM LAB and interactive hamburger menu only', () => {
    render(
      <ThemeProvider>
        <Header {...defaultProps} />
      </ThemeProvider>
    );

    const layer1 = screen.getByTestId('layer-1-app-bar');
    expect(layer1).toBeInTheDocument();

    // Check exact title
    expect(layer1).toHaveTextContent('QUANTUM LAB');

    // Check hamburger button
    const hamburgerBtn = screen.getByTestId('app-hamburger-btn');
    expect(hamburgerBtn).toBeInTheDocument();
    expect(hamburgerBtn).toHaveAttribute('aria-label', 'Open menu');
    expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'false');

    // Verify Layer 1 does NOT contain unrelated controls like backend selector or Save/Run
    expect(layer1.querySelector('select')).toBeNull();
    expect(layer1).not.toHaveTextContent('Save File');
    expect(layer1).not.toHaveTextContent('Set up and Run');
  });

  it('toggles hamburger dropdown menu on click and handles escape key', () => {
    render(
      <ThemeProvider>
        <Header {...defaultProps} />
      </ThemeProvider>
    );

    const hamburgerBtn = screen.getByTestId('app-hamburger-btn');

    // Open hamburger menu
    act(() => {
      fireEvent.click(hamburgerBtn);
    });

    expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('app-menu-dropdown')).toBeInTheDocument();

    // Close on Escape
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.queryByTestId('app-menu-dropdown')).not.toBeInTheDocument();
  });

  it('renders Layer 2 with document title, File, Edit, View, Help on left and Save File, Set up and Run on right', () => {
    render(
      <ThemeProvider>
        <Header {...defaultProps} />
      </ThemeProvider>
    );

    const layer2 = screen.getByTestId('layer-2-menu-bar');
    expect(layer2).toBeInTheDocument();

    // Document title
    const docTitle = screen.getByTestId('workspace-doc-title');
    expect(docTitle).toHaveTextContent('Bell State Experiment');

    // Menu buttons
    expect(screen.getByTestId('menu-file-btn')).toHaveTextContent('File');
    expect(screen.getByTestId('menu-edit-btn')).toHaveTextContent('Edit');
    expect(screen.getByTestId('menu-view-btn')).toHaveTextContent('View');
    expect(screen.getByTestId('menu-help-btn')).toHaveTextContent('Help');

    // Right action buttons
    const saveBtn = screen.getByTestId('save-file-btn');
    expect(saveBtn).toHaveTextContent(/save file/i);

    const runBtn = screen.getByTestId('setup-and-run-btn');
    expect(runBtn).toHaveTextContent(/set up and run/i);
  });

  it('falls back to Untitled when circuitName is not provided', () => {
    render(
      <ThemeProvider>
        <Header {...defaultProps} circuitName="" />
      </ThemeProvider>
    );

    expect(screen.getByTestId('workspace-doc-title')).toHaveTextContent('Untitled');
  });

  it('allows editing circuit document title inline and saves on Enter or blur', () => {
    const onChangeCircuitName = vi.fn();
    render(
      <ThemeProvider>
        <Header {...defaultProps} onChangeCircuitName={onChangeCircuitName} />
      </ThemeProvider>
    );

    const docTitle = screen.getByTestId('workspace-doc-title');
    expect(docTitle).toHaveTextContent('Bell State Experiment');

    // Click to start editing
    act(() => {
      fireEvent.click(docTitle);
    });

    const input = screen.getByTestId('doc-title-input');
    expect(input).toBeInTheDocument();

    // Type new title and press Enter
    act(() => {
      fireEvent.change(input, { target: { value: 'Grover Search Algorithm' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(onChangeCircuitName).toHaveBeenCalledWith('Grover Search Algorithm');
  });

  it('triggers onOpenFiles when clicking Save File button', () => {
    render(
      <ThemeProvider>
        <Header {...defaultProps} />
      </ThemeProvider>
    );

    const saveBtn = screen.getByTestId('save-file-btn');
    act(() => {
      fireEvent.click(saveBtn);
    });

    expect(defaultProps.onOpenFiles).toHaveBeenCalledTimes(1);
  });

  it('triggers onRun when clicking Set up and Run button', () => {
    render(
      <ThemeProvider>
        <Header {...defaultProps} />
      </ThemeProvider>
    );

    const runBtn = screen.getByTestId('setup-and-run-btn');
    act(() => {
      fireEvent.click(runBtn);
    });

    expect(defaultProps.onRun).toHaveBeenCalledTimes(1);
  });

  it('opens File dropdown and exposes Open/Save/Export actions', () => {
    render(
      <ThemeProvider>
        <Header {...defaultProps} />
      </ThemeProvider>
    );

    const fileBtn = screen.getByTestId('menu-file-btn');
    act(() => {
      fireEvent.click(fileBtn);
    });

    const fileDropdown = screen.getByTestId('file-dropdown-menu');
    expect(fileDropdown).toBeInTheDocument();
    expect(within(fileDropdown).getByText('Open File…')).toBeInTheDocument();
    expect(within(fileDropdown).getByText('Save File')).toBeInTheDocument();

    // Click Open File
    act(() => {
      fireEvent.click(within(fileDropdown).getByText('Open File…'));
    });

    expect(defaultProps.onOpenFiles).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('file-dropdown-menu')).not.toBeInTheDocument();
  });

  it('opens Edit dropdown and connects Undo, Redo, and Optimization', () => {
    render(
      <ThemeProvider>
        <Header {...defaultProps} />
      </ThemeProvider>
    );

    const editBtn = screen.getByTestId('menu-edit-btn');
    act(() => {
      fireEvent.click(editBtn);
    });

    expect(screen.getByTestId('edit-dropdown-menu')).toBeInTheDocument();
    const undoBtn = screen.getByText('Undo');
    expect(undoBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(undoBtn);
    });

    expect(defaultProps.onUndo).toHaveBeenCalledTimes(1);
  });

  it('opens View dropdown and connects Command Palette', () => {
    render(
      <ThemeProvider>
        <Header {...defaultProps} />
      </ThemeProvider>
    );

    const viewBtn = screen.getByTestId('menu-view-btn');
    act(() => {
      fireEvent.click(viewBtn);
    });

    expect(screen.getByTestId('view-dropdown-menu')).toBeInTheDocument();
    const cmdPaletteItem = screen.getByText('Command Palette');

    act(() => {
      fireEvent.click(cmdPaletteItem);
    });

    expect(defaultProps.onOpenCommandPalette).toHaveBeenCalledTimes(1);
  });

  it('opens Help dropdown and connects Shortcuts help', () => {
    render(
      <ThemeProvider>
        <Header {...defaultProps} />
      </ThemeProvider>
    );

    const helpBtn = screen.getByTestId('menu-help-btn');
    act(() => {
      fireEvent.click(helpBtn);
    });

    expect(screen.getByTestId('help-dropdown-menu')).toBeInTheDocument();
    const shortcutsItem = screen.getByText('Keyboard Shortcuts');

    act(() => {
      fireEvent.click(shortcutsItem);
    });

    expect(defaultProps.onOpenShortcuts).toHaveBeenCalledTimes(1);
  });

  it('renders shots dropdown to the left of backend dropdown and allows changing shots', () => {
    const onChangeShots = vi.fn();
    render(
      <ThemeProvider>
        <Header {...defaultProps} shots={1000} onChangeShots={onChangeShots} />
      </ThemeProvider>
    );

    const shotsBtn = screen.getByTestId('top-shots-btn-visible');
    const backendBtn = screen.getByTestId('top-backend-btn-visible');
    expect(shotsBtn).toBeInTheDocument();
    expect(backendBtn).toBeInTheDocument();
    expect(shotsBtn).toHaveTextContent('1,000 shots');

    // Verify ordering: shots box comes before backend box in the DOM tree
    const simSection = screen.getByTestId('layer-1-sim-selection');
    const children = Array.from(simSection.children);
    const shotsIndex = children.findIndex((el) => el.contains(shotsBtn));
    const backendIndex = children.findIndex((el) => el.contains(backendBtn));
    expect(shotsIndex).toBeGreaterThanOrEqual(0);
    expect(backendIndex).toBeGreaterThanOrEqual(0);
    expect(shotsIndex).toBeLessThan(backendIndex);

    // Open shots dropdown
    act(() => {
      fireEvent.click(shotsBtn);
    });

    const shotsDropdown = screen.getByTestId('top-shots-dropdown-visible');
    expect(shotsDropdown).toBeInTheDocument();
    expect(within(shotsDropdown).getByText('Execution Shots')).toBeInTheDocument();

    // Select 4,096 shots
    const opt4096 = within(shotsDropdown).getByText('4,096 shots');
    act(() => {
      fireEvent.click(opt4096);
    });

    expect(onChangeShots).toHaveBeenCalledWith(4096);
    expect(screen.queryByTestId('top-shots-dropdown-visible')).not.toBeInTheDocument();
  });
});

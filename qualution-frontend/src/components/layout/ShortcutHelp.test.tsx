import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutHelp } from './ShortcutHelp';

describe('ShortcutHelp Component', () => {
  it('does not render when closed', () => {
    render(<ShortcutHelp isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('shortcut-modal')).not.toBeInTheDocument();
  });

  it('renders shortcut list when open and closes on close button click', () => {
    const onClose = vi.fn();
    render(<ShortcutHelp isOpen={true} onClose={onClose} />);

    expect(screen.getByTestId('shortcut-modal')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText(/Run quantum simulation/i)).toBeInTheDocument();

    const closeBtn = screen.getByLabelText(/Close Shortcuts/i);
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer, type ToastMessage } from './Toast';

describe('ToastContainer Component', () => {
  it('does not render when toasts array is empty', () => {
    render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />);
    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();
  });

  it('renders multiple toast types and triggers dismissal', () => {
    const onDismiss = vi.fn();
    const mockToasts: ToastMessage[] = [
      { id: '1', type: 'success', text: 'Circuit simulated successfully' },
      { id: '2', type: 'error', text: 'Backend offline' },
    ];

    render(<ToastContainer toasts={mockToasts} onDismiss={onDismiss} />);

    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    expect(screen.getByText('Circuit simulated successfully')).toBeInTheDocument();
    expect(screen.getByText('Backend offline')).toBeInTheDocument();

    const dismissBtns = screen.getAllByLabelText(/Dismiss Notification/i);
    fireEvent.click(dismissBtns[0]);

    expect(onDismiss).toHaveBeenCalledWith('1');
  });
});

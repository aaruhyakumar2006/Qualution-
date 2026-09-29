import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingPage } from './LandingPage';
import { AuthProvider } from '../features/auth/AuthContext';

describe('LandingPage Component', () => {
  it('renders exact frontend-qualified hero page with branding, header actions, and typography', () => {
    const onLaunchIDE = vi.fn();
    const onOpenLogin = vi.fn();
    const onOpenSignUp = vi.fn();

    render(
      <AuthProvider>
        <LandingPage
          onLaunchIDE={onLaunchIDE}
          onOpenLogin={onOpenLogin}
          onOpenSignUp={onOpenSignUp}
        />
      </AuthProvider>
    );

    // Check main title & branding
    expect(screen.getAllByText(/QUALUTION/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1, name: /LEARN QUANTUM COMPUTING/i })).toBeInTheDocument();
    expect(screen.getByText(/DISCOVER NOW/i)).toBeInTheDocument();

    // Check top right header buttons
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('triggers onLaunchIDE when clicking Discover Now CTA', async () => {
    const onLaunchIDE = vi.fn();

    render(
      <AuthProvider>
        <LandingPage onLaunchIDE={onLaunchIDE} />
      </AuthProvider>
    );

    const discoverBtn = screen.getByRole('link', { name: /discover now/i });
    await userEvent.click(discoverBtn);
    expect(onLaunchIDE).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenLogin and onOpenSignUp from top-right header', async () => {
    const onOpenLogin = vi.fn();
    const onOpenSignUp = vi.fn();

    render(
      <AuthProvider>
        <LandingPage
          onLaunchIDE={vi.fn()}
          onOpenLogin={onOpenLogin}
          onOpenSignUp={onOpenSignUp}
        />
      </AuthProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(onOpenLogin).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(onOpenSignUp).toHaveBeenCalledTimes(1);
  });
});

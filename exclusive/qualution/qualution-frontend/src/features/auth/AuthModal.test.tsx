import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginModal } from './LoginModal';
import { SignUpModal } from './SignUpModal';
import { AuthProvider } from './AuthContext';
import * as authApi from '../../api/authApi';

describe('Auth Modals', () => {
  it('renders LoginModal with reference template options, switches to email mode and allows guest access', async () => {
    const onClose = vi.fn();
    const onSwitchToSignUp = vi.fn();
    const onSuccess = vi.fn();

    render(
      <AuthProvider>
        <LoginModal
          isOpen={true}
          onClose={onClose}
          onSwitchToSignUp={onSwitchToSignUp}
          onSuccess={onSuccess}
        />
      </AuthProvider>
    );

    // Verify reference template elements
    expect(screen.getByRole('heading', { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with apple/i })).toBeInTheDocument();

    // Click "Sign in with email or username"
    const emailOptionBtn = screen.getByRole('button', { name: /sign in with email or username/i });
    await userEvent.click(emailOptionBtn);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeInTheDocument();

    // Switch to signup
    const switchLink = screen.getByRole('button', { name: /^sign up$/i });
    await userEvent.click(switchLink);
    expect(onSwitchToSignUp).toHaveBeenCalledTimes(1);

    // Guest access
    const guestBtn = screen.getByRole('button', { name: /launch studio as guest/i });
    await userEvent.click(guestBtn);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits login form with valid credentials', async () => {
    const loginSpy = vi.spyOn(authApi, 'loginUser').mockResolvedValue({
      access_token: 'fake-jwt-token-123',
      token_type: 'bearer',
    });

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <AuthProvider>
        <LoginModal
          isOpen={true}
          onClose={onClose}
          onSwitchToSignUp={vi.fn()}
          onSuccess={onSuccess}
        />
      </AuthProvider>
    );

    // Switch to email mode
    const emailOptionBtn = screen.getByRole('button', { name: /sign in with email or username/i });
    await userEvent.click(emailOptionBtn);

    const emailInput = screen.getByLabelText(/email address/i);
    const passInput = screen.getByPlaceholderText(/••••••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /sign in to studio/i });

    await userEvent.type(emailInput, 'student@qualution.ai');
    await userEvent.type(passInput, 'Password123!');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'student@qualution.ai',
        password: 'Password123!',
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renders SignUpModal, validates inputs, and submits registration', async () => {
    const registerSpy = vi.spyOn(authApi, 'registerUser').mockResolvedValue({
      id: 'mock-user-id',
      email: 'newbie@qualution.ai',
      full_name: 'Quantum Newbie',
      role: 'student',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    vi.spyOn(authApi, 'loginUser').mockResolvedValue({
      access_token: 'fake-jwt-token-456',
      token_type: 'bearer',
    });

    const onClose = vi.fn();
    const onSwitchToLogin = vi.fn();
    const onSuccess = vi.fn();

    render(
      <AuthProvider>
        <SignUpModal
          isOpen={true}
          onClose={onClose}
          onSwitchToLogin={onSwitchToLogin}
          onSuccess={onSuccess}
        />
      </AuthProvider>
    );

    // Verify reference template
    expect(screen.getByRole('heading', { name: /^sign up$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up with facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with apple/i })).toBeInTheDocument();

    // Click "Sign up with email or username"
    const emailOptionBtn = screen.getByRole('button', { name: /sign up with email or username/i });
    await userEvent.click(emailOptionBtn);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passInput = screen.getByPlaceholderText(/min 6 characters/i);
    const confirmInput = screen.getByPlaceholderText(/re-enter password/i);
    const submitBtn = screen.getByRole('button', { name: /get started free/i });

    await userEvent.type(nameInput, 'Quantum Newbie');
    await userEvent.type(emailInput, 'newbie@qualution.ai');
    await userEvent.type(passInput, 'QuantumPass123!');
    await userEvent.type(confirmInput, 'QuantumPass123!');

    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        email: 'newbie@qualution.ai',
        full_name: 'Quantum Newbie',
        password: 'QuantumPass123!',
        role: 'student',
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});

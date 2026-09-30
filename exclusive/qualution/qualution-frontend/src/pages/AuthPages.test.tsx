import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';
import { SignUpPage } from './SignUpPage';
import { AuthProvider } from '../features/auth/AuthContext';
import { ThemeProvider } from '../features/theme/ThemeContext';
import * as authApi from '../api/authApi';

describe('LoginPage and SignUpPage Components', () => {
  it('renders LoginPage, validates interaction, and logs in', async () => {
    const loginSpy = vi.spyOn(authApi, 'loginUser').mockResolvedValue({
      access_token: 'valid-jwt-token',
      token_type: 'bearer',
    });

    const onNavigateHome = vi.fn();
    const onNavigateSignUp = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ThemeProvider>
        <AuthProvider>
          <LoginPage
            onNavigateHome={onNavigateHome}
            onNavigateSignUp={onNavigateSignUp}
            onSuccess={onSuccess}
          />
        </AuthProvider>
      </ThemeProvider>
    );

    // Verify title and brand
    expect(screen.getByRole('heading', { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with apple/i })).toBeInTheDocument();

    // Click "Sign in with email or username"
    const emailOptionBtn = screen.getByRole('button', { name: /sign in with email or username/i });
    await userEvent.click(emailOptionBtn);

    // Verify inputs
    const emailInput = screen.getByLabelText(/email address/i);
    const passInput = screen.getByPlaceholderText(/••••••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /^sign in$/i });

    await userEvent.type(emailInput, 'user@quantum.edu');
    await userEvent.type(passInput, 'secret123');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'user@quantum.edu',
        password: 'secret123',
      });
      expect(onSuccess).toHaveBeenCalled();
    });

    // Verify navigation buttons
    const homeBtn = screen.getByRole('button', { name: /back to home/i });
    await userEvent.click(homeBtn);
    expect(onNavigateHome).toHaveBeenCalled();

    const signUpLink = screen.getByRole('button', { name: /^sign up$/i });
    await userEvent.click(signUpLink);
    expect(onNavigateSignUp).toHaveBeenCalled();
  });

  it('renders SignUpPage and steps through the full quantum questionnaire onboarding flow', async () => {
    const registerSpy = vi.spyOn(authApi, 'registerUser').mockResolvedValue({
      id: 'usr-1',
      email: 'newbie@quantum.edu',
      full_name: 'Richard Feynman',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    vi.spyOn(authApi, 'loginUser').mockResolvedValue({
      access_token: 'new-token',
      token_type: 'bearer',
    });

    const onNavigateHome = vi.fn();
    const onNavigateLogin = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ThemeProvider>
        <AuthProvider>
          <SignUpPage
            onNavigateHome={onNavigateHome}
            onNavigateLogin={onNavigateLogin}
            onSuccess={onSuccess}
          />
        </AuthProvider>
      </ThemeProvider>
    );

    // Step 1: Account Setup
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e\.g\. jane doe/i);
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    const passInput = screen.getByPlaceholderText(/create a strong password/i);
    const confirmInput = screen.getByPlaceholderText(/repeat your password/i);
    const step1Btn = screen.getByRole('button', { name: /continue to assessment/i });

    await userEvent.type(nameInput, 'Richard Feynman');
    await userEvent.type(emailInput, 'richard@caltech.edu');
    await userEvent.type(passInput, 'secret123');
    await userEvent.type(confirmInput, 'secret123');

    await userEvent.click(step1Btn);

    // Step 2: Background Question
    await waitFor(() => {
      expect(screen.getByText(/what is your background\?/i)).toBeInTheDocument();
    });

    // Select Researcher card
    const researcherCard = screen.getByText(/researcher \/ educator/i);
    await userEvent.click(researcherCard);

    const step2Btn = screen.getByRole('button', { name: /next: concept check/i });
    await userEvent.click(step2Btn);

    // Step 3: Question 1 (Hadamard interference)
    await waitFor(() => {
      expect(screen.getByText(/concept check: the hadamard gate/i)).toBeInTheDocument();
    });

    const optA_Q1 = screen.getByText(/returns deterministically to \|0⟩/i);
    await userEvent.click(optA_Q1);

    const step3Btn = screen.getByRole('button', { name: /next: entanglement check/i });
    await userEvent.click(step3Btn);

    // Step 4: Question 2 (CNOT entanglement)
    await waitFor(() => {
      expect(screen.getByText(/concept check: controlled-not \(cx\)/i)).toBeInTheDocument();
    });

    const optA_Q2 = screen.getByText(/an entangled bell state/i);
    await userEvent.click(optA_Q2);

    const finalizeBtn = screen.getByRole('button', { name: /generate profile & complete/i });
    await userEvent.click(finalizeBtn);

    // Step 5: Profile Summary
    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        full_name: 'Richard Feynman',
        email: 'richard@caltech.edu',
        password: 'secret123',
        role: 'admin',
      });
      expect(screen.getByText(/welcome to quantum studio!/i)).toBeInTheDocument();
      expect(screen.getByText(/quantum architect/i)).toBeInTheDocument();
    });

    // Launch Studio
    const launchStudioBtn = screen.getByRole('button', { name: /launch quantum studio/i });
    await userEvent.click(launchStudioBtn);
    expect(onSuccess).toHaveBeenCalled();
  });
});

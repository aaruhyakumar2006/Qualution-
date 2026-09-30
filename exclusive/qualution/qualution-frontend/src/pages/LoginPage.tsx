import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';
import { AuthBadge, GoogleIcon, FacebookIcon, AppleIcon } from '../features/auth/AuthSocialButtons';
import '../features/auth/AuthModal.css';
import './AuthPage.css';

interface LoginPageProps {
  onNavigateHome: () => void;
  onNavigateSignUp: () => void;
  onSuccess: (role?: 'student' | 'teacher') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateHome,
  onNavigateSignUp,
  onSuccess,
}) => {
  const { login, enterGuestMode, isLoading } = useAuth();
  const { theme } = useTheme();

  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [viewMode, setViewMode] = useState<'options' | 'email'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      await login({ email: email.trim(), password, role });
      onSuccess(role);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please verify your email and password.';
      setErrorMessage(msg);
    }
  };

  const handleGuestAccess = () => {
    enterGuestMode(role);
    onSuccess(role);
  };

  const handleSocialLogin = (provider: string) => () => {
    enterGuestMode(role);
    onSuccess(role);
  };

  return (
    <div className="auth-page-root flex flex-col min-h-screen bg-slate-900 justify-center items-center p-4" data-theme={theme}>
      <div className="auth-page-grid-overlay" />

      {/* Top back navigation */}
      <div className="w-full max-w-[420px] mb-4 flex justify-between items-center z-10">
        <button
          type="button"
          className="text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          onClick={onNavigateHome}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Reference Card Container */}
      <main className="auth-modal-card relative z-10 w-full max-w-[410px] mx-auto">
        {/* Reference Top Logo Badge */}
        <AuthBadge />

        {/* Title */}
        <h1 className="auth-ref-title">Sign in</h1>

        {/* Role Toggle: Student vs Teacher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: '1.25rem',
        }}>
          <button
            type="button"
            onClick={() => {
              setRole('student');
              if (!email || email === 'teacher@qualution.edu') setEmail('aarav.sharma@qualution.edu');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: role === 'student' ? '#0284c7' : 'transparent',
              color: role === 'student' ? '#ffffff' : '#94a3b8',
              border: role === 'student' ? '1px solid #38bdf8' : '1px solid transparent',
              boxShadow: role === 'student' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none',
            }}
          >
            <span>🎓 Student</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('teacher');
              if (!email || email === 'aarav.sharma@qualution.edu') setEmail('teacher@qualution.edu');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: role === 'teacher' ? '#7c3aed' : 'transparent',
              color: role === 'teacher' ? '#ffffff' : '#94a3b8',
              border: role === 'teacher' ? '1px solid #a855f7' : '1px solid transparent',
              boxShadow: role === 'teacher' ? '0 2px 8px rgba(124, 58, 237, 0.4)' : 'none',
            }}
          >
            <span>👨‍🏫 Teacher</span>
          </button>
        </div>

        {errorMessage && (
          <div className="auth-ref-error" role="alert">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {viewMode === 'options' ? (
          <>
            <div className="auth-ref-buttons-stack">
              <button
                type="button"
                className="auth-ref-btn-social"
                onClick={handleSocialLogin('Google')}
              >
                <GoogleIcon size={19} />
                <span>Sign in with Google</span>
              </button>

              <button
                type="button"
                className="auth-ref-btn-social"
                onClick={handleSocialLogin('Facebook')}
              >
                <FacebookIcon size={19} />
                <span>Sign in with Facebook</span>
              </button>

              <button
                type="button"
                className="auth-ref-btn-social"
                onClick={handleSocialLogin('Apple')}
              >
                <AppleIcon size={19} />
                <span>Continue with Apple</span>
              </button>

              <button
                type="button"
                className="auth-ref-btn-dark"
                onClick={() => setViewMode('email')}
              >
                <span>Sign in with email or username</span>
              </button>
            </div>

            <div className="auth-ref-guest-row">
              <button
                type="button"
                className="auth-ref-guest-btn"
                onClick={handleGuestAccess}
              >
                Launch Studio as Guest (No Login Required)
              </button>
            </div>

            <div className="auth-ref-footer">
              New user?{' '}
              <button
                type="button"
                className="auth-ref-footer-link"
                onClick={onNavigateSignUp}
              >
                Sign up
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="auth-ref-back-btn"
              onClick={() => {
                setViewMode('options');
                setErrorMessage(null);
              }}
            >
              <ArrowLeft size={15} />
              <span>All sign in options</span>
            </button>

            <form className="auth-ref-form" onSubmit={handleSubmit}>
              <div className="auth-ref-input-group">
                <label className="auth-ref-label" htmlFor="login-page-email">
                  Email Address
                </label>
                <div className="auth-ref-input-wrapper">
                  <Mail size={16} className="auth-ref-input-icon" />
                  <input
                    id="login-page-email"
                    type="email"
                    className="auth-ref-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-ref-input-group">
                <label className="auth-ref-label" htmlFor="login-page-password">
                  Password
                </label>
                <div className="auth-ref-input-wrapper">
                  <Lock size={16} className="auth-ref-input-icon" />
                  <input
                    id="login-page-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-ref-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-ref-pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-ref-btn-dark"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-ref-guest-row">
              <button
                type="button"
                className="auth-ref-guest-btn"
                onClick={handleGuestAccess}
              >
                Launch Studio as Guest (No Login Required)
              </button>
            </div>

            <div className="auth-ref-footer">
              New user?{' '}
              <button
                type="button"
                className="auth-ref-footer-link"
                onClick={onNavigateSignUp}
              >
                Sign up
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
export default LoginPage;

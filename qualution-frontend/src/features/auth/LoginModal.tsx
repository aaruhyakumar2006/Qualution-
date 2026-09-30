import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthContext';
import { AuthBadge, GoogleIcon, FacebookIcon, AppleIcon } from './AuthSocialButtons';
import './AuthModal.css';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  onSuccess?: (role?: 'student' | 'teacher') => void;
  initialMode?: 'options' | 'email';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignUp,
  onSuccess,
  initialMode = 'options',
}) => {
  const { login, enterGuestMode, isLoading } = useAuth();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [viewMode, setViewMode] = useState<'options' | 'email'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      await login({ email: email.trim(), password, role });
      if (onSuccess) onSuccess(role);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setErrorMessage(msg);
    }
  };

  const handleGuestAccess = () => {
    enterGuestMode(role);
    if (onSuccess) onSuccess(role);
    onClose();
  };

  const handleSocialLogin = (provider: string) => () => {
    // Convenient mock SSO that grants guest or authenticated access seamlessly
    enterGuestMode(role);
    if (onSuccess) onSuccess(role);
    onClose();
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="auth-modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Reference Top Logo Badge */}
        <AuthBadge />

        {/* Title */}
        <h2 className="auth-ref-title">Sign in</h2>

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
          /* ── Main Options Stack matching reference screenshot ── */
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
                onClick={onSwitchToSignUp}
              >
                Sign up
              </button>
            </div>
          </>
        ) : (
          /* ── Email / Password Form View ── */
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
                <label className="auth-ref-label" htmlFor="login-email">
                  Email Address
                </label>
                <div className="auth-ref-input-wrapper">
                  <Mail size={16} className="auth-ref-input-icon" />
                  <input
                    id="login-email"
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
                <label className="auth-ref-label" htmlFor="login-password">
                  Password
                </label>
                <div className="auth-ref-input-wrapper">
                  <Lock size={16} className="auth-ref-input-icon" />
                  <input
                    id="login-password"
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
                {isLoading ? 'Authenticating...' : 'Sign In to Studio'}
                <ArrowRight size={16} />
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
                onClick={onSwitchToSignUp}
              >
                Sign up
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default LoginModal;

import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, X, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthContext';
import { AuthBadge, GoogleIcon, FacebookIcon, AppleIcon } from './AuthSocialButtons';
import './AuthModal.css';

export interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSuccess?: (role?: 'student' | 'teacher') => void;
  initialMode?: 'options' | 'email';
}

export const SignUpModal: React.FC<SignUpModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onSuccess,
  initialMode = 'options',
}) => {
  const { register, enterGuestMode, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'options' | 'email'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      await register({
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        role,
      });
      const chosenRole: 'student' | 'teacher' = role === 'teacher' ? 'teacher' : 'student';
      if (onSuccess) onSuccess(chosenRole);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Registration failed. Email might already exist.';
      setErrorMessage(msg);
    }
  };

  const handleGuestAccess = () => {
    const chosenRole: 'student' | 'teacher' = role === 'teacher' ? 'teacher' : 'student';
    enterGuestMode(chosenRole);
    if (onSuccess) onSuccess(chosenRole);
    onClose();
  };

  const handleSocialSignUp = (provider: string) => () => {
    const chosenRole: 'student' | 'teacher' = role === 'teacher' ? 'teacher' : 'student';
    enterGuestMode(chosenRole);
    if (onSuccess) onSuccess(chosenRole);
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
        <h2 className="auth-ref-title">Sign up</h2>

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
                onClick={handleSocialSignUp('Google')}
              >
                <GoogleIcon size={19} />
                <span>Sign up with Google</span>
              </button>

              <button
                type="button"
                className="auth-ref-btn-social"
                onClick={handleSocialSignUp('Facebook')}
              >
                <FacebookIcon size={19} />
                <span>Sign up with Facebook</span>
              </button>

              <button
                type="button"
                className="auth-ref-btn-social"
                onClick={handleSocialSignUp('Apple')}
              >
                <AppleIcon size={19} />
                <span>Continue with Apple</span>
              </button>

              <button
                type="button"
                className="auth-ref-btn-dark"
                onClick={() => setViewMode('email')}
              >
                <span>Sign up with email or username</span>
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
              Already have an account?{' '}
              <button
                type="button"
                className="auth-ref-footer-link"
                onClick={onSwitchToLogin}
              >
                Sign in
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
              <span>All sign up options</span>
            </button>

            <form className="auth-ref-form" onSubmit={handleSubmit}>
              <div className="auth-ref-input-group">
                <label className="auth-ref-label" htmlFor="signup-name">
                  Full Name
                </label>
                <div className="auth-ref-input-wrapper">
                  <User size={16} className="auth-ref-input-icon" />
                  <input
                    id="signup-name"
                    type="text"
                    className="auth-ref-input"
                    placeholder="Richard Feynman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="auth-ref-input-group">
                <label className="auth-ref-label" htmlFor="signup-email">
                  Email Address
                </label>
                <div className="auth-ref-input-wrapper">
                  <Mail size={16} className="auth-ref-input-icon" />
                  <input
                    id="signup-email"
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
                <label className="auth-ref-label" htmlFor="signup-password">
                  Password
                </label>
                <div className="auth-ref-input-wrapper">
                  <Lock size={16} className="auth-ref-input-icon" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-ref-input"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              <div className="auth-ref-input-group">
                <label className="auth-ref-label" htmlFor="signup-confirm-password">
                  Confirm Password
                </label>
                <div className="auth-ref-input-wrapper">
                  <Lock size={16} className="auth-ref-input-icon" />
                  <input
                    id="signup-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-ref-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div className="auth-ref-input-group">
                <label className="auth-ref-label">Primary Role</label>
                <div className="auth-ref-role-grid">
                  {(['student', 'teacher', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`auth-ref-role-option ${role === r ? 'selected' : ''}`}
                      onClick={() => setRole(r)}
                    >
                      {r === 'admin' ? 'Developer' : r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="auth-ref-btn-dark"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Get Started Free'}
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
              Already have an account?{' '}
              <button
                type="button"
                className="auth-ref-footer-link"
                onClick={onSwitchToLogin}
              >
                Sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default SignUpModal;

import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Atom,
  Sun,
  Moon,
  AlertCircle,
  Loader2,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Cpu,
  Compass,
  Layers,
  HelpCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';
import './AuthPage.css';

interface SignUpPageProps {
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
  onSuccess: () => void;
  onNavigateTeacherPortal?: () => void;
  onNavigateStudentPortal?: () => void;
}

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onNavigateHome,
  onNavigateLogin,
  onSuccess,
  onNavigateTeacherPortal,
  onNavigateStudentPortal,
}) => {
  const { register, enterGuestMode, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Step state
  const [step, setStep] = useState<OnboardingStep>(1);

  // Step 1: Account credentials
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Background / Role
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'student' | 'developer' | 'researcher'>('beginner');

  // Step 3: Question 1 (Hadamard interference)
  const [q1Answer, setQ1Answer] = useState<string | null>(null);

  // Step 4: Question 2 (CNOT entanglement)
  const [q2Answer, setQ2Answer] = useState<string | null>(null);

  // Error handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Step 1 Validation ───────────────────────────────────────
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Step 1 is valid, proceed to awareness questions
    setStep(2);
  };

  // ── Final Submission & Account Creation ─────────────────────
  const handleFinalizeRegistration = async () => {
    setErrorMessage(null);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });

      // Save user quantum questionnaire profile to localStorage
      try {
        localStorage.setItem(
          'qualution_onboarding_profile',
          JSON.stringify({
            experienceLevel,
            q1Answer,
            q2Answer,
            completedAt: new Date().toISOString(),
          })
        );
      } catch {
        // Ignore storage errors
      }

      // Show summary step
      setStep(5);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Registration encountered an issue. You can continue as Guest.';
      setErrorMessage(msg);
    }
  };

  const handleGuestAccess = () => {
    enterGuestMode(role === 'teacher' ? 'teacher' : 'student');
    if (role === 'teacher' && onNavigateTeacherPortal) {
      onNavigateTeacherPortal();
    } else if (onNavigateStudentPortal) {
      onNavigateStudentPortal();
    } else {
      onSuccess();
    }
  };

  // Compute diagnostic metrics
  const getDiagnosticScore = () => {
    let score = 50;
    if (q1Answer === 'A') score += 25;
    if (q2Answer === 'A') score += 25;
    return score;
  };

  const getProfileTitle = () => {
    const score = getDiagnosticScore();
    if (score === 100) return 'Quantum Architect';
    if (score >= 75) return 'Quantum Practitioner';
    return 'Quantum Explorer';
  };

  return (
    <div className="auth-page-root" data-theme={theme}>
      <div className="auth-page-grid-overlay" />

      {/* Top Navigation */}
      <header className="auth-page-nav">
        <button
          type="button"
          className="auth-brand-logo"
          onClick={onNavigateHome}
          aria-label="Qualution Home"
        >
          <div className="auth-brand-icon">
            <Atom size={20} />
          </div>
          <div className="auth-brand-titles">
            <span className="auth-brand-title">QUALUTION</span>
            <span className="auth-brand-subtitle">Quantum Studio</span>
          </div>
        </button>

        <div className="auth-page-nav-actions">
          <button
            type="button"
            className="auth-nav-link-btn"
            onClick={onNavigateHome}
          >
            <ChevronLeft size={16} />
            <span>Back to Home</span>
          </button>
          <button
            type="button"
            className="lp-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Centered Flow */}
      <main className="auth-page-content">
        <div className={`auth-flow-card ${step >= 2 ? 'wide-card' : ''}`}>
          {/* Step Progress Bar */}
          <div className="auth-step-progress-bar">
            <div
              className="auth-step-progress-fill"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          {/* ══════════════════════════════════════════════════════
              STEP 1: ACCOUNT DETAILS (Full Name, Email, Passwords)
              ══════════════════════════════════════════════════════ */}
          {step === 1 && (
            <>
              <div className="auth-card-header">
                <div className="auth-step-indicator-pill">
                  <Sparkles size={12} />
                  <span>Step 1 of 4 • Account Credentials</span>
                </div>
                <h1 className="auth-card-title">Create an Account</h1>
                <p className="auth-card-subtitle">
                  Enter your credentials to begin your personalized quantum journey.
                </p>
              </div>

              {errorMessage && (
                <div className="auth-page-error-banner" role="alert">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form className="auth-page-form" onSubmit={handleStep1Submit}>
                {/* Role Profile Selection (Teacher vs Student) */}
                <div className="auth-role-toggle-group">
                  <label className="auth-page-label">Choose Your Profile Type</label>
                  <div className="auth-role-select-cards">
                    <button
                      type="button"
                      className={`auth-role-choice-card ${role === 'student' ? 'selected' : ''}`}
                      onClick={() => setRole('student')}
                    >
                      <div className="auth-role-choice-icon student">
                        <GraduationCap size={20} />
                      </div>
                      <div className="auth-role-choice-text">
                        <div className="auth-role-choice-title">Student / Learner</div>
                        <div className="auth-role-choice-desc">Personal scores, curriculum roadmap &amp; circuit portfolio.</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`auth-role-choice-card ${role === 'teacher' ? 'selected' : ''}`}
                      onClick={() => setRole('teacher')}
                    >
                      <div className="auth-role-choice-icon teacher">
                        <Users size={20} />
                      </div>
                      <div className="auth-role-choice-text">
                        <div className="auth-role-choice-title">Teacher / Instructor</div>
                        <div className="auth-role-choice-desc">Inspect student cohorts, live simulator status &amp; send feedback.</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="auth-page-form-group">
                  <label className="auth-page-label" htmlFor="signup-page-name">
                    Full Name
                  </label>
                  <div className="auth-page-input-wrapper">
                    <UserIcon size={16} className="auth-page-input-icon" />
                    <input
                      id="signup-page-name"
                      type="text"
                      className="auth-page-input"
                      placeholder="e.g. Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-page-form-group">
                  <label className="auth-page-label" htmlFor="signup-page-email">
                    Email Address
                  </label>
                  <div className="auth-page-input-wrapper">
                    <Mail size={16} className="auth-page-input-icon" />
                    <input
                      id="signup-page-email"
                      type="email"
                      className="auth-page-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="auth-page-form-group">
                  <label className="auth-page-label" htmlFor="signup-page-password">
                    Password (min. 6 characters)
                  </label>
                  <div className="auth-page-input-wrapper">
                    <Lock size={16} className="auth-page-input-icon" />
                    <input
                      id="signup-page-password"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-page-input"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-page-pwd-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="auth-page-form-group">
                  <label className="auth-page-label" htmlFor="signup-page-confirm-password">
                    Confirm Password
                  </label>
                  <div className="auth-page-input-wrapper">
                    <Lock size={16} className="auth-page-input-icon" />
                    <input
                      id="signup-page-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-page-input"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  {confirmPassword && (
                    <div
                      className={`auth-pwd-match-hint ${
                        password === confirmPassword ? 'valid' : 'invalid'
                      }`}
                    >
                      {password === confirmPassword ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button type="submit" className="auth-page-submit-btn">
                  <span>Continue to Assessment</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="auth-page-divider">or explore instantly</div>

              <button
                type="button"
                className="auth-page-guest-btn"
                onClick={handleGuestAccess}
              >
                <span>Continue as Guest (No Account Required)</span>
              </button>

              <div className="auth-quick-portal-links">
                {onNavigateTeacherPortal && (
                  <button
                    type="button"
                    className="auth-quick-portal-btn"
                    onClick={onNavigateTeacherPortal}
                  >
                    <Users size={14} className="text-sky-400" />
                    <span>Teacher Portal Demo</span>
                  </button>
                )}
                {onNavigateStudentPortal && (
                  <button
                    type="button"
                    className="auth-quick-portal-btn"
                    onClick={onNavigateStudentPortal}
                  >
                    <GraduationCap size={14} className="text-emerald-400" />
                    <span>Student Portal Demo</span>
                  </button>
                )}
              </div>

              <div className="auth-page-footer-note">
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={onNavigateLogin}
                >
                  Sign in
                </button>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 2: BACKGROUND & EXPERIENCE LEVEL
              ══════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="auth-question-container">
              <div className="auth-card-header">
                <div className="auth-step-indicator-pill">
                  <GraduationCap size={12} />
                  <span>Step 2 of 4 • Quantum Background</span>
                </div>
                <h2 className="auth-card-title">What is your background?</h2>
                <p className="auth-card-subtitle">
                  We'll customize your circuit palette, tutorials, and AI copilot to match your experience.
                </p>
              </div>

              <div className="auth-role-card-grid">
                <div
                  className={`auth-role-card ${
                    experienceLevel === 'beginner' ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setExperienceLevel('beginner');
                    setRole('student');
                  }}
                >
                  <div className="auth-role-icon">
                    <Compass size={20} />
                  </div>
                  <h3 className="auth-role-title">Curious Explorer</h3>
                  <p className="auth-role-desc">
                    New to quantum computing. Excited to learn superposition, Bloch spheres, and basic gates.
                  </p>
                </div>

                <div
                  className={`auth-role-card ${
                    experienceLevel === 'student' ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setExperienceLevel('student');
                    setRole('student');
                  }}
                >
                  <div className="auth-role-icon">
                    <GraduationCap size={20} />
                  </div>
                  <h3 className="auth-role-title">Physics / CS Student</h3>
                  <p className="auth-role-desc">
                    Taking academic courses. Familiar with matrix algebra, Dirac notation, and Bell pairs.
                  </p>
                </div>

                <div
                  className={`auth-role-card ${
                    experienceLevel === 'developer' ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setExperienceLevel('developer');
                    setRole('admin');
                  }}
                >
                  <div className="auth-role-icon">
                    <Cpu size={20} />
                  </div>
                  <h3 className="auth-role-title">Software Engineer</h3>
                  <p className="auth-role-desc">
                    Programmer looking to integrate Qiskit, Cirq, and PennyLane quantum kernels.
                  </p>
                </div>

                <div
                  className={`auth-role-card ${
                    experienceLevel === 'researcher' ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setExperienceLevel('researcher');
                    setRole('admin');
                  }}
                >
                  <div className="auth-role-icon">
                    <Layers size={20} />
                  </div>
                  <h3 className="auth-role-title">Researcher / Educator</h3>
                  <p className="auth-role-desc">
                    Investigating circuit optimization, error mitigation, and quantum algorithms.
                  </p>
                </div>
              </div>

              <div className="auth-step-actions-row">
                <button
                  type="button"
                  className="auth-step-back-btn"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="auth-step-next-btn"
                  onClick={() => setStep(3)}
                >
                  <span>Next: Concept Check</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 3: AWARENESS QUESTION 1 (Superposition & Interference)
              ══════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="auth-question-container">
              <div className="auth-card-header">
                <div className="auth-step-indicator-pill">
                  <HelpCircle size={12} />
                  <span>Step 3 of 4 • Superposition &amp; Interference</span>
                </div>
                <h2 className="auth-card-title">Concept Check: The Hadamard Gate</h2>
                <p className="auth-card-subtitle">
                  If you apply two Hadamard ($H$) gates in series to a qubit initialized in $|0\rangle$, what state is produced?
                </p>
              </div>

              <div className="auth-question-prompt-box">
                <div className="auth-question-tag">CIRCUIT OPERATION</div>
                <div className="auth-question-code-block">
                  q[0]: |0⟩ ──[ H ]──[ H ]── ➔ ?
                </div>
              </div>

              <div className="auth-options-list">
                <div
                  className={`auth-option-card ${q1Answer === 'A' ? 'selected' : ''}`}
                  onClick={() => setQ1Answer('A')}
                >
                  <div className="auth-option-badge">A</div>
                  <div className="auth-option-content">
                    <p className="auth-option-text">Returns deterministically to |0⟩</p>
                    <p className="auth-option-subtext">
                      Quantum amplitudes experience constructive interference on |0⟩ and destructive interference cancels |1⟩ ($H^2 = I$).
                    </p>
                  </div>
                </div>

                <div
                  className={`auth-option-card ${q1Answer === 'B' ? 'selected' : ''}`}
                  onClick={() => setQ1Answer('B')}
                >
                  <div className="auth-option-badge">B</div>
                  <div className="auth-option-content">
                    <p className="auth-option-text">A 50% random coin flip (|0⟩ or |1⟩)</p>
                    <p className="auth-option-subtext">
                      The second Hadamard randomizes the qubit even further.
                    </p>
                  </div>
                </div>

                <div
                  className={`auth-option-card ${q1Answer === 'C' ? 'selected' : ''}`}
                  onClick={() => setQ1Answer('C')}
                >
                  <div className="auth-option-badge">C</div>
                  <div className="auth-option-content">
                    <p className="auth-option-text">Flips permanently to |1⟩</p>
                    <p className="auth-option-subtext">
                      Two gates act as a complete NOT rotation.
                    </p>
                  </div>
                </div>

                <div
                  className={`auth-option-card ${q1Answer === 'D' ? 'selected' : ''}`}
                  onClick={() => setQ1Answer('D')}
                >
                  <div className="auth-option-badge">D</div>
                  <div className="auth-option-content">
                    <p className="auth-option-text">I'm not sure yet</p>
                    <p className="auth-option-subtext">
                      I want the AI Tutor to demonstrate quantum interference in the studio.
                    </p>
                  </div>
                </div>
              </div>

              <div className="auth-step-actions-row">
                <button
                  type="button"
                  className="auth-step-back-btn"
                  onClick={() => setStep(2)}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="auth-step-next-btn"
                  disabled={!q1Answer}
                  onClick={() => setStep(4)}
                >
                  <span>Next: Entanglement Check</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 4: AWARENESS QUESTION 2 (Entanglement & CNOT)
              ══════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="auth-question-container">
              <div className="auth-card-header">
                <div className="auth-step-indicator-pill">
                  <HelpCircle size={12} />
                  <span>Step 4 of 4 • Entanglement &amp; CNOT</span>
                </div>
                <h2 className="auth-card-title">Concept Check: Controlled-NOT (CX)</h2>
                <p className="auth-card-subtitle">
                  A CNOT gate is applied with control in equal superposition $(|0\rangle + |1\rangle)/\sqrt{2}$ and target initialized to $|0\rangle$. What state is produced?
                </p>
              </div>

              <div className="auth-question-prompt-box">
                <div className="auth-question-tag">CIRCUIT OPERATION</div>
                <div className="auth-question-code-block">
                  q[0]: (|0⟩ + |1⟩)/√2 ──●── ➔ ?
                  <br />
                  q[1]:        |0⟩     ──⊕── ➔ ?
                </div>
              </div>

              {errorMessage && (
                <div className="auth-page-error-banner" role="alert">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="auth-options-list">
                <div
                  className={`auth-option-card ${q2Answer === 'A' ? 'selected' : ''}`}
                  onClick={() => setQ2Answer('A')}
                >
                  <div className="auth-option-badge">A</div>
                  <div className="auth-option-content">
                    <p className="auth-option-text">
                      An entangled Bell state: (|00⟩ + |11⟩)/√2
                    </p>
                    <p className="auth-option-subtext">
                      The two qubits cannot be described independently; measuring one immediately determines the other.
                    </p>
                  </div>
                </div>

                <div
                  className={`auth-option-card ${q2Answer === 'B' ? 'selected' : ''}`}
                  onClick={() => setQ2Answer('B')}
                >
                  <div className="auth-option-badge">B</div>
                  <div className="auth-option-content">
                    <p className="auth-option-text">
                      It makes a classical copy of the control qubit
                    </p>
                    <p className="auth-option-subtext">
                      The target qubit now holds an identical independent copy of the superposition.
                    </p>
                  </div>
                </div>

                <div
                  className={`auth-option-card ${q2Answer === 'C' ? 'selected' : ''}`}
                  onClick={() => setQ2Answer('C')}
                >
                  <div className="auth-option-badge">C</div>
                  <div className="auth-option-content">
                    <p className="auth-option-text">
                      The target qubit collapses to |1⟩
                    </p>
                    <p className="auth-option-subtext">
                      The gate acts as an unconditional bit-flip.
                    </p>
                  </div>
                </div>

                <div
                  className={`auth-option-card ${q2Answer === 'D' ? 'selected' : ''}`}
                  onClick={() => setQ2Answer('D')}
                >
                  <div className="auth-option-badge">D</div>
                  <div className="auth-option-content">
                    <p className="auth-option-text">I'm not sure yet</p>
                    <p className="auth-option-subtext">
                      I want to simulate Bell states on the interactive canvas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="auth-step-actions-row">
                <button
                  type="button"
                  className="auth-step-back-btn"
                  onClick={() => setStep(3)}
                  disabled={isLoading}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="auth-step-next-btn"
                  disabled={!q2Answer || isLoading}
                  onClick={handleFinalizeRegistration}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Profile &amp; Complete</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 5: DIAGNOSTIC SUMMARY & LAUNCH STUDIO
              ══════════════════════════════════════════════════════ */}
          {step === 5 && (
            <div className="auth-diagnostic-summary">
              <div className="auth-score-circle">
                <span className="auth-score-number">{getDiagnosticScore()}%</span>
                <span className="auth-score-label">Awareness</span>
              </div>

              <div className="auth-card-header" style={{ marginBottom: '1rem' }}>
                <div className="auth-diagnostic-badge">
                  <Sparkles size={14} />
                  <span>{getProfileTitle()}</span>
                </div>
                <h2 className="auth-card-title" style={{ marginTop: '0.75rem' }}>
                  Welcome to Quantum Studio!
                </h2>
                <p className="auth-card-subtitle">
                  We've configured your simulation environment and tuned your AI Tutor.
                </p>
              </div>

              <div className="auth-diagnostic-details">
                <div className="auth-diagnostic-row">
                  <span className="auth-diagnostic-row-label">User Profile:</span>
                  <span className="auth-diagnostic-row-val">{fullName || email}</span>
                </div>
                <div className="auth-diagnostic-row">
                  <span className="auth-diagnostic-row-label">Initial Track:</span>
                  <span className="auth-diagnostic-row-val">
                    {getDiagnosticScore() === 100
                      ? 'Advanced Algorithms & Bell States'
                      : 'Interactive Circuit Foundations'}
                  </span>
                </div>
                <div className="auth-diagnostic-row">
                  <span className="auth-diagnostic-row-label">Quantum Kernel:</span>
                  <span className="auth-diagnostic-row-val">PennyLane / Qiskit Aer</span>
                </div>
                <div className="auth-diagnostic-row">
                  <span className="auth-diagnostic-row-label">AI Tutor Mode:</span>
                  <span className="auth-diagnostic-row-val">Active (NVIDIA NIM)</span>
                </div>

                <div className="auth-diagnostic-callout">
                  💡 {q2Answer === 'A'
                    ? 'Great understanding of two-qubit entanglement! The studio will start with 2-qubit Bell state experiments.'
                    : 'The AI Tutor will provide step-by-step guidance on how CNOT entangles qubits without copying.'}
                </div>
              </div>

              <button
                type="button"
                className="auth-page-submit-btn"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  if (role === 'teacher' && onNavigateTeacherPortal) {
                    onNavigateTeacherPortal();
                  } else if (onNavigateStudentPortal) {
                    onNavigateStudentPortal();
                  } else {
                    onSuccess();
                  }
                }}
              >
                <span>
                  {role === 'teacher' ? 'Launch Instructor Dashboard' : 'Launch Student Portal'}
                </span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

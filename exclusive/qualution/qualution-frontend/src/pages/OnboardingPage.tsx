import React, { useState, useEffect, useCallback } from 'react';
import {
  Atom,
  ChevronLeft,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Cpu,
  Layers,
  Compass,
  AlertCircle,
  Loader2,
  HelpCircle,
  BarChart3,
  Check,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';
import {
  getOnboardingQuestions,
  submitOnboardingAssessment,
  type OnboardingQuestion,
  type OnboardingAssessResponse,
} from '../api/onboardingApi';
import './OnboardingPage.css';

interface OnboardingPageProps {
  onNavigateHome: () => void;
  onComplete: (assessmentResult?: OnboardingAssessResponse) => void;
}

type OnboardingScreen = 'welcome' | 'questions' | 'goals' | 'style' | 'analyzing' | 'result';

// Fallback questions in case backend endpoint is momentarily connecting
const DEFAULT_FALLBACK_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'q1_superposition',
    dimension: 'knowledge',
    title: 'Quantum Fundamentals',
    prompt: 'What fundamentally distinguishes a quantum bit (qubit) from a classical bit prior to measurement?',
    options: [
      {
        id: 'A',
        text: 'A qubit exists in a linear combination α|0⟩ + β|1⟩ with complex probability amplitudes.',
        subtext: 'Amplitudes satisfy |α|² + |β|² = 1 and can undergo interference.',
      },
      {
        id: 'B',
        text: 'A qubit is a classical bit that rapidly fluctuates between 0 and 1 like a coin toss.',
        subtext: 'It has an unknown classical value that is revealed upon observation.',
      },
      {
        id: 'C',
        text: 'A qubit simultaneously stores both 0 and 1 permanently, even after measurement.',
        subtext: 'Measurement reads out both states in parallel.',
      },
      {
        id: 'D',
        text: 'A qubit is an analog voltage signal with continuous infinite capacity.',
        subtext: 'It operates on continuous classical wave equations.',
      },
    ],
  },
  {
    id: 'q2_interference',
    dimension: 'circuits',
    title: 'Interference & Hadamard Transformation',
    prompt: 'A qubit initialized to |0⟩ passes through a Hadamard (H) gate, and then through a second H gate (H · H |0⟩). What is the final measured state?',
    code_snippet: 'q[0]: |0⟩ ──[ H ]──[ H ]── ➔ ?',
    options: [
      {
        id: 'A',
        text: '|0⟩ with 100% certainty (deterministic return to initial basis state).',
        subtext: 'Because H² = I, probability amplitudes interfere destructively for |1⟩ and constructively for |0⟩.',
      },
      {
        id: 'B',
        text: 'A 50/50 random outcome between |0⟩ and |1⟩.',
        subtext: 'The second H gate randomizes the superposition state even further.',
      },
      {
        id: 'C',
        text: '|1⟩ with 100% certainty.',
        subtext: 'Two consecutive Hadamard gates invert the state like a double-NOT rotation.',
      },
      {
        id: 'D',
        text: 'The state is destroyed or indeterminate.',
        subtext: 'Applying gates in series leads to phase decoherence.',
      },
    ],
  },
  {
    id: 'q3_cnot_entanglement',
    dimension: 'circuits',
    title: 'Two-Qubit Entanglement & CNOT',
    prompt: 'A CNOT gate is applied with control qubit q[0] in equal superposition (|0⟩ + |1⟩)/√2 and target qubit q[1] initialized to |0⟩. What state is produced?',
    code_snippet: 'q[0]: (|0⟩ + |1⟩)/√2 ──●── ➔ ?\nq[1]:        |0⟩     ──⊕── ➔ ?',
    options: [
      {
        id: 'A',
        text: 'The maximally entangled Bell state (|00⟩ + |11⟩)/√2.',
        subtext: 'The two qubits can no longer be factored into independent single-qubit states.',
      },
      {
        id: 'B',
        text: 'Two independent 50% random qubits (|0⟩ + |1⟩)/√2 ⊗ (|0⟩ + |1⟩)/√2.',
        subtext: 'CNOT copies the superposition of the control directly onto the target.',
      },
      {
        id: 'C',
        text: 'State |01⟩ with 100% certainty.',
        subtext: 'Target flips unconditionally because control was in superposition.',
      },
      {
        id: 'D',
        text: 'State |10⟩ with 100% certainty.',
        subtext: 'Control collapses to |1⟩ and target remains |0⟩.',
      },
    ],
  },
  {
    id: 'q4_measurement_collapse',
    dimension: 'knowledge',
    title: 'Measurement & Wavefunction Collapse',
    prompt: 'When an observable in the computational basis is measured on a qubit in state (|0⟩ + |1⟩)/√2, what occurs immediately following the measurement?',
    options: [
      {
        id: 'A',
        text: 'The state irreversibly projects onto either |0⟩ or |1⟩.',
        subtext: 'Any subsequent measurement in the same basis will return the exact same outcome with certainty.',
      },
      {
        id: 'B',
        text: 'The qubit remains in superposition (|0⟩ + |1⟩)/√2.',
        subtext: 'Repeated measurements on the same physical qubit continue producing random 50/50 samples.',
      },
      {
        id: 'C',
        text: 'The measurement is non-destructive and outputs continuous amplitudes α and β in one run.',
        subtext: 'Wavefunction collapse only happens in multi-qubit systems.',
      },
      {
        id: 'D',
        text: 'The qubit is automatically cleared and erased to hardware null state.',
        subtext: 'Physical measurement consumes all energy in the quantum register.',
      },
    ],
  },
  {
    id: 'q5_programming',
    dimension: 'programming',
    title: 'Quantum Programming & Framework Experience',
    prompt: 'What best characterizes your experience with quantum computing SDKs and scientific Python?',
    options: [
      {
        id: 'A',
        text: 'Experienced with Qiskit, Cirq, or PennyLane.',
        subtext: 'Comfortable building circuits, executing statevector simulators, and writing quantum scripts.',
      },
      {
        id: 'B',
        text: 'Proficient in Python and linear algebra, but new to quantum SDKs.',
        subtext: 'Understand matrix multiplication, complex vectors, and eager to write quantum algorithms.',
      },
      {
        id: 'C',
        text: 'Basic programming background, prefer visual drag-and-drop circuit tools.',
        subtext: 'Interested in seeing the synchronized code while manipulating gates visually.',
      },
      {
        id: 'D',
        text: 'Completely new to programming.',
        subtext: 'Focused on intuitive conceptual understanding, Bloch spheres, and visual simulations.',
      },
    ],
  },
];

const LEARNING_GOAL_OPTIONS = [
  { id: 'foundations', label: 'Learn Core Foundations', desc: 'Qubits, superposition, Bloch sphere geometry' },
  { id: 'circuits', label: 'Build & Simulate Circuits', desc: 'Multi-register gates, statevectors, probabilities' },
  { id: 'algorithms', label: 'Quantum Algorithms', desc: 'Bell states, Teleportation, Deutsch-Jozsa, Grover' },
  { id: 'programming', label: 'Write Qiskit / Python Code', desc: 'Native Qiskit 1.0, Cirq, and PennyLane kernels' },
  { id: 'optimization', label: 'Circuit Optimization & Debugging', desc: 'Equivalent gate cancellation and pass scheduling' },
  { id: 'research', label: 'Academic Coursework & Research', desc: 'Advanced simulations and quantum state tomography' },
];

const LEARNING_STYLE_OPTIONS = [
  {
    id: 'visual',
    title: 'Visual & Interactive First',
    desc: 'Learn through drag-and-drop circuit manipulation, Bloch sphere geometry, and dynamic probability bars.',
    icon: Compass,
  },
  {
    id: 'code',
    title: 'Code-Driven (Qiskit & Python)',
    desc: 'Jump straight into synchronized Python code, multi-framework kernels, and programmatic circuit synthesis.',
    icon: Cpu,
  },
  {
    id: 'theory',
    title: 'Theory & Mathematical Foundations',
    desc: 'Focus on Dirac notation, unitary transformation matrices, and quantum statevectors.',
    icon: BookOpen,
  },
  {
    id: 'balanced',
    title: 'Unified Workspace (Recommended)',
    desc: 'Seamlessly transition between visual canvas, code editor, AI copilot, and state visualizations.',
    icon: Layers,
  },
];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  onNavigateHome,
  onComplete,
}) => {
  const { token, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Screen State
  const [screen, setScreen] = useState<OnboardingScreen>('welcome');
  const [questions, setQuestions] = useState<OnboardingQuestion[]>(DEFAULT_FALLBACK_QUESTIONS);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['foundations', 'circuits']);
  const [selectedStyle, setSelectedStyle] = useState<string>('balanced');
  const [assessmentResult, setAssessmentResult] = useState<OnboardingAssessResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load questions from backend
  useEffect(() => {
    getOnboardingQuestions(token || undefined)
      .then((data) => {
        if (data && data.length > 0) {
          setQuestions(data);
        }
      })
      .catch(() => {
        // Fallback already in state
      });
  }, [token]);

  // Answer selection handler
  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // Keyboard navigation for question options
  useEffect(() => {
    if (screen !== 'questions') return;

    const currentQ = questions[currentQuestionIdx];
    if (!currentQ) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (currentQ.options[idx]) {
          handleSelectAnswer(currentQ.id, currentQ.options[idx].id);
        }
      } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const optionId = e.key.toUpperCase();
        if (currentQ.options.some((o) => o.id === optionId)) {
          handleSelectAnswer(currentQ.id, optionId);
        }
      } else if (e.key === 'Enter' && answers[currentQ.id]) {
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, currentQuestionIdx, questions, answers]);

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      setScreen('goals');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    } else {
      setScreen('welcome');
    }
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  // Final submission to backend
  const handleSubmitAssessment = useCallback(async () => {
    setScreen('analyzing');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const authToken = token || 'guest-mode-token';
      const result = await submitOnboardingAssessment(
        {
          answers,
          learning_goals: selectedGoals,
          preferred_style: selectedStyle,
        },
        authToken
      );

      setAssessmentResult(result);
      setScreen('result');
    } catch (err: unknown) {
      // Fallback local classification if offline or testing
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setErrorMessage(msg);

      // Deterministic client fallback to prevent blocking
      const q1 = answers['q1_superposition'] === 'A';
      const q2 = answers['q2_interference'] === 'A';
      const q3 = answers['q3_cnot_entanglement'] === 'A';
      const q4 = answers['q4_measurement_collapse'] === 'A';
      const prog = answers['q5_programming'] || 'C';

      const correctCount = [q1, q2, q3, q4].filter(Boolean).length;
      let fallbackLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
      if (correctCount >= 3 && prog === 'A') fallbackLevel = 'advanced';
      else if (correctCount >= 2) fallbackLevel = 'intermediate';

      const fallbackResult: OnboardingAssessResponse = {
        level: fallbackLevel,
        score: Math.round((correctCount / 4) * 80 + (prog === 'A' ? 20 : prog === 'B' ? 15 : 10)),
        dimension_scores: {
          knowledge: q1 && q4 ? 100 : q1 || q4 ? 50 : 0,
          circuits: q2 && q3 ? 100 : q2 || q3 ? 50 : 0,
          programming: prog === 'A' ? 100 : prog === 'B' ? 75 : 50,
          algorithms: fallbackLevel === 'advanced' ? 85 : fallbackLevel === 'intermediate' ? 65 : 40,
        },
        detected_misconceptions:
          answers['q3_cnot_entanglement'] === 'B'
            ? [
                {
                  rule_id: 'RULE_CNOT_COPY',
                  name: 'CNOT as Classical Copying',
                  remediation: 'CNOT entangles control and target into a Bell state rather than copying.',
                },
              ]
            : [],
        recommended_path:
          fallbackLevel === 'advanced'
            ? [
                'Multi-Qubit Entanglement & GHZ State Synthesis',
                'Quantum Phase Estimation Walkthrough',
                'Deterministic Circuit Optimization & Pass Scheduling',
              ]
            : fallbackLevel === 'intermediate'
            ? [
                'Visualizing Entanglement: Bell State Laboratory',
                'Controlled-NOT Mechanics & Phase Kickback',
                'Superposition Interference: Why H · H = I',
              ]
            : [
                'The Qubit: Beyond Classical 0 and 1',
                'Bloch Sphere Explorations: X, Y, and Z Rotations',
                'Superposition: Creating Equal Amplitudes with Hadamard',
              ],
        curriculum_summary:
          fallbackLevel === 'advanced'
            ? 'Command of quantum circuits validated. Workspace initialized with multi-framework simulators.'
            : fallbackLevel === 'intermediate'
            ? 'Good foundational comprehension with readiness for multi-qubit Bell states.'
            : 'Welcome to quantum computing! Tailored an intuitive visual track starting with Bloch spheres.',
        ai_tutor_mode: fallbackLevel,
        learner_profile_id: 'local-profile',
      };

      setAssessmentResult(fallbackResult);
      setScreen('result');
    } finally {
      setIsLoading(false);
    }
  }, [answers, selectedGoals, selectedStyle, token]);

  const handleLaunchStudio = () => {
    if (assessmentResult) {
      try {
        localStorage.setItem(
          'qualution_active_learner_profile',
          JSON.stringify({
            level: assessmentResult.level,
            score: assessmentResult.score,
            recommended_path: assessmentResult.recommended_path,
            completed_at: new Date().toISOString(),
          })
        );
      } catch {
        // Storage fallback
      }
    }
    onComplete(assessmentResult || undefined);
  };

  const currentQ = questions[currentQuestionIdx];

  return (
    <div className="onboarding-root" data-theme={theme}>
      <div className="onboarding-grid-bg" />

      {/* Top Navigation */}
      <header className="onboarding-nav">
        <button
          type="button"
          className="onboarding-brand"
          onClick={onNavigateHome}
          aria-label="Qualution Home"
        >
          <div className="onboarding-brand-icon">
            <Atom size={20} />
          </div>
          <div className="onboarding-brand-titles">
            <span className="onboarding-brand-title">QUALUTION</span>
            <span className="onboarding-brand-subtitle">Quantum Studio</span>
          </div>
        </button>

        <div className="onboarding-nav-right">
          {screen === 'questions' && (
            <div className="onboarding-progress-pill">
              <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
            </div>
          )}

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

      {/* Main Container */}
      <main className="onboarding-main">
        {/* ══════════════════════════════════════════════════════
            SCREEN 1: WELCOME SCREEN
            ══════════════════════════════════════════════════════ */}
        {screen === 'welcome' && (
          <div className="onboarding-card welcome-card">
            <div className="onboarding-wire-animation" aria-hidden="true">
              <div className="wire-line wire-line-1" />
              <div className="wire-line wire-line-2" />
              <div className="wire-node wire-node-1" />
              <div className="wire-node wire-node-2" />
              <div className="wire-gate">H</div>
            </div>

            <div className="onboarding-badge">
              <Sparkles size={14} />
              <span>Personalized Learner Architecture</span>
            </div>

            <h1 className="onboarding-title">
              Let&apos;s build your quantum journey.
            </h1>

            <p className="onboarding-subtitle">
              Welcome{user?.full_name ? `, ${user.full_name}` : ''}! Tell us a little about what you
              already know. We&apos;ll tune the simulation workspace, circuit challenges, and NVIDIA AI Tutor
              to your current level.
            </p>

            <div className="onboarding-welcome-features">
              <div className="welcome-feature-item">
                <div className="welcome-feature-icon">
                  <BarChart3 size={18} />
                </div>
                <div className="welcome-feature-text">
                  <h4>Diagnostic Awareness Check</h4>
                  <p>5 quick questions to classify your understanding into Beginner, Intermediate, or Advanced.</p>
                </div>
              </div>

              <div className="welcome-feature-item">
                <div className="welcome-feature-icon">
                  <Compass size={18} />
                </div>
                <div className="welcome-feature-text">
                  <h4>Tailored Learning Syllabus</h4>
                  <p>Custom roadmap targeting your specific goals and addressing core quantum misconceptions.</p>
                </div>
              </div>
            </div>

            <div className="onboarding-actions-row">
              <button
                type="button"
                className="onboarding-primary-btn"
                onClick={() => setScreen('questions')}
              >
                <span>Let&apos;s get started</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="onboarding-ghost-btn"
                onClick={handleLaunchStudio}
              >
                <span>Skip for now (Default Track)</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SCREEN 2: QUANTUM AWARENESS ASSESSMENT
            ══════════════════════════════════════════════════════ */}
        {screen === 'questions' && currentQ && (
          <div className="onboarding-card question-card">
            {/* Step Progress Line */}
            <div className="onboarding-progress-track">
              <div
                className="onboarding-progress-bar"
                style={{
                  width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            <div className="onboarding-card-header">
              <div className="onboarding-question-meta">
                <span className="question-dimension-tag">{currentQ.dimension.toUpperCase()}</span>
                <span className="question-counter">
                  Question {currentQuestionIdx + 1} of {questions.length}
                </span>
              </div>

              <h2 className="onboarding-question-title">{currentQ.title}</h2>
              <p className="onboarding-question-prompt">{currentQ.prompt}</p>
            </div>

            {/* Optional Quantum Circuit Code Block */}
            {currentQ.code_snippet && (
              <div className="onboarding-circuit-snippet">
                <div className="snippet-badge">CIRCUIT CONTEXT</div>
                <pre><code>{currentQ.code_snippet}</code></pre>
              </div>
            )}

            {/* Answer Options Grid */}
            <div className="onboarding-options-list" role="radiogroup" aria-label={currentQ.title}>
              {currentQ.options.map((option) => {
                const isSelected = answers[currentQ.id] === option.id;
                return (
                  <div
                    key={option.id}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    className={`onboarding-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectAnswer(currentQ.id, option.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleSelectAnswer(currentQ.id, option.id);
                      }
                    }}
                  >
                    <div className="option-badge">
                      {isSelected ? <Check size={14} /> : option.id}
                    </div>
                    <div className="option-content">
                      <p className="option-main-text">{option.text}</p>
                      {option.subtext && <p className="option-subtext">{option.subtext}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="onboarding-step-actions">
              <button
                type="button"
                className="onboarding-secondary-btn"
                onClick={handlePrevQuestion}
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                className="onboarding-primary-btn"
                disabled={!answers[currentQ.id]}
                onClick={handleNextQuestion}
              >
                <span>{currentQuestionIdx === questions.length - 1 ? 'Continue to Goals' : 'Next Question'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SCREEN 3: PERSONAL LEARNING GOALS
            ══════════════════════════════════════════════════════ */}
        {screen === 'goals' && (
          <div className="onboarding-card wide-card">
            <div className="onboarding-card-header">
              <div className="onboarding-badge">
                <Compass size={14} />
                <span>Personalization • Learning Intent</span>
              </div>
              <h2 className="onboarding-title">What do you want to accomplish?</h2>
              <p className="onboarding-subtitle">
                Select one or more learning priorities so we can prioritize your tutorials and circuit challenges.
              </p>
            </div>

            <div className="onboarding-goals-grid">
              {LEARNING_GOAL_OPTIONS.map((g) => {
                const isChecked = selectedGoals.includes(g.id);
                return (
                  <div
                    key={g.id}
                    className={`onboarding-goal-card ${isChecked ? 'selected' : ''}`}
                    onClick={() => toggleGoal(g.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleGoal(g.id);
                      }
                    }}
                  >
                    <div className="goal-checkbox">
                      {isChecked && <Check size={13} />}
                    </div>
                    <div className="goal-text">
                      <h4>{g.label}</h4>
                      <p>{g.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="onboarding-step-actions">
              <button
                type="button"
                className="onboarding-secondary-btn"
                onClick={() => setScreen('questions')}
              >
                <ChevronLeft size={16} />
                <span>Back to Questions</span>
              </button>

              <button
                type="button"
                className="onboarding-primary-btn"
                disabled={selectedGoals.length === 0}
                onClick={() => setScreen('style')}
              >
                <span>Continue to Learning Style</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SCREEN 4: LEARNING STYLE & WORKFLOW
            ══════════════════════════════════════════════════════ */}
        {screen === 'style' && (
          <div className="onboarding-card wide-card">
            <div className="onboarding-card-header">
              <div className="onboarding-badge">
                <Layers size={14} />
                <span>Workspace Configuration</span>
              </div>
              <h2 className="onboarding-title">How do you prefer to learn?</h2>
              <p className="onboarding-subtitle">
                Quantum Studio adapts its panels, code synchronize rate, and explanations to your learning habits.
              </p>
            </div>

            <div className="onboarding-styles-grid">
              {LEARNING_STYLE_OPTIONS.map((st) => {
                const isSelected = selectedStyle === st.id;
                const IconComponent = st.icon;
                return (
                  <div
                    key={st.id}
                    className={`onboarding-style-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedStyle(st.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setSelectedStyle(st.id);
                      }
                    }}
                  >
                    <div className="style-icon-wrapper">
                      <IconComponent size={22} />
                    </div>
                    <h3 className="style-title">{st.title}</h3>
                    <p className="style-desc">{st.desc}</p>
                  </div>
                );
              })}
            </div>

            {errorMessage && (
              <div className="onboarding-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="onboarding-step-actions">
              <button
                type="button"
                className="onboarding-secondary-btn"
                onClick={() => setScreen('goals')}
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                className="onboarding-primary-btn"
                onClick={handleSubmitAssessment}
                disabled={isLoading}
              >
                <span>Analyze &amp; Build Learning Path</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SCREEN 5: REAL-TIME ANALYSIS STATE
            ══════════════════════════════════════════════════════ */}
        {screen === 'analyzing' && (
          <div className="onboarding-card analyzing-card">
            <div className="analyzing-spinner-wrapper">
              <Loader2 size={44} className="analyzing-spinner" />
              <div className="analyzing-atom-pulse">
                <Atom size={24} />
              </div>
            </div>

            <h2 className="onboarding-title" style={{ marginTop: '1.5rem' }}>
              Synthesizing Your Quantum Profile
            </h2>
            <p className="onboarding-subtitle">
              Evaluating your quantum state intuition and matching your responses against backend simulation rules...
            </p>

            <div className="analyzing-step-checklist">
              <div className="analyzing-step-item active">
                <CheckCircle2 size={16} className="text-accent" />
                <span>Scoring knowledge &amp; circuit awareness dimensions</span>
              </div>
              <div className="analyzing-step-item active">
                <CheckCircle2 size={16} className="text-accent" />
                <span>Running misconception rule diagnostics</span>
              </div>
              <div className="analyzing-step-item active">
                <CheckCircle2 size={16} className="text-accent" />
                <span>Generating custom learning sequence with NVIDIA AI Tutor</span>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SCREEN 6: PERSONALIZED PROFILE & LEARNING PATH
            ══════════════════════════════════════════════════════ */}
        {screen === 'result' && assessmentResult && (
          <div className="onboarding-card result-card">
            {/* Top Score Banner */}
            <div className="result-header">
              <div className="result-level-pill">
                <Sparkles size={14} />
                <span>Assessed Level: {assessmentResult.level.toUpperCase()}</span>
              </div>
              <h1 className="onboarding-title">Your Quantum Studio Profile</h1>
              <p className="onboarding-subtitle">{assessmentResult.curriculum_summary}</p>
            </div>

            {/* Dimension Metrics Grid */}
            <div className="result-dimensions-grid">
              <div className="dimension-box">
                <div className="dimension-label">Quantum Knowledge</div>
                <div className="dimension-bar-track">
                  <div
                    className="dimension-bar-fill"
                    style={{ width: `${assessmentResult.dimension_scores.knowledge}%` }}
                  />
                </div>
                <div className="dimension-val">{Math.round(assessmentResult.dimension_scores.knowledge)}%</div>
              </div>

              <div className="dimension-box">
                <div className="dimension-label">Circuit Skills</div>
                <div className="dimension-bar-track">
                  <div
                    className="dimension-bar-fill"
                    style={{ width: `${assessmentResult.dimension_scores.circuits}%` }}
                  />
                </div>
                <div className="dimension-val">{Math.round(assessmentResult.dimension_scores.circuits)}%</div>
              </div>

              <div className="dimension-box">
                <div className="dimension-label">Programming &amp; SDKs</div>
                <div className="dimension-bar-track">
                  <div
                    className="dimension-bar-fill"
                    style={{ width: `${assessmentResult.dimension_scores.programming}%` }}
                  />
                </div>
                <div className="dimension-val">{Math.round(assessmentResult.dimension_scores.programming)}%</div>
              </div>

              <div className="dimension-box">
                <div className="dimension-label">Algorithms Intuition</div>
                <div className="dimension-bar-track">
                  <div
                    className="dimension-bar-fill"
                    style={{ width: `${assessmentResult.dimension_scores.algorithms}%` }}
                  />
                </div>
                <div className="dimension-val">{Math.round(assessmentResult.dimension_scores.algorithms)}%</div>
              </div>
            </div>

            {/* Misconception Diagnostic Callout if any */}
            {assessmentResult.detected_misconceptions.length > 0 && (
              <div className="result-misconception-callout">
                <div className="callout-icon">
                  <HelpCircle size={18} />
                </div>
                <div className="callout-body">
                  <h4>Targeted Insight: {assessmentResult.detected_misconceptions[0].name}</h4>
                  <p>{assessmentResult.detected_misconceptions[0].remediation}</p>
                </div>
              </div>
            )}

            {/* Tailored Learning Path Roadmap */}
            <div className="result-path-section">
              <h3 className="result-path-heading">
                <span>Personalized Learning Roadmap</span>
              </h3>

              <div className="result-path-list">
                {assessmentResult.recommended_path.map((item, idx) => (
                  <div key={idx} className="result-path-item">
                    <div className="path-step-badge">{idx + 1}</div>
                    <div className="path-step-content">
                      <h4>{item}</h4>
                      <p>
                        {idx === 0
                          ? 'Immediate starting module configured in your workspace.'
                          : 'Unlocks as you complete circuit verifications.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Primary CTA */}
            <div className="result-actions">
              <button
                type="button"
                className="onboarding-primary-btn launch-btn"
                onClick={handleLaunchStudio}
              >
                <span>Start Learning in Quantum Studio</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

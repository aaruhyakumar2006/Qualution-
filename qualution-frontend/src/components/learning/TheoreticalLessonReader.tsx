import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trophy,
  Clock,
  Zap,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  ExternalLink,
  RotateCcw,
  Award,
  List,
  Layers,
  Copy,
  Check,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { useTheme } from '../../features/theme/ThemeContext';

import type {
  TheoryQuizQuestion,
} from '../../features/learning/theoreticalCurriculum';
import { THEORETICAL_SPRINT_1_LESSONS } from '../../features/learning/theoreticalCurriculum';
import {
  getCompletedLessonIds,
  markLessonCompleted,
} from '../../features/learning/assessmentEngine';
import { VideoLesson } from './VideoLesson';
import { TheoryBoard } from '../theory/TheoryBoard';
import { getBoardLessonForConcept } from '../../features/theory/boardLessonRegistry';
import './TheoreticalLessonReader.css';

interface TheoreticalLessonReaderProps {
  lessonId: string;
  onSelectLesson: (lessonId: string) => void;
  onClose: () => void;
  onLaunchPracticalLesson?: (practicalLessonId: string) => void;
}

// Quantum terminology dictionary for tooltips/popovers
const QUANTUM_GLOSSARY: Record<string, { title: string; definition: string; formula?: string }> = {
  qubit: {
    title: 'Qubit (Quantum Bit)',
    definition: 'The fundamental unit of quantum information. Unlike a classical bit (0 or 1), a qubit exists in a continuous 2D Hilbert space spanned by |0⟩ and |1⟩.',
    formula: '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle',
  },
  superposition: {
    title: 'Quantum Superposition',
    definition: 'A quantum state where a system simultaneously possesses linear combinations of computational basis states prior to physical measurement.',
    formula: '|+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}',
  },
  entanglement: {
    title: 'Quantum Entanglement',
    definition: 'A physical phenomenon where multiple qubits share non-local correlations that cannot be factored into individual separate single-qubit product states.',
    formula: '|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}',
  },
  'state vector': {
    title: 'Quantum State Vector',
    definition: 'A normalized complex vector in Hilbert space containing the complete mathematical description of a quantum system.',
  },
  amplitude: {
    title: 'Probability Amplitude',
    definition: 'A complex scalar coefficient whose squared magnitude (|α|²) determines the physical measurement probability of observing a specific basis state.',
    formula: 'P(x) = |\\alpha_x|^2, \\quad \\sum |\\alpha_x|^2 = 1',
  },
  'born rule': {
    title: 'Born Rule',
    definition: 'The fundamental law of quantum mechanics stating that the measurement probability of observing state |x⟩ equals the squared magnitude of its amplitude.',
  },
  'bloch sphere': {
    title: 'Bloch Sphere',
    definition: 'A 3D geometric representation of pure single-qubit quantum states as points on the surface of a unit sphere in ℝ³.',
  },
  'pauli-x': {
    title: 'Pauli-X Gate (Quantum NOT)',
    definition: 'A single-qubit operation that flips computational basis states: X|0⟩ = |1⟩ and X|1⟩ = |0⟩.',
    formula: 'X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}',
  },
  hadamard: {
    title: 'Hadamard Gate (H)',
    definition: 'The fundamental single-qubit gate that maps computational basis states into equal superpositions and vice-versa.',
    formula: 'H = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}',
  },
};

const DEFAULT_PRACTICAL_MAPPINGS: Record<string, { lessonId: string; label: string; description: string }> = {
  's1-theory-what-is-quantum': {
    lessonId: 's1-initialize-measure',
    label: 'Qubit State & Measurement Lab',
    description: 'Experiment with qubit states, basis vectors, and Z-measurement in the Quantum IDE with AI Tutor.',
  },
  's1-theory-qubits-states': {
    lessonId: 's1-x-gate',
    label: 'State Vector & Pauli-X Lab',
    description: 'Rotate state vectors from |0⟩ to |1⟩ and track complex probability amplitudes in the IDE.',
  },
  's1-theory-computational-basis': {
    lessonId: 's1-initialize-measure',
    label: 'Computational Basis Lab',
    description: 'Explore ground state initialization |0⟩ and basis state transitions with AI Tutor.',
  },
  's1-theory-superposition': {
    lessonId: 's1-hadamard-superposition',
    label: 'Hadamard Superposition Lab',
    description: 'Build equal superposition states and observe live 3D Bloch sphere vector rotations in the IDE.',
  },
  's1-theory-measurement-probability': {
    lessonId: 's1-single-qubit-challenge',
    label: 'Wavefunction Collapse & Born Rule',
    description: 'Run 1,000 shots and verify probabilistic collapse under measurement with AI Tutor.',
  },
  's1-theory-phase-shift': {
    lessonId: 's1-z-phase',
    label: 'Phase Shift & Relative Angles',
    description: 'Apply S and Z gates to manipulate complex relative phases on the Q-Sphere in the IDE.',
  },
  's1-theory-interference': {
    lessonId: 's1-gate-ordering',
    label: 'Quantum Interference & Gate Ordering',
    description: 'Execute constructive and destructive interference sequences in the IDE with AI Tutor.',
  },
  's1-theory-multi-qubit': {
    lessonId: 's2-bell-state-entanglement',
    label: 'Multi-Qubit Hilbert Space & CNOT',
    description: 'Expand to 2-qubit registers and execute controlled-NOT operations in the IDE.',
  },
  's1-theory-entanglement': {
    lessonId: 's2-bell-state-entanglement',
    label: 'Bell State & Entanglement Lab',
    description: 'Generate maximal entanglement |Φ⁺⟩ and observe non-local correlation with AI Tutor.',
  },
  's1-theory-grover': {
    lessonId: 'lesson-8-grovers-search',
    label: 'Grover Search & Amplitude Amplification',
    description: 'Construct phase oracles and amplitude diffuser circuits step-by-step in the IDE.',
  },
  'lesson-8-grovers-search': {
    lessonId: 'lesson-8-grovers-search',
    label: 'Grover Search & Amplitude Amplification',
    description: 'Construct phase oracles and amplitude diffuser circuits step-by-step in the IDE.',
  },
  's1-theory-assessment': {
    lessonId: 's1-assessment',
    label: 'Sprint 1 Practical IDE Assessment',
    description: 'Complete the hands-on synthesis challenge and earn Sprint 1 Mastery with AI Tutor.',
  },
};

export const TheoreticalLessonReader: React.FC<TheoreticalLessonReaderProps> = ({
  lessonId,
  onSelectLesson,
  onClose,
  onLaunchPracticalLesson,
}) => {
  const lesson = useMemo(() => {
    return (
      THEORETICAL_SPRINT_1_LESSONS.find((l) => l.id === lessonId) ||
      THEORETICAL_SPRINT_1_LESSONS[0]
    );
  }, [lessonId]);

  const currentIndex = THEORETICAL_SPRINT_1_LESSONS.findIndex(
    (l) => l.id === lesson.id
  );
  const prevLesson = currentIndex > 0 ? THEORETICAL_SPRINT_1_LESSONS[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < THEORETICAL_SPRINT_1_LESSONS.length - 1
      ? THEORETICAL_SPRINT_1_LESSONS[currentIndex + 1]
      : null;

  const targetPractical = useMemo(() => {
    if (lesson.practicalConnection) {
      return lesson.practicalConnection;
    }
    return (
      DEFAULT_PRACTICAL_MAPPINGS[lesson.id] ||
      DEFAULT_PRACTICAL_MAPPINGS['s1-theory-what-is-quantum']
    );
  }, [lesson]);

  const [completedLessons, setCompletedLessons] = useState<string[]>(() =>
    getCompletedLessonIds()
  );

  const { theme, toggleTheme } = useTheme();

  // Scroll & Reading Progress Tracking
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<string | null>(null);
  const [showLessonSelector, setShowLessonSelector] = useState<boolean>(false);

  // Lesson 1-9 Quiz state
  const [selectedSingleAnswer, setSelectedSingleAnswer] = useState<number | null>(null);
  const [isSingleQuizSubmitted, setIsSingleQuizSubmitted] = useState<boolean>(false);

  // Knowledge Check & Assessment multi-question state
  const [multiAnswers, setMultiAnswers] = useState<Record<string, number | null>>({});
  const [isMultiSubmitted, setIsMultiSubmitted] = useState<boolean>(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);

  const mainContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reset state on lesson change
    setSelectedSingleAnswer(null);
    setIsSingleQuizSubmitted(false);
    setMultiAnswers({});
    setIsMultiSubmitted(false);
    setAssessmentScore(null);
    setActiveGlossaryTerm(null);
    setShowLessonSelector(false);
    setCompletedLessons(getCompletedLessonIds());

    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTop = 0;
    }
  }, [lesson.id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const totalScrollable = scrollHeight - clientHeight;
    if (totalScrollable > 0) {
      const pct = Math.min(100, Math.round((scrollTop / totalScrollable) * 100));
      setReadingProgress(pct);
    }

    // Determine active section based on scroll position
    for (const sec of lesson.sections) {
      const el = document.getElementById(sec.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom >= 100) {
          setActiveSectionId(sec.id);
          break;
        }
      }
    }
  };

  const isCompleted = completedLessons.includes(lesson.id);

  // Handlers for Lesson 1-9 single quiz
  const handleSelectSingleOption = (optIndex: number) => {
    if (isSingleQuizSubmitted) return;
    setSelectedSingleAnswer(optIndex);
    setIsSingleQuizSubmitted(true);

    if (lesson.quiz && optIndex === lesson.quiz.correctIndex) {
      const updated = markLessonCompleted(lesson.id, lesson.xpReward);
      setCompletedLessons(updated);
    }
  };

  const handleManualComplete = () => {
    const updated = markLessonCompleted(lesson.id, lesson.xpReward);
    setCompletedLessons(updated);
  };

  // Handlers for Lesson 10 & 11 multi-question quizzes
  const activeMultiQuestions: TheoryQuizQuestion[] = useMemo(() => {
    if (lesson.isKnowledgeCheck && lesson.knowledgeCheckQuestions) {
      return lesson.knowledgeCheckQuestions;
    }
    if (lesson.isAssessment && lesson.assessmentQuestions) {
      return lesson.assessmentQuestions;
    }
    return [];
  }, [lesson]);

  const handleSelectMultiOption = (questionId: string, optIndex: number) => {
    if (isMultiSubmitted) return;
    setMultiAnswers((prev) => ({
      ...prev,
      [questionId]: optIndex,
    }));
  };

  const handleSubmitMultiQuiz = () => {
    if (activeMultiQuestions.length === 0) return;
    let correctCount = 0;
    activeMultiQuestions.forEach((q) => {
      if (multiAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / activeMultiQuestions.length) * 100);
    setAssessmentScore(percent);
    setIsMultiSubmitted(true);

    const isPassing = lesson.isAssessment ? percent >= 70 : correctCount >= Math.ceil(activeMultiQuestions.length / 2);
    if (isPassing) {
      const updated = markLessonCompleted(lesson.id, lesson.xpReward);
      if (lesson.isAssessment) {
        markLessonCompleted('lesson-1-theory-assessment', 0);
      }
      setCompletedLessons(updated);
    }
  };

  const handleResetMultiQuiz = () => {
    setMultiAnswers({});
    setIsMultiSubmitted(false);
    setAssessmentScore(null);
  };

  const allMultiQuestionsAnswered =
    activeMultiQuestions.length > 0 &&
    activeMultiQuestions.every((q) => multiAnswers[q.id] !== undefined && multiAnswers[q.id] !== null);

  const copyFormulaText = (secId: string, formulaStr: string) => {
    navigator.clipboard.writeText(formulaStr);
    setCopiedFormulaId(secId);
    setTimeout(() => setCopiedFormulaId(null), 2000);
  };

  const scrollToSection = (secId: string) => {
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="theory-reader-overlay full-page-reader"
      data-testid="theory-lesson-reader"
      onScroll={handleScroll}
      ref={mainContainerRef}
    >
      {/* ── TOP STICKY COMMAND & PROGRESS HEADER ── */}
      <header className="theory-sticky-topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-back-btn"
              onClick={onClose}
              data-testid="theory-reader-close-btn"
              title="Return to Academy Overview"
            >
              <ArrowLeft size={16} />
              <span>Back to Academy</span>
            </button>

            <div className="topbar-divider" />

            <div className="topbar-breadcrumb">
              <span className="breadcrumb-sprint">{lesson.sprintTitle}</span>
              <ChevronRight size={12} className="text-muted" />
              <span className="breadcrumb-lesson">Lesson {lesson.lessonNumber}</span>
            </div>
          </div>

          <div className="topbar-center">
            {/* Reading Scroll Progress Bar */}
            <div className="reading-progress-container" title={`Reading Progress: ${readingProgress}%`}>
              <div className="progress-label">READING PROGRESS ({readingProgress}%)</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${readingProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="topbar-right">
            {/* Quick Lesson Switcher Dropdown Toggle */}
            <button
              type="button"
              className="topbar-switcher-btn"
              onClick={() => setShowLessonSelector((prev) => !prev)}
              title="Jump to any Sprint 1 Lesson"
            >
              <List size={14} />
              <span>Lessons ({currentIndex + 1}/{THEORETICAL_SPRINT_1_LESSONS.length})</span>
            </button>

            <div className="topbar-xp-badge">
              <Trophy size={13} color="#facc15" />
              <span>+{lesson.xpReward} XP</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              className="topbar-theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              data-testid="theory-reader-theme-toggle"
            >
              {theme === 'dark' ? <Sun size={14} color="#facc15" /> : <Moon size={14} color="#7c3aed" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {isCompleted ? (
              <span className="topbar-status-badge completed">
                <CheckCircle2 size={13} />
                <span>Mastered</span>
              </span>
            ) : (
              <span className="topbar-status-badge ready">
                <Zap size={13} />
                <span>Ready</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── QUICK LESSON SELECTOR DRAWER / DROPDOWN ── */}
      {showLessonSelector && (
        <div className="theory-lesson-drawer-overlay" onClick={() => setShowLessonSelector(false)}>
          <div className="theory-lesson-drawer-menu" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title">
                <BookOpen size={16} color="var(--accent-cyan, #00f2ff)" />
                <span>Sprint 1 Theoretical Lessons</span>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setShowLessonSelector(false)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-lessons-list">
              {THEORETICAL_SPRINT_1_LESSONS.map((l, idx) => {
                const isItemCompleted = completedLessons.includes(l.id);
                const isItemActive = l.id === lesson.id;

                return (
                  <button
                    key={l.id}
                    type="button"
                    className={`drawer-lesson-item ${isItemActive ? 'active' : ''} ${isItemCompleted ? 'completed' : ''}`}
                    onClick={() => {
                      onSelectLesson(l.id);
                      setShowLessonSelector(false);
                    }}
                  >
                    <span className="item-num">{String(idx + 1).padStart(2, '0')}</span>
                    <div className="item-details">
                      <span className="item-title">{l.title}</span>
                      <span className="item-meta">{l.tag} · {l.estimatedDuration}</span>
                    </div>
                    {isItemCompleted ? (
                      <CheckCircle2 size={14} color="#10b981" />
                    ) : (
                      <span className="item-xp">+{l.xpReward} XP</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TWO-COLUMN MAIN WORKSPACE ── */}
      <div className="theory-reader-workspace">
        {/* ── LEFT STICKY SIDEBAR: TABLE OF CONTENTS & QUICK ACTIONS ── */}
        <aside className="theory-reader-sidebar">
          {/* Table of Contents Card */}
          <div className="sidebar-toc-card">
            <div className="toc-header">
              <List size={14} color="var(--accent-cyan, #00f2ff)" />
              <span>Table of Contents</span>
            </div>

            <nav className="toc-nav">
              {lesson.sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className={`toc-link ${activeSectionId === sec.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(sec.id)}
                >
                  <span className="toc-dot" />
                  <span className="toc-title">{sec.title}</span>
                </button>
              ))}

              {lesson.practicalConnection && (
                <button
                  type="button"
                  className="toc-link practical-link"
                  onClick={() => scrollToSection('sec-practical-connection')}
                >
                  <Zap size={13} color="#00f2ff" />
                  <span>Hands-On Quantum Lab</span>
                </button>
              )}

              {(lesson.quiz || activeMultiQuestions.length > 0) && (
                <button
                  type="button"
                  className="toc-link quiz-link"
                  onClick={() => scrollToSection('sec-quiz-assessment')}
                >
                  <Award size={13} color="#facc15" />
                  <span>Concept Assessment</span>
                </button>
              )}
            </nav>
          </div>

          {/* Quick Practical Lab & AI Tutor Gateway Card */}
          {onLaunchPracticalLesson && (
            <div className="sidebar-lab-card">
              <div className="card-badge">
                <Sparkles size={12} color="#00f2ff" />
                <span>QUALUTION AI IDE TUTOR</span>
              </div>
              <h4 className="card-title">{targetPractical.label}</h4>
              <p className="card-desc">{targetPractical.description}</p>
              <button
                type="button"
                className="btn-sidebar-launch"
                onClick={() => onLaunchPracticalLesson(targetPractical.lessonId)}
                data-testid="theory-sidebar-launch-tutor-btn"
              >
                <span>Open in IDE & AI Tutor</span>
                <ExternalLink size={13} />
              </button>
            </div>
          )}

          {/* Quantum Terminology Popover Dictionary Card */}
          {activeGlossaryTerm && (
            <div className="sidebar-glossary-card">
              <div className="glossary-header">
                <Sparkles size={14} color="#00f2ff" />
                <span>{QUANTUM_GLOSSARY[activeGlossaryTerm]?.title || 'Quantum Term'}</span>
                <button
                  type="button"
                  className="glossary-close"
                  onClick={() => setActiveGlossaryTerm(null)}
                >
                  ✕
                </button>
              </div>
              <p className="glossary-def">
                {QUANTUM_GLOSSARY[activeGlossaryTerm]?.definition}
              </p>
              {QUANTUM_GLOSSARY[activeGlossaryTerm]?.formula && (
                <div className="glossary-formula markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {`$$${QUANTUM_GLOSSARY[activeGlossaryTerm].formula}$$`}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── RIGHT MAIN ARTICLE CONTENT STAGE ── */}
        <div className="theory-reader-main-stage">
          {/* 1. HERO HEADER CARD */}
          <header className="theory-hero-header">
            <div className="hero-top-meta">
              <span className="hero-sprint-pill">
                <Sparkles size={12} />
                <span>{lesson.sprintTitle}</span>
              </span>
              <span className="hero-step-pill">
                LESSON {String(lesson.lessonNumber).padStart(2, '0')} OF {THEORETICAL_SPRINT_1_LESSONS.length}
              </span>
              <span className="hero-tag-pill">{lesson.tag}</span>
            </div>

            <h1 className="hero-lesson-title" data-testid="theory-lesson-title">
              {lesson.title}
            </h1>

            <p className="hero-lesson-desc">{lesson.description}</p>

            {/* Learning Objectives Box */}
            <div className="hero-objectives-card">
              <div className="objectives-header">
                <BookOpen size={16} color="var(--accent-cyan, #00f2ff)" />
                <span>Learning Objectives</span>
              </div>

              <div className="objectives-grid">
                {lesson.learningObjectives.map((obj, idx) => (
                  <div key={idx} className="objective-item">
                    <CheckCircle2 size={15} className="obj-icon" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI IDE Quantum Tutor Launch Banner */}
            {onLaunchPracticalLesson && (
              <div className="hero-ai-tutor-banner">
                <div className="banner-left">
                  <div className="banner-badge">
                    <Sparkles size={13} color="#00f2ff" />
                    <span>QUALUTION AI IDE TUTOR</span>
                  </div>
                  <h3 className="banner-title">{targetPractical.label}</h3>
                  <p className="banner-desc">{targetPractical.description}</p>
                </div>
                <button
                  type="button"
                  className="btn-hero-launch-tutor"
                  onClick={() => onLaunchPracticalLesson(targetPractical.lessonId)}
                  data-testid="theory-hero-launch-tutor-btn"
                >
                  <Zap size={14} />
                  <span>Open in IDE & Learn with AI Tutor</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            )}
          </header>

          {/* 2. LIVE TEACHING BOARD (if a board lesson exists for this concept) */}
          {(() => {
            const boardLesson = getBoardLessonForConcept(lesson.id);
            if (!boardLesson) return null;
            return (
              <TheoryBoard
                key={boardLesson.id}
                lesson={boardLesson}
                onTransitionToWorkbench={onLaunchPracticalLesson}
                onComplete={() => {
                  // Auto-mark lesson completed when board lesson finishes
                  const updated = markLessonCompleted(lesson.id, lesson.xpReward);
                  setCompletedLessons(updated);
                }}
              />
            );
          })()}

          {/* 2b. VISUAL LESSON (VIDEO DEMO IF AVAILABLE) */}
          {lesson.video && (
            <VideoLesson video={lesson.video} lessonTitle={lesson.title} />
          )}

          {/* 3. MAIN THEORETICAL SECTIONS & FORMULAS */}
          <main className="theory-sections-list" role="main">
            {lesson.sections.map((section) => (
              <article key={section.id} id={section.id} className="theory-section-card">
                <h2 className="section-heading">{section.title}</h2>

                <div className="section-body">
                  {section.content.map((p, pIdx) => (
                    <div key={pIdx} className="section-paragraph markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {p}
                      </ReactMarkdown>
                    </div>
                  ))}

                  {/* Mathematical Formula Card with KaTeX Rendering */}
                  {section.formula && (
                    <div className="theory-formula-card">
                      <div className="formula-top-bar">
                        <div className="formula-badge">
                          <Sparkles size={12} color="#00f2ff" />
                          <span>MATHEMATICAL FORMULATION</span>
                        </div>
                        <button
                          type="button"
                          className="btn-copy-formula"
                          onClick={() => copyFormulaText(section.id, section.formula!)}
                          title="Copy LaTeX formula"
                        >
                          {copiedFormulaId === section.id ? (
                            <Check size={12} color="#10b981" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span>{copiedFormulaId === section.id ? 'Copied' : 'Copy LaTeX'}</span>
                        </button>
                      </div>

                      <div className="formula-katex-display markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {`$$${section.formula}$$`}
                        </ReactMarkdown>
                      </div>

                      {section.formulaCaption && (
                        <div className="formula-caption">
                          {section.formulaCaption}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Glassmorphism Callout Box */}
                  {section.callout && (
                    <div className={`theory-callout-card ${section.callout.type}`}>
                      <div className="callout-icon-box">
                        {section.callout.type === 'insight' && <Lightbulb size={20} className="icon-insight" />}
                        {section.callout.type === 'tip' && <Sparkles size={20} className="icon-tip" />}
                        {section.callout.type === 'warning' && <AlertCircle size={20} className="icon-warning" />}
                        {section.callout.type === 'info' && <HelpCircle size={20} className="icon-info" />}
                      </div>
                      <div className="callout-content">
                        <h4 className="callout-title">{section.callout.title}</h4>
                        <p className="callout-text">{section.callout.text}</p>
                      </div>
                    </div>
                  )}

                  {/* Key Takeaway Banner */}
                  {section.keyTakeaway && (
                    <div className="theory-takeaway-card">
                      <div className="takeaway-badge">KEY TAKEAWAY</div>
                      <p className="takeaway-text">{section.keyTakeaway}</p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </main>

          {/* 4. CLASSICAL BIT VS QUBIT COMPARISON TABLE (FOR LESSON 1) */}
          {lesson.id === 's1-theory-what-is-quantum' && (
            <div className="theory-comparison-card">
              <div className="comp-header">
                <Layers size={16} color="var(--accent-cyan, #00f2ff)" />
                <h3>Architectural Comparison: Classical Bit vs. Quantum Qubit</h3>
              </div>

              <div className="comp-table-wrapper">
                <table className="quantum-comparison-table">
                  <thead>
                    <tr>
                      <th>Dimension</th>
                      <th>Classical Bit</th>
                      <th>Quantum Qubit ($|\\psi\\rangle$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>State Space</strong></td>
                      <td>Discrete binary set &#123;0, 1&#125;</td>
                      <td>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {'Continuous 2D complex Hilbert space ($\\mathbb{C}^2$)'}
                        </ReactMarkdown>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Superposition</strong></td>
                      <td>Impossible (strictly 0 OR 1)</td>
                      <td>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {'Linear superposition $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$'}
                        </ReactMarkdown>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>$n$-Unit Information</strong></td>
                      <td>$n$ classical bits store 1 state out of $2^n$</td>
                      <td>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {'$n$ qubits hold $2^n$ complex probability amplitudes simultaneously'}
                        </ReactMarkdown>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Operation Type</strong></td>
                      <td>Boolean logic gates (AND, OR, NOT)</td>
                      <td>Reversible unitary matrix transformations &amp; wave interference</td>
                    </tr>
                    <tr>
                      <td><strong>Measurement</strong></td>
                      <td>Deterministic voltage reading</td>
                      <td>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {"Probabilities governed by Born's Rule ($P(x) = |\\alpha_x|^2$)"}
                        </ReactMarkdown>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. PRACTICAL LAB CONNECTION BANNER */}
          {lesson.practicalConnection && onLaunchPracticalLesson && (
            <div id="sec-practical-connection" className="theory-practical-gateway-card" data-testid="theory-practical-banner">
              <div className="gateway-badge">
                <Zap size={14} />
                <span>HANDS-ON QUANTUM LAB GATEWAY</span>
              </div>
              <h3 className="gateway-title">{lesson.practicalConnection.label}</h3>
              <p className="gateway-desc">{lesson.practicalConnection.description}</p>
              <button
                type="button"
                className="btn-launch-practical"
                onClick={() => onLaunchPracticalLesson(lesson.practicalConnection!.lessonId)}
                data-testid="theory-launch-lab-btn"
              >
                <Zap size={15} />
                <span>Launch in Quantum Studio Lab</span>
                <ExternalLink size={15} />
              </button>
            </div>
          )}

          {/* 6. CONCEPT CHECKPOINT / FORMAL ASSESSMENT */}
          <div id="sec-quiz-assessment" className="theory-quiz-container">
            {/* A. Single Question Check (Lessons 1-9) */}
            {lesson.quiz && (
              <section className="theory-single-quiz-card" data-testid="theory-single-quiz">
                <div className="quiz-card-header">
                  <div className="quiz-tag">
                    <HelpCircle size={14} />
                    <span>CONCEPT CHECKPOINT</span>
                  </div>
                  <h3 className="quiz-question-text">{lesson.quiz.question}</h3>
                </div>

                <div className="quiz-options-list">
                  {lesson.quiz.options.map((opt, optIdx) => {
                    let optClass = 'quiz-option-btn';
                    if (selectedSingleAnswer === optIdx) optClass += ' selected';
                    if (isSingleQuizSubmitted) {
                      if (optIdx === lesson.quiz?.correctIndex) optClass += ' correct';
                      else if (selectedSingleAnswer === optIdx) optClass += ' incorrect';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={optClass}
                        onClick={() => handleSelectSingleOption(optIdx)}
                        disabled={isSingleQuizSubmitted}
                        data-testid={`theory-quiz-opt-${optIdx}`}
                      >
                        <span className="opt-badge">{String.fromCharCode(65 + optIdx)}</span>
                        <span className="opt-text">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Single Quiz Feedback */}
                {isSingleQuizSubmitted && (
                  <div
                    className={`quiz-feedback-banner ${
                      selectedSingleAnswer === lesson.quiz.correctIndex ? 'success' : 'error'
                    }`}
                    data-testid="theory-quiz-feedback"
                  >
                    <div className="feedback-title-row">
                      {selectedSingleAnswer === lesson.quiz.correctIndex ? (
                        <>
                          <CheckCircle2 size={18} color="#10b981" />
                          <span>Correct! +{lesson.xpReward} XP Earned</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={18} color="#ef4444" />
                          <span>Incorrect. Review the explanation below:</span>
                        </>
                      )}
                    </div>
                    <p className="feedback-body">{lesson.quiz.explanation}</p>
                  </div>
                )}
              </section>
            )}

            {/* B. Multi-Question Knowledge Check (Lesson 10) or Formal Assessment (Lesson 11) */}
            {activeMultiQuestions.length > 0 && (
              <section className="theory-multi-quiz-container" data-testid="theory-multi-quiz">
                <div className="multi-quiz-header">
                  <div className="quiz-tag">
                    {lesson.isAssessment ? <Award size={14} /> : <BookOpen size={14} />}
                    <span>{lesson.isAssessment ? 'FORMAL SPRINT ASSESSMENT' : 'KNOWLEDGE CHECK'}</span>
                  </div>
                  <h3>
                    {lesson.isAssessment
                      ? '10-Question Comprehensive Assessment'
                      : 'Sprint 1 Conceptual Review'}
                  </h3>
                  <p>
                    {lesson.isAssessment
                      ? 'Score ≥70% to pass and certify your theoretical foundation in single-qubit quantum mechanics.'
                      : 'Test your understanding across all topics from Lessons 1 through 9.'}
                  </p>
                </div>

                <div className="multi-questions-grid">
                  {activeMultiQuestions.map((q, qIdx) => {
                    const selected = multiAnswers[q.id];
                    return (
                      <div key={q.id} className="multi-q-card" data-testid={`multi-q-${qIdx}`}>
                        <h4 className="q-title">
                          <span className="q-num">Q{qIdx + 1}.</span> {q.question}
                        </h4>

                        <div className="q-options">
                          {q.options.map((opt, optIdx) => {
                            let optClass = 'quiz-option-btn';
                            if (selected === optIdx) optClass += ' selected';
                            if (isMultiSubmitted) {
                              if (optIdx === q.correctIndex) optClass += ' correct';
                              else if (selected === optIdx) optClass += ' incorrect';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                className={optClass}
                                onClick={() => handleSelectMultiOption(q.id, optIdx)}
                                disabled={isMultiSubmitted}
                                data-testid={`multi-opt-${q.id}-${optIdx}`}
                              >
                                <span className="opt-badge">{String.fromCharCode(65 + optIdx)}</span>
                                <span className="opt-text">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {isMultiSubmitted && (
                          <div className={`q-explanation ${selected === q.correctIndex ? 'correct' : 'incorrect'}`}>
                            <strong>{selected === q.correctIndex ? '✓ Correct' : '✗ Incorrect'}:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="multi-submit-bar">
                  {!isMultiSubmitted ? (
                    <button
                      type="button"
                      className="btn-submit-assessment"
                      onClick={handleSubmitMultiQuiz}
                      disabled={!allMultiQuestionsAnswered}
                      data-testid="theory-submit-assessment-btn"
                    >
                      <span>
                        {allMultiQuestionsAnswered
                          ? lesson.isAssessment
                            ? 'Submit Formal Assessment'
                            : 'Submit Knowledge Check'
                          : `Answer All ${activeMultiQuestions.length} Questions to Submit (${
                              Object.keys(multiAnswers).length
                            }/${activeMultiQuestions.length})`}
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div
                      className={`assessment-result-banner ${
                        assessmentScore !== null && (lesson.isAssessment ? assessmentScore >= 70 : assessmentScore >= 50)
                          ? 'pass'
                          : 'retry'
                      }`}
                      data-testid="theory-assessment-result-card"
                    >
                      <div className="result-left">
                        {assessmentScore !== null && (lesson.isAssessment ? assessmentScore >= 70 : assessmentScore >= 50) ? (
                          <>
                            <Award size={28} color="#10b981" />
                            <div className="result-info">
                              <h3>Assessment Passed! Score: {assessmentScore}%</h3>
                              <p>Congratulations! You have demonstrated theoretical mastery. +{lesson.xpReward} XP awarded!</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={28} color="#ef4444" />
                            <div className="result-info">
                              <h3>Score: {assessmentScore}% (Passing threshold: 70%)</h3>
                              <p>Review the explanations above and click Retry Assessment to test your understanding again.</p>
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn-retry-assessment"
                        onClick={handleResetMultiQuiz}
                        data-testid="theory-retry-assessment-btn"
                      >
                        <RotateCcw size={14} />
                        <span>Retry Assessment</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Manual Mark Complete Button for Lessons without quiz */}
            {!isCompleted && !lesson.quiz && activeMultiQuestions.length === 0 && (
              <div className="theory-manual-complete-card">
                <button
                  type="button"
                  className="btn-mark-completed"
                  onClick={handleManualComplete}
                  data-testid="theory-mark-complete-btn"
                >
                  <CheckCircle2 size={16} />
                  <span>Mark Lesson Completed (+{lesson.xpReward} XP)</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. PREV / NEXT LESSON PAGINATION FOOTER */}
          <footer className="theory-pagination-footer">
            <div className="footer-nav-col prev">
              {prevLesson ? (
                <button
                  type="button"
                  className="footer-nav-card"
                  onClick={() => onSelectLesson(prevLesson.id)}
                  data-testid="theory-prev-lesson-btn"
                >
                  <ArrowLeft size={16} />
                  <div className="nav-text-group">
                    <span className="nav-sub">PREVIOUS LESSON</span>
                    <span className="nav-title">{prevLesson.title}</span>
                  </div>
                </button>
              ) : (
                <div />
              )}
            </div>

            <div className="footer-nav-col center">
              <button
                type="button"
                className="btn-footer-close"
                onClick={onClose}
                data-testid="theory-footer-close-btn"
              >
                Back to Track Overview
              </button>
            </div>

            <div className="footer-nav-col next">
              {nextLesson ? (
                <button
                  type="button"
                  className="footer-nav-card"
                  onClick={() => onSelectLesson(nextLesson.id)}
                  data-testid="theory-next-lesson-btn"
                >
                  <div className="nav-text-group text-right">
                    <span className="nav-sub">NEXT LESSON</span>
                    <span className="nav-title">{nextLesson.title}</span>
                  </div>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="footer-nav-card finish"
                  onClick={onClose}
                  data-testid="theory-finish-track-btn"
                >
                  <div className="nav-text-group text-right">
                    <span className="nav-sub">SPRINT 1 COMPLETE</span>
                    <span className="nav-title">Return to Academy</span>
                  </div>
                  <Award size={16} />
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

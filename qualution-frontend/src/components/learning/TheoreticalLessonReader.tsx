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
  Volume2,
  VolumeX,
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

const MemoizedMarkdown = React.memo<{ content: string; className?: string }>(({ content, className }) => (
  <div className={className}>
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
      {content}
    </ReactMarkdown>
  </div>
));

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
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Lesson 1-9 Quiz state
  const [selectedSingleAnswer, setSelectedSingleAnswer] = useState<number | null>(null);
  const [isSingleQuizSubmitted, setIsSingleQuizSubmitted] = useState<boolean>(false);

  // Knowledge Check & Assessment multi-question state
  const [multiAnswers, setMultiAnswers] = useState<Record<string, number | null>>({});
  const [isMultiSubmitted, setIsMultiSubmitted] = useState<boolean>(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);

  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const play8BitSound = (type: 'coin' | 'jump' | 'stomp' | 'powerup') => {
    if (!audioEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      if (type === 'coin') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'jump') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'powerup') {
        const notes = [330, 392, 659, 523, 587, 784];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.08, now + idx * 0.07);
          gain.gain.linearRampToValueAtTime(0.001, now + (idx + 1) * 0.07);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + (idx + 1) * 0.07);
        });
      } else if (type === 'stomp') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {
      // Audio fallback
    }
  };

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

  const scrollRafId = useRef<number | null>(null);
  const activeSectionIdRef = useRef<string>('');
  const lastProgressRef = useRef<number>(-1);

  useEffect(() => {
    return () => {
      if (scrollRafId.current !== null) {
        cancelAnimationFrame(scrollRafId.current);
      }
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (scrollRafId.current !== null) return;

    scrollRafId.current = requestAnimationFrame(() => {
      scrollRafId.current = null;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const totalScrollable = scrollHeight - clientHeight;
      if (totalScrollable > 0) {
        const pct = Math.min(100, Math.round((scrollTop / totalScrollable) * 100));
        if (Math.abs(pct - lastProgressRef.current) >= 2 || pct === 100 || pct === 0) {
          lastProgressRef.current = pct;
          setReadingProgress(pct);
        }
      }

      // Determine active section based on scroll position without forcing layout constantly
      for (const sec of lesson.sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom >= 80) {
            if (activeSectionIdRef.current !== sec.id) {
              activeSectionIdRef.current = sec.id;
              setActiveSectionId(sec.id);
            }
            break;
          }
        }
      }
    });
  };

  const isCompleted = completedLessons.includes(lesson.id);

  // Handlers for Lesson 1-9 single quiz
  const handleSelectSingleOption = (optIndex: number) => {
    if (isSingleQuizSubmitted) return;
    setSelectedSingleAnswer(optIndex);
    setIsSingleQuizSubmitted(true);

    if (lesson.quiz && optIndex === lesson.quiz.correctIndex) {
      play8BitSound('powerup');
      const updated = markLessonCompleted(lesson.id, lesson.xpReward);
      setCompletedLessons(updated);
    } else {
      play8BitSound('stomp');
    }
  };

  const handleManualComplete = () => {
    play8BitSound('powerup');
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
    play8BitSound('coin');
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
      play8BitSound('powerup');
      const updated = markLessonCompleted(lesson.id, lesson.xpReward);
      if (lesson.isAssessment) {
        markLessonCompleted('lesson-1-theory-assessment', 0);
      }
      setCompletedLessons(updated);
    } else {
      play8BitSound('stomp');
    }
  };

  const handleResetMultiQuiz = () => {
    play8BitSound('jump');
    setMultiAnswers({});
    setIsMultiSubmitted(false);
    setAssessmentScore(null);
  };

  const allMultiQuestionsAnswered =
    activeMultiQuestions.length > 0 &&
    activeMultiQuestions.every((q) => multiAnswers[q.id] !== undefined && multiAnswers[q.id] !== null);

  const copyFormulaText = (secId: string, formulaStr: string) => {
    navigator.clipboard.writeText(formulaStr);
    play8BitSound('coin');
    setCopiedFormulaId(secId);
    setTimeout(() => setCopiedFormulaId(null), 2000);
  };

  const scrollToSection = (secId: string) => {
    play8BitSound('jump');
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="theory-reader-overlay full-page-reader mario-theme-reader"
      data-testid="theory-lesson-reader"
      onScroll={handleScroll}
      ref={mainContainerRef}
    >
      {/* ── White Cloud Style Background Backdrop with Floating Pixel Clouds ── */}
      <div className="lp-mario-white-backdrop">
        <div className="lp-mario-clouds-container">
          <img src="/mario/Cloud1.png" alt="" className="lp-mario-cloud cloud-drift-1" />
          <img src="/mario/Cloud2.png" alt="" className="lp-mario-cloud cloud-drift-2" />
          <img src="/mario/Cloud1.png" alt="" className="lp-mario-cloud cloud-drift-3" />
          <img src="/mario/Cloud2.png" alt="" className="lp-mario-cloud cloud-drift-4" />
          <img src="/mario/Cloud1.png" alt="" className="lp-mario-cloud cloud-drift-5" />
        </div>
      </div>

      {/* CRT Scanline Overlay */}
      <div className="mario-scanlines" />

      {/* ── TOP STICKY ARCADE HUD COMMAND & PROGRESS HEADER ── */}
      <header className="theory-sticky-topbar mario-arcade-hud">
        <div className="topbar-inner">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-back-btn mario-hud-btn"
              onClick={() => {
                play8BitSound('stomp');
                onClose();
              }}
              data-testid="theory-reader-close-btn"
              title="Return to Academy Overview"
            >
              <ArrowLeft size={16} />
              <span>◀ WORLD SELECT</span>
            </button>

            <div className="topbar-divider" />

            <div className="mario-hud-stage-badge">
              <span className="mario-badge-world">WORLD 1-{lesson.lessonNumber}</span>
              <span className="mario-badge-tag">{lesson.tag.replace(/^World\s*\d+-\d+\s*·\s*/i, '')}</span>
            </div>
          </div>

          <div className="topbar-center">
            {/* Reading Scroll Progress Meter */}
            <div className="reading-progress-container mario-progress-box" title={`Level Progress: ${readingProgress}%`}>
              <div className="mario-progress-hud-row">
                <span className="mario-progress-label">STAGE PROGRESS</span>
                <span className="mario-progress-val">{readingProgress}%</span>
              </div>
              <div className="progress-track mario-progress-track">
                <div className="progress-fill mario-progress-fill" style={{ width: `${readingProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="topbar-right mario-hud-cluster">
            {/* Coins Counter */}
            <div className="mario-hud-coin-counter" title="Total Coins Collected">
              <img src="/mario/Coin.png" alt="Coin" className="mario-coin-icon spin" />
              <span>×{isCompleted ? '100' : String(Math.round(readingProgress)).padStart(2, '0')}</span>
            </div>

            {/* Quick Lesson Switcher Dropdown Toggle */}
            <button
              type="button"
              className="topbar-switcher-btn mario-hud-btn"
              onClick={() => {
                play8BitSound('jump');
                setShowLessonSelector((prev) => !prev);
              }}
              title="Jump to any Sprint 1 Lesson"
            >
              <img src="/mario/MysteryBlock.png" alt="?" className="mario-btn-qblock-icon" />
              <span>LEVELS ({currentIndex + 1}/{THEORETICAL_SPRINT_1_LESSONS.length})</span>
            </button>

            {/* XP Star Badge */}
            <div className="topbar-xp-badge mario-xp-badge" title="Course XP Reward">
              <img src="/mario/Starman.png" alt="★" className="mario-star-hud-icon" />
              <span>+{lesson.xpReward} PTS</span>
            </div>

            {/* 8-Bit SFX Audio Toggle */}
            <button
              type="button"
              className="mario-audio-toggle-btn"
              onClick={() => setAudioEnabled((prev) => !prev)}
              title={audioEnabled ? 'Mute 8-Bit Audio' : 'Enable 8-Bit Audio'}
            >
              {audioEnabled ? <Volume2 size={15} color="#ffd700" /> : <VolumeX size={15} color="#94a3b8" />}
              <span className="audio-label">{audioEnabled ? 'SFX ON' : 'MUTED'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              className="topbar-theme-toggle-btn mario-theme-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Overworld Sky' : 'Underground'} Mode`}
              data-testid="theory-reader-theme-toggle"
            >
              {theme === 'dark' ? <Sun size={14} color="#facc15" /> : <Moon size={14} color="#60a5fa" />}
            </button>

            {isCompleted ? (
              <span className="topbar-status-badge completed mario-status-cleared">
                <CheckCircle2 size={13} />
                <span>CLEARED ★</span>
              </span>
            ) : (
              <span className="topbar-status-badge ready mario-status-active">
                <Zap size={13} />
                <span>PLAYING ▶</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── QUICK LESSON SELECTOR DRAWER / DROPDOWN ── */}
      {showLessonSelector && (
        <div className="theory-lesson-drawer-overlay mario-drawer-overlay" onClick={() => setShowLessonSelector(false)}>
          <div className="theory-lesson-drawer-menu mario-drawer-menu" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header mario-drawer-header">
              <div className="drawer-title mario-arcade-font">
                <img src="/mario/MysteryBlock.png" alt="?" className="drawer-block-icon" />
                <span>WORLD 1 — LEVEL SELECT</span>
              </div>
              <button
                type="button"
                className="drawer-close-btn mario-close-btn"
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
                    className={`drawer-lesson-item mario-drawer-item ${isItemActive ? 'active' : ''} ${isItemCompleted ? 'completed' : ''}`}
                    onClick={() => {
                      play8BitSound('jump');
                      onSelectLesson(l.id);
                      setShowLessonSelector(false);
                    }}
                  >
                    <span className="item-num mario-item-num">W1-{idx + 1}</span>
                    <div className="item-details">
                      <span className="item-title">{l.title}</span>
                      <span className="item-meta">{l.tag} · {l.estimatedDuration}</span>
                    </div>
                    {isItemCompleted ? (
                      <span className="mario-drawer-cleared-star">★ CLEAR</span>
                    ) : (
                      <span className="item-xp mario-xp-pill">+{l.xpReward} XP</span>
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
          <div className="sidebar-toc-card mario-sidebar-card">
            <div className="toc-header mario-card-header">
              <img src="/mario/MysteryBlock.png" alt="?" className="mario-side-icon" />
              <span>STAGE QUEST LOG</span>
            </div>

            <nav className="toc-nav mario-toc-nav">
              {lesson.sections.map((sec, idx) => (
                <button
                  key={sec.id}
                  type="button"
                  className={`toc-link mario-toc-link ${activeSectionId === sec.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(sec.id)}
                >
                  <span className="mario-toc-badge">1-{idx + 1}</span>
                  <span className="toc-title">{sec.title}</span>
                </button>
              ))}

              {lesson.practicalConnection && (
                <button
                  type="button"
                  className="toc-link practical-link mario-warp-link"
                  onClick={() => scrollToSection('sec-practical-connection')}
                >
                  <img src="/mario/PipeTop.png" alt="Pipe" className="mario-pipe-mini-icon" />
                  <span>Warp Zone: Hands-On Lab</span>
                </button>
              )}

              {(lesson.quiz || activeMultiQuestions.length > 0) && (
                <button
                  type="button"
                  className="toc-link quiz-link mario-boss-link"
                  onClick={() => scrollToSection('sec-quiz-assessment')}
                >
                  <img src="/mario/Starman.png" alt="★" className="mario-star-mini-icon" />
                  <span>Bowser Boss Checkpoint</span>
                </button>
              )}
            </nav>
          </div>

          {/* Quick Practical Lab & AI Tutor Warp Zone Card */}
          {onLaunchPracticalLesson && (
            <div className="sidebar-lab-card mario-warp-card">
              <div className="mario-pipe-header-art">
                <img src="/mario/PipeTop.png" alt="Warp Pipe" className="mario-sidebar-pipe-img" />
              </div>
              <div className="card-badge mario-warp-badge">
                <Sparkles size={12} color="#ffd700" />
                <span>WARP ZONE // IDE TUTOR</span>
              </div>
              <h4 className="card-title mario-warp-title">{targetPractical.label}</h4>
              <p className="card-desc mario-warp-desc">{targetPractical.description}</p>
              <button
                type="button"
                className="btn-sidebar-launch mario-warp-launch-btn"
                onClick={() => {
                  play8BitSound('powerup');
                  onLaunchPracticalLesson(targetPractical.lessonId);
                }}
                data-testid="theory-sidebar-launch-tutor-btn"
              >
                <span>ENTER WARP PIPE</span>
                <ExternalLink size={13} />
              </button>
            </div>
          )}

          {/* Quantum Terminology Popover Dictionary Card */}
          {activeGlossaryTerm && (
            <div className="sidebar-glossary-card mario-glossary-card">
              <div className="glossary-header mario-glossary-header">
                <img src="/mario/MysteryBlock.png" alt="?" className="mario-glossary-icon" />
                <span>{QUANTUM_GLOSSARY[activeGlossaryTerm]?.title || 'Quantum Item'}</span>
                <button
                  type="button"
                  className="glossary-close mario-close-btn"
                  onClick={() => setActiveGlossaryTerm(null)}
                >
                  ✕
                </button>
              </div>
              <p className="glossary-def">
                {QUANTUM_GLOSSARY[activeGlossaryTerm]?.definition}
              </p>
              {QUANTUM_GLOSSARY[activeGlossaryTerm]?.formula && (
                <MemoizedMarkdown
                  className="glossary-formula markdown-body mario-formula-mini"
                  content={`$$${QUANTUM_GLOSSARY[activeGlossaryTerm].formula}$$`}
                />
              )}
            </div>
          )}
        </aside>

        {/* ── RIGHT MAIN ARTICLE CONTENT STAGE ── */}
        <div className="theory-reader-main-stage">
          {/* 1. HERO HEADER CARD (SUPER MARIO STAGE INTRO) */}
          <header className="theory-hero-header mario-hero-stage-card">
            <div className="mario-hero-banner-bar">
              <span className="mario-hero-level-chip">
                ★ SUPER QUALUTION BROS. · WORLD 1-{lesson.lessonNumber} ★
              </span>
              <span className="mario-hero-time-chip">TIME 400</span>
            </div>

            <div className="hero-top-meta mario-hero-top-meta">
              <span className="hero-sprint-pill mario-sprint-chip">
                <img src="/mario/Starman.png" alt="Star" className="mario-star-chip-icon" />
                <span>{lesson.sprintTitle}</span>
              </span>
              <span className="hero-step-pill mario-step-chip">
                STAGE 0{lesson.lessonNumber} OF 11
              </span>
              <span className="hero-tag-pill mario-tag-chip">{lesson.tag}</span>
            </div>

            <h1 className="hero-lesson-title mario-stage-title" data-testid="theory-lesson-title">
              {lesson.title}
            </h1>

            <p className="hero-lesson-desc mario-stage-desc">{lesson.description}</p>

            {/* Learning Objectives Box (Mushroom Kingdom Quest Scroll) */}
            <div className="hero-objectives-card mario-quest-scroll">
              <div className="objectives-header mario-quest-header">
                <img src="/mario/MagicMushroom.png" alt="Mushroom" className="mario-obj-head-icon" />
                <span className="mario-arcade-font">MISSION OBJECTIVES</span>
              </div>

              <div className="objectives-grid mario-objectives-grid">
                {lesson.learningObjectives.map((obj, idx) => (
                  <div key={idx} className="objective-item mario-obj-item">
                    <img src="/mario/Coin.png" alt="•" className="mario-obj-coin" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI IDE Quantum Tutor Launch Banner (Warp Zone Style) */}
            {onLaunchPracticalLesson && (
              <div className="hero-ai-tutor-banner mario-hero-warp-banner">
                <div className="banner-left">
                  <div className="banner-badge mario-warp-pill">
                    <Sparkles size={13} color="#ffd700" />
                    <span>WARP ZONE // ERWIN'S QUANTUM LAB</span>
                  </div>
                  <h3 className="banner-title mario-banner-title">{targetPractical.label}</h3>
                  <p className="banner-desc mario-banner-desc">{targetPractical.description}</p>
                </div>
                <button
                  type="button"
                  className="btn-hero-launch-tutor mario-hero-warp-btn"
                  onClick={() => {
                    play8BitSound('powerup');
                    onLaunchPracticalLesson(targetPractical.lessonId);
                  }}
                  data-testid="theory-hero-launch-tutor-btn"
                >
                  <img src="/mario/PipeTop.png" alt="Pipe" className="mario-hero-pipe-icon" />
                  <span>WARP TO LAB & AI TUTOR</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            )}
          </header>

          {/* VIDEO LESSON (LEFT AS SUCH PER USER REQUEST) */}
          {lesson.video && (
            <VideoLesson video={lesson.video} lessonTitle={lesson.title} />
          )}

          {/* 3. MAIN THEORETICAL SECTIONS & FORMULAS (MARIO STAGES) */}
          <main className="theory-sections-list" role="main">
            {lesson.sections.map((section, sIdx) => (
              <article key={section.id} id={section.id} className="theory-section-card mario-stage-section-card">
                <div className="mario-stage-header-stripe">
                  <div className="mario-section-badge-group">
                    <img src="/mario/MysteryBlock.png" alt="?" className="mario-stage-qblock" />
                    <span className="mario-stage-label">CHECKPOINT 1-{sIdx + 1}</span>
                  </div>
                  <h2 className="section-heading mario-section-heading">{section.title}</h2>
                </div>

                <div className="section-body">
                  {section.content.map((p, pIdx) => (
                    <MemoizedMarkdown
                      key={pIdx}
                      className="section-paragraph markdown-body mario-markdown-body"
                      content={p}
                    />
                  ))}

                  {/* Mathematical Formula Card with KaTeX Rendering (Arcade High-Score Register) */}
                  {section.formula && (
                    <div className="theory-formula-card mario-formula-scoreboard">
                      <div className="formula-top-bar mario-formula-topbar">
                        <div className="formula-badge mario-formula-badge">
                          <img src="/mario/Coin.png" alt="★" className="mario-formula-coin" />
                          <span>QUANTUM MATHEMATICAL FORMULATION</span>
                        </div>
                        <button
                          type="button"
                          className="btn-copy-formula mario-copy-btn"
                          onClick={() => copyFormulaText(section.id, section.formula!)}
                          title="Copy LaTeX formula"
                        >
                          {copiedFormulaId === section.id ? (
                            <Check size={12} color="#10b981" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span>{copiedFormulaId === section.id ? 'COPIED!' : 'COPY LATEX'}</span>
                        </button>
                      </div>

                      <MemoizedMarkdown
                        className="formula-katex-display markdown-body mario-katex-container"
                        content={`$$${section.formula}$$`}
                      />

                      {section.formulaCaption && (
                        <div className="formula-caption mario-formula-caption">
                          {section.formulaCaption}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mario Callout Boxes */}
                  {section.callout && (
                    <div className={`theory-callout-card mario-callout-card ${section.callout.type}`}>
                      <div className="callout-icon-box mario-callout-icon-box">
                        {section.callout.type === 'insight' && (
                          <img src="/mario/MysteryBlock.png" alt="?" className="mario-callout-img" />
                        )}
                        {section.callout.type === 'tip' && (
                          <img src="/mario/MagicMushroom.png" alt="🍄" className="mario-callout-img" />
                        )}
                        {section.callout.type === 'warning' && (
                          <img src="/mario/Goomba_Flat.png" alt="⚠️" className="mario-callout-img" />
                        )}
                        {section.callout.type === 'info' && (
                          <img src="/mario/Coin.png" alt="ℹ️" className="mario-callout-img" />
                        )}
                      </div>
                      <div className="callout-content">
                        <h4 className="callout-title mario-callout-title">{section.callout.title}</h4>
                        <p className="callout-text mario-callout-text">{section.callout.text}</p>
                      </div>
                    </div>
                  )}

                  {/* Key Takeaway Star Banner */}
                  {section.keyTakeaway && (
                    <div className="theory-takeaway-card mario-takeaway-banner">
                      <div className="takeaway-badge mario-takeaway-badge">
                        <img src="/mario/Starman.png" alt="★" className="mario-takeaway-star" />
                        <span>STAGE TAKEAWAY</span>
                      </div>
                      <p className="takeaway-text mario-takeaway-text">{section.keyTakeaway}</p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </main>

          {/* 4. CLASSICAL GOOMBA VS QUANTUM SUPER MARIO BATTLE STATS TABLE */}
          {lesson.id === 's1-theory-what-is-quantum' && (
            <div className="theory-comparison-card mario-battle-stats-card">
              <div className="comp-header mario-battle-header">
                <img src="/mario/Starman.png" alt="★" className="mario-battle-head-icon" />
                <h3 className="mario-arcade-font">⚔️ 8-BIT BATTLE STATS: CLASSICAL BIT VS. QUANTUM QUBIT</h3>
              </div>

              <div className="comp-table-wrapper mario-table-wrapper">
                <table className="quantum-comparison-table mario-battle-table">
                  <thead>
                    <tr>
                      <th>Dimension</th>
                      <th>Classical Goomba Bit (0 or 1)</th>
                      <th>Super Quantum Mario Qubit ($|\psi\rangle$)</th>
                      <th>Quantum Advantage Multiplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>State Space</strong></td>
                      <td>Discrete binary set &#123;0, 1&#125;</td>
                      <td>
                        <MemoizedMarkdown content={'Continuous 2D complex Hilbert space ($\\mathbb{C}^2$)'} />
                      </td>
                      <td><span className="mario-stat-boost">Continuous $\infty$</span></td>
                    </tr>
                    <tr>
                      <td><strong>Superposition</strong></td>
                      <td>Impossible (strictly 0 OR 1)</td>
                      <td>
                        <MemoizedMarkdown content={'Linear combination: $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$'} />
                      </td>
                      <td><span className="mario-stat-boost">Coexistent States</span></td>
                    </tr>
                    <tr>
                      <td><strong>$n$-Unit Information</strong></td>
                      <td>$n$ bits hold 1 state out of $2^n$ at any millisecond</td>
                      <td>
                        <MemoizedMarkdown content={'$n$ qubits hold $2^n$ complex amplitudes simultaneously'} />
                      </td>
                      <td><span className="mario-stat-boost">$2^n$ Exponential Multiverse</span></td>
                    </tr>
                    <tr>
                      <td><strong>Gate Physics</strong></td>
                      <td>Boolean logic (AND, OR, NOT) — Irreversible</td>
                      <td>
                        <MemoizedMarkdown content={'Unitary operators ($U^\\dagger U = I$) — Strictly Reversible'} />
                      </td>
                      <td><span className="mario-stat-boost">Zero Information Loss</span></td>
                    </tr>
                    <tr>
                      <td><strong>Measurement</strong></td>
                      <td>Deterministic voltage reading ($0$V or $5$V)</td>
                      <td>
                        <MemoizedMarkdown content={"Wavefunction collapse via Born's Rule ($P(x) = |\\alpha_x|^2$)"} />
                      </td>
                      <td><span className="mario-stat-boost">Probabilistic Wave Nature</span></td>
                    </tr>
                    <tr>
                      <td><strong>Core Weapon</strong></td>
                      <td>Sequential serial clock cycling</td>
                      <td>
                        <MemoizedMarkdown content={'Wave interference: cancel errors, amplify right answer'} />
                      </td>
                      <td><span className="mario-stat-boost">Constructive Interference</span></td>
                    </tr>
                    <tr>
                      <td><strong>$n = 300$ Capacity</strong></td>
                      <td>300 binary digits ($\sim 38$ bytes of RAM)</td>
                      <td>
                        <MemoizedMarkdown content={'$2^{300} > 10^{90}$ complex amplitudes simultaneously'} />
                      </td>
                      <td><span className="mario-stat-boost">Exceeds Universe Atoms!</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. PRACTICAL LAB CONNECTION BANNER */}
          {lesson.practicalConnection && onLaunchPracticalLesson && (
            <div id="sec-practical-connection" className="theory-practical-gateway-card mario-gateway-banner" data-testid="theory-practical-banner">
              <div className="gateway-badge mario-gateway-pill">
                <img src="/mario/PipeTop.png" alt="Pipe" className="mario-banner-pipe" />
                <span>WARP ZONE // HANDS-ON QUANTUM LAB</span>
              </div>
              <h3 className="gateway-title mario-gateway-title">{lesson.practicalConnection.label}</h3>
              <p className="gateway-desc mario-gateway-desc">{lesson.practicalConnection.description}</p>
              <button
                type="button"
                className="btn-launch-practical mario-gateway-btn"
                onClick={() => {
                  play8BitSound('powerup');
                  onLaunchPracticalLesson(lesson.practicalConnection!.lessonId);
                }}
                data-testid="theory-launch-lab-btn"
              >
                <Zap size={15} />
                <span>LAUNCH IN QUANTUM STUDIO LAB</span>
                <ExternalLink size={15} />
              </button>
            </div>
          )}

          {/* 6. CONCEPT CHECKPOINT / BOWSER BOSS CHALLENGE */}
          <div id="sec-quiz-assessment" className="theory-quiz-container mario-checkpoint-section">
            {/* A. Single Question Check (Lessons 1-9) */}
            {lesson.quiz && (
              <section className="theory-single-quiz-card mario-single-quiz-card" data-testid="theory-single-quiz">
                <div className="quiz-card-header mario-quiz-header">
                  <div className="quiz-tag mario-quiz-tag">
                    <img src="/mario/MysteryBlock.png" alt="?" className="mario-quiz-tag-icon" />
                    <span>👑 BOWSER BOSS CHECKPOINT // WORLD 1-1</span>
                  </div>
                  <h3 className="quiz-question-text mario-quiz-q-text">{lesson.quiz.question}</h3>
                </div>

                <div className="quiz-options-list mario-quiz-options-list">
                  {lesson.quiz.options.map((opt, optIdx) => {
                    let optClass = 'quiz-option-btn mario-quiz-opt-btn';
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
                        <span className="opt-badge mario-opt-badge">{String.fromCharCode(65 + optIdx)}</span>
                        <span className="opt-text">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Single Quiz Feedback */}
                {isSingleQuizSubmitted && (
                  <div
                    className={`quiz-feedback-banner mario-feedback-banner ${
                      selectedSingleAnswer === lesson.quiz.correctIndex ? 'success' : 'error'
                    }`}
                    data-testid="theory-quiz-feedback"
                  >
                    <div className="feedback-title-row mario-feedback-title">
                      {selectedSingleAnswer === lesson.quiz.correctIndex ? (
                        <>
                          <img src="/mario/Starman.png" alt="★" className="mario-feedback-icon" />
                          <span>COURSE CLEAR! +{lesson.xpReward} XP & 1-UP EARNED!</span>
                        </>
                      ) : (
                        <>
                          <img src="/mario/Goomba_Flat.png" alt="X" className="mario-feedback-icon" />
                          <span>TOO BAD! REVIEW THE EXPLANATION BELOW:</span>
                        </>
                      )}
                    </div>
                    <p className="feedback-body mario-feedback-body">{lesson.quiz.explanation}</p>
                  </div>
                )}
              </section>
            )}

            {/* B. Multi-Question Knowledge Check (Lesson 10) or Formal Assessment (Lesson 11) */}
            {activeMultiQuestions.length > 0 && (
              <section className="theory-multi-quiz-container mario-multi-quiz-card" data-testid="theory-multi-quiz">
                <div className="multi-quiz-header mario-quiz-header">
                  <div className="quiz-tag mario-quiz-tag">
                    {lesson.isAssessment ? <Award size={14} /> : <BookOpen size={14} />}
                    <span>{lesson.isAssessment ? 'WORLD 1 CASTLE FINAL ASSESSMENT' : 'STAGE KNOWLEDGE CHECK'}</span>
                  </div>
                  <h3 className="mario-arcade-font">
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
                      <div key={q.id} className="multi-q-card mario-multi-q-card" data-testid={`multi-q-${qIdx}`}>
                        <h4 className="q-title mario-q-title">
                          <span className="q-num mario-q-num">Q{qIdx + 1}.</span> {q.question}
                        </h4>

                        <div className="q-options mario-quiz-options-list">
                          {q.options.map((opt, optIdx) => {
                            let optClass = 'quiz-option-btn mario-quiz-opt-btn';
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
                                <span className="opt-badge mario-opt-badge">{String.fromCharCode(65 + optIdx)}</span>
                                <span className="opt-text">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {isMultiSubmitted && (
                          <div className={`q-explanation mario-q-explanation ${selected === q.correctIndex ? 'correct' : 'incorrect'}`}>
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
                      className="btn-submit-assessment mario-submit-btn"
                      onClick={handleSubmitMultiQuiz}
                      disabled={!allMultiQuestionsAnswered}
                      data-testid="theory-submit-assessment-btn"
                    >
                      <span>
                        {allMultiQuestionsAnswered
                          ? lesson.isAssessment
                            ? 'SUBMIT WORLD 1 ASSESSMENT'
                            : 'SUBMIT KNOWLEDGE CHECK'
                          : `ANSWER ALL ${activeMultiQuestions.length} QUESTIONS (${
                              Object.keys(multiAnswers).length
                            }/${activeMultiQuestions.length})`}
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div
                      className={`assessment-result-banner mario-result-banner ${
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
                              <h3>COURSE CLEAR! SCORE: {assessmentScore}%</h3>
                              <p>Congratulations! You have demonstrated theoretical mastery. +{lesson.xpReward} XP awarded!</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={28} color="#ef4444" />
                            <div className="result-info">
                              <h3>SCORE: {assessmentScore}% (THRESHOLD: 70%)</h3>
                              <p>Review the explanations above and click Retry Assessment to test your understanding again.</p>
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn-retry-assessment mario-retry-btn"
                        onClick={handleResetMultiQuiz}
                        data-testid="theory-retry-assessment-btn"
                      >
                        <RotateCcw size={14} />
                        <span>RETRY BOSS BATTLE</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Manual Mark Complete Button for Lessons without quiz */}
            {!isCompleted && !lesson.quiz && activeMultiQuestions.length === 0 && (
              <div className="theory-manual-complete-card mario-manual-card">
                <button
                  type="button"
                  className="btn-mark-completed mario-mark-btn"
                  onClick={handleManualComplete}
                  data-testid="theory-mark-complete-btn"
                >
                  <CheckCircle2 size={16} />
                  <span>MARK STAGE CLEARED (+{lesson.xpReward} PTS)</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. PREV / NEXT LESSON PAGINATION FOOTER (STAGE CLEAR MOTIF) */}
          <footer className="theory-pagination-footer mario-stage-footer">
            <div className="footer-nav-col prev">
              {prevLesson ? (
                <button
                  type="button"
                  className="footer-nav-card mario-footer-card prev"
                  onClick={() => {
                    play8BitSound('jump');
                    onSelectLesson(prevLesson.id);
                  }}
                  data-testid="theory-prev-lesson-btn"
                >
                  <ArrowLeft size={16} />
                  <div className="nav-text-group">
                    <span className="nav-sub">◀ PREVIOUS STAGE</span>
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
                className="btn-footer-close mario-footer-close-btn"
                onClick={() => {
                  play8BitSound('stomp');
                  onClose();
                }}
                data-testid="theory-footer-close-btn"
              >
                RETURN TO WORLD MAP
              </button>
            </div>

            <div className="footer-nav-col next">
              {nextLesson ? (
                <button
                  type="button"
                  className="footer-nav-card mario-footer-card next"
                  onClick={() => {
                    play8BitSound('jump');
                    onSelectLesson(nextLesson.id);
                  }}
                  data-testid="theory-next-lesson-btn"
                >
                  <div className="nav-text-group text-right">
                    <span className="nav-sub">NEXT STAGE ▶</span>
                    <span className="nav-title">{nextLesson.title}</span>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  className="footer-nav-card finish mario-footer-card finish"
                  onClick={() => {
                    play8BitSound('powerup');
                    onClose();
                  }}
                  data-testid="theory-finish-track-btn"
                >
                  <div className="nav-text-group text-right">
                    <span className="nav-sub">WORLD 1 COMPLETE</span>
                    <span className="nav-title">Return to World Map</span>
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

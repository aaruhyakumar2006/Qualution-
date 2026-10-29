import React, { useState, useEffect, useMemo } from 'react';
import {
  Atom,
  Sparkles,
  BookOpen,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Cpu,
  Brain,
  Layers,
  ChevronRight,
  MessageSquare,
  Zap,
  TrendingUp,
  FileCode,
  ShieldCheck,
  ExternalLink,
  Play,
  RotateCcw,
  Radio,
  LogOut,
  Lock,
  Unlock,
  AlertTriangle,
  Check,
  Trophy,
} from 'lucide-react';
import { MOCK_STUDENTS, type StudentProfile } from '../features/portals/portalMockData';
import { useTheme } from '../features/theme/ThemeContext';
import { useAuth } from '../features/auth/AuthContext';
import { QuantumCertificateView } from '../components/certificates/QuantumCertificateView';
import { CertificateGenerationModal } from '../components/certificates/CertificateGenerationModal';
import {
  getOrCreateStudentCertificate,
  evaluateCurriculumGraduation,
  type FullCurriculumGraduation,
} from '../features/certificates/certificateService';
import type { QuantumCertificate } from '../features/certificates/certificateTypes';
import { getCompletedLessonIds, getTotalXP } from '../features/learning/assessmentEngine';
import './StudentPortalPage.css';

export interface StudentPortalPageProps {
  onNavigateHome: () => void;
  onNavigateTeacherPortal: () => void;
  onNavigateCollab?: () => void;
  onLaunchIDE: (circuitCode?: string) => void;
  onNavigateLearn: () => void;
}

// ── 8-Bit Web Audio Synthesizer ──────────────────────────────────────────
function play8BitSound(type: 'jump' | 'coin' | 'powerup' | '1up' | 'stomp') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'coin') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'powerup') {
      osc.type = 'triangle';
      const notes = [330, 392, 659, 523, 587, 784];
      notes.forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      });
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'jump') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'stomp') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  } catch {
    // AudioContext blocked or unsupported
  }
}

// ── Three Course Tiers Required for Full Diploma Graduation ──────────────
export interface CourseTierInfo {
  id: 'beginner' | 'intermediate' | 'advanced';
  trackNum: number;
  worldName: string;
  badgeTitle: string;
  subtitle: string;
  iconSrc: string;
  accentColor: string;
  modules: Array<{
    id: string;
    num: string;
    title: string;
    xp: number;
  }>;
}

const COURSE_TIERS: CourseTierInfo[] = [
  {
    id: 'beginner',
    trackNum: 1,
    worldName: 'WORLD 1 — BEGINNER FOUNDATIONS',
    badgeTitle: 'Track 1: Beginner',
    subtitle: 'Dirac Notation, Qubits, Superposition & Born Rule Collapse',
    iconSrc: '/mario/MagicMushroom.png',
    accentColor: '#44d62c',
    modules: [
      { id: 's1-initialize-measure', num: '1-1', title: 'Classical Bits vs. Qubits', xp: 100 },
      { id: 's1-x-gate', num: '1-2', title: 'Pauli-X Gate & Bit Flips', xp: 150 },
      { id: 's1-hadamard-superposition', num: '1-3', title: 'Hadamard & Equal Superposition', xp: 200 },
      { id: 's1-single-qubit-challenge', num: '1-4', title: 'Measurement & Born Rule Challenge', xp: 250 },
    ],
  },
  {
    id: 'intermediate',
    trackNum: 2,
    worldName: 'WORLD 2 — INTERMEDIATE ALGORITHMS',
    badgeTitle: 'Track 2: Intermediate',
    subtitle: 'Universal Gate Set, Depth Optimization & Grover\'s Search',
    iconSrc: '/mario/Coin.png',
    accentColor: '#ffc700',
    modules: [
      { id: 'lesson-5-gate-library', num: '2-1', title: 'Gate Library & S/T Phase Rotations', xp: 250 },
      { id: 'lesson-6-circuit-complexity', num: '2-2', title: 'Circuit Depth & Parallelism', xp: 250 },
      { id: 's2-bell-state-entanglement', num: '2-3', title: 'Two-Qubit Bell Entanglement (|Φ⁺⟩)', xp: 300 },
      { id: 'lesson-8-grovers-search', num: '2-4', title: 'Grover\'s Search & Phase Kickback', xp: 350 },
    ],
  },
  {
    id: 'advanced',
    trackNum: 3,
    worldName: 'WORLD 3 — ADVANCED SUPREMACY',
    badgeTitle: 'Track 3: Advanced',
    subtitle: 'Variational Algorithms, QAOA, Phase Estimation & Shor\'s',
    iconSrc: '/mario/Starman.png',
    accentColor: '#00f2ff',
    modules: [
      { id: 'lesson-9-vqe-intro', num: '3-1', title: 'Variational Quantum Eigensolver (VQE)', xp: 400 },
      { id: 'lesson-10-qaoa-optimization', num: '3-2', title: 'QAOA Combinatorial Optimization', xp: 400 },
      { id: 'lesson-11-phase-estimation', num: '3-3', title: 'Quantum Phase Estimation (QPE)', xp: 450 },
      { id: 'lesson-12-shor-period-finding', num: '3-4', title: 'Shor\'s Period-Finding Architecture', xp: 500 },
    ],
  },
];

export const StudentPortalPage: React.FC<StudentPortalPageProps> = ({
  onNavigateHome,
  onNavigateTeacherPortal,
  onNavigateCollab,
  onLaunchIDE,
  onNavigateLearn,
}) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  // ── Unlock scrolling while the student portal is mounted ──
  useEffect(() => {
    const body = document.body;
    const root = document.getElementById('root');

    body.classList.add('student-portal-active');
    const prevBodyOverflow = body.style.overflow;
    const prevBodyHeight = body.style.height;
    const prevRootOverflow = root?.style.overflow ?? '';
    const prevRootHeight = root?.style.height ?? '';

    body.style.overflow = 'auto';
    body.style.height = 'auto';
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    }

    return () => {
      body.classList.remove('student-portal-active');
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
      if (root) {
        root.style.overflow = prevRootOverflow;
        root.style.height = prevRootHeight;
      }
    };
  }, []);

  // Student Profile Data
  const [student] = useState<StudentProfile>(MOCK_STUDENTS[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'circuits' | 'feedback' | 'credentials'>('overview');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const displayName = user?.full_name || student.fullName;
  const displayEmail = user?.email || student.email;

  // Track simulation state for graduation testing
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('qualution_simulate_graduation') === 'true';
  });

  // Track completed lessons from localStorage
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    return getCompletedLessonIds();
  });

  // Calculate strict 3-tier graduation eligibility (Beginner, Intermediate, Advanced)
  const graduation: FullCurriculumGraduation = useMemo(() => {
    return evaluateCurriculumGraduation(completedLessons);
  }, [completedLessons, isSimulationActive]);

  // Certificate state: ONLY exists if all 3 courses are complete!
  const [userCert, setUserCert] = useState<QuantumCertificate | null>(() => {
    return getOrCreateStudentCertificate(displayName, displayEmail, student.overallScore, student.overallGrade);
  });

  // Sync userCert when graduation changes
  useEffect(() => {
    if (graduation.isGraduated) {
      const cert = getOrCreateStudentCertificate(displayName, displayEmail, student.overallScore, student.overallGrade, true);
      setUserCert(cert);
    } else {
      setUserCert(null);
    }
  }, [graduation.isGraduated, displayName, displayEmail, student.overallScore, student.overallGrade]);

  const toggleSimulateGraduation = () => {
    const nextVal = !isSimulationActive;
    play8BitSound(nextVal ? 'powerup' : 'stomp');
    setIsSimulationActive(nextVal);
    if (typeof window !== 'undefined') {
      if (nextVal) {
        localStorage.setItem('qualution_simulate_graduation', 'true');
      } else {
        localStorage.removeItem('qualution_simulate_graduation');
      }
    }
    setCompletedLessons(getCompletedLessonIds());
  };

  const handleOpenCertificate = () => {
    if (!graduation.isGraduated) {
      play8BitSound('stomp');
      setActiveTab('credentials');
      return;
    }
    play8BitSound('coin');
    setIsCertModalOpen(true);
  };

  return (
    <div className="student-portal-root mario-portal-theme" data-theme={theme}>
      {/* ── Top Sticky Arcade HUD ── */}
      <header className="sp-header sp-mario-hud">
        <div className="sp-header-left">
          <button
            type="button"
            className="sp-logo-btn mario-brand-btn"
            onClick={() => {
              play8BitSound('jump');
              onNavigateHome();
            }}
            title="Return to Home Landing"
          >
            <div className="sp-mario-logo-icon">
              <img src="/mario/MysteryBlock.png" alt="?" className="sp-pixel-qblock" />
            </div>
            <div>
              <div className="sp-mario-brand-title">QUALUTION ACADEMY</div>
              <div className="sp-mario-brand-sub">STUDENT ADVENTURE PORTAL</div>
            </div>
          </button>
        </div>

        <div className="sp-header-right sp-mario-hud-cluster">
          {/* Retro Coin Counter */}
          <div className="sp-mario-coin-pill" title="Total Quantum Coins Earned">
            <img src="/mario/Coin.png" alt="Coin" className="sp-hud-coin-img spin" />
            <span>×{graduation.isGraduated ? '99' : String(graduation.totalCompleted * 8).padStart(2, '0')}</span>
          </div>

          {/* Star XP Counter */}
          <div className="sp-mario-xp-pill" title="Current Academic XP">
            <img src="/mario/Starman.png" alt="★" className="sp-hud-star-img" />
            <span>+{getTotalXP() || (graduation.isGraduated ? 3400 : 1850)} PTS</span>
          </div>

          {/* Quick Persona Switcher */}
          <div className="sp-role-switch-pill mario-switch-pill">
            <span className="sp-role-tag active">Student View</span>
            <button
              type="button"
              className="sp-role-switch-btn"
              onClick={() => {
                play8BitSound('jump');
                onNavigateTeacherPortal();
              }}
              title="Switch to Teacher View"
            >
              Switch to Teacher View
            </button>
          </div>

          {onNavigateCollab && (
            <button
              type="button"
              className="sp-nav-btn secondary mario-collab-btn"
              onClick={() => {
                play8BitSound('jump');
                onNavigateCollab();
              }}
              title="Join Collaborative Group Lab"
            >
              <Radio size={14} />
              <span>Collab Lab</span>
            </button>
          )}

          <button
            type="button"
            className="sp-nav-btn primary mario-launch-btn"
            onClick={() => {
              play8BitSound('powerup');
              onLaunchIDE();
            }}
            title="Open Quantum Studio simulator"
          >
            <Cpu size={14} />
            <span>Launch Studio</span>
          </button>

          <button
            type="button"
            className="sp-nav-btn logout mario-logout-btn"
            onClick={() => {
              play8BitSound('stomp');
              logout();
            }}
            title="Log Out & Return to Landing Page"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="sp-main-container">
        {/* ── Student Profile Hero Banner (Player Status Card) ── */}
        <section className="sp-profile-banner sp-mario-card">
          <div className="sp-profile-left">
            <div className="sp-avatar-wrap">
              <img
                src={student.avatarUrl}
                alt={displayName}
                className="sp-avatar"
              />
              <div className="sp-level-badge mario-lvl-badge">LVL {student.level}</div>
            </div>

            <div className="sp-profile-info">
              <div className="sp-name-row">
                <h1 className="sp-student-name mario-arcade-font">{displayName}</h1>
                <span className="sp-grade-pill mario-pill-gold">GRADE {student.overallGrade} ({student.overallScore}%)</span>
                <span className="sp-rank-pill mario-pill-cyan">{student.rankTitle}</span>
              </div>
              <div className="sp-meta-row">
                <span>{displayEmail}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Flame size={15} />
                  <strong>{student.streakDays}-Day Learning Streak</strong>
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="sp-live-pulse" />
                  Live Aer Simulation Active
                </span>
              </div>
            </div>
          </div>

          <div className="sp-profile-actions">
            {/* Diploma Graduation Status Button */}
            <button
              type="button"
              className={`sp-cert-banner-btn mario-btn ${graduation.isGraduated ? 'mario-btn-gold' : 'mario-btn-locked'}`}
              onClick={handleOpenCertificate}
              title={
                graduation.isGraduated
                  ? 'View & Export Official Diploma'
                  : 'Complete Beginner, Intermediate, and Advanced courses to unlock diploma'
              }
            >
              {graduation.isGraduated ? (
                <>
                  <Award size={16} className="text-amber-300" />
                  <span>Official Diploma: READY ★</span>
                  <span className="sp-cert-pill-verified">Conferred</span>
                </>
              ) : (
                <>
                  <Lock size={15} className="text-amber-400" />
                  <span>Diploma Locked</span>
                  <span className="sp-cert-pill-locked">
                    {graduation.beginner.isComplete && graduation.intermediate.isComplete
                      ? 'Tier 3 Pending'
                      : graduation.beginner.isComplete
                      ? 'Tier 2 Pending'
                      : 'Tier 1 Pending'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              className="sp-continue-btn mario-btn mario-btn-green"
              onClick={() => {
                play8BitSound('powerup');
                onLaunchIDE();
              }}
            >
              <Play size={15} fill="currentColor" />
              <span>Resume Workbench</span>
            </button>

            <button
              type="button"
              className="sp-outline-btn mario-btn mario-btn-dark"
              onClick={() => {
                play8BitSound('jump');
                onNavigateLearn();
              }}
            >
              <BookOpen size={15} />
              <span>Skill Tree &amp; Map</span>
            </button>
          </div>
        </section>

        {/* ── 8-Bit Arcade Tab Navigation ── */}
        <div className="sp-tabs-nav mario-tabs-strip">
          <button
            type="button"
            className={`sp-tab-btn mario-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              play8BitSound('coin');
              setActiveTab('overview');
            }}
          >
            [1] OVERVIEW &amp; TIERS
          </button>
          <button
            type="button"
            className={`sp-tab-btn mario-tab ${activeTab === 'curriculum' ? 'active' : ''}`}
            onClick={() => {
              play8BitSound('coin');
              setActiveTab('curriculum');
            }}
          >
            [2] SCORES &amp; TOPICS ({student.topics.length})
          </button>
          <button
            type="button"
            className={`sp-tab-btn mario-tab ${activeTab === 'circuits' ? 'active' : ''}`}
            onClick={() => {
              play8BitSound('coin');
              setActiveTab('circuits');
            }}
          >
            [3] CIRCUIT PORTFOLIO ({student.circuits.length})
          </button>
          <button
            type="button"
            className={`sp-tab-btn mario-tab ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => {
              play8BitSound('coin');
              setActiveTab('feedback');
            }}
          >
            [4] INSTRUCTOR &amp; AI NOTES
          </button>
          <button
            type="button"
            className={`sp-tab-btn mario-tab ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => {
              play8BitSound('coin');
              setActiveTab('credentials');
            }}
          >
            [5] 🎓 DIPLOMA {graduation.isGraduated ? '★' : '🔒'}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB 1: OVERVIEW & DIAGNOSTICS
            ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="sp-tab-content">
            {/* ── THE 3 COURSE TIERS GRADUATION QUEST BOARD ── */}
            <div className="sp-graduation-board-card mario-card-frame">
              <div className="sp-grad-board-header">
                <div className="flex items-center gap-3">
                  <img src="/mario/Castle.png" alt="Castle" className="sp-castle-icon" />
                  <div>
                    <div className="sp-grad-tag mario-arcade-font">QUALUTION DEGREE REQUIREMENTS</div>
                    <h2 className="sp-grad-title mario-arcade-font">3-TIER QUANTUM GRADUATION QUEST</h2>
                  </div>
                </div>

                <div className="sp-grad-header-right">
                  {/* Simulation Demo Toggle for Testing */}
                  <button
                    type="button"
                    className="sp-demo-sim-btn mario-btn"
                    onClick={toggleSimulateGraduation}
                    title="Toggle simulated full course completion for demonstration"
                  >
                    <Sparkles size={13} />
                    <span>{isSimulationActive ? 'Reset Simulation' : '🧪 Demo: Complete All 3 Tiers'}</span>
                  </button>
                </div>
              </div>

              {/* 3 Tier Cards Grid: Beginner, Intermediate, Advanced */}
              <div className="sp-tiers-grid">
                {COURSE_TIERS.map((tier) => {
                  const trackStat =
                    tier.id === 'beginner'
                      ? graduation.beginner
                      : tier.id === 'intermediate'
                      ? graduation.intermediate
                      : graduation.advanced;

                  const isComplete = trackStat.isComplete;
                  const pct = Math.round((trackStat.completedModules / trackStat.totalModules) * 100);

                  return (
                    <div
                      key={tier.id}
                      className={`sp-tier-card ${isComplete ? 'cleared' : trackStat.completedModules > 0 ? 'active' : 'locked'}`}
                      style={{ borderColor: tier.accentColor }}
                    >
                      <div className="sp-tier-card-head">
                        <div className="flex items-center gap-2.5">
                          <img src={tier.iconSrc} alt="Icon" className="sp-tier-icon" />
                          <div>
                            <span className="sp-tier-world-label mario-arcade-font" style={{ color: tier.accentColor }}>
                              WORLD {tier.trackNum}
                            </span>
                            <h3 className="sp-tier-title">{tier.badgeTitle}</h3>
                          </div>
                        </div>

                        <span className={`sp-tier-status-pill ${isComplete ? 'cleared' : 'pending'}`}>
                          {isComplete ? 'CLEARED ★' : `${trackStat.completedModules}/${trackStat.totalModules}`}
                        </span>
                      </div>

                      <p className="sp-tier-desc">{tier.subtitle}</p>

                      {/* Progress bar */}
                      <div className="sp-tier-progress-track">
                        <div
                          className="sp-tier-progress-fill"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: tier.accentColor,
                            boxShadow: `0 0 10px ${tier.accentColor}`,
                          }}
                        />
                      </div>

                      {/* Module checklist */}
                      <div className="sp-tier-modules-list">
                        {tier.modules.map((m) => {
                          const mDone = isComplete || completedLessons.includes(m.id) || isSimulationActive;
                          return (
                            <div key={m.id} className={`sp-tier-module-item ${mDone ? 'done' : 'undone'}`}>
                              <span className="module-status-icon">
                                {mDone ? <Check size={12} color="#44d62c" /> : <Lock size={11} color="#94a3b8" />}
                              </span>
                              <span className="module-num">{m.num}</span>
                              <span className="module-title">{m.title}</span>
                              <span className="module-xp">+{m.xp}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="sp-tier-card-foot">
                        <button
                          type="button"
                          className="sp-tier-launch-btn mario-btn"
                          onClick={() => {
                            play8BitSound('jump');
                            onNavigateLearn();
                          }}
                        >
                          <span>{isComplete ? 'Review Track' : 'Launch Level'}</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Status Banner: Locked vs Unlocked ── */}
              {graduation.isGraduated ? (
                <div className="sp-grad-status-banner unlocked">
                  <div className="flex items-center gap-3">
                    <img src="/mario/Starman.png" alt="Star" className="sp-grad-star-shine" />
                    <div>
                      <div className="sp-banner-headline mario-arcade-font">ALL 3 COURSE TIERS COMPLETED — 100% GRADUATED!</div>
                      <p className="sp-banner-sub">
                        Congratulations {displayName}! You have mastered Beginner Foundations, Intermediate Circuits, and Advanced Supremacy. Your official cryptographic diploma is ready.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="sp-claim-cert-btn mario-btn mario-btn-gold"
                    onClick={handleOpenCertificate}
                  >
                    <Award size={16} />
                    <span>View &amp; Print Official Diploma</span>
                  </button>
                </div>
              ) : (
                <div className="sp-grad-status-banner locked">
                  <div className="flex items-center gap-3">
                    <div className="sp-locked-shield-icon">
                      <Lock size={20} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="sp-banner-headline mario-arcade-font text-amber-400">
                        OFFICIAL CERTIFICATE LOCKED 🔒
                      </div>
                      <p className="sp-banner-sub">
                        To earn your verified Qualution Quantum Computing Diploma, you must complete the entire curriculum across <strong>Beginner</strong>, <strong>Intermediate</strong>, and <strong>Advanced</strong> courses.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="sp-continue-btn mario-btn mario-btn-amber"
                    onClick={() => {
                      play8BitSound('jump');
                      onNavigateLearn();
                    }}
                  >
                    <span>Continue Incomplete Course</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* KPI Metrics */}
            <div className="sp-kpi-grid">
              <div className="sp-kpi-card mario-card">
                <span className="sp-kpi-label">Overall Mastery Score</span>
                <div className="sp-kpi-value text-sky-400">{student.overallScore}%</div>
                <div className="sp-kpi-hint">Cohort Ranking: Top 10%</div>
              </div>

              <div className="sp-kpi-card mario-card">
                <span className="sp-kpi-label">Curriculum Progress</span>
                <div className="sp-kpi-value text-emerald-400">{graduation.completionPercentage}%</div>
                <div className="sp-kpi-hint">{graduation.totalCompleted} of {graduation.totalRequired} Modules Completed</div>
              </div>

              <div className="sp-kpi-card mario-card">
                <span className="sp-kpi-label">Circuits Simulated</span>
                <div className="sp-kpi-value text-purple-400">42 Circuits</div>
                <div className="sp-kpi-hint">Over 24,000 Total Shots</div>
              </div>

              <div className="sp-kpi-card mario-card">
                <span className="sp-kpi-label">Erwin AI Interceptions</span>
                <div className="sp-kpi-value text-amber-400">3 Resolved</div>
                <div className="sp-kpi-hint">Zero active fallacies</div>
              </div>
            </div>

            {/* Currently Working On Callout */}
            <div className="sp-active-task-card mario-card">
              <div className="sp-task-icon-wrap">
                <Zap size={22} />
              </div>
              <div className="sp-task-body">
                <div className="sp-task-tag mario-arcade-font">CURRENT ACTIVE ASSIGNMENT</div>
                <h3 className="sp-task-title">Grover's Search Algorithm: 2-Qubit Oracle Synthesis</h3>
                <p className="sp-task-desc">
                  You are currently implementing phase kickback using an ancilla qubit to invert the |11⟩ amplitude. Your teacher Prof. Katherine Vance is monitoring live progress.
                </p>
                <div className="sp-task-progress-row">
                  <div className="sp-track-outer">
                    <div className="sp-track-inner" style={{ width: '78%' }} />
                  </div>
                  <span className="text-xs font-bold text-sky-400">78% Complete</span>
                </div>
              </div>
              <button
                type="button"
                className="sp-task-cta mario-btn mario-btn-cyan"
                onClick={() => {
                  play8BitSound('powerup');
                  onLaunchIDE();
                }}
              >
                <span>Continue Circuit</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Concept Understanding vs Circuit Application */}
            <div className="sp-card mario-card">
              <div className="sp-card-header">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-purple-400" />
                  <h3 className="sp-card-title">Concept Understanding vs. Circuit Application</h3>
                </div>
                <span className="text-xs text-slate-400">Automated AI Diagnostic Radar</span>
              </div>

              <div className="sp-concept-bars-grid">
                <div className="sp-concept-item">
                  <div className="sp-concept-top">
                    <span className="name">Theoretical Understanding</span>
                    <strong className="score text-cyan-400">{student.theoryUnderstandingScore}%</strong>
                  </div>
                  <div className="sp-bar-track">
                    <div
                      className="sp-bar-fill cyan"
                      style={{ width: `${student.theoryUnderstandingScore}%` }}
                    />
                  </div>
                  <p className="sp-concept-sub">
                    Mastery of Dirac bra-ket notation, superposition mathematics, and unitary matrices.
                  </p>
                </div>

                <div className="sp-concept-item">
                  <div className="sp-concept-top">
                    <span className="name">Circuit Synthesis &amp; Application</span>
                    <strong className="score text-emerald-400">{student.circuitApplicationScore}%</strong>
                  </div>
                  <div className="sp-bar-track">
                    <div
                      className="sp-bar-fill emerald"
                      style={{ width: `${student.circuitApplicationScore}%` }}
                    />
                  </div>
                  <p className="sp-concept-sub">
                    Putting gates on registers, connecting CX control/target wires, and verifying state vectors.
                  </p>
                </div>

                <div className="sp-concept-item">
                  <div className="sp-concept-top">
                    <span className="name">Error Debugging &amp; Optimization</span>
                    <strong className="score text-amber-400">{student.errorDebuggingScore}%</strong>
                  </div>
                  <div className="sp-bar-track">
                    <div
                      className="sp-bar-fill amber"
                      style={{ width: `${student.errorDebuggingScore}%` }}
                    />
                  </div>
                  <p className="sp-concept-sub">
                    Identifying decoherence, eliminating redundant gates, and correcting measurement order.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Badges / Achievements */}
            <div className="sp-card mario-card">
              <div className="sp-card-header">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  <h3 className="sp-card-title">Earned Quantum Badges &amp; Credentials</h3>
                </div>
              </div>

              <div className="sp-badges-grid">
                <div className="sp-badge-card mario-badge-frame">
                  <div className="sp-badge-icon amber">
                    <Sparkles size={20} />
                  </div>
                  <div className="sp-badge-name">Bell Pair Pioneer</div>
                  <div className="sp-badge-desc">Generated and verified all 4 Bell states with &gt;99% fidelity.</div>
                </div>

                <div className="sp-badge-card mario-badge-frame">
                  <div className="sp-badge-icon cyan">
                    <Cpu size={20} />
                  </div>
                  <div className="sp-badge-name">Hadamard Interference</div>
                  <div className="sp-badge-desc">Proved H² = I with destructive interference on |1⟩.</div>
                </div>

                <div className="sp-badge-card mario-badge-frame">
                  <div className="sp-badge-icon purple">
                    <Layers size={20} />
                  </div>
                  <div className="sp-badge-name">Quantum Teleporter</div>
                  <div className="sp-badge-desc">Executed non-local teleportation protocol with classical feed-forward.</div>
                </div>

                <div className="sp-badge-card mario-badge-frame">
                  <div className="sp-badge-icon emerald">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="sp-badge-name">Fallacy Destroyer</div>
                  <div className="sp-badge-desc">Corrected 5 cognitive misconceptions flagged by Erwin AI.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 2: SCORES & TOPICS COVERED
            ══════════════════════════════════════════════════════ */}
        {activeTab === 'curriculum' && (
          <div className="sp-tab-content">
            <div className="sp-card mario-card">
              <div className="sp-card-header">
                <div>
                  <h3 className="sp-card-title">Completed Topics &amp; Assessment Scores</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Verified assessment outcomes, quiz records, and hands-on circuit submissions.
                  </p>
                </div>
                <button
                  type="button"
                  className="sp-outline-btn sm mario-btn"
                  onClick={() => {
                    play8BitSound('jump');
                    onNavigateLearn();
                  }}
                >
                  <BookOpen size={14} />
                  <span>View Full Curriculum Map</span>
                </button>
              </div>

              <div className="sp-topics-list">
                {student.topics.map((topic, idx) => (
                  <div key={topic.topicId} className="sp-topic-item mario-topic-row">
                    <div className="sp-topic-num">{idx + 1}</div>
                    
                    <div className="sp-topic-main">
                      <div className="sp-topic-title-row">
                        <span className="sp-topic-name">{topic.topicName}</span>
                        <span className="sp-cat-tag">{topic.category}</span>
                        <span className={`sp-status-tag ${topic.status}`}>
                          {topic.status === 'completed' ? '✓ Mastered' : '● In Progress'}
                        </span>
                      </div>

                      {topic.notes && (
                        <div className="sp-topic-note">
                          <strong>Diagnostic note:</strong> {topic.notes}
                        </div>
                      )}

                      <div className="sp-topic-stats-row">
                        <span>Score: <strong className="text-white">{topic.score}%</strong></span>
                        <span>•</span>
                        <span>Theory: <strong>{topic.theoryMastery}%</strong></span>
                        <span>•</span>
                        <span>Circuit Application: <strong>{topic.circuitApplication}%</strong></span>
                        <span>•</span>
                        <span>{topic.circuitsSubmitted} Circuits Built</span>
                        <span>•</span>
                        <span>{topic.timeSpentMinutes} mins</span>
                      </div>
                    </div>

                    <div className="sp-topic-score-badge">
                      <span className="score-num">{topic.score}%</span>
                      <span className="score-sub">
                        {topic.score >= 90 ? 'Grade A' : topic.score >= 80 ? 'Grade B' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 3: MY CIRCUIT PORTFOLIO
            ══════════════════════════════════════════════════════ */}
        {activeTab === 'circuits' && (
          <div className="sp-tab-content">
            <div className="sp-card mario-card">
              <div className="sp-card-header">
                <div>
                  <h3 className="sp-card-title">Saved Quantum Circuits &amp; Submissions</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your simulated circuits, gate schedules, and instructor-reviewed algorithms.
                  </p>
                </div>
                <button
                  type="button"
                  className="sp-continue-btn sm mario-btn mario-btn-green"
                  onClick={() => {
                    play8BitSound('powerup');
                    onLaunchIDE();
                  }}
                >
                  <Cpu size={14} />
                  <span>Build New Circuit in Studio</span>
                </button>
              </div>

              <div className="sp-circuits-grid">
                {student.circuits.map((circ) => (
                  <div key={circ.id} className="sp-circuit-card mario-card">
                    <div className="sp-circuit-head">
                      <div>
                        <h4 className="sp-circuit-name">{circ.circuitName}</h4>
                        <div className="sp-circuit-meta">
                          {circ.qubitCount} Qubits • {circ.gateCount} Gates • {circ.shotsSimulated} Shots
                        </div>
                      </div>
                      <span className="sp-fidelity-badge">
                        {circ.stateFidelity}% Fidelity
                      </span>
                    </div>

                    <pre className="sp-code-block">
                      <code>{circ.codeSnippet}</code>
                    </pre>

                    {circ.teacherFeedback && (
                      <div className="sp-feedback-callout">
                        <MessageSquare size={14} className="text-sky-400 flex-shrink-0" />
                        <div>
                          <strong>Instructor Note:</strong> {circ.teacherFeedback}
                        </div>
                      </div>
                    )}

                    <div className="sp-circuit-foot">
                      <span className="text-xs text-slate-500">Submitted: {circ.submittedAt}</span>
                      <button
                        type="button"
                        className="sp-load-btn mario-btn"
                        onClick={() => {
                          play8BitSound('powerup');
                          onLaunchIDE(circ.codeSnippet);
                        }}
                      >
                        <span>Open in Studio</span>
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 4: INSTRUCTOR FEEDBACK & AI NOTES
            ══════════════════════════════════════════════════════ */}
        {activeTab === 'feedback' && (
          <div className="sp-tab-content">
            <div className="sp-card mario-card">
              <div className="sp-card-header">
                <div>
                  <h3 className="sp-card-title">Instructor Communications</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Direct messages and tailored assignments from Prof. Katherine Vance.
                  </p>
                </div>
              </div>

              <div className="sp-feedback-thread">
                <div className="sp-message-card mario-msg-card">
                  <div className="sp-message-head">
                    <div className="flex items-center gap-2">
                      <span className="sp-teacher-badge">Instructor</span>
                      <strong>Prof. Katherine Vance</strong>
                    </div>
                    <span className="text-xs text-slate-500">Yesterday at 17:15 PM</span>
                  </div>
                  <p className="sp-message-body">
                    {'Outstanding work on the Bell State challenge, Aarav! Your measurement histogram showed clean 50/50 distribution with zero classical crosstalk. For your Grover 2-qubit assignment today, pay close attention to the diffusion operator inversion about the mean: remember that 2|ψ⟩⟨ψ| - I can be synthesized using H, X, CZ, X, H gates.'}
                  </p>
                </div>

                <div className="sp-message-card ai-card mario-msg-card">
                  <div className="sp-message-head">
                    <div className="flex items-center gap-2">
                      <span className="sp-ai-badge">Erwin AI Companion</span>
                      <strong>Cognitive Diagnostic Log</strong>
                    </div>
                    <span className="text-xs text-slate-500">30 mins ago</span>
                  </div>
                  <p className="sp-message-body">
                    {'Cognitive Gap Intercepted: When you placed the CZ gate on qubits [0, 1], your target state |11⟩ acquired a -1 phase factor, which is exactly correct! Keep going to complete the diffusion step.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 5: OFFICIAL CERTIFICATE & CREDENTIALS
            ══════════════════════════════════════════════════════ */}
        {activeTab === 'credentials' && (
          <div className="sp-tab-content">
            {graduation.isGraduated ? (
              /* Unlocked State: Conferred Official Diploma */
              <div>
                <div className="sp-credentials-header-banner mario-card-frame">
                  <div>
                    <div className="sp-cert-tag mario-arcade-font">CONFERRED CREDENTIAL OF ACADEMIC EXCELLENCE</div>
                    <h2 className="text-2xl font-bold text-white mt-1 mario-arcade-font">Official Quantum Computing Diploma</h2>
                    <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                      Full curriculum completed across Beginner, Intermediate, and Advanced tiers. Cryptographically stamped and verified against the Qualution Genesis Key.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="sp-claim-cert-btn mario-btn mario-btn-gold"
                      onClick={() => setIsCertModalOpen(true)}
                    >
                      <Sparkles size={16} />
                      <span>Re-Synthesize Diploma</span>
                    </button>
                    <button
                      type="button"
                      className="sp-demo-sim-btn mario-btn"
                      onClick={toggleSimulateGraduation}
                      title="Reset simulation to test locked state"
                    >
                      <span>Reset Demo</span>
                    </button>
                  </div>
                </div>

                {userCert && (
                  <div className="sp-cert-display-wrapper">
                    <QuantumCertificateView
                      certificate={userCert}
                      showActions={true}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Locked State: Diploma Vault */
              <div className="sp-locked-vault-wrapper mario-card-frame">
                <div className="sp-locked-vault-header">
                  <div className="sp-locked-vault-icon-box">
                    <img src="/mario/MysteryBlock.png" alt="?" className="sp-vault-qblock" />
                    <div className="sp-vault-lock-badge">
                      <Lock size={22} className="text-amber-400" />
                    </div>
                  </div>

                  <div className="sp-locked-vault-copy">
                    <div className="sp-cert-tag mario-arcade-font text-amber-400">
                      GRADUATION GATEWAY · DIPLOMA LOCKED
                    </div>
                    <h2 className="sp-vault-title mario-arcade-font">
                      QUALUTION CREDENTIAL VAULT (LOCKED)
                    </h2>
                    <p className="sp-vault-desc">
                      To prevent premature accreditation, official Qualution certificates are unlocked <strong>strictly after completing all 3 curriculum tiers</strong> (Beginner Foundations, Intermediate Algorithms, and Advanced Supremacy).
                    </p>
                  </div>
                </div>

                {/* 3-Tier Checklist Box */}
                <div className="sp-vault-tiers-status">
                  <h3 className="sp-vault-status-heading mario-arcade-font">
                    CURRICULUM COMPLETION AUDIT ({graduation.totalCompleted}/{graduation.totalRequired} MODULES COMPLETED)
                  </h3>

                  <div className="sp-vault-checklist-grid">
                    {/* Tier 1 */}
                    <div className={`sp-vault-tier-item ${graduation.beginner.isComplete ? 'cleared' : 'pending'}`}>
                      <div className="flex items-center justify-between">
                        <span className="tier-name mario-arcade-font">TIER 1: BEGINNER FOUNDATIONS</span>
                        <span className="tier-badge">
                          {graduation.beginner.isComplete ? '✓ COMPLETED' : `${graduation.beginner.completedModules}/${graduation.beginner.totalModules}`}
                        </span>
                      </div>
                      <p className="tier-topics">Classical vs Qubits, Pauli-X, Superposition, Born Rule</p>
                    </div>

                    {/* Tier 2 */}
                    <div className={`sp-vault-tier-item ${graduation.intermediate.isComplete ? 'cleared' : 'pending'}`}>
                      <div className="flex items-center justify-between">
                        <span className="tier-name mario-arcade-font">TIER 2: INTERMEDIATE ALGORITHMS</span>
                        <span className="tier-badge">
                          {graduation.intermediate.isComplete ? '✓ COMPLETED' : `${graduation.intermediate.completedModules}/${graduation.intermediate.totalModules}`}
                        </span>
                      </div>
                      <p className="tier-topics">Universal Gates (S/T), Depth Analysis, Bell Entanglement, Grover's Search</p>
                    </div>

                    {/* Tier 3 */}
                    <div className={`sp-vault-tier-item ${graduation.advanced.isComplete ? 'cleared' : 'pending'}`}>
                      <div className="flex items-center justify-between">
                        <span className="tier-name mario-arcade-font">TIER 3: ADVANCED SUPREMACY</span>
                        <span className="tier-badge">
                          {graduation.advanced.isComplete ? '✓ COMPLETED' : `${graduation.advanced.completedModules}/${graduation.advanced.totalModules}`}
                        </span>
                      </div>
                      <p className="tier-topics">VQE Energy Minimization, QAOA Optimization, QPE &amp; Shor's Factoring</p>
                    </div>
                  </div>
                </div>

                {/* Vault Action Buttons */}
                <div className="sp-vault-actions">
                  <button
                    type="button"
                    className="sp-vault-continue-btn mario-btn mario-btn-green"
                    onClick={() => {
                      play8BitSound('jump');
                      onNavigateLearn();
                    }}
                  >
                    <BookOpen size={16} />
                    <span>Go to Academy to Complete Courses</span>
                  </button>

                  <button
                    type="button"
                    className="sp-demo-sim-btn mario-btn mario-btn-amber"
                    onClick={toggleSimulateGraduation}
                    title="Simulate all courses complete to test certificate generation"
                  >
                    <Sparkles size={16} />
                    <span>Simulate 100% Graduation (Demo)</span>
                  </button>

                  <button
                    type="button"
                    className="sp-vault-locked-btn"
                    disabled
                    title="Locked until all 3 courses are finished"
                  >
                    <Lock size={15} />
                    <span>Diploma Locked</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Automated Quantum Certificate Synthesis Modal */}
      <CertificateGenerationModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        studentName={displayName}
        studentEmail={displayEmail}
        score={student.overallScore}
        grade={student.overallGrade}
        existingCertificate={userCert}
        onCertificateIssued={(cert) => setUserCert(cert)}
      />
    </div>
  );
};

export default StudentPortalPage;

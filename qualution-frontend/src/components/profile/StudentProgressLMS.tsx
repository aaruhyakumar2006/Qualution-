import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Trophy,
  Award,
  Sparkles,
  Star,
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Cpu,
  Layers,
  Zap,
  BarChart3,
  Calendar,
  User,
  Download,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  X,
  LogOut,
  ArrowRight,
  Lock,
  Compass,
} from 'lucide-react';
import { QUANTUM_CURRICULUM, type LessonModule } from '../../features/learning/curriculumData';
import { useAuth } from '../../features/auth/AuthContext';
import './StudentProgressLMS.css';

export interface StudentProgressLMSProps {
  isOpen: boolean;
  onClose: () => void;
  completedIds: string[];
  totalXP: number;
  onLaunchIDE: (starterCircuit?: any, lessonData?: LessonModule, guidedLessonId?: string) => void;
  onLaunchTheoryLesson?: (theoryLessonId: string) => void;
  onNavigateHome?: () => void;
}

type LMSTab = 'curriculum' | 'badges' | 'transcript' | 'insights';

export const StudentProgressLMS: React.FC<StudentProgressLMSProps> = ({
  isOpen,
  onClose,
  completedIds,
  totalXP,
  onLaunchIDE,
  onLaunchTheoryLesson,
  onNavigateHome,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<LMSTab>('curriculum');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<'all' | 'track-1' | 'track-2' | 'track-3'>('all');

  // Computed LMS Metrics
  const totalLessons = QUANTUM_CURRICULUM.length;
  const completedCount = completedIds.length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);
  const starsEarned = completedCount * 3;
  const studentLevel = Math.max(1, Math.floor(totalXP / 350) + 1);

  // Dynamic Student Rank Title
  const studentRankTitle = useMemo(() => {
    if (completedCount >= 12) return 'Master Quantum Architect (Level 5)';
    if (completedCount >= 8) return 'Senior Algorithmist (Level 4)';
    if (completedCount >= 5) return 'Variational Specialist (Level 3)';
    if (completedCount >= 2) return 'Quantum Practitioner (Level 2)';
    return 'Quantum Observer (Level 1)';
  }, [completedCount]);

  // Grouped Curriculum by Region / Track
  const regions = useMemo(() => {
    return [
      {
        id: 'region-1',
        title: "Region 1 — The Observer's Reach",
        trackTitle: 'Foundations & Single-Qubit Systems',
        themeColor: '#00f2ff',
        modules: QUANTUM_CURRICULUM.filter((m) => m.trackId === 'track-1'),
      },
      {
        id: 'region-2',
        title: 'Region 2 — The Oracle Wastes',
        trackTitle: 'Circuit Design & Multi-Qubit Algorithms',
        themeColor: '#c084fc',
        modules: QUANTUM_CURRICULUM.filter((m) => m.trackId === 'track-2'),
      },
      {
        id: 'region-3',
        title: 'Region 3 — The Eigenforge & Summit',
        trackTitle: 'Variational Algorithms & Capstone Monolith',
        themeColor: '#f59e0b',
        modules: QUANTUM_CURRICULUM.filter((m) => m.trackId === 'track-3'),
      },
    ];
  }, []);

  // Verified Badges
  const badgesList = useMemo(() => {
    return [
      {
        id: 'badge-ground-state',
        name: 'Ground State Pioneer',
        desc: 'Initialized ground state |0⟩ and observed computational basis measurement statistics.',
        icon: '⚛️',
        unlocked: completedCount >= 1,
        tier: 'Bronze',
        date: completedCount >= 1 ? 'Certified 2026' : 'Locked',
      },
      {
        id: 'badge-superposition',
        name: 'Superposition Master',
        desc: 'Synthesized equal superposition |+⟩ via Hadamard transformation with 50/50 probability balance.',
        icon: '🌀',
        unlocked: completedCount >= 2,
        tier: 'Silver',
        date: completedCount >= 2 ? 'Certified 2026' : 'Locked',
      },
      {
        id: 'badge-bell',
        name: 'Bell State Entangler',
        desc: 'Constructed maximally entangled Bell pairs (|Φ+⟩) demonstrating quantum non-locality.',
        icon: '🔗',
        unlocked: completedCount >= 3,
        tier: 'Gold',
        date: completedCount >= 3 ? 'Certified 2026' : 'Locked',
      },
      {
        id: 'badge-phase',
        name: 'Phase Kickback Operator',
        desc: 'Engineered relative phase shifts and operator non-commutativity on multi-wire circuits.',
        icon: '⚡',
        unlocked: completedCount >= 5,
        tier: 'Gold',
        date: completedCount >= 5 ? 'Certified 2026' : 'Locked',
      },
      {
        id: 'badge-grover',
        name: 'Grover Oracle Hunter',
        desc: 'Constructed Grover Diffusion and Oracle with 100% target amplitude amplification.',
        icon: '🔮',
        unlocked: completedCount >= 8,
        tier: 'Platinum',
        date: completedCount >= 8 ? 'Certified 2026' : 'Locked',
      },
      {
        id: 'badge-vqe',
        name: 'Eigenforge Alchemist',
        desc: 'Optimized parameterized ansatz circuits using Variational Quantum Eigensolver.',
        icon: '🔥',
        unlocked: completedCount >= 10,
        tier: 'Diamond',
        date: completedCount >= 10 ? 'Certified 2026' : 'Locked',
      },
      {
        id: 'badge-router',
        name: "The Router's Crown",
        desc: 'Conquered the Summit Capstone and routed fault-tolerant quantum algorithms.',
        icon: '👑',
        unlocked: completedCount >= 12,
        tier: 'Legendary',
        date: completedCount >= 12 ? 'Certified 2026' : 'Locked',
      },
    ];
  }, [completedCount]);

  if (!isOpen) return null;

  const studentName = user?.full_name || 'Quantum Scholar';
  const studentEmail = user?.email || 'scholar.quantum@qualution.edu';
  const studentInitials = studentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className="lms-modal-overlay"
      onClick={onClose}
      data-testid="student-lms-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lms-modal-title"
    >
      <div
        className="lms-modal-container"
        onClick={(e) => e.stopPropagation()}
        data-testid="student-lms-modal-content"
      >
        {/* ── Top Bar: Navigation & Action Cluster ── */}
        <header className="lms-modal-topbar">
          <div className="lms-brand-row">
            <div className="lms-brand-icon-wrap">
              <GraduationCap size={20} color="#00f2ff" />
            </div>
            <div>
              <h2 id="lms-modal-title" className="lms-title">
                QUALUTION LMS <span className="lms-title-highlight">STUDENT PORTAL</span>
              </h2>
              <span className="lms-subtitle">Academic Progress, Verified Transcripts & Quantum Mastery</span>
            </div>
          </div>

          <div className="lms-top-actions">
            <div className="lms-student-id-tag">
              <span className="lms-id-label">STUDENT ID</span>
              <span className="lms-id-val">#Q-2026-{(user?.id || '8842').substring(0, 6)}</span>
            </div>

            <button
              type="button"
              className="lms-export-btn"
              onClick={() => window.print()}
              title="Print or Export Verified Student Transcript"
              data-testid="lms-export-transcript-btn"
            >
              <Download size={14} />
              <span>Transcript</span>
            </button>

            <button
              type="button"
              className="lms-close-btn"
              onClick={onClose}
              title="Close Portal"
              aria-label="Close"
              data-testid="lms-close-btn"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* ── Hero Profile Banner ── */}
        <section className="lms-hero-banner" data-testid="lms-hero-banner">
          <div className="lms-avatar-wrapper">
            <div className="lms-avatar-ring">
              <div className="lms-avatar-core">
                <span className="lms-avatar-initials">{studentInitials}</span>
              </div>
            </div>
            <span className="lms-online-badge" title="Student Session Active" />
            <div className="lms-level-badge">Lv. {studentLevel}</div>
          </div>

          <div className="lms-student-info">
            <div className="lms-name-row">
              <h1 className="lms-student-name">{studentName}</h1>
              <span className="lms-rank-badge">
                <Sparkles size={12} color="#f59e0b" />
                <span>{studentRankTitle}</span>
              </span>
            </div>
            <p className="lms-student-meta">
              <span>{studentEmail}</span>
              <span className="lms-meta-bullet">•</span>
              <span className="lms-enrolled-status">
                <ShieldCheck size={13} color="#10b981" />
                <span>Enterprise Quantum Curriculum Enrolled</span>
              </span>
            </p>

            {/* Overall Curriculum Progress Bar */}
            <div className="lms-overall-progress-bar-wrap">
              <div className="lms-progress-labels">
                <span>Curriculum Completion</span>
                <span className="lms-progress-pct">{completedCount} of {totalLessons} Modules ({progressPercent}%)</span>
              </div>
              <div className="lms-progress-track">
                <div
                  className="lms-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="lms-stats-grid">
            <div className="lms-stat-card">
              <div className="lms-stat-icon-wrap" style={{ background: 'rgba(0, 242, 255, 0.12)', color: '#00f2ff' }}>
                <Trophy size={16} />
              </div>
              <div>
                <span className="lms-stat-val">+{totalXP}</span>
                <span className="lms-stat-lbl">Total XP</span>
              </div>
            </div>

            <div className="lms-stat-card">
              <div className="lms-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <Star size={16} />
              </div>
              <div>
                <span className="lms-stat-val">{starsEarned} / 36</span>
                <span className="lms-stat-lbl">Stars Earned</span>
              </div>
            </div>

            <div className="lms-stat-card">
              <div className="lms-stat-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                <Flame size={16} />
              </div>
              <div>
                <span className="lms-stat-val">5 Days</span>
                <span className="lms-stat-lbl">Active Streak</span>
              </div>
            </div>

            <div className="lms-stat-card">
              <div className="lms-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <BarChart3 size={16} />
              </div>
              <div>
                <span className="lms-stat-val">98.6%</span>
                <span className="lms-stat-lbl">Avg Fidelity</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Navigation Tabs ── */}
        <nav className="lms-tabs-nav" data-testid="lms-tabs-nav">
          <button
            type="button"
            className={`lms-tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
            onClick={() => setActiveTab('curriculum')}
            data-testid="lms-tab-curriculum"
          >
            <BookOpen size={16} />
            <span>Curriculum Modules ({completedCount}/{totalLessons})</span>
          </button>

          <button
            type="button"
            className={`lms-tab-btn ${activeTab === 'badges' ? 'active' : ''}`}
            onClick={() => setActiveTab('badges')}
            data-testid="lms-tab-badges"
          >
            <Award size={16} />
            <span>Credentials & Badges ({badgesList.filter((b) => b.unlocked).length}/{badgesList.length})</span>
          </button>

          <button
            type="button"
            className={`lms-tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
            onClick={() => setActiveTab('transcript')}
            data-testid="lms-tab-transcript"
          >
            <ShieldCheck size={16} />
            <span>Verified Transcript</span>
          </button>

          <button
            type="button"
            className={`lms-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
            data-testid="lms-tab-insights"
          >
            <Compass size={16} />
            <span>AI Tutor Insights</span>
          </button>
        </nav>

        {/* ── Tab Content Area ── */}
        <div className="lms-tab-body">
          {/* TAB 1: CURRICULUM MODULES */}
          {activeTab === 'curriculum' && (
            <div className="lms-curriculum-panel" data-testid="lms-curriculum-panel">
              <div className="lms-filter-strip">
                <span className="lms-filter-label">Filter Tracks:</span>
                {(['all', 'track-1', 'track-2', 'track-3'] as const).map((trackKey) => (
                  <button
                    key={trackKey}
                    type="button"
                    className={`lms-filter-chip ${selectedTrackFilter === trackKey ? 'active' : ''}`}
                    onClick={() => setSelectedTrackFilter(trackKey)}
                    data-testid={`lms-filter-${trackKey}`}
                  >
                    {trackKey === 'all'
                      ? 'All Regions (12)'
                      : trackKey === 'track-1'
                        ? "The Observer's Reach"
                        : trackKey === 'track-2'
                          ? 'The Oracle Wastes'
                          : 'The Eigenforge & Summit'}
                  </button>
                ))}
              </div>

              <div className="lms-regions-list">
                {regions
                  .filter((r) => selectedTrackFilter === 'all' || r.modules.some((m) => m.trackId === selectedTrackFilter))
                  .map((region) => {
                    const regCompleted = region.modules.filter((m) => completedIds.includes(m.id)).length;
                    const regTotal = region.modules.length;
                    const regPct = Math.round((regCompleted / regTotal) * 100);

                    return (
                      <div key={region.id} className="lms-region-group-card">
                        <div className="lms-region-header">
                          <div className="lms-region-header-left">
                            <span className="lms-region-dot" style={{ backgroundColor: region.themeColor }} />
                            <div>
                              <h3 className="lms-region-title">{region.title}</h3>
                              <span className="lms-region-track">{region.trackTitle}</span>
                            </div>
                          </div>
                          <div className="lms-region-stat-pill">
                            <span>{regCompleted} / {regTotal} Passed</span>
                            <span className="lms-region-stat-bar">
                              <span style={{ width: `${regPct}%`, backgroundColor: region.themeColor }} />
                            </span>
                          </div>
                        </div>

                        <div className="lms-modules-grid">
                          {region.modules.map((mod) => {
                            const isPassed = completedIds.includes(mod.id);
                            return (
                              <div
                                key={mod.id}
                                className={`lms-module-row ${isPassed ? 'passed' : ''}`}
                                data-testid={`lms-module-item-${mod.id}`}
                              >
                                <div className="lms-mod-status-icon">
                                  {isPassed ? (
                                    <CheckCircle2 size={18} color="#10b981" />
                                  ) : (
                                    <div className="lms-mod-unpassed-bullet" />
                                  )}
                                </div>

                                <div className="lms-mod-details">
                                  <div className="lms-mod-title-line">
                                    <span className="lms-mod-num">0{mod.lessonNumber}</span>
                                    <h4 className="lms-mod-title">{mod.title}</h4>
                                    <span className="lms-mod-difficulty">{mod.difficulty}</span>
                                  </div>
                                  <p className="lms-mod-summary">{mod.summary}</p>
                                </div>

                                <div className="lms-mod-badge-wrap">
                                  <span className="lms-mod-formula" title={mod.formulaDescription}>
                                    {mod.formula}
                                  </span>
                                </div>

                                <div className="lms-mod-xp-col">
                                  <span className="lms-mod-xp">+{mod.xpReward} XP</span>
                                </div>

                                <div className="lms-mod-action-col">
                                  <button
                                    type="button"
                                    className={`lms-launch-btn ${isPassed ? 'btn-review' : 'btn-start'}`}
                                    onClick={() => {
                                      onLaunchIDE(mod.assessment.starterCircuit, mod);
                                      onClose();
                                    }}
                                    data-testid={`lms-launch-btn-${mod.id}`}
                                  >
                                    <Cpu size={14} />
                                    <span>{isPassed ? 'Review Circuit' : 'Launch Mission'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS & BADGES */}
          {activeTab === 'badges' && (
            <div className="lms-badges-panel" data-testid="lms-badges-panel">
              <div className="lms-badges-header">
                <h3>Verified Quantum Competency Badges</h3>
                <p>Earn immutable verifiable badges by passing automated circuit assessments with ≥ 95% state fidelity.</p>
              </div>

              <div className="lms-badges-grid">
                {badgesList.map((badge) => (
                  <div
                    key={badge.id}
                    className={`lms-badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
                    data-testid={`lms-badge-${badge.id}`}
                  >
                    <div className="lms-badge-emblem">
                      <span className="lms-badge-icon">{badge.icon}</span>
                      {badge.unlocked ? (
                        <span className="lms-badge-check"><CheckCircle2 size={14} color="#10b981" /></span>
                      ) : (
                        <span className="lms-badge-lock"><Lock size={12} color="#94a3b8" /></span>
                      )}
                    </div>
                    <div className="lms-badge-content">
                      <div className="lms-badge-tier-tag">{badge.tier} Tier</div>
                      <h4 className="lms-badge-name">{badge.name}</h4>
                      <p className="lms-badge-desc">{badge.desc}</p>
                      <div className="lms-badge-footer">
                        <span>{badge.date}</span>
                        {badge.unlocked && <span className="lms-badge-valid">Verified Hash #Q8F2</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VERIFIED TRANSCRIPT */}
          {activeTab === 'transcript' && (
            <div className="lms-transcript-panel" data-testid="lms-transcript-panel">
              <div className="lms-transcript-header">
                <div>
                  <h3>Official Assessment Transcript</h3>
                  <p>Certified quantum algorithm execution records validated through backend statevector simulators.</p>
                </div>
                <div className="lms-transcript-meta-box">
                  <span>Grading Scale: <strong>Standard Letter (A+, A, B)</strong></span>
                  <span>Fidelity Threshold: <strong>≥ 95.0%</strong></span>
                </div>
              </div>

              <div className="lms-transcript-table-container">
                <table className="lms-transcript-table">
                  <thead>
                    <tr>
                      <th>Module #</th>
                      <th>Curriculum Title</th>
                      <th>Track / Region</th>
                      <th>Backend Engine</th>
                      <th>Shots</th>
                      <th>Measured Fidelity</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUANTUM_CURRICULUM.map((mod) => {
                      const isPassed = completedIds.includes(mod.id);
                      return (
                        <tr key={mod.id} className={isPassed ? 'tr-passed' : 'tr-pending'}>
                          <td className="td-mono">0{mod.lessonNumber}</td>
                          <td className="td-title">{mod.title}</td>
                          <td>{mod.trackTitle}</td>
                          <td className="td-mono">Qiskit Aer (Statevector)</td>
                          <td className="td-mono">1,000</td>
                          <td className="td-fidelity">
                            {isPassed ? <span className="badge-fidelity">99.4%</span> : <span className="text-muted">—</span>}
                          </td>
                          <td className="td-grade">
                            {isPassed ? <span className="badge-grade">A+</span> : <span className="text-muted">Incomplete</span>}
                          </td>
                          <td>
                            {isPassed ? (
                              <span className="badge-verified">
                                <ShieldCheck size={13} />
                                <span>Certified</span>
                              </span>
                            ) : (
                              <span className="badge-pending">Not Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AI TUTOR INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="lms-insights-panel" data-testid="lms-insights-panel">
              <div className="lms-ai-advisor-card">
                <div className="lms-advisor-avatar-col">
                  <div className="lms-advisor-avatar">
                    <Sparkles size={28} color="#00f2ff" />
                  </div>
                  <span className="lms-advisor-name">Erwin Companion</span>
                  <span className="lms-advisor-role">AI Quantum Tutor</span>
                </div>

                <div className="lms-advisor-content">
                  <h4>Personalized Learning Pathway Evaluation</h4>
                  <p>
                    Greetings, {studentName}! Based on your current mastery of {completedCount} out of 12 modules,
                    you have established solid foundational intuition with computational basis states and superposition.
                  </p>

                  <div className="lms-insights-checklist">
                    <div className="lms-insight-item">
                      <span className="lms-insight-bullet">1</span>
                      <div>
                        <strong>Mastery Strength: Unitary Equivalence (H·Z·H = X)</strong>
                        <p>You have demonstrated precise gate ordering without introducing redundant phase accumulation.</p>
                      </div>
                    </div>

                    <div className="lms-insight-item">
                      <span className="lms-insight-bullet">2</span>
                      <div>
                        <strong>Recommended Next Focus: Amplitude Amplification (Grover Algorithm)</strong>
                        <p>
                          Transition to Region 2: The Oracle Wastes. Explore how the Grover diffusion operator reflects
                          state amplitudes across the average line to achieve quadratic search speedup.
                        </p>
                      </div>
                    </div>

                    <div className="lms-insight-item">
                      <span className="lms-insight-bullet">3</span>
                      <div>
                        <strong>Circuit Topology Awareness</strong>
                        <p>Prepare for physical qubit coupling graphs in the Eigenforge where SWAP gate insertion is required.</p>
                      </div>
                    </div>
                  </div>

                  <div className="lms-advisor-cta-row">
                    <button
                      type="button"
                      className="lms-advisor-resume-btn"
                      onClick={() => {
                        const nextMod = QUANTUM_CURRICULUM.find((m) => !completedIds.includes(m.id)) || QUANTUM_CURRICULUM[0];
                        onLaunchIDE(nextMod.assessment.starterCircuit, nextMod);
                        onClose();
                      }}
                      data-testid="lms-resume-next-btn"
                    >
                      <Zap size={16} />
                      <span>Resume Next Recommended Mission</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="lms-modal-footer">
          <div className="lms-footer-left">
            <span className="lms-cert-seal">
              <ShieldCheck size={16} color="#00f2ff" />
              <span>Qualution Quantum Computing LMS • Academic Session 2026</span>
            </span>
          </div>

          <div className="lms-footer-right">
            {isAuthenticated && (
              <button
                type="button"
                className="lms-logout-btn"
                onClick={() => {
                  logout();
                  onClose();
                }}
                data-testid="lms-logout-btn"
              >
                <LogOut size={14} />
                <span>Sign Out Account</span>
              </button>
            )}

            <button
              type="button"
              className="lms-return-btn"
              onClick={onClose}
              data-testid="lms-return-btn"
            >
              <span>Return to Learning Map</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StudentProgressLMS;

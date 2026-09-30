import React, { useState } from 'react';
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
  Sun,
  Moon,
  MessageSquare,
  Zap,
  TrendingUp,
  FileCode,
  ShieldCheck,
  ExternalLink,
  Play,
  RotateCcw,
  Radio,
} from 'lucide-react';
import { MOCK_STUDENTS, type StudentProfile } from '../features/portals/portalMockData';
import { useTheme } from '../features/theme/ThemeContext';
import { useAuth } from '../features/auth/AuthContext';
import { QuantumCertificateView } from '../components/certificates/QuantumCertificateView';
import { CertificateGenerationModal } from '../components/certificates/CertificateGenerationModal';
import { getOrCreateStudentCertificate } from '../features/certificates/certificateService';
import type { QuantumCertificate } from '../features/certificates/certificateTypes';
import './StudentPortalPage.css';

export interface StudentPortalPageProps {
  onNavigateHome: () => void;
  onNavigateTeacherPortal: () => void;
  onNavigateCollab?: () => void;
  onLaunchIDE: (circuitCode?: string) => void;
  onNavigateLearn: () => void;
}

export const StudentPortalPage: React.FC<StudentPortalPageProps> = ({
  onNavigateHome,
  onNavigateTeacherPortal,
  onNavigateCollab,
  onLaunchIDE,
  onNavigateLearn,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  // Pick Aarav Sharma as the default student profile (or personalized with auth user)
  const [student, setStudent] = useState<StudentProfile>(MOCK_STUDENTS[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'circuits' | 'feedback' | 'credentials'>('overview');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const displayName = user?.full_name || student.fullName;
  const displayEmail = user?.email || student.email;

  const [userCert, setUserCert] = useState<QuantumCertificate | null>(() =>
    getOrCreateStudentCertificate(displayName, displayEmail, student.overallScore, student.overallGrade)
  );

  return (
    <div className="student-portal-root" data-theme={theme}>
      {/* Top Header */}
      <header className="sp-header">
        <div className="sp-header-left">
          <button type="button" className="sp-logo-btn" onClick={onNavigateHome}>
            <div className="sp-logo-icon">
              <Atom size={22} />
            </div>
            <div>
              <div className="sp-logo-title">QUALUTION</div>
              <div className="sp-logo-sub">Student Portal</div>
            </div>
          </button>
        </div>

        <div className="sp-header-right">
          {/* Quick Persona Switcher */}
          <div className="sp-role-switch-pill">
            <span className="sp-role-tag active">Student View</span>
            <button
              type="button"
              className="sp-role-switch-btn"
              onClick={onNavigateTeacherPortal}
              title="Switch to Teacher View"
            >
              Switch to Teacher View
            </button>
          </div>

          {onNavigateCollab && (
            <button
              type="button"
              className="sp-nav-btn secondary"
              onClick={onNavigateCollab}
              style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
              title="Join Collaborative Group Lab"
            >
              <Radio size={16} />
              <span>Collab Lab</span>
            </button>
          )}

          <button
            type="button"
            className="sp-nav-btn primary"
            onClick={() => onLaunchIDE()}
            title="Open Quantum Studio simulator"
          >
            <Cpu size={16} />
            <span>Launch Studio</span>
          </button>

          <button
            type="button"
            className="sp-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="sp-main-container">
        {/* Student Profile Card Banner */}
        <section className="sp-profile-banner">
          <div className="sp-profile-left">
            <div className="sp-avatar-wrap">
              <img
                src={student.avatarUrl}
                alt={displayName}
                className="sp-avatar"
              />
              <div className="sp-level-badge">Lvl {student.level}</div>
            </div>

            <div className="sp-profile-info">
              <div className="sp-name-row">
                <h1 className="sp-student-name">{displayName}</h1>
                <span className="sp-grade-pill">Grade {student.overallGrade} ({student.overallScore}%)</span>
                <span className="sp-rank-pill">{student.rankTitle}</span>
              </div>
              <div className="sp-meta-row">
                <span>{displayEmail}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Flame size={15} />
                  <strong>{student.streakDays}-Day Learning Streak</strong>
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">● Live Sensing Active</span>
              </div>
            </div>
          </div>

          <div className="sp-profile-actions">
            <button
              type="button"
              className="sp-cert-banner-btn"
              onClick={() => setIsCertModalOpen(true)}
              title="View & Export Official Certificate"
            >
              <Award size={16} className="text-amber-400" />
              <span>Official Certificate</span>
              <span className="sp-cert-pill-verified">Verified</span>
            </button>
            <button
              type="button"
              className="sp-continue-btn"
              onClick={() => onLaunchIDE()}
            >
              <Play size={16} fill="currentColor" />
              <span>Resume Studio Workbench</span>
            </button>
            <button
              type="button"
              className="sp-outline-btn"
              onClick={onNavigateLearn}
            >
              <BookOpen size={16} />
              <span>Skill Tree &amp; Map</span>
            </button>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="sp-tabs-nav">
          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview &amp; Diagnostics
          </button>
          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
            onClick={() => setActiveTab('curriculum')}
          >
            Scores &amp; Topics Covered ({student.topics.length})
          </button>
          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'circuits' ? 'active' : ''}`}
            onClick={() => setActiveTab('circuits')}
          >
            My Circuit Portfolio ({student.circuits.length})
          </button>
          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            Instructor Feedback &amp; AI Notes
          </button>
          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => setActiveTab('credentials')}
          >
            Official Certificate &amp; Credentials 🎓
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB 1: OVERVIEW & DIAGNOSTICS
            ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="sp-tab-content">
            {/* Automated Certificate Completion Banner Card */}
            <div className="sp-completion-cert-card">
              <div className="sp-cert-card-left">
                <div className="sp-cert-card-badge">
                  <Award size={24} className="text-amber-400" />
                </div>
                <div>
                  <div className="sp-cert-tag">ACADEMIC CREDENTIAL ELIGIBILITY</div>
                  <h3 className="sp-cert-title">Quantum Computing Curriculum — 100% Eligible! 🎓</h3>
                  <p className="sp-cert-desc">
                    You have satisfied all core requirements across Universal Gates, Grover's Amplitude Amplification, Bell State Entanglement, and Adaptive Simulation. Your official academic credential has been cryptographically minted.
                  </p>
                  <div className="sp-cert-meta">
                    <span>Serial: <strong>{userCert?.id}</strong></span>
                    <span>•</span>
                    <span>SHA-256: <code>{userCert?.verificationHash.slice(0, 14)}…</code></span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">● Tamper-Proof Ledger Verified</span>
                  </div>
                </div>
              </div>
              <div className="sp-cert-card-right">
                <button
                  type="button"
                  className="sp-claim-cert-btn"
                  onClick={() => setIsCertModalOpen(true)}
                >
                  <Sparkles size={16} />
                  <span>View &amp; Export Diploma</span>
                </button>
              </div>
            </div>
            {/* KPI Metrics */}
            <div className="sp-kpi-grid">
              <div className="sp-kpi-card">
                <span className="sp-kpi-label">Overall Mastery Score</span>
                <div className="sp-kpi-value text-sky-400">{student.overallScore}%</div>
                <div className="sp-kpi-hint">Cohort Ranking: Top 10%</div>
              </div>

              <div className="sp-kpi-card">
                <span className="sp-kpi-label">Curriculum Progress</span>
                <div className="sp-kpi-value text-emerald-400">{student.curriculumCompletionPercent}%</div>
                <div className="sp-kpi-hint">8 of 10 Modules Mastered</div>
              </div>

              <div className="sp-kpi-card">
                <span className="sp-kpi-label">Circuits Simulated</span>
                <div className="sp-kpi-value text-purple-400">42 Circuits</div>
                <div className="sp-kpi-hint">Over 24,000 Total Shots</div>
              </div>

              <div className="sp-kpi-card">
                <span className="sp-kpi-label">Erwin AI Interceptions</span>
                <div className="sp-kpi-value text-amber-400">3 Resolved</div>
                <div className="sp-kpi-hint">Zero active fallacies</div>
              </div>
            </div>

            {/* Currently Working On Callout */}
            <div className="sp-active-task-card">
              <div className="sp-task-icon-wrap">
                <Zap size={22} />
              </div>
              <div className="sp-task-body">
                <div className="sp-task-tag">CURRENT ACTIVE ASSIGNMENT</div>
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
                className="sp-task-cta"
                onClick={() => onLaunchIDE()}
              >
                <span>Continue Circuit</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Concept Understanding vs Circuit Application (The Core Requirement) */}
            <div className="sp-card">
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
            <div className="sp-card">
              <div className="sp-card-header">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  <h3 className="sp-card-title">Earned Quantum Badges &amp; Credentials</h3>
                </div>
              </div>

              <div className="sp-badges-grid">
                <div className="sp-badge-card">
                  <div className="sp-badge-icon amber">
                    <Sparkles size={20} />
                  </div>
                  <div className="sp-badge-name">Bell Pair Pioneer</div>
                  <div className="sp-badge-desc">Generated and verified all 4 Bell states with &gt;99% fidelity.</div>
                </div>

                <div className="sp-badge-card">
                  <div className="sp-badge-icon cyan">
                    <Cpu size={20} />
                  </div>
                  <div className="sp-badge-name">Hadamard Interference</div>
                  <div className="sp-badge-desc">Proved H² = I with destructive interference on |1⟩.</div>
                </div>

                <div className="sp-badge-card">
                  <div className="sp-badge-icon purple">
                    <Layers size={20} />
                  </div>
                  <div className="sp-badge-name">Quantum Teleporter</div>
                  <div className="sp-badge-desc">Executed non-local teleportation protocol with classical feed-forward.</div>
                </div>

                <div className="sp-badge-card">
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
            <div className="sp-card">
              <div className="sp-card-header">
                <div>
                  <h3 className="sp-card-title">Completed Topics &amp; Assessment Scores</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Verified assessment outcomes, quiz records, and hands-on circuit submissions.
                  </p>
                </div>
                <button
                  type="button"
                  className="sp-outline-btn sm"
                  onClick={onNavigateLearn}
                >
                  <BookOpen size={14} />
                  <span>View Full Curriculum Map</span>
                </button>
              </div>

              <div className="sp-topics-list">
                {student.topics.map((topic, idx) => (
                  <div key={topic.topicId} className="sp-topic-item">
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
            <div className="sp-card">
              <div className="sp-card-header">
                <div>
                  <h3 className="sp-card-title">Saved Quantum Circuits &amp; Submissions</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your simulated circuits, gate schedules, and instructor-reviewed algorithms.
                  </p>
                </div>
                <button
                  type="button"
                  className="sp-continue-btn sm"
                  onClick={() => onLaunchIDE()}
                >
                  <Cpu size={14} />
                  <span>Build New Circuit in Studio</span>
                </button>
              </div>

              <div className="sp-circuits-grid">
                {student.circuits.map((circ) => (
                  <div key={circ.id} className="sp-circuit-card">
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
                        className="sp-load-btn"
                        onClick={() => onLaunchIDE(circ.codeSnippet)}
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
            <div className="sp-card">
              <div className="sp-card-header">
                <div>
                  <h3 className="sp-card-title">Instructor Communications</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Direct messages and tailored assignments from Prof. Katherine Vance.
                  </p>
                </div>
              </div>

              <div className="sp-feedback-thread">
                <div className="sp-message-card">
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

                <div className="sp-message-card ai-card">
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
            <div className="sp-credentials-header-banner">
              <div>
                <div className="sp-cert-tag">CONFERRED CREDENTIAL OF ACHIEVEMENT</div>
                <h2 className="text-2xl font-bold text-white mt-1">Official Quantum Computing Diploma</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Cryptographically stamped, tamper-evident certificate conferred by Qualution Quantum Computing Academy and Research Laboratories.
                </p>
              </div>

              <button
                type="button"
                className="sp-claim-cert-btn"
                onClick={() => setIsCertModalOpen(true)}
              >
                <Sparkles size={16} />
                <span>Re-Synthesize Certificate</span>
              </button>
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

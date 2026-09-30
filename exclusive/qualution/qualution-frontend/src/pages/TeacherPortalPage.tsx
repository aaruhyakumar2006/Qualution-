import React, { useState } from 'react';
import {
  Users,
  Atom,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flame,
  Award,
  BookOpen,
  Cpu,
  Brain,
  MessageSquare,
  Send,
  Eye,
  X,
  ExternalLink,
  ChevronLeft,
  Sun,
  Moon,
  TrendingUp,
  Activity,
  Layers,
  FileText,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import {
  MOCK_STUDENTS,
  MOCK_COHORT_SUMMARY,
  type StudentProfile,
  type StudentTopicProgress,
} from '../features/portals/portalMockData';
import { useTheme } from '../features/theme/ThemeContext';
import { CertificateGenerationModal } from '../components/certificates/CertificateGenerationModal';
import { getOrCreateStudentCertificate } from '../features/certificates/certificateService';
import type { QuantumCertificate } from '../features/certificates/certificateTypes';
import './TeacherPortalPage.css';

export interface TeacherPortalPageProps {
  onNavigateHome: () => void;
  onNavigateStudentPortal: () => void;
  onNavigateCollab?: () => void;
  onLaunchIDE: () => void;
  onNavigateLearn: () => void;
}

export const TeacherPortalPage: React.FC<TeacherPortalPageProps> = ({
  onNavigateHome,
  onNavigateStudentPortal,
  onNavigateCollab,
  onLaunchIDE,
  onNavigateLearn,
}) => {
  const { theme, toggleTheme } = useTheme();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active-studio' | 'needs-assistance' | 'top'>('all');
  
  // Selected student for deep dive inspection
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(MOCK_STUDENTS[0]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTeacherCertModalOpen, setIsTeacherCertModalOpen] = useState(false);
  const [inspectingCert, setInspectingCert] = useState<QuantumCertificate | null>(null);
  
  // Teacher feedback message box state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Filter students
  const filteredStudents = MOCK_STUDENTS.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.currentActivityDescription.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active-studio') return student.currentStatus === 'active-studio';
    if (statusFilter === 'needs-assistance') return student.currentStatus === 'needs-assistance';
    if (statusFilter === 'top') return student.overallScore >= 90;
    return true;
  });

  const handleOpenReport = (student: StudentProfile) => {
    setSelectedStudent(student);
    setIsReportModalOpen(true);
    setFeedbackSent(false);
    setFeedbackText('');
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackText('');
    }, 2000);
  };

  return (
    <div className="teacher-portal-root" data-theme={theme}>
      {/* Top Header */}
      <header className="tp-header">
        <div className="tp-header-left">
          <button type="button" className="tp-logo-btn" onClick={onNavigateHome}>
            <div className="tp-logo-icon">
              <Atom size={22} />
            </div>
            <div>
              <div className="tp-logo-title">QUALUTION</div>
              <div className="tp-logo-sub">Instructor Studio</div>
            </div>
          </button>

          <div className="tp-cohort-badge">
            <span className="tp-badge-dot" />
            <span>{MOCK_COHORT_SUMMARY.courseCode}</span>
          </div>
        </div>

        <div className="tp-header-right">
          {/* Quick Persona Switcher */}
          <div className="tp-role-switch-pill">
            <span className="tp-role-tag active">Teacher View</span>
            <button
              type="button"
              className="tp-role-switch-btn"
              onClick={onNavigateStudentPortal}
              title="Switch to Student Portal"
            >
              Switch to Student View
            </button>
          </div>

          {onNavigateCollab && (
            <button
              type="button"
              className="tp-nav-btn secondary"
              onClick={onNavigateCollab}
              style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
              title="Open Collaborative Group Lab"
            >
              <Radio size={16} />
              <span>Collab Lab</span>
            </button>
          )}

          <button
            type="button"
            className="tp-nav-btn secondary"
            onClick={onLaunchIDE}
            title="Open Quantum Studio simulator"
          >
            <Cpu size={16} />
            <span>Launch Studio</span>
          </button>

          <button
            type="button"
            className="tp-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="tp-main-container">
        {/* Welcome & Cohort Title Banner */}
        <div className="tp-hero-banner">
          <div className="tp-hero-text">
            <div className="tp-hero-pill">
              <Sparkles size={14} />
              <span>Real-Time Cohort Diagnostics</span>
            </div>
            <h1 className="tp-hero-title">{MOCK_COHORT_SUMMARY.cohortName}</h1>
            <p className="tp-hero-sub">
              Instructor: <strong>{MOCK_COHORT_SUMMARY.instructorName}</strong> • Monitoring active student circuit execution, cognitive gap interception, and conceptual vs practical mastery.
            </p>
          </div>

          <div className="tp-hero-actions">
            <button
              type="button"
              className="tp-action-btn primary"
              onClick={() => handleOpenReport(MOCK_STUDENTS[0])}
            >
              <FileText size={16} />
              <span>Inspect Sample Student Report</span>
            </button>
            <button
              type="button"
              className="tp-action-btn secondary"
              onClick={onNavigateLearn}
            >
              <BookOpen size={16} />
              <span>Curriculum Syllabus</span>
            </button>
          </div>
        </div>

        {/* Top KPI Metrics Row */}
        <section className="tp-kpi-grid">
          <div className="tp-kpi-card">
            <div className="tp-kpi-header">
              <span className="tp-kpi-label">Total Enrolled</span>
              <div className="tp-kpi-icon-wrap cyan">
                <Users size={18} />
              </div>
            </div>
            <div className="tp-kpi-value">{MOCK_COHORT_SUMMARY.totalStudents}</div>
            <div className="tp-kpi-hint positive">
              <span>● 100% active this week</span>
            </div>
          </div>

          <div className="tp-kpi-card">
            <div className="tp-kpi-header">
              <span className="tp-kpi-label">Active Now in Studio</span>
              <div className="tp-kpi-icon-wrap emerald">
                <Activity size={18} />
              </div>
            </div>
            <div className="tp-kpi-value">
              <span className="tp-pulse-dot" />
              {MOCK_COHORT_SUMMARY.activeNowCount} Students
            </div>
            <div className="tp-kpi-hint">
              <span>Simulating quantum circuits live</span>
            </div>
          </div>

          <div className="tp-kpi-card">
            <div className="tp-kpi-header">
              <span className="tp-kpi-label">Cohort Average Score</span>
              <div className="tp-kpi-icon-wrap violet">
                <Award size={18} />
              </div>
            </div>
            <div className="tp-kpi-value">{MOCK_COHORT_SUMMARY.classAverageScore}%</div>
            <div className="tp-kpi-hint positive">
              <span>+4.2% higher vs last term</span>
            </div>
          </div>

          <div className="tp-kpi-card">
            <div className="tp-kpi-header">
              <span className="tp-kpi-label">Concept vs. Circuit Mastery</span>
              <div className="tp-kpi-icon-wrap amber">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="tp-dual-metrics">
              <div className="tp-dual-item">
                <span className="tp-dual-name">Theory</span>
                <span className="tp-dual-val">{MOCK_COHORT_SUMMARY.averageTheoryMastery}%</span>
              </div>
              <div className="tp-dual-sep">/</div>
              <div className="tp-dual-item">
                <span className="tp-dual-name">Circuit</span>
                <span className="tp-dual-val">{MOCK_COHORT_SUMMARY.averageCircuitApplication}%</span>
              </div>
            </div>
            <div className="tp-kpi-hint">
              <span>Theory slightly outpacing hardware wiring</span>
            </div>
          </div>
        </section>

        {/* Alert Callout for Teacher Attention */}
        <section className="tp-callout-card">
          <div className="tp-callout-icon">
            <ShieldAlert size={20} />
          </div>
          <div className="tp-callout-content">
            <div className="tp-callout-title">AI Cognitive Fallacy Warning Detected</div>
            <div className="tp-callout-text">
              Common fallacy intercepted across 3 students: <strong>"{MOCK_COHORT_SUMMARY.topFallacyInterception}"</strong>. Student Alex Chen currently needs assistance on Bell State phase parity check.
            </div>
          </div>
          <button
            type="button"
            className="tp-callout-btn"
            onClick={() => {
              const alex = MOCK_STUDENTS.find((s) => s.id === 'std-003');
              if (alex) handleOpenReport(alex);
            }}
          >
            Review Alex Chen's Circuit
          </button>
        </section>

        {/* Student Roster Section */}
        <section className="tp-roster-section">
          <div className="tp-roster-header">
            <div>
              <h2 className="tp-section-title">Enrolled Students &amp; Live Status</h2>
              <p className="tp-section-subtitle">
                Inspect detailed performance, real-time simulator activity, and concept vs. circuit application.
              </p>
            </div>

            {/* Filter and Search Controls */}
            <div className="tp-controls-bar">
              <div className="tp-search-box">
                <Search size={16} className="tp-search-icon" />
                <input
                  type="text"
                  placeholder="Search student name, email, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tp-search-input"
                />
              </div>

              <div className="tp-filter-tabs">
                <button
                  type="button"
                  className={`tp-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({MOCK_STUDENTS.length})
                </button>
                <button
                  type="button"
                  className={`tp-filter-btn ${statusFilter === 'active-studio' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('active-studio')}
                >
                  Live in Studio (3)
                </button>
                <button
                  type="button"
                  className={`tp-filter-btn ${statusFilter === 'needs-assistance' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('needs-assistance')}
                >
                  Needs Attention (1)
                </button>
                <button
                  type="button"
                  className={`tp-filter-btn ${statusFilter === 'top' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('top')}
                >
                  Top Performers (4)
                </button>
              </div>
            </div>
          </div>

          {/* Students Grid */}
          <div className="tp-students-grid">
            {filteredStudents.map((student) => {
              const isLive = student.currentStatus === 'active-studio';
              const needsHelp = student.currentStatus === 'needs-assistance';

              return (
                <div
                  key={student.id}
                  className={`tp-student-card ${needsHelp ? 'attention-glow' : ''}`}
                  onClick={() => handleOpenReport(student)}
                >
                  {/* Card Header */}
                  <div className="tp-student-card-head">
                    <img
                      src={student.avatarUrl}
                      alt={student.fullName}
                      className="tp-student-avatar"
                    />
                    <div className="tp-student-info">
                      <div className="tp-student-name-row">
                        <span className="tp-student-name">{student.fullName}</span>
                        <span className={`tp-grade-pill grade-${student.overallGrade.charAt(0).toLowerCase()}`}>
                          {student.overallGrade} ({student.overallScore}%)
                        </span>
                      </div>
                      <span className="tp-student-rank">{student.rankTitle}</span>
                    </div>
                  </div>

                  {/* Status & Live Activity */}
                  <div className="tp-student-status-box">
                    <div className="tp-status-line">
                      <span
                        className={`tp-status-dot ${
                          isLive ? 'live' : needsHelp ? 'warning' : 'neutral'
                        }`}
                      />
                      <span className="tp-status-text">
                        {isLive
                          ? 'Live in Quantum Studio'
                          : needsHelp
                          ? 'Needs Assistance'
                          : 'Theory Review'}
                      </span>
                      <span className="tp-last-active">{student.lastActive}</span>
                    </div>
                    <div className="tp-activity-desc">
                      {student.currentActivityDescription}
                    </div>
                  </div>

                  {/* Concept vs Circuit Progress Bars */}
                  <div className="tp-metric-bars-wrap">
                    <div className="tp-bar-item">
                      <div className="tp-bar-label-row">
                        <span>Theoretical Concepts</span>
                        <strong>{student.theoryUnderstandingScore}%</strong>
                      </div>
                      <div className="tp-bar-track">
                        <div
                          className="tp-bar-fill theory"
                          style={{ width: `${student.theoryUnderstandingScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="tp-bar-item">
                      <div className="tp-bar-label-row">
                        <span>Circuit Application</span>
                        <strong>{student.circuitApplicationScore}%</strong>
                      </div>
                      <div className="tp-bar-track">
                        <div
                          className="tp-bar-fill circuit"
                          style={{ width: `${student.circuitApplicationScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer & CTA */}
                  <div className="tp-student-card-foot">
                    <div className="tp-foot-stat">
                      <BookOpen size={14} />
                      <span>{student.curriculumCompletionPercent}% completed</span>
                    </div>
                    <button
                      type="button"
                      className="tp-view-report-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReport(student);
                      }}
                    >
                      <span>Full Report</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ═════════════════════════════════════════════════════════════
          STUDENT COMPREHENSIVE REPORT MODAL
          ═════════════════════════════════════════════════════════════ */}
      {isReportModalOpen && selectedStudent && (
        <div
          className="tp-modal-backdrop"
          onClick={() => setIsReportModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="tp-modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="tp-modal-header">
              <div className="tp-modal-student-profile">
                <img
                  src={selectedStudent.avatarUrl}
                  alt={selectedStudent.fullName}
                  className="tp-modal-avatar"
                />
                <div>
                  <div className="tp-modal-name-row">
                    <h2 className="tp-modal-name">{selectedStudent.fullName}</h2>
                    <span className={`tp-grade-pill grade-${selectedStudent.overallGrade.charAt(0).toLowerCase()}`}>
                      Grade {selectedStudent.overallGrade} · {selectedStudent.overallScore}%
                    </span>
                    <span className="tp-level-pill">Level {selectedStudent.level}</span>
                  </div>
                  <div className="tp-modal-email">
                    {selectedStudent.email} • {selectedStudent.rankTitle} • 🔥 {selectedStudent.streakDays}-Day Learning Streak
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="tp-modal-close-btn"
                onClick={() => setIsReportModalOpen(false)}
                aria-label="Close report"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="tp-modal-body">
              {/* Real-time Activity Card */}
              <div className="tp-report-card highlight">
                <div className="tp-report-card-title-row">
                  <div className="tp-card-title-left">
                    <Activity size={17} className="text-cyan-400" />
                    <span className="tp-card-title">Real-Time Studio Status</span>
                  </div>
                  <span className="tp-pulse-live-badge">Live Sensing Active</span>
                </div>
                <p className="tp-report-activity-text">
                  {selectedStudent.currentActivityDescription}
                </p>
                <div className="tp-stat-capsules">
                  <div className="tp-stat-capsule">
                    <span className="label">Curriculum Track:</span>
                    <span className="val">{selectedStudent.curriculumCompletionPercent}% Done</span>
                  </div>
                  <div className="tp-stat-capsule">
                    <span className="label">Last Active:</span>
                    <span className="val">{selectedStudent.lastActive}</span>
                  </div>
                  <div className="tp-stat-capsule">
                    <span className="label">Overall Status:</span>
                    <span className="val uppercase">{selectedStudent.currentStatus}</span>
                  </div>
                </div>
              </div>

              {/* Official Academic Credential & Certificate Card */}
              <div className="tp-report-card tp-cert-inspect-card" style={{
                background: 'linear-gradient(135deg, rgba(14, 32, 60, 0.9) 0%, rgba(8, 16, 32, 0.95) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Award size={22} className="text-amber-400" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.15em', color: '#f59e0b' }}>
                      AUTOMATED COURSE CREDENTIAL
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '0.15rem 0' }}>
                      Official Diploma: {selectedStudent.curriculumCompletionPercent >= 80 ? 'Conferred & Verified' : 'In Progress'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {selectedStudent.curriculumCompletionPercent >= 80 ? (
                        <span>
                          Serial: <strong style={{ color: '#38bdf8' }}>QL-QC-2026-8942-X7</strong> • Distinction: <span style={{ color: '#f59e0b', fontWeight: 600 }}>Summa Cum Laude</span>
                        </span>
                      ) : (
                        <span>Curriculum Progress: {selectedStudent.curriculumCompletionPercent}% (Threshold: 80%)</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: '1px solid rgba(254, 240, 138, 0.5)',
                    color: '#0f172a',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => {
                    const cert = getOrCreateStudentCertificate(
                      selectedStudent.fullName,
                      selectedStudent.email,
                      selectedStudent.overallScore,
                      selectedStudent.overallGrade
                    );
                    setInspectingCert(cert);
                    setIsTeacherCertModalOpen(true);
                  }}
                >
                  <Sparkles size={14} />
                  <span>Inspect Official Diploma 📜</span>
                </button>
              </div>

              {/* Theory vs Circuit Application Detailed Breakdown */}
              <div className="tp-report-card">
                <div className="tp-report-card-title-row">
                  <div className="tp-card-title-left">
                    <Brain size={17} className="text-purple-400" />
                    <span className="tp-card-title">Concept Understanding vs. Circuit Application</span>
                  </div>
                  <span className="tp-sub-badge">Weighted Diagnostic</span>
                </div>

                <div className="tp-breakdown-bars">
                  <div className="tp-breakdown-row">
                    <div className="tp-breakdown-info">
                      <span className="title">Theoretical Foundations (Dirac, Unitaries, Superposition)</span>
                      <span className="score text-cyan-400">{selectedStudent.theoryUnderstandingScore}%</span>
                    </div>
                    <div className="tp-track">
                      <div
                        className="tp-fill cyan"
                        style={{ width: `${selectedStudent.theoryUnderstandingScore}%` }}
                      />
                    </div>
                    <p className="tp-bar-desc">
                      Grasps mathematical linear combinations, probability amplitudes, and phase relationships.
                    </p>
                  </div>

                  <div className="tp-breakdown-row">
                    <div className="tp-breakdown-info">
                      <span className="title">Circuit Application &amp; Synthesis (Qubit Wires, CX Placement)</span>
                      <span className="score text-emerald-400">{selectedStudent.circuitApplicationScore}%</span>
                    </div>
                    <div className="tp-track">
                      <div
                        className="tp-fill emerald"
                        style={{ width: `${selectedStudent.circuitApplicationScore}%` }}
                      />
                    </div>
                    <p className="tp-bar-desc">
                      Ability to place quantum gates on multi-qubit registers, apply oracles, and execute Bell pairs.
                    </p>
                  </div>

                  <div className="tp-breakdown-row">
                    <div className="tp-breakdown-info">
                      <span className="title">Error Debugging &amp; Gate Optimization</span>
                      <span className="score text-amber-400">{selectedStudent.errorDebuggingScore}%</span>
                    </div>
                    <div className="tp-track">
                      <div
                        className="tp-fill amber"
                        style={{ width: `${selectedStudent.errorDebuggingScore}%` }}
                      />
                    </div>
                    <p className="tp-bar-desc">
                      Fixes unnecessary gate depth, catches phase errors, and adapts before measurement collapse.
                    </p>
                  </div>
                </div>
              </div>

              {/* Topics Covered & Scores Table */}
              <div className="tp-report-card">
                <div className="tp-report-card-title-row">
                  <div className="tp-card-title-left">
                    <BookOpen size={17} className="text-sky-400" />
                    <span className="tp-card-title">Topic Coverage &amp; Assessment Scores</span>
                  </div>
                  <span className="tp-sub-badge">{selectedStudent.topics.length} Modules Tracked</span>
                </div>

                <div className="tp-table-wrap">
                  <table className="tp-topics-table">
                    <thead>
                      <tr>
                        <th>Topic Name</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Theory</th>
                        <th>Circuit</th>
                        <th>Circuits Built</th>
                        <th>Time Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.topics.map((t) => (
                        <tr key={t.topicId}>
                          <td className="font-semibold text-slate-100">
                            <div>{t.topicName}</div>
                            {t.notes && <span className="tp-table-note">{t.notes}</span>}
                          </td>
                          <td>
                            <span className="tp-cat-tag">{t.category}</span>
                          </td>
                          <td>
                            <span className={`tp-pill-status ${t.status}`}>
                              {t.status === 'completed' ? 'Completed' : 'In Progress'}
                            </span>
                          </td>
                          <td>
                            <strong className="text-white">{t.score}%</strong>
                          </td>
                          <td>{t.theoryMastery}%</td>
                          <td>{t.circuitApplication}%</td>
                          <td>{t.circuitsSubmitted} circuits</td>
                          <td>{t.timeSpentMinutes} mins</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cognitive Alerts & AI Diagnostics */}
              <div className="tp-report-card">
                <div className="tp-report-card-title-row">
                  <div className="tp-card-title-left">
                    <Sparkles size={17} className="text-amber-400" />
                    <span className="tp-card-title">Erwin AI Cognitive Diagnostics &amp; Misconception Log</span>
                  </div>
                </div>

                <div className="tp-alerts-list">
                  {selectedStudent.cognitiveAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`tp-alert-item ${alert.type} ${alert.resolved ? 'resolved' : ''}`}
                    >
                      <div className="tp-alert-item-head">
                        <div className="flex items-center gap-2">
                          {alert.type === 'warning' ? (
                            <AlertTriangle size={16} className="text-amber-400" />
                          ) : alert.type === 'success' ? (
                            <CheckCircle2 size={16} className="text-emerald-400" />
                          ) : (
                            <Clock size={16} className="text-sky-400" />
                          )}
                          <span className="font-semibold text-slate-100">{alert.title}</span>
                          <span className="text-xs text-slate-400">({alert.topic})</span>
                        </div>
                        <span className="text-xs text-slate-500">{alert.timestamp}</span>
                      </div>
                      <p className="tp-alert-desc">{alert.description}</p>
                      <div className="tp-alert-foot">
                        <span className={`tp-resolution-tag ${alert.resolved ? 'done' : 'pending'}`}>
                          {alert.resolved ? '✓ Misconception Cleared' : '⚠ Active Attention Required'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submitted Circuit Inspector */}
              <div className="tp-report-card">
                <div className="tp-report-card-title-row">
                  <div className="tp-card-title-left">
                    <Cpu size={17} className="text-cyan-400" />
                    <span className="tp-card-title">Latest Submitted Circuit &amp; QASM Inspection</span>
                  </div>
                </div>

                {selectedStudent.circuits.length > 0 ? (
                  <div className="tp-circuit-inspect-box">
                    <div className="tp-circuit-inspect-head">
                      <div>
                        <div className="font-bold text-slate-100">
                          {selectedStudent.circuits[0].circuitName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {selectedStudent.circuits[0].qubitCount} Qubits • {selectedStudent.circuits[0].gateCount} Gates • {selectedStudent.circuits[0].shotsSimulated} Shots • State Fidelity: {selectedStudent.circuits[0].stateFidelity}%
                        </div>
                      </div>
                      <span className={`tp-cert-badge ${selectedStudent.circuits[0].status}`}>
                        {selectedStudent.circuits[0].status === 'verified' ? 'Simulation Verified' : 'Review Pending'}
                      </span>
                    </div>

                    <pre className="tp-code-preview">
                      <code>{selectedStudent.circuits[0].codeSnippet}</code>
                    </pre>

                    {selectedStudent.circuits[0].teacherFeedback && (
                      <div className="tp-existing-feedback">
                        <strong>Previous Instructor Note:</strong> {selectedStudent.circuits[0].teacherFeedback}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No circuits submitted yet.</p>
                )}
              </div>

              {/* Direct Teacher Feedback Form */}
              <div className="tp-report-card feedback-card">
                <div className="tp-report-card-title-row">
                  <div className="tp-card-title-left">
                    <MessageSquare size={17} className="text-sky-400" />
                    <span className="tp-card-title">Send Instructor Feedback or Custom Assignment</span>
                  </div>
                </div>

                <div className="tp-feedback-form">
                  <textarea
                    rows={3}
                    placeholder={`Write tailored feedback for ${selectedStudent.fullName}... (e.g., "Great work on the Grover oracle! Notice how phase kickback inverted the target amplitude...")`}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="tp-feedback-input"
                  />

                  <div className="tp-feedback-actions">
                    {feedbackSent ? (
                      <div className="tp-feedback-success">
                        <CheckCircle2 size={16} />
                        <span>Feedback sent directly to {selectedStudent.fullName}'s Student Portal!</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="tp-send-feedback-btn"
                        onClick={handleSendFeedback}
                        disabled={!feedbackText.trim()}
                      >
                        <Send size={15} />
                        <span>Send Direct Note</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="tp-modal-footer">
              <button
                type="button"
                className="tp-modal-foot-btn close"
                onClick={() => setIsReportModalOpen(false)}
              >
                Close Report
              </button>
              <button
                type="button"
                className="tp-modal-foot-btn launch"
                onClick={() => {
                  setIsReportModalOpen(false);
                  onLaunchIDE();
                }}
              >
                <Cpu size={15} />
                <span>Open in Studio Simulator</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher View Certificate Modal */}
      {selectedStudent && (
        <CertificateGenerationModal
          isOpen={isTeacherCertModalOpen}
          onClose={() => setIsTeacherCertModalOpen(false)}
          studentName={selectedStudent.fullName}
          studentEmail={selectedStudent.email}
          score={selectedStudent.overallScore}
          grade={selectedStudent.overallGrade}
          existingCertificate={inspectingCert}
        />
      )}
    </div>
  );
};
export default TeacherPortalPage;

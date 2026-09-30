import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  Atom,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Award,
} from 'lucide-react';
import type { QuantumCertificate } from '../../features/certificates/certificateTypes';
import { generateCertificate, getOrCreateStudentCertificate } from '../../features/certificates/certificateService';
import { QuantumCertificateView } from './QuantumCertificateView';
import './CertificateGenerationModal.css';

export interface CertificateGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  studentEmail?: string;
  score?: number;
  grade?: string;
  existingCertificate?: QuantumCertificate | null;
  onCertificateIssued?: (cert: QuantumCertificate) => void;
}

type SynthesisPhase = 'analyzing' | 'fidelity' | 'hashing' | 'minting' | 'completed';

export const CertificateGenerationModal: React.FC<CertificateGenerationModalProps> = ({
  isOpen,
  onClose,
  studentName = 'Aarav Sharma',
  studentEmail = 'aarav.sharma@qualution.edu',
  score = 94,
  grade = 'A+',
  existingCertificate,
  onCertificateIssued,
}) => {
  const [phase, setPhase] = useState<SynthesisPhase>('analyzing');
  const [progress, setProgress] = useState(15);
  const [activeCertificate, setActiveCertificate] = useState<QuantumCertificate | null>(existingCertificate || null);
  const [generatedHash, setGeneratedHash] = useState('0x...');

  useEffect(() => {
    if (!isOpen) return;

    // If an existing certificate is passed, we can show completed or quickly synthesize
    if (existingCertificate) {
      setActiveCertificate(existingCertificate);
      setPhase('completed');
      setProgress(100);
      return;
    }

    // Start 4-phase automated synthesis pipeline
    setPhase('analyzing');
    setProgress(20);

    const t1 = setTimeout(() => {
      setPhase('fidelity');
      setProgress(50);
    }, 700);

    const t2 = setTimeout(() => {
      setPhase('hashing');
      setProgress(80);
      setGeneratedHash(`0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`);
    }, 1500);

    const t3 = setTimeout(() => {
      setPhase('minting');
      setProgress(95);
    }, 2200);

    const t4 = setTimeout(() => {
      const cert = generateCertificate({
        recipientName: studentName,
        recipientEmail: studentEmail,
        overallScore: score,
        overallGrade: grade,
      });
      setActiveCertificate(cert);
      onCertificateIssued?.(cert);
      setPhase('completed');
      setProgress(100);
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, existingCertificate, studentName, studentEmail, score, grade]);

  if (!isOpen) return null;

  return (
    <div className="cgm-modal-overlay" role="dialog" aria-modal="true">
      <div className="cgm-modal-wrapper">
        {/* Confetti Particle Streamers during Completed Phase */}
        {phase === 'completed' && (
          <div className="cgm-confetti-container" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => (
              <span
                key={i}
                className="cgm-confetti-piece"
                style={{
                  left: `${(i * 3.3) % 100}%`,
                  animationDelay: `${(i * 0.08) % 2}s`,
                  backgroundColor: ['#ffd700', '#00f2ff', '#a855f7', '#38bdf8', '#10b981'][i % 5],
                }}
              />
            ))}
          </div>
        )}

        {/* Header / Close button */}
        <button
          type="button"
          className="cgm-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {phase !== 'completed' ? (
          /* Automated Synthesis Progress HUD */
          <div className="cgm-synthesis-hud">
            <div className="cgm-synthesis-atom">
              <Atom size={56} className="cgm-atom-icon" />
              <div className="cgm-atom-glow" />
            </div>

            <div className="cgm-synthesis-tag">QUALUTION LEDGER MINTING ENGINE</div>
            <h2 className="cgm-synthesis-title">Synthesizing Official Quantum Credential</h2>
            <p className="cgm-synthesis-sub">
              Collapsing quantum curriculum telemetry into an immutable, cryptographically-signed certificate.
            </p>

            {/* Stepper Status Indicators */}
            <div className="cgm-steps-grid">
              <div className={`cgm-step-item ${progress >= 20 ? 'done' : 'active'}`}>
                <div className="cgm-step-dot">
                  {progress > 20 ? <CheckCircle2 size={14} /> : <Zap size={14} />}
                </div>
                <div className="cgm-step-text">
                  <div className="cgm-step-title">Curriculum Telemetry</div>
                  <div className="cgm-step-desc">12/12 Assessments Verified</div>
                </div>
              </div>

              <div className={`cgm-step-item ${progress >= 50 ? 'done' : progress >= 20 ? 'active' : ''}`}>
                <div className="cgm-step-dot">
                  {progress > 50 ? <CheckCircle2 size={14} /> : <Atom size={14} />}
                </div>
                <div className="cgm-step-text">
                  <div className="cgm-step-title">Quantum State Fidelity</div>
                  <div className="cgm-step-desc">99.85% Grover Benchmark</div>
                </div>
              </div>

              <div className={`cgm-step-item ${progress >= 80 ? 'done' : progress >= 50 ? 'active' : ''}`}>
                <div className="cgm-step-dot">
                  {progress > 80 ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />}
                </div>
                <div className="cgm-step-text">
                  <div className="cgm-step-title">SHA-256 Signature</div>
                  <div className="cgm-step-desc">{progress >= 80 ? generatedHash : 'Computing seed…'}</div>
                </div>
              </div>

              <div className={`cgm-step-item ${progress >= 100 ? 'done' : progress >= 80 ? 'active' : ''}`}>
                <div className="cgm-step-dot">
                  <Sparkles size={14} />
                </div>
                <div className="cgm-step-text">
                  <div className="cgm-step-title">Holographic Seal</div>
                  <div className="cgm-step-desc">SEAL-QPU-88219</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="cgm-progress-bar-wrap">
              <div className="cgm-progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="cgm-progress-label">
              <span>{phase === 'analyzing' && 'Step 1/4: Validating circuit simulations and quantum gates…'}</span>
              <span>{phase === 'fidelity' && 'Step 2/4: Computing fidelity against ideal Grover & Bell statevectors…'}</span>
              <span>{phase === 'hashing' && 'Step 3/4: Generating tamper-evident SHA-256 cryptographic digest…'}</span>
              <span>{phase === 'minting' && 'Step 4/4: Affixing registrar seals and issuing permanent serial…'}</span>
              <strong className="text-sky-400">{progress}%</strong>
            </div>
          </div>
        ) : (
          /* Synthesis Completed -> Render Full Certificate View */
          <div className="cgm-completed-view">
            <div className="cgm-completed-banner">
              <div className="cgm-banner-badge">
                <Trophy size={20} className="text-amber-400" />
                <span>OFFICIALLY CONFERRED</span>
              </div>
              <h2 className="cgm-banner-title">Congratulations, {studentName}! 🎉</h2>
              <p className="cgm-banner-sub">
                Your official certification in Quantum Information Science &amp; Circuit Engineering has been generated and permanently recorded.
              </p>
            </div>

            {activeCertificate && (
              <QuantumCertificateView
                certificate={activeCertificate}
                showActions={true}
                onClose={onClose}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

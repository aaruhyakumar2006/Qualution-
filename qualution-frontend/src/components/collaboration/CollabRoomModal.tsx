import React, { useState } from 'react';
import {
  Users,
  Video,
  Copy,
  Check,
  Link2,
  ArrowRight,
  Sparkles,
  Radio,
  X,
  Plus,
  ShieldCheck,
  Globe,
  Clock,
} from 'lucide-react';
import './CollabRoomModal.css';

export interface CollabRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomId: string, roomTitle?: string) => void;
}

export const CollabRoomModal: React.FC<CollabRoomModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [joinInput, setJoinInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [createdRoomId] = useState(() => `QL-QUANTUM-${Math.floor(100 + Math.random() * 900)}`);

  if (!isOpen) return null;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const inviteUrl = `${originUrl}/?room=${createdRoomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const handleJoinByInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = joinInput.trim().replace(/^.*[?&]room=/, '').replace(/^.*\//, '');
    if (!cleaned) return;
    onJoinRoom(cleaned);
    onClose();
  };

  return (
    <div className="crm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="crm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="crm-header">
          <div className="crm-header-left">
            <div className="crm-icon-glow">
              <Radio size={20} className="crm-pulse-icon" />
            </div>
            <div>
              <h2 className="crm-title">Quantum Lab Collaboration</h2>
              <p className="crm-subtitle">Google Meet &amp; Live Share-style multi-user quantum workspace</p>
            </div>
          </div>
          <button type="button" className="crm-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="crm-tabs">
          <button
            type="button"
            className={`crm-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={15} />
            <span>New Lab Meeting</span>
          </button>
          <button
            type="button"
            className={`crm-tab ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            <Link2 size={15} />
            <span>Join with Code or Link</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="crm-body">
          {activeTab === 'create' ? (
            <div className="crm-create-section">
              <div className="crm-banner">
                <div className="crm-banner-badge">
                  <Sparkles size={13} />
                  <span>Instant Session Ready</span>
                </div>
                <h3 className="crm-banner-heading">Start an Interactive Quantum Room</h3>
                <p className="crm-banner-desc">
                  Collaborate in real time with classmates and instructors. Everyone sees live circuit changes, statevector evolutions, and voice presence.
                </p>
              </div>

              <div className="crm-link-card">
                <div className="crm-link-info">
                  <span className="crm-link-label">Your Shareable Lab Link</span>
                  <div className="crm-link-value">{inviteUrl}</div>
                </div>
                <button
                  type="button"
                  className="crm-copy-btn"
                  onClick={handleCopyLink}
                  title="Copy meeting link to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="crm-features-row">
                <div className="crm-feature-pill">
                  <Radio size={13} className="text-sky-400" />
                  <span>Integrated Voice Channel</span>
                </div>
                <div className="crm-feature-pill">
                  <Users size={13} className="text-purple-400" />
                  <span>Live Peer Cursors</span>
                </div>
                <div className="crm-feature-pill">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Synchronized Qiskit Aer</span>
                </div>
              </div>

              <button
                type="button"
                className="crm-primary-action-btn"
                onClick={() => {
                  onJoinRoom(createdRoomId, 'Interactive Quantum Lab Session');
                  onClose();
                }}
              >
                <Video size={17} />
                <span>Start Instant Lab Session</span>
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <div className="crm-join-section">
              <form onSubmit={handleJoinByInput} className="crm-join-form">
                <label htmlFor="crm-room-input" className="crm-join-label">
                  Enter meeting code or link
                </label>
                <div className="crm-join-input-wrap">
                  <input
                    id="crm-room-input"
                    type="text"
                    className="crm-join-input"
                    placeholder="e.g. QL-ENTANGLE-401 or https://qualution.io/?room=..."
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="crm-join-submit-btn"
                    disabled={!joinInput.trim()}
                  >
                    Join
                  </button>
                </div>
              </form>

              {/* Active Cohorts List */}
              <div className="crm-cohorts-section">
                <div className="crm-cohorts-title">
                  <Clock size={14} />
                  <span>Active Class Cohort Sessions</span>
                </div>

                <div className="crm-cohort-list">
                  <div
                    className="crm-cohort-card"
                    onClick={() => {
                      onJoinRoom('QL-ENTANGLE-401', 'PHYS-CS 401: Bell State Teleportation');
                      onClose();
                    }}
                  >
                    <div className="crm-cohort-info">
                      <div className="crm-cohort-header">
                        <span className="crm-cohort-live-dot" />
                        <span className="crm-cohort-name">PHYS-CS 401 · Group Alpha</span>
                        <span className="crm-cohort-users-tag">4 Connected</span>
                      </div>
                      <div className="crm-cohort-topic">
                        Team Lab: Bell State Entanglement &amp; Teleportation Protocol
                      </div>
                      <div className="crm-cohort-meta">
                        Instructor: <strong>Prof. Vance</strong> • Driver: <strong>Aarav Sharma</strong>
                      </div>
                    </div>
                    <button type="button" className="crm-cohort-join-btn">
                      Join
                    </button>
                  </div>

                  <div
                    className="crm-cohort-card"
                    onClick={() => {
                      onJoinRoom('QL-GROVER-202', "Quantum Search & Oracle Synthesis Sprint");
                      onClose();
                    }}
                  >
                    <div className="crm-cohort-info">
                      <div className="crm-cohort-header">
                        <span className="crm-cohort-live-dot" />
                        <span className="crm-cohort-name">CS 395 · Advanced Quantum</span>
                        <span className="crm-cohort-users-tag">3 Connected</span>
                      </div>
                      <div className="crm-cohort-topic">
                        Sprint: Grover&apos;s Oracle Synthesis &amp; Phase Inversion
                      </div>
                      <div className="crm-cohort-meta">
                        Driver: <strong>Maya Lin</strong> • Navigator: <strong>Alex Chen</strong>
                      </div>
                    </div>
                    <button type="button" className="crm-cohort-join-btn">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Share2,
  Copy,
  Check,
  MessageSquare,
  ListOrdered,
  Award,
  Sparkles,
  Zap,
  Cpu,
  Brain,
  ChevronRight,
  Atom,
  Sun,
  Moon,
  Send,
  Plus,
  MousePointer,
  RotateCcw,
  CheckCircle2,
  Flame,
  HelpCircle,
  Radio,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import {
  INITIAL_COLLAB_ROOM,
  type CollabRoomState,
  type CollabUser,
  type CollabGate,
  type CollabChatMessage,
} from '../features/collaboration/collabMockData';
import { useTheme } from '../features/theme/ThemeContext';
import './CollaborativeLearningPage.css';

export interface CollaborativeLearningPageProps {
  onNavigateHome: () => void;
  onNavigateTeacherPortal: () => void;
  onNavigateStudentPortal: () => void;
  onLaunchIDE: () => void;
}

export const CollaborativeLearningPage: React.FC<CollaborativeLearningPageProps> = ({
  onNavigateHome,
  onNavigateTeacherPortal,
  onNavigateStudentPortal,
  onLaunchIDE,
}) => {
  const { theme, toggleTheme } = useTheme();

  // Room state
  const [room, setRoom] = useState<CollabRoomState>(INITIAL_COLLAB_ROOM);
  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'objectives' | 'team'>('chat');
  
  // Voice Controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Chat message input
  const [inputMessage, setInputMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected gate from palette to place
  const [selectedGateType, setSelectedGateType] = useState<string>('H');
  
  // Current user driver state
  const [isDriver, setIsDriver] = useState(false);

  // Simulation Running state
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastFidelity, setLastFidelity] = useState(99.8);

  // Animated cursor drift to make collaborative room feel alive
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorOffset({
        x: Math.sin(Date.now() / 1200) * 14,
        y: Math.cos(Date.now() / 1500) * 10,
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: CollabChatMessage = {
      id: `msg-${Date.now()}`,
      userId: 'usr-self',
      userName: 'You (Aarav Sharma)',
      userRole: 'student',
      userColor: '#38bdf8',
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRoom((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
      totalTeamXP: prev.totalTeamXP + 15,
    }));
    setInputMessage('');
  };

  const handlePlaceGate = (wireIndex: number, slotIndex: number) => {
    const existingIndex = room.gates.findIndex((g) => g.wire === wireIndex && g.slot === slotIndex);
    
    const newGate: CollabGate = {
      id: `g-${Date.now()}`,
      name: selectedGateType,
      wire: wireIndex,
      slot: slotIndex,
      type: selectedGateType as any,
      placedBy: 'You',
    };

    let updatedGates = [...room.gates];
    if (existingIndex >= 0) {
      updatedGates.splice(existingIndex, 1);
    } else {
      updatedGates.push(newGate);
    }

    setRoom((prev) => ({
      ...prev,
      gates: updatedGates,
      totalTeamXP: prev.totalTeamXP + 25,
    }));
  };

  const handleRunTeamSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      const newFid = +(99.4 + Math.random() * 0.5).toFixed(1);
      setLastFidelity(newFid);

      // Add automated message from Erwin
      const aiMsg: CollabChatMessage = {
        id: `ai-${Date.now()}`,
        userId: 'ai-companion',
        userName: 'Erwin AI Copilot',
        userRole: 'ai',
        userColor: '#a78bfa',
        text: `⚡ Synchronized Qiskit Simulation completed across all 4 team screens! State fidelity: ${newFid}% (2,048 shots). Bell correlation verified.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiDiagnostic: true,
      };

      setRoom((prev) => ({
        ...prev,
        messages: [...prev.messages, aiMsg],
        totalTeamXP: prev.totalTeamXP + 50,
      }));
    }, 1200);
  };

  return (
    <div className="collab-page-root" data-theme={theme}>
      {/* ── Top Header ─────────────────────────────────────────── */}
      <header className="collab-header">
        <div className="collab-header-left">
          <button type="button" className="collab-logo-btn" onClick={onNavigateHome}>
            <div className="collab-logo-icon">
              <Atom size={20} />
            </div>
            <div>
              <div className="collab-logo-title">QUALUTION</div>
              <div className="collab-logo-sub">Collaborative Lab</div>
            </div>
          </button>

          <div className="collab-room-title-box">
            <span className="collab-live-pulse-dot" />
            <div>
              <div className="collab-room-title">{room.roomTitle}</div>
              <div className="collab-room-sub">Room #{room.roomId} • {room.cohort}</div>
            </div>
          </div>
        </div>

        <div className="collab-header-center">
          {/* Active Voice Channel Bar */}
          <div className="collab-voice-bar">
            <div className="collab-voice-indicator">
              <Radio size={14} className="text-emerald-400 animate-pulse" />
              <span>Voice Channel (4 Connected)</span>
            </div>

            <div className="collab-voice-users">
              {room.activeUsers.map((u) => (
                <div
                  key={u.id}
                  className={`collab-voice-avatar-wrap ${u.isSpeaking ? 'speaking' : ''}`}
                  title={`${u.name} (${u.role})`}
                  style={{ borderColor: u.color }}
                >
                  <img src={u.avatar} alt={u.name} className="collab-voice-avatar" />
                  {u.isMuted && <span className="collab-muted-dot" />}
                </div>
              ))}
            </div>

            <div className="collab-voice-toggles">
              <button
                type="button"
                className={`collab-voice-btn ${isMicMuted ? 'muted' : ''}`}
                onClick={() => setIsMicMuted(!isMicMuted)}
                title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMicMuted ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
              <button
                type="button"
                className={`collab-voice-btn ${isDeafened ? 'muted' : ''}`}
                onClick={() => setIsDeafened(!isDeafened)}
                title={isDeafened ? 'Undeafen Audio' : 'Deafen Audio'}
              >
                {isDeafened ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>
          </div>
        </div>

        <div className="collab-header-right">
          {/* Synergy Multiplier */}
          <div className="collab-synergy-badge" title="Team Synergy Multiplier for XP">
            <Flame size={15} className="text-amber-400" />
            <span>{room.teamSynergyMultiplier}x Synergy</span>
            <span className="collab-team-xp">{room.totalTeamXP} XP</span>
          </div>

          <button
            type="button"
            className="collab-share-btn"
            onClick={handleCopyInvite}
            title="Share Room Invite Link"
          >
            {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Copied!' : 'Invite'}</span>
          </button>

          <button
            type="button"
            className="collab-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ── Main Workspace Layout (Canvas + Sidebar) ─────────────── */}
      <div className="collab-workspace-body">
        {/* Left / Center: Interactive Multi-User Circuit Canvas */}
        <section className="collab-canvas-area">
          {/* Canvas Toolbar */}
          <div className="collab-canvas-toolbar">
            <div className="collab-toolbar-left">
              <span className="collab-toolbar-label">QUANTUM GATE PALETTE:</span>
              <div className="collab-gate-palette">
                {['H', 'X', 'Z', 'CX_CONTROL', 'CZ', 'MEASURE'].map((gate) => (
                  <button
                    key={gate}
                    type="button"
                    className={`collab-palette-gate-btn ${selectedGateType === gate ? 'selected' : ''}`}
                    onClick={() => setSelectedGateType(gate)}
                  >
                    <span>{gate === 'CX_CONTROL' ? 'CX' : gate === 'MEASURE' ? 'M' : gate}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="collab-toolbar-right">
              <button
                type="button"
                className={`collab-driver-btn ${isDriver ? 'active' : ''}`}
                onClick={() => setIsDriver(!isDriver)}
              >
                <Sliders size={14} />
                <span>{isDriver ? 'You are Driving' : 'Take Driver Seat'}</span>
              </button>

              <button
                type="button"
                className="collab-sim-btn"
                onClick={handleRunTeamSimulation}
                disabled={isSimulating}
              >
                <Play size={14} fill="currentColor" />
                <span>{isSimulating ? 'Simulating Aer...' : 'Run Team Sync (2048 Shots)'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Multi-Qubit Circuit Grid */}
          <div className="collab-circuit-board-wrap">
            <div className="collab-board-legend">
              <span className="collab-live-tag">● Real-time Multi-Cursor Broadcast</span>
              <span className="text-xs text-slate-400">Click any wire slot to place/toggle the selected gate</span>
            </div>

            <div className="collab-circuit-matrix">
              {/* Qubit Wires (q0, q1, q2) */}
              {[0, 1, 2].map((wireIdx) => (
                <div key={wireIdx} className="collab-wire-row">
                  <div className="collab-wire-label">
                    <span className="wire-name">q[{wireIdx}]</span>
                    <span className="wire-init">|0⟩</span>
                  </div>

                  <div className="collab-wire-line-track">
                    <div className="collab-wire-line" />

                    {/* 5 Gate Slots along the wire */}
                    {[0, 1, 2, 3, 4].map((slotIdx) => {
                      const placedGate = room.gates.find((g) => g.wire === wireIdx && g.slot === slotIdx);

                      return (
                        <div
                          key={slotIdx}
                          className={`collab-gate-slot ${placedGate ? 'has-gate' : 'empty'}`}
                          onClick={() => handlePlaceGate(wireIdx, slotIdx)}
                        >
                          {placedGate ? (
                            <div className={`collab-placed-gate gate-${placedGate.type.toLowerCase()}`}>
                              <span className="gate-title">
                                {placedGate.type === 'CX_CONTROL'
                                  ? '●'
                                  : placedGate.type === 'CX_TARGET'
                                  ? '⊕'
                                  : placedGate.name}
                              </span>
                              <span className="gate-author">{placedGate.placedBy.split(' ')[0]}</span>
                            </div>
                          ) : (
                            <div className="collab-slot-placeholder">
                              <Plus size={12} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Classical Measurement Register Wire */}
              <div className="collab-wire-row classical">
                <div className="collab-wire-label">
                  <span className="wire-name">c[2]</span>
                  <span className="wire-init">0</span>
                </div>
                <div className="collab-wire-line-track">
                  <div className="collab-wire-line double" />
                  {[0, 1, 2, 3, 4].map((slotIdx) => (
                    <div key={slotIdx} className="collab-gate-slot classical-slot">
                      <span className="text-[10px] text-slate-600">c.{slotIdx}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── LIVE SIMULATED PEER FLOATING CURSORS ── */}
              {/* Aarav Sharma's Cursor */}
              <div
                className="collab-floating-cursor cyan"
                style={{
                  transform: `translate(${320 + cursorOffset.x}px, ${80 + cursorOffset.y}px)`,
                }}
              >
                <MousePointer size={18} className="cursor-icon text-sky-400 fill-sky-400" />
                <div className="collab-cursor-badge cyan">
                  <span>Aarav Sharma</span>
                  <span className="cursor-role">Driver</span>
                </div>
              </div>

              {/* Maya Lin's Cursor */}
              <div
                className="collab-floating-cursor violet"
                style={{
                  transform: `translate(${510 - cursorOffset.x * 0.8}px, ${145 - cursorOffset.y}px)`,
                }}
              >
                <MousePointer size={18} className="cursor-icon text-purple-400 fill-purple-400" />
                <div className="collab-cursor-badge violet">
                  <span>Maya Lin</span>
                  <span className="cursor-role">Placing CX</span>
                </div>
              </div>

              {/* Prof. Katherine Vance Instructor Focus Callout */}
              <div
                className="collab-floating-cursor gold"
                style={{
                  transform: `translate(${640 + cursorOffset.y * 0.5}px, ${100 + cursorOffset.x * 0.4}px)`,
                }}
              >
                <div className="collab-instructor-focus-ring">
                  <span className="collab-focus-ring-inner" />
                </div>
                <div className="collab-cursor-badge gold">
                  <span>Prof. Vance: "Perfect Bell Pair entanglement!"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time State Vector & Probability Histogram */}
          <div className="collab-simulation-results-grid">
            {/* Probability Histogram */}
            <div className="collab-metric-card">
              <div className="collab-card-head">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-cyan-400" />
                  <span className="font-bold text-sm text-slate-100">Synchronized State Distribution (2,048 Shots)</span>
                </div>
                <span className="collab-fidelity-pill">{lastFidelity}% State Fidelity</span>
              </div>

              <div className="collab-histogram-bars">
                {room.simulationState.distribution.map((d) => (
                  <div key={d.state} className="collab-histo-col">
                    <div className="collab-histo-track">
                      <div
                        className="collab-histo-fill"
                        style={{ height: `${d.probability}%` }}
                      />
                    </div>
                    <span className="collab-histo-state">{d.state}</span>
                    <span className="collab-histo-pct">{d.probability}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Collaborative Bloch Sphere & Entanglement Indicator */}
            <div className="collab-metric-card">
              <div className="collab-card-head">
                <div className="flex items-center gap-2">
                  <Brain size={16} className="text-purple-400" />
                  <span className="font-bold text-sm text-slate-100">Quantum Mutual Information &amp; Entanglement</span>
                </div>
                <span className="text-xs text-emerald-400 font-bold">Maximal Entanglement</span>
              </div>

              <div className="collab-entangle-visual">
                <div className="collab-bloch-pill">
                  <span className="bloch-wire">Qubit q[0]</span>
                  <div className="bloch-sphere-graphic">
                    <span className="bloch-vector-point" />
                  </div>
                  <span className="bloch-state">|0⟩ + |1⟩ / √2</span>
                </div>

                <div className="collab-entangle-link">
                  <div className="collab-entangle-waves" />
                  <span className="collab-link-label">Bell Pair (|Φ⁺⟩)</span>
                </div>

                <div className="collab-bloch-pill">
                  <span className="bloch-wire">Qubit q[1]</span>
                  <div className="bloch-sphere-graphic">
                    <span className="bloch-vector-point rotated" />
                  </div>
                  <span className="bloch-state">Correlated to q[0]</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Collaborative Sidebar (Chat, Objectives, Team) */}
        <aside className="collab-sidebar">
          {/* Tab Selector */}
          <div className="collab-sidebar-tabs">
            <button
              type="button"
              className={`collab-side-tab ${activeSideTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveSideTab('chat')}
            >
              <MessageSquare size={14} />
              <span>Lab Chat ({room.messages.length})</span>
            </button>

            <button
              type="button"
              className={`collab-side-tab ${activeSideTab === 'objectives' ? 'active' : ''}`}
              onClick={() => setActiveSideTab('objectives')}
            >
              <ListOrdered size={14} />
              <span>Goals ({room.objectives.filter((o) => o.completed).length}/5)</span>
            </button>

            <button
              type="button"
              className={`collab-side-tab ${activeSideTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveSideTab('team')}
            >
              <Users size={14} />
              <span>Team (4)</span>
            </button>
          </div>

          {/* TAB 1: Real-time Socratic Chat */}
          {activeSideTab === 'chat' && (
            <div className="collab-chat-panel">
              <div className="collab-messages-scroll">
                {room.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`collab-msg-bubble ${m.isAiDiagnostic ? 'ai-diagnostic' : ''}`}
                  >
                    <div className="collab-msg-header">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="collab-msg-user-badge"
                          style={{ backgroundColor: `${m.userColor}25`, color: m.userColor }}
                        >
                          {m.userRole === 'instructor' ? 'Instructor' : m.userRole === 'ai' ? 'Copilot' : 'Student'}
                        </span>
                        <strong className="collab-msg-author" style={{ color: m.userColor }}>
                          {m.userName}
                        </strong>
                      </div>
                      <span className="collab-msg-time">{m.timestamp}</span>
                    </div>

                    <p className="collab-msg-text">{m.text}</p>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form className="collab-chat-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Ask a question or explain circuit logic..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="collab-chat-input"
                />
                <button
                  type="submit"
                  className="collab-chat-send-btn"
                  disabled={!inputMessage.trim()}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Collaborative Lab Objectives */}
          {activeSideTab === 'objectives' && (
            <div className="collab-objectives-panel">
              <div className="collab-objectives-head">
                <span className="text-xs uppercase font-bold text-slate-400">Team Sprint Objectives</span>
                <span className="text-xs text-sky-400 font-bold">
                  {room.objectives.filter((o) => o.completed).length} of {room.objectives.length} Complete
                </span>
              </div>

              <div className="collab-objectives-list">
                {room.objectives.map((obj) => (
                  <div
                    key={obj.id}
                    className={`collab-objective-item ${obj.completed ? 'done' : 'pending'}`}
                  >
                    <div className="collab-obj-check">
                      {obj.completed ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <span className="collab-obj-empty-dot" />
                      )}
                    </div>
                    <div className="collab-obj-body">
                      <div className="collab-obj-title">{obj.title}</div>
                      <div className="collab-obj-desc">{obj.description}</div>
                      {obj.completedBy && (
                        <div className="collab-obj-author">
                          Completed by <strong>{obj.completedBy}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Team Roster & Collaborative Controls */}
          {activeSideTab === 'team' && (
            <div className="collab-team-panel">
              <div className="collab-team-list">
                {room.activeUsers.map((user) => (
                  <div key={user.id} className="collab-team-card">
                    <div className="collab-team-avatar-wrap">
                      <img src={user.avatar} alt={user.name} className="collab-team-avatar" />
                      {user.isSpeaking && <span className="collab-team-speaking-ring" />}
                    </div>

                    <div className="collab-team-info">
                      <div className="collab-team-name-row">
                        <span className="collab-team-name">{user.name}</span>
                        <span
                          className="collab-role-tag"
                          style={{ backgroundColor: `${user.color}25`, color: user.color }}
                        >
                          {user.role}
                        </span>
                      </div>
                      <span className="collab-team-action">{user.activeAction}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="collab-team-controls">
                <button
                  type="button"
                  className="collab-switch-portal-btn"
                  onClick={onNavigateTeacherPortal}
                >
                  <span>Open Teacher Cohort View</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="collab-switch-portal-btn student"
                  onClick={onNavigateStudentPortal}
                >
                  <span>Open Student Learning Profile</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
export default CollaborativeLearningPage;

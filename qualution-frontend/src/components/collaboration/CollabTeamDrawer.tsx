import React, { useState } from 'react';
import {
  MessageSquare,
  ListOrdered,
  Users,
  Send,
  X,
  Sparkles,
  Bot,
  CheckCircle2,
  ChevronRight,
  Flame,
} from 'lucide-react';
import type { CollabRoomState, CollabChatMessage } from '../../features/collaboration/collabMockData';
import './CollabTeamDrawer.css';

export interface CollabTeamDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: CollabRoomState;
  onSendMessage: (text: string) => void;
  onNavigateTeacherPortal?: () => void;
  onNavigateStudentPortal?: () => void;
}

export const CollabTeamDrawer: React.FC<CollabTeamDrawerProps> = ({
  isOpen,
  onClose,
  room,
  onSendMessage,
  onNavigateTeacherPortal,
  onNavigateStudentPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'goals' | 'team'>('chat');
  const [inputVal, setInputVal] = useState('');

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  const completedCount = room.objectives.filter((o) => o.completed).length;

  return (
    <div className="ctd-docked-panel" data-testid="collab-team-drawer">
      {/* Panel Top Bar */}
      <div className="ctd-header">
        <div className="ctd-tab-group">
          <button
            type="button"
            className={`ctd-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={13} />
            <span>Chat ({room.messages.length})</span>
          </button>
          <button
            type="button"
            className={`ctd-tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            <ListOrdered size={13} />
            <span>Goals ({completedCount}/{room.objectives.length})</span>
          </button>
          <button
            type="button"
            className={`ctd-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <Users size={13} />
            <span>Team ({room.activeUsers.length})</span>
          </button>
        </div>

        <button type="button" className="ctd-close-btn" onClick={onClose} aria-label="Close drawer">
          <X size={15} />
        </button>
      </div>

      {/* Tab 1: Chat Stream */}
      {activeTab === 'chat' && (
        <div className="ctd-chat-container">
          <div className="ctd-chat-stream">
            {room.messages.map((msg) => (
              <div
                key={msg.id}
                className={`ctd-chat-msg ${msg.isAiDiagnostic ? 'ai-diagnostic' : ''}`}
              >
                <div className="ctd-msg-meta">
                  <span
                    className="ctd-msg-author"
                    style={{ color: msg.userColor }}
                  >
                    {msg.userName}
                  </span>
                  <span className="ctd-msg-role-tag">{msg.userRole}</span>
                  <span className="ctd-msg-time">{msg.timestamp}</span>
                </div>
                <div className="ctd-msg-text">
                  {msg.isAiDiagnostic && (
                    <Bot size={14} className="ctd-ai-icon text-purple-400" />
                  )}
                  <span>{msg.text}</span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="ctd-input-bar">
            <input
              type="text"
              className="ctd-chat-input"
              placeholder="Discuss quantum logic with peers..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button
              type="submit"
              className="ctd-send-btn"
              disabled={!inputVal.trim()}
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Sprint Objectives */}
      {activeTab === 'goals' && (
        <div className="ctd-goals-container">
          <div className="ctd-goals-header-row">
            <span className="ctd-goals-title">Sprint Milestones</span>
            <span className="ctd-goals-badge">{completedCount} of {room.objectives.length} Complete</span>
          </div>

          <div className="ctd-goals-list">
            {room.objectives.map((obj) => (
              <div
                key={obj.id}
                className={`ctd-goal-card ${obj.completed ? 'completed' : ''}`}
              >
                <div className="ctd-goal-check">
                  <CheckCircle2
                    size={16}
                    className={obj.completed ? 'text-emerald-400' : 'text-slate-600'}
                  />
                </div>
                <div className="ctd-goal-info">
                  <div className="ctd-goal-title">{obj.title}</div>
                  <div className="ctd-goal-desc">{obj.description}</div>
                  {obj.completedBy && (
                    <div className="ctd-goal-author">
                      Completed by <strong>{obj.completedBy}</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Team Roster */}
      {activeTab === 'team' && (
        <div className="ctd-team-container">
          <div className="ctd-team-list">
            {room.activeUsers.map((user) => (
              <div key={user.id} className="ctd-peer-card">
                <div
                  className="ctd-peer-avatar-wrap"
                  style={{ borderColor: user.color }}
                >
                  <img src={user.avatar} alt={user.name} className="ctd-peer-avatar" />
                  {user.isSpeaking && <span className="ctd-speaking-ring" />}
                </div>

                <div className="ctd-peer-info">
                  <div className="ctd-peer-name-row">
                    <span className="ctd-peer-name">{user.name}</span>
                    <span
                      className="ctd-peer-role-pill"
                      style={{ backgroundColor: `${user.color}20`, color: user.color }}
                    >
                      {user.role}
                    </span>
                  </div>
                  <span className="ctd-peer-action">{user.activeAction || 'In Session'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="ctd-portal-links">
            {onNavigateTeacherPortal && (
              <button
                type="button"
                className="ctd-portal-btn"
                onClick={onNavigateTeacherPortal}
              >
                <span>Teacher Cohort Dashboard</span>
                <ChevronRight size={14} />
              </button>
            )}
            {onNavigateStudentPortal && (
              <button
                type="button"
                className="ctd-portal-btn student"
                onClick={onNavigateStudentPortal}
              >
                <span>Student Learning Profile</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

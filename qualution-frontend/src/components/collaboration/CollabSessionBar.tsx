import React, { useState } from 'react';
import {
  Radio,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  MessageSquare,
  ListOrdered,
  LogOut,
  Users,
  Sparkles,
  Share2,
  Sliders,
  Flame,
} from 'lucide-react';
import type { CollabRoomState, CollabUser } from '../../features/collaboration/collabMockData';
import './CollabSessionBar.css';

export interface CollabSessionBarProps {
  room: CollabRoomState;
  onLeaveSession: () => void;
  onToggleChatDrawer: () => void;
  isChatDrawerOpen: boolean;
  onCopyInviteLink?: () => void;
}

export const CollabSessionBar: React.FC<CollabSessionBarProps> = ({
  room,
  onLeaveSession,
  onToggleChatDrawer,
  isChatDrawerOpen,
  onCopyInviteLink,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [copied, setCopied] = useState(false);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const inviteUrl = `${originUrl}/?room=${room.roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    if (onCopyInviteLink) onCopyInviteLink();
    setTimeout(() => setCopied(false), 2400);
  };

  const completedObjectives = room.objectives.filter((o) => o.completed).length;

  return (
    <aside className="csb-root" aria-label="Collaborative Workbench Session">
      {/* Left: Room Status & Title */}
      <div className="csb-left">
        <div className="csb-live-badge">
          <span className="csb-live-dot" />
          <span className="csb-live-text">LIVE LAB</span>
          <span className="csb-room-id">{room.roomId}</span>
        </div>

        <div className="csb-title-group">
          <span className="csb-title">{room.roomTitle}</span>
          <span className="csb-cohort-sub">{room.cohort}</span>
        </div>
      </div>

      {/* Middle: Connected Peer Avatars & Voice State */}
      <div className="csb-middle">
        <div className="csb-peers-stack" title={`${room.activeUsers.length} Collaborators Connected`}>
          {room.activeUsers.map((user) => (
            <div
              key={user.id}
              className={`csb-avatar-wrap ${user.isSpeaking ? 'speaking' : ''}`}
              title={`${user.name} (${user.role.toUpperCase()}) - ${user.activeAction || 'Active'}`}
              style={{ borderColor: user.color }}
            >
              <img src={user.avatar} alt={user.name} className="csb-avatar" />
              {user.isSpeaking && (
                <span className="csb-speaking-indicator" style={{ backgroundColor: user.color }} />
              )}
            </div>
          ))}
        </div>

        <div className="csb-synergy-pill" title="Collaborative Synergy Multiplier">
          <Flame size={13} className="text-amber-400" />
          <span>{room.teamSynergyMultiplier}x Synergy</span>
        </div>

        {/* Audio Wave Visualizer */}
        <div className="csb-audio-wave" title="Voice Channel Active">
          <span className="wave-bar b1" />
          <span className="wave-bar b2" />
          <span className="wave-bar b3" />
          <span className="wave-bar b4" />
        </div>
      </div>

      {/* Right: GMeet Controls */}
      <div className="csb-right">
        {/* Mic Toggle */}
        <button
          type="button"
          className={`csb-tool-btn ${isMuted ? 'active-mute' : ''}`}
          onClick={() => setIsMuted((prev) => !prev)}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          aria-label={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
        </button>

        {/* Audio Output Toggle */}
        <button
          type="button"
          className={`csb-tool-btn ${isDeafened ? 'active-mute' : ''}`}
          onClick={() => setIsDeafened((prev) => !prev)}
          title={isDeafened ? 'Turn Sound On' : 'Turn Sound Off'}
          aria-label={isDeafened ? 'Turn Sound On' : 'Turn Sound Off'}
        >
          {isDeafened ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Copy Invite Link */}
        <button
          type="button"
          className="csb-action-pill copy"
          onClick={handleCopy}
          title="Copy invite link for classmates"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Share2 size={13} />
              <span>Invite</span>
            </>
          )}
        </button>

        {/* Toggle Socratic Team Chat & Goals Drawer */}
        <button
          type="button"
          className={`csb-action-pill chat ${isChatDrawerOpen ? 'open' : ''}`}
          onClick={onToggleChatDrawer}
          title="Toggle Team Chat & Sprint Goals"
        >
          <MessageSquare size={13} />
          <span>Team Chat</span>
          <span className="csb-unread-badge">{room.messages.length}</span>
        </button>

        {/* Leave Session */}
        <button
          type="button"
          className="csb-tool-btn leave"
          onClick={onLeaveSession}
          title="Leave Collaborative Room"
          aria-label="Leave Collaborative Room"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
};

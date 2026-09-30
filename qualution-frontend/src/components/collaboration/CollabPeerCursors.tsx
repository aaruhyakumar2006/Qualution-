import React, { useEffect, useState } from 'react';
import { MousePointer } from 'lucide-react';
import type { CollabUser } from '../../features/collaboration/collabMockData';

export interface CollabPeerCursorsProps {
  users: CollabUser[];
}

export const CollabPeerCursors: React.FC<CollabPeerCursorsProps> = ({ users }) => {
  // Add subtle lifelike hover drift to peer cursors
  const [offsets, setOffsets] = useState<Record<string, { dx: number; dy: number }>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setOffsets({
        'usr-1': { dx: Math.sin(Date.now() / 1200) * 18, dy: Math.cos(Date.now() / 950) * 12 },
        'usr-2': { dx: Math.cos(Date.now() / 1400) * 22, dy: Math.sin(Date.now() / 1100) * 14 },
        'usr-3': { dx: Math.sin(Date.now() / 1600) * 12, dy: Math.cos(Date.now() / 1300) * 8 },
        'usr-4': { dx: Math.cos(Date.now() / 1100) * 15, dy: Math.sin(Date.now() / 1400) * 10 },
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="collab-peer-cursors-layer pointer-events-none"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 25,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {users.slice(0, 3).map((user) => {
        const base = user.cursorPos || { x: 300, y: 150 };
        const drift = offsets[user.id] || { dx: 0, dy: 0 };
        const currentX = base.x + drift.dx;
        const currentY = base.y + drift.dy;

        return (
          <div
            key={user.id}
            style={{
              position: 'absolute',
              left: `${currentX}px`,
              top: `${currentY}px`,
              transform: 'translate(-2px, -2px)',
              transition: 'left 0.12s linear, top 0.12s linear',
              pointerEvents: 'none',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            {/* Custom Glowing Cursor SVG */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={user.color}
              stroke="#040914"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: `drop-shadow(0 2px 8px ${user.color}88)`,
              }}
            >
              <polygon points="3 3 10.07 19.97 12.58 12.58 19.97 10.07 3 3" />
            </svg>

            {/* Peer Name Tag */}
            <div
              style={{
                marginTop: '2px',
                marginLeft: '12px',
                backgroundColor: 'rgba(9, 14, 26, 0.92)',
                border: `1px solid ${user.color}88`,
                borderRadius: '9999px',
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: `0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px ${user.color}33`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name.split(' ')[0]}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: user.color,
                  backgroundColor: `${user.color}25`,
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                }}
              >
                {user.role}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

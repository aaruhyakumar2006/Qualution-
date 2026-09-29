import React, { useId } from 'react';
import './ErwinMascot.css';

export type ErwinMascotState = 'idle' | 'correct' | 'incorrect' | 'thinking' | 'success' | 'warning';

export interface ErwinMascotProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  state?: ErwinMascotState;
  showEyes?: boolean;
  className?: string;
  customVisorColor?: string;
}

const STATE_TOKEN_MAP: Record<string, string> = {
  idle: 'var(--wb-status-cyan, #1192e8)',
  correct: 'var(--wb-status-success, #21c79a)',
  success: 'var(--wb-status-success, #21c79a)',
  incorrect: 'var(--wb-status-danger, #e05252)',
  warning: 'var(--wb-status-danger, #e05252)',
  thinking: 'var(--wb-accent, #0f62fe)',
};

function normalizeState(state: ErwinMascotState): 'idle' | 'correct' | 'incorrect' | 'thinking' {
  if (state === 'success') return 'correct';
  if (state === 'warning') return 'incorrect';
  return state;
}

export const ErwinMascot: React.FC<ErwinMascotProps> = ({
  size = 48,
  state = 'idle',
  showEyes = true,
  className = '',
  customVisorColor,
  style,
  ...props
}) => {
  const reactId = useId();
  const gradientId = `erwin-glow-${reactId.replace(/:/g, '')}`;
  const canonical = normalizeState(state);
  const visorColor = customVisorColor || STATE_TOKEN_MAP[canonical] || STATE_TOKEN_MAP.idle;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={`Erwin Mascot (${canonical})`}
      className={`erwin-mascot erwin--${canonical} ${className}`.trim()}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        '--erwin-visor-color': visorColor,
        ...style,
      } as React.CSSProperties}
      {...props}
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--erwin-visor-color, var(--wb-status-cyan, #1192e8))" stopOpacity="0.65" />
          <stop offset="45%" stopColor="var(--erwin-visor-color, var(--wb-status-cyan, #1192e8))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--erwin-visor-color, var(--wb-status-cyan, #1192e8))" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path id="erwin-bust" d="M 28 86 C 28 78 36 74 50 74 C 64 74 72 78 72 86 L 80 94 C 80 95 79 96 78 96 L 22 96 C 21 96 20 95 20 94 Z" fill="var(--wb-bg-surface-elevated, #1e232d)" stroke="var(--wb-border-strong, #3b4452)" strokeWidth="2" strokeLinejoin="round" />
      <polygon id="erwin-ear-left" points="22,42 18,14 38,28" fill="var(--wb-bg-surface-elevated, #1e232d)" stroke="var(--wb-border-strong, #3b4452)" strokeWidth="2" strokeLinejoin="round" />
      <polygon id="erwin-ear-right" points="78,42 82,14 62,28" fill="var(--wb-bg-surface-elevated, #1e232d)" stroke="var(--wb-border-strong, #3b4452)" strokeWidth="2" strokeLinejoin="round" />
      <polygon id="erwin-ear-inner-left" points="24,38 21,20 35,28" fill="var(--wb-accent, #0f62fe)" fillOpacity="0.3" />
      <polygon id="erwin-ear-inner-right" points="76,38 79,20 65,28" fill="var(--wb-accent, #0f62fe)" fillOpacity="0.3" />
      <path id="erwin-head" d="M 50 26 C 40 26 32 29 26 34 C 18 42 16 54 22 66 C 27 75 38 78 50 78 C 62 78 73 75 78 66 C 84 54 82 42 74 34 C 68 29 60 26 50 26 Z" fill="var(--wb-bg-surface-elevated, #1e232d)" stroke="var(--wb-border-strong, #3b4452)" strokeWidth="2" strokeLinejoin="round" />
      <ellipse id="erwin-visor-glow" cx="50" cy="54" rx="36" ry="16" fill={`url(#${gradientId})`} />
      <path id="erwin-visor" className="erwin-visor" d="M 27 45 L 73 45 C 77 45 80 48 79 52 L 76 58 C 74 61 71 63 67 63 L 33 63 C 29 63 26 61 24 58 L 21 52 C 20 48 23 45 27 45 Z" fill="var(--erwin-visor-color, var(--wb-status-cyan, #1192e8))" />

      {showEyes && (
        <>
          <rect id="erwin-eye-left" className="erwin-eye" x="32" y="51" width="10" height="4" rx="2" fill="#ffffff" opacity="0.95" />
          <rect id="erwin-eye-right" className="erwin-eye" x="58" y="51" width="10" height="4" rx="2" fill="#ffffff" opacity="0.95" />
        </>
      )}

      <polygon id="erwin-nose" points="48,67 52,67 50,70" fill="var(--wb-accent, #0f62fe)" />
      <path id="erwin-muzzle" d="M 46 72 L 50 74 L 54 72" fill="none" stroke="var(--wb-border-strong, #3b4452)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      <g id="erwin-orbit-ring" className="erwin-orbit-ring">
        <circle id="erwin-orbit-dot" cx="50" cy="38" r="2.2" fill="var(--erwin-visor-color, var(--wb-accent, #0f62fe))" />
      </g>
    </svg>
  );
};

export default ErwinMascot;

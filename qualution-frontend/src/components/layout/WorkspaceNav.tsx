import React, { useState } from 'react';
import {
  CircuitBoard,
  PlayCircle,
  BookOpen,
  Code2,
  Activity,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import './WorkspaceNav.css';

export type WorkspaceMode = 'build' | 'code' | 'simulate' | 'analyze' | 'learn' | 'debug' | 'optimize';

interface WorkspaceNavProps {
  activeMode: WorkspaceMode;
  onSelectMode: (mode: WorkspaceMode) => void;
}

const PRIMARY_NAV_ITEMS: {
  mode: WorkspaceMode;
  icon: React.ReactNode;
  label: string;
  title: string;
}[] = [
  {
    mode: 'build',
    icon: <CircuitBoard size={17} />,
    label: 'Build',
    title: 'Build — Quantum circuit canvas & toolbox',
  },
  {
    mode: 'simulate',
    icon: <PlayCircle size={17} />,
    label: 'Simulate',
    title: 'Simulate — Execution & measurement counts',
  },
  {
    mode: 'learn',
    icon: <BookOpen size={17} />,
    label: 'Learn',
    title: 'Learn — Concepts, Dirac states & quizzes',
  },
];

const ADVANCED_NAV_ITEMS: {
  mode: WorkspaceMode;
  icon: React.ReactNode;
  label: string;
  title: string;
}[] = [
  {
    mode: 'code',
    icon: <Code2 size={16} />,
    label: 'Code',
    title: 'Code — Qiskit & PennyLane editor workspace',
  },
  {
    mode: 'analyze',
    icon: <Activity size={16} />,
    label: 'Analyze',
    title: 'Analyze — 3D Bloch spheres, Q-Sphere & statevector',
  },
  {
    mode: 'debug',
    icon: <MessageSquare size={16} />,
    label: 'Debug',
    title: 'Debug — AI Quantum Tutor assistant',
  },
  {
    mode: 'optimize',
    icon: <Sparkles size={16} />,
    label: 'Optimize',
    title: 'Optimize — Depth reduction & formal equivalence',
  },
];

export const WorkspaceNav: React.FC<WorkspaceNavProps> = ({ activeMode, onSelectMode }) => {
  const isAdvancedActive = ['code', 'analyze', 'debug', 'optimize'].includes(activeMode);
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState<boolean>(isAdvancedActive);

  return (
    <nav className="workspace-nav" aria-label="Workspace Mode Navigation" data-testid="workspace-nav">
      {/* Primary Beginner-Friendly Core Modes */}
      <div className="workspace-nav-items">
        {PRIMARY_NAV_ITEMS.map(({ mode, icon, label, title }) => (
          <button
            key={mode}
            type="button"
            className={`workspace-nav-btn ${activeMode === mode ? 'active' : ''}`}
            onClick={() => onSelectMode(mode)}
            title={title}
            aria-label={title}
            aria-pressed={activeMode === mode}
            data-testid={`workspace-nav-${mode}`}
          >
            <span className="nav-btn-icon">{icon}</span>
            <span className="nav-btn-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Advanced Tools Section (Expandable) */}
      <div className="workspace-nav-advanced-wrap">
        <button
          type="button"
          className="workspace-nav-toggle-btn"
          onClick={() => setIsAdvancedExpanded((v) => !v)}
          title="Toggle Advanced Tools (Code, Analyze, Debug, Optimize)"
          aria-expanded={isAdvancedExpanded}
          data-testid="workspace-nav-advanced-toggle"
        >
          <span className="advanced-toggle-label">MORE</span>
          {isAdvancedExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </button>

        {isAdvancedExpanded && (
          <div className="workspace-nav-advanced-items">
            {ADVANCED_NAV_ITEMS.map(({ mode, icon, label, title }) => (
              <button
                key={mode}
                type="button"
                className={`workspace-nav-btn advanced ${activeMode === mode ? 'active' : ''}`}
                onClick={() => onSelectMode(mode)}
                title={title}
                aria-label={title}
                aria-pressed={activeMode === mode}
                data-testid={`workspace-nav-${mode}`}
              >
                <span className="nav-btn-icon">{icon}</span>
                <span className="nav-btn-label">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

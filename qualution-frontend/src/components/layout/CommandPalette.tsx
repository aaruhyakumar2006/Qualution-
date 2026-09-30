import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Undo,
  Redo,
  Trash2,
  Cpu,
  BarChart3,
  Binary,
  Globe,
  Layers,
  Gauge,
  Bot,
  Search,
  RefreshCw,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import './CommandPalette.css';

export interface CommandItem {
  id: string;
  label: string;
  category: 'Circuit' | 'Execution' | 'Navigation' | 'Backend';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCircuit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelectedGate: () => void;
  onSelectTab: (tab: 'results' | 'state' | 'bloch' | 'timeline' | 'metrics' | 'learn' | 'tutor' | 'theory') => void;
  onSelectBackend: (backend: string) => void;
  onSyncCode: () => void;
  onOptimize: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelectedGate: boolean;
  hasMultipleSelectedGates: boolean;
  isCustomGateSelected: boolean;
  onGroupGates: () => void;
  onUngroupGate: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onRunCircuit,
  onUndo,
  onRedo,
  onDeleteSelectedGate,
  onSelectTab,
  onSelectBackend,
  onSyncCode,
  onOptimize,
  canUndo,
  canRedo,
  hasSelectedGate,
  hasMultipleSelectedGates,
  isCustomGateSelected,
  onGroupGates,
  onUngroupGate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'run-circuit',
      label: 'Run Quantum Simulation',
      category: 'Execution',
      icon: Play,
      shortcut: 'Ctrl+Enter',
      action: () => {
        onRunCircuit();
        onClose();
      },
    },
    {
      id: 'undo',
      label: 'Undo Circuit Change',
      category: 'Circuit',
      icon: Undo,
      shortcut: 'Ctrl+Z',
      action: () => {
        if (canUndo) onUndo();
        onClose();
      },
    },
    {
      id: 'redo',
      label: 'Redo Circuit Change',
      category: 'Circuit',
      icon: Redo,
      shortcut: 'Ctrl+Shift+Z',
      action: () => {
        if (canRedo) onRedo();
        onClose();
      },
    },
    {
      id: 'delete-gate',
      label: 'Delete Selected Gate',
      category: 'Circuit',
      icon: Trash2,
      shortcut: 'Del',
      action: () => {
        if (hasSelectedGate) onDeleteSelectedGate();
        onClose();
      },
    },
    {
      id: 'group-gates',
      label: 'Group Selected Into Custom Gate',
      category: 'Circuit',
      icon: Layers,
      shortcut: 'Ctrl+G',
      action: () => {
        if (hasMultipleSelectedGates) onGroupGates();
        onClose();
      },
    },
    {
      id: 'ungroup-gate',
      label: 'Ungroup Custom Gate',
      category: 'Circuit',
      icon: Layers,
      shortcut: 'Ctrl+Shift+G',
      action: () => {
        if (isCustomGateSelected) onUngroupGate();
        onClose();
      },
    },
    {
      id: 'optimize-circuit',
      label: 'Optimize Quantum Circuit (Studio)',
      category: 'Circuit',
      icon: Cpu,
      action: () => {
        onOptimize();
        onClose();
      },
    },
    {
      id: 'open-optimization-studio',
      label: 'Open Optimization Studio',
      category: 'Circuit',
      icon: Cpu,
      action: () => {
        onOptimize();
        onClose();
      },
    },
    {
      id: 'sync-code',
      label: 'Sync Code → Circuit',
      category: 'Circuit',
      icon: RefreshCw,
      action: () => {
        onSyncCode();
        onClose();
      },
    },
    {
      id: 'zoom-in',
      label: 'Zoom In Circuit (Zoom +)',
      category: 'Circuit',
      icon: ZoomIn,
      shortcut: 'Ctrl++',
      action: () => {
        window.dispatchEvent(new CustomEvent('qualution:circuit-zoom', { detail: 'in' }));
        onClose();
      },
    },
    {
      id: 'zoom-out',
      label: 'Reduce Zoom Circuit (Zoom -)',
      category: 'Circuit',
      icon: ZoomOut,
      shortcut: 'Ctrl+-',
      action: () => {
        window.dispatchEvent(new CustomEvent('qualution:circuit-zoom', { detail: 'out' }));
        onClose();
      },
    },
    {
      id: 'zoom-reset',
      label: 'Reset Circuit Zoom (100%)',
      category: 'Circuit',
      icon: RotateCcw,
      shortcut: 'Ctrl+0',
      action: () => {
        window.dispatchEvent(new CustomEvent('qualution:circuit-zoom', { detail: 'reset' }));
        onClose();
      },
    },
    {
      id: 'backend-auto',
      label: 'Switch Backend: Auto (Intelligent Routing)',
      category: 'Backend',
      icon: Cpu,
      action: () => {
        onSelectBackend('auto');
        onClose();
      },
    },
    {
      id: 'backend-qiskit',
      label: 'Switch Backend: Qiskit Aer',
      category: 'Backend',
      icon: Cpu,
      action: () => {
        onSelectBackend('qiskit_aer');
        onClose();
      },
    },
    {
      id: 'backend-pennylane',
      label: 'Switch Backend: PennyLane',
      category: 'Backend',
      icon: Cpu,
      action: () => {
        onSelectBackend('pennylane');
        onClose();
      },
    },
    {
      id: 'backend-cirq',
      label: 'Switch Backend: Google Cirq',
      category: 'Backend',
      icon: Cpu,
      action: () => {
        onSelectBackend('cirq');
        onClose();
      },
    },
    {
      id: 'backend-qbraid',
      label: 'Switch Backend: qBraid',
      category: 'Backend',
      icon: Cpu,
      action: () => {
        onSelectBackend('qbraid');
        onClose();
      },
    },
    {
      id: 'nav-results',
      label: 'Open Results (Probabilities & Counts)',
      category: 'Navigation',
      icon: BarChart3,
      action: () => {
        onSelectTab('results');
        onClose();
      },
    },
    {
      id: 'nav-state',
      label: 'Open State (Statevector Amplitudes)',
      category: 'Navigation',
      icon: Binary,
      action: () => {
        onSelectTab('state');
        onClose();
      },
    },
    {
      id: 'nav-bloch',
      label: 'Open Bloch Sphere',
      category: 'Navigation',
      icon: Globe,
      action: () => {
        onSelectTab('bloch');
        onClose();
      },
    },
    {
      id: 'nav-timeline',
      label: 'Open Execution Timeline',
      category: 'Navigation',
      icon: Layers,
      action: () => {
        onSelectTab('timeline');
        onClose();
      },
    },
    {
      id: 'nav-metrics',
      label: 'Open Circuit Metrics',
      category: 'Navigation',
      icon: Gauge,
      action: () => {
        onSelectTab('metrics');
        onClose();
      },
    },
    {
      id: 'nav-theory',
      label: 'Open Theory Explorer',
      category: 'Navigation',
      icon: BookOpen,
      shortcut: 'Alt+T',
      action: () => {
        onSelectTab('theory');
        onClose();
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-backdrop" onClick={onClose} data-testid="command-palette">
      <div
        className="cmd-palette-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command Palette"
      >
        <div className="cmd-search-box">
          <Search size={14} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-search-input"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            data-testid="command-input"
          />
        </div>

        <div className="cmd-results-list" role="listbox">
          {filtered.length === 0 ? (
            <div className="cmd-empty">No matching commands found</div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                  data-testid={`cmd-item-${item.id}`}
                >
                  <div className="cmd-item-left">
                    <Icon size={14} className="cmd-item-icon" />
                    <span className="cmd-item-label">{item.label}</span>
                  </div>
                  <div className="cmd-item-right">
                    <span className="cmd-item-category">{item.category}</span>
                    {item.shortcut && <kbd className="cmd-item-shortcut">{item.shortcut}</kbd>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Keyboard, X } from 'lucide-react';
import './ShortcutHelp.css';

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl / ⌘ + Enter', desc: 'Run quantum simulation' },
    { key: 'Ctrl / ⌘ + K', desc: 'Open Command Palette' },
    { key: 'Ctrl / ⌘ + Z', desc: 'Undo circuit change' },
    { key: 'Ctrl / ⌘ + Shift + Z', desc: 'Redo circuit change' },
    { key: 'Ctrl / ⌘ + + / -', desc: 'Zoom circuit in (+) / out (-)' },
    { key: 'Ctrl / ⌘ + 0', desc: 'Reset circuit zoom to 100%' },
    { key: 'Delete / Backspace', desc: 'Delete selected gate' },
    { key: 'Escape', desc: 'Close open modal or clear selection' },
    { key: '?', desc: 'Show keyboard shortcuts' },
  ];

  return (
    <div className="shortcut-modal-backdrop" onClick={onClose} data-testid="shortcut-modal">
      <div
        className="shortcut-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="shortcut-title"
      >
        <div className="shortcut-modal-header">
          <div className="shortcut-title-box">
            <Keyboard size={15} color="var(--accent-cyan)" />
            <span id="shortcut-title" className="shortcut-modal-title">
              Keyboard Shortcuts
            </span>
          </div>
          <button
            type="button"
            className="btn-shortcut-close"
            onClick={onClose}
            aria-label="Close Shortcuts"
          >
            <X size={14} />
          </button>
        </div>

        <div className="shortcut-list">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="shortcut-row">
              <span className="shortcut-desc">{s.desc}</span>
              <kbd className="shortcut-kbd">{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

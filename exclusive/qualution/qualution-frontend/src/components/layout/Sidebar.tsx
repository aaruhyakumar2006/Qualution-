import React, { useState } from 'react';
import { IBM_OPERATIONS_PALETTE, type PaletteGateItem } from '../../features/circuit/state';
import { GATE_KNOWLEDGE_CATALOG } from '../../features/learning/gateKnowledge';
import {
  Search,
  Info,
  X,
  Grid,
  List,
  Plus,
  Minus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  onInsertGate?: (gateName: string) => void;
  onExplainGate?: (gateName: string) => void;
  onAddWire?: () => void;
  onRemoveWire?: () => void;
  onClearCircuit?: () => void;
  activeGateId?: string | null;
  onSelectPaletteGate?: (gateId: string | null) => void;
  isInspectMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onInsertGate,
  onExplainGate,
  onAddWire,
  onRemoveWire,
  onClearCircuit,
  activeGateId,
  onSelectPaletteGate,
  isInspectMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [selectedGlossaryGate, setSelectedGlossaryGate] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, gateId: string) => {
    console.log('🚀 DRAG START:', gateId);
    e.dataTransfer.setData('application/qualution-gate', gateId);
    e.dataTransfer.setData('text/plain', gateId);
    e.dataTransfer.setData('text', gateId);
    e.dataTransfer.effectAllowed = 'copy';
    console.log('📝 Data set in transfer:', e.dataTransfer.types);
  };

  const glossaryItem = selectedGlossaryGate
    ? GATE_KNOWLEDGE_CATALOG[selectedGlossaryGate.toLowerCase()]
    : null;

  const filteredGates = IBM_OPERATIONS_PALETTE.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGateSymbol = (g: PaletteGateItem) => {
    if (g.symbol === 'cx_icon') {
      return (
        <svg viewBox="0 0 24 24" width="16" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" className="ibm-svg-symbol">
          <circle cx="12" cy="4" r="2.2" fill="currentColor" stroke="none" />
          <line x1="12" y1="6.2" x2="12" y2="12" />
          <circle cx="12" cy="17" r="4" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="13" x2="12" y2="21" />
          <line x1="8" y1="17" x2="16" y2="17" />
        </svg>
      );
    }

    if (g.symbol === 'ccx_icon') {
      return (
        <svg viewBox="0 0 24 24" width="16" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" className="ibm-svg-symbol">
          <circle cx="12" cy="3" r="1.8" fill="currentColor" stroke="none" />
          <line x1="12" y1="4.8" x2="12" y2="8.5" />
          <circle cx="12" cy="10" r="1.8" fill="currentColor" stroke="none" />
          <line x1="12" y1="11.8" x2="12" y2="14.5" />
          <circle cx="12" cy="18" r="3.6" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="14.4" x2="12" y2="21.6" />
          <line x1="8.4" y1="18" x2="15.6" y2="18" />
        </svg>
      );
    }

    if (g.symbol === 'swap_icon') {
      return (
        <svg viewBox="0 0 24 24" width="16" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="ibm-svg-symbol">
          <line x1="8.5" y1="3.5" x2="15.5" y2="10.5" />
          <line x1="15.5" y1="3.5" x2="8.5" y2="10.5" />
          <line x1="12" y1="10.5" x2="12" y2="14.5" strokeWidth="1.5" />
          <line x1="8.5" y1="14.5" x2="15.5" y2="21.5" />
          <line x1="15.5" y1="14.5" x2="8.5" y2="21.5" />
        </svg>
      );
    }

    if (g.symbol === 'measure_icon') {
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" className="ibm-svg-symbol">
          <path d="M4 17 A8.5 8.5 0 0 1 20 17" />
          <line x1="12" y1="17" x2="16.5" y2="8" />
          <circle cx="12" cy="17" r="1.8" fill="currentColor" stroke="none" />
          <text x="17.5" y="8" fontSize="7.5" fill="currentColor" stroke="none" fontFamily="monospace" fontWeight="bold">z</text>
        </svg>
      );
    }

    if (g.symbol === 'disk_icon') {
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" className="ibm-svg-symbol ibm-phase-disk-icon">
          <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M2 12 A10 10 0 0 0 22 12 Z" fill="#0f62fe" />
          <line x1="12" y1="2" x2="12" y2="22" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      );
    }

    return <span className="ibm-gate-symbol">{g.symbol || g.name}</span>;
  };

  if (isCollapsed) {
    return (
      <aside className="ibm-operations-sidebar collapsed" data-testid="gate-sidebar">
        <div className="ibm-ops-header collapsed">
          <button
            type="button"
            className="ibm-ops-icon-btn"
            onClick={() => setIsCollapsed(false)}
            title="Expand Operations"
            aria-label="Expand Operations"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
        <div className="collapsed-vertical-label">
          <span>Operations</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="ibm-operations-sidebar" data-testid="gate-sidebar">
      {/* ── Operations Header ───────────────────────────────────── */}
      <div className="ibm-ops-header">
        <span className="ibm-ops-title">Operations</span>
        <div className="ibm-ops-actions">
          <button
            type="button"
            className={`ibm-ops-icon-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => setIsSearchOpen((prev) => !prev)}
            title="Search Operations"
            aria-label="Search Operations"
          >
            <Search size={15} />
          </button>
          <button
            type="button"
            className={`ibm-ops-icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
            title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
            aria-label="Toggle View"
          >
            {viewMode === 'grid' ? <Grid size={15} /> : <List size={15} />}
          </button>
          <button
            type="button"
            className="ibm-ops-icon-btn"
            onClick={() => setIsCollapsed(true)}
            title="Collapse Operations Panel"
            aria-label="Collapse Operations"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>
      </div>

      {/* ── Search Input (Collapsible) ────────────────────────── */}
      {isSearchOpen && (
        <div className="ibm-search-box">
          <input
            type="text"
            className="ibm-search-input"
            placeholder="Search operations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            data-testid="gate-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="ibm-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* ── Wire & Circuit Action Toolbar ── */}
      <div className="ibm-wire-toolbar" data-testid="wire-toolbar">
        <button
          type="button"
          className="ibm-wire-btn"
          onClick={() => !isInspectMode && onAddWire?.()}
          disabled={isInspectMode}
          title="Add Qubit Wire"
          aria-label="Add Wire"
          data-testid="btn-add-wire"
        >
          <Plus size={12} />
          <span>Add wire</span>
        </button>

        <button
          type="button"
          className="ibm-wire-btn"
          onClick={() => !isInspectMode && onRemoveWire?.()}
          disabled={isInspectMode}
          title="Remove Qubit Wire"
          aria-label="Remove Wire"
          data-testid="btn-remove-wire"
        >
          <Minus size={12} />
          <span>Remove wire</span>
        </button>

        <button
          type="button"
          className="ibm-wire-btn ibm-btn-clear"
          onClick={() => !isInspectMode && onClearCircuit?.()}
          disabled={isInspectMode}
          title="Clear all gates"
          aria-label="Clear Circuit"
          data-testid="btn-clear-circuit"
        >
          <Trash2 size={12} />
          <span>Clear</span>
        </button>
      </div>

      {/* ── Operations Grid ─────────────────────────────────────── */}
      <div className="ibm-palette-content">
        <div className={`ibm-gates-grid ${viewMode}`}>
          {filteredGates.map((g: PaletteGateItem) => (
            <div
              key={g.id}
              className={`ibm-gate-tile ${viewMode} ${g.id === 'phase_disk' ? 'phase-disk-tile' : ''} ${g.id === activeGateId ? 'active-palette-gate' : ''} ${isInspectMode ? 'inspect-disabled' : ''}`}
              style={{
                backgroundColor: g.color,
                color: g.textColor || '#000000',
                opacity: isInspectMode ? 0.6 : undefined,
                cursor: isInspectMode ? 'not-allowed' : 'grab',
              }}
              title={isInspectMode ? "Inspect Mode: modifications disabled" : `${g.label} (${g.name}) — Drag and drop onto wire or click to select`}
              draggable={!isInspectMode}
              onClick={() => {
                if (isInspectMode) return;
                onSelectPaletteGate?.(activeGateId === g.id ? null : g.id);
              }}
              onDoubleClick={() => {
                if (isInspectMode) return;
                onInsertGate?.(g.id);
              }}
              onDragStart={(e) => {
                if (isInspectMode) {
                  e.preventDefault();
                  return;
                }
                handleDragStart(e, g.id);
                const target = e.currentTarget;
                setTimeout(() => {
                  if (target) target.style.opacity = '0.5';
                }, 0);
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              data-testid={`palette-gate-${g.id}`}
              data-gate={g.id.toLowerCase()}
              data-teaching-target={`gate-palette-${g.id.toUpperCase()}`}
            >
              {renderGateSymbol(g)}

              {/* List View Label details */}
              {viewMode === 'list' && (
                <div className="ibm-list-details">
                  <div className="ibm-list-title-row">
                    <span className="ibm-list-gate-name">{g.name}</span>
                    <span className="ibm-list-gate-label">{g.label}</span>
                  </div>
                  {onExplainGate && (
                    <button
                      type="button"
                      className="btn-glossary-info"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGlossaryGate(g.id);
                        onExplainGate(g.id);
                      }}
                      title="Inspect Concept Details"
                    >
                      <Info size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Glossary / Knowledge Detail Drawer */}
      {glossaryItem && (
        <div className="ibm-glossary-drawer" data-testid="glossary-drawer">
          <div className="glossary-header">
            <span className="glossary-title">{glossaryItem.name}</span>
            <button
              type="button"
              className="btn-glossary-close"
              onClick={() => setSelectedGlossaryGate(null)}
              aria-label="Close glossary"
            >
              <X size={13} />
            </button>
          </div>
          <p className="glossary-summary">{glossaryItem.beginnerDescription || glossaryItem.technicalDescription}</p>
          <div className="glossary-matrix-box">
            <span className="matrix-lbl">Matrix Representation:</span>
            <code className="matrix-code">
              {Array.isArray(glossaryItem.matrix) ? glossaryItem.matrix.join('\n') : String(glossaryItem.matrix)}
            </code>
          </div>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;

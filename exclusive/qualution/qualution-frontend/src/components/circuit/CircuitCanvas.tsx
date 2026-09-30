import React, { useState, useEffect, useCallback } from 'react';
import type { CircuitRequest, Gate } from '../../features/circuit/types';
import { alignCircuitGates, type AlignmentMode } from '../../features/circuit/circuitAlignment';
import { GATE_KNOWLEDGE_CATALOG } from '../../features/learning/gateKnowledge';
import { IBM_OPERATIONS_PALETTE } from '../../features/circuit/state';
import { GateConfigModal } from './GateConfigModal';
import { CircuitRenderer } from './CircuitRenderer';
import {
  placeGateInState,
  removeGateFromState,
  connectGatesInState,
  toCanonicalCircuitState,
  fromCanonicalCircuitState,
} from '../../features/circuit/circuitEngine';
import { Trash2, Plus, Minus, Undo2, Redo2, ZoomIn, ZoomOut, Layers, AlignLeft, Grid, HelpCircle, X } from 'lucide-react';
import './CircuitCanvas.css';

interface CircuitCanvasProps {
  circuit: CircuitRequest;
  onUpdateCircuit: (updated: CircuitRequest) => void;
  selectedGateIds?: string[];
  onSelectGate: (gateId: string | null, multi?: boolean) => void;
  onOpenShortcuts?: () => void;
  highlightedGateId?: string | null;
  highlightedQubitIndex?: number | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  activePaletteGate?: string | null;
  onSelectPaletteGate?: (gateId: string | null) => void;
  onGroupGates?: () => void;
  onUngroupGate?: (gateId: string) => void;
  /** Driver mode lock flag: when true ('locked'), user mutations are disabled while scripted driver executes */
  isLocked?: boolean;
  lockMode?: 'locked' | 'unlocked';
  /** Whether circuit should gently fade out during Segment 9 wrap-up */
  isCircuitFadedOut?: boolean;
  /** Controlled inspect mode state and toggle callback */
  isInspectMode?: boolean;
  onToggleInspectMode?: (enabled: boolean) => void;
}

const MIN_COLUMNS = 16;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const DEFAULT_ZOOM = 1.0;
const ZOOM_STEP = 0.1;

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  circuit,
  onUpdateCircuit,
  selectedGateIds = [],
  onSelectGate,
  onOpenShortcuts: _onOpenShortcuts,
  highlightedGateId,
  highlightedQubitIndex,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  activePaletteGate,
  onSelectPaletteGate,
  onGroupGates,
  onUngroupGate,
  isLocked: propIsLocked,
  lockMode,
  isCircuitFadedOut = false,
  isInspectMode: propIsInspectMode,
  onToggleInspectMode,
}) => {
  const isLocked = Boolean(propIsLocked || lockMode === 'locked');
  const [alignmentMode, setAlignmentMode] = useState<AlignmentMode>('compact');
  const [internalInspectMode, setInternalInspectMode] = useState<boolean>(false);
  const isInspectMode = propIsInspectMode !== undefined ? propIsInspectMode : internalInspectMode;

  const handleToggleInspectMode = (checked: boolean) => {
    setInternalInspectMode(checked);
    onToggleInspectMode?.(checked);
    if (checked) {
      onSelectPaletteGate?.(null);
    }
  };
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 10) / 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 10) / 10));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
  }, []);

  // Global event listener for custom zoom events (e.g. from Header View menu, Command Palette)
  useEffect(() => {
    const handleCircuitZoomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<'in' | 'out' | 'reset'>;
      if (customEvent.detail === 'in') {
        handleZoomIn();
      } else if (customEvent.detail === 'out') {
        handleZoomOut();
      } else if (customEvent.detail === 'reset') {
        handleResetZoom();
      }
    };

    window.addEventListener('qualution:circuit-zoom', handleCircuitZoomEvent);
    return () => {
      window.removeEventListener('qualution:circuit-zoom', handleCircuitZoomEvent);
    };
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  // Ctrl + Mouse Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else if (e.deltaY > 0) {
        handleZoomOut();
      }
    }
  };

  const qubitIndices = Array.from({ length: circuit.qubits }, (_, i) => i);
  const maxGateCol = circuit.gates.reduce((max, g) => Math.max(max, g.column ?? 0), -1);
  const totalColumns = Math.max(MIN_COLUMNS, maxGateCol + 2);
  const columnIndices = Array.from({ length: totalColumns }, (_, i) => i);

  // Gate config modal state
  const [gateConfigReq, setGateConfigReq] = useState<{
    gate: string;
    qubit: number;
    column: number;
  } | null>(null);

  // Drag over visual state
  const [dragOverSlot, setDragOverSlot] = useState<{ qubit: number; col: number } | null>(null);

  // Hovered gate state for wire highlighting
  const [hoveredGateId, setHoveredGateId] = useState<string | null>(null);

  const selectedGates = circuit.gates.filter((g) => g.id && selectedGateIds.includes(g.id));
  const selectedGate = selectedGates.length === 1 ? selectedGates[0] : null;
  const hoveredGate = circuit.gates.find((g) => g.id === hoveredGateId);
  const highlightedGate = circuit.gates.find((g) => g.id === highlightedGateId);
  const inspectedGate = isInspectMode ? (hoveredGate || selectedGate) : selectedGate;
  const circuitDepth = circuit.gates.length > 0
    ? Math.max(...circuit.gates.map((g) => g.column ?? 0)) + 1
    : 0;

  // Determine which qubits are active/highlighted
  const activeQubitIndices = new Set<number>();
  if (selectedGate) {
    selectedGate.targets.forEach((t) => activeQubitIndices.add(t));
  }
  if (hoveredGate) {
    hoveredGate.targets.forEach((t) => activeQubitIndices.add(t));
  }
  if (highlightedGate) {
    highlightedGate.targets.forEach((t) => activeQubitIndices.add(t));
  }

  // 1. Add Qubit
  const handleAddQubit = () => {
    if (isLocked || isInspectMode) return;
    onUpdateCircuit({
      ...circuit,
      qubits: circuit.qubits + 1,
      classical_bits: circuit.qubits + 1,
    });
  };

  // 2. Remove Qubit
  const handleRemoveQubit = () => {
    if (isLocked || isInspectMode || circuit.qubits <= 1) return;
    const newQubits = circuit.qubits - 1;
    const validGates = circuit.gates.filter((g) => g.targets.every((t) => t < newQubits));
    onUpdateCircuit({
      ...circuit,
      qubits: newQubits,
      classical_bits: newQubits,
      gates: validGates,
    });
  };

  // 3. Clear All Gates
  const handleClearCircuit = () => {
    if (isLocked || isInspectMode) return;
    onUpdateCircuit({
      ...circuit,
      gates: [],
    });
    onSelectGate(null);
  };

  // 4. Delete Gate
  const handleDeleteGate = (gateId: string) => {
    if (isLocked || isInspectMode) return;
    const remaining = circuit.gates.filter((g) => g.id !== gateId);
    onUpdateCircuit({
      ...circuit,
      gates: remaining,
    });
    if (selectedGateIds.includes(gateId)) {
      onSelectGate(gateId, true);
    }
  };

  // 5. Move Gate
  const handleMoveGate = (gateId: string, targetQubit: number, targetCol: number) => {
    if (isLocked || isInspectMode) return;
    const movingGate = circuit.gates.find((g) => g.id === gateId);
    if (!movingGate) return;

    if (movingGate.targets.length > 1) {
      const isControl = movingGate.targets[0] === targetQubit;
      const isTarget = movingGate.targets[1] === targetQubit;
      if (!isControl && !isTarget) return;

      const newTargets = isControl
        ? [targetQubit, movingGate.targets[1]]
        : [movingGate.targets[0], targetQubit];

      const otherGates = circuit.gates.filter((g) => g.id !== gateId);
      const finalCol = alignmentMode === 'freeform'
        ? targetCol
        : resolveTargetColumn(newTargets, targetCol, otherGates);

      const moved = otherGates.concat({
        ...movingGate,
        targets: newTargets,
        column: finalCol,
      });

      const aligned = alignmentMode === 'freeform'
        ? moved
        : alignCircuitGates(moved, circuit.qubits, alignmentMode);

      onUpdateCircuit({
        ...circuit,
        gates: aligned,
      });
      return;
    }

    const otherGates = circuit.gates.filter((g) => g.id !== gateId);
    let newTargets = [targetQubit];
    if (movingGate.targets.length > 1) {
      const primary = movingGate.targets[0];
      const delta = targetQubit - primary;
      const shifted = movingGate.targets.map((t) => t + delta);
      if (shifted.every((t) => t >= 0 && t < circuit.qubits)) {
        newTargets = shifted;
      } else {
        newTargets = movingGate.targets;
      }
    }

    const finalCol = alignmentMode === 'freeform'
      ? targetCol
      : resolveTargetColumn(newTargets, targetCol, otherGates);

    const moved = otherGates.concat({
      ...movingGate,
      targets: newTargets,
      column: finalCol,
    });

    const aligned = alignmentMode === 'freeform'
      ? moved
      : alignCircuitGates(moved, circuit.qubits, alignmentMode);

    onUpdateCircuit({
      ...circuit,
      gates: aligned,
    });
  };

  const resolveTargetColumn = (targets: number | number[], preferredCol: number, existingGates: Gate[]): number => {
    let col = preferredCol;
    const targetList = Array.isArray(targets) ? targets : [targets];
    const isOccupied = (c: number) =>
      existingGates.some((g) => (g.column ?? 0) === c && g.targets.some((t) => targetList.includes(t)));

    while (isOccupied(col)) {
      col++;
    }
    return col;
  };

  // Helper to place any gate at a specific wire slot
  const placeGateAtSlot = (gateName: string, targetQubit: number, targetCol: number) => {
    console.log('🎨 placeGateAtSlot called:', { gateName, targetQubit, targetCol, isLocked, isInspectMode });
    if (isLocked || isInspectMode) {
      console.warn('❌ placeGateAtSlot blocked');
      return;
    }
    const lower = gateName.toLowerCase();
    console.log('✅ Proceeding with gate placement:', lower);
    
    const gateInfo = IBM_OPERATIONS_PALETTE.find((g) => g.id === lower);

    // Multi-qubit and angle resolution:
    let targets: number[] = [targetQubit];
    if (lower === 'ccx' || lower === 'mcx') {
      if (circuit.qubits < 3) {
        console.warn('Cannot place 3-qubit gate on circuit with fewer than 3 qubits');
        return;
      }
      const targetSet = new Set<number>([targetQubit]);
      for (let i = 0; i < circuit.qubits && targetSet.size < 3; i++) {
        targetSet.add(i);
      }
      targets = Array.from(targetSet);
    } else if (['cx', 'cz', 'swap', 'cp', 'crx', 'cry', 'crz', 'ch'].includes(lower)) {
      if (circuit.qubits < 2) {
        console.warn('Cannot place 2-qubit gate on circuit with fewer than 2 qubits');
        return;
      }
      const otherQubit = targetQubit < circuit.qubits - 1 ? targetQubit + 1 : targetQubit - 1;
      targets = [targetQubit, otherQubit];
    }

    const angle = gateInfo?.hasAngle ? (['rx', 'ry', 'rz', 'p', 'cp', 'crx', 'cry', 'crz'].includes(lower) ? Math.PI / 2 : undefined) : undefined;

    const finalCol = alignmentMode === 'freeform'
      ? targetCol
      : resolveTargetColumn(targets, targetCol, circuit.gates);
    const newGate: Gate = {
      id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      gate: lower,
      targets,
      column: finalCol,
      ...(angle !== undefined ? { angle } : {}),
    };

    const updated = [...circuit.gates, newGate];

    // CRITICAL FIX: Don't call alignCircuitGates on every gate add - causes re-render loops
    // Use the updated gates directly
    onUpdateCircuit({
      ...circuit,
      gates: updated,
    });
    onSelectGate(newGate.id);
  };

  // 6. Drop gate from palette onto wire slot
  const handleSlotDrop = (e: React.DragEvent, targetQubit: number, targetCol: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
    console.log('🎯 DROP EVENT:', { targetQubit, targetCol, isLocked, isInspectMode });

    if (isLocked || isInspectMode) {
      console.warn('❌ Drop blocked: locked or inspect mode');
      return;
    }

    const plainText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text') || '';
    const movedGateId =
      e.dataTransfer.getData('application/qualution-move-gate') ||
      (plainText.startsWith('move:') ? plainText.slice(5) : '');

    if (movedGateId) {
      console.log('📦 Moving existing gate:', movedGateId);
      handleMoveGate(movedGateId, targetQubit, targetCol);
      return;
    }

    const gateName =
      e.dataTransfer.getData('application/qualution-gate') ||
      (!plainText.startsWith('move:') && plainText.trim() ? plainText.trim() : '') ||
      activePaletteGate;

    console.log('🔍 Gate data from drag:', gateName);
    if (!gateName) {
      console.warn('❌ No gate data found in drag event');
      return;
    }
    console.log('✅ Placing gate:', gateName, 'at', targetQubit, targetCol);
    placeGateAtSlot(gateName, targetQubit, targetCol);
  };

  // 7. Modal Confirmation Handlers
  const handleConfirmGateConfig = (config: { targets: number[], angle?: number }) => {
    if (!gateConfigReq || isLocked || isInspectMode) return;
    const finalCol = alignmentMode === 'freeform'
      ? gateConfigReq.column
      : resolveTargetColumn(config.targets, gateConfigReq.column, circuit.gates);
    
    const newGate: Gate = {
      id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      gate: gateConfigReq.gate,
      targets: config.targets,
      ...(config.angle !== undefined ? { angle: config.angle } : {}),
      column: finalCol,
    };
    
    const updated = [...circuit.gates, newGate];
    const aligned = alignmentMode === 'freeform'
      ? updated
      : alignCircuitGates(updated, circuit.qubits, alignmentMode);
      
    onUpdateCircuit({
      ...circuit,
      gates: aligned,
    });
    setGateConfigReq(null);
  };

  // Alignment mode switcher
  const handleSwitchAlignment = (mode: AlignmentMode) => {
    setAlignmentMode(mode);
    // Only align when user explicitly switches mode
    if (mode !== 'freeform') {
      const aligned = alignCircuitGates(circuit.gates, circuit.qubits, mode);
      onUpdateCircuit({
        ...circuit,
        gates: aligned,
      });
    }
  };

  return (
    <div
      className="circuit-canvas-container"
      data-testid="circuit-canvas"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGateIds.length > 0) {
          e.preventDefault();
          if (isInspectMode) return;
          selectedGateIds.forEach(id => handleDeleteGate(id));
        } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
          e.preventDefault();
          handleZoomIn();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
          e.preventDefault();
          handleZoomOut();
        } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
          e.preventDefault();
          handleResetZoom();
        }
      }}
    >
      {/* ── IBM Quantum Composer Style Canvas Toolbar ── */}
      <div className="canvas-header ibm-composer-toolbar">
        <div className="canvas-toolbar-left">
          {onUndo && (
            <button
              type="button"
              className="btn-toolbar-icon"
              onClick={onUndo}
              disabled={!canUndo || isInspectMode}
              title={isInspectMode ? "Undo disabled in Inspect Mode" : "Undo (Ctrl+Z)"}
              aria-label="Undo"
            >
              <Undo2 size={14} />
            </button>
          )}
          {onRedo && (
            <button
              type="button"
              className="btn-toolbar-icon"
              onClick={onRedo}
              disabled={!canRedo || isInspectMode}
              title={isInspectMode ? "Redo disabled in Inspect Mode" : "Redo (Ctrl+Shift+Z)"}
              aria-label="Redo"
            >
              <Redo2 size={14} />
            </button>
          )}

          {/* Active Alignment Mode Status Pill (Test hook, visually hidden for clean toolbar) */}
          <div className="visually-hidden-test" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            <select
              data-testid="align-select"
              value={alignmentMode}
              onChange={(e) => handleSwitchAlignment(e.target.value as AlignmentMode)}
              aria-label="Alignment Mode"
            >
              <option value="compact">Compact</option>
              <option value="layers">Layers</option>
              <option value="freeform">Freeform</option>
            </select>
            {alignmentMode === 'layers' && (
              <span className="toolbar-alignment-badge layers-badge" data-testid="layers-depth-badge" title="DAG Layers: circuit operations partitioned into parallel time slices">
                <Layers size={11} /> Depth: {circuitDepth} {circuitDepth === 1 ? 'Layer' : 'Layers'}
              </span>
            )}
            {alignmentMode === 'compact' && (
              <span className="toolbar-alignment-badge compact-badge" data-testid="compact-badge" title="Left alignment: operations packed tightly to the leftmost available slots">
                <AlignLeft size={11} /> Compact
              </span>
            )}
            {alignmentMode === 'freeform' && (
              <span className="toolbar-alignment-badge freeform-badge" data-testid="freeform-badge" title="Freeform: manual column placement with custom spacing">
                <Grid size={11} /> Free Grid
              </span>
            )}
          </div>

          {/* Inspect Switch Toggle */}
          <label className={`ibm-inspect-switch ${isInspectMode ? 'active' : ''}`} data-testid="inspect-toggle-label">
            <input
              type="checkbox"
              checked={isInspectMode}
              onChange={(e) => handleToggleInspectMode(e.target.checked)}
              data-testid="inspect-toggle-input"
            />
            <span className="switch-slider" />
            <span className="switch-label">Inspect</span>
          </label>

          {/* Circuit Zoom Controls (Test hook, visually hidden for clean toolbar; floating HUD is in bottom-right) */}
          <div className="canvas-toolbar-zoom visually-hidden-test" data-testid="circuit-zoom-controls" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            <button
              type="button"
              className="btn-toolbar-icon btn-zoom-btn"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              title="Reduce zoom - (Ctrl + -)"
              aria-label="Reduce zoom -"
              data-testid="zoom-out-btn"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              className="zoom-level-badge"
              onClick={handleResetZoom}
              title="Reset zoom to 100% (Ctrl + 0)"
              aria-label={`Reset zoom (currently ${Math.round(zoom * 100)}%)`}
              data-testid="zoom-reset-btn"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="btn-toolbar-icon btn-zoom-btn"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              title="Zoom + (Ctrl + +)"
              aria-label="Zoom +"
              data-testid="zoom-in-btn"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        <div className="canvas-toolbar-right">
          <button
            type="button"
            className="btn-canvas-action"
            onClick={handleAddQubit}
            disabled={isInspectMode}
            title={isInspectMode ? "Disabled in Inspect Mode" : `Add Qubit Wire (q[${circuit.qubits}])`}
            data-testid="add-qubit-btn"
          >
            <Plus size={12} />
            <span>Add Wire</span>
          </button>
          <button
            type="button"
            className="btn-canvas-action"
            onClick={handleRemoveQubit}
            disabled={circuit.qubits <= 1 || isInspectMode}
            title={isInspectMode ? "Disabled in Inspect Mode" : "Remove Wire"}
            data-testid="remove-qubit-btn"
          >
            <Minus size={12} />
            <span>Remove Wire</span>
          </button>
          <button
            type="button"
            className="btn-canvas-action btn-danger"
            onClick={handleClearCircuit}
            disabled={circuit.gates.length === 0 || isInspectMode}
            title={isInspectMode ? "Disabled in Inspect Mode" : "Clear Circuit"}
            data-testid="clear-circuit-btn"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Selected / Inspected Gate Inspector Bar */}
      {(inspectedGate || selectedGates.length > 1) && (
        <div
          className={`gate-inspector-bar ${isInspectMode ? 'inspect-active' : ''}`}
          data-testid="gate-inspector"
        >
          {selectedGates.length > 1 ? (
             <div className="inspector-content-row">
                <div className="inspector-badge inspector-gate-badge">
                   <span className="inspector-gate-pill">MULTI</span>
                   <div className="inspector-gate-meta">
                      <span className="inspector-gate-fullname">{selectedGates.length} Gates Selected</span>
                   </div>
                </div>
                <div className="inspector-actions">
                   {onGroupGates && (
                     <button
                       type="button"
                       className="btn-inspector-action"
                       style={{ padding: '4px 10px', background: isInspectMode ? '#6b7280' : '#3b82f6', color: 'white', borderRadius: '4px', fontSize: '12px', border: 'none', cursor: isInspectMode ? 'not-allowed' : 'pointer' }}
                       onClick={() => !isInspectMode && onGroupGates()}
                       disabled={isInspectMode}
                       title={isInspectMode ? "Disabled in Inspect Mode (See-only)" : "Group into Custom Gate"}
                     >
                        Group into Custom Gate
                     </button>
                   )}
                   <button
                     type="button"
                     className="btn-inspector-delete"
                     disabled={isInspectMode}
                     onClick={() => !isInspectMode && selectedGateIds.forEach(id => handleDeleteGate(id))}
                     title={isInspectMode ? "Delete disabled in Inspect Mode (See-only)" : "Delete All"}
                   >
                        <Trash2 size={12} />
                        <span>Delete All</span>
                   </button>
                   <button
                      type="button"
                      className="btn-inspector-dismiss"
                      onClick={() => onSelectGate(null)}
                      title="Dismiss selection"
                    >
                      <X size={12} />
                    </button>
                </div>
             </div>
          ) : inspectedGate ? (
            (() => {
              const gateKey = inspectedGate.gate.toLowerCase();
              let knowledge = GATE_KNOWLEDGE_CATALOG[gateKey];
              if (!knowledge && gateKey === 'measure') {
                knowledge = {
                  gate: 'measure',
                  name: 'Measurement Operation',
                  category: 'measurement',
                  beginnerDescription:
                    'Collapses quantum superposition onto the computational basis {|0⟩, |1⟩}.',
                  technicalDescription:
                    'Von Neumann projection operator Π₀ = |0⟩⟨0|, Π₁ = |1⟩⟨1|, collapsing the wave function and storing the result in a classical bit.',
                  matrix: ['[ 1  0 ]', '[ 0  0 ]', 'and', '[ 0  0 ]', '[ 0  1 ]'],
                  equations: {
                    stateTransition: '|ψ⟩ = α|0⟩ + β|1⟩ → |0⟩ (prob |α|²) or |1⟩ (prob |β|²)',
                    transformation: 'P(0) = |⟨0|ψ⟩|², P(1) = |⟨1|ψ⟩|²',
                  },
                  blochEffect: 'Projects the state vector onto either the north (+Z) or south (-Z) pole.',
                  commonUses: ['Readout', 'Measurement collapse', 'State tomography'],
                };
              }
              if (!knowledge && gateKey === 'p') {
                knowledge = {
                  gate: 'p',
                  name: 'Phase Gate P(λ)',
                  category: 'phase',
                  beginnerDescription: 'Applies a relative phase shift to |1⟩ without changing measurement probabilities.',
                  technicalDescription: 'P(λ) = diag(1, e^(iλ)). Modulates quantum phase.',
                  matrix: ['[ 1      0   ]', '[ 0   e^(iλ) ]'],
                  equations: {
                    stateTransition: '|0⟩ → |0⟩, |1⟩ → e^(iλ)|1⟩',
                    transformation: 'P(λ)|1⟩ = e^(iλ)|1⟩',
                  },
                  blochEffect: 'Rotates around the Z-axis by angle λ.',
                  commonUses: ['Phase modulation', 'Quantum Fourier Transform', 'Quantum phase estimation'],
                };
              }

              const isTwoQubit = inspectedGate.targets.length > 1;
              const wireText = isTwoQubit
                ? `q[${inspectedGate.targets.join(', ')}] (Ctrl: q[${inspectedGate.targets[0]}], Tgt: q[${inspectedGate.targets[1]}])`
                : `q[${inspectedGate.targets[0]}]`;

              return (
                <div className="inspector-content-row">
                  {/* Gate Symbol & Category */}
                  <div className="inspector-badge inspector-gate-badge">
                    <span className="inspector-gate-pill">{inspectedGate.gate.toUpperCase()}</span>
                    <div className="inspector-gate-meta">
                      <span className="inspector-gate-fullname">{knowledge?.name || `${inspectedGate.gate.toUpperCase()} Gate`}</span>
                      <span className="inspector-category-tag">{knowledge?.category?.toUpperCase() || 'GATE'}</span>
                    </div>
                  </div>

                  {/* Wire & Location */}
                  <div className="inspector-badge">
                    <span className="inspector-title">WIRES:</span>
                    <span className="inspector-val">{wireText}</span>
                  </div>

                  <div className="inspector-badge">
                    <span className="inspector-title">{alignmentMode === 'layers' ? 'LAYER:' : 'COLUMN:'}</span>
                    <span className="inspector-val">
                      {alignmentMode === 'layers' ? `L${inspectedGate.column ?? 0}` : inspectedGate.column ?? 0}
                    </span>
                  </div>

                  {inspectedGate.angle !== undefined && (
                    <div className="inspector-badge">
                      <span className="inspector-title">ANGLE:</span>
                      <span className="inspector-val">
                        {(inspectedGate.angle / Math.PI).toFixed(2)}π rad ({(inspectedGate.angle * (180 / Math.PI)).toFixed(0)}°)
                      </span>
                    </div>
                  )}

                  {/* Unitary Matrix Presentation */}
                  {knowledge?.matrix && (
                    <div className="inspector-matrix-card" title="Unitary matrix representation">
                      <span className="matrix-heading">MATRIX U:</span>
                      <div className="matrix-rows">
                        {knowledge.matrix.map((row, idx) => (
                          <span key={idx} className="matrix-row-text">{row}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transformation Equation / Description */}
                  {(knowledge?.equations?.transformation || knowledge?.beginnerDescription) && (
                    <div className="inspector-formula-card" title={knowledge?.technicalDescription || knowledge?.beginnerDescription}>
                      <span className="inspector-title">ACTION:</span>
                      <span className="inspector-formula-text">
                        {knowledge?.equations?.transformation || knowledge?.beginnerDescription}
                      </span>
                    </div>
                  )}

                  {/* Live Inspect Indicator */}
                  {isInspectMode && (
                    <span className="inspector-live-tag">
                      👁️ LIVE INSPECT
                    </span>
                  )}

                  {/* Actions: Delete & Dismiss */}
                  <div className="inspector-actions">
                    {selectedGates.length === 1 && inspectedGate.gate === 'custom' && onUngroupGate && (
                       <button
                         type="button"
                         className="btn-inspector-action"
                         style={{ padding: '4px 10px', background: isInspectMode ? '#6b7280' : '#eab308', color: '#1a1a1a', borderRadius: '4px', fontSize: '12px', border: 'none', cursor: isInspectMode ? 'not-allowed' : 'pointer', marginRight: '8px' }}
                         onClick={() => !isInspectMode && onUngroupGate(inspectedGate.id!)}
                         disabled={isInspectMode}
                         title={isInspectMode ? "Disabled in Inspect Mode" : "Ungroup"}
                       >
                          Ungroup
                       </button>
                    )}
                    {selectedGateIds.includes(inspectedGate.id!) && (
                      <button
                        type="button"
                        className="btn-inspector-delete"
                        onClick={() => !isInspectMode && handleDeleteGate(inspectedGate.id!)}
                        disabled={isInspectMode}
                        data-testid="inspector-delete-btn"
                        title={isInspectMode ? "Delete disabled in Inspect Mode" : "Delete Selected Gate (Delete key)"}
                      >
                        <Trash2 size={12} />
                        <span>Delete Gate</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-inspector-dismiss"
                      onClick={() => {
                        onSelectGate(null);
                        setHoveredGateId(null);
                      }}
                      title="Dismiss gate details"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>
      )}

      {/* Tap-to-Place Active Instruction Banner */}
      {!isInspectMode && activePaletteGate && (
        <div className="canvas-tap-to-place-hud" data-testid="tap-to-place-hud">
          <div className="tap-hud-info">
            <span className="tap-hud-badge">TAP TO PLACE</span>
            <span>Tap any wire slot to place <strong>{activePaletteGate.toUpperCase()}</strong> gate</span>
          </div>
          <button
            type="button"
            className="tap-hud-cancel-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPaletteGate?.(null);
            }}
            title="Cancel gate placement"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Interactive Circuit Grid Viewport — Powered by canonical CircuitRenderer */}
      <div
        className={`canvas-viewport mode-${alignmentMode} ${isInspectMode ? 'inspect-mode-active' : ''} ${
          isLocked ? 'driver-locked' : 'driver-unlocked'
        }`}
        onClick={() => onSelectGate(null)}
        onWheel={handleWheel}
        onDragOver={(e) => {
          if (!isLocked && !isInspectMode) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }
        }}
      >
        {/* Persistent Ambient Quantum Background Animation (Runs throughout independent of segment transitions) */}
        <div className="ambient-quantum-backdrop" aria-hidden="true">
          <div className="ambient-quantum-glow" />
          <div className="ambient-quantum-glow-secondary" />
          <div className="ambient-quantum-grid-lines" />
        </div>

        <CircuitRenderer
          circuit={circuit}
          isLocked={isLocked}
          isInspectMode={isInspectMode}
          className={isCircuitFadedOut ? 'demo-fade-out' : ''}
          selectedGateIds={selectedGateIds}
          highlightedGateId={highlightedGateId}
          highlightedQubitIndex={highlightedQubitIndex}
          inspectedGateId={inspectedGate?.id}
          alignmentMode={alignmentMode}
          zoom={zoom}
          activePaletteGate={isInspectMode ? null : activePaletteGate}
          dragOverSlot={isInspectMode ? null : dragOverSlot}
          onSelectGate={onSelectGate}
          onDeleteGate={isInspectMode ? undefined : handleDeleteGate}
          onSlotClick={(qIndex, colIndex) => {
            if (activePaletteGate && !isLocked && !isInspectMode) {
              placeGateAtSlot(activePaletteGate, qIndex, colIndex);
            }
          }}
          onSlotDrop={handleSlotDrop}
          onDragOverSlot={(qubit, col) => !isInspectMode && setDragOverSlot({ qubit, col })}
          onDragLeaveSlot={() => setDragOverSlot(null)}
          onGateHover={(gateId) => setHoveredGateId(gateId)}
        />

        {/* Floating Quick Zoom HUD at bottom right of canvas */}
        <div className="canvas-floating-zoom" data-testid="canvas-floating-zoom">
          <button
            type="button"
            className="btn-floating-zoom"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="Reduce zoom - (Ctrl + -)"
            aria-label="Reduce zoom -"
            data-testid="floating-zoom-out-btn"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            className="floating-zoom-badge"
            onClick={handleResetZoom}
            title="Reset zoom to 100% (Ctrl + 0)"
            aria-label="Reset zoom to 100%"
            data-testid="floating-zoom-reset-btn"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="btn-floating-zoom"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="Zoom + (Ctrl + +)"
            aria-label="Zoom +"
            data-testid="floating-zoom-in-btn"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Gate Configuration Modal */}
      {gateConfigReq && (
        <GateConfigModal
          gateName={gateConfigReq.gate}
          droppedOnQubit={gateConfigReq.qubit}
          totalQubits={circuit.qubits}
          isOpen={true}
          onConfirm={handleConfirmGateConfig}
          onCancel={() => setGateConfigReq(null)}
        />
      )}
    </div>
  );
};

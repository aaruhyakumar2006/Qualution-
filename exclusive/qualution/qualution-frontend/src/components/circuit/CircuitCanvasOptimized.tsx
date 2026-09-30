import React, { useState, useCallback, useMemo } from 'react';
import type { CircuitRequest, Gate } from '../../features/circuit/types';
import { CircuitRenderer } from './CircuitRendererOptimized';
import { IBM_OPERATIONS_PALETTE } from '../../features/circuit/state';
import { Trash2, Plus, Minus, ZoomIn, ZoomOut } from 'lucide-react';
import './CircuitCanvas.css';

interface CircuitCanvasOptimizedProps {
  circuit: CircuitRequest;
  onUpdateCircuit: (updated: CircuitRequest) => void;
  selectedGateIds?: string[];
  onSelectGate: (gateId: string | null, multi?: boolean) => void;
  highlightedGateId?: string | null;
  activePaletteGate?: string | null;
  onSelectPaletteGate?: (gateId: string | null) => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const DEFAULT_ZOOM = 1.0;
const ZOOM_STEP = 0.1;

export const CircuitCanvasOptimized: React.FC<CircuitCanvasOptimizedProps> = ({
  circuit,
  onUpdateCircuit,
  selectedGateIds = [],
  onSelectGate,
  highlightedGateId,
  activePaletteGate,
  onSelectPaletteGate,
}) => {
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [dragOverSlot, setDragOverSlot] = useState<{ qubit: number; col: number } | null>(null);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 10) / 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 10) / 10));
  }, []);

  const handleAddQubit = useCallback(() => {
    onUpdateCircuit({
      ...circuit,
      qubits: circuit.qubits + 1,
      classical_bits: circuit.qubits + 1,
    });
  }, [circuit, onUpdateCircuit]);

  const handleRemoveQubit = useCallback(() => {
    if (circuit.qubits <= 1) return;
    const newQubits = circuit.qubits - 1;
    const validGates = circuit.gates.filter((g) => g.targets.every((t) => t < newQubits));
    onUpdateCircuit({
      ...circuit,
      qubits: newQubits,
      classical_bits: newQubits,
      gates: validGates,
    });
  }, [circuit, onUpdateCircuit]);

  const handleClearCircuit = useCallback(() => {
    onUpdateCircuit({
      ...circuit,
      gates: [],
    });
    onSelectGate(null);
  }, [circuit, onUpdateCircuit, onSelectGate]);

  const handleDeleteGate = useCallback((gateId: string) => {
    const remaining = circuit.gates.filter((g) => g.id !== gateId);
    onUpdateCircuit({
      ...circuit,
      gates: remaining,
    });
    if (selectedGateIds.includes(gateId)) {
      onSelectGate(null);
    }
  }, [circuit, onUpdateCircuit, selectedGateIds, onSelectGate]);

  // Disabled: Drag and drop only mode - no click-to-place
  const handleSlotClick = useCallback((qubit: number, column: number) => {
    // Click-to-place disabled - use drag and drop instead
  }, []);

  const handleSlotDrop = useCallback((e: React.DragEvent, qubit: number, column: number) => {
    e.preventDefault();
    const gateType = e.dataTransfer.getData('gate');
    if (!gateType) return;

    const lower = gateType.toLowerCase();
    const gateInfo = IBM_OPERATIONS_PALETTE.find((g) => g.id === lower);

    // Only handle simple single-qubit gates in drag-drop
    if (gateInfo && gateInfo.qubits === 1 && !gateInfo.hasAngle) {
      const newGate: Gate = {
        id: `${lower}-${Date.now()}-${Math.random()}`,
        gate: lower,
        targets: [qubit],
        column: column,
      };

      onUpdateCircuit({
        ...circuit,
        gates: [...circuit.gates, newGate],
      });
    }

    setDragOverSlot(null);
  }, [circuit, onUpdateCircuit]);

  const handleDragOverSlot = useCallback((qubit: number, column: number) => {
    setDragOverSlot({ qubit, col: column });
  }, []);

  const handleDragLeaveSlot = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  // Warning for large circuits
  const isLargeCircuit = circuit.qubits > 20;

  return (
    <div className="circuit-canvas-container">
      {/* Toolbar */}
      <div className="circuit-toolbar">
        <div className="toolbar-section">
          <button
            className="toolbar-btn"
            onClick={handleAddQubit}
            title="Add Qubit"
            disabled={circuit.qubits >= 50}
          >
            <Plus size={16} />
            <span>Add Qubit</span>
          </button>
          <button
            className="toolbar-btn"
            onClick={handleRemoveQubit}
            title="Remove Qubit"
            disabled={circuit.qubits <= 1}
          >
            <Minus size={16} />
            <span>Remove Qubit</span>
          </button>
          <button
            className="toolbar-btn danger"
            onClick={handleClearCircuit}
            title="Clear All Gates"
            disabled={circuit.gates.length === 0}
          >
            <Trash2 size={16} />
            <span>Clear</span>
          </button>
        </div>

        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={handleZoomOut} title="Zoom Out" disabled={zoom <= MIN_ZOOM}>
            <ZoomOut size={16} />
          </button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="toolbar-btn" onClick={handleZoomIn} title="Zoom In" disabled={zoom >= MAX_ZOOM}>
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Performance Warning */}
      {isLargeCircuit && (
        <div className="performance-notice">
          <span>⚡ Large circuit mode: Timeline and Bloch sphere visualizations disabled for performance</span>
        </div>
      )}

      {/* Optimized Circuit Renderer */}
      <CircuitRenderer
        circuit={circuit}
        selectedGateIds={selectedGateIds}
        highlightedGateId={highlightedGateId}
        dragOverSlot={dragOverSlot}
        activePaletteGate={activePaletteGate}
        zoom={zoom}
        onSelectGate={onSelectGate}
        onDeleteGate={handleDeleteGate}
        onSlotClick={handleSlotClick}
        onSlotDrop={handleSlotDrop}
        onDragOverSlot={handleDragOverSlot}
        onDragLeaveSlot={handleDragLeaveSlot}
        showColumnTicks={true}
        showClassicalWire={false}
        showStateDisks={false}
      />

      {/* Circuit Info */}
      <div className="circuit-info-bar">
        <span>Qubits: {circuit.qubits}</span>
        <span>Gates: {circuit.gates.length}</span>
        <span>Depth: {circuit.gates.length > 0 ? Math.max(...circuit.gates.map(g => g.column ?? 0)) + 1 : 0}</span>
      </div>
    </div>
  );
};

CircuitCanvasOptimized.displayName = 'CircuitCanvasOptimized';

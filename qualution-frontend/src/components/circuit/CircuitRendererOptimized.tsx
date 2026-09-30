import React, { useMemo, useCallback, memo, useRef, useState, useEffect } from 'react';
import type { CanonicalCircuitState, CanonicalGate } from '../../features/circuit/circuitEngine';
import type { CircuitRequest } from '../../features/circuit/types';
import { toCanonicalCircuitState } from '../../features/circuit/circuitEngine';
import { IBM_OPERATIONS_PALETTE } from '../../features/circuit/state';
import './CircuitRenderer.css';

export type CircuitAlignmentMode = 'compact' | 'layers' | 'freeform';

export interface CircuitRendererProps {
  state?: CanonicalCircuitState;
  circuit?: CircuitRequest;
  selectedGateIds?: string[];
  highlightedGateId?: string | null;
  highlightedQubitIndex?: number | null;
  inspectedGateId?: string | null;
  onSelectGate?: (gateId: string | null, multi?: boolean) => void;
  onDeleteGate?: (gateId: string) => void;
  onSlotClick?: (qubit: number, column: number) => void;
  onSlotDrop?: (e: React.DragEvent, qubit: number, column: number) => void;
  onGateHover?: (gateId: string | null) => void;
  onDragOverSlot?: (qubit: number, column: number) => void;
  onDragLeaveSlot?: () => void;
  dragOverSlot?: { qubit: number; col: number } | null;
  activePaletteGate?: string | null;
  alignmentMode?: CircuitAlignmentMode;
  totalColumns?: number;
  zoom?: number;
  readOnly?: boolean;
  isInspectMode?: boolean;
  isLocked?: boolean;
  showColumnTicks?: boolean;
  showClassicalWire?: boolean;
  showStateDisks?: boolean;
  className?: string;
  testId?: string;
}

const MIN_COLUMNS = 16;
const QUBIT_ROW_HEIGHT = 80; // pixels
const VISIBLE_BUFFER = 5; // extra qubits to render above/below viewport

/**
 * OPTIMIZED CircuitRenderer with Virtual Scrolling
 * Only renders visible qubits + buffer, dramatically reducing DOM nodes
 */
export const CircuitRenderer: React.FC<CircuitRendererProps> = memo(({
  state: controlledState,
  circuit: legacyCircuit,
  selectedGateIds = [],
  highlightedGateId,
  highlightedQubitIndex,
  inspectedGateId,
  onSelectGate,
  onDeleteGate,
  onSlotClick,
  onSlotDrop,
  onGateHover,
  onDragOverSlot,
  onDragLeaveSlot,
  dragOverSlot,
  activePaletteGate,
  alignmentMode = 'compact',
  totalColumns: controlledColumns,
  zoom = 1.0,
  readOnly = false,
  isLocked = false,
  isInspectMode = false,
  showColumnTicks = true,
  showClassicalWire = true,
  showStateDisks = true,
  className = '',
  testId = 'circuit-renderer',
}) => {
  const isInteractiveDisabled = readOnly || isLocked;
  const isSlotDisabled = isInteractiveDisabled || isInspectMode;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Normalize input to CanonicalCircuitState
  const state: CanonicalCircuitState = useMemo(() => {
    if (controlledState) return controlledState;
    if (legacyCircuit) return toCanonicalCircuitState(legacyCircuit);
    return {
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measurements: [],
    };
  }, [controlledState, legacyCircuit]);

  const maxGateCol = useMemo(
    () => state.gates.reduce((max, g) => Math.max(max, g.column ?? 0), -1),
    [state.gates]
  );

  const numColumns = useMemo(
    () => Math.max(controlledColumns ?? MIN_COLUMNS, maxGateCol + 2),
    [controlledColumns, maxGateCol]
  );

  const columnIndices = useMemo(
    () => Array.from({ length: numColumns }, (_, i) => i),
    [numColumns]
  );

  // Virtual scrolling calculation
  const { startQubit, endQubit, visibleQubitIndices } = useMemo(() => {
    const totalQubits = Math.max(1, state.qubits);

    // For small circuits, render all qubits (no virtualization overhead)
    if (totalQubits <= 15) {
      const indices = Array.from({ length: totalQubits }, (_, i) => i);
      return { startQubit: 0, endQubit: totalQubits, visibleQubitIndices: indices };
    }

    // For large circuits, use virtual scrolling
    const start = Math.max(0, Math.floor(scrollTop / QUBIT_ROW_HEIGHT) - VISIBLE_BUFFER);
    const visibleCount = Math.ceil(containerHeight / QUBIT_ROW_HEIGHT);
    const end = Math.min(totalQubits, start + visibleCount + VISIBLE_BUFFER * 2);
    const indices = Array.from({ length: end - start }, (_, i) => start + i);

    return { startQubit: start, endQubit: end, visibleQubitIndices: indices };
  }, [state.qubits, scrollTop, containerHeight]);

  // Scroll handler with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Measure container height
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Active qubits calculation (memoized)
  const activeQubitIndices = useMemo(() => {
    const set = new Set<number>();
    state.gates.forEach((g) => {
      g.targets.forEach((t) => set.add(t));
    });
    return set;
  }, [state.gates]);

  // Gates by qubit and column for fast lookup
  const gatesMap = useMemo(() => {
    const map = new Map<string, CanonicalGate>();
    state.gates.forEach(gate => {
      gate.targets.forEach(target => {
        const key = `${target}-${gate.column ?? 0}`;
        map.set(key, gate);
      });
    });
    return map;
  }, [state.gates]);

  const totalHeight = state.qubits * QUBIT_ROW_HEIGHT;
  const offsetTop = startQubit * QUBIT_ROW_HEIGHT;

  return (
    <div
      ref={containerRef}
      className={`quantum-circuit-grid-wrapper canonical-circuit-renderer optimized ${isLocked ? 'driver-locked' : ''} ${className}`}
      data-testid={testId}
      style={{
        zoom,
        ['--circuit-zoom' as any]: zoom,
        transformOrigin: '0 0',
        overflow: 'auto',
        maxHeight: '70vh',
      }}
      onScroll={handleScroll}
    >
      {/* Column Header Ticks */}
      {showColumnTicks && (
        <div className="column-ticks-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
          <div className="tick-spacer" />
          <div className="column-ticks-track">
            {columnIndices.map((col) => (
              <div
                key={col}
                className={`col-tick-label ${alignmentMode === 'layers' ? 'layer-tick' : ''}`}
                title={alignmentMode === 'layers' ? `Layer L${col}` : `Column ${col}`}
              >
                {alignmentMode === 'layers' ? `L${col}` : col}
              </div>
            ))}
          </div>
          {showStateDisks && <div className="state-circle-spacer" />}
        </div>
      )}

      {/* Wires Container with Virtual Scrolling */}
      <div className="wires-container" style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetTop}px)`, willChange: 'transform' }}>
          {visibleQubitIndices.map((qIndex) => {
            const isWireActive = activeQubitIndices.has(qIndex);
            const isQubitHighlighted = highlightedQubitIndex === qIndex;

            return (
              <QubitRow
                key={qIndex}
                qIndex={qIndex}
                columnIndices={columnIndices}
                gatesMap={gatesMap}
                selectedGateIds={selectedGateIds}
                highlightedGateId={highlightedGateId}
                inspectedGateId={inspectedGateId}
                dragOverSlot={dragOverSlot}
                activePaletteGate={activePaletteGate}
                isWireActive={isWireActive}
                isQubitHighlighted={isQubitHighlighted}
                isSlotDisabled={isSlotDisabled}
                onSelectGate={onSelectGate}
                onDeleteGate={onDeleteGate}
                onSlotClick={onSlotClick}
                onSlotDrop={onSlotDrop}
                onGateHover={onGateHover}
                onDragOverSlot={onDragOverSlot}
                onDragLeaveSlot={onDragLeaveSlot}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

CircuitRenderer.displayName = 'CircuitRenderer';

/**
 * Optimized QubitRow component - memoized to prevent unnecessary re-renders
 */
const QubitRow = memo<{
  qIndex: number;
  columnIndices: number[];
  gatesMap: Map<string, CanonicalGate>;
  selectedGateIds: string[];
  highlightedGateId: string | null;
  inspectedGateId: string | null;
  dragOverSlot: { qubit: number; col: number } | null;
  activePaletteGate: string | null;
  isWireActive: boolean;
  isQubitHighlighted: boolean;
  isSlotDisabled: boolean;
  onSelectGate?: (gateId: string | null, multi?: boolean) => void;
  onDeleteGate?: (gateId: string) => void;
  onSlotClick?: (qubit: number, column: number) => void;
  onSlotDrop?: (e: React.DragEvent, qubit: number, column: number) => void;
  onGateHover?: (gateId: string | null) => void;
  onDragOverSlot?: (qubit: number, column: number) => void;
  onDragLeaveSlot?: () => void;
}>(({
  qIndex,
  columnIndices,
  gatesMap,
  selectedGateIds,
  highlightedGateId,
  inspectedGateId,
  dragOverSlot,
  activePaletteGate,
  isWireActive,
  isQubitHighlighted,
  isSlotDisabled,
  onSelectGate,
  onDeleteGate,
  onSlotClick,
  onSlotDrop,
  onGateHover,
  onDragOverSlot,
  onDragLeaveSlot,
}) => {
  // Debounce drag over events
  const dragOverTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleDragOver = useCallback((colIndex: number, e: React.DragEvent) => {
    if (isSlotDisabled) return;
    e.preventDefault();

    if (dragOverTimeoutRef.current) clearTimeout(dragOverTimeoutRef.current);
    dragOverTimeoutRef.current = setTimeout(() => {
      onDragOverSlot?.(qIndex, colIndex);
    }, 16); // ~60fps
  }, [qIndex, isSlotDisabled, onDragOverSlot]);

  return (
    <div
      className={`qubit-wire-row ${isWireActive ? 'wire-active' : ''} ${isQubitHighlighted ? 'wire-highlighted' : ''}`}
      data-testid={`qubit-wire-${qIndex}`}
      style={{ height: QUBIT_ROW_HEIGHT }}
    >
      <div className="qubit-label-box">
        <span className="qubit-name">q[{qIndex}]</span>
      </div>

      <div className="quantum-wire-track">
        <div className={`wire-line ${isWireActive ? 'wire-line-active' : ''}`} />

        {columnIndices.map((colIndex) => {
          const gateKey = `${qIndex}-${colIndex}`;
          const placedGate = gatesMap.get(gateKey);

          const isDragOver = dragOverSlot?.qubit === qIndex && dragOverSlot?.col === colIndex;
          const isSelected = Boolean(placedGate && placedGate.id && selectedGateIds.includes(placedGate.id));
          const isHighlighted = Boolean(placedGate && placedGate.id === highlightedGateId);
          const isInspected = Boolean(placedGate && placedGate.id === inspectedGateId);

          return (
            <GateSlot
              key={colIndex}
              qIndex={qIndex}
              colIndex={colIndex}
              placedGate={placedGate}
              isDragOver={isDragOver}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              isInspected={isInspected}
              isSlotDisabled={isSlotDisabled}
              activePaletteGate={activePaletteGate}
              onSlotClick={onSlotClick}
              onSlotDrop={onSlotDrop}
              onSelectGate={onSelectGate}
              onDeleteGate={onDeleteGate}
              onGateHover={onGateHover}
              onDragOver={handleDragOver}
              onDragLeaveSlot={onDragLeaveSlot}
            />
          );
        })}
      </div>
    </div>
  );
});

QubitRow.displayName = 'QubitRow';

/**
 * Optimized GateSlot component
 */
const GateSlot = memo<{
  qIndex: number;
  colIndex: number;
  placedGate?: CanonicalGate;
  isDragOver: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isInspected: boolean;
  isSlotDisabled: boolean;
  activePaletteGate: string | null;
  onSlotClick?: (qubit: number, column: number) => void;
  onSlotDrop?: (e: React.DragEvent, qubit: number, column: number) => void;
  onSelectGate?: (gateId: string | null, multi?: boolean) => void;
  onDeleteGate?: (gateId: string) => void;
  onGateHover?: (gateId: string | null) => void;
  onDragOver: (colIndex: number, e: React.DragEvent) => void;
  onDragLeaveSlot?: () => void;
}>(({
  qIndex,
  colIndex,
  placedGate,
  isDragOver,
  isSelected,
  isHighlighted,
  isInspected,
  isSlotDisabled,
  activePaletteGate,
  onSlotClick,
  onSlotDrop,
  onSelectGate,
  onDeleteGate,
  onGateHover,
  onDragOver,
  onDragLeaveSlot,
}) => {
  // Click interaction removed - drag and drop only
  const handleClick = useCallback(() => {
    // Disabled: drag and drop only mode
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    onDragOver(colIndex, e);
  }, [colIndex, onDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (isSlotDisabled) return;
    onSlotDrop?.(e, qIndex, colIndex);
  }, [isSlotDisabled, qIndex, colIndex, onSlotDrop]);

  if (placedGate) {
    return (
      <div className="gate-grid-slot" data-testid={`slot-${qIndex}-${colIndex}`}>
        <SimpleGateBox
          gate={placedGate}
          isSelected={isSelected}
          isHighlighted={isHighlighted}
          isInspected={isInspected}
          onSelect={onSelectGate}
          onDelete={onDeleteGate}
          onHover={onGateHover}
        />
      </div>
    );
  }

  return (
    <div
      className={`gate-grid-slot ${isDragOver ? 'drag-over-highlight' : ''}`}
      data-testid={`slot-${qIndex}-${colIndex}`}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeaveSlot}
      onDrop={handleDrop}
      title={isSlotDisabled ? '' : 'Drop gate here'}
    />
  );
});

GateSlot.displayName = 'GateSlot';

/**
 * Simplified gate box for performance
 */
const SimpleGateBox = memo<{
  gate: CanonicalGate;
  isSelected: boolean;
  isHighlighted: boolean;
  isInspected: boolean;
  onSelect?: (gateId: string | null, multi?: boolean) => void;
  onDelete?: (gateId: string) => void;
  onHover?: (gateId: string | null) => void;
}>(({ gate, isSelected, isHighlighted, isInspected, onSelect, onDelete, onHover }) => {
  const gateName = gate.gate?.toUpperCase() || gate.type?.toUpperCase() || '?';
  const gateInfo = IBM_OPERATIONS_PALETTE.find((g) => g.id === gate.gate?.toLowerCase());
  const gateColor = gateInfo?.color || '#3b82f6';

  return (
    <div
      className={`gate-box ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isInspected ? 'inspected' : ''}`}
      style={{ borderColor: gateColor, background: `${gateColor}15` }}
      onClick={() => onSelect?.(gate.id || null)}
      onMouseEnter={() => onHover?.(gate.id || null)}
      onMouseLeave={() => onHover?.(null)}
      title={gateName}
    >
      <span className="gate-label">{gateName}</span>
      {gate.angle && <span className="gate-angle">{(gate.angle / Math.PI).toFixed(2)}π</span>}
    </div>
  );
});

SimpleGateBox.displayName = 'SimpleGateBox';

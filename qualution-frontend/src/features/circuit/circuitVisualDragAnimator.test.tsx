import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CircuitEngine } from './circuitEngine';
import { CircuitDriverCoordinator, CursorTelemetry } from './circuitDrivers';
import {
  VisualCircuitDragAnimator,
  inOutQuint,
  resolveElementCenter,
  DragStep,
} from './circuitVisualDragAnimator';
import { CircuitRenderer } from '../../components/circuit/CircuitRenderer';

describe('Phase 8: Physical Visual Cursor Drag Animation', () => {
  it('verifies inOutQuint easing mathematical curve', () => {
    expect(inOutQuint(0)).toBe(0);
    expect(inOutQuint(1)).toBe(1);
    expect(inOutQuint(0.5)).toBe(0.5);

    // Initial slow ease-in acceleration (t^5)
    expect(inOutQuint(0.1)).toBeCloseTo(0.00016, 4);
    // Smooth deceleration near the target
    expect(inOutQuint(0.9)).toBeCloseTo(0.99984, 4);
  });

  it('RULE 1: Computes coordinates at runtime via getBoundingClientRect() on real DOM elements', () => {
    const dummyPalette = document.createElement('button');
    dummyPalette.setAttribute('data-testid', 'palette-gate-h');
    vi.spyOn(dummyPalette, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 150,
      width: 44,
      height: 44,
      right: 144,
      bottom: 194,
      x: 100,
      y: 150,
      toJSON: () => {},
    });

    const paletteCenter = resolveElementCenter(dummyPalette);
    expect(paletteCenter.x).toBe(122); // 100 + 44/2
    expect(paletteCenter.y).toBe(172); // 150 + 44/2

    const dummySlot = document.createElement('div');
    dummySlot.setAttribute('data-testid', 'slot-0-0');
    vi.spyOn(dummySlot, 'getBoundingClientRect').mockReturnValue({
      left: 360,
      top: 240,
      width: 50,
      height: 42,
      right: 410,
      bottom: 282,
      x: 360,
      y: 240,
      toJSON: () => {},
    });

    const slotCenter = resolveElementCenter(dummySlot);
    expect(slotCenter.x).toBe(385); // 360 + 50/2
    expect(slotCenter.y).toBe(261); // 240 + 42/2
  });

  it('RULES 1, 2, 4, 5 (HUMAN CHECKPOINT): Executes complete 5-step physical drag lifecycle for a single Hadamard gate placement on persistent single canvas', async () => {
    // ── Setup DOM container with Palette Gate and Persistent Circuit Canvas ──
    const engine = new CircuitEngine({ qubits: 2, classical_bits: 2, gates: [] });
    const coordinator = new CircuitDriverCoordinator(engine, 'locked');
    const scriptedDriver = coordinator.scriptedDriver;

    const recordedSteps: DragStep[] = [];
    const emittedTelemetry: CursorTelemetry[] = [];

    const unsubscribeTelemetry = scriptedDriver.onCursorUpdate((t) => {
      emittedTelemetry.push({ ...t });
    });

    // 1. Initial State: 0 gates on canvas
    expect(engine.getState().gates).toHaveLength(0);

    const { rerender, container } = render(
      <div>
        <div className="palette-container">
          <button
            type="button"
            data-testid="palette-gate-h"
            data-gate="h"
            className="palette-item"
          >
            H
          </button>
        </div>
        <CircuitRenderer state={engine.getState()} isLocked={true} />
      </div>
    );

    const paletteElement = screen.getByTestId('palette-gate-h');
    const slotElement = screen.getByTestId('slot-0-0');

    // Mock realistic layout coordinates for DOM elements
    vi.spyOn(paletteElement, 'getBoundingClientRect').mockReturnValue({
      left: 80,
      top: 120,
      width: 40,
      height: 40,
      right: 120,
      bottom: 160,
      x: 80,
      y: 120,
      toJSON: () => {},
    });

    vi.spyOn(slotElement, 'getBoundingClientRect').mockReturnValue({
      left: 380,
      top: 200,
      width: 48,
      height: 42,
      right: 428,
      bottom: 242,
      x: 380,
      y: 200,
      toJSON: () => {},
    });

    // Verify initially no placed gate
    expect(screen.queryByTestId('placed-gate-h-0')).not.toBeInTheDocument();

    // ── Run Physical Drag Placement for Single Hadamard Gate ──
    let placedGateResult = null;
    await act(async () => {
      placedGateResult = await scriptedDriver.placeGateWithVisualDrag({
        gateType: 'h',
        qubit: 0,
        column: 0,
        speedPxPerMs: 1.5, // fast rate for test
        delayMultiplier: 0.05, // test scaling
        onStepChange: (step) => {
          recordedSteps.push(step);
          // Mid-lifecycle assertion: prior to DROP, placeGate must NOT have been called yet!
          if (step === 'hover' || step === 'pickup' || step === 'drag' || step === 'target_hover') {
            expect(engine.getState().gates).toHaveLength(0);
          }
        },
      });
    });

    // ── Verify 5-Step Lifecycle Execution Sequence ──
    expect(recordedSteps).toEqual([
      'hover',
      'pickup',
      'drag',
      'target_hover',
      'drop',
      'release',
    ]);

    // ── Verify Step 1: HOVER Telemetry ──
    const hoverTelemetries = emittedTelemetry.filter((t) => t.label?.includes('Hovering H'));
    expect(hoverTelemetries.length).toBeGreaterThanOrEqual(1);
    expect(hoverTelemetries[0].x).toBe(100); // 80 + 40/2
    expect(hoverTelemetries[0].y).toBe(140); // 120 + 40/2
    expect(hoverTelemetries[0].isClicking).toBe(false);

    // ── Verify Step 2: PICKUP Telemetry ──
    const pickupTelemetries = emittedTelemetry.filter((t) => t.label?.includes('Picked up H'));
    expect(pickupTelemetries.length).toBeGreaterThanOrEqual(1);
    expect(pickupTelemetries[0].isClicking).toBe(true);
    expect(pickupTelemetries[0].draggingGate).toBe('H');

    // ── Verify Step 3: DRAG Arc Trajectory Telemetry ──
    const dragTelemetries = emittedTelemetry.filter(
      (t) => t.isClicking && t.draggingGate === 'H' && !t.label && !t.isDropping
    );
    expect(dragTelemetries.length).toBeGreaterThanOrEqual(3);

    // Check that start of drag is near palette and end of drag is near slot
    expect(dragTelemetries[0].x).toBeGreaterThanOrEqual(100);
    const lastDragFrame = dragTelemetries[dragTelemetries.length - 1];
    expect(lastDragFrame.x).toBeCloseTo(404, -1); // destination slot center: 380 + 48/2 = 404

    // ── Verify Step 4: TARGET HOVER Telemetry ──
    const targetHoverTelemetries = emittedTelemetry.filter(
      (t) => t.label === 'q[0] col 0' && t.targetSlot?.qubit === 0 && t.targetSlot?.column === 0
    );
    expect(targetHoverTelemetries.length).toBeGreaterThanOrEqual(1);
    expect(targetHoverTelemetries[0].x).toBe(404); // slot center X
    expect(targetHoverTelemetries[0].y).toBe(221); // slot center Y: 200 + 42/2 = 221

    // ── Verify Step 5: DROP (settle THEN placeGate) ──
    const dropTelemetries = emittedTelemetry.filter((t) => t.isDropping);
    expect(dropTelemetries.length).toBeGreaterThanOrEqual(1);
    expect(placedGateResult).not.toBeNull();
    expect((placedGateResult as any)?.type).toBe('h');

    // Verify engine now has the placed Hadamard gate
    expect(engine.getState().gates).toHaveLength(1);
    expect(engine.getState().gates[0].type).toBe('h');
    expect(engine.getState().gates[0].targets).toEqual([0]);
    expect(engine.getState().gates[0].column).toBe(0);

    // ── Verify Step 6 / RULE 4: Visible Lift and Fade Out ──
    const releaseTelemetries = emittedTelemetry.filter((t) => t.isVisible === false);
    expect(releaseTelemetries.length).toBeGreaterThanOrEqual(1);
    // Cursor lifted diagonally away: 404 + 24 = 428, 221 - 24 = 197
    const lastTelemetry = emittedTelemetry[emittedTelemetry.length - 1];
    expect(lastTelemetry.isVisible).toBe(false);

    // ── RULE 5: Persistent Single Canvas (Rerender same DOM instance) ──
    rerender(
      <div>
        <div className="palette-container">
          <button type="button" data-testid="palette-gate-h" className="palette-item">
            H
          </button>
        </div>
        <CircuitRenderer state={engine.getState()} isLocked={true} />
      </div>
    );

    // The single Hadamard gate is rendered directly in the DOM
    const placedGateEl = screen.getByTestId('placed-gate-h-0');
    expect(placedGateEl).toBeInTheDocument();
    expect(placedGateEl).toHaveTextContent('H');

    unsubscribeTelemetry();
  });

  it('RULE 3: Places multi-qubit CX gate endpoints and renders animated SVG connector line', async () => {
    const engine = new CircuitEngine({ qubits: 2, classical_bits: 2, gates: [] });
    const coordinator = new CircuitDriverCoordinator(engine, 'locked');
    const scriptedDriver = coordinator.scriptedDriver;

    // Place multi-qubit CX across q0 and q1 at column 1
    const connectedCX = await scriptedDriver.placeMultiQubitGateWithVisualDrag({
      gateType: 'cx',
      targets: [0, 1],
      column: 1,
      speedPxPerMs: 2.0,
      delayMultiplier: 0.05,
      fallbackPaletteCoords: { x: 100, y: 150 },
      fallbackSlotCoords: [
        { x: 350, y: 200 },
        { x: 350, y: 260 },
      ],
    });

    expect(connectedCX).not.toBeNull();
    expect(connectedCX?.type).toBe('cx');
    expect(connectedCX?.targets).toEqual([0, 1]);
    expect(connectedCX?.column).toBe(1);

    // Render persistent canvas with the placed CX gate
    const { container } = render(<CircuitRenderer state={engine.getState()} />);

    // Control node on q0, Target node on q1
    expect(screen.getAllByTestId('placed-gate-cx-1')).toHaveLength(2);

    // SVG connector line rendered with stroke-dashoffset animation
    const connectorLine = screen.getByTestId('two-qubit-connector-line');
    expect(connectorLine).toBeInTheDocument();

    const svgLine = connectorLine.querySelector('line.animated-connector-svg-line');
    expect(svgLine).toBeInTheDocument();
    expect(svgLine).toHaveAttribute('stroke-dasharray', '58'); // (maxTarget 1 - minTarget 0) * 58
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  CircuitDriverCoordinator,
  UserInputDriver,
  ScriptedDriver,
  CursorTelemetry,
  ScriptedStep,
} from './circuitDrivers';
import { CircuitEngine } from './circuitEngine';
import { CircuitRenderer } from '../../components/circuit/CircuitRenderer';

describe('Circuit Drivers & Lock Flag Coordination', () => {
  it('TASK 1: UserInputDriver calls engine mutations directly when unlocked', () => {
    const coordinator = new CircuitDriverCoordinator(undefined, 'unlocked');
    const userDriver = coordinator.userInputDriver;

    expect(coordinator.isLocked()).toBe(false);
    expect(coordinator.getState().gates).toHaveLength(0);

    // 1. User drags H gate onto q0 at column 0
    const gateH = userDriver.handleSlotDrop('h', 0, 0);
    expect(gateH).not.toBeNull();
    expect(gateH?.type).toBe('h');
    expect(gateH?.targets).toEqual([0]);
    expect(gateH?.column).toBe(0);
    expect(coordinator.getState().gates).toHaveLength(1);

    // 2. User connects q0 and q1 at column 1 (CX entangling gate)
    const gateCX = userDriver.handleConnectGates([0, 1], 1, 'cx');
    expect(gateCX).not.toBeNull();
    expect(gateCX?.type).toBe('cx');
    expect(gateCX?.targets).toEqual([0, 1]);
    expect(coordinator.getState().gates).toHaveLength(2);

    // 3. User clicks slot to place gate
    const gateX = userDriver.handleSlotClick(1, 2, 'x');
    expect(gateX?.type).toBe('x');
    expect(coordinator.getState().gates).toHaveLength(3);

    // 4. Render to DOM and verify wires and gates are present
    render(<CircuitRenderer state={coordinator.getState()} />);
    expect(screen.getByTestId('placed-gate-h-0')).toBeInTheDocument();
    expect(screen.getAllByTestId('placed-gate-cx-1')).toHaveLength(2);
    expect(screen.getByTestId('placed-gate-x-2')).toBeInTheDocument();
    expect(screen.getByTestId('two-qubit-connector-line')).toBeInTheDocument();
  });

  it('TASK 2: ScriptedDriver executes placement sequence with cursor telemetry visual', async () => {
    const coordinator = new CircuitDriverCoordinator(undefined, 'locked');
    const scriptedDriver = coordinator.scriptedDriver;

    expect(coordinator.isLocked()).toBe(true);

    const emittedTelemetry: CursorTelemetry[] = [];
    const unsubscribeCursor = scriptedDriver.onCursorUpdate((telemetry) => {
      emittedTelemetry.push(telemetry);
    });

    const script: ScriptedStep[] = [
      {
        action: 'place_gate',
        gateType: 'h',
        targets: [0],
        column: 0,
        cursor: {
          x: 120,
          y: 80,
          label: 'Hovering H from palette',
          draggingGate: 'H',
        },
      },
      {
        action: 'place_gate',
        gateType: 'x',
        targets: [1],
        column: 1,
        cursor: {
          x: 280,
          y: 140,
          label: 'Placing X on q[1]',
          isClicking: true,
          isDropping: true,
          draggingGate: 'X',
        },
      },
      {
        action: 'connect_gates',
        gateType: 'cz',
        targets: [0, 1],
        column: 2,
        cursor: {
          x: 420,
          y: 110,
          label: 'Connecting CZ: q[0] ↔ q[1]',
          isClicking: true,
          draggingGate: 'CZ',
        },
      },
    ];

    const success = await scriptedDriver.runScript(script, { stepDelayMs: 1 });
    expect(success).toBe(true);

    // Verify telemetry was emitted to drive cursor visual
    expect(emittedTelemetry.length).toBeGreaterThanOrEqual(3);
    expect(emittedTelemetry[0].label).toBe('Hovering H from palette');
    expect(emittedTelemetry[1].isDropping).toBe(true);
    expect(emittedTelemetry[2].label).toBe('Connecting CZ: q[0] ↔ q[1]');

    // Verify engine state was updated through the SAME underlying functions
    const state = coordinator.getState();
    expect(state.gates).toHaveLength(3);
    expect(state.gates[0].type).toBe('h');
    expect(state.gates[1].type).toBe('x');
    expect(state.gates[2].type).toBe('cz');

    // Verify exact same CircuitRenderer renders the scripted gates
    render(<CircuitRenderer state={state} />);
    expect(screen.getByTestId('placed-gate-h-0')).toBeInTheDocument();
    expect(screen.getByTestId('placed-gate-x-1')).toBeInTheDocument();
    expect(screen.getAllByTestId('placed-gate-cz-2')).toHaveLength(2);

    unsubscribeCursor();
  });

  it('HUMAN CHECKPOINT: Toggles lock flag to seamlessly pass control between scripted driver and real drag-and-drop on the exact same rendered circuit', async () => {
    // Shared engine and coordinator
    const engine = new CircuitEngine({ qubits: 2, gates: [] });
    const coordinator = new CircuitDriverCoordinator(engine, 'locked');
    const scriptedDriver = coordinator.scriptedDriver;
    const userDriver = coordinator.userInputDriver;

    // ── Phase A: In "locked" mode, user input is disabled ──
    expect(coordinator.getLockMode()).toBe('locked');
    expect(coordinator.isLocked()).toBe(true);

    // Real user attempts to drag-and-drop a gate — MUST be blocked
    const blockedUserDrop = userDriver.handleSlotDrop('h', 0, 0);
    expect(blockedUserDrop).toBeNull();
    expect(engine.getState().gates).toHaveLength(0); // State unchanged!

    // Scripted driver runs demonstration on the circuit
    await scriptedDriver.executeStep({
      action: 'place_gate',
      gateType: 'h',
      targets: [0],
      column: 0,
      cursor: { x: 200, y: 100, label: 'Teacher placing H' },
    });
    expect(engine.getState().gates).toHaveLength(1);
    expect(engine.getState().gates[0].type).toBe('h');

    // ── Phase B: Toggle lock flag to "unlocked" (Hand control to learner) ──
    const newMode = coordinator.toggleLock();
    expect(newMode).toBe('unlocked');
    expect(coordinator.isLocked()).toBe(false);

    // Scripted driver is now blocked from mutating
    const blockedScriptedStep = await scriptedDriver.executeStep({
      action: 'place_gate',
      gateType: 'z',
      targets: [0],
      column: 2,
    });
    expect(blockedScriptedStep).toBeNull();
    expect(engine.getState().gates).toHaveLength(1); // No change from script!

    // Real user now has full interactive control: drags CX onto circuit
    const allowedUserDrop = userDriver.handleConnectGates([0, 1], 1, 'cx');
    expect(allowedUserDrop).not.toBeNull();
    expect(allowedUserDrop?.type).toBe('cx');
    expect(engine.getState().gates).toHaveLength(2);

    // Real user places another gate
    const allowedUserX = userDriver.handleSlotDrop('x', 1, 2);
    expect(allowedUserX).not.toBeNull();
    expect(engine.getState().gates).toHaveLength(3);

    // ── Phase C: Toggle lock flag back to "locked" (Resume demonstration) ──
    coordinator.lock();
    expect(coordinator.isLocked()).toBe(true);

    // User input is once again disabled
    const userAttemptWhileLocked = userDriver.handleSlotDrop('z', 0, 3);
    expect(userAttemptWhileLocked).toBeNull();
    expect(engine.getState().gates).toHaveLength(3);

    // Scripted driver resumes and places final gate
    await scriptedDriver.executeStep({
      action: 'place_gate',
      gateType: 'measure',
      targets: [0],
      column: 3,
    });
    expect(engine.getState().gates).toHaveLength(4);

    // ── Phase D: Verify rendering on the exact same circuit ──
    const { rerender } = render(
      <CircuitRenderer state={engine.getState()} isLocked={coordinator.isLocked()} />
    );

    // Assert all 4 gates rendered into the DOM on the same canvas:
    // 1. Scripted H
    expect(screen.getByTestId('placed-gate-h-0')).toBeInTheDocument();
    // 2. Real user CX
    expect(screen.getAllByTestId('placed-gate-cx-1')).toHaveLength(2);
    // 3. Real user X
    expect(screen.getByTestId('placed-gate-x-2')).toBeInTheDocument();
    // 4. Scripted Measure
    expect(screen.getByTestId('placed-gate-measure-3')).toBeInTheDocument();

    // Verify lock state disables slot interaction in DOM
    const slot03 = screen.getByTestId('slot-0-3');
    expect(slot03).toHaveAttribute('tabindex', '-1');

    // Unlock and verify DOM becomes interactively unlocked
    coordinator.unlock();
    rerender(
      <CircuitRenderer state={engine.getState()} isLocked={coordinator.isLocked()} />
    );
    const emptySlot = screen.getByTestId('slot-1-0');
    expect(emptySlot).toHaveAttribute('tabindex', '0');
  });

  it('notifies subscribers reactively when lock mode changes', () => {
    const coordinator = new CircuitDriverCoordinator(undefined, 'unlocked');
    const lockEvents: string[] = [];

    const unsubscribe = coordinator.subscribeLock((mode) => {
      lockEvents.push(mode);
    });

    coordinator.lock();
    coordinator.unlock();
    coordinator.toggleLock();

    expect(lockEvents).toEqual(['locked', 'unlocked', 'locked']);

    unsubscribe();
    coordinator.unlock();
    expect(lockEvents).toEqual(['locked', 'unlocked', 'locked']);
  });
});

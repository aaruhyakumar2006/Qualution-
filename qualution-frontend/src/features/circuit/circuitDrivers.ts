/**
 * circuitDrivers.ts
 *
 * Implements two distinct drivers for the canonical CircuitEngine:
 * 1. UserInputDriver: handles real user drag-and-drop, mouse clicks, and keyboard mutations.
 * 2. ScriptedDriver: programmatically calls placeGate/connectGates on a script-defined timeline,
 *    emitting cursor telemetry to visually animate the placement sequence.
 *
 * Governed by a simple lock flag:
 * - "locked": Only the scripted driver may call the engine. User input is visually present but disabled.
 * - "unlocked": Only real user input may call the engine. The scripted driver is paused.
 *
 * Replaces all need for DOM cloning or component swapping: both drivers call the exact same
 * underlying CircuitEngine instance and render into the exact same CircuitRenderer component.
 */

import {
  CircuitEngine,
  type CanonicalCircuitState,
  type CanonicalGate,
  createCanonicalCircuitState,
} from './circuitEngine';
import type { CircuitRequest } from './types';
import {
  VisualCircuitDragAnimator,
  type VisualDragOptions,
  type MultiQubitVisualDragOptions,
} from './circuitVisualDragAnimator';

export type DriverLockMode = 'locked' | 'unlocked';

export interface CursorTelemetry {
  x: number;
  y: number;
  isVisible: boolean;
  isClicking?: boolean;
  isDropping?: boolean;
  label?: string;
  draggingGate?: string;
  targetSlot?: { qubit: number; column: number };
}

export interface ScriptedStep {
  id?: string;
  action: 'place_gate' | 'connect_gates' | 'remove_gate' | 'move_cursor' | 'pause';
  gateType?: string;
  targets?: number[];
  column?: number;
  gateId?: string;
  angle?: number;
  name?: string;
  durationMs?: number;
  cursor?: {
    x?: number;
    y?: number;
    label?: string;
    isClicking?: boolean;
    isDropping?: boolean;
    draggingGate?: string;
  };
}

// ── 1. CircuitDriverCoordinator ────────────────────────────────────────

export class CircuitDriverCoordinator {
  private engine: CircuitEngine;
  private lockMode: DriverLockMode;
  private lockListeners: Set<(mode: DriverLockMode) => void> = new Set();
  public userInputDriver: UserInputDriver;
  public scriptedDriver: ScriptedDriver;

  constructor(
    engine?: CircuitEngine,
    initialMode: DriverLockMode = 'unlocked'
  ) {
    this.engine = engine || new CircuitEngine();
    this.lockMode = initialMode;

    this.userInputDriver = new UserInputDriver(this.engine, this);
    this.scriptedDriver = new ScriptedDriver(this.engine, this);
  }

  public getEngine(): CircuitEngine {
    return this.engine;
  }

  public getState(): CanonicalCircuitState {
    return this.engine.getState();
  }

  public toCircuitRequest(): CircuitRequest {
    return this.engine.toCircuitRequest();
  }

  public getLockMode(): DriverLockMode {
    return this.lockMode;
  }

  public isLocked(): boolean {
    return this.lockMode === 'locked';
  }

  public setLockMode(mode: DriverLockMode): void {
    if (this.lockMode !== mode) {
      this.lockMode = mode;
      this.notifyLockChange();
    }
  }

  public lock(): void {
    this.setLockMode('locked');
  }

  public unlock(): void {
    this.setLockMode('unlocked');
  }

  public toggleLock(): DriverLockMode {
    const next = this.lockMode === 'locked' ? 'unlocked' : 'locked';
    this.setLockMode(next);
    return next;
  }

  public subscribeLock(listener: (mode: DriverLockMode) => void): () => void {
    this.lockListeners.add(listener);
    return () => {
      this.lockListeners.delete(listener);
    };
  }

  private notifyLockChange(): void {
    this.lockListeners.forEach((l) => {
      try {
        l(this.lockMode);
      } catch (err) {
        console.error('[CircuitDriverCoordinator] Error in lock listener:', err);
      }
    });
  }
}

// ── 2. UserInputDriver ─────────────────────────────────────────────────

export class UserInputDriver {
  private engine: CircuitEngine;
  private coordinator: CircuitDriverCoordinator;

  constructor(engine: CircuitEngine, coordinator: CircuitDriverCoordinator) {
    this.engine = engine;
    this.coordinator = coordinator;
  }

  /**
   * Invoked on real user drag-and-drop of a gate from the palette onto a wire slot.
   * Blocked when coordinator is locked.
   */
  public handleSlotDrop(
    gateType: string,
    targetQubit: number,
    column: number,
    options?: { angle?: number; name?: string; id?: string }
  ): CanonicalGate | null {
    if (this.coordinator.isLocked()) {
      return null;
    }
    return this.engine.placeGate(gateType, [targetQubit], column, options);
  }

  /**
   * Invoked on user click/tap on a wire slot (e.g. tap-to-place with active palette gate or keyboard Enter).
   * Blocked when coordinator is locked.
   */
  public handleSlotClick(
    targetQubit: number,
    column: number,
    activePaletteGate?: string | null
  ): CanonicalGate | null {
    if (this.coordinator.isLocked()) {
      return null;
    }
    const gateToPlace = (activePaletteGate || 'h').toLowerCase();
    return this.engine.placeGate(gateToPlace, [targetQubit], column);
  }

  /**
   * Invoked on user connecting multiple target wires (e.g. CX control/target or CZ multi-wire connection).
   * Blocked when coordinator is locked.
   */
  public handleConnectGates(
    targets: number[],
    column: number,
    gateType?: string
  ): CanonicalGate | null {
    if (this.coordinator.isLocked()) {
      return null;
    }
    return this.engine.connectGates(targets, column, gateType);
  }

  /**
   * Invoked when user deletes a gate (via Delete key or inspector button).
   * Blocked when coordinator is locked.
   */
  public handleDeleteGate(gateId: string): boolean {
    if (this.coordinator.isLocked()) {
      return false;
    }
    return this.engine.removeGate(gateId);
  }

  /**
   * Invoked on user moving an existing gate across slots.
   * Blocked when coordinator is locked.
   */
  public handleMoveGate(
    gateId: string,
    targetQubit: number,
    targetColumn: number
  ): CanonicalGate | null {
    if (this.coordinator.isLocked()) {
      return null;
    }
    const currentGate = this.engine.getState().gates.find((g) => g.id === gateId);
    if (!currentGate) return null;

    // Remove old gate and place at new coordinate
    this.engine.removeGate(gateId);
    const newTargets = currentGate.targets.length > 1
      ? [targetQubit, ...currentGate.targets.slice(1)]
      : [targetQubit];

    return this.engine.placeGate(currentGate.type, newTargets, targetColumn, {
      id: currentGate.id,
      angle: currentGate.angle,
      name: currentGate.name,
    });
  }
}

// ── 3. ScriptedDriver ──────────────────────────────────────────────────

export class ScriptedDriver {
  private engine: CircuitEngine;
  private coordinator: CircuitDriverCoordinator;
  private cursorListeners: Set<(cursor: CursorTelemetry) => void> = new Set();
  private isScriptRunning: boolean = false;
  private pauseRequested: boolean = false;

  constructor(engine: CircuitEngine, coordinator: CircuitDriverCoordinator) {
    this.engine = engine;
    this.coordinator = coordinator;
  }

  /**
   * Subscribes to visual cursor telemetry emitted during scripted placement demonstrations.
   */
  public onCursorUpdate(listener: (cursor: CursorTelemetry) => void): () => void {
    this.cursorListeners.add(listener);
    return () => {
      this.cursorListeners.delete(listener);
    };
  }

  private emitCursor(cursor: CursorTelemetry): void {
    this.cursorListeners.forEach((l) => {
      try {
        l(cursor);
      } catch (err) {
        console.error('[ScriptedDriver] Error in cursor listener:', err);
      }
    });
  }

  /**
   * Directly executes a single scripted step.
   * Only permitted when coordinator is locked.
   */
  public async executeStep(step: ScriptedStep): Promise<CanonicalGate | boolean | null> {
    if (!this.coordinator.isLocked()) {
      console.warn('[ScriptedDriver] Cannot execute scripted step: circuit is unlocked.');
      return null;
    }

    // 1. Emit cursor animation state if step specifies cursor telemetry
    if (step.cursor) {
      this.emitCursor({
        x: step.cursor.x ?? 0,
        y: step.cursor.y ?? 0,
        isVisible: true,
        isClicking: Boolean(step.cursor.isClicking),
        isDropping: Boolean(step.cursor.isDropping),
        label: step.cursor.label,
        draggingGate: step.cursor.draggingGate || step.gateType,
        targetSlot:
          step.targets && step.column !== undefined
            ? { qubit: step.targets[0], column: step.column }
            : undefined,
      });
    }

    if (step.durationMs && step.durationMs > 0) {
      await new Promise((r) => setTimeout(r, step.durationMs));
    }

    // 2. Call the EXACT SAME underlying CircuitEngine functions
    switch (step.action) {
      case 'place_gate': {
        if (!step.gateType || !step.targets || step.column === undefined) {
          throw new Error('place_gate step requires gateType, targets, and column.');
        }
        return this.engine.placeGate(step.gateType, step.targets, step.column, {
          angle: step.angle,
          name: step.name,
          id: step.gateId,
        });
      }
      case 'connect_gates': {
        if (!step.targets || step.column === undefined) {
          throw new Error('connect_gates step requires targets and column.');
        }
        return this.engine.connectGates(step.targets, step.column, step.gateType);
      }
      case 'remove_gate': {
        if (!step.gateId) {
          throw new Error('remove_gate step requires gateId.');
        }
        return this.engine.removeGate(step.gateId);
      }
      case 'move_cursor': {
        return true;
      }
      case 'pause': {
        return true;
      }
      default:
        return null;
    }
  }

  /**
   * Runs an entire sequence of scripted steps sequentially with visual cursor animation.
   * If at any point the circuit is unlocked, the scripted driver yields/pauses immediately.
   */
  public async runScript(
    steps: ScriptedStep[],
    options?: {
      stepDelayMs?: number;
      onStep?: (index: number, step: ScriptedStep) => void;
    }
  ): Promise<boolean> {
    this.isScriptRunning = true;
    this.pauseRequested = false;

    // Ensure coordinator is locked for scripted execution
    this.coordinator.lock();

    for (let i = 0; i < steps.length; i++) {
      if (this.pauseRequested || !this.coordinator.isLocked()) {
        this.isScriptRunning = false;
        return false; // Paused or aborted
      }

      const step = steps[i];
      options?.onStep?.(i, step);

      await this.executeStep(step);

      const delay = step.durationMs ?? options?.stepDelayMs ?? 50;
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    // Fade out cursor after script finishes
    this.emitCursor({
      x: 0,
      y: 0,
      isVisible: false,
    });

    this.isScriptRunning = false;
    return true;
  }

  /**
   * Pauses the script and switches the coordinator to "unlocked" so the user can take over.
   */
  public pauseAndHandOverToUser(): void {
    this.pauseRequested = true;
    this.isScriptRunning = false;
    this.emitCursor({ x: 0, y: 0, isVisible: false });
    this.coordinator.unlock();
  }

  /**
   * Resumes scripted control by switching back to "locked".
   */
  public resumeScriptedControl(): void {
    this.pauseRequested = false;
    this.coordinator.lock();
  }

  public isRunning(): boolean {
    return this.isScriptRunning;
  }

  /**
   * Executes a physical visual drag gate placement (Phase 8 Lifecycle)
   * following all 5 rules: HOVER -> PICKUP -> DRAG (inOutQuint arc) -> TARGET HOVER -> DROP -> RELEASE.
   */
  public async placeGateWithVisualDrag(
    options: VisualDragOptions
  ): Promise<CanonicalGate | null> {
    const animator = new VisualCircuitDragAnimator(this.coordinator);
    return animator.placeSingleGateWithPhysicalDrag(options);
  }

  /**
   * Executes multi-qubit physical drag placement (Rule 3)
   * placing both endpoints then animating the SVG connector line.
   */
  public async placeMultiQubitGateWithVisualDrag(
    options: MultiQubitVisualDragOptions
  ): Promise<CanonicalGate | null> {
    const animator = new VisualCircuitDragAnimator(this.coordinator);
    return animator.placeMultiQubitGateWithPhysicalDrag(options);
  }
}

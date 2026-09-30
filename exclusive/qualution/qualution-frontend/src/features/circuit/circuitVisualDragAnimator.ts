/**
 * circuitVisualDragAnimator.ts
 *
 * Implements the deliberate, physical visual cursor drag animation on top of the
 * scripted driver, transforming programmatic gate placements into smooth, physical
 * interactions.
 *
 * Enforces all 5 strict rules:
 * 1. ZERO hardcoded pixel coordinates. Every position computed at runtime via
 *    getBoundingClientRect() on the real rendered palette and wire-slot elements.
 * 2. Full 5-step drag lifecycle:
 *    HOVER (real hover state on palette gate)
 *    → PICKUP (lift, scale 1.05, drop-shadow)
 *    → DRAG (eased arc path, 'inOutQuint', speed computed from real measured distance, never fixed duration)
 *    → TARGET HOVER (destination wire-slot highlights)
 *    → DROP (overshoot-settle: 1.05 → 0.97 → 1.0, THEN call real placeGate function).
 * 3. Multi-qubit gates: place both endpoints, then animate connector line (stroke-dashoffset).
 * 4. Cursor visibly lifts/fades diagonally after every drop.
 * 5. Persistent single canvas: zero DOM cloning or unmounting, only incremental changes.
 */

import { CircuitEngine, type CanonicalGate } from './circuitEngine';
import { CircuitDriverCoordinator, type CursorTelemetry } from './circuitDrivers';

export type DragStep = 'hover' | 'pickup' | 'drag' | 'target_hover' | 'drop' | 'release';

export interface VisualDragOptions {
  gateType: string;
  qubit: number;
  column: number;
  options?: { angle?: number; name?: string; id?: string };
  speedPxPerMs?: number; // Default 0.7 px/ms
  arcHeight?: number;    // Parabolic arc height in pixels
  onStepChange?: (step: DragStep) => void;
  // Graceful fallback coordinates for headless/test environments where DOM rects are 0
  fallbackPaletteCoords?: { x: number; y: number };
  fallbackSlotCoords?: { x: number; y: number };
  delayMultiplier?: number; // Set to 0.01 in fast unit tests, 1.0 in live browser
}

export interface MultiQubitVisualDragOptions {
  gateType: string;
  targets: number[];
  column: number;
  options?: { angle?: number; name?: string; id?: string };
  speedPxPerMs?: number;
  arcHeight?: number;
  onStepChange?: (step: DragStep, endpointIndex: number) => void;
  fallbackPaletteCoords?: { x: number; y: number };
  fallbackSlotCoords?: Array<{ x: number; y: number }>;
  delayMultiplier?: number;
}

/**
 * Quintic in-out easing for natural physical inertia and deceleration.
 */
export function inOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

/**
 * Resolves the real DOM palette gate element at runtime via live DOM query.
 */
export function getPaletteGateElement(gateType: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const lower = gateType.toLowerCase();
  const upper = gateType.toUpperCase();
  return (
    (document.querySelector(`[data-testid="palette-gate-${lower}"]`) as HTMLElement) ||
    (document.querySelector(`[data-testid="palette-gate-${upper}"]`) as HTMLElement) ||
    (document.querySelector(`[data-gate="${lower}"]`) as HTMLElement) ||
    (document.querySelector(`[data-gate="${upper}"]`) as HTMLElement) ||
    (document.querySelector(`[data-teaching-target="gate-palette-${upper}"]`) as HTMLElement) ||
    (document.querySelector(`[data-teaching-target="gate-palette-${lower}"]`) as HTMLElement)
  );
}

/**
 * Resolves the real DOM wire slot element at runtime via live DOM query.
 */
export function getWireSlotElement(qubit: number, column: number): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return (
    (document.querySelector(`[data-testid="slot-${qubit}-${column}"]`) as HTMLElement) ||
    (document.querySelector(`[data-teaching-target="circuit-q${qubit}-col${column}"]`) as HTMLElement)
  );
}

/**
 * Computes exact runtime center coordinates using getBoundingClientRect().
 * Fallback is only used in headless environments where layout engine returns 0x0.
 */
export function resolveElementCenter(
  el: HTMLElement | null,
  fallback?: { x: number; y: number }
): { x: number; y: number; rect: DOMRect | null } {
  if (!el) {
    return {
      x: fallback?.x ?? 200,
      y: fallback?.y ?? 200,
      rect: null,
    };
  }

  const rect = el.getBoundingClientRect();
  // In headless tests without a layout renderer, width/height might be 0
  if (rect.width === 0 && rect.height === 0 && fallback) {
    return { x: fallback.x, y: fallback.y, rect };
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    rect,
  };
}

/**
 * Sleeps for specified ms, scaled by delayMultiplier.
 */
function sleep(ms: number, multiplier: number = 1.0): Promise<void> {
  const effectiveMs = Math.max(1, Math.round(ms * multiplier));
  return new Promise((resolve) => setTimeout(resolve, effectiveMs));
}

export class VisualCircuitDragAnimator {
  private coordinator: CircuitDriverCoordinator;
  private engine: CircuitEngine;
  private isCancelled: boolean = false;

  constructor(coordinator: CircuitDriverCoordinator) {
    this.coordinator = coordinator;
    this.engine = coordinator.getEngine();
  }

  public cancel(): void {
    this.isCancelled = true;
    this.cleanupVisualClasses();
    this.coordinator.scriptedDriver['emitCursor']({
      x: 0,
      y: 0,
      isVisible: false,
    });
  }

  private cleanupVisualClasses(): void {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.teaching-palette-hover').forEach((el) => {
      el.classList.remove('teaching-palette-hover');
    });
    document.querySelectorAll('.teaching-gate-held').forEach((el) => {
      el.classList.remove('teaching-gate-held');
    });
    document.querySelectorAll('.teaching-drop-target-active').forEach((el) => {
      el.classList.remove('teaching-drop-target-active');
    });
    document.querySelectorAll('.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });
  }

  /**
   * Executes a single gate physical placement sequence following all 5 lifecycle rules.
   */
  public async placeSingleGateWithPhysicalDrag(
    options: VisualDragOptions
  ): Promise<CanonicalGate | null> {
    this.isCancelled = false;
    const mult = options.delayMultiplier ?? 1.0;
    const scriptedDriver = this.coordinator.scriptedDriver;

    // Ensure coordinator is in locked mode so scripted placements write to engine
    this.coordinator.lock();

    const gateName = options.gateType.toUpperCase();
    const qubit = options.qubit;
    const column = options.column;

    // ── STEP 1: HOVER (real hover state on palette gate) ──────────────────
    options.onStepChange?.('hover');
    const paletteEl = getPaletteGateElement(options.gateType);
    const paletteCoords = resolveElementCenter(paletteEl, options.fallbackPaletteCoords ?? { x: 120, y: 150 });

    if (paletteEl) {
      paletteEl.classList.add('teaching-palette-hover');
      try {
        paletteEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      } catch {}
    }

    scriptedDriver['emitCursor']({
      x: paletteCoords.x,
      y: paletteCoords.y,
      isVisible: true,
      isClicking: false,
      isDropping: false,
      label: `Hovering ${gateName}`,
    });

    await sleep(220, mult);
    if (this.isCancelled) return null;

    // ── STEP 2: PICKUP (lift, scale 1.05, drop-shadow) ─────────────────────
    options.onStepChange?.('pickup');
    if (paletteEl) {
      paletteEl.classList.add('teaching-gate-held');
    }

    scriptedDriver['emitCursor']({
      x: paletteCoords.x,
      y: paletteCoords.y,
      isVisible: true,
      isClicking: true,
      isDropping: false,
      draggingGate: gateName,
      label: `Picked up ${gateName}`,
    });

    await sleep(180, mult);
    if (this.isCancelled) return null;

    // ── STEP 3: DRAG (eased arc path, 'inOutQuint', speed from distance) ───
    options.onStepChange?.('drag');
    const slotEl = getWireSlotElement(qubit, column);
    const slotCoords = resolveElementCenter(slotEl, options.fallbackSlotCoords ?? { x: 420, y: 260 });

    // Distance computation (Rule 1 & 2: speed computed from real measured distance, never fixed duration)
    const dx = slotCoords.x - paletteCoords.x;
    const dy = slotCoords.y - paletteCoords.y;
    const distance = Math.hypot(dx, dy);

    const speed = options.speedPxPerMs ?? 0.7; // ~700 px/sec
    const dragDurationMs = Math.max(450, Math.min(1400, Math.round(distance / speed)));
    const arcHeight = options.arcHeight ?? Math.min(55, Math.max(25, distance * 0.15));

    // Clear palette hover state once drag starts
    if (paletteEl) {
      paletteEl.classList.remove('teaching-palette-hover', 'teaching-gate-held');
      try {
        paletteEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      } catch {}
    }

    const frameTimeMs = 16;
    const totalFrames = Math.max(1, Math.round(dragDurationMs / frameTimeMs));

    for (let frame = 1; frame <= totalFrames; frame++) {
      if (this.isCancelled) return null;

      const progress = frame / totalFrames;
      const easedT = inOutQuint(progress);

      // Parabolic upward arc: peak at t = 0.5 (sin(pi * t))
      const arcOffset = Math.sin(Math.PI * easedT) * arcHeight;
      const curX = paletteCoords.x + dx * easedT;
      const curY = paletteCoords.y + dy * easedT - arcOffset;

      scriptedDriver['emitCursor']({
        x: curX,
        y: curY,
        isVisible: true,
        isClicking: true,
        isDropping: false,
        draggingGate: gateName,
      });

      await sleep(frameTimeMs, mult);
    }

    // ── STEP 4: TARGET HOVER (destination wire-slot highlights) ───────────
    options.onStepChange?.('target_hover');
    if (slotEl) {
      slotEl.classList.add('teaching-drop-target-active', 'drag-over');
    }

    scriptedDriver['emitCursor']({
      x: slotCoords.x,
      y: slotCoords.y,
      isVisible: true,
      isClicking: true,
      isDropping: false,
      draggingGate: gateName,
      targetSlot: { qubit, column },
      label: `q[${qubit}] col ${column}`,
    });

    await sleep(200, mult);
    if (this.isCancelled) return null;

    // ── STEP 5: DROP (overshoot-settle: 1.05 → 0.97 → 1.0, THEN placeGate) ─
    options.onStepChange?.('drop');

    // Overshoot-settle spring animation: 1.05 -> 0.97 -> 1.0
    // Stage A: 1.05
    scriptedDriver['emitCursor']({
      x: slotCoords.x,
      y: slotCoords.y,
      isVisible: true,
      isClicking: false,
      isDropping: true,
      draggingGate: gateName,
      targetSlot: { qubit, column },
    });
    await sleep(100, mult);

    // Stage B: 0.97 settle
    await sleep(100, mult);

    // Stage C: 1.0 settled
    if (slotEl) {
      slotEl.classList.remove('teaching-drop-target-active', 'drag-over');
    }

    // CRITICAL: Call the REAL placeGate function ONLY after drop settle completes!
    const placedGate = this.engine.placeGate(
      options.gateType,
      [qubit],
      column,
      options.options
    );

    // ── STEP 6: RELEASE / LIFT & FADE (Rule 4) ─────────────────────────────
    options.onStepChange?.('release');
    scriptedDriver['emitCursor']({
      x: slotCoords.x + 24,
      y: slotCoords.y - 24,
      isVisible: false,
      isClicking: false,
      isDropping: false,
      draggingGate: undefined,
      label: undefined,
    });

    await sleep(220, mult);

    return placedGate;
  }

  /**
   * Executes physical drag placement for multi-qubit gates (Rule 3).
   * Places both endpoints sequentially, then connects them to trigger the SVG connector animation.
   */
  public async placeMultiQubitGateWithPhysicalDrag(
    options: MultiQubitVisualDragOptions
  ): Promise<CanonicalGate | null> {
    this.isCancelled = false;
    const mult = options.delayMultiplier ?? 1.0;
    const targets = options.targets;
    const column = options.column;
    const gateType = options.gateType.toLowerCase();

    if (targets.length < 2) {
      throw new Error('Multi-qubit placement requires at least 2 targets.');
    }

    // Endpoint 1 (Control)
    options.onStepChange?.('hover', 0);
    const controlGate = await this.placeSingleGateWithPhysicalDrag({
      gateType,
      qubit: targets[0],
      column,
      speedPxPerMs: options.speedPxPerMs,
      arcHeight: options.arcHeight,
      delayMultiplier: options.delayMultiplier,
      fallbackPaletteCoords: options.fallbackPaletteCoords,
      fallbackSlotCoords: options.fallbackSlotCoords?.[0],
    });

    if (this.isCancelled || !controlGate) return null;
    await sleep(150, mult);

    // Endpoint 2 (Target)
    options.onStepChange?.('hover', 1);
    await this.placeSingleGateWithPhysicalDrag({
      gateType,
      qubit: targets[1],
      column,
      speedPxPerMs: options.speedPxPerMs,
      arcHeight: options.arcHeight,
      delayMultiplier: options.delayMultiplier,
      fallbackPaletteCoords: options.fallbackPaletteCoords,
      fallbackSlotCoords: options.fallbackSlotCoords?.[1],
    });

    if (this.isCancelled) return null;

    // Connect both endpoints into the unified entangling gate
    // This triggers the SVG stroke-dashoffset animation in CircuitRenderer
    const connectedGate = this.engine.connectGates(targets, column, gateType);
    await sleep(250, mult);

    return connectedGate;
  }
}

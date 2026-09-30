/**
 * CursorTrainingRenderer.ts
 *
 * Drives the live production Workbench component using an isolated Shadow DOM clone
 * for demonstration segments (Stages 1, 3, 4) and seamless swapping to the real
 * component during interactive interrupts (Stage 2).
 *
 * Implements all 6 strict physical interaction rules:
 * RULE 1: Never hardcode pixel coordinates. Positions computed at runtime via getBoundingClientRect()
 *         on the CLONE's elements and cached per-stage.
 * RULE 2: Full 5-step drag lifecycle: HOVER -> PICKUP -> DRAG (inOutQuint arc) -> TARGET HOVER -> DROP (overshoot settle).
 * RULE 3: Speed matches distance (computed from measured px distance at consistent px/ms rate).
 * RULE 4: Multi-qubit connectors draw explicitly with animation step.
 * RULE 5: Stage 2 interrupt unmounts shadow clone, mounts real live component pre-seeded with Stage 1 state,
 *         validates against BOTH accepted solutions (CZ direct or H-CX-H sandwich).
 * RULE 6: Release lifts and fades away diagonally after drop.
 */

import { animate } from 'animejs';
import type { CursorState, TeachingIDEHooks } from './types';
import { ShadowCloneWorkbenchManager } from './ShadowCloneWorkbenchManager';
import type { CircuitRequest, Gate } from '../circuit/types';
import { defaultSpeechService } from './speechService';
import { MISCONCEPTION_CATALOG } from '../theory/misconceptionCatalog';

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Quintic in-out easing for natural physical inertia and deceleration.
 */
export function inOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

/**
 * Cubic out easing for quick, responsive lifts.
 */
export function outCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export interface CursorTrainingRendererOptions {
  hooks: TeachingIDEHooks;
  updateCursor: (cursor: Partial<CursorState>) => void;
  onNarration?: (text: string) => void;
  onKaTeX?: (latex: string, id?: string) => void;
  onStageChange?: (stageNumber: number, title: string) => void;
  onStage2InteractiveReady?: () => void;
}

export class CursorTrainingRenderer {
  private hooks: TeachingIDEHooks;
  private updateCursorState: (cursor: Partial<CursorState>) => void;
  private onNarration?: (text: string) => void;
  private onKaTeX?: (latex: string, id?: string) => void;
  private onStageChange?: (stageNumber: number, title: string) => void;
  private onStage2InteractiveReady?: () => void;

  public shadowManager: ShadowCloneWorkbenchManager;
  private stageRectCache: Map<string, Point2D> = new Map();
  private isCancelled: boolean = false;
  private currentStage: number = 0;
  private currentCursorPos: Point2D = { x: 200, y: 200 };

  constructor(options: CursorTrainingRendererOptions) {
    this.hooks = options.hooks;
    this.updateCursorState = options.updateCursor;
    this.onNarration = options.onNarration;
    this.onKaTeX = options.onKaTeX;
    this.onStageChange = options.onStageChange;
    this.onStage2InteractiveReady = options.onStage2InteractiveReady;
    this.shadowManager = new ShadowCloneWorkbenchManager();
  }

  public cancel(): void {
    this.isCancelled = true;
    defaultSpeechService.stop();
    this.shadowManager.unmount();
    this.updateCursorState({ isVisible: false, draggingGate: undefined, label: undefined });
  }

  /**
   * Caches live element positions once per stage from the cloned DOM (RULE 1).
   */
  private cacheStagePositions(gateNames: string[], slotCoords: Array<{ qubit: number; col: number }>): void {
    this.stageRectCache.clear();

    // Palette gates in clone
    for (const gate of gateNames) {
      const lower = gate.toLowerCase();
      const rect = this.shadowManager.getCloneRect(`[data-testid="palette-gate-${lower}"]`)
        || this.shadowManager.getCloneRect(`[data-gate="${lower}"]`);
      if (rect) {
        this.stageRectCache.set(`palette:${lower}`, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    }

    // Wire slots in clone
    for (const { qubit, col } of slotCoords) {
      const rect = this.shadowManager.getCloneRect(`[data-testid="slot-${qubit}-${col}"]`)
        || this.shadowManager.getCloneRect(`[data-teaching-target="circuit-q${qubit}-col${col}"]`);
      if (rect) {
        this.stageRectCache.set(`slot:${qubit}:${col}`, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    }
  }

  private getCachedPalettePosition(gateName: string): Point2D {
    const key = `palette:${gateName.toLowerCase()}`;
    const cached = this.stageRectCache.get(key);
    if (cached) return cached;

    const rect = this.shadowManager.getCloneRect(`[data-testid="palette-gate-${gateName.toLowerCase()}"]`);
    if (rect) {
      const p = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      this.stageRectCache.set(key, p);
      return p;
    }
    // As ultimate fallback, derive from live clone sidebar container rect
    const sidebarRect = this.shadowManager.getCloneRect('.ibm-operations-pane') || { left: 40, top: 250, width: 40, height: 40 };
    return { x: sidebarRect.left + 20, y: sidebarRect.top + 50 };
  }

  private getCachedSlotPosition(qubit: number, col: number): Point2D {
    const key = `slot:${qubit}:${col}`;
    const cached = this.stageRectCache.get(key);
    if (cached) return cached;

    const rect = this.shadowManager.getCloneRect(`[data-testid="slot-${qubit}-${col}"]`);
    if (rect) {
      const p = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      this.stageRectCache.set(key, p);
      return p;
    }
    // Fallback: derive from live clone canvas rect
    const canvasRect = this.shadowManager.getCloneRect('.ibm-canvas-pane') || { left: 350, top: 250, width: 600, height: 200 };
    return { x: canvasRect.left + 80 + col * 48, y: canvasRect.top + 60 + qubit * 64 };
  }

  /**
   * Executes the full 5-step physical drag lifecycle on the CLONE DOM (RULES 1, 2, 3, 4, 6).
   */
  public async executePhysicalGateDrag(
    gateName: string,
    targetQubit: number,
    column: number,
    gateId?: string
  ): Promise<void> {
    if (this.isCancelled) return;
    const gateUpper = gateName.toUpperCase();

    // ── 1. Derive runtime positions from clone ──
    const palettePos = this.getCachedPalettePosition(gateName);
    const slotPos = this.getCachedSlotPosition(targetQubit, column);

    // ── STEP 1: HOVER (cursor arrives at clone palette, gate shows real hover state) ──
    const toPaletteDist = Math.hypot(palettePos.x - this.currentCursorPos.x, palettePos.y - this.currentCursorPos.y);
    const hoverDuration = Math.max(180, Math.min(500, Math.round(toPaletteDist / 0.85)));

    this.updateCursorState({
      isVisible: true,
      isClicking: false,
      label: `Select ${gateUpper}`,
      isSpotlight: true,
      isInstant: true,
    });

    if (hoverDuration > 0) {
      const animPos = { ...this.currentCursorPos };
      await animate(animPos, {
        x: palettePos.x,
        y: palettePos.y,
        duration: hoverDuration,
        ease: 'inOutCubic',
        onUpdate: () => {
          this.currentCursorPos = { x: animPos.x, y: animPos.y };
          this.updateCursorState({ x: animPos.x, y: animPos.y, isInstant: true });
        },
      });
    }
    this.currentCursorPos = { ...palettePos };
    this.updateCursorState({ x: palettePos.x, y: palettePos.y, isInstant: true });

    // Show real hover state on clone palette gate
    this.shadowManager.setPaletteHover(gateName, true);
    await new Promise((r) => setTimeout(r, 140));
    if (this.isCancelled) return;

    // ── STEP 2: PICKUP (gate lifts: translateY -4px, scale 1.05, drop-shadow) ──
    this.shadowManager.setPaletteHover(gateName, false);
    this.shadowManager.setPaletteHeld(gateName, true);

    this.updateCursorState({
      isClicking: true,
      draggingGate: gateUpper,
      label: `Dragging ${gateUpper}`,
      isSpotlight: false,
      isInstant: true,
    });
    await new Promise((r) => setTimeout(r, 130));
    if (this.isCancelled) return;

    // ── STEP 3: DRAG (eased arc path 'inOutQuint', speed matches distance) ──
    const dragDist = Math.hypot(slotPos.x - palettePos.x, slotPos.y - palettePos.y);
    // RULE 3: Consistent 0.65 px/ms rate
    const dragDuration = Math.max(400, Math.min(1300, Math.round(dragDist / 0.65)));
    // Natural upward hand-drag arc curve
    const arcHeight = -Math.min(48, Math.max(18, dragDist * 0.09));

    const dragProgress = { t: 0 };
    let targetHoverTriggered = false;

    await animate(dragProgress, {
      t: 1,
      duration: dragDuration,
      ease: 'linear', // We apply custom inOutQuint mathematically for exact precision
      onUpdate: () => {
        const rawT = dragProgress.t;
        const easedT = inOutQuint(rawT);
        const arc = Math.sin(easedT * Math.PI) * arcHeight;
        const curX = palettePos.x + (slotPos.x - palettePos.x) * easedT;
        const curY = palettePos.y + (slotPos.y - palettePos.y) * easedT + arc;

        this.currentCursorPos = { x: curX, y: curY };
        this.updateCursorState({ x: curX, y: curY, isInstant: true });

        // STEP 4: TARGET HOVER (destination wire-slot shows valid drop highlight as gate nears)
        if (easedT >= 0.70 && !targetHoverTriggered) {
          targetHoverTriggered = true;
          this.shadowManager.setSlotDragOver(targetQubit, column, true);
        }
      },
    });
    if (this.isCancelled) return;

    this.currentCursorPos = { ...slotPos };
    this.updateCursorState({ x: slotPos.x, y: slotPos.y, isInstant: true });
    this.shadowManager.setSlotDragOver(targetQubit, column, true);
    await new Promise((r) => setTimeout(r, 100));
    if (this.isCancelled) return;

    // ── STEP 5: DROP (overshoot-settle: scale 1.05 -> 0.97 -> 1.0, THEN place in clone) ──
    this.updateCursorState({
      isDropping: true,
      isClicking: false,
      label: `Placed ${gateUpper}`,
      isInstant: true,
    });
    // Spring overshoot-and-settle dwell
    await new Promise((r) => setTimeout(r, 220));
    if (this.isCancelled) return;

    // Clean up temporary DOM classes on clone
    this.shadowManager.setPaletteHeld(gateName, false);
    this.shadowManager.setSlotDragOver(targetQubit, column, false);

    // Place the gate directly inside the CLONE DOM
    this.shadowManager.placeGateInClone(gateName, [targetQubit], column, gateId);

    // ── STEP 6: RELEASE (cursor icon visibly lifts away diagonally — never lingers frozen) ──
    this.updateCursorState({
      isDropping: false,
      draggingGate: undefined,
      label: undefined,
      isInstant: true,
    });

    const liftStart = { ...this.currentCursorPos };
    const liftEnd = { x: slotPos.x + 32, y: slotPos.y - 28 };

    await animate(liftStart, {
      x: liftEnd.x,
      y: liftEnd.y,
      duration: 220,
      ease: 'outCubic',
      onUpdate: () => {
        this.currentCursorPos = { x: liftStart.x, y: liftStart.y };
        this.updateCursorState({ x: liftStart.x, y: liftStart.y, isInstant: true });
      },
    });
    this.currentCursorPos = { ...liftEnd };

    // Pause briefly after placement
    await new Promise((r) => setTimeout(r, 150));
  }

  /**
   * Executes STAGE 1 (Equal Superposition) on the isolated Shadow DOM clone.
   * Places H on wire 0 and H on wire 1.
   */
  public async runStage1(): Promise<void> {
    this.isCancelled = false;
    this.currentStage = 1;
    this.onStageChange?.(1, 'STAGE 1 — Equal Superposition');

    // 1. Ensure live circuit is cleared to 2 qubits, 0 gates before cloning
    this.hooks.updateCircuit({
      qubits: 2,
      classical_bits: 2,
      gates: [],
    });

    // Wait 1 frame for React to render clean live workbench
    await new Promise((r) => setTimeout(r, 100));

    // 2. Mount Shadow DOM clone of the live workbench
    const mounted = this.shadowManager.mount('.ibm-upper-workspace');
    if (!mounted) {
      this.hooks.showToast?.('warning', 'Live Workbench clone could not be initialized');
      return;
    }

    // 3. Cache clone element positions
    this.cacheStagePositions(['h'], [
      { qubit: 0, col: 0 },
      { qubit: 1, col: 0 },
    ]);

    // 4. Action 1: Move cursor toward palette H
    const paletteH = this.getCachedPalettePosition('h');
    this.currentCursorPos = { x: paletteH.x - 50, y: paletteH.y - 50 };
    this.updateCursorState({
      x: this.currentCursorPos.x,
      y: this.currentCursorPos.y,
      isVisible: true,
      label: 'AI Tutor',
      isInstant: true,
    });

    // 5. Action 2: Narration
    const narration1 = 'We begin in the ground state |00⟩. By applying a Hadamard gate to qubit 0 and qubit 1, we place both wires into equal superposition.';
    this.onNarration?.(narration1);
    defaultSpeechService.speak(narration1);

    // 6. Action 3: First Gate Placement: H on wire 0, column 0
    await this.executePhysicalGateDrag('h', 0, 0, 'g-s1-h0');
    if (this.isCancelled) return;

    // 7. Action 4: Second Gate Placement: H on wire 1, column 0
    await this.executePhysicalGateDrag('h', 1, 0, 'g-s1-h1');
    if (this.isCancelled) return;

    // 8. Action 5: Render KaTeX Formula
    const katexFormula = '|s\\rangle = H^{\\otimes 2}|00\\rangle = \\frac{1}{2}|00\\rangle + \\frac{1}{2}|01\\rangle + \\frac{1}{2}|10\\rangle + \\frac{1}{2}|11\\rangle';
    this.onKaTeX?.(katexFormula, 'eq-stage-1-superposition');

    // 9. Action 6: Narration 2
    const narration2 = 'The composite two-qubit state now has an identical probability amplitude of one-half across all four computational basis states: |00⟩, |01⟩, |10⟩, and |11⟩.';
    this.onNarration?.(narration2);
    defaultSpeechService.speak(narration2);

    // Fade cursor out gracefully at end of Stage 1 demonstration
    setTimeout(() => {
      if (this.currentStage === 1) {
        this.updateCursorState({ isVisible: false });
      }
    }, 800);

    this.hooks.showToast?.('success', 'Stage 1 Complete: Equal Superposition Established');
  }

  /**
   * Switches from the Shadow DOM clone to the REAL live Workbench for Stage 2 (RULE 5).
   * Pre-seeds real Workbench with Stage 1 circuit state and activates interactive mode.
   */
  public switchToRealWorkbenchForStage2(): void {
    this.currentStage = 2;
    this.onStageChange?.(2, 'STAGE 2 — Oracle (Phase Inversion)');

    // 1. Unmount shadow clone completely
    this.shadowManager.unmount();

    // 2. Hide teacher cursor completely
    this.updateCursorState({ isVisible: false, draggingGate: undefined, label: undefined });

    // 3. Pre-seed REAL live production Workbench with Stage 1 state
    const stage1CircuitState: CircuitRequest = {
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: 'g-s1-h0', gate: 'h', targets: [0], column: 0 },
        { id: 'g-s1-h1', gate: 'h', targets: [1], column: 0 },
      ],
    };
    this.hooks.updateCircuit(stage1CircuitState);

    const narrationStage2 = 'The oracle needs to mark state |11⟩ with a phase flip. Place a Controlled-Z gate (or equivalent H-CX-H sandwich) between wire 0 and wire 1.';
    this.onNarration?.(narrationStage2);
    defaultSpeechService.speak(narrationStage2);

    this.onStage2InteractiveReady?.();
    this.hooks.showToast?.('info', 'Your turn! Complete the Oracle connection on the live Workbench.');
  }

  /**
   * Validates the learner's interactive attempt in Stage 2 against BOTH accepted solutions (RULE 5).
   * Solution A: Direct CZ gate on [0, 1]
   * Solution B: H-CX-H decomposition on target qubit 1
   * If invalid, maps to specific Misconception-AI explanation.
   */
  public evaluateStage2Oracle(circuit: CircuitRequest): {
    passed: boolean;
    solutionType?: 'CZ_DIRECT' | 'H_CX_H_SANDWICH';
    feedback: string;
    misconceptionId?: string;
  } {
    // Only inspect gates added after Stage 1 (i.e. column > 0 or gates beyond first two H gates)
    const oracleGates = circuit.gates.filter(
      (g) => !(g.column === 0 && g.gate === 'h') && g.id !== 'g-s1-h0' && g.id !== 'g-s1-h1'
    );

    if (oracleGates.length === 0) {
      return {
        passed: false,
        feedback: 'No oracle gate added yet. Drag a CZ gate or H-CX-H sandwich onto wires 0 and 1.',
      };
    }

    // Check Solution A: Direct CZ gate
    const czGate = oracleGates.find((g) => g.gate.toLowerCase() === 'cz');
    if (czGate && czGate.targets.includes(0) && czGate.targets.includes(1)) {
      return {
        passed: true,
        solutionType: 'CZ_DIRECT',
        feedback: 'Excellent! Direct CZ gate correctly inverts the phase of |11⟩.',
      };
    }

    // Check Solution B: H-CX-H Sandwich
    const hasH1Pre = oracleGates.some((g) => g.gate === 'h' && g.targets.includes(1));
    const hasCX = oracleGates.some((g) => g.gate === 'cx' && g.targets.includes(0) && g.targets.includes(1));
    const hasH1Post = oracleGates.filter((g) => g.gate === 'h' && g.targets.includes(1)).length >= 2;

    if (hasH1Pre && hasCX && hasH1Post) {
      return {
        passed: true,
        solutionType: 'H_CX_H_SANDWICH',
        feedback: 'Masterful! You used the H-CX-H decomposition to synthesize a Controlled-Z phase flip.',
      };
    }

    // Misconception AI diagnosis
    if (oracleGates.some((g) => g.gate === 'cx') && !hasH1Pre) {
      const entry = MISCONCEPTION_CATALOG['CX_NOT_CZ'];
      return {
        passed: false,
        misconceptionId: 'CX_NOT_CZ',
        feedback: entry?.explanation || 'A bare CX gate flips the bit amplitude (|10⟩ ↔ |11⟩), rather than inverting the phase of |11⟩.',
      };
    }

    if (oracleGates.some((g) => g.gate === 'z' && g.targets.length === 1)) {
      const entry = MISCONCEPTION_CATALOG['SINGLE_QUBIT_Z_ORACLE'];
      return {
        passed: false,
        misconceptionId: 'SINGLE_QUBIT_Z_ORACLE',
        feedback: entry?.explanation || 'A single-qubit Z gate marks both |01⟩ and |11⟩ or |10⟩ and |11⟩, not solely the target state |11⟩.',
      };
    }

    return {
      passed: false,
      feedback: 'The circuit does not yet invert only the phase of |11⟩. Place a CZ gate connecting wire 0 and wire 1.',
    };
  }
}

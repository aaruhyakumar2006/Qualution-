/**
 * ShadowCloneWorkbenchManager.ts
 *
 * Implements the isolated Shadow DOM Live-Cloning layer for guided lesson demonstrations.
 * Clones the actual, live production Workbench DOM (.ibm-upper-workspace) at runtime,
 * mounts it inside an isolated closed Shadow DOM container layered visually on top of the
 * real component, and ensures 100% pixel-for-pixel visual parity while preventing scripted
 * interactions from leaking into live application state.
 */

export class ShadowCloneWorkbenchManager {
  private host: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private clone: HTMLElement | null = null;
  private target: HTMLElement | null = null;
  private isMounted = false;

  /**
   * Clones the real live Workbench DOM and mounts it into an isolated Shadow DOM container.
   */
  public mount(targetSelector: string = '.ibm-upper-workspace'): boolean {
    if (typeof document === 'undefined') return false;
    this.unmount();

    const targetEl = document.querySelector(targetSelector) as HTMLElement | null;
    if (!targetEl) {
      console.warn(`[ShadowCloneWorkbenchManager] Target element "${targetSelector}" not found in DOM`);
      return false;
    }
    this.target = targetEl;

    // Create host container
    const hostEl = document.createElement('div');
    hostEl.id = 'shadow-workbench-demo-host';
    hostEl.className = 'shadow-workbench-demo-host';

    // Position exactly over the real workbench
    const targetRect = targetEl.getBoundingClientRect();
    hostEl.style.position = 'absolute';
    hostEl.style.left = `${targetEl.offsetLeft}px`;
    hostEl.style.top = `${targetEl.offsetTop}px`;
    hostEl.style.width = `${targetRect.width}px`;
    hostEl.style.height = `${targetRect.height}px`;
    hostEl.style.zIndex = '45'; // Float directly over live workbench, below TeachingCursor (z-index: 100)
    hostEl.style.pointerEvents = 'auto'; // Absorb all interactions so live app below is completely inert
    hostEl.style.background = '#081425';
    hostEl.style.overflow = 'hidden';

    // Attach closed shadow root
    const shadowRoot = hostEl.attachShadow({ mode: 'closed' });
    this.shadowRoot = shadowRoot;
    (hostEl as any).__shadowRoot = shadowRoot; // Accessible for test harness inspection

    // Adopt document stylesheets and clone <style>/<link> tags for 100% visual parity
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((s) => {
      shadowRoot.appendChild(s.cloneNode(true));
    });

    // Deep clone the real workbench DOM
    const clonedEl = targetEl.cloneNode(true) as HTMLElement;
    clonedEl.id = 'shadow-workbench-clone';
    clonedEl.style.width = '100%';
    clonedEl.style.height = '100%';
    clonedEl.style.pointerEvents = 'none'; // Cloned nodes are static and inert

    shadowRoot.appendChild(clonedEl);
    this.clone = clonedEl;

    // Insert host as sibling to target
    targetEl.parentElement?.appendChild(hostEl);
    this.host = hostEl;
    this.isMounted = true;

    return true;
  }

  /**
   * Unmounts the shadow clone container completely, restoring visibility of the real live Workbench.
   */
  public unmount(): void {
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadowRoot = null;
      this.clone = null;
      this.target = null;
      this.isMounted = false;
    }
  }

  public getIsMounted(): boolean {
    return this.isMounted;
  }

  public getShadowRoot(): ShadowRoot | null {
    return this.shadowRoot;
  }

  public getCloneElement(selector: string): HTMLElement | null {
    if (!this.shadowRoot) return null;
    return this.shadowRoot.querySelector(selector) as HTMLElement | null;
  }

  public getCloneRect(selector: string): DOMRect | null {
    const el = this.getCloneElement(selector);
    return el ? el.getBoundingClientRect() : null;
  }

  /**
   * Sets the hover visual state on a palette gate inside the clone.
   */
  public setPaletteHover(gateName: string, isHover: boolean): void {
    if (!this.shadowRoot) return;
    const lower = gateName.toLowerCase();
    const el = this.shadowRoot.querySelector(
      `[data-testid="palette-gate-${lower}"], [data-gate="${lower}"]`
    ) as HTMLElement | null;
    if (!el) return;

    if (isHover) {
      el.classList.add('teaching-hover-active', 'active-palette-gate');
    } else {
      el.classList.remove('teaching-hover-active', 'active-palette-gate');
    }
  }

  /**
   * Sets the held/pickup visual state on a palette gate inside the clone.
   */
  public setPaletteHeld(gateName: string, isHeld: boolean): void {
    if (!this.shadowRoot) return;
    const lower = gateName.toLowerCase();
    const el = this.shadowRoot.querySelector(
      `[data-testid="palette-gate-${lower}"], [data-gate="${lower}"]`
    ) as HTMLElement | null;
    if (!el) return;

    if (isHeld) {
      el.classList.remove('teaching-hover-active');
      el.classList.add('teaching-held-active');
    } else {
      el.classList.remove('teaching-held-active');
    }
  }

  /**
   * Highlights or unhighlights a wire slot drop zone in the clone.
   */
  public setSlotDragOver(qubit: number, column: number, isOver: boolean): void {
    if (!this.shadowRoot) return;
    const slotEl = this.shadowRoot.querySelector(
      `[data-testid="slot-${qubit}-${column}"], [data-teaching-target="circuit-q${qubit}-col${column}"]`
    ) as HTMLElement | null;
    if (!slotEl) return;

    if (isOver) {
      slotEl.classList.add('drag-over');
    } else {
      slotEl.classList.remove('drag-over');
    }
  }

  /**
   * Directly places a gate node markup into the clone's wire slot without affecting live state.
   */
  public placeGateInClone(
    gateName: string,
    targetQubits: number[],
    column: number,
    gateId?: string
  ): HTMLElement | null {
    if (!this.shadowRoot) return null;
    const lower = gateName.toLowerCase();
    const primaryQubit = targetQubits[0] ?? 0;
    const slotEl = this.shadowRoot.querySelector(
      `[data-testid="slot-${primaryQubit}-${column}"], [data-teaching-target="circuit-q${primaryQubit}-col${column}"]`
    ) as HTMLElement | null;
    if (!slotEl) return null;

    // Remove existing gate node in this slot if any
    const existing = slotEl.querySelector('.circuit-placed-gate');
    if (existing) existing.remove();

    const isMultiQubit = targetQubits.length > 1;
    const isCZ = lower === 'cz';

    // Build gate element matching CircuitCanvas structure
    const gateEl = document.createElement('div');
    gateEl.className = `circuit-placed-gate ${isCZ ? 'control-node' : ''} timeline-highlight`;
    gateEl.setAttribute('data-testid', `placed-gate-${lower}-${column}`);
    gateEl.style.width = '44px';
    gateEl.style.height = '44px';

    if (isCZ) {
      const dot = document.createElement('div');
      dot.className = 'cx-control-dot';
      gateEl.appendChild(dot);
    } else {
      const content = document.createElement('div');
      content.className = 'gate-label-content';
      const sym = document.createElement('span');
      sym.className = 'gate-symbol';
      sym.textContent = gateName.toUpperCase();
      content.appendChild(sym);
      gateEl.appendChild(content);
    }

    slotEl.appendChild(gateEl);

    // If multi-qubit (CZ), also place node on secondary qubit and draw connector
    if (isMultiQubit) {
      const secondaryQubit = targetQubits[1] ?? 1;
      const secSlotEl = this.shadowRoot.querySelector(
        `[data-testid="slot-${secondaryQubit}-${column}"]`
      ) as HTMLElement | null;
      if (secSlotEl) {
        const secExisting = secSlotEl.querySelector('.circuit-placed-gate');
        if (secExisting) secExisting.remove();

        const secGateEl = document.createElement('div');
        secGateEl.className = 'circuit-placed-gate control-node timeline-highlight';
        secGateEl.setAttribute('data-testid', `placed-gate-${lower}-${column}-target`);
        secGateEl.style.width = '44px';
        secGateEl.style.height = '44px';

        const dot = document.createElement('div');
        dot.className = 'cx-control-dot';
        secGateEl.appendChild(dot);

        secSlotEl.appendChild(secGateEl);

        // Add connector line between minTarget and maxTarget
        const minQ = Math.min(...targetQubits);
        const maxQ = Math.max(...targetQubits);
        if (primaryQubit === minQ) {
          const connector = document.createElement('div');
          connector.className = 'two-qubit-connector-line';
          connector.style.position = 'absolute';
          connector.style.width = '2px';
          connector.style.backgroundColor = '#4589ff';
          connector.style.left = '50%';
          connector.style.transform = 'translateX(-50%)';
          connector.style.top = '50%';
          connector.style.height = `${(maxQ - minQ) * 58}px`;
          connector.style.zIndex = '-1';
          connector.style.pointerEvents = 'none';
          gateEl.appendChild(connector);
        }
      }
    }

    return gateEl;
  }
}

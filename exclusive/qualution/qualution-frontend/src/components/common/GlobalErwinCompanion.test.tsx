import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { GlobalErwinCompanion } from './GlobalErwinCompanion';
import { emitTeachingEvent } from '../../features/teaching/teachingEvents';

// Polyfill PointerEvent for jsdom
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, params: any = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? 'mouse';
    }
  }
  window.PointerEvent = PointerEventPolyfill as any;
}

describe('GlobalErwinCompanion (Phase A Persistent Root Mount & Phase B Drag/Physics)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock setPointerCapture and releasePointerCapture
    window.HTMLElement.prototype.setPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders exactly ONCE with default 64px square size', () => {
    const { container } = render(<GlobalErwinCompanion />);
    const avatars = container.querySelectorAll('.erwin-avatar');
    expect(avatars.length).toBe(1);

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('64');
    expect(svg?.getAttribute('height')).toBe('64');
  });

  it('renders fixed bottom-left container with data-testid="global-erwin-container"', () => {
    render(<GlobalErwinCompanion />);
    const container = screen.getByTestId('global-erwin-container');
    expect(container).toHaveClass('erwin-global-anchor');
  });

  it('connects to real teaching events: transitions to correct and reverts to idle', async () => {
    render(<GlobalErwinCompanion />);
    const avatar = screen.getByTestId('global-erwin-avatar');
    expect(avatar).toHaveClass('erwin--idle');

    await act(async () => {
      emitTeachingEvent({
        type: 'prediction_submitted',
        lessonId: 's1-hadamard',
        stepId: 'step-3',
        metadata: {
          isCorrect: true,
          message: 'Nice — that is right.',
        },
      });
    });

    expect(avatar).toHaveClass('erwin--correct');
    const bubble = screen.getByTestId('global-erwin-bubble');
    expect(bubble).toHaveClass('erwin-global-bubble--correct');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(avatar).toHaveClass('erwin--idle');
  });

  it('connects to real teaching events: transitions to incorrect with diagnosis text', async () => {
    render(<GlobalErwinCompanion />);
    const avatar = screen.getByTestId('global-erwin-avatar');

    await act(async () => {
      emitTeachingEvent({
        type: 'prediction_submitted',
        lessonId: 's1-hadamard',
        stepId: 'step-3',
        metadata: {
          isCorrect: false,
          message: 'Target state not reached. Applying H to |0⟩ creates equal superposition.',
        },
      });
    });

    expect(avatar).toHaveClass('erwin--incorrect');
    const bubble = screen.getByTestId('global-erwin-bubble');
    expect(bubble).toHaveClass('erwin-global-bubble--incorrect');
    expect(bubble.textContent).toContain('Target state not reached');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(avatar).toHaveClass('erwin--idle');
  });

  it('connects to simulation events: thinking during simulation, idle when completed', async () => {
    render(<GlobalErwinCompanion />);
    const avatar = screen.getByTestId('global-erwin-avatar');

    await act(async () => {
      emitTeachingEvent({
        type: 'simulation_started',
        lessonId: 's1-hadamard',
        stepId: 'step-4',
        metadata: {
          routingReason: 'Statevector — Non-Clifford operations detected',
          executionMethod: 'statevector',
        },
      });
    });

    expect(avatar).toHaveClass('erwin--thinking');
    const bubble = screen.getByTestId('global-erwin-bubble');
    expect(bubble).toHaveClass('erwin-global-bubble--thinking');
    expect(bubble.textContent).toContain('Routing to Statevector');

    await act(async () => {
      emitTeachingEvent({
        type: 'simulation_completed',
        lessonId: 's1-hadamard',
        stepId: 'step-4',
      });
    });

    expect(avatar).toHaveClass('erwin--idle');
  });

  it('allows user to dismiss bubble by clicking directly on bubble', () => {
    render(<GlobalErwinCompanion />);
    const bubble = screen.getByTestId('global-erwin-bubble');
    expect(bubble).toBeInTheDocument();

    fireEvent.click(bubble);
    expect(screen.queryByTestId('global-erwin-bubble')).toBeNull();
  });

  /* ═══════════════════════════════════════════════════════════════
     PHASE B DRAG & PHYSICS TESTS
     ═══════════════════════════════════════════════════════════════ */

  it('updates transform: translate3d(x, y, 0) during active pointer drag and mounts drag shield', () => {
    render(<GlobalErwinCompanion />);
    const avatarWrap = screen.getByTestId('erwin-avatar-wrap');
    const dragWrapper = screen.getByTestId('erwin-drag-wrapper');

    act(() => {
      fireEvent.pointerDown(avatarWrap, {
        clientX: 100,
        clientY: 500,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      });
    });

    expect(dragWrapper).toHaveClass('is-dragging');
    expect(screen.getByTestId('erwin-drag-shield')).toBeInTheDocument();

    act(() => {
      fireEvent.pointerMove(avatarWrap, {
        clientX: 250,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
      });
    });

    expect(dragWrapper.style.transform).toBe('translate3d(150px, -100px, 0)');
    expect(avatarWrap).toHaveClass('erwin-motion-suspended');
  });

  it('suspends idle animation during drag and triggers two-phase jump then snap-back glide on release', () => {
    render(<GlobalErwinCompanion />);
    const avatarWrap = screen.getByTestId('erwin-avatar-wrap');
    const dragWrapper = screen.getByTestId('erwin-drag-wrapper');
    const jumpWrapper = screen.getByTestId('erwin-jump-wrapper');

    // 1. Drag Erwin
    act(() => {
      fireEvent.pointerDown(avatarWrap, { clientX: 50, clientY: 700, button: 0, pointerId: 1 });
      fireEvent.pointerMove(avatarWrap, { clientX: 200, clientY: 450, pointerId: 1 });
    });

    expect(dragWrapper.style.transform).toBe('translate3d(150px, -250px, 0)');
    expect(avatarWrap).toHaveClass('erwin-motion-suspended');

    // 2. Release pointer
    act(() => {
      fireEvent.pointerUp(avatarWrap, { pointerId: 1 });
    });

    // Drag ends, Phase 1: Jump micro-animation starts in-place
    expect(dragWrapper).not.toHaveClass('is-dragging');
    expect(jumpWrapper).toHaveClass('is-jumping');
    expect(dragWrapper.style.transform).toBe('translate3d(150px, -250px, 0)'); // in place during jump!
    expect(avatarWrap).toHaveClass('erwin-motion-suspended'); // still suspended!

    // 3. Fast-forward jump duration (250ms) -> Phase 2: Snap-back glide begins
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(jumpWrapper).not.toHaveClass('is-jumping');
    expect(dragWrapper).toHaveClass('is-returning');
    expect(dragWrapper.style.transform).toBe('translate3d(0px, 0px, 0)'); // returning to anchor!

    // 4. Fast-forward return duration (520ms) -> Erwin at rest, idle animation restored
    act(() => {
      vi.advanceTimersByTime(530);
    });

    expect(dragWrapper).not.toHaveClass('is-returning');
    expect(avatarWrap).not.toHaveClass('erwin-motion-suspended'); // idle animation resumed!
  });

  it('works identically with mobile touch events (pointerType: touch)', () => {
    render(<GlobalErwinCompanion />);
    const avatarWrap = screen.getByTestId('erwin-avatar-wrap');
    const dragWrapper = screen.getByTestId('erwin-drag-wrapper');

    // Touch down on mobile device
    act(() => {
      fireEvent.pointerDown(avatarWrap, {
        clientX: 40,
        clientY: 600,
        pointerId: 2,
        pointerType: 'touch',
      });
    });

    expect(dragWrapper).toHaveClass('is-dragging');

    // Drag finger across touch screen
    act(() => {
      fireEvent.pointerMove(avatarWrap, {
        clientX: 180,
        clientY: 320,
        pointerId: 2,
        pointerType: 'touch',
      });
    });

    expect(dragWrapper.style.transform).toBe('translate3d(140px, -280px, 0)');

    // Release touch
    act(() => {
      fireEvent.pointerUp(avatarWrap, { pointerId: 2, pointerType: 'touch' });
    });
    expect(dragWrapper).not.toHaveClass('is-dragging');
    expect(screen.getByTestId('erwin-jump-wrapper')).toHaveClass('is-jumping');

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(dragWrapper.style.transform).toBe('translate3d(0px, 0px, 0)');
  });

  it('cancels drag cleanly if pointer is cancelled (window blur / interruption)', () => {
    render(<GlobalErwinCompanion />);
    const avatarWrap = screen.getByTestId('erwin-avatar-wrap');
    const dragWrapper = screen.getByTestId('erwin-drag-wrapper');

    fireEvent.pointerDown(avatarWrap, { clientX: 50, clientY: 700, pointerId: 3 });
    fireEvent.pointerMove(avatarWrap, { clientX: 120, clientY: 550, pointerId: 3 });
    expect(dragWrapper).toHaveClass('is-dragging');

    // System interruption
    fireEvent.pointerCancel(avatarWrap, { pointerId: 3 });
    expect(dragWrapper).not.toHaveClass('is-dragging');

    act(() => {
      vi.advanceTimersByTime(250 + 550);
    });
    expect(dragWrapper.style.transform).toBe('translate3d(0px, 0px, 0)');
  });

  /* ═══════════════════════════════════════════════════════════════
     HYBRID AI ASSISTANT OPEN-UP ON CLICK
     ═══════════════════════════════════════════════════════════════ */

  it('opens Erwin Hybrid AI Assistant when clicking avatar without dragging', () => {
    render(<GlobalErwinCompanion />);
    expect(screen.queryByTestId('erwin-hybrid-ai-panel')).toBeNull();

    const avatarWrap = screen.getByTestId('erwin-avatar-wrap');

    // Tap/Click without moving
    fireEvent.pointerDown(avatarWrap, { clientX: 50, clientY: 50, button: 0, pointerId: 1 });
    fireEvent.pointerUp(avatarWrap, { pointerId: 1 });
    fireEvent.click(avatarWrap);

    // Erwin Hybrid AI assistant is opened!
    expect(screen.getByTestId('erwin-hybrid-ai-panel')).toBeInTheDocument();
    expect(screen.getByTestId('erwin-hybrid-badge')).toHaveTextContent(/Hybrid AI Model/i);
    expect(avatarWrap).toHaveClass('is-assistant-active');

    // Clicking avatar again toggles it closed
    fireEvent.click(avatarWrap);
    expect(screen.queryByTestId('erwin-hybrid-ai-panel')).toBeNull();
    expect(avatarWrap).not.toHaveClass('is-assistant-active');
  });

  it('opens and closes Erwin Hybrid AI Assistant via window events', () => {
    render(<GlobalErwinCompanion />);
    expect(screen.queryByTestId('erwin-hybrid-ai-panel')).toBeNull();

    act(() => {
      window.dispatchEvent(new CustomEvent('qualution:open-erwin'));
    });
    expect(screen.getByTestId('erwin-hybrid-ai-panel')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent('qualution:close-erwin'));
    });
    expect(screen.queryByTestId('erwin-hybrid-ai-panel')).toBeNull();
  });
});

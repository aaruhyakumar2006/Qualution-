/**
 * CaptionLayer.test.tsx
 *
 * PHASE 7: Component tests for CaptionLayer.
 *
 * Tests: rendering, position slots, opacity, alignment, font size,
 * hide/show/reset ref API, and board isolation (no board layer mutation).
 */

import React, { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CaptionLayer, type CaptionLayerRef } from './CaptionLayer';
import type { ActiveCaption } from '../../features/theory/captionEngine';

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeCaption(overrides: Partial<ActiveCaption> = {}): ActiveCaption {
  return {
    id: 'cap1',
    text: 'Test caption',
    startMs: 0,
    durationMs: 2000,
    position: 'bottom',
    fontSize: 15,
    align: 'center',
    appear: 'fade',
    opacity: 1,
    ...overrides,
  };
}

// ── Rendering ──────────────────────────────────────────────────────────────

describe('CaptionLayer — rendering', () => {
  it('renders nothing when captions array is empty', () => {
    render(<CaptionLayer captions={[]} />);
    expect(screen.queryByTestId('caption-layer')).toBeNull();
  });

  it('renders the caption layer when captions are present', () => {
    render(<CaptionLayer captions={[makeCaption()]} />);
    expect(screen.getByTestId('caption-layer')).toBeInTheDocument();
  });

  it('renders a caption pill with the correct text', () => {
    render(<CaptionLayer captions={[makeCaption({ text: 'Hello world' })]} />);
    expect(screen.getByTestId('caption-cap1')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders multiple captions', () => {
    const captions = [
      makeCaption({ id: 'a', text: 'First' }),
      makeCaption({ id: 'b', text: 'Second', position: 'top' }),
    ];
    render(<CaptionLayer captions={captions} />);
    expect(screen.getByTestId('caption-a')).toBeInTheDocument();
    expect(screen.getByTestId('caption-b')).toBeInTheDocument();
  });

  it('renders nothing when visible prop is false', () => {
    render(<CaptionLayer captions={[makeCaption()]} visible={false} />);
    expect(screen.queryByTestId('caption-layer')).toBeNull();
  });
});

// ── Position slots ─────────────────────────────────────────────────────────

describe('CaptionLayer — position slots', () => {
  it('renders a bottom slot for position="bottom"', () => {
    render(<CaptionLayer captions={[makeCaption({ position: 'bottom' })]} />);
    expect(screen.getByTestId('caption-slot-bottom')).toBeInTheDocument();
  });

  it('renders a top slot for position="top"', () => {
    render(<CaptionLayer captions={[makeCaption({ position: 'top' })]} />);
    expect(screen.getByTestId('caption-slot-top')).toBeInTheDocument();
  });

  it('renders a center slot for position="center"', () => {
    render(<CaptionLayer captions={[makeCaption({ position: 'center' })]} />);
    expect(screen.getByTestId('caption-slot-center')).toBeInTheDocument();
  });

  it('groups multiple captions at the same position into one slot', () => {
    const captions = [
      makeCaption({ id: 'x1', position: 'bottom' }),
      makeCaption({ id: 'x2', position: 'bottom' }),
    ];
    render(<CaptionLayer captions={captions} />);
    const slot = screen.getByTestId('caption-slot-bottom');
    expect(slot.querySelectorAll('[data-testid^="caption-x"]')).toHaveLength(2);
  });

  it('renders separate slots for different positions', () => {
    const captions = [
      makeCaption({ id: 'p1', position: 'top' }),
      makeCaption({ id: 'p2', position: 'bottom' }),
    ];
    render(<CaptionLayer captions={captions} />);
    expect(screen.getByTestId('caption-slot-top')).toBeInTheDocument();
    expect(screen.getByTestId('caption-slot-bottom')).toBeInTheDocument();
  });
});

// ── Opacity ────────────────────────────────────────────────────────────────

describe('CaptionLayer — opacity', () => {
  it('applies opacity 0 when caption opacity is 0', () => {
    render(<CaptionLayer captions={[makeCaption({ opacity: 0 })]} />);
    const pill = screen.getByTestId('caption-cap1');
    expect(pill.style.opacity).toBe('0');
  });

  it('applies opacity 1 when caption opacity is 1', () => {
    render(<CaptionLayer captions={[makeCaption({ opacity: 1 })]} />);
    const pill = screen.getByTestId('caption-cap1');
    expect(pill.style.opacity).toBe('1');
  });

  it('applies fractional opacity', () => {
    render(<CaptionLayer captions={[makeCaption({ opacity: 0.42 })]} />);
    const pill = screen.getByTestId('caption-cap1');
    expect(parseFloat(pill.style.opacity)).toBeCloseTo(0.42, 2);
  });
});

// ── Font size ──────────────────────────────────────────────────────────────

describe('CaptionLayer — font size', () => {
  it('applies the fontSize from the caption', () => {
    render(<CaptionLayer captions={[makeCaption({ fontSize: 20 })]} />);
    const pill = screen.getByTestId('caption-cap1');
    expect(pill.style.fontSize).toBe('20px');
  });

  it('applies default fontSize 15 when not overridden', () => {
    render(<CaptionLayer captions={[makeCaption({ fontSize: 15 })]} />);
    const pill = screen.getByTestId('caption-cap1');
    expect(pill.style.fontSize).toBe('15px');
  });
});

// ── Text alignment ─────────────────────────────────────────────────────────

describe('CaptionLayer — text alignment', () => {
  it('applies textAlign center', () => {
    render(<CaptionLayer captions={[makeCaption({ align: 'center' })]} />);
    const pill = screen.getByTestId('caption-cap1');
    expect(pill.style.textAlign).toBe('center');
  });

  it('applies textAlign left', () => {
    render(<CaptionLayer captions={[makeCaption({ align: 'left' })]} />);
    const pill = screen.getByTestId('caption-cap1');
    expect(pill.style.textAlign).toBe('left');
  });

  it('applies textAlign right', () => {
    render(<CaptionLayer captions={[makeCaption({ align: 'right' })]} />);
    const pill = screen.getByTestId('caption-cap1');
    expect(pill.style.textAlign).toBe('right');
  });
});

// ── Ref API: hide / show / reset ───────────────────────────────────────────

describe('CaptionLayer — ref API', () => {
  it('hide() makes the layer disappear', () => {
    const ref = createRef<CaptionLayerRef>();
    render(<CaptionLayer ref={ref} captions={[makeCaption()]} />);
    expect(screen.getByTestId('caption-layer')).toBeInTheDocument();

    act(() => { ref.current!.hide(); });
    expect(screen.queryByTestId('caption-layer')).toBeNull();
  });

  it('show() makes the layer reappear after hide()', () => {
    const ref = createRef<CaptionLayerRef>();
    render(<CaptionLayer ref={ref} captions={[makeCaption()]} />);

    act(() => { ref.current!.hide(); });
    expect(screen.queryByTestId('caption-layer')).toBeNull();

    act(() => { ref.current!.show(); });
    expect(screen.getByTestId('caption-layer')).toBeInTheDocument();
  });

  it('reset() restores visibility', () => {
    const ref = createRef<CaptionLayerRef>();
    render(<CaptionLayer ref={ref} captions={[makeCaption()]} />);

    act(() => { ref.current!.hide(); });
    act(() => { ref.current!.reset(); });
    expect(screen.getByTestId('caption-layer')).toBeInTheDocument();
  });
});

// ── Board isolation ────────────────────────────────────────────────────────

describe('CaptionLayer — board isolation', () => {
  it('does not render inside any board layer element', () => {
    const { container } = render(
      <div>
        <div data-testid="teaching-board-canvas" />
        <div data-testid="teaching-board-svg" />
        <div data-testid="teaching-board-dom" />
        <div data-testid="teaching-board-cursor-layer" />
        <CaptionLayer captions={[makeCaption()]} />
      </div>
    );

    const boardLayers = [
      'teaching-board-canvas',
      'teaching-board-svg',
      'teaching-board-dom',
      'teaching-board-cursor-layer',
    ];

    for (const layerId of boardLayers) {
      const layer = container.querySelector(`[data-testid="${layerId}"]`);
      expect(layer?.querySelector('[data-testid="caption-layer"]')).toBeNull();
    }

    // Caption layer IS present in the container, just not inside board layers
    expect(container.querySelector('[data-testid="caption-layer"]')).not.toBeNull();
  });

  it('has aria-live="polite" for accessibility', () => {
    render(<CaptionLayer captions={[makeCaption()]} />);
    const layer = screen.getByTestId('caption-layer');
    expect(layer.getAttribute('aria-live')).toBe('polite');
  });
});

// ── Engine integration ─────────────────────────────────────────────────────

describe('CaptionLayer — engine integration', () => {
  it('renders captions produced by CaptionEngine.getActive()', async () => {
    const { CaptionEngine } = await import('../../features/theory/captionEngine');
    const engine = new CaptionEngine();
    engine.load([{
      id: 'eng1',
      text: 'Engine caption',
      startMs: 0,
      durationMs: 3000,
    }]);
    engine.tick(500);

    const active = engine.getActive();
    render(<CaptionLayer captions={active} />);
    expect(screen.getByTestId('caption-eng1')).toBeInTheDocument();
    expect(screen.getByText('Engine caption')).toBeInTheDocument();
  });

  it('renders nothing when engine has no active captions', async () => {
    const { CaptionEngine } = await import('../../features/theory/captionEngine');
    const engine = new CaptionEngine();
    engine.load([{
      id: 'eng2',
      text: 'Gone',
      startMs: 0,
      durationMs: 500,
    }]);
    engine.tick(600); // past end

    render(<CaptionLayer captions={engine.getActive()} />);
    expect(screen.queryByTestId('caption-layer')).toBeNull();
  });

  it('caption opacity from engine is applied to the pill', async () => {
    const { CaptionEngine, CAPTION_FADE_MS } = await import('../../features/theory/captionEngine');
    const engine = new CaptionEngine();
    engine.load([{
      id: 'eng3',
      text: 'Fading in',
      startMs: 0,
      durationMs: 3000,
      appear: 'fade',
    }]);
    // Tick to exactly half the fade-in window
    engine.tick(CAPTION_FADE_MS / 2);

    const active = engine.getActive();
    render(<CaptionLayer captions={active} />);
    const pill = screen.getByTestId('caption-eng3');
    const opacity = parseFloat(pill.style.opacity);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });
});

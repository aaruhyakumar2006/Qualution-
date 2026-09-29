/**
 * BoardMathLayer.test.tsx
 *
 * PHASE 8: Component tests for BoardMathLayer.
 *
 * Tests: rendering, KaTeX output presence, opacity from progress,
 * percentage positioning, color, scale, error fallback, item filtering.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardMathLayer } from './BoardMathLayer';
import type { PaintedItem } from '../../features/theory/boardTypes';

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeMathItem(overrides: Partial<PaintedItem> & { latex?: string } = {}): PaintedItem {
  const { latex = '|0\\rangle', ...rest } = overrides;
  return {
    id: 'math1',
    kind: 'math',
    progress: 1,
    data: {
      type: 'WRITE_MATH',
      latex,
      x: 200,
      y: 300,
      scale: 1.0,
      color: '#f5c842',
      duration: 400,
      itemId: 'math1',
    },
    ...rest,
  };
}

// ── Layer container ─────────────────────────────────────────────────────────

describe('BoardMathLayer — container', () => {
  it('renders the math layer div', () => {
    render(<BoardMathLayer items={[]} />);
    expect(screen.getByTestId('board-math-layer')).toBeInTheDocument();
  });

  it('renders nothing when items array is empty', () => {
    render(<BoardMathLayer items={[]} />);
    expect(screen.queryByTestId(/board-math-item-/)).toBeNull();
  });

  it('ignores non-math item kinds', () => {
    const lineItem: PaintedItem = {
      id: 'l1', kind: 'line', progress: 1,
      data: { type: 'DRAW_LINE', x1: 0, y1: 0, x2: 100, y2: 0 },
    };
    render(<BoardMathLayer items={[lineItem]} />);
    expect(screen.queryByTestId(/board-math-item-/)).toBeNull();
  });

  it('renders only math items from a mixed list', () => {
    const items: PaintedItem[] = [
      makeMathItem({ id: 'math1' }),
      { id: 'line1', kind: 'line', progress: 1, data: { type: 'DRAW_LINE', x1: 0, y1: 0, x2: 10, y2: 0 } },
      makeMathItem({ id: 'math2' }),
    ];
    render(<BoardMathLayer items={items} />);
    expect(screen.getByTestId('board-math-item-math1')).toBeInTheDocument();
    expect(screen.getByTestId('board-math-item-math2')).toBeInTheDocument();
    expect(screen.queryByTestId('board-math-item-line1')).toBeNull();
  });
});

// ── KaTeX rendering ─────────────────────────────────────────────────────────

describe('BoardMathLayer — KaTeX rendering', () => {
  it('renders a math item element', () => {
    render(<BoardMathLayer items={[makeMathItem()]} />);
    expect(screen.getByTestId('board-math-item-math1')).toBeInTheDocument();
  });

  it('produces KaTeX HTML output (contains katex class)', () => {
    render(<BoardMathLayer items={[makeMathItem({ id: 'k1' })]} />);
    const el = screen.getByTestId('board-math-item-k1');
    // KaTeX renderToString always wraps output in a span.katex
    expect(el.innerHTML).toContain('katex');
  });

  it('stores the original latex in data-latex attribute', () => {
    render(<BoardMathLayer items={[makeMathItem({ id: 'dl1' })]} />);
    const el = screen.getByTestId('board-math-item-dl1');
    expect(el.getAttribute('data-latex')).toBe('|0\\rangle');
  });

  it('renders H|0\\rangle without throwing', () => {
    const item = makeMathItem({ id: 'h1', latex: 'H|0\\rangle' });
    expect(() => render(<BoardMathLayer items={[item]} />)).not.toThrow();
    expect(screen.getByTestId('board-math-item-h1')).toBeInTheDocument();
  });

  it('renders the full superposition formula without throwing', () => {
    const item = makeMathItem({
      id: 'sup1',
      latex: '\\frac{1}{\\sqrt{2}}\\bigl(|0\\rangle + |1\\rangle\\bigr)',
    });
    expect(() => render(<BoardMathLayer items={[item]} />)).not.toThrow();
    expect(screen.getByTestId('board-math-item-sup1')).toBeInTheDocument();
  });

  it('falls back gracefully on invalid LaTeX (no crash)', () => {
    // KaTeX with throwOnError:false should not throw
    const item = makeMathItem({ id: 'bad1', latex: '\\invalidcommand{x}' });
    expect(() => render(<BoardMathLayer items={[item]} />)).not.toThrow();
    expect(screen.getByTestId('board-math-item-bad1')).toBeInTheDocument();
  });
});

// ── Opacity from progress ───────────────────────────────────────────────────

describe('BoardMathLayer — opacity', () => {
  it('opacity is 0 at progress 0', () => {
    render(<BoardMathLayer items={[makeMathItem({ id: 'op0', progress: 0 })]} />);
    const el = screen.getByTestId('board-math-item-op0');
    expect(parseFloat(el.style.opacity)).toBeCloseTo(0, 5);
  });

  it('opacity is 1 at progress 1', () => {
    render(<BoardMathLayer items={[makeMathItem({ id: 'op1', progress: 1 })]} />);
    const el = screen.getByTestId('board-math-item-op1');
    expect(parseFloat(el.style.opacity)).toBeCloseTo(1, 5);
  });

  it('opacity is 0.5 at progress 0.5', () => {
    render(<BoardMathLayer items={[makeMathItem({ id: 'op5', progress: 0.5 })]} />);
    const el = screen.getByTestId('board-math-item-op5');
    expect(parseFloat(el.style.opacity)).toBeCloseTo(0.5, 5);
  });

  it('clamps progress above 1 to opacity 1', () => {
    render(<BoardMathLayer items={[makeMathItem({ id: 'ophi', progress: 1.5 })]} />);
    const el = screen.getByTestId('board-math-item-ophi');
    expect(parseFloat(el.style.opacity)).toBeCloseTo(1, 5);
  });

  it('clamps progress below 0 to opacity 0', () => {
    render(<BoardMathLayer items={[makeMathItem({ id: 'oplo', progress: -0.5 })]} />);
    const el = screen.getByTestId('board-math-item-oplo');
    expect(parseFloat(el.style.opacity)).toBeCloseTo(0, 5);
  });
});

// ── Positioning ─────────────────────────────────────────────────────────────

describe('BoardMathLayer — positioning', () => {
  it('positions at correct left percentage for x=200 on 1200-wide board', () => {
    // (200 / 1200) * 100 = 16.666...%
    render(<BoardMathLayer items={[makeMathItem({ id: 'pos1' })]} logicalWidth={1200} />);
    const el = screen.getByTestId('board-math-item-pos1');
    expect(parseFloat(el.style.left)).toBeCloseTo(16.667, 1);
  });

  it('positions at correct top percentage for y=300 on 700-high board', () => {
    // (300 / 700) * 100 ≈ 42.857%
    render(<BoardMathLayer items={[makeMathItem({ id: 'pos2' })]} logicalHeight={700} />);
    const el = screen.getByTestId('board-math-item-pos2');
    expect(parseFloat(el.style.top)).toBeCloseTo(42.857, 1);
  });

  it('positions at 50% left when x equals half the logical width', () => {
    const item: PaintedItem = {
      id: 'pos3', kind: 'math', progress: 1,
      data: { type: 'WRITE_MATH', latex: '|0\\rangle', x: 640, y: 100, itemId: 'pos3' },
    };
    render(<BoardMathLayer items={[item]} logicalWidth={1280} />);
    const el = screen.getByTestId('board-math-item-pos3');
    expect(parseFloat(el.style.left)).toBeCloseTo(50, 1);
  });
});

// ── Color ───────────────────────────────────────────────────────────────────

describe('BoardMathLayer — color', () => {
  it('applies the color from the action data', () => {
    const item: PaintedItem = {
      id: 'col1', kind: 'math', progress: 1,
      data: { type: 'WRITE_MATH', latex: '|0\\rangle', x: 100, y: 100, color: '#ff0000', itemId: 'col1' },
    };
    render(<BoardMathLayer items={[item]} />);
    const el = screen.getByTestId('board-math-item-col1');
    expect(el.style.color).toBe('rgb(255, 0, 0)');
  });

  it('uses default chalk-yellow when color is not specified', () => {
    const item: PaintedItem = {
      id: 'col2', kind: 'math', progress: 1,
      data: { type: 'WRITE_MATH', latex: '|0\\rangle', x: 100, y: 100, itemId: 'col2' },
    };
    render(<BoardMathLayer items={[item]} />);
    const el = screen.getByTestId('board-math-item-col2');
    // #f5c842 in rgb
    expect(el.style.color).toBe('rgb(245, 200, 66)');
  });
});

// ── Multiple items ──────────────────────────────────────────────────────────

describe('BoardMathLayer — multiple items', () => {
  it('renders all three superposition steps independently', () => {
    const items: PaintedItem[] = [
      { id: 's1', kind: 'math', progress: 1, data: { type: 'WRITE_MATH', latex: '|0\\rangle', x: 200, y: 260, itemId: 's1' } },
      { id: 's2', kind: 'math', progress: 1, data: { type: 'WRITE_MATH', latex: 'H|0\\rangle', x: 200, y: 360, itemId: 's2' } },
      { id: 's3', kind: 'math', progress: 1, data: { type: 'WRITE_MATH', latex: '\\frac{1}{\\sqrt{2}}(|0\\rangle+|1\\rangle)', x: 200, y: 460, itemId: 's3' } },
    ];
    render(<BoardMathLayer items={items} />);
    expect(screen.getByTestId('board-math-item-s1')).toBeInTheDocument();
    expect(screen.getByTestId('board-math-item-s2')).toBeInTheDocument();
    expect(screen.getByTestId('board-math-item-s3')).toBeInTheDocument();
  });

  it('each item has independent opacity', () => {
    const items: PaintedItem[] = [
      { id: 'ind1', kind: 'math', progress: 0.2, data: { type: 'WRITE_MATH', latex: '|0\\rangle', x: 100, y: 100, itemId: 'ind1' } },
      { id: 'ind2', kind: 'math', progress: 0.8, data: { type: 'WRITE_MATH', latex: '|1\\rangle', x: 100, y: 200, itemId: 'ind2' } },
    ];
    render(<BoardMathLayer items={items} />);
    expect(parseFloat(screen.getByTestId('board-math-item-ind1').style.opacity)).toBeCloseTo(0.2, 5);
    expect(parseFloat(screen.getByTestId('board-math-item-ind2').style.opacity)).toBeCloseTo(0.8, 5);
  });
});

// ── Board isolation ─────────────────────────────────────────────────────────

describe('BoardMathLayer — board isolation', () => {
  it('does not render inside SVG or canvas board layers', () => {
    const { container } = render(
      <div>
        <canvas data-testid="teaching-board-canvas" />
        <svg data-testid="teaching-board-svg" />
        <BoardMathLayer items={[makeMathItem()]} />
      </div>
    );

    const canvas = container.querySelector('[data-testid="teaching-board-canvas"]');
    const svg    = container.querySelector('[data-testid="teaching-board-svg"]');
    expect(canvas?.querySelector('[data-testid="board-math-layer"]')).toBeNull();
    expect(svg?.querySelector('[data-testid="board-math-layer"]')).toBeNull();

    // But it IS present in the container
    expect(container.querySelector('[data-testid="board-math-layer"]')).not.toBeNull();
  });
});

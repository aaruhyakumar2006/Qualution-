/**
 * BoardDrawingLayer.test.tsx
 *
 * PHASE 5: Integration tests for the BoardDrawingLayer SVG renderer.
 * Tests SVG element presence, stroke-dashoffset values, and arrowhead
 * visibility at various progress values.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardDrawingLayer } from './BoardDrawingLayer';
import type { DrawingItem } from './BoardDrawingLayer';
import {
  lineLength,
  circleCircumference,
  rectPerimeter,
  ARROWHEAD_APPEAR_THRESHOLD,
} from '../../features/theory/drawingMotion';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Wrap items in SVG so SVG elements render correctly in JSDOM */
const Wrapper = ({ items }: { items: DrawingItem[] }) => (
  <svg viewBox="0 0 1280 720">
    <BoardDrawingLayer items={items} />
  </svg>
);

// ── Layer Container ─────────────────────────────────────────────────────────

describe('BoardDrawingLayer container', () => {
  it('renders the drawing layer group', () => {
    render(<Wrapper items={[]} />);
    expect(screen.getByTestId('board-drawing-layer')).toBeInTheDocument();
  });

  it('renders nothing when items array is empty', () => {
    render(<Wrapper items={[]} />);
    expect(screen.queryByTestId(/^drawing-(line|arrow|circle|rect)-/)).toBeNull();
  });
});

// ── LINE ────────────────────────────────────────────────────────────────────

describe('BoardDrawingLayer — line', () => {
  const lineItem: DrawingItem = {
    kind: 'line',
    id: 'l1',
    x1: 100, y1: 100,
    x2: 400, y2: 100,
    progress: 0,
  };

  it('renders a line element', () => {
    render(<Wrapper items={[lineItem]} />);
    expect(screen.getByTestId('drawing-line-l1')).toBeInTheDocument();
  });

  it('stroke-dashoffset equals full length at progress 0 (hidden)', () => {
    render(<Wrapper items={[{ ...lineItem, progress: 0 }]} />);
    const el = screen.getByTestId('drawing-line-l1');
    const len = lineLength(100, 100, 400, 100);
    expect(parseFloat(el.getAttribute('stroke-dashoffset') ?? '0')).toBeCloseTo(len, 3);
  });

  it('stroke-dashoffset is 0 at progress 1 (fully drawn)', () => {
    render(<Wrapper items={[{ ...lineItem, progress: 1 }]} />);
    const el = screen.getByTestId('drawing-line-l1');
    expect(parseFloat(el.getAttribute('stroke-dashoffset') ?? '99')).toBeCloseTo(0, 3);
  });

  it('stroke-dashoffset is half the length at progress 0.5', () => {
    render(<Wrapper items={[{ ...lineItem, progress: 0.5 }]} />);
    const el = screen.getByTestId('drawing-line-l1');
    const len = lineLength(100, 100, 400, 100);
    expect(parseFloat(el.getAttribute('stroke-dashoffset') ?? '0')).toBeCloseTo(len / 2, 3);
  });

  it('applies custom color from style', () => {
    render(<Wrapper items={[{ ...lineItem, progress: 1, style: { color: 'red' } }]} />);
    const el = screen.getByTestId('drawing-line-l1');
    expect(el.getAttribute('stroke')).toBe('red');
  });

  it('is invisible when visible=false', () => {
    render(<Wrapper items={[{ ...lineItem, visible: false }]} />);
    expect(screen.queryByTestId('drawing-line-l1')).toBeNull();
  });
});

// ── ARROW ───────────────────────────────────────────────────────────────────

describe('BoardDrawingLayer — arrow', () => {
  const arrowItem: DrawingItem = {
    kind: 'arrow',
    id: 'a1',
    x1: 100, y1: 200,
    x2: 500, y2: 200,
    progress: 0,
  };

  it('renders an arrow group', () => {
    render(<Wrapper items={[arrowItem]} />);
    expect(screen.getByTestId('drawing-arrow-a1')).toBeInTheDocument();
  });

  it('arrowhead polygon is opacity 0 at progress 0', () => {
    render(<Wrapper items={[{ ...arrowItem, progress: 0 }]} />);
    const group = screen.getByTestId('drawing-arrow-a1');
    const polygon = group.querySelector('polygon');
    expect(polygon).not.toBeNull();
    expect(parseFloat(polygon?.getAttribute('opacity') ?? '1')).toBe(0);
  });

  it('arrowhead polygon is opacity 0 just below threshold', () => {
    const belowThreshold = ARROWHEAD_APPEAR_THRESHOLD - 0.01;
    render(<Wrapper items={[{ ...arrowItem, progress: belowThreshold }]} />);
    const group = screen.getByTestId('drawing-arrow-a1');
    const polygon = group.querySelector('polygon');
    expect(parseFloat(polygon?.getAttribute('opacity') ?? '1')).toBe(0);
  });

  it('arrowhead polygon is opacity 1 at or above threshold', () => {
    render(<Wrapper items={[{ ...arrowItem, progress: ARROWHEAD_APPEAR_THRESHOLD }]} />);
    const group = screen.getByTestId('drawing-arrow-a1');
    const polygon = group.querySelector('polygon');
    expect(parseFloat(polygon?.getAttribute('opacity') ?? '0')).toBe(1);
  });

  it('arrowhead is fully visible at progress 1', () => {
    render(<Wrapper items={[{ ...arrowItem, progress: 1 }]} />);
    const group = screen.getByTestId('drawing-arrow-a1');
    const polygon = group.querySelector('polygon');
    expect(parseFloat(polygon?.getAttribute('opacity') ?? '0')).toBe(1);
  });
});

// ── CIRCLE ──────────────────────────────────────────────────────────────────

describe('BoardDrawingLayer — circle', () => {
  const circleItem: DrawingItem = {
    kind: 'circle',
    id: 'c1',
    cx: 300, cy: 300, r: 80,
    progress: 0,
  };

  it('renders a circle group', () => {
    render(<Wrapper items={[circleItem]} />);
    expect(screen.getByTestId('drawing-circle-c1')).toBeInTheDocument();
  });

  it('stroke-dashoffset equals circumference at progress 0', () => {
    render(<Wrapper items={[{ ...circleItem, progress: 0 }]} />);
    const group = screen.getByTestId('drawing-circle-c1');
    const circle = group.querySelector('circle');
    const c = circleCircumference(80);
    expect(parseFloat(circle?.getAttribute('stroke-dashoffset') ?? '0')).toBeCloseTo(c, 1);
  });

  it('stroke-dashoffset is 0 at progress 1', () => {
    render(<Wrapper items={[{ ...circleItem, progress: 1 }]} />);
    const group = screen.getByTestId('drawing-circle-c1');
    const circle = group.querySelector('circle');
    expect(parseFloat(circle?.getAttribute('stroke-dashoffset') ?? '1')).toBeCloseTo(0, 1);
  });

  it("has rotate(-90) transform to start at 12 o'clock", () => {
    render(<Wrapper items={[circleItem]} />);
    const group = screen.getByTestId('drawing-circle-c1');
    const circle = group.querySelector('circle');
    expect(circle?.getAttribute('transform')).toContain('rotate(-90');
  });
});

// ── RECT ────────────────────────────────────────────────────────────────────

describe('BoardDrawingLayer — rect', () => {
  const rectItem: DrawingItem = {
    kind: 'rect',
    id: 'r1',
    x: 100, y: 100, w: 200, h: 100,
    progress: 0,
  };

  it('renders a rect group', () => {
    render(<Wrapper items={[rectItem]} />);
    expect(screen.getByTestId('drawing-rect-r1')).toBeInTheDocument();
  });

  it('stroke-dashoffset equals perimeter at progress 0', () => {
    render(<Wrapper items={[{ ...rectItem, progress: 0 }]} />);
    const group = screen.getByTestId('drawing-rect-r1');
    const path = group.querySelector('path');
    const p = rectPerimeter(200, 100);
    expect(parseFloat(path?.getAttribute('stroke-dashoffset') ?? '0')).toBeCloseTo(p, 1);
  });

  it('stroke-dashoffset is 0 at progress 1', () => {
    render(<Wrapper items={[{ ...rectItem, progress: 1 }]} />);
    const group = screen.getByTestId('drawing-rect-r1');
    const path = group.querySelector('path');
    expect(parseFloat(path?.getAttribute('stroke-dashoffset') ?? '1')).toBeCloseTo(0, 1);
  });

  it('path d attribute starts with M at rect origin', () => {
    render(<Wrapper items={[rectItem]} />);
    const group = screen.getByTestId('drawing-rect-r1');
    const path = group.querySelector('path');
    expect(path?.getAttribute('d')).toMatch(/^M 100,100/);
  });
});

// ── Multiple items ──────────────────────────────────────────────────────────

describe('BoardDrawingLayer — multiple items', () => {
  it('renders all items in a single group', () => {
    const items: DrawingItem[] = [
      { kind: 'line',   id: 'ml1', x1: 0, y1: 0, x2: 100, y2: 0, progress: 1 },
      { kind: 'circle', id: 'mc1', cx: 200, cy: 200, r: 50, progress: 1 },
      { kind: 'rect',   id: 'mr1', x: 50, y: 50, w: 100, h: 60, progress: 1 },
    ];
    render(<Wrapper items={items} />);
    expect(screen.getByTestId('drawing-line-ml1')).toBeInTheDocument();
    expect(screen.getByTestId('drawing-circle-mc1')).toBeInTheDocument();
    expect(screen.getByTestId('drawing-rect-mr1')).toBeInTheDocument();
  });
});

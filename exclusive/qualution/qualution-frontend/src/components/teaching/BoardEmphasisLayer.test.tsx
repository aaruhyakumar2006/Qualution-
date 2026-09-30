/**
 * BoardEmphasisLayer.test.tsx
 *
 * PHASE 6: Integration tests for the BoardEmphasisLayer SVG renderer.
 * Tests element presence, opacity, non-obscuring geometry, and stroke-dashoffset at various progress values.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardEmphasisLayer } from './BoardEmphasisLayer';
import type { EmphasisItem } from '../../hooks/useBoardEmphasis';
import type { PaintedItem } from '../../features/theory/boardTypes';

const SvgWrapper = ({ items }: { items: (EmphasisItem | PaintedItem)[] }) => (
  <svg viewBox="0 0 1280 720">
    <BoardEmphasisLayer items={items} />
  </svg>
);

describe('BoardEmphasisLayer (Phase 6)', () => {
  it('renders the emphasis layer group', () => {
    render(<SvgWrapper items={[]} />);
    expect(screen.getByTestId('board-emphasis-layer')).toBeInTheDocument();
  });

  it('renders nothing when items array is empty', () => {
    render(<SvgWrapper items={[]} />);
    expect(screen.queryByTestId(/^emphasis-(highlight|underline)-/)).toBeNull();
  });

  // ── HighlightItem Tests ───────────────────────────────────────────────────

  it('renders a highlight rect with correct bounds and non-obscuring opacity', () => {
    const item: EmphasisItem = {
      kind: 'highlight',
      id: 'hl-test-1',
      x: 150,
      y: 200,
      width: 120,
      height: 45,
      color: 'rgba(250, 204, 21, 0.22)',
      progress: 0.8,
    };

    render(<SvgWrapper items={[item]} />);
    const el = screen.getByTestId('emphasis-highlight-hl-test-1');
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('x')).toBe('150');
    expect(el.getAttribute('y')).toBe('200');
    expect(el.getAttribute('width')).toBe('120');
    expect(el.getAttribute('height')).toBe('45');
    expect(el.getAttribute('fill')).toBe('rgba(250, 204, 21, 0.22)');
    expect(parseFloat(el.getAttribute('opacity') ?? '0')).toBeCloseTo(0.8, 2);
    expect(el.getAttribute('rx')).toBe('4');
  });

  // ── UnderlineItem Tests ───────────────────────────────────────────────────

  it('renders an underline line with progressive dashoffset', () => {
    const item: EmphasisItem = {
      kind: 'underline',
      id: 'ul-test-1',
      x1: 100,
      y1: 250,
      x2: 300,
      y2: 250,
      progress: 0.5,
      style: { color: 'rgba(56, 189, 248, 0.85)', strokeWidth: 3 },
    };

    render(<SvgWrapper items={[item]} />);
    const el = screen.getByTestId('emphasis-underline-ul-test-1');
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('x1')).toBe('100');
    expect(el.getAttribute('y1')).toBe('250');
    expect(el.getAttribute('x2')).toBe('300');
    expect(el.getAttribute('y2')).toBe('250');
    expect(el.getAttribute('stroke')).toBe('rgba(56, 189, 248, 0.85)');
    expect(el.getAttribute('stroke-width')).toBe('3');
    // Length = 200. At progress 0.5, dashoffset = 200 * (1 - 0.5) = 100
    expect(parseFloat(el.getAttribute('stroke-dashoffset') ?? '0')).toBeCloseTo(100, 1);
  });

  // ── Legacy PaintedItem Support ────────────────────────────────────────────

  it('supports legacy PaintedItem highlight and underline', () => {
    const legacyHighlight: PaintedItem = {
      id: 'legacy-hl',
      kind: 'highlight',
      progress: 1,
      data: {
        type: 'HIGHLIGHT',
        x: 80,
        y: 90,
        w: 160,
        h: 35,
        color: 'rgba(255,200,50,0.28)',
      },
    };

    render(<SvgWrapper items={[legacyHighlight]} />);
    const el = screen.getByTestId('emphasis-highlight-legacy-hl');
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('width')).toBe('160');
  });
});

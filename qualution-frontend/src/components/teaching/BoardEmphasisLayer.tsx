/**
 * BoardEmphasisLayer.tsx
 *
 * PHASE 6: SVG Teacher Emphasis Renderer for the QUALUTION Teaching Board.
 *
 * Renders HIGHLIGHT and UNDERLINE emphasis items produced by useBoardEmphasis
 * (or TheoryBoardEngine).
 * Circle-around-target is handled either directly or by BoardDrawingLayer.
 *
 * Responsibilities:
 * - Render HIGHLIGHT as a subtle, translucent rounded rectangle behind/around content.
 * - Render UNDERLINE as a progressively drawn line below content.
 * - All coordinates are in the board's logical coordinate system (1280 × 720).
 * - Placed inside TeachingBoard Layer 2 (SVG) below Layer 3 (DOM Typography),
 *   ensuring 100% text legibility.
 * - Pure presentation component.
 */

import React from 'react';
import type { EmphasisItem, HighlightEmphasisItem, UnderlineEmphasisItem } from '../../hooks/useBoardEmphasis';
import type { PaintedItem } from '../../features/theory/boardTypes';
import './BoardEmphasisLayer.css';

// ── Default style values ────────────────────────────────────────────────────

const DEFAULT_HIGHLIGHT_COLOR = 'rgba(250, 204, 21, 0.22)';
const DEFAULT_UNDERLINE_COLOR = 'rgba(56, 189, 248, 0.85)';
const DEFAULT_UNDERLINE_STROKE = 2.5;

// ── Sub-renderers ───────────────────────────────────────────────────────────

function RenderHighlight({
  id,
  x,
  y,
  width,
  height,
  color = DEFAULT_HIGHLIGHT_COLOR,
  progress = 1,
}: {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  progress: number;
}) {
  const opacity = Math.max(0, Math.min(1, progress));

  return (
    <rect
      data-testid={`emphasis-highlight-${id}`}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      opacity={opacity}
      rx={4}
      ry={4}
      className="emphasis-highlight-rect"
    />
  );
}

function RenderUnderline({
  id,
  x1,
  y1,
  x2,
  y2,
  progress = 1,
  color = DEFAULT_UNDERLINE_COLOR,
  strokeWidth = DEFAULT_UNDERLINE_STROKE,
}: {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  color?: string;
  strokeWidth?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const dashOffset = length * (1 - clampedProgress);

  return (
    <line
      data-testid={`emphasis-underline-${id}`}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={length}
      strokeDashoffset={dashOffset}
      strokeLinecap="round"
      className="emphasis-underline-line"
    />
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export interface BoardEmphasisLayerProps {
  /** Emphasis items from useBoardEmphasis (or legacy painted items) */
  items: (EmphasisItem | PaintedItem)[];
}

/**
 * Renders emphasis overlays (highlight, underline) as SVG elements on Layer 2.
 */
export function BoardEmphasisLayer({ items }: BoardEmphasisLayerProps): React.ReactElement {
  return (
    <g className="board-emphasis-layer" data-testid="board-emphasis-layer">
      {items.map((item) => {
        // 1. New EmphasisItem format
        if ('x' in item && item.kind === 'highlight') {
          const h = item as HighlightEmphasisItem;
          return (
            <RenderHighlight
              key={h.id}
              id={h.id}
              x={h.x}
              y={h.y}
              width={h.width}
              height={h.height}
              color={h.color}
              progress={h.progress}
            />
          );
        }

        if ('x1' in item && item.kind === 'underline') {
          const u = item as UnderlineEmphasisItem;
          return (
            <RenderUnderline
              key={u.id}
              id={u.id}
              x1={u.x1}
              y1={u.y1}
              x2={u.x2}
              y2={u.y2}
              progress={u.progress}
              color={u.style?.color}
              strokeWidth={u.style?.strokeWidth}
            />
          );
        }

        // 2. Legacy PaintedItem format fallback
        if ('data' in item) {
          const painted = item as PaintedItem;
          if (painted.kind === 'highlight' && painted.data) {
            const data = painted.data as any;
            return (
              <RenderHighlight
                key={painted.id}
                id={painted.id}
                x={data.x ?? 0}
                y={data.y ?? 0}
                width={data.w ?? data.width ?? 0}
                height={data.h ?? data.height ?? 0}
                color={data.color}
                progress={painted.progress}
              />
            );
          }
          if (painted.kind === 'underline' && painted.data) {
            const data = painted.data as any;
            const x1 = data.x ?? 0;
            const y1 = data.y ?? 0;
            const width = data.width ?? data.w ?? 0;
            return (
              <RenderUnderline
                key={painted.id}
                id={painted.id}
                x1={x1}
                y1={y1}
                x2={x1 + width}
                y2={y1}
                progress={painted.progress}
                color={data.color}
                strokeWidth={data.strokeWidth}
              />
            );
          }
        }

        return null;
      })}
    </g>
  );
}

export default BoardEmphasisLayer;

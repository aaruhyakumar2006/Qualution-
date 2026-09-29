/**
 * BoardMathLayer.tsx
 *
 * PHASE 8: Mathematical Teaching — Board Math Renderer.
 *
 * Renders mathematical KaTeX-rendered HTML elements inside TeachingBoard
 * Layer 3 (DOM Typography & Mathematical Notation Layer).
 *
 * Responsibilities:
 * - Render each math item at its logical board position (percentage-based).
 * - Apply opacity from item.opacity or item.progress (0 = invisible, 1 = fully visible).
 * - Use KaTeX renderToString for deterministic, server-safe rendering.
 * - Support scale, fontSize, and color overrides.
 * - Support both direct BoardMathItem[] and legacy PaintedItem[].
 * - Never touch the board's canvas, SVG, or cursor layers.
 *
 * Must be passed as `textChildren` to TeachingBoard so it renders
 * inside Layer 3 alongside BoardTextLayer.
 *
 * Coordinate system: logical board units (default 1280 × 720 / 1200 × 700).
 */

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { PaintedItem, WriteMathAction } from '../../features/theory/boardTypes';
import {
  DEFAULT_LOGICAL_WIDTH,
  DEFAULT_LOGICAL_HEIGHT,
} from '../../features/theory/boardCoordinates';
import './BoardMathLayer.css';

// ── Types ──────────────────────────────────────────────────────────────────

export interface BoardMathItem {
  id: string;
  latex: string;
  x: number;
  y: number;
  scale?: number;
  fontSize?: number;
  color?: string;
  opacity?: number;
  progress?: number;
}

export type MathLayerItemInput = BoardMathItem | PaintedItem;

// ── Default values ─────────────────────────────────────────────────────────

const DEFAULT_COLOR = '#f5c842'; // chalk yellow
const DEFAULT_SCALE = 1.0;
const BASE_FONT_SIZE = 22; // px at scale 1.0, before board scaling

function isPaintedItem(item: MathLayerItemInput): item is PaintedItem {
  return 'kind' in item && 'data' in item;
}

function normalizeMathItem(item: MathLayerItemInput): BoardMathItem | null {
  if (isPaintedItem(item)) {
    if (item.kind !== 'math') return null;
    const action = item.data as WriteMathAction;
    return {
      id: item.id,
      latex: action.latex,
      x: action.x,
      y: action.y,
      scale: action.scale ?? DEFAULT_SCALE,
      color: action.color ?? DEFAULT_COLOR,
      opacity: item.progress,
      progress: item.progress,
    };
  }
  return {
    id: item.id,
    latex: item.latex,
    x: item.x,
    y: item.y,
    scale: item.scale ?? DEFAULT_SCALE,
    fontSize: item.fontSize,
    color: item.color ?? DEFAULT_COLOR,
    opacity: item.opacity ?? item.progress ?? 1,
    progress: item.progress ?? item.opacity ?? 1,
  };
}

// ── Single math item renderer ──────────────────────────────────────────────

interface MathItemProps {
  item: BoardMathItem;
  logicalWidth: number;
  logicalHeight: number;
}

function BoardMathItemComponent({ item, logicalWidth, logicalHeight }: MathItemProps) {
  const { latex, x, y, scale = DEFAULT_SCALE, fontSize: customFontSize, color = DEFAULT_COLOR } = item;

  const leftPercent = (x / logicalWidth) * 100;
  const topPercent = (y / logicalHeight) * 100;
  const rawOpacity = item.opacity ?? item.progress ?? 1;
  const opacity = Math.max(0, Math.min(1, rawOpacity));
  const fontSize = customFontSize ? customFontSize * scale : BASE_FONT_SIZE * scale;

  // KaTeX renderToString is deterministic and throws on invalid LaTeX.
  // We catch errors and fall back to the raw LaTeX string so the board
  // never crashes on a malformed formula.
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
        output: 'html',
      });
    } catch {
      return `<span class="board-math-error">${latex}</span>`;
    }
  }, [latex]);

  return (
    <div
      className="board-math-item"
      data-testid={`board-math-item-${item.id}`}
      data-latex={latex}
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        opacity,
        color,
        fontSize: `calc(${fontSize}px * var(--stage-scale, 1))`,
      }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export interface BoardMathLayerProps {
  /** All math items to render. Accepts BoardMathItem[] or legacy PaintedItem[]. */
  items: MathLayerItemInput[];
  logicalWidth?: number;
  logicalHeight?: number;
}

/**
 * Renders all math painted items as KaTeX HTML inside the board DOM layer.
 * Pass as `textChildren` to TeachingBoard.
 */
export function BoardMathLayer({
  items,
  logicalWidth = DEFAULT_LOGICAL_WIDTH,
  logicalHeight = DEFAULT_LOGICAL_HEIGHT,
}: BoardMathLayerProps): React.ReactElement {
  const normalizedItems = useMemo(() => {
    const list: BoardMathItem[] = [];
    for (const raw of items) {
      const norm = normalizeMathItem(raw);
      if (norm) list.push(norm);
    }
    return list;
  }, [items]);

  return (
    <div className="board-math-layer" data-testid="board-math-layer">
      {normalizedItems.map((item) => (
        <BoardMathItemComponent
          key={item.id}
          item={item}
          logicalWidth={logicalWidth}
          logicalHeight={logicalHeight}
        />
      ))}
    </div>
  );
}

export default BoardMathLayer;

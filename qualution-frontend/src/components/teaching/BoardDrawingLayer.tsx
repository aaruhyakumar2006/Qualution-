/**
 * BoardDrawingLayer.tsx
 *
 * PHASE 5: SVG Drawing Renderer for the QUALUTION Teaching Board.
 *
 * Renders a list of DrawingItem[] as SVG shapes inside TeachingBoard Layer 2.
 * Each item carries a `progress` value (0..1) that controls how much of the
 * shape is revealed using stroke-dasharray / stroke-dashoffset.
 *
 * Responsibilities:
 * - Render LINE, ARROW, CIRCLE, RECT progressively from progress 0 to 1.
 * - Cursor position is NOT managed here — that is the hook's responsibility.
 * - All coordinates are in the board's logical coordinate system (1280 × 720).
 * - No animation logic — this is a pure, stateless presentation component.
 */

import React from 'react';
import {
  lineLength,
  lineDashOffset,
  arrowShaftEnd,
  arrowHeadPoints,
  circleCircumference,
  circleDashOffset,
  rectPerimeter,
  rectDashOffset,
  rectPerimeterPath,
  ARROWHEAD_APPEAR_THRESHOLD,
  DEFAULT_ARROW_SIZE,
} from '../../features/theory/drawingMotion';
import './BoardDrawingLayer.css';

// ── Drawing Item Types ─────────────────────────────────────────────────────

export interface DrawingItemStyle {
  color?: string;
  strokeWidth?: number;
  opacity?: number;
}

interface BaseDrawingItem {
  id: string;
  /** Reveal progress 0..1. 0 = hidden, 1 = fully drawn. */
  progress: number;
  style?: DrawingItemStyle;
  visible?: boolean;
}

export interface LineDrawingItem extends BaseDrawingItem {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ArrowDrawingItem extends BaseDrawingItem {
  kind: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Size of arrowhead in logical board units. Default: 18 */
  arrowSize?: number;
}

export interface CircleDrawingItem extends BaseDrawingItem {
  kind: 'circle';
  cx: number;
  cy: number;
  r: number;
  /** If true, fill is rendered (with lower opacity). Default: false */
  filled?: boolean;
}

export interface RectDrawingItem extends BaseDrawingItem {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  /** If true, fill is rendered (with lower opacity). Default: false */
  filled?: boolean;
}

export type DrawingItem =
  | LineDrawingItem
  | ArrowDrawingItem
  | CircleDrawingItem
  | RectDrawingItem;

// ── Default style values ────────────────────────────────────────────────────

const DEFAULT_COLOR = 'rgba(220, 232, 255, 0.88)'; // chalk-blue-white
const DEFAULT_STROKE_WIDTH = 2.5;

// ── Sub-renderers ───────────────────────────────────────────────────────────

function BoardDrawingLine({ item }: { item: LineDrawingItem }) {
  const { x1, y1, x2, y2, progress, style, visible = true } = item;
  if (!visible) return null;

  const len = lineLength(x1, y1, x2, y2);
  const dashOffset = lineDashOffset(len, progress);
  const color = style?.color ?? DEFAULT_COLOR;
  const sw = style?.strokeWidth ?? DEFAULT_STROKE_WIDTH;

  return (
    <line
      data-testid={`drawing-line-${item.id}`}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={sw}
      strokeDasharray={len}
      strokeDashoffset={dashOffset}
      strokeLinecap="round"
      opacity={style?.opacity ?? 1}
      fill="none"
    />
  );
}

function BoardDrawingArrow({ item }: { item: ArrowDrawingItem }) {
  const { x1, y1, x2, y2, progress, style, visible = true } = item;
  if (!visible) return null;

  const headSize = item.arrowSize ?? DEFAULT_ARROW_SIZE;
  const shaftEnd = arrowShaftEnd(x1, y1, x2, y2, headSize);
  const shaftLen = lineLength(x1, y1, shaftEnd.x, shaftEnd.y);
  const dashOffset = lineDashOffset(shaftLen, progress);
  const headPoints = arrowHeadPoints(x1, y1, x2, y2, headSize);
  const headOpacity = progress >= ARROWHEAD_APPEAR_THRESHOLD ? 1 : 0;

  const color = style?.color ?? DEFAULT_COLOR;
  const sw = style?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const op = style?.opacity ?? 1;

  return (
    <g data-testid={`drawing-arrow-${item.id}`} opacity={op}>
      {/* Shaft */}
      <line
        x1={x1}
        y1={y1}
        x2={shaftEnd.x}
        y2={shaftEnd.y}
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={shaftLen}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead — appears when shaft is nearly complete */}
      <polygon
        points={headPoints}
        fill={color}
        opacity={headOpacity}
        style={{ transition: 'opacity 120ms ease-in' }}
      />
    </g>
  );
}

function BoardDrawingCircle({ item }: { item: CircleDrawingItem }) {
  const { cx, cy, r, progress, style, visible = true, filled = false } = item;
  if (!visible) return null;

  const circumference = circleCircumference(r);
  const dashOffset = circleDashOffset(r, progress);
  const color = style?.color ?? DEFAULT_COLOR;
  const sw = style?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const op = style?.opacity ?? 1;

  return (
    <g data-testid={`drawing-circle-${item.id}`} opacity={op}>
      {filled && progress > 0.95 && (
        <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.08} stroke="none" />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        fill="none"
        /* Rotate so drawing starts from top (12 o'clock) going clockwise */
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </g>
  );
}

function BoardDrawingRect({ item }: { item: RectDrawingItem }) {
  const { x, y, w, h, progress, style, visible = true, filled = false } = item;
  if (!visible) return null;

  const perim = rectPerimeter(w, h);
  const dashOffset = rectDashOffset(w, h, progress);
  const pathD = rectPerimeterPath(x, y, w, h);
  const color = style?.color ?? DEFAULT_COLOR;
  const sw = style?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const op = style?.opacity ?? 1;

  return (
    <g data-testid={`drawing-rect-${item.id}`} opacity={op}>
      {filled && progress > 0.95 && (
        <rect x={x} y={y} width={w} height={h} fill={color} opacity={0.08} stroke="none" />
      )}
      <path
        d={pathD}
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={perim}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export interface BoardDrawingLayerProps {
  items: DrawingItem[];
}

/**
 * Renders all drawing items as SVG shapes.
 * Must be placed as a child of the TeachingBoard SVG layer (Layer 2).
 */
export function BoardDrawingLayer({ items }: BoardDrawingLayerProps): React.ReactElement {
  return (
    <g className="board-drawing-layer" data-testid="board-drawing-layer">
      {items.map((item) => {
        switch (item.kind) {
          case 'line':   return <BoardDrawingLine   key={item.id} item={item} />;
          case 'arrow':  return <BoardDrawingArrow  key={item.id} item={item} />;
          case 'circle': return <BoardDrawingCircle key={item.id} item={item} />;
          case 'rect':   return <BoardDrawingRect   key={item.id} item={item} />;
          default:       return null;
        }
      })}
    </g>
  );
}

export default BoardDrawingLayer;

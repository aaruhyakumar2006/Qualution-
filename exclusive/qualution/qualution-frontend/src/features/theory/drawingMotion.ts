/**
 * drawingMotion.ts
 *
 * PHASE 5: Pure 2D Drawing Geometry for the QUALUTION Teaching Board.
 *
 * Responsibilities:
 * - Compute path lengths for each drawing primitive.
 * - Compute cursor position at a given progress t ∈ [0, 1] along each path.
 * - Compute SVG stroke-dasharray / stroke-dashoffset values for progressive reveal.
 * - Compute arrowhead geometry (polygon points string for SVG).
 *
 * Design: Pure TypeScript — no React, no DOM, no side effects.
 * All functions are deterministic: same inputs → same outputs, always.
 *
 * Coordinate system: logical board units (default 1280 × 720).
 */

import type { Point2D } from './boardCoordinates';

// ── Constants ───────────────────────────────────────────────────────────────

/** Default arrowhead size in logical board units. */
export const DEFAULT_ARROW_SIZE = 18;

/** Progress threshold at which arrowhead becomes visible (shaft nearly complete). */
export const ARROWHEAD_APPEAR_THRESHOLD = 0.82;

// ── Line ────────────────────────────────────────────────────────────────────

/**
 * Euclidean length of a line segment.
 */
export function lineLength(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Point on a line segment at progress t ∈ [0, 1].
 * t=0 → (x1,y1), t=1 → (x2,y2).
 */
export function pointOnLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number
): Point2D {
  const s = Math.max(0, Math.min(1, t));
  return { x: x1 + (x2 - x1) * s, y: y1 + (y2 - y1) * s };
}

/**
 * stroke-dashoffset value for a line at progress t.
 * Use with stroke-dasharray = lineLength(...).
 */
export function lineDashOffset(length: number, t: number): number {
  return length * (1 - Math.max(0, Math.min(1, t)));
}

// ── Arrow ───────────────────────────────────────────────────────────────────

/**
 * The unit direction vector from (x1,y1) toward (x2,y2).
 * Returns {x:0, y:0} for zero-length lines (safe to use, just no direction).
 */
export function lineDirection(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Point2D {
  const len = lineLength(x1, y1, x2, y2);
  if (len === 0) return { x: 0, y: 0 };
  return { x: (x2 - x1) / len, y: (y2 - y1) / len };
}

/**
 * The endpoint of the arrow shaft — pulled back from (x2,y2) by headSize
 * so the arrowhead sits neatly at the tip without overlapping the shaft stroke.
 */
export function arrowShaftEnd(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  headSize: number = DEFAULT_ARROW_SIZE
): Point2D {
  const dir = lineDirection(x1, y1, x2, y2);
  const len = lineLength(x1, y1, x2, y2);
  // Only pull back if the shaft is longer than the head
  const pullBack = Math.min(headSize * 0.6, len * 0.4);
  return {
    x: x2 - dir.x * pullBack,
    y: y2 - dir.y * pullBack,
  };
}

/**
 * SVG polygon points string for an arrowhead at (x2,y2) pointing in the
 * direction from (x1,y1) toward (x2,y2).
 *
 * Returns a string like "tip_x,tip_y left_x,left_y right_x,right_y"
 * suitable for use as the `points` attribute of an SVG `<polygon>`.
 */
export function arrowHeadPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  headSize: number = DEFAULT_ARROW_SIZE
): string {
  const dir = lineDirection(x1, y1, x2, y2);
  // Perpendicular direction
  const perp = { x: -dir.y, y: dir.x };

  const halfWidth = headSize * 0.42;

  // Tip of arrowhead at (x2, y2)
  const tip = { x: x2, y: y2 };

  // Base of arrowhead — pulled back by headSize
  const baseCenter = {
    x: x2 - dir.x * headSize,
    y: y2 - dir.y * headSize,
  };

  const left = {
    x: baseCenter.x + perp.x * halfWidth,
    y: baseCenter.y + perp.y * halfWidth,
  };
  const right = {
    x: baseCenter.x - perp.x * halfWidth,
    y: baseCenter.y - perp.y * halfWidth,
  };

  return `${fmt(tip.x)},${fmt(tip.y)} ${fmt(left.x)},${fmt(left.y)} ${fmt(right.x)},${fmt(right.y)}`;
}

// ── Circle ──────────────────────────────────────────────────────────────────

/**
 * Full circumference of a circle with radius r.
 */
export function circleCircumference(r: number): number {
  return 2 * Math.PI * Math.abs(r);
}

/**
 * Point on a circle at progress t ∈ [0, 1].
 * Drawing starts at the top (12 o'clock) and proceeds clockwise.
 * t=0 → top, t=0.5 → bottom, t=1 → top (complete circle).
 */
export function pointOnCircle(
  cx: number,
  cy: number,
  r: number,
  t: number
): Point2D {
  // Start at -π/2 (top) and go clockwise (increasing angle)
  const angle = -Math.PI / 2 + 2 * Math.PI * Math.max(0, Math.min(1, t));
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

/**
 * stroke-dashoffset for a circle at progress t.
 * Use with stroke-dasharray = circleCircumference(r).
 * The `<circle>` must have transform="rotate(-90 cx cy)" to start from top.
 */
export function circleDashOffset(r: number, t: number): number {
  const c = circleCircumference(r);
  return c * (1 - Math.max(0, Math.min(1, t)));
}

// ── Rectangle ───────────────────────────────────────────────────────────────

/**
 * Full perimeter of a rectangle.
 */
export function rectPerimeter(w: number, h: number): number {
  return 2 * (Math.abs(w) + Math.abs(h));
}

/**
 * Point on the rectangle perimeter at progress t ∈ [0, 1].
 * Starts at the top-left corner and traces clockwise:
 *   top-left → top-right → bottom-right → bottom-left → top-left
 */
export function pointOnRect(
  x: number,
  y: number,
  w: number,
  h: number,
  t: number
): Point2D {
  const s = Math.max(0, Math.min(1, t));
  const perim = rectPerimeter(w, h);
  let dist = s * perim;

  // Top edge: (x,y) → (x+w, y)
  if (dist <= w) return { x: x + dist, y };
  dist -= w;

  // Right edge: (x+w, y) → (x+w, y+h)
  if (dist <= h) return { x: x + w, y: y + dist };
  dist -= h;

  // Bottom edge: (x+w, y+h) → (x, y+h)
  if (dist <= w) return { x: x + w - dist, y: y + h };
  dist -= w;

  // Left edge: (x, y+h) → (x, y)
  return { x, y: y + h - dist };
}

/**
 * stroke-dashoffset for a rectangle path at progress t.
 * Use with stroke-dasharray = rectPerimeter(w, h).
 * The `<path>` must describe exactly the rectangle perimeter starting from top-left.
 */
export function rectDashOffset(w: number, h: number, t: number): number {
  const p = rectPerimeter(w, h);
  return p * (1 - Math.max(0, Math.min(1, t)));
}

/**
 * SVG path `d` attribute describing the rectangle perimeter starting from
 * top-left, tracing clockwise, WITHOUT closing (no Z) so stroke-dashoffset
 * works correctly for progressive reveal.
 *
 * Path: M x,y → h w → v h → h -w → v -h
 */
export function rectPerimeterPath(
  x: number,
  y: number,
  w: number,
  h: number
): string {
  return `M ${fmt(x)},${fmt(y)} h ${fmt(w)} v ${fmt(h)} h ${fmt(-w)} v ${fmt(-h)}`;
}

// ── Shared helpers ───────────────────────────────────────────────────────────

/** Format a number to at most 3 decimal places, trimming trailing zeros. */
function fmt(n: number): string {
  return parseFloat(n.toFixed(3)).toString();
}

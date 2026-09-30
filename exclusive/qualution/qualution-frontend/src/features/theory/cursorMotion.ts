/**
 * cursorMotion.ts
 *
 * Pure-math cursor motion utilities for the QUALUTION Teaching Board.
 *
 * No React, no DOM, no side-effects — fully deterministic and unit-testable.
 *
 * Responsibilities:
 * - Easing functions that give cursor movement an intentional, human feel.
 * - Quadratic Bézier arc interpolation so the cursor glides through a
 *   natural arc rather than a straight mechanical line.
 * - Control-point generation from start/end positions.
 */

import type { Point2D } from './boardCoordinates';

// ── Easing ────────────────────────────────────────────────────────────────

/**
 * Ease-in-out cubic — smooth acceleration and deceleration.
 * Used for deliberate teaching movements where the cursor pauses
 * at both endpoints (teacher picking up their hand, then placing it).
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ease-out cubic — fast start, smooth landing.
 * Used for quick repositioning movements.
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Linear — no easing. Used for teleport-then-settle or testing.
 */
export function linear(t: number): number {
  return t;
}

// ── Bézier Arc ────────────────────────────────────────────────────────────

/**
 * Evaluates a point on a quadratic Bézier curve at parameter t ∈ [0, 1].
 */
export function quadraticBezier(
  t: number,
  p0: Point2D,
  p1: Point2D,
  p2: Point2D
): Point2D {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/**
 * Generates a Bézier control point that produces a gentle arc from
 * `from` to `to`.
 *
 * The bow is perpendicular to the direction of travel, scaled by
 * `bowFactor` (fraction of the chord length). A small, consistent
 * bow (default 0.18) makes movements look like a teacher's hand
 * naturally lifting and landing rather than a robotic straight line.
 *
 * The bow direction is always the same relative side (left of the
 * direction vector) to keep the motion predictable and legible.
 */
export function arcControlPoint(
  from: Point2D,
  to: Point2D,
  bowFactor: number = 0.18
): Point2D {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Perpendicular: rotate direction vector 90° counter-clockwise (-dy, dx)
  return {
    x: midX - dy * bowFactor,
    y: midY + dx * bowFactor,
  };
}

/**
 * Returns the interpolated position along the arc from `from` to `to`
 * at normalized progress t ∈ [0, 1], using the standard bow factor.
 */
export function interpolateArc(
  t: number,
  from: Point2D,
  to: Point2D,
  bowFactor: number = 0.18
): Point2D {
  const ctrl = arcControlPoint(from, to, bowFactor);
  return quadraticBezier(t, from, ctrl, to);
}

// ── Distance ──────────────────────────────────────────────────────────────

/** Euclidean distance between two logical points. */
export function distance(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

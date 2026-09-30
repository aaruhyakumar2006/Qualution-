/**
 * cursorMotion.test.ts
 *
 * Unit tests for the pure-math cursor motion utilities.
 * No React, no DOM — pure numerical assertions.
 */

import { describe, it, expect } from 'vitest';
import {
  easeInOutCubic,
  easeOutCubic,
  linear,
  quadraticBezier,
  arcControlPoint,
  interpolateArc,
  distance,
} from '../../features/theory/cursorMotion';

describe('Easing functions', () => {
  it('easeInOutCubic: returns 0 at t=0 and 1 at t=1', () => {
    expect(easeInOutCubic(0)).toBeCloseTo(0, 10);
    expect(easeInOutCubic(1)).toBeCloseTo(1, 10);
  });

  it('easeInOutCubic: is symmetric around t=0.5', () => {
    expect(easeInOutCubic(0.25)).toBeCloseTo(1 - easeInOutCubic(0.75), 10);
  });

  it('easeInOutCubic: is monotonically increasing', () => {
    const samples = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    for (let i = 0; i < samples.length - 1; i++) {
      expect(easeInOutCubic(samples[i])).toBeLessThanOrEqual(
        easeInOutCubic(samples[i + 1])
      );
    }
  });

  it('easeOutCubic: returns 0 at t=0 and 1 at t=1', () => {
    expect(easeOutCubic(0)).toBeCloseTo(0, 10);
    expect(easeOutCubic(1)).toBeCloseTo(1, 10);
  });

  it('easeOutCubic: progresses faster than linear in the first half', () => {
    // ease-out means fast start — more than 50% progress by t=0.5
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('linear: maps t to t exactly', () => {
    expect(linear(0)).toBe(0);
    expect(linear(0.5)).toBe(0.5);
    expect(linear(1)).toBe(1);
  });
});

describe('quadraticBezier', () => {
  it('returns the start point at t=0', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 500, y: 100 };
    const p2 = { x: 1000, y: 0 };
    const result = quadraticBezier(0, p0, p1, p2);
    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(0, 10);
  });

  it('returns the end point at t=1', () => {
    const p0 = { x: 100, y: 200 };
    const p1 = { x: 500, y: 0 };
    const p2 = { x: 900, y: 400 };
    const result = quadraticBezier(1, p0, p1, p2);
    expect(result.x).toBeCloseTo(900, 10);
    expect(result.y).toBeCloseTo(400, 10);
  });

  it('returns the control point at t=0.5 for a symmetric curve', () => {
    // For a quadratic Bézier, at t=0.5:
    //   B(0.5) = 0.25*p0 + 0.5*p1 + 0.25*p2
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 100, y: 0 };
    const p2 = { x: 200, y: 0 };
    // Straight line: result should be 100
    const result = quadraticBezier(0.5, p0, p1, p2);
    expect(result.x).toBeCloseTo(100, 10);
    expect(result.y).toBeCloseTo(0, 10);
  });

  it('produces a curved path when control point is off-line', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 100, y: 200 }; // bowed upward
    const p2 = { x: 200, y: 0 };
    const mid = quadraticBezier(0.5, p0, p1, p2);
    // Y should be above the straight line (y=0 at midpoint)
    expect(mid.y).toBeGreaterThan(0);
    expect(mid.x).toBeCloseTo(100, 5);
  });
});

describe('arcControlPoint', () => {
  it('returns the midpoint when bowFactor=0 (straight line degenerate case)', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 200, y: 0 };
    const ctrl = arcControlPoint(from, to, 0);
    expect(ctrl.x).toBeCloseTo(100, 10);
    expect(ctrl.y).toBeCloseTo(0, 10);
  });

  it('offsets the control point perpendicularly for a horizontal move', () => {
    // For a purely horizontal movement (dy=0), the perpendicular is vertical.
    const from = { x: 0, y: 360 };
    const to = { x: 1280, y: 360 };
    const ctrl = arcControlPoint(from, to, 0.18);
    // x is still at midpoint (640)
    expect(ctrl.x).toBeCloseTo(640, 5);
    // y is offset by bowFactor × distance in the perpendicular direction
    // perpendicular of (1280, 0) is (0, 1280); scaled by 0.18 → 230.4
    expect(Math.abs(ctrl.y - 360)).toBeCloseTo(1280 * 0.18, 0);
  });

  it('offsets the control point perpendicularly for a vertical move', () => {
    // For a purely vertical movement (dx=0), perpendicular is horizontal.
    const from = { x: 640, y: 0 };
    const to = { x: 640, y: 720 };
    const ctrl = arcControlPoint(from, to, 0.18);
    // y stays at midpoint (360)
    expect(ctrl.y).toBeCloseTo(360, 5);
    // x should be offset horizontally
    expect(Math.abs(ctrl.x - 640)).toBeGreaterThan(0);
  });
});

describe('interpolateArc', () => {
  it('starts at the from point (t=0)', () => {
    const from = { x: 100, y: 200 };
    const to = { x: 800, y: 500 };
    const result = interpolateArc(0, from, to);
    expect(result.x).toBeCloseTo(100, 5);
    expect(result.y).toBeCloseTo(200, 5);
  });

  it('ends at the to point (t=1)', () => {
    const from = { x: 100, y: 200 };
    const to = { x: 800, y: 500 };
    const result = interpolateArc(1, from, to);
    expect(result.x).toBeCloseTo(800, 5);
    expect(result.y).toBeCloseTo(500, 5);
  });

  it('produces intermediate positions strictly between endpoints', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 1000, y: 0 };
    const mid = interpolateArc(0.5, from, to);
    expect(mid.x).toBeGreaterThan(0);
    expect(mid.x).toBeLessThan(1000);
  });
});

describe('distance', () => {
  it('returns 0 for identical points', () => {
    expect(distance({ x: 100, y: 200 }, { x: 100, y: 200 })).toBe(0);
  });

  it('returns correct Euclidean distance for a 3-4-5 triangle', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5, 10);
  });

  it('is symmetric', () => {
    const a = { x: 100, y: 300 };
    const b = { x: 400, y: 600 };
    expect(distance(a, b)).toBeCloseTo(distance(b, a), 10);
  });
});

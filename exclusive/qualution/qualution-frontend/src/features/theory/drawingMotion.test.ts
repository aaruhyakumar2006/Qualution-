/**
 * drawingMotion.test.ts
 *
 * PHASE 5: Pure unit tests for drawingMotion geometry.
 * No DOM, no React, no mocks required.
 */

import { describe, it, expect } from 'vitest';
import {
  lineLength,
  pointOnLine,
  lineDashOffset,
  lineDirection,
  arrowShaftEnd,
  arrowHeadPoints,
  circleCircumference,
  pointOnCircle,
  circleDashOffset,
  rectPerimeter,
  pointOnRect,
  rectDashOffset,
  rectPerimeterPath,
  DEFAULT_ARROW_SIZE,
  ARROWHEAD_APPEAR_THRESHOLD,
} from './drawingMotion';

const EPSILON = 0.001;
const near = (a: number, b: number) => Math.abs(a - b) < EPSILON;

// ── lineLength ───────────────────────────────────────────────────────────────

describe('lineLength', () => {
  it('returns 0 for a zero-length line', () => {
    expect(lineLength(10, 20, 10, 20)).toBe(0);
  });

  it('computes horizontal length correctly', () => {
    expect(lineLength(0, 0, 100, 0)).toBe(100);
  });

  it('computes vertical length correctly', () => {
    expect(lineLength(0, 0, 0, 80)).toBe(80);
  });

  it('computes diagonal length correctly (3-4-5 triangle)', () => {
    expect(lineLength(0, 0, 30, 40)).toBeCloseTo(50, 5);
  });

  it('is symmetric (start/end order does not matter)', () => {
    expect(lineLength(100, 200, 300, 400)).toBeCloseTo(lineLength(300, 400, 100, 200), 5);
  });
});

// ── pointOnLine ──────────────────────────────────────────────────────────────

describe('pointOnLine', () => {
  it('returns start point at t=0', () => {
    const p = pointOnLine(10, 20, 200, 300, 0);
    expect(near(p.x, 10)).toBe(true);
    expect(near(p.y, 20)).toBe(true);
  });

  it('returns end point at t=1', () => {
    const p = pointOnLine(10, 20, 200, 300, 1);
    expect(near(p.x, 200)).toBe(true);
    expect(near(p.y, 300)).toBe(true);
  });

  it('returns midpoint at t=0.5', () => {
    const p = pointOnLine(0, 0, 100, 200, 0.5);
    expect(near(p.x, 50)).toBe(true);
    expect(near(p.y, 100)).toBe(true);
  });

  it('clamps t below 0 to start point', () => {
    const p = pointOnLine(10, 20, 200, 300, -0.5);
    expect(near(p.x, 10)).toBe(true);
    expect(near(p.y, 20)).toBe(true);
  });

  it('clamps t above 1 to end point', () => {
    const p = pointOnLine(10, 20, 200, 300, 2);
    expect(near(p.x, 200)).toBe(true);
    expect(near(p.y, 300)).toBe(true);
  });
});

// ── lineDashOffset ───────────────────────────────────────────────────────────

describe('lineDashOffset', () => {
  it('returns full length at t=0 (fully hidden)', () => {
    expect(lineDashOffset(200, 0)).toBeCloseTo(200, 5);
  });

  it('returns 0 at t=1 (fully revealed)', () => {
    expect(lineDashOffset(200, 1)).toBeCloseTo(0, 5);
  });

  it('returns half length at t=0.5', () => {
    expect(lineDashOffset(200, 0.5)).toBeCloseTo(100, 5);
  });
});

// ── arrowHeadPoints ──────────────────────────────────────────────────────────

describe('arrowHeadPoints', () => {
  it('returns a non-empty string', () => {
    const pts = arrowHeadPoints(0, 0, 100, 0, DEFAULT_ARROW_SIZE);
    expect(typeof pts).toBe('string');
    expect(pts.length).toBeGreaterThan(0);
  });

  it('produces exactly 3 coordinate pairs (tip, left, right)', () => {
    const pts = arrowHeadPoints(0, 0, 100, 0, DEFAULT_ARROW_SIZE);
    const pairs = pts.trim().split(/\s+/);
    expect(pairs).toHaveLength(3);
    for (const pair of pairs) {
      const coords = pair.split(',');
      expect(coords).toHaveLength(2);
      expect(isNaN(parseFloat(coords[0]))).toBe(false);
      expect(isNaN(parseFloat(coords[1]))).toBe(false);
    }
  });

  it('tip coincides with (x2,y2) for a horizontal arrow', () => {
    const pts = arrowHeadPoints(0, 0, 100, 0, DEFAULT_ARROW_SIZE);
    const tip = pts.trim().split(/\s+/)[0].split(',');
    expect(parseFloat(tip[0])).toBeCloseTo(100, 3);
    expect(parseFloat(tip[1])).toBeCloseTo(0, 3);
  });

  it('is deterministic: same inputs produce same output', () => {
    const a = arrowHeadPoints(50, 50, 300, 200, DEFAULT_ARROW_SIZE);
    const b = arrowHeadPoints(50, 50, 300, 200, DEFAULT_ARROW_SIZE);
    expect(a).toBe(b);
  });
});

// ── arrowShaftEnd ────────────────────────────────────────────────────────────

describe('arrowShaftEnd', () => {
  it('shaft end is between start and tip', () => {
    const end = arrowShaftEnd(0, 0, 200, 0, DEFAULT_ARROW_SIZE);
    expect(end.x).toBeGreaterThan(0);
    expect(end.x).toBeLessThan(200);
    expect(near(end.y, 0)).toBe(true);
  });

  it('shaft end is close to tip for very long lines', () => {
    const end = arrowShaftEnd(0, 0, 1000, 0, DEFAULT_ARROW_SIZE);
    expect(1000 - end.x).toBeLessThan(DEFAULT_ARROW_SIZE);
  });
});

// ── circleCircumference ──────────────────────────────────────────────────────

describe('circleCircumference', () => {
  it('returns 2πr for radius 100', () => {
    expect(circleCircumference(100)).toBeCloseTo(2 * Math.PI * 100, 5);
  });

  it('returns 0 for radius 0', () => {
    expect(circleCircumference(0)).toBe(0);
  });

  it('uses absolute value of negative radius', () => {
    expect(circleCircumference(-50)).toBeCloseTo(circleCircumference(50), 5);
  });
});

// ── pointOnCircle ────────────────────────────────────────────────────────────

describe('pointOnCircle', () => {
  const cx = 200, cy = 200, r = 100;

  it("starts at the top (12 o'clock) at t=0", () => {
    const p = pointOnCircle(cx, cy, r, 0);
    expect(near(p.x, cx)).toBe(true);
    expect(near(p.y, cy - r)).toBe(true);
  });

  it("is at the right (3 o'clock) at t=0.25", () => {
    const p = pointOnCircle(cx, cy, r, 0.25);
    expect(near(p.x, cx + r)).toBe(true);
    expect(near(p.y, cy)).toBe(true);
  });

  it("is at the bottom (6 o'clock) at t=0.5", () => {
    const p = pointOnCircle(cx, cy, r, 0.5);
    expect(near(p.x, cx)).toBe(true);
    expect(near(p.y, cy + r)).toBe(true);
  });

  it("is at the left (9 o'clock) at t=0.75", () => {
    const p = pointOnCircle(cx, cy, r, 0.75);
    expect(near(p.x, cx - r)).toBe(true);
    expect(near(p.y, cy)).toBe(true);
  });

  it('returns to start at t=1', () => {
    const p0 = pointOnCircle(cx, cy, r, 0);
    const p1 = pointOnCircle(cx, cy, r, 1);
    expect(near(p0.x, p1.x)).toBe(true);
    expect(near(p0.y, p1.y)).toBe(true);
  });

  it('all points lie on the circle (distance from center = r)', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      const p = pointOnCircle(cx, cy, r, t);
      const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
      expect(dist).toBeCloseTo(r, 3);
    }
  });
});

// ── circleDashOffset ─────────────────────────────────────────────────────────

describe('circleDashOffset', () => {
  it('returns full circumference at t=0', () => {
    const c = circleCircumference(80);
    expect(circleDashOffset(80, 0)).toBeCloseTo(c, 5);
  });

  it('returns 0 at t=1', () => {
    expect(circleDashOffset(80, 1)).toBeCloseTo(0, 5);
  });
});

// ── rectPerimeter ────────────────────────────────────────────────────────────

describe('rectPerimeter', () => {
  it('returns 2*(w+h)', () => {
    expect(rectPerimeter(100, 60)).toBe(320);
  });

  it('handles square', () => {
    expect(rectPerimeter(50, 50)).toBe(200);
  });

  it('uses absolute values', () => {
    expect(rectPerimeter(-100, -60)).toBe(rectPerimeter(100, 60));
  });
});

// ── pointOnRect ──────────────────────────────────────────────────────────────

describe('pointOnRect', () => {
  const x = 100, y = 50, w = 200, h = 100;

  it('starts at top-left at t=0', () => {
    const p = pointOnRect(x, y, w, h, 0);
    expect(near(p.x, x)).toBe(true);
    expect(near(p.y, y)).toBe(true);
  });

  it('reaches top-right at t = w/perimeter', () => {
    const perim = rectPerimeter(w, h);
    const p = pointOnRect(x, y, w, h, w / perim);
    expect(near(p.x, x + w)).toBe(true);
    expect(near(p.y, y)).toBe(true);
  });

  it('reaches bottom-right at t = (w+h)/perimeter', () => {
    const perim = rectPerimeter(w, h);
    const p = pointOnRect(x, y, w, h, (w + h) / perim);
    expect(near(p.x, x + w)).toBe(true);
    expect(near(p.y, y + h)).toBe(true);
  });

  it('reaches bottom-left at t = (2w+h)/perimeter', () => {
    const perim = rectPerimeter(w, h);
    const p = pointOnRect(x, y, w, h, (2 * w + h) / perim);
    expect(near(p.x, x)).toBe(true);
    expect(near(p.y, y + h)).toBe(true);
  });

  it('returns near start at t=1', () => {
    const p = pointOnRect(x, y, w, h, 1);
    // At t=1 the path has almost looped back to start
    expect(near(p.x, x)).toBe(true);
    expect(near(p.y, y)).toBe(true);
  });
});

// ── rectDashOffset ────────────────────────────────────────────────────────────

describe('rectDashOffset', () => {
  it('returns full perimeter at t=0', () => {
    const p = rectPerimeter(120, 80);
    expect(rectDashOffset(120, 80, 0)).toBeCloseTo(p, 5);
  });

  it('returns 0 at t=1', () => {
    expect(rectDashOffset(120, 80, 1)).toBeCloseTo(0, 5);
  });
});

// ── rectPerimeterPath ─────────────────────────────────────────────────────────

describe('rectPerimeterPath', () => {
  it('starts with M (moveto) at the given position', () => {
    const d = rectPerimeterPath(10, 20, 100, 60);
    expect(d).toMatch(/^M 10,20/);
  });

  it('is a non-empty string', () => {
    expect(rectPerimeterPath(0, 0, 200, 100).length).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    expect(rectPerimeterPath(10, 20, 100, 60)).toBe(rectPerimeterPath(10, 20, 100, 60));
  });
});

// ── ARROWHEAD_APPEAR_THRESHOLD ────────────────────────────────────────────────

describe('ARROWHEAD_APPEAR_THRESHOLD', () => {
  it('is between 0.5 and 1.0', () => {
    expect(ARROWHEAD_APPEAR_THRESHOLD).toBeGreaterThan(0.5);
    expect(ARROWHEAD_APPEAR_THRESHOLD).toBeLessThan(1.0);
  });
});

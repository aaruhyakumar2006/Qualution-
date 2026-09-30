import { describe, it, expect } from 'vitest';
import {
  estimateCharWidth,
  estimateTextWidth,
  computeTextBounds,
  interpolateWritingPosition,
} from './textMotion';

describe('textMotion (Phase 3 Typographical Geometry)', () => {
  describe('estimateCharWidth', () => {
    it('calculates monospace character widths uniformly', () => {
      const fontSize = 40;
      expect(estimateCharWidth('A', fontSize, true)).toBe(24);
      expect(estimateCharWidth('i', fontSize, true)).toBe(24);
      expect(estimateCharWidth('W', fontSize, true)).toBe(24);
      expect(estimateCharWidth(' ', fontSize, true)).toBe(24);
    });

    it('estimates proportional character widths with realistic ratios', () => {
      const fontSize = 40;
      const narrow = estimateCharWidth('i', fontSize, false);
      const wide = estimateCharWidth('W', fontSize, false);
      const space = estimateCharWidth(' ', fontSize, false);
      const standard = estimateCharWidth('e', fontSize, false);

      expect(narrow).toBeLessThan(standard);
      expect(standard).toBeLessThan(wide);
      expect(space).toBe(fontSize * 0.28);
    });
  });

  describe('estimateTextWidth', () => {
    it('returns 0 for empty string', () => {
      expect(estimateTextWidth('', 40)).toBe(0);
    });

    it('scales linearly with font size', () => {
      const str = 'WHAT IS A QUBIT?';
      const width30 = estimateTextWidth(str, 30);
      const width60 = estimateTextWidth(str, 60);
      expect(Math.round(width60)).toBe(Math.round(width30 * 2));
    });

    it('accounts for letter spacing', () => {
      const str = 'HELLO';
      const baseWidth = estimateTextWidth(str, 40, 'Inter, sans-serif', 0);
      const spacedWidth = estimateTextWidth(str, 40, 'Inter, sans-serif', 4);
      expect(spacedWidth).toBe(baseWidth + 4 * 4); // 4 spaces between 5 chars
    });
  });

  describe('computeTextBounds', () => {
    it('positions left-aligned text starting at anchor x', () => {
      const bounds = computeTextBounds('WHAT IS A QUBIT?', 200, 150, 48, 'left');
      expect(bounds.left).toBe(200);
      expect(bounds.startX).toBe(200);
      expect(bounds.endX).toBe(200 + bounds.width);
      expect(bounds.top).toBe(150);
      expect(bounds.bottom).toBe(150 + bounds.height);
      expect(bounds.align).toBe('left');
    });

    it('positions center-aligned text centered around anchor x', () => {
      const bounds = computeTextBounds('WHAT IS A QUBIT?', 640, 200, 48, 'center');
      expect(bounds.left).toBe(640 - bounds.width / 2);
      expect(bounds.startX).toBe(bounds.left);
      expect(bounds.endX).toBe(bounds.left + bounds.width);
      expect(bounds.right).toBe(bounds.left + bounds.width);
    });

    it('positions right-aligned text ending at anchor x', () => {
      const bounds = computeTextBounds('WHAT IS A QUBIT?', 1000, 200, 48, 'right');
      expect(bounds.left).toBe(1000 - bounds.width);
      expect(bounds.endX).toBe(1000);
      expect(bounds.right).toBe(1000);
    });
  });

  describe('interpolateWritingPosition', () => {
    const bounds = computeTextBounds('WHAT IS A QUBIT?', 200, 100, 40, 'left');

    it('returns start position at progress 0', () => {
      const pos = interpolateWritingPosition(bounds, 0);
      expect(pos.x).toBe(bounds.startX);
      expect(pos.y).toBe(bounds.writeY);
    });

    it('returns exact midpoint at progress 0.5', () => {
      const pos = interpolateWritingPosition(bounds, 0.5);
      const expectedX = Math.round((bounds.startX + bounds.width * 0.5) * 100) / 100;
      expect(pos.x).toBe(expectedX);
      expect(pos.y).toBe(bounds.writeY);
    });

    it('returns end position at progress 1', () => {
      const pos = interpolateWritingPosition(bounds, 1);
      expect(pos.x).toBe(bounds.endX);
      expect(pos.y).toBe(bounds.writeY);
    });

    it('strictly clamps progress below 0 and above 1', () => {
      const neg = interpolateWritingPosition(bounds, -0.5);
      expect(neg.x).toBe(bounds.startX);

      const excess = interpolateWritingPosition(bounds, 1.5);
      expect(excess.x).toBe(bounds.endX);
    });

    it('is strictly deterministic across repeated invocations', () => {
      const first = interpolateWritingPosition(bounds, 0.37);
      for (let i = 0; i < 50; i++) {
        const check = interpolateWritingPosition(bounds, 0.37);
        expect(check.x).toBe(first.x);
        expect(check.y).toBe(first.y);
      }
    });
  });
});

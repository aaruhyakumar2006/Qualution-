import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LOGICAL_WIDTH,
  DEFAULT_LOGICAL_HEIGHT,
  calculateBoardViewport,
  logicalToPhysical,
  physicalToLogical,
  logicalToStage,
  logicalToPercent,
  clampLogical,
  clearTeachingBoard,
} from './boardCoordinates';

describe('boardCoordinates system', () => {
  // ── 1. Board Initialization & Viewport Sizing ───────────────────────────

  it('initializes with default 1280x720 logical coordinates at 1:1 scale when container matches', () => {
    const vp = calculateBoardViewport(1280, 720);
    expect(vp.logicalWidth).toBe(1280);
    expect(vp.logicalHeight).toBe(720);
    expect(vp.scale).toBe(1);
    expect(vp.stageWidth).toBe(1280);
    expect(vp.stageHeight).toBe(720);
    expect(vp.stageLeft).toBe(0);
    expect(vp.stageTop).toBe(0);
    expect(vp.dpr).toBe(1);
    expect(vp.pixelWidth).toBe(1280);
    expect(vp.pixelHeight).toBe(720);
  });

  it('handles zero or unmounted container dimensions safely', () => {
    const vp = calculateBoardViewport(0, 0);
    expect(vp.scale).toBe(1);
    expect(vp.stageWidth).toBe(1280);
    expect(vp.stageHeight).toBe(720);
    expect(vp.stageLeft).toBe(0);
    expect(vp.stageTop).toBe(0);
  });

  // ── 2. Responsive Resizing & Aspect Ratio Preservation ─────────────────

  it('scales correctly for 1080p full HD display (1920x1080)', () => {
    const vp = calculateBoardViewport(1920, 1080);
    expect(vp.scale).toBe(1.5);
    expect(vp.stageWidth).toBe(1920);
    expect(vp.stageHeight).toBe(1080);
    expect(vp.stageLeft).toBe(0);
    expect(vp.stageTop).toBe(0);
  });

  it('letterboxes horizontally (pillarbox) when container is ultra-wide (e.g. 2560x1080)', () => {
    const vp = calculateBoardViewport(2560, 1080);
    // Height limits scaling: 1080 / 720 = 1.5
    expect(vp.scale).toBe(1.5);
    expect(vp.stageWidth).toBe(1920);
    expect(vp.stageHeight).toBe(1080);
    // Letterbox margin on left and right: (2560 - 1920) / 2 = 320px
    expect(vp.stageLeft).toBe(320);
    expect(vp.stageTop).toBe(0);
  });

  it('letterboxes vertically when container is tall / narrow (e.g. mobile 400x800)', () => {
    const vp = calculateBoardViewport(400, 800);
    // Width limits scaling: 400 / 1280 = 0.3125
    expect(vp.scale).toBeCloseTo(0.3125, 4);
    expect(vp.stageWidth).toBe(400);
    expect(vp.stageHeight).toBe(Math.round(720 * 0.3125)); // 225
    expect(vp.stageLeft).toBe(0);
    expect(vp.stageTop).toBe(Math.round((800 - 225) / 2)); // 288
  });

  // ── 3. High-DPI / Retina Display Scaling ───────────────────────────────

  it('correctly scales internal canvas buffer by devicePixelRatio without altering logical stage size', () => {
    const vp = calculateBoardViewport(1280, 720, 1280, 720, 2); // 2x DPR
    expect(vp.scale).toBe(1);
    expect(vp.stageWidth).toBe(1280);
    expect(vp.stageHeight).toBe(720);
    expect(vp.dpr).toBe(2);
    // Internal canvas buffer is 2x for retina sharpness
    expect(vp.pixelWidth).toBe(2560);
    expect(vp.pixelHeight).toBe(1440);
  });

  it('handles custom DPR (e.g., 1.5x or 3x on mobile OLED screens)', () => {
    const vp = calculateBoardViewport(848, 474, 1280, 720, 3);
    expect(vp.dpr).toBe(3);
    expect(vp.pixelWidth).toBe(Math.round(vp.stageWidth * 3));
    expect(vp.pixelHeight).toBe(Math.round(vp.stageHeight * 3));
  });

  // ── 4. Logical Coordinate Conversion ───────────────────────────────────

  it('converts logical board coordinates to physical container coordinates', () => {
    const vp = calculateBoardViewport(2560, 1080); // scale 1.5, stageLeft 320, stageTop 0
    const physicalOrigin = logicalToPhysical({ x: 0, y: 0 }, vp);
    expect(physicalOrigin.x).toBe(320);
    expect(physicalOrigin.y).toBe(0);

    const physicalCenter = logicalToPhysical({ x: 640, y: 360 }, vp);
    expect(physicalCenter.x).toBe(320 + 640 * 1.5); // 1280
    expect(physicalCenter.y).toBe(0 + 360 * 1.5); // 540

    const physicalBottomRight = logicalToPhysical({ x: 1280, y: 720 }, vp);
    expect(physicalBottomRight.x).toBe(320 + 1920); // 2240
    expect(physicalBottomRight.y).toBe(1080);
  });

  it('converts physical container coordinates back to logical board units (invertible)', () => {
    const vp = calculateBoardViewport(2560, 1080);
    const original = { x: 420, y: 180 };
    const physical = logicalToPhysical(original, vp);
    const backToLogical = physicalToLogical(physical, vp);

    expect(backToLogical.x).toBeCloseTo(original.x, 3);
    expect(backToLogical.y).toBeCloseTo(original.y, 3);
  });

  it('converts logical coordinates to stage-relative pixels', () => {
    const vp = calculateBoardViewport(1920, 1080); // scale 1.5
    const stagePt = logicalToStage({ x: 100, y: 50 }, vp);
    expect(stagePt.x).toBe(150);
    expect(stagePt.y).toBe(75);
  });

  it('converts logical coordinates to percentage strings for CSS positioning', () => {
    const pct = logicalToPercent({ x: 640, y: 360 }, 1280, 720);
    expect(pct.left).toBe('50.0000%');
    expect(pct.top).toBe('50.0000%');
  });

  it('clamps logical coordinates inside valid board boundaries', () => {
    const outside = { x: -50, y: 800 };
    const clamped = clampLogical(outside, 1280, 720);
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(720);
  });

  // ── 5. Reset and Clear Utilities ───────────────────────────────────────

  it('clears canvas, dom layer, and svg layer during reset', () => {
    // Mock canvas context
    const clearRectMock = vi.fn();
    const saveMock = vi.fn();
    const restoreMock = vi.fn();
    const setTransformMock = vi.fn();

    const mockCanvas = {
      width: 1280,
      height: 720,
      getContext: () => ({
        save: saveMock,
        restore: restoreMock,
        setTransform: setTransformMock,
        clearRect: clearRectMock,
      }),
    } as unknown as HTMLCanvasElement;

    // Mock DOM layer
    const mockDom = document.createElement('div');
    mockDom.appendChild(document.createElement('span'));
    mockDom.appendChild(document.createElement('div'));
    expect(mockDom.childNodes.length).toBe(2);

    // Mock SVG layer
    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mockSvg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'line'));
    expect(mockSvg.childNodes.length).toBe(1);

    clearTeachingBoard(mockCanvas, mockDom, mockSvg);

    expect(clearRectMock).toHaveBeenCalledWith(0, 0, 1280, 720);
    expect(mockDom.childNodes.length).toBe(0);
    expect(mockSvg.childNodes.length).toBe(0);
  });
});

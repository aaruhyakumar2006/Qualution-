import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TeachingBoard, type TeachingBoardRef } from './TeachingBoard';

describe('TeachingBoard Component (Phase 1)', () => {
  let originalDpr: number;

  beforeEach(() => {
    originalDpr = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 1,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: originalDpr,
    });
    vi.restoreAllMocks();
  });

  // ── 1. Board Initialization ─────────────────────────────────────────────

  it('renders a completely empty teaching board with 4 pristine layers and no lesson content', () => {
    render(<TeachingBoard />);

    const container = screen.getByTestId('teaching-board-container');
    const stage = screen.getByTestId('teaching-board-stage');
    const canvas = screen.getByTestId('teaching-board-canvas');
    const svgLayer = screen.getByTestId('teaching-board-svg');
    const domLayer = screen.getByTestId('teaching-board-dom');
    const cursorLayer = screen.getByTestId('teaching-board-cursor-layer');

    expect(container).toBeInTheDocument();
    expect(stage).toBeInTheDocument();
    expect(canvas).toBeInTheDocument();
    expect(svgLayer).toBeInTheDocument();
    expect(domLayer).toBeInTheDocument();
    expect(cursorLayer).toBeInTheDocument();

    // Verify Phase 1 invariant: board layers are completely empty
    expect(domLayer.childNodes.length).toBe(0);
    expect(cursorLayer.childNodes.length).toBe(0);
    expect(svgLayer.childNodes.length).toBe(0);

    // No hardcoded buttons, timeline, slides, or cards
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('configures SVG layer with matching logical coordinate viewBox', () => {
    render(<TeachingBoard logicalWidth={1280} logicalHeight={720} />);
    const svgLayer = screen.getByTestId('teaching-board-svg');
    expect(svgLayer.getAttribute('viewBox')).toBe('0 0 1280 720');
  });

  // ── 2. Resize & High-DPI Adaptation ────────────────────────────────────

  it('adapts stage and internal canvas resolution on resize', () => {
    const boardRef = createRef<TeachingBoardRef>();
    const onResizeMock = vi.fn();

    const { container } = render(
      <div style={{ width: '1920px', height: '1080px' }}>
        <TeachingBoard ref={boardRef} onResize={onResizeMock} />
      </div>
    );

    const boardContainer = container.querySelector('.teaching-board-container') as HTMLDivElement;

    // Mock container getBoundingClientRect
    vi.spyOn(boardContainer, 'getBoundingClientRect').mockReturnValue({
      width: 1920,
      height: 1080,
      top: 0,
      left: 0,
      bottom: 1080,
      right: 1920,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    act(() => {
      // Trigger window resize event to invoke updateDimensions
      window.dispatchEvent(new Event('resize'));
    });

    expect(boardRef.current).not.toBeNull();
    const vp = boardRef.current!.getViewport();
    expect(vp.stageWidth).toBe(1920);
    expect(vp.stageHeight).toBe(1080);
    expect(vp.scale).toBe(1.5);
  });

  it('scales internal canvas buffer on high-DPI screens without altering logical layout', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 2, // Retina 2x
    });

    const boardRef = createRef<TeachingBoardRef>();
    const { container } = render(
      <div style={{ width: '1280px', height: '720px' }}>
        <TeachingBoard ref={boardRef} />
      </div>
    );

    const boardContainer = container.querySelector('.teaching-board-container') as HTMLDivElement;
    vi.spyOn(boardContainer, 'getBoundingClientRect').mockReturnValue({
      width: 1280,
      height: 720,
      top: 0,
      left: 0,
      bottom: 720,
      right: 1280,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    const canvas = screen.getByTestId('teaching-board-canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(2560); // 1280 * 2
    expect(canvas.height).toBe(1440); // 720 * 2
  });

  // ── 3. Logical Coordinate Conversion via Ref ───────────────────────────

  it('provides exact toPhysical and toLogical conversions via imperative ref', () => {
    const boardRef = createRef<TeachingBoardRef>();
    const { container } = render(
      <div style={{ width: '1280px', height: '720px' }}>
        <TeachingBoard ref={boardRef} />
      </div>
    );

    const boardContainer = container.querySelector('.teaching-board-container') as HTMLDivElement;
    vi.spyOn(boardContainer, 'getBoundingClientRect').mockReturnValue({
      width: 1280,
      height: 720,
      top: 0,
      left: 0,
      bottom: 720,
      right: 1280,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    const ref = boardRef.current!;
    expect(ref).not.toBeNull();

    // At 1280x720 1:1 scale, (640, 360) logical is (640, 360) physical
    const physical = ref.toPhysical({ x: 640, y: 360 });
    expect(physical.x).toBe(640);
    expect(physical.y).toBe(360);

    const logical = ref.toLogical({ x: 640, y: 360 });
    expect(logical.x).toBe(640);
    expect(logical.y).toBe(360);
  });

  // ── 4. Reset / Clear Functionality ─────────────────────────────────────

  it('clears board content when clear() is called via ref', () => {
    const boardRef = createRef<TeachingBoardRef>();
    render(<TeachingBoard ref={boardRef} />);

    const ref = boardRef.current!;
    const domLayer = ref.getDomLayer()!;
    const svgLayer = ref.getSvgLayer()!;

    // Manually add mock elements as if a drawing/text action had occurred
    const testElement = document.createElement('div');
    testElement.textContent = 'Test Equation';
    domLayer.appendChild(testElement);

    const testSvgEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    svgLayer.appendChild(testSvgEl);

    expect(domLayer.childNodes.length).toBe(1);
    expect(svgLayer.childNodes.length).toBe(1);

    // Call clear()
    act(() => {
      ref.clear();
    });

    expect(domLayer.childNodes.length).toBe(0);
    expect(svgLayer.childNodes.length).toBe(0);
  });
});

/**
 * TeachingBoard.tsx
 *
 * PHASE 1: Empty Academic Teaching Board Foundation.
 *
 * Responsibilities:
 * - Provides a clean, dark, distraction-free academic teaching surface.
 * - Establishes a resolution-independent logical coordinate system (default: 1280 × 720).
 * - Automatically computes uniform aspect-ratio scaling (letterbox/pillarbox).
 * - Implements full high-DPI (devicePixelRatio) canvas buffer sizing and context transformation.
 * - Hosts 4 clean rendering layers (Canvas, SVG, DOM Typography/Math, Cursor), all completely empty in Phase 1.
 * - Exposes imperatively safe methods via ref (viewport, coordinate conversion, reset/clear).
 * - Does NOT hardcode any lesson content, animations, or playback controls.
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  DEFAULT_LOGICAL_WIDTH,
  DEFAULT_LOGICAL_HEIGHT,
  calculateBoardViewport,
  logicalToPhysical,
  physicalToLogical,
  clearTeachingBoard,
  type BoardViewport,
  type Point2D,
} from '../../features/theory/boardCoordinates';
import './TeachingBoard.css';

export interface TeachingBoardProps {
  /** Logical width in board coordinate units (default: 1280) */
  logicalWidth?: number;
  /** Logical height in board coordinate units (default: 720) */
  logicalHeight?: number;
  /** Whether to render subtle pedagogical background coordinate grid lines (default: true) */
  showGrid?: boolean;
  /** Optional custom CSS class for outer container */
  className?: string;
  /** Optional inline styles for outer container */
  style?: React.CSSProperties;
  /** Optional callback fired when the board recalculates its viewport geometry */
  onResize?: (viewport: BoardViewport) => void;
  /**
   * Children are rendered inside the cursor layer (Layer 4).
   * Use this to inject Phase 2+ components: BoardCursor, annotation overlays, etc.
   */
  children?: React.ReactNode;
  /**
   * Optional children rendered inside the DOM Typography layer (Layer 3).
   * Use this to inject Phase 3+ components: BoardTextLayer, etc.
   */
  textChildren?: React.ReactNode;
  /**
   * Optional children rendered inside the SVG layer (Layer 2).
   * Use this to inject Phase 5+ components: BoardDrawingLayer, etc.
   */
  svgChildren?: React.ReactNode;
  /**
   * Optional overlay children rendered above all layers inside the stage container.
   * Use this to inject Phase 7+ components: CaptionLayer, HUD indicators, etc.
   */
  overlayChildren?: React.ReactNode;
}

export interface TeachingBoardRef {
  /** The current calculated board viewport geometry */
  getViewport: () => BoardViewport;
  /** Direct access to the underlying 2D Canvas element */
  getCanvas: () => HTMLCanvasElement | null;
  /** Direct access to the 2D rendering context with logical coordinate transform applied */
  getContext: () => CanvasRenderingContext2D | null;
  /** Direct access to the SVG layer element */
  getSvgLayer: () => SVGSVGElement | null;
  /** Direct access to the DOM Typography/KaTeX layer container */
  getDomLayer: () => HTMLDivElement | null;
  /** Direct access to the teacher cursor layer container */
  getCursorLayer: () => HTMLDivElement | null;
  /** Clears all drawn content, text, and annotations from the board */
  clear: () => void;
  /** Converts a logical board coordinate into physical container pixels */
  toPhysical: (point: Point2D) => Point2D;
  /** Converts a physical container pixel coordinate into logical board units */
  toLogical: (point: Point2D) => Point2D;
}

export const TeachingBoard = forwardRef<TeachingBoardRef, TeachingBoardProps>(
  (
    {
      logicalWidth = DEFAULT_LOGICAL_WIDTH,
      logicalHeight = DEFAULT_LOGICAL_HEIGHT,
      showGrid = true,
      className = '',
      style,
      onResize,
      children,
      textChildren,
      svgChildren,
      overlayChildren,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const domLayerRef = useRef<HTMLDivElement>(null);
    const cursorLayerRef = useRef<HTMLDivElement>(null);

    // Viewport state
    const [viewport, setViewport] = useState<BoardViewport>(() =>
      calculateBoardViewport(0, 0, logicalWidth, logicalHeight, 1)
    );

    const updateDimensions = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const newVp = calculateBoardViewport(
        rect.width,
        rect.height,
        logicalWidth,
        logicalHeight,
        dpr
      );

      setViewport(newVp);

      // Configure high-DPI canvas buffer and transform matrix
      const canvas = canvasRef.current;
      if (canvas && newVp.pixelWidth > 0 && newVp.pixelHeight > 0) {
        canvas.width = newVp.pixelWidth;
        canvas.height = newVp.pixelHeight;

        try {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Reset transform to identity and scale to logical coordinate space
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            const totalScale = newVp.dpr * newVp.scale;
            ctx.scale(totalScale, totalScale);
          }
        } catch {
          // Gracefully handle environments without native Canvas implementation
        }
      }

      onResize?.(newVp);
    }, [logicalWidth, logicalHeight, onResize]);

    // Observe container resizing
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      updateDimensions();

      const onWindowResize = () => updateDimensions();
      window.addEventListener('resize', onWindowResize);

      let observer: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => {
          updateDimensions();
        });
        observer.observe(container);
      }

      return () => {
        window.removeEventListener('resize', onWindowResize);
        observer?.disconnect();
      };
    }, [updateDimensions]);

    // Expose ref API
    useImperativeHandle(
      ref,
      () => ({
        getViewport: () => viewport,
        getCanvas: () => canvasRef.current,
        getContext: () => {
          try {
            return canvasRef.current?.getContext('2d') ?? null;
          } catch {
            return null;
          }
        },
        getSvgLayer: () => svgRef.current,
        getDomLayer: () => domLayerRef.current,
        getCursorLayer: () => cursorLayerRef.current,
        clear: () =>
          clearTeachingBoard(
            canvasRef.current,
            domLayerRef.current,
            svgRef.current
          ),
        toPhysical: (pt: Point2D) => logicalToPhysical(pt, viewport),
        toLogical: (pt: Point2D) => physicalToLogical(pt, viewport),
      }),
      [viewport]
    );

    return (
      <div
        ref={containerRef}
        className={`teaching-board-container ${className}`.trim()}
        style={style}
        data-testid="teaching-board-container"
        role="region"
        aria-label="Quantum Teaching Board"
      >
        {/* Active Stage (Scaled to 16:9 and centered) */}
        <div
          ref={stageRef}
          className={`teaching-board-stage ${showGrid ? 'has-grid' : ''}`}
          data-testid="teaching-board-stage"
          style={{
            width: `${viewport.stageWidth}px`,
            height: `${viewport.stageHeight}px`,
            left: `${viewport.stageLeft}px`,
            top: `${viewport.stageTop}px`,
            ['--stage-scale' as string]: viewport.scale,
          }}
        >
          {/* Layer 1: High-DPI Canvas Rendering Surface */}
          <canvas
            ref={canvasRef}
            className="teaching-board-canvas-layer"
            data-testid="teaching-board-canvas"
            aria-hidden="true"
          />

          {/* Layer 2: Scalable Vector Geometry Surface (viewBox = logical units) */}
          <svg
            ref={svgRef}
            className="teaching-board-svg-layer"
            data-testid="teaching-board-svg"
            viewBox={`0 0 ${logicalWidth} ${logicalHeight}`}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {svgChildren}
          </svg>

          {/* Layer 3: DOM Typography & Mathematical Notation Layer */}
          <div
            ref={domLayerRef}
            className="teaching-board-dom-layer"
            data-testid="teaching-board-dom"
            aria-live="polite"
          >
            {textChildren}
          </div>

          {/* Layer 4: Teacher Cursor & Attention Guidance Layer */}
          <div
            ref={cursorLayerRef}
            className="teaching-board-cursor-layer"
            data-testid="teaching-board-cursor-layer"
            aria-hidden="true"
          >
            {children}
          </div>

          {/* Layer 5 (Overlay): Captions, HUD, and Pedagogical Overlays */}
          {overlayChildren}
        </div>
      </div>
    );
  }
);

TeachingBoard.displayName = 'TeachingBoard';
export default TeachingBoard;

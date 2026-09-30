/**
 * boardCoordinates.ts
 *
 * Logical Coordinate System & Viewport Engine for QUALUTION Teaching Board.
 *
 * Core Principles:
 * 1. Resolution Independence: All pedagogical actions (cursor movement, lines,
 *    KaTeX equations, diagrams) use a standardized logical coordinate space
 *    (default: 1280 × 720, 16:9 aspect ratio).
 * 2. Uniform Aspect-Ratio Scaling: Fits into any container using letterboxing
 *    or pillarboxing while maintaining exact aspect ratio.
 * 3. High-DPI / DevicePixelRatio Awareness: Physical canvas rendering buffer
 *    scales by window.devicePixelRatio so vector strokes and text remain ultra-sharp.
 * 4. Deterministic Invertibility: Logical ⇄ Physical mappings are exact and invertible.
 */

export const DEFAULT_LOGICAL_WIDTH = 1280;
export const DEFAULT_LOGICAL_HEIGHT = 720;

export interface Point2D {
  x: number;
  y: number;
}

export interface BoardViewport {
  /** Physical width of the outer container element (px) */
  containerWidth: number;
  /** Physical height of the outer container element (px) */
  containerHeight: number;
  /** Standard logical width (logical units, default 1280) */
  logicalWidth: number;
  /** Standard logical height (logical units, default 720) */
  logicalHeight: number;
  /** Uniform scale factor from logical to stage display pixels */
  scale: number;
  /** Display width of the active teaching board stage (px) */
  stageWidth: number;
  /** Display height of the active teaching board stage (px) */
  stageHeight: number;
  /** Horizontal letterbox / pillarbox offset from container left (px) */
  stageLeft: number;
  /** Vertical letterbox / pillarbox offset from container top (px) */
  stageTop: number;
  /** Device pixel ratio (1 on standard screens, 2 on Retina/4K, etc.) */
  dpr: number;
  /** Actual internal buffer width of the canvas (stageWidth * dpr) */
  pixelWidth: number;
  /** Actual internal buffer height of the canvas (stageHeight * dpr) */
  pixelHeight: number;
}

/**
 * Calculates a complete BoardViewport from container dimensions and DPI.
 */
export function calculateBoardViewport(
  containerWidth: number,
  containerHeight: number,
  logicalWidth: number = DEFAULT_LOGICAL_WIDTH,
  logicalHeight: number = DEFAULT_LOGICAL_HEIGHT,
  dpr: number = 1
): BoardViewport {
  const safeContainerW = Math.max(0, containerWidth);
  const safeContainerH = Math.max(0, containerHeight);
  const safeLogicalW = Math.max(1, logicalWidth);
  const safeLogicalH = Math.max(1, logicalHeight);
  const safeDpr = Math.max(1, dpr);

  if (safeContainerW === 0 || safeContainerH === 0) {
    return {
      containerWidth: safeContainerW,
      containerHeight: safeContainerH,
      logicalWidth: safeLogicalW,
      logicalHeight: safeLogicalH,
      scale: 1,
      stageWidth: safeLogicalW,
      stageHeight: safeLogicalH,
      stageLeft: 0,
      stageTop: 0,
      dpr: safeDpr,
      pixelWidth: Math.round(safeLogicalW * safeDpr),
      pixelHeight: Math.round(safeLogicalH * safeDpr),
    };
  }

  // Calculate uniform scaling factor that fits inside container
  const scaleX = safeContainerW / safeLogicalW;
  const scaleY = safeContainerH / safeLogicalH;
  const scale = Math.min(scaleX, scaleY);

  const stageWidth = Math.round(safeLogicalW * scale);
  const stageHeight = Math.round(safeLogicalH * scale);

  const stageLeft = Math.round((safeContainerW - stageWidth) / 2);
  const stageTop = Math.round((safeContainerH - stageHeight) / 2);

  const pixelWidth = Math.round(stageWidth * safeDpr);
  const pixelHeight = Math.round(stageHeight * safeDpr);

  return {
    containerWidth: safeContainerW,
    containerHeight: safeContainerH,
    logicalWidth: safeLogicalW,
    logicalHeight: safeLogicalH,
    scale,
    stageWidth,
    stageHeight,
    stageLeft,
    stageTop,
    dpr: safeDpr,
    pixelWidth,
    pixelHeight,
  };
}

/**
 * Converts a point from logical board coordinates [0, logicalWidth] × [0, logicalHeight]
 * to physical pixel coordinates relative to the outer container.
 */
export function logicalToPhysical(point: Point2D, viewport: BoardViewport): Point2D {
  return {
    x: viewport.stageLeft + point.x * viewport.scale,
    y: viewport.stageTop + point.y * viewport.scale,
  };
}

/**
 * Converts a physical pixel coordinate (relative to container) into logical board units.
 */
export function physicalToLogical(point: Point2D, viewport: BoardViewport): Point2D {
  if (viewport.scale === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: (point.x - viewport.stageLeft) / viewport.scale,
    y: (point.y - viewport.stageTop) / viewport.scale,
  };
}

/**
 * Converts a point from logical coordinates to stage-relative pixels (ignores container letterbox offsets).
 */
export function logicalToStage(point: Point2D, viewport: BoardViewport): Point2D {
  return {
    x: point.x * viewport.scale,
    y: point.y * viewport.scale,
  };
}

/**
 * Converts logical coordinates to percentage strings for DOM overlays.
 */
export function logicalToPercent(
  point: Point2D,
  logicalWidth: number = DEFAULT_LOGICAL_WIDTH,
  logicalHeight: number = DEFAULT_LOGICAL_HEIGHT
): { left: string; top: string } {
  const safeW = Math.max(1, logicalWidth);
  const safeH = Math.max(1, logicalHeight);
  return {
    left: `${((point.x / safeW) * 100).toFixed(4)}%`,
    top: `${((point.y / safeH) * 100).toFixed(4)}%`,
  };
}

/**
 * Clamps logical coordinates to stay within board boundaries.
 */
export function clampLogical(
  point: Point2D,
  logicalWidth: number = DEFAULT_LOGICAL_WIDTH,
  logicalHeight: number = DEFAULT_LOGICAL_HEIGHT
): Point2D {
  return {
    x: Math.max(0, Math.min(logicalWidth, point.x)),
    y: Math.max(0, Math.min(logicalHeight, point.y)),
  };
}

/**
 * Wipes all rendering contexts and overlays on a board.
 */
export function clearTeachingBoard(
  canvas: HTMLCanvasElement | null,
  domLayer?: HTMLElement | null,
  svgLayer?: SVGSVGElement | null
): void {
  if (canvas) {
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save original transform, reset to identity, clear everything, restore
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    } catch {
      // Gracefully handle environments where 2D canvas is not available (e.g. headless jsdom)
    }
  }

  if (domLayer) {
    while (domLayer.firstChild) {
      domLayer.removeChild(domLayer.firstChild);
    }
  }

  if (svgLayer) {
    while (svgLayer.firstChild) {
      svgLayer.removeChild(svgLayer.firstChild);
    }
  }
}

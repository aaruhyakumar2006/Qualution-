/**
 * BoardTextLayer.tsx
 *
 * PHASE 3: The Progressive Typography Layer for QUALUTION Teaching Board.
 *
 * Responsibilities:
 * - Renders written text items inside Layer 3 of the Teaching Board.
 * - Positions each text element using percentage logical coordinates (1280 × 720).
 * - Applies deterministic, continuous progressive clip-path reveals.
 * - Scales font size proportionally with the board stage scale.
 * - Applies academic chalk aesthetic (crisp white, subtle ambient diffusion).
 */

import React from 'react';
import {
  DEFAULT_LOGICAL_WIDTH,
  DEFAULT_LOGICAL_HEIGHT,
} from '../../features/theory/boardCoordinates';
import {
  computeTextBounds,
  type TextAlign,
} from '../../features/theory/textMotion';
import './BoardTextLayer.css';

export interface BoardTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  color?: string;
  align?: TextAlign;
  letterSpacing?: number;
  opacity?: number;
  progress: number; // 0 (hidden) to 1 (fully written)
  visible?: boolean;
}

export interface BoardTextLayerProps {
  items: BoardTextItem[];
  logicalWidth?: number;
  logicalHeight?: number;
  className?: string;
}

export const BoardTextLayer: React.FC<BoardTextLayerProps> = ({
  items,
  logicalWidth = DEFAULT_LOGICAL_WIDTH,
  logicalHeight = DEFAULT_LOGICAL_HEIGHT,
  className = '',
}) => {
  return (
    <div
      className={`board-text-layer ${className}`.trim()}
      data-testid="board-text-layer"
      aria-live="polite"
    >
      {items.map((item) => {
        if (item.visible === false) return null;

        const fontSize = item.fontSize ?? 44;
        const align = item.align ?? 'left';
        const fontFamily = item.fontFamily ?? 'Inter, sans-serif';
        const letterSpacing = item.letterSpacing ?? 0;
        const progress = Math.max(0, Math.min(1, item.progress));

        // Compute geometry bounds in logical coordinates
        const bounds = computeTextBounds(
          item.text,
          item.x,
          item.y,
          fontSize,
          align,
          fontFamily,
          letterSpacing
        );

        // Map to percentages of the logical stage (1280 x 720)
        const leftPercent = (bounds.left / logicalWidth) * 100;
        const topPercent = (bounds.top / logicalHeight) * 100;
        const widthPercent = (bounds.width / logicalWidth) * 100;

        // Clip-path inset: uncovers from left to right as progress increases
        const clipRightPercent = (1 - progress) * 100;

        return (
          <div
            key={item.id}
            className="board-text-item"
            data-testid={`board-text-item-${item.id}`}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              // width: max-content lets the browser size the element to the actual
              // rendered text. clip-path percentages are relative to the element's
              // own box so the reveal still tracks correctly.
              width: 'max-content',
              color: item.color ?? 'rgba(240, 245, 255, 0.96)',
              fontFamily,
              fontWeight: item.fontWeight ?? 600,
              fontSize: `calc(${fontSize}px * var(--stage-scale, 1))`,
              letterSpacing: letterSpacing !== 0 ? `${letterSpacing}px` : undefined,
              opacity: item.opacity ?? 1,
              clipPath: `inset(0 ${clipRightPercent}% 0 0)`,
              WebkitClipPath: `inset(0 ${clipRightPercent}% 0 0)`,
            }}
            data-progress={progress}
            data-text={item.text}
          >
            {item.text}
          </div>
        );
      })}
    </div>
  );
};

BoardTextLayer.displayName = 'BoardTextLayer';
export default BoardTextLayer;

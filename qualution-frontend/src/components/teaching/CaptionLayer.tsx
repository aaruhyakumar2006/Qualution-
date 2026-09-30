/**
 * CaptionLayer.tsx
 *
 * PHASE 7: Teaching Caption Layer — DOM overlay, separate from board content.
 *
 * Renders ActiveCaption[] as absolutely-positioned text overlays on top of
 * the board stage container. This component is intentionally NOT placed
 * inside any TeachingBoard layer (canvas / SVG / DOM / cursor).
 *
 * It must be rendered as a sibling of TeachingBoard inside the same
 * positioned container, or passed via a dedicated prop slot.
 *
 * Responsibilities:
 * - Render each active caption at its configured position (top/center/bottom).
 * - Apply opacity for fade-in / fade-out.
 * - Support left / center / right text alignment.
 * - Support configurable font size.
 * - Expose hide/show and reset controls via ref.
 * - Never touch the board's canvas, SVG, DOM, or cursor layers.
 *
 * Visual style: minimal dark pill, white text — consistent with the
 * reference video's cinematic subtitle aesthetic.
 */

import React, {
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from 'react';
import type { ActiveCaption } from '../../features/theory/captionEngine';
import './CaptionLayer.css';

// ── Ref API ────────────────────────────────────────────────────────────────

export interface CaptionLayerRef {
  /** Hide all captions immediately (does not clear the list). */
  hide: () => void;
  /** Show captions again after hide(). */
  show: () => void;
  /** Clear all displayed captions and reset visibility to shown. */
  reset: () => void;
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface CaptionLayerProps {
  /** Active captions to render, typically from CaptionEngine.getActive(). */
  captions: ActiveCaption[];
  /** If false, the layer renders nothing (all captions hidden). Default: true */
  visible?: boolean;
}

// ── Position helpers ───────────────────────────────────────────────────────

const POSITION_CLASS: Record<ActiveCaption['position'], string> = {
  top:    'caption-layer__slot--top',
  center: 'caption-layer__slot--center',
  bottom: 'caption-layer__slot--bottom',
};

// ── Component ──────────────────────────────────────────────────────────────

export const CaptionLayer = forwardRef<CaptionLayerRef, CaptionLayerProps>(
  ({ captions, visible: visibleProp = true }, ref) => {
    const [layerVisible, setLayerVisible] = useState(true);

    useImperativeHandle(ref, () => ({
      hide:  () => setLayerVisible(false),
      show:  () => setLayerVisible(true),
      reset: () => setLayerVisible(true),
    }));

    const isVisible = visibleProp && layerVisible;

    if (!isVisible || captions.length === 0) return null;

    // Group captions by position so multiple captions at the same slot
    // stack vertically rather than overlapping.
    const byPosition = captions.reduce<Record<string, ActiveCaption[]>>(
      (acc, c) => {
        const pos = c.position;
        if (!acc[pos]) acc[pos] = [];
        acc[pos].push(c);
        return acc;
      },
      {}
    );

    return (
      <div
        className="caption-layer"
        data-testid="caption-layer"
        aria-live="polite"
        aria-atomic="false"
      >
        {(Object.keys(byPosition) as ActiveCaption['position'][]).map((pos) => (
          <div
            key={pos}
            className={`caption-layer__slot ${POSITION_CLASS[pos]}`}
            data-testid={`caption-slot-${pos}`}
          >
            {byPosition[pos].map((caption) => (
              <div
                key={caption.id}
                className="caption-layer__pill"
                data-testid={`caption-${caption.id}`}
                style={{
                  opacity: caption.opacity,
                  fontSize: `${caption.fontSize}px`,
                  textAlign: caption.align,
                }}
              >
                <span className="caption-layer__text">{caption.text}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
);

CaptionLayer.displayName = 'CaptionLayer';
export default CaptionLayer;

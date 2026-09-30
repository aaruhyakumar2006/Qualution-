/**
 * useTeachingCaption.ts
 *
 * PHASE 7: Teaching Caption Controller Hook.
 *
 * Responsibilities:
 * - Manages active teaching subtitle captions overlaying the teaching experience.
 * - Enforces single active primary caption to prevent visual clutter.
 * - Provides showCaption(text, options), hideCaption(), and reset() APIs.
 * - Smooth, subtle fade transitions (appearDuration, disappearDuration).
 * - Safe plain text handling (no eval, no script injection).
 * - Token-based cancellation and timeout cleanup.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ActiveCaption } from '../features/theory/captionEngine';
import type {
  CaptionOptions,
  CaptionPositionPreset,
  CaptionAlignPreset,
} from '../features/theory/teachingActions';

export interface UseTeachingCaptionOptions {
  defaultPosition?: CaptionPositionPreset;
  defaultFontSize?: number;
  defaultAlign?: CaptionAlignPreset;
}

export interface TeachingCaptionController {
  captions: ActiveCaption[];
  activeCaption: ActiveCaption | null;
  showCaption: (text: string, options?: CaptionOptions) => Promise<void>;
  hideCaption: (options?: { durationMs?: number }) => Promise<void>;
  reset: () => void;
  isVisible: boolean;
}

const DEFAULT_FADE_MS = 180;
const DEFAULT_FONT_SIZE = 15;

function makeCaptionId(): string {
  return `caption-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function useTeachingCaption(
  opts?: UseTeachingCaptionOptions
): TeachingCaptionController {
  const [captions, setCaptions] = useState<ActiveCaption[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const tokenRef = useRef<number>(0);
  const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const rafRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      timeoutIdsRef.current.forEach((t) => clearTimeout(t));
      timeoutIdsRef.current.clear();
    };
  }, []);

  const cancelActive = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    timeoutIdsRef.current.forEach((t) => clearTimeout(t));
    timeoutIdsRef.current.clear();
    tokenRef.current += 1;
  }, []);

  const reset = useCallback(() => {
    cancelActive();
    if (isMountedRef.current) {
      setCaptions([]);
      setIsVisible(false);
    }
  }, [cancelActive]);

  const wait = useCallback((ms: number, token: number): Promise<boolean> => {
    if (ms <= 0) return Promise.resolve(tokenRef.current === token && isMountedRef.current);
    return new Promise<boolean>((resolve) => {
      let timer: ReturnType<typeof setTimeout>;
      timer = setTimeout(() => {
        timeoutIdsRef.current.delete(timer);
        resolve(tokenRef.current === token && isMountedRef.current);
      }, ms);
      timeoutIdsRef.current.add(timer);
    });
  }, []);

  // ── Fade Animation Helper ────────────────────────────────────────────────

  function animateOpacity(
    fromOpacity: number,
    toOpacity: number,
    durationMs: number,
    token: number,
    onProgress: (op: number) => void
  ): Promise<void> {
    if (durationMs <= 0 || !isMountedRef.current) {
      onProgress(toOpacity);
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      let startTs: number | null = null;

      const tick = (ts: number) => {
        if (tokenRef.current !== token || !isMountedRef.current) {
          resolve();
          return;
        }
        if (startTs === null) startTs = ts;

        const elapsed = ts - startTs;
        const t = Math.min(1, elapsed / durationMs);
        const currentOp = fromOpacity + (toOpacity - fromOpacity) * t;

        onProgress(currentOp);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          resolve();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    });
  }

  // ── Show Caption ─────────────────────────────────────────────────────────

  const showCaption = useCallback(
    async (text: string, options: CaptionOptions = {}): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;

      const id = options.id ?? makeCaptionId();
      const position = options.position ?? opts?.defaultPosition ?? 'bottom';
      const fontSize = options.fontSize ?? opts?.defaultFontSize ?? DEFAULT_FONT_SIZE;
      const align = options.align ?? opts?.defaultAlign ?? 'center';
      const appearDuration = options.appearDurationMs ?? DEFAULT_FADE_MS;
      const disappearDuration = options.disappearDurationMs ?? DEFAULT_FADE_MS;
      const stayDuration = options.durationMs ?? 0;

      // Create new active caption with opacity 0
      const newCaption: ActiveCaption = {
        id,
        text,
        position,
        fontSize,
        align,
        appear: 'fade',
        startMs: 0,
        durationMs: stayDuration,
        opacity: 0,
      };

      if (isMountedRef.current) {
        setCaptions([newCaption]);
        setIsVisible(true);
      }

      // 1. Fade in
      await animateOpacity(0, 1, appearDuration, token, (op) => {
        if (isMountedRef.current) {
          setCaptions((prev) =>
            prev.map((c) => (c.id === id ? { ...c, opacity: op } : c))
          );
        }
      });
      if (tokenRef.current !== token || !isMountedRef.current) return;

      // 2. If duration is specified, stay for duration and then fade out
      if (stayDuration > 0) {
        const ok = await wait(stayDuration, token);
        if (!ok) return;

        // 3. Fade out
        await animateOpacity(1, 0, disappearDuration, token, (op) => {
          if (isMountedRef.current) {
            setCaptions((prev) =>
              prev.map((c) => (c.id === id ? { ...c, opacity: op } : c))
            );
          }
        });
        if (tokenRef.current !== token || !isMountedRef.current) return;

        if (isMountedRef.current) {
          setCaptions([]);
          setIsVisible(false);
        }
      }
    },
    [cancelActive, opts, wait]
  );

  // ── Hide Caption ─────────────────────────────────────────────────────────

  const hideCaption = useCallback(
    async (hideOpts?: { durationMs?: number }): Promise<void> => {
      cancelActive();
      const token = ++tokenRef.current;
      const duration = hideOpts?.durationMs ?? DEFAULT_FADE_MS;

      if (captions.length === 0) {
        if (isMountedRef.current) setIsVisible(false);
        return;
      }

      const currentOp = captions[0]?.opacity ?? 1;

      await animateOpacity(currentOp, 0, duration, token, (op) => {
        if (isMountedRef.current) {
          setCaptions((prev) => prev.map((c) => ({ ...c, opacity: op })));
        }
      });
      if (tokenRef.current !== token || !isMountedRef.current) return;

      if (isMountedRef.current) {
        setCaptions([]);
        setIsVisible(false);
      }
    },
    [cancelActive, captions]
  );

  const activeCaption = captions.length > 0 ? captions[0] : null;

  return {
    captions,
    activeCaption,
    showCaption,
    hideCaption,
    reset,
    isVisible,
  };
}

export default useTeachingCaption;

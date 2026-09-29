import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ErwinAvatar, type ErwinState } from './ErwinAvatar';
import { ErwinHybridAIAssistant } from './ErwinHybridAIAssistant';
import { useErwinCompanion } from '../../hooks/useErwinState';
import './GlobalErwinCompanion.css';

export interface GlobalErwinCompanionProps {
  size?: number;
}

type DragPhase = 'idle' | 'dragging' | 'jumping' | 'returning';

/**
 * GlobalErwinCompanion — Two-Phase CSS Snap-Back with Hybrid AI Assistant Open-Up
 *
 * Drag behaviour:
 *  1. Pick up and move freely (dragging)
 *  2. On release: jump micro-animation plays in-place (250ms)
 *  3. CSS transition snaps back to anchor (520ms)
 *  4. Returns to idle state
 *
 * Click behaviour:
 *  - Clicking without dragging opens up the Erwin Hybrid AI Assistant.
 */
export const GlobalErwinCompanion: React.FC<GlobalErwinCompanionProps> = ({ size = 64 }) => {
  const companion = useErwinCompanion();
  const [dragPhase, setDragPhase] = useState<DragPhase>('idle');
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [localErwinState, setLocalErwinState] = useState<ErwinState | null>(null);

  /* ── refs ── */
  const isDragRef    = useRef(false);
  const hasMovedRef  = useRef(false);
  const posRef       = useRef({ x: 0, y: 0 });
  const originRef    = useRef({ cx: 0, cy: 0 });
  const prevStateRef = useRef(companion.state);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // Reset bubble dismissal when companion state changes
  useEffect(() => {
    if (prevStateRef.current !== companion.state) {
      prevStateRef.current = companion.state;
      setBubbleDismissed(false);
    }
  }, [companion.state]);

  /* ── Pointer down ── */
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    clearTimer();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /**/ }

    const cx = e.clientX;
    const cy = e.clientY;
    originRef.current = { cx: cx - posRef.current.x, cy: cy - posRef.current.y };
    isDragRef.current = true;
    hasMovedRef.current = false;
    setDragPhase('dragging');
  }, [clearTimer]);

  /* ── Pointer move ── */
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragRef.current) return;

    const cx = e.clientX;
    const cy = e.clientY;
    const nx = cx - originRef.current.cx;
    const ny = cy - originRef.current.cy;

    if (!hasMovedRef.current && (nx * nx + ny * ny) > 16) {
      hasMovedRef.current = true;
    }

    posRef.current = { x: nx, y: ny };
    setPos({ x: nx, y: ny });
  }, []);

  /* ── Pointer up / cancel ── */
  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragRef.current) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /**/ }
    isDragRef.current = false;

    /* Tap without drag — just return to idle */
    if (!hasMovedRef.current) {
      setDragPhase('idle');
      return;
    }

    /* Phase 1: Jump micro-animation (stays in current position) */
    setDragPhase('jumping');

    timerRef.current = setTimeout(() => {
      /* Phase 2: CSS transition snap-back to anchor (0, 0) */
      posRef.current = { x: 0, y: 0 };
      setPos({ x: 0, y: 0 });
      setDragPhase('returning');

      timerRef.current = setTimeout(() => {
        setDragPhase('idle');
        hasMovedRef.current = false;
      }, 520);
    }, 250);
  }, []);

  // Listen for global Erwin open/toggle events
  useEffect(() => {
    const handleOpen = () => setIsAssistantOpen(true);
    const handleToggle = () => setIsAssistantOpen((prev) => !prev);
    const handleClose = () => setIsAssistantOpen(false);

    window.addEventListener('qualution:open-erwin', handleOpen);
    window.addEventListener('qualution:toggle-erwin', handleToggle);
    window.addEventListener('qualution:close-erwin', handleClose);
    return () => {
      window.removeEventListener('qualution:open-erwin', handleOpen);
      window.removeEventListener('qualution:toggle-erwin', handleToggle);
      window.removeEventListener('qualution:close-erwin', handleClose);
    };
  }, []);

  const isDragging   = dragPhase === 'dragging';
  const isJumping    = dragPhase === 'jumping';
  const isReturning  = dragPhase === 'returning';
  const suppressAnim = isDragging || isJumping || isReturning;

  return (
    <>
      {isDragging && (
        <div className="erwin-drag-shield" data-testid="erwin-drag-shield" />
      )}

      {/* Erwin Hybrid AI Assistant Modal / Dialogue Window */}
      <ErwinHybridAIAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        companionState={(localErwinState ?? companion.state) as ErwinState}
        onCompanionStateChange={setLocalErwinState}
      />

      <div
        className="erwin-global-anchor"
        data-testid="global-erwin-container"
        aria-label="Erwin companion"
      >
        {/* Translate wrapper */}
        <div
          className={`erwin-drag-wrapper${isDragging ? ' is-dragging' : ''}${isReturning ? ' is-returning' : ''}`}
          data-testid="erwin-drag-wrapper"
          style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
        >
          {/* Jump wrapper — carries is-jumping class for Phase 1 micro-animation */}
          <div
            className={`erwin-jump-wrapper${isJumping ? ' is-jumping' : ''}`}
            data-testid="erwin-jump-wrapper"
          >
            {/* Avatar wrap — pointer events attached here */}
            <div
              className={`erwin-global-avatar-wrap${isDragging ? ' is-dragging' : ''}${suppressAnim ? ' erwin-motion-suspended' : ''}${isAssistantOpen ? ' is-assistant-active' : ''}`}
              data-testid="erwin-avatar-wrap"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={(e) => {
                if (hasMovedRef.current) {
                  e.stopPropagation();
                  e.preventDefault();
                  return;
                }
                setIsAssistantOpen((prev) => !prev);
              }}
              title={isAssistantOpen ? "Close Erwin Hybrid AI" : "Click to chat with Erwin Hybrid AI (or drag to move)"}
            >
              <ErwinAvatar
                size={size}
                state={(localErwinState ?? companion.state) as ErwinState}
                className={`erwin-global-avatar${suppressAnim ? ' erwin-motion-suspended' : ''}`}
                data-testid="global-erwin-avatar"
              />
            </div>
          </div>
        </div>

        {/* Speech bubble — always rendered; dismissed on click */}
        {!bubbleDismissed && (
          <div
            className={`erwin-global-bubble erwin-global-bubble--${companion.state}`}
            data-testid="global-erwin-bubble"
            onClick={() => setBubbleDismissed(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setBubbleDismissed(true)}
            aria-label="Dismiss Erwin bubble"
            title="Click to dismiss bubble (or click Erwin avatar to chat)"
          >
            {companion.text}
          </div>
        )}
      </div>
    </>
  );
};

export default GlobalErwinCompanion;

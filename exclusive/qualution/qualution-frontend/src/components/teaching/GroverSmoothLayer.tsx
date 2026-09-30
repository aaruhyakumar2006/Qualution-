/**
 * GroverSmoothLayer.tsx
 *
 * Full-screen persistent overlay that eliminates hard cuts across all 9 segments
 * of the Grover lesson. Provides:
 *
 *  - Cross-fading narration banner (text never snaps — always fades out/in)
 *  - 9-dot segment progress tracker (top-right)
 *  - Ambient color-wash tint that transitions per segment family
 *  - Radial "ripple" flash on every segment boundary
 *  - Live simulation badge during Segment 8 backend execution
 *  - Interactive prediction checkpoint card (Segment 7)
 *  - Gate entry animation trigger on circuit updates
 *
 * Zero hard dependencies beyond React. Uses only CSS animations (no anime.js import
 * needed — all easing curves are CSS cubic-bezier, equivalent quality).
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  type FC,
} from 'react';
import './GroverSmoothLayer.css';
import type { PredictionCheckpoint } from '../../features/teaching/types';

/* ── Types ──────────────────────────────────────────────────────────────── */
export interface GroverSmoothLayerProps {
  /** Current segment number (1–9), or null when lesson not active */
  activeSegment: number | null;
  /** Narration text to display in the bottom banner */
  narrationText: string | null;
  /** Whether Segment 8 backend simulation is currently running */
  isSimulationRunning: boolean;
  /** Prediction checkpoint data for Segment 7 */
  predictionCheckpoint: PredictionCheckpoint | null;
  /** Whether currently awaiting learner prediction */
  isAwaitingPrediction: boolean;
  /** Callback when learner submits a prediction option index */
  onPredictionSelect: (optionIndex: number) => void;
  /** Selected prediction index (null until submitted) */
  selectedPredictionIndex: number | null;
  /** Whether learner's prediction was correct */
  predictionIsCorrect: boolean | null;
  /** Feedback message after prediction */
  predictionFeedback: string | null;
}

/* ── Segment family classifier ──────────────────────────────────────────── */
function getSegmentFamily(seg: number | null): string {
  if (seg === null) return '';
  if (seg <= 3) return 'seg-conceptual';
  if (seg === 4) return 'seg-conceptual';
  if (seg === 5) return 'seg-interactive';
  if (seg === 6) return 'seg-amplification';
  if (seg === 7) return 'seg-interactive';
  if (seg === 8) return 'seg-measurement';
  return 'seg-wrapup';
}

const TOTAL_SEGMENTS = 9;

/* ── Narration text cross-fader ─────────────────────────────────────────── */
const NarrationBanner: FC<{
  segmentNumber: number | null;
  segmentLabel: string;
  text: string | null;
}> = ({ segmentNumber, segmentLabel, text }) => {
  const [displayedText, setDisplayedText] = useState<string | null>(text);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const pendingText = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (text === displayedText) return;

    // Fade out current text, then swap, then fade new text in
    setIsFadingOut(true);
    pendingText.current = text;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDisplayedText(pendingText.current);
      setIsFadingOut(false);
    }, 260); // matches CSS narrationTextFadeOut 0.25s + buffer

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!displayedText) return null;

  return (
    <div className="grover-narration-wrap">
      <div className="grover-narration-banner">
        {segmentNumber !== null && (
          <div className="grover-narration-segment-pill">
            <span className="grover-narration-segment-dot" />
            {segmentLabel}
          </div>
        )}
        <div className="grover-narration-text-slot">
          <p
            className={`grover-narration-text${isFadingOut ? ' fade-out' : ''}`}
            key={isFadingOut ? 'fading' : 'displayed'}
          >
            {displayedText}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Segment progress dots ──────────────────────────────────────────────── */
const ProgressTrack: FC<{ active: number | null }> = ({ active }) => {
  if (active === null) return null;
  return (
    <div className="grover-progress-track">
      <span className="grover-progress-label">Grover</span>
      {Array.from({ length: TOTAL_SEGMENTS }, (_, i) => {
        const seg = i + 1;
        let cls = 'grover-progress-dot';
        if (active !== null && seg === active) cls += ' active';
        else if (active !== null && seg < active) cls += ' completed';
        return (
          <span
            key={seg}
            className={cls}
            title={`Segment ${seg}`}
          />
        );
      })}
    </div>
  );
};

/* ── Simulation badge ───────────────────────────────────────────────────── */
const SimBadge: FC<{ running: boolean }> = ({ running }) => {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (running) {
      setHiding(false);
      setVisible(true);
    } else if (visible) {
      setHiding(true);
      const t = setTimeout(() => setVisible(false), 380);
      return () => clearTimeout(t);
    }
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;
  return (
    <div className={`grover-sim-badge${hiding ? ' hide' : ''}`}>
      <div className="grover-sim-spinner" />
      Quantum backend computing 1,000 shots live…
    </div>
  );
};

/* ── Prediction checkpoint card ─────────────────────────────────────────── */
const CheckpointCard: FC<{
  checkpoint: PredictionCheckpoint;
  selected: number | null;
  isCorrect: boolean | null;
  feedback: string | null;
  onSelect: (i: number) => void;
}> = ({ checkpoint, selected, isCorrect, feedback, onSelect }) => {
  return (
    <div className="grover-checkpoint-card">
      <div className="grover-checkpoint-title">⚡ Predict Before You Run</div>
      <div className="grover-checkpoint-question">{checkpoint.question}</div>
      <div className="grover-checkpoint-options">
        {checkpoint.options.map((opt, i) => {
          let cls = 'grover-checkpoint-option';
          if (selected !== null && i === selected) {
            cls += isCorrect ? ' correct' : ' incorrect';
          } else if (selected !== null && i === checkpoint.correctOptionIndex) {
            cls += ' correct';
          }
          return (
            <button
              key={opt.id}
              className={cls}
              onClick={() => selected === null && onSelect(i)}
              disabled={selected !== null}
              aria-pressed={selected === i}
            >
              <span style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.6 }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className="grover-checkpoint-feedback">{feedback}</div>
      )}
    </div>
  );
};

/* ── Conceptual visual stage for Segments 1–3 ──────────────────────────── */
const ConceptualStage: FC<{ activeSegment: number | null }> = ({ activeSegment }) => {
  const [inspectedBox, setInspectedBox] = useState<number>(0);

  // Animate the sequential classical box opening during Segment 1
  useEffect(() => {
    if (activeSegment !== 1) return;
    setInspectedBox(0);
    const interval = setInterval(() => {
      setInspectedBox((prev) => (prev < 3 ? prev + 1 : 3));
    }, 1800);
    return () => clearInterval(interval);
  }, [activeSegment]);

  // If outside conceptual segments (or null), hide smoothly
  const isVisible = activeSegment !== null && activeSegment <= 3;
  if (!isVisible && (activeSegment === null || activeSegment > 4)) return null;

  const boxes = [
    { label: 'Box 00', icon: '📦', empty: true },
    { label: 'Box 01', icon: '📦', empty: true },
    { label: 'Box 10', icon: '📦', empty: true },
    { label: 'Box 11', icon: inspectedBox >= 3 ? '✨' : '📦', empty: false },
  ];

  const states = [
    { ket: '|00⟩', amp: '+1/2', prob: '25%', phase: '0°', inverted: false },
    { ket: '|01⟩', amp: '+1/2', prob: '25%', phase: '0°', inverted: false },
    { ket: '|10⟩', amp: '+1/2', prob: '25%', phase: '0°', inverted: false },
    { ket: '|11⟩', amp: activeSegment === 3 ? '-1/2' : '+1/2', prob: '25%', phase: activeSegment === 3 ? '180°' : '0°', inverted: activeSegment === 3 },
  ];

  return (
    <div className={`grover-conceptual-stage${!isVisible ? ' hide' : ''}`}>
      {/* Stage Header */}
      <div className="grover-stage-header">
        <div className={`grover-stage-badge${activeSegment === 3 ? ' oracle' : ''}`}>
          {activeSegment === 1 && 'Segment 1 — The Problem'}
          {activeSegment === 2 && 'Segment 2 — Quantum Reframing'}
          {activeSegment === 3 && 'Segment 3 — The Quantum Oracle'}
          {activeSegment !== null && activeSegment > 3 && 'Transitioning to Workbench'}
        </div>
        <div className="grover-stage-subtitle">
          {activeSegment === 1 && 'Classical Brute-Force: Inspecting 4 identical unsorted boxes'}
          {activeSegment === 2 && 'Simultaneous Superposition: Holding all 4 states in 2 qubits'}
          {activeSegment === 3 && 'Phase Inversion: Marking target |11⟩ with negative amplitude'}
          {activeSegment !== null && activeSegment > 3 && 'Live Circuit Construction'}
        </div>
      </div>

      {/* Segment 1: Classical 4 Boxes View */}
      {activeSegment === 1 && (
        <>
          <div className="grover-boxes-row">
            {boxes.map((b, idx) => {
              const isChecking = inspectedBox === idx;
              const isOpened = inspectedBox >= idx;
              const isWinner = isOpened && !b.empty;
              let cardCls = 'grover-box-card';
              if (isWinner) cardCls += ' opened-winner';
              else if (isOpened) cardCls += ' opened-empty';
              else if (isChecking) cardCls += ' checking';

              return (
                <div key={b.label} className={cardCls}>
                  <div className="grover-box-icon">{b.icon}</div>
                  <div className="grover-box-label">{b.label}</div>
                  <div className={`grover-box-status ${isWinner ? 'winner' : isOpened ? 'empty' : 'pending'}`}>
                    {isWinner ? 'Winner Found!' : isOpened ? 'Empty' : 'Unopened'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grover-stage-footer">
            <span>Query Progress: <strong>{Math.min(inspectedBox + 1, 4)} / 4</strong> checks performed</span>
            <span>Classical Complexity: <strong>O(N) queries</strong> (worst-case: all 4 boxes)</span>
          </div>
        </>
      )}

      {/* Segment 2 & 3: Quantum Superposition & Oracle Phase View */}
      {(activeSegment === 2 || activeSegment === 3) && (
        <>
          <div className="grover-states-row">
            {states.map((st) => (
              <div
                key={st.ket}
                className={`grover-state-card${st.inverted ? ' marked-oracle' : ''}`}
              >
                {st.inverted && (
                  <span className="grover-oracle-stamp-pill">Oracle Mark</span>
                )}
                <div className="grover-state-ket">{st.ket}</div>
                <div className="grover-amplitude-container">
                  <div className="grover-amplitude-baseline" />
                  {st.inverted ? (
                    <div className="grover-amplitude-bar-down" />
                  ) : (
                    <div className="grover-amplitude-bar-up" />
                  )}
                </div>
                <div className="grover-state-amplitude">Amp: {st.amp}</div>
                <div className="grover-state-prob">Prob |α|²: {st.prob}</div>
              </div>
            ))}
          </div>
          <div className="grover-stage-footer">
            {activeSegment === 2 ? (
              <>
                <span>Register State: <strong>|s⟩ = 1/2 (|00⟩ + |01⟩ + |10⟩ + |11⟩)</strong></span>
                <span>Parallelism: <strong>All 4 states held simultaneously</strong></span>
              </>
            ) : (
              <>
                <span>Oracle Transformation: <strong>U_f |11⟩ = -|11⟩</strong> (Phase flip)</span>
                <span>Measurement Paradox: <strong>|(-1/2)|² = 25%</strong> (Hidden mark requires diffusion!)</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Segment transition flash ───────────────────────────────────────────── */
const SegmentFlash: FC<{ trigger: number }> = ({ trigger }) => {
  // Re-mount on every trigger change to restart the CSS animation
  if (trigger === 0) return null;
  return <div key={trigger} className="grover-segment-flash" />;
};

/* ════════════════════════════════════════════════════════════════════════
   Main export
   ════════════════════════════════════════════════════════════════════════ */
export const GroverSmoothLayer: FC<GroverSmoothLayerProps> = ({
  activeSegment,
  narrationText,
  isSimulationRunning,
  predictionCheckpoint,
  isAwaitingPrediction,
  onPredictionSelect,
  selectedPredictionIndex,
  predictionIsCorrect,
  predictionFeedback,
}) => {
  const [flashTrigger, setFlashTrigger] = useState(0);
  const prevSegment = useRef<number | null>(null);

  // Trigger flash on every segment boundary
  useEffect(() => {
    if (activeSegment !== null && prevSegment.current !== null && activeSegment !== prevSegment.current) {
      setFlashTrigger((n) => n + 1);
    }
    prevSegment.current = activeSegment;
  }, [activeSegment]);

  // Animate gate entries: observe DOM for new .circuit-placed-gate nodes
  useEffect(() => {
    const container = document.querySelector('.canvas-viewport');
    if (!container) return;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          // Direct gate node
          if (node.classList?.contains('circuit-placed-gate')) {
            node.classList.add('grover-gate-enter');
            node.addEventListener('animationend', () => node.classList.remove('grover-gate-enter'), { once: true });
          }
          // Nested gate nodes (e.g., added inside a slot wrapper)
          node.querySelectorAll?.('.circuit-placed-gate').forEach((el) => {
            if (el instanceof HTMLElement) {
              el.classList.add('grover-gate-enter');
              el.addEventListener('animationend', () => el.classList.remove('grover-gate-enter'), { once: true });
            }
          });
        });
      }
    });

    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Apply histogram smooth class when in lesson mode
  useEffect(() => {
    const hist = document.querySelector('.probability-histogram, [class*="histogram"]');
    if (hist) {
      if (activeSegment !== null) {
        hist.classList.add('grover-histogram-smooth');
      } else {
        hist.classList.remove('grover-histogram-smooth');
      }
    }
  }, [activeSegment]);

  const segmentLabel = activeSegment !== null
    ? `Segment ${activeSegment} / ${TOTAL_SEGMENTS}`
    : '';

  if (activeSegment === null && !narrationText) return null;

  return (
    <div className="grover-smooth-layer">
      {/* Ambient tint per segment family */}
      <div
        className={`grover-ambient-tint ${getSegmentFamily(activeSegment)}`}
      />

      {/* Conceptual presentation stage for Segments 1-3 */}
      <ConceptualStage activeSegment={activeSegment} />

      {/* Between-segment flash ripple */}
      <SegmentFlash trigger={flashTrigger} />

      {/* Top-right segment dots */}
      <ProgressTrack active={activeSegment} />

      {/* Segment 8 — live simulation badge */}
      <SimBadge running={isSimulationRunning} />

      {/* Segment 7 — prediction checkpoint card */}
      {isAwaitingPrediction && predictionCheckpoint && (
        <CheckpointCard
          checkpoint={predictionCheckpoint}
          selected={selectedPredictionIndex}
          isCorrect={predictionIsCorrect}
          feedback={predictionFeedback}
          onSelect={onPredictionSelect}
        />
      )}

      {/* Bottom narration banner — cross-fades all text changes */}
      <NarrationBanner
        segmentNumber={activeSegment}
        segmentLabel={segmentLabel}
        text={narrationText}
      />
    </div>
  );
};

export default GroverSmoothLayer;

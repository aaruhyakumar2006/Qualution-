import React, { useState, useEffect, useRef } from 'react';
import type { TimelineResponse } from '../../features/circuit/types';
import { ProbabilityHistogram } from './ProbabilityHistogram';
import { BlochSphere } from './BlochSphere';
import { GATE_KNOWLEDGE_CATALOG } from '../../features/learning/gateKnowledge';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Sparkles,
} from 'lucide-react';
import './TimelineView.css';

interface TimelineViewProps {
  timeline: TimelineResponse;
  onSelectGateByTimelineStep?: (operation: string, qubits: number[]) => void;
  selectedStepIdx?: number;
  onStepChange?: (stepIdx: number) => void;
}

export type PlaybackSpeed = 0.5 | 1.0 | 2.0;

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  onSelectGateByTimelineStep,
  selectedStepIdx: controlledStepIdx,
  onStepChange: controlledOnStepChange,
}) => {
  if (!timeline || !Array.isArray(timeline.steps) || timeline.steps.length === 0) {
    return (
      <div className="timeline-view-container ibm-timeline-theme" data-testid="timeline-empty">
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
          <p>No timeline simulation steps available.</p>
        </div>
      </div>
    );
  }

  const [internalStepIdx, setInternalStepIdx] = useState<number>(Math.max(0, timeline.steps.length - 1));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const playTimerRef = useRef<number | null>(null);

  const selectedStepIdx = controlledStepIdx !== undefined ? controlledStepIdx : internalStepIdx;
  const currentStep = timeline.steps[selectedStepIdx] || timeline.steps[0] || { step: 0, operation: 'initial', qubits: [], statevector: [], probabilities: {} };
  const prevStep = selectedStepIdx > 0 ? timeline.steps[selectedStepIdx - 1] : null;
  const maxIdx = Math.max(0, timeline.steps.length - 1);

  const handleStepChange = (idx: number) => {
    if (controlledOnStepChange) {
      controlledOnStepChange(idx);
    } else {
      setInternalStepIdx(idx);
    }
    const stepObj = timeline.steps[idx];
    if (stepObj && stepObj.step > 0 && onSelectGateByTimelineStep) {
      onSelectGateByTimelineStep(stepObj.operation, stepObj.qubits);
    }
  };

  // Play / Pause auto-stepper through timeline with speed support
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
      return;
    }

    const intervalMs = Math.round(900 / speed);

    playTimerRef.current = window.setInterval(() => {
      if (selectedStepIdx < maxIdx) {
        handleStepChange(selectedStepIdx + 1);
      } else {
        setIsPlaying(false);
      }
    }, intervalMs);

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, selectedStepIdx, maxIdx, speed]);

  // Stop playing if the timeline instance changes (e.g., lesson takeover or new simulation)
  useEffect(() => {
    setIsPlaying(false);
  }, [timeline]);

  const togglePlay = () => {
    if (!isPlaying && selectedStepIdx >= maxIdx) {
      // If at end, loop to start and play
      handleStepChange(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    handleStepChange(0);
  };

  // Extract top states for before/after comparison
  const formatTopStates = (probs?: Record<string, number>): string => {
    if (!probs) return 'None';
    const entries = Object.entries(probs)
      .filter(([, p]) => p > 0.001)
      .sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return 'None';
    return entries
      .slice(0, 3)
      .map(([s, p]) => `|${s}⟩ (${(p * 100).toFixed(1)}%)`)
      .join(', ');
  };

  // Gate knowledge & educational transition description
  const opName = (currentStep.operation || '').toLowerCase();
  const knowledge = GATE_KNOWLEDGE_CATALOG[opName];
  const gateDisplayName = knowledge?.name ?? (currentStep.step === 0 ? 'Initial State' : (currentStep.operation || '').toUpperCase());
  const sq = Array.isArray(currentStep.qubits) ? currentStep.qubits : [];
  
  let transitionEffectText = '';
  if (currentStep.step === 0) {
    transitionEffectText = 'All qubits initialized to computational ground state |0...0⟩.';
  } else if (opName === 'h') {
    transitionEffectText = `Hadamard on q[${sq.join(', ')}] transforms basis states into symmetric superposition.`;
  } else if (opName === 'cx') {
    transitionEffectText = `Controlled-NOT with control q[${sq[0] ?? 0}] conditionally flips target q[${sq[1] ?? 1}], creating quantum correlation/entanglement.`;
  } else if (opName === 'cz') {
    transitionEffectText = `Controlled-Z applies a π phase inversion conditionally when both q[${sq[0] ?? 0}] and q[${sq[1] ?? 1}] are in |1⟩.`;
  } else if (opName === 'x') {
    transitionEffectText = `Pauli-X applies a deterministic bit flip on q[${sq[0] ?? 0}].`;
  } else if (opName === 'y') {
    transitionEffectText = `Pauli-Y applies a bit and phase flip on q[${sq[0] ?? 0}].`;
  } else if (opName === 'z') {
    transitionEffectText = `Pauli-Z inverts the relative phase of |1⟩ on q[${sq[0] ?? 0}].`;
  } else if (opName === 's') {
    transitionEffectText = `Phase S gate applies a π/2 phase shift on q[${sq[0] ?? 0}].`;
  } else if (opName === 't') {
    transitionEffectText = `T gate applies a π/4 phase shift on q[${sq[0] ?? 0}].`;
  } else if (opName === 'swap') {
    transitionEffectText = `SWAP exchanges quantum states between q[${sq[0] ?? 0}] and q[${sq[1] ?? 1}].`;
  } else if (['rx', 'ry', 'rz'].includes(opName)) {
    const angleVal = currentStep.parameters?.angle ?? currentStep.angle;
    const angleText = angleVal !== undefined ? `${(angleVal / Math.PI).toFixed(2)}π rad` : '';
    transitionEffectText = `Rotates state on Bloch sphere around ${opName[1].toUpperCase()}-axis by ${angleText}.`;
  } else {
    transitionEffectText = knowledge?.beginnerDescription ?? 'Executes unitary quantum evolution.';
  }

  return (
    <div className="timeline-view-container" data-testid="timeline-view">
      {/* Step Stepper Header with Navigation, Play Controls & Speed */}
      <div className="timeline-stepper-header">
        <div className="stepper-nav-group">
          <button
            type="button"
            className="btn-step-nav"
            onClick={() => {
              setIsPlaying(false);
              handleStepChange(0);
            }}
            disabled={selectedStepIdx === 0}
            aria-label="First Step"
            title="First Step"
            data-testid="timeline-first-btn"
          >
            <ChevronsLeft size={13} />
          </button>

          <button
            type="button"
            className="btn-step-nav"
            onClick={() => {
              setIsPlaying(false);
              handleStepChange(Math.max(0, selectedStepIdx - 1));
            }}
            disabled={selectedStepIdx === 0}
            aria-label="Previous Step"
            data-testid="timeline-prev-btn"
          >
            <ChevronLeft size={13} />
            <span>Prev</span>
          </button>

          <button
            type="button"
            className={`btn-step-nav btn-play ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause Playback' : 'Play Timeline'}
            title={isPlaying ? 'Pause Timeline' : 'Play Timeline Progression'}
            data-testid="timeline-play-btn"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            className="btn-step-nav"
            onClick={handleRestart}
            aria-label="Restart Timeline"
            title="Restart Timeline from Step 0"
            data-testid="timeline-restart-btn"
          >
            <RotateCcw size={12} />
          </button>

          {/* Speed Selector */}
          <div className="timeline-speed-selector">
            <Gauge size={11} className="speed-icon" />
            <button
              type="button"
              className={`speed-pill ${speed === 0.5 ? 'active' : ''}`}
              onClick={() => setSpeed(0.5)}
              title="0.5x Playback Speed"
              data-testid="speed-0.5x"
            >
              0.5×
            </button>
            <button
              type="button"
              className={`speed-pill ${speed === 1.0 ? 'active' : ''}`}
              onClick={() => setSpeed(1.0)}
              title="1x Playback Speed"
              data-testid="speed-1x"
            >
              1×
            </button>
            <button
              type="button"
              className={`speed-pill ${speed === 2.0 ? 'active' : ''}`}
              onClick={() => setSpeed(2.0)}
              title="2x Playback Speed"
              data-testid="speed-2x"
            >
              2×
            </button>
          </div>
        </div>

        <div className="step-badge">
          <span className="step-idx">
            STEP {currentStep.step} / {timeline.total_steps - 1}
          </span>
          <span className="step-op">
            {currentStep.step === 0
              ? 'INITIAL STATE |0...0⟩'
              : `${currentStep.operation.toUpperCase()}(q[${currentStep.qubits.join(',')}])`}
          </span>
        </div>

        <div className="stepper-nav-group">
          <button
            type="button"
            className="btn-step-nav"
            onClick={() => {
              setIsPlaying(false);
              handleStepChange(Math.min(maxIdx, selectedStepIdx + 1));
            }}
            disabled={selectedStepIdx === maxIdx}
            aria-label="Next Step"
            data-testid="timeline-next-btn"
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>

          <button
            type="button"
            className="btn-step-nav"
            onClick={() => {
              setIsPlaying(false);
              handleStepChange(maxIdx);
            }}
            disabled={selectedStepIdx === maxIdx}
            aria-label="Last Step"
            title="Last Step"
            data-testid="timeline-last-btn"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>

      {/* Continuous Timeline Scrubber Range Slider */}
      <div className="timeline-scrubber-slider-row" data-testid="timeline-scrubber-row">
        <span className="scrubber-bound-lbl">Step 0</span>
        <input
          type="range"
          min={0}
          max={maxIdx}
          value={selectedStepIdx}
          onChange={(e) => {
            setIsPlaying(false);
            handleStepChange(Number(e.target.value));
          }}
          className="timeline-scrubber-input"
          data-testid="timeline-scrubber-slider"
          aria-label="Timeline Step Scrubber"
        />
        <span className="scrubber-bound-lbl">Step {maxIdx}</span>
      </div>

      {/* Step Timeline Track */}
      <div className="timeline-steps-track" role="tablist">
        {timeline.steps.map((s, idx) => {
          const isActive = idx === selectedStepIdx;
          return (
            <button
              key={s.step}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`timeline-step-node ${isActive ? 'active' : ''}`}
              onClick={() => {
                setIsPlaying(false);
                handleStepChange(idx);
              }}
              data-testid={`timeline-step-btn-${s.step}`}
            >
              <div className="step-circle">{s.step}</div>
              <span className="step-label">
                {s.step === 0 ? 'Init' : s.operation.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Before / After Transition & Gate Explanation Card */}
      <div className="step-transition-card" data-testid="step-transition-card">
        <div className="transition-header">
          <div className="transition-title-group">
            <Sparkles size={13} className="sparkle-icon" />
            <span className="transition-gate-name">{gateDisplayName}</span>
            {currentStep.step > 0 && (
              <span className="transition-target-tag">
                {currentStep.qubits.length > 1
                  ? `Control: q[${currentStep.qubits[0]}] → Target: q[${currentStep.qubits[1]}]`
                  : `q[${currentStep.qubits[0]}]`}
              </span>
            )}
          </div>
          <span className="transition-step-tag">Step {currentStep.step}</span>
        </div>

        <p className="transition-effect-desc">{transitionEffectText}</p>

        <div className="before-after-grid">
          <div className="state-stage-box before">
            <span className="stage-lbl">Before Operation:</span>
            <span className="stage-val">
              {prevStep ? formatTopStates(prevStep.probabilities) : 'Initial ground state |0...0⟩'}
            </span>
          </div>
          <div className="stage-arrow">→</div>
          <div className="state-stage-box after">
            <span className="stage-lbl">After Operation:</span>
            <span className="stage-val">{formatTopStates(currentStep.probabilities)}</span>
          </div>
        </div>
      </div>

      {/* Snapshot View of Current State at Step */}
      <div className="timeline-snapshot-pane">
        <span className="snapshot-title">
          State at Step {currentStep.step} (
          {currentStep.step === 0
            ? 'INITIAL STATE |0...0⟩'
            : `${currentStep.operation.toUpperCase()} on q[${currentStep.qubits.join(', ')}]`}
          ):
        </span>

        {/* Dynamic Per-Qubit Bloch Vectors at this step with full trajectory up to current step */}
        {(currentStep.bloch_qubits || currentStep.bloch) && (
          <div className="snapshot-bloch">
            <BlochSphere
              bloch={currentStep.bloch}
              blochQubits={currentStep.bloch_qubits}
              qubitCount={timeline.qubits}
              stepInfo={{
                step: currentStep.step,
                operation: currentStep.operation,
                qubits: currentStep.qubits,
              }}
              timelineSteps={timeline.steps}
            />
          </div>
        )}

        {/* Complex Statevector Amplitudes at this step */}
        {currentStep.statevector && currentStep.statevector.length > 0 && (
          <div className="snapshot-statevector-card" data-testid="snapshot-statevector-card">
            <span className="snapshot-subhead">Statevector |ψ⟩ Amplitudes &amp; Phases:</span>
            <div className="statevector-amplitudes-grid">
              {currentStep.statevector.map((amp, ampIdx) => {
                const numQubits = timeline.qubits || 1;
                const binaryBasis = ampIdx.toString(2).padStart(numQubits, '0');
                const magSq = amp.real * amp.real + amp.imag * amp.imag;
                if (magSq < 0.0001 && currentStep.statevector!.length > 8) return null;
                const phase = Math.atan2(amp.imag, amp.real);
                const phaseDeg = Math.round((phase * 180) / Math.PI);
                const sign = amp.imag >= 0 ? '+' : '-';

                return (
                  <div key={ampIdx} className="statevector-amp-cell">
                    <span className="amp-basis-lbl">|{binaryBasis}⟩</span>
                    <span className="amp-complex-val">
                      {amp.real.toFixed(3)} {sign} {Math.abs(amp.imag).toFixed(3)}i
                    </span>
                    <span className="amp-prob-badge">{(magSq * 100).toFixed(1)}%</span>
                    {phaseDeg !== 0 && (
                      <span className="amp-phase-badge" title="Relative phase angle">
                        θ: {phaseDeg}°
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Probabilities at this step */}
        {currentStep.probabilities && (
          <div className="snapshot-probabilities">
            <ProbabilityHistogram probabilities={currentStep.probabilities} />
          </div>
        )}
      </div>
    </div>
  );
};

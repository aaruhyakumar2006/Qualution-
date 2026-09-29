/**
 * GroverUnifiedPanel.tsx
 *
 * Grover's Quantum Search Masterclass & Practical Lab Panel:
 *   - Deep Quantum Theory: The Story, Amplitude Bar Heights & Mean Inversion, 2D Compass Rotation
 *   - Interactive visual simulation of amplitude reflection and geometric state rotation
 *   - Direct 2-qubit Grover circuit injection into the live practical composer
 *   - Classical vs Quantum scaling benchmarks and interactive checkpoints
 *
 * Taught by Erwin, Your Quantum Physics Mentor.
 */

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
  BookOpen,
  Brain,
  BarChart3,
  Compass,
  Check,
  RotateCcw,
} from 'lucide-react';

import type { TeachingController } from '../../features/teaching/teachingController';
import type { TeachingControllerState } from '../../features/teaching/types';
import type { CircuitRequest, Gate } from '../../features/circuit/types';
import { useErwinCompanion } from '../../hooks/useErwinState';
import {
  GROVER_EXPLANATION_SPINE,
  SCALING_TABLE,
  WHAT_GROVER_IS_NOT,
  STAGE_0_DATA,
} from '../../features/teaching/lessons/sprint-02/groverLessonData';
import './GroverUnifiedPanel.css';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Circuit Definitions
// ─────────────────────────────────────────────────────────────────────────────

interface GroverUnifiedPanelProps {
  controller: TeachingController | null;
  onExitLesson?: () => void;
  onNextLesson?: (nextLessonId: string) => void;
}

type TabId = 'theory' | 'scaling';
type SpineDepth = 'story' | 'bars' | 'compass';

// Circuit gate definitions for practical composer synchronization
const GATES_SUPERPOSITION: Gate[] = [
  { id: 'g_s0_h0', gate: 'h', targets: [0], column: 0 },
  { id: 'g_s0_h1', gate: 'h', targets: [1], column: 0 },
];

const GATES_ORACLE: Gate[] = [
  ...GATES_SUPERPOSITION,
  { id: 'g_s1_cz', gate: 'cz', targets: [0, 1], column: 1 },
];

const GATES_DIFFUSION: Gate[] = [
  ...GATES_ORACLE,
  { id: 'g_s2_h0', gate: 'h', targets: [0], column: 2 },
  { id: 'g_s2_h1', gate: 'h', targets: [1], column: 2 },
  { id: 'g_s2_x0', gate: 'x', targets: [0], column: 3 },
  { id: 'g_s2_x1', gate: 'x', targets: [1], column: 3 },
  { id: 'g_s2_cz', gate: 'cz', targets: [0, 1], column: 4 },
  { id: 'g_s2_x0p', gate: 'x', targets: [0], column: 5 },
  { id: 'g_s2_x1p', gate: 'x', targets: [1], column: 5 },
  { id: 'g_s2_h0p', gate: 'h', targets: [0], column: 6 },
  { id: 'g_s2_h1p', gate: 'h', targets: [1], column: 6 },
];

const GATES_MEASUREMENT: Gate[] = [
  ...GATES_DIFFUSION,
  { id: 'g_s3_m0', gate: 'measure', targets: [0], column: 7 },
  { id: 'g_s3_m1', gate: 'measure', targets: [1], column: 7 },
];

// Bar visualization steps for Depth 2
const BAR_STEPS = [
  {
    id: 'superposition',
    title: '1. Equal Superposition',
    desc: 'Hadamard gates put both qubits into uniform superposition. All 4 states have amplitude +0.50 (25% probability).',
    amplitudes: [0.5, 0.5, 0.5, 0.5],
    mean: 0.5,
    highlight: -1,
  },
  {
    id: 'oracle',
    title: '2. Oracle Phase Inversion',
    desc: 'The CZ oracle marks target |11⟩ by flipping its phase to -0.50. The average amplitude drops to μ = +0.25.',
    amplitudes: [0.5, 0.5, 0.5, -0.5],
    mean: 0.25,
    highlight: 3,
  },
  {
    id: 'diffusion',
    title: '3. Inversion About the Mean',
    desc: 'Diffusion mirrors all bars across μ = +0.25. Wrong states drop to 0.0, and target |11⟩ amplifies to 100%!',
    amplitudes: [0.0, 0.0, 0.0, 1.0],
    mean: 0.25,
    highlight: 3,
  },
];

// Compass visualization angles for Depth 3
const COMPASS_STEPS = [
  {
    angle: 30,
    label: 'Initial State |s⟩ (30°)',
    desc: 'Starts at θ = 30° above the horizontal axis |s\'⟩ because sin(30°) = 1/2 = 1/√4 (25% target probability).',
  },
  {
    angle: 90,
    label: '1 Iteration: Target |11⟩ (90°)',
    desc: 'One Grover round rotates the state vector by 2θ = 60°. 30° + 60° = 90°, pointing directly at vertical target |11⟩ (100% certainty)!',
  },
  {
    angle: 150,
    label: '2 Iterations: Overshoot (150°)',
    desc: 'A second round rotates another 60° to 150°. The vector overshoots the target axis, dropping P(11) back to sin²(150°) = 25%!',
  },
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const GroverUnifiedPanel: React.FC<GroverUnifiedPanelProps> = ({
  controller,
  onExitLesson,
  onNextLesson,
}) => {
  const [, setTeachingState] = useState<TeachingControllerState | null>(
    () => controller?.getState() ?? null
  );

  const [activeTab, setActiveTab] = useState<TabId>('theory');
  const [spineDepth, setSpineDepth] = useState<SpineDepth>('story');
  const [barStepIdx, setBarStepIdx] = useState<number>(1); // Default to oracle step
  const [compassAngleIdx, setCompassAngleIdx] = useState<number>(1); // Default to 90°
  const [circuitSynced, setCircuitSynced] = useState<boolean>(false);

  // Checkpoint state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  const { state: _erwinState } = useErwinCompanion(controller);

  // Subscribe to controller state
  useEffect(() => {
    if (!controller) return;
    setTeachingState(controller.getState());
    const unsub = controller.subscribe((next) => {
      setTeachingState(next);
    });
    return unsub;
  }, [controller]);

  // Load circuit into live workbench composer
  const handleLoadCircuit = useCallback(
    (gates: Gate[]) => {
      if (!controller) return;
      try {
        const circuitRequest: CircuitRequest = {
          qubits: 2,
          classical_bits: 2,
          gates,
          measure: true,
          shots: 1000,
        };
        controller.getCircuit();
        (controller as any).hooks?.updateCircuit?.(circuitRequest);
        setCircuitSynced(true);
        setTimeout(() => setCircuitSynced(false), 2400);
      } catch {
        // Safe fallback
      }
    },
    [controller]
  );

  const handleSubmitPrediction = () => {
    if (selectedOption === null) return;
    setHasAnswered(true);
    if (controller && STAGE_0_DATA.checkpoint) {
      controller.submitPrediction(selectedOption);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Deep Theory Tab
  // ─────────────────────────────────────────────────────────────────────────
  const renderTheoryTab = () => {
    const spine = GROVER_EXPLANATION_SPINE[spineDepth];
    const currentBarStep = BAR_STEPS[barStepIdx];
    const currentCompass = COMPASS_STEPS[compassAngleIdx];
    const states = ['|00⟩', '|01⟩', '|10⟩', '|11⟩ (Target)'];

    return (
      <div className="gup-theory-tab-content">
        {/* Depth Selector */}
        <div className="gup-section-label">
          <BookOpen size={10} />
          <span>Grover Explanation Spine — 3 Mathematical Depths</span>
          <span className="gup-section-divider" />
        </div>

        <div className="gup-depth-selector">
          {(['story', 'bars', 'compass'] as SpineDepth[]).map((depth) => (
            <button
              key={depth}
              type="button"
              className={`gup-depth-btn ${spineDepth === depth ? 'active' : ''}`}
              onClick={() => setSpineDepth(depth)}
            >
              {depth === 'story' && '1. The Story'}
              {depth === 'bars' && '2. Bar Heights & Mean'}
              {depth === 'compass' && '3. The 2D Compass'}
            </button>
          ))}
        </div>

        {/* Spine Card */}
        <div className="gup-spine-card">
          <div className="gup-spine-header">
            <span className="gup-spine-depth-tag">{spine.depth.toUpperCase()} LEVEL</span>
            <h4 className="gup-spine-title">{spine.title}</h4>
            <p className="gup-spine-summary">{spine.summary}</p>
          </div>
          <div className="gup-spine-body">
            <p>{spine.body}</p>
          </div>
        </div>

        {/* ── Interactive Visualizer for Depth 2: Bar Heights & Mean ───────── */}
        {spineDepth === 'bars' && (
          <div className="gup-interactive-card">
            <div className="gup-interactive-header">
              <span className="gup-interactive-badge">INTERACTIVE VISUALIZER</span>
              <h5 className="gup-interactive-title">Inversion About the Mean Simulation</h5>
            </div>

            {/* Step selector buttons */}
            <div className="gup-bar-step-selector">
              {BAR_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  className={`gup-bar-step-pill ${barStepIdx === idx ? 'active' : ''}`}
                  onClick={() => setBarStepIdx(idx)}
                >
                  {step.title}
                </button>
              ))}
            </div>

            <p className="gup-interactive-step-desc">{currentBarStep.desc}</p>

            {/* Live 4-State Amplitude Bar Canvas */}
            <div className="gup-amplitude-bars-canvas mini">
              <div className="gup-zero-axis" />

              {/* Mean Reference Line */}
              {currentBarStep.mean !== undefined && (
                <div
                  className="gup-mean-reference-line"
                  style={{ bottom: `${50 + currentBarStep.mean * 40}%` }}
                >
                  <span className="gup-mean-line-tag">Mean μ = +{currentBarStep.mean.toFixed(2)}</span>
                </div>
              )}

              {/* 4 State Bars */}
              <div className="gup-bars-grid">
                {currentBarStep.amplitudes.map((amp, idx) => {
                  const isTarget = idx === 3;
                  const isNegative = amp < 0;
                  const heightPct = Math.abs(amp) * 80;
                  const probPct = Math.round(amp * amp * 100);

                  return (
                    <div key={states[idx]} className={`gup-bar-col ${isTarget ? 'is-target' : ''}`}>
                      <div className="gup-bar-metric-top">
                        <span className="gup-bar-prob">{probPct}%</span>
                        <span className="gup-bar-amp-val">
                          {amp > 0 ? `+${amp.toFixed(2)}` : amp.toFixed(2)}
                        </span>
                      </div>

                      <div className="gup-bar-track">
                        <div
                          className={`gup-bar-fill ${isNegative ? 'negative-bar' : ''} ${isTarget ? 'target-bar' : ''}`}
                          style={{
                            height: `${heightPct}%`,
                            bottom: isNegative ? undefined : '50%',
                            top: isNegative ? '50%' : undefined,
                          }}
                        >
                          {isNegative && <span className="gup-negative-arrow">▼ -1/2 Phase</span>}
                          {isTarget && amp >= 0.9 && <span className="gup-target-star">★ 100%</span>}
                        </div>
                      </div>

                      <div className="gup-bar-state-label">
                        <span className={`gup-state-pill ${isTarget ? 'target-state' : ''}`}>
                          {states[idx]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Interactive Visualizer for Depth 3: 2D Compass ─────────────── */}
        {spineDepth === 'compass' && (
          <div className="gup-interactive-card">
            <div className="gup-interactive-header">
              <span className="gup-interactive-badge">INTERACTIVE VISUALIZER</span>
              <h5 className="gup-interactive-title">2D State Space Compass Rotation</h5>
            </div>

            <div className="gup-compass-stage-row">
              <div className="gup-compass-frame large">
                <Compass size={14} className="gup-compass-icon" />
                <div className="gup-compass-dial">
                  <div className="gup-axis-h" />
                  <div className="gup-axis-v" />
                  <div
                    className="gup-state-vector-arrow"
                    style={{
                      transform: `rotate(-${currentCompass.angle}deg)`,
                    }}
                  />
                </div>
                <span className="gup-compass-angle-text">{currentCompass.angle}°</span>
              </div>

              <div className="gup-compass-info">
                <div className="gup-compass-angle-selector">
                  {COMPASS_STEPS.map((cs, idx) => (
                    <button
                      key={cs.angle}
                      type="button"
                      className={`gup-compass-btn ${compassAngleIdx === idx ? 'active' : ''}`}
                      onClick={() => setCompassAngleIdx(idx)}
                    >
                      {cs.angle}° {idx === 1 ? '(Optimal)' : idx === 2 ? '(Overshoot)' : ''}
                    </button>
                  ))}
                </div>
                <h6 className="gup-compass-step-title">{currentCompass.label}</h6>
                <p className="gup-compass-step-desc">{currentCompass.desc}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Practical Workbench Composer Synchronization ────────────────── */}
        <div className="gup-composer-sync-card">
          <div className="gup-sync-content">
            <div className="gup-sync-title-row">
              <Zap size={14} className="gup-sync-icon" />
              <span className="gup-sync-title">Synchronize Live Circuit Composer</span>
            </div>
            <p className="gup-sync-desc">
              Load the complete 2-qubit Grover Search circuit (Hadamard Superposition + CZ Oracle + Grover Diffusion + Measurement) directly onto your left practical workbench.
            </p>
          </div>
          <button
            type="button"
            className={`gup-sync-btn ${circuitSynced ? 'synced' : ''}`}
            onClick={() => handleLoadCircuit(GATES_MEASUREMENT)}
          >
            {circuitSynced ? (
              <>
                <Check size={13} />
                <span>Circuit Injected!</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Load Grover Circuit</span>
              </>
            )}
          </button>
        </div>

        {/* ── What Grover's Search Is NOT ────────────────────────────────── */}
        <div className="gup-section-label" style={{ marginTop: 10 }}>
          <Brain size={10} />
          <span>What Grover's Search Is NOT (Common Fallacies)</span>
          <span className="gup-section-divider" />
        </div>

        <div className="gup-misconceptions-list">
          {WHAT_GROVER_IS_NOT.map((item, idx) => (
            <div key={idx} className="gup-misconception-item">
              <div className="gup-misconception-myth">
                <span className="gup-myth-tag">MYTH {idx + 1}</span>
                <span className="gup-myth-text">{item.myth}</span>
              </div>
              <div className="gup-misconception-reality">
                <span className="gup-reality-tag">REALITY</span>
                <span className="gup-reality-text">{item.reality}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Scaling & Complexity Tab
  // ─────────────────────────────────────────────────────────────────────────
  const renderScalingTab = () => (
    <div className="gup-scaling-tab-content">
      {/* Classical vs Quantum Intuition Checkpoint */}
      <div className="gup-checkpoint-card">
        <div className="gup-checkpoint-header">
          <span className="gup-checkpoint-badge">CONCEPT CHECKPOINT</span>
          <span className="gup-checkpoint-title">Classical vs. Quantum Search Intuition</span>
        </div>

        <p className="gup-prediction-question">
          {STAGE_0_DATA.checkpoint.question}
        </p>

        <div className="gup-prediction-options">
          {STAGE_0_DATA.checkpoint.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = opt.isCorrect;
            let optClass = '';
            if (hasAnswered) {
              if (isSelected) {
                optClass = isCorrect ? 'correct' : 'wrong';
              } else if (isCorrect) {
                optClass = 'reveal-correct';
              }
            } else if (isSelected) {
              optClass = 'selected';
            }

            return (
              <button
                key={opt.id}
                type="button"
                className={`gup-pred-opt ${optClass}`}
                disabled={hasAnswered}
                onClick={() => setSelectedOption(idx)}
              >
                <span className="gup-opt-letter">{OPTION_LETTERS[idx]}</span>
                <div className="gup-opt-text">
                  <span className="gup-opt-label">{opt.label}</span>
                  <span className="gup-opt-desc">{opt.description}</span>
                </div>
                {hasAnswered && isSelected && isCorrect && (
                  <CheckCircle2 size={15} className="gup-opt-icon" color="#00ff88" />
                )}
                {hasAnswered && isSelected && !isCorrect && (
                  <XCircle size={15} className="gup-opt-icon" color="#ff3b60" />
                )}
              </button>
            );
          })}
        </div>

        {!hasAnswered ? (
          <button
            type="button"
            className="gup-submit-btn"
            disabled={selectedOption === null}
            onClick={handleSubmitPrediction}
          >
            <span>Check My Intuition</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <div className="gup-answer-feedback">
            <Lightbulb size={14} className="gup-feedback-bulb" />
            <p>
              {selectedOption === 2
                ? 'Spot on! If 3 boxes are empty, the 4th must contain the prize by elimination (N-1 queries). In contrast, Grover uses quantum interference to isolate the marked item in only 1 query!'
                : 'In the classical worst-case, if you open 3 empty boxes, the prize must be in the 4th (N-1 = 3 queries). Quantum search finds it in just 1 query!'}
            </p>
          </div>
        )}
      </div>

      <div className="gup-section-label" style={{ marginTop: 14 }}>
        <BarChart3 size={10} />
        <span>Complexity Scaling: Classical O(N) vs Grover O(√N)</span>
        <span className="gup-section-divider" />
      </div>

      <div className="gup-scaling-intro">
        <p>
          Classical search over an unsorted database of size <em>N</em> requires looking at <em>N/2</em> items on average, and <em>N-1</em> in the worst case (<strong>O(N)</strong>). Grover's algorithm uses quantum amplitude amplification to find the marked item in only <strong>O(√N)</strong> queries — a provably optimal quadratic speedup.
        </p>
      </div>

      <div className="gup-scaling-table-wrap">
        <table className="gup-scaling-table">
          <thead>
            <tr>
              <th>Items (N)</th>
              <th>Classical Worst-Case (N-1)</th>
              <th>Classical Avg (N/2)</th>
              <th>Grover Quantum (≈ π/4 √N)</th>
              <th>Speedup Factor</th>
            </tr>
          </thead>
          <tbody>
            {SCALING_TABLE.map((row, idx) => (
              <tr key={idx} className={row.n === '4' ? 'highlight-row' : ''}>
                <td><strong>{row.n}</strong> {row.n === '4' ? '(Current Lesson)' : ''}</td>
                <td>{row.classicalWorst}</td>
                <td>{row.classicalAvg}</td>
                <td className="quantum-cell"><strong>{row.groverRounds}</strong></td>
                <td className="speedup-cell">{row.speedup}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gup-scaling-math-card">
        <h5 className="gup-math-title">Exact Query Formulation</h5>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {'$$R \\approx \\left\\lfloor \\frac{\\pi}{4}\\sqrt{N} \\right\\rfloor = \\left\\lfloor \\frac{\\pi}{4}\\sqrt{4} \\right\\rfloor = \\lfloor 1.57 \\rfloor = 1$$'}
          </ReactMarkdown>
        </div>
        <p className="gup-math-note">
          For N=4, exactly 1 query is required to achieve 100% theoretical probability of measuring the marked state |11⟩.
        </p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render Root
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="gup-root" data-testid="grover-unified-panel">
      {/* Header Bar */}
      <div className="gup-header">
        <div className="gup-header-brand">
          <div className="gup-header-icon">
            <Sparkles size={15} color="#fff" />
          </div>
          <div className="gup-header-text">
            <div className="gup-header-title">GROVER'S SEARCH ALGORITHM</div>
            <div className="gup-header-subtitle">
              Practical Lab &amp; Quantum Theory · Taught by Erwin
            </div>
          </div>
        </div>

        {/* Clean 2-Tab Row (Deep Math & Scaling) */}
        <div className="gup-header-tab-row">
          <button
            type="button"
            className={`gup-tab-btn ${activeTab === 'theory' ? 'active' : ''}`}
            onClick={() => setActiveTab('theory')}
          >
            <BookOpen size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Deep Math
          </button>
          <button
            type="button"
            className={`gup-tab-btn ${activeTab === 'scaling' ? 'active' : ''}`}
            onClick={() => setActiveTab('scaling')}
          >
            <BarChart3 size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Scaling
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="gup-body">
        {activeTab === 'theory' && renderTheoryTab()}
        {activeTab === 'scaling' && renderScalingTab()}
      </div>

      {/* Footer Navigation */}
      <div className="gup-footer">
        {onExitLesson && (
          <button type="button" className="gup-footer-btn exit" onClick={onExitLesson}>
            Exit Lesson
          </button>
        )}
        <div className="gup-footer-spacer" />
        <button
          type="button"
          className="gup-footer-btn load-circuit"
          onClick={() => handleLoadCircuit(GATES_MEASUREMENT)}
        >
          <Zap size={13} />
          <span>Load Full Circuit</span>
        </button>
        {onNextLesson && (
          <button
            type="button"
            className="gup-footer-btn complete"
            onClick={() => onNextLesson('sprint-02-complete')}
          >
            <span>Complete Masterclass</span>
            <Trophy size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

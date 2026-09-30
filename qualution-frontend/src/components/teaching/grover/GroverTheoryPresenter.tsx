/**
 * GroverTheoryPresenter.tsx
 *
 * Full interactive Grover Theory Masterclass Presentation Stage.
 * Implements the 6-beat fact-checked curriculum (~5:15 total):
 *   T1 (0:40): "The four boxes" — classical search needs ~N checks
 *   T2 (0:50): "Amplitudes" — equal superposition, four amplitudes of 1/2, prob = amplitude squared
 *   T3 (0:55): "The hidden mark" — oracle flips one sign; probabilities do not change
 *   T4 (1:10): "The mirror" — diffusion reflects across mean; marked rises to 1, others fall to 0
 *   T5 (0:55): "The compass" — angle 30° -> 90° -> 150°; overshoot warning
 *   T6 (0:45): "Scale and handoff" — sqrt(N) scaling, what Grover is NOT, handoff card
 *
 * Ground Rules:
 * - Motion is CSS transform & opacity only
 * - Deterministic render at ANY seek position (no incremental drift)
 * - Captions always on, synchronized with narration
 * - One fixed token color (#00f2ff) for marked prize state
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowRight,
  Maximize2,
  Sparkles,
  Zap,
  Sliders,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { GroverBoxStrip } from './GroverBoxStrip';
import { GroverAmplitudeBars } from './GroverAmplitudeBars';
import { GroverCompass } from './GroverCompass';
import { defaultSpeechService, ELEVENLABS_VOICES } from '../../../features/teaching/speechService';
import { saveTheoryHandoffPayload } from '../../../services/db/offlineProgressDb';
import type { LessonWorkbenchHandoff } from '../../../features/theory/lessonHandoff';
import './groverShared.css';

export interface GroverTheoryPresenterProps {
  /** Optional external seek target */
  initialTimeMs?: number;
  /** Callback to launch Workbench practical lab */
  onLaunchWorkbench?: (payload?: LessonWorkbenchHandoff) => void;
  /** Callback to return to Academy */
  onNavigateBack?: () => void;
  /** Optional custom container style */
  className?: string;
}

// ── Beat Definitions ─────────────────────────────────────────────────────────

export interface TheoryBeat {
  id: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  number: number;
  title: string;
  subtitle: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  katex: string;
  narration: string;
}

export const GROVER_BEATS: TheoryBeat[] = [
  {
    id: 'T1',
    number: 1,
    title: 'The Four Boxes',
    subtitle: 'Classical Search Bottleneck vs. Quantum Interference',
    startMs: 0,
    endMs: 40000,
    durationMs: 40000,
    katex: '\\text{Classical Search: } \\mathcal{O}(N) \\text{ checks} \\quad (N = 4, \\text{ Average: } N/2)',
    narration:
      'Imagine four closed boxes, labeled zero-zero, zero-one, one-zero, and one-one. Exactly one box hides a prize, but there is no index or alphabetical order to guide us. In classical computing, an algorithm has no choice but to inspect boxes one by one. In the worst case, checking three empty boxes tells you the prize is in the fourth—taking order N queries. If our database grew to a million entries, classical search would average half a million lookups. But quantum physics offers a radically different path: not by checking everything at once, but by shaping quantum interference.',
  },
  {
    id: 'T2',
    number: 2,
    title: 'Amplitudes',
    subtitle: 'Equal Superposition & The Born Rule',
    startMs: 40000,
    endMs: 90000,
    durationMs: 50000,
    katex: '|s\\rangle = H^{\\otimes 2}|00\\rangle = \\frac{1}{2}|00\\rangle + \\frac{1}{2}|01\\rangle + \\frac{1}{2}|10\\rangle + \\frac{1}{2}|11\\rangle, \\quad P(x) = |\\alpha_x|^2 = \\frac{1}{4}',
    narration:
      'To search with a quantum computer, we start with two qubits initialized in the ground state |00⟩. We apply a Hadamard gate to both wires, placing our system into an equal superposition across all four computational states. In quantum mechanics, states do not hold simple percentages; they hold probability amplitudes. Here, each state receives an identical amplitude of positive one-half. By the Born Rule, the probability of measuring any state is its amplitude squared: one-half squared equals one-fourth, or twenty-five percent. All four boxes are equally likely, perfectly balanced in quantum symmetry.',
  },
  {
    id: 'T3',
    number: 3,
    title: 'The Hidden Mark',
    subtitle: 'Phase Inversion (Probabilities Unchanged)',
    startMs: 90000,
    endMs: 145000,
    durationMs: 55000,
    katex: '|\\psi_1\\rangle = O_{11}|s\\rangle = \\frac{1}{2}|00\\rangle + \\frac{1}{2}|01\\rangle + \\frac{1}{2}|10\\rangle - \\frac{1}{2}|11\\rangle \\implies P(|11\\rangle) = \\left|-\\frac{1}{2}\\right|^2 = 25\\%',
    narration:
      'Now we introduce the Oracle. The oracle does not know the location of the prize in advance; it acts as a verification check, flipping the sign of whichever state satisfies our search condition. Suppose our target is state one-one. The oracle applies a phase flip, multiplying the amplitude of |11⟩ by negative one. Notice something subtle: the amplitude of state one-one is now negative one-half, while the others remain positive one-half. But if you measure the circuit right now, what happens? Nothing! Negative one-half squared is still positive one-fourth. The measurement probabilities remain exactly twenty-five percent across all four boxes. The target is marked, but the mark is invisible to direct readout.',
  },
  {
    id: 'T4',
    number: 4,
    title: 'The Mirror',
    subtitle: 'Grover Diffusion Operator (Inversion About the Mean)',
    startMs: 145000,
    endMs: 215000,
    durationMs: 70000,
    katex: '\\mu = +\\frac{1}{4}, \\quad \\alpha\' = 2\\mu - \\alpha \\implies \\alpha_{\\text{wrong}}\' = 0, \\quad \\alpha_{\\text{marked}}\' = 2\\left(\\frac{1}{4}\\right) - \\left(-\\frac{1}{2}\\right) = +1.00',
    narration:
      'To convert that hidden negative phase into visible measurement probability, we apply the Grover Diffusion Operator: inversion about the mean. First, calculate the average amplitude across all four states: positive one-half, plus one-half, plus one-half, minus one-half, divided by four. The average line sits at exactly positive one-fourth. Now, the diffusion operator acts like an amphitheater mirror, reflecting every amplitude across that average line using the formula: alpha prime equals two mu minus alpha. For the three unmarked states, their amplitude was one-fourth above average; reflecting them drops them to zero. But our marked state sat three-fourths below average; reflecting it pushes it three-fourths above the average line—landing at exactly positive one! Destructive interference erases the wrong boxes, while constructive interference boosts our target to certainty.',
  },
  {
    id: 'T5',
    number: 5,
    title: 'The Compass',
    subtitle: 'State Space Rotation & Overshoot Dynamics',
    startMs: 215000,
    endMs: 270000,
    durationMs: 55000,
    katex: '\\theta_0 = 30^\\circ \\xrightarrow{+60^\\circ} 90^\\circ \\; (100\\% \\text{ Certainty}) \\xrightarrow{+60^\\circ} 150^\\circ \\; (\\text{Overshoot: } 25\\% \\text{ Target})',
    narration:
      'Why does Grover\'s algorithm stop here? We can visualize the entire computation as a 2D compass. The horizontal axis represents all wrong states, and the vertical axis points directly to our marked prize. Our initial superposition starts at an angle of thirty degrees, because sine of thirty degrees is one-half. Each combined round of Oracle plus Diffusion rotates our state vector counter-clockwise by exactly sixty degrees. After just one round, thirty degrees plus sixty degrees equals ninety degrees—aligning perfectly with the vertical axis. State one-one is measured with one hundred percent certainty! But beware a common trap: quantum search is not a classical loop where more rounds equal more accuracy. If you run a second iteration, the vector rotates sixty degrees further, to one hundred and fifty degrees. The target probability overshoots, collapsing back down to twenty-five percent. Timing in quantum algorithms is exact.',
  },
  {
    id: 'T6',
    number: 6,
    title: 'Scale and Handoff',
    subtitle: 'O(√N) Quadratic Speedup & Practical Lab Handoff',
    startMs: 270000,
    endMs: 315000,
    durationMs: 45000,
    katex: 'R \\approx \\frac{\\pi}{4}\\sqrt{N} \\quad \\mid \\quad \\text{AES-128: } 2^{128} \\to 2^{64} \\text{ ops} \\quad \\mid \\quad \\text{Optimal: } \\Omega(\\sqrt{N})',
    narration:
      'For a database of size N, Grover\'s algorithm requires approximately pi over four times the square root of N iterations. In cryptography, this quadratic speedup halves the effective security of symmetric keys like AES-128 down to sixty-four bits. But let\'s be clear on what Grover is not: it is not exponential, it does not replace binary search on sorted data, and it cannot pull secrets out of thin air without an oracle circuit. Now, theoretical understanding is complete. It is time to prove it on real quantum hardware. Step into the QUALUTION Workbench, place your Hadamard gates, wire your Controlled-Z oracle, and construct the diffusion operator yourself.',
  },
];

export const TOTAL_GROVER_DURATION_MS = 315000; // 5:15 total

export const GroverTheoryPresenter: React.FC<GroverTheoryPresenterProps> = ({
  initialTimeMs = 0,
  onLaunchWorkbench,
  onNavigateBack,
  className = '',
}) => {
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(initialTimeMs);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string>(() => defaultSpeechService.getApiKey() || '');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => defaultSpeechService.getVoiceId());
  const [isApiKeySaved, setIsApiKeySaved] = useState<boolean>(false);
  const [testSpeechStatus, setTestSpeechStatus] = useState<string>('');
  const [isTestingSpeech, setIsTestingSpeech] = useState<boolean>(false);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number | null>(null);
  const [isAutoAdvanceCancelled, setIsAutoAdvanceCancelled] = useState<boolean>(false);
  const lastTimestampRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const wasScrubbedRef = useRef<boolean>(false);
  const beatsSeenRef = useRef<Set<string>>(new Set(['T1']));
  const autoAdvanceTriggeredRef = useRef<boolean>(false);
  const lastSpokenBeatIdRef = useRef<string | null>(null);

  // Active Beat calculation
  const currentBeat = useMemo(() => {
    return (
      GROVER_BEATS.find(
        (b) => currentTimeMs >= b.startMs && currentTimeMs < b.endMs
      ) || GROVER_BEATS[GROVER_BEATS.length - 1]
    );
  }, [currentTimeMs]);

  // Track beats seen
  useEffect(() => {
    beatsSeenRef.current.add(currentBeat.id);
  }, [currentBeat.id]);

  // Helper to speak active beat narration
  const speakBeatNarration = useCallback((beat: TheoryBeat) => {
    if (isVoiceMuted) return;
    defaultSpeechService.speak(beat.narration, {
      rate: 1.0,
      pitch: 1.0,
    }).catch(() => {});
  }, [isVoiceMuted]);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      defaultSpeechService.stop();
    };
  }, []);

  // Handoff trigger
  const handleTriggerHandoff = useCallback(async () => {
    const watchedToEnd = !wasScrubbedRef.current;
    const payload: LessonWorkbenchHandoff = {
      sourceLessonId: 'lesson-8-grovers-search',
      lessonId: 'lesson-8-grovers-search',
      lessonTitle: "Grover's Search Algorithm",
      conceptTitle: "Grover's Search Algorithm",
      conceptFormula: 'R \\approx \\frac{\\pi}{4}\\sqrt{N}',
      beatsSeen: Array.from(beatsSeenRef.current),
      watchedToEnd,
      completedAt: Date.now(),
      targetState: '11',
      recommendedExperimentId: 'lesson-8-grovers-search',
      returnPath: '/?theory-lesson=lesson-8-grovers-search',
      circuit: {
        qubits: 2,
        classical_bits: 2,
        gates: [],
        measure: false,
        shots: 1000,
      },
    };

    if (onLaunchWorkbench) {
      onLaunchWorkbench(payload);
    }

    try {
      saveTheoryHandoffPayload('lesson-8-grovers-search', {
        sourceLessonId: 'lesson-8-grovers-search',
        beatsSeen: payload.beatsSeen || ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
        watchedToEnd,
        completedAt: payload.completedAt || Date.now(),
        returnPath: payload.returnPath || '/?theory-lesson=lesson-8-grovers-search',
      }).catch((err) => {
        console.warn('[GroverTheoryPresenter] Dexie handoff save error:', err);
      });
    } catch (err) {
      console.warn('[GroverTheoryPresenter] Dexie handoff save error:', err);
    }
  }, [onLaunchWorkbench]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (!next) {
        defaultSpeechService.stop();
      } else {
        lastSpokenBeatIdRef.current = currentBeat.id;
        speakBeatNarration(currentBeat);
      }
      return next;
    });
  }, [currentBeat, speakBeatNarration]);

  // Handle Seek
  const seekTo = useCallback((targetMs: number) => {
    wasScrubbedRef.current = true;
    setIsAutoAdvanceCancelled(true);
    setAutoAdvanceSeconds(null);
    const clamped = Math.max(0, Math.min(targetMs, TOTAL_GROVER_DURATION_MS));
    setCurrentTimeMs(clamped);
    defaultSpeechService.stop();

    const targetBeat = GROVER_BEATS.find(
      (b) => clamped >= b.startMs && clamped < b.endMs
    ) || GROVER_BEATS[GROVER_BEATS.length - 1];

    if (isPlaying && !isVoiceMuted) {
      lastSpokenBeatIdRef.current = targetBeat.id;
      speakBeatNarration(targetBeat);
    } else {
      lastSpokenBeatIdRef.current = null;
    }
  }, [isPlaying, isVoiceMuted, speakBeatNarration]);

  // Handle Voice Mute Toggle
  const toggleVoiceMute = useCallback(() => {
    setIsVoiceMuted((m) => {
      const next = !m;
      if (next) {
        defaultSpeechService.stop();
      } else if (isPlaying) {
        lastSpokenBeatIdRef.current = currentBeat.id;
        speakBeatNarration(currentBeat);
      }
      return next;
    });
  }, [isPlaying, currentBeat, speakBeatNarration]);

  // Scrub bar click
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    wasScrubbedRef.current = true;
    setIsAutoAdvanceCancelled(true);
    setAutoAdvanceSeconds(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(ratio * TOTAL_GROVER_DURATION_MS);
  };

  // Main playback animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimestampRef.current = null;
      return;
    }

    const loop = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      setCurrentTimeMs((prev) => {
        const next = prev + delta;
        if (next >= TOTAL_GROVER_DURATION_MS) {
          setIsPlaying(false);
          // On natural completion, if not scrubbed, kick off auto-advance countdown
          if (!wasScrubbedRef.current && !isAutoAdvanceCancelled && !autoAdvanceTriggeredRef.current) {
            autoAdvanceTriggeredRef.current = true;
            setAutoAdvanceSeconds(8);
          }
          return TOTAL_GROVER_DURATION_MS;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isAutoAdvanceCancelled]);

  // Auto-advance countdown effect (8s countdown, cancellable with 'Stay here')
  useEffect(() => {
    if (autoAdvanceSeconds === null || isAutoAdvanceCancelled) return;
    if (autoAdvanceSeconds === 0) {
      handleTriggerHandoff();
      return;
    }

    const timer = setTimeout(() => {
      setAutoAdvanceSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoAdvanceSeconds, isAutoAdvanceCancelled, handleTriggerHandoff]);

  // Audio narration trigger on beat change while playing
  useEffect(() => {
    if (isPlaying && !isVoiceMuted) {
      if (lastSpokenBeatIdRef.current !== currentBeat.id) {
        lastSpokenBeatIdRef.current = currentBeat.id;
        speakBeatNarration(currentBeat);
      }
    }
  }, [currentBeat, isPlaying, isVoiceMuted, speakBeatNarration]);

  // Time format helper
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = (currentTimeMs / TOTAL_GROVER_DURATION_MS) * 100;

  // ── Beat T1 Visual State Calculations (Deterministic) ─────────────────────
  // Beat T1 duration: 0 - 40,000ms
  // Sub-stages in T1:
  // 0s-10s: Setup 4 closed boxes
  // 10s-18s: Inspect box 00 (empty)
  // 18s-26s: Inspect box 01 (empty)
  // 26s-34s: Inspect box 10 (empty)
  // 34s-40s: Reveal box 11 (prize!)
  const t1CheckedBoxes = useMemo(() => {
    if (currentTimeMs < 10000) return [];
    if (currentTimeMs < 18000) return ['00'];
    if (currentTimeMs < 26000) return ['00', '01'];
    if (currentTimeMs < 34000) return ['00', '01', '10'];
    return ['00', '01', '10', '11'];
  }, [currentTimeMs]);

  const t1ActiveBox = useMemo(() => {
    if (currentTimeMs >= 10000 && currentTimeMs < 18000) return '00';
    if (currentTimeMs >= 18000 && currentTimeMs < 26000) return '01';
    if (currentTimeMs >= 26000 && currentTimeMs < 34000) return '10';
    if (currentTimeMs >= 34000 && currentTimeMs < 40000) return '11';
    return null;
  }, [currentTimeMs]);

  const t1IsPrizeRevealed = currentTimeMs >= 34000;

  return (
    <div className={`grover-presenter-stage ${className}`} data-testid="grover-theory-presenter">
      {/* Top Header */}
      <header className="grover-presenter-header">
        <div className="grover-presenter-brand">
          <span className="grover-brand-badge">THEORY MODULE 08</span>
          <span className="grover-brand-title">Grover's Search Algorithm — Masterclass</span>
        </div>
        <div className="grover-header-actions">
          {onLaunchWorkbench && (
            <button
              className="grover-launch-btn"
              onClick={onLaunchWorkbench}
              data-testid="quick-launch-lab-btn"
            >
              <Zap size={14} />
              <span>Jump to Lab</span>
            </button>
          )}
          {onNavigateBack && (
            <button className="grover-back-btn" onClick={onNavigateBack}>
              Exit to Academy
            </button>
          )}
        </div>
      </header>

      {/* Main Canvas Viewport (16:9 Aspect Ratio) */}
      <div className="grover-canvas-viewport">
        {/* Dynamic KaTeX Math Header */}
        <div className="grover-math-pill-wrapper">
          <div className="grover-math-pill" data-testid="grover-math-pill">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {`$$${currentBeat.katex}$$`}
            </ReactMarkdown>
          </div>
        </div>

        {/* Central Stage Visual Content */}
        <div className="grover-stage-center">
          {currentBeat.id === 'T1' && (
            <div className="grover-beat-t1-view" data-testid="beat-t1-view">
              <div className="grover-beat-banner">
                <span className="beat-pill">BEAT 1 OF 6</span>
                <h2 className="beat-heading">{currentBeat.title}</h2>
                <p className="beat-subheading">{currentBeat.subtitle}</p>
              </div>

              {/* Shared Box Strip Component */}
              <GroverBoxStrip
                checkedBoxes={t1CheckedBoxes}
                activeBox={t1ActiveBox}
                markedBox="11"
                isPrizeRevealed={t1IsPrizeRevealed}
                mode="classical"
              />

              <div className="grover-complexity-callout">
                <div className="callout-metric">
                  <span className="metric-label">Worst-Case Checks:</span>
                  <span className="metric-val">4 lookups (N)</span>
                </div>
                <div className="callout-divider" />
                <div className="callout-metric">
                  <span className="metric-label">Average Classical Checks:</span>
                  <span className="metric-val">2 lookups (N/2)</span>
                </div>
                <div className="callout-divider" />
                <div className="callout-metric highlight">
                  <span className="metric-label">Quantum Grover:</span>
                  <span className="metric-val highlight">1 iteration (O(√N))</span>
                </div>
              </div>
            </div>
          )}

          {currentBeat.id === 'T2' && (
            <div className="grover-beat-t2-view" data-testid="beat-t2-view">
              <div className="grover-beat-banner">
                <span className="beat-pill">BEAT 2 OF 6</span>
                <h2 className="beat-heading">{currentBeat.title}</h2>
                <p className="beat-subheading">{currentBeat.subtitle}</p>
              </div>

              <GroverAmplitudeBars
                amplitudes={[0.5, 0.5, 0.5, 0.5]}
                formulaStep={currentTimeMs >= 65000 ? 2 : 1}
              />
            </div>
          )}

          {currentBeat.id === 'T3' && (
            <div className="grover-beat-t3-view" data-testid="beat-t3-view">
              <div className="grover-beat-banner">
                <span className="beat-pill">BEAT 3 OF 6</span>
                <h2 className="beat-heading">{currentBeat.title}</h2>
                <p className="beat-subheading">{currentBeat.subtitle}</p>
              </div>

              <GroverAmplitudeBars
                amplitudes={[0.5, 0.5, 0.5, -0.5]}
                formulaStep={2}
              />
            </div>
          )}

          {currentBeat.id === 'T4' && (
            <div className="grover-beat-t4-view" data-testid="beat-t4-view">
              <div className="grover-beat-banner">
                <span className="beat-pill">BEAT 4 OF 6</span>
                <h2 className="beat-heading">{currentBeat.title}</h2>
                <p className="beat-subheading">{currentBeat.subtitle}</p>
              </div>

              <GroverAmplitudeBars
                amplitudes={
                  currentTimeMs < 180000
                    ? [0.5, 0.5, 0.5, -0.5]
                    : [0.0, 0.0, 0.0, 1.0]
                }
                mean={0.25}
                showReflectionArrows={currentTimeMs < 180000}
                isReflecting={currentTimeMs >= 180000}
                formulaStep={2}
              />
            </div>
          )}

          {currentBeat.id === 'T5' && (
            <div className="grover-beat-t5-view" data-testid="beat-t5-view">
              <div className="grover-beat-banner">
                <span className="beat-pill">BEAT 5 OF 6</span>
                <h2 className="beat-heading">{currentBeat.title}</h2>
                <p className="beat-subheading">{currentBeat.subtitle}</p>
              </div>

              <GroverCompass
                angleDeg={
                  currentTimeMs < 235000
                    ? 30
                    : currentTimeMs < 252000
                    ? 90
                    : 150
                }
                targetProbability={
                  currentTimeMs < 235000
                    ? 25
                    : currentTimeMs < 252000
                    ? 100
                    : 25
                }
                iterationRound={
                  currentTimeMs < 235000
                    ? 0
                    : currentTimeMs < 252000
                    ? 1
                    : 2
                }
              />
            </div>
          )}

          {currentBeat.id === 'T6' && (
            <div className="grover-beat-t6-view" data-testid="beat-t6-view">
              <div className="grover-beat-banner">
                <span className="beat-pill">BEAT 6 OF 6</span>
                <h2 className="beat-heading">{currentBeat.title}</h2>
                <p className="beat-subheading">{currentBeat.subtitle}</p>
              </div>

              <div className="t6-content-grid">
                {/* Quadratic Scaling Law Table */}
                <div className="t6-scaling-card">
                  <span className="t6-card-title">Quadratic Speedup Scaling Law</span>
                  <table className="t6-table">
                    <thead>
                      <tr>
                        <th>Database Size (N)</th>
                        <th>Classical O(N)</th>
                        <th>Grover O(√N)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>4 items (2 qubits)</td>
                        <td>4 checks</td>
                        <td><strong>1 iteration</strong></td>
                      </tr>
                      <tr>
                        <td>1,000,000 items</td>
                        <td>500,000 checks</td>
                        <td>~785 queries</td>
                      </tr>
                      <tr className="highlight">
                        <td>AES-128 Keyspace</td>
                        <td>2¹²⁸ operations</td>
                        <td>2⁶⁴ operations (Halved)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* What Grover is NOT Checklist */}
                <div className="t6-misconceptions-card">
                  <span className="t6-card-title">What Grover is NOT (Tripwires)</span>
                  <div className="t6-misconception-item">
                    <span className="t6-item-x">✕</span>
                    <span><strong>Not Exponential:</strong> Quadratic speedup (√N), not exponential 2ⁿ speedup.</span>
                  </div>
                  <div className="t6-misconception-item">
                    <span className="t6-item-x">✕</span>
                    <span><strong>Does Not Replace Binary Search:</strong> Classical sorted search is O(log N). Grover is for unsorted verification.</span>
                  </div>
                  <div className="t6-misconception-item">
                    <span className="t6-item-x">✕</span>
                    <span><strong>Needs Oracle Circuit:</strong> Requires an evaluatable black-box condition, not magic access to raw memory.</span>
                  </div>
                </div>
              </div>

              {/* Handoff Card to Practical Lab */}
              <div className="t6-handoff-banner" data-testid="t6-handoff-card">
                <div className="t6-handoff-info">
                  <span className="t6-handoff-pill">PHASE COMPLETE</span>
                  <h3 className="t6-handoff-heading">Theoretical Masterclass Complete</h3>
                  <p className="t6-handoff-desc">
                    Ready to build the circuit yourself? Transition directly into the Quantum Workbench with the Grover target payload.
                  </p>
                  {autoAdvanceSeconds !== null && !isAutoAdvanceCancelled && (
                    <div
                      className="t6-autoadvance-notice"
                      data-testid="t6-autoadvance-banner"
                      style={{
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(0, 242, 255, 0.1)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 242, 255, 0.3)',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#00f2ff', fontWeight: 600 }}>
                        Opening Quantum Lab in {autoAdvanceSeconds}s...
                      </span>
                      <button
                        type="button"
                        className="t6-cancel-btn"
                        onClick={() => {
                          setIsAutoAdvanceCancelled(true);
                          setAutoAdvanceSeconds(null);
                        }}
                        data-testid="stay-here-btn"
                        style={{
                          background: 'rgba(255, 255, 255, 0.12)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '4px',
                          color: '#ffffff',
                          padding: '2px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Stay here
                      </button>
                    </div>
                  )}
                </div>
                {onLaunchWorkbench && (
                  <button
                    className="t6-handoff-action-btn primary-cta"
                    onClick={handleTriggerHandoff}
                    data-testid="launch-workbench-handoff-btn"
                  >
                    <span>Open Quantum Lab</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* In-Video Narration Subtitle Banner */}
        <div className="grover-caption-container" data-testid="grover-captions">
          <div className="grover-caption-pill">
            <div className="caption-speaker">
              <Sparkles size={14} className="sparkle-icon" />
              <span>Erwin</span>
            </div>
            <p className="caption-text">{currentBeat.narration}</p>
          </div>
        </div>
      </div>

      {/* Scrubber & Playback Controls Bar */}
      <div className="grover-controls-panel">
        {/* Scrubber Track */}
        <div
          className="grover-scrubber-track"
          onClick={handleScrubberClick}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
          tabIndex={0}
          data-testid="grover-scrubber"
        >
          <div className="grover-scrubber-fill" style={{ width: `${progressPct}%` }} />
          {GROVER_BEATS.map((beat) => (
            <div
              key={beat.id}
              className={`grover-scrubber-beat-node ${
                currentTimeMs >= beat.startMs ? 'active' : ''
              }`}
              style={{ left: `${(beat.startMs / TOTAL_GROVER_DURATION_MS) * 100}%` }}
              title={`${beat.id}: ${beat.title}`}
              onClick={(e) => {
                e.stopPropagation();
                seekTo(beat.startMs);
              }}
            >
              <span className="node-tooltip">{beat.id}</span>
            </div>
          ))}
        </div>

        {/* Buttons Row */}
        <div className="grover-controls-row">
          <div className="controls-left">
            <button
              className="ctrl-btn play-pause-btn"
              onClick={togglePlay}
              data-testid="play-pause-btn"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
            </button>

            <button
              className="ctrl-btn"
              onClick={() => seekTo(0)}
              data-testid="restart-btn"
              aria-label="Restart Lesson"
            >
              <RotateCcw size={16} />
            </button>

            <button
              className={`ctrl-btn ${isVoiceMuted ? 'muted' : ''}`}
              onClick={toggleVoiceMute}
              data-testid="voice-toggle-btn"
              aria-label={isVoiceMuted ? 'Unmute' : 'Mute'}
            >
              {isVoiceMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isVoiceMuted ? 'Muted' : 'Voice'}</span>
            </button>

            <button
              className={`ctrl-btn elevenlabs-studio-btn ${defaultSpeechService.hasApiKey() ? 'active' : ''}`}
              onClick={() => setShowVoiceModal(true)}
              data-testid="elevenlabs-settings-btn"
              title="ElevenLabs Voice Studio"
            >
              <Zap size={14} className={defaultSpeechService.hasApiKey() ? 'text-cyan' : ''} />
              <span>{defaultSpeechService.hasApiKey() ? '⚡ ElevenLabs' : 'Voice Studio'}</span>
            </button>

            <div className="time-display" data-testid="time-display">
              <span className="current-time">{formatTime(currentTimeMs)}</span>
              <span className="time-divider">/</span>
              <span className="total-time">{formatTime(TOTAL_GROVER_DURATION_MS)}</span>
            </div>
          </div>

          {/* Beat Selector Pills */}
          <div className="controls-center beat-selectors">
            {GROVER_BEATS.map((beat) => (
              <button
                key={beat.id}
                className={`beat-chip ${currentBeat.id === beat.id ? 'active' : ''}`}
                onClick={() => seekTo(beat.startMs)}
                data-testid={`seek-${beat.id.toLowerCase()}-btn`}
              >
                {beat.id}
              </button>
            ))}
          </div>

          <div className="controls-right">
            {onLaunchWorkbench && (
              <button
                className="ctrl-btn launch-lab-btn"
                onClick={onLaunchWorkbench}
                data-testid="footer-launch-lab-btn"
              >
                <span>Practical Lab</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ElevenLabs Voice Studio Modal */}
      {showVoiceModal && (
        <div className="grover-modal-backdrop" onClick={() => setShowVoiceModal(false)}>
          <div className="grover-voice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voice-modal-header">
              <div className="voice-modal-title-group">
                <div className="voice-modal-icon">
                  <Zap size={20} color="#00f2ff" />
                </div>
                <div>
                  <h3 className="voice-modal-title">ElevenLabs Voice Studio</h3>
                  <p className="voice-modal-subtitle">AI-powered neural voice narration for Erwin the Quantum Cat</p>
                </div>
              </div>
              <button
                className="voice-modal-close-btn"
                onClick={() => setShowVoiceModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="voice-modal-body">
              {/* Status Banner */}
              <div className={`voice-status-banner ${elevenLabsApiKey.trim() ? 'connected' : 'fallback'}`}>
                <div className="status-dot" />
                <span>
                  {elevenLabsApiKey.trim()
                    ? 'ElevenLabs Neural Speech Connected (eleven_turbo_v2_5)'
                    : 'Web Speech API Fallback Active (Provide API Key below for ultra-realistic Erwin voice)'}
                </span>
              </div>

              {/* API Key Input */}
              <div className="voice-form-group">
                <label className="voice-form-label">
                  <span>ElevenLabs API Key</span>
                  <a
                    href="https://elevenlabs.io"
                    target="_blank"
                    rel="noreferrer"
                    className="get-key-link"
                  >
                    <span>Get Key</span>
                    <ExternalLink size={12} />
                  </a>
                </label>
                <input
                  type="password"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  placeholder="xi-api-key..."
                  className="voice-input"
                  data-testid="elevenlabs-api-key-input"
                />
              </div>

              {/* Voice Selector */}
              <div className="voice-form-group">
                <label className="voice-form-label">Speaker Voice</label>
                <div className="voice-grid">
                  {ELEVENLABS_VOICES.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`voice-card ${selectedVoiceId === v.id ? 'selected' : ''}`}
                      onClick={() => setSelectedVoiceId(v.id)}
                    >
                      <div className="voice-card-name">
                        <span>{v.name}</span>
                        {v.id === 'pNInz6obpgDQGcFmaJgB' && <span className="default-pill">Erwin</span>}
                      </div>
                      <span className="voice-card-desc">{v.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Voice Action */}
              <div className="voice-test-row">
                <button
                  type="button"
                  className="voice-test-btn"
                  onClick={async () => {
                    setIsTestingSpeech(true);
                    setTestSpeechStatus('Generating test audio with ElevenLabs...');
                    try {
                      defaultSpeechService.setApiKey(elevenLabsApiKey);
                      defaultSpeechService.setVoiceId(selectedVoiceId);
                      await defaultSpeechService.speak(
                        'Welcome to Grover\'s Algorithm. I am Erwin, your quantum mentor. Let\'s amplify the amplitudes.',
                        { rate: 1.0, pitch: 1.0 }
                      );
                      setTestSpeechStatus('Playing test audio.');
                    } catch (err) {
                      setTestSpeechStatus('Audio error: Check API key.');
                    } finally {
                      setIsTestingSpeech(false);
                    }
                  }}
                  disabled={isTestingSpeech}
                  data-testid="elevenlabs-test-voice-btn"
                >
                  <Volume2 size={16} />
                  <span>{isTestingSpeech ? 'Testing...' : 'Test Erwin Voice'}</span>
                </button>
                {testSpeechStatus && <span className="voice-test-status">{testSpeechStatus}</span>}
              </div>
            </div>

            <div className="voice-modal-footer">
              <button
                className="voice-save-btn"
                onClick={() => {
                  defaultSpeechService.setApiKey(elevenLabsApiKey);
                  defaultSpeechService.setVoiceId(selectedVoiceId);
                  setIsApiKeySaved(true);
                  setTimeout(() => {
                    setIsApiKeySaved(false);
                    setShowVoiceModal(false);
                  }, 600);
                }}
                data-testid="elevenlabs-save-config-btn"
              >
                {isApiKeySaved ? (
                  <>
                    <Check size={16} />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

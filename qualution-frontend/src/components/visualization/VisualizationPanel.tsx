import React, { useState, useEffect, useMemo } from 'react';
import type { CircuitRequest, CircuitRunResponse, Gate, UnifiedExecutionResult } from '../../features/circuit/types';
import { toVisualizationPayload } from '../../features/circuit/resultNormalizer';
import type { ExecutionState } from '../../features/circuit/executionState';
import { ProbabilityHistogram } from './ProbabilityHistogram';
import { StatevectorView } from './StatevectorView';
import { BlochSphere } from './BlochSphere';
import { TimelineView } from './TimelineView';
import { MetricsView } from './MetricsView';
import { LearningPanel } from './LearningPanel';
import { QSphereView } from './QSphereView';
import { PhaseDiskView } from './PhaseDiskView';
import {
  BarChart3,
  Binary,
  Globe,
  Layers,
  Gauge,
  GraduationCap,
  Bot,
  AlertCircle,
  Clock,
  Sparkles,
  Orbit,
  PieChart,
} from 'lucide-react';
import './VisualizationPanel.css';

export type VisualizationTab =
  | 'results'
  | 'state'
  | 'qsphere'
  | 'bloch'
  | 'phase'
  | 'timeline'
  | 'metrics'
  | 'learn'
  | 'tutor';

interface VisualizationPanelProps {
  circuit: CircuitRequest;
  simulationResult: CircuitRunResponse | UnifiedExecutionResult | null;
  executionState: ExecutionState;
  qubitCount: number;
  selectedGate: Gate | null;
  activeTab?: VisualizationTab;
  onSelectTab?: (tab: VisualizationTab) => void;
  onSelectGate?: (gateId: string | null) => void;
  onSelectGateByTimelineStep?: (operation: string, qubits: number[]) => void;
  onRetryRun?: () => void;
  selectedTimelineStepIdx?: number;
  onTimelineStepChange?: (stepIdx: number) => void;
  onOpenOptimize?: () => void;
}

export const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  circuit,
  simulationResult,
  executionState,
  qubitCount,
  selectedGate,
  activeTab: controlledActiveTab,
  onSelectTab: controlledOnSelectTab,
  onSelectGate,
  onSelectGateByTimelineStep,
  onRetryRun,
  selectedTimelineStepIdx: controlledStepIdx,
  onTimelineStepChange: controlledOnStepChange,
  onOpenOptimize,
}) => {
  const [internalTab, setInternalTab] = useState<VisualizationTab>('results');
  const [internalStepIdx, setInternalStepIdx] = useState<number>(0);

  // Normalize incoming simulationResult so views consume ONLY the normalized shape
  const sim: CircuitRunResponse | null = useMemo(() => {
    if (!simulationResult) return null;
    if ('qubit_count' in simulationResult && !('simulation' in simulationResult)) {
      return toVisualizationPayload(simulationResult as UnifiedExecutionResult, circuit);
    }
    return simulationResult as CircuitRunResponse;
  }, [simulationResult, circuit]);

  // Sync stepIdx when new simulation result arrives
  useEffect(() => {
    if (sim?.visualization?.timeline?.steps) {
      const lastIdx = sim.visualization.timeline.steps.length - 1;
      setInternalStepIdx(lastIdx);
      if (controlledOnStepChange) {
        controlledOnStepChange(lastIdx);
      }
    }
  }, [sim, controlledOnStepChange]);

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalTab;
  const setActiveTab = (tab: VisualizationTab) => {
    if (controlledOnSelectTab) {
      controlledOnSelectTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const selectedTimelineStepIdx = controlledStepIdx !== undefined ? controlledStepIdx : internalStepIdx;
  const handleTimelineStepChange = (idx: number) => {
    if (controlledOnStepChange) {
      controlledOnStepChange(idx);
    } else {
      setInternalStepIdx(idx);
    }
  };

  const isRunning = executionState.status === 'running';
  const error = executionState.latestError;
  const effectiveQubits = sim ? sim.circuit.qubits : qubitCount;

  // Active step data from timeline if available
  const timelineSteps = sim?.visualization?.timeline?.steps;
  const activeTimelineStep = timelineSteps && timelineSteps[selectedTimelineStepIdx]
    ? timelineSteps[selectedTimelineStepIdx]
    : null;

  // Derive active Statevector and Probabilities driven by selected timeline step
  const activeStatevector = activeTimelineStep?.statevector ?? sim?.simulation?.statevector ?? null;
  const activeProbabilities = activeTimelineStep?.probabilities ?? sim?.simulation?.probabilities ?? {};

  // For Bloch: active step's bloch/bloch_qubits or latest simulation result
  const activeBloch = activeTimelineStep?.bloch ?? sim?.visualization?.bloch ?? null;
  const activeBlochQubits = activeTimelineStep?.bloch_qubits ?? sim?.visualization?.bloch_qubits ?? null;

  return (
    <div className="qualution-viz-panel" data-testid="visualization-panel">
      {/* Panel Header & Navigation Tabs */}
      <div className="viz-panel-header">
        <div className="viz-tabs-row" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'results'}
            className={`viz-tab-btn tab-teal ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
            data-testid="tab-results"
          >
            <BarChart3 size={12} />
            <span>Results</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'state'}
            className={`viz-tab-btn tab-violet ${activeTab === 'state' ? 'active' : ''}`}
            onClick={() => setActiveTab('state')}
            data-testid="tab-state"
          >
            <Binary size={12} />
            <span>State</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'qsphere'}
            className={`viz-tab-btn tab-violet ${activeTab === 'qsphere' ? 'active' : ''}`}
            onClick={() => setActiveTab('qsphere')}
            data-testid="tab-qsphere"
          >
            <Orbit size={12} />
            <span>Q-Sphere</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'bloch'}
            className={`viz-tab-btn tab-violet ${activeTab === 'bloch' ? 'active' : ''}`}
            onClick={() => setActiveTab('bloch')}
            data-testid="tab-bloch"
          >
            <Globe size={12} />
            <span>Bloch</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'phase'}
            className={`viz-tab-btn tab-violet ${activeTab === 'phase' ? 'active' : ''}`}
            onClick={() => setActiveTab('phase')}
            data-testid="tab-phase"
          >
            <PieChart size={12} />
            <span>Phase</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'timeline'}
            className={`viz-tab-btn tab-violet ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
            data-testid="tab-timeline"
          >
            <Layers size={12} />
            <span>Timeline</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'metrics'}
            className={`viz-tab-btn tab-teal ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
            data-testid="tab-metrics"
          >
            <Gauge size={12} />
            <span>Metrics</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'learn'}
            className={`viz-tab-btn learn tab-violet ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
            data-testid="tab-learn"
          >
            <GraduationCap size={12} />
            <span>Learn</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Viewport */}
      <div className="viz-panel-content" data-testid="viz-panel-content">
        {/* Error Banner with Categorized Message and Retry */}
        {error && (
          <div className="viz-alert-banner error" role="alert" data-testid="viz-error-banner">
            <AlertCircle size={16} className="alert-icon" />
            <div className="alert-body">
              <span className="alert-title">
                {executionState.errorCategory
                  ? `${executionState.errorCategory.toUpperCase()} Error`
                  : 'Simulation Error'}
              </span>
              <span className="alert-msg">{error}</span>
            </div>
            {onRetryRun && (
              <button
                type="button"
                className="btn-alert-retry"
                onClick={onRetryRun}
                data-testid="viz-error-retry-btn"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Phase-Driven Execution Loader */}
        {isRunning && (
          <div className="viz-loading-container" data-testid="viz-loading">
            <div className="quantum-pulse-loader" />
            <span className="loading-text">
              {executionState.phase === 'validating'
                ? 'Validating quantum circuit...'
                : executionState.phase === 'selecting_backend'
                ? 'Selecting optimal backend routing...'
                : executionState.phase === 'simulating'
                ? 'Simulating unitary evolution...'
                : executionState.phase === 'computing_state'
                ? 'Computing statevector & amplitudes...'
                : executionState.phase === 'preparing_visualizations'
                ? 'Preparing visualization data...'
                : 'Simulating quantum circuit...'}
            </span>
            <span className="loading-subtext">Executing on FastAPI backend engine</span>
          </div>
        )}



        {/* 5. Metrics Tab (Always accessible - fallback to static frontend metrics if no run yet) */}
        {activeTab === 'metrics' && (
          <div className="tab-pane" data-testid="pane-metrics">
            <MetricsView
              metrics={
                sim?.metrics || {
                  qubit_count: circuit.qubits,
                  classical_bit_count: circuit.classical_bits,
                  gate_count: circuit.gates.length,
                  depth: circuit.gates.reduce((m, g) => Math.max(m, (g.column ?? 0) + 1), 0),
                  single_qubit_gate_count: circuit.gates.filter((g) => g.targets.length === 1).length,
                  two_qubit_gate_count: circuit.gates.filter((g) => g.targets.length > 1).length,
                  rotation_gate_count: circuit.gates.filter((g) => ['rx', 'ry', 'rz', 'p'].includes(g.gate.toLowerCase())).length,
                  measurement_count: circuit.measure ? circuit.qubits : 0,
                  two_qubit_gate_ratio: circuit.gates.length > 0 ? circuit.gates.filter((g) => g.targets.length > 1).length / circuit.gates.length : 0,
                  statevector_amplitudes: Math.pow(2, circuit.qubits),
                  statevector_memory_bytes: Math.pow(2, circuit.qubits) * 16,
                  statevector_memory_mb: (Math.pow(2, circuit.qubits) * 16) / (1024 * 1024),
                  statevector_memory_gb: (Math.pow(2, circuit.qubits) * 16) / (1024 * 1024 * 1024),
                  simulation_memory_class: circuit.qubits <= 16 ? 'Lightweight desktop simulation' : 'High-memory simulation',
                }
              }
              routing={sim?.routing}
              executionTimeMs={sim?.execution_time_ms ?? 0}
            />
          </div>
        )}

        {/* Learn Tab */}
        {activeTab === 'learn' && (
          <div className="tab-pane" data-testid="pane-learn">
            <LearningPanel
              circuit={circuit}
              simulationResult={sim}
              selectedGate={selectedGate}
              onSelectTab={(tab) => setActiveTab(tab)}
            />
          </div>
        )}


        {/* Empty States for Simulation-dependent tabs */}
        {!isRunning && !error && !sim && (
          <>
            {activeTab === 'results' && (
              <div className="viz-empty-state" data-testid="viz-empty-state">
                <Sparkles size={32} className="empty-sparkle-icon" />
                <span className="empty-title">No Simulation Results Yet</span>
                <p className="empty-desc">
                  Build a circuit and press <strong>Run Circuit</strong> (or <kbd>Ctrl+Enter</kbd>) to observe measurement distributions.
                </p>
              </div>
            )}

            {activeTab === 'state' && (
              <div className="viz-empty-state" data-testid="viz-empty-state-state">
                <Binary size={32} className="empty-sparkle-icon" />
                <span className="empty-title">Statevector Unavailable</span>
                <p className="empty-desc">
                  Run the circuit to calculate the exact quantum statevector amplitudes and Dirac representation.
                </p>
              </div>
            )}

            {activeTab === 'bloch' && (
              <div className="viz-empty-state" data-testid="viz-empty-state-bloch">
                <Globe size={32} className="empty-sparkle-icon" />
                <span className="empty-title">Bloch Sphere Ready</span>
                <p className="empty-desc">
                  {circuit.qubits === 1
                    ? 'Run the single-qubit circuit to project the state onto the 3D Bloch sphere.'
                    : 'Bloch sphere represents single-qubit states. For multi-qubit entangled states, inspect the State or Timeline tabs.'}
                </p>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="viz-empty-state" data-testid="viz-empty-state-timeline">
                <Layers size={32} className="empty-sparkle-icon" />
                <span className="empty-title">No Execution Timeline</span>
                <p className="empty-desc">
                  Run the circuit to step gate-by-gate and inspect state evolution at each step.
                </p>
              </div>
            )}
          </>
        )}

        {/* Active Content when Results available (for simulation-dependent tabs) */}
        {!isRunning && sim && (
          <>
            {/* 1. Results Tab: Detailed Status & Measurement Histogram (Synchronized with Timeline step when exploring) */}
            {activeTab === 'results' && (
              <div className="tab-pane" data-testid="pane-results">
                <div className="results-summary-strip">
                  <div className="strip-item">
                    <span className="strip-lbl">Backend:</span>
                    <span className="strip-val">{sim.simulation.backend}</span>
                  </div>
                  <div className="strip-item">
                    <Clock size={11} color="var(--accent-cyan)" />
                    <span className="strip-val">{sim.simulation.execution_time_ms} ms</span>
                  </div>
                  <div className="strip-item">
                    <span className="strip-lbl">Shots:</span>
                    <span className="strip-val">{sim.simulation.shots.toLocaleString()}</span>
                  </div>
                  <div className="strip-item">
                    <span className="strip-lbl">Depth:</span>
                    <span className="strip-val">{sim.circuit.gate_count > 0 ? (sim.metrics?.depth ?? 1) : 0}</span>
                  </div>
                  <div className="strip-item">
                    <span className="strip-lbl">Gates:</span>
                    <span className="strip-val">{sim.circuit.gate_count}</span>
                  </div>
                </div>

                <div className="results-context-subbar">
                  <span className="context-title">
                    {activeTimelineStep && timelineSteps && timelineSteps.length > 1 && selectedTimelineStepIdx < timelineSteps.length - 1
                      ? `Timeline Step ${activeTimelineStep.step} State (${activeTimelineStep.operation.toUpperCase()})`
                      : 'Final Circuit Measurement & Probability Distribution'}
                  </span>
                </div>

                <ProbabilityHistogram
                  probabilities={activeProbabilities}
                  counts={
                    activeTimelineStep && timelineSteps && selectedTimelineStepIdx < timelineSteps.length - 1
                      ? undefined
                      : sim.simulation.counts
                  }
                  totalShots={
                    activeTimelineStep && timelineSteps && selectedTimelineStepIdx < timelineSteps.length - 1
                      ? undefined
                      : sim.simulation.shots
                  }
                />
              </div>
            )}

            {/* 2. State Tab: Exact Statevector Amplitudes driven by Timeline */}
            {activeTab === 'state' && (
              <div className="tab-pane" data-testid="pane-state">
                <div className="results-context-subbar">
                  <span className="context-title">
                    {activeTimelineStep && timelineSteps && timelineSteps.length > 1
                      ? `Statevector at Step ${activeTimelineStep.step} (${activeTimelineStep.step === 0 ? 'Init' : activeTimelineStep.operation.toUpperCase()})`
                      : 'Final Statevector Amplitudes'}
                  </span>
                </div>

                {activeStatevector ? (
                  <StatevectorView
                    statevector={activeStatevector}
                    probabilities={activeProbabilities}
                  />
                ) : (
                  <div className="state-fallback-notice">
                    <span>
                      Statevector was simulated in shot-measurement mode.
                      Exact probability distributions are shown below:
                    </span>
                    <ProbabilityHistogram
                      probabilities={activeProbabilities}
                      counts={sim.simulation.counts}
                      totalShots={sim.simulation.shots}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Q-Sphere Tab: Multi-qubit spherical amplitudes */}
            {activeTab === 'qsphere' && (
              <div className="tab-pane" data-testid="pane-qsphere">
                <QSphereView
                  statevector={activeStatevector}
                  probabilities={activeProbabilities}
                  qubitCount={effectiveQubits}
                />
              </div>
            )}

            {/* 3. Bloch Tab: 3D Bloch Sphere per-qubit views with trajectory and timeline synchronization */}
            {activeTab === 'bloch' && (
              <div className="tab-pane" data-testid="pane-bloch">
                <div className="results-context-subbar">
                  <span className="context-title">
                    {activeTimelineStep
                      ? `Bloch State at Step ${activeTimelineStep.step} (${activeTimelineStep.step === 0 ? 'Init' : activeTimelineStep.operation.toUpperCase()})`
                      : 'Bloch State'}
                  </span>
                </div>

                <BlochSphere
                  bloch={activeBloch}
                  blochQubits={activeBlochQubits}
                  qubitCount={effectiveQubits}
                  stepInfo={activeTimelineStep ? {
                    step: activeTimelineStep.step,
                    operation: activeTimelineStep.operation,
                    qubits: activeTimelineStep.qubits,
                  } : null}
                  timelineSteps={timelineSteps}
                />
              </div>
            )}

            {/* Phase Disk Tab: Per-qubit relative phase angles */}
            {activeTab === 'phase' && (
              <div className="tab-pane" data-testid="pane-phase">
                <PhaseDiskView
                  statevector={activeStatevector}
                  qubitCount={effectiveQubits}
                  stepIndex={activeTimelineStep ? activeTimelineStep.step : 0}
                />
              </div>
            )}

            {/* 4. Timeline Tab: Gate-by-gate progression with playback & synchronization */}
            {activeTab === 'timeline' && (
              <div className="tab-pane" data-testid="pane-timeline">
                {sim.visualization.timeline ? (
                  <TimelineView
                    timeline={sim.visualization.timeline}
                    selectedStepIdx={selectedTimelineStepIdx}
                    onStepChange={handleTimelineStepChange}
                    onSelectGateByTimelineStep={onSelectGateByTimelineStep}
                  />
                ) : (
                  <div className="timeline-empty-notice">
                    <span>
                      {sim.visualization.timeline_notice ||
                        'Timeline data is generated on execution. Click Run to populate step states.'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

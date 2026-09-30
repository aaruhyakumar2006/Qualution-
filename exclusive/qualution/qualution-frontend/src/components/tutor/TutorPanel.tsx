import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { CircuitRequest, CircuitRunResponse, Gate } from '../../features/circuit/types';
import type { TutorMode, TutorMessage, TutorAction, LearningLevel } from '../../features/tutor/tutorTypes';
import { buildTutorContext } from '../../features/tutor/contextBuilder';
import { extractQuantumFacts } from '../../features/tutor/quantumFacts';
import { answerTutorQuestion, streamTutorQuestion } from '../../features/tutor/tutorEngine';
import { progressService } from '../../features/progress/progressService';
import type { TeachingController } from '../../features/teaching/teachingController';
import type { TeachingControllerState } from '../../features/teaching/types';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { defaultSpeechService, ELEVENLABS_VOICES } from '../../features/teaching/speechService';
import { resolveCircuitRouting } from '../../features/circuit/executionRouter';
import { generateGroverTutorInsights } from '../../features/teaching/lessons/sprint-02/groverVerification';
import {
  Bot,
  Sparkles,
  HelpCircle,
  Bug,
  Compass,
  FlaskConical,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  Zap,
  Sliders,
  BookOpen,
  ArrowRight,
  Layers,
  ArrowUp,
  Plus,
  Volume2,
  Lightbulb,
  XCircle,
  X,
  Wand2,
  User,
} from 'lucide-react';
import './TutorPanel.css';

export const SPRINT_1_SEQUENCE = [
  's1-initialize-measure',
  's1-x-gate',
  's1-hadamard-superposition',
  's1-z-phase',
  's1-gate-ordering',
  's1-single-qubit-challenge',
  's1-assessment',
  's2-bell-state-entanglement',
  'lesson-8-grovers-search',
  's2-grover-search',
];

export interface TutorPanelProps {
  circuit: CircuitRequest;
  simulationResult: CircuitRunResponse | null;
  selectedGate: Gate | null;
  onSelectTab: (tab: 'results' | 'state' | 'bloch' | 'timeline' | 'metrics' | 'learn') => void;
  onSelectGate?: (gateId: string) => void;
  latestError?: string | null;
  onOpenOptimize?: () => void;
  onRunSimulation?: () => void;
  isDocked?: boolean;
  onToggleDock?: () => void;
  onClose?: () => void;
  teachingController?: TeachingController | null;
  teachingState?: TeachingControllerState | null;
  onStartLesson?: (lessonId: string) => void;
  activeLessonId?: string;
}

export const TutorPanel: React.FC<TutorPanelProps> = ({
  circuit,
  simulationResult,
  selectedGate,
  onSelectTab,
  onSelectGate,
  latestError,
  onOpenOptimize,
  onRunSimulation,
  isDocked = false,
  onToggleDock,
  onClose,
  teachingController,
  teachingState: propTeachingState,
  onStartLesson,
  activeLessonId,
}) => {

  const [level, setLevel] = useState<LearningLevel>('beginner');
  const [mode, setMode] = useState<TutorMode>('explain');
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activityStatus, setActivityStatus] = useState<string>('');
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [expandedReasoningMap, setExpandedReasoningMap] = useState<Record<string, boolean>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [predictionInput, setPredictionInput] = useState<string>('');
  const [hasCommittedPrediction, setHasCommittedPrediction] = useState<boolean>(false);
  const [showContextDetails, setShowContextDetails] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const [aiEnvironment, setAiEnvironment] = useState<any>(null);

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
        const res = await fetch(`${baseUrl}/ai/environment`);
        if (res.ok) {
          const data = await res.json();
          setAiEnvironment(data);
        }
      } catch (e) {
        console.warn('Could not fetch AI environment:', e);
      }
    };
    fetchEnv();
  }, []);

  // Teaching Controller Subscription State
  const [internalTeachingState, setInternalTeachingState] = useState<TeachingControllerState | null>(() =>
    teachingController ? teachingController.getState() : null
  );
  const teachingState = propTeachingState !== undefined ? propTeachingState : internalTeachingState;

  // ElevenLabs Voice Settings State
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [voiceApiKey, setVoiceApiKey] = useState<string>(() => defaultSpeechService.getApiKey() || '');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => defaultSpeechService.getVoiceId());
  const [voiceSaveStatus, setVoiceSaveStatus] = useState<string>('');
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  const handleSaveVoiceSettings = () => {
    defaultSpeechService.setApiKey(voiceApiKey);
    defaultSpeechService.setVoiceId(selectedVoiceId);
    setVoiceSaveStatus('Preferences saved successfully!');
    setTimeout(() => setVoiceSaveStatus(''), 2500);
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    defaultSpeechService.setApiKey(voiceApiKey);
    defaultSpeechService.setVoiceId(selectedVoiceId);
    await defaultSpeechService.speak('Welcome to Qualution Quantum Studio. Neural narration is active.', {
      onEnd: () => setIsTestingVoice(false),
    });
    setIsTestingVoice(false);
  };

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const context = buildTutorContext(circuit, simulationResult, selectedGate, level, latestError, activeLessonId);
  const factSet = extractQuantumFacts(context);

  // Subscribe to Teaching Controller
  useEffect(() => {
    if (!teachingController) return;
    setInternalTeachingState(teachingController.getState());
    const unsubscribe = teachingController.subscribe((next) => {
      setInternalTeachingState(next);
    });
    return unsubscribe;
  }, [teachingController]);

  // Grover's Search Algorithm: Live Real-Run AI Tutor Insights
  const isGroverLesson = teachingState?.activeLesson?.id === 'lesson-8-grovers-search';
  const isGroverStage4Complete = Boolean(
    isGroverLesson &&
    ((teachingState?.currentStepIndex ?? 0) >= 4 || teachingState?.status === 'COMPLETED')
  );

  const groverRouting = useMemo(() => {
    return simulationResult?.routing || resolveCircuitRouting(circuit, simulationResult?.execution_time_ms || 1.2);
  }, [simulationResult?.routing, simulationResult?.execution_time_ms, circuit]);

  const groverInsights = useMemo(() => {
    return generateGroverTutorInsights(groverRouting, simulationResult?.execution_time_ms || 1.2);
  }, [groverRouting, simulationResult?.execution_time_ms]);

  const simulatorBackend = simulationResult?.routing?.selected_backend || simulationResult?.simulation?.backend || 'Aer';
  const formattedSimulator = useMemo(() => {
    if (simulatorBackend === 'clifford_stabilizer') return 'Stabilizer simulator';
    if (simulatorBackend === 'qiskit_aer') return 'Qiskit Aer simulator';
    if (simulatorBackend === 'statevector') return 'Statevector simulator';
    return `${simulatorBackend} simulator`;
  }, [simulatorBackend]);

  const hasInjectedGroverInsightsRef = useRef<boolean>(false);

  useEffect(() => {
    if (isGroverStage4Complete && !hasInjectedGroverInsightsRef.current) {
      hasInjectedGroverInsightsRef.current = true;

      const newMessages: TutorMessage[] = groverInsights.map((ins, idx) => ({
        id: `msg-grover-insight-${idx}-${Date.now()}`,
        role: 'assistant',
        content: `### 💡 ${ins.title}\n\n${ins.content}`,
        timestamp: Date.now() + idx * 50,
        mode: 'explain',
      }));

      setMessages((prev) => [...prev, ...newMessages]);
    }
  }, [isGroverStage4Complete, groverInsights]);

  // Initial welcome message
  useEffect(() => {
    const welcomeText = factSet.patternName
      ? `Hello! I'm your Quantum Learning Agent. I'm actively analyzing your ${factSet.patternName}. Ask me anything about how the gates work, why certain measurement probabilities appear, or test a "what-if" prediction.`
      : `Hello! I'm your Quantum Learning Agent. Your circuit currently has ${circuit.qubits} qubit(s) and ${circuit.gates.length} gate(s). Ask me how to build, debug, or predict the behavior of your quantum operations.`;

    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: welcomeText,
        timestamp: Date.now(),
        mode: 'explain',
      },
    ]);
  }, [circuit.qubits, circuit.gates.length, factSet.patternName]);

  // Auto-scroll messages stream on update
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activityStatus]);

  const [msgCounter, setMsgCounter] = useState(0);

  const handleAsk = async (questionText?: string, explicitMode?: TutorMode) => {
    const q = (typeof questionText === 'string' && questionText.length > 0)
      ? questionText
      : inputQuestion;
    if (!q || q.trim().length === 0 || isLoading) return;

    const currentMode = explicitMode || mode;
    const userCount = msgCounter + 1;
    const assistantCount = msgCounter + 2;
    setMsgCounter(assistantCount);

    const userMsg: TutorMessage = {
      id: `msg-user-${userCount}`,
      role: 'user',
      content: q,
      timestamp: Date.now(),
      mode: currentMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    if (latestError) {
      setActivityStatus('Diagnosing circuit validation error...');
    } else if (currentMode === 'predict') {
      setActivityStatus('Formulating quantum prediction...');
    } else if (currentMode === 'compare') {
      setActivityStatus('Comparing prediction against simulation results...');
    } else if (currentMode === 'optimize') {
      setActivityStatus('Analyzing circuit depth & unitary equivalence...');
    } else {
      setActivityStatus('Analyzing circuit and Hilbert state space...');
    }

    try {
      let streamedAnswer = '';
      const response = await streamTutorQuestion(
        q,
        context,
        (status) => { if (isMountedRef.current) setActivityStatus(status); },
        (delta) => {
          streamedAnswer += delta;
        }
      );

      if (!isMountedRef.current) return;

      const assistantMsg: TutorMessage = {
        id: `msg-assistant-${assistantCount}`,
        role: 'assistant',
        content: response.answer || response.fallback_answer || streamedAnswer || '',
        timestamp: Date.now(),
        mode: currentMode,
        response,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      const relatedConcepts = factSet.patternName ? ['bell_state', 'superposition'] : ['qubit'];
      progressService.recordActivity(
        'tutor_session',
        relatedConcepts,
        20,
        `Tutor ${currentMode.toUpperCase()}: "${q.slice(0, 32)}..."`
      );
    } catch {
      try {
        const fallbackRes = await answerTutorQuestion(q, context);
        if (!isMountedRef.current) return;
        const assistantMsg: TutorMessage = {
          id: `msg-assistant-${assistantCount}`,
          role: 'assistant',
          content: fallbackRes.answer || '',
          timestamp: Date.now(),
          mode: currentMode,
          response: fallbackRes,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        if (!isMountedRef.current) return;
        const errorMsg: TutorMessage = {
          id: `msg-error-${assistantCount}`,
          role: 'assistant',
          content: 'I encountered an error analyzing your request. My knowledge matrix might be offline.',
          timestamp: Date.now(),
          mode: currentMode,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setActivityStatus('');
      }
    }
  };

  const handleActionClick = (action: TutorAction) => {
    if (action.type === 'open_optimize') {
      if (onOpenOptimize) {
        onOpenOptimize();
        return;
      }
      onSelectTab('metrics');
      return;
    }
    if (action.type === 'predict') {
      setMode('predict');
      return;
    }
    if (action.type === 'compare') {
      setMode('compare');
      return;
    }
    if (action.payload?.tab) {
      onSelectTab(action.payload.tab);
    } else if (action.type === 'open_state') {
      onSelectTab('state');
    } else if (action.type === 'open_bloch') {
      onSelectTab('bloch');
    } else if (action.type === 'open_timeline') {
      onSelectTab('timeline');
    } else if (action.type === 'open_metrics') {
      onSelectTab('metrics');
    } else if (action.type === 'select_gate' || action.type === 'inspect_gate') {
      if (action.payload?.gateId && onSelectGate) {
        onSelectGate(action.payload.gateId);
      }
    }
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoningMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyMessageText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg-cleared',
        role: 'assistant',
        content: 'Conversation reset. How can I assist with your quantum experiment?',
        timestamp: Date.now(),
        mode,
      },
    ]);
  };

  const renderCircuitAwareActions = () => {
    const actions: Array<{ label: string; query: string; mode?: TutorMode }> = [];

    if (selectedGate) {
      const g = selectedGate.gate.toUpperCase();
      const t = selectedGate.targets;
      if (g === 'H') {
        actions.push(
          { label: `What does H on q${t} do?`, query: `What does the Hadamard (H) gate do on wire q${t}?`, mode: 'explain' },
          { label: 'Predict state outcome', query: 'What is the statevector amplitude after this Hadamard gate?', mode: 'predict' },
          { label: 'Explain mathematically', query: 'Explain the H gate unitary transformation matrix and basis change mathematically.', mode: 'explain' }
        );
      } else if (g === 'CX') {
        actions.push(
          { label: 'Explain control vs target', query: 'Explain how the control and target wires interact in this CX gate.', mode: 'explain' },
          { label: 'Predict entanglement', query: 'Does this CX gate create quantum entanglement? Explain why.', mode: 'predict' },
          { label: 'Why is CX asymmetric?', query: 'Why does CNOT flip the target qubit conditionally but leave control unaffected?', mode: 'explain' }
        );
      } else if (['X', 'Y', 'Z'].includes(g)) {
        actions.push(
          { label: `What does ${g} do?`, query: `What does the Pauli-${g} gate do on wire q${t}?`, mode: 'explain' },
          { label: 'Predict state evolution', query: `How does the Pauli-${g} gate rotate the state on the Bloch sphere?`, mode: 'predict' }
        );
      } else {
        actions.push(
          { label: `Explain ${g} gate`, query: `What is the physical operation of ${g} on wire q${t}?`, mode: 'explain' },
          { label: 'Predict transformation', query: `What transformation does ${g} apply to the quantum state?`, mode: 'predict' }
        );
      }
    } else if (simulationResult) {
      actions.push(
        { label: 'Explain simulation result', query: 'Explain these measurement probabilities and why specific basis states appeared.', mode: 'explain' },
        { label: "Why isn't it 50/50?", query: 'Why do the measured shot counts slightly deviate from theoretical 50/50 probabilities?', mode: 'explain' },
        { label: 'Compare with prediction', query: 'Compare my prediction with the actual simulation results.', mode: 'compare' }
      );
    } else {
      actions.push(
        { label: 'Explain this circuit', query: 'Explain how this quantum circuit evolves the state and what it accomplishes.', mode: 'explain' },
        { label: 'Are there anomalies?', query: 'Inspect this circuit for redundant gates or design anomalies.', mode: 'debug' },
        { label: 'Check optimization', query: 'Can this circuit be simplified or optimized?', mode: 'optimize' },
        { label: 'What should I study next?', query: 'Recommend what quantum concept or experiment I should explore next.', mode: 'learn' }
      );
    }

    return actions.slice(0, 3);
  };



  return (
    <div className="tutor-panel-container agent-workspace" data-testid="tutor-panel">
      {/* ── 1. HEADER BAR ── */}
      <div className="tutor-header-bar">
        <div className="tutor-title-box">
          <Bot size={16} color="var(--accent-cyan, #00f2ff)" />
          <span className="tutor-title">AI Quantum Tutor</span>
          <span
            className="tutor-nvidia-badge"
            title={aiEnvironment ? `Tier: ${aiEnvironment.active_tier} | Connectivity: ${aiEnvironment.connectivity}` : "QUALUTION Live AI Teaching System"}
            data-testid="tutor-nvidia-badge"
          >
            {aiEnvironment?.active_tier ? aiEnvironment.active_tier.toUpperCase() : 'LIVE'}
          </span>
          <span
            className="tutor-hybrid-tag"
            title="Hybrid AI Architecture: NVIDIA NIM Primary Reasoning + Groq LPU Pedagogical Optimization"
            data-testid="tutor-hybrid-tag"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, rgba(0, 242, 255, 0.15), rgba(143, 0, 255, 0.2))',
              border: '1px solid rgba(0, 242, 255, 0.35)',
              color: '#00f2ff',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            ⚡ Hybrid AI
          </span>
        </div>

        <div className="tutor-header-controls">
          <div className="tutor-level-box">
            <select
              className="tutor-level-select"
              value={level}
              onChange={(e) => setLevel(e.target.value as LearningLevel)}
              data-testid="tutor-level-select"
              aria-label="Learner Level"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="technical">Technical</option>
            </select>
          </div>

          <button
            type="button"
            className="tutor-icon-tool-btn"
            onClick={clearChat}
            title="Clear conversation"
            aria-label="Clear chat"
          >
            <RotateCcw size={12} />
          </button>

          <button
            type="button"
            className="tutor-icon-tool-btn"
            onClick={() => setShowVoiceModal(true)}
            title="ElevenLabs Neural Voice Settings"
            aria-label="Voice settings"
            data-testid="tutor-voice-settings-header-btn"
          >
            <Sliders size={12} />
          </button>

          {isDocked && (
            <button
              type="button"
              className="tutor-icon-tool-btn"
              onClick={onToggleDock || onClose}
              title="Collapse Tutor workspace"
              aria-label="Collapse Tutor"
              data-testid="tutor-collapse-btn"
            >
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>

          {/* ── 1. Telemetry & Simulator Routing Strip ── */}
          <div className="tutor-context-bar tutor-routing-strip" data-testid="tutor-routing-strip">
            <div className="routing-strip-main">
              <div className="routing-meta-row">
                <span className="routing-section-label">ROUTING</span>
                <span className="routing-meta-pill" title={`Execution Backend: ${simulatorBackend}`}>
                  routed via <strong className="routing-backend-name">{formattedSimulator}</strong>
                </span>
              </div>
              <div className="context-chips-row">
                <span className="context-chip pattern" title="Active Circuit Pattern">
                  {factSet.patternName || `${circuit.qubits}Q Circuit`}
                </span>
                <span className="context-chip" title="Qubit Count">
                  {circuit.qubits} Qubit{circuit.qubits > 1 ? 's' : ''}
                </span>
                <span className="context-chip" title="Simulation Shots">
                  {circuit.shots || 1000} shots
                </span>
                {selectedGate && (
                  <span className="context-chip gate-chip" title="Selected Gate">
                    Selected: <strong>{selectedGate.gate.toUpperCase()}</strong> on q[{selectedGate.targets.join(',')}]
                  </span>
                )}
                {simulationResult && (
                  <span className="context-chip backend" title="Execution Backend">
                    {simulationResult.simulation.backend}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="context-details-btn"
              onClick={() => setShowContextDetails((p) => !p)}
              title="Inspect structured context provided to AI"
              data-testid="tutor-toggle-context-btn"
            >
              {showContextDetails ? <ChevronUp size={11} /> : <Layers size={11} />}
              <span>{showContextDetails ? 'Hide Snapshot' : '+ Context'}</span>
            </button>
          </div>

          {/* Context Details Drawer */}
          {showContextDetails && (
            <div className="context-drawer-panel" data-testid="tutor-context-drawer">
              <div className="context-drawer-header">
                <span className="drawer-title">Active Agent Context Snapshot</span>
                <span className="text-muted drawer-tag">Auto-bounded &amp; secured</span>
              </div>
              <div className="context-drawer-body">
                <div className="context-line"><strong>Circuit:</strong> {circuit.qubits} qubits, {circuit.gates.length} gates</div>
                <div className="context-line"><strong>Gates:</strong> {circuit.gates.map((g) => `${g.gate.toUpperCase()}(q${g.targets})`).join(', ') || 'None'}</div>
                {simulationResult && (
                  <div className="context-line"><strong>Top Outcomes:</strong> {Object.entries(simulationResult.simulation.probabilities).filter(([, p]) => p > 0.05).map(([s, p]) => `|${s}>: ${(p*100).toFixed(1)}%`).join(', ')}</div>
                )}
                <div className="context-line"><strong>Learner Level:</strong> {level.toUpperCase()}</div>
                <div className="context-line"><strong>Backend:</strong> {formattedSimulator}</div>
              </div>
            </div>
          )}

          {/* ── 2. Mode Selector Navigation Strip ── */}
          <div className="tutor-mode-deck">
            <div className="tutor-mode-tabs" role="tablist">
              <button
                type="button"
                className={`tutor-mode-btn ${mode === 'explain' ? 'active' : ''}`}
                onClick={() => setMode('explain')}
                data-testid="mode-explain"
              >
                <HelpCircle size={11} />
                <span>Explain</span>
              </button>

              <button
                type="button"
                className={`tutor-mode-btn ${mode === 'debug' ? 'active' : ''}`}
                onClick={() => setMode('debug')}
                data-testid="mode-debug"
              >
                <Bug size={11} />
                <span>Debug</span>
              </button>

              <button
                type="button"
                className={`tutor-mode-btn ${mode === 'predict' ? 'active' : ''}`}
                onClick={() => setMode('predict')}
                data-testid="mode-predict"
              >
                <Compass size={11} />
                <span>Predict</span>
              </button>

              <button
                type="button"
                className={`tutor-mode-btn ${mode === 'compare' ? 'active' : ''}`}
                onClick={() => setMode('compare')}
                data-testid="mode-compare"
              >
                <ArrowRight size={11} />
                <span>Compare</span>
              </button>

              <button
                type="button"
                className={`tutor-mode-btn ${mode === 'experiment' ? 'active' : ''}`}
                onClick={() => setMode('experiment')}
                data-testid="mode-experiment"
              >
                <FlaskConical size={11} />
                <span>Experiment</span>
              </button>
            </div>
          </div>

          {/* ── 3. Messages & Explanations Workspace ── */}
          <div className="tutor-messages-stream" data-testid="tutor-messages-stream">
            {/* Predict Mode: Hypothesis Workflow Card */}
            {mode === 'predict' && (
              <div className="predict-flow-card">
                <div className="predict-flow-header">
                  <div className="predict-title-row">
                    <Compass size={15} color="var(--wb-status-cyan, #1192e8)" />
                    <span className="predict-title">Predict → Simulate → Compare</span>
                  </div>
                  <span className="predict-stage-tag">HYPOTHESIS STAGE</span>
                </div>

                <div className="predict-flow-step-1">
                  <div className="step-desc">
                    <span className="step-num">1</span>
                    <span>Commit your prediction before simulation:</span>
                  </div>

                  <div className="predict-input-row">
                    <input
                      type="text"
                      className="predict-text-input"
                      placeholder="e.g. 50% |00> and 50% |11> or Equal superposition"
                      value={predictionInput}
                      onChange={(e) => setPredictionInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-commit-predict"
                      disabled={!predictionInput.trim()}
                      onClick={() => {
                        setHasCommittedPrediction(true);
                        handleAsk(`I predict the circuit outcome will be: "${predictionInput}". How will the state evolve?`, 'predict');
                      }}
                    >
                      Commit
                    </button>
                  </div>

                  <div className="predict-quick-pills">
                    {['50% |00> & 50% |11>', '100% |00>', 'Superposition |+>', 'Entangled state'].map((pill, i) => (
                      <button
                        key={i}
                        type="button"
                        className="predict-pill-btn"
                        onClick={() => setPredictionInput(pill)}
                      >
                        {pill}
                      </button>
                    ))}
                  </div>

                  {hasCommittedPrediction && (
                    <div className="predict-flow-step-2">
                      <div className="step-desc">
                        <span className="step-num">2</span>
                        <span>{simulationResult ? 'Actual Simulation Ready' : 'Run simulation to compare results'}</span>
                      </div>
                      {simulationResult ? (
                        <button
                          type="button"
                          className="btn-compare-action"
                          onClick={() => handleAsk(`Compare my prediction ("${predictionInput}") with the actual measured probabilities. Explain any discrepancy!`, 'compare')}
                        >
                          <Zap size={12} />
                          <span>Compare Prediction vs Result</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-simulate-action"
                          onClick={() => onRunSimulation?.()}
                        >
                          <span>Execute Simulation</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Circuit Anomaly & Diagnostic Notice (if error present) */}
            {latestError && (
              <div className="tutor-diagnostic-section" data-testid="tutor-diagnostic-card">
                <div className="diagnostic-header">
                  <AlertTriangle size={13} className="text-amber" />
                  <span className="diagnostic-title">CIRCUIT MISCONCEPTION &amp; DIAGNOSTIC ANALYSIS</span>
                </div>
                <div className="diagnostic-body">
                  <p className="diagnostic-error-desc">⚠️ {latestError}</p>
                  <button
                    type="button"
                    className="btn-debug-err"
                    onClick={() => handleAsk(`Please debug this circuit error in simple words and explain the fix: ${latestError}`, 'debug')}
                    data-testid="ask-error-btn"
                  >
                    <Bug size={11} />
                    <span>Debug in Simple Words</span>
                  </button>
                </div>
              </div>
            )}

            {/* Contextual Actions / Recommended Inquiries */}
            <div className="circuit-aware-bar">
              <div className="aware-header">
                <Sparkles size={11} className="aware-sparkle" />
                <span className="aware-label">Contextual Actions:</span>
              </div>
              <div className="aware-actions-list">
                {renderCircuitAwareActions().map((act, i) => (
                  <button
                    key={i}
                    type="button"
                    className="aware-action-btn"
                    onClick={() => handleAsk(act.query, act.mode)}
                  >
                    <Sparkles size={10} color="var(--accent-cyan, #00f2ff)" />
                    <span>{act.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Messages */}
            {messages.map((m) => {
              if (m.id === 'msg-cleared') {
                return (
                  <div key={m.id} className="tutor-system-notice">
                    <RotateCcw size={12} className="system-notice-icon" />
                    <span className="system-notice-text">{m.content}</span>
                  </div>
                );
              }

              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`tutor-message-bubble ${m.role} ${m.response?.status === 'provider_timeout' ? 'has-timeout' : ''}`}
                >
                  <div className="bubble-header">
                    <div className="author-group">
                      <div className={`author-avatar ${m.role}`}>
                        {isUser ? <User size={12} /> : <Bot size={13} />}
                      </div>
                      <span className="bubble-author">
                        {isUser ? 'You' : 'Quantum Learning Agent'}
                      </span>
                      {m.response?.status === 'provider_timeout' ? (
                        <span
                          className="provider-tag provider-tag-timeout"
                          data-testid="tutor-provider-tag"
                        >
                          {m.response.fallback_answer ? '[Quantum Lab Fallback]' : '[Provider Timeout]'}
                        </span>
                      ) : m.response?.reasoning_provider && (
                        <span
                          className="provider-tag"
                          data-testid="tutor-provider-tag"
                        >
                          {m.response.reasoning_provider === 'nvidia'
                            ? '[NVIDIA Reasoning]'
                            : m.response.reasoning_provider === 'fallback'
                            ? '[Deterministic Reasoner]'
                            : m.response.reasoning_provider === 'ai_unavailable'
                            ? '[AI Unavailable]'
                            : `[${m.response.reasoning_provider}]`}
                          {m.response.response_optimizer === 'groq' && ' · [Groq Response]'}
                        </span>
                      )}
                    </div>

                    <div className="msg-tools">
                      <button
                        type="button"
                        className="btn-msg-copy"
                        onClick={() => copyMessageText(m.id, m.content)}
                        title="Copy response text"
                        aria-label="Copy message text"
                      >
                        {copiedMsgId === m.id ? <Check size={11} color="#24a148" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>

                  {/* Provider Timeout Notice Banner */}
                  {m.response?.status === 'provider_timeout' && (
                    <div className="tutor-timeout-banner" data-testid="tutor-timeout-banner">
                      <div className="timeout-banner-header">
                        <AlertTriangle size={14} className="text-amber" />
                        <span>NVIDIA Tutor is taking too long to respond.</span>
                      </div>
                      <div className="timeout-banner-actions">
                        <button
                          type="button"
                          className="btn-timeout-action btn-retry"
                          onClick={() => {
                            const lastUserMsg = messages.slice().reverse().find((msg) => msg.role === 'user');
                            if (lastUserMsg) {
                              handleAsk(lastUserMsg.content, lastUserMsg.mode);
                            }
                          }}
                          data-testid="tutor-timeout-retry-btn"
                        >
                          <RotateCcw size={12} />
                          <span>Retry</span>
                        </button>
                        <button
                          type="button"
                          className="btn-timeout-action btn-ask-again"
                          onClick={() => {
                            if (composerInputRef.current) {
                              composerInputRef.current.focus();
                            }
                          }}
                          data-testid="tutor-timeout-ask-again-btn"
                        >
                          <span>Ask again</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Fallback label indicator */}
                  {m.response?.fallback_answer && (
                    <div className="tutor-fallback-label" data-testid="tutor-fallback-label">
                      <Sparkles size={11} />
                      <span>Quantum Lab fallback explanation</span>
                    </div>
                  )}

                  {/* Message Content with Markdown & Math */}
                  {m.content && (
                    <div className="bubble-content markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Welcome Action Pills */}
                  {m.id === 'msg-welcome' && (
                    <div className="welcome-action-pills" data-testid="welcome-action-pills">
                      <button
                        type="button"
                        className="welcome-pill-btn"
                        onClick={() => handleAsk("Explain how this circuit works and its quantum state evolution.", "explain")}
                        data-testid="welcome-pill-explain"
                      >
                        <HelpCircle size={11} />
                        <span>Explain</span>
                      </button>
                      <button
                        type="button"
                        className="welcome-pill-btn"
                        onClick={() => handleAsk("Inspect this circuit for any errors, anomalies, or redundant gates.", "debug")}
                        data-testid="welcome-pill-debug"
                      >
                        <Bug size={11} />
                        <span>Debug</span>
                      </button>
                      <button
                        type="button"
                        className="welcome-pill-btn"
                        onClick={() => setMode("predict")}
                        data-testid="welcome-pill-predict"
                      >
                        <Compass size={11} />
                        <span>Predict</span>
                      </button>
                      <button
                        type="button"
                        className="welcome-pill-btn"
                        onClick={() => {
                          setMode("compare");
                          if (simulationResult) {
                            handleAsk("Compare prediction with the actual simulation results.", "compare");
                          }
                        }}
                        data-testid="welcome-pill-compare"
                      >
                        <ArrowRight size={11} />
                        <span>Compare</span>
                      </button>
                    </div>
                  )}

                  {/* Assistant Follow-up suggestions */}
                  {m.role === 'assistant' && m.id !== 'msg-welcome' && (
                    <div className="assistant-followup-chips" data-testid="assistant-followup-chips">
                      {m.response?.technical_analysis && (
                        <button
                          type="button"
                          className="followup-chip-btn"
                          onClick={() => toggleReasoning(m.id)}
                          data-testid={`followup-reasoning-${m.id}`}
                        >
                          <ChevronDown size={10} />
                          <span>{expandedReasoningMap[m.id] ? 'Hide reasoning' : 'Show circuit reasoning'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="followup-chip-btn"
                        onClick={() => handleAsk("Explain the measurement outcomes and probabilities.", "explain")}
                        data-testid={`followup-measure-${m.id}`}
                      >
                        <Zap size={10} />
                        <span>Explain measurement</span>
                      </button>
                      <button
                        type="button"
                        className="followup-chip-btn"
                        onClick={() => setMode("predict")}
                        data-testid={`followup-predict-${m.id}`}
                      >
                        <Compass size={10} />
                        <span>Try a prediction</span>
                      </button>
                    </div>
                  )}

                  {/* Extras: Reasoning, Facts, Actions & Metadata */}
                  {m.response && (
                    <div className="bubble-extras">
                      {m.response.technical_analysis && m.response.technical_analysis !== m.content && (
                        <div className="collapsible-reasoning-box">
                          <button
                            type="button"
                            className="btn-toggle-reasoning"
                            onClick={() => toggleReasoning(m.id)}
                          >
                            {expandedReasoningMap[m.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            <span>{expandedReasoningMap[m.id] ? 'Hide reasoning' : 'Explain the reasoning'}</span>
                          </button>
                          {expandedReasoningMap[m.id] && (
                            <div className="technical-reasoning-body">
                              <pre>{m.response.technical_analysis}</pre>
                            </div>
                          )}
                        </div>
                      )}

                      {m.response.facts && m.response.facts.length > 0 && (
                        <div className="verified-facts-list">
                          <div className="facts-header-row">
                            <CheckCircle2 size={12} color="var(--wb-accent-emerald, #24a148)" />
                            <span className="facts-heading">Ground Truth Quantum Facts</span>
                          </div>
                          <div className="facts-items-list">
                            {m.response.facts.map((f, i) => (
                              <div key={i} className="fact-line">
                                <Check size={10} className="fact-check-icon" />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.response.actions && m.response.actions.length > 0 && (
                        <div className="tutor-actions-row">
                          {m.response.actions.map((act, i) => (
                            <button
                              key={i}
                              type="button"
                              className="btn-tutor-action"
                              onClick={() => handleActionClick(act)}
                              data-testid={`tutor-action-${act.type}`}
                            >
                              <ExternalLink size={11} />
                              <span>{act.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Smaller, muted metadata footer */}
                      <div className="bubble-footer-meta">
                        <span className="tutor-metadata-text">
                          ⚡ Evaluated for {circuit.qubits}Q state · routed via {formattedSimulator}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Visual Thinking & Loading State */}
            {isLoading && (
              <div className="tutor-thinking-state" data-testid="tutor-thinking-state">
                <div className="thinking-card-header">
                  <div className="thinking-orb">
                    <Sparkles size={13} className="thinking-sparkle" />
                    <span className="thinking-pulse" />
                  </div>
                  <div className="thinking-meta">
                    <span className="thinking-title">AI Quantum Tutor is synthesizing</span>
                    <span className="thinking-subtitle">
                      {activityStatus || 'Analyzing quantum circuit & Hilbert state space...'}
                    </span>
                  </div>
                  <div className="thinking-dots" aria-hidden="true">
                    <span className="dot dot-1" />
                    <span className="dot dot-2" />
                    <span className="dot dot-3" />
                  </div>
                </div>
                <div className="thinking-shimmer-preview" aria-hidden="true">
                  <div className="shimmer-bar bar-long" />
                  <div className="shimmer-bar bar-medium" />
                  <div className="shimmer-bar bar-short" />
                </div>

                {/* Maintained for complete test & backward compatibility */}
                <div className="tutor-loading-indicator" style={{ display: 'none' }}>
                  <Sparkles size={13} className="spinner" color="var(--accent-cyan, #00f2ff)" />
                  <span className="activity-status-text">
                    {activityStatus || 'Analyzing quantum circuit & statevector...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── 4. Suggestions Box ── */}
          <div 
            className="tutor-suggestions-box"
            onMouseEnter={() => setShowSuggestions(true)}
            onMouseLeave={() => setShowSuggestions(false)}
          >
            <div className="sugg-header">
              <div className="sugg-header-left">
                <BookOpen size={14} className="text-muted" />
                <span className="sugg-lbl">Suggested Topics (Hover)</span>
              </div>
              {showSuggestions ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
            </div>
            
            {showSuggestions && (
              <div className="sugg-chips-list popup-hover-list">
                {factSet.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sugg-chip"
                    onClick={() => {
                      handleAsk(q);
                      setShowSuggestions(false);
                    }}
                    title={q}
                    data-testid={`quick-sugg-${idx}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── 5. Chat Input Composer Deck ── */}
          <form
            className="tutor-input-box"
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(inputQuestion);
            }}
            data-testid="tutor-form"
          >
            <div className="tutor-input-box-inner">
              <div className="composer-row-input">
                <input
                  ref={composerInputRef}
                  type="text"
                  name="tutor-question-input"
                  aria-label="Quantum Tutor Question Input"
                  className="tutor-text-input"
                  placeholder={
                    selectedGate
                      ? `Ask about ${selectedGate.gate.toUpperCase()} gate on wire q[${selectedGate.targets.join(',')}]...`
                      : mode === 'explain'
                      ? 'Ask Quantum Tutor... (e.g. Why do 00 and 11 appear?)'
                      : mode === 'debug'
                      ? 'Ask Quantum Tutor... (e.g. Are there redundant gates?)'
                      : mode === 'predict'
                      ? 'Ask Quantum Tutor... (e.g. What happens if I add an X gate?)'
                      : mode === 'compare'
                      ? 'Compare prediction against measurement results...'
                      : 'Ask Quantum Tutor...'
                  }
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  data-testid="tutor-input"
                />
              </div>

              <div className="composer-row-bottom">
                <div className="composer-actions-left">
                  <button
                    type="button"
                    className="composer-tool-btn"
                    onClick={() => setShowContextDetails((p) => !p)}
                    title="Inspect structured context provided to AI"
                    data-testid="composer-context-btn"
                  >
                    <Plus size={16} />
                    <span>Context</span>
                  </button>

                  <button
                    type="button"
                    className="composer-tool-btn"
                    onClick={() => handleAsk("Analyze this quantum circuit, its state evolution, and any optimization opportunities.", "explain")}
                    disabled={isLoading}
                    title="Run full circuit analysis with AI Tutor"
                    data-testid="composer-analysis-btn"
                  >
                    <Sparkles size={16} color="var(--wb-accent, #0f62fe)" />
                    <span>Run Analysis</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn-tutor-send"
                  disabled={!inputQuestion.trim() || isLoading}
                  title="Send Message"
                  data-testid="tutor-submit-btn"
                >
                  <ArrowUp size={16} />
                </button>
              </div>
            </div>
          </form>


      {/* ── 5. ELEVENLABS VOICE STUDIO SETTINGS MODAL ── */}
      {showVoiceModal && (
        <div className="tutor-voice-modal-overlay" onClick={() => setShowVoiceModal(false)}>
          <div className="tutor-voice-modal-content" onClick={(e) => e.stopPropagation()} data-testid="tutor-voice-modal">
            <div className="tutor-voice-modal-header">
              <div className="voice-modal-title">
                <Volume2 size={16} color="var(--accent-cyan, #00f2ff)" />
                <h4>ElevenLabs Neural Voice Studio</h4>
              </div>
              <button
                type="button"
                className="tutor-voice-close-btn"
                onClick={() => setShowVoiceModal(false)}
                title="Close"
                data-testid="close-voice-modal-btn"
              >
                <X size={15} />
              </button>
            </div>

            <div className="tutor-voice-modal-body">
              <p className="voice-modal-desc">
                High-definition studio narration powered by ElevenLabs. If no API key is provided or the connection is offline, QUALUTION seamlessly falls back to high-performance local speech synthesis.
              </p>

              <div className="voice-setting-field">
                <label className="voice-field-label" htmlFor="elevenlabs-api-key">
                  ElevenLabs API Key:
                </label>
                <input
                  id="elevenlabs-api-key"
                  type="password"
                  className="voice-input-text"
                  placeholder="xi-... (or leave blank to use browser TTS)"
                  value={voiceApiKey}
                  onChange={(e) => setVoiceApiKey(e.target.value)}
                  data-testid="voice-api-key-input"
                />
                <span className="voice-field-hint">
                  Stored securely in your local browser storage. Never sent to third parties.
                </span>
              </div>

              <div className="voice-setting-field">
                <label className="voice-field-label">Preferred Studio Voice:</label>
                <div className="voice-options-grid">
                  {ELEVENLABS_VOICES.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      className={`voice-card-btn ${selectedVoiceId === v.id ? 'selected' : ''}`}
                      onClick={() => setSelectedVoiceId(v.id)}
                      data-testid={`voice-option-${v.name.toLowerCase()}`}
                    >
                      <div className="voice-card-top">
                        <span className="voice-card-name">{v.name}</span>
                        {selectedVoiceId === v.id && <Check size={13} color="var(--accent-cyan, #00f2ff)" />}
                      </div>
                      <span className="voice-card-desc">{v.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {voiceSaveStatus && (
                <div className="voice-save-status-badge" data-testid="voice-save-status">
                  <CheckCircle2 size={13} />
                  <span>{voiceSaveStatus}</span>
                </div>
              )}
            </div>

            <div className="tutor-voice-modal-footer">
              <button
                type="button"
                className="player-btn player-btn-secondary"
                onClick={handleTestVoice}
                disabled={isTestingVoice}
                data-testid="test-voice-btn"
              >
                <Volume2 size={13} />
                <span>{isTestingVoice ? 'Playing...' : 'Test Speech'}</span>
              </button>

              <button
                type="button"
                className="player-btn player-btn-primary"
                onClick={handleSaveVoiceSettings}
                data-testid="save-voice-btn"
              >
                <Check size={13} />
                <span>Save Voice Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

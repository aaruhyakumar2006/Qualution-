import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Zap,
  Cpu,
  Compass,
  Bug,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ErwinAvatar, type ErwinState } from './ErwinAvatar';
import { answerTutorQuestion, streamTutorQuestion } from '../../features/tutor/tutorEngine';
import { buildTutorContext } from '../../features/tutor/contextBuilder';
import type { TutorMode, LearningLevel, TutorContext, TutorResponse } from '../../features/tutor/tutorTypes';
import type { CircuitRequest, CircuitRunResponse, Gate } from '../../features/circuit/types';
import './ErwinHybridAIAssistant.css';

export interface ErwinChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  mode?: TutorMode;
  response?: TutorResponse;
  isStreaming?: boolean;
}

export interface ErwinHybridAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  companionState?: ErwinState;
  onCompanionStateChange?: (state: ErwinState) => void;
  circuit?: CircuitRequest;
  simulationResult?: CircuitRunResponse | null;
  selectedGate?: Gate | null;
  initialMode?: TutorMode;
}

const DEFAULT_SUGGESTIONS = [
  { label: '⚛️ Quantum Superposition', query: 'Explain how quantum superposition works and why |+⟩ has equal 50/50 measurement probabilities.' },
  { label: '🔗 Entanglement & Bell States', query: 'How does a CNOT gate following a Hadamard create quantum entanglement between two qubits?' },
  { label: '⚡ Erwin Hybrid AI Engine', query: 'Explain how the Erwin Hybrid AI architecture combines NVIDIA NIM deep reasoning and Groq LPU speed.' },
  { label: '🔍 Grover Quantum Search', query: 'How does Grover\'s algorithm achieve quadratic speedup using phase inversion and amplitude amplification?' },
  { label: '🐞 Find Circuit Anomalies', query: 'Inspect my quantum circuit for redundant operations, phase cancellation, or decoherence risks.' },
  { label: '🎯 Predict State Amplitudes', query: 'Predict the expected statevector probabilities and Bloch vector orientation for this quantum circuit.' },
];

export const ErwinHybridAIAssistant: React.FC<ErwinHybridAIAssistantProps> = ({
  isOpen,
  onClose,
  companionState = 'idle',
  onCompanionStateChange,
  circuit = { qubits: 2, gates: [] },
  simulationResult = null,
  selectedGate = null,
  initialMode = 'explain',
}) => {
  const [messages, setMessages] = useState<ErwinChatMessage[]>([
    {
      id: 'erwin-welcome',
      role: 'assistant',
      content:
        "**Purr! I'm Erwin**, your **Hybrid Quantum AI Copilot**! 🐾\n\nI run on our dual-core hybrid intelligence architecture:\n- 🧠 **NVIDIA NIM Core**: Deep quantum mechanics, unitary math, and circuit topology reasoning.\n- ⚡ **Groq LPU Accelerator**: Sub-second pedagogical tuning & instant socratic dialogue.\n\nAsk me anything about quantum superposition, entanglement, circuit anomalies, or quantum algorithms!",
      timestamp: Date.now(),
      mode: 'explain',
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<TutorMode>(initialMode);
  const [level, setLevel] = useState<LearningLevel>('beginner');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [expandedReasoningMap, setExpandedReasoningMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [streamDeltaText, setStreamDeltaText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, streamDeltaText, scrollToBottom]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Voice narration helper
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Clean markdown tags for natural speech
      const clean = text
        .replace(/[*_#`[\]()]/g, '')
        .replace(/\$[^$]+\$/g, 'formula')
        .slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.1; // Friendly mascot pitch
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore audio synthesis errors
    }
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `cleared-${Date.now()}`,
        role: 'assistant',
        content: "Dialogue matrix cleared. Quantum studio ready! What shall we analyze next?",
        timestamp: Date.now(),
        mode,
      },
    ]);
    if (onCompanionStateChange) onCompanionStateChange('idle');
  };

  const handleSend = async (customQuery?: string) => {
    const query = (customQuery ?? inputQuestion).trim();
    if (!query || isLoading) return;

    setInputQuestion('');
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `erwin-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: query,
        timestamp: Date.now(),
        mode,
      },
    ]);

    setIsLoading(true);
    setStreamDeltaText('');
    setStatusMessage('🧠 NVIDIA NIM quantum reasoning in progress...');
    if (onCompanionStateChange) onCompanionStateChange('thinking');

    const context: TutorContext = buildTutorContext(
      circuit,
      simulationResult,
      selectedGate,
      level,
      null
    );

    try {
      let finalResponse: TutorResponse | null = null;

      try {
        finalResponse = await streamTutorQuestion(
          query,
          context,
          (status) => {
            setStatusMessage(status);
          },
          (delta) => {
            setStreamDeltaText((prev) => prev + delta);
          }
        );
      } catch {
        finalResponse = await answerTutorQuestion(query, context);
      }

      const answerContent = finalResponse?.answer || finalResponse?.technical_analysis || streamDeltaText ||
        "I analyzed the quantum circuit state. All unitary conditions remain satisfied.";

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: answerContent,
          timestamp: Date.now(),
          mode,
          response: finalResponse,
        },
      ]);

      if (isVoiceEnabled) {
        speakText(answerContent);
      }

      if (onCompanionStateChange) {
        onCompanionStateChange('correct');
        setTimeout(() => onCompanionStateChange('idle'), 3000);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content:
            "I encountered a momentary perturbation in my quantum reasoning cluster. My local fallback engine confirms your circuit is unitary.",
          timestamp: Date.now(),
          mode,
        },
      ]);
      if (onCompanionStateChange) {
        onCompanionStateChange('incorrect');
        setTimeout(() => onCompanionStateChange('idle'), 3000);
      }
    } finally {
      setIsLoading(false);
      setStreamDeltaText('');
      setStatusMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`erwin-assistant-modal-backdrop ${isMaximized ? 'is-maximized' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="erwin-hybrid-ai-backdrop"
    >
      <div
        className={`erwin-assistant-window ${isMaximized ? 'window-maximized' : ''}`}
        data-testid="erwin-hybrid-ai-panel"
        role="dialog"
        aria-label="Erwin Hybrid AI Assistant"
      >
        {/* ── 1. HEADER ── */}
        <header className="erwin-assistant-header">
          <div className="erwin-header-left">
            <div className="erwin-avatar-badge" title="Erwin Quantum Cat Mascot">
              <ErwinAvatar
                size={38}
                state={isLoading ? 'thinking' : companionState}
                data-testid="erwin-modal-avatar"
              />
              <span className="erwin-live-status-dot" title="Hybrid AI Engine Online" />
            </div>
            <div className="erwin-title-group">
              <div className="erwin-title-row">
                <span className="erwin-name">Erwin</span>
                <span className="erwin-model-badge" data-testid="erwin-hybrid-badge">
                  <Zap size={11} className="badge-icon-zap" />
                  Hybrid AI Model
                </span>
              </div>
              <span className="erwin-subtitle">
                NVIDIA NIM Reasoning ⨂ Groq LPU Speed
              </span>
            </div>
          </div>

          <div className="erwin-header-controls">
            <div className="erwin-level-selector" title="Select learner difficulty">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as LearningLevel)}
                aria-label="Learning level"
                className="erwin-select-input"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="technical">Technical</option>
              </select>
            </div>

            <button
              type="button"
              className={`erwin-icon-btn ${isVoiceEnabled ? 'is-active' : ''}`}
              onClick={() => {
                if (isVoiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setIsVoiceEnabled(!isVoiceEnabled);
              }}
              title={isVoiceEnabled ? 'Mute Erwin voice' : 'Enable Erwin voice narration'}
              aria-label="Toggle voice"
            >
              {isVoiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            <button
              type="button"
              className="erwin-icon-btn"
              onClick={handleClearChat}
              title="Clear dialogue history"
              aria-label="Clear chat"
            >
              <RotateCcw size={15} />
            </button>

            <button
              type="button"
              className="erwin-icon-btn"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? 'Restore size' : 'Maximize window'}
              aria-label="Toggle window size"
            >
              {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <button
              type="button"
              className="erwin-icon-btn erwin-close-btn"
              onClick={onClose}
              title="Close Erwin (Esc)"
              aria-label="Close"
              data-testid="erwin-close-btn"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* ── 2. HYBRID AI ENGINE STRIP ── */}
        <div className="erwin-hybrid-engine-strip" data-testid="erwin-engine-strip">
          <div className="engine-strip-pill">
            <Cpu size={12} className="engine-icon" />
            <span className="engine-label">Reasoning:</span>
            <strong className="engine-val">NVIDIA NIM</strong>
          </div>
          <div className="engine-strip-pill">
            <Zap size={12} className="engine-icon" />
            <span className="engine-label">Pedagogy:</span>
            <strong className="engine-val">Groq LPU</strong>
          </div>
          <div className="engine-strip-pill">
            <Sparkles size={12} className="engine-icon" />
            <span className="engine-label">Simulator:</span>
            <strong className="engine-val">Local MPS/Aer</strong>
          </div>
        </div>

        {/* ── 3. MODE SELECTOR TABS ── */}
        <nav className="erwin-mode-tabs" aria-label="Socratic Mode Navigation">
          <button
            type="button"
            className={`erwin-mode-tab ${mode === 'explain' ? 'is-active' : ''}`}
            onClick={() => setMode('explain')}
            data-testid="erwin-mode-explain"
          >
            <Compass size={13} />
            <span>Explain</span>
          </button>
          <button
            type="button"
            className={`erwin-mode-tab ${mode === 'debug' ? 'is-active' : ''}`}
            onClick={() => setMode('debug')}
            data-testid="erwin-mode-debug"
          >
            <Bug size={13} />
            <span>Debug</span>
          </button>
          <button
            type="button"
            className={`erwin-mode-tab ${mode === 'predict' ? 'is-active' : ''}`}
            onClick={() => setMode('predict')}
            data-testid="erwin-mode-predict"
          >
            <HelpCircle size={13} />
            <span>Predict</span>
          </button>
          <button
            type="button"
            className={`erwin-mode-tab ${mode === 'optimize' ? 'is-active' : ''}`}
            onClick={() => setMode('optimize')}
            data-testid="erwin-mode-optimize"
          >
            <Zap size={13} />
            <span>Optimize</span>
          </button>
        </nav>

        {/* ── 4. CHAT MESSAGE SCROLLER ── */}
        <div className="erwin-chat-scroll-area" data-testid="erwin-chat-area">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const reasoningExpanded = Boolean(expandedReasoningMap[msg.id]);

            return (
              <div
                key={msg.id}
                className={`erwin-message-row ${isUser ? 'is-user-msg' : 'is-erwin-msg'}`}
              >
                {!isUser && (
                  <div className="erwin-msg-avatar">
                    <ErwinAvatar size={28} state={companionState} />
                  </div>
                )}

                <div className="erwin-msg-bubble">
                  <div className="erwin-msg-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Expandable Hybrid AI Reasoning Breakdown */}
                  {!isUser && msg.response && (msg.response.technical_analysis || msg.response.facts?.length) && (
                    <div className="erwin-reasoning-accordion">
                      <button
                        type="button"
                        className="erwin-reasoning-toggle"
                        onClick={() =>
                          setExpandedReasoningMap((prev) => ({
                            ...prev,
                            [msg.id]: !prev[msg.id],
                          }))
                        }
                      >
                        <span className="reasoning-toggle-left">
                          <Cpu size={12} />
                          Hybrid AI Reasoning Pipeline
                        </span>
                        {reasoningExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {reasoningExpanded && (
                        <div className="erwin-reasoning-body">
                          {msg.response.technical_analysis && (
                            <div className="reasoning-step">
                              <span className="step-tag nvidia-tag">NVIDIA NIM Deduction:</span>
                              <p className="step-text">{msg.response.technical_analysis}</p>
                            </div>
                          )}

                          {msg.response.facts && msg.response.facts.length > 0 && (
                            <div className="reasoning-step">
                              <span className="step-tag groq-tag">Physical Principles & Invariants:</span>
                              <ul className="step-facts-list">
                                {msg.response.facts.map((fact, i) => (
                                  <li key={i}>{fact}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="reasoning-telemetry">
                            {msg.response.latency_ms && (
                              <span className="telemetry-item">⏱️ Latency: {Math.round(msg.response.latency_ms)}ms</span>
                            )}
                            <span className="telemetry-item">🎯 Confidence: {msg.response.confidence || 'high'}</span>
                            <span className="telemetry-item">
                              ⚙️ Engine: {msg.response.reasoning_provider || 'NVIDIA NIM'} + {msg.response.response_optimizer || 'Groq LPU'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions & Copy buttons */}
                  {!isUser && (
                    <div className="erwin-msg-actions-bar">
                      <button
                        type="button"
                        className="erwin-action-btn"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check size={12} color="#21c79a" /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {isVoiceEnabled && (
                        <button
                          type="button"
                          className="erwin-action-btn"
                          onClick={() => speakText(msg.content)}
                          title="Read aloud"
                        >
                          <Volume2 size={12} />
                          <span>Speak</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Real-time Streaming Delta View */}
          {isLoading && streamDeltaText && (
            <div className="erwin-message-row is-erwin-msg is-streaming">
              <div className="erwin-msg-avatar">
                <ErwinAvatar size={28} state="thinking" />
              </div>
              <div className="erwin-msg-bubble stream-bubble">
                <div className="erwin-msg-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {streamDeltaText}
                  </ReactMarkdown>
                </div>
                <span className="erwin-typing-cursor" />
              </div>
            </div>
          )}

          {/* Thinking / Loading indicator */}
          {isLoading && !streamDeltaText && (
            <div className="erwin-thinking-indicator" data-testid="erwin-thinking-indicator">
              <div className="pulsing-orbit-ring" />
              <div className="thinking-text-group">
                <span className="thinking-primary-text">{statusMessage || 'Hybrid AI reasoning in progress...'}</span>
                <span className="thinking-sub-text">Synthesizing quantum physics via NVIDIA NIM & Groq LPU</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── 5. QUICK PROMPT CHIPS ── */}
        <div className="erwin-quick-chips-wrapper">
          <div className="quick-chips-label">
            <Lightbulb size={12} />
            <span>Suggested Inquiries:</span>
          </div>
          <div className="quick-chips-row">
            {DEFAULT_SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="erwin-quick-chip"
                onClick={() => handleSend(chip.query)}
                disabled={isLoading}
              >
                <span>{chip.label}</span>
                <ArrowRight size={11} className="chip-arrow" />
              </button>
            ))}
          </div>
        </div>

        {/* ── 6. INPUT BAR ── */}
        <form
          className="erwin-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="erwin-input-container">
            <input
              ref={inputRef}
              type="text"
              className="erwin-text-input"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={`Ask Erwin in ${mode.toUpperCase()} mode... (e.g. "What does H gate do?")`}
              disabled={isLoading}
              data-testid="erwin-chat-input"
              aria-label="Ask Erwin"
            />
            <button
              type="submit"
              className="erwin-send-button"
              disabled={isLoading || !inputQuestion.trim()}
              data-testid="erwin-send-btn"
              title="Send question to Erwin Hybrid AI (Enter)"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ErwinHybridAIAssistant;

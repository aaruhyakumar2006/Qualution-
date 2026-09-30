import React, { useState } from 'react';
import type { CircuitRequest, CircuitRunResponse, Gate } from '../../features/circuit/types';
import type { LearningLevel, PracticeQuestion } from '../../features/learning/learningTypes';
import { GATE_KNOWLEDGE_CATALOG } from '../../features/learning/gateKnowledge';
import {
  explainCircuit,
  generatePracticeQuestions,
} from '../../features/learning/explanationEngine';
import { progressService } from '../../features/progress/progressService';
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import './LearningPanel.css';

interface LearningPanelProps {
  circuit: CircuitRequest;
  simulationResult: CircuitRunResponse | null;
  selectedGate: Gate | null;
  onSelectTab: (tab: 'results' | 'state' | 'bloch' | 'timeline' | 'metrics') => void;
}

export const LearningPanel: React.FC<LearningPanelProps> = ({
  circuit,
  simulationResult,
  selectedGate,
  onSelectTab,
}) => {
  const [level, setLevel] = useState<LearningLevel>('beginner');
  const [activeSubTab, setActiveSubTab] = useState<'explain' | 'practice'>('explain');

  // Practice state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const explanation = explainCircuit(circuit, simulationResult);
  const practiceQuestions: PracticeQuestion[] = generatePracticeQuestions(circuit);
  const currentQuestion = practiceQuestions[currentQuestionIdx] || practiceQuestions[0];

  const selectedKnowledge = selectedGate
    ? GATE_KNOWLEDGE_CATALOG[selectedGate.gate.toLowerCase()]
    : null;

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    setShowFeedback(false);
  };

  const handleCheckAnswer = () => {
    if (selectedOption !== null && currentQuestion) {
      setShowFeedback(true);
      const isCorrect = selectedOption === currentQuestion.correctIndex;
      
      // Determine related concept from question
      let conceptId = 'computational_basis';
      if (currentQuestion.id === 'bell_outcomes') conceptId = 'bell_state';
      else if (currentQuestion.id === 'h_self_inverse') conceptId = 'hadamard';
      else if (currentQuestion.id === 'cx_condition') conceptId = 'controlled_gates';
      else if (currentQuestion.id === 'rotation_axis') conceptId = 'rotations';
      else if (currentQuestion.id === 'quantum_basis') conceptId = 'computational_basis';

      progressService.recordConceptAttempt(conceptId, isCorrect, 'quiz', 15);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setCurrentQuestionIdx((prev) => (prev + 1) % practiceQuestions.length);
  };

  return (
    <div className="learning-panel-container" data-testid="learning-panel">
      {/* Top Learning Controls */}
      <div className="learning-header-bar">
        <div className="sub-nav-tabs">
          <button
            type="button"
            className={`sub-nav-btn ${activeSubTab === 'explain' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('explain')}
            data-testid="learn-tab-explain"
          >
            <BookOpen size={12} />
            <span>Explanations</span>
          </button>
          <button
            type="button"
            className={`sub-nav-btn ${activeSubTab === 'practice' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('practice')}
            data-testid="learn-tab-practice"
          >
            <HelpCircle size={12} />
            <span>Practice</span>
          </button>
        </div>

        <div className="level-switch-box">
          <span className="level-lbl">Mode:</span>
          <select
            className="level-select"
            value={level}
            onChange={(e) => setLevel(e.target.value as LearningLevel)}
            data-testid="learning-level-select"
          >
            <option value="beginner">Beginner</option>
            <option value="technical">Technical</option>
          </select>
        </div>
      </div>

      <div className="learning-scroll-content">
        {/* SUBTAB 1: EXPLANATION */}
        {activeSubTab === 'explain' && (
          <>
            {/* 1. Selected Gate Card (if a gate is clicked on canvas) */}
            {selectedKnowledge && selectedGate && (
              <div className="learn-card highlight" data-testid="selected-gate-learn-card">
                <div className="learn-card-header">
                  <span className="gate-badge-icon">{selectedGate.gate.toUpperCase()}</span>
                  <div className="gate-header-text">
                    <span className="gate-name">{selectedKnowledge.name}</span>
                    <span className="gate-sub">
                      Target: q[{selectedGate.targets.join(', ')}]
                      {selectedGate.angle !== undefined && ` • ${(selectedGate.angle / Math.PI).toFixed(2)}π rad`}
                    </span>
                  </div>
                </div>

                <div className="learn-card-body">
                  <p className="explain-desc">
                    {level === 'beginner'
                      ? selectedKnowledge.beginnerDescription
                      : selectedKnowledge.technicalDescription}
                  </p>

                  {/* Mathematical equation in technical mode */}
                  {level === 'technical' && selectedKnowledge.matrix && (
                    <div className="technical-matrix-box">
                      <span className="tech-heading">Matrix Representation:</span>
                      <pre className="matrix-code">{selectedKnowledge.matrix.join('\n')}</pre>
                    </div>
                  )}

                  <div className="equation-strip">
                    <span className="eq-label">State Mapping:</span>
                    <pre className="eq-code">{selectedKnowledge.equations.stateTransition}</pre>
                  </div>

                  <div className="bloch-effect-box">
                    <span className="bloch-heading">Bloch Sphere Effect:</span>
                    <span className="bloch-desc">{selectedKnowledge.blochEffect}</span>
                  </div>

                  {/* Navigation shortcuts to visualization tabs */}
                  <div className="learn-nav-shortcuts">
                    <button
                      type="button"
                      className="btn-shortcut"
                      onClick={() => onSelectTab('bloch')}
                    >
                      <ExternalLink size={11} />
                      <span>Inspect on Bloch Sphere</span>
                    </button>
                    <button
                      type="button"
                      className="btn-shortcut"
                      onClick={() => onSelectTab('timeline')}
                    >
                      <ExternalLink size={11} />
                      <span>Inspect on Timeline</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Circuit Overview Card */}
            <div className="learn-card">
              <div className="learn-card-header">
                <GraduationCap size={14} color="var(--accent-indigo)" />
                <span className="card-title">{explanation.title}</span>
                <span className="level-badge">{explanation.learningLevel}</span>
              </div>

              <div className="learn-card-body">
                <p className="circuit-summary-text">{explanation.summary}</p>

                {/* Concept Tags */}
                <div className="concept-tags-row">
                  {explanation.concepts.map((c) => (
                    <span key={c} className="concept-chip">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Step-by-Step Gate Breakdown */}
            {explanation.stepExplanations.length > 0 && (
              <div className="learn-card">
                <div className="learn-card-header">
                  <Sparkles size={14} color="var(--accent-cyan)" />
                  <span className="card-title">Gate-by-Gate Execution Flow</span>
                </div>

                <div className="learn-card-body steps-list">
                  {explanation.stepExplanations.map((step) => (
                    <div key={step.step} className="step-explain-item">
                      <div className="step-num-bubble">{step.step}</div>
                      <div className="step-explain-content">
                        <div className="step-meta">
                          <span className="step-gate-name">{step.gateName}</span>
                          <span className="step-target-name">{step.targetText}</span>
                        </div>
                        <span className="step-text">{step.explanation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* SUBTAB 2: PRACTICE */}
        {activeSubTab === 'practice' && currentQuestion && (
          <div className="practice-card" data-testid="practice-card">
            <div className="practice-header">
              <span className="question-count">
                Question {currentQuestionIdx + 1} of {practiceQuestions.length}
              </span>
              <span className="practice-title">Quantum Concept Quiz</span>
            </div>

            <div className="practice-body">
              <p className="question-text">{currentQuestion.question}</p>

              <div className="options-list">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  let optClass = '';
                  if (showFeedback) {
                    if (idx === currentQuestion.correctIndex) optClass = 'correct';
                    else if (isSelected) optClass = 'incorrect';
                  } else if (isSelected) {
                    optClass = 'selected';
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`option-btn ${optClass}`}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={showFeedback}
                      data-testid={`practice-option-${idx}`}
                    >
                      <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                      <span className="opt-text">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback box */}
              {showFeedback && (
                <div
                  className={`feedback-box ${
                    selectedOption === currentQuestion.correctIndex ? 'correct' : 'incorrect'
                  }`}
                  data-testid="practice-feedback"
                >
                  {selectedOption === currentQuestion.correctIndex ? (
                    <div className="fb-content">
                      <div className="fb-title correct">
                        <CheckCircle2 size={15} />
                        <span>Correct!</span>
                      </div>
                      <p className="fb-desc">{currentQuestion.explanation}</p>
                    </div>
                  ) : (
                    <div className="fb-content">
                      <div className="fb-title incorrect">
                        <XCircle size={15} />
                        <span>Not quite</span>
                      </div>
                      <p className="fb-desc">
                        {currentQuestion.hint} {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="practice-footer">
              {!showFeedback ? (
                <button
                  type="button"
                  className="btn-check-ans"
                  onClick={handleCheckAnswer}
                  disabled={selectedOption === null}
                  data-testid="check-answer-btn"
                >
                  <span>Check Answer</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-next-question"
                  onClick={handleNextQuestion}
                  data-testid="next-question-btn"
                >
                  <span>Next Question</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

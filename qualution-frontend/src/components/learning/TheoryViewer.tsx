import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { BookOpen, Sparkles, Zap } from 'lucide-react';
import type { TheoryConcept, TheorySection } from '../../features/theory/types';
import 'katex/dist/katex.min.css';
import './TheoryViewer.css';

interface TheoryViewerProps {
  concept: TheoryConcept;
  onShowMe?: (circuitId: string) => void;
  onPracticeSubmit?: (questionIndex: number, answerIndex: number) => void;
}

export const TheoryViewer: React.FC<TheoryViewerProps> = ({
  concept,
  onShowMe,
}) => {
  const renderSection = (section: TheorySection) => {
    return (
      <div key={section.id} className={`theory-section theory-section-${section.type}`}>
        {section.title && <h3 className="theory-section-title">{section.title}</h3>}
        
        <div className="theory-content-markdown">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {section.content}
          </ReactMarkdown>
        </div>

        {section.mathContext && (
          <div className="theory-math-context">
            {section.mathContext.formulas.map((formula, idx) => (
              <div key={idx} className="theory-formula-block">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {`$$${formula}$$`}
                </ReactMarkdown>
              </div>
            ))}
            <div className="theory-math-variables">
              {Object.entries(section.mathContext.variables).map(([key, desc]) => (
                <div key={key} className="theory-variable-row">
                  <span className="variable-key">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`$${key}$`}</ReactMarkdown>
                  </span>
                  <span className="variable-desc">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {section.type === 'circuit' && section.circuitId && (
          <div className="theory-circuit-action">
            <button 
              className="btn-show-me"
              onClick={() => onShowMe?.(section.circuitId!)}
            >
              <Sparkles size={16} />
              Demonstrate in Circuit
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="theory-viewer-container">
      <header className="theory-header">
        <div className="theory-badge">
          <BookOpen size={14} />
          <span>{concept.difficulty} Concept</span>
        </div>
        <h1 className="theory-title">{concept.title}</h1>
        <p className="theory-description">{concept.shortDescription}</p>
      </header>

      <div className="theory-objectives">
        <h4>Learning Objectives</h4>
        <ul>
          {concept.learningObjectives.map((obj, i) => (
            <li key={i}>
              <span className="objective-type">{obj.type}</span>
              <span className="objective-desc">{obj.description}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="theory-sections">
        {concept.sections.map(renderSection)}
      </div>

      {concept.misconceptions && concept.misconceptions.length > 0 && (
        <div className="theory-misconceptions">
          <h4><Zap size={16} /> Common Misconceptions</h4>
          {concept.misconceptions.map((mc, i) => (
            <div key={i} className="misconception-card">
              <div className="mc-wrong"><strong>Myth:</strong> {mc.wrongBelief}</div>
              <div className="mc-right"><strong>Truth:</strong> {mc.correction}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

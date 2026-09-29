import React from 'react';
import { Trophy, X, Target, Zap } from 'lucide-react';
import { QUANTUM_CURRICULUM, type LessonModule } from '../../features/learning/curriculumData';

interface PuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPuzzle: (puzzle: LessonModule) => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  isOpen,
  onClose,
  onSelectPuzzle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" data-testid="puzzle-workspace-modal">
      <div className="modal-content file-workspace-card" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <div className="modal-title-box">
            <Trophy size={16} color="var(--accent-magenta)" />
            <span className="modal-title">Quantum Challenges &amp; Puzzles</span>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div className="modal-body file-grid-layout" style={{ display: 'block', padding: '20px' }}>
          <p style={{ marginBottom: '20px', color: 'var(--ide-text-secondary)', fontSize: '13px' }}>
            Select a puzzle to enter Challenge Mode. Match the target statevector or probability distribution to earn XP!
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {QUANTUM_CURRICULUM.map((lesson) => (
              <div 
                key={lesson.id}
                style={{
                  background: 'var(--ide-bg-elevated)',
                  border: '1px solid var(--ide-border)',
                  borderRadius: '6px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--ide-text)' }}>{lesson.assessment.title}</h4>
                    <span style={{ 
                      fontSize: '11px', 
                      background: 'var(--ide-border)', 
                      padding: '2px 6px', 
                      borderRadius: '10px' 
                    }}>
                      {lesson.difficulty}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--ide-text-secondary)' }}>
                    {lesson.assessment.objective}
                  </p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)', fontSize: '12px', fontWeight: 'bold' }}>
                    <Zap size={12} />
                    {lesson.xpReward} XP
                  </div>
                  <button 
                    className="btn-modal-primary" 
                    onClick={() => {
                      onSelectPuzzle(lesson);
                      onClose();
                    }}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Target size={12} style={{ marginRight: '6px' }} />
                    Start Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

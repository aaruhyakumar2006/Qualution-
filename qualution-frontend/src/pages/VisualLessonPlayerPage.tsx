import React, { useEffect } from 'react';
import { GroverTheoryPresenter } from '../components/teaching/grover/GroverTheoryPresenter';

export interface VisualLessonPlayerPageProps {
  lessonId?: string;
  onNavigateBack?: () => void;
  onLaunchPracticalLab?: (lessonId: string) => void;
}

export const VisualLessonPlayerPage: React.FC<VisualLessonPlayerPageProps> = ({
  lessonId,
  onNavigateBack,
  onLaunchPracticalLab,
}) => {
  const queryLesson = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('lesson')
    : null;
  const activeId = lessonId || queryLesson;
  const isGrover = activeId === 'lesson-8-grovers-search' || activeId === 'grover' || activeId === 'lesson-8';

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LAUNCH_PRACTICAL_LAB') {
        if (onLaunchPracticalLab) {
          onLaunchPracticalLab(event.data.lessonId || 'lesson-8-grovers-search');
        } else {
          window.location.href = `/?assessment=${event.data.lessonId || 'lesson-8-grovers-search'}`;
        }
      } else if (event.data?.type === 'EXIT_LESSON') {
        if (onNavigateBack) {
          onNavigateBack();
        } else {
          window.location.href = '/?view=learn';
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLaunchPracticalLab, onNavigateBack]);

  const isInteractive = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('interactive') === 'true'
    : false;

  if (isGrover && isInteractive) {
    return (
      <GroverTheoryPresenter
        onLaunchWorkbench={() => {
          if (onLaunchPracticalLab) {
            onLaunchPracticalLab('lesson-8-grovers-search');
          } else {
            window.location.href = '/?assessment=lesson-8-grovers-search';
          }
        }}
        onNavigateBack={() => {
          if (onNavigateBack) {
            onNavigateBack();
          } else {
            window.location.href = '/?view=learn';
          }
        }}
      />
    );
  }

  const playerSrc = isGrover ? '/player-grover.html' : '/player.html';
  const playerTitle = isGrover ? "QUALUTION — Grover's Search Algorithm" : 'QUALUTION — Classical Bits vs. Qubits';

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#030712', overflow: 'hidden', margin: 0, padding: 0 }}>
      <iframe
        src={playerSrc}
        title={playerTitle}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="autoplay; fullscreen"
      />
    </div>
  );
};


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VisualLessonPlayerPage } from './VisualLessonPlayerPage';

describe('VisualLessonPlayerPage — Video Theory Player', () => {
  it('renders default /player.html for classical-vs-qubit', () => {
    render(<VisualLessonPlayerPage />);
    const iframe = screen.getByTitle('QUALUTION — Classical Bits vs. Qubits');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', '/player.html');
  });

  it('renders /player-grover.html when lessonId is lesson-8-grovers-search', () => {
    render(<VisualLessonPlayerPage lessonId="lesson-8-grovers-search" />);
    const iframe = screen.getByTitle("QUALUTION — Grover's Search Algorithm");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', '/player-grover.html');
  });

  it('responds to LAUNCH_PRACTICAL_LAB postMessage from iframe', () => {
    const onLaunchLab = vi.fn();
    render(<VisualLessonPlayerPage lessonId="lesson-8-grovers-search" onLaunchPracticalLab={onLaunchLab} />);

    fireEvent(window, new MessageEvent('message', {
      data: { type: 'LAUNCH_PRACTICAL_LAB', lessonId: 'lesson-8-grovers-search' }
    }));

    expect(onLaunchLab).toHaveBeenCalledWith('lesson-8-grovers-search');
  });

  it('responds to EXIT_LESSON postMessage from iframe', () => {
    const onNavigateBack = vi.fn();
    render(<VisualLessonPlayerPage lessonId="lesson-8-grovers-search" onNavigateBack={onNavigateBack} />);

    fireEvent(window, new MessageEvent('message', {
      data: { type: 'EXIT_LESSON' }
    }));

    expect(onNavigateBack).toHaveBeenCalled();
  });
});

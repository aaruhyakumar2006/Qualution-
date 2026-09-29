import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LearnPage, SINGLE_QUBIT_TASK_MODULES } from './LearnPage';
import { ThemeProvider } from '../features/theme/ThemeContext';
import { AuthProvider } from '../features/auth/AuthContext';
import { QUANTUM_CURRICULUM } from '../features/learning/curriculumData';
import { resetLearningProgress } from '../features/learning/assessmentEngine';

describe('LearnPage — Quantum Computing Academy', () => {
  const onLaunchIDE = vi.fn();
  const onNavigateHome = vi.fn();
  const onOpenLogin = vi.fn();
  const onOpenSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    resetLearningProgress();
  });

  const renderLearnPage = () => {
    return render(
      <ThemeProvider>
        <AuthProvider>
          <LearnPage
            onLaunchIDE={onLaunchIDE}
            onNavigateHome={onNavigateHome}
            onOpenLogin={onOpenLogin}
            onOpenSignUp={onOpenSignUp}
          />
        </AuthProvider>
      </ThemeProvider>
    );
  };

  it('renders the Academy top navigation and hero with curriculum overview', () => {
    renderLearnPage();

    expect(screen.getByTestId('academy-brand-btn')).toBeInTheDocument();
    expect(screen.getByText('QUALUTION')).toBeInTheDocument();
    expect(screen.getByText('ACADEMY')).toBeInTheDocument();
    expect(screen.getByText('Quantum Computing')).toBeInTheDocument();
    expect(screen.getByText(/0 of 12 Lessons Completed/i)).toBeInTheDocument();
  });

  it('renders all 12 curriculum lessons with formulas and assessment buttons', () => {
    renderLearnPage();

    for (const lesson of QUANTUM_CURRICULUM) {
      expect(screen.getAllByText(lesson.title).length).toBeGreaterThan(0);
      expect(screen.getByTestId(`launch-assessment-btn-${lesson.id}`)).toBeInTheDocument();
    }
  });

  it('triggers onLaunchIDE with lesson starter circuit when clicking assessment CTA', () => {
    renderLearnPage();

    const lesson1 = QUANTUM_CURRICULUM[0];
    const launchBtn = screen.getByTestId(`launch-assessment-btn-${lesson1.id}`);
    fireEvent.click(launchBtn);

    expect(onLaunchIDE).toHaveBeenCalledTimes(1);
    expect(onLaunchIDE).toHaveBeenCalledWith(lesson1.assessment.starterCircuit, lesson1);
  });

  it('toggles theory accordion and submits quiz answer with feedback', () => {
    renderLearnPage();

    const lesson1 = QUANTUM_CURRICULUM[0];
    // By default Lesson 1 theory is expanded
    const quizQuestion = screen.getByText(lesson1.quiz.question);
    expect(quizQuestion).toBeInTheDocument();

    // Click the correct option: index 1
    const correctOptionText = lesson1.quiz.options[lesson1.quiz.correctIndex];
    const correctOptionBtn = screen.getByText(correctOptionText);
    fireEvent.click(correctOptionBtn);

    expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
  });

  it('interacts with the live assessment sidebar HUD', () => {
    renderLearnPage();

    const hudLaunchBtn = screen.getByTestId('hud-launch-assessment-btn');
    expect(hudLaunchBtn).toBeInTheDocument();

    fireEvent.click(hudLaunchBtn);
    expect(onLaunchIDE).toHaveBeenCalledTimes(1);
  });

  it('renders all 3 curriculum tracks and all 12 modules with beats and gates', () => {
    renderLearnPage();

    expect(screen.getByTestId('tracks-overview')).toBeInTheDocument();
    expect(screen.getByTestId('track-card-track-1')).toBeInTheDocument();
    expect(screen.getByTestId('track-card-track-2')).toBeInTheDocument();
    expect(screen.getByTestId('track-card-track-3')).toBeInTheDocument();

    for (const lesson of QUANTUM_CURRICULUM) {
      const beatCard = screen.getByTestId(`module-beat-${lesson.id}`);
      expect(beatCard).toBeInTheDocument();
      expect(within(beatCard).getByText(lesson.theoryBeat)).toBeInTheDocument();
      expect(within(beatCard).getByText(lesson.practicalBeat)).toBeInTheDocument();
      expect(within(beatCard).getByText(lesson.assessmentGate)).toBeInTheDocument();
    }
  });

  it('renders Grover search algorithm and launches practical lab assessment on click', () => {
    renderLearnPage();

    const groverLabBtn = screen.getByTestId('launch-assessment-btn-lesson-8-grovers-search');
    expect(groverLabBtn).toBeInTheDocument();
    expect(groverLabBtn).toHaveTextContent('Practice Lab');

    fireEvent.click(groverLabBtn);
    expect(onLaunchIDE).toHaveBeenCalledTimes(1);
    expect(onLaunchIDE).toHaveBeenCalledWith(
      expect.objectContaining({ qubits: 2, measure: true }),
      expect.objectContaining({ id: 'lesson-8-grovers-search' })
    );
  });

  it('renders all 19 challenges in the challenges section and supports category filtering', () => {
    renderLearnPage();

    expect(screen.getByTestId('all-challenges-section')).toBeInTheDocument();
    expect(screen.getByTestId('challenges-grid')).toBeInTheDocument();

    // Verify filter buttons exist
    expect(screen.getByTestId('filter-all-challenges')).toBeInTheDocument();
    expect(screen.getByTestId('filter-guided-challenges')).toBeInTheDocument();
    expect(screen.getByTestId('filter-foundation-challenges')).toBeInTheDocument();
    expect(screen.getByTestId('filter-algorithm-challenges')).toBeInTheDocument();
    expect(screen.getByTestId('filter-advanced-challenges')).toBeInTheDocument();

    // Initially all 19 challenges are rendered
    expect(screen.getByTestId('challenge-card-s1-initialize-measure')).toBeInTheDocument();
    expect(screen.getByTestId('challenge-card-challenge-lesson-1')).toBeInTheDocument();
    expect(screen.getByTestId('challenge-card-challenge-lesson-8')).toBeInTheDocument();
    expect(screen.getByTestId('challenge-card-challenge-lesson-12')).toBeInTheDocument();

    // Filter to Guided Lab (7 steps)
    fireEvent.click(screen.getByTestId('filter-guided-challenges'));
    expect(screen.getByTestId('challenge-card-s1-initialize-measure')).toBeInTheDocument();
    expect(screen.getByTestId('challenge-card-s1-x-gate')).toBeInTheDocument();
    expect(screen.getByTestId('challenge-card-s1-assessment')).toBeInTheDocument();
    expect(screen.queryByTestId('challenge-card-challenge-lesson-1')).not.toBeInTheDocument();

    // Filter to Foundations (4 steps)
    fireEvent.click(screen.getByTestId('filter-foundation-challenges'));
    expect(screen.getByTestId('challenge-card-challenge-lesson-1')).toBeInTheDocument();
    expect(screen.getByTestId('challenge-card-challenge-lesson-4')).toBeInTheDocument();
    expect(screen.queryByTestId('challenge-card-s1-initialize-measure')).not.toBeInTheDocument();
  });

  it('launches challenge task directly when clicking Start Task', () => {
    renderLearnPage();

    const startTaskBtn = screen.getByTestId('launch-challenge-btn-s1-initialize-measure');
    expect(startTaskBtn).toBeInTheDocument();

    fireEvent.click(startTaskBtn);
    expect(onLaunchIDE).toHaveBeenCalledTimes(1);
    expect(onLaunchIDE).toHaveBeenCalledWith(
      SINGLE_QUBIT_TASK_MODULES['s1-initialize-measure'].assessment.starterCircuit,
      SINGLE_QUBIT_TASK_MODULES['s1-initialize-measure']
    );
  });

  it('launches curriculum assessment challenge directly when clicking Launch IDE', () => {
    renderLearnPage();

    const lesson1Mod = QUANTUM_CURRICULUM[0];
    const launchIdeBtn = screen.getByTestId('launch-challenge-btn-challenge-lesson-1');
    expect(launchIdeBtn).toBeInTheDocument();

    fireEvent.click(launchIdeBtn);
    expect(onLaunchIDE).toHaveBeenCalledTimes(1);
    expect(onLaunchIDE).toHaveBeenCalledWith(lesson1Mod.assessment.starterCircuit, lesson1Mod);
  });
});

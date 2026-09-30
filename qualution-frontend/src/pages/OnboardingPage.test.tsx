import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingPage } from './OnboardingPage';
import { ThemeProvider } from '../features/theme/ThemeContext';
import { AuthProvider } from '../features/auth/AuthContext';
import * as onboardingApi from '../api/onboardingApi';

vi.mock('../api/onboardingApi', () => ({
  getOnboardingQuestions: vi.fn(),
  submitOnboardingAssessment: vi.fn(),
  getOnboardingStatus: vi.fn(),
}));

describe('OnboardingPage Flow', () => {
  const mockOnNavigateHome = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(onboardingApi.getOnboardingQuestions).mockResolvedValue([
      {
        id: 'q1_superposition',
        dimension: 'knowledge',
        title: 'Quantum Fundamentals',
        prompt: 'What distinguishes a qubit from a classical bit?',
        options: [
          { id: 'A', text: 'Linear combination with probability amplitudes' },
          { id: 'B', text: 'Rapidly fluctuating classical bit' },
        ],
      },
      {
        id: 'q2_interference',
        dimension: 'circuits',
        title: 'Interference Check',
        prompt: 'What is H applied twice?',
        options: [
          { id: 'A', text: 'Returns to original state with certainty' },
          { id: 'B', text: '50/50 random outcome' },
        ],
      },
    ]);

    vi.mocked(onboardingApi.submitOnboardingAssessment).mockResolvedValue({
      level: 'intermediate',
      score: 75,
      dimension_scores: {
        knowledge: 80,
        circuits: 70,
        programming: 75,
        algorithms: 72,
      },
      detected_misconceptions: [],
      recommended_path: [
        'Visualizing Entanglement: Bell State Laboratory',
        'Controlled-NOT Mechanics & Phase Kickback',
      ],
      curriculum_summary: 'Good foundational comprehension with readiness for multi-qubit Bell states.',
      ai_tutor_mode: 'intermediate',
      learner_profile_id: 'test-profile-id',
    });
  });

  const renderComponent = () =>
    render(
      <ThemeProvider>
        <AuthProvider>
          <OnboardingPage
            onNavigateHome={mockOnNavigateHome}
            onComplete={mockOnComplete}
          />
        </AuthProvider>
      </ThemeProvider>
    );

  it('renders Welcome screen with title and features', async () => {
    renderComponent();
    expect(screen.getByText(/Let's build your quantum journey/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostic Awareness Check/i)).toBeInTheDocument();
    expect(screen.getByText(/Let's get started/i)).toBeInTheDocument();
    await waitFor(() => expect(onboardingApi.getOnboardingQuestions).toHaveBeenCalled());
  });

  it('navigates through questions and advances to goals', async () => {
    renderComponent();

    // Click Let's get started
    fireEvent.click(screen.getByText(/Let's get started/i));

    // Question 1
    await waitFor(() => {
      expect(screen.getByText(/Quantum Fundamentals/i)).toBeInTheDocument();
    });

    // Option A
    const optionA = screen.getByText(/Linear combination with probability amplitudes/i);
    fireEvent.click(optionA);

    // Next Question
    const nextBtn = screen.getByRole('button', { name: /Next Question/i });
    fireEvent.click(nextBtn);

    // Question 2
    await waitFor(() => {
      expect(screen.getByText(/Interference Check/i)).toBeInTheDocument();
    });

    // Option A for Q2
    const optionQ2 = screen.getByText(/Returns to original state with certainty/i);
    fireEvent.click(optionQ2);

    // Continue to Goals button
    const continueBtn = screen.getByRole('button', { name: /Continue to Goals/i });
    fireEvent.click(continueBtn);

    // Goals Screen
    await waitFor(() => {
      expect(screen.getByText(/What do you want to accomplish\?/i)).toBeInTheDocument();
    });
  });

  it('submits assessment and renders backend classification and learning path', async () => {
    renderComponent();

    // Start
    fireEvent.click(screen.getByText(/Let's get started/i));

    // Q1
    await waitFor(() => expect(screen.getByText(/Quantum Fundamentals/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Linear combination with probability amplitudes/i));
    fireEvent.click(screen.getByRole('button', { name: /Next Question/i }));

    // Q2
    await waitFor(() => expect(screen.getByText(/Interference Check/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Returns to original state with certainty/i));
    fireEvent.click(screen.getByRole('button', { name: /Continue to Goals/i }));

    // Goals screen -> Continue to Learning Style
    await waitFor(() => expect(screen.getByText(/What do you want to accomplish\?/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Continue to Learning Style/i }));

    // Style screen -> Submit
    await waitFor(() => expect(screen.getByText(/How do you prefer to learn\?/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Analyze & Build Learning Path/i }));

    // Result screen
    await waitFor(() => {
      expect(screen.getByText(/Assessed Level: INTERMEDIATE/i)).toBeInTheDocument();
      expect(screen.getByText(/Your Quantum Studio Profile/i)).toBeInTheDocument();
      expect(screen.getByText(/Visualizing Entanglement: Bell State Laboratory/i)).toBeInTheDocument();
    });

    // Launch Studio button
    const launchBtn = screen.getByRole('button', { name: /Start Learning in Quantum Studio/i });
    fireEvent.click(launchBtn);

    expect(mockOnComplete).toHaveBeenCalled();
  });
});

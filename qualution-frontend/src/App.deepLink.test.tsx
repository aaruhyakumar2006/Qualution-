import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import { App } from './App';

// Mock circuit execution API to return mock simulation results
vi.mock('./api/circuitApi', async () => {
  const actual = await vi.importActual<any>('./api/circuitApi');
  return {
    ...actual,
    checkReadiness: vi.fn().mockResolvedValue({ status: 'ok', backends: ['qiskit_aer'] }),
    runCircuit: vi.fn().mockResolvedValue({
      valid: true,
      simulation: {
        backend: 'qiskit_aer',
        execution_time_ms: 10,
        counts: { '0': 500, '1': 500 },
        probabilities: { '0': 0.5, '1': 0.5 },
        statevector: [
          { real: 0.7071, imag: 0 },
          { real: 0.7071, imag: 0 },
        ],
      },
      visualization: {
        bloch: { x: 1.0, y: 0.0, z: 0.0, purity: 1.0, magnitude: 1.0 },
      },
      metrics: {
        gate_count: 1,
        depth: 1,
        multi_qubit_gates: 0,
        qubit_count: 1,
      },
    }),
  };
});

describe('Lesson Deep-Link and IDE Integration', () => {
  it('loads the IDE and automatically initializes the guided lesson when initialLessonId is passed', async () => {
    await act(async () => {
      render(<App initialRoute="/studio" initialLessonId="s1-hadamard-superposition" />);
    });

    // Quantum Lab IDE should be rendered
    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    // Teaching HUD should be present with lesson title and step
    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('Hadamard Gate & Superposition')).toBeInTheDocument();
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 1 of 10');
    });
  });

  it('parses deep-link route parameter /studio?lesson=s1-hadamard-superposition and mounts Teaching HUD', async () => {
    await act(async () => {
      render(<App initialRoute="/studio?lesson=s1-hadamard-superposition" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('Hadamard Gate & Superposition')).toBeInTheDocument();
    });
  });

  it('parses deep-link route parameter /studio?lesson=s1-initialize-measure and mounts Teaching HUD for Lesson 1', async () => {
    await act(async () => {
      render(<App initialRoute="/studio?lesson=s1-initialize-measure" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('Initialize & Measure a Qubit')).toBeInTheDocument();
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 1 of 8');
    });
  });

  it('parses deep-link route parameter /studio?lesson=s1-x-gate and mounts Teaching HUD for Lesson 2', async () => {
    await act(async () => {
      render(<App initialRoute="/studio?lesson=s1-x-gate" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('The Pauli-X Gate: Quantum Bit Flip')).toBeInTheDocument();
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 1 of 9');
    });
  });

  it('parses deep-link route parameter /studio?lesson=s1-z-phase and mounts Teaching HUD for Lesson 4', async () => {
    await act(async () => {
      render(<App initialRoute="/studio?lesson=s1-z-phase" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('Z Gate: Understanding Quantum Phase')).toBeInTheDocument();
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 1 of 12');
    });
  });

  it('parses deep-link route parameter /studio?lesson=s1-gate-ordering and mounts Teaching HUD for Lesson 5', async () => {
    await act(async () => {
      render(<App initialRoute="/studio?lesson=s1-gate-ordering" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText("Gate Ordering: Why Quantum Gates Don't Always Commute")).toBeInTheDocument();
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 1 of 15');
    });
  });

  it('parses deep-link route parameter /studio?lesson=s1-single-qubit-challenge and mounts Teaching HUD for Lesson 6', async () => {
    await act(async () => {
      render(<App initialRoute="/studio?lesson=s1-single-qubit-challenge" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('Single-Qubit Challenge: Predict, Build & Prove')).toBeInTheDocument();
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Step 1 of 11');
    });
  });

  it('parses deep-link route parameter /studio?assessment=s1-assessment and mounts Assessment HUD', async () => {
    await act(async () => {
      render(<App initialRoute="/studio?assessment=s1-assessment" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('Sprint 1 Assessment: Predict, Build & Explain')).toBeInTheDocument();
      expect(screen.getByTestId('teaching-assessment-badge')).toHaveTextContent('ASSESSMENT MODE');
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Task 1 of 14');
    });
  });

  it('parses backward-compatible deep-link parameter /studio?lesson=s1-assessment and mounts Assessment HUD', async () => {
    await act(async () => {
      render(<App initialRoute="/studio?lesson=s1-assessment" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    await waitFor(() => {
      const hud = screen.getByTestId('teaching-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('Sprint 1 Assessment: Predict, Build & Explain')).toBeInTheDocument();
      expect(screen.getByTestId('teaching-assessment-badge')).toHaveTextContent('ASSESSMENT MODE');
      expect(screen.getByTestId('teaching-step-indicator')).toHaveTextContent('Task 1 of 14');
    });
  });

  it('renders normal Quantum Lab when no lesson ID is provided', async () => {
    await act(async () => {
      render(<App initialRoute="/studio" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();
    expect(screen.queryByTestId('teaching-hud')).not.toBeInTheDocument();
  });

  it('parses theoretical lesson deep link /academy?theory=s1-theory-superposition and mounts reader', async () => {
    await act(async () => {
      render(<App initialRoute="/academy?theory=s1-theory-superposition" />);
    });

    expect(screen.getByTestId('learn-page')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('theory-lesson-reader')).toBeInTheDocument();
      expect(screen.getByTestId('theory-lesson-title')).toHaveTextContent('Superposition');
    });
  });

  it('parses deep-link /studio?assessment=lesson-8-grovers-search and mounts Grover Assessment HUD', async () => {
    await act(async () => {
      render(<App initialRoute="/studio?assessment=lesson-8-grovers-search" />);
    });

    expect(screen.getByTestId('ide-page')).toBeInTheDocument();

    await waitFor(() => {
      const hud = screen.getByTestId('ide-assessment-hud');
      expect(hud).toBeInTheDocument();
      expect(within(hud).getByText('2-Qubit Grover Search Implementation')).toBeInTheDocument();
      expect(within(hud).getByText('Verify Assessment')).toBeInTheDocument();
    });
  });
});

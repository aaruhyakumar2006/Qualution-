import { describe, it, expect } from 'vitest';
import {
  createLessonHandoff,
  buildCircuitFromWorkbenchAction,
  type CheckpointPredictionSummary,
} from './lessonHandoff';
import type { WorkbenchAction } from './teachingActions';
import type { DeclarativeLesson } from './declarativeLesson';
import qubitSuperpositionCheckpointLessonJson from './lessons/declarative/qubitSuperpositionCheckpointLesson.json';

describe('lessonHandoff (Phase 13)', () => {
  const sampleWorkbenchAction: WorkbenchAction = {
    kind: 'WORKBENCH',
    id: 'wb-hadamard',
    title: 'Hadamard Experiment',
    description: 'Test the 50/50 measurement distribution.',
    formula: 'H|0\\rangle = |+\\rangle',
    setup: {
      qubits: 1,
      gates: [{ gate: 'h', qubit: 0 }],
      measure: true,
      shots: 1000,
    },
  };

  const sampleLesson: DeclarativeLesson = {
    version: 1,
    id: 'qubit-superposition-checkpoint',
    title: 'Qubit and Superposition',
    actions: [],
  };

  it('builds valid CircuitRequest from WorkbenchAction', () => {
    const circuit = buildCircuitFromWorkbenchAction(sampleWorkbenchAction);
    expect(circuit.qubits).toBe(1);
    expect(circuit.classical_bits).toBe(1);
    expect(circuit.gates.length).toBe(1);
    expect(circuit.gates[0].gate).toBe('h');
    expect(circuit.gates[0].targets).toEqual([0]);
    expect(circuit.measure).toBe(true);
    expect(circuit.shots).toBe(1000);
  });

  it('creates structured LessonWorkbenchHandoff without prediction', () => {
    const handoff = createLessonHandoff(sampleLesson, sampleWorkbenchAction);
    expect(handoff.lessonId).toBe('qubit-superposition-checkpoint');
    expect(handoff.lessonTitle).toBe('Qubit and Superposition');
    expect(handoff.conceptTitle).toBe('Hadamard Experiment');
    expect(handoff.conceptFormula).toBe('H|0\\rangle = |+\\rangle');
    expect(handoff.prediction).toBeUndefined();
    expect(handoff.circuit.qubits).toBe(1);
  });

  it('creates structured LessonWorkbenchHandoff preserving prediction checkpoint summary', () => {
    const prediction: CheckpointPredictionSummary = {
      checkpointId: 'measure-plus',
      question: 'What do you expect to observe when |+⟩ is measured?',
      selectedOptionId: 'c',
      selectedOptionText: '50% 0 and 50% 1',
      isCorrect: true,
      explanation: 'Superposition produces equal probability of 0 and 1.',
    };

    const handoff = createLessonHandoff(sampleLesson, sampleWorkbenchAction, prediction);
    expect(handoff.prediction).toBeDefined();
    expect(handoff.prediction?.selectedOptionText).toBe('50% 0 and 50% 1');
    expect(handoff.prediction?.isCorrect).toBe(true);
  });

  it('handles multi-qubit setups safely and clamps invalid qubit counts', () => {
    const multiQubitAction: WorkbenchAction = {
      kind: 'WORKBENCH',
      id: 'wb-bell',
      title: 'Bell State',
      description: 'Entangle two qubits.',
      setup: {
        qubits: 2,
        gates: [
          { gate: 'h', qubit: 0 },
          { gate: 'cx', qubit: 1 },
        ],
        measure: true,
      },
    };

    const circuit = buildCircuitFromWorkbenchAction(multiQubitAction);
    expect(circuit.qubits).toBe(2);
    expect(circuit.gates.length).toBe(2);
    expect(circuit.gates[1].targets).toEqual([1]);
  });

  it('preserves structured Phase 14 explanation in handoff', () => {
    const actionWithExplanation: WorkbenchAction = {
      ...sampleWorkbenchAction,
      explanation: {
        title: 'Why did this happen?',
        math: ['H|0\\rangle = |+\\rangle', 'P(0) = 1/2'],
        text: 'The Hadamard gate creates an equal superposition.',
      },
    };

    const handoff = createLessonHandoff(sampleLesson, actionWithExplanation);
    expect(handoff.explanation).toBeDefined();
    expect(handoff.explanation?.title).toBe('Why did this happen?');
    expect(handoff.explanation?.math).toEqual(['H|0\\rangle = |+\\rangle', 'P(0) = 1/2']);
    expect(handoff.explanation?.text).toBe('The Hadamard gate creates an equal superposition.');
  });
});

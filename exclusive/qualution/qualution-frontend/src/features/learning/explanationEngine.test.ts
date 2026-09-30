import { describe, it, expect } from 'vitest';
import {
  inferCircuitConcepts,
  recognizeCircuitPattern,
  explainCircuit,
  generatePracticeQuestions,
} from './explanationEngine';
import { GATE_KNOWLEDGE_CATALOG } from './gateKnowledge';
import type { CircuitRequest } from '../circuit/types';

describe('Quantum Learning Layer (Step 20)', () => {
  const bellCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { gate: 'h', targets: [0], column: 0 },
      { gate: 'cx', targets: [0, 1], column: 1 },
    ],
    measure: true,
    shots: 1000,
  };

  const ghzCircuit: CircuitRequest = {
    qubits: 3,
    classical_bits: 3,
    gates: [
      { gate: 'h', targets: [0], column: 0 },
      { gate: 'cx', targets: [0, 1], column: 1 },
      { gate: 'cx', targets: [1, 2], column: 2 },
    ],
    measure: true,
    shots: 1000,
  };

  const nonBellCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { gate: 'x', targets: [0], column: 0 },
      { gate: 'cx', targets: [0, 1], column: 1 },
    ],
    measure: true,
    shots: 1000,
  };

  it('contains comprehensive gate knowledge for all 12 supported gates', () => {
    const supportedGates = ['h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'cx', 'cz', 'swap'];
    for (const g of supportedGates) {
      expect(GATE_KNOWLEDGE_CATALOG[g]).toBeDefined();
      expect(GATE_KNOWLEDGE_CATALOG[g].name).toBeTruthy();
      expect(GATE_KNOWLEDGE_CATALOG[g].beginnerDescription).toBeTruthy();
      expect(GATE_KNOWLEDGE_CATALOG[g].technicalDescription).toBeTruthy();
    }
  });

  it('infers concepts (Superposition & Entanglement) for Bell State', () => {
    const concepts = inferCircuitConcepts(bellCircuit);
    expect(concepts).toContain('Superposition');
    expect(concepts).toContain('Entanglement');
    expect(concepts).toContain('Conditional Operation');
  });

  it('correctly recognizes Bell State pattern', () => {
    const pattern = recognizeCircuitPattern(bellCircuit);
    expect(pattern).not.toBeNull();
    expect(pattern?.patternId).toBe('bell_state');
    expect(pattern?.name).toContain('Bell State');
  });

  it('correctly recognizes GHZ State pattern', () => {
    const pattern = recognizeCircuitPattern(ghzCircuit);
    expect(pattern).not.toBeNull();
    expect(pattern?.patternId).toBe('ghz_state');
    expect(pattern?.name).toContain('GHZ State');
  });

  it('does NOT misidentify X + CX as a Bell State', () => {
    const pattern = recognizeCircuitPattern(nonBellCircuit);
    expect(pattern).toBeNull();
  });

  it('generates structured circuit explanation with step breakdowns', () => {
    const explanation = explainCircuit(bellCircuit, null);
    expect(explanation.title).toContain('Bell State');
    expect(explanation.learningLevel).toBe('Beginner');
    expect(explanation.stepExplanations.length).toBe(2);
    expect(explanation.stepExplanations[0].gateName).toBe('Hadamard Gate');
    expect(explanation.stepExplanations[1].gateName).toContain('Controlled-NOT');
  });

  it('generates deterministic practice questions for Bell State', () => {
    const questions = generatePracticeQuestions(bellCircuit);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].options[questions[0].correctIndex]).toContain('|00⟩ and |11⟩');
  });
});

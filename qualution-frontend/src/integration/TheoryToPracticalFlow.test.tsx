/**
 * Phase 17 Integration Tests
 * 
 * Tests the complete theory → practical transition flow:
 * Theory Lesson → Complete → "Try It Yourself" → Quantum Workbench → Experiment Ready
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getExperimentPreset, hasExperimentPreset, getExperimentsForTheoryLesson } from '../features/learning/experimentPresets';

describe('Phase 17: Theory → Practical Transition', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Experiment Presets Registry', () => {
    it('1. hadamard-superposition experiment exists', () => {
      expect(hasExperimentPreset('hadamard-superposition')).toBe(true);
    });

    it('2. hadamard-superposition has correct circuit structure', () => {
      const experiment = getExperimentPreset('hadamard-superposition');
      
      expect(experiment).toBeDefined();
      expect(experiment?.id).toBe('hadamard-superposition');
      expect(experiment?.circuit).toBeDefined();
      
      // Circuit structure validation
      const circuit = experiment!.circuit;
      expect(circuit.qubits).toBe(1);
      expect(circuit.classical_bits).toBe(1);
      expect(circuit.measure).toBe(true);
      expect(circuit.shots).toBe(1000);
      
      // Gates validation
      expect(circuit.gates).toHaveLength(1);
      expect(circuit.gates[0].gate).toBe('h');
      expect(circuit.gates[0].targets).toEqual([0]);
    });

    it('3. experiment has learning metadata', () => {
      const experiment = getExperimentPreset('hadamard-superposition');
      
      expect(experiment?.name).toBe('Hadamard Superposition');
      expect(experiment?.description).toContain('superposition');
      expect(experiment?.learningObjective).toBeDefined();
      expect(experiment?.expectedOutcome).toContain('50%');
    });

    it('4. experiment is linked to s1-theory-what-is-quantum lesson', () => {
      const experiment = getExperimentPreset('hadamard-superposition');
      
      expect(experiment?.relatedTheoryLessons).toContain('s1-theory-what-is-quantum');
    });

    it('5. can find experiments by theory lesson ID', () => {
      const experiments = getExperimentsForTheoryLesson('s1-theory-what-is-quantum');
      
      expect(experiments.length).toBeGreaterThan(0);
      expect(experiments[0].id).toBe('hadamard-superposition');
    });

    it('6. nonexistent experiment returns undefined', () => {
      expect(hasExperimentPreset('nonexistent-experiment')).toBe(false);
      expect(getExperimentPreset('nonexistent-experiment')).toBeUndefined();
    });

    it('7. theory lesson without experiments returns empty array', () => {
      const experiments = getExperimentsForTheoryLesson('nonexistent-lesson');
      expect(experiments).toEqual([]);
    });
  });

  describe('Circuit Configuration', () => {
    it('8. circuit matches |0⟩ → H → Measure specification', () => {
      const experiment = getExperimentPreset('hadamard-superposition');
      const circuit = experiment!.circuit;
      
      // Initial state: |0⟩ (implicit - 1 qubit initialized to ground state)
      expect(circuit.qubits).toBe(1);
      
      // Gate: H on qubit 0
      expect(circuit.gates[0].gate).toBe('h');
      expect(circuit.gates[0].targets[0]).toBe(0);
      
      // Measurement enabled
      expect(circuit.measure).toBe(true);
    });

    it('9. circuit has valid gate IDs', () => {
      const experiment = getExperimentPreset('hadamard-superposition');
      const circuit = experiment!.circuit;
      
      circuit.gates.forEach(gate => {
        expect(gate.id).toBeDefined();
        expect(typeof gate.id).toBe('string');
      });
    });

    it('10. circuit is in valid CircuitRequest format', () => {
      const experiment = getExperimentPreset('hadamard-superposition');
      const circuit = experiment!.circuit;
      
      // Required fields
      expect(circuit).toHaveProperty('qubits');
      expect(circuit).toHaveProperty('classical_bits');
      expect(circuit).toHaveProperty('gates');
      expect(circuit).toHaveProperty('measure');
      expect(circuit).toHaveProperty('shots');
      
      // Type checks
      expect(typeof circuit.qubits).toBe('number');
      expect(typeof circuit.classical_bits).toBe('number');
      expect(Array.isArray(circuit.gates)).toBe(true);
      expect(typeof circuit.measure).toBe('boolean');
      expect(typeof circuit.shots).toBe('number');
    });
  });

  describe('Transition Flow Validation', () => {
    it('11. experiment preset can be loaded by App.tsx', () => {
      const experimentId = 'hadamard-superposition';
      const experiment = getExperimentPreset(experimentId);
      
      // This is what App.tsx does when navigateTo('ide', {experimentId})
      expect(experiment).toBeDefined();
      expect(experiment?.circuit).toBeDefined();
      
      // Circuit can be set as initialCircuit for IDEPage
      const initialCircuit = experiment!.circuit;
      expect(initialCircuit.gates.length).toBeGreaterThan(0);
    });

    it('12. experiment does NOT have auto-run flag', () => {
      const experiment = getExperimentPreset('hadamard-superposition');
      const circuit = experiment!.circuit;
      
      // Verify there's no auto-run mechanism in the circuit
      // The circuit is just data - execution requires user action
      expect(circuit).not.toHaveProperty('autoRun');
      expect(circuit).not.toHaveProperty('autoExecute');
    });

    it('13. theory lesson ID maps to correct experiment', () => {
      // This is the mapping used by LessonPlayerPage
      const theoryLessonId = 's1-theory-what-is-quantum';
      const experiments = getExperimentsForTheoryLesson(theoryLessonId);
      
      expect(experiments.length).toBe(1);
      expect(experiments[0].id).toBe('hadamard-superposition');
      expect(experiments[0].circuit.gates[0].gate).toBe('h');
    });

    it('14. experiment has proper educational context', () => {
      const experiment = getExperimentPreset('hadamard-superposition');
      
      // Verify educational metadata exists for UI display
      expect(experiment?.name).toBeTruthy();
      expect(experiment?.description).toBeTruthy();
      expect(experiment?.learningObjective).toBeTruthy();
      expect(experiment?.expectedOutcome).toBeTruthy();
    });
  });

  describe('State Cleanup Verification', () => {
    it('15. experiment circuit is independent of theory lesson state', () => {
      const experiment1 = getExperimentPreset('hadamard-superposition');
      const experiment2 = getExperimentPreset('hadamard-superposition');
      
      // Each call returns a fresh reference (no shared mutable state)
      expect(experiment1).not.toBe(experiment2);
      
      // But the content is equivalent
      expect(experiment1?.id).toBe(experiment2?.id);
      expect(experiment1?.circuit.qubits).toBe(experiment2?.circuit.qubits);
    });

    it('16. modifying experiment circuit does not affect registry', () => {
      const experiment = getExperimentPreset('hadamard-superposition');
      const originalGateCount = experiment!.circuit.gates.length;
      
      // Modify the circuit
      experiment!.circuit.gates.push({
        id: 'test-gate',
        gate: 'x',
        targets: [0],
        column: 1,
      });
      
      // Get a fresh copy from registry
      const freshExperiment = getExperimentPreset('hadamard-superposition');
      
      // Original registry data should be unchanged
      expect(freshExperiment!.circuit.gates.length).toBe(originalGateCount);
    });
  });

  describe('Error Handling', () => {
    it('17. handles invalid experiment ID gracefully', () => {
      const experiment = getExperimentPreset('invalid-experiment-id');
      expect(experiment).toBeUndefined();
    });

    it('18. handles empty string experiment ID', () => {
      const experiment = getExperimentPreset('');
      expect(experiment).toBeUndefined();
    });

    it('19. getExperimentsForTheoryLesson handles invalid lesson ID', () => {
      const experiments = getExperimentsForTheoryLesson('invalid-lesson');
      expect(Array.isArray(experiments)).toBe(true);
      expect(experiments.length).toBe(0);
    });
  });

  describe('Integration Points', () => {
    it('20. LessonPlayerPage can check for available experiments', () => {
      const lessonId = 's1-theory-what-is-quantum';
      const experiments = getExperimentsForTheoryLesson(lessonId);
      
      // LessonPlayerPage uses this to show/hide "Try It Yourself" button
      const hasExperiments = experiments.length > 0;
      expect(hasExperiments).toBe(true);
      
      if (hasExperiments) {
        const firstExperimentId = experiments[0].id;
        expect(firstExperimentId).toBe('hadamard-superposition');
      }
    });

    it('21. App.tsx can load experiment and set circuit state', () => {
      const experimentId = 'hadamard-superposition';
      
      // Simulate what App.tsx navigateTo() does
      const experiment = getExperimentPreset(experimentId);
      
      if (experiment) {
        const activeCircuit = experiment.circuit;
        
        // Verify circuit is ready for IDEPage
        expect(activeCircuit).toBeDefined();
        expect(activeCircuit.qubits).toBe(1);
        expect(activeCircuit.gates.length).toBe(1);
        expect(activeCircuit.gates[0].gate).toBe('h');
      } else {
        // Should not reach here for valid experiment
        throw new Error('Experiment should exist');
      }
    });
  });
});

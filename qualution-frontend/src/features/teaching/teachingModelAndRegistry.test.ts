import { describe, it, expect } from 'vitest';
import { lessonRegistry } from './lessonRegistry';
import { s1HadamardSuperpositionLesson } from './lessons/s1HadamardSuperposition';
import type { LessonScript } from './types';

describe('Lesson Model & Registry', () => {
  it('registers and retrieves the canonical Hadamard & Superposition lesson', () => {
    const lesson = lessonRegistry.getLesson('s1-hadamard-superposition');
    expect(lesson).not.toBeNull();
    expect(lesson?.id).toBe('s1-hadamard-superposition');
    expect(lesson?.title).toBe('Hadamard Gate & Superposition');
    expect(lesson?.sprint).toBe(1);
    expect(lesson?.difficulty).toBe('Beginner');
  });

  it('validates strongly-typed lesson schema invariants for s1-hadamard-superposition', () => {
    const lesson: LessonScript = s1HadamardSuperpositionLesson;
    expect(lesson.steps.length).toBe(10);
    expect(lesson.learningObjectives.length).toBeGreaterThan(0);
    expect(lesson.xpReward).toBeGreaterThan(0);

    // Step 1: Initial state
    const step1 = lesson.steps[0];
    expect(step1.id).toBe('step-1-init');
    expect(step1.actions.some((a) => a.type === 'initialize_qubits')).toBe(true);

    // Step 2: Add H gate
    const step2 = lesson.steps[1];
    expect(step2.actions.some((a) => a.type === 'add_gate' && a.gate === 'h')).toBe(true);

    // Step 3: Prediction Checkpoint
    const step3 = lesson.steps[2];
    expect(step3.checkpoint).toBeDefined();
    expect(step3.checkpoint?.options.length).toBeGreaterThanOrEqual(2);
    expect(step3.checkpoint?.correctOptionIndex).toBe(1);

    // Step 4: Simulation Experiment
    const step4 = lesson.steps[3];
    expect(step4.actions.some((a) => a.type === 'run_simulation')).toBe(true);

    // Step 8: Learner Turn
    const step8 = lesson.steps[7];
    expect(step8.takeover).toBeDefined();
    expect(step8.takeover?.instructions.length).toBeGreaterThan(0);

    // Step 9: Transfer Checkpoint
    const step9 = lesson.steps[8];
    expect(step9.checkpoint).toBeDefined();
    expect(step9.checkpoint?.correctOptionIndex).toBe(1);

    // Step 10: Complete Lesson
    const step10 = lesson.steps[9];
    expect(step10.actions.some((a) => a.type === 'complete_lesson')).toBe(true);
  });

  it('safely handles unknown lesson IDs without crashing', () => {
    const unknownLesson = lessonRegistry.getLesson('non-existent-lesson-999');
    expect(unknownLesson).toBeNull();

    // Empty or invalid input
    expect(lessonRegistry.getLesson('')).toBeNull();
    expect(lessonRegistry.getLesson(null)).toBeNull();
    expect(lessonRegistry.getLesson(undefined)).toBeNull();
  });

  it('supports case-insensitive lookup and listing all lessons', () => {
    const lesson = lessonRegistry.getLesson('S1-HADAMARD-SUPERPOSITION');
    expect(lesson).not.toBeNull();
    expect(lesson?.id).toBe('s1-hadamard-superposition');

    const all = lessonRegistry.getAllLessons();
    expect(all.length).toBeGreaterThanOrEqual(7);
    expect(all.some((l) => l.id === 's1-hadamard-superposition')).toBe(true);
    expect(all.some((l) => l.id === 's1-initialize-measure')).toBe(true);
    expect(all.some((l) => l.id === 's1-x-gate')).toBe(true);
    expect(all.some((l) => l.id === 's1-z-phase')).toBe(true);
    expect(all.some((l) => l.id === 's1-gate-ordering')).toBe(true);
    expect(all.some((l) => l.id === 's1-single-qubit-challenge')).toBe(true);
    expect(all.some((l) => l.id === 's1-assessment')).toBe(true);
  });
});

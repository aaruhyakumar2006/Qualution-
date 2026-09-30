import { describe, it, expect, beforeEach } from 'vitest';
import { THEORETICAL_SPRINT_1_LESSONS } from './theoreticalCurriculum';
import {
  getCompletedLessonIds,
  markLessonCompleted,
  resetLearningProgress,
  getTotalXP,
} from './assessmentEngine';

describe('Phase 1 — Theoretical Sprint 1 Curriculum Data Model & Progress', () => {
  beforeEach(() => {
    localStorage.clear();
    resetLearningProgress();
  });

  it('contains exactly 11 Sprint 1 lessons in the exact required order', () => {
    expect(THEORETICAL_SPRINT_1_LESSONS).toHaveLength(11);

    const expectedTitles = [
      'Classical Bits vs. Qubits',
      'Qubits & Quantum States',
      'Computational Basis: |0⟩ and |1⟩',
      'Superposition',
      'Measurement & Probability',
      'Probability Amplitudes',
      'Quantum Phase',
      'Single-Qubit Quantum Gates',
      'From States to Quantum Circuits',
      'Sprint 1 Knowledge Check',
      'Sprint 1 Assessment: Quantum Foundations',
    ];

    THEORETICAL_SPRINT_1_LESSONS.forEach((lesson, idx) => {
      expect(lesson.lessonNumber).toBe(idx + 1);
      expect(lesson.title).toBe(expectedTitles[idx]);
      expect(lesson.sprintNumber).toBe(1);
      expect(lesson.sprintTitle).toBe('Sprint 1 — Quantum Foundations');
      expect(lesson.difficulty).toBe('Beginner');
      expect(lesson.learningObjectives.length).toBeGreaterThanOrEqual(3);
      expect(lesson.sections.length).toBeGreaterThanOrEqual(1);
      expect(lesson.xpReward).toBeGreaterThan(0);
    });
  });

  it('has stable unique IDs for all 11 theoretical lessons', () => {
    const ids = THEORETICAL_SPRINT_1_LESSONS.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(11);

    const expectedIds = [
      's1-theory-what-is-quantum',
      's1-theory-qubits-states',
      's1-theory-computational-basis',
      's1-theory-superposition',
      's1-theory-measurement-probability',
      's1-theory-probability-amplitudes',
      's1-theory-quantum-phase',
      's1-theory-single-qubit-gates',
      's1-theory-states-to-circuits',
      's1-theory-knowledge-check',
      's1-theory-assessment',
    ];

    expect(ids).toEqual(expectedIds);
  });

  it('verifies lessons 1–9 have valid single concept quizzes with explanations', () => {
    for (let i = 0; i < 9; i++) {
      const lesson = THEORETICAL_SPRINT_1_LESSONS[i];
      expect(lesson.quiz, `Lesson ${lesson.id} should have a quiz`).toBeDefined();
      expect(lesson.quiz?.options.length).toBeGreaterThanOrEqual(3);
      expect(lesson.quiz?.correctIndex).toBeGreaterThanOrEqual(0);
      expect(lesson.quiz?.correctIndex).toBeLessThan(lesson.quiz!.options.length);
      expect(lesson.quiz?.explanation.length).toBeGreaterThan(10);
    }
  });

  it('verifies lesson 10 is a multi-question Knowledge Check covering lessons 1-9', () => {
    const kc = THEORETICAL_SPRINT_1_LESSONS[9];
    expect(kc.id).toBe('s1-theory-knowledge-check');
    expect(kc.isKnowledgeCheck).toBe(true);
    expect(kc.knowledgeCheckQuestions).toBeDefined();
    expect(kc.knowledgeCheckQuestions?.length).toBeGreaterThanOrEqual(6);

    kc.knowledgeCheckQuestions?.forEach((q) => {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      expect(q.explanation.length).toBeGreaterThan(10);
    });
  });

  it('verifies lesson 11 is the formal Sprint 1 Assessment with 10 comprehensive questions', () => {
    const assess = THEORETICAL_SPRINT_1_LESSONS[10];
    expect(assess.id).toBe('s1-theory-assessment');
    expect(assess.isAssessment).toBe(true);
    expect(assess.assessmentQuestions).toBeDefined();
    expect(assess.assessmentQuestions?.length).toBe(10);

    assess.assessmentQuestions?.forEach((q) => {
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      expect(q.explanation.length).toBeGreaterThan(10);
    });
  });

  it('integrates with progress tracking and updates XP upon lesson completion', () => {
    expect(getCompletedLessonIds()).toEqual([]);
    expect(getTotalXP()).toBe(0);

    const lesson1 = THEORETICAL_SPRINT_1_LESSONS[0];
    const completed = markLessonCompleted(lesson1.id, lesson1.xpReward);

    expect(completed).toContain('s1-theory-what-is-quantum');
    expect(getCompletedLessonIds()).toContain('s1-theory-what-is-quantum');
    expect(getTotalXP()).toBe(100);

    // Complete lesson 11 (Assessment)
    const assess = THEORETICAL_SPRINT_1_LESSONS[10];
    markLessonCompleted(assess.id, assess.xpReward);

    expect(getCompletedLessonIds()).toContain('s1-theory-assessment');
    expect(getTotalXP()).toBe(450);
  });
});

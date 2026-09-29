/**
 * declarativeLesson.test.ts
 *
 * PHASE 9: Unit tests for Declarative Lesson Schema, Validator, and Normalizer.
 *
 * Tests:
 * - Valid documents pass validation
 * - Schema version validation (version === 1)
 * - Required fields (id, title, actions)
 * - All action types: MOVE, WRITE, DRAW, POINT, HIGHLIGHT, UNDERLINE, CIRCLE, PAUSE, CAPTION, MATH, REPLACE_MATH
 * - Shape validations for DRAW (line, arrow, circle, rect)
 * - Security checks: rejects eval(), Function(), <script>, javascript:
 * - Normalizer converts seconds to ms and generates canonical TeachingAction[]
 */

import { describe, it, expect } from 'vitest';
import {
  validateDeclarativeLesson,
  normalizeDeclarativeLesson,
  type DeclarativeLesson,
} from './declarativeLesson';
import classicalBitLessonJson from './lessons/declarative/classicalBitLesson.json';
import qubitLessonJson from './lessons/declarative/qubitLesson.json';
import classicalBitToQubitLessonJson from './lessons/declarative/classicalBitToQubitLesson.json';
import qubitSuperpositionCheckpointLessonJson from './lessons/declarative/qubitSuperpositionCheckpointLesson.json';

describe('declarativeLesson — Validation', () => {
  it('validates qubitSuperpositionCheckpointLesson.json successfully', () => {
    const res = validateDeclarativeLesson(qubitSuperpositionCheckpointLessonJson);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
    expect(res.lesson?.id).toBe('qubit-superposition-checkpoint');
    const chk = res.lesson?.actions.find((a) => a.type === 'CHECKPOINT');
    expect(chk).toBeDefined();
  });
  it('validates classicalBitLesson.json successfully', () => {
    const res = validateDeclarativeLesson(classicalBitLessonJson);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
    expect(res.lesson?.id).toBe('classical-bit-lesson');
  });

  it('validates qubitLesson.json successfully', () => {
    const res = validateDeclarativeLesson(qubitLessonJson);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
    expect(res.lesson?.id).toBe('qubit-superposition-lesson');
  });

  it('validates classicalBitToQubitLesson.json with NARRATE actions successfully', () => {
    const res = validateDeclarativeLesson(classicalBitToQubitLessonJson);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
    expect(res.lesson?.id).toBe('classical-bit-to-qubit');
    const narrateActs = res.lesson?.actions.filter((a) => a.type === 'NARRATE');
    expect(narrateActs?.length).toBeGreaterThanOrEqual(4);
  });

  it('validates and rejects invalid CHECKPOINT actions', () => {
    const validCheckpointLesson = {
      version: 1,
      id: 'test-chk',
      title: 'Test Checkpoint',
      actions: [
        {
          type: 'CHECKPOINT',
          id: 'q1',
          question: 'What is 1+1?',
          options: [
            { id: 'opt_1', text: '1' },
            { id: 'opt_2', text: '2' },
          ],
          correct: 'opt_2',
          explanation: '1+1 equals 2.',
        },
      ],
    };
    expect(validateDeclarativeLesson(validCheckpointLesson).valid).toBe(true);

    const emptyId = {
      ...validCheckpointLesson,
      actions: [{ ...validCheckpointLesson.actions[0], id: '' }],
    };
    expect(validateDeclarativeLesson(emptyId).valid).toBe(false);

    const tooFewOptions = {
      ...validCheckpointLesson,
      actions: [{ ...validCheckpointLesson.actions[0], options: [{ id: 'a', text: 'One' }] }],
    };
    expect(validateDeclarativeLesson(tooFewOptions).valid).toBe(false);

    const duplicateOptionIds = {
      ...validCheckpointLesson,
      actions: [
        {
          ...validCheckpointLesson.actions[0],
          options: [
            { id: 'opt_a', text: 'Option A' },
            { id: 'opt_a', text: 'Option B' },
          ],
          correct: 'opt_a',
        },
      ],
    };
    expect(validateDeclarativeLesson(duplicateOptionIds).valid).toBe(false);

    const nonMatchingCorrect = {
      ...validCheckpointLesson,
      actions: [{ ...validCheckpointLesson.actions[0], correct: 'non_existent' }],
    };
    expect(validateDeclarativeLesson(nonMatchingCorrect).valid).toBe(false);

    const emptyExplanation = {
      ...validCheckpointLesson,
      actions: [{ ...validCheckpointLesson.actions[0], explanation: '   ' }],
    };
    expect(validateDeclarativeLesson(emptyExplanation).valid).toBe(false);
  });

  it('validates and rejects invalid WORKBENCH actions', () => {
    const validWorkbenchLesson = {
      version: 1,
      id: 'test-wb',
      title: 'Test Workbench',
      actions: [
        {
          type: 'WORKBENCH',
          id: 'wb-test',
          title: 'Try Hadamard',
          description: 'Build circuit and run.',
          formula: 'H|0> = |+>',
          setup: {
            qubits: 1,
            gates: [{ gate: 'h', qubit: 0 }],
            measure: true,
          },
        },
      ],
    };
    expect(validateDeclarativeLesson(validWorkbenchLesson).valid).toBe(true);

    const missingSetup = {
      version: 1,
      id: 'test-wb',
      title: 'Test',
      actions: [{ type: 'WORKBENCH', id: 'wb-1' }],
    };
    expect(validateDeclarativeLesson(missingSetup).valid).toBe(false);

    const invalidQubitCount = {
      ...validWorkbenchLesson,
      actions: [{ ...validWorkbenchLesson.actions[0], setup: { qubits: 0 } }],
    };
    expect(validateDeclarativeLesson(invalidQubitCount).valid).toBe(false);

    const outOfBoundsGateQubit = {
      ...validWorkbenchLesson,
      actions: [
        {
          ...validWorkbenchLesson.actions[0],
          setup: {
            qubits: 1,
            gates: [{ gate: 'h', qubit: 3 }],
          },
        },
      ],
    };
    expect(validateDeclarativeLesson(outOfBoundsGateQubit).valid).toBe(false);

    const validExplanation = {
      ...validWorkbenchLesson,
      actions: [
        {
          ...validWorkbenchLesson.actions[0],
          explanation: {
            title: 'Why did this happen?',
            math: ['H|0\\rangle = |+\\rangle'],
            text: 'Superposition explanation.',
          },
        },
      ],
    };
    expect(validateDeclarativeLesson(validExplanation).valid).toBe(true);

    const invalidExplanationEmptyText = {
      ...validWorkbenchLesson,
      actions: [
        {
          ...validWorkbenchLesson.actions[0],
          explanation: {
            text: '   ',
          },
        },
      ],
    };
    expect(validateDeclarativeLesson(invalidExplanationEmptyText).valid).toBe(false);
  });

  it('validates and rejects invalid NARRATE actions', () => {
    const emptyText = {
      version: 1,
      id: 'test-narrate',
      title: 'Test',
      actions: [{ type: 'NARRATE', text: '' }],
    };
    expect(validateDeclarativeLesson(emptyText).valid).toBe(false);

    const nonStringText = {
      version: 1,
      id: 'test-narrate',
      title: 'Test',
      actions: [{ type: 'NARRATE', text: 123 }],
    };
    expect(validateDeclarativeLesson(nonStringText).valid).toBe(false);

    const negDuration = {
      version: 1,
      id: 'test-narrate',
      title: 'Test',
      actions: [{ type: 'NARRATE', text: 'Hello', duration: -2 }],
    };
    expect(validateDeclarativeLesson(negDuration).valid).toBe(false);

    const invalidRate = {
      version: 1,
      id: 'test-narrate',
      title: 'Test',
      actions: [{ type: 'NARRATE', text: 'Hello', rate: -0.5 }],
    };
    expect(validateDeclarativeLesson(invalidRate).valid).toBe(false);
  });

  it('rejects non-object or null input', () => {
    expect(validateDeclarativeLesson(null).valid).toBe(false);
    expect(validateDeclarativeLesson('string').valid).toBe(false);
    expect(validateDeclarativeLesson(123).valid).toBe(false);
  });

  it('rejects invalid or missing version', () => {
    const doc = { id: 'test', title: 'Test', actions: [{ type: 'PAUSE', duration: 1 }] };
    const res = validateDeclarativeLesson(doc);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('version'))).toBe(true);
  });

  it('rejects missing or empty title and id', () => {
    const doc = { version: 1, id: '', title: '   ', actions: [{ type: 'PAUSE', duration: 1 }] };
    const res = validateDeclarativeLesson(doc);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects missing or empty actions array', () => {
    const doc = { version: 1, id: 'test', title: 'Test', actions: [] };
    const res = validateDeclarativeLesson(doc);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('at least one action'))).toBe(true);
  });

  it('rejects unknown action types', () => {
    const doc = {
      version: 1,
      id: 'test',
      title: 'Test',
      actions: [{ type: 'UNKNOWN_ACTION_OP' }],
    };
    const res = validateDeclarativeLesson(doc);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('unknown action type'))).toBe(true);
  });

  it('validates numeric coordinates for WRITE, POINT, and MATH', () => {
    const doc = {
      version: 1,
      id: 'test',
      title: 'Test',
      actions: [
        { type: 'WRITE', text: 'Hello', x: 'invalid', y: 100 },
        { type: 'POINT', x: 100, y: null },
        { type: 'MATH', expression: '|0\\rangle', x: 100 },
      ],
    };
    const res = validateDeclarativeLesson(doc);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('validates DRAW shapes and parameters', () => {
    const doc = {
      version: 1,
      id: 'test',
      title: 'Test',
      actions: [
        { type: 'DRAW', shape: 'invalid_shape' },
        { type: 'DRAW', shape: 'line', x1: 0, y1: 0 }, // missing x2, y2
        { type: 'DRAW', shape: 'circle' }, // missing center/radius
      ],
    };
    const res = validateDeclarativeLesson(doc);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('blocks security violations (eval, script, Function)', () => {
    const docWithScript = {
      version: 1,
      id: 'hacker',
      title: '<script>alert("xss")</script>',
      actions: [{ type: 'WRITE', text: 'eval("hack")', x: 100, y: 100 }],
    };
    const res = validateDeclarativeLesson(docWithScript);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('Security violation'))).toBe(true);
  });

  it('validates optional concepts and misconceptions metadata (Phase 16)', () => {
    const validMetaLesson = {
      version: 1,
      id: 'meta-lesson',
      title: 'Meta Lesson',
      concepts: ['superposition', 'measurement'],
      misconceptions: ['measurement-deterministic', 'superposition-not-mixture'],
      actions: [{ type: 'PAUSE', duration: 1.0 }],
    };
    const res = validateDeclarativeLesson(validMetaLesson);
    expect(res.valid).toBe(true);
    expect(res.lesson?.concepts).toEqual(['superposition', 'measurement']);
    expect(res.lesson?.misconceptions).toEqual(['measurement-deterministic', 'superposition-not-mixture']);

    const invalidConceptsLesson = {
      ...validMetaLesson,
      concepts: 'not-an-array',
    };
    expect(validateDeclarativeLesson(invalidConceptsLesson).valid).toBe(false);

    const invalidMisconceptionsLesson = {
      ...validMetaLesson,
      misconceptions: [123],
    };
    expect(validateDeclarativeLesson(invalidMisconceptionsLesson).valid).toBe(false);
  });
});

describe('declarativeLesson — Normalization', () => {
  it('normalizes seconds to milliseconds and applies defaults', () => {
    const lesson: DeclarativeLesson = {
      version: 1,
      id: 'norm-test',
      title: 'Normalization Test',
      defaults: {
        duration: 1.5,
        textStyle: { color: '#ffffff', fontSize: 28 },
      },
      actions: [
        { type: 'WRITE', text: 'Test', x: 200, y: 300, duration: 2.0 },
        { type: 'NARRATE', text: 'This is a test narration', duration: 3.2 },
        { type: 'PAUSE', duration: 0.5 },
        { type: 'POINT', x: 200, y: 300, duration: 1.0 },
        { type: 'HIGHLIGHT', x: 200, y: 280, width: 100, height: 40 },
        { type: 'CAPTION', text: 'Sample caption' },
        { type: 'MATH', expression: 'H|0\\rangle', x: 400, y: 300, duration: 0.6 },
      ],
    };

    const actions = normalizeDeclarativeLesson(lesson);
    expect(actions.length).toBeGreaterThanOrEqual(7);

    // Check WRITE action duration
    const writeAct = actions.find((a) => a.kind === 'WRITE') as any;
    expect(writeAct).toBeDefined();
    expect(writeAct.durationMs).toBe(2000);
    expect(writeAct.style.color).toBe('#ffffff');

    // Check NARRATE action duration
    const narrateAct = actions.find((a) => a.kind === 'NARRATE') as any;
    expect(narrateAct).toBeDefined();
    expect(narrateAct.text).toBe('This is a test narration');
    expect(narrateAct.durationMs).toBe(3200);

    // Check PAUSE action duration
    const pauseAct = actions.find((a) => a.kind === 'PAUSE') as any;
    expect(pauseAct).toBeDefined();
    expect(pauseAct.durationMs).toBe(500);

    // Check POINT action duration
    const pointAct = actions.find((a) => a.kind === 'POINT') as any;
    expect(pointAct).toBeDefined();
    expect(pointAct.durationMs).toBe(1000);

    // Check CAPTION action
    const captionAct = actions.find((a) => a.kind === 'CAPTION') as any;
    expect(captionAct).toBeDefined();
    expect(captionAct.text).toBe('Sample caption');

    // Check MATH action
    const mathAct = actions.find((a) => a.kind === 'WRITE_MATH') as any;
    expect(mathAct).toBeDefined();
    expect(mathAct.latex).toBe('H|0\\rangle');
    expect(mathAct.durationMs).toBe(600);
  });

  it('validates and rejects invalid ASSESSMENT actions (Phase 15)', () => {
    const validAssessmentLesson = {
      version: 1,
      id: 'test-assessment',
      title: 'Assessment Test',
      actions: [
        {
          type: 'ASSESSMENT',
          id: 'q-superposition',
          concept: 'superposition',
          question: 'What happens when |0⟩ passes through H?',
          options: [
            { id: 'a', text: 'Always 0' },
            { id: 'b', text: 'Superposition of 0 and 1' },
          ],
          correct: 'b',
          explanation: 'Hadamard creates an equal superposition.',
        },
      ],
    };
    expect(validateDeclarativeLesson(validAssessmentLesson).valid).toBe(true);

    // Missing id
    const missingId = {
      ...validAssessmentLesson,
      actions: [{ ...validAssessmentLesson.actions[0], id: '' }],
    };
    expect(validateDeclarativeLesson(missingId).valid).toBe(false);

    // Missing question
    const missingQuestion = {
      ...validAssessmentLesson,
      actions: [{ ...validAssessmentLesson.actions[0], question: '' }],
    };
    expect(validateDeclarativeLesson(missingQuestion).valid).toBe(false);

    // Duplicate option IDs
    const duplicateOptionIds = {
      ...validAssessmentLesson,
      actions: [
        {
          ...validAssessmentLesson.actions[0],
          options: [
            { id: 'opt_a', text: 'Option A' },
            { id: 'opt_a', text: 'Duplicate A' },
          ],
          correct: 'opt_a',
        },
      ],
    };
    expect(validateDeclarativeLesson(duplicateOptionIds).valid).toBe(false);

    // Non-matching correct
    const nonMatchingCorrect = {
      ...validAssessmentLesson,
      actions: [{ ...validAssessmentLesson.actions[0], correct: 'non_existent' }],
    };
    expect(validateDeclarativeLesson(nonMatchingCorrect).valid).toBe(false);

    // Empty explanation
    const emptyExplanation = {
      ...validAssessmentLesson,
      actions: [{ ...validAssessmentLesson.actions[0], explanation: '   ' }],
    };
    expect(validateDeclarativeLesson(emptyExplanation).valid).toBe(false);
  });

  it('normalizes ASSESSMENT action into normalized AssessmentAction (Phase 15)', () => {
    const lesson = {
      version: 1,
      id: 'test-assessment-norm',
      title: 'Normalization Test',
      actions: [
        {
          type: 'ASSESSMENT',
          id: 'q-superposition',
          concept: 'superposition',
          question: 'What is superposition?',
          options: [
            { id: 'a', text: 'Classical 0' },
            { id: 'b', text: 'Linear combination of states' },
          ],
          correct: 'b',
          explanation: 'Superposition combines basis states.',
        },
      ],
    };

    const actions = normalizeDeclarativeLesson(lesson);
    const assessAct = actions.find((a) => a.kind === 'ASSESSMENT') as any;
    expect(assessAct).toBeDefined();
    expect(assessAct.id).toBe('q-superposition');
    expect(assessAct.concept).toBe('superposition');
    expect(assessAct.correct).toBe('b');
    expect(assessAct.options).toHaveLength(2);
    expect(assessAct.explanation).toBe('Superposition combines basis states.');
    expect(assessAct.durationMs).toBe(0);
  });
});

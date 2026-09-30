/**
 * lessonValidator.test.ts
 *
 * PHASE 15: Comprehensive validation tests for invalid lesson scenarios.
 *
 * Tests 20+ invalid lesson scenarios to ensure the application never crashes
 * due to malformed lesson data.
 */

import { describe, it, expect } from 'vitest';
import {
  validateLesson,
  formatValidationErrors,
  MAX_LESSON_SIZE_BYTES,
  MAX_TOTAL_ACTIONS,
  MAX_COORDINATE,
  MIN_COORDINATE,
  MAX_DURATION_MS,
  MAX_SCALE,
  MIN_SCALE,
} from './lessonValidator';

// ── Test Helpers ───────────────────────────────────────────────────────────

const MINIMAL_VALID = {
  v: 1,
  id: 'test',
  title: 'Test Lesson',
  steps: [{ id: 's1', cmds: [] }],
};

function expectInvalid(input: unknown, categoryMatch?: string) {
  const result = validateLesson(input);
  expect(result.valid).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
  if (categoryMatch) {
    expect(result.errors.some((e) => e.category === categoryMatch)).toBe(true);
  }
  return result;
}

function expectValid(input: unknown) {
  const result = validateLesson(input);
  expect(result.valid, `Expected valid but got errors: ${JSON.stringify(result.errors)}`).toBe(true);
  expect(result.errors.filter((e) => e.severity === 'CRITICAL')).toHaveLength(0);
  return result;
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('lessonValidator — JSON parsing', () => {
  it('1. accepts valid JSON object', () => {
    expectValid(MINIMAL_VALID);
  });

  it('2. handles empty JSON gracefully', () => {
    const result = expectInvalid('', 'JSON_PARSE');
    expect(result.meta.lessonId).toBe('unknown');
  });

  it('3. handles malformed JSON with syntax error', () => {
    expectInvalid('{ "v": 1, "id": "test" invalid }', 'JSON_PARSE');
  });

  it('4. handles truncated JSON', () => {
    expectInvalid('{ "v": 1, "id": "test", "title": "Test", "steps": [', 'JSON_PARSE');
  });

  it('5. handles invalid JSON with trailing comma', () => {
    expectInvalid('{ "v": 1, "id": "test", }', 'JSON_PARSE');
  });

  it('6. accepts pre-parsed object (not string)', () => {
    expectValid(MINIMAL_VALID);
  });
});

describe('lessonValidator — schema version', () => {
  it('7. accepts version 1', () => {
    expectValid({ ...MINIMAL_VALID, v: 1 });
  });

  it('8. rejects missing version', () => {
    const { v, ...rest } = MINIMAL_VALID;
    expectInvalid(rest, 'SCHEMA');
  });

  it('9. rejects unsupported version 2', () => {
    expectInvalid({ ...MINIMAL_VALID, v: 2 }, 'SCHEMA');
  });

  it('10. rejects version as string', () => {
    expectInvalid({ ...MINIMAL_VALID, v: '1' }, 'SCHEMA');
  });
});

describe('lessonValidator — required metadata', () => {
  it('11. rejects missing id', () => {
    const { id, ...rest } = MINIMAL_VALID;
    expectInvalid(rest, 'SCHEMA');
  });

  it('12. rejects empty id', () => {
    expectInvalid({ ...MINIMAL_VALID, id: '' }, 'SCHEMA');
  });

  it('13. rejects missing title', () => {
    const { title, ...rest } = MINIMAL_VALID;
    expectInvalid(rest, 'SCHEMA');
  });

  it('14. rejects empty title', () => {
    expectInvalid({ ...MINIMAL_VALID, title: '   ' }, 'SCHEMA');
  });

  it('15. rejects missing steps', () => {
    const { steps, ...rest } = MINIMAL_VALID;
    expectInvalid(rest, 'SCHEMA');
  });

  it('16. rejects empty steps array', () => {
    expectInvalid({ ...MINIMAL_VALID, steps: [] }, 'SCHEMA');
  });
});

describe('lessonValidator — numeric safety (NaN, Infinity)', () => {
  it('17. rejects NaN in pause duration', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['p', NaN]] }],
    };
    expectInvalid(lesson, 'NUMERIC');
  });

  it('18. rejects Infinity in pause duration', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['p', Infinity]] }],
    };
    expectInvalid(lesson, 'NUMERIC');
  });

  it('19. rejects negative duration', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['p', -100]] }],
    };
    expectInvalid(lesson, 'NUMERIC');
  });

  it('20. rejects NaN in coordinates', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['m', NaN, 100]] }],
    };
    expectInvalid(lesson, 'NUMERIC');
  });

  it('21. rejects Infinity in coordinates', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['m', 100, Infinity]] }],
    };
    expectInvalid(lesson, 'NUMERIC');
  });

  it('22. warns on out-of-range coordinates', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['m', 5000, 100]] }],
    };
    const result = validateLesson(lesson);
    const warnings = result.errors.filter((e) => e.severity === 'WARNING');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.category === 'NUMERIC')).toBe(true);
  });

  it('23. rejects NaN in scale', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['w', 'text', 100, 100, NaN]] }],
    };
    expectInvalid(lesson, 'NUMERIC');
  });

  it('24. rejects scale out of range', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['w', 'text', 100, 100, 100]] }],
    };
    expectInvalid(lesson, 'NUMERIC');
  });

  it('25. rejects negative scale', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['w', 'text', 100, 100, -1]] }],
    };
    expectInvalid(lesson, 'NUMERIC');
  });
});

describe('lessonValidator — invalid actions', () => {
  it('26. rejects unknown action type', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['unknown', 1, 2, 3]] }],
    };
    expectInvalid(lesson, 'SCHEMA');
  });

  it('27. rejects action with missing parameters', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['m']] }],
    };
    expectInvalid(lesson, 'SCHEMA');
  });

  it('28. rejects write with missing text', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['w', '', 100, 100]] }],
    };
    expectInvalid(lesson, 'SCHEMA');
  });

  it('29. rejects draw with invalid subtype', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['d', 'invalid', 0, 0, 100, 100]] }],
    };
    expectInvalid(lesson, 'SCHEMA');
  });

  it('30. rejects draw rect with negative width', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['d', 'r', 100, 100, -50, 50]] }],
    };
    expectInvalid(lesson, 'NUMERIC');
  });

  it('31. rejects draw circle with negative radius', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['d', 'c', 100, 100, -10]] }],
    };
    expectInvalid(lesson, 'NUMERIC');
  });
});

describe('lessonValidator — reference validation', () => {
  it('32. rejects unknown style reference', () => {
    const lesson = {
      ...MINIMAL_VALID,
      styles: { heading: { scale: 1.5 } },
      steps: [{ id: 's1', cmds: [['ws', 'text', 100, 100, 'unknown']] }],
    };
    expectInvalid(lesson, 'SCHEMA');
  });

  it('33. rejects unknown object reference', () => {
    const lesson = {
      ...MINIMAL_VALID,
      objects: { gate: { type: 'gate-box' as const, label: 'H' } },
      steps: [{ id: 's1', cmds: [['o', 'unknown', 100, 100]] }],
    };
    expectInvalid(lesson, 'SCHEMA');
  });

  it('34. accepts valid style reference', () => {
    const lesson = {
      ...MINIMAL_VALID,
      styles: { heading: { scale: 1.5 } },
      steps: [{ id: 's1', cmds: [['ws', 'text', 100, 100, 'heading']] }],
    };
    expectValid(lesson);
  });

  it('35. accepts valid object reference', () => {
    const lesson = {
      ...MINIMAL_VALID,
      objects: { gate: { type: 'gate-box' as const, label: 'H' } },
      steps: [{ id: 's1', cmds: [['o', 'gate', 100, 100]] }],
    };
    expectValid(lesson);
  });
});

describe('lessonValidator — lesson size limit', () => {
  it('36. accepts lesson under size limit', () => {
    expectValid(MINIMAL_VALID);
  });

  it('37. rejects oversized lesson', () => {
    // Create a lesson that exceeds 80 KB
    const largeText = 'x'.repeat(85_000);
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['w', largeText, 100, 100]] }],
    };
    expectInvalid(lesson, 'SIZE');
  });
});

describe('lessonValidator — action count limit', () => {
  it('38. accepts lesson with reasonable action count', () => {
    const steps = [{ id: 's1', cmds: Array(100).fill(['p', 100]) }];
    expectValid({ ...MINIMAL_VALID, steps });
  });

  it('39. rejects lesson with excessive action count', () => {
    // Create more than 5000 actions
    const steps = [{ id: 's1', cmds: Array(6000).fill(['p', 100]) }];
    expectInvalid({ ...MINIMAL_VALID, steps }, 'ACTION_COUNT');
  });
});

describe('lessonValidator — corrupted structures', () => {
  it('40. rejects null as lesson', () => {
    expectInvalid(null, 'JSON_PARSE');
  });

  it('41. rejects array as lesson', () => {
    expectInvalid([], 'SCHEMA');
  });

  it('42. rejects string as lesson', () => {
    const result = validateLesson('not json');
    expect(result.valid).toBe(false);
  });

  it('43. rejects step without id', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ cmds: [] }],
    };
    expectInvalid(lesson, 'SCHEMA');
  });

  it('44. rejects step without cmds', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1' }],
    };
    expectInvalid(lesson, 'SCHEMA');
  });

  it('45. rejects duplicate step IDs', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [
        { id: 's1', cmds: [] },
        { id: 's1', cmds: [] },
      ],
    };
    expectInvalid(lesson, 'SCHEMA');
  });
});

describe('lessonValidator — edge cases', () => {
  it('46. accepts lesson with all optional fields', () => {
    const lesson = {
      ...MINIMAL_VALID,
      topic: 'superposition',
      difficulty: 'Beginner' as const,
      estimatedMinutes: 5,
      objectives: ['Learn qubits', 'Understand superposition'],
      defaults: { color: '#fff', mathColor: '#f5c842' },
      styles: { title: { scale: 1.8 } },
      objects: { gate: { type: 'gate-box' as const, label: 'H' } },
    };
    expectValid(lesson);
  });

  it('47. accepts lesson with multiple steps', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [
        { id: 's1', cmds: [['m', 100, 100]] },
        { id: 's2', cmds: [['w', 'text', 200, 200]] },
        { id: 's3', cmds: [['p', 500]] },
      ],
    };
    expectValid(lesson);
  });

  it('48. accepts lesson with complex actions', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [
        {
          id: 's1',
          cmds: [
            ['m', 100, 100],
            ['w', 'Hello', 100, 100, 1.5],
            ['wm', '|\\psi\\rangle', 200, 200],
            ['d', 'l', 0, 0, 100, 100],
            ['d', 'a', 100, 100, 200, 200],
            ['d', 'r', 50, 50, 100, 50],
            ['d', 'c', 300, 300, 30],
            ['h', [100, 100, 200, 50]],
            ['pt', 150, 150],
            ['p', 500],
            ['n', 'narration text'],
            ['clr'],
          ],
        },
      ],
    };
    expectValid(lesson);
  });

  it('49. warns on extremely long duration', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['p', 150_000]] }], // 2.5 minutes
    };
    const result = validateLesson(lesson);
    const warnings = result.errors.filter((e) => e.severity === 'WARNING');
    expect(warnings.some((w) => w.message.includes('duration'))).toBe(true);
  });

  it('50. accepts zero duration pause', () => {
    const lesson = {
      ...MINIMAL_VALID,
      steps: [{ id: 's1', cmds: [['p', 0]] }],
    };
    expectValid(lesson);
  });
});

describe('formatValidationErrors', () => {
  it('formats errors for developers with full details', () => {
    const errors = [
      {
        severity: 'CRITICAL' as const,
        category: 'NUMERIC' as const,
        message: 'duration must be positive',
        lessonId: 'test',
        stepId: 's1',
        actionIndex: 3,
        field: 'duration',
      },
    ];
    const formatted = formatValidationErrors(errors, 'developer');
    expect(formatted).toContain('CRITICAL');
    expect(formatted).toContain('NUMERIC');
    expect(formatted).toContain('test');
    expect(formatted).toContain('s1');
    expect(formatted).toContain('[3]');
  });

  it('formats errors for users with simplified message', () => {
    const errors = [
      {
        severity: 'CRITICAL' as const,
        category: 'NUMERIC' as const,
        message: 'duration must be positive',
      },
    ];
    const formatted = formatValidationErrors(errors, 'user');
    expect(formatted).toContain('Unable to load');
    expect(formatted).not.toContain('CRITICAL');
    expect(formatted).not.toContain('NUMERIC');
  });

  it('returns empty string for no errors', () => {
    const formatted = formatValidationErrors([], 'developer');
    expect(formatted).toBe('');
  });
});

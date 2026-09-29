/**
 * lessonValidator.ts
 *
 * PHASE 15: Comprehensive Lesson Validation Pipeline
 *
 * This validator provides defense-in-depth validation for lesson JSON:
 *
 * Pipeline:
 *   RAW INPUT (string or unknown)
 *     ↓
 *   JSON PARSING (safe, catches syntax errors)
 *     ↓
 *   SIZE VALIDATION (UTF-8 byte size limit)
 *     ↓
 *   SCHEMA VALIDATION (structure, types, required fields)
 *     ↓
 *   NUMERIC SAFETY (NaN, Infinity, negative durations)
 *     ↓
 *   ACTION COUNT LIMIT (prevent excessive actions)
 *     ↓
 *   SEMANTIC VALIDATION (references, coordinates)
 *     ↓
 *   VALIDATED LESSON DOC
 *
 * Design goals:
 * 1. No lesson can crash the application
 * 2. Clear, actionable error messages for developers
 * 3. Single validation pass at load time (not per-frame)
 * 4. Production-safe: hide internal details from learners
 * 5. Deterministic: same input → same result
 */

import { validateLessonDoc, type LessonDoc } from './lessonSchema';

// ── Constants ──────────────────────────────────────────────────────────────

/** Maximum lesson size in bytes (UTF-8 encoded). Production target: 80 KB. */
export const MAX_LESSON_SIZE_BYTES = 80 * 1024; // 80 KB

/**
 * Maximum number of actions across all steps.
 * This prevents accidentally loading lessons with millions of actions.
 * Realistic lessons: 50–500 actions. Safety limit: 5000.
 */
export const MAX_TOTAL_ACTIONS = 5000;

/**
 * Maximum coordinate value (logical board space).
 * Board is typically 1200×700. Allow some margin for off-board animations.
 */
export const MAX_COORDINATE = 2000;

/** Minimum coordinate value. */
export const MIN_COORDINATE = -200;

/**
 * Maximum duration in milliseconds for any single action.
 * Prevents infinite or absurdly long pauses.
 * 2 minutes = 120,000 ms.
 */
export const MAX_DURATION_MS = 120_000;

/**
 * Maximum scale factor for fonts/objects.
 * Prevents rendering extremely large elements.
 */
export const MAX_SCALE = 10.0;

/** Minimum scale factor. */
export const MIN_SCALE = 0.1;

/**
 * Lesson limits object for use by sanitizer and other modules.
 * Exported for backward compatibility with lessonSanitizer.
 */
export const LESSON_LIMITS = {
  DURATION_HARD_LIMIT_MS: MAX_DURATION_MS,
  MAX_COORDINATE,
  MIN_COORDINATE,
  MAX_SCALE,
  MIN_SCALE,
};

// ── Validation Result ──────────────────────────────────────────────────────

export interface LessonValidationResult {
  /** True if the lesson passed all validation checks. */
  valid: boolean;
  /** List of all validation errors. Empty if valid=true. */
  errors: LessonValidationError[];
  /** Validated lesson document (only present if valid=true). */
  lesson?: LessonDoc;
  /** Lesson metadata for error reporting (present even if invalid). */
  meta: {
    lessonId: string;
    title: string;
    sizeBytes: number;
    totalActions: number;
  };
}

export interface LessonValidationError {
  /** Error severity. CRITICAL: cannot proceed. WARNING: proceed with caution. */
  severity: 'CRITICAL' | 'WARNING';
  /** Error category. */
  category: 'JSON_PARSE' | 'SIZE' | 'SCHEMA' | 'NUMERIC' | 'ACTION_COUNT' | 'SEMANTIC';
  /** Human-readable error message. */
  message: string;
  /** Optional lesson ID (if parseable). */
  lessonId?: string;
  /** Optional step ID (if applicable). */
  stepId?: string;
  /** Optional action index within step (if applicable). */
  actionIndex?: number;
  /** Optional action type (if applicable). */
  actionType?: string;
  /** Optional field name (if applicable). */
  field?: string;
}

// ── Validation Functions ───────────────────────────────────────────────────

/**
 * Safe JSON parse. Returns parsed object and any errors.
 */
function safeJsonParse(input: unknown): {
  parsed: unknown;
  errors: LessonValidationError[];
} {
  const errors: LessonValidationError[] = [];

  // Check for null/undefined explicitly
  if (input === null || input === undefined) {
    errors.push({
      severity: 'CRITICAL',
      category: 'JSON_PARSE',
      message: `Input is ${input === null ? 'null' : 'undefined'}. Lesson must be a valid object or JSON string.`,
    });
    return { parsed: null, errors };
  }

  // If already an object, assume it's pre-parsed
  if (typeof input !== 'string') {
    return { parsed: input, errors };
  }

  // Empty string check
  if (input.trim() === '') {
    errors.push({
      severity: 'CRITICAL',
      category: 'JSON_PARSE',
      message: 'Input is empty. Cannot parse empty JSON.',
    });
    return { parsed: null, errors };
  }

  try {
    const parsed = JSON.parse(input);
    return { parsed, errors };
  } catch (e) {
    const err = e as Error;
    errors.push({
      severity: 'CRITICAL',
      category: 'JSON_PARSE',
      message: `Invalid JSON: ${err.message}`,
    });
    return { parsed: null, errors };
  }
}

/**
 * Calculate UTF-8 byte size of a JSON-serializable value.
 */
function getUtf8ByteSize(value: unknown): number {
  try {
    const json = typeof value === 'string' ? value : JSON.stringify(value);
    // Use TextEncoder for accurate UTF-8 byte counting
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(json).length;
    }
    // Fallback: approximate (overestimate for safety)
    return new Blob([json]).size;
  } catch {
    return 0;
  }
}

/**
 * Validate lesson size.
 */
function validateSize(input: unknown): LessonValidationError[] {
  const errors: LessonValidationError[] = [];
  const sizeBytes = getUtf8ByteSize(input);

  if (sizeBytes > MAX_LESSON_SIZE_BYTES) {
    errors.push({
      severity: 'CRITICAL',
      category: 'SIZE',
      message: `Lesson size (${(sizeBytes / 1024).toFixed(1)} KB) exceeds maximum (${MAX_LESSON_SIZE_BYTES / 1024} KB). Production lessons should be 5–80 KB.`,
    });
  }

  return errors;
}

/**
 * Validate numeric safety.
 * Checks for NaN, Infinity, and values outside reasonable ranges.
 */
function validateNumericSafety(doc: any): LessonValidationError[] {
  const errors: LessonValidationError[] = [];
  const lessonId = doc.id ?? 'unknown';

  // Validate defaults
  if (doc.defaults) {
    const d = doc.defaults;
    if (d.strokeWidth !== undefined) {
      if (!isFinite(d.strokeWidth) || d.strokeWidth <= 0 || d.strokeWidth > 20) {
        errors.push({
          severity: 'CRITICAL',
          category: 'NUMERIC',
          message: `defaults.strokeWidth must be finite and in range (0, 20]. Got: ${d.strokeWidth}`,
          lessonId,
          field: 'defaults.strokeWidth',
        });
      }
    }
    if (d.fontSize !== undefined) {
      if (!isFinite(d.fontSize) || d.fontSize < MIN_SCALE || d.fontSize > MAX_SCALE) {
        errors.push({
          severity: 'CRITICAL',
          category: 'NUMERIC',
          message: `defaults.fontSize must be finite and in range [${MIN_SCALE}, ${MAX_SCALE}]. Got: ${d.fontSize}`,
          lessonId,
          field: 'defaults.fontSize',
        });
      }
    }
  }

  // Validate styles
  if (doc.styles) {
    for (const [styleId, style] of Object.entries(doc.styles)) {
      const s = style as any;
      if (s.scale !== undefined) {
        if (!isFinite(s.scale) || s.scale < MIN_SCALE || s.scale > MAX_SCALE) {
          errors.push({
            severity: 'CRITICAL',
            category: 'NUMERIC',
            message: `styles.${styleId}.scale must be finite and in range [${MIN_SCALE}, ${MAX_SCALE}]. Got: ${s.scale}`,
            lessonId,
            field: `styles.${styleId}.scale`,
          });
        }
      }
    }
  }

  // Validate objects
  if (doc.objects) {
    for (const [objId, obj] of Object.entries(doc.objects)) {
      const o = obj as any;
      if (o.length !== undefined) {
        if (!isFinite(o.length) || o.length <= 0 || o.length > 1000) {
          errors.push({
            severity: 'CRITICAL',
            category: 'NUMERIC',
            message: `objects.${objId}.length must be finite and in range (0, 1000]. Got: ${o.length}`,
            lessonId,
            field: `objects.${objId}.length`,
          });
        }
      }
      if (o.size !== undefined) {
        if (!isFinite(o.size) || o.size <= 0 || o.size > 200) {
          errors.push({
            severity: 'CRITICAL',
            category: 'NUMERIC',
            message: `objects.${objId}.size must be finite and in range (0, 200]. Got: ${o.size}`,
            lessonId,
            field: `objects.${objId}.size`,
          });
        }
      }
    }
  }

  // Validate actions in steps
  if (Array.isArray(doc.steps)) {
    for (let si = 0; si < doc.steps.length; si++) {
      const step = doc.steps[si];
      const stepId = step?.id ?? `step[${si}]`;

      if (!Array.isArray(step?.cmds)) continue;

      for (let ci = 0; ci < step.cmds.length; ci++) {
        const cmd = step.cmds[ci];
        if (!Array.isArray(cmd) || cmd.length === 0) continue;

        const [op, ...args] = cmd;
        const prefix = `Step "${stepId}", action[${ci}] (${op})`;

        // Helper to validate coordinate
        const validateCoord = (val: unknown, name: string) => {
          if (typeof val !== 'number') return;
          if (!isFinite(val)) {
            errors.push({
              severity: 'CRITICAL',
              category: 'NUMERIC',
              message: `${prefix}: ${name} must be finite. Got: ${val}`,
              lessonId,
              stepId,
              actionIndex: ci,
              actionType: op as string,
              field: name,
            });
          } else if (val < MIN_COORDINATE || val > MAX_COORDINATE) {
            errors.push({
              severity: 'WARNING',
              category: 'NUMERIC',
              message: `${prefix}: ${name} is outside normal range [${MIN_COORDINATE}, ${MAX_COORDINATE}]. Got: ${val}. This may cause rendering issues.`,
              lessonId,
              stepId,
              actionIndex: ci,
              actionType: op as string,
              field: name,
            });
          }
        };

        // Helper to validate duration
        const validateDuration = (val: unknown) => {
          if (typeof val !== 'number') return;
          if (!isFinite(val)) {
            errors.push({
              severity: 'CRITICAL',
              category: 'NUMERIC',
              message: `${prefix}: duration must be finite. Got: ${val}`,
              lessonId,
              stepId,
              actionIndex: ci,
              actionType: op as string,
              field: 'duration',
            });
          } else if (val < 0) {
            errors.push({
              severity: 'CRITICAL',
              category: 'NUMERIC',
              message: `${prefix}: duration must be non-negative. Got: ${val}`,
              lessonId,
              stepId,
              actionIndex: ci,
              actionType: op as string,
              field: 'duration',
            });
          } else if (val > MAX_DURATION_MS) {
            errors.push({
              severity: 'WARNING',
              category: 'NUMERIC',
              message: `${prefix}: duration (${val} ms) exceeds recommended maximum (${MAX_DURATION_MS} ms).`,
              lessonId,
              stepId,
              actionIndex: ci,
              actionType: op as string,
              field: 'duration',
            });
          }
        };

        // Helper to validate scale
        const validateScale = (val: unknown) => {
          if (typeof val !== 'number') return;
          if (!isFinite(val)) {
            errors.push({
              severity: 'CRITICAL',
              category: 'NUMERIC',
              message: `${prefix}: scale must be finite. Got: ${val}`,
              lessonId,
              stepId,
              actionIndex: ci,
              actionType: op as string,
              field: 'scale',
            });
          } else if (val < MIN_SCALE || val > MAX_SCALE) {
            errors.push({
              severity: 'CRITICAL',
              category: 'NUMERIC',
              message: `${prefix}: scale must be in range [${MIN_SCALE}, ${MAX_SCALE}]. Got: ${val}`,
              lessonId,
              stepId,
              actionIndex: ci,
              actionType: op as string,
              field: 'scale',
            });
          }
        };

        // Helper to validate positive dimension
        const validatePositive = (val: unknown, name: string) => {
          if (typeof val !== 'number') return;
          if (!isFinite(val)) {
            errors.push({
              severity: 'CRITICAL',
              category: 'NUMERIC',
              message: `${prefix}: ${name} must be finite. Got: ${val}`,
              lessonId,
              stepId,
              actionIndex: ci,
              actionType: op as string,
              field: name,
            });
          } else if (val <= 0) {
            errors.push({
              severity: 'CRITICAL',
              category: 'NUMERIC',
              message: `${prefix}: ${name} must be positive. Got: ${val}`,
              lessonId,
              stepId,
              actionIndex: ci,
              actionType: op as string,
              field: name,
            });
          }
        };

        // Validate based on opcode
        switch (op) {
          case 'm': // ["m", x, y]
            validateCoord(args[0], 'x');
            validateCoord(args[1], 'y');
            break;

          case 'w': // ["w", text, x, y, ?scale]
          case 'ws': // ["ws", text, x, y, styleId]
            validateCoord(args[1], 'x');
            validateCoord(args[2], 'y');
            if (args[3] !== undefined && typeof args[3] === 'number') {
              if (op === 'w') validateScale(args[3]);
            }
            break;

          case 'wm': // ["wm", latex, x, y, ?scale]
            validateCoord(args[1], 'x');
            validateCoord(args[2], 'y');
            if (args[3] !== undefined) validateScale(args[3]);
            break;

          case 'd': // ["d", subtype, ...coords]
            const sub = args[0];
            switch (sub) {
              case 'l':
              case 'a':
                validateCoord(args[1], 'x1');
                validateCoord(args[2], 'y1');
                validateCoord(args[3], 'x2');
                validateCoord(args[4], 'y2');
                break;
              case 'r':
                validateCoord(args[1], 'x');
                validateCoord(args[2], 'y');
                validatePositive(args[3], 'w');
                validatePositive(args[4], 'h');
                break;
              case 'c':
                validateCoord(args[1], 'cx');
                validateCoord(args[2], 'cy');
                validatePositive(args[3], 'r');
                break;
              case 'u':
                validateCoord(args[1], 'x');
                validateCoord(args[2], 'y');
                validatePositive(args[3], 'width');
                break;
            }
            break;

          case 'h': // ["h", [x, y, w, h]]
            if (Array.isArray(args[0]) && args[0].length === 4) {
              validateCoord(args[0][0], 'x');
              validateCoord(args[0][1], 'y');
              validatePositive(args[0][2], 'w');
              validatePositive(args[0][3], 'h');
            }
            break;

          case 'pt': // ["pt", x, y]
            validateCoord(args[0], 'x');
            validateCoord(args[1], 'y');
            break;

          case 'p': // ["p", ms]
            validateDuration(args[0]);
            break;

          case 'o': // ["o", objectId, x, y, ?scale]
            validateCoord(args[1], 'x');
            validateCoord(args[2], 'y');
            if (args[3] !== undefined) validateScale(args[3]);
            break;
        }
      }
    }
  }

  return errors;
}

/**
 * Count total actions across all steps.
 */
function countTotalActions(doc: any): number {
  if (!Array.isArray(doc.steps)) return 0;
  return doc.steps.reduce((sum: number, step: any) => {
    return sum + (Array.isArray(step?.cmds) ? step.cmds.length : 0);
  }, 0);
}

/**
 * Validate action count.
 */
function validateActionCount(doc: any): LessonValidationError[] {
  const errors: LessonValidationError[] = [];
  const lessonId = doc.id ?? 'unknown';
  const count = countTotalActions(doc);

  if (count > MAX_TOTAL_ACTIONS) {
    errors.push({
      severity: 'CRITICAL',
      category: 'ACTION_COUNT',
      message: `Total action count (${count}) exceeds maximum (${MAX_TOTAL_ACTIONS}). This may cause performance issues or freeze the application.`,
      lessonId,
    });
  }

  return errors;
}

// ── Main Validation Function ───────────────────────────────────────────────

/**
 * Comprehensive lesson validation pipeline.
 *
 * Validates:
 * 1. JSON parsing (safe, no crashes)
 * 2. Size limits (80 KB production target)
 * 3. Schema structure (using existing lessonSchema validator)
 * 4. Numeric safety (NaN, Infinity, range checks)
 * 5. Action count limits (prevent excessive actions)
 *
 * Returns a detailed validation result with all errors.
 *
 * This function NEVER throws. All errors are collected and returned.
 */
export function validateLesson(input: unknown): LessonValidationResult {
  const allErrors: LessonValidationError[] = [];

  // Step 1: Safe JSON parse
  const { parsed, errors: parseErrors } = safeJsonParse(input);
  allErrors.push(...parseErrors);

  if (parseErrors.length > 0 || !parsed) {
    // Cannot proceed without valid JSON
    return {
      valid: false,
      errors: allErrors,
      meta: {
        lessonId: 'unknown',
        title: 'unknown',
        sizeBytes: 0,
        totalActions: 0,
      },
    };
  }

  // Step 2: Size validation
  const sizeBytes = getUtf8ByteSize(input);
  const sizeErrors = validateSize(input);
  allErrors.push(...sizeErrors);

  // Extract metadata (even if invalid)
  const doc = parsed as any;
  const lessonId = doc.id ?? 'unknown';
  const title = doc.title ?? 'unknown';
  const totalActions = countTotalActions(doc);

  // Step 3: Schema validation
  const schemaResult = validateLessonDoc(parsed);
  if (!schemaResult.valid) {
    allErrors.push(
      ...schemaResult.errors.map((msg) => ({
        severity: 'CRITICAL' as const,
        category: 'SCHEMA' as const,
        message: msg,
        lessonId,
      }))
    );
  }

  // Step 4: Numeric safety validation
  const numericErrors = validateNumericSafety(doc);
  allErrors.push(...numericErrors);

  // Step 5: Action count validation
  const actionCountErrors = validateActionCount(doc);
  allErrors.push(...actionCountErrors);

  // Determine if valid (only CRITICAL errors prevent loading)
  const criticalErrors = allErrors.filter((e) => e.severity === 'CRITICAL');
  const valid = criticalErrors.length === 0;

  return {
    valid,
    errors: allErrors,
    lesson: valid ? (parsed as LessonDoc) : undefined,
    meta: {
      lessonId,
      title,
      sizeBytes,
      totalActions,
    },
  };
}

/**
 * Format validation errors for display.
 *
 * @param errors List of validation errors
 * @param mode 'developer' for full details, 'user' for learner-friendly messages
 */
export function formatValidationErrors(
  errors: LessonValidationError[],
  mode: 'developer' | 'user' = 'developer'
): string {
  if (errors.length === 0) return '';

  if (mode === 'user') {
    // Learner-friendly: hide technical details
    const criticalCount = errors.filter((e) => e.severity === 'CRITICAL').length;
    if (criticalCount > 0) {
      return 'Unable to load this lesson. The lesson file contains errors and cannot be displayed.';
    }
    return 'This lesson loaded with warnings. Some content may not display correctly.';
  }

  // Developer mode: full details
  const lines: string[] = [];
  lines.push(`Lesson validation failed with ${errors.length} error(s):\n`);

  for (let i = 0; i < errors.length; i++) {
    const e = errors[i];
    const prefix = `[${e.severity}] [${e.category}]`;
    let detail = e.message;

    if (e.lessonId) detail = `Lesson "${e.lessonId}": ${detail}`;
    if (e.stepId) detail = `Step "${e.stepId}": ${detail}`;
    if (e.actionIndex !== undefined) detail = `Action[${e.actionIndex}]: ${detail}`;

    lines.push(`  ${i + 1}. ${prefix} ${detail}`);
  }

  return lines.join('\n');
}

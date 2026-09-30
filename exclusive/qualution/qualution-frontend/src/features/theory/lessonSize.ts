/**
 * lessonSize.ts
 *
 * PHASE 12: Lesson JSON size measurement utilities.
 *
 * Measures the UTF-8 byte size of a lesson document.
 * Only the lesson JSON is measured — not the renderer, not the app bundle.
 *
 * Design:
 * - Pure TypeScript — no DOM, no React, no side effects.
 * - Works in both browser (TextEncoder) and Node/Vitest (Buffer fallback).
 * - Reports raw (pretty-printed) and minified sizes.
 */

// ── Byte counting ──────────────────────────────────────────────────────────

/**
 * Returns the UTF-8 byte length of a string.
 * Uses TextEncoder in browser environments, Buffer in Node.
 */
function utf8ByteLength(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).byteLength;
  }
  // Node.js / Vitest environment
  return Buffer.byteLength(str, 'utf8');
}

// ── Size result ────────────────────────────────────────────────────────────

export interface LessonSizeResult {
  /** UTF-8 byte size of the raw JSON string (as provided). */
  rawBytes: number;
  /** UTF-8 byte size of the minified JSON (no whitespace). */
  minifiedBytes: number;
  /** Human-readable raw size (e.g. "12.3 KB"). */
  rawLabel: string;
  /** Human-readable minified size (e.g. "8.1 KB"). */
  minifiedLabel: string;
  /** True if minified size is within the 5–80 KB target range. */
  withinTarget: boolean;
  /** True if minified size is below 5 KB (tiny lesson). */
  isTiny: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Measures the UTF-8 byte size of a lesson JSON object.
 *
 * @param doc  The raw lesson document (will be serialised to JSON).
 * @param indent  Indentation for the raw JSON. Default: 2 spaces.
 */
export function measureLessonSize(doc: unknown, indent = 2): LessonSizeResult {
  const raw = JSON.stringify(doc, null, indent);
  const minified = JSON.stringify(doc);
  const rawBytes = utf8ByteLength(raw);
  const minifiedBytes = utf8ByteLength(minified);
  return {
    rawBytes,
    minifiedBytes,
    rawLabel: formatBytes(rawBytes),
    minifiedLabel: formatBytes(minifiedBytes),
    withinTarget: minifiedBytes >= 5 * 1024 || minifiedBytes < 5 * 1024
      ? minifiedBytes <= 80 * 1024
      : false,
    isTiny: minifiedBytes < 5 * 1024,
  };
}

/**
 * Measures the UTF-8 byte size of a raw JSON string.
 * Use this when you already have the serialised string.
 */
export function measureJsonString(json: string): LessonSizeResult {
  const rawBytes = utf8ByteLength(json);
  let minified: string;
  try {
    minified = JSON.stringify(JSON.parse(json));
  } catch {
    minified = json;
  }
  const minifiedBytes = utf8ByteLength(minified);
  return {
    rawBytes,
    minifiedBytes,
    rawLabel: formatBytes(rawBytes),
    minifiedLabel: formatBytes(minifiedBytes),
    withinTarget: minifiedBytes <= 80 * 1024,
    isTiny: minifiedBytes < 5 * 1024,
  };
}

/** Target range constants (exported for tests). */
export const SIZE_TARGET = {
  MIN_KB: 0,
  MAX_KB: 80,
  MAX_BYTES: 80 * 1024,
} as const;

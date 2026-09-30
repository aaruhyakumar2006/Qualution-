/**
 * textMotion.ts
 *
 * PHASE 3: Pure Typographical Geometry & Deterministic Writing Head Engine.
 *
 * Responsibilities:
 * - Deterministic character and string width estimation in logical board coordinates (1280 × 720).
 * - Works identically in browser and headless environments (e.g. Node/Vitest jsdom) without canvas context.
 * - Computes text bounding boxes and start/end coordinates for left, center, and right alignments.
 * - Interpolates the exact (x, y) logical coordinate of the writing tip for any progress p in [0, 1].
 * - Pure functions with zero React or DOM dependencies.
 */

export type TextAlign = 'left' | 'center' | 'right';

export interface TextMetricsOptions {
  fontSize: number;
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
}

export interface TextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  startX: number;
  endX: number;
  writeY: number;
  align: TextAlign;
}

// ── Deterministic Character Width Model ────────────────────────────────────

/**
 * Approximate character width ratios relative to fontSize for proportional sans-serif (Inter).
 * These constants are calibrated against standard Inter rendering.
 */
const NARROW_CHARS = new Set("ijlItf'!:;,.|()[]{} -`·");
const WIDE_CHARS = new Set('WMwmQ%@&#+<=>~');
const DIGITS_AND_CAPS = /[A-Z0-9]/;

/**
 * Estimates the advance width of a single character in logical board units.
 */
export function estimateCharWidth(
  char: string,
  fontSize: number,
  isMonospace: boolean = false
): number {
  if (isMonospace) {
    return fontSize * 0.6;
  }

  if (char === ' ') {
    return fontSize * 0.28;
  }
  if (NARROW_CHARS.has(char)) {
    return fontSize * 0.28;
  }
  if (WIDE_CHARS.has(char)) {
    return fontSize * 0.82;
  }
  if (DIGITS_AND_CAPS.test(char)) {
    return fontSize * 0.65;
  }
  // Standard lowercase latin and general punctuation
  return fontSize * 0.52;
}

/**
 * Calculates total rendered width of a string in logical coordinate units.
 */
export function estimateTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string = 'Inter, sans-serif',
  letterSpacing: number = 0
): number {
  if (!text) return 0;
  const isMonospace = /mono|consolas|courier/i.test(fontFamily);

  let totalWidth = 0;
  for (let i = 0; i < text.length; i++) {
    totalWidth += estimateCharWidth(text[i], fontSize, isMonospace);
  }

  if (text.length > 1 && letterSpacing !== 0) {
    totalWidth += (text.length - 1) * letterSpacing;
  }

  return Math.round(totalWidth * 100) / 100;
}

// ── Bounding Box & Alignment ───────────────────────────────────────────────

/**
 * Computes the full geometric bounds and writing trajectory for a text string.
 * Supports multiline strings with newlines (\n).
 */
export function computeTextBounds(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  align: TextAlign = 'left',
  fontFamily: string = 'Inter, sans-serif',
  letterSpacing: number = 0
): TextBounds {
  const lines = text ? text.split('\n') : [''];
  const lineHeight = fontSize * 1.35;
  const lineCount = lines.length;

  let maxWidth = 0;
  for (const line of lines) {
    const w = estimateTextWidth(line, fontSize, fontFamily, letterSpacing);
    if (w > maxWidth) maxWidth = w;
  }

  const height = fontSize * 1.25 + Math.max(0, lineCount - 1) * lineHeight;

  let left = x;
  if (align === 'center') {
    left = x - maxWidth / 2;
  } else if (align === 'right') {
    left = x - maxWidth;
  }

  const right = left + maxWidth;
  const top = y;
  const bottom = y + height;

  // The writing tip follows the baseline / lower-middle portion of the first line
  const writeY = top + fontSize * 0.85;

  return {
    x,
    y,
    width: maxWidth,
    height,
    left,
    top,
    right,
    bottom,
    startX: left,
    endX: right,
    writeY,
    align,
  };
}

// ── Writing Head Interpolation ─────────────────────────────────────────────

/**
 * Computes the exact logical coordinate (cursorX, cursorY) of the writing tip
 * for a given normalized progress value p in [0, 1].
 *
 * For multiline text, tracks across line breaks deterministically.
 */
export function computeWritingHeadPosition(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  align: TextAlign = 'left',
  fontFamily: string = 'Inter, sans-serif',
  letterSpacing: number = 0,
  progress: number = 0
): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, progress));
  if (!text || text.length === 0) {
    return { x, y: y + fontSize * 0.85 };
  }

  const lines = text.split('\n');
  const lineHeight = fontSize * 1.35;
  const totalChars = text.length;
  const charIdx = Math.min(totalChars, Math.floor(clamped * totalChars));

  // Determine line index and char offset within line
  let charCounter = 0;
  let targetLine = 0;
  let charInLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineLen = lines[i].length + (i < lines.length - 1 ? 1 : 0); // +1 for \n
    if (charIdx <= charCounter + lines[i].length) {
      targetLine = i;
      charInLine = charIdx - charCounter;
      break;
    }
    charCounter += lineLen;
    targetLine = i;
    charInLine = lines[i].length;
  }

  const activeLine = lines[targetLine];
  const substring = activeLine.slice(0, charInLine);
  const activeLineWidth = estimateTextWidth(activeLine, fontSize, fontFamily, letterSpacing);
  const substringWidth = estimateTextWidth(substring, fontSize, fontFamily, letterSpacing);

  let lineLeft = x;
  if (align === 'center') {
    lineLeft = x - activeLineWidth / 2;
  } else if (align === 'right') {
    lineLeft = x - activeLineWidth;
  }

  const headX = lineLeft + substringWidth;
  const headY = y + targetLine * lineHeight + fontSize * 0.85;

  return {
    x: Math.round(headX * 100) / 100,
    y: Math.round(headY * 100) / 100,
  };
}

/**
 * Legacy single-line bounds interpolation for backwards compatibility.
 */
export function interpolateWritingPosition(
  bounds: TextBounds,
  progress: number
): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, progress));
  const currentX = bounds.startX + clamped * bounds.width;

  return {
    x: Math.round(currentX * 100) / 100,
    y: Math.round(bounds.writeY * 100) / 100,
  };
}

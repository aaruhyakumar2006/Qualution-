/**
 * lessonEngine.ts
 *
 * PHASE 9 + PHASE 15: Script-Driven Lesson Engine — Action Queue + Executor.
 *
 * `LessonEngine` is the top-level orchestrator.
 * It sits between the compact JSON lesson document and the existing
 * `TheoryBoardEngine`, forming the complete validated pipeline:
 *
 *   LESSON JSON
 *     ↓ JSON.parse()              — catches malformed JSON
 *   raw object
 *     ↓ validateLessonDoc()       — schema validation (lessonSchema.ts)
 *   LessonDoc
 *     ↓ parseLesson()             — lessonParser.ts
 *   BoardLessonScript
 *     ↓ sanitizeLessonScript()    — lessonSanitizer.ts
 *   sanitized BoardLessonScript
 *     ↓ TheoryBoardEngine.load()
 *   visual playback
 *
 * PHASE 15 UPDATE: Full validation (including numeric safety) is now done
 * by LessonPlayer using validateLesson() before calling LessonEngine.load().
 * This class retains schema validation for backward compatibility with
 * direct usage, but primary validation happens at the player level.
 *
 * Design:
 * - Thin wrapper — all execution logic lives in `TheoryBoardEngine`.
 * - `LessonEngine` owns the parse + sanitize pipeline.
 * - Deterministic: same JSON always produces the same visual sequence.
 * - No eval, no arbitrary scripts, no audio.
 * - Safe: invalid lesson data NEVER reaches the renderer unchecked.
 *
 * Usage:
 * ```ts
 * const engine = new LessonEngine();
 * engine.load(lessonJson, paintCallback);
 * engine.play();
 * const unsub = engine.subscribe((state) => setUiState(state));
 * ```
 */

import { TheoryBoardEngine } from './TheoryBoardEngine';
import { parseLesson } from './lessonParser';
import { validateLessonDoc } from './lessonSchema';
import { sanitizeLessonScript } from './lessonSanitizer';
import type { PaintCallback } from './TheoryBoardEngine';
import type { BoardEngineState, BoardSubscriber } from './boardTypes';
import type { TTSProvider } from '../teaching/speechService';

export interface LessonLoadResult {
  /** True if the lesson was loaded successfully. */
  ok: boolean;
  /** Validation/parse errors if `ok` is false. */
  errors: string[];
}

export class LessonEngine {
  private _board: TheoryBoardEngine;

  constructor(speech?: TTSProvider) {
    this._board = new TheoryBoardEngine(speech);
  }

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Validate, parse, sanitize, and load a lesson document.
   *
   * Pipeline:
   *   1. Schema validation  (validateLessonDoc)
   *   2. Parse              (parseLesson)
   *   3. Sanitize           (sanitizeLessonScript)
   *   4. Load into engine   (TheoryBoardEngine.load)
   *
   * PHASE 15: Full validation (including numeric safety) should be done
   * by LessonPlayer.load() using validateLesson() before calling this method.
   * This method retains schema validation for backward compatibility.
   *
   * Returns `{ ok: true }` on success.
   * Returns `{ ok: false, errors }` if any stage fails — does NOT throw.
   *
   * @param raw     The raw JSON object (already parsed from JSON string, or imported directly).
   * @param paint   Callback invoked by the engine to update board painted items.
   */
  public load(raw: unknown, paint: PaintCallback): LessonLoadResult {
    // Stage 1: Schema validation
    const schema = validateLessonDoc(raw);
    if (!schema.valid) {
      return { ok: false, errors: schema.errors };
    }

    // Stage 2 + 3: Parse and sanitize
    try {
      const script = parseLesson(raw);
      const sanitized = sanitizeLessonScript(script);
      this._board.load(sanitized, paint);
      return { ok: true, errors: [] };
    } catch (e) {
      return { ok: false, errors: [(e as Error).message] };
    }
  }

  /**
   * Load from a raw JSON string.
   * Returns `{ ok: false, errors }` on JSON parse error or any validation failure.
   */
  public loadFromJson(json: string, paint: PaintCallback): LessonLoadResult {
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch (e) {
      return { ok: false, errors: [`Invalid JSON: ${(e as Error).message}`] };
    }
    return this.load(raw, paint);
  }

  /** Start or resume playback. */
  public play(): void {
    this._board.play();
  }

  /** Pause playback. */
  public pause(): void {
    this._board.pause();
  }

  /** Restart from the beginning. */
  public restart(): void {
    this._board.restart();
  }

  /** Current engine state snapshot. */
  public getState(): BoardEngineState {
    return this._board.getState();
  }

  /**
   * Subscribe to state changes.
   * Returns an unsubscribe function.
   */
  public subscribe(fn: BoardSubscriber): () => void {
    return this._board.subscribe(fn);
  }

  /** Release all resources. */
  public dispose(): void {
    this._board.dispose();
  }

  // ── Internal board access (for testing) ──────────────────────────────

  /** @internal Exposed for tests that need to inspect painted items. */
  public getPaintedItems() {
    return this._board.getPaintedItems();
  }
}

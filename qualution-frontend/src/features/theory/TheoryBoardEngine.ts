/**
 * TheoryBoardEngine.ts
 *
 * The core execution engine for the Theory Board teaching system.
 *
 * Responsibilities:
 * - Load a BoardLessonScript and execute its steps sequentially.
 * - Drive the cursor position (emitted via state updates).
 * - Drive painted items on the board (emitted via callbacks).
 * - Manage narration via the existing SpeechService.
 * - Expose play / pause / restart controls.
 * - Emit state changes to React subscribers.
 *
 * Design:
 * - Pure TypeScript class. No React imports. No DOM access.
 * - Uses a `paintCallback` injected by the React component to apply
 *   paint operations (so the engine stays testable without a DOM).
 * - Deterministic: same script always produces the same visual sequence.
 * - Safe: no eval/Function constructor / dynamic code execution.
 */

import type {
  BoardLessonScript,
  BoardTeachingStep,
  BoardAction,
  BoardEngineState,
  BoardPlaybackState,
  PaintedItem,
  BoardSubscriber,
} from './boardTypes';
import type { TTSProvider } from '../teaching/speechService';
import { BrowserSpeechService } from '../teaching/speechService';

// ── Types ─────────────────────────────────────────────────────────────────

export interface PaintCommand {
  /** Add a new painted item with initial progress=0 and begin animating it. */
  type: 'ADD' | 'UPDATE' | 'REMOVE' | 'CLEAR';
  item?: PaintedItem;
  id?: string;
}

export type PaintCallback = (cmd: PaintCommand) => void;
export type PaintInstruction = PaintCommand;

// ── Engine ────────────────────────────────────────────────────────────────

let _itemCounter = 0;
function nextId(): string {
  return `bi-${++_itemCounter}`;
}

const DEFAULT_STATE: BoardEngineState = {
  playback: 'IDLE',
  currentStepIndex: 0,
  totalSteps: 0,
  caption: '',
  isSpeaking: false,
  cursorX: 600,
  cursorY: 50,
  cursorVisible: false,
  progress: 0,
  error: null,
};

export class TheoryBoardEngine {
  private lesson: BoardLessonScript | null = null;
  private state: BoardEngineState = { ...DEFAULT_STATE };
  private subscribers: Set<BoardSubscriber> = new Set();
  private speech: TTSProvider;
  private paintCb: PaintCallback | null = null;

  /** Whether the engine has been asked to pause mid-execution. */
  private _pauseRequested = false;
  /** Resolve function to cancel a running await inside the execution loop. */
  private _abortController: AbortController | null = null;
  /** Items painted on the board (kept in memory for restart). */
  private _paintedItems: Map<string, PaintedItem> = new Map();

  constructor(speech?: TTSProvider) {
    this.speech = speech ?? new BrowserSpeechService();
  }

  // ── Public API ──────────────────────────────────────────────────────────

  public load(lesson: BoardLessonScript, paint: PaintCallback): void {
    this._abort();
    this.lesson = lesson;
    this.paintCb = paint;
    this._paintedItems.clear();
    this.state = {
      ...DEFAULT_STATE,
      totalSteps: lesson.steps.length,
      currentStepIndex: 0,
    };
    this._emit();
  }

  public play(): void {
    if (!this.lesson) return;
    if (this.state.playback === 'COMPLETED') {
      this.restart();
      return;
    }
    if (this.state.playback === 'PAUSED') {
      this._pauseRequested = false;
      this.speech.resume();
      this._updateState({ playback: 'PLAYING' });
      // Re-enter the execution loop at the current step
      this._runFromStep(this.state.currentStepIndex);
      return;
    }
    if (this.state.playback === 'IDLE' || this.state.playback === 'ERROR') {
      this._pauseRequested = false;
      this._updateState({ playback: 'PLAYING', cursorVisible: true });
      this._runFromStep(0);
    }
  }

  public pause(): void {
    if (this.state.playback !== 'PLAYING') return;
    this._pauseRequested = true;
    this.speech.pause();
    this._updateState({ playback: 'PAUSED' });
  }

  public restart(): void {
    this._abort();
    this.speech.stop();
    this._paintedItems.clear();
    if (this.paintCb) {
      this.paintCb({ type: 'CLEAR' });
    }
    this.state = {
      ...DEFAULT_STATE,
      totalSteps: this.lesson?.steps.length ?? 0,
      currentStepIndex: 0,
      cursorX: 100,
      cursorY: 80,
      cursorVisible: false,
    };
    this._pauseRequested = false;
    this._emit();
  }

  public getState(): BoardEngineState {
    return { ...this.state };
  }

  public subscribe(fn: BoardSubscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  public setSpeech(provider: TTSProvider): void {
    this.speech.stop();
    this.speech = provider;
  }

  // ── Internal Execution ──────────────────────────────────────────────────

  private async _runFromStep(startIndex: number): Promise<void> {
    if (!this.lesson) return;
    const steps = this.lesson.steps;

    for (let i = startIndex; i < steps.length; i++) {
      if (this._pauseRequested) {
        this._updateState({ currentStepIndex: i, playback: 'PAUSED' });
        return;
      }

      const step = steps[i];
      const progress = i / steps.length;
      this._updateState({ currentStepIndex: i, progress });

      // Speak the step-level narration first (if any), concurrently
      if (step.narration) {
        this._speakAsync(step.narration);
      }

      // Execute each action in sequence
      for (const action of step.actions) {
        if (this._pauseRequested) {
          this._updateState({ currentStepIndex: i, playback: 'PAUSED' });
          return;
        }
        await this._executeAction(action);
      }
    }

    // All steps done
    this._updateState({
      playback: 'COMPLETED',
      progress: 1,
      caption: '✓ Lesson complete',
      cursorVisible: false,
    });
  }

  private async _executeAction(action: BoardAction): Promise<void> {
    // Check pause before every action
    if (this._pauseRequested) return;

    switch (action.type) {
      case 'MOVE_CURSOR': {
        this._updateState({ cursorX: action.x, cursorY: action.y });
        // Settle time: cursor must visibly arrive before the next action.
        // 600ms matches the reference video's deliberate teacher movement.
        await this._wait(action.fast ? 60 : 600);
        break;
      }

      case 'POINT': {
        this._updateState({
          cursorX: action.x,
          cursorY: action.y,
          caption: action.label ?? '',
        });
        await this._wait(action.duration ?? 800);
        if (action.label) this._updateState({ caption: '' });
        break;
      }

      case 'PAUSE': {
        if (action.caption) this._updateState({ caption: action.caption });
        await this._wait(action.duration);
        if (action.caption) this._updateState({ caption: '' });
        break;
      }

      case 'NARRATE': {
        this._updateState({ caption: action.text });
        if (action.await !== false) {
          await this._speakAndWait(action.text);
        } else {
          this._speakAsync(action.text);
        }
        break;
      }

      case 'CLEAR_BOARD': {
        this.speech.stop();
        this._paintedItems.clear();
        if (this.paintCb) this.paintCb({ type: 'CLEAR' });
        if (action.animated !== false) await this._wait(400);
        break;
      }

      case 'ERASE_REGION': {
        // Emit a special CLEAR scoped to rect — handled by renderer
        const item: PaintedItem = {
          id: nextId(),
          kind: 'text', // placeholder kind; renderer handles via action.type
          progress: 1,
          data: action,
        };
        this._paint({ type: 'ADD', item });
        await this._wait(200);
        break;
      }

      case 'WRITE_TEXT': {
        const id = action.itemId ?? nextId();
        const charsTotal = action.text.length;
        // 52ms/char: deliberate teacher-writing pace (reference video target).
        // Minimum 400ms so even single characters have visible presence.
        const totalMs = action.duration ?? Math.max(400, charsTotal * 52);
        const frameMs = 16;
        const steps = Math.ceil(totalMs / frameMs);

        // Move cursor to the write position first
        this._updateState({ cursorX: action.x, cursorY: action.y });
        await this._wait(380); // settle — cursor arrives, pauses, then writes

        const item: PaintedItem = { id, kind: 'text', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        for (let s = 1; s <= steps; s++) {
          if (this._pauseRequested) return;
          const p = Math.min(1, s / steps);
          item.progress = p;
          this._paint({ type: 'UPDATE', item });
          await this._wait(frameMs);
        }
        break;
      }

      case 'WRITE_MATH': {
        const id = action.itemId ?? nextId();
        this._updateState({ cursorX: action.x, cursorY: action.y });
        // Cursor pauses at the math position before the formula appears.
        // 600ms default gives the learner a moment to anticipate.
        await this._wait(action.duration ?? 600);

        const item: PaintedItem = { id, kind: 'math', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        // Fade in over 16 steps × 25ms = 400ms — smooth but not slow
        for (let s = 0; s <= 16; s++) {
          if (this._pauseRequested) return;
          item.progress = s / 16;
          this._paint({ type: 'UPDATE', item });
          await this._wait(25);
        }
        break;
      }

      case 'DRAW_LINE': {
        const id = nextId();
        this._updateState({ cursorX: action.x1, cursorY: action.y1 });
        await this._wait(200);

        const totalMs = action.duration ?? 500;
        const frameMs = 16;
        const steps = Math.ceil(totalMs / frameMs);

        const item: PaintedItem = { id, kind: 'line', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        for (let s = 1; s <= steps; s++) {
          if (this._pauseRequested) return;
          item.progress = Math.min(1, s / steps);
          // Move cursor along line
          const p = item.progress;
          this._updateState({
            cursorX: action.x1 + (action.x2 - action.x1) * p,
            cursorY: action.y1 + (action.y2 - action.y1) * p,
          });
          this._paint({ type: 'UPDATE', item });
          await this._wait(frameMs);
        }
        break;
      }

      case 'DRAW_ARROW': {
        const id = nextId();
        this._updateState({ cursorX: action.x1, cursorY: action.y1 });
        await this._wait(200);

        const totalMs = action.duration ?? 600;
        const frameMs = 16;
        const steps = Math.ceil(totalMs / frameMs);

        const item: PaintedItem = { id, kind: 'arrow', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        for (let s = 1; s <= steps; s++) {
          if (this._pauseRequested) return;
          item.progress = Math.min(1, s / steps);
          const p = item.progress;
          this._updateState({
            cursorX: action.x1 + (action.x2 - action.x1) * p,
            cursorY: action.y1 + (action.y2 - action.y1) * p,
          });
          this._paint({ type: 'UPDATE', item });
          await this._wait(frameMs);
        }
        break;
      }

      case 'DRAW_RECT': {
        const id = nextId();
        this._updateState({ cursorX: action.x, cursorY: action.y });
        await this._wait(200);

        const totalMs = action.duration ?? 600;
        const frameMs = 16;
        const steps = Math.ceil(totalMs / frameMs);

        const item: PaintedItem = { id, kind: 'rect', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        for (let s = 1; s <= steps; s++) {
          if (this._pauseRequested) return;
          item.progress = Math.min(1, s / steps);
          this._paint({ type: 'UPDATE', item });
          await this._wait(frameMs);
        }
        break;
      }

      case 'DRAW_CIRCLE': {
        const id = nextId();
        this._updateState({ cursorX: action.cx, cursorY: action.cy });
        await this._wait(200);

        const totalMs = action.duration ?? 700;
        const frameMs = 16;
        const steps = Math.ceil(totalMs / frameMs);

        const item: PaintedItem = { id, kind: 'circle', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        for (let s = 1; s <= steps; s++) {
          if (this._pauseRequested) return;
          item.progress = Math.min(1, s / steps);
          this._paint({ type: 'UPDATE', item });
          await this._wait(frameMs);
        }
        break;
      }

      case 'DRAW_UNDERLINE': {
        const id = nextId();
        this._updateState({ cursorX: action.x, cursorY: action.y });
        await this._wait(150);

        const totalMs = action.duration ?? 400;
        const frameMs = 16;
        const steps = Math.ceil(totalMs / frameMs);

        const item: PaintedItem = { id, kind: 'underline', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        for (let s = 1; s <= steps; s++) {
          if (this._pauseRequested) return;
          item.progress = Math.min(1, s / steps);
          this._paint({ type: 'UPDATE', item });
          await this._wait(frameMs);
        }
        break;
      }

      case 'HIGHLIGHT': {
        const id = nextId();
        const item: PaintedItem = { id, kind: 'highlight', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        // Fade in: 10 steps × 30ms = 300ms — visible but not jarring
        for (let s = 0; s <= 10; s++) {
          if (this._pauseRequested) return;
          item.progress = s / 10;
          this._paint({ type: 'UPDATE', item });
          await this._wait(30);
        }

        // If duration > 0, hold then fade out. Otherwise stays permanently.
        if (action.duration && action.duration > 0) {
          await this._wait(action.duration);
          item.fading = true;
          for (let s = 10; s >= 0; s--) {
            item.progress = s / 10;
            this._paint({ type: 'UPDATE', item });
            await this._wait(30);
          }
          this._paint({ type: 'REMOVE', id });
        }
        break;
      }

      case 'DRAW_QUBIT_WIRE': {
        const id = nextId();
        this._updateState({ cursorX: action.x, cursorY: action.y });
        await this._wait(200);

        const totalMs = action.duration ?? 500;
        const frameMs = 16;
        const steps = Math.ceil(totalMs / frameMs);

        const item: PaintedItem = { id, kind: 'qubit-wire', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        for (let s = 1; s <= steps; s++) {
          if (this._pauseRequested) return;
          item.progress = Math.min(1, s / steps);
          const p = item.progress;
          this._updateState({ cursorX: action.x + action.length * p, cursorY: action.y });
          this._paint({ type: 'UPDATE', item });
          await this._wait(frameMs);
        }
        break;
      }

      case 'DRAW_GATE_BOX': {
        const id = nextId();
        this._updateState({ cursorX: action.cx, cursorY: action.cy });
        await this._wait(300);

        const item: PaintedItem = { id, kind: 'gate-box', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        for (let s = 0; s <= 10; s++) {
          if (this._pauseRequested) return;
          item.progress = s / 10;
          this._paint({ type: 'UPDATE', item });
          await this._wait(25);
        }
        break;
      }

      case 'DRAW_MEASURE_SYMBOL': {
        const id = nextId();
        this._updateState({ cursorX: action.cx, cursorY: action.cy });
        await this._wait(300);

        const item: PaintedItem = { id, kind: 'measure-symbol', progress: 0, data: action };
        this._paint({ type: 'ADD', item });

        for (let s = 0; s <= 10; s++) {
          if (this._pauseRequested) return;
          item.progress = s / 10;
          this._paint({ type: 'UPDATE', item });
          await this._wait(25);
        }
        break;
      }

      default:
        // Unknown action type: skip safely
        break;
    }
  }

  // ── Speech Helpers ──────────────────────────────────────────────────────

  private _speakAsync(text: string): void {
    if (!text.trim()) return;
    this._updateState({ isSpeaking: true, caption: text });
    this.speech.speak(text, {
      // 0.88 rate: slightly slower than default for academic clarity
      rate: 0.88,
      onEnd: () => {
        if (this.state.caption === text) {
          this._updateState({ isSpeaking: false });
        }
      },
    }).catch(() => {});
  }

  private _speakAndWait(text: string): Promise<void> {
    if (!text.trim()) return Promise.resolve();
    this._updateState({ isSpeaking: true, caption: text });
    return new Promise<void>((resolve) => {
      this.speech.speak(text, {
        rate: 0.88,
        onEnd: () => {
          this._updateState({ isSpeaking: false });
          resolve();
        },
        onError: () => {
          this._updateState({ isSpeaking: false });
          resolve();
        },
      }).catch(() => resolve());
    });
  }

  // ── Utility ─────────────────────────────────────────────────────────────

  /**
   * Await a delay that respects pause requests.
   * Resolves early if _pauseRequested becomes true.
   */
  private _wait(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const tick = 16;
      let elapsed = 0;
      const check = () => {
        if (this._pauseRequested) {
          resolve();
          return;
        }
        elapsed += tick;
        if (elapsed >= ms) {
          resolve();
        } else {
          setTimeout(check, tick);
        }
      };
      setTimeout(check, tick);
    });
  }

  private _abort(): void {
    this._pauseRequested = true;
    this._abortController?.abort();
    this._abortController = null;
  }

  private _paint(cmd: PaintCommand): void {
    if (!this.paintCb) return;
    if (cmd.item) {
      if (cmd.type === 'ADD') {
        this._paintedItems.set(cmd.item.id, cmd.item);
      } else if (cmd.type === 'UPDATE') {
        this._paintedItems.set(cmd.item.id, { ...cmd.item });
      } else if (cmd.type === 'REMOVE') {
        this._paintedItems.delete(cmd.item.id);
      }
    }
    if (cmd.type === 'CLEAR') {
      this._paintedItems.clear();
    }
    this.paintCb(cmd);
  }

  private _updateState(patch: Partial<BoardEngineState>): void {
    this.state = { ...this.state, ...patch };
    this._emit();
  }

  private _emit(): void {
    const snap = { ...this.state };
    this.subscribers.forEach((fn) => fn(snap));
  }

  public getPaintedItems(): PaintedItem[] {
    return Array.from(this._paintedItems.values());
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  public dispose(): void {
    this._abort();
    try { this.speech.stop(); } catch { /* speech provider may throw on stop — ignore */ }
    this.subscribers.clear();
    this.paintCb = null;
  }
}

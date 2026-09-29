import type { CircuitRequest } from './types';

export class CircuitHistory {
  private past: CircuitRequest[] = [];
  private present: CircuitRequest;
  private future: CircuitRequest[] = [];
  private maxHistory: number;

  constructor(initialState: CircuitRequest, maxHistory = 50) {
    this.present = JSON.parse(JSON.stringify(initialState));
    this.maxHistory = maxHistory;
  }

  public get current(): CircuitRequest {
    return JSON.parse(JSON.stringify(this.present));
  }

  public get canUndo(): boolean {
    return this.past.length > 0;
  }

  public get canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Push a new state. Clears future (branching history).
   */
  public push(newState: CircuitRequest): void {
    const serializedNew = JSON.stringify(newState);
    const serializedPresent = JSON.stringify(this.present);

    if (serializedNew === serializedPresent) {
      return; // No mutation
    }

    this.past.push(this.present);
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }

    this.present = JSON.parse(serializedNew);
    this.future = [];
  }

  /**
   * Undo to previous state
   */
  public undo(): CircuitRequest | null {
    if (!this.canUndo) return null;

    const previous = this.past.pop()!;
    this.future.unshift(this.present);
    this.present = previous;

    return this.current;
  }

  /**
   * Redo to future state
   */
  public redo(): CircuitRequest | null {
    if (!this.canRedo) return null;

    const next = this.future.shift()!;
    this.past.push(this.present);
    this.present = next;

    return this.current;
  }

  /**
   * Clear history and set new initial state
   */
  public reset(state: CircuitRequest): void {
    this.past = [];
    this.future = [];
    this.present = JSON.parse(JSON.stringify(state));
  }
}

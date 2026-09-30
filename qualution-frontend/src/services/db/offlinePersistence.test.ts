/**
 * offlinePersistence.test.ts
 *
 * Comprehensive Offline Capability & Dexie.js Persistence Test Suite:
 * 1. Verifies Dexie schema stores learner progress, completed steps, prediction answers,
 *    and timestamps per lesson.
 * 2. Simulates full page reload in AIRPLANE MODE (network completely disabled, navigator.onLine = false,
 *    fetch throws network errors) — confirms progress is 100% preserved.
 * 3. Confirms the Quantum Workbench and interactive lessons execute locally with zero network.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  offlineProgressDb,
  saveOfflineLessonProgress,
  getOfflineLessonProgress,
  getAllOfflineLessonProgress,
  clearOfflineLessonProgress,
} from './offlineProgressDb';
import { executeRoutedCircuit } from '../../features/circuit/executionRouter';
import type { CanonicalCircuit } from '../../features/circuit/types';

describe('Offline Persistence & Airplane-Mode Local Execution', () => {
  beforeEach(async () => {
    await clearOfflineLessonProgress();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    await clearOfflineLessonProgress();
  });

  // ── TEST 1: DEXIE SCHEMA & PROGRESS RECORDING ────────────────────────────────
  it('1. Persists learner progress (completed steps, prediction answers, timestamps) in Dexie schema', async () => {
    const lessonId = 'lesson-8-grovers-search';

    const saved = await saveOfflineLessonProgress(lessonId, {
      completedStepIndices: [0, 1, 2],
      predictionAnswers: {
        'checkpoint-optimal-r': {
          optionIndex: 0,
          isCorrect: true,
          explanation: 'R = 1 is optimal for N = 4',
        },
      },
      lastActiveStepIndex: 2,
      isCompleted: false,
      score: 95,
      totalTimeSpentMs: 45000,
    });

    expect(saved.lessonId).toBe(lessonId);
    expect(saved.completedStepIndices).toEqual([0, 1, 2]);
    expect(saved.predictionAnswers['checkpoint-optimal-r'].isCorrect).toBe(true);
    expect(saved.lastActiveStepIndex).toBe(2);
    expect(saved.isCompleted).toBe(false);
    expect(saved.score).toBe(95);
    expect(saved.updatedAt).toBeGreaterThan(0);

    // Verify query from Dexie
    const retrieved = await getOfflineLessonProgress(lessonId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.lessonId).toBe(lessonId);
    expect(retrieved?.completedStepIndices).toEqual([0, 1, 2]);
    expect(retrieved?.predictionAnswers['checkpoint-optimal-r'].optionIndex).toBe(0);
  });

  // ── TEST 2: AIRPLANE-MODE RELOAD PERSISTENCE (NETWORK DISABLED) ──────────────
  it('2. AIRPLANE-MODE TEST: Persists and restores progress across simulated reload with network disabled', async () => {
    const lessonId = 'lesson-1-superposition';

    // Step A: Save progress while "online"
    await saveOfflineLessonProgress(lessonId, {
      completedStepIndices: [0, 1],
      predictionAnswers: {
        'prediction-hadamard': { selectedState: '|+>', isCorrect: true },
      },
      lastActiveStepIndex: 1,
      isCompleted: false,
    });

    // Step B: Enter AIRPLANE MODE (simulate total network disconnection)
    vi.stubGlobal('navigator', { ...navigator, onLine: false });
    const offlineFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch (net::ERR_INTERNET_DISCONNECTED)'));
    vi.stubGlobal('fetch', offlineFetch);

    // Step C: Simulate full page reload / app cold restart (close & reopen DB connection)
    offlineProgressDb.close();
    await offlineProgressDb.open();

    // Verify navigator is offline and fetch throws
    expect(navigator.onLine).toBe(false);
    await expect(fetch('http://example.com/api/progress')).rejects.toThrow('Failed to fetch');

    // Step D: Retrieve saved progress strictly from Dexie IndexedDB in offline mode
    const offlineProgress = await getOfflineLessonProgress(lessonId);
    expect(offlineProgress).toBeDefined();
    expect(offlineProgress?.completedStepIndices).toEqual([0, 1]);
    expect(offlineProgress?.predictionAnswers['prediction-hadamard'].isCorrect).toBe(true);
    expect(offlineProgress?.isCompleted).toBe(false);

    // Step E: Continue learning offline and complete the lesson
    const updatedOffline = await saveOfflineLessonProgress(lessonId, {
      completedStepIndices: [0, 1, 2, 3],
      lastActiveStepIndex: 3,
      isCompleted: true,
      score: 100,
    });

    expect(updatedOffline.isCompleted).toBe(true);
    expect(updatedOffline.completedStepIndices).toEqual([0, 1, 2, 3]);

    // Verify updated progress remains in Dexie
    const finalCheck = await getOfflineLessonProgress(lessonId);
    expect(finalCheck?.isCompleted).toBe(true);
    expect(finalCheck?.score).toBe(100);

    // Confirm ZERO network calls occurred during this entire reload and update cycle
    expect(offlineFetch).toHaveBeenCalledTimes(1); // Only our intentional assertion fetch
  });

  // ── TEST 3: FULL WORKBENCH & LESSON OFFLINE EXECUTION ─────────────────────────
  it('3. Workbench and quantum circuit simulation run with 100% fidelity in airplane mode (zero network)', async () => {
    // Enable airplane mode
    vi.stubGlobal('navigator', { ...navigator, onLine: false });
    const offlineFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch (net::ERR_INTERNET_DISCONNECTED)'));
    vi.stubGlobal('fetch', offlineFetch);

    // 1. Simulate 2-Qubit Grover Search circuit locally
    const groverCircuit: CanonicalCircuit = {
      qubits: 2,
      gates: [
        { id: 'h0', type: 'h', targets: [0], column: 0 },
        { id: 'h1', type: 'h', targets: [1], column: 0 },
        { id: 'cz', type: 'cz', targets: [0, 1], column: 1 }, // Oracle marking |11>
        { id: 'h0_diff', type: 'h', targets: [0], column: 2 },
        { id: 'h1_diff', type: 'h', targets: [1], column: 2 },
        { id: 'x0_diff', type: 'x', targets: [0], column: 3 },
        { id: 'x1_diff', type: 'x', targets: [1], column: 3 },
        { id: 'cz_diff', type: 'cz', targets: [0, 1], column: 4 },
        { id: 'x0_post', type: 'x', targets: [0], column: 5 },
        { id: 'x1_post', type: 'x', targets: [1], column: 5 },
        { id: 'h0_post', type: 'h', targets: [0], column: 6 },
        { id: 'h1_post', type: 'h', targets: [1], column: 6 },
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
      ],
      shots: 1000,
    };

    // Execute via Execution Router while completely offline
    const simResult = await executeRoutedCircuit(groverCircuit, { shots: 1000 });

    // Assert local execution succeeded with known Grover result P(11) = 1.00
    expect(simResult.status).toBe('success');
    expect(simResult.execution_location).toBe('local_browser');
    expect(simResult.execution_method).toBe('stabilizer');
    expect(simResult.counts['11']).toBe(1000);
    expect(simResult.probabilities['11']).toBe(1);

    // 2. Persist lesson completion into Dexie
    await saveOfflineLessonProgress('lesson-8-grovers-search', {
      completedStepIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      isCompleted: true,
      score: 100,
      lastActiveStepIndex: 14,
    });

    const allProgress = await getAllOfflineLessonProgress();
    expect(allProgress).toHaveLength(1);
    expect(allProgress[0].lessonId).toBe('lesson-8-grovers-search');
    expect(allProgress[0].isCompleted).toBe(true);

    // Confirm zero fetch requests were made by the router or simulator
    expect(offlineFetch).not.toHaveBeenCalled();
  });
});

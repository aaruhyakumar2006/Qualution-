/**
 * teachingConstants.ts
 *
 * Shared constants for the teaching system.
 * Kept in a separate module so they can be imported by both
 * TeachingHUD and GroverUnifiedPanel without violating Vite's
 * Fast Refresh rule (no non-component exports from component files).
 */

export const SPRINT_1_SEQUENCE = [
  's1-initialize-measure',
  's1-x-gate',
  's1-hadamard-superposition',
  's1-z-phase',
  's1-gate-ordering',
  's1-single-qubit-challenge',
  's1-assessment',
];

import { describe, it, expect } from 'vitest';
import {
  GROVER_EXPLANATION_SPINE,
  STAGE_0_DATA,
  STAGE_1_DATA,
  STAGE_2_DATA,
  STAGE_3_DATA,
  STAGE_4_DATA,
  STAGE_5_DATA,
  STAGE_6_DATA,
  SCALING_TABLE,
  WHAT_GROVER_IS_NOT,
  STAGE_6_ASSESSMENT,
  TRANSFER_CHALLENGE_DATA,
} from './groverLessonData';

describe('groverLessonData (Phase 2 Data Model Validation)', () => {
  it('1. Explanation spine covers all 3 depths (Story, Bars, Compass)', () => {
    expect(GROVER_EXPLANATION_SPINE.story).toBeDefined();
    expect(GROVER_EXPLANATION_SPINE.bars).toBeDefined();
    expect(GROVER_EXPLANATION_SPINE.compass).toBeDefined();

    expect(GROVER_EXPLANATION_SPINE.story.summary).toContain('sign flip');
    expect(GROVER_EXPLANATION_SPINE.bars.summary).toContain('across that average');
    expect(GROVER_EXPLANATION_SPINE.compass.summary).toContain('30 deg up');
    expect(GROVER_EXPLANATION_SPINE.compass.summary).toContain('150 deg = overshoot');
  });

  it('2. Stage 0 defines classical search intuition and worst-case 3 boxes', () => {
    expect(STAGE_0_DATA.stepNumber).toBe(0);
    expect(STAGE_0_DATA.checkpoint.id).toBe('pred-g-classical');
    expect(STAGE_0_DATA.checkpoint.options).toHaveLength(4);
    // Correct option index is 2 (3 boxes)
    expect(STAGE_0_DATA.checkpoint.correctOptionIndex).toBe(2);
    expect(STAGE_0_DATA.checkpoint.options[2].label).toBe('3 boxes');
    expect(STAGE_0_DATA.checkpoint.feedback.wrong4).toContain('fourth holds it');
    expect(STAGE_0_DATA.checkpoint.feedback.wrong1or2).toContain('lucky case');
  });

  it('3. Stage 1 defines equal superposition, Born rule prediction, and 25% expectation', () => {
    expect(STAGE_1_DATA.stepNumber).toBe(1);
    expect(STAGE_1_DATA.checkpoint.id).toBe('pred-g-uniform');
    expect(STAGE_1_DATA.checkpoint.correctOptionIndex).toBe(2); // 25% each
    expect(STAGE_1_DATA.checkpoint.options[2].label).toBe('25% each');
    expect(STAGE_1_DATA.expectedStatevector).toEqual([0.5, 0.5, 0.5, 0.5]);
  });

  it('4. Stage 2 defines phase oracle, 25% unchanged prediction, and diagnoses', () => {
    expect(STAGE_2_DATA.stepNumber).toBe(2);
    expect(STAGE_2_DATA.checkpoint.id).toBe('pred-g-oracle-prob');
    expect(STAGE_2_DATA.checkpoint.correctOptionIndex).toBe(1); // 25% unchanged
    expect(STAGE_2_DATA.checkpoint.options[1].label).toBe('25% unchanged');
    expect(STAGE_2_DATA.expectedStatevector).toEqual([0.5, 0.5, 0.5, -0.5]);
    expect(STAGE_2_DATA.diagnoses.cnot).toContain('Shuffling equal amplitudes changes nothing');
    expect(STAGE_2_DATA.diagnoses.singleZ).toContain('flipped two boxes');
  });

  it('5. Stage 3 defines diffusion mirroring prediction, 3 chunks, and -1 global phase state', () => {
    expect(STAGE_3_DATA.stepNumber).toBe(3);
    expect(STAGE_3_DATA.checkpoint.id).toBe('pred-g-mirror');
    expect(STAGE_3_DATA.checkpoint.correctOptionIndex).toBe(3); // 1.0
    expect(STAGE_3_DATA.checkpoint.options[3].label).toBe('1');
    expect(STAGE_3_DATA.chunks.chunkA).toBeDefined();
    expect(STAGE_3_DATA.chunks.chunkB).toBeDefined();
    expect(STAGE_3_DATA.chunks.chunkC).toBeDefined();
    expect(STAGE_3_DATA.observeExplanation).toContain(
      'that overall minus sign is a global phase; no measurement can see it.'
    );
    expect(STAGE_3_DATA.expectedStatevector).toEqual([0, 0, 0, -1]);
  });

  it('6. Stage 4 defines round prediction (1 round) and Analyzer telemetry', () => {
    expect(STAGE_4_DATA.stepNumber).toBe(4);
    expect(STAGE_4_DATA.checkpoint.id).toBe('pred-g-rounds');
    expect(STAGE_4_DATA.checkpoint.aliasId).toBe('checkpoint-grover-iterations');
    expect(STAGE_4_DATA.checkpoint.correctOptionIndex).toBe(0); // 1 round
    expect(STAGE_4_DATA.expectedMetrics.totalGates).toBe(12);
    expect(STAGE_4_DATA.expectedMetrics.circuitDepth).toBe(7);
    expect(STAGE_4_DATA.expectedMetrics.twoQubitGates).toBe(2);
  });

  it('7. Stage 5 defines overshoot prediction (drops to 25%) and flat distribution', () => {
    expect(STAGE_5_DATA.stepNumber).toBe(5);
    expect(STAGE_5_DATA.checkpoint.id).toBe('pred-g-overshoot');
    expect(STAGE_5_DATA.checkpoint.correctOptionIndex).toBe(1); // drops to 25%
    expect(STAGE_5_DATA.checkpoint.options[1].label).toBe('Drops to 25%');
    expect(STAGE_5_DATA.expectedDistribution['11'].min).toBe(0.20);
    expect(STAGE_5_DATA.expectedDistribution['11'].max).toBe(0.30);
  });

  it('8. Stage 6 defines scaling table, 4 misconceptions, 4 assessment questions, and transfer challenge', () => {
    expect(SCALING_TABLE).toHaveLength(4);
    expect(SCALING_TABLE[0].databaseSizeN).toBe('4');
    expect(SCALING_TABLE[0].groverRounds).toBe('1');
    expect(SCALING_TABLE[2].groverRounds).toBe('~785');

    expect(WHAT_GROVER_IS_NOT).toHaveLength(4);

    expect(STAGE_6_ASSESSMENT).toHaveLength(4);
    // Q1 amplitude squared
    expect(STAGE_6_ASSESSMENT[0].correctIndex).toBe(1);
    // Q2 ~3 rounds for N=16
    expect(STAGE_6_ASSESSMENT[1].correctIndex).toBe(1);
    // Q3 diffusion mirrors across average
    expect(STAGE_6_ASSESSMENT[2].correctIndex).toBe(1);
    // Q4 False (overshoot)
    expect(STAGE_6_ASSESSMENT[3].correctIndex).toBe(1);

    expect(TRANSFER_CHALLENGE_DATA.targetBox).toBe('01');
    expect(TRANSFER_CHALLENGE_DATA.minProbability).toBe(0.95);
  });
});

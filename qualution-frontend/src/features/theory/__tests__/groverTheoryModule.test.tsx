/**
 * groverTheoryModule.test.tsx
 *
 * Dedicated test suite for Grover's Search Algorithm Theory Module (Sprint 08).
 * Tests:
 * 1. BoardLessonRegistry registration for lesson-8-grovers-search
 * 2. 6-beat structure (T1-T6) and 5:15 total duration (315,000ms)
 * 3. Tripwire a: Phase mark is invisible to measurement (25% probability)
 * 4. Tripwire b: Inversion about mean mu = +0.25 yields alpha_marked = +1.00
 * 5. Tripwire c: Round 2 overshoot rotates to 150 deg, returning to 25%
 * 6. Handoff payload generation to Practical Lab Workbench
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import {
  BOARD_LESSON_REGISTRY,
  hasBoardLesson,
  getBoardLesson,
  getBoardLessonHandoffPayload,
  TOTAL_GROVER_DURATION_MS,
  GROVER_BEATS,
} from '../boardLessonRegistry';
import { GroverAmplitudeBars } from '../../../components/teaching/grover/GroverAmplitudeBars';
import { GroverCompass } from '../../../components/teaching/grover/GroverCompass';
import { GroverBoxStrip } from '../../../components/teaching/grover/GroverBoxStrip';
import { GroverTheoryPresenter } from '../../../components/teaching/grover/GroverTheoryPresenter';

describe('Grover Theory Module — Registry & Specifications', () => {
  it('registers lesson-8-grovers-search in BOARD_LESSON_REGISTRY', () => {
    expect(hasBoardLesson('lesson-8-grovers-search')).toBe(true);
    const lesson = getBoardLesson('lesson-8-grovers-search');
    expect(lesson).toBeDefined();
    expect(lesson?.id).toBe('t8-grover-search');
    expect(lesson?.title).toContain("Grover's Search Algorithm");
    expect(lesson?.transitionToLessonId).toBe('lesson-8-grovers-search');
  });

  it('contains exactly 6 structured beats T1 through T6 with 5:15 duration', () => {
    expect(GROVER_BEATS.length).toBe(6);
    expect(GROVER_BEATS.map((b) => b.id)).toEqual(['T1', 'T2', 'T3', 'T4', 'T5', 'T6']);

    // Check beat titles
    expect(GROVER_BEATS[0].title).toBe('The Four Boxes');
    expect(GROVER_BEATS[1].title).toBe('Amplitudes');
    expect(GROVER_BEATS[2].title).toBe('The Hidden Mark');
    expect(GROVER_BEATS[3].title).toBe('The Mirror');
    expect(GROVER_BEATS[4].title).toBe('The Compass');
    expect(GROVER_BEATS[5].title).toBe('Scale and Handoff');

    // Check sum of durations matches 315,000ms
    const totalDuration = GROVER_BEATS.reduce((acc, b) => acc + b.durationMs, 0);
    expect(totalDuration).toBe(TOTAL_GROVER_DURATION_MS);
    expect(TOTAL_GROVER_DURATION_MS).toBe(315000);
  });

  it('generates a complete workbench handoff payload', () => {
    const payload = getBoardLessonHandoffPayload('lesson-8-grovers-search');
    expect(payload).toBeDefined();
    expect(payload?.sourceLessonId).toBe('lesson-8-grovers-search');
    expect(payload?.lessonId).toBe('lesson-8-grovers-search');
    expect(payload?.targetState).toBe('11');
    expect(payload?.recommendedExperimentId).toBe('lesson-8-grovers-search');
    expect(payload?.beatsSeen).toEqual(['T1', 'T2', 'T3', 'T4', 'T5', 'T6']);
    expect(payload?.circuit?.qubits).toBe(2);
    expect(payload?.returnPath).toBe('/?theory-lesson=lesson-8-grovers-search');
  });
});

describe('Tripwire Scientific Accuracy Tests', () => {
  it('Tripwire a: Phase mark is negative, measurement probabilities remain 25%', () => {
    // Marked state |11⟩ amplitude is -0.50
    const amplitudes: [number, number, number, number] = [0.5, 0.5, 0.5, -0.5];
    const { getByTestId } = render(
      <GroverAmplitudeBars amplitudes={amplitudes} formulaStep={2} />
    );

    // Col 11 amplitude should show -0.50
    const col11 = getByTestId('amp-col-11');
    expect(col11.textContent).toContain('-0.50');
    // Measurement probability should be 25% (| -0.50 |^2 = 0.25)
    expect(col11.textContent).toContain('25% Prob');

    // Born rule banner notes phase invisibility
    const banner = getByTestId('born-rule-formula');
    expect(banner.textContent).toContain('quantum phase is invisible to direct measurement');
  });

  it('Tripwire b: Inversion about mean mu = +0.25 calculates alpha_wrong = 0, alpha_marked = +1.00', () => {
    const mu = 0.25;
    const alphaWrong = 0.5;
    const alphaMarked = -0.5;

    const reflectedWrong = 2 * mu - alphaWrong;
    const reflectedMarked = 2 * mu - alphaMarked;

    expect(reflectedWrong).toBe(0.0);
    expect(reflectedMarked).toBe(1.0);

    // Test component rendering with mean line
    const { getByTestId } = render(
      <GroverAmplitudeBars
        amplitudes={[0.0, 0.0, 0.0, 1.0]}
        mean={0.25}
        isReflecting={true}
        formulaStep={2}
      />
    );

    expect(getByTestId('grover-mean-line')).toBeDefined();
    expect(getByTestId('grover-mean-line').textContent).toContain('Mean μ = +0.25');

    const col11 = getByTestId('amp-col-11');
    expect(col11.textContent).toContain('+1.00');
    expect(col11.textContent).toContain('100% Prob');
  });

  it('Tripwire c: Overshoot round 2 rotates to 150 deg, collapsing target probability back to 25%', () => {
    // 30 deg -> 90 deg -> 150 deg
    const theta0 = 30;
    const round1Theta = theta0 + 60; // 90 deg
    const round2Theta = round1Theta + 60; // 150 deg

    expect(round1Theta).toBe(90);
    expect(round2Theta).toBe(150);

    // sin^2(90 deg) = 1.0 (100%)
    const probRound1 = Math.round(Math.pow(Math.sin((90 * Math.PI) / 180), 2) * 100);
    expect(probRound1).toBe(100);

    // sin^2(150 deg) = sin^2(30 deg) = (0.5)^2 = 0.25 (25%)
    const probRound2 = Math.round(Math.pow(Math.sin((150 * Math.PI) / 180), 2) * 100);
    expect(probRound2).toBe(25);

    // Test component rendering overshoot alert
    const { getByTestId } = render(
      <GroverCompass angleDeg={150} targetProbability={25} iterationRound={2} />
    );

    expect(getByTestId('compass-angle-value').textContent).toContain('150°');
    expect(getByTestId('overshoot-warning')).toBeDefined();
    expect(getByTestId('overshoot-warning').textContent).toContain('TRIPWIRE C');
    expect(getByTestId('overshoot-warning').textContent).toContain('25%');
  });
});

describe('GroverTheoryPresenter UI & Handoff Interactivity', () => {
  it('renders top KaTeX header and beat information', () => {
    render(<GroverTheoryPresenter initialTimeMs={0} />);

    expect(screen.getByTestId('grover-theory-presenter')).toBeDefined();
    expect(screen.getByText("Grover's Search Algorithm — Masterclass")).toBeDefined();
    expect(screen.getByTestId('beat-t1-view')).toBeDefined();
    expect(screen.getByText('The Four Boxes')).toBeDefined();
  });

  it('launches workbench on Quick Launch click', () => {
    const onLaunchWorkbench = vi.fn();
    render(
      <GroverTheoryPresenter
        initialTimeMs={0}
        onLaunchWorkbench={onLaunchWorkbench}
      />
    );

    const jumpBtn = screen.getByTestId('quick-launch-lab-btn');
    fireEvent.click(jumpBtn);
    expect(onLaunchWorkbench).toHaveBeenCalledTimes(1);
  });

  it('renders Beat T6 handoff banner at 295s and launches workbench', () => {
    const onLaunchWorkbench = vi.fn();
    render(
      <GroverTheoryPresenter
        initialTimeMs={295000}
        onLaunchWorkbench={onLaunchWorkbench}
      />
    );

    expect(screen.getByTestId('beat-t6-view')).toBeDefined();
    expect(screen.getByTestId('t6-handoff-card')).toBeDefined();

    const handoffBtn = screen.getByTestId('launch-workbench-handoff-btn');
    fireEvent.click(handoffBtn);
    expect(onLaunchWorkbench).toHaveBeenCalledTimes(1);
  });
});

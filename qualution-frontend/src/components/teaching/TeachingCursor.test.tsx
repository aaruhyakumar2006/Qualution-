/**
 * TeachingCursor.test.tsx
 *
 * PHASE 2: Teacher Cursor Verification Tests
 */

import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TeachingCursor, type TeachingCursorRef } from './TeachingCursor';

describe('TeachingCursor (Phase 2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Renders visibly immediately on mount (not hidden by default)', () => {
    render(<TeachingCursor demoMode={false} />);
    const cursor = screen.getByTestId('teaching-cursor');
    expect(cursor).toBeInTheDocument();
    expect(cursor).toBeVisible();
  });

  it('2. Defaults to initial development position at 20%, 30% (x: 256, y: 216 on 1280x720)', () => {
    render(<TeachingCursor demoMode={false} logicalWidth={1280} logicalHeight={720} />);
    const cursor = screen.getByTestId('teaching-cursor');
    expect(parseFloat(cursor.style.left)).toBeCloseTo(20, 2);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(30, 2);
  });

  it('3. Respects custom logical coordinates mapped to percentage', () => {
    render(
      <TeachingCursor
        x={640}
        y={360}
        logicalWidth={1280}
        logicalHeight={720}
        demoMode={false}
      />
    );
    const cursor = screen.getByTestId('teaching-cursor');
    expect(parseFloat(cursor.style.left)).toBeCloseTo(50, 2);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(50, 2);
  });

  it('4. Renders academic teacher pointer SVG with tip at (0, 0)', () => {
    render(<TeachingCursor demoMode={false} />);
    const arrow = screen.getByTestId('teaching-cursor').querySelector('svg.teaching-cursor-arrow');
    expect(arrow).not.toBeNull();
    expect(arrow?.getAttribute('width')).toBe('32');
    expect(arrow?.getAttribute('height')).toBe('38');

    // Verify main arrow path starts at (0, 0) for tip anchor
    const path = arrow?.querySelector('path');
    expect(path?.getAttribute('d')).toContain('M 0,0');
  });

  it('5. Supports imperative ref API (show, hide, setPosition, moveTo, reset)', () => {
    const ref = createRef<TeachingCursorRef>();
    render(<TeachingCursor ref={ref} demoMode={false} logicalWidth={1280} logicalHeight={720} />);

    // setPosition
    act(() => {
      ref.current?.setPosition(128, 72);
    });
    let cursor = screen.getByTestId('teaching-cursor');
    expect(parseFloat(cursor.style.left)).toBeCloseTo(10, 2);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(10, 2);

    // moveTo
    act(() => {
      ref.current?.moveTo(960, 540, 600);
    });
    cursor = screen.getByTestId('teaching-cursor');
    expect(parseFloat(cursor.style.left)).toBeCloseTo(75, 2);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(75, 2);

    // hide
    act(() => {
      ref.current?.hide();
    });
    expect(screen.queryByTestId('teaching-cursor')).toBeNull();

    // show
    act(() => {
      ref.current?.show();
    });
    expect(screen.getByTestId('teaching-cursor')).toBeInTheDocument();

    // reset
    act(() => {
      ref.current?.reset();
    });
    cursor = screen.getByTestId('teaching-cursor');
    expect(parseFloat(cursor.style.left)).toBeCloseTo(20, 2);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(30, 2);
  });

  it('6. Executes the 5-second movement demo sequence when demoMode is active', () => {
    render(<TeachingCursor demoMode={true} logicalWidth={1280} logicalHeight={720} />);
    let cursor = screen.getByTestId('teaching-cursor');

    // 0s: initial position (20%, 30%)
    expect(parseFloat(cursor.style.left)).toBeCloseTo(20, 2);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(30, 2);

    // 1s: upper-left teaching position (x: 180, y: 130) -> 14.0625%, 18.0556%
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    cursor = screen.getByTestId('teaching-cursor');
    expect(parseFloat(cursor.style.left)).toBeCloseTo(14.06, 1);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(18.06, 1);

    // 2s: center (x: 640, y: 360) -> 50%, 50%
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    cursor = screen.getByTestId('teaching-cursor');
    expect(parseFloat(cursor.style.left)).toBeCloseTo(50, 2);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(50, 2);

    // 3s: lower-right (x: 960, y: 520) -> 75%, 72.2222%
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    cursor = screen.getByTestId('teaching-cursor');
    expect(parseFloat(cursor.style.left)).toBeCloseTo(75, 2);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(72.22, 1);

    // 4s: pause
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    cursor = screen.getByTestId('teaching-cursor');
    expect(parseFloat(cursor.style.left)).toBeCloseTo(75, 2);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(72.22, 1);

    // 5s: reset back to initial position (20%, 30%)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    cursor = screen.getByTestId('teaching-cursor');
    expect(parseFloat(cursor.style.left)).toBeCloseTo(20, 2);
    expect(parseFloat(cursor.style.top)).toBeCloseTo(30, 2);
  });

  it('7. Supports clicking state and label', () => {
    render(<TeachingCursor demoMode={false} isClicking={true} label="Hadamard Gate" />);
    const arrow = screen.getByTestId('teaching-cursor').querySelector('svg.teaching-cursor-arrow');
    expect(arrow?.classList.contains('clicking')).toBe(true);

    const label = screen.getByText('Hadamard Gate');
    expect(label).toBeInTheDocument();
  });
});

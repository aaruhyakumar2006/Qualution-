import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { ErwinMascot } from './ErwinMascot';

describe('ErwinMascot Component (Four Visual States Spec)', () => {
  it('renders with viewBox="0 0 100 100" and configurable dimensions', () => {
    const { container: smallBadge } = render(<ErwinMascot size={24} />);
    const smallSvg = smallBadge.querySelector('svg');
    expect(smallSvg).toBeTruthy();
    expect(smallSvg?.getAttribute('viewBox')).toBe('0 0 100 100');
    expect(smallSvg?.getAttribute('width')).toBe('24');
    expect(smallSvg?.getAttribute('height')).toBe('24');

    const { container: largeFeatured } = render(<ErwinMascot size={200} />);
    const largeSvg = largeFeatured.querySelector('svg');
    expect(largeSvg?.getAttribute('width')).toBe('200');
    expect(largeSvg?.getAttribute('height')).toBe('200');
  });

  it('strictly adheres to the under 15 path count budget (13 shapes total)', () => {
    const { container } = render(<ErwinMascot />);
    const shapes = container.querySelectorAll('path, polygon, rect, ellipse, circle');
    expect(shapes.length).toBeLessThan(15);
    // 1 bust + 2 outer ears + 2 inner ears + 1 head + 1 glow + 1 visor + 2 eyes + 1 nose + 1 muzzle + 1 orbit dot = 13 shapes
    expect(shapes.length).toBe(13);
  });

  it('bakes in radialGradient glow behind the flat visor (zero GPU blur filter cost)', () => {
    const { container } = render(<ErwinMascot />);
    const gradient = container.querySelector('radialGradient');
    expect(gradient).toBeTruthy();

    const stops = gradient?.querySelectorAll('stop');
    expect(stops?.length).toBe(3);
    expect(stops?.[0].getAttribute('offset')).toBe('0%');
    expect(stops?.[1].getAttribute('offset')).toBe('45%');
    expect(stops?.[2].getAttribute('offset')).toBe('100%');

    const glow = container.querySelector('#erwin-visor-glow');
    expect(glow).toBeTruthy();

    const allVisorElements = Array.from(container.querySelectorAll('#erwin-visor-glow, #erwin-visor'));
    expect(allVisorElements[0].id).toBe('erwin-visor-glow');
    expect(allVisorElements[1].id).toBe('erwin-visor');
  });

  it('applies exactly the 4 required CSS classes: .erwin--idle, .erwin--correct, .erwin--incorrect, .erwin--thinking', () => {
    const { container: idleC } = render(<ErwinMascot state="idle" />);
    expect(idleC.querySelector('svg')?.classList.contains('erwin--idle')).toBe(true);

    const { container: correctC } = render(<ErwinMascot state="correct" />);
    expect(correctC.querySelector('svg')?.classList.contains('erwin--correct')).toBe(true);

    const { container: incorrectC } = render(<ErwinMascot state="incorrect" />);
    expect(incorrectC.querySelector('svg')?.classList.contains('erwin--incorrect')).toBe(true);

    const { container: thinkingC } = render(<ErwinMascot state="thinking" />);
    expect(thinkingC.querySelector('svg')?.classList.contains('erwin--thinking')).toBe(true);
  });

  it('maps each state to its exact Workbench token via --erwin-visor-color', () => {
    // 1. Idle -> --wb-status-cyan
    const { container: idleC } = render(<ErwinMascot state="idle" />);
    const idleSvg = idleC.querySelector('svg') as HTMLElement;
    expect(idleSvg.style.getPropertyValue('--erwin-visor-color')).toContain('--wb-status-cyan');

    // 2. Correct -> --wb-status-success
    const { container: correctC } = render(<ErwinMascot state="correct" />);
    const correctSvg = correctC.querySelector('svg') as HTMLElement;
    expect(correctSvg.style.getPropertyValue('--erwin-visor-color')).toContain('--wb-status-success');

    // 3. Incorrect -> --wb-status-danger
    const { container: incorrectC } = render(<ErwinMascot state="incorrect" />);
    const incorrectSvg = incorrectC.querySelector('svg') as HTMLElement;
    expect(incorrectSvg.style.getPropertyValue('--erwin-visor-color')).toContain('--wb-status-danger');

    // 4. Thinking -> --wb-accent
    const { container: thinkingC } = render(<ErwinMascot state="thinking" />);
    const thinkingSvg = thinkingC.querySelector('svg') as HTMLElement;
    expect(thinkingSvg.style.getPropertyValue('--erwin-visor-color')).toContain('--wb-accent');
  });

  it('includes an inner orbiting element for the thinking state', () => {
    const { container } = render(<ErwinMascot state="thinking" />);
    const ring = container.querySelector('#erwin-orbit-ring');
    const dot = container.querySelector('#erwin-orbit-dot');
    expect(ring).toBeTruthy();
    expect(dot).toBeTruthy();
    expect(dot?.getAttribute('r')).toBe('2.2');
  });

  it('supports toggling pupil apertures within the visor', () => {
    const { container: withEyes } = render(<ErwinMascot showEyes={true} />);
    expect(withEyes.querySelector('#erwin-eye-left')).toBeTruthy();
    expect(withEyes.querySelector('#erwin-eye-right')).toBeTruthy();

    const { container: withoutEyes } = render(<ErwinMascot showEyes={false} />);
    expect(withoutEyes.querySelector('#erwin-eye-left')).toBeNull();
    expect(withoutEyes.querySelector('#erwin-eye-right')).toBeNull();
  });
});

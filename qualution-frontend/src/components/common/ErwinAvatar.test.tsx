import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { ErwinAvatar } from './ErwinAvatar';

describe('ErwinAvatar Component & SVG Design Specification', () => {
  it('renders with viewBox="0 0 100 100" and default accessibility attributes', () => {
    const { container } = render(<ErwinAvatar size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100');
    expect(svg?.getAttribute('width')).toBe('48');
    expect(svg?.getAttribute('height')).toBe('48');
    expect(svg?.getAttribute('role')).toBe('img');
  });

  it('satisfies the performance constraint of under 15 shapes (12 shapes total)', () => {
    const { container } = render(<ErwinAvatar />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();

    // Query visual shapes (<path>, <polygon>, <rect>, <ellipse>)
    const shapes = svg?.querySelectorAll('path, polygon, rect, ellipse');
    expect(shapes?.length).toBeDefined();
    expect(shapes!.length).toBeLessThan(15);
    // 1 bust + 2 outer ears + 2 inner ears + 1 head + 1 glow + 1 visor + 2 eyes + 1 nose + 1 muzzle = 12 shapes
    expect(shapes!.length).toBe(12);
  });

  it('includes baked-in radialGradient definition and background glow ellipse', () => {
    const { container } = render(<ErwinAvatar />);
    const gradient = container.querySelector('#erwin-visor-glow-grad');
    expect(gradient).toBeTruthy();
    expect(gradient?.tagName.toLowerCase()).toBe('radialgradient');

    const stops = gradient?.querySelectorAll('stop');
    expect(stops?.length).toBe(3);
    expect(stops?.[0].getAttribute('offset')).toBe('0%');
    expect(stops?.[1].getAttribute('offset')).toBe('50%');
    expect(stops?.[2].getAttribute('offset')).toBe('100%');

    // Glow shape exists and references the radial gradient
    const glow = container.querySelector('#erwin-visor-glow');
    expect(glow).toBeTruthy();
    expect(glow?.getAttribute('fill')).toBe('url(#erwin-visor-glow-grad)');

    // Visor appears after glow in the DOM (glow is positioned directly behind visor)
    const allElements = Array.from(container.querySelectorAll('#erwin-visor-glow, #erwin-visor'));
    expect(allElements[0].id).toBe('erwin-visor-glow');
    expect(allElements[1].id).toBe('erwin-visor');
  });

  it('binds Workbench design tokens to the 4 canonical states via --erwin-visor-color', () => {
    // 1. Idle state
    const { container: idleContainer } = render(<ErwinAvatar state="idle" />);
    const idleSvg = idleContainer.querySelector('svg') as HTMLElement;
    expect(idleSvg.style.getPropertyValue('--erwin-visor-color')).toContain('--wb-status-cyan');

    // 2. Thinking state
    const { container: thinkingContainer } = render(<ErwinAvatar state="thinking" />);
    const thinkingSvg = thinkingContainer.querySelector('svg') as HTMLElement;
    expect(thinkingSvg.style.getPropertyValue('--erwin-visor-color')).toContain('--wb-accent');

    // 3. Success state
    const { container: successContainer } = render(<ErwinAvatar state="success" />);
    const successSvg = successContainer.querySelector('svg') as HTMLElement;
    expect(successSvg.style.getPropertyValue('--erwin-visor-color')).toContain('--wb-status-success');

    // 4. Warning state
    const { container: warningContainer } = render(<ErwinAvatar state="warning" />);
    const warningSvg = warningContainer.querySelector('svg') as HTMLElement;
    expect(warningSvg.style.getPropertyValue('--erwin-visor-color')).toContain('--wb-status-warning');
  });

  it('renders eyes inside the visor by default and allows toggling', () => {
    const { container: withEyes } = render(<ErwinAvatar showEyes={true} />);
    expect(withEyes.querySelector('#erwin-eye-left')).toBeTruthy();
    expect(withEyes.querySelector('#erwin-eye-right')).toBeTruthy();

    const { container: withoutEyes } = render(<ErwinAvatar showEyes={false} />);
    expect(withoutEyes.querySelector('#erwin-eye-left')).toBeNull();
    expect(withoutEyes.querySelector('#erwin-eye-right')).toBeNull();
  });
});

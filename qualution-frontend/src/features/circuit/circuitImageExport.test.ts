import { describe, it, expect } from 'vitest';
import { exportCircuitToSvg } from './circuitImageExport';
import type { CircuitRequest } from './types';

describe('Circuit SVG & Image Export (Step 24.5)', () => {
  const bellCircuit: CircuitRequest = {
    qubits: 2,
    classical_bits: 2,
    gates: [
      { id: 'g1', gate: 'h', targets: [0], column: 0 },
      { id: 'g2', gate: 'cx', targets: [0, 1], column: 1 },
    ],
    measure: true,
    shots: 1000,
  };

  it('generates valid standalone SVG markup containing wires and gates', () => {
    const svg = exportCircuitToSvg(bellCircuit, 'dark');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('q[0]');
    expect(svg).toContain('q[1]');
    expect(svg).toContain('>H<');
    expect(svg).toContain('</svg>');
  });

  it('supports light theme colors in SVG export', () => {
    const lightSvg = exportCircuitToSvg(bellCircuit, 'light');
    expect(lightSvg).toContain('fill="#ffffff"');
    expect(lightSvg).toContain('stroke="#0969da"');
  });
});

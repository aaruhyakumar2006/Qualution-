import type { CircuitRequest } from './types';

/**
 * Generates standalone SVG markup representing the quantum circuit.
 */
export function exportCircuitToSvg(circuit: CircuitRequest, theme: 'dark' | 'light' = 'dark'): string {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0d1117' : '#ffffff';
  const textColor = isDark ? '#e6edf3' : '#1f2328';
  const wireColor = isDark ? '#30363d' : '#d0d7de';
  const gateBg = isDark ? '#161b22' : '#f6f8fa';
  const gateStroke = isDark ? '#58a6ff' : '#0969da';

  const rowHeight = 44;
  const colWidth = 48;
  const maxCol = circuit.gates.reduce((m, g) => Math.max(m, g.column ?? 0), -1);
  const totalCols = Math.max(6, maxCol + 2);
  const width = 100 + totalCols * colWidth;
  const height = 40 + circuit.qubits * rowHeight;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `  <rect width="100%" height="100%" fill="${bgColor}"/>\n`;

  // Draw wire tracks
  for (let q = 0; q < circuit.qubits; q++) {
    const y = 30 + q * rowHeight;
    svg += `  <text x="20" y="${y + 4}" fill="${textColor}" font-family="monospace" font-size="12" font-weight="bold">q[${q}]</text>\n`;
    svg += `  <line x1="60" y1="${y}" x2="${width - 20}" y2="${y}" stroke="${wireColor}" stroke-width="1.5"/>\n`;
  }

  // Draw gates
  for (const g of circuit.gates) {
    const col = g.column ?? 0;
    const x = 70 + col * colWidth;

    if (g.targets.length === 1) {
      const q = g.targets[0];
      const y = 30 + q * rowHeight;
      svg += `  <rect x="${x - 16}" y="${y - 14}" width="32" height="28" rx="4" fill="${gateBg}" stroke="${gateStroke}" stroke-width="1.5"/>\n`;
      svg += `  <text x="${x}" y="${y + 4}" fill="${textColor}" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${g.gate.toUpperCase()}</text>\n`;
    } else if (g.targets.length === 2) {
      const cQ = g.targets[0];
      const tQ = g.targets[1];
      const cy = 30 + cQ * rowHeight;
      const ty = 30 + tQ * rowHeight;

      // Connecting vertical line
      svg += `  <line x1="${x}" y1="${cy}" x2="${x}" y2="${ty}" stroke="${gateStroke}" stroke-width="2"/>\n`;
      // Control dot
      svg += `  <circle cx="${x}" cy="${cy}" r="4" fill="${gateStroke}"/>\n`;
      // Target cross
      if (g.gate.toLowerCase() === 'cx') {
        svg += `  <circle cx="${x}" cy="${ty}" r="10" fill="${gateBg}" stroke="${gateStroke}" stroke-width="1.5"/>\n`;
        svg += `  <line x1="${x - 7}" y1="${ty}" x2="${x + 7}" y2="${ty}" stroke="${gateStroke}" stroke-width="1.5"/>\n`;
        svg += `  <line x1="${x}" y1="${ty - 7}" x2="${x}" y2="${ty + 7}" stroke="${gateStroke}" stroke-width="1.5"/>\n`;
      } else {
        svg += `  <circle cx="${x}" cy="${ty}" r="4" fill="${gateStroke}"/>\n`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

/**
 * Exports circuit as downloadable SVG file.
 */
export function downloadCircuitSvg(circuit: CircuitRequest, filename = 'circuit.svg', theme: 'dark' | 'light' = 'dark'): void {
  const svgContent = exportCircuitToSvg(circuit, theme);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Exports circuit as downloadable PNG image.
 */
export function downloadCircuitPng(circuit: CircuitRequest, filename = 'circuit.png', theme: 'dark' | 'light' = 'dark'): void {
  const svgContent = exportCircuitToSvg(circuit, theme);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(pngUrl);
        }
      }, 'image/png');
    }
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

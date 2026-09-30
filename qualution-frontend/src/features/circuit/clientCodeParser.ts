/**
 * clientCodeParser.ts
 *
 * Robust, zero-latency, offline-capable client-side quantum code parser.
 * Supports OpenQASM 3.0 / 2.0, Qiskit (Python), PennyLane (Python), and Cirq (Python).
 * Replicates parsed quantum operations directly into QUALUTION CircuitRequest IR.
 */

import type { CircuitRequest, Gate } from './types';
import type { ParseResponse, ParseWarning } from '../../api/circuitApi';

/**
 * Safely evaluate math expression containing numbers, pi, and basic arithmetic (+, -, *, /).
 */
export function safeEvalAngle(expr: string): number {
  if (!expr || !expr.trim()) return 0;
  let clean = expr.trim().toLowerCase();

  // Replace numpy/math references
  clean = clean.replace(/math\.pi/g, String(Math.PI));
  clean = clean.replace(/np\.pi/g, String(Math.PI));
  clean = clean.replace(/numpy\.pi/g, String(Math.PI));
  clean = clean.replace(/\bpi\b/g, String(Math.PI));

  // Sanitize: allow only digits, decimal point, operators, parentheses, and spaces
  if (!/^[-+*/0-9.()\s]+$/.test(clean)) {
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${clean});`)();
    return typeof result === 'number' && !isNaN(result) ? result : 0;
  } catch {
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }
}

/**
 * Extract integer qubit index from token like "q[0]", "qr[1]", "0", or "q0".
 */
export function extractQubitIndex(token: string): number | null {
  if (!token) return null;
  const trimmed = token.trim();
  const bracketMatch = trimmed.match(/\[\s*(\d+)\s*\]/);
  if (bracketMatch) {
    return parseInt(bracketMatch[1], 10);
  }
  const digitMatch = trimmed.match(/^q?r?(\d+)$/i);
  if (digitMatch) {
    return parseInt(digitMatch[1], 10);
  }
  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
}

/**
 * Parse OpenQASM 2.0 / 3.0 code into CircuitRequest
 */
export function parseOpenQASMClient(code: string): ParseResponse {
  let qubits = 0;
  let classicalBits = 0;
  let hasMeasurements = false;
  const gates: Gate[] = [];
  const warnings: ParseWarning[] = [];
  let maxSeenQubit = -1;

  // Gate statements: gate(angle)? target1, target2, ...;
  const stmtPattern = /^\s*([a-zA-Z0-9_]+)(?:\s*\(([^)]+)\))?\s+([^;]+);/;
  const measureArrowPattern = /^\s*measure\s+\w+\[\s*(\d+)\s*\]\s*->\s*\w+\[\s*(\d+)\s*\];/i;
  const measureAssignPattern = /^\s*\w+\[\s*(\d+)\s*\]\s*=\s*measure\s+\w+\[\s*(\d+)\s*\];/i;

  const lines = code.split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineNum = lineIdx + 1;
    let line = lines[lineIdx].trim();

    // Strip comments
    const commentIdx = line.indexOf('//');
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx).trim();
    }
    if (!line) continue;

    // Header statements
    if (line.toUpperCase().startsWith('OPENQASM') || line.startsWith('include')) {
      continue;
    }

    // Qubit register declarations
    const q3Match = line.match(/^qubit\s*\[\s*(\d+)\s*\]\s+\w+;/i);
    if (q3Match) {
      qubits = Math.max(qubits, parseInt(q3Match[1], 10));
      continue;
    }
    const q2Match = line.match(/^qreg\s+\w+\s*\[\s*(\d+)\s*\];/i);
    if (q2Match) {
      qubits = Math.max(qubits, parseInt(q2Match[1], 10));
      continue;
    }

    // Classical bit register declarations
    const c3Match = line.match(/^bit\s*\[\s*(\d+)\s*\]\s+\w+;/i);
    if (c3Match) {
      classicalBits = Math.max(classicalBits, parseInt(c3Match[1], 10));
      continue;
    }
    const c2Match = line.match(/^creg\s+\w+\s*\[\s*(\d+)\s*\];/i);
    if (c2Match) {
      classicalBits = Math.max(classicalBits, parseInt(c2Match[1], 10));
      continue;
    }

    // Barrier
    if (line.startsWith('barrier')) {
      continue;
    }

    // Measure statements
    if (measureArrowPattern.test(line) || measureAssignPattern.test(line)) {
      hasMeasurements = true;
      continue;
    }

    // Gate operations
    const match = line.match(stmtPattern);
    if (!match) continue;

    const rawGate = match[1].toLowerCase();
    const rawAngle = match[2];
    const rawOperands = match[3];

    if (rawGate === 'measure') {
      hasMeasurements = true;
      continue;
    }

    // Extract target qubits
    const operandTokens = rawOperands.split(',').map((s) => s.trim()).filter(Boolean);
    const targets: number[] = [];
    for (const tok of operandTokens) {
      const qIdx = extractQubitIndex(tok);
      if (qIdx !== null) {
        targets.push(qIdx);
        maxSeenQubit = Math.max(maxSeenQubit, qIdx);
      }
    }

    const angle = rawAngle !== undefined ? safeEvalAngle(rawAngle) : undefined;

    // Normalize canonical gate name
    let gateName = rawGate;
    if (gateName === 'cnot') gateName = 'cx';
    else if (gateName === 'toffoli') gateName = 'ccx';
    else if (gateName === 'phase') gateName = 'p';

    if (['h', 'x', 'y', 'z', 's', 't', 'id', 'i'].includes(gateName)) {
      for (const t of targets) {
        gates.push({ gate: gateName === 'i' ? 'id' : gateName, targets: [t] });
      }
    } else if (['rx', 'ry', 'rz', 'p'].includes(gateName)) {
      for (const t of targets) {
        gates.push({ gate: gateName, targets: [t], angle: angle ?? 0 });
      }
    } else if (['cx', 'cz', 'swap'].includes(gateName)) {
      if (targets.length >= 2) {
        gates.push({ gate: gateName, targets: [targets[0], targets[1]] });
      } else {
        warnings.push({ line: lineNum, message: `Gate ${gateName} requires 2 qubit targets` });
      }
    } else if (['ccx'].includes(gateName)) {
      if (targets.length >= 3) {
        gates.push({ gate: 'ccx', targets: [targets[0], targets[1], targets[2]] });
      } else {
        warnings.push({ line: lineNum, message: `Gate ${gateName} requires 3 qubit targets` });
      }
    } else {
      warnings.push({ line: lineNum, message: `Ignored unsupported gate '${rawGate}'` });
    }
  }

  const finalQubits = Math.max(qubits, maxSeenQubit + 1, 1);
  const finalClassicalBits = classicalBits > 0 ? classicalBits : (hasMeasurements ? finalQubits : finalQubits);

  const circuit: CircuitRequest = {
    qubits: finalQubits,
    classical_bits: finalClassicalBits,
    gates,
    measure: hasMeasurements,
    shots: 1024,
  };

  return {
    framework: 'openqasm',
    circuit,
    warnings,
    metadata: {
      qubit_count: finalQubits,
      gate_count: gates.length,
      measure: hasMeasurements,
    },
  };
}

/**
 * Parse Qiskit Python code into CircuitRequest
 */
export function parseQiskitClient(code: string): ParseResponse {
  let qubits = 0;
  let classicalBits = 0;
  let shots = 1024;
  let hasMeasurements = false;
  const gates: Gate[] = [];
  const warnings: ParseWarning[] = [];
  let maxSeenQubit = -1;

  const lines = code.split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineNum = lineIdx + 1;
    let line = lines[lineIdx].trim();

    // Strip comments
    const commentIdx = line.indexOf('#');
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx).trim();
    }
    if (!line) continue;

    // Detect QuantumCircuit(qubits, [clbits])
    const qcInitMatch = line.match(/(?:(?:qc|circuit|\w+)\s*=\s*)?QuantumCircuit\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\)/i);
    if (qcInitMatch) {
      qubits = Math.max(qubits, parseInt(qcInitMatch[1], 10));
      if (qcInitMatch[2]) {
        classicalBits = Math.max(classicalBits, parseInt(qcInitMatch[2], 10));
      }
      continue;
    }

    // Detect shots in simulator.run(qc, shots=N)
    const shotsMatch = line.match(/shots\s*=\s*(\d+)/i);
    if (shotsMatch) {
      shots = parseInt(shotsMatch[1], 10);
    }

    // Detect method calls on quantum circuit: qc.gate(...) or circuit.gate(...)
    const callMatch = line.match(/(?:qc|circuit|\w+)\.([a-zA-Z0-9_]+)\s*\((.*)\)/);
    if (!callMatch) continue;

    const method = callMatch[1].toLowerCase();
    const argsRaw = callMatch[2].trim();

    if (['barrier', 'draw'].includes(method)) {
      continue;
    }

    if (method === 'measure_all') {
      hasMeasurements = true;
      continue;
    }

    if (method === 'measure') {
      hasMeasurements = true;
      continue;
    }

    // Parse comma separated arguments (respecting parenthesis)
    const args: string[] = [];
    let currentArg = '';
    let depth = 0;
    for (let i = 0; i < argsRaw.length; i++) {
      const char = argsRaw[i];
      if (char === '(' || char === '[') depth++;
      else if (char === ')' || char === ']') depth--;
      else if (char === ',' && depth === 0) {
        args.push(currentArg.trim());
        currentArg = '';
        continue;
      }
      currentArg += char;
    }
    if (currentArg.trim()) {
      args.push(currentArg.trim());
    }

    // 1-Qubit Clifford / Pauli
    if (['h', 'x', 'y', 'z', 's', 't', 'id', 'i'].includes(method)) {
      if (args.length >= 1) {
        const q = extractQubitIndex(args[0]);
        if (q !== null) {
          maxSeenQubit = Math.max(maxSeenQubit, q);
          gates.push({ gate: method === 'i' ? 'id' : method, targets: [q] });
        }
      }
    }
    // Rotations: qc.rx(angle, qubit), qc.ry, qc.rz, qc.p, qc.phase
    else if (['rx', 'ry', 'rz', 'p', 'phase'].includes(method)) {
      if (args.length >= 2) {
        const angle = safeEvalAngle(args[0]);
        const q = extractQubitIndex(args[1]);
        if (q !== null) {
          maxSeenQubit = Math.max(maxSeenQubit, q);
          gates.push({ gate: method === 'phase' ? 'p' : method, targets: [q], angle });
        }
      }
    }
    // 2-Qubit gates: qc.cx(control, target), qc.cz, qc.swap, qc.cnot
    else if (['cx', 'cnot', 'cz', 'swap'].includes(method)) {
      if (args.length >= 2) {
        const c = extractQubitIndex(args[0]);
        const t = extractQubitIndex(args[1]);
        if (c !== null && t !== null) {
          maxSeenQubit = Math.max(maxSeenQubit, c, t);
          gates.push({ gate: method === 'cnot' ? 'cx' : method, targets: [c, t] });
        }
      }
    }
    // 3-Qubit gates: qc.ccx(c1, c2, target), qc.toffoli
    else if (['ccx', 'toffoli'].includes(method)) {
      if (args.length >= 3) {
        const c1 = extractQubitIndex(args[0]);
        const c2 = extractQubitIndex(args[1]);
        const t = extractQubitIndex(args[2]);
        if (c1 !== null && c2 !== null && t !== null) {
          maxSeenQubit = Math.max(maxSeenQubit, c1, c2, t);
          gates.push({ gate: 'ccx', targets: [c1, c2, t] });
        }
      }
    }
  }

  const finalQubits = Math.max(qubits, maxSeenQubit + 1, 1);
  const finalClassicalBits = classicalBits > 0 ? classicalBits : (hasMeasurements ? finalQubits : finalQubits);

  const circuit: CircuitRequest = {
    qubits: finalQubits,
    classical_bits: finalClassicalBits,
    gates,
    measure: hasMeasurements,
    shots,
  };

  return {
    framework: 'qiskit',
    circuit,
    warnings,
    metadata: {
      qubit_count: finalQubits,
      gate_count: gates.length,
      measure: hasMeasurements,
    },
  };
}

/**
 * Parse PennyLane Python code into CircuitRequest
 */
export function parsePennyLaneClient(code: string): ParseResponse {
  let qubits = 0;
  let maxSeenQubit = -1;
  const gates: Gate[] = [];
  const warnings: ParseWarning[] = [];

  const deviceMatch = code.match(/wires\s*=\s*(\d+)/i);
  if (deviceMatch) {
    qubits = parseInt(deviceMatch[1], 10);
  }

  const lines = code.split('\n');
  for (const line of lines) {
    const clean = line.replace(/#.*$/, '').trim();
    if (!clean.includes('qml.')) continue;

    // Single qubit gates
    const singleMatch = clean.match(/qml\.(Hadamard|PauliX|PauliY|PauliZ|S|T)\s*\(\s*wires\s*=\s*(\d+)\s*\)/i);
    if (singleMatch) {
      const gName = singleMatch[1].toLowerCase().replace('pauli', '');
      const wire = parseInt(singleMatch[2], 10);
      maxSeenQubit = Math.max(maxSeenQubit, wire);
      gates.push({ gate: gName === 'hadamard' ? 'h' : gName, targets: [wire] });
      continue;
    }

    // Rotations: qml.RX(angle, wires=0)
    const rotMatch = clean.match(/qml\.(RX|RY|RZ|PhaseShift)\s*\(\s*([^,]+),\s*wires\s*=\s*(\d+)\s*\)/i);
    if (rotMatch) {
      const rawG = rotMatch[1].toLowerCase();
      const angle = safeEvalAngle(rotMatch[2]);
      const wire = parseInt(rotMatch[3], 10);
      maxSeenQubit = Math.max(maxSeenQubit, wire);
      const gate = rawG === 'phaseshift' ? 'p' : rawG;
      gates.push({ gate, targets: [wire], angle });
      continue;
    }

    // 2-Qubit gates: qml.CNOT(wires=[0, 1])
    const cnotMatch = clean.match(/qml\.(CNOT|CZ|SWAP)\s*\(\s*wires\s*=\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]\s*\)/i);
    if (cnotMatch) {
      const rawG = cnotMatch[1].toLowerCase();
      const c = parseInt(cnotMatch[2], 10);
      const t = parseInt(cnotMatch[3], 10);
      maxSeenQubit = Math.max(maxSeenQubit, c, t);
      gates.push({ gate: rawG === 'cnot' ? 'cx' : rawG, targets: [c, t] });
      continue;
    }

    // 3-Qubit gates: qml.Toffoli(wires=[0, 1, 2])
    const toffMatch = clean.match(/qml\.Toffoli\s*\(\s*wires\s*=\s*\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]\s*\)/i);
    if (toffMatch) {
      const c1 = parseInt(toffMatch[1], 10);
      const c2 = parseInt(toffMatch[2], 10);
      const t = parseInt(toffMatch[3], 10);
      maxSeenQubit = Math.max(maxSeenQubit, c1, c2, t);
      gates.push({ gate: 'ccx', targets: [c1, c2, t] });
      continue;
    }
  }

  const finalQubits = Math.max(qubits, maxSeenQubit + 1, 1);
  return {
    framework: 'pennylane',
    circuit: {
      qubits: finalQubits,
      classical_bits: finalQubits,
      gates,
      measure: true,
      shots: 1024,
    },
    warnings,
    metadata: {
      qubit_count: finalQubits,
      gate_count: gates.length,
      measure: true,
    },
  };
}

/**
 * Parse Cirq Python code into CircuitRequest
 */
export function parseCirqClient(code: string): ParseResponse {
  let qubits = 0;
  let maxSeenQubit = -1;
  const gates: Gate[] = [];
  const warnings: ParseWarning[] = [];

  const rangeMatch = code.match(/LineQubit\.range\s*\(\s*(\d+)\s*\)/i);
  if (rangeMatch) {
    qubits = parseInt(rangeMatch[1], 10);
  }

  const lines = code.split('\n');
  for (const line of lines) {
    const clean = line.replace(/#.*$/, '').trim();
    if (!clean.includes('cirq.')) continue;

    // Single qubit gates: cirq.H(q[0]) or cirq.H(q0) or cirq.H(0)
    const singleMatch = clean.match(/cirq\.(H|X|Y|Z|S|T)\s*\(([^)]+)\)/i);
    if (singleMatch) {
      const gName = singleMatch[1].toLowerCase();
      const q = extractQubitIndex(singleMatch[2]);
      if (q !== null) {
        maxSeenQubit = Math.max(maxSeenQubit, q);
        gates.push({ gate: gName, targets: [q] });
      }
      continue;
    }

    // Curried rotations: cirq.rx(angle)(q[0])
    const rotMatch = clean.match(/cirq\.(rx|ry|rz)\s*\(([^)]+)\)\s*\(([^)]+)\)/i);
    if (rotMatch) {
      const gName = rotMatch[1].toLowerCase();
      const angle = safeEvalAngle(rotMatch[2]);
      const q = extractQubitIndex(rotMatch[3]);
      if (q !== null) {
        maxSeenQubit = Math.max(maxSeenQubit, q);
        gates.push({ gate: gName, targets: [q], angle });
      }
      continue;
    }

    // 2-Qubit gates: cirq.CNOT(q[0], q[1]) or cirq.CZ(q0, q1)
    const twoQMatch = clean.match(/cirq\.(CNOT|CX|CZ|SWAP)\s*\(([^,]+),\s*([^)]+)\)/i);
    if (twoQMatch) {
      const gName = twoQMatch[1].toLowerCase();
      const c = extractQubitIndex(twoQMatch[2]);
      const t = extractQubitIndex(twoQMatch[3]);
      if (c !== null && t !== null) {
        maxSeenQubit = Math.max(maxSeenQubit, c, t);
        gates.push({ gate: gName === 'cnot' ? 'cx' : gName, targets: [c, t] });
      }
      continue;
    }

    // 3-Qubit gates: cirq.TOFFOLI(q0, q1, q2)
    const toffMatch = clean.match(/cirq\.(TOFFOLI|CCX)\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/i);
    if (toffMatch) {
      const c1 = extractQubitIndex(toffMatch[2]);
      const c2 = extractQubitIndex(toffMatch[3]);
      const t = extractQubitIndex(toffMatch[4]);
      if (c1 !== null && c2 !== null && t !== null) {
        maxSeenQubit = Math.max(maxSeenQubit, c1, c2, t);
        gates.push({ gate: 'ccx', targets: [c1, c2, t] });
      }
      continue;
    }
  }

  const finalQubits = Math.max(qubits, maxSeenQubit + 1, 1);
  return {
    framework: 'cirq',
    circuit: {
      qubits: finalQubits,
      classical_bits: finalQubits,
      gates,
      measure: cleanCodeHasMeasure(code),
      shots: 1024,
    },
    warnings,
    metadata: {
      qubit_count: finalQubits,
      gate_count: gates.length,
      measure: cleanCodeHasMeasure(code),
    },
  };
}

function cleanCodeHasMeasure(code: string): boolean {
  return /cirq\.measure/i.test(code);
}

/**
 * Unified client-side entry point
 */
export function parseCodeClient(
  framework: 'qiskit' | 'pennylane' | 'cirq' | 'openqasm',
  code: string
): ParseResponse {
  switch (framework) {
    case 'openqasm':
      return parseOpenQASMClient(code);
    case 'qiskit':
      return parseQiskitClient(code);
    case 'pennylane':
      return parsePennyLaneClient(code);
    case 'cirq':
      return parseCirqClient(code);
    default:
      return parseOpenQASMClient(code);
  }
}

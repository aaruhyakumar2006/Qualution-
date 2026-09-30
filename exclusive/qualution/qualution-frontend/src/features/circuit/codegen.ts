import type { CircuitRequest } from './types';

/**
 * Deterministically generate OpenQASM 3.0 code from Circuit IR
 */
export function generateOpenQASMCode(circuit: CircuitRequest): string {
  const lines: string[] = [];
  lines.push('OPENQASM 3.0;');
  lines.push('include "stdgates.inc";');
  lines.push('');
  lines.push(`qubit[${circuit.qubits}] q;`);
  lines.push(`bit[${circuit.classical_bits}] c;`);
  lines.push('');

  const gates = Array.isArray(circuit?.gates) ? circuit.gates : [];
  for (const g of gates) {
    if (!g) continue;
    const gateName = (g.gate || (g as any).type || '').toLowerCase();
    const t = Array.isArray(g.targets) && g.targets.length > 0 ? g.targets : [0];
    switch (gateName) {
      case 'h': lines.push(`h q[${t[0]}];`); break;
      case 'x': lines.push(`x q[${t[0]}];`); break;
      case 'y': lines.push(`y q[${t[0]}];`); break;
      case 'z': lines.push(`z q[${t[0]}];`); break;
      case 's': lines.push(`s q[${t[0]}];`); break;
      case 't': lines.push(`t q[${t[0]}];`); break;
      case 'rx': lines.push(`rx(${g.angle ?? 0}) q[${t[0]}];`); break;
      case 'ry': lines.push(`ry(${g.angle ?? 0}) q[${t[0]}];`); break;
      case 'rz': lines.push(`rz(${g.angle ?? 0}) q[${t[0]}];`); break;
      case 'p': lines.push(`p(${g.angle ?? 0}) q[${t[0]}];`); break;
      case 'cx': lines.push(`cx q[${t[0]}], q[${t[1] ?? t[0]}];`); break;
      case 'cz': lines.push(`cz q[${t[0]}], q[${t[1] ?? t[0]}];`); break;
      case 'swap': lines.push(`swap q[${t[0]}], q[${t[1] ?? t[0]}];`); break;
      case 'ccx': lines.push(`ccx q[${t[0]}], q[${t[1] ?? t[0]}], q[${t[2] ?? t[0]}];`); break;
      default: lines.push(`// ${g.gate || gateName} q[${t.join(', ')}];`);
    }
  }
  return lines.join('\n');
}

/**
 * Deterministically generate idiomatic Qiskit Python code from Circuit IR
 */
export function generateQiskitCode(circuit: CircuitRequest): string {
  const lines: string[] = [];
  lines.push('from qiskit import QuantumCircuit');
  lines.push('from qiskit_aer import AerSimulator');
  lines.push('');
  lines.push(`# Initialize ${circuit.qubits}-Qubit Quantum Circuit`);
  lines.push(`qc = QuantumCircuit(${circuit.qubits}, ${circuit.classical_bits})`);
  lines.push('');

  const qiskitGates = Array.isArray(circuit?.gates) ? circuit.gates : [];
  if (qiskitGates.length > 0) {
    lines.push('# Apply Quantum Operations');
    for (const g of qiskitGates) {
      if (!g) continue;
      const gateName = (g.gate || (g as any).type || '').toLowerCase();
      const targets = Array.isArray(g.targets) && g.targets.length > 0 ? g.targets : [0];

      switch (gateName) {
        case 'h':
          lines.push(`qc.h(${targets[0]})`);
          break;
        case 'x':
          lines.push(`qc.x(${targets[0]})`);
          break;
        case 'y':
          lines.push(`qc.y(${targets[0]})`);
          break;
        case 'z':
          lines.push(`qc.z(${targets[0]})`);
          break;
        case 's':
          lines.push(`qc.s(${targets[0]})`);
          break;
        case 't':
          lines.push(`qc.t(${targets[0]})`);
          break;
        case 'rx':
          lines.push(`qc.rx(${g.angle ?? 0}, ${targets[0]})`);
          break;
        case 'ry':
          lines.push(`qc.ry(${g.angle ?? 0}, ${targets[0]})`);
          break;
        case 'rz':
          lines.push(`qc.rz(${g.angle ?? 0}, ${targets[0]})`);
          break;
        case 'cx':
          lines.push(`qc.cx(${targets[0]}, ${targets[1] ?? targets[0]})`);
          break;
        case 'cz':
          lines.push(`qc.cz(${targets[0]}, ${targets[1] ?? targets[0]})`);
          break;
        case 'swap':
          lines.push(`qc.swap(${targets[0]}, ${targets[1] ?? targets[0]})`);
          break;
        default:
          lines.push(`# Unsupported gate: ${g.gate}`);
      }
    }
    lines.push('');
  }

  if (circuit.measure) {
    lines.push('# Measurement Operations');
    for (let i = 0; i < circuit.qubits; i++) {
      lines.push(`qc.measure(${i}, ${i})`);
    }
    lines.push('');
  }

  lines.push('# Run Aer Simulation');
  lines.push('simulator = AerSimulator()');
  lines.push(`job = simulator.run(qc, shots=${circuit.shots})`);
  lines.push('result = job.result()');
  lines.push('counts = result.get_counts()');
  lines.push('print("Simulation counts:", counts)');

  return lines.join('\n');
}

/**
 * Deterministically generate idiomatic PennyLane Python code from Circuit IR
 */
export function generatePennyLaneCode(circuit: CircuitRequest): string {
  const lines: string[] = [];
  lines.push('import pennylane as qml');
  lines.push('');
  lines.push('# Initialize Quantum Device');
  lines.push(`dev = qml.device("default.qubit", wires=${circuit.qubits})`);
  lines.push('');
  lines.push(`@qml.qnode(dev, shots=${circuit.shots})`);
  lines.push('def circuit():');

  if (circuit.gates.length === 0) {
    lines.push('    pass');
  } else {
    for (const g of circuit.gates) {
      const gateName = g.gate.toLowerCase();
      const targets = g.targets;

      switch (gateName) {
        case 'h':
          lines.push(`    qml.Hadamard(wires=${targets[0]})`);
          break;
        case 'x':
          lines.push(`    qml.PauliX(wires=${targets[0]})`);
          break;
        case 'y':
          lines.push(`    qml.PauliY(wires=${targets[0]})`);
          break;
        case 'z':
          lines.push(`    qml.PauliZ(wires=${targets[0]})`);
          break;
        case 's':
          lines.push(`    qml.S(wires=${targets[0]})`);
          break;
        case 't':
          lines.push(`    qml.T(wires=${targets[0]})`);
          break;
        case 'rx':
          lines.push(`    qml.RX(${g.angle ?? 0}, wires=${targets[0]})`);
          break;
        case 'ry':
          lines.push(`    qml.RY(${g.angle ?? 0}, wires=${targets[0]})`);
          break;
        case 'rz':
          lines.push(`    qml.RZ(${g.angle ?? 0}, wires=${targets[0]})`);
          break;
        case 'cx':
          lines.push(`    qml.CNOT(wires=[${targets[0]}, ${targets[1]}])`);
          break;
        case 'cz':
          lines.push(`    qml.CZ(wires=[${targets[0]}, ${targets[1]}])`);
          break;
        case 'swap':
          lines.push(`    qml.SWAP(wires=[${targets[0]}, ${targets[1]}])`);
          break;
        default:
          lines.push(`    # Unsupported gate: ${g.gate}`);
      }
    }
  }

  lines.push('');
  if (circuit.measure) {
    lines.push('    return qml.counts()');
  } else {
    lines.push('    return qml.state()');
  }

  lines.push('');
  lines.push('# Execute Simulation');
  lines.push('counts = circuit()');
  lines.push('print("Measurement counts:", counts)');

  return lines.join('\n');
}

/**
 * Deterministically generate idiomatic Cirq Python code from Circuit IR
 */
export function generateCirqCode(circuit: CircuitRequest): string {
  const lines: string[] = [];
  lines.push('import cirq');
  lines.push('import numpy as np');
  lines.push('');
  lines.push(`# Initialize ${circuit.qubits} Qubit(s)`);
  lines.push(`qubits = [cirq.LineQubit(i) for i in range(${circuit.qubits})]`);
  lines.push('circuit = cirq.Circuit()');
  lines.push('');

  if (circuit.gates.length > 0) {
    lines.push('# Apply Quantum Operations');
    for (const g of circuit.gates) {
      const gateName = g.gate.toLowerCase();
      const targets = g.targets;

      switch (gateName) {
        case 'h':
          lines.push(`circuit.append(cirq.H(qubits[${targets[0]}]))`);
          break;
        case 'x':
          lines.push(`circuit.append(cirq.X(qubits[${targets[0]}]))`);
          break;
        case 'y':
          lines.push(`circuit.append(cirq.Y(qubits[${targets[0]}]))`);
          break;
        case 'z':
          lines.push(`circuit.append(cirq.Z(qubits[${targets[0]}]))`);
          break;
        case 's':
          lines.push(`circuit.append(cirq.S(qubits[${targets[0]}]))`);
          break;
        case 't':
          lines.push(`circuit.append(cirq.T(qubits[${targets[0]}]))`);
          break;
        case 'rx':
          lines.push(`circuit.append(cirq.rx(${g.angle ?? 0})(qubits[${targets[0]}]))`);
          break;
        case 'ry':
          lines.push(`circuit.append(cirq.ry(${g.angle ?? 0})(qubits[${targets[0]}]))`);
          break;
        case 'rz':
          lines.push(`circuit.append(cirq.rz(${g.angle ?? 0})(qubits[${targets[0]}]))`);
          break;
        case 'cx':
          lines.push(`circuit.append(cirq.CNOT(qubits[${targets[0]}], qubits[${targets[1]}]))`);
          break;
        case 'cz':
          lines.push(`circuit.append(cirq.CZ(qubits[${targets[0]}], qubits[${targets[1]}]))`);
          break;
        case 'swap':
          lines.push(`circuit.append(cirq.SWAP(qubits[${targets[0]}], qubits[${targets[1]}]))`);
          break;
        default:
          lines.push(`# Unsupported gate: ${g.gate}`);
      }
    }
    lines.push('');
  }

  if (circuit.measure) {
    lines.push('# Measurement Operations');
    lines.push('for i in range(len(qubits)):');
    lines.push('    circuit.append(cirq.measure(qubits[i], key=f"q{i}"))');
    lines.push('');
    lines.push('simulator = cirq.Simulator()');
    lines.push(`result = simulator.run(circuit, repetitions=${circuit.shots})`);
    lines.push('print(result)');
  } else {
    lines.push('# Statevector Simulation');
    lines.push('simulator = cirq.Simulator()');
    lines.push('result = simulator.simulate(circuit)');
    lines.push('print("Statevector:", result.state_vector())');
  }

  return lines.join('\n');
}

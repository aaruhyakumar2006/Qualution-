import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { CircuitRequest } from '../../../features/circuit/types';
import type { ExecutionState } from '../../../features/circuit/executionState';
import './MathBridgePanel.css';

interface MathBridgePanelProps {
  circuit: CircuitRequest;
  executionState: ExecutionState;
}

export const MathBridgePanel: React.FC<MathBridgePanelProps> = ({ circuit, executionState }) => {
  const numQubits = circuit.qubits;

  const renderKatex = (expression: string) => {
    try {
      return { __html: katex.renderToString(expression, { throwOnError: false, displayMode: true }) };
    } catch (e) {
      return { __html: expression };
    }
  };

  const toDiracNotation = (statevector: { real: number; imag: number }[] | null, qubits: number) => {
    if (!statevector || statevector.length === 0) return '';
    const terms: string[] = [];
    
    statevector.forEach((amp, idx) => {
      const magSq = amp.real * amp.real + amp.imag * amp.imag;
      if (magSq > 1e-6) { // threshold for zero
        const binaryStr = idx.toString(2).padStart(qubits, '0');
        let coeffStr = '';
        
        // simple fraction recognition for common amplitudes
        const val = Math.abs(amp.real);
        const isNegative = amp.real < 0;
        const signStr = isNegative ? '-' : '+';
        
        if (Math.abs(val - 1.0) < 1e-6) {
          coeffStr = `${signStr} `;
        } else if (Math.abs(val - 0.7071) < 1e-3) {
          coeffStr = `${signStr} \\frac{1}{\\sqrt{2}} `;
        } else if (Math.abs(val - 0.5) < 1e-6) {
          coeffStr = `${signStr} \\frac{1}{2} `;
        } else {
          coeffStr = `${signStr} ${val.toFixed(2)} `;
        }
        
        // Add imaginary part if present (simplified)
        if (Math.abs(amp.imag) > 1e-6) {
          const imagVal = Math.abs(amp.imag);
          const imagSign = amp.imag < 0 ? '-' : '+';
          coeffStr = `+ (${val.toFixed(2)} ${imagSign} ${imagVal.toFixed(2)}i) `;
        }

        terms.push(`${coeffStr}| ${binaryStr} \\rangle`);
      }
    });

    if (terms.length === 0) return '| 0 \\dots 0 \\rangle';
    // Clean up first term sign if it's positive
    let result = terms.join(' ').trim();
    if (result.startsWith('+')) {
      result = result.substring(1).trim();
    }
    return result;
  };

  const initialExpression = `| \\psi_0 \\rangle = | ${'0'.repeat(numQubits)} \\rangle`;
  
  const finalExpression = useMemo(() => {
    if (executionState.status !== 'success' || !executionState.latestStatevector) {
      // If we only have 1 gate (like H), and it hasn't run, we might want to manually preview
      // But the IDE typically auto-runs.
      return `\\text{Waiting for simulation result...}`;
    }
    
    const dirac = toDiracNotation(executionState.latestStatevector, numQubits);
    const stepCount = circuit.gates.length;
    return `| \\psi_{${stepCount}} \\rangle = ${dirac}`;
  }, [executionState, circuit.gates.length, numQubits]);

  const unitariesExpression = useMemo(() => {
    if (circuit.gates.length === 0) return '';
    const reversedGates = [...circuit.gates].reverse();
    const gateStrs = reversedGates.map(g => {
      let gName = g.gate.toUpperCase();
      if (g.gate === 'cx') gName = 'CNOT';
      return gName;
    });
    return `U = ${gateStrs.join(' \\cdot ')}`;
  }, [circuit.gates]);


  return (
    <div className="math-bridge-panel ibm-scrollbar" data-testid="math-bridge-panel">
      <div className="math-bridge-header">
        <h3>Mathematical Visualization</h3>
        <p className="math-bridge-subtitle">Real-time state vector evolution</p>
      </div>

      <div className="math-bridge-content">
        <div className="math-section">
          <h4>Initial State</h4>
          <div className="math-equation" dangerouslySetInnerHTML={renderKatex(initialExpression)} />
        </div>

        {circuit.gates.length > 0 && (
          <div className="math-section">
            <h4>Gate Sequence</h4>
            <div className="math-equation" dangerouslySetInnerHTML={renderKatex(unitariesExpression)} />
          </div>
        )}

        <div className="math-section">
          <h4>Final State Vector</h4>
          <div className="math-equation final-state" dangerouslySetInnerHTML={renderKatex(finalExpression)} />
        </div>
      </div>
    </div>
  );
};

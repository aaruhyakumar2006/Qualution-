import React from 'react';
import type { CircuitRequest } from '../../features/circuit/types';
import type { ComplexNumber } from '../../features/circuit/types';
import './MathBridgePanel.css';

interface MathBridgePanelProps {
  circuit: CircuitRequest;
  statevector: ComplexNumber[] | null;
}

const ComplexNumber: React.FC<{ real: number; imag: number }> = ({ real, imag }) => {
  const isRealZero = Math.abs(real) < 1e-4;
  const isImagZero = Math.abs(imag) < 1e-4;

  if (isRealZero && isImagZero) return <span>0</span>;
  if (isRealZero) return <span>{imag > 0 ? '' : '-'}{Math.abs(imag).toFixed(3)}i</span>;
  if (isImagZero) return <span>{real.toFixed(3)}</span>;

  const sign = imag > 0 ? '+' : '-';
  return (
    <span>
      {real.toFixed(3)} {sign} {Math.abs(imag).toFixed(3)}i
    </span>
  );
};

export const MathBridgePanel: React.FC<MathBridgePanelProps> = ({ circuit, statevector }) => {

  if (!statevector || statevector.length === 0) {
    return (
      <div className="math-bridge-panel empty">
        <p>Run a simulation to view the mathematical representation of the statevector.</p>
      </div>
    );
  }

  const numQubits = circuit.qubits;
  
  return (
    <div className="math-bridge-panel">
      <div className="math-header">
        <h3>Dirac Notation (Ket)</h3>
      </div>
      <div className="math-content ket-view">
        <div className="ket-equation">
          <span className="psi">|ψ⟩ = </span>
          {statevector.map((amp, idx) => {
            const real = amp?.real ?? 0;
            const imag = amp?.imag ?? 0;
            const isZero = Math.abs(real) < 1e-4 && Math.abs(imag) < 1e-4;
            if (isZero) return null;
            
            const binaryString = idx.toString(2).padStart(numQubits, '0');
            return (
              <span key={idx} className="ket-term">
                <span className="amplitude">(<ComplexNumber real={real} imag={imag} />)</span>
                <span className="ket-state">|{binaryString}⟩</span>
                {idx < statevector.length - 1 ? ' + ' : ''}
              </span>
            );
          }).filter(Boolean)}
        </div>
      </div>
      
      <div className="math-header mt-4">
        <h3>Statevector (Column Vector)</h3>
      </div>
      <div className="math-content vector-view">
        <div className="vector-matrix">
          <span className="vector-bracket left-bracket">[</span>
          <div className="vector-column">
            {statevector.map((amp, idx) => (
              <div key={idx} className="vector-element">
                <ComplexNumber real={amp?.real ?? 0} imag={amp?.imag ?? 0} />
              </div>
            ))}
          </div>
          <span className="vector-bracket right-bracket">]</span>
        </div>
      </div>
    </div>
  );
};

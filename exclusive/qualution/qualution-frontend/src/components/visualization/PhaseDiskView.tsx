import React from 'react';
import type { ComplexNumber } from '../../features/circuit/types';
import { Sparkles, PieChart } from 'lucide-react';
import './PhaseDiskView.css';

interface PhaseDiskViewProps {
  statevector: ComplexNumber[] | null;
  qubitCount: number;
  stepIndex?: number;
}

export const PhaseDiskView: React.FC<PhaseDiskViewProps> = ({
  statevector,
  qubitCount,
  stepIndex = 0,
}) => {
  if (!statevector || statevector.length === 0) {
    return (
      <div className="phase-disk-empty" data-testid="phase-disk-empty">
        <Sparkles size={28} className="empty-icon" />
        <span className="empty-title">Phase Disks Ready</span>
        <p className="empty-desc">
          Execute the circuit to inspect single-qubit reduced phase angles and amplitude magnitudes.
        </p>
      </div>
    );
  }

  // Calculate per-qubit reduced density matrix or amplitude state for phase disks
  const N = qubitCount;
  const displayQubits = Math.min(N, 16);
  const sampleLimit = Math.min(statevector.length, 256);

  const qubitDisks = Array.from({ length: displayQubits }, (_, q) => {
    // Calculate P(|0⟩) and P(|1⟩) by summing probabilities where qubit q is 0 vs 1
    let p0 = 0;
    let p1 = 0;
    let crossTermReal = 0;
    let crossTermImag = 0;

    const shift = N - 1 - q;
    const safeShift = shift >= 0 && shift < 30 ? shift : 0;

    for (let i = 0; i < sampleLimit; i++) {
      const bit = (i >> safeShift) & 1;
      const comp = statevector[i];
      if (!comp) continue;
      const prob = comp.real * comp.real + comp.imag * comp.imag;
      if (bit === 0) {
        p0 += prob;
      } else {
        p1 += prob;
      }

      // If qubit q is 0, find corresponding state where qubit q is 1 to get relative phase
      if (bit === 0) {
        const matchedIdx = i | (1 << safeShift);
        const matchedComp = statevector[matchedIdx];
        if (matchedComp) {
          // c0^* * c1 = (r0 - i0*i) * (r1 + i1*i) = (r0*r1 + i0*i1) + i(r0*i1 - i0*r1)
          crossTermReal += comp.real * matchedComp.real + comp.imag * matchedComp.imag;
          crossTermImag += comp.real * matchedComp.imag - comp.imag * matchedComp.real;
        }
      }
    }

    const relPhaseRad = Math.atan2(crossTermImag, crossTermReal);
    const relPhaseDeg = ((relPhaseRad * 180) / Math.PI + 360) % 360;
    const mag = Math.sqrt(p1);

    return {
      qubit: q,
      p0,
      p1,
      relPhaseRad,
      relPhaseDeg,
      mag,
    };
  });

  return (
    <div className="phase-disk-container" data-testid="phase-disk-view">
      <div className="phase-disk-header">
        <div className="disk-header-title-box">
          <PieChart size={14} color="var(--accent-indigo)" />
          <span className="disk-title">Single-Qubit Phase Disks</span>
        </div>
        <span className="disk-sub">Timeline Step {stepIndex}</span>
      </div>

      <div className="phase-disks-grid">
        {qubitDisks.map((d) => {
          const diskRadius = 45;
          // Phase arrow coordinates
          const arrowX = 60 + diskRadius * Math.cos(-d.relPhaseRad);
          const arrowY = 60 + diskRadius * Math.sin(-d.relPhaseRad);

          return (
            <div key={d.qubit} className="qubit-phase-card" data-testid={`phase-disk-q${d.qubit}`}>
              <div className="card-wire-badge">q[{d.qubit}]</div>

              <div className="disk-svg-wrap">
                <svg viewBox="0 0 120 120" className="disk-svg">
                  {/* Background base disk */}
                  <circle cx="60" cy="60" r={diskRadius} fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

                  {/* Magnitude filled arc / area */}
                  <circle
                    cx="60"
                    cy="60"
                    r={Math.max(4, diskRadius * Math.sqrt(d.p1))}
                    fill={`hsl(${d.relPhaseDeg}, 80%, 50%)`}
                    fillOpacity="0.45"
                  />

                  {/* Radial axes */}
                  <line x1="60" y1="15" x2="60" y2="105" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="2 2" />
                  <line x1="15" y1="60" x2="105" y2="60" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="2 2" />

                  {/* Pointer line for Relative Phase */}
                  <line
                    x1="60"
                    y1="60"
                    x2={arrowX}
                    y2={arrowY}
                    stroke={`hsl(${d.relPhaseDeg}, 90%, 65%)`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx={arrowX} cy={arrowY} r="3" fill={`hsl(${d.relPhaseDeg}, 90%, 65%)`} />

                  {/* Center origin node */}
                  <circle cx="60" cy="60" r="2.5" fill="#e2e8f0" />
                </svg>
              </div>

              <div className="disk-meta-box">
                <div className="meta-row">
                  <span className="lbl">P(|1⟩):</span>
                  <span className="val">{(d.p1 * 100).toFixed(1)}%</span>
                </div>
                <div className="meta-row">
                  <span className="lbl">Relative Phase:</span>
                  <span className="val" style={{ color: `hsl(${d.relPhaseDeg}, 85%, 65%)` }}>
                    {d.relPhaseDeg.toFixed(0)}° ({(d.relPhaseRad / Math.PI).toFixed(2)}π)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

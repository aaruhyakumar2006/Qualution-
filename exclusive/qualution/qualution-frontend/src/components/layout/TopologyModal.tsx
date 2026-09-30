import React from 'react';
import { Network, X, ArrowRightLeft } from 'lucide-react';
import type { Gate } from '../../features/circuit/types';

interface TopologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTopology: string;
  onSelectTopology: (topology: string) => void;
  transpiledInstructions: Gate[] | null;
}

const TOPOLOGIES = ['None (Ideal)', 'Linear (5Q)', 'Cross (5Q)', 'Heavy-Hex (16Q)'];

export const TopologyModal: React.FC<TopologyModalProps> = ({
  isOpen,
  onClose,
  selectedTopology,
  onSelectTopology,
  transpiledInstructions,
}) => {
  if (!isOpen) return null;

  const renderTopologyGraph = () => {
    switch (selectedTopology) {
      case 'Linear (5Q)':
        return (
          <svg viewBox="0 0 200 60" width="100%" height="100" style={{ margin: '20px 0' }}>
            <line x1="20" y1="30" x2="180" y2="30" stroke="var(--ide-border)" strokeWidth="2" />
            {[0, 1, 2, 3, 4].map(i => (
              <g key={i} transform={`translate(${20 + i * 40}, 30)`}>
                <circle r="12" fill="var(--ide-bg-elevated)" stroke="var(--accent-cyan)" strokeWidth="2" />
                <text y="4" textAnchor="middle" fill="var(--ide-text)" fontSize="10">{i}</text>
              </g>
            ))}
          </svg>
        );
      case 'Cross (5Q)':
        return (
          <svg viewBox="0 0 200 120" width="100%" height="150" style={{ margin: '20px 0' }}>
            <line x1="100" y1="20" x2="100" y2="100" stroke="var(--ide-border)" strokeWidth="2" />
            <line x1="60" y1="60" x2="140" y2="60" stroke="var(--ide-border)" strokeWidth="2" />
            
            <g transform="translate(100, 60)">
              <circle r="12" fill="var(--ide-bg-elevated)" stroke="var(--accent-cyan)" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="var(--ide-text)" fontSize="10">0</text>
            </g>
            <g transform="translate(100, 20)">
              <circle r="12" fill="var(--ide-bg-elevated)" stroke="var(--ide-text-secondary)" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="var(--ide-text)" fontSize="10">1</text>
            </g>
            <g transform="translate(140, 60)">
              <circle r="12" fill="var(--ide-bg-elevated)" stroke="var(--ide-text-secondary)" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="var(--ide-text)" fontSize="10">2</text>
            </g>
            <g transform="translate(100, 100)">
              <circle r="12" fill="var(--ide-bg-elevated)" stroke="var(--ide-text-secondary)" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="var(--ide-text)" fontSize="10">3</text>
            </g>
            <g transform="translate(60, 60)">
              <circle r="12" fill="var(--ide-bg-elevated)" stroke="var(--ide-text-secondary)" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="var(--ide-text)" fontSize="10">4</text>
            </g>
          </svg>
        );
      case 'Heavy-Hex (16Q)':
        return (
          <svg viewBox="0 0 360 140" width="100%" height="150" style={{ margin: '20px 0' }}>
            {/* Edges */}
            <path d="M40,70 L80,70 L120,70 L120,30" stroke="var(--ide-border)" strokeWidth="2" fill="none" />
            <path d="M120,70 L160,70 L200,70 L200,110" stroke="var(--ide-border)" strokeWidth="2" fill="none" />
            <path d="M200,70 L240,70 L280,70 L280,30" stroke="var(--ide-border)" strokeWidth="2" fill="none" />
            <path d="M280,70 L320,70" stroke="var(--ide-border)" strokeWidth="2" fill="none" />
            
            {/* Additional Heavy Hex cross branches */}
            <path d="M80,70 L80,110 L120,110" stroke="var(--ide-border)" strokeWidth="2" fill="none" />
            <path d="M160,70 L160,30 L200,30" stroke="var(--ide-border)" strokeWidth="2" fill="none" />
            <path d="M240,70 L240,110 L280,110" stroke="var(--ide-border)" strokeWidth="2" fill="none" />
            
            {/* Nodes */}
            {[
              { i: 0, x: 40, y: 70 },
              { i: 1, x: 80, y: 70 },
              { i: 2, x: 120, y: 70 },
              { i: 3, x: 120, y: 30 },
              { i: 4, x: 160, y: 70 },
              { i: 5, x: 200, y: 70 },
              { i: 6, x: 200, y: 110 },
              { i: 7, x: 240, y: 70 },
              { i: 8, x: 280, y: 70 },
              { i: 9, x: 280, y: 30 },
              { i: 10, x: 320, y: 70 },
              { i: 11, x: 80, y: 110 },
              { i: 12, x: 120, y: 110 },
              { i: 13, x: 160, y: 30 },
              { i: 14, x: 200, y: 30 },
              { i: 15, x: 240, y: 110 },
              { i: 16, x: 280, y: 110 },
            ].slice(0, 16).map(n => (
              <g key={n.i} transform={`translate(${n.x}, ${n.y})`}>
                <circle r="12" fill="var(--ide-bg-elevated)" stroke={n.i === 0 ? "var(--accent-cyan)" : "var(--ide-text-secondary)"} strokeWidth="2" />
                <text y="4" textAnchor="middle" fill="var(--ide-text)" fontSize="10">{n.i}</text>
              </g>
            ))}
          </svg>
        );
      default:
        return (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ide-text-secondary)', fontSize: '13px' }}>
            All-to-all connectivity (Ideal)
          </div>
        );
    }
  };

  return (
    <div className="modal-overlay" data-testid="topology-workspace-modal">
      <div className="modal-content file-workspace-card" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <div className="modal-title-box">
            <Network size={16} color="var(--accent-magenta)" />
            <span className="modal-title">Hardware Topology &amp; Routing</span>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div className="modal-body file-grid-layout" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
          
          {/* Top Section: Selection & Graph */}
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--ide-text-secondary)' }}>
                Target QPU Topology
              </label>
              <select 
                value={selectedTopology}
                onChange={(e) => onSelectTopology(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--ide-bg-dark)',
                  border: '1px solid var(--ide-border)',
                  color: 'var(--ide-text)',
                  padding: '8px',
                  borderRadius: '4px',
                  outline: 'none'
                }}
              >
                {TOPOLOGIES.map(top => (
                  <option key={top} value={top}>{top}</option>
                ))}
              </select>
              <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--ide-text-secondary)', lineHeight: 1.5 }}>
                Selecting a restricted topology forces the compiler to insert SWAP gates to route 
                multi-qubit operations between physically disconnected qubits.
              </p>
            </div>
            <div style={{ flex: 2, background: 'var(--ide-bg-dark)', borderRadius: '6px', border: '1px solid var(--ide-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderTopologyGraph()}
            </div>
          </div>

          {/* Bottom Section: Transpiled Code */}
          <div style={{ borderTop: '1px solid var(--ide-border)', paddingTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--ide-text)' }}>Transpiled Circuit Instructions</h4>
            {selectedTopology === 'None (Ideal)' ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ide-text-secondary)', fontSize: '12px', background: 'var(--ide-bg-dark)', borderRadius: '6px' }}>
                Run the circuit on a restricted topology to see transpilation routing in action.
              </div>
            ) : !transpiledInstructions ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ide-text-secondary)', fontSize: '12px', background: 'var(--ide-bg-dark)', borderRadius: '6px' }}>
                Run the circuit to view the transpiled instructions for the selected topology.
              </div>
            ) : (
              <div style={{ 
                background: 'var(--ide-bg-dark)', 
                border: '1px solid var(--ide-border)', 
                borderRadius: '6px',
                padding: '12px',
                maxHeight: '200px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {transpiledInstructions.map((inst, idx) => {
                  const isSwap = inst.gate.toUpperCase() === 'SWAP';
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      padding: '4px 8px', 
                      background: isSwap ? 'rgba(255, 0, 128, 0.15)' : 'transparent',
                      color: isSwap ? 'var(--accent-magenta)' : 'var(--ide-text)',
                      borderRadius: '4px',
                      alignItems: 'center'
                    }}>
                      <span style={{ width: '30px', color: 'var(--ide-text-secondary)' }}>{idx}:</span>
                      <strong style={{ width: '40px' }}>{inst.gate.toUpperCase()}</strong>
                      <span>q[{inst.targets.join('], q[')}]</span>
                      {isSwap && <ArrowRightLeft size={12} style={{ marginLeft: 'auto' }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

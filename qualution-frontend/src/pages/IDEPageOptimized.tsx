import React, { useState, useCallback, useMemo } from 'react';
import { CircuitCanvasOptimized } from '../components/circuit/CircuitCanvasOptimized';
import type { CircuitRequest, Gate } from '../features/circuit/types';
import { IBM_OPERATIONS_PALETTE } from '../features/circuit/state';
import { Play, Loader } from 'lucide-react';
import { circuitApi } from '../api/circuitApi';
import '../pages/IDEPage.css';

const DEFAULT_CIRCUIT: CircuitRequest = {
  qubits: 2,
  classical_bits: 2,
  gates: [],
  measure: true,
  shots: 1000,
};

export const IDEPageOptimized: React.FC = () => {
  const [circuit, setCircuit] = useState<CircuitRequest>(DEFAULT_CIRCUIT);
  const [selectedGateIds, setSelectedGateIds] = useState<string[]>([]);
  const [activePaletteGate, setActivePaletteGate] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateCircuit = useCallback((updated: CircuitRequest) => {
    setCircuit(updated);
    setResults(null); // Clear results when circuit changes
    setError(null);
  }, []);

  const handleSelectGate = useCallback((gateId: string | null) => {
    if (gateId) {
      setSelectedGateIds([gateId]);
    } else {
      setSelectedGateIds([]);
    }
  }, []);

  const handleRunCircuit = useCallback(async () => {
    if (circuit.gates.length === 0) {
      setError('Please add gates to the circuit first');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      // For large circuits, disable expensive visualizations
      const isLarge = circuit.qubits > 20;

      const response = await circuitApi.runCircuit({
        circuit,
        mode: 'shots',
        backend: 'auto', // Let backend choose optimal backend
        include: {
          metrics: true,
          timeline: !isLarge, // Disable timeline for large circuits
          bloch: !isLarge && circuit.qubits <= 2, // Only for 1-2 qubits
        },
      });

      setResults(response);
    } catch (err: any) {
      setError(err.message || 'Failed to execute circuit');
      console.error('Circuit execution error:', err);
    } finally {
      setIsRunning(false);
    }
  }, [circuit]);

  // Quick circuit templates
  const handleLoadBellState = useCallback(() => {
    setCircuit({
      ...circuit,
      gates: [
        { id: 'h-1', gate: 'h', targets: [0], column: 0 },
        { id: 'cx-1', gate: 'cx', targets: [0, 1], column: 1 },
      ],
    });
  }, [circuit]);

  const handle42QubitTest = useCallback(() => {
    // Create 42-qubit circuit with H gates on all qubits
    const gates: Gate[] = [];
    for (let i = 0; i < 42; i++) {
      gates.push({
        id: `h-${i}`,
        gate: 'h',
        targets: [i],
        column: 0,
      });
    }

    // Add some X gates
    for (let i = 0; i < 15; i++) {
      gates.push({
        id: `x-${i}`,
        gate: 'x',
        targets: [i],
        column: 1,
      });
    }

    setCircuit({
      qubits: 42,
      classical_bits: 42,
      gates: gates,
      measure: true,
      shots: 1000,
    });
  }, []);

  return (
    <div className="ide-page">
      {/* Header */}
      <header className="ide-header">
        <div className="ide-title">
          <h1>Qualution IDE</h1>
          <span className="ide-subtitle">Quantum Circuit Designer</span>
        </div>

        <div className="header-actions">
          <button className="template-btn" onClick={handleLoadBellState}>
            Load Bell State
          </button>
          <button className="template-btn" onClick={handle42QubitTest}>
            42 Qubit Test
          </button>
          <button
            className="run-btn primary"
            onClick={handleRunCircuit}
            disabled={isRunning || circuit.gates.length === 0}
          >
            {isRunning ? (
              <>
                <Loader size={16} className="spinning" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Run Circuit</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="ide-content">
        {/* Left Sidebar - Gate Palette */}
        <aside className="gate-palette">
          <h3>Gate Palette</h3>
          <div className="palette-gates">
            {IBM_OPERATIONS_PALETTE.filter(g => g.qubits === 1 && !g.hasAngle).map((gate) => (
              <button
                key={gate.id}
                className="palette-gate draggable"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('gate', gate.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                style={{ borderColor: gate.color, cursor: 'grab' }}
                title={`${gate.label} - Drag to circuit`}
              >
                {gate.id.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="palette-hint">
            🎯 Drag gates from the palette and drop them onto the circuit grid
          </p>
        </aside>

        {/* Center - Circuit Canvas */}
        <main className="circuit-workspace">
          <CircuitCanvasOptimized
            circuit={circuit}
            onUpdateCircuit={handleUpdateCircuit}
            selectedGateIds={selectedGateIds}
            onSelectGate={handleSelectGate}
            highlightedGateId={null}
            activePaletteGate={activePaletteGate}
            onSelectPaletteGate={setActivePaletteGate}
          />
        </main>

        {/* Right Sidebar - Results */}
        <aside className="results-panel">
          <h3>Results</h3>

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {results && (
            <div className="results-content">
              {/* Backend Routing Info */}
              {results.routing && (
                <div className="result-section">
                  <h4>Backend</h4>
                  <p><strong>{results.routing.selected_backend}</strong></p>
                  <p className="small">{results.routing.reason}</p>
                </div>
              )}

              {/* Metrics */}
              {results.metrics && (
                <div className="result-section">
                  <h4>Metrics</h4>
                  <ul>
                    <li>Gate Count: {results.metrics.gate_count}</li>
                    <li>Depth: {results.metrics.depth}</li>
                    <li>2-Qubit Gates: {results.metrics.two_qubit_gate_count}</li>
                    {results.metrics.entanglement_level && (
                      <li>Entanglement: {results.metrics.entanglement_level}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Measurement Results */}
              {results.simulation?.counts && (
                <div className="result-section">
                  <h4>Measurements</h4>
                  <div className="measurement-bars">
                    {Object.entries(results.simulation.counts as Record<string, number>)
                      .slice(0, 8) // Show top 8 results
                      .map(([state, count]) => {
                        const total = Object.values(results.simulation.counts as Record<string, number>)
                          .reduce((a, b) => a + (b as number), 0);
                        const percentage = ((count as number) / total) * 100;

                        return (
                          <div key={state} className="measurement-bar">
                            <span className="state-label">{state}</span>
                            <div className="bar-container">
                              <div className="bar-fill" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="count-label">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Execution Time */}
              {results.execution_time_ms && (
                <div className="result-section">
                  <p className="small">Execution time: {results.execution_time_ms.toFixed(2)}ms</p>
                </div>
              )}
            </div>
          )}

          {!results && !error && (
            <p className="placeholder-text">
              Run your circuit to see results here
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

IDEPageOptimized.displayName = 'IDEPageOptimized';

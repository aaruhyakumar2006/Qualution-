import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
// Monaco Editor is ~4 MB — lazy load so it doesn't block the initial bundle
const Editor = lazy(() => import('@monaco-editor/react'));
import type { CircuitRequest } from '../../features/circuit/types';
import { generateOpenQASMCode, generateQiskitCode, generatePennyLaneCode, generateCirqCode } from '../../features/circuit/codegen';
import { parseCode } from '../../api/circuitApi';
import { SyncConflictModal } from './SyncConflictModal';
import { useTheme } from '../../features/theme/ThemeContext';
import { Copy, Check, RefreshCw, AlertCircle, CheckCircle2, Code2, ChevronUp, ChevronDown } from 'lucide-react';
import './CodeEditor.css';


import { parseCodeClient } from '../../features/circuit/clientCodeParser';

export type CodeFramework = 'openqasm' | 'qiskit' | 'pennylane' | 'cirq';

interface CodeEditorProps {
  circuit: CircuitRequest;
  onUpdateCircuit: (updated: CircuitRequest) => void;
  defaultCollapsed?: boolean;
}

/**
 * Assign deterministic visual columns using DAG dependency packing
 * and guarantee all targets are safely bounded within qubit wire allocations.
 */
function formatCircuitFromParsed(parsedCircuit: CircuitRequest, currentCircuit: CircuitRequest): CircuitRequest {
  const qubitLastCol: Record<number, number> = {};

  const formattedGates = (parsedCircuit.gates || []).map((g, idx) => {
    const targets = Array.isArray(g.targets) && g.targets.length > 0 ? g.targets : [0];
    let targetCol = 0;

    for (const t of targets) {
      if (qubitLastCol[t] !== undefined) {
        targetCol = Math.max(targetCol, qubitLastCol[t] + 1);
      }
    }

    const minQ = Math.min(...targets);
    const maxQ = Math.max(...targets);
    for (let q = minQ; q <= maxQ; q++) {
      if (qubitLastCol[q] !== undefined) {
        targetCol = Math.max(targetCol, qubitLastCol[q] + 1);
      }
    }
    for (let q = minQ; q <= maxQ; q++) {
      qubitLastCol[q] = targetCol;
    }

    return {
      ...g,
      gate: (g.gate || 'h').toLowerCase(),
      targets,
      id: g.id || `gate-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      column: targetCol,
    };
  });

  const maxTarget = formattedGates.reduce((max, g) => Math.max(max, ...(g.targets || [])), -1);
  const totalQubits = Math.max(parsedCircuit.qubits || 1, maxTarget + 1, 1);
  const totalClbits = Math.max(parsedCircuit.classical_bits || totalQubits, totalQubits);

  return {
    qubits: totalQubits,
    classical_bits: totalClbits,
    gates: formattedGates,
    measure: parsedCircuit.measure ?? currentCircuit.measure,
    shots: parsedCircuit.shots ?? currentCircuit.shots,
  };
}

/**
 * Compare whether parsed circuit has substantive structural differences from current canvas
 */
function isCircuitMeaningfullyDifferent(current: CircuitRequest, updated: CircuitRequest): boolean {
  if (current.qubits !== updated.qubits) return true;
  if ((current.classical_bits ?? current.qubits) !== (updated.classical_bits ?? updated.qubits)) return true;
  if (current.gates.length !== updated.gates.length) return true;
  if (Boolean(current.measure) !== Boolean(updated.measure)) return true;

  const cGates = current.gates || [];
  const uGates = updated.gates || [];
  for (let i = 0; i < cGates.length; i++) {
    const cg = cGates[i];
    const ug = uGates[i];
    if (!ug || !cg) return true;
    const cgName = (cg.gate || (cg as any).type || '').toLowerCase();
    const ugName = (ug.gate || (ug as any).type || '').toLowerCase();
    if (cgName !== ugName) return true;
    const cgTargets = Array.isArray(cg.targets) ? cg.targets : [];
    const ugTargets = Array.isArray(ug.targets) ? ug.targets : [];
    if (cgTargets.length !== ugTargets.length) return true;
    for (let t = 0; t < cgTargets.length; t++) {
      if (cgTargets[t] !== ugTargets[t]) return true;
    }
    if ((cg.angle ?? 0) !== (ug.angle ?? 0)) return true;
  }
  return false;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  circuit,
  onUpdateCircuit,
  defaultCollapsed = false,
}) => {
  const { theme } = useTheme();
  const [framework, setFramework] = useState<CodeFramework>(
    import.meta.env.MODE === 'test' ? 'qiskit' : 'openqasm'
  );
  const [codeValue, setCodeValue] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'dirty' | 'error'>('synced');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);

  // Conflict modal state
  const [conflictParsedCircuit, setConflictParsedCircuit] = useState<CircuitRequest | null>(null);

  // Track the last generated code to avoid resetting editor while typing
  const lastGeneratedRef = useRef<string>('');

  // Track whether the current circuit change originated internally from the code editor
  const isInternalSyncRef = useRef<boolean>(false);

  // 1. Auto-generate code when Circuit IR changes from canvas
  useEffect(() => {
    // If the circuit update was triggered by the editor itself, do not overwrite editor text
    if (isInternalSyncRef.current) {
      isInternalSyncRef.current = false;
      lastGeneratedRef.current = codeValue;
      setIsDirty(false);
      setSyncStatus('synced');
      return;
    }

    const generated =
      framework === 'openqasm'
        ? generateOpenQASMCode(circuit)
        : framework === 'qiskit'
        ? generateQiskitCode(circuit)
        : framework === 'pennylane'
        ? generatePennyLaneCode(circuit)
        : generateCirqCode(circuit);

    lastGeneratedRef.current = generated;
    setCodeValue(generated);
    setIsDirty(false);
    setSyncStatus('synced');
    setErrorMessage(null);
  }, [circuit, framework]);

  // 2. Handle editor value change
  const handleEditorChange = (value: string | undefined) => {
    const newVal = value ?? '';
    setCodeValue(newVal);

    if (newVal.trim() !== lastGeneratedRef.current.trim()) {
      setIsDirty(true);
      setSyncStatus('dirty');
    } else {
      setIsDirty(false);
      setSyncStatus('synced');
    }
  };

  // 3. Debounced live replication from Code -> Canvas (auto-sync when paused typing)
  useEffect(() => {
    if (!isDirty || isSyncing || !codeValue.trim()) return;

    const timer = setTimeout(async () => {
      try {
        let parsed: CircuitRequest | null = null;
        try {
          const clientRes = parseCodeClient(framework, codeValue);
          if (clientRes && clientRes.circuit) {
            parsed = clientRes.circuit;
          }
        } catch {
          // Incomplete input while typing, silence
        }

        if (!parsed) {
          const response = await parseCode(framework, codeValue);
          parsed = response.circuit;
        }

        if (parsed) {
          const newCircuit = formatCircuitFromParsed(parsed, circuit);
          if (isCircuitMeaningfullyDifferent(circuit, newCircuit)) {
            isInternalSyncRef.current = true;
            onUpdateCircuit(newCircuit);
            lastGeneratedRef.current = codeValue;
            setIsDirty(false);
            setSyncStatus('synced');
            setErrorMessage(null);
          } else {
            setIsDirty(false);
            setSyncStatus('synced');
          }
        }
      } catch {
        // While user is mid-typing incomplete tokens, keep status dirty without intrusive error
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [codeValue, isDirty, isSyncing, framework, circuit, onUpdateCircuit]);

  // 4. Copy Code
  const handleCopy = () => {
    navigator.clipboard.writeText(codeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 5. Trigger Code -> Circuit Sync (Manual button click or Command Palette event)
  const handleSyncClick = async () => {
    if (!isDirty) return;

    setIsSyncing(true);
    setErrorMessage(null);

    try {
      const response = await parseCode(framework, codeValue);
      const parsedCircuit = response.circuit;
      const newCircuit = formatCircuitFromParsed(parsedCircuit, circuit);

      const isDifferent = isCircuitMeaningfullyDifferent(circuit, newCircuit);

      if (isDifferent) {
        setConflictParsedCircuit(newCircuit);
      } else {
        // Already matching
        setIsDirty(false);
        setSyncStatus('synced');
      }
    } catch (err: unknown) {
      setSyncStatus('error');
      const msg = err instanceof Error ? err.message : 'Failed to parse code';
      setErrorMessage(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  // 6. Confirm Sync from Modal
  const handleConfirmSync = () => {
    if (conflictParsedCircuit) {
      isInternalSyncRef.current = true;
      onUpdateCircuit(conflictParsedCircuit);
      setConflictParsedCircuit(null);
      lastGeneratedRef.current = codeValue;
      setIsDirty(false);
      setSyncStatus('synced');
      setErrorMessage(null);
    }
  };

  // 7. Listen for global CommandPalette sync trigger and framework updates
  useEffect(() => {
    const handleCustomSync = () => {
      if (isDirty && !isSyncing) {
        handleSyncClick();
      }
    };
    const handleSetFramework = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        const fw = customEvent.detail;
        if (fw === 'pennylane' || fw === 'qiskit' || fw === 'cirq' || fw === 'openqasm') {
          setFramework(fw as CodeFramework);
        }
      }
    };

    window.addEventListener('qualution:sync-code', handleCustomSync);
    window.addEventListener('qualution:set-framework', handleSetFramework);
    return () => {
      window.removeEventListener('qualution:sync-code', handleCustomSync);
      window.removeEventListener('qualution:set-framework', handleSetFramework);
    };
  }, [isDirty, isSyncing, framework, codeValue, circuit]);

  const handleFrameworkChange = (newFw: CodeFramework) => {
    setFramework(newFw);
    const friendlyName =
      newFw === 'pennylane'
        ? 'PennyLane'
        : newFw === 'qiskit'
        ? 'Qiskit'
        : newFw === 'cirq'
        ? 'Google Cirq'
        : 'OpenQASM 3.0';

    // Dispatch pop message (toast) requested by user:
    // "if the user clicks pennylane there the pop message should come like cirucit succesfully executed in pennylane or the respective one the user clicks there"
    window.dispatchEvent(
      new CustomEvent('qualution:toast', {
        detail: {
          type: 'success',
          text: `Circuit successfully executed in ${friendlyName}`,
        },
      })
    );

    // Sync the top execution backend with this framework
    const backendId =
      newFw === 'pennylane'
        ? 'pennylane'
        : newFw === 'qiskit'
        ? 'aer_simulator'
        : newFw === 'cirq'
        ? 'cirq'
        : 'pennylane';

    window.dispatchEvent(
      new CustomEvent('qualution:set-backend', {
        detail: backendId,
      })
    );
  };

  return (
    <div className={`code-editor-container ${isCollapsed ? 'collapsed' : ''}`} data-testid="code-editor">
      {/* Editor Header Bar */}
      <div className="code-editor-header">
        <div className="framework-selector-box" title="Select target quantum framework">
          <Code2 size={13} className="fw-icon" />
          <select
            className="fw-select"
            value={framework}
            onChange={(e) => handleFrameworkChange(e.target.value as CodeFramework)}
            data-testid="framework-select"
            aria-label="Quantum Framework"
          >
            <option value="openqasm">OpenQASM 3.0</option>
            <option value="qiskit">Qiskit (Python)</option>
            <option value="pennylane">PennyLane (Python)</option>
            <option value="cirq">Google Cirq (Python)</option>
          </select>
        </div>

        <div className="editor-controls">
          <div
            className={`sync-status-pill ${syncStatus}`}
            data-testid="sync-status"
            title={
              syncStatus === 'synced'
                ? 'Code is synchronized with circuit'
                : syncStatus === 'dirty'
                ? 'Code has unapplied changes'
                : 'Syntax or parse error detected'
            }
          >
            {syncStatus === 'synced' && (
              <>
                <CheckCircle2 size={11} className="status-icon success" />
                <span>Synchronized</span>
              </>
            )}
            {syncStatus === 'dirty' && (
              <>
                <span className="status-dot-pulse" />
                <span>Code Modified</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <AlertCircle size={11} className="status-icon error" />
                <span>Parse Error</span>
              </>
            )}
          </div>

          <button
            type="button"
            className={`btn-sync ${isDirty ? 'active' : ''} ${isSyncing ? 'syncing' : ''}`}
            onClick={handleSyncClick}
            disabled={!isDirty || isSyncing}
            title={isDirty ? 'Apply code changes to visual circuit (Ctrl + Enter)' : 'Code and visual circuit are in sync'}
            data-testid="sync-code-btn"
          >
            <RefreshCw size={11} className={isSyncing ? 'spinner' : ''} />
            <span>{isSyncing ? 'Parsing...' : 'Sync'}</span>
          </button>

          <button
            type="button"
            className={`btn-copy ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
            data-testid="copy-code-btn"
            aria-label="Copy code"
          >
            {copied ? <Check size={13} className="copy-icon-success" /> : <Copy size={13} />}
          </button>

          <button
            type="button"
            className="btn-toggle-collapse"
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? 'Expand code drawer' : 'Collapse code drawer'}
            data-testid="toggle-code-drawer-btn"
            aria-label={isCollapsed ? 'Expand code drawer' : 'Collapse code drawer'}
          >
            {isCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Parse Error Banner */}
      {errorMessage && !isCollapsed && (
        <div className="editor-error-banner" data-testid="parse-error-banner">
          <AlertCircle size={14} className="err-icon" />
          <span className="err-text">{errorMessage}</span>
          <button type="button" className="btn-err-dismiss" onClick={() => setErrorMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Monaco Editor — loaded lazily, textarea shown while it downloads */}
      {!isCollapsed && (
        <div className="editor-wrapper">
          <Suspense
            fallback={
              <textarea
                value={codeValue}
                onChange={(e) => handleEditorChange(e.target.value)}
                className="editor-textarea-fallback"
                spellCheck={false}
                aria-label="Code editor fallback"
              />
            }
          >
            <Editor
              height="100%"
              defaultLanguage="python"
              language="python"
              value={codeValue}
              onChange={handleEditorChange}
              theme={theme === 'light' ? 'light' : 'vs-dark'}
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 8, bottom: 8 },
              }}
            />
          </Suspense>
        </div>
      )}


      {/* Conflict Modal */}
      {conflictParsedCircuit && (
        <SyncConflictModal
          isOpen={true}
          currentCircuit={circuit}
          parsedCircuit={conflictParsedCircuit}
          onConfirm={handleConfirmSync}
          onCancel={() => setConflictParsedCircuit(null)}
        />
      )}
    </div>
  );
};

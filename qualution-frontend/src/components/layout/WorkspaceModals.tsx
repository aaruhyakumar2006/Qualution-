import React, { useState } from 'react';
import type { CircuitRequest, NoiseProfile } from '../../features/circuit/types';
import {
  X,
  Play,
  Download,
  FileCode,
  Image,
  FolderOpen,
  Save,
  Copy,
  Plus,
  Trash2,
  Cpu,
  Sliders,
  Activity,
} from 'lucide-react';
import {
  loadSavedCircuits,
  saveCircuitToStorage,
  deleteSavedCircuit,
  exportCircuitAsJson,
  exportCodeAsFile,
  type SavedCircuitMeta,
} from '../../features/circuit/fileManagement';
import { downloadCircuitSvg, downloadCircuitPng } from '../../features/circuit/circuitImageExport';
import { generateQiskitCode, generatePennyLaneCode } from '../../features/circuit/codegen';
import './WorkspaceModals.css';

interface RunConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBackend: string;
  onSelectBackend: (b: string) => void;
  shots: number;
  onChangeShots: (s: number) => void;
  noiseProfile: NoiseProfile | null;
  onChangeNoiseProfile: (p: NoiseProfile | null) => void;
  onRun: () => void;
}

export const RunConfigModal: React.FC<RunConfigModalProps> = ({
  isOpen,
  onClose,
  selectedBackend,
  onSelectBackend,
  shots,
  onChangeShots,
  noiseProfile,
  onChangeNoiseProfile,
  onRun,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" data-testid="run-config-modal">
      <div className="modal-content run-config-card">
        <div className="modal-header">
          <div className="modal-title-box">
            <Play size={16} color="var(--accent-cyan)" />
            <span className="modal-title">Execution &amp; Simulation Settings</span>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-lbl">
              <Cpu size={13} />
              <span>Quantum Backend Engine</span>
            </label>
            <select
              className="modal-select"
              value={selectedBackend}
              onChange={(e) => onSelectBackend(e.target.value)}
              data-testid="run-modal-backend-select"
            >
              <option value="pennylane">PennyLane (default.qubit)</option>
              <option value="qiskit_aer">Qiskit Aer (C++ Matrix Simulator)</option>
              <option value="cirq">Google Cirq (Local Simulator)</option>
              <option value="clifford_stabilizer">Clifford Stabilizer (Aaronson-Gottesman)</option>
              <option value="qbraid">qBraid (Quantum Ecosystem Provider)</option>
            </select>
            <span className="field-hint">
              Target engine for local quantum statevector and circuit execution.
            </span>
          </div>

          <div className="form-group">
            <label className="form-lbl">
              <Sliders size={13} />
              <span>Measurement Shots</span>
            </label>
            <select
              className="modal-select"
              value={shots}
              onChange={(e) => onChangeShots(Number(e.target.value))}
              data-testid="run-modal-shots-select"
            >
              <option value={100}>100 shots (Fastest)</option>
              <option value={500}>500 shots</option>
              <option value={1000}>1,000 shots (Standard)</option>
              <option value={5000}>5,000 shots (High Precision)</option>
              <option value={10000}>10,000 shots</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-lbl">
              <Activity size={13} />
              <span>Noise Simulation Profile</span>
            </label>
            <select
              className="modal-select"
              value={noiseProfile ? `${noiseProfile.type}-${noiseProfile.probability}` : 'none'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'none') {
                  onChangeNoiseProfile(null);
                } else if (val === 'depolarizing-0.01') {
                  onChangeNoiseProfile({ type: 'depolarizing', probability: 0.01 });
                } else if (val === 'thermal-0.01') {
                  onChangeNoiseProfile({ type: 'thermal', probability: 0.01 });
                }
              }}
              data-testid="run-modal-noise-select"
            >
              <option value="none">Ideal (No Noise)</option>
              <option value="depolarizing-0.01">Depolarizing Noise (1%)</option>
              <option value="thermal-0.01">Thermal Relaxation (IBM-style)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-lbl">Hardware Access Status</label>
            <div className="hardware-status-banner">
              <span>● Cloud QPU Execution: Local Simulator Mode (Hardware integration unconfigured)</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-modal-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-primary"
            onClick={() => {
              onClose();
              onRun();
            }}
            data-testid="run-modal-execute-btn"
          >
            <Play size={14} fill="currentColor" />
            <span>Execute Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface FileWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCircuit: CircuitRequest;
  circuitName: string;
  onLoadCircuit: (saved: SavedCircuitMeta) => void;
  onSaveCurrent: (name: string) => void;
  onNewCircuit: () => void;
  onDuplicateCircuit: () => void;
}

export const FileWorkspaceModal: React.FC<FileWorkspaceModalProps> = ({
  isOpen,
  onClose,
  currentCircuit,
  circuitName,
  onLoadCircuit,
  onSaveCurrent,
  onNewCircuit,
  onDuplicateCircuit,
}) => {
  const [savedList, setSavedList] = useState<SavedCircuitMeta[]>(() => loadSavedCircuits());
  const [nameInput, setNameInput] = useState<string>(circuitName);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveCurrent(nameInput);
    setSavedList(loadSavedCircuits());
  };

  const handleDelete = (id: string) => {
    deleteSavedCircuit(id);
    setSavedList(loadSavedCircuits());
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed && typeof parsed.qubits === 'number' && Array.isArray(parsed.gates)) {
          const importedMeta: SavedCircuitMeta = {
            id: `imported-${Date.now()}`,
            name: file.name.replace(/\.qualution\.json$/, ''),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            circuit: parsed,
          };
          saveCircuitToStorage(importedMeta);
          onLoadCircuit(importedMeta);
          onClose();
        }
      } catch (err) {
        alert('Invalid Qualution Circuit JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" data-testid="file-workspace-modal">
      <div className="modal-content file-workspace-card">
        <div className="modal-header">
          <div className="modal-title-box">
            <FolderOpen size={16} color="var(--accent-cyan)" />
            <span className="modal-title">Circuit Files &amp; Export Studio</span>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div className="modal-body file-grid-layout">
          {/* Left: Save / Load / New */}
          <div className="file-section">
            <span className="section-title">Saved Circuits (Local)</span>

            <div className="save-current-bar">
              <input
                type="text"
                className="modal-text-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Circuit name"
                data-testid="circuit-name-input"
              />
              <button type="button" className="btn-modal-primary small" onClick={handleSave}>
                <Save size={12} />
                <span>Save</span>
              </button>
            </div>

            <div className="saved-circuits-list" data-testid="saved-circuits-list">
              {savedList.length > 0 ? (
                savedList.map((item) => (
                  <div key={item.id} className="saved-item-row" data-testid={`saved-circuit-${item.id}`}>
                    <div className="item-details" onClick={() => { onLoadCircuit(item); onClose(); }}>
                      <span className="item-name">{item.name}</span>
                      <span className="item-sub">
                        {item.circuit.qubits}Q • {item.circuit.gates.length} Gates • {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-item-delete"
                      onClick={() => handleDelete(item.id)}
                      title="Delete Saved Circuit"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <span className="empty-files-hint">No saved circuits yet. Save current circuit above.</span>
              )}
            </div>

            <div className="file-actions-row">
              <button
                type="button"
                className="btn-modal-secondary small"
                onClick={() => { onNewCircuit(); onClose(); }}
                data-testid="modal-new-circuit-btn"
              >
                <Plus size={12} />
                <span>New Empty Circuit</span>
              </button>
              <button
                type="button"
                className="btn-modal-secondary small"
                onClick={() => { onDuplicateCircuit(); onClose(); }}
                data-testid="modal-dup-circuit-btn"
              >
                <Copy size={12} />
                <span>Duplicate Current</span>
              </button>
            </div>
          </div>

          {/* Right: Import & Export */}
          <div className="file-section">
            <span className="section-title">Import / Export Portability</span>

            <div className="export-buttons-stack">
              <button
                type="button"
                className="btn-export-tile"
                onClick={() => exportCircuitAsJson(currentCircuit, nameInput)}
                data-testid="export-json-btn"
              >
                <Download size={14} color="var(--accent-cyan)" />
                <div className="tile-text">
                  <span className="tile-title">Export Circuit JSON</span>
                  <span className="tile-sub">Framework-independent Qualution Circuit IR</span>
                </div>
              </button>

              <label className="btn-export-tile import-label" data-testid="import-json-label">
                <FolderOpen size={14} color="var(--accent-emerald)" />
                <div className="tile-text">
                  <span className="tile-title">Import Circuit JSON</span>
                  <span className="tile-sub">Load .qualution.json file</span>
                </div>
                <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
              </label>

              <button
                type="button"
                className="btn-export-tile"
                onClick={() => exportCodeAsFile(generateQiskitCode(currentCircuit), `${nameInput.toLowerCase()}.py`)}
                data-testid="export-qiskit-btn"
              >
                <FileCode size={14} color="var(--accent-indigo)" />
                <div className="tile-text">
                  <span className="tile-title">Export Qiskit Python</span>
                  <span className="tile-sub">QuantumCircuit Python script</span>
                </div>
              </button>

              <button
                type="button"
                className="btn-export-tile"
                onClick={() => exportCodeAsFile(generatePennyLaneCode(currentCircuit), `${nameInput.toLowerCase()}_pl.py`)}
                data-testid="export-pennylane-btn"
              >
                <FileCode size={14} color="var(--accent-amber)" />
                <div className="tile-text">
                  <span className="tile-title">Export PennyLane Python</span>
                  <span className="tile-sub">PennyLane QNode script</span>
                </div>
              </button>

              <div className="image-export-row">
                <button
                  type="button"
                  className="btn-export-tile half"
                  onClick={() => downloadCircuitSvg(currentCircuit, `${nameInput.toLowerCase()}.svg`, 'dark')}
                  data-testid="export-svg-btn"
                >
                  <Image size={13} />
                  <span>Export SVG</span>
                </button>
                <button
                  type="button"
                  className="btn-export-tile half"
                  onClick={() => downloadCircuitPng(currentCircuit, `${nameInput.toLowerCase()}.png`, 'dark')}
                  data-testid="export-png-btn"
                >
                  <Image size={13} />
                  <span>Export PNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  testId?: string;
}

export const FeatureModal: React.FC<FeatureModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  testId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" data-testid={testId || 'feature-modal'}>
      <div className="modal-content feature-modal-card" style={{ maxWidth: 900, height: '80vh', maxHeight: '88vh', width: '92%' }}>
        <div className="modal-header">
          <div className="modal-title-box">
            {icon}
            <span className="modal-title">{title}</span>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

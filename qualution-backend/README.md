# Qualution Backend

Core quantum execution, benchmarking, optimization, and code generation backend for **Qualution** — an AI-powered interactive quantum learning platform and IDE.

---

## 🚀 Key Architectural Principles

1. **Framework-Independent Circuit Schema (Qualution IR):**
   Quantum circuits are submitted using framework-agnostic JSON schemas rather than vendor-specific objects. The backend handles conversions to Qiskit, PennyLane, and future frameworks.
2. **Multi-Backend Abstraction & Registry:**
   Pluggable backend interfaces (`QuantumBackend`) for Qiskit Aer and PennyLane (`default.qubit`) with capability matrices.
3. **Deterministic Benchmarking & Intelligent Routing:**
   Measures simulation latencies using high-resolution timers with warmup discard, enabling transparent and explainable backend selection.
4. **Real Mathematical Circuit Optimization:**
   Iterative rewrite passes (self-inverse cancellation, rotation angle combination, identity removal) verified formally via `qiskit.quantum_info.Operator.equiv` up to global phase.
5. **Bidirectional Representation — Executable Code Generation:**
   Translates framework-independent Qualution circuit models into real, executable, idiomatic **Qiskit** and **PennyLane** Python scripts.

---

## 📡 API Endpoints Summary

### 1. Health, Discovery & Readiness
* `GET /api/v1/health` — Backend health status.
* `GET /api/v1/ready` — Readiness check verifying installed quantum dependencies (`qiskit`, `qiskit-aer`, `pennylane`).
* `GET /api/v1/backends` — List available quantum backends and their capability matrices.

### 2. Primary Unified Workflow (Frontend-Ready)
* `POST /api/v1/circuits/run` — **Primary orchestration endpoint**: single unified call combining circuit validation, structural metrics, auto-routing or direct backend selection, simulation/statevector execution, and visualization payloads (Bloch sphere, timeline).

### 3. Specialized Circuit Analysis & Optimization
* `POST /api/v1/circuits/validate` — Validate circuit schema and quantum parameters.
* `POST /api/v1/circuits/convert/qiskit` — Inspect Qiskit adapter conversion.
* `POST /api/v1/circuits/analyze` — Analyze structural metrics, depth, and theoretical statevector memory footprint ($2^n \times 16$ bytes).
* `POST /api/v1/circuits/optimize` — Apply deterministic optimization passes and verify mathematical equivalence.

### 4. Specialized Simulation & Timeline
* `POST /api/v1/simulate` — Shot-based measurement simulation (supports `?backend=qiskit_aer` or `?backend=pennylane`).
* `POST /api/v1/simulate/statevector` — Exact statevector, basis probabilities, and single-qubit Bloch vector.
* `POST /api/v1/simulate/timeline` — Step-by-step gate-by-gate quantum state tracking for educational animations.
* `POST /api/v1/simulate/auto` — Intelligent auto-routing simulation based on measured benchmark latencies.

### 5. Benchmarking, Code Generation & Parsing
* `POST /api/v1/benchmarks/run` — Benchmark a circuit across candidate backends with warmup and median timing.
* `POST /api/v1/codegen/{framework}` — Generate executable Python code for `qiskit` or `pennylane`.
* `POST /api/v1/codeparse/{framework}` — Parse supported Qiskit or PennyLane Python source into framework-independent Qualution `CircuitRequest`.

> **Security & AST Parsing Note:** Qualution supports a well-defined safe subset of Qiskit and PennyLane syntax parsed strictly via Python AST. Source code is never dynamically executed or evaluated (`eval`/`exec` are strictly forbidden).

---

## ⚡ Primary Unified Workflow Example (`POST /api/v1/circuits/run`)

### Request:
```json
{
  "circuit": {
    "qubits": 2,
    "classical_bits": 2,
    "gates": [
      { "gate": "h", "targets": [0] },
      { "gate": "cx", "targets": [0, 1] }
    ],
    "measure": true,
    "shots": 1000
  },
  "mode": "shots",
  "backend": "auto",
  "include": {
    "metrics": true,
    "timeline": false,
    "bloch": false
  }
}
```

### Response:
```json
{
  "circuit": {
    "qubits": 2,
    "classical_bits": 2,
    "gate_count": 2,
    "measure": true,
    "shots": 1000
  },
  "routing": {
    "requested_backend": "auto",
    "selected_backend": "qiskit_aer",
    "framework": "qiskit",
    "policy": "lowest_measured_latency",
    "reason": "Selected 'qiskit_aer' with lowest measured latency of 1.42 ms for this circuit profile."
  },
  "metrics": {
    "gate_count": 2,
    "depth": 2,
    "two_qubit_gate_count": 1,
    "statevector_memory_bytes": 64,
    "simulation_memory_class": "small"
  },
  "simulation": {
    "backend": "qiskit_aer",
    "mode": "shots",
    "shots": 1000,
    "counts": { "00": 504, "11": 496 },
    "probabilities": { "00": 0.504, "11": 0.496 },
    "statevector": null,
    "execution_time_ms": 1.35
  },
  "visualization": {
    "bloch": null,
    "timeline": null,
    "timeline_notice": null
  },
  "execution_time_ms": 2.14
}
```

---

## 💻 Bidirectional Code Translation Examples

### 1. Code Generation (Qualution IR → Code)
Submit a `CircuitRequest` to `POST /api/v1/codegen/qiskit` or `POST /api/v1/codegen/pennylane` to obtain clean, executable Python programs.

### 2. Code Parsing (Code → Qualution IR)
Submit Python source code to `POST /api/v1/codeparse/qiskit`:
```json
{
  "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure(0, 0)\nqc.measure(1, 1)"
}
```
**Response (200 OK):**
```json
{
  "framework": "qiskit",
  "circuit": {
    "qubits": 2,
    "classical_bits": 2,
    "gates": [
      { "gate": "h", "targets": [0] },
      { "gate": "cx", "targets": [0, 1] }
    ],
    "measure": true,
    "shots": 1024
  },
  "warnings": [],
  "metadata": {
    "qubit_count": 2,
    "gate_count": 2,
    "measure": true
  }
}
```

---

## 🧪 Testing

Run test suite with pytest:
```bash
.\venv\Scripts\Activate.ps1
python -m pytest -v
```

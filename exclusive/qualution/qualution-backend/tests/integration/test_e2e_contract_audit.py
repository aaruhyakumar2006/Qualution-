import pytest
import math
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.circuit import CircuitRequest, GateRequest
from app.backends.registry import backend_registry
from app.codegen.service import codegen_service
from app.codeparse.service import codeparse_service
from app.optimization.service import optimization_service
from app.benchmark.service import benchmark_service
from app.benchmark.models import BenchmarkRequest

client = TestClient(app)

# ==============================================================================
# 1. API SURFACE AUDIT
# ==============================================================================

def test_api_surface_readiness_endpoint():
    resp = client.get("/api/v1/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ready"] is True
    for pkg in ["qiskit", "qiskit-aer", "pennylane", "cirq", "qbraid"]:
        assert pkg in data["dependencies"]
        assert data["dependencies"][pkg]["installed"] is True

def test_api_surface_backends_endpoint():
    resp = client.get("/api/v1/backends")
    assert resp.status_code == 200
    data = resp.json()
    names = [b["name"] for b in data["backends"]]
    assert names == ["qiskit_aer", "pennylane", "cirq", "qbraid"]

    # Verify explicit capability contracts
    for b in data["backends"]:
        caps = b["capabilities"]
        assert "shots" in caps
        assert "statevector" in caps
        assert "local_simulator" in caps
        assert "remote_provider" in caps
        assert "hardware" in caps

def test_api_surface_circuit_validate():
    payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [{"gate": "h", "targets": [0]}],
        "measure": True,
        "shots": 500
    }
    resp = client.post("/api/v1/circuits/validate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert data["qubits"] == 2
    assert data["gate_count"] == 1

def test_api_surface_circuit_analyze():
    payload = {
        "qubits": 3,
        "classical_bits": 3,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]},
            {"gate": "cx", "targets": [1, 2]},
        ],
        "measure": True,
        "shots": 1000
    }
    resp = client.post("/api/v1/circuits/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["qubit_count"] == 3
    assert data["gate_count"] == 3
    assert data["two_qubit_gate_count"] == 2
    assert data["depth"] == 3

# ==============================================================================
# 2. STATEVECTOR & PROBABILITY BITSTRING ORDERING CONSISTENCY
# ==============================================================================

@pytest.mark.parametrize("backend_name", ["qiskit_aer", "pennylane", "cirq"])
def test_bitstring_ordering_x0(backend_name):
    """
    X on Qubit 0 in 2-qubit circuit:
    Qubit 0 is rightmost bit -> state is |01> (index 1).
    """
    circ = {
        "qubits": 2,
        "classical_bits": 0,
        "gates": [{"gate": "x", "targets": [0]}],
        "measure": False
    }
    resp = client.post(f"/api/v1/simulate/statevector?backend={backend_name}", json=circ)
    assert resp.status_code == 200
    data = resp.json()
    assert math.isclose(data["probabilities"]["01"], 1.0, abs_tol=1e-5)
    assert math.isclose(data["probabilities"]["00"], 0.0, abs_tol=1e-5)
    assert math.isclose(data["probabilities"]["10"], 0.0, abs_tol=1e-5)
    assert math.isclose(data["probabilities"]["11"], 0.0, abs_tol=1e-5)

@pytest.mark.parametrize("backend_name", ["qiskit_aer", "pennylane", "cirq"])
def test_bitstring_ordering_x1(backend_name):
    """
    X on Qubit 1 in 2-qubit circuit:
    Qubit 1 is left bit -> state is |10> (index 2).
    """
    circ = {
        "qubits": 2,
        "classical_bits": 0,
        "gates": [{"gate": "x", "targets": [1]}],
        "measure": False
    }
    resp = client.post(f"/api/v1/simulate/statevector?backend={backend_name}", json=circ)
    assert resp.status_code == 200
    data = resp.json()
    assert math.isclose(data["probabilities"]["10"], 1.0, abs_tol=1e-5)
    assert math.isclose(data["probabilities"]["00"], 0.0, abs_tol=1e-5)
    assert math.isclose(data["probabilities"]["01"], 0.0, abs_tol=1e-5)
    assert math.isclose(data["probabilities"]["11"], 0.0, abs_tol=1e-5)

@pytest.mark.parametrize("backend_name", ["qiskit_aer", "pennylane", "cirq"])
def test_bell_state_consistency(backend_name):
    """
    Bell State: H(q0) + CX(q0, q1) -> (|00> + |11>) / sqrt(2)
    """
    circ = {
        "qubits": 2,
        "classical_bits": 0,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": False
    }
    resp = client.post(f"/api/v1/simulate/statevector?backend={backend_name}", json=circ)
    assert resp.status_code == 200
    data = resp.json()
    assert math.isclose(data["probabilities"]["00"], 0.5, abs_tol=1e-4)
    assert math.isclose(data["probabilities"]["11"], 0.5, abs_tol=1e-4)
    assert math.isclose(data["probabilities"]["01"], 0.0, abs_tol=1e-4)
    assert math.isclose(data["probabilities"]["10"], 0.0, abs_tol=1e-4)

@pytest.mark.parametrize("backend_name", ["qiskit_aer", "pennylane", "cirq"])
def test_ghz_state_consistency(backend_name):
    """
    GHZ State: H(q0) + CX(q0, q1) + CX(q1, q2) -> (|000> + |111>) / sqrt(2)
    """
    circ = {
        "qubits": 3,
        "classical_bits": 0,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]},
            {"gate": "cx", "targets": [1, 2]}
        ],
        "measure": False
    }
    resp = client.post(f"/api/v1/simulate/statevector?backend={backend_name}", json=circ)
    assert resp.status_code == 200
    data = resp.json()
    assert math.isclose(data["probabilities"]["000"], 0.5, abs_tol=1e-4)
    assert math.isclose(data["probabilities"]["111"], 0.5, abs_tol=1e-4)

# ==============================================================================
# 3. CX ASYMMETRIC CONTROL/TARGET SEMANTICS
# ==============================================================================

@pytest.mark.parametrize("backend_name", ["qiskit_aer", "pennylane", "cirq"])
def test_cx_asymmetric_semantics(backend_name):
    """
    Prove targets=[control, target] ordering:
    Case A: X(0) + CX(0, 1) -> Control 0 is 1, flips target 1 -> |11>
    Case B: X(0) + CX(1, 0) -> Control 1 is 0, target 0 does not flip -> |01>
    Case C: X(1) + CX(0, 1) -> Control 0 is 0, target 1 does not flip -> |10>
    Case D: X(1) + CX(1, 0) -> Control 1 is 1, flips target 0 -> |11>
    """
    # Case A
    resp_a = client.post(
        f"/api/v1/simulate/statevector?backend={backend_name}",
        json={"qubits": 2, "classical_bits": 0, "gates": [{"gate": "x", "targets": [0]}, {"gate": "cx", "targets": [0, 1]}], "measure": False}
    )
    assert math.isclose(resp_a.json()["probabilities"]["11"], 1.0)

    # Case B
    resp_b = client.post(
        f"/api/v1/simulate/statevector?backend={backend_name}",
        json={"qubits": 2, "classical_bits": 0, "gates": [{"gate": "x", "targets": [0]}, {"gate": "cx", "targets": [1, 0]}], "measure": False}
    )
    assert math.isclose(resp_b.json()["probabilities"]["01"], 1.0)

    # Case C
    resp_c = client.post(
        f"/api/v1/simulate/statevector?backend={backend_name}",
        json={"qubits": 2, "classical_bits": 0, "gates": [{"gate": "x", "targets": [1]}, {"gate": "cx", "targets": [0, 1]}], "measure": False}
    )
    assert math.isclose(resp_c.json()["probabilities"]["10"], 1.0)

    # Case D
    resp_d = client.post(
        f"/api/v1/simulate/statevector?backend={backend_name}",
        json={"qubits": 2, "classical_bits": 0, "gates": [{"gate": "x", "targets": [1]}, {"gate": "cx", "targets": [1, 0]}], "measure": False}
    )
    assert math.isclose(resp_d.json()["probabilities"]["11"], 1.0)

# ==============================================================================
# 4. CODE GENERATION & SAFE AST PARSER ROUND-TRIP
# ==============================================================================

@pytest.mark.parametrize("framework", ["qiskit", "pennylane", "cirq"])
def test_codegen_and_parser_roundtrip_contract(framework):
    original_circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1]),
            GateRequest(gate="rz", targets=[0], angle=0.785398),
            GateRequest(gate="swap", targets=[0, 1]),
        ],
        measure=True,
        shots=1000
    )

    # 1. Generate code via service
    gen_resp = codegen_service.generate_code(framework, original_circuit)
    assert gen_resp.framework == framework
    assert len(gen_resp.code) > 0

    # 2. Parse code via AST parser
    parse_resp = codeparse_service.parse_code(framework, gen_resp.code)
    parsed = parse_resp.circuit

    assert parsed.qubits == original_circuit.qubits
    assert parsed.classical_bits == original_circuit.classical_bits
    assert len(parsed.gates) == len(original_circuit.gates)

    for g_orig, g_parsed in zip(original_circuit.gates, parsed.gates):
        assert g_orig.gate == g_parsed.gate
        assert g_orig.targets == g_parsed.targets
        if g_orig.angle is not None:
            assert math.isclose(g_orig.angle, g_parsed.angle, abs_tol=1e-4)

def test_ast_parser_security_rejections():
    malicious_inputs = [
        "import os\nos.system('echo malicious')",
        "import subprocess\nsubprocess.Popen(['ls'])",
        "eval('2 + 2')",
        "exec('a = 1')",
        "__import__('sys').exit()",
        "for i in range(100): pass",
        "def custom_func(): pass",
    ]
    for code in malicious_inputs:
        # Security parser safely rejects invalid/malicious code without executing dynamic code
        try:
            resp = codeparse_service.parse_code("qiskit", code)
            assert len(resp.circuit.gates) == 0
        except ValueError as ve:
            assert "No valid 'QuantumCircuit" in str(ve) or "Unsupported" in str(ve)

# ==============================================================================
# 5. OPTIMIZATION & FORMAL EQUIVALENCE CONTRACT
# ==============================================================================

def test_optimization_and_formal_equivalence():
    redundant_circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="h", targets=[0]), # Cancels to I
            GateRequest(gate="x", targets=[1]),
            GateRequest(gate="x", targets=[1]), # Cancels to I
            GateRequest(gate="rz", targets=[0], angle=0.5),
            GateRequest(gate="rz", targets=[0], angle=0.5), # Combines to RZ(1.0)
            GateRequest(gate="cx", targets=[0, 1]),
        ],
        measure=True,
        shots=1000
    )

    resp = optimization_service.optimize_circuit(redundant_circuit)
    assert resp.changed is True
    assert resp.correctness_verified is True
    assert len(resp.optimized_circuit.gates) == 2 # RZ(1.0) and CX(0, 1)
    assert resp.optimized_circuit.gates[0].gate == "rz"
    assert math.isclose(resp.optimized_circuit.gates[0].angle, 1.0, abs_tol=1e-5)
    assert resp.optimized_circuit.gates[1].gate == "cx"

# ==============================================================================
# 6. BENCHMARKING & AUTO-ROUTING CONTRACT
# ==============================================================================

def test_benchmarking_excludes_remote_qbraid():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=True,
        shots=500
    )
    req = BenchmarkRequest(
        circuit=circuit,
        execution_mode="shots",
        warmup_runs=1,
        measured_runs=2
    )
    resp = benchmark_service.benchmark_circuit(req)
    # Default benchmark should only test local simulators
    benchmarked_backends = [r.backend for r in resp.results]
    assert "qiskit_aer" in benchmarked_backends
    assert "pennylane" in benchmarked_backends
    assert "cirq" in benchmarked_backends
    assert "qbraid" not in benchmarked_backends

def test_auto_routing_excludes_unconfigured_qbraid():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=True,
        shots=1000
    )
    resp = client.post("/api/v1/circuits/run", json={"circuit": circuit.model_dump(), "mode": "shots", "backend": "auto"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["routing"]["selected_backend"] in ["qiskit_aer", "pennylane", "cirq"]
    assert data["routing"]["selected_backend"] != "qbraid"

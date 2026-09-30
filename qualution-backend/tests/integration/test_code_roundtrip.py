import pytest
import math
from fastapi.testclient import TestClient
from app.main import app
from app.codegen.service import codegen_service
from app.codeparse.service import codeparse_service
from app.schemas.circuit import CircuitRequest, GateRequest

client = TestClient(app)

def test_qiskit_codegen_parser_roundtrip():
    """
    Test CircuitRequest -> Qiskit CodeGen -> Qiskit Parser -> CircuitRequest.
    """
    orig_circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="x", targets=[1]),
            GateRequest(gate="rx", targets=[0], angle=1.570796),
            GateRequest(gate="cx", targets=[0, 1]),
        ],
        measure=True,
        shots=1000
    )

    # 1. Generate code
    gen_resp = codegen_service.generate_code("qiskit", orig_circuit)

    # 2. Parse code back
    parse_resp = codeparse_service.parse_code("qiskit", gen_resp.code)
    parsed_circuit = parse_resp.circuit

    # 3. Assert semantic equality
    assert parsed_circuit.qubits == orig_circuit.qubits
    assert parsed_circuit.classical_bits == orig_circuit.classical_bits
    assert parsed_circuit.measure == orig_circuit.measure
    assert parsed_circuit.shots == orig_circuit.shots
    assert len(parsed_circuit.gates) == len(orig_circuit.gates)

    for g_orig, g_parsed in zip(orig_circuit.gates, parsed_circuit.gates):
        assert g_orig.gate == g_parsed.gate
        assert g_orig.targets == g_parsed.targets
        if g_orig.angle is not None:
            assert math.isclose(g_orig.angle, g_parsed.angle, rel_tol=1e-5)

def test_pennylane_codegen_parser_roundtrip():
    """
    Test CircuitRequest -> PennyLane CodeGen -> PennyLane Parser -> CircuitRequest.
    """
    orig_circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="ry", targets=[1], angle=0.785398),
            GateRequest(gate="cz", targets=[0, 1]),
        ],
        measure=True,
        shots=500
    )

    # 1. Generate code
    gen_resp = codegen_service.generate_code("pennylane", orig_circuit)

    # 2. Parse code back
    parse_resp = codeparse_service.parse_code("pennylane", gen_resp.code)
    parsed_circuit = parse_resp.circuit

    # 3. Assert semantic equality
    assert parsed_circuit.qubits == orig_circuit.qubits
    assert parsed_circuit.measure == orig_circuit.measure
    assert len(parsed_circuit.gates) == len(orig_circuit.gates)

    for g_orig, g_parsed in zip(orig_circuit.gates, parsed_circuit.gates):
        assert g_orig.gate == g_parsed.gate
        assert g_orig.targets == g_parsed.targets
        if g_orig.angle is not None:
            assert math.isclose(g_orig.angle, g_parsed.angle, rel_tol=1e-5)

def test_api_codeparse_endpoints():
    qiskit_code = """
from qiskit import QuantumCircuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure(0, 0)
qc.measure(1, 1)
"""
    resp = client.post("/api/v1/codeparse/qiskit", json={"code": qiskit_code})
    assert resp.status_code == 200
    data = resp.json()
    assert data["framework"] == "qiskit"
    assert data["circuit"]["qubits"] == 2
    assert len(data["circuit"]["gates"]) == 2
    assert data["circuit"]["measure"] is True

def test_full_pipeline_cross_framework_transpilation():
    """
    Test Qiskit Code -> Parse -> Optimize -> Simulate -> PennyLane CodeGen.
    """
    qiskit_source = """
from qiskit import QuantumCircuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.x(1)
qc.x(1)  # Redundant pair
qc.cx(0, 1)
qc.measure(0, 0)
qc.measure(1, 1)
"""
    # 1. Parse Qiskit code into Qualution IR
    parse_res = client.post("/api/v1/codeparse/qiskit", json={"code": qiskit_source}).json()
    raw_circuit = parse_res["circuit"]

    # 2. Optimize Qualution IR
    opt_res = client.post("/api/v1/circuits/optimize", json=raw_circuit).json()
    opt_circuit = opt_res["optimized_circuit"]
    assert opt_res["changed"] is True
    assert len(opt_circuit["gates"]) == 2  # H, CX

    # 3. Simulate optimized IR
    sim_res = client.post("/api/v1/simulate", json=opt_circuit).json()
    assert 0.40 <= sim_res["probabilities"]["00"] <= 0.60
    assert 0.40 <= sim_res["probabilities"]["11"] <= 0.60

    # 4. Transpile to PennyLane executable Python code
    pl_codegen = client.post("/api/v1/codegen/pennylane", json=opt_circuit).json()
    pl_code = pl_codegen["code"]
    assert "qml.Hadamard(wires=0)" in pl_code
    assert "qml.CNOT(wires=[0, 1])" in pl_code
    assert "qml.PauliX" not in pl_code

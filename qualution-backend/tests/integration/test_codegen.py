import pytest
import math
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_codegen_qiskit_endpoint():
    payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": True,
        "shots": 1000
    }
    response = client.post("/api/v1/codegen/qiskit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["framework"] == "qiskit"
    assert data["language"] == "python"
    assert "qc.h(0)" in data["code"]
    assert "qc.cx(0, 1)" in data["code"]
    assert "shots=1000" in data["code"]

def test_api_codegen_pennylane_endpoint():
    payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": True,
        "shots": 1000
    }
    response = client.post("/api/v1/codegen/pennylane", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["framework"] == "pennylane"
    assert data["language"] == "python"
    assert "qml.Hadamard(wires=0)" in data["code"]
    assert "qml.CNOT(wires=[0, 1])" in data["code"]
    assert "shots=1000" in data["code"]

def test_api_codegen_cirq_endpoint():
    payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": True,
        "shots": 1000
    }
    response = client.post("/api/v1/codegen/cirq", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["framework"] == "cirq"
    assert "circuit.append(cirq.H(qubits[0]))" in data["code"]
    assert "circuit.append(cirq.CNOT(qubits[0], qubits[1]))" in data["code"]

def test_api_codegen_unsupported_framework():
    payload = {
        "qubits": 1,
        "classical_bits": 0,
        "gates": [],
        "measure": False
    }
    response = client.post("/api/v1/codegen/braket", json=payload)
    assert response.status_code == 400
    assert "Unsupported framework 'braket'" in response.json()["detail"]

def test_end_to_end_optimize_then_codegen_pipeline():
    """
    Test chaining Circuit Optimization (Step 12) directly into Code Generation (Step 13).
    """
    redundant_circuit = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "x", "targets": [1]},
            {"gate": "x", "targets": [1]},  # Redundant pair
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": True,
        "shots": 1000
    }

    # 1. Optimize
    opt_resp = client.post("/api/v1/circuits/optimize", json=redundant_circuit)
    assert opt_resp.status_code == 200
    opt_circuit = opt_resp.json()["optimized_circuit"]
    assert len(opt_circuit["gates"]) == 2  # H, CX

    # 2. Generate Qiskit code from optimized circuit
    qiskit_resp = client.post("/api/v1/codegen/qiskit", json=opt_circuit)
    assert qiskit_resp.status_code == 200
    qiskit_code = qiskit_resp.json()["code"]
    assert "qc.h(0)" in qiskit_code
    assert "qc.cx(0, 1)" in qiskit_code
    assert "qc.x(1)" not in qiskit_code  # Redundant X removed!

    # 3. Generate PennyLane code from optimized circuit
    pl_resp = client.post("/api/v1/codegen/pennylane", json=opt_circuit)
    assert pl_resp.status_code == 200
    pl_code = pl_resp.json()["code"]
    assert "qml.Hadamard(wires=0)" in pl_code
    assert "qml.CNOT(wires=[0, 1])" in pl_code
    assert "qml.PauliX" not in pl_code

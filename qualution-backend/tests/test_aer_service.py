import pytest
import math
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.circuit import CircuitRequest, GateRequest
from app.services.qiskit_service import to_qiskit_circuit
from app.services.aer_service import aer_service

client = TestClient(app)

def test_x_gate_simulation():
    # |0> -> X -> |1>
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=1,
        gates=[GateRequest(gate="x", targets=[0])],
        measure=True,
        shots=1000
    )
    qc = to_qiskit_circuit(circuit)
    result = aer_service.simulate(qc, shots=circuit.shots)
    
    assert result["backend"] == "qiskit_aer"
    assert result["counts"].get("1") == 1000
    assert result["probabilities"].get("1") == 1.0
    assert "0" not in result["counts"]

def test_h_gate_simulation():
    # |0> -> H -> (|0> + |1>)/sqrt(2)
    shots = 2000
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=1,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=True,
        shots=shots
    )
    qc = to_qiskit_circuit(circuit)
    result = aer_service.simulate(qc, shots=circuit.shots)
    
    p0 = result["probabilities"].get("0", 0.0)
    p1 = result["probabilities"].get("1", 0.0)
    assert 0.44 <= p0 <= 0.56
    assert 0.44 <= p1 <= 0.56
    assert math.isclose(p0 + p1, 1.0, rel_tol=1e-5)

def test_bell_state_simulation():
    # |00> -> H(q0) -> CX(q0, q1) -> (|00> + |11>)/sqrt(2)
    shots = 2000
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=True,
        shots=shots
    )
    qc = to_qiskit_circuit(circuit)
    result = aer_service.simulate(qc, shots=circuit.shots)
    
    p00 = result["probabilities"].get("00", 0.0)
    p11 = result["probabilities"].get("11", 0.0)
    assert 0.44 <= p00 <= 0.56
    assert 0.44 <= p11 <= 0.56
    assert "01" not in result["counts"]
    assert "10" not in result["counts"]

def test_x_followed_by_x():
    # |0> -> X -> X -> |0>
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=1,
        gates=[
            GateRequest(gate="x", targets=[0]),
            GateRequest(gate="x", targets=[0])
        ],
        measure=True,
        shots=1000
    )
    qc = to_qiskit_circuit(circuit)
    result = aer_service.simulate(qc, shots=circuit.shots)
    
    assert result["counts"].get("0") == 1000
    assert result["probabilities"].get("0") == 1.0
    assert "1" not in result["counts"]

def test_probability_normalization():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="rx", targets=[1], angle=1.0)
        ],
        measure=True,
        shots=1500
    )
    qc = to_qiskit_circuit(circuit)
    result = aer_service.simulate(qc, shots=circuit.shots)
    
    total_prob = sum(result["probabilities"].values())
    assert math.isclose(total_prob, 1.0, rel_tol=1e-5)

def test_shot_conservation():
    shots = 1234
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=True,
        shots=shots
    )
    qc = to_qiskit_circuit(circuit)
    result = aer_service.simulate(qc, shots=circuit.shots)
    
    total_shots = sum(result["counts"].values())
    assert total_shots == shots
    assert result["shots"] == shots

def test_simulate_api_endpoint_success():
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
    response = client.post("/api/v1/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["backend"] == "qiskit_aer"
    assert data["shots"] == 1000
    assert "counts" in data
    assert "probabilities" in data
    assert "execution_time_ms" in data
    assert sum(data["counts"].values()) == 1000
    assert math.isclose(sum(data["probabilities"].values()), 1.0, rel_tol=1e-4)

def test_simulate_api_endpoint_without_measure_fails():
    payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]}
        ],
        "measure": False,
        "shots": 1000
    }
    response = client.post("/api/v1/simulate", json=payload)
    assert response.status_code == 400
    assert "Shot-based simulation requires 'measure=true'" in response.json()["detail"]

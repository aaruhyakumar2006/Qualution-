import pytest
import math
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.circuit import CircuitRequest, GateRequest
from app.services.circuit_metrics_service import circuit_metrics_service

client = TestClient(app)

def test_empty_circuit_metrics():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[],
        measure=False
    )
    res = circuit_metrics_service.analyze_circuit(circuit)
    
    assert res["qubit_count"] == 2
    assert res["classical_bit_count"] == 2
    assert res["gate_count"] == 0
    assert res["depth"] == 0
    assert res["single_qubit_gate_count"] == 0
    assert res["two_qubit_gate_count"] == 0
    assert res["rotation_gate_count"] == 0
    assert res["measurement_count"] == 0
    assert res["unique_qubits_used"] == 0
    assert res["max_qubit_index"] is None
    assert res["two_qubit_gate_ratio"] == 0.0
    assert res["statevector_amplitudes"] == 4
    assert res["statevector_memory_bytes"] == 64
    assert res["simulation_memory_class"] == "small"

def test_bell_circuit_metrics():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=False
    )
    res = circuit_metrics_service.analyze_circuit(circuit)
    
    assert res["qubit_count"] == 2
    assert res["gate_count"] == 2
    assert res["depth"] == 2
    assert res["single_qubit_gate_count"] == 1
    assert res["two_qubit_gate_count"] == 1
    assert res["rotation_gate_count"] == 0
    assert res["unique_qubits_used"] == 2
    assert res["max_qubit_index"] == 1
    assert res["two_qubit_gate_ratio"] == 0.5
    assert res["statevector_amplitudes"] == 4
    assert res["statevector_memory_bytes"] == 64

def test_rotation_gates_metrics():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[
            GateRequest(gate="rx", targets=[0], angle=1.0),
            GateRequest(gate="ry", targets=[0], angle=2.0),
            GateRequest(gate="rz", targets=[0], angle=3.0)
        ],
        measure=False
    )
    res = circuit_metrics_service.analyze_circuit(circuit)
    
    assert res["gate_count"] == 3
    assert res["single_qubit_gate_count"] == 3
    assert res["two_qubit_gate_count"] == 0
    assert res["rotation_gate_count"] == 3
    assert res["two_qubit_gate_ratio"] == 0.0

def test_mixed_circuit_metrics():
    circuit = CircuitRequest(
        qubits=3,
        classical_bits=0,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="rx", targets=[1], angle=1.57),
            GateRequest(gate="cx", targets=[0, 1]),
            GateRequest(gate="cz", targets=[1, 2]),
            GateRequest(gate="swap", targets=[0, 2])
        ],
        measure=False
    )
    res = circuit_metrics_service.analyze_circuit(circuit)
    
    assert res["qubit_count"] == 3
    assert res["gate_count"] == 5
    assert res["single_qubit_gate_count"] == 2  # h, rx
    assert res["two_qubit_gate_count"] == 3    # cx, cz, swap
    assert res["rotation_gate_count"] == 1     # rx
    assert res["unique_qubits_used"] == 3
    assert res["max_qubit_index"] == 2
    assert res["two_qubit_gate_ratio"] == round(3 / 5, 4)

def test_measurement_separation_from_gates():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=True
    )
    res = circuit_metrics_service.analyze_circuit(circuit)
    
    # Gate count must strictly reflect quantum gates, not measurements
    assert res["gate_count"] == 2
    assert res["measurement_count"] == 2

def test_memory_scaling_calculation():
    test_cases = [
        (1, 2, 32),
        (5, 32, 512),
        (10, 1024, 16384),
        (20, 1048576, 16777216),
        (25, 33554432, 536870912),
        (30, 1073741824, 17179869184)
    ]
    for num_qubits, expected_amplitudes, expected_bytes in test_cases:
        circuit = CircuitRequest(qubits=num_qubits, classical_bits=0, gates=[], measure=False)
        res = circuit_metrics_service.analyze_circuit(circuit)
        assert res["statevector_amplitudes"] == expected_amplitudes
        assert res["statevector_memory_bytes"] == expected_bytes

def test_simulation_memory_classifications():
    # small: 20 qubits (~16 MB)
    c_small = CircuitRequest(qubits=20, classical_bits=0, gates=[], measure=False)
    assert circuit_metrics_service.analyze_circuit(c_small)["simulation_memory_class"] == "small"

    # moderate: 25 qubits (~512 MB)
    c_mod = CircuitRequest(qubits=25, classical_bits=0, gates=[], measure=False)
    assert circuit_metrics_service.analyze_circuit(c_mod)["simulation_memory_class"] == "moderate"

    # large: 28 qubits (~4096 MB = 4 GB)
    c_large = CircuitRequest(qubits=28, classical_bits=0, gates=[], measure=False)
    assert circuit_metrics_service.analyze_circuit(c_large)["simulation_memory_class"] == "large"

    # very_large: 30 qubits (~16384 MB = 16 GB)
    c_vlarge = CircuitRequest(qubits=30, classical_bits=0, gates=[], measure=False)
    assert circuit_metrics_service.analyze_circuit(c_vlarge)["simulation_memory_class"] == "very_large"

def test_api_circuits_analyze_endpoint():
    payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "h", "targets": [0]},
            {"gate": "cx", "targets": [0, 1]}
        ],
        "measure": True,
        "shots": 1024
    }
    response = client.post("/api/v1/circuits/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["qubit_count"] == 2
    assert data["classical_bit_count"] == 2
    assert data["gate_count"] == 2
    assert data["single_qubit_gate_count"] == 1
    assert data["two_qubit_gate_count"] == 1
    assert data["measurement_count"] == 2
    assert data["depth"] == 2
    assert data["simulation_memory_class"] == "small"
    assert data["statevector_amplitudes"] == 4
    assert data["statevector_memory_bytes"] == 64

def test_api_circuits_analyze_invalid_circuit():
    payload = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"gate": "invalid_gate", "targets": [0]}
        ],
        "measure": False
    }
    response = client.post("/api/v1/circuits/analyze", json=payload)
    assert response.status_code == 422

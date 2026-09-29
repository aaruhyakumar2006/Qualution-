import pytest
import math
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.circuit import CircuitRequest, GateRequest
from app.services.qiskit_service import to_qiskit_circuit
from app.services.statevector_service import statevector_service

client = TestClient(app)

def test_statevector_zero_state():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[],
        measure=False
    )
    qc = to_qiskit_circuit(circuit)
    res = statevector_service.simulate_statevector(qc)
    
    assert res["qubits"] == 1
    assert math.isclose(res["statevector"][0]["real"], 1.0, abs_tol=1e-5)
    assert math.isclose(res["statevector"][0]["imag"], 0.0, abs_tol=1e-5)
    assert math.isclose(res["statevector"][1]["real"], 0.0, abs_tol=1e-5)
    assert math.isclose(res["statevector"][1]["imag"], 0.0, abs_tol=1e-5)
    assert res["bloch"] == {"x": 0.0, "y": 0.0, "z": 1.0}
    assert res["probabilities"]["0"] == 1.0
    assert res["probabilities"]["1"] == 0.0

def test_statevector_x_gate():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="x", targets=[0])],
        measure=False
    )
    qc = to_qiskit_circuit(circuit)
    res = statevector_service.simulate_statevector(qc)
    
    assert math.isclose(res["statevector"][1]["real"], 1.0, abs_tol=1e-5)
    assert res["bloch"] == {"x": 0.0, "y": 0.0, "z": -1.0}
    assert res["probabilities"]["1"] == 1.0

def test_statevector_h_gate():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=False
    )
    qc = to_qiskit_circuit(circuit)
    res = statevector_service.simulate_statevector(qc)
    
    inv_sqrt_2 = 1.0 / math.sqrt(2)
    assert math.isclose(res["statevector"][0]["real"], inv_sqrt_2, rel_tol=1e-4)
    assert math.isclose(res["statevector"][1]["real"], inv_sqrt_2, rel_tol=1e-4)
    assert math.isclose(res["probabilities"]["0"], 0.5, rel_tol=1e-4)
    assert math.isclose(res["probabilities"]["1"], 0.5, rel_tol=1e-4)
    assert math.isclose(res["bloch"]["x"], 1.0, abs_tol=1e-4)
    assert math.isclose(res["bloch"]["y"], 0.0, abs_tol=1e-4)
    assert math.isclose(res["bloch"]["z"], 0.0, abs_tol=1e-4)

def test_statevector_h_followed_by_z():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="z", targets=[0])
        ],
        measure=False
    )
    qc = to_qiskit_circuit(circuit)
    res = statevector_service.simulate_statevector(qc)
    
    inv_sqrt_2 = 1.0 / math.sqrt(2)
    assert math.isclose(res["statevector"][0]["real"], inv_sqrt_2, rel_tol=1e-4)
    assert math.isclose(res["statevector"][1]["real"], -inv_sqrt_2, rel_tol=1e-4)
    assert math.isclose(res["bloch"]["x"], -1.0, abs_tol=1e-4)
    assert math.isclose(res["bloch"]["y"], 0.0, abs_tol=1e-4)
    assert math.isclose(res["bloch"]["z"], 0.0, abs_tol=1e-4)

def test_statevector_rz_gate():
    angle = math.pi / 2
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="rz", targets=[0], angle=angle)
        ],
        measure=False
    )
    qc = to_qiskit_circuit(circuit)
    res = statevector_service.simulate_statevector(qc)
    
    # RZ(pi/2)|+> has bloch vector (0, 1, 0)
    assert math.isclose(res["bloch"]["x"], 0.0, abs_tol=1e-4)
    assert math.isclose(res["bloch"]["y"], 1.0, abs_tol=1e-4)
    assert math.isclose(res["bloch"]["z"], 0.0, abs_tol=1e-4)

def test_statevector_bell_state():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=0,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=False
    )
    qc = to_qiskit_circuit(circuit)
    res = statevector_service.simulate_statevector(qc)
    
    assert res["qubits"] == 2
    assert res["bloch"] is None  # No single Bloch vector for entangled multi-qubit state
    
    inv_sqrt_2 = 1.0 / math.sqrt(2)
    assert math.isclose(res["statevector"][0]["real"], inv_sqrt_2, rel_tol=1e-4)
    assert math.isclose(res["statevector"][3]["real"], inv_sqrt_2, rel_tol=1e-4)
    assert math.isclose(res["probabilities"]["00"], 0.5, rel_tol=1e-4)
    assert math.isclose(res["probabilities"]["11"], 0.5, rel_tol=1e-4)
    assert res["probabilities"]["01"] == 0.0
    assert res["probabilities"]["10"] == 0.0

def test_bloch_canonical_states():
    # Test |0>, |1>, |+>, |->
    canonical_cases = [
        ([], (0.0, 0.0, 1.0)),
        ([GateRequest(gate="x", targets=[0])], (0.0, 0.0, -1.0)),
        ([GateRequest(gate="h", targets=[0])], (1.0, 0.0, 0.0)),
        ([GateRequest(gate="h", targets=[0]), GateRequest(gate="z", targets=[0])], (-1.0, 0.0, 0.0))
    ]
    for gates, (expected_x, expected_y, expected_z) in canonical_cases:
        circuit = CircuitRequest(qubits=1, classical_bits=0, gates=gates, measure=False)
        qc = to_qiskit_circuit(circuit)
        res = statevector_service.simulate_statevector(qc)
        bloch = res["bloch"]
        assert math.isclose(bloch["x"], expected_x, abs_tol=1e-4)
        assert math.isclose(bloch["y"], expected_y, abs_tol=1e-4)
        assert math.isclose(bloch["z"], expected_z, abs_tol=1e-4)

def test_bloch_y_axis_positive_and_negative():
    # |+i> = H followed by S -> (0, 1, 0)
    circuit_plus_i = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="s", targets=[0])
        ],
        measure=False
    )
    qc = to_qiskit_circuit(circuit_plus_i)
    res = statevector_service.simulate_statevector(qc)
    assert math.isclose(res["bloch"]["x"], 0.0, abs_tol=1e-4)
    assert math.isclose(res["bloch"]["y"], 1.0, abs_tol=1e-4)
    assert math.isclose(res["bloch"]["z"], 0.0, abs_tol=1e-4)

    # RX(pi/2)|0> -> (0, -1, 0)
    circuit_minus_i = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[
            GateRequest(gate="rx", targets=[0], angle=math.pi / 2)
        ],
        measure=False
    )
    qc = to_qiskit_circuit(circuit_minus_i)
    res = statevector_service.simulate_statevector(qc)
    assert math.isclose(res["bloch"]["x"], 0.0, abs_tol=1e-4)
    assert math.isclose(res["bloch"]["y"], -1.0, abs_tol=1e-4)
    assert math.isclose(res["bloch"]["z"], 0.0, abs_tol=1e-4)

def test_statevector_api_endpoint():
    payload = {
        "qubits": 1,
        "classical_bits": 0,
        "gates": [{"gate": "h", "targets": [0]}],
        "measure": False,
        "shots": 1024
    }
    response = client.post("/api/v1/simulate/statevector", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["backend"] == "qiskit_aer_statevector"
    assert data["qubits"] == 1
    assert len(data["statevector"]) == 2
    assert "bloch" in data
    assert data["bloch"]["x"] == 1.0
    assert data["probabilities"]["0"] == 0.5

def test_statevector_api_endpoint_qubit_limit():
    # If circuit exceeds MAX_STATEVECTOR_QUBITS (default 16)
    payload = {
        "qubits": 20,
        "classical_bits": 0,
        "gates": [],
        "measure": False,
        "shots": 1024
    }
    response = client.post("/api/v1/simulate/statevector", json=payload)
    assert response.status_code == 400
    assert "exceeds maximum statevector qubit limit" in response.json()["detail"]

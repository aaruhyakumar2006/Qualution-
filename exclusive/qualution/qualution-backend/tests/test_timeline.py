import pytest
import math
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.circuit import CircuitRequest, GateRequest
from app.services.timeline_service import timeline_service
from app.core.config import settings

client = TestClient(app)

def test_empty_circuit_timeline():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[],
        measure=False
    )
    res = timeline_service.generate_timeline(circuit)
    
    assert res["qubits"] == 2
    assert res["total_steps"] == 1
    assert len(res["steps"]) == 1
    
    step0 = res["steps"][0]
    assert step0["step"] == 0
    assert step0["operation"] == "initial"
    assert step0["qubits"] == []
    assert step0["probabilities"]["00"] == 1.0
    assert step0["bloch"] is None

def test_h_gate_timeline():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=False
    )
    res = timeline_service.generate_timeline(circuit)
    
    assert res["total_steps"] == 2
    step0 = res["steps"][0]
    step1 = res["steps"][1]
    
    # Step 0: |0>
    assert step0["step"] == 0
    assert step0["probabilities"]["0"] == 1.0
    assert step0["bloch"] == {"x": 0.0, "y": 0.0, "z": 1.0}
    
    # Step 1: |+>
    assert step1["step"] == 1
    assert step1["operation"] == "h"
    assert step1["qubits"] == [0]
    assert math.isclose(step1["probabilities"]["0"], 0.5, rel_tol=1e-4)
    assert math.isclose(step1["probabilities"]["1"], 0.5, rel_tol=1e-4)
    assert math.isclose(step1["bloch"]["x"], 1.0, abs_tol=1e-4)
    assert math.isclose(step1["bloch"]["y"], 0.0, abs_tol=1e-4)
    assert math.isclose(step1["bloch"]["z"], 0.0, abs_tol=1e-4)

def test_x_gate_timeline():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="x", targets=[0])],
        measure=False
    )
    res = timeline_service.generate_timeline(circuit)
    
    assert res["total_steps"] == 2
    step1 = res["steps"][1]
    assert step1["operation"] == "x"
    assert step1["probabilities"]["1"] == 1.0
    assert math.isclose(step1["bloch"]["z"], -1.0, abs_tol=1e-4)

def test_h_then_z_timeline():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="z", targets=[0])
        ],
        measure=False
    )
    res = timeline_service.generate_timeline(circuit)
    
    assert res["total_steps"] == 3
    # Step 0: (0, 0, 1)
    assert res["steps"][0]["bloch"] == {"x": 0.0, "y": 0.0, "z": 1.0}
    # Step 1: (1, 0, 0)
    assert math.isclose(res["steps"][1]["bloch"]["x"], 1.0, abs_tol=1e-4)
    # Step 2: (-1, 0, 0)
    assert math.isclose(res["steps"][2]["bloch"]["x"], -1.0, abs_tol=1e-4)

def test_bell_state_timeline():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=0,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=False
    )
    res = timeline_service.generate_timeline(circuit)
    
    assert res["total_steps"] == 3
    # Step 0: |00>
    assert res["steps"][0]["probabilities"]["00"] == 1.0
    
    # Step 1: (|00> + |01>)/sqrt(2) in Qiskit ordering
    assert math.isclose(res["steps"][1]["probabilities"]["00"], 0.5, rel_tol=1e-4)
    assert math.isclose(res["steps"][1]["probabilities"]["01"], 0.5, rel_tol=1e-4)
    
    # Step 2: (|00> + |11>)/sqrt(2)
    assert math.isclose(res["steps"][2]["probabilities"]["00"], 0.5, rel_tol=1e-4)
    assert math.isclose(res["steps"][2]["probabilities"]["11"], 0.5, rel_tol=1e-4)
    assert res["steps"][2]["probabilities"]["01"] == 0.0
    assert res["steps"][2]["probabilities"]["10"] == 0.0
    assert res["steps"][2]["bloch"] is None

def test_rotation_timeline():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="rx", targets=[0], angle=math.pi / 2)],
        measure=False
    )
    res = timeline_service.generate_timeline(circuit)
    
    assert res["total_steps"] == 2
    step1 = res["steps"][1]
    assert step1["operation"] == "rx"
    assert step1["parameters"] == {"angle": math.pi / 2}
    assert math.isclose(step1["bloch"]["y"], -1.0, abs_tol=1e-4)

def test_operation_metadata():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=0,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1]),
            GateRequest(gate="rz", targets=[1], angle=1.234)
        ],
        measure=False
    )
    res = timeline_service.generate_timeline(circuit)
    
    assert res["steps"][1]["operation"] == "h"
    assert res["steps"][1]["qubits"] == [0]
    
    assert res["steps"][2]["operation"] == "cx"
    assert res["steps"][2]["qubits"] == [0, 1]
    
    assert res["steps"][3]["operation"] == "rz"
    assert res["steps"][3]["qubits"] == [1]
    assert res["steps"][3]["parameters"] == {"angle": 1.234}

def test_measurement_not_unitary_step():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=True
    )
    res = timeline_service.generate_timeline(circuit)
    
    # 2 gates + 1 initial step = 3 steps (measurement is not an evolution step)
    assert res["total_steps"] == 3

def test_timeline_api_endpoint_success():
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
    response = client.post("/api/v1/simulate/timeline", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["backend"] == "qiskit_statevector_timeline"
    assert data["qubits"] == 2
    assert data["total_steps"] == 3
    assert len(data["steps"]) == 3
    assert data["steps"][0]["operation"] == "initial"
    assert data["steps"][1]["operation"] == "h"
    assert data["steps"][2]["operation"] == "cx"

def test_timeline_api_endpoint_limits():
    # Exceeding MAX_TIMELINE_QUBITS (default 12)
    payload_qubits = {
        "qubits": 15,
        "classical_bits": 0,
        "gates": [],
        "measure": False
    }
    resp1 = client.post("/api/v1/simulate/timeline", json=payload_qubits)
    assert resp1.status_code == 400
    assert "exceeds maximum timeline qubit limit" in resp1.json()["detail"]

    # Exceeding MAX_TIMELINE_STEPS (default 50)
    payload_gates = {
        "qubits": 1,
        "classical_bits": 0,
        "gates": [{"gate": "x", "targets": [0]} for _ in range(55)],
        "measure": False
    }
    resp2 = client.post("/api/v1/simulate/timeline", json=payload_gates)
    assert resp2.status_code == 400
    assert "contains too many operations" in resp2.json()["detail"]

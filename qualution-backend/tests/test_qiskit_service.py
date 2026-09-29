import pytest
import math
from typing import List, Tuple
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.circuit import CircuitRequest, GateRequest, AllGates, RotationGate
from app.services.qiskit_service import to_qiskit_circuit, get_qiskit_debug_info

client = TestClient(app)

def test_empty_circuit():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[],
        measure=False,
        shots=1024
    )
    qc = to_qiskit_circuit(circuit)
    assert qc.num_qubits == 2
    assert qc.num_clbits == 2
    assert len(qc.data) == 0

def test_h_gate():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=False,
        shots=1024
    )
    qc = to_qiskit_circuit(circuit)
    assert qc.num_qubits == 1
    assert len(qc.data) == 1
    assert qc.data[0].operation.name == "h"
    assert qc.find_bit(qc.data[0].qubits[0]).index == 0

def test_single_qubit_gates_x_y_z_s_t():
    gates: List[AllGates] = ["x", "y", "z", "s", "t"]
    for gate_name in gates:
        circuit = CircuitRequest(
            qubits=1,
            classical_bits=0,
            gates=[GateRequest(gate=gate_name, targets=[0])],
            measure=False
        )
        qc = to_qiskit_circuit(circuit)
        assert len(qc.data) == 1
        assert qc.data[0].operation.name == gate_name
        assert qc.find_bit(qc.data[0].qubits[0]).index == 0

def test_rotation_gates():
    rotations: List[Tuple[RotationGate, float]] = [
        ("rx", 1.5708),
        ("ry", math.pi / 4),
        ("rz", 3.14159)
    ]
    for gate_name, angle in rotations:
        circuit = CircuitRequest(
            qubits=1,
            classical_bits=0,
            gates=[GateRequest(gate=gate_name, targets=[0], angle=angle)],
            measure=False
        )
        qc = to_qiskit_circuit(circuit)
        assert len(qc.data) == 1
        assert qc.data[0].operation.name == gate_name
        assert math.isclose(float(qc.data[0].operation.params[0]), angle, rel_tol=1e-5)

def test_cx_gate_ordering():
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
    assert len(qc.data) == 2
    assert qc.data[0].operation.name == "h"
    assert qc.find_bit(qc.data[0].qubits[0]).index == 0
    
    assert qc.data[1].operation.name == "cx"
    control = qc.find_bit(qc.data[1].qubits[0]).index
    target = qc.find_bit(qc.data[1].qubits[1]).index
    assert control == 0
    assert target == 1

def test_cz_gate():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=0,
        gates=[GateRequest(gate="cz", targets=[0, 1])],
        measure=False
    )
    qc = to_qiskit_circuit(circuit)
    assert len(qc.data) == 1
    assert qc.data[0].operation.name == "cz"
    q0 = qc.find_bit(qc.data[0].qubits[0]).index
    q1 = qc.find_bit(qc.data[0].qubits[1]).index
    assert (q0, q1) == (0, 1)

def test_swap_gate():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=0,
        gates=[GateRequest(gate="swap", targets=[0, 1])],
        measure=False
    )
    qc = to_qiskit_circuit(circuit)
    assert len(qc.data) == 1
    assert qc.data[0].operation.name == "swap"
    q0 = qc.find_bit(qc.data[0].qubits[0]).index
    q1 = qc.find_bit(qc.data[0].qubits[1]).index
    assert (q0, q1) == (0, 1)

def test_bell_circuit():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=True,
        shots=1024
    )
    qc = to_qiskit_circuit(circuit)
    debug_info = get_qiskit_debug_info(qc)
    
    assert debug_info["backend"] == "qiskit"
    assert debug_info["qubits"] == 2
    assert debug_info["classical_bits"] == 2
    assert len(debug_info["operations"]) == 2
    assert debug_info["operations"][0] == {"name": "h", "qubits": [0]}
    assert debug_info["operations"][1] == {"name": "cx", "qubits": [0, 1]}
    assert len(debug_info["measurements"]) == 2

def test_measurement_mapping():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=True,
        shots=1024
    )
    qc = to_qiskit_circuit(circuit)
    debug_info = get_qiskit_debug_info(qc)
    
    expected_measurements = [
        {"qubit": 0, "classical_bit": 0},
        {"qubit": 1, "classical_bit": 1}
    ]
    assert debug_info["measurements"] == expected_measurements

def test_convert_endpoint_api():
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
    response = client.post("/api/v1/circuits/convert/qiskit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["backend"] == "qiskit"
    assert data["qubits"] == 2
    assert data["classical_bits"] == 2
    assert len(data["operations"]) == 2
    assert len(data["measurements"]) == 2

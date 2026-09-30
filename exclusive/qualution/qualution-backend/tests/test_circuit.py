import pytest
from pydantic import ValidationError
from app.schemas.circuit import CircuitRequest, GateRequest

def test_valid_h_gate():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=1,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=True,
        shots=100
    )
    assert circuit.qubits == 1
    assert len(circuit.gates) == 1

def test_valid_bell_circuit():
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
    assert circuit.qubits == 2
    assert len(circuit.gates) == 2

def test_valid_rx_with_angle():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=1,
        gates=[GateRequest(gate="rx", targets=[0], angle=1.5708)],
        measure=True
    )
    assert circuit.gates[0].angle == 1.5708

def test_valid_swap_gate():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[GateRequest(gate="swap", targets=[0, 1])],
        measure=True
    )
    assert circuit.gates[0].gate == "swap"

def test_invalid_cx_one_target():
    with pytest.raises(ValidationError) as exc_info:
        CircuitRequest(
            qubits=2,
            classical_bits=2,
            gates=[{"gate": "cx", "targets": [0]}],
            measure=True
        )
    assert "requires exactly 2 targets" in str(exc_info.value)

def test_invalid_h_two_targets():
    with pytest.raises(ValidationError) as exc_info:
        CircuitRequest(
            qubits=2,
            classical_bits=2,
            gates=[{"gate": "h", "targets": [0, 1]}],
            measure=True
        )
    assert "requires exactly 1 target" in str(exc_info.value)

def test_invalid_rx_no_angle():
    with pytest.raises(ValidationError) as exc_info:
        CircuitRequest(
            qubits=1,
            classical_bits=1,
            gates=[{"gate": "rx", "targets": [0]}],
            measure=True
        )
    assert "requires an angle" in str(exc_info.value)

def test_invalid_h_with_angle():
    with pytest.raises(ValidationError) as exc_info:
        CircuitRequest(
            qubits=1,
            classical_bits=1,
            gates=[{"gate": "h", "targets": [0], "angle": 1.5}],
            measure=True
        )
    assert "must not have an angle" in str(exc_info.value)

def test_invalid_duplicate_cx_target():
    with pytest.raises(ValidationError) as exc_info:
        CircuitRequest(
            qubits=2,
            classical_bits=2,
            gates=[{"gate": "cx", "targets": [0, 0]}],
            measure=True
        )
    assert "must be distinct" in str(exc_info.value)

def test_invalid_qubit_index():
    with pytest.raises(ValidationError) as exc_info:
        CircuitRequest(
            qubits=2,
            classical_bits=2,
            gates=[{"gate": "h", "targets": [2]}],
            measure=True
        )
    assert "references invalid qubit" in str(exc_info.value)

def test_negative_qubit_index():
    with pytest.raises(ValidationError) as exc_info:
        CircuitRequest(
            qubits=2,
            classical_bits=2,
            gates=[{"gate": "h", "targets": [-1]}],
            measure=True
        )
    assert "references invalid qubit" in str(exc_info.value)

def test_measurement_zero_classical_bits():
    with pytest.raises(ValidationError) as exc_info:
        CircuitRequest(
            qubits=2,
            classical_bits=0,
            gates=[],
            measure=True
        )
    assert "Measurement requires at least 1 classical bit" in str(exc_info.value)

def test_invalid_gate_name():
    with pytest.raises(ValidationError):
        CircuitRequest(
            qubits=2,
            classical_bits=2,
            gates=[{"gate": "unknown", "targets": [0]}],
            measure=True
        )

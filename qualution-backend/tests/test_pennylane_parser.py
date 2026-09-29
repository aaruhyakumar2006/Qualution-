import pytest
import math
from app.codeparse.pennylane_parser import PennyLaneCodeParser

def test_pennylane_parser_basic_circuit():
    code = """
import pennylane as qml

dev = qml.device("default.qubit", wires=2)

@qml.qnode(dev, shots=1000)
def circuit():
    qml.Hadamard(wires=0)
    qml.PauliX(wires=1)
    qml.CNOT(wires=[0, 1])
    return qml.counts()
"""
    parser = PennyLaneCodeParser()
    circuit, warnings = parser.parse(code)

    assert circuit.qubits == 2
    assert len(circuit.gates) == 3
    assert circuit.gates[0].gate == "h"
    assert circuit.gates[0].targets == [0]
    assert circuit.gates[1].gate == "x"
    assert circuit.gates[1].targets == [1]
    assert circuit.gates[2].gate == "cx"
    assert circuit.gates[2].targets == [0, 1]
    assert circuit.measure is True
    assert circuit.shots == 1000

def test_pennylane_parser_rotations():
    code = """
import pennylane as qml

dev = qml.device("default.qubit", wires=2)

@qml.qnode(dev)
def circuit():
    qml.RX(1.570796, wires=0)
    qml.RY(0.785398, wires=1)
    qml.RZ(3.141592, wires=0)
    return qml.state()
"""
    parser = PennyLaneCodeParser()
    circuit, warnings = parser.parse(code)

    assert circuit.qubits == 2
    assert len(circuit.gates) == 3
    assert math.isclose(circuit.gates[0].angle, 1.570796, rel_tol=1e-5)
    assert math.isclose(circuit.gates[1].angle, 0.785398, rel_tol=1e-5)
    assert math.isclose(circuit.gates[2].angle, 3.141592, rel_tol=1e-5)
    assert circuit.measure is False

def test_pennylane_parser_unsupported_operation():
    code = """
import pennylane as qml

dev = qml.device("default.qubit", wires=3)

@qml.qnode(dev)
def circuit():
    qml.Toffoli(wires=[0, 1, 2])
    return qml.state()
"""
    parser = PennyLaneCodeParser()
    with pytest.raises(ValueError) as exc:
        parser.parse(code)
    assert "Unsupported PennyLane operation" in str(exc.value)

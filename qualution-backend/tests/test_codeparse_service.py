import pytest
from app.codeparse.service import codeparse_service

def test_codeparse_service_qiskit():
    code = """
from qiskit import QuantumCircuit
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
"""
    resp = codeparse_service.parse_code("qiskit", code)
    assert resp.framework == "qiskit"
    assert resp.circuit.qubits == 2
    assert len(resp.circuit.gates) == 2

def test_codeparse_service_pennylane():
    code = """
import pennylane as qml
dev = qml.device("default.qubit", wires=2)
@qml.qnode(dev)
def circuit():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.state()
"""
    resp = codeparse_service.parse_code("PennyLane", code)
    assert resp.framework == "pennylane"
    assert resp.circuit.qubits == 2
    assert len(resp.circuit.gates) == 2

def test_codeparse_service_cirq():
    code = """
import cirq
qubits = cirq.LineQubit.range(2)
circuit = cirq.Circuit()
circuit.append(cirq.H(qubits[0]))
circuit.append(cirq.CNOT(qubits[0], qubits[1]))
"""
    resp = codeparse_service.parse_code("cirq", code)
    assert resp.framework == "cirq"
    assert resp.circuit.qubits == 2
    assert len(resp.circuit.gates) == 2

def test_codeparse_service_unsupported_framework():
    with pytest.raises(ValueError) as exc:
        codeparse_service.parse_code("braket", "circuit = ...")
    assert "Unsupported framework 'braket'" in str(exc.value)

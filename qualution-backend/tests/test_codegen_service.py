import pytest
from app.codegen.service import codegen_service
from app.schemas.circuit import CircuitRequest, GateRequest

def test_codegen_service_qiskit():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=1,
        gates=[GateRequest(gate="x", targets=[0])],
        measure=True,
        shots=100
    )
    resp = codegen_service.generate_code("qiskit", circuit)
    assert resp.framework == "qiskit"
    assert resp.language == "python"
    assert "qc.x(0)" in resp.code
    assert resp.metadata.qubits == 1
    assert resp.metadata.gate_count == 1

def test_codegen_service_pennylane():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=1,
        gates=[GateRequest(gate="x", targets=[0])],
        measure=True,
        shots=100
    )
    resp = codegen_service.generate_code("PennyLane", circuit)
    assert resp.framework == "pennylane"
    assert resp.language == "python"
    assert "qml.PauliX(wires=0)" in resp.code

def test_codegen_service_cirq():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=1,
        gates=[GateRequest(gate="x", targets=[0])],
        measure=True,
        shots=100
    )
    resp = codegen_service.generate_code("cirq", circuit)
    assert resp.framework == "cirq"
    assert resp.language == "python"
    assert "circuit.append(cirq.X(qubits[0]))" in resp.code

def test_codegen_service_unknown_framework():
    circuit = CircuitRequest(qubits=1, classical_bits=0, gates=[], measure=False)
    with pytest.raises(ValueError) as exc:
        codegen_service.generate_code("braket", circuit)
    assert "Unsupported framework 'braket'" in str(exc.value)

import pytest
import math
from app.optimization.verifier import correctness_verifier
from app.schemas.circuit import CircuitRequest, GateRequest

def test_verifier_self_inverse_equivalence():
    c_orig = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="h", targets=[0])
        ],
        measure=False
    )
    c_opt = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[],
        measure=False
    )
    assert correctness_verifier.verify_equivalence(c_orig, c_opt) is True

def test_verifier_rotation_combination_equivalence():
    c_orig = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[
            GateRequest(gate="rx", targets=[0], angle=math.pi / 4),
            GateRequest(gate="rx", targets=[0], angle=math.pi / 4)
        ],
        measure=False
    )
    c_opt = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[
            GateRequest(gate="rx", targets=[0], angle=math.pi / 2)
        ],
        measure=False
    )
    assert correctness_verifier.verify_equivalence(c_orig, c_opt) is True

def test_verifier_rejects_non_equivalent_circuits():
    c1 = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="x", targets=[0])],
        measure=False
    )
    c2 = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="z", targets=[0])],
        measure=False
    )
    assert correctness_verifier.verify_equivalence(c1, c2) is False

def test_verifier_qubit_limit():
    c1 = CircuitRequest(qubits=15, classical_bits=0, gates=[], measure=False)
    c2 = CircuitRequest(qubits=15, classical_bits=0, gates=[], measure=False)
    with pytest.raises(ValueError) as exc:
        correctness_verifier.verify_equivalence(c1, c2)
    assert "exceeds maximum formal verification limit" in str(exc.value)

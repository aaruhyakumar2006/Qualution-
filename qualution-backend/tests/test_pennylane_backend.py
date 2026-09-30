import pytest
import math
from app.backends.registry import backend_registry
from app.schemas.circuit import CircuitRequest, GateRequest

@pytest.fixture
def qiskit_backend():
    return backend_registry.get("qiskit_aer")

@pytest.fixture
def pennylane_backend():
    return backend_registry.get("pennylane")

def test_pennylane_all_12_gates(pennylane_backend):
    """Test that all 12 initial gates execute without errors in PennyLane."""
    # 1. Single qubit gates
    gates = [
        GateRequest(gate="h", targets=[0]),
        GateRequest(gate="x", targets=[0]),
        GateRequest(gate="y", targets=[0]),
        GateRequest(gate="z", targets=[0]),
        GateRequest(gate="s", targets=[0]),
        GateRequest(gate="t", targets=[0]),
        GateRequest(gate="rx", targets=[0], angle=1.0),
        GateRequest(gate="ry", targets=[0], angle=1.0),
        GateRequest(gate="rz", targets=[0], angle=1.0),
    ]
    circuit_1q = CircuitRequest(qubits=1, classical_bits=1, gates=gates, measure=True, shots=100)
    res_1q = pennylane_backend.simulate(circuit_1q)
    assert res_1q.backend == "pennylane"
    assert sum(res_1q.counts.values()) == 100

    # 2. Two qubit gates
    two_q_gates = [
        GateRequest(gate="cx", targets=[0, 1]),
        GateRequest(gate="cz", targets=[0, 1]),
        GateRequest(gate="swap", targets=[0, 1]),
    ]
    circuit_2q = CircuitRequest(qubits=2, classical_bits=2, gates=two_q_gates, measure=True, shots=100)
    res_2q = pennylane_backend.simulate(circuit_2q)
    assert res_2q.backend == "pennylane"
    assert sum(res_2q.counts.values()) == 100

def test_pennylane_bloch_canonical_states(pennylane_backend):
    """Verify PennyLane single-qubit Bloch vector coordinates."""
    cases = [
        ([], (0.0, 0.0, 1.0)),
        ([GateRequest(gate="x", targets=[0])], (0.0, 0.0, -1.0)),
        ([GateRequest(gate="h", targets=[0])], (1.0, 0.0, 0.0)),
        ([GateRequest(gate="h", targets=[0]), GateRequest(gate="z", targets=[0])], (-1.0, 0.0, 0.0)),
        ([GateRequest(gate="h", targets=[0]), GateRequest(gate="s", targets=[0])], (0.0, 1.0, 0.0)),
        ([GateRequest(gate="rx", targets=[0], angle=math.pi / 2)], (0.0, -1.0, 0.0)),
    ]
    for gates, (exp_x, exp_y, exp_z) in cases:
        circuit = CircuitRequest(qubits=1, classical_bits=0, gates=gates, measure=False)
        res = pennylane_backend.statevector(circuit)
        bloch = res.bloch
        assert bloch is not None
        assert math.isclose(bloch.x, exp_x, abs_tol=1e-4)
        assert math.isclose(bloch.y, exp_y, abs_tol=1e-4)
        assert math.isclose(bloch.z, exp_z, abs_tol=1e-4)

def test_cross_backend_bell_state(qiskit_backend, pennylane_backend):
    """Verify Bell state invariant across Qiskit Aer and PennyLane."""
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=False
    )

    # 1. Compare exact theoretical statevectors
    qiskit_sv = qiskit_backend.statevector(circuit)
    pennylane_sv = pennylane_backend.statevector(circuit)

    assert qiskit_sv.probabilities == pennylane_sv.probabilities
    assert math.isclose(pennylane_sv.probabilities["00"], 0.5, rel_tol=1e-4)
    assert math.isclose(pennylane_sv.probabilities["11"], 0.5, rel_tol=1e-4)
    assert pennylane_sv.probabilities["01"] == 0.0
    assert pennylane_sv.probabilities["10"] == 0.0

    # 2. Compare shot-based simulations
    circuit_measure = circuit.model_copy(update={"measure": True, "shots": 2000})
    qiskit_sim = qiskit_backend.simulate(circuit_measure)
    pennylane_sim = pennylane_backend.simulate(circuit_measure)

    # Both backends must observe non-zero counts only in 00 and 11
    assert "01" not in qiskit_sim.counts
    assert "10" not in qiskit_sim.counts
    assert "01" not in pennylane_sim.counts
    assert "10" not in pennylane_sim.counts

    assert 0.44 <= pennylane_sim.probabilities["00"] <= 0.56
    assert 0.44 <= pennylane_sim.probabilities["11"] <= 0.56

def test_cross_backend_matrix(qiskit_backend, pennylane_backend):
    """
    Test matrix of circuits across Qiskit and PennyLane to ensure probability invariants match.
    """
    test_circuits = [
        # |0>
        CircuitRequest(qubits=1, classical_bits=0, gates=[], measure=False),
        # X
        CircuitRequest(qubits=1, classical_bits=0, gates=[GateRequest(gate="x", targets=[0])], measure=False),
        # H
        CircuitRequest(qubits=1, classical_bits=0, gates=[GateRequest(gate="h", targets=[0])], measure=False),
        # H -> Z
        CircuitRequest(
            qubits=1,
            classical_bits=0,
            gates=[GateRequest(gate="h", targets=[0]), GateRequest(gate="z", targets=[0])],
            measure=False
        ),
        # RX(pi/2)
        CircuitRequest(
            qubits=1,
            classical_bits=0,
            gates=[GateRequest(gate="rx", targets=[0], angle=math.pi / 2)],
            measure=False
        ),
        # RY(pi/2)
        CircuitRequest(
            qubits=1,
            classical_bits=0,
            gates=[GateRequest(gate="ry", targets=[0], angle=math.pi / 2)],
            measure=False
        ),
    ]

    for circuit in test_circuits:
        res_qiskit = qiskit_backend.statevector(circuit)
        res_pl = pennylane_backend.statevector(circuit)

        for bitstring in res_qiskit.probabilities:
            p_qiskit = res_qiskit.probabilities[bitstring]
            p_pl = res_pl.probabilities[bitstring]
            assert math.isclose(p_qiskit, p_pl, abs_tol=1e-5), f"Mismatch for circuit {circuit.gates} on bitstring {bitstring}"

        if res_qiskit.bloch and res_pl.bloch:
            assert math.isclose(res_qiskit.bloch.x, res_pl.bloch.x, abs_tol=1e-4)
            assert math.isclose(res_qiskit.bloch.y, res_pl.bloch.y, abs_tol=1e-4)
            assert math.isclose(res_qiskit.bloch.z, res_pl.bloch.z, abs_tol=1e-4)

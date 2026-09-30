import pytest
import numpy as np
from app.backends.cirq_backend import CirqBackend
from app.schemas.circuit import CircuitRequest, GateRequest

@pytest.fixture
def backend():
    return CirqBackend()

def test_cirq_metadata(backend):
    meta = backend.get_metadata()
    assert meta.name == "cirq"
    assert meta.framework == "cirq"
    assert meta.provider == "local"
    assert meta.status == "AVAILABLE"
    assert meta.available is True
    assert meta.capabilities.shot_simulation is True
    assert meta.capabilities.statevector is True
    assert meta.capabilities.bloch is True

def test_cirq_single_qubit_ground_state(backend):
    circ = CircuitRequest(qubits=1, classical_bits=1, gates=[], measure=False)
    res = backend.statevector(circ)
    assert res.backend == "cirq"
    assert res.qubits == 1
    assert len(res.statevector) == 2
    assert np.isclose(res.statevector[0].real, 1.0)
    assert np.isclose(res.statevector[1].real, 0.0)
    assert np.isclose(res.probabilities["0"], 1.0)
    assert np.isclose(res.probabilities["1"], 0.0)
    assert res.bloch is not None
    assert np.isclose(res.bloch.z, 1.0)

def test_cirq_pauli_x_gate(backend):
    circ = CircuitRequest(qubits=1, classical_bits=1, gates=[GateRequest(gate="x", targets=[0])], measure=False)
    res = backend.statevector(circ)
    assert np.isclose(res.statevector[1].real, 1.0)
    assert np.isclose(res.probabilities["1"], 1.0)
    assert np.isclose(res.bloch.z, -1.0)

def test_cirq_hadamard_superposition(backend):
    circ = CircuitRequest(qubits=1, classical_bits=1, gates=[GateRequest(gate="h", targets=[0])], measure=False)
    res = backend.statevector(circ)
    assert np.isclose(res.probabilities["0"], 0.5)
    assert np.isclose(res.probabilities["1"], 0.5)
    assert np.isclose(res.bloch.x, 1.0)

def test_cirq_rotation_gates(backend):
    # RX(pi)
    circ_rx = CircuitRequest(qubits=1, classical_bits=1, gates=[GateRequest(gate="rx", targets=[0], angle=np.pi)], measure=False)
    res_rx = backend.statevector(circ_rx)
    assert np.isclose(res_rx.probabilities["1"], 1.0, atol=1e-5)

    # RY(pi)
    circ_ry = CircuitRequest(qubits=1, classical_bits=1, gates=[GateRequest(gate="ry", targets=[0], angle=np.pi)], measure=False)
    res_ry = backend.statevector(circ_ry)
    assert np.isclose(res_ry.probabilities["1"], 1.0, atol=1e-5)

    # RZ(pi/2) on |+> state
    circ_rz = CircuitRequest(
        qubits=1,
        classical_bits=1,
        gates=[GateRequest(gate="h", targets=[0]), GateRequest(gate="rz", targets=[0], angle=np.pi / 2)],
        measure=False
    )
    res_rz = backend.statevector(circ_rz)
    assert np.isclose(res_rz.probabilities["0"], 0.5)
    assert np.isclose(res_rz.probabilities["1"], 0.5)

def test_cirq_qubit_ordering_two_qubits(backend):
    """
    Verify exact qubit ordering:
    Basis index 1 -> |01> (qubit 0 is 1, qubit 1 is 0)
    Basis index 2 -> |10> (qubit 0 is 0, qubit 1 is 1)
    """
    # X on qubit 0
    circ_x0 = CircuitRequest(qubits=2, classical_bits=2, gates=[GateRequest(gate="x", targets=[0])], measure=False)
    res_x0 = backend.statevector(circ_x0)
    assert np.isclose(res_x0.probabilities["01"], 1.0)
    assert np.isclose(res_x0.probabilities["00"], 0.0)
    assert np.isclose(res_x0.probabilities["10"], 0.0)

    # X on qubit 1
    circ_x1 = CircuitRequest(qubits=2, classical_bits=2, gates=[GateRequest(gate="x", targets=[1])], measure=False)
    res_x1 = backend.statevector(circ_x1)
    assert np.isclose(res_x1.probabilities["10"], 1.0)
    assert np.isclose(res_x1.probabilities["00"], 0.0)
    assert np.isclose(res_x1.probabilities["01"], 0.0)

def test_cirq_cnot_control_target_order(backend):
    """
    Verify CX(control=0, target=1):
    If qubit 0 is 1, qubit 1 flips -> |11>
    If qubit 1 is 1 (and 0 is 0), nothing flips -> |10>
    """
    # X(0) + CX(0, 1) -> |11>
    circ1 = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="x", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1]),
        ],
        measure=False
    )
    res1 = backend.statevector(circ1)
    assert np.isclose(res1.probabilities["11"], 1.0)

    # X(1) + CX(0, 1) -> |10>
    circ2 = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="x", targets=[1]),
            GateRequest(gate="cx", targets=[0, 1]),
        ],
        measure=False
    )
    res2 = backend.statevector(circ2)
    assert np.isclose(res2.probabilities["10"], 1.0)

def test_cirq_bell_state_statevector_and_shots(backend):
    circ = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1]),
        ],
        measure=True,
        shots=1000
    )

    # Statevector
    sv = backend.statevector(circ)
    assert np.isclose(sv.probabilities["00"], 0.5)
    assert np.isclose(sv.probabilities["11"], 0.5)
    assert np.isclose(sv.probabilities["01"], 0.0)
    assert np.isclose(sv.probabilities["10"], 0.0)

    # Shots simulation
    sim = backend.simulate(circ)
    assert sim.backend == "cirq"
    assert sim.shots == 1000
    assert sum(sim.counts.values()) == 1000
    assert "00" in sim.counts
    assert "11" in sim.counts
    assert sim.counts.get("01", 0) == 0
    assert sim.counts.get("10", 0) == 0
    assert 400 <= sim.counts["00"] <= 600
    assert 400 <= sim.counts["11"] <= 600

def test_cirq_ghz_state(backend):
    circ = CircuitRequest(
        qubits=3,
        classical_bits=3,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1]),
            GateRequest(gate="cx", targets=[1, 2]),
        ],
        measure=True,
        shots=500
    )
    sv = backend.statevector(circ)
    assert np.isclose(sv.probabilities["000"], 0.5)
    assert np.isclose(sv.probabilities["111"], 0.5)

    sim = backend.simulate(circ)
    assert "000" in sim.counts
    assert "111" in sim.counts
    assert sum(sim.counts.values()) == 500

def test_cirq_cz_and_swap_gates(backend):
    # SWAP
    circ_swap = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="x", targets=[0]),
            GateRequest(gate="swap", targets=[0, 1]),
        ],
        measure=False
    )
    res_swap = backend.statevector(circ_swap)
    assert np.isclose(res_swap.probabilities["10"], 1.0)

    # CZ
    circ_cz = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="h", targets=[1]),
            GateRequest(gate="cz", targets=[0, 1]),
        ],
        measure=False
    )
    res_cz = backend.statevector(circ_cz)
    # |++> with CZ has equal 0.25 probabilities on all 4 states
    for bs in ["00", "01", "10", "11"]:
        assert np.isclose(res_cz.probabilities[bs], 0.25)

def test_cirq_unsupported_gate_error(backend):
    circ = CircuitRequest.model_construct(
        qubits=1,
        classical_bits=1,
        gates=[GateRequest.model_construct(gate="nonexistent_gate", targets=[0], angle=None)],
        measure=False,
        shots=100
    )
    with pytest.raises(ValueError, match="Unsupported Cirq gate"):
        backend.statevector(circ)

def test_cirq_missing_angle_error(backend):
    circ = CircuitRequest.model_construct(
        qubits=1,
        classical_bits=1,
        gates=[GateRequest.model_construct(gate="rx", targets=[0], angle=None)],
        measure=False,
        shots=100
    )
    with pytest.raises(ValueError, match="Gate rx requires an angle"):
        backend.statevector(circ)

def test_cirq_target_out_of_range(backend):
    circ = CircuitRequest.model_construct(
        qubits=2,
        classical_bits=2,
        gates=[GateRequest.model_construct(gate="x", targets=[5], angle=None)],
        measure=False,
        shots=100
    )
    with pytest.raises(ValueError, match="out of range"):
        backend.statevector(circ)

def test_cirq_simulate_requires_measure(backend):
    circ = CircuitRequest(qubits=1, classical_bits=1, gates=[GateRequest(gate="h", targets=[0])], measure=False)
    with pytest.raises(ValueError, match="measure=true"):
        backend.simulate(circ)

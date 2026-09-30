import pytest
import math
import numpy as np
from qiskit import QuantumCircuit
from app.services.statevector_service import statevector_service
from app.schemas.circuit import CircuitRequest, GateRequest
from app.services.circuit_run_service import CircuitRunService
from app.schemas.circuit_run import CircuitRunRequest, CircuitRunInclude

def test_bloch_ground_state_0():
    qc = QuantumCircuit(1)
    res = statevector_service.simulate_statevector(qc)
    bloch = res["bloch"]
    assert bloch["x"] == pytest.approx(0.0, abs=1e-5)
    assert bloch["y"] == pytest.approx(0.0, abs=1e-5)
    assert bloch["z"] == pytest.approx(1.0, abs=1e-5)
    assert res["bloch_qubits"]["0"]["magnitude"] == pytest.approx(1.0, abs=1e-5)
    assert res["bloch_qubits"]["0"]["purity"] == pytest.approx(1.0, abs=1e-5)

def test_bloch_hadamard_h():
    qc = QuantumCircuit(1)
    qc.h(0)
    res = statevector_service.simulate_statevector(qc)
    bloch = res["bloch"]
    assert bloch["x"] == pytest.approx(1.0, abs=1e-5)
    assert bloch["y"] == pytest.approx(0.0, abs=1e-5)
    assert bloch["z"] == pytest.approx(0.0, abs=1e-5)
    assert res["bloch_qubits"]["0"]["purity"] == pytest.approx(1.0, abs=1e-5)

def test_bloch_pauli_x():
    qc = QuantumCircuit(1)
    qc.x(0)
    res = statevector_service.simulate_statevector(qc)
    bloch = res["bloch"]
    assert bloch["x"] == pytest.approx(0.0, abs=1e-5)
    assert bloch["y"] == pytest.approx(0.0, abs=1e-5)
    assert bloch["z"] == pytest.approx(-1.0, abs=1e-5)

def test_bloch_rx_pi_2():
    qc = QuantumCircuit(1)
    qc.rx(math.pi / 2.0, 0)
    res = statevector_service.simulate_statevector(qc)
    bloch = res["bloch"]
    assert bloch["x"] == pytest.approx(0.0, abs=1e-5)
    assert bloch["y"] == pytest.approx(-1.0, abs=1e-5)
    assert bloch["z"] == pytest.approx(0.0, abs=1e-5)

def test_bloch_2qubit_product_state():
    # H(q0), RX(pi/2)(q1)
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.rx(math.pi / 2.0, 1)
    res = statevector_service.simulate_statevector(qc)
    bq = res["bloch_qubits"]
    assert len(bq) == 2
    # q0: (+1, 0, 0)
    assert bq["0"]["x"] == pytest.approx(1.0, abs=1e-5)
    assert bq["0"]["y"] == pytest.approx(0.0, abs=1e-5)
    assert bq["0"]["z"] == pytest.approx(0.0, abs=1e-5)
    assert bq["0"]["purity"] == pytest.approx(1.0, abs=1e-5)
    # q1: (0, -1, 0)
    assert bq["1"]["x"] == pytest.approx(0.0, abs=1e-5)
    assert bq["1"]["y"] == pytest.approx(-1.0, abs=1e-5)
    assert bq["1"]["z"] == pytest.approx(0.0, abs=1e-5)
    assert bq["1"]["purity"] == pytest.approx(1.0, abs=1e-5)

def test_bloch_bell_state_reduced_density_matrices():
    # H(q0), CX(q0, q1)
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0, 1)
    res = statevector_service.simulate_statevector(qc)
    bq = res["bloch_qubits"]
    # Maximally mixed reduced states
    for q in ["0", "1"]:
        assert bq[q]["x"] == pytest.approx(0.0, abs=1e-5)
        assert bq[q]["y"] == pytest.approx(0.0, abs=1e-5)
        assert bq[q]["z"] == pytest.approx(0.0, abs=1e-5)
        assert bq[q]["magnitude"] == pytest.approx(0.0, abs=1e-5)
        assert bq[q]["purity"] == pytest.approx(0.5, abs=1e-5)

def test_bloch_ghz_3qubit_state():
    # H(q0), CX(0, 1), CX(1, 2)
    qc = QuantumCircuit(3)
    qc.h(0)
    qc.cx(0, 1)
    qc.cx(1, 2)
    res = statevector_service.simulate_statevector(qc)
    bq = res["bloch_qubits"]
    assert len(bq) == 3
    for q in ["0", "1", "2"]:
        assert bq[q]["x"] == pytest.approx(0.0, abs=1e-5)
        assert bq[q]["y"] == pytest.approx(0.0, abs=1e-5)
        assert bq[q]["z"] == pytest.approx(0.0, abs=1e-5)
        assert bq[q]["purity"] == pytest.approx(0.5, abs=1e-5)

def test_circuit_run_workflow_returns_bloch_qubits():
    service = CircuitRunService()
    req = CircuitRunRequest(
        circuit=CircuitRequest(
            qubits=2,
            classical_bits=2,
            gates=[
                GateRequest(gate="h", targets=[0]),
                GateRequest(gate="rx", targets=[1], angle=math.pi / 2.0),
            ],
            measure=True,
            shots=1000,
        ),
        mode="shots",
        backend="auto",
        include=CircuitRunInclude(metrics=True, timeline=True, bloch=True),
    )
    res = service.run_circuit_workflow(req)
    assert res.visualization.bloch_qubits is not None
    assert "0" in res.visualization.bloch_qubits
    assert "1" in res.visualization.bloch_qubits
    assert res.visualization.bloch_qubits["0"].x == pytest.approx(1.0, abs=1e-5)
    assert res.visualization.bloch_qubits["1"].y == pytest.approx(-1.0, abs=1e-5)

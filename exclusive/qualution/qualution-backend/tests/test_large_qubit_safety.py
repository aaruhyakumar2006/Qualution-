import pytest
from app.schemas.circuit import CircuitRequest, GateRequest
from app.schemas.circuit_run import CircuitRunRequest, CircuitRunInclude
from app.services.circuit_run_service import CircuitRunService
from app.services.circuit_metrics_service import circuit_metrics_service

def test_large_circuit_shots_execution_does_not_crash():
    service = CircuitRunService()
    # 28-qubit circuit with H, CX, and measurements
    gates = [
        GateRequest(gate="h", targets=[0], column=0),
        GateRequest(gate="cx", targets=[0, 1], column=1),
    ]
    circuit = CircuitRequest(
        qubits=28,
        classical_bits=28,
        gates=gates,
        measure=True,
        shots=100,
    )
    req = CircuitRunRequest(
        circuit=circuit,
        backend="auto",
        mode="shots",
        include=CircuitRunInclude(
            metrics=True,
            bloch=True, # Even if frontend passes True, it must not crash on 28 qubits
            timeline=False,
        )
    )
    res = service.run_circuit_workflow(req)
    assert res.simulation.mode == "shots"
    assert res.circuit.qubits == 28
    assert res.simulation.counts is not None
    assert res.visualization.bloch is None # Safely omitted for > 8 qubits

def test_41_qubit_empty_circuit_does_not_crash():
    service = CircuitRunService()
    circuit = CircuitRequest(
        qubits=41,
        classical_bits=41,
        gates=[],
        measure=True,
        shots=100,
    )
    req = CircuitRunRequest(
        circuit=circuit,
        backend="auto",
        mode="shots",
        include=CircuitRunInclude(metrics=True, bloch=True, timeline=False)
    )
    res = service.run_circuit_workflow(req)
    assert res.circuit.qubits == 41
    assert res.routing.selected_backend == "clifford_stabilizer"
    assert res.simulation.counts is not None

def test_100_qubit_ghz_stabilizer_execution():
    service = CircuitRunService()
    gates = [GateRequest(gate="h", targets=[0], column=0)]
    for i in range(99):
        gates.append(GateRequest(gate="cx", targets=[i, i + 1], column=i + 1))
    circuit = CircuitRequest(
        qubits=100,
        classical_bits=100,
        gates=gates,
        measure=True,
        shots=100,
    )
    req = CircuitRunRequest(
        circuit=circuit,
        backend="auto",
        mode="shots",
        include=CircuitRunInclude(metrics=True, bloch=True, timeline=False)
    )
    res = service.run_circuit_workflow(req)
    assert res.circuit.qubits == 100
    assert res.routing.selected_backend == "clifford_stabilizer"
    assert res.simulation.counts is not None

def test_1000_qubit_stabilizer_execution_and_metrics():
    service = CircuitRunService()
    gates = [
        GateRequest(gate="h", targets=[0], column=0),
        GateRequest(gate="cx", targets=[0, 500], column=1),
        GateRequest(gate="cx", targets=[500, 999], column=2),
    ]
    circuit = CircuitRequest(
        qubits=1000,
        classical_bits=1000,
        gates=gates,
        measure=True,
        shots=50,
    )
    # Check metrics calculation first
    metrics = circuit_metrics_service.analyze_circuit(circuit)
    assert metrics["qubit_count"] == 1000
    assert metrics["is_clifford"] is True
    assert metrics["stabilizer_memory_bytes"] < 1_000_000 # Under 1 MB!
    assert metrics["recommended_simulation_method"] == "stabilizer"

    # Check workflow execution
    req = CircuitRunRequest(
        circuit=circuit,
        backend="auto",
        mode="shots",
        include=CircuitRunInclude(metrics=True, bloch=False, timeline=False)
    )
    res = service.run_circuit_workflow(req)
    assert res.circuit.qubits == 1000
    assert res.routing.selected_backend == "clifford_stabilizer"
    assert res.simulation.counts is not None

def test_1000_qubit_statevector_rejection_clean_error():
    service = CircuitRunService()
    circuit = CircuitRequest(
        qubits=1000,
        classical_bits=1000,
        gates=[],
        measure=False,
    )
    req = CircuitRunRequest(
        circuit=circuit,
        backend="auto",
        mode="statevector",
        include=CircuitRunInclude(metrics=False, bloch=False, timeline=False)
    )
    with pytest.raises(ValueError, match="exceeds maximum statevector safety limit"):
        service.run_circuit_workflow(req)

import pytest
from app.optimization.service import optimization_service
from app.schemas.circuit import CircuitRequest, GateRequest

def test_optimization_service_hh_cancellation():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="h", targets=[0])
        ],
        measure=False
    )
    res = optimization_service.optimize_circuit(circuit)

    assert res.changed is True
    assert res.correctness_verified is True
    assert len(res.optimized_circuit.gates) == 0
    assert res.improvements.gate_count_reduction == 2
    assert res.improvements.gate_count_reduction_percent == 100.0
    assert len(res.explanation) > 0
    assert "Cancelled adjacent self-inverse H" in res.explanation[0]

def test_optimization_service_no_change():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=False
    )
    res = optimization_service.optimize_circuit(circuit)

    assert res.changed is False
    assert res.correctness_verified is True
    assert len(res.optimized_circuit.gates) == 1
    assert res.improvements.gate_count_reduction == 0
    assert res.improvements.gate_count_reduction_percent == 0.0

def test_optimization_service_input_immutability():
    gates = [
        GateRequest(gate="x", targets=[0]),
        GateRequest(gate="x", targets=[0])
    ]
    circuit = CircuitRequest(qubits=1, classical_bits=0, gates=gates, measure=False)
    res = optimization_service.optimize_circuit(circuit)

    # Original circuit must remain unchanged
    assert len(circuit.gates) == 2
    assert len(res.original_circuit.gates) == 2
    assert len(res.optimized_circuit.gates) == 0

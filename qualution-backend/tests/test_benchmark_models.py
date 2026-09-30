import pytest
from app.benchmark.models import BenchmarkResult
from app.benchmark.runner import compute_circuit_signature
from app.schemas.circuit import CircuitRequest, GateRequest

def test_circuit_signature_determinism():
    c1 = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=True,
        shots=1024
    )
    c2 = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=True,
        shots=1024
    )
    sig1 = compute_circuit_signature(c1)
    sig2 = compute_circuit_signature(c2)
    assert sig1 == sig2
    assert len(sig1) == 16

def test_different_circuits_different_signatures():
    c1 = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=True
    )
    c2 = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[GateRequest(gate="x", targets=[0])],
        measure=True
    )
    assert compute_circuit_signature(c1) != compute_circuit_signature(c2)

def test_benchmark_result_model():
    result = BenchmarkResult(
        backend="qiskit_aer",
        framework="qiskit",
        circuit_signature="abc1234567890def",
        qubits=2,
        gate_count=2,
        depth=2,
        two_qubit_gate_count=1,
        execution_mode="shots",
        shots=1000,
        median_time_ms=1.5,
        min_time_ms=1.2,
        max_time_ms=1.8,
        warmup_runs=1,
        measured_runs=3,
        success=True,
        error=None,
        memory_estimate_bytes=64
    )
    assert result.median_time_ms == 1.5
    assert result.success is True

import pytest
from app.benchmark.models import BenchmarkResult
from app.benchmark.runner import compute_circuit_signature
from app.benchmark.service import benchmark_service
from app.routing.policy import routing_policy
from app.schemas.circuit import CircuitRequest, GateRequest

def test_routing_policy_fallback_when_no_cache():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=True
    )
    # Ensure cache has no timing for a unique shot configuration
    circuit_unique = circuit.model_copy(update={"shots": 98765})
    selected, reason, candidates = routing_policy.evaluate_candidates(circuit_unique, mode="shots")
    
    assert selected == "qiskit_aer"
    assert reason.policy == "safe_default_fallback"
    assert "Selected default backend" in reason.explanation
    assert len(candidates) == 4

def test_routing_policy_selects_faster_qiskit():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=True,
        shots=54321
    )
    sig = compute_circuit_signature(circuit)

    # Inject mock benchmark timings: Qiskit = 1.0 ms, PennyLane = 3.0 ms
    benchmark_service.cache_result(BenchmarkResult(
        backend="qiskit_aer", framework="qiskit", circuit_signature=sig, qubits=2,
        gate_count=1, depth=1, two_qubit_gate_count=0, execution_mode="shots", shots=54321,
        median_time_ms=1.0, min_time_ms=0.9, max_time_ms=1.1, warmup_runs=1, measured_runs=3,
        success=True, error=None, memory_estimate_bytes=64
    ))
    benchmark_service.cache_result(BenchmarkResult(
        backend="pennylane", framework="pennylane", circuit_signature=sig, qubits=2,
        gate_count=1, depth=1, two_qubit_gate_count=0, execution_mode="shots", shots=54321,
        median_time_ms=3.0, min_time_ms=2.8, max_time_ms=3.2, warmup_runs=1, measured_runs=3,
        success=True, error=None, memory_estimate_bytes=64
    ))

    selected, reason, candidates = routing_policy.evaluate_candidates(circuit, mode="shots")
    assert selected == "qiskit_aer"
    assert reason.policy == "lowest_measured_latency"
    assert "1.00 ms" in reason.explanation

def test_routing_policy_selects_faster_pennylane():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=True,
        shots=12345
    )
    sig = compute_circuit_signature(circuit)

    # Inject mock benchmark timings: PennyLane = 0.5 ms, Qiskit = 2.5 ms
    benchmark_service.cache_result(BenchmarkResult(
        backend="qiskit_aer", framework="qiskit", circuit_signature=sig, qubits=2,
        gate_count=1, depth=1, two_qubit_gate_count=0, execution_mode="shots", shots=12345,
        median_time_ms=2.5, min_time_ms=2.4, max_time_ms=2.6, warmup_runs=1, measured_runs=3,
        success=True, error=None, memory_estimate_bytes=64
    ))
    benchmark_service.cache_result(BenchmarkResult(
        backend="pennylane", framework="pennylane", circuit_signature=sig, qubits=2,
        gate_count=1, depth=1, two_qubit_gate_count=0, execution_mode="shots", shots=12345,
        median_time_ms=0.5, min_time_ms=0.4, max_time_ms=0.6, warmup_runs=1, measured_runs=3,
        success=True, error=None, memory_estimate_bytes=64
    ))

    selected, reason, candidates = routing_policy.evaluate_candidates(circuit, mode="shots")
    assert selected == "pennylane"
    assert reason.policy == "lowest_measured_latency"
    assert "0.50 ms" in reason.explanation

def test_routing_policy_selects_faster_cirq():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=True,
        shots=11223
    )
    sig = compute_circuit_signature(circuit)

    benchmark_service.cache_result(BenchmarkResult(
        backend="qiskit_aer", framework="qiskit", circuit_signature=sig, qubits=2,
        gate_count=1, depth=1, two_qubit_gate_count=0, execution_mode="shots", shots=11223,
        median_time_ms=2.5, min_time_ms=2.4, max_time_ms=2.6, warmup_runs=1, measured_runs=3,
        success=True, error=None, memory_estimate_bytes=64
    ))
    benchmark_service.cache_result(BenchmarkResult(
        backend="cirq", framework="cirq", circuit_signature=sig, qubits=2,
        gate_count=1, depth=1, two_qubit_gate_count=0, execution_mode="shots", shots=11223,
        median_time_ms=0.3, min_time_ms=0.2, max_time_ms=0.4, warmup_runs=1, measured_runs=3,
        success=True, error=None, memory_estimate_bytes=64
    ))

    selected, reason, candidates = routing_policy.evaluate_candidates(circuit, mode="shots")
    assert selected == "cirq"
    assert reason.policy == "lowest_measured_latency"
    assert "0.30 ms" in reason.explanation

def test_routing_policy_ineligible_for_statevector_qubit_limit():
    circuit = CircuitRequest(
        qubits=20,
        classical_bits=0,
        gates=[],
        measure=False
    )
    with pytest.raises(ValueError) as exc:
        routing_policy.evaluate_candidates(circuit, mode="statevector")
    assert "No eligible quantum backend available" in str(exc.value)

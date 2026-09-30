import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.benchmark.models import BenchmarkRequest
from app.benchmark.service import benchmark_service
from app.benchmark.runner import compute_circuit_signature
from app.schemas.circuit import CircuitRequest, GateRequest

client = TestClient(app)

def test_benchmark_service_execution_and_caching():
    circuit = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1])
        ],
        measure=True,
        shots=1000
    )
    req = BenchmarkRequest(
        circuit=circuit,
        execution_mode="shots",
        warmup_runs=1,
        measured_runs=3
    )

    resp = benchmark_service.benchmark_circuit(req)
    assert len(resp.results) == 3
    assert resp.qubits == 2
    assert resp.gate_count == 2

    for res in resp.results:
        assert res.success is True
        assert res.median_time_ms > 0
        assert res.min_time_ms <= res.median_time_ms <= res.max_time_ms

    # Verify cache
    sig = compute_circuit_signature(circuit)
    cached_qiskit = benchmark_service.get_cached_result(sig, "shots", "qiskit_aer")
    assert cached_qiskit is not None
    assert cached_qiskit.backend == "qiskit_aer"

    cached_pl = benchmark_service.get_cached_result(sig, "shots", "pennylane")
    assert cached_pl is not None
    assert cached_pl.backend == "pennylane"

    cached_cirq = benchmark_service.get_cached_result(sig, "shots", "cirq")
    assert cached_cirq is not None
    assert cached_cirq.backend == "cirq"

def test_benchmark_modes_distinguished():
    circuit = CircuitRequest(
        qubits=1,
        classical_bits=0,
        gates=[GateRequest(gate="h", targets=[0])],
        measure=False
    )
    req_sv = BenchmarkRequest(
        circuit=circuit,
        execution_mode="statevector",
        warmup_runs=0,
        measured_runs=2
    )
    resp = benchmark_service.benchmark_circuit(req_sv)
    assert resp.execution_mode == "statevector"
    for r in resp.results:
        assert r.execution_mode == "statevector"
        assert r.success is True

def test_api_benchmarks_run_endpoint():
    payload = {
        "circuit": {
            "qubits": 1,
            "classical_bits": 1,
            "gates": [{"gate": "x", "targets": [0]}],
            "measure": True,
            "shots": 100
        },
        "execution_mode": "shots",
        "warmup_runs": 1,
        "measured_runs": 2
    }
    response = client.post("/api/v1/benchmarks/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "circuit_signature" in data
    assert len(data["results"]) == 3

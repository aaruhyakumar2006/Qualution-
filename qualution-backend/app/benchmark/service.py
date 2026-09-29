from typing import Dict, List, Optional, Tuple
from app.backends.registry import backend_registry
from app.benchmark.models import (
    BenchmarkRequest,
    BenchmarkResult,
    BenchmarkComparisonResponse,
    ExecutionMode,
)
from app.benchmark.runner import benchmark_runner, compute_circuit_signature
from app.schemas.circuit import CircuitRequest
from app.services.circuit_metrics_service import circuit_metrics_service

class BenchmarkService:
    def __init__(self):
        # In-memory benchmark cache: (circuit_signature, execution_mode, backend_name) -> BenchmarkResult
        self._cache: Dict[Tuple[str, str, str], BenchmarkResult] = {}

    def get_cached_result(
        self, signature: str, mode: ExecutionMode, backend_name: str
    ) -> Optional[BenchmarkResult]:
        key = (signature, mode, backend_name.lower())
        return self._cache.get(key)

    def cache_result(self, result: BenchmarkResult):
        key = (result.circuit_signature, result.execution_mode, result.backend.lower())
        self._cache[key] = result

    def benchmark_circuit(self, request: BenchmarkRequest) -> BenchmarkComparisonResponse:
        """
        Run multi-backend benchmark comparison for a given circuit and execution mode.
        """
        circuit = request.circuit
        sig = compute_circuit_signature(circuit)
        metrics = circuit_metrics_service.analyze_circuit(circuit)

        # Determine target backends
        if request.backends:
            target_backends = [backend_registry.get(b) for b in request.backends]
        else:
            target_backends = [
                backend_registry.get(meta.name)
                for meta in backend_registry.list_backends()
                if meta.available and meta.provider == "local"
            ]

        results: List[BenchmarkResult] = []
        for backend in target_backends:
            res = benchmark_runner.run_benchmark(
                backend=backend,
                circuit=circuit,
                mode=request.execution_mode,
                warmup_runs=request.warmup_runs,
                measured_runs=request.measured_runs
            )
            self.cache_result(res)
            results.append(res)

        return BenchmarkComparisonResponse(
            circuit_signature=sig,
            execution_mode=request.execution_mode,
            qubits=circuit.qubits,
            gate_count=metrics["gate_count"],
            depth=metrics["depth"],
            results=results
        )

benchmark_service = BenchmarkService()

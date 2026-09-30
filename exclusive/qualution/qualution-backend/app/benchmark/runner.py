import hashlib
import json
import statistics
import time
from typing import List, Optional
import numpy as np

from app.backends.base import QuantumBackend
from app.benchmark.models import BenchmarkResult, ExecutionMode
from app.schemas.circuit import CircuitRequest
from app.schemas.simulation import SimulationResponse
from app.schemas.result import StatevectorResponse
from app.services.circuit_metrics_service import circuit_metrics_service

def compute_circuit_signature(circuit: CircuitRequest) -> str:
    """
    Compute a deterministic canonical hash string representing the circuit structure.
    """
    canonical_gates = [
        {
            "gate": g.gate.lower(),
            "targets": g.targets,
            "angle": round(g.angle, 8) if g.angle is not None else None
        }
        for g in circuit.gates
    ]
    raw_dict = {
        "qubits": circuit.qubits,
        "classical_bits": circuit.classical_bits,
        "gates": canonical_gates,
        "measure": circuit.measure,
        "shots": circuit.shots
    }
    dumped = json.dumps(raw_dict, sort_keys=True)
    return hashlib.sha256(dumped.encode("utf-8")).hexdigest()[:16]

class BenchmarkRunner:
    @staticmethod
    def run_benchmark(
        backend: QuantumBackend,
        circuit: CircuitRequest,
        mode: ExecutionMode,
        warmup_runs: int = 1,
        measured_runs: int = 3
    ) -> BenchmarkResult:
        """
        Execute benchmark runs on a backend with warmup and high-resolution timing.
        """
        meta = backend.get_metadata()
        sig = compute_circuit_signature(circuit)
        metrics = circuit_metrics_service.analyze_circuit(circuit)

        # Check availability
        if not meta.available:
            return BenchmarkResult(
                backend=meta.name,
                framework=meta.framework,
                circuit_signature=sig,
                qubits=circuit.qubits,
                gate_count=metrics["gate_count"],
                depth=metrics["depth"],
                two_qubit_gate_count=metrics["two_qubit_gate_count"],
                execution_mode=mode,
                shots=circuit.shots,
                median_time_ms=0.0,
                min_time_ms=0.0,
                max_time_ms=0.0,
                warmup_runs=warmup_runs,
                measured_runs=measured_runs,
                success=False,
                error=f"Backend '{meta.name}' is unavailable (status: {meta.status})",
                memory_estimate_bytes=metrics["statevector_memory_bytes"]
            )

        # Check capabilities
        if mode == "shots" and not meta.capabilities.shot_simulation:
            return BenchmarkResult(
                backend=meta.name,
                framework=meta.framework,
                circuit_signature=sig,
                qubits=circuit.qubits,
                gate_count=metrics["gate_count"],
                depth=metrics["depth"],
                two_qubit_gate_count=metrics["two_qubit_gate_count"],
                execution_mode=mode,
                shots=circuit.shots,
                median_time_ms=0.0,
                min_time_ms=0.0,
                max_time_ms=0.0,
                warmup_runs=warmup_runs,
                measured_runs=measured_runs,
                success=False,
                error=f"Backend '{meta.name}' does not support shot simulation",
                memory_estimate_bytes=metrics["statevector_memory_bytes"]
            )

        if mode == "statevector" and not meta.capabilities.statevector:
            return BenchmarkResult(
                backend=meta.name,
                framework=meta.framework,
                circuit_signature=sig,
                qubits=circuit.qubits,
                gate_count=metrics["gate_count"],
                depth=metrics["depth"],
                two_qubit_gate_count=metrics["two_qubit_gate_count"],
                execution_mode=mode,
                shots=circuit.shots,
                median_time_ms=0.0,
                min_time_ms=0.0,
                max_time_ms=0.0,
                warmup_runs=warmup_runs,
                measured_runs=measured_runs,
                success=False,
                error=f"Backend '{meta.name}' does not support statevector simulation",
                memory_estimate_bytes=metrics["statevector_memory_bytes"]
            )

        # Warmup executions (discarded)
        for _ in range(warmup_runs):
            try:
                if mode == "shots":
                    backend.simulate(circuit)
                else:
                    backend.statevector(circuit)
            except Exception as e:
                return BenchmarkResult(
                    backend=meta.name,
                    framework=meta.framework,
                    circuit_signature=sig,
                    qubits=circuit.qubits,
                    gate_count=metrics["gate_count"],
                    depth=metrics["depth"],
                    two_qubit_gate_count=metrics["two_qubit_gate_count"],
                    execution_mode=mode,
                    shots=circuit.shots,
                    median_time_ms=0.0,
                    min_time_ms=0.0,
                    max_time_ms=0.0,
                    warmup_runs=warmup_runs,
                    measured_runs=measured_runs,
                    success=False,
                    error=f"Warmup failed: {str(e)}",
                    memory_estimate_bytes=metrics["statevector_memory_bytes"]
                )

        # Measured executions
        latencies_ms: List[float] = []
        last_result = None
        for _ in range(measured_runs):
            t0 = time.perf_counter()
            try:
                if mode == "shots":
                    last_result = backend.simulate(circuit)
                else:
                    last_result = backend.statevector(circuit)
                t1 = time.perf_counter()
                latencies_ms.append((t1 - t0) * 1000.0)
            except Exception as e:
                return BenchmarkResult(
                    backend=meta.name,
                    framework=meta.framework,
                    circuit_signature=sig,
                    qubits=circuit.qubits,
                    gate_count=metrics["gate_count"],
                    depth=metrics["depth"],
                    two_qubit_gate_count=metrics["two_qubit_gate_count"],
                    execution_mode=mode,
                    shots=circuit.shots,
                    median_time_ms=0.0,
                    min_time_ms=0.0,
                    max_time_ms=0.0,
                    warmup_runs=warmup_runs,
                    measured_runs=measured_runs,
                    success=False,
                    error=f"Execution error: {str(e)}",
                    memory_estimate_bytes=metrics["statevector_memory_bytes"]
                )

        # Correctness validation on the final result
        is_correct = True
        error_msg: Optional[str] = None

        if mode == "shots" and isinstance(last_result, SimulationResponse):
            total_counts = sum(last_result.counts.values())
            if total_counts != circuit.shots:
                is_correct = False
                error_msg = f"Shot conservation failure: expected {circuit.shots}, got {total_counts}"
            total_prob = sum(last_result.probabilities.values())
            if not np.isclose(total_prob, 1.0, atol=1e-3):
                is_correct = False
                error_msg = f"Probability normalization failure: sum is {total_prob}"
        elif mode == "statevector" and isinstance(last_result, StatevectorResponse):
            total_prob = sum(last_result.probabilities.values())
            if not np.isclose(total_prob, 1.0, atol=1e-3):
                is_correct = False
                error_msg = f"Statevector normalization failure: sum is {total_prob}"

        median_time = statistics.median(latencies_ms)
        min_time = min(latencies_ms)
        max_time = max(latencies_ms)

        return BenchmarkResult(
            backend=meta.name,
            framework=meta.framework,
            circuit_signature=sig,
            qubits=circuit.qubits,
            gate_count=metrics["gate_count"],
            depth=metrics["depth"],
            two_qubit_gate_count=metrics["two_qubit_gate_count"],
            execution_mode=mode,
            shots=circuit.shots,
            median_time_ms=round(median_time, 3),
            min_time_ms=round(min_time, 3),
            max_time_ms=round(max_time, 3),
            warmup_runs=warmup_runs,
            measured_runs=measured_runs,
            success=is_correct,
            error=error_msg,
            memory_estimate_bytes=metrics["statevector_memory_bytes"]
        )

benchmark_runner = BenchmarkRunner()

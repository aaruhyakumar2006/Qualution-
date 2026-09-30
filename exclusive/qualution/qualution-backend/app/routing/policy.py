from typing import List, Tuple, Optional
from app.backends.registry import backend_registry
from app.benchmark.models import ExecutionMode
from app.benchmark.runner import compute_circuit_signature
from app.benchmark.service import benchmark_service
from app.routing.models import CandidateBackend, RoutingReason
from app.schemas.circuit import CircuitRequest
from app.core.config import settings

class RoutingPolicy:
    DEFAULT_BACKEND = "qiskit_aer"

    def evaluate_candidates(
        self, circuit: CircuitRequest, mode: ExecutionMode
    ) -> Tuple[str, RoutingReason, List[CandidateBackend]]:
        """
        Evaluate candidate backends using deterministic eligibility rules and benchmark latency data.
        """
        sig = compute_circuit_signature(circuit)
        candidates: List[CandidateBackend] = []
        eligible_candidates: List[CandidateBackend] = []

        all_metadata = backend_registry.list_backends()

        for meta in all_metadata:
            eligible = True
            reason = None

            # 0. Availability check
            if not meta.available:
                eligible = False
                if meta.status == "NOT_CONFIGURED":
                    reason = "Backend is not configured with required API credentials"
                else:
                    reason = f"Backend status is {meta.status}"
            # 1. Capability check
            elif mode == "shots" and not meta.capabilities.shot_simulation:
                eligible = False
                reason = "Does not support shot-based simulation"
            elif mode == "statevector" and not meta.capabilities.statevector:
                eligible = False
                reason = "Does not support statevector simulation"

            # 2. Qubit limit check — hard ceiling prevents 2^N statevector OOM crash.
            safe_sv_limit = min(settings.MAX_STATEVECTOR_QUBITS, 20)
            if mode == "statevector" and circuit.qubits > safe_sv_limit:
                eligible = False
                reason = f"Circuit ({circuit.qubits} qubits) exceeds statevector safety limit ({safe_sv_limit} qubits)"

            # 3. Check benchmark cache
            cached_bm = benchmark_service.get_cached_result(sig, mode, meta.name)
            median_time_ms = cached_bm.median_time_ms if (cached_bm and cached_bm.success) else None
            is_cached = cached_bm is not None and cached_bm.success

            cand = CandidateBackend(
                backend=meta.name,
                framework=meta.framework,
                eligible=eligible,
                reason=reason,
                median_execution_time_ms=median_time_ms,
                is_cached_measurement=is_cached
            )
            candidates.append(cand)
            if eligible:
                eligible_candidates.append(cand)

        if not eligible_candidates:
            raise ValueError(f"No eligible quantum backend available to execute this {mode} request.")

        # 4. Selection policy
        candidates_with_timing = [c for c in eligible_candidates if c.median_execution_time_ms is not None]

        if candidates_with_timing:
            # Pick lowest measured median execution time
            best_candidate = min(candidates_with_timing, key=lambda c: c.median_execution_time_ms) # type: ignore
            selected_backend = best_candidate.backend
            routing_reason = RoutingReason(
                policy="lowest_measured_latency",
                explanation=(
                    f"Selected '{selected_backend}' with lowest measured latency of "
                    f"{best_candidate.median_execution_time_ms:.2f} ms for this circuit profile."
                )
            )
        else:
            # Fallback to safe default
            selected_backend = (
                self.DEFAULT_BACKEND
                if any(c.backend == self.DEFAULT_BACKEND and c.eligible for c in eligible_candidates)
                else eligible_candidates[0].backend
            )
            routing_reason = RoutingReason(
                policy="safe_default_fallback",
                explanation=(
                    f"Selected default backend '{selected_backend}' (no prior benchmark latency data cached for this circuit signature)."
                )
            )

        return selected_backend, routing_reason, candidates

routing_policy = RoutingPolicy()

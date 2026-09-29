import time
from typing import List
from app.schemas.circuit import CircuitRequest
from app.schemas.metrics import CircuitMetricsResponse
from app.optimization.models import OptimizationResponse, OptimizationImprovements
from app.optimization.engine import optimization_engine
from app.optimization.verifier import correctness_verifier
from app.services.circuit_metrics_service import circuit_metrics_service
from app.core.config import settings

class OptimizationService:
    def optimize_circuit(self, circuit: CircuitRequest) -> OptimizationResponse:
        """
        Run optimization passes, formally verify mathematical equivalence,
        and calculate quantified before/after improvements.
        """
        start_time = time.perf_counter()

        # 1. Analyze original metrics
        orig_dict = circuit_metrics_service.analyze_circuit(circuit)
        orig_metrics = CircuitMetricsResponse(**orig_dict)

        # 2. Run deterministic rewrite passes
        new_gates, changed, passes_applied, explanations = optimization_engine.optimize_gates(
            circuit.gates, max_iterations=settings.MAX_OPTIMIZATION_ITERATIONS
        )

        optimized_circuit = circuit.model_copy(update={"gates": new_gates})
        correctness_verified = False

        if changed:
            # 3. Formal equivalence verification
            try:
                is_valid = correctness_verifier.verify_equivalence(circuit, optimized_circuit)
            except Exception as e:
                is_valid = False
                explanations.append(f"Verification error: {str(e)}")

            if is_valid:
                correctness_verified = True
            else:
                # Reject optimization if mathematical equivalence fails
                changed = False
                correctness_verified = False
                optimized_circuit = circuit.model_copy()
                passes_applied = []
                explanations = ["Optimization rejected: generated circuit failed mathematical equivalence verification."]
        else:
            correctness_verified = True
            if not explanations:
                explanations = [
                    "Circuit is already optimal under current rewrite rules: "
                    "No self-inverse cancellations (H-H, X-X, CX-CX), mergeable rotation angles, "
                    "or zero-angle identity gates were detected. Circuit is at its minimal verified depth."
                ]

        # 4. Analyze optimized metrics
        opt_dict = circuit_metrics_service.analyze_circuit(optimized_circuit)
        opt_metrics = CircuitMetricsResponse(**opt_dict)

        # 5. Calculate quantified improvements
        gate_reduction = orig_metrics.gate_count - opt_metrics.gate_count
        gate_pct = round((gate_reduction / orig_metrics.gate_count) * 100.0, 2) if orig_metrics.gate_count > 0 else 0.0

        depth_reduction = orig_metrics.depth - opt_metrics.depth
        depth_pct = round((depth_reduction / orig_metrics.depth) * 100.0, 2) if orig_metrics.depth > 0 else 0.0

        two_q_reduction = orig_metrics.two_qubit_gate_count - opt_metrics.two_qubit_gate_count
        two_q_pct = (
            round((two_q_reduction / orig_metrics.two_qubit_gate_count) * 100.0, 2)
            if orig_metrics.two_qubit_gate_count > 0
            else 0.0
        )

        improvements = OptimizationImprovements(
            gate_count_reduction=gate_reduction,
            gate_count_reduction_percent=gate_pct,
            depth_reduction=depth_reduction,
            depth_reduction_percent=depth_pct,
            two_qubit_gate_reduction=two_q_reduction,
            two_qubit_gate_reduction_percent=two_q_pct,
        )

        end_time = time.perf_counter()
        execution_time_ms = round((end_time - start_time) * 1000, 2)

        return OptimizationResponse(
            original_circuit=circuit,
            optimized_circuit=optimized_circuit,
            changed=changed,
            correctness_verified=correctness_verified,
            optimization_passes_applied=passes_applied,
            original_metrics=orig_metrics,
            optimized_metrics=opt_metrics,
            improvements=improvements,
            explanation=explanations,
            execution_time_ms=execution_time_ms,
        )

optimization_service = OptimizationService()

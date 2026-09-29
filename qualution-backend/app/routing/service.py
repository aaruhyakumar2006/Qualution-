from app.backends.registry import backend_registry
from app.benchmark.models import ExecutionMode
from app.routing.models import AutoRoutingResponse
from app.routing.policy import routing_policy
from app.schemas.circuit import CircuitRequest
from app.schemas.metrics import CircuitMetricsResponse
from app.services.circuit_metrics_service import circuit_metrics_service

class RoutingService:
    def auto_simulate(self, circuit: CircuitRequest, mode: ExecutionMode = "shots") -> AutoRoutingResponse:
        """
        Analyze circuit, evaluate candidates using routing policy, execute on selected backend,
        and provide educational routing explanation.
        """
        # 1. Structural and resource metrics
        metrics_dict = circuit_metrics_service.analyze_circuit(circuit)
        metrics_resp = CircuitMetricsResponse(**metrics_dict)

        # 2. Select backend via policy
        selected_backend_name, routing_reason, candidates = routing_policy.evaluate_candidates(
            circuit=circuit, mode=mode
        )

        # 3. Execute circuit on chosen backend
        backend = backend_registry.get(selected_backend_name)
        if mode == "shots":
            result = backend.simulate(circuit)
        else:
            result = backend.statevector(circuit)

        return AutoRoutingResponse(
            selected_backend=selected_backend_name,
            routing_reason=routing_reason,
            candidates=candidates,
            metrics=metrics_resp,
            result=result
        )

routing_service = RoutingService()

import time
from typing import Optional
from app.backends.registry import backend_registry
from app.routing.policy import routing_policy
from app.services.circuit_metrics_service import circuit_metrics_service
from app.services.timeline_service import timeline_service
from app.services.statevector_service import statevector_service
from app.services.qiskit_service import to_qiskit_circuit
from app.schemas.circuit_run import (
    CircuitRunRequest,
    CircuitRunResponse,
    CircuitRunCircuitSummary,
    CircuitRunRoutingSummary,
    CircuitRunSimulationResult,
    CircuitRunVisualization,
)
from app.schemas.metrics import CircuitMetricsResponse
from app.schemas.timeline import TimelineResponse
from app.core.config import settings

class CircuitRunService:
    def run_circuit_workflow(self, request: CircuitRunRequest) -> CircuitRunResponse:
        """
        Orchestrate complete unified circuit workflow:
        Metrics -> Routing -> Simulation -> Visualization -> Educational Summary.
        """
        start_total = time.perf_counter()
        circuit = request.circuit
        mode = request.mode
        requested_backend_name = request.backend.lower()

        # 1. Validation of execution constraints
        if mode == "shots" and not circuit.measure:
            raise ValueError("Shot-based simulation requires 'measure=true' on the circuit.")

        # Hard guard: statevector of 2^N amplitudes crashes beyond ~16 qubits (GBs of RAM).
        # Clifford circuits can use stabilizer in shots mode; statevector is never safe at scale.
        if mode == "statevector" and circuit.qubits > settings.MAX_STATEVECTOR_QUBITS:
            CLIFFORD_GATES_SET = {"h", "x", "y", "z", "s", "sdg", "s_dagger", "sdag", "cx", "cz", "swap", "id", "i", "measure", "barrier", "reset"}
            is_clifford_sv = all(g.gate.lower() in CLIFFORD_GATES_SET for g in circuit.gates) if circuit.gates else True
            if is_clifford_sv:
                raise ValueError(
                    f"Circuit ({circuit.qubits} qubits) exceeds maximum statevector safety limit "
                    f"({settings.MAX_STATEVECTOR_QUBITS} qubits). It is Clifford-compatible and can run via 'shots' mode "
                    f"with the Stabilizer backend (Aaronson-Gottesman tableau, <1 MB, polynomial time) without memory limits."
                )
            else:
                raise ValueError(
                    f"Circuit ({circuit.qubits} qubits) exceeds maximum statevector safety limit "
                    f"({settings.MAX_STATEVECTOR_QUBITS} qubits). Statevector simulation requires exponential RAM. "
                    f"Reduce qubit count or use shots mode."
                )

        # 2. Backend Selection & Routing (Intelligent Auto-Routing) - FAST PATH
        # Compute routing decision FIRST to minimize latency
        if requested_backend_name == "auto":
            CLIFFORD_GATES = {"h", "x", "y", "z", "s", "sdg", "s_dagger", "sdag", "cx", "cz", "swap", "id", "i", "measure", "barrier", "reset"}
            # Empty circuit (no gates) is trivially Clifford — all states are stabilizer states.
            is_clifford = all(g.gate.lower() in CLIFFORD_GATES for g in circuit.gates) if circuit.gates else True

            # Fast entanglement estimation without full metrics computation
            two_qubit_gate_ratio = 0.0
            entanglement_level = "none"
            if circuit.gates:
                two_qubit_count = sum(1 for g in circuit.gates if g.gate.lower() in {"cx", "cz", "swap", "cp", "crx", "cry", "crz", "ch"})
                total_gates = len(circuit.gates)
                two_qubit_gate_ratio = two_qubit_count / total_gates if total_gates > 0 else 0.0

                if two_qubit_count == 0:
                    entanglement_level = "none"
                elif two_qubit_gate_ratio < 0.3:
                    entanglement_level = "low"
                elif two_qubit_gate_ratio < 0.6:
                    entanglement_level = "moderate"
                else:
                    entanglement_level = "high"

            # PRIORITY 1: Clifford circuits → Stabilizer (qubits > 2, polynomial time)
            if mode == "shots" and is_clifford and circuit.qubits > 2:
                selected_backend_name = "clifford_stabilizer"
                policy = "clifford_stabilizer_optimal"
                gate_desc = f"{len(circuit.gates)} operations" if circuit.gates else "no gates (identity circuit)"
                reason = (
                    f"Clifford circuit detected ({gate_desc}) on {circuit.qubits} qubits. "
                    f"Routed to Gottesman-Knill stabilizer (<1 MB RAM, O(N²) polynomial time) supporting 1000+ qubits."
                )
            # PRIORITY 2: Low entanglement + large circuit → MPS
            elif mode == "shots" and entanglement_level in ("none", "low") and circuit.qubits > 16:
                selected_backend_name = "qiskit_aer_mps"
                policy = "mps_low_entanglement"
                reason = (
                    f"Low entanglement circuit ({two_qubit_gate_ratio:.1%} two-qubit gate ratio) on {circuit.qubits} qubits. "
                    f"Routed to Matrix Product State (MPS) for efficient simulation with bond dimension truncation."
                )
            # PRIORITY 3: High entanglement + large circuit → qBraid cloud (if available)
            elif mode == "shots" and entanglement_level == "high" and circuit.qubits > 20:
                # Try qBraid first, fallback to MPS if unavailable
                qbraid_available = backend_registry.get("qbraid").get_metadata().available if backend_registry.has("qbraid") else False
                if qbraid_available:
                    selected_backend_name = "qbraid"
                    policy = "qbraid_high_entanglement"
                    reason = (
                        f"High entanglement circuit ({two_qubit_gate_ratio:.1%} two-qubit ratio) on {circuit.qubits} qubits. "
                        f"Routed to qBraid cloud for large-scale quantum simulation."
                    )
                else:
                    selected_backend_name = "qiskit_aer_mps"
                    policy = "mps_high_entanglement_fallback"
                    reason = (
                        f"High entanglement circuit on {circuit.qubits} qubits. qBraid cloud unavailable, using MPS fallback."
                    )
            # PRIORITY 4: Standard routing for small/medium circuits
            else:
                selected_backend_name, routing_reason, _ = routing_policy.evaluate_candidates(
                    circuit=circuit, mode=mode
                )
                policy = routing_reason.policy
                reason = routing_reason.explanation
        else:
            # Direct backend selection
            selected_backend_name = requested_backend_name
            policy = "direct_selection"
            reason = f"Executed directly on explicitly requested backend '{selected_backend_name}'."

        backend = backend_registry.get(selected_backend_name)
        backend_meta = backend.get_metadata()

        # 3. Structural & Resource Metrics (computed AFTER routing to avoid blocking fast path)
        metrics_resp: Optional[CircuitMetricsResponse] = None
        if request.include.metrics:
            try:
                metrics_dict = circuit_metrics_service.analyze_circuit(circuit)
                metrics_resp = CircuitMetricsResponse(**metrics_dict)
            except Exception:
                pass

        # 4. Simulation Execution & Capability Verification
        if mode == "statevector" and not backend_meta.capabilities.statevector:
            raise ValueError(
                f"Backend '{selected_backend_name}' does not support statevector simulation. "
                "Please select 'qiskit_aer', 'pennylane', or 'cirq' for statevector analysis."
            )
        if mode == "shots" and not backend_meta.capabilities.shots:
            raise ValueError(
                f"Backend '{selected_backend_name}' does not support shot-based simulation."
            )

        if mode == "shots":
            sim_circuit = circuit
            if not sim_circuit.measure:
                sim_circuit = sim_circuit.model_copy(update={
                    "measure": True,
                    "classical_bits": max(sim_circuit.classical_bits, sim_circuit.qubits)
                })
            sim_res = backend.simulate(sim_circuit)
            sim_result = CircuitRunSimulationResult(
                backend=selected_backend_name,
                mode=mode,
                shots=circuit.shots,
                counts=sim_res.counts,
                probabilities=sim_res.probabilities,
                statevector=None,
                execution_time_ms=sim_res.execution_time_ms
            )
        else:  # statevector mode
            sv_res = backend.statevector(circuit)
            sim_result = CircuitRunSimulationResult(
                backend=selected_backend_name,
                mode=mode,
                shots=circuit.shots,
                counts=None,
                probabilities=sv_res.probabilities,
                statevector=sv_res.statevector,
                execution_time_ms=sv_res.execution_time_ms
            )

        # 5. Visualizations (Bloch & Timeline)
        bloch_vector = None
        bloch_qubits = None
        # Bloch vector requires a full statevector per qubit partial_trace — O(N × 2^N) cost.
        # Hard cap at 8 qubits to match Q-sphere display limit and prevent server lag.
        # Skip entirely for stabilizer backend (no dense statevector available).
        bloch_safe = (
            request.include.bloch
            and circuit.qubits <= 8
            and selected_backend_name != "clifford_stabilizer"
        )
        if bloch_safe:
            try:
                qc_no_meas = to_qiskit_circuit(circuit.model_copy(update={"measure": False}))
                sv_data = statevector_service.simulate_statevector(qc_no_meas)
                bloch_vector = sv_data.get("bloch")
                bloch_qubits = sv_data.get("bloch_qubits")
            except Exception:
                pass

        timeline_data: Optional[TimelineResponse] = None
        timeline_notice: Optional[str] = None
        if request.include.timeline:
            if (
                circuit.qubits <= settings.MAX_TIMELINE_QUBITS
                and len(circuit.gates) <= settings.MAX_TIMELINE_STEPS
            ):
                try:
                    timeline_dict = timeline_service.generate_timeline(circuit)
                    timeline_data = TimelineResponse(**timeline_dict)
                except Exception as e:
                    timeline_notice = f"Timeline visualization unavailable: {str(e)}"
            else:
                timeline_notice = (
                    f"Timeline visualization omitted: circuit exceeds safety thresholds "
                    f"({circuit.qubits} qubits, {len(circuit.gates)} operations)."
                )

        visualization = CircuitRunVisualization(
            bloch=bloch_vector,
            bloch_qubits=bloch_qubits,
            timeline=timeline_data,
            timeline_notice=timeline_notice
        )

        circuit_summary = CircuitRunCircuitSummary(
            qubits=circuit.qubits,
            classical_bits=circuit.classical_bits,
            gate_count=len(circuit.gates),
            measure=circuit.measure,
            shots=circuit.shots
        )

        routing_summary = CircuitRunRoutingSummary(
            requested_backend=requested_backend_name,
            selected_backend=selected_backend_name,
            framework=backend_meta.framework,
            policy=policy,
            reason=reason
        )

        end_total = time.perf_counter()
        total_time_ms = round((end_total - start_total) * 1000, 2)

        return CircuitRunResponse(
            circuit=circuit_summary,
            routing=routing_summary,
            metrics=metrics_resp,
            simulation=sim_result,
            visualization=visualization,
            execution_time_ms=total_time_ms
        )

circuit_run_service = CircuitRunService()

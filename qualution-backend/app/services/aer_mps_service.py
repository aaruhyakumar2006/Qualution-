import re
import time
from typing import Dict, Any, List, Optional
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from app.schemas.canonical import CanonicalCircuitInput, UnifiedExecutionResultResponse

# Production default bond-dimension setting (chi=32)
DEFAULT_MAX_BOND_DIMENSION: int = 32

class AerMpsService:
    """
    Qiskit Aer Matrix Product State (MPS) simulation service.
    Configured with production bond-dimension setting (chi=32) by default.
    """
    def __init__(self, default_max_bond_dimension: int = DEFAULT_MAX_BOND_DIMENSION):
        self.default_max_bond_dimension = default_max_bond_dimension
        self._default_simulator = AerSimulator(
            method="matrix_product_state",
            mps_log_data=True,
            matrix_product_state_max_bond_dimension=self.default_max_bond_dimension
        )
        self._last_log_len = 0

    def to_qiskit_circuit(self, circuit: CanonicalCircuitInput) -> QuantumCircuit:
        n_qubits = circuit.qubits
        n_clbits = circuit.classical_bits

        if n_clbits is None:
            if circuit.measurements and len(circuit.measurements) > 0:
                n_clbits = max(m.classical_bit for m in circuit.measurements) + 1
            else:
                n_clbits = n_qubits

        qc = QuantumCircuit(n_qubits, n_clbits)

        for g in circuit.gates:
            raw_name = (g.type or g.gate or "").strip().lower()
            targets = g.targets
            angle = g.angle

            if not targets:
                continue

            if raw_name in ("h", "hadamard"):
                qc.h(targets[0])
            elif raw_name in ("x", "not"):
                qc.x(targets[0])
            elif raw_name in ("y",):
                qc.y(targets[0])
            elif raw_name in ("z",):
                qc.z(targets[0])
            elif raw_name in ("s",):
                qc.s(targets[0])
            elif raw_name in ("sdg", "s_dagger", "sdag"):
                qc.sdg(targets[0])
            elif raw_name in ("t",):
                qc.t(targets[0])
            elif raw_name in ("tdg", "t_dagger", "tdag"):
                qc.tdg(targets[0])
            elif raw_name in ("rx",):
                qc.rx(angle if angle is not None else 0.0, targets[0])
            elif raw_name in ("ry",):
                qc.ry(angle if angle is not None else 0.0, targets[0])
            elif raw_name in ("rz", "p", "phase"):
                qc.rz(angle if angle is not None else 0.0, targets[0])
            elif raw_name in ("cx", "cnot"):
                if len(targets) >= 2:
                    qc.cx(targets[0], targets[1])
            elif raw_name in ("cz",):
                if len(targets) >= 2:
                    qc.cz(targets[0], targets[1])
            elif raw_name in ("swap",):
                if len(targets) >= 2:
                    qc.swap(targets[0], targets[1])
            elif raw_name in ("ccx", "toffoli"):
                if len(targets) >= 3:
                    qc.ccx(targets[0], targets[1], targets[2])
            elif raw_name in ("id", "i"):
                qc.id(targets[0])
            elif raw_name in ("measure",):
                pass

        # Apply measurements
        if circuit.measurements and len(circuit.measurements) > 0:
            for m in circuit.measurements:
                if m.qubit < n_qubits and m.classical_bit < n_clbits:
                    qc.measure(m.qubit, m.classical_bit)
        elif circuit.measure is not False:
            # By default apply measurements to all qubits
            num_to_measure = min(n_qubits, n_clbits)
            for i in range(num_to_measure):
                qc.measure(i, i)

        return qc

    def simulate(self, circuit: CanonicalCircuitInput) -> UnifiedExecutionResultResponse:

        qc = self.to_qiskit_circuit(circuit)
        shots = circuit.shots or 1024

        effective_max_bond_dimension = (
            circuit.max_bond_dimension
            if circuit.max_bond_dimension is not None
            else self.default_max_bond_dimension
        )

        sim_kwargs: Dict[str, Any] = {
            "method": "matrix_product_state",
            "mps_log_data": True,
            "matrix_product_state_max_bond_dimension": effective_max_bond_dimension,
            "max_parallel_threads": 1,
            "max_parallel_experiments": 1,
        }
        if circuit.truncation_threshold is not None:
            sim_kwargs["matrix_product_state_truncation_threshold"] = circuit.truncation_threshold

        simulator = AerSimulator(**sim_kwargs)

        t_start = time.perf_counter()
        job = simulator.run(qc, shots=shots)
        result = job.result()
        t_end = time.perf_counter()

        runtime_ms = round((t_end - t_start) * 1000, 2)
        if runtime_ms == 0.0:
            runtime_ms = round((t_end - t_start) * 1000, 4)

        result_item = result.results[0]
        meta = result_item.metadata if hasattr(result_item, "metadata") and result_item.metadata else {}
        raw_log = meta.get("MPS_log_data", "") or ""

        # Extract delta log data corresponding to this simulation run only
        # Aer overwrites the trailing ' }' (2-5 characters) on subsequent instruction logs
        slice_offset = max(0, self._last_log_len - 5) if len(raw_log) >= self._last_log_len else 0
        current_log = raw_log[slice_offset:]
        self._last_log_len = len(raw_log)


        # Parse real discarded singular value weights from Aer C++ output for this run
        discarded_values = [float(x) for x in re.findall(r"discarded_value=([0-9.eE+-]+)", current_log)]
        truncation_error = sum(discarded_values)
        fidelity = max(0.0, round(1.0 - truncation_error, 8))

        # Parse real bond dimensions along the 1D chain for this run
        bd_matches = re.findall(r"BD=\[([0-9\s]+)\]", current_log)
        bond_dims: List[int] = []
        max_bond_dim = 1
        for bd_str in bd_matches:
            parsed = [int(x) for x in bd_str.split() if x.strip()]
            if parsed:
                max_bond_dim = max(max_bond_dim, max(parsed))
                bond_dims.extend(parsed)


        # Retrieve outcome counts
        raw_counts = result.get_counts(qc)
        counts: Dict[str, int] = {}
        if isinstance(raw_counts, dict):
            counts = {str(k): int(v) for k, v in raw_counts.items()}

        total_shots = sum(counts.values()) or shots
        probabilities = {k: v / total_shots for k, v in counts.items()}

        warnings_list: List[str] = []
        is_approx = truncation_error > 0.0 or (circuit.max_bond_dimension is not None and max_bond_dim >= circuit.max_bond_dimension)
        if is_approx:
            warnings_list.append(
                f"MPS simulation truncated state: cumulative error {truncation_error:.6e}, estimated fidelity {fidelity:.6f}."
            )

        two_qubit_count = sum(
            1 for g in circuit.gates if (g.type or g.gate or "").lower() in ("cx", "cz", "swap", "cnot")
        )

        routing_reason = (
            f"Executed on Qiskit Aer Matrix Product State (MPS) simulator across {circuit.qubits} qubits "
            f"with {two_qubit_count} entangling gates. Max bond dimension: {max_bond_dim}, "
            f"truncation error: {truncation_error:.6e}, fidelity: {fidelity:.6f}."
        )

        return UnifiedExecutionResultResponse(
            backend="qiskit_aer_mps",
            execution_location="local_python",
            execution_method="mps",
            qubit_count=circuit.qubits,
            shots=shots,
            counts=counts,
            probabilities=probabilities,
            runtime_ms=runtime_ms,
            approximation=is_approx,
            fidelity=fidelity,
            truncation_error=round(truncation_error, 8),
            resource_estimate={
                "method": "matrix_product_state",
                "max_bond_dimension": max_bond_dim,
                "bond_dimensions": bond_dims[:30],  # bounded telemetry size
                "required_memory_mb": meta.get("required_memory_mb", 0),
                "device": meta.get("device", "CPU"),
            },
            warnings=warnings_list if warnings_list else None,
            routing_reason=routing_reason,
        )

aer_mps_service = AerMpsService()

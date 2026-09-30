from qiskit.quantum_info import Operator
from app.schemas.circuit import CircuitRequest
from app.services.qiskit_service import to_qiskit_circuit
from app.core.config import settings

class CorrectnessVerifier:
    @staticmethod
    def verify_equivalence(original: CircuitRequest, optimized: CircuitRequest) -> bool:
        """
        Formally verify that the optimized unitary circuit is mathematically equivalent
        to the original circuit up to a global phase.
        """
        # Both must have the same number of qubits
        if original.qubits != optimized.qubits:
            return False

        # Guard against exponential matrix allocation on large circuits
        if original.qubits > settings.MAX_OPTIMIZATION_QUBITS:
            raise ValueError(
                f"Circuit ({original.qubits} qubits) exceeds maximum formal verification limit "
                f"({settings.MAX_OPTIMIZATION_QUBITS} qubits)."
            )

        # Filter out non-unitary operations for formal unitary matrix equivalence check
        non_unitary = {"measure", "reset", "barrier", "control", "if", "for", "while", "box", "phase_disk", "custom"}
        unitary_gates_orig = [g for g in original.gates if g.gate.lower() not in non_unitary]
        unitary_gates_opt = [g for g in optimized.gates if g.gate.lower() not in non_unitary]

        orig_no_measure = original.model_copy(update={"measure": False, "gates": unitary_gates_orig})
        opt_no_measure = optimized.model_copy(update={"measure": False, "gates": unitary_gates_opt})

        qc_orig = to_qiskit_circuit(orig_no_measure)
        qc_opt = to_qiskit_circuit(opt_no_measure)

        # Compute quantum operators and check equivalence up to global phase
        op_orig = Operator(qc_orig)
        op_opt = Operator(qc_opt)

        return op_orig.equiv(op_opt, atol=1e-5)

correctness_verifier = CorrectnessVerifier()

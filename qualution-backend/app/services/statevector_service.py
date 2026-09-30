import time
import math
from typing import Dict, Any, List, Optional
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, partial_trace

from app.core.config import settings

class StatevectorService:
    @staticmethod
    def calculate_bloch_vectors(sv: Statevector, n_qubits: int) -> Dict[str, Dict[str, float]]:
        """
        Calculate the reduced density matrix for each individual qubit by tracing out all
        other qubits, then convert to its Bloch vector (x, y, z), purity, and magnitude.
        x = Tr(rho * sigma_x) = 2 * Re(rho_01)
        y = Tr(rho * sigma_y) = 2 * Im(rho_10) = -2 * Im(rho_01)
        z = Tr(rho * sigma_z) = rho_00 - rho_11
        purity = Tr(rho^2)
        magnitude = sqrt(x^2 + y^2 + z^2)
        """
        bloch_qubits: Dict[str, Dict[str, float]] = {}

        for q in range(n_qubits):
            # Trace out all qubits except qubit q
            traced_qubits = [i for i in range(n_qubits) if i != q]
            if traced_qubits:
                rho = partial_trace(sv, traced_qubits)
                rho_mat = np.asarray(rho.data)
            else:
                rho_mat = np.outer(sv.data, np.conjugate(sv.data))

            # Density matrix elements
            rho_00 = float(np.real(rho_mat[0, 0]))
            rho_11 = float(np.real(rho_mat[1, 1]))
            rho_01 = rho_mat[0, 1]

            x = 2.0 * float(np.real(rho_01))
            y = -2.0 * float(np.imag(rho_01))
            z = rho_00 - rho_11

            # Tolerance clamping around 0.0, 1.0, -1.0
            if abs(x) < 1e-7: x = 0.0
            if abs(y) < 1e-7: y = 0.0
            if abs(z) < 1e-7: z = 0.0

            magnitude = math.sqrt(x * x + y * y + z * z)
            purity = float(np.real(np.trace(rho_mat @ rho_mat)))

            bloch_qubits[str(q)] = {
                "x": round(x, 8),
                "y": round(y, 8),
                "z": round(z, 8),
                "purity": round(purity, 6),
                "magnitude": round(magnitude, 6),
            }

        return bloch_qubits

    def simulate_statevector(self, qc: QuantumCircuit) -> Dict[str, Any]:
        """
        Compute the exact statevector, basis state probabilities, single-qubit Bloch vector,
        and per-qubit reduced density matrix Bloch coordinates.
        """
        n_qubits = qc.num_qubits

        if n_qubits > settings.MAX_STATEVECTOR_QUBITS:
            req_gib = round((2**n_qubits * 16) / (1024**3), 2)
            raise ValueError(
                f"Statevector simulation is limited to {settings.MAX_STATEVECTOR_QUBITS} qubits "
                f"({n_qubits} qubits requires 2^{n_qubits} amplitudes = {req_gib} GiB RAM). "
                f"Please run in Shot-based simulation mode."
            )

        start_time = time.perf_counter()
        try:
            sv = Statevector.from_instruction(qc)
        except (MemoryError, Exception) as err:
            req_gib = round((2**n_qubits * 16) / (1024**3), 2)
            raise ValueError(
                f"Unable to allocate memory for statevector with {n_qubits} qubits "
                f"({req_gib} GiB RAM required). Please use Shot-based simulation."
            )
        end_time = time.perf_counter()

        execution_time_ms = round((end_time - start_time) * 1000, 2)
        amplitudes = np.asarray(sv.data)

        # Validate normalization and re-normalize if needed
        norm = float(np.sum(np.abs(amplitudes) ** 2))
        if norm > 0 and not np.isclose(norm, 1.0, atol=1e-4):
            amplitudes = amplitudes / np.sqrt(norm)

        # JSON-safe complex representation
        statevector_list = [
            {"real": round(float(c.real), 8), "imag": round(float(c.imag), 8)}
            for c in amplitudes
        ]

        # Computational basis probabilities (Qiskit bit ordering: q_{n-1}...q_0)
        probabilities: Dict[str, float] = {}
        for i in range(2**n_qubits):
            bitstring = format(i, f"0{n_qubits}b")
            prob = float(np.abs(amplitudes[i]) ** 2)
            probabilities[bitstring] = round(prob, 8)

        # Per-qubit Bloch vectors
        bloch_qubits = self.calculate_bloch_vectors(sv, n_qubits)

        # Legacy single-qubit bloch field: exact {x, y, z} dictionary for backward compatibility
        bloch: Optional[Dict[str, float]] = None
        if n_qubits == 1 and "0" in bloch_qubits:
            b0 = bloch_qubits["0"]
            bloch = {"x": b0["x"], "y": b0["y"], "z": b0["z"]}

        return {
            "backend": "qiskit_aer_statevector",
            "qubits": n_qubits,
            "statevector": statevector_list,
            "probabilities": probabilities,
            "bloch": bloch,
            "bloch_qubits": bloch_qubits,
            "execution_time_ms": execution_time_ms,
        }

statevector_service = StatevectorService()

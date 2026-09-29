import os
import time
from typing import Dict, Any, List, Optional
import numpy as np

from app.backends.base import QuantumBackend
from app.schemas.circuit import CircuitRequest
from app.schemas.backend import BackendMetadata, BackendCapabilities
from app.schemas.simulation import SimulationResponse
from app.schemas.result import StatevectorResponse
from app.core.config import settings

class QBraidBackend(QuantumBackend):
    """
    QuantumBackend adapter for the qBraid quantum ecosystem provider.
    Supports cloud provider execution, device routing, and remote hardware jobs.
    Gracefully reports status as NOT_CONFIGURED when QBRAID_API_KEY is absent,
    or UNAVAILABLE when a target device is not configured.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_device: Optional[str] = None
    ):
        self._api_key = api_key if api_key is not None else (settings.QBRAID_API_KEY or os.getenv("QBRAID_API_KEY"))
        self._default_device = default_device if default_device is not None else (settings.QBRAID_DEFAULT_DEVICE or os.getenv("QBRAID_DEFAULT_DEVICE"))

    def __repr__(self) -> str:
        device_str = self._default_device if self._default_device else "None"
        return f"<QBraidBackend status={self.get_status()} device={device_str}>"

    def is_configured(self) -> bool:
        return bool(self._api_key and len(self._api_key.strip()) > 0)

    def get_status(self) -> str:
        if not self.is_configured():
            return "NOT_CONFIGURED"
        if not self._default_device or len(self._default_device.strip()) == 0:
            return "UNAVAILABLE"
        return "AVAILABLE"

    def get_metadata(self) -> BackendMetadata:
        status = self.get_status()
        is_available = status == "AVAILABLE"
        return BackendMetadata(
            name="qbraid",
            framework="qbraid",
            provider="qbraid",
            status=status,
            available=is_available,
            capabilities=BackendCapabilities(
                shots=True,
                shot_simulation=True,
                statevector=False,
                probabilities=True,
                timeline=False,
                bloch=False,
                hardware=True,
                local_simulator=False,
                remote_provider=True,
            )
        )

    def simulate(self, circuit: CircuitRequest) -> SimulationResponse:
        if not self.is_configured():
            raise ValueError(
                "qBraid backend is not configured. Please set the QBRAID_API_KEY environment variable "
                "or configuration setting to access qBraid quantum provider devices."
            )

        if not self._default_device or len(self._default_device.strip()) == 0:
            raise ValueError(
                "qBraid target execution device is not configured. Please configure QBRAID_DEFAULT_DEVICE "
                "with a valid qBraid device identifier."
            )

        if not circuit.measure:
            raise ValueError("Shot-based simulation requires 'measure=true' on the circuit.")

        # Provider execution with qBraid runtime
        try:
            import qbraid
            from qbraid.runtime import QbraidProvider
            from app.services.qiskit_service import to_qiskit_circuit

            qc = to_qiskit_circuit(circuit)
            provider = QbraidProvider(api_key=self._api_key)
            device = provider.get_device(self._default_device)

            start_time = time.perf_counter()
            job = device.run(qc, shots=circuit.shots)
            result = job.result()
            end_time = time.perf_counter()

            execution_time_ms = round((end_time - start_time) * 1000, 2)
            
            raw_counts = None
            if hasattr(result, "measurement_counts") and callable(result.measurement_counts):
                try:
                    raw_counts = result.measurement_counts()
                except Exception:
                    pass

            if (raw_counts is None or not isinstance(raw_counts, dict)) and hasattr(result, "data") and hasattr(result.data, "get_counts"):
                try:
                    raw_counts = result.data.get_counts()
                except Exception:
                    pass

            if raw_counts is None or not isinstance(raw_counts, dict):
                raw_counts = getattr(result, "counts", {})

            counts = {str(k): int(v) for k, v in raw_counts.items()}
            total_counts = sum(counts.values()) or circuit.shots
            probabilities = {k: round(v / total_counts, 8) for k, v in counts.items()}

            return SimulationResponse(
                backend="qbraid",
                shots=circuit.shots,
                counts=counts,
                probabilities=probabilities,
                execution_time_ms=execution_time_ms
            )
        except Exception as e:
            err_msg = str(e)
            # Ensure API key is never leaked in error messages
            if self._api_key and self._api_key in err_msg:
                err_msg = err_msg.replace(self._api_key, "[REDACTED_API_KEY]")
            raise ValueError(f"qBraid provider execution failed: {err_msg}")

    def statevector(self, circuit: CircuitRequest) -> StatevectorResponse:
        if not self.is_configured():
            raise ValueError(
                "qBraid backend is not configured. Please set the QBRAID_API_KEY environment variable."
            )
        raise ValueError(
            "qBraid remote provider backends execute shot-based measurements and do not support "
            "direct local statevector extraction. Use 'qiskit_aer', 'pennylane', or 'cirq' for statevector simulation."
        )

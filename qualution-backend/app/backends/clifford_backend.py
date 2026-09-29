from app.backends.base import QuantumBackend
from app.schemas.circuit import CircuitRequest
from app.schemas.backend import BackendMetadata, BackendCapabilities
from app.schemas.simulation import SimulationResponse
from app.schemas.result import StatevectorResponse
from app.services.qiskit_service import to_qiskit_circuit, transpile_circuit, get_transpiled_instructions
from app.services.aer_service import aer_service

class CliffordStabilizerBackend(QuantumBackend):
    """
    Dedicated Aaronson-Gottesman stabilizer tableau backend.
    Simulates Clifford circuits polynomial-time O(N^2) under 1 MB of memory.
    """
    def __init__(self, backend_id: str = "clifford_stabilizer"):
        self.backend_id = backend_id

    def get_metadata(self) -> BackendMetadata:
        return BackendMetadata(
            name=self.backend_id,
            framework="qiskit_stabilizer",
            provider="local",
            status="AVAILABLE",
            available=True,
            capabilities=BackendCapabilities(
                shots=True,
                shot_simulation=True,
                statevector=False,
                probabilities=True,
                timeline=True,
                bloch=False,
                hardware=False,
                local_simulator=True,
                remote_provider=False,
            )
        )

    def simulate(self, circuit: CircuitRequest) -> SimulationResponse:
        if not circuit.measure:
            circuit = circuit.model_copy(update={
                "measure": True,
                "classical_bits": max(circuit.classical_bits, circuit.qubits)
            })

        qc = to_qiskit_circuit(circuit)

        transpiled_instructions = None
        if circuit.topology and circuit.topology != "None (Ideal)":
            qc = transpile_circuit(qc, circuit.topology)
            transpiled_instructions = get_transpiled_instructions(qc)

        result = aer_service.simulate_stabilizer(qc, shots=circuit.shots)

        return SimulationResponse(
            **result,
            transpiled_instructions=transpiled_instructions
        )

    def statevector(self, circuit: CircuitRequest) -> StatevectorResponse:
        raise ValueError(
            "Clifford Stabilizer backend operates on Aaronson-Gottesman tableaus under 1 MB of RAM "
            "and does not allocate dense exponential statevectors."
        )

from app.backends.base import QuantumBackend
from app.schemas.circuit import CircuitRequest
from app.schemas.backend import BackendMetadata, BackendCapabilities
from app.schemas.simulation import SimulationResponse
from app.schemas.result import StatevectorResponse
from app.services.aer_mps_service import aer_mps_service
from app.schemas.canonical import CanonicalCircuitInput, CanonicalGateInput, CanonicalMeasurementInput

class QiskitMPSBackend(QuantumBackend):
    """
    Qiskit Aer Matrix Product State (MPS) backend for low-entanglement circuits.
    Efficient simulation of circuits with sparse entanglement structure.
    """
    def __init__(self, backend_id: str = "qiskit_aer_mps"):
        self.backend_id = backend_id

    def get_metadata(self) -> BackendMetadata:
        return BackendMetadata(
            name=self.backend_id,
            framework="qiskit_mps",
            provider="local",
            status="AVAILABLE",
            available=True,
            capabilities=BackendCapabilities(
                shots=True,
                shot_simulation=True,
                statevector=False,
                probabilities=True,
                timeline=False,
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

        # Convert to canonical format
        canonical_gates = []
        for g in circuit.gates:
            canonical_gates.append(CanonicalGateInput(
                type=g.gate,
                gate=g.gate,
                targets=g.targets,
                angle=g.angle
            ))

        measurements = []
        if circuit.measure:
            # Measure all qubits
            for i in range(min(circuit.qubits, circuit.classical_bits)):
                measurements.append(CanonicalMeasurementInput(qubit=i, classical_bit=i))

        canonical_circuit = CanonicalCircuitInput(
            qubits=circuit.qubits,
            classical_bits=circuit.classical_bits,
            gates=canonical_gates,
            measurements=measurements,
            measure=circuit.measure,
            shots=circuit.shots,
            max_bond_dimension=None,  # Use default (32)
            truncation_threshold=None
        )

        result = aer_mps_service.simulate(canonical_circuit)

        counts: Dict[str, int] = result.counts if result.counts is not None else {}
        probabilities: Dict[str, float] = result.probabilities if result.probabilities is not None else {}

        return SimulationResponse(
            backend=self.backend_id,
            shots=result.shots,
            counts=counts,
            probabilities=probabilities,
            execution_time_ms=result.runtime_ms
        )

    def statevector(self, circuit: CircuitRequest) -> StatevectorResponse:
        raise ValueError(
            "MPS backend uses truncated tensor network representations and does not "
            "provide full statevector output. Use shots mode for measurement statistics."
        )

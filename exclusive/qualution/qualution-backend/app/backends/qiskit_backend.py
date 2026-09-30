from app.backends.base import QuantumBackend
from app.schemas.circuit import CircuitRequest
from app.schemas.backend import BackendMetadata, BackendCapabilities
from app.schemas.simulation import SimulationResponse
from app.schemas.result import StatevectorResponse
from app.services.qiskit_service import to_qiskit_circuit, transpile_circuit, get_transpiled_instructions
from app.services.aer_service import aer_service
from app.services.statevector_service import statevector_service

class QiskitAerBackend(QuantumBackend):
    def get_metadata(self) -> BackendMetadata:
        return BackendMetadata(
            name="qiskit_aer",
            framework="qiskit",
            provider="local",
            status="AVAILABLE",
            available=True,
            capabilities=BackendCapabilities(
                shots=True,
                shot_simulation=True,
                statevector=True,
                probabilities=True,
                timeline=True,
                bloch=True,
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
        CLIFFORD_GATES = {"h", "x", "y", "z", "s", "sdg", "s_dagger", "sdag", "cx", "cz", "swap", "id", "i", "measure", "barrier", "reset"}
        is_clifford = all(g.gate.lower() in CLIFFORD_GATES for g in circuit.gates) if circuit.gates else True

        if is_clifford:
            result = aer_service.simulate_stabilizer(qc, shots=circuit.shots, backend_name="qiskit_aer")
        else:
            result = aer_service.simulate(qc, shots=circuit.shots, backend_name="qiskit_aer")
        
        return SimulationResponse(
            **result,
            transpiled_instructions=transpiled_instructions
        )

    def statevector(self, circuit: CircuitRequest) -> StatevectorResponse:
        circuit_no_measure = circuit.model_copy(update={"measure": False})
        qc = to_qiskit_circuit(circuit_no_measure)
        result = statevector_service.simulate_statevector(qc)
        return StatevectorResponse(**result)


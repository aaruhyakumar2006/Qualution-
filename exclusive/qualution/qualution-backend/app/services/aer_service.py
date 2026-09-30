import time
from typing import Dict, Any
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

class AerSimulationService:
    def __init__(self):
        self.simulator = AerSimulator()
        self.stabilizer_simulator = AerSimulator(method="stabilizer")

    def simulate(self, circuit: QuantumCircuit, shots: int = 1024, method: str = "automatic", backend_name: str = "qiskit_aer") -> Dict[str, Any]:
        """
        Execute a Qiskit QuantumCircuit using Qiskit Aer ideal simulator.
        """
        has_measurements = any(instruction.operation.name == "measure" for instruction in circuit.data)
        if not has_measurements:
            raise ValueError("Circuit contains no measurements. Shot-based simulation requires measurements.")

        sim = self.stabilizer_simulator if method == "stabilizer" else self.simulator
        start_time = time.perf_counter()
        job = sim.run(circuit, shots=shots)
        result = job.result()
        end_time = time.perf_counter()

        execution_time_ms = round((end_time - start_time) * 1000, 2)
        raw_counts = result.get_counts(circuit)

        counts: Dict[str, int] = {}
        if isinstance(raw_counts, dict):
            counts = {str(k): int(v) for k, v in raw_counts.items()}

        total_counts = sum(counts.values()) or shots
        probabilities = {k: v / total_counts for k, v in counts.items()}

        return {
            "backend": backend_name,
            "shots": shots,
            "counts": counts,
            "probabilities": probabilities,
            "execution_time_ms": execution_time_ms
        }

    def simulate_stabilizer(self, circuit: QuantumCircuit, shots: int = 1024, backend_name: str = "clifford_stabilizer") -> Dict[str, Any]:
        """
        Execute Clifford circuit using Qiskit Aer Stabilizer method (Aaronson-Gottesman tableau).
        Consumes < 1 MB memory for 28, 50, 100+ qubits.
        """
        return self.simulate(circuit, shots=shots, method="stabilizer", backend_name=backend_name)


aer_service = AerSimulationService()


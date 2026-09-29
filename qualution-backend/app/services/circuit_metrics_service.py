from typing import Dict, Any, Set
from app.schemas.circuit import CircuitRequest
from app.schemas.metrics import MemoryClass
from app.services.qiskit_service import to_qiskit_circuit

SINGLE_QUBIT_GATES = {"h", "x", "y", "z", "s", "t", "rx", "ry", "rz", "p", "id", "sdg", "tdg", "sx"}
TWO_QUBIT_GATES = {"cx", "cz", "swap", "cp", "crx", "cry", "crz", "ch"}
ROTATION_GATES = {"rx", "ry", "rz", "p", "cp", "crx", "cry", "crz"}
CLIFFORD_GATES = {"h", "x", "y", "z", "s", "sdg", "s_dagger", "sdag", "cx", "cz", "swap", "id", "i", "measure", "barrier", "reset"}

# Entanglement estimation thresholds
ENTANGLEMENT_LOW_THRESHOLD = 0.3  # <30% two-qubit gate ratio = low entanglement
ENTANGLEMENT_HIGH_THRESHOLD = 0.6  # >60% two-qubit gate ratio = high entanglement

class CircuitMetricsService:
    @staticmethod
    def classify_memory(memory_mb: float) -> MemoryClass:
        if memory_mb < 256.0:
            return "small"
        elif memory_mb < 2048.0:
            return "moderate"
        elif memory_mb < 8192.0:
            return "large"
        else:
            return "very_large"

    def analyze_circuit(self, circuit: CircuitRequest) -> Dict[str, Any]:
        """
        Compute circuit metrics, depth, and theoretical memory footprints (statevector & stabilizer)
        without allocating statevectors or executing simulation.
        """
        # Convert to Qiskit QuantumCircuit to calculate quantum gate depth accurately (excluding measurements)
        depth = 0
        try:
            qc = to_qiskit_circuit(circuit)
            depth = qc.depth(filter_function=lambda inst: inst.operation.name != "measure")
        except Exception:
            depth = len(circuit.gates)

        single_q_count = 0
        two_q_count = 0
        rotation_count = 0
        used_qubits: Set[int] = set()

        for gate in circuit.gates:
            name = gate.gate.lower()
            if name in SINGLE_QUBIT_GATES:
                single_q_count += 1
            if name in TWO_QUBIT_GATES:
                two_q_count += 1
            if name in ROTATION_GATES:
                rotation_count += 1

            for target in gate.targets:
                used_qubits.add(target)

        gate_count = single_q_count + two_q_count
        two_q_ratio = round(two_q_count / gate_count, 4) if gate_count > 0 else 0.0

        measurement_count = 0
        if circuit.measure and circuit.classical_bits > 0:
            measurement_count = min(circuit.qubits, circuit.classical_bits)

        max_qubit_idx = max(used_qubits) if used_qubits else None
        unique_qubits_count = len(used_qubits)

        # Check Clifford compatibility (Gottesman-Knill theorem)
        is_clifford = all(g.gate.lower() in CLIFFORD_GATES for g in circuit.gates) if circuit.gates else True

        # Statevector memory estimation: 2^n amplitudes * 16 bytes/amplitude
        n_qubits = circuit.qubits
        amplitudes = 2 ** n_qubits if n_qubits <= 1000 else 2 ** 1000
        memory_bytes = amplitudes * 16
        try:
            memory_mb = float(memory_bytes // (1024 * 1024))
        except (OverflowError, ValueError):
            memory_mb = 1e300
        try:
            memory_gb = float(memory_bytes // (1024 * 1024 * 1024))
        except (OverflowError, ValueError):
            memory_gb = 1e300

        # Aaronson-Gottesman stabilizer tableau memory: (2n+1)^2 bits / 8 + metadata overhead
        tableau_dim = 2 * n_qubits + 1
        stabilizer_memory_bytes = (tableau_dim * tableau_dim) // 8 + 1024

        memory_class = self.classify_memory(memory_mb)

        # Entanglement estimation based on two-qubit gate ratio
        entanglement_level = "none"
        if two_q_count == 0:
            entanglement_level = "none"
        elif two_q_ratio < ENTANGLEMENT_LOW_THRESHOLD:
            entanglement_level = "low"
        elif two_q_ratio < ENTANGLEMENT_HIGH_THRESHOLD:
            entanglement_level = "moderate"
        else:
            entanglement_level = "high"

        # Intelligent backend recommendation
        if is_clifford:
            recommended_method = "stabilizer"
        elif entanglement_level in ("none", "low"):
            recommended_method = "mps" if n_qubits > 16 else "statevector"
        elif entanglement_level == "moderate":
            recommended_method = "mps" if n_qubits > 12 else "statevector"
        else:  # high entanglement
            if n_qubits > 20:
                recommended_method = "qbraid_cloud"
            elif n_qubits > 16:
                recommended_method = "mps"
            else:
                recommended_method = "statevector"

        return {
            "qubit_count": n_qubits,
            "classical_bit_count": circuit.classical_bits,
            "gate_count": gate_count,
            "depth": depth,
            "single_qubit_gate_count": single_q_count,
            "two_qubit_gate_count": two_q_count,
            "rotation_gate_count": rotation_count,
            "measurement_count": measurement_count,
            "max_qubit_index": max_qubit_idx,
            "unique_qubits_used": unique_qubits_count,
            "two_qubit_gate_ratio": two_q_ratio,
            "statevector_amplitudes": amplitudes,
            "statevector_memory_bytes": memory_bytes,
            "statevector_memory_mb": round(memory_mb, 6),
            "statevector_memory_gb": round(memory_gb, 8),
            "simulation_memory_class": memory_class,
            "is_clifford": is_clifford,
            "stabilizer_memory_bytes": stabilizer_memory_bytes,
            "recommended_simulation_method": recommended_method,
            "entanglement_level": entanglement_level,
        }

circuit_metrics_service = CircuitMetricsService()


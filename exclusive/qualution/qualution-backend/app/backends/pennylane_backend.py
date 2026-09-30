import time
from typing import Dict, Any, List, Optional
import numpy as np
import pennylane as qml
from app.backends.base import QuantumBackend
from app.schemas.circuit import CircuitRequest
from app.schemas.backend import BackendMetadata, BackendCapabilities
from app.schemas.simulation import SimulationResponse
from app.schemas.result import StatevectorResponse, ComplexNumber, BlochVector

class PennyLaneBackend(QuantumBackend):
    def get_metadata(self) -> BackendMetadata:
        return BackendMetadata(
            name="pennylane",
            framework="pennylane",
            provider="local",
            status="AVAILABLE",
            available=True,
            capabilities=BackendCapabilities(
                shots=True,
                shot_simulation=True,
                statevector=True,
                probabilities=True,
                timeline=False,
                bloch=True,
                hardware=False,
                local_simulator=True,
                remote_provider=False,
            )
        )

    def _apply_gates(self, gates, n_qubits: int):
        def w(target: int) -> int:
            return n_qubits - 1 - target

        for gate_req in gates:
            gate_name = gate_req.gate.lower()
            targets = gate_req.targets
            angle = gate_req.angle

            if gate_name == "h":
                qml.Hadamard(wires=w(targets[0]))
            elif gate_name == "x":
                qml.PauliX(wires=w(targets[0]))
            elif gate_name == "y":
                qml.PauliY(wires=w(targets[0]))
            elif gate_name == "z":
                qml.PauliZ(wires=w(targets[0]))
            elif gate_name == "s":
                qml.S(wires=w(targets[0]))
            elif gate_name == "t":
                qml.T(wires=w(targets[0]))
            elif gate_name == "rx":
                if angle is None:
                    raise ValueError("Gate rx requires an angle")
                qml.RX(angle, wires=w(targets[0]))
            elif gate_name == "ry":
                if angle is None:
                    raise ValueError("Gate ry requires an angle")
                qml.RY(angle, wires=w(targets[0]))
            elif gate_name == "rz":
                if angle is None:
                    raise ValueError("Gate rz requires an angle")
                qml.RZ(angle, wires=w(targets[0]))
            elif gate_name == "cx":
                qml.CNOT(wires=[w(targets[0]), w(targets[1])])
            elif gate_name == "cz":
                qml.CZ(wires=[w(targets[0]), w(targets[1])])
            elif gate_name == "swap":
                qml.SWAP(wires=[w(targets[0]), w(targets[1])])
            else:
                raise ValueError(f"Unsupported PennyLane gate: {gate_name}")

    def simulate(self, circuit: CircuitRequest) -> SimulationResponse:
        if not circuit.measure:
            raise ValueError("Shot-based simulation requires 'measure=true' on the circuit.")

        n_qubits = circuit.qubits
        shots = circuit.shots
        dev = qml.device("default.qubit", wires=n_qubits)

        @qml.qnode(dev, shots=shots)
        def qnode_circuit():
            self._apply_gates(circuit.gates, n_qubits)
            return qml.counts()

        start_time = time.perf_counter()
        raw_counts = qnode_circuit()
        end_time = time.perf_counter()

        execution_time_ms = round((end_time - start_time) * 1000, 2)

        counts: Dict[str, int] = {}
        for k, v in raw_counts.items():
            counts[str(k)] = int(v)

        total_counts = sum(counts.values()) or shots
        probabilities = {k: v / total_counts for k, v in counts.items()}

        return SimulationResponse(
            backend="pennylane",
            shots=shots,
            counts=counts,
            probabilities=probabilities,
            execution_time_ms=execution_time_ms
        )

    def statevector(self, circuit: CircuitRequest) -> StatevectorResponse:
        n_qubits = circuit.qubits
        dev = qml.device("default.qubit", wires=n_qubits)

        @qml.qnode(dev)
        def qnode_statevector():
            self._apply_gates(circuit.gates, n_qubits)
            return qml.state()

        start_time = time.perf_counter()
        raw_state = qnode_statevector()
        end_time = time.perf_counter()

        execution_time_ms = round((end_time - start_time) * 1000, 2)
        amplitudes = np.asarray(raw_state)

        # JSON-safe complex list
        statevector_list = [
            ComplexNumber(real=round(float(c.real), 8), imag=round(float(c.imag), 8))
            for c in amplitudes
        ]

        # Probabilities
        probabilities: Dict[str, float] = {}
        for i in range(2**n_qubits):
            bitstring = format(i, f"0{n_qubits}b")
            prob = float(np.abs(amplitudes[i]) ** 2)
            probabilities[bitstring] = round(prob, 8)

        # Single-qubit Bloch vector
        bloch: Optional[BlochVector] = None
        if n_qubits == 1:
            alpha = amplitudes[0]
            beta = amplitudes[1]
            alpha_star_beta = np.conjugate(alpha) * beta
            x = 2.0 * float(np.real(alpha_star_beta))
            y = 2.0 * float(np.imag(alpha_star_beta))
            z = float(np.abs(alpha) ** 2 - np.abs(beta) ** 2)
            bloch = BlochVector(x=round(x, 8), y=round(y, 8), z=round(z, 8))

        return StatevectorResponse(
            backend="pennylane",
            qubits=n_qubits,
            statevector=statevector_list,
            probabilities=probabilities,
            bloch=bloch,
            execution_time_ms=execution_time_ms
        )

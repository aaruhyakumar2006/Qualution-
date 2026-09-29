import time
from typing import Dict, Any, List, Optional
import numpy as np
import cirq

from app.backends.base import QuantumBackend
from app.schemas.circuit import CircuitRequest
from app.schemas.backend import BackendMetadata, BackendCapabilities
from app.schemas.simulation import SimulationResponse
from app.schemas.result import StatevectorResponse, ComplexNumber, BlochVector

class CirqBackend(QuantumBackend):
    def get_metadata(self) -> BackendMetadata:
        return BackendMetadata(
            name="cirq",
            framework="cirq",
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

    def _build_cirq_circuit(self, circuit: CircuitRequest) -> tuple[cirq.Circuit, List[cirq.LineQubit]]:
        qubits = [cirq.LineQubit(i) for i in range(circuit.qubits)]
        cirq_circuit = cirq.Circuit()

        for gate_req in circuit.gates:
            gate_name = gate_req.gate.lower()
            targets = gate_req.targets
            angle = gate_req.angle

            for t in targets:
                if t < 0 or t >= circuit.qubits:
                    raise ValueError(f"Target qubit index {t} out of range (0 to {circuit.qubits - 1})")

            if gate_name == "h":
                cirq_circuit.append(cirq.H(qubits[targets[0]]))
            elif gate_name == "x":
                cirq_circuit.append(cirq.X(qubits[targets[0]]))
            elif gate_name == "y":
                cirq_circuit.append(cirq.Y(qubits[targets[0]]))
            elif gate_name == "z":
                cirq_circuit.append(cirq.Z(qubits[targets[0]]))
            elif gate_name == "s":
                cirq_circuit.append(cirq.S(qubits[targets[0]]))
            elif gate_name == "t":
                cirq_circuit.append(cirq.T(qubits[targets[0]]))
            elif gate_name == "rx":
                if angle is None:
                    raise ValueError("Gate rx requires an angle")
                cirq_circuit.append(cirq.rx(angle)(qubits[targets[0]]))
            elif gate_name == "ry":
                if angle is None:
                    raise ValueError("Gate ry requires an angle")
                cirq_circuit.append(cirq.ry(angle)(qubits[targets[0]]))
            elif gate_name == "rz":
                if angle is None:
                    raise ValueError("Gate rz requires an angle")
                cirq_circuit.append(cirq.rz(angle)(qubits[targets[0]]))
            elif gate_name == "cx":
                if len(targets) < 2:
                    raise ValueError("Gate cx requires two target qubits: [control, target]")
                cirq_circuit.append(cirq.CNOT(qubits[targets[0]], qubits[targets[1]]))
            elif gate_name == "cz":
                if len(targets) < 2:
                    raise ValueError("Gate cz requires two target qubits")
                cirq_circuit.append(cirq.CZ(qubits[targets[0]], qubits[targets[1]]))
            elif gate_name == "swap":
                if len(targets) < 2:
                    raise ValueError("Gate swap requires two target qubits")
                cirq_circuit.append(cirq.SWAP(qubits[targets[0]], qubits[targets[1]]))
            else:
                raise ValueError(f"Unsupported Cirq gate: {gate_name}")

        return cirq_circuit, qubits

    def simulate(self, circuit: CircuitRequest) -> SimulationResponse:
        if not circuit.measure:
            raise ValueError("Shot-based simulation requires 'measure=true' on the circuit.")

        cirq_circuit, qubits = self._build_cirq_circuit(circuit)
        n_qubits = circuit.qubits
        shots = circuit.shots

        # Append individual measurements for bitstring reconstruction (q0, q1, ...)
        for i in range(n_qubits):
            cirq_circuit.append(cirq.measure(qubits[i], key=f"q{i}"))

        simulator = cirq.Simulator()

        start_time = time.perf_counter()
        result = simulator.run(cirq_circuit, repetitions=shots)
        end_time = time.perf_counter()

        execution_time_ms = round((end_time - start_time) * 1000, 2)

        # Build bitstrings as q_{n-1}...q_1 q_0 (standard Quantum Studio convention)
        counts: Dict[str, int] = {}
        for shot_idx in range(shots):
            bit_chars = [str(int(result.measurements[f"q{i}"][shot_idx][0])) for i in reversed(range(n_qubits))]
            bs = "".join(bit_chars)
            counts[bs] = counts.get(bs, 0) + 1

        total_counts = sum(counts.values()) or shots
        probabilities = {k: round(v / total_counts, 8) for k, v in counts.items()}

        return SimulationResponse(
            backend="cirq",
            shots=shots,
            counts=counts,
            probabilities=probabilities,
            execution_time_ms=execution_time_ms
        )

    def statevector(self, circuit: CircuitRequest) -> StatevectorResponse:
        cirq_circuit, qubits = self._build_cirq_circuit(circuit)
        n_qubits = circuit.qubits
        simulator = cirq.Simulator()

        # Reverse qubit order so basis index i directly maps to |q_{n-1}...q_0>
        qubit_order = [qubits[i] for i in reversed(range(n_qubits))]

        start_time = time.perf_counter()
        sim_result = simulator.simulate(cirq_circuit, qubit_order=qubit_order)
        end_time = time.perf_counter()

        execution_time_ms = round((end_time - start_time) * 1000, 2)
        raw_state = sim_result.state_vector()
        amplitudes = np.asarray(raw_state)

        # JSON-safe complex number representation
        statevector_list = [
            ComplexNumber(real=round(float(c.real), 8), imag=round(float(c.imag), 8))
            for c in amplitudes
        ]

        # Basis state probabilities
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
            backend="cirq",
            qubits=n_qubits,
            statevector=statevector_list,
            probabilities=probabilities,
            bloch=bloch,
            execution_time_ms=execution_time_ms
        )

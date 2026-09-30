import time
from typing import Dict, Any, List, Optional
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from app.schemas.circuit import CircuitRequest
from app.services.statevector_service import statevector_service

class TimelineService:
    @staticmethod
    def _extract_state_data(sv: Statevector, n_qubits: int) -> Dict[str, Any]:
        amplitudes = np.asarray(sv.data)

        # JSON-safe complex list
        sv_list = [
            {"real": round(float(c.real), 8), "imag": round(float(c.imag), 8)}
            for c in amplitudes
        ]

        # Probabilities with Qiskit basis ordering
        probabilities: Dict[str, float] = {}
        for i in range(2**n_qubits):
            bitstring = format(i, f"0{n_qubits}b")
            prob = float(np.abs(amplitudes[i]) ** 2)
            probabilities[bitstring] = round(prob, 8)

        # Per-qubit Bloch vectors
        bloch_qubits = statevector_service.calculate_bloch_vectors(sv, n_qubits)
        bloch = {"x": bloch_qubits["0"]["x"], "y": bloch_qubits["0"]["y"], "z": bloch_qubits["0"]["z"]} if (n_qubits == 1 and "0" in bloch_qubits) else None

        return {
            "statevector": sv_list,
            "probabilities": probabilities,
            "bloch": bloch,
            "bloch_qubits": bloch_qubits,
        }

    def generate_timeline(self, circuit: CircuitRequest) -> Dict[str, Any]:
        """
        Simulate the quantum state step-by-step after each gate operation.
        """
        n_qubits = circuit.qubits
        start_time = time.perf_counter()

        steps: List[Dict[str, Any]] = []

        # Step 0: Initial |0...0> state
        qc = QuantumCircuit(n_qubits)
        initial_sv = Statevector.from_instruction(qc)
        initial_data = self._extract_state_data(initial_sv, n_qubits)

        steps.append({
            "step": 0,
            "operation": "initial",
            "qubits": [],
            "parameters": None,
            "statevector": initial_data["statevector"],
            "probabilities": initial_data["probabilities"],
            "bloch": initial_data["bloch"],
            "bloch_qubits": initial_data["bloch_qubits"],
        })

        # Apply gates sequentially and record states
        for step_idx, gate in enumerate(circuit.gates, start=1):
            name = gate.gate.lower()
            raw_targets = gate.targets or []
            targets = [int(t) for t in raw_targets if isinstance(t, (int, float)) and 0 <= int(t) < n_qubits]
            angle = float(gate.angle) if gate.angle is not None else 0.0

            try:
                if name == "h":
                    if len(targets) >= 1: qc.h(targets[0])
                elif name == "x":
                    if len(targets) >= 1: qc.x(targets[0])
                elif name == "y":
                    if len(targets) >= 1: qc.y(targets[0])
                elif name == "z":
                    if len(targets) >= 1: qc.z(targets[0])
                elif name == "s":
                    if len(targets) >= 1: qc.s(targets[0])
                elif name == "t":
                    if len(targets) >= 1: qc.t(targets[0])
                elif name == "rx":
                    if len(targets) >= 1: qc.rx(angle, targets[0])
                elif name == "ry":
                    if len(targets) >= 1: qc.ry(angle, targets[0])
                elif name == "rz":
                    if len(targets) >= 1: qc.rz(angle, targets[0])
                elif name == "cx":
                    if len(targets) >= 2 and targets[0] != targets[1]: qc.cx(targets[0], targets[1])
                elif name == "cz":
                    if len(targets) >= 2 and targets[0] != targets[1]: qc.cz(targets[0], targets[1])
                elif name == "swap":
                    if len(targets) >= 2 and targets[0] != targets[1]: qc.swap(targets[0], targets[1])
                elif name == "ccx":
                    if len(targets) >= 3 and len(set(targets[:3])) == 3: qc.ccx(targets[0], targets[1], targets[2])
                elif name == "p":
                    if len(targets) >= 1: qc.p(angle, targets[0])
                elif name == "cp":
                    if len(targets) >= 2 and targets[0] != targets[1]: qc.cp(angle, targets[0], targets[1])
                elif name == "crx":
                    if len(targets) >= 2 and targets[0] != targets[1]: qc.crx(angle, targets[0], targets[1])
                elif name == "cry":
                    if len(targets) >= 2 and targets[0] != targets[1]: qc.cry(angle, targets[0], targets[1])
                elif name == "crz":
                    if len(targets) >= 2 and targets[0] != targets[1]: qc.crz(angle, targets[0], targets[1])
                elif name == "ch":
                    if len(targets) >= 2 and targets[0] != targets[1]: qc.ch(targets[0], targets[1])
                elif name == "tdg":
                    if len(targets) >= 1: qc.tdg(targets[0])
                elif name == "sdg":
                    if len(targets) >= 1: qc.sdg(targets[0])
                elif name == "sx":
                    if len(targets) >= 1: qc.sx(targets[0])
                elif name == "id":
                    if len(targets) >= 1:
                        try: qc.id(targets[0])
                        except AttributeError: qc.i(targets[0])
                elif name == "barrier" or name == "reset" or name == "measure":
                    pass
                else:
                    pass
            except Exception:
                pass

            sv = Statevector.from_instruction(qc)
            state_data = self._extract_state_data(sv, n_qubits)

            params = {"angle": angle} if angle is not None else None

            steps.append({
                "step": step_idx,
                "operation": name,
                "qubits": targets,
                "parameters": params,
                "statevector": state_data["statevector"],
                "probabilities": state_data["probabilities"],
                "bloch": state_data["bloch"],
                "bloch_qubits": state_data["bloch_qubits"],
            })

        end_time = time.perf_counter()
        execution_time_ms = round((end_time - start_time) * 1000, 2)

        return {
            "backend": "qiskit_statevector_timeline",
            "qubits": n_qubits,
            "total_steps": len(steps),
            "steps": steps,
            "execution_time_ms": execution_time_ms,
        }

timeline_service = TimelineService()

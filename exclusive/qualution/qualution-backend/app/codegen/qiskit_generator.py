from app.codegen.base import CodeGenerator
from app.schemas.circuit import CircuitRequest

class QiskitCodeGenerator(CodeGenerator):
    @property
    def framework(self) -> str:
        return "qiskit"

    def generate(self, circuit: CircuitRequest) -> str:
        lines = []

        if circuit.measure:
            lines.append("from qiskit import QuantumCircuit")
            lines.append("from qiskit_aer import AerSimulator")
        else:
            lines.append("from qiskit import QuantumCircuit")
            lines.append("from qiskit.quantum_info import Statevector")

        lines.append("")
        lines.append("# Initialize Quantum Circuit")
        if circuit.measure or circuit.classical_bits > 0:
            lines.append(f"qc = QuantumCircuit({circuit.qubits}, {circuit.classical_bits})")
        else:
            lines.append(f"qc = QuantumCircuit({circuit.qubits})")

        lines.append("")
        lines.append("# Apply Quantum Gates")
        for g in circuit.gates:
            name = g.gate.lower()
            targets = g.targets
            angle = g.angle

            if name == "h":
                lines.append(f"qc.h({targets[0]})")
            elif name == "x":
                lines.append(f"qc.x({targets[0]})")
            elif name == "y":
                lines.append(f"qc.y({targets[0]})")
            elif name == "z":
                lines.append(f"qc.z({targets[0]})")
            elif name == "s":
                lines.append(f"qc.s({targets[0]})")
            elif name == "t":
                lines.append(f"qc.t({targets[0]})")
            elif name == "rx":
                lines.append(f"qc.rx({repr(angle)}, {targets[0]})")
            elif name == "ry":
                lines.append(f"qc.ry({repr(angle)}, {targets[0]})")
            elif name == "rz":
                lines.append(f"qc.rz({repr(angle)}, {targets[0]})")
            elif name == "cx":
                lines.append(f"qc.cx({targets[0]}, {targets[1]})")
            elif name == "cz":
                lines.append(f"qc.cz({targets[0]}, {targets[1]})")
            elif name == "swap":
                lines.append(f"qc.swap({targets[0]}, {targets[1]})")
            elif name in ("ccx", "toffoli"):
                lines.append(f"qc.ccx({targets[0]}, {targets[1]}, {targets[2]})")
            elif name in ("p", "u1", "phase"):
                lines.append(f"qc.p({repr(angle)}, {targets[0]})")
            elif name == "cp":
                lines.append(f"qc.cp({repr(angle)}, {targets[0]}, {targets[1]})")
            elif name == "crx":
                lines.append(f"qc.crx({repr(angle)}, {targets[0]}, {targets[1]})")
            elif name == "cry":
                lines.append(f"qc.cry({repr(angle)}, {targets[0]}, {targets[1]})")
            elif name == "crz":
                lines.append(f"qc.crz({repr(angle)}, {targets[0]}, {targets[1]})")
            elif name == "ch":
                lines.append(f"qc.ch({targets[0]}, {targets[1]})")
            elif name in ("sdg", "s_dagger"):
                lines.append(f"qc.sdg({targets[0]})")
            elif name in ("tdg", "t_dagger"):
                lines.append(f"qc.tdg({targets[0]})")
            elif name == "sx":
                lines.append(f"qc.sx({targets[0]})")
            elif name == "id":
                lines.append(f"qc.id({targets[0]})")
            elif name == "reset":
                lines.append(f"qc.reset({targets[0]})")
            elif name == "barrier":
                lines.append("qc.barrier()")
            else:
                raise ValueError(f"Unsupported Qiskit gate: '{name}'")

        if circuit.measure:
            lines.append("")
            lines.append("# Measurement Operations")
            num_meas = min(circuit.qubits, circuit.classical_bits)
            for i in range(num_meas):
                lines.append(f"qc.measure({i}, {i})")

            lines.append("")
            lines.append("# Execute Simulation")
            lines.append("simulator = AerSimulator()")
            lines.append(f"job = simulator.run(qc, shots={circuit.shots})")
            lines.append("result = job.result()")
            lines.append("counts = result.get_counts()")
            lines.append('print("Measurement counts:", counts)')
        else:
            lines.append("")
            lines.append("# Compute Theoretical Statevector")
            lines.append("state = Statevector(qc)")
            lines.append("probabilities = state.probabilities_dict()")
            lines.append('print("State probabilities:", probabilities)')

        return "\n".join(lines) + "\n"
